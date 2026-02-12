
/**
 * Resume Scoring Service (Deterministic)
 * Analyzes resume content against job descriptions and industry standards.
 */

// Common industry keywords for fallback
const GENERAL_KEYWORDS = [
    'project management', 'leadership', 'communication', 'problem solving',
    'data analysis', 'strategic planning', 'teamwork', 'agile', 'scrum',
    'budgeting', 'customer service', 'negotiation', 'marketing', 'sales'
];

// Critical sections to look for
const KEY_SECTIONS = [
    { name: 'experience', keywords: ['experience', 'work history', 'employment', 'career history'] },
    { name: 'education', keywords: ['education', 'academic', 'degree', 'university', 'college'] },
    { name: 'skills', keywords: ['skills', 'technologies', 'competencies', 'expertise', 'stack'] },
    { name: 'summary', keywords: ['summary', 'profile', 'objective', 'about me'] }
];

// Action verbs for impact scoring
const ACTION_VERBS = [
    'led', 'managed', 'developed', 'created', 'implemented', 'optimized',
    'reduced', 'increased', 'improved', 'generated', 'streamlined',
    'launched', 'engineered', 'architected', 'designed', 'mentored'
];

/**
 * Calculate keyword match percentage
 * @param {string} resumeText 
 * @param {string[]} jobSkills 
 */
export const calculateKeywordMatch = (resumeText, jobSkills = []) => {
    const text = resumeText.toLowerCase();
    const targetKeywords = jobSkills.length > 0 ? jobSkills : GENERAL_KEYWORDS;

    // Normalize keywords (lowercase)
    const normalizedTargets = targetKeywords.map(k => k.toLowerCase());

    const matched = [];
    const missing = [];

    normalizedTargets.forEach(keyword => {
        // Simple word boundary check to avoid partial matches
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(text)) {
            matched.push(keyword);
        } else {
            missing.push(keyword);
        }
    });

    const score = Math.round((matched.length / normalizedTargets.length) * 100) || 0;

    return {
        score,
        matched,
        missing
    };
};

/**
 * Analyze resume structure
 * @param {string} resumeText 
 */
export const analyzeStructure = (resumeText) => {
    const text = resumeText.toLowerCase();
    const foundSections = [];

    KEY_SECTIONS.forEach(section => {
        const hasSection = section.keywords.some(k => text.includes(k));
        if (hasSection) foundSections.push(section.name);
    });

    // Scoring: 25 points per section present
    const score = Math.min(foundSections.length * 25, 100);

    return {
        score,
        sections: foundSections,
        missing: KEY_SECTIONS.filter(s => !foundSections.includes(s.name)).map(s => s.name)
    };
};

/**
 * Calculate impact score based on verbs and numbers
 * @param {string} resumeText 
 */
export const calculateImpactScore = (resumeText) => {
    const text = resumeText.toLowerCase();

    // 1. Action Verbs Check
    let verbCount = 0;
    ACTION_VERBS.forEach(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) verbCount += matches.length;
    });

    // Cap at 20 verbs for full points on verbs (50% of impact score)
    const verbScore = Math.min((verbCount / 15) * 50, 50);

    // 2. Quantification Check (Numbers, %, $)
    // Look for patterns like "20%", "$50k", "5 years", "10 teams"
    const numberMatches = text.match(/\d+%|\$\d+|\d+ years?/g) || [];
    const quantCount = numberMatches.length;

    // Cap at 10 quantifiers for full points (50% of impact score)
    const quantScore = Math.min((quantCount / 8) * 50, 50);

    return {
        score: Math.round(verbScore + quantScore),
        metrics: {
            actionVerbsFound: verbCount,
            quantifiedPoints: quantCount
        }
    };
};

/**
 * Main Scoring Function
 * @param {string} resumeText 
 * @param {object} job (Optional)
 */
export const scoreResume = (resumeText, job = null) => {
    // 1. Keyword Match (40%)
    // If job exists, use job.skills (assuming it's an array or string)
    let jobSkills = [];
    if (job) {
        if (Array.isArray(job.skills)) jobSkills = job.skills;
        else if (typeof job.skills === 'string') jobSkills = job.skills.split(',').map(s => s.trim());
    }

    const keywordAnalysis = calculateKeywordMatch(resumeText, jobSkills);

    // 2. Structure Score (30%)
    const structureAnalysis = analyzeStructure(resumeText);

    // 3. Impact Score (30%)
    const impactAnalysis = calculateImpactScore(resumeText);

    // Calculate Final Weighted Score
    const overallScore = Math.round(
        (keywordAnalysis.score * 0.4) +
        (structureAnalysis.score * 0.3) +
        (impactAnalysis.score * 0.3)
    );

    return {
        overallScore,
        breakdown: {
            keywordMatch: keywordAnalysis,
            structure: structureAnalysis,
            impact: impactAnalysis
        }
    };
};
