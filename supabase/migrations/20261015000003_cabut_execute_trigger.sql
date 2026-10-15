-- 0008_cabut_execute_trigger: fungsi trigger tidak perlu bisa dipanggil lewat API (/rest/v1/rpc/...).
-- Ditemukan oleh Supabase advisors (lint 0028/0029). PostgreSQL hanya memeriksa EXECUTE saat CREATE TRIGGER,
-- jadi trigger tetap berjalan setelah hak ini dicabut.

revoke all on function
  public.catat_audit(),
  public.cek_jadwal(),
  public.cek_kas(),
  public.cek_pengaturan(),
  public.set_diubah_pada()
from public, anon, authenticated;
