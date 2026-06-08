from typing import Annotated
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Query

from core.database import get_conn
from core.security import get_current_user
from models.schemas import DailySummary, WasteLogCreate, WasteLogOut

router = APIRouter(prefix="/waste", tags=["waste"])
Auth = Annotated[dict, Depends(get_current_user)]
Conn = Annotated[asyncpg.Connection, Depends(get_conn)]


@router.post("/", response_model=WasteLogOut, status_code=201)
async def log_waste(body: WasteLogCreate, user: Auth, conn: Conn):
    row = await conn.fetchrow(
        """INSERT INTO waste_logs (meal_id, weight_kg, cafeteria_id, logged_by, source, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *""",
        body.meal_id, body.weight_kg, body.cafeteria_id,
        user["id"], body.source, body.notes,
    )
    return WasteLogOut(**dict(row))


@router.get("/", response_model=list[WasteLogOut])
async def list_waste(
    user: Auth, conn: Conn,
    cafeteria_id: UUID | None = None,
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    limit: int = Query(100, ge=1, le=1000),
):
    conditions = ["1=1"]
    params: list = []

    if cafeteria_id:
        params.append(cafeteria_id)
        conditions.append(f"wl.cafeteria_id=${len(params)}")
    if from_date:
        params.append(from_date)
        conditions.append(f"wl.created_at>=${len(params)}")
    if to_date:
        params.append(to_date)
        conditions.append(f"wl.created_at<=${len(params)}")

    params.append(limit)
    sql = f"""
        SELECT wl.*, m.name AS meal_name, m.category
        FROM waste_logs wl
        JOIN meals m ON wl.meal_id = m.id
        WHERE {" AND ".join(conditions)}
        ORDER BY wl.created_at DESC
        LIMIT ${len(params)}
    """
    rows = await conn.fetch(sql, *params)
    return [WasteLogOut(**dict(r)) for r in rows]


@router.get("/summary/daily", response_model=list[DailySummary])
async def daily_summary(user: Auth, conn: Conn, cafeteria_id: UUID | None = None):
    rows = await conn.fetch(
        """SELECT
               DATE(created_at)        AS date,
               SUM(weight_kg)          AS total_kg,
               COUNT(*)                AS entries,
               AVG(weight_kg)          AS avg_kg_per_entry
           FROM waste_logs
           WHERE ($1::uuid IS NULL OR cafeteria_id=$1)
             AND created_at >= NOW() - INTERVAL '30 days'
           GROUP BY DATE(created_at)
           ORDER BY date DESC""",
        cafeteria_id,
    )
    return [DailySummary(**dict(r)) for r in rows]
