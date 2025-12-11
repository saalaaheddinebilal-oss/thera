from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from engines.speech_engine import SpeechAnalysisEngine
from engines.behavior_engine import BehaviorRecognitionEngine
from engines.emotion_engine import EmotionDetectionEngine
from engines.progress_engine import ProgressPredictionEngine
from engines.autism_screening_engine import AutismScreeningEngine
from engines.risk_detection_engine import RiskDetectionEngine

router = APIRouter()

speech_engine = SpeechAnalysisEngine()
behavior_engine = BehaviorRecognitionEngine()
emotion_engine = EmotionDetectionEngine()
progress_engine = ProgressPredictionEngine()
autism_engine = AutismScreeningEngine()
risk_engine = RiskDetectionEngine()

class SpeechAnalysisRequest(BaseModel):
    student_id: str
    audio_data: Optional[str] = None
    text_input: Optional[str] = None
    session_id: Optional[str] = None

class BehaviorAnalysisRequest(BaseModel):
    student_id: str
    video_data: Optional[str] = None
    observation_notes: Optional[str] = None
    session_id: Optional[str] = None

class EmotionAnalysisRequest(BaseModel):
    student_id: str
    image_data: Optional[str] = None
    context: Optional[str] = None
    session_id: Optional[str] = None

class ProgressPredictionRequest(BaseModel):
    student_id: str
    progress_data: List[Dict[str, Any]]
    historical_sessions: Optional[List[Dict]] = []

class RiskDetectionRequest(BaseModel):
    student_id: str
    behavioral_data: List[Dict]
    progress_data: List[Dict]
    recent_assessments: Optional[List[Dict]] = []

class AutismScreeningRequest(BaseModel):
    student_id: str
    q_chat_answers: Dict[str, int]
    age_months: int
    sex: str
    jaundice: str
    family_asd: str
    additional_info: Optional[Dict] = {}

