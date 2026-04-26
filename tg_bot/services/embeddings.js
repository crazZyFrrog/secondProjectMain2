import https from 'https';
import { getAccessToken, clearTokenCache } from './gigachatAuth.js';

/**
 * Получает векторное представление (embedding) текста через GigaChat Embeddings API.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  const token = await getAccessToken();

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'Embeddings',
      input: [text],
    });

    const options = {
      hostname: 'gigachat.devices.sberbank.ru',
      port: 443,
      path: '/api/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 401) {
            clearTokenCache();
            return reject(new Error('GigaChat embeddings: токен устарел, повторите запрос'));
          }
          const json = JSON.parse(data);
          if (!json.data?.[0]?.embedding) {
            return reject(
              new Error(`GigaChat embeddings unexpected response: ${data}`)
            );
          }
          resolve(json.data[0].embedding);
        } catch (e) {
          reject(new Error(`GigaChat embeddings parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
