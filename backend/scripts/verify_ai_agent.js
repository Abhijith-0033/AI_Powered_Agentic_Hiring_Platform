
import { generateCoverLetter } from '../services/aiCoverLetterService.js';
import pool from '../config/db.js';
import fs from 'fs';

const verifyAgent = async () => {
    console.log('🤖 Starting AI Agent Verification...');

    try {
        // 1. Get a Candidate
        const candRes = await pool.query('SELECT user_id, id, name FROM candidates LIMIT 1');
        if (candRes.rows.length === 0) {
            console.error('❌ No candidates found in DB. Please create one first.');
            process.exit(1);
        }
        const candidate = candRes.rows[0];
        console.log(`✅ Found Candidate: ${candidate.name} (ID: ${candidate.id})`);

        // 1.5 Proceed to Job Selection
        console.log('✅ Proceeding to Job Selection...');

        // 2. Get a Job (Targeting external job to verify new logic)
        const jobRes = await pool.query('SELECT job_id, job_title FROM job_postings WHERE company_id IS NULL LIMIT 1');
        if (jobRes.rows.length === 0) {
            console.error('❌ No jobs found in DB. Please create a job posting first.');
            process.exit(1);
        }
        const job = jobRes.rows[0];
        console.log(`✅ Found Job: ${job.job_title} (ID: ${job.job_id})`);

        // 3. Trigger AI Generation
        console.log('\n🧠 Triggering Hybrid AI Agent...');
        console.time('Generation Time');

        // Note: The service expects candidateId (user_id from auth middleware context usually, 
        // but let's check service logic: it queries `WHERE user_id = $1`. 
        // So we pass candidate.user_id)
        const result = await generateCoverLetter(candidate.user_id, job.job_id, 'confident');

        console.timeEnd('Generation Time');

        // 4. Output Results
        console.log('\n✨ Generation Successful!');
        console.log('--------------------------------------------------');
        console.log(`📄 PDF Path:     http://localhost:3000${result.pdfUrl}`);
        console.log(`📊 Match Score:  ${result.analysis.matchPercentage}%`);
        console.log(`🔗 Matched:      ${result.analysis.matchedSkills}`);
        console.log(`⚠️ Missing:      ${result.analysis.missingSkills}`);
        console.log('--------------------------------------------------');
        console.log('\nPreview (First 200 chars):');
        console.log(result.content.substring(0, 200) + '...');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        console.error(error);
        fs.writeFileSync('error_log.txt', `Error: ${error.message}\nStack: ${error.stack}\nFull: ${JSON.stringify(error, null, 2)}`);
        process.exit(1);
    }
};

verifyAgent();
