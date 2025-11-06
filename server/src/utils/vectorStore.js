const DISTANCE = 'Cosine';
const DEFAULT_DIM = parseInt(process.env.EMBEDDING_DIM || '1536', 10);
const BACKEND = (process.env.VECTOR_BACKEND || '').toLowerCase();
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION || 'journal_entries';

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

class MemoryStore {
  constructor() { this.items = new Map(); }
  async ensureCollection() { return true; }
  async upsert({ id, vector, payload }) { this.items.set(id, { id, vector, payload }); return true; }
  async delete(id) { this.items.delete(id); return true; }
  async search({ vector, top = 10, filter }) {
    const list = Array.from(this.items.values()).filter(it => {
      if (!filter?.must) return true;
      return filter.must.every(clause => {
        if (clause.key && clause.match) {
          return it.payload?.[clause.key] === clause.match.value;
        }
        return true;
      });
    });
    const scored = list.map(it => ({ id: it.id, score: cosineSim(vector, it.vector), payload: it.payload }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, top);
  }
}

class QdrantStore {
  constructor() {}
  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (QDRANT_API_KEY) h['api-key'] = QDRANT_API_KEY;
    return h;
  }
  async ensureCollection(dim = DEFAULT_DIM) {
    const url = `${QDRANT_URL}/collections/${encodeURIComponent(COLLECTION)}`;
    const get = await fetch(url, { method: 'GET', headers: this.headers() });
    if (get.ok) return true;
    const body = { vectors: { size: dim, distance: DISTANCE } };
    const res = await fetch(url, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    return res.ok;
  }
  async upsert({ id, vector, payload }) {
    const url = `${QDRANT_URL}/collections/${encodeURIComponent(COLLECTION)}/points`;
    const body = { points: [{ id, vector, payload }] };
    const res = await fetch(url, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    return res.ok;
  }
  async delete(id) {
    const url = `${QDRANT_URL}/collections/${encodeURIComponent(COLLECTION)}/points/delete`;
    const body = { points: [id] };
    const res = await fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    return res.ok;
  }
  async search({ vector, top = 10, filter }) {
    const url = `${QDRANT_URL}/collections/${encodeURIComponent(COLLECTION)}/points/search`;
    const body = { vector, limit: top, with_payload: true };
    if (filter) body.filter = filter;
    const res = await fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.result || []).map(r => ({ id: r.id, score: r.score, payload: r.payload }));
  }
}

const store = (BACKEND === 'qdrant' && QDRANT_URL) ? new QdrantStore() : new MemoryStore();

async function ensureCollection(dim) { return store.ensureCollection(dim); }
async function upsertJournalEmbedding({ id, vector, payload }) { return store.upsert({ id, vector, payload }); }
async function deleteJournalEmbedding(id) { return store.delete(id); }
async function searchJournal({ vector, top, userId }) {
  const filter = userId ? { must: [{ key: 'userId', match: { value: userId } }] } : undefined;
  return store.search({ vector, top, filter });
}

module.exports = { ensureCollection, upsertJournalEmbedding, deleteJournalEmbedding, searchJournal, DEFAULT_DIM, COLLECTION };