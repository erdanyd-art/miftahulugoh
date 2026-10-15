import { describe, expect, it } from "vitest";
import { skemaJadwal, skemaMeet, skemaPeserta } from "./master";

const jadwal = {
  kelasId: "20000000-0000-0000-0000-000000000001",
  tutorId: "10000000-0000-0000-0000-000000000002",
  hari: "1",
  jamMulai: "08:00",
  jamSelesai: "09:30",
  honor: "100000",
  meetUrl: "",
  aktif: "on",
};

describe("skemaJadwal", () => {
  it("menerima jadwal valid dan mengubah tipe", () => {
    const hasil = skemaJadwal.parse(jadwal);
    expect(hasil).toMatchObject({ hari: 1, honor: 100000, meetUrl: null, aktif: true });
  });

  it("menolak jam selesai tidak setelah jam mulai", () => {
    expect(skemaJadwal.safeParse({ ...jadwal, jamSelesai: "08:00" }).success).toBe(false);
    expect(skemaJadwal.safeParse({ ...jadwal, jamSelesai: "07:00" }).success).toBe(false);
  });

  it("menolak hari di luar 1..7, honor pecahan atau negatif", () => {
    expect(skemaJadwal.safeParse({ ...jadwal, hari: "8" }).success).toBe(false);
    expect(skemaJadwal.safeParse({ ...jadwal, honor: "1000.5" }).success).toBe(false);
    expect(skemaJadwal.safeParse({ ...jadwal, honor: "-1" }).success).toBe(false);
  });
});

describe("skemaMeet", () => {
  it("hanya https atau kosong", () => {
    expect(skemaMeet.parse("https://meet.google.com/abc-defg-hij")).toBe("https://meet.google.com/abc-defg-hij");
    expect(skemaMeet.parse("  ")).toBeNull();
    expect(skemaMeet.safeParse("http://meet.google.com/x").success).toBe(false);
    expect(skemaMeet.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("skemaPeserta", () => {
  it("catatan kosong menjadi null, centang menjadi boolean", () => {
    expect(skemaPeserta.parse({ nama: " Ali ", catatan: "", aktif: undefined })).toEqual({
      nama: "Ali",
      catatan: null,
      aktif: false,
    });
  });
});
