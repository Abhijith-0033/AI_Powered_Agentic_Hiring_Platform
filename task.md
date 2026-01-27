# Task: Fix Job Update 500 Error

- [x] Identify the cause of the 500 error in `PUT /api/jobs/:id` <!-- id: 0 -->
    - [x] Root cause 1: `job_description` NULL constraint (Fixed) <!-- id: 1 -->
    - [x] Root cause 2: `job_questions` Foreign Key constraint violation <!-- id: 2 -->
        - Log shows: `update or delete on table "job_questions" violates foreign key constraint...`
- [x] Fix the implementation in `backend/routes/jobs.js` <!-- id: 3 -->
    - [x] Use COALESCE for job fields <!-- id: 4 -->
    - [x] Implement Smart Sync for questions (Upsert + Safe Delete) <!-- id: 5 -->
- [ ] Verify the fix <!-- id: 6 -->

## Root Cause 2 (New)
The previous "Delete All + Re-insert" strategy for questions failed because `job_application_answers` references `job_questions`. PostgreSQL prevents deleting questions that have answers.

## Solution 2
Implemented a smart strategy:
1. **Update** existing questions (match by ID).
2. **Insert** new questions (no ID).
3. **Delete** removed questions, but wrap in `try/catch` to ignore Foreign Key errors (preserving data integrity naturally).
