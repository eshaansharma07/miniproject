from pathlib import Path

import joblib
import numpy as np

from app.feature_engineering import compute_risk_level, event_to_vector


MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_PATH = MODEL_DIR / "intrusion_model.joblib"
META_PATH = MODEL_DIR / "metadata.joblib"


class ModelService:
    def __init__(self) -> None:
        self.pipeline = None
        self.threshold = 0.6
        self.model_version = "untrained"

    def load(self) -> None:
        if not MODEL_PATH.exists() or not META_PATH.exists():
            raise FileNotFoundError(
                "Model artifacts not found. Run: python train_model.py"
            )

        self.pipeline = joblib.load(MODEL_PATH)
        metadata = joblib.load(META_PATH)
        self.threshold = float(metadata.get("threshold", 0.6))
        self.model_version = str(metadata.get("model_version", "v1"))

    def score_event(self, event: dict) -> dict:
        if self.pipeline is None:
            self.load()

        vector = event_to_vector(event).reshape(1, -1)
        score = float(self.pipeline.predict_proba(vector)[0][1])
        is_intrusion = score >= self.threshold
        return {
            "is_intrusion": is_intrusion,
            "score": round(score, 4),
            "threshold": self.threshold,
            "risk_level": compute_risk_level(score),
            "model_version": self.model_version,
        }

    def score_batch(self, events: list[dict]) -> list[dict]:
        return [self.score_event(event) for event in events]
