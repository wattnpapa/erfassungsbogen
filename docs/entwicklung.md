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

Aufbau der Oberfläche: [src/app/main.tsx](../src/app/main.tsx) ist nur der
Browser-Einstieg (Plattformklassen, Wurzelknoten), die Anwendung selbst steht in
[src/app/app.tsx](../src/app/app.tsx). Die Assistenten-Schritte liegen je Schritt
in einer eigenen Datei unter [src/app/schritte/](../src/app/schritte/); was
mehrere Schritte teilen (Feld-Rahmen, Vokabular-Auswahl, Zähler, Hinweise),
steht in `schritte/bausteine.tsx`.

### Rückfragen und Eingaben (keine Systemdialoge)

`window.prompt`, `window.confirm` und `window.alert` sind in dieser App tabu:
Die iOS-App (WKWebView unter Capacitor) beantwortet sie nicht — `prompt` liefert
dort sofort `null`, der Knopf tut also scheinbar nichts. Stattdessen zeichnet die
App ihre Abfragen selbst, [src/app/dialoge.tsx](../src/app/dialoge.tsx):

- `frageText` / `frageFelder` — eine oder mehrere Eingaben (Ersatz für `prompt`);
  Rückgabe `null` heißt abgebrochen, ein leerer String heißt leer gelassen.
- `frageJaNein` — Rückfrage mit sprechender Zusage statt „OK" (Ersatz für `confirm`).
- `frageWahl` — mehrere benannte Wege mit Erklärung, wenn „OK/Abbrechen" die
  Frage verfälschen würde (z. B. „neue Fassung" gegen „eigene Einheit").
- `zeigeHinweis` — Mitteilung, auf Wunsch mit Text zum Kopieren (Ersatz für `alert`).

Der Zugang ist imperativ (`await frageText(...)`), gezeichnet wird von der
einmal eingehängten `<Dialogschicht />` (in `App`, in Tests in der
Schritt-Bühne). Der E2E-Wachhund in
[features/support/haken.ts](../features/support/haken.ts) lässt jedes Szenario
scheitern, in dem doch ein Systemdialog auftaucht.

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

## Tests

```
npm test              # beide Suiten
npm run test:watch
npm run test:coverage
npm run test:e2e      # Cucumber/Playwright gegen die gebaute Web-App
```

`npm test` fährt zwei Vitest-Projekte ([vitest.config.ts](../vitest.config.ts)):

- **`logik`** — Codec, Datenmodell, Signatur und die App-Helfer. Läuft in Node,
  Dateiendung `.test.ts`.
- **`oberflaeche`** — React-Komponenten mit Testing Library in jsdom,
  Dateiendung `.test.tsx`. Abgedeckt sind der Assistenten-Durchlauf
  ([src/app/app.test.tsx](../src/app/app.test.tsx): Startseite → Schritte →
  Übersicht → Bogen übergeben), das Anlegen einer Einsatz-Sammlung über den
  Dialog (beide Einstiege samt Abbruch) sowie die Schritte mit eigener Logik
  (Einheit, Personal, Fahrzeuge).

Für einen einzelnen Schritt genügt die Bühne aus
[src/test/schritt-buehne.tsx](../src/test/schritt-buehne.tsx) — sie hält den
Bogen im Zustand und hängt den Schritt so ein wie die App (`bogen` + `aendern`).

Zwei Dinge, die jsdom nicht mitbringt und die
[src/test/oberflaeche.ts](../src/test/oberflaeche.ts) bzw. die Vitest-Konfiguration
nachreichen: `<dialog>`-Methoden (`showModal`/`close` — die App öffnet damit
Übergabe-, Namens- und Einsatzwahl-Dialog) und das virtuelle Modul
`virtual:pwa-register`, das sonst erst vite-plugin-pwa im Build liefert.

### Verhaltenstests (Cucumber + Playwright)

`npm run test:e2e` fährt die Gherkin-Szenarien aus [features/](../features) im
echten Browser. Die Suite deckt die Wege ab, die eine Komponente allein nicht
belegen kann — Kodierung, Signatur, Speicher, Druck und Seitenwechsel im
Zusammenspiel:

