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
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const TherapistDashboard = lazy(() => import('./pages/therapist/TherapistDashboard'));
const PatientDetails = lazy(() => import('./pages/therapist/PatientDetails'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const Appointments = lazy(() => import('./pages/Appointments'));

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
                            <Route path="/appointments" element={<Appointments />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/crisis" element={<CrisisSupport />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/therapist" element={<TherapistDashboard />} />
                            <Route path="/therapist/patient/:patientId" element={<PatientDetails />} />
                        </Route>
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AppProvider>
    );
}


