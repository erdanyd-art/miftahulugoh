import "server-only";
import { wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { rentangBulan } from "@/lib/waktu";

// Keuangan khusus admin (RLS juga menolak tutor). Soft delete: SETIAP query menyaring dihapus_pada is null.

const KOLOM_KAS =
  "id, tanggal, jenis, keterangan, jumlah, kategori_id, tutor_id, kategori:kategori_kas(id, nama, jenis, butuh_tutor), tutor:profiles!kas_tutor_id_fkey(id, nama)" as const;

export async function daftarKategori() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("kategori_kas").select("id, nama, jenis, butuh_tutor, aktif").order("nama");
  if (error) throw new Error("Gagal memuat kategori");
  return data;
}

export async function daftarKas(dari: string, sampai: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kas")
    .select(KOLOM_KAS)
    .is("dihapus_pada", null)
    .gte("tanggal", dari)
    .lt("tanggal", sampai)
    .order("tanggal", { ascending: false })
    .order("dibuat_pada", { ascending: false });
  if (error) throw new Error("Gagal memuat kas");
  return data;
}

export async function ambilKas(id: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("kas").select(KOLOM_KAS).eq("id", id).is("dihapus_pada", null).maybeSingle();
  return data;
}

const KOLOM_BAYAR = "id, tanggal, keterangan, jumlah, status, peserta_id, peserta(id, nama)" as const;

export async function daftarPembayaran(dari: string, sampai: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("pembayaran")
    .select(KOLOM_BAYAR)
    .is("dihapus_pada", null)
    .gte("tanggal", dari)
    .lt("tanggal", sampai)
    .order("tanggal", { ascending: false })
    .order("dibuat_pada", { ascending: false });
  if (error) throw new Error("Gagal memuat pembayaran");
  return data;
}

export async function ambilPembayaran(id: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pembayaran").select(KOLOM_BAYAR).eq("id", id).is("dihapus_pada", null).maybeSingle();
  return data;
}

export async function pilihanKeuangan() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const [kategori, tutor, peserta] = await Promise.all([
    supabase.from("kategori_kas").select("id, nama, jenis, butuh_tutor").eq("aktif", true).order("nama"),
    supabase.from("profiles").select("id, nama").eq("peran", "tutor").order("nama"),
    supabase.from("peserta").select("id, nama").eq("aktif", true).order("nama"),
  ]);
  return { kategori: kategori.data ?? [], tutor: tutor.data ?? [], peserta: peserta.data ?? [] };
}

export type BulanRekap = {
  bulan: string;
  pemasukan: number;
  pengeluaran: number;
  bayarLunas: number;
  bayarBelum: number;
  honorTutorSesi: number;
  honorTutorDibayar: number;
  honorPegawai: number;
};

// Rekap per bulan untuk rentang [dariBulan .. sampaiBulan]. Kas dan pembayaran peserta TIDAK dijumlahkan (asumsi A3).
export async function rekapBulanan(bulanList: string[]): Promise<BulanRekap[]> {
  await wajibPeran("admin");
  const dari = rentangBulan(bulanList[0]).dari;
  const sampai = rentangBulan(bulanList[bulanList.length - 1]).sampai;
  const supabase = await buatKlienServer();
  const [kas, bayar, sesi] = await Promise.all([
    supabase
      .from("kas")
      .select("tanggal, jenis, jumlah, kategori:kategori_kas(nama, butuh_tutor)")
      .is("dihapus_pada", null)
      .gte("tanggal", dari)
      .lt("tanggal", sampai),
    supabase.from("pembayaran").select("tanggal, jumlah, status").is("dihapus_pada", null).gte("tanggal", dari).lt("tanggal", sampai),
    supabase.from("sesi").select("tanggal, honor").gte("tanggal", dari).lt("tanggal", sampai),
  ]);
  if (kas.error || bayar.error || sesi.error) throw new Error("Gagal memuat rekap");

  const per = new Map<string, BulanRekap>(
    bulanList.map((b) => [
      b,
      { bulan: b, pemasukan: 0, pengeluaran: 0, bayarLunas: 0, bayarBelum: 0, honorTutorSesi: 0, honorTutorDibayar: 0, honorPegawai: 0 },
    ]),
  );
  for (const k of kas.data) {
    const r = per.get(k.tanggal.slice(0, 7));
    if (!r) continue;
    if (k.jenis === "pemasukan") r.pemasukan += k.jumlah;
    else r.pengeluaran += k.jumlah;
    if (k.kategori?.butuh_tutor) r.honorTutorDibayar += k.jumlah;
    if (k.kategori?.nama === "Honor Pegawai") r.honorPegawai += k.jumlah;
  }
  for (const p of bayar.data) {
    const r = per.get(p.tanggal.slice(0, 7));
    if (!r) continue;
    if (p.status === "lunas") r.bayarLunas += p.jumlah;
    else r.bayarBelum += p.jumlah;
  }
  for (const s of sesi.data) {
    const r = per.get(s.tanggal.slice(0, 7));
    if (r) r.honorTutorSesi += s.honor;
  }
  return [...per.values()];
}

export async function jumlahBelumLunas() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("pembayaran")
    .select("jumlah")
    .eq("status", "belum_lunas")
    .is("dihapus_pada", null);
  if (error) throw new Error("Gagal memuat pembayaran belum lunas");
  return { jumlahData: data.length, total: data.reduce((n, p) => n + p.jumlah, 0) };
}

// Rekap honor per tutor per bulan dalam satu tahun: honor sesi (dari absensi) dan honor dibayar (kas Honor Tutor).
export async function rekapHonorTahun(tahun: number) {
  await wajibPeran("admin");
  const dari = `${tahun}-01-01`;
  const sampai = `${tahun + 1}-01-01`;
  const supabase = await buatKlienServer();
  const [sesi, kas] = await Promise.all([
    supabase
      .from("sesi")
      .select("tanggal, honor, tutor:profiles!sesi_tutor_id_fkey(id, nama)")
      .gte("tanggal", dari)
      .lt("tanggal", sampai),
    supabase
      .from("kas")
      .select("tanggal, jumlah, tutor:profiles!kas_tutor_id_fkey(id, nama)")
      .not("tutor_id", "is", null)
      .is("dihapus_pada", null)
      .gte("tanggal", dari)
      .lt("tanggal", sampai),
  ]);
  if (sesi.error || kas.error) throw new Error("Gagal memuat rekap honor");

  type Baris = { bulan: string; tutor: string; jumlahSesi: number; honorSesi: number; honorDibayar: number };
  const per = new Map<string, Baris>();
  const ambil = (bulan: string, tutor: string) => {
    const kunci = `${bulan}|${tutor}`;
    if (!per.has(kunci)) per.set(kunci, { bulan, tutor, jumlahSesi: 0, honorSesi: 0, honorDibayar: 0 });
    return per.get(kunci)!;
  };
  for (const s of sesi.data) {
    const b = ambil(s.tanggal.slice(0, 7), s.tutor?.nama ?? "-");
    b.jumlahSesi += 1;
    b.honorSesi += s.honor;
  }
  for (const k of kas.data) ambil(k.tanggal.slice(0, 7), k.tutor?.nama ?? "-").honorDibayar += k.jumlah;
  return [...per.values()].sort((a, b) => a.bulan.localeCompare(b.bulan) || a.tutor.localeCompare(b.tutor, "id"));
}
