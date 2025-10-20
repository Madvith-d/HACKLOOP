const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../utils/logger');

class VectorDbService {
  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY;
    this.environment = process.env.PINECONE_ENVIRONMENT;
    this.indexName = process.env.PINECONE_INDEX_NAME || 'mindmesh-memories';
    this.dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 384;
    this.topK = parseInt(process.env.VECTOR_SEARCH_TOP_K) || 10;
    
    this.pinecone = null;
    this.index = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Pinecone connection
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('PINECONE_API_KEY is required');
      }

      if (!this.environment) {
        throw new Error('PINECONE_ENVIRONMENT is required');
      }

      this.pinecone = new Pinecone({
        apiKey: this.apiKey,
        environment: this.environment
      });

      // Get or create index
      await this.ensureIndex();
      
      this.index = this.pinecone.index(this.indexName);
      this.isInitialized = true;
      
      logger.info('Pinecone initialized successfully', {
        indexName: this.indexName,
        dimension: this.dimension
      });

    } catch (error) {
      logger.error('Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  /**
   * Ensure the index exists, create if it doesn't
   */
  async ensureIndex() {
    try {
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes.some(index => index.name === this.indexName);

      if (!indexExists) {
        logger.info(`Creating Pinecone index: ${this.indexName}`);
        
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      } else {
        logger.info(`Pinecone index already exists: ${this.indexName}`);
      }
    } catch (error) {
      logger.error('Failed to ensure index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  async waitForIndexReady(maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const indexDescription = await this.pinecone.describeIndex(this.indexName);
        
        if (indexDescription.status?.ready) {
          logger.info('Pinecone index is ready');
          return;
        }
        
        logger.info('Waiting for Pinecone index to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        logger.warn('Error checking index status:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Timeout waiting for Pinecone index to be ready');
  }

  /**
   * Upsert vectors to Pinecone
   */
  async upsert(vectors) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!Array.isArray(vectors) || vectors.length === 0) {
        throw new Error('Vectors must be a non-empty array');
      }

      // Validate vectors
      vectors.forEach((vector, index) => {
        if (!vector.id) {
          throw new Error(`Vector at index ${index} is missing id`);
        }
        if (!vector.values || !Array.isArray(vector.values)) {
          throw new Error(`Vector at index ${index} is missing values array`);
        }
        if (vector.values.length !== this.dimension) {
          throw new Error(`Vector at index ${index} has invalid dimension: expected ${this.dimension}, got ${vector.values.length}`);
        }
      });

      const response = await this.index.upsert(vectors);
      
      logger.debug('Vectors upserted successfully', {
        count: vectors.length,
        upsertedCount: response.upsertedCount
      });

      return response;
    } catch (error) {
      logger.error('Failed to upsert vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async search(queryVector, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!Array.isArray(queryVector)) {
        throw new Error('Query vector must be an array');
      }

      if (queryVector.length !== this.dimension) {
        throw new Error(`Query vector has invalid dimension: expected ${this.dimension}, got ${queryVector.length}`);
      }

      const {
        topK = this.topK,
        filter = {},
        includeMetadata = true,
        includeValues = false
      } = options;

      const searchRequest = {
        vector: queryVector,
        topK,
        includeMetadata,
        includeValues,
        ...(Object.keys(filter).length > 0 && { filter })
      };

      const response = await this.index.query(searchRequest);
      
      logger.debug('Vector search completed', {
        topK,
        matchesReturned: response.matches?.length || 0,
        hasFilter: Object.keys(filter).length > 0
      });

      return response;
    } catch (error) {
      logger.error('Failed to search vectors:', error);
      throw error;
    }
  }

  /**
   * Search for user's memories (with userId filter)
   */
  async searchUserMemories(userId, queryVector, options = {}) {
    try {
      const filter = {
        userId: userId.toString(),
        ...options.filter
      };

      return this.search(queryVector, {
        ...options,
        filter
      });
    } catch (error) {
      logger.error('Failed to search user memories:', error);
      throw error;
    }
  }

  /**
   * Search memories by type (message, session_summary, user_fact)
   */
  async searchMemoriesByType(userId, type, queryVector, options = {}) {
    try {
      const filter = {
        userId: userId.toString(),
        type,
        ...options.filter
      };

      return this.search(queryVector, {
        ...options,
        filter
      });
    } catch (error) {
      logger.error('Failed to search memories by type:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('IDs must be a non-empty array');
      }

      const response = await this.index.deleteMany(ids);
      
      logger.debug('Vectors deleted successfully', {
        count: ids.length,
        deletedCount: response.deletedCount
      });

      return response;
    } catch (error) {
      logger.error('Failed to delete vectors:', error);
      throw error;
    }
  }

  /**
   * Delete all vectors for a user
   */
  async deleteUserVectors(userId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const response = await this.index.deleteMany({
        userId: userId.toString()
      });

      logger.info('User vectors deleted successfully', {
        userId,
        deletedCount: response.deletedCount
      });

      return response;
    } catch (error) {
      logger.error('Failed to delete user vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by filter
   */
  async deleteByFilter(filter) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!filter || Object.keys(filter).length === 0) {
        throw new Error('Filter is required');
      }

      const response = await this.index.deleteMany(filter);
      
      logger.debug('Vectors deleted by filter', {
        filter,
        deletedCount: response.deletedCount
      });

      return response;
    } catch (error) {
      logger.error('Failed to delete vectors by filter:', error);
      throw error;
    }
  }

  /**
   * Get vector by ID
   */
  async getVector(id) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!id) {
        throw new Error('Vector ID is required');
      }

      const response = await this.index.fetch([id]);
      
      if (!response.vectors || !response.vectors[id]) {
        return null;
      }

      return response.vectors[id];
    } catch (error) {
      logger.error('Failed to get vector:', error);
      throw error;
    }
  }

  /**
   * Update vector metadata
   */
  async updateMetadata(id, metadata) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!id) {
        throw new Error('Vector ID is required');
      }

      // First get the existing vector
      const existingVector = await this.getVector(id);
      if (!existingVector) {
        throw new Error(`Vector with ID ${id} not found`);
      }

      // Update metadata and upsert
      const updatedVector = {
        id,
        values: existingVector.values,
        metadata: {
          ...existingVector.metadata,
          ...metadata
        }
      };

      const response = await this.upsert([updatedVector]);
      
      logger.debug('Vector metadata updated', {
        id,
        metadata
      });

      return response;
    } catch (error) {
      logger.error('Failed to update vector metadata:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const stats = await this.index.describeIndexStats();
      
      logger.debug('Index stats retrieved', {
        totalVectorCount: stats.totalVectorCount,
        dimension: stats.dimension
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const stats = await this.getStats();
      
      return {
        status: 'healthy',
        indexName: this.indexName,
        dimension: this.dimension,
        totalVectorCount: stats.totalVectorCount
      };
    } catch (error) {
      logger.error('Vector DB health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        indexName: this.indexName
      };
    }
  }

  /**
   * Create vector object with metadata
   */
  createVector(id, embedding, metadata = {}) {
    return {
      id,
      values: embedding,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Batch upsert with chunking for large datasets
   */
  async batchUpsert(vectors, chunkSize = 100) {
    try {
      if (!Array.isArray(vectors) || vectors.length === 0) {
        throw new Error('Vectors must be a non-empty array');
      }

      const results = [];
      
      for (let i = 0; i < vectors.length; i += chunkSize) {
        const chunk = vectors.slice(i, i + chunkSize);
        const result = await this.upsert(chunk);
        results.push(result);
        
        logger.debug(`Processed chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(vectors.length / chunkSize)}`);
      }

      return {
        totalProcessed: vectors.length,
        chunks: results
      };
    } catch (error) {
      logger.error('Failed to batch upsert vectors:', error);
      throw error;
    }
  }
}

module.exports = new VectorDbService();
