import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, Brain, BrainCircuit, Smile } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { WebRTCService } from '../utils/webrtc';
import { useApp } from '../context/AppContext';

export default function VideoCall() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useApp();
    
    const therapySessionId = searchParams.get('therapySessionId');
    const patientId = searchParams.get('patientId');
    const patientName = searchParams.get('patient') || 'Patient';
    
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [callDuration, setCallDuration] = useState(0);
    
    // Emotion tracking state
    const [emotionTrackingEnabled, setEmotionTrackingEnabled] = useState(true);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState(null);
    const [emotionConfidence, setEmotionConfidence] = useState(0);
    const [emotionTimeline, setEmotionTimeline] = useState([]);
    const [isProcessingEmotion, setIsProcessingEmotion] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const webrtcServiceRef = useRef(null);
    const callStartTimeRef = useRef(null);
    const emotionIntervalRef = useRef(null);
    const sessionDataRef = useRef({
        startTime: null,
        therapySessionId: null
    });
    useEffect(() => {
        loadFaceApiModels();
        return () => {
            if (emotionIntervalRef.current) {
                clearInterval(emotionIntervalRef.current);
            }
        };
    }, []);
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
            sessionDataRef.current.startTime = new Date();
        }

        const interval = setInterval(() => {
            if (callStartTimeRef.current) {
                const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                setCallDuration(duration);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [connectionStatus]);
    useEffect(() => {
        if (connectionStatus === 'connected' && modelsLoaded && emotionTrackingEnabled) {
            startEmotionTracking();
        }
        return () => {
            if (emotionIntervalRef.current) {
                clearInterval(emotionIntervalRef.current);
            }
        };
    }, [connectionStatus, modelsLoaded, emotionTrackingEnabled]);
    const loadFaceApiModels = async () => {
        try {
            console.log('Loading face-api models...');
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            
            setModelsLoaded(true);
            console.log('Face-api models loaded successfully');
        } catch (error) {
            console.error('Error loading face-api models:', error);
        }
    };
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
            if (therapySessionId) {
                sessionDataRef.current.therapySessionId = therapySessionId;
            }

        } catch (error) {
            console.error('Error initializing call:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    };

    /**
     * Start emotion detection on remote video
     */
    const startEmotionTracking = () => {
        if (emotionIntervalRef.current) {
            clearInterval(emotionIntervalRef.current);
        }

        console.log('Starting emotion tracking...');
        
        emotionIntervalRef.current = setInterval(async () => {
            if (!remoteVideoRef.current || !emotionTrackingEnabled || isProcessingEmotion) {
                return;
            }

            try {
                setIsProcessingEmotion(true);
                
                const detection = await faceapi
                    .detectSingleFace(remoteVideoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceExpressions();

                if (detection) {
                    const expressions = detection.expressions;
                    const { emotion, confidence } = getDominantEmotion(expressions);
                    const distractionScore = calculateDistraction(detection);
                    setCurrentEmotion(emotion);
                    setEmotionConfidence(confidence);
                    const emotionData = {
                        timestamp: new Date(),
                        emotion: emotion.toLowerCase(),
                        confidence,
                        distractionScore
                    };

                    setEmotionTimeline(prev => [...prev, emotionData]);
                    if (emotionTimeline.length > 0 && emotionTimeline.length % 10 === 0) {
                        await saveEmotionDataToServer();
                    }
                }
            } catch (error) {
                console.error('Error detecting emotion:', error);
            } finally {
                setIsProcessingEmotion(false);
            }
        }, 3000);
    };
    const getDominantEmotion = (expressions) => {
        let maxEmotion = 'neutral';
        let maxScore = 0;

        Object.keys(expressions).forEach(emotion => {
            if (expressions[emotion] > maxScore) {
                maxScore = expressions[emotion];
                maxEmotion = emotion;
            }
        });

        return {
            emotion: maxEmotion.charAt(0).toUpperCase() + maxEmotion.slice(1),
            confidence: maxScore
        };
    };
    const calculateDistraction = (detection) => {
        const detectionScore = detection.detection.score;
        return 1 - detectionScore;
    };
    const saveEmotionDataToServer = async () => {
        if (!therapySessionId || emotionTimeline.length === 0) return;

        try {
            const token = localStorage.getItem('authToken');
            const recentData = emotionTimeline.slice(-10);

            await fetch(`${API_BASE_URL}/api/therapy-sessions/${therapySessionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    emotionData: recentData
                })
            });

            console.log('Emotion data saved to server');
        } catch (error) {
            console.error('Error saving emotion data:', error);
        }
    };
    const endCallWithData = async () => {
        try {
            if (emotionIntervalRef.current) {
                clearInterval(emotionIntervalRef.current);
            }
            if (therapySessionId && emotionTimeline.length > 0) {
                const token = localStorage.getItem('authToken');
                
                await fetch(`${API_BASE_URL}/api/therapy-sessions/${therapySessionId}/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        emotionTimeline,
                        videoCallData: {
                            connectionQuality: connectionStatus === 'connected' ? 'good' : 'poor',
                            reconnections: 0,
                            audioIssues: !isAudioEnabled,
                            videoIssues: !isVideoEnabled
                        }
                    })
                });

                console.log('Session completed and saved');
            }
        } catch (error) {
            console.error('Error saving session data:', error);
        } finally {
            if (webrtcServiceRef.current) {
                webrtcServiceRef.current.endCall();
            }
            navigate(-1);
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

    const toggleEmotionTracking = () => {
        setEmotionTrackingEnabled(!emotionTrackingEnabled);
        if (emotionTrackingEnabled && emotionIntervalRef.current) {
            clearInterval(emotionIntervalRef.current);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getEmotionColor = (emotion) => {
        const colors = {
            'Happy': '#10b981',
            'Sad': '#3b82f6',
            'Angry': '#ef4444',
            'Fearful': '#f59e0b',
            'Disgusted': '#8b5cf6',
            'Surprised': '#06b6d4',
            'Neutral': '#6b7280'
        };
        return colors[emotion] || '#6b7280';
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
        }}>
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
                {currentEmotion && emotionTrackingEnabled && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <Smile size={20} style={{ color: getEmotionColor(currentEmotion) }} />
                        <div>
                            <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                                {currentEmotion}
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                                {Math.round(emotionConfidence * 100)}% confidence
                            </div>
                        </div>
                        <div style={{
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(102, 126, 234, 0.2)',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            color: '#667eea'
                        }}>
                            {emotionTimeline.length} points
                        </div>
                    </div>
                )}
            </div>
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: '1rem',
                padding: '6rem 2rem 8rem',
            }}>
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
                            <BrainCircuit size={48} color="rgba(255, 255, 255, 0.3)" />
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
                    onClick={toggleEmotionTracking}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: emotionTrackingEnabled ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: `2px solid ${emotionTrackingEnabled ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    title={emotionTrackingEnabled ? 'Disable emotion tracking' : 'Enable emotion tracking'}
                >
                    <Brain size={24} />
                </button>

                <button
                    onClick={endCallWithData}
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
            {!modelsLoaded && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '1rem 2rem',
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    zIndex: 100
                }}>
                    Loading emotion detection models...
                </div>
            )}
        </div>
    );
}
