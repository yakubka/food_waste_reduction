from typing import Annotated
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from core.database import get_conn
from core.security import get_current_user
from models.schemas import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])
Auth = Annotated[dict, Depends(get_current_user)]
Conn = Annotated[asyncpg.Connection, Depends(get_conn)]


@router.get("/", response_model=list[AlertOut])
async def list_alerts(user: Auth, conn: Conn, cafeteria_id: UUID | None = None):
    rows = await conn.fetch(
        "SELECT * FROM alerts WHERE ($1::uuid IS NULL OR cafeteria_id=$1) ORDER BY created_at DESC LIMIT 50",
        cafeteria_id,
    )
    return [AlertOut(**dict(r)) for r in rows]


@router.patch("/{alert_id}/read", response_model=dict)
async def mark_read(alert_id: UUID, user: Auth, conn: Conn, cafeteria_id: UUID | None = None):
    result = await conn.execute(
        "UPDATE alerts SET is_read=true WHERE id=$1 AND ($2::uuid IS NULL OR cafeteria_id=$2)",
        alert_id, cafeteria_id,
    )
    if result == "UPDATE 0":
        raise HTTPException(404, "Alert not found")
    return {"success": True}
