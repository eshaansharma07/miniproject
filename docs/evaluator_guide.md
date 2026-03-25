# Intrusion Detection in Network Traffic Using ML

## Evaluator Guide

Prepared for project demonstration and viva on 2026-03-25.

## 1. Project Summary

This project is an end-to-end AI and cybersecurity system that detects suspicious network traffic and presents the results in a Security Operations Center style dashboard. It combines machine learning based scoring, explainable threat analysis, alert storage, structured logging, and a frontend that can simulate normal and attack traffic in real time.

The main goal is to show how AI can be used to classify incoming traffic events as benign or malicious and help an analyst understand why the system raised an alert.

## 2. Problem Statement

Modern networks generate a large number of traffic events. Manual inspection is slow and error-prone. This project solves that problem by:

- converting raw traffic details into engineered numeric features
- applying a trained ML classifier to estimate intrusion probability
- labeling each event with a risk level
- generating human-readable reasons and response suggestions
- showing everything in a live dashboard

## 3. Objectives

- detect suspicious traffic automatically
- reduce analyst effort with live scoring
- provide explainable results instead of only a black-box score
- store important alerts for later inspection
- make the project deployable on Vercel for easy demonstration

## 4. Architecture Overview

The project has three major parts:

- Backend API: FastAPI service for health checks, scoring, batch scoring, alerts, and logging
- ML Layer: feature engineering, synthetic data generation, imbalance handling with SMOTE, threshold tuning, and model artifact loading
- Frontend Dashboard: React and Vite based SOC dashboard with live stream, simulation lab, manual scoring, metrics, risk gauge, and alert feed

## 5. Tech Stack

- Frontend: React 18, Vite, CSS
- Backend: FastAPI, Pydantic
- ML: scikit-learn, imbalanced-learn, NumPy, joblib
- Storage: SQLite for alert persistence
- Logging: python-json-logger
- Deployment: Vercel

## 6. Machine Learning Model

### Model Used

The trained model is a Logistic Regression classifier inside a scikit-learn Pipeline:

- StandardScaler for feature normalization
- LogisticRegression with class_weight set to balanced

### Why This Model Was Chosen

- fast to train
- interpretable compared to heavier models
- good baseline for classification tasks
- suitable for deployment in lightweight serverless environments

### Class Imbalance Handling

Intrusion data is usually imbalanced because malicious events are fewer than benign ones. To address that:

- SMOTE is used to oversample the minority intrusion class during training
- Logistic Regression uses balanced class weighting

This improves recall and avoids a model that predicts only normal traffic.

## 7. Features Used For Training

The model is trained on 13 engineered features:

- src_ip_num
- dst_ip_num
- src_port
- dst_port
- protocol_num
- bytes_sent
- bytes_received
- duration_ms
- packets
- failed_logins
- unusual_flag
- bytes_ratio
- packets_per_sec

These features capture both traffic size behavior and threat indicators such as repeated failed logins, suspicious flags, and abnormal transfer patterns.

## 8. Training Process

The training pipeline does the following:

1. Generates synthetic traffic data for benign and malicious patterns.
2. Splits the data into train and test sets using stratified sampling.
3. Applies SMOTE to balance the training data.
4. Fits a StandardScaler plus Logistic Regression pipeline.
5. Predicts probabilities on the test set.
6. Tunes the decision threshold over multiple values.
7. Saves the trained model and metadata as joblib artifacts.

## 9. Exact Trained Results

The current saved model metadata is:

- Model version: v20260325053743
- Decision threshold: 0.35
- Precision: 1.0000
- Recall: 1.0000
- F1 score: 1.0000
- Best F1 during threshold tuning: 1.0000
- Test samples: 2400

### Important Evaluation Note

The metrics are perfect because the current training set is synthetic and intentionally structured for demonstration. That is good for showing the complete ML pipeline, but in a real-world deployment these results would need validation on a public intrusion dataset such as NSL-KDD, CIC-IDS2017, or UNSW-NB15.

If an evaluator asks why the scores are 100 percent, the honest answer is:

- the current dataset is synthetic and separable
- the pipeline is correct and working
- real production evaluation would require external benchmark data

## 10. How Prediction Works

When a traffic event is sent to the backend:

1. The API validates the payload using Pydantic.
2. The event is converted into a numeric feature vector.
3. The trained model predicts intrusion probability.
4. The score is compared with the tuned threshold.
5. A risk level is assigned:

- low if score is below 0.50
- medium if score is between 0.50 and 0.75
- high if score is between 0.75 and 0.90
- critical if score is above 0.90

6. The backend also derives:

- threat category
- disposition such as Allow, Monitor closely, Investigate and contain, or Escalate immediately
- human-readable reasons explaining why the event is suspicious

7. High and critical events are stored in SQLite as alerts.

## 11. Threat Categories Explained

The backend maps suspicious behavior into analyst-friendly labels:

- Credential attack: repeated failed logins, especially on ports like 22 or 3389
- Lateral movement: suspicious SMB traffic on port 445
- Possible exfiltration: very high outbound traffic compared with inbound traffic
- Protocol anomaly: abnormal flag behavior
- Suspicious activity: used when the flow is notable but not strongly tied to one attack pattern

