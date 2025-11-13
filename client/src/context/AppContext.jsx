import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [emotionHistory, setEmotionHistory] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        // Restore auth state and verify token with backend if present
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            // No token, clear any stale data and set loading to false
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        // Always verify token when it exists, regardless of storedUser
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                // Token invalid or expired, clear auth state
                throw new Error('Token verification failed');
            }
        })
        .then(json => {
            if (json?.user) {
                setUser(json.user);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(json.user));
            } else {
                // No user data, clear auth state
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
            }
        })
        .catch(() => {
            // Verification failed, clear auth state
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
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
            isLoading,
            emotionHistory,
            sessions,
            login,
            logout,
            addEmotionRecord,
            addSession
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
