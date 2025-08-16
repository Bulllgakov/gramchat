# Настройка Nginx для документов

## Для сервера gramchat.ru

Добавьте в конфигурацию nginx для домена gramchat.ru (обычно в `/etc/nginx/sites-available/gramchat`):

```nginx
# Проксирование документов с основного домена на API
location /docs/ {
    proxy_pass https://api.gramchat.ru/docs/;
    proxy_http_version 1.1;
    proxy_set_header Host api.gramchat.ru;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Кеширование для статических документов
    proxy_cache_bypass $http_upgrade;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Применение изменений

После добавления конфигурации:

1. Проверьте конфигурацию:
```bash
sudo nginx -t
```

2. Перезагрузите nginx:
```bash
sudo nginx -s reload
```

## Проверка

После настройки документы будут доступны по адресам:
- https://gramchat.ru/docs/terms - Пользовательское соглашение
- https://gramchat.ru/docs/privacy - Политика конфиденциальности
- https://gramchat.ru/docs/offer - Договор оферты
- https://gramchat.ru/docs/requisites - Реквизиты компании

## Локальная разработка

Локально документы доступны напрямую через backend:
- http://localhost:3000/docs/terms
- http://localhost:3000/docs/privacy
- http://localhost:3000/docs/offer
- http://localhost:3000/docs/requisites