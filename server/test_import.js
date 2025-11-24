try {
    console.log('Importing agent...');
    const agent = require('./src/ai/agent');
    console.log('✅ Import successful');
} catch (error) {
    console.error('❌ Import failed:', error);
}
