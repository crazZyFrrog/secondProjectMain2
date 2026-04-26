// In-memory rate limiter: не более RATE_LIMIT запросов за WINDOW_MS на пользователя.

const RATE_LIMIT = 10;       // макс. запросов
const WINDOW_MS  = 60_000;   // окно — 1 минута

const userTimestamps = new Map();

/**
 * Проверяет, не превысил ли пользователь лимит запросов.
 * @param {number} chatId
 * @returns {{ allowed: boolean, retryAfterSec: number }}
 */
export function checkRateLimit(chatId) {
  const now  = Date.now();
  const prev = (userTimestamps.get(chatId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (prev.length >= RATE_LIMIT) {
    const oldest       = prev[0];
    const retryAfterMs = WINDOW_MS - (now - oldest);
    return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  prev.push(now);
  userTimestamps.set(chatId, prev);
  return { allowed: true, retryAfterSec: 0 };
}
