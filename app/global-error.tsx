"use client";

// Galat di layout akar: harus membawa <html> dan <body> sendiri (tanpa gaya global).
export default function GalatGlobal({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center", color: "#0f172a" }}>
        <title>Terjadi kesalahan</title>
        <h1>Terjadi kesalahan</h1>
        <p>Maaf, aplikasi gagal dimuat. Muat ulang halaman ini atau hubungi admin lembaga.</p>
        {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12 }}>Kode: {error.digest}</p>}
      </body>
    </html>
  );
}
