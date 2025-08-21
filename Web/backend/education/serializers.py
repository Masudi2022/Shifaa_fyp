from rest_framework import serializers
from .models import HealthEducation

class HealthEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthEducation
        fields = ['id', 'title', 'content', 'category', 'created_at']
