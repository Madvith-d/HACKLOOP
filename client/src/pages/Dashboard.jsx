import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Camera, Calendar, TrendingUp, Heart, Brain, Zap, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { emotionAPI, chatAPI, sessionAPI } from '../utils/api';
import { calculateWellnessScore } from '../utils/wellnessScore';

export default function Dashboard() {
    const { user, emotionHistory, sessions } = useApp();
    const [loading, setLoading] = useState(true);
    const [wellnessScore, setWellnessScore] = useState(null);
    const [stats, setStats] = useState([
        { label: 'Check-ins This Week', value: '0', icon: Heart, color: '#667eea' },
        { label: 'AI Conversations', value: '0', icon: MessageCircle, color: '#764ba2' },
        { label: 'Upcoming Sessions', value: '0', icon: Calendar, color: '#f093fb' },
        { label: 'Wellness Score', value: '--', icon: TrendingUp, color: '#4facfe' },
    ]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Fetch data in parallel
                const [emotionsRes, chatHistoryRes, sessionsRes, analyticsRes] = await Promise.all([
                    emotionAPI.getMyEmotions().catch(() => ({ emotions: [] })),
                    chatAPI.getHistory(20, 0).catch(() => ({ messages: [] })),
                    sessionAPI.getMySessions().catch(() => ({ sessions: [] })),
                    emotionAPI.getAnalytics().catch(() => ({})),
                ]);

                const emotions = emotionsRes.emotions || [];
                const chatMessages = chatHistoryRes.messages || [];
                const userSessions = sessionsRes.sessions || [];
                
                // Calculate check-ins this week
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const checkInsThisWeek = emotions.filter(e => {
                    const timestamp = new Date(e.timestamp);
                    return timestamp >= oneWeekAgo;
                }).length;

                // Count upcoming sessions
                const upcomingSessions = userSessions.filter(s => {
                    if (s.status === 'scheduled' || s.status === 'confirmed') {
                        const scheduledDate = new Date(s.scheduled_date || s.scheduledDate);
                        return scheduledDate >= new Date();
                    }
                    return false;
                }).length;

                // Calculate wellness score
                const wellness = calculateWellnessScore(
                    analyticsRes,
                    chatMessages.map(m => ({
                        emotional_analysis: m.emotional_analysis,
                    })),
                    [],
                    []
                );

                setWellnessScore(wellness);

                // Update stats
                setStats([
                    { label: 'Check-ins This Week', value: checkInsThisWeek.toString(), icon: Heart, color: '#667eea' },
                    { label: 'AI Conversations', value: chatMessages.length.toString(), icon: MessageCircle, color: '#764ba2' },
                    { label: 'Upcoming Sessions', value: upcomingSessions.toString(), icon: Calendar, color: '#f093fb' },
                    { label: 'Wellness Score', value: `${wellness.scoreOutOf10}/10`, icon: TrendingUp, color: wellness.color },
                ]);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

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
                    {new URLSearchParams(window.location.search).get('login') === '1' && (
                        <div className="card" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8 }}>
                            Logged in successfully
                        </div>
                    )}
                </div>
            </header>

            <div className="stats-grid">
                {loading ? (
                    <div className="stat-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: '#667eea' }} />
                        <p style={{ marginTop: '1rem', color: 'var(--color-muted-foreground)' }}>Loading dashboard data...</p>
                    </div>
                ) : (
                    stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
                                <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                                    <Icon size={24} style={{ color: stat.color }} />
                                </div>
                                <div className="stat-content">
                                    <h3>{stat.value}</h3>
                                    <p>{stat.label}</p>
                                    {stat.label === 'Wellness Score' && wellnessScore && (
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            color: wellnessScore.color,
                                            fontWeight: 600,
                                            marginTop: '0.25rem',
                                            display: 'block'
                                        }}>
                                            {wellnessScore.level.charAt(0).toUpperCase() + wellnessScore.level.slice(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
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
