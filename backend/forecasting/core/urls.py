from django.urls import path, include
from core.views import PredictAPIView, FullHistoryView
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from . import views
from django.conf.urls.static import static
from django.conf import settings
from .views import delete_history_item

urlpatterns = [
    path('api/predict/', PredictAPIView.as_view(), name='predict'),
    path('', TemplateView.as_view(template_name='html/index.html'), name='index'),
    path('api/drf-auth/', include('rest_framework.urls')),
    path('api/drf-auth/login_list/', views.CustomView.as_view(), name='login'),
    path('api/drf-auth/register_list/', views.RegisterView.as_view(), name='register'),
    path('api/drf-auth/logout/', LogoutView.as_view(), name='logout'),
    path('history/', FullHistoryView.as_view(), name='history'),
    path('api/history/<int:item_id>/delete/', delete_history_item, name='delete_history_item'),
    path('toggle_favorite/<int:item_id>/', views.toggle_favorite, name='toggle_favorite'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
