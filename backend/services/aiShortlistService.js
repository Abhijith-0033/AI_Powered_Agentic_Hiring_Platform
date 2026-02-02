import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const natural = require('natural');

// Tokenizer and TF-IDF setup
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

/**
 * Extract text from a base64 encoded resume file (PDF/Text)
 * @param {string} base64Data - Base64 string of the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
export const parseResume = async (base64Data, mimeType = 'application/pdf') => {
    try {
        const buffer = Buffer.from(base64Data, 'base64');

        // Ensure mimeType is a string safe for checking
        const safeMime = (mimeType || 'application/pdf').toLowerCase();

        if (safeMime.includes('pdf')) {
            const data = await pdf(buffer);
            return data.text;
        } else {
            // Fallback for plain text or assume text-readable
            return buffer.toString('utf-8');
        }
    } catch (error) {
        console.error('Error parsing resume:', error);
        return ''; // Return empty string on failure to avoid crashing the batch
    }
};

/**
 * Preprocess text: Lowercase, remove stopwords, remove punctuation
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
export const preprocessText = (text) => {
    if (!text || typeof text !== 'string') return '';

    // 1. Lowercase
    let clean = text.toLowerCase();

    // 2. Remove punctuation/special chars
    clean = clean.replace(/[^a-z0-9\s]/g, '');

    // 3. Tokenize
    const tokens = tokenizer.tokenize(clean);

    // 4. Remove stopwords
    const stopwords = natural.stopwords;
    const filtered = tokens.filter(token => !stopwords.includes(token));

    return filtered.join(' ');
};

/**
 * Calculate Cosine Similarity between two text documents (Job Description & Resume)
 * using TF-IDF vectors.
 * 
 * Note: 'natural' TfIdf class doesn't directly give cosine similarity of two arbitrary docs easily 
 * in a stateless way without building a corpus. We will build a mini-corpus of 2 documents 
 * [JobDesc, Resume] and compute similarity.
 * 
 * @param {string} jobDescription 
 * @param {string} resumeText 
 * @returns {number} Score (0-100)
 */
export const computeMatchScore = (jobDescription, resumeText) => {
    if (!jobDescription || !resumeText) return 0;

    const tfidf = new TfIdf();

    // Add documents
    tfidf.addDocument(preprocessText(jobDescription)); // Doc 0
    tfidf.addDocument(preprocessText(resumeText));     // Doc 1

    // We implementing a simple Cosine Similarity manually using the TF-IDF terms
    // Get all terms from both documents
    const terms = new Set();
    tfidf.listTerms(0).forEach(item => terms.add(item.term));
    tfidf.listTerms(1).forEach(item => terms.add(item.term));

    // Create vectors
    const vec1 = [];
    const vec2 = [];

    terms.forEach(term => {
        vec1.push(tfidf.tfidf(term, 0));
        vec2.push(tfidf.tfidf(term, 1));
    });

    // Compute Cosine Similarity = (A . B) / (||A|| * ||B||)
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }

    if (mag1 === 0 || mag2 === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));

    // Convert to percentage integer (0-100)
    return Math.round(similarity * 100);
};

/**
 * Generate a human-readable explanation for the match score
 * @param {object} jobData - { required_skills_text, required_education_text }
 * @param {object} candidateData - { skills_array, degree, institution, resumeText }
 * @param {number} score
 * @returns {object} { matchedSkills, missingSkills, educationMatch, summary, score }
 */
const generateExplanation = (jobData, candidateData, score) => {
    // Skill Matching: Compare job's required_skills (text) vs candidate's skills (array)
    const jobSkillsRaw = (jobData.required_skills_text || '').toLowerCase();
    const candidateSkills = (candidateData.skills_array || []).map(s => s.toLowerCase());
    const candidateResumeText = (candidateData.resumeText || '').toLowerCase();

    // Parse job skills (assume comma or common delimiter separated)
    const jobSkillsList = jobSkillsRaw.split(/[,;|\/]/).map(s => s.trim()).filter(s => s.length > 1);

    const matchedSkills = [];
    const missingSkills = [];

    jobSkillsList.forEach(jobSkill => {
        // Check if skill is in candidate's skills array OR mentioned in resume text
        const inSkillsArray = candidateSkills.some(cs => cs.includes(jobSkill) || jobSkill.includes(cs));
        const inResumeText = candidateResumeText.includes(jobSkill);

        if (inSkillsArray || inResumeText) {
            matchedSkills.push(jobSkill);
        } else {
            missingSkills.push(jobSkill);
        }
    });

    // Education Matching: Check if required_education is mentioned in candidate's degree/institution/resume
    const requiredEdu = (jobData.required_education_text || '').toLowerCase();
    const candidateDegree = (candidateData.degree || '').toLowerCase();
    const candidateInstitution = (candidateData.institution || '').toLowerCase();

    let educationMatch = 'Not specified';
    if (requiredEdu) {
        const eduInDegree = candidateDegree.includes(requiredEdu) || requiredEdu.includes(candidateDegree);
        const eduInResume = candidateResumeText.includes(requiredEdu);
        const eduInInstitution = candidateInstitution.includes(requiredEdu);

        if (eduInDegree || eduInResume || eduInInstitution) {
            educationMatch = '✔ Requirement likely met';
        } else if (candidateDegree) {
            educationMatch = '⚠ Partial (degree present, but may not match)';
        } else {
            educationMatch = '✖ Required qualification not found';
        }
    }

    // Reasoning Text: Dynamic summary
    const totalSkills = jobSkillsList.length;
    const matchedCount = matchedSkills.length;
    let summary = '';

    if (totalSkills > 0) {
        summary += `• ${matchedCount} of ${totalSkills} required skills detected.\n`;
    } else {
        summary += '• No specific skills specified in job requirements.\n';
    }

    if (missingSkills.length > 0) {
        summary += `• Missing: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}\n`;
    }

    if (score < 40) {
        summary += '• Low overall keyword overlap with job description.\n';
    } else if (score < 70) {
        summary += '• Moderate overlap with job requirements.\n';
    } else {
        summary += '• Strong alignment with job context.\n';
    }

    return {
        score,
        matchedSkills: matchedSkills.slice(0, 10),
        missingSkills: missingSkills.slice(0, 10),
        educationMatch,
        summary: summary.trim()
    };
};

