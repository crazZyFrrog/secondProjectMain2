"""
Валидация входящих данных: params, query, body.
При ошибке валидации — HTTP 400, тело: {"message": "Ошибка валидации"}.
"""
from __future__ import annotations

import re
import uuid
from typing import Annotated, Any, List, Optional, Union

from fastapi import Path, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator

# ----- Константы -----
MAX_STR = 500
MAX_STR_SHORT = 100
MAX_STR_NAME = 200
MAX_PASSWORD = 72
MIN_PASSWORD_LEN = 8
MAX_ARRAY_LEN = 500
PAGINATION_LIMIT_MIN = 1
PAGINATION_LIMIT_MAX = 100
PAGINATION_OFFSET_MIN = 0

# ----- Обработчик 400 для ошибок валидации -----


def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    field_errors: dict[str, str] = {}
    for err in exc.errors():
        loc = err.get("loc", ())
        msg = err.get("msg", "Ошибка валидации")
        if loc:
            field_name = loc[-1] if isinstance(loc[-1], str) else str(loc[-1])
            field_errors[field_name] = msg
    content: dict = {"message": "Ошибка валидации"}
    if field_errors:
        content["fieldErrors"] = field_errors
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=content,
    )


# ----- Валидация path/query (зависимости) -----


def validate_uuid_or_positive_id(value: str) -> str:
    """id — UUID или положительное целое (строка)."""
    if not value or not isinstance(value, str):
        raise ValueError("id обязателен")
    value = value.strip()
    if not value:
        raise ValueError("id не может быть пустым")
    if value.isdigit():
        if int(value) <= 0:
            raise ValueError("id должен быть положительным числом")
        return value
    try:
        uuid.UUID(value)
        return value
    except (ValueError, TypeError):
        raise ValueError("id должен быть UUID или положительным числом")


# Path-зависимости для частых параметров
def path_project_id(
    project_id: Annotated[str, Path(description="ID проекта")],
) -> str:
    try:
        return validate_uuid_or_positive_id(project_id)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": "Ошибка валидации"})


def path_plan_id(
    plan_id: Annotated[str, Path(description="ID тарифа")],
) -> str:
    try:
        return validate_uuid_or_positive_id(plan_id)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": "Ошибка валидации"})


def path_template_id(
    template_id: Annotated[str, Path(description="ID шаблона")],
) -> str:
    if not template_id or not isinstance(template_id, str):
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": "Ошибка валидации"})
    s = template_id.strip()
    if len(s) > MAX_STR_SHORT:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": "Ошибка валидации"})
    return s


# Пагинация: limit 1–100, offset ≥ 0
PaginationLimit = Annotated[int, Query(ge=PAGINATION_LIMIT_MIN, le=PAGINATION_LIMIT_MAX, description="Лимит")]
PaginationOffset = Annotated[int, Query(ge=PAGINATION_OFFSET_MIN, description="Смещение")]


# ----- Pydantic-модели с валидацией для body -----


def trimmed_str(max_len: int = MAX_STR, min_len: Optional[int] = None):
    def _validator(v: Any) -> str:
        if v is None:
            raise ValueError("Поле обязательно")
        s = str(v).strip()
        if len(s) == 0:
            raise ValueError("Поле не может быть пустым")
        if len(s) > max_len:
            raise ValueError(f"Максимум {max_len} символов")
        if min_len is not None and len(s) < min_len:
            raise ValueError(f"Минимум {min_len} символов")
        return s
    return _validator


class RegisterRequestSchema(BaseModel):
    company_type: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    confirm_password: Optional[str] = None
    accept_terms: Optional[bool] = None
    accept_privacy: Optional[bool] = None

    @field_validator("username", "email", "password", "confirm_password", mode="before")
    @classmethod
    def trim_required(cls, v: Any) -> Any:
        if v is None or (isinstance(v, str) and not v.strip()):
            return v
        return str(v).strip() if isinstance(v, str) else v

    @field_validator("username")
    @classmethod
    def username_len(cls, v: Optional[str]) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return v
        if len(v) > MAX_STR_SHORT:
            raise ValueError(f"Максимум {MAX_STR_SHORT} символов")
        return v

    @field_validator("email")
    @classmethod
    def email_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return v
        if len(v) > MAX_STR_SHORT:
            raise ValueError(f"Максимум {MAX_STR_SHORT} символов")
        if "@" not in v or not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("Некорректный email")
        return v

    @field_validator("password", "confirm_password")
    @classmethod
    def password_len(cls, v: Optional[str]) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return v
        if len(v) < MIN_PASSWORD_LEN:
            raise ValueError(f"Пароль должен быть не менее {MIN_PASSWORD_LEN} символов")
        if len(v) > MAX_PASSWORD:
            raise ValueError(f"Максимум {MAX_PASSWORD} символов")
        return v

    @model_validator(mode="after")
    def check_required_and_agreements(self):
        for f in ("username", "email", "password", "confirm_password"):
            if getattr(self, f) is None or (isinstance(getattr(self, f), str) and not getattr(self, f).strip()):
                raise ValueError("Все обязательные поля должны быть заполнены")
        if self.password != self.confirm_password:
            raise ValueError("Пароли не совпадают")
        if self.accept_terms is not True:
            raise ValueError("Необходимо согласие с условиями")
        if self.accept_privacy is not True:
            raise ValueError("Необходимо согласие с политикой конфиденциальности")
        if self.company_type not in ("small", "large"):
            raise ValueError("company_type должен быть small или large")
        return self


