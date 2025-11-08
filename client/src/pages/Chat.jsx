import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, BookOpen, Target, Users, Loader2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { useApp } from '../context/AppContext';
import { chatAPI } from '../utils/api';
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
    const initialGreetingRef = useRef(true);
    const greetingPhaseRef = useRef(0);
    const greetingTimerRef = useRef(0);

    // Eyes and gaze
    const eyesRef = useRef({ left: null, right: null });
    const gazeTargetRef = useRef(new THREE.Vector3(0, 1.5, 3));
    const saccadeTimerRef = useRef(0);
    const nextSaccadeRef = useRef(1.8 + Math.random() * 2.2);
    const eyeAnglesRef = useRef({ x: 0, y: 0 });
    const eyeTargetRef = useRef({ x: 0, y: 0 });
    const eyeSaccadeSpeedRef = useRef(10);

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
                
                // Eye bones
                if (name.includes('eye') && name.includes('left') && !name.includes('end')) bones.leftEye = child;
                if (name.includes('eye') && name.includes('right') && !name.includes('end')) bones.rightEye = child;
                
                if (name.includes('left') && name.includes('finger')) {
                    const fingerPart = name.includes('thumb') ? 'thumb' : 
                                      name.includes('index') ? 'index' : 
                                      name.includes('middle') ? 'middle' : 
                                      name.includes('ring') ? 'ring' : 'pinky';
                    bones['leftFinger_' + fingerPart] = child;
                }
                if (name.includes('right') && name.includes('finger')) {
                    const fingerPart = name.includes('thumb') ? 'thumb' : 
                                      name.includes('index') ? 'index' : 
                                      name.includes('middle') ? 'middle' : 
                                      name.includes('ring') ? 'ring' : 'pinky';
                    bones['rightFinger_' + fingerPart] = child;
                }
            }
        });
        
        bonesRef.current = bones;
        eyesRef.current = { left: bones.leftEye || null, right: bones.rightEye || null };
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
        const microMovementT = t * 0.3; // Slower time scale for micro-movements

        // Eye saccades and gaze
        saccadeTimerRef.current += delta;
        if (saccadeTimerRef.current > nextSaccadeRef.current) {
            // pick a new subtle gaze target (pitch, yaw)
            eyeTargetRef.current = {
                x: THREE.MathUtils.clamp((Math.random() - 0.5) * 0.3, -0.18, 0.18),
                y: THREE.MathUtils.clamp((Math.random() - 0.5) * 0.5, -0.28, 0.28)
            };
            nextSaccadeRef.current = 1.5 + Math.random() * 2.5;
            saccadeTimerRef.current = 0;
            // occasional blink right after a saccade
            if (Math.random() > 0.7 && !isSpeaking) {
                applyMorphTarget(['eyeBlinkLeft','eyeBlinkRight','blink'], 1);
                setTimeout(() => applyMorphTarget(['eyeBlinkLeft','eyeBlinkRight','blink'], 0), 100 + Math.random() * 80);
            }
        }
        // Smoothly move eyes toward the target angles
        eyeAnglesRef.current.x = THREE.MathUtils.damp(eyeAnglesRef.current.x, eyeTargetRef.current.x, 8, delta);
        eyeAnglesRef.current.y = THREE.MathUtils.damp(eyeAnglesRef.current.y, eyeTargetRef.current.y, 8, delta);
        const leftEye = eyesRef.current.left;
        const rightEye = eyesRef.current.right;
        if (leftEye) {
            leftEye.rotation.x = THREE.MathUtils.clamp(eyeAnglesRef.current.x, -0.35, 0.35);
            leftEye.rotation.y = THREE.MathUtils.clamp(eyeAnglesRef.current.y, -0.45, 0.45);
        }
        if (rightEye) {
            rightEye.rotation.x = THREE.MathUtils.clamp(eyeAnglesRef.current.x, -0.35, 0.35);
            rightEye.rotation.y = THREE.MathUtils.clamp(eyeAnglesRef.current.y, -0.45, 0.45);
        }
        
        // Smooth speaking intensity with improved easing
        const targetIntensity = isSpeaking ? 1 : 0;
        speakingIntensityRef.current += (targetIntensity - speakingIntensityRef.current) * (isSpeaking ? 5 : 2) * delta;
        const speaking = speakingIntensityRef.current;

        // Initial greeting animation sequence
        if (initialGreetingRef.current) {
            greetingTimerRef.current += delta;
            const greetingTime = greetingTimerRef.current;
            
            // Complete greeting sequence in phases
            if (greetingPhaseRef.current === 0 && greetingTime > 0.5) {
                // Phase 1: Look up at user with slight head tilt
                bones.head.rotation.x = -0.15;
                bones.head.rotation.y = 0;
                bones.neck.rotation.z = 0.05;
                
                // Subtle smile for greeting
                applyMorphTarget('smile', 0.4);
                applyMorphTarget('eyeWiden', 0.3);
                
                if (greetingTime > 1.2) greetingPhaseRef.current = 1;
            } 
            else if (greetingPhaseRef.current === 1 && greetingTime > 1.2) {
                // Phase 2: Wave with right hand
                bones.rightUpperArm.rotation.x = -0.8;
                bones.rightUpperArm.rotation.z = -0.6;
                bones.rightForeArm.rotation.x = -1.0;
                bones.rightForeArm.rotation.y = 0.3;
                
                // Slight body turn toward greeting
                bones.spine1.rotation.y = 0.1;
                bones.spine2.rotation.y = 0.1;
                
                if (greetingTime > 2.0) greetingPhaseRef.current = 2;
            }
            else if (greetingPhaseRef.current === 2 && greetingTime > 2.0) {
                // Phase 3: Actual wave motion
                const waveSpeed = 8;
                bones.rightHand.rotation.z = Math.sin(greetingTime * waveSpeed) * 0.3;
                
                // Animate fingers for wave
                animateFingers('right', 'wave');
                
                // Nodding while greeting
                bones.head.rotation.x = Math.sin(greetingTime * 4) * 0.08 - 0.1;
                
                if (greetingTime > 4.0) greetingPhaseRef.current = 3;
            }
            else if (greetingPhaseRef.current === 3 && greetingTime > 4.0) {
                // Phase 4: Return to neutral pose
                bones.rightUpperArm.rotation.x += (0.2 - bones.rightUpperArm.rotation.x) * 0.1;
                bones.rightUpperArm.rotation.z += (-0.1 - bones.rightUpperArm.rotation.z) * 0.1;
                bones.rightForeArm.rotation.x += (-0.3 - bones.rightForeArm.rotation.x) * 0.1;
                bones.rightForeArm.rotation.y += (0 - bones.rightForeArm.rotation.y) * 0.1;
                
                // Return spine to neutral
                bones.spine1.rotation.y += (0 - bones.spine1.rotation.y) * 0.1;
                bones.spine2.rotation.y += (0 - bones.spine2.rotation.y) * 0.1;
                
                // Reset smile gradually
                applyMorphTarget('smile', 0.2);
                
                if (greetingTime > 5.5) {
                    initialGreetingRef.current = false;
                }
            }
        } else {
            // Regular head animation after greeting
            if (bones.head) {
                const headNodSpeed = 1.0;
                const headTurnSpeed = 0.6;
                if (speaking > 0.1) {
                    bones.head.rotation.x = Math.sin(t * headNodSpeed) * 0.05 * speaking + 
                                          Math.sin(t * 1.7) * 0.02 * speaking;
                    bones.head.rotation.y = Math.sin(t * headTurnSpeed) * 0.1 * speaking + 
                                          Math.sin(t * 0.9) * 0.04 * speaking;
                    bones.head.rotation.z = Math.sin(t * 0.8) * 0.02 * speaking;
                    
                    // Add subtle neck movement that follows the head with slight delay
                    bones.neck.rotation.x = Math.sin(t * headNodSpeed - 0.2) * 0.02 * speaking;
                    bones.neck.rotation.y = Math.sin(t * headTurnSpeed - 0.1) * 0.03 * speaking;
                } else {
                    // Subtle natural idle movements
                    bones.head.rotation.x = Math.sin(t * 0.25) * 0.012 + 
                                          Math.sin(t * 0.13) * 0.007;
                    bones.head.rotation.y = Math.sin(t * 0.18) * 0.025 + 
                                          Math.cos(t * 0.21) * 0.015;
                    bones.head.rotation.z = Math.sin(t * 0.15) * 0.007;
                    
                    // Slight delay in neck movement for natural follow-through
                    bones.neck.rotation.x = Math.sin(t * 0.25 - 0.2) * 0.005;
                    bones.neck.rotation.y = Math.sin(t * 0.18 - 0.1) * 0.01;
                }
            }
        }
        
        // Enhanced breathing animation affecting more parts of the body
        const breatheRate = 0.35;
        const breatheMain = Math.sin(t * breatheRate) * 0.015;
        const breatheUpper = Math.sin(t * breatheRate) * 0.01;
        
        if (bones.spine1) bones.spine1.rotation.x = breatheMain;
        if (bones.spine2) bones.spine2.rotation.x = breatheMain * 0.7;
        
        // Subtle shoulder movement with breathing
        if (bones.leftShoulder) {
            bones.leftShoulder.rotation.x = breatheUpper * 0.3;
            bones.leftShoulder.position.y = (bones.leftShoulder.position.y || 0) + breatheUpper * 0.002;
        }
        if (bones.rightShoulder) {
            bones.rightShoulder.rotation.x = breatheUpper * 0.3;
            bones.rightShoulder.position.y = (bones.rightShoulder.position.y || 0) + breatheUpper * 0.002;
        }
        
        // Add occasional weight shifting for more natural idle posture
        const weightShiftPeriod = 8; // seconds
        const weightShiftPhase = (t % weightShiftPeriod) / weightShiftPeriod;
        
        if (weightShiftPhase < 0.4 && !isSpeaking && !initialGreetingRef.current) {
            // Smooth easing for weight shift
            const shiftProgress = Math.sin((weightShiftPhase / 0.4) * Math.PI / 2);
            const side = Math.floor(t / weightShiftPeriod) % 2 === 0 ? 1 : -1;
            
            // Subtle hip and spine movement for weight shifting
            if (bones.spine1) {
                bones.spine1.rotation.z = side * shiftProgress * 0.02;
                bones.spine1.rotation.y = side * shiftProgress * 0.01;
            }
        }
        
        // Enhanced gesture system with better transitions
        if (!initialGreetingRef.current) {
            if (speaking > 0.2 && gestureTimerRef.current > 2.5) {
                gestureTimerRef.current = 0;
                currentGestureRef.current = {
                    arm: Math.random() > 0.5 ? 'left' : 'right',
                    type: ['open', 'point', 'emphasis', 'thinking', 'explain'][Math.floor(Math.random() * 5)]
                };
            }
            
            const gesture = currentGestureRef.current;
            const gestureBlend = Math.min(1, gestureTimerRef.current * 0.8);
            
            // Arm animations with improved gestures
            if (bones.leftUpperArm && bones.leftForeArm) {
                if (speaking > 0.2 && gesture.arm === 'left') {
                    switch(gesture.type) {
                        case 'open':
                            // Enhanced open palm gesture with more natural movement
                            bones.leftUpperArm.rotation.x += (-0.6 - bones.leftUpperArm.rotation.x) * 0.08;
                            bones.leftUpperArm.rotation.z += (0.4 - bones.leftUpperArm.rotation.z) * 0.08;
                            bones.leftForeArm.rotation.x = -0.9 + Math.sin(t * 2) * 0.15 + 
                                                         Math.sin(t * 3.1) * 0.05; // Add secondary oscillation
                            // Add slight wrist movement
                            if (bones.leftHand) {
                                bones.leftHand.rotation.x = Math.sin(t * 2.2) * 0.1;
                                bones.leftHand.rotation.z = Math.sin(t * 1.7) * 0.08;
                            }
                            animateFingers('left', 'open');
                            break;
                        case 'point':
                            // Pointing gesture
                            bones.leftUpperArm.rotation.x += (-0.5 - bones.leftUpperArm.rotation.x) * 0.08;
                            bones.leftUpperArm.rotation.z += (0.3 - bones.leftUpperArm.rotation.z) * 0.08;
                            bones.leftForeArm.rotation.x = -1.1;
                            animateFingers('left', 'point');
                            break;
                        case 'emphasis':
                            // Emphasis gesture (hand moving up and down)
                            bones.leftUpperArm.rotation.x = -0.4 + Math.sin(t * 3) * 0.2;
                            bones.leftUpperArm.rotation.z = 0.3;
                            bones.leftForeArm.rotation.x = -0.7;
                            animateFingers('left', 'fist');
                            break;
                        case 'thinking':
                            // Thinking pose (hand near chin)
                            bones.leftUpperArm.rotation.x = -1.0;
                            bones.leftUpperArm.rotation.z = 0.6;
                            bones.leftForeArm.rotation.x = -1.6;
                            animateFingers('left', 'thinking');
                            break;
                        case 'explain':
                            // Explanation gesture (circular motion)
                            bones.leftUpperArm.rotation.x = -0.6 + Math.sin(t * 2) * 0.15;
                            bones.leftUpperArm.rotation.z = 0.4 + Math.cos(t * 2) * 0.1;
                            bones.leftForeArm.rotation.x = -1.0;
                            animateFingers('left', 'explain');
                            break;
                    }
                } else {
                    // More natural resting pose with subtle movement
                    bones.leftUpperArm.rotation.x += (0.2 - bones.leftUpperArm.rotation.x) * 0.05;
                    bones.leftUpperArm.rotation.z += (0.1 - bones.leftUpperArm.rotation.z) * 0.05;
                    bones.leftForeArm.rotation.x += (-0.3 - bones.leftForeArm.rotation.x) * 0.05;
                    
                    // Add subtle idle arm sway
                    bones.leftUpperArm.rotation.z += Math.sin(t * 0.5) * 0.01;
                    if (bones.leftHand) {
                        bones.leftHand.rotation.x += (0 - bones.leftHand.rotation.x) * 0.03;
                        bones.leftHand.rotation.z += (0 - bones.leftHand.rotation.z) * 0.03;
                    }
                }
            }
            
            if (bones.rightUpperArm && bones.rightForeArm) {
                if (speaking > 0.2 && gesture.arm === 'right') {
                    switch(gesture.type) {
                        case 'open':
                            // Open palm gesture
                            bones.rightUpperArm.rotation.x += (-0.6 - bones.rightUpperArm.rotation.x) * 0.08;
                            bones.rightUpperArm.rotation.z += (-0.4 - bones.rightUpperArm.rotation.z) * 0.08;
                            bones.rightForeArm.rotation.x = -0.9 + Math.sin(t * 2.1) * 0.15;
                            animateFingers('right', 'open');
                            break;
                        case 'point':
                            // Pointing gesture
                            bones.rightUpperArm.rotation.x += (-0.5 - bones.rightUpperArm.rotation.x) * 0.08;
                            bones.rightUpperArm.rotation.z += (-0.3 - bones.rightUpperArm.rotation.z) * 0.08;
                            bones.rightForeArm.rotation.x = -1.1;
                            animateFingers('right', 'point');
                            break;
                        case 'emphasis':
                            // Emphasis gesture
                            bones.rightUpperArm.rotation.x = -0.4 + Math.sin(t * 3) * 0.2;
                            bones.rightUpperArm.rotation.z = -0.3;
                            bones.rightForeArm.rotation.x = -0.7;
                            animateFingers('right', 'fist');
                            break;
                        case 'thinking':
                            // Thinking pose
                            bones.rightUpperArm.rotation.x = -1.0;
                            bones.rightUpperArm.rotation.z = -0.6;
                            bones.rightForeArm.rotation.x = -1.6;
                            animateFingers('right', 'thinking');
                            break;
                        case 'explain':
                            // Explanation gesture
                            bones.rightUpperArm.rotation.x = -0.6 + Math.sin(t * 2) * 0.15;
                            bones.rightUpperArm.rotation.z = -0.4 + Math.cos(t * 2) * 0.1;
                            bones.rightForeArm.rotation.x = -1.0;
                            animateFingers('right', 'explain');
                            break;
                    }
                } else {
                    // Return to resting pose
                    bones.rightUpperArm.rotation.x += (0.2 - bones.rightUpperArm.rotation.x) * 0.05;
                    bones.rightUpperArm.rotation.z += (-0.1 - bones.rightUpperArm.rotation.z) * 0.05;
                    bones.rightForeArm.rotation.x += (-0.3 - bones.rightForeArm.rotation.x) * 0.05;
                }
            }
        }
        
        // Enhanced facial animations with more subtle expressions
        if (morphTargets.length > 0) {
            if (speaking > 0.1) {
                // Enhanced mouth and facial movements for more realistic speaking
                const speech = t * 8;
                const speechVariation1 = speech * 0.7;
                const speechVariation2 = speech * 1.3;
                
                morphTargets.forEach(mesh => {
                    const dict = mesh.morphTargetDictionary;
                    const influences = mesh.morphTargetInfluences;
                    if (!dict || !influences) return;
                    
                    Object.keys(dict).forEach(key => {
                        const k = key.toLowerCase();
                        let value = 0;
                        
                        // Jaw/Mouth opening mapped to common names (ARKit/Viseme/Mixamo)
                        if (
                            ((k.includes('jaw') || k.includes('mouth')) && (k.includes('open') || k.includes('aa') || k.includes('a')))
                            || (k.includes('viseme') && (k.includes('aa') || k.includes('a')))
                        ) {
                            // Combined waveforms for more natural movement
                            value = (
                                Math.sin(speech) * 0.5 +
                                Math.sin(speechVariation1) * 0.3 +
                                Math.sin(speechVariation2) * 0.2
                            ) * 0.55 * speaking;
                        } 
                        // Mouth wide/stretch
                        else if (k.includes('mouth') && (k.includes('wide') || k.includes('stretch'))) {
                            value = Math.max(0, Math.sin(speech * 0.7)) * 0.25 * speaking;
                        } 
                        // Smile left/right
                        else if (k.includes('smile') && (k.includes('left') || k.includes('right'))) {
                            const sideBias = k.includes('left') ? 1 : -1;
                            value = 0.12 * speaking + Math.max(0, Math.sin(t * 0.5 + sideBias * 0.2) * 0.12);
                        } 
                        // Generic smile
                        else if (k.includes('smile')) {
                            value = 0.15 * speaking + Math.max(0, Math.sin(t * 0.5) * 0.15);
                        } 
                        // Eyebrow up / inner up
                        else if ((k.includes('brow') && (k.includes('up') || k.includes('inner'))) || k.includes('browinnerup')) {
                            value = Math.max(0, Math.sin(speech * 0.5 - 0.2)) * 0.18 * speaking;
                        } 
                        // Squint
                        else if (k.includes('squint')) {
                            value = Math.max(0, Math.sin(t * 0.3 - 1) - 0.7) * 0.25 * speaking;
                        }
                        
                        // Smoother transitions for facial expressions
                        const transitionSpeed = k.includes('blink') ? 0.8 : 0.15;
                        influences[dict[key]] = THREE.MathUtils.lerp(
                            influences[dict[key]] || 0, 
                            value, 
                            transitionSpeed
                        );
                    });
                });
            } else {
                // Keep the idle facial expressions with slight improvements
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
        }
        
        // Improved blinking with randomized patterns
        if (!isSpeaking) {
            const blinkInterval = 3.5 + Math.random() * 2;
            if (blinkTimerRef.current > blinkInterval) {
                // Quick double blink occasionally
                if (Math.random() > 0.8) {
                    applyMorphTarget('blink', 1);
                    setTimeout(() => {
                        applyMorphTarget('blink', 0.2);
                        setTimeout(() => {
                            applyMorphTarget('blink', 1);
                            setTimeout(() => applyMorphTarget('blink', 0), 100);
                        }, 150);
                    }, 100);
                } else {
                    // Regular blink
                    applyMorphTarget('blink', 1);
                    setTimeout(() => applyMorphTarget('blink', 0), 100 + Math.random() * 50);
                }
                blinkTimerRef.current = 0;
            }
        } else {
            // Less frequent blinking while speaking
            if (blinkTimerRef.current > 5 + Math.random() * 2) {
                applyMorphTarget('blink', 1);
                setTimeout(() => applyMorphTarget('blink', 0), 100);
                blinkTimerRef.current = 0;
            }
        }
    });

    // Helper function to animate fingers based on gesture type
    function animateFingers(side, gestureType) {
        const bones = bonesRef.current;
        const prefix = `${side}Finger_`;
        
        const fingerBones = {
            thumb: bones[`${prefix}thumb`],
            index: bones[`${prefix}index`],
            middle: bones[`${prefix}middle`],
            ring: bones[`${prefix}ring`],
            pinky: bones[`${prefix}pinky`]
        };
        
        switch (gestureType) {
            case 'open':
                // Open hand, fingers spread slightly
                setFingerRotation(fingerBones.thumb, 0.1, -0.1, 0);
                setFingerRotation(fingerBones.index, -0.1, 0, 0);
                setFingerRotation(fingerBones.middle, -0.05, 0, 0);
                setFingerRotation(fingerBones.ring, 0, 0, 0);
                setFingerRotation(fingerBones.pinky, 0.1, 0, 0);
                break;
                
            case 'point':
                // Pointing with index finger, others curled
                setFingerRotation(fingerBones.thumb, 0.2, -0.3, 0);
                setFingerRotation(fingerBones.index, 0, 0, 0);
                setFingerRotation(fingerBones.middle, 0.8, 0, 0);
                setFingerRotation(fingerBones.ring, 0.8, 0, 0);
                setFingerRotation(fingerBones.pinky, 0.8, 0, 0);
                break;
                
            case 'fist':
                // Closed fist
                setFingerRotation(fingerBones.thumb, 0.5, -0.4, 0);
                setFingerRotation(fingerBones.index, 0.9, 0, 0);
                setFingerRotation(fingerBones.middle, 0.9, 0, 0);
                setFingerRotation(fingerBones.ring, 0.9, 0, 0);
                setFingerRotation(fingerBones.pinky, 0.9, 0, 0);
                break;
                
            case 'thinking':
                // Relaxed hand for thinking pose
                setFingerRotation(fingerBones.thumb, 0.2, -0.2, 0);
                setFingerRotation(fingerBones.index, 0.4, 0, 0);
                setFingerRotation(fingerBones.middle, 0.4, 0, 0);
                setFingerRotation(fingerBones.ring, 0.5, 0, 0);
                setFingerRotation(fingerBones.pinky, 0.5, 0, 0);
                break;
                
            case 'explain':
                // Slightly curved fingers for explanatory gesture
                setFingerRotation(fingerBones.thumb, 0.1, -0.2, 0);
                setFingerRotation(fingerBones.index, 0.3, 0, 0);
                setFingerRotation(fingerBones.middle, 0.2, 0, 0);
                setFingerRotation(fingerBones.ring, 0.3, 0, 0);
                setFingerRotation(fingerBones.pinky, 0.4, 0, 0);
                break;
                
            case 'wave':
                // Waving hand
                setFingerRotation(fingerBones.thumb, 0.1, -0.1, 0);
                setFingerRotation(fingerBones.index, -0.1, 0, 0);
                setFingerRotation(fingerBones.middle, -0.1, 0, 0);
                setFingerRotation(fingerBones.ring, -0.1, 0, 0);
                setFingerRotation(fingerBones.pinky, -0.1, 0, 0);
                break;
        }
    }
    
    function setFingerRotation(bone, x, y, z) {
        if (!bone) return;
        bone.rotation.x += (x - bone.rotation.x) * 0.2;
        bone.rotation.y += (y - bone.rotation.y) * 0.2;
        bone.rotation.z += (z - bone.rotation.z) * 0.2;
    }
    
    function applyMorphTarget(targetType, value) {
        const targets = Array.isArray(targetType)
            ? targetType.map(t => String(t).toLowerCase())
            : [String(targetType).toLowerCase()];
        morphTargets.forEach(mesh => {
            const dict = mesh.morphTargetDictionary;
            const influences = mesh.morphTargetInfluences;
            if (!dict || !influences) return;
            
            Object.keys(dict).forEach(key => {
                const k = key.toLowerCase();
                if (targets.some(t => k.includes(t))) {
                    influences[dict[key]] = value;
                }
            });
        });
    }

    return <group ref={groupRef}><primitive object={scene} /></group>;
}

