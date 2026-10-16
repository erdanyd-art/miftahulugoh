-- Tes akun peserta (D11): peserta hanya melihat dirinya; tidak bisa memakai fungsi staf; peran terkunci.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

update public.pengaturan set zona_waktu = 'Asia/Makassar';
insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('e0000000-0000-0000-0000-0000000000e1','murid1@peserta.miftah.invalid'),
 ('e0000000-0000-0000-0000-0000000000e2','murid2@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor');
insert into public.peserta (id, nama) values
 ('c0000000-0000-0000-0000-0000000000c1','Murid Satu'),
 ('c0000000-0000-0000-0000-0000000000c2','Murid Dua'),
 ('c0000000-0000-0000-0000-0000000000c3','Murid Tiga');
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Kelas Peserta');
insert into public.kelas_peserta (kelas_id, peserta_id) values
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1');
insert into public.jadwal (id, kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor) values
 ('f0000000-0000-0000-0000-0000000000f1','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',
  extract(isodow from (now() at time zone 'Asia/Makassar'))::int, '00:00', '23:59', 100000);
insert into public.pembayaran (tanggal, peserta_id, keterangan, jumlah, status)
values (current_date, 'c0000000-0000-0000-0000-0000000000c1', 'SPP', 100000, 'belum_lunas');

-- ===== admin membuat akun peserta =====
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select lives_ok($$select public.hubungkan_akun_peserta('c0000000-0000-0000-0000-0000000000c1','e0000000-0000-0000-0000-0000000000e1')$$,
  'admin menghubungkan akun ke peserta');
select ok((select peran = 'peserta' and wajib_ganti_sandi and nama = 'Murid Satu' from public.profiles
            where id = 'e0000000-0000-0000-0000-0000000000e1'), 'profil peserta dibuat, nama dari data peserta, wajib ganti sandi');
select is((select user_id from public.peserta where id = 'c0000000-0000-0000-0000-0000000000c1'),
  'e0000000-0000-0000-0000-0000000000e1'::uuid, 'peserta tertaut ke akunnya');
select throws_like($$select public.hubungkan_akun_peserta('c0000000-0000-0000-0000-0000000000c1','e0000000-0000-0000-0000-0000000000e2')$$,
  '%sudah punya akun%', 'peserta yang sudah punya akun tidak bisa dihubungkan lagi');
select lives_ok($$select public.hubungkan_akun_peserta('c0000000-0000-0000-0000-0000000000c2','e0000000-0000-0000-0000-0000000000e2')$$,
  'akun kedua untuk peserta lain');

-- peran terkunci; akun staf tidak bisa ditautkan ke peserta
select throws_like($$update public.profiles set peran = 'admin' where id = 'e0000000-0000-0000-0000-0000000000e1'$$,
  '%peran peserta tidak bisa diubah%', 'admin tidak bisa mengubah akun peserta menjadi admin');
select throws_like($$update public.profiles set peran = 'peserta' where id = 'a0000000-0000-0000-0000-0000000000b1'$$,
  '%peran peserta tidak bisa diubah%', 'akun staf tidak bisa dijadikan peserta');
select throws_like($$update public.peserta set user_id = 'a0000000-0000-0000-0000-0000000000b1' where id = 'c0000000-0000-0000-0000-0000000000c3'$$,
  '%harus berperan peserta%', 'peserta tidak bisa ditautkan ke akun tutor');

-- tutor tidak bisa membuat akun peserta
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select throws_like($$select public.hubungkan_akun_peserta('c0000000-0000-0000-0000-0000000000c3','e0000000-0000-0000-0000-0000000000e2')$$,
  '%tidak berwenang%', 'tutor tidak bisa membuat akun peserta');

-- ===== sebagai peserta =====
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select is((select count(*) from public.profiles), 1::bigint, 'peserta hanya melihat profilnya sendiri');
select is((select array_agg(nama) from public.peserta), array['Murid Satu'], 'peserta hanya melihat data pesertanya sendiri');
select is((select count(*) from public.kelas), 0::bigint, 'peserta tidak membaca kelas (belum dibutuhkan)');
select is((select count(*) from public.jadwal), 0::bigint, 'peserta tidak membaca jadwal');
select is((select count(*) from public.pembayaran), 0::bigint, 'peserta tidak membaca pembayaran (termasuk miliknya, Fase 2 tahap lanjut)');
select is((select count(*) from public.kas), 0::bigint, 'peserta tidak membaca kas');
select is((select count(*) from public.audit_log), 0::bigint, 'peserta tidak membaca audit');
select throws_like($$select public.simpan_absensi('f0000000-0000-0000-0000-0000000000f1', (now() at time zone 'Asia/Makassar')::date, '{}')$$,
  '%tidak berwenang%', 'peserta tidak bisa mengisi absensi (dulu lolos sebagai "bukan tutor")');
select throws_like($$select public.ubah_meet('f0000000-0000-0000-0000-0000000000f1', 'https://meet.google.com/aaa-bbbb-ccc')$$,
  '%tidak berwenang%', 'peserta tidak bisa mengubah tautan Meet');
select is((select count(*) from public.saldo_honor()), 0::bigint, 'peserta tidak melihat saldo honor');

update public.profiles set nama = 'Diubah' where id = 'e0000000-0000-0000-0000-0000000000e1';
select lives_ok($$select public.selesai_ganti_sandi()$$, 'peserta menandai sandi sudah diganti');
reset role;
select ok((select nama = 'Murid Satu' and not wajib_ganti_sandi from public.profiles where id = 'e0000000-0000-0000-0000-0000000000e1'),
  'peserta tidak bisa mengubah profilnya; tanda wajib ganti sandi hilang');
select ok((select wajib_ganti_sandi from public.profiles where id = 'e0000000-0000-0000-0000-0000000000e2'),
  'tanda wajib ganti sandi peserta lain tidak tersentuh');

select * from finish();
rollback;
