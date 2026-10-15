import { describe, expect, it } from "vitest";
import { keCsv, selCsv } from "./csv";

describe("selCsv: pencegahan injeksi formula", () => {
  it("memberi tanda petik pada teks berawalan = + - @ tab CR", () => {
    expect(selCsv("=HYPERLINK(\"http://jahat\")")).toBe(`"'=HYPERLINK(""http://jahat"")"`);
    expect(selCsv("+62812")).toBe("'+62812");
    expect(selCsv("-1+1")).toBe("'-1+1");
    expect(selCsv("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(selCsv("\tisi")).toBe("'\tisi");
  });

  it("teks biasa dan angka tidak diubah", () => {
    expect(selCsv("SPP Oktober")).toBe("SPP Oktober");
    expect(selCsv(250000)).toBe("250000");
    expect(selCsv(null)).toBe("");
  });

  it("meng-escape koma, kutip, dan baris baru", () => {
    expect(selCsv('Infaq, "jumat"')).toBe('"Infaq, ""jumat"""');
    expect(selCsv("baris\nbaru")).toBe('"baris\nbaru"');
  });
});

describe("keCsv", () => {
  it("menulis BOM, kepala, dan baris dengan CRLF", () => {
    expect(keCsv(["a", "b"], [["x", 1]])).toBe("﻿a,b\r\nx,1\r\n");
  });
});
