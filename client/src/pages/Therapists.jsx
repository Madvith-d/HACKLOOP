import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Star, Video, MapPin, Award, AlertCircle } from 'lucide-react';
import Modal from '../components/shared/Modal';
import { useApp } from '../context/AppContext';

// Safe JSON parsing function with error handling
const safeParseJSON = (jsonString, fallback = []) => {
    if (typeof jsonString !== 'string') {
        return jsonString || fallback;
    }
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('Failed to parse JSON string:', jsonString, error);
        return fallback;
    }
};

export default function Therapists() {
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');
    const { isAuthenticated } = useApp();

    // Memoize API_BASE_URL to prevent unnecessary re-renders
    const API_BASE_URL = useMemo(() => import.meta.env.VITE_API_URL || 'http://localhost:4000', []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError('');
                const res = await fetch(`${API_BASE_URL}/api/therapists`);
                if (!res.ok) {
                    throw new Error('Failed to fetch therapists');
                }
                const json = await res.json();
                if (!cancelled) {
                    // Parse available field if it's a JSON string - with safe error handling
                    const therapistsData = (json.therapists || []).map(therapist => ({
                        ...therapist,
                        available: typeof therapist.available === 'string' 
                            ? safeParseJSON(therapist.available, []) 
                            : therapist.available || [],
                        price: typeof therapist.price === 'number' 
                            ? `$${therapist.price}/session` 
                            : therapist.price || 'Price not available'
                    }));
                    setTherapists(therapistsData);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Failed to load therapists. Please try again later.');
                    console.error('Error fetching therapists:', err);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [API_BASE_URL]);

    const availableTimes = [
        '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ];

    const handleBooking = (therapist) => {
        if (!isAuthenticated) {
            setError('Please log in to book a session');
            return;
        }
        setSelectedTherapist(therapist);
        setIsBookingOpen(true);
        setBookingError('');
        setBookingSuccess('');
    };

    const confirmBooking = async () => {
        if (!selectedDate || !selectedTime) {
            setBookingError('Please select both date and time');
            return;
        }

        if (!isAuthenticated) {
            setBookingError('Please log in to book a session');
            return;
        }

        setBookingLoading(true);
        setBookingError('');
        setBookingSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication required');
            }

            // Convert time format from "09:00 AM" / "01:00 PM" to "09:00" / "13:00"
            let timeFormatted = selectedTime.trim();
            const isPM = /PM/i.test(timeFormatted);
            const timeMatch = timeFormatted.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1], 10);
                const minutes = timeMatch[2];
                if (isPM && hours !== 12) {
                    hours += 12;
                } else if (!isPM && hours === 12) {
                    hours = 0;
                }
                timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes}`;
            } else {
                // Fallback: just remove AM/PM if format doesn't match
                timeFormatted = timeFormatted.replace(/\s*(AM|PM)\s*/i, '');
            }

            const res = await fetch(`${API_BASE_URL}/api/therapists/${selectedTherapist.id}/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: selectedDate,
                    time: timeFormatted
                })
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to book session');
            }

            setBookingSuccess('Session booked successfully!');
            setTimeout(() => {
                setIsBookingOpen(false);
                setSelectedDate('');
                setSelectedTime('');
                setBookingSuccess('');
                // Optionally refresh therapists or navigate to appointments
            }, 2000);
        } catch (err) {
            setBookingError(err.message || 'Failed to book session. Please try again.');
            console.error('Error booking session:', err);
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="therapists-page">
            <header className="page-header">
                <div>
                    <h1>Find Your Therapist</h1>
                    <p>Connect with licensed mental health professionals</p>
                </div>
            </header>

            {error && (
                <div className="error-message" style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="loading-message" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--color-muted-foreground)'
                }}>
                    Loading therapists...
                </div>
            ) : therapists.length === 0 ? (
                <div className="empty-message" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--color-muted-foreground)'
                }}>
                    No therapists available at the moment.
                </div>
            ) : (
                <div className="therapists-grid">
                    {therapists.map((therapist) => (
                    <div key={therapist.id} className="therapist-card">
                        <div className="therapist-header">
                            <img src={therapist.avatar} alt={therapist.name} className="therapist-avatar" />
                            <div className="therapist-info">
                                <h3>{therapist.name}</h3>
                                <p className="specialty">{therapist.specialty}</p>
                                <div className="therapist-rating">
                                    <Star size={16} fill="#ffd700" stroke="#ffd700" />
                                    <span>{therapist.rating}</span>
                                    <span className="reviews">({therapist.reviews} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="therapist-details">
                            <div className="detail-item">
                                <Award size={18} />
                                <span>{therapist.experience} experience</span>
                            </div>
                            <div className="detail-item">
                                <MapPin size={18} />
                                <span>{therapist.location}</span>
                            </div>
                            <div className="detail-item">
                                <Video size={18} />
                                <span>Video Sessions</span>
                            </div>
                        </div>

                        <div className="therapist-availability">
                            <span className="availability-label">Available:</span>
                            <div className="availability-days">
                                {therapist.available.map((day, index) => (
                                    <span key={index} className="day-badge">{day}</span>
                                ))}
                            </div>
                        </div>

                        <div className="therapist-footer">
                            <span className="price">{therapist.price}</span>
                            <button onClick={() => handleBooking(therapist)} className="btn-primary">
                                <Calendar size={18} />
                                Book Session
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                title={`Book Session with ${selectedTherapist?.name}`}
            >
                <div className="booking-modal">
                    <div className="booking-section">
                        <label>
                            <Calendar size={20} />
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="booking-section">
                        <label>
                            <Clock size={20} />
                            Select Time
                        </label>
                        <div className="time-slots">
                            {availableTimes.map((time, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedTime(time)}
                                    className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="booking-summary">
                        <h4>Session Details</h4>
                        <p><strong>Therapist:</strong> {selectedTherapist?.name}</p>
                        <p><strong>Specialty:</strong> {selectedTherapist?.specialty}</p>
                        <p><strong>Price:</strong> {selectedTherapist?.price}</p>
                        <p><strong>Format:</strong> Video Session</p>
                    </div>

                    {bookingError && (
                        <div className="error-message" style={{
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <AlertCircle size={16} />
                            <span>{bookingError}</span>
                        </div>
                    )}

                    {bookingSuccess && (
                        <div className="success-message" style={{
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '8px',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <span>{bookingSuccess}</span>
                        </div>
                    )}

                    <button 
                        onClick={confirmBooking} 
                        className="btn-primary btn-full"
                        disabled={bookingLoading}
                    >
                        {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
