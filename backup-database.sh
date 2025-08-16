#!/bin/bash

# Database backup script for GramChat
# This script creates timestamped backups of the PostgreSQL database

# Configuration
BACKUP_DIR="/opt/gramchat/backups"
DB_NAME="gramchat_db"
DB_USER="gramchat"
DB_PASSWORD="gramchat_password"
DB_HOST="localhost"
DB_PORT="5432"
CONTAINER_NAME="gramchat_postgres"

# Number of backups to keep (7 days by default)
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/gramchat_backup_${TIMESTAMP}.sql.gz"

echo "🔒 Starting database backup..."
echo "📅 Timestamp: $TIMESTAMP"

# Check if running on server or locally
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Using Docker container: $CONTAINER_NAME"
    
    # Backup from Docker container
    docker exec "$CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists | gzip > "$BACKUP_FILE"
else
    echo "🖥️ Using local PostgreSQL"
    
    # Backup from local PostgreSQL
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists | gzip > "$BACKUP_FILE"
fi

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ Backup successful: $BACKUP_FILE ($FILE_SIZE)"
    
    # Clean up old backups
    echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "gramchat_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # List current backups
    echo "📋 Current backups:"
    ls -lh "$BACKUP_DIR"/gramchat_backup_*.sql.gz 2>/dev/null | tail -5
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "✨ Backup process completed!"