import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Camera, Calendar, TrendingUp, Heart, Brain, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
    const { user, emotionHistory, sessions } = useApp();

    const stats = [
        { label: 'Check-ins This Week', value: '12', icon: Heart, color: '#667eea' },
        { label: 'AI Conversations', value: '8', icon: MessageCircle, color: '#764ba2' },
        { label: 'Upcoming Sessions', value: '2', icon: Calendar, color: '#f093fb' },
        { label: 'Mood Score', value: '7.5/10', icon: TrendingUp, color: '#4facfe' },
    ];

    const recentActivities = [
        { type: 'check-in', message: 'Completed emotion check-in', time: '2 hours ago' },
        { type: 'chat', message: 'AI conversation about stress management', time: '5 hours ago' },
        { type: 'session', message: 'Session with Dr. Sarah Johnson', time: 'Yesterday' },
        { type: 'milestone', message: 'Achieved 30-day streak! 🎉', time: '2 days ago' },
    ];

    const quickActions = [
        { title: 'Start AI Chat', icon: MessageCircle, link: '/chat', color: '#667eea' },
        { title: 'Emotion Check-in', icon: Camera, link: '/emotion', color: '#764ba2' },
        { title: 'Book Therapist', icon: Calendar, link: '/therapists', color: '#f093fb' },
        { title: 'View Analytics', icon: Brain, link: '/analytics', color: '#4facfe' },
    ];

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Welcome back, {user?.name}! 👋</h1>
                    <p>Here's your mental wellness overview</p>
                </div>
            </header>

            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
                            <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                                <Icon size={24} style={{ color: stat.color }} />
                            </div>
                            <div className="stat-content">
                                <h3>{stat.value}</h3>
                                <p>{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Link key={index} to={action.link} className="quick-action-card">
                                    <div className="action-icon" style={{ backgroundColor: action.color }}>
                                        <Icon size={28} />
                                    </div>
                                    <span>{action.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Recent Activity</h2>
                    <div className="activity-list">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-icon">
                                    <Zap size={16} />
                                </div>
                                <div className="activity-content">
                                    <p>{activity.message}</p>
                                    <span className="activity-time">{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-section daily-tip">
                <h2>💡 Today's Wellness Tip</h2>
                <p>Taking a few minutes to practice deep breathing can significantly reduce stress levels. Try the 4-7-8 technique: breathe in for 4 counts, hold for 7, and exhale for 8.</p>
            </div>
        </div>
    );
}
