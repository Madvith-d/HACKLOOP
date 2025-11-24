require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testDirect() {
    console.log('Testing Gemini SDK directly...');

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No API Key');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Try with 'models/' prefix which is sometimes required
        const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });

        console.log('Generating with models/gemini-pro...');
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log('✅ Response:', response.text());
    } catch (error) {
        console.error('❌ Direct SDK Error:', error);
    }
}

testDirect();
