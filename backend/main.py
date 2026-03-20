from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.auth import create_access_token, decode_token, get_current_user, hash_password, verify_password
from backend.db import get_connection, init_db
from backend.seed_db import seed
from backend.rbac import require_admin, get_project_or_403, filter_projects_by_access
from backend.validation import (
    validation_exception_handler,
    path_project_id,
    path_plan_id,
    path_template_id,
    RegisterRequestSchema,
    LoginRequestSchema,
    PlanCreateSchema,
    PlanUpdateSchema,
    PlanSelectSchema,
    ProjectCreateSchema,
    ProjectUpdateSchema,
    AiGenerateSchema,
    ExportSchema,
    NotificationsUpdateSchema,
    PasswordUpdateSchema,
    TelegramTestMessageSchema,
)
from backend.telegram_notifications import (
    send_new_plan_purchase_notification,
    send_test_message,
    send_new_user_registration_notification,
)

app = FastAPI(
    title="Landing Constructor API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.exception_handler(HTTPException)
def http_exception_handler(_request: Request, exc: HTTPException):
    if exc.status_code == status.HTTP_400_BAD_REQUEST:
        return JSONResponse(status_code=400, content={"message": "Ошибка валидации"})
    if exc.status_code == status.HTTP_403_FORBIDDEN:
        return JSONResponse(status_code=403, content={"message": "Доступ запрещён"})
    return JSONResponse(status_code=exc.status_code, content=exc.detail if isinstance(exc.detail, dict) else {"detail": str(exc.detail)})
api_router = APIRouter(prefix="/api")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [url.strip() for url in FRONTEND_URL.split(",")]

allow_all = "*" in allowed_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else allowed_origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

PUBLIC_PATH_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/register",
    "/api/plans",
    "/api/templates",
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    print(f"[HTTP] {request.method} {path}", flush=True)
    if path == "/":
        return await call_next(request)
    if path.startswith("/api") and not any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"message": "Unauthorized"},
            )
        token = auth_header.replace("Bearer ", "").strip()
        try:
            payload = decode_token(token)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
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
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"message": "Unauthorized"},
            )
        request.state.client = dict(row)
    return await call_next(request)

print(f"[STARTUP] Python {sys.version}", flush=True)
print(f"[STARTUP] DATABASE_URL set: {bool(os.getenv('DATABASE_URL'))}", flush=True)
print(f"[STARTUP] JWT_SECRET set: {bool(os.getenv('JWT_SECRET'))}", flush=True)
print(f"[STARTUP] FRONTEND_URL: {os.getenv('FRONTEND_URL', 'not set')}", flush=True)
print(
    "[STARTUP] Для доступа из браузера используйте публичный HTTPS-домен из "
    "«Настройки → Доменные имена» (бесплатный *.amvera.io). "
    "Имя вида amvera-*-run-* — внутреннее, с интернета часто даёт 404.",
    flush=True,
)

MAX_DB_RETRIES = 10
RETRY_DELAY = 3

for attempt in range(1, MAX_DB_RETRIES + 1):
    try:
        print(f"[STARTUP] Connecting to database (attempt {attempt}/{MAX_DB_RETRIES})...", flush=True)
        init_db()
        print("[STARTUP] Database initialized successfully", flush=True)
        break
    except Exception as e:
        print(f"[STARTUP] Database init failed (attempt {attempt}): {e}", flush=True)
        if attempt == MAX_DB_RETRIES:
            print("[STARTUP] FATAL: Could not connect to database after all retries", flush=True)
            import traceback
            traceback.print_exc()
        else:
            time.sleep(RETRY_DELAY)

try:
    seed()
    print("[STARTUP] Seed completed successfully", flush=True)
except Exception as e:
    print(f"[STARTUP] Seed error (non-fatal): {e}", flush=True)
    import traceback
    traceback.print_exc()

print("[STARTUP] Application ready, listening for requests", flush=True)


@app.get("/")
def root():
    return {"message": "API работает"}


@app.get("/health")
def health():
    return {"status": "ok"}

# -----------------------------
# Helpers
# -----------------------------


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def parse_json(value: Optional[str], default):
    if value is None:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def plan_from_row(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "name": row["name"],
        "features": parse_json(row["features"], []),
        "limits": parse_json(row["limits"], None),
    }


def template_from_row(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "is_premium": bool(row["is_premium"]),
        "preview_image": row["preview_image"],
        "description": row["description"],
    }


