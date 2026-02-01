import axios from 'axios';
import pool from '../config/db.js';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search';

// Helper for background saving
const saveJobsToDb = async (jobs) => {
    const client = await pool.connect();
    try {
        const insertQuery = `
            INSERT INTO job_postings (
                job_title, external_company_name, location, job_description, 
                source, source_name, external_job_id, source_url, 
                last_synced_at, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, 'external', 'adzuna', $5, $6, NOW(), 'Open', NOW(), NOW())
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
            await client.query(insertQuery, [
                job.job_title,
                job.external_company_name,
                job.location,
                job.job_description,
                job.external_job_id,
                job.source_url
            ]);
        }
    } catch (err) {
        // Silent fail for background sync
        console.error('Background DB save error:', err.message);
    } finally {
        if (client) client.release();
    }
};

// Live search function
export const fetchAdzunaJobs = async (filters = {}) => {
    if (!APP_ID || !APP_KEY) {
        console.error('Adzuna API credentials missing');
        return { jobs: [], total: 0 };
    }

    try {
        const { location, role, page = 1 } = filters;
        const pageUrl = `${BASE_URL}/${page}`;

        console.log(`🔍 Fetching live Adzuna jobs. Page: ${page}, Role: ${role || 'Any'}, Loc: ${location || 'India'}`);

        const params = {
            app_id: APP_ID,
            app_key: APP_KEY,
            results_per_page: 20, // Match typical frontend limit
            what: role || 'IT Engineering Developer',
            where: location || 'India',
            'content-type': 'application/json'
        };

        const response = await axios.get(pageUrl, { params });
        const jobs = response.data.results || [];
        const total = response.data.count || 0;

        console.log(`✅ Adzuna Live: Found ${jobs.length} jobs (Total: ${total})`);

        // Map and optionally save to DB for history (non-blocking)
        const mappedJobs = jobs.map(job => {
            let loc = 'India';
            if (job.location && job.location.display_name) {
                loc = job.location.display_name;
            }

            let companyName = 'Unknown Company';
            if (job.company && job.company.display_name) {
                companyName = job.company.display_name;
            }

            return {
                job_id: `ext_adz_${job.id}`,
                job_title: job.title,
                external_company_name: companyName,
                location: loc,
                job_description: job.description,
                source: 'external',
                source_name: 'adzuna',
                external_job_id: String(job.id),
                source_url: job.redirect_url,
                created_at: job.created,
                salary_min: job.salary_min,
                salary_max: job.salary_max
            };
        });

        // Async save to DB (Fire and forget to not slow down response)
        saveJobsToDb(mappedJobs).catch(err => console.error('Background DB save failed:', err.message));

        return { jobs: mappedJobs, total };

    } catch (error) {
        console.error('Error fetching live Adzuna jobs:', error.message);
        return { jobs: [], total: 0 };
    }
};

// Original sync function (preserved for legacy compatibility or background jobs)
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

        // Map jobs for saving
        const mappedJobs = allJobs.map(job => {
            let loc = 'India';
            if (job.location && job.location.display_name) {
                loc = job.location.display_name;
            }

            let companyName = 'Unknown Company';
            if (job.company && job.company.display_name) {
                companyName = job.company.display_name;
            }

            return {
                job_title: job.title,
                external_company_name: companyName,
                location: loc,
                job_description: job.description,
                external_job_id: String(job.id),
                source_url: job.redirect_url
            };
        });

        await saveJobsToDb(mappedJobs);
        console.log(`Adzuna sync complete.`);

    } catch (error) {
        console.error('Error syncing external jobs:', error.message);
    }
};
