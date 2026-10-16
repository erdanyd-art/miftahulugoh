-- 0013_mengerjakan_ujian: peserta mengerjakan ujian (Sprint 11; D11, D12, D14).
-- Semua aturan waktu ditegakkan di database memakai jam server (now()), bukan jam perangkat.
-- Peserta tidak pernah menulis tabel langsung: mulai/simpan/selesai lewat fungsi SECURITY DEFINER.
-- Soal dan audio hanya terbaca selama percobaannya aktif; soal_kunci tetap khusus admin.

-- Toleransi jaringan untuk jawaban terakhir yang dikirim tepat saat waktu habis.
create function public.toleransi_jawaban() returns interval
language sql immutable set search_path = '' as $$ select interval '15 seconds' $$;

create table public.percobaan_ujian (
  id            uuid primary key default gen_random_uuid(),
  ujian_id      uuid not null references public.ujian (id) on delete restrict,
  peserta_id    uuid not null references public.peserta (id) on delete restrict,
  mulai_pada    timestamptz not null default now(),
  batas_selesai timestamptz not null,
  selesai_pada  timestamptz,
  unique (ujian_id, peserta_id), -- satu kali percobaan per peserta per ujian (PRD 6.2)
  check (batas_selesai > mulai_pada)
);
create index percobaan_peserta_idx on public.percobaan_ujian (peserta_id);

create table public.jawaban (
  id             uuid primary key default gen_random_uuid(),
  percobaan_id   uuid not null references public.percobaan_ujian (id) on delete cascade,
  soal_id        uuid not null references public.soal (id) on delete restrict,
  pilihan        smallint check (pilihan between 0 and 5),
  isian          text check (isian is null or length(isian) <= 5000),
  disimpan_pada  timestamptz not null default now(),
  unique (percobaan_id, soal_id)
);
create index jawaban_soal_idx on public.jawaban (soal_id);

-- Peserta (aktif, akun aktif) milik pengguna yang sedang masuk.
create function public.peserta_saya()
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.id from public.peserta p join public.profiles pr on pr.id = p.user_id
   where p.user_id = auth.uid() and p.aktif and pr.aktif and pr.peran = 'peserta'
$$;

-- Daftar ujian terbit untuk kelas peserta, beserta status percobaannya. Tanpa soal, tanpa kunci.
create function public.ujian_saya()
returns table (
  id uuid, judul text, keterangan text, kelas text, mulai timestamptz, selesai timestamptz,
  durasi_menit integer, jumlah_soal bigint, percobaan_id uuid, batas_selesai timestamptz,
  selesai_pada timestamptz, sekarang timestamptz)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.judul, u.keterangan, k.nama, u.mulai, u.selesai, u.durasi_menit,
         (select count(*) from public.soal s where s.ujian_id = u.id),
         pu.id, pu.batas_selesai, pu.selesai_pada, now()
    from public.ujian u
    join public.kelas k on k.id = u.kelas_id
    left join public.percobaan_ujian pu on pu.ujian_id = u.id and pu.peserta_id = public.peserta_saya()
   where u.terbit
     and exists (select 1 from public.kelas_peserta kp
                  where kp.kelas_id = u.kelas_id and kp.peserta_id = public.peserta_saya())
   order by u.mulai desc
$$;

