/**
 * BM25-ретривер для семантического поиска по базе знаний.
 * Работает полностью локально — не требует внешних API.
 *
 * Okapi BM25 — стандарт де-факто для текстового ранжирования
 * (используется в Elasticsearch, Lucene, Whoosh).
 */

import { getChunkTexts } from './db.js';

const TOP_K = 3;
const K1    = 1.5;   // насыщение частоты термина
const B     = 0.75;  // нормализация длины документа

// ─── Токенизация (русский + английский) ──────────────────────────────────────

const STOP_WORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как',
  'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к',
  'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'её', 'мне', 'было',
  'вот', 'от', 'меня', 'ещё', 'нет', 'о', 'из', 'ему', 'теперь',
  'при', 'об', 'до', 'или', 'если', 'уже', 'это', 'мы', 'был', 'то',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^а-яёa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// ─── BM25 ─────────────────────────────────────────────────────────────────────

function computeIdf(queryTokens, docTokensList) {
  const N   = docTokensList.length;
  const idf = {};
  for (const token of queryTokens) {
    const df = docTokensList.filter((tokens) => tokens.includes(token)).length;
    idf[token] = Math.log((N - df + 0.5) / (df + 0.5) + 1);
  }
  return idf;
}

function bm25Score(queryTokens, docTokens, avgDocLen, idf) {
  const docLen = docTokens.length;
  let score = 0;
  for (const token of queryTokens) {
    const tf = docTokens.filter((t) => t === token).length;
    if (tf === 0) continue;
    const num   = tf * (K1 + 1);
    const denom = tf + K1 * (1 - B + B * (docLen / avgDocLen));
    score += (idf[token] ?? 0) * (num / denom);
  }
  return score;
}

// ─── Публичный API ────────────────────────────────────────────────────────────

/**
 * Находит TOP_K наиболее релевантных фрагментов по алгоритму BM25.
 *
 * @param {string} query — вопрос пользователя
 * @returns {Array<{chunkId: string, content: string, score: number}>}
 */
export function retrieveChunks(query) {
  const chunks = getChunkTexts();
  if (chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const docTokensList = chunks.map((c) => tokenize(c.content));
  const totalLen  = docTokensList.reduce((s, d) => s + d.length, 0);
  const avgDocLen = totalLen / docTokensList.length;
  const idf = computeIdf(queryTokens, docTokensList);

  return chunks
    .map((chunk, i) => ({
      chunkId: chunk.chunkId,
      content: chunk.content,
      score:   bm25Score(queryTokens, docTokensList[i], avgDocLen, idf),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}
