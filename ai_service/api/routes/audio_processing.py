from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import librosa
import numpy as np
import os
from typing import Dict, Any

router = APIRouter()

class AudioFeatures(BaseModel):
    mfcc: list
    pitch: float
    tempo: float
    energy: float
    zero_crossing_rate: float
    spectral_centroid: float

@router.post("/extract-features")
async def extract_audio_features(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads/audio", exist_ok=True)
        file_path = f"./uploads/audio/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        y, sr = librosa.load(file_path, sr=None)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1).tolist()

        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch = float(np.median(np.array([np.median(pitches[:, t][pitches[:, t] > 0])
                                           for t in range(pitches.shape[1])
                                           if np.any(pitches[:, t] > 0)], dtype=float)))

        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)

        energy = float(np.mean(librosa.feature.melspectrogram(y=y, sr=sr, power=2)))

        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))

        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))

        os.remove(file_path)

        return {
            "mfcc": mfcc_mean,
            "pitch": pitch if not np.isnan(pitch) else 0.0,
            "tempo": float(tempo),
            "energy": energy,
            "zero_crossing_rate": zcr,
            "spectral_centroid": spectral_centroid,
            "analysis_status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")

@router.post("/speech-to-text")
async def convert_speech_to_text(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads/audio", exist_ok=True)
        file_path = f"./uploads/audio/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            with sr.AudioFile(file_path) as source:
                audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
        except:
            text = "Speech recognition not available"

        os.remove(file_path)

        return {
            "text": text,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech-to-text error: {str(e)}")

@router.post("/fluency-analysis")
async def analyze_fluency(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads/audio", exist_ok=True)
        file_path = f"./uploads/audio/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        y, sr = librosa.load(file_path, sr=None)

        energy = librosa.feature.melspectrogram(y=y, sr=sr, power=2)
        energy_mean = np.mean(energy)

        frames = librosa.frames_to_time(np.arange(len(y)), sr=sr)
        duration = float(librosa.get_duration(y=y, sr=sr))

        estimated_syllables = int(duration * 4)
        speech_rate = estimated_syllables / (duration / 60) if duration > 0 else 0

        pause_threshold = energy_mean * 0.2
        pauses = np.where(np.mean(energy, axis=0) < pause_threshold)[0]
        pause_count = len(pauses)

        fluency_score = min(1.0, max(0.0, 1.0 - (pause_count / 100)))

        os.remove(file_path)

        return {
            "speech_rate": float(speech_rate),
            "pause_count": int(pause_count),
            "duration_seconds": float(duration),
            "fluency_score": float(fluency_score),
            "analysis_status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fluency analysis error: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "audio_processing_healthy"}
