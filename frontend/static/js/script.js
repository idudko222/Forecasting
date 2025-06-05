let currentRequest = null; // Для хранения текущего AJAX-запроса
let lastRequestTime = 0; // Для защиты от частых запросов
let map;
let placemark;

const supportedRegions = [
    'Санкт-Петербург',
    'Ленинградская область',
    'Москва',
    'Московская область',
    'Краснодарский край',
    'Нижегородская область',
    'Ростовская область',
    'Самарская область',
    'Республика Татарстан',
    'Ставропольский край',
    'Республика Башкортостан',
    'Свердловская область',
    'Республика Коми',
    'Челябинская область',
    'Иркутская область',
    'Пермский край',
    'Алтайский край',
    'Республика Бурятия',
    'Ярославская область',
    'Удмуртская Республика',
    'Псковская область',
    'Республика Северная Осетия — Алания',
    'Кемеровская область',
    'Чувашская Республика',
    'Республика Марий Эл',
    'Кабардино-Балкарская Республика',
    'Республика Мордовия',
    'Красноярский край',
    'Тюменская область',
    'Республика Хакасия',
    'Новосибирская область',
    'Воронежская область',
    'Республика Карелия',
    'Республика Дагестан',
    'Республика Саха (Якутия)',
    'Забайкальский край',
    'Республика Крым',
    'Кировская область',
    'Республика Калмыкия',
    'Республика Адыгея',
    'Карачаево-Черкесская Республика',
    'Республика Тыва',
    'Республика Ингушетия',
    'Республика Алтай',
    'Белгородская область',
    'Архангельская область',
    'Тверская область',
    'Пензенская область',
    'Ханты-Мансийский автономный округ',
    'Липецкая область',
    'Владимирская область',
    'Ямало-Ненецкий автономный округ',
    'Рязанская область',
    'Чеченская Республика',
    'Смоленская область',
    'Саратовская область',
    'Вологодская область',
    'Волгоградская область',
    'Калужская область',
    'Тульская область',
    'Тамбовская область',
    'Мурманская область',
    'Новгородская область',
    'Курская область',
    'Хабаровский край',
    'Брянская область',
    'Астраханская область',
    'Калининградская область',
    'Омская область',
    'Курганская область',
    'Томская область',
    'Ульяновская область',
    'Оренбургская область',
    'Костромская область',
    'Орловская область',
    'Камчатский край',
    'Ивановская область',
    'Амурская область',
    'Магаданская область',
    'Еврейская автономная область',
    'Приморский край',
    'Сахалинская область',
    'Ненецкий автономный округ'
];

function updateAddress(coords){
    $('#geo_lat').val(coords[0]);
    $('#geo_lon').val(coords[1]);

    ymaps.geocode(coords).then(function (res) {
        const geoObject = res.geoObjects.get(0);
        if (!geoObject) return;

        const address = res.geoObjects.get(0).getAddressLine()
        $('#address').val(address).attr('value', address);

    });
}

function updateCoordinatesAndRegion(coords) {
    $('#geo_lat').val(coords[0]);
    $('#geo_lon').val(coords[1]);

    ymaps.geocode(coords).then(function (res) {
        const geoObject = res.geoObjects.get(0);
        if (!geoObject) return;

        const region = geoObject.getAdministrativeAreas()?.[0] || '';
        $('#region').val(region).attr('value', region);

        const isSupported = supportedRegions.includes(region);

        $('#submitBtn').prop('disabled', !isSupported);

        if (!isSupported) {
            $('#submitError')
                .text('Расчёт стоимости для выбранного региона временно не поддерживается.')
                .addClass('d-block');
        } else {
            $('#submitError').text('').removeClass('d-block');
        }
    });
}


function initMap() {
    ymaps.ready(function () {
        map = new ymaps.Map('map', {
            center: [47.237394, 39.712237], // ДГТУ по умолчанию
            zoom: 12
        });

        // Создаем метку
        placemark = new ymaps.Placemark(
            [47.237394, 39.712237],
            {
                hintContent: 'Переместите меня!',
                balloonContent: 'Укажите точное местоположение объекта'
            },
            {
                draggable: true,
                preset: 'islands#redDotIcon'
            }
        );

        map.geoObjects.add(placemark);

        // Обработчик перемещения метки
        placemark.events.add('dragend', function () {
            const coords = placemark.geometry.getCoordinates();
            updateCoordinatesAndRegion(coords);
            updateAddress(coords);
        });

        // Обработчик клика по карте
        map.events.add('click', function (e) {
            const coords = e.get('coords');
            placemark.geometry.setCoordinates(coords);
            updateCoordinatesAndRegion(coords);
            updateAddress(coords);
        });
    });
}

function updateMapCoordinates(lat, lon) {
    if (!map || !placemark) return;

    const newCoords = [parseFloat(lat), parseFloat(lon)];

    // Обновляем позицию метки
    placemark.geometry.setCoordinates(newCoords);

    // Центрируем карту на новой позиции
    map.setCenter(newCoords, 15); // 15 - уровень зума

    // Обновляем скрытые поля формы
    $('#geo_lat').val(lat);
    $('#geo_lon').val(lon);

    // Получаем адрес по координатам
    updateAddressByCoords(newCoords);
}

function updateAddressByCoords(coords) {
    ymaps.geocode(coords).then(function (res) {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
            const region = firstGeoObject.getAdministrativeAreas()?.[0] || '';
            $('#region').val(region);
        }
    });
}

