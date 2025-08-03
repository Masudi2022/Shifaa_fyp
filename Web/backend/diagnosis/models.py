from django.db import models
from django.contrib.postgres.fields import ArrayField  # ✅ Correct import
from account.models import CustomUser
from django.utils.timezone import localtime

now = localtime()  # This gives time in Africa/Dar_es_Salaam

import uuid

import uuid

class ChatSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    topic = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    device_id = models.CharField(max_length=255, blank=True, null=True)
    symptoms = ArrayField(models.CharField(max_length=100), default=list, null=True)
    pending_questions = models.JSONField(default=list)
    confirmed_diseases = models.JSONField(default=list)
    eliminated_diseases = models.JSONField(default=list)

    def __str__(self):
        return f"Session {self.session_id} - {self.user.email}"


   

class Message(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    is_user = models.BooleanField(default=True)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{'User' if self.is_user else 'Bot'}: {self.text[:30]}"

class PredictedDisease(models.Model):
    session = models.OneToOneField(ChatSession, on_delete=models.CASCADE)
    disease_name = models.CharField(max_length=100)
    symptoms = models.TextField()
    recommended_tests = models.TextField()
    treatment = models.TextField()
    prevention = models.TextField()
    advice = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.disease_name
