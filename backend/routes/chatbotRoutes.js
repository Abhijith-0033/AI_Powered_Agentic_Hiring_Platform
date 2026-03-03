import express from 'express';
import { searchFAQ } from '../services/chatbotService.js';

const router = express.Router();

/**
 * @route   POST /api/chatbot/query
 * @desc    Query the semantic FAQ chatbot
 * @access  Public
 */
router.post('/query', (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Query must be at least 3 characters long'
            });
        }

        const match = searchFAQ(query);

        if (match) {
            return res.json({
                success: true,
                answer: match.answer,
                category: match.category,
                question: match.question,
                score: match.confidence
            });
        }

        // Fallback response if no match is found
        return res.json({
            success: true,
            answer: "I couldn't find a specific answer for that. You can try rephrasing your question or browse our 'Jobs' and 'Career' sections for more info. If you need urgent help, please email us at support@hiringplatform.com.",
            score: 0
        });

    } catch (error) {
        console.error('Chatbot Query Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error processing your request'
        });
    }
});

export default router;
