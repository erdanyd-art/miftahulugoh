"use client";

// Galat tak terduga: pesan umum untuk pengguna; rincian hanya di log server (dicocokkan lewat kode referensi).
export default function Galat({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Maaf, halaman ini gagal dimuat. Coba lagi beberapa saat. Bila terus terjadi, sampaikan kode berikut ke admin.
      </p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Kode: {error.digest}</p>}
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      >
        Coba lagi
      </button>
    </main>
  );
}
