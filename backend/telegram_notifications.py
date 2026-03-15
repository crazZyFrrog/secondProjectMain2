from __future__ import annotations

import logging
import os
import time
from typing import Dict, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

# Настраиваем логирование
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("telegram_notifications")

TELEGRAM_API_BASE = "https://api.telegram.org"


def _get_telegram_settings() -> Dict[str, str]:
    """
    Загружает настройки Telegram из переменных окружения.

    Обязательные переменные:
    - TELEGRAM_BOT_TOKEN
    - TELEGRAM_MANAGER_CHAT_ID
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_MANAGER_CHAT_ID", "").strip()

    if not token or not chat_id:
        raise RuntimeError("TELEGRAM_BOT_TOKEN и TELEGRAM_MANAGER_CHAT_ID должны быть заданы в .env")

    return {"token": token, "chat_id": chat_id}


def _log_request(url: str, payload: Dict[str, object]) -> None:
    logger.info("Telegram request: POST %s, payload=%s", url, payload)


def _log_response(status_code: int, body: str) -> None:
    logger.info("Telegram response: status=%s, body=%s", status_code, body)


def send_telegram_message(text: str, chat_id: Optional[str] = None, timeout_seconds: float = 10.0) -> None:
    """
    Отправляет произвольное сообщение в Telegram.

    Любые ошибки логируются и не пробрасываются дальше, чтобы не блокировать основной сценарий.
    """
    try:
        settings = _get_telegram_settings()
    except Exception as exc:
        logger.error("Telegram settings error: %s", exc)
        return

    token = settings["token"]
    target_chat_id = chat_id or settings["chat_id"]

    url = f"{TELEGRAM_API_BASE}/bot{token}/sendMessage"
    # Маскируем токен в логах
    safe_url = url.replace(token, "***")

    payload: Dict[str, object] = {
        "chat_id": target_chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    # Небольшой механизм ретраев для нестабильной сети (например, таймауты TLS handhshake).
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
            _log_request(safe_url, payload)
            response = httpx.post(
                url,
                json=payload,
                timeout=httpx.Timeout(timeout_seconds),
            )
            _log_response(response.status_code, response.text)

            if response.status_code >= 400:
                logger.error(
                    "Telegram API returned error status=%s, body=%s",
                    response.status_code,
                    response.text,
                )
            # Успешный HTTP‑ответ (даже если 4xx/5xx) — выходим из цикла ретраев.
            break
        except httpx.RequestError as exc:
            logger.error(
                "Telegram request failed on attempt %s/%s: %s",
                attempt,
                max_attempts,
                exc,
            )
            if attempt < max_attempts:
                # Экспоненциальная задержка перед повтором
                sleep_seconds = 2 ** (attempt - 1)
                time.sleep(sleep_seconds)
        except Exception as exc:
            logger.error("Unexpected error during Telegram request: %s", exc)
            break


def send_new_user_registration_notification(
    *,
    email: str,
    username: str,
    company_type: str,
    client_id: str,
) -> None:
    """
    Отправляет уведомление о регистрации нового пользователя.
    Ошибки логируются, но не прерывают основной сценарий.
    """
    company_type_ru = "Малый бизнес" if company_type == "small" else "Крупный бизнес"
    text = (
        "🎉 <b>Новая регистрация пользователя</b>\n\n"
        f"👤 Имя: <b>{username}</b>\n"
        f"📧 Email: <code>{email}</code>\n"
        f"🏢 Тип компании: {company_type_ru}\n"
        f"🆔 ID клиента: <code>{client_id}</code>\n"
        f"📦 Текущий тариф: <b>Free</b>"
    )
    send_telegram_message(text=text)


def send_new_plan_purchase_notification(
    *,
    email: str,
    plan_name: str,
    client_id: str,
) -> None:
    """
    Отправляет уведомление о новом оформлении тарифа Pro/Enterprise.
    Ошибки логируются, но не прерывают основной сценарий.
    """
    icon = "💎" if plan_name.lower() == "pro" else "👑"
    text = (
        f"{icon} <b>Новый клиент оформил тариф {plan_name}</b>\n\n"
        f"📦 Тариф: <b>{plan_name}</b>\n"
        f"📧 Email: <code>{email}</code>\n"
        f"🆔 ID клиента: <code>{client_id}</code>"
    )
    send_telegram_message(text=text)


def send_test_message(text: Optional[str] = None, chat_id: Optional[str] = None) -> None:
    """
    Служебная отправка тестового сообщения в Telegram из админки/эндпоинта.
    """
    message = text or "Тестовое сообщение от Landing Constructor API"
    send_telegram_message(text=message, chat_id=chat_id)

