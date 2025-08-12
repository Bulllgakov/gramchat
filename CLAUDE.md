# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ КРИТИЧЕСКИ ВАЖНО: API Configuration

**НИКОГДА НЕ ИСПОЛЬЗУЙ ПРЕФИКС `/api` В URL!**

- ❌ **НЕПРАВИЛЬНО:** `https://web.gramchat.ru/api/auth/login`
- ✅ **ПРАВИЛЬНО:** `https://api.gramchat.ru/auth/login`

### Правильная конфигурация API:
- **Локальная разработка:** `http://localhost:3000` (БЕЗ префикса /api)
- **Production:** `https://api.gramchat.ru` (поддомен, БЕЗ префикса /api)

### Почему это важно:
1. Backend развернут на отдельном поддомене `api.gramchat.ru`
2. Frontend развернут на `web.gramchat.ru`
3. Использование префикса `/api` приводит к 404 ошибкам
4. Эта ошибка уже исправлялась 3 раза - НЕ ВОЗВРАЩАЙ её!

### Файл конфигурации:
Вся логика API URL находится в файле: `frontend/src/config/api.config.ts`

## 🚀 Quick Deploy
Use `./deploy.sh "commit message"` to automatically deploy changes to production server at 217.198.6.80

## Project Overview

GramChat is a customer support platform that connects Telegram bots with a web-based management interface. It allows businesses to manage customer conversations from Telegram through a professional web dashboard.

**Tech Stack:**
- Backend: Node.js, Express.js, TypeScript, Prisma ORM, Socket.IO
- Frontend: React, TypeScript, Vite, Tailwind CSS, @chatscope/chat-ui-kit-react
- Database: PostgreSQL
- Cache/Sessions: Redis
- Real-time: Socket.IO
- Authentication: JWT tokens via Telegram Login Widget (только Telegram авторизация)

## Development Commands

### Prerequisites
```bash
# Start Docker services (PostgreSQL and Redis)
docker-compose up -d

# Install dependencies (run in both backend and frontend directories)
npm install
```

### Backend Commands
```bash
cd backend

# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm run start

# Database commands
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio GUI
npm run prisma:push        # Push schema changes without migration

# Database is available at:
# - PostgreSQL: localhost:5432 (user: gramchat, password: gramchat_password, db: gramchat_db)
# - Adminer UI: http://localhost:8080
```

### Frontend Commands
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Quick Start (All Services)
```bash
# From project root - starts Docker, runs migrations, and launches both frontend and backend
./start-dev.sh
```

## Architecture Overview

### Database Schema
The system uses Prisma ORM with PostgreSQL. Key models:
- **User**: System users with roles (ADMIN, OWNER, MANAGER)
  - `hasFullAccess`: Boolean field for owner access control
  - `telegramId`: Required for all users (no email/password auth)
  - `inviteCodeId`: Link to used invite code
- **Shop**: Telegram bot instances for businesses
- **Dialog**: Customer conversations from Telegram
- **Message**: Individual messages within dialogs
- **InviteCode**: Registration codes for new users (required for managers)
  - `shopId`: Link invite codes to specific shops for managers
  - `role`: Target role (OWNER, MANAGER)
  - `type`: SINGLE, MULTI, PARTNER
- **Session**: User authentication sessions

### Authentication Flow
**Все пользователи авторизуются только через Telegram Login Widget:**

#### 1. **Владельцы без инвайт-кода:**
   - Могут регистрироваться через Telegram Widget без инвайт-кода
   - Получают `hasFullAccess: false` (ограниченный доступ)
   - **Ограничения:**
     - Не могут отправлять сообщения клиентам
     - Не могут создавать инвайт-коды для менеджеров
     - Могут только просматривать диалоги
   - Требуется одобрение администратора для получения полного доступа

#### 2. **Пользователи с инвайт-кодами (владельцы, менеджеры):**
   - Регистрируются через Telegram Widget с инвайт-кодом
   - Получают `hasFullAccess: true` (полный доступ сразу)
   - **Менеджеры:**
     - Могут авторизоваться ТОЛЬКО через инвайт-коды от владельцев магазинов
     - Email/password авторизация полностью удалена
     - Инвайт-коды привязаны к конкретным магазинам

#### 3. **Процесс одобрения администратором:**
   - Администраторы могут предоставить полный доступ ограниченным владельцам
   - Кнопка "Проверка пройдена" в модальном окне с детальной информацией о пользователе
   - Визуальные индикаторы статуса модерации в списке пользователей

### Real-time Communication
- Socket.IO handles real-time updates for chat messages
- Clients join shop-specific rooms (`shop-${shopId}`)
- New messages trigger events to all connected clients in the shop room

### Bot Management
- Each shop has its own Telegram bot (token stored in DB)
- Bots are automatically initialized on server start
- Messages from Telegram are processed by `messageHandler.ts`
- Responses are sent back through the appropriate bot instance

### Manager Invitation System
**Полностью переработанная система приглашения менеджеров:**

