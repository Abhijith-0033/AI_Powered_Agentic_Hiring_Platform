import axios from 'axios';

export const fetchJoobleJobs = async (filters) => {
    const { role, location, page = 1 } = filters;
    const apiKey = process.env.JOOBLE_API_KEY;

    if (!apiKey) {
        console.warn('JOOBLE_API_KEY is missing. Skipping Jooble fetch.');
        return { jobs: [], total: 0 };
    }

    try {
        console.log('Fetching jobs from Jooble (Broad India-level search)...');

        let allJobs = [];
        const pagesToFetch = 3; // Fetch pages 1-3 for broader coverage
        const resultsPerPage = 20;

        // Fetch multiple pages
        for (let pageNum = 1; pageNum <= pagesToFetch; pageNum++) {
            console.log(`  Fetching Jooble page ${pageNum}...`);

            const response = await axios.post(`https://jooble.org/api/${apiKey}`, {
                keywords: role || 'Software Developer Engineer IT Data', // Default to technical roles
                location: 'India', // ALWAYS use India, not user's specific city
                page: pageNum,
                resultonpage: resultsPerPage
            });

            if (!response.data || !response.data.jobs) {
                console.log(`  Page ${pageNum}: No results`);
                break;
            }

            const jobs = response.data.jobs;
            allJobs = allJobs.concat(jobs);
            console.log(`  Page ${pageNum}: Fetched ${jobs.length} jobs`);

            // Stop if we get fewer results than requested
            if (jobs.length < resultsPerPage) {
                break;
            }
        }

        console.log(`Total Jooble jobs fetched (before filtering): ${allJobs.length}`);

        // POST-FETCH TOLERANT FILTERING
        let filteredJobs = allJobs;

        // 1. Location Filter (Tolerant - check location, snippet, title)
        if (location && location.trim()) {
            const locationLower = location.toLowerCase();
            filteredJobs = filteredJobs.filter(job => {
                const jobLocation = (job.location || '').toLowerCase();
                const jobSnippet = (job.snippet || '').toLowerCase();
                const jobTitle = (job.title || '').toLowerCase();

                return jobLocation.includes(locationLower) ||
                    jobSnippet.includes(locationLower) ||
                    jobTitle.includes(locationLower);
            });
            console.log(`After location filter ('${location}'): ${filteredJobs.length} jobs`);
        }

        // 2. Role Filter (Keyword OR logic - already handled by API 'keywords' param)
        // No additional filtering needed as we passed role to API

        // 3. Normalize to internal schema
        const normalizedJobs = filteredJobs.map(job => ({
            job_id: `jooble-${job.id}`,
            external_job_id: String(job.id),
            job_title: job.title,
            job_description: job.snippet,
            external_company_name: job.company,
            location: job.location,
            job_type: job.type || 'Full Time',
            source_url: job.link,
            source: 'external',
            source_name: 'jooble',
            created_at: job.updated,
            salary_min: job.salary ? parseFloat(job.salary.replace(/[^0-9.]/g, '')) : null,
            salary_max: null
        }));

        console.log(`Final Jooble jobs (after filtering): ${normalizedJobs.length}`);

        return {
            jobs: normalizedJobs,
            total: allJobs.length // Return original total for stats
        };

    } catch (error) {
        console.error('Error fetching Jooble jobs:', error.message);
        return { jobs: [], total: 0 };
    }
};
