import ipaddress
import math
from typing import Any

import numpy as np


FEATURE_ORDER = [
    "src_ip_num",
    "dst_ip_num",
    "src_port",
    "dst_port",
    "protocol_num",
    "bytes_sent",
    "bytes_received",
    "duration_ms",
    "packets",
    "failed_logins",
    "unusual_flag",
    "bytes_ratio",
    "packets_per_sec",
]


PROTOCOL_MAP = {
    "tcp": 1,
    "udp": 2,
    "icmp": 3,
}


def _ip_to_numeric(ip: str) -> int:
    try:
        return int(ipaddress.ip_address(ip)) % 65536
    except ValueError:
        return 0


def _safe_ratio(a: float, b: float) -> float:
    if b <= 0:
        return a
    return a / b


def event_to_vector(event: dict[str, Any]) -> np.ndarray:
    protocol_num = PROTOCOL_MAP.get(str(event.get("protocol", "")).lower(), 0)
    duration_s = max(event.get("duration_ms", 0) / 1000.0, 0.001)

    bytes_sent = float(event.get("bytes_sent", 0))
    bytes_received = float(event.get("bytes_received", 0))
    packets = float(event.get("packets", 0))

    vector = np.array(
        [
            _ip_to_numeric(event.get("src_ip", "0.0.0.0")),
            _ip_to_numeric(event.get("dst_ip", "0.0.0.0")),
            float(event.get("src_port", 0)),
            float(event.get("dst_port", 0)),
            float(protocol_num),
            bytes_sent,
            bytes_received,
            float(event.get("duration_ms", 0)),
            packets,
            float(event.get("failed_logins", 0)),
            float(event.get("unusual_flag", 0)),
            _safe_ratio(bytes_sent, bytes_received + 1.0),
            packets / duration_s,
        ],
        dtype=np.float64,
    )

    # clamp inf/nan for robust inference on malformed packets
    vector = np.nan_to_num(vector, nan=0.0, posinf=1e9, neginf=-1e9)
    return vector


def compute_risk_level(score: float) -> str:
    if score >= 0.9:
        return "critical"
    if score >= 0.75:
        return "high"
    if score >= 0.5:
        return "medium"
    return "low"
