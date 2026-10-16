# docs/schema.md — Skema Database Lembaga Miftah al-Lughah

Versi: 0.1 · Tanggal: 2026-10-14 · Mengacu pada PRD.md v0.4 (Fase 1)

Dokumen ini adalah rancangan skema untuk Fase 1: tabel, relasi, constraint, indeks, kebijakan Row Level Security (RLS), dan fungsi database. Fase 2 (peserta login, ujian) hanya disketsakan di bagian 11.

## 1. Status verifikasi

SQL di bagian 6 **sudah dijalankan dan diuji** di PostgreSQL 16 dengan lingkungan yang meniru Supabase (peran `anon` dan `authenticated`, `auth.uid()`, `auth.users`). **70 skenario uji lulus**, mencakup RLS per peran, aturan honor, jendela absen, dan validasi keuangan (daftar di bagian 9).

Yang **belum** diuji: berjalan di proyek Supabase sungguhan, dan integrasi dengan aplikasi Next.js. Lakukan `supabase db reset` dan jalankan ulang tes RLS di lingkungan Supabase lokal sebelum menganggap bagian ini selesai.

## 2. Asumsi

Semua asumsi mudah diganti karena hanya menyentuh satu tempat.

| # | Asumsi | Cara mengubah |
|---|---|---|
| A1 | Sesi tanpa murid terdaftar (`hadir = 0`) mendapat **honor setengah** | Ubah satu ekspresi `case` di `simpan_absensi` |
| A2 | "Atur pembayaran" = hanya mencatat pembayaran (tidak ada tabel tagihan) | Tambah tabel `tagihan` di migrasi baru bila nanti perlu |
| A3 | Rekap menampilkan kas dan pembayaran peserta terpisah; tidak ada penjumlahan otomatis | Hanya urusan query/tampilan |
| A4 | Zona waktu lembaga **Asia/Makassar** (WITA) | `update public.pengaturan set zona_waktu = '...'` |
| A5 | Honor setengah dibulatkan ke bawah ke rupiah penuh | Ubah ekspresi di `simpan_absensi` |
| A6 | Tidak ada data nyata yang dimigrasi dari Sheets (lihat bagian 12) | – |

## 3. Relasi antar tabel

```
auth.users 1──1 profiles (admin/tutor)            auth.users 0..1──1 peserta (Fase 2)
profiles(tutor) 1──* jadwal *──1 kelas 1──* kelas_peserta *──1 peserta
jadwal 1──* sesi (unik per jadwal+tanggal) 1──* absensi_murid *──1 peserta
profiles(tutor) 1──* sesi (salinan tutor saat sesi dibuat)
kategori_kas 1──* kas *──0..1 profiles(tutor)     peserta 1──* pembayaran
pengaturan (1 baris)                               audit_log (dicatat oleh trigger)
```

## 4. Prinsip desain

- Primary key `uuid` (`gen_random_uuid()`). Uang = `bigint` rupiah. Jam = `time`. Tanggal = `date`. Hari = `smallint` ISO (1 = Senin ... 7 = Ahad).
- Semua tabel memakai RLS. Tabel `sesi` dan `absensi_murid` **tidak bisa ditulis langsung** oleh pengguna aplikasi; hanya lewat fungsi database yang menghitung honor dan memeriksa jendela waktu. Dengan begitu aturan bisnis tidak bisa dilewati dari browser.
- `sesi` menyimpan **salinan** `kelas_id`, `tutor_id`, dan `honor_standar` saat sesi dibuat, sehingga riwayat tidak berubah ketika jadwal diubah.
- Data keuangan memakai soft delete (`dihapus_pada`); hak DELETE dicabut.
- Pengguna dinonaktifkan, tidak dihapus (`profiles.aktif`). Pengguna nonaktif otomatis kehilangan semua akses karena fungsi `peran_saya()` hanya mengembalikan peran untuk akun aktif.
- Fungsi `SECURITY DEFINER` selalu memakai `set search_path = ''`, nama objek lengkap (`public.xxx`), dan memeriksa `auth.uid()` sendiri. Hak `EXECUTE` dicabut dari `anon`.
- Kunci `service_role` hanya dipakai di server untuk membuat akun pengguna; tidak pernah di browser.

## 5. Matriks akses

| Tabel / fungsi | admin | tutor | anon |
|---|---|---|---|
| `pengaturan` | baca, ubah | baca | – |
| `profiles` | baca semua, tambah, ubah | baca dirinya sendiri | – |
| `peserta` | semua (tanpa hapus fisik di UI; gunakan `aktif`) | baca peserta di kelas yang ia ampu | – |
| `kelas`, `kelas_peserta` | semua | baca kelas yang ia ampu | – |
| `jadwal` | semua | baca jadwal miliknya; ubah **hanya** tautan Meet lewat `ubah_meet()` | – |
| `sesi`, `absensi_murid` | baca semua | baca miliknya | – |
| tulis `sesi`/`absensi_murid` | lewat `simpan_absensi()`, `koreksi_honor()`, `kunci_sesi()` | lewat `simpan_absensi()` (jadwal miliknya, hari ini, setelah jam mulai, sesi belum dikunci) | – |
| `kategori_kas`, `kas`, `pembayaran` | semua (tanpa DELETE fisik) | **tidak ada akses** | – |
| `saldo_honor()` | semua tutor | dirinya sendiri | – |
| `audit_log` | baca | – | – |

