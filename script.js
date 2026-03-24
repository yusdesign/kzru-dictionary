let dictionaryData = null;
let currentResults = [];

// Загрузка данных
async function loadDictionary() {
    try {
        const response = await fetch('data/dictionary.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        dictionaryData = await response.json();
        
        // Проверка, что данные загружены
        if (!dictionaryData || !dictionaryData.entries) {
            throw new Error('Неверный формат данных');
        }
        
        // Обновляем информацию о версии (только после загрузки)
        updateVersionInfo();
        updateHeader();
        
        // Заполняем категории
        populateCategories();
        
        // Показываем все слова
        showAllWords();
        
    } catch (error) {
        console.error('Ошибка загрузки словаря:', error);
        document.getElementById('results').innerHTML = `
            <div class="no-results">
                ❌ Ошибка загрузки словаря: ${error.message}
            </div>
        `;
    }
}

// Обновление информации о версии
function updateVersionInfo() {
    const versionEl = document.getElementById('version');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    
    if (dictionaryData && versionEl && lastUpdatedEl) {
        versionEl.textContent = `Версия: ${dictionaryData.version || '?'}`;
        lastUpdatedEl.textContent = `Обновлено: ${dictionaryData.lastUpdated || '?'}`;
    }
}

// Обновление заголовка в зависимости от направления
function updateHeader() {
    const direction = document.getElementById('directionSelect');
    const mainTitle = document.getElementById('mainTitle');
    const subTitle = document.getElementById('subTitle');
    
    if (!direction || !mainTitle || !subTitle) return;
    
    const dirValue = direction.value;
    
    if (dirValue === 'ru-kk') {
        mainTitle.textContent = '🇷🇺 Русско-Казахский словарь';
        subTitle.textContent = 'Орысша-қазақша сөздік';
    } else if (dirValue === 'kk-ru') {
        mainTitle.textContent = '🇰🇿 Казахско-Русский словарь';
        subTitle.textContent = 'Қазақша-орысша сөздік';
    } else {
        mainTitle.textContent = '📖 Русско-Казахский словарь';
        subTitle.textContent = 'Қазақша-орысша сөздік';
    }
}

// Заполнение фильтра категорий
function populateCategories() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect || !dictionaryData || !dictionaryData.categories) return;
    
    // Очищаем существующие опции (кроме первой)
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }
    
    const categories = dictionaryData.categories;
    for (const [key, value] of Object.entries(categories)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        categorySelect.appendChild(option);
    }
}

// Показать все слова
function showAllWords() {
    if (!dictionaryData || !dictionaryData.entries) return;
    currentResults = dictionaryData.entries;
    displayResults(currentResults);
}

// Поиск
function search() {
    if (!dictionaryData || !dictionaryData.entries) return;
    
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const direction = document.getElementById('directionSelect').value;
    const category = document.getElementById('categorySelect').value;
    
    if (!query && category === 'all') {
        showAllWords();
        return;
    }
    
    let results = dictionaryData.entries;
    
    // Фильтр по категории
    if (category !== 'all') {
        results = results.filter(entry => entry.category === category);
    }
    
    // Фильтр по поисковому запросу
    if (query) {
        results = results.filter(entry => {
            const ruMatch = entry.ru.toLowerCase().includes(query);
            const kkMatch = entry.kk.toLowerCase().includes(query);
            const ruTransMatch = entry.ruTranscription?.toLowerCase().includes(query) || false;
            const kkTransMatch = entry.kkTranscription?.toLowerCase().includes(query) || false;
            
            switch(direction) {
                case 'ru-kk':
                    return ruMatch || ruTransMatch;
                case 'kk-ru':
                    return kkMatch || kkTransMatch;
                default:
                    return ruMatch || kkMatch || ruTransMatch || kkTransMatch;
            }
        });
    }
    
    currentResults = results;
    displayResults(results);
}

// Отображение результатов с учетом направления
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    const resultCount = document.getElementById('resultCount');
    const direction = document.getElementById('directionSelect').value;
    
    if (!resultsContainer || !resultCount) return;
    
    resultCount.textContent = `Найдено: ${results.length} слов`;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">😔 Ничего не найдено. Попробуйте изменить запрос.</div>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(entry => {
        let wordPairHtml = '';
        let directionLabel = '';
        
        if (direction === 'ru-kk') {
            wordPairHtml = `
                <div class="word-pair direction-ru-kk">
                    <span class="ru-word">🇷🇺 ${escapeHtml(entry.ru)}</span>
                    <span class="arrow">→</span>
                    <span class="kk-word">🇰🇿 ${escapeHtml(entry.kk)}</span>
                </div>
            `;
            directionLabel = '<span class="direction-badge ru-kk-badge">🇷🇺 Русский → Қазақша</span>';
        } else if (direction === 'kk-ru') {
            wordPairHtml = `
                <div class="word-pair direction-kk-ru">
                    <span class="kk-word">🇰🇿 ${escapeHtml(entry.kk)}</span>
                    <span class="arrow">→</span>
                    <span class="ru-word">🇷🇺 ${escapeHtml(entry.ru)}</span>
                </div>
            `;
            directionLabel = '<span class="direction-badge kk-ru-badge">🇰🇿 Қазақша → Русский</span>';
        } else {
            wordPairHtml = `
                <div class="word-pair direction-both">
                    <div class="pair-item">
                        <span class="ru-word">🇷🇺 ${escapeHtml(entry.ru)}</span>
                        <span class="arrow">→</span>
                        <span class="kk-word">🇰🇿 ${escapeHtml(entry.kk)}</span>
                    </div>
                    <div class="pair-item">
                        <span class="kk-word">🇰🇿 ${escapeHtml(entry.kk)}</span>
                        <span class="arrow">→</span>
                        <span class="ru-word">🇷🇺 ${escapeHtml(entry.ru)}</span>
                    </div>
                </div>
            `;
            directionLabel = '<span class="direction-badge both-badge">🔁 Оба направления</span>';
        }
        
        const categoryName = dictionaryData.categories?.[entry.category] || entry.category;
        
        return `
            <div class="result-card">
                <div class="result-header">
                    ${wordPairHtml}
                    <div class="meta-info">
                        ${directionLabel}
                        <span class="category-badge">${escapeHtml(categoryName)}</span>
                    </div>
                </div>
                <div class="transcriptions">
                    <div class="transcription-item">
                        <strong>📢 Произношение (рус.):</strong> ${escapeHtml(entry.ruTranscription || '')}
                    </div>
                    <div class="transcription-item">
                        <strong>🎤 Айтылуы (қаз.):</strong> ${escapeHtml(entry.kkTranscription || '')}
                    </div>
                </div>
                ${entry.note ? `<div class="note">💡 Примечание: ${escapeHtml(entry.note)}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Простая функция для экранирования HTML (безопасность)
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Экспорт данных для администрирования
function exportData() {
    if (!dictionaryData) return;
    const dataStr = JSON.stringify(dictionaryData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `dictionary_${dictionaryData.version}_${dictionaryData.lastUpdated}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadDictionary();
    
    // Навешиваем обработчики
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const directionSelect = document.getElementById('directionSelect');
    const categorySelect = document.getElementById('categorySelect');
    
    if (searchBtn) searchBtn.addEventListener('click', search);
    if (searchInput) searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });
    if (directionSelect) directionSelect.addEventListener('change', () => {
        updateHeader();
        search();
    });
    if (categorySelect) categorySelect.addEventListener('change', search);
});

// Добавляем функцию экспорта в глобальный объект для админ-панели
window.exportDictionary = exportData;
