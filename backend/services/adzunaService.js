import axios from 'axios';
import pool from '../config/db.js';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search';

export const syncJobs = async () => {
    if (!APP_ID || !APP_KEY) {
        console.error('Adzuna API credentials missing');
        return;
    }

    try {
        console.log('Fetching external jobs from Adzuna (Broad India-level search)...');

        let allJobs = [];
        const pagesToFetch = 2; // Fetch pages 1 and 2
        const resultsPerPage = 50;

        // Fetch multiple pages for broader coverage
        for (let pageNum = 1; pageNum <= pagesToFetch; pageNum++) {
            const pageUrl = `${BASE_URL}/${pageNum}`;
            console.log(`Fetching Adzuna page ${pageNum}...`);

            const response = await axios.get(pageUrl, {
                params: {
                    app_id: APP_ID,
                    app_key: APP_KEY,
                    results_per_page: resultsPerPage,
                    what: 'IT Engineering Developer', // Ensure technical jobs only
                    // No 'where' parameter - defaults to India-wide search
                }
            });

            const jobs = response.data.results || [];
            allJobs = allJobs.concat(jobs);
            console.log(`  Page ${pageNum}: Fetched ${jobs.length} jobs`);

            // Stop if we get fewer results than requested (end of results)
            if (jobs.length < resultsPerPage) {
                break;
            }
        }

        console.log(`Total Adzuna jobs fetched: ${allJobs.length}`);

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

            for (const job of allJobs) {
                // Map Adzuna fields to internal schema
                let location = 'India';
                if (job.location && job.location.display_name) {
                    location = job.location.display_name;
                }

                let companyName = 'Unknown Company';
                if (job.company && job.company.display_name) {
                    companyName = job.company.display_name;
                }

                if (!job.title) continue;

                await client.query(insertQuery, [
                    job.title,
                    companyName,
                    location,
                    job.description,
                    'external',
                    'adzuna',
                    String(job.id),
                    job.redirect_url,
                ]);
            }

            await client.query('COMMIT');
            console.log(`Adzuna sync complete: ${allJobs.length} jobs saved to database.`);

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
