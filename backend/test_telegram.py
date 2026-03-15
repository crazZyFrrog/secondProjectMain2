#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для проверки настройки Telegram-уведомлений.
Запускается из папки backend:
    python test_telegram.py
"""

from __future__ import annotations

import sys
import os
from pathlib import Path

# Устанавливаем кодировку для Windows
if sys.platform == 'win32':
    os.system('chcp 65001 > nul')
    
# Добавляем текущую директорию в путь для импорта модулей
sys.path.insert(0, str(Path(__file__).parent))

from telegram_notifications import (
    send_test_message,
    send_new_user_registration_notification,
    send_new_plan_purchase_notification,
)


def main():
    print("=" * 60)
    print("Тестирование Telegram-уведомлений")
    print("=" * 60)
    print()

    # Тест 1: Отправка тестового сообщения
    print("[TEST 1] Отправка простого тестового сообщения...")
    try:
        send_test_message(text="[OK] Тестовое сообщение от скрипта test_telegram.py")
        print("[OK] Тестовое сообщение отправлено (проверьте Telegram)")
    except Exception as e:
        print(f"[ERROR] Ошибка при отправке тестового сообщения: {e}")
    print()

    # Тест 2: Уведомление о регистрации нового пользователя
    print("[TEST 2] Уведомление о регистрации нового пользователя...")
    try:
        send_new_user_registration_notification(
            email="test_user@example.com",
            username="Тестовый Пользователь",
            company_type="small",
            client_id="test-client-123",
        )
        print("[OK] Уведомление о регистрации отправлено (проверьте Telegram)")
    except Exception as e:
        print(f"[ERROR] Ошибка при отправке уведомления о регистрации: {e}")
    print()

    # Тест 3: Уведомление о переходе на Pro тариф
    print("[TEST 3] Уведомление о переходе на Pro тариф...")
    try:
        send_new_plan_purchase_notification(
            email="test_user@example.com",
            plan_name="Pro",
            client_id="test-client-123",
        )
        print("[OK] Уведомление о Pro тарифе отправлено (проверьте Telegram)")
    except Exception as e:
        print(f"[ERROR] Ошибка при отправке уведомления о тарифе: {e}")
    print()

    # Тест 4: Уведомление о переходе на Enterprise тариф
    print("[TEST 4] Уведомление о переходе на Enterprise тариф...")
    try:
        send_new_plan_purchase_notification(
            email="test_user@example.com",
            plan_name="Enterprise",
            client_id="test-client-123",
        )
        print("[OK] Уведомление о Enterprise тарифе отправлено (проверьте Telegram)")
    except Exception as e:
        print(f"[ERROR] Ошибка при отправке уведомления о тарифе: {e}")
    print()

    print("=" * 60)
    print("Тестирование завершено!")
    print("=" * 60)
    print()
    print("Проверьте Telegram - должно прийти 4 сообщения:")
    print("1. Простое тестовое сообщение")
    print("2. Уведомление о регистрации пользователя")
    print("3. Уведомление о покупке Pro тарифа")
    print("4. Уведомление о покупке Enterprise тарифа")
    print()
    print("Если сообщения не пришли, проверьте:")
    print("- Наличие файла .env в папке backend")
    print("- Корректность TELEGRAM_BOT_TOKEN")
    print("- Корректность TELEGRAM_MANAGER_CHAT_ID")
    print("- Что вы отправили хотя бы одно сообщение боту в Telegram")


if __name__ == "__main__":
    main()
