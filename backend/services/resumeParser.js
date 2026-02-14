import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini-Driven Agentic Resume Parser
 * Uses Gemini Pro/Flash to extract structured data from raw PDF text
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using Flash Lite for better quota/speed
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

/**
 * Main parse function using Gemini
 */
export const parseResume = async (buffer, mimeType) => {
    try {
        // 1. Convert Buffer to Base64 for Gemini (Inline Data)
        const base64Data = buffer.toString('base64');
        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType: "application/pdf"
            }
        };

        // 2. Prepare Gemini Prompt
        const promptText = `
            You are an expert recruitment AI. Extract structured information from the provided resume document.
            Return ONLY a valid JSON object following this exact schema:
            {
                "personal_info": {
                    "name": "string",
                    "email": "string",
                    "phone_number": "string",
                    "location": "string",
                    "linkedin_url": "string",
                    "github_url": "string",
                    "portfolio_url": "string",
                    "profile_description": "string (max 100 words summary)",
                    "is_fresher": boolean
                },
                "skills": ["string"],
                "experience": [
                    {
                        "company": "string",
                        "title": "string",
                        "location": "string",
                        "startDate": "string",
                        "endDate": "string",
                        "current": boolean,
                        "description": "string"
                    }
                ],
                "education": [
                    {
                        "school": "string",
                        "degree": "string",
                        "fieldOfStudy": "string",
                        "startDate": "string",
                        "endDate": "string (format: YYYY or graduation year as string)",
                        "grade": "string"
                    }
                ],
                "projects": [
                    {
                        "title": "string",
                        "description": "string",
                        "technologies": ["string"],
                        "link": "string"
                    }
                ],
                "achievements": [
                    {
                        "title": "string",
                        "description": "string",
                        "date": "string"
                    }
                ]
            }
        `;

        console.log('DEBUG: Sending PDF to Gemini...');

        // 3. Call Gemini with Retry Logic
        let result;
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                result = await model.generateContent([promptText, filePart]);
                break;
            } catch (e) {
                if (e.message.includes('429') || e.message.includes('Too Many Requests')) {
                    console.warn(`Gemini API Rate Limit hit. Retrying in ${(i + 1) * 2} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
                } else {
                    throw e;
                }
            }
        }

        if (!result) {
            throw new Error('Failed to get response from Gemini after retries.');
        }

        const response = await result.response;
        let text = response.text();

        // Clean up response (sometimes Gemini adds json ... )
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const extractedData = JSON.parse(text);

        console.log('DEBUG: Gemini Extracted Data:', JSON.stringify(extractedData, null, 2));

        return {
            ...extractedData,
            rawText: '', // No raw text available in this mode
            photo: null
        };
    } catch (error) {
        console.error('Gemini Resume parsing error:', error);
        throw new Error('Failed to parse resume with AI. Please ensure your API key is valid and the file is a standard PDF.');
    }
};