## 6. Rencana migrasi dan SQL

Terapkan sebagai lima file di `supabase/migrations/` dengan urutan berikut (beri awalan timestamp sesuai konvensi Supabase CLI). Setiap file memuat tabelnya **beserta RLS**, sesuai aturan "tidak ada tabel tanpa RLS".

> Migrasi tambahan setelah dokumen ini (lihat `supabase/migrations/`): `20261015000001_validasi_pengaturan.sql` (validasi zona waktu, nama lembaga, audit pengaturan) dan `20261015000002_impor_peserta.sql` (fungsi `impor_peserta(jsonb)`: SECURITY INVOKER, hanya admin, atomik), `20261015000003_cabut_execute_trigger.sql` (fungsi trigger tidak bisa dipanggil lewat API), `20261015000004_pembayaran_masuk_kas.sql` (`kategori_kas.otomatis`, `kas.pembayaran_id`, trigger `sinkron_pembayaran_kas`: pembayaran Lunas menjadi pemasukan kas, D13), `20261016000001_peran_peserta.sql` (nilai enum `peserta`), `20261016000002_akun_peserta.sql` (akun peserta D11: `profiles.wajib_ganti_sandi`, `selesai_ganti_sandi()`, `hubungkan_akun_peserta()`, peran peserta terkunci, `peserta.user_id` hanya ke akun berperan peserta, kebijakan `peserta_baca_diri`; `simpan_absensi`/`ubah_meet` kini menolak peran selain admin/tutor), `20261016000003_ujian.sql` (Sprint 10: `ujian`, `audio_ujian`, `soal`, `soal_kunci` khusus admin, `simpan_soal()` atomik, ujian terbit wajib bersoal, bucket Storage privat `audio-ujian` 10 MB mp3/m4a + kebijakan admin), `20261016000004_mengerjakan_ujian.sql` (Sprint 11: `percobaan_ujian` satu per peserta per ujian, `jawaban`; fungsi `peserta_saya()`, `ujian_saya()`, `mulai_ujian()`, `simpan_jawaban()` (ditolak setelah selesai/batas + toleransi 15 detik), `selesai_ujian()`; batas = least(mulai + durasi, ujian.selesai) dari jam server; soal/audio terbaca peserta hanya selama percobaan aktif; isi soal terkunci setelah ada percobaan, kunci & bobot tetap bisa dikoreksi). Berkas migrasi adalah sumber kebenaran SQL.

### 6.1 `0001_dasar.sql` — enum, pengaturan, profiles, fungsi bantu

```sql
-- 0001_dasar: tipe enum, pengaturan, profiles, fungsi bantu, RLS dasar

create type public.peran_pengguna   as enum ('admin', 'tutor');
create type public.jenis_kas        as enum ('pemasukan', 'pengeluaran');
create type public.status_pembayaran as enum ('lunas', 'belum_lunas');

-- Satu baris konfigurasi lembaga
create table public.pengaturan (
  id           boolean primary key default true check (id),
  nama_lembaga text not null default 'Lembaga Miftah al-Lughah',
  zona_waktu   text not null default 'Asia/Makassar'
);
insert into public.pengaturan default values;

-- Pengguna yang boleh login (admin/tutor). Email dan kata sandi ada di auth.users.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete restrict,
  nama        text not null check (length(btrim(nama)) > 0),
  peran       public.peran_pengguna not null,
  aktif       boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

-- Fungsi bantu. SECURITY DEFINER agar kebijakan RLS pada profiles tidak rekursif.
create function public.peran_saya()
returns public.peran_pengguna
language sql stable security definer set search_path = ''
as $$ select peran from public.profiles where id = auth.uid() and aktif $$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select peran = 'admin' from public.profiles where id = auth.uid() and aktif), false) $$;

create function public.set_diubah_pada()
returns trigger
language plpgsql set search_path = ''
as $$ begin new.diubah_pada := now(); return new; end $$;

revoke all on function public.peran_saya(), public.is_admin() from public, anon;
grant execute on function public.peran_saya(), public.is_admin() to authenticated;

-- RLS
alter table public.pengaturan enable row level security;
alter table public.profiles   enable row level security;

create policy pengaturan_baca on public.pengaturan
  for select to authenticated using ((select public.peran_saya()) is not null);
create policy pengaturan_ubah on public.pengaturan
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy profiles_baca on public.profiles
  for select to authenticated
  using ((select public.is_admin()) or (id = (select auth.uid()) and aktif));
create policy profiles_tambah on public.profiles
  for insert to authenticated with check ((select public.is_admin()));
create policy profiles_ubah on public.profiles
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- Tidak ada kebijakan DELETE: pengguna dinonaktifkan, bukan dihapus.

revoke all on public.pengaturan, public.profiles from anon;
revoke delete on public.pengaturan, public.profiles from authenticated;
```

