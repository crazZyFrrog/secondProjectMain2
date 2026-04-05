import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { config } from '../config.js';

// Имя листа можно изменить, если в таблице другое название (например "Лист1" или "Sheet1")
const SHEET_NAME = 'Лист1';

// Порядок полей лида, которые пишем в строку
const COLUMNS = [
  'created_at',
  'telegram_id',
  'telegram_username',
  'name',
  'company',
  'description',
  'product',
  'phone',
  'email',
  'datetime',
];

// Русские заголовки — по тому же порядку, что COLUMNS
const HEADERS = [
  'Дата заявки',
  'Telegram ID',
  'Telegram username',
  'Имя',
  'Компания',
  'Описание компании',
  'Услуга',
  'Телефон',
  'E-mail',
  'Дата встречи',
];

let sheetsClient = null;

function getClient() {
  if (!sheetsClient) {
    const keyFile = JSON.parse(readFileSync(config.googleServiceAccountJson, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

/**
 * Добавляет строку с данными лида в Google Sheets.
 * Если лист "Leads" не существует — создаёт заголовки автоматически при первом запуске.
 * @param {object} lead
 */
export async function appendLeadToSheet(lead) {
  if (!config.spreadsheetId) {
    console.warn('SPREADSHEET_ID не задан — запись в Google Sheets пропущена.');
    return;
  }

  const sheets = getClient();
  const row = COLUMNS.map((col) => lead[col] ?? '');

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

/**
 * Создаёт заголовки в таблице (вызывать один раз при настройке).
 */
export async function ensureHeaders() {
  if (!config.spreadsheetId) return;

  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${SHEET_NAME}!A1:Z1`,
  });

  const firstRow = res.data.values?.[0] ?? [];
  if (firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    console.log('Заголовки в Google Sheets созданы.');
  }
}
