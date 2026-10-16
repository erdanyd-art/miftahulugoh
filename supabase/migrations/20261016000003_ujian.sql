-- 0012_ujian: admin menyusun ujian CBT (Sprint 10; D12, D14).
-- Tahap ini hanya admin. Akses peserta (mengerjakan) dan tutor (memeriksa) ditambahkan di Sprint 11-12.
-- Kunci jawaban disimpan terpisah di soal_kunci agar kelak tidak pernah terbaca peserta.

create type public.jenis_soal as enum ('pilihan_ganda', 'isian');

create table public.ujian (
  id           uuid primary key default gen_random_uuid(),
  judul        text not null check (length(btrim(judul)) between 1 and 200),
  keterangan   text check (keterangan is null or length(keterangan) <= 2000),
  kelas_id     uuid not null references public.kelas (id) on delete restrict,
  mulai        timestamptz not null,
  selesai      timestamptz not null,
  durasi_menit integer not null check (durasi_menit between 1 and 600),
  terbit       boolean not null default false,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now(),
  constraint ujian_rentang_valid check (selesai > mulai)
);
create index ujian_kelas_idx on public.ujian (kelas_id);
create index ujian_mulai_idx on public.ujian (mulai desc);
create trigger ujian_diubah before update on public.ujian
  for each row execute function public.set_diubah_pada();

-- Berkas audio di Storage (bucket privat audio-ujian). Satu audio boleh dipakai beberapa soal (D14).
create table public.audio_ujian (
  id          uuid primary key default gen_random_uuid(),
  ujian_id    uuid not null references public.ujian (id) on delete cascade,
  judul       text not null check (length(btrim(judul)) between 1 and 200),
  path        text not null unique,
  ukuran      integer not null check (ukuran between 1 and 10485760),
  dibuat_pada timestamptz not null default now(),
  unique (id, ujian_id),
  constraint audio_path_valid check (
    path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp3|m4a)$' and split_part(path, '/', 1) = ujian_id::text)
);
create index audio_ujian_ujian_idx on public.audio_ujian (ujian_id);

create table public.soal (
  id          uuid primary key default gen_random_uuid(),
  ujian_id    uuid not null references public.ujian (id) on delete cascade,
  urutan      integer not null check (urutan between 1 and 500),
  jenis       public.jenis_soal not null,
  pertanyaan  text not null check (length(btrim(pertanyaan)) between 1 and 5000),
  opsi        text[],
  audio_id    uuid,
  bobot       integer not null default 1 check (bobot between 1 and 100),
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now(),
  -- audio harus milik ujian yang sama (audio_id kosong = tanpa audio)
  foreign key (audio_id, ujian_id) references public.audio_ujian (id, ujian_id),
  constraint soal_opsi_valid check (
    (jenis = 'isian' and opsi is null)
    or (jenis = 'pilihan_ganda' and cardinality(opsi) between 2 and 6
        and array_position(opsi, '') is null and array_position(opsi, null) is null))
);
create index soal_ujian_idx on public.soal (ujian_id, urutan);
create index soal_audio_idx on public.soal (audio_id);
create trigger soal_diubah before update on public.soal
  for each row execute function public.set_diubah_pada();

create table public.soal_kunci (
  soal_id       uuid primary key references public.soal (id) on delete cascade,
  jawaban_benar smallint check (jawaban_benar between 0 and 5),   -- indeks opsi (pilihan ganda)
  kunci_isian   text check (kunci_isian is null or length(kunci_isian) <= 2000) -- acuan pemeriksa (isian)
);

-- Ujian hanya bisa diterbitkan bila sudah punya soal.
create function public.cek_ujian_terbit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.terbit and not exists (select 1 from public.soal where ujian_id = new.id) then
    raise exception 'ujian belum punya soal';
  end if;
  return new;
end $$;
create trigger ujian_cek_terbit before insert or update of terbit on public.ujian
  for each row execute function public.cek_ujian_terbit();

