import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {

    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            padding: '8rem 2rem 4rem',
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Subtle grid pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0)',
                backgroundSize: '40px 40px',
                opacity: 0.5,
            }} />
            
            <div className="container hero-grid" style={{
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                }}>
                    
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                    }}>
                        Proactive AI Mental Health Companion
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-muted-foreground)',
                        lineHeight: 1.6,
                        maxWidth: '600px',
                    }}>
                        MindMesh+ combines Agentic AI, Computer Vision, and professional counselling to provide truly intelligent mental health support.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                    }}>
                        <Link to="/signup">
                            <button className="btn btn-primary">Start Free Trial</button>
                        </Link>
                        <button className="btn btn-secondary">Watch Demo</button>
                    </div>
                    
                    {/* Stats row */}
                    <div style={{
                        display: 'flex',
                        gap: '3rem',
                        marginTop: '1.5rem',
                    }}>
                    </div>
                </div>
                
                {/* Product mockup visual */}
                <div style={{
                    position: 'relative',
                    height: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* Main mockup container */}
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '500px',
                        height: '500px',
                        padding: '2rem',
                        position: 'relative',
                        background: 'white',
                    }}>
                        {/* Chat interface mockup */}
                        <div style={{
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid hsl(var(--border))',
                        }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>MindMesh Assistant</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>How can I support you today?</p>
                        </div>
                        
                        {/* Chat bubbles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                background: 'var(--color-secondary)',
                                padding: '1rem',
                                borderRadius: '1rem',
                                maxWidth: '80%',
                            }}>
                                <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>I've been feeling stressed lately</p>
                            </div>
                            
                            <div style={{
                                background: 'var(--color-foreground)',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '1rem',
                                maxWidth: '80%',
                                alignSelf: 'flex-end',
                            }}>
                                <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>I understand. Let's work through this together. Would you like to try a breathing exercise?</p>
                            </div>
                            
                            {/* Quick actions */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '0.5rem',
                            }}>
                                <button style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--color-secondary)',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                }}>Breathing Exercise</button>
                                <button style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--color-secondary)',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                }}>Talk to Therapist</button>
                            </div>
                        </div>
                        
                        {/* Input area */}
                        <div style={{
                            position: 'absolute',
                            bottom: '2rem',
                            left: '2rem',
                            right: '2rem',
                            display: 'flex',
                            gap: '0.5rem',
                        }}>
                            <input
                                type="text"
                                placeholder="Type your message..."
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                }}
                                disabled
                            />
                            <button style={{
                                padding: '0.75rem 1.25rem',
                                background: 'var(--color-foreground)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}>Send</button>
                        </div>
                    </div>
                    
                    {/* Floating feature cards */}
                    <div className="card" style={{
                        position: 'absolute',
                        left: '-2rem',
                        top: '10%',
                        padding: '1rem 1.25rem',
                        background: 'white',
                        minWidth: '160px',
                        animation: 'float 4s ease-in-out infinite',
                    }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', marginBottom: '0.25rem' }}>Emotion Detection</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Active</div>
                    </div>
                    
                    <div className="card" style={{
                        position: 'absolute',
                        right: '-2rem',
                        bottom: '20%',
                        padding: '1rem 1.25rem',
                        background: 'white',
                        minWidth: '160px',
                        animation: 'float 5s ease-in-out infinite',
                        animationDelay: '1s',
                    }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', marginBottom: '0.25rem' }}>AI Analysis</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Running</div>
                    </div>
                </div>
            </div>
        </section>
    );
}


