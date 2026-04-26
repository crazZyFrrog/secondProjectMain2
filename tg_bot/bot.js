import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { STATES, getSession, setState, clearSession } from './states.js';
import { startScenario1, handleScenario1Text, handleScenario1Callback } from './handlers/scenario1.js';
import { startScenario2, handleScenario2Callback } from './handlers/scenario2.js';
import { startLLMScenario, handleLLMMessage, resetLLMScenario, LLM_MENU_CALLBACK, LLM_MANAGER_CALLBACK } from './handlers/scenarioLLM.js';
import { saveRating } from './services/db.js';
import { ensureHeaders } from './services/sheets.js';

if (!config.botToken) {
  console.error('❌ BOT_TOKEN не задан в .env');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

// ─── Главное меню ───────────────────────────────────────────────────────────

function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📅 Записаться на встречу', 'menu:book')],
    [Markup.button.callback('❓ Часто задаваемые вопросы', 'menu:faq')],
    [Markup.button.callback('🤖 Консультант по тарифам', 'menu:llm')],
  ]);
}

async function showMainMenu(ctx) {
  clearSession(ctx.chat.id);
  await ctx.reply(
    '👋 Добро пожаловать!\n\nЧем могу помочь?',
    mainMenuKeyboard()
  );
}

// ─── Команды ────────────────────────────────────────────────────────────────

bot.start(showMainMenu);
bot.command('menu', showMainMenu);
bot.command('myid', (ctx) =>
  ctx.reply(`Ваш chat_id: ${ctx.chat.id}`)
);
bot.command('ai', async (ctx) => {
  clearSession(ctx.chat.id);
  setState(ctx.chat.id, STATES.S3_LLM);
  await startLLMScenario(ctx);
});

bot.command('reset', async (ctx) => {
  const session = getSession(ctx.chat.id);
  if (session.state === STATES.S3_LLM) {
    await resetLLMScenario(ctx);
  } else {
    clearSession(ctx.chat.id);
    await showMainMenu(ctx);
  }
});

// ─── Callback-обработчики (кнопки) ─────────────────────────────────────────

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === 'menu:book') {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(ctx.chat.id);
    return startScenario1(ctx);
  }

  if (data === 'menu:faq') {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(ctx.chat.id);
    return startScenario2(ctx);
  }

  if (data === 'menu:llm') {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(ctx.chat.id);
    setState(ctx.chat.id, STATES.S3_LLM);
    return startLLMScenario(ctx);
  }

  // Сценарий 1 (product:, slot:, confirm:, cancel)
  const s1Prefixes = ['product:', 'slot:', 'confirm:', 'cancel'];
  if (s1Prefixes.some((p) => data.startsWith(p))) {
    return handleScenario1Callback(ctx, showMainMenu);
  }

  // Сценарий 2 (faq:)
  if (data.startsWith('faq:')) {
    return handleScenario2Callback(ctx, startScenario1, showMainMenu);
  }

  // Кнопка «Главное меню» из LLM-режима
  if (data === LLM_MENU_CALLBACK) {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(ctx.chat.id);
    return showMainMenu(ctx);
  }

  // Кнопка «Связаться с менеджером»
  if (data === LLM_MANAGER_CALLBACK) {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(
      '📞 Менеджер свяжется с вами в ближайшее время.\n\n' +
      'Рабочие часы: пн–пт, 9:00–18:00 МСК.\n' +
      'Если хотите ускорить — напишите нам напрямую или запишитесь на встречу.',
      Markup.inlineKeyboard([
        [Markup.button.callback('📅 Записаться на встречу', 'menu:book')],
        [Markup.button.callback('🏠 Главное меню',           LLM_MENU_CALLBACK)],
      ])
    );
    return;
  }

  // Оценка ответа 👍/👎
  if (data.startsWith('rate:')) {
    const [, rawRating, rawId] = data.split(':');
    const rating         = parseInt(rawRating, 10);
    const conversationId = parseInt(rawId, 10);

    await ctx.answerCbQuery(rating === 1 ? '👍 Спасибо за оценку!' : '👎 Учтём, спасибо!');
    await ctx.editMessageReplyMarkup(undefined);

    if (!isNaN(conversationId)) {
      try {
        saveRating({ conversationId, chatId: ctx.chat.id, rating });
      } catch (err) {
        console.error('[rating] Ошибка записи в БД:', err.message);
      }
    }
    return;
  }

  await ctx.answerCbQuery('Неизвестная команда.');
});

// ─── Текстовые сообщения — диспетчер по состоянию ───────────────────────────

bot.on('text', async (ctx) => {
  const session = getSession(ctx.chat.id);

  const s1States = [
    STATES.S1_NAME,
    STATES.S1_COMPANY,
    STATES.S1_DESC,
    STATES.S1_PHONE,
    STATES.S1_EMAIL,
    STATES.S1_DATETIME,
  ];

  if (s1States.includes(session.state)) {
    return handleScenario1Text(ctx);
  }

  // В FAQ теперь только кнопки — свободный текст возвращает в меню
  if (session.state === STATES.S2_FAQ) {
    await ctx.reply('Пожалуйста, выберите вопрос из списка выше или вернитесь в меню: /menu');
    return;
  }

  // LLM-консультант
  if (session.state === STATES.S3_LLM) {
    return handleLLMMessage(ctx);
  }

  await showMainMenu(ctx);
});

// ─── Запуск ─────────────────────────────────────────────────────────────────

async function main() {
  // Проверка заголовков Google Sheets — в фоне, не блокирует старт
  ensureHeaders().catch((err) =>
    console.warn('Google Sheets недоступен:', err.message)
  );

  // В Telegraf 4.x launch() — бесконечный промис, поэтому лог до него
  bot.launch().catch((err) => {
    console.error('Ошибка запуска бота:', err.message);
    process.exit(1);
  });
  console.log('✅ Бот запущен. Нажмите Ctrl+C для остановки.');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main();
