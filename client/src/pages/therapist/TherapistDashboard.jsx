import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Clock, TrendingUp, Video, FileText, Search } from 'lucide-react';

export default function TherapistDashboard() {
    const navigate = useNavigate();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showBanner] = useState(() => new URLSearchParams(window.location.search).get('login') === '1');
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState([]);
    const [schedule, setSchedule] = useState({ sessions: [], bookings: [] });
    const [stats, setStats] = useState([
        { label: 'Active Patients', value: '0', change: '+0', icon: Users, color: '#667eea' },
        { label: 'Today\'s Sessions', value: '0', change: '0 completed', icon: Calendar, color: '#764ba2' },
        { label: 'This Week', value: '0', change: '+0', icon: Clock, color: '#f093fb' },
        { label: 'Avg. Progress', value: '0%', change: '+0%', icon: TrendingUp, color: '#4facfe' },
    ]);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    React.useEffect(() => {
        fetchTherapistData();
    }, []);

    const fetchTherapistData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const patientsRes = await fetch(`${API_BASE_URL}/api/therapists/my-patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const patientsData = await patientsRes.json();

            const scheduleRes = await fetch(`${API_BASE_URL}/api/therapists/my-schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const scheduleData = await scheduleRes.json();

            setPatients(patientsData.patients || []);
            setSchedule(scheduleData);

            // Calculate stats
            const today = new Date().toISOString().split('T')[0];
            const todaySessions = scheduleData.sessions?.filter(s => s.scheduled_date === today) || [];
            const completedToday = todaySessions.filter(s => s.status === 'completed').length;

            const thisWeek = scheduleData.sessions?.filter(s => {
                const sessionDate = new Date(s.scheduled_date);
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return sessionDate >= weekAgo && sessionDate <= now;
            }) || [];

            setStats([
                { label: 'Active Patients', value: `${patientsData.patients?.length || 0}`, change: '+0', icon: Users, color: '#667eea' },
                { label: 'Today\'s Sessions', value: `${todaySessions.length}`, change: `${completedToday} completed`, icon: Calendar, color: '#764ba2' },
                { label: 'This Week', value: `${thisWeek.length}`, change: '+0', icon: Clock, color: '#f093fb' },
                { label: 'Avg. Progress', value: '78%', change: '+5%', icon: TrendingUp, color: '#4facfe' },
            ]);

        } catch (error) {
            console.error('Error fetching therapist data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Map sessions to upcoming sessions format - show ALL upcoming sessions, not just today
    const upcomingSessions = React.useMemo(() => {
        console.log('=== upcomingSessions calculation ===');
        console.log('schedule:', schedule);
        console.log('schedule.bookings:', schedule.bookings);
        console.log('schedule.sessions:', schedule.sessions);

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        console.log('Today:', today);

        // Get all future bookings (not just today)
        // TEMPORARILY showing ALL bookings for testing
        const futureBookings = schedule.bookings?.filter(b => {
            // const bookingDate = new Date(b.date);
            // const isFuture = bookingDate >= new Date(today);
            // console.log(`Booking ${b.id}: ${b.date} - isFuture: ${isFuture}`);
            // return isFuture;
            return true; // Show all bookings for now
        }) || [];

        // Get all upcoming/scheduled sessions
        // TEMPORARILY showing ALL sessions for testing
        const futureSessions = schedule.sessions?.filter(s => {
            console.log(`Session ${s.id}: status=${s.status}, scheduled_date=${s.scheduled_date}`);
            if (s.status === 'scheduled' || s.status === 'confirmed') {
                // const sessionDate = new Date(s.scheduled_date);
                // const isFuture = sessionDate >= new Date(today);
                // console.log(`  -> isFuture: ${isFuture}`);
                // return isFuture;
                return true; // Show all sessions for now
            }
            return false;
        }) || [];

        console.log('futureBookings count:', futureBookings.length);
        console.log('futureSessions count:', futureSessions.length);

        const combined = [
            ...futureBookings.map(b => ({
                id: b.id,
                patient: b.patient_name || 'Patient',
                patientId: b.user_id,
                time: b.time,
                date: b.date,
                duration: '60 min',
                type: 'Video Call',
                status: b.status || 'confirmed',
                notes: `Session with ${b.patient_name}`,
                roomId: null // Bookings don't have room_id yet
            })),
            ...futureSessions.map(s => ({
                id: s.id,
                patient: s.patient_name || 'Patient',
                patientId: s.user_id,
                time: s.scheduled_time,
                date: s.scheduled_date,
                duration: '60 min',
                type: 'Video Call',
                status: s.status,
                notes: s.notes || 'Scheduled session',
                roomId: s.room_id // Sessions have room_id
            }))
        ];

        console.log('combined count:', combined.length);

        // Sort by date and time, show only next 10
        const result = combined
            .sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.time}`);
                const dateB = new Date(`${b.date} ${b.time}`);
                return dateA - dateB;
            })
            .slice(0, 10);

        console.log('Final upcomingSessions:', result);
        return result;
    }, [schedule]);

    // Map patients to recentPatients format
    const recentPatients = React.useMemo(() => {
        return patients.map(p => ({
            id: p.id,
            name: p.name,
            lastSession: p.last_session ? new Date(p.last_session).toLocaleDateString() : 'No sessions',
            progress: Math.floor(Math.random() * 40) + 60, // Mock progress for now
            moodTrend: 'improving',
            upcomingSession: 'To be scheduled'
        }));
    }, [patients]);

    if (loading) {
        return (
            <div className="dashboard-page">
                <div style={{ padding: '4rem', textAlign: 'center' }}>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="therapist-dashboard">
            <header className="page-header">
                <div>
                    <h1>Therapist Dashboard</h1>
                    <p>Manage your patients and sessions</p>
                    {showBanner && (
                        <div className="card" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8 }}>
                            Logged in as Therapist
                        </div>
                    )}
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
                {/* Upcoming Sessions */}
                <div className="dashboard-section">
                    <h2 style={{ marginBottom: '1.5rem' }}>Upcoming Sessions</h2>
                    {upcomingSessions.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted-foreground)' }}>
                            No upcoming sessions scheduled.
                        </div>
                    ) : (
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
                                                <Calendar size={16} />
                                                {new Date(session.date).toLocaleDateString()}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={16} />
                                                {session.time}
                                            </span>
                                            <span>{session.duration}</span>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}
                                            onClick={() => {
                                                const roomId = session.roomId || `room-${session.id}`;
                                                navigate(`/video-call?therapySessionId=${session.id}&roomId=${roomId}&patientId=${session.patientId}&patient=${encodeURIComponent(session.patient)}`);
                                            }}
                                        >
                                            <Video size={16} style={{ marginRight: '0.5rem' }} />
                                            Join Call
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
