import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Camera, Calendar, BarChart3, User, AlertCircle, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useApp();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
        { path: '/emotion', icon: Camera, label: 'Emotion Tracking' },
        { path: '/therapists', icon: Calendar, label: 'Therapists' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/crisis', icon: AlertCircle, label: 'Crisis Support' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>MindMesh<span>+</span></h2>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
