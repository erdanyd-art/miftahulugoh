-- 0014_penilaian: penilaian ujian (Sprint 12; PRD 6.2, D14).
-- Pilihan ganda dinilai di database saat dibaca (koreksi kunci langsung berlaku).
-- Isian diperiksa admin atau tutor pengampu kelas ujian; skor 0..bobot soal, tercatat di audit.
-- Nilai akhir = (skor pilihan ganda + skor isian) / total bobot x 100.
-- Peserta melihat nilainya sendiri setelah admin mengumumkan (hanya setelah ujian ditutup), tanpa kunci per soal.

alter table public.ujian add column diumumkan_pada timestamptz;

alter table public.jawaban
  add column skor_isian     integer check (skor_isian >= 0),
  add column diperiksa_oleh uuid references public.profiles (id),
  add column diperiksa_pada timestamptz;

-- Pengumuman hanya setelah ujian ditutup (agar nilai tidak beredar saat peserta lain masih mengerjakan).
create function public.cek_ujian_umumkan()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.diumumkan_pada is not null and old.diumumkan_pada is null and now() < new.selesai then
    raise exception 'ujian belum ditutup';
  end if;
  return new;
end $$;
create trigger ujian_cek_umumkan before update of diumumkan_pada on public.ujian
  for each row execute function public.cek_ujian_umumkan();