/**
 * Main Orchestration Function
 * @param {string} jobDescription - Full text of job context (description + required skills/education text)
 * @param {Array<{application_id: number, resume_data: string, resume_name: string, skills?: string[], degree?: string, institution?: string}>} applications 
 * @param {object} jobMetadata - { required_skills, required_education } for structured explanation
 * @returns {Promise<Array<{application_id: number, match_score: number, explanation: object}>>}
 */
export const rankCandidates = async (jobDescription, applications, jobMetadata = {}) => {
    const results = [];

    console.log(`[AI Shortlist] Starting ranking for ${applications.length} candidates. Job Desc Length: ${jobDescription ? jobDescription.length : 'N/A'}`);

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
        console.warn('[AI Shortlist] Invalid job description. Returning 0 scores.');
        return applications.map(app => ({ application_id: app.application_id, match_score: 0 }));
    }

    for (const app of applications) {
        let score = 0;

        try {
            // 1. Parse Resume
            let base64Data = app.resume_data;

            // Ensure data is string
            if (base64Data && typeof base64Data === 'string') {
                if (base64Data.includes('base64,')) {
                    base64Data = base64Data.split('base64,')[1];
                }

                const resumeText = await parseResume(base64Data, app.resume_name);

                // Context Construction Rule:
                // FINAL_RESUME_TEXT = Extracted Resume Skills + Extracted Resume Education + Relevant Project Descriptions
                // We use the full text as fallback for "Relevant Project Descriptions" since we can't easily segment without new models.
                // However, we prepend structured data to give it higher weight/priority in TF-IDF (term frequency).

                const candidateContextParts = [];

                if (app.skills && Array.isArray(app.skills) && app.skills.length > 0) {
                    candidateContextParts.push(`Skills: ${app.skills.join(', ')}`);
                }

                if (app.degree || app.institution) {
                    const eduParts = [app.degree, app.institution].filter(Boolean);
                    candidateContextParts.push(`Education: ${eduParts.join(' from ')}`);
                }

                // Add resume text (serving as project descriptions/experience)
                if (resumeText) {
                    candidateContextParts.push(resumeText);
                }

                const candidateContext = candidateContextParts.join('\n\n');

                // 2. Compute Score
                if (candidateContext && typeof candidateContext === 'string') {
                    // Normalize score strictly as requested: 0.0-1.0 float -> 0-100 integer
                    const rawSimilarity = computeMatchScore(jobDescription, candidateContext) / 100; // Convert back to float 0-1 if computeMatchScore returns 0-100, or adjust computeMatchScore to return 0-1.

                    // Actually, looking at computeMatchScore (Line 112), it returns Math.round(similarity * 100).
                    // So 'score' is already 0-100.
                    // The user wants: const matchScore = Math.round(rawScore * 100); where rawScore is 0-1.

                    // Let's modify computeMatchScore to return 0-1 float, OR adjust here.
                    // Constraint: "Modify only the Auto Shortlist scoring output".
                    // If I touch computeMatchScore, I change the service function contract.
                    // But I am editing this file.

                    // Let's assume computeMatchScore returns 0-100 (as per line 112 in original file).
                    // We will trust computeMatchScore for now but ensure we don't zero it out.

                    score = computeMatchScore(jobDescription, candidateContext);

                    // LOGGING as requested (simulating raw 0-1 by dividing)
                    console.log({
                        rawSimilarity: score / 100,
                        normalizedScore: score
                    });

                } else {
                    // Empty context is naturally 0
                }
            } else {
                console.warn(`[AI Shortlist] App ID ${app.application_id}: No valid resume data string available.`);
            }

            // Safety check for NaN
            if (isNaN(score)) score = 0;

        } catch (err) {
            console.error(`[AI Shortlist] Error processing App ID ${app.application_id}:`, err);
            score = 0; // Fallback to 0
        }

        results.push({
            application_id: app.application_id,
            match_score: score,
            explanation: generateExplanation(
                { required_skills_text: jobMetadata.required_skills, required_education_text: jobMetadata.required_education },
                { skills_array: app.skills, degree: app.degree, institution: app.institution, resumeText: candidateContext },
                score
            )
        });
    }

    // Sort by score DESC
    results.sort((a, b) => b.match_score - a.match_score);

    return results;
};
