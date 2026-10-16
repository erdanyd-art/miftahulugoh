import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Halaman yang boleh dibuka tanpa login.
const PUBLIK = ["/masuk", "/lupa-sandi", "/auth/", "/robots.txt", "/sitemap.xml"];

// Proxy hanya menyegarkan sesi Supabase dan melakukan pengalihan optimistis.
// Otorisasi sebenarnya ada di lib/auth.ts (server) dan RLS (database).
// Bila variabel lingkungan Supabase belum diisi (mis. lupa di Vercel), tampilkan halaman yang jelas,
// bukan galat 500 polos (yang tanpa Content-Type membuat browser menawarkan unduhan).
function konfigurasiBelumLengkap() {
  return new Response(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Konfigurasi belum lengkap</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#0f172a">
<h1 style="font-size:1.4rem">Aplikasi belum siap</h1>
<p>Konfigurasi server belum lengkap. Admin perlu mengisi variabel lingkungan Supabase di pengaturan hosting, lalu memasang ulang aplikasi.</p>
</body></html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return konfigurasiBelumLengkap();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    anonKey,
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
  // Bila Supabase tidak terjangkau, anggap belum masuk (halaman publik tetap bisa dibuka).
  const sudahMasuk = await supabase.auth
    .getClaims()
    .then(({ data }) => Boolean(data?.claims))
    .catch(() => false);
  const { pathname } = request.nextUrl;
  const publik = PUBLIK.some((awal) => pathname.startsWith(awal));

  const alihkan = (tujuan: string) => {
    const hasil = NextResponse.redirect(new URL(tujuan, request.url));
    response.cookies.getAll().forEach((cookie) => hasil.cookies.set(cookie));
    return hasil;
  };

  // Landing page publik (app/landing) tampil di "/" untuk yang belum masuk; yang sudah masuk tetap
  // melihat dashboard di "/". Bila token ternyata sudah dicabut, dashboard sendiri mengalihkan ke /masuk.
  if (!sudahMasuk && pathname === "/") {
    const hasil = NextResponse.rewrite(new URL("/landing", request.url));
    response.cookies.getAll().forEach((cookie) => hasil.cookies.set(cookie));
    return hasil;
  }
  if (!sudahMasuk && pathname === "/landing") return alihkan("/");

  // Tidak mengalihkan /masuk -> / walau ada token: token bisa sudah dicabut di server (menimbulkan putaran).
  if (!sudahMasuk && !publik) return alihkan("/masuk");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
