from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from engines.iep_engine import AutoIEPEngine

router = APIRouter()
iep_engine = AutoIEPEngine()

class IEPGenerationRequest(BaseModel):
    student_data: Dict[str, Any]

class IEPGenerationResponse(BaseModel):
    analysis_type: str
    goals: List[Dict[str, Any]]
    accommodations: List[str]
    assessment_plan: Dict[str, Any]
    focus_areas: List[str]
    timeline: Dict[str, Any]
    confidence: float

@router.post("/generate", response_model=IEPGenerationResponse)
async def generate_iep(request: IEPGenerationRequest):
    try:
        result = iep_engine.generate(request.student_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IEP generation failed: {str(e)}")

@router.post("/update")
async def update_iep_goals(student_id: str, progress_data: List[Dict]):
    try:
        result = iep_engine.update_goals(student_id, progress_data)
        return {
            "updated_goals": result["goals"],
            "new_accommodations": result["accommodations"],
            "adjustments_needed": result["adjustments"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IEP update failed: {str(e)}")
