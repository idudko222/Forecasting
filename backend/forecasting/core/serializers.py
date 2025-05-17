from rest_framework import serializers

class PredictionInputSerializer(serializers.Serializer):
    geo_lat = serializers.FloatField()
    geo_lon = serializers.FloatField()
    region = serializers.CharField()
    building_type = serializers.IntegerField(min_value=0, max_value=5)
    level = serializers.IntegerField(min_value=1)
    levels = serializers.IntegerField(min_value=1)
    rooms = serializers.IntegerField(min_value=1)
    area = serializers.FloatField(min_value=10)
    kitchen_area = serializers.FloatField(min_value=6)
    object_type = serializers.IntegerField(min_value=1, max_value=2)
    year = serializers.IntegerField(min_value=2000)
    month = serializers.IntegerField(min_value=1, max_value=12)