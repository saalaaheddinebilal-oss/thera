from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from engines.adaptive_learning_engine import AdaptiveLearningEngine

router = APIRouter()
adaptive_engine = AdaptiveLearningEngine()

class AdaptiveLearningRequest(BaseModel):
    student_id: str
    current_activity: Dict[str, Any]
    performance_data: List[Dict]

class AdaptiveLearningResponse(BaseModel):
    analysis_type: str
    difficulty_adjustment: str
    recommended_content: List[Dict]
    learning_style: str
    optimal_pace: str
    next_activities: List[Dict]
    confidence: float

@router.post("/adjust", response_model=AdaptiveLearningResponse)
async def adjust_learning(request: AdaptiveLearningRequest):
    try:
        result = adaptive_engine.adjust_content(
            request.student_id,
            request.current_activity,
            request.performance_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adaptive learning adjustment failed: {str(e)}")

@router.post("/personalize")
async def personalize_content(student_id: str, learning_profile: Dict):
    try:
        result = adaptive_engine.personalize(student_id, learning_profile)
        return {
            "personalized_curriculum": result["curriculum"],
            "optimal_difficulty": result["difficulty"],
            "engagement_strategies": result["strategies"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content personalization failed: {str(e)}")
