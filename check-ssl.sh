#!/bin/bash

ssh root@217.198.6.80 << 'ENDSSH'
    echo "📋 Проверка SSL конфигурации..."
    
    # Проверяем наличие SSL конфигов
    echo "SSL конфиги в sites-enabled:"
    ls -la /etc/nginx/sites-enabled/ | grep -E "(ssl|443)"
    
    echo ""
    echo "Конфигурации с SSL:"
    grep -l "listen 443\|ssl_certificate" /etc/nginx/sites-enabled/* 2>/dev/null
    
    echo ""
    echo "Проверка SSL для web.gramchat.ru:"
    grep -A10 -B2 "server_name.*web.gramchat.ru" /etc/nginx/sites-enabled/* | grep -E "(listen|ssl_|server_name)"
ENDSSH