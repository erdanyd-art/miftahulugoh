import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { envSupabase } from "./server";

// SATU-SATUNYA tempat kunci service_role dipakai. Melewati RLS, jadi:
// - hanya untuk API Auth admin (undang, blokir/buka blokir, baca email);
// - hanya dipanggil dari server action yang sudah memanggil wajibPeran("admin");
// - data tabel tetap ditulis dengan klien sesi admin (buatKlienServer) agar RLS dan audit berlaku.
export function klienAdmin() {
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!kunci) throw new Error("SUPABASE_SERVICE_ROLE_KEY wajib diisi di variabel lingkungan server");
  return createClient<Database>(envSupabase().url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
