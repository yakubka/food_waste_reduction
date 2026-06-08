from typing import Annotated
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends

from core.database import get_conn
from core.security import get_current_user, require_roles
from models.schemas import MealCreate, MealOut

router = APIRouter(prefix="/meals", tags=["meals"])
Auth = Annotated[dict, Depends(get_current_user)]
Conn = Annotated[asyncpg.Connection, Depends(get_conn)]


@router.get("/", response_model=list[MealOut])
async def list_meals(user: Auth, conn: Conn, cafeteria_id: UUID | None = None, category: str | None = None):
    conditions = ["is_active=true"]
    params: list = []

    if cafeteria_id:
        params.append(cafeteria_id)
        conditions.append(f"cafeteria_id=${len(params)}")
    if category:
        params.append(category)
        conditions.append(f"category=${len(params)}")

    rows = await conn.fetch(
        f"SELECT * FROM meals WHERE {' AND '.join(conditions)} ORDER BY name",
        *params,
    )
    return [MealOut(**dict(r)) for r in rows]


@router.post("/", response_model=MealOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "manager"))])
async def create_meal(body: MealCreate, conn: Conn):
    row = await conn.fetchrow(
        """INSERT INTO meals (name, category, cafeteria_id, serving_size_g, cost_per_serving, description)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
        body.name, body.category, body.cafeteria_id,
        body.serving_size_g, body.cost_per_serving, body.description,
    )
    return MealOut(**dict(row))


@router.get("/{meal_id}/waste-trend")
async def meal_waste_trend(meal_id: UUID, user: Auth, conn: Conn):
    rows = await conn.fetch(
        """SELECT DATE(created_at) AS date, SUM(weight_kg) AS total_waste_kg
           FROM waste_logs
           WHERE meal_id=$1 AND created_at >= NOW() - INTERVAL '14 days'
           GROUP BY DATE(created_at)
           ORDER BY date""",
        meal_id,
    )
    return [dict(r) for r in rows]
