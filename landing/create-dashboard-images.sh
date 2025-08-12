#!/bin/bash

# Создаем красивые изображения дашборда на сервере

echo "🎨 Создаем изображения дашборда..."

# Подключаемся к серверу и создаем изображения
ssh root@217.198.6.80 << 'EOF'
cd /var/www/gramchat-landing/

# Проверяем и устанавливаем ImageMagick если нужно
if ! command -v convert &> /dev/null; then
    echo "Устанавливаем ImageMagick..."
    apt-get update
    apt-get install -y imagemagick
fi

# Создаем директорию для изображений
mkdir -p images

echo "Генерируем изображения..."

# Изображение 1: Главный экран с диалогами
convert -size 1200x700 \
    gradient:'#f8f9fa-#ffffff' \
    -font DejaVu-Sans -pointsize 14 \
    -fill '#1a1d23' -draw "rectangle 0,0 1200,50" \
    -fill white -gravity NorthWest -pointsize 16 -weight Bold -annotate +20+15 "GramChat" \
    -fill '#0088CC' -gravity NorthWest -pointsize 12 -annotate +100+18 "Магазин электроники" \
    -fill white -gravity NorthEast -pointsize 14 -annotate +50+15 "🔔  Админ" \
    -fill '#f8f9fa' -draw "rectangle 0,50 250,700" \
    -fill white -draw "roundRectangle 15,70 235,140 8,8" \
    -fill '#6b7280' -pointsize 11 -annotate +25+90 "Активные диалоги" \
    -fill '#1a1d23' -pointsize 28 -weight Bold -annotate +25+120 "24" \
    -fill '#10b981' -pointsize 10 -annotate +65+123 "↑12%" \
    -fill white -draw "roundRectangle 15,150 235,220 8,8" \
    -fill '#6b7280' -pointsize 11 -annotate +25+170 "Время ответа" \
    -fill '#1a1d23' -pointsize 28 -weight Bold -annotate +25+200 "2м" \
    -fill '#e5e7eb' -draw "rectangle 250,50 600,700" \
    -fill '#eff6ff' -draw "roundRectangle 260,60 590,130 8,8" \
    -fill '#0088CC' -draw "rectangle 260,60 263,130" \
    -fill '#1a1d23' -pointsize 13 -weight Bold -annotate +275+85 "Александр Иванов" \
    -fill '#6b7280' -pointsize 11 -annotate +275+105 "Хочу узнать о доставке..." \
    -fill '#0088CC' -pointsize 10 -annotate +530+85 "2 мин" \
    -fill white -draw "roundRectangle 270,140 580,200 8,8" \
    -fill '#1a1d23' -pointsize 13 -annotate +285+165 "Мария Петрова" \
    -fill '#6b7280' -pointsize 11 -annotate +285+185 "Спасибо за помощь!" \
    -fill '#fafbfc' -draw "rectangle 600,50 1200,700" \
    -fill white -draw "roundRectangle 620,100 850,160 12,12" \
    -fill '#4a5568' -pointsize 12 -annotate +640+130 "Здравствуйте! Хочу узнать" \
    -fill '#4a5568' -pointsize 12 -annotate +640+145 "о доставке iPhone 15 Pro" \
    -fill '#0088CC' -draw "roundRectangle 900,200 1150,280 12,12" \
    -fill white -pointsize 12 -annotate +920+230 "Добрый день! Рад помочь" \
    -fill white -pointsize 12 -annotate +920+250 "с информацией о доставке." \
    -quality 90 \
    images/dashboard-main.jpg

# Изображение 2: Аналитика
convert -size 1200x700 \
    gradient:'#f8f9fa-#ffffff' \
    -font DejaVu-Sans -pointsize 14 \
    -fill '#1a1d23' -draw "rectangle 0,0 1200,50" \
    -fill white -gravity NorthWest -pointsize 16 -weight Bold -annotate +20+15 "GramChat Analytics" \
    -fill '#f8f9fa' -draw "rectangle 0,50 1200,120" \
    -fill '#1a1d23' -pointsize 22 -weight Bold -annotate +40+90 "Статистика за неделю" \
    -fill white -draw "roundRectangle 40,150 380,300 12,12" \
    -fill '#6b7280' -pointsize 12 -annotate +60+180 "Всего диалогов" \
    -fill '#1a1d23' -pointsize 36 -weight Bold -annotate +60+230 "847" \
    -fill '#10b981' -pointsize 14 -annotate +60+270 "↑ 23% к прошлой неделе" \
    -fill white -draw "roundRectangle 420,150 760,300 12,12" \
    -fill '#6b7280' -pointsize 12 -annotate +440+180 "Среднее время ответа" \
    -fill '#1a1d23' -pointsize 36 -weight Bold -annotate +440+230 "1.5 мин" \
    -fill '#10b981' -pointsize 14 -annotate +440+270 "↓ 35% быстрее" \
    -fill white -draw "roundRectangle 800,150 1140,300 12,12" \
    -fill '#6b7280' -pointsize 12 -annotate +820+180 "Конверсия" \
    -fill '#1a1d23' -pointsize 36 -weight Bold -annotate +820+230 "31%" \
    -fill white -draw "roundRectangle 40,340 1140,650 12,12" \
    -stroke '#0088CC' -strokewidth 3 -fill none \
    -draw "polyline 100,500 250,450 400,430 550,380 700,350 850,320 1000,300" \
    -fill '#0088CC' \
    -draw "circle 250,450 258,450" \
    -draw "circle 400,430 408,430" \
    -draw "circle 550,380 558,380" \
    -draw "circle 700,350 708,350" \
    -draw "circle 850,320 858,320" \
    -draw "circle 1000,300 1008,300" \
    -quality 90 \
    images/dashboard-analytics.jpg

