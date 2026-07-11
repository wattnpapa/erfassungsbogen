<img src="public/icon.svg" alt="Erfassungsbogen.app Logo" width="96" align="right">

# Erfassungsbogen

Multiplattform-App (Web, Desktop/Electron, Android, iOS) zum Erfassen von
Einheiten-Erfassungsbögen **aller BOS- und sonstigen Organisationen** (THW, Feuerwehr,
Polizei, DRK/JUH/MHD/ASB, DLRG, Bundeswehr, …), Export als druckbares PDF und
Offline-Transport des kompletten Bogens über einen einzelnen QR-Code.

Zwei Anwendungsfälle:

1. **Eigenerfassung** — die Einheit füllt ihren Bogen vollständig selbst aus (THW-Praxis).
2. **Meldekopf-Schnellerfassung** — eine Einheit trifft ohne Bogen ein und wird am
   Meldekopf auf dem Tablet in Minuten erfasst (nur Stärke, Führungskraft, Fahrzeuge),
   der Bogen wird gedruckt und weitergegeben.

## Browser-App (SPA-Prototyp)

```
npm install
npm run dev      # Entwicklung: http://localhost:5173
npm run build    # Produktion: dist/ — direkt für GitHub Pages geeignet (base: "./")
```

Assistent (Einheit → Einsatz → Personal → Fahrzeuge → Sofortbedarf) mit
Gesamtübersicht (alles nachbearbeitbar), PDF-Export im Papier-Layout mit
QR-Code auf der letzten Seite, Bogen speichern/laden als JSON-Datei.
Alles läuft clientseitig (Codec + pako + qrcode + pdfmake), kein Server nötig.
Code: [index.html](index.html), [src/app/](src/app/).

## Desktop-App (Electron)

Für die Offline-Nutzung ohne Browser gibt es die App als Desktop-Anwendung —
fertige Pakete zum Herunterladen unter
[Releases](https://github.com/wattnpapa/erfassungsbogen/releases/latest):

- **macOS**: `.dmg` (unsigniert — beim ersten Start Rechtsklick → „Öffnen")
- **Windows**: NSIS-Installer (`.exe`)
- **Linux**: `.deb` (Debian/Ubuntu) und `.pacman` (Arch)

Die App prüft beim Start automatisch auf neue Versionen (electron-updater gegen
das neueste GitHub-Release), lädt Updates im Hintergrund und installiert sie
nach Bestätigung bzw. beim nächsten Beenden. Offline-Starts bleiben ungestört.
Auf macOS setzt das Installieren von Updates eine signierte App voraus
(Signierung/Notarisierung aktiviert sich im Workflow automatisch, sobald die
Apple-Secrets wie bei S1-Control hinterlegt sind).

Jeder Push auf `main` baut automatisch ein Release mit Datums-Version
([release.yml](.github/workflows/release.yml), Aufbau wie bei
[S1-Control](https://github.com/wattnpapa/S1-Control)). Lokal:

```
npm run electron:dev     # Entwicklung: Vite-Dev-Server im Electron-Fenster
npm run electron:build   # Paket für die eigene Plattform → release/
```

Der Hauptprozess ([electron/main.js](electron/main.js)) lädt die unveränderte
Web-App aus `dist/` — kein Node-Zugriff im Renderer, externe Links öffnen im
System-Browser.

## Stand: Codec + QR-Rendering fertig (Schema v2)

- [docs/datenmodell.md](docs/datenmodell.md) — Datenmodell und Binärformat „EEB2"
- [src/model.ts](src/model.ts) — plattformneutrale TypeScript-Typen
- [src/codec.ts](src/codec.ts) — Encoder **und Decoder** (plattformneutral, Kompression injizierbar)
- [src/qr-node.ts](src/qr-node.ts) — QR-Erzeugung als SVG/PNG für Node/Electron
- [src/vokabulare/thw.ts](src/vokabulare/thw.ts) — THW-Vokabular (StAN Stand 01.07.2026)
- [scripts/qr-demo.ts](scripts/qr-demo.ts) — End-to-End-Test: Bogen → QR-PNG → jsQR-Scan → Decoder → identisch (`npm run demo`; Ausgabe in `examples/`)
- [prototype/qr-size-check.mjs](prototype/qr-size-check.mjs) — frühes Messskript (historisch)

### Messergebnis (`node prototype/qr-size-check.mjs`)

```
Voller THW-Bogen (FGr K (A), 20 Personen einzeln, 6 Fahrzeuge):
  JSON 4874 Bytes → QR-Payload 511 Bytes  → QR Version 18 bei ECC M (≈ 4,5×4,5 cm)

… mit OV-Verzeichnis-Referenz (OV-Nummer statt Name/Hierarchie/Kontakten):
  JSON 4556 Bytes → QR-Payload 411 Bytes  → QR Version 15 bei ECC M (≈ 3,9×3,9 cm)

Meldekopf-Schnellerfassung (FF-Löschzug, nur Stärke, 4 Fahrzeuge):
  JSON 1453 Bytes → QR-Payload 191 Bytes  → QR Version 10 bei ECC M (≈ 2,9×2,9 cm)
```

**Ergebnis: machbar.** Beide Fälle passen mit 15 % Fehlerkorrektur bequem in einen
QR-Code; bis zum Budget (Version 25 = 997 Bytes) bleibt ~50 % Reserve. Kern der
Kompression: organisationsspezifische Vokabulare mit 1-Byte-Codes und Freitext-Ausweg,
BCD-Telefonnummern, abgeleitete statt gespeicherter Werte (Stärke, M/W/D), Deflate.

## Nächste Stufen

1. App-Gerüst (Framework-Entscheidung offen), PDF-Export im Papier-Layout,
   QR-Scanning per Kamera (Codec-Gegenstück ist fertig)
2. Meldekopf-Modus-UI (minimale Pflichtfelder, Einsatz-Vorbelegung, Touch-optimiert)
3. Weitere BOS-Vokabulare (nach und nach), THW-OV-Verzeichnis befüllen
4. Optional: Deflate-Dictionary, Signatur

## Lizenz

[EUPL-1.2](LICENSE) — Europäische Union Public Licence (mit amtlicher deutscher Fassung).
