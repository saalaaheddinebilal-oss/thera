from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import os
from typing import List, Dict, Any

router = APIRouter()

class VideoFrame(BaseModel):
    frame_number: int
    timestamp: float
    features: Dict[str, Any]

@router.post("/extract-frames")
async def extract_video_frames(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads/video", exist_ok=True)
        file_path = f"./uploads/video/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        cap = cv2.VideoCapture(file_path)

        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        frame_count = 0
        frames_data = []

        while frame_count < min(total_frames, 100):
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = frame_count / fps if fps > 0 else 0

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            motion = np.sum(edges) / (width * height) if width * height > 0 else 0

            frames_data.append({
                "frame_number": frame_count,
                "timestamp": float(timestamp),
                "motion_level": float(motion)
            })

            frame_count += 1

        cap.release()
        os.remove(file_path)

        return {
            "total_frames": total_frames,
            "fps": fps,
            "width": width,
            "height": height,
            "duration_seconds": float(total_frames / fps) if fps > 0 else 0,
            "extracted_frames": frames_data,
            "extraction_status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video frame extraction error: {str(e)}")

@router.post("/detect-movement")
async def detect_movement(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads/video", exist_ok=True)
        file_path = f"./uploads/video/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        cap = cv2.VideoCapture(file_path)

        fps = int(cap.get(cv2.CAP_PROP_FPS))
        ret, prev_frame = cap.read()

        if not ret:
            raise HTTPException(status_code=400, detail="Unable to read video")

        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        movement_scores = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
            )

            mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            movement_score = np.mean(mag)

            movement_scores.append(float(movement_score))

            prev_gray = gray
            frame_count += 1

            if frame_count >= 100:
                break

        cap.release()
        os.remove(file_path)

        avg_movement = float(np.mean(movement_scores)) if movement_scores else 0
        max_movement = float(np.max(movement_scores)) if movement_scores else 0

        activity_level = min(1.0, max(0.0, avg_movement / 50.0))

        return {
            "average_movement": avg_movement,
            "max_movement": max_movement,
            "activity_level": activity_level,
            "frames_analyzed": len(movement_scores),
            "detection_status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Movement detection error: {str(e)}")

@router.post("/scene-detection")
async def detect_scenes(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads/video", exist_ok=True)
        file_path = f"./uploads/video/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        cap = cv2.VideoCapture(file_path)

        fps = int(cap.get(cv2.CAP_PROP_FPS))
        ret, prev_frame = cap.read()

        if not ret:
            raise HTTPException(status_code=400, detail="Unable to read video")

        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        scene_changes = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            difference = cv2.absdiff(prev_gray, gray)
            change_score = np.mean(difference)

            if change_score > 20:
                scene_changes.append({
                    "frame": frame_count,
                    "timestamp": float(frame_count / fps) if fps > 0 else 0,
                    "change_score": float(change_score)
                })

            prev_gray = gray
            frame_count += 1

            if frame_count >= 300:
                break

        cap.release()
        os.remove(file_path)

        return {
            "scene_changes": scene_changes,
            "total_scenes_detected": len(scene_changes),
            "detection_status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scene detection error: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "video_processing_healthy"}
