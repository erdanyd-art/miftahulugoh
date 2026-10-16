-- Tes penilaian (Sprint 12): skor PG otomatis dari kunci, isian dinilai admin/tutor pengampu,
-- pengumuman setelah ujian ditutup, peserta hanya melihat nilainya sendiri setelah diumumkan.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b2','t2@uji.test'),
 ('e0000000-0000-0000-0000-0000000000e1','murid1@peserta.miftah.invalid'),
 ('e0000000-0000-0000-0000-0000000000e2','murid2@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Pengampu','tutor'),
 ('a0000000-0000-0000-0000-0000000000b2','Tutor Lain','tutor'),
 ('e0000000-0000-0000-0000-0000000000e1','Murid Satu','peserta'),
 ('e0000000-0000-0000-0000-0000000000e2','Murid Dua','peserta');
insert into public.peserta (id, nama, user_id) values
 ('c0000000-0000-0000-0000-0000000000c1','Murid Satu','e0000000-0000-0000-0000-0000000000e1'),
 ('c0000000-0000-0000-0000-0000000000c2','Murid Dua','e0000000-0000-0000-0000-0000000000e2'),
 ('c0000000-0000-0000-0000-0000000000c3','Murid Absen',null);
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Kelas Nilai'),
 ('d0000000-0000-0000-0000-0000000000d2','Uji Kelas Lain');
insert into public.kelas_peserta (kelas_id, peserta_id) values
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c2'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c3');
insert into public.jadwal (kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor) values
 ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',1,'08:00','09:00',100000),
 ('d0000000-0000-0000-0000-0000000000d2','a0000000-0000-0000-0000-0000000000b2',1,'08:00','09:00',100000);

-- Ujian masih dibuka; total bobot 2 + 3 + 5 = 10
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit) values
 ('b1000000-0000-0000-0000-000000000001','UTS','d0000000-0000-0000-0000-0000000000d1', now() - interval '2 hour', now() + interval '1 hour', 60);
insert into public.soal (id, ujian_id, urutan, jenis, pertanyaan, opsi, bobot) values
 ('f1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',1,'pilihan_ganda','PG1',array['A','B'],2),
 ('f1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001',2,'pilihan_ganda','PG2',array['A','B','C'],3),
 ('f1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001',3,'isian','Isian',null,5);
insert into public.soal_kunci (soal_id, jawaban_benar, kunci_isian) values
 ('f1000000-0000-0000-0000-000000000001',0,null), ('f1000000-0000-0000-0000-000000000002',2,null),
 ('f1000000-0000-0000-0000-000000000003',null,'acuan');
update public.ujian set terbit = true;

-- Murid Satu: PG1 benar, PG2 salah, isian dijawab, selesai. Murid Dua: masih mengerjakan.
insert into public.percobaan_ujian (id, ujian_id, peserta_id, mulai_pada, batas_selesai, selesai_pada) values
 ('91000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-0000000000c1',
  now() - interval '90 minute', now() - interval '30 minute', now() - interval '40 minute'),
 ('91000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-0000000000c2',
  now() - interval '10 minute', now() + interval '50 minute', null);
insert into public.jawaban (id, percobaan_id, soal_id, pilihan, isian) values
 ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001',0,null),
 ('92000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000002',1,null),
 ('92000000-0000-0000-0000-000000000003','91000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000003',null,'jawaban murid satu'),
 ('92000000-0000-0000-0000-000000000004','91000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000003',null,'belum selesai');

set local role authenticated;

-- ===== admin =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.hasil_ujian('b1000000-0000-0000-0000-000000000001')), 3::bigint,
  'hasil memuat semua anggota kelas, termasuk yang tidak mengerjakan');
select ok((select skor_pg = 2 and skor_isian = 0 and isian_belum = 1 and total_bobot = 10 and nilai = 20.0
             from public.hasil_ujian('b1000000-0000-0000-0000-000000000001') where nama = 'Murid Satu'),
  'skor PG otomatis dari kunci (2/10 = 20), isian belum diperiksa');
select ok((select percobaan_id is null and nilai is null from public.hasil_ujian('b1000000-0000-0000-0000-000000000001')
            where nama = 'Murid Absen'), 'yang tidak mengerjakan tanpa nilai');
select is((select count(*) from public.isian_ujian('b1000000-0000-0000-0000-000000000001')), 1::bigint,
  'hanya isian dari percobaan yang sudah selesai yang bisa diperiksa');