### 6.2 `0002_master.sql` — peserta, kelas, kelas_peserta, jadwal

```sql
-- 0002_master: peserta, kelas, kelas_peserta, jadwal + RLS

create table public.peserta (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (length(btrim(nama)) > 0),
  aktif       boolean not null default true,
  catatan     text,
  user_id     uuid unique references auth.users (id) on delete restrict, -- disiapkan untuk Fase 2
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now()
);
create trigger peserta_diubah before update on public.peserta
  for each row execute function public.set_diubah_pada();

create table public.kelas (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (length(btrim(nama)) > 0),
  keterangan  text,
  aktif       boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now()
);
create unique index kelas_nama_unik on public.kelas (lower(nama));
create trigger kelas_diubah before update on public.kelas
  for each row execute function public.set_diubah_pada();

create table public.kelas_peserta (
  kelas_id    uuid not null references public.kelas (id)   on delete cascade,
  peserta_id  uuid not null references public.peserta (id) on delete cascade,
  dibuat_pada timestamptz not null default now(),
  primary key (kelas_id, peserta_id)
);
create index kelas_peserta_peserta_idx on public.kelas_peserta (peserta_id);

create table public.jadwal (
  id          uuid primary key default gen_random_uuid(),
  kelas_id    uuid not null references public.kelas (id)    on delete restrict,
  tutor_id    uuid not null references public.profiles (id) on delete restrict,
  hari        smallint not null check (hari between 1 and 7),   -- ISO: 1 = Senin ... 7 = Ahad
  jam_mulai   time not null,
  jam_selesai time not null,
  honor       bigint not null check (honor >= 0),               -- rupiah per sesi
  meet_url    text check (meet_url is null or meet_url ~ '^https://[^[:space:]]+$'),
  aktif       boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now(),
  check (jam_selesai > jam_mulai)
);
create index jadwal_tutor_hari_idx on public.jadwal (tutor_id, hari);
create index jadwal_kelas_idx      on public.jadwal (kelas_id);
create trigger jadwal_diubah before update on public.jadwal
  for each row execute function public.set_diubah_pada();

-- tutor_id harus pengguna berperan tutor
create function public.cek_jadwal()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = new.tutor_id and peran = 'tutor') then
    raise exception 'tutor_id harus pengguna berperan tutor';
  end if;
  return new;
end $$;
create trigger jadwal_cek before insert or update of tutor_id on public.jadwal
  for each row execute function public.cek_jadwal();

-- RLS
alter table public.peserta       enable row level security;
alter table public.kelas         enable row level security;
alter table public.kelas_peserta enable row level security;
alter table public.jadwal        enable row level security;

-- Admin: semua. Tutor: hanya yang terkait jadwal miliknya (baca saja).
create policy peserta_admin on public.peserta
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy peserta_tutor_baca on public.peserta
  for select to authenticated
  using (exists (
    select 1 from public.kelas_peserta kp
    join public.jadwal j on j.kelas_id = kp.kelas_id
    where kp.peserta_id = peserta.id
      and j.tutor_id = (select auth.uid())
      and (select public.peran_saya()) = 'tutor'));

create policy kelas_admin on public.kelas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy kelas_tutor_baca on public.kelas
  for select to authenticated
  using (exists (
    select 1 from public.jadwal j
    where j.kelas_id = kelas.id
      and j.tutor_id = (select auth.uid())
      and (select public.peran_saya()) = 'tutor'));

create policy kelas_peserta_admin on public.kelas_peserta
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy kelas_peserta_tutor_baca on public.kelas_peserta
  for select to authenticated
  using (exists (
    select 1 from public.jadwal j
    where j.kelas_id = kelas_peserta.kelas_id
      and j.tutor_id = (select auth.uid())
      and (select public.peran_saya()) = 'tutor'));

create policy jadwal_admin on public.jadwal
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy jadwal_tutor_baca on public.jadwal
  for select to authenticated
  using (tutor_id = (select auth.uid()) and (select public.peran_saya()) = 'tutor');
-- Tutor tidak punya hak tulis di jadwal; mengubah tautan Meet lewat fungsi ubah_meet() (migrasi 0003).

revoke all on public.peserta, public.kelas, public.kelas_peserta, public.jadwal from anon;
```

### 6.3 `0003_absensi.sql` — sesi, absensi_murid, fungsi absensi dan honor

