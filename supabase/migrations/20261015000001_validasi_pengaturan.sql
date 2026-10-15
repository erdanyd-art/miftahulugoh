-- 0006_validasi_pengaturan: tolak zona waktu yang tidak dikenal dan nama lembaga kosong; catat perubahan di audit.
-- Zona waktu salah membuat simpan_absensi gagal untuk semua tutor (docs/schema.md bagian 13).

alter table public.pengaturan
  add constraint pengaturan_nama_lembaga_check check (length(btrim(nama_lembaga)) > 0);

create function public.cek_pengaturan()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.zona_waktu) then
    raise exception 'zona waktu tidak dikenal: %', new.zona_waktu;
  end if;
  return new;
end $$;

create trigger pengaturan_cek before insert or update on public.pengaturan
  for each row execute function public.cek_pengaturan();

create trigger audit_pengaturan after insert or update or delete on public.pengaturan
  for each row execute function public.catat_audit();
