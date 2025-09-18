#!/bin/bash
# Backup script for Trading Bot database

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
MYSQL_CONTAINER="trader-mysql-dev"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️ Creating database backup..."

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$MYSQL_CONTAINER"; then
    echo "❌ MySQL container '$MYSQL_CONTAINER' is not running!"
    echo "Please start the services first: make up"
    exit 1
fi

# Create backup
docker exec "$MYSQL_CONTAINER" mysqldump \
    -u root \
    -prootpassword \
    --single-transaction \
    --routines \
    --triggers \
    trader > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "✅ Backup created: $BACKUP_DIR/backup_$TIMESTAMP.sql"

# Optional: compress the backup
if command -v gzip &> /dev/null; then
    gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    echo "🗜️ Backup compressed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
fi

# Clean up old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
ls -t "$BACKUP_DIR"/backup_*.sql* | tail -n +11 | xargs -r rm
echo "✅ Cleanup completed"
