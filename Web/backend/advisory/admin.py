from django.contrib import admin
from .models import *

@admin.register(DiseaseEntry)
class DiseaseEntryAdmin(admin.ModelAdmin):
    list_display = ('ugonjwa',)
    search_fields = ('ugonjwa', 'dalili')
