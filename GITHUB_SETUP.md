# 🚀 Настройка GitHub Actions для автоматического деплоя

## Шаг 1: Генерация SSH ключа (на локальной машине)

```bash
# Генерируем SSH ключ для деплоя
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gramchat_deploy -N ""

# Показываем приватный ключ (понадобится для GitHub)
cat ~/.ssh/gramchat_deploy

# Показываем публичный ключ (понадобится для сервера)
cat ~/.ssh/gramchat_deploy.pub
```

## Шаг 2: Добавление публичного ключа на сервер

Подключитесь к серверу и выполните:
```bash
ssh root@217.198.6.80

# На сервере добавьте публичный ключ
echo "ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Шаг 3: Добавление секретов в GitHub

1. Откройте репозиторий: https://github.com/Bulllgakov/gramchat
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте секрет:
   - Name: `SSH_PRIVATE_KEY`
   - Value: (вставьте содержимое приватного ключа из `cat ~/.ssh/gramchat_deploy`)

## Шаг 4: Первоначальная настройка сервера

```bash
# Подключаемся к серверу
ssh root@217.198.6.80

# Создаем директорию для проекта
mkdir -p /var/www/gramchat
cd /var/www/gramchat

# Клонируем репозиторий
git clone https://github.com/Bulllgakov/gramchat.git .

# Устанавливаем Docker (если еще не установлен)
curl -fsSL https://get.docker.com | sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Устанавливаем Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Устанавливаем nginx
apt install -y nginx certbot python3-certbot-nginx

# Создаем .env.production
cp .env.production.example .env.production
nano .env.production
```

### Важно отредактировать .env.production:
```env
DATABASE_URL="postgresql://gramchat:STRONG_PASSWORD_HERE@postgres:5432/gramchat_db"
JWT_SECRET=your-32-char-random-string-here
SESSION_SECRET=another-32-char-random-string-here
CORS_ORIGIN=https://web.gramchat.ru
VITE_API_URL=https://api.gramchat.ru
ADMIN_TELEGRAM_IDS=236692046
```

## Шаг 5: Настройка Nginx

```bash
# Создаем конфигурацию nginx
nano /etc/nginx/sites-available/gramchat
```

Скопируйте содержимое из файла `nginx-config.txt`

```bash
# Активируем сайт
ln -s /etc/nginx/sites-available/gramchat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Получаем SSL сертификаты
certbot --nginx -d api.gramchat.ru -d web.gramchat.ru -d gramchat.ru
```

## Шаг 6: Запуск деплоя

### Вариант А: Автоматический (при push в main)
```bash
# Коммитим и пушим изменения
git add .
git commit -m "Setup GitHub Actions deployment"
git push origin main
```

### Вариант Б: Ручной запуск
1. Откройте: https://github.com/Bulllgakov/gramchat/actions
2. Выберите workflow "Deploy to Production"
3. Нажмите "Run workflow"

## Проверка деплоя

После деплоя проверьте:
- API: https://api.gramchat.ru
- Web: https://web.gramchat.ru
- Логи в GitHub Actions: https://github.com/Bulllgakov/gramchat/actions

## Отслеживание на сервере

```bash
# Смотрим логи Docker
docker-compose -f docker-compose.production.yml logs -f

# Проверяем статус
docker-compose -f docker-compose.production.yml ps
```