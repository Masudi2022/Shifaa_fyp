from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import HealthEducation
from .serializers import HealthEducationSerializer

# 📌 List all or create new
@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # require token
def health_education_list(request):
    if request.method == 'GET':
        items = HealthEducation.objects.all()
        serializer = HealthEducationSerializer(items, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HealthEducationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 📌 Retrieve, update, or delete
@api_view(['GET', 'PUT', 'DELETE'])
# @permission_classes([IsAuthenticated])
def health_education_detail(request, pk):
    try:
        item = HealthEducation.objects.get(pk=pk)
    except HealthEducation.DoesNotExist:
        return Response({'error': 'Haipo'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = HealthEducationSerializer(item)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = HealthEducationSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
