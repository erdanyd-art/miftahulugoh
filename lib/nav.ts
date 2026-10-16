import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileCheck,
  HandCoins,
  History,
  Landmark,
  LayoutDashboard,
  NotebookPen,
  Receipt,
  School,
  Settings,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type Peran = "admin" | "tutor" | "peserta";

// Menu per peran (CLAUDE.md). Ini hanya tampilan: hak akses ditegakkan di database dan server.
export const menuAdmin: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Kelas", href: "/kelas", icon: School },
  { label: "Peserta", href: "/peserta", icon: Users },
  { label: "Jadwal", href: "/jadwal", icon: CalendarDays },
  { label: "Absensi", href: "/absensi", icon: ClipboardCheck },
  { label: "Honor", href: "/honor", icon: HandCoins },
  { label: "Ujian", href: "/ujian", icon: NotebookPen },
  { label: "Pembayaran", href: "/pembayaran", icon: Receipt },
  { label: "Keuangan", href: "/keuangan", icon: Landmark },
  { label: "Pengguna", href: "/pengguna", icon: UserCog },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
  { label: "Audit", href: "/audit", icon: History },
];

export const menuTutor: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Jadwal Saya", href: "/jadwal-saya", icon: CalendarDays },
  { label: "Kelas Saya", href: "/kelas-saya", icon: BookOpen },
  { label: "Absensi", href: "/absensi", icon: ClipboardCheck },
  { label: "Honor Saya", href: "/honor-saya", icon: HandCoins },
  { label: "Periksa Ujian", href: "/periksa-ujian", icon: FileCheck },
];

// Peserta (Fase 2): ujian ditambahkan di Sprint 11.
export const menuPeserta: NavItem[] = [
  { label: "Beranda", href: "/", icon: LayoutDashboard },
  { label: "Akun saya", href: "/akun", icon: UserRound },
];

export const menuPerPeran: Record<Peran, NavItem[]> = { admin: menuAdmin, tutor: menuTutor, peserta: menuPeserta };
