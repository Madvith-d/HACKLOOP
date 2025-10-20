import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Bell, Shield, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Profile() {
    const { user } = useApp();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '+1 (555) 123-4567',
        birthdate: '1990-01-01',
    });

    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        darkMode: true,
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSettingChange = (setting) => {
        setSettings({ ...settings, [setting]: !settings[setting] });
    };

    const handleSave = (e) => {
        e.preventDefault();
        alert('Profile updated successfully!');
    };

    return (
        <div className="profile-page">
            <header className="page-header">
                <div>
                    <h1>Profile & Settings</h1>
                    <p>Manage your account and preferences</p>
                </div>
            </header>

            <div className="profile-grid">
                <div className="profile-card">
                    <div className="profile-avatar-section">
                        <img src={user?.avatar} alt={user?.name} className="profile-avatar-large" />
                        <button className="btn-secondary">Change Photo</button>
                    </div>

                    <form onSubmit={handleSave} className="profile-form">
                        <h3><User size={20} /> Personal Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="birthdate">Birth Date</label>
                            <input
                                id="birthdate"
                                name="birthdate"
                                type="date"
                                value={formData.birthdate}
                                onChange={handleInputChange}
                            />
                        </div>

                        <button type="submit" className="btn-primary">
                            Save Changes
                        </button>
                    </form>
                </div>

                <div className="settings-card">
                    <h3><Bell size={20} /> Notifications</h3>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div>
                                <h4>Email Notifications</h4>
                                <p>Receive updates via email</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={() => handleSettingChange('emailNotifications')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div>
                                <h4>Push Notifications</h4>
                                <p>Get notified about check-ins and sessions</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.pushNotifications}
                                    onChange={() => handleSettingChange('pushNotifications')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div>
                                <h4>Weekly Reports</h4>
                                <p>Receive weekly progress summaries</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.weeklyReports}
                                    onChange={() => handleSettingChange('weeklyReports')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '2rem' }}><Shield size={20} /> Security</h3>
                    <div className="settings-list">
                        <button className="setting-button">
                            <span>Change Password</span>
                            <span>→</span>
                        </button>
                        <button className="setting-button">
                            <span>Two-Factor Authentication</span>
                            <span>→</span>
                        </button>
                        <button className="setting-button danger">
                            <span>Delete Account</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
