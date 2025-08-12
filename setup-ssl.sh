#!/bin/bash

# =====================================================
# SSL Certificate Setup for GramChat Landing
# =====================================================

echo "🔐 Setting up SSL certificate for gramchat.ru..."

# Run on server
ssh root@217.198.6.80 << 'EOF'
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
certbot --nginx -d gramchat.ru -d www.gramchat.ru --non-interactive --agree-tos --email admin@gramchat.ru

# Update nginx configuration to use SSL
cat > /etc/nginx/sites-available/gramchat-landing << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name gramchat.ru www.gramchat.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name gramchat.ru www.gramchat.ru;

    ssl_certificate /etc/letsencrypt/live/gramchat.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gramchat.ru/privkey.pem;
    
    root /var/www/gramchat-landing;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
NGINX

# Test and reload
nginx -t && systemctl reload nginx

echo "✅ SSL certificate configured successfully!"
echo "🌐 Your landing is now available at https://gramchat.ru"
EOF