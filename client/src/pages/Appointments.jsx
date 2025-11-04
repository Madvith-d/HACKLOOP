import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarCheck, Clock, Video, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
export default function Appointments() {
    const navigate = useNavigate();
    const { user } = useApp();

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [sessions, setSessions] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const mocked = useMemo(() => ({
        bookings: [
            {
                id: 'mock-b1',
                therapistName: 'Dr. Warrrrrrrrr',
                date: new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10), // +36h
                time: '10:00 AM',
                price: 120,
                status: 'confirmed',
                location: 'Video'
            },
            {
                id: 'mock-b2',
                therapistName: 'Dr. Araan',
                date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10), // +5d
                time: '2:00 PM',
                price: 150,
                status: 'scheduled',
                location: 'Video'
            }
        ],
        sessions: [
            {
                id: 'mock-s1',
                therapistName: 'Dr. Ashil Jathu',
                scheduledDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10), // -7d
                scheduledTime: '4:00 PM',
                status: 'completed',
                duration: 55
            }
        ]
    }), []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                if (!token) {
                    if (!cancelled) {
                        setBookings(mocked.bookings);
                        setSessions(mocked.sessions);
                    }
                    return;
                }

                const [bRes, sRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/users/me/bookings`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL}/api/sessions/my-sessions`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (!cancelled) {
                    const bJson = (await bRes.json()).bookings || [];
                    const sJson = (await sRes.json()).sessions || [];
                    setBookings(bJson);
                    setSessions(sJson);
                }
            } catch (e) {
                if (!cancelled) {
                    setBookings(mocked.bookings);
                    setSessions(mocked.sessions);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [API_BASE_URL, mocked]);

    const upcoming = useMemo(() => {
        const now = new Date();
        const fromBookings = bookings
            .filter(b => new Date(b.date) >= new Date(now.toDateString()))
            .map(b => ({
                id: b.id,
                therapistName: b.therapistName,
                date: b.date,
                time: b.time,
                status: b.status || 'confirmed',
                source: 'booking',
                price: b.price,
                location: b.location || 'Video'
            }));
        const fromSessions = sessions
            .filter(s => s.status === 'scheduled')
            .map(s => ({
                id: s.id,
                therapistName: s.therapistName || s.therapistId || 'Therapist',
                date: s.scheduledDate,
                time: s.scheduledTime,
                status: s.status,
                source: 'session',
                roomId: s.roomId
            }));
        return [...fromBookings, ...fromSessions]
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [bookings, sessions]);

    const past = useMemo(() => {
        const now = new Date();
        const fromSessions = sessions
            .filter(s => s.status === 'completed' || new Date(s.scheduledDate) < now)
            .map(s => ({
                id: s.id,
                therapistName: s.therapistName || s.therapistId || 'Therapist',
                date: s.scheduledDate,
                time: s.scheduledTime,
                status: s.status || 'completed',
                duration: s.duration || 0
            }));
        return fromSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [sessions]);

    const nextAppt = upcoming[0];

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>My Appointments</h1>
                    <p>View and manage your scheduled therapy sessions</p>
                </div>
            </header>
            <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: 'rgba(102, 126, 234, 0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <CalendarCheck size={24} color="#667eea" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                                    {nextAppt ? `${nextAppt.date} at ${nextAppt.time}` : 'No upcoming appointments'}
                                </div>
                                <div style={{ color: 'var(--color-muted-foreground)', fontSize: '0.9rem' }}>
                                    {nextAppt ? `With ${nextAppt.therapistName}` : 'Book a session from the Therapists page'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => nextAppt && navigate(`/video-call?session=${encodeURIComponent(nextAppt.id)}&therapist=${encodeURIComponent(nextAppt.therapistName)}`)}
                                disabled={!nextAppt}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Video size={18} />
                                Join Call
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Upcoming</h2>
                    {loading ? (
                        <div className="card" style={{ padding: '1.5rem' }}>Loading appointments...</div>
                    ) : upcoming.length === 0 ? (
                        <div className="card" style={{ padding: '1.5rem', color: 'var(--color-muted-foreground)' }}>
                            No upcoming appointments.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {upcoming.map(item => (
                                <div key={item.id} className="card" style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{item.therapistName}</div>
                                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-muted-foreground)', fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Calendar size={16} /> {item.date}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={16} /> {item.time}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <MapPin size={16} /> Video
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: 6,
                                                border: '1px solid rgba(102,126,234,0.35)',
                                                background: 'rgba(102,126,234,0.12)',
                                                color: '#667eea',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                textTransform: 'capitalize'
                                            }}>{item.status}</span>
                                            <button
                                                className="btn"
                                                onClick={() => navigate(`/video-call?session=${encodeURIComponent(item.id)}&therapist=${encodeURIComponent(item.therapistName)}`)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                            >
                                                <Video size={16} />
                                                Join
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dashboard-section">
                    <h2>Past</h2>
                    {loading ? (
                        <div className="card" style={{ padding: '1.5rem' }}>Loading history...</div>
                    ) : past.length === 0 ? (
                        <div className="card" style={{ padding: '1.5rem', color: 'var(--color-muted-foreground)' }}>
                            No completed sessions yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {past.map(item => (
                                <div key={item.id} className="card" style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{item.therapistName}</div>
                                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-muted-foreground)', fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Calendar size={16} /> {item.date}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={16} /> {item.time}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ color: 'var(--color-muted-foreground)', fontSize: '0.9rem' }}>
                                            {item.duration ? `${item.duration} min` : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}