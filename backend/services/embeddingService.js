import axios from 'axios';
import { supabaseAdmin } from './supabase.js';

/**
 * Embedding Service — Semantic Search via pgvector
 *
 * Uses a lightweight embedding approach:
 * 1. Generates embeddings via a free HuggingFace Inference API model
 * 2. Stores them in Supabase pgvector for similarity search
 * 3. Falls back gracefully if the vector table doesn't exist yet
 */

const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

/**
 * Generate an embedding vector for a text string using HuggingFace Inference API.
 * Uses the free sentence-transformers/all-MiniLM-L6-v2 model (384 dimensions).
 * @param {string} text - Text to embed
 * @returns {number[]|null} - 384-dim vector or null on failure
 */
export async function generateEmbedding(text) {
  try {
    const hfToken = process.env.HF_API_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;

    const response = await axios.post(
      HF_API_URL,
      { inputs: text.slice(0, 512), options: { wait_for_model: true } },
      { headers, timeout: 30000 }
    );

    // HF returns the embedding directly as an array of numbers
    const embedding = response.data;
    if (Array.isArray(embedding) && embedding.length > 0) {
      // If nested (batch mode), take first
      return Array.isArray(embedding[0]) ? embedding[0] : embedding;
    }
    return null;
  } catch (err) {
    console.warn('[Embedding] Failed to generate embedding:', err.message);
    return null;
  }
}

/**
 * Store article embeddings in Supabase pgvector table.
 * @param {Object[]} articles - Array of { id, title, abstract, source, year, url }
 */
export async function storeArticleEmbeddings(articles) {
  if (!articles || articles.length === 0) return;

  try {
    const rows = [];
    for (const article of articles.slice(0, 20)) {
      const text = `${article.title}. ${(article.abstract || '').slice(0, 300)}`;
      const embedding = await generateEmbedding(text);
      if (embedding) {
        rows.push({
          article_id: article.id,
          title: article.title,
          abstract: (article.abstract || '').slice(0, 600),
          source: article.source,
          year: article.year || 0,
          url: article.url || '',
          embedding,
        });
      }
    }

    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from('article_embeddings')
        .upsert(rows, { onConflict: 'article_id' });

      if (error) {
        console.warn('[Embedding] Failed to store embeddings:', error.message);
      } else {
        console.log(`[Embedding] Stored ${rows.length} article embeddings`);
      }
    }
  } catch (err) {
    console.warn('[Embedding] Store error:', err.message);
  }
}

/**
 * Search for semantically similar articles using pgvector cosine similarity.
 * Uses an RPC function `match_articles` that must be created in Supabase.
 * @param {string} queryText - The user's query
 * @param {number} limit - Max results to return
 * @returns {Object[]} - Array of similar articles
 */
export async function searchSimilarArticles(queryText, limit = 10) {
  try {
    const embedding = await generateEmbedding(queryText);
    if (!embedding) return [];

    const { data, error } = await supabaseAdmin.rpc('match_articles', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error) {
      // Table may not exist yet — graceful fallback
      if (error.message?.includes('does not exist') || error.code === '42883') {
        console.log('[Embedding] Vector search not available yet (table/function not created)');
        return [];
      }
      console.warn('[Embedding] Search error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.article_id,
      title: row.title,
      abstract: row.abstract,
      source: row.source,
      year: row.year,
      url: row.url,
      similarity: row.similarity,
    }));
  } catch (err) {
    console.warn('[Embedding] Search failed:', err.message);
    return [];
  }
}
