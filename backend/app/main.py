from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.controllers.auth_controller import router as auth_router
from app.controllers.prediction_controller import router as prediction_router
from app.services import prediction_service, ood_service

# Create database tables on startup
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models once when the server starts, clean up on shutdown."""
    # ── Startup ──────────────────────────────────────────────────────────────
    ood_service.load_clip_model()
    prediction_service.load_model()
    yield
    # ── Shutdown (nothing to clean up right now) ──────────────────────────────


app = FastAPI(title="Cancer Detection API", lifespan=lifespan)

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(prediction_router)


@app.get("/")
def read_root():
    return {"status": "running", "message": "Cancer Detection API is active."}
