from __future__ import annotations

import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "data" / "app.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
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
        columns = [row["name"] for row in conn.execute("PRAGMA table_info(clients)").fetchall()]
        if "role" not in columns:
            conn.execute("ALTER TABLE clients ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
