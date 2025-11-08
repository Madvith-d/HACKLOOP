# Empathetic Chat Agent - AI System Documentation

## Overview

The Empathetic Chat Agent is an advanced AI system built with LangGraph and LangChain that provides personalized mental health support. It analyzes user messages, understands emotional states, retrieves contextual information, and makes intelligent recommendations for journaling, habit building, or professional therapy.

## Architecture

### Core Components

1. **Agent** (`src/ai/agent.js`)
   - Main orchestration layer
   - Coordinates all AI nodes
   - Manages message processing pipeline

2. **Nodes** (`src/ai/nodes.js`)
   - Individual processing steps
   - Emotion analysis
   - Context retrieval
   - Embedding generation
   - Recommendation generation
   - Therapist alerts
   - Response generation

3. **State** (`src/ai/state.js`)
   - Message state management
   - Carries data through the pipeline

4. **Recommendation Engine** (`src/ai/recommendations.js`)
   - Analyzes emotional patterns
   - Suggests appropriate actions
   - Detects crisis indicators

5. **Embeddings Service** (`src/utils/embeddings.js`)
   - Generates semantic embeddings
   - Local model support (fallback)

6. **Vector Store** (`src/utils/vectorStore.js`)
   - Local vector storage (default)
   - Pinecone integration (optional)
   - Semantic search capabilities

7. **Therapist Notification** (`src/utils/therapistNotification.js`)
   - Creates and manages alerts
   - Crisis detection and escalation

## Processing Pipeline

```
User Message
    ↓
[1] Analyze Emotion
    ├─ Extract emotional keywords
    ├─ Calculate emotion scores
    └─ Detect sentiment
    ↓
[2] Retrieve Context
    ├─ Query user history
    ├─ Find similar past entries
    └─ Compile user profile
    ↓
[3] Generate Embeddings
    ├─ Create vector representation
    ├─ Store in vector database
    └─ Enable semantic search
    ↓
[4] Generate Recommendation
    ├─ Analyze emotional state
    ├─ Match to actions
    └─ Determine priority
    ↓
[5] Therapist Alert (if needed)
    ├─ Check for crisis indicators
    ├─ Notify therapist
    └─ Create alert record
    ↓
[6] Generate Response
    ├─ Craft empathetic reply
    ├─ Include recommendations
    └─ Provide support
    ↓
Response to User
```

## API Endpoints

### Chat Endpoints

#### 1. Send Chat Message
```
POST /api/chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "I've been feeling really down lately..."
}

Response:
{
  "success": true,
  "chatId": "uuid",
  "response": "I can see you're dealing with some heavy emotions...",
  "recommendation": {
    "actions": ["SUGGEST_JOURNAL"],
    "priority": "medium",
    "reasoning": "User shows signs of sadness, journaling could help..."
  },
  "emotionalAnalysis": {
    "emotionScores": {
      "sadness": 0.75,
      "anxiety": 0.4,
      "anger": 0.1,
      "fear": 0.2,
      "joy": 0.0,
      "hopelessness": 0.5
    },
    "sentiment": -0.6,
    "keywords": ["feeling", "down", "lately"]
  },
  "therapistAlert": false
}
```

#### 2. Stream Chat Message
```
POST /api/chat/stream
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "I've been feeling really down lately..."
}

Response (NDJSON format):
{"type":"thinking","data":"Analyzing your message..."}
{"type":"analysis","data":{...}}
{"type":"context","data":{...}}
{"type":"recommendation","data":{...}}
{"type":"response","data":"I can see you're dealing..."}
```

#### 3. Get Chat History
```
GET /api/chat/history?limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "messages": [
    {
      "id": "uuid",
      "user_message": "I've been feeling really down...",
      "agent_response": "I can see you're dealing...",
      "emotional_analysis": {...},
      "recommendation": {...},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 20
}
```

#### 4. Get Chat Analysis
```
GET /api/chat/analysis/{chatId}
Authorization: Bearer {token}

Response:
{
  "chat": {
    "id": "uuid",
    "user_message": "...",
    "agent_response": "...",
    "emotional_analysis": {...},
    "recommendation": {...},
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 5. Get Agent Info
```
GET /api/chat/agent-info

