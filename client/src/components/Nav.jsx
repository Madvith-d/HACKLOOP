import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            padding: '1.25rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid hsl(var(--border))',
            zIndex: 1000,
        }}>
            <Link to="/" style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--color-foreground)',
            }}>MindMesh+</Link>
            <ul style={{
                display: 'flex',
                gap: '2rem',
                listStyle: 'none',
                alignItems: 'center',
            }}>
                <li><a href="#features" style={{ fontWeight: 500, transition: 'all 0.2s', color: 'var(--color-foreground)' }}>Features</a></li>
                <li><Link to="/login" style={{ fontWeight: 500, transition: 'all 0.2s', color: 'var(--color-foreground)' }}>Sign In</Link></li>
                <li>
                    <Link to="/signup">
                        <button className="btn btn-primary">Get Started</button>
                    </Link>
                </li>
            </ul>
        </nav>
    );
}


