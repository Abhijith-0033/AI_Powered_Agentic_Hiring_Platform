import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini AI Resume Parser
 * Extracts structured data and photo from PDF/DOCX resumes
 */

/**
 * Extract text using Python script (PyMuPDF / python-docx)
 */
const extractTextWithPython = (buffer, mimeType) => {
    return new Promise((resolve, reject) => {
        // Create a temporary file
        const tempDir = os.tmpdir();
        const ext = mimeType.includes('pdf') ? '.pdf' : '.docx';
        const tempFilePath = path.join(tempDir, `resume_${uuidv4()}${ext}`);

        try {
            fs.writeFileSync(tempFilePath, buffer);
        } catch (err) {
            return reject(new Error('Failed to write temporary file'));
        }

        const pythonScriptPath = path.join(process.cwd(), 'scripts', 'extract_resume_text.py');

        // Spawn Python process
        const pythonProcess = spawn('python', [pythonScriptPath, tempFilePath]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            // Cleanup temp file
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            } catch (e) {
                console.error('Failed to delete temp file:', e);
            }

            if (code !== 0) {
                // Try to parse error from stdout if available (custom JSON error)
                try {
                    const jsonOutput = JSON.parse(stdoutData);
                    if (jsonOutput.error) {
                        return reject(new Error(jsonOutput.error));
                    }
                } catch (e) {
                    // Ignore, proceed to stderr
                }
                return reject(new Error(stderrData || 'Python script failed'));
            }

            try {
                const jsonOutput = JSON.parse(stdoutData);
                if (jsonOutput.success) {
                    resolve(jsonOutput.text);
                } else {
                    reject(new Error(jsonOutput.error || 'Unknown extraction error'));
                }
            } catch (err) {
                reject(new Error('Failed to parse Python output: ' + err.message));
            }
        });

        // Timeout handling (10 seconds)
        setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Text extraction timed out'));
        }, 10000);
    });
};

/**
 * Extract data using Gemini 1.5 Flash
 */
const extractDataWithGemini = async (text) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are an expert resume parser. Extract the following information from the resume text below and return it in strictly valid JSON format.
        
        JSON Schema:
        {
            "personal_info": {
                "name": "Full Name",
                "email": "Email Address",
                "phone_number": "Phone Number",
                "location": "City, Country",
                "linkedin_url": "URL",
                "github_url": "URL",
                "portfolio_url": "URL",
                "profile_description": "Summary or About Me section (max 500 chars)",
                "is_fresher": boolean (true if less than 1 year experience)
            },
            "skills": ["Skill 1", "Skill 2", ...],
            "experience": [
                {
                    "company": "Company Name",
                    "title": "Job Title",
                    "location": "Location",
                    "startDate": "YYYY-MM-DD or MM/YYYY",
                    "endDate": "YYYY-MM-DD or MM/YYYY or Present",
                    "current": boolean,
                    "description": "Key responsibilities and achievements"
                }
            ],
            "education": [
                {
                    "school": "Institution Name",
                    "degree": "Degree Name",
                    "fieldOfStudy": "Major/Field",
                    "startDate": "YYYY",
                    "endDate": "YYYY",
                    "grade": "CGPA or Percentage"
                }
            ],
            "projects": [
                {
                    "title": "Project Title",
                    "description": "Project description",
                    "technologies": ["Tech 1", "Tech 2"],
                    "link": "Project URL"
                }
            ],
            "achievements": [
                {
                    "title": "Achievement/Certification Name",
                    "date": "Date",
                    "description": "Details"
                }
            ]
        }

        RESUME TEXT:
        ${text}
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const textResponse = response.text();

        // Clean markdown code blocks if present
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Gemini extraction error:', error);
        throw new Error('AI parsing failed');
    }
};

/**
 * Main parse function
 */
export const parseResume = async (buffer, mimeType) => {
    try {
        // 1. Extract Text
        // const text = await extractText(buffer, mimeType);
        const text = await extractTextWithPython(buffer, mimeType);

        // 2. Extract Data with Gemini
        const extractedData = await extractDataWithGemini(text);

        // 3. Photo functionality deprecated for now as per plan
        const photo = null;

        return {
            ...extractedData,
            rawText: text, // Keep for debugging
            photo: photo
        };
    } catch (error) {
        console.error('Resume parsing error:', error);
        throw error;
    }
};
