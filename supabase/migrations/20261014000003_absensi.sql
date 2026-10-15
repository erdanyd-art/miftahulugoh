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
