import numpy as np
from typing import Dict, Any, List

class BehaviorRecognitionEngine:
    def __init__(self):
        self.model_loaded = False

    def analyze(self, video_data: str, student_id: str) -> Dict[str, Any]:
        detected_behaviors = [
            {"behavior": "focused_attention", "duration": 45.5, "confidence": 0.89},
            {"behavior": "hand_stimming", "duration": 12.3, "confidence": 0.76},
            {"behavior": "social_engagement", "duration": 23.1, "confidence": 0.82}
        ]

        attention_span_seconds = np.random.uniform(30, 120)
        activity_levels = ["low", "moderate", "high"]
        activity_level = np.random.choice(activity_levels)
        social_interaction_score = np.random.uniform(0.5, 0.95)

        patterns = [
            "Shows increased focus during visual activities",
            "Requires movement breaks every 20 minutes",
            "Responds well to positive reinforcement"
        ]

        alerts = []
        if attention_span_seconds < 45:
            alerts.append("Attention span below age-appropriate range")
        if social_interaction_score < 0.6:
            alerts.append("Low social engagement detected")

        return {
            "analysis_type": "behavior",
            "detected_behaviors": detected_behaviors,
            "attention_span_seconds": round(attention_span_seconds, 1),
            "activity_level": activity_level,
            "social_interaction_score": round(social_interaction_score, 2),
            "patterns": patterns,
            "alerts": alerts,
            "confidence": 0.83
        }

    def track_attention(self, video_data: str) -> Dict[str, Any]:
        spans = [45.2, 38.7, 52.1, 41.3, 47.9]
        average = np.mean(spans)
        quality = "good" if average > 45 else "needs improvement"

        return {
            "spans": spans,
            "average": round(average, 1),
            "quality": quality
        }
