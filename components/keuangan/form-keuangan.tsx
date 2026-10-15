"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { KolomCentang, KolomIsian, KolomPilihan, PesanStatus } from "@/components/form";
import { useFormAksi } from "@/components/use-form-aksi";
import { hapusKas, hapusPembayaran, type StatusAksi, ubahAktifKategori } from "@/lib/aksi-keuangan";

type Aksi = (s: StatusAksi, f: FormData) => Promise<StatusAksi>;
type Kategori = { id: string; nama: string; jenis: "pemasukan" | "pengeluaran"; butuh_tutor: boolean };
type Pilihan = { id: string; nama: string };

const kelasTombol = "h-11 w-fit rounded-full px-6 text-base";

export function FormKas({
  aksi,
  kategori,
  tutor,
  tanggalAwal,
  awal,
}: {
  aksi: Aksi;
  kategori: Kategori[];
  tutor: Pilihan[];
  tanggalAwal: string;
  awal?: { tanggal: string; kategoriId: string; keterangan: string | null; jumlah: number; tutorId: string | null };
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  const [kategoriId, setKategoriId] = useState(awal?.kategoriId ?? "");
  const butuhTutor = kategori.find((k) => k.id === kategoriId)?.butuh_tutor ?? false;

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <PesanStatus {...status} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KolomIsian label="Tanggal" name="tanggal" type="date" defaultValue={awal?.tanggal ?? tanggalAwal} required />
        <KolomPilihan
          label="Kategori"
          name="kategoriId"
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
          required
        >
          <option value="" disabled>
            Pilih kategori...
          </option>
          {(["pemasukan", "pengeluaran"] as const).map((jenis) => (
            <optgroup key={jenis} label={jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}>
              {kategori
                .filter((k) => k.jenis === jenis)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
            </optgroup>
          ))}
        </KolomPilihan>
        <KolomIsian
          label="Jumlah (Rp)"
          name="jumlah"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={awal?.jumlah}
          required
        />
        {butuhTutor && (
          <KolomPilihan label="Tutor yang dibayar" name="tutorId" defaultValue={awal?.tutorId ?? ""} required>
            <option value="" disabled>
              Pilih tutor...
            </option>
            {tutor.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </KolomPilihan>
        )}
      </div>
      <KolomIsian label="Keterangan (opsional)" name="keterangan" defaultValue={awal?.keterangan ?? ""} maxLength={300} />
      {butuhTutor && (
        <p className="text-xs text-muted-foreground">Pembayaran honor tutor mengurangi saldo honor tutor tersebut.</p>
      )}
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function FormPembayaran({
  aksi,
  peserta,
  tanggalAwal,
  awal,
}: {
  aksi: Aksi;
  peserta: Pilihan[];
  tanggalAwal: string;
  awal?: { tanggal: string; pesertaId: string; keterangan: string; jumlah: number; status: "lunas" | "belum_lunas" };
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <PesanStatus {...status} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KolomIsian label="Tanggal" name="tanggal" type="date" defaultValue={awal?.tanggal ?? tanggalAwal} required />
        <KolomPilihan label="Peserta" name="pesertaId" defaultValue={awal?.pesertaId ?? ""} required>
          <option value="" disabled>
            Pilih peserta...
          </option>
          {peserta.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </KolomPilihan>
        <KolomIsian
          label="Keterangan (mis. SPP Oktober, Infaq)"
          name="keterangan"
          defaultValue={awal?.keterangan}
          required
          maxLength={200}
        />
        <KolomIsian
          label="Jumlah (Rp)"
          name="jumlah"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={awal?.jumlah}
          required
        />
        <KolomPilihan label="Status" name="status" defaultValue={awal?.status ?? "lunas"} required>
          <option value="lunas">Lunas</option>
          <option value="belum_lunas">Belum Lunas</option>
        </KolomPilihan>
      </div>
      <p className="text-xs text-muted-foreground">
        Pembayaran berstatus Lunas otomatis tercatat sebagai pemasukan kas (kategori Pembayaran Peserta).
      </p>
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function TombolHapus({ jenis, id }: { jenis: "kas" | "pembayaran"; id: string }) {
  const [status, kirim, sedang] = useActionState(
    () => (jenis === "kas" ? hapusKas(id) : hapusPembayaran(id)),
    undefined,
  );
  return (
    <form
      action={kirim}
      onSubmit={(e) => {
        if (!window.confirm("Hapus data ini? Data disembunyikan dari daftar dan rekap, tetapi tetap tercatat di log audit.")) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-3"
    >
      <PesanStatus {...status} />
      <Button type="submit" variant="destructive" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menghapus..." : "Hapus"}
      </Button>
    </form>
  );
}

export function FormKategori({ aksi }: { aksi: Aksi }) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PesanStatus {...status} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <KolomIsian label="Nama kategori" name="nama" required maxLength={60} />
        </div>
        <KolomPilihan label="Jenis" name="jenis" defaultValue="pengeluaran" required>
          <option value="pemasukan">Pemasukan</option>
          <option value="pengeluaran">Pengeluaran</option>
        </KolomPilihan>
      </div>
      <KolomCentang label="Wajib memilih tutor (seperti Honor Tutor)" name="butuhTutor" />
      <Button type="submit" disabled={sedang} className={kelasTombol}>
        {sedang ? "Menyimpan..." : "Tambah kategori"}
      </Button>
    </form>
  );
}

export function TombolAktifKategori({ id, aktif, nama }: { id: string; aktif: boolean; nama: string }) {
  const [status, kirim, sedang] = useActionState(() => ubahAktifKategori(id, !aktif), undefined);
  return (
    <form action={kirim} className="flex items-center gap-2">
      {status?.galat && <span className="text-xs text-status-belum-foreground">{status.galat}</span>}
      <button
        type="submit"
        disabled={sedang}
        aria-label={`${aktif ? "Nonaktifkan" : "Aktifkan"} kategori ${nama}`}
        className="rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-60"
      >
        {aktif ? "Nonaktifkan" : "Aktifkan"}
      </button>
    </form>
  );
}
