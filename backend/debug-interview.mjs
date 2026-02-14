import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
import pool from './config/db.js';

async function debugInterview() {
    try {
        console.log('--- Debugging Latest Interview ---');
        // Get the most recent interview
        const res = await pool.query(`
            SELECT i.id, i.channel_name, i.recruiter_id, i.candidate_id, i.status, i.meeting_link
            FROM interviews i
            ORDER BY i.updated_at DESC
            LIMIT 1
        `);

        let output = '';
        if (res.rows.length === 0) {
            output = 'No interviews found.';
        } else {
            const i = res.rows[0];
            output += '--- LATEST INTERVIEW ---\n';
            output += `Interview ID: ${i.id}\n`;
            output += `Channel Name: ${i.channel_name}\n`;
            output += `Recruiter ID: ${i.recruiter_id}\n`;
            output += `Candidate ID: ${i.candidate_id}\n`;
            output += `Meeting Link: ${i.meeting_link}\n`;
            output += '------------------------\n';
        }

        fs.writeFileSync('debug-output.txt', output);
        console.log('Output written to debug-output.txt');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugInterview();
