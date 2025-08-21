from django.urls import path, include
from diagnosis.views import *
from pharmacy.views import pharmacy_list
from account.views import RegisterView, CustomTokenObtainPairView, logout_view, update_user_profile
from rest_framework_simplejwt.views import TokenRefreshView
from appointment.views import *
from voicenote.views import *
from feedback.views import *
from rest_framework.routers import DefaultRouter
# from education.views import HealthEducationViewSet
from education.views import health_education_list, health_education_detail




urlpatterns = [
    # Chat & Session Endpoints
    path('smart-doctor/chat/', chat_with_doctor, name='chat_with_doctor'),
    path('sessions/create/', create_session, name='create_session'),
    path('sessions/device/', list_sessions, name='list_sessions_by_device'),
    path('sessions/user/', get_chat_sessions, name='list_sessions_by_user'),
    path('sessions/<str:session_id>/messages/', get_session_messages, name='get_session_messages'),

    # Pharmacy
    path('pharmacies/', pharmacy_list, name='pharmacy_list'),

    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
     path('logout/', logout_view, name='logout'),
      path('update-profile/', update_user_profile, name='update-profile'),

    path('appointment/book/', book_appointment, name='book-appointment'),
    path('my-appointments/', list_user_appointments, name='my-appointments'),
    path('doctor-appointments/', list_doctor_appointments, name='doctor-appointments'),
    path('update-status/<int:appointment_id>/', update_appointment_status, name='update-appointment-status'),
    path('appointment/<int:appointment_id>/delete/', delete_appointment, name='delete-appointment'),
    path('appointment/<int:appointment_id>/update-status/', update_appointment_status, name='update-appointment-status'),
    path('appointments/<int:appointment_id>/', appointment_detail, name='appointment-detail'),





    path('availability/', doctor_availability_list_create, name='availability-list-create'),
    path('availability/<int:pk>/', doctor_availability_detail, name='availability-detail'),
    path('availability/available-doctors/', available_doctors, name='available-doctors'),


    path('appointments/check-reminder/', check_upcoming_appointment, name='check_appointment_reminder'),

    # Voice Notes
    path('api/voice-notes/send/<int:appointment_id>/', send_voice_note_by_appointment_id, name='send_voice_note'),
    path('api/voice-notes/<int:appointment_id>/', get_voice_notes_by_appointment, name='get_voice_notes_by_appointment_id'),

    path('reports/', medical_report_view),  # GET all, POST
    path('reports/<int:report_id>/', medical_report_view),  # GET by ID, DELETE

    path('feedback/', submit_feedback),  # GET all, POST


    # path('api/elimu/', include('education.urls')),
    path('elimu/', health_education_list, name='health_education_list'),
    path('elimu/<int:pk>/', health_education_detail, name='health_education_detail'),

]






