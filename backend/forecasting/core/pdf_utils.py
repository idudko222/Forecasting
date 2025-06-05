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
        pdfmetrics.registerFont(TTFont('Arial-Bold', 'arialbd.ttf'))

        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # 1. Заголовок отчета (на каждой странице)
        def draw_header():
            p.setFont("Arial-Bold", 16)
            p.drawString(1 * inch, height - 1 * inch, "Отчет по истории поисков недвижимости")
            p.setFont("Arial", 12)
            p.drawString(1 * inch, height - 1.3 * inch, f"Пользователь: {user.username}")
            p.drawString(
                1 * inch, height - 1.6 * inch, f"Дата формирования: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
                )

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

        # 3. Настройки таблицы
        col_widths = [1.2 * inch, 4 * inch, 1.5 * inch]
        row_height = 0.25 * inch
        header_rows = 1
        margin = 1 * inch
        available_height = height - 2.5 * inch  # Учитываем заголовок и подпись

        # 4. Разбиение данных на страницы
        current_row = 0
        total_rows = len(data)

        while current_row < total_rows:
            # Рисуем заголовок страницы
            draw_header()

            # Рассчитываем сколько строк поместится на текущей странице
            remaining_space = available_height
            rows_on_page = 0

            # Проверяем сколько строк поместится
            for i in range(current_row, total_rows):
                # Оцениваем высоту строки (базовая высота + дополнительные строки в параметрах)
                param_lines = len(data[i][1].split('\n')) if i > 0 else 1
                needed_height = max(1, param_lines - 3) * row_height + row_height

                if remaining_space - needed_height < 0:
                    break
                remaining_space -= needed_height
                rows_on_page += 1

            if rows_on_page == 0:
                rows_on_page = 1  # Хотя бы одна строка

            # Создаем таблицу для текущей страницы
            page_data = data[:header_rows] + data[current_row:current_row + rows_on_page]
            table = Table(page_data, colWidths=col_widths)

            # Стиль таблицы
            table.setStyle(
                TableStyle(
                    [
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#333333')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Arial-Bold'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Arial'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f0f0')),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f0f0f0'), colors.white]),
                    ]
                )
            )

            # Рендерим таблицу
            table.wrapOn(p, width - 2 * margin, height)
            table.drawOn(p, margin, height - 2.5 * inch - (available_height - remaining_space))

            # Подпись на каждой странице
            p.setFont("Arial", 8)
            p.drawString(margin, 0.5 * inch, "Сгенерировано автоматически в системе оценки недвижимости")

            current_row += rows_on_page
            if current_row < total_rows:
                p.showPage()

        p.save()
        buffer.seek(0)
        return buffer

    except Exception as e:
        buffer.close()
        raise RuntimeError(f"Ошибка при генерации PDF: {str(e)}")