#### Как это работает:
1. **Создание инвайт-кода владельцем:**
   - Только владельцы с `hasFullAccess: true` могут создавать инвайт-коды
   - В интерфейсе: кнопка "Создать инвайт-код" (ранее "Добавить менеджера")
   - Указывается имя, фамилия и комментарий к коду
   - Генерируется одноразовый 8-символьный код

2. **Регистрация менеджера:**
   - Менеджер получает инвайт-код от владельца
   - Использует Telegram Login Widget с полученным кодом
   - Автоматически привязывается к магазину владельца
   - Получает полный доступ сразу после регистрации

3. **Управление доступом:**
   - Кнопка "Новый инвайт-код" для сброса доступа (ранее "Сбросить пароль")
   - Удаление менеджера отвязывает его от магазина
   - Все менеджеры показываются с типом входа "Telegram"

#### Важные изменения:
- ❌ **Удалено:** Email/password авторизация для менеджеров
- ❌ **Удалено:** Прямое создание менеджеров с паролями  
- ✅ **Добавлено:** Система инвайт-кодов для всех менеджеров
- ✅ **Добавлено:** Привязка инвайт-кодов к конкретным магазинам

## Key API Endpoints

### Authentication
- `POST /api/auth/telegram-widget-login` - Telegram Widget login (all users)
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user info
- ~~`POST /api/auth/email-login`~~ - **REMOVED** (no more email/password auth)

### Admin Routes
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get detailed user information
- `PUT /api/admin/users/:id/role` - Change user role
- `PUT /api/admin/users/:id/status` - Toggle user active status
- `PATCH /api/admin/users/:id/grant-access` - Grant full access to owner
- `PATCH /api/admin/users/:id/revoke-access` - Revoke full access from owner
- `GET /api/admin/shops` - List all shops
- `PUT /api/admin/shops/:id/approve` - Approve shop

### Shop Management
- `POST /api/shops` - Create new shop
- `GET /api/shops/:id` - Get shop details
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop
- `GET /api/shops/:id/dialogs` - Get shop dialogs

### Dialog Management
- `GET /api/dialogs/:id` - Get dialog with messages
- `POST /api/dialogs/:id/messages` - Send message to customer
- `PUT /api/dialogs/:id/status` - Update dialog status

### Manager Management (For Owners)
- `POST /api/managers/create` - Create invite code for new manager
- `GET /api/managers/list` - List managers in owner's shop
- `POST /api/managers/reset-access` - Create new invite code for existing manager
- `DELETE /api/managers/:id` - Remove manager from shop
- ~~`POST /api/managers/reset-password`~~ - **REMOVED** (no more passwords)

## Environment Configuration

