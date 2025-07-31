from rest_framework import serializers
from .models import *
from account.models import CustomUser

class AppointmentSerializer(serializers.ModelSerializer):
    # Display names in API responses
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

    # User (patient) email is read-only (always the logged-in user)
    user = serializers.SlugRelatedField(
        slug_field='email',
        read_only=True
    )

    # Doctor selected by email instead of PK
    doctor = serializers.SlugRelatedField(
        slug_field='email',
        queryset=CustomUser.objects.filter(role='Doctor')
    )

    class Meta:
        model = Appointment
        fields = [
            'id', 'user', 'user_name', 'doctor', 'doctor_name',
            'date', 'time', 'reason', 'created_at', 'is_confirmed', 'notes'
        ]
        read_only_fields = ['user', 'user_name', 'doctor_name', 'created_at', 'is_confirmed']

    def create(self, validated_data):
        request = self.context.get('request')
        # Automatically assign logged-in user
        validated_data['user'] = request.user
        return super().create(validated_data)


# -------------------- Doctor Availability Serializer --------------------
class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    doctor_email = serializers.EmailField(source='doctor.user.email', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)  # ✅ Full name
    specialization = serializers.CharField(source='doctor.specialization', read_only=True)  # ✅ Specialization

    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'doctor_email', 'doctor_name', 'specialization',
            'date', 'day_of_week', 'start_time', 'end_time', 'notes'
        ]
        read_only_fields = ['doctor', 'doctor_email', 'doctor_name', 'specialization']

    def validate(self, data):
        # Ensure end time is after start time
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError("End time must be after start time.")

        # Ensure either day_of_week or date is provided
        if not data.get('day_of_week') and not data.get('date'):
            raise serializers.ValidationError("Either 'day_of_week' or 'date' is required.")

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                doctor_instance = Doctor.objects.get(user=request.user)
                validated_data['doctor'] = doctor_instance
            except Doctor.DoesNotExist:
                raise serializers.ValidationError("This user is not registered as a doctor.")

        # Auto-fill day_of_week from date if missing
        if not validated_data.get('day_of_week') and validated_data.get('date'):
            validated_data['day_of_week'] = validated_data['date'].strftime('%A')

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                validated_data['doctor'] = Doctor.objects.get(user=request.user)
            except Doctor.DoesNotExist:
                raise serializers.ValidationError("This user is not registered as a doctor.")

        return super().update(instance, validated_data)
