import { describe, expect, it } from "vitest";
import { uraiSoal } from "./impor-soal";

const KEPALA = "nomor,jenis,pertanyaan,a,b,c,d,kunci,acuan,bobot,audio";

describe("uraiSoal", () => {
  it("membaca pilihan ganda (teks Arab) dan isian; jenis tersirat dari ada/tidaknya pilihan", () => {
    const { data, galat } = uraiSoal(
      `${KEPALA}\n1,pg,ما هذا؟,كتاب,قلم,,,a,,2,Percakapan 1\n,,"Terjemahkan: ""kitab""",,,,,,buku,,\n`,
    );
    expect(galat).toBeUndefined();
    expect(data[0]).toMatchObject({ nomor: 1, jenis: "pilihan_ganda", opsi: ["كتاب", "قلم"], kunci: 0, bobot: 2, audio: "Percakapan 1" });
    expect(data[0].galat).toBeUndefined();
    expect(data[1]).toMatchObject({ nomor: null, jenis: "isian", pertanyaan: 'Terjemahkan: "kitab"', acuan: "buku", bobot: 1 });
    expect(data[1].galat).toBeUndefined();
  });

  it("menandai baris bermasalah dengan alasannya", () => {
    const { data } = uraiSoal(
      [
        KEPALA,
        "1,pg,Satu pilihan,A,,,,a,,,",
        "2,pg,Kunci di luar,A,B,,,c,,,",
        "3,pg,Bolong,A,,C,,a,,,",
        "4,essay,Isian berpilihan,A,B,,,,,,",
        "5,soal,Jenis aneh,,,,,,,,",
        "6,isian,,,,,,,,,",
        "7,isian,Bobot nol,,,,,,,0,",
      ].join("\n"),
    );
    expect(data.map((d) => d.galat)).toEqual([
      "Pilihan ganda butuh minimal 2 pilihan (kolom a, b, ...)",
      "Kunci harus salah satu huruf A–B",
      "Ada pilihan kosong di tengah",
      "Soal isian tidak memakai kolom pilihan a–f",
      'Jenis harus "pg" atau "isian"',
      "Pertanyaan kosong",
      "Bobot harus 1–100",
    ]);
  });

  it("pemisah titik koma (Excel Indonesia) dan judul kolom alternatif", () => {
    const { data } = uraiSoal("Soal;Pilihan A;Pilihan B;Kunci Jawaban\nApa?;X;Y;B\n");
    expect(data[0]).toMatchObject({ jenis: "pilihan_ganda", opsi: ["X", "Y"], kunci: 1 });
    expect(uraiSoal("a,b\n1,2").galat).toContain('"pertanyaan"');
  });
});
