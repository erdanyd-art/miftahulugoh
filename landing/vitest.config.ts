import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Alias "@/..." sama dengan tsconfig.json
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    // e2e/ dijalankan Playwright, bukan Vitest
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
