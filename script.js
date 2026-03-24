let dictionaryData = null;
let currentResults = [];

// Загрузка данных
async function loadDictionary() {
    try {
        const response = await fetch('data/dictionary.json');
        dictionaryData = await response.json();
        
        // Обновляем информацию о версии
        document.getElementById('version').textContent = `Версия: ${dictionaryData.version}`;
        document.getElementById('lastUpdated').textContent = `Обновлено: ${dictionaryData.lastUpdated}`;
        
        // Заполняем категории
        populateCategories();
        
        // Показываем все слова
        showAllWords();
        
    } catch (error) {
        console.error('Ошибка загрузки словаря:', error);
        document.getElementById('results').innerHTML = '<div class="no-results">❌ Ошибка загрузки словаря. Проверьте подключение к интернету.</div>';
    }
}

// Заполнение фильтра категорий
function populateCategories() {
    const categorySelect = document.getElementById('categorySelect');
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
    currentResults = dictionaryData.entries;
    displayResults(currentResults);
}

// Поиск
function search() {
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
            const ruTransMatch = entry.ruTranscription.toLowerCase().includes(query);
            const kkTransMatch = entry.kkTranscription.toLowerCase().includes(query);
            
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

// Отображение результатов
// Отображение результатов с учетом направления
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    const resultCount = document.getElementById('resultCount');
    const direction = document.getElementById('directionSelect').value;
    
    resultCount.textContent = `Найдено: ${results.length} слов`;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">😔 Ничего не найдено. Попробуйте изменить запрос.</div>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(entry => {
        // Определяем порядок слов в зависимости от направления
        let wordPairHtml = '';
        let directionLabel = '';
        
        if (direction === 'ru-kk') {
            // Русско-казахский: сначала русское
            wordPairHtml = `
                <div class="word-pair direction-ru-kk">
                    <span class="ru-word">🇷🇺 ${entry.ru}</span>
                    <span class="arrow">→</span>
                    <span class="kk-word">🇰🇿 ${entry.kk}</span>
                </div>
            `;
            directionLabel = '<span class="direction-badge ru-kk-badge">🇷🇺 Русский → Қазақша</span>';
        } else if (direction === 'kk-ru') {
            // Казахско-русский: сначала казахское
            wordPairHtml = `
                <div class="word-pair direction-kk-ru">
                    <span class="kk-word">🇰🇿 ${entry.kk}</span>
                    <span class="arrow">→</span>
                    <span class="ru-word">🇷🇺 ${entry.ru}</span>
                </div>
            `;
            directionLabel = '<span class="direction-badge kk-ru-badge">🇰🇿 Қазақша → Русский</span>';
        } else {
            // Оба направления: показываем оба варианта
            wordPairHtml = `
                <div class="word-pair direction-both">
                    <div class="pair-item">
                        <span class="ru-word">🇷🇺 ${entry.ru}</span>
                        <span class="arrow">→</span>
                        <span class="kk-word">🇰🇿 ${entry.kk}</span>
                    </div>
                    <div class="pair-item">
                        <span class="kk-word">🇰🇿 ${entry.kk}</span>
                        <span class="arrow">→</span>
                        <span class="ru-word">🇷🇺 ${entry.ru}</span>
                    </div>
                </div>
            `;
            directionLabel = '<span class="direction-badge both-badge">🔁 Оба направления</span>';
        }
        
        return `
            <div class="result-card">
                <div class="result-header">
                    ${wordPairHtml}
                    <div class="meta-info">
                        ${directionLabel}
                        <span class="category-badge">${dictionaryData.categories[entry.category] || entry.category}</span>
                    </div>
                </div>
                <div class="transcriptions">
                    <div class="transcription-item">
                        <strong>📢 Произношение (рус.):</strong> ${entry.ruTranscription}
                    </div>
                    <div class="transcription-item">
                        <strong>🎤 Айтылуы (қаз.):</strong> ${entry.kkTranscription}
                    </div>
                </div>
                ${entry.note ? `<div class="note">💡 Примечание: ${entry.note}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Экспорт данных для администрирования
function exportData() {
    const dataStr = JSON.stringify(dictionaryData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
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
    document.getElementById('searchBtn').addEventListener('click', search);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });
    document.getElementById('directionSelect').addEventListener('change', search);
    document.getElementById('categorySelect').addEventListener('change', search);
});

// Добавляем функцию экспорта в глобальный объект для админ-панели
window.exportDictionary = exportData;
