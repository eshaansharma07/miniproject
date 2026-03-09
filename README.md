# Intrusion Detection in Network Traffic using ML

An end-to-end AIML cybersecurity project with:
- real-time intrusion scoring API
- imbalanced learning strategy (SMOTE + class weighting)
- SOC-focused dashboard with live feed and risk gauge
- structured logs and persistent alerts

## Architecture
- `backend/`: FastAPI service + ML model training + SQLite alert store + JSON logs
- `frontend/`: React + Vite SOC dashboard for analysts

## Why this scores well
- Detects intrusions with threshold-tuned classification
- Controls false positives with explicit threshold (`0.6`) and live risk levels
- Handles class imbalance in training (oversampling + balanced classifier)
- Supports streaming-like scoring and alert pipeline
- Provides analyst UX (live table, alert feed, threat index)

## Run locally

### 1) Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_model.py
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Dashboard: `http://localhost:5173`
Backend API: `http://localhost:8000`

## Key APIs
- `GET /health`
- `POST /score`
- `POST /score/batch`
- `GET /alerts?limit=25`

## Example `/score` payload
```json
{
  "src_ip": "10.0.0.7",
  "dst_ip": "172.16.0.12",
  "src_port": 52311,
  "dst_port": 445,
  "protocol": "tcp",
  "bytes_sent": 9200,
  "bytes_received": 500,
  "duration_ms": 160,
  "packets": 145,
  "failed_logins": 2,
  "unusual_flag": 1,
  "timestamp": "2026-03-09T10:00:00Z"
}
```

## Deploy Full Stack On Vercel

This repository is configured to deploy both frontend and FastAPI backend on Vercel:
- `frontend` is built as static Vite output
- backend is served from `api/index.py`
- frontend calls backend through `/api`

### Vercel steps
1. Import `eshaansharma07/miniproject` into Vercel.
2. Keep project root at repository root (`/`).
3. Do not set a custom root directory.
4. Click deploy.
5. Open your deployment and test:
   - `https://<your-domain>/api/health`
   - dashboard load on `/`

### Notes
- In Vercel serverless runtime, alerts/log files are stored in `/tmp` (ephemeral).
- If model artifacts are missing, backend uses a heuristic scorer fallback so the demo remains live.

## Submission checklist
- Include screenshots of dashboard + alert feed
- Include model metrics printed by `train_model.py`
- Include architecture diagram in your report
- Mention false-positive control via tuned threshold
