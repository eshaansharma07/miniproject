# Backend - IDS ML API

## Features
- ML-based intrusion scoring (`/score`, `/score/batch`)
- Imbalance-aware model training (SMOTE + balanced logistic regression)
- Alert persistence in SQLite
- Structured JSON logs for SOC workflows

## Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_model.py
uvicorn app.main:app --reload --port 8000
```

## API Endpoints
- `GET /health`
- `POST /score`
- `POST /score/batch`
- `GET /alerts?limit=25`
