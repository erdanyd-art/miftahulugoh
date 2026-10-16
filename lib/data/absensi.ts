import "server-only";
import { penggunaStaf, wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { rentangBulan, waktuDiZona, type WaktuLembaga } from "@/lib/waktu";

// Semua bacaan memakai sesi pengguna: RLS membatasi tutor ke jadwal/sesi miliknya.

export async function waktuLembaga(): Promise<WaktuLembaga> {
  await penggunaStaf();
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pengaturan").select("zona_waktu").single();
  return waktuDiZona(data?.zona_waktu ?? "Asia/Makassar");
}

export type JadwalHariIni = Awaited<ReturnType<typeof jadwalHariIni>>["jadwal"][number];

// Jadwal aktif hari ini (zona lembaga) beserta sesi hari ini bila sudah diabsen.
export async function jadwalHariIni() {
  const pengguna = await penggunaStaf();
  const waktu = await waktuLembaga();
  const supabase = await buatKlienServer();

  let kueri = supabase
    .from("jadwal")
    .select("id, jam_mulai, jam_selesai, meet_url, kelas(id, nama), tutor:profiles!jadwal_tutor_id_fkey(id, nama)")
    .eq("hari", waktu.hari)
    .eq("aktif", true)
    .order("jam_mulai");
  if (pengguna.peran === "tutor") kueri = kueri.eq("tutor_id", pengguna.id);
  const { data: jadwal, error } = await kueri;
  if (error) throw new Error("Gagal memuat jadwal hari ini");

  const { data: sesi } = await supabase
    .from("sesi")
    .select("id, jadwal_id, hadir, total, honor, dikunci")
    .eq("tanggal", waktu.tanggal)
    .in("jadwal_id", jadwal.map((j) => j.id));
  const sesiPer = new Map((sesi ?? []).map((s) => [s.jadwal_id, s]));

  return {
    waktu,
    jadwal: jadwal.map((j) => ({
      ...j,
      sesi: sesiPer.get(j.id) ?? null,
      sudahMulai: j.jam_mulai.slice(0, 5) <= waktu.jam,
    })),
  };
}

// Data form absen: jadwal, anggota aktif kelas, dan sesi pada tanggal itu (bila ada).
export async function dataFormAbsen(jadwalId: string, tanggal: string) {
  await penggunaStaf();
  const supabase = await buatKlienServer();
  const { data: jadwal } = await supabase
    .from("jadwal")
    .select("id, hari, jam_mulai, jam_selesai, aktif, kelas_id, kelas(id, nama), tutor:profiles!jadwal_tutor_id_fkey(id, nama)")
    .eq("id", jadwalId)
    .maybeSingle();
  if (!jadwal) return null;

  const [{ data: anggota }, { data: sesi }] = await Promise.all([
    supabase.from("kelas_peserta").select("peserta(id, nama, aktif)").eq("kelas_id", jadwal.kelas_id),
    supabase
      .from("sesi")
      .select("id, hadir, total, honor, honor_standar, honor_dikoreksi, dikunci, absensi_murid(peserta_id, hadir)")
      .eq("jadwal_id", jadwalId)
      .eq("tanggal", tanggal)
      .maybeSingle(),
  ]);

  const peserta = (anggota ?? [])
    .flatMap((a) => (a.peserta && a.peserta.aktif ? [a.peserta] : []))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  const hadir = new Set((sesi?.absensi_murid ?? []).filter((a) => a.hadir).map((a) => a.peserta_id));
  return { jadwal, peserta, sesi, hadir };
}

const KOLOM_SESI =
  "id, tanggal, hadir, total, honor, honor_standar, honor_dikoreksi, dikunci, jadwal_id, kelas:kelas!sesi_kelas_id_fkey(id, nama), tutor:profiles!sesi_tutor_id_fkey(id, nama), jadwal(jam_mulai, jam_selesai)" as const;

export async function daftarSesi(bulan: string) {
  await penggunaStaf();
  const { dari, sampai } = rentangBulan(bulan);
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("sesi")
    .select(KOLOM_SESI)
    .gte("tanggal", dari)
    .lt("tanggal", sampai)
    .order("tanggal", { ascending: false });
  if (error) throw new Error("Gagal memuat sesi");
  return data;
}

export async function ambilSesi(id: string) {
  await penggunaStaf();
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("sesi")
    .select(`${KOLOM_SESI}, absensi_murid(hadir, peserta(id, nama))`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const murid = data.absensi_murid
    .flatMap((a) => (a.peserta ? [{ ...a.peserta, hadir: a.hadir }] : []))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  return { ...data, murid };
}

// Saldo honor dari fungsi database (tutor: miliknya; admin: semua tutor).
export async function saldoHonor() {
  await penggunaStaf();
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("saldo_honor");
  if (error) throw new Error("Gagal memuat saldo honor");
  return data;
}

export async function honorBulanIni() {
  const pengguna = await wajibPeran("tutor");
  const waktu = await waktuLembaga();
  const sesi = await daftarSesi(waktu.bulan);
  return {
    waktu,
    total: sesi.filter((s) => s.tutor?.id === pengguna.id).reduce((n, s) => n + s.honor, 0),
  };
}
