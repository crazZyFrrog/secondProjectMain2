import { Markup } from 'telegraf';
import { STATES, setState, clearSession } from '../states.js';

// ─── База знаний FAQ ────────────────────────────────────────────────────────
// Чтобы добавить/изменить вопрос — правьте этот объект и перезапустите бота.

const FAQ = [
  {
    id: 'price',
    question: '💰 Сколько стоят ваши услуги?',
    answer:
      'Стоимость зависит от объёма и сложности задачи. Разработка сайта — от 50 000 ₽, SEO-продвижение — от 15 000 ₽/мес, контекстная реклама — от 10 000 ₽/мес. Точную цену рассчитаем на встрече.',
  },
  {
    id: 'timeline',
    question: '⏱ Какие сроки выполнения?',
    answer:
      'Сроки зависят от проекта: сайт-визитка — 5–7 рабочих дней, корпоративный сайт — 3–6 недель, SEO-продвижение — первые результаты через 2–3 месяца. Обсудим детали на встрече.',
  },
  {
    id: 'process',
    question: '🔄 Как проходит работа?',
    answer:
      'Весь процесс: бриф → анализ → разработка стратегии → согласование → реализация → сдача и сопровождение. На каждом этапе вы в курсе происходящего.',
  },
  {
    id: 'guarantee',
    question: '🛡 Есть ли гарантии результата?',
    answer:
      'Мы работаем по договору с чётко прописанными KPI и сроками. Если в установленный срок цели не достигнуты — корректируем стратегию бесплатно.',
  },
  {
    id: 'portfolio',
    question: '📁 Где посмотреть портфолио?',
    answer:
      'Портфолио и кейсы доступны на нашем сайте. На встрече покажем примеры, релевантные вашей нише.',
  },
  {
    id: 'contacts',
    question: '📞 Как с вами связаться?',
    answer:
      'Вы можете записаться на встречу прямо здесь, написать на почту info@company.ru или позвонить: +7 (999) 000-00-00. Работаем пн–пт с 9:00 до 18:00 МСК.',
  },
];

// ─── Клавиатуры ────────────────────────────────────────────────────────────

function faqListKeyboard() {
  const rows = FAQ.map((item) => [Markup.button.callback(item.question, `faq:q:${item.id}`)]);
  rows.push([Markup.button.callback('🏠 Главное меню', 'faq:menu')]);
  return Markup.inlineKeyboard(rows);
}

function faqAfterAnswerKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❓ Другой вопрос', 'faq:list')],
    [Markup.button.callback('📅 Записаться на встречу', 'faq:book')],
    [Markup.button.callback('🏠 Главное меню', 'faq:menu')],
  ]);
}

// ─── Старт FAQ-сценария ─────────────────────────────────────────────────────

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
    const id = action.replace('faq:q:', '');
    const item = FAQ.find((f) => f.id === id);
    if (!item) return;
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(`${item.question}\n\n${item.answer}`, faqAfterAnswerKeyboard());
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
