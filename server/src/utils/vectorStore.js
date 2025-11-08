const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class LocalVectorStore {
  constructor(dataDir = './data/vectors') {
    this.dataDir = dataDir;
    this.vectors = new Map();
    this.ensureDir();
    this.loadVectors();
  }

  ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadVectors() {
    try {
      const vectorFiles = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
      for (const file of vectorFiles) {
        const userId = file.replace('.json', '');
        const filePath = path.join(this.dataDir, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        this.vectors.set(userId, JSON.parse(data));
      }
    } catch (error) {
      logger.warn('Error loading vectors from disk:', error);
    }
  }

  saveVector(userId, vectorData) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`);
      const existing = this.vectors.get(userId) || [];
      const updated = [...existing, vectorData];
      this.vectors.set(userId, updated);
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving vector:', error);
      return false;
    }
  }

  getVectorsByUserId(userId) {
    return this.vectors.get(userId) || [];
  }

  searchSimilar(userId, embedding, topK = 5) {
    const userVectors = this.getVectorsByUserId(userId);
    if (userVectors.length === 0) return [];

    const similarities = userVectors.map(v => ({
      ...v,
      similarity: this.cosineSimilarity(embedding, v.embedding)
    })).sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  getAllVectors(userId) {
    return this.getVectorsByUserId(userId);
  }

  clear() {
    this.vectors.clear();
  }
}

class PineconeVectorStore {
  constructor(apiKey, environment, index) {
    this.apiKey = apiKey;
    this.environment = environment;
    this.indexName = index;
    this.initialized = false;
  }

  async initialize() {
    try {
      const { Pinecone } = require('@pinecone-database/pinecone');
      this.client = new Pinecone({
        apiKey: this.apiKey
      });
      this.index = this.client.index(this.indexName);
      this.initialized = true;
      logger.info('Pinecone initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  async saveVector(userId, vectorData) {
    if (!this.initialized) await this.initialize();
    try {
      const { v4: uuidv4 } = require('uuid');
      const id = `${userId}_${uuidv4()}`;
      await this.index.upsert([{
        id,
        values: vectorData.embedding,
        metadata: {
          userId,
          content: vectorData.content,
          type: vectorData.type,
          timestamp: vectorData.timestamp
        }
      }]);
      return true;
    } catch (error) {
      logger.error('Error saving vector to Pinecone:', error);
      return false;
    }
  }

  async searchSimilar(userId, embedding, topK = 5) {
    if (!this.initialized) await this.initialize();
    try {
      const results = await this.index.query({
        vector: embedding,
        topK,
        filter: { userId: { $eq: userId } }
      });
      return results.matches.map(m => ({
        id: m.id,
        similarity: m.score,
        content: m.metadata?.content,
        type: m.metadata?.type,
        timestamp: m.metadata?.timestamp,
        embedding: m.values
      }));
    } catch (error) {
      logger.error('Error searching Pinecone:', error);
      return [];
    }
  }

  async getAllVectors(userId) {
    if (!this.initialized) await this.initialize();
    try {
      const results = await this.index.query({
        filter: { userId: { $eq: userId } },
        topK: 1000
      });
      return results.matches.map(m => ({
        id: m.id,
        content: m.metadata?.content,
        type: m.metadata?.type,
        timestamp: m.metadata?.timestamp,
        embedding: m.values
      }));
    } catch (error) {
      logger.error('Error fetching vectors from Pinecone:', error);
      return [];
    }
  }
}

function createVectorStore() {
  const useLocal = process.env.USE_LOCAL_VECTORS !== 'false';
  
  if (useLocal) {
    logger.info('Using local vector store');
    return new LocalVectorStore();
  } else {
    logger.info('Using Pinecone vector store');
    const store = new PineconeVectorStore(
      process.env.PINECONE_API_KEY,
      process.env.PINECONE_ENVIRONMENT,
      process.env.PINECONE_INDEX || 'mindmesh'
    );
    return store;
  }
}

module.exports = {
  LocalVectorStore,
  PineconeVectorStore,
  createVectorStore
};
