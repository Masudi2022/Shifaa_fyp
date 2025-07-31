from rest_framework import serializers
from .models import Pharmacy
from account.models import CustomUser as User

class PharmacySerializer(serializers.ModelSerializer):
    owner = serializers.SlugRelatedField(slug_field='email', queryset=User.objects.all())

    class Meta:
        model = Pharmacy
        fields = '__all__'
