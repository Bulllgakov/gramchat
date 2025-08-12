#!/bin/bash

# =====================================================
# GramChat Landing Page Deployment Script
# =====================================================

set -e

echo "🚀 Starting GramChat Landing deployment..."

# Configuration
LANDING_DIR="/home/ulat/gramchat/landing"
DEPLOY_DIR="/var/www/gramchat-landing"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SERVER_USER="root"
SERVER_HOST="217.198.6.80"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're running locally or on server
if [[ "$HOSTNAME" == *"gramchat"* ]] || [[ "$PWD" == "/var/www"* ]]; then
    echo "Running on server..."
    IS_SERVER=true
else
    echo "Running locally..."
    IS_SERVER=false
fi

if [ "$IS_SERVER" = false ]; then
    # Deploy from local to server
    print_status "Deploying from local to server..."
    
    # Create deployment directory on server
    print_status "Creating deployment directory on server..."
    ssh $SERVER_USER@$SERVER_HOST "mkdir -p $DEPLOY_DIR"
    
    # Copy landing files to server
    print_status "Copying landing files to server..."
    rsync -avz --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        --exclude '*.log' \
        --exclude 'nginx.conf' \
        --exclude 'deploy-landing.sh' \
        $LANDING_DIR/ $SERVER_USER@$SERVER_HOST:$DEPLOY_DIR/
    
    # Copy nginx configuration
    print_status "Copying nginx configuration..."
    scp $LANDING_DIR/nginx.conf $SERVER_USER@$SERVER_HOST:/tmp/gramchat-landing.conf
    
    # Setup on server
    print_status "Setting up on server..."
    ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
        # Move nginx config
        sudo mv /tmp/gramchat-landing.conf /etc/nginx/sites-available/gramchat-landing
        
        # Create symlink if not exists
        if [ ! -L /etc/nginx/sites-enabled/gramchat-landing ]; then
            sudo ln -s /etc/nginx/sites-available/gramchat-landing /etc/nginx/sites-enabled/
        fi
        
        # Set proper permissions
        sudo chown -R www-data:www-data /var/www/gramchat-landing
        sudo chmod -R 755 /var/www/gramchat-landing
        
        # Test nginx configuration
        sudo nginx -t
        
        # Reload nginx
        sudo systemctl reload nginx
        
        echo "✓ Deployment completed on server!"
ENDSSH
    
else
    # Running directly on server
    print_status "Setting up landing page on server..."
    
    # Create deployment directory
    if [ ! -d "$DEPLOY_DIR" ]; then
        print_status "Creating deployment directory..."
        sudo mkdir -p $DEPLOY_DIR
    fi
    
    # Copy files
    print_status "Copying landing files..."
    sudo cp -r $LANDING_DIR/* $DEPLOY_DIR/
    
    # Copy nginx configuration if it exists
    if [ -f "$LANDING_DIR/nginx.conf" ]; then
        print_status "Installing nginx configuration..."
        sudo cp $LANDING_DIR/nginx.conf $NGINX_SITES/gramchat-landing
        
        # Create symlink if not exists
        if [ ! -L "$NGINX_ENABLED/gramchat-landing" ]; then
            sudo ln -s $NGINX_SITES/gramchat-landing $NGINX_ENABLED/
        fi
    fi
    
    # Set permissions
    print_status "Setting permissions..."
    sudo chown -R www-data:www-data $DEPLOY_DIR
    sudo chmod -R 755 $DEPLOY_DIR
    
    # Test nginx configuration
    print_status "Testing nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        # Reload nginx
        print_status "Reloading nginx..."
        sudo systemctl reload nginx
    else
        print_error "Nginx configuration test failed!"
        exit 1
    fi
fi

print_status "🎉 Landing page deployment completed!"
print_status "Landing page should be available at: https://gramchat.ru"

# Check if SSL certificate exists
if [ "$IS_SERVER" = true ]; then
    if [ ! -f "/etc/letsencrypt/live/gramchat.ru/fullchain.pem" ]; then
        print_warning "SSL certificate not found for gramchat.ru"
        print_warning "To set up SSL, run:"
        print_warning "sudo certbot --nginx -d gramchat.ru -d www.gramchat.ru"
    fi
fi

echo ""
echo "Next steps:"
echo "1. Add images to $DEPLOY_DIR/images/"
echo "2. Update meta tags and SEO information"
echo "3. Set up analytics (Google Analytics, Yandex.Metrika)"
echo "4. Configure SSL if not already done"
echo "5. Test all links and forms"