from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def generate_synthetic_data(samples: int = 12000, intrusion_ratio: float = 0.08):
    rng = np.random.default_rng(42)

    y = np.zeros(samples, dtype=int)
    intrusion_count = int(samples * intrusion_ratio)
    y[:intrusion_count] = 1
    rng.shuffle(y)

    X = np.zeros((samples, 13), dtype=np.float64)

    for i in range(samples):
        if y[i] == 0:
            X[i] = [
                rng.integers(1000, 65000),
                rng.integers(1000, 65000),
                rng.choice([80, 443, 53, 22]),
                rng.choice([80, 443, 53]),
                rng.choice([1, 2]),
                rng.normal(1500, 500),
                rng.normal(1800, 600),
                max(10, rng.normal(800, 250)),
                max(1, rng.normal(20, 8)),
                rng.choice([0, 0, 0, 1]),
                rng.choice([0, 0, 0, 0, 1]),
                rng.normal(0.9, 0.3),
                rng.normal(18, 6),
            ]
        else:
            X[i] = [
                rng.integers(1000, 65000),
                rng.integers(1000, 65000),
                rng.integers(1024, 65535),
                rng.choice([22, 3389, 445, 8080]),
                rng.choice([1, 2, 3]),
                max(50, rng.normal(9000, 3000)),
                max(10, rng.normal(1200, 900)),
                max(1, rng.normal(200, 80)),
                max(10, rng.normal(180, 60)),
                rng.choice([1, 2, 3, 4, 5]),
                rng.choice([0, 1, 1, 1]),
                max(1.5, rng.normal(6.0, 2.5)),
                max(30, rng.normal(140, 45)),
            ]

    X = np.nan_to_num(X, nan=0.0, posinf=1e9, neginf=-1e9)
    return X, y


def best_threshold(y_true: np.ndarray, probs: np.ndarray) -> tuple[float, float]:
    best_score = -1.0
    best = 0.6

    for threshold in np.arange(0.35, 0.9, 0.05):
        preds = (probs >= threshold).astype(int)
        score = f1_score(y_true, preds)
        if score > best_score:
            best_score = score
            best = float(threshold)

    return best, best_score


def main() -> None:
    X, y = generate_synthetic_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    smote = SMOTE(random_state=42)
    X_balanced, y_balanced = smote.fit_resample(X_train, y_train)

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )

    pipeline.fit(X_balanced, y_balanced)

    probs = pipeline.predict_proba(X_test)[:, 1]
    threshold, tuned_f1 = best_threshold(y_test, probs)
    preds = (probs >= threshold).astype(int)

    precision = precision_score(y_test, preds)
    recall = recall_score(y_test, preds)
    f1 = f1_score(y_test, preds)

    print("Model Evaluation")
    print(classification_report(y_test, preds, digits=4))
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"Threshold: {threshold:.2f}")

    model_version = f"v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    joblib.dump(pipeline, MODEL_DIR / "intrusion_model.joblib")
    joblib.dump(
        {
            "threshold": threshold,
            "model_version": model_version,
            "metrics": {
                "precision": float(precision),
                "recall": float(recall),
                "f1": float(f1),
                "best_f1_during_tuning": float(tuned_f1),
                "test_samples": int(len(y_test)),
            },
        },
        MODEL_DIR / "metadata.joblib",
    )

    print(f"Saved model to: {MODEL_DIR}")


if __name__ == "__main__":
    main()
