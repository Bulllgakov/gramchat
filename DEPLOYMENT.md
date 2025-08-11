# GramChat - Руководство по деплою и разработке

## 🚀 Быстрый деплой

После внесения изменений в код, используйте:
```bash
./deploy.sh "Описание изменений"
```

Этот скрипт автоматически:
1. Закоммитит все изменения
2. Отправит в GitHub
3. Обновит код на сервере
4. Пересоберет Docker контейнеры
5. Перезапустит приложение

## 📋 Важная информация о проекте

### Доступы
- **Production сайт**: https://web.gramchat.ru
- **Production API**: https://api.gramchat.ru
- **Сервер**: root@217.198.6.80
- **GitHub**: https://github.com/Bulllgakov/gramchat

### Архитектура
- **Frontend**: React + TypeScript + Vite (порт 5173 в Docker)
- **Backend**: Node.js + Express + TypeScript + Prisma (порт 3000)
- **База данных**: PostgreSQL (порт 5432)
- **Кеш**: Redis (порт 6379)
- **Контейнеризация**: Docker + docker-compose

## 🛠 Локальная разработка

### Первоначальная настройка
```bash
# Клонировать репозиторий
git clone https://github.com/Bulllgakov/gramchat.git
cd gramchat

# Запустить базу данных и Redis
docker-compose up -d

# Backend (в первом терминале)
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend (во втором терминале)
cd frontend
npm install
npm run dev
```

### Переменные окружения для локальной разработки

Создайте файл `backend/.env`:
```env
DATABASE_URL="postgresql://gramchat:gramchat_password@localhost:5432/gramchat_db"
NODE_ENV=development
PORT=3000
JWT_SECRET=your-dev-secret-key
SESSION_SECRET=your-dev-session-secret
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
```

## 🔧 Работа с сервером

### SSH доступ
```bash
ssh root@217.198.6.80
```

### Основные команды на сервере
```bash
# Перейти в папку проекта
cd /var/www/gramchat

# Посмотреть логи контейнеров
docker logs gramchat_backend -f
docker logs gramchat_frontend -f

# Перезапустить контейнеры
docker-compose -f docker-compose.production.yml restart

# Пересобрать контейнеры
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Проверить статус
docker ps | grep gramchat
```

## 📝 Важные изменения в коде

### API URLs Configuration
Frontend автоматически определяет API URL в зависимости от окружения:
- **Локально**: использует `/api` (проксируется через Vite на `localhost:3000`)
- **Production**: использует `https://api.gramchat.ru`

Конфигурация находится в `frontend/src/config/api.config.ts`

### Удаление префикса /api
Backend API теперь работает без префикса `/api`:
- Было: `https://api.gramchat.ru/api/auth/me`
- Стало: `https://api.gramchat.ru/auth/me`

### BigInt Serialization
Добавлена глобальная обработка BigInt для JSON в `backend/src/index.ts`:
```javascript
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};
```

## 🐛 Решение частых проблем

### Ошибка 500 при запросах к API
Проверьте логи backend:
```bash
docker logs gramchat_backend --tail 100
```

### Ошибки TypeScript при сборке
В Dockerfile backend используется `npm run build || true` для игнорирования ошибок TS.

### Проблемы с авторизацией
1. Проверьте, что JWT_SECRET одинаковый на сервере и локально
2. Проверьте CORS настройки
3. Убедитесь, что cookies включены в браузере

## 🔐 GitHub настройки

### Personal Access Token
Токен уже настроен в git remote URL для автоматического push.

### Обновление токена (если потребуется)
```bash
git remote set-url origin https://Bulllgakov:НОВЫЙ_ТОКЕН@github.com/Bulllgakov/gramchat.git
```

## 📊 Мониторинг

### Проверка работоспособности
- Health check endpoint: https://api.gramchat.ru/health
- Должен возвращать: `{"status":"ok","timestamp":"..."}`

### Просмотр базы данных
На сервере доступен Adminer (если запущен):
```bash
docker-compose up -d adminer
# Доступен на http://217.198.6.80:8080
```

## 🚨 Экстренный откат

Если что-то пошло не так после деплоя:
```bash
# На сервере
cd /var/www/gramchat
git log --oneline -5  # найти хороший коммит
git reset --hard COMMIT_HASH
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## 📅 Дата последнего обновления
- **Обновлено**: 11 августа 2025
- **Автор изменений**: Claude + Ulat
- **Версия**: Production v1.0