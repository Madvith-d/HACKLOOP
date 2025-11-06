const { v4: uuidv4 } = require('uuid');

class DataStore {
    constructor() {
        this.users = new Map();
        this.therapists = new Map();
        this.sessions = new Map();
        this.emotions = new Map();
        this.bookings = new Map();
        this.journals = new Map();
        this.habits = new Map();
        this.habitCompletions = new Map();
        this.habitCompletionLog = new Map();
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

    createJournalEntry(entry) {
        const id = uuidv4();
        const journal = {
            id,
            userId: entry.userId,
            title: entry.title || '',
            content: entry.content || '',
            mood: typeof entry.mood === 'number' ? entry.mood : null,
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.journals.set(id, journal);
        return journal;
    }

    updateJournalEntry(id, userId, updates) {
        const j = this.journals.get(id);
        if (!j || j.userId !== userId) return null;
        const allowed = ['title', 'content', 'mood', 'tags'];
        allowed.forEach(k => {
            if (k in updates) j[k] = updates[k];
        });
        j.updatedAt = new Date().toISOString();
        return j;
    }

    deleteJournalEntry(id, userId) {
        const j = this.journals.get(id);
        if (!j || j.userId !== userId) return false;
        return this.journals.delete(id);
    }

    getJournalEntry(id, userId) {
        const j = this.journals.get(id);
        if (!j || j.userId !== userId) return null;
        return j;
    }

    listJournalEntries(userId, { from, to } = {}) {
        let list = Array.from(this.journals.values()).filter(j => j.userId === userId);
        if (from) list = list.filter(j => new Date(j.createdAt) >= new Date(from));
        if (to) list = list.filter(j => new Date(j.createdAt) <= new Date(to));
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    createHabit(habit) {
        const id = uuidv4();
        const h = {
            id,
            userId: habit.userId,
            name: habit.name,
            frequency: habit.frequency || 'daily',
            goalPerWeek: habit.goalPerWeek || (habit.frequency === 'weekly' ? 3 : 7),
            targetPerDay: Math.max(1, Number(habit.targetPerDay || 1)),
            daysOfWeek: Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : null,
            color: habit.color || null,
            createdAt: new Date().toISOString(),
            archived: false
        };
        this.habits.set(id, h);
        this.habitCompletions.set(id, new Set());
        this.habitCompletionLog.set(id, new Map());
        return h;
    }

    updateHabit(id, userId, updates) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return null;
        const allowed = ['name', 'frequency', 'goalPerWeek', 'targetPerDay', 'daysOfWeek', 'color', 'archived'];
        allowed.forEach(k => {
            if (k in updates) h[k] = k === 'targetPerDay' ? Math.max(1, Number(updates[k])) : updates[k];
        });
        return h;
    }

    deleteHabit(id, userId) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return false;
        this.habits.delete(id);
        this.habitCompletions.delete(id);
        return true;
    }

    listHabits(userId, { includeArchived = false } = {}) {
        return Array.from(this.habits.values()).filter(h => h.userId === userId && (includeArchived || !h.archived));
    }

    toggleHabitCompletion(id, userId, dateStr) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return null;
        const key = (dateStr ? new Date(dateStr) : new Date()).toISOString().slice(0, 10);
        const set = this.habitCompletions.get(id) || new Set();
        const log = this.habitCompletionLog.get(id) || new Map();
        if (set.has(key)) {
            let latestId = null;
            let latestTs = 0;
            for (const [cid, c] of log.entries()) {
                const t = new Date(c.timestampISO).getTime();
                if (c.dateKey === key && t >= latestTs) { latestTs = t; latestId = cid; }
            }
            if (latestId) log.delete(latestId);
            let stillHas = false;
            for (const c of log.values()) { if (c.dateKey === key) { stillHas = true; break; } }
            if (!stillHas) set.delete(key);
            this.habitCompletionLog.set(id, log);
            this.habitCompletions.set(id, set);
            return { completed: false, date: key };
        } else {
            set.add(key);
            const completionId = uuidv4();
            const ts = new Date().toISOString();
            log.set(completionId, { id: completionId, timestampISO: ts, dateKey: key });
            this.habitCompletionLog.set(id, log);
            this.habitCompletions.set(id, set);
            return { completed: true, date: key, completionId };
        }
    }

    addHabitCompletion(id, userId, timestamp) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return null;
        const ts = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
        const dateKey = ts.slice(0, 10);
        const log = this.habitCompletionLog.get(id) || new Map();
        const completionId = uuidv4();
        log.set(completionId, { id: completionId, timestampISO: ts, dateKey });
        this.habitCompletionLog.set(id, log);
        const set = this.habitCompletions.get(id) || new Set();
        set.add(dateKey);
        this.habitCompletions.set(id, set);
        return { id: completionId, timestampISO: ts, dateKey };
    }

    removeHabitCompletion(id, userId, completionId) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return false;
        const log = this.habitCompletionLog.get(id) || new Map();
        const entry = log.get(completionId);
        if (!entry) return false;
        log.delete(completionId);
        let stillHas = false;
        for (const c of log.values()) { if (c.dateKey === entry.dateKey) { stillHas = true; break; } }
        if (!stillHas) {
            const set = this.habitCompletions.get(id) || new Set();
            set.delete(entry.dateKey);
            this.habitCompletions.set(id, set);
        }
        this.habitCompletionLog.set(id, log);
        return true;
    }

    getHabitCompletions(id, userId, { from, to } = {}) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return null;
        const log = this.habitCompletionLog.get(id) || new Map();
        let list = Array.from(log.values());
        if (from) list = list.filter(c => c.timestampISO >= new Date(from).toISOString());
        if (to) list = list.filter(c => c.timestampISO <= new Date(to).toISOString());
        return list.sort((a, b) => new Date(b.timestampISO) - new Date(a.timestampISO));
    }

    getHabitStats(id, userId, days = 30) {
        const h = this.habits.get(id);
        if (!h || h.userId !== userId) return null;
        const set = this.habitCompletions.get(id) || new Set();
        const log = this.habitCompletionLog.get(id) || new Map();
        const today = new Date();
        const dates = [];
        let currentStreak = 0;
        let bestStreak = 0;
        let running = 0;
        const weekdayDist = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 };
        for (const c of log.values()) {
            const wd = new Date(c.timestampISO).getDay();
            weekdayDist[wd] = (weekdayDist[wd] || 0) + 1;
        }
        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const done = set.has(key);
            dates.push({ date: key, done });
            if (done) {
                running += 1;
                bestStreak = Math.max(bestStreak, running);
            } else {
                if (i === 0) currentStreak = 0;
                running = 0;
            }
            if (i === 0 && done) currentStreak = 1;
            else if (i > 0 && currentStreak > 0 && done) currentStreak += 1;
        }
        const total = dates.filter(x => x.done).length;
        const last7 = dates.slice(0, 7).filter(x => x.done).length;
        const last30 = dates.filter((_, idx) => idx < 30).filter(x => x.done).length;
        return {
            currentStreak,
            bestStreak,
            lastNDays: dates.reverse(),
            totalCompletions: total,
            rate7: Number(((last7 / Math.min(7, days)) * 100).toFixed(1)),
            rate30: Number(((last30 / Math.min(30, days)) * 100).toFixed(1)),
            weekdayDist
        };
    }

    getHabitSummary(userId) {
        const habits = this.listHabits(userId, {});
        return habits.map(h => ({
            habit: h,
            stats: this.getHabitStats(h.id, userId, 90)
        }));
    }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
