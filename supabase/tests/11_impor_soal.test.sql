-- Tes impor soal: hanya admin, atomik, aturan simpan_soal tetap berlaku.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'), ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'), ('a0000000-0000-0000-0000-0000000000b1','Tutor','tutor');
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Impor Soal');
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit) values
 ('b1000000-0000-0000-0000-000000000001','Impor','d0000000-0000-0000-0000-0000000000d1', now() + interval '1 day', now() + interval '2 day', 60);

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select throws_like($$select public.impor_soal('b1000000-0000-0000-0000-000000000001', '[]'::jsonb)$$, '%tidak berwenang%',
  'tutor tidak bisa mengimpor soal');

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select is(public.impor_soal('b1000000-0000-0000-0000-000000000001', $j$[
  {"urutan":1,"jenis":"pilihan_ganda","pertanyaan":"ما هذا؟","opsi":["كتاب","قلم"],"bobot":2,"jawaban_benar":0},
  {"urutan":2,"jenis":"isian","pertanyaan":"Terjemahkan","opsi":null,"bobot":3,"jawaban_benar":null,"kunci_isian":"buku"}
]$j$::jsonb), 2, 'admin mengimpor 2 soal');
select ok((select count(*) = 2 from public.soal where ujian_id = 'b1000000-0000-0000-0000-000000000001'), '2 soal tersimpan');
select ok((select k.jawaban_benar = 0 and s.opsi = array['كتاب','قلم'] from public.soal s join public.soal_kunci k on k.soal_id = s.id
            where s.urutan = 1 and s.ujian_id = 'b1000000-0000-0000-0000-000000000001'), 'opsi Arab dan kunci tersimpan');
select ok((select k.kunci_isian = 'buku' from public.soal s join public.soal_kunci k on k.soal_id = s.id
            where s.urutan = 2 and s.ujian_id = 'b1000000-0000-0000-0000-000000000001'), 'acuan isian tersimpan');

select throws_like($$select public.impor_soal('b1000000-0000-0000-0000-000000000001', '[
  {"urutan":3,"jenis":"isian","pertanyaan":"Baik","opsi":null,"bobot":1,"jawaban_benar":null},
  {"urutan":4,"jenis":"pilihan_ganda","pertanyaan":"Kunci salah","opsi":["A","B"],"bobot":1,"jawaban_benar":5}
]'::jsonb)$$, '%kunci jawaban harus salah satu pilihan%', 'baris bermasalah ditolak database');
select is((select count(*) from public.soal where ujian_id = 'b1000000-0000-0000-0000-000000000001'), 2::bigint,
  'atomik: baris yang benar di impor gagal tidak ikut tersimpan');

select * from finish();
rollback;
