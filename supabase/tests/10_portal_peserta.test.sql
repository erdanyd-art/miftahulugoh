-- Tes portal peserta (Sprint 13): jadwal kelas sendiri dan pembayaran sendiri saja.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('e0000000-0000-0000-0000-0000000000e1','murid1@peserta.miftah.invalid'),
 ('e0000000-0000-0000-0000-0000000000e2','murid2@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Ustadz Uji','tutor'),
 ('e0000000-0000-0000-0000-0000000000e1','Murid Satu','peserta'),
 ('e0000000-0000-0000-0000-0000000000e2','Murid Dua','peserta');
insert into public.peserta (id, nama, user_id) values
 ('c0000000-0000-0000-0000-0000000000c1','Murid Satu','e0000000-0000-0000-0000-0000000000e1'),
 ('c0000000-0000-0000-0000-0000000000c2','Murid Dua','e0000000-0000-0000-0000-0000000000e2');
insert into public.kelas (id, nama, aktif) values
 ('d0000000-0000-0000-0000-0000000000d1','Uji Arab',true),
 ('d0000000-0000-0000-0000-0000000000d2','Uji Inggris',true),
 ('d0000000-0000-0000-0000-0000000000d3','Uji Kelas Nonaktif',false);
insert into public.kelas_peserta (kelas_id, peserta_id) values
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d3','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d2','c0000000-0000-0000-0000-0000000000c2');
insert into public.jadwal (kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor, meet_url, aktif) values
 ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',1,'08:00','09:00',1,'https://meet.google.com/aaa-bbbb-ccc',true),
 ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',3,'08:00','09:00',1,null,false),
 ('d0000000-0000-0000-0000-0000000000d2','a0000000-0000-0000-0000-0000000000b1',2,'08:00','09:00',1,'https://meet.google.com/xxx',true),
 ('d0000000-0000-0000-0000-0000000000d3','a0000000-0000-0000-0000-0000000000b1',4,'08:00','09:00',1,null,true);
insert into public.pembayaran (tanggal, peserta_id, keterangan, jumlah, status, dihapus_pada) values
 ('2026-10-01','c0000000-0000-0000-0000-0000000000c1','SPP Oktober',150000,'lunas',null),
 ('2026-10-02','c0000000-0000-0000-0000-0000000000c1','Salah catat',1000,'belum_lunas',now()),
 ('2026-10-03','c0000000-0000-0000-0000-0000000000c2','SPP Murid Dua',150000,'belum_lunas',null);

set local role authenticated;
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select is((select count(*) from public.jadwal_kelas_saya()), 1::bigint,
  'peserta melihat jadwal aktif kelas aktifnya saja (bukan jadwal nonaktif, kelas nonaktif, atau kelas lain)');
select ok((select kelas = 'Uji Arab' and tutor = 'Ustadz Uji' and meet_url = 'https://meet.google.com/aaa-bbbb-ccc'
             from public.jadwal_kelas_saya()), 'jadwal memuat nama kelas, tutor, dan tautan Meet');
select is((select array_agg(keterangan) from public.pembayaran_saya()), array['SPP Oktober'],
  'peserta melihat pembayarannya sendiri, tanpa yang dihapus');
select is((select count(*) from public.pembayaran), 0::bigint, 'tabel pembayaran tetap tertutup bagi peserta');
select is((select count(*) from public.jadwal), 0::bigint, 'tabel jadwal tetap tertutup bagi peserta');

set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e2';
select is((select array_agg(keterangan) from public.pembayaran_saya()), array['SPP Murid Dua'],
  'peserta lain hanya melihat miliknya');
select is((select array_agg(kelas) from public.jadwal_kelas_saya()), array['Uji Inggris'], 'jadwal peserta lain terpisah');

-- staf tidak memperoleh data apa pun lewat fungsi peserta
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select is((select count(*) from public.pembayaran_saya()) + (select count(*) from public.jadwal_kelas_saya()), 0::bigint,
  'tutor tidak membaca pembayaran lewat fungsi peserta');

-- peserta nonaktif kehilangan akses
reset role;
update public.peserta set aktif = false where id = 'c0000000-0000-0000-0000-0000000000c1';
set local role authenticated;
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select is((select count(*) from public.pembayaran_saya()) + (select count(*) from public.jadwal_kelas_saya()), 0::bigint,
  'peserta yang dinonaktifkan tidak lagi melihat jadwal/pembayaran');

reset role;
set local role anon;
select throws_like($$select * from public.pembayaran_saya()$$, '%permission denied%', 'anon ditolak');

select * from finish();
rollback;
