const { BaseMessage } = require('@langchain/core/messages');

class AgentState {
  constructor(data = {}) {
    this.messages = data.messages || [];
    this.userMessage = data.userMessage || '';
    this.userId = data.userId || '';
    this.emotionalAnalysis = data.emotionalAnalysis || null;
    this.contextualData = data.contextualData || null;
    this.recommendation = data.recommendation || null;
    this.embeddings = data.embeddings || null;
    this.therapistAlert = data.therapistAlert || false;
    this.response = data.response || '';
  }

  static stateReducer(existing, update) {
    if (!existing) return update;
    return {
      ...existing,
      ...update,
      messages: update.messages ? [...(existing.messages || []), ...update.messages] : existing.messages
    };
  }
}

module.exports = AgentState;
