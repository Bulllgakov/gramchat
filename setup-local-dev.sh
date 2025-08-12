#!/bin/bash

echo "🚀 Настройка локальной разработки GramChat"
echo "=========================================="
echo ""
echo "⚠️  ВАЖНО: Больше НЕ используем префикс /api!"
echo "   Frontend (localhost:5173) -> Backend (localhost:3000)"
echo ""

# Создаем .env файл для backend если его нет
if [ ! -f backend/.env ]; then
    echo "📝 Создаем .env файл для backend..."
    cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://gramchat:gramchat_password@localhost:5432/gramchat_db

# Application
NODE_ENV=development
PORT=3000

# JWT Secret
JWT_SECRET=your-secret-jwt-key-change-in-production

# Session Secret
SESSION_SECRET=your-secret-session-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379

# CORS - разрешаем запросы с frontend
CORS_ORIGIN=http://localhost:5173

# Telegram Bot for Authentication
TELEGRAM_AUTH_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_AUTH_BOT_USERNAME=your_bot_username

# First admin Telegram ID
FIRST_ADMIN_TELEGRAM_ID=236692046
EOF
    echo "✅ .env файл создан"
fi

# Запускаем Docker контейнеры
echo "🐳 Запускаем Docker контейнеры (PostgreSQL и Redis)..."
docker-compose up -d

# Ждем пока база данных запустится
echo "⏳ Ждем запуска базы данных..."
sleep 5

# Backend setup
echo "📦 Устанавливаем зависимости backend..."
cd backend
npm install

echo "🔧 Генерируем Prisma Client..."
npm run prisma:generate

echo "🗄️ Запускаем миграции базы данных..."
npm run prisma:migrate

echo "🚀 Запускаем backend сервер на http://localhost:3000"
npm run dev &

cd ..

# Frontend setup
echo "📦 Устанавливаем зависимости frontend..."
cd frontend
npm install

echo "🎨 Запускаем frontend сервер на http://localhost:5173"
npm run dev &

cd ..

echo ""
echo "✅ Локальная разработка настроена!"
echo ""
echo "📍 Доступ к сервисам:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo "   Adminer (DB UI): http://localhost:8080"
echo ""
echo "⚠️  НАПОМИНАНИЕ: Все API запросы идут напрямую на localhost:3000 БЕЗ префикса /api"
echo ""
echo "💡 Для остановки всех сервисов используйте: docker-compose down"