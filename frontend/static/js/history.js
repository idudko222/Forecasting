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
    let hasFavorites = false;

    $('table tbody tr').each(function () {
        // Пропускаем строку с сообщением
        if ($(this).find('td').text().includes('Нет избранных записей')) {
            $(this).remove();
            return;
        }

        // Проверяем наличие иконки заполненной звезды
        const isFavorite = $(this).find('.bi-star-fill').length > 0;
        $(this).toggle(!showOnlyFavorites || isFavorite);

        if (isFavorite) hasFavorites = true;
    });

    // Добавляем сообщение, если нет избранных и фильтр активен
    if (showOnlyFavorites && !hasFavorites) {
        $('table tbody').append('<tr><td colspan="4" class="text-center py-4">Нет избранных записей</td></tr>');
    }

    $('table tbody tr:hidden').find('.report-checkbox').prop('checked', false).trigger('change');
}

// Инициализация при загрузке страницы
$(document).ready(function () {
    sortFavoritesFirst();

    const showOnlyFavorites = $('#showFavoritesOnly').is(':checked');
    filterFavoritesOnly(showOnlyFavorites);

    // Обработчик переключателя
    $('#showFavoritesOnly').change(function () {
        filterFavoritesOnly(this.checked);
    });
});

$(document).on('click', '.favorite-btn', function () {
    const button = $(this);
    const itemId = button.data('id');
    const isCurrentlyFavorite = button.find('.bi-star-fill').length > 0;
    const showOnlyFavorites = $('#showFavoritesOnly').is(':checked');

    $.ajax({
        url: `/toggle_favorite/${itemId}/`,
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({is_favorite: !isCurrentlyFavorite}),
        success: function (data) {
            if (data.success) {
                // Переключаем иконку
                const starIcon = button.find('i');
                starIcon.toggleClass('bi-star bi-star-fill');

                // Переключаем классы кнопки
                button.toggleClass('btn-outline-secondary btn-outline-warning');

                // Сортировка
                sortFavoritesFirst();

                // Применяем текущий фильтр
                if (showOnlyFavorites) {
                    filterFavoritesOnly(true);
                }

                // Удаляем сообщение "Нет избранных записей"
                $('table tbody tr').filter(':contains("Нет избранных записей")').remove();
            }
        },
        error: function (xhr) {
            console.error("Ошибка при обновлении избранного:", xhr.responseText);
        }
    });
});


$(document).ready(function () {
    // Ключ для хранения в sessionStorage
    const STORAGE_KEY = 'selected_history_items';

    // Восстановление выбранных элементов
    function getSelectedIds() {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    }

    // Сохранение выбранных элементов
    function saveSelectedIds(ids) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        updateGenerateReportBtn();
    }

    // Обновление состояния кнопки "Создать отчет"
    function updateGenerateReportBtn() {
        const selectedIds = getSelectedIds();
        $('#generateReportBtn').prop('disabled', selectedIds.length === 0);
    }

    // При загрузке страницы восстанавливаем выбранные элементы
    const selectedIds = getSelectedIds();
    selectedIds.forEach(id => {
        $(`.report-checkbox[data-id="${id}"]`).prop('checked', true);
    });
    updateGenerateReportBtn();

    // Обработчик изменения чекбоксов
    $(document).on('change', '.report-checkbox', function() {
        const id = $(this).data('id');
        let selectedIds = getSelectedIds();

        if ($(this).is(':checked')) {
            if (!selectedIds.includes(id)) {
                selectedIds.push(id);
            }
        } else {
            selectedIds = selectedIds.filter(x => x !== id);
        }

        saveSelectedIds(selectedIds);
    });

    $(document).on('click', '#deselectAllBtn', function() {
         $('.report-checkbox').prop('checked', false).trigger('change');
         sessionStorage.removeItem(STORAGE_KEY);
         updateGenerateReportBtn();
    });

    // Обработчик создания отчета (обновленный)
    $(document).on('click', '#generateReportBtn', function (e) {
        e.preventDefault();
        const selectedIds = getSelectedIds();

        if (selectedIds.length === 0) {
            console.log('Нет выбранных элементов для отчета');
            return;
        }

        console.log('Кнопка нажата, выбранные элементы:', selectedIds);

        // Показываем индикатор загрузки
        const btn = $(this);
        btn.prop('disabled', true);
        btn.html('<span class="spinner-border spinner-border-sm" role="status"></span> Генерация...');

        // Отправка запроса на сервер
        $.ajax({
            url: '/generate_report/',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({items: selectedIds}), // Используем selectedIds из sessionStorage
            xhrFields: {
                responseType: 'blob'
            },
            success: function (data) {
                // Сброс выделения после успешной генерации
                $('.report-checkbox').prop('checked', false);
                sessionStorage.removeItem(STORAGE_KEY);

                // Скачивание файла
                const blob = new Blob([data], {type: 'application/pdf'});
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'realty_report.pdf';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            },
            error: function (xhr) {
                console.error('Ошибка:', xhr.responseText);
                alert('Ошибка при генерации отчета: ' + xhr.responseText);
            },
            complete: function () {
                btn.prop('disabled', false);
                btn.html('<i class="bi bi-file-earmark-pdf"></i> Создать отчет');
            }
        });
    });

    // Инициализация сортировки и фильтрации
    sortFavoritesFirst();
    const showOnlyFavorites = $('#showFavoritesOnly').is(':checked');
    filterFavoritesOnly(showOnlyFavorites);

    // Обработчик переключателя
    $('#showFavoritesOnly').change(function () {
        filterFavoritesOnly(this.checked);
    });
});