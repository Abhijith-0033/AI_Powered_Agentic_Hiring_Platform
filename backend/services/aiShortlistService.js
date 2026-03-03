import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const natural = require('natural');
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Tokenizer and TF-IDF setup
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// Gemini AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// For 1.5-flash the model string should just be "gemini-1.5-flash"
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SKILL_ALIASES = {
    "js": "javascript",
    "ts": "typescript",
    "node": "nodejs",
    "node.js": "nodejs",
    "react.js": "react",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "css3": "css",
    "html5": "html",
    "py": "python"
};

const DEGREE_HIERARCHY = {
    'phd': 4, 'doctorate': 4,
    'masters': 3, 'msc': 3, 'mba': 3, 'meng': 3,
    'bachelors': 2, 'bsc': 2, 'beng': 2, 'btech': 2, 'degree': 2,
    'diploma': 1, 'associate': 1, 'certificate': 1,
};

const SENIORITY_LEVELS = {
    junior: ['junior', 'entry level', 'entry-level', 'graduate', 'intern', '0-2 years'],
    mid: ['mid level', 'mid-level', 'intermediate', '2-5 years', '3+ years'],
    senior: ['senior', 'lead', 'principal', '5+ years', '7+ years'],
    executive: ['head of', 'director', 'vp', 'chief', 'cto', 'ceo'],
};

/**
 * Normalize skills using aliases
 */
