/**
 * Cloudflare Worker — reverse proxy для фронтенда на Vercel
 *
 * Используется как ЗАПАСНОЙ вариант, если стандартный Cloudflare Proxy (оранжевое облако)
 * по какой-либо причине не подошёл.
 *
 * Деплой:
 *   1. Зайдите в Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Вставьте этот код
 *   3. Замените VERCEL_ORIGIN на реальный URL вашего проекта (без слеша в конце)
 *   4. Добавьте маршрут: myfirstproject.su/* → этот Worker
 *      (Workers & Pages → ваш Worker → Settings → Triggers → Add Route)
 *   5. Повторите для www.myfirstproject.su/*
 *
 * Поддомен api.myfirstproject.su НЕ перенаправляется через этот Worker,
 * он имеет собственную DNS-запись CNAME на conslanback-vladislav7599.amvera.io
 */

const VERCEL_ORIGIN = "https://YOUR_PROJECT.vercel.app"; // ← замените!
const ALLOWED_HOSTS = ["myfirstproject.su", "www.myfirstproject.su"];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Пропускаем только разрешённые хосты
    if (!ALLOWED_HOSTS.includes(url.hostname)) {
      return new Response("Not found", { status: 404 });
    }

    // Строим URL к Vercel: меняем хост, путь и параметры оставляем как есть
    const targetUrl = new URL(url.pathname + url.search, VERCEL_ORIGIN);

    // Копируем заголовки, но меняем Host на Vercel
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", new URL(VERCEL_ORIGIN).hostname);

    // Передаём реальный IP пользователя
    const clientIp =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "unknown";
    proxyHeaders.set("X-Real-IP", clientIp);
    proxyHeaders.set("X-Forwarded-For", clientIp);
    proxyHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: proxyHeaders,
      // GET/HEAD не имеют body
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "follow",
    });

    let response;
    try {
      response = await fetch(proxyRequest);
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 502 });
    }

    // Копируем ответ, добавляем security-заголовки
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Proxied-By", "Cloudflare-Worker");
    // Убираем Vercel-специфичные заголовки, которые могут смущать клиента
    newHeaders.delete("x-vercel-id");
    newHeaders.delete("x-vercel-cache");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
