#!/bin/bash

echo "🚀 Manual deployment script"
echo "⚠️  Этот скрипт требует ручного ввода паролей"

# Проверка аргумента с сообщением коммита
if [ -z "$1" ]; then
    echo "❌ Укажите сообщение коммита!"
    echo "Использование: ./deploy-manual.sh \"Описание изменений\""
    exit 1
fi

# Коммит локально
echo "📦 Коммит изменений локально..."
git add .
git commit -m "$1"

# Push в GitHub (потребуется ввести credentials)
echo "📤 Отправка в GitHub (введите ваш GitHub username и Personal Access Token)..."
git push origin main

echo ""
echo "📝 Теперь подключитесь к серверу вручную и выполните:"
echo "ssh root@217.198.6.80"
echo ""
echo "После подключения выполните эти команды:"
cat << 'EOF'
cd /var/www/gramchat
git pull origin main
cd backend
npm install --production
rm -rf dist/
npx tsc || true
cd ..
docker-compose -f docker-compose.production.yml build backend frontend
docker-compose -f docker-compose.production.yml up -d
docker ps | grep gramchat
EOF