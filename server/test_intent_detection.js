const agent = require('./src/ai/agent');
const logger = require('./src/utils/logger');

// Mock environment variables if needed
process.env.GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "dummy_key";

async function runTest() {
    console.log('--- Testing Intent Detection ---\n');

    const userId = 'test-user-intent-' + Date.now();

    // Test 1: Journal intent
    console.log('=== Test 1: Journal Intent ===');
    const msg1 = "How do I journal here?";
    console.log(`User: ${msg1}`);
    const res1 = await agent.processMessage(userId, msg1);
    console.log(`Response: ${res1.response}`);
    console.log(`Action:`, JSON.stringify(res1.recommendation?.action, null, 2));
    console.log(`Action Type: ${res1.recommendation?.action?.type}`);

    if (res1.recommendation?.action?.type === 'open_journal') {
        console.log('✅ Journal intent detected correctly!\n');
    } else {
        console.error('❌ Journal intent NOT detected\n');
    }

    // Test 2: Therapy intent
    console.log('=== Test 2: Therapy Intent ===');
    const msg2 = "I want to talk to a therapist";
    console.log(`User: ${msg2}`);
    const res2 = await agent.processMessage(userId, msg2);
    console.log(`Response: ${res2.response}`);
    console.log(`Action:`, JSON.stringify(res2.recommendation?.action, null, 2));
    console.log(`Action Type: ${res2.recommendation?.action?.type}`);

    if (res2.recommendation?.action?.type === 'suggest_therapy') {
        console.log('✅ Therapy intent detected correctly!\n');
    } else {
        console.error('❌ Therapy intent NOT detected\n');
    }

    // Test 3: Habit intent
    console.log('=== Test 3: Habit Intent ===');
    const msg3 = "Can you help me build a meditation habit?";
    console.log(`User: ${msg3}`);
    const res3 = await agent.processMessage(userId, msg3);
    console.log(`Response: ${res3.response}`);
    console.log(`Action:`, JSON.stringify(res3.recommendation?.action, null, 2));
    console.log(`Action Type: ${res3.recommendation?.action?.type}`);

    if (res3.recommendation?.action?.type === 'suggest_habit') {
        console.log('✅ Habit intent detected correctly!\n');
    } else {
        console.error('❌ Habit intent NOT detected\n');
    }

    // Test 4: No explicit intent (emotion-based)
    console.log('=== Test 4: Emotion-Based (No Explicit Intent) ===');
    const msg4 = "I'm feeling really anxious today";
    console.log(`User: ${msg4}`);
    const res4 = await agent.processMessage(userId, msg4);
    console.log(`Response: ${res4.response}`);
    console.log(`Action:`, JSON.stringify(res4.recommendation?.action, null, 2));
    console.log(`Action Type: ${res4.recommendation?.action?.type}`);
    console.log('(Should be emotion-based recommendation, e.g., habit or journal)\n');
}

runTest().catch(console.error);
