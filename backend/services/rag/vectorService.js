/**
 * Calculate the cosine similarity between two numeric vectors.
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number} Similarity score between -1 and 1
 */
exports.cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
};
