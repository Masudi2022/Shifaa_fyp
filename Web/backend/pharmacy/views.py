from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Pharmacy
from .serializers import PharmacySerializer

@api_view(['GET'])
def pharmacy_list(request):
    pharmacies = Pharmacy.objects.all()
    serializer = PharmacySerializer(pharmacies, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
