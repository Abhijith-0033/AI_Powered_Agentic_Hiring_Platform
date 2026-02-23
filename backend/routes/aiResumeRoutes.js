
import express from 'express';
import { extractTextFromBuffer } from '../services/aiResumeService.js';
import { optimizeResumeWithGroq, analyzeMatchWithGroq } from '../services/groqService.js';
import { generateResumePDF } from '../services/pdfService.js';
import auth from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import pool from '../config/db.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Multer Setup (Memory Storage for parsing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Rate Limiting: 10 requests per hour per IP (adjusted for development)
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Rate limit exceeded. You can only optimize 10 resumes per hour.' }
});

/**
 * @route POST /api/ai/resume/optimize
 * @desc Optimize a resume using Groq API
 * @access Private
 */
router.post('/optimize', auth, limiter, upload.single('resumeFile'), async (req, res) => {
    try {
        const { jobId, useProfileResume, resumeText: rawText } = req.body;
        const userId = req.user.userId;

        // 1. Resolve Candidate ID
        const candidateRes = await pool.query('SELECT id, resume_pdf FROM candidates WHERE user_id = $1', [userId]);

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate profile not found. Please complete your profile first.' });
        }

        const candidate = candidateRes.rows[0];
        const candidateId = candidate.id;
        let finalResumeText = "";

        // 2. Determine Resume Source
        if (req.file) {
            finalResumeText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
        } else if (useProfileResume === 'true' || useProfileResume === true) {
            if (!candidate.resume_pdf) {
                return res.status(400).json({ error: 'No resume found in your profile to optimize.' });
            }

            try {
                let fileBuffer;
                let mimeType = 'application/pdf'; // Default to PDF

                if (typeof candidate.resume_pdf === 'string') {
                    // Check if it's a data URL or raw base64
                    const matches = candidate.resume_pdf.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches) {
                        mimeType = matches[1];
                        fileBuffer = Buffer.from(matches[2], 'base64');
                    } else {
                        // Raw base64
                        fileBuffer = Buffer.from(candidate.resume_pdf, 'base64');
                    }
                } else {
                    // It might be a direct Buffer if pg returns it that way (e.g. BYTEA)
                    fileBuffer = candidate.resume_pdf;
                }

                if (!fileBuffer || fileBuffer.length === 0) {
                    console.error('[OPTIMIZE_DEBUG] File buffer is empty for candidate:', candidate.id);
                    throw new Error('Retrieved resume content is empty.');
                }

                console.log(`[OPTIMIZE_DEBUG] Processing profile resume. Length: ${fileBuffer.length}, MimeType: ${mimeType}`);

                finalResumeText = await extractTextFromBuffer(fileBuffer, mimeType);
                console.log(`[OPTIMIZE_DEBUG] Extracted text length: ${finalResumeText?.length || 0}`);
            } catch (err) {
                console.error('[OPTIMIZE_DEBUG] Error processing profile resume:', err);
                return res.status(400).json({ error: `Failed to process your profile resume: ${err.message}` });
            }
        } else if (rawText && rawText.length >= 50) {
            finalResumeText = rawText;
        } else {
            return res.status(400).json({ error: 'Please upload a file, use your profile resume, or paste text.' });
        }

        if (!finalResumeText || finalResumeText.length < 50) {
            return res.status(400).json({ error: 'Could not extract valid text from the resume.' });
        }

        // 3. Fetch Job Context
        let jobData = {
            job_title: "General Role",
            required_skills: "None specified",
            preferred_skills: "None specified",
            min_experience: "N/A",
            required_education: "N/A",
            description: "General professional optimization requested."
        };

        if (jobId && jobId !== 'null' && jobId !== 'undefined') {
            const jobRes = await pool.query('SELECT * FROM job_postings WHERE job_id = $1', [jobId]);
            if (jobRes.rows.length > 0) {
                jobData = jobRes.rows[0];
            }
        }

        // 4. Call Groq Service
        const optimizationResponse = await optimizeResumeWithGroq(finalResumeText, jobData);

        res.json({
            success: true,
            data: {
                ...optimizationResponse,
                original_text: finalResumeText
            }
        });

    } catch (error) {
        console.error('Resume Optimization Route Error:', error);
        res.status(500).json({ error: error.message || 'Failed to optimize resume' });
    }
});

/**
 * @route POST /api/ai/resume/save-optimized
 * @desc Save edited optimized resume to candidate_resumes table
 * @access Private
 */
