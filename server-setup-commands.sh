#!/bin/bash

# ======================================
# GramChat Server Setup Commands
# Выполните эти команды на сервере 217.198.6.80
# ======================================

echo "=== GramChat Server Setup ==="
echo "Server: 217.198.6.80"
echo ""

# 1. Подключитесь к серверу
echo "1. Подключение к серверу:"
echo "   ssh root@217.198.6.80"
echo ""

# 2. Создайте директорию и распакуйте архив (если использовали архив)
echo "2. Если использовали архив:"
echo "   mkdir -p /var/www/gramchat"
echo "   cd /var/www/gramchat"
echo "   tar -xzf /root/gramchat-deploy.tar.gz"
echo ""

# 3. Или клонируйте из Git
echo "3. Или клонируйте из Git:"
echo "   cd /var/www"
echo "   git clone https://github.com/Bulllgakov/gramchat.git"
echo "   cd gramchat"
echo ""

# 4. Установка базового ПО
echo "4. Установка необходимого ПО:"
echo "   # Обновление системы"
echo "   apt update && apt upgrade -y"
echo ""
echo "   # Установка Docker"
echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
echo "   sh get-docker.sh"
echo "   rm get-docker.sh"
echo ""
echo "   # Установка Docker Compose"
echo "   curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-x86_64\" -o /usr/local/bin/docker-compose"
echo "   chmod +x /usr/local/bin/docker-compose"
echo ""
echo "   # Установка Node.js 20"
echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
echo "   apt-get install -y nodejs"
echo ""
echo "   # Установка nginx и certbot"
echo "   apt install -y nginx certbot python3-certbot-nginx"
echo ""

# 5. Настройка environment
echo "5. Настройка environment переменных:"
echo "   cd /var/www/gramchat"
echo "   cp .env.production.example .env.production"
echo "   nano .env.production"
echo ""
echo "   Обязательно измените:"
echo "   - DATABASE_URL с паролем"
echo "   - JWT_SECRET (случайная строка 32+ символа)"
echo "   - SESSION_SECRET (случайная строка 32+ символа)"
echo "   - CORS_ORIGIN=https://web.gramchat.ru"
echo "   - VITE_API_URL=https://api.gramchat.ru"
echo ""

# 6. Запуск Docker контейнеров
echo "6. Запуск базы данных и Redis:"
echo "   docker-compose -f docker-compose.production.yml up -d postgres redis"
echo "   sleep 10"
echo ""

# 7. Установка зависимостей и сборка
echo "7. Установка зависимостей и сборка проекта:"
echo "   # Backend"
echo "   cd backend"
echo "   npm ci"
echo "   npm run build"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "   cd .."
echo ""
echo "   # Frontend"
echo "   cd frontend"
echo "   npm ci"
echo "   VITE_API_URL=https://api.gramchat.ru npm run build"
echo "   cd .."
echo ""

# 8. Запуск приложения
echo "8. Запуск приложения:"
echo "   docker-compose -f docker-compose.production.yml up -d"
echo ""

# 9. Настройка Nginx
echo "9. Настройка Nginx:"
echo "   # Создайте файл /etc/nginx/sites-available/gramchat"
echo "   nano /etc/nginx/sites-available/gramchat"
echo ""
echo "   # Скопируйте конфигурацию из файла nginx-config.txt"
echo "   # Затем активируйте сайт:"
echo "   ln -s /etc/nginx/sites-available/gramchat /etc/nginx/sites-enabled/"
echo "   nginx -t"
echo "   systemctl reload nginx"
echo ""

# 10. SSL сертификаты
echo "10. Получение SSL сертификатов:"
echo "    certbot --nginx -d api.gramchat.ru -d web.gramchat.ru -d gramchat.ru --non-interactive --agree-tos -m admin@gramchat.ru"
echo ""

echo "=== Готово! ==="
echo "API доступен: https://api.gramchat.ru"
echo "Web приложение: https://web.gramchat.ru"
echo "Лендинг: https://gramchat.ru"