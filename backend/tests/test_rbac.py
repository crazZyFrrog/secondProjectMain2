from __future__ import annotations


def _register(client, suffix: str):
    return client.post(
        "/api/auth/register",
        json={
            "company_type": "small",
            "username": f"user{suffix}",
            "email": f"user{suffix}@example.com",
            "password": "password12",
            "confirm_password": "password12",
            "accept_terms": True,
            "accept_privacy": True,
        },
    )


def test_user_cannot_read_other_users_project(client):
    templates = client.get("/api/templates")
    assert templates.status_code == 200
    tlist = templates.json()
    assert len(tlist) > 0
    template_id = tlist[0]["id"]

    a = _register(client, "a")
    b = _register(client, "b")
    assert a.status_code == 200
    assert b.status_code == 200
    token_a = a.json()["token"]
    token_b = b.json()["token"]

    proj = client.post(
        "/api/projects",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "name": "Owned by A",
            "template_id": template_id,
            "status": "draft",
            "thumbnail_url": "https://example.com/t.png",
            "data": {},
        },
    )
    assert proj.status_code == 200, proj.text
    project_id = proj.json()["id"]

    r = client.get(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert r.status_code == 403
    assert r.json().get("message") == "Доступ запрещён"
