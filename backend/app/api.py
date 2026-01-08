from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas import PredictionResponse
from app.ml_service import predict, load_model

router = APIRouter()

@router.on_event("startup")
async def startup_event():
    load_model()

@router.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(file: UploadFile = File(...)):
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a JPEG or PNG.")

    try:
        contents = await file.read()
        label, confidence, is_mock = predict(contents)
        
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