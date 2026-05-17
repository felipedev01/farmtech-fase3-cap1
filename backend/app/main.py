from contextlib import asynccontextmanager

import oracledb
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.oracle import close_pool, init_pool, ping

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_pool(settings)
    try:
        ping()
        yield
    finally:
        close_pool()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def handle_app_error(_: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(oracledb.DatabaseError)
async def handle_oracle_error(_: Request, __: oracledb.DatabaseError):
    return JSONResponse(
        status_code=500,
        content={"detail": "A API nao conseguiu completar a operacao no Oracle."},
    )


@app.get("/health/db")
def database_health() -> dict[str, str]:
    ping()
    return {"status": "ok", "database": "oracle"}


app.include_router(router)
