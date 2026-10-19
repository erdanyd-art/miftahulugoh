import Link from "next/link";
import type { ReactNode } from "react";
import { formatRupiah } from "@/lib/format";
import { siteContent, tautanInstagram, tautanWhatsApp, type KontenSitus, type KunciKelas } from "@/lib/site-content";
import {
  IkonBaca,
  IkonBicara,
  IkonBuku,
  IkonCentangSaja,
  IkonDengar,
  IkonJamKecil,
  IkonKalenderKecil,
  IkonOrang,
  IkonPanah,
  IkonPerisai,
  IkonTulis,
  Sparkle,
} from "./art";

// Isi dari brosur (docs/landing-konten.md). Nilai kosong di lib/site-content.ts tampil sebagai placeholder.
function Pil({ nilai, placeholder, className }: { nilai: string; placeholder: string; className: string }) {
  const isi = nilai.trim();
  return <span className={`${className} ${isi ? "" : "lp-pil-kosong"}`}>{isi || placeholder}</span>;
}

// Tampilan per jenis kelas: warna kartu, ikon orang, huruf hiasan samar.
const VARIAN: Record<KunciKelas, { latar: string; orang: 1 | 2 | 3; hiasan: string }> = {
  reguler: { latar: "lp-latar-limau", orang: 3, hiasan: "ع" },
  "semi-privat": { latar: "lp-latar-biru", orang: 2, hiasan: "ل" },
  privat: { latar: "lp-latar-periwinkle", orang: 1, hiasan: "م" },
};

export function Program({ konten = siteContent }: { konten?: KontenSitus }) {
  return (
    <section id="program" className="lp-seksi lp-seksi-program">
      <div className="lp-kepala-seksi">
        <h2 className="lp-judul-seksi">Pilih kelas Anda</h2>
        <span className="lp-stiker lp-miring-kanan-3">{konten.kelas.length} jenis kelas</span>
      </div>

      <div className="lp-kartu-baris">
        {konten.kelas.map((k) => {
          const v = VARIAN[k.key];
          return (
            <article key={k.key} data-tilt="7" className={`lp-program ${v.latar}`}>
              {/* Huruf hiasan samar lewat CSS (::before): dekoratif, bukan teks yang perlu dibaca */}
              <span aria-hidden="true" data-huruf={v.hiasan} className="lp-hiasan-huruf lp-arab" />
              <div className="lp-kelas-kepala">
                <span aria-hidden="true" className="lp-kelas-ikon">
                  <IkonOrang jumlah={v.orang} />
                </span>
                <div>
                  <h3 className="lp-judul-program">{k.nama}</h3>
                  <p className="lp-kelas-peserta">{k.peserta}</p>
                </div>
              </div>
              <p className="lp-harga">
                <span className="lp-harga-angka">{formatRupiah(k.harga)}</span>
                <span className="lp-harga-satuan">{k.satuan}</span>
              </p>
              <p className="lp-teks-kartu">{k.deskripsi}</p>
              <div className="lp-cocok">
                <span className="lp-cocok-label">Cocok untuk:</span>
                <p className="lp-teks-kartu">{k.cocokUntuk}</p>
              </div>
              <div className="lp-pil-baris">
                <Pil nilai={k.jadwal} placeholder="[HARI & JAM]" className="lp-pil-info" />
              </div>
            </article>
          );
        })}
      </div>
      <p className="lp-catatan-harga">*Harga untuk 1 tingkat</p>
    </section>
  );
}

const MAHARAH: { latin: string; arab: string; arti: string; ikon: ReactNode }[] = [
  { latin: "Istima'", arab: "الاستماع", arti: "Menyimak", ikon: <IkonDengar /> },
  { latin: "Kalam", arab: "الكلام", arti: "Berbicara", ikon: <IkonBicara /> },
  { latin: "Qira'ah", arab: "القراءة", arti: "Membaca", ikon: <IkonBaca /> },
  { latin: "Kitabah", arab: "الكتابة", arti: "Menulis", ikon: <IkonTulis /> },
];

