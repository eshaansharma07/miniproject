import logging
import os
from pathlib import Path
import tempfile

from pythonjsonlogger import jsonlogger


def _resolve_log_dir() -> Path:
    preferred = (
        Path("/tmp/ids-logs")
        if os.getenv("VERCEL")
        else Path(__file__).resolve().parents[1] / "logs"
    )

    try:
        preferred.mkdir(parents=True, exist_ok=True)
        return preferred
    except OSError:
        fallback = Path(tempfile.gettempdir()) / "ids-logs"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


LOG_DIR = _resolve_log_dir()


def setup_logger(name: str = "ids-service") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    stream_handler = logging.StreamHandler()

    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    stream_handler.setFormatter(formatter)

    logger.addHandler(stream_handler)
    try:
        file_handler = logging.FileHandler(LOG_DIR / "events.log")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except OSError:
        # Continue with stdout logging when file logging is unavailable.
        pass
    logger.propagate = False
    return logger
