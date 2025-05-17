from django.urls import path
from core.views import PredictAPIView
from django.views.generic import TemplateView
from core.views import CancelPredictionView

urlpatterns = [
    path('api/predict/', PredictAPIView.as_view(), name='predict'),
    path('', TemplateView.as_view(template_name='html/index.html'), name='index'),
    path('api/cancel-prediction/', CancelPredictionView.as_view(), name='cancel-prediction'),

]