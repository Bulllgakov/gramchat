# Настройка локальных поддоменов для GramChat

## Конфигурация системы

### 1. Настройка /etc/hosts (Linux/Mac) или C:\Windows\System32\drivers\etc\hosts (Windows)

Добавьте следующие строки:

```
# GramChat local development
127.0.0.1       api.localhost
127.0.0.1       web.localhost
```

### 2. Проверка настройки

```bash
# Проверка резолвинга
ping api.localhost
ping web.localhost
```

## Запуск проекта

### Backend (api.localhost:3000)

```bash
cd backend
npm run dev
# Будет доступен на http://api.localhost:3000
```

### Frontend (web.localhost:5173)

```bash
cd frontend
npm run dev
# Будет доступен на http://web.localhost:5173
```

## Структура URL

### Локальная разработка:
- **Frontend:** http://web.localhost:5173
- **Backend API:** http://api.localhost:3000
- **WebSocket:** ws://api.localhost:3000

### Production:
- **Frontend:** https://web.gramchat.ru
- **Backend API:** https://api.gramchat.ru
- **WebSocket:** wss://api.gramchat.ru

## Проверка работы

1. Откройте браузер и перейдите на http://web.localhost:5173
2. Откройте консоль разработчика (F12)
3. Проверьте, что API запросы идут на http://api.localhost:3000
4. Проверьте, что WebSocket подключается к ws://api.localhost:3000

## Возможные проблемы

### CORS ошибки
Убедитесь, что в backend/.env установлено:
```
CORS_ORIGIN=http://web.localhost:5173
```

### Не работает резолвинг
- Перезапустите браузер после изменения /etc/hosts
- Очистите кэш DNS: 
  - Linux: `sudo systemctl restart systemd-resolved`
  - Mac: `sudo dscacheutil -flushcache`
  - Windows: `ipconfig /flushdns`

### Порт занят
Если порты 3000 или 5173 заняты, измените их в соответствующих конфигурациях:
- Backend: PORT в .env файле
- Frontend: port в vite.config.ts

## Преимущества использования поддоменов локально

1. **Консистентность** - такая же структура как в production
2. **Безопасность** - правильная работа с cookies и CORS
3. **Тестирование** - более точная эмуляция production окружения
4. **Множественные проекты** - легко различать разные сервисы