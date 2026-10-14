import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Halaman yang boleh dibuka tanpa login.
const PUBLIK = ["/masuk", "/lupa-sandi", "/auth/"];

// Proxy hanya menyegarkan sesi Supabase dan melakukan pengalihan optimistis.
// Otorisasi sebenarnya ada di lib/auth.ts (server) dan RLS (database).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(daftar, headers) {
          daftar.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          daftar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([kunci, nilai]) => response.headers.set(kunci, nilai));
        },
      },
    },
  );

  // Wajib dipanggil agar token yang kedaluwarsa disegarkan sebelum halaman dirender.
  const { data } = await supabase.auth.getClaims();
  const sudahMasuk = Boolean(data?.claims);
  const { pathname } = request.nextUrl;
  const publik = PUBLIK.some((awal) => pathname.startsWith(awal));

  const alihkan = (tujuan: string) => {
    const hasil = NextResponse.redirect(new URL(tujuan, request.url));
    response.cookies.getAll().forEach((cookie) => hasil.cookies.set(cookie));
    return hasil;
  };

  if (!sudahMasuk && !publik) return alihkan("/masuk");
  if (sudahMasuk && pathname === "/masuk") return alihkan("/");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
