-- 0011_akun_peserta: akun login peserta (D11). Admin membuat akun dengan kata sandi awal acak;
-- peserta wajib menggantinya saat masuk pertama. Peserta hanya membaca profil dan data pesertanya sendiri.

-- 1) Fungsi lama menganggap "bukan tutor" = admin. Kini peran selain admin/tutor ditolak.
create or replace function public.simpan_absensi(p_jadwal_id uuid, p_tanggal date, p_hadir_ids uuid[])
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
  if v_peran is null or v_peran not in ('admin', 'tutor') then
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

create or replace function public.ubah_meet(p_jadwal_id uuid, p_url text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_peran public.peran_pengguna := public.peran_saya();
begin
  if v_peran is null or v_peran not in ('admin', 'tutor') then
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

-- 2) Kewajiban ganti kata sandi (diisi saat akun dibuat / sandi direset admin)
alter table public.profiles add column wajib_ganti_sandi boolean not null default false;

-- Dipanggil server setelah kata sandi berhasil diganti. Hanya menyentuh profil sendiri.
create function public.selesai_ganti_sandi()
returns void language sql security definer set search_path = ''
as $$ update public.profiles set wajib_ganti_sandi = false where id = auth.uid() and wajib_ganti_sandi $$;
revoke all on function public.selesai_ganti_sandi() from public, anon;
grant execute on function public.selesai_ganti_sandi() to authenticated;

-- 3) Peran peserta tidak bisa berpindah ke/dari peran staf (mencegah akun murid menjadi admin)
create function public.cek_profil_peran()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.peran is distinct from old.peran and 'peserta' in (old.peran, new.peran) then
    raise exception 'peran peserta tidak bisa diubah';
  end if;
  return new;
end $$;
create trigger profiles_cek_peran before update of peran on public.profiles
  for each row execute function public.cek_profil_peran();

-- 4) peserta.user_id hanya boleh menunjuk akun berperan peserta
create function public.cek_peserta_akun()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.user_id is not null and not exists (
       select 1 from public.profiles where id = new.user_id and peran = 'peserta') then
    raise exception 'akun peserta harus berperan peserta';
  end if;
  return new;
end $$;
create trigger peserta_cek_akun before insert or update of user_id on public.peserta
  for each row execute function public.cek_peserta_akun();

revoke all on function public.cek_profil_peran(), public.cek_peserta_akun() from public, anon, authenticated;

-- 5) Admin menghubungkan akun Auth yang baru dibuat ke peserta (atomik: profil + tautan).
-- SECURITY INVOKER: RLS admin tetap berlaku dan audit mencatat admin sebagai pelaku.
create function public.hubungkan_akun_peserta(p_peserta_id uuid, p_user_id uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_nama text;
begin
  if not public.is_admin() then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  select nama into v_nama from public.peserta where id = p_peserta_id and user_id is null for update;
  if not found then
    raise exception 'peserta tidak ditemukan atau sudah punya akun';
  end if;
  insert into public.profiles (id, nama, peran, wajib_ganti_sandi) values (p_user_id, v_nama, 'peserta', true);
  update public.peserta set user_id = p_user_id where id = p_peserta_id;
end $$;
revoke all on function public.hubungkan_akun_peserta(uuid, uuid) from public, anon;
grant execute on function public.hubungkan_akun_peserta(uuid, uuid) to authenticated;

-- 6) Peserta membaca baris pesertanya sendiri (profil sendiri sudah lewat profiles_baca)
create policy peserta_baca_diri on public.peserta
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.peran_saya()) = 'peserta');
