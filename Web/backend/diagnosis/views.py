# views.py (complete updated file)
# ========================================
# Imports
# ========================================

# Python standard library
import os
import re
import json
import uuid
import logging
from collections import defaultdict

# Third-party packages
import joblib
import spacy
import numpy as np
import pandas as pd
from rapidfuzz import fuzz, process

# Django / DRF
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

# Local apps / models / serializers
from .models import ChatSession, Message, MedicalReport
from .serializers import ChatSessionSerializer, MessageSerializer, MedicalReportSerializer
from account.models import CustomUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes

# ========================================
# Logging
# ========================================
logger = logging.getLogger(__name__)

# ========================================
# spaCy (Swahili/English fallback) - initialize early
# ========================================
try:
    try:
        nlp = spacy.load("sw_core_news_sm")
    except Exception:
        try:
            nlp = spacy.load("en_core_web_sm")
        except Exception:
            nlp = spacy.blank("xx")
except Exception:
    nlp = None

# ========================================
# Helper utilities (session topic, user/email, sessions fetch)
# ========================================
def extract_session_topic(text: str):
    """Extract a short topic from the first user message."""
    if not text:
        return "General Inquiry"
    try:
        if nlp:
            doc = nlp(text.lower())
            keywords = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) <= 3]
            return keywords[0].capitalize() if keywords else text.strip().split("\n")[0][:60].strip()
        else:
            # fallback: take first 3 words
            return " ".join(text.strip().split()[:3]).capitalize()
    except Exception:
        return text.strip().split("\n")[0][:60].strip()

def get_user_and_email(request):
    """Determine user and email from request."""
    user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
    email = request.data.get('user_email') or getattr(user, 'email', 'anonymous@guest.com')
    return user, email

def get_sessions_by_filter(**filters):
    """Fetch and serialize sessions by filters."""
    sessions = ChatSession.objects.filter(**filters).order_by('-created_at')
    return ChatSessionSerializer(sessions, many=True).data

