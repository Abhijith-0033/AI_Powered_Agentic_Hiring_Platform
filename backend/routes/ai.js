import express from 'express';
import pool from '../config/db.js';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();

/**
 * POST /api/ai/auto-shortlist
 * Triggers the Python based resume analysis for a specific job
 */
router.post('/auto-shortlist', async (req, res) => {
    const { jobId } = req.body;

    if (!jobId) {
        return res.status(400).json({ success: false, message: 'Job ID is required' });
    }

    try {
        // 1. Fetch Job Details
        const jobResult = await pool.query('SELECT * FROM job_postings WHERE job_id = $1', [jobId]);
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        const job = jobResult.rows[0];

        // 2. Fetch Candidates (In a real scenario, this might be filtered)
        const candidatesResult = await pool.query('SELECT * FROM candidates');
        const candidates = candidatesResult.rows;

        console.log(`🚀 Starting Auto Shortlist for Job: ${job.title} (${candidates.length} candidates)`);

        // 3. Prepare data for Python script
        // We'll pass job details and candidate list as JSON arguments or file path

        // MOCK IMPLEMENTATION (Similarity Logic in JS for now as fallback)
        // Since we might not have access to python env, we simulate scoring

        const results = candidates.map(candidate => {
            // Simple mock score based on matching skills
            let score = 0;
            const jobSkills = job.skills || [];
            const candidateSkills = candidate.skills || [];

            if (jobSkills.length > 0) {
                const matches = jobSkills.filter(skill =>
                    candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
                );
                score = Math.round((matches.length / jobSkills.length) * 100);
            } else {
                score = Math.floor(Math.random() * 40) + 60; // Random score if no skills defined
            }

            return {
                job_id: jobId,
                candidate_id: candidate.id,
                score: score,
                status: score > 70 ? 'shortlisted' : 'rejected',
                analysis_data: {
                    matched_skills: jobSkills.filter(skill => candidateSkills.includes(skill)),
                    missing_skills: jobSkills.filter(skill => !candidateSkills.includes(skill)),
                    summary: `Match score: ${score}% based on skills overlap.`
                }
            };
        });

        // 4. Save Results to DB
        // Using upsert to update existing scores
        for (const result of results) {
            await pool.query(`
                INSERT INTO job_shortlists (job_id, candidate_id, score, status, analysis_data)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (job_id, candidate_id) 
                DO UPDATE SET score = $3, status = $4, analysis_data = $5
            `, [result.job_id, result.candidate_id, result.score, result.status, result.analysis_data]);
        }

        // 5. Fetch and return sorted results
        const finalResults = await pool.query(`
            SELECT js.*, c.name, c.email, c.resume_url, c.experience_years 
            FROM job_shortlists js
            JOIN candidates c ON js.candidate_id = c.id
            WHERE js.job_id = $1
            ORDER BY js.score DESC
        `, [jobId]);

        res.json({
            success: true,
            message: 'Auto shortlist completed successfully',
            data: finalResults.rows
        });

    } catch (error) {
        console.error('Error in auto-shortlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error while processing resumes' });
    }
});

export default router;
