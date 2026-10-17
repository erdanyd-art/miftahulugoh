import { describe, expect, it } from "vitest";
import { urutAcak } from "./acak";

describe("urutAcak", () => {
  const daftar = Array.from({ length: 10 }, (_, i) => i);
  it("permutasi: semua anggota tetap ada", () => {
    expect([...urutAcak("x", daftar)].sort((a, b) => a - b)).toEqual(daftar);
  });
  it("deterministik untuk benih yang sama, berbeda untuk benih lain", () => {
    expect(urutAcak("percobaan-1", daftar)).toEqual(urutAcak("percobaan-1", daftar));
    expect(urutAcak("percobaan-1", daftar)).not.toEqual(urutAcak("percobaan-2", daftar));
    expect(urutAcak("percobaan-1", daftar)).not.toEqual(daftar);
  });
});
