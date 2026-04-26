import { Markup } from 'telegraf';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { STATES, setState, clearSession } from '../states.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH   = path.join(__dirname, '../../knowledge.md');
const MAX_FAQ   = 10; // максимум кнопок в FAQ

// ─── Парсинг Q&A из knowledge.md ────────────────────────────────────────────

function parseFaqFromKnowledge() {
  try {
    const text     = readFileSync(KB_PATH, 'utf-8');
    // Разбиваем по --- с любым количеством пробелов/переносов вокруг
    const sections = text.split(/\n\s*---+\s*\n/);
    const items    = [];

    for (const section of sections) {
      if (items.length >= MAX_FAQ) break;
      const match = section.match(/\*\*Q(\d+):\s*(.+?)\*\*\s*\n+([\s\S]+)/);
      if (!match) continue;
      const question = match[2].trim();
      // Берём только первый абзац ответа (до первой пустой строки)
      const fullAnswer = match[3].trim();
      const firstPara  = fullAnswer.split(/\n\n/)[0].replace(/\n/g, ' ').trim();
      const answer     = firstPara.length > 900
        ? firstPara.slice(0, 897) + '…'
        : firstPara;
      if (question && answer) {
        items.push({ id: `q${match[1]}`, question, answer });
      }
    }

    return items.length > 0 ? items : null;
  } catch {
    console.warn('[scenario2] knowledge.md не найден, используется резервный FAQ');
    return null;
  }
}

// Резервный FAQ на случай если knowledge.md недоступен
const FALLBACK_FAQ = [
  { id: 'price',     question: 'Сколько стоят услуги?',          answer: 'Лендинг — 30 000 ₽, интернет-магазин — 70 000 ₽, подписка Pro — 1 990 ₽/мес, поддержка — 5 000 ₽/мес.' },
  { id: 'process',   question: 'Как проходит работа?',           answer: 'Бриф → прототип → дизайн → разработка → сдача. Лендинг занимает 7–14 рабочих дней.' },
  { id: 'payment',   question: 'Как оплатить?',                  answer: '50% предоплата, 50% после сдачи. Банковский перевод или карта.' },
  { id: 'guarantee', question: 'Какие гарантии?',                answer: 'Бесплатное устранение ошибок в течение 30 дней после сдачи.' },
  { id: 'timeline',  question: 'Какие сроки разработки?',        answer: 'Лендинг — 7–14 рабочих дней, интернет-магазин — 21–30 рабочих дней.' },
  { id: 'contacts',  question: 'Как связаться с менеджером?',    answer: 'Нажмите кнопку «Связаться с менеджером» в чате или напишите в рабочее время: пн–пт, 9:00–18:00 МСК.' },
];

// ─── Клавиатуры ─────────────────────────────────────────────────────────────

function getFaq() {
  return parseFaqFromKnowledge() ?? FALLBACK_FAQ;
}

function faqListKeyboard() {
  const faq  = getFaq();
  const rows = faq.map((item) => {
    const label = item.question.length > 52
      ? item.question.slice(0, 50) + '…'
      : item.question;
    return [Markup.button.callback(`❓ ${label}`, `faq:q:${item.id}`)];
  });
  rows.push([Markup.button.callback('🏠 Главное меню', 'faq:menu')]);
  return Markup.inlineKeyboard(rows);
}

function faqAfterAnswerKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❓ Другой вопрос',        'faq:list')],
    [Markup.button.callback('📅 Записаться на встречу', 'faq:book')],
    [Markup.button.callback('🏠 Главное меню',          'faq:menu')],
  ]);
}

// ─── Старт FAQ-сценария ──────────────────────────────────────────────────────

export async function startScenario2(ctx) {
  setState(ctx.chat.id, STATES.S2_FAQ);
  await ctx.reply('❓ Выберите интересующий вопрос:', faqListKeyboard());
}

// ─── Обработка кнопок FAQ ───────────────────────────────────────────────────

export async function handleScenario2Callback(ctx, onBook, onMenu) {
  const action = ctx.callbackQuery.data;
  await ctx.answerCbQuery();

  if (action === 'faq:list') {
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply('❓ Выберите интересующий вопрос:', faqListKeyboard());
    return;
  }

  if (action.startsWith('faq:q:')) {
    const id   = action.replace('faq:q:', '');
    const item = getFaq().find((f) => f.id === id);
    if (!item) return;
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(`❓ ${item.question}\n\n${item.answer}`, faqAfterAnswerKeyboard());
    return;
  }

  if (action === 'faq:book') {
    clearSession(ctx.chat.id);
    await ctx.editMessageReplyMarkup(undefined);
    await onBook(ctx);
    return;
  }

  if (action === 'faq:menu') {
    clearSession(ctx.chat.id);
    await ctx.editMessageReplyMarkup(undefined);
    await onMenu(ctx);
    return;
  }
}
