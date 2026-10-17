"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import { KolomCentang, KolomIsian, KolomPilihan, KolomTeksPanjang, PesanStatus } from "@/components/form";
import { useFormAksi } from "@/components/use-form-aksi";
import { Button } from "@/components/ui/button";
import {
  aturTerbit,
  hapusAudio,
  hapusSoal,
  hapusUjian,
  siapkanUnggahAudio,
  simpanAudio,
  type StatusAksi,
} from "@/lib/aksi-ujian";
import { BATAS_AUDIO, BATAS_OPSI, HURUF_OPSI, JENIS_AUDIO } from "@/lib/validasi/ujian";

type Aksi = (s: StatusAksi, f: FormData) => Promise<StatusAksi>;
type Pilihan = { id: string; nama: string };
const kelasTombol = "h-11 rounded-full px-6 text-base";

export function FormUjian({
  aksi,
  kelas,
  awal,
  labelTombol = "Simpan",
}: {
  aksi: Aksi;
  kelas: Pilihan[];
  awal?: {
    judul: string;
    keterangan: string | null;
    kelasId: string;
    mulai: string;
    selesai: string;
    durasiMenit: number;
    acakSoal: boolean;
    acakOpsi: boolean;
  };
  labelTombol?: string;
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Judul ujian" name="judul" defaultValue={awal?.judul} maxLength={200} dir="auto" required />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KolomIsian label="Dibuka mulai" name="mulai" type="datetime-local" defaultValue={awal?.mulai} required />
        <KolomIsian label="Ditutup pada" name="selesai" type="datetime-local" defaultValue={awal?.selesai} required />
      </div>
      <KolomIsian
        label="Durasi pengerjaan (menit)"
        name="durasiMenit"
        type="number"
        inputMode="numeric"
        min={1}
        max={600}
        defaultValue={awal?.durasiMenit ?? 60}
        required
      />
      <KolomTeksPanjang
        label="Petunjuk untuk peserta (opsional)"
        name="keterangan"
        defaultValue={awal?.keterangan ?? ""}
        maxLength={2000}
        dir="auto"
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Pengacakan (mengurangi menyontek)</legend>
        <KolomCentang label="Acak urutan soal untuk tiap peserta" name="acakSoal" defaultChecked={awal?.acakSoal} />
        <KolomCentang label="Acak urutan pilihan jawaban" name="acakOpsi" defaultChecked={awal?.acakOpsi} />
      </fieldset>
      <p className="text-xs text-muted-foreground">
        Waktu memakai zona waktu lembaga. Peserta bisa mulai selama ujian dibuka; batas waktunya durasi atau saat ujian
        ditutup, mana yang lebih dulu.
      </p>
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Menyimpan..." : labelTombol}
      </Button>
    </form>
  );
}

export function FormSoal({
  aksi,
  audio,
  awal,
}: {
  aksi: Aksi;
  audio: Pilihan[];
  awal: {
    urutan: number;
    jenis: "pilihan_ganda" | "isian";
    pertanyaan: string;
    opsi: string[];
    jawabanBenar: number | null;
    kunciIsian: string | null;
    audioId: string | null;
    bobot: number;
  };
}) {
  const { status, onSubmit, sedang } = useFormAksi(aksi);
  const [jenis, setJenis] = useState(awal.jenis);
  const [jumlahOpsi, setJumlahOpsi] = useState(Math.max(4, awal.opsi.length));

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <PesanStatus {...status} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KolomIsian label="Nomor" name="urutan" type="number" inputMode="numeric" min={1} max={500} defaultValue={awal.urutan} required />
        <KolomIsian label="Bobot nilai" name="bobot" type="number" inputMode="numeric" min={1} max={100} defaultValue={awal.bobot} required />
        <KolomPilihan
          label="Jenis soal"
          name="jenis"
          value={jenis}
          onChange={(e) => setJenis(e.target.value as typeof jenis)}
        >
          <option value="pilihan_ganda">Pilihan ganda</option>
          <option value="isian">Isian</option>
        </KolomPilihan>
      </div>
      <KolomTeksPanjang
        label="Pertanyaan"
        name="pertanyaan"
        defaultValue={awal.pertanyaan}
        maxLength={5000}
        rows={4}
        dir="auto"
        petunjuk="Teks Arab otomatis tampil dari kanan ke kiri."
        required
      />
      <KolomPilihan label="Audio (opsional)" name="audioId" defaultValue={awal.audioId ?? ""}>
        <option value="">Tanpa audio</option>
        {audio.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nama}
          </option>
        ))}
      </KolomPilihan>

      {jenis === "pilihan_ganda" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Pilihan jawaban (tandai kunci jawaban)</legend>
          {Array.from({ length: jumlahOpsi }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="jawabanBenar"
                  value={i}
                  defaultChecked={awal.jawabanBenar === i}
                  className="size-5 accent-primary"
                />
                <span aria-hidden>{HURUF_OPSI[i]}</span>
                <span className="sr-only">Kunci: pilihan {HURUF_OPSI[i]}</span>
              </label>
              <input
                name="opsi"
                aria-label={`Pilihan ${HURUF_OPSI[i]}`}
                defaultValue={awal.opsi[i] ?? ""}
                maxLength={1000}
                dir="auto"
                className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-base focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
          ))}
          {jumlahOpsi < BATAS_OPSI && (
            <Button type="button" variant="outline" className="w-fit rounded-full" onClick={() => setJumlahOpsi((n) => n + 1)}>
              Tambah pilihan
            </Button>
          )}
          <p className="text-xs text-muted-foreground">Minimal 2 pilihan. Pilihan kosong di akhir diabaikan.</p>
        </fieldset>
      ) : (
        <KolomTeksPanjang
          label="Acuan jawaban untuk pemeriksa (opsional)"
          name="kunciIsian"
          defaultValue={awal.kunciIsian ?? ""}
          maxLength={2000}
          dir="auto"
          petunjuk="Tidak pernah ditampilkan ke peserta. Soal isian dinilai manual oleh tutor/admin."
        />
      )}
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Menyimpan..." : "Simpan soal"}
      </Button>
    </form>
  );
}

