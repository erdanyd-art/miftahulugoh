import { describe, expect, it } from "vitest";
import { cocokCari, PER_HALAMAN, potongHalaman, urlDengan } from "./tabel";

describe("potongHalaman", () => {
  const data = Array.from({ length: 45 }, (_, i) => i);

  it("membagi per halaman dan membatasi nomor halaman", () => {
    expect(potongHalaman(data, "1").baris).toHaveLength(PER_HALAMAN);
    expect(potongHalaman(data, "3").baris).toEqual([40, 41, 42, 43, 44]);
    expect(potongHalaman(data, "99").nomor).toBe(3);
    expect(potongHalaman(data, "abc").nomor).toBe(1);
    expect(potongHalaman([], "1")).toMatchObject({ nomor: 1, total: 1, jumlah: 0 });
  });
});

describe("urlDengan", () => {
  it("mengganti dan menghapus parameter", () => {
    expect(urlDengan("/pengguna", { q: "ali", halaman: "2" }, { halaman: "" })).toBe("/pengguna?q=ali");
    expect(urlDengan("/pengguna", {}, { urut: "nama" })).toBe("/pengguna?urut=nama");
  });
});

describe("cocokCari", () => {
  it("tidak peka huruf besar-kecil dan kosong cocok semua", () => {
    expect(cocokCari("FUL", "Ustadz Fulan")).toBe(true);
    expect(cocokCari("", "apa saja")).toBe(true);
    expect(cocokCari("zzz", "Ustadz Fulan", "a@b.co")).toBe(false);
  });
});
