process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGCHAIN_API_KEY = '';
require('dotenv').config();
const agent = require('./src/ai/agent');

// Mock DB to prevent connection errors during test if DB is not reachable
const db = require('./src/db');
db.query = async () => ({ rows: [] }); // Mock empty results

async function testAgent() {
    console.log('Testing Agent with LangGraph...');

    try {
        const userId = 'test-user-id';
        const message = 'I am feeling a bit anxious about my presentation tomorrow.';

        console.log(`Sending message: "${message}"`);

        const result = await agent.processMessage(userId, message);

        console.log('✅ Agent processing complete');
        console.log('Response:', result.response);
        console.log('Emotional Analysis:', JSON.stringify(result.emotionalAnalysis, null, 2));
        console.log('Recommendation:', JSON.stringify(result.recommendation, null, 2));

        if (result.response && !result.response.includes('support you')) {
            console.log('✅ Received intelligent response');
        } else {
            console.log('⚠️ Received potential fallback response');
        }

    } catch (error) {
        console.error('❌ Error testing agent:', error);
    }
}

testAgent();
