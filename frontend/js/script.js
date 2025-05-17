let currentRequest = null; // Для хранения текущего AJAX-запроса
let lastRequestTime = 0; // Для защиты от частых запросов

function initMap() {
    ymaps.ready(function () {
        const map = new ymaps.Map('map', {
            center: [45.091628, 38.901597], // Краснодар по умолчанию
            zoom: 12
        });

        // Создаем метку
        const placemark = new ymaps.Placemark(
            [45.091628, 38.901597],
            {
                hintContent: 'Переместите меня!',
                balloonContent: 'Укажите точное местоположение объекта'
            },
            {
                draggable: true,
                preset: 'islands#redDotIcon'
            }
        );

        // Анимация для привлечения внимания
        placemark.events.add('mouseenter', function () {
            placemark.options.set('preset', 'islands#greenDotIcon');
        });

        placemark.events.add('mouseleave', function () {
            placemark.options.set('preset', 'islands#redDotIcon');
        });


        map.geoObjects.add(placemark);

        // Обработчик перемещения метки
        placemark.events.add('dragend', function (e) {
            const coords = placemark.geometry.getCoordinates();
            $('#geo_lat').val(coords[0]);
            $('#geo_lon').val(coords[1]);
        });

        // Обработчик клика по карте
        map.events.add('click', function (e) {
            const coords = e.get('coords');
            placemark.geometry.setCoordinates(coords);
            $('#geo_lat').val(coords[0]);
            $('#geo_lon').val(coords[1]);
        });
    });
}

// Вызов инициализации карты
initMap();

// Обработчик формы (обновленный)
$(document).ready(function () {
    $('#predictionForm').submit(function (e) {
        e.preventDefault();

        // Отменяем предыдущий запрос, если есть
        if (currentRequest) {
            currentRequest.abort();
        }

        const now = Date.now();
        if (now - lastRequestTime < 3000) {
            $('#submitError').text('Пожалуйста, подождите 3 секунды перед повторным запросом').addClass('d-block');
            return;
        }
        lastRequestTime = now;

        const $submitBtn = $('#submitBtn');
        const $spinner = $('#loadingSpinner');
        const $cancelBtn = $('#cancelBtn'); // Добавим эту кнопку в HTML

        // Блокировка UI
        $submitBtn.prop('disabled', true);
        $spinner.removeClass('d-none');
        $cancelBtn.removeClass('d-none');
        $('#submitError').text('').removeClass('d-block');


        const formData = {
            geo_lat: parseFloat($('#geo_lat').val()),
            geo_lon: parseFloat($('#geo_lon').val()),
            region: $('#region').val(),
            building_type: parseInt($('#building_type').val()),
            level: parseInt($('#level').val()),
            levels: parseInt($('#levels').val()),
            rooms: parseInt($('#rooms').val()),
            area: parseFloat($('#area').val()),
            kitchen_area: parseFloat($('#kitchen_area').val()),
            object_type: parseInt($('#object_type').val()),
            year: parseInt($('#year').val()),
            month: parseInt($('#month').val())
        };

        // Создаем и сохраняем запрос
        currentRequest = $.ajax({
            url: '/api/predict/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            beforeSend: function (jqXHR) {
                currentRequest = jqXHR;
            },
            success: function (response) {
                $('#price').text(new Intl.NumberFormat('ru-RU').format(response.price) + ' ₽');
                $('#result').removeClass('d-none');
            },
            error: function (xhr) {
                if (xhr.statusText !== 'abort') { // Не показываем ошибку при отмене
                    $('#submitError').text(xhr.responseJSON?.detail || 'Ошибка сервера').addClass('d-block');
                }
            },
            complete: function () {
                $submitBtn.prop('disabled', false);
                $spinner.addClass('d-none');
                $cancelBtn.addClass('d-none');
                currentRequest = null;
            }
        });
    });

    // Добавьте этот обработчик для кнопки отмены
    $('#cancelBtn').click(function () {
        if (currentRequest) {
            currentRequest.abort();
            // Отправляем запрос на отмену обработки на сервере
            $.get('/api/cancel-prediction/');

            $('#submitError').text('Запрос отменен').addClass('d-block');
            $('#submitBtn').prop('disabled', false);
            $('#loadingSpinner').addClass('d-none');
            $(this).addClass('d-none');
            currentRequest = null;
        }
    });
});