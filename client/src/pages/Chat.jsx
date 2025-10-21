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
