from django.db import models
from account.models import CustomUser
from django.db.models import Q
from django.utils.translation import gettext_lazy as _      
from django.core.exceptions import ValidationError
from django.utils import timezone
from account.models import Doctor


from django.db import models
from django.conf import settings

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Ongoing', 'Ongoing'),
        ('Completed', 'Completed'),
    ]

    CONFIRMATION_CHOICES = [
        (True, 'Confirmed'),
        (False, 'Not Confirmed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='appointments', 
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'User'}
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='appointments_as_doctor', 
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'Doctor'}
    )
    date = models.DateField()
    time = models.TimeField()
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_confirmed = models.BooleanField(
        choices=CONFIRMATION_CHOICES,
        default=False
    )
    notes = models.TextField(blank=True)
    
    # ✅ New status field
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Pending', null=True, blank=True
    )

    def __str__(self):
        return f"{self.user} with Dr. {self.doctor} on {self.date} at {self.time} [{self.status}]"
  # Doctor's post-visit notes

    class Meta:
        unique_together = ['doctor', 'date', 'time']  # Avoid double bookings
        ordering = ['-date', '-time']  # Latest appointment first

    def __str__(self):
        return f"Appointment: {self.user.full_name} with Dr. {self.doctor.full_name} on {self.date} at {self.time}"
    



class DoctorAvailability(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', _('Available')
        BOOKED = 'booked', _('Booked')
        CANCELLED = 'cancelled', _('Cancelled')

    class DayOfWeek(models.TextChoices):
        MONDAY = 'Monday', _('Monday')
        TUESDAY = 'Tuesday', _('Tuesday')
        WEDNESDAY = 'Wednesday', _('Wednesday')
        THURSDAY = 'Thursday', _('Thursday')
        FRIDAY = 'Friday', _('Friday')
        SATURDAY = 'Saturday', _('Saturday')
        SUNDAY = 'Sunday', _('Sunday')

    doctor = models.ForeignKey(
        Doctor,  # or settings.AUTH_USER_MODEL if Doctor is a user model
        on_delete=models.CASCADE,
        related_name='availabilities'
    )
    day_of_week = models.CharField(
        max_length=9,
        choices=DayOfWeek.choices,
        help_text=_("Day of the week for recurring availability.")
    )
    date = models.DateField(
        null=True,
        blank=True,
        help_text=_("Optional: Use if this availability is for a specific date.")
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.AVAILABLE
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ('doctor', 'day_of_week', 'start_time')

    def __str__(self):
        label = self.date.strftime('%Y-%m-%d') if self.date else self.day_of_week
        return f"{self.doctor} - {label} ({self.start_time} to {self.end_time})"

    def clean(self):
        super().clean()
        if self.end_time <= self.start_time:
            raise ValidationError(_("End time must be after start time."))
        if not self.day_of_week and not self.date:
            raise ValidationError(_("Either a day of the week or a specific date must be provided."))


class DoctorReport(models.Model):
    appointment = models.OneToOneField(
        Appointment, 
        on_delete=models.CASCADE, 
        related_name='report'
    )
    doctor = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='written_reports'
    )
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='received_reports'
    )

    title = models.CharField(max_length=255)
    report_content = models.TextField()
    attachment = models.FileField(upload_to='reports/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report: {self.title} for {self.user.full_name}"

