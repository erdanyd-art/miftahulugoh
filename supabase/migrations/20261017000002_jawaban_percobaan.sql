-- 0018_jawaban_percobaan: admin / tutor pengampu melihat seluruh jawaban satu peserta (termasuk soal yang
-- tidak dijawab), dengan kunci dan status benar. Hanya lewat fungsi (boleh_periksa); peserta tidak bisa.
create function public.jawaban_percobaan(p_percobaan_id uuid)
returns table (
  peserta text, ujian_id uuid, mulai_pada timestamptz, selesai_pada timestamptz,
  soal_id uuid, nomor integer, jenis public.jenis_soal, pertanyaan text, opsi text[], bobot integer,
  jawaban_benar smallint, acuan text, jawaban_id uuid, pilihan smallint, isian text, skor_isian integer,
  benar boolean, skor integer)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_pc public.percobaan_ujian%rowtype;
begin
  select * into v_pc from public.percobaan_ujian where id = p_percobaan_id;
  if not found or not public.boleh_periksa(v_pc.ujian_id) then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  return query
  select p.nama, v_pc.ujian_id, v_pc.mulai_pada,
         case when v_pc.selesai_pada is not null then v_pc.selesai_pada
              when now() >= v_pc.batas_selesai then v_pc.batas_selesai end,
         s.id, s.urutan, s.jenis, s.pertanyaan, s.opsi, s.bobot,
         k.jawaban_benar, k.kunci_isian, j.id, j.pilihan, j.isian, j.skor_isian,
         case when s.jenis = 'pilihan_ganda' then j.pilihan is not null and j.pilihan = k.jawaban_benar end,
         case when s.jenis = 'pilihan_ganda'
              then case when j.pilihan is not null and j.pilihan = k.jawaban_benar then s.bobot else 0 end
              else j.skor_isian end
    from public.soal s
    join public.peserta p on p.id = v_pc.peserta_id
    left join public.soal_kunci k on k.soal_id = s.id
    left join public.jawaban j on j.soal_id = s.id and j.percobaan_id = v_pc.id
   where s.ujian_id = v_pc.ujian_id
   order by s.urutan, s.dibuat_pada;
end $$;

revoke all on function public.jawaban_percobaan(uuid) from public, anon;
grant execute on function public.jawaban_percobaan(uuid) to authenticated;
