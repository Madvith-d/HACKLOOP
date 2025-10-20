import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
    return (
        <nav>
            <Link to="/" className="logo">MindMesh+</Link>
            <ul className="nav-links">
                <li><a href="#features">Features</a></li>
                <li><Link to="/login">Sign In</Link></li>
            </ul>
            <Link to="/signup">
                <button className="cta-button">Get Started</button>
            </Link>
        </nav>
    );
}


