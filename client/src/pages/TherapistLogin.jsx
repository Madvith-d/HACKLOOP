import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TherapistLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'therapist' })
            });

            if (!res.ok) {
                const msg = (await res.json())?.error || 'Login failed';
                setError(msg);
                return;
            }

            const json = await res.json();
            const { user: userData, token } = json;

            if (userData.role !== 'therapist') {
                setError('This account is not a therapist account');
                return;
            }

            login(userData, token);
            navigate('/therapist-portal?login=1');
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
            {/* Background decorations */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0)',
                backgroundSize: '40px 40px',
                opacity: 0.5,
            }} />

            <div className="card auth-form-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        marginBottom: '0.5rem',
                        color: 'var(--color-foreground)',
                    }}>Therapist Portal</h1>
                    <p style={{
                        color: 'var(--color-muted-foreground)',
                        fontSize: '1rem',
                    }}>Sign in to your therapist account</p>
                </div>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
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

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                        Sign In
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    color: 'var(--color-muted-foreground)',
                    fontSize: '0.875rem',
                }}>
                    <p>Don't have an account? <Link to="/therapist/signup" style={{ color: 'var(--color-foreground)', fontWeight: 600 }}>Sign up</Link></p>
                    <Link to="/" style={{
                        display: 'block',
                        marginTop: '1rem',
                        color: 'var(--color-muted-foreground)',
                        textDecoration: 'none',
                    }}>← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
