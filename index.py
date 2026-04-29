from datetime import datetime, timezone
import os
from pathlib import Path
import secrets
import sqlite3
import tempfile

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


DB_PATH = Path(tempfile.gettempdir()) / "alerts.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
API_KEY = os.getenv("IDS_API_KEY", "").strip()


class TrafficEvent(BaseModel):
    src_ip: str
    dst_ip: str
    src_port: int = Field(ge=0, le=65535)
    dst_port: int = Field(ge=0, le=65535)
    protocol: str
    bytes_sent: int = Field(ge=0)
    bytes_received: int = Field(ge=0)
    duration_ms: int = Field(ge=0)
    packets: int = Field(ge=0)
    failed_logins: int = Field(ge=0)
    unusual_flag: int = Field(ge=0, le=1)
    timestamp: datetime


class ScoreResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    is_intrusion: bool
    score: float
    threshold: float
    risk_level: str
    threat_category: str
    disposition: str
    reasons: list[str]
    model_version: str


class BatchScoreResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    total_events: int
    intrusions: int
    average_score: float
    risk_distribution: dict[str, int]
    results: list[ScoreResponse]


app = FastAPI(title="IDS ML Scoring API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_api_key(
    x_api_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> None:
    if not API_KEY:
        return

    bearer_token = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization.split(" ", 1)[1].strip()

    provided_key = x_api_key or bearer_token
    if provided_key and secrets.compare_digest(provided_key, API_KEY):
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API key.",
    )


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                src_ip TEXT NOT NULL,
                dst_ip TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                score REAL NOT NULL,
                summary TEXT NOT NULL
            )
            """
        )


def latest_alerts(limit: int = 25) -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, src_ip, dst_ip, risk_level, score, summary
            FROM alerts
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [
        {
            "id": row[0],
            "created_at": row[1],
            "src_ip": row[2],
            "dst_ip": row[3],
            "risk_level": row[4],
            "score": row[5],
            "summary": row[6],
        }
        for row in rows
    ]


def insert_alert(created_at: str, src_ip: str, dst_ip: str, risk_level: str, score: float, summary: str) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO alerts (created_at, src_ip, dst_ip, risk_level, score, summary)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (created_at, src_ip, dst_ip, risk_level, score, summary),
        )


def compute_risk_level(score: float) -> str:
    if score >= 0.9:
        return "critical"
    if score >= 0.75:
        return "high"
    if score >= 0.5:
        return "medium"
    return "low"


def heuristic_score(event: dict) -> float:
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

    return max(0.0, min(1.0, score))


def build_reasons(event: dict, score: float, threshold: float) -> list[str]:
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
    elif score >= threshold:
        reasons.append("Model confidence is above the automated intrusion threshold.")

    return reasons or ["Traffic pattern remains within expected behavioral bounds."]


def categorize_threat(event: dict, reasons: list[str]) -> str:
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


def disposition(score: float, is_intrusion: bool) -> str:
    if score >= 0.9:
        return "Escalate immediately"
    if is_intrusion:
        return "Investigate and contain"
    if score >= 0.45:
        return "Monitor closely"
    return "Allow"


def score_event(event: dict) -> dict:
    threshold = 0.6
    score = round(heuristic_score(event), 4)
    is_intrusion = score >= threshold
    reasons = build_reasons(event, score, threshold)
    return {
        "is_intrusion": is_intrusion,
        "score": score,
        "threshold": threshold,
        "risk_level": compute_risk_level(score),
        "threat_category": categorize_threat(event, reasons),
        "disposition": disposition(score, is_intrusion),
        "reasons": reasons,
        "model_version": "heuristic-v1",
    }


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_version": "heuristic-v1",
        "fallback_mode": True,
        "threshold": 0.6,
        "metrics": {},
        "api_key_protected": bool(API_KEY),
    }


@app.post("/score", response_model=ScoreResponse)
def score(event: TrafficEvent, _auth: None = Depends(require_api_key)) -> ScoreResponse:
    result = score_event(event.model_dump())

    if result["risk_level"] in {"high", "critical"}:
        insert_alert(
            created_at=datetime.now(timezone.utc).isoformat(),
            src_ip=event.src_ip,
            dst_ip=event.dst_ip,
            risk_level=result["risk_level"],
            score=result["score"],
            summary=f"Suspicious flow {event.src_ip} -> {event.dst_ip}",
        )

    return ScoreResponse(**result)


@app.post("/score/batch", response_model=BatchScoreResponse)
def score_batch(events: list[TrafficEvent], _auth: None = Depends(require_api_key)) -> BatchScoreResponse:
    scored = [score_event(item.model_dump()) for item in events]
    intrusion_count = sum(1 for item in scored if item["is_intrusion"])
    average_score = round(sum(item["score"] for item in scored) / len(scored), 4) if scored else 0.0
    risk_distribution = {
        level: sum(1 for item in scored if item["risk_level"] == level)
        for level in ("low", "medium", "high", "critical")
    }

    return BatchScoreResponse(
        total_events=len(scored),
        intrusions=intrusion_count,
        average_score=average_score,
        risk_distribution=risk_distribution,
        results=[ScoreResponse(**item) for item in scored],
    )


@app.get("/alerts")
def alerts(limit: int = 25, _auth: None = Depends(require_api_key)) -> dict:
    return {"alerts": latest_alerts(limit=limit)}
