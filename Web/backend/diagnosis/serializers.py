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
from rest_framework import serializers
from .models import MedicalReport
from rest_framework import serializers
from .models import MedicalReport

class MedicalReportSerializer(serializers.ModelSerializer):
    pdf = serializers.SerializerMethodField()  # Returns full URL

    class Meta:
        model = MedicalReport
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

    def get_pdf(self, obj):
        request = self.context.get('request')  # Get current request
        if obj.pdf:
            if request:
                return request.build_absolute_uri(obj.pdf.url)  # Full URL
            return obj.pdf.url  # Fallback: relative URL
        return None

    def create(self, validated_data):
        # user is already being passed in from view: serializer.save(user=request.user)
        return super().create(validated_data)
