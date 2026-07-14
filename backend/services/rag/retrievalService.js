const mongoose = require('mongoose');
const NoteChunk = require('../../models/NoteChunk');
const { cosineSimilarity } = require('./vectorService');

/**
 * Retrieve the most relevant chunks for a query from a specific note.
 * Tries MongoDB Atlas vector search first, falling back to manual similarity.
 * @param {string} noteId 
 * @param {number[]} queryEmbedding 
 * @param {object} opts 
 * @param {number} opts.limit - number of chunks to return (default: 3)
 * @returns {Promise<object[]>} list of matched NoteChunk documents
 */
exports.retrieveRelevantChunks = async (noteId, queryEmbedding, opts = {}) => {
  const { limit = 3 } = opts;
  let chunks = [];

  try {
    // 1. Try MongoDB Atlas Vector Search
    chunks = await NoteChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 10,
          limit,
          filter: { noteId: { $eq: new mongoose.Types.ObjectId(noteId.toString()) } }
        }
      }
    ]);
    console.log(`[retrievalService] Successfully fetched ${chunks.length} chunks via Atlas Vector Search.`);
  } catch (err) {
    console.error('[retrievalService] Atlas Vector Search failed:', err.message);
  }

  // 2. Fallback: Manual similarity calculation if Atlas search returned no results or failed
  if (!chunks || chunks.length === 0) {
    console.log('[retrievalService] Atlas Vector Search returned 0 results, falling back to manual similarity...');
    const allChunks = await NoteChunk.find({ 
      noteId: new mongoose.Types.ObjectId(noteId.toString()) 
    });
    const scoredChunks = allChunks.map(chunkDoc => {
      const score = cosineSimilarity(chunkDoc.embedding, queryEmbedding);
      return { chunk: chunkDoc, score };
    });

    // Sort by similarity score descending and slice
    scoredChunks.sort((a, b) => b.score - a.score);
    chunks = scoredChunks.slice(0, limit).map(s => s.chunk);
    console.log(`[retrievalService] Successfully retrieved ${chunks.length} chunks manually.`);
  }

  return chunks;
};
