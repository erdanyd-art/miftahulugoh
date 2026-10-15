"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { wajibPeran } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { skemaKas, skemaKategori, skemaPembayaran } from "@/lib/validasi/keuangan";

export type StatusAksi = { galat?: string; pesan?: string } | undefined;

const idValid = (id: unknown): id is string => z.guid().safeParse(id).success;

function pesanGalatKeuangan(galat: { code?: string; message?: string }): string {
  const m = galat.message ?? "";
  if (m.includes("otomatis dari menu Pembayaran")) return "Catatan ini otomatis dari menu Pembayaran; ubah atau hapus lewat Pembayaran.";
  if (m.includes("wajib memilih tutor")) return "Kategori ini wajib memilih tutor.";
  if (m.includes("hanya untuk kategori")) return "Tutor hanya diisi untuk kategori Honor Tutor.";
  if (m.includes("tidak sesuai kategori")) return "Jenis kas tidak sesuai kategori.";
  if (m.includes("berperan tutor")) return "Pengguna yang dipilih bukan tutor.";
  if (galat.code === "23505") return "Nama kategori sudah ada.";
  if (galat.code === "23514") return "Jumlah harus lebih dari 0.";
  return "Data gagal disimpan. Coba lagi.";
}

// ===== Kas =====

export async function simpanKas(id: string | null, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (id !== null && !idValid(id)) return { galat: "Data kas tidak ditemukan." };
  const hasil = skemaKas.safeParse({
    tanggal: formData.get("tanggal"),
    kategoriId: formData.get("kategoriId"),
    keterangan: formData.get("keterangan") ?? "",
    jumlah: formData.get("jumlah"),
    tutorId: formData.get("tutorId") ?? "",
  });
  if (!hasil.success) return { galat: "Lengkapi tanggal, kategori, dan jumlah (angka bulat rupiah > 0)." };
  const d = hasil.data;

  const supabase = await buatKlienServer();
  // Jenis diambil dari kategori, bukan dari klien.
  const { data: kategori } = await supabase.from("kategori_kas").select("jenis, butuh_tutor, otomatis").eq("id", d.kategoriId).maybeSingle();
  if (!kategori) return { galat: "Kategori tidak ditemukan." };
  if (kategori.otomatis) return { galat: "Kategori ini otomatis dari menu Pembayaran." };
  if (kategori.butuh_tutor && !d.tutorId) return { galat: "Kategori ini wajib memilih tutor." };

  const baris = {
    tanggal: d.tanggal,
    jenis: kategori.jenis,
    kategori_id: d.kategoriId,
    keterangan: d.keterangan,
    jumlah: d.jumlah,
    tutor_id: kategori.butuh_tutor ? d.tutorId : null,
  };

  if (id === null) {
    const { error } = await supabase.from("kas").insert(baris);
    if (error) return { galat: pesanGalatKeuangan(error) };
    redirect(`/keuangan?bulan=${d.tanggal.slice(0, 7)}&pesan=disimpan`);
  }

  const { data, error } = await supabase.from("kas").update(baris).eq("id", id).is("dihapus_pada", null).select("id");
  if (error || !data?.length) return { galat: error ? pesanGalatKeuangan(error) : "Data kas tidak ditemukan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

// Soft delete: baris ditandai dihapus_pada, tidak dihapus fisik (DELETE dicabut di database).
export async function hapusKas(id: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(id)) return { galat: "Data kas tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kas")
    .update({ dihapus_pada: new Date().toISOString() })
    .eq("id", id)
    .is("dihapus_pada", null)
    .select("tanggal");
  if (error) return { galat: pesanGalatKeuangan(error) };
  if (!data?.length) return { galat: "Data kas gagal dihapus." };
  redirect(`/keuangan?bulan=${data[0].tanggal.slice(0, 7)}&pesan=dihapus`);
}

// ===== Pembayaran peserta =====

export async function simpanPembayaran(id: string | null, _: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (id !== null && !idValid(id)) return { galat: "Pembayaran tidak ditemukan." };
  const hasil = skemaPembayaran.safeParse({
    tanggal: formData.get("tanggal"),
    pesertaId: formData.get("pesertaId"),
    keterangan: formData.get("keterangan"),
    jumlah: formData.get("jumlah"),
    status: formData.get("status"),
  });
  if (!hasil.success) return { galat: "Lengkapi tanggal, peserta, keterangan, jumlah (rupiah > 0), dan status." };
  const d = hasil.data;
  const baris = { tanggal: d.tanggal, peserta_id: d.pesertaId, keterangan: d.keterangan, jumlah: d.jumlah, status: d.status };

  const supabase = await buatKlienServer();
  if (id === null) {
    const { error } = await supabase.from("pembayaran").insert(baris);
    if (error) return { galat: pesanGalatKeuangan(error) };
    redirect(`/pembayaran?bulan=${d.tanggal.slice(0, 7)}&pesan=disimpan`);
  }

  const { data, error } = await supabase.from("pembayaran").update(baris).eq("id", id).is("dihapus_pada", null).select("id");
  if (error || !data?.length) return { galat: error ? pesanGalatKeuangan(error) : "Pembayaran tidak ditemukan." };
  refresh();
  return { pesan: "Perubahan tersimpan." };
}

export async function hapusPembayaran(id: string): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(id)) return { galat: "Pembayaran tidak ditemukan." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("pembayaran")
    .update({ dihapus_pada: new Date().toISOString() })
    .eq("id", id)
    .is("dihapus_pada", null)
    .select("tanggal");
  if (error || !data?.length) return { galat: "Pembayaran gagal dihapus." };
  redirect(`/pembayaran?bulan=${data[0].tanggal.slice(0, 7)}&pesan=dihapus`);
}

// ===== Kategori kas =====

export async function tambahKategori(_: StatusAksi, formData: FormData): Promise<StatusAksi> {
  await wajibPeran("admin");
  const hasil = skemaKategori.safeParse({
    nama: formData.get("nama"),
    jenis: formData.get("jenis"),
    butuhTutor: formData.get("butuhTutor"),
  });
  if (!hasil.success) return { galat: "Isi nama kategori dan pilih jenisnya." };
  if (hasil.data.butuhTutor && hasil.data.jenis !== "pengeluaran") {
    return { galat: "Kategori yang memilih tutor hanya untuk pengeluaran." };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase
    .from("kategori_kas")
    .insert({ nama: hasil.data.nama, jenis: hasil.data.jenis, butuh_tutor: hasil.data.butuhTutor });
  if (error) return { galat: pesanGalatKeuangan(error) };
  refresh();
  return { pesan: `Kategori "${hasil.data.nama}" ditambahkan.` };
}

export async function ubahAktifKategori(id: string, aktif: boolean): Promise<StatusAksi> {
  await wajibPeran("admin");
  if (!idValid(id) || typeof aktif !== "boolean") return { galat: "Permintaan tidak valid." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("kategori_kas").update({ aktif }).eq("id", id).select("id");
  if (error || !data?.length) return { galat: "Status kategori gagal diubah." };
  refresh();
  return { pesan: aktif ? "Kategori diaktifkan." : "Kategori dinonaktifkan (tidak muncul di form baru)." };
}
