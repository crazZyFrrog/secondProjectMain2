import https from 'https';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { config } from '../config.js';

const TOKEN_CACHE_FILE = './data/gigachat_token.json';
let tokenCache = null;

function loadTokenCache() {
  try {
    if (existsSync(TOKEN_CACHE_FILE)) {
      tokenCache = JSON.parse(readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
    }
  } catch {
    tokenCache = null;
  }
}

function saveTokenCache(token, expiresAt) {
  try {
    writeFileSync(TOKEN_CACHE_FILE, JSON.stringify({ token, expiresAt }), 'utf-8');
  } catch {
    // файловый кэш недоступен — только memory
  }
  tokenCache = { token, expiresAt };
}

loadTokenCache();

export function clearTokenCache() {
  tokenCache = null;
}

export function getAccessToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return Promise.resolve(tokenCache.token);
  }

  return new Promise((resolve, reject) => {
    const credentials = config.gigachatApiKey;
    if (!credentials) {
      return reject(new Error('GIGACHAT_API_KEY не задан в .env'));
    }

    const options = {
      hostname: 'ngw.devices.sberbank.ru',
      port: 9443,
      path: '/api/v2/oauth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: randomUUID(),
        Authorization: `Basic ${credentials}`,
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.access_token) {
            return reject(new Error(`GigaChat auth error: ${data}`));
          }
          saveTokenCache(json.access_token, json.expires_at);
          resolve(json.access_token);
        } catch (e) {
          reject(new Error(`GigaChat token parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write('scope=GIGACHAT_API_PERS');
    req.end();
  });
}
