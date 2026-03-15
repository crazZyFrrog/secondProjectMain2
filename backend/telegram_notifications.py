from __future__ import annotations

import logging
import os
from typing import Dict, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

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


def send_telegram_message(text: str, chat_id: Optional[str] = None, timeout_seconds: float = 5.0) -> None:
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

    try:
        _log_request(safe_url, payload)
        response = httpx.post(url, json=payload, timeout=timeout_seconds)
        _log_response(response.status_code, response.text)

        if response.status_code >= 400:
            logger.error("Telegram API returned error status=%s, body=%s", response.status_code, response.text)
    except httpx.RequestError as exc:
        logger.error("Telegram request failed: %s", exc)
    except Exception as exc:
        logger.error("Unexpected error during Telegram request: %s", exc)


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
    text = (
        "<b>Новый клиент оформил тариф</b>\n"
        f"Тариф: <b>{plan_name}</b>\n"
        f"Email: <code>{email}</code>\n"
        f"ID клиента: <code>{client_id}</code>"
    )
    send_telegram_message(text=text)


def send_test_message(text: Optional[str] = None, chat_id: Optional[str] = None) -> None:
    """
    Служебная отправка тестового сообщения в Telegram из админки/эндпоинта.
    """
    message = text or "Тестовое сообщение от Landing Constructor API"
    send_telegram_message(text=message, chat_id=chat_id)

