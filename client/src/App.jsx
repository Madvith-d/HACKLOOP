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
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const TherapistDashboard = lazy(() => import('./pages/therapist/TherapistDashboard'));
const PatientDetails = lazy(() => import('./pages/therapist/PatientDetails'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Journal = lazy(() => import('./pages/Journal'));
const Habits = lazy(() => import('./pages/Habits'));
const HabitDetail = lazy(() => import('./pages/HabitDetail'));
const TherapistSignup = lazy(() => import('./pages/TherapistSignup'));
const TherapistLogin = lazy(() => import('./pages/TherapistLogin'));

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
                        <Route path="/therapist/signup" element={<TherapistSignup />} />
                        <Route path="/therapist/login" element={<TherapistLogin />} />

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
                            <Route path="/journal" element={<Journal />} />
                            <Route path="/habits" element={<Habits />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/crisis" element={<CrisisSupport />} />
                            <Route path="/habits/:id" element={<HabitDetail />} />
                            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                            <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><AdminApplications /></ProtectedRoute>} />
                            <Route path="/therapist-portal" element={<ProtectedRoute allowedRoles={['therapist']}><TherapistDashboard /></ProtectedRoute>} />
                            <Route path="/therapist-portal/patient/:patientId" element={<ProtectedRoute allowedRoles={['therapist']}><PatientDetails /></ProtectedRoute>} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AppProvider>
    );
}


