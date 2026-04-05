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
  `);
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
