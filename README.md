# Intrusion Detection in Network Traffic using ML

An end-to-end AIML cybersecurity project with:
- real-time intrusion scoring API
- imbalanced learning strategy (SMOTE + class weighting)
- SOC-focused dashboard with live feed and risk gauge
- structured logs and persistent alerts
- explainable threat categories, analyst reasons, and response dispositions
- one-click attack simulations for demos, viva, and project evaluation

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
export IDS_API_KEY=your-secret-key
python train_model.py
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend
```bash
cd frontend
npm install
echo "VITE_IDS_API_KEY=your-secret-key" > .env.local
npm run dev
```

Dashboard: `http://localhost:5173`
Backend API: `http://localhost:8000`

## Key APIs
- `GET /health`
- `POST /score`
- `POST /score/batch`
- `GET /alerts?limit=25`

## API Key Protection

Protected routes support either of these headers:
- `x-api-key: <your-secret-key>`
- `Authorization: Bearer <your-secret-key>`

Behavior:
- `GET /health` stays public so deployments can be checked easily
- `POST /score`, `POST /score/batch`, and `GET /alerts` require the API key when `IDS_API_KEY` is set
- if `IDS_API_KEY` is not set, the backend runs without auth for local demos

### Sample `/score` response
```json
{
  "is_intrusion": true,
  "score": 0.94,
  "threshold": 0.35,
  "risk_level": "critical",
  "threat_category": "Lateral movement",
  "disposition": "Escalate immediately",
  "reasons": [
    "Unexpected protocol flag or suspicious header behavior detected.",
    "Traffic targets a sensitive service commonly abused during intrusion attempts."
  ],
  "model_version": "v20260325053743"
}
```

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
- `GET /health` exposes training metrics and whether the trained model or fallback scorer is active.
- The dashboard includes stream modes (`Normal`, `Mixed`, `Attack`) plus a threat simulation lab for live demonstrations.

## Submission checklist
- Include screenshots of dashboard + alert feed
- Include model metrics printed by `train_model.py`
- Include architecture diagram in your report
- Mention false-positive control via tuned threshold
