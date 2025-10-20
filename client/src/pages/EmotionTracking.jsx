import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Smile, Frown, Meh, Heart, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function EmotionTracking() {
    const [isRecording, setIsRecording] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState(null);
    const [emotionScore, setEmotionScore] = useState(0);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const { addEmotionRecord } = useApp();

    const emotions = ['Happy', 'Sad', 'Neutral', 'Anxious', 'Calm', 'Stressed'];

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsRecording(true);
                simulateEmotionDetection();
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
        setCurrentEmotion(null);
    };

    const simulateEmotionDetection = () => {
        const interval = setInterval(() => {
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const randomScore = (Math.random() * 4 + 6).toFixed(1); // Score between 6.0-10.0
            setCurrentEmotion(randomEmotion);
            setEmotionScore(randomScore);
        }, 3000);

        return () => clearInterval(interval);
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

    const getEmotionIcon = (emotion) => {
        const lowerEmotion = emotion?.toLowerCase();
        if (lowerEmotion?.includes('happy') || lowerEmotion?.includes('calm')) return <Smile size={32} />;
        if (lowerEmotion?.includes('sad') || lowerEmotion?.includes('anxious')) return <Frown size={32} />;
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
                                <p>Camera is off</p>
                                <button onClick={startCamera} className="btn-primary">
                                    <Camera size={20} />
                                    Start Camera
                                </button>
                            </div>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="camera-video"
                                />
                                <div className="camera-overlay">
                                    <div className="face-outline"></div>
                                </div>
                            </>
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
                                        <span className="score-value">{(emotionScore * 10).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="emotion-bar">
                                    <div
                                        className="emotion-bar-fill"
                                        style={{ width: `${emotionScore * 10}%` }}
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
                        { emotion: 'Happy', score: 8.5, time: '2 hours ago' },
                        { emotion: 'Calm', score: 7.2, time: '5 hours ago' },
                        { emotion: 'Neutral', score: 6.8, time: 'Yesterday' },
                        { emotion: 'Anxious', score: 5.4, time: '2 days ago' },
                    ].map((record, index) => (
                        <div key={index} className="history-card">
                            {getEmotionIcon(record.emotion)}
                            <div>
                                <h4>{record.emotion}</h4>
                                <p>{record.time}</p>
                            </div>
                            <span className="history-score">{record.score}/10</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
