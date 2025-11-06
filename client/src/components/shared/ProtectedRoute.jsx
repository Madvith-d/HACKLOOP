import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, user } = useApp();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && allowedRoles.length > 0) {
        const role = user?.role;
        if (!role || !allowedRoles.includes(role)) {
            // Redirect to a safe default based on role
            if (role === 'admin') return <Navigate to="/admin" replace />;
            if (role === 'therapist') return <Navigate to="/therapist-portal" replace />;
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}
