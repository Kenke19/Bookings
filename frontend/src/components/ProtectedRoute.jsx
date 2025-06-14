import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user } = useAuth();

    if (!user) {
    // User not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
    // User logged in but not admin, redirect to user dashboard
        return <Navigate to="/user-dashboard" replace />;
    }

  // User logged in and authorized
    return children;
}
