import Image from "next/image";

// Logo asli lembaga (buku + kaligrafi kufi, PNG transparan) di atas kotak putih agar kontras
// di sidebar navy maupun latar krem halaman masuk. Nama lembaga ada di sebelahnya, jadi dekoratif.
export function LogoTanda() {
  return (
    <span aria-hidden className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-card px-1">
      <Image src="/logo-tanda.png" alt="" width={488} height={226} className="h-auto w-full" />
    </span>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoTanda />
      <span className="leading-tight">
        <span className="block text-xs text-sidebar-foreground">Lembaga</span>
        {/* "al-Lughah" tidak dipotong di tanda hubung; bila sempit, patah di spasi */}
        <span className="block font-judul text-white">
          Miftah <span className="whitespace-nowrap">al-Lughah</span>
        </span>
      </span>
    </div>
  );
}
