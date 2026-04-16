import { askGigaChat } from '../services/gigachat.js';

// ─── Ключевые слова для pre-filter ──────────────────────────────────────────

const ALLOWED_KEYWORDS = [
  'тариф', 'цена', 'стоимость', 'лендинг', 'сайт',
  'шаблон', 'подписка', 'проект', 'план', 'free',
  'pro', 'enterprise', 'экспорт', 'платформ', 'возможност',
];

const OFF_TOPIC_REPLY =
  'Я могу помочь только с вопросами о тарифах и создании лендингов 🙂';

// ─── Логирование ─────────────────────────────────────────────────────────────

function logRequest(chatId, username, text, result) {
  const ts = new Date().toISOString();
  const user = username ? `@${username}` : `id:${chatId}`;
  console.log(`[${ts}] ${user} | Q: "${text.slice(0, 80)}" | ${result}`);
}

// ─── Pre-filter ──────────────────────────────────────────────────────────────

function isOnTopic(text) {
  const lower = text.toLowerCase();
  return ALLOWED_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Обработчик входящего сообщения ─────────────────────────────────────────

/**
 * Главный обработчик LLM-режима.
 * Вызывать из bot.on('text') когда пользователь находится в LLM-сессии.
 *
 * @param {import('telegraf').Context} ctx
 */
export async function handleLLMMessage(ctx) {
  const userText = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const username = ctx.from?.username;

  if (!isOnTopic(userText)) {
    logRequest(chatId, username, userText, 'FILTERED (off-topic)');
    await ctx.reply(OFF_TOPIC_REPLY);
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const answer = await askGigaChat(userText);

    logRequest(chatId, username, userText, 'OK');
    await ctx.reply(answer);
  } catch (err) {
    logRequest(chatId, username, userText, `ERROR: ${err.message}`);
    console.error('GigaChat error:', err);

    if (err.message.includes('токен устарел')) {
      try {
        await ctx.sendChatAction('typing');
        const answer = await askGigaChat(userText);
        await ctx.reply(answer);
      } catch (retryErr) {
        console.error('GigaChat retry error:', retryErr);
        await ctx.reply(
          'Извините, сервис временно недоступен. Попробуйте немного позже.'
        );
      }
    } else {
      await ctx.reply(
        'Извините, произошла ошибка при обработке запроса. Попробуйте позже.'
      );
    }
  }
}

/**
 * Отправляет приветствие LLM-режима.
 * @param {import('telegraf').Context} ctx
 */
export async function startLLMScenario(ctx) {
  await ctx.reply(
    '🤖 Режим консультанта активирован!\n\n' +
    'Я отвечаю на вопросы о:\n' +
    '• Тарифах и ценах\n' +
    '• Создании лендингов\n' +
    '• Возможностях платформы\n' +
    '• Шаблонах и проектах\n\n' +
    'Задайте ваш вопрос:'
  );
}
