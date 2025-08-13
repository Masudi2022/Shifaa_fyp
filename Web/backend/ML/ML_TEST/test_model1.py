import pandas as pd
import joblib
from sklearn.metrics import accuracy_score

# Load your balanced dataset
balanced_csv_path = "ML/ML_TEST/magonjwa_ya_kuambukiza_balanced.csv"
df = pd.read_csv(balanced_csv_path)

# Extract symptom columns and target
symptom_columns = list(df.columns)
symptom_columns.remove("ugonjwa")

X = df[symptom_columns]
y_true = df["ugonjwa"]

# Load the trained model
model = joblib.load("ML/ML_TEST/magonjwa_model.pkl")

# Predict on the entire dataset and calculate accuracy
y_pred = model.predict(X)
accuracy = accuracy_score(y_true, y_pred)
print(f"🎯 Model Accuracy on balanced dataset: {accuracy*100:.2f}%\n")

# Convert symptom list to DataFrame vector with column names
def symptoms_to_vector_df(symptom_list):
    vector = []
    for symptom in symptom_columns:
        vector.append(1 if symptom in symptom_list else 0)
    return pd.DataFrame([vector], columns=symptom_columns)

# Predict disease from symptom list
def predict_disease(symptom_list):
    X_input = symptoms_to_vector_df(symptom_list)
    prediction = model.predict(X_input)[0]
    return prediction

# Sample symptoms with their true diseases (if known)
sample_tests = [
    (['homa', 'kupungua_uzito', 'maumivu_ya_tumbo'], "Kichocho"),
    (['baridi', 'kikohozi', 'kupumua_kwa_shida'], "Malaria"),
    (['maumivu_ya_kichwa', 'kutapika', 'kichefuchefu'], "Kichocho_cha_Tumbo"),
    (['kuhara_kunaodamu', 'kuvimbiwa_au_kuhara', 'uvimbe_wa_tezi'], "Trikomonasi"),
    (['maumivu_ya_kifua', 'kikohozi_kisichoisha', 'kupungua_uzito'], "Kifua_Kikuu"),
    (['mkojo_unaodamu', 'mkojo_mweusi', 'maumivu_wakati_wa_kukojoa'], "Maambukizi_ya_Njia_ya_Mkojo"),
    (['manjano_ya_macho_na_mwili', 'upungufu_wa_damu', 'kidonda_kisicho_na_maumivu'], "Kaswende"),
    (['degedege', 'shingo_kuganda', 'kuogopa_mwangaza'], "Trikomonasi"),
    (['maumivu_ya_viungo', 'michubuko_ya_mwili', 'upele'], "Homa_ya_Dengue"),
    (['mara_nyingi_kwenda_choo_kidogo', 'kukaribia_mwangaza', 'mkojo_mweusi'], "Trikomonasi"),
]

# Run predictions and map correctness
for i, (symptoms, true_label) in enumerate(sample_tests, 1):
    predicted_label = predict_disease(symptoms)
    correct = "Correct" if predicted_label == true_label else "Incorrect"
    print(f"Sample {i}:")
    print(f" Symptoms: {symptoms}")
    print(f" True disease: {true_label}")
    print(f" Predicted disease: {predicted_label}")
    print(f" Result: {correct}\n")