def project_from_row(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "client_id": row["client_id"],
        "name": row["name"],
        "template_id": row["template_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "status": row["status"],
        "thumbnail_url": row["thumbnail_url"],
        "data": parse_json(row["data"], {}),
    }


# -----------------------------
# Schemas
# -----------------------------


# Request body schemas with validation are in validation.py (RegisterRequestSchema, etc.)


class ErrorResponse(BaseModel):
    message: str
    fieldErrors: Optional[Dict[str, str]] = None


def get_project_for_client(project_id: str, client_id: str) -> Dict[str, object]:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT *
            FROM projects
            WHERE id = ? AND client_id = ?
            """,
            (project_id, client_id),
        ).fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Project not found"},
        )
    return project_from_row(row)


def get_project_limit(plan_id: Optional[str]) -> Optional[int]:
    if not plan_id:
        return 3
    with get_connection() as conn:
        row = conn.execute(
            "SELECT limits FROM plans WHERE id = ?",
            (plan_id,),
        ).fetchone()
    if not row:
        return 3
    limits = parse_json(row["limits"], None)
    if isinstance(limits, dict) and "projects" in limits:
        return limits["projects"]
    return None


# -----------------------------
# Auth endpoints
# -----------------------------


@api_router.post("/auth/register", responses={400: {"description": "Ошибка валидации"}})
def register(payload: RegisterRequestSchema):
    try:
        with get_connection() as conn:
            existing = conn.execute(
                "SELECT 1 FROM clients WHERE email = ?",
                (payload.email.strip(),),
            ).fetchone()
            if existing:
                print(f"[REGISTER] Email already exists: {payload.email}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"message": "Email already registered"},
                )

            client_id = str(uuid4())
            print(f"[REGISTER] Creating new user: {payload.email} ({payload.username})")
            conn.execute(
                """
                INSERT INTO clients (id, company_type, username, email, password_hash, plan_id, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    client_id,
                    payload.company_type,
                    payload.username.strip(),
                    payload.email.strip(),
                    hash_password(payload.password),
                    None,
                    "user",
                    now_iso(),
                ),
            )
            print(f"[REGISTER] User created successfully: {client_id}")

        # Отправляем уведомление о новой регистрации в Telegram (неблокирующий режим)
        import threading
        def send_notification_async():
            try:
                send_new_user_registration_notification(
                    email=payload.email.strip(),
                    username=payload.username.strip(),
                    company_type=payload.company_type,
                    client_id=client_id,
                )
            except Exception as e:
                # Логируем ошибку, но не прерываем регистрацию
                print(f"Telegram notification error: {e}")
                import traceback
                traceback.print_exc()
        
        thread = threading.Thread(target=send_notification_async, daemon=True)
        thread.start()

        token = create_access_token(client_id)
        return {
            "id": client_id,
            "company_type": payload.company_type,
            "username": payload.username.strip(),
            "email": payload.email.strip(),
            "plan_id": None,
            "role": "user",
            "token": token,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[REGISTER] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Internal server error", "error": str(e)},
        )


@api_router.post("/auth/login", responses={400: {"description": "Ошибка валидации"}})
def login(payload: LoginRequestSchema):
    try:
        with get_connection() as conn:
            row = conn.execute(
                """
                SELECT id, password_hash, username, email
                FROM clients
                WHERE email = ?
                """,
                (payload.email.strip(),),
            ).fetchone()

            if not row:
                print(f"[LOGIN] User not found: {payload.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"message": "Invalid credentials"},
                )
            
            if not verify_password(payload.password, row["password_hash"]):
                print(f"[LOGIN] Invalid password for user: {payload.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"message": "Invalid credentials"},
                )
            
            print(f"[LOGIN] Success for user: {row['email']} ({row['username']})")

        token = create_access_token(row["id"])
        return {"token": token}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LOGIN] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Internal server error", "error": str(e)},
        )


@api_router.post("/auth/logout")
def logout(client: Dict[str, object] = Depends(get_current_user)):
    return {"message": "Logged out"}


# -----------------------------
# Client endpoints
# -----------------------------


@api_router.get("/clients/me")
def get_me(client: Dict[str, object] = Depends(get_current_user)):
    return {
        "id": client["id"],
        "company_type": client["company_type"],
        "username": client["username"],
        "email": client["email"],
        "plan_id": client["plan_id"],
        "role": client.get("role", "user"),
    }