Response:
{
  "name": "Empathetic Chat Agent",
  "version": "1.0.0",
  "description": "An AI agent that listens to users...",
  "capabilities": [
    "Emotional analysis",
    "Context retrieval from user history",
    "Vector embeddings for semantic search",
    "Personalized recommendations",
    "Therapist alerts for crisis situations"
  ],
  "supportedActions": [
    "SUGGEST_JOURNAL",
    "SUGGEST_HABIT",
    "SUGGEST_THERAPY",
    "ALERT_THERAPIST"
  ]
}
```

## Emotional Analysis

The agent analyzes emotions across multiple dimensions:

### Emotion Scores
- **Sadness**: Depression, unhappiness, grief
- **Anxiety**: Worry, nervousness, stress
- **Anger**: Frustration, irritation, rage
- **Fear**: Worry about future, panic
- **Joy**: Happiness, positivity
- **Hopelessness**: Helplessness, despair

### Sentiment Analysis
- Ranges from -1 (very negative) to +1 (very positive)
- Combines positive and negative word counts

### Crisis Detection
Triggers for immediate therapist alert:
- Suicidal ideation keywords
- Self-harm expressions
- Crisis language
- Extreme emotional states (sadness > 0.85, hopelessness > 0.75)

## Recommendations

### Action Types

1. **SUGGEST_JOURNAL**
   - Recommended when: User shows sadness or confusion
   - Includes: Journaling prompt
   - Intent: Help process emotions through writing

2. **SUGGEST_HABIT**
   - Recommended when: User shows anxiety or stress
   - Includes: Habit suggestion (meditation, exercise, etc.)
   - Intent: Build positive coping mechanisms

3. **SUGGEST_THERAPY**
   - Recommended when: Moderate to severe emotional distress
   - Includes: Therapist availability
   - Intent: Professional therapeutic support

4. **ALERT_THERAPIST**
   - Triggered when: Crisis indicators detected
   - Action: Immediate notification to assigned therapist
   - Intent: Emergency support and intervention

### Priority Levels
- **LOW**: General support, informational
- **MEDIUM**: Moderate emotional distress, prevention focus
- **HIGH**: Significant distress, therapy recommended
- **CRITICAL**: Crisis situation, immediate intervention needed

## Vector Embeddings

### Storage Options

#### Local Storage (Default)
- Stores vectors in JSON files
- Location: `./data/vectors/`
- File format: `{userId}.json`
- Best for: Development, small-scale deployments

#### Pinecone (Cloud)
- Managed vector database
- Configuration via environment variables
- Supports filtering by userId
- Best for: Production, large-scale deployments

### Semantic Search
The system uses cosine similarity to find similar past entries:
```
1. Generate embedding for current message
2. Search for similar embeddings in user's history
3. Return top 5 most similar entries
4. Use for context and pattern recognition
```

## Context Retrieval

The agent retrieves multiple types of context:

1. **Journal Entries** - Last 5 entries
2. **Active Habits** - Current unarchived habits
3. **Recent Emotions** - Last 10 emotion records
4. **Similar Past Entries** - Semantically similar messages
5. **Therapy Sessions** - Recent session data

## Integration with Existing Features

### Journal Management
- Automatically suggest journaling prompts
- Link recommendations to journal creation
- Track writing patterns over time

### Habit Tracking
- Suggest specific habits based on emotional state
- Track habit adherence for mental health correlation
- Provide motivation and encouragement

### Therapist Booking
- Facilitate therapy session booking
- Include therapist recommendations
- Track session outcomes

### Emotion Tracking
- Store emotion data from each message
- Build emotional pattern analysis
- Generate insights and trends

## Database Schema

### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  agent_response TEXT,
  emotional_analysis JSONB,
  recommendation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### therapist_alerts
```sql
CREATE TABLE therapist_alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### vector_metadata
```sql
CREATE TABLE vector_metadata (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT,
  source_id UUID,
  embedding_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration

### Environment Variables

```bash
# Vector Store Configuration
USE_LOCAL_VECTORS=true              # Use local storage (false for Pinecone)
PINECONE_API_KEY=...                # Pinecone API key
PINECONE_ENVIRONMENT=...            # Pinecone environment
PINECONE_INDEX=mindmesh             # Pinecone index name

# LLM Configuration (for future enhancements)
ANTHROPIC_API_KEY=...               # Anthropic API key
LANGCHAIN_TRACING_V2=true          # Enable LangChain tracing
LANGCHAIN_API_KEY=...              # LangChain API key
```

## Error Handling

The system includes comprehensive error handling:

1. **Embedding Generation Errors**
   - Falls back to hash-based embedding method
   - Logged but doesn't block message processing

2. **Vector Store Errors**
   - Gracefully degrades to fallback implementation
   - Alerts are still processed

3. **Database Errors**
   - Logged and returned to client
   - Doesn't halt agent processing

4. **Crisis Detection Errors**
   - Errs on side of caution
   - Always alerts if uncertain

## Performance Considerations

### Optimization Tips

1. **Batch Processing**
   - Process multiple messages asynchronously
   - Use streaming for long operations

2. **Vector Store Selection**
   - Use local store for < 10K vectors per user
   - Switch to Pinecone for larger deployments

3. **Caching**
   - Cache recent user context
   - Reduce database queries

4. **Async Operations**
   - Process embeddings asynchronously
   - Don't block on therapist alerts

## Security Considerations

1. **User Privacy**
   - Encrypt sensitive data in vectors
   - Limit data retention policies

2. **Access Control**
   - Verify user authentication on all endpoints
   - Therapists can only see assigned users' alerts

3. **Crisis Response**
   - Always verify identity before sending alerts
   - Log all crisis-related activities

## Future Enhancements

1. **Real-time LLM Integration**
   - Use Claude or GPT-4 for richer responses
   - Fine-tuned models for mental health domain

2. **Multi-modal Analysis**
   - Analyze voice tone and sentiment
   - Incorporate facial expression analysis

3. **Predictive Analytics**
   - Predict mental health trends
   - Proactive intervention recommendations

4. **Peer Support Integration**
   - Connect users with similar experiences
   - Community support features

5. **Advanced Metrics**
   - Mental health score tracking
   - Progress visualization
   - Treatment effectiveness analysis

## Troubleshooting

### No Recommendations Generated
- Check if emotional analysis is working
- Verify emotion keyword extraction
- Check logging for errors

### Slow Vector Search
- Reduce top-K value
- Check vector store size
- Consider local to Pinecone migration

### Missing Context
- Verify database connectivity
- Check user history existence
- Review query logs

### Crisis Alerts Not Sending
- Verify therapist assignment
- Check notification service configuration
- Review alert severity settings

## Support

For issues or questions:
1. Check logs in `logs/error.log`
2. Enable DEBUG logging: `LOG_LEVEL=debug`
3. Review agent analysis in chat history
4. Contact development team
