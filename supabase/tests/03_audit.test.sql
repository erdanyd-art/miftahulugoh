-- Tes cakupan log audit (security-checklist E1, E2): trigger terpasang dan perubahan tercatat beserta pelaku.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_trigger('public', 'profiles',   'audit_profiles',   'audit pada profiles');
select has_trigger('public', 'jadwal',     'audit_jadwal',     'audit pada jadwal');
select has_trigger('public', 'sesi',       'audit_sesi',       'audit pada sesi');
select has_trigger('public', 'kas',        'audit_kas',        'audit pada kas');
select has_trigger('public', 'pembayaran', 'audit_pembayaran', 'audit pada pembayaran');
select has_trigger('public', 'pengaturan', 'audit_pengaturan', 'audit pada pengaturan');

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor');
insert into public.peserta (id, nama) values ('c0000000-0000-0000-0000-0000000000c1','P1');
insert into public.kelas (id, nama) values ('d0000000-0000-0000-0000-0000000000d1','Uji Audit K1');

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';

update public.profiles set nama = 'Tutor Satu Baru' where id = 'a0000000-0000-0000-0000-0000000000b1';
insert into public.jadwal (id, kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor)
  values ('e0000000-0000-0000-0000-0000000000e1','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',1,'08:00','09:00',1000);
insert into public.pembayaran (id, tanggal, peserta_id, keterangan, jumlah)
  values ('f0000000-0000-0000-0000-0000000000f2', current_date, 'c0000000-0000-0000-0000-0000000000c1', 'SPP', 1000);
update public.pembayaran set dihapus_pada = now() where id = 'f0000000-0000-0000-0000-0000000000f2';

select ok((select sebelum->>'nama' = 'Tutor Satu' and sesudah->>'nama' = 'Tutor Satu Baru'
             and pengguna_id = 'a0000000-0000-0000-0000-00000000000a'
           from public.audit_log where tabel = 'profiles' and aksi = 'UPDATE'
             and baris_id = 'a0000000-0000-0000-0000-0000000000b1' order by waktu desc limit 1),
  'ubah profil tercatat dengan nilai sebelum/sesudah dan pelaku');
select ok((select count(*) = 1 from public.audit_log where tabel = 'jadwal' and aksi = 'INSERT'
             and baris_id = 'e0000000-0000-0000-0000-0000000000e1'), 'tambah jadwal tercatat');
select ok((select count(*) = 1 from public.audit_log where tabel = 'pembayaran' and aksi = 'UPDATE'
             and baris_id = 'f0000000-0000-0000-0000-0000000000f2' and sesudah->>'dihapus_pada' is not null),
  'soft delete pembayaran tercatat di audit');
select throws_like($$delete from public.audit_log$$, '%permission denied%', 'admin pun tidak bisa menghapus audit log');
select throws_like($$insert into public.audit_log (tabel, aksi) values ('kas', 'INSERT')$$, '%permission denied%',
  'audit log tidak bisa dipalsukan lewat INSERT langsung');

select * from finish();
rollback;
