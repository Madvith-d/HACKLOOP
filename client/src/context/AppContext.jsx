import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [emotionHistory, setEmotionHistory] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        // Check for stored auth
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
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
