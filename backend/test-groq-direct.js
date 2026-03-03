import { parseResumeWithGroq } from './services/groqService.js';
import dotenv from 'dotenv';
dotenv.config();

const testText = `
John Doe
Email: john.doe@example.com
Phone: 123-456-7890
Location: New York, NY
Skills: Python, JavaScript, React, Node.js
Experience:
Software Engineer at Tech Corp (2020 - Present)
- Developed web applications using React and Node.js.
Education:
BS in Computer Science, NYU (2016 - 2020)
`;

const runTest = async () => {
    try {
        console.log("Starting direct Groq test...");
        const result = await parseResumeWithGroq(testText);
        console.log("Success! Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Direct Groq test failed:", error);
    }
};

runTest();
