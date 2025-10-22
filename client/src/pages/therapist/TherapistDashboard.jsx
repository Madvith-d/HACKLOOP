import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Clock, TrendingUp, Video, FileText, Search } from 'lucide-react';

export default function TherapistDashboard() {
    const navigate = useNavigate();
    const [selectedFilter, setSelectedFilter] = useState('all');

    const stats = [
        { label: 'Active Patients', value: '24', change: '+3', icon: Users, color: '#667eea' },
        { label: 'Today\'s Sessions', value: '5', change: '2 completed', icon: Calendar, color: '#764ba2' },
        { label: 'This Week', value: '18', change: '+2', icon: Clock, color: '#f093fb' },
        { label: 'Avg. Progress', value: '78%', change: '+5%', icon: TrendingUp, color: '#4facfe' },
    ];

    const upcomingSessions = [
        { 
            id: 1, 
            patient: 'Alice Johnson', 
            time: '10:00 AM', 
            duration: '60 min', 
            type: 'Video Call',
            status: 'confirmed',
            notes: 'Follow-up on anxiety management techniques'
        },
        { 
            id: 2, 
            patient: 'Bob Williams', 
            time: '2:00 PM', 
            duration: '45 min', 
            type: 'Video Call',
            status: 'confirmed',
            notes: 'Initial consultation'
        },
        { 
            id: 3, 
            patient: 'Carol Davis', 
            time: '4:00 PM', 
            duration: '60 min', 
            type: 'Video Call',
            status: 'pending',
            notes: 'Stress management session'
        },
    ];

    const recentPatients = [
        { 
            id: 1, 
            name: 'Alice Johnson', 
            lastSession: '2 days ago', 
            progress: 85,
            moodTrend: 'improving',
            upcomingSession: 'Today, 10:00 AM'
        },
        { 
            id: 2, 
            name: 'Bob Williams', 
            lastSession: '1 week ago', 
            progress: 65,
            moodTrend: 'stable',
            upcomingSession: 'Today, 2:00 PM'
        },
        { 
            id: 3, 
            name: 'Emma Davis', 
            lastSession: '3 days ago', 
            progress: 72,
            moodTrend: 'improving',
            upcomingSession: 'Tomorrow, 11:00 AM'
        },
        { 
            id: 4, 
            name: 'David Chen', 
            lastSession: '5 days ago', 
            progress: 58,
            moodTrend: 'declining',
            upcomingSession: 'Tomorrow, 3:00 PM'
        },
    ];

    return (
        <div className="therapist-dashboard">
            <header className="page-header">
                <div>
                    <h1>Therapist Dashboard</h1>
                    <p>Manage your patients and sessions</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                                <Icon size={24} style={{ color: stat.color }} />
                            </div>
                            <div className="stat-content">
                                <h3>{stat.value}</h3>
                                <p>{stat.label}</p>
                                <span style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--color-muted-foreground)',
                                    fontWeight: 600
                                }}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Today's Sessions */}
                <div className="dashboard-section">
                    <h2 style={{ marginBottom: '1.5rem' }}>Today's Sessions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {upcomingSessions.map((session) => (
                            <div key={session.id} className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                            {session.patient}
                                        </h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                            {session.notes}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: session.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                        border: `1px solid ${session.status === 'confirmed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: session.status === 'confirmed' ? '#10b981' : '#f59e0b',
                                        height: 'fit-content',
                                    }}>
                                        {session.status}
                                    </span>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid hsl(var(--border))'
                                }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={16} />
                                            {session.time}
                                        </span>
                                        <span>{session.duration}</span>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}
                                        onClick={() => navigate(`/video-call?session=${session.id}&patient=${encodeURIComponent(session.patient)}`)}
                                    >
                                        <Video size={16} style={{ marginRight: '0.5rem' }} />
                                        Join Call
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-section">
                    <h2 style={{ marginBottom: '1.5rem' }}>Quick Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button className="card" style={{ 
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            border: '1px solid hsl(var(--border))',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                        }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                background: 'rgba(102, 126, 234, 0.1)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <FileText size={24} color="#667eea" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    Write Session Notes
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                    Document today's sessions
                                </p>
                            </div>
                        </button>

                        <button className="card" style={{ 
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            border: '1px solid hsl(var(--border))',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                        }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                background: 'rgba(118, 75, 162, 0.1)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Calendar size={24} color="#764ba2" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    Schedule Appointments
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                    Manage your calendar
                                </p>
                            </div>
                        </button>

                        <button className="card" style={{ 
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            border: '1px solid hsl(var(--border))',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                        }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                background: 'rgba(240, 147, 251, 0.1)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <TrendingUp size={24} color="#f093fb" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    View Patient Analytics
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                    Track progress trends
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Patient List */}
            <div className="dashboard-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>My Patients</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ 
                                position: 'absolute', 
                                left: '1rem', 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                color: 'var(--color-muted-foreground)'
                            }} />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    width: '250px',
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {recentPatients.map((patient) => (
                        <div 
                            key={patient.id} 
                            className="card" 
                            style={{ 
                                padding: '1.5rem', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => navigate(`/therapist/patient/${patient.id}`)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    {patient.name}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                    Last session: {patient.lastSession}
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    <span>Progress</span>
                                    <span style={{ fontWeight: 600 }}>{patient.progress}%</span>
                                </div>
                                <div style={{ 
                                    width: '100%', 
                                    height: '8px', 
                                    background: 'var(--color-secondary)', 
                                    borderRadius: '9999px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: `${patient.progress}%`, 
                                        height: '100%', 
                                        background: patient.progress > 70 ? '#10b981' : patient.progress > 50 ? '#f59e0b' : '#ef4444',
                                        transition: 'width 0.3s'
                                    }} />
                                </div>
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                paddingTop: '1rem',
                                borderTop: '1px solid hsl(var(--border))'
                            }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    background: patient.moodTrend === 'improving' ? 'rgba(16, 185, 129, 0.1)' : 
                                               patient.moodTrend === 'stable' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${patient.moodTrend === 'improving' ? 'rgba(16, 185, 129, 0.3)' : 
                                                         patient.moodTrend === 'stable' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: patient.moodTrend === 'improving' ? '#10b981' : 
                                           patient.moodTrend === 'stable' ? '#f59e0b' : '#ef4444',
                                }}>
                                    {patient.moodTrend}
                                </span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/therapist/patient/${patient.id}`);
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: 'var(--color-foreground)',
                                    }}>
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
