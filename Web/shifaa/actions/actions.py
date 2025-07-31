# 📦 Imports
import pandas as pd
import random
import requests

from rasa_sdk import Action
from rasa_sdk.events import SlotSet
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.types import DomainDict
from rasa_sdk import Tracker

# 🗂️ Dataset path
DATASET_PATH = "/home/masud/Desktop/SHIFAA_FYP/Web/malaria_dataset.csv"

# 🧹 Helper to clean dalili
def clean_symptom_list(symptom_string):
    if isinstance(symptom_string, str):
        return [s.strip().lower() for s in symptom_string.split(',') if s.strip()]
    return []

# 🤖 Main Action
class ActionCollectSymptom(Action):
    def name(self):
        return "action_collect_symptom"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: DomainDict):
        current_symptoms = tracker.get_slot("symptoms") or []
        suggested_symptom = tracker.get_slot("suggested_symptom")
        user_input = tracker.latest_message.get("text", "").strip().lower()

        affirm_words = ["ndio", "naam", "sahihi", "yap", "yeah"]
        deny_words = ["hapana", "la", "sivyo", "hap", "si"]

        if suggested_symptom:
            if user_input in affirm_words and suggested_symptom not in current_symptoms:
                current_symptoms.append(suggested_symptom)
        else:
            if user_input and user_input not in current_symptoms:
                current_symptoms.append(user_input)

        if len(current_symptoms) >= 5:
            return self._predict_and_respond(dispatcher, current_symptoms)

        try:
            df = pd.read_csv(DATASET_PATH)
            df["Dalili"] = df["Dalili"].astype(str).str.lower()

            possible_symptoms = set()
            for _, row in df.iterrows():
                disease_symptoms = clean_symptom_list(row["Dalili"])
                if any(sym in disease_symptoms for sym in current_symptoms):
                    for sym in disease_symptoms:
                        if sym not in current_symptoms:
                            possible_symptoms.add(sym)

            if possible_symptoms:
                next_symptom = random.choice(list(possible_symptoms))
                dispatcher.utter_message(text=f"Je, unapata {next_symptom}?")
                return [
                    SlotSet("symptoms", current_symptoms),
                    SlotSet("suggested_symptom", next_symptom)
                ]
            else:
                dispatcher.utter_message(text="Ahsante. Tunaendelea na utambuzi...")
                return [SlotSet("symptoms", current_symptoms)]

        except Exception as e:
            print(f"❌ Error reading dataset: {e}")
            dispatcher.utter_message(text="Tatizo katika kusoma dataset ya dalili.")
            return [SlotSet("symptoms", current_symptoms)]

    def _predict_and_respond(self, dispatcher: CollectingDispatcher, symptoms: list):
        symptoms_text = ", ".join(symptoms)
        try:
            response = requests.post(
                "http://127.0.0.1:8000/api/diagnosis/",
                json={"symptoms": symptoms_text}
            )
            if response.status_code == 200:
                data = response.json()
                prediction = data.get("prediction", "Haijapatikana")
                vipimo = data.get("vipimo", "Hakuna")
                tiba = data.get("tiba", "Hakuna")
                kinga = data.get("kinga", "Hakuna")
                ushauri = data.get("ushauri", "Hakuna")

                message = (
                    f"💡 *Ugonjwa:* {prediction}\n\n"
                    f"🧪 *Vipimo:* {vipimo}\n"
                    f"💊 *Tiba:* {tiba}\n"
                    f"🛡️ *Kinga:* {kinga}\n"
                    f"📌 *Ushauri:* {ushauri}"
                )
            else:
                message = "Samahani, hatuwezi kupata majibu sasa."
                prediction = "Haijapatikana"

        except Exception as e:
            print(f"❌ Error during diagnosis API call: {e}")
            message = "Tatizo la kuwasiliana na mfumo wa utambuzi wa ugonjwa."
            prediction = "Haijapatikana"

        dispatcher.utter_message(text=message)
        return [
            SlotSet("symptoms", symptoms),
            SlotSet("suggested_symptom", None),
            SlotSet("disease_prediction", prediction)
        ]
