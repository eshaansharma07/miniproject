import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "data" / "alerts.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


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


def insert_alert(
    created_at: str,
    src_ip: str,
    dst_ip: str,
    risk_level: str,
    score: float,
    summary: str,
) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO alerts (created_at, src_ip, dst_ip, risk_level, score, summary)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (created_at, src_ip, dst_ip, risk_level, score, summary),
        )


def latest_alerts(limit: int = 50) -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            """
            SELECT id, created_at, src_ip, dst_ip, risk_level, score, summary
            FROM alerts
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()

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
