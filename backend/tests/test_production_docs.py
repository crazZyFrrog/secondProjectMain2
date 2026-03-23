from __future__ import annotations

import importlib
import os
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("restore_backend_after_reload")
def test_openapi_and_docs_disabled_when_app_env_production():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["SQLITE_DB_PATH"] = path
    os.environ["APP_ENV"] = "production"
    os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-32chars-minimum-xx")

    import backend.main as m

    importlib.reload(m)
    assert m.app.openapi_url is None
    c = TestClient(m.app)
    assert c.get("/docs").status_code == 404
    assert c.get("/openapi.json").status_code == 404
