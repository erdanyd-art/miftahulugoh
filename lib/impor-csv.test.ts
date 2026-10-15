import { describe, expect, it } from "vitest";
import { BATAS_BARIS, bacaCsv, uraiPeserta } from "./impor-csv";

describe("bacaCsv", () => {
  it("mendeteksi pemisah koma, titik koma, dan tab", () => {
    expect(bacaCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(bacaCsv("a;b\r\n1;2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
    expect(bacaCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("menangani kutip, kutip ganda, koma di dalam sel, dan BOM", () => {
    expect(bacaCsv('﻿nama,catatan\n"Ali, bin Umar","kata ""rajin"""')).toEqual([
      ["nama", "catatan"],
      ["Ali, bin Umar", 'kata "rajin"'],
    ]);
  });

  it("mengabaikan baris kosong", () => {
    expect(bacaCsv("nama\n\nAli\n ,\n")).toEqual([["nama"], ["Ali"]]);
  });
});

describe("uraiPeserta", () => {
  it("mengenali judul kolom alternatif dan banyak kelas", () => {
    const hasil = uraiPeserta("Nama Siswa;Keterangan;Kelas\n  Ahmad   Fauzi ;anak baru;Bahasa Arab Dasar; Nahwu Shorof\n");
    // titik koma juga pemisah kolom di berkas ini: kelas kedua menjadi kolom ke-4 dan tidak terbaca
    expect(hasil.data[0]).toMatchObject({ baris: 2, nama: "Ahmad Fauzi", catatan: "anak baru", kelas: ["Bahasa Arab Dasar"] });
  });

  it("banyak kelas dipisah | atau ; di dalam sel", () => {
    const hasil = uraiPeserta('nama,kelas\nSiti,"Bahasa Arab Dasar; Nahwu Shorof"\nBudi,Bahasa Inggris|Nahwu Shorof');
    expect(hasil.data.map((d) => d.kelas)).toEqual([
      ["Bahasa Arab Dasar", "Nahwu Shorof"],
      ["Bahasa Inggris", "Nahwu Shorof"],
    ]);
  });

  it("menolak berkas tanpa kolom nama atau terlalu banyak baris", () => {
    expect(uraiPeserta("siswa,kelas\nA,B").galat).toContain('"nama"');
    expect(uraiPeserta("").galat).toBe("Berkas kosong.");
    const banyak = "nama\n" + Array.from({ length: BATAS_BARIS + 1 }, (_, i) => `P${i}`).join("\n");
    expect(uraiPeserta(banyak).galat).toContain(String(BATAS_BARIS));
  });
});
