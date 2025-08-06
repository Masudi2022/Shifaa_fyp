from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .models import VoiceNote
from .serializers import VoiceNoteSerializer
from appointment.models import Appointment

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def send_voice_note_by_appointment_id(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    sender = request.user
    doctor_user = appointment.doctor
    patient_user = appointment.user

    # Determine receiver
    if sender == doctor_user:
        receiver = patient_user
    elif sender == patient_user:
        receiver = doctor_user
    else:
        return Response(
            {'detail': 'You are not authorized to send voice notes for this appointment.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if 'audio_file' not in request.FILES:
        return Response({'detail': 'No audio file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    # Pass appointment, sender, and receiver manually
    data = request.data.copy()
    data['appointment'] = appointment.id  # ✅ set appointment explicitly

    serializer = VoiceNoteSerializer(data=data)
    if serializer.is_valid():
        serializer.save(sender=sender, receiver=receiver, appointment=appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import VoiceNote
from appointment.models import Appointment
from .serializers import VoiceNoteSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_voice_notes_by_appointment(request, appointment_id):
    """
    Get all voice notes for a given appointment.
    Only the doctor or patient for that appointment can access it.
    """
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return Response({"detail": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

    # Ensure only participants can view the voice notes
    if request.user != appointment.user and request.user != appointment.doctor:
        return Response(
            {"detail": "You are not authorized to view these voice notes."},
            status=status.HTTP_403_FORBIDDEN
        )

    voice_notes = VoiceNote.objects.filter(appointment=appointment).order_by('timestamp')
    serializer = VoiceNoteSerializer(voice_notes, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
