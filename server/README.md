# MindMesh+ Backend Server

A full-featured backend API for the MindMesh+ mental health platform.

## Features

- **Authentication**: JWT-based user authentication with role-based access
- **Journal Management**: CRUD operations for journal entries with mood tracking
- **Habit Tracking**: Daily habit tracking with streaks and analytics
- **Emotion Tracking**: Record and analyze emotional patterns
- **Therapist Management**: Book and manage therapy sessions
- **WebRTC Signaling**: Real-time video consultation signaling
- **Comprehensive Logging**: Structured logging with Winston
- **Input Validation**: Request validation with express-validator
- **Error Handling**: Centralized error handling middleware
- **AI Chat Agent**: Empathetic chat system with emotional analysis using LangGraph and LangChain
- **Vector Embeddings**: Semantic search using local or Pinecone vector storage
- **Crisis Detection**: Automatic therapist alerts for critical situations
- **Personalized Recommendations**: Smart suggestions for journaling, habit building, or therapy

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** for data persistence
- **JWT** for authentication
- **Socket.io** for WebRTC signaling
- **Winston** for logging
- **express-validator** for input validation
- **LangChain** and **LangGraph** for AI agent orchestration
- **Vector Storage**: Local JSON files or Pinecone
- **Embeddings**: Sentence transformers with fallback implementation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (running locally or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Ensure PostgreSQL is running and update the database connection details in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000` (or the port specified in `PORT` env var).

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Journals
- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create a new journal entry
- `GET /api/journal/:id` - Get specific journal entry
- `PATCH /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create a new habit
- `PATCH /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/toggle` - Toggle habit completion
- `GET /api/habits/:id/stats` - Get habit statistics

### Emotions
- `GET /api/emotions/my-emotions` - Get user's emotions
- `POST /api/emotions` - Record a new emotion
- `POST /api/emotions/bulk` - Record multiple emotions
- `GET /api/emotions/analytics` - Get emotion analytics

### Chat (AI Agent)
- `POST /api/chat/message` - Send a chat message and get AI response
- `POST /api/chat/stream` - Stream chat processing with real-time updates
- `GET /api/chat/history` - Get chat message history
- `GET /api/chat/analysis/:chatId` - Get detailed analysis of a chat message
- `GET /api/chat/agent-info` - Get AI agent information

### Health Check
- `GET /health` - Server health status

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `journals` - Journal entries with mood tracking
- `habits` - Habit definitions and tracking
- `habit_completions` - Daily habit completions
- `emotions` - Emotion tracking entries
- `therapists` - Therapist profiles
- `bookings` - Therapy session bookings
- `sessions` - Video consultation sessions
- `chat_messages` - AI chat conversations with emotional analysis
- `therapist_alerts` - Crisis alerts and notifications
- `vector_metadata` - Embedding metadata and tracking

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mindmesh

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=info
```

## Project Structure

```
src/
├── ai/
│   ├── agent.js         # Main empathetic chat agent
│   ├── nodes.js         # Individual agent processing nodes
│   ├── state.js         # Agent state management
│   └── recommendations.js # Recommendation engine
├── middleware/
│   ├── auth.js          # JWT authentication middleware
│   ├── validate.js      # Input validation middleware
│   └── errorHandler.js  # Centralized error handling
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── chat.js          # AI chat endpoints
│   ├── journal.js       # Journal management
│   ├── habits.js        # Habit tracking
│   ├── emotions.js      # Emotion tracking
│   └── ...             # Other feature routes
├── utils/
│   ├── logger.js        # Winston logger configuration
│   ├── embeddings.js    # Embedding generation service
│   ├── vectorStore.js   # Vector storage (local/Pinecone)
│   └── therapistNotification.js # Alert management
├── db.js               # PostgreSQL connection and schema
└── server.js           # Main server entry point
```

## Development

The server includes:
- Structured logging with Winston
- Request validation with express-validator
- Centralized error handling
- JWT-based authentication
- WebRTC signaling for video calls
- Advanced AI chat agent with emotional intelligence
- Vector embedding generation and semantic search
- Automatic crisis detection and therapist alerts
- Streaming chat responses for real-time interaction

## AI Agent Features

### Emotional Analysis
The agent analyzes messages for:
- Emotion scores (sadness, anxiety, anger, fear, joy, hopelessness)
- Sentiment analysis
- Crisis indicators
- Emotional keywords

### Smart Recommendations
Based on emotional state, the agent recommends:
- **Journaling** - For processing emotions
- **Habit Building** - For stress management and coping
- **Therapy Sessions** - For professional support
- **Crisis Support** - For immediate intervention

### Context Awareness
The agent leverages:
- User's journal history
- Active habits and streaks
- Recent emotional patterns
- Semantic similarity to past entries
- Therapy session data

### Vector Embeddings
- Semantic search through user's history
- Find similar emotional patterns
- Store locally or in Pinecone
- Enable intelligent context retrieval

For detailed AI documentation, see [AI_AGENT_DOCUMENTATION.md](./AI_AGENT_DOCUMENTATION.md)

## Contributing

1. Follow the existing code style and patterns
2. Add appropriate validation for new endpoints
3. Include error handling for all async operations
4. Add logging for important operations
5. Test your changes thoroughly

## License

MIT