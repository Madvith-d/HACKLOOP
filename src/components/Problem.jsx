import React, { useEffect } from 'react';

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
            el.style.transition = 'all 0.6s ease-out';
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <section className="problem-section">
            <h2 className="section-title">The Problem We Solve</h2>
            <p className="section-subtitle">Traditional mental health tools fall short of providing comprehensive, proactive care</p>
            <div className="problem-grid">
                <div className="problem-card">
                    <h3>Limited Chatbots</h3>
                    <p>Most mental health chatbots only respond to text. They don't observe body language, facial cues, or emotional states beyond words.</p>
                </div>
                <div className="problem-card">
                    <h3>Reactive, Not Proactive</h3>
                    <p>Current solutions wait for users to reach out. They don't autonomously intervene when someone's emotional state deteriorates.</p>
                </div>
                <div className="problem-card">
                    <h3>Disconnected Care</h3>
                    <p>There's a gap between AI tools and real counsellors. Psychologists lack unified dashboards to track patient trends between sessions.</p>
                </div>
            </div>
        </section>
    );
}


