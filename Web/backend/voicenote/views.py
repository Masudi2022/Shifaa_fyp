# backend/voicenote/views.py
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
    """
    Send a voice note using appointment ID.
    Automatically sets sender and receiver based on appointment.
    """
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    sender = request.user

    # Determine doctor_user robustly
    doctor_field = appointment.doctor
    if doctor_field is None:
        return Response({'detail': 'Appointment has no doctor assigned'}, status=status.HTTP_400_BAD_REQUEST)

    # If the doctor field is an object with a 'user' relation, use that; otherwise assume it's already a CustomUser
    doctor_user = getattr(doctor_field, 'user', doctor_field)

    patient_user = appointment.user

    # Who's the receiver? The other party
    if sender == doctor_user:
        receiver = patient_user
    elif sender == patient_user:
        receiver = doctor_user
    else:
        return Response({'detail': 'You are not authorized to send voice notes for this appointment.'},
                        status=status.HTTP_403_FORBIDDEN)

    if 'audio_file' not in request.FILES:
        return Response({'detail': 'No audio file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Save using serializer so validation/URLs/time formatting are handled
        serializer = VoiceNoteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(sender=sender, receiver=receiver, appointment=appointment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Log error for debugging
        import traceback
        traceback.print_exc()
        return Response({'detail': 'Server error when saving voice note.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
