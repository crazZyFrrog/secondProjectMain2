import OpenAI from 'openai';
import { config } from '../config.js';
import { getConfig } from './db.js';

let client = null;

function getClient() {
  if (!client) {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY не задан в .env');
    }
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

/**
 * Отправляет вопрос пользователя в OpenAI и возвращает ответ.
 * @param {string} userQuestion
 * @returns {Promise<string>}
 */
export async function askAI(userQuestion) {
  const openai = getClient();

  const systemPrompt = getConfig('faq_prompt', 'Ты помощник компании. Отвечай кратко и по делу.');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuestion },
    ],
    max_tokens: 500,
    temperature: 0.5,
  });

  return completion.choices[0].message.content.trim();
}
