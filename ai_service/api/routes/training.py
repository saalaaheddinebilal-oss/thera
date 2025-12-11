from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from pydantic import BaseModel
import pandas as pd
import os
from typing import List, Dict, Any
import json

router = APIRouter()

class DatasetPreviewRequest(BaseModel):
    file_path: str

class TrainingRequest(BaseModel):
    configuration_id: str
    dataset_id: str
    model_type: str
    target_column: str
    feature_columns: List[str]
    train_test_split: float
    hyperparameters: Dict[str, Any]

@router.post("/dataset-preview")
async def get_dataset_preview(request: DatasetPreviewRequest):
    try:
        file_path = f"./datas/{request.file_path}"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")

        df = pd.read_csv(file_path)
        df.columns = df.columns.str.strip()

        columns = df.columns.tolist()
        data = df.head(5).to_dict('records')

        return {
            "columns": columns,
            "data": data,
            "row_count": len(df),
            "column_count": len(columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        os.makedirs("./datas/uploads", exist_ok=True)
        file_path = f"./datas/uploads/{file.filename}"

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        df = pd.read_csv(file_path)

        return {
            "filename": file.filename,
            "file_path": f"uploads/{file.filename}",
            "row_count": len(df),
            "column_count": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-training")
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(run_training, request)
        return {"status": "training_started", "configuration_id": request.configuration_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_training(request: TrainingRequest):
    try:
        file_path = f"./datas/{request.file_path}" if not request.file_path.startswith("uploads") else f"./datas/{request.file_path}"
        if not os.path.exists(file_path):
            raise Exception("Dataset not found")

        df = pd.read_csv(file_path)
        df.columns = df.columns.str.strip()

        X = df[request.feature_columns]
        y = df[request.target_column]

        from sklearn.model_selection import train_test_split
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=1 - request.train_test_split, random_state=42
        )

        if request.model_type == 'random_forest':
            model = RandomForestClassifier(**request.hyperparameters)
        elif request.model_type == 'gradient_boosting':
            model = GradientBoostingClassifier(**request.hyperparameters)
        else:
            raise ValueError("Unsupported model type")

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        os.makedirs("./models", exist_ok=True)
        model_path = f"./models/{request.configuration_id}.pkl"
        import pickle
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)

        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "model_path": model_path
        }
    except Exception as e:
        print(f"Training error: {e}")

@router.get("/health")
async def health_check():
    return {"status": "training_service_healthy"}
