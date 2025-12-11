from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from engines.progress_engine import ProgressPredictionEngine

router = APIRouter()
progress_engine = ProgressPredictionEngine()

class ProgressPredictionRequest(BaseModel):
    student_id: str
    progress_data: List[Dict[str, Any]]

class ProgressPredictionResponse(BaseModel):
    analysis_type: str
    current_trajectory: str
    predicted_progress: List[Dict]
    goal_achievement_probability: float
    estimated_timeline: Dict[str, int]
    intervention_suggestions: List[str]
    confidence: float

@router.post("/predict", response_model=ProgressPredictionResponse)
async def predict_progress(request: ProgressPredictionRequest):
    try:
        result = progress_engine.predict(request.student_id, request.progress_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress prediction failed: {str(e)}")

@router.post("/forecast")
async def forecast_development(request: ProgressPredictionRequest):
    try:
        result = progress_engine.forecast(request.student_id, request.progress_data)
        return {
            "short_term_forecast": result["short_term"],
            "long_term_forecast": result["long_term"],
            "key_milestones": result["milestones"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Development forecast failed: {str(e)}")
