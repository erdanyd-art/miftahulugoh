const ringkasan = ["Pemasukan bulan ini", "Pengeluaran bulan ini", "Selisih", "Pembayaran belum lunas"];

// Sprint 0: kerangka dashboard tanpa data.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ringkasan.map((judul) => (
          <div key={judul} className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{judul}</p>
            <p className="mt-2 text-2xl font-semibold">–</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-card p-5 shadow-sm xl:col-span-2">
          <h2 className="font-semibold">Absensi tutor hari ini</h2>
          <p className="mt-4 text-sm text-muted-foreground">Belum ada data.</p>
        </section>
        <section className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Status</h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <li className="rounded-full bg-status-lunas px-3 py-1 text-status-lunas-foreground">Lunas</li>
            <li className="rounded-full bg-status-menunggu px-3 py-1 text-status-menunggu-foreground">Menunggu</li>
            <li className="rounded-full bg-status-belum px-3 py-1 text-status-belum-foreground">Belum Lunas</li>
          </ul>
          <p dir="rtl" lang="ar" className="mt-6 font-arab text-xl">
            مِفْتَاحُ اللُّغَةِ
          </p>
        </section>
      </div>
    </div>
  );
}
