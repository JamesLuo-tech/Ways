from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.api.routes import router as ways_router
from server.api.spots import router as spots_router

app = FastAPI(title="Ways API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ways_router)
app.include_router(spots_router)


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
