import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { useApp } from '../context/AppContext';
import * as THREE from 'three';

function RealisticAvatar({ isSpeaking }) {
    const modelUrl = '/68f63a724e825b15ec6c27d4.glb';
    const { scene } = useGLTF(modelUrl);
    const groupRef = useRef();
    const [morphTargets, setMorphTargets] = useState([]);
    const bonesRef = useRef({});
    const timeRef = useRef(0);
    const blinkTimerRef = useRef(0);
    const speakingIntensityRef = useRef(0);
    const gestureTimerRef = useRef(0);
    const currentGestureRef = useRef({ arm: 'left', type: 'open' });

    useEffect(() => {
        if (!scene) return;
        
        const morphMeshes = [];
        scene.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary) {
                morphMeshes.push(child);
            }
        });
        setMorphTargets(morphMeshes);
        
        const bones = {};
        scene.traverse((child) => {
            if (child.isBone) {
                const name = child.name.toLowerCase();
                if (name.includes('head') && !name.includes('end')) bones.head = child;
                if (name.includes('neck') && !name.includes('end')) bones.neck = child;
                if (name.includes('spine') && !name.includes('end')) {
                    if (name.includes('1') || name === 'spine') bones.spine1 = child;
                    if (name.includes('2')) bones.spine2 = child;
                }
                if (name.includes('left') && name.includes('shoulder')) bones.leftShoulder = child;
                if (name.includes('right') && name.includes('shoulder')) bones.rightShoulder = child;
                if (name.includes('left') && name.includes('arm') && !name.includes('lower') && !name.includes('fore')) bones.leftUpperArm = child;
                if (name.includes('right') && name.includes('arm') && !name.includes('lower') && !name.includes('fore')) bones.rightUpperArm = child;
                if (name.includes('left') && (name.includes('lowerarm') || name.includes('forearm'))) bones.leftForeArm = child;
                if (name.includes('right') && (name.includes('lowerarm') || name.includes('forearm'))) bones.rightForeArm = child;
                if (name.includes('left') && name.includes('hand')) bones.leftHand = child;
                if (name.includes('right') && name.includes('hand')) bones.rightHand = child;
            }
        });
        
        bonesRef.current = bones;
        scene.scale.set(2, 2, 2);
        scene.position.set(0, -1.8, 0);
    }, [scene]);

    useFrame((state, delta) => {
        const bones = bonesRef.current;
        if (!bones.head) return;
        
        timeRef.current += delta;
        blinkTimerRef.current += delta;
        gestureTimerRef.current += delta;
        const t = timeRef.current;
        
        // Smooth speaking intensity
        const targetIntensity = isSpeaking ? 1 : 0;
        speakingIntensityRef.current += (targetIntensity - speakingIntensityRef.current) * 4 * delta;
        const speaking = speakingIntensityRef.current;
        
        // Head animation - natural and smooth
        if (bones.head) {
            const headNodSpeed = 1.0;
            const headTurnSpeed = 0.6;
            if (speaking > 0.1) {
                bones.head.rotation.x = Math.sin(t * headNodSpeed) * 0.06 * speaking;
                bones.head.rotation.y = Math.sin(t * headTurnSpeed) * 0.12 * speaking;
                bones.head.rotation.z = Math.sin(t * 0.8) * 0.03 * speaking;
            } else {
                bones.head.rotation.x = Math.sin(t * 0.25) * 0.015;
                bones.head.rotation.y = Math.sin(t * 0.18) * 0.04;
                bones.head.rotation.z = 0;
            }
        }
        
        // Natural breathing
        const breathe = Math.sin(t * 0.35) * 0.015;
        if (bones.spine1) bones.spine1.rotation.x = breathe;
        if (bones.spine2) bones.spine2.rotation.x = breathe * 0.7;
        
        // Gesture system
        if (speaking > 0.2 && gestureTimerRef.current > 2.5) {
            gestureTimerRef.current = 0;
            currentGestureRef.current = {
                arm: Math.random() > 0.5 ? 'left' : 'right',
                type: ['open', 'point', 'emphasis'][Math.floor(Math.random() * 3)]
            };
        }
        
        const gesture = currentGestureRef.current;
        const gestureBlend = Math.min(1, gestureTimerRef.current * 0.8);
        
        // Arm animations
        if (bones.leftUpperArm && bones.leftForeArm) {
            if (speaking > 0.2 && gesture.arm === 'left') {
                const targetX = -0.6 + Math.sin(t * 1.5) * 0.25;
                const targetZ = 0.4;
                bones.leftUpperArm.rotation.x += (targetX - bones.leftUpperArm.rotation.x) * 0.08;
                bones.leftUpperArm.rotation.z += (targetZ - bones.leftUpperArm.rotation.z) * 0.08;
                bones.leftForeArm.rotation.x = -0.9 + Math.sin(t * 2) * 0.15;
            } else {
                bones.leftUpperArm.rotation.x += (0.2 - bones.leftUpperArm.rotation.x) * 0.05;
                bones.leftUpperArm.rotation.z += (0.1 - bones.leftUpperArm.rotation.z) * 0.05;
                bones.leftForeArm.rotation.x += (-0.3 - bones.leftForeArm.rotation.x) * 0.05;
            }
        }
        
        if (bones.rightUpperArm && bones.rightForeArm) {
            if (speaking > 0.2 && gesture.arm === 'right') {
                const targetX = -0.6 + Math.sin(t * 1.6) * 0.25;
                const targetZ = -0.4;
                bones.rightUpperArm.rotation.x += (targetX - bones.rightUpperArm.rotation.x) * 0.08;
                bones.rightUpperArm.rotation.z += (targetZ - bones.rightUpperArm.rotation.z) * 0.08;
                bones.rightForeArm.rotation.x = -0.9 + Math.sin(t * 2.1) * 0.15;
            } else {
                bones.rightUpperArm.rotation.x += (0.2 - bones.rightUpperArm.rotation.x) * 0.05;
                bones.rightUpperArm.rotation.z += (-0.1 - bones.rightUpperArm.rotation.z) * 0.05;
                bones.rightForeArm.rotation.x += (-0.3 - bones.rightForeArm.rotation.x) * 0.05;
            }
        }
        
        // Facial animations
        if (morphTargets.length > 0 && speaking > 0.1) {
            const speech = t * 8;
            morphTargets.forEach(mesh => {
                const dict = mesh.morphTargetDictionary;
                const influences = mesh.morphTargetInfluences;
                if (!dict || !influences) return;
                
                Object.keys(dict).forEach(key => {
                    const k = key.toLowerCase();
                    let value = 0;
                    
                    if (k.includes('mouth') || k.includes('jaw')) {
                        value = (Math.sin(speech) * 0.5 + 0.5) * 0.6 * speaking;
                    } else if (k.includes('smile')) {
                        value = 0.15 * speaking;
                    } else if (k.includes('brow') && k.includes('up')) {
                        value = Math.abs(Math.sin(speech * 0.5)) * 0.2 * speaking;
                    }
                    
                    influences[dict[key]] = THREE.MathUtils.lerp(influences[dict[key]] || 0, value, 0.2);
                });
            });
        } else if (morphTargets.length > 0) {
            morphTargets.forEach(mesh => {
                const dict = mesh.morphTargetDictionary;
                const influences = mesh.morphTargetInfluences;
                if (dict && influences) {
                    Object.keys(dict).forEach(key => {
                        if (key.toLowerCase().includes('smile')) {
                            influences[dict[key]] = THREE.MathUtils.lerp(influences[dict[key]] || 0, 0.05, 0.02);
                        } else {
                            influences[dict[key]] *= 0.95;
                        }
                    });
                }
            });
        }
        
        // Blinking
        if (blinkTimerRef.current > 3.5 + Math.random()) {
            morphTargets.forEach(mesh => {
                const dict = mesh.morphTargetDictionary;
                const influences = mesh.morphTargetInfluences;
                if (dict && influences) {
                    Object.keys(dict).forEach(key => {
                        if (key.toLowerCase().includes('blink')) {
                            influences[dict[key]] = 1;
                            setTimeout(() => influences[dict[key]] = 0, 100);
                        }
                    });
                }
            });
            blinkTimerRef.current = 0;
        }
    });

    return <group ref={groupRef}><primitive object={scene} /></group>;
}

