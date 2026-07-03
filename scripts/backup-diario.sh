#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-$(pwd)}"
BACKUP_ROOT="${2:-$PROJECT_ROOT/backups}"
KEEP_DAYS="${3:-30}"

DATA_DIR="$PROJECT_ROOT/data"
if [[ ! -d "$DATA_DIR" ]]; then
  echo "Pasta data nao encontrada: $DATA_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_ROOT/pulceiras-backup-$TIMESTAMP.tar.gz"

FILES=()
for f in participants.json organizers.json audit-log.jsonl event-config.json; do
  if [[ -f "$DATA_DIR/$f" ]]; then
    FILES+=("$f")
  fi
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "Nenhum ficheiro de dados encontrado para backup." >&2
  exit 1
fi

(
  cd "$DATA_DIR"
  tar -czf "$ARCHIVE" "${FILES[@]}"
)

find "$BACKUP_ROOT" -type f -name 'pulceiras-backup-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup criado: $ARCHIVE"
