import { Loader2 } from "lucide-react";

// Pop-up "sedang memuat" yang menutup layar, agar pengguna tahu proses masih berjalan (mis. Supabase lambat)
// dan tidak menekan tombol berkali-kali.
export function OverlayMemuat({ pesan }: { pesan: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
      <div role="status" aria-live="assertive" className="flex items-center gap-3 rounded-3xl bg-card px-6 py-5 shadow-xl">
        <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
        <span className="text-base font-medium">{pesan}</span>
      </div>
    </div>
  );
}
