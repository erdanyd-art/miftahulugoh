import { describe, expect, it } from "vitest";
import { formatRupiah, namaHari } from "./format";

describe("formatRupiah", () => {
  it("memakai pemisah ribuan titik tanpa desimal", () => {
    expect(formatRupiah(120000).replace(/\s/g, " ")).toBe("Rp 120.000");
    expect(formatRupiah(0).replace(/\s/g, " ")).toBe("Rp 0");
  });
});

describe("namaHari", () => {
  it("memetakan hari ISO", () => {
    expect(namaHari(1)).toBe("Senin");
    expect(namaHari(7)).toBe("Ahad");
  });

  it("menolak nilai di luar 1..7", () => {
    expect(() => namaHari(0)).toThrow(RangeError);
    expect(() => namaHari(8)).toThrow(RangeError);
    expect(() => namaHari(1.5)).toThrow(RangeError);
  });
});
