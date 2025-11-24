const logger = require('../utils/logger');
const AgentState = require('./state');
const { StateGraph, END } = require('@langchain/langgraph');
const {
  analyzeEmotionNode,
  retrieveContextNode,
  generateEmbeddingNode,
  recommendationNode,
  therapistAlertNode,
  responseGenerationNode
} = require('./nodes');

class EmpatheticChatAgent {
  constructor() {
    this.initialized = false;
    this.runnable = null;
  }

  async initialize() {
    if (this.initialized) return;
    logger.info('Initializing empathetic chat agent with LangGraph');

    // Define the graph
    const workflow = new StateGraph({
      channels: {
        messages: {
          value: (x, y) => x.concat(y),
          default: () => []
        },
        userMessage: {
          value: (x, y) => y ? y : x,
          default: () => ""
        },
        userId: {
          value: (x, y) => y ? y : x,
          default: () => ""
        },
        emotionalAnalysis: {
          value: (x, y) => y ? y : x,
          default: () => null
        },
        contextualData: {
          value: (x, y) => y ? y : x,
          default: () => null
        },
        recommendation: {
          value: (x, y) => y ? y : x,
          default: () => null
        },
        embeddings: {
          value: (x, y) => y ? y : x,
          default: () => null
        },
        therapistAlert: {
          value: (x, y) => y !== undefined ? y : x,
          default: () => false
        },
        response: {
          value: (x, y) => y ? y : x,
          default: () => ""
        }
      }
    });

    // Add nodes
    workflow.addNode("analyzeEmotion", analyzeEmotionNode);
    workflow.addNode("retrieveContext", retrieveContextNode);
    workflow.addNode("generateRecommendation", recommendationNode);
    workflow.addNode("checkTherapistAlert", therapistAlertNode);
    workflow.addNode("generateResponse", responseGenerationNode);
    // Embedding is a side effect, we can run it parallel or after response, 
    // but for the graph flow, let's keep it simple. 
    // In the original code it was backgrounded. We can keep it that way or add it to the graph.
    // For now, let's add it as a node that runs but doesn't block the main flow if we branch.
    // However, LangGraph is sequential by default unless we use parallel branches.

    // Define edges
    // Parallel execution of emotion analysis and context retrieval
    workflow.setEntryPoint("analyzeEmotion");

    // We want analyzeEmotion and retrieveContext to run in parallel?
    // LangGraph supports this by having the entry point point to multiple nodes?
    // Or we can just chain them for simplicity if parallel isn't strictly required for the graph structure.
    // Let's chain them for now to ensure state is passed correctly.

    workflow.addEdge("analyzeEmotion", "retrieveContext");
    workflow.addEdge("retrieveContext", "generateRecommendation");
    workflow.addEdge("generateRecommendation", "checkTherapistAlert");
    workflow.addEdge("checkTherapistAlert", "generateResponse");
    workflow.addEdge("generateResponse", END);

    // Compile the graph
    this.runnable = workflow.compile();

    this.initialized = true;
  }

  async processMessage(userId, message) {
    await this.initialize();

    logger.info('Processing message for user:', { userId, messageLength: message.length });

    const initialState = {
      userId,
      userMessage: message,
      messages: []
    };

    try {
      // Execute the graph
      const finalState = await this.runnable.invoke(initialState);

      // Background embedding generation (fire and forget)
      generateEmbeddingNode(finalState).catch(err =>
        logger.error('Background embedding generation failed:', err)
      );

      logger.info('Message processing completed successfully', {
        userId,
        recommendation: finalState.recommendation?.actions
      });

      return {
        response: finalState.response,
        recommendation: finalState.recommendation,
        emotionalAnalysis: finalState.emotionalAnalysis,
        context: finalState.contextualData,
        therapistAlert: finalState.therapistAlert
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        response: 'I\'m here to support you. If you\'re in crisis, please reach out to emergency services or a crisis hotline.',
        recommendation: null,
        emotionalAnalysis: null,
        error: error.message
      };
    }
  }

  async streamMessage(userId, message, onChunk) {
    await this.initialize();

    const initialState = {
      userId,
      userMessage: message,
      messages: []
    };

    let finalState = initialState;

    try {
      // Stream the graph execution events
      const stream = await this.runnable.stream(initialState);

      for await (const chunk of stream) {
        // chunk is an object where keys are node names and values are the state updates
        const nodeName = Object.keys(chunk)[0];
        const stateUpdate = chunk[nodeName];

        // Merge state for our local tracking
        finalState = { ...finalState, ...stateUpdate };

        if (onChunk) {
          if (nodeName === 'analyzeEmotion') {
            onChunk({ type: 'thinking', data: 'Analyzing emotions...' });
            if (stateUpdate.emotionalAnalysis) {
              onChunk({ type: 'analysis', data: stateUpdate.emotionalAnalysis });
            }
          } else if (nodeName === 'retrieveContext') {
            onChunk({ type: 'thinking', data: 'Retrieving context...' });
            if (stateUpdate.contextualData?.userHistory) {
              onChunk({ type: 'context', data: stateUpdate.contextualData.userHistory });
            }
          } else if (nodeName === 'generateRecommendation') {
            onChunk({ type: 'thinking', data: 'Generating recommendations...' });
            if (stateUpdate.recommendation) {
              onChunk({ type: 'recommendation', data: stateUpdate.recommendation });
            }
          } else if (nodeName === 'generateResponse') {
            onChunk({ type: 'response', data: stateUpdate.response });
          }
        }
      }

      // Background embedding
      generateEmbeddingNode(finalState).catch(err =>
        logger.error('Background embedding generation failed:', err)
      );

      return {
        response: finalState.response,
        recommendation: finalState.recommendation,
        emotionalAnalysis: finalState.emotionalAnalysis,
        context: finalState.contextualData,
        therapistAlert: finalState.therapistAlert
      };

    } catch (error) {
      logger.error('Error streaming message:', error);
      if (onChunk) {
        onChunk({ type: 'error', data: error.message });
      }
      return { error: error.message };
    }
  }

  getAgentDescription() {
    return {
      name: 'Empathetic Chat Agent',
      version: '2.0.0',
      description: 'An AI agent powered by Google Gemini and LangGraph that listens to users and provides personalized mental health support',
      aiModel: 'Google Gemini 1.5 Flash',
      embeddingModel: 'Xenova/all-MiniLM-L6-v2 (local)',
      capabilities: [
        'AI-powered emotional analysis using Gemini',
        'Intelligent response generation with Gemini',
        'Context retrieval from user history',
        'Local vector embeddings for semantic search',
        'Personalized recommendations',
        'Therapist alerts for crisis situations'
      ],
      supportedActions: [
        'SUGGEST_JOURNAL',
        'SUGGEST_HABIT',
        'SUGGEST_THERAPY',
        'ALERT_THERAPIST'
      ]
    };
  }
}

module.exports = new EmpatheticChatAgent();
