import { Video } from "lucide-react";

// Tautan Meet dibuka di tab baru tanpa memberi akses window.opener ke situs tujuan.
export function TombolMeet({ url, kelas }: { url: string; kelas: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Video className="size-4" aria-hidden />
      Masuk Google Meet<span className="sr-only"> kelas {kelas} (tab baru)</span>
    </a>
  );
}
