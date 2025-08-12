#!/bin/bash

# Генерация скриншотов админки для лендинга

echo "📸 Генерация скриншотов админки..."

# Создаем директорию для изображений если её нет
mkdir -p images

# Генерируем изображения с помощью ImageMagick
echo "Создаем скриншоты..."

# Скриншот 1: Главный дашборд с диалогами
convert -size 1200x800 xc:white \
    -font DejaVu-Sans -pointsize 14 \
    -fill '#f8f9fa' -draw "rectangle 0,0 1200,60" \
    -fill '#1a1d23' -draw "rectangle 0,0 1200,50" \
    -fill white -gravity NorthWest -pointsize 16 -annotate +20+15 "GramChat" \
    -fill '#0088CC' -gravity NorthWest -pointsize 12 -annotate +20+32 "🏪 Магазин электроники" \
    -fill white -gravity NorthEast -pointsize 14 -annotate +50+15 "🔔  Админ" \
    \
    -fill '#f8f9fa' -draw "rectangle 0,50 280,800" \
    -fill white -draw "roundRectangle 20,70 260,130 8,8" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +30+85 "Активные диалоги" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 24 -weight Bold -annotate +30+105 "24" \
    -fill '#10b981' -gravity NorthWest -pointsize 10 -annotate +60+108 "↑12%" \
    \
    -fill white -draw "roundRectangle 20,145 260,205 8,8" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +30+160 "Время ответа" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 24 -weight Bold -annotate +30+180 "2 мин" \
    \
    -fill white -draw "roundRectangle 20,220 260,280 8,8" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +30+235 "Решено сегодня" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 24 -weight Bold -annotate +30+255 "47" \
    \
    -fill '#e5e7eb' -draw "rectangle 280,50 281,800" \
    -fill white -draw "rectangle 281,50 630,800" \
    -fill '#eff6ff' -draw "roundRectangle 290,60 620,140 8,8" \
    -fill '#0088CC' -draw "rectangle 290,60 293,140" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -weight Bold -annotate +310+80 "Александр Иванов" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +310+100 "Здравствуйте! Хочу узнать..." \
    -fill '#0088CC' -gravity NorthWest -pointsize 10 -annotate +560+80 "2 мин" \
    -fill white -draw "roundRectangle 580,110 605,125 10,10" \
    -fill '#0088CC' -gravity NorthWest -pointsize 9 -weight Bold -annotate +589+120 "2" \
    \
    -fill white -draw "roundRectangle 290,150 620,220 8,8" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -weight Bold -annotate +310+170 "Мария Петрова" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +310+190 "Спасибо за быстрый ответ!" \
    -fill '#6b7280' -gravity NorthWest -pointsize 10 -annotate +550+170 "15 мин" \
    \
    -fill white -draw "roundRectangle 290,230 620,300 8,8" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -weight Bold -annotate +310+250 "Сергей (MAX)" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +310+270 "Можно оплатить через СБП?" \
    -fill '#6b7280' -gravity NorthWest -pointsize 10 -annotate +550+250 "23 мин" \
    \
    -fill '#e5e7eb' -draw "rectangle 630,50 631,800" \
    -fill '#fafbfc' -draw "rectangle 631,50 1200,700" \
    \
    -fill white -draw "roundRectangle 650,100 900,180 12,12" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -annotate +670+130 "Здравствуйте! Хочу узнать" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -annotate +670+150 "о доставке iPhone 15 Pro" \
    -fill '#6b7280' -gravity NorthWest -pointsize 10 -annotate +670+170 "14:23" \
    \
    -fill '#0088CC' -draw "roundRectangle 920,220 1170,320 12,12" \
    -fill white -gravity NorthWest -pointsize 13 -annotate +940+250 "Добрый день! Рад помочь" \
    -fill white -gravity NorthWest -pointsize 13 -annotate +940+270 "с информацией о доставке." \
    -fill white -gravity NorthWest -pointsize 13 -annotate +940+290 "В какой город планируете?" \
    -fill 'rgba(255,255,255,0.7)' -gravity NorthWest -pointsize 10 -annotate +940+310 "14:24" \
    \
    -fill white -draw "rectangle 631,700 1200,800" \
    -fill '#e5e7eb' -draw "rectangle 631,700 1200,701" \
    -fill white -draw "roundRectangle 650,720 1120,770 20,20" \
    -fill '#e5e7eb' -draw "rectangle 650,720 1120,721" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +670+745 "Введите сообщение..." \
    -fill '#0088CC' -draw "circle 1150,745 1170,745" \
    images/dashboard-1.png

