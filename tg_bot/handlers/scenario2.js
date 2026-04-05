import { Markup } from 'telegraf';
import { STATES, setState, clearSession } from '../states.js';
import { askAI } from '../services/ai.js';

// ─── Клавиатуры ────────────────────────────────────────────────────────────

function faqMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❓ Задать ещё вопрос', 'faq:again')],
    [Markup.button.callback('📅 Записаться на встречу', 'faq:book')],
    [Markup.button.callback('🏠 Главное меню', 'faq:menu')],
  ]);
}

// ─── Старт FAQ-сценария ─────────────────────────────────────────────────────

export async function startScenario2(ctx) {
  setState(ctx.chat.id, STATES.S2_FAQ);
  await ctx.reply(
    '❓ Задайте ваш вопрос свободным текстом, и я постараюсь ответить.\n\n' +
    '_Например: "Сколько стоит разработка сайта?" или "Что входит в SEO?"_',
    { parse_mode: 'Markdown' }
  );
}

// ─── Обработка вопроса ──────────────────────────────────────────────────────

export async function handleScenario2Text(ctx) {
  const question = ctx.message.text.trim();

  await ctx.sendChatAction('typing');

  let answer;
  try {
    answer = await askAI(question);
  } catch (err) {
    console.error('Ошибка OpenAI:', err);
    answer = 'Извините, сервис временно недоступен. Попробуйте позже или свяжитесь с нами напрямую.';
  }

  await ctx.reply(answer, faqMenuKeyboard());
}

// ─── Обработка кнопок FAQ ───────────────────────────────────────────────────

export async function handleScenario2Callback(ctx, onBook, onMenu) {
  const action = ctx.callbackQuery.data;
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined);

  if (action === 'faq:again') {
    await ctx.reply('Задайте следующий вопрос:');
    return;
  }

  if (action === 'faq:book') {
    clearSession(ctx.chat.id);
    await onBook(ctx);
    return;
  }

  if (action === 'faq:menu') {
    clearSession(ctx.chat.id);
    await onMenu(ctx);
    return;
  }
}
