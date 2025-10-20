# MindMesh+ Backend Server

A production-ready Express.js backend for the MindMesh+ mental health and wellness platform.

## 🚀 Features

- **Firebase Authentication** - Secure user authentication and authorization
- **MongoDB Database** - Scalable document storage for user data
- **Pinecone Vector DB** - Semantic memory and search capabilities
- **RAG (Retrieval-Augmented Generation)** - AI-powered conversation with memory
- **WebRTC Signaling** - Real-time video calling support
- **Comprehensive APIs** - Complete REST API for all platform features
- **Security** - Rate limiting, validation, audit logging, and safety flags

## 🏗️ Architecture

```
Node.js Backend (Port 4000)
├── MongoDB (canonical data: users, conversations, wellness scores)
├── Pinecone (vector memory for semantic search)
├── Redis + BullMQ (background job queue)
├── Firebase Admin (authentication)
└── External Services (HTTP calls):
    ├── LangGraph Service (Python - Port 5000)
    ├── CV Service (Python - Port 5001)
    └── Local Embedding Model (Port 5002)
```

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Pinecone account
- Firebase project

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
cd server
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. **Start external services:**
- MongoDB: `mongod` (or use MongoDB Atlas)
- Redis: `redis-server` (or use Redis cloud)

4. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/mindmesh
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# External Services
LANGGRAPH_URL=http://localhost:5000
EMBEDDING_SERVICE_URL=http://localhost:5002
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Onboarding
- `POST /api/onboarding/complete` - Complete user onboarding
- `GET /api/onboarding/status` - Check onboarding status

### Conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations` - List user conversations
- `GET /api/conversations/:id` - Get conversation details

### Messages (Core RAG Flow)
- `POST /api/messages` - Send message and get AI response
- `GET /api/messages/:conversationId` - Get conversation messages

### Wellness
- `GET /api/wellness/:userId` - Get wellness history
- `GET /api/wellness/:userId/trends` - Get wellness trends
- `GET /api/wellness/:userId/dashboard` - Get wellness dashboard

### Journals
- `POST /api/journals` - Create journal entry
- `GET /api/journals` - List journal entries
- `GET /api/journals/:id` - Get specific journal

### Habits
- `POST /api/habits` - Create habit
- `GET /api/habits` - List habits
- `POST /api/habits/:id/progress` - Log habit progress

## 🧠 Core RAG Flow

The message processing system implements a sophisticated RAG (Retrieval-Augmented Generation) pipeline:

1. **Receive Message** - User sends text + CV metrics
2. **Store & Embed** - Save to MongoDB, create embeddings
3. **Vector Search** - Find relevant memories in Pinecone
4. **Context Building** - Combine recent messages + semantic context
5. **AI Processing** - Send to LangGraph for response generation
6. **Wellness Scoring** - Calculate wellness score based on multiple factors
7. **Action Handling** - Suggest journaling, habits, or therapist booking
8. **Safety Monitoring** - Check for safety flags and crisis indicators

## 🔒 Security Features

- **Authentication** - Firebase JWT tokens
- **Authorization** - Role-based access control
- **Rate Limiting** - Per-endpoint rate limits
- **Input Validation** - Joi schema validation
- **Audit Logging** - Track sensitive data access
- **Safety Flags** - Automatic crisis detection
- **Data Privacy** - Consent-based data sharing

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Health check
curl http://localhost:4000/healthz
```

## 📊 Monitoring

- **Health Check**: `GET /healthz`
- **Logs**: Winston logging with multiple transports
- **Metrics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error handling

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t mindmesh-backend .
docker run -p 4000:4000 mindmesh-backend
```

## 🔗 External Services

The backend integrates with external Python services:

1. **LangGraph Service** (Port 5000) - AI agent orchestration
2. **CV Service** (Port 5001) - Computer vision processing
3. **Embedding Service** (Port 5002) - Text-to-vector conversion

## 📝 API Documentation

Visit `http://localhost:4000/api` for API overview and endpoint information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the health check endpoint

---

**Built with ❤️ for mental health and wellness**
