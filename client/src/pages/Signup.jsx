import React, { useState } from 'react';
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

    const handleSubmit = (e) => {
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

        // Mock signup (replace with actual API call)
        const userData = {
            id: Date.now().toString(),
            name: name,
            email: email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };

        login(userData);
        navigate('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
            padding: '2rem',
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0)',
                backgroundSize: '40px 40px',
                opacity: 0.5,
            }} />
            
            <div className="card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '3rem',
                position: 'relative',
                zIndex: 1,
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
        </div>
    );
}
