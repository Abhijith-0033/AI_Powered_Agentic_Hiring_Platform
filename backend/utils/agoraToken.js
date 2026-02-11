import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    console.error('❌ Missing Agora credentials in .env file');
    throw new Error('AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in environment variables');
}

/**
 * Generate Agora RTC Token for video calls
 * @param {string} channelName - Unique channel identifier
 * @param {number} uid - User ID (0 for auto-assignment by Agora)
 * @param {string} role - 'publisher' or 'subscriber' (default: 'publisher')
 * @returns {string} Agora RTC token valid for 1 hour
 */
export const generateAgoraToken = (channelName, uid = 0, role = 'publisher') => {
    try {
        // Token expiry time (1 hour from now)
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Determine role (publisher = host, subscriber = audience)
        const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

        // Build token
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uid,
            agoraRole,
            privilegeExpiredTs
        );

        console.log(`✅ Generated Agora token for channel: ${channelName}, role: ${role}`);
        return token;
    } catch (error) {
        console.error('❌ Error generating Agora token:', error);
        throw new Error('Failed to generate Agora video token');
    }
};

/**
 * Generate a unique channel name using UUID
 * @returns {string} UUID-based channel name
 */
export const generateChannelName = () => {
    return `interview-${crypto.randomUUID()}`;
};

export default {
    generateAgoraToken,
    generateChannelName
};
