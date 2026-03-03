from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import PredictionResponse
from app.services import prediction_service, auth_service

router = APIRouter(tags=["Prediction"])
security = HTTPBearer()


@router.on_event("startup")
async def startup_event():
    """Load ML model into memory on server startup."""
    prediction_service.load_model()


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Accept an image upload and return cancer prediction."""
    # Authenticate user
    auth_service.get_user_from_token(credentials.credentials, db)

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a JPEG or PNG."
        )

    try:
        contents = await file.read()
        label, confidence, is_mock = prediction_service.predict(contents)

        msg = "Analysis successful."
        if is_mock:
            msg = "Analysis successful (SIMULATED MODE - No Real Model Loaded)."

        return {
            "filename": file.filename,
            "prediction": label,
            "confidence": confidence,
            "message": msg
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
