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
        plans_count = conn.execute("SELECT COUNT(1) AS cnt FROM plans").fetchone()["cnt"]
        templates_count = conn.execute("SELECT COUNT(1) AS cnt FROM templates").fetchone()["cnt"]
        clients_count = conn.execute("SELECT COUNT(1) AS cnt FROM clients").fetchone()["cnt"]

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
            starter_id = conn.execute(
                "SELECT id FROM plans WHERE name = ?",
                ("Starter",),
            ).fetchone()
            starter_id = starter_id["id"] if starter_id else None

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
            exists = conn.execute("SELECT 1 FROM clients WHERE email = ?", (email,)).fetchone()
            if not exists:
                user_id = str(uuid4())
                password_hash = hash_password(password)
                conn.execute(
                    """
                    INSERT INTO clients (id, company_type, username, email, password_hash, plan_id, role, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, "small", username, email, password_hash, starter_id, role, now_iso()),
                )
                print(f"✓ Created user: {email} ({role})")
                
                # Verify the user was actually created
                verification = conn.execute(
                    "SELECT id, email, username, role FROM clients WHERE email = ?",
                    (email,)
                ).fetchone()
                if verification:
                    print(f"  └─ Verified: {verification['username']} ({verification['email']})")
                else:
                    print(f"  └─ ✗ WARNING: User {email} was NOT created!")
            else:
                print(f"• User already exists: {email}")

    print("\n=== Verifying test user ===")
    with get_connection() as conn:
        test_user = conn.execute(
            "SELECT id, email, username, role FROM clients WHERE email = ?",
            ("testforexample@example.com",)
        ).fetchone()
        
        if test_user:
            print(f"✓ Test user found:")
            print(f"  ID: {test_user['id']}")
            print(f"  Email: {test_user['email']}")
            print(f"  Username: {test_user['username']}")
            print(f"  Role: {test_user['role']}")
        else:
            print("✗ ERROR: Test user NOT FOUND!")
            print("Available users:")
            all_users = conn.execute("SELECT email, username FROM clients").fetchall()
            for user in all_users:
                print(f"  - {user['email']} ({user['username']})")

    print("\n✓ Seed completed.")


if __name__ == "__main__":
    seed()
