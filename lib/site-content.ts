// Isi landing page (/), dari brosur resmi lembaga (docs/landing-konten.md, docs/referensi-brosur.jpg).
// Yang belum ada di brosur dibiarkan kosong dan tampil sebagai placeholder: kontak dan jadwal.
// Jangan mengisi nomor/akun contoh yang tampak asli.
export type KunciKelas = "reguler" | "semi-privat" | "privat";

export type Kelas = {
  key: KunciKelas;
  nama: string;
  peserta: string;
  harga: number; // rupiah, bilangan bulat
  satuan: string; // persis seperti brosur
  deskripsi: string;
  cocokUntuk: string;
  jadwal: string; // belum ada di brosur: kosong = placeholder [HARI & JAM]
};

export type KontenSitus = {
  waNumber: string;
  waMessage: string;
  instagram: string;
  address: string;
  kelas: Kelas[];
  pertemuanPerBulan: number;
  durasiMenit: number;
  jumlahTingkat: number;
};

export const siteContent: KontenSitus = {
  waNumber: "", // hanya angka dengan kode negara, mis. 62812...
  waMessage: "Assalamu'alaikum, saya ingin mendaftar di Lembaga Miftah al-Lughah.",
  instagram: "", // tanpa @
  address: "",
  kelas: [
    {
      key: "reguler",
      nama: "Reguler",
      peserta: "5–7 peserta per kelas",
      harga: 100000,
      satuan: "/peserta/bulan",
      deskripsi: "Belajar bersama dalam kelompok kecil dengan suasana yang interaktif, suportif, dan kondusif.",
      cocokUntuk: "Peserta yang menginginkan pembelajaran terstruktur dengan biaya terjangkau.",
      jadwal: "",
    },
    {
      key: "semi-privat",
      nama: "Semi Privat",
      peserta: "2 peserta per kelas",
      harga: 175000,
      satuan: "/peserta/bulan",
      deskripsi:
        "Pendampingan lebih intensif dengan jumlah peserta terbatas untuk interaksi yang lebih maksimal bersama pengajar.",
      cocokUntuk: "Peserta yang menginginkan pendampingan lebih intensif dengan biaya yang tetap.",
      jadwal: "",
    },
    {
      key: "privat",
      nama: "Privat",
      peserta: "1 peserta per kelas",
      harga: 275000,
      satuan: "/bulan (Per Tingkat)",
      deskripsi:
        "Pembelajaran eksklusif dengan pendekatan personal, disesuaikan sepenuhnya dengan kemampuan dan target belajar Anda.",
      cocokUntuk: "Peserta yang menginginkan pembelajaran fokus dan pendampingan yang lebih.",
      jadwal: "",
    },
  ],
  pertemuanPerBulan: 12,
  durasiMenit: 60,
  jumlahTingkat: 8,
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
