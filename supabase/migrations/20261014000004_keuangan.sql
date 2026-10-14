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
