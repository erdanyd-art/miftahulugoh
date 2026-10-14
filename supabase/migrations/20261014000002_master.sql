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
