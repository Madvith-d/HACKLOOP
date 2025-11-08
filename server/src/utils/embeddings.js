const logger = require('./logger');

class EmbeddingService {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) return;
      
      const nodeEmbedding = require('node-embedding');
      this.model = new nodeEmbedding.SentenceTransformer('Xenova/all-MiniLM-L6-v2');
      this.initialized = true;
      logger.info('Embedding model initialized successfully');
    } catch (error) {
      logger.warn('Failed to load transformer model, using fallback embedding method:', error.message);
      this.initialized = true;
    }
  }

  async generateEmbedding(text) {
    try {
      await this.initialize();
      
      if (this.model) {
        const embeddings = await this.model.embed(text);
        return embeddings;
      } else {
        return this.fallbackEmbedding(text);
      }
    } catch (error) {
      logger.error('Error generating embedding:', error);
      return this.fallbackEmbedding(text);
    }
  }

  fallbackEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        const char = word.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const index = Math.abs(hash) % 384;
      embedding[index] += 1 / words.length;
    }
    
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  async generateBatchEmbeddings(texts) {
    try {
      await this.initialize();
      return Promise.all(texts.map(text => this.generateEmbedding(text)));
    } catch (error) {
      logger.error('Error generating batch embeddings:', error);
      return texts.map(text => this.fallbackEmbedding(text));
    }
  }
}

module.exports = new EmbeddingService();
