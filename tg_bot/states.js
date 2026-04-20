export const STATES = {
  // Сценарий 1: запись на встречу
  S1_NAME: 'S1_NAME',
  S1_COMPANY: 'S1_COMPANY',
  S1_DESC: 'S1_DESC',
  S1_PRODUCTS: 'S1_PRODUCTS',
  S1_PHONE: 'S1_PHONE',
  S1_EMAIL: 'S1_EMAIL',
  S1_DATETIME: 'S1_DATETIME',
  S1_CONFIRM: 'S1_CONFIRM',

  // Сценарий 2: FAQ
  S2_FAQ: 'S2_FAQ',

  // Сценарий 3: LLM-консультант (Надежда / OpenAI)
  S3_LLM: 'S3_LLM',
};

const MAX_HISTORY = 10;

/**
 * Простое in-memory хранилище сессий.
 * Ключ — chat_id (number), значение — объект { state, data, history }.
 */
const sessions = new Map();

export function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { state: null, data: {}, history: [] });
  }
  return sessions.get(chatId);
}

export function setState(chatId, state) {
  const session = getSession(chatId);
  session.state = state;
}

export function setData(chatId, key, value) {
  const session = getSession(chatId);
  session.data[key] = value;
}

export function clearSession(chatId) {
  sessions.set(chatId, { state: null, data: {}, history: [] });
}

// ─── История диалога (для LLM-сценария) ─────────────────────────────────────

export function getHistory(chatId) {
  return getSession(chatId).history;
}

export function addToHistory(chatId, role, content) {
  const session = getSession(chatId);
  session.history.push({ role, content });
  if (session.history.length > MAX_HISTORY) {
    session.history = session.history.slice(-MAX_HISTORY);
  }
}

export function clearHistory(chatId) {
  const session = getSession(chatId);
  session.history = [];
}
