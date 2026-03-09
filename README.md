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

## GitHub + deployment plan

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial IDS ML dashboard stack"
git branch -M main
git remote add origin <your_repo_url>
git push -u origin main
```

### Deploy frontend on Vercel
1. Import GitHub repo in Vercel.
2. Set root directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add env var `VITE_API_URL=<your_backend_public_url>`.

### Deploy backend (recommended)
Deploy `backend` to Render/Railway/Fly and use that URL in Vercel env var.

## Submission checklist
- Include screenshots of dashboard + alert feed
- Include model metrics printed by `train_model.py`
- Include architecture diagram in your report
- Mention false-positive control via tuned threshold
