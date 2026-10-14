-- Tes RLS dan aturan bisnis Fase 1 (pgTAP): 70 skenario yang sama dengan docs/uji_rls.sql.
-- Jalankan: npx supabase test db. Semua berjalan dalam satu transaksi lalu di-rollback.
-- Data uji memakai UUID tetap; hitungan untuk admin dibatasi ke data uji agar tidak bergantung pada seed.
begin;
create extension if not exists pgtap with schema extensions;
select plan(70);

-- ===== data awal (sebagai pemilik database) =====
update public.pengaturan set zona_waktu = 'Asia/Makassar';

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b2','t2@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b3','t3@uji.test');
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
 ('d0000000-0000-0000-0000-0000000000d1','Uji K1'),
 ('d0000000-0000-0000-0000-0000000000d2','Uji K2'),
 ('d0000000-0000-0000-0000-0000000000d3','Uji K3');
insert into public.kelas_peserta (kelas_id, peserta_id) values
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c2'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c3'),
 ('d0000000-0000-0000-0000-0000000000d1','c0000000-0000-0000-0000-0000000000c4'),
 ('d0000000-0000-0000-0000-0000000000d2','c0000000-0000-0000-0000-0000000000c1'),
 ('d0000000-0000-0000-0000-0000000000d3','c0000000-0000-0000-0000-0000000000c5');
-- e1, e2, e3, e5: hari ini (zona lembaga); e4: hari lain
insert into public.jadwal (id, kelas_id, tutor_id, hari, jam_mulai, jam_selesai, honor) values
 ('e0000000-0000-0000-0000-0000000000e1','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',
   extract(isodow from now() at time zone 'Asia/Makassar')::int,'00:00','23:59',100000),
 ('e0000000-0000-0000-0000-0000000000e2','d0000000-0000-0000-0000-0000000000d2','a0000000-0000-0000-0000-0000000000b2',
   extract(isodow from now() at time zone 'Asia/Makassar')::int,'00:00','23:59',120001),
 ('e0000000-0000-0000-0000-0000000000e3','d0000000-0000-0000-0000-0000000000d2','a0000000-0000-0000-0000-0000000000b1',
   extract(isodow from now() at time zone 'Asia/Makassar')::int,'23:59:00','23:59:30',50000),
 ('e0000000-0000-0000-0000-0000000000e4','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',
   (extract(isodow from now() at time zone 'Asia/Makassar')::int % 7) + 1,'00:00','23:59',100000),
 ('e0000000-0000-0000-0000-0000000000e5','d0000000-0000-0000-0000-0000000000d3','a0000000-0000-0000-0000-0000000000b2',
   extract(isodow from now() at time zone 'Asia/Makassar')::int,'00:00','23:59',90000);
insert into public.pembayaran (id, tanggal, peserta_id, keterangan, jumlah, status)
 values ('f0000000-0000-0000-0000-0000000000f2', current_date,'c0000000-0000-0000-0000-0000000000c1','SPP',250000,'lunas');
insert into public.kas (id, tanggal, jenis, kategori_id, jumlah)
 select 'f0000000-0000-0000-0000-0000000000f1', current_date,'pemasukan', id, 500000 from public.kategori_kas where nama='Donasi';

-- constraint di sisi tabel
select throws_like($q$insert into public.jadwal (kelas_id,tutor_id,hari,jam_mulai,jam_selesai,honor)
  values ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-00000000000a',1,'08:00','09:00',1)$q$,
  '%berperan tutor%','jadwal tidak boleh memakai admin sebagai tutor');
select throws_like($q$insert into public.jadwal (kelas_id,tutor_id,hari,jam_mulai,jam_selesai,honor)
  values ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',1,'09:00','08:00',1)$q$,
  '%check constraint%','jam selesai harus setelah jam mulai');
select throws_like($q$insert into public.jadwal (kelas_id,tutor_id,hari,jam_mulai,jam_selesai,honor)
  values ('d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',8,'08:00','09:00',1)$q$,
  '%check constraint%','hari harus 1..7');

-- ===== TUTOR 1 =====
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';

select ok(public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',
    (now() at time zone 'Asia/Makassar')::date,
    array['c0000000-0000-0000-0000-0000000000c1','c0000000-0000-0000-0000-0000000000c2']::uuid[]) is not null,
  'tutor menyimpan absensi jadwal miliknya');
