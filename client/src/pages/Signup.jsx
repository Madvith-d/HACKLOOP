import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useApp();
    const navigate = useNavigate();

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (!res.ok) {
                const msg = (await res.json())?.error || 'Signup failed';
                setError(msg);
                return;
            }
            const json = await res.json();
            const { user: userData, token } = json;
            login(userData, token);
            navigate('/dashboard');
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
            padding: '2rem',
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
            
            {/* Animated background circles - subtle */}
            <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%)',
                top: '-50px',
                right: '-50px',
                animation: 'float 7s ease-in-out infinite',
            }} />
            <div style={{
                position: 'absolute',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(118, 75, 162, 0.05) 0%, transparent 70%)',
                bottom: '-100px',
                left: '-100px',
                animation: 'float 9s ease-in-out infinite',
                animationDelay: '1.5s',
            }} />
            
            {/* Interactive floating shapes */}
            <div className="floating-shape" style={{
                position: 'absolute',
                width: '70px',
                height: '70px',
                borderRadius: '15px',
                border: '2px solid rgba(0, 0, 0, 0.15)',
                background: 'rgba(0, 0, 0, 0.03)',
                top: '20%',
                right: '12%',
                animation: 'drift-y 13s ease-in-out infinite',
            }} />
            <div className="floating-shape" style={{
                position: 'absolute',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '3px solid rgba(0, 0, 0, 0.2)',
                background: 'rgba(0, 0, 0, 0.04)',
                bottom: '35%',
                left: '8%',
                animation: 'drift-x 16s ease-in-out infinite',
            }} />
            <div className="floating-shape" style={{
                position: 'absolute',
                width: '50px',
                height: '50px',
                background: 'rgba(0, 0, 0, 0.12)',
                borderRadius: '10px',
                top: '50%',
                left: '15%',
                animation: 'float-reverse 11s ease-in-out infinite',
                animationDelay: '2s',
            }} />
            <div className="floating-shape" style={{
                position: 'absolute',
                width: '110px',
                height: '110px',
                border: '3px solid rgba(0, 0, 0, 0.18)',
                borderRadius: '50%',
                top: '25%',
                left: '5%',
                animation: 'pulse-slow 9s ease-in-out infinite',
            }} />
            <div className="floating-shape" style={{
                position: 'absolute',
                width: '45px',
                height: '45px',
                background: 'rgba(0, 0, 0, 0.1)',
                transform: 'rotate(30deg)',
                bottom: '15%',
                right: '20%',
                animation: 'drift-y 12s ease-in-out infinite',
                animationDelay: '4s',
            }} />
            
            <div style={{
                display: 'flex',
                maxWidth: '1200px',
                width: '100%',
                gap: '3rem',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                flexDirection: 'row',
            }}>
            <style>{`
                @media (max-width: 968px) {
                    .auth-side-content {
                        display: none !important;
                    }
                }
            `}</style>
                {/* Left side - Signup form */}
                <div className="card auth-form-card" style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: 'clamp(1.5rem, 4vw, 3rem)',
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                    margin: '0 auto',
                }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        marginBottom: '0.5rem',
                        color: 'var(--color-foreground)',
                    }}>MindMesh+</h1>
                    <p style={{
                        color: 'var(--color-muted-foreground)',
                        fontSize: '1rem',
                    }}>Create your account</p>
                </div>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                }}>
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#ef4444',
                            fontSize: '0.875rem',
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="name" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-foreground)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        }}>
                            <User size={16} />
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                                outline: 'none',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--foreground))'}
                            onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="email" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-foreground)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        }}>
                            <Mail size={16} />
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                                outline: 'none',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--foreground))'}
                            onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="password" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-foreground)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        }}>
                            <Lock size={16} />
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                                outline: 'none',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--foreground))'}
                            onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="confirmPassword" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-foreground)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        }}>
                            <Lock size={16} />
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                                outline: 'none',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--foreground))'}
                            onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                        Create Account
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    color: 'var(--color-muted-foreground)',
                    fontSize: '0.875rem',
                }}>
                    <p>Already have an account? <Link to="/login" style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>Sign in</Link></p>
                    <Link to="/" style={{
                        display: 'block',
                        marginTop: '1rem',
                        color: 'var(--color-muted-foreground)',
                        textDecoration: 'none',
                    }}>← Back to Home</Link>
                </div>
            </div>
                
                {/* Right side - Illustration/Info */}
                <div className="auth-side-content" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateX(0)' : 'translateX(30px)',
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
                            fontWeight: 900,
                            marginBottom: '1rem',
                            lineHeight: 1.1,
                        }}>Start Your Mental Wellness Journey</h1>
                        <p style={{
                            fontSize: '1.25rem',
                            color: 'var(--color-muted-foreground)',
                            lineHeight: 1.6,
                        }}>Join thousands who are transforming their mental health with AI-powered support.</p>
                    </div>
                    
                    {/* Benefits */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        {[
                            { icon: '✨', text: '24/7 AI Companion Always Available' },
                            { icon: '🎯', text: 'Personalized Mental Health Insights' },
                            { icon: '👥', text: 'Access to Licensed Therapists' },
                            { icon: '🛡️', text: 'Complete Privacy & Security' },
                        ].map((benefit, index) => (
                            <div key={index} className="auth-feature-card" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.25rem',
                                background: 'white',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                opacity: isLoaded ? 1 : 0,
                                transform: isLoaded ? 'translateX(0)' : 'translateX(20px)',
                                transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                            }}>
                                <span style={{ fontSize: '2rem' }}>{benefit.icon}</span>
                                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-foreground)' }}>{benefit.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