| Datei | Worum es geht |
| --- | --- |
| [bogen-transport.feature](../features/bogen-transport.feature) | Startseite, Einstieg in den Assistenten, geteilter Link eines alten Bogens (Migration v2→v3) |
| [assistent.feature](../features/assistent.feature) | Alle sechs Schritte, Schrittleiste, OV-Vorschläge, Landesvorlage, Namensimport, Schnelleingabe, Meldekopf-Stärke, Fahrzeuge, Sofortbedarf, Vollständigkeit, Entwurfswiederherstellung |
| [uebergabe.feature](../features/uebergabe.feature) | QR-Code und Vollbild, PDF-Vorschau, PDF-Download, Link teilen — samt Runde „Link erzeugen → öffnen → Herkunft belegt → gegengezeichnet" |
| [vorlagen.feature](../features/vorlagen.feature) | Vorlage speichern, umbenennen, Papierkorb, Musterung (Abwesende streichen) |
| [einsatz-sammlung.feature](../features/einsatz-sammlung.feature) | Einsatz anlegen (Dialog, Pflichtfeld, Enter, Esc, Abbruch), Bogen aufnehmen |
| [einsatz-detail.feature](../features/einsatz-detail.feature) | Summen, Vollansicht, Abrücken, Zug-Etikett, Aufteilen/Zusammenführen, Folgemeldung/Historie/Diff, Sammel-PDF, CSV, Papierkorb |
| [einheiten-liste.feature](../features/einheiten-liste.feature) | Einheitenliste einer Großlage: Suche, Sortierung, Qualifikationsfilter — und dass die Summen davon unberührt bleiben |
| [daten-und-anzeige.feature](../features/daten-und-anzeige.feature) | Anzeigemodus Dunkel/Feld/Nacht (auch bei dunklem Systemdesign), Datensicherung, „Alle Daten löschen", Pflichtangaben, Beispielbögen, kaputter Link |

Der Prüfstand steht in [features/support/haken.ts](../features/support/haken.ts):

