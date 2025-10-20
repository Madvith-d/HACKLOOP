import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useApp();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        // Mock login (replace with actual API call)
        const userData = {
            id: '1',
            name: email.split('@')[0],
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
                    <p>Welcome back</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
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
                    <button type="submit" className="btn-primary btn-full">
                        Sign In
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                    <Link to="/" className="back-home">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
