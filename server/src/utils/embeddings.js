const MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

function hashFallback(text, dim = 128) {
  // Deterministic cheap embedding fallback if no API key.
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const idx = c % dim;
    vec[idx] = (vec[idx] + (c % 13) + 1) % 1000;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function embedText(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const payload = {
    input: text || '',
    model: MODEL,
  };
  if (!apiKey) {
    return { vector: hashFallback(text || '') , dim: 128, model: 'fallback-hash-128' };
  }
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    // Fallback on failure to keep app usable
    return { vector: hashFallback(text || '') , dim: 128, model: 'fallback-hash-128' };
  }
  const json = await res.json();
  const vector = json?.data?.[0]?.embedding || [];
  return { vector, dim: vector.length, model: payload.model };
}

module.exports = { embedText };