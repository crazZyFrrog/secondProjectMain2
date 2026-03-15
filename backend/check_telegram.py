# -*- coding: utf-8 -*-
"""
Скрипт для проверки Chat ID и получения информации о боте.
"""

import os
import sys
import httpx
from dotenv import load_dotenv

load_dotenv()

def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_MANAGER_CHAT_ID", "").strip()
    
    if not token:
        print("[ERROR] TELEGRAM_BOT_TOKEN не найден в .env файле")
        return
    
    if not chat_id:
        print("[ERROR] TELEGRAM_MANAGER_CHAT_ID не найден в .env файле")
        return
    
    print("=" * 60)
    print("Проверка настроек Telegram бота")
    print("=" * 60)
    print()
    print(f"Token (первые 10 символов): {token[:10]}...")
    print(f"Chat ID: {chat_id}")
    print()
    
    # Проверка 1: Информация о боте
    print("[TEST 1] Получение информации о боте...")
    url = f"https://api.telegram.org/bot{token}/getMe"
    try:
        response = httpx.get(url, timeout=10.0)
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                bot_info = data.get("result", {})
                print(f"[OK] Бот найден!")
                print(f"  - Имя: {bot_info.get('first_name')}")
                print(f"  - Username: @{bot_info.get('username')}")
                print(f"  - ID: {bot_info.get('id')}")
            else:
                print(f"[ERROR] Ошибка от Telegram: {data}")
        else:
            print(f"[ERROR] HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] Ошибка при запросе: {e}")
    print()
    
    # Проверка 2: Получение обновлений
    print("[TEST 2] Проверка доступных чатов...")
    url = f"https://api.telegram.org/bot{token}/getUpdates"
    try:
        response = httpx.get(url, timeout=10.0)
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                updates = data.get("result", [])
                if updates:
                    print(f"[OK] Найдено {len(updates)} обновлений")
                    print("\nДоступные чаты:")
                    seen_chats = set()
                    for update in updates:
                        if "message" in update:
                            chat = update["message"].get("chat", {})
                            chat_id_found = chat.get("id")
                            if chat_id_found not in seen_chats:
                                seen_chats.add(chat_id_found)
                                print(f"  - Chat ID: {chat_id_found}")
                                print(f"    Тип: {chat.get('type')}")
                                if chat.get("username"):
                                    print(f"    Username: @{chat.get('username')}")
                                if chat.get("first_name"):
                                    print(f"    Имя: {chat.get('first_name')}")
                                print()
                else:
                    print("[WARNING] Обновлений не найдено")
                    print("\n[!] Бот не получал сообщений!")
                    print("    Отправьте боту любое сообщение в Telegram и запустите скрипт снова")
            else:
                print(f"[ERROR] Ошибка от Telegram: {data}")
        else:
            print(f"[ERROR] HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] Ошибка при запросе: {e}")
    print()
    
    # Проверка 3: Попытка отправки сообщения
    print("[TEST 3] Попытка отправки тестового сообщения...")
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        response = httpx.post(
            url,
            json={
                "chat_id": chat_id,
                "text": "✅ Тест соединения - всё работает!",
            },
            timeout=10.0
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                print("[OK] Сообщение успешно отправлено!")
                print("    Проверьте Telegram - должно прийти сообщение")
            else:
                print(f"[ERROR] Ошибка от Telegram: {data}")
                error_code = data.get("error_code")
                description = data.get("description")
                
                if error_code == 404:
                    print("\n[!] Ошибка 404: Чат не найден")
                    print("    Возможные причины:")
                    print("    1. Вы не начали диалог с ботом (не нажали Start)")
                    print("    2. Chat ID неверный")
                    print("\n    Что делать:")
                    print("    1. Найдите вашего бота в Telegram")
                    print("    2. Нажмите кнопку 'Start' или отправьте любое сообщение")
                    print("    3. Запустите этот скрипт снова")
                elif error_code == 401:
                    print("\n[!] Ошибка 401: Неверный токен бота")
                    print("    Проверьте TELEGRAM_BOT_TOKEN в файле .env")
                else:
                    print(f"\n[!] Ошибка {error_code}: {description}")
        else:
            print(f"[ERROR] HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] Ошибка при запросе: {e}")
    print()
    
    print("=" * 60)
    print("Диагностика завершена")
    print("=" * 60)

if __name__ == "__main__":
    main()
