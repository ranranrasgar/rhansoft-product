#!/usr/bin/env bash
# Update toko Rhansoft di VPS: backup -> pull -> build -> migrasi -> jalankan -> cek.
# Pakai:  cd /opt/rhansoft-store && bash update.sh
#
# Aman untuk sistem lain di server: hanya menyentuh proyek docker compose "rhansoft-store".
# Tidak pernah memakai `down -v`, `prune`, atau `git reset`.
set -euo pipefail

cd "$(dirname "$0")"

DB_CONTAINER="${DB_CONTAINER:-rhansoft-store-db}"
WEB_CONTAINER="${WEB_CONTAINER:-rhansoft-store-web}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-rhansoft_store}"
BRANCH="${BRANCH:-main}"
KEEP_BACKUPS="${KEEP_BACKUPS:-7}"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31mGAGAL: %s\033[0m\n' "$*" >&2; exit 1; }

trap 'die "berhenti di baris $LINENO. Cek pesan di atas; database aman (backup ada di backups/)."' ERR

psql_db() { docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" "$@"; }

# ── 0. Pemeriksaan awal ─────────────────────────────────────────
step "Pemeriksaan awal"
[ -f docker-compose.yml ] || die "docker-compose.yml tidak ada di $(pwd)"
git rev-parse --git-dir >/dev/null 2>&1 || die "bukan repo git"
if ! git diff --quiet || ! git diff --cached --quiet; then
  git status --short
  die "ada perubahan di file yang dilacak git. Periksa dulu (git status / git diff); skrip tidak menimpanya."
fi
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || die "container $DB_CONTAINER tidak ditemukan"

avail_mb=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo)
echo "Memori tersedia: ${avail_mb} MB"
if [ "$avail_mb" -lt 1024 ]; then
  read -r -p "Memori tersedia kurang dari 1 GB, build bisa berat. Lanjut? [y/N] " ans
  [ "$ans" = "y" ] || die "dibatalkan"
fi

# ── 1. Backup database ──────────────────────────────────────────
step "Backup database"
mkdir -p backups
backup="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
( umask 077; docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$backup" )
[ -s "$backup" ] || die "backup kosong: $backup"
echo "Backup: $backup ($(du -h "$backup" | cut -f1))"
# simpan hanya backup terbaru
ls -1t backups/backup-*.sql 2>/dev/null | tail -n +"$((KEEP_BACKUPS + 1))" | xargs -r rm -f --

# ── 2. Tarik kode ───────────────────────────────────────────────
step "Tarik kode terbaru ($BRANCH)"
before=$(git rev-parse --short HEAD)
git pull --ff-only origin "$BRANCH"
echo "HEAD: $before -> $(git rev-parse --short HEAD)"

# ── 3. Build image (container lama tetap jalan selama build) ────
step "Build image api & web"
docker compose build

# ── 4. Migrasi database (hanya yang belum pernah dijalankan) ────
step "Migrasi database"
psql_db -q -c "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW());"
applied_any=0
for f in app/server/db/migrations/*.sql; do
  [ -e "$f" ] || continue
  name=$(basename "$f")
  done_already=$(psql_db -tA -c "SELECT 1 FROM schema_migrations WHERE name = '$name'")
  if [ -z "$done_already" ]; then
    echo "Jalankan: $name"
    psql_db -q -1 < "$f"
    psql_db -q -c "INSERT INTO schema_migrations (name) VALUES ('$name');"
    applied_any=1
  fi
done
[ "$applied_any" = 1 ] || echo "Tidak ada migrasi baru."

# ── 5. Jalankan ─────────────────────────────────────────────────
step "Jalankan container"
docker compose up -d

# ── 6. Cek hasil ────────────────────────────────────────────────
step "Pengecekan"
docker compose ps
proxy=$(docker exec "$WEB_CONTAINER" grep -cE "location[ ^~]*/api/" /etc/nginx/conf.d/default.conf || true)
[ "$proxy" = "1" ] || die "proxy /api tidak ada di nginx web (hasil: $proxy). Cek app/nginx.conf dan app/Dockerfile."
sleep 5
docker exec "$WEB_CONTAINER" wget -qO- http://127.0.0.1/api/health | grep -q '"status":"ok"' \
  || die "API tidak menjawab sehat lewat web. Cek: docker compose logs --tail=50 api"

printf '\n\033[1;32mSelesai.\033[0m Buka situs dan tekan Ctrl+Shift+R. Backup: %s\n' "$backup"
