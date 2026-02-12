import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateResumePDF } from './pdfService.js';
import { scoreResume } from './resumeScoringService.js';
import pool from '../config/db.js';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-flash-latest" });

const MAX_RESUME_LENGTH = 12000; // Token control

/**
 * Clean and trim resume text
 */
const cleanText = (text) => {
    return text.trim().substring(0, MAX_RESUME_LENGTH).replace(/\s+/g, ' ');
};

/**
 * Helper: Extract Text from File Buffer
 */
export const extractTextFromBuffer = async (buffer, mimeType) => {
    try {
        if (mimeType === 'application/pdf') {
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            return cleanText(data.text);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: buffer });
            return cleanText(result.value);
        } else {
            throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
        }
    } catch (error) {
        console.error('Text Extraction Error:', error);
        throw new Error('Failed to extract text from file.');
    }
};

/**
 * Validate against hallucinations
 */
const validateOutput = (original, optimized) => {
    // 1. Check for new Dates (years)
    const originalYears = (original.match(/\b(19|20)\d{2}\b/g) || []).unique();
    const optimizedYears = (optimized.match(/\b(19|20)\d{2}\b/g) || []).unique();

    const newYears = optimizedYears.filter(y => !originalYears.includes(y));
    if (newYears.length > 0) {
        console.warn('⚠️ Potential Hallucination: New years detected', newYears);
        // We might choose to fail or just warn. For now, we allow but log.
    }

    // 2. Length check
    if (optimized.length < original.length * 0.5) return false; // Too short

    return true;
};

// Helper for arrays
Array.prototype.unique = function () {
    return this.filter((value, index, self) => self.indexOf(value) === index);
};

export const optimizeResume = async (candidateId, resumeText, jobId = null) => {
    const startTime = Date.now();
    let job = null;
    let jobContext = "";

    try {
        const cleanedResume = cleanText(resumeText);

        // 1. Fetch Job Context (Optional)
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_postings WHERE job_id = $1', [jobId]);
            if (jobRes.rows.length > 0) {
                job = jobRes.rows[0];
                jobContext = `
                TARGET JOB:
                Title: ${job.job_title}
                Skills: ${job.required_skills}
                Description: ${job.description.substring(0, 1000)}...
                `;
            }
        }

        // 2. Deterministic Scoring (Original)
        const originalAnalysis = scoreResume(cleanedResume, job);
        const originalScore = originalAnalysis.overallScore;

        // 3. Construct Prompt
        const prompt = `
            You are an expert Resume Strategist and ATS Specialist.
            Optimize the following resume to maximize ATS visibility and recruiter impact.
            
            ${jobContext ? "MODE: Targeted Optimization for specific role." : "MODE: General Professional Optimization."}

            STRICT CONSTRAINTS:
            - factual_integrity: TRUE (Do NOT invent companies, dates, or degrees)
            - format: Plain Text (No Markdown, No JSON)
            - tone: Professional, Action-Oriented
            - formatting: Use standard section headers (SUMMARY, SKILLS, EXPERIENCE, EDUCATION)

            DETERMINISTIC ANALYSIS (Current Issues):
            - Missing Keywords: ${originalAnalysis.breakdown.keywordMatch.missing.join(', ')}
            - Impact Score: ${originalAnalysis.breakdown.impact.score}/100
            
            TASKS:
            1. Integrate missing keywords naturally where relevant to the candidate's actual experience.
            2. Rewrite bullet points to use strong action verbs and quantify results.
            3. Fix any grammar or clarity issues.
            4. Remove fluff and cliches.

            RESUME CONTENT:
            ${cleanedResume}
        `;

        let optimizedContent = "";
        let modelUsed = process.env.GEMINI_MODEL || "gemini-flash-latest";

        // 4. Call Gemini
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4, // Lower temp for integrity
                    maxOutputTokens: 2000,
                }
            });
            optimizedContent = result.response.text();
        } catch (err) {
            console.error("Gemini Error:", err);
            // Fallback: Return original with naive improvements or just original
            optimizedContent = cleanedResume; // For safety, return original if AI fails
        }

        // 5. Validation & Hallucination Guard
        if (!validateOutput(cleanedResume, optimizedContent)) {
            console.warn("Validation Failed - Reverting to original");
            optimizedContent = cleanedResume;
        }

        // 6. Deterministic Re-Scoring (Optimized)
        const optimizedAnalysis = scoreResume(optimizedContent, job);
        const optimizedScore = optimizedAnalysis.overallScore;

        // 7. Generate PDF
        // We need candidate name. Fetch if not passed, or extract from text (hard).
        // Best to fetch candidate profile.
        const candidateRes = await pool.query('SELECT * FROM candidates WHERE id = $1', [candidateId]); // Assuming ID is linked correctly
        // Note: candidateId passed might be user_id, need to be careful with route. 
        // Let's assume candidateId IS candidate table ID for service layer.
        const candidate = candidateRes.rows[0] || { name: 'Candidate', email: '', phone: '' };

        const pdfUrl = await generateResumePDF(optimizedContent, candidate);

        // 8. Persistence
        const generationTime = Date.now() - startTime;
        const suggestions = {
            addedKeywords: optimizedAnalysis.breakdown.keywordMatch.matched.filter(k => !originalAnalysis.breakdown.keywordMatch.matched.includes(k)),
            scoreDelta: optimizedScore - originalScore,
            missingKeywords: optimizedAnalysis.breakdown.keywordMatch.missing
        };

        const insertQuery = `
            INSERT INTO optimized_resumes 
            (candidate_id, job_id, original_score, optimized_score, content, suggestions, generation_time_ms, model_used)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, version
        `;

        await pool.query(insertQuery, [
            candidateId,
            jobId,
            originalScore,
            optimizedScore,
            optimizedContent,
            suggestions,
            generationTime,
            modelUsed
        ]);

        return {
            originalScore,
            optimizedScore,
            improvement: optimizedScore - originalScore,
            suggestions,
            content: optimizedContent,
            pdfUrl
        };

    } catch (error) {
        console.error("Resume Optimization Error:", error);
        throw error;
    }
};
