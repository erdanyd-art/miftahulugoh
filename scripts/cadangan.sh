#!/usr/bin/env bash
# Cadangan database produksi (data skema public + auth) ke folder DI LUAR repositori (repo ini publik).
# Butuh: Docker Desktop menyala dan proyek sudah `npx supabase link`. Pemakaian: npm run cadangan
set -euo pipefail
export PATH="$HOME/.docker/bin:$PATH"
[ -S "$HOME/.docker/run/docker.sock" ] && export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"

TUJUAN="${CADANGAN_DIR:-$HOME/Documents/Cadangan-Miftah}"
TGL=$(date +%Y-%m-%d)
mkdir -p "$TUJUAN"
chmod 700 "$TUJUAN"

npx supabase db dump --linked --data-only --schema public,auth -f "$TUJUAN/data-$TGL.sql"
chmod 600 "$TUJUAN/data-$TGL.sql"

# Simpan 8 cadangan terbaru (sekitar 2 bulan bila mingguan).
ls -1t "$TUJUAN"/data-*.sql | tail -n +9 | while read -r lama; do rm -- "$lama"; done

echo "Cadangan tersimpan: $TUJUAN/data-$TGL.sql ($(du -h "$TUJUAN/data-$TGL.sql" | cut -f1))"
