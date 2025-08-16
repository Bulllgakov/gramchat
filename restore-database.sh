#!/bin/bash

# Database restore script for GramChat
# This script restores a PostgreSQL database from a backup

# Configuration
BACKUP_DIR="/opt/gramchat/backups"
DB_NAME="gramchat_db"
DB_USER="gramchat"
DB_PASSWORD="gramchat_password"
DB_HOST="localhost"
DB_PORT="5432"
CONTAINER_NAME="gramchat_postgres"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "📋 Available backups:"
    ls -lh "$BACKUP_DIR"/gramchat_backup_*.sql.gz 2>/dev/null
    echo ""
    echo "Usage: ./restore-database.sh <backup_file>"
    echo "Example: ./restore-database.sh $BACKUP_DIR/gramchat_backup_20240816_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace all current data in the database!"
echo "📁 Restoring from: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled."
    exit 0
fi

echo "🔄 Starting database restore..."

# Stop backend to prevent connections during restore
echo "⏸️ Stopping backend service..."
docker stop gramchat_backend 2>/dev/null || true

# Check if running on server or locally
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Using Docker container: $CONTAINER_NAME"
    
    # Restore to Docker container
    gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql \
        -U "$DB_USER" \
        -d "$DB_NAME"
else
    echo "🖥️ Using local PostgreSQL"
    
    # Restore to local PostgreSQL
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME"
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    
    # Restart backend
    echo "▶️ Starting backend service..."
    docker start gramchat_backend 2>/dev/null || true
    
    echo "✨ Restore process completed!"
else
    echo "❌ Restore failed!"
    
    # Try to restart backend anyway
    docker start gramchat_backend 2>/dev/null || true
    
    exit 1
fi