-- Tes peserta mengerjakan ujian (Sprint 11): jendela waktu, satu percobaan, batas waktu di server,
-- soal/audio hanya terbaca selama aktif, kunci tidak pernah terbaca, soal terkunci setelah ada percobaan.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('e0000000-0000-0000-0000-0000000000e1','murid1@peserta.miftah.invalid'),
 ('e0000000-0000-0000-0000-0000000000e2','murid2@peserta.miftah.invalid'),
 ('e0000000-0000-0000-0000-0000000000e3','murid3@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor'),
 ('e0000000-0000-0000-0000-0000000000e1','Murid Satu','peserta'),
 ('e0000000-0000-0000-0000-0000000000e2','Murid Dua','peserta'),
 ('e0000000-0000-0000-0000-0000000000e3','Murid Lain Kelas','peserta');
insert into public.peserta (id, nama, user_id) values
 ('c0000000-0000-0000-0000-0000000000c1','Murid Satu','e0000000-0000-0000-0000-0000000000e1'),
 ('c0000000-0000-0000-0000-0000000000c2','Murid Dua','e0000000-0000-0000-0000-0000000000e2'),
 ('c0000000-0000-0000-0000-0000000000c3','Murid Lain Kelas','e0000000-0000-0000-0000-0000000000e3');
insert into public.kelas (id, nama) values
 ('d0000000-0000-0000-0000-0000000000d1','Uji Kelas A'), ('d0000000-0000-0000-0000-0000000000d2','Uji Kelas B');
insert into public.kelas_peserta (kelas_id, peserta_id) values
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c2'),
 ('d0000000-0000-0000-0000-0000000000d2','c0000000-0000-0000-0000-0000000000c3');

-- u1: sedang dibuka (durasi 30 menit); u2: belum dibuka; u3: draf; u4: dibuka, tutup 5 menit lagi
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit) values
 ('b1000000-0000-0000-0000-000000000001','Dibuka','d0000000-0000-0000-0000-0000000000d1', now() - interval '1 hour', now() + interval '2 hour', 30),
 ('b1000000-0000-0000-0000-000000000002','Belum dibuka','d0000000-0000-0000-0000-0000000000d1', now() + interval '1 day', now() + interval '2 day', 30),
 ('b1000000-0000-0000-0000-000000000003','Draf','d0000000-0000-0000-0000-0000000000d1', now() - interval '1 hour', now() + interval '2 hour', 30),
 ('b1000000-0000-0000-0000-000000000004','Hampir tutup','d0000000-0000-0000-0000-0000000000d1', now() - interval '1 hour', now() + interval '5 minute', 60);
insert into public.audio_ujian (id, ujian_id, judul, path, ukuran) values
 ('a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Audio',
  'b1000000-0000-0000-0000-000000000001/a1000000-0000-0000-0000-0000000000f1.mp3', 10);
insert into storage.objects (bucket_id, name) values
 ('audio-ujian', 'b1000000-0000-0000-0000-000000000001/a1000000-0000-0000-0000-0000000000f1.mp3');
insert into public.soal (id, ujian_id, urutan, jenis, pertanyaan, opsi, audio_id) values
 ('f1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',1,'pilihan_ganda','PG',array['A','B','C'],'a1000000-0000-0000-0000-000000000001'),
 ('f1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001',2,'isian','Isian',null,null),
 ('f1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000002',1,'isian','x',null,null),
 ('f1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000003',1,'isian','x',null,null),
 ('f1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000004',1,'isian','x',null,null);
insert into public.soal_kunci (soal_id, jawaban_benar) values ('f1000000-0000-0000-0000-000000000001', 2);
update public.ujian set terbit = true where id <> 'b1000000-0000-0000-0000-000000000003';

set local role authenticated;

-- ===== Murid Satu =====
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select is((select array_agg(judul order by judul) from public.ujian_saya()),
  array['Belum dibuka','Dibuka','Hampir tutup'], 'peserta melihat ujian terbit kelasnya saja (tanpa draf)');
select is((select count(*) from public.soal), 0::bigint, 'soal belum terbaca sebelum mulai');
select throws_like($$select public.mulai_ujian('b1000000-0000-0000-0000-000000000002')$$, '%belum dibuka%',
  'tidak bisa mulai sebelum ujian dibuka');
select throws_like($$select public.mulai_ujian('b1000000-0000-0000-0000-000000000003')$$, '%tidak ditemukan%',
  'ujian draf tidak bisa dimulai');

select lives_ok($$select public.mulai_ujian('b1000000-0000-0000-0000-000000000001')$$, 'mulai ujian yang dibuka');
select ok((select batas_selesai - mulai_pada = interval '30 minute' from public.percobaan_ujian
            where ujian_id = 'b1000000-0000-0000-0000-000000000001'), 'batas = mulai + durasi');
