#!/bin/bash

  echo "🚀 Deploying to production server..."

  # Проверка аргумента с сообщением коммита
  if [ -z "$1" ]; then
      echo "❌ Укажите сообщение коммита!"
      echo "Использование: ./deploy.sh \"Описание изменений\""
      exit 1
  fi

  # Коммит и пуш в GitHub
  echo "📦 Отправка изменений в GitHub..."
  git add .
  git commit -m "$1"
  git push origin main

  # Деплой на сервер
  echo "🔄 Обновление на сервере..."
  ssh root@217.198.6.80 << 'ENDSSH'
      cd /var/www/gramchat
      echo "📥 Получение изменений из GitHub..."
      git pull origin main

      echo "🔨 Пересборка backend..."
      cd backend
      npm install --production
      rm -rf dist/
      npx tsc || true
      cd ..

      echo "🐳 Перезапуск Docker контейнеров..."
      docker-compose -f docker-compose.production.yml build backend frontend
      docker-compose -f docker-compose.production.yml up -d

      echo "✅ Деплой завершен!"
      docker ps | grep gramchat
  ENDSSH

  echo "✨ Готово! Проверьте сайт: https://web.gramchat.ru"
