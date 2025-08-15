from django.db import models
from account.models import *


class Feedback(models.Model):
    RATING_CHOICES = [
        (1, "⭐ Poor"),
        (2, "⭐⭐ Fair"),
        (3, "⭐⭐⭐ Good"),
        (4, "⭐⭐⭐⭐ Very Good"),
        (5, "⭐⭐⭐⭐⭐ Excellent"),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    title = models.CharField(max_length=255, help_text="Short title for your feedback")
    message = models.TextField(help_text="Describe your experience with our service")
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.rating} Stars"
