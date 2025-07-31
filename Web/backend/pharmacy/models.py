from django.db import models
from account.models import CustomUser as User

class Pharmacy(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pharmacies')  # Owner of the pharmacy
    name = models.CharField(max_length=255, unique=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    region = models.CharField(max_length=255)
    details = models.TextField(blank=True)

    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=512, blank=True)
    
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='pharmacy_logos/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.region})"

