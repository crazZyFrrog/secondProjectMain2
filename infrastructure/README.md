# Обход блокировок Vercel IP для myfirstproject.su

## Контекст

| Компонент | Хост | Статус |
|-----------|------|--------|
| Фронтенд (Vite/React) | Vercel | IP 76.76.21.21 / 216.198.79.1 блокируются рядом РФ-провайдеров |
| Бэкенд | Amvera (`conslanback-vladislav7599.amvera.io`) | Работает |
| Домен | `myfirstproject.su` на Reg.ru (NS: ns1/ns2.reg.ru) | Работает |

---

## Вариант 1 (приоритетный) — Cloudflare Proxy

Cloudflare скрывает IP Vercel за своими IP, которые **не блокируются** российскими провайдерами.  
Трафик: `пользователь → Cloudflare (RU-friendly IP) → Vercel`.

### Шаг 1: Регистрация на Cloudflare и добавление домена

1. Перейдите на [cloudflare.com](https://cloudflare.com) → **Sign Up** (бесплатный план)
2. Нажмите **Add a Site** → введите `myfirstproject.su` → выберите план **Free**
3. Cloudflare просканирует DNS и покажет список записей — сохраните его для сравнения
4. Нажмите **Continue**

### Шаг 2: Настройка DNS-записей в Cloudflare

Удалите все импортированные записи и создайте следующие:

| Тип | Имя | Значение | Proxy | Назначение |
|-----|-----|----------|-------|-----------|
| CNAME | `@` (apex) | `cname.vercel-dns.com` | ✅ Proxied | Фронтенд через CF |
| CNAME | `www` | `cname.vercel-dns.com` | ✅ Proxied | www через CF |
| CNAME | `api` | `conslanback-vladislav7599.amvera.io` | ☁ DNS only (серое облако) | Бэкенд напрямую |

> **Почему `cname.vercel-dns.com`?**  
> Cloudflare поддерживает «CNAME flattening» для apex-домена — технически это CNAME на корне, что невозможно в стандартном DNS, но CF делает это автоматически.

> **Почему `api` без прокси?**  
> Amvera не блокируется. Если добавить прокси, Cloudflare подставит свой сертификат и может сломать WebSocket / CORS на бэкенде.

### Шаг 3: Смена NS-серверов на Reg.ru

1. Войдите в [reg.ru](https://reg.ru) → **Мои домены** → `myfirstproject.su`
2. **Управление доменом** → **DNS-серверы**
3. Замените ns1.reg.ru, ns2.reg.ru на серверы, которые дал Cloudflare:
   - Пример: `aria.ns.cloudflare.com`, `bart.ns.cloudflare.com` (у вас будут другие)
4. Нажмите **Изменить** — изменения вступают в силу до 24 часов (обычно 1–2 часа)

### Шаг 4: SSL в Cloudflare

1. **SSL/TLS** → **Overview** → установите режим **Full (strict)**

   | Режим | Когда использовать |
   |-------|--------------------|
   | Flexible | ❌ Никогда — HTTP между CF и Vercel |
   | Full | ✅ Если нет своего сертификата на Vercel |
   | **Full (strict)** | ✅ Лучший вариант — Vercel выдаёт Let's Encrypt |

2. **SSL/TLS** → **Edge Certificates** → включите:
   - **Always Use HTTPS** ✅
   - **Automatic HTTPS Rewrites** ✅
   - **HSTS** — можно включить после проверки, что всё работает (max-age=31536000)

### Шаг 5: Добавление домена в Vercel

> Это обязательно — Vercel должен знать о вашем домене, чтобы выдать на него сертификат и правильно отвечать.

1. Откройте [vercel.com](https://vercel.com) → ваш проект → **Settings** → **Domains**
2. Добавьте `myfirstproject.su` — Vercel попросит CNAME или A-запись
3. Добавьте `www.myfirstproject.su`
4. Vercel автоматически выдаст сертификаты через несколько минут после смены NS

### Шаг 6 (опционально): Page Rules / Cache Rules

Если нужно принудительно кэшировать статику через Cloudflare:

1. **Caching** → **Cache Rules** → **Create rule**
2. Условие: `URI Path` matches `*.js` OR `*.css` OR `*.png` (и т.д.)
3. Cache eligibility: **Eligible for cache**
4. Edge TTL: 1 month

Для SPA-приложения важнее **не** кэшировать `index.html`:
- Условие: `URI Path` equals `/`
- Cache eligibility: **Bypass cache**

---

## Вариант 2 — Cloudflare Worker (запасной)

Используйте этот вариант если:
- Стандартный прокси даёт ошибки 526/522
- Нужна кастомная логика маршрутизации

Файл: [`cloudflare/worker.js`](cloudflare/worker.js)

### Шаг 1: Узнайте реальный URL вашего Vercel-проекта

В Vercel Dashboard → ваш проект → вкладка **Deployments** → скопируйте `*.vercel.app` URL  
(например: `secondprojectmain2-abc123.vercel.app`)

### Шаг 2: Отредактируйте worker.js

```js
// Замените эту строку:
const VERCEL_ORIGIN = "https://YOUR_PROJECT.vercel.app";
// На реальный URL:
const VERCEL_ORIGIN = "https://secondprojectmain2-abc123.vercel.app";
```

### Шаг 3: Задеплойте Worker

**Вариант A — через браузер:**
1. Cloudflare Dashboard → **Workers & Pages** → **Create**
2. Выберите **Create Worker**
3. Вставьте содержимое `worker.js` → **Deploy**

**Вариант Б — через CLI (Wrangler):**
```bash
npm install -g wrangler
cd infrastructure/cloudflare
# Замените YOUR_PROJECT в worker.js, затем:
wrangler deploy
```

### Шаг 4: Привяжите маршруты

1. Workers & Pages → ваш Worker → **Settings** → **Triggers**
2. **Add Route**:
   - Route: `myfirstproject.su/*`
   - Zone: `myfirstproject.su`
3. Повторите для `www.myfirstproject.su/*`

### DNS при использовании Worker

```
A  @    192.0.2.1   (Proxied) ← любой IP, CF перехватит до него
CNAME www  myfirstproject.su  (Proxied)
CNAME api  conslanback-vladislav7599.amvera.io  (DNS only)
```

> IP `192.0.2.1` — специальный «documentation» IP, реально недостижим, но Worker перехватит запрос до него.

---

## Вариант 3 — Собственный VPS как Nginx reverse proxy

Используйте если Cloudflare недоступен или нужен полный контроль.  
Рекомендуемые дешёвые российские VPS: **Selectel**, **Timeweb**, **Beget**, **RuVDS** (от 100 руб/мес).

Файлы:
- [`nginx/nginx.conf`](nginx/nginx.conf) — конфиг Nginx
- [`nginx/setup-ssl.sh`](nginx/setup-ssl.sh) — автоустановка SSL

### Шаг 1: Арендуйте VPS

Минимальные требования: Ubuntu 22.04, 1 CPU, 512 MB RAM, белый IP.

### Шаг 2: Узнайте *.vercel.app URL проекта

Vercel Dashboard → Deployments → скопируйте URL вида `YOUR_PROJECT.vercel.app`

### Шаг 3: Обновите nginx.conf

Откройте `infrastructure/nginx/nginx.conf` и замените **все 4 вхождения**:
```
YOUR_PROJECT.vercel.app → ваш-реальный-проект.vercel.app
```

### Шаг 4: Скопируйте файлы на VPS и запустите скрипт

```bash
# Локально — загрузите файлы на сервер:
scp infrastructure/nginx/nginx.conf root@YOUR_VPS_IP:/tmp/
scp infrastructure/nginx/setup-ssl.sh root@YOUR_VPS_IP:/tmp/

# На сервере:
ssh root@YOUR_VPS_IP
nano /tmp/setup-ssl.sh   # ← замените EMAIL на ваш
chmod +x /tmp/setup-ssl.sh
/tmp/setup-ssl.sh
```

### Шаг 5: Направьте DNS на VPS (в Reg.ru или Cloudflare)

```
A   @    <IP вашего VPS>   (без прокси)
A   www  <IP вашего VPS>   (без прокси)
CNAME api conslanback-vladislav7599.amvera.io
```

> С VPS-вариантом ваш реальный IP виден в DNS. Для скрытия IP можно сочетать:  
> `пользователь → Cloudflare (DNS only серое облако) → ваш VPS → Vercel`

### Проверка работы Nginx

```bash
# Проверить конфиг
nginx -t

# Статус сервиса
systemctl status nginx

# Логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Тест автообновления сертификата
certbot renew --dry-run
```

---

## Сравнение вариантов

| | Cloudflare Proxy | Cloudflare Worker | VPS + Nginx |
|--|------------------|-------------------|-------------|
| Сложность | Низкая | Средняя | Высокая |
| Стоимость | Бесплатно | Бесплатно (100k req/day) | ~100–300 руб/мес |
| Скрытие IP Vercel | ✅ | ✅ | ✅ |
| Задержка | Минимальная (CDN) | Минимальная | Зависит от VPS |
| Контроль | Низкий | Средний | Полный |
| Надёжность | Очень высокая | Очень высокая | Зависит от VPS |
| **Рекомендация** | ⭐ Начать здесь | Запасной | Если нужен полный контроль |

---

## Что происходит с поддоменом api

Во всех трёх вариантах поддомен `api.myfirstproject.su` настроен как **CNAME без прокси**  
→ разрешается напрямую в IP Amvera → бэкенд работает без изменений.

`VITE_API_URL` в `.env.production` остаётся:
```
VITE_API_URL=https://conslanback-vladislav7599.amvera.io/api
```

Если хотите использовать красивый URL `https://api.myfirstproject.su/api`:
1. В Amvera добавьте кастомный домен `api.myfirstproject.su`
2. Измените `VITE_API_URL=https://api.myfirstproject.su/api`
3. Пересоберите фронтенд в Vercel
