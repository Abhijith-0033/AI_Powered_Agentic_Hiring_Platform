import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// SMTP Configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create transporter
let transporter = null;

try {
    if (EMAIL_USER && EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: EMAIL_SECURE,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });
        console.log('✅ Email service initialized');
    } else {
        console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
    }
} catch (error) {
    console.error('❌ Failed to initialize email service:', error);
}

/**
 * Send interview invitation email to candidate
 * @param {string} candidateEmail - Recipient email address
 * @param {object} interviewDetails - Interview details
 * @returns {Promise<boolean>} Success status
 */
export const sendInterviewEmail = async (candidateEmail, interviewDetails) => {
    if (!transporter) {
        console.warn('⚠️  Email service not configured. Skipping email send.');
        return false;
    }

    try {
        const {
            candidateName,
            jobTitle,
            companyName,
            interviewDate,
            interviewTime,
            meetingLink,
            recruiterName
        } = interviewDetails;

        // Format date and time nicely
        const formattedDate = new Date(interviewDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Email HTML template
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Interview Scheduled</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
        }
        .email-body {
            padding: 30px 20px;
        }
        .detail-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #555;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .cta-button:hover {
            background: #5568d3;
        }
        .email-footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>🎉 Interview Scheduled</h1>
        </div>
        
        <div class="email-body">
            <p>Dear ${candidateName},</p>
            
            <p>Great news! Your interview has been scheduled for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            
            <div class="detail-box">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span> ${formattedDate}
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Time:</span> ${interviewTime}
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Interviewer:</span> ${recruiterName || 'To be assigned'}
                </div>
                <div class="detail-row">
                    <span class="detail-label">💼 Position:</span> ${jobTitle}
                </div>
            </div>
            
            <p><strong>Join the Interview:</strong></p>
            <p>Click the button below to join your video interview at the scheduled time:</p>
            
            <center>
                <a href="${meetingLink}" class="cta-button">Join Video Interview</a>
            </center>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                <strong>Note:</strong> Please join the call 2-3 minutes before the scheduled time. Make sure your camera and microphone are working properly.
            </p>
            
            <p>Good luck with your interview!</p>
            
            <p>Best regards,<br>
            <strong>AI Hiring Platform Team</strong></p>
        </div>
        
        <div class="email-footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If you have any questions, please contact your recruiter directly.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send email
        const info = await transporter.sendMail({
            from: `"AI Hiring Platform" <${EMAIL_USER}>`,
            to: candidateEmail,
            subject: `Interview Scheduled: ${jobTitle} at ${companyName}`,
            html: htmlContent
        });

        console.log(`✅ Interview email sent to ${candidateEmail}:`, info.messageId);
        return true;

    } catch (error) {
        console.error('❌ Error sending interview email:', error);
        // Don't throw error - graceful degradation
        return false;
    }
};

export default {
    sendInterviewEmail
};
