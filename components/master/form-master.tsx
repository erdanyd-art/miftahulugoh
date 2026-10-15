"use client";

import { useActionState } from "react";
import { useFormAksi } from "@/components/use-form-aksi";
import { Button } from "@/components/ui/button";
import { KolomCentang, KolomIsian, KolomPilihan, KolomTeksPanjang, PesanStatus } from "@/components/form";
import { keluarkanAnggota, type StatusAksi } from "@/lib/aksi-master";
import { DAFTAR_HARI, namaHari } from "@/lib/format";

type Aksi = (s: StatusAksi, f: FormData) => Promise<StatusAksi>;
type Pilihan = { id: string; nama: string };

const kelasTombol = "h-11 w-fit rounded-full px-6 text-base";

export function FormPeserta({
  aksi,
  awal,
}: {
  aksi: Aksi;
  awal?: { nama: string; catatan: string | null; aktif: boolean };
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Nama peserta" name="nama" defaultValue={awal?.nama} required maxLength={100} />
      <KolomTeksPanjang
        label="Catatan (opsional)"
        name="catatan"
        defaultValue={awal?.catatan ?? ""}
        maxLength={500}
        petunjuk="Jangan isi hal sensitif (kesehatan, ekonomi keluarga, dll.); catatan bisa terbaca tutor kelasnya."
      />
      <KolomCentang label="Aktif" name="aktif" defaultChecked={awal?.aktif ?? true} />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function FormKelas({
  aksi,
  awal,
}: {
  aksi: Aksi;
  awal?: { nama: string; keterangan: string | null; aktif: boolean };
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian
        label="Nama kelas (sudah mewakili mata pelajaran)"
        name="nama"
        defaultValue={awal?.nama}
        required
        maxLength={100}
      />
      <KolomTeksPanjang
        label="Keterangan (opsional)"
        name="keterangan"
        defaultValue={awal?.keterangan ?? ""}
        maxLength={300}
      />
      <KolomCentang label="Aktif" name="aktif" defaultChecked={awal?.aktif ?? true} />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function FormTambahAnggota({ aksi, pilihan }: { aksi: Aksi; pilihan: Pilihan[] }) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  if (pilihan.length === 0) {
    return <p className="text-sm text-muted-foreground">Semua peserta aktif sudah menjadi anggota kelas ini.</p>;
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <PesanStatus {...status} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-72">
          <KolomPilihan label="Tambah peserta" name="pesertaId" required defaultValue="">
            <option value="" disabled>
              Pilih peserta...
            </option>
            {pilihan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </KolomPilihan>
        </div>
        <Button type="submit" disabled={sedang} className={kelasTombol}>
          {sedang ? "Menambahkan..." : "Tambahkan"}
        </Button>
      </div>
    </form>
  );
}

export function TombolKeluarkan({ kelasId, peserta }: { kelasId: string; peserta: Pilihan }) {
  const [status, kirim, sedang] = useActionState(() => keluarkanAnggota(kelasId, peserta.id), undefined);
  return (
    <form
      action={kirim}
      onSubmit={(e) => {
        if (!window.confirm(`Keluarkan ${peserta.nama} dari kelas ini?`)) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      {status?.galat && <span className="text-xs text-status-belum-foreground">{status.galat}</span>}
      <button
        type="submit"
        disabled={sedang}
        aria-label={`Keluarkan ${peserta.nama}`}
        className="rounded-full px-3 py-1 text-xs font-medium text-status-belum-foreground hover:bg-status-belum disabled:opacity-60"
      >
        Keluarkan
      </button>
    </form>
  );
}

export function FormJadwal({
  aksi,
  kelas,
  tutor,
  awal,
}: {
  aksi: Aksi;
  kelas: Pilihan[];
  tutor: Pilihan[];
  awal?: {
    kelasId: string;
    tutorId: string;
    hari: number;
    jamMulai: string;
    jamSelesai: string;
    honor: number;
    meetUrl: string | null;
    aktif: boolean;
  };
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <PesanStatus {...status} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KolomPilihan label="Kelas" name="kelasId" defaultValue={awal?.kelasId ?? ""} required>
          <option value="" disabled>
            Pilih kelas...
          </option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </KolomPilihan>
        <KolomPilihan label="Tutor" name="tutorId" defaultValue={awal?.tutorId ?? ""} required>
          <option value="" disabled>
            Pilih tutor...
          </option>
          {tutor.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}
            </option>
          ))}
        </KolomPilihan>
        <KolomPilihan label="Hari" name="hari" defaultValue={awal?.hari ?? 1} required>
          {DAFTAR_HARI.map((h) => (
            <option key={h} value={h}>
              {namaHari(h)}
            </option>
          ))}
        </KolomPilihan>
        <KolomIsian
          label="Honor per sesi (Rp)"
          name="honor"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={awal?.honor}
          required
        />
        <KolomIsian
          label="Jam mulai"
          name="jamMulai"
          type="time"
          defaultValue={awal?.jamMulai.slice(0, 5)}
          required
        />
        <KolomIsian
          label="Jam selesai"
          name="jamSelesai"
          type="time"
          defaultValue={awal?.jamSelesai.slice(0, 5)}
          required
        />
      </div>
      <KolomIsian
        label="Tautan Google Meet (opsional)"
        name="meetUrl"
        type="url"
        placeholder="https://meet.google.com/..."
        defaultValue={awal?.meetUrl ?? ""}
      />
      <KolomCentang label="Aktif" name="aktif" defaultChecked={awal?.aktif ?? true} />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function FormMeet({ aksi, awal }: { aksi: Aksi; awal: string | null }) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <PesanStatus {...status} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <KolomIsian
            label="Tautan Google Meet"
            name="meetUrl"
            type="url"
            placeholder="https://meet.google.com/..."
            defaultValue={awal ?? ""}
          />
        </div>
        <Button type="submit" variant="outline" disabled={sedang} className="h-11 rounded-full px-5">
          {sedang ? "Menyimpan..." : "Simpan tautan"}
        </Button>
      </div>
    </form>
  );
}
