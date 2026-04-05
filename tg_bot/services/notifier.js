import { config } from '../config.js';

// Экранирует спецсимволы для MarkdownV2
function esc(text) {
  return String(text ?? '').replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Отправляет менеджеру уведомление о новой заявке.
 * @param {import('telegraf').Telegram} telegram
 * @param {object} lead
 */
export async function notifyManager(telegram, lead) {
  if (!config.managerChatId) {
    console.warn('MANAGER_CHAT_ID не задан — уведомление менеджеру пропущено.');
    return;
  }

  const username = lead.telegramUsername ? `@${esc(lead.telegramUsername)}` : `id: ${esc(lead.telegramId)}`;

  const message = [
    '🔔 *Новая заявка на встречу*',
    '',
    `👤 *Имя:* ${esc(lead.name)}`,
    `🏢 *Компания:* ${esc(lead.company)}`,
    `📋 *Деятельность:* ${esc(lead.description)}`,
    `🛠 *Услуга:* ${esc(lead.product)}`,
    `📞 *Телефон:* ${esc(lead.phone)}`,
    `📧 *E\\-mail:* ${esc(lead.email)}`,
    `🗓 *Встреча:* ${esc(lead.datetime)}`,
    `💬 *Telegram:* ${username}`,
    `⏰ *Время заявки:* ${esc(lead.createdAt)}`,
  ].join('\n');

  console.log(`Отправляю уведомление на MANAGER_CHAT_ID: ${config.managerChatId}`);
  await telegram.sendMessage(config.managerChatId, message, { parse_mode: 'MarkdownV2' });
  console.log('Уведомление менеджеру отправлено успешно.');
}
