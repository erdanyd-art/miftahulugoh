import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const kelasKolom =
  "h-11 rounded-xl border border-input bg-card px-4 text-base font-normal focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60";

export function KolomIsian({ label, ...props }: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input {...props} className={kelasKolom} />
    </label>
  );
}

export function KolomPilihan({
  label,
  children,
  ...props
}: { label: string; name: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <select {...props} className={kelasKolom}>
        {children}
      </select>
    </label>
  );
}

export function PesanStatus({ galat, pesan }: { galat?: string; pesan?: string }) {
  if (galat) {
    return (
      <p role="alert" className="rounded-xl bg-status-belum px-4 py-3 text-sm text-status-belum-foreground">
        {galat}
      </p>
    );
  }
  if (pesan) {
    return (
      <p role="status" className="rounded-xl bg-status-lunas px-4 py-3 text-sm text-status-lunas-foreground">
        {pesan}
      </p>
    );
  }
  return null;
}