@router.post("/speech/analyze")
async def analyze_speech_comprehensive(request: SpeechAnalysisRequest):
    try:
        result = speech_engine.analyze(
            request.audio_data or "",
            request.student_id
        )

        areas_for_improvement = []
        if result.get('pronunciation_score', 0) < 0.7:
            areas_for_improvement.append("Pronunciation clarity")
        if result.get('fluency_score', 0) < 0.7:
            areas_for_improvement.append("Speech fluency")
        if result.get('clarity_score', 0) < 0.7:
            areas_for_improvement.append("Articulation")

        return {
            **result,
            "areas_for_improvement": areas_for_improvement,
            "overall_assessment": _get_speech_assessment(result),
            "intervention_priority": _determine_priority(result.get('confidence', 0.5))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech analysis failed: {str(e)}")

@router.post("/behavior/analyze")
async def analyze_behavior_comprehensive(request: BehaviorAnalysisRequest):
    try:
        result = behavior_engine.analyze(
            request.video_data or "",
            request.student_id
        )

        behavioral_summary = {
            "attention_quality": "Good" if result.get('attention_span_seconds', 0) > 60 else "Needs Improvement",
            "social_engagement": "Good" if result.get('social_interaction_score', 0) > 0.7 else "Needs Support",
            "activity_appropriateness": result.get('activity_level', 'moderate')
        }

        return {
            **result,
            "behavioral_summary": behavioral_summary,
            "intervention_recommendations": _get_behavioral_interventions(result),
            "strengths": _identify_behavioral_strengths(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Behavior analysis failed: {str(e)}")

@router.post("/emotion/analyze")
async def analyze_emotion_comprehensive(request: EmotionAnalysisRequest):
    try:
        result = emotion_engine.analyze(
            request.image_data or "",
            request.student_id
        )

        emotional_state = {
            "primary_emotion": result.get('primary_emotion', 'neutral'),
            "stress_level": "High" if result.get('stress_level', 0) > 0.7 else "Normal",
            "engagement_level": "High" if result.get('engagement_level', 0) > 0.7 else "Moderate",
            "emotional_stability": _assess_emotional_stability(result)
        }

        return {
            **result,
            "emotional_state": emotional_state,
            "support_recommendations": _get_emotional_support(result),
            "environmental_adjustments": _suggest_environment_changes(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")

@router.post("/progress/predict")
async def predict_progress_comprehensive(request: ProgressPredictionRequest):
    try:
        result = progress_engine.predict(
            request.student_id,
            request.progress_data
        )

        progress_insights = {
            "trend": result.get('current_trajectory', 'stable'),
            "goal_likelihood": result.get('goal_achievement_probability', 0.5),
            "estimated_timeline": result.get('estimated_timeline', {}),
            "key_milestones": _identify_milestones(result)
        }

        return {
            **result,
            "progress_insights": progress_insights,
            "acceleration_strategies": _suggest_acceleration(result),
            "areas_requiring_focus": _identify_focus_areas(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress prediction failed: {str(e)}")

@router.post("/risk/detect")
async def detect_risks_comprehensive(request: RiskDetectionRequest):
    try:
        result = risk_engine.analyze(
            request.student_id,
            request.behavioral_data,
            request.progress_data
        )

        risk_summary = {
            "overall_risk": result.get('risk_level', 'low'),
            "priority": result.get('intervention_priority', 'low'),
            "identified_concerns": result.get('identified_risks', []),
            "early_warnings": result.get('early_warnings', [])
        }

        return {
            **result,
            "risk_summary": risk_summary,
            "immediate_actions": _get_immediate_actions(result),
            "monitoring_plan": _create_monitoring_plan(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk detection failed: {str(e)}")

@router.post("/autism/screen")
async def screen_autism(request: AutismScreeningRequest):
    try:
        features = {
            **request.q_chat_answers,
            'age_months': request.age_months,
            'sex': request.sex,
            'jaundice': request.jaundice,
            'family_asd': request.family_asd
        }

        result = autism_engine.analyze_behavioral_features(features)

        screening_summary = {
            "risk_level": result.get('asd_risk', 'unknown'),
            "confidence": result.get('confidence', 0.0),
            "traits_detected": result.get('asd_traits_detected', False),
            "behavioral_score": result.get('behavioral_score', 0)
        }

        return {
            **result,
            "screening_summary": screening_summary,
            "next_steps": _get_autism_next_steps(result),
            "resources": _get_autism_resources(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autism screening failed: {str(e)}")

@router.post("/comprehensive")
async def comprehensive_analysis(student_id: str, data_package: Dict[str, Any]):
    try:
        results = {}

        if 'speech_data' in data_package:
            results['speech'] = await analyze_speech_comprehensive(
                SpeechAnalysisRequest(
                    student_id=student_id,
                    **data_package['speech_data']
                )
            )

        if 'behavior_data' in data_package:
            results['behavior'] = await analyze_behavior_comprehensive(
                BehaviorAnalysisRequest(
                    student_id=student_id,
                    **data_package['behavior_data']
                )
            )

        if 'emotion_data' in data_package:
            results['emotion'] = await analyze_emotion_comprehensive(
                EmotionAnalysisRequest(
                    student_id=student_id,
                    **data_package['emotion_data']
                )
            )

        overall_assessment = _generate_overall_assessment(results)

        return {
            "student_id": student_id,
            "individual_analyses": results,
            "overall_assessment": overall_assessment,
            "integrated_recommendations": _generate_integrated_recommendations(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comprehensive analysis failed: {str(e)}")

def _get_speech_assessment(result: Dict) -> str:
    avg_score = (
        result.get('pronunciation_score', 0) +
        result.get('clarity_score', 0) +
        result.get('fluency_score', 0)
    ) / 3

    if avg_score >= 0.8:
        return "Excellent speech development"
    elif avg_score >= 0.6:
        return "Good progress with room for improvement"
    else:
        return "Requires focused speech therapy intervention"

def _determine_priority(confidence: float) -> str:
    if confidence > 0.8:
        return "high"
    elif confidence > 0.6:
        return "medium"
    else:
        return "low"

def _get_behavioral_interventions(result: Dict) -> List[str]:
    interventions = []
    if result.get('attention_span_seconds', 0) < 45:
        interventions.append("Implement structured attention-building exercises")
    if result.get('social_interaction_score', 0) < 0.6:
        interventions.append("Increase peer interaction opportunities")
    if result.get('alerts', []):
        interventions.append("Address identified behavioral concerns")
    return interventions

def _identify_behavioral_strengths(result: Dict) -> List[str]:
    strengths = []
    for behavior in result.get('detected_behaviors', []):
        if behavior.get('confidence', 0) > 0.8:
            strengths.append(behavior.get('behavior', ''))
    return strengths

def _assess_emotional_stability(result: Dict) -> str:
    stress = result.get('stress_level', 0.5)
    if stress < 0.3:
        return "Stable"
    elif stress < 0.6:
        return "Moderate variability"
    else:
        return "Requires support"

def _get_emotional_support(result: Dict) -> List[str]:
    recommendations = []
    if result.get('stress_level', 0) > 0.6:
        recommendations.append("Implement stress reduction techniques")
    if result.get('engagement_level', 0) < 0.5:
        recommendations.append("Increase motivational activities")
    return recommendations

def _suggest_environment_changes(result: Dict) -> List[str]:
    changes = []
    primary = result.get('primary_emotion', 'neutral')
    if primary in ['anxious', 'frustrated', 'sad']:
        changes.append("Create calmer, more supportive environment")
        changes.append("Reduce sensory overload")
    return changes

def _identify_milestones(result: Dict) -> List[Dict]:
    milestones = []
    predicted = result.get('predicted_progress', [])
    for item in predicted[:3]:
        milestones.append({
            "goal": item.get('area', 'general'),
            "target_date": item.get('date', ''),
            "predicted_score": item.get('predicted_score', 0)
        })
    return milestones

def _suggest_acceleration(result: Dict) -> List[str]:
    strategies = []
    trajectory = result.get('current_trajectory', 'stable')
    if trajectory == 'improving':
        strategies.append("Continue current approach with increased frequency")
    elif trajectory == 'stable':
        strategies.append("Introduce new challenge elements")
    else:
        strategies.append("Reassess intervention strategy")
    return strategies

def _identify_focus_areas(result: Dict) -> List[str]:
    return result.get('intervention_suggestions', [])

def _get_immediate_actions(result: Dict) -> List[str]:
    actions = []
    risk_level = result.get('risk_level', 'low')
    if risk_level == 'high':
        actions.append("Schedule immediate clinical review")
        actions.append("Increase monitoring frequency")
    return actions or ["Continue standard monitoring"]

def _create_monitoring_plan(result: Dict) -> Dict:
    return {
        "frequency": "weekly" if result.get('risk_level') == 'high' else "bi-weekly",
        "focus_areas": [r.get('risk_type') for r in result.get('identified_risks', [])[:3]],
        "review_date": "7 days" if result.get('risk_level') == 'high' else "14 days"
    }

def _get_autism_next_steps(result: Dict) -> List[str]:
    steps = []
    risk = result.get('asd_risk', 'low')
    if risk == 'high':
        steps.append("Schedule comprehensive clinical evaluation")
        steps.append("Refer to developmental specialist")
    elif risk == 'moderate':
        steps.append("Schedule follow-up screening in 3 months")
        steps.append("Monitor developmental milestones")
    else:
        steps.append("Continue regular developmental monitoring")
    return steps

def _get_autism_resources(result: Dict) -> List[Dict]:
    return [
        {"type": "clinical", "name": "Developmental Pediatrician Referral"},
        {"type": "support", "name": "Early Intervention Programs"},
        {"type": "educational", "name": "ASD Parent Support Groups"}
    ]

def _generate_overall_assessment(results: Dict) -> Dict:
    concerns = []
    strengths = []

    for analysis_type, data in results.items():
        if isinstance(data, dict):
            if analysis_type == 'speech' and data.get('confidence', 0) < 0.7:
                concerns.append("Speech development requires attention")
            if analysis_type == 'behavior' and data.get('alerts', []):
                concerns.append("Behavioral patterns need monitoring")

    return {
        "overall_status": "On track" if len(concerns) == 0 else "Requires attention",
        "key_concerns": concerns,
        "identified_strengths": strengths,
        "coordination_needed": len(concerns) > 2
    }

def _generate_integrated_recommendations(results: Dict) -> List[str]:
    recommendations = []

    if 'speech' in results:
        recommendations.extend(results['speech'].get('recommendations', []))
    if 'behavior' in results:
        recommendations.extend(results['behavior'].get('patterns', []))

    return list(set(recommendations))[:5]
