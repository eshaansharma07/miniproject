from datetime import datetime
from pydantic import BaseModel, Field


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
    is_intrusion: bool
    score: float
    threshold: float
    risk_level: str
    model_version: str


class BatchScoreResponse(BaseModel):
    total_events: int
    intrusions: int
    results: list[ScoreResponse]