Bagian paling penting. `simpan_absensi` adalah satu-satunya jalan tutor menulis absensi.

```sql
-- 0003_absensi: sesi, absensi_murid, fungsi penulisan + RLS
-- Tabel ini HANYA ditulis lewat fungsi di bawah (honor dan jendela waktu dihitung di database).

create table public.sesi (
  id              uuid primary key default gen_random_uuid(),
  jadwal_id       uuid not null references public.jadwal (id) on delete restrict,
  kelas_id        uuid not null references public.kelas (id)  on delete restrict,   -- salinan saat sesi dibuat
  tutor_id        uuid not null references public.profiles (id) on delete restrict, -- salinan saat sesi dibuat
  tanggal         date not null,
  honor_standar   bigint not null check (honor_standar >= 0), -- honor jadwal saat sesi disimpan
  hadir           integer not null default 0,
  total           integer not null default 0,
  honor           bigint not null check (honor >= 0),         -- hasil hitung, atau koreksi admin
  honor_dikoreksi boolean not null default false,
  dikunci         boolean not null default false,
  dibuat_pada     timestamptz not null default now(),
  diubah_pada     timestamptz not null default now(),
  unique (jadwal_id, tanggal),
  check (hadir >= 0 and hadir <= total)
);
create index sesi_tutor_tanggal_idx on public.sesi (tutor_id, tanggal desc);
create index sesi_tanggal_idx       on public.sesi (tanggal desc);
create index sesi_kelas_idx         on public.sesi (kelas_id);

create table public.absensi_murid (
  sesi_id    uuid not null references public.sesi (id)    on delete cascade,
  peserta_id uuid not null references public.peserta (id) on delete restrict,
  hadir      boolean not null,
  primary key (sesi_id, peserta_id)
);
create index absensi_murid_peserta_idx on public.absensi_murid (peserta_id);

-- Menyimpan absensi satu sesi. Tutor: hanya jadwal miliknya, hanya hari ini (zona waktu lembaga),
-- dan tidak sebelum jam mulai. Admin: boleh tanggal mana pun (koreksi).
-- p_hadir_ids = daftar peserta yang HADIR; anggota aktif kelas lainnya dicatat tidak hadir.
create function public.simpan_absensi(p_jadwal_id uuid, p_tanggal date, p_hadir_ids uuid[])
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_peran   public.peran_pengguna := public.peran_saya();
  v_jadwal  public.jadwal%rowtype;
  v_sesi    public.sesi%rowtype;
  v_lokal   timestamp;
  v_ids     uuid[];
  v_total   integer;
  v_hadir   integer;
  v_honor   bigint;
  v_sesi_id uuid;
begin
  if v_peran is null then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;

  select * into v_jadwal from public.jadwal where id = p_jadwal_id;
  if not found then
    raise exception 'jadwal tidak ditemukan' using errcode = 'P0002';
  end if;

  select now() at time zone zona_waktu into v_lokal from public.pengaturan;
  if p_tanggal > v_lokal::date then
    raise exception 'tanggal belum tiba';
  end if;

  if v_peran = 'tutor' then
    if v_jadwal.tutor_id <> v_uid then
      raise exception 'bukan jadwal Anda' using errcode = '42501';
    end if;
    if not v_jadwal.aktif then
      raise exception 'jadwal tidak aktif';
    end if;
    if p_tanggal <> v_lokal::date then
      raise exception 'absensi hanya untuk hari ini';
    end if;
    if extract(isodow from p_tanggal)::int <> v_jadwal.hari then
      raise exception 'jadwal ini bukan untuk hari ini';
    end if;
    if v_lokal::time < v_jadwal.jam_mulai then
      raise exception 'belum waktunya absen';
    end if;
  end if;

  select * into v_sesi from public.sesi
   where jadwal_id = p_jadwal_id and tanggal = p_tanggal for update;
  if found and v_sesi.dikunci and v_peran <> 'admin' then
    raise exception 'sesi sudah dikunci';
  end if;

  v_ids := array(select distinct x from unnest(coalesce(p_hadir_ids, '{}'::uuid[])) as x);

  select count(*) into v_total
    from public.kelas_peserta kp join public.peserta p on p.id = kp.peserta_id
   where kp.kelas_id = v_jadwal.kelas_id and p.aktif;

  select count(*) into v_hadir
    from public.kelas_peserta kp join public.peserta p on p.id = kp.peserta_id
   where kp.kelas_id = v_jadwal.kelas_id and p.aktif and kp.peserta_id = any (v_ids);

  if cardinality(v_ids) <> v_hadir then
    raise exception 'daftar hadir memuat peserta yang bukan anggota aktif kelas';
  end if;

  -- Aturan honor: ada yang hadir -> penuh; tidak ada yang hadir -> setengah (dibulatkan ke bawah).
  v_honor := case when v_hadir >= 1 then v_jadwal.honor else v_jadwal.honor / 2 end;

  insert into public.sesi (jadwal_id, kelas_id, tutor_id, tanggal, honor_standar, hadir, total, honor)
  values (v_jadwal.id, v_jadwal.kelas_id, v_jadwal.tutor_id, p_tanggal, v_jadwal.honor, v_hadir, v_total, v_honor)
  on conflict (jadwal_id, tanggal) do update
    set hadir         = excluded.hadir,
        total         = excluded.total,
        honor         = case when public.sesi.honor_dikoreksi then public.sesi.honor         else excluded.honor         end,
        honor_standar = case when public.sesi.honor_dikoreksi then public.sesi.honor_standar else excluded.honor_standar end,
        diubah_pada   = now()
  returning id into v_sesi_id;

  delete from public.absensi_murid where sesi_id = v_sesi_id;
  insert into public.absensi_murid (sesi_id, peserta_id, hadir)
  select v_sesi_id, kp.peserta_id, kp.peserta_id = any (v_ids)
    from public.kelas_peserta kp join public.peserta p on p.id = kp.peserta_id
   where kp.kelas_id = v_jadwal.kelas_id and p.aktif;

  return v_sesi_id;
end $$;

-- Koreksi honor sesi (khusus admin). Setelah dikoreksi, simpan ulang absensi tidak menimpa honor.
create function public.koreksi_honor(p_sesi_id uuid, p_honor bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if p_honor is null or p_honor < 0 then
    raise exception 'honor tidak valid';
  end if;
  update public.sesi set honor = p_honor, honor_dikoreksi = true, diubah_pada = now()
   where id = p_sesi_id;
  if not found then
    raise exception 'sesi tidak ditemukan' using errcode = 'P0002';
  end if;
end $$;

-- Kunci / buka kunci sesi (khusus admin).
create function public.kunci_sesi(p_sesi_id uuid, p_kunci boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  update public.sesi set dikunci = p_kunci, diubah_pada = now() where id = p_sesi_id;
  if not found then
    raise exception 'sesi tidak ditemukan' using errcode = 'P0002';
  end if;
end $$;

-- Tutor hanya boleh mengubah tautan Meet jadwal miliknya (admin: jadwal mana pun).
create function public.ubah_meet(p_jadwal_id uuid, p_url text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_peran public.peran_pengguna := public.peran_saya();
begin
  if v_peran is null then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if v_peran = 'tutor' and not exists (
       select 1 from public.jadwal where id = p_jadwal_id and tutor_id = auth.uid()) then
    raise exception 'bukan jadwal Anda' using errcode = '42501';
  end if;
  update public.jadwal set meet_url = nullif(btrim(p_url), '') where id = p_jadwal_id;
  if not found then
    raise exception 'jadwal tidak ditemukan' using errcode = 'P0002';
  end if;
end $$;

revoke all on function public.simpan_absensi(uuid, date, uuid[]),
                       public.koreksi_honor(uuid, bigint),
                       public.kunci_sesi(uuid, boolean),
                       public.ubah_meet(uuid, text) from public, anon;
grant execute on function public.simpan_absensi(uuid, date, uuid[]),
                          public.koreksi_honor(uuid, bigint),
                          public.kunci_sesi(uuid, boolean),
                          public.ubah_meet(uuid, text) to authenticated;

-- RLS: hanya baca. Tidak ada kebijakan tulis; semua tulis lewat fungsi di atas.
alter table public.sesi          enable row level security;
alter table public.absensi_murid enable row level security;

create policy sesi_baca on public.sesi
  for select to authenticated
  using ((select public.is_admin())
         or (tutor_id = (select auth.uid()) and (select public.peran_saya()) = 'tutor'));

create policy absensi_murid_baca on public.absensi_murid
  for select to authenticated
  using ((select public.is_admin())
         or exists (select 1 from public.sesi s
                    where s.id = absensi_murid.sesi_id
                      and s.tutor_id = (select auth.uid())
                      and (select public.peran_saya()) = 'tutor'));

revoke all on public.sesi, public.absensi_murid from anon;
revoke insert, update, delete on public.sesi, public.absensi_murid from authenticated;
```

