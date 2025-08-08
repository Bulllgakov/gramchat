#!/bin/bash

# GramChat Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
REMOTE_USER="your_user"
REMOTE_HOST="your_server_ip"
REMOTE_PATH="/var/www/gramchat"

echo "Starting deployment to $ENVIRONMENT..."

# Build frontend with production API URL
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build backend
echo "Building backend..."
cd backend
npm ci
npm run build
npm run prisma:generate
cd ..

# Create deployment archive
echo "Creating deployment archive..."
tar -czf gramchat-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env \
  --exclude=.env.local \
  --exclude=dist \
  --exclude=uploads \
  backend frontend docker-compose.production.yml .env.production.example

# Upload to server
echo "Uploading to server..."
scp gramchat-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Execute deployment on server
echo "Executing deployment on server..."
ssh $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
  cd /var/www/gramchat
  
  # Backup current deployment
  if [ -d "current" ]; then
    mv current backup-$(date +%Y%m%d-%H%M%S)
  fi
  
  # Extract new deployment
  mkdir current
  tar -xzf gramchat-deploy.tar.gz -C current/
  cd current
  
  # Install dependencies and build
  cd backend
  npm ci --only=production
  npx prisma generate
  npx prisma migrate deploy
  cd ..
  
  cd frontend
  npm ci --only=production
  cd ..
  
  # Restart services
  docker-compose -f docker-compose.production.yml down
  docker-compose -f docker-compose.production.yml up -d --build
  
  echo "Deployment completed!"
ENDSSH

# Cleanup
rm gramchat-deploy.tar.gz

echo "Deployment to $ENVIRONMENT completed successfully!"