select throws_like($$select public.nilai_isian('92000000-0000-0000-0000-000000000004', 3)$$, '%belum selesai%',
  'isian peserta yang masih mengerjakan tidak bisa dinilai');
select throws_like($$select public.nilai_isian('92000000-0000-0000-0000-000000000003', 6)$$, '%0 sampai bobot%',
  'skor isian tidak boleh melebihi bobot');
select throws_like($$select public.nilai_isian('92000000-0000-0000-0000-000000000001', 1)$$, '%hanya soal isian%',
  'jawaban pilihan ganda tidak dinilai manual');

-- koreksi kunci PG2 ke B: Murid Satu kini benar dua-duanya
update public.soal_kunci set jawaban_benar = 1 where soal_id = 'f1000000-0000-0000-0000-000000000002';
select is((select skor_pg from public.hasil_ujian('b1000000-0000-0000-0000-000000000001') where nama = 'Murid Satu'),
  5::bigint, 'koreksi kunci langsung mengubah skor pilihan ganda');

-- ===== tutor pengampu menilai isian; tutor lain dan peserta ditolak =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select is((select array_agg(judul) from public.ujian_diperiksa()), array['UTS'], 'tutor pengampu melihat ujian kelasnya');
select lives_ok($$select public.nilai_isian('92000000-0000-0000-0000-000000000003', 4)$$, 'tutor pengampu menilai isian');
select ok((select skor_isian = 4 and isian_belum = 0 and nilai = 90.0
             from public.hasil_ujian('b1000000-0000-0000-0000-000000000001') where nama = 'Murid Satu'),
  'nilai akhir = (5 + 4) / 10 = 90');
select is((select count(*) from public.soal_kunci), 0::bigint, 'tutor tetap tidak membaca tabel kunci');

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b2';
select is((select count(*) from public.ujian_diperiksa()), 0::bigint, 'tutor lain tidak melihat ujian kelas lain');
select throws_like($$select * from public.hasil_ujian('b1000000-0000-0000-0000-000000000001')$$, '%tidak berwenang%',
  'tutor lain tidak bisa membaca hasil');
select throws_like($$select public.nilai_isian('92000000-0000-0000-0000-000000000003', 0)$$, '%tidak berwenang%',
  'tutor lain tidak bisa menilai');

set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select throws_like($$select * from public.hasil_ujian('b1000000-0000-0000-0000-000000000001')$$, '%tidak berwenang%',
  'peserta tidak bisa membaca rekap hasil');
select throws_like($$select public.nilai_isian('92000000-0000-0000-0000-000000000003', 5)$$, '%tidak berwenang%',
  'peserta tidak bisa menilai dirinya sendiri');
select throws_like($$update public.jawaban set skor_isian = 5$$, '%permission denied%',
  'peserta tidak bisa menulis skor langsung ke tabel jawaban');
select is((select count(*) from public.nilai_saya()), 0::bigint, 'nilai belum terlihat sebelum diumumkan');

-- ===== pengumuman =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select throws_like($$update public.ujian set diumumkan_pada = now() where id = 'b1000000-0000-0000-0000-000000000001'$$,
  '%belum ditutup%', 'nilai tidak bisa diumumkan sebelum ujian ditutup');
reset role;
update public.ujian set selesai = now() - interval '1 minute' where id = 'b1000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select lives_ok($$update public.ujian set diumumkan_pada = now() where id = 'b1000000-0000-0000-0000-000000000001'$$,
  'admin mengumumkan nilai setelah ujian ditutup');

set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select ok((select skor = 9 and total_bobot = 10 and nilai = 90.0 from public.nilai_saya()),
  'peserta melihat nilainya sendiri');
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e2';
select is((select count(*) from public.nilai_saya()), 0::bigint,
  'peserta lain tidak melihat nilai orang lain (dan belum selesai)');

reset role;
select ok((select count(*) = 1 from public.audit_log where tabel = 'jawaban' and aksi = 'UPDATE'
             and pengguna_id = 'a0000000-0000-0000-0000-0000000000b1'
             and sesudah ->> 'skor_isian' = '4'), 'penilaian isian tercatat di audit dengan pelakunya');
set local role anon;
select throws_like($$select * from public.nilai_saya()$$, '%permission denied%', 'anon tidak bisa memanggil fungsi nilai');

select * from finish();
rollback;
