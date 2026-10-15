// Hiasan garis sederhana untuk halaman masuk (gambar sendiri, bukan aset pihak lain).
// Warna lewat currentColor/token; aria-hidden karena hanya dekorasi.

function Titik({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const titik = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) titik.push([x + 8 + i * ((w - 16) / 3), y + 10 + j * ((h - 20) / 5)]);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="fill-hangat" />
      {titik.map(([cx, cy], k) => (
        <circle key={k} cx={cx + (k % 2) * 3} cy={cy} r="3" className="fill-primary" />
      ))}
    </g>
  );
}

export function HiasanKiri({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 300" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20 40c15-18 25 14 40-2s22 12 36-4 18 8 26 2" />
      <circle cx="150" cy="22" r="3" />
      {/* kartu catatan */}
      <rect x="70" y="80" width="90" height="62" rx="2" className="fill-card" />
      <path d="M86 102h58M86 116h44M86 142l-10 14 24-14" />
      <circle cx="190" cy="150" r="5" />
      {/* balok bertitik dan buku terbuka */}
      <Titik x={30} y={190} w={64} h={100} />
      <rect x="104" y="228" width="66" height="62" className="fill-card" />
      <path d="M118 278c10-6 26-22 30-40m0 0-8 5m8-5 3 8" />
      <path d="M182 262c8-10 22-10 30 0" />
      <path d="M0 290h260" />
    </svg>
  );
}

export function HiasanKanan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 320" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M150 30c12-14 20 10 32-2s18 10 30-2 16 6 24 0" />
      <circle cx="252" cy="58" r="3" />
      {/* gelembung huruf Arab */}
      <path d="M40 60h84a10 10 0 0 1 10 10v42a10 10 0 0 1-10 10H78l-16 14v-14H40a10 10 0 0 1-10-10V70a10 10 0 0 1 10-10Z" className="fill-card" />
      <text x="82" y="104" textAnchor="middle" className="fill-primary font-arab" stroke="none" fontSize="34">
        عِلْم
      </text>
      {/* tumpukan buku */}
      <rect x="70" y="222" width="120" height="22" rx="3" className="fill-card" />
      <rect x="80" y="244" width="112" height="22" rx="3" className="fill-pastel-biru" />
      <rect x="64" y="266" width="128" height="24" rx="3" className="fill-card" />
      <path d="M84 233h70M94 255h60M78 278h80" />
      <path d="M118 222c-4-24 10-40 30-46m0 0-4 10m4-10-10 0" />
      <Titik x={204} y={180} w={56} h={110} />
      <path d="M20 200c10-12 18 8 28-2" />
      <path d="M0 290h280" />
    </svg>
  );
}