# Изображение 3: Управление командой
convert -size 1200x700 \
    gradient:'#f8f9fa-#ffffff' \
    -font DejaVu-Sans -pointsize 14 \
    -fill '#1a1d23' -draw "rectangle 0,0 1200,50" \
    -fill white -gravity NorthWest -pointsize 16 -weight Bold -annotate +20+15 "GramChat Team" \
    -fill '#f8f9fa' -draw "rectangle 0,50 1200,120" \
    -fill '#1a1d23' -pointsize 22 -weight Bold -annotate +40+90 "Управление менеджерами" \
    -fill '#0088CC' -draw "roundRectangle 1000,75 1150,105 6,6" \
    -fill white -pointsize 12 -annotate +1030+92 "➕ Добавить" \
    -fill white -draw "roundRectangle 40,150 1140,250 12,12" \
    -fill '#f8f9fa' -draw "rectangle 40,150 1140,190" \
    -fill '#1a1d23' -pointsize 14 -weight Bold -annotate +60+173 "Анна Менеджер" \
    -fill '#10b981' -pointsize 11 -annotate +220+173 "● Онлайн" \
    -fill '#6b7280' -pointsize 12 -annotate +60+220 "Обработано: 127    Время: 1.2м    Рейтинг: 4.8⭐" \
    -fill white -draw "roundRectangle 40,270 1140,370 12,12" \
    -fill '#1a1d23' -pointsize 14 -weight Bold -annotate +60+303 "Иван Поддержка" \
    -fill '#6b7280' -pointsize 11 -annotate +220+303 "● Оффлайн" \
    -fill '#6b7280' -pointsize 12 -annotate +60+340 "Обработано: 89     Время: 2.1м    Рейтинг: 4.6⭐" \
    -fill white -draw "roundRectangle 40,390 1140,490 12,12" \
    -fill '#1a1d23' -pointsize 14 -weight Bold -annotate +60+423 "Елена Продажи" \
    -fill '#10b981' -pointsize 11 -annotate +220+423 "● Онлайн" \
    -fill '#6b7280' -pointsize 12 -annotate +60+460 "Обработано: 215    Время: 0.9м    Рейтинг: 4.9⭐" \
    -quality 90 \
    images/dashboard-team.jpg

# Изображение 4: Мобильная версия
convert -size 1200x700 \
    gradient:'#667eea-#764ba2' \
    -gravity center \
    -fill white -pointsize 18 -annotate +0-200 "Мобильная версия GramChat" \
    -fill white -pointsize 14 -annotate +0-160 "Работайте с любого устройства" \
    -fill white -draw "roundRectangle 450,200 750,650 20,20" \
    -fill '#1a1d23' -draw "rectangle 450,200 750,250" \
    -fill white -pointsize 12 -annotate +0-180 "GramChat" \
    -fill '#f8f9fa' -draw "rectangle 450,250 750,650" \
    -fill white -draw "roundRectangle 470,270 730,340 8,8" \
    -fill '#0088CC' -draw "rectangle 470,270 473,340" \
    -fill '#1a1d23' -pointsize 11 -annotate -100+60 "Александр И." \
    -fill '#6b7280' -pointsize 10 -annotate -100+80 "Новое сообщение" \
    -fill white -draw "roundRectangle 470,350 730,420 8,8" \
    -fill '#1a1d23' -pointsize 11 -annotate -100+140 "Мария П." \
    -fill '#6b7280' -pointsize 10 -annotate -100+160 "Спасибо!" \
    -fill white -draw "roundRectangle 470,430 730,500 8,8" \
    -fill '#1a1d23' -pointsize 11 -annotate -100+220 "Сергей К." \
    -fill '#6b7280' -pointsize 10 -annotate -100+240 "Вопрос по оплате" \
    -quality 90 \
    images/dashboard-mobile.jpg

echo "✅ Изображения созданы!"

# Устанавливаем права
chown -R www-data:www-data images/
chmod -R 755 images/

ls -lah images/dashboard-*.jpg
EOF

echo "✅ Готово!"