-- Tes melihat jawaban per peserta: admin & tutor pengampu boleh; tutor lain & peserta tidak.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'), ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b2','t2@uji.test'), ('e0000000-0000-0000-0000-0000000000e1','m1@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'), ('a0000000-0000-0000-0000-0000000000b1','Pengampu','tutor'),
 ('a0000000-0000-0000-0000-0000000000b2','Tutor Lain','tutor'), ('e0000000-0000-0000-0000-0000000000e1','Murid','peserta');
insert into public.peserta (id, nama, user_id) values ('c0000000-0000-0000-0000-0000000000c1','Murid','e0000000-0000-0000-0000-0000000000e1');
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Jawaban');
insert into public.kelas_peserta values ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1');
insert into public.jadwal (kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor) values
 ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',1,'08:00','09:00',1);
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit, terbit) values
 ('b1000000-0000-0000-0000-000000000001','U','d0000000-0000-0000-0000-0000000000d1', now() - interval '2 hour', now() + interval '1 hour', 60, false);
insert into public.soal (id, ujian_id, urutan, jenis, pertanyaan, opsi, bobot) values
 ('f1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',1,'pilihan_ganda','PG benar',array['A','B'],2),
 ('f1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001',2,'pilihan_ganda','PG salah',array['A','B'],2),
 ('f1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001',3,'isian','Tidak dijawab',null,3);
insert into public.soal_kunci (soal_id, jawaban_benar) values
 ('f1000000-0000-0000-0000-000000000001',1), ('f1000000-0000-0000-0000-000000000002',0);
update public.ujian set terbit = true;
insert into public.percobaan_ujian (id, ujian_id, peserta_id, mulai_pada, batas_selesai, selesai_pada) values
 ('91000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-0000000000c1',
  now() - interval '90 minute', now() - interval '30 minute', now() - interval '40 minute');
insert into public.jawaban (percobaan_id, soal_id, pilihan) values
 ('91000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001',1),
 ('91000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000002',1);

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.jawaban_percobaan('91000000-0000-0000-0000-000000000001')), 3::bigint,
  'semua soal tampil, termasuk yang tidak dijawab');
select is((select array_agg(coalesce(benar::text, '-') || '/' || coalesce(skor::text, '-') order by nomor)
             from public.jawaban_percobaan('91000000-0000-0000-0000-000000000001')),
  array['true/2','false/0','-/-'], 'status benar dan skor per soal');
select ok((select jawaban_id is null and isian is null from public.jawaban_percobaan('91000000-0000-0000-0000-000000000001') where nomor = 3),
  'soal yang tidak dijawab tanpa jawaban');

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select is((select count(*) from public.jawaban_percobaan('91000000-0000-0000-0000-000000000001')), 3::bigint,
  'tutor pengampu boleh melihat jawaban');
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b2';
select throws_like($$select * from public.jawaban_percobaan('91000000-0000-0000-0000-000000000001')$$, '%tidak berwenang%',
  'tutor lain ditolak');
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select throws_like($$select * from public.jawaban_percobaan('91000000-0000-0000-0000-000000000001')$$, '%tidak berwenang%',
  'peserta tidak bisa melihat kunci lewat fungsi ini');
select throws_like($$select * from public.jawaban_percobaan('91000000-0000-0000-0000-0000000000ff')$$, '%tidak berwenang%',
  'percobaan yang tidak ada ditolak tanpa membocorkan apa pun');

select * from finish();
rollback;
