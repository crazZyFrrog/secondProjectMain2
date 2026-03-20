from __future__ import annotations

import json
import secrets
from datetime import datetime
from uuid import uuid4

from backend.auth import hash_password
from backend.db import get_connection, init_db


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def seed() -> None:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Проверка количества записей
        cursor.execute("SELECT COUNT(1) AS cnt FROM plans")
        result = cursor.fetchone()
        plans_count = result[0] if isinstance(result, tuple) else result.get('cnt', 0) if isinstance(result, dict) else 0
        
        cursor.execute("SELECT COUNT(1) AS cnt FROM templates")
        result = cursor.fetchone()
        templates_count = result[0] if isinstance(result, tuple) else result.get('cnt', 0) if isinstance(result, dict) else 0
        
        cursor.execute("SELECT COUNT(1) AS cnt FROM clients")
        result = cursor.fetchone()
        clients_count = result[0] if isinstance(result, tuple) else result.get('cnt', 0) if isinstance(result, dict) else 0

        if plans_count == 0:
            starter_id = str(uuid4())
            pro_id = str(uuid4())
            enterprise_id = str(uuid4())
            conn.execute(
                "INSERT INTO plans (id, name, features, limits) VALUES (?, ?, ?, ?)",
                (
                    starter_id,
                    "Starter",
                    json.dumps(["Templates: 3", "Projects: 1", "Exports: HTML"], ensure_ascii=False),
                    json.dumps({"projects": 1, "templates": 3}, ensure_ascii=False),
                ),
            )
            conn.execute(
                "INSERT INTO plans (id, name, features, limits) VALUES (?, ?, ?, ?)",
                (
                    pro_id,
                    "Pro",
                    json.dumps(
                        ["Templates: 12", "Projects: 10", "Exports: HTML/PDF/DOCX"],
                        ensure_ascii=False,
                    ),
                    json.dumps({"projects": 10, "templates": 12}, ensure_ascii=False),
                ),
            )
            conn.execute(
                "INSERT INTO plans (id, name, features, limits) VALUES (?, ?, ?, ?)",
                (
                    enterprise_id,
                    "Enterprise",
                    json.dumps(
                        ["Unlimited templates", "Unlimited projects", "Priority support"],
                        ensure_ascii=False,
                    ),
                    None,
                ),
            )
        else:
            starter_id = cursor.execute(
                "SELECT id FROM plans WHERE name = ?",
                ("Starter",),
            ).fetchone()
            starter_id = starter_id[0] if starter_id else None

        if templates_count == 0:
            templates = [
                (
                    "modern-business",
                    "Современный Бизнес",
                    "Бизнес",
                    0,
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
                    "Минималистичный шаблон для B2B компаний",
                ),
                (
                    "creative-agency",
                    "Креативное Агентство",
                    "Дизайн",
                    1,
                    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600",
                    "Яркий шаблон для креативных студий",
                ),
                (
                    "tech-startup",
                    "Tech Стартап",
                    "IT",
                    0,
                    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600",
                    "Современный шаблон для технологических компаний",
                ),
                (
                    "medical-clinic",
                    "Медицинская Клиника",
                    "Медицина",
                    1,
                    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600",
                    "Профессиональный шаблон для медицинских учреждений",
                ),
                (
                    "real-estate",
                    "Недвижимость",
                    "Недвижимость",
                    0,
                    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600",
                    "Элегантный шаблон для агентств недвижимости",
                ),
                (
                    "education",
                    "Образовательный Центр",
                    "Образование",
                    1,
                    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600",
                    "Дружелюбный шаблон для образовательных проектов",
                ),
            ]
            conn.executemany(
                """
                INSERT INTO templates (id, name, category, is_premium, preview_image, description)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                templates,
            )

        if clients_count == 0:
            client_id = str(uuid4())
            conn.execute(
                """
                INSERT INTO clients (id, company_type, username, email, password_hash, plan_id, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    client_id,
                    "small",
                    "Demo User",
                    "demo@example.com",
                    hash_password("demo1234"),
                    starter_id,
                    "user",
                    now_iso(),
                ),
            )
            conn.execute(
                """
                INSERT INTO clients (id, company_type, username, email, password_hash, plan_id, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    "small",
                    "Admin",
                    "admin@example.com",
                    hash_password("admin1234"),
                    starter_id,
                    "admin",
                    now_iso(),
                ),
            )
            conn.execute(
                """
                INSERT INTO clients (id, company_type, username, email, password_hash, plan_id, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    "small",
                    "Manager",
                    "manager@example.com",
                    hash_password("manager1234"),
                    starter_id,
                    "manager",
                    now_iso(),
                ),
            )

            project_id = str(uuid4())
            now = now_iso()
            project_data = {
                "company": {
                    "name": "Demo Co",
                    "logo": "",
                    "description": "Демо-проект",
                    "mission": "",
                    "values": [],
                },
                "products": [],
                "audience": [],
                "benefits": [],
                "pricing": [],
                "contacts": {"phone": "", "email": "", "address": "", "socials": {}},
                "cases": [],
                "faq": [],
            }
            conn.execute(
                """
                INSERT INTO projects (
                    id, client_id, name, template_id, created_at, updated_at, status, thumbnail_url, data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    client_id,
                    "Demo Project",
                    "modern-business",
                    now,
                    now,
                    "draft",
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
                    json.dumps(project_data, ensure_ascii=False),
                ),
            )

            conn.execute(
                """
                INSERT INTO exports (id, project_id, format, size, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    project_id,
                    "PDF",
                    "1.2 MB",
                    now,
                ),
            )

            notifications = [
                ("Email уведомления о новых функциях", True),
                ("Уведомления об экспорте проектов", True),
                ("Маркетинговые рассылки", False),
                ("Советы по использованию платформы", True),
            ]
            for label, checked in notifications:
                conn.execute(
                    """
                    INSERT INTO notifications (id, client_id, label, checked)
                    VALUES (?, ?, ?, ?)
                    """,
                    (str(uuid4()), client_id, label, int(checked)),
                )

            payments = [
                ("1990 ₽", "Оплачено", "04 фев 2026"),
                ("1990 ₽", "Оплачено", "04 янв 2026"),
            ]
            for amount, status, paid_at in payments:
                conn.execute(
                    """
                    INSERT INTO payments (id, client_id, amount, status, paid_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (str(uuid4()), client_id, amount, status, paid_at),
                )

            token = secrets.token_urlsafe(24)
            conn.execute(
                """
                INSERT INTO auth_tokens (token, client_id, created_at)
                VALUES (?, ?, ?)
                """,
                (token, client_id, now),
            )

        # Добавляем дополнительных пользователей (админ, менеджер, тестовый пользователь для Playwright)
        print("\n=== Creating additional users ===")
        for email, role, username, password in [
            ("admin@example.com", "admin", "Admin", "admin1234"),
            ("manager@example.com", "manager", "Manager", "manager1234"),
            ("testforexample@example.com", "user", "Test User", "password1234"),
        ]:
            cursor.execute("SELECT 1 FROM clients WHERE email = ?", (email,))
            exists = cursor.fetchone()
            if not exists:
                user_id = str(uuid4())
                password_hash = hash_password(password)
                cursor.execute(
                    """
                    INSERT INTO clients (id, company_type, username, email, password_hash, plan_id, role, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, "small", username, email, password_hash, starter_id, role, now_iso()),
                )
                print(f"✓ Created user: {email} ({role})")
                
                # Verify the user was actually created
                cursor.execute(
                    "SELECT id, email, username, role FROM clients WHERE email = ?",
                    (email,)
                )
                verification = cursor.fetchone()
                if verification:
                    # PostgreSQL returns tuple, SQLite returns Row - handle both
                    user_data = verification if isinstance(verification, dict) else {
                        'id': verification[0],
                        'email': verification[1],
                        'username': verification[2],
                        'role': verification[3]
                    }
                    print(f"  └─ Verified: {user_data.get('username', verification[2])} ({user_data.get('email', verification[1])})")
                else:
                    print(f"  └─ ✗ WARNING: User {email} was NOT created!")
            else:
                print(f"• User already exists: {email}")

    print("\n=== Verifying test user ===")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, username, role FROM clients WHERE email = ?",
            ("testforexample@example.com",)
        )
        test_user = cursor.fetchone()
        
        if test_user:
            # PostgreSQL returns tuple, handle both tuple and dict
            user_data = test_user if isinstance(test_user, dict) else {
                'id': test_user[0],
                'email': test_user[1],
                'username': test_user[2],
                'role': test_user[3]
            }
            print(f"✓ Test user found:")
            print(f"  ID: {user_data.get('id', test_user[0])}")
            print(f"  Email: {user_data.get('email', test_user[1])}")
            print(f"  Username: {user_data.get('username', test_user[2])}")
            print(f"  Role: {user_data.get('role', test_user[3])}")
        else:
            print("✗ ERROR: Test user NOT FOUND!")
            print("Available users:")
            cursor.execute("SELECT email, username FROM clients")
            all_users = cursor.fetchall()
            for user in all_users:
                if isinstance(user, dict):
                    print(f"  - {user['email']} ({user['username']})")
                else:
                    print(f"  - {user[0]} ({user[1]})")

    print("\n✓ Seed completed.")


if __name__ == "__main__":
    seed()
