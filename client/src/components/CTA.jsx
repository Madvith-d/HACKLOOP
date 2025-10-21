import React from 'react';
import { Link } from 'react-router-dom';

export default function CTA() {
    return (
        <section style={{
            padding: '8rem 2rem',
            background: '#fafafa',
            position: 'relative',
        }}>
            <div className="container">
                <div className="card" style={{
                    padding: '4rem',
                    textAlign: 'center',
                    maxWidth: '900px',
                    margin: '0 auto',
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                        fontWeight: 900,
                        marginBottom: '1.5rem',
                    }}>
                        Ready to Transform Mental Health Care?
                    </h2>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-muted-foreground)',
                        marginBottom: '2.5rem',
                        maxWidth: '700px',
                        margin: '0 auto 2.5rem',
                    }}>
                        Join thousands of users and professionals who trust MindMesh+ for proactive, intelligent mental health support.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                        <Link to="/signup">
                            <button className="btn btn-primary">Start Your Journey</button>
                        </Link>
                        <Link to="/therapists">
                            <button className="btn btn-secondary">For Professionals</button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}


