-- 0017_acak_ujian: opsi acak urutan soal dan pilihan per ujian (Sprint 14).
-- Pengacakan dilakukan server per percobaan (deterministik); jawaban tetap disimpan dengan indeks pilihan ASLI,
-- jadi penilaian dan kunci tidak berubah.
alter table public.ujian
  add column acak_soal boolean not null default false,
  add column acak_opsi boolean not null default false;

-- ujian_saya() kini juga mengembalikan pengaturan acak (tipe kembalian berubah: hapus lalu buat ulang).
drop function public.ujian_saya();
create function public.ujian_saya()
returns table (
  id uuid, judul text, keterangan text, kelas text, mulai timestamptz, selesai timestamptz,
  durasi_menit integer, jumlah_soal bigint, percobaan_id uuid, batas_selesai timestamptz,
  selesai_pada timestamptz, sekarang timestamptz, acak_soal boolean, acak_opsi boolean)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.judul, u.keterangan, k.nama, u.mulai, u.selesai, u.durasi_menit,
         (select count(*) from public.soal s where s.ujian_id = u.id),
         pu.id, pu.batas_selesai, pu.selesai_pada, now(), u.acak_soal, u.acak_opsi
    from public.ujian u
    join public.kelas k on k.id = u.kelas_id
    left join public.percobaan_ujian pu on pu.ujian_id = u.id and pu.peserta_id = public.peserta_saya()
   where u.terbit
     and exists (select 1 from public.kelas_peserta kp
                  where kp.kelas_id = u.kelas_id and kp.peserta_id = public.peserta_saya())
   order by u.mulai desc
$$;
revoke all on function public.ujian_saya() from public, anon;
grant execute on function public.ujian_saya() to authenticated;
