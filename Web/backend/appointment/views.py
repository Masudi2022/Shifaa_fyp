

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import date as dt_date

today = dt_date.today()
# appointment/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import AppointmentSerializer
from .models import Appointment
from account.models import CustomUser

# Helper to handle serializer creation
def handle_serializer(request, data=None, instance=None, partial=False):
    serializer = AppointmentSerializer(
        instance=instance,
        data=data or request.data,
        partial=partial,
        context={'request': request}
    )
    if serializer.is_valid():
        obj = serializer.save()
        return Response(AppointmentSerializer(obj).data, status=status.HTTP_201_CREATED if not instance else status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_appointment(request):
    """Book a new appointment"""
    return handle_serializer(request)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_appointments(request):
    """Get all appointments for the logged-in patient"""
    appointments = Appointment.objects.filter(user=request.user).order_by('-date', '-time')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Appointment
from .serializers import AppointmentSerializer

def get_appointment_or_404(appointment_id):
    """Reusable function to get appointment or return None"""
    try:
        return Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return None

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_doctor_appointments(request):
    """Get all appointments for the logged-in doctor"""
    if request.user.role != 'Doctor':
        return Response({'detail': 'You are not a doctor'}, status=status.HTTP_403_FORBIDDEN)
    
    appointments = Appointment.objects.filter(doctor=request.user).order_by('-date', '-time')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, appointment_id):
    """Doctor can confirm/unconfirm and update appointment status"""
    appointment = get_appointment_or_404(appointment_id)
    if not appointment:
        return Response({'detail': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    # ✅ Only the assigned doctor can update
    if request.user != appointment.doctor:
        return Response({'detail': 'You are not allowed to update this appointment'}, status=status.HTTP_403_FORBIDDEN)

    # ✅ Confirmation handling
    if 'is_confirmed' in request.data:
        appointment.is_confirmed = request.data['is_confirmed']

    # ✅ Status handling (Pending, Ongoing, Completed)
    if 'status' in request.data:
        if request.data['status'] in dict(Appointment.STATUS_CHOICES):
            appointment.status = request.data['status']
        else:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    appointment.save()
    return Response({'detail': 'Appointment updated successfully'}, status=status.HTTP_200_OK)


# appointment/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Appointment
from .serializers import AppointmentSerializer

def handle_serializer(request, instance=None, partial=False):
    """DRY helper for creating/updating/deleting appointments"""
    if request.method in ['POST', 'PATCH']:
        serializer = AppointmentSerializer(instance, data=request.data, context={'request': request}, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        instance.delete()
        return Response({'detail': 'Appointment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Appointment

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, appointment_id):
    """Doctor can confirm/unconfirm, update status, and add/edit notes."""
    appointment = get_object_or_404(Appointment, id=appointment_id)

    if request.user != appointment.doctor:
        return Response(
            {'detail': 'You are not allowed to update this appointment'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Update confirmation
    if 'is_confirmed' in request.data:
        appointment.is_confirmed = request.data['is_confirmed']

    # Update status
    if 'status' in request.data:
        if request.data['status'] in dict(Appointment.STATUS_CHOICES):
            appointment.status = request.data['status']
        else:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    # Update notes (doctor's comment)
    if 'notes' in request.data:
        appointment.notes = request.data['notes']

    appointment.save()
    print(request.data)


    return Response({'detail': 'Appointment updated successfully'}, status=status.HTTP_200_OK)




@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_appointment(request, appointment_id):
    """Delete an appointment"""
    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return Response({'detail': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only the patient who booked OR the doctor can delete it
    if request.user != appointment.user and request.user != appointment.doctor:
        return Response({'detail': 'You are not allowed to delete this appointment'}, status=status.HTTP_403_FORBIDDEN)

    appointment.delete()
    return Response({'detail': 'Appointment deleted successfully'}, status=status.HTTP_200_OK)



from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import DoctorAvailability, Doctor
from .serializers import DoctorAvailabilitySerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def doctor_availability_list_create(request):
    """
    GET: List all availability slots
    POST: Create a new availability slot for the logged-in doctor
    """
    if request.method == 'GET':
        availability = DoctorAvailability.objects.all().order_by('date', 'start_time')
        serializer = DoctorAvailabilitySerializer(availability, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # ✅ Pass request to serializer so it can set doctor automatically
        serializer = DoctorAvailabilitySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()  # doctor will be set in serializer.create()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def doctor_availability_detail(request, pk):
    """
    GET: Retrieve an availability slot
    PUT: Update an availability slot (only if owned by the doctor)
    DELETE: Remove an availability slot (only if owned by the doctor)
    """
    availability = get_object_or_404(DoctorAvailability, pk=pk)

    # ✅ Check if logged-in user owns this availability
    if request.method in ['PUT', 'DELETE']:
        if availability.doctor.user != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = DoctorAvailabilitySerializer(availability)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = DoctorAvailabilitySerializer(availability, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()  # doctor stays the same
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        availability.delete()
        return Response({'detail': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Change to AllowAny if public
def available_doctors(request):
    """
    Return all available doctor schedules in the future or today.
    Optional query params:
    - date=YYYY-MM-DD
    - day_of_week=Monday, Tuesday, etc.
    """
    date_param = request.GET.get('date', None)
    day_of_week = request.GET.get('day_of_week', None)

    today = dt_date.today()

    # ✅ Start with only today & future dates
    queryset = DoctorAvailability.objects.filter(date__gte=today)

    # ✅ Apply filters if provided
    if date_param:
        queryset = queryset.filter(date=date_param)
    if day_of_week:
        queryset = queryset.filter(day_of_week__iexact=day_of_week)

    # ✅ Sort results: earliest date first, then by start_time
    queryset = queryset.order_by('date', 'start_time')

    serializer = DoctorAvailabilitySerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Appointment
from django.utils import timezone
from datetime import datetime


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_upcoming_appointment(request):
    now = timezone.localtime()
    ten_minutes_later = now + timedelta(minutes=10)

    # Fetch the first upcoming appointment
    appointment = Appointment.objects.filter(
        user=request.user,
        date=now.date(),
        time__gte=now.time(),
        time__lte=ten_minutes_later.time(),
        is_confirmed=True,
        status='Pending'
    ).order_by('time').first()

    if appointment:
        return Response({
            "upcoming": True,
            "id": appointment.id,  # ✅ Include ID here
            "message": f"You have an appointment with Dr. {appointment.doctor.full_name} at {appointment.time.strftime('%H:%M')} today."
        })
    else:
        return Response({
            "upcoming": False,
            "message": "No upcoming appointment in the next 10 minutes."
        })



@api_view(['GET'])
def appointment_detail(request, appointment_id):
    try:
        appointment = Appointment.objects.get(pk=appointment_id)
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)
    except Appointment.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
