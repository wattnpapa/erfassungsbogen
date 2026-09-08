import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Die Kern-Bausteine liegen als Submodul unter vendor/ (ADR-003). Getestet wird
// gegen ihre Quelle, genau wie gebündelt wird — sonst prüfte der Testlauf ein
// vorgebautes dist/, das im Zweifel älter ist als der Submodul-Stand.
function kernPfad(baustein: string, modul: string): string {
  return fileURLToPath(new URL(`./vendor/${baustein}/src/${modul}.ts`, import.meta.url));
}

const kernAliasse = [
  { find: /^@bos\/eeb-format\/(.*)$/, replacement: kernPfad("eeb-format", "$1") },
  { find: /^@bos\/eeb-format$/, replacement: kernPfad("eeb-format", "index") },
  { find: /^@bos\/meldekopf\/(.*)$/, replacement: kernPfad("bos-meldekopf", "$1") },
  { find: /^@bos\/meldekopf$/, replacement: kernPfad("bos-meldekopf", "index") },
  { find: /^@bos\/vokabulare\/(.*)$/, replacement: kernPfad("bos-vokabulare", "$1") },
  { find: /^@bos\/vokabulare$/, replacement: kernPfad("bos-vokabulare", "index") },
  { find: /^@bos\/taktische-zeichen\/(.*)$/, replacement: kernPfad("bos-taktische-zeichen", "$1") },
  { find: /^@bos\/taktische-zeichen$/, replacement: kernPfad("bos-taktische-zeichen", "index") },
];

// Zwei Suiten in einem Lauf:
//   „logik"       — Codec, Modell und App-Helfer; plattformneutral, läuft in Node.
//   „oberflaeche" — React-Komponenten mit Testing Library, braucht ein DOM (jsdom).
// Die Trennung hält die schnellen Logiktests frei vom DOM-Aufbau und macht schon
// an der Endung sichtbar, wo ein Test läuft (.test.ts / .test.tsx).
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: kernAliasse },
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
          alias: [
            ...kernAliasse,
            {
              // Liefert sonst erst vite-plugin-pwa im Build/Dev.
              find: /^virtual:pwa-register$/,
              replacement: fileURLToPath(new URL("./src/test/pwa-register.ts", import.meta.url)),
            },
          ],
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
