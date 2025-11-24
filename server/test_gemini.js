require('dotenv').config();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

async function testGemini() {
    console.log('Testing Gemini API configuration...');

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GOOGLE_GEMINI_API_KEY is missing in .env');
        return;
    }
}

testGemini();
