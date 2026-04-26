import Database from 'better-sqlite3';
import { config } from '../config.js';
import { resolve } from 'path';

let _db = null;

export function getDb() {
  if (!_db) {
    const dbPath = resolve(config.sqliteDbPath);
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db) {
  db.exec(`
    -- Услуги/продукты (редактируется вручную или через seed)
    CREATE TABLE IF NOT EXISTS products (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort INTEGER NOT NULL DEFAULT 0
    );

    -- Настройки бота (название компании, промпт и т.п.)
    CREATE TABLE IF NOT EXISTS bot_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Заявки клиентов
    CREATE TABLE IF NOT EXISTS leads (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at        TEXT NOT NULL,
      telegram_id       INTEGER NOT NULL,
      telegram_username TEXT NOT NULL DEFAULT '',
      name              TEXT NOT NULL,
      company           TEXT NOT NULL,
      description       TEXT NOT NULL,
      product           TEXT NOT NULL,
      phone             TEXT NOT NULL,
      email             TEXT NOT NULL,
      meeting_datetime  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_telegram_id ON leads(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at);

    -- LLM-диалоги (консультант Надежда)
    CREATE TABLE IF NOT EXISTS llm_conversations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT    NOT NULL,
      chat_id    INTEGER NOT NULL,
      username   TEXT    NOT NULL DEFAULT '',
      question   TEXT    NOT NULL,
      answer     TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_conv_chat_id    ON llm_conversations(chat_id);
    CREATE INDEX IF NOT EXISTS idx_conv_created_at ON llm_conversations(created_at);

    -- Оценки ответов (👍/👎)
    CREATE TABLE IF NOT EXISTS llm_ratings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at      TEXT    NOT NULL,
      conversation_id INTEGER NOT NULL REFERENCES llm_conversations(id),
      chat_id         INTEGER NOT NULL,
      rating          INTEGER NOT NULL  -- 1 = полезно, -1 = не помогло
    );

    -- Чанки базы знаний для RAG
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      chunk_id  TEXT    NOT NULL UNIQUE,
      source    TEXT    NOT NULL DEFAULT 'knowledge.md',
      content   TEXT    NOT NULL,
      embedding TEXT    NOT NULL  -- JSON-массив чисел
    );
  `);

  // Миграция: добавить chunks_used если колонки ещё нет
  try {
    db.exec('ALTER TABLE llm_conversations ADD COLUMN chunks_used TEXT DEFAULT NULL');
  } catch {
    // колонка уже существует
  }
}

// ─── Продукты ───────────────────────────────────────────────────────────────

export function getProducts() {
  return getDb()
    .prepare('SELECT name FROM products ORDER BY sort, id')
    .all()
    .map((r) => r.name);
}

export function setProducts(names) {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO products (name, sort) VALUES (?, ?)'
  );
  const insertMany = db.transaction((items) => {
    items.forEach((name, i) => insert.run(name, i));
  });
  insertMany(names);
}

// ─── Конфиг ─────────────────────────────────────────────────────────────────

export function getConfig(key, fallback = '') {
  const row = getDb()
    .prepare('SELECT value FROM bot_config WHERE key = ?')
    .get(key);
  return row ? row.value : fallback;
}

export function setConfig(key, value) {
  getDb()
    .prepare('INSERT OR REPLACE INTO bot_config (key, value) VALUES (?, ?)')
    .run(key, value);
}

// ─── LLM-диалоги ────────────────────────────────────────────────────────────

export function saveConversation({ chatId, username, question, answer, chunksUsed = null }) {
  const result = getDb()
    .prepare(
      `INSERT INTO llm_conversations
         (created_at, chat_id, username, question, answer, chunks_used)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      new Date().toISOString(),
      chatId,
      username ?? '',
      question,
      answer,
      chunksUsed ? JSON.stringify(chunksUsed) : null
    );
  return result.lastInsertRowid;
}

// ─── Чанки базы знаний ───────────────────────────────────────────────────────

export function upsertChunk({ chunkId, source = 'knowledge.md', content, embedding }) {
  getDb()
    .prepare(`
      INSERT INTO knowledge_chunks (chunk_id, source, content, embedding)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(chunk_id) DO UPDATE
        SET content   = excluded.content,
            embedding = excluded.embedding,
            source    = excluded.source
    `)
    .run(chunkId, source, content, JSON.stringify(embedding));
}

export function getAllChunks() {
  return getDb()
    .prepare('SELECT chunk_id, content, embedding FROM knowledge_chunks')
    .all()
    .map((row) => ({
      chunkId:   row.chunk_id,
      content:   row.content,
      embedding: row.embedding ? JSON.parse(row.embedding) : [],
    }));
}

/** Возвращает только текст чанков — для BM25-ретривера (без парсинга эмбедингов). */
export function getChunkTexts() {
  return getDb()
    .prepare('SELECT chunk_id, content FROM knowledge_chunks')
    .all()
    .map((row) => ({ chunkId: row.chunk_id, content: row.content }));
}

export function getChunkCount() {
  return getDb()
    .prepare('SELECT COUNT(*) as count FROM knowledge_chunks')
    .get().count;
}

export function saveRating({ conversationId, chatId, rating }) {
  getDb()
    .prepare(
      'INSERT INTO llm_ratings (created_at, conversation_id, chat_id, rating) VALUES (?, ?, ?, ?)'
    )
    .run(new Date().toISOString(), conversationId, chatId, rating);
}

// ─── Заявки ─────────────────────────────────────────────────────────────────

export function saveLead(lead) {
  return getDb()
    .prepare(`
      INSERT INTO leads
        (created_at, telegram_id, telegram_username, name, company,
         description, product, phone, email, meeting_datetime)
      VALUES
        (@createdAt, @telegramId, @telegramUsername, @name, @company,
         @description, @product, @phone, @email, @datetime)
    `)
    .run(lead);
}