### 6.4 `0004_keuangan.sql` — kategori kas, kas, pembayaran, saldo honor

```sql
-- 0004_keuangan: kategori_kas, kas, pembayaran, saldo_honor + RLS (khusus admin)

create table public.kategori_kas (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (length(btrim(nama)) > 0),
  jenis       public.jenis_kas not null,
  butuh_tutor boolean not null default false,  -- true: kas kategori ini wajib memilih tutor
  aktif       boolean not null default true
);
create unique index kategori_kas_nama_unik on public.kategori_kas (lower(nama));

insert into public.kategori_kas (nama, jenis, butuh_tutor) values
  ('Donasi',        'pemasukan',   false),
  ('Infaq',         'pemasukan',   false),
  ('Operasional',   'pengeluaran', false),
  ('Honor Tutor',   'pengeluaran', true),
  ('Honor Pegawai', 'pengeluaran', false);

create table public.kas (
  id           uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  jenis        public.jenis_kas not null,
  kategori_id  uuid not null references public.kategori_kas (id) on delete restrict,
  keterangan   text,
  jumlah       bigint not null check (jumlah > 0),            -- rupiah
  tutor_id     uuid references public.profiles (id) on delete restrict,
  dibuat_oleh  uuid default auth.uid() references public.profiles (id) on delete restrict,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now(),
  dihapus_pada timestamptz                                     -- soft delete
);
create index kas_tanggal_idx on public.kas (tanggal desc)  where dihapus_pada is null;
create index kas_tutor_idx   on public.kas (tutor_id)      where tutor_id is not null and dihapus_pada is null;
create trigger kas_diubah before update on public.kas
  for each row execute function public.set_diubah_pada();

create function public.cek_kas()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_kat public.kategori_kas%rowtype;
begin
  select * into v_kat from public.kategori_kas where id = new.kategori_id;
  if v_kat.jenis <> new.jenis then
    raise exception 'jenis kas tidak sesuai kategori';
  end if;
  if v_kat.butuh_tutor and new.tutor_id is null then
    raise exception 'kategori ini wajib memilih tutor';
  end if;
  if not v_kat.butuh_tutor and new.tutor_id is not null then
    raise exception 'tutor hanya untuk kategori yang membutuhkan tutor';
  end if;
  if new.tutor_id is not null and not exists (
       select 1 from public.profiles where id = new.tutor_id and peran = 'tutor') then
    raise exception 'tutor_id harus pengguna berperan tutor';
  end if;
  return new;
end $$;
create trigger kas_cek before insert or update on public.kas
  for each row execute function public.cek_kas();

create table public.pembayaran (
  id           uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  peserta_id   uuid not null references public.peserta (id) on delete restrict,
  keterangan   text not null check (length(btrim(keterangan)) > 0),  -- SPP, infaq, dst.
  jumlah       bigint not null check (jumlah > 0),                   -- rupiah
  status       public.status_pembayaran not null default 'belum_lunas',
  dibuat_oleh  uuid default auth.uid() references public.profiles (id) on delete restrict,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now(),
  dihapus_pada timestamptz                                           -- soft delete
);
create index pembayaran_peserta_idx on public.pembayaran (peserta_id, tanggal desc) where dihapus_pada is null;
create index pembayaran_status_idx  on public.pembayaran (status, tanggal desc)     where dihapus_pada is null;
create trigger pembayaran_diubah before update on public.pembayaran
  for each row execute function public.set_diubah_pada();

-- Saldo honor tutor = honor sesi terkumpul - honor yang sudah dibayar (kas kategori Honor Tutor).
-- Admin melihat semua tutor; tutor hanya dirinya (tutor tidak boleh membaca tabel kas langsung).
create function public.saldo_honor()
returns table (tutor_id uuid, nama text, honor_terkumpul bigint, honor_dibayar bigint, saldo bigint)
language sql stable security definer set search_path = ''
as $$
  select t.id, t.nama, t.terkumpul, t.dibayar, t.terkumpul - t.dibayar
  from (
    select p.id, p.nama,
           coalesce((select sum(s.honor)  from public.sesi s
                      where s.tutor_id = p.id), 0)::bigint as terkumpul,
           coalesce((select sum(k.jumlah) from public.kas k
                      where k.tutor_id = p.id and k.dihapus_pada is null), 0)::bigint as dibayar
    from public.profiles p
    where p.peran = 'tutor'
      and (public.is_admin() or (p.id = auth.uid() and public.peran_saya() = 'tutor'))
  ) t
  order by t.nama
$$;

revoke all on function public.saldo_honor() from public, anon;
grant execute on function public.saldo_honor() to authenticated;

-- RLS: semua khusus admin
alter table public.kategori_kas enable row level security;
alter table public.kas          enable row level security;
alter table public.pembayaran   enable row level security;

create policy kategori_kas_admin on public.kategori_kas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy kas_admin on public.kas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy pembayaran_admin on public.pembayaran
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.kategori_kas, public.kas, public.pembayaran from anon;
-- Soft delete: tidak ada DELETE fisik untuk data keuangan.
revoke delete on public.kategori_kas, public.kas, public.pembayaran from authenticated;
```

