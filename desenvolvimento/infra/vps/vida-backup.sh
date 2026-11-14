#!/bin/sh
# /opt/vida/backup.sh — cópia do mundo da Ilha da Vida (cron do root: de hora em hora). Guarda 3 dias de cópias por hora.
# Os .sqlite são copiados pela API de backup do SQLite (cópia consistente com o servidor ligado); o resto, como está.
set -u
umask 077   # o mundo leva auth.sqlite (hashes das senhas dos jogadores)
DEST=/opt/vida/backups
TMP=$(mktemp -d /opt/vida/.backup-XXXXXX) || exit 1
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$DEST"
cp -a /opt/vida/mundo "$TMP/mundo" || { echo "backup da vida: cópia falhou" >&2; exit 1; }
for db in /opt/vida/mundo/*.sqlite; do
  [ -f "$db" ] || continue
  python3 -c 'import sqlite3,sys
o=sqlite3.connect("file:"+sys.argv[1]+"?mode=ro",uri=True); d=sqlite3.connect(sys.argv[2]); o.backup(d); d.close(); o.close()' \
    "$db" "$TMP/mundo/$(basename "$db")" || { echo "backup da vida: $db falhou" >&2; exit 1; }
done
ARQ="$DEST/mundo-$(date +%Y%m%d-%H).tar.gz"
if ! tar -czf "$ARQ" -C "$TMP" mundo || ! gzip -t "$ARQ" 2>/dev/null; then rm -f "$ARQ"; echo "backup da vida falhou" >&2; exit 1; fi
find "$DEST" -name 'mundo-*.tar.gz' -mmin +4320 -delete
