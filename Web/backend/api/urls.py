from django.urls import path
from diagnosis.views import (
    chat_with_doctor,
    create_session,
    list_sessions,
    get_session_messages,
    get_chat_sessions
)
from pharmacy.views import pharmacy_list
from account.views import RegisterView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from appointment.views import *

urlpatterns = [
    # Chat & Session Endpoints
    path('chat/', chat_with_doctor, name='chat_with_doctor'),
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

    path('appointment/book/', book_appointment, name='book-appointment'),
    path('my-appointments/', list_user_appointments, name='my-appointments'),
    path('doctor-appointments/', list_doctor_appointments, name='doctor-appointments'),
    path('update-status/<int:appointment_id>/', update_appointment_status, name='update-appointment-status'),
    path('appointment/<int:appointment_id>/delete/', delete_appointment, name='delete-appointment'),
    path('appointment/<int:appointment_id>/update-status/', update_appointment_status, name='update-appointment-status'),




    path('availability/', doctor_availability_list_create, name='availability-list-create'),
    path('availability/<int:pk>/', doctor_availability_detail, name='availability-detail'),
    path('availability/available-doctors/', available_doctors, name='available-doctors'),
]



