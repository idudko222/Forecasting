from django.urls import path, include
from core.views import PredictAPIView, FullHistoryView
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from . import views
from django.conf.urls.static import static
from django.conf import settings
from .views import delete_history_item, generate_report
from django.contrib.auth import views as auth_views

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
    path('generate_report/', generate_report, name='generate_report'),
    path(
      'password-reset/',
      auth_views.PasswordResetView.as_view(
          template_name='email/password_reset_form.html',
          html_email_template_name='email/password_reset_email.html',
          subject_template_name='email/password_reset_subject.txt',
      ),
      name='password_reset'
      ),

    path(
      'password-reset/done/',
      auth_views.PasswordResetDoneView.as_view(
          template_name='email/password_reset_done.html'
      ),
      name='password_reset_done'
      ),
    path(
      'password-reset-confirm/<uidb64>/<token>/',
      auth_views.PasswordResetConfirmView.as_view(
          template_name='email/password_reset_confirm.html'
      ),
      name='password_reset_confirm'
      ),

    path(
      'password-reset-complete/',
      auth_views.PasswordResetCompleteView.as_view(
          template_name='email/password_reset_complete.html'
      ),
      name='password_reset_complete'
      ),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
