// Isi landing page (/) yang diisi pemilik lembaga. Selama kosong, halaman menampilkan placeholder.
// Jangan mengisi nomor/akun contoh yang tampak asli (docs/landing-page.md bagian 5).
export type KunciProgram = "arab" | "inggris" | "nahwu";

export type KontenSitus = {
  waNumber: string;
  waMessage: string;
  instagram: string;
  address: string;
  programs: { key: KunciProgram; jadwal: string; biaya: string }[];
};

export const siteContent: KontenSitus = {
  waNumber: "", // hanya angka dengan kode negara, mis. 62812...
  waMessage: "Assalamu'alaikum, saya ingin mendaftar di Lembaga Miftah al-Lughah.",
  instagram: "", // tanpa @
  address: "",
  programs: [
    { key: "arab", jadwal: "", biaya: "" },
    { key: "inggris", jadwal: "", biaya: "" },
    { key: "nahwu", jadwal: "", biaya: "" },
  ],
};

// Tautan WhatsApp, atau null bila nomor belum diisi / bukan angka yang wajar.
export function tautanWhatsApp(nomor: string, pesan: string): string | null {
  const angka = nomor.trim();
  if (!/^\d{8,15}$/.test(angka)) return null;
  return `https://wa.me/${angka}?text=${encodeURIComponent(pesan)}`;
}

// Tautan Instagram, atau null bila akun belum diisi. "@" di depan diabaikan.
export function tautanInstagram(akun: string): string | null {
  const nama = akun.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(nama)) return null;
  return `https://www.instagram.com/${nama}/`;
}

// URL situs untuk metadata, robots, dan sitemap. NEXT_PUBLIC_SITE_URL diisi setelah domain sendiri dipasang;
// sampai saat itu dipakai domain produksi Vercel (variabel sistem Vercel saat build).
export function urlSitus(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
