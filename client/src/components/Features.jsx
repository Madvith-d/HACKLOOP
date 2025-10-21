import React, { useEffect } from 'react';

const features = [
    {
        title: 'Emotion Sensing',
        description: 'Advanced computer vision detects facial stress and fatigue via webcam. Combined with chat sentiment analysis and typing patterns, we create a complete emotional profile in real-time.',
    },
    {
        title: 'Agentic AI Core',
        description: 'Our AI doesn\'t just respond—it reasons and acts autonomously. From calming interventions to automatic counselling bookings, it decides the best next step based on your emotional context.',
    },
    {
        title: 'Generative AI Layer',
        description: 'Creates empathetic conversations, personalized journaling prompts, relaxation narrations, and custom music playlists. Every interaction is thoughtfully generated for your needs.',
    },
    {
        title: 'Professional Platform',
        description: 'Seamlessly connect with licensed therapists. Book video sessions, share AI-generated mood reports, and let professionals track your emotional trends with comprehensive dashboards.',
    },
    {
        title: 'Analytics Dashboard',
        description: 'Both users and therapists get detailed emotional trend graphs, session summaries, and AI insights. Track progress over time with beautiful, actionable visualizations.',
    },
    {
        title: 'Secure & Private',
        description: 'Enterprise-grade security with authentication and encrypted data storage. Your mental health journey remains confidential and protected.',
    }
];

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
            el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <section id="features" style={{
            padding: '8rem 2rem',
            background: '#fafafa',
            position: 'relative',
        }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: 900,
                        marginBottom: '1rem',
                    }}>
                        Intelligent Features
                    </h2>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-muted-foreground)',
                        maxWidth: '600px',
                        margin: '0 auto',
                    }}>
                        A complete ecosystem for mental health support
                    </p>
                </div>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-card card"
                            style={{
                                padding: '2rem',
                                position: 'relative',
                            }}
                        >
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                                color: 'var(--color-muted-foreground)',
                                lineHeight: 1.6,
                                fontSize: '1rem',
                            }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


