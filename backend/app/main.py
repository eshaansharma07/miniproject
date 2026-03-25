from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.alert_store import init_db, insert_alert, latest_alerts
    from app.logger import setup_logger
    from app.model_service import ModelService
    from app.schemas import BatchScoreResponse, ScoreResponse, TrafficEvent
except ModuleNotFoundError:
    from backend.app.alert_store import init_db, insert_alert, latest_alerts
    from backend.app.logger import setup_logger
    from backend.app.model_service import ModelService
    from backend.app.schemas import BatchScoreResponse, ScoreResponse, TrafficEvent


app = FastAPI(title="IDS ML Scoring API", version="1.0.0")
logger = setup_logger()
model_service = ModelService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()
    try:
        model_service.load()
        logger.info("model_loaded", extra={"model_version": model_service.model_version})
    except FileNotFoundError as exc:
        logger.warning("model_missing", extra={"detail": str(exc)})


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_version": model_service.model_version,
        "fallback_mode": model_service.fallback_mode,
        "threshold": model_service.threshold,
        "metrics": model_service.metrics,
    }


@app.post("/score", response_model=ScoreResponse)
def score(event: TrafficEvent) -> ScoreResponse:
    result = model_service.score_event(event.model_dump())

    logger.info(
        "traffic_scored",
        extra={
            "src_ip": event.src_ip,
            "dst_ip": event.dst_ip,
            "score": result["score"],
            "is_intrusion": result["is_intrusion"],
            "risk_level": result["risk_level"],
        },
    )

    if result["risk_level"] in {"high", "critical"}:
        summary = f"Suspicious flow {event.src_ip} -> {event.dst_ip}"
        insert_alert(
            created_at=datetime.now(timezone.utc).isoformat(),
            src_ip=event.src_ip,
            dst_ip=event.dst_ip,
            risk_level=result["risk_level"],
            score=result["score"],
            summary=summary,
        )

    return ScoreResponse(**result)


@app.post("/score/batch", response_model=BatchScoreResponse)
def score_batch(events: list[TrafficEvent]) -> BatchScoreResponse:
    scored = model_service.score_batch([item.model_dump() for item in events])
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
def alerts(limit: int = 25) -> dict:
    return {"alerts": latest_alerts(limit=limit)}


handler = app
