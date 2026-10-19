import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { siteContent, type KontenSitus } from "@/lib/site-content";
import { Daftar, Program } from "./seksi";

const KOSONG: KontenSitus = { ...siteContent, waNumber: "", instagram: "", address: "" };

// Nilai uji yang jelas bukan data asli.
const TERISI: KontenSitus = {
  ...siteContent,
  waNumber: "620000000000",
  waMessage: "Halo & salam",
  instagram: "@akun.uji",
  address: "Kota Uji",
  kelas: siteContent.kelas.map((k, i) => (i === 0 ? { ...k, jadwal: "Senin 19.00 uji" } : k)),
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
  it("harga dari konfigurasi, diformat rupiah, dengan satuan persis brosur dan catatan per tingkat", () => {
    const html = renderToStaticMarkup(<Program konten={KOSONG} />).replace(/ /g, " ");
    expect(html).toContain("Rp 100.000");
    expect(html).toContain("Rp 175.000");
    expect(html).toContain("Rp 275.000");
    expect(html.match(/\/peserta\/bulan/g)).toHaveLength(2);
    expect(html).toContain("/bulan (Per Tingkat)");
    expect(html).toContain("*Harga untuk 1 tingkat");
    expect(html).toContain("3 jenis kelas");
  });

  it("jadwal kosong tampil sebagai placeholder; yang terisi tampil apa adanya", () => {
    expect(renderToStaticMarkup(<Program konten={KOSONG} />).match(/\[HARI &amp; JAM\]/g)).toHaveLength(3);
    const html = renderToStaticMarkup(<Program konten={TERISI} />);
    expect(html).toContain("Senin 19.00 uji");
    expect(html.match(/\[HARI &amp; JAM\]/g)).toHaveLength(2);
  });

  it("harga mengikuti konfigurasi bila diubah", () => {
    const ubah = { ...KOSONG, kelas: KOSONG.kelas.map((k) => ({ ...k, harga: k.harga + 5000 })) };
    const html = renderToStaticMarkup(<Program konten={ubah} />).replace(/ /g, " ");
    expect(html).toContain("Rp 105.000");
    expect(html).not.toContain("Rp 100.000");
  });
});
