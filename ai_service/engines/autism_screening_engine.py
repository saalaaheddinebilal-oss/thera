import numpy as np
import pandas as pd
from typing import Dict, Any, List
import os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import pickle
import warnings
warnings.filterwarnings('ignore')

class AutismScreeningEngine:
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.feature_columns = []
        self.model_trained = False
        self.model_path = './models/autism_screening_model.pkl'
        self.encoders_path = './models/autism_encoders.pkl'

        self._ensure_model_directory()
        self._load_or_train_model()

    def _ensure_model_directory(self):
        os.makedirs('./models', exist_ok=True)

    def _load_or_train_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.encoders_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.encoders_path, 'rb') as f:
                    data = pickle.load(f)
                    self.label_encoders = data['encoders']
                    self.feature_columns = data['features']
                self.model_trained = True
                print("Autism screening model loaded successfully")
            except Exception as e:
                print(f"Error loading model: {e}. Will train new model.")
                self._train_model()
        else:
            self._train_model()

    def _train_model(self):
        try:
            csv_path = './datas/Autism_screening/Autism_Screening_Data_Combined.csv'
            if not os.path.exists(csv_path):
                print(f"Warning: CSV file not found at {csv_path}")
                self._create_default_model()
                return

            df = pd.read_csv(csv_path)

            df.columns = df.columns.str.strip()

            target_columns = ['Class/ASD Traits ', 'Class/ASD']
            target_col = None
            for col in target_columns:
                if col in df.columns:
                    target_col = col
                    break

            if target_col is None:
                print("Target column not found. Creating default model.")
                self._create_default_model()
                return

            df = df.dropna()

            self.feature_columns = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
                                   'Age_Mons', 'Sex', 'Jaundice', 'Family_mem_with_ASD']

            available_features = [col for col in self.feature_columns if col in df.columns]

            if len(available_features) < 10:
                print("Not enough features found. Creating default model.")
                self._create_default_model()
                return

            self.feature_columns = available_features

            X = df[self.feature_columns].copy()
            y = df[target_col].copy()

            y = y.astype(str).str.strip()
            y = y.replace({'YES': 'Yes', 'NO': 'No', 'yes': 'Yes', 'no': 'No'})

            for col in X.columns:
                if X[col].dtype == 'object':
                    le = LabelEncoder()
                    X[col] = X[col].astype(str).str.strip()
                    X[col] = le.fit_transform(X[col])
                    self.label_encoders[col] = le

            y_encoder = LabelEncoder()
            y_encoded = y_encoder.fit_transform(y)
            self.label_encoders['target'] = y_encoder

            X_train, X_test, y_train, y_test = train_test_split(
                X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
            )

            self.model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )

            self.model.fit(X_train, y_train)

            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')

            print(f"Model trained successfully!")
            print(f"Accuracy: {accuracy:.3f}")
            print(f"Precision: {precision:.3f}")
            print(f"Recall: {recall:.3f}")
            print(f"F1-Score: {f1:.3f}")

            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)

            with open(self.encoders_path, 'wb') as f:
                pickle.dump({
                    'encoders': self.label_encoders,
                    'features': self.feature_columns
                }, f)

            self.model_trained = True

        except Exception as e:
            print(f"Error training model: {e}")
            self._create_default_model()

    def _create_default_model(self):
        self.model = GradientBoostingClassifier(n_estimators=50, random_state=42)
        self.feature_columns = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']
        X_dummy = np.random.randint(0, 2, size=(100, len(self.feature_columns)))
        y_dummy = np.random.randint(0, 2, size=100)
        self.model.fit(X_dummy, y_dummy)
        self.model_trained = True
        print("Default model created")

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if not self.model_trained:
            return {
                "error": "Model not trained",
                "asd_risk": "unknown",
                "confidence": 0.0
            }

        try:
            feature_vector = []
            for col in self.feature_columns:
                value = features.get(col, 0)

                if col in self.label_encoders and col != 'target':
                    try:
                        value = self.label_encoders[col].transform([str(value)])[0]
                    except:
                        value = 0

                feature_vector.append(value)

            X = np.array([feature_vector])

            prediction = self.model.predict(X)[0]
            probabilities = self.model.predict_proba(X)[0]

            if 'target' in self.label_encoders:
                prediction_label = self.label_encoders['target'].inverse_transform([prediction])[0]
            else:
                prediction_label = "Yes" if prediction == 1 else "No"

            confidence = float(max(probabilities))

            risk_level = "high" if prediction_label == "Yes" else "low"
            if confidence < 0.7:
                risk_level = "moderate"

            return {
                "analysis_type": "autism_screening",
                "asd_risk": risk_level,
                "asd_traits_detected": prediction_label == "Yes",
                "confidence": round(confidence, 3),
                "probability_asd": round(float(probabilities[1] if len(probabilities) > 1 else probabilities[0]), 3),
                "features_analyzed": len(feature_vector),
                "recommendation": self._get_recommendation(risk_level, confidence)
            }

        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                "error": str(e),
                "asd_risk": "unknown",
                "confidence": 0.0
            }

    def _get_recommendation(self, risk_level: str, confidence: float) -> str:
        if risk_level == "high":
            return "High risk detected. Recommend comprehensive clinical evaluation by specialist."
        elif risk_level == "moderate":
            return "Moderate indicators present. Consider follow-up screening and monitoring."
        else:
            return "Low risk indicated. Continue regular developmental monitoring."

    def analyze_behavioral_features(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        features = {}

        for i in range(1, 11):
            key = f'A{i}'
            features[key] = student_data.get(key, 0)

        features['Age_Mons'] = student_data.get('age_months', 24)
        features['Sex'] = student_data.get('sex', 'Male')
        features['Jaundice'] = student_data.get('jaundice', 'no')
        features['Family_mem_with_ASD'] = student_data.get('family_asd', 'no')

        prediction = self.predict(features)

        feature_importance = []
        if self.model_trained and hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            for i, col in enumerate(self.feature_columns[:10]):
                if i < len(importances):
                    feature_importance.append({
                        "feature": col,
                        "importance": round(float(importances[i]), 3),
                        "value": features.get(col, 0)
                    })

        feature_importance.sort(key=lambda x: x['importance'], reverse=True)

        return {
            **prediction,
            "feature_importance": feature_importance[:5],
            "behavioral_score": sum([features.get(f'A{i}', 0) for i in range(1, 11)]),
            "age_appropriate_analysis": self._age_analysis(features.get('Age_Mons', 24))
        }

    def _age_analysis(self, age_months: int) -> str:
        if age_months < 18:
            return "Early screening - monitor developmental milestones closely"
        elif age_months < 36:
            return "Critical screening period - optimal intervention window"
        else:
            return "Later screening - comprehensive evaluation recommended"
