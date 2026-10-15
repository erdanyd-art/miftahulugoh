-- 0007_impor_peserta: impor banyak peserta (dan keanggotaan kelas) sekaligus, atomik.
-- SECURITY INVOKER: berjalan dengan hak pemanggil, jadi RLS tetap berlaku (hanya admin yang boleh menulis peserta).
-- p_baris = [{"nama": "...", "catatan": "...", "kelas_ids": ["uuid", ...]}, ...]

create function public.impor_peserta(p_baris jsonb)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_baris jsonb;
  v_id    uuid;
  v_jumlah integer := 0;
begin
  if not public.is_admin() then
    raise exception 'tidak berwenang' using errcode = '42501';
  end if;
  if jsonb_typeof(p_baris) is distinct from 'array' or jsonb_array_length(p_baris) > 1000 then
    raise exception 'data impor tidak valid';
  end if;

  for v_baris in select value from jsonb_array_elements(p_baris) loop
    insert into public.peserta (nama, catatan)
    values (v_baris ->> 'nama', nullif(btrim(coalesce(v_baris ->> 'catatan', '')), ''))
    returning id into v_id;

    insert into public.kelas_peserta (kelas_id, peserta_id)
    select distinct k::uuid, v_id
      from jsonb_array_elements_text(coalesce(v_baris -> 'kelas_ids', '[]'::jsonb)) as k;

    v_jumlah := v_jumlah + 1;
  end loop;

  return v_jumlah;
end $$;

revoke all on function public.impor_peserta(jsonb) from public, anon;
grant execute on function public.impor_peserta(jsonb) to authenticated;
