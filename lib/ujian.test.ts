import { describe, expect, it } from "vitest";
import { skemaSoal, skemaUjian } from "./validasi/ujian";
import { formatWaktu, isoKeLokal, lokalKeIso } from "./waktu";

describe("waktu ujian di zona lembaga", () => {
  it("datetime-local -> ISO dengan offset zona, dan kembali", () => {
    expect(lokalKeIso("2026-11-01T08:00", "Asia/Makassar")).toBe("2026-11-01T08:00:00+08:00");
    expect(lokalKeIso("2026-11-01T08:00", "Asia/Jakarta")).toBe("2026-11-01T08:00:00+07:00");
    expect(isoKeLokal("2026-11-01T00:00:00Z", "Asia/Makassar")).toBe("2026-11-01T08:00");
    expect(formatWaktu("2026-11-01T00:00:00Z", "Asia/Jayapura")).toBe("1 Nov 2026 09.00");
  });
});

describe("validasi ujian dan soal", () => {
  const ujian = {
    judul: "UTS",
    keterangan: "",
    kelasId: "20000000-0000-0000-0000-000000000001",
    durasiMenit: "60",
    acakSoal: false,
    acakOpsi: true,
  };
  it("selesai harus setelah mulai", () => {
    expect(skemaUjian.safeParse({ ...ujian, mulai: "2026-11-01T08:00", selesai: "2026-11-01T07:00" }).success).toBe(false);
    expect(skemaUjian.safeParse({ ...ujian, mulai: "2026-11-01T08:00", selesai: "2026-11-01T09:00" }).success).toBe(true);
  });

  const soal = { urutan: "1", pertanyaan: "?", kunciIsian: "", audioId: "", bobot: "1" };
  it("pilihan ganda: opsi kosong di akhir dibuang, kunci harus pilihan terisi", () => {
    const ok = skemaSoal.safeParse({ ...soal, jenis: "pilihan_ganda", opsi: ["A", "B", "", ""], jawabanBenar: "1" });
    expect(ok.success && ok.data.opsi).toEqual(["A", "B"]);
    expect(skemaSoal.safeParse({ ...soal, jenis: "pilihan_ganda", opsi: ["A", "B", ""], jawabanBenar: "2" }).success).toBe(false);
    expect(skemaSoal.safeParse({ ...soal, jenis: "pilihan_ganda", opsi: ["A", "", "C"], jawabanBenar: "0" }).success).toBe(false);
    expect(skemaSoal.safeParse({ ...soal, jenis: "pilihan_ganda", opsi: ["A"], jawabanBenar: "0" }).success).toBe(false);
  });
  it("isian tidak butuh opsi maupun kunci pilihan", () => {
    expect(skemaSoal.safeParse({ ...soal, jenis: "isian", opsi: [], jawabanBenar: "" }).success).toBe(true);
  });
});
