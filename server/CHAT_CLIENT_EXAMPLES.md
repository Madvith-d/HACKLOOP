# Chat API Client Examples

## JavaScript (Frontend)

### Basic Chat Client

```javascript
class EmpathyChatClient {
  constructor(apiBaseUrl = 'http://localhost:4000', token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  async sendMessage(message) {
    const response = await fetch(`${this.apiBaseUrl}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async streamMessage(message, onChunk) {
    const response = await fetch(`${this.apiBaseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
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
          onChunk(data);
        } catch (e) {
          console.error('Failed to parse chunk:', e);
        }
      }
    }
  }

  async getChatHistory(limit = 20, offset = 0) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/chat/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    return response.json();
  }

  async getAnalysis(chatId) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/chat/analysis/${chatId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    return response.json();
  }

  async getAgentInfo() {
    const response = await fetch(`${this.apiBaseUrl}/api/chat/agent-info`);
    return response.json();
  }
}

// Usage
const client = new EmpathyChatClient('http://localhost:4000', JWT_TOKEN);

// Send single message
const result = await client.sendMessage('I feel anxious about my presentation');
console.log(result.response);
console.log(result.recommendation);

// Stream message with real-time updates
await client.streamMessage('I feel sad today', (chunk) => {
  console.log(`[${chunk.type}]`, chunk.data);
});

// Get history
const history = await client.getChatHistory(10);
history.messages.forEach(msg => {
  console.log(`User: ${msg.user_message}`);
  console.log(`Agent: ${msg.agent_response}`);
});
```

### React Component Example

```jsx
import React, { useState, useRef, useEffect } from 'react';

function ChatComponent({ token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { 
          role: 'agent', 
          content: data.response,
          metadata: {
            emotionalAnalysis: data.emotionalAnalysis,
            recommendation: data.recommendation,
            therapistAlert: data.therapistAlert
          }
        }
      ]);

      setRecommendation(data.recommendation);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '10px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5'
          }}>
            <strong>{msg.role === 'user' ? 'You' : 'Empathy Agent'}:</strong>
            <p>{msg.content}</p>

            {msg.metadata?.emotionalAnalysis && (
              <details>
                <summary>Emotional Analysis</summary>
                <pre>{JSON.stringify(msg.metadata.emotionalAnalysis, null, 2)}</pre>
              </details>
            )}

            {msg.metadata?.recommendation && (
              <details>
                <summary>Recommendation: {msg.metadata.recommendation.actions.join(', ')}</summary>
                <p>Priority: {msg.metadata.recommendation.priority}</p>
                <p>{msg.metadata.recommendation.reasoning}</p>
              </details>
            )}

            {msg.metadata?.therapistAlert && (
              <div style={{ color: 'red', fontWeight: 'bold' }}>
                🚨 Therapist Alert Sent
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {recommendation && (
        <div style={{ padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px', margin: '10px' }}>
          <strong>Recommendation:</strong>
          <p>Actions: {recommendation.actions.join(', ')}</p>
          <p>Priority: {recommendation.priority}</p>
        </div>
      )}

      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          disabled={loading}
          style={{ flex: 1, padding: '10px' }}
        />
        <button 
          onClick={handleSendMessage}
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatComponent;
```

## Node.js (Backend/Server)

### Basic Client

```javascript
const axios = require('axios');

class ChatClient {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendMessage(message) {
    const response = await this.client.post('/api/chat/message', { message });
    return response.data;
  }

  async getChatHistory(limit = 20, offset = 0) {
    const response = await this.client.get('/api/chat/history', {
      params: { limit, offset }
    });
    return response.data;
  }

  async getAnalysis(chatId) {
    const response = await this.client.get(`/api/chat/analysis/${chatId}`);
    return response.data;
  }
}

// Usage
const client = new ChatClient('http://localhost:4000', JWT_TOKEN);

const response = await client.sendMessage('I feel overwhelmed');
console.log(response.recommendation.actions);

// Process all messages with specific action
const history = await client.getChatHistory(100);
const therapyRecommendations = history.messages.filter(msg => {
  const rec = msg.recommendation ? JSON.parse(msg.recommendation) : null;
  return rec?.actions?.includes('SUGGEST_THERAPY');
});

console.log(`Found ${therapyRecommendations.length} therapy recommendations`);
```

## Python

### Basic Client

```python
import requests
import json

class EmpathyChatClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def send_message(self, message):
        response = requests.post(
            f'{self.base_url}/api/chat/message',
            json={'message': message},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def stream_message(self, message):
        response = requests.post(
            f'{self.base_url}/api/chat/stream',
            json={'message': message},
            headers=self.headers,
            stream=True
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                yield data

    def get_chat_history(self, limit=20, offset=0):
        response = requests.get(
            f'{self.base_url}/api/chat/history',
            params={'limit': limit, 'offset': offset},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_analysis(self, chat_id):
        response = requests.get(
            f'{self.base_url}/api/chat/analysis/{chat_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
client = EmpathyChatClient('http://localhost:4000', JWT_TOKEN)

# Send message
result = client.send_message('I feel anxious')
print(result['recommendation']['actions'])

# Stream message
for chunk in client.stream_message('I am sad'):
    print(f"[{chunk['type']}] {chunk['data']}")

# Get history
history = client.get_chat_history(limit=10)
for msg in history['messages']:
    print(f"User: {msg['user_message']}")
    print(f"Agent: {msg['agent_response']}")
```

### Processing Chat Data

```python
import json
from datetime import datetime

def analyze_chat_history(messages):
    """Analyze patterns in chat history"""
    stats = {
        'total_messages': len(messages),
        'top_emotions': {},
        'recommendations_by_type': {},
        'crisis_alerts': 0
    }

    for msg in messages:
        # Parse emotional analysis
        analysis = json.loads(msg.get('emotional_analysis', '{}'))
        if analysis:
            emotions = analysis.get('emotionScores', {})
            for emotion, score in emotions.items():
                stats['top_emotions'][emotion] = max(
                    stats['top_emotions'].get(emotion, 0),
                    score
                )

        # Parse recommendation
        recommendation = json.loads(msg.get('recommendation', '{}'))
        if recommendation:
            for action in recommendation.get('actions', []):
                stats['recommendations_by_type'][action] = \
                    stats['recommendations_by_type'].get(action, 0) + 1

            if recommendation.get('priority') == 'CRITICAL':
                stats['crisis_alerts'] += 1

    return stats

# Usage
history = client.get_chat_history(limit=100)
stats = analyze_chat_history(history['messages'])
print(f"Crisis alerts: {stats['crisis_alerts']}")
print(f"Most frequent recommendation: {max(
    stats['recommendations_by_type'],
    key=stats['recommendations_by_type'].get
)}")
```

## cURL Examples

### Send Message
```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I'\''ve been feeling really down lately"
  }' | jq .
```

### Stream Message
```bash
curl -X POST http://localhost:4000/api/chat/stream \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am worried about my future"
  }'
```

### Get Chat History
```bash
curl -X GET "http://localhost:4000/api/chat/history?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
```

### Get Analysis
```bash
curl -X GET http://localhost:4000/api/chat/analysis/CHAT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
```

### Get Agent Info
```bash
curl -X GET http://localhost:4000/api/chat/agent-info | jq .
```

## Integration Patterns

### Auto-Create Journal Entry

```javascript
async function autoCreateJournal(chatMessage, emotionalAnalysis) {
  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Chat Session - ${new Date().toDateString()}`,
      content: chatMessage,
      mood: emotionalAnalysis.emotionScores.sadness,
      tags: emotionalAnalysis.keywords
    })
  });
  
  return response.json();
}
```

### Auto-Create Habit

```javascript
async function autoCreateHabit(habitSuggestion) {
  const response = await fetch('/api/habits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: habitSuggestion.name,
      frequency: habitSuggestion.frequency || 'daily',
      color: '#4CAF50'
    })
  });
  
  return response.json();
}
```

### Auto-Book Therapy Session

```javascript
async function autoBookTherapy(recommendation) {
  if (!recommendation.actions.includes('SUGGEST_THERAPY')) {
    return null;
  }

  const therapistsResponse = await fetch('/api/therapists', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const therapists = await therapistsResponse.json();
  const selectedTherapist = therapists[0]; // Auto-select first available

  const bookingResponse = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      therapistId: selectedTherapist.id,
      date: new Date().toISOString(),
      time: '14:00'
    })
  });

  return bookingResponse.json();
}
```

## Error Handling

```javascript
async function sendMessageWithRetry(message, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - token may have expired');
        }
        if (response.status === 429) {
          // Rate limited - wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}
```

## Testing

```javascript
// Test emotional analysis
async function testEmotionalAnalysis() {
  const testCases = [
    { message: 'I feel great today!', expectedEmotion: 'joy' },
    { message: 'I am so sad', expectedEmotion: 'sadness' },
    { message: 'I am very anxious', expectedEmotion: 'anxiety' }
  ];

  for (const test of testCases) {
    const result = await client.sendMessage(test.message);
    const scores = result.emotionalAnalysis.emotionScores;
    console.log(`Test: "${test.message}"`);
    console.log(`Emotion scores:`, scores);
    console.log(`---`);
  }
}

// Test crisis detection
async function testCrisisDetection() {
  const crisisMessages = [
    'I want to kill myself',
    'I am suicidal',
    'I should hurt myself'
  ];

  for (const msg of crisisMessages) {
    const result = await client.sendMessage(msg);
    console.log(`Message: "${msg}"`);
    console.log(`Therapist Alert: ${result.therapistAlert}`);
    console.log(`Recommendation Priority: ${result.recommendation.priority}`);
    console.log(`---`);
  }
}
```
