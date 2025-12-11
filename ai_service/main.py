from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes import speech, behavior, emotion, progress, iep, adaptive_learning, risk_detection, recommendations, pattern_recognition, comprehensive_analysis

app = FastAPI(
    title="AI Therapy Platform",
    description="AI-powered analysis engines for therapeutic education",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(speech.router, prefix="/api/speech", tags=["Speech Analysis"])
app.include_router(behavior.router, prefix="/api/behavior", tags=["Behavior Recognition"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["Emotion Detection"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress Prediction"])
app.include_router(iep.router, prefix="/api/iep", tags=["Auto-IEP Generation"])
app.include_router(adaptive_learning.router, prefix="/api/adaptive", tags=["Adaptive Learning"])
app.include_router(risk_detection.router, prefix="/api/risk", tags=["Risk Detection"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(pattern_recognition.router, prefix="/api/patterns", tags=["Pattern Recognition"])
app.include_router(comprehensive_analysis.router, prefix="/api/analysis", tags=["Comprehensive Analysis"])

@app.get("/")
async def root():
    return {
        "service": "AI Therapy Platform",
        "status": "operational",
        "engines": [
            "Speech Analysis",
            "Behavior Recognition",
            "Emotion Detection",
            "Progress Prediction",
            "Auto-IEP Generation",
            "Adaptive Learning",
            "Risk Detection",
            "Recommendations",
            "Pattern Recognition"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
