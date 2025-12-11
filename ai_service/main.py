from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json

from api.routes import speech, behavior, emotion, progress, iep, adaptive_learning, risk_detection, recommendations, pattern_recognition, comprehensive_analysis, training, audio_processing, video_processing

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
app.include_router(training.router, prefix="/api/training", tags=["Model Training"])
app.include_router(audio_processing.router, prefix="/api/audio", tags=["Audio Processing"])
app.include_router(video_processing.router, prefix="/api/video", tags=["Video Processing"])

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

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/training")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.broadcast(message)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
