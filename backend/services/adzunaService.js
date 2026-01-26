import axios from 'axios';
import pool from '../config/db.js';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search/1';

export const syncJobs = async () => {
    if (!APP_ID || !APP_KEY) {
        console.error('Adzuna API credentials missing');
        return;
    }

    try {
        console.log('Fetching external jobs from Adzuna...');
        const response = await axios.get(BASE_URL, {
            params: {
                app_id: APP_ID,
                app_key: APP_KEY,
                what: 'developer',
                results_per_page: 50
            }
        });

        const jobs = response.data.results;
        console.log(`Fetched ${jobs.length} jobs from Adzuna.`);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertQuery = `
                INSERT INTO job_postings (
                    job_title, 
                    external_company_name,
                    location, 
                    job_description, 
                    source, 
                    source_name, 
                    external_job_id, 
                    source_url, 
                    last_synced_at,
                    status,
                    created_at,
                    updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'Open', NOW(), NOW())
                ON CONFLICT (external_job_id, source_name) WHERE source = 'external'
                DO UPDATE SET
                    job_title = EXCLUDED.job_title,
                    external_company_name = EXCLUDED.external_company_name,
                    location = EXCLUDED.location,
                    job_description = EXCLUDED.job_description,
                    source_url = EXCLUDED.source_url,
                    last_synced_at = NOW(),
                    updated_at = NOW();
            `;

            for (const job of jobs) {
                // Map Adzuna fields to internal schema
                // User Requirement: location = job.location.display_name
                // User Requirement: company_name = job.company.display_name OR "Unknown Company"

                let location = 'India';
                if (job.location && job.location.display_name) {
                    location = job.location.display_name;
                }

                let companyName = 'Unknown Company';
                if (job.company && job.company.display_name) {
                    companyName = job.company.display_name;
                }

                if (!job.title) continue;

                // Log normalization for debugging (first job only or simplified)
                // console.log(`Normalizing job: ${job.title} | ${companyName} | ${location}`);

                await client.query(insertQuery, [
                    job.title,
                    companyName, // external_company_name
                    location,
                    job.description,
                    'external',
                    'adzuna',
                    String(job.id),
                    job.redirect_url,
                ]);
            }

            await client.query('COMMIT');
            console.log('External jobs synced successfully.');

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error syncing external jobs:', error.message);
    }
};
