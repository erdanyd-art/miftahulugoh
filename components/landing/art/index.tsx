import { Fragment, type CSSProperties, type ReactNode } from "react";

// Ilustrasi landing page, semua dibuat sendiri dan dekoratif (aria-hidden). Warna mengikuti `color`
// (currentColor) dari kelas pemanggil, kecuali kunci yang memakai token langsung.

const JALUR_BINTANG = "M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z";

export function Sparkle({ ukuran, className, style }: { ukuran: number; className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden="true" width={ukuran} height={ukuran} viewBox="0 0 24 24" className={className} style={style}>
      <path d={JALUR_BINTANG} fill="currentColor" />
    </svg>
  );
}

export function Squiggle({ style }: { style?: CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      width="100"
      height="24"
      viewBox="0 0 100 24"
      className="lp-abs lp-putih lp-ombak lp-z-2"
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    >
      <path d="M3 12 Q 14 0 25 12 T 47 12 T 69 12 T 91 12" />
    </svg>
  );
}

// Kunci: digambar dua kali (kontur navy tebal, lalu isi limau), lubang berwarna primary.
export function Key({ className }: { className?: string }) {
  const bentuk = (
    <>
      <circle cx="44" cy="50" r="34" />
      <rect x="70" y="43" width="128" height="14" rx="7" />
      <rect x="150" y="55" width="14" height="24" rx="5" />
      <rect x="174" y="55" width="14" height="17" rx="5" />
    </>
  );
  return (
    <svg aria-hidden="true" viewBox="0 0 210 100" className={className}>
      <g className="lp-kunci-kontur" strokeWidth="9" strokeLinejoin="round">
        {bentuk}
      </g>
      <g className="lp-kunci-isi">{bentuk}</g>
      <circle cx="44" cy="50" r="12" className="lp-kunci-lubang" strokeWidth="4.5" />
    </svg>
  );
}

export function SpeechBubble({
  warna,
  ekor,
  miring,
  style,
  children,
}: {
  warna: "putih" | "limau";
  ekor: "bawah" | "atas";
  miring: number;
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="lp-abs lp-melayang lp-z-3" style={{ ...style, rotate: `${miring}deg` }}>
      <div className={`lp-balon ${warna === "putih" ? "lp-balon-putih" : "lp-balon-limau"}`}>
        {children}
        <span className={`lp-ekor ${ekor === "bawah" ? "lp-ekor-bawah" : "lp-ekor-atas"}`} />
      </div>
    </div>
  );
}

export function LetterTile({
  huruf,
  limau,
  miring,
  style,
}: {
  huruf: string;
  limau?: boolean;
  miring: number;
  style?: CSSProperties;
}) {
  return (
    <span
      lang="ar"
      dir="rtl"
      className={`lp-ubin lp-arab ${limau ? "lp-ubin-limau" : ""}`}
      style={{ ...style, rotate: `${miring}deg` }}
    >
      {huruf}
    </span>
  );
}

// Teks pita dari docs/landing-konten.md: Bahasa Arab ✦ Kitab ABY ✦ 8 Tingkat ✦ مفتاح اللغة
function isiPita(jumlahTingkat: number): { teks: string; arab?: boolean }[] {
  return [
    { teks: "Bahasa Arab" },
    { teks: "Kitab ABY" },
    { teks: `${jumlahTingkat} Tingkat` },
    { teks: "مفتاح اللغة", arab: true },
  ];
}

