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
};

/**
 * Простое in-memory хранилище сессий.
 * Ключ — chat_id (number), значение — объект { state, data }.
 */
const sessions = new Map();

export function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { state: null, data: {} });
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
  sessions.set(chatId, { state: null, data: {} });
}
