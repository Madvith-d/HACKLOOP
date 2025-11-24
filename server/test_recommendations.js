const recommendations = require('./src/ai/recommendations');

// Mock emotional analysis
const mockAnalysis = {
    emotionScores: {
        sadness: 0.9,
        anxiety: 0.2,
        joy: 0.1
    },
    sentiment: -0.8
};

// Test Recommendation Engine directly
console.log('Testing Recommendation Engine...');
const journalRec = recommendations.analyzeEmotionalState('I feel really sad and down', mockAnalysis);
console.log('Journal Recommendation:', JSON.stringify(journalRec, null, 2));

if (journalRec.action?.type === 'journal') {
    console.log('✅ Journal action correctly generated');
} else {
    console.error('❌ Journal action failed');
}

const anxietyAnalysis = {
    emotionScores: {
        anxiety: 0.8,
        fear: 0.6
    }
};

const habitRec = recommendations.analyzeEmotionalState('I am so anxious about everything', anxietyAnalysis);
console.log('Habit Recommendation:', JSON.stringify(habitRec, null, 2));

if (habitRec.action?.type === 'habit') {
    console.log('✅ Habit action correctly generated');
} else {
    console.error('❌ Habit action failed');
}

const crisisAnalysis = {
    emotionScores: {
        sadness: 0.95,
        hopelessness: 0.9
    }
};

const crisisRec = recommendations.analyzeEmotionalState('I want to end it all', crisisAnalysis);
console.log('Crisis Recommendation:', JSON.stringify(crisisRec, null, 2));

if (crisisRec.action?.type === 'alert_therapist') {
    console.log('✅ Crisis action correctly generated');
} else {
    console.error('❌ Crisis action failed');
}
