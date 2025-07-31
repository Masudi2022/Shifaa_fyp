# train_model.py

import os
import django

# Set up Django environment (replace 'your_project' with your actual project name)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from advisory.models import DiseaseEntry
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib

def train_and_save_model():
    # Load data from Django DB
    entries = DiseaseEntry.objects.all()
    symptoms = [entry.dalili for entry in entries]
    diseases = [entry.ugonjwa for entry in entries]

    # Vectorize symptoms text
    vectorizer = CountVectorizer()
    X = vectorizer.fit_transform(symptoms)

    # Train model
    model = MultinomialNB()
    model.fit(X, diseases)

    # Save the model and vectorizer for later use
    joblib.dump(model, 'ml_model.pkl')
    joblib.dump(vectorizer, 'vectorizer.pkl')

    print("✅ Model trained and saved as 'ml_model.pkl' and 'vectorizer.pkl'")

if __name__ == "__main__":
    train_and_save_model()