function getBuildingTypeName(typeId) {
    const types = {
        0: 'Другой',
        1: 'Панельный',
        2: 'Монолитный',
        3: 'Кирпичный',
        4: 'Блочный',
        5: 'Деревянный'
    };
    return types[typeId] || 'Неизвестно';
}

function loadHistory() {
    $.ajax({
        url: '/api/predict/',
        type: 'GET',
        success: function (data) {
            const container = $('#historyList');
            container.empty();

            const lastFiveItems = data.slice(0, 3);

            if (lastFiveItems.length === 0) {
                container.append('<div class="text-muted" style="margin-bottom: 60px; padding-top: 30px; text-align: center">История запросов пуста</div>');
                return;
            }

             lastFiveItems.forEach(item => {
                container.append(`
                    <div class="history-item" data-id="${item.id}" 
                         data-bs-toggle="tooltip" 
                         data-bs-placement="right"
                         data-bs-title="
                            Регион: ${item.params.region}<br>
                            Комнат: ${item.params.rooms}<br>
                            Площадь: ${item.params.area} м²<br>
                            Кухня: ${item.params.kitchen_area} м²<br>
                            Этаж: ${item.params.level}/${item.params.levels}<br>
                            Тип здания: ${getBuildingTypeName(item.params.building_type)}<br>
                            Тип объекта: ${item.params.object_type === 1 ? 'Новостройка' : 'Вторичка'}<br>
                            Дата: ${item.date}
                         ">
                        <div class="history-params">
                           ${item.params.region}, ${item.params.rooms}-к, ${item.params.area}м², ${getBuildingTypeName(item.params.building_type)}
                        </div>
                        <div class="history-result">
                           ${new Intl.NumberFormat('ru-RU').format(Math.round(item.result / 50000) * 50000)} ₽
                        </div>
                        <div class="history-date">
                            ${item.date}
                        </div>
                    </div>
                `);
            });

            // Инициализация tooltip только на десктопах
            if (window.innerWidth > 768) {
                $('[data-bs-toggle="tooltip"]').tooltip({
                    html: true,
                    sanitize: false
                });
            }

            // Обработчик клика для повтора запроса
            $('.history-item').click(function () {
                const itemId = $(this).data('id');
                const item = data.find(i => i.id == itemId);
                fillFormFromHistory(item.params);
            });
        },
        error: function () {
            $('#historyList').html('<div class="text-danger">Ошибка загрузки истории</div>');
        }
    });
}

$(window).resize(function () {
    if (window.innerWidth <= 768) {
        $('[data-bs-toggle="tooltip"]').tooltip('dispose');
    } else {
        $('[data-bs-toggle="tooltip"]').tooltip({
            html: true,
            sanitize: false
        });
    }
});


// Загружаем историю при загрузке страницы и после каждого успешного прогноза
$(document).ready(function () {
    // Инициализация с координатами по умолчанию
    updateMapCoordinates($('#geo_lat').val(), $('#geo_lon').val());

    $('[data-bs-toggle="tooltip"]').tooltip({
        html: true,
        sanitize: false,
        placement: 'right',
    });
    loadHistory();
    initMap();
});


// Обработчик формы
$(document).ready(function () {
    $('#predictionForm').submit(function (e) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastRequestTime < 3000) {
            $('#submitError').text('Пожалуйста, подождите 3 секунды перед повторным запросом').addClass('d-block');
            return;
        }
        lastRequestTime = now;

        if ($('#submitBtn').prop('disabled')) {
            return; // Блокируем отправку, если регион не поддерживается
        }

        const $submitBtn = $('#submitBtn');
        const $spinner = $('#loadingSpinner');


        // Блокировка UI
        $submitBtn.prop('disabled', true);
        $spinner.removeClass('d-none');
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
            month: parseInt($('#month').val()),
            address: ($('#address').val()),
        };

        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith(name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;

        }

        // Создаем и сохраняем запрос
        currentRequest = $.ajax({
            url: '/api/predict/',
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken') // Добавляем CSRF-токен
            },
            data:
                JSON.stringify(formData),
            beforeSend:

                function (jqXHR) {
                    currentRequest = jqXHR;
                }

            ,
            success: function (response) {
                // Исходная сумма
                let price = response.price;
                // Округление вверх до ближайших 50 000
                // let roundedPrice = Math.ceil(price / 50000) * 50000;
                $('#price').text(new Intl.NumberFormat('ru-RU').format(price) + ' ₽');
                $('#result').removeClass('d-none');
                loadHistory();

            }
            ,
            error: function (xhr) {
                if (xhr.statusText !== 'abort') { // Не показываем ошибку при отмене
                    $('#submitError').text(xhr.responseJSON?.detail || 'Ошибка сервера').addClass('d-block');
                }
            }
            ,
            complete: function () {
                $submitBtn.prop('disabled', false);
                $spinner.addClass('d-none');
                currentRequest = null;
            }
        })
        ;
    });
});

// Функция для заполнения формы из истории
function fillFormFromHistory(params) {
    $('#rooms').val(params.rooms);
    $('#area').val(params.area);
    $('#building_type').val(params.building_type);
    $('#kitchen_area').val(params.kitchen_area);
    $('#levels').val(params.levels);
    $('#level').val(params.level);
    $('#object_type').val(params.object_type || 1);

    if (params.geo_lat && params.geo_lon) {
        updateMapCoordinates(params.geo_lat, params.geo_lon);
    }

    // Обновляем регион, если он есть
    if (params.region) {
        $('#region').val(params.region);
    }

    // Прокручиваем к форме
    $('html, body').animate({
        scrollTop: $('#predictionForm').offset().top - 20
    }, 200);
}