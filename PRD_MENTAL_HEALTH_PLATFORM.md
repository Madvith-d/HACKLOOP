# Product Requirements Document: Mental Health & Therapy Platform

## Document Information
- **Version**: 2.0 (Free & Open-Source Stack)
- **Last Updated**: November 14, 2025
- **Document Owner**: Product Team
- **Status**: Complete Specification
- **Cost**: $0/month for up to 500 users using 100% free tools! 🎉

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [User Personas](#user-personas)
4. [Features & Requirements](#features--requirements)
5. [Technical Architecture](#technical-architecture)
6. [State Management](#state-management)
7. [API Specifications](#api-specifications)
8. [Database Schema](#database-schema)
9. [AI/ML Requirements](#aiml-requirements)
10. [Security & Privacy](#security--privacy)
11. [Performance Requirements](#performance-requirements)
12. [Testing Requirements](#testing-requirements)
13. [Deployment Strategy](#deployment-strategy)
14. [Success Metrics](#success-metrics)
15. [Future Enhancements](#future-enhancements)
16. [Glossary](#glossary)
17. [Appendices](#appendices)
18. [Free & Open Source Tools Cost Breakdown](#free--open-source-tools-cost-breakdown) ⭐ NEW
19. [Quick Start Guide for Free Stack](#quick-start-guide-for-free-stack) ⭐ NEW

---

## 1. Executive Summary

### 1.1 Product Vision
A comprehensive mental health platform that connects users with licensed therapists, provides AI-powered support, and offers tools for emotional wellness tracking, habit building, and crisis intervention.

### 1.2 Problem Statement
Mental health support is often inaccessible, expensive, and lacks continuous care between therapy sessions. Users need a platform that provides:
- 24/7 AI-powered emotional support
- Access to licensed therapists
- Tools for self-improvement and tracking
- Crisis intervention resources
- Seamless communication channels

### 1.3 Solution Overview
A full-stack web application featuring:
- Real-time AI chat with context-aware responses
- Video calling for therapy sessions
- Emotion and habit tracking
- Journal with AI insights
- Therapist marketplace
- Admin dashboard for therapist verification
- Crisis support resources

**🎉 Built with 100% Free & Open-Source Tools:**
- **Cost**: $0/month for up to 500 users
- **AI**: Google Gemini API (free tier: 1500 requests/day)
- **Embeddings**: Local sentence-transformers model (no API costs)
- **Database**: PostgreSQL + pgvector (free, self-hosted or free tier)
- **Hosting**: Vercel/Netlify (frontend) + Render/Railway (backend) free tiers
- **Scalable**: Grows with your needs, pay only when necessary

### 1.4 Target Users
- **Primary**: Adults (18-65) seeking mental health support
- **Secondary**: Licensed therapists offering services
- **Tertiary**: Platform administrators

---

## 2. Project Overview

### 2.1 Goals
1. Provide accessible mental health support 24/7
2. Connect users with licensed therapists
3. Enable self-tracking and improvement tools
4. Ensure data privacy and security (HIPAA-compliant considerations)
5. Scale to support 10,000+ concurrent users

### 2.2 Non-Goals
- Medical diagnosis or prescription services
- Emergency medical response (redirects to crisis hotlines)
- Insurance claim processing
- Mobile native apps (web-first approach)

### 2.3 Success Criteria
- 85% user satisfaction rate
- <2s average page load time
- 99.9% uptime
- 50+ verified therapists within 6 months
- 1000+ active users within first year

---

## 3. User Personas

### 3.1 Patient (Primary User)
**Name**: Sarah, 28, Marketing Professional
**Goals**:
- Access therapy without long wait times
- Track emotional patterns
- Get support during anxious moments
- Build healthy habits

**Pain Points**:
- Traditional therapy is expensive
- Hard to find available therapists
- Needs support between sessions
- Forgets to practice coping strategies

**User Stories**:
- "I want to chat with an AI when I'm feeling anxious at 2 AM"
- "I want to track my mood patterns over time"
- "I want to find a therapist who specializes in anxiety"
- "I want to schedule video sessions at my convenience"

### 3.2 Therapist (Service Provider)
**Name**: Dr. Michael Chen, 45, Licensed Therapist
**Goals**:
- Reach more clients remotely
- Manage appointments efficiently
- Track patient progress
- Maintain professional credentials

**Pain Points**:
- Limited by physical location
- Administrative overhead
- Difficulty tracking patient data between sessions
- Finding new clients

**User Stories**:
- "I want to verify my credentials to practice on the platform"
- "I want to see my patient's emotion tracking data before sessions"
- "I want to manage my availability and appointments"
- "I want to conduct secure video sessions"

### 3.3 Administrator
**Name**: Admin Team
**Goals**:
- Verify therapist credentials
- Monitor platform health
- Ensure user safety
- Manage content moderation

**Pain Points**:
- Manual verification processes
- Monitoring user safety
- Handling disputes

**User Stories**:
- "I want to review therapist applications"
- "I want to approve or reject applications with comments"
- "I want to see platform analytics"
- "I want to monitor flagged content"

---

## 4. Features & Requirements

### 4.1 Authentication & Authorization

#### 4.1.1 User Registration
**Priority**: P0 (Critical)

**Functional Requirements**:
- Users can register with email and password
- Password must meet security requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character
- Email verification required
- Account types: Patient, Therapist, Admin
- Terms of service acceptance required

**State Requirements**:
```javascript
authState: {
  isAuthenticated: boolean,
  user: {
    id: string,
    email: string,
    name: string,
    role: 'patient' | 'therapist' | 'admin',
    avatar: string | null,
    createdAt: timestamp,
    emailVerified: boolean
  } | null,
  loading: boolean,
  error: string | null,
  token: string | null,
  refreshToken: string | null
}
```

**API Endpoints**:
- `POST /api/auth/register`
  - Body: `{ email, password, name, role }`
  - Response: `{ user, token, refreshToken }`
- `POST /api/auth/verify-email`
  - Body: `{ token }`
  - Response: `{ success: boolean }`

#### 4.1.2 User Login
**Priority**: P0 (Critical)

**Functional Requirements**:
- Email and password authentication
- JWT token-based sessions
- Refresh token for extended sessions
- "Remember me" option
- Failed login attempt tracking (max 5 attempts)
- Account lockout after failed attempts
- Password reset functionality

**State Requirements**:
```javascript
loginState: {
  isLoggingIn: boolean,
  error: string | null,
  failedAttempts: number,
  isLocked: boolean,
  lockoutUntil: timestamp | null
}
```

**API Endpoints**:
- `POST /api/auth/login`
  - Body: `{ email, password, rememberMe }`
  - Response: `{ user, token, refreshToken }`
- `POST /api/auth/refresh`
  - Body: `{ refreshToken }`
  - Response: `{ token, refreshToken }`
- `POST /api/auth/logout`
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ success: boolean }`
- `POST /api/auth/forgot-password`
  - Body: `{ email }`
  - Response: `{ success: boolean }`
- `POST /api/auth/reset-password`
  - Body: `{ token, newPassword }`
  - Response: `{ success: boolean }`

#### 4.1.3 Protected Routes
**Priority**: P0 (Critical)

**Functional Requirements**:
- Route protection based on authentication
- Role-based access control (RBAC)
- Automatic redirect to login if unauthorized
- Token validation on protected API calls
- Automatic token refresh

**Implementation Details**:
- Client-side route guards using React Router
- Protected route wrapper component
- Automatic token refresh 5 minutes before expiry
- Redirect to intended destination after login

---

### 4.2 AI Chat System

#### 4.2.1 Real-time Chat Interface
**Priority**: P0 (Critical)

**Functional Requirements**:
- Real-time messaging interface
- Message history persistence
- Context-aware AI responses
- Support for text messages
- Typing indicators
- Message timestamps
- Message status (sending, sent, error)
- Markdown support in messages
- Emoji support
- Crisis detection and intervention

**State Requirements**:
```javascript
chatState: {
  messages: [
    {
      id: string,
      content: string,
      sender: 'user' | 'ai',
      timestamp: timestamp,
      status: 'sending' | 'sent' | 'error',
      metadata: {
        sentiment: 'positive' | 'negative' | 'neutral' | null,
        crisisDetected: boolean,
        emotionScore: number
      }
    }
  ],
  isTyping: boolean,
  isLoading: boolean,
  error: string | null,
  sessionId: string,
  context: {
    recentEmotions: array,
    recentJournals: array,
    activeHabits: array,
    therapistNotes: string | null
  }
}
```

**API Endpoints**:
- `POST /api/chat/message`
  - Body: `{ message: string, sessionId: string }`
  - Response: `{ reply: string, metadata: object }`
- `GET /api/chat/history`
  - Query: `?limit=50&offset=0&sessionId={id}`
  - Response: `{ messages: array, hasMore: boolean }`
- `POST /api/chat/session`
  - Body: `{}`
  - Response: `{ sessionId: string }`
- `DELETE /api/chat/session/:sessionId`
  - Response: `{ success: boolean }`

#### 4.2.2 AI Agent Architecture
**Priority**: P0 (Critical)

**Functional Requirements**:
- LangGraph-based state machine
- Context retrieval from vector store
- Emotion detection
- Crisis detection and escalation
- Personalized recommendations
- Multi-turn conversation handling
- Memory of previous conversations

**AI Agent Nodes**:
1. **Input Processing Node**
   - Sanitize and validate input
   - Detect crisis keywords
   - Extract intent

2. **Context Retrieval Node**
   - Query vector store for relevant past conversations
   - Retrieve user's recent emotions, journals, habits
   - Load therapist notes if available

3. **Emotion Analysis Node**
   - Analyze sentiment using Gemini AI
   - Classify emotion (joy, sadness, anger, anxiety, etc.)
   - Calculate emotion intensity (0-10 scale)

4. **Crisis Detection Node**
   - Detect self-harm indicators
   - Detect suicidal ideation
   - Immediate escalation if detected

5. **Response Generation Node**
   - Generate empathetic, context-aware response
   - Include coping strategies if needed
   - Suggest relevant resources

6. **Recommendation Node**
   - Suggest therapists if appropriate
   - Recommend relevant journal prompts
   - Suggest habit check-ins

**Vector Store Requirements**:
- Embedding model: sentence-transformers/all-MiniLM-L6-v2 (local, free)
- Dimension: 384 (smaller, faster)
- Store all chat messages as embeddings
- Store journal entries as embeddings
- Similarity search with top-k=5
- Metadata filtering by user, date, emotion
- Uses PostgreSQL pgvector extension (free)

**Crisis Intervention Flow**:
```
User Input → Crisis Detection
  ↓ (if crisis detected)
  → Immediate supportive response
  → Display crisis hotlines
  → Suggest contacting therapist
  → Offer to schedule urgent session
  → Log incident for review
```

---

### 4.3 Emotion Tracking

#### 4.3.1 Emotion Logging
**Priority**: P0 (Critical)

**Functional Requirements**:
- Log emotions multiple times per day
- Emotion categories: Happy, Sad, Anxious, Angry, Calm, Excited, Tired, Stressed
- Intensity scale: 1-10
- Optional notes with each entry
- Optional triggers/context tags
- Timestamp auto-recorded
- Reminder notifications (optional)

**State Requirements**:
```javascript
emotionState: {
  entries: [
    {
      id: string,
      emotion: 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'excited' | 'tired' | 'stressed',
      intensity: number (1-10),
      notes: string | null,
      triggers: array[string],
      timestamp: timestamp,
      createdAt: timestamp
    }
  ],
  todayEntries: array,
  isLoading: boolean,
  error: string | null,
  filters: {
    dateRange: { start: date, end: date },
    emotions: array[string]
  }
}
```

**API Endpoints**:
- `POST /api/emotions`
  - Body: `{ emotion, intensity, notes, triggers, timestamp }`
  - Response: `{ entry: object }`
- `GET /api/emotions`
  - Query: `?startDate={date}&endDate={date}&emotions={csv}`
  - Response: `{ entries: array }`
- `GET /api/emotions/:id`
  - Response: `{ entry: object }`
- `PUT /api/emotions/:id`
  - Body: `{ emotion, intensity, notes, triggers }`
  - Response: `{ entry: object }`
- `DELETE /api/emotions/:id`
  - Response: `{ success: boolean }`

#### 4.3.2 Emotion Analytics
**Priority**: P1 (High)

**Functional Requirements**:
- Daily, weekly, monthly emotion trends
- Most frequent emotions
- Average intensity by emotion
- Trigger pattern analysis
- Emotion distribution charts
- Time-of-day patterns
- Correlation with habits/journal entries
- Exportable reports (PDF/CSV)

**State Requirements**:
```javascript
emotionAnalyticsState: {
  trends: {
    daily: array,
    weekly: array,
    monthly: array
  },
  statistics: {
    mostFrequent: string,
    averageIntensity: number,
    totalEntries: number,
    improvementScore: number (-100 to +100)
  },
  patterns: {
    timeOfDay: object,
    triggerFrequency: object,
    emotionCorrelations: object
  },
  isLoading: boolean,
  error: string | null
}
```

**API Endpoints**:
- `GET /api/emotions/analytics`
  - Query: `?period={daily|weekly|monthly}&startDate={date}&endDate={date}`
  - Response: `{ trends, statistics, patterns }`
- `GET /api/emotions/export`
  - Query: `?format={pdf|csv}&startDate={date}&endDate={date}`
  - Response: File download

---

### 4.4 Habit Tracking

#### 4.4.1 Habit Creation & Management
**Priority**: P1 (High)

**Functional Requirements**:
- Create custom habits
- Predefined habit templates (meditation, exercise, journaling, etc.)
- Habit categories: Mental Health, Physical Health, Productivity, Social
- Frequency settings:
  - Daily
  - Weekly (specific days)
  - Custom interval
- Reminder settings
- Habit goals and milestones
- Habit streaks tracking
- Habit notes/reflection

**State Requirements**:
```javascript
habitState: {
  habits: [
    {
      id: string,
      name: string,
      description: string,
      category: 'mental' | 'physical' | 'productivity' | 'social',
      frequency: {
        type: 'daily' | 'weekly' | 'custom',
        days: array[number] | null, // 0-6 for weekly
        interval: number | null // for custom
      },
      goal: {
        type: 'streak' | 'count' | 'duration',
        target: number,
        unit: 'days' | 'times' | 'minutes'
      },
      currentStreak: number,
      longestStreak: number,
      totalCompletions: number,
      reminders: {
        enabled: boolean,
        times: array[string] // HH:MM format
      },
      isActive: boolean,
      createdAt: timestamp,
      lastCompletedAt: timestamp | null
    }
  ],
  completions: [
    {
      id: string,
      habitId: string,
      completedAt: timestamp,
      notes: string | null,
      mood: 'great' | 'good' | 'okay' | 'bad' | null
    }
  ],
  todayProgress: {
    completed: number,
    total: number,
    habits: array
  },
  isLoading: boolean,
  error: string | null
}
```

**API Endpoints**:
- `POST /api/habits`
  - Body: `{ name, description, category, frequency, goal, reminders }`
  - Response: `{ habit: object }`
- `GET /api/habits`
  - Query: `?active={boolean}&category={string}`
  - Response: `{ habits: array }`
- `GET /api/habits/:id`
  - Response: `{ habit: object, completions: array, analytics: object }`
- `PUT /api/habits/:id`
  - Body: `{ name, description, category, frequency, goal, reminders, isActive }`
  - Response: `{ habit: object }`
- `DELETE /api/habits/:id`
  - Response: `{ success: boolean }`
- `POST /api/habits/:id/complete`
  - Body: `{ notes, mood, completedAt }`
  - Response: `{ completion: object, newStreak: number }`
- `GET /api/habits/:id/analytics`
  - Query: `?period={30|60|90}`
  - Response: `{ completionRate, streakHistory, patterns }`

#### 4.4.2 Habit Analytics
**Priority**: P2 (Medium)

**Functional Requirements**:
- Completion rate by habit
- Streak visualization
- Best performing habits
- Time-of-day completion patterns
- Habit correlation with emotions
- Weekly/monthly reports

---

### 4.5 Journal System

#### 4.5.1 Journal Entry Creation
**Priority**: P1 (High)

**Functional Requirements**:
- Rich text editor for journal entries
- Entry templates (gratitude, reflection, CBT, etc.)
- Mood selection for entry
- Tags/categories
- Private/shared entries (shared with therapist only)
- Auto-save drafts
- Entry timestamps
- Media attachments (future enhancement)

**State Requirements**:
```javascript
journalState: {
  entries: [
    {
      id: string,
      title: string,
      content: string,
      mood: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad',
      tags: array[string],
      isSharedWithTherapist: boolean,
      isDraft: boolean,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  currentEntry: {
    title: string,
    content: string,
    mood: string | null,
    tags: array[string],
    isSharedWithTherapist: boolean
  } | null,
  templates: [
    {
      id: string,
      name: string,
      description: string,
      prompts: array[string]
    }
  ],
  isLoading: boolean,
  isSaving: boolean,
  error: string | null,
  filters: {
    dateRange: object | null,
    tags: array[string],
    mood: string | null
  }
}
```

**API Endpoints**:
- `POST /api/journal`
  - Body: `{ title, content, mood, tags, isSharedWithTherapist, isDraft }`
  - Response: `{ entry: object }`
- `GET /api/journal`
  - Query: `?startDate={date}&endDate={date}&tags={csv}&mood={string}&includeShared={boolean}`
  - Response: `{ entries: array, total: number }`
- `GET /api/journal/:id`
  - Response: `{ entry: object }`
- `PUT /api/journal/:id`
  - Body: `{ title, content, mood, tags, isSharedWithTherapist, isDraft }`
  - Response: `{ entry: object }`
- `DELETE /api/journal/:id`
  - Response: `{ success: boolean }`
- `GET /api/journal/templates`
  - Response: `{ templates: array }`

#### 4.5.2 AI Journal Insights
**Priority**: P2 (Medium)

**Functional Requirements**:
- Automatic theme extraction
- Sentiment analysis over time
- Pattern recognition (recurring topics)
- Suggested reflection prompts
- Progress indicators
- Weekly summary emails (optional)

**API Endpoints**:
- `GET /api/journal/:id/insights`
  - Response: `{ themes, sentiment, suggestions }`
- `GET /api/journal/summary`
  - Query: `?period={week|month}`
  - Response: `{ summary: string, themes: array, sentiment: object }`

---

### 4.6 Therapist Marketplace

#### 4.6.1 Therapist Directory
**Priority**: P0 (Critical)

**Functional Requirements**:
- Browse verified therapists
- Filter by:
  - Specialization (anxiety, depression, trauma, couples, etc.)
  - Language
  - Availability
  - Price range
  - Rating
- Search by name or keyword
- Therapist profile pages:
  - Photo
  - Bio
  - Credentials
  - Specializations
  - Experience
  - Approach/methods
  - Availability calendar
  - Pricing
  - Reviews/ratings
  - Video introduction (future)
- Save favorite therapists
- Book appointments

**State Requirements**:
```javascript
therapistState: {
  therapists: [
    {
      id: string,
      userId: string,
      name: string,
      email: string,
      avatar: string | null,
      bio: string,
      credentials: [
        {
          type: string, // 'license', 'certification', 'degree'
          name: string,
          issuedBy: string,
          issuedDate: date,
          expiryDate: date | null,
          verificationStatus: 'pending' | 'verified' | 'rejected'
        }
      ],
      specializations: array[string],
      languages: array[string],
      yearsOfExperience: number,
      approach: string,
      pricing: {
        sessionDuration: number, // minutes
        pricePerSession: number, // USD
        acceptsInsurance: boolean,
        insuranceProviders: array[string]
      },
      availability: [
        {
          dayOfWeek: number, // 0-6
          slots: [
            { start: string, end: string } // HH:MM format
          ]
        }
      ],
      rating: number, // 0-5
      reviewCount: number,
      isVerified: boolean,
      isAcceptingClients: boolean,
      createdAt: timestamp
    }
  ],
  selectedTherapist: object | null,
  favorites: array[string], // therapist IDs
  filters: {
    specializations: array[string],
    languages: array[string],
    priceRange: { min: number, max: number },
    minRating: number,
    availability: { day: number, time: string }
  },
  isLoading: boolean,
  error: string | null
}
```

**API Endpoints**:
- `GET /api/therapists`
  - Query: `?specialization={string}&language={string}&minPrice={number}&maxPrice={number}&minRating={number}&availability={json}`
  - Response: `{ therapists: array, total: number }`
- `GET /api/therapists/:id`
  - Response: `{ therapist: object, reviews: array, availability: array }`
- `POST /api/therapists/:id/favorite`
  - Response: `{ success: boolean }`
- `DELETE /api/therapists/:id/favorite`
  - Response: `{ success: boolean }`
- `GET /api/therapists/favorites`
  - Response: `{ therapists: array }`

#### 4.6.2 Therapist Application Process
**Priority**: P0 (Critical)

**Functional Requirements**:
- Multi-step application form:
  1. Personal information
  2. Professional credentials upload
  3. Specializations and approach
  4. Availability and pricing
  5. Background check consent
  6. Terms agreement
- Document upload (license, certifications)
- Application status tracking
- Admin review system
- Approval/rejection with feedback
- Email notifications

**State Requirements**:
```javascript
therapistApplicationState: {
  application: {
    id: string | null,
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected',
    personalInfo: {
      firstName: string,
      lastName: string,
      email: string,
      phone: string,
      address: object
    },
    credentials: [
      {
        id: string,
        type: string,
        name: string,
        issuedBy: string,
        licenseNumber: string,
        issuedDate: date,
        expiryDate: date | null,
        documentUrl: string
      }
    ],
    specializations: array[string],
    languages: array[string],
    bio: string,
    approach: string,
    yearsOfExperience: number,
    pricing: object,
    availability: array,
    backgroundCheckConsent: boolean,
    termsAccepted: boolean,
    submittedAt: timestamp | null,
    reviewedAt: timestamp | null,
    reviewNotes: string | null
  },
  currentStep: number,
  isSubmitting: boolean,
  error: string | null
}
```

**API Endpoints**:
- `POST /api/therapist-applications`
  - Body: `{ application data }`
  - Response: `{ application: object }`
- `GET /api/therapist-applications/me`
  - Response: `{ application: object }`
- `PUT /api/therapist-applications/:id`
  - Body: `{ application data }`
  - Response: `{ application: object }`
- `POST /api/therapist-applications/:id/submit`
  - Response: `{ success: boolean }`
- `POST /api/therapist-applications/:id/documents`
  - Body: FormData with file
  - Response: `{ documentUrl: string }`

---

### 4.7 Appointment System

#### 4.7.1 Booking & Scheduling
**Priority**: P0 (Critical)

**Functional Requirements**:
- View therapist availability
- Book appointments
- Reschedule appointments (24hr notice)
- Cancel appointments (with refund policy)
- Recurring appointments
- Appointment reminders (email, push)
- Calendar integration (iCal export)
- Waitlist for fully booked therapists
- Time zone handling

**State Requirements**:
```javascript
appointmentState: {
  appointments: [
    {
      id: string,
      patientId: string,
      therapistId: string,
      therapistName: string,
      therapistAvatar: string,
      scheduledAt: timestamp,
      duration: number, // minutes
      status: 'scheduled' | 'completed' | 'cancelled' | 'no-show',
      type: 'video' | 'chat' | 'phone',
      notes: string | null,
      price: number,
      paymentStatus: 'pending' | 'paid' | 'refunded',
      meetingUrl: string | null,
      cancelledAt: timestamp | null,
      cancellationReason: string | null,
      completedAt: timestamp | null,
      sessionNotes: string | null, // therapist notes
      createdAt: timestamp
    }
  ],
  upcoming: array,
  past: array,
  selectedSlot: {
    therapistId: string,
    date: date,
    time: string
  } | null,
  isBooking: boolean,
  error: string | null
}
```

**API Endpoints**:
- `POST /api/appointments`
  - Body: `{ therapistId, scheduledAt, duration, type, notes }`
  - Response: `{ appointment: object, paymentUrl: string }`
- `GET /api/appointments`
  - Query: `?status={string}&startDate={date}&endDate={date}`
  - Response: `{ appointments: array }`
- `GET /api/appointments/:id`
  - Response: `{ appointment: object }`
- `PUT /api/appointments/:id/reschedule`
  - Body: `{ scheduledAt }`
  - Response: `{ appointment: object }`
- `PUT /api/appointments/:id/cancel`
  - Body: `{ reason }`
  - Response: `{ success: boolean, refundAmount: number }`
- `POST /api/appointments/:id/join`
  - Response: `{ meetingUrl: string, token: string }`

#### 4.7.2 Video Call Integration
**Priority**: P0 (Critical)

**Functional Requirements**:
- WebRTC-based video calls
- In-browser, no downloads required
- Features:
  - Video on/off
  - Audio mute/unmute
  - Screen sharing
  - Chat during call
  - Background blur (optional)
  - Recording (with consent)
  - Call quality indicator
  - Network diagnostics
- Waiting room
- Auto-end after scheduled time + 10min grace
- Connection fallback options

**State Requirements**:
```javascript
videoCallState: {
  callId: string | null,
  appointmentId: string | null,
  isConnecting: boolean,
  isConnected: boolean,
  localStream: MediaStream | null,
  remoteStream: MediaStream | null,
  isMuted: boolean,
  isVideoOff: boolean,
  isScreenSharing: boolean,
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor',
  participants: [
    {
      id: string,
      name: string,
      role: 'patient' | 'therapist',
      isAudioEnabled: boolean,
      isVideoEnabled: boolean
    }
  ],
  chatMessages: array,
  duration: number, // seconds
  error: string | null,
  signalingState: string,
  iceConnectionState: string
}
```

**WebRTC Signaling**:
- Use Socket.io for signaling server
- STUN/TURN servers for NAT traversal
- Secure peer connections (DTLS-SRTP)

**API Endpoints**:
- `POST /api/video/session`
  - Body: `{ appointmentId }`
  - Response: `{ sessionId, iceServers, token }`
- `GET /api/video/session/:sessionId`
  - Response: `{ session: object, appointment: object }`

---

### 4.8 Admin Dashboard

#### 4.8.1 Therapist Application Review
**Priority**: P0 (Critical)

**Functional Requirements**:
- View all pending applications
- Application details view
- Review submitted documents
- Verify credentials
- Approve/reject with notes
- Request additional information
- Email notifications to applicants
- Application history tracking
- Bulk actions (approve/reject multiple)

**State Requirements**:
```javascript
adminApplicationState: {
  applications: [
    {
      id: string,
      applicantName: string,
      applicantEmail: string,
      submittedAt: timestamp,
      status: string,
      specializations: array,
      credentials: array
    }
  ],
  selectedApplication: object | null,
  filters: {
    status: string | null,
    submittedAfter: date | null,
    specialization: string | null
  },
  isLoading: boolean,
  error: string | null
}
```

**API Endpoints**:
- `GET /api/admin/applications`
  - Query: `?status={string}&page={number}&limit={number}`
  - Response: `{ applications: array, total: number, page: number }`
- `GET /api/admin/applications/:id`
  - Response: `{ application: object }`
- `POST /api/admin/applications/:id/approve`
  - Body: `{ notes }`
  - Response: `{ success: boolean }`
- `POST /api/admin/applications/:id/reject`
  - Body: `{ reason, notes }`
  - Response: `{ success: boolean }`
- `POST /api/admin/applications/:id/request-info`
  - Body: `{ message }`
  - Response: `{ success: boolean }`

#### 4.8.2 Platform Analytics
**Priority**: P2 (Medium)

**Functional Requirements**:
- User metrics (registrations, active users, retention)
- Therapist metrics (applications, approvals, active therapists)
- Appointment metrics (bookings, completions, cancellations)
- Chat metrics (sessions, messages, crisis interventions)
- Revenue metrics
- System health (response times, error rates)
- Custom date ranges
- Exportable reports

---

### 4.9 User Profile

#### 4.9.1 Profile Management
**Priority**: P1 (High)

**Functional Requirements**:
- View/edit profile information:
  - Name
  - Email
  - Phone
  - Avatar/photo
  - Bio
  - Date of birth
  - Gender (optional)
  - Location (optional)
  - Emergency contact
- Privacy settings:
  - Profile visibility
  - Data sharing preferences
  - Email notification preferences
- Password change
- Account deletion (with confirmation)
- Export personal data (GDPR compliance)

**State Requirements**:
```javascript
profileState: {
  profile: {
    id: string,
    email: string,
    name: string,
    phone: string | null,
    avatar: string | null,
    bio: string | null,
    dateOfBirth: date | null,
    gender: string | null,
    location: string | null,
    emergencyContact: {
      name: string,
      phone: string,
      relationship: string
    } | null,
    privacy: {
      profileVisibility: 'public' | 'therapists-only' | 'private',
      shareDataWithTherapist: boolean,
      shareEmotionsWithTherapist: boolean,
      shareJournalWithTherapist: boolean,
      shareHabitsWithTherapist: boolean
    },
    notifications: {
      email: {
        appointments: boolean,
        reminders: boolean,
        weeklyReport: boolean,
        newsletter: boolean
      },
      push: {
        appointments: boolean,
        habits: boolean,
        messages: boolean
      }
    }
  },
  isEditing: boolean,
  isSaving: boolean,
  error: string | null
}
```

**API Endpoints**:
- `GET /api/users/me`
  - Response: `{ user: object }`
- `PUT /api/users/me`
  - Body: `{ name, phone, bio, dateOfBirth, gender, location, emergencyContact }`
  - Response: `{ user: object }`
- `PUT /api/users/me/avatar`
  - Body: FormData with image
  - Response: `{ avatarUrl: string }`
- `PUT /api/users/me/password`
  - Body: `{ currentPassword, newPassword }`
  - Response: `{ success: boolean }`
- `PUT /api/users/me/privacy`
  - Body: `{ privacy: object }`
  - Response: `{ privacy: object }`
- `PUT /api/users/me/notifications`
  - Body: `{ notifications: object }`
  - Response: `{ notifications: object }`
- `POST /api/users/me/export`
  - Response: `{ exportUrl: string, expiresAt: timestamp }`
- `DELETE /api/users/me`
  - Body: `{ password, confirmation: "DELETE MY ACCOUNT" }`
  - Response: `{ success: boolean }`

---

### 4.10 Crisis Support

#### 4.10.1 Crisis Resources
**Priority**: P0 (Critical)

**Functional Requirements**:
- 24/7 accessible crisis page
- No authentication required (accessible from login page)
- Display crisis hotlines by country:
  - USA: 988 (Suicide & Crisis Lifeline)
  - USA: 1-800-273-8255 (National Suicide Prevention Lifeline)
  - International numbers
- Click-to-call functionality
- Chat with crisis counselor (external service integration)
- Safety planning tool
- Immediate coping strategies
- Location-based emergency services
- Anonymous usage (no tracking if not logged in)

**State Requirements**:
```javascript
crisisState: {
  userLocation: {
    country: string,
    detected: boolean
  },
  hotlines: [
    {
      country: string,
      name: string,
      phone: string,
      available24_7: boolean,
      languages: array[string],
      website: string
    }
  ],
  copingStrategies: [
    {
      title: string,
      description: string,
      steps: array[string]
    }
  ],
  isLoading: boolean
}
```

**API Endpoints**:
- `GET /api/crisis/hotlines`
  - Query: `?country={string}`
  - Response: `{ hotlines: array }`
- `GET /api/crisis/resources`
  - Response: `{ copingStrategies: array, emergencyServices: array }`

---

### 4.11 Analytics Dashboard (Patient)

#### 4.11.1 Personal Analytics
**Priority**: P2 (Medium)

**Functional Requirements**:
- Overall mental health score (calculated from emotions, habits, journal sentiment)
- Emotion trends over time
- Habit completion rates
- Journal entry frequency
- Therapist session attendance
- Insights and patterns
- Goal progress tracking
- Comparative analysis (this week vs last week)
- Achievements/milestones

**State Requirements**:
```javascript
analyticsState: {
  overallScore: {
    current: number, // 0-100
    trend: 'improving' | 'stable' | 'declining',
    change: number // percentage change
  },
  emotionTrends: {
    labels: array[string], // dates
    data: object // emotion: [values]
  },
  habitMetrics: {
    completionRate: number,
    currentStreaks: array,
    topHabits: array
  },
  journalMetrics: {
    entriesThisWeek: number,
    sentimentAverage: number,
    topThemes: array
  },
  sessionMetrics: {
    totalSessions: number,
    upcomingSessions: number,
    lastSessionDate: date | null
  },
  achievements: [
    {
      id: string,
      title: string,
      description: string,
      icon: string,
      unlockedAt: timestamp
    }
  ],
  isLoading: boolean,
  error: string | null,
  dateRange: {
    start: date,
    end: date
  }
}
```

**API Endpoints**:
- `GET /api/analytics/overview`
  - Query: `?startDate={date}&endDate={date}`
  - Response: `{ overallScore, emotionTrends, habitMetrics, journalMetrics, sessionMetrics }`
- `GET /api/analytics/achievements`
  - Response: `{ achievements: array }`

---

### 4.12 Therapist Dashboard

#### 4.12.1 Patient Management
**Priority**: P0 (Critical)

**Functional Requirements**:
- View all assigned patients
- Patient search and filtering
- Patient detail view:
  - Basic information
  - Appointment history
  - Emotion tracking data (if shared)
  - Journal entries (if shared)
  - Habit tracking data (if shared)
  - Session notes
  - Treatment plan
- Add session notes
- View upcoming appointments
- Message patients (through platform)
- Request information sharing

**State Requirements**:
```javascript
therapistPatientState: {
  patients: [
    {
      id: string,
      name: string,
      avatar: string | null,
      firstSessionDate: date,
      lastSessionDate: date | null,
      totalSessions: number,
      nextAppointment: object | null,
      dataSharing: {
        emotions: boolean,
        journal: boolean,
        habits: boolean
      }
    }
  ],
  selectedPatient: {
    profile: object,
    emotionData: array,
    journalEntries: array,
    habits: array,
    appointments: array,
    sessionNotes: array,
    treatmentPlan: string | null
  } | null,
  isLoading: boolean,
  error: string | null
}
```

**API Endpoints**:
- `GET /api/therapist/patients`
  - Response: `{ patients: array }`
- `GET /api/therapist/patients/:patientId`
  - Response: `{ patient: object, emotionData: array, journalEntries: array, habits: array, appointments: array, sessionNotes: array }`
- `POST /api/therapist/patients/:patientId/notes`
  - Body: `{ appointmentId, notes, treatmentPlanUpdate }`
  - Response: `{ note: object }`
- `PUT /api/therapist/patients/:patientId/treatment-plan`
  - Body: `{ treatmentPlan }`
  - Response: `{ success: boolean }`

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT TIER (FREE)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   React 18 + Vite (Vercel/Netlify free hosting)       │ │
│  │  - React Router for routing                            │ │
│  │  - Context API + Custom Hooks for state management    │ │
│  │  - Axios for API calls                                 │ │
│  │  - Socket.io-client for real-time features            │ │
│  │  - WebRTC for video calls                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY (FREE)                          │
│  - Cloudflare (free tier)                                   │
│  - SSL/TLS Termination                                      │
│  - Rate Limiting                                            │
│  - DDoS Protection                                          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION TIER (FREE HOSTING)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Node.js + Express (Render/Railway free tier)         │ │
│  │  - RESTful API endpoints                               │ │
│  │  - JWT authentication                                  │ │
│  │  - WebSocket server (Socket.io)                        │ │
│  │  - Input validation & sanitization                     │ │
│  │  - Error handling middleware                           │ │
│  │  - Logging (Winston)                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      AI Agent Service (LangGraph) - FREE               │ │
│  │  - State machine for conversation flow                 │ │
│  │  - Gemini API (free tier: 1500 RPD)                    │ │
│  │  - Local embeddings (sentence-transformers)            │ │
│  │  - pgvector for RAG                                    │ │
│  │  - Emotion analysis                                    │ │
│  │  - Crisis detection                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    DATA TIER (FREE)                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  PostgreSQL      │  │   Redis Cache    │                │
│  │  + pgvector      │  │  (self-hosted)   │                │
│  │  (Supabase free) │  │  - Sessions      │                │
│  │  - User data     │  │  - Rate limiting │                │
│  │  - Appointments  │  │  - Real-time     │                │
│  │  - Emotions      │  └──────────────────┘                │
│  │  - Journal       │                                       │
│  │  - Habits        │                                       │
│  │  - Embeddings    │                                       │
│  └──────────────────┘                                       │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Vector Search   │  │   File Storage   │                │
│  │  (pgvector in    │  │   (MinIO self-   │                │
│  │   PostgreSQL)    │  │    hosted FREE   │                │
│  │  - Chat history  │  │    or Cloudinary │                │
│  │  - Journal       │  │    free tier)    │                │
│  │    embeddings    │  │  - Avatars       │                │
│  │  - Similarity    │  │  - Documents     │                │
│  │    search        │  │  - Attachments   │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (FREE/FREEMIUM)               │
│  - Google Gemini API (FREE: 1500 RPD)                       │
│  - Local sentence-transformers (FREE: no API)               │
│  - Resend/Gmail SMTP (FREE: 3000 emails/month)              │
│  - Free TURN servers / coturn (FREE)                        │
│  - Stripe (dev mode FREE, production paid)                  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

#### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API + Custom Hooks
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Video**: Simple-peer (WebRTC wrapper)
- **Styling**: CSS Modules / Styled Components / Tailwind CSS
- **UI Components**: Custom components + Radix UI primitives
- **Forms**: React Hook Form
- **Validation**: Zod
- **Charts**: Chart.js / Recharts
- **Rich Text Editor**: TipTap / Quill
- **Date Handling**: date-fns

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: JavaScript (ES6+) with JSDoc type hints
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **WebSocket**: Socket.io
- **Validation**: express-validator / Zod
- **Logging**: Winston
- **API Documentation**: Swagger / OpenAPI
- **Process Manager**: PM2

#### AI/ML
- **AI Framework**: LangGraph (@langchain/langgraph) - FREE
- **LLM**: Google Gemini 1.5 Pro / Flash - FREE (generous free tier)
- **Embeddings**: Local model using `sentence-transformers` (all-MiniLM-L6-v2) - FREE
- **Vector Store**: PostgreSQL with pgvector extension - FREE
- **Prompt Management**: LangChain prompt templates - FREE

#### Database
- **Primary Database**: PostgreSQL 15+ - FREE (self-hosted or free tier on Render/Supabase)
- **ORM**: None (raw SQL queries) or Prisma - FREE
- **Migrations**: node-pg-migrate - FREE
- **Cache**: Redis 7+ (self-hosted) - FREE
- **Vector Extensions**: pgvector extension for PostgreSQL - FREE

#### File Storage
- **Development**: Local filesystem - FREE
- **Production**: MinIO (self-hosted S3-compatible) / Cloudinary free tier - FREE

#### External Services
- **AI**: Google Gemini API - FREE (1500 requests/day free tier)
- **Email**: Nodemailer + Gmail SMTP / Resend (free tier) - FREE
- **SMS**: Twilio free trial / optional feature
- **Payments**: Stripe (only for production, mock in dev) / PayPal
- **TURN Servers**: Free public TURN servers / self-hosted coturn - FREE

#### DevOps
- **Version Control**: Git - FREE
- **CI/CD**: GitHub Actions (free tier) - FREE
- **Containerization**: Docker - FREE
- **Orchestration**: Docker Compose - FREE
- **Hosting**: 
  - Frontend: Vercel / Netlify (free tier) - FREE
  - Backend: Render / Railway (free tier) / Self-hosted VPS - FREE/LOW COST
- **Monitoring**: 
  - Application: Prometheus + Grafana (self-hosted) - FREE
  - Logs: Self-hosted ELK Stack / Loki - FREE
  - Error Tracking: Sentry free tier / GlitchTip (self-hosted) - FREE
- **Security Scanning**: OWASP ZAP / Trivy - FREE

---

## 6. State Management

### 6.1 Client-Side State Architecture

#### 6.1.1 Context-Based State Management

```javascript
// State structure organized by domain

// 1. Global App Context
<AppContext>
  - theme: 'light' | 'dark'
  - isOnline: boolean
  - notifications: array
  - modal: { isOpen, type, data }
  - toast: { messages }
</AppContext>

// 2. Auth Context
<AuthContext>
  - See 4.1.1 authState
  - Methods: login(), logout(), refreshToken(), updateProfile()
</AuthContext>

// 3. Chat Context
<ChatContext>
  - See 4.2.1 chatState
  - Methods: sendMessage(), loadHistory(), startSession(), clearSession()
</ChatContext>

// 4. Emotion Context
<EmotionContext>
  - See 4.3.1 emotionState
  - Methods: logEmotion(), updateEmotion(), deleteEmotion(), loadEmotions(), getAnalytics()
</EmotionContext>

// 5. Habit Context
<HabitContext>
  - See 4.4.1 habitState
  - Methods: createHabit(), updateHabit(), deleteHabit(), completeHabit(), loadHabits()
</HabitContext>

// 6. Journal Context
<JournalContext>
  - See 4.5.1 journalState
  - Methods: createEntry(), updateEntry(), deleteEntry(), loadEntries(), saveDraft()
</JournalContext>

// 7. Therapist Context
<TherapistContext>
  - See 4.6.1 therapistState
  - Methods: loadTherapists(), filterTherapists(), selectTherapist(), addFavorite(), removeFavorite()
</TherapistContext>

// 8. Appointment Context
<AppointmentContext>
  - See 4.7.1 appointmentState
  - Methods: bookAppointment(), reschedule(), cancel(), loadAppointments()
</AppointmentContext>

// 9. Video Call Context
<VideoCallContext>
  - See 4.7.2 videoCallState
  - Methods: initCall(), endCall(), toggleMute(), toggleVideo(), shareScreen()
</VideoCallContext>
```

#### 6.1.2 State Persistence

**Local Storage**:
- Auth tokens (encrypted)
- User preferences (theme, language)
- Draft content (journal, forms)
- Recently viewed items

**Session Storage**:
- Temporary form data
- Navigation state

**IndexedDB**:
- Offline chat history
- Cached therapist profiles
- Emotion/habit data for offline access

#### 6.1.3 State Synchronization

**Optimistic Updates**:
- Update UI immediately
- Show pending state
- Rollback on error
- Examples: habit completion, emotion logging, sending messages

**Real-time Updates**:
- WebSocket connection for live data
- Auto-refresh on reconnection
- Conflict resolution strategy (last-write-wins)

**Background Sync**:
- Sync queued actions when online
- Service Worker for offline support
- Retry failed requests with exponential backoff

### 6.2 Server-Side State Management

#### 6.2.1 Session Management

```javascript
// Redis-based session store
sessionState: {
  userId: string,
  role: string,
  permissions: array[string],
  lastActivity: timestamp,
  deviceInfo: object,
  ipAddress: string
}

// Session lifecycle
- Creation: On login
- Refresh: Every 15 minutes of activity
- Expiry: 7 days (with remember me), 1 day (without)
- Invalidation: On logout, password change, suspicious activity
```

#### 6.2.2 AI Agent State

```javascript
// LangGraph state machine
agentState: {
  sessionId: string,
  userId: string,
  currentNode: string,
  conversationHistory: [
    { role: 'user' | 'assistant', content: string, timestamp: timestamp }
  ],
  context: {
    userProfile: object,
    recentEmotions: array,
    recentJournals: array,
    activeHabits: array,
    therapistNotes: string | null,
    previousSummaries: array
  },
  analysisResults: {
    currentEmotion: string | null,
    sentimentScore: number,
    crisisLevel: 'none' | 'low' | 'medium' | 'high' | 'critical',
    topics: array[string]
  },
  recommendations: {
    suggestedActions: array[string],
    suggestedTherapists: array[string],
    copingStrategies: array[string]
  },
  metadata: {
    messageCount: number,
    sessionDuration: number,
    averageResponseTime: number
  }
}

// State persistence
- Store in Redis with 24hr TTL
- Persist to PostgreSQL every 10 messages
- Load from PostgreSQL on new session
```

#### 6.2.3 WebRTC Signaling State

```javascript
// Socket.io room-based state
signalingState: {
  roomId: string,
  appointmentId: string,
  participants: [
    {
      socketId: string,
      userId: string,
      role: 'patient' | 'therapist',
      peerId: string,
      status: 'connecting' | 'connected' | 'disconnected'
    }
  ],
  startedAt: timestamp,
  iceServers: array,
  recordingEnabled: boolean
}
```

---

## 7. API Specifications

### 7.1 API Design Principles

- **RESTful**: Resource-based URLs, standard HTTP methods
- **Versioning**: `/api/v1/` prefix for future compatibility
- **Authentication**: JWT Bearer tokens in Authorization header
- **Rate Limiting**: 100 requests/minute per user
- **Pagination**: `?page=1&limit=20` with Link headers
- **Filtering**: Query parameters for filtering (e.g., `?status=active&category=mental`)
- **Sorting**: `?sortBy=createdAt&order=desc`
- **Error Handling**: Consistent error response format

### 7.2 API Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "requestId": "uuid"
}
```

### 7.3 Error Codes

- `AUTHENTICATION_ERROR`: 401 - Invalid or expired token
- `AUTHORIZATION_ERROR`: 403 - Insufficient permissions
- `VALIDATION_ERROR`: 400 - Invalid input data
- `NOT_FOUND`: 404 - Resource not found
- `CONFLICT`: 409 - Resource conflict (e.g., duplicate email)
- `RATE_LIMIT_EXCEEDED`: 429 - Too many requests
- `INTERNAL_SERVER_ERROR`: 500 - Server error
- `SERVICE_UNAVAILABLE`: 503 - External service down

### 7.4 Authentication Flow

```
1. User Registration
   POST /api/auth/register
   → Email verification sent
   → User clicks link
   → GET /api/auth/verify-email?token=xxx
   → Account activated

2. User Login
   POST /api/auth/login
   → Returns: accessToken (15min), refreshToken (7 days)
   → Store tokens in httpOnly cookies or localStorage

3. Authenticated Request
   GET /api/resource
   Headers: Authorization: Bearer {accessToken}
   → If 401, refresh token
   → Retry request

4. Token Refresh
   POST /api/auth/refresh
   Body: { refreshToken }
   → Returns: new accessToken, new refreshToken

5. Logout
   POST /api/auth/logout
   → Invalidate refresh token
   → Clear client-side tokens
```

---

## 8. Database Schema

### 8.1 Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'therapist', 'admin')),
  avatar_url TEXT,
  phone VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(50),
  location TEXT,
  bio TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
);
```

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(100),
  privacy_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);
```

#### therapists
```sql
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(255),
  specializations TEXT[],
  languages TEXT[],
  years_of_experience INTEGER,
  approach TEXT,
  credentials JSONB DEFAULT '[]',
  pricing JSONB DEFAULT '{}',
  availability JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  is_accepting_clients BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id),
  INDEX idx_therapists_verified (is_verified),
  INDEX idx_therapists_specializations USING GIN(specializations),
  INDEX idx_therapists_rating (rating)
);
```

#### therapist_applications
```sql
CREATE TABLE therapist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  application_data JSONB NOT NULL,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_applications_status (status),
  INDEX idx_applications_user (user_id)
);
```

#### emotions
```sql
CREATE TABLE emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion VARCHAR(50) NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  triggers TEXT[],
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_emotions_user_date (user_id, recorded_at DESC),
  INDEX idx_emotions_emotion (emotion)
);
```

#### habits
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  frequency JSONB NOT NULL,
  goal JSONB,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  reminders JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_habits_user_active (user_id, is_active)
);
```

#### habit_completions
```sql
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL,
  notes TEXT,
  mood VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_completions_habit_date (habit_id, completed_at DESC),
  INDEX idx_completions_user_date (user_id, completed_at DESC)
);
```

#### journal_entries
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  mood VARCHAR(50),
  tags TEXT[],
  is_shared_with_therapist BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_journal_user_date (user_id, created_at DESC),
  INDEX idx_journal_tags USING GIN(tags),
  INDEX idx_journal_shared (user_id, is_shared_with_therapist)
);
```

#### appointments
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'chat', 'phone')),
  notes TEXT,
  price DECIMAL(10, 2),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  meeting_url TEXT,
  session_notes TEXT,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_appointments_patient (patient_id, scheduled_at DESC),
  INDEX idx_appointments_therapist (therapist_id, scheduled_at DESC),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_scheduled (scheduled_at)
);
```

#### chat_sessions
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  
  INDEX idx_chat_sessions_user (user_id, created_at DESC)
);
```

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_chat_messages_session (session_id, created_at ASC),
  INDEX idx_chat_messages_user (user_id, created_at DESC)
);
```

#### chat_embeddings (for vector search)
```sql
-- Using FREE pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chat_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(384), -- all-MiniLM-L6-v2 produces 384-dim embeddings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_embeddings_message (message_id),
  INDEX idx_embeddings_user (user_id)
);

-- Create index for similarity search (cosine distance)
CREATE INDEX idx_embeddings_vector ON chat_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: HNSW index (better for smaller datasets)
-- CREATE INDEX idx_embeddings_vector ON chat_embeddings 
-- USING hnsw (embedding vector_cosine_ops);
```

### 8.2 Indexes & Constraints

**Performance Indexes**:
- All foreign keys have indexes
- Composite indexes for common query patterns
- GIN indexes for array/JSONB columns
- Vector indexes for similarity search

**Data Integrity**:
- Foreign key constraints with CASCADE delete
- Check constraints for enums and ranges
- Unique constraints where applicable
- NOT NULL constraints on required fields

### 8.3 Database Migrations

```javascript
// Migration naming: {timestamp}_{description}.sql
// Example: 20250114_create_users_table.sql

// Run migrations on deployment
npm run migrate:up

// Rollback if needed
npm run migrate:down

// Migration tracking in table:
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. AI/ML Requirements

### 9.1 AI Agent Implementation

#### 9.1.1 LangGraph State Machine

```javascript
import { StateGraph, END } from "@langchain/langgraph";

// Define agent nodes
const agentGraph = new StateGraph({
  channels: agentStateChannels
});

// Add nodes
agentGraph.addNode("inputProcessing", inputProcessingNode);
agentGraph.addNode("contextRetrieval", contextRetrievalNode);
agentGraph.addNode("emotionAnalysis", emotionAnalysisNode);
agentGraph.addNode("crisisDetection", crisisDetectionNode);
agentGraph.addNode("responseGeneration", responseGenerationNode);
agentGraph.addNode("recommendations", recommendationNode);

// Define edges (flow)
agentGraph.addEdge("inputProcessing", "crisisDetection");
agentGraph.addConditionalEdges(
  "crisisDetection",
  (state) => state.analysisResults.crisisLevel === "critical" ? "crisisResponse" : "contextRetrieval"
);
agentGraph.addEdge("contextRetrieval", "emotionAnalysis");
agentGraph.addEdge("emotionAnalysis", "responseGeneration");
agentGraph.addEdge("responseGeneration", "recommendations");
agentGraph.addEdge("recommendations", END);

// Set entry point
agentGraph.setEntryPoint("inputProcessing");

const app = agentGraph.compile();
```

#### 9.1.2 Prompts & Templates

**System Prompt**:
```
You are a compassionate, empathetic AI mental health assistant. Your role is to:
1. Listen actively and validate the user's feelings
2. Provide emotional support and coping strategies
3. Never diagnose or prescribe medication
4. Detect crisis situations and provide appropriate resources
5. Encourage professional help when needed
6. Maintain user privacy and confidentiality

Guidelines:
- Use warm, non-judgmental language
- Ask clarifying questions when needed
- Provide evidence-based coping strategies
- Remember context from previous conversations
- Be honest about your limitations as an AI

Crisis Protocol:
- If user expresses suicidal ideation or self-harm intent, immediately:
  1. Express concern for their safety
  2. Provide crisis hotline numbers
  3. Encourage contacting emergency services or trusted person
  4. Suggest scheduling urgent therapist session
  5. Do not leave user feeling alone
```

**Context Prompt Template**:
```
User Profile:
- Name: {userName}
- Recent emotions: {recentEmotions}
- Active habits: {activeHabits}
- Recent journal themes: {journalThemes}
- Current therapist notes: {therapistNotes}

Recent conversation summary:
{conversationSummary}

Current message: {userMessage}

Respond with empathy and actionable support.
```

#### 9.1.3 Vector Store Implementation

**Embedding Generation** (Using Local Model - FREE):
```javascript
// Install: pip install sentence-transformers
// Run embedding service or use @xenova/transformers for Node.js

import { pipeline } from '@xenova/transformers';

// Initialize the embedding pipeline (runs locally)
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Generate embedding for text
async function generateEmbedding(text) {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

const embedding = await generateEmbedding(text);
// Returns: Array[384] - smaller and faster than Google's 768-dim
```

**Alternative: Python Microservice** (if Node.js performance is insufficient):
```python
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify

app = Flask(__name__)
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/embed', methods=['POST'])
def embed():
    text = request.json['text']
    embedding = model.encode(text).tolist()
    return jsonify({'embedding': embedding})

# Run: python embedding_service.py
# Call from Node.js via HTTP
```

**Similarity Search** (PostgreSQL + pgvector):
```javascript
// Query: Find relevant past conversations
async function findRelevantContext(userId, query, topK = 5) {
  const queryEmbedding = await generateEmbedding(query);
  
  // PostgreSQL with pgvector (FREE)
  // Format embedding as PostgreSQL vector
  const vectorString = `[${queryEmbedding.join(',')}]`;
  
  const result = await db.query(`
    SELECT 
      cm.id,
      cm.content,
      cm.sender,
      cm.created_at,
      1 - (ce.embedding <=> $1::vector) AS similarity
    FROM chat_embeddings ce
    JOIN chat_messages cm ON cm.id = ce.message_id
    WHERE ce.user_id = $2
    ORDER BY ce.embedding <=> $1::vector
    LIMIT $3
  `, [vectorString, userId, topK]);
  
  return result.rows;
}
```

**Setup pgvector** (one-time setup):
```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 9.2 Emotion Analysis

```javascript
async function analyzeEmotion(text, context = {}) {
  const prompt = `
    Analyze the emotion in the following text. Consider the context provided.
    
    Text: "${text}"
    
    Context:
    - Recent emotions: ${context.recentEmotions || 'None'}
    - Recent triggers: ${context.recentTriggers || 'None'}
    
    Respond with JSON:
    {
      "primary_emotion": "string (happy, sad, anxious, angry, calm, excited, tired, stressed)",
      "intensity": number (1-10),
      "secondary_emotions": ["string"],
      "sentiment": "positive | negative | neutral",
      "sentiment_score": number (-1 to 1),
      "confidence": number (0-1)
    }
  `;
  
  const response = await geminiModel.generateContent(prompt);
  return JSON.parse(response.text);
}
```

### 9.3 Crisis Detection

```javascript
// Keyword-based initial detection
const CRISIS_KEYWORDS = {
  critical: [
    'kill myself', 'suicide', 'end my life', 'want to die',
    'better off dead', 'no reason to live'
  ],
  high: [
    'hurt myself', 'self harm', 'cut myself', 'overdose',
    'can\'t go on', 'give up'
  ],
  medium: [
    'hopeless', 'worthless', 'no point', 'can\'t cope'
  ]
};

async function detectCrisis(text) {
  // 1. Keyword matching
  let keywordLevel = 'none';
  for (const [level, keywords] of Object.entries(CRISIS_KEYWORDS)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw))) {
      keywordLevel = level;
      break;
    }
  }
  
  // 2. AI-based analysis for context
  if (keywordLevel !== 'none') {
    const prompt = `
      Analyze this message for crisis risk. Consider context and intent.
      
      Message: "${text}"
      
      Respond with JSON:
      {
        "crisis_level": "none | low | medium | high | critical",
        "crisis_type": "suicide | self_harm | psychosis | other | none",
        "immediate_danger": boolean,
        "reasoning": "string"
      }
    `;
    
    const response = await geminiModel.generateContent(prompt);
    return JSON.parse(response.text);
  }
  
  return { crisis_level: 'none', immediate_danger: false };
}
```

### 9.4 Recommendation Engine

```javascript
async function generateRecommendations(userId, conversationContext) {
  const userProfile = await getUserProfile(userId);
  const recentEmotions = await getRecentEmotions(userId, 7); // last 7 days
  const activeHabits = await getActiveHabits(userId);
  
  const prompt = `
    Generate personalized recommendations for the user based on their context.
    
    Profile:
    - Recent emotions: ${JSON.stringify(recentEmotions)}
    - Active habits: ${JSON.stringify(activeHabits)}
    - Current concerns: ${conversationContext.topics.join(', ')}
    
    Provide recommendations in JSON:
    {
      "coping_strategies": [
        {
          "title": "string",
          "description": "string",
          "steps": ["string"]
        }
      ],
      "suggested_habits": ["string"],
      "journal_prompts": ["string"],
      "therapist_specializations": ["string"],
      "resources": [
        {
          "title": "string",
          "url": "string",
          "description": "string"
        }
      ]
    }
  `;
  
  const response = await geminiModel.generateContent(prompt);
  return JSON.parse(response.text);
}
```

---

## 10. Security & Privacy

### 10.1 Authentication & Authorization

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character
- Bcrypt hashing with salt rounds = 12

**JWT Tokens**:
```javascript
// Access Token (short-lived)
{
  userId: string,
  role: string,
  permissions: array,
  exp: 15 minutes
}

// Refresh Token (long-lived)
{
  userId: string,
  tokenFamily: string, // for rotation
  exp: 7 days
}
```

**Token Security**:
- HttpOnly cookies (if using cookies)
- CSRF protection
- Token rotation on refresh
- Blacklist on logout
- Automatic rotation on suspicious activity

### 10.2 Data Protection

**Encryption**:
- At rest: PostgreSQL transparent data encryption
- In transit: TLS 1.3 for all connections
- Sensitive fields: AES-256 encryption (emergency contacts, etc.)

**Data Minimization**:
- Collect only necessary data
- Anonymous analytics where possible
- Regular data cleanup (old sessions, expired tokens)

**Access Control**:
```javascript
// Role-based permissions
const PERMISSIONS = {
  patient: [
    'read:own_profile',
    'update:own_profile',
    'create:emotion',
    'create:journal',
    'create:habit',
    'book:appointment',
    'chat:ai'
  ],
  therapist: [
    'read:own_profile',
    'update:own_profile',
    'read:assigned_patients',
    'update:session_notes',
    'view:shared_data'
  ],
  admin: [
    'read:all',
    'update:applications',
    'manage:users'
  ]
};
```

### 10.3 HIPAA Compliance Considerations

**Note**: Full HIPAA compliance requires additional infrastructure and legal review.

**Basic Requirements**:
1. **Access Controls**: Role-based access, audit logs
2. **Encryption**: Data at rest and in transit
3. **Audit Trails**: Log all data access
4. **Data Backup**: Regular backups with encryption
5. **Business Associate Agreements**: With all service providers
6. **User Privacy Controls**: Consent management, data export, deletion

**Audit Logging**:
```javascript
// Log all sensitive data access
auditLog.create({
  userId: user.id,
  action: 'READ',
  resource: 'patient_emotions',
  resourceId: emotionId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
});
```

### 10.4 Input Validation & Sanitization

**Validation**:
```javascript
import { z } from 'zod';

const emotionSchema = z.object({
  emotion: z.enum(['happy', 'sad', 'anxious', 'angry', 'calm', 'excited', 'tired', 'stressed']),
  intensity: z.number().int().min(1).max(10),
  notes: z.string().max(1000).optional(),
  triggers: z.array(z.string().max(100)).max(10).optional(),
  timestamp: z.string().datetime()
});

// Usage
const validated = emotionSchema.parse(req.body);
```

**Sanitization**:
- Strip HTML from user input (except rich text editor content)
- Escape special characters in SQL queries (use parameterized queries)
- Sanitize file uploads (type, size, content)
- Rate limiting on all endpoints

### 10.5 Security Headers

```javascript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.gemini.google.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 11. Performance Requirements

### 11.1 Response Time Targets

- **API Response**: < 200ms (p95)
- **Page Load**: < 2s (p95)
- **AI Response**: < 3s (p95)
- **Video Call Latency**: < 150ms
- **Database Queries**: < 50ms (p95)

### 11.2 Scalability

- **Concurrent Users**: 10,000+
- **Messages per Second**: 1,000+
- **Database Connections**: Pool of 50-100
- **Horizontal Scaling**: Load balanced app servers
- **Caching**: Redis for frequently accessed data

### 11.3 Optimization Strategies

**Frontend**:
- Code splitting by route
- Lazy loading images
- Virtual scrolling for long lists
- Debounce search inputs
- Service Worker for offline support
- CDN for static assets

**Backend**:
- Database query optimization
- Index all foreign keys and common filters
- Caching with Redis (user sessions, frequently accessed data)
- Connection pooling
- Compression (gzip/brotli)
- Batch operations where possible

**AI**:
- Cache common responses
- Stream responses for better perceived performance
- Rate limit expensive operations
- Use Gemini Flash for faster responses when appropriate
- Batch embedding generation

---

## 12. Testing Requirements

### 12.1 Unit Tests

**Coverage Target**: 80%+

**Frontend**:
- Component rendering
- Hook behavior
- Utility functions
- State management logic

**Backend**:
- Route handlers
- Middleware
- Database queries
- AI agent nodes
- Utility functions

### 12.2 Integration Tests

- API endpoint flows
- Authentication flows
- Database operations
- WebSocket connections
- External service integrations

### 12.3 End-to-End Tests

**Critical Flows**:
1. User registration → email verification → login
2. Emotion logging → viewing analytics
3. Habit creation → completion → streak tracking
4. Journal entry → AI insights
5. Therapist search → booking → video call
6. Crisis detection → resource display
7. Chat session → AI response → context retention

### 12.4 Test Tools

- **Frontend**: Jest, React Testing Library, Cypress
- **Backend**: Jest, Supertest
- **E2E**: Playwright / Cypress
- **Load Testing**: k6 / Artillery
- **API Testing**: Postman / Insomnia

---

## 13. Deployment Strategy

### 13.1 Environment Setup

**Environments**:
1. **Development**: Local dev machines
2. **Staging**: Pre-production testing
3. **Production**: Live environment

**Environment Variables** (All FREE or optional):
```env
# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://app.example.com

# Database (FREE - use Supabase/Render free tier)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379

# Authentication (FREE - generate your own)
JWT_SECRET=<secure-random-string>  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_REFRESH_SECRET=<secure-random-string>

# AI Services (FREE)
GOOGLE_API_KEY=<api-key>  # FREE: Get from https://makersuite.google.com/app/apikey
GEMINI_MODEL=gemini-1.5-flash  # or gemini-1.5-pro (both have free tiers)

# Email (FREE - optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-gmail>
EMAIL_PASSWORD=<app-password>  # Generate app password in Gmail settings
# OR use Resend: RESEND_API_KEY=<free-tier-key>

# File Storage (FREE - optional)
# Use MinIO (self-hosted) or Cloudinary free tier
CLOUDINARY_CLOUD_NAME=<optional>
CLOUDINARY_API_KEY=<optional>
CLOUDINARY_API_SECRET=<optional>

# Payments (OPTIONAL - skip for MVP)
STRIPE_SECRET_KEY=<only-for-production>

# Monitoring (FREE)
SENTRY_DSN=<optional-free-tier>  # Free: https://sentry.io

# Note: Most services above are OPTIONAL or have generous free tiers!
# Minimum required for MVP: DATABASE_URL, JWT_SECRET, GOOGLE_API_KEY
```

**Getting Free API Keys:**

1. **Gemini API (Required)** - FREE
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Free tier: 1500 requests/day, 15 RPM

2. **Supabase Database (Recommended)** - FREE
   - Visit: https://supabase.com
   - Create free project
   - Get connection string from Settings > Database
   - Includes PostgreSQL + pgvector extension

3. **Resend Email (Optional)** - FREE
   - Visit: https://resend.com
   - Sign up for free
   - 3000 emails/month free
   - Better deliverability than Gmail SMTP

4. **Cloudinary Storage (Optional)** - FREE
   - Visit: https://cloudinary.com
   - Free tier: 25GB storage, 25GB bandwidth
   - Or use MinIO (self-hosted, completely free)

### 13.2 Deployment Pipeline

```yaml
# CI/CD Pipeline (GitHub Actions)

1. On Pull Request:
   - Run linter
   - Run unit tests
   - Run integration tests
   - Build check

2. On Merge to Main:
   - Run all tests
   - Build Docker images
   - Push to container registry
   - Deploy to staging
   - Run E2E tests on staging
   - Manual approval gate
   - Deploy to production
   - Run smoke tests
   - Notify team
```

### 13.3 Infrastructure

**Frontend**:
- Hosting: Vercel / Netlify
- CDN: Cloudflare
- DNS: Cloudflare DNS

**Backend**:
- Hosting: AWS EC2 / DigitalOcean Droplets / Railway
- Load Balancer: AWS ALB / NGINX
- Container Orchestration: Docker Compose / Kubernetes

**Database**:
- Primary: AWS RDS PostgreSQL / Managed PostgreSQL
- Cache: Redis Cloud / AWS ElastiCache
- Backups: Daily automated backups, 30-day retention

**File Storage**:
- AWS S3 / Cloudinary
- CDN for asset delivery

### 13.4 Monitoring & Logging

**Application Monitoring**:
- New Relic / Datadog for APM
- Error tracking: Sentry
- Uptime monitoring: UptimeRobot / Pingdom

**Logging**:
- Centralized logging: ELK Stack / CloudWatch
- Log levels: ERROR, WARN, INFO, DEBUG
- Structured logging (JSON format)
- Log retention: 90 days

**Metrics**:
- Response times (p50, p95, p99)
- Error rates
- Request rates
- Database query performance
- AI response times
- WebSocket connection health
- Video call quality metrics

---

## 14. Success Metrics

### 14.1 User Engagement Metrics

- **Daily Active Users (DAU)**: Target 60% of registered users
- **Monthly Active Users (MAU)**: Target 80% of registered users
- **Session Duration**: Average 15+ minutes
- **Return Rate**: 70%+ users return within 7 days
- **Feature Adoption**:
  - Chat: 90%+ of users
  - Emotion Tracking: 60%+ of users
  - Habits: 40%+ of users
  - Journal: 30%+ of users
  - Therapist Booking: 20%+ of users

### 14.2 Business Metrics

- **User Growth**: 20% month-over-month
- **Therapist Onboarding**: 50+ verified therapists in 6 months
- **Appointment Booking Rate**: 30% of users book appointment within 30 days
- **Retention Rate**: 70% after 3 months
- **NPS Score**: 50+
- **Customer Satisfaction**: 4.5+ stars

### 14.3 Technical Metrics

- **Uptime**: 99.9%
- **API Success Rate**: 99.5%
- **Average Response Time**: < 200ms
- **Error Rate**: < 0.1%
- **AI Response Quality**: 4+ stars user rating
- **Video Call Success Rate**: 95%+
- **Page Load Time**: < 2s (p95)

### 14.4 Health & Safety Metrics

- **Crisis Detection Accuracy**: Track false positive/negative rates
- **Crisis Response Time**: Immediate display of resources
- **User Safety Reports**: < 0.01% of sessions
- **Therapist Response Rate**: 90%+ within 24 hours

---

## 15. Future Enhancements

### 15.1 Phase 2 Features (3-6 months)

1. **Mobile Apps**: Native iOS & Android apps
2. **Group Therapy**: Virtual group sessions
3. **Family Accounts**: Shared family therapy
4. **Insurance Integration**: Direct billing to insurance
5. **AI Voice Chat**: Voice-based AI conversations
6. **Medication Tracking**: Reminder and tracking system
7. **Community Forums**: Peer support groups
8. **Wearable Integration**: Sync with Fitbit, Apple Watch for biometrics

### 15.2 Phase 3 Features (6-12 months)

1. **AI Therapist Matching**: ML-based therapist recommendations
2. **Predictive Analytics**: Predict mental health trends
3. **VR Therapy**: Virtual reality exposure therapy
4. **Advanced Journaling**: Voice-to-text journaling
5. **Relationship Tracking**: Couple's therapy tools
6. **AI Crisis Counselor**: Advanced AI for crisis situations
7. **Blockchain Records**: Decentralized health records
8. **Multi-language Support**: 10+ languages

---

## 16. Glossary

**Terms**:
- **Patient**: User seeking mental health support
- **Therapist**: Licensed mental health professional
- **Session**: Video/chat appointment with therapist
- **Crisis Level**: Severity of detected mental health crisis
- **Emotion Entry**: User-logged emotion with intensity
- **Habit Streak**: Consecutive days of habit completion
- **Vector Embedding**: Numerical representation of text for similarity search
- **Context Window**: Recent conversation history used by AI
- **RAG**: Retrieval-Augmented Generation - AI technique using retrieved context

---

## 17. Appendices

### Appendix A: API Endpoint Reference

See section 7 for complete API specifications. Total endpoints: ~60+

### Appendix B: Database ERD

[Include database entity relationship diagram]

### Appendix C: System Architecture Diagram

See section 5.1 for architecture diagram

### Appendix D: Wireframes & UI Mockups

[To be created by design team]

### Appendix E: Compliance Checklist

- [ ] HIPAA compliance review
- [ ] GDPR compliance for EU users
- [ ] CCPA compliance for California users
- [ ] Accessibility (WCAG 2.1 Level AA)
- [ ] Security audit
- [ ] Penetration testing
- [ ] Privacy policy review
- [ ] Terms of service review

---

## 18. Free & Open Source Tools Cost Breakdown

### 18.1 100% Free Components

#### Core Infrastructure
- **Frontend Framework**: React + Vite - FREE
- **Backend Framework**: Node.js + Express - FREE
- **Database**: PostgreSQL (self-hosted or Render/Supabase free tier) - FREE
- **Cache**: Redis (self-hosted) - FREE
- **Vector Store**: pgvector extension - FREE
- **Containerization**: Docker + Docker Compose - FREE

#### AI/ML Stack
- **LLM**: Google Gemini API - FREE (1500 RPD limit)
  - Generous free tier: 15 requests/minute, 1500 requests/day
  - 1 million tokens/month free
  - Perfect for development and small-scale production
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2) - 100% FREE
  - Runs locally, no API costs
  - 384-dimensional embeddings
  - ~20-30ms per embedding on CPU
  - Option to use @xenova/transformers in Node.js or Python microservice
- **Vector Operations**: PostgreSQL pgvector - FREE
  - Native PostgreSQL extension
  - Supports cosine similarity, L2 distance
  - Scales to millions of vectors

#### Development & Deployment
- **Version Control**: Git + GitHub - FREE
- **CI/CD**: GitHub Actions - FREE (2000 minutes/month)
- **Frontend Hosting**: Vercel/Netlify free tier - FREE
  - 100GB bandwidth/month
  - Automatic SSL
  - CDN included
- **Backend Hosting**: Render/Railway free tier - FREE
  - 750 hours/month free dyno time
  - Automatic deployments
- **Monitoring**: Prometheus + Grafana (self-hosted) - FREE
- **Error Tracking**: Sentry free tier or GlitchTip (self-hosted) - FREE

#### Communication Services
- **Email**: Nodemailer + Gmail SMTP - FREE (500 emails/day)
  - Alternative: Resend (3000 emails/month free)
  - Alternative: Self-hosted mail server
- **SMS**: Optional (use Twilio trial or skip for MVP) - FREE trial
- **Video Calls**: Self-hosted coturn (TURN server) - FREE
  - Alternative: Free public TURN servers
  - WebRTC for peer-to-peer connections

#### File Storage
- **Development**: Local filesystem - FREE
- **Production**: MinIO (self-hosted, S3-compatible) - FREE
  - Alternative: Cloudinary free tier (25GB storage, 25GB bandwidth)

### 18.2 Estimated Monthly Costs (Production Scale)

#### Scenario 1: Small Scale (100-500 users)
- **Hosting**: $0 (free tiers)
- **Database**: $0 (Render/Supabase free tier)
- **AI API**: $0 (within Gemini free tier)
- **Email**: $0 (Gmail SMTP or Resend free tier)
- **Storage**: $0 (MinIO self-hosted or Cloudinary free tier)
- **Total**: **$0/month** 🎉

#### Scenario 2: Medium Scale (1000-5000 users)
- **VPS Hosting**: $10-20/month (DigitalOcean, Hetzner)
- **Database**: $0-15/month (self-hosted on VPS or managed free tier)
- **AI API**: $0-50/month (may exceed free tier)
- **Email**: $0-10/month (Resend paid tier if needed)
- **Storage**: $0-10/month (self-hosted or cloud)
- **Total**: **$20-105/month**

#### Scenario 3: Large Scale (10,000+ users)
- **VPS Hosting**: $50-100/month (better specs)
- **Database**: $25-50/month (managed PostgreSQL)
- **AI API**: $100-200/month (heavy usage)
- **Email**: $20-40/month
- **Storage**: $20-50/month
- **CDN**: $10-30/month (Cloudflare Pro)
- **Total**: **$225-470/month**

### 18.3 Cost Optimization Strategies

#### 1. Use Free Tiers Wisely
- Start with all free services
- Monitor usage closely
- Upgrade only when necessary

#### 2. Self-Host Where Possible
- PostgreSQL + pgvector on VPS
- Redis on same VPS
- MinIO for object storage
- Prometheus + Grafana for monitoring

#### 3. Optimize AI Usage
- Cache common AI responses
- Use Gemini Flash (faster, cheaper) for simple queries
- Batch embeddings generation
- Implement rate limiting
- Use local embeddings (100% free, no API calls)

#### 4. Database Optimization
- Use connection pooling
- Implement proper indexes
- Cache frequently accessed data in Redis
- Use pgvector efficiently (batch similarity searches)

#### 5. Bandwidth Optimization
- Compress images and assets
- Use CDN (Cloudflare free tier)
- Implement lazy loading
- Minimize API payload sizes

### 18.4 Local Development Setup (100% Free)

```bash
# Clone repository
git clone <repo-url>
cd mental-health-platform

# Install dependencies
cd client && npm install
cd ../server && npm install

# Install local embedding model
pip install sentence-transformers

# Start PostgreSQL with Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mental_health \
  -p 5432:5432 \
  pgvector/pgvector:pg15

# Start Redis with Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Setup environment variables
cp .env.example .env
# Add your free Gemini API key

# Run migrations
npm run migrate

# Start development servers
npm run dev # Backend on port 5000
npm run dev # Frontend on port 5173

# Total cost: $0 ✅
```

### 18.5 Alternative Free AI Models (No API Keys Needed)

If you want to avoid external APIs entirely:

#### Option 1: Ollama (Local LLM)
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model (free, runs locally)
ollama pull llama2:7b  # or mistral, codellama, etc.

# Use in your app
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama2:7b',
    prompt: 'User message here'
  })
});
```

#### Option 2: Hugging Face Inference API
```javascript
// Free tier: 30,000 characters/month
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN); // Free token

const response = await hf.textGeneration({
  model: 'mistralai/Mistral-7B-Instruct-v0.2',
  inputs: 'User message here'
});
```

### 18.6 Recommended Free Tech Stack Summary

```
┌─────────────────────────────────────────────────────────┐
│                    FREE STACK                           │
├─────────────────────────────────────────────────────────┤
│ Frontend:    React + Vite (Vercel free hosting)        │
│ Backend:     Node.js + Express (Render free tier)      │
│ Database:    PostgreSQL + pgvector (Supabase free)     │
│ Cache:       Redis (included in free tier)             │
│ AI (LLM):    Gemini API free tier (1500 RPD)           │
│ AI (Embed):  all-MiniLM-L6-v2 (local, 100% free)      │
│ Storage:     MinIO (self-hosted) or Cloudinary free    │
│ Email:       Resend free tier (3000/month)             │
│ Monitoring:  Sentry free tier                          │
│ CI/CD:       GitHub Actions free tier                  │
│                                                         │
│ Total Monthly Cost: $0 for up to 500 users! 🎉         │
└─────────────────────────────────────────────────────────┘
```

### 18.7 When to Upgrade from Free Tier

**Triggers to consider paid services:**
1. **Users > 500**: Consider paid hosting
2. **AI calls > 1500/day**: Upgrade Gemini or switch to Gemini Flash
3. **Database > 1GB**: Consider managed database
4. **Storage > 25GB**: Upgrade storage solution
5. **Email > 3000/month**: Upgrade email service
6. **Need SLA guarantees**: Enterprise hosting

**Scaling Philosophy:**
- Start with 100% free tools
- Validate product-market fit
- Generate revenue first
- Then reinvest in infrastructure

---

## 19. Quick Start Guide for Free Stack

### Step 1: Get Free API Keys (5 minutes)

```bash
# 1. Gemini API Key (REQUIRED)
# Visit: https://makersuite.google.com/app/apikey
# Save as: GOOGLE_API_KEY

# 2. Supabase Database (RECOMMENDED)
# Visit: https://supabase.com
# Create project, get DATABASE_URL with pgvector support

# 3. Generate JWT Secrets (REQUIRED)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Local Development Setup (10 minutes)

```bash
# Clone and install
git clone <your-repo>
cd mental-health-platform

# Install dependencies
cd client && npm install
cd ../server && npm install

# Install embedding model dependencies
npm install @xenova/transformers
# OR if using Python microservice:
# pip install sentence-transformers flask

# Setup databases with Docker (if not using Supabase)
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mental_health \
  -p 5432:5432 \
  pgvector/pgvector:pg15

docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Setup environment variables
cp server/.env.example server/.env
# Edit .env with your API keys

# Run migrations
cd server && npm run migrate

# Start development servers
npm run dev  # Backend on :5000
cd ../client && npm run dev  # Frontend on :5173
```

### Step 3: Deploy for Free (15 minutes)

#### Frontend (Vercel - FREE)
```bash
# 1. Push code to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Visit https://vercel.com
# 3. Import your GitHub repository
# 4. Set framework: Vite
# 5. Root directory: client
# 6. Deploy! (automatic SSL, CDN included)
```

#### Backend (Render - FREE)
```bash
# 1. Visit https://render.com
# 2. New > Web Service
# 3. Connect GitHub repository
# 4. Settings:
#    - Root directory: server
#    - Build: npm install
#    - Start: npm start
#    - Add environment variables
# 5. Deploy! (750 hours/month free)
```

#### Database (Supabase - FREE)
```bash
# Already set up in Step 1!
# Includes:
# - PostgreSQL with pgvector
# - Automatic backups
# - 500MB storage (free tier)
# - Connection pooling
```

### Step 4: Initialize Embedding System (5 minutes)

```bash
# Option A: Use @xenova/transformers in Node.js (RECOMMENDED)
cd server
npm install @xenova/transformers

# Create: server/src/utils/embeddings.js
```

```javascript
import { pipeline } from '@xenova/transformers';

let embedder = null;

export async function initEmbeddings() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding model loaded (384-dim)');
  }
  return embedder;
}

export async function generateEmbedding(text) {
  const model = await initEmbeddings();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```

```bash
# Option B: Python microservice (if performance needed)
cd server
mkdir embedding-service
cd embedding-service

# Create: app.py
```

```python
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify

app = Flask(__name__)
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/embed', methods=['POST'])
def embed():
    text = request.json.get('text', '')
    embedding = model.encode(text).tolist()
    return jsonify({'embedding': embedding})

if __name__ == '__main__':
    app.run(port=5001)
```

```bash
# Install and run
pip install sentence-transformers flask
python app.py  # Runs on :5001
```

### Step 5: Test Your Free Stack (2 minutes)

```bash
# Test embedding generation
curl http://localhost:5000/api/test/embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?"}'

# Should return: 384-dimensional vector

# Test Gemini API
curl http://localhost:5000/api/test/gemini \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a joke"}'

# Should return: AI-generated response
```

### Complete Free Stack Checklist

- [ ] ✅ Gemini API key (free tier)
- [ ] ✅ Supabase database (free tier)
- [ ] ✅ pgvector extension enabled
- [ ] ✅ Local embedding model (@xenova/transformers)
- [ ] ✅ Frontend deployed (Vercel free tier)
- [ ] ✅ Backend deployed (Render free tier)
- [ ] ✅ Redis (included in Render or self-hosted)
- [ ] ✅ Environment variables set
- [ ] ✅ Database migrations run
- [ ] ✅ Test embedding generation works
- [ ] ✅ Test Gemini AI responses work
- [ ] ✅ Test video calls (WebRTC)

**Total Cost: $0/month** 🎉

### Monitoring Your Free Tier Usage

```javascript
// Add usage tracking to avoid exceeding limits

// Gemini API (1500 requests/day)
let geminiRequestCount = 0;
const GEMINI_DAILY_LIMIT = 1500;

async function callGemini(prompt) {
  if (geminiRequestCount >= GEMINI_DAILY_LIMIT) {
    throw new Error('Daily Gemini limit reached. Try again tomorrow.');
  }
  geminiRequestCount++;
  // ... make API call
}

// Reset counter daily
setInterval(() => {
  geminiRequestCount = 0;
  console.log('✅ Gemini counter reset');
}, 24 * 60 * 60 * 1000);
```

### Scaling Beyond Free Tier

When you outgrow free tiers:

1. **Gemini > 1500 RPD**
   - Switch to Gemini Flash (faster, cheaper)
   - Enable response caching
   - Consider Ollama for local LLM

2. **Database > 500MB**
   - Upgrade Supabase to $25/month
   - Or self-host on $5/month VPS

3. **Render > 750 hours**
   - Upgrade to $7/month
   - Or use DigitalOcean $4/month droplet

4. **Need better performance**
   - Add Redis Pro ($7/month)
   - Enable database connection pooling
   - Add CDN (Cloudflare free tier is great!)

---

## Document Control

**Revision History**:

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-14 | Product Team | Initial complete specification |
| 2.0 | 2025-11-14 | Product Team | Updated to use free/open-source tools: local embeddings (all-MiniLM-L6-v2), PostgreSQL pgvector, free hosting options, cost breakdown added |

**Approval**:
- Product Manager: _______________
- Engineering Lead: _______________
- Design Lead: _______________
- Security Lead: _______________

---

**END OF DOCUMENT**

---

## Document Statistics

- **Total Pages**: ~65 pages
- **Total Words**: ~20,000 words
- **Total Sections**: 19 major sections
- **API Endpoints**: 60+ fully documented
- **Database Tables**: 15+ with complete schemas
- **State Objects**: 12+ fully defined
- **Estimated Implementation Time**: 6-9 months (team of 4-6 developers)

---

## Cost Summary

### Development Phase
- **Infrastructure**: $0/month (100% free tools)
- **Third-party APIs**: $0/month (free tiers)
- **Total**: **$0/month** 🎉

### Production Phase (up to 500 users)
- **Hosting**: $0/month (Vercel + Render free tiers)
- **Database**: $0/month (Supabase free tier)
- **AI API**: $0/month (Gemini free tier: 1500 RPD)
- **Storage**: $0/month (MinIO or Cloudinary free tier)
- **Email**: $0/month (Resend free tier: 3000/month)
- **Total**: **$0/month** 🎉

### Production Phase (1000-5000 users)
- **Hosting**: $10-20/month
- **Database**: $0-15/month
- **AI API**: $0-50/month
- **Other**: $10-20/month
- **Total**: **$20-105/month**

---

## Key Differentiators of This PRD

✅ **100% Free Stack** - Can be built and deployed for $0/month  
✅ **Local Embeddings** - No API costs for vector generation  
✅ **Complete State Management** - Every feature has detailed state structure  
✅ **Production-Ready Architecture** - Scales from 0 to 10,000+ users  
✅ **AI-First Design** - LangGraph + Gemini for intelligent responses  
✅ **Open Source Focused** - Uses PostgreSQL, Redis, MinIO, etc.  
✅ **Developer-Friendly** - Clear setup guide, free API keys  
✅ **Security Built-In** - HIPAA considerations, encryption, audit logs  
✅ **Real Implementation Ready** - Not just theory, actual working code examples

