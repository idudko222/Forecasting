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