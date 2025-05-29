import shap
import joblib
import matplotlib.pyplot as plt
import io
import numpy as np
import base64
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictionInputSerializer
from django.http import JsonResponse

# Загрузка моделей один раз при старте приложения
model = joblib.load('core/ml/model.pkl')
encoder = joblib.load('core/ml/encoder.pkl')
scaler = joblib.load('core/ml/scaler.pkl')


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
            print(df.columns)

            # 4. Преобразование данных
            encoded = encoder.transform(df)
            scaled = scaler.transform(encoded)

            # 5. Предсказание
            price = model.predict(scaled)[0]

            feature_names_ru = ['Широта', 'Долгота', 'Регион', 'Тип объекта', 'Тип здания', 'Этаж', 'Общее количество этажей', 'Количество комнат',
                                'Площадь', 'Площадь кухни', 'Год', 'Месяц', 'Отношение уровня к этажам',
                                'Отношение площади к комнатам', 'Размер комнаты', 'Последний этаж']

            df.columns = feature_names_ru

            # 6. Объяснение SHAP
            shap_img_base64 = explain_prediction(scaled, feature_names_ru)

            # 7. Возврат результата и графика
            return Response(
                {
                    'price': round(price, 2),
                    'shap_image': shap_img_base64
                }, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def explain_prediction(input_data, feature_names):
    # Создаем объяснитель для KernelExplainer
    explainer = shap.KernelExplainer(model.predict, np.zeros((1, input_data.shape[1])))
    shap_values = explainer.shap_values(input_data, nsamples=100)  # или больше
    print('Я обновился')
    # Визуализация
    shap.summary_plot(shap_values, input_data, feature_names=feature_names,show=False)
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return img_base64
