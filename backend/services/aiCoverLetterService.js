
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generatePDF } from './pdfService.js';
import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Helper for safe query
const queryDB = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (e) {
        console.error('DB Query Error', e);
        throw e;
    }
};

/**
 * Hybrid AI Cover Letter Generator
 */
export const generateCoverLetter = async (candidateId, jobId, tone = 'professional') => {
    try {
        // 1. Fetch Data
        const candidateQuery = `
            SELECT id, name, email, phone, location, skills, experience_years, education
            FROM candidates WHERE user_id = $1 
        `; // Assuming candidate is linked via user_id, OR if candidateId IS the candidate.id
        // Wait, auth middleware usually gives User ID. We need to find Candidate ID from User ID.
        // However, let's assume specific logic:
        // If protection middleware attaches `req.user`, `req.user.id` is likely the `users` table ID.
        // We need to fetch the candidate profile first.

        const userCandidateRes = await pool.query('SELECT * FROM candidates WHERE user_id = $1', [candidateId]);
        if (userCandidateRes.rows.length === 0) throw new Error('Candidate profile not found');
        const candidate = userCandidateRes.rows[0];

        const jobQuery = `
            SELECT j.*, COALESCE(c.name, j.external_company_name) as company_name
            FROM job_postings j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE j.job_id = $1
        `;
        const jobRes = await pool.query(jobQuery, [jobId]);

        if (jobRes.rows.length === 0) throw new Error('Job not found');
        const job = jobRes.rows[0];

        // 2. Structured Match Analysis (Hybrid Layer)
        // Ensure skills are arrays
        const jobSkillsRaw = job.skills || []; // job.skills is typically an array in postgres if JSONB or array type
        const jobSkills = Array.isArray(jobSkillsRaw) ? jobSkillsRaw : (typeof jobSkillsRaw === 'string' ? jobSkillsRaw.split(',') : []);

        const candSkillsRaw = candidate.skills || [];
        const candSkills = Array.isArray(candSkillsRaw) ? candSkillsRaw : (typeof candSkillsRaw === 'string' ? candSkillsRaw.split(',') : []);

        const jobSkillsFormatted = jobSkills.map(s => s.trim().toLowerCase());
        const candSkillsFormatted = candSkills.map(s => s.trim().toLowerCase());

        const matchedSkills = jobSkills.filter(js => candSkillsFormatted.some(cs => cs.includes(js.toLowerCase()) || js.toLowerCase().includes(cs)));
        const missingSkills = jobSkills.filter(js => !matchedSkills.includes(js));
        const matchPercentage = Math.round((matchedSkills.length / (jobSkills.length || 1)) * 100);

        const analysis = {
            matchedSkills: matchedSkills.join(', '),
            missingSkills: missingSkills.join(', '),
            matchPercentage: matchPercentage,
            experienceMatch: candidate.experience_years >= (parseInt(job.experience_level) || 0) ? 'Met' : 'Gap',
            educationMatch: (candidate.education || '').includes(job.required_education || '') ? 'Likely Met' : 'Check'
        };

        // 3. Prompt Engineering
        const PROMPT_VERSION = "v1.0";
        const prompt = `
            You are a professional executive career coach.
            Generate a personalized, persuasive cover letter.
            
            JOB DETAILS:
            Title: ${job.job_title}
            Company: ${job.company_name}
            Required Skills: ${job.required_skills}

            CANDIDATE PROFILE:
            Name: ${candidate.name}
            Skills: ${candidate.skills ? candidate.skills.join(', ') : ''}
            Experience: ${candidate.experience_years} years
            Education: ${JSON.stringify(candidate.education)}

            MATCH ANALYSIS (SYSTEM GENERATED):
            Matched Skills: ${analysis.matchedSkills}
            Missing Skills: ${analysis.missingSkills}

            INSTRUCTIONS:
            - Tone: ${tone}
            - Emphasize matched skills naturally.
            - Address missing skills with a growth mindset if relevant.
            - NO placeholders.
            - NO markdown.
            - NO header blocks (Date/Address), just the body + salutation + sign-off.
            - Limit to 350 words.
        `;

        let content = '';

        // 4. Generate with Gemini w/ Fallback
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            content = response.text();

            // Validation Layer
            if (content.length < 100 || content.includes('[Your Name]')) {
                throw new Error('AI Output Invalid');
            }
        } catch (aiError) {
            console.warn('⚠️ Gemini Failed, using Template Fallback:', aiError.message);
            content = generateTemplateFallback(candidate, job, analysis);
        }

        // 5. Generate PDF
        const pdfUrl = await generatePDF(content, candidate, job);

        // 6. DB Persistence
        const insertQuery = `
            INSERT INTO generated_cover_letters 
            (candidate_id, job_id, content, prompt_version)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at, version
        `;
        const saveRes = await pool.query(insertQuery, [candidate.id, jobId, content, PROMPT_VERSION]);

        return {
            id: saveRes.rows[0].id,
            content,
            pdfUrl,
            analysis, // return analysis for UI transparency
            isFallback: !content.includes(job.company_name) // rudimentary check
        };

    } catch (error) {
        console.error('Service Error:', error);
        throw error;
    }
};

const generateTemplateFallback = (candidate, job, analysis) => {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.job_title} position at ${job.company_name}. With ${candidate.experience_years} years of experience and a proven track record, I am confident in my ability to contribute effectively to your team.

Your job description highlights the need for skills such as ${job.required_skills}. My background includes ${analysis.matchedSkills || 'relevant technologies'}, which aligns well with your requirements. I am eager to bring my expertise to ${job.company_name}.

Thank you for considering my application. I look forward to the possibility of discussing how my skills align with your goals.

Sincerely,

${candidate.name}`;
};
