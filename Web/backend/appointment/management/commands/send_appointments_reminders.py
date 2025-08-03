# appointments/management/commands/send_appointment_reminders.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from appointment.models import Appointment
from django.core.mail import send_mail

class Command(BaseCommand):
    help = 'Send email reminders for upcoming appointments 10 minutes before they start.'

    def handle(self, *args, **kwargs):
        now = timezone.localtime()
        ten_minutes_later = now + timedelta(minutes=10)

        # Match appointments that start exactly in 10 minutes
        appointments = Appointment.objects.filter(
            date=ten_minutes_later.date(),
            time__hour=ten_minutes_later.hour,
            time__minute=ten_minutes_later.minute,
            is_confirmed=True,
            status='Pending'
        )

        self.stdout.write("🔍 Checking for upcoming appointments 10 minutes ahead...")

        if not appointments.exists():
            self.stdout.write("✅ No matching appointments found.")
            return

        for appt in appointments:
            user_email = appt.user.email
            doctor_email = appt.doctor.email
            time_str = appt.time.strftime('%H:%M')

            # Send email to user
            send_mail(
                subject="⏰ Appointment Reminder",
                message=f"Hi {appt.user.full_name},\n\nThis is a reminder of your appointment with Dr. {appt.doctor.full_name} at {time_str} today.",
                from_email="noreply@yourdomain.com",
                recipient_list=[user_email],
                fail_silently=False,
            )

            # Send email to doctor
            send_mail(
                subject="⏰ Appointment Reminder",
                message=f"Dear Dr. {appt.doctor.full_name},\n\nYou have an upcoming appointment with {appt.user.full_name} at {time_str} today.",
                from_email="noreply@gmail.com",
                recipient_list=[doctor_email],
                fail_silently=False,
            )

        self.stdout.write(self.style.SUCCESS(f"✅ Sent {appointments.count()} reminder(s)."))
