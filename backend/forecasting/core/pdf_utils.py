import math
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from datetime import datetime
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont



def get_building_type(type_id):
    types = {
        0: 'Другой',
        1: 'Панельный',
        2: 'Монолитный',
        3: 'Кирпичный',
        4: 'Блочный',
        5: 'Деревянный'
    }
    return types.get(type_id, 'Неизвестно')


def generate_report_pdf(user, items):
    if not items:
        raise ValueError("Нет данных для генерации отчета")

    buffer = BytesIO()

    try:
        # Регистрируем шрифты
        pdfmetrics.registerFont(TTFont('Arial', 'arial.ttf'))
        pdfmetrics.registerFont(TTFont('Arial-Bold', 'arialbd.ttf'))  # Полужирный вариант

        p = canvas.Canvas(buffer, pagesize=A4)

        # 1. Заголовок отчета
        p.setFont("Arial-Bold", 16)
        p.drawString(1 * inch, 10.5 * inch, "Отчет по истории поисков недвижимости")
        p.setFont("Arial", 12)
        p.drawString(1 * inch, 10.2 * inch, f"Пользователь: {user.username}")
        p.drawString(1 * inch, 9.9 * inch, f"Дата формирования: {datetime.now().strftime('%d.%m.%Y %H:%M')}")

        # 2. Подготовка данных таблицы
        data = [["Дата", "Параметры", "Результат"]]
        for item in items:
            params = [
                f"Комнат: {item.search_data.get('rooms', 'N/A')}",
                f"Площадь: {item.search_data.get('area', 'N/A')} м²",
                f"Кухня: {item.search_data.get('kitchen_area', 'N/A')} м²",
                f"Этаж: {item.search_data.get('level', 'N/A')}/{item.search_data.get('levels', 'N/A')}",
                f"Тип: {get_building_type(item.search_data.get('building_type', 0))}",
                f"Объект: {'Новостройка' if item.search_data.get('object_type') == 1 else 'Вторичка'}",
                f"Адрес: {item.search_data.get('address', 'N/A')}"
            ]
            data.append(
                [
                    item.created_at.strftime("%d.%m.%Y %H:%M"),
                    "\n".join(params),
                    f"{math.ceil(int(item.result / 50000)) * 50000} ₽"
                ]
            )

        # 3. Создание и настройка таблицы
        table = Table(data, colWidths=[1.2 * inch, 4 * inch, 1.5 * inch])
        table.setStyle(
            TableStyle(
                [
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#333333')),  # Темно-серый для заголовка
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Arial-Bold'),
                    ('FONTNAME', (0, 1), (-1, -1), 'Arial'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f0f0')),  # Светло-серый для строк
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),  # Тонкие черные границы
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ]
            )
        )

        # 4. Рендеринг таблицы
        table.wrapOn(p, 7 * inch, 6 * inch)
        table.drawOn(p, 1 * inch, 6 * inch)

        # 5. Подпись
        p.setFont("Arial", 8)
        p.drawString(1 * inch, 0.5 * inch, "Сгенерировано автоматически в системе оценки недвижимости")

        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer

    except Exception as e:
        buffer.close()
        raise RuntimeError(f"Ошибка при генерации PDF: {str(e)}")