from django import template

register = template.Library()

@register.filter
def translate_param(key):
    translations = {
        'building_type': 'Тип здания',
        'object_type': 'Тип объекта',
        'rooms': 'Комнат',
        'area': 'Площадь (м²)',
        'kitchen_area': 'Площадь кухни (м²)',
        'level': 'Этаж',
        'levels': 'Этажей в доме',
        'region': 'Регион',
        'geo_lat': 'Широта',
        'geo_lon': 'Долгота',
        'year': 'Год',
        'month': 'Месяц'
    }
    return translations.get(key, key)