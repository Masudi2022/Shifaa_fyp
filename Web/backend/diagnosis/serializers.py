from rest_framework import serializers
from .models import *
from account.models import CustomUser

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class PredictedDiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictedDisease
        fields = '__all__'

class ChatSessionSerializer(serializers.ModelSerializer):
    user = serializers.SlugRelatedField(
        slug_field='email', queryset=CustomUser.objects.all(),
        required=False, allow_null=True
    )
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = ChatSession
        fields = '__all__'





class MedicalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalReport
        fields = '__all__'


