from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from engines.recommendation_engine import RecommendationEngine

router = APIRouter()
recommendation_engine = RecommendationEngine()

class RecommendationRequest(BaseModel):
    student_id: str
    current_performance: Dict[str, Any]
    focus_areas: List[str]

class RecommendationResponse(BaseModel):
    analysis_type: str
    activities: List[Dict]
    interventions: List[Dict]
    resources: List[Dict]
    daily_schedule: List[Dict]
    parent_activities: List[Dict]
    confidence: float

@router.post("/generate", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest):
    try:
        result = recommendation_engine.generate(
            request.student_id,
            request.current_performance,
            request.focus_areas
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@router.post("/daily-plan")
async def create_daily_plan(student_id: str, preferences: Dict):
    try:
        result = recommendation_engine.create_daily_plan(student_id, preferences)
        return {
            "morning_activities": result["morning"],
            "midday_activities": result["midday"],
            "evening_activities": result["evening"],
            "flexibility_notes": result["notes"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daily plan creation failed: {str(e)}")
