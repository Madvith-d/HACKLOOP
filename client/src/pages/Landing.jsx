import React from 'react';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import Features from '../components/Features';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Landing() {
    return (
        <div className="landing">
            <Nav />
            <Hero />
            <Problem />
            <Features />
            <CTA />
            <Footer />
        </div>
    );
}
