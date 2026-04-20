import { askNadezda } from '../services/ai.js';
import { getHistory, addToHistory, clearHistory } from '../states.js';

// ─── Логирование ─────────────────────────────────────────────────────────────

function logRequest(chatId, username, text, result) {
  const ts = new Date().toISOString();
  const user = username ? `@${username}` : `id:${chatId}`;
  console.log(`[${ts}] ${user} | Q: "${text.slice(0, 80)}" | ${result}`);
}

// ─── Обработчик входящего сообщения ─────────────────────────────────────────

/**
 * Главный обработчик LLM-режима (Надежда / OpenAI gpt-4o-mini).
 * Вызывать из bot.on('text') когда пользователь находится в LLM-сессии.
 *
 * @param {import('telegraf').Context} ctx
 */
export async function handleLLMMessage(ctx) {
  const userText = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const username = ctx.from?.username;

  try {
    await ctx.sendChatAction('typing');

    const history = getHistory(chatId);
    let answer;

    try {
      answer = await askNadezda(userText, history);
    } catch (err) {
      if (err.message.includes('токен устарел')) {
        await ctx.sendChatAction('typing');
        answer = await askNadezda(userText, history);
      } else {
        throw err;
      }
    }

    addToHistory(chatId, 'user', userText);
    addToHistory(chatId, 'assistant', answer);

    logRequest(chatId, username, userText, 'OK');
    await ctx.reply(answer);
  } catch (err) {
    logRequest(chatId, username, userText, `ERROR: ${err.message}`);
    console.error('GigaChat error:', err);
    await ctx.reply(
      'Что-то пошло не так. Попробуйте чуть позже или напишите нам напрямую.'
    );
  }
}

/**
 * Отправляет приветствие LLM-режима и сбрасывает историю диалога.
 * @param {import('telegraf').Context} ctx
 */
export async function startLLMScenario(ctx) {
  clearHistory(ctx.chat.id);
  await ctx.reply(
    'Привет! Я Надежда, менеджер LandingBuilder 👋\n\n' +
    'Помогу разобраться с услугами и ценами.\n' +
    'Задайте ваш вопрос — отвечу.\n\n' +
    'Команда /reset — начать диалог заново.'
  );
}

/**
 * Сбрасывает историю диалога для текущего пользователя.
 * @param {import('telegraf').Context} ctx
 */
export async function resetLLMScenario(ctx) {
  clearHistory(ctx.chat.id);
  await ctx.reply('История очищена. Начнём сначала 🔄');
}
