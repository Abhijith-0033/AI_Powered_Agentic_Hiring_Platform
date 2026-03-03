import pool from '../config/db.js';
import fetch from 'node-fetch';

/**
 * Fetch jobs from Jooble API for a single keyword (no location filter)
 */
const fetchJoobleJobs = async (keyword) => {
    try {
        const apiKey = process.env.JOOBLE_API_KEY;
        if (!apiKey) {
            console.warn('[Jooble] API key missing');
            return [];
        }

        const url = `https://jooble.org/api/${apiKey}`;
        const body = { keywords: keyword };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.error(`[Jooble] API error for "${keyword}":`, response.statusText);
            return [];
        }

        const data = await response.json();
        const jobs = data.jobs || [];

        return jobs.map(job => ({
            id: `jooble-${job.id}`,
            title: job.title || '',
            company: job.company || 'Unknown',
            location: job.location || '',
            description: job.snippet ? job.snippet.replace(/<[^>]*>?/gm, '') : '',
            apply_url: job.link,
            source: 'Jooble',
            matched_skill: keyword
        }));
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`[Jooble] Request timed out for keyword: "${keyword}"`);
        } else {
            console.error(`[Jooble] Error for "${keyword}":`, error.message);
        }
        return [];
    }
};

/**
 * Fetch jobs from Adzuna API for a single keyword (no location filter)
 */
const fetchAdzunaJobs = async (keyword) => {
    try {
        const appId = process.env.ADZUNA_APP_ID;
        const appKey = process.env.ADZUNA_APP_KEY;

        if (!appId || !appKey) {
            console.warn('[Adzuna] API credentials missing');
            return [];
        }

        // No `where` param — broader search by keyword only
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(keyword)}&content-type=application/json`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            console.error(`[Adzuna] API error for "${keyword}":`, response.statusText);
            return [];
        }

        const data = await response.json();
        const results = data.results || [];

        return results.map(job => ({
            id: `adzuna-${job.id}`,
            title: job.title || '',
            company: job.company?.display_name || 'Unknown',
            location: job.location?.display_name || '',
            description: job.description ? job.description.replace(/<[^>]*>?/gm, '') : '',
            apply_url: job.redirect_url,
            source: 'Adzuna',
            matched_skill: keyword
        }));
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`[Adzuna] Request timed out for keyword: "${keyword}"`);
        } else {
            console.error(`[Adzuna] Error for "${keyword}":`, error.message);
        }
        return [];
    }
};

/**
 * Deduplicate jobs based on title + company (no location in key)
 */
const deduplicateJobs = (jobs) => {
    const uniqueJobs = new Map();

    jobs.forEach(job => {
        const title = (job.title || '').toLowerCase().trim();
        const company = (job.company || '').toLowerCase().trim();
        const key = `${title}|${company}`;
        if (!uniqueJobs.has(key)) {
            uniqueJobs.set(key, job);
        }
    });

    return Array.from(uniqueJobs.values());
};

/**
 * Get recommended jobs based on candidate profile.
 * Searches each skill individually — no location filter — for broader results.
 */
export const getRecommendedJobs = async (userId) => {
    try {
        // 1. Fetch candidate profile
        const result = await pool.query(
            'SELECT skills, job_title FROM candidates WHERE user_id = $1',
            [userId]
        );

        // Build list of search terms: each skill is its own search
        let searchTerms = [];

        if (result.rows.length > 0) {
            const profile = result.rows[0];
            const skills = Array.isArray(profile.skills) ? profile.skills : [];
            const jobTitle = profile.job_title || '';

            // Each skill becomes an individual search term (max 5 skills)
            searchTerms = skills.slice(0, 5);

            // Also add the job title as a standalone term if not already included
            if (jobTitle && !searchTerms.map(s => s.toLowerCase()).includes(jobTitle.toLowerCase())) {
                searchTerms.unshift(jobTitle);
            }
        }

        // Fallback if profile is empty
        if (searchTerms.length === 0) {
            searchTerms = ['software engineer'];
        }

        console.log(`[RecommendedJobs] Searching per skill: [${searchTerms.join(', ')}]`);

        // 2. Search each term individually against both APIs (all in parallel)
        const allFetches = searchTerms.flatMap(term => [
            fetchJoobleJobs(term),
            fetchAdzunaJobs(term)
        ]);

        const allResults = await Promise.all(allFetches);

        // 3. Flatten, deduplicate, return top 30
        const mergedJobs = allResults.flat();
        const finalJobs = deduplicateJobs(mergedJobs);

        console.log(`[RecommendedJobs] Total raw: ${mergedJobs.length}, after dedup: ${finalJobs.length}`);

        return finalJobs.slice(0, 30);
    } catch (error) {
        console.error('[RecommendedJobs] Service Error:', error);
        throw error;
    }
};
