from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from engines.risk_detection_engine import RiskDetectionEngine

router = APIRouter()
risk_engine = RiskDetectionEngine()

class RiskDetectionRequest(BaseModel):
    student_id: str
    behavioral_data: List[Dict]
    progress_data: List[Dict]

class RiskDetectionResponse(BaseModel):
    analysis_type: str
    risk_level: str
    identified_risks: List[Dict]
    early_warnings: List[str]
    intervention_priority: str
    recommended_actions: List[str]
    confidence: float

@router.post("/detect", response_model=RiskDetectionResponse)
async def detect_risks(request: RiskDetectionRequest):
    try:
        result = risk_engine.analyze(
            request.student_id,
            request.behavioral_data,
            request.progress_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk detection failed: {str(e)}")

@router.post("/monitor")
async def monitor_student(student_id: str):
    try:
        result = risk_engine.continuous_monitor(student_id)
        return {
            "status": result["status"],
            "alerts": result["alerts"],
            "trends": result["trends"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Student monitoring failed: {str(e)}")
