require('dotenv').config();
const fetch = require('node-fetch');

async function testRestApi() {
    console.log('Testing Gemini via REST API...');

    // Check both possible env vars
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No API Key found (checked GOOGLE_GEMINI_API_KEY and GEMINI_API_KEY)');
        return;
    }
    console.log('API Key found.');

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-pro'];

    for (const model of models) {
        console.log(`\n--- Testing ${model} ---`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello" }] }]
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`✅ SUCCESS with ${model}!`);
                console.log('Response:', JSON.stringify(data, null, 2));
                return; // Stop after first success
            } else {
                console.error(`❌ FAILED with ${model}: ${response.status} ${response.statusText}`);
                if (data.error) {
                    console.error('Error:', data.error.message);
                }
            }
        } catch (error) {
            console.error('❌ Network Error:', error.message);
        }
    }
}

testRestApi();
