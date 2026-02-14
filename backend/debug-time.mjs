import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
import pool from './config/db.js';

async function debugInterviewTime() {
    try {
        console.log('--- Debugging Interview Time ---');
        // Get the most recent interview
        const res = await pool.query(`
            SELECT 
                i.id, 
                i.channel_name, 
                i.status, 
                i.scheduled_at, 
                i.created_at, 
                NOW() as db_time,
                i.updated_at
            FROM interviews i
            ORDER BY i.updated_at DESC
            LIMIT 1
        `);

        let output = '';
        if (res.rows.length === 0) {
            output = 'No interviews found.';
        } else {
            const i = res.rows[0];
            output += '--- LATEST INTERVIEW TIME DEBUG ---\n';
            output += `Interview ID: ${i.id}\n`;
            output += `Status: ${i.status}\n`;
            output += `Scheduled At (DB): ${i.scheduled_at}\n`;
            output += `Created At (DB): ${i.created_at}\n`;
            output += `Updated At (DB): ${i.updated_at}\n`;
            output += `Current DB Time: ${i.db_time}\n`;
            output += `Current Node Time: ${new Date().toISOString()}\n`;
            output += '------------------------\n';
        }

        fs.writeFileSync('debug-time.txt', output);
        console.log('Output written to debug-time.txt');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugInterviewTime();
