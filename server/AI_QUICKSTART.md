# AI Agent Quick Start Guide

## Installation

### 1. Install Dependencies
```bash
cd server
npm install
```

This installs all required packages including:
- `@langchain/core` - Core LangChain utilities
- `@langchain/langgraph` - Graph-based agent orchestration
- `@langchain/community` - Community integrations
- `@pinecone-database/pinecone` - Optional Pinecone integration

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set these AI-specific variables:

```bash
# Vector Storage (default: local)
USE_LOCAL_VECTORS=true

# Optional: Pinecone Cloud
# PINECONE_API_KEY=your-api-key
# PINECONE_ENVIRONMENT=us-west1-gcp
# PINECONE_INDEX=mindmesh
```

### 3. Start the Server

```bash
npm run dev
```

## Basic Usage

### Send a Chat Message

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I'\''ve been feeling really depressed lately"}'
```

Response:
```json
{
  "success": true,
  "chatId": "uuid-123",
  "response": "I can see you're dealing with some heavy emotions...",
  "recommendation": {
    "actions": ["SUGGEST_JOURNAL"],
    "priority": "medium",
    "reasoning": "User shows signs of sadness..."
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
    "keywords": ["depressed", "feeling", "lately"]
  },
  "therapistAlert": false
}
```

### Stream Chat Response

```bash
curl -X POST http://localhost:4000/api/chat/stream \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel anxious about my upcoming presentation"}'
```

Response (NDJSON - one JSON object per line):
```
{"type":"thinking","data":"Analyzing your message..."}
{"type":"analysis","data":{"emotionScores":{...}}}
{"type":"context","data":{"journalEntries":[...]}}
{"type":"recommendation","data":{"actions":["SUGGEST_HABIT"]}}
{"type":"response","data":"I suggest starting a meditation habit..."}
```

### Get Chat History

```bash
curl -X GET "http://localhost:4000/api/chat/history?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Specific Analysis

```bash
curl -X GET http://localhost:4000/api/chat/analysis/CHAT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Agent Information

```bash
curl -X GET http://localhost:4000/api/chat/agent-info
```

## Understanding Responses

### Emotion Scores
- Range: 0 to 1
- Higher values indicate stronger emotions
- Scores > 0.6 are significant
- Scores > 0.85 indicate extreme distress

### Recommendations

#### SUGGEST_JOURNAL
- When: User is sad or confused
- Action: Encourage journaling with a prompt
- Best for: Processing complex emotions

#### SUGGEST_HABIT
- When: User shows anxiety or stress
- Action: Suggest a coping habit
- Best for: Building positive routines

#### SUGGEST_THERAPY
- When: Moderate to severe distress
- Priority: MEDIUM or HIGH
- Action: Recommend therapist session

#### ALERT_THERAPIST
- When: Crisis indicators detected
- Priority: CRITICAL
- Action: Immediate notification sent

### Priority Levels
- `LOW` - General support
- `MEDIUM` - Consider professional help
- `HIGH` - Professional help recommended
- `CRITICAL` - Crisis situation

## Vector Embeddings

### How They Work
1. Each message is converted to a 384-dimensional vector
2. Vectors are stored with metadata (timestamp, type, emotions)
3. Similar messages can be found using cosine similarity
4. Context is retrieved from similar past entries

### Local Storage
- Stored in `./data/vectors/` directory
- One JSON file per user
- Persists between restarts
- Good for development and testing

### Pinecone Cloud
- Set `USE_LOCAL_VECTORS=false` in .env
- Add Pinecone credentials
- Scales to millions of vectors
- Better for production

## Crisis Detection

The system automatically detects and alerts on:
- Suicidal ideation ("suicide", "kill myself", "end my life")
- Self-harm ("self harm", "cut myself")
- Extreme emotional distress (sadness > 0.85 + hopelessness > 0.75)

When detected:
1. Therapist is immediately notified
2. Alert severity set to CRITICAL
3. Response urges user to seek help
4. Crisis resources are provided

## Integration Examples

### With Journal
```javascript
// After receiving journal suggestion
const journalResponse = await fetch('/api/journal', {
  method: 'POST',
  body: JSON.stringify({
    title: 'From Chat Session',
    content: userMessage,
    mood: emotionalAnalysis.emotionScores.sadness
  })
});
```

### With Habits
```javascript
// After receiving habit suggestion
const habitResponse = await fetch('/api/habits', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Morning Meditation',
    frequency: 'daily',
    color: '#4CAF50'
  })
});
```

### With Therapy Booking
```javascript
// After receiving therapy suggestion
const bookingResponse = await fetch('/api/therapists', {
  method: 'GET',
  query: { specialty: 'Anxiety & Stress Management' }
});
```

## Troubleshooting

### No Response
- Check JWT token is valid
- Check user exists in database
- Review server logs: `tail -f logs/combined.log`

### Empty Recommendations
- Message might be too neutral
- Check emotion score thresholds
- Enable debug logging: `LOG_LEVEL=debug`

### Slow Responses
- First request initializes embeddings (slower)
- Subsequent requests are faster
- Check database connectivity
- Monitor vector store size

### Vector Store Issues
- Local: Check `./data/vectors/` permissions
- Pinecone: Check API key and network connectivity
- Switch between stores by updating `USE_LOCAL_VECTORS`

## Performance Tips

1. **Batch Messages** - Process multiple user messages together
2. **Use Streaming** - For long operations, use streaming endpoint
3. **Cache Context** - Agent caches user history per request
4. **Monitor Vectors** - Keep vector count in check with cleanup jobs

## Next Steps

1. **Frontend Integration** - Use chat endpoints in your UI
2. **Custom Recommendations** - Modify recommendation engine for your needs
3. **Advanced Analytics** - Build dashboards from chat history
4. **Real-time Alerts** - Integrate WebSocket for therapist notifications
5. **Fine-tuning** - Customize emotion detection keywords

## API Examples

### Node.js Client

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
});

// Send message
const response = await client.post('/api/chat/message', {
  message: 'I am feeling overwhelmed with work'
});

console.log(response.data.recommendation.actions);
```

### Python Client

```python
import requests
import json

headers = {'Authorization': f'Bearer {JWT_TOKEN}'}

response = requests.post(
  'http://localhost:4000/api/chat/message',
  json={'message': 'I feel anxious about my future'},
  headers=headers
)

data = response.json()
print(data['emotionalAnalysis']['emotionScores'])
```

### JavaScript (Frontend)

```javascript
async function sendMessage(message, token) {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  return response.json();
}

// Usage
const result = await sendMessage('I am sad', token);
console.log(result.response);
```

## For More Information

- See [AI_AGENT_DOCUMENTATION.md](./AI_AGENT_DOCUMENTATION.md) for complete API documentation
- See [README.md](./README.md) for server setup
- Check logs in `logs/` directory for debugging
