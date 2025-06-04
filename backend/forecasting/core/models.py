from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver



class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    search_data = models.JSONField()
    result = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    is_favorite = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"

    def get_summary(self):
        """Краткое описание запроса для отображения в истории"""
        data = self.search_data
        return (
            f"{data.get('rooms', '?')}-к, {data.get('area', '?')}м², "
            f"{data.get('building_type', '?')}, {self.result}₽"
        )

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True, blank=False, null=False)

    def __str__(self):
        return f'Профиль {self.user}'

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()