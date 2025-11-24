const agent = require('./src/ai/agent');
const logger = require('./src/utils/logger');

// Mock environment variables if needed
process.env.GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "dummy_key";

async function runTest() {
    console.log('--- Starting Agent Memory Test ---');

    const userId = 'test-user-' + Date.now();

    // Turn 1: Initial statement
    console.log('\n\n--- Turn 1 ---');
    const msg1 = "I'm feeling really stressed about work lately.";
    console.log(`User: ${msg1}`);
    const res1 = await agent.processMessage(userId, msg1);
    console.log(`Agent: ${res1.response}`);
    console.log(`Recommendation:`, res1.recommendation?.actions);

    // Turn 2: Follow-up (testing memory)
    console.log('\n\n--- Turn 2 ---');
    const msg2 = "It's mostly the deadlines. They keep piling up.";
    console.log(`User: ${msg2}`);
    const res2 = await agent.processMessage(userId, msg2);
    console.log(`Agent: ${res2.response}`);

    // Check if agent references previous context (manual check mostly, but we can inspect memory)
    const memory = agent.getMemory(userId);
    console.log('\n\n--- Memory Dump ---');
    console.log(JSON.stringify(memory, null, 2));

    if (memory.length >= 4) {
        console.log('\n✅ Memory successfully stored 2 turns (4 messages)');
    } else {
        console.error('\n❌ Memory failed to store messages');
    }

    // Turn 3: Expressing a new emotion to test transition
    console.log('\n\n--- Turn 3 ---');
    const msg3 = "I also feel a bit lonely because I'm working from home.";
    console.log(`User: ${msg3}`);
    const res3 = await agent.processMessage(userId, msg3);
    console.log(`Agent: ${res3.response}`);

}

runTest().catch(console.error);
