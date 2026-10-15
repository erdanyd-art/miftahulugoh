import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

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

export function KolomTeksPanjang({
  label,
  petunjuk,
  ...props
}: { label: string; name: string; petunjuk?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <textarea
        {...props}
        rows={props.rows ?? 3}
        className="rounded-xl border border-input bg-card px-4 py-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-ring"
      />
      {petunjuk && <span className="text-xs font-normal text-muted-foreground">{petunjuk}</span>}
    </label>
  );
}

export function KolomCentang({ label, ...props }: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex w-fit items-center gap-3 text-sm font-medium">
      <input type="checkbox" {...props} className="size-5 accent-primary" />
      {label}
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
