from django.db import models
from account.models import CustomUser
from appointment.models import Appointment

class VoiceNote(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE)
    sender = models.ForeignKey(CustomUser, related_name='sent_voice_notes', on_delete=models.CASCADE)
    receiver = models.ForeignKey(CustomUser, related_name='received_voice_notes', on_delete=models.CASCADE)
    audio_file = models.FileField(upload_to='voice_notes/')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VoiceNote from {self.sender.email} to {self.receiver.email} at {self.timestamp}"