Required environment variables (create `.env` in backend directory):
```bash
# Database
DATABASE_URL="postgresql://gramchat:gramchat_password@localhost:5432/gramchat_db"

# Application
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=your-secret-jwt-key-change-in-production
SESSION_SECRET=your-secret-session-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173

# Optional: For production webhook mode
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in appropriate file under `backend/src/routes/`
2. Add validation schema using Zod in the handler
3. Implement business logic in a service file under `backend/src/services/`
4. Add middleware for authentication/authorization if needed
5. Update frontend API service to consume the endpoint

### Working with Database
1. Modify schema in `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate dev` to create migration
3. Run `npm run prisma:generate` to update TypeScript types
4. Use Prisma client in code with proper error handling

### Debugging Database Issues
- Check connection: Ensure PostgreSQL is running via `docker-compose ps`
- View logs: `docker-compose logs postgres`
- Access database directly: Use Adminer at http://localhost:8080
- Reset database: `docker-compose down -v && docker-compose up -d`

### Testing Socket.IO Events
1. Connect to Socket.IO server at http://localhost:3000
2. Join a shop room: `socket.emit('join-shop', shopId)`
3. Listen for events: `new-message`, `dialog-updated`, etc.

## Middleware и контроль доступа

### Access Control Middleware
Система использует специальные middleware для контроля доступа:

#### `requireFullAccess` (`ownerAccess.ts:6-36`)
- Проверяет, что владелец имеет полный доступ (`hasFullAccess: true`)
- Используется для:
  - Создания инвайт-кодов для менеджеров
  - Других критических операций владельца
- Администраторы проходят проверку автоматически

#### `canSendMessages` (`ownerAccess.ts:38-68`)
- Проверяет право отправки сообщений
- Блокирует владельцев с `hasFullAccess: false`
- Менеджеры и администраторы могут отправлять сообщения всегда
- Используется в `dialog.routes.ts:166` для POST `/dialogs/:id/messages`

### Frontend Access Control
- **AccessLimitationBanner**: Показывает предупреждение владельцам с ограниченным доступом
- **RestrictedActionTooltip**: Блокирует UI элементы для ограниченных пользователей
- Проверки `hasFullAccess` в компонентах управления

## Error Handling Patterns

The application uses structured error responses:
```typescript
{
  error: string,
  message?: string,
  details?: any
}
```

Always wrap async route handlers with try-catch blocks and use the error middleware for consistent error responses.

## Security Considerations

- All routes except auth endpoints require JWT authentication
- Role-based access control enforced via middleware
- **Access control for owners:**
  - `hasFullAccess: false` - Can only view dialogs (no sending messages, no invite codes)
  - `hasFullAccess: true` - Full functionality (send messages, create invite codes)
  - Owners without invite codes start with limited access
  - Admin approval required for full access (via "Проверка пройдена" button)
- **Manager access control:**
  - Can only authenticate via invite codes from shop owners
  - No email/password authentication available
  - Invite codes link managers to specific shops
- Input validation using Zod schemas
- BigInt serialization handled globally for Telegram IDs
- CORS configured for frontend origin only
- Rate limiting implemented for API endpoints:
  - General: 100 requests per 15 minutes per IP
  - Auth: 5 login attempts per 15 minutes
  - Resource creation: 10 per hour
  - Message sending: 30 per minute
  - API (authenticated): 200 per 15 minutes per user
  - Different limits for different roles (admins get 10x, owners get 2x)
- CSRF protection using double-submit cookie pattern:
  - Automatic token generation and validation
  - Token required for all non-GET requests
  - Frontend auto-refreshes token on 403 CSRF errors
  - Exempt paths: webhooks, health checks

## Dialog Access Rights

### **Owners (OWNER role):**
1. **With full access (`hasFullAccess: true`):**
   - ✅ View ALL shop dialogs (including closed ones)
   - ✅ Send messages to any customer
   - ✅ Transfer dialogs to managers
   - ✅ Create invite codes for managers
   - ✅ Reply to dialogs assigned to managers (with "[Владелец магазина]" prefix)
   - ✅ Access filter "ВСЕ" (ALL) to see all dialogs

2. **With limited access (`hasFullAccess: false`):**
   - ✅ View ALL shop dialogs
   - ❌ CANNOT send messages to customers
   - ❌ CANNOT create invite codes for managers
   - ✅ Access filter "ВСЕ" (ALL) to see all dialogs

### **Managers (MANAGER role):**
- ✅ View ONLY their assigned dialogs and unassigned dialogs
- ✅ Send messages in assigned dialogs
- ✅ Auto-claim unassigned dialogs on first reply
- ❌ CANNOT see dialogs assigned to other managers
- ❌ CANNOT transfer dialogs
- ❌ CANNOT create invite codes
- ❌ NO ACCESS to filter "ВСЕ" (ALL) - only "МОИ" (MY) and "СВОБОДНЫЕ" (UNASSIGNED)

### **Dialog Filters:**
1. **"МОИ" (MY)** - Shows only dialogs assigned to current user
2. **"СВОБОДНЫЕ" (UNASSIGNED)** - Shows only unassigned dialogs
3. **"ВСЕ" (ALL)** - Available ONLY for owners, shows all shop dialogs

### **Auto-assignment Logic:**
- When replying to an unassigned dialog, it's automatically assigned to the responder
- Owners do NOT auto-claim dialogs already assigned to managers
- Managers cannot reply to dialogs assigned to other managers

## Тестирование новой системы авторизации

### Сценарии тестирования:

#### 1. **Регистрация владельца без инвайт-кода:**
- Зайти через Telegram Login Widget без кода
- Проверить `hasFullAccess: false`
- Убедиться, что показывается AccessLimitationBanner
- Проверить, что нельзя отправлять сообщения (кнопка заблокирована)
- Проверить, что нельзя создавать инвайт-коды (требует полного доступа)

#### 2. **Процесс модерации администратором:**
- Войти как администратор (ID: 236692046)
- Найти владельца в списке пользователей 
- Кликнуть "Подробнее" → модальное окно с данными
- Нажать "Проверка пройдена" → `hasFullAccess: true`
- Проверить, что баннер ограничений исчез

#### 3. **Создание инвайт-кода для менеджера:**
- Войти как владелец с полным доступом
- Перейти в "Управление менеджерами"
- Нажать "Создать инвайт-код"
- Заполнить имя, фамилию, комментарий
- Получить 8-символьный код

#### 4. **Регистрация менеджера по инвайт-коду:**
- Использовать полученный инвайт-код в Telegram Login Widget
- Проверить автоматическую привязку к магазину
- Убедиться в получении полного доступа сразу
- Проверить отображение в списке менеджеров

#### 5. **Проверка ограничений доступа:**
- Попытка отправки сообщения ограниченным владельцем → ошибка 403
- Попытка создания инвайт-кода ограниченным владельцем → ошибка 403
- Проверка middleware `canSendMessages` и `requireFullAccess`

### Важные проверки:
- ❌ Email/password форма должна быть полностью удалена
- ✅ Все пользователи авторизуются только через Telegram
- ✅ Менеджеры не могут регистрироваться без инвайт-кодов
- ✅ Визуальные индикаторы статуса модерации работают корректно