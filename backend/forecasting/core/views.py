import joblib
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictionInputSerializer

# Загрузка моделей один раз при старте приложения
model = joblib.load('core/ml2/model.pkl')
encoder = joblib.load('core/ml2/encoder.pkl')
scaler = joblib.load('core/ml2/scaler.pkl')

class PredictAPIView(APIView):
    def post(self, request):
        # 1. Проверка валидности данных
        serializer = PredictionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. Подготовка данных
            input_data = serializer.validated_data
            df = pd.DataFrame([input_data])

            # 3. Расчет производных фичей
            df['level_to_levels'] = df['level'] / df['levels']
            df['area_to_rooms'] = df['area'] / df['rooms'].clip(1)
            df['room_size'] = df['area'] / df['rooms'].clip(1)
            df['is_last_floor'] = (df['level'] == df['levels']).astype(int)

            # 4. Преобразование данных
            encoded = encoder.transform(df)
            scaled = scaler.transform(encoded)

            # 5. Предсказание
            price = model.predict(scaled)[0]

            return Response({'price': round(price, 2)}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )