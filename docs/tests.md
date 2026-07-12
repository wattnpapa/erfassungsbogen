# Tests

Zwei Ebenen decken die App ab. Beide laufen im CI (`.github/workflows/release.yml`,
Job `check`) als Pflicht-Gate vor den Plattform-Builds.

## Unit-Tests (Vitest)

Plattformneutrale Logik — Codec, Datenmodell, App-Helfer.

```bash
npm test              # einmalig
npm run test:watch    # Watch-Modus
npm run test:coverage # mit Abdeckungsbericht
```

Dateien liegen neben dem Code (`src/**/*.test.ts`). Schwerpunkt:

- **`src/codec.test.ts`** — Binär-/QR-Roundtrip, BCD-Telefonnummern, Vokabular
  (Code vs. Freitext), Unicode, Fehlerpfade (falsches Magic, Schema-Grenzen,
  über-/unvollständige Daten).
- **`src/codec.migration.test.ts`** — Abwärtskompatibilität über eine
  **eingefrorene v2-QR-Payload** (Base64url-Konstante). Diese Bytes dürfen sich
  nie ändern; sie stehen für QR-Codes/Dateien, die vor einer Schema-Umstellung
  erzeugt wurden. Bei jeder neuen `SCHEMA_VERSION` eine analoge eingefrorene
  Fixture der Vorgängerversion ergänzen, statt die alte zu verändern.
- **`src/model.test.ts`** — Datums-/Zeitkonvertierung, abgeleitete Werte
  (Stärke, Unterbringung M/W/D, Verpflegung, Ansprechpartner).
- **`src/app/hilfen.test.ts`** — Anzeige-Helfer (Funktions-/Kennzeichen-/
  Funkruftext), Plausibilitätsprüfung, JSON-Migration.

Nicht durch Unit-Tests abgedeckt (planmäßig E2E/manuell): QR-Rendering
(`qr-node.ts`), native Brücke (`nativ.ts`), PDF-Erzeugung (`pdf.ts`) sowie die
React-Oberfläche.

## Verhaltenstests (Cucumber.js + Playwright)

Gherkin-Szenarien auf Deutsch (`features/*.feature`), gefahren über Playwright
gegen die laufende Web-App. Da alle Plattform-Hüllen (iOS, Android, Electron)
dieselbe Web-Basis fahren, deckt die Web-Suite den Großteil des Verhaltens
plattformübergreifend ab.

```bash
npm run test:e2e                       # Chromium (startet selbst einen Vite-Server auf :5273)
EEB_BROWSER=webkit npm run test:e2e    # WebKit — Näherung an den iOS-WKWebView
EEB_BASE_URL=http://localhost:5173 npm run test:e2e  # gegen einen bereits laufenden Server
```

Aufbau unter `features/`:

- `*.feature` — Szenarien.
- `schritte/*.ts` — Schrittdefinitionen (Playwright-Locators).
- `support/welt.ts` — World (Seite + Basis-URL pro Szenario).
- `support/haken.ts` — startet Dev-Server und Browser, Screenshot bei Fehlschlag.
- `fixtures.ts` — eingefrorenes v2-QR-Fragment (identisch zum Migrationstest);
  prüft den echten Browser-Pfad: pako-Dekompression → Migration → Anzeige.

Der HTML-Report landet unter `reports/cucumber.html` (nicht versioniert).

## Ausbaustufen

1. **Erledigt:** Unit-Tests (Codec/Modell/Helfer, Golden-Fixture-Migration) und
   erste Web-E2E-Szenarien.
2. **Nächste:** breitere E2E-Abdeckung (kompletter Assistenten-Durchlauf,
   PDF-Erzeugung), Unit-Tests für die PDF-DocDefinition.
3. **Später:** native Gerätetests für Kamera-Scanner, Filesystem und Share
   (WebdriverIO/Appium gegen Simulator/Emulator) — der teuerste, zuletzt zu
   automatisierende Teil.