-- Admin, atau tutor yang mengampu kelas ujian ini (punya jadwal di kelas tersebut).
create function public.boleh_periksa(p_ujian_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_admin() or (
    public.peran_saya() = 'tutor' and exists (
      select 1 from public.ujian u join public.jadwal j on j.kelas_id = u.kelas_id
       where u.id = p_ujian_id and j.tutor_id = auth.uid()))
$$;

-- Skor satu percobaan (fungsi internal, tidak bisa dipanggil lewat API).
create function public.skor_percobaan(p_percobaan_id uuid)
returns table (skor_pg bigint, skor_isian bigint, isian_belum bigint)
language sql stable security definer set search_path = ''
as $$
  select
    coalesce(sum(s.bobot) filter (where s.jenis = 'pilihan_ganda' and j.pilihan = k.jawaban_benar), 0),
    coalesce(sum(j.skor_isian) filter (where s.jenis = 'isian'), 0),
    count(*) filter (where s.jenis = 'isian' and j.isian is not null and j.skor_isian is null)
  from public.jawaban j
  join public.soal s on s.id = j.soal_id
  left join public.soal_kunci k on k.soal_id = s.id
  where j.percobaan_id = p_percobaan_id
$$;

-- Ujian yang boleh diperiksa pengguna ini (tutor: kelas yang diampu; admin: semua), hanya yang terbit.
create function public.ujian_diperiksa()
returns table (id uuid, judul text, kelas text, mulai timestamptz, selesai timestamptz, durasi_menit integer,
               diumumkan_pada timestamptz, peserta_mulai bigint, isian_belum bigint, sekarang timestamptz)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.judul, k.nama, u.mulai, u.selesai, u.durasi_menit, u.diumumkan_pada,
         (select count(*) from public.percobaan_ujian pu where pu.ujian_id = u.id),
         (select coalesce(sum(sp.isian_belum), 0)::bigint from public.percobaan_ujian pu,
                 lateral public.skor_percobaan(pu.id) sp
           where pu.ujian_id = u.id and (pu.selesai_pada is not null or now() >= pu.batas_selesai)),
         now()
    from public.ujian u join public.kelas k on k.id = u.kelas_id
   where u.terbit and public.boleh_periksa(u.id)
   order by u.mulai desc
$$;

-- Rekap nilai per peserta: anggota kelas (termasuk yang tidak mengerjakan) + peserta yang punya percobaan.
create function public.hasil_ujian(p_ujian_id uuid)
returns table (peserta_id uuid, nama text, percobaan_id uuid, mulai_pada timestamptz, selesai_pada timestamptz,
               skor_pg bigint, skor_isian bigint, isian_belum bigint, total_bobot bigint, nilai numeric)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_total bigint;
begin
  if not public.boleh_periksa(p_ujian_id) then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  select coalesce(sum(bobot), 0) into v_total from public.soal where ujian_id = p_ujian_id;

  return query
  with peserta_ujian as (
    select kp.peserta_id from public.kelas_peserta kp join public.ujian u on u.kelas_id = kp.kelas_id
     where u.id = p_ujian_id
    union
    select pu.peserta_id from public.percobaan_ujian pu where pu.ujian_id = p_ujian_id
  )
  select p.id, p.nama, pu.id, pu.mulai_pada,
         case when pu.selesai_pada is not null then pu.selesai_pada
              when now() >= pu.batas_selesai then pu.batas_selesai end,
         sp.skor_pg, sp.skor_isian, sp.isian_belum, v_total,
         case when pu.id is not null and v_total > 0
              then round(100.0 * (sp.skor_pg + sp.skor_isian) / v_total, 1) end
    from peserta_ujian x
    join public.peserta p on p.id = x.peserta_id
    left join public.percobaan_ujian pu on pu.ujian_id = p_ujian_id and pu.peserta_id = p.id
    left join lateral public.skor_percobaan(pu.id) sp on pu.id is not null
   order by p.nama;
end $$;

-- Jawaban isian dari percobaan yang sudah selesai, untuk diperiksa.
create function public.isian_ujian(p_ujian_id uuid)
returns table (jawaban_id uuid, soal_id uuid, nomor integer, pertanyaan text, acuan text, bobot integer,
               peserta text, isian text, skor_isian integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.boleh_periksa(p_ujian_id) then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  return query
  select j.id, s.id, s.urutan, s.pertanyaan, k.kunci_isian, s.bobot, p.nama, j.isian, j.skor_isian
    from public.jawaban j
    join public.percobaan_ujian pu on pu.id = j.percobaan_id
    join public.peserta p on p.id = pu.peserta_id
    join public.soal s on s.id = j.soal_id
    left join public.soal_kunci k on k.soal_id = s.id
   where pu.ujian_id = p_ujian_id and s.jenis = 'isian' and j.isian is not null
     and (pu.selesai_pada is not null or now() >= pu.batas_selesai)
   order by s.urutan, s.dibuat_pada, p.nama;
end $$;

create function public.nilai_isian(p_jawaban_id uuid, p_skor integer)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v record;
begin
  select j.id, s.jenis, s.bobot, pu.ujian_id,
         (pu.selesai_pada is not null or now() >= pu.batas_selesai) as selesai
    into v
    from public.jawaban j
    join public.soal s on s.id = j.soal_id
    join public.percobaan_ujian pu on pu.id = j.percobaan_id
   where j.id = p_jawaban_id;
  if not found or not public.boleh_periksa(v.ujian_id) then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if v.jenis <> 'isian' then
    raise exception 'hanya soal isian yang dinilai manual';
  end if;
  if not v.selesai then
    raise exception 'peserta belum selesai mengerjakan';
  end if;
  if p_skor is not null and (p_skor < 0 or p_skor > v.bobot) then
    raise exception 'skor harus 0 sampai bobot soal';
  end if;
  update public.jawaban
     set skor_isian = p_skor,
         diperiksa_oleh = case when p_skor is null then null else auth.uid() end,
         diperiksa_pada = case when p_skor is null then null else now() end
   where id = p_jawaban_id;
end $$;

-- Nilai milik peserta yang sedang masuk, hanya untuk ujian yang sudah diumumkan.
create function public.nilai_saya()
returns table (ujian_id uuid, skor bigint, total_bobot bigint, nilai numeric)
language sql stable security definer set search_path = ''
as $$
  select u.id, sp.skor_pg + sp.skor_isian, t.total,
         case when t.total > 0 then round(100.0 * (sp.skor_pg + sp.skor_isian) / t.total, 1) end
    from public.percobaan_ujian pu
    join public.ujian u on u.id = pu.ujian_id
    cross join lateral public.skor_percobaan(pu.id) sp
    cross join lateral (select coalesce(sum(bobot), 0)::bigint as total from public.soal where ujian_id = u.id) t
   where pu.peserta_id = public.peserta_saya() and u.diumumkan_pada is not null
     and (pu.selesai_pada is not null or now() >= pu.batas_selesai)
$$;

revoke all on function public.cek_ujian_umumkan(), public.skor_percobaan(uuid) from public, anon, authenticated;
revoke all on function public.boleh_periksa(uuid), public.ujian_diperiksa(), public.hasil_ujian(uuid),
  public.isian_ujian(uuid), public.nilai_isian(uuid, integer), public.nilai_saya() from public, anon;
grant execute on function public.boleh_periksa(uuid), public.ujian_diperiksa(), public.hasil_ujian(uuid),
  public.isian_ujian(uuid), public.nilai_isian(uuid, integer), public.nilai_saya() to authenticated;

-- Penilaian isian tercatat di audit (siapa memberi skor berapa). Simpan jawaban peserta tidak diaudit.
create trigger audit_jawaban_nilai after update of skor_isian on public.jawaban
  for each row execute function public.catat_audit();
