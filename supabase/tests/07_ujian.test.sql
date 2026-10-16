-- Tes menyusun ujian (Sprint 10): hanya admin; validasi soal/kunci/audio; kunci tidak terbaca selain admin.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('e0000000-0000-0000-0000-0000000000e1','murid1@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor'),
 ('e0000000-0000-0000-0000-0000000000e1','Murid Satu','peserta');
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Kelas Ujian');

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';

-- ===== ujian =====
select throws_like($$insert into public.ujian (judul, kelas_id, mulai, selesai, durasi_menit)
  values ('Salah', 'd0000000-0000-0000-0000-0000000000d1', '2026-11-01 10:00+08', '2026-11-01 09:00+08', 60)$$,
  '%ujian_rentang_valid%', 'selesai harus setelah mulai');
select throws_like($$insert into public.ujian (judul, kelas_id, mulai, selesai, durasi_menit, terbit)
  values ('Langsung terbit', 'd0000000-0000-0000-0000-0000000000d1', '2026-11-01 08:00+08', '2026-11-01 12:00+08', 60, true)$$,
  '%belum punya soal%', 'ujian tanpa soal tidak bisa diterbitkan');
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit) values
 ('b1000000-0000-0000-0000-000000000001','UTS Bahasa Arab','d0000000-0000-0000-0000-0000000000d1','2026-11-01 08:00+08','2026-11-01 12:00+08',60),
 ('b1000000-0000-0000-0000-000000000002','Ujian Lain','d0000000-0000-0000-0000-0000000000d1','2026-11-02 08:00+08','2026-11-02 12:00+08',30);
select is((select count(*) from public.ujian where id::text like 'b1000000%'), 2::bigint, 'admin membuat ujian');

-- ===== audio =====
insert into public.audio_ujian (id, ujian_id, judul, path, ukuran) values
 ('a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Percakapan 1',
  'b1000000-0000-0000-0000-000000000001/a1000000-0000-0000-0000-0000000000f1.mp3', 1000),
 ('a1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002','Audio ujian lain',
  'b1000000-0000-0000-0000-000000000002/a1000000-0000-0000-0000-0000000000f2.mp3', 1000);
select throws_like($$insert into public.audio_ujian (ujian_id, judul, path, ukuran) values
  ('b1000000-0000-0000-0000-000000000001','Salah folder','b1000000-0000-0000-0000-000000000002/a1000000-0000-0000-0000-0000000000f3.mp3',1)$$,
  '%audio_path_valid%', 'berkas audio harus di folder ujiannya');
select throws_like($$insert into public.audio_ujian (ujian_id, judul, path, ukuran) values
  ('b1000000-0000-0000-0000-000000000001','Terlalu besar','b1000000-0000-0000-0000-000000000001/a1000000-0000-0000-0000-0000000000f4.mp3',10485761)$$,
  '%ukuran_check%', 'audio lebih dari 10 MB ditolak');

-- ===== soal =====
select lives_ok($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',1,'pilihan_ganda',
  'ما اسمك؟', array['Ahmad','Budi','Citra'], 'a1000000-0000-0000-0000-000000000001', 2, 1, null)$$,
  'soal pilihan ganda dengan audio dan kunci tersimpan');
select ok((select k.jawaban_benar = 1 and s.bobot = 2 and s.opsi = array['Ahmad','Budi','Citra']
             from public.soal s join public.soal_kunci k on k.soal_id = s.id
            where s.ujian_id = 'b1000000-0000-0000-0000-000000000001' and s.urutan = 1),
  'kunci pilihan ganda tersimpan di soal_kunci');
select lives_ok($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',2,'isian',
  'Terjemahkan: kitab', null, null, 1, null, 'buku')$$, 'soal isian dengan acuan jawaban tersimpan');
