from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Dict, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, Request, status

from db import get_connection

load_dotenv()


def _get_env(key: str, default: Optional[str] = None) -> str:
    value = os.getenv(key, default)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing required env var: {key}")
    return value


def get_jwt_settings() -> Dict[str, object]:
    return {
        "secret": _get_env("JWT_SECRET"),
        "algorithm": os.getenv("JWT_ALGORITHM", "HS256"),
        "expires_minutes": int(os.getenv("JWT_EXPIRES_MINUTES", "120")),
    }


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(client_id: str) -> str:
    settings = get_jwt_settings()
    expires_at = datetime.utcnow() + timedelta(minutes=int(settings["expires_minutes"]))
    payload = {"sub": client_id, "exp": expires_at}
    return jwt.encode(payload, settings["secret"], algorithm=str(settings["algorithm"]))


def decode_token(token: str) -> Dict[str, object]:
    settings = get_jwt_settings()
    try:
        payload = jwt.decode(
            token,
            settings["secret"],
            algorithms=[str(settings["algorithm"])],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Token expired"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid token"},
        )
    if "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid token"},
        )
    return payload


def get_current_user(request: Request) -> Dict[str, object]:
    if hasattr(request.state, "client") and request.state.client:
        return request.state.client
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )
    token = auth_header.replace("Bearer ", "").strip()
    payload = decode_token(token)
    client_id = str(payload["sub"])
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT id, company_type, username, email, plan_id, role, created_at
            FROM clients
            WHERE id = ?
            """,
            (client_id,),
        ).fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )
    return dict(row)


def require_role(required_role: str):
    def _guard(client: Dict[str, object]) -> Dict[str, object]:
        role = str(client.get("role", "user"))
        if role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Forbidden"},
            )
        return client

    return _guard
