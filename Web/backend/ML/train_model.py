import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load your dataset
df = pd.read_csv("/disease_binary_dataset.csv")

# Define feature columns (symptoms)
SYMPTOM_COLUMNS = [col for col in df.columns if col not in ['Ugonjwa', 'Vipimo', 'Tiba', 'Kinga', 'Ushauri']]

# Features and labels
X = df[SYMPTOM_COLUMNS]
y = df['Ugonjwa']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model — you can use RandomForest for better performance on binary datasets
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# Evaluate accuracy
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model trained with accuracy: {accuracy*100:.2f}%")

# Save model
with open("ML/disease_model.pkl", "wb") as f:
    pickle.dump({
        "model": model,
        "symptom_columns": SYMPTOM_COLUMNS
    }, f)

print("💾 Model saved to ML/disease_model.pkl")
