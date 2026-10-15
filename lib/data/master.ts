import "server-only";
import { penggunaWajib, wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";

// Semua bacaan memakai sesi pengguna, jadi RLS yang membatasi: admin melihat semua,
// tutor hanya jadwal/kelas/peserta yang ia ampu.

export async function daftarPeserta() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("peserta")
    .select("id, nama, aktif, catatan, dibuat_pada, kelas_peserta(kelas(id, nama))");
  if (error) throw new Error("Gagal memuat peserta");
  return data.map((p) => ({
    ...p,
    kelas: p.kelas_peserta.flatMap((kp) => (kp.kelas ? [kp.kelas] : [])),
  }));
}

export async function ambilPeserta(id: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("peserta")
    .select("id, nama, aktif, catatan, kelas_peserta(kelas(id, nama, aktif))")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...data, kelas: data.kelas_peserta.flatMap((kp) => (kp.kelas ? [kp.kelas] : [])) };
}

export async function daftarKelas() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kelas")
    .select("id, nama, keterangan, aktif, dibuat_pada, kelas_peserta(count), jadwal(count)");
  if (error) throw new Error("Gagal memuat kelas");
  return data.map((k) => ({
    id: k.id,
    nama: k.nama,
    keterangan: k.keterangan,
    aktif: k.aktif,
    dibuatPada: k.dibuat_pada,
    jumlahPeserta: k.kelas_peserta[0]?.count ?? 0,
    jumlahJadwal: k.jadwal[0]?.count ?? 0,
  }));
}

export async function ambilKelas(id: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("kelas")
    .select("id, nama, keterangan, aktif, kelas_peserta(peserta(id, nama, aktif))")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const anggota = data.kelas_peserta
    .flatMap((kp) => (kp.peserta ? [kp.peserta] : []))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  return { id: data.id, nama: data.nama, keterangan: data.keterangan, aktif: data.aktif, anggota };
}

const KOLOM_JADWAL =
  "id, hari, jam_mulai, jam_selesai, honor, meet_url, aktif, kelas_id, tutor_id, kelas(id, nama), tutor:profiles!jadwal_tutor_id_fkey(id, nama)" as const;

export async function daftarJadwal() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("jadwal").select(KOLOM_JADWAL);
  if (error) throw new Error("Gagal memuat jadwal");
  return data;
}

export async function ambilJadwal(id: string) {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("jadwal").select(KOLOM_JADWAL).eq("id", id).maybeSingle();
  return data;
}

// Pilihan untuk form: kelas aktif, tutor aktif, peserta aktif.
export async function pilihanForm() {
  await wajibPeran("admin");
  const supabase = await buatKlienServer();
  const [kelas, tutor, peserta] = await Promise.all([
    supabase.from("kelas").select("id, nama").eq("aktif", true).order("nama"),
    supabase.from("profiles").select("id, nama").eq("peran", "tutor").eq("aktif", true).order("nama"),
    supabase.from("peserta").select("id, nama").eq("aktif", true).order("nama"),
  ]);
  return { kelas: kelas.data ?? [], tutor: tutor.data ?? [], peserta: peserta.data ?? [] };
}

// ===== Tutor: hanya miliknya (dibatasi RLS) =====

export async function jadwalSaya() {
  const pengguna = await penggunaWajib();
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("jadwal")
    .select("id, hari, jam_mulai, jam_selesai, meet_url, aktif, kelas(id, nama)")
    .eq("tutor_id", pengguna.id)
    .order("hari")
    .order("jam_mulai");
  if (error) throw new Error("Gagal memuat jadwal");
  return data;
}

export async function kelasSaya() {
  await penggunaWajib();
  const supabase = await buatKlienServer();
  // Catatan peserta sengaja tidak diambil untuk tampilan tutor (security-checklist E7).
  const { data, error } = await supabase
    .from("kelas")
    .select("id, nama, keterangan, aktif, kelas_peserta(peserta(id, nama, aktif))")
    .order("nama");
  if (error) throw new Error("Gagal memuat kelas");
  return data.map((k) => ({
    id: k.id,
    nama: k.nama,
    keterangan: k.keterangan,
    aktif: k.aktif,
    anggota: k.kelas_peserta
      .flatMap((kp) => (kp.peserta ? [kp.peserta] : []))
      .sort((a, b) => a.nama.localeCompare(b.nama, "id")),
  }));
}
