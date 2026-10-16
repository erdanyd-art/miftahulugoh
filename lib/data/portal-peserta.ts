import "server-only";
import { wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { waktuDiZona } from "@/lib/waktu";

// Portal peserta (PRD 6.1). Data disaring ke peserta yang masuk oleh fungsi database.
export async function jadwalKelasSaya() {
  await wajibPeran("peserta");
  const supabase = await buatKlienServer();
  const [{ data, error }, { data: atur }] = await Promise.all([
    supabase.rpc("jadwal_kelas_saya"),
    supabase.from("pengaturan").select("zona_waktu").single(),
  ]);
  if (error) throw new Error("Gagal memuat jadwal");
  // "Hari ini" menurut zona lembaga (hanya tampilan).
  const waktu = waktuDiZona(atur?.zona_waktu ?? "Asia/Makassar");
  return { waktu, jadwal: data };
}

export async function pembayaranSaya() {
  await wajibPeran("peserta");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("pembayaran_saya");
  if (error) throw new Error("Gagal memuat pembayaran");
  return data;
}
