from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from engines.emotion_engine import EmotionDetectionEngine

router = APIRouter()
emotion_engine = EmotionDetectionEngine()

class EmotionDetectionRequest(BaseModel):
    image_data: str
    student_id: str

class EmotionDetectionResponse(BaseModel):
    analysis_type: str
    primary_emotion: str
    emotion_scores: Dict[str, float]
    facial_expressions: List[str]
    stress_level: float
    engagement_level: float
    confidence: float

@router.post("/detect", response_model=EmotionDetectionResponse)
async def detect_emotion(request: EmotionDetectionRequest):
    try:
        result = emotion_engine.analyze(request.image_data, request.student_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {str(e)}")

@router.post("/track-timeline")
async def track_emotion_timeline(request: EmotionDetectionRequest):
    try:
        result = emotion_engine.track_timeline(request.image_data, request.student_id)
        return {
            "timeline": result["emotions_over_time"],
            "dominant_emotion": result["dominant"],
            "emotional_stability": result["stability"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion timeline tracking failed: {str(e)}")
