import "server-only";
import { wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { awalHariDiZona, tanggalBerikut } from "@/lib/waktu";

export const PER_HALAMAN_AUDIT = 25;

// Log audit hanya terbaca admin (RLS). Dipotong per halaman di database karena terus bertambah.
// dari/sampai = tanggal "YYYY-MM-DD" menurut zona lembaga (sampai inklusif).
export async function daftarAudit(filter: { tabel: string; penggunaId: string; dari: string; sampai: string; halaman: number }) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const [{ data: pengaturan }, { data: profil }] = await Promise.all([
    supabase.from("pengaturan").select("zona_waktu").single(),
    supabase.from("profiles").select("id, nama").order("nama"),
  ]);
  const zona = pengaturan?.zona_waktu ?? "Asia/Makassar";

  let kueri = supabase
    .from("audit_log")
    .select("id, waktu, pengguna_id, tabel, baris_id, aksi, sebelum, sesudah", { count: "exact" })
    .order("waktu", { ascending: false });
  if (filter.tabel) kueri = kueri.eq("tabel", filter.tabel);
  if (filter.penggunaId) kueri = kueri.eq("pengguna_id", filter.penggunaId);
  if (filter.dari) kueri = kueri.gte("waktu", awalHariDiZona(filter.dari, zona));
  if (filter.sampai) kueri = kueri.lt("waktu", awalHariDiZona(tanggalBerikut(filter.sampai), zona));

  const awal = (filter.halaman - 1) * PER_HALAMAN_AUDIT;
  const { data, count, error } = await kueri.range(awal, awal + PER_HALAMAN_AUDIT - 1);
  // Halaman di luar jangkauan: PostgREST mengembalikan galat range -> anggap kosong.
  if (error && error.code !== "PGRST103") throw new Error("Gagal memuat log audit");
  return { baris: data ?? [], jumlah: count ?? 0, pengguna: profil ?? [], zona };
}
