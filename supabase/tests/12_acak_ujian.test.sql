-- Tes pengaturan acak (Sprint 14): bawaan mati; ujian_saya() mengirim pengaturan acak ke peserta, tanpa kunci.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email) values ('e0000000-0000-0000-0000-0000000000e1','murid1@peserta.miftah.invalid');
insert into public.profiles (id, nama, peran) values ('e0000000-0000-0000-0000-0000000000e1','Murid','peserta');
insert into public.peserta (id, nama, user_id) values ('c0000000-0000-0000-0000-0000000000c1','Murid','e0000000-0000-0000-0000-0000000000e1');
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Acak');
insert into public.kelas_peserta values ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1');
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit) values
 ('b1000000-0000-0000-0000-000000000001','Biasa','d0000000-0000-0000-0000-0000000000d1', now(), now() + interval '1 hour', 30);
insert into public.ujian (id, judul, kelas_id, mulai, selesai, durasi_menit, acak_soal, acak_opsi) values
 ('b1000000-0000-0000-0000-000000000002','Acak','d0000000-0000-0000-0000-0000000000d1', now(), now() + interval '1 hour', 30, true, true);
insert into public.soal (ujian_id, urutan, jenis, pertanyaan) values
 ('b1000000-0000-0000-0000-000000000001',1,'isian','x'), ('b1000000-0000-0000-0000-000000000002',1,'isian','x');
update public.ujian set terbit = true;

select ok((select not acak_soal and not acak_opsi from public.ujian where judul = 'Biasa'), 'pengacakan bawaan mati');
set local role authenticated;
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-0000000000e1';
select ok((select acak_soal and acak_opsi from public.ujian_saya() where judul = 'Acak'), 'peserta menerima pengaturan acak');
select ok((select not acak_soal from public.ujian_saya() where judul = 'Biasa'), 'ujian biasa tidak diacak');

select * from finish();
rollback;
