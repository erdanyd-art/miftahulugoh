import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Alias "@/..." sama dengan tsconfig.json
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    // e2e/ dijalankan Playwright, bukan Vitest; landing/ punya tesnya sendiri
    exclude: [...configDefaults.exclude, "e2e/**", "landing/**"],
  },
});