export default function Chat() {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [conversation, setConversation] = useState([]);
    const [avatarText, setAvatarText] = useState('Hi! I\'m Maya, your wellness companion. Talk to me or type below!');
    const [textInput, setTextInput] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [error, setError] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const textInputRef = useRef(null);
    const { user } = useApp();

    const sendMessageToAPI = async (userMessage) => {
        try {
            setError(null);
            const response = await chatAPI.sendMessage(userMessage);
            
            return {
                response: response.response,
                emotionalAnalysis: response.emotionalAnalysis,
                recommendation: response.recommendation,
                therapistAlert: response.therapistAlert,
                chatId: response.chatId,
            };
        } catch (error) {
            console.error('Error sending message:', error);
            setError(error.message || 'Failed to send message. Please try again.');
            throw error;
        }
    };

    useEffect(() => {
        // Load chat history on mount
        const loadChatHistory = async () => {
            try {
                setLoadingHistory(true);
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setLoadingHistory(false);
                    return;
                }

                const history = await chatAPI.getHistory(50, 0);
                if (history.messages && history.messages.length > 0) {
                    // Convert backend messages to conversation format
                    const formattedMessages = history.messages.flatMap(msg => [
                        { 
                            role: 'user', 
                            content: msg.user_message, 
                            timestamp: new Date(msg.created_at),
                            id: msg.id,
                            emotionalAnalysis: msg.emotional_analysis,
                            recommendation: msg.recommendation,
                        },
                        { 
                            role: 'ai', 
                            content: msg.agent_response, 
                            timestamp: new Date(msg.created_at),
                            id: msg.id,
                            emotionalAnalysis: msg.emotional_analysis,
                            recommendation: msg.recommendation,
                        }
                    ]).sort((a, b) => a.timestamp - b.timestamp);
                    
                    setConversation(formattedMessages);
                    if (formattedMessages.length > 0) {
                        const lastMessage = formattedMessages[formattedMessages.length - 1];
                        setAvatarText(lastMessage.content);
                    }
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
                setError('Failed to load chat history');
            } finally {
                setLoadingHistory(false);
            }
        };

        loadChatHistory();

        // Setup speech recognition
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = async (event) => {
                const speechResult = event.results[0][0].transcript;
                setTranscript(speechResult);
                // Call handleUserSpeech directly
                const userMsg = { role: 'user', content: speechResult, timestamp: new Date() };
                setConversation(prev => [...prev, userMsg]);
                
                setIsTyping(true);
                
                try {
                    const result = await sendMessageToAPI(speechResult);
                    const aiMsg = { 
                        role: 'ai', 
                        content: result.response, 
                        timestamp: new Date(),
                        emotionalAnalysis: result.emotionalAnalysis,
                        recommendation: result.recommendation,
                        therapistAlert: result.therapistAlert,
                    };
                    setIsTyping(false);
                    setConversation(prev => [...prev, aiMsg]);
                    setAvatarText(result.response);
                    speak(result.response);
                    
                    if (result.therapistAlert) {
                        setTimeout(() => {
                            alert('⚠️ A therapist has been notified based on your message. Help is available.');
                        }, 1000);
                    }
                } catch (error) {
                    setIsTyping(false);
                }
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleUserSpeech = async (text) => {
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        setConversation(prev => [...prev, userMsg]);
        
        setIsTyping(true);
        
        try {
            const result = await sendMessageToAPI(text);
            const aiMsg = { 
                role: 'ai', 
                content: result.response, 
                timestamp: new Date(),
                emotionalAnalysis: result.emotionalAnalysis,
                recommendation: result.recommendation,
                therapistAlert: result.therapistAlert,
            };
            setIsTyping(false);
            setConversation(prev => [...prev, aiMsg]);
            setAvatarText(result.response);
            speak(result.response);
            
            // Show therapist alert if needed
            if (result.therapistAlert) {
                setTimeout(() => {
                    alert('⚠️ A therapist has been notified based on your message. Help is available.');
                }, 1000);
            }
        } catch (error) {
            setIsTyping(false);
            // Error already set in sendMessageToAPI
        }
    };

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!textInput.trim() || isSpeaking || isTyping) return;
        
        const messageText = textInput.trim();
        const userMsg = { role: 'user', content: messageText, timestamp: new Date() };
        setConversation(prev => [...prev, userMsg]);
        setTextInput('');
        setIsTyping(true);
        
        try {
            const result = await sendMessageToAPI(messageText);
            const aiMsg = { 
                role: 'ai', 
                content: result.response, 
                timestamp: new Date(),
                emotionalAnalysis: result.emotionalAnalysis,
                recommendation: result.recommendation,
                therapistAlert: result.therapistAlert,
            };
            setIsTyping(false);
            setConversation(prev => [...prev, aiMsg]);
            setAvatarText(result.response);
            speak(result.response);
            
            // Show therapist alert if needed
            if (result.therapistAlert) {
                setTimeout(() => {
                    alert('⚠️ A therapist has been notified based on your message. Help is available.');
                }, 1000);
            }
        } catch (error) {
            setIsTyping(false);
            // Error already set in sendMessageToAPI
        }
    };

    const copyMessage = (content) => {
        navigator.clipboard.writeText(content);
    };

    const giveFeedback = (messageIndex, isPositive) => {
        console.log(`Feedback for message ${messageIndex}: ${isPositive ? 'positive' : 'negative'}`);
    };

    const saveConversation = () => {
        if (conversation.length === 0) return;
        
        // Conversations are already saved to backend via API
        // This is just for local session management
        const sessionId = Date.now();
        const session = {
            id: sessionId,
            title: conversation[0]?.content.substring(0, 30) + '...',
            messages: [...conversation],
            date: new Date()
        };
        
        setConversationHistory(prev => [session, ...prev]);
        setConversation([]);
        setAvatarText('Hi! I\'m Maya, your wellness companion. Talk to me or type below!');
    };
    
    const renderRecommendationBadge = (recommendation) => {
        if (!recommendation || !recommendation.actions || recommendation.actions.length === 0) {
            return null;
        }
        
        const actionIcons = {
            SUGGEST_JOURNAL: BookOpen,
            SUGGEST_HABIT: Target,
            SUGGEST_THERAPY: Users,
            ALERT_THERAPIST: AlertCircle,
        };
        
        const actionLabels = {
            SUGGEST_JOURNAL: 'Try Journaling',
            SUGGEST_HABIT: 'Build a Habit',
            SUGGEST_THERAPY: 'Book Therapist',
            ALERT_THERAPIST: 'Therapist Alerted',
        };
        
        return (
            <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem' 
            }}>
                {recommendation.actions.map((action, idx) => {
                    const Icon = actionIcons[action] || Target;
                    return (
                        <span 
                            key={idx}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: '#667eea',
                                fontWeight: 500,
                            }}
                        >
                            <Icon size={12} />
                            {actionLabels[action] || action}
                        </span>
                    );
                })}
            </div>
        );
    };
    
    const renderEmotionalAnalysis = (analysis) => {
        if (!analysis || !analysis.emotionScores) return null;
        
        const scores = analysis.emotionScores;
        const topEmotions = Object.entries(scores)
            .filter(([_, score]) => score > 0.3)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 3);
        
        if (topEmotions.length === 0) return null;
        
        return (
            <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.5rem', 
                background: 'rgba(0, 0, 0, 0.02)', 
                borderRadius: '6px',
                fontSize: '0.75rem',
            }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-muted-foreground)' }}>
                    Detected Emotions:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {topEmotions.map(([emotion, score]) => (
                        <span key={emotion} style={{ color: 'var(--color-foreground)' }}>
                            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}: {Math.round(score * 100)}%
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const loadConversation = (session) => {
        setSelectedSession(session);
        setConversation(session.messages);
        setAvatarText(session.messages[session.messages.length - 1]?.content || 'Session loaded!');
    };

    const deleteSession = (sessionId) => {
        setConversationHistory(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
            setSelectedSession(null);
            setConversation([]);
        }
    };

    const startNewChat = () => {
        if (conversation.length > 0) {
            saveConversation();
        }
        setConversation([]);
        setSelectedSession(null);
        setAvatarText('Hi! I\'m Maya, your wellness companion. Talk to me or type below!');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, isTyping]);
    useEffect(() => {
        if (isListening) {
            const interval = setInterval(() => {
                setAudioLevel(Math.random() * 100);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setAudioLevel(0);
        }
    }, [isListening]);
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + K - Focus input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                textInputRef.current?.focus();
            }
            // Ctrl/Cmd + N - New chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                startNewChat();
            }
            // Ctrl/Cmd + S - Save conversation
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (conversation.length > 0) {
                    saveConversation();
                }
            }
            // Ctrl/Cmd + / - Show shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
            // Escape - Clear input or hide shortcuts
            if (e.key === 'Escape') {
                if (showShortcuts) {
                    setShowShortcuts(false);
                } else if (textInput) {
                    setTextInput('');
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [conversation, textInput, showShortcuts]);
    useEffect(() => {
        if (conversation.length > 0 && document.hidden) {
            setUnreadCount(prev => prev + 1);
        }
    }, [conversation]);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setUnreadCount(0);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

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
        <div className={`gamified-chat-page ${isFullscreen ? 'fullscreen-mode' : ''}`}>
            {showShortcuts && (
                <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
                    <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="shortcuts-header">
                            <h3>⌨️ Keyboard Shortcuts</h3>
                            <button onClick={() => setShowShortcuts(false)} className="close-shortcuts">
                                ✕
                            </button>
                        </div>
                        <div className="shortcuts-list">
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
                                <span className="shortcut-desc">Focus input field</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>N</kbd></span>
                                <span className="shortcut-desc">Start new chat</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>S</kbd></span>
                                <span className="shortcut-desc">Save conversation</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>/</kbd></span>
                                <span className="shortcut-desc">Toggle shortcuts</span>
                            </div>
                            <div className="shortcut-item">
                                <span className="shortcut-keys"><kbd>Esc</kbd></span>
                                <span className="shortcut-desc">Clear input / Close</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <button 
                className="fullscreen-toggle-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
                {isFullscreen ? '⊟' : '⊞'}
            </button>
            <button 
                className="shortcuts-hint-btn"
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts (Ctrl + /)">
                ⌨️
            </button>
            
            <div className="chat-layout">
                <div className="chat-sidebar">
                    <div className="sidebar-header-chat">
                        <div className="header-with-badge">
                            <h3>💬 Chat Sessions</h3>
                            {conversationHistory.length > 0 && (
                                <span className="session-badge">{conversationHistory.length}</span>
                            )}
                        </div>
                        <button className="new-chat-btn" onClick={startNewChat} title="New Chat (Ctrl+N)">
                            +
                        </button>
                    </div>
                    
                    <div className="sessions-list">
                        {conversationHistory.length === 0 ? (
                            <div className="empty-sessions">
                                <div className="empty-icon">📝</div>
                                <p>No saved conversations</p>
                                <span className="empty-hint">Start chatting to create your first session</span>
                            </div>
                        ) : (
                            conversationHistory.map((session) => (
                                <div 
                                    key={session.id} 
                                    className={`session-card ${selectedSession?.id === session.id ? 'active' : ''}`}
                                    onClick={() => loadConversation(session)}
                                >
                                    <div className="session-info">
                                        <h4>{session.title}</h4>
                                        <p>{new Date(session.date).toLocaleDateString()}</p>
                                        <span className="message-count">{session.messages.length} messages</span>
                                    </div>
                                    <button 
                                        className="delete-session-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {conversation.length > 0 && (
                        <button className="save-conversation-btn" onClick={saveConversation}>
                            💾 Save Current Chat
                        </button>
                    )}
                </div>
                <div className="chat-main">
                    <div className="avatar-container-3d">
                        <Canvas camera={{ position: [0, 0, 3], fov: 50 }} shadows>
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.8} />
                            <Suspense fallback={
                                <Html center>
                                    <div className="loading-maya">Loading Maya...</div>
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

                        <div className="status-badge">
                            <div className={`status-indicator ${isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'}`}></div>
                            <span>{isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}</span>
                        </div>
                    </div>

                    <div className="messages-area">
                        <div className="messages-scroll">
                            {loadingHistory ? (
                                <div className="welcome-message">
                                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: '#667eea' }} />
                                    <p style={{ marginTop: '1rem', color: 'var(--color-muted-foreground)' }}>Loading chat history...</p>
                                </div>
                            ) : conversation.length === 0 ? (
                                <div className="welcome-message">
                                    <div className="empty-state-icon">💬</div>
                                    <h2>Start a Conversation</h2>
                                    <p className="empty-state-desc">Choose a topic below or type your own message</p>
                                    <div className="quick-starters">
                                        <button onClick={() => setTextInput("I'm feeling anxious today")}>💭 Feeling anxious</button>
                                        <button onClick={() => setTextInput("I need help managing stress")}>😓 Managing stress</button>
                                        <button onClick={() => setTextInput("Tell me about meditation")}>🧘 Learn meditation</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {error && (
                                        <div style={{
                                            margin: '1rem',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '8px',
                                            color: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}>
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                            <button 
                                                onClick={() => setError(null)}
                                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    {conversation.map((msg, index) => {
                                        const timestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
                                        const emotionalAnalysis = typeof msg.emotionalAnalysis === 'string' 
                                            ? JSON.parse(msg.emotionalAnalysis) 
                                            : msg.emotionalAnalysis;
                                        const recommendation = typeof msg.recommendation === 'string'
                                            ? JSON.parse(msg.recommendation)
                                            : msg.recommendation;
                                        
                                        return (
                                            <div key={msg.id || index} className={`chat-message ${msg.role}`}>
                                                <div className="message-avatar-icon">
                                                    {msg.role === 'user' ? '👤' : '🤖'}
                                                </div>
                                                <div className="message-bubble-wrapper">
                                                    <div className="message-bubble">
                                                        <p>{msg.content}</p>
                                                        {msg.role === 'ai' && renderEmotionalAnalysis(emotionalAnalysis)}
                                                        {msg.role === 'ai' && renderRecommendationBadge(recommendation)}
                                                        <span className="message-timestamp">
                                                            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {msg.role === 'ai' && (
                                                        <div className="message-actions">
                                                            <button 
                                                                className="message-action-btn"
                                                                onClick={() => copyMessage(msg.content)}
                                                                title="Copy message"
                                                            >
                                                                📋
                                                            </button>
                                                            <button 
                                                                className="message-action-btn"
                                                                onClick={() => giveFeedback(index, true)}
                                                                title="Helpful"
                                                            >
                                                                👍
                                                            </button>
                                                            <button 
                                                                className="message-action-btn"
                                                                onClick={() => giveFeedback(index, false)}
                                                                title="Not helpful"
                                                            >
                                                                👎
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="chat-message ai typing-message">
                                            <div className="message-avatar-icon">
                                                🤖
                                            </div>
                                            <div className="message-bubble typing-bubble">
                                                <div className="typing-dots">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="chat-input-zone">
                        {isListening && (
                            <div className="listening-animation">
                                <div className="voice-visualizer">
                                    {[...Array(5)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="voice-bar"
                                            style={{
                                                height: `${Math.max(20, audioLevel * (0.5 + Math.random() * 0.5))}%`,
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                                <span>Listening...</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleTextSubmit} className="input-form">
                            <button 
                                type="button"
                                className={`mic-button ${isListening ? 'active' : ''}`}
                                onClick={toggleListening}
                                disabled={isSpeaking}
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            
                            <input 
                                ref={textInputRef}
                                type="text"
                                className="text-input-field"
                                placeholder="Type your message or use voice... (Ctrl+K to focus)"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                disabled={isSpeaking || isListening}
                            />
                            
                            <button 
                                type="submit"
                                className="send-button"
                                disabled={!textInput.trim() || isSpeaking || isListening}
                            >
                                ➤
                            </button>
                            
                            {isSpeaking && (
                                <button 
                                    type="button"
                                    className="stop-speaking-btn"
                                    onClick={stopSpeaking}
                                    title="Stop speaking"
                                >
                                    <VolumeX size={20} />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
