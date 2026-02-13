import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import pistonService from '../services/pistonService.js';

const router = express.Router();

// ============================================================
// RECRUITER ENDPOINTS
// ============================================================

/**
 * POST /api/coding/tests
 * Create a new coding test with questions and test cases
 * Auth: Recruiter only
 */
router.post('/tests', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const { jobId, title, description, timeLimit, totalMarks, questions } = req.body;

        // Validation
        if (!title || !timeLimit || !totalMarks) {
            return res.status(400).json({
                success: false,
                message: 'Title, time limit, and total marks are required'
            });
        }

        if (!questions || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one question is required'
            });
        }

        await client.query('BEGIN');

        // Create coding test
        const testQuery = `
            INSERT INTO coding_tests (job_id, recruiter_id, title, description, time_limit, total_marks, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'draft')
            RETURNING id
        `;
        const testResult = await client.query(testQuery, [
            jobId || null, userId, title, description || '', timeLimit, totalMarks
        ]);

        const testId = testResult.rows[0].id;

        // Insert questions and test cases
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            // Insert question
            const questionQuery = `
                INSERT INTO coding_questions 
                (test_id, title, problem_statement, input_format, output_format, constraints, marks, question_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;
            const questionResult = await client.query(questionQuery, [
                testId, q.title, q.problemStatement, q.inputFormat || '',
                q.outputFormat || '', q.constraints || '', q.marks, i + 1
            ]);

            const questionId = questionResult.rows[0].id;

            // Insert test cases
            if (q.testCases && q.testCases.length > 0) {
                for (const tc of q.testCases) {
                    await client.query(
                        `INSERT INTO test_cases (question_id, input, expected_output, is_hidden) 
                         VALUES ($1, $2, $3, $4)`,
                        [questionId, tc.input, tc.expectedOutput, tc.isHidden || false]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Coding test created successfully',
            data: { testId }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating coding test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coding test',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/coding/tests
 * List all coding tests for the logged-in recruiter
 * Auth: Recruiter only
 */
router.get('/tests', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        const query = `
            SELECT ct.id, ct.job_id, ct.title, ct.description, ct.time_limit, 
                   ct.total_marks, ct.status, ct.results_published, ct.created_at,
                   jp.job_title,
                   COUNT(DISTINCT cs.candidate_id) as candidates_attempted
            FROM coding_tests ct
            LEFT JOIN job_postings jp ON ct.job_id = jp.job_id
            LEFT JOIN coding_submissions cs ON ct.id = cs.test_id
            WHERE ct.recruiter_id = $1
            GROUP BY ct.id, jp.job_title
            ORDER BY ct.created_at DESC
        `;

        const result = await pool.query(query, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching coding tests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding tests' });
    }
});

/**
 * GET /api/coding/tests/:id
 * Get coding test details with questions (recruiter view - includes test cases)
 * Auth: Recruiter only
 */
router.get('/tests/:id', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Get test details
        const testQuery = `
            SELECT ct.*, jp.job_title
            FROM coding_tests ct
            LEFT JOIN job_postings jp ON ct.job_id = jp.job_id
            WHERE ct.id = $1 AND ct.recruiter_id = $2
        `;
        const testResult = await pool.query(testQuery, [testId, userId]);

        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coding test not found' });
        }

        // Get questions
        const questionsQuery = `
            SELECT * FROM coding_questions
            WHERE test_id = $1
            ORDER BY question_order ASC
        `;
        const questionsResult = await pool.query(questionsQuery, [testId]);

        // Get test cases for each question
        const questions = await Promise.all(questionsResult.rows.map(async (q) => {
            const testCasesQuery = `
                SELECT * FROM test_cases
                WHERE question_id = $1
                ORDER BY created_at ASC
            `;
            const testCasesResult = await pool.query(testCasesQuery, [q.id]);
            return {
                ...q,
                testCases: testCasesResult.rows
            };
        }));

        res.json({
            success: true,
            data: {
                ...testResult.rows[0],
                questions
            }
        });

    } catch (error) {
        console.error('Error fetching coding test details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding test details' });
    }
});

/**
 * PUT /api/coding/tests/:id
 * Update coding test (only if draft)
 * Auth: Recruiter only
 */
router.put('/tests/:id', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const testId = req.params.id;
        const { title, description, timeLimit, totalMarks, questions } = req.body;

        // Check if test exists and is draft
        const checkQuery = `
            SELECT status FROM coding_tests
            WHERE id = $1 AND recruiter_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [testId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coding test not found' });
        }

        if (checkResult.rows[0].status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft tests can be updated'
            });
        }

        await client.query('BEGIN');

        // Update test
        await client.query(
            `UPDATE coding_tests 
             SET title = $1, description = $2, time_limit = $3, total_marks = $4, updated_at = NOW()
             WHERE id = $5`,
            [title, description, timeLimit, totalMarks, testId]
        );

        // Delete existing questions and test cases (CASCADE will handle test_cases)
        await client.query('DELETE FROM coding_questions WHERE test_id = $1', [testId]);

        // Insert new questions and test cases
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            const questionQuery = `
                INSERT INTO coding_questions 
                (test_id, title, problem_statement, input_format, output_format, constraints, marks, question_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;
            const questionResult = await client.query(questionQuery, [
                testId, q.title, q.problemStatement, q.inputFormat || '',
                q.outputFormat || '', q.constraints || '', q.marks, i + 1
            ]);

            const questionId = questionResult.rows[0].id;

            if (q.testCases && q.testCases.length > 0) {
                for (const tc of q.testCases) {
                    await client.query(
                        `INSERT INTO test_cases (question_id, input, expected_output, is_hidden) 
                         VALUES ($1, $2, $3, $4)`,
                        [questionId, tc.input, tc.expectedOutput, tc.isHidden || false]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.json({ success: true, message: 'Coding test updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating coding test:', error);
        res.status(500).json({ success: false, message: 'Failed to update coding test' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/coding/tests/:id
 * Delete coding test
 * Auth: Recruiter only
 */
router.delete('/tests/:id', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        const result = await pool.query(
            'DELETE FROM coding_tests WHERE id = $1 AND recruiter_id = $2 RETURNING id',
            [testId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coding test not found' });
        }

        res.json({ success: true, message: 'Coding test deleted successfully' });

    } catch (error) {
        console.error('Error deleting coding test:', error);
        res.status(500).json({ success: false, message: 'Failed to delete coding test' });
    }
});

/**
 * POST /api/coding/tests/:id/publish
 * Publish coding test
 * Auth: Recruiter only
 */
router.post('/tests/:id/publish', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        const result = await pool.query(
            `UPDATE coding_tests 
             SET status = 'published', updated_at = NOW()
             WHERE id = $1 AND recruiter_id = $2 AND status = 'draft'
             RETURNING id`,
            [testId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coding test not found or already published'
            });
        }

        res.json({ success: true, message: 'Coding test published successfully' });

    } catch (error) {
        console.error('Error publishing coding test:', error);
        res.status(500).json({ success: false, message: 'Failed to publish coding test' });
    }
});

/**
 * GET /api/coding/tests/:id/results
 * Get all candidate submissions for a test
 * Auth: Recruiter only
 */
router.get('/tests/:id/results', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Verify ownership
        const testCheck = await pool.query(
            'SELECT id FROM coding_tests WHERE id = $1 AND recruiter_id = $2',
            [testId, userId]
        );

        if (testCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coding test not found' });
        }

        // Get all submissions grouped by candidate
        // Get all individual submissions for the test
        const query = `
            SELECT 
                cs.id as submission_id,
                c.id as candidate_id,
                c.name as candidate_name,
                c.email as candidate_email,
                cq.title as question_title,
                cs.language,
                cs.score,
                cs.test_cases_passed,
                cs.total_test_cases,
                cs.submitted_at
            FROM coding_submissions cs
            INNER JOIN candidates c ON cs.candidate_id = c.id
            INNER JOIN coding_questions cq ON cs.question_id = cq.id
            WHERE cs.test_id = $1
            ORDER BY cs.submitted_at DESC
        `;

        const result = await pool.query(query, [testId]);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
});

/**
 * GET /api/coding/submissions/:id
 * Get detailed submission info for recruiter
 * Auth: Recruiter only
 */
router.get('/submissions/:id', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const submissionId = req.params.id;

        const query = `
            SELECT 
                cs.*,
                c.name as candidate_name,
                c.email as candidate_email,
                ct.title as test_title,
                cq.title as question_title,
                cq.problem_statement as question_description
            FROM coding_submissions cs
            INNER JOIN candidates c ON cs.candidate_id = c.id
            INNER JOIN coding_questions cq ON cs.question_id = cq.id
            INNER JOIN coding_tests ct ON cs.test_id = ct.id
            WHERE cs.id = $1
        `;

        const result = await pool.query(query, [submissionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching submission details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch submission details' });
    }
});

/**
 * POST /api/coding/tests/:id/results/publish
 * Publish results for all candidates
 * Auth: Recruiter only
 */
router.post('/tests/:id/results/publish', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Verify ownership
        const testCheck = await pool.query(
            'SELECT id FROM coding_tests WHERE id = $1 AND recruiter_id = $2',
            [testId, userId]
        );

        if (testCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coding test not found' });
        }

        // Publish results
        await pool.query(
            'UPDATE coding_tests SET results_published = true WHERE id = $1',
            [testId]
        );

        await pool.query(
            'UPDATE coding_submissions SET is_published = true WHERE test_id = $1',
            [testId]
        );

        res.json({ success: true, message: 'Results published successfully' });

    } catch (error) {
        console.error('Error publishing results:', error);
        res.status(500).json({ success: false, message: 'Failed to publish results' });
    }
});

// ============================================================
// CANDIDATE ENDPOINTS
// ============================================================

/**
 * GET /api/coding/my-tests
 * Get all coding tests assigned to the logged-in candidate
 * Auth: Job Seeker only
 */
router.get('/my-tests', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        console.log('Fetching coding tests for candidate:', candidateId);

        const query = `
            SELECT 
                ct.id, ct.title, ct.description, ct.time_limit, ct.total_marks,
                ct.status, ct.results_published, ct.created_at,
                jp.job_id, jp.job_title, c.name as company_name,
                (SELECT COUNT(*) FROM coding_submissions 
                 WHERE test_id = ct.id AND candidate_id = $1) as submission_count
            FROM coding_tests ct
            INNER JOIN job_postings jp ON ct.job_id = jp.job_id
            INNER JOIN companies c ON jp.company_id = c.id
            WHERE ct.status = 'published'
            AND EXISTS (
                SELECT 1 FROM job_applications ja 
                WHERE ja.job_id = jp.job_id AND ja.candidate_id = $1
            )
            ORDER BY ct.created_at DESC
        `;

        const result = await pool.query(query, [candidateId]);

        console.log(`Found ${result.rows.length} published coding test(s) for candidate ${candidateId}`);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching my coding tests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding tests' });
    }
});

/**
 * GET /api/coding/tests/:id/attempt
 * Get test for attempt (without test cases - candidate view)
 * Auth: Job Seeker only
 */
router.get('/tests/:id/attempt', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Get test details
        const testQuery = `
            SELECT ct.*, jp.job_title
            FROM coding_tests ct
            LEFT JOIN job_postings jp ON ct.job_id = jp.job_id
            WHERE ct.id = $1 AND ct.status = 'published'
        `;
        const testResult = await pool.query(testQuery, [testId]);

        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coding test not found or not published' });
        }

        // Get questions (without test cases)
        const questionsQuery = `
            SELECT id, test_id, title, problem_statement, input_format, output_format, 
                   constraints, marks, question_order
            FROM coding_questions
            WHERE test_id = $1
            ORDER BY question_order ASC
        `;
        const questionsResult = await pool.query(questionsQuery, [testId]);

        // Get only visible test cases for each question
        const questions = await Promise.all(questionsResult.rows.map(async (q) => {
            const sampleTestCasesQuery = `
                SELECT input, expected_output
                FROM test_cases
                WHERE question_id = $1 AND is_hidden = false
                ORDER BY created_at ASC
                LIMIT 2
            `;
            const sampleTestCasesResult = await pool.query(sampleTestCasesQuery, [q.id]);

            // Check if candidate already submitted for this question
            const submissionQuery = `
                SELECT score, test_cases_passed, total_test_cases, submitted_at
                FROM coding_submissions
                WHERE question_id = $1 AND candidate_id = $2
            `;
            const submissionResult = await pool.query(submissionQuery, [q.id, candidateId]);

            return {
                ...q,
                sampleTestCases: sampleTestCasesResult.rows,
                previousSubmission: submissionResult.rows[0] || null
            };
        }));

        res.json({
            success: true,
            data: {
                ...testResult.rows[0],
                questions
            }
        });

    } catch (error) {
        console.error('Error fetching test for attempt:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch test' });
    }
});

/**
 * POST /api/coding/run
 * Run code against visible test cases or custom input
 * Auth: Job Seeker only
 */
router.post('/run', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const { questionId, sourceCode, language, mode, customInput } = req.body;

        if (!questionId || !sourceCode || !language || !mode) {
            return res.status(400).json({
                success: false,
                message: 'Question ID, source code, language, and mode are required'
            });
        }

        if (mode === 'visible') {
            // Fetch only visible test cases
            const testCasesQuery = `
                SELECT input, expected_output 
                FROM test_cases 
                WHERE question_id = $1 AND is_hidden = false
                ORDER BY created_at ASC
            `;
            const testCasesResult = await pool.query(testCasesQuery, [questionId]);
            const testCases = testCasesResult.rows;

            if (testCases.length === 0) {
                return res.status(400).json({ success: false, message: 'No visible test cases found' });
            }

            const evaluation = await pistonService.evaluateCode(sourceCode, language, testCases);

            return res.json({
                success: true,
                data: evaluation.results
            });

        } else if (mode === 'custom') {
            if (customInput === undefined) {
                return res.status(400).json({ success: false, message: 'Custom input is required for custom mode' });
            }

            const result = await pistonService.executeCode(sourceCode, language, customInput);

            // Extract output from Piston's raw response
            const stdout = result.run?.stdout || "";
            const stderr = result.run?.stderr || result.compile?.stderr || "";
            const exitCode = result.run?.code || 0;

            return res.json({
                success: true,
                data: {
                    stdout: stdout,
                    stderr: stderr,
                    exitCode: exitCode,
                    executionTime: 0
                }
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid mode' });
        }

    } catch (error) {
        console.error('Error in run code:', error);
        res.status(500).json({ success: false, message: 'Failed to run code', error: error.message });
    }
});

/**
 * POST /api/coding/submit
 * Submit code for a question
 * Auth: Job Seeker only
 */
router.post('/submit', auth, roleGuard('job_seeker'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const { questionId, testId, sourceCode, language } = req.body;

        // Validation
        if (!questionId || !testId || !sourceCode || !language) {
            return res.status(400).json({
                success: false,
                message: 'Question ID, test ID, source code, and language are required'
            });
        }

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Get question and test cases
        const questionQuery = `
            SELECT * FROM coding_questions WHERE id = $1 AND test_id = $2
        `;
        const questionResult = await pool.query(questionQuery, [questionId, testId]);

        if (questionResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const question = questionResult.rows[0];

        // Get all test cases (including hidden ones)
        const testCasesQuery = `
            SELECT * FROM test_cases WHERE question_id = $1 ORDER BY created_at ASC
        `;
        const testCasesResult = await pool.query(testCasesQuery, [questionId]);
        const testCases = testCasesResult.rows;

        if (testCases.length === 0) {
            return res.status(400).json({ success: false, message: 'No test cases found for this question' });
        }

        console.log(`🚀 Evaluating code submission from candidate ${candidateId} for question ${questionId}...`);

        // Evaluate code using Piston
        const evaluation = await pistonService.evaluateCode(sourceCode, language, testCases);

        // Calculate actual score based on question marks
        const scorePercentage = evaluation.totalScore;
        const actualScore = (scorePercentage / 100) * question.marks;

        await client.query('BEGIN');

        // Delete previous submission if exists
        await client.query(
            'DELETE FROM coding_submissions WHERE candidate_id = $1 AND question_id = $2',
            [candidateId, questionId]
        );

        // Insert new submission
        const insertQuery = `
            INSERT INTO coding_submissions 
            (candidate_id, question_id, test_id, source_code, language, score, max_score, 
             test_cases_passed, total_test_cases, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'evaluated')
            RETURNING id
        `;

        const submissionResult = await client.query(insertQuery, [
            candidateId, questionId, testId, sourceCode, language,
            actualScore, question.marks, evaluation.testCasesPassed,
            evaluation.totalTestCases
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Code submitted and evaluated successfully',
            data: {
                submissionId: submissionResult.rows[0].id,
                score: actualScore,
                maxScore: question.marks,
                testCasesPassed: evaluation.testCasesPassed,
                totalTestCases: evaluation.totalTestCases,
                results: evaluation.results, // Includes hidden info only if authorized, but here it's for the candidate after submission
                allPassed: evaluation.allPassed
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit code',
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/coding/submissions/:testId
 * Get submission results for a test (if published)
 * Auth: Job Seeker only
 */
router.get('/submissions/:testId', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.testId;

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Check if results are published
        const testQuery = `
            SELECT results_published FROM coding_tests WHERE id = $1
        `;
        const testResult = await pool.query(testQuery, [testId]);

        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        if (!testResult.rows[0].results_published) {
            return res.status(403).json({
                success: false,
                message: 'Results not published yet'
            });
        }

        // Get submissions
        const query = `
            SELECT 
                cs.id, cs.question_id, cs.score, cs.max_score,
                cs.test_cases_passed, cs.total_test_cases,
                cs.submitted_at,
                cq.title as question_title
            FROM coding_submissions cs
            INNER JOIN coding_questions cq ON cs.question_id = cq.id
            WHERE cs.test_id = $1 AND cs.candidate_id = $2
            ORDER BY cq.question_order ASC
        `;

        const result = await pool.query(query, [testId, candidateId]);

        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
});

export default router;
