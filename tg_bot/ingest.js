#!/usr/bin/env node
/**
 * Скрипт индексации knowledge.md.
 * Нарезает файл на чанки (один вопрос + ответ = один чанк)
 * и сохраняет в SQLite (таблица knowledge_chunks).
 *
 * Поиск выполняется локально по алгоритму BM25 — без внешних API.
 *
 * Запуск: node ingest.js   или   npm run ingest
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { upsertChunk, getChunkCount } from './services/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH   = path.join(__dirname, '../knowledge.md');

/** Разбивает knowledge.md на чанки по Q&A-парам */
function parseChunks(text) {
  const sections = text.split(/\n\s*---+\s*\n/);
  const chunks   = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/\*\*Q(\d+):\s*(.+?)\*\*\s*\n+([\s\S]+)/);
    if (!match) continue;

    const qNum     = match[1];
    const question = match[2].trim();
    const answer   = match[3].trim();

    chunks.push({
      chunkId: `q${qNum}`,
      content: `Вопрос: ${question}\n\nОтвет: ${answer}`,
    });
  }

  return chunks;
}

function main() {
  console.log('📄 Читаем knowledge.md...');

  let text;
  try {
    text = readFileSync(KB_PATH, 'utf-8');
  } catch {
    console.error(`❌ Файл не найден: ${KB_PATH}`);
    process.exit(1);
  }

  const chunks = parseChunks(text);
  if (chunks.length === 0) {
    console.error('❌ Чанки не обнаружены — проверьте формат knowledge.md');
    process.exit(1);
  }

  console.log(`📦 Найдено ${chunks.length} чанков. Сохраняем в БД...\n`);

  let ok = 0;

  for (let i = 0; i < chunks.length; i++) {
    const { chunkId, content } = chunks[i];
    const label = `[${String(i + 1).padStart(2, ' ')}/${chunks.length}] ${chunkId}`;

    try {
      // embedding хранится как пустой массив — поиск работает через BM25 на тексте
      upsertChunk({ chunkId, source: 'knowledge.md', content, embedding: [] });
      console.log(`  ${label} ✅`);
      ok++;
    } catch (err) {
      console.log(`  ${label} ❌  ${err.message}`);
    }
  }

  const total = getChunkCount();
  console.log(`
✅ Готово: ${ok}/${chunks.length} сохранено.
📊 Всего чанков в БД: ${total}
🔍 Поиск: BM25 (локальный, без API)
`);
}

main();
