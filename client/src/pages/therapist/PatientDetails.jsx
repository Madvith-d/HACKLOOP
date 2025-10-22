import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, FileText, TrendingUp, Calendar, Clock, Brain, ArrowLeft, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientDetails() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [reports, setReports] = useState([]);
    const [progressData, setProgressData] = useState(null);
    const [selectedTab, setSelectedTab] = useState('overview');

    useEffect(() => {
        loadPatientData();
    }, [patientId]);

    const loadPatientData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            // Load patient sessions
            const sessionsRes = await fetch(
                `${API_BASE_URL}/api/therapy-sessions/patient/${patientId}/history?limit=20`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const sessionsData = await sessionsRes.json();
            setSessions(sessionsData.data || []);

            // Load patient reports
            const reportsRes = await fetch(
                `${API_BASE_URL}/api/session-reports/patient/${patientId}?limit=10`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const reportsData = await reportsRes.json();
            setReports(reportsData.data || []);

            // Load progress data
            const progressRes = await fetch(
                `${API_BASE_URL}/api/session-reports/patient/${patientId}/progress`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const progressDataRes = await progressRes.json();
            setProgressData(progressDataRes.data);

            // Set patient basic info (from first session)
            if (sessionsData.data && sessionsData.data.length > 0) {
                setPatient({
                    id: patientId,
                    name: sessionsData.data[0].patientId?.displayName || 'Patient',
                    email: sessionsData.data[0].patientId?.email || ''
                });
            }

        } catch (error) {
            console.error('Error loading patient data:', error);
        } finally {
            setLoading(false);
        }
    };

    const startNewSession = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const therapistId = localStorage.getItem('userId');

            // Create new therapy session
            const response = await fetch(`${API_BASE_URL}/api/therapy-sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    therapistId,
                    patientId,
                    startTime: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (result.success) {
                // Navigate to video call with session ID
                navigate(`/video-call?therapySessionId=${result.data._id}&patientId=${patientId}&patient=${encodeURIComponent(patient?.name || 'Patient')}`);
            } else {
                alert('Failed to start session: ' + result.message);
            }
        } catch (error) {
            console.error('Error starting session:', error);
            alert('Error starting session');
        }
    };

    const viewReport = (reportId) => {
        navigate(`/therapist/report/${reportId}`);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const getTrendColor = (trend) => {
        if (trend === 'improving') return '#10b981';
        if (trend === 'declining') return '#ef4444';
        return '#f59e0b';
    };

    const getGainScoreColor = (score) => {
        if (score > 20) return '#10b981';
        if (score > 5) return '#06b6d4';
        if (score > -5) return '#f59e0b';
        if (score > -20) return '#fb923c';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <div>Loading patient data...</div>
            </div>
        );
    }

    // Prepare chart data
    const chartData = progressData?.timeline?.map(item => ({
        date: new Date(item.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: item.progressMetrics.therapeuticGainScore,
        emotion: item.emotionAnalysis.dominantEmotion
    })).reverse() || [];

    return (
        <div className="patient-details-page">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/therapist')}
                        style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>{patient?.name || 'Patient'}</h1>
                        <p style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>
                            {patient?.email}
                        </p>
                    </div>
                </div>

                <button
                    onClick={startNewSession}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Video size={20} />
                    Start New Session
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Calendar size={20} color="#667eea" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                            Total Sessions
                        </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {sessions.length}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <TrendingUp size={20} color="#10b981" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                            Average Gain
                        </span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {progressData?.averageGain?.averageGain?.toFixed(1) || '0'}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Activity size={20} color="#f59e0b" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                            Trend
                        </span>
                    </div>
                    <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700,
                        color: getTrendColor(progressData?.longTermTrend?.trend),
                        textTransform: 'capitalize'
                    }}>
                        {progressData?.longTermTrend?.trend || 'N/A'}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Clock size={20} color="#3b82f6" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                            Last Session
                        </span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {sessions[0] ? formatDate(sessions[0].startTime) : 'N/A'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '1px solid hsl(var(--border))'
            }}>
                {['overview', 'sessions', 'reports'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        style={{
                            padding: '1rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: selectedTab === tab ? '2px solid #667eea' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: selectedTab === tab ? 600 : 400,
                            color: selectedTab === tab ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
                <div>
                    {/* Progress Chart */}
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Therapeutic Gain Progress</h3>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                    <XAxis dataKey="date" style={{ fontSize: '0.75rem' }} />
                                    <YAxis style={{ fontSize: '0.75rem' }} />
                                    <Tooltip 
                                        contentStyle={{
                                            background: 'white',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '0.5rem',
                                            padding: '0.75rem'
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="score" 
                                        stroke="#667eea" 
                                        strokeWidth={2}
                                        dot={{ fill: '#667eea', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '3rem', 
                                color: 'var(--color-muted-foreground)' 
                            }}>
                                No progress data available yet
                            </div>
                        )}
                    </div>

                    {/* Recent Reports Preview */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Recent Reports</h3>
                            <button
                                onClick={() => setSelectedTab('reports')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'transparent',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                View All
                            </button>
                        </div>

                        {reports.slice(0, 3).map(report => (
                            <div
                                key={report._id}
                                style={{
                                    padding: '1rem',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => viewReport(report._id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {formatDate(report.generatedAt)}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                            Gain Score: 
                                            <span style={{ 
                                                color: getGainScoreColor(report.progressMetrics.therapeuticGainScore),
                                                fontWeight: 600,
                                                marginLeft: '0.5rem'
                                            }}>
                                                {report.progressMetrics.therapeuticGainScore > 0 ? '+' : ''}
                                                {report.progressMetrics.therapeuticGainScore}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        border: '1px solid rgba(102, 126, 234, 0.3)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: '#667eea',
                                        textTransform: 'capitalize'
                                    }}>
                                        {report.emotionAnalysis.dominantEmotion}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedTab === 'sessions' && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Session History</h3>
                    
                    {sessions.map(session => (
                        <div
                            key={session._id}
                            style={{
                                padding: '1.5rem',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                                        {formatDate(session.startTime)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
                                        <span>Duration: {formatDuration(session.duration)}</span>
                                        <span>Status: <span style={{ textTransform: 'capitalize' }}>{session.status}</span></span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        border: '1px solid rgba(102, 126, 234, 0.3)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: '#667eea'
                                    }}>
                                        <Brain size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        {session.emotionTimeline?.length || 0} emotions tracked
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '3rem', 
                            color: 'var(--color-muted-foreground)' 
                        }}>
                            No sessions yet. Start a new session to begin tracking progress.
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'reports' && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Clinical Reports</h3>
                    
                    {reports.map(report => (
                        <div
                            key={report._id}
                            style={{
                                padding: '1.5rem',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => viewReport(report._id)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                                        {formatDate(report.generatedAt)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                                        <span>
                                            Gain Score: 
                                            <span style={{ 
                                                color: getGainScoreColor(report.progressMetrics.therapeuticGainScore),
                                                fontWeight: 600,
                                                marginLeft: '0.5rem'
                                            }}>
                                                {report.progressMetrics.therapeuticGainScore > 0 ? '+' : ''}
                                                {report.progressMetrics.therapeuticGainScore}
                                            </span>
                                        </span>
                                        <span>
                                            Trend: 
                                            <span style={{ 
                                                color: getTrendColor(report.progressMetrics.trendAnalysis),
                                                fontWeight: 600,
                                                marginLeft: '0.5rem',
                                                textTransform: 'capitalize'
                                            }}>
                                                {report.progressMetrics.trendAnalysis}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <FileText size={24} color="#667eea" />
                            </div>

                            {report.keyInsights && report.keyInsights.length > 0 && (
                                <div style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--color-muted-foreground)',
                                    borderTop: '1px solid hsl(var(--border))',
                                    paddingTop: '1rem'
                                }}>
                                    <strong>Key Insight:</strong> {report.keyInsights[0]}
                                </div>
                            )}
                        </div>
                    ))}

                    {reports.length === 0 && (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '3rem', 
                            color: 'var(--color-muted-foreground)' 
                        }}>
                            No reports generated yet. Complete a session to generate a report.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
