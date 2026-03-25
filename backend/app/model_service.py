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
        self.metrics: dict[str, float] = {}

    def load(self) -> None:
        if not MODEL_PATH.exists() or not META_PATH.exists():
            self.fallback_mode = True
            self.model_version = "heuristic-v1"
            self.metrics = {}
            return

        try:
            self.pipeline = joblib.load(MODEL_PATH)
            metadata = joblib.load(META_PATH)
            self.threshold = float(metadata.get("threshold", 0.6))
            self.model_version = str(metadata.get("model_version", "v1"))
            self.metrics = dict(metadata.get("metrics", {}))
            self.fallback_mode = False
        except Exception:
            self.pipeline = None
            self.threshold = 0.6
            self.model_version = "heuristic-v1"
            self.metrics = {}
            self.fallback_mode = True

    def score_event(self, event: dict) -> dict:
        if self.pipeline is None:
            self.load()

        if self.fallback_mode:
            score = self._heuristic_score(event)
        else:
            vector = event_to_vector(event).reshape(1, -1)
            score = float(self.pipeline.predict_proba(vector)[0][1])

        is_intrusion = score >= self.threshold
        reasons = self._build_reasons(event, score)
        threat_category = self._categorize_threat(event, reasons)
        disposition = self._disposition(score, is_intrusion)
        return {
            "is_intrusion": is_intrusion,
            "score": round(score, 4),
            "threshold": self.threshold,
            "risk_level": compute_risk_level(score),
            "threat_category": threat_category,
            "disposition": disposition,
            "reasons": reasons,
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

    def _build_reasons(self, event: dict, score: float) -> list[str]:
        reasons: list[str] = []
        bytes_sent = float(event.get("bytes_sent", 0))
        bytes_received = float(event.get("bytes_received", 0))
        packets = float(event.get("packets", 0))
        duration_ms = float(event.get("duration_ms", 0))
        failed_logins = int(event.get("failed_logins", 0))
        unusual_flag = int(event.get("unusual_flag", 0))
        dst_port = int(event.get("dst_port", 0))

        if unusual_flag:
            reasons.append("Unexpected protocol flag or suspicious header behavior detected.")
        if failed_logins >= 3:
            reasons.append("Repeated authentication failures resemble brute-force activity.")
        elif failed_logins > 0:
            reasons.append("Authentication failures increase attack likelihood.")
        if dst_port in {22, 445, 3389}:
            reasons.append("Traffic targets a sensitive service commonly abused during intrusion attempts.")
        if packets >= 150 and duration_ms <= 250:
            reasons.append("High packet rate over a short session suggests aggressive probing or lateral movement.")
        if bytes_sent > (bytes_received + 1) * 4:
            reasons.append("Outbound-heavy transfer pattern may indicate payload delivery or exfiltration.")
        if score >= 0.9:
            reasons.append("Composite model score exceeds the critical-response threshold.")
        elif score >= self.threshold:
            reasons.append("Model confidence is above the automated intrusion threshold.")

        return reasons or ["Traffic pattern remains within expected behavioral bounds."]

    def _categorize_threat(self, event: dict, reasons: list[str]) -> str:
        dst_port = int(event.get("dst_port", 0))
        failed_logins = int(event.get("failed_logins", 0))
        bytes_sent = float(event.get("bytes_sent", 0))
        bytes_received = float(event.get("bytes_received", 0))

        if failed_logins >= 3 and dst_port in {22, 3389}:
            return "Credential attack"
        if dst_port == 445:
            return "Lateral movement"
        if bytes_sent > (bytes_received + 1) * 4:
            return "Possible exfiltration"
        if any("flag" in reason.lower() for reason in reasons):
            return "Protocol anomaly"
        return "Benign traffic" if len(reasons) == 1 and "expected" in reasons[0].lower() else "Suspicious activity"

    def _disposition(self, score: float, is_intrusion: bool) -> str:
        if score >= 0.9:
            return "Escalate immediately"
        if is_intrusion:
            return "Investigate and contain"
        if score >= 0.45:
            return "Monitor closely"
        return "Allow"
