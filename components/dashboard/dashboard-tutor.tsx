import { cn } from "@/lib/utils";

const ringkasan = [
  { chip: "Jadwal", judul: "Sesi hari ini", warna: "bg-pastel-kuning" },
  { chip: "Honor", judul: "Honor bulan ini", warna: "bg-pastel-biru" },
];

// Kerangka dashboard tutor. Jadwal hari ini dan tombol Absen diisi dari database di Sprint 5.
export function DashboardTutor() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section aria-label="Ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ringkasan.map(({ chip, judul, warna }) => (
          <div key={judul} className={cn("flex flex-col gap-3 rounded-3xl p-5 text-foreground", warna)}>
            <span className="w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {chip}
            </span>
            <p className="font-medium">{judul}</p>
            <p className="text-2xl font-semibold">–</p>
            <span className="text-xs text-pastel-muted">Belum ada data</span>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Jadwal hari ini</h2>
        <p className="mt-4 text-sm text-muted-foreground">Belum ada jadwal untuk ditampilkan.</p>
      </section>
    </div>
  );
}
