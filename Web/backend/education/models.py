from django.db import models

class HealthEducation(models.Model):
    title = models.CharField(max_length=255)  # Kichwa cha mada
    content = models.TextField()              # Maelezo kwa undani
    category = models.CharField(max_length=100, blank=True, null=True)  # Aina (mfano: lishe, usafi, mazoezi)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Elimu ya Afya"
        verbose_name_plural = "Elimu ya Afya"

    def __str__(self):
        return self.title
