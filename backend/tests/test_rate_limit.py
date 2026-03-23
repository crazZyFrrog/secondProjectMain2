from __future__ import annotations

import importlib
import os
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("restore_backend_after_reload")
def test_register_rate_limit_returns_429():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["SQLITE_DB_PATH"] = path
    os.environ["AUTH_RATE_LIMIT"] = "10/minute"
    os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-32chars-minimum-xx")

    import backend.main as m

    importlib.reload(m)
    c = TestClient(m.app)

    base = {
        "company_type": "small",
        "password": "password12",
        "confirm_password": "password12",
        "accept_terms": True,
        "accept_privacy": True,
    }
    for i in range(10):
        r = c.post(
            "/api/auth/register",
            json={
                **base,
                "username": f"rl{i}",
                "email": f"rl{i}@example.com",
            },
        )
        assert r.status_code == 200, r.text

    r = c.post(
        "/api/auth/register",
        json={
            **base,
            "username": "rl10",
            "email": "rl10@example.com",
        },
    )
    assert r.status_code == 429
    assert "Слишком много" in r.json().get("message", "")
