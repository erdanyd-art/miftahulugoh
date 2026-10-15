-- Tes fungsi impor_peserta: hanya admin, atomik, keanggotaan kelas ikut tercatat.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor');
insert into public.kelas (id, nama) values
 ('d0000000-0000-0000-0000-0000000000d1','Uji Impor K1'),
 ('d0000000-0000-0000-0000-0000000000d2','Uji Impor K2');

-- ===== tutor dan anon ditolak =====
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select throws_like($$select public.impor_peserta('[{"nama":"Hantu"}]'::jsonb)$$, '%tidak berwenang%', 'tutor tidak bisa mengimpor');

reset role;
set local role anon;
select throws_like($$select public.impor_peserta('[{"nama":"Hantu"}]'::jsonb)$$, '%permission denied%', 'anon tidak bisa mengimpor');

-- ===== admin =====
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';

select is(
  public.impor_peserta($$[
    {"nama":"Impor Satu","catatan":"","kelas_ids":["d0000000-0000-0000-0000-0000000000d1","d0000000-0000-0000-0000-0000000000d2"]},
    {"nama":"Impor Dua","catatan":"pindahan","kelas_ids":[]},
    {"nama":"Impor Tiga"}
  ]$$::jsonb),
  3, 'admin mengimpor 3 peserta');
select is((select count(*) from public.peserta where nama like 'Impor %'), 3::bigint, '3 peserta tersimpan');
select is((select count(*) from public.kelas_peserta kp join public.peserta p on p.id = kp.peserta_id where p.nama = 'Impor Satu'),
  2::bigint, 'keanggotaan dua kelas ikut tercatat');
select ok((select catatan is null from public.peserta where nama = 'Impor Satu')
      and (select catatan = 'pindahan' from public.peserta where nama = 'Impor Dua'), 'catatan kosong menjadi null');

-- atomik: satu baris bermasalah (kelas tidak ada) membatalkan seluruh impor
select throws_ok($$select public.impor_peserta($q$[
    {"nama":"Atomik A"},
    {"nama":"Atomik B","kelas_ids":["d0000000-0000-0000-0000-0000000000ff"]}
  ]$q$::jsonb)$$, '23503', null, 'kelas tidak dikenal ditolak database');
select is((select count(*) from public.peserta where nama like 'Atomik %'), 0::bigint, 'tidak ada baris yang setengah masuk');

select * from finish();
rollback;
