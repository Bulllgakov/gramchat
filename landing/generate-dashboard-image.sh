#!/bin/bash

# Генерация изображения dashboard для лендинга

echo "📸 Генерация изображения dashboard..."

# Копируем HTML на сервер
scp dashboard-preview.html root@217.198.6.80:/var/www/gramchat-landing/

# Подключаемся к серверу и генерируем изображение
ssh root@217.198.6.80 << 'EOF'
cd /var/www/gramchat-landing/

# Проверяем наличие инструментов для скриншотов
if ! command -v wkhtmltoimage &> /dev/null; then
    echo "Устанавливаем wkhtmltoimage..."
    apt-get update
    apt-get install -y wkhtmltopdf
fi

# Генерируем изображение из HTML
echo "Создаем скриншот dashboard..."
wkhtmltoimage --width 1200 --height 900 --quality 100 \
    --enable-local-file-access \
    dashboard-preview.html images/hero-dashboard.png

# Альтернативный метод через Chrome если есть
if command -v google-chrome &> /dev/null; then
    google-chrome --headless --disable-gpu \
        --screenshot=images/hero-dashboard-chrome.png \
        --window-size=1200,900 \
        file:///var/www/gramchat-landing/dashboard-preview.html
fi

# Оптимизируем размер изображения
if [ -f images/hero-dashboard.png ]; then
    convert images/hero-dashboard.png \
        -resize 800x600 \
        -quality 85 \
        images/hero-dashboard-optimized.png
    
    mv images/hero-dashboard-optimized.png images/hero-dashboard.png
    echo "✅ Dashboard изображение создано!"
else
    echo "⚠️ Не удалось создать изображение, используем CSS версию"
fi

# Устанавливаем права
chown -R www-data:www-data images/
chmod -R 755 images/

ls -la images/hero-dashboard*
EOF

echo "✅ Готово!"