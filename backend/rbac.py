"""
RBAC: проверка прав доступа к ресурсам.
- admin: полный доступ ко всем ресурсам и управление пользователями.
- manager: чтение всех ресурсов, изменение только своих (профиль, свои проекты); нет доступа к admin-эндпоинтам.
- user: доступ только к своим данным (профиль, свои проекты).

При отказе в доступе — HTTP 403, тело: {"message": "Доступ запрещён"}.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from fastapi import Depends, HTTPException, status

from auth import get_current_user
from db import get_connection

# Роли по возрастанию прав (для проверки "не ниже")
ROLE_ORDER = {"user": 0, "manager": 1, "admin": 2}

FORBIDDEN_RESPONSE = {"message": "Доступ запрещён"}


def _role_level(role: str) -> int:
    return ROLE_ORDER.get(str(role).lower(), 0)


def require_roles(allowed_roles: List[str]):
    """Зависимость: текущий пользователь должен иметь одну из ролей."""
    def _dependency(client: Dict[str, object] = Depends(get_current_user)) -> Dict[str, object]:
        role = str(client.get("role", "user")).lower()
        if role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_RESPONSE)
        return client
    return _dependency


def require_admin(client: Dict[str, object] = Depends(get_current_user)) -> Dict[str, object]:
    """Только admin."""
    if str(client.get("role", "user")).lower() != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_RESPONSE)
    return client


def can_read_all(client: Dict[str, object]) -> bool:
    """manager и admin могут читать все ресурсы."""
    return _role_level(str(client.get("role", "user"))) >= _role_level("manager")


def can_write_any(client: Dict[str, object]) -> bool:
    """Только admin может изменять чужие ресурсы."""
    return str(client.get("role", "user")).lower() == "admin"


def get_project_or_403(
    project_id: str,
    client: Dict[str, object],
    require_write: bool,
    project_from_row,
) -> Dict[str, object]:
    """
    Возвращает проект, если у текущего пользователя есть доступ (чтение или запись).
    Иначе raises HTTP 403.
    Правило: доступ разрешён, если resource.client_id == current_user.id ИЛИ
    (для чтения) роль manager/admin, (для записи) роль admin.
    """
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Project not found"},
        )
    project = project_from_row(row)
    owner_id = str(row["client_id"])
    current_id = str(client["id"])

    if owner_id == current_id:
        return project

    if require_write:
        if not can_write_any(client):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_RESPONSE)
    else:
        if not can_read_all(client):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_RESPONSE)

    return project


def filter_projects_by_access(
    client: Dict[str, object],
    project_from_row,
) -> List[Dict[str, object]]:
    """Список проектов: user — только свои, manager/admin — все."""
    with get_connection() as conn:
        if can_read_all(client):
            rows = conn.execute("SELECT * FROM projects").fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM projects WHERE client_id = ?",
                (client["id"],),
            ).fetchall()
    return [project_from_row(row) for row in rows]
