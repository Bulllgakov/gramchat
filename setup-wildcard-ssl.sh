#!/bin/bash

echo "🔐 Установка wildcard SSL сертификата для *.gramchat.ru"

ssh root@217.198.6.80 << 'ENDSSH'
    # Проверяем установлен ли certbot
    if ! command -v certbot &> /dev/null; then
        echo "📦 Установка certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx python3-certbot-dns-cloudflare
    fi

    echo "📋 Генерация wildcard сертификата..."
    echo ""
    echo "⚠️  ВАЖНО: Для wildcard сертификатов требуется DNS валидация!"
    echo "Вам нужно будет добавить TXT записи в DNS вашего домена."
    echo ""
    
    # Команда для получения wildcard сертификата с DNS валидацией
    certbot certonly \
        --manual \
        --preferred-challenges dns \
        --server https://acme-v02.api.letsencrypt.org/directory \
        --manual-public-ip-logging-ok \
        --domains "gramchat.ru,*.gramchat.ru" \
        --email admin@gramchat.ru \
        --agree-tos \
        --no-eff-email

    # После успешного получения сертификата
    if [ $? -eq 0 ]; then
        echo "✅ Сертификат успешно получен!"
        echo "📁 Расположение сертификатов:"
        echo "   Сертификат: /etc/letsencrypt/live/gramchat.ru/fullchain.pem"
        echo "   Ключ: /etc/letsencrypt/live/gramchat.ru/privkey.pem"
        
        # Обновляем конфигурацию nginx
        echo "🔄 Обновление конфигурации nginx..."
        
        # Проверяем конфигурацию
        nginx -t
        
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            echo "✅ Nginx перезагружен с новыми сертификатами!"
        fi
        
        # Настраиваем автоматическое обновление
        echo "⏰ Настройка автоматического обновления сертификатов..."
        
        # Добавляем cron задачу для автообновления
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        
        echo "✅ Автоматическое обновление настроено!"
        echo ""
        echo "📝 Сертификат будет автоматически обновляться каждые 60 дней"
    else
        echo "❌ Ошибка при получении сертификата"
        echo "Проверьте, что вы правильно добавили DNS записи"
    fi
ENDSSH

echo ""
echo "🎯 Альтернативный вариант - использование DNS API (если ваш DNS провайдер поддерживается):"
echo ""
echo "Для автоматической DNS валидации без ручного добавления записей можно использовать:"
echo "  - Cloudflare: certbot-dns-cloudflare"
echo "  - Route53: certbot-dns-route53"
echo "  - DigitalOcean: certbot-dns-digitalocean"
echo "  и другие..."