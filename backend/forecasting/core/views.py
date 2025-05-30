import joblib
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictionInputSerializer
from django.contrib.auth import login
from django.views.generic import CreateView
from django.urls import reverse_lazy
from .forms import CustomRegisterForm
from .models import SearchHistory
from django.contrib.auth.views import LoginView


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

            # 4. Преобразование данных
            encoded = encoder.transform(df)
            scaled = scaler.transform(encoded)

            # 5. Предсказание
            price = model.predict(scaled)[0]

            if request.user.is_authenticated:
                SearchHistory.objects.create(
                    user=request.user,
                    search_data=request.data,
                    result=price
                )

            return Response({'price': round(price, 2)}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)

        history = SearchHistory.objects.filter(user=request.user).order_by('-created_at')
        data = [{
            'id': item.id,
            'params': {
                'rooms': item.search_data.get('rooms'),
                'area': item.search_data.get('area'),
                'building_type': self.get_building_type(item.search_data.get('building_type')),
            },
            'result': item.result,
            'date': item.created_at.strftime("%d.%m.%Y %H:%M")
        } for item in history]

        return Response(data, status=status.HTTP_200_OK)

    def get_building_type(self, type_id):
        types = {
            0: 'Другой',
            1: 'Панельный',
            2: 'Монолитный',
            3: 'Кирпичный',
            4: 'Блочный',
            5: 'Деревянный'
        }
        return types.get(type_id, 'Неизвестно')


class CustomView(LoginView):
    template_name = 'html/login.html'
    success_url = reverse_lazy('index')


class RegisterView(CreateView):
    form_class = CustomRegisterForm
    template_name = 'html/register.html'
    success_url = reverse_lazy('index')

    def form_valid(self, form):
        response = super().form_valid(form)
        login(self.request, self.object)  # Автоматический вход
        return response
