from django.urls import path
from core.views import PredictAPIView
from django.views.generic import TemplateView

urlpatterns = [
    path('api/predict/', PredictAPIView.as_view(), name='predict'),
    path('', TemplateView.as_view(template_name='html/index.html'), name='index'),
]
