import React, { useEffect } from 'react';

const problems = [
    {
        title: 'Limited Chatbots',
        description: 'Most mental health chatbots only respond to text. They don\'t observe body language, facial cues, or emotional states beyond words.'
    },
    {
        title: 'Reactive, Not Proactive',
        description: 'Current solutions wait for users to reach out. They don\'t autonomously intervene when someone\'s emotional state deteriorates.'
    },
    {
        title: 'Disconnected Care',
        description: 'There\'s a gap between AI tools and real counsellors. Psychologists lack unified dashboards to track patient trends between sessions.'
    }
];

export default function Problem() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.problem-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <section style={{
            padding: '8rem 2rem',
            background: '#ffffff',
            position: 'relative',
        }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: 900,
                        marginBottom: '1rem',
                    }}>
                        The Problem We Solve
                    </h2>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-muted-foreground)',
                        maxWidth: '700px',
                        margin: '0 auto',
                    }}>
                        Traditional mental health tools fall short of providing comprehensive, proactive care
                    </p>
                </div>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="problem-card card"
                            style={{
                                padding: '2rem',
                            }}
                        >
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                            }}>
                                {problem.title}
                            </h3>
                            <p style={{
                                color: 'var(--color-muted-foreground)',
                                lineHeight: 1.6,
                            }}>
                                {problem.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


