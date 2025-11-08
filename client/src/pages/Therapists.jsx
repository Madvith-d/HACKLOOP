import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, Video, MapPin, Award, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../components/shared/Modal';
import { therapistAPI } from '../utils/api';

export default function Therapists() {
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const availableTimes = [
        '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ];

    useEffect(() => {
        const fetchTherapists = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await therapistAPI.getAll();
                setTherapists(response.therapists || []);
            } catch (err) {
                console.error('Error fetching therapists:', err);
                setError(err.message || 'Failed to load therapists. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTherapists();
    }, []);

    const handleBooking = (therapist) => {
        setSelectedTherapist(therapist);
        setIsBookingOpen(true);
        setBookingError(null);
        setBookingSuccess(false);
        setSelectedDate('');
        setSelectedTime('');
    };

    const confirmBooking = async () => {
        if (!selectedDate || !selectedTime) {
            setBookingError('Please select both date and time');
            return;
        }

        if (!selectedTherapist) {
            setBookingError('No therapist selected');
            return;
        }

        try {
            setBookingLoading(true);
            setBookingError(null);
            setBookingSuccess(false);

            // Format time for backend (convert from "09:00 AM" to "09:00" or similar)
            const time24 = convertTo24Hour(selectedTime);
            
            const response = await therapistAPI.book(selectedTherapist.id, selectedDate, time24);
            
            setBookingSuccess(true);
            setTimeout(() => {
                setIsBookingOpen(false);
                setSelectedDate('');
                setSelectedTime('');
                setBookingSuccess(false);
                // Optionally refresh therapists list or navigate to appointments
                window.location.href = '/appointments';
            }, 2000);
        } catch (err) {
            console.error('Error booking session:', err);
            setBookingError(err.message || 'Failed to book session. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const convertTo24Hour = (time12h) => {
        // Convert "09:00 AM" to "09:00" or "02:00 PM" to "14:00"
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
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
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: '#667eea' }} />
                    <p style={{ marginTop: '1rem', color: 'var(--color-muted-foreground)' }}>Loading therapists...</p>
                </div>
            ) : therapists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted-foreground)' }}>
                    <p>No therapists available at the moment.</p>
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
                onClose={() => {
                    if (!bookingLoading) {
                        setIsBookingOpen(false);
                        setBookingError(null);
                        setBookingSuccess(false);
                        setSelectedDate('');
                        setSelectedTime('');
                    }
                }}
                title={`Book Session with ${selectedTherapist?.name}`}
            >
                <div className="booking-modal">
                    {bookingSuccess ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                        }}>
                            <CheckCircle size={48} style={{ color: '#10b981' }} />
                            <h3 style={{ color: '#10b981' }}>Booking Confirmed!</h3>
                            <p>Your session has been booked successfully. Redirecting to appointments...</p>
                        </div>
                    ) : (
                        <>
                            {bookingError && (
                                <div style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem',
                                }}>
                                    <AlertCircle size={16} />
                                    <span>{bookingError}</span>
                                </div>
                            )}

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
                                    disabled={bookingLoading}
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
                                            disabled={bookingLoading}
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
                                <p><strong>Price:</strong> {selectedTherapist?.price || '$0/session'}</p>
                                <p><strong>Format:</strong> Video Session</p>
                            </div>

                            <button 
                                onClick={confirmBooking} 
                                className="btn-primary btn-full"
                                disabled={bookingLoading || !selectedDate || !selectedTime}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: (bookingLoading || !selectedDate || !selectedTime) ? 0.6 : 1,
                                }}
                            >
                                {bookingLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Booking...</span>
                                    </>
                                ) : (
                                    'Confirm Booking'
                                )}
                            </button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
