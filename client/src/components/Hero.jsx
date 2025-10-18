import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x07070a, 10, 60);

        const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        renderer.setClearColor(0x000000, 0);

        const ambientTop = new THREE.HemisphereLight(0x8899ff, 0x111122, 0.8);
        scene.add(ambientTop);
        const dirLight = new THREE.DirectionalLight(0x8899ff, 0.6);
        dirLight.position.set(3, 5, 2);
        scene.add(dirLight);

        // Core sphere (glowing)
        const coreSphere = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 64, 64),
            new THREE.MeshStandardMaterial({
                color: 0x667eea,
                metalness: 0.3,
                roughness: 0.25,
                emissive: 0x232a5c,
                emissiveIntensity: 0.8
            })
        );
        scene.add(coreSphere);

        // Subtle rings
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x764ba2, wireframe: true, opacity: 0.35, transparent: true });
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.02, 16, 200), ringMat);
        ring1.rotation.x = Math.PI / 3;
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.02, 16, 220), new THREE.MeshBasicMaterial({ color: 0x9b6bd6, wireframe: true, opacity: 0.25, transparent: true }));
        ring2.rotation.y = Math.PI / 5;
        scene.add(ring1, ring2);

        // Particles
        const particleGeom = new THREE.BufferGeometry();
        const particleCount = 400;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const r = 5 * Math.random();
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({ color: 0x667eea, size: 0.03, transparent: true, opacity: 0.7 });
        const particles = new THREE.Points(particleGeom, particleMat);
        scene.add(particles);

        function resize() {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
        window.addEventListener('resize', resize);

        let targetX = 0, targetY = 0;
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            targetX = x;
            targetY = y;
        });

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const clock = new THREE.Clock();
        let rafId;
        function animate(){
            const t = clock.getElapsedTime();
            if (!prefersReducedMotion) {
                coreSphere.rotation.y += 0.003;
                ring1.rotation.z += 0.002;
                ring2.rotation.x -= 0.0015;
                particles.rotation.y += 0.0008;
            }
            camera.position.x += (targetX * 0.6 - camera.position.x) * 0.02;
            camera.position.y += (-targetY * 0.4 - camera.position.y) * 0.02;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
        }
        resize();
        animate();

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
            renderer.dispose();
        };
    }, []);

    return (
        <section className="hero">
            <div className="hero-bg"></div>
            <div className="hero-content">
                <div className="hero-text">
                    <h1>Proactive AI Mental Health Companion</h1>
                    <p>MindMesh+ combines Agentic AI, Computer Vision, and professional counselling to provide truly intelligent mental health support that observes, understands, and acts.</p>
                    <div className="hero-buttons">
                        <button className="btn-primary">Start Free Trial</button>
                        <button className="btn-secondary">Watch Demo</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <canvas ref={canvasRef} id="hero-canvas"></canvas>
                    <div className="floating-card card-1">
                        <h4>Emotion Detection</h4>
                        <p>Real-time facial & sentiment analysis</p>
                    </div>
                    <div className="floating-card card-2">
                        <h4>Agentic AI</h4>
                        <p>Autonomous reasoning & action</p>
                    </div>
                    <div className="floating-card card-3">
                        <h4>Professional Care</h4>
                        <p>Connect with real therapists</p>
                    </div>
                </div>
            </div>
        </section>
    );
}


