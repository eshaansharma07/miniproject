import logging
import os
from pathlib import Path

from pythonjsonlogger import jsonlogger


if os.getenv("VERCEL"):
    LOG_DIR = Path("/tmp/ids-logs")
else:
    LOG_DIR = Path(__file__).resolve().parents[1] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


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
