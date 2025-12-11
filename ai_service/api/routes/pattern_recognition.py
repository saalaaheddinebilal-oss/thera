from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from engines.pattern_recognition_engine import PatternRecognitionEngine

router = APIRouter()
pattern_engine = PatternRecognitionEngine()

class PatternRecognitionRequest(BaseModel):
    student_id: str
    historical_data: List[Dict[str, Any]]
    data_type: str

class PatternRecognitionResponse(BaseModel):
    analysis_type: str
    identified_patterns: List[Dict]
    trends: List[Dict]
    correlations: List[Dict]
    anomalies: List[Dict]
    insights: List[str]
    confidence: float

@router.post("/analyze", response_model=PatternRecognitionResponse)
async def recognize_patterns(request: PatternRecognitionRequest):
    try:
        result = pattern_engine.analyze(
            request.student_id,
            request.historical_data,
            request.data_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pattern recognition failed: {str(e)}")

@router.post("/discover")
async def discover_insights(student_id: str, time_range: str):
    try:
        result = pattern_engine.discover_insights(student_id, time_range)
        return {
            "key_patterns": result["patterns"],
            "success_factors": result["success_factors"],
            "improvement_areas": result["improvements"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight discovery failed: {str(e)}")