-- Simpan soal + kuncinya sekaligus (atomik). SECURITY INVOKER: RLS admin berlaku.
create function public.simpan_soal(
  p_soal_id uuid, p_ujian_id uuid, p_urutan integer, p_jenis public.jenis_soal, p_pertanyaan text,
  p_opsi text[], p_audio_id uuid, p_bobot integer, p_jawaban_benar integer, p_kunci_isian text)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if p_jenis = 'pilihan_ganda' then
    if p_jawaban_benar is null or p_jawaban_benar < 0 or p_jawaban_benar >= coalesce(cardinality(p_opsi), 0) then
      raise exception 'kunci jawaban harus salah satu pilihan';
    end if;
  elsif p_jawaban_benar is not null then
    raise exception 'soal isian tidak memakai kunci pilihan';
  end if;

  if p_soal_id is null then
    insert into public.soal (ujian_id, urutan, jenis, pertanyaan, opsi, audio_id, bobot)
    values (p_ujian_id, p_urutan, p_jenis, p_pertanyaan,
            case when p_jenis = 'pilihan_ganda' then p_opsi end, p_audio_id, p_bobot)
    returning id into v_id;
  else
    update public.soal
       set urutan = p_urutan, jenis = p_jenis, pertanyaan = p_pertanyaan,
           opsi = case when p_jenis = 'pilihan_ganda' then p_opsi end, audio_id = p_audio_id, bobot = p_bobot
     where id = p_soal_id and ujian_id = p_ujian_id
    returning id into v_id;
    if v_id is null then
      raise exception 'soal tidak ditemukan' using errcode = 'P0002';
    end if;
  end if;

  insert into public.soal_kunci (soal_id, jawaban_benar, kunci_isian)
  values (v_id, case when p_jenis = 'pilihan_ganda' then p_jawaban_benar end,
          case when p_jenis = 'isian' then nullif(btrim(p_kunci_isian), '') end)
  on conflict (soal_id) do update
    set jawaban_benar = excluded.jawaban_benar, kunci_isian = excluded.kunci_isian;
  return v_id;
end $$;

revoke all on function public.cek_ujian_terbit() from public, anon, authenticated;
revoke all on function public.simpan_soal(uuid, uuid, integer, public.jenis_soal, text, text[], uuid, integer, integer, text)
  from public, anon;
grant execute on function public.simpan_soal(uuid, uuid, integer, public.jenis_soal, text, text[], uuid, integer, integer, text)
  to authenticated;

-- RLS: tahap ini hanya admin.
alter table public.ujian       enable row level security;
alter table public.audio_ujian enable row level security;
alter table public.soal        enable row level security;
alter table public.soal_kunci  enable row level security;

create policy ujian_admin on public.ujian
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy audio_ujian_admin on public.audio_ujian
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy soal_admin on public.soal
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- soal_kunci: HANYA admin, untuk selamanya (penilaian otomatis lewat fungsi SECURITY DEFINER, Sprint 12).
create policy soal_kunci_admin on public.soal_kunci
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.ujian, public.audio_ujian, public.soal, public.soal_kunci from anon;

create trigger audit_ujian after insert or update or delete on public.ujian
  for each row execute function public.catat_audit();
create trigger audit_soal after insert or update or delete on public.soal
  for each row execute function public.catat_audit();

-- Storage: bucket privat untuk audio soal. Batas ukuran dan jenis berkas ditegakkan oleh Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio-ujian', 'audio-ujian', false, 10485760,
        array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy audio_ujian_berkas_baca on storage.objects
  for select to authenticated using (bucket_id = 'audio-ujian' and (select public.is_admin()));
create policy audio_ujian_berkas_tambah on storage.objects
  for insert to authenticated with check (bucket_id = 'audio-ujian' and (select public.is_admin()));
create policy audio_ujian_berkas_hapus on storage.objects
  for delete to authenticated using (bucket_id = 'audio-ujian' and (select public.is_admin()));