### 6.5 `0005_audit.sql` — log audit

```sql
-- 0005_audit: log audit untuk tindakan penting

create table public.audit_log (
  id          bigint generated always as identity primary key,
  waktu       timestamptz not null default now(),
  pengguna_id uuid,                              -- auth.uid() pelaku; null bila lewat service role/SQL
  tabel       text not null,
  baris_id    text,
  aksi        text not null check (aksi in ('INSERT', 'UPDATE', 'DELETE')),
  sebelum     jsonb,
  sesudah     jsonb
);
create index audit_log_tabel_baris_idx on public.audit_log (tabel, baris_id);
create index audit_log_waktu_idx       on public.audit_log (waktu desc);

create function public.catat_audit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log (pengguna_id, tabel, baris_id, aksi, sebelum, sesudah)
  values (
    auth.uid(),
    tg_table_name,
    case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger audit_profiles   after insert or update or delete on public.profiles
  for each row execute function public.catat_audit();
create trigger audit_jadwal     after insert or update or delete on public.jadwal
  for each row execute function public.catat_audit();
create trigger audit_sesi       after insert or update or delete on public.sesi
  for each row execute function public.catat_audit();
create trigger audit_kas        after insert or update or delete on public.kas
  for each row execute function public.catat_audit();
create trigger audit_pembayaran after insert or update or delete on public.pembayaran
  for each row execute function public.catat_audit();

alter table public.audit_log enable row level security;
create policy audit_log_baca on public.audit_log
  for select to authenticated using ((select public.is_admin()));

revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;
```