# ========================================
# Session Management Views
# ========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """Create a new chat session."""
    device_id = request.data.get('device_id')
    first_message = request.data.get('first_message', '')

    if not device_id:
        return Response({'error': 'Device ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user, _ = get_user_and_email(request)
        topic = extract_session_topic(first_message)

        session = ChatSession.objects.create(
            user=user,
            device_id=device_id,
            topic=topic
        )

        return Response({
            'session_id': session.session_id,
            'topic': topic,
            'message': 'Session created successfully'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Session creation error: %s", e)
        return Response({'error': 'Failed to create session. Please try again.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def list_sessions(request):
    """List sessions by device ID."""
    device_id = request.GET.get('device_id')
    if not device_id:
        return Response({'error': 'Device ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    data = get_sessions_by_filter(device_id=device_id)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_sessions(request):
    """Get all sessions for the authenticated user."""
    data = get_sessions_by_filter(user=request.user)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_messages(request, session_id):
    """Get messages for a specific session."""
    try:
        messages = Message.objects.filter(session__session_id=session_id).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.exception("Error fetching messages: %s", e)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
"""
Updated smart-doctor chat view with robust advice lookup + fallback enrichment.
Place this file in your Django app (e.g. views.py or a new module) and ensure
`ML/ML_TEST/ushauri.py` exists (optional).

Requirements:
  pip install joblib pandas numpy rapidfuzz djangorestframework

Behavioral changes:
  - robust disease-name normalization (exact, canonical, synonyms, fuzzy)
  - fallback enrichment implemented locally if external ushauri module not found
  - helpful debug prints for diagnosis when `debug=True` in request
# views_smart_doctor_with_autogen_advice.py

"""# views_smart_doctor_with_autogen_advice.py
import os
import re
import logging
from typing import Dict, Any, List, Optional

import joblib
import pandas as pd
import numpy as np
from rapidfuzz import process, fuzz

from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import ChatSession, Message, CustomUser

logger = logging.getLogger(__name__)

# optional spaCy (tokenization fallback to regex)
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = None
except Exception:
    nlp = None

# ========================================
# Machine Learning & advice loading
# ========================================
BASE_DIR = getattr(settings, "BASE_DIR", os.getcwd())
MODEL_DIR = os.path.join(BASE_DIR, "ML", "ML_TEST")
MODEL_PATH = os.path.join(MODEL_DIR, "magonjwa_model.pkl")
SYMPTOMS_PATH = os.path.join(MODEL_DIR, "symptom_columns.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
FULL_DATASET_PATH = os.path.join(MODEL_DIR, "magonjwa_ya_kuambukiza_dataset_swahili_full.csv")
USHAURI_PATH = os.path.join(MODEL_DIR, "ushauri.py")

for p, msg in [
    (MODEL_PATH, "Model"),
    (SYMPTOMS_PATH, "Symptom columns"),
    (LABEL_ENCODER_PATH, "Label encoder"),
    (FULL_DATASET_PATH, "Dataset"),
]:
    if not os.path.exists(p):
        raise FileNotFoundError(f"{msg} not found at {p} (expected at {p})")

model = joblib.load(MODEL_PATH)
SYMPTOM_COLUMNS = joblib.load(SYMPTOMS_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)

df_full = pd.read_csv(FULL_DATASET_PATH)
TARGET_COL = "ugonjwa" if "ugonjwa" in df_full.columns else "Ugonjwa"
FEATURES = [c for c in SYMPTOM_COLUMNS if c in df_full.columns]

# Try import ushauri.* advice map (if present)
ADVICE_DB: Dict[str, Dict[str, Any]] = {}
external_advice_for = None
external_enrich = None
try:
    import importlib
    ushauri_mod = None
    try:
        ushauri_mod = importlib.import_module("ML.ML_TEST.ushauri")
    except Exception:
        for p in ("ml.ML_TEST.ushauri", "ML.ushauri", "ushauri", "ML.advice_sw", "advice_sw"):
            try:
                ushauri_mod = importlib.import_module(p)
                break
            except Exception:
                continue
    if ushauri_mod:
        ADVICE_DB = getattr(ushauri_mod, "ADVICE_DB", {}) or {}
        external_advice_for = getattr(ushauri_mod, "advice_for", None)
        external_enrich = getattr(ushauri_mod, "enrich_predictions_with_advice", None)
except Exception:
    external_advice_for = None
    external_enrich = None

# exec ushauri.py if available but import failed
if (not ADVICE_DB) and os.path.exists(USHAURI_PATH):
    try:
        g: Dict[str, Any] = {}
        with open(USHAURI_PATH, "r", encoding="utf-8") as f:
            code = compile(f.read(), USHAURI_PATH, "exec")
            exec(code, g)
        ADVICE_DB = g.get("ADVICE_DB", {}) or {}
        external_advice_for = g.get("advice_for") or external_advice_for
        external_enrich = g.get("enrich_predictions_with_advice") or external_enrich
    except Exception:
        logger.exception("Failed to exec ushauri.py")

# If still empty: auto-generate advice entries from dataset (useful fallback)
def _human_symptom_name(sym: str) -> str:
    return sym.replace("_", " ").strip()

def _build_auto_advice_for_disease(dname: str, df: pd.DataFrame, symptom_cols: List[str], top_k: int = 6) -> Dict[str, Any]:
    subset = df[df[TARGET_COL] == dname]
    means = {}
    for s in symptom_cols:
        if s in subset.columns:
            try:
                means[s] = float(pd.to_numeric(subset[s], errors='coerce').fillna(0).astype(int).mean())
            except Exception:
                means[s] = 0.0
        else:
            means[s] = 0.0
    sorted_sym = sorted([ (s, means[s]) for s in means ], key=lambda x: x[1], reverse=True)
    top = [s for s, m in sorted_sym if m > 0][:top_k]
    readable_top = [_human_symptom_name(s) for s in top] if top else ["Dalili mbalimbali"]
    advice = {
        "majina_mengine": [],
        "maelezo_fupi": f"Ugonjwa '{dname}' umeonekana kwenye dataset. Dalili muhimu zinajumuisha: {', '.join(readable_top)}. (Hii ni taarifa ya msaada tu.)",
        "dalili_za_kuangalia": readable_top,
        "vipimo": ["Fanya vipimo vya msingi vinavyofaa kulingana na dalili; muone daktari kwa ushauri wa kitaalamu."],
        "tiba": ["Tiba hutegemea utambuzi wa daktari; fuata ushauri wa mtaalamu."],
        "kinga": ["Fuatilia usafi na hatua za kinga zinazofaa kulingana na ugonjwa."],
        "ushauri_wa_nyumbani": ["Pumzika, kunywa maji, andika dalili (muda/ukali), na muone daktari ikiwa dalili zinaendelea au zinaongezeka."],
        "dalili_za_hatari": [],
        "tafadhali_kumbuka": "Huu ni mwongozo wa msaada. Si badala ya uchunguzi wa daktari."
    }
    return advice

if not ADVICE_DB:
    logger.info("ADVICE_DB empty — auto-generating advice entries from dataset as fallback.")
    unique_ds = sorted(df_full[TARGET_COL].dropna().unique().tolist())
    for d in unique_ds:
        ADVICE_DB[d] = _build_auto_advice_for_disease(d, df_full, SYMPTOM_COLUMNS, top_k=6)

# compatibility alias
ADVICE = ADVICE_DB or {}

# canonical mapping
_CANONICAL = {k.strip().lower(): k for k in ADVICE_DB.keys()}

# normalization / enrichment helpers
def _clean_name(s: Optional[str]) -> str:
    if not s: return ""
    return str(s).strip()

def normalize_disease_name(name: str) -> str:
    name = _clean_name(name)
    if not name:
        return name
    if name in ADVICE_DB:
        return name
    low = name.lower()
    if low in _CANONICAL:
        return _CANONICAL[low]
    alt1 = name.replace(" ", "_")
    alt2 = name.replace("_", " ")
    if alt1 in ADVICE_DB: return alt1
    if alt2 in ADVICE_DB: return alt2
    for k, v in ADVICE_DB.items():
        for syn in v.get("majina_mengine", []) or []:
            if syn and syn.strip().lower() == low:
                return k
    keys = list(ADVICE_DB.keys())
    if keys:
        best = process.extractOne(name, keys, scorer=fuzz.WRatio)
        if best:
            match_key, score, _ = best
            if score >= 80:
                return match_key
    syn_list = []
    syn_to_key = {}
    for k, v in ADVICE_DB.items():
        for syn in v.get("majina_mengine", []) or []:
            if syn:
                syn_list.append(syn)
                syn_to_key[syn] = k
    if syn_list:
        best = process.extractOne(name, syn_list, scorer=fuzz.WRatio)
        if best:
            match_syn, score, _ = best
            if score >= 85:
                return syn_to_key.get(match_syn, name)
    return name

def advice_for_local(disease: str) -> Dict[str, Any]:
    dnorm = normalize_disease_name(disease)
    data = ADVICE_DB.get(dnorm)
    if data:
        return {"ugonjwa": dnorm, **data}
    return _build_auto_advice_for_disease(disease, df_full, SYMPTOM_COLUMNS, top_k=6)

def enrich_predictions_with_advice_local(predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    enriched = []
    for p in predictions:
        dname = p.get("disease")
        adv = advice_for_local(dname)
        enriched.append({**p, "advice": adv})
    return enriched

advice_for_fn = external_advice_for if callable(external_advice_for) else advice_for_local
enrich_fn = external_enrich if callable(external_enrich) else enrich_predictions_with_advice_local

# ========================================
# Symptom tokenization helpers
# ========================================
SYMPTOM_ALIASES = {
    "fever": "homa", "high fever": "homa_kali", "homa kali": "homa_kali",
    "chills": "baridi", "baridi": "baridi",
    "headache": "maumivu_ya_kichwa", "kichwa kinauma": "maumivu_ya_kichwa",
}
for sw in SYMPTOM_COLUMNS:
    SYMPTOM_ALIASES.setdefault(sw, sw)
    SYMPTOM_ALIASES.setdefault(sw.replace("_", " "), sw)

def _lower(s: str) -> str:
    return (s or "").lower().strip()

def tokenize(text: str):
    if not text: return []
    if not nlp:
        return re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ_]+", text.lower())
    doc = nlp(text)
    return [t.text.lower() for t in doc if not (t.is_space or t.is_punct)]

def alias_map_text(text: str):
    found = set()
    lt = _lower(text)
    for k in sorted(SYMPTOM_ALIASES.keys(), key=len, reverse=True):
        if k in lt:
            canonical = SYMPTOM_ALIASES[k]
            if canonical in SYMPTOM_COLUMNS:
                found.add(canonical)
    return found

def fuzzy_match_symptoms(text_or_tokens, top_k=6, threshold=86):
    found = set()
    candidates = SYMPTOM_COLUMNS
    queries = [text_or_tokens] if isinstance(text_or_tokens, str) else list(text_or_tokens)
    for q in queries:
        if not q: continue
        for match, score, _ in process.extract(q, candidates, scorer=fuzz.WRatio, limit=top_k):
            if score >= threshold:
                found.add(match)
    return found

def extract_symptoms(user_text: str):
    if not user_text: return []
    tokens = tokenize(user_text)
    s1 = alias_map_text(user_text)
    s2 = fuzzy_match_symptoms(tokens, top_k=5, threshold=87)
    s3 = fuzzy_match_symptoms(user_text, top_k=8, threshold=90)
    return sorted(set(s1) | set(s2) | set(s3))

# ========================================
# Prediction helpers
# ========================================
def vectorize(symptoms_list):
    v = np.zeros(len(SYMPTOM_COLUMNS), dtype=np.float32)
    idx = {s: i for i, s in enumerate(SYMPTOM_COLUMNS)}
    for s in symptoms_list:
        if s in idx:
            v[idx[s]] = 1.0
    return v

def _safe_predict_proba(clf, X):
    if hasattr(clf, "predict_proba"):
        return clf.predict_proba(X)
    pred = clf.predict(X)
    n_classes = len(label_encoder.classes_)
    probs = np.full((len(pred), n_classes), 1e-6, dtype=float)
    for i, p in enumerate(pred):
        probs[i, p] = 1.0
    return probs

def predict_with_probs(symptoms_list, top_n=3):
    vec = vectorize(symptoms_list).reshape(1, -1)
    probs = _safe_predict_proba(model, vec)[0]
    top_idx = np.argsort(probs)[::-1][:top_n]
    results = [{"disease": label_encoder.inverse_transform([i])[0], "probability": float(probs[i])} for i in top_idx]
    max_p = float(probs[top_idx[0]]) if len(top_idx) else 0.0
    conf = "high" if max_p >= 0.75 else "medium" if max_p >= 0.55 else "low"
    return results, conf

def diseases_with_all_symptoms(symptoms_list):
    if not symptoms_list:
        return df_full[TARGET_COL].unique().tolist()
    subset = df_full.copy()
    for s in symptoms_list:
        if s in subset.columns:
            subset = subset[pd.to_numeric(subset[s], errors='coerce').fillna(0).astype(int) == 1]
        else:
            return []
    return subset[TARGET_COL].unique().tolist()

def collect_related_symptoms_from_diseases(diseases):
    related = set()
    if not diseases:
        return []
    subset = df_full[df_full[TARGET_COL].isin(diseases)]
    if subset.empty:
        return []
    for s in SYMPTOM_COLUMNS:
        if s in subset.columns:
            try:
                meanv = float(pd.to_numeric(subset[s], errors='coerce').fillna(0).astype(int).mean())
            except Exception:
                meanv = 0.0
            if meanv > 0:
                related.add(s)
    return sorted(related)

def filter_diseases_by_presence(diseases, symptom, present=True):
    if not diseases:
        return []
    subset = df_full[df_full[TARGET_COL].isin(diseases)]
    if subset.empty:
        return []
    if symptom not in subset.columns:
        return diseases if present else diseases
    if present:
        kept = subset[pd.to_numeric(subset[symptom], errors='coerce').fillna(0).astype(int) == 1][TARGET_COL].unique().tolist()
    else:
        kept = subset[pd.to_numeric(subset[symptom], errors='coerce').fillna(0).astype(int) == 0][TARGET_COL].unique().tolist()
    return kept

# yes/no tokens
YES_TOKENS = {"ndio", "ndiyo", "yes", "y", "naam", "sawa", "poa"}
NO_TOKENS = {"hapana", "la", "no", "si", "sio", "siyo"}

def _normalize_yes_no(msg: str):
    m = _lower(msg)
    if m in YES_TOKENS: return "YES"
    if m in NO_TOKENS: return "NO"
    return None

# -------------------------
# Helper to normalize whatever enrich_fn returned into list of {"disease","probability","advice":{...}}
# -------------------------
def _normalize_enriched_predictions(preds: List[Dict[str, Any]], enriched_raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    preds: original predictions list (disease/probability)
    enriched_raw: result of enrich_fn(preds) -- may be inconsistent shape
    Returns: list same length as preds of dicts with 'disease','probability','advice'
    """
    normalized = []
    # Build lookup by normalized disease name for enriched_raw items
    lookup = {}
    for e in enriched_raw or []:
        # try to find canonical disease name inside e
        cand = e.get("disease") or e.get("ugonjwa") or e.get("name") or ""
        # if not, try to deduce from keys/values (fallback)
        cand_norm = normalize_disease_name(str(cand)) if cand else ""
        # store original entry under normalized key (multiple entries possible; keep first)
        if cand_norm:
            lookup.setdefault(cand_norm, e)
            continue
        # else attempt a fuzzy mapping from e keys/values - skip heavy attempts here
    for p in preds:
        d = p.get("disease")
        dnorm = normalize_disease_name(str(d))
        e = lookup.get(dnorm)
        advice_obj = None
        if e:
            # If entry already has 'advice' key, use it
            if isinstance(e.get("advice"), dict):
                advice_obj = e.get("advice")
            else:
                # If the enrich entry seems to have advice merged at top-level
                # Extract advice-related keys by excluding known prediction keys
                advice_keys = {k: v for k, v in e.items() if k not in ("disease", "probability", "ugonjwa", "name")}
                # If advisory content found, ensure 'ugonjwa' present
                if advice_keys:
                    if "ugonjwa" not in advice_keys:
                        advice_keys["ugonjwa"] = dnorm
                    advice_obj = advice_keys
        # If we didn't extract advice yet, call advice_for_fn/advice_for_local
        if advice_obj is None:
            try:
                if callable(advice_for_fn):
                    advice_obj = advice_for_fn(d)
                else:
                    advice_obj = advice_for_local(d)
            except Exception:
                advice_obj = advice_for_local(d)
        # ensure advice is a dict
        if not isinstance(advice_obj, dict):
            advice_obj = {"ugonjwa": dnorm, "maelezo_fupi": str(advice_obj)}
        normalized.append({"disease": d, "probability": p.get("probability"), "advice": advice_obj})
    return normalized

# main chat endpoint (same flow but using enrich_fn)
@api_view(["POST"])
def chat_with_doctor(request):
    message = (request.data.get("message") or "").strip()
    device_id = request.data.get("device_id")
    user_email = request.data.get("user_email")
    session_id = request.data.get("session_id")
    top_n = int(request.data.get("top_n") or 3)
    debug = bool(request.data.get("debug") or False)

    if not device_id or not user_email or not session_id:
        return Response({"error": "device_id, user_email, and session_id are required"}, status=400)

    try:
        user = CustomUser.objects.get(email=user_email)
    except CustomUser.DoesNotExist:
        return Response({"error": "User with that email not found"}, status=404)

    try:
        session = ChatSession.objects.get(session_id=session_id, device_id=device_id)
    except ChatSession.DoesNotExist:
        return Response({"error": "Invalid session ID or device mismatch"}, status=404)

    if session.user and session.user != user:
        return Response({"error": "Session belongs to another user."}, status=403)

    session.user = user
    session.symptoms = session.symptoms or []
    session.pending_questions = session.pending_questions or []
    session.meta = session.meta or {}
    session.save()

    if message:
        Message.objects.create(session=session, is_user=True, text=message)

    if _lower(message) in {"reset", "anzisha upya", "anza upya", "start over"}:
        session.symptoms = []
        session.pending_questions = []
        session.meta = {}
        session.save()
        bot = "Tumerejea mwanzo. Tafadhali taja dalili zako - taja dalili mbili kwanza (mf. homa, maumivu ya kichwa)."
        Message.objects.create(session=session, is_user=False, text=bot)
        return Response({"response": bot, "symptoms": session.symptoms, "possible_diseases": []})

    yn = _normalize_yes_no(message)
    if yn and session.pending_questions:
        q_sym = session.pending_questions.pop(0)
        asked = session.meta.get('asked', [])
        asked.append(q_sym)
        session.meta['asked'] = asked
        if yn == "YES":
            if q_sym not in session.symptoms:
                session.symptoms.append(q_sym)
            candidates = session.meta.get('candidates', [])
            session.meta['candidates'] = filter_diseases_by_presence(candidates, q_sym, present=True)
        else:
            candidates = session.meta.get('candidates', [])
            session.meta['candidates'] = filter_diseases_by_presence(candidates, q_sym, present=False)
        session.save()

    newly = extract_symptoms(message)
    if newly:
        valid_new = [s for s in newly if s in SYMPTOM_COLUMNS]
        session.symptoms = sorted(set(session.symptoms) | set(valid_new))
        session.save()

    if (not newly) and (not yn) and (not session.pending_questions) and not session.symptoms:
        bot = "Tafadhali tu tuzungumzie tu dalili za magonjwa (taja dalili mbili kwanza)."
        Message.objects.create(session=session, is_user=False, text=bot)
        return Response({"response": bot, "symptoms": session.symptoms, "possible_diseases": []})

    if len(session.symptoms) < 2:
        bot = "Asante. Tafadhali taja dalili nyingine (taja jumla ya dalili 2 ili nikupe maswali maalum)."
        Message.objects.create(session=session, is_user=False, text=bot)
        return Response({"response": bot, "symptoms": session.symptoms, "possible_diseases": []})

    if not session.meta.get('candidates'):
        candidates = diseases_with_all_symptoms(session.symptoms)
        session.meta['candidates'] = candidates
        session.save()

    def refresh_candidate_symptoms():
        candidates = session.meta.get('candidates', [])
        related = collect_related_symptoms_from_diseases(candidates)
        known = set(session.symptoms) | set(session.meta.get('asked', []))
        remaining = [s for s in related if s not in known]
        session.meta['candidate_symptoms'] = remaining
        session.save()
        return remaining

    candidate_symptoms = session.meta.get('candidate_symptoms') or refresh_candidate_symptoms()

    if session.pending_questions:
        q = session.pending_questions[0]
        q_text = f"Je, una dalili ya '{q.replace('_', ' ')}'? (ndio/hapana)"
        return Response({
            "response": q_text,
            "symptoms": session.symptoms,
            "possible_diseases": [],
            "next_question": q,
        })

    need_to_predict = (len(session.symptoms) >= 6) or (not candidate_symptoms)

    if not need_to_predict and candidate_symptoms:
        next_sym = candidate_symptoms.pop(0)
        session.meta['candidate_symptoms'] = candidate_symptoms
        session.pending_questions.append(next_sym)
        session.save()
        q_text = f"Je, una dalili ya '{next_sym.replace('_', ' ')}'? (ndio/hapana)"
        Message.objects.create(session=session, is_user=False, text=q_text)
        return Response({
            "response": q_text,
            "symptoms": session.symptoms,
            "possible_diseases": session.meta.get('candidates', []),
            "next_question": next_sym,
        })

    # ------------------------------
    # Final prediction
    # ------------------------------
    predictions, conf = predict_with_probs(session.symptoms, top_n=top_n)

    # ------------------------------
    # Enrich predictions with advice (and normalize shape)
    # ------------------------------
    enriched_predictions_raw = None
    try:
        if enrich_fn and callable(enrich_fn):
            enriched_predictions_raw = enrich_fn(predictions)
        else:
            enriched_predictions_raw = enrich_predictions_with_advice_local(predictions)
    except Exception as e:
        logger.exception("Error enriching predictions: %s", e)
        enriched_predictions_raw = [{**p, "advice": advice_for_local(p.get("disease"))} for p in predictions]

    enriched_predictions = _normalize_enriched_predictions(predictions, enriched_predictions_raw)

    # Construct response text and top_advice
    lines = []
    if predictions:
        lines.append("Kulingana na dalili ulizotoa, magonjwa yanayowezekana zaidi ni:")
        for p in predictions:
            prob = p.get("probability")
            try:
                pct = f"{prob:.0%}" if (isinstance(prob, float) or isinstance(prob, (int))) else "—"
            except Exception:
                pct = "—"
            lines.append(f"- {p.get('disease')} ({pct})")
    else:
        lines.append("Sijaweza kupata utabiri wowote kwa dalili hizi.")

    top1 = predictions[0]["disease"] if predictions else None
    top_advice = {}
    red_flag = False
    red_hits = []

    if top1:
        # find normalized enriched entry by matching disease ignoring case
        top_en = next((e for e in enriched_predictions if str(e.get("disease")).strip().lower() == str(top1).strip().lower()), None)
        if top_en:
            top_advice = top_en.get("advice") or {}
        else:
            try:
                top_advice = advice_for_fn(top1) if callable(advice_for_fn) else advice_for_local(top1)
            except Exception:
                top_advice = advice_for_local(top1)

        # append pieces of top_advice to bot message
        if top_advice:
            if isinstance(top_advice, dict) and top_advice.get('maelezo_fupi'):
                lines.append("")
                lines.append(f"Maelezo: {top_advice['maelezo_fupi']}")
            if isinstance(top_advice, dict) and top_advice.get('dalili_za_kuangalia'):
                lines.append("Dalili muhimu za kuangalia: " + "; ".join(top_advice['dalili_za_kuangalia']))
            if isinstance(top_advice, dict) and top_advice.get('vipimo'):
                lines.append("Vipimo vinavyopendekezwa: " + "; ".join(top_advice['vipimo']))
            if isinstance(top_advice, dict) and top_advice.get('tiba'):
                lines.append("Tiba ya kawaida (fuata ushauri wa daktari): " + "; ".join(top_advice['tiba']))
            if isinstance(top_advice, dict) and top_advice.get('kinga'):
                lines.append("Kinga: " + "; ".join(top_advice['kinga']))
            if isinstance(top_advice, dict) and top_advice.get('ushauri_wa_nyumbani'):
                lines.append("Ushauri wa nyumbani: " + "; ".join(top_advice['ushauri_wa_nyumbani']))

            # danger signs detection
            danger = top_advice.get('dalili_za_hatari', []) if isinstance(top_advice, dict) else []
            reported = set(session.symptoms)
            hits = []
            for item in danger:
                try:
                    matched = extract_symptoms(item)
                    if any(m in reported for m in matched):
                        hits.append(item)
                except Exception:
                    continue
            if hits:
                red_flag = True
                red_hits = hits

    # add confidence sentence
    if predictions:
        p0 = predictions[0].get('probability') or 0.0
        try:
            p0 = float(p0)
        except Exception:
            p0 = 0.0
        if p0 >= 0.75:
            lines.append("\nUhakika: wa juu. Bado hakikisha kwa daktari kabla ya tiba.")
        elif p0 >= 0.55:
            lines.append("\nUhakika: wa kati. Pendekezo: fanya vipimo vilivyotajwa au muone daktari.")
        else:
            lines.append("\nUhakika: mdogo. Taja dalili zaidi au fanya vipimo vya awali.")

    bot_reply = "\n".join(lines)
    Message.objects.create(session=session, is_user=False, text=bot_reply)

    session.meta = session.meta or {}
    session.pending_questions = []
    session.save()

    payload = {
        "response": bot_reply,
        "symptoms": session.symptoms,
        "possible_diseases": predictions,
        "enriched_predictions": enriched_predictions,
        "top_advice": top_advice or {},
        "confidence": conf,
        "red_flags": red_flag,
        "red_flag_details": red_hits,
    }

    if debug:
        payload['debug_tokens'] = newly
        payload['meta'] = session.meta
        logger.info("PREDICTIONS: %s", predictions)
        logger.info("ENRICHED_RAW: %s", enriched_predictions_raw)
        logger.info("ENRICHED_NORMALIZED: %s", enriched_predictions)
        try:
            logger.info("TOP_NORMALIZED: %s", normalize_disease_name(top1))
        except Exception:
            pass

    # print for quick server debugging (remove/disable in production)
    print("TOP_ADVICE:", json_safe(top_advice := payload['top_advice']))
    return Response(payload)

# small helper for safe printing nested dicts (avoid JSON errors)
def json_safe(obj):
    try:
        import json as _json
        return _json.dumps(obj, ensure_ascii=False, default=str)
    except Exception:
        return str(obj)


from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import MedicalReport
from .serializers import MedicalReportSerializer
from django.http import FileResponse
import os

@api_view(['GET', 'POST', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def medical_report_view(request, report_id=None):
    """
    Handles:
    - GET /reports/ → Get all reports for the logged-in user
    - GET /reports/<id>/ → Get specific report
    - GET /reports/<id>/?download=true → Download PDF
    - POST /reports/ → Create report
    - DELETE /reports/<id>/ → Delete report
    """

    # GET (all or single)
    if request.method == 'GET':
        download = request.query_params.get("download", None)

        if report_id:
            try:
                report = MedicalReport.objects.get(id=report_id, user=request.user)

                # ✅ Handle PDF download
                if download and report.pdf:
                    pdf_path = report.pdf.path
                    if os.path.exists(pdf_path):
                        response = FileResponse(
                            open(pdf_path, 'rb'), content_type='application/pdf'
                        )
                        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(pdf_path)}"'
                        return response
                    return Response({"error": "PDF not found"}, status=status.HTTP_404_NOT_FOUND)

                # ✅ Normal JSON response with request context
                serializer = MedicalReportSerializer(report, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)

            except MedicalReport.DoesNotExist:
                return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            reports = MedicalReport.objects.filter(user=request.user)
            serializer = MedicalReportSerializer(reports, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    # POST (create new)
    elif request.method == 'POST':
        data = request.data.copy()
        serializer = MedicalReportSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                {"message": "Report saved successfully", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE (by ID)
    elif request.method == 'DELETE':
        if not report_id:
            return Response({"error": "Report ID required for deletion"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = MedicalReport.objects.get(id=report_id, user=request.user)
            report.delete()
            return Response({"message": "Report deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except MedicalReport.DoesNotExist:
            return Response({"error": "Report not found or not yours"}, status=status.HTTP_404_NOT_FOUND)