create function public.mulai_ujian(p_ujian_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_peserta uuid := public.peserta_saya();
  v_ujian   public.ujian%rowtype;
  v_id      uuid;
begin
  if v_peserta is null then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  select * into v_ujian from public.ujian where id = p_ujian_id and terbit;
  if not found or not exists (select 1 from public.kelas_peserta
                               where kelas_id = v_ujian.kelas_id and peserta_id = v_peserta) then
    raise exception 'ujian tidak ditemukan' using errcode = 'P0002';
  end if;

  select id into v_id from public.percobaan_ujian where ujian_id = p_ujian_id and peserta_id = v_peserta;
  if found then
    return v_id; -- melanjutkan percobaan yang sama (mis. setelah memuat ulang halaman)
  end if;

  if now() < v_ujian.mulai then
    raise exception 'ujian belum dibuka';
  end if;
  if now() >= v_ujian.selesai then
    raise exception 'ujian sudah ditutup';
  end if;
  if not exists (select 1 from public.soal where ujian_id = p_ujian_id) then
    raise exception 'ujian belum punya soal';
  end if;

  insert into public.percobaan_ujian (ujian_id, peserta_id, batas_selesai)
  values (p_ujian_id, v_peserta, least(now() + make_interval(mins => v_ujian.durasi_menit), v_ujian.selesai))
  returning id into v_id;
  return v_id;
end $$;

-- Simpan (atau kosongkan) jawaban satu soal. Ditolak setelah selesai / waktu habis.
create function public.simpan_jawaban(p_percobaan_id uuid, p_soal_id uuid, p_pilihan integer, p_isian text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_pc   public.percobaan_ujian%rowtype;
  v_soal public.soal%rowtype;
begin
  select * into v_pc from public.percobaan_ujian
   where id = p_percobaan_id and peserta_id = public.peserta_saya();
  if not found then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if v_pc.selesai_pada is not null or now() > v_pc.batas_selesai + public.toleransi_jawaban() then
    raise exception 'waktu ujian sudah habis';
  end if;
  select * into v_soal from public.soal where id = p_soal_id and ujian_id = v_pc.ujian_id;
  if not found then
    raise exception 'soal tidak ditemukan' using errcode = 'P0002';
  end if;

  if v_soal.jenis = 'pilihan_ganda' then
    if p_isian is not null or (p_pilihan is not null and (p_pilihan < 0 or p_pilihan >= cardinality(v_soal.opsi))) then
      raise exception 'jawaban tidak valid';
    end if;
  elsif p_pilihan is not null or length(p_isian) > 5000 then
    raise exception 'jawaban tidak valid';
  end if;

  insert into public.jawaban (percobaan_id, soal_id, pilihan, isian)
  values (p_percobaan_id, p_soal_id, p_pilihan, nullif(p_isian, ''))
  on conflict (percobaan_id, soal_id) do update
    set pilihan = excluded.pilihan, isian = excluded.isian, disimpan_pada = now();
end $$;

create function public.selesai_ujian(p_percobaan_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.percobaan_ujian
     set selesai_pada = least(now(), batas_selesai)
   where id = p_percobaan_id and peserta_id = public.peserta_saya() and selesai_pada is null;
  if not found and not exists (select 1 from public.percobaan_ujian
                                where id = p_percobaan_id and peserta_id = public.peserta_saya()) then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
end $$;

-- Isi soal yang dilihat peserta tidak boleh ditambah/dihapus/diubah setelah ada peserta yang mulai.
-- Bobot dan kunci jawaban (soal_kunci) tetap boleh dikoreksi admin.
create function public.cek_soal_terkunci()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and (new.ujian_id, new.urutan, new.jenis, new.pertanyaan, new.opsi, new.audio_id)
         is not distinct from (old.ujian_id, old.urutan, old.jenis, old.pertanyaan, old.opsi, old.audio_id) then
    return new;
  end if;
  if exists (select 1 from public.percobaan_ujian
              where ujian_id = coalesce(new.ujian_id, old.ujian_id) or ujian_id = old.ujian_id) then
    raise exception 'ujian sudah dikerjakan peserta';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger soal_terkunci before insert or update or delete on public.soal
  for each row execute function public.cek_soal_terkunci();

revoke all on function public.toleransi_jawaban(), public.peserta_saya(), public.ujian_saya(),
  public.mulai_ujian(uuid), public.simpan_jawaban(uuid, uuid, integer, text), public.selesai_ujian(uuid)
  from public, anon;
grant execute on function public.toleransi_jawaban(), public.peserta_saya(), public.ujian_saya(),
  public.mulai_ujian(uuid), public.simpan_jawaban(uuid, uuid, integer, text), public.selesai_ujian(uuid)
  to authenticated;
revoke all on function public.cek_soal_terkunci() from public, anon, authenticated;

-- RLS
alter table public.percobaan_ujian enable row level security;
alter table public.jawaban         enable row level security;

create policy percobaan_admin_baca on public.percobaan_ujian
  for select to authenticated using ((select public.is_admin()));
create policy percobaan_peserta_baca on public.percobaan_ujian
  for select to authenticated using (peserta_id = (select public.peserta_saya()));
create policy jawaban_admin_baca on public.jawaban
  for select to authenticated using ((select public.is_admin()));
create policy jawaban_peserta_baca on public.jawaban
  for select to authenticated
  using (exists (select 1 from public.percobaan_ujian pu
                  where pu.id = jawaban.percobaan_id and pu.peserta_id = (select public.peserta_saya())));

-- Soal & audio: peserta hanya selama percobaannya aktif (belum selesai dan belum lewat batas).
create policy soal_peserta_aktif on public.soal
  for select to authenticated
  using (exists (select 1 from public.percobaan_ujian pu
                  where pu.ujian_id = soal.ujian_id and pu.peserta_id = (select public.peserta_saya())
                    and pu.selesai_pada is null and now() < pu.batas_selesai));
create policy audio_ujian_peserta_aktif on public.audio_ujian
  for select to authenticated
  using (exists (select 1 from public.percobaan_ujian pu
                  where pu.ujian_id = audio_ujian.ujian_id and pu.peserta_id = (select public.peserta_saya())
                    and pu.selesai_pada is null and now() < pu.batas_selesai));
-- Berkas audio: boleh dibuat tautan putarnya bila barisnya terbaca (admin, atau peserta yang sedang mengerjakan).
create policy audio_ujian_berkas_baca_peserta on storage.objects
  for select to authenticated
  using (bucket_id = 'audio-ujian'
         and exists (select 1 from public.audio_ujian a where a.path = storage.objects.name));

revoke all on public.percobaan_ujian, public.jawaban from anon;
revoke insert, update, delete on public.percobaan_ujian, public.jawaban from authenticated;