- **Gegen den Build, nicht gegen den Dev-Server.** `BeforeAll` baut die App und
  startet `vite preview`. Grund: pdfmake hängt im Dev-Server beim Rendern (siehe
  „PDF" unten) — ohne den Build wäre jeder PDF-Weg ungetestet. Nebenbei läuft die
  Suite so gegen den minifizierten Stand samt Service Worker.
  `EEB_SERVER=dev` schaltet auf den Dev-Server um, `EEB_BASE_URL=…` hängt sich an
  einen bereits laufenden Server, `EEB_BROWSER=webkit` fährt die Suite als
  iOS-WKWebView-Näherung.
- **Wachhund gegen Systemdialoge.** Jedes `window.prompt/confirm/alert` lässt das
  Szenario scheitern — in der iOS-App bleiben sie unbeantwortet (siehe oben,
  „Rückfragen").
- **Portprüfung vor dem Start.** Ist Port 5273 belegt, bricht die Suite mit
  Klartext ab, statt zu laufen. Der Grund ist eine teure Falle: `vite
  --strictPort` beendet sich bei belegtem Port still, und die Suite testet dann
  gegen den FREMDEN Server unter derselben Adresse — im schlimmsten Fall gegen
  den Build eines anderen Verzeichnisses (Haupt-Repo statt Worktree). Alte
  Szenarien werden grün, nur die zur neuen Arbeit scheitern, und zwar mit
  „Element nicht gefunden" statt mit dem wahren Grund. Damit es überhaupt nicht
  dazu kommt, beendet `AfterAll` die ganze Prozessgruppe des Servers (`npx`
  startet vite als Kind — ein Signal an npx allein ließe ihn weiterlaufen) und
  wartet auf sein Ende, bevor cucumber aussteigt.

Zwei Fallen beim Schreiben neuer Schritte:

- **Auswahllisten über den Namen, Eingabefelder über das Label.** Auswahllisten
  tragen ihren Feldnamen als `aria-label` (Zusicherung aus
  [beschriftungen.feature](../features/beschriftungen.feature)) — dort greift
  `getByLabel(..., { exact: true })`. Bei einem Textfeld im umschließenden
  `<label>` wandert dagegen der eingegebene Inhalt in den zugänglichen Namen:
  ein Schritt darauf fände das Feld nur, solange es leer ist. Eingaben sucht
  deshalb das Label, dessen Text mit dem Feldnamen beginnt
  ([oberflaeche.steps.ts](../features/schritte/oberflaeche.steps.ts)).
- **Schaltflächen exakt treffen.** Namen werden `exact` verglichen — sonst fängt
  „Löschen" auch „Alle Daten löschen" aus der Fußzeile ein.

## Einsatz-Sammlung (Meldekopf)

Fremde Bögen werden lokal unter einem Einsatz/einer Übung gesammelt (Gegenstück
zu „Meine Vorlagen" für die eigene Einheit). Reine Logik ist von der
localStorage-Hülle getrennt und unit-getestet.

- [src/app/einsaetze.ts](../src/app/einsaetze.ts) — Speicher, Fingerabdruck
  (`einheitSchluessel`), Dedupe über inhaltsbasierte Eintrags-ID, Revisions-Historie
  (neueste je Einheit zählt), Zug-Etikett je Einheit, Import/Merge.
- [src/app/aufteilen.ts](../src/app/aufteilen.ts) — Bogen aufteilen: Personal,
  Fahrzeuge und (im Meldekopf-Modus) die Stärkezahlen auf Rest und abgeteilten
  Teil verteilen; Kraftstoff bleibt beim Rest, die Verpflegungszahl zieht mit
  der Stärke um. Oberfläche in
  [src/app/aufteilen-ui.tsx](../src/app/aufteilen-ui.tsx).
- [src/app/zusammenfuehren.ts](../src/app/zusammenfuehren.ts) — Gegenstück: Teile
  wieder zu einer Meldung verschmelzen. Personal und Fahrzeuge werden
  zusammengelegt (nicht entdoppelt — Teile einer Aufteilung sind
  überschneidungsfrei), Sofortbedarf summiert, Ja/Nein-Angaben mit ODER
  verknüpft. Ist ein Teil nur als Stärke gemeldet, führt das Ergebnis die Summen
  als Zahlen und behält die bekannten Namen als Ansprechpartner. Oberfläche in
  [src/app/zusammenfuehren-ui.tsx](../src/app/zusammenfuehren-ui.tsx).
- [src/app/auswertung.ts](../src/app/auswertung.ts) — Summen über die aktuell
  anwesenden Einheiten (`aggregiere`) und Zwischensummen je Zug
  (`aggregiereNachZug`), aufgebaut auf denselben abgeleiteten Werten wie die
  Einzelsicht.
- [src/app/einheiten-liste.ts](../src/app/einheiten-liste.ts) — Suche (alle
  Wörter müssen treffen, Groß/Klein und Akzente egal) und umschaltbare
  Sortierung (Name / Eintreffzeit / Zug / Organisation) der Einheitenliste.
  Betrifft nur die Anzeige; die Summen rechnen unverändert über alle
  anwesenden Einheiten.
- [src/app/einsatz-transport.ts](../src/app/einsatz-transport.ts) — Export/Import
  als JSON-Datei sowie Import aus dem in Sammel-PDFs eingebetteten JSON (pako).
- [src/app/einsaetze-ui.tsx](../src/app/einsaetze-ui.tsx) — Liste, Detailansicht
  (Summen, Zwischensummen, Einheitenliste mit Suche/Sortierung und
  Status/Historie), Sammeln per Scan/Datei/manuell.

Kernregeln: Historie stapeln (tägliche Neumeldung = neue Revision), Zuordnung per
Fingerabdruck (vorgeschlagen, vom Menschen bestätigt/überschrieben), Idempotenz
(gleicher Bogeninhalt erzeugt keine zweite Revision). Die optionalen Felder
`zugEtikett`, `teilEtikett` und `stammtVon` bleiben abwärtskompatibel — alte
Sammlungen ohne sie laden unverändert.

**Aufteilen.** Wird ein Zug zerrissen oder steht ein Fachberater plötzlich
einzeln, entstehen aus einer Meldung zwei: der Rest wird als neue Revision
derselben Einheit fortgeschrieben (die Diff-Ansicht zeigt die Abgänge dadurch
von selbst), der abgeteilte Teil kommt als eigene Meldung dazu. Damit sich beide
nicht als Revision überschreiben, hängt an seinem Fingerabdruck ein `|teil:N`;
`teilEtikett` benennt ihn in Liste, CSV und Sammel-PDF. Beide Bögen entstehen
lokal, tragen also bewusst **keine** Signatur und keinen Herkunfts-Payload der
Ursprungsmeldung — die deckten den veränderten Inhalt nicht mehr. Die signierte
Ursprungsfassung bleibt in der Historie.

**Zusammenführen.** Sammelt sich der Zug wieder, nimmt eine Meldung die anderen
auf: das Ziel bekommt eine neue Revision mit allem darin, die eingegliederten
Teile bleiben mit ihrer Historie stehen. Ihr Status wird `AUFGEGANGEN` — bewusst
nicht `ABGERUECKT`, denn abgerückt wären sie ein Abgang, den es nie gab; sie
stecken jetzt in den Zahlen des Ziels. Aus den Summen fallen sie so oder so
(`aktuelleMeldungen` zählt nur `ANWESEND`), doppelt gezählt wird nichts.
Zusammengeführt wird nur innerhalb einer Einheit (gleicher Stamm-Fingerabdruck):
zwei verschiedene Einheiten zu verschmelzen wäre kein Zusammenführen, sondern
Datenverlust.

Eine Falle steckt in der Revisionsreihenfolge: `istNeuer` wertet den Stand
minutengenau und erst bei Gleichstand die Empfangszeit. Aufteilen und gleich
wieder Zusammenführen fällt in dieselbe Minute — und bei schnellen Geräten in
dieselbe Millisekunde. Dann bliebe die ALTE Fassung Revisionskopf und die Summen
zeigten den Zustand vor der Änderung. Beide Mutationen setzen die Empfangszeit
deshalb über `ablosendeEmpfangszeit` einen Millisekundenschritt über alle
bisherigen Fassungen derselben Einheit.

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
System-Browser. Die Kamera (QR-Scan) wird dort ausdrücklich freigegeben.

### Windows: x64 **und** ARM64

Für Windows entstehen zwei Installer. Auf ARM-Geräten (Snapdragon X u. Ä.)
läuft ein x64-Paket nur emuliert, und emulierte Apps kommen dort nicht an die
Kamera — der QR-Scan bliebe schwarz, eine Kameraauswahl gäbe es nicht, weil das
System gar keine Kamera meldet. Deshalb baut der Workflow beide Architekturen.

electron-updater kennt unter Windows nur eine `latest.yml`. Damit sich eine
ARM64-Installation nicht beim nächsten Update selbst durch das x64-Paket
ersetzt, gibt es einen zweiten Kanal: `latest-arm64.yml`
([ensure-update-metadata.cjs](../scripts/ensure-update-metadata.cjs) legt sie
an, [main.js](../electron/main.js) liest sie auf ARM64).

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

### Übergabe ans Nachbargerät (AirDrop / Quick Share)

Der Übergabe-Dialog bietet neben QR, PDF und Link einen Weg „An Gerät in der
Nähe senden": Er legt den vollständigen Bogen-Link ins System-Share-Sheet, wo
AirDrop bzw. Quick Share stehen — beides läuft ohne Netz und ohne Kopplung, der
Empfänger tippt den Link an und landet über den Universal/App Link in der App.
Nativ übernimmt das Capacitor-Plugin, im Browser die Web Share API; ohne beides
(Desktop-Chrome unter Linux, Electron) erscheint der Weg gar nicht erst
(`shareSheetVerfuegbar()` in [src/app/nativ.ts](../src/app/nativ.ts)).

**Warum kein NFC:** Die Web NFC API kann kein Handy-zu-Handy — `NDEFReader`
liest und schreibt nur NFC-Tags, Peer-to-Peer ist nicht Teil der Spezifikation,
und Android Beam (das einzige Verfahren, das das je konnte) ist seit Android 14
entfernt. Dazu läuft Web NFC nur in Chromium auf Android; WebKit hat es nie
bekommen, iOS fällt also komplett aus. Ein NFC-**Tag** als Datenträger ginge,
wäre aber ein Rückschritt: gemessen über die 239 Beispielbögen liegt die
signierte Nutzlast im Median bei 562 Bytes (p90 708, max 1837) — auf einen
NTAG215 (~492 B nutzbar) passen 23 %, auf einen NTAG216 (~872 B) 93 %, während
ein einzelner QR-Code heute schon mehr trägt.

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

## Vorbelegungen in Schritt 1 (Stärkeplätze & Fahrzeuge)

Beim Anlegen einer Einheit lassen sich Personal-Sollplätze und Fahrzeuge
vorbelegen. Es gibt zwei Quellen:

- **THW (code-basiert, StAN-konform):** an den Einheitstyp gekoppelt, gepflegt in
  [src/vokabulare/thw-stan-personal.ts](../src/vokabulare/thw-stan-personal.ts)
  und [thw-stan-fahrzeuge.ts](../src/vokabulare/thw-stan-fahrzeuge.ts).
- **Landesvorlagen (freitext-basiert, aus den Beispielbögen abgeleitet):** für
  alle übrigen Organisationen außer Polizei, Bundespolizei und Bundeswehr.
  Logik in [src/vokabulare/landesvorlagen.ts](../src/vokabulare/landesvorlagen.ts),
  UI in `SchrittEinheit` ([src/app/schritte/einheit.tsx](../src/app/schritte/einheit.tsx)):
  erst Bundesland, dann Einheit wählen → Einheitstyp, Stärkeplätze (Namen offen)
  und Fahrzeuge (ohne Kennzeichen/Funkrufname) werden gesetzt. Die Einheitenliste
  ist nach Regelwerk gruppiert, weil unter derselben Organisation und demselben
  Bundesland mehrere nebeneinanderstehen können – in Niedersachsen etwa die
  KatS-StAN, die Nds. Feuerwehrverordnung und (für das DRK) die Gliederung der
  Bereitschaft.

**Konvention – Landesvorlagen pflegen sich selbst:** Jeder Beispielbogen unter
`examples/<bereich>/<bundesland>/*.json` wird beim Build per `import.meta.glob`
eingelesen und steht automatisch als Landesvorlage der darin angegebenen
Organisation und des Bundeslands zur Verfügung. Ein **neues Bundesland** ist nur
ein neuer Unterordner, eine **neue Einheit** nur eine weitere JSON-Datei – beide
erscheinen ohne Codeänderung. Kommen also künftig weitere StAN-Unterlagen oder
Landesverordnungen als Beispielbögen hinzu (erzeugt von
`scripts/kats-*-beispielboegen.mts` bzw. `scripts/fw-*-beispielboegen.mts`), sind
sie damit auch als Vorlage verfügbar. Anzeigenamen werden bei Bedarf in
`BUNDESLAND_LABEL` bzw. `BEREICH_LABEL` (in `landesvorlagen.ts`) ergänzt;
unbekannte Ordner werden sonst kapitalisiert angezeigt.

Ein **neuer Bereich** ist die einzige Änderung, die Code braucht: Er muss in
`BEREICHE` (in `landesvorlagen.ts`) eingetragen und in den Glob-Mustern ergänzt
werden. Damit bleiben die organisationseigenen Beispiele ohne Landesgliederung
(`examples/thw/`, `examples/dlrg/`) außen vor – sie gelten bundes- bzw.
verbandsweit und sind keine Landesvorlagen. Ein Bereich muss nicht
landesrechtlich sein: `examples/drk/niedersachsen/` (erzeugt von
`scripts/drk-nds-beispielboegen.mts`) bildet die Gliederung einer
DRK-Bereitschaft ab, die je Landesverband aufgestellt ist und deshalb ebenfalls
an einem Bundesland hängt.

## Offene Punkte

Siehe [TODO.md](TODO.md) (Gerätetests, App Store Connect,
Deep-Link-Verifizierung) — danach: weitere BOS-Vokabulare, THW-OV-Verzeichnis
vervollständigen.
