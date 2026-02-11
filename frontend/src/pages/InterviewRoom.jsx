import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react';
import { joinInterview } from '../services/interviewService';

const InterviewRoom = () => {
    const { channelName } = useParams();
    const navigate = useNavigate();

    const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});

    useEffect(() => {
        joinChannel();
        return () => {
            leaveChannel();
        };
    }, []);

    const joinChannel = async () => {
        try {
            setLoading(true);

            // Get Agora token from backend
            const response = await joinInterview(channelName);
            const { appId, token, uid } = response.data;

            // Join the channel
            await client.join(appId, channelName, token, uid);

            // Create and publish local tracks
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);

            // Play local video
            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
            }

            // Publish local tracks
            await client.publish([audioTrack, videoTrack]);

            // Subscribe to remote users
            client.on('user-published', handleUserPublished);
            client.on('user-unpublished', handleUserUnpublished);
            client.on('user-left', handleUserLeft);

            setIsJoined(true);
            setLoading(false);

        } catch (err) {
            console.error('Failed to join channel:', err);
            setError(err.message || 'Failed to join interview. Please check your permissions and try again.');
            setLoading(false);
        }
    };

    const handleUserPublished = async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
            setRemoteUsers((prevUsers) => {
                const exists = prevUsers.find(u => u.uid === user.uid);
                if (exists) return prevUsers;
                return [...prevUsers, user];
            });
        }

        if (mediaType === 'audio') {
            user.audioTrack?.play();
        }
    };

    const handleUserUnpublished = (user, mediaType) => {
        if (mediaType === 'video') {
            setRemoteUsers((prevUsers) => prevUsers.filter(u => u.uid !== user.uid));
        }
    };

    const handleUserLeft = (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter(u => u.uid !== user.uid));
    };

    useEffect(() => {
        // Play remote videos
        remoteUsers.forEach((user) => {
            const refId = `remote-${user.uid}`;
            const videoElement = remoteVideoRefs.current[refId];
            if (videoElement && user.videoTrack) {
                user.videoTrack.play(videoElement);
            }
        });
    }, [remoteUsers]);

    const toggleVideo = async () => {
        if (localVideoTrack) {
            await localVideoTrack.setEnabled(!isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = async () => {
        if (localAudioTrack) {
            await localAudioTrack.setEnabled(!isAudioEnabled);
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const leaveChannel = async () => {
        // Stop and close local tracks
        if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
        }
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
        }

        // Leave the channel
        if (isJoined) {
            await client.leave();
        }

        // Clean up
        setRemoteUsers([]);
        setLocalVideoTrack(null);
        setLocalAudioTrack(null);
        setIsJoined(false);
    };

    const handleLeave = async () => {
        await leaveChannel();
        navigate(-1); // Go back to previous page
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
                    <p className="mt-6 text-white text-xl">Joining interview...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PhoneOff className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-semibold">Interview Room</h1>
                    <p className="text-gray-400 text-sm">Channel: {channelName?.substring(0, 20)}...</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-green-500 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">Live</span>
                    </div>
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 p-6 grid gap-4" style={{
                gridTemplateColumns: remoteUsers.length > 0 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr'
            }}>
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    <div
                        ref={localVideoRef}
                        className="w-full h-full min-h-[300px]"
                        style={{ aspectRatio: '16/9' }}
                    />
                    {!isVideoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <VideoOff className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-white font-medium">Camera Off</p>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 px-3 py-1 bg-black bg-opacity-60 rounded-full">
                        <span className="text-white text-sm font-medium">You</span>
                    </div>
                    {!isAudioEnabled && (
                        <div className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <MicOff className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Remote Videos */}
                {remoteUsers.map((user) => (
                    <div key={user.uid} className="relative bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                        <div
                            ref={(el) => remoteVideoRefs.current[`remote-${user.uid}`] = el}
                            className="w-full h-full min-h-[300px]"
                            style={{ aspectRatio: '16/9' }}
                        />
                        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black bg-opacity-60 rounded-full">
                            <span className="text-white text-sm font-medium">Participant</span>
                        </div>
                    </div>
                ))}

                {/* Waiting for other participant */}
                {remoteUsers.length === 0 && (
                    <div className="bg-gray-800 rounded-lg flex items-center justify-center shadow-xl" style={{ minHeight: '300px' }}>
                        <div className="text-center">
                            <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-white text-lg font-medium">Waiting for other participant...</p>
                            <p className="text-gray-400 text-sm mt-2">They will appear here once they join</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 px-6 py-6">
                <div className="flex items-center justify-center gap-4">
                    {/* Microphone Toggle */}
                    <button
                        onClick={toggleAudio}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isAudioEnabled
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                        title={isAudioEnabled ? "Mute" : "Unmute"}
                    >
                        {isAudioEnabled ? (
                            <Mic className="w-6 h-6 text-white" />
                        ) : (
                            <MicOff className="w-6 h-6 text-white" />
                        )}
                    </button>

                    {/* Video Toggle */}
                    <button
                        onClick={toggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isVideoEnabled
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                        {isVideoEnabled ? (
                            <Video className="w-6 h-6 text-white" />
                        ) : (
                            <VideoOff className="w-6 h-6 text-white" />
                        )}
                    </button>

                    {/* Leave Call */}
                    <button
                        onClick={handleLeave}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg"
                        title="Leave interview"
                    >
                        <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                </div>
                <p className="text-center text-gray-400 text-sm mt-4">
                    Click the red button to leave the interview
                </p>
            </div>
        </div>
    );
};

export default InterviewRoom;
