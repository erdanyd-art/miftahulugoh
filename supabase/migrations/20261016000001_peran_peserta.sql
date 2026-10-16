-- 0010_peran_peserta: peran login ketiga untuk peserta (Fase 2, D11).
-- Nilai enum baru harus di migrasi tersendiri: belum boleh dipakai di transaksi yang sama.
alter type public.peran_pengguna add value if not exists 'peserta';
