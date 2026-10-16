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

const ISI_PITA: { teks: string; arab?: boolean }[] = [
  { teks: "Bahasa Arab" },
  { teks: "English" },
  { teks: "نحو وصرف", arab: true },
  { teks: "مفتاح اللغة", arab: true },
];

// Pita miring berjalan: Bahasa Arab ✦ English ✦ نحو وصرف ✦ مفتاح اللغة (✦ digambar sebagai SVG).
// Urutan diulang 6 kali dan digeser -50% berulang, sehingga sambungannya tak terlihat di layar selebar apa pun.
export function Band() {
  const urutan = Array.from({ length: 6 }, () => ISI_PITA).flat();
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
