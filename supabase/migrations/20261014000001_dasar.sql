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
