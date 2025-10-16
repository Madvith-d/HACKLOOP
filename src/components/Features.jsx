import React, { useEffect } from 'react';

export default function Features() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.feature-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease-out';
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <section className="features-section" id="features">
            <h2 className="section-title">Intelligent Features</h2>
            <p className="section-subtitle">A complete ecosystem for mental health support</p>
            <div className="features-grid">
                <div className="feature-card">
                    <h3>Emotion Sensing</h3>
                    <p>Advanced computer vision detects facial stress and fatigue via webcam. Combined with chat sentiment analysis and typing patterns, we create a complete emotional profile in real-time.</p>
                </div>
                <div className="feature-card">
                    <h3>Agentic AI Core</h3>
                    <p>Our AI doesn't just respond—it reasons and acts autonomously. From calming interventions to automatic counselling bookings, it decides the best next step based on your emotional context.</p>
                </div>
                <div className="feature-card">
                    <h3>Generative AI Layer</h3>
                    <p>Creates empathetic conversations, personalized journaling prompts, relaxation narrations, and custom music playlists. Every interaction is thoughtfully generated for your needs.</p>
                </div>
                <div className="feature-card">
                    <h3>Professional Platform</h3>
                    <p>Seamlessly connect with licensed therapists. Book video sessions, share AI-generated mood reports, and let professionals track your emotional trends with comprehensive dashboards.</p>
                </div>
                <div className="feature-card">
                    <h3>Analytics Dashboard</h3>
                    <p>Both users and therapists get detailed emotional trend graphs, session summaries, and AI insights. Track progress over time with beautiful, actionable visualizations.</p>
                </div>
                <div className="feature-card">
                    <h3>Secure & Private</h3>
                    <p>Enterprise-grade security with authentication and encrypted data storage. Your mental health journey remains confidential and protected.</p>
                </div>
            </div>
        </section>
    );
}


