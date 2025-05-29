from django.urls import path, include
from core.views import PredictAPIView
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('api/predict/', PredictAPIView.as_view(), name='predict'),
    path('', TemplateView.as_view(template_name='html/index.html'), name='index'),
    path('api/drf-auth/', include('rest_framework.urls')),
    path('api/drf-auth/login_list/', views.CustomLoginView.as_view(), name='login'),
    path('api/drf-auth/register_list/', views.RegisterView.as_view(), name='register'),
    path('api/drf-auth/logout/', LogoutView.as_view(), name='logout'),
]
