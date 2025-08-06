from rest_framework import serializers
from .models import VoiceNote

class VoiceNoteSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.date', read_only=True)
    appointment_time = serializers.TimeField(source='appointment.time', read_only=True)
    doctor_name = serializers.CharField(source='appointment.doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='appointment.user.full_name', read_only=True)
    audio_file_url = serializers.SerializerMethodField()

    class Meta:
        model = VoiceNote
        fields = [
            'id',
            'appointment',
            'appointment_date',
            'appointment_time',
            'doctor_name',
            'patient_name',
            'sender_email',
            'sender_name',
            'receiver_email',
            'receiver_name',
            'audio_file',
            'audio_file_url',
            'timestamp',
        ]

    def get_audio_file_url(self, obj):
        request = self.context.get('request')
        if obj.audio_file and request:
            return request.build_absolute_uri(obj.audio_file.url)
        return None
