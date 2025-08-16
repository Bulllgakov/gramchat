#!/bin/bash

# Check if commit message is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh \"commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 Starting deployment..."
echo "📝 Commit message: $COMMIT_MESSAGE"

# Add all changes
git add -A

# Commit changes
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Deploy to server
echo "🖥️ Deploying to server..."
sshpass -p "${SERVER_PASSWORD:-e2+U-1.kbgL#gX}" ssh -o StrictHostKeyChecking=no ulat@217.198.6.80 << 'ENDSSH'
cd /home/ulat/gramchat
echo "📥 Pulling latest changes..."
git pull origin main

echo "🔧 Installing backend dependencies..."
cd backend
npm install

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "🔧 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🏗️ Building frontend..."
npm run build

echo "📁 Updating landing files..."
cd ..
sudo cp -r landing/* /var/www/gramchat-landing/

echo "🐳 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build

echo "✅ Deployment complete!"
ENDSSH

echo "🎉 Deployment finished successfully!"
