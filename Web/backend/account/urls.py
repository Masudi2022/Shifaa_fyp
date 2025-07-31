from django.urls import path
from .views import talk_to_rasa

urlpatterns = [
    path('chat/', talk_to_rasa, name='talk_to_rasa'),
]
