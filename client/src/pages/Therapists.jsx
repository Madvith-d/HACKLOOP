import React, { useState } from 'react';
import { Calendar, Clock, Star, Video, MapPin, Award } from 'lucide-react';
import Modal from '../components/shared/Modal';

export default function Therapists() {
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    const therapists = [
        {
            id: 1,
            name: 'Dr. Sarah Johnson',
            specialty: 'Anxiety & Depression',
            rating: 4.9,
            reviews: 127,
            experience: '12 years',
            location: 'Remote',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            price: '$120/session',
            available: ['Mon', 'Wed', 'Fri']
        },
        {
            id: 2,
            name: 'Dr. Michael Chen',
            specialty: 'Trauma & PTSD',
            rating: 4.8,
            reviews: 98,
            experience: '15 years',
            location: 'Remote',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
            price: '$150/session',
            available: ['Tue', 'Thu', 'Sat']
        },
        {
            id: 3,
            name: 'Dr. Emily Rodriguez',
            specialty: 'Stress Management',
            rating: 4.9,
            reviews: 156,
            experience: '10 years',
            location: 'Remote',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
            price: '$110/session',
            available: ['Mon', 'Tue', 'Wed', 'Thu']
        },
        {
            id: 4,
            name: 'Dr. James Williams',
            specialty: 'Relationship Counseling',
            rating: 4.7,
            reviews: 89,
            experience: '8 years',
            location: 'Remote',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
            price: '$130/session',
            available: ['Wed', 'Thu', 'Fri']
        },
    ];

    const availableTimes = [
        '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ];

    const handleBooking = (therapist) => {
        setSelectedTherapist(therapist);
        setIsBookingOpen(true);
    };

    const confirmBooking = () => {
        if (selectedDate && selectedTime) {
            alert(`Session booked with ${selectedTherapist.name} on ${selectedDate} at ${selectedTime}`);
            setIsBookingOpen(false);
            setSelectedDate('');
            setSelectedTime('');
        } else {
            alert('Please select both date and time');
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

                    <button onClick={confirmBooking} className="btn-primary btn-full">
                        Confirm Booking
                    </button>
                </div>
            </Modal>
        </div>
    );
}
