import express from 'express';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = express.Router();

// ============================================================
// RECRUITER ENDPOINTS
// ============================================================

/**
 * POST /api/tests
 * Create a new test with questions
 * Auth: Recruiter only
 */
router.post('/', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const { jobId, title, description, instructions, startDate, startTime, endDate, endTime, durationMinutes, questions } = req.body;

        // Validation
        if (!jobId || !title || !startDate || !startTime || !endDate || !endTime || !durationMinutes) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one question is required' });
        }

        // Verify recruiter owns the job
        const ownershipQuery = `
            SELECT jp.job_id FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE jp.job_id = $1 AND c.created_by = $2
        `;
        const ownershipResult = await client.query(ownershipQuery, [jobId, userId]);
        if (ownershipResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Access denied or job not found' });
        }

        await client.query('BEGIN');

        // Create test
        const testQuery = `
            INSERT INTO tests (job_id, recruiter_id, title, description, instructions, start_date, start_time, end_date, end_time, duration_minutes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
            RETURNING id
        `;
        const testResult = await client.query(testQuery, [
            jobId, userId, title, description || '', instructions || '',
            startDate, startTime, endDate, endTime, durationMinutes
        ]);
        const testId = testResult.rows[0].id;

        // Insert questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            // Validate MCQ options (max 4)
            if (q.questionType === 'objective' && q.options && q.options.length > 4) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: `Question ${i + 1}: Maximum 4 options allowed for objective questions` });
            }

            const qQuery = `
                INSERT INTO test_questions (test_id, question_text, question_type, options, expected_answer, question_order)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await client.query(qQuery, [
                testId, q.questionText, q.questionType,
                q.questionType === 'objective' ? JSON.stringify(q.options) : null,
                q.expectedAnswer, i + 1
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: { testId }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating test:', error);
        res.status(500).json({ success: false, message: 'Failed to create test', error: error.message });
    } finally {
        client.release();
    }
});

/**
 * GET /api/tests
 * List all tests for the logged-in recruiter
 * Auth: Recruiter only
 */
router.get('/', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;

        const query = `
            SELECT t.*, jp.job_title, 
                   (SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.id) as question_count,
                   (SELECT COUNT(*) FROM test_attempts ta WHERE ta.test_id = t.id AND ta.status IN ('submitted', 'evaluated')) as submission_count
            FROM tests t
            JOIN job_postings jp ON t.job_id = jp.job_id
            WHERE t.recruiter_id = $1
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tests' });
    }
});

/**
 * GET /api/tests/my-tests
 * Get all tests assigned to the logged-in candidate
 * NOTE: This MUST be defined before /:id to avoid route conflicts
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

        // Fetch all tests assigned to candidate via job_applications
        const query = `
            SELECT t.id, t.title, t.description, t.instructions,
                   t.start_date, t.start_time, t.end_date, t.end_time,
                   t.duration_minutes, t.status as test_status, t.results_published,
                   jp.job_title, comp.name as company_name,
                   ja.id as application_id, ja.test_status as my_test_status,
                   ta.id as attempt_id, ta.status as attempt_status,
                   ta.total_score, ta.max_score, ta.submitted_at
            FROM job_applications ja
            JOIN tests t ON ja.test_id = t.id
            JOIN job_postings jp ON ja.job_id = jp.job_id
            JOIN companies comp ON jp.company_id = comp.id
            LEFT JOIN test_attempts ta ON ta.test_id = t.id AND ta.candidate_id = $1
            WHERE ja.candidate_id = $1 AND t.status = 'published'
            ORDER BY t.start_date ASC, t.start_time ASC
        `;
        const result = await pool.query(query, [candidateId]);

        // Categorize tests
        const now = new Date();
        const upcoming = [];
        const ongoing = [];
        const completed = [];

        for (const test of result.rows) {
            const startDateTime = new Date(`${test.start_date}T${test.start_time}`);
            const endDateTime = new Date(`${test.end_date}T${test.end_time}`);

            if (test.attempt_status === 'submitted' || test.attempt_status === 'evaluated') {
                completed.push(test);
            } else if (now < startDateTime) {
                upcoming.push(test);
            } else if (now >= startDateTime && now <= endDateTime) {
                ongoing.push(test);
            } else {
                // Past window, never attempted
                completed.push({ ...test, expired: true });
            }
        }

        res.json({ success: true, data: { upcoming, ongoing, completed } });

    } catch (error) {
        console.error('Error fetching my tests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tests' });
    }
});

/**
 * GET /api/tests/:id
 * Get test details with questions (recruiter view - includes expected answers)
 * Auth: Recruiter only
 */
