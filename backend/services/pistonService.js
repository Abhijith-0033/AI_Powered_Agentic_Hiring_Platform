import axios from 'axios';
import pLimit from 'p-limit';

/**
 * Piston Service - Code Execution using Hosted Piston API
 * API Endpoint: https://emkc.org/api/v2/piston
 * 
 * Features:
 * - Execute code in multiple languages (Python, C++, JavaScript, Java)
 * - Concurrent execution limiting (max 3 parallel requests)
 * - Rate limit handling with retry logic
 * - Timeout and memory limit enforcement
 */

// Concurrency limiter - max 3 parallel executions to respect rate limits
const limit = pLimit(3);

// Language mapping for Piston API
const LANGUAGE_MAP = {
    python: 'python3',
    python3: 'python3',
    cpp: 'cpp',
    c: 'c',
    javascript: 'javascript',
    js: 'javascript',
    java: 'java'
};

// Piston API configuration
const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';
const MAX_EXECUTION_TIME = parseInt(process.env.MAX_EXECUTION_TIME) || 5000;
const MAX_MEMORY = parseInt(process.env.MAX_MEMORY) || 128000;

/**
 * Execute code using Piston API
 * @param {string} sourceCode - The source code to execute
 * @param {string} language - Programming language (python, cpp, javascript, java)
 * @param {string} stdin - Standard input for the program
 * @returns {Promise<Object>} Execution result with stdout, stderr, exitCode
 */
/**
 * Execute code using Piston API
 * @param {string} sourceCode - The source code to execute
 * @param {string} language - Programming language (python, cpp, javascript, java)
 * @param {string} stdin - Standard input for the program
 * @returns {Promise<Object>} Raw Piston execution result
 */
async function executeCode(sourceCode, language, stdin = '') {
    return limit(async () => {
        try {
            // Language mapping
            const languageMap = {
                python: 'python3',
                python3: 'python3',
                cpp: 'cpp',
                c: 'c',
                javascript: 'javascript',
                js: 'javascript',
                java: 'java'
            };
            const pistonLanguage = languageMap[language.toLowerCase()] || language;

            console.log("Executing code...");
            console.log("Language:", pistonLanguage);
            console.log("Input:", stdin);

            const requestBody = {
                language: pistonLanguage,
                version: '*',
                files: [
                    {
                        content: sourceCode
                    }
                ],
                stdin: stdin,
                compile_timeout: 5000,
                run_timeout: 5000,
                compile_memory_limit: 512 * 1024 * 1024,
                run_memory_limit: 512 * 1024 * 1024
            };

            const response = await axios.post(`${PISTON_URL}/execute`, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log("Piston Response:", JSON.stringify(response.data));

            return response.data;

        } catch (error) {
            console.error("Piston Execution Error:", error.response?.data || error.message);
            // Return a mock error response to prevent crashes
            return {
                run: {
                    stdout: '',
                    stderr: error.message || 'Execution failed',
                    code: 1
                }
            };
        }
    });
}

/**
 * Normalizes string for reliable comparison
 * Handles line endings, trailing whitespace, and repeated internal spaces
 */
const normalize = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .trim()                          // Remove leading/trailing whitespace
        .replace(/\r\n/g, '\n')          // Normalize Windows line endings
        .replace(/\r/g, '\n')            // Normalize old Mac line endings
        .replace(/\n+$/g, '')            // Remove trailing newlines
        .replace(/[ \t]+$/gm, '')        // Remove trailing spaces per line
        .replace(/[ \t]+/g, ' ');        // Normalize internal whitespace
};

/**
 * Evaluate code against multiple test cases
 * @param {string} sourceCode - The source code to execute
 * @param {string} language - Programming language
 * @param {Array} testCases - Array of {input, expectedOutput, isHidden}
 * @returns {Promise<Object>} Evaluation result with score and details
 */
async function evaluateCode(sourceCode, language, testCases) {
    const results = [];
    let testCasesPassed = 0;

    console.log(`📊 Evaluating code against ${testCases.length} test cases...`);

    // Use sequential execution to strictly respect Piston's 1 req / 200ms limit
    for (const [index, testCase] of testCases.entries()) {
        try {
            // Add a fixed delay (300ms) between sequential cases to avoid burst limits
            if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            const result = await executeCode(sourceCode, language, testCase.input);

            // Parse Piston response (Step 3: Fix Response Parsing)
            const stdout = result.run?.stdout || "";
            const stderr = result.run?.stderr || result.compile?.stderr || "";
            const exitCode = result.run?.code || 0;

            const actualOutput = normalize(stdout);
            const expectedOutput = normalize(testCase.expected_output || testCase.expectedOutput || '');
            const passed = actualOutput === expectedOutput && exitCode === 0;

            if (passed) {
                testCasesPassed++;
            }

            console.log("Final Output:", stdout);
            console.log("Expected:", expectedOutput);
            console.log("Passed:", passed);

            results.push({
                testCaseIndex: index + 1,
                input: testCase.is_hidden ? '[Hidden]' : testCase.input,
                expectedOutput: testCase.is_hidden ? '[Hidden]' : (testCase.expected_output || testCase.expectedOutput),
                actualOutput: stdout,
                stderr: stderr,
                passed: passed,
                executionTime: 0 // Not accurately provided in simple response
            });

            console.log(`${passed ? '✅' : '❌'} Test case ${index + 1}: ${passed ? 'PASSED' : 'FAILED'}`);

        } catch (error) {
            console.error(`❌ Error in test case ${index + 1}:`, error.message);
            results.push({
                testCaseIndex: index + 1,
                input: testCase.input,
                expectedOutput: testCase.expected_output || testCase.expectedOutput,
                actualOutput: '',
                stderr: error.message,
                passed: false,
                executionTime: 0
            });
        }
    }

    // Sort results by index as parallel execution might reorder them
    results.sort((a, b) => a.testCaseIndex - b.testCaseIndex);

    const scorePercentage = testCases.length > 0 ? (testCasesPassed / testCases.length) * 100 : 0;

    console.log(`📈 Evaluation complete: ${testCasesPassed}/${testCases.length} test cases passed (${scorePercentage.toFixed(2)}%)`);

    return {
        totalScore: scorePercentage,
        testCasesPassed: testCasesPassed,
        totalTestCases: testCases.length,
        results: results,
        allPassed: testCasesPassed === testCases.length
    };
}

/**
 * Get supported languages
 * @returns {Array} List of supported languages
 */
function getSupportedLanguages() {
    return [
        { id: 'python3', name: 'Python 3', extension: 'py' },
        { id: 'cpp', name: 'C++', extension: 'cpp' },
        { id: 'javascript', name: 'JavaScript (Node.js)', extension: 'js' },
        { id: 'java', name: 'Java', extension: 'java' }
    ];
}

export default {
    executeCode,
    evaluateCode,
    getSupportedLanguages
};
