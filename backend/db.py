from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Union

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False


DB_PATH = Path(__file__).resolve().parent / "data" / "app.db"
DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_connection() -> Union[sqlite3.Connection, 'psycopg2.extensions.connection']:
    """
    Возвращает подключение к базе данных.
    Если задана переменная DATABASE_URL с postgresql://, использует PostgreSQL.
    Иначе использует SQLite для локальной разработки.
    """
    if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
        if not POSTGRES_AVAILABLE:
            raise ImportError("psycopg2 not installed. Run: pip install psycopg2-binary")
        
        # psycopg2 автоматически закроет соединение при выходе из контекста
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        conn.autocommit = False
        return conn
    else:
        # SQLite для локальной разработки
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


def init_db() -> None:
    """
    Инициализирует схему базы данных.
    Поддерживает SQLite и PostgreSQL.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Определяем тип БД
        is_postgres = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")
        
        # SQL-скрипт с учётом различий между SQLite и PostgreSQL
        if is_postgres:
            # PostgreSQL использует SERIAL для автоинкремента, но мы используем TEXT PRIMARY KEY (UUID)
            # CHECK constraint синтаксис одинаков
            script = """
                CREATE TABLE IF NOT EXISTS plans (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    features TEXT NOT NULL,
                    limits TEXT
                );

                CREATE TABLE IF NOT EXISTS clients (
                    id TEXT PRIMARY KEY,
                    company_type TEXT NOT NULL CHECK (company_type IN ('small', 'large')),
                    username TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    plan_id TEXT,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (plan_id) REFERENCES plans(id)
                );

                CREATE TABLE IF NOT EXISTS templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    is_premium INTEGER NOT NULL,
                    preview_image TEXT NOT NULL,
                    description TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    template_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    thumbnail_url TEXT NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id),
                    FOREIGN KEY (template_id) REFERENCES templates(id)
                );

                CREATE TABLE IF NOT EXISTS exports (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    format TEXT NOT NULL,
                    size TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects(id)
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    label TEXT NOT NULL,
                    checked INTEGER NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    amount TEXT NOT NULL,
                    status TEXT NOT NULL,
                    paid_at TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                CREATE TABLE IF NOT EXISTS auth_tokens (
                    token TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
                CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
                CREATE INDEX IF NOT EXISTS idx_exports_project ON exports(project_id);
                CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
                CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
                CREATE INDEX IF NOT EXISTS idx_tokens_client ON auth_tokens(client_id);
            """
            
            # PostgreSQL не поддерживает executescript, выполняем по одной команде
            for statement in script.split(';'):
                statement = statement.strip()
                if statement:
                    cursor.execute(statement)
            
            # Проверяем наличие колонки role (для миграции старых баз)
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='clients' AND column_name='role'
            """)
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE clients ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
                
        else:
            # SQLite
            cursor.executescript(
                """
                CREATE TABLE IF NOT EXISTS plans (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    features TEXT NOT NULL,
                    limits TEXT
                );

                CREATE TABLE IF NOT EXISTS clients (
                    id TEXT PRIMARY KEY,
                    company_type TEXT NOT NULL CHECK (company_type IN ('small', 'large')),
                    username TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    plan_id TEXT,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (plan_id) REFERENCES plans(id)
                );

                CREATE TABLE IF NOT EXISTS templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    is_premium INTEGER NOT NULL,
                    preview_image TEXT NOT NULL,
                    description TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    template_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    thumbnail_url TEXT NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id),
                    FOREIGN KEY (template_id) REFERENCES templates(id)
                );

                CREATE TABLE IF NOT EXISTS exports (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    format TEXT NOT NULL,
                    size TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects(id)
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    label TEXT NOT NULL,
                    checked INTEGER NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    amount TEXT NOT NULL,
                    status TEXT NOT NULL,
                    paid_at TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                CREATE TABLE IF NOT EXISTS auth_tokens (
                    token TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                );

                CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
                CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
                CREATE INDEX IF NOT EXISTS idx_exports_project ON exports(project_id);
                CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
                CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
                CREATE INDEX IF NOT EXISTS idx_tokens_client ON auth_tokens(client_id);
                """
            )
            columns = [row["name"] for row in cursor.execute("PRAGMA table_info(clients)").fetchall()]
            if "role" not in columns:
                cursor.execute("ALTER TABLE clients ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
        
        conn.commit()