// Pita miring berjalan (✦ digambar sebagai SVG).
// Urutan diulang 6 kali dan digeser -50% berulang, sehingga sambungannya tak terlihat di layar selebar apa pun.
export function Band({ jumlahTingkat }: { jumlahTingkat: number }) {
  const urutan = Array.from({ length: 6 }, () => isiPita(jumlahTingkat)).flat();
  return (
    <div aria-hidden="true" className="lp-pita">
      <div className="lp-pita-jalur">
        {urutan.map((item, i) => (
          <Fragment key={i}>
            {item.arab ? (
              <span lang="ar" dir="rtl" className="lp-arab lp-pita-arab">
                {item.teks}
              </span>
            ) : (
              <span>{item.teks}</span>
            )}
            <Sparkle ukuran={22} className="lp-putih" />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// Ikon kecil (garis), mengikuti currentColor.
function Garis({ ukuran, lebar, children }: { ukuran: number; lebar: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={lebar}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const IkonKunci = () => (
  <Garis ukuran={26} lebar={2.2}>
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9M18 12v4M21 12v3" />
  </Garis>
);

export const IkonPanah = () => (
  <Garis ukuran={22} lebar={2.4}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Garis>
);

export const IkonVideo = () => (
  <Garis ukuran={26} lebar={2}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3z" />
  </Garis>
);

export const IkonKalender = () => (
  <Garis ukuran={26} lebar={2}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Garis>
);

export const IkonCentang = () => (
  <Garis ukuran={26} lebar={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </Garis>
);

export const IkonJam = () => (
  <Garis ukuran={26} lebar={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Garis>
);

// Ikon kurikulum dan maharah (garis, 24px)
export const IkonBuku = () => (
  <Garis ukuran={24} lebar={2}>
    <path d="M3 5.5C5.5 4.5 9 4.5 12 6.5c3-2 6.5-2 9-1v13c-2.5-1-6-1-9 1-3-2-6.5-2-9-1z" />
    <path d="M12 6.5v13" />
  </Garis>
);

export const IkonKalenderKecil = () => (
  <Garis ukuran={24} lebar={2}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2" />
  </Garis>
);

export const IkonJamKecil = () => (
  <Garis ukuran={24} lebar={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Garis>
);

export const IkonPerisai = () => (
  <Garis ukuran={24} lebar={2}>
    <path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </Garis>
);

export const IkonDengar = () => (
  <Garis ukuran={26} lebar={2}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4.5" height="7" rx="1.5" />
    <rect x="16.5" y="14" width="4.5" height="7" rx="1.5" />
  </Garis>
);

export const IkonBicara = () => (
  <Garis ukuran={26} lebar={2}>
    <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    <path d="M17 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-3.5-3H12" />
  </Garis>
);

export const IkonBaca = () => (
  <Garis ukuran={26} lebar={2}>
    <path d="M2 6c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v12c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1z" />
    <path d="M12 7v12" />
  </Garis>
);

export const IkonTulis = () => (
  <Garis ukuran={26} lebar={2}>
    <path d="M15.5 4.5l4 4L9 19H5v-4z" />
    <path d="M13 7l4 4M4 21h16" />
  </Garis>
);

export const IkonCentangSaja = () => (
  <Garis ukuran={20} lebar={3}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Garis>
);

// Ikon orang (isi), untuk jenis kelas: 3 orang (Reguler), 2 orang (Semi Privat), 1 orang (Privat).
function Orang({ cx, skala = 1 }: { cx: number; skala?: number }) {
  return (
    <g transform={`translate(${cx} 0) scale(${skala}) translate(${-cx} 0)`}>
      <circle cx={cx} cy={9} r={4.6} />
      <path d={`M${cx - 8} 25a8 8 0 0 1 16 0v1h-16z`} />
    </g>
  );
}

export function IkonOrang({ jumlah }: { jumlah: 1 | 2 | 3 }) {
  return (
    <svg aria-hidden="true" width="34" height="28" viewBox="0 0 34 28" fill="currentColor">
      {jumlah === 1 && <Orang cx={17} skala={1.05} />}
      {jumlah === 2 && (
        <>
          <Orang cx={10.5} />
          <Orang cx={23.5} />
        </>
      )}
      {jumlah === 3 && (
        <>
          <Orang cx={7} skala={0.8} />
          <Orang cx={27} skala={0.8} />
          <Orang cx={17} />
        </>
      )}
    </svg>
  );
}
