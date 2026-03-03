import { extractTextFromBuffer } from './aiResumeService.js';
import { parseResumeWithGroq } from './groqService.js';

/**
 * Groq-Driven Agentic Resume Parser
 * Replaces Gemini with Groq for structured data extraction
 */
export const parseResume = async (buffer, mimeType) => {
    try {
        // 1. Extract raw text from PDF/DOCX buffer
        console.log('DEBUG: Extracting text from resume buffer...');
        const rawText = await extractTextFromBuffer(buffer, mimeType);

        if (!rawText || rawText.length < 50) {
            throw new Error('Insufficient text extracted from resume. Please ensure the file is not empty or scan-only.');
        }

        // 2. Call Groq for structured extraction
        console.log('DEBUG: Sending text to Groq for parsing...');
        const extractedData = await parseResumeWithGroq(rawText);

        console.log('DEBUG: Groq Extracted Data successfully.');

        return {
            ...extractedData,
            rawText: rawText,
            photo: null
        };
    } catch (error) {
        console.error('Groq Resume parsing error:', error);
        throw new Error('Failed to parse resume with Groq AI. Error: ' + error.message);
    }
};

