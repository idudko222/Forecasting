import joblib
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictionInputSerializer

class PredictAPIView(APIView):
    abort_flag = False  # Классовая переменная для флага отмены

    def post(self, request):
        # Сбрасываем флаг отмены при новом запросе
        self.__class__.abort_flag = False

        # 1. Проверка валидности данных
        serializer = PredictionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. Проверка отмены перед загрузкой моделей
            # На эту хуйню не обращай внимание, это просто обработчик ошибок и он там везде
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            # 3. Загрузка артефактов
            model = joblib.load('core/ml/model.pkl')
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            encoder = joblib.load('core/ml/encoder.pkl')
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            scaler = joblib.load('core/ml/scaler.pkl')
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            # 4. Подготовка данных
            input_data = serializer.validated_data
            df = pd.DataFrame([input_data])
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            # 5. Расчет производных фичей
            df['level_to_levels'] = df['level'] / df['levels']
            df['area_to_rooms'] = df['area'] / df['rooms'].clip(1)
            df['room_size'] = df['area'] / df['rooms'].clip(1)
            df['is_last_floor'] = (df['level'] == df['levels']).astype(int)

            # 6. Преобразование данных
            encoded = encoder.transform(df)
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            scaled = scaler.transform(encoded)
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            # 7. Предсказание
            price = model.predict(scaled)[0]
            if self.__class__.abort_flag:
                return Response({'error': 'Request cancelled'}, status=499)

            return Response({'price': round(price, 2)}, status=status.HTTP_200_OK)

        except Exception as e:
            # Игнорируем ошибки, если запрос был отменен
            if not self.__class__.abort_flag:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            return Response({'error': 'Request cancelled'}, status=499)


class CancelPredictionView(APIView):
    def get(self, request):
        # Устанавливаем флаг отмены для всех текущих запросов
        PredictAPIView.abort_flag = True
        return Response({'status': 'cancellation requested'}, status=status.HTTP_200_OK)