# Скриншот 2: Статистика и аналитика
convert -size 1200x800 xc:white \
    -font DejaVu-Sans -pointsize 14 \
    -fill '#1a1d23' -draw "rectangle 0,0 1200,50" \
    -fill white -gravity NorthWest -pointsize 16 -annotate +20+15 "GramChat - Аналитика" \
    \
    -fill '#f8f9fa' -draw "rectangle 0,50 1200,120" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 20 -weight Bold -annotate +40+85 "Статистика за неделю" \
    \
    -fill white -draw "roundRectangle 40,150 380,300 12,12" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +60+180 "Всего диалогов" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 36 -weight Bold -annotate +60+220 "847" \
    -fill '#10b981' -gravity NorthWest -pointsize 14 -annotate +60+260 "↑ 23% к прошлой неделе" \
    \
    -fill white -draw "roundRectangle 420,150 760,300 12,12" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +440+180 "Среднее время ответа" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 36 -weight Bold -annotate +440+220 "1.5 мин" \
    -fill '#10b981' -gravity NorthWest -pointsize 14 -annotate +440+260 "↓ 35% быстрее" \
    \
    -fill white -draw "roundRectangle 800,150 1140,300 12,12" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +820+180 "Конверсия в продажи" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 36 -weight Bold -annotate +820+220 "31%" \
    -fill '#10b981' -gravity NorthWest -pointsize 14 -annotate +820+260 "↑ 8% рост" \
    \
    -fill white -draw "roundRectangle 40,340 1140,600 12,12" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 16 -weight Bold -annotate +60+370 "График активности" \
    -fill '#e5e7eb' -draw "line 100,420 1100,420" \
    -fill '#e5e7eb' -draw "line 100,470 1100,470" \
    -fill '#e5e7eb' -draw "line 100,520 1100,520" \
    -fill '#0088CC' -draw "circle 200,450 210,450" \
    -fill '#0088CC' -draw "circle 350,420 360,420" \
    -fill '#0088CC' -draw "circle 500,430 510,430" \
    -fill '#0088CC' -draw "circle 650,410 660,410" \
    -fill '#0088CC' -draw "circle 800,400 810,400" \
    -fill '#0088CC' -draw "circle 950,380 960,380" \
    -fill '#0088CC' -draw "line 200,450 350,420" \
    -fill '#0088CC' -draw "line 350,420 500,430" \
    -fill '#0088CC' -draw "line 500,430 650,410" \
    -fill '#0088CC' -draw "line 650,410 800,400" \
    -fill '#0088CC' -draw "line 800,400 950,380" \
    images/dashboard-2.png

# Скриншот 3: Управление менеджерами
convert -size 1200x800 xc:white \
    -font DejaVu-Sans -pointsize 14 \
    -fill '#1a1d23' -draw "rectangle 0,0 1200,50" \
    -fill white -gravity NorthWest -pointsize 16 -annotate +20+15 "GramChat - Команда" \
    \
    -fill '#f8f9fa' -draw "rectangle 0,50 1200,120" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 20 -weight Bold -annotate +40+85 "Управление менеджерами" \
    -fill '#0088CC' -draw "roundRectangle 1000,70 1150,100 6,6" \
    -fill white -gravity NorthWest -pointsize 12 -annotate +1020+87 "➕ Добавить" \
    \
    -fill white -draw "roundRectangle 40,150 1140,250 12,12" \
    -fill '#f8f9fa' -draw "rectangle 40,150 1140,200" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -weight Bold -annotate +60+175 "Анна Менеджер" \
    -fill '#10b981' -gravity NorthWest -pointsize 11 -annotate +200+175 "● Онлайн" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +60+220 "Обработано: 127 диалогов" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +300+220 "Ср. время: 1.2 мин" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +500+220 "Рейтинг: 4.8 ⭐" \
    \
    -fill white -draw "roundRectangle 40,270 1140,370 12,12" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -weight Bold -annotate +60+295 "Иван Поддержка" \
    -fill '#6b7280' -gravity NorthWest -pointsize 11 -annotate +200+295 "● Оффлайн" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +60+340 "Обработано: 89 диалогов" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +300+340 "Ср. время: 2.1 мин" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +500+340 "Рейтинг: 4.6 ⭐" \
    \
    -fill white -draw "roundRectangle 40,390 1140,490 12,12" \
    -fill '#1a1d23' -gravity NorthWest -pointsize 13 -weight Bold -annotate +60+415 "Елена Продажи" \
    -fill '#10b981' -gravity NorthWest -pointsize 11 -annotate +200+415 "● Онлайн" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +60+460 "Обработано: 215 диалогов" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +300+460 "Ср. время: 0.9 мин" \
    -fill '#6b7280' -gravity NorthWest -pointsize 12 -annotate +500+460 "Рейтинг: 4.9 ⭐" \
    images/dashboard-3.png

echo "✅ Скриншоты созданы!"

# Оптимизируем размер изображений
for img in images/dashboard-*.png; do
    convert "$img" -resize 1000x -quality 85 "${img%.png}-optimized.png"
    mv "${img%.png}-optimized.png" "$img"
done

ls -la images/dashboard-*.png