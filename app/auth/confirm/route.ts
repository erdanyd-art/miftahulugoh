import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { jalurAman } from "@/lib/validasi/auth";

const JENIS_DIIZINKAN: EmailOtpType[] = ["invite", "recovery"];

// Tujuan tautan email (undangan / atur ulang sandi) berformat token_hash: bekerja di browser mana pun.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const jenis = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const lanjut = jalurAman(request.nextUrl.searchParams.get("next"));

  if (tokenHash && jenis && JENIS_DIIZINKAN.includes(jenis)) {
    const supabase = await buatKlienServer();
    const { error } = await supabase.auth.verifyOtp({ type: jenis, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(lanjut, request.url));
  }

  return NextResponse.redirect(new URL("/masuk?galat=tautan", request.url));
}
