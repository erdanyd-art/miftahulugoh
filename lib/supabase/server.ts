import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/lib/database.types";

export function envSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi (lihat .env.example)");
  }
  return { url, anonKey };
}

// Klien Supabase untuk Server Component, Server Action, dan Route Handler. Buat baru per permintaan.
// Memakai kunci anon + sesi pengguna dari cookie, jadi semua akses tetap dibatasi RLS.
export async function buatKlienServer() {
  // Sesi selalu dibaca saat permintaan (supabase-js memakai jam saat ini, tidak boleh ikut prerender).
  // Dipanggil sebelum membaca env, agar build tanpa variabel Supabase (job CI "app") tetap berhasil.
  await connection();
  const { url, anonKey } = envSupabase();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(daftar) {
        try {
          daftar.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component (tidak boleh menulis cookie); proxy.ts yang menyegarkan sesi.
        }
      },
    },
  });
}
