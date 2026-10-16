import { Suspense } from "react";
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin";
import { DashboardPeserta } from "@/components/dashboard/dashboard-peserta";
import { DashboardTutor } from "@/components/dashboard/dashboard-tutor";
import { penggunaWajib } from "@/lib/auth";

export default function HalamanDashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardPerPeran />
    </Suspense>
  );
}

async function DashboardPerPeran() {
  const pengguna = await penggunaWajib();
  if (pengguna.peran === "admin") return <DashboardAdmin />;
  if (pengguna.peran === "peserta") return <DashboardPeserta nama={pengguna.nama} />;
  return <DashboardTutor />;
}
