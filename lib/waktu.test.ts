import { describe, expect, it } from "vitest";
import { pesanGalatAbsensi } from "./pesan-galat";
import { bulanMundur, bulanValid, formatTanggal, namaBulan, rentangBulan, waktuDiZona } from "./waktu";

describe("waktuDiZona", () => {
  // 2026-10-14 16:30 UTC = Kamis 00:30 WITA (sudah ganti tanggal), masih Rabu 23:30 WIB
  const saat = new Date("2026-10-14T16:30:00Z");

  it("memakai zona lembaga, bukan jam perangkat", () => {
    expect(waktuDiZona("Asia/Makassar", saat)).toEqual({ tanggal: "2026-10-15", hari: 4, jam: "00:30", bulan: "2026-10" });
    expect(waktuDiZona("Asia/Jakarta", saat)).toEqual({ tanggal: "2026-10-14", hari: 3, jam: "23:30", bulan: "2026-10" });
  });

  it("Ahad bernilai 7 (ISO)", () => {
    expect(waktuDiZona("Asia/Makassar", new Date("2026-10-18T03:00:00Z")).hari).toBe(7);
  });
});

describe("bulan", () => {
  it("rentang bulan termasuk pergantian tahun", () => {
    expect(rentangBulan("2026-10")).toEqual({ dari: "2026-10-01", sampai: "2026-11-01" });
    expect(rentangBulan("2026-12")).toEqual({ dari: "2026-12-01", sampai: "2027-01-01" });
  });

  it("validasi dan nama", () => {
    expect(bulanValid("2026-10")).toBe(true);
    expect(bulanValid("2026-13")).toBe(false);
    expect(bulanValid("abc")).toBe(false);
    expect(namaBulan("2026-10")).toBe("Oktober 2026");
    expect(formatTanggal("2026-10-05")).toBe("5 Okt 2026");
  });
});

describe("pesanGalatAbsensi", () => {
  it("memetakan pesan database ke bahasa ramah", () => {
    expect(pesanGalatAbsensi("belum waktunya absen")).toContain("Absen dibuka mulai jam mulai");
    expect(pesanGalatAbsensi("sesi sudah dikunci")).toContain("dikunci admin");
    expect(pesanGalatAbsensi("daftar hadir memuat peserta yang bukan anggota aktif kelas")).toContain("bukan anggota aktif");
    expect(pesanGalatAbsensi("galat lain")).toBe("Terjadi kesalahan. Coba lagi.");
    expect(pesanGalatAbsensi(undefined)).toBe("Terjadi kesalahan. Coba lagi.");
  });
});

describe("bulanMundur", () => {
  it("menyusun bulan mundur melewati pergantian tahun", () => {
    expect(bulanMundur("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});
