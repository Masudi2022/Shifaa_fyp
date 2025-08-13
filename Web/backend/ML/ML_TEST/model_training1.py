# ML/ML_TEST/train_smart_doctor.py
# -*- coding: utf-8 -*-

"""
Smart Doctor — Training Script (v2)

Upgrades:
- Rigorous column validation + automatic binary coercion
- Class balancing with capped upsampling
- Stratified split
- RandomForest tuned + probability calibration for better predict_proba
- Rich evaluation (accuracy, macro-F1, log loss, per-class report)
- Saves: model.pkl, label_encoder.pkl, symptom_columns.pkl, metadata.json, feature_importances.csv, confusion_matrix.csv
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
import sklearn

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, f1_score, log_loss, classification_report,
    confusion_matrix
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV

# ======================
# Paths
# ======================
BASE_DIR = os.getcwd()
MODEL_DIR = os.path.join(BASE_DIR, "ML", "ML_TEST")
os.makedirs(MODEL_DIR, exist_ok=True)

INPUT_DATA = os.path.join(MODEL_DIR, "magonjwa_ya_kuambukiza_dataset_swahili_full.csv")

MODEL_PATH = os.path.join(MODEL_DIR, "magonjwa_model.pkl")
SYMPTOMS_PATH = os.path.join(MODEL_DIR, "symptom_columns.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
META_PATH = os.path.join(MODEL_DIR, "training_metadata.json")
IMP_PATH = os.path.join(MODEL_DIR, "feature_importances.csv")
CM_PATH = os.path.join(MODEL_DIR, "confusion_matrix.csv")
BALANCED_OUT = os.path.join(MODEL_DIR, "magonjwa_ya_kuambukiza_balanced_v2.csv")

# ======================
# Load dataset
# ======================
if not os.path.exists(INPUT_DATA):
    raise FileNotFoundError(f"❌ Dataset not found at {INPUT_DATA}")

df = pd.read_csv(INPUT_DATA)
target_col = "ugonjwa" if "ugonjwa" in df.columns else "Ugonjwa"
if target_col not in df.columns:
    raise ValueError("❌ Target column 'ugonjwa' (or 'Ugonjwa') is missing.")

# Candidate feature columns = all except target
feature_cols = [c for c in df.columns if c != target_col]
if not feature_cols:
    raise ValueError("❌ No feature columns found.")

# Ensure binary numeric features (0/1); coerce where possible
def _to_binary(s):
    m = s.astype(str).str.strip().str.lower()
    return m.map(
        {
            "1": 1, "0": 0,
            "true": 1, "false": 0,
            "yes": 1, "no": 0,
            "ndio": 1, "hapana": 0,
            "sawa": 1, "la": 0,
        }
    ).fillna(pd.to_numeric(m, errors="coerce")).fillna(0).astype(int)

X = df[feature_cols].copy()
for c in X.columns:
    try:
        X[c] = _to_binary(X[c])
    except Exception:
        X[c] = pd.to_numeric(X[c], errors="coerce").fillna(0).astype(int)

y = df[target_col].astype(str)

# ======================
# Class balance (upsample small classes up to min_samples; cap large classes)
# ======================
min_samples = 40
max_samples_cap = 400

balanced_parts = []
for cls, group in pd.concat([X, y], axis=1).groupby(target_col):
    g = group.copy()
    n = len(g)
    if n < min_samples:
        reps = int(np.ceil(min_samples / max(n, 1)))
        g = pd.concat([g] * reps, ignore_index=True)
    if len(g) > max_samples_cap:
        g = g.sample(max_samples_cap, random_state=42)
    balanced_parts.append(g)

balanced_df = pd.concat(balanced_parts, ignore_index=True)
balanced_df = balanced_df.sample(frac=1.0, random_state=42).reset_index(drop=True)

balanced_df.to_csv(BALANCED_OUT, index=False, encoding="utf-8-sig")
print(f"✅ Balanced dataset saved to: {BALANCED_OUT}")

X_bal = balanced_df[feature_cols].copy()
y_bal = balanced_df[target_col].astype(str).copy()

# ======================
# Encode labels
# ======================
le = LabelEncoder()
y_encoded = le.fit_transform(y_bal)

# ======================
# Train/Test Split
# ======================
X_train, X_test, y_train, y_test = train_test_split(
    X_bal, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# ======================
# Train Model: RF + probability calibration
# ======================
t0 = time.time()

rf = RandomForestClassifier(
    n_estimators=600,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced_subsample",
    oob_score=True,
    random_state=42,
    n_jobs=-1,
)

rf.fit(X_train, y_train)

# Detect sklearn version for compatibility
sk_version = tuple(map(int, sklearn.__version__.split('.')[:2]))
if sk_version >= (1, 2):
    calibrated = CalibratedClassifierCV(estimator=rf, method="sigmoid", cv=3)
else:
    calibrated = CalibratedClassifierCV(base_estimator=rf, method="sigmoid", cv=3)

calibrated.fit(X_train, y_train)

train_time = time.time() - t0

# ======================
# Evaluate
# ======================
y_pred = calibrated.predict(X_test)
y_proba = calibrated.predict_proba(X_test)

acc = accuracy_score(y_test, y_pred)
macro_f1 = f1_score(y_test, y_pred, average="macro")
try:
    ll = log_loss(y_test, y_proba)
except Exception:
    ll = None

print(f"🎯 Accuracy: {acc*100:.2f}% | 🧠 Macro-F1: {macro_f1:.3f} | ⏱️ Train+Calibrate: {train_time:.1f}s")

# Save classification report
report = classification_report(
    y_test, y_pred, target_names=list(le.classes_), output_dict=True
)
report_df = pd.DataFrame(report).transpose()
report_csv = os.path.join(MODEL_DIR, "classification_report.csv")
report_df.to_csv(report_csv, encoding="utf-8-sig")
print(f"📄 Classification report -> {report_csv}")

# Confusion matrix
cm = confusion_matrix(y_test, y_pred, labels=list(range(len(le.classes_))))
cm_df = pd.DataFrame(cm, index=le.classes_, columns=le.classes_)
cm_df.to_csv(CM_PATH, encoding="utf-8-sig")
print(f"🧭 Confusion matrix -> {CM_PATH}")

# Feature importances
imp = pd.Series(rf.feature_importances_, index=feature_cols).sort_values(ascending=False)
imp.to_csv(IMP_PATH, header=["importance"], encoding="utf-8-sig")
print(f"🌲 Feature importances -> {IMP_PATH}")

# ======================
# Save Artifacts
# ======================
joblib.dump(calibrated, MODEL_PATH)
joblib.dump(feature_cols, SYMPTOMS_PATH)
joblib.dump(le, LABEL_ENCODER_PATH)

meta = {
    "model_path": MODEL_PATH,
    "symptom_columns_path": SYMPTOMS_PATH,
    "label_encoder_path": LABEL_ENCODER_PATH,
    "data_path": INPUT_DATA,
    "balanced_data_path": BALANCED_OUT,
    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    "metrics": {
        "accuracy": float(acc),
        "macro_f1": float(macro_f1),
        "log_loss": (float(ll) if ll is not None else None),
        "oob_score_rf": (float(rf.oob_score_) if hasattr(rf, "oob_score_") else None),
    },
    "n_classes": int(len(le.classes_)),
    "classes": list(map(str, le.classes_)),
    "n_features": int(len(feature_cols)),
    "features": feature_cols,
    "random_state": 42,
}
with open(META_PATH, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print(f"✅ Model saved: {MODEL_PATH}")
print(f"✅ Symptom columns saved: {SYMPTOMS_PATH}")
print(f"✅ Label encoder saved: {LABEL_ENCODER_PATH}")
print(f"🧾 Metadata saved: {META_PATH}")
