from django.db import models
from django.contrib.auth.models import User

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

