-- 0016_impor_soal: impor banyak soal sekaligus dari CSV (atomik: satu baris gagal = tidak ada yang tersimpan).
-- SECURITY INVOKER: memakai simpan_soal() per baris, jadi RLS admin, validasi kunci, dan kunci-soal-setelah-
-- dikerjakan tetap berlaku. p_baris = [{"urutan","jenis","pertanyaan","opsi":[...],"audio_id","bobot",
-- "jawaban_benar","kunci_isian"}, ...]
create function public.impor_soal(p_ujian_id uuid, p_baris jsonb)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v jsonb;
  v_jumlah integer := 0;
begin
  if not public.is_admin() then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if jsonb_typeof(p_baris) is distinct from 'array' or jsonb_array_length(p_baris) > 300 then
    raise exception 'data impor tidak valid';
  end if;

  for v in select value from jsonb_array_elements(p_baris) loop
    perform public.simpan_soal(
      null, p_ujian_id, (v ->> 'urutan')::integer, (v ->> 'jenis')::public.jenis_soal, v ->> 'pertanyaan',
      case when jsonb_typeof(v -> 'opsi') = 'array' then array(select jsonb_array_elements_text(v -> 'opsi')) end,
      nullif(v ->> 'audio_id', '')::uuid, (v ->> 'bobot')::integer, (v ->> 'jawaban_benar')::integer, v ->> 'kunci_isian');
    v_jumlah := v_jumlah + 1;
  end loop;
  return v_jumlah;
end $$;

revoke all on function public.impor_soal(uuid, jsonb) from public, anon;
grant execute on function public.impor_soal(uuid, jsonb) to authenticated;
