#!/bin/bash

# Database backup script avec rétention
# Usage: ./backup.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=${RETENTION_DAYS:-7}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-citoyenavise}
DB_USER=${DB_USER:-postgres}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/$DB_NAME"_"$TIMESTAMP".sql.gz

# Créer dossier backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $DB_NAME..."

# Exécuter pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --compress=9 \
  --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup successful: $BACKUP_FILE"
  ls -lh "$BACKUP_FILE"

  # Upload to S3 if configured
  if [ ! -z "$AWS_S3_BUCKET" ]; then
    echo "[$(date)] Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
    echo "[$(date)] S3 upload complete"
  fi

  # Cleanup old backups
  echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
  find "$BACKUP_DIR" -name "$DB_NAME"_"*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "[$(date)] Cleanup complete"
else
  echo "[$(date)] Backup failed!"
  exit 1
fi

echo "[$(date)] Done"
