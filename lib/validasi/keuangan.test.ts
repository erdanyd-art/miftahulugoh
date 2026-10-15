import { describe, expect, it } from "vitest";
import { skemaKas, skemaPembayaran } from "./keuangan";

const kas = {
  tanggal: "2026-10-15",
  kategoriId: "20000000-0000-0000-0000-000000000001",
  keterangan: "",
  jumlah: "500000",
  tutorId: "",
};

describe("skemaKas", () => {
  it("jumlah bulat > 0; tutor kosong menjadi null", () => {
    expect(skemaKas.parse(kas)).toMatchObject({ jumlah: 500000, tutorId: null, keterangan: null });
    expect(skemaKas.safeParse({ ...kas, jumlah: "0" }).success).toBe(false);
    expect(skemaKas.safeParse({ ...kas, jumlah: "1500.5" }).success).toBe(false);
    expect(skemaKas.safeParse({ ...kas, tanggal: "15/10/2026" }).success).toBe(false);
    expect(skemaKas.safeParse({ ...kas, tutorId: "bukan-id" }).success).toBe(false);
  });
});

describe("skemaPembayaran", () => {
  it("status hanya lunas/belum_lunas dan keterangan wajib", () => {
    const dasar = { tanggal: "2026-10-15", pesertaId: kas.kategoriId, keterangan: "SPP", jumlah: "250000", status: "lunas" };
    expect(skemaPembayaran.safeParse(dasar).success).toBe(true);
    expect(skemaPembayaran.safeParse({ ...dasar, status: "cicil" }).success).toBe(false);
    expect(skemaPembayaran.safeParse({ ...dasar, keterangan: " " }).success).toBe(false);
  });
});
