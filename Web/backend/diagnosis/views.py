from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ChatSession, Message
from account.models import CustomUser
from .serializers import ChatSessionSerializer, MessageSerializer
import spacy
import pandas as pd
import numpy as np
import uuid

# Load SpaCy and dataset
nlp = spacy.load("en_core_web_sm")
df = pd.read_csv("ML/disease_binary_dataset.csv")
SYMPTOM_COLUMNS = [col for col in df.columns if col not in ['Ugonjwa', 'Vipimo', 'Tiba', 'Kinga', 'Ushauri']]

def extract_symptoms(text):
    doc = nlp(text)
    tokens = [token.text.lower() for token in doc if not token.is_stop and not token.is_punct]
    return [symptom for symptom in SYMPTOM_COLUMNS if symptom in tokens]

def get_possible_diseases(symptoms):
    input_vector = np.zeros(len(SYMPTOM_COLUMNS))
    for symptom in symptoms:
        if symptom in SYMPTOM_COLUMNS:
            input_vector[SYMPTOM_COLUMNS.index(symptom)] = 1

    disease_vectors = df[SYMPTOM_COLUMNS].values
    matches = []

    for idx, row in enumerate(disease_vectors):
        match_count = np.sum(np.logical_and(input_vector, row))
        if match_count >= 2:
            matches.append({
                "disease": df.iloc[idx]["Ugonjwa"],
                "matching_symptom_count": int(match_count),
                "symptoms": ", ".join(symptoms),
                "tests": df.iloc[idx]["Vipimo"],
                "treatment": df.iloc[idx]["Tiba"],
                "prevention": df.iloc[idx]["Kinga"],
                "advice": df.iloc[idx]["Ushauri"]
            })
    return matches

def suggest_next_symptom(possible_diseases, asked_symptoms):
    symptom_scores = {}
    for disease in possible_diseases:
        disease_row = df[df['Ugonjwa'] == disease['disease']]
        for symptom in SYMPTOM_COLUMNS:
            if disease_row[symptom].values[0] == 1 and symptom not in asked_symptoms:
                symptom_scores[symptom] = symptom_scores.get(symptom, 0) + 1

    if not symptom_scores:
        return None

    return max(symptom_scores, key=symptom_scores.get)
import uuid
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ChatSession
from .serializers import ChatSessionSerializer

logger = logging.getLogger(__name__)

def get_user_and_email(request):
    """Determine user and email from request."""
    user = request.user if request.user.is_authenticated else None
    email = request.data.get('user_email') or getattr(user, 'email', 'anonymous@guest.com')
    return user, email

def create_chat_session(device_id, user, email):
    """Create and return a new chat session."""
    session = ChatSession.objects.create(
        device_id=device_id,
        user=user,
        user_email=email,
        session_id=str(uuid.uuid4())
    )
    return session

import spacy

nlp = spacy.load("en_core_web_sm")

def extract_session_topic(text):
    doc = nlp(text.lower())
    keywords = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) <= 3]
    if keywords:
        return keywords[0].capitalize()
    return "General Inquiry"


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    device_id = request.data.get('device_id')
    first_message = request.data.get('first_message', '')  # 👈 New input
    if not device_id:
        return Response({'error': 'Device ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user, email = get_user_and_email(request)
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
        logger.error(f"Session creation error: {str(e)}")
        return Response({'error': 'Failed to create session. Please try again.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)



def get_sessions_by_filter(**filters):
    """Fetch and serialize sessions by filters."""
    sessions = ChatSession.objects.filter(**filters).order_by('-created_at')
    return ChatSessionSerializer(sessions, many=True).data

@api_view(['GET'])
def list_sessions(request):
    device_id = request.GET.get('device_id')
    if not device_id:
        return Response({'error': 'Device ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    data = get_sessions_by_filter(device_id=device_id)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_sessions(request):
    data = get_sessions_by_filter(user=request.user)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Optional: remove if unauthenticated users can access messages
def get_session_messages(request, session_id):
    try:
        messages = Message.objects.filter(session__session_id=session_id).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def chat_with_doctor(request):
    message = request.data.get('message')
    device_id = request.data.get('device_id')
    user_email = request.data.get('user_email')
    session_id = request.data.get('session_id')

    if not device_id or not user_email or not session_id:
        return Response({"error": "device_id, user_email and session_id are required"}, status=400)

    try:
        user = CustomUser.objects.get(email=user_email)
    except CustomUser.DoesNotExist:
        return Response({"error": "User with that email not found"}, status=404)

    try:
        session = ChatSession.objects.get(session_id=session_id, device_id=device_id)
    except ChatSession.DoesNotExist:
        return Response({"error": "Invalid session ID or device mismatch"}, status=404)

    if session.user and session.user != user:
        return Response({"error": "Session already assigned to a different user."}, status=403)

    session.user = user
    session.save()

    Message.objects.create(session=session, is_user=True, text=message)

    if message.lower() in ['ndio', 'hapana'] and session.pending_questions:
        last_question = session.pending_questions.pop(0)
        if message.lower() == 'ndio':
            session.symptoms.append(last_question)
        session.save()

    else:
        new_symptoms = extract_symptoms(message)
        session.symptoms = list(set(session.symptoms + new_symptoms))
        session.save()

    if len(session.symptoms) < 4:
        possible_diseases = get_possible_diseases(session.symptoms)
        next_symptom = suggest_next_symptom(possible_diseases, session.symptoms + session.pending_questions)
        if next_symptom:
            session.pending_questions.append(next_symptom)
            session.save()
            bot_reply = f"Je, una dalili ya '{next_symptom}'? (ndio/hapana)"
        else:
            bot_reply = "Nini tena kinakusumbua? Tafadhali taja dalili zaidi."

        Message.objects.create(session=session, is_user=False, text=bot_reply)
        return Response({
            "response": bot_reply,
            "symptoms": session.symptoms,
            "possible_diseases": []
        })

    possible_diseases = get_possible_diseases(session.symptoms)
    if possible_diseases:
        bot_reply = f"Nimepata magonjwa {len(possible_diseases)} yanayowezekana kulingana na dalili zako: {', '.join(session.symptoms)}."
    else:
        bot_reply = f"Samahani, siwezi kupata ugonjwa wowote kwa sasa kutokana na dalili ulizotoa: {', '.join(session.symptoms)}."

    Message.objects.create(session=session, is_user=False, text=bot_reply)

    return Response({
        "response": bot_reply,
        "symptoms": session.symptoms,
        "possible_diseases": possible_diseases
    })
