from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from server.api.routes import router as ways_router
from server.api.spots import router as spots_router
from server.db.engine import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(title="Ways API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ways_router)
app.include_router(spots_router)


@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable"})


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
