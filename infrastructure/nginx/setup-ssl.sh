#!/bin/bash
# =============================================================================
# Скрипт первичной настройки VPS-прокси для myfirstproject.su
#
# Тестировался на: Ubuntu 22.04 / Debian 12
# Запускать от root (или через sudo)
#
# Использование:
#   chmod +x setup-ssl.sh
#   sudo ./setup-ssl.sh
# =============================================================================

set -euo pipefail

DOMAIN="myfirstproject.su"
WWW_DOMAIN="www.myfirstproject.su"
EMAIL="your@email.com"          # ← замените на реальный e-mail
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
CONF_FILE="myfirstproject.conf"

echo "================================================"
echo " Установка Nginx + Certbot для $DOMAIN"
echo "================================================"

# ── 1. Обновление пакетов ─────────────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ── 2. Установка Nginx ────────────────────────────────────────────────────────
apt-get install -y nginx curl ufw

# ── 3. Firewall ───────────────────────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 4. Установка Certbot ──────────────────────────────────────────────────────
apt-get install -y snapd
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ── 5. Временный HTTP-конфиг для получения сертификата ───────────────────────
cat > "$NGINX_CONF_DIR/temp-$CONF_FILE" << 'EOF'
server {
    listen 80;
    server_name myfirstproject.su www.myfirstproject.su;
    root /var/www/certbot;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF

mkdir -p /var/www/certbot
ln -sf "$NGINX_CONF_DIR/temp-$CONF_FILE" "$NGINX_ENABLED_DIR/temp-$CONF_FILE"
rm -f "$NGINX_ENABLED_DIR/default"
nginx -t && systemctl reload nginx

# ── 6. Получение SSL-сертификата ──────────────────────────────────────────────
certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN"

# ── 7. Установка основного конфига ────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/nginx.conf" ]; then
    cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF_DIR/$CONF_FILE"
    echo ""
    echo "⚠  ВАЖНО: отредактируйте $NGINX_CONF_DIR/$CONF_FILE"
    echo "   Замените все вхождения YOUR_PROJECT.vercel.app на реальный URL!"
    echo ""
else
    echo "Файл nginx.conf не найден рядом со скриптом. Скопируйте вручную."
fi

rm -f "$NGINX_ENABLED_DIR/temp-$CONF_FILE"
ln -sf "$NGINX_CONF_DIR/$CONF_FILE" "$NGINX_ENABLED_DIR/$CONF_FILE"

nginx -t && systemctl reload nginx

# ── 8. Автообновление сертификата ─────────────────────────────────────────────
systemctl enable snap.certbot.renew.timer

echo ""
echo "✓ Готово! Проверьте: https://www.$DOMAIN"
echo ""
echo "Полезные команды:"
echo "  certbot renew --dry-run       # проверить автообновление"
echo "  nginx -t                      # проверить конфиг nginx"
echo "  systemctl status nginx        # статус nginx"
