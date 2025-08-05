from rest_framework import serializers
from .models import VoiceNote
from account.models import CustomUser

class VoiceNoteSerializer(serializers.ModelSerializer):
    sender_email = serializers.SlugRelatedField(slug_field='email', queryset=CustomUser.objects.all(), source='sender')
    receiver_email = serializers.SlugRelatedField(slug_field='email', queryset=CustomUser.objects.all(), source='receiver')

    class Meta:
        model = VoiceNote
        fields = ['id', 'appointment', 'sender_email', 'receiver_email', 'audio_file', 'timestamp']