## 7. Cara aplikasi memakai database

- **Membuat pengguna (admin saja):** route server memakai `service_role` untuk membuat akun lewat Supabase Auth (undangan email), lalu menambah baris `profiles` dengan `peran`. Akun Auth tanpa baris `profiles` aktif **tidak punya akses apa pun** (semua kebijakan memeriksa `profiles`).
- **Absen:** klien memanggil `supabase.rpc('simpan_absensi', { p_jadwal_id, p_tanggal, p_hadir_ids })`. Tutor mengirim daftar peserta yang **hadir**; anggota aktif kelas lainnya otomatis tercatat tidak hadir. Pesan error berbahasa Indonesia dapat ditampilkan langsung (di-map di UI).
- **Honor:** `koreksi_honor`, `kunci_sesi`, `ubah_meet`, `saldo_honor` dipanggil lewat `rpc`. Total honor per bulan dihitung dengan query `sum(honor)` pada `sesi` (tutor hanya melihat miliknya karena RLS).
- **Soft delete:** semua query `kas` dan `pembayaran` wajib menyertakan `dihapus_pada is null`. Menghapus = `update ... set dihapus_pada = now()`.
- **Tipe TypeScript:** hasilkan dengan `supabase gen types typescript`.

## 8. Menyiapkan admin pertama

1. Buat satu pengguna di Supabase Auth (dasbor atau CLI), catat `id`-nya.
2. Jalankan sekali sebagai pemilik database (bukan dari aplikasi):
   ```sql
   insert into public.profiles (id, nama, peran) values ('<UUID-AUTH-USER>', 'Administrator', 'admin');
   ```
3. Matikan pendaftaran publik di pengaturan Auth Supabase.
4. Pengguna berikutnya dibuat dari halaman Pengguna oleh admin.

## 9. Skenario uji yang sudah lulus (70)

Dijalankan sebagai peran `authenticated` dengan `request.jwt.claim.sub` berbeda-beda, ditambah `anon`.

- **Aturan honor:** hadir 2 dari 3 → penuh; hadir 0 → setengah; honor ganjil dibulatkan ke bawah; simpan ulang memperbarui sesi yang sama (tetap satu baris); peserta nonaktif tidak dihitung; koreksi admin tidak tertimpa saat tutor menyimpan ulang.
- **Jendela absen:** kemarin ditolak; besok ditolak; sebelum jam mulai ditolak; jadwal hari lain ditolak; jadwal tutor lain ditolak; sesi terkunci ditolak untuk tutor; admin boleh tanggal lampau tetapi tidak tanggal yang belum tiba; tutor nonaktif ditolak.
- **Integritas:** peserta di luar kelas atau nonaktif ditolak di daftar hadir; jadwal tidak boleh memakai admin sebagai tutor; jam selesai harus setelah jam mulai; hari 1–7; URL Meet harus `https`.
- **RLS tutor:** tidak melihat `kas`, `pembayaran`, `kategori_kas`, `audit_log`; hanya melihat profil, jadwal, kelas, dan peserta yang terkait dirinya; tidak melihat sesi/absensi tutor lain; tidak bisa INSERT/UPDATE langsung ke `sesi`; tidak bisa mengubah honor jadwal; tidak bisa mengubah perannya sendiri; tidak bisa menulis `kas`, `pembayaran`, `peserta`; tidak bisa memanggil `koreksi_honor` dan `kunci_sesi`.
- **RLS anon:** ditolak di semua tabel dan fungsi.
- **Keuangan:** jenis harus cocok kategori; Honor Tutor wajib memilih tutor; kategori biasa tidak boleh memilih tutor; admin tidak bisa dipilih sebagai tutor; jumlah harus > 0; pembayaran honor mengurangi saldo; DELETE fisik ditolak; kas yang di-soft-delete tidak dihitung; tutor hanya melihat saldonya sendiri meski tidak bisa membaca `kas`.
- **Audit:** perubahan `sesi` dan `kas` tercatat beserta pelakunya; log tidak bisa diubah; tutor tidak bisa membacanya.

