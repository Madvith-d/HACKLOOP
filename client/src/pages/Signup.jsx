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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>MindMesh<span>+</span></h1>
                    <p>Create your account</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="name">
                            <User size={18} />
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">
                            <Mail size={18} />
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">
                            <Lock size={18} />
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            <Lock size={18} />
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn-primary btn-full">
                        Create Account
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    <Link to="/" className="back-home">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
