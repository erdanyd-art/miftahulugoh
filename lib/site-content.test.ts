import { describe, expect, it } from "vitest";
import { tautanInstagram, tautanWhatsApp } from "./site-content";

describe("tautanWhatsApp", () => {
  it("kosong atau tidak valid menghasilkan null (placeholder)", () => {
    expect(tautanWhatsApp("", "halo")).toBeNull();
    expect(tautanWhatsApp("0812-abc", "halo")).toBeNull();
    expect(tautanWhatsApp("+62812", "halo")).toBeNull();
  });

  it("nomor terisi membentuk tautan wa.me dengan pesan ter-encode", () => {
    expect(tautanWhatsApp("6281200000000", "Assalamu'alaikum, saya & teman")).toBe(
      "https://wa.me/6281200000000?text=Assalamu'alaikum%2C%20saya%20%26%20teman",
    );
  });
});

describe("tautanInstagram", () => {
  it("kosong menghasilkan null", () => {
    expect(tautanInstagram("")).toBeNull();
    expect(tautanInstagram("akun dengan spasi")).toBeNull();
  });

  it("menerima akun dengan atau tanpa @", () => {
    expect(tautanInstagram("@lembaga.contoh")).toBe("https://www.instagram.com/lembaga.contoh/");
    expect(tautanInstagram("lembaga_contoh")).toBe("https://www.instagram.com/lembaga_contoh/");
  });
});
