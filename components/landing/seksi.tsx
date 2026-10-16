import Link from "next/link";
import { siteContent, tautanInstagram, tautanWhatsApp, type KontenSitus, type KunciProgram } from "@/lib/site-content";
import { IkonPanah, Sparkle } from "./art";

// Nilai dari lib/site-content.ts; bila kosong tampil sebagai placeholder bergaris putus-putus.
function Pil({ nilai, placeholder, className }: { nilai: string; placeholder: string; className: string }) {
  const isi = nilai.trim();
  return <span className={`${className} ${isi ? "" : "lp-pil-kosong"}`}>{isi || placeholder}</span>;
}

const PROGRAM: {
  key: KunciProgram;
  label: string;
  labelArab: boolean;
  judul: string;
  teks: string;
  latar: string;
  hiasan: string;
  hiasanKelas: string;
}[] = [
  {
    key: "arab",
    label: "العربية",
    labelArab: true,
    judul: "Bahasa Arab Dasar",
    teks: "Mulai dari dasar: membaca, kosakata, dan kalimat sederhana untuk percakapan sehari-hari.",
    latar: "lp-latar-limau",
    hiasan: "ع",
    hiasanKelas: "lp-arab lp-hiasan-arab",
  },
  {
    key: "inggris",
    label: "English",
    labelArab: false,
    judul: "Bahasa Inggris Percakapan",
    teks: "Berlatih berbicara dan memahami percakapan sehari-hari agar lebih percaya diri.",
    latar: "lp-latar-biru",
    hiasan: "Aa",
    hiasanKelas: "lp-hiasan-aa",
  },
  {
    key: "nahwu",
    label: "نحو وصرف",
    labelArab: true,
    judul: "Nahwu Shorof",
    teks: "Memahami kaidah tata bahasa dan perubahan kata Arab agar dapat membaca teks dengan benar.",
    latar: "lp-latar-periwinkle",
    hiasan: "ن",
    hiasanKelas: "lp-arab lp-hiasan-nun",
  },
];

export function Program({ konten = siteContent }: { konten?: KontenSitus }) {
  return (
    <section id="program" className="lp-seksi lp-seksi-program">
      <div className="lp-kepala-seksi">
        <h2 className="lp-judul-seksi">Pilih kelasmu</h2>
        <span className="lp-stiker lp-miring-kanan-3">3 program</span>
      </div>

      <div className="lp-kartu-baris">
        {PROGRAM.map((p) => {
          const info = konten.programs.find((x) => x.key === p.key);
          return (
            <article key={p.key} data-tilt="7" className={`lp-program ${p.latar}`}>
              {/* Huruf hiasan samar lewat CSS (::before): dekoratif, bukan teks yang perlu dibaca */}
              <span aria-hidden="true" data-huruf={p.hiasan} className={`lp-hiasan-huruf ${p.hiasanKelas}`} />
              {p.labelArab ? (
                <span lang="ar" dir="rtl" className="lp-label-program lp-label-arab lp-arab">
                  {p.label}
                </span>
              ) : (
                <span lang="en" className="lp-label-program lp-label-latin">
                  {p.label}
                </span>
              )}
              <h3 className="lp-judul-program">{p.judul}</h3>
              <p className="lp-teks-kartu">{p.teks}</p>
              <div className="lp-pil-baris">
                <Pil nilai={info?.jadwal ?? ""} placeholder="[HARI & JAM]" className="lp-pil-info" />
                <Pil nilai={info?.biaya ?? ""} placeholder="[BIAYA / BULAN]" className="lp-pil-info" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const LANGKAH = [
  { judul: "Daftar", teks: "Hubungi kami dan pilih program yang cocok untukmu." },
  {
    judul: "Terima jadwal & tautan",
    teks: "Kamu mendapat jadwal pertemuan dan tautan Google Meet untuk kelasmu.",
  },
  { judul: "Belajar bersama tutor", teks: "Ikuti pertemuan tiap pekan. Kehadiranmu dicatat oleh tutor." },
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
          <h2 className="lp-judul-daftar">Siap masuk kelas?</h2>
          <p className="lp-paragraf-daftar">Hubungi kami untuk memilih program dan jadwal yang paling cocok.</p>
          <div>
            {wa ? (
              <a href={wa} className="lp-tombol-wa" {...luar}>
                Chat WhatsApp
                <span aria-hidden="true" className="lp-panah-bulat">
                  <IkonPanah />
                </span>
              </a>
            ) : (
              <a href="#daftar" aria-disabled="true" className="lp-tombol-wa lp-tombol-wa-kosong">
                Chat WhatsApp
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