router.get('/:id', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        const testQuery = `
            SELECT t.*, jp.job_title
            FROM tests t
            JOIN job_postings jp ON t.job_id = jp.job_id
            WHERE t.id = $1 AND t.recruiter_id = $2
        `;
        const testResult = await pool.query(testQuery, [testId, userId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or access denied' });
        }

        const questionsQuery = `
            SELECT id, question_text, question_type, options, expected_answer, question_order
            FROM test_questions
            WHERE test_id = $1
            ORDER BY question_order
        `;
        const questionsResult = await pool.query(questionsQuery, [testId]);

        res.json({
            success: true,
            data: {
                ...testResult.rows[0],
                questions: questionsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching test details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch test details' });
    }
});

/**
 * PUT /api/tests/:id
 * Update test details and questions (only if draft)
 * Auth: Recruiter only
 */
router.put('/:id', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const testId = req.params.id;
        const { title, description, instructions, startDate, startTime, endDate, endTime, durationMinutes, questions } = req.body;

        // Verify ownership and check editability
        const testCheck = await client.query(
            'SELECT id, status, start_date, start_time FROM tests WHERE id = $1 AND recruiter_id = $2',
            [testId, userId]
        );
        if (testCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or access denied' });
        }
        const existingTest = testCheck.rows[0];
        // Allow editing if draft, or if published but test hasn't started yet
        if (existingTest.status === 'draft') {
            // Always editable
        } else if (existingTest.status === 'published') {
            const startDateTime = new Date(`${existingTest.start_date}T${existingTest.start_time}`);
            if (new Date() >= startDateTime) {
                return res.status(400).json({ success: false, message: 'Cannot edit a test that has already started' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Cannot edit this test' });
        }

        await client.query('BEGIN');

        // Update test details
        await client.query(`
            UPDATE tests SET title=$1, description=$2, instructions=$3,
            start_date=$4, start_time=$5, end_date=$6, end_time=$7,
            duration_minutes=$8, updated_at=NOW()
            WHERE id=$9
        `, [title, description, instructions, startDate, startTime, endDate, endTime, durationMinutes, testId]);

        // Replace questions
        if (questions && questions.length > 0) {
            await client.query('DELETE FROM test_questions WHERE test_id = $1', [testId]);
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (q.questionType === 'objective' && q.options && q.options.length > 4) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: `Question ${i + 1}: Maximum 4 options allowed` });
                }
                await client.query(`
                    INSERT INTO test_questions (test_id, question_text, question_type, options, expected_answer, question_order)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [testId, q.questionText, q.questionType,
                    q.questionType === 'objective' ? JSON.stringify(q.options) : null,
                    q.expectedAnswer, i + 1
                ]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Test updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating test:', error);
        res.status(500).json({ success: false, message: 'Failed to update test' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/tests/:id
 * Delete a test (cascades to questions, attempts, answers)
 * Auth: Recruiter only
 */
router.delete('/:id', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        const result = await pool.query(
            'DELETE FROM tests WHERE id = $1 AND recruiter_id = $2 RETURNING id',
            [testId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or access denied' });
        }

        res.json({ success: true, message: 'Test deleted successfully' });
    } catch (error) {
        console.error('Error deleting test:', error);
        res.status(500).json({ success: false, message: 'Failed to delete test' });
    }
});

/**
 * POST /api/tests/:id/publish
 * Publish test to candidates (makes it visible)
 * Auth: Recruiter only
 */
router.post('/:id/publish', auth, roleGuard('recruiter'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Verify ownership
        const testCheck = await client.query(
            'SELECT id, job_id, status FROM tests WHERE id = $1 AND recruiter_id = $2',
            [testId, userId]
        );
        if (testCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or access denied' });
        }

        const test = testCheck.rows[0];

        // Check if test has questions
        const qCount = await client.query('SELECT COUNT(*) FROM test_questions WHERE test_id = $1', [testId]);
        if (parseInt(qCount.rows[0].count) === 0) {
            return res.status(400).json({ success: false, message: 'Cannot publish a test with no questions' });
        }

        await client.query('BEGIN');

        // Update test status
        await client.query(
            "UPDATE tests SET status = 'published', updated_at = NOW() WHERE id = $1",
            [testId]
        );

        // Update all applications for this job with test assignment
        await client.query(`
            UPDATE job_applications 
            SET test_id = $1, test_status = 'pending'
            WHERE job_id = $2 AND test_id IS NULL
        `, [testId, test.job_id]);

        // Create notification entries for candidates
        const candidatesQuery = `
            SELECT c.user_id, c.name, jp.job_title
            FROM job_applications ja
            JOIN candidates c ON ja.candidate_id = c.id
            JOIN job_postings jp ON ja.job_id = jp.job_id
            WHERE ja.job_id = $1
        `;
        const candidates = await client.query(candidatesQuery, [test.job_id]);

        for (const candidate of candidates.rows) {
            try {
                await client.query(`
                    INSERT INTO notifications (user_id, type, title, message, metadata)
                    VALUES ($1, 'test_assigned', 'New Test Assigned', $2, $3)
                `, [
                    candidate.user_id,
                    `A new test has been assigned to you for the position: ${candidate.job_title}`,
                    JSON.stringify({ testId, jobId: test.job_id })
                ]);
            } catch (notifError) {
                console.error('Error creating notification:', notifError.message);
                // Don't fail the publish for notification errors
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Test published! ${candidates.rows.length} candidates notified.`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error publishing test:', error);
        res.status(500).json({ success: false, message: 'Failed to publish test' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/tests/:id/results
 * Get all candidate results for a test
 * Auth: Recruiter only
 */
router.get('/:id/results', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Verify ownership
        const testCheck = await pool.query(
            'SELECT id, title, results_published FROM tests WHERE id = $1 AND recruiter_id = $2',
            [testId, userId]
        );
        if (testCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or access denied' });
        }

        // Get all attempts with candidate info
        const attemptsQuery = `
            SELECT 
                ta.id as attempt_id, ta.started_at, ta.submitted_at, ta.auto_submitted,
                ta.time_taken_seconds, ta.total_score, ta.max_score, ta.status as attempt_status,
                ta.violation_count,
                c.name as candidate_name, c.email as candidate_email,
                ja.id as application_id
            FROM test_attempts ta
            JOIN candidates c ON ta.candidate_id = c.id
            JOIN job_applications ja ON ta.application_id = ja.id
            WHERE ta.test_id = $1
            ORDER BY ta.submitted_at DESC NULLS LAST
        `;
        const attempts = await pool.query(attemptsQuery, [testId]);

        // For each attempt, get answers
        const results = [];
        for (const attempt of attempts.rows) {
            const answersQuery = `
                SELECT tans.candidate_answer, tans.is_correct,
                       tq.question_text, tq.question_type, tq.expected_answer, tq.options, tq.question_order
                FROM test_answers tans
                JOIN test_questions tq ON tans.question_id = tq.id
                WHERE tans.attempt_id = $1
                ORDER BY tq.question_order
            `;
            const answers = await pool.query(answersQuery, [attempt.attempt_id]);
            results.push({ ...attempt, answers: answers.rows });
        }

        res.json({
            success: true,
            data: {
                test: testCheck.rows[0],
                results
            }
        });

    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch test results' });
    }
});

/**
 * POST /api/tests/:id/publish-results
 * Make test results visible to candidates
 * Auth: Recruiter only
 */
router.post('/:id/publish-results', auth, roleGuard('recruiter'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        const result = await pool.query(
            "UPDATE tests SET results_published = true, updated_at = NOW() WHERE id = $1 AND recruiter_id = $2 RETURNING id",
            [testId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or access denied' });
        }

        res.json({ success: true, message: 'Results published to candidates' });
    } catch (error) {
        console.error('Error publishing results:', error);
        res.status(500).json({ success: false, message: 'Failed to publish results' });
    }
});

// ============================================================
// CANDIDATE ENDPOINTS
// ============================================================

/**
 * GET /api/tests/:id/attempt
 * Get test for attempt (candidate view - NO expected answers)
 * Auth: Job Seeker only
 */
router.get('/:id/attempt', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        // Get candidate ID
        const candidateRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Verify candidate is assigned this test
        const assignmentCheck = await pool.query(
            'SELECT ja.id FROM job_applications ja WHERE ja.test_id = $1 AND ja.candidate_id = $2',
            [testId, candidateId]
        );
        if (assignmentCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this test' });
        }
        const applicationId = assignmentCheck.rows[0].id;

        // Get test details
        const testQuery = `
            SELECT t.id, t.title, t.description, t.instructions, 
                   t.start_date, t.start_time, t.end_date, t.end_time,
                   t.duration_minutes
            FROM tests t WHERE t.id = $1 AND t.status = 'published'
        `;
        const testResult = await pool.query(testQuery, [testId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        const test = testResult.rows[0];
        const now = new Date();
        const startDateTime = new Date(`${test.start_date}T${test.start_time}`);
        const endDateTime = new Date(`${test.end_date}T${test.end_time}`);

        // Time-based access control
        if (now < startDateTime) {
            return res.status(403).json({
                success: false,
                message: `Test will start at ${startDateTime.toLocaleString()}`,
                data: { notStarted: true, startTime: startDateTime }
            });
        }
        if (now > endDateTime) {
            return res.status(403).json({
                success: false,
                message: 'Test has expired',
                data: { expired: true }
            });
        }

        // Check if already attempted
        const existingAttempt = await pool.query(
            'SELECT id, status, started_at FROM test_attempts WHERE test_id = $1 AND candidate_id = $2',
            [testId, candidateId]
        );

        if (existingAttempt.rows.length > 0 && existingAttempt.rows[0].status === 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted this test. Reattempts are not allowed.'
            });
        }

        // Get questions WITHOUT expected answers
        const questionsQuery = `
            SELECT id, question_text, question_type, options, question_order
            FROM test_questions
            WHERE test_id = $1
            ORDER BY question_order
        `;
        const questionsResult = await pool.query(questionsQuery, [testId]);

        // Create or resume attempt
        let attemptId;
        let startedAt;
        if (existingAttempt.rows.length > 0 && existingAttempt.rows[0].status === 'in_progress') {
            attemptId = existingAttempt.rows[0].id;
            startedAt = existingAttempt.rows[0].started_at;

            // Update last_active_at
            await pool.query('UPDATE test_attempts SET last_active_at = NOW() WHERE id = $1', [attemptId]);

            // Get existing answers for resume
            const existingAnswers = await pool.query(
                'SELECT question_id, candidate_answer FROM test_answers WHERE attempt_id = $1',
                [attemptId]
            );

            return res.json({
                success: true,
                data: {
                    test,
                    questions: questionsResult.rows,
                    attemptId,
                    startedAt,
                    existingAnswers: existingAnswers.rows,
                    resumed: true
                }
            });
        } else {
            // Create new attempt
            const attemptResult = await pool.query(`
                INSERT INTO test_attempts (test_id, candidate_id, application_id, started_at, status)
                VALUES ($1, $2, $3, NOW(), 'in_progress')
                RETURNING id, started_at
            `, [testId, candidateId, applicationId]);
            attemptId = attemptResult.rows[0].id;
            startedAt = attemptResult.rows[0].started_at;
        }

        res.json({
            success: true,
            data: {
                test,
                questions: questionsResult.rows,
                attemptId,
                startedAt,
                existingAnswers: [],
                resumed: false
            }
        });

    } catch (error) {
        console.error('Error getting test for attempt:', error);
        res.status(500).json({ success: false, message: 'Failed to load test' });
    }
});

/**
 * POST /api/tests/:id/submit
 * Submit test answers
 * Auth: Job Seeker only
 */
router.post('/:id/submit', auth, roleGuard('job_seeker'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const testId = req.params.id;
        const { attemptId, answers, autoSubmitted } = req.body;

        // Get candidate ID
        const candidateRes = await client.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate profile not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Verify attempt belongs to candidate
        const attemptCheck = await client.query(
            'SELECT id, started_at, status, application_id FROM test_attempts WHERE id = $1 AND candidate_id = $2 AND test_id = $3',
            [attemptId, candidateId, testId]
        );
        if (attemptCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Invalid attempt' });
        }

        const attempt = attemptCheck.rows[0];
        if (attempt.status === 'submitted') {
            return res.status(400).json({ success: false, message: 'Test already submitted' });
        }

        // Get test time window for grace period check
        const testCheck = await client.query(
            'SELECT end_date, end_time, duration_minutes FROM tests WHERE id = $1',
            [testId]
        );
        const test = testCheck.rows[0];
        const endDateTime = new Date(`${test.end_date}T${test.end_time}`);
        const graceEndTime = new Date(endDateTime.getTime() + 2 * 60 * 1000); // 2 min grace
        const now = new Date();

        if (now > graceEndTime && !autoSubmitted) {
            return res.status(400).json({ success: false, message: 'Submission window has closed' });
        }

        await client.query('BEGIN');

        // Get expected answers for scoring
        const expectedQuery = `
            SELECT id, question_type, expected_answer FROM test_questions WHERE test_id = $1
        `;
        const expectedResult = await client.query(expectedQuery, [testId]);
        const expectedMap = {};
        expectedResult.rows.forEach(q => { expectedMap[q.id] = q; });

        // Delete any existing answers for this attempt (in case of re-save during resume)
        await client.query('DELETE FROM test_answers WHERE attempt_id = $1', [attemptId]);

        // Insert answers and calculate score
        let totalScore = 0;
        const maxScore = expectedResult.rows.length;

        for (const answer of (answers || [])) {
            const expected = expectedMap[answer.questionId];
            if (!expected) continue;

            let isCorrect = false;
            if (expected.question_type === 'objective') {
                isCorrect = (answer.candidateAnswer || '').trim().toLowerCase() === (expected.expected_answer || '').trim().toLowerCase();
            } else {
                // Descriptive: exact match (case-insensitive, trimmed)
                isCorrect = (answer.candidateAnswer || '').trim().toLowerCase() === (expected.expected_answer || '').trim().toLowerCase();
            }

            if (isCorrect) totalScore++;

            await client.query(`
                INSERT INTO test_answers (attempt_id, question_id, candidate_answer, is_correct)
                VALUES ($1, $2, $3, $4)
            `, [attemptId, answer.questionId, answer.candidateAnswer || '', isCorrect]);
        }

        // Calculate time taken
        const startedAt = new Date(attempt.started_at);
        const timeTakenSeconds = Math.floor((now - startedAt) / 1000);

        // Update attempt
        await client.query(`
            UPDATE test_attempts 
            SET status = 'submitted', submitted_at = NOW(), auto_submitted = $1,
                time_taken_seconds = $2, total_score = $3, max_score = $4
            WHERE id = $5
        `, [autoSubmitted || false, timeTakenSeconds, totalScore, maxScore, attemptId]);

        // Update job_applications
        const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        await client.query(`
            UPDATE job_applications 
            SET test_score = $1, test_status = 'completed', test_attempted_at = NOW()
            WHERE id = $2
        `, [scorePercentage, attempt.application_id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Test submitted successfully',
            data: {
                totalScore,
                maxScore,
                scorePercentage: Math.round(scorePercentage * 100) / 100,
                timeTakenSeconds
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting test:', error);
        res.status(500).json({ success: false, message: 'Failed to submit test' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/tests/:id/save-progress
 * Save answers in progress (for resume support)
 * Auth: Job Seeker only
 */
router.post('/:id/save-progress', auth, roleGuard('job_seeker'), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        const testId = req.params.id;
        const { attemptId, answers } = req.body;

        const candidateRes = await client.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Verify attempt
        const attemptCheck = await client.query(
            "SELECT id FROM test_attempts WHERE id = $1 AND candidate_id = $2 AND test_id = $3 AND status = 'in_progress'",
            [attemptId, candidateId, testId]
        );
        if (attemptCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Invalid or completed attempt' });
        }

        await client.query('BEGIN');

        // Delete existing answers and re-insert
        await client.query('DELETE FROM test_answers WHERE attempt_id = $1', [attemptId]);

        for (const answer of (answers || [])) {
            await client.query(`
                INSERT INTO test_answers (attempt_id, question_id, candidate_answer)
                VALUES ($1, $2, $3)
            `, [attemptId, answer.questionId, answer.candidateAnswer || '']);
        }

        // Update last_active_at
        await client.query('UPDATE test_attempts SET last_active_at = NOW() WHERE id = $1', [attemptId]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Progress saved' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving progress:', error);
        res.status(500).json({ success: false, message: 'Failed to save progress' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/tests/:id/my-result
 * Get candidate's own result for a test (only if results published)
 * Auth: Job Seeker only
 */
router.get('/:id/my-result', auth, roleGuard('job_seeker'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const testId = req.params.id;

        const candidateRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
        if (candidateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        const candidateId = candidateRes.rows[0].id;

        // Check if results are published
        const testCheck = await pool.query('SELECT results_published, title FROM tests WHERE id = $1', [testId]);
        if (testCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        // Get attempt
        const attemptQuery = `
            SELECT ta.total_score, ta.max_score, ta.time_taken_seconds, ta.submitted_at, ta.auto_submitted
            FROM test_attempts ta
            WHERE ta.test_id = $1 AND ta.candidate_id = $2 AND ta.status IN ('submitted', 'evaluated')
        `;
        const attemptResult = await pool.query(attemptQuery, [testId, candidateId]);
        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No submission found' });
        }

        const attempt = attemptResult.rows[0];

        if (!testCheck.rows[0].results_published) {
            return res.json({
                success: true,
                data: {
                    title: testCheck.rows[0].title,
                    resultsPublished: false,
                    message: 'Results have not been published yet. Please check back later.'
                }
            });
        }

        // Get detailed answers
        const answersQuery = `
            SELECT tans.candidate_answer, tans.is_correct,
                   tq.question_text, tq.question_type, tq.expected_answer, tq.options, tq.question_order
            FROM test_answers tans
            JOIN test_questions tq ON tans.question_id = tq.id
            WHERE tans.attempt_id = (
                SELECT id FROM test_attempts WHERE test_id = $1 AND candidate_id = $2 LIMIT 1
            )
            ORDER BY tq.question_order
        `;
        const answersResult = await pool.query(answersQuery, [testId, candidateId]);

        res.json({
            success: true,
            data: {
                title: testCheck.rows[0].title,
                resultsPublished: true,
                totalScore: attempt.total_score,
                maxScore: attempt.max_score,
                scorePercentage: attempt.max_score > 0 ? Math.round((attempt.total_score / attempt.max_score) * 10000) / 100 : 0,
                timeTakenSeconds: attempt.time_taken_seconds,
                submittedAt: attempt.submitted_at,
                autoSubmitted: attempt.auto_submitted,
                answers: answersResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch result' });
    }
});

export default router;
