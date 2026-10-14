# Lembaga Miftah al-Lughah — Dashboard

Dashboard administrasi untuk admin dan tutor Lembaga Miftah al-Lughah (pengganti Google Sheets).
Kebutuhan: [PRD.md](PRD.md) · Skema: [docs/schema.md](docs/schema.md) · Rencana kerja: [docs/roadmap.md](docs/roadmap.md) · Keamanan: [docs/security-checklist.md](docs/security-checklist.md)

## Prasyarat

- Node.js 24 (lihat `.nvmrc`)
- Docker Desktop (atau OrbStack) yang sedang berjalan, untuk Supabase lokal

## Menjalankan di komputer sendiri

```bash
npm install
npx supabase start          # menyalakan Supabase lokal (Docker), mencetak URL dan kunci
cp .env.example .env.local  # lalu isi dari keluaran `npx supabase status`
npm run dev                 # http://localhost:3000
```

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test                    # tes unit (Vitest)
npx supabase test db        # tes RLS/aturan bisnis (pgTAP), butuh Supabase lokal menyala
npm run build
```

CI GitHub Actions menjalankan lint, typecheck, tes unit, dan build pada setiap PR.

## Rahasia

`.env*` tidak pernah di-commit (kecuali `.env.example` yang kosong). `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server dan tidak boleh berawalan `NEXT_PUBLIC_`.