select ok((select hadir=2 and total=3 and honor=100000 and honor_standar=100000 from public.sesi
            where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'hadir 2 dari 3 (peserta nonaktif tidak dihitung), honor penuh 100000');
select ok((select count(*)=3 and count(*) filter (where hadir)=2 from public.absensi_murid), 'tiga baris absensi per murid');

-- hadir 0 -> setengah, lalu simpan ulang -> penuh
do $$ begin perform public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[]); end $$;
select ok((select hadir=0 and total=3 and honor=50000 from public.sesi where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'hadir 0 -> honor setengah (50000)');
do $$ begin perform public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c3']::uuid[]); end $$;
select ok((select hadir=1 and honor=100000 from public.sesi where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'simpan ulang memperbarui sesi (tetap satu baris) dan honor kembali penuh');
select ok((select count(*)=1 from public.sesi), 'hanya satu sesi per jadwal per tanggal');

-- aturan jendela dan kepemilikan
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date - 1,'{}'::uuid[])$$,
  '%hanya untuk hari ini%','tutor tidak bisa absen untuk kemarin');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date + 1,'{}'::uuid[])$$,
  '%belum tiba%','tutor tidak bisa absen untuk besok');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e3',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  '%belum waktunya%','tutor tidak bisa absen sebelum jam mulai');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e4',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  '%bukan untuk hari ini%','jadwal hari lain ditolak');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e2',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  '%bukan jadwal Anda%','tutor tidak bisa mengabsen jadwal tutor lain');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c5']::uuid[])$$,
  '%bukan anggota aktif kelas%','peserta di luar kelas ditolak');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c4']::uuid[])$$,
  '%bukan anggota aktif kelas%','peserta nonaktif ditolak');

-- tutor tidak boleh menulis langsung / fungsi admin
select throws_like($$insert into public.sesi (jadwal_id,kelas_id,tutor_id,tanggal,honor_standar,honor) values
  ('e0000000-0000-0000-0000-0000000000e1','d0000000-0000-0000-0000-0000000000d1','a0000000-0000-0000-0000-0000000000b1',current_date+5,1,999999)$$,
  '%permission denied%','tutor tidak bisa INSERT langsung ke sesi');
select throws_like($$update public.sesi set honor = 999999999$$,'%permission denied%','tutor tidak bisa UPDATE langsung sesi');
select throws_like($$select public.koreksi_honor((select id from public.sesi limit 1), 1)$$,'%tidak berwenang%','tutor tidak bisa koreksi honor');
select throws_like($$select public.kunci_sesi((select id from public.sesi limit 1), true)$$,'%tidak berwenang%','tutor tidak bisa mengunci sesi');
with u as (update public.jadwal set honor = 999999999 where id='e0000000-0000-0000-0000-0000000000e1' returning 1)
  select is((select count(*) from u), 0::bigint, 'tutor tidak bisa mengubah honor jadwal (0 baris terubah)');
select ok((select honor=100000 from public.jadwal where id='e0000000-0000-0000-0000-0000000000e1'), 'honor jadwal tidak berubah');

-- tautan Meet
do $$ begin perform public.ubah_meet('e0000000-0000-0000-0000-0000000000e1','https://meet.google.com/abc-defg-hij'); end $$;
select ok((select meet_url='https://meet.google.com/abc-defg-hij' from public.jadwal where id='e0000000-0000-0000-0000-0000000000e1'),
  'tutor mengubah tautan Meet jadwal miliknya');
select throws_like($$select public.ubah_meet('e0000000-0000-0000-0000-0000000000e2','https://meet.google.com/x')$$,'%bukan jadwal Anda%','tutor tidak bisa ubah Meet jadwal orang lain');
select throws_like($$select public.ubah_meet('e0000000-0000-0000-0000-0000000000e1','javascript:alert(1)')$$,'%check constraint%','URL selain https ditolak');

