// Pesan galat dari fungsi database (simpan_absensi, koreksi_honor, kunci_sesi) -> bahasa yang ramah.
const PETA: [string, string][] = [
  ["belum waktunya absen", "Belum waktunya absen. Absen dibuka mulai jam mulai kelas."],
  ["absensi hanya untuk hari ini", "Tutor hanya bisa mengisi absensi untuk hari ini."],
  ["tanggal belum tiba", "Tidak bisa mengisi absensi untuk tanggal yang belum tiba."],
  ["jadwal ini bukan untuk hari ini", "Jadwal ini bukan untuk hari ini."],
  ["sesi sudah dikunci", "Sesi ini sudah dikunci admin. Hubungi admin bila perlu dikoreksi."],
  ["bukan anggota aktif kelas", "Daftar hadir memuat peserta yang bukan anggota aktif kelas ini. Muat ulang halaman."],
  ["bukan jadwal Anda", "Ini bukan jadwal Anda."],
  ["jadwal tidak aktif", "Jadwal ini sudah tidak aktif."],
  ["jadwal tidak ditemukan", "Jadwal tidak ditemukan."],
  ["sesi tidak ditemukan", "Sesi tidak ditemukan."],
  ["honor tidak valid", "Honor harus angka bulat rupiah, tidak negatif."],
  ["tidak berwenang", "Akun Anda tidak berwenang melakukan ini."],
];

export function pesanGalatAbsensi(pesanDb: string | undefined): string {
  const cocok = PETA.find(([kunci]) => pesanDb?.includes(kunci));
  return cocok ? cocok[1] : "Terjadi kesalahan. Coba lagi.";
}
