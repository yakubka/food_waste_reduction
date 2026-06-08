from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_conn
from core.security import create_token, hash_password, verify_password
from models.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, conn: Annotated[asyncpg.Connection, Depends(get_conn)]):
    try:
        row = await conn.fetchrow(
            """INSERT INTO users (email, password_hash, name, role, cafeteria_id)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id, email, name, role""",
            body.email,
            hash_password(body.password),
            body.name,
            body.role,
            body.cafeteria_id,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = UserOut(**dict(row))
    token = create_token({"id": str(user.id), "role": user.role})
    return TokenResponse(user=user, token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, conn: Annotated[asyncpg.Connection, Depends(get_conn)]):
    row = await conn.fetchrow("SELECT * FROM users WHERE email=$1", body.email)
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    user = UserOut(id=row["id"], email=row["email"], name=row["name"], role=row["role"])
    token = create_token({"id": str(user.id), "role": user.role})
    return TokenResponse(user=user, token=token)
