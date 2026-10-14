-- uji_rls.sql — pengujian RLS dan aturan bisnis (psql biasa, bukan pgTAP)
-- Cara pakai (PostgreSQL 16, database kosong, tanpa Supabase):
--   1) psql -d <db_kosong> -f 00_stub.sql   (bagian "LINGKUNGAN TIRUAN" di bawah)
--   2) terapkan 0001..0005 dari docs/schema.md berurutan
--   3) psql -d <db_kosong> -f bagian "UJI" di bawah
-- Di Supabase lokal, JANGAN jalankan bagian tiruan; ubah menjadi tes pgTAP untuk `supabase test db`.
-- ===================== LINGKUNGAN TIRUAN =====================
-- Meniru lingkungan Supabase untuk pengujian lokal
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant select on auth.users to authenticated; -- (di Supabase tidak; cukup untuk FK saat uji)
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
-- ===================== UJI =====================
\set ON_ERROR_STOP on
\set QUIET on
\set VERBOSITY terse
create schema t;
grant usage on schema t to anon, authenticated;
create function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'GAGAL: %', msg; end if; raise notice 'ok   %', msg; end $$;
create function t.err(q text, pola text, msg text) returns void language plpgsql as $$
begin
  begin execute q;
  exception when others then
    if sqlerrm ilike '%'||pola||'%' then raise notice 'ok   % [%]', msg, sqlerrm; return; end if;
    raise exception 'GAGAL: % -- error tak terduga: %', msg, sqlerrm;
  end;
  raise exception 'GAGAL: % -- seharusnya error', msg;
end $$;
create function t.n(q text) returns bigint language plpgsql as $$
declare r bigint; begin execute 'select count(*) from ('||q||') x' into r; return r; end $$;
grant execute on all functions in schema t to anon, authenticated;

-- ===== data awal (sebagai superuser) =====
insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@x'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@x'),
 ('a0000000-0000-0000-0000-0000000000b2','t2@x'),
 ('a0000000-0000-0000-0000-0000000000b3','t3@x');
insert into public.profiles (id, nama, peran, aktif) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin',true),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor',true),
 ('a0000000-0000-0000-0000-0000000000b2','Tutor Dua','tutor',true),
 ('a0000000-0000-0000-0000-0000000000b3','Tutor Nonaktif','tutor',false);
insert into public.peserta (id, nama, aktif) values
 ('c0000000-0000-0000-0000-0000000000c1','P1',true),
 ('c0000000-0000-0000-0000-0000000000c2','P2',true),
 ('c0000000-0000-0000-0000-0000000000c3','P3',true),
 ('c0000000-0000-0000-0000-0000000000c4','P4 nonaktif',false),
 ('c0000000-0000-0000-0000-0000000000c5','P5',true);
insert into public.kelas (id, nama) values
 ('d0000000-0000-0000-0000-0000000000d1','K1'),
 ('d0000000-0000-0000-0000-0000000000d2','K2'),
 ('d0000000-0000-0000-0000-0000000000d3','K3');
insert into public.kelas_peserta (kelas_id, peserta_id) values
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c2'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c3'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c4'),
 ('d0000000-0000-0000-0000-0000000000d2','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d3','c0000000-0000-0000-0000-0000000000c5');
-- hari ini (zona lembaga) dan besok dalam format ISO
select extract(isodow from now() at time zone 'Asia/Makassar')::int as hari_ini,
       (extract(isodow from now() at time zone 'Asia/Makassar')::int % 7) + 1 as hari_lain \gset
insert into public.jadwal (id, kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor) values
 ('e0000000-0000-0000-0000-0000000000e1','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',:hari_ini,'00:00','23:59',100000),
 ('e0000000-0000-0000-0000-0000000000e2','d0000000-0000-0000-0000-0000000000d2','a0000000-0000-0000-0000-0000000000b2',:hari_ini,'00:00','23:59',120001),
 ('e0000000-0000-0000-0000-0000000000e3','d0000000-0000-0000-0000-0000000000d2','a0000000-0000-0000-0000-0000000000b1',:hari_ini,'23:59:00','23:59:30',50000),
 ('e0000000-0000-0000-0000-0000000000e4','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',:hari_lain,'00:00','23:59',100000),
 ('e0000000-0000-0000-0000-0000000000e5','d0000000-0000-0000-0000-0000000000d3','a0000000-0000-0000-0000-0000000000b2',:hari_ini,'00:00','23:59',90000);
