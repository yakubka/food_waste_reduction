from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)
    role: Literal["admin", "manager", "staff"]
    cafeteria_id: UUID | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: str


class TokenResponse(BaseModel):
    user: UserOut
    token: str


# ── Waste ─────────────────────────────────────────────────────────────────────

class WasteLogCreate(BaseModel):
    meal_id: UUID
    cafeteria_id: UUID
    weight_kg: float = Field(gt=0)
    source: Literal["scale", "manual"]
    notes: str | None = None


class WasteLogOut(BaseModel):
    id: UUID
    meal_id: UUID
    cafeteria_id: UUID
    weight_kg: float
    source: str
    notes: str | None
    created_at: datetime
    meal_name: str | None = None
    category: str | None = None


class DailySummary(BaseModel):
    date: datetime
    total_kg: float
    entries: int
    avg_kg_per_entry: float


# ── Meals ─────────────────────────────────────────────────────────────────────

class MealCreate(BaseModel):
    name: str = Field(min_length=1)
    category: Literal["breakfast", "lunch", "dinner", "snack"]
    cafeteria_id: UUID
    serving_size_g: int = Field(gt=0)
    cost_per_serving: float = Field(ge=0)
    description: str | None = None


class MealOut(BaseModel):
    id: UUID
    name: str
    category: str
    cafeteria_id: UUID
    serving_size_g: int
    cost_per_serving: float
    description: str | None
    is_active: bool
    created_at: datetime


# ── Analytics ─────────────────────────────────────────────────────────────────

class OverviewSummary(BaseModel):
    total_waste_kg: float | None
    avg_waste_per_entry: float | None
    total_entries: int | None
    estimated_cost_usd: float | None


class TopMeal(BaseModel):
    name: str
    waste_kg: float


class HourWaste(BaseModel):
    hour: float
    waste_kg: float


class OverviewResponse(BaseModel):
    summary: OverviewSummary
    top_waste_meals: list[TopMeal]
    waste_by_hour: list[HourWaste]


class ForecastDay(BaseModel):
    date: str
    predicted_servings: int
    confidence: float


class WeeklyReduction(BaseModel):
    week: datetime
    total_kg: float


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: UUID
    cafeteria_id: UUID | None
    type: str
    severity: str
    message: str
    is_read: bool
    created_at: datetime
