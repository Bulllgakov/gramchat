#!/bin/bash

echo "🔐 Установка SSL сертификатов для всех поддоменов gramchat.ru"
echo "Этот метод проще, но создает отдельные сертификаты для каждого поддомена"

ssh root@217.198.6.80 << 'ENDSSH'
    # Проверяем установлен ли certbot
    if ! command -v certbot &> /dev/null; then
        echo "📦 Установка certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi

    echo "🌐 Получение сертификатов для всех поддоменов..."
    
    # Останавливаем nginx временно для получения сертификатов
    echo "⏸️  Временно останавливаем nginx..."
    systemctl stop nginx
    
    # Получаем сертификаты для всех доменов через standalone режим
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@gramchat.ru \
        --domains gramchat.ru,www.gramchat.ru,web.gramchat.ru,api.gramchat.ru \
        --expand
    
    if [ $? -eq 0 ]; then
        echo "✅ Сертификаты успешно получены!"
        
        # Создаем улучшенную конфигурацию nginx с SSL
        cat > /etc/nginx/sites-available/gramchat << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name gramchat.ru www.gramchat.ru web.gramchat.ru api.gramchat.ru;
    return 301 https://$server_name$request_uri;
}

# API Server (HTTPS)
server {
    listen 443 ssl http2;
    server_name api.gramchat.ru;

    ssl_certificate /etc/letsencrypt/live/gramchat.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gramchat.ru/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}

# Web Application (HTTPS)
server {
    listen 443 ssl http2;
    server_name web.gramchat.ru;

    ssl_certificate /etc/letsencrypt/live/gramchat.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gramchat.ru/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Main domain redirect (HTTPS)
server {
    listen 443 ssl http2;
    server_name gramchat.ru www.gramchat.ru;

    ssl_certificate /etc/letsencrypt/live/gramchat.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gramchat.ru/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    return 301 https://web.gramchat.ru$request_uri;
}
EOF
        
        # Запускаем nginx
        echo "▶️  Запускаем nginx с новой конфигурацией..."
        systemctl start nginx
        
        # Проверяем конфигурацию
        nginx -t
        
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            echo "✅ Nginx успешно настроен с SSL!"
        else
            echo "❌ Ошибка в конфигурации nginx"
            systemctl status nginx
        fi
        
        # Настраиваем автоматическое обновление
        echo "⏰ Настройка автоматического обновления сертификатов..."
        
        # Добавляем cron задачу
        (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --nginx --post-hook 'systemctl reload nginx'") | crontab -
        
        echo "✅ Всё готово!"
        echo ""
        echo "🔒 SSL сертификаты установлены для:"
        echo "   • https://gramchat.ru"
        echo "   • https://www.gramchat.ru"
        echo "   • https://web.gramchat.ru"
        echo "   • https://api.gramchat.ru"
        echo ""
        echo "📝 Сертификаты будут автоматически обновляться"
        
    else
        echo "❌ Ошибка при получении сертификатов"
        # Запускаем nginx обратно
        systemctl start nginx
    fi
ENDSSH