insert into public.pembayaran (tanggal, peserta_id, keterangan, jumlah, status)
 values (current_date,'c0000000-0000-0000-0000-0000000000c1','SPP',250000,'lunas');
insert into public.kas (tanggal, jenis, kategori_id, jumlah)
 select current_date,'pemasukan', id, 500000 from public.kategori_kas where nama='Donasi';

-- constraint di sisi tabel
select t.err($q$insert into public.jadwal (kelas_id,tutor_id,hari,jam_mulai,jam_selesai,honor)
  values ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-00000000000a',1,'08:00','09:00',1)$q$,
  'berperan tutor','jadwal tidak boleh memakai admin sebagai tutor');
select t.err($q$insert into public.jadwal (kelas_id,tutor_id,hari,jam_mulai,jam_selesai,honor)
  values ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',1,'09:00','08:00',1)$q$,
  'check constraint','jam selesai harus setelah jam mulai');
select t.err($q$insert into public.jadwal (kelas_id,tutor_id,hari,jam_mulai,jam_selesai,honor)
  values ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',8,'08:00','09:00',1)$q$,
  'check constraint','hari harus 1..7');

-- ===== TUTOR 1 =====
set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b1',false);

select t.ok(public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',
    (now() at time zone 'Asia/Makassar')::date,
    array['c0000000-0000-0000-0000-0000000000c1','c0000000-0000-0000-0000-0000000000c2']::uuid[]) is not null,
  'tutor menyimpan absensi jadwal miliknya');
select t.ok((select hadir=2 and total=3 and honor=100000 and honor_standar=100000 from public.sesi
              where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'hadir 2 dari 3 (peserta nonaktif tidak dihitung), honor penuh 100000');
select t.ok((select count(*)=3 and count(*) filter (where hadir)=2 from public.absensi_murid), 'tiga baris absensi per murid');

-- hadir 0 -> setengah, lalu simpan ulang -> penuh
select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[]);
select t.ok((select hadir=0 and total=3 and honor=50000 from public.sesi where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'hadir 0 -> honor setengah (50000)');
select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c3']::uuid[]);
select t.ok((select hadir=1 and honor=100000 from public.sesi where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'simpan ulang memperbarui sesi (tetap satu baris) dan honor kembali penuh');
select t.ok((select count(*)=1 from public.sesi), 'hanya satu sesi per jadwal per tanggal');

-- aturan jendela dan kepemilikan
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date - 1,'{}'::uuid[])$$,
  'hanya untuk hari ini','tutor tidak bisa absen untuk kemarin');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date + 1,'{}'::uuid[])$$,
  'belum tiba','tutor tidak bisa absen untuk besok');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e3',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  'belum waktunya','tutor tidak bisa absen sebelum jam mulai');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e4',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  'bukan untuk hari ini','jadwal hari lain ditolak');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e2',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  'bukan jadwal Anda','tutor tidak bisa mengabsen jadwal tutor lain');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c5']::uuid[])$$,
  'bukan anggota aktif kelas','peserta di luar kelas ditolak');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c4']::uuid[])$$,
  'bukan anggota aktif kelas','peserta nonaktif ditolak');

-- tutor tidak boleh menulis langsung / fungsi admin
select t.err($$insert into public.sesi (jadwal_id,kelas_id,tutor_id,tanggal,honor_standar,honor) values
  ('e0000000-0000-0000-0000-0000000000e1','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',current_date+5,1,999999)$$,
  'permission denied','tutor tidak bisa INSERT langsung ke sesi');
select t.err($$update public.sesi set honor = 999999999$$,'permission denied','tutor tidak bisa UPDATE langsung sesi');
select t.err($$select public.koreksi_honor((select id from public.sesi limit 1), 1)$$,'tidak berwenang','tutor tidak bisa koreksi honor');
select t.err($$select public.kunci_sesi((select id from public.sesi limit 1), true)$$,'tidak berwenang','tutor tidak bisa mengunci sesi');
with u as (update public.jadwal set honor = 999999999 where id='e0000000-0000-0000-0000-0000000000e1' returning 1)
  select t.ok((select count(*)=0 from u), 'tutor tidak bisa mengubah honor jadwal (0 baris terubah)');
select t.ok((select honor=100000 from public.jadwal where id='e0000000-0000-0000-0000-0000000000e1'), 'honor jadwal tidak berubah');

