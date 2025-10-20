import React from 'react';
import { Phone, MessageSquare, AlertCircle, Heart, Globe } from 'lucide-react';

export default function CrisisSupport() {
    const hotlines = [
        {
            name: 'National Suicide Prevention Lifeline',
            number: '988',
            description: '24/7 crisis support in English and Spanish',
            icon: Phone
        },
        {
            name: 'Crisis Text Line',
            number: 'Text HOME to 741741',
            description: 'Free, 24/7 support via text message',
            icon: MessageSquare
        },
        {
            name: 'SAMHSA National Helpline',
            number: '1-800-662-4357',
            description: 'Substance abuse and mental health services',
            icon: Heart
        },
        {
            name: 'Veterans Crisis Line',
            number: '1-800-273-8255',
            description: 'Support for veterans and their families',
            icon: Phone
        },
    ];

    const internationalResources = [
        { country: 'Canada', number: '1-833-456-4566' },
        { country: 'UK', number: '116 123' },
        { country: 'Australia', number: '13 11 14' },
        { country: 'India', number: '91-22-27546669' },
    ];

    const immediateDanger = (
        <div className="danger-alert">
            <AlertCircle size={32} />
            <div>
                <h3>If you are in immediate danger:</h3>
                <p>Call 911 (US) or your local emergency services immediately.</p>
                <button className="btn-emergency">
                    <Phone size={20} />
                    Call Emergency Services
                </button>
            </div>
        </div>
    );

    return (
        <div className="crisis-page">
            <header className="page-header">
                <div>
                    <h1>Crisis Support</h1>
                    <p>You're not alone. Help is available 24/7</p>
                </div>
            </header>

            {immediateDanger}

            <div className="crisis-section">
                <h2>Crisis Hotlines</h2>
                <div className="hotlines-grid">
                    {hotlines.map((hotline, index) => {
                        const Icon = hotline.icon;
                        return (
                            <div key={index} className="hotline-card">
                                <div className="hotline-icon">
                                    <Icon size={32} />
                                </div>
                                <h3>{hotline.name}</h3>
                                <p className="hotline-number">{hotline.number}</p>
                                <p className="hotline-desc">{hotline.description}</p>
                                <button className="btn-primary">
                                    <Phone size={18} />
                                    Call Now
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="crisis-section">
                <h2><Globe size={24} /> International Resources</h2>
                <div className="international-grid">
                    {internationalResources.map((resource, index) => (
                        <div key={index} className="international-card">
                            <h4>{resource.country}</h4>
                            <p>{resource.number}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="crisis-section coping-strategies">
                <h2>Immediate Coping Strategies</h2>
                <div className="strategies-grid">
                    <div className="strategy-card">
                        <h3>5-4-3-2-1 Grounding</h3>
                        <p>Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.</p>
                    </div>
                    <div className="strategy-card">
                        <h3>Deep Breathing</h3>
                        <p>Breathe in for 4 counts, hold for 4, exhale for 4. Repeat until you feel calmer.</p>
                    </div>
                    <div className="strategy-card">
                        <h3>Reach Out</h3>
                        <p>Call a trusted friend or family member. Connection can help during difficult times.</p>
                    </div>
                    <div className="strategy-card">
                        <h3>Safe Space</h3>
                        <p>Move to a comfortable, safe environment where you feel secure and protected.</p>
                    </div>
                </div>
            </div>

            <div className="crisis-section warning-signs">
                <h2>Warning Signs to Watch For</h2>
                <ul className="warning-list">
                    <li>Talking about wanting to die or hurt oneself</li>
                    <li>Looking for ways to end one's life</li>
                    <li>Talking about feeling hopeless or having no purpose</li>
                    <li>Talking about feeling trapped or in unbearable pain</li>
                    <li>Increasing use of alcohol or drugs</li>
                    <li>Withdrawing from friends and family</li>
                    <li>Displaying extreme mood swings</li>
                    <li>Acting anxious, agitated, or recklessly</li>
                </ul>
                <p className="warning-note">
                    If you or someone you know is experiencing these signs, please seek help immediately.
                </p>
            </div>
        </div>
    );
}
