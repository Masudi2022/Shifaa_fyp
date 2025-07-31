from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import joblib

# Load model and vectorizer once
model = joblib.load('ml_model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

@api_view(['POST'])
def predict_disease(request):
    symptoms = request.data.get('dalili', '')
    if not symptoms:
        return Response({"error": "Missing 'dalili' in request"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        X = vectorizer.transform([symptoms])
        prediction = model.predict(X)[0]
        return Response({"predicted_ugonjwa": prediction})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