-- tautan Meet
select public.ubah_meet('e0000000-0000-0000-0000-0000000000e1','https://meet.google.com/abc-defg-hij');
select t.ok((select meet_url='https://meet.google.com/abc-defg-hij' from public.jadwal where id='e0000000-0000-0000-0000-0000000000e1'),
  'tutor mengubah tautan Meet jadwal miliknya');
select t.err($$select public.ubah_meet('e0000000-0000-0000-0000-0000000000e2','https://meet.google.com/x')$$,'bukan jadwal Anda','tutor tidak bisa ubah Meet jadwal orang lain');
select t.err($$select public.ubah_meet('e0000000-0000-0000-0000-0000000000e1','javascript:alert(1)')$$,'check constraint','URL selain https ditolak');

-- visibilitas data
select t.ok(t.n('select 1 from public.kas')=0,         'tutor tidak melihat kas');
select t.ok(t.n('select 1 from public.pembayaran')=0,  'tutor tidak melihat pembayaran');
select t.ok(t.n('select 1 from public.kategori_kas')=0,'tutor tidak melihat kategori kas');
select t.ok(t.n('select 1 from public.audit_log')=0,   'tutor tidak melihat audit log');
select t.ok(t.n('select 1 from public.profiles')=1,    'tutor hanya melihat profilnya sendiri');
select t.ok(t.n('select 1 from public.jadwal')=3,      'tutor hanya melihat 3 jadwal miliknya');
select t.ok(t.n('select 1 from public.kelas')=2,       'tutor melihat kelas yang diampu saja (K1, K2)');
select t.ok(t.n($$select 1 from public.peserta where id='c0000000-0000-0000-0000-0000000000c5'$$)=0,'tutor tidak melihat peserta kelas tutor lain');
select t.ok(t.n('select 1 from public.peserta')=4,     'tutor melihat peserta kelasnya (P1-P4)');
select t.err($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) values (current_date,'pemasukan',gen_random_uuid(),1)$$,
  'row-level security','tutor tidak bisa menulis kas');
select t.err($$insert into public.pembayaran (tanggal,peserta_id,keterangan,jumlah) values (current_date,'c0000000-0000-0000-0000-0000000000c1','x',1)$$,
  'row-level security','tutor tidak bisa menulis pembayaran');
select t.err($$insert into public.peserta (nama) values ('hantu')$$,'row-level security','tutor tidak bisa menambah peserta');
with u as (update public.profiles set peran='admin' where id='a0000000-0000-0000-0000-0000000000b1' returning 1)
  select t.ok((select count(*)=0 from u),'tutor tidak bisa mengubah perannya sendiri menjadi admin');
select t.ok(t.n('select 1 from public.saldo_honor()')=1,'tutor hanya melihat saldo honornya sendiri');
select t.ok((select honor_terkumpul=100000 and honor_dibayar=0 and saldo=100000 from public.saldo_honor()),'saldo tutor 1 = 100000');

-- ===== ANON =====
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select t.err('select * from public.kas','permission denied','anon ditolak di kas');
select t.err('select * from public.profiles','permission denied','anon ditolak di profiles');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',current_date,'{}'::uuid[])$$,'permission denied','anon tidak bisa memanggil fungsi absensi');

-- ===== TUTOR NONAKTIF =====
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b3',false);
select t.ok(t.n('select 1 from public.profiles')=0,'tutor nonaktif tidak melihat apa pun di profiles');
select t.ok(t.n('select 1 from public.kelas')=0,   'tutor nonaktif tidak melihat kelas');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  'tidak berwenang','tutor nonaktif tidak bisa absen');

-- ===== TUTOR 2 =====
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select t.ok(t.n('select 1 from public.sesi')=0,'tutor 2 tidak melihat sesi tutor 1');
select t.ok(t.n('select 1 from public.absensi_murid')=0,'tutor 2 tidak melihat absensi tutor 1');
select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e2',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[]);
select t.ok((select honor=60000 and honor_standar=120001 from public.sesi),'honor ganjil 120001 hadir 0 -> 60000 (dibulatkan ke bawah)');

-- ===== ADMIN =====
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-00000000000a',false);
select t.ok(t.n('select 1 from public.profiles')=4,'admin melihat semua profil');
select t.ok(t.n('select 1 from public.sesi')=2,'admin melihat semua sesi');
select t.ok(t.n('select 1 from public.kas')=1 and t.n('select 1 from public.pembayaran')=1,'admin melihat kas dan pembayaran');
select t.ok(t.n('select 1 from public.saldo_honor()')=3,'admin melihat saldo semua tutor aktif dan nonaktif (3 tutor)');

