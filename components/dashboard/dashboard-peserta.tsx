// Beranda peserta (Fase 2). Daftar ujian ditambahkan di Sprint 11.
export function DashboardPeserta({ nama }: { nama: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Assalamu&apos;alaikum, {nama}</h1>
      <section className="rounded-3xl bg-pastel-biru p-6">
        <h2 className="text-lg">Ujian</h2>
        <p className="mt-1 text-sm text-pastel-muted">Belum ada ujian untuk Anda. Ujian dari lembaga akan tampil di sini.</p>
      </section>
    </div>
  );
}