-- visibilitas data
select is((select count(*) from public.kas), 0::bigint,          'tutor tidak melihat kas');
select is((select count(*) from public.pembayaran), 0::bigint,   'tutor tidak melihat pembayaran');
select is((select count(*) from public.kategori_kas), 0::bigint, 'tutor tidak melihat kategori kas');
select is((select count(*) from public.audit_log), 0::bigint,    'tutor tidak melihat audit log');
select is((select count(*) from public.profiles), 1::bigint,     'tutor hanya melihat profilnya sendiri');
select is((select count(*) from public.jadwal), 3::bigint,       'tutor hanya melihat 3 jadwal miliknya');
select is((select count(*) from public.kelas), 2::bigint,        'tutor melihat kelas yang diampu saja (K1, K2)');
select is((select count(*) from public.peserta where id='c0000000-0000-0000-0000-0000000000c5'), 0::bigint,
  'tutor tidak melihat peserta kelas tutor lain');
select is((select count(*) from public.peserta), 4::bigint,      'tutor melihat peserta kelasnya (P1-P4)');
select throws_like($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) values (current_date,'pemasukan',gen_random_uuid(),1)$$,
  '%row-level security%','tutor tidak bisa menulis kas');
select throws_like($$insert into public.pembayaran (tanggal,peserta_id,keterangan,jumlah) values (current_date,'c0000000-0000-0000-0000-0000000000c1','x',1)$$,
  '%row-level security%','tutor tidak bisa menulis pembayaran');
select throws_like($$insert into public.peserta (nama) values ('hantu')$$,'%row-level security%','tutor tidak bisa menambah peserta');
with u as (update public.profiles set peran='admin' where id='a0000000-0000-0000-0000-0000000000b1' returning 1)
  select is((select count(*) from u), 0::bigint, 'tutor tidak bisa mengubah perannya sendiri menjadi admin');
select is((select count(*) from public.saldo_honor()), 1::bigint, 'tutor hanya melihat saldo honornya sendiri');
select ok((select honor_terkumpul=100000 and honor_dibayar=0 and saldo=100000 from public.saldo_honor()), 'saldo tutor 1 = 100000');

-- ===== ANON =====
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
select throws_like('select * from public.kas','%permission denied%','anon ditolak di kas');
select throws_like('select * from public.profiles','%permission denied%','anon ditolak di profiles');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',current_date,'{}'::uuid[])$$,
  '%permission denied%','anon tidak bisa memanggil fungsi absensi');

-- ===== TUTOR NONAKTIF =====
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b3';
select is((select count(*) from public.profiles), 0::bigint, 'tutor nonaktif tidak melihat apa pun di profiles');
select is((select count(*) from public.kelas), 0::bigint,    'tutor nonaktif tidak melihat kelas');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  '%tidak berwenang%','tutor nonaktif tidak bisa absen');

-- ===== TUTOR 2 =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b2';
select is((select count(*) from public.sesi), 0::bigint,          'tutor 2 tidak melihat sesi tutor 1');
select is((select count(*) from public.absensi_murid), 0::bigint, 'tutor 2 tidak melihat absensi tutor 1');
do $$ begin perform public.simpan_absensi('e0000000-0000-0000-0000-0000000000e2',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[]); end $$;
select ok((select honor=60000 and honor_standar=120001 from public.sesi), 'honor ganjil 120001 hadir 0 -> 60000 (dibulatkan ke bawah)');

-- ===== ADMIN =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.profiles where id::text like 'a0000000-0000-0000-0000-0000000000%'), 4::bigint,
  'admin melihat semua profil');
select is((select count(*) from public.sesi
            where tutor_id in ('a0000000-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-0000000000b2')), 2::bigint,
  'admin melihat semua sesi');
select ok((select count(*) from public.kas where id='f0000000-0000-0000-0000-0000000000f1') = 1
      and (select count(*) from public.pembayaran where id='f0000000-0000-0000-0000-0000000000f2') = 1,
  'admin melihat kas dan pembayaran');
select is((select count(*) from public.saldo_honor()
            where tutor_id in ('a0000000-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-0000000000b2',
                               'a0000000-0000-0000-0000-0000000000b3')), 3::bigint,
  'admin melihat saldo semua tutor aktif dan nonaktif (3 tutor)');

-- kunci sesi
do $$ begin perform public.kunci_sesi((select id from public.sesi where tutor_id='a0000000-0000-0000-0000-0000000000b1'), true); end $$;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,'{}'::uuid[])$$,
  '%sesi sudah dikunci%','sesi terkunci tidak bisa diubah tutor');
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
do $$ begin
  perform public.koreksi_honor((select id from public.sesi where tutor_id='a0000000-0000-0000-0000-0000000000b1'), 77777);
  perform public.kunci_sesi((select id from public.sesi where tutor_id='a0000000-0000-0000-0000-0000000000b1'), false);
