/**
 * Centralized API utility functions with error handling and authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Base API request wrapper with authentication headers
 */
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return { ok: response.ok, status: response.status };
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

/**
 * Chat API functions
 */
export const chatAPI = {
    /**
     * Send a chat message and get AI response
     */
    async sendMessage(message) {
        return apiRequest('/api/chat/message', {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    },
    
    /**
     * Stream chat message (returns ReadableStream)
     */
    async streamMessage(message, onChunk) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Stream failed' }));
            throw new Error(error.error || 'Stream failed');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (onChunk) onChunk(data);
                } catch (e) {
                    console.error('Failed to parse chunk:', e);
                }
            }
        }
    },
    
    /**
     * Get chat history
     */
    async getHistory(limit = 20, offset = 0) {
        return apiRequest(`/api/chat/history?limit=${limit}&offset=${offset}`);
    },
    
    /**
     * Get detailed analysis of a chat message
     */
    async getAnalysis(chatId) {
        return apiRequest(`/api/chat/analysis/${chatId}`);
    },
    
    /**
     * Get agent information
     */
    async getAgentInfo() {
        return apiRequest('/api/chat/agent-info');
    },
};

/**
 * Therapist API functions
 */
export const therapistAPI = {
    /**
     * Get all therapists
     */
    async getAll() {
        return apiRequest('/api/therapists');
    },
    
    /**
     * Get therapist by ID
     */
    async getById(therapistId) {
        return apiRequest(`/api/therapists/${therapistId}`);
    },
    
    /**
     * Book a session with a therapist
     */
    async book(therapistId, date, time) {
        return apiRequest(`/api/therapists/${therapistId}/book`, {
            method: 'POST',
            body: JSON.stringify({ date, time }),
        });
    },
    
    /**
     * Get therapist bookings (for therapist role)
     */
    async getBookings(therapistId) {
        return apiRequest(`/api/therapists/${therapistId}/bookings`);
    },
};

/**
 * User API functions
 */
export const userAPI = {
    /**
     * Get current user profile
     */
    async getProfile() {
        return apiRequest('/api/users/me');
    },
    
    /**
     * Update user profile
     */
    async updateProfile(updates) {
        return apiRequest('/api/users/me', {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },
    
    /**
     * Get user bookings
     */
    async getBookings() {
        return apiRequest('/api/users/me/bookings');
    },
};

/**
 * Session API functions
 */
export const sessionAPI = {
    /**
     * Get user sessions
     */
    async getMySessions() {
        return apiRequest('/api/sessions/my-sessions');
    },
    
    /**
     * Get session by ID
     */
    async getById(sessionId) {
        return apiRequest(`/api/sessions/${sessionId}`);
    },
    
    /**
     * Update session
     */
    async update(sessionId, updates) {
        return apiRequest(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },
    
    /**
     * Complete session
     */
    async complete(sessionId, data) {
        return apiRequest(`/api/sessions/${sessionId}/complete`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    /**
     * Create session
     */
    async create(data) {
        return apiRequest('/api/sessions/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

/**
 * Emotion API functions
 */
export const emotionAPI = {
    /**
     * Get user emotions
     */
    async getMyEmotions() {
        return apiRequest('/api/emotions/my-emotions');
    },
    
    /**
     * Record a new emotion
     */
    async record(emotionData) {
        return apiRequest('/api/emotions', {
            method: 'POST',
            body: JSON.stringify(emotionData),
        });
    },
    
    /**
     * Record multiple emotions (bulk)
     */
    async recordBulk(emotions) {
        return apiRequest('/api/emotions/bulk', {
            method: 'POST',
            body: JSON.stringify({ emotions }),
        });
    },
    
    /**
     * Get emotion analytics
     */
    async getAnalytics() {
        return apiRequest('/api/emotions/analytics');
    },
};

/**
 * Journal API functions
 */
export const journalAPI = {
    /**
     * Get journal entries
     */
    async getAll() {
        return apiRequest('/api/journal');
    },
    
    /**
     * Create journal entry
     */
    async create(entry) {
        return apiRequest('/api/journal', {
            method: 'POST',
            body: JSON.stringify(entry),
        });
    },
    
    /**
     * Get journal entry by ID
     */
    async getById(id) {
        return apiRequest(`/api/journal/${id}`);
    },
    
    /**
     * Update journal entry
     */
    async update(id, updates) {
        return apiRequest(`/api/journal/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },
    
    /**
     * Delete journal entry
     */
    async delete(id) {
        return apiRequest(`/api/journal/${id}`, {
            method: 'DELETE',
        });
    },
};

/**
 * Habit API functions
 */
export const habitAPI = {
    /**
     * Get habits
     */
    async getAll() {
        return apiRequest('/api/habits');
    },
    
    /**
     * Create habit
     */
    async create(habit) {
        return apiRequest('/api/habits', {
            method: 'POST',
            body: JSON.stringify(habit),
        });
    },
    
    /**
     * Update habit
     */
    async update(id, updates) {
        return apiRequest(`/api/habits/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },
    
    /**
     * Delete habit
     */
    async delete(id) {
        return apiRequest(`/api/habits/${id}`, {
            method: 'DELETE',
        });
    },
    
    /**
     * Toggle habit completion
     */
    async toggle(id) {
        return apiRequest(`/api/habits/${id}/toggle`, {
            method: 'POST',
        });
    },
    
    /**
     * Get habit statistics
     */
    async getStats(id) {
        return apiRequest(`/api/habits/${id}/stats`);
    },
};

export default {
    chatAPI,
    therapistAPI,
    userAPI,
    sessionAPI,
    emotionAPI,
    journalAPI,
    habitAPI,
};

