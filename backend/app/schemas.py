from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


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
