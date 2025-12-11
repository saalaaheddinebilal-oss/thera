from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from engines.behavior_engine import BehaviorRecognitionEngine

router = APIRouter()
behavior_engine = BehaviorRecognitionEngine()

class BehaviorAnalysisRequest(BaseModel):
    video_data: str
    student_id: str

class BehaviorAnalysisResponse(BaseModel):
    analysis_type: str
    detected_behaviors: List[Dict]
    attention_span_seconds: float
    activity_level: str
    social_interaction_score: float
    patterns: List[str]
    alerts: List[str]
    confidence: float

@router.post("/analyze", response_model=BehaviorAnalysisResponse)
async def analyze_behavior(request: BehaviorAnalysisRequest):
    try:
        result = behavior_engine.analyze(request.video_data, request.student_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Behavior analysis failed: {str(e)}")

@router.post("/track-attention")
async def track_attention(request: BehaviorAnalysisRequest):
    try:
        result = behavior_engine.track_attention(request.video_data)
        return {
            "attention_spans": result["spans"],
            "average_attention": result["average"],
            "focus_quality": result["quality"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attention tracking failed: {str(e)}")
