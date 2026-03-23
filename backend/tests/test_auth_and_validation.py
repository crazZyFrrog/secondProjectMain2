from __future__ import annotations


def test_private_endpoint_without_token_returns_401(client):
    r = client.get("/api/clients/me")
    assert r.status_code == 401
    assert r.json().get("message") == "Unauthorized"


def test_invalid_project_path_returns_400_with_field_errors(client):
    reg = client.post(
        "/api/auth/register",
        json={
            "company_type": "small",
            "username": "pathvaluser",
            "email": "pathvaluser@example.com",
            "password": "password12",
            "confirm_password": "password12",
            "accept_terms": True,
            "accept_privacy": True,
        },
    )
    assert reg.status_code == 200, reg.text
    token = reg.json()["token"]
    r = client.get(
        "/api/projects/not-a-valid-id",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400
    data = r.json()
    assert data.get("message") == "Ошибка валидации"
    assert "project_id" in (data.get("fieldErrors") or {})


def test_dev_exposes_openapi_docs(client):
    assert client.get("/docs").status_code == 200
