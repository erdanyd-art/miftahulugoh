import { describe, expect, it } from "vitest";
import { daftarPerubahan } from "./audit";

describe("daftarPerubahan", () => {
  it("UPDATE hanya menampilkan kolom yang berubah dan mengabaikan kolom teknis", () => {
    const lama = { id: "x", honor: 50000, honor_dikoreksi: false, hadir: 0, diubah_pada: "a" };
    const baru = { id: "x", honor: 77777, honor_dikoreksi: true, hadir: 0, diubah_pada: "b" };
    expect(daftarPerubahan("UPDATE", lama, baru)).toEqual([
      { kolom: "honor", sebelum: "50000", sesudah: "77777" },
      { kolom: "honor_dikoreksi", sebelum: "tidak", sesudah: "ya" },
    ]);
  });

  it("INSERT hanya nilai sesudah; DELETE hanya nilai sebelum", () => {
    expect(daftarPerubahan("INSERT", null, { jumlah: 1000, keterangan: null })).toEqual([
      { kolom: "jumlah", sebelum: "", sesudah: "1000" },
      { kolom: "keterangan", sebelum: "", sesudah: "–" },
    ]);
    expect(daftarPerubahan("DELETE", { nama: "A" }, null)).toEqual([{ kolom: "nama", sebelum: "A", sesudah: "" }]);
  });
});