// Tombol aksi tunggal dengan konfirmasi (terbit/draf, hapus ujian/soal/audio).
function TombolAksi({
  aksi,
  label,
  tanya,
  varian = "outline",
}: {
  aksi: () => Promise<StatusAksi>;
  label: string;
  tanya?: string;
  varian?: "outline" | "destructive" | "default";
}) {
  const [status, kirim, sedang] = useActionState(aksi, undefined);
  return (
    <form
      action={kirim}
      onSubmit={(e) => {
        if (tanya && !window.confirm(tanya)) e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <PesanStatus {...status} />
      <Button type="submit" variant={varian} disabled={sedang} className="w-fit rounded-full">
        {sedang ? "Memproses..." : label}
      </Button>
    </form>
  );
}

export function TombolTerbit({ id, terbit }: { id: string; terbit: boolean }) {
  return (
    <TombolAksi
      aksi={() => aturTerbit(id, !terbit)}
      label={terbit ? "Jadikan draf" : "Terbitkan ujian"}
      varian={terbit ? "outline" : "default"}
      tanya={terbit ? "Jadikan draf? Peserta tidak akan melihat ujian ini." : undefined}
    />
  );
}

export function TombolHapusUjian({ id }: { id: string }) {
  return (
    <TombolAksi
      aksi={() => hapusUjian(id)}
      label="Hapus ujian"
      varian="destructive"
      tanya="Hapus ujian ini beserta semua soal dan audionya? Tindakan ini tidak bisa dibatalkan."
    />
  );
}

export function TombolHapusSoal({ ujianId, soalId, nomor }: { ujianId: string; soalId: string; nomor: number }) {
  return <TombolAksi aksi={() => hapusSoal(ujianId, soalId)} label="Hapus" tanya={`Hapus soal nomor ${nomor}?`} />;
}

export function TombolHapusAudio({ ujianId, audioId, judul }: { ujianId: string; audioId: string; judul: string }) {
  return <TombolAksi aksi={() => hapusAudio(ujianId, audioId)} label="Hapus" tanya={`Hapus audio "${judul}"?`} />;
}

// Unggah audio: berkas dikirim browser langsung ke Supabase Storage lewat tautan sekali pakai dari server.
export function UnggahAudio({ ujianId }: { ujianId: string }) {
  const [status, setStatus] = useState<StatusAksi>();
  const [sedang, mulai] = useTransition();
  const router = useRouter();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const berkas = data.get("berkas");
    const judul = String(data.get("judul") ?? "").trim();
    if (!(berkas instanceof File) || berkas.size === 0) return setStatus({ galat: "Pilih berkas audio." });
    if (!(berkas.type in JENIS_AUDIO)) return setStatus({ galat: "Berkas harus MP3 atau M4A." });
    if (berkas.size > BATAS_AUDIO) return setStatus({ galat: "Berkas lebih dari 10 MB. Kompres dulu." });

    mulai(async () => {
      setStatus(undefined);
      const siap = await siapkanUnggahAudio(ujianId, { judul, jenis: berkas.type, ukuran: berkas.size });
      if (siap.galat || !siap.url || !siap.path) return setStatus({ galat: siap.galat ?? "Unggahan gagal disiapkan." });
      const isi = new FormData();
      isi.append("cacheControl", "3600");
      isi.append("", berkas);
      const res = await fetch(siap.url, { method: "PUT", body: isi, headers: { "x-upsert": "false" } }).catch(() => null);
      if (!res?.ok) return setStatus({ galat: "Berkas gagal diunggah. Periksa koneksi lalu coba lagi." });
      const hasil = await simpanAudio(ujianId, siap.path, judul);
      setStatus(hasil);
      if (!hasil?.galat) {
        form.reset();
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PesanStatus {...status} />
      <KolomIsian label="Judul audio" name="judul" maxLength={200} placeholder="mis. Percakapan 1" dir="auto" required />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Berkas (MP3/M4A, maks. 10 MB)
        <input
          type="file"
          name="berkas"
          accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"
          required
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium"
        />
      </label>
      <Button type="submit" disabled={sedang} className={`${kelasTombol} w-fit`}>
        {sedang ? "Mengunggah..." : "Unggah audio"}
      </Button>
    </form>
  );
}
