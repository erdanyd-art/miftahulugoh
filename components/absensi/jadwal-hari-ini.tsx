import Link from "next/link";
import { Chip } from "@/components/tabel";
import type { JadwalHariIni } from "@/lib/data/absensi";
import { formatJam, namaHari } from "@/lib/format";
import { formatTanggal, type WaktuLembaga } from "@/lib/waktu";

const tombol = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium whitespace-nowrap";

function StatusJadwal({ j }: { j: JadwalHariIni }) {
  if (j.sesi?.dikunci) return <Chip warna="netral">Terkunci · hadir {j.sesi.hadir}/{j.sesi.total}</Chip>;
  if (j.sesi) return <Chip warna="hijau">Sudah absen · hadir {j.sesi.hadir}/{j.sesi.total}</Chip>;
  if (!j.sudahMulai) return <Chip warna="kuning">Belum waktunya</Chip>;
  return <Chip warna="merah">Belum absen</Chip>;
}

// UI hanya mencerminkan aturan (menonaktifkan tombol); penegakan jendela absen ada di database.
function AksiJadwal({ j, tanggal }: { j: JadwalHariIni; tanggal: string }) {
  const href = `/absensi/isi/${j.id}?tanggal=${tanggal}`;
  if (j.sesi?.dikunci) {
    return (
      <Link href={`/absensi/sesi/${j.sesi.id}`} className={`${tombol} border`}>
        Lihat
      </Link>
    );
  }
  if (j.sesi) {
    return (
      <Link href={href} className={`${tombol} border`}>
        Ubah absen
      </Link>
    );
  }
  if (!j.sudahMulai) {
    return (
      <span aria-disabled="true" className={`${tombol} cursor-not-allowed bg-secondary text-muted-foreground`}>
        Dibuka {formatJam(j.jam_mulai)}
      </span>
    );
  }
  return (
    <Link href={href} className={`${tombol} bg-accent text-accent-foreground`}>
      Absen
    </Link>
  );
}

export function DaftarJadwalHariIni({
  jadwal,
  waktu,
  tampilkanTutor,
}: {
  jadwal: JadwalHariIni[];
  waktu: WaktuLembaga;
  tampilkanTutor: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {namaHari(waktu.hari)}, {formatTanggal(waktu.tanggal)} · pukul {waktu.jam.replace(":", ".")} (waktu lembaga)
      </p>
      {jadwal.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Tidak ada jadwal hari ini.</p>
      ) : (
        <ul className="mt-2 divide-y">
          {jadwal.map((j) => (
            <li key={j.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{j.kelas?.nama}</p>
                <p className="text-sm text-muted-foreground">
                  {formatJam(j.jam_mulai)}–{formatJam(j.jam_selesai)}
                  {tampilkanTutor && j.tutor ? ` · ${j.tutor.nama}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusJadwal j={j} />
                {j.meet_url && !tampilkanTutor && (
                  <a href={j.meet_url} target="_blank" rel="noopener noreferrer" className={`${tombol} border`}>
                    Meet
                  </a>
                )}
                <AksiJadwal j={j} tanggal={waktu.tanggal} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
