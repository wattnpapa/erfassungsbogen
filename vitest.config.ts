import { defineConfig } from "vitest/config";

// Unit-Tests laufen in Node (der Codec ist plattformneutral, die getesteten
// App-Helfer brauchen kein DOM). Die React-/Browser-Verhaltenstests kommen
// später in einer eigenen Suite (Playwright/Cucumber).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
    },
  },
});
