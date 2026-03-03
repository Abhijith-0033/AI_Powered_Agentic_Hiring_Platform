import natural from 'natural';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * ChatbotService - Handles semantic FAQ search using TF-IDF ranking.
 * This service uses the 'natural' library to provide zero-cold-start 
 * semantic matching against the faqs.json dataset.
 */

const { TfIdf } = natural;
const FAQS_PATH = path.join(process.cwd(), '..', 'faqs.json');

let faqs = [];
const tfidf = new TfIdf();

// Initialize the FAQ index
try {
    if (existsSync(FAQS_PATH)) {
        const rawData = readFileSync(FAQS_PATH, 'utf-8');
        faqs = JSON.parse(rawData);

        // Add each FAQ as a document to the TF-IDF index
        faqs.forEach((faq, index) => {
            // Index question with high weight (repeat 3x), category, and keywords
            const weightedQuestion = (faq.question + ' ').repeat(3);
            const documentContent = `${weightedQuestion} ${faq.category} ${faq.keywords.join(' ')}`;
            tfidf.addDocument(documentContent);
        });

        console.log(`✅ ChatbotService initialized with ${faqs.length} FAQs`);
    } else {
        console.warn(`⚠️  faqs.json not found at ${FAQS_PATH}. Chatbot will return fallback messages.`);
    }
} catch (error) {
    console.error('❌ Failed to initialize ChatbotService:', error.message);
}

/**
 * Search for the most relevant FAQ entry based on user query
 * @param {string} query - The user's natural language question
 * @returns {Object|null} - The matching FAQ object or null if no good match
 */
export const searchFAQ = (query) => {
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
        return null;
    }

    const cleanQuery = query.trim();
    const scores = [];

    // Compute TF-IDF scores for the query against each document
    tfidf.tfidfs(cleanQuery, (i, score) => {
        scores.push({ index: i, score });
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const bestMatch = scores[0];

    // Check if we have a match with a minimum confidence threshold
    // TF-IDF scores are not normalized 0-1, but for short queries, 
    // anything > 0 is a hit. We use 0.05 as a conservative heuristic.
    if (bestMatch && bestMatch.score > 0.05) {
        return {
            ...faqs[bestMatch.index],
            confidence: bestMatch.score
        };
    }

    return null;
};

export default {
    searchFAQ
};