router.post('/save-optimized', auth, async (req, res) => {
    try {
        const { optimized_resume, resume_name } = req.body;
        const userId = req.user.userId;

        // 1. Get Candidate ID
        const candidateRes = await pool.query('SELECT id, name, email, phone_number, location FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate profile not found.' });
        }
        const candidate = candidateRes.rows[0];

        // 2. Convert optimized_resume JSON to a string format for PDF generation
        // (Basic transformation for now)
        let resumeContentStr = `SUMMARY\n${optimized_resume.summary}\n\n`;

        resumeContentStr += `SKILLS\n${optimized_resume.skills.join(', ')}\n\n`;

        resumeContentStr += `EXPERIENCE\n`;
        optimized_resume.experience.forEach(exp => {
            resumeContentStr += `${exp.title} at ${exp.company} (${exp.duration})\n`;
            exp.responsibilities.forEach(resp => {
                resumeContentStr += `- ${resp}\n`;
            });
            resumeContentStr += `\n`;
        });

        resumeContentStr += `PROJECTS\n`;
        optimized_resume.projects.forEach(proj => {
            resumeContentStr += `${proj.title}\n${proj.description}\nTechnologies: ${proj.technologies.join(', ')}\n\n`;
        });

        resumeContentStr += `EDUCATION\n${optimized_resume.education}`;

        // 3. Generate PDF
        const pdfUrl = await generateResumePDF(resumeContentStr, candidate);

        // 4. Save to candidate_resumes table
        const insertQuery = `
            INSERT INTO candidate_resumes 
            (candidate_id, resume_name, file_url, mime_type, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *
        `;

        const savedResume = await pool.query(insertQuery, [
            candidate.id,
            resume_name || `Optimized_${Date.now()}.pdf`,
            pdfUrl,
            'application/pdf'
        ]);

        res.json({
            success: true,
            message: 'Optimized resume saved successfully.',
            data: savedResume.rows[0]
        });

    } catch (error) {
        console.error('Save Optimized Resume Error:', error);
        res.status(500).json({ error: error.message || 'Failed to save optimized resume' });
    }
});


/**
 * @route POST /api/ai/resume/analyze-match
 * @desc Analyze resume match with job and provide gap bridging
 * @access Private
 */
router.post('/analyze-match', auth, limiter, async (req, res) => {
    try {
        const { jobId, jobDescription, useProfileResume, resumeText: rawText } = req.body;
        const userId = req.user.userId;

        // 1. Resolve Candidate
        const candidateRes = await pool.query('SELECT id, resume_pdf FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate profile not found.' });
        }
        const candidate = candidateRes.rows[0];

        let finalResumeText = "";

        // 2. Determine Resume Source
        if (useProfileResume === 'true' || useProfileResume === true) {
            if (!candidate.resume_pdf) {
                return res.status(400).json({ error: 'No resume found in your profile to analyze.' });
            }

            try {
                let fileBuffer;
                let mimeType = 'application/pdf';

                if (typeof candidate.resume_pdf === 'string') {
                    const matches = candidate.resume_pdf.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    fileBuffer = Buffer.from(matches ? matches[2] : candidate.resume_pdf, 'base64');
                    if (matches) mimeType = matches[1];
                } else {
                    fileBuffer = candidate.resume_pdf;
                }

                finalResumeText = await extractTextFromBuffer(fileBuffer, mimeType);
            } catch (err) {
                return res.status(400).json({ error: 'Failed to process profile resume: ' + err.message });
            }
        } else if (rawText && rawText.length >= 50) {
            finalResumeText = rawText;
        } else {
            return res.status(400).json({ error: 'Please provide resume text or use your profile resume.' });
        }

        // 3. Fetch Job context
        let jobData = { job_title: "Target Position", required_skills: "", description: jobDescription || "" };
        if (jobId && jobId !== 'null' && jobId !== 'undefined') {
            // Check if it's an external job ID from Adzuna or Jooble
            if (String(jobId).startsWith('ext_adz_') || String(jobId).startsWith('jooble-')) {
                const sourceName = String(jobId).startsWith('ext_adz_') ? 'adzuna' : 'jooble';
                const externalId = String(jobId).replace('ext_adz_', '').replace('jooble-', '');

                const jobRes = await pool.query(
                    'SELECT * FROM job_postings WHERE external_job_id = $1 AND source_name = $2',
                    [externalId, sourceName]
                );
                if (jobRes.rows.length > 0) {
                    jobData = jobRes.rows[0];
                }
            } else {
                // Internal Job
                const jobRes = await pool.query('SELECT * FROM job_postings WHERE job_id = $1', [jobId]);
                if (jobRes.rows.length > 0) {
                    jobData = jobRes.rows[0];
                }
            }
        }

        if (!jobData.job_description && !jobData.description && !jobData.required_skills) {
            return res.status(400).json({ error: 'Job details or description is required for analysis.' });
        }

        // 4. Call Groq Analysis
        const analysis = await analyzeMatchWithGroq(finalResumeText, jobData);

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('Match Analysis Error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze match' });
    }
});

export default router;
