/**
 * Break-Aware Round-Robin Interview Scheduling Algorithm
 * 
 * This service implements a formal scheduling algorithm that:
 * - Fairly distributes interviews among interviewers using Round-Robin
 * - Automatically inserts breaks after N interviews per interviewer
 * - Ensures deterministic scheduling (after initial randomization)
 * - Prevents interviewer overload and overlapping schedules
 */

/**
 * Fisher-Yates Shuffle Algorithm
 * Randomizes interviewer order for fair initial assignment
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 * @param {string} timeString - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:MM format
 */
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Main Scheduling Algorithm: Break-Aware Round-Robin
 * 
 * Algorithm Steps:
 * 1. Randomize interviewer order (Fisher-Yates shuffle) for fairness
 * 2. Initialize tracking: current time per interviewer, interview counts
 * 3. For each candidate:
 *    a. Select next interviewer (round-robin)
 *    b. Assign interview at interviewer's current available time
 *    c. Increment interview count for that interviewer
 *    d. Update interviewer's next available time
 *    e. Check if break needed (count % breakFrequency === 0)
 *    f. If break needed: add break duration to interviewer's timeline
 * 4. Return scheduled interviews with time slots and assignments
 * 
 * @param {Array} candidates - Array of candidate objects
 * @param {Array} interviewers - Array of interviewer objects {name, email}
 * @param {Object} config - Configuration object
 * @param {string} config.startTime - Start time (HH:MM)
 * @param {number} config.slotDuration - Interview duration in minutes
 * @param {number} config.breakDuration - Break duration in minutes
 * @param {number} config.breakFrequency - Number of interviews before break
 * @param {string} config.interviewDate - Interview date
 * @returns {Array} Scheduled interviews with assignments
 */
export function scheduleInterviewsWithRoundRobin(candidates, interviewers, config) {
    const {
        startTime,
        slotDuration,
        breakDuration = 15,
        breakFrequency = 3,
        interviewDate
    } = config;

    console.log('[Scheduling Algorithm] Starting Break-Aware Round-Robin');
    console.log(`[Algorithm] Candidates: ${candidates.length}, Interviewers: ${interviewers.length}`);
    console.log(`[Algorithm] Config: slot=${slotDuration}min, break=${breakDuration}min every ${breakFrequency} interviews`);

    // Step 1: Randomize interviewer order for fairness
    const shuffledInterviewers = shuffleArray(interviewers);
    console.log('[Algorithm] Interviewers randomized for fair distribution');

    // Step 2: Initialize tracking structures
    const startMinutes = timeToMinutes(startTime);

    // Track each interviewer's state
    const interviewerStates = shuffledInterviewers.map((interviewer, index) => ({
        ...interviewer,
        index,
        currentTime: startMinutes,  // Next available time slot
        interviewCount: 0,           // Number of interviews assigned
        totalBreaks: 0               // Number of breaks taken
    }));

    const scheduledInterviews = [];

    // Step 3: Round-Robin Assignment
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        // Select interviewer using round-robin (modulo operation)
        const interviewerIndex = i % interviewerStates.length;
        const interviewer = interviewerStates[interviewerIndex];

        // Calculate time slot for this interview
        const interviewStartTime = interviewer.currentTime;
        const interviewEndTime = interviewStartTime + slotDuration;

        // Create interview assignment
        const interview = {
            applicationId: candidate.application_id,
            candidateId: candidate.candidate_id,
            candidateName: candidate.candidate_name,
            candidateEmail: candidate.candidate_email,
            candidateUserId: candidate.candidate_user_id,
            interviewerName: interviewer.name,
            interviewerEmail: interviewer.email,
            interviewerIndex: interviewer.index,
            startTime: minutesToTime(interviewStartTime),
            endTime: minutesToTime(interviewEndTime),
            interviewDate
        };

        scheduledInterviews.push(interview);

        // Update interviewer's state
        interviewer.interviewCount++;
        interviewer.currentTime = interviewEndTime;

        console.log(`[Algorithm] Assigned candidate #${i + 1} to ${interviewer.name} at ${interview.startTime}-${interview.endTime}`);

        // Step 4: Check if break is needed
        const shouldInsertBreak = (
            interviewer.interviewCount % breakFrequency === 0 &&
            i < candidates.length - 1  // Don't add break after last interview
        );

        if (shouldInsertBreak) {
            // Insert break period
            const breakStart = interviewer.currentTime;
            const breakEnd = breakStart + breakDuration;
            interviewer.currentTime = breakEnd;
            interviewer.totalBreaks++;

            console.log(`[Algorithm] Break inserted for ${interviewer.name}: ${minutesToTime(breakStart)}-${minutesToTime(breakEnd)}`);
        }
    }

    // Log final statistics
    console.log('[Algorithm] Scheduling Complete - Final Distribution:');
    interviewerStates.forEach(interviewer => {
        console.log(`  ${interviewer.name}: ${interviewer.interviewCount} interviews, ${interviewer.totalBreaks} breaks`);
    });

    return scheduledInterviews;
}

/**
 * Legacy sequential scheduling (backward compatibility)
 * Used when no interviewers are provided
 * @param {Array} candidates - Array of candidate objects
 * @param {Object} config - Configuration object
 * @returns {Array} Scheduled interviews without interviewer assignments
 */
export function scheduleInterviewsSequential(candidates, config) {
    const { startTime, slotDuration, interviewDate } = config;

    console.log('[Scheduling] Using sequential mode (no interviewers)');

    const startMinutes = timeToMinutes(startTime);
    const scheduledInterviews = [];

    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        const slotStartMinutes = startMinutes + (i * slotDuration);
        const slotEndMinutes = slotStartMinutes + slotDuration;

        scheduledInterviews.push({
            applicationId: candidate.application_id,
            candidateId: candidate.candidate_id,
            candidateName: candidate.candidate_name,
            candidateEmail: candidate.candidate_email,
            candidateUserId: candidate.candidate_user_id,
            startTime: minutesToTime(slotStartMinutes),
            endTime: minutesToTime(slotEndMinutes),
            interviewDate,
            interviewerName: null,
            interviewerEmail: null,
            interviewerIndex: null
        });
    }

    return scheduledInterviews;
}

export default {
    scheduleInterviewsWithRoundRobin,
    scheduleInterviewsSequential
};
