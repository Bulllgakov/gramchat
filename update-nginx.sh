#!/bin/bash

echo "🔧 Обновление конфигурации nginx для работы с Docker..."

# Копируем новую конфигурацию на сервер
echo "📤 Отправка новой конфигурации nginx..."
cat nginx-production.conf | ssh root@217.198.6.80 "cat > /etc/nginx/sites-available/gramchat"

# Применяем конфигурацию
ssh root@217.198.6.80 << 'ENDSSH'
    echo "🔄 Перезагрузка nginx..."
    
    # Проверяем конфигурацию
    nginx -t
    
    if [ $? -eq 0 ]; then
        # Перезагружаем nginx
        systemctl reload nginx
        echo "✅ Nginx успешно перезагружен!"
        
        # Проверяем статус
        systemctl status nginx | head -n 5
    else
        echo "❌ Ошибка в конфигурации nginx!"
        exit 1
    fi
ENDSSH

echo "✨ Готово! Теперь nginx проксирует на Docker контейнеры"
echo "🔍 Проверьте сайт: https://web.gramchat.ru"