select is(public.mulai_ujian('b1000000-0000-0000-0000-000000000001'),
  (select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'mulai lagi melanjutkan percobaan yang sama (satu percobaan)');
select lives_ok($$select public.mulai_ujian('b1000000-0000-0000-0000-000000000004')$$, 'mulai ujian yang hampir tutup');
-- dalam satu transaksi now() tetap: ujian tutup now()+5 menit, durasi 60 menit -> batas 5 menit
select ok((select batas_selesai - mulai_pada = interval '5 minute'
             from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000004'),
  'batas dipotong oleh waktu tutup ujian');

select is((select count(*) from public.soal where ujian_id = 'b1000000-0000-0000-0000-000000000001'), 2::bigint,
  'soal terbaca selama mengerjakan');
select is((select count(*) from public.soal where ujian_id = 'b1000000-0000-0000-0000-000000000002'), 0::bigint,
  'soal ujian lain tetap tidak terbaca');
select is((select count(*) from public.soal_kunci), 0::bigint, 'kunci jawaban tidak pernah terbaca peserta');
select is((select count(*) from public.audio_ujian), 1::bigint, 'audio ujian aktif terbaca');
select is((select count(*) from storage.objects where bucket_id = 'audio-ujian'), 1::bigint,
  'berkas audio ujian aktif bisa dibuatkan tautan putar');

select lives_ok($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'f1000000-0000-0000-0000-000000000001', 1, null)$$, 'simpan jawaban pilihan ganda');
select lives_ok($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'f1000000-0000-0000-0000-000000000001', 0, null)$$, 'ubah jawaban pilihan ganda');
select lives_ok($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'f1000000-0000-0000-0000-000000000002', null, 'jawaban isian')$$, 'simpan jawaban isian');
select is((select array_agg(coalesce(pilihan::text, isian) order by soal_id) from public.jawaban),
  array['0','jawaban isian'], 'jawaban tersimpan satu baris per soal, nilai terakhir');
select throws_like($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'f1000000-0000-0000-0000-000000000001', 3, null)$$, '%jawaban tidak valid%', 'pilihan di luar opsi ditolak');
select throws_like($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'f1000000-0000-0000-0000-000000000003', null, 'x')$$, '%soal tidak ditemukan%', 'soal ujian lain ditolak');

-- ===== Murid Dua tidak bisa menyentuh percobaan Murid Satu; murid kelas lain tidak melihat ujian =====
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e2';
select throws_like($$select public.simpan_jawaban((select id from public.percobaan_ujian limit 1),
  'f1000000-0000-0000-0000-000000000001', 1, null)$$, '%tidak berwenang%', 'peserta lain tidak bisa menulis ke percobaan orang lain');
select is((select count(*) from public.jawaban) + (select count(*) from public.percobaan_ujian), 0::bigint,
  'peserta lain tidak membaca percobaan/jawaban orang lain');
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e3';
select is((select count(*) from public.ujian_saya()), 0::bigint, 'murid kelas lain tidak melihat ujian ini');
select throws_like($$select public.mulai_ujian('b1000000-0000-0000-0000-000000000001')$$, '%tidak ditemukan%',
  'murid kelas lain tidak bisa mulai');

-- ===== tutor tidak membaca jawaban; admin tidak bisa mengubah soal setelah ada percobaan =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select is((select count(*) from public.jawaban), 0::bigint, 'tutor belum membaca jawaban (Sprint 12)');
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.jawaban), 2::bigint, 'admin membaca jawaban');
select throws_like($$update public.soal set pertanyaan = 'diubah' where id = 'f1000000-0000-0000-0000-000000000001'$$,
  '%sudah dikerjakan peserta%', 'soal terkunci setelah ada peserta yang mulai');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'isian','baru',null,null,1,null,null)$$,
  '%sudah dikerjakan peserta%', 'tidak bisa menambah soal setelah ada peserta yang mulai');
select lives_ok($$select public.simpan_soal('f1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',1,'pilihan_ganda',
  'PG',array['A','B','C'],'a1000000-0000-0000-0000-000000000001',3,1,null)$$, 'kunci dan bobot masih boleh dikoreksi lewat form soal');

-- ===== selesai: jawaban ditolak, soal & audio tidak terbaca lagi =====
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select lives_ok($$select public.selesai_ujian((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'))$$,
  'peserta menyelesaikan ujian');
select throws_like($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000001'),
  'f1000000-0000-0000-0000-000000000002', null, 'telat')$$, '%waktu ujian sudah habis%', 'jawaban setelah selesai ditolak');
select is((select count(*) from public.soal where ujian_id = 'b1000000-0000-0000-0000-000000000001')
        + (select count(*) from public.audio_ujian), 0::bigint, 'soal dan audio tidak terbaca setelah selesai');

-- waktu habis tanpa menekan selesai (batas dimundurkan sebagai pemilik database)
reset role;
update public.percobaan_ujian set mulai_pada = now() - interval '2 hour', batas_selesai = now() - interval '1 minute'
 where ujian_id = 'b1000000-0000-0000-0000-000000000004';
set local role authenticated;
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select throws_like($$select public.simpan_jawaban((select id from public.percobaan_ujian where ujian_id = 'b1000000-0000-0000-0000-000000000004'),
  'f1000000-0000-0000-0000-000000000005', null, 'telat')$$, '%waktu ujian sudah habis%',
  'jawaban setelah batas waktu (lewat toleransi 15 detik) ditolak database');

select * from finish();
rollback;
