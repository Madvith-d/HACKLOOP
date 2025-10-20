const axios = require('axios');
const logger = require('../utils/logger');

class EmbeddingService {
  constructor() {
    this.baseUrl = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:5002';
    this.timeout = 30000; // 30 seconds
    this.model = process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2';
    this.dimension = process.env.EMBEDDING_DIMENSION || 384;
    this.maxRetries = 3;
  }

  /**
   * Create embeddings for a single text
   */
  async embed(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      // Truncate text if too long (most embedding models have limits)
      const truncatedText = text.substring(0, 5000);

      const response = await axios.post(
        `${this.baseUrl}/embed`,
        { text: truncatedText, model: this.model },
        { timeout: this.timeout }
      );

      if (!response.data || !response.data.embedding) {
        throw new Error('Invalid response from embedding service');
      }

      const embedding = response.data.embedding;
      
      // Validate embedding dimensions
      if (!Array.isArray(embedding) || embedding.length !== this.dimension) {
        throw new Error(`Invalid embedding dimension: expected ${this.dimension}, got ${embedding.length}`);
      }

      logger.debug('Embedding created successfully', {
        textLength: text.length,
        embeddingDimension: embedding.length,
        model: this.model
      });

      return {
        embedding,
        dimension: embedding.length,
        model: this.model,
        textLength: text.length
      };

    } catch (error) {
      logger.error('Embedding service error:', {
        error: error.message,
        text: text?.substring(0, 100),
        model: this.model
      });
      throw error;
    }
  }

  /**
   * Create embeddings for multiple texts (batch processing)
   */
  async embedBatch(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('Texts must be a non-empty array');
      }

      if (texts.length > 100) {
        throw new Error('Batch size cannot exceed 100 texts');
      }

      // Validate and truncate texts
      const processedTexts = texts.map(text => {
        if (typeof text !== 'string') {
          throw new Error('All texts must be strings');
        }
        return text.substring(0, 5000);
      });

      const response = await axios.post(
        `${this.baseUrl}/embed/batch`,
        { texts: processedTexts, model: this.model },
        { timeout: this.timeout * 2 }
      );

      if (!response.data || !Array.isArray(response.data.embeddings)) {
        throw new Error('Invalid batch response from embedding service');
      }

      const embeddings = response.data.embeddings;
      
      // Validate all embeddings
      embeddings.forEach((embedding, index) => {
        if (!Array.isArray(embedding) || embedding.length !== this.dimension) {
          throw new Error(`Invalid embedding dimension at index ${index}: expected ${this.dimension}, got ${embedding.length}`);
        }
      });

      logger.debug('Batch embeddings created successfully', {
        batchSize: texts.length,
        embeddingDimension: embeddings[0]?.length,
        model: this.model
      });

      return {
        embeddings,
        dimension: this.dimension,
        model: this.model,
        batchSize: texts.length
      };

    } catch (error) {
      logger.error('Batch embedding service error:', {
        error: error.message,
        batchSize: texts.length,
        model: this.model
      });
      throw error;
    }
  }

  /**
   * Get embedding service health status
   */
  async getHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return {
        status: 'healthy',
        model: this.model,
        dimension: this.dimension,
        ...response.data
      };
    } catch (error) {
      logger.error('Embedding service health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
        model: this.model,
        dimension: this.dimension
      };
    }
  }

  /**
   * Get available embedding models
   */
  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      logger.error('Failed to get available models:', error.message);
      return {
        models: [this.model],
        current: this.model
      };
    }
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1, embedding2) {
    if (!Array.isArray(embedding1) || !Array.isArray(embedding2)) {
      throw new Error('Both embeddings must be arrays');
    }

    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Find most similar embedding from a list
   */
  findMostSimilar(queryEmbedding, candidateEmbeddings, candidateIds = null) {
    if (!Array.isArray(candidateEmbeddings) || candidateEmbeddings.length === 0) {
      throw new Error('Candidate embeddings must be a non-empty array');
    }

    let maxSimilarity = -1;
    let bestIndex = 0;

    candidateEmbeddings.forEach((embedding, index) => {
      const similarity = this.calculateSimilarity(queryEmbedding, embedding);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestIndex = index;
      }
    });

    return {
      index: bestIndex,
      similarity: maxSimilarity,
      id: candidateIds ? candidateIds[bestIndex] : null,
      embedding: candidateEmbeddings[bestIndex]
    };
  }

  /**
   * Retry mechanism for failed requests
   */
  async withRetry(operation, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Embedding service attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Process text for embedding (clean and prepare)
   */
  preprocessText(text) {
    if (typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 5000); // Truncate to reasonable length
  }

  /**
   * Create embedding with retry logic
   */
  async embedWithRetry(text) {
    const processedText = this.preprocessText(text);
    
    return this.withRetry(async () => {
      return this.embed(processedText);
    });
  }
}

module.exports = new EmbeddingService();