export const normalizeSkills = (text) => {
    if (!text || typeof text !== 'string') return '';
    let normalized = ` ${text.toLowerCase()} `; // Add padding for boundary matches

    // Sort aliases by length descending to match "node.js" before "js"
    const sortedAliases = Object.keys(SKILL_ALIASES).sort((a, b) => b.length - a.length);

    for (const alias of sortedAliases) {
        const canonical = SKILL_ALIASES[alias];
        // Custom boundary: start of string, space, punctuation, or end of string
        // We avoid \b because it doesn't handle dots well
        const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<=[\\s,./;|^])${escapedAlias}(?=[\\s,./;|$])`, 'gi');
        normalized = normalized.replace(regex, canonical);
    }
    return normalized.trim();
};

/**
 * Extract text from a base64 encoded resume file
 */
export const parseResume = async (base64Data, mimeType = 'application/pdf') => {
    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const safeMime = (mimeType || 'application/pdf').toLowerCase();

        if (safeMime.includes('pdf')) {
            try {
                const data = await pdf(buffer);
                return data.text;
            } catch (pdfErr) {
                console.warn(`[AI Shortlist] Warning: Failed to parse PDF structure. Falling back to raw string. Err: ${pdfErr.message}`);
                return buffer.toString('utf-8');
            }
        } else {
            return buffer.toString('utf-8');
        }
    } catch (error) {
        console.error('Error parsing resume:', error);
        return '';
    }
};

/**
 * Preprocess text
 */
export const preprocessText = (text) => {
    if (!text || typeof text !== 'string') return '';
    let clean = normalizeSkills(text);
    clean = clean.replace(/[^a-z0-9\s]/g, '');
    const tokens = tokenizer.tokenize(clean);
    const stopwords = natural.stopwords;
    const filtered = tokens.filter(token => !stopwords.includes(token));
    return filtered.join(' ');
};

/**
 * TF-IDF Cosine Similarity
 */
export const computeMatchScore = (jobDescription, resumeText) => {
    if (!jobDescription || !resumeText) return 0;

    const tfidf = new TfIdf();
    tfidf.addDocument(preprocessText(jobDescription));
    tfidf.addDocument(preprocessText(resumeText));

    const terms = new Set();
    tfidf.listTerms(0).forEach(item => terms.add(item.term));
    tfidf.listTerms(1).forEach(item => terms.add(item.term));

    const vec1 = [];
    const vec2 = [];

    terms.forEach(term => {
        vec1.push(tfidf.tfidf(term, 0));
        vec2.push(tfidf.tfidf(term, 1));
    });

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
    return Math.round(similarity * 100);
};

/**
 * Dimension Scorers
 */
const calculateSkillScore = (requiredSkillsText, candidateSkills, resumeText) => {
    if (!requiredSkillsText) return 80; // Neutral if none specified
    const jobSkills = requiredSkillsText.split(/[,;|\/]/).map(s => normalizeSkills(s.trim())).filter(s => s.length > 1);
    const normalizedResume = normalizeSkills(resumeText);
    const normalizedCandidateSkills = (candidateSkills || []).map(s => normalizeSkills(s));

    let matched = 0;
    jobSkills.forEach(skill => {
        const inProfile = normalizedCandidateSkills.some(s => s.includes(skill) || skill.includes(s));
        const inResume = normalizedResume.includes(skill);
        if (inProfile) matched += 1.0;
        else if (inResume) matched += 0.6;
    });

    return jobSkills.length > 0 ? (matched / jobSkills.length) * 100 : 0;
};

const extractYearsOfExperience = (text) => {
    const patterns = [
        /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi,
        /experience[:\s]+(\d+)\+?\s*years?/gi,
    ];
    let maxYears = 0;
    for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        for (const m of matches) {
            maxYears = Math.max(maxYears, parseInt(m[1] || m[4]));
        }
    }
    return maxYears;
};

const calculateExperienceScore = (jobDescription, resumeText) => {
    const jobYearsMatch = jobDescription.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
    const requiredYears = jobYearsMatch ? parseInt(jobYearsMatch[1]) : 0;
    const candidateYears = extractYearsOfExperience(resumeText);

    if (requiredYears === 0) return 80;
    if (candidateYears >= requiredYears) return 100;
    if (candidateYears >= requiredYears * 0.7) return 70;
    return Math.max(0, (candidateYears / requiredYears) * 100);
};

const getSeniorityLevel = (text) => {
    const lower = text.toLowerCase();
    for (const [level, keywords] of Object.entries(SENIORITY_LEVELS)) {
        if (keywords.some(k => lower.includes(k))) return level;
    }
    return 'mid';
};

const calculateSeniorityScore = (jobText, resumeText) => {
    const jobLevel = getSeniorityLevel(jobText);
    const candidateLevel = getSeniorityLevel(resumeText);
    const levels = ['junior', 'mid', 'senior', 'executive'];
    const diff = Math.abs(levels.indexOf(jobLevel) - levels.indexOf(candidateLevel));
    return diff === 0 ? 100 : diff === 1 ? 60 : 20;
};

const getEducationLevel = (text) => {
    const lower = text.toLowerCase();
    for (const [degree, level] of Object.entries(DEGREE_HIERARCHY)) {
        if (lower.includes(degree)) return level;
    }
    return 0;
};

const calculateEducationScore = (requiredEdu, candidateEdu, resumeText) => {
    const required = getEducationLevel(requiredEdu || '');
    const candidate = Math.max(
        getEducationLevel(candidateEdu || ''),
        getEducationLevel(resumeText || '')
    );
    if (required === 0) return 80;
    if (candidate >= required) return 100;
    if (candidate === required - 1) return 65;
    return 30;
};

/**
 * Gemini AI Narrative Generator
 */
const generateAiNarrative = async (jobTitle, score, breakdown) => {
    try {
        if (!process.env.GEMINI_API_KEY) return "AI key not configured.";

        const prompt = `As an elite AI recruitment engine, provide a 2-sentence summary of why this candidate scored ${score}% for the role of ${jobTitle}. 
        Breakdown: Skills ${Math.round(breakdown.skillScore)}%, Exp ${Math.round(breakdown.experienceScore)}%, Seniority ${Math.round(breakdown.seniorityScore)}%, Education ${Math.round(breakdown.educationScore)}%. 
        Be professional and concise.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Manual scoring indicates a mix of experience and skill alignment.";
    }
};

/**
 * Main Orchestration Function
 */
