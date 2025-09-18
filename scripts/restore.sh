#!/bin/bash
# Restore script for Trading Bot database

set -e

BACKUP_FILE="$1"
MYSQL_CONTAINER="trader-mysql-dev"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: $0 <backup_file>"
    echo "Example: $0 backups/backup_20231120_143022.sql"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

echo "🔄 Restoring database from $BACKUP_FILE..."

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$MYSQL_CONTAINER"; then
    echo "❌ MySQL container '$MYSQL_CONTAINER' is not running!"
    echo "Please start the services first: make up"
    exit 1
fi

# Handle compressed files
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Detected compressed backup file"
    gunzip -c "$BACKUP_FILE" | docker exec -i "$MYSQL_CONTAINER" mysql -u root -prootpassword trader
else
    docker exec -i "$MYSQL_CONTAINER" mysql -u root -prootpassword trader < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully from $BACKUP_FILE"
