import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AppLayout from './components/shared/AppLayout';

// Pages - lazy loaded for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const EmotionTracking = lazy(() => import('./pages/EmotionTracking'));
const Therapists = lazy(() => import('./pages/Therapists'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const CrisisSupport = lazy(() => import('./pages/CrisisSupport'));
const Journal = lazy(() => import('./pages/Journal'));
const HabitTracker = lazy(() => import('./pages/HabitTracker'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const TherapistDashboard = lazy(() => import('./pages/therapist/TherapistDashboard'));
const VideoCall = lazy(() => import('./pages/VideoCall'));

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/video-call" element={<VideoCall />} />
                        
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
                            <Route path="/journal" element={<Journal />} />
                            <Route path="/habits" element={<HabitTracker />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/therapist" element={<TherapistDashboard />} />
                        </Route>
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AppProvider>
    );
}


