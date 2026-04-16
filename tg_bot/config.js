import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN,
  managerChatId: process.env.MANAGER_CHAT_ID,
  openaiApiKey: process.env.OPENAI_API_KEY,
  gigachatApiKey: process.env.GIGACHAT_API_KEY,
  spreadsheetId: process.env.SPREADSHEET_ID,
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? './service-account.json',
  sqliteDbPath: process.env.SQLITE_DB_PATH ?? './data/bot.db',
};

// Слоты генерируются динамически при каждом вызове — актуальные даты по МСК.
// Слоты, время которых уже прошло, автоматически исключаются.
export function getMeetingSlots() {
  const tz = 'Europe/Moscow';

  const nowMsk = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));

  const fmt = (date) =>
    date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: tz });

  const candidates = [];
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const day = new Date(nowMsk);
    day.setDate(nowMsk.getDate() + dayOffset);
    const dayStr = fmt(day);

    for (const [h, m] of [[10, 0], [12, 0], [14, 0], [16, 0], [18, 0]]) {
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      if (slot - nowMsk > 30 * 60 * 1000) {
        candidates.push(`${dayStr}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
  }

  candidates.push('Другое время');
  return candidates;
}
