import Link from "next/link";
import type { CSSProperties } from "react";
import {
  IkonCentang,
  IkonKalender,
  IkonKunci,
  IkonPanah,
  IkonVideo,
  Key,
  LetterTile,
  Sparkle,
  SpeechBubble,
  Squiggle,
} from "./art";

export function Nav() {
  return (
    <header className="lp-nav">
      <Link href="/" className="lp-logo">
        <span aria-hidden="true" className="lp-logo-bulat">
          <IkonKunci />
        </span>
        <span className="lp-logo-nama">Miftah al-Lughah</span>
      </Link>
      <nav aria-label="Navigasi utama" className="lp-menu">
        <a href="#program">Program</a>
        <a href="#cara">Cara belajar</a>
        <a href="#daftar">Daftar</a>
        <Link href="/masuk" className="lp-masuk">
          Masuk
        </Link>
      </nav>
    </header>
  );
}

export function Hero({ tautanDaftar }: { tautanDaftar: string | null }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-baris">
        <div className="lp-hero-teks">
          <div className="lp-stiker-baris">
            <span className="lp-stiker lp-miring-kiri">Kelas online</span>
            <span className="lp-stiker lp-stiker-putih lp-miring-kanan">via Google Meet</span>
          </div>

          <h1 className="lp-judul-hero">
            Buka <span className="lp-kunci-pil">kunci</span> bahasa Arab &amp; Inggrismu
          </h1>

          <p className="lp-paragraf-hero">
            Kelas Bahasa Arab, Bahasa Inggris, dan Nahwu Shorof bersama tutor lembaga. Pilih program, terima jadwal,
            langsung belajar.
          </p>

          <div className="lp-aksi-baris">
            <a
              href={tautanDaftar ?? "#daftar"}
              className="lp-tombol-utama"
              {...(tautanDaftar ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              Daftar sekarang
              <span aria-hidden="true" className="lp-panah-bulat">
                <IkonPanah />
              </span>
            </a>
            <a href="#program" className="lp-tautan-garis">
              Lihat program
            </a>
          </div>
        </div>

        <Adegan />
      </div>

      <div className="lp-fakta-baris">
        <div data-tilt="6" className="lp-fakta lp-latar-limau">
          <span aria-hidden="true" className="lp-ikon-bulat lp-ikon-limau">
            <IkonVideo />
          </span>
          <span>
            <strong>Online via Google Meet</strong>
            <br />
            Belajar dari rumah, kapan pun sesuai jadwal.
          </span>
        </div>
        <div data-tilt="6" className="lp-fakta lp-latar-periwinkle">
          <span aria-hidden="true" className="lp-ikon-bulat lp-ikon-periwinkle">
            <IkonKalender />
          </span>
          <span>
            <strong>Jadwal tetap tiap pekan</strong>
            <br />
            Hari dan jam jelas, mudah diatur.
          </span>
        </div>
        <div data-tilt="6" className="lp-fakta lp-latar-putih">
          <span aria-hidden="true" className="lp-ikon-bulat lp-ikon-putih">
            <IkonCentang />
          </span>
          <span>
            <strong>Kehadiran dicatat tutor</strong>
            <br />
            Setiap pertemuan, setiap peserta.
          </span>
        </div>
      </div>
    </section>
  );
}

// Adegan kanan hero: dekoratif seluruhnya. Posisi dalam persen agar tetap di dalam panel di layar sempit.
// Panggung 3D: kisi diam di belakang; lapisan depan bergoyang pelan (CSS) dan miring mengikuti kursor
// (data-tilt, components/landing/gerak.tsx). Kedalaman tiap objek lewat kelas lp-z-*.
const tunda = (detik: number) => ({ "--tunda": `${detik}s` }) as CSSProperties;

function Adegan() {
  return (
    <div aria-hidden="true" className="lp-adegan" data-tilt="10">
      <div className="lp-adegan-kisi" />
      <div className="lp-adegan-goyang">
        <div className="lp-adegan-isi">
          <div className="lp-lingkaran-putus lp-z-1" />
          <Squiggle style={{ left: "9%", bottom: "14%" }} />

          <Sparkle ukuran={30} className="lp-abs lp-putih lp-kelip lp-z-2" style={{ left: "7%", top: "50%", ...tunda(0) }} />
          <Sparkle ukuran={22} className="lp-abs lp-limau lp-kelip lp-z-1" style={{ left: "46%", top: "24%", ...tunda(0.8) }} />
          <Sparkle ukuran={38} className="lp-abs lp-limau lp-kelip lp-z-4" style={{ left: "34%", bottom: "9%", ...tunda(1.6) }} />
          <Sparkle ukuran={24} className="lp-abs lp-putih lp-kelip lp-z-3" style={{ right: "9%", top: "64%", ...tunda(2.4) }} />

          <Key className="lp-kunci" />

          <SpeechBubble warna="putih" ekor="bawah" miring={-6} style={{ left: "6%", top: "7%" }}>
            <span lang="ar" dir="rtl" className="lp-arab lp-balon-arab">
              مرحبا!
            </span>
          </SpeechBubble>

          <SpeechBubble warna="limau" ekor="atas" miring={5} style={{ right: "7%", bottom: "8%", ...tunda(1.2) }}>
            <span className="lp-balon-latin">Hello!</span>
          </SpeechBubble>

          <div className="lp-ubin-kolom">
            <LetterTile huruf="أ" miring={-8} style={tunda(0)} />
            <LetterTile huruf="ب" limau miring={6} style={tunda(0.5)} />
            <LetterTile huruf="ت" miring={-3} style={tunda(1)} />
          </div>
        </div>
      </div>
    </div>
  );
}
