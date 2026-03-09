from pathlib import Path

import joblib
import numpy as np

try:
    from app.feature_engineering import compute_risk_level, event_to_vector
except ModuleNotFoundError:
    from backend.app.feature_engineering import compute_risk_level, event_to_vector


MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_PATH = MODEL_DIR / "intrusion_model.joblib"
META_PATH = MODEL_DIR / "metadata.joblib"


class ModelService:
    def __init__(self) -> None:
        self.pipeline = None
        self.threshold = 0.6
        self.model_version = "untrained"
        self.fallback_mode = False

    def load(self) -> None:
        if not MODEL_PATH.exists() or not META_PATH.exists():
            self.fallback_mode = True
            self.model_version = "heuristic-v1"
            return

        self.pipeline = joblib.load(MODEL_PATH)
        metadata = joblib.load(META_PATH)
        self.threshold = float(metadata.get("threshold", 0.6))
        self.model_version = str(metadata.get("model_version", "v1"))
        self.fallback_mode = False

    def score_event(self, event: dict) -> dict:
        if self.pipeline is None:
            self.load()

        if self.fallback_mode:
            score = self._heuristic_score(event)
        else:
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

    def _heuristic_score(self, event: dict) -> float:
        bytes_sent = float(event.get("bytes_sent", 0))
        bytes_received = float(event.get("bytes_received", 0))
        packets = float(event.get("packets", 0))
        duration_ms = float(event.get("duration_ms", 0))
        failed_logins = float(event.get("failed_logins", 0))
        unusual_flag = float(event.get("unusual_flag", 0))
        dst_port = int(event.get("dst_port", 0))

        score = 0.0
        if unusual_flag >= 1:
            score += 0.2
        if failed_logins >= 1:
            score += min(0.25, failed_logins * 0.06)
        if packets > 120 and duration_ms < 350:
            score += 0.18
        if bytes_sent > (bytes_received + 1) * 3:
            score += 0.15
        if dst_port in {22, 3389, 445}:
            score += 0.14
        if bytes_sent > 8000:
            score += 0.1

        return float(np.clip(score, 0.0, 1.0))
