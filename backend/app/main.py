from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import Controllers (Route Handlers)
from app.controllers.auth_controller import router as auth_router
from app.controllers.prediction_controller import router as prediction_router

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cancer Detection API")

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
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
