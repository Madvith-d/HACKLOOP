import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AppLayout from './components/shared/AppLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import EmotionTracking from './pages/EmotionTracking';
import Therapists from './pages/Therapists';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import CrisisSupport from './pages/CrisisSupport';

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    
                    <Route element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/emotion" element={<EmotionTracking />} />
                        <Route path="/therapists" element={<Therapists />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/crisis" element={<CrisisSupport />} />
                    </Route>
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AppProvider>
    );
}


