// Cucumber.js-Konfiguration für die Verhaltenstests (Gherkin auf Deutsch,
// gefahren über Playwright gegen die laufende Web-App). Die TypeScript-
// Schritt-/Support-Dateien werden über den tsx-Loader geladen
// (NODE_OPTIONS="--import tsx", gesetzt im npm-Skript "test:e2e").
export default {
  paths: ["features/**/*.feature"],
  import: ["features/**/*.ts"],
  format: [
    "summary",
    ["html", "reports/cucumber.html"],
  ],
  formatOptions: { snippetInterface: "async-await" },
};
