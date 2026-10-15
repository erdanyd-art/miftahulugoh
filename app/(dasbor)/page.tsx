import { Suspense } from "react";
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin";
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
  return pengguna.peran === "admin" ? <DashboardAdmin /> : <DashboardTutor />;
}