## 12. Core API Endpoints

- GET /health
- POST /score
- POST /score/batch
- GET /alerts

### Example Output of /score

```json
{
  "is_intrusion": true,
  "score": 1.0,
  "threshold": 0.35,
  "risk_level": "critical",
  "threat_category": "Lateral movement",
  "disposition": "Escalate immediately",
  "reasons": [
    "Unexpected protocol flag or suspicious header behavior detected.",
    "Authentication failures increase attack likelihood.",
    "Traffic targets a sensitive service commonly abused during intrusion attempts.",
    "Outbound-heavy transfer pattern may indicate payload delivery or exfiltration.",
    "Composite model score exceeds the critical-response threshold."
  ],
  "model_version": "v20260325053743"
}
```

## 13. Frontend Highlights

The frontend is designed like a mini SOC dashboard:

- backend and model health cards
- threat index gauge
- live scored traffic table
- alert feed
- manual packet scoring form
- stream modes: Normal, Mixed, Attack
- threat simulation lab for demos
- model metrics display

This makes the project presentation stronger because the evaluator can see both the AI logic and the user-facing monitoring workflow.

## 14. Deployment Story

The project is Vercel deployable:

- frontend builds as a Vite static app
- backend runs through api/index.py using Vercel Python runtime
- frontend calls backend via /api routes

### Vercel Notes

- On Vercel, logs and SQLite alerts are stored in /tmp, so they are ephemeral.
- If model artifacts are not found, the backend automatically falls back to a heuristic scorer to keep the demo alive.
- In this repository, trained artifacts are now included so the deployed version can use the trained model.

## 15. Strengths of the Project

- full-stack AI plus web deployment
- real-time style scoring flow
- explainable model output
- persistent alert mechanism
- clear frontend demonstration value
- threshold tuning and imbalance handling
- deployable architecture instead of only notebook-based work

## 16. Limitations

- dataset is synthetic, not from a real benchmark capture
- current persistence is SQLite and ephemeral on Vercel
- no user authentication or analyst role management
- no streaming socket integration from real packet capture yet
- perfect metrics should not be claimed as real-world generalization

## 17. Future Improvements

- train on CIC-IDS2017 or NSL-KDD
- compare Logistic Regression with Random Forest, XGBoost, and Neural Networks
- connect to real packet capture tools such as Scapy or Zeek logs
- add user login and case management
- store alerts in PostgreSQL or MongoDB
- add attack trend charts and downloadable reports

## 18. Questions Evaluators May Ask

### Q1. Which model did you train?

Logistic Regression inside a Pipeline with StandardScaler. I also used SMOTE and balanced class weighting to handle class imbalance.

### Q2. Why did you choose Logistic Regression?

It is fast, lightweight, interpretable, and deploys easily in a serverless environment. It is a strong baseline for binary classification.

### Q3. What is the threshold and why is it 0.35?

The model outputs probabilities. I tuned the decision threshold over several values and selected 0.35 because it gave the best F1 score on the held-out test set of the synthetic dataset.

### Q4. Why are the metrics perfect?

Because the training and test data are synthetic and deliberately structured. That proves the pipeline works, but it is not the same as claiming real-world production accuracy.

### Q5. How do you explain a detection?

The backend adds reasons such as repeated failed logins, suspicious service ports, abnormal byte ratio, unusual flags, and high packet rate. It also labels the threat category and recommended disposition.

### Q6. What happens if the model file is missing on Vercel?

The backend enters heuristic fallback mode so the app still scores traffic and remains demo-ready.

### Q7. Where are alerts stored?

Alerts are stored in SQLite locally. On Vercel, the database file is placed in /tmp, so it is temporary.

### Q8. What AI part is present in this project?

The AI part is the machine learning intrusion classifier, feature engineering pipeline, threshold tuning, and explanation logic around the prediction workflow.

## 19. Short Viva Script

You can explain it in this order:

1. This project detects malicious network traffic using a trained ML classifier.
2. The backend receives traffic features, converts them into a vector, and predicts intrusion probability.
3. The model used is Logistic Regression with SMOTE and class balancing.
4. The dashboard shows health, live traffic, alerts, and threat simulations.
5. Suspicious events are labeled with risk level, category, reasons, and response suggestion.
6. The project is deployable on Vercel as a complete full-stack application.

## 20. Suggested Demo Flow

1. Open the dashboard and show the health and model metrics cards.
2. Turn on Attack mode in the stream controls.
3. Open the Threat Simulation Lab and trigger SMB lateral movement.
4. Show the critical score, risk level, alert feed, and explanation reasons.
5. Open the manual scoring form and change fields such as failed_logins or dst_port.
6. Explain how the threshold and risk logic convert the score into a decision.

## 21. Final One-Line Conclusion

This is a complete AI-powered network intrusion detection and monitoring system with explainable predictions, alert handling, live visualization, and Vercel-ready deployment.