-- kunci sesi
select public.kunci_sesi((select id from public.sesi where tutor_id='a0000000-0000-0000-0000-0000000000b1'), true);
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b1',false);
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  'sesi sudah dikunci','sesi terkunci tidak bisa diubah tutor');
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-00000000000a',false);
select public.koreksi_honor((select id from public.sesi where tutor_id='a0000000-0000-0000-0000-0000000000b1'), 77777);
select public.kunci_sesi((select id from public.sesi where tutor_id='a0000000-0000-0000-0000-0000000000b1'), false);
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b1',false);
select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c1']::uuid[]);
select t.ok((select honor=77777 and honor_dikoreksi from public.sesi where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'koreksi admin tidak tertimpa saat tutor menyimpan ulang');

-- admin boleh absen untuk kemarin
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-00000000000a',false);
select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date - 1,
  array['c0000000-0000-0000-0000-0000000000c1']::uuid[]);
select t.ok(t.n('select 1 from public.sesi')=3,'admin menyimpan absensi tanggal lampau (koreksi)');
select t.err($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date + 1,'{}'::uuid[])$$,
  'belum tiba','admin tidak bisa mencatat absensi tanggal yang belum tiba');

-- validasi kas
select t.err($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) select current_date,'pengeluaran',id,1000 from public.kategori_kas where nama='Honor Tutor'$$,
  'wajib memilih tutor','Honor Tutor tanpa tutor ditolak');
select t.err($$insert into public.kas (tanggal,jenis,kategori_id,jumlah,tutor_id) select current_date,'pengeluaran',id,1000,'a0000000-0000-0000-0000-0000000000b1' from public.kategori_kas where nama='Operasional'$$,
  'hanya untuk kategori','tutor pada kategori biasa ditolak');
select t.err($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) select current_date,'pemasukan',id,1000 from public.kategori_kas where nama='Operasional'$$,
  'tidak sesuai kategori','jenis tidak cocok kategori ditolak');
select t.err($$insert into public.kas (tanggal,jenis,kategori_id,jumlah,tutor_id) select current_date,'pengeluaran',id,1000,'a0000000-0000-0000-0000-00000000000a' from public.kategori_kas where nama='Honor Tutor'$$,
  'berperan tutor','admin tidak bisa dipilih sebagai tutor honor');
select t.err($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) select current_date,'pemasukan',id,0 from public.kategori_kas where nama='Donasi'$$,
  'check constraint','jumlah harus > 0');

-- bayar honor tutor 1 sebesar 25000 -> saldo turun
insert into public.kas (tanggal,jenis,kategori_id,jumlah,tutor_id)
  select current_date,'pengeluaran',id,25000,'a0000000-0000-0000-0000-0000000000b1' from public.kategori_kas where nama='Honor Tutor';
select t.ok((select honor_dibayar=25000 and saldo = honor_terkumpul-25000 from public.saldo_honor() where tutor_id='a0000000-0000-0000-0000-0000000000b1'),
  'pembayaran honor mengurangi saldo');

-- soft delete
select t.err('delete from public.kas','permission denied','DELETE fisik kas ditolak');
select t.err('delete from public.pembayaran','permission denied','DELETE fisik pembayaran ditolak');
update public.kas set dihapus_pada = now() where tutor_id='a0000000-0000-0000-0000-0000000000b1';
select t.ok((select honor_dibayar=0 from public.saldo_honor() where tutor_id='a0000000-0000-0000-0000-0000000000b1'),'kas yang di-soft-delete tidak dihitung');
select t.err('update public.audit_log set aksi = ''INSERT''','permission denied','audit log tidak bisa diubah');

-- audit
select t.ok(t.n($$select 1 from public.audit_log where tabel='sesi'$$)>0,'audit mencatat perubahan sesi');
select t.ok(t.n($$select 1 from public.audit_log where tabel='kas' and pengguna_id='a0000000-0000-0000-0000-00000000000a'$$)>0,'audit kas mencatat pelaku (admin)');
select t.ok(t.n($$select 1 from public.audit_log where tabel='sesi' and pengguna_id='a0000000-0000-0000-0000-0000000000b1'$$)>0,'audit sesi mencatat pelaku (tutor)');
\echo SEMUA UJI LULUS
