-- Tes validasi tabel pengaturan (Sprint 3).
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor');

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';

select throws_like($$update public.pengaturan set zona_waktu = 'Asia/Atlantis'$$,
  '%zona waktu tidak dikenal%', 'zona waktu tidak dikenal ditolak database');
select throws_like($$update public.pengaturan set nama_lembaga = '   '$$,
  '%check constraint%', 'nama lembaga kosong ditolak');
select lives_ok($$update public.pengaturan set zona_waktu = 'Asia/Jakarta', nama_lembaga = 'Lembaga Uji'$$,
  'admin bisa mengubah zona waktu yang valid');
select ok((select zona_waktu = 'Asia/Jakarta' from public.pengaturan), 'zona waktu tersimpan');
select ok((select count(*) > 0 from public.audit_log where tabel = 'pengaturan'
             and pengguna_id = 'a0000000-0000-0000-0000-00000000000a'), 'perubahan pengaturan tercatat di audit');

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
with u as (update public.pengaturan set zona_waktu = 'Asia/Makassar' returning 1)
  select is((select count(*) from u), 0::bigint, 'tutor tidak bisa mengubah pengaturan');

select * from finish();
rollback;
