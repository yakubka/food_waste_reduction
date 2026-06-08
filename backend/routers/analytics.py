import random
from datetime import date, timedelta
from typing import Annotated
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends

from core.database import get_conn
from core.security import get_current_user
from models.schemas import ForecastDay, HourWaste, OverviewResponse, OverviewSummary, TopMeal, WeeklyReduction

router = APIRouter(prefix="/analytics", tags=["analytics"])
Auth = Annotated[dict, Depends(get_current_user)]
Conn = Annotated[asyncpg.Connection, Depends(get_conn)]


@router.get("/overview", response_model=OverviewResponse)
async def overview(user: Auth, conn: Conn, cafeteria_id: UUID | None = None):
    summary_row = await conn.fetchrow(
        """SELECT
               ROUND(SUM(weight_kg)::numeric, 2)       AS total_waste_kg,
               ROUND(AVG(weight_kg)::numeric, 2)       AS avg_waste_per_entry,
               COUNT(*)                                AS total_entries,
               ROUND(SUM(weight_kg * 2.5)::numeric, 2) AS estimated_cost_usd
           FROM waste_logs
           WHERE ($1::uuid IS NULL OR cafeteria_id=$1)
             AND created_at >= NOW() - INTERVAL '30 days'""",
        cafeteria_id,
    )
    top_rows = await conn.fetch(
        """SELECT m.name, ROUND(SUM(wl.weight_kg)::numeric, 2) AS waste_kg
           FROM waste_logs wl JOIN meals m ON wl.meal_id=m.id
           WHERE ($1::uuid IS NULL OR wl.cafeteria_id=$1)
             AND wl.created_at >= NOW() - INTERVAL '30 days'
           GROUP BY m.name ORDER BY waste_kg DESC LIMIT 5""",
        cafeteria_id,
    )
    hour_rows = await conn.fetch(
        """SELECT EXTRACT(HOUR FROM created_at) AS hour,
                  ROUND(SUM(weight_kg)::numeric, 2)  AS waste_kg
           FROM waste_logs
           WHERE ($1::uuid IS NULL OR cafeteria_id=$1)
             AND created_at >= NOW() - INTERVAL '30 days'
           GROUP BY hour ORDER BY hour""",
        cafeteria_id,
    )

    return OverviewResponse(
        summary=OverviewSummary(**dict(summary_row)) if summary_row else OverviewSummary(
            total_waste_kg=None, avg_waste_per_entry=None, total_entries=None, estimated_cost_usd=None
        ),
        top_waste_meals=[TopMeal(**dict(r)) for r in top_rows],
        waste_by_hour=[HourWaste(**dict(r)) for r in hour_rows],
    )


@router.get("/demand-forecast", response_model=list[ForecastDay])
async def demand_forecast(user: Auth):
    today = date.today()
    return [
        ForecastDay(
            date=str(today + timedelta(days=i + 1)),
            predicted_servings=random.randint(200, 300),
            confidence=round(random.uniform(0.75, 0.95), 2),
        )
        for i in range(7)
    ]


@router.get("/reduction", response_model=list[WeeklyReduction])
async def reduction(user: Auth, conn: Conn):
    rows = await conn.fetch(
        """SELECT DATE_TRUNC('week', created_at) AS week,
                  ROUND(SUM(weight_kg)::numeric, 2) AS total_kg
           FROM waste_logs
           WHERE created_at >= NOW() - INTERVAL '12 weeks'
           GROUP BY week ORDER BY week"""
    )
    return [WeeklyReduction(**dict(r)) for r in rows]
