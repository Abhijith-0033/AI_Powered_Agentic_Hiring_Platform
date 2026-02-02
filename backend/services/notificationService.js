import pool from '../config/db.js';

/**
 * Notification Service
 * Handles creation and delivery of notifications
 */

/**
 * Create an in-app notification for interview scheduling
 * @param {UUID} candidateUserId - The candidate's user_id
 * @param {Object} interviewDetails - Interview information
 * @returns {Promise<Object>} Created notification
 */
export async function createInterviewNotification(candidateUserId, interviewDetails) {
    const { jobTitle, interviewDate, startTime, endTime, mode, meetingLink } = interviewDetails;

    // Format the notification message
    const title = `Interview Scheduled: ${jobTitle}`;

    let message = `You have been selected for an interview!\n\n`;
    message += `Job: ${jobTitle}\n`;
    message += `Date: ${new Date(interviewDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}\n`;
    message += `Time: ${startTime} - ${endTime}\n`;
    message += `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}\n`;

    if (mode === 'online' && meetingLink) {
        message += `Meeting Link: ${meetingLink}\n`;
    }

    message += `\nPlease be prepared and on time. Good luck!`;

    const metadata = {
        jobTitle,
        interviewDate,
        startTime,
        endTime,
        mode,
        meetingLink: meetingLink || null
    };

    try {
        const query = `
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            candidateUserId,
            'interview_scheduled',
            title,
            message,
            JSON.stringify(metadata)
        ];

        const result = await pool.query(query, values);
        return result.rows[0];

    } catch (error) {
        console.error('Error creating interview notification:', error);
        // Non-blocking: notification failure should not prevent interview creation
        return null;
    }
}

/**
 * Future: Send email notification
 * Stub for when email service is configured
 */
export async function sendInterviewEmail(candidateEmail, interviewDetails) {
    // TODO: Implement when email service is available
    console.log(`[Email Stub] Would send email to ${candidateEmail}:`, interviewDetails);
    return { success: false, message: 'Email service not configured' };
}

export default {
    createInterviewNotification,
    sendInterviewEmail
};
