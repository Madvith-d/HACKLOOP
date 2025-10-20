import React from 'react';
import { Link } from 'react-router-dom';

export default function CTA() {
    return (
        <section className="cta-section">
            <div className="cta-content">
                <h2>Ready to Transform Mental Health Care?</h2>
                <p>Join thousands of users and professionals who trust MindMesh+ for proactive, intelligent mental health support.</p>
                <div className="hero-buttons">
                    <Link to="/signup">
                        <button className="btn-primary">Start Your Journey</button>
                    </Link>
                    <Link to="/therapists">
                        <button className="btn-secondary">For Professionals</button>
                    </Link>
                </div>
            </div>
        </section>
    );
}