end $$;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
do $$ begin perform public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date,
  array['c0000000-0000-0000-0000-0000000000c1']::uuid[]); end $$;
select ok((select honor=77777 and honor_dikoreksi from public.sesi where jadwal_id='e0000000-0000-0000-0000-0000000000e1'),
  'koreksi admin tidak tertimpa saat tutor menyimpan ulang');

-- admin boleh absen untuk kemarin
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
do $$ begin perform public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date - 1,
  array['c0000000-0000-0000-0000-0000000000c1']::uuid[]); end $$;
select is((select count(*) from public.sesi
            where tutor_id in ('a0000000-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-0000000000b2')), 3::bigint,
  'admin menyimpan absensi tanggal lampau (koreksi)');
select throws_like($$select public.simpan_absensi('e0000000-0000-0000-0000-0000000000e1',(now() at time zone 'Asia/Makassar')::date + 1,'{}'::uuid[])$$,
  '%belum tiba%','admin tidak bisa mencatat absensi tanggal yang belum tiba');

-- validasi kas
select throws_like($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) select current_date,'pengeluaran',id,1000 from public.kategori_kas where nama='Honor Tutor'$$,
  '%wajib memilih tutor%','Honor Tutor tanpa tutor ditolak');
select throws_like($$insert into public.kas (tanggal,jenis,kategori_id,jumlah,tutor_id) select current_date,'pengeluaran',id,1000,'a0000000-0000-0000-0000-0000000000b1' from public.kategori_kas where nama='Operasional'$$,
  '%hanya untuk kategori%','tutor pada kategori biasa ditolak');
select throws_like($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) select current_date,'pemasukan',id,1000 from public.kategori_kas where nama='Operasional'$$,
  '%tidak sesuai kategori%','jenis tidak cocok kategori ditolak');
select throws_like($$insert into public.kas (tanggal,jenis,kategori_id,jumlah,tutor_id) select current_date,'pengeluaran',id,1000,'a0000000-0000-0000-0000-00000000000a' from public.kategori_kas where nama='Honor Tutor'$$,
  '%berperan tutor%','admin tidak bisa dipilih sebagai tutor honor');
select throws_like($$insert into public.kas (tanggal,jenis,kategori_id,jumlah) select current_date,'pemasukan',id,0 from public.kategori_kas where nama='Donasi'$$,
  '%check constraint%','jumlah harus > 0');

-- bayar honor tutor 1 sebesar 25000 -> saldo turun
insert into public.kas (tanggal,jenis,kategori_id,jumlah,tutor_id)
  select current_date,'pengeluaran',id,25000,'a0000000-0000-0000-0000-0000000000b1' from public.kategori_kas where nama='Honor Tutor';
select ok((select honor_dibayar=25000 and saldo = honor_terkumpul-25000 from public.saldo_honor() where tutor_id='a0000000-0000-0000-0000-0000000000b1'),
  'pembayaran honor mengurangi saldo');

-- soft delete
select throws_like('delete from public.kas','%permission denied%','DELETE fisik kas ditolak');
select throws_like('delete from public.pembayaran','%permission denied%','DELETE fisik pembayaran ditolak');
update public.kas set dihapus_pada = now() where tutor_id='a0000000-0000-0000-0000-0000000000b1';
select ok((select honor_dibayar=0 from public.saldo_honor() where tutor_id='a0000000-0000-0000-0000-0000000000b1'),'kas yang di-soft-delete tidak dihitung');
select throws_like($$update public.audit_log set aksi = 'INSERT'$$,'%permission denied%','audit log tidak bisa diubah');

-- audit
select ok((select count(*) from public.audit_log where tabel='sesi') > 0, 'audit mencatat perubahan sesi');
select ok((select count(*) from public.audit_log where tabel='kas' and pengguna_id='a0000000-0000-0000-0000-00000000000a') > 0,
  'audit kas mencatat pelaku (admin)');
select ok((select count(*) from public.audit_log where tabel='sesi' and pengguna_id='a0000000-0000-0000-0000-0000000000b1') > 0,
  'audit sesi mencatat pelaku (tutor)');

select * from finish();
rollback;
