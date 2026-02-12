
import express from 'express';
import { optimizeResume, extractTextFromBuffer } from '../services/aiResumeService.js';
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

// Rate Limiting: 5 requests per hour per IP (strict for AI costs)
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Rate limit exceeded. You can only optimize 5 resumes per hour.' }
});

/**
 * @route POST /api/ai/resume/optimize
 * @desc Optimize a resume using Hybrid AI (Supports Text, File Upload, or Profile Resume)
 * @access Private
 */
router.post('/optimize', auth, limiter, upload.single('resumeFile'), async (req, res) => {
    try {
        const { jobId, useProfileResume, resumeText: rawText } = req.body;
        const userId = req.user.userId;

        // 1. Resolve Candidate ID
        const candidateRes = await pool.query('SELECT id, resume_url FROM candidates WHERE user_id = $1', [userId]);

        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate profile not found. Please complete your profile first.' });
        }

        const candidate = candidateRes.rows[0];
        const candidateId = candidate.id;
        let finalResumeText = "";

        // 2. Determine Resume Source
        if (req.file) {
            // A. File Upload
            finalResumeText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
        } else if (useProfileResume === 'true' || useProfileResume === true) {
            // B. Existing Profile Resume
            if (!candidate.resume_url) {
                return res.status(400).json({ error: 'No resume found in your profile to optimize.' });
            }

            // resolve path logic
            const projectRoot = process.cwd();
            // Candidates usually upload to 'uploads/resumes' or similar.
            // Let's assume resume_url is relative path.

            let filePath;
            if (candidate.resume_url.startsWith('http')) {
                return res.status(400).json({ error: 'Remote resume files not yet supported for optimization.' });
            } else {
                filePath = path.resolve(projectRoot, candidate.resume_url.startsWith('/') ? '.' + candidate.resume_url : candidate.resume_url);
            }

            // Adjust for common path mismatch in dev
            if (!fs.existsSync(filePath)) {
                // Try looking in ./uploads/resumes if path was just filename
                const altPath = path.join(projectRoot, 'uploads', 'resumes', path.basename(candidate.resume_url));
                if (fs.existsSync(altPath)) filePath = altPath;
            }

            if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                finalResumeText = await extractTextFromBuffer(fileBuffer, mimeType);
            } else {
                console.error(`Profile resume not found at: ${filePath}`);
                return res.status(400).json({ error: 'Profile resume file not found on server.' });
            }

        } else if (rawText && rawText.length >= 50) {
            // C. Text Paste
            finalResumeText = rawText;
        } else {
            // If none, we should check what was sent for debugging
            return res.status(400).json({ error: 'Please upload a file, use your profile resume, or paste text.' });
        }

        if (!finalResumeText || finalResumeText.length < 50) {
            return res.status(400).json({ error: 'Could not extract valid text from the resume.' });
        }

        // 3. Optimize
        // Handle 'null' string from FormData
        const targetJobId = (jobId === 'null' || jobId === 'undefined' || !jobId) ? null : jobId;

        const result = await optimizeResume(candidateId, finalResumeText, targetJobId);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Resume Optimization Route Error:', error);
        res.status(500).json({ error: error.message || 'Failed to optimize resume' });
    }
});

export default router;
