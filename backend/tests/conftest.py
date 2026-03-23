"""
Pytest: изолированная SQLite и секреты до импорта backend.main (init_db + seed).
"""
from __future__ import annotations

import os
import tempfile

_fd, _TEST_DB_PATH = tempfile.mkstemp(suffix=".db")
os.close(_fd)

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-32chars-minimum-xx")
os.environ["SQLITE_DB_PATH"] = _TEST_DB_PATH
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "")
os.environ.setdefault("TELEGRAM_MANAGER_CHAT_ID", "")
os.environ.setdefault("AUTH_RATE_LIMIT", "1000/minute")
os.environ.setdefault("APP_ENV", "development")

ORIGINAL_SQLITE_DB_PATH = _TEST_DB_PATH

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    import backend.main as m

    return TestClient(m.app)


@pytest.fixture
def restore_backend_after_reload():
    yield
    import importlib

    import backend.main as m

    os.environ["SQLITE_DB_PATH"] = ORIGINAL_SQLITE_DB_PATH
    os.environ["AUTH_RATE_LIMIT"] = "1000/minute"
    os.environ["APP_ENV"] = "development"
    importlib.reload(m)
