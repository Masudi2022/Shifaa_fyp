from rest_framework import serializers
from .models import *
from account.models import *

class FeedbackSerializer(serializers.ModelSerializer):

    user = serializers.SlugRelatedField(slug_field='email', queryset=CustomUser.objects.all())
    class Meta:
        model = Feedback
        fields = "__all__"