Skrip ujinya berbentuk SQL biasa (`psql`), bukan pgTAP. Saat implementasi, Claude Code sebaiknya mengonversinya menjadi tes `supabase/tests/` (pgTAP) dengan skenario yang sama.

## 10. Indeks

| Indeks | Untuk |
|---|---|
| `jadwal (tutor_id, hari)`, `jadwal (kelas_id)` | daftar jadwal hari ini per tutor; RLS tutor |
| `sesi unique (jadwal_id, tanggal)` | satu sesi per jadwal per tanggal; upsert |
| `sesi (tutor_id, tanggal desc)`, `sesi (tanggal desc)`, `sesi (kelas_id)` | honor per tutor per bulan; dashboard admin hari ini |
| `kelas_peserta (peserta_id)` (+ PK `(kelas_id, peserta_id)`) | daftar kelas peserta; RLS tutor |
| `absensi_murid (peserta_id)` | riwayat kehadiran per murid |
| `pembayaran (peserta_id, tanggal desc)` dan `(status, tanggal desc)` (parsial, belum dihapus) | riwayat per peserta; filter Belum Lunas |
| `kas (tanggal desc)`, `kas (tutor_id)` (parsial, belum dihapus) | rekap bulanan; saldo honor |
| `audit_log (tabel, baris_id)`, `(waktu desc)` | menelusuri riwayat satu baris |
| `kelas (lower(nama))`, `kategori_kas (lower(nama))` unik | mencegah nama ganda |

Pencarian nama peserta memakai `ilike` biasa; pada skala lembaga kecil ini cukup. Tambahkan indeks `pg_trgm` hanya jika terbukti lambat.

## 11. Fase 2 (sketsa, jangan diimplementasikan dulu)

- `peserta.user_id` sudah ada. Fase 2 menambah peran `peserta` pada enum `peran_pengguna` dan kebijakan baca terbatas untuk datanya sendiri (jadwal kelasnya, pembayarannya, nilainya).
- Tabel baru: `ujian`, `soal`, `soal_kunci`, `percobaan_ujian`, `jawaban`. **Kunci jawaban disimpan di `soal_kunci` yang tidak punya kebijakan baca untuk peserta**; penilaian pilihan ganda dilakukan di fungsi `SECURITY DEFINER`. Timer ditegakkan di server (`mulai_pada`, `batas_selesai`).
- Menambah nilai enum perlu dilakukan di migrasi tersendiri.

## 12. Migrasi data dari Google Sheets

Tidak ada migrasi untuk Fase 1: file beta berisi data uji, dan hash kata sandi lamanya tidak boleh dibawa. Bila nanti ada data nyata (daftar kelas dan peserta), gunakan impor CSV satu kali lewat skrip server yang: membuat UUID baru (ID lama bercampur dan awalan `K` dipakai tiga tabel sekaligus), membersihkan tipe (angka dan jam yang tersimpan sebagai teks), lalu mencocokkan relasi lewat nama.

## 13. Batasan dan risiko yang diketahui

- **Catatan peserta terlihat tutor.** Tutor dapat membaca kolom `peserta.catatan` untuk murid di kelasnya. Jangan menyimpan hal sensitif di kolom itu; jika perlu, pisahkan ke tabel khusus admin.
- **Daftar murid sesi di-*snapshot* saat disimpan.** Menyimpan ulang sesi (misalnya koreksi admin di kemudian hari) memakai keanggotaan kelas saat itu, sehingga `total` bisa berubah bila anggota kelas sudah berubah. Menonaktifkan peserta juga mengubah `total` pada penyimpanan ulang.
- **Bentrok jadwal tidak dicegah.** Dua jadwal tutor yang sama pada jam yang beririsan diperbolehkan. Tambahkan exclusion constraint bila lembaga memintanya.
- **Zona waktu harus nama IANA yang valid** (misalnya `Asia/Makassar`). Nilai salah akan membuat tutor gagal absen. Validasi di form pengaturan.
- **Fungsi `SECURITY DEFINER` di skema `public` terekspos sebagai RPC.** Risikonya ditutup dengan pencabutan `EXECUTE` dari `anon` dan pemeriksaan `auth.uid()` di setiap fungsi. Jangan menambah fungsi baru tanpa pola yang sama.
- **`audit_log.pengguna_id` kosong** untuk perubahan lewat SQL langsung atau `service_role`.
- **Uji perilaku waktu** memakai jam sistem; satu uji ("belum waktunya") bergantung pada jadwal berjam mulai 23:59:00 dan bisa salah hanya bila dijalankan tepat pada menit itu.
- Skema belum diuji pada proyek Supabase sungguhan (lihat bagian 1).