export function Kurikulum({ konten = siteContent }: { konten?: KontenSitus }) {
  const sistem: { label: string; isi: string; ikon: ReactNode }[] = [
    {
      label: "Materi",
      isi: `Kitab ABY (Mustawa 1–${konten.jumlahTingkat}), total ${konten.jumlahTingkat} tingkat pembelajaran`,
      ikon: <IkonBuku />,
    },
    { label: "Pertemuan", isi: `${konten.pertemuanPerBulan} kali per bulan`, ikon: <IkonKalenderKecil /> },
    { label: "Durasi", isi: `±${konten.durasiMenit} menit per pertemuan`, ikon: <IkonJamKecil /> },
    { label: "Ujian", isi: "4 maharah", ikon: <IkonPerisai /> },
  ];
  const fasilitas = [
    "Pembelajaran sesuai tingkatan kitab ABY",
    `${konten.pertemuanPerBulan} pertemuan per bulan`,
    "Evaluasi 4 maharah",
    "Latihan & pemantauan perkembangan",
    "Konsultasi pengajar",
    "Akses materi tambahan (jika tersedia)",
  ];

  return (
    <section id="kurikulum" className="lp-seksi">
      <div className="lp-kepala-seksi">
        <h2 className="lp-judul-seksi">Kurikulum &amp; sistem pembelajaran</h2>
        <span className="lp-stiker lp-stiker-putih lp-miring-kiri">
          Program terdiri dari {konten.jumlahTingkat} tingkat (level)
        </span>
      </div>

      <div className="lp-kurikulum-baris">
        <div data-tilt="5" className="lp-kurikulum-kartu lp-latar-putih">
          <dl className="lp-sistem">
            {sistem.map((b) => (
              <div key={b.label} className="lp-sistem-baris">
                <span aria-hidden="true" className="lp-ikon-kecil">
                  {b.ikon}
                </span>
                <dt>{b.label}</dt>
                <dd>{b.isi}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-tilt="5" className="lp-kurikulum-kartu lp-latar-limau">
          <h3 className="lp-judul-blok">4 Maharah yang diujikan</h3>
          <ul className="lp-maharah">
            {MAHARAH.map((m) => (
              <li key={m.latin}>
                <span aria-hidden="true" className="lp-ikon-kecil">
                  {m.ikon}
                </span>
                <span>
                  <strong>
                    {m.latin} (
                    <span lang="ar" dir="rtl" className="lp-arab lp-maharah-arab">
                      {m.arab}
                    </span>
                    )
                  </strong>
                  <span className="lp-maharah-arti">{m.arti}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div data-tilt="5" className="lp-kurikulum-kartu lp-latar-periwinkle">
          <h3 className="lp-judul-blok">Fasilitas</h3>
          <ul className="lp-fasilitas">
            {fasilitas.map((f) => (
              <li key={f}>
                <span aria-hidden="true" className="lp-centang">
                  <IkonCentangSaja />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const LANGKAH = [
  { judul: "Daftar", teks: "Hubungi kami dan pilih jenis kelas yang cocok untuk Anda." },
  { judul: "Terima jadwal & tautan", teks: "Anda mendapat jadwal pertemuan dan tautan Google Meet." },
  {
    judul: "Belajar bersama pengajar",
    teks: "Ikuti pertemuan tiap bulan sesuai tingkat Anda. Kehadiran dicatat oleh pengajar.",
  },
];

export function CaraBelajar() {
  return (
    <section id="cara" className="lp-seksi">
      <div className="lp-kepala-seksi">
        <h2 className="lp-judul-seksi">Tiga langkah, langsung belajar</h2>
      </div>
      <ol className="lp-langkah-baris">
        {LANGKAH.map((l, i) => (
          <li key={l.judul} data-tilt="8" className="lp-langkah">
            <span aria-hidden="true" className="lp-nomor">
              {i + 1}
            </span>
            <h3 className="lp-judul-langkah">{l.judul}</h3>
            <p className="lp-teks-kartu">{l.teks}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Daftar({ konten = siteContent }: { konten?: KontenSitus }) {
  const wa = tautanWhatsApp(konten.waNumber, konten.waMessage);
  const ig = tautanInstagram(konten.instagram);
  const luar = { target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <section id="daftar" className="lp-seksi lp-seksi-daftar">
      <div className="lp-blok-daftar">
        <Sparkle ukuran={46} className="lp-bintang-daftar-1 lp-navy-warna" />
        <Sparkle ukuran={26} className="lp-bintang-daftar-2 lp-biru" />

        <div className="lp-daftar-teks">
          <h2 className="lp-judul-daftar">Mulai dari sekarang, menuju kemahiran berbahasa Arab!</h2>
          <div>
            {wa ? (
              <a href={wa} className="lp-tombol-wa" {...luar}>
                Daftar Sekarang
                <span aria-hidden="true" className="lp-panah-bulat">
                  <IkonPanah />
                </span>
              </a>
            ) : (
              <a href="#daftar" aria-disabled="true" className="lp-tombol-wa lp-tombol-wa-kosong">
                Daftar Sekarang
                <span aria-hidden="true" className="lp-panah-bulat">
                  <IkonPanah />
                </span>
              </a>
            )}
          </div>
        </div>

        <div className="lp-kontak-kolom">
          <div className="lp-kontak">
            <span className="lp-kontak-label">WhatsApp</span>
            {wa ? (
              <a href={wa} className="lp-kontak-nilai" {...luar}>
                +{konten.waNumber.trim()}
              </a>
            ) : (
              <span className="lp-kontak-nilai lp-pil-kosong">[NOMOR WHATSAPP]</span>
            )}
          </div>
          <div className="lp-kontak">
            <span className="lp-kontak-label">Instagram</span>
            {ig ? (
              <a href={ig} className="lp-kontak-nilai" {...luar}>
                @{konten.instagram.trim().replace(/^@/, "")}
              </a>
            ) : (
              <span className="lp-kontak-nilai lp-pil-kosong">[@AKUN INSTAGRAM]</span>
            )}
          </div>
          <div className="lp-kontak">
            <span className="lp-kontak-label">Alamat</span>
            <Pil nilai={konten.address} placeholder="[ALAMAT / KOTA]" className="lp-kontak-nilai" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-isi">
        <span>© 2026 Lembaga Miftah al-Lughah</span>
        <Link href="/masuk">Masuk (admin dan tutor)</Link>
      </div>
    </footer>
  );
}
