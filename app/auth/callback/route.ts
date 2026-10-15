import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { jalurAman } from "@/lib/validasi/auth";

// Tujuan tautan email (atur ulang kata sandi / undangan): tukar kode menjadi sesi, lalu lanjutkan.
export async function GET(request: NextRequest) {
  const kode = request.nextUrl.searchParams.get("code");
  const lanjut = jalurAman(request.nextUrl.searchParams.get("next"));

  if (kode) {
    const supabase = await buatKlienServer();
    const { error } = await supabase.auth.exchangeCodeForSession(kode);
    if (!error) return NextResponse.redirect(new URL(lanjut, request.url));
  }

  return NextResponse.redirect(new URL("/masuk?galat=tautan", request.url));
}
