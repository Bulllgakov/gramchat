#!/bin/bash

# Server Setup Script for GramChat
# Run this on a fresh Ubuntu/Debian server

set -e

echo "GramChat Server Setup"
echo "====================="

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    netcat-openbsd

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js (for running scripts)
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Setup firewall
echo "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /var/www/gramchat
sudo chown -R $USER:$USER /var/www/gramchat

# Setup Nginx configuration
echo "Setting up Nginx..."
sudo tee /etc/nginx/sites-available/gramchat > /dev/null <<EOF
# API Server
server {
    listen 80;
    server_name api.gramchat.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Web Application
server {
    listen 80;
    server_name web.gramchat.ru;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Landing Page (optional)
server {
    listen 80;
    server_name gramchat.ru www.gramchat.ru;

    root /var/www/gramchat/landing;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/gramchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Create systemd service for auto-start
echo "Creating systemd service..."
sudo tee /etc/systemd/system/gramchat.service > /dev/null <<EOF
[Unit]
Description=GramChat Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/gramchat
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gramchat

echo "Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/gramchat"
echo "2. Copy .env.production.example to .env.production and configure"
echo "3. Run: cd /var/www/gramchat && ./deploy-docker.sh"
echo "4. Setup SSL: sudo certbot --nginx -d api.gramchat.ru -d web.gramchat.ru -d gramchat.ru"
echo ""
echo "Note: You may need to logout and login again for Docker permissions to take effect"