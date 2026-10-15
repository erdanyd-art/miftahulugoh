import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ dijalankan Playwright, bukan Vitest
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
