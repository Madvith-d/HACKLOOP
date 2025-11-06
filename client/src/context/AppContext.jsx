import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [emotionHistory, setEmotionHistory] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        // Restore auth state and verify token with backend if present
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        if (token && !storedUser) {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            fetch(`${API_BASE_URL}/api/auth/verify`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (json?.user) {
                    setUser(json.user);
                    setIsAuthenticated(true);
                    localStorage.setItem('user', JSON.stringify(json.user));
                }
            })
            .catch(() => {})
        }
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        if (token) localStorage.setItem('authToken', token);
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
    };

    const addEmotionRecord = (emotion) => {
        setEmotionHistory(prev => [...prev, { ...emotion, timestamp: new Date() }]);
    };

    const addSession = (session) => {
        setSessions(prev => [...prev, session]);
    };

    return (
        <AppContext.Provider value={{
            user,
            isAuthenticated,
            emotionHistory,
            sessions,
            login,
            logout,
            addEmotionRecord,
            addSession,
            login,
            logout
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
