from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import numpy as np
from engines.speech_engine import SpeechAnalysisEngine

router = APIRouter()
speech_engine = SpeechAnalysisEngine()

class SpeechAnalysisRequest(BaseModel):
    audio_data: str
    student_id: str

class SpeechAnalysisResponse(BaseModel):
    analysis_type: str
    pronunciation_score: float
    clarity_score: float
    fluency_score: float
    detected_words: list
    problematic_sounds: list
    recommendations: list
    confidence: float

@router.post("/analyze", response_model=SpeechAnalysisResponse)
async def analyze_speech(request: SpeechAnalysisRequest):
    try:
        result = speech_engine.analyze(request.audio_data, request.student_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech analysis failed: {str(e)}")

@router.post("/transcribe")
async def transcribe_audio(request: SpeechAnalysisRequest):
    try:
        result = speech_engine.transcribe(request.audio_data)
        return {
            "transcription": result["text"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