@api_router.patch("/clients/me/plan", responses={400: {"description": "Ошибка валидации"}})
def select_plan(payload: PlanSelectSchema, client: Dict[str, object] = Depends(get_current_user)):
    previous_plan_id = client.get("plan_id")

    with get_connection() as conn:
        plan = conn.execute(
            "SELECT * FROM plans WHERE id = ?",
            (payload.plan_id,),
        ).fetchone()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Plan not found"},
            )
        conn.execute(
            "UPDATE clients SET plan_id = ? WHERE id = ?",
            (payload.plan_id, client["id"]),
        )

    # Отправляем уведомление в Telegram при переходе на Pro/Enterprise тариф (неблокирующий режим)
    # Уведомление отправляется только при реальной смене тарифа или при первом выборе Pro/Enterprise
    if previous_plan_id != payload.plan_id:
        plan_name = str(plan["name"])
        # Проверяем, является ли новый тариф Pro или Enterprise
        if plan_name.lower() in ("pro", "enterprise"):
            import threading
            def send_notification_async():
                try:
                    send_new_plan_purchase_notification(
                        email=str(client["email"]),
                        plan_name=plan_name,
                        client_id=str(client["id"]),
                    )
                except Exception as e:
                    print(f"Telegram notification error: {e}"
)
            
            thread = threading.Thread(target=send_notification_async, daemon=True)
            thread.start()

    return {"message": "Plan updated", "plan_id": payload.plan_id}


@api_router.patch("/clients/me/password", responses={400: {"description": "Ошибка валидации"}})
def update_password(payload: PasswordUpdateSchema, client: Dict[str, object] = Depends(get_current_user)):
    with get_connection() as conn:
        conn.execute(
            "UPDATE clients SET password_hash = ? WHERE id = ?",
            (hash_password(payload.password), client["id"]),
        )
    return {"message": "Password updated"}


# -----------------------------
# Plans endpoints
# -----------------------------


@api_router.get("/plans")
def list_plans():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM plans").fetchall()
    return [plan_from_row(row) for row in rows]


@api_router.get("/plans/{plan_id}", responses={400: {"description": "Ошибка валидации"}})
def get_plan(plan_id: str = Depends(path_plan_id)):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Plan not found"},
        )
    return plan_from_row(row)


@api_router.post("/plans", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def create_plan(payload: PlanCreateSchema, _client: Dict[str, object] = Depends(require_admin)):
    plan_id = str(uuid4())
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO plans (id, name, features, limits)
            VALUES (?, ?, ?, ?)
            """,
            (
                plan_id,
                payload.name.strip(),
                json.dumps(payload.features, ensure_ascii=False),
                json.dumps(payload.limits, ensure_ascii=False) if payload.limits is not None else None,
            ),
        )
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
    return plan_from_row(row)


@api_router.patch("/plans/{plan_id}", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def update_plan(payload: PlanUpdateSchema, plan_id: str = Depends(path_plan_id), _client: Dict[str, object] = Depends(require_admin)):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Plan not found"},
            )
        name = payload.name.strip() if payload.name is not None else row["name"]
        features = (
            json.dumps(payload.features, ensure_ascii=False)
            if payload.features is not None
            else row["features"]
        )
        limits = (
            json.dumps(payload.limits, ensure_ascii=False)
            if payload.limits is not None
            else row["limits"]
        )
        conn.execute(
            """
            UPDATE plans
            SET name = ?, features = ?, limits = ?
            WHERE id = ?
            """,
            (name, features, limits, plan_id),
        )
        updated = conn.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
    return plan_from_row(updated)


@api_router.delete("/plans/{plan_id}", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def delete_plan(plan_id: str = Depends(path_plan_id), _client: Dict[str, object] = Depends(require_admin)):
    with get_connection() as conn:
        row = conn.execute("SELECT 1 FROM plans WHERE id = ?", (plan_id,)).fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Plan not found"},
            )
        conn.execute("DELETE FROM plans WHERE id = ?", (plan_id,))
    return {"message": "Plan deleted"}


# -----------------------------
# Templates endpoints
# -----------------------------


@api_router.get("/templates")
def list_templates():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM templates").fetchall()
    return [template_from_row(row) for row in rows]


@api_router.get("/templates/{template_id}", responses={400: {"description": "Ошибка валидации"}})
def get_template(template_id: str = Depends(path_template_id)):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Template not found"},
        )
    return template_from_row(row)


# -----------------------------
# Projects endpoints
# -----------------------------


@api_router.get("/projects")
def list_projects(client: Dict[str, object] = Depends(get_current_user)):
    return filter_projects_by_access(client, project_from_row)


@api_router.post("/projects", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def create_project(payload: ProjectCreateSchema, client: Dict[str, object] = Depends(get_current_user)):
    project_limit = get_project_limit(client.get("plan_id"))
    with get_connection() as conn:
        if project_limit is not None:
            current_count = conn.execute(
                "SELECT COUNT(1) AS cnt FROM projects WHERE client_id = ?",
                (client["id"],),
            ).fetchone()["cnt"]
            if current_count >= project_limit:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"message": "Project limit reached for current plan"},
                )

        project_id = str(uuid4())
        timestamp = now_iso()
        conn.execute(
            """
            INSERT INTO projects (
                id, client_id, name, template_id, created_at, updated_at, status, thumbnail_url, data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id,
                client["id"],
                payload.name.strip(),
                payload.template_id,
                timestamp,
                timestamp,
                payload.status,
                payload.thumbnail_url,
                json.dumps(payload.data, ensure_ascii=False),
            ),
        )
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return project_from_row(row)


