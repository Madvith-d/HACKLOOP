// No dotenv, no env vars
const gemini = require('./src/utils/gemini');

// Mock Gemini Service
gemini.analyzeEmotion = async () => ({
    emotionScores: { anxiety: 0.8 },
    sentiment: -0.5,
    keywords: ['anxious', 'presentation']
});
gemini.generateResponse = async () => "This is a mocked intelligent response from LangGraph agent.";

const agent = require('./src/ai/agent');
const db = require('./src/db');
db.query = async () => ({ rows: [] });

async function testAgent() {
    console.log('Testing Agent with LangGraph (Clean Mock)...');

    try {
        const userId = 'test-user-id';
        const message = 'I am feeling a bit anxious about my presentation tomorrow.';

        console.log(`Sending message: "${message}"`);

        const result = await agent.processMessage(userId, message);

        console.log('✅ Agent processing complete');
        console.log('Response:', result.response);

        if (result.response === "This is a mocked intelligent response from LangGraph agent.") {
            console.log('✅ Graph logic verified: Response passed through graph');
        } else {
            console.log('❌ Graph logic failed: Unexpected response');
        }

    } catch (error) {
        console.error('❌ Error testing agent:', error);
    }
}

testAgent();
