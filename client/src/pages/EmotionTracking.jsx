import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Smile, Frown, Meh, Heart, AlertCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { useApp } from '../context/AppContext';

export default function EmotionTracking() {
    const [isRecording, setIsRecording] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState(null);
    const [emotionScore, setEmotionScore] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectionInterval = useRef(null);
    const { addEmotionRecord } = useApp();

    useEffect(() => {
        const loadModels = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log('Starting to load models...');
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
                
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                console.log('TinyFaceDetector loaded');
                
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                console.log('FaceLandmark68Net loaded');
                
                await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
                console.log('FaceExpressionNet loaded');
                
                setModelsLoaded(true);
                console.log('All face detection models loaded successfully');
            } catch (error) {
                console.error('Error loading models:', error);
                setError('Failed to load AI models. Please check your internet connection and refresh.');
            } finally {
                setIsLoading(false);
            }
        };
        loadModels();
    }, []);

    const startCamera = async () => {
        console.log('Start camera clicked');
        console.log('Models loaded:', modelsLoaded);
        console.log('Is loading:', isLoading);
        
        if (!modelsLoaded) {
            setError('Models are still loading. Please wait...');
            return;
        }

        setError(null);
        
        try {
            console.log('Requesting camera access...');
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            console.log('Camera access granted, stream obtained');
            streamRef.current = stream;
            setIsRecording(true);
            console.log('Set recording to true');
            
            setTimeout(() => {
                if (videoRef.current && streamRef.current) {
                    console.log('Assigning stream to video element');
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.onloadedmetadata = () => {
                        console.log('Video metadata loaded');
                        videoRef.current.play()
                            .then(() => {
                                console.log('Video playing successfully');
                                startEmotionDetection();
                            })
                            .catch(err => {
                                console.error('Error playing video:', err);
                                setError('Failed to play video stream');
                            });
                    };
                    
                    // Trigger play immediately if already loaded
                    if (videoRef.current.readyState >= 2) {
                        console.log('Video already loaded, playing now');
                        videoRef.current.play()
                            .then(() => startEmotionDetection())
                            .catch(console.error);
                    }
                } else {
                    console.error('Video ref not available after timeout');
                }
            }, 100);
        } catch (err) {
            console.error('Error accessing camera:', err);
            
            let errorMessage = 'Unable to access camera. ';
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera found on your device.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'Camera is already in use by another application.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Camera constraints could not be satisfied.';
            } else {
                errorMessage += err.message || 'Please check permissions and try again.';
            }
            
            setError(errorMessage);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
            detectionInterval.current = null;
        }
        setIsRecording(false);
        setCurrentEmotion(null);
        setEmotionScore(0);
    };

    const startEmotionDetection = () => {
        detectionInterval.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                    const detections = await faceapi
                        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    if (detections) {
                        const expressions = detections.expressions;
                        
                        // Find the dominant emotion
                        let maxEmotion = 'neutral';
                        let maxScore = 0;
                        
                        Object.keys(expressions).forEach(emotion => {
                            if (expressions[emotion] > maxScore) {
                                maxScore = expressions[emotion];
                                maxEmotion = emotion;
                            }
                        });

                        // Map face-api emotions to our emotion names
                        const emotionMap = {
                            'happy': 'Happy',
                            'sad': 'Sad',
                            'angry': 'Angry',
                            'fearful': 'Anxious',
                            'disgusted': 'Disgusted',
                            'surprised': 'Surprised',
                            'neutral': 'Neutral'
                        };

                        setCurrentEmotion(emotionMap[maxEmotion] || 'Neutral');
                        setEmotionScore((maxScore * 100).toFixed(1));
                    } else {
                        setCurrentEmotion(null);
                        setEmotionScore(0);
                    }
                } catch (error) {
                    console.error('Error detecting emotions:', error);
                }
            }
        }, 1000); // Detect every second
    };

    const saveEmotionRecord = () => {
        if (currentEmotion) {
            addEmotionRecord({
                emotion: currentEmotion,
                score: emotionScore,
                notes: ''
            });
            alert('Emotion record saved!');
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    useEffect(() => {
        console.log('isRecording changed to:', isRecording);
        if (isRecording && videoRef.current) {
            console.log('Video element exists, srcObject:', videoRef.current.srcObject);
            console.log('Video readyState:', videoRef.current.readyState);
        }
    }, [isRecording]);

    const getEmotionIcon = (emotion) => {
        const lowerEmotion = emotion?.toLowerCase();
        if (lowerEmotion?.includes('happy') || lowerEmotion?.includes('surprised')) return <Smile size={32} />;
        if (lowerEmotion?.includes('sad') || lowerEmotion?.includes('anxious') || lowerEmotion?.includes('angry') || lowerEmotion?.includes('disgusted')) return <Frown size={32} />;
        return <Meh size={32} />;
    };

    return (
        <div className="emotion-page">
            <header className="page-header">
                <div>
                    <h1>Emotion Tracking</h1>
                    <p>AI-powered facial emotion detection and analysis</p>
                </div>
            </header>

            <div className="emotion-grid">
                <div className="emotion-camera-section">
                    <div className="camera-container">
                        {!isRecording ? (
                            <div className="camera-placeholder">
                                <CameraOff size={64} />
                                <p>
                                    {isLoading ? 'Loading emotion detection models...' : 
                                     error ? error :
                                     modelsLoaded ? 'Camera is off' : 'Initializing...'}
                                </p>
                                {error && <p className="error-text">{error}</p>}
                                <button 
                                    onClick={startCamera} 
                                    className="btn-primary"
                                    disabled={isLoading || !modelsLoaded}
                                >
                                    <Camera size={20} />
                                    {isLoading ? 'Loading Models...' : 'Start Camera'}
                                </button>
                                {modelsLoaded && <p className="success-text">✓ AI Models Ready</p>}
                            </div>
                        ) : (
                            <div className="video-wrapper">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="camera-video"
                                    style={{ display: 'block' }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="camera-canvas"
                                />
                            </div>
                        )}
                    </div>
                    {isRecording && (
                        <div className="camera-controls">
                            <button onClick={stopCamera} className="btn-secondary">
                                <CameraOff size={20} />
                                Stop Camera
                            </button>
                            {currentEmotion && (
                                <button onClick={saveEmotionRecord} className="btn-primary">
                                    <Heart size={20} />
                                    Save Record
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="emotion-info-section">
                    <div className="emotion-result">
                        <h3>Current Detection</h3>
                        {currentEmotion ? (
                            <>
                                <div className="emotion-display">
                                    {getEmotionIcon(currentEmotion)}
                                    <h2>{currentEmotion}</h2>
                                    <div className="emotion-score">
                                        <span className="score-label">Confidence:</span>
                                        <span className="score-value">{Math.round(emotionScore)}%</span>
                                    </div>
                                </div>
                                <div className="emotion-bar">
                                    <div
                                        className="emotion-bar-fill"
                                        style={{ width: `${emotionScore}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <div className="no-detection">
                                <AlertCircle size={48} />
                                <p>Start camera to detect emotions</p>
                            </div>
                        )}
                    </div>

                    <div className="emotion-tips">
                        <h3>💡 How it works</h3>
                        <ul>
                            <li>Position your face within the camera frame</li>
                            <li>Ensure good lighting for accurate detection</li>
                            <li>The AI analyzes facial expressions in real-time</li>
                            <li>Save records to track your emotional patterns</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="emotion-history">
                <h3>Recent Check-ins</h3>
                <div className="history-grid">
                    {[
                        { emotion: 'Happy', score: 85, time: '2 hours ago' },
                        { emotion: 'Neutral', score: 72, time: '5 hours ago' },
                        { emotion: 'Sad', score: 68, time: 'Yesterday' },
                        { emotion: 'Surprised', score: 54, time: '2 days ago' },
                    ].map((record, index) => (
                        <div key={index} className="history-card">
                            {getEmotionIcon(record.emotion)}
                            <div>
                                <h4>{record.emotion}</h4>
                                <p>{record.time}</p>
                            </div>
                            <span className="history-score">{record.score}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