export const rankCandidates = async (jobContext, applications, jobMetadata = {}) => {
    const results = [];
    const { required_skills, required_education, job_title } = jobMetadata;

    for (const app of applications) {
        let finalScore = 0;
        let breakdown = { skillScore: 0, experienceScore: 0, seniorityScore: 0, educationScore: 0, tfidfScore: 0 };

        try {
            let resumeText = '';
            if (app.resume_data) {
                resumeText = await parseResume(app.resume_data, app.resume_name);
            }

            // 1. Individual Dimension Scores
            breakdown.skillScore = calculateSkillScore(required_skills, app.skills, resumeText);
            breakdown.experienceScore = calculateExperienceScore(jobContext, resumeText);
            breakdown.educationScore = calculateEducationScore(required_education, app.degree, resumeText);
            breakdown.seniorityScore = calculateSeniorityScore(jobContext, resumeText);

            // 2. TF-IDF with Skill Boosting
            const boostedJobDoc = `${jobContext} ${(required_skills || '').repeat(3)}`;
            breakdown.tfidfScore = computeMatchScore(boostedJobDoc, resumeText);

            // 3. Composite Weighted Score
            finalScore = Math.round(
                breakdown.skillScore * 0.40 +
                breakdown.experienceScore * 0.20 +
                breakdown.seniorityScore * 0.15 +
                breakdown.educationScore * 0.10 +
                breakdown.tfidfScore * 0.15
            );

            // 4. Generate Narrative (Gemini AI)
            const aiNarrative = await generateAiNarrative(job_title || "this role", finalScore, breakdown);

            // 5. Generate Sectioned Explanation (Manual for UI)
            //
            // ROOT-CAUSE FIX:
            // Previously matchedSkills only checked resumeText. If PDF parsing failed
            // (InvalidPDFException), resumeText was empty  making every skill appear
            // "missing" even when the candidate had them in their profile.
            //
            // Now we check THREE sources in priority order:
            //   1. Candidate skills array from their profile (most reliable)
            //   2. Resume PDF text (secondary – may be empty if PDF failed)
            //   3. Degree / institution field (for educational skills)

            const jobSkillsList = (required_skills || '')
                .split(/[,;|\/]/)
                .map(s => normalizeSkills(s.trim()))
                .filter(s => s.length > 1);

            // Normalised candidate skill pool (profile array + resume text + education)
            const profileSkillsNorm = (app.skills || []).map(s => normalizeSkills(s));
            const resumeTextNorm = normalizeSkills(resumeText);
            const eduTextNorm = normalizeSkills(`${app.degree || ''} ${app.institution || ''}`);

            const matchedSkills = [];
            const missingSkills = [];

            for (const jobSkill of jobSkillsList) {
                // Check profile skills array first (highest confidence)
                const inProfile = profileSkillsNorm.some(
                    cs => cs.includes(jobSkill) || jobSkill.includes(cs)
                );
                // Then resume text
                const inResume = resumeTextNorm.includes(jobSkill);
                // Then education fields
                const inEdu = eduTextNorm.includes(jobSkill);

                if (inProfile || inResume || inEdu) {
                    matchedSkills.push(jobSkill);
                } else {
                    missingSkills.push(jobSkill);
                }
            }

            results.push({
                application_id: app.application_id,
                match_score: finalScore,
                explanation: {
                    score: finalScore,
                    breakdown,
                    aiNarrative,
                    matchedSkills: matchedSkills.slice(0, 10),
                    missingSkills: missingSkills.slice(0, 10),
                    educationMatch: breakdown.educationScore >= 70 ? '✔ Requirement met' : '✖ Requirement gaps',
                    summary: `Overall score of ${finalScore}% based on weighted multi-dimensional analysis.`
                }
            });

        } catch (err) {
            console.error(`Error ranking App ID ${app.application_id}:`, err);
            results.push({ application_id: app.application_id, match_score: 0 });
        }
    }

    return results.sort((a, b) => b.match_score - a.match_score);
};
