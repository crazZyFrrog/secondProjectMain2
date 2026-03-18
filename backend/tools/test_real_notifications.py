# -*- coding: utf-8 -*-
"""
Скрипт для тестирования регистрации и смены тарифа с проверкой уведомлений
"""

import httpx
import time

BASE_URL = "http://localhost:5001"

def test_registration():
    print("=" * 70)
    print(" ТЕСТ 1: Регистрация нового пользователя")
    print("=" * 70)
    print()
    
    # Генерируем уникальный email
    timestamp = int(time.time())
    email = f"test_user_{timestamp}@example.com"
    
    print(f"Регистрируем пользователя: {email}")
    print()
    
    try:
        response = httpx.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": "password123",
                "confirm_password": "password123",
                "username": "Тестовый Пользователь Новый",
                "company_type": "small",
                "accept_terms": True,
                "accept_privacy": True
            },
            timeout=10.0
        )
        
        print(f"Статус ответа: {response.status_code}")
        print(f"Ответ сервера:")
        print(response.text)
        print()
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Пользователь успешно зарегистрирован!")
            print()
            print("Проверьте Telegram - должно прийти уведомление:")
            print("  🎉 Новая регистрация пользователя")
            print(f"  Email: {email}")
            print()
            return data.get("token"), data.get("id")
        else:
            print("[ERROR] Ошибка при регистрации")
            return None, None
            
    except Exception as e:
        print(f"[ERROR] Исключение: {e}")
        return None, None


def test_plan_change(token, client_id):
    if not token:
        print("\n[SKIP] Токен не получен, пропускаем тест смены тарифа")
        return
    
    print()
    print("=" * 70)
    print(" ТЕСТ 2: Получение списка тарифов")
    print("=" * 70)
    print()
    
    try:
        # Получаем список тарифов
        response = httpx.get(
            f"{BASE_URL}/api/plans",
            timeout=10.0
        )
        
        if response.status_code == 200:
            plans = response.json()
            print(f"Найдено тарифов: {len(plans)}")
            
            # Находим Pro тариф
            pro_plan = None
            for plan in plans:
                print(f"  - {plan['name']} (ID: {plan['id']})")
                if plan['name'].lower() == 'pro':
                    pro_plan = plan
            
            if not pro_plan:
                print("\n[ERROR] Pro тариф не найден")
                return
            
            print()
            print("=" * 70)
            print(" ТЕСТ 3: Переход на Pro тариф")
            print("=" * 70)
            print()
            
            print(f"Переходим на тариф: {pro_plan['name']}")
            print(f"ID тарифа: {pro_plan['id']}")
            print()
            
            # Меняем тариф на Pro
            response = httpx.patch(
                f"{BASE_URL}/api/clients/me/plan",
                json={"plan_id": pro_plan['id']},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            
            print(f"Статус ответа: {response.status_code}")
            print(f"Ответ сервера:")
            print(response.text)
            print()
            
            if response.status_code == 200:
                print("[OK] Тариф успешно изменён на Pro!")
                print()
                print("Проверьте Telegram - должно прийти уведомление:")
                print("  💎 Новый клиент оформил тариф Pro")
                print()
            else:
                print("[ERROR] Ошибка при смене тарифа")
        else:
            print(f"[ERROR] Ошибка при получении тарифов: {response.status_code}")
            
    except Exception as e:
        print(f"[ERROR] Исключение: {e}")


def main():
    print()
    print("=" * 70)
    print("ТЕСТИРОВАНИЕ TELEGRAM-УВЕДОМЛЕНИЙ")
    print("=" * 70)
    print()
    print("Этот скрипт проверит:")
    print("  1. Регистрацию нового пользователя -> уведомление в Telegram")
    print("  2. Переход на Pro тариф -> уведомление в Telegram")
    print()
    print("Убедитесь, что:")
    print("  - Backend сервер запущен (http://localhost:5001)")
    print("  - Файл .env настроен с токенами Telegram")
    print("  - Вы начали диалог с ботом в Telegram")
    print()
    print("Запускаю тесты...")
    print()
    
    # Тест 1: Регистрация
    token, client_id = test_registration()
    
    if token:
        # Небольшая пауза
        print("Ожидание 2 секунды...")
        time.sleep(2)
        
        # Тест 2: Смена тарифа
        test_plan_change(token, client_id)
    
    print()
    print("=" * 70)
    print(" ИТОГО")
    print("=" * 70)
    print()
    print("Если уведомления не пришли, проверьте:")
    print("  1. Backend запущен и нет ошибок в логах")
    print("  2. Файл backend/.env содержит корректные токены")
    print("  3. Вы начали диалог с ботом (нажали START)")
    print("  4. Интернет-соединение работает")
    print()
    print("Для просмотра логов backend откройте терминал где запущен uvicorn")
    print()


if __name__ == "__main__":
    main()
