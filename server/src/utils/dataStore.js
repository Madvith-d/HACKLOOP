const { v4: uuidv4 } = require('uuid');

class DataStore {
    constructor() {
        this.users = new Map();
        this.therapists = new Map();
        this.sessions = new Map();
        this.emotions = new Map();
        this.bookings = new Map();
        this.initTherapists();
    }

    initTherapists() {
        const therapists = [
            {
                id: '1',
                name: 'Dr. Sarah Johnson',
                specialty: 'Anxiety & Depression',
                rating: 4.9,
                reviews: 127,
                experience: '12 years',
                location: 'Remote',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                price: 120,
                available: ['Mon', 'Wed', 'Fri'],
                bio: 'Specialized in cognitive behavioral therapy with over 12 years of experience.'
            },
            {
                id: '2',
                name: 'Dr. Michael Chen',
                specialty: 'Trauma & PTSD',
                rating: 4.8,
                reviews: 98,
                experience: '15 years',
                location: 'Remote',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
                price: 150,
                available: ['Tue', 'Thu', 'Sat'],
                bio: 'Expert in trauma-focused therapy and PTSD treatment.'
            },
            {
                id: '3',
                name: 'Dr. Emily Rodriguez',
                specialty: 'Stress Management',
                rating: 4.9,
                reviews: 156,
                experience: '10 years',
                location: 'Remote',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
                price: 110,
                available: ['Mon', 'Tue', 'Wed', 'Thu'],
                bio: 'Specializes in stress reduction and mindfulness techniques.'
            },
            {
                id: '4',
                name: 'Dr. James Williams',
                specialty: 'Relationship Counseling',
                rating: 4.7,
                reviews: 89,
                experience: '8 years',
                location: 'Remote',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
                price: 130,
                available: ['Wed', 'Thu', 'Fri'],
                bio: 'Focused on couples therapy and relationship dynamics.'
            }
        ];

        therapists.forEach(therapist => {
            this.therapists.set(therapist.id, therapist);
        });
    }
    createUser(userData) {
        const id = uuidv4();
        const user = {
            id,
            ...userData,
            createdAt: new Date().toISOString()
        };
        this.users.set(id, user);
        return user;
    }

    getUserByEmail(email) {
        return Array.from(this.users.values()).find(user => user.email === email);
    }

    getUserById(id) {
        return this.users.get(id);
    }

    // Therapist methods
    getAllTherapists() {
        return Array.from(this.therapists.values());
    }

    getTherapistById(id) {
        return this.therapists.get(id);
    }

    // Session methods
    createSession(sessionData) {
        const id = uuidv4();
        const session = {
            id,
            ...sessionData,
            createdAt: new Date().toISOString(),
            emotionData: []
        };
        this.sessions.set(id, session);
        return session;
    }

    getSessionById(id) {
        return this.sessions.get(id);
    }

    getUserSessions(userId) {
        return Array.from(this.sessions.values()).filter(
            session => session.userId === userId || session.patientId === userId
        );
    }

    updateSession(id, updates) {
        const session = this.sessions.get(id);
        if (session) {
            Object.assign(session, updates);
            return session;
        }
        return null;
    }

    addEmotionDataToSession(sessionId, emotionData) {
        const session = this.sessions.get(sessionId);
        if (session) {
            if (!session.emotionData) {
                session.emotionData = [];
            }
            session.emotionData.push(...emotionData);
            return session;
        }
        return null;
    }

    // Emotion methods
    createEmotion(emotionData) {
        const id = uuidv4();
        const emotion = {
            id,
            ...emotionData,
            timestamp: new Date().toISOString()
        };
        this.emotions.set(id, emotion);
        return emotion;
    }

    getUserEmotions(userId) {
        return Array.from(this.emotions.values())
            .filter(emotion => emotion.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Booking methods
    createBooking(bookingData) {
        const id = uuidv4();
        const booking = {
            id,
            ...bookingData,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        this.bookings.set(id, booking);
        return booking;
    }

    getUserBookings(userId) {
        return Array.from(this.bookings.values())
            .filter(booking => booking.userId === userId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getTherapistBookings(therapistId) {
        return Array.from(this.bookings.values())
            .filter(booking => booking.therapistId === therapistId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
