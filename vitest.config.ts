import { defineConfig } from "vitest/config";

// Zwei Suiten in einem Lauf:
//   „logik"       — Codec, Modell und App-Helfer; plattformneutral, läuft in Node.
//   „oberflaeche" — React-Komponenten mit Testing Library, braucht ein DOM (jsdom).
// Die Trennung hält die schnellen Logiktests frei vom DOM-Aufbau und macht schon
// an der Endung sichtbar, wo ein Test läuft (.test.ts / .test.tsx).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "logik",
          environment: "node",
          // scripts/ ist mit dabei: die Build-Werkzeuge (etwa die Sitemap) sind
          // reine Node-Logik und gehören in denselben Lauf wie der App-Kern.
          include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: {
            // Liefert sonst erst vite-plugin-pwa im Build/Dev.
            "virtual:pwa-register": new URL("./src/test/pwa-register.ts", import.meta.url).pathname,
          },
        },
        // Im Build setzt vite.config.ts hier die Release-Version der Fußzeile.
        define: { __APP_VERSION__: JSON.stringify("test") },
        test: {
          name: "oberflaeche",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/test/oberflaeche.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts",
        "src/test/**",
        // Reiner Browser-Einstieg: hängt die App in den Wurzelknoten, außerhalb
        // eines Browsers nicht ausführbar.
        "src/app/main.tsx",
      ],
    },
  },
});
