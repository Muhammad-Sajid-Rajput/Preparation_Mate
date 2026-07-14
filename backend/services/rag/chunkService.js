// Sliding window chunker: 500 tokens, 50 token overlap
// Approximation: 1 token ≈ 4 characters
const CHUNK_SIZE    = 500 * 4;   // ~500 tokens
const OVERLAP_SIZE  = 50 * 4;    // ~50 tokens

/**
 * Chunk a long string of text into smaller overlapping chunks.
 * @param {string} text 
 * @returns {string[]}
 */
exports.chunkText = (text) => {
  if (!text) return [];
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.substring(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    if (end === text.length) break;
    start += (CHUNK_SIZE - OVERLAP_SIZE);
  }
  
  return chunks;
};
