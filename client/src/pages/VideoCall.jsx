import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { io } from 'socket.io-client';
import { useApp } from '../context/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export default function VideoCall() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useApp();

    // Get params from URL
    const therapySessionId = searchParams.get('therapySessionId');
    const roomIdParam = searchParams.get('roomId');
    const patientName = searchParams.get('patient') || 'Patient';
    const therapistName = searchParams.get('therapist') || 'Therapist';

    // Use roomId from URL or generate from sessionId
    const roomId = roomIdParam || `room-${therapySessionId || Date.now()}`;

    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('initializing');
    const [hasRemote, setHasRemote] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const callStartTimeRef = useRef(null);

    // Initialize call on mount
    useEffect(() => {
        console.log('=== VideoCall Component Mounted ===');
        console.log('Room ID:', roomId);
        console.log('Session ID:', therapySessionId);
        console.log('User:', user);

        initializeCall();

        return () => {
            cleanup();
        };
    }, []);

    // Call duration timer
    useEffect(() => {
        if (connectionStatus === 'connected' && !callStartTimeRef.current) {
            callStartTimeRef.current = Date.now();
        }

        const interval = setInterval(() => {
            if (callStartTimeRef.current) {
                const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                setCallDuration(duration);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [connectionStatus]);

    const initializeCall = async () => {
        try {
            console.log('Initializing call...');
            setConnectionStatus('connecting');

            // 1. Get local media stream
            console.log('Requesting media permissions...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                console.log('Got local stream:', stream.id);
            } catch (mediaError) {
                console.error('Media access error:', mediaError);

                let errorMessage = 'Could not access camera/microphone.\n\n';

                if (mediaError.name === 'NotReadableError') {
                    errorMessage += '❌ DEVICE IN USE\n\n';
                    errorMessage += 'Your camera/microphone is already being used.\n\n';
                    errorMessage += 'SOLUTIONS:\n';
                    errorMessage += '• Close other tabs using the camera (like another video call tab)\n';
                    errorMessage += '• Use a different browser (Chrome for one user, Edge for the other)\n';
                    errorMessage += '• Close apps like Zoom, Teams, OBS, etc.\n';
                    errorMessage += '• Restart your browser\n\n';
                    errorMessage += 'TIP: Test with therapist in Chrome and patient in Edge!';
                } else if (mediaError.name === 'NotAllowedError') {
                    errorMessage += '❌ PERMISSION DENIED\n\n';
                    errorMessage += 'Please allow camera and microphone access in your browser settings.';
                } else if (mediaError.name === 'NotFoundError') {
                    errorMessage += '❌ NO DEVICE FOUND\n\n';
                    errorMessage += 'No camera or microphone detected on your system.';
                } else {
                    errorMessage += `Error: ${mediaError.message}`;
                }

                alert(errorMessage);
                setConnectionStatus('error');
                return;
            }

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // 2. Create peer connection
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnectionRef.current = pc;
            console.log('Created peer connection');

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                console.log('Added local track:', track.kind);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('Received remote track:', event.track.kind);
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setHasRemote(true);
                    setConnectionStatus('connected');
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && socketRef.current) {
                    console.log('Sending ICE candidate');
                    socketRef.current.emit('ice-candidate', {
                        candidate: event.candidate,
                        roomId
                    });
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setConnectionStatus('connected');
                } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    setConnectionStatus('disconnected');
                    setHasRemote(false);
                }
            };

            // 3. Connect to signaling server
            console.log('Connecting to signaling server:', API_BASE_URL);
            const socket = io(API_BASE_URL, {
                transports: ['websocket', 'polling']
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
                const userId = user?.id || `anonymous-${Date.now()}`;
                const role = user?.role || 'user';

                console.log('Joining room:', { roomId, userId, role });
                socket.emit('join-room', { roomId, userId, role });
            });

            socket.on('user-joined', async ({ userId: otherUserId, role: otherRole }) => {
                console.log(`User joined: ${otherRole} ${otherUserId}`);
                setConnectionStatus('connecting');

                // Create and send offer
                try {
                    console.log('Creating offer...');
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    console.log('Sending offer');
                    socket.emit('offer', { offer, roomId });
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            });

            socket.on('offer', async ({ offer, fromUserId }) => {
                console.log('Received offer from:', fromUserId);
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    console.log('Creating answer...');
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log('Sending answer');
                    socket.emit('answer', { answer, roomId });
                } catch (error) {
                    console.error('Error handling offer:', error);
                }
            });

            socket.on('answer', async ({ answer, fromUserId }) => {
                console.log('Received answer from:', fromUserId);
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('Remote description set');
                } catch (error) {
                    console.error('Error handling answer:', error);
                }
            });

            socket.on('ice-candidate', async ({ candidate }) => {
                console.log('Received ICE candidate');
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            });

            socket.on('user-left', ({ userId }) => {
                console.log('User left:', userId);
                setHasRemote(false);
                setConnectionStatus('disconnected');
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
                setConnectionStatus('disconnected');
            });

        } catch (error) {
            console.error('Error initializing call:', error);
            alert(`Could not access camera/microphone: ${error.message}\n\nPlease check your browser permissions.`);
            setConnectionStatus('error');
        }
    };

    const cleanup = () => {
        console.log('Cleaning up...');

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        cleanup();
        navigate(-1);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
        }}>
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '1.5rem 2rem',
                background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.9) 0%, transparent 100%)',
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div>
                    <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Session with {user?.role === 'therapist' ? patientName : therapistName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            background: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                            border: `1px solid ${connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: connectionStatus === 'connected' ? '#10b981' : '#f59e0b',
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: connectionStatus === 'connected' ? '#10b981' : '#f59e0b',
                            }} />
                            {connectionStatus}
                        </span>
                        {connectionStatus === 'connected' && (
                            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                                {formatDuration(callDuration)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: '1rem',
                padding: '6rem 2rem 8rem',
            }}>
                {/* Remote Video (Large) */}
                <div style={{
                    position: 'relative',
                    background: '#1a1a24',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    {!hasRemote && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '1rem',
                            background: '#1a1a24',
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                border: '4px solid rgba(255, 255, 255, 0.2)',
                                borderTopColor: '#667eea',
                                animation: 'spin 1s linear infinite',
                            }} />
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.125rem' }}>
                                {user?.role === 'therapist' ? `Waiting for ${patientName}...` : 'Waiting for therapist...'}
                            </p>
                            <style>{`
                                @keyframes spin {
                                    to { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '1rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                    }}>
                        {user?.role === 'therapist' ? patientName : therapistName}
                    </div>
                </div>

                {/* Local Video (Small) */}
                <div style={{
                    position: 'relative',
                    background: '#1a1a24',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    aspectRatio: '9/16',
                }}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)',
                        }}
                    />
                    {!isVideoEnabled && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#1a1a24',
                        }}>
                            <VideoOff size={48} color="rgba(255, 255, 255, 0.3)" />
                        </div>
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '1rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                    }}>
                        You
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '2rem',
                background: 'linear-gradient(0deg, rgba(10, 10, 15, 0.95) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
            }}>
                <button
                    onClick={toggleAudio}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: isAudioEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                        border: `2px solid ${isAudioEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.4)'}`,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: isVideoEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                        border: `2px solid ${isVideoEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.4)'}`,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>

                <button
                    onClick={endCall}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
}
