import { parseResume } from './services/resumeParser.js';
import fs from 'fs';
import path from 'path';

const testResumeParsing = async () => {
    console.log("Starting resume parsing test...");

    try {
        const filePath = path.join(process.cwd(), 'dummy_resume.pdf');
        if (!fs.existsSync(filePath)) {
            console.error("Dummy PDF not found. Please run create_dummy_pdf.py first.");
            return;
        }

        const buffer = fs.readFileSync(filePath);
        const result = await parseResume(buffer, 'application/pdf');

        console.log("Parsing Result Data:", JSON.stringify(result, null, 2));

        if (result.rawText && result.rawText.includes("John Doe") && result.rawText.includes("Python")) {
            console.log("✅ Test Passed: Text extracted successfully");
        } else {
            console.error("❌ Test Failed: Text not extracting correctly");
        }

    } catch (e) {
        console.error("Test Failed with Error:", e.message);
        console.error(e);
    }
};

testResumeParsing();
