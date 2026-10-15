-- 0009_pembayaran_masuk_kas: pembayaran peserta berstatus Lunas otomatis tercatat sebagai pemasukan kas
-- (keputusan D13, menggantikan D4). Sinkron lewat trigger agar tidak bisa terlewat atau tercatat dobel.

-- 1) Kategori otomatis "Pembayaran Peserta" (tidak bisa dipilih manual)
alter table public.kategori_kas add column otomatis boolean not null default false;

insert into public.kategori_kas (nama, jenis, butuh_tutor, otomatis)
select 'Pembayaran Peserta', 'pemasukan', false, true
where not exists (select 1 from public.kategori_kas where lower(nama) = 'pembayaran peserta');

update public.kategori_kas
   set otomatis = true, jenis = 'pemasukan', butuh_tutor = false, aktif = true
 where lower(nama) = 'pembayaran peserta';

-- 2) Tautan kas -> pembayaran asal (satu pembayaran paling banyak satu catatan kas)
alter table public.kas add column pembayaran_id uuid unique references public.pembayaran (id) on delete restrict;

-- 3) Validasi kas: kategori otomatis dan catatan kas otomatis hanya boleh ditulis oleh sinkronisasi
create or replace function public.cek_kas()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_kat public.kategori_kas%rowtype;
  v_sinkron boolean := coalesce(current_setting('app.sinkron_pembayaran', true), '') = 'on';
begin
  select * into v_kat from public.kategori_kas where id = new.kategori_id;
  if v_kat.jenis <> new.jenis then
    raise exception 'jenis kas tidak sesuai kategori';
  end if;
  if v_kat.butuh_tutor and new.tutor_id is null then
    raise exception 'kategori ini wajib memilih tutor';
  end if;
  if not v_kat.butuh_tutor and new.tutor_id is not null then
    raise exception 'tutor hanya untuk kategori yang membutuhkan tutor';
  end if;
  if new.tutor_id is not null and not exists (
       select 1 from public.profiles where id = new.tutor_id and peran = 'tutor') then
    raise exception 'tutor_id harus pengguna berperan tutor';
  end if;
  if not v_sinkron and tg_op = 'UPDATE' and old.pembayaran_id is not null then
    raise exception 'catatan kas ini otomatis dari menu Pembayaran; ubah lewat Pembayaran';
  end if;
  if not v_sinkron and (v_kat.otomatis or new.pembayaran_id is not null) then
    raise exception 'kategori ini dicatat otomatis dari menu Pembayaran';
  end if;
  return new;
end $$;

-- 4) Sinkronisasi pembayaran -> kas
create function public.sinkron_pembayaran_kas()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_kategori uuid;
  v_nama text;
begin
  perform set_config('app.sinkron_pembayaran', 'on', true);

  if new.status = 'lunas' and new.dihapus_pada is null then
    select id into v_kategori from public.kategori_kas where otomatis and jenis = 'pemasukan' order by nama limit 1;
    select nama into v_nama from public.peserta where id = new.peserta_id;
    insert into public.kas (tanggal, jenis, kategori_id, keterangan, jumlah, pembayaran_id)
    values (new.tanggal, 'pemasukan', v_kategori, left(coalesce(v_nama, 'Peserta') || ' - ' || new.keterangan, 300),
            new.jumlah, new.id)
    on conflict (pembayaran_id) do update
      set tanggal = excluded.tanggal,
          kategori_id = excluded.kategori_id,
          keterangan = excluded.keterangan,
          jumlah = excluded.jumlah,
          dihapus_pada = null;
  else
    -- Belum lunas atau dihapus: catatan kas ikut disembunyikan (soft delete)
    update public.kas set dihapus_pada = now() where pembayaran_id = new.id and dihapus_pada is null;
  end if;

  perform set_config('app.sinkron_pembayaran', '', true);
  return null;
end $$;

create trigger pembayaran_sinkron_kas after insert or update on public.pembayaran
  for each row execute function public.sinkron_pembayaran_kas();

revoke all on function public.sinkron_pembayaran_kas(), public.cek_kas() from public, anon, authenticated;

-- 5) Pembayaran Lunas yang sudah ada ikut masuk kas
update public.pembayaran set status = status where status = 'lunas' and dihapus_pada is null;
