import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{
            padding: '3rem 2rem',
            background: '#ffffff',
            borderTop: '1px solid hsl(var(--border))',
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '3rem',
                    marginBottom: '2rem',
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-foreground)' }}>MindMesh+</h3>
                        <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>
                            AI-powered mental health companion providing proactive, intelligent support.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Product</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><a href="#features" style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>Features</a></li>
                            <li><Link to="/therapists" style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>For Therapists</Link></li>
                            <li><Link to="/analytics" style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>Analytics</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Company</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><a href="#" style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>About</a></li>
                            <li><a href="#" style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>Privacy</a></li>
                            <li><a href="#" style={{ color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div style={{
                    paddingTop: '2rem',
                    borderTop: '1px solid hsl(var(--border))',
                    textAlign: 'center',
                    color: 'var(--color-muted-foreground)',
                    fontSize: '0.875rem',
                }}>
                    <p>© 2025 MindMesh+. All rights reserved. Built with care for better mental health.</p>
                </div>
            </div>
        </footer>
    );
}


