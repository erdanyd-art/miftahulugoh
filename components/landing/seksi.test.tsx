import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { KontenSitus } from "@/lib/site-content";
import { Daftar, Program } from "./seksi";

const KOSONG: KontenSitus = {
  waNumber: "",
  waMessage: "Halo",
  instagram: "",
  address: "",
  programs: [
    { key: "arab", jadwal: "", biaya: "" },
    { key: "inggris", jadwal: "", biaya: "" },
    { key: "nahwu", jadwal: "", biaya: "" },
  ],
};

// Nilai uji yang jelas bukan data asli.
const TERISI: KontenSitus = {
  waNumber: "620000000000",
  waMessage: "Halo & salam",
  instagram: "@akun.uji",
  address: "Kota Uji",
  programs: [
    { key: "arab", jadwal: "Senin 19.00", biaya: "Rp0 uji" },
    { key: "inggris", jadwal: "", biaya: "" },
    { key: "nahwu", jadwal: "", biaya: "" },
  ],
};

describe("Daftar", () => {
  it("konfigurasi kosong: placeholder tampil dan tombol WhatsApp tidak aktif", () => {
    const html = renderToStaticMarkup(<Daftar konten={KOSONG} />);
    expect(html).toContain("[NOMOR WHATSAPP]");
    expect(html).toContain("[@AKUN INSTAGRAM]");
    expect(html).toContain("[ALAMAT / KOTA]");
    expect(html).toContain('href="#daftar" aria-disabled="true"');
    expect(html).not.toContain("wa.me");
  });

  it("konfigurasi terisi: nilai asli dan tautan eksternal aman", () => {
    const html = renderToStaticMarkup(<Daftar konten={TERISI} />);
    expect(html).not.toContain("[NOMOR WHATSAPP]");
    expect(html).toContain('href="https://wa.me/620000000000?text=Halo%20%26%20salam"');
    expect(html).toContain('href="https://www.instagram.com/akun.uji/"');
    expect(html).toContain("@akun.uji");
    expect(html).toContain("Kota Uji");
    expect(html).not.toContain("aria-disabled");
    const luar = html.match(/<a [^>]*href="https:[^>]*>/g) ?? [];
    expect(luar).toHaveLength(3);
    for (const a of luar) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
  });
});

describe("Program", () => {
  it("jadwal dan biaya kosong tampil sebagai placeholder; yang terisi tampil apa adanya", () => {
    expect(renderToStaticMarkup(<Program konten={KOSONG} />).match(/\[HARI &amp; JAM\]/g)).toHaveLength(3);
    const html = renderToStaticMarkup(<Program konten={TERISI} />);
    expect(html).toContain("Senin 19.00");
    expect(html).toContain("Rp0 uji");
    expect(html.match(/\[HARI &amp; JAM\]/g)).toHaveLength(2);
  });
});
