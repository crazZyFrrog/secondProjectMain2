import { Markup } from 'telegraf';
import { askNadezda } from '../services/ai.js';
import { saveConversation } from '../services/db.js';
import { checkRateLimit } from '../services/rateLimit.js';
import { getHistory, addToHistory, clearHistory } from '../states.js';

export const LLM_MENU_CALLBACK    = 'llm:menu';
export const LLM_MANAGER_CALLBACK = 'llm:manager';

// ─── Клавиатуры ──────────────────────────────────────────────────────────────

/** Кнопки под каждым ответом Надежды. conversationId нужен для оценок. */
function answerKeyboard(conversationId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('👍 Помогло',    `rate:1:${conversationId}`),
      Markup.button.callback('👎 Не помогло', `rate:-1:${conversationId}`),
    ],
    [Markup.button.callback('📞 Связаться с менеджером', LLM_MANAGER_CALLBACK)],
    [Markup.button.callback('🏠 Главное меню',           LLM_MENU_CALLBACK)],
  ]);
}

/** Кнопки для стартового/reset-сообщения (без оценок — нечего оценивать). */
const navKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📞 Связаться с менеджером', LLM_MANAGER_CALLBACK)],
  [Markup.button.callback('🏠 Главное меню',           LLM_MENU_CALLBACK)],
]);

// ─── Логирование ─────────────────────────────────────────────────────────────

function logRequest(chatId, username, text, result) {
  const ts   = new Date().toISOString();
  const user = username ? `@${username}` : `id:${chatId}`;
  console.log(`[${ts}] ${user} | Q: "${text.slice(0, 80)}" | ${result}`);
}

// ─── Обработчик входящего сообщения ─────────────────────────────────────────

export async function handleLLMMessage(ctx) {
  const userText = ctx.message.text.trim();
  const chatId   = ctx.chat.id;
  const username = ctx.from?.username;

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const { allowed, retryAfterSec } = checkRateLimit(chatId);
  if (!allowed) {
    await ctx.reply(
      `⏳ Слишком много запросов. Подождите ${retryAfterSec} сек. и попробуйте снова.`
    );
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const history = getHistory(chatId);
    let answer;
    let usedChunks = [];

    try {
      ({ answer, usedChunks } = await askNadezda(userText, history));
    } catch (err) {
      if (err.message.includes('токен устарел')) {
        await ctx.sendChatAction('typing');
        ({ answer, usedChunks } = await askNadezda(userText, history));
      } else {
        throw err;
      }
    }

    addToHistory(chatId, 'user', userText);
    addToHistory(chatId, 'assistant', answer);

    // ── Сохранить диалог в SQLite ──────────────────────────────────────────
    let conversationId = null;
    try {
      conversationId = saveConversation({
        chatId,
        username,
        question:   userText,
        answer,
        chunksUsed: usedChunks.length > 0 ? usedChunks : null,
      });
    } catch (dbErr) {
      console.error('[LLM] Ошибка записи в БД:', dbErr.message);
    }

    logRequest(chatId, username, userText, 'OK');
    await ctx.reply(answer, answerKeyboard(conversationId));

  } catch (err) {
    logRequest(chatId, username, userText, `ERROR: ${err.message}`);
    console.error('GigaChat error:', err);
    await ctx.reply(
      'Что-то пошло не так. Попробуйте чуть позже или напишите нам напрямую.'
    );
  }
}

// ─── Старт / сброс сценария ──────────────────────────────────────────────────

export async function startLLMScenario(ctx) {
  clearHistory(ctx.chat.id);
  await ctx.reply(
    'Привет! Я Надежда, менеджер LandingBuilder 👋\n\n' +
    'Помогу разобраться с услугами и ценами.\n' +
    'Задайте ваш вопрос — отвечу.\n\n' +
    'Команда /reset — сбросить историю диалога.',
    navKeyboard
  );
}

export async function resetLLMScenario(ctx) {
  clearHistory(ctx.chat.id);
  await ctx.reply('История очищена. Начнём сначала 🔄', navKeyboard);
}
