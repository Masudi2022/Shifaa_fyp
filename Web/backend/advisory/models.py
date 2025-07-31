# models.py in your app (e.g., health)

from django.db import models

class DiseaseEntry(models.Model):
    dalili = models.TextField()       # symptoms (comma-separated)
    ugonjwa = models.CharField(max_length=255)
    vipimo = models.TextField(blank=True, null=True)     # tests
    tiba = models.TextField(blank=True, null=True)       # treatment
    kinga = models.TextField(blank=True, null=True)      # prevention
    ushauri = models.TextField(blank=True, null=True)    # advice

    def __str__(self):
        return self.ugonjwa
