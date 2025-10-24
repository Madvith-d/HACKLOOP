import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
    const [activeSection, setActiveSection] = useState('hero');

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['hero', 'about', 'features'];
            const scrollPosition = window.scrollY + 100;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const offsetHeight = element.offsetHeight;

                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSmoothScroll = (e, targetId) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            const navHeight = 80; // Account for fixed navbar height
            const targetPosition = element.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    const linkStyle = (sectionId) => ({
        fontWeight: 500,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: activeSection === sectionId ? '#667eea' : 'var(--color-foreground)',
        textDecoration: 'none',
        cursor: 'pointer',
        position: 'relative',
        paddingBottom: '4px',
    });

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
            transition: 'all 0.3s ease',
        }}>
            <a 
                href="#hero" 
                onClick={(e) => handleSmoothScroll(e, 'hero')}
                style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-foreground)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                }}
            >
                MindMesh+
            </a>
            <ul style={{
                display: 'flex',
                gap: '2rem',
                listStyle: 'none',
                alignItems: 'center',
            }}>
                <li>
                    <a 
                        href="#about" 
                        onClick={(e) => handleSmoothScroll(e, 'about')}
                        style={linkStyle('about')}
                    >
                        About
                    </a>
                </li>
                <li>
                    <a 
                        href="#features" 
                        onClick={(e) => handleSmoothScroll(e, 'features')}
                        style={linkStyle('features')}
                    >
                        Features
                    </a>
                </li>
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


