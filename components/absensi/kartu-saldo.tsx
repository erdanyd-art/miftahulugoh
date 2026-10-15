import { formatRupiah } from "@/lib/format";

// Saldo honor = honor sesi terkumpul - honor yang sudah dibayar (kas "Honor Tutor"), dihitung di database.
export function KartuSaldo({ terkumpul, dibayar, saldo }: { terkumpul: number; dibayar: number; saldo: number }) {
  const isi = [
    { label: "Honor terkumpul", nilai: terkumpul, warna: "bg-pastel-kuning" },
    { label: "Sudah dibayar", nilai: dibayar, warna: "bg-pastel-ungu" },
    { label: "Saldo belum dibayar", nilai: saldo, warna: "bg-pastel-biru" },
  ];
  return (
    <section aria-label="Saldo honor" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {isi.map((k) => (
        <div key={k.label} className={`flex flex-col gap-2 rounded-3xl p-5 text-foreground ${k.warna}`}>
          <p className="font-judul text-lg">{k.label}</p>
          <p className="font-judul text-3xl">{formatRupiah(k.nilai)}</p>
        </div>
      ))}
    </section>
  );
}
