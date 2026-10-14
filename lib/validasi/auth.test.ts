import { describe, expect, it } from "vitest";
import { jalurAman, skemaAturSandi, skemaMasuk } from "./auth";

describe("jalurAman", () => {
  it("menerima jalur internal", () => {
    expect(jalurAman("/atur-sandi")).toBe("/atur-sandi");
  });

  it("menolak pengalihan ke situs lain", () => {
    expect(jalurAman("//jahat.example")).toBe("/");
    expect(jalurAman("/\\jahat.example")).toBe("/");
    expect(jalurAman("https://jahat.example")).toBe("/");
    expect(jalurAman(null)).toBe("/");
  });
});

describe("skemaMasuk", () => {
  it("menolak email tidak valid", () => {
    expect(skemaMasuk.safeParse({ email: "bukan-email", kataSandi: "x" }).success).toBe(false);
    expect(skemaMasuk.safeParse({ email: "a@b.co", kataSandi: "rahasia" }).success).toBe(true);
  });
});

describe("skemaAturSandi", () => {
  it("mewajibkan minimal 10 karakter dan isian yang sama", () => {
    expect(skemaAturSandi.safeParse({ kataSandi: "pendek", ulangi: "pendek" }).success).toBe(false);
    expect(skemaAturSandi.safeParse({ kataSandi: "cukup-panjang", ulangi: "berbeda-isinya" }).success).toBe(false);
    expect(skemaAturSandi.safeParse({ kataSandi: "cukup-panjang", ulangi: "cukup-panjang" }).success).toBe(true);
  });
});
