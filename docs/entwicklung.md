# Entwicklung

Technische Dokumentation für Mitentwickler. Was die App ist und kann, steht in
der [README](../README.md).

## Web-App

Assistent (Einheit → Einsatz → Personal → Fahrzeuge → Sofortbedarf) mit
Gesamtübersicht (alles nachbearbeitbar), PDF-Export im Papier-Layout mit
QR-Code auf der letzten Seite, Bogen speichern/laden als JSON-Datei,
QR-Scannen per Kamera (nativ über Capacitor-Plugin, im Browser/Electron per
Webcam). Alles läuft clientseitig (Codec + pako + qrcode + pdfmake), kein
Server nötig. Code: [index.html](../index.html), [src/app/](../src/app/).

```
npm install
npm run dev      # Entwicklung: http://localhost:5173
npm run build    # Produktion: dist/ — direkt für GitHub Pages geeignet (base: "./")
```

Deployment: jeder Push auf `main` baut die Seite und deployt sie auf
GitHub Pages unter <https://erfassungsbogen.app>
([release.yml](../.github/workflows/release.yml)).

### Offline (Service Worker)

Die Web-App ist offline-fähig: ein Service Worker (Workbox über
[vite-plugin-pwa](https://vite-pwa-org.netlify.app), Konfiguration in
[vite.config.ts](../vite.config.ts)) precacht beim ersten Besuch die App-Shell
(HTML/JS/CSS, Icons, manifest; das THW-OV-Verzeichnis steckt im JS-Bundle).
Danach startet und läuft die Seite ohne Netz — Bogen ausfüllen, PDF und
QR-Code erzeugen funktionieren rein clientseitig.

- **Nur im Browser.** Registriert wird der SW ausschließlich über `http(s)` und
  nur, wenn die App nicht nativ läuft (Guard `istNativ()` in
  [src/app/aktualisierung.tsx](../src/app/aktualisierung.tsx)). In der
  Capacitor-App (`capacitor://`) und in Electron (`file://`) liegt `sw.js`
  ungenutzt im Bundle; dort bringen die eigenen Update-Mechanismen die App
  aktuell.
- **Updates ohne Aggressiv-Cache.** `registerType: "prompt"` — eine neue Version
  lädt im Hintergrund und wartet; das Banner „Neue Version verfügbar – Neu laden"
  aktiviert sie erst auf Klick (kein Auto-Reload, damit ein gerade ausgefüllter
  Bogen nicht verlorengeht). `cleanupOutdatedCaches` räumt alte Stände weg.
- **Deep Links bleiben unangetastet.** Die `.well-known`-Dateien
  (AASA/assetlinks) werden weder precacht noch auf die App-Shell umgeleitet
  (`navigateFallbackDenylist`), damit Universal/App Links weiter greifen.
- **Testen.** Der SW greift nur im Produktions-Build, nicht in `npm run dev`.
  Also `npm run build && npm run preview`, dann in den DevTools „Offline"
  aktivieren (oder den Server stoppen) und neu laden.

## Einsatz-Sammlung (Meldekopf)

Fremde Bögen werden lokal unter einem Einsatz/einer Übung gesammelt (Gegenstück
zu „Meine Vorlagen" für die eigene Einheit). Reine Logik ist von der
localStorage-Hülle getrennt und unit-getestet.

- [src/app/einsaetze.ts](../src/app/einsaetze.ts) — Speicher, Fingerabdruck
  (`einheitSchluessel`), Dedupe über inhaltsbasierte Eintrags-ID, Revisions-Historie
  (neueste je Einheit zählt), Zug-Etikett je Einheit, Import/Merge.
- [src/app/auswertung.ts](../src/app/auswertung.ts) — Summen über die aktuell
  anwesenden Einheiten (`aggregiere`) und Zwischensummen je Zug
  (`aggregiereNachZug`), aufgebaut auf denselben abgeleiteten Werten wie die
  Einzelsicht.
- [src/app/einsatz-transport.ts](../src/app/einsatz-transport.ts) — Export/Import
  als JSON-Datei sowie Import aus dem in Sammel-PDFs eingebetteten JSON (pako).
- [src/app/einsaetze-ui.tsx](../src/app/einsaetze-ui.tsx) — Liste, Detailansicht
  (Summen, Zwischensummen, Einheitenliste mit Status/Historie), Sammeln per
  Scan/Datei/manuell.

Kernregeln: Historie stapeln (tägliche Neumeldung = neue Revision), Zuordnung per
Fingerabdruck (vorgeschlagen, vom Menschen bestätigt/überschrieben), Idempotenz
(gleicher Bogeninhalt erzeugt keine zweite Revision). Das optionale Feld
`zugEtikett` bleibt abwärtskompatibel — alte Sammlungen ohne Etikett laden
unverändert.

## Desktop-App (Electron)

Die App prüft beim Start automatisch auf neue Versionen (electron-updater gegen
das neueste GitHub-Release), lädt Updates im Hintergrund und installiert sie
nach Bestätigung bzw. beim nächsten Beenden. Offline-Starts bleiben ungestört.
Auf macOS setzt das Installieren von Updates eine signierte App voraus
(Signierung/Notarisierung aktiviert sich im Workflow automatisch, sobald die
Apple-Secrets wie bei S1-Control hinterlegt sind).

Jeder Push auf `main` baut automatisch ein Release mit Datums-Version
([release.yml](../.github/workflows/release.yml), Aufbau wie bei
[S1-Control](https://github.com/wattnpapa/S1-Control)). Lokal:

```
npm run electron:dev     # Entwicklung: Vite-Dev-Server im Electron-Fenster
npm run electron:build   # Paket für die eigene Plattform → release/
```

Der Hauptprozess ([electron/main.js](../electron/main.js)) lädt die unveränderte
Web-App aus `dist/` — kein Node-Zugriff im Renderer, externe Links öffnen im
System-Browser.

## Mobile Apps (Android & iOS)

Beide Apps entstehen per [Capacitor](https://capacitorjs.com) aus derselben
Web-App ([android/](../android/), [ios/](../ios/)) und sind plattformgerecht
gestylt: iOS nach Apple HIG (Dark Mode, Dynamic Type, 44pt-Touch-Ziele),
Android nach Material Design 3 (Farbrollen, Type Scale, 48dp-Touch-Ziele).

- **Android**: signierte APK bei jedem Release (minSdk 26 / Android 8.0).
- **iOS**: Build über Xcode (`npm run ios:sync && npm run ios:open`);
  App-Store-/TestFlight-Einreichung ist in Vorbereitung ([TODO.md](TODO.md)).

Die QR-Codes enthalten `https://erfassungsbogen.app/#<Payload>` — als
Universal/App Link öffnet der Scan mit der Systemkamera direkt die installierte
App, ohne App die Web-App (AASA/assetlinks unter
[public/.well-known/](../public/.well-known/)). Datenschutzerklärung für die
Stores: [public/datenschutz.html](../public/datenschutz.html).

## Datenmodell & QR-Codec (Schema v3)

- [datenmodell.md](datenmodell.md) — Datenmodell und Binärformat „EEB2"
- [src/model.ts](../src/model.ts) — plattformneutrale TypeScript-Typen
- [src/codec.ts](../src/codec.ts) — Encoder und Decoder (plattformneutral, Kompression injizierbar)
- [src/qr-node.ts](../src/qr-node.ts) — QR-Erzeugung als SVG/PNG für Node/Electron
- [src/vokabulare/thw.ts](../src/vokabulare/thw.ts) — THW-Vokabular (StAN Stand 01.07.2026)
- [scripts/qr-demo.ts](../scripts/qr-demo.ts) — End-to-End-Test: Bogen → QR-PNG → jsQR-Scan → Decoder → identisch (`npm run demo`; Ausgabe in `examples/`)

Kern der Kompression: organisationsspezifische Vokabulare mit 1-Byte-Codes und
Freitext-Ausweg, BCD-Telefonnummern, abgeleitete statt gespeicherter Werte
(Stärke, M/W/D), Deflate. Ein voller THW-Bogen (20 Personen, 6 Fahrzeuge)
passt so in einen QR-Code von ca. 4,5 × 4,5 cm (Version 18, ECC M), die
Meldekopf-Schnellerfassung in ca. 2,9 × 2,9 cm.

**Abwärtskompatibilität:** Schemaänderungen sind immer migrierbar — QR-Codes
und JSON-Dateien älterer Schema-Versionen (ab v2) bleiben lesbar.

## Offene Punkte

Siehe [TODO.md](TODO.md) (Gerätetests, App Store Connect,
Deep-Link-Verifizierung) — danach: weitere BOS-Vokabulare, THW-OV-Verzeichnis
vervollständigen.
