import React, { useState } from 'react';
import { Users, UserCheck, Activity, TrendingUp, Search, Filter, MoreVertical } from 'lucide-react';

export default function AdminDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showBanner, setShowBanner] = useState(() => new URLSearchParams(window.location.search).get('login') === '1');

    const stats = [
        { label: 'Total Users', value: '2,543', change: '+12%', icon: Users, color: '#667eea' },
        { label: 'Active Therapists', value: '48', change: '+5%', icon: UserCheck, color: '#764ba2' },
        { label: 'Active Sessions', value: '156', change: '+8%', icon: Activity, color: '#f093fb' },
        { label: 'Platform Usage', value: '94%', change: '+3%', icon: TrendingUp, color: '#4facfe' },
    ];

    const recentUsers = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'User', status: 'active', joined: '2025-01-15' },
        { id: 2, name: 'Dr. Sarah Miller', email: 'sarah.m@example.com', role: 'Therapist', status: 'active', joined: '2024-12-20' },
        { id: 3, name: 'Bob Williams', email: 'bob.w@example.com', role: 'User', status: 'inactive', joined: '2025-01-10' },
        { id: 4, name: 'Dr. Michael Chen', email: 'michael.c@example.com', role: 'Therapist', status: 'active', joined: '2024-11-05' },
        { id: 5, name: 'Emma Davis', email: 'emma.d@example.com', role: 'User', status: 'active', joined: '2025-01-18' },
    ];

    const pendingApprovals = [
        { id: 1, name: 'Dr. Jessica Brown', specialty: 'Clinical Psychology', experience: '8 years', submitted: '2 days ago' },
        { id: 2, name: 'Dr. David Wilson', specialty: 'Cognitive Behavioral Therapy', experience: '5 years', submitted: '1 day ago' },
    ];

    return (
        <div className="admin-dashboard">
            <header className="page-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Manage users, therapists, and platform operations</p>
                    {showBanner && (
                        <div className="card" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8 }}>
                            Logged in as Admin
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
                                    color: stat.change.startsWith('+') ? '#10b981' : '#ef4444',
                                    fontWeight: 600
                                }}>
                                    {stat.change} from last month
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pending Therapist Approvals */}
            <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Pending Therapist Approvals</h2>
                    <span style={{ 
                        background: '#ef4444', 
                        color: 'white', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}>
                        {pendingApprovals.length} Pending
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pendingApprovals.map((approval) => (
                        <div key={approval.id} className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        {approval.name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '2rem', color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>
                                        <span><strong>Specialty:</strong> {approval.specialty}</span>
                                        <span><strong>Experience:</strong> {approval.experience}</span>
                                        <span><strong>Submitted:</strong> {approval.submitted}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                                        Approve
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                                        Review
                                    </button>
                                    <button style={{
                                        padding: '0.5rem 1.25rem',
                                        background: 'transparent',
                                        border: '1.5px solid #ef4444',
                                        borderRadius: '9999px',
                                        color: '#ef4444',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                    }}>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Management */}
            <div className="dashboard-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>User Management</h2>
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
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    width: '300px',
                                }}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem',
                                fontSize: '0.95rem',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-foreground)' }}>User</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-foreground)' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-foreground)' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-foreground)' }}>Joined</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-foreground)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>{user.email}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            background: user.role === 'Therapist' ? 'rgba(102, 126, 234, 0.1)' : 'var(--color-secondary)',
                                            border: `1px solid ${user.role === 'Therapist' ? 'rgba(102, 126, 234, 0.3)' : 'hsl(var(--border))'}`,
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: user.role === 'Therapist' ? '#667eea' : 'var(--color-foreground)',
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.25rem 0.75rem',
                                            background: user.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            border: `1px solid ${user.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: user.status === 'active' ? '#10b981' : '#ef4444',
                                        }}>
                                            <span style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: user.status === 'active' ? '#10b981' : '#ef4444',
                                            }} />
                                            {user.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-muted-foreground)', fontSize: '0.95rem' }}>
                                        {user.joined}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button style={{
                                            padding: '0.5rem',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '0.375rem',
                                        }}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
