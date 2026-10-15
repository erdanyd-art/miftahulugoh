import { describe, expect, it } from "vitest";
import { skemaPengaturan, skemaPenggunaBaru, zonaWaktuValid } from "./pengguna";

describe("zonaWaktuValid", () => {
  it("menerima nama IANA", () => {
    expect(zonaWaktuValid("Asia/Makassar")).toBe(true);
    expect(zonaWaktuValid("Asia/Jakarta")).toBe(true);
  });

  it("menolak nama yang tidak dikenal atau singkatan", () => {
    expect(zonaWaktuValid("Asia/Atlantis")).toBe(false);
    expect(zonaWaktuValid("WITA")).toBe(false);
    expect(zonaWaktuValid("")).toBe(false);
  });
});

describe("skemaPenggunaBaru", () => {
  it("memangkas nama dan membatasi peran", () => {
    const hasil = skemaPenggunaBaru.parse({ nama: "  Ustadz Ali ", email: "ali@contoh.test", peran: "tutor" });
    expect(hasil.nama).toBe("Ustadz Ali");
    expect(skemaPenggunaBaru.safeParse({ nama: "A", email: "a@b.co", peran: "peserta" }).success).toBe(false);
    expect(skemaPenggunaBaru.safeParse({ nama: "   ", email: "a@b.co", peran: "tutor" }).success).toBe(false);
  });
});

describe("skemaPengaturan", () => {
  it("menolak nama lembaga kosong", () => {
    expect(skemaPengaturan.safeParse({ namaLembaga: " ", zonaWaktu: "Asia/Makassar" }).success).toBe(false);
  });
});
