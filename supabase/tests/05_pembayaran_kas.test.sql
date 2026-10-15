-- Tes sinkronisasi pembayaran peserta -> kas (keputusan D13).
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
 ('a0000000-0000-0000-0000-00000000000a','admin@uji.test'),
 ('a0000000-0000-0000-0000-0000000000b1','t1@uji.test');
insert into public.profiles (id, nama, peran) values
 ('a0000000-0000-0000-0000-00000000000a','Admin','admin'),
 ('a0000000-0000-0000-0000-0000000000b1','Tutor Satu','tutor');
insert into public.peserta (id, nama) values ('c0000000-0000-0000-0000-0000000000c1','Ahmad Uji');

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';

-- Belum lunas: tidak masuk kas
insert into public.pembayaran (id, tanggal, peserta_id, keterangan, jumlah, status)
values ('f0000000-0000-0000-0000-0000000000f1', '2026-10-15', 'c0000000-0000-0000-0000-0000000000c1', 'SPP Oktober', 150000, 'belum_lunas');
select is((select count(*) from public.kas where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'), 0::bigint,
  'pembayaran belum lunas tidak masuk kas');

-- Jadi lunas: masuk kas sebagai pemasukan kategori otomatis
update public.pembayaran set status = 'lunas' where id = 'f0000000-0000-0000-0000-0000000000f1';
select ok((select k.jenis = 'pemasukan' and k.jumlah = 150000 and k.dihapus_pada is null and kk.otomatis
             and k.keterangan = 'Ahmad Uji - SPP Oktober'
           from public.kas k join public.kategori_kas kk on kk.id = k.kategori_id
          where k.pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'),
  'pembayaran lunas tercatat sebagai pemasukan kas "Pembayaran Peserta"');

-- Diubah: kas ikut berubah (tetap satu baris)
update public.pembayaran set jumlah = 175000, tanggal = '2026-10-16' where id = 'f0000000-0000-0000-0000-0000000000f1';
select ok((select jumlah = 175000 and tanggal = '2026-10-16' from public.kas where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'),
  'perubahan jumlah dan tanggal ikut ke kas');
select is((select count(*) from public.kas where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'), 1::bigint,
  'tetap satu catatan kas per pembayaran');

-- Kembali belum lunas: kas disembunyikan; lunas lagi: muncul lagi
update public.pembayaran set status = 'belum_lunas' where id = 'f0000000-0000-0000-0000-0000000000f1';
select ok((select dihapus_pada is not null from public.kas where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'),
  'status kembali belum lunas: catatan kas disembunyikan');
update public.pembayaran set status = 'lunas' where id = 'f0000000-0000-0000-0000-0000000000f1';
select ok((select dihapus_pada is null from public.kas where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'),
  'lunas lagi: catatan kas muncul lagi');

-- Pembayaran dihapus (soft delete): kas ikut disembunyikan
update public.pembayaran set dihapus_pada = now() where id = 'f0000000-0000-0000-0000-0000000000f1';
select ok((select dihapus_pada is not null from public.kas where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f1'),
  'pembayaran dihapus: catatan kas ikut disembunyikan');

-- Tidak bisa dicatat atau diubah manual (mencegah dobel)
select throws_like($$insert into public.kas (tanggal, jenis, kategori_id, jumlah)
  select '2026-10-15', 'pemasukan', id, 1000 from public.kategori_kas where otomatis$$,
  '%otomatis dari menu Pembayaran%', 'kategori Pembayaran Peserta tidak bisa dipilih manual');
insert into public.pembayaran (id, tanggal, peserta_id, keterangan, jumlah, status)
values ('f0000000-0000-0000-0000-0000000000f2', '2026-10-15', 'c0000000-0000-0000-0000-0000000000c1', 'Infaq', 20000, 'lunas');
select throws_like($$update public.kas set jumlah = 1 where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f2'$$,
  '%ubah lewat Pembayaran%', 'catatan kas otomatis tidak bisa diubah manual');
select throws_like($$update public.kas set dihapus_pada = now() where pembayaran_id = 'f0000000-0000-0000-0000-0000000000f2'$$,
  '%ubah lewat Pembayaran%', 'catatan kas otomatis tidak bisa dihapus manual');
select ok((select count(*) = 1 from public.audit_log where tabel = 'kas' and aksi = 'INSERT'
             and sesudah ->> 'pembayaran_id' = 'f0000000-0000-0000-0000-0000000000f2'
             and pengguna_id = 'a0000000-0000-0000-0000-00000000000a'),
  'kas otomatis tercatat di audit dengan pelaku admin');

-- Tutor tetap tidak melihat kas
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-0000000000b1';
select is((select count(*) from public.kas), 0::bigint, 'tutor tidak melihat kas (termasuk kas otomatis)');

select * from finish();
rollback;