@api_router.get("/projects/{project_id}", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def get_project(project_id: str = Depends(path_project_id), client: Dict[str, object] = Depends(get_current_user)):
    return get_project_or_403(project_id, client, require_write=False, project_from_row=project_from_row)


@api_router.patch("/projects/{project_id}", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def update_project(payload: ProjectUpdateSchema, project_id: str = Depends(path_project_id), client: Dict[str, object] = Depends(get_current_user)):
    existing = get_project_or_403(project_id, client, require_write=True, project_from_row=project_from_row)
    updated_name = payload.name.strip() if payload.name is not None else existing["name"]
    updated_status = payload.status if payload.status is not None else existing["status"]
    updated_thumbnail = (
        payload.thumbnail_url if payload.thumbnail_url is not None else existing["thumbnail_url"]
    )
    updated_data = payload.data if payload.data is not None else existing["data"]
    updated_at = now_iso()
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE projects
            SET name = ?, status = ?, thumbnail_url = ?, data = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                updated_name,
                updated_status,
                updated_thumbnail,
                json.dumps(updated_data, ensure_ascii=False),
                updated_at,
                project_id,
            ),
        )
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return project_from_row(row)


@api_router.delete("/projects/{project_id}", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def delete_project(project_id: str = Depends(path_project_id), client: Dict[str, object] = Depends(get_current_user)):
    get_project_or_403(project_id, client, require_write=True, project_from_row=project_from_row)
    with get_connection() as conn:
        conn.execute("DELETE FROM exports WHERE project_id = ?", (project_id,))
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return {"message": "Project deleted"}


# -----------------------------
# AI generation endpoint
# -----------------------------


@api_router.post("/ai/generate", responses={400: {"description": "Ошибка валидации"}})
def ai_generate(payload: AiGenerateSchema, client: Dict[str, object] = Depends(get_current_user)):
    products = [p.strip() for p in payload.products.split(",") if p.strip()]
    generated = {
        "company": {
            "name": payload.companyName,
            "logo": "",
            "description": f"{payload.companyName} - ведущая компания в сфере {payload.industry}. Мы предлагаем инновационные решения для наших клиентов, помогая им достигать бизнес-целей и оптимизировать процессы.",
            "mission": f"Делать {payload.industry} доступным и эффективным для каждого бизнеса",
            "values": ["Инновации", "Качество", "Клиентоориентированность", "Прозрачность"],
        },
        "products": [
            {
                "id": f"prod-{idx}",
                "name": name,
                "description": f"Профессиональное решение для {name.lower()}",
                "price": "От 10 000 ₽",
                "image": f"https://images.unsplash.com/photo-{1460925895917 + idx}?w=400",
            }
            for idx, name in enumerate(products)
        ],
        "benefits": [
            {
                "id": "b1",
                "icon": "⚡",
                "title": "Быстрое внедрение",
                "description": "Запуск решения за 2-3 недели",
            },
            {
                "id": "b2",
                "icon": "🎯",
                "title": "Индивидуальный подход",
                "description": "Решения под ваши задачи",
            },
            {
                "id": "b3",
                "icon": "💼",
                "title": "Опытная команда",
                "description": "Более 10 лет на рынке",
            },
        ],
    }
    return generated


# -----------------------------
# Export endpoints
# -----------------------------


@api_router.post("/projects/{project_id}/export", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def export_project(payload: ExportSchema, project_id: str = Depends(path_project_id), client: Dict[str, object] = Depends(get_current_user)):
    get_project_or_403(project_id, client, require_write=True, project_from_row=project_from_row)
    export_id = str(uuid4())
    created_at = now_iso()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO exports (id, project_id, format, size, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (export_id, project_id, payload.format, "1.2 MB", created_at),
        )
    return {"message": f"Export to {payload.format} queued"}


@api_router.get("/projects/{project_id}/exports", responses={400: {"description": "Ошибка валидации"}, 403: {"description": "Доступ запрещён"}})
def export_history(project_id: str = Depends(path_project_id), client: Dict[str, object] = Depends(get_current_user)):
    get_project_or_403(project_id, client, require_write=False, project_from_row=project_from_row)
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT format, size, created_at FROM exports WHERE project_id = ? ORDER BY created_at DESC",
            (project_id,),
        ).fetchall()
    return [
        {
            "date": datetime.fromisoformat(row["created_at"].replace("Z", "")).strftime("%d %b %Y"),
            "format": row["format"],
            "size": row["size"],
        }
        for row in rows
    ]


# -----------------------------
# Client settings endpoints
# -----------------------------


@api_router.get("/clients/me/subscription")
def get_subscription(client: Dict[str, object] = Depends(get_current_user)):
    with get_connection() as conn:
        plan_row = None
        if client["plan_id"]:
            plan_row = conn.execute(
                "SELECT * FROM plans WHERE id = ?",
                (client["plan_id"],),
            ).fetchone()

        projects_count = conn.execute(
            "SELECT COUNT(1) AS cnt FROM projects WHERE client_id = ?",
            (client["id"],),
        ).fetchone()["cnt"]

        exports_count = conn.execute(
            """
            SELECT COUNT(1) AS cnt
            FROM exports e
            JOIN projects p ON p.id = e.project_id
            WHERE p.client_id = ?
            """,
            (client["id"],),
        ).fetchone()["cnt"]

    plan_name = plan_row["name"] if plan_row else "Free"
    limits = parse_json(plan_row["limits"], None) if plan_row else {"projects": 3, "exports": 10}
    return {
        "plan_name": plan_name,
        "limits": limits,
        "usage": {"projects": projects_count, "exports": exports_count},
        "expires_at": None,
    }


@api_router.get("/clients/me/payments")
def get_payments(client: Dict[str, object] = Depends(get_current_user)):
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT paid_at, amount, status
            FROM payments
            WHERE client_id = ?
            ORDER BY paid_at DESC
            """,
            (client["id"],),
        ).fetchall()
    return [{"date": row["paid_at"], "amount": row["amount"], "status": row["status"]} for row in rows]


@api_router.get("/clients/me/notifications")
def get_notifications(client: Dict[str, object] = Depends(get_current_user)):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, label, checked FROM notifications WHERE client_id = ?",
            (client["id"],),
        ).fetchall()
        if not rows:
            defaults = [
                ("Email уведомления о новых функциях", True),
                ("Уведомления об экспорте проектов", True),
                ("Маркетинговые рассылки", False),
                ("Советы по использованию платформы", True),
            ]
            for label, checked in defaults:
                conn.execute(
                    """
                    INSERT INTO notifications (id, client_id, label, checked)
                    VALUES (?, ?, ?, ?)
                    """,
                    (str(uuid4()), client["id"], label, int(checked)),
                )
            rows = conn.execute(
                "SELECT id, label, checked FROM notifications WHERE client_id = ?",
                (client["id"],),
            ).fetchall()

    return [{"label": row["label"], "checked": bool(row["checked"])} for row in rows]


@api_router.patch("/clients/me/notifications", responses={400: {"description": "Ошибка валидации"}})
def update_notifications(payload: NotificationsUpdateSchema, client: Dict[str, object] = Depends(get_current_user)):
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM notifications WHERE client_id = ?",
            (client["id"],),
        )
        for item in payload.notifications:
            conn.execute(
                """
                INSERT INTO notifications (id, client_id, label, checked)
                VALUES (?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    client["id"],
                    str(item.get("label", "")),
                    int(bool(item.get("checked", False))),
                ),
            )
    return {"message": "Notifications updated"}


# -----------------------------
# Integrations: Telegram
# -----------------------------


@api_router.post(
    "/integrations/telegram/test-message",
    responses={403: {"description": "Доступ запрещён"}},
)
def telegram_test_message(
    payload: TelegramTestMessageSchema,
    _client: Dict[str, object] = Depends(require_admin),
):
    """
    Служебный эндпоинт для проверки интеграции с Telegram.
    Доступен только админам.
    """
    send_test_message(text=payload.text, chat_id=payload.chat_id)
    return {"message": "Test message sent (if Telegram настроен корректно)"}


app.include_router(api_router)