select ok((select k.jawaban_benar is null and k.kunci_isian = 'buku' and s.opsi is null
             from public.soal s join public.soal_kunci k on k.soal_id = s.id
            where s.ujian_id = 'b1000000-0000-0000-0000-000000000001' and s.urutan = 2),
  'soal isian: tanpa opsi, kunci berupa acuan');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'pilihan_ganda',
  'Kunci di luar pilihan', array['A','B'], null, 1, 2, null)$$, '%kunci jawaban harus salah satu pilihan%',
  'kunci pilihan ganda harus salah satu opsi');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'pilihan_ganda',
  'Satu opsi', array['A'], null, 1, 0, null)$$, '%soal_opsi_valid%', 'pilihan ganda minimal 2 opsi');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'pilihan_ganda',
  'Opsi kosong', array['A',''], null, 1, 0, null)$$, '%soal_opsi_valid%', 'opsi tidak boleh kosong');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'pilihan_ganda',
  'Audio ujian lain', array['A','B'], 'a1000000-0000-0000-0000-000000000002', 1, 0, null)$$, '%foreign key%',
  'audio dari ujian lain tidak bisa dipakai');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'isian',
  'Isian berkunci pilihan', null, null, 1, 0, null)$$, '%tidak memakai kunci pilihan%', 'soal isian tidak memakai kunci pilihan');

-- ubah jenis pilihan ganda -> isian: opsi dan kunci pilihan dihapus
select lives_ok($$select public.simpan_soal((select id from public.soal where ujian_id = 'b1000000-0000-0000-0000-000000000001' and urutan = 1),
  'b1000000-0000-0000-0000-000000000001',1,'isian','Sekarang isian', array['x','y'], null, 2, null, '')$$, 'soal diubah menjadi isian');
select ok((select s.opsi is null and s.audio_id is null and k.jawaban_benar is null and k.kunci_isian is null
             from public.soal s join public.soal_kunci k on k.soal_id = s.id
            where s.ujian_id = 'b1000000-0000-0000-0000-000000000001' and s.urutan = 1),
  'opsi dan kunci pilihan ikut kosong; acuan kosong menjadi null');
select throws_like($$select public.simpan_soal('b1000000-0000-0000-0000-0000000000ff','b1000000-0000-0000-0000-000000000001',1,'isian','x',null,null,1,null,null)$$,
  '%soal tidak ditemukan%', 'mengubah soal yang tidak ada ditolak');

-- audio yang dipakai soal tidak bisa dihapus; ujian bisa diterbitkan setelah punya soal
select lives_ok($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000001',3,'pilihan_ganda',
  'Dengar audio', array['A','B'], 'a1000000-0000-0000-0000-000000000001', 1, 0, null)$$, 'soal kedua memakai audio yang sama');
select throws_like($$delete from public.audio_ujian where id = 'a1000000-0000-0000-0000-000000000001'$$,
  '%foreign key%', 'audio yang dipakai soal tidak bisa dihapus');
select lives_ok($$update public.ujian set terbit = true where id = 'b1000000-0000-0000-0000-000000000001'$$,
  'ujian bersoal bisa diterbitkan');

-- ===== Storage =====
reset role;
select ok((select not public and file_size_limit = 10485760 from storage.buckets where id = 'audio-ujian'),
  'bucket audio-ujian privat dengan batas 10 MB');
set local role authenticated;

-- ===== tutor dan peserta tidak melihat apa pun =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select is((select count(*) from public.ujian) + (select count(*) from public.soal)
        + (select count(*) from public.soal_kunci) + (select count(*) from public.audio_ujian), 0::bigint,
  'tutor tidak membaca ujian, soal, kunci, audio (Sprint 10)');
select throws_like($$select public.simpan_soal(null,'b1000000-0000-0000-0000-000000000002',1,'isian','x',null,null,1,null,null)$$,
  '%tidak berwenang%', 'tutor tidak bisa menyimpan soal');
select throws_like($$insert into storage.objects (bucket_id, name) values ('audio-ujian', 'b1000000-0000-0000-0000-000000000002/x.mp3')$$,
  '%row-level security%', 'tutor tidak bisa mengunggah audio');

set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select is((select count(*) from public.ujian) + (select count(*) from public.soal)
        + (select count(*) from public.soal_kunci) + (select count(*) from public.audio_ujian), 0::bigint,
  'peserta tidak membaca ujian, soal, kunci, audio (akses mengerjakan: Sprint 11)');
update public.soal_kunci set jawaban_benar = 0, kunci_isian = 'diretas';
reset role;
select is((select count(*) from public.soal_kunci where kunci_isian = 'diretas'), 0::bigint, 'peserta tidak bisa mengubah kunci');

reset role;
set local role anon;
select throws_like($$select count(*) from public.soal_kunci$$, '%permission denied%', 'anon tidak bisa membaca kunci');

select * from finish();
rollback;
