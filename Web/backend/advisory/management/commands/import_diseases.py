# backend/management/commands/import_diseases.py

from django.core.management.base import BaseCommand
import csv
from advisory.models import DiseaseEntry

class Command(BaseCommand):
    help = 'Import diseases from a CSV file into the DiseaseEntry model'

    def add_arguments(self, parser):
        parser.add_argument('csv_path', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        csv_path = options['csv_path']
        imported_count = 0

        try:
            with open(csv_path, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    DiseaseEntry.objects.create(
                        dalili=row.get('Dalili', ''),
                        ugonjwa=row.get('Ugonjwa', ''),
                        vipimo=row.get('Vipimo', ''),
                        tiba=row.get('Tiba', ''),
                        kinga=row.get('Kinga', ''),
                        ushauri=row.get('Ushauri', '')
                    )
                    imported_count += 1

            self.stdout.write(self.style.SUCCESS(f'✅ Successfully imported {imported_count} diseases.'))

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f'❌ File not found: {csv_path}'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'❌ Error occurred: {str(e)}'))
