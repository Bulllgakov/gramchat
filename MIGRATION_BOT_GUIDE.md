# 🚀 Руководство по миграции Shop → Bot

## Что сделано:

### ✅ Backend изменения:
1. **Схема БД обновлена** (`prisma/schema.prisma`)
   - Модель `Shop` заменена на `Bot`
   - Добавлена таблица `BotManager` для связи many-to-many
   - `Dialog.shopId` → `Dialog.botId`

2. **Роуты обновлены:**
   - `/shops/*` → `/bots/*`
   - Добавлен `/bot-manager/*` для управления менеджерами
   - `shop.routes.ts` → `bot.routes.ts`

3. **Сервисы обновлены:**
   - `botManager.ts` работает с моделью Bot
   - `messageHandler.ts` использует botId вместо shopId

4. **Новый функционал:**
   - API для назначения ботов менеджерам
   - Общие инвайт-коды без привязки к ботам

## 📝 Что нужно сделать для запуска:

### 1. Запустить Docker и базу данных:
```bash
cd /home/ulat/gramchat
docker-compose up -d
```

### 2. Применить миграцию:
```bash
cd backend
npx prisma migrate deploy
```

Если миграция не применится автоматически, выполните вручную:
```bash
npx prisma db push --force-reset
```

### 3. Обновить все импорты в других файлах:

#### Файлы, требующие обновления:
- `dialog.routes.ts` - заменить shopId на botId
- `admin.routes.ts` - заменить shop на bot
- `auth.routes.ts` - обновить связи с ботами
- `owner.routes.ts` - убрать старую логику shop
- `analytics.routes.ts` - обновить запросы

### 4. Frontend изменения:

#### Компоненты для обновления:
- `ShopDashboard` → `BotsDashboard`
- `CreateShopForm` → `CreateBotForm`
- `ShopsList` → `BotsList`

#### API вызовы:
```javascript
// Было:
apiService.get('/shops')
apiService.post('/shops')

// Стало:
apiService.get('/bots')
apiService.post('/bots')
apiService.get('/my-bots')
```

### 5. Новый компонент для управления менеджерами:
Уже создан: `frontend/src/components/owner/ManagerBotAssignment.tsx`

## 🔧 Команды для тестирования:

### Запустить backend:
```bash
cd backend
npm run dev
```

### Запустить frontend:
```bash
cd frontend
npm run dev
```

### Проверить миграцию:
```bash
npx prisma studio
```

## ⚠️ Важные изменения в логике:

1. **Инвайт-коды теперь общие:**
   - Владелец создает код
   - Менеджер регистрируется
   - Владелец назначает боты после регистрации

2. **Менеджер может работать с несколькими ботами:**
   - Видит только назначенные боты
   - Может переключаться между ними

3. **Socket.IO rooms:**
   - Было: `shop-${shopId}`
   - Стало: `bot-${botId}`

## 🎯 Следующие шаги:

1. Обновить все оставшиеся файлы с упоминанием Shop
2. Протестировать создание бота
3. Протестировать назначение менеджеров
4. Обновить документацию

## 📊 Структура после миграции:

```
Владелец (User)
    ↓
N Ботов (Bot)
    ↓
N Менеджеров через BotManager
    ↓
Диалоги привязаны к боту (Dialog.botId)
```

## 🐛 Возможные проблемы:

1. **Ошибка миграции:**
   - Сделайте backup БД
   - Используйте `npx prisma db push --force-reset` для сброса

2. **Ошибки TypeScript:**
   - Перегенерируйте Prisma Client: `npx prisma generate`

3. **Frontend не работает:**
   - Очистите кэш браузера
   - Проверьте консоль на ошибки API

## ✨ Новые возможности:

- Владелец может иметь множество ботов
- Гибкое управление доступом менеджеров
- Динамическое назначение/отзыв ботов
- Real-time уведомления при изменении доступа