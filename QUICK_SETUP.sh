#!/bin/bash

echo "================================================"
echo "БЫСТРАЯ НАСТРОЙКА ДЕПЛОЯ GRAMCHAT"
echo "================================================"
echo ""
echo "ШАГ 1: ДОБАВЬТЕ ПУБЛИЧНЫЙ КЛЮЧ НА СЕРВЕР"
echo "----------------------------------------"
echo "Выполните в терминале с SSH подключением к серверу:"
echo ""
echo 'ssh root@217.198.6.80 "echo \"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCioaHYaCBJMB5tZBL6XucC34O0fyFQrmgOs9uY/zSd2fzQcTa4I4NGIj47C0ig+jYM4eI/9NJZd0C/wdPMOq7q4OSTCVAUj7nq2U3SczeKJ93/Lzko6hoSBLGJOfsYZACc85Xx+FAmgcOPcmBnSqLlCF1XSITDtvEimep0H1ceZEqQ0HHQq4PwS/frHeNWWEkLIa2TLiJ4KcT1eoSzLfcZr7fiSHqM4xvL9zKjh2QDKAo2bD7WWiB0LggvvoRtqHr2YDQsqh4qarHkyTo08HBf3aWiVVn7CPyZ030S9y0Wv1fCJaxs6u1oKPNUjQ0Sd4+GvOUNfWEuGRao/WBg8yhG2KrJnknjmag7NRmBIuffcsOacgDyXLMEUpQyDpAHHcNnjCE+1TuxaGkBfVZj+Ayv32sDTGX00T8J7Ogq25mpb71Y2PEYJhDyC7W0e7LQdomJPhvnhPJSosYt9Wajc40/om5DVqvAevHeMVwfkwqaYYPaY9CDhDppUU6bo9GZTd9seCiYgjae4sbRPs/Z3h2li49FN9HYgh5mIV902V8Flh0cdl2KaBiWj4va3eoANq0QpmhsCw4Cw4LgPhmqOmPkZyhjy5Cz04iMmHPssFizTcYB+wyDnYjuagJO54n7UIJq2VmmBoE2mIzwxAOBEueuLKCDJhK5CRS+1IoXMNv3tQ== github-actions@gramchat\" >> ~/.ssh/authorized_keys"'
echo ""
echo ""
echo "ШАГ 2: ДОБАВЬТЕ ПРИВАТНЫЙ КЛЮЧ В GITHUB"
echo "----------------------------------------"
echo "1. Откройте: https://github.com/Bulllgakov/gramchat/settings/secrets/actions/new"
echo "2. Name: SSH_PRIVATE_KEY"
echo "3. Value: скопируйте содержимое ниже (всё между BEGIN и END):"
echo ""
cat ~/.ssh/gramchat_deploy
echo ""
echo ""
echo "ШАГ 3: ЗАГРУЗИТЕ КОД НА GITHUB"
echo "-------------------------------"
echo "Выполните эти команды:"
echo ""
echo "git add ."
echo "git commit -m \"Setup GitHub Actions deployment\""
echo "git push origin main"
echo ""
echo ""
echo "ШАГ 4: НАСТРОЙТЕ СЕРВЕР"
echo "------------------------"
echo "В терминале с SSH подключением к серверу выполните:"
echo ""
cat << 'EOF'
# Установка необходимого ПО
apt update
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx

# Клонирование проекта
mkdir -p /var/www/gramchat
cd /var/www/gramchat
git clone https://github.com/Bulllgakov/gramchat.git .

# Создание .env.production
cp .env.production.example .env.production
nano .env.production
# Отредактируйте файл, установите пароли и ключи!

# Первый запуск
docker-compose -f docker-compose.production.yml up -d postgres redis
sleep 10
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
cd ..
EOF
echo ""
echo ""
echo "ШАГ 5: ЗАПУСТИТЕ АВТОМАТИЧЕСКИЙ ДЕПЛОЙ"
echo "---------------------------------------"
echo "После выполнения всех шагов:"
echo "1. Откройте: https://github.com/Bulllgakov/gramchat/actions"
echo "2. Выберите 'Deploy to Production'"
echo "3. Нажмите 'Run workflow'"
echo ""
echo "================================================"