export default function Chat() {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [conversation, setConversation] = useState([]);
    const [avatarText, setAvatarText] = useState('Hi! I\'m Maya, your wellness companion. Click the mic to talk to me!');
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const { user } = useApp();

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                setTranscript(speechResult);
                handleUserSpeech(speechResult);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const generateAIResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
            return "I understand you're feeling anxious. Remember, anxiety is a natural response. Let's try some deep breathing together. Breathe in slowly for 4 counts, hold for 4, and exhale for 4. You're doing great.";
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
            return "Stress can be overwhelming. Have you tried breaking down your tasks into smaller, manageable steps? Sometimes just talking about what's stressing you can help lighten the load.";
        } else if (lowerMessage.includes('sad') || lowerMessage.includes('down')) {
            return "I'm here for you. It's okay to feel sad sometimes. Your feelings are valid. Would you like to talk about what's making you feel this way?";
        } else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
            return "That's wonderful to hear! I'm so glad you're feeling good. What's been bringing you joy lately?";
        } else if (lowerMessage.includes('help') || lowerMessage.includes('need')) {
            return "I'm here to help you. Tell me what's on your mind, and we'll work through it together. Remember, seeking help is a sign of strength.";
        } else {
            return "Thank you for sharing that with me. Your feelings matter. Can you tell me more about how you're feeling right now?";
        }
    };

    const speak = (text) => {
        if (synthRef.current) {
            synthRef.current.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 1;
            
            const voices = synthRef.current.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.includes('Female') || voice.name.includes('female') ||
                voice.name.includes('Samantha') || voice.name.includes('Karen')
            );
            if (femaleVoice) utterance.voice = femaleVoice;
            
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            
            synthRef.current.speak(utterance);
        }
    };

    const handleUserSpeech = (text) => {
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        setConversation(prev => [...prev, userMsg]);
        
        setTimeout(() => {
            const aiResponse = generateAIResponse(text);
            const aiMsg = { role: 'ai', content: aiResponse, timestamp: new Date() };
            setConversation(prev => [...prev, aiMsg]);
            setAvatarText(aiResponse);
            speak(aiResponse);
        }, 500);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                setTranscript('');
                setIsListening(true);
                recognitionRef.current.start();
            } else {
                alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            }
        }
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return (
        <div className="voice-chat-page">
            <header className="page-header">
                <div>
                    <h1>Meet Maya - Your Voice Companion</h1>
                    <p>Speak with your AI wellness companion</p>
                </div>
            </header>

            <div className="voice-chat-container">
                <div className="avatar-section">
                    <Canvas camera={{ position: [0, 0, 3], fov: 50 }} shadows>
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.8} />
                        <Suspense fallback={
                            <Html center>
                                <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading Maya...</div>
                            </Html>
                        }>
                            <RealisticAvatar isSpeaking={isSpeaking} />
                        </Suspense>
                        <OrbitControls 
                            enableZoom={false}
                            enablePan={false}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI / 1.8}
                            target={[0, 0.5, 0]}
                        />
                    </Canvas>
                </div>

                <div className="voice-interaction">
                    <div className="avatar-speech-bubble">
                        <p>{avatarText}</p>
                        {isSpeaking && <div className="speaking-indicator">Speaking...</div>}
                    </div>

                    <div className="voice-controls">
                        <button 
                            onClick={toggleListening} 
                            className={`voice-btn ${isListening ? 'listening' : ''}`}
                            disabled={isSpeaking}
                        >
                            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                            <span>{isListening ? 'Stop Listening' : 'Click to Speak'}</span>
                        </button>

                        {isSpeaking && (
                            <button onClick={stopSpeaking} className="stop-btn">
                                <VolumeX size={24} />
                                <span>Stop Speaking</span>
                            </button>
                        )}
                    </div>

                    {isListening && (
                        <div className="listening-indicator">
                            <div className="pulse"></div>
                            <p>Listening... Speak now</p>
                        </div>
                    )}

                    {transcript && (
                        <div className="transcript">
                            <p><strong>You said:</strong> {transcript}</p>
                        </div>
                    )}
                </div>

                <div className="conversation-history">
                    <h3>Conversation</h3>
                    <div className="history-list">
                        {conversation.map((msg, index) => (
                            <div key={index} className={`history-item ${msg.role}`}>
                                <div className="history-avatar">
                                    {msg.role === 'user' ? '🙂' : '👩'}
                                </div>
                                <div className="history-content">
                                    <p>{msg.content}</p>
                                    <span className="history-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
