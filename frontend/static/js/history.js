ymaps.ready(function () {
    console.log("ymaps.ready() вызван"); // Проверка, что API инициализировано
    $('tr[data-lat]').each(function () {
        const $row = $(this);
        const lat = $row.data('lat');
        const lon = $row.data('lon');


        if (lat && lon) {
            // Проверка, есть ли ymaps.geocode
            if (typeof ymaps.geocode !== 'function') {
                console.error('ymaps.geocode не является функцией');
                return;
            }

            ymaps.geocode([lat, lon]).then(function (res) {

                if (res.geoObjects.get(0)) {
                    const address = res.geoObjects.get(0).getAddressLine();

                    $row.find('.params-grid').append(`
                    <div class="param-item">
                        <span class="param-name">Адрес:</span>
                        <span class="param-value">${address}</span>
                    </div>
                `);
                } else {
                    console.warn("Геообъекты не найдены для координат:", lat, lon);
                }
            }, function (error) {
                console.error("Ошибка при вызове geocode:", error);
            });
        } else {
            console.warn("Координаты отсутствуют или некорректны:", lat, lon);
        }
    });
});

// Обработчик удаления записи
$(document).on('click', '.delete-history', function () {
    const itemId = $(this).data('id');
    const $row = $(this).closest('tr');

    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        $.ajax({
            url: `/api/history/${itemId}/delete/`,
            type: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function () {
                $row.fadeOut(300, function () {
                    $(this).remove();
                    if ($('tbody tr').length === 0) {
                        $('tbody').append('<tr><td colspan="4" class="text-center py-4">История поиска пуста</td></tr>');
                    }
                });
            },
            error: function (xhr) {
                alert('Ошибка при удалении: ' + xhr.responseText);
            }
        });
    }
});

// Функция для получения CSRF токена
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

function sortFavoritesFirst() {
    const tbody = $('table tbody');
    const rows = tbody.find('tr').get();

    rows.sort((a, b) => {
        const aFav = $(a).find('.favorite-btn').data('favorite') === 'True';
        const bFav = $(b).find('.favorite-btn').data('favorite') === 'True';
        return (aFav === bFav) ? 0 : aFav ? -1 : 1;
    });

    tbody.empty().append(rows);
}

// Функция для фильтрации - только избранные
function filterFavoritesOnly(showOnlyFavorites) {
    $('table tbody tr').each(function () {
        const isFavorite = $(this).find('.favorite-btn').data('favorite') === 'True';
        $(this).toggle(!showOnlyFavorites || isFavorite);
    });
}

// Инициализация при загрузке страницы
$(document).ready(function () {
    sortFavoritesFirst();

    // Обработчик переключателя
    $('#showFavoritesOnly').change(function () {
        filterFavoritesOnly(this.checked);
    });
});

$(document).on('click', '.favorite-btn', function() {
    const button = $(this);
    const itemId = button.data('id');
    const currentFavorite = button.data('favorite') === 'True';

    $.ajax({
        url: `/toggle_favorite/${itemId}/`,
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({is_favorite: !currentFavorite}),
        success: function(data) {
            if (data.success) {
                // Обновляем данные кнопки
                button.data('favorite', data.is_favorite);
                button.attr('data-favorite', data.is_favorite);

                // Меняем только иконку
                const starIcon = button.find('i');
                if (data.is_favorite) {
                    starIcon.removeClass('bi-star').addClass('bi-star-fill');
                } else {
                    starIcon.removeClass('bi-star-fill').addClass('bi-star');
                }

                // Сортировка и фильтрация
                sortFavoritesFirst();
                if ($('#showFavoritesOnly').is(':checked')) {
                    filterFavoritesOnly(true);
                }
            }
        },
        error: function(xhr) {
            console.error("Ошибка при обновлении избранного:", xhr.responseText);
        }
    });
});