class LoginRequestSchema(BaseModel):
    email: str = Field(..., min_length=1, max_length=MAX_STR_SHORT)
    password: str = Field(..., min_length=1, max_length=MAX_PASSWORD)

    @field_validator("email")
    @classmethod
    def email_trim(cls, v: str) -> str:
        s = v.strip()
        if not s or "@" not in s:
            raise ValueError("Некорректный email")
        return s


class PlanCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_STR_NAME)
    features: List[str] = Field(..., max_length=MAX_ARRAY_LEN)
    limits: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def name_trim(cls, v: str) -> str:
        return v.strip() or v

    @field_validator("features")
    @classmethod
    def features_len(cls, v: List[str]) -> List[str]:
        if len(v) > MAX_ARRAY_LEN:
            raise ValueError(f"Максимум {MAX_ARRAY_LEN} элементов")
        return [str(x).strip() for x in v]


class PlanUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, max_length=MAX_STR_NAME)
    features: Optional[List[str]] = Field(None, max_length=MAX_ARRAY_LEN)
    limits: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def name_trim(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v

    @field_validator("features")
    @classmethod
    def features_len(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        if len(v) > MAX_ARRAY_LEN:
            raise ValueError(f"Максимум {MAX_ARRAY_LEN} элементов")
        return [str(x).strip() for x in v]


class PlanSelectSchema(BaseModel):
    plan_id: str = Field(..., min_length=1, max_length=MAX_STR_SHORT)

    @field_validator("plan_id")
    @classmethod
    def plan_id_trim(cls, v: str) -> str:
        return v.strip()


class ProjectCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=MAX_STR_NAME)
    template_id: str = Field(..., min_length=1, max_length=MAX_STR_SHORT)
    status: str = Field(default="draft", pattern="^(draft|completed)$")
    thumbnail_url: str = Field(..., max_length=MAX_STR)
    data: dict = Field(default_factory=dict)

    @field_validator("name", "template_id")
    @classmethod
    def trim(cls, v: str) -> str:
        return v.strip()

    @field_validator("thumbnail_url")
    @classmethod
    def url_trim(cls, v: str) -> str:
        return v.strip() if v else v


class ProjectUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, max_length=MAX_STR_NAME)
    status: Optional[str] = Field(None, pattern="^(draft|completed)$")
    thumbnail_url: Optional[str] = Field(None, max_length=MAX_STR)
    data: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def name_trim(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


class AiGenerateSchema(BaseModel):
    companyName: str = Field(..., min_length=1, max_length=MAX_STR_NAME)
    industry: str = Field(..., min_length=1, max_length=MAX_STR_SHORT)
    products: str = Field(..., min_length=1, max_length=MAX_STR)
    targetAudience: str = Field(..., min_length=1, max_length=MAX_STR)
    usp: Optional[str] = Field(default="", max_length=MAX_STR)

    @field_validator("companyName", "industry", "products", "targetAudience", "usp", mode="before")
    @classmethod
    def trim_str(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else (v or "")


class ExportSchema(BaseModel):
    format: str = Field(..., min_length=1, max_length=20)

    @field_validator("format")
    @classmethod
    def format_upper(cls, v: str) -> str:
        return v.strip().upper()

    @model_validator(mode="after")
    def format_enum(self):
        if self.format not in ("PDF", "HTML", "DOCX"):
            raise ValueError("format должен быть PDF, HTML или DOCX")
        return self


class NotificationsUpdateSchema(BaseModel):
    notifications: List[dict] = Field(..., max_length=MAX_ARRAY_LEN)


class PasswordUpdateSchema(BaseModel):
    password: str = Field(..., min_length=MIN_PASSWORD_LEN, max_length=MAX_PASSWORD)

    @field_validator("password")
    @classmethod
    def password_trim(cls, v: str) -> str:
        s = v.strip()
        if len(s) < MIN_PASSWORD_LEN:
            raise ValueError(f"Минимум {MIN_PASSWORD_LEN} символов")
        return s


class TelegramTestMessageSchema(BaseModel):
    chat_id: Optional[str] = None
    text: Optional[str] = Field(default=None, max_length=MAX_STR)
