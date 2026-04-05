import { Markup } from 'telegraf';
import { STATES, getSession, setState, setData, clearSession } from '../states.js';
import { getMeetingSlots } from '../config.js';
import { appendLeadToSheet } from '../services/sheets.js';
import { notifyManager } from '../services/notifier.js';
import { getProducts, saveLead } from '../services/db.js';

// ─── Кнопка «Отменить» ─────────────────────────────────────────────────────

function cancelRow() {
  return [Markup.button.callback('❌ Отменить', 'cancel')];
}

// ─── Клавиатуры ────────────────────────────────────────────────────────────

function productsKeyboard() {
  const rows = getProducts().map((p) => [Markup.button.callback(p, `product:${p}`)]);
  rows.push(cancelRow());
  return Markup.inlineKeyboard(rows);
}

function slotsKeyboard() {
  const rows = getMeetingSlots().map((s) => [Markup.button.callback(s, `slot:${s}`)]);
  rows.push(cancelRow());
  return Markup.inlineKeyboard(rows);
}

function confirmKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Подтвердить', 'confirm:yes')],
    [Markup.button.callback('✏️ Заполнить заново', 'confirm:no')],
    cancelRow(),
  ]);
}

// Клавиатура с только кнопкой «Отменить» — для шагов со свободным вводом
function cancelKeyboard() {
  return Markup.inlineKeyboard([cancelRow()]);
}

// ─── Шаг 1: старт сценария ─────────────────────────────────────────────────

export async function startScenario1(ctx) {
  setState(ctx.chat.id, STATES.S1_NAME);
  await ctx.reply('Как вас зовут? Введите ваше имя.', cancelKeyboard());
}

// ─── Диспетчер текстовых сообщений для сценария 1 ─────────────────────────

export async function handleScenario1Text(ctx) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);
  const text = ctx.message.text.trim();

  switch (session.state) {
    case STATES.S1_NAME: {
      setData(chatId, 'name', text);
      setState(chatId, STATES.S1_COMPANY);
      await ctx.reply('Введите название вашей компании.', cancelKeyboard());
      break;
    }

    case STATES.S1_COMPANY: {
      setData(chatId, 'company', text);
      setState(chatId, STATES.S1_DESC);
      await ctx.reply('Кратко опишите деятельность компании (1–2 предложения).', cancelKeyboard());
      break;
    }

    case STATES.S1_DESC: {
      setData(chatId, 'description', text);
      setState(chatId, STATES.S1_PRODUCTS);
      await ctx.reply('Выберите интересующую услугу:', productsKeyboard());
      break;
    }

    case STATES.S1_PHONE: {
      const phoneRe = /^[\d\s\+\-\(\)]{7,20}$/;
      if (!phoneRe.test(text)) {
        await ctx.reply('Пожалуйста, введите корректный номер телефона.', cancelKeyboard());
        return;
      }
      setData(chatId, 'phone', text);
      setState(chatId, STATES.S1_EMAIL);
      await ctx.reply('Введите ваш e-mail.', cancelKeyboard());
      break;
    }

    case STATES.S1_EMAIL: {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(text)) {
        await ctx.reply('Пожалуйста, введите корректный e-mail.', cancelKeyboard());
        return;
      }
      setData(chatId, 'email', text);
      setState(chatId, STATES.S1_DATETIME);
      await ctx.reply('Выберите удобное время для встречи:', slotsKeyboard());
      break;
    }

    case STATES.S1_DATETIME: {
      setData(chatId, 'datetime', text);
      setState(chatId, STATES.S1_CONFIRM);
      await showConfirmation(ctx);
      break;
    }

    default:
      break;
  }
}

// ─── Диспетчер callback-кнопок для сценария 1 ─────────────────────────────

export async function handleScenario1Callback(ctx, onMenu) {
  const chatId = ctx.chat.id;
  const callbackData = ctx.callbackQuery.data;

  await ctx.answerCbQuery();

  if (callbackData === 'cancel') {
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(chatId);
    await ctx.reply('Заявка отменена. Возвращаю в главное меню...');
    await onMenu(ctx);
    return;
  }

  if (callbackData.startsWith('product:')) {
    const product = callbackData.replace('product:', '');
    setData(chatId, 'product', product);
    setState(chatId, STATES.S1_PHONE);
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(`Отлично, записал: "${product}".\n\nВведите ваш номер телефона.`, cancelKeyboard());
    return;
  }

  if (callbackData.startsWith('slot:')) {
    const slot = callbackData.replace('slot:', '');
    if (slot === 'Другое время') {
      await ctx.editMessageReplyMarkup(undefined);
      await ctx.reply(
        'Введите удобное дату и время в свободной форме (например: "10 апреля, 14:00").',
        cancelKeyboard()
      );
      return;
    }
    setData(chatId, 'datetime', slot);
    setState(chatId, STATES.S1_CONFIRM);
    await ctx.editMessageReplyMarkup(undefined);
    await showConfirmation(ctx);
    return;
  }

  if (callbackData === 'confirm:yes') {
    await ctx.editMessageReplyMarkup(undefined);
    await finalizeBooking(ctx);
    return;
  }

  if (callbackData === 'confirm:no') {
    await ctx.editMessageReplyMarkup(undefined);
    clearSession(chatId);
    await startScenario1(ctx);
    return;
  }
}

// Экранирует спецсимволы для MarkdownV2
function esc(text) {
  return String(text ?? '').replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

// ─── Подтверждение ─────────────────────────────────────────────────────────

async function showConfirmation(ctx) {
  const { data } = getSession(ctx.chat.id);
  const summary = [
    `👤 *Имя:* ${esc(data.name)}`,
    `🏢 *Компания:* ${esc(data.company)}`,
    `📋 *Деятельность:* ${esc(data.description)}`,
    `🛠 *Услуга:* ${esc(data.product)}`,
    `📞 *Телефон:* ${esc(data.phone)}`,
    `📧 *E\\-mail:* ${esc(data.email)}`,
    `🗓 *Встреча:* ${esc(data.datetime)}`,
  ].join('\n');

  await ctx.reply(
    `*Проверьте данные:*\n\n${summary}`,
    { parse_mode: 'MarkdownV2', ...confirmKeyboard() }
  );
}

// ─── Финализация: запись + уведомление ────────────────────────────────────

async function finalizeBooking(ctx) {
  const chatId = ctx.chat.id;
  const { data } = getSession(chatId);
  const lead = {
    ...data,
    telegramId: chatId,
    telegramUsername: ctx.from.username ?? '',
    createdAt: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
  };

  await ctx.reply('⏳ Сохраняю вашу заявку...');

  try {
    saveLead(lead);

    await Promise.all([
      appendLeadToSheet(lead).catch((e) =>
        console.warn('Google Sheets недоступен, заявка сохранена в БД:', e.message)
      ),
      notifyManager(ctx.telegram, lead),
    ]);

    await ctx.reply(
      '✅ Заявка принята! Менеджер свяжется с вами перед встречей.\n\nВернуться в начало: /start'
    );
  } catch (err) {
    console.error('Ошибка при сохранении заявки:', err);
    await ctx.reply('⚠️ Произошла ошибка при сохранении. Пожалуйста, попробуйте ещё раз или свяжитесь с нами напрямую.');
  }

  clearSession(chatId);
}
