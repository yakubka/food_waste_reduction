import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.database import close_pool, get_pool
from routers import alerts, analytics, auth, meals, waste
from services.mqtt_service import run_mqtt_listener

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    logger.info("Database pool ready")
    mqtt_task = asyncio.create_task(run_mqtt_listener())
    yield
    mqtt_task.cancel()
    await close_pool()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal Server Error"})


app.include_router(auth.router,      prefix="/api")
app.include_router(waste.router,     prefix="/api")
app.include_router(meals.router,     prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(alerts.router,    prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
