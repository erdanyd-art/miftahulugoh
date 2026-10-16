-- 0015_portal_peserta: portal peserta tahap lanjut (Sprint 13; PRD 6.1).
-- Peserta melihat jadwal kelas yang diikutinya (dengan tautan Meet) dan riwayat pembayarannya sendiri.
-- Hanya lewat fungsi baca SECURITY DEFINER yang menyaring ke peserta_saya(); tabel tetap tertutup bagi peserta.

create function public.jadwal_kelas_saya()
returns table (jadwal_id uuid, kelas text, hari smallint, jam_mulai time, jam_selesai time, tutor text, meet_url text)
language sql stable security definer set search_path = ''
as $$
  select j.id, k.nama, j.hari, j.jam_mulai, j.jam_selesai, t.nama, j.meet_url
    from public.jadwal j
    join public.kelas k on k.id = j.kelas_id and k.aktif
    join public.profiles t on t.id = j.tutor_id
   where j.aktif
     and exists (select 1 from public.kelas_peserta kp
                  where kp.kelas_id = j.kelas_id and kp.peserta_id = public.peserta_saya())
   order by j.hari, j.jam_mulai, k.nama
$$;

create function public.pembayaran_saya()
returns table (id uuid, tanggal date, keterangan text, jumlah bigint, status public.status_pembayaran)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.tanggal, p.keterangan, p.jumlah, p.status
    from public.pembayaran p
   where p.peserta_id = public.peserta_saya() and p.dihapus_pada is null
   order by p.tanggal desc, p.dibuat_pada desc
$$;

revoke all on function public.jadwal_kelas_saya(), public.pembayaran_saya() from public, anon;
grant execute on function public.jadwal_kelas_saya(), public.pembayaran_saya() to authenticated;
