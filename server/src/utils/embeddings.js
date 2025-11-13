const logger = require('./logger');

class EmbeddingService {
  constructor() {
    this.model = null;
    this.initialized = false;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // Lightweight 384-dim model (~80MB)
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Try using @xenova/transformers for lightweight local embeddings
      const { pipeline } = require('@xenova/transformers');
      
      logger.info(`Loading lightweight local embedding model: ${this.modelName}`);
      this.model = await pipeline('feature-extraction', this.modelName, {
        quantized: true, // Use quantized model for smaller size
        device: 'cpu' // Use CPU to avoid GPU dependencies
      });
      
      this.initialized = true;
      logger.info('Lightweight local embedding model initialized successfully');
    } catch (error) {
      logger.warn('Failed to load @xenova/transformers, trying alternative method:', error.message);
      
      // Fallback: try node-embedding if available
      try {
        const nodeEmbedding = require('node-embedding');
        this.model = new nodeEmbedding.SentenceTransformer(this.modelName);
        this.initialized = true;
        logger.info('Embedding model initialized with node-embedding fallback');
      } catch (fallbackError) {
        logger.warn('All embedding model loading methods failed, using fallback embedding method');
        this.initialized = true;
      }
    }
  }

  async generateEmbedding(text) {
    try {
      await this.initialize();
      
      if (!this.model) {
        return this.fallbackEmbedding(text);
      }

      // Handle @xenova/transformers pipeline
      if (typeof this.model === 'function') {
        const output = await this.model(text, { pooling: 'mean', normalize: true });
        // Extract the embedding array from the tensor
        const embedding = Array.from(output.data);
        return embedding;
      }
      
      // Handle node-embedding or other compatible APIs
      if (typeof this.model.embed === 'function') {
        const embeddings = await this.model.embed(text);
        return embeddings;
      }
      
      return this.fallbackEmbedding(text);
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
