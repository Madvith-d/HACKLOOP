import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, Settings, Users } from 'lucide-react';
import { WebRTCService } from '../utils/webrtc';
import { useApp } from '../context/AppContext';

export default function VideoCall() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useApp();
    
    const sessionId = searchParams.get('session');
    const patientName = searchParams.get('patient') || 'Patient';
    
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [callDuration, setCallDuration] = useState(0);
    const [showSettings, setShowSettings] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const webrtcServiceRef = useRef(null);
    const callStartTimeRef = useRef(null);

    useEffect(() => {
        initializeCall();
        return () => {
            if (webrtcServiceRef.current) {
                webrtcServiceRef.current.endCall();
            }
        };
    }, []);
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
            const service = new WebRTCService();
            webrtcServiceRef.current = service;
            service.onRemoteStream = (stream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
            };

            service.onConnectionStateChange = (state) => {
                setConnectionStatus(state);
            };
            const stream = await service.initializeLocalStream();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            service.createPeerConnection();
            setTimeout(() => {
                setConnectionStatus('connected');
            }, 2000);

        } catch (error) {
            console.error('Error initializing call:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    };

    const toggleAudio = () => {
        if (webrtcServiceRef.current) {
            const enabled = webrtcServiceRef.current.toggleAudio();
            setIsAudioEnabled(enabled);
        }
    };

    const toggleVideo = () => {
        if (webrtcServiceRef.current) {
            const enabled = webrtcServiceRef.current.toggleVideo();
            setIsVideoEnabled(enabled);
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = webrtcServiceRef.current.peerConnection
                    ?.getSenders()
                    .find(s => s.track?.kind === 'video');
                
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }

                setIsScreenSharing(true);

                videoTrack.onended = () => {
                    setIsScreenSharing(false);
                    toggleVideo();
                    toggleVideo();
                };
            } catch (error) {
                console.error('Error sharing screen:', error);
            }
        } else {
            setIsScreenSharing(false);
        }
    };

    const endCall = () => {
        if (webrtcServiceRef.current) {
            webrtcServiceRef.current.endCall();
        }
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
                        Session with {patientName}
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
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Video Grid */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: '1rem',
                padding: '6rem 2rem 8rem',
            }}>
                {/* Remote Video */}
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
                    {connectionStatus !== 'connected' && (
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
                            <Users size={48} color="rgba(255, 255, 255, 0.3)" />
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.125rem' }}>
                                Waiting for {patientName}...
                            </p>
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
                        {patientName}
                    </div>
                </div>

                {/* Local Video */}
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
                    onClick={toggleScreenShare}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: isScreenSharing ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: `2px solid ${isScreenSharing ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
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
