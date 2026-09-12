# Informationssicherheitskonzept

**Digitaler Einheiten-Erfassungsbogen — Vorlage/Entwurf**
Grundlage: Repository `wattnpapa/erfassungsbogen`, Stand 2026-09-12 — Version 0.1 (Entwurf)

> **Quelle dieses Dokuments.** Markdown-Fassung von `ISK-Erfassungsbogen.docx`.
> Die technischen Aussagen wurden am 2026-09-12 gegen `main` (Commit `c7604e9`)
> und den angehefteten Submodul-Commit `87b40dd` nachgeprüft; Ergänzungen und
> Korrekturen sind als *Prüfvermerk* gekennzeichnet.
>
> **Wichtig:** Der Entwurf entstand auf dem Stand vom 2026-09-11. Der Commit
> „Sicherheitsbericht umsetzen: SBOM, CSP ohne unsafe-inline, Entpack-Grenze"
> (`c7604e9`, 2026-09-12) hat drei der hier genannten Schwachstellen bereits
> behoben: die Dekomprimierungs-Obergrenze (6.2/R2/M2), `'unsafe-inline'` bei
> `script-src` (5.3/6.2/R4/M4) und die fehlende Schwachstellenprüfung der
> Abhängigkeiten (6.4/R8/M8). Die betroffenen Abschnitte sind entsprechend
> gekennzeichnet.

## Hinweis zu diesem Dokument

Dies ist eine KI-gestützt erstellte Entwurfsvorlage, keine geprüfte oder
freigegebene Fassung. Grundlage ist eine technische Analyse des öffentlich
einsehbaren Quellcodes des Repositorys `wattnpapa/erfassungsbogen` (Stand siehe
Rahmendaten) samt der eingebundenen Submodule. Das Dokument ersetzt weder die
Bestellung und Mitwirkung einer/eines IT-Sicherheitsbeauftragten noch eine
formale Freigabe durch die Leitung der einsetzenden Organisation.

Die Anwendung hat keinen zentralen Betreiber: Es gibt keinen Server, keine
zentrale Datenhaltung und keine Nutzerkonten — jede Organisation
(THW-Ortsverband, Feuerwehr, Hilfsorganisation, Kommune …) setzt die App
eigenständig auf ihren eigenen Geräten ein. Ein pauschales, für alle
Organisationen gültiges Sicherheitskonzept kann es daher nicht geben. Dieses
Dokument ist deshalb bewusst als ausfüllbare Vorlage angelegt: Textstellen in
eckigen Klammern, z. B. `[Name der einsetzenden Organisation]`, markieren
durchgängig die Punkte, die jede Organisation für sich selbst ergänzen oder
bestätigen muss — insbesondere organisatorische Zuständigkeiten, den konkreten
Geräte-/Rollout-Kontext und die endgültige Schutzbedarfsfeststellung.

Struktur und Terminologie orientieren sich an BSI-Standard 200-2
(IT-Grundschutz-Methodik): Strukturanalyse, Schutzbedarfsfeststellung,
Modellierung anhand einschlägiger Bausteine des IT-Grundschutz-Kompendiums,
IT-Grundschutz-Check (Ist-Soll-Vergleich) und ergänzende Risikoanalyse für
Zielobjekte mit erhöhtem Schutzbedarf. Es handelt sich **nicht** um ein
vollständiges, auditfähiges IT-Grundschutz-Profil — dafür fehlen unter anderem
die physische und organisatorische Umgebung jeder einzelnen einsetzenden
Organisation, die aus dem Quellcode allein nicht ableitbar ist.

## 1. Zusammenfassung

Der digitale Einheiten-Erfassungsbogen ist eine Offline-first
Web-/Desktop-/Mobil-Anwendung für BOS-Einheiten (Behörden und Organisationen mit
Sicherheitsaufgaben), die Stärke-, Fahrzeug- und Bedarfsmeldungen im Einsatz- und
Übungsfall erfasst, zusammenführt und weitergibt. Die Architektur ist bewusst
serverlos: Es gibt keine zentrale Infrastruktur, jede Installation ist
eigenständig, und Daten wandern ausschließlich über einen physisch/lokal
begrenzten Kanal (QR-Code-Scan, Datei-Export/-Import, Nahfeld-Freigabe) zwischen
zwei Geräten.

Diese Architektur eliminiert eine ganze Klasse klassischer IT-Sicherheitsrisiken
(kein Server, der kompromittiert werden kann; keine Netzwerk-Angriffsfläche
zwischen den Geräten; keine zentrale Datenbank mit Massenzugriff). Sie
verschiebt die Verantwortung für Vertraulichkeit und Verfügbarkeit jedoch fast
vollständig auf das einzelne Endgerät und dessen Absicherung durch
Betriebssystem, Gerätesperre und die einsetzende Organisation.

Die technische Analyse des Quellcodes zeigt eine überdurchschnittlich sorgfältige
Sicherheitsgrundhaltung: kontextisolierter Electron-Prozess ohne Node-Zugriff im
Renderer, eine restriktive Content-Security-Policy, eine bewusst minimale
Rechtevergabe (nur Kamera und Zwischenablage), eine dokumentierte kryptografische
Signaturkette zur Herkunftsprüfung sowie Schutzmaßnahmen gegen
CSV-Formel-Injection beim Excel-Export. Gleichzeitig bestehen einige konkrete,
benennbare Schwachstellen bzw. Verbesserungspotenziale (unter anderem eine nicht
größenbegrenzte Dekomprimierung beim Import, ein unverschlüsselt abgelegter
privater Signaturschlüssel und eine CSP mit `unsafe-inline`), die in Abschnitt 6
und 8 mit konkreten Maßnahmen hinterlegt sind.

> *Prüfvermerk:* Mit `c7604e9` sind davon zwei erledigt — die Dekomprimierung ist
> auf 4 MiB gedeckelt (`inflateRawBegrenzt`), und `script-src` kommt ohne
> `'unsafe-inline'` aus (Hash-Freigabe der drei Inline-Blöcke). Offen bleibt der
> unverschlüsselt abgelegte private Signaturschlüssel (6.3/R3/M3).
>
> *Nachtrag:* Der private Schlüssel liegt weiterhin unverschlüsselt, der
> Wiederherstellungsweg dazu ist aber jetzt in der App selbst vorhanden:
> „Geräteschlüssel neu erzeugen" in der Fußzeile tauscht das Schlüsselpaar nach
> einer Rückfrage aus (M3). Ebenfalls neu: `SECURITY.md` beschreibt den
> Meldeweg für Schwachstellen im Hauptrepository und den vier Submodulen
> (6.4).

**Gesamteinschätzung dieses Entwurfs:** Unter der Voraussetzung, dass die in
Abschnitt 8 aufgeführten organisatorischen Maßnahmen (insbesondere
Geräteabsicherung und Sensibilisierung) durch die einsetzende Organisation
umgesetzt werden, ist von einem für den Einsatzzweck angemessenen, überwiegend
soliden Sicherheitsniveau auszugehen. Eine abschließende Bewertung obliegt
der/dem IT-Sicherheitsbeauftragten der jeweiligen Organisation.

## 2. Rahmendaten

| Feld | Angabe |
| --- | --- |
| Bezeichnung des Informationsverbunds | Digitaler Einheiten-Erfassungsbogen (App „Erfassungsbogen") |
| Verantwortlich für IT-Sicherheit | `[Name der einsetzenden Organisation, z. B. „THW-Ortsverband …", „Freiwillige Feuerwehr …"]` |
| IT-Sicherheitsbeauftragte/r | `[Name, Kontakt]` |
| Vertreten durch | `[Name, Funktion]` |
| Ersteller dieses Entwurfs | KI-gestützte Analyse des öffentlichen Quellcodes (Claude), auf Anforderung von `[Name]` |
| Grundlage | Repository `wattnpapa/erfassungsbogen`, Checkout-Stand 2026-09-11/12, `main`, inkl. Submodule `@bos/eeb-format`, `@bos/meldekopf`, `@bos/vokabulare`, `@bos/taktische-zeichen` |
| Geltungsbereich dieses Dokuments | Die Anwendung „Erfassungsbogen" selbst (Client-Software) sowie ihre Build-, Auslieferungs- und Update-Kette. **Nicht enthalten:** die physische und organisatorische IT-Sicherheit der einsetzenden Organisation (Gebäude, Netzwerk, sonstige Fachverfahren) |
| Version dieses Dokuments | 0.1 (Entwurf) |
| Datum der Freigabe | `[Datum der Freigabe einfügen]` |
| Nächste Überprüfung | `[Datum, spätestens bei Versions-Update mit sicherheitsrelevanten Änderungen oder nach 12 Monaten]` |
| Anlass | Ersteinführung der App bei `[Organisation]` / Regelmäßige Überprüfung |

## 3. Strukturanalyse

### 3.1 Überblick über den Informationsverbund

Die Anwendung besteht ausschließlich aus Client-Software, die auf den Endgeräten
der Einsatzkräfte läuft. Es existiert kein Anwendungsserver, keine zentrale
Datenbank und keine Benutzerverwaltung.

### 3.2 Zielobjekte: Anwendungen und Plattformen

| # | Zielobjekt | Beschreibung | Plattform(en) |
| --- | --- | --- | --- |
| A1 | Web-App / PWA | Hauptauslieferungsform unter erfassungsbogen.app; als Progressive Web App vollständig offlinefähig (Service Worker precacht alle Bausteine) | Browser (Desktop/Mobil) |
| A2 | Desktop-App | Electron-Wrapper um dieselbe Web-App, für Windows, macOS und Linux; Auslieferung über GitHub Releases mit Auto-Update | Windows, macOS, Linux |
| A3 | Android-App | Capacitor-Wrapper um dieselbe Web-App | Android |
| A4 | iOS-App | Capacitor-Wrapper, laut Quellcode/Dokumentation in Vorbereitung, zum Analysezeitpunkt noch nicht produktiv | iOS (geplant) |

> *Prüfvermerk zu A2:* Der macOS-Build ist in `release.yml` per `if: false`
> stillgelegt (Kommentar vom 2026-09-05, Code-Signatur scheitert auf dem
> GitHub-Runner). Für macOS gibt es damit derzeit **kein** ausgeliefertes
> Desktop-Paket; produktiv verteilt werden Windows (x64 und arm64) und Linux
> (.deb/.pacman). Beim Rollout ist das zu berücksichtigen.

Alle vier Auslieferungsformen teilen sich denselben Anwendungscode (`dist/` aus
dem Vite-Build); es gibt keine serverseitige Variante.

### 3.3 Zielobjekte: Daten

| # | Zielobjekt | Beschreibung | Speicherort |
| --- | --- | --- | --- |
| D1 | Erfassungsbogen-Entwurf | Aktuell bearbeiteter Bogen (Personal, Fahrzeuge, Einsatz, Sofortbedarf) | `localStorage` des Geräts |
| D2 | Gesicherte/archivierte Bögen | Übergebene bzw. empfangene Bögen inkl. Papierkorb (vor endgültiger Löschung) | `localStorage` des Geräts |
| D3 | Absenderkarte | Freiwillige Kontaktangabe (Name/E-Mail/Telefon) der meldenden Person | `localStorage` des Geräts |
| D4 | Privater Geräteschlüssel | Ed25519-Schlüssel zur Signatur weitergereichter Bögen | `localStorage` des Geräts, **unverschlüsselt als Hex** |
| D5 | QR-Payload / Exportdatei | Binär kodierter, komprimierter Bogen zur Übergabe an ein zweites Gerät | Transient (QR-Code-Anzeige) bzw. Datei auf dem Gerät |
| D6 | Ausgedruckte/exportierte Kopien | PDF-Ausdruck im Papier-Layout, CSV-/Excel-Export für Führungsstellen | Außerhalb der App (Papier, Dateisystem des Empfängers) |

> *Prüfvermerk zu D4:* Bestätigt — `src/app/geraete-schluessel.ts` legt den
> privaten Schlüssel als Hex-String im `localStorage` ab (Kopfkommentar: „Der
> private Schlüssel liegt als Hex im localStorage").

### 3.4 Zielobjekte: Kommunikationsverbindungen

| # | Zielobjekt | Ziel | Zweck | Absicherung |
| --- | --- | --- | --- | --- |
| K1 | Geräte-zu-Geräte-Übergabe | Kein Netzwerk — QR-Kamera-Scan, USB-Handscanner, Datei-Export/-Import, Nahfeld-Freigabe (AirDrop/Quick Share) | Übergabe eines Bogens zwischen zwei Geräten | Physisch/lokal begrenzter Kanal; optionale Ed25519-Signatur zur Herkunftsprüfung |
| K2 | GoatCounter-Reichweitenmessung | `https://erfassungsbogen.goatcounter.com` | Anonyme Nutzungsstatistik beim App-Start | Cookielos, keine Cross-Device-ID, laut Code-Dokumentation keine Bogen-Inhalte übertragen |
| K3 | GitHub-Releases-Abfrage | github.com bzw. GitHub-Release-Assets | Prüfung auf neue App-Version (nur Desktop-Variante, `electron-updater`) | HTTPS; Signatur-/Zertifikatsprüfung abhängig vom CI-Build (siehe 6.4) |

Es existieren keine weiteren Netzwerkverbindungen der eigentlichen
Bogen-Funktion — dies ist durch die Content-Security-Policy des Builds technisch
erzwungen (siehe 5.3).

### 3.5 Zielobjekte: IT-Systeme (Endgeräte)

Die Endgeräte selbst (Smartphones, Tablets, Notebooks, Desktop-PCs) sind
Zielobjekte im Sinne der Strukturanalyse, liegen aber außerhalb des
Einflussbereichs der Software und sind durch die einsetzende Organisation zu
erfassen und abzusichern (Geräteverwaltung, Bildschirmsperre,
Festplattenverschlüsselung, Betriebssystem-Updates).

### 3.6 Zielobjekte: Build-, Auslieferungs- und Update-Kette

| # | Zielobjekt | Beschreibung |
| --- | --- | --- |
| B1 | Quellcode-Repository | `wattnpapa/erfassungsbogen` samt vier Submodulen (`@bos/*`), öffentlich auf GitHub |
| B2 | CI/CD-Pipeline | GitHub Actions (`ci.yml`: Tests/Typecheck; `release.yml`: Build und Veröffentlichung der Auslieferungspakete; `spiegel-opencode.yml`: einseitiger Quellcode-Spiegel nach Open CoDE, authentifiziert über einen Deploy-Key im CI-Secret `OPENCODE_SSH_KEY` mit Schreibrecht ausschließlich auf dem Spiegel-Repository) |
| B3 | Abhängigkeiten (Software-Lieferkette) | npm-Pakete gemäß `package-lock.json` je Teilprojekt, versioniert und gepinnt |
| B4 | Code-Signing-Material | Zertifikate/Schlüssel für macOS-Notarisierung und Windows-Signierung, als CI-Secrets hinterlegt (bedingt vorhanden, siehe 6.4) |
| B5 | Auto-Update-Kanal | `electron-updater` gegen GitHub Releases (nur Desktop) |

## 4. Schutzbedarfsfeststellung

Bewertung je Grundwert (Vertraulichkeit, Integrität, Verfügbarkeit) nach dem
dreistufigen BSI-Schema *normal – hoch – sehr hoch*. Die Einstufung geht vom
typischen BOS-Einsatzkontext aus; eine endgültige, organisationsspezifische
Einstufung obliegt der einsetzenden Organisation.

| Zielobjekt | Vertraulichkeit | Integrität | Verfügbarkeit | Begründung |
| --- | --- | --- | --- | --- |
| D1/D2 Erfassungsbogen-Daten | Normal | Hoch | Hoch | Enthält Personal-/Kontaktdaten (normaler Schutzbedarf, keine Art.-9-Daten); falsche Stärke-/Bedarfszahlen können zu Fehlentscheidungen der Einsatzleitung führen; die App muss auch ohne Netz/Strom über Stunden funktionieren. |
| D3 Absenderkarte | Normal | Normal | Normal | Freiwillige, Opt-in-Kontaktangabe; überschaubarer Personenkreis. |
| D4 Privater Geräteschlüssel | Hoch | Hoch | Normal | Kompromittierung erlaubt Signieren im Namen des Geräts — kein direkter Zugriff auf fremde Personendaten, aber Verlust der Herkunftsgarantie für alle künftigen Meldungen dieses Geräts. |
| D5 QR-Payload/Exportdatei | Normal | Hoch | Normal | Transportformat; Integrität während der Übergabe ist der eigentliche Zweck der Signatur. |
| D6 Ausgedruckte/exportierte Kopien | Normal | Normal | Normal | Sobald exportiert, strukturell außerhalb der Kontrolle der App. |
| A1–A4 Anwendung selbst | — | Hoch | Hoch | Manipulierte App-Instanzen gefährden die Integrität aller damit erzeugten Meldungen; Ausfall im Einsatzfall kann die Einsatzabwicklung behindern. |
| K1 Geräte-zu-Geräte-Übergabe | Normal | Hoch | Normal | Kernfunktion der App; Integrität der übertragenen Daten ist zentral. |
| B1–B5 Build-/Update-Kette | — | Hoch | Normal | Eine kompromittierte Build- oder Update-Kette könnte manipulierte Software an alle Nutzer verteilen (Supply-Chain-Risiko). |

**Vererbungsprinzip:** Der hohe Integritätsschutzbedarf der
Erfassungsbogen-Daten (D1/D2) vererbt sich auf alle Zielobjekte, die diese Daten
verarbeiten oder übertragen (K1, D5) sowie auf die Anwendung selbst (A1–A4) und
deren Auslieferungskette (B1–B5).

## 5. Modellierung: eingesetzte Sicherheitsmaßnahmen laut Quellcode

### 5.1 Anwendungsarchitektur und Rechtevergabe (Electron-Desktop)

Der Electron-Hauptprozess (`electron/main.js`) ist nach aktuellem Stand der
Technik gehärtet:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — der
  Renderer-Prozess hat keinerlei Zugriff auf Node.js- oder Electron-APIs; es
  existiert kein Preload-Skript, das eine Brücke schlagen könnte.
- **Minimale Rechtevergabe:** Der Permission-Handler erlaubt ausschließlich
  `media` (Kamera für QR-Scan) und Zwischenablage-Zugriff
  (`clipboard-read`, `clipboard-sanitized-write`); alle anderen
  Berechtigungsanfragen werden pauschal abgelehnt.
- **Kontrollierte externe Links:** `setWindowOpenHandler` und `will-navigate`
  fangen jede Navigation zu einer fremden URL ab und öffnen sie im
  System-Standardbrowser statt im App-Fenster.
- `hardenedRuntime: true` für macOS-Builds.

> *Prüfvermerk:* Alle vier Punkte im Code bestätigt (`electron/main.js`,
> `package.json` Feld `build`).

### 5.2 Kryptografische Herkunfts- und Integritätsprüfung

Jeder weitergereichte Bogen kann optional mit dem lokal erzeugten
Ed25519-Schlüsselpaar des Geräts signiert werden
(`vendor/eeb-format/src/signatur.ts`, `src/app/geraete-schluessel.ts`). Das
Modell ist bewusst Trust-on-First-Use (TOFU), kein PKI-Aufbau: Die Signatur
bestätigt, dass ein weitergereichter Bogen unverändert vom Inhaber eines
bestimmten, lokal erzeugten Schlüssels stammt — nicht die reale Identität einer
Person. Mehrstufige Weitergaben werden als Signaturkette (`EEB2C`-Container,
begrenzt auf `MAX_STUFEN = 32`) abgebildet.

### 5.3 Content-Security-Policy

Der Produktions-Build setzt eine restriktive CSP als `<meta>`-Header
(`vite.config.ts`):

```
default-src 'self' file:; base-uri 'none'; object-src 'none'; form-action 'none';
script-src 'self' file: 'sha256-…' 'sha256-…' 'sha256-…';
style-src 'self' file: 'unsafe-inline';
img-src 'self' file: data: blob: https://erfassungsbogen.goatcounter.com;
font-src 'self' file: data:; frame-src 'self' file: blob:;
connect-src 'self' file: https://erfassungsbogen.goatcounter.com
```

Positiv hervorzuheben: `object-src 'none'`, `base-uri 'none'` und
`form-action 'none'` unterbinden ganze Klassen von Angriffen;
`connect-src`/`img-src` sind auf genau einen fremden Host begrenzt — jede
Datenausleitung an eine andere Herkunft ist technisch unterbunden.

> *Prüfvermerk (Stand `c7604e9`):* `script-src` kommt **ohne** `'unsafe-inline'`
> aus — die drei Inline-`<script>`-Blöcke der `index.html` werden beim Bauen
> gehasht und einzeln per `sha256-…` freigegeben; ein nachträglich eingehängtes
> Skript wird damit blockiert. `style-src` behält `'unsafe-inline'` bewusst, weil
> React `style`-Attribute an Elementen setzt. Die ursprüngliche
> Entwurfsfassung dieses Dokuments beschrieb noch die alte Policy mit
> `'unsafe-inline'` auch bei `script-src`.

### 5.4 Schutz bei Datenexport

- **CSV-Export** (`src/app/csv.ts`): Werte, die mit `=` `+` `-` `@` oder
  Tab/CR beginnen, werden mit einem führenden `'` versehen — eine dokumentierte,
  korrekt umgesetzte Abwehr gegen CSV-Formel-Injection.
- **XLSX-Export** (`src/app/xlsx.ts`): korrektes XML-Escaping der Zellinhalte.

> *Prüfvermerk:* Beides im Code bestätigt (`FORMEL_START = /^[=+\-@\t\r]/`;
> `&`/`<`-Escaping im XLSX-Writer).

### 5.5 Datensparsamkeit und Löschung

- **Papierkorb-Funktion** (`src/app/sicherung.ts`, `src/app/vorlagen.ts`,
  `@bos/meldekopf/papierkorb`): gelöschte Einträge lassen sich vor endgültiger
  Löschung wiederherstellen.
- **Schema-Migration** (`src/app/hilfen.ts`): verhindert, dass ältere Datensätze
  mit veralteten Feldbedeutungen fehlinterpretiert werden.
- **Absenderkarte vollständig optional** (Opt-in), ohne Eingabe als „keine
  Karte" kodiert.

### 5.6 Update-Mechanismus

`electron-updater` prüft bei jedem Start der Desktop-Variante gegen die neuesten
GitHub Releases, lädt Updates im Hintergrund und bietet einen Neustart an;
Fehler (kein Netz, kein Release, unsignierter Build) werden bewusst still
ignoriert, um den für Offline-Betrieb ausgelegten Programmstart nicht zu
blockieren.

## 6. IT-Grundschutz-Check (Ist-Soll-Vergleich)

Auswahl der einschlägigen Bausteine, soweit aus dem Quellcode heraus bewertbar.
Kein vollständiges Audit — Bausteine mit organisatorischem Schwerpunkt (z. B.
ORP.1 Organisation, INF.1 Gebäude) sind nicht Gegenstand dieses Dokuments.

### 6.1 APP.1.4 Mobile Anwendungen (Client) / APP.1.1 Client-Anwendungen allgemein

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Minimale Rechtevergabe der Anwendung | Erfüllt | `electron/main.js`: nur `media`, `clipboard-*` erlaubt |
| Sichere Speicherung sensibler Daten auf dem Endgerät | Teilweise erfüllt | Fachdaten in `localStorage`; privater Signaturschlüssel dort unverschlüsselt (siehe 6.3) |
| Deaktivierung nicht benötigter Schnittstellen | Erfüllt | CSP unterbindet jede Netzverbindung außer den zwei dokumentierten Zielen |
| Sichere Update-Mechanismen | Teilweise erfüllt | Vorhanden (`electron-updater`), Signierung/Notarisierung aber bedingt auf CI-Secrets (siehe 6.4) |

### 6.2 SYS.2.1 Allgemeiner Client / CON.10 Entwicklung von Webanwendungen

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Content-Security-Policy zur Reduktion der Angriffsfläche | Erfüllt (Skript) / bewusster Rest (Style) | `script-src` ohne `'unsafe-inline'`, Inline-Blöcke per `sha256`-Hash freigegeben; `style-src` behält `'unsafe-inline'` wegen der `style`-Attribute von React (siehe 5.3) |
| Eingabevalidierung / Schutz vor Injection | Erfüllt (für die geprüften Exportpfade) | CSV-Formel-Injection-Schutz, korrektes XLSX-Escaping |
| Robustheit gegenüber fehlerhaften/böswilligen Eingabedaten | Erfüllt | Dekomprimierung importierter QR-/Dateidaten läuft über `inflateRawBegrenzt` (`src/app/hilfen.ts`) mit Obergrenze `MAX_ENTPACKT = 4 MiB`, streamend geprüft — bricht ab, bevor der Speicher volläuft |
| Kontextisolation bei hybriden Apps (Electron/Capacitor) | Erfüllt | `contextIsolation`, `sandbox`, kein Preload |

> *Prüfvermerk (Stand `c7604e9`):* Der `browserKompressor` in
> `src/app/hilfen.ts` reicht `inflateRawBegrenzt` in den Codec hinein; die
> Streaming-Fassung prüft die entpackte Größe stückweise (pako meldet in
> 16-KiB-Blöcken) und wirft bei Überschreitung einen `RangeError`. Die
> ursprüngliche Bewertung „Offen" ist damit überholt. Der Codec selbst
> (`vendor/eeb-format/src/codec.ts`) bleibt unverändert — die Grenze sitzt beim
> hineingereichten Kompressor, nicht im Kern.

### 6.3 CON.8 Software-Entwicklung / Kryptokonzept

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Dokumentiertes Schlüsselkonzept | Erfüllt | Trust-Modell in `docs/datenmodell.md` explizit beschrieben |
| Schutz privater Schlüssel gegen unbefugten Zugriff | Nicht erfüllt | Privater Ed25519-Schlüssel liegt als Klartext-Hex im `localStorage` — jede Anwendung/jeder Prozess mit Zugriff auf den Browser-/App-Speicher des Geräts kann ihn auslesen |
| Sichere kryptografische Verfahren | Erfüllt | Ed25519 ist ein etabliertes, als sicher geltendes Verfahren |
| Schlüsselwechsel bei Kompromittierungsverdacht möglich | Erfüllt | „Geräteschlüssel neu erzeugen" in der Fußzeile (`fusszeile.tsx` → `geraeteSchluesselLoeschen()`/`geraeteSchluesselSicherstellen()` in `src/app/geraete-schluessel.ts`): Rückfrage, dann neues Schlüsselpaar samt Anzeige der neuen Kurzform. Kein Widerruf des alten Schlüssels — Empfänger müssen die Kurzform neu abgleichen (TOFU-Modell, keine PKI) |

### 6.4 OPS.1.1.6 Software-Tests und Freigaben / Software-Lieferkette

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Automatisierte Tests vor Veröffentlichung | Erfüllt | GitHub-Actions-Workflow `ci.yml` (Unit-Tests via Vitest, E2E via Cucumber, Typecheck) |
| Signierte/verifizierbare Auslieferungspakete | Teilweise erfüllt | macOS-Notarisierung und Code-Signing sind in `release.yml` vorgesehen, greifen aber nur, wenn die entsprechenden CI-Secrets hinterlegt sind; ohne diese entsteht laut Workflow-Kommentar bewusst ein unsignierter Build. **Ergänzung:** der macOS-Job ist derzeit ganz stillgelegt (`if: false`) |
| Versionierte, nachvollziehbare Abhängigkeiten | Erfüllt | `package-lock.json` je Teilprojekt/Submodul, Versionen gepinnt |
| Regelmäßige Prüfung auf bekannte Schwachstellen in Abhängigkeiten (SCA) | Erfüllt | `.github/dependabot.yml` (wöchentlich, npm + GitHub-Actions), `npm audit --omit=dev --audit-level=high` als blockierender CI-Schritt, `npm audit` über das Bau-/Testwerkzeug als Hinweis |
| Stückliste der ausgelieferten Software (SBOM) | Erfüllt | `npm run sbom` (`scripts/sbom.ts`) erzeugt CycloneDX 1.6 aus den fünf `package-lock.json`; im CI als Artefakt, im Release als Asset |
| Dokumentierter Meldeweg für Schwachstellen | Erfüllt | `SECURITY.md` im Hauptrepository: Geltungsbereich (Hauptrepo + die vier `vendor/`-Submodule), Private Vulnerability Reporting auf GitHub bzw. E-Mail, angestrebte Fristen (7 Tage Eingangsbestätigung, 30 Tage Einschätzung, Veröffentlichung nach Fix bzw. spätestens nach 90 Tagen) |

> *Prüfvermerk zu SCA (Stand `c7604e9`):* Die ursprüngliche Bewertung „Offen"
> ist überholt. Dependabot läuft wöchentlich montags über npm und
> GitHub-Actions, `@bos/*` ist ausgenommen (Submodule über `file:`); `npm audit`
> blockiert ab „hoch" über die Laufzeit-Abhängigkeiten und protokolliert das
> Bau-/Testwerkzeug ohne Blockade.

## 7. Ergänzende Risikoanalyse (BSI-Standard 200-3, Auswahl)

| # | Gefährdung | Betroffenes Zielobjekt | Eintrittswahrscheinlichkeit | Schadenshöhe | Gesamt |
| --- | --- | --- | --- | --- | --- |
| R1 | Verlust/Diebstahl eines Geräts mit ungesperrtem Zugriff | D1–D4 (alle lokalen Daten) | Mittel (Einsatzgeräte werden im Feld mitgeführt) | Hoch (Zugriff auf alle lokal gespeicherten Bögen, Absenderkarte, Signaturschlüssel) | **Hoch** |
| R2 | ~~Dekomprimierungs-Angriff über präparierte Importdatei (`inflateRaw` ohne Größenlimit)~~ **behoben mit `c7604e9`** (Deckel 4 MiB) | A1–A4 (Anwendungsverfügbarkeit) | Niedrig-Mittel | Mittel (Speicherüberlastung/Absturz; kein Datenabfluss) | ~~Mittel~~ → Sehr niedrig |
| R3 | Diebstahl/Auslesen des unverschlüsselten privaten Signaturschlüssels | D4, K1 (Vertrauenskette) | Niedrig (setzt Gerätezugriff oder weitere Schwachstelle voraus) | Mittel (Signieren im Namen des Geräts möglich) — durch den Austausch des Schlüssels (M3) auf die Zeit bis zum Bemerken und den Abgleich der neuen Kurzform begrenzbar | Niedrig-Mittel |
| R4 | Cross-Site-Scripting trotz CSP — ~~über `'unsafe-inline'` bei `script-src`~~ **mit `c7604e9` auf Hash-Freigabe umgestellt**; Restrisiko nur noch über `style-src 'unsafe-inline'` | A1 (Web-App) | Niedrig (CSP schränkt Auswirkungen stark ein) | Mittel (potenziell Zugriff auf `localStorage`-Inhalte des Tabs) | ~~Niedrig-Mittel~~ → Niedrig |
| R5 | Kompromittierte oder manipulierte Build-/Update-Kette | B1–B5, A2 (Desktop) | Niedrig | Hoch (Verteilung manipulierter Software an alle Nutzer der Plattform) | Mittel-Hoch |
| R6 | Fehlende Signaturprüfung durch den Empfänger (Signatur ist optional) | K1, D1/D2 (Integrität) | Mittel (Prüfung könnte im Alltag vernachlässigt werden) | Mittel (unbemerkt verfälschte Meldung erreicht die Führung) | Mittel |
| R7 | Ausfall der Anwendung im Einsatzfall (Gerätedefekt, Akku, Absturz) | A1–A4 (Verfügbarkeit) | Mittel (typisches Einsatzrisiko) | Hoch | **Hoch** (durch Papierform als Rückfallebene begrenzt) |
| R8 | ~~Fehlende automatisierte Schwachstellenprüfung der Abhängigkeiten (SCA)~~ **behoben mit `c7604e9`** (Dependabot, `npm audit` im CI, SBOM) | B3 (Software-Lieferkette) | Mittel | Mittel | ~~Mittel~~ → Niedrig |

**Höchste Einzelrisiken:** R1 (Geräteverlust) und R7 (Ausfall im Einsatzfall)
sind primär organisatorisch/physisch bedingt; R5 (Lieferkette) liegt in der
Verantwortung des Projektbetreibers, nicht der einzelnen einsetzenden
Organisation.

## 8. Maßnahmenplan

| # | Bezug | Maßnahme | Art | Verantwortlich | Priorität |
| --- | --- | --- | --- | --- | --- |
| M1 | R1 | Verbindliche Geräte-Bildschirmsperre (PIN/Biometrie) als Dienstanweisung; wo verfügbar, Festplatten-/Profilverschlüsselung (BitLocker/FileVault/Android-Geräteverschlüsselung) aktivieren | Organisatorisch/technisch (Geräte-Ebene) | `[Organisation/IT-Verantwortliche/r]` | Hoch |
| M2 | R2 | **Erledigt (`c7604e9`):** Ausgabegrößenbegrenzung bei der Dekomprimierung ist umgesetzt (`MAX_ENTPACKT = 4 MiB`). Für die Organisation bleibt nur: eine App-Version ab diesem Stand einsetzen | Technisch (umgesetzt) | `[Projektbetreiber/Maintainer]` | erledigt |
| M3 | R3 | Bis zu einer verschlüsselten Ablage des privaten Schlüssels: Geräteabsicherung (M1) als kompensierende Maßnahme; Prozess für Neuerzeugung des Geräteschlüssels bei Kompromittierungsverdacht etablieren. **Technisch bereitgestellt:** der Knopf „Geräteschlüssel neu erzeugen" in der Fußzeile der App verwirft den bisherigen Schlüssel und erzeugt sofort ein neues Paar; die neue Kurzform steht in der Bestätigung. Für die Organisation bleibt: festlegen, wer den Verdacht meldet, wer den Knopf drückt und wie die neue Kurzform den Empfängern (Meldekopf, Führungsstelle) bekannt gemacht wird | Organisatorisch (technische Grundlage vorhanden) | `[Organisation]` | Mittel |
| M4 | R4 | **Weitgehend erledigt (`c7604e9`):** `script-src` ist auf Hash-Freigabe umgestellt. Offen bleibt `style-src 'unsafe-inline'` (bewusster Trade-off wegen React-`style`-Attributen) | Technisch (Software-Weiterentwicklung) | `[Projektbetreiber/Maintainer]` | Niedrig |
| M5 | R5 | Vor Rollout prüfen, dass ausschließlich signierte/notarisierte Pakete eingesetzt werden, sofern verfügbar; bei unsignierten Builds Bezugsquelle (offizielles GitHub-Release) verbindlich vorgeben und Prüfsummen dokumentieren | Organisatorisch | `[Organisation/IT-Verantwortliche/r]` | Hoch |
| M6 | R6 | Dienstanweisung: Empfangene Bögen mit Signatur sind vor Übernahme in die Sammelübersicht auf gültige Signatur zu prüfen, insbesondere bei mehrstufiger Weitergabe | Organisatorisch | `[Organisation/Meldekopf-Verantwortliche/r]` | Mittel |
| M7 | R7 | Papierform als dokumentierte Rückfallebene vorhalten (Blanko-Formulare); Ladezustand der Einsatzgeräte vor Einsatzbeginn prüfen; Zusatzakkus vorhalten | Organisatorisch | `[Organisation/Einsatzleitung]` | Hoch |
| M8 | R8 | Beim Projekt selbst erledigt (`c7604e9`: Dependabot, `npm audit`, SBOM). Für die Organisation bleibt: regelmäßige (mind. halbjährliche) Prüfung neuer App-Versionen auf sicherheitsrelevante Änderungen im Änderungsprotokoll; als Prozess dokumentieren | Organisatorisch | `[Organisation]` | Mittel |
| M9 | Alle | Sensibilisierung der Einsatzkräfte: Kurzunterweisung zu Gerätesperre, Umgang mit exportierten Ausdrucken/Dateien (D6) und Meldung bei Geräteverlust | Organisatorisch/personell | `[Organisation/Ausbildungsverantwortliche/r]` | Hoch |
| M10 | — | Diesen Entwurf durch die/den IT-Sicherheitsbeauftragte/n prüfen und freigeben lassen, insbesondere die Schutzbedarfsfeststellung (Abschnitt 4) | Organisatorisch | `[IT-Sicherheitsbeauftragte/r]` | Hoch |

## 9. Restrisikobetrachtung

Unter der Voraussetzung, dass die organisatorischen Maßnahmen M1, M5, M7 und M9
umgesetzt werden, verbleibt nach Einschätzung dieses Entwurfs ein **mittleres bis
geringes Restrisiko**. Die verbleibenden technischen Schwachstellen (R2
Dekomprimierung, R3 Schlüsselspeicherung, R4 CSP) liegen überwiegend im
Verantwortungsbereich der Software-Weiterentwicklung und sind durch die
einsetzende Organisation nicht direkt behebbar.

Diese Einschätzung ersetzt keine rechtliche oder technische Prüfung.

## 10. Fortschreibung

Dieses Konzept ist zu überprüfen und fortzuschreiben:

- bei jeder App-Version mit sicherheitsrelevanten Änderungen (z. B. Änderungen an
  CSP, Schlüsselverwaltung, Update-Mechanismus),
- bei wesentlichen Änderungen des Einsatzkontexts oder Geräteumfangs der
  einsetzenden Organisation,
- mindestens jedoch einmal jährlich.

## 11. Ergebnis und Freigabe

| Rolle | Name | Datum | Unterschrift |
| --- | --- | --- | --- |
| IT-Sicherheitsbeauftragte/r | `[Name]` | | |
| Verantwortlich/Leitung | `[Name]` | | |
| Ersteller/in dieses Entwurfs | KI-gestützte Analyse (Claude), fachlich zu verantworten durch `[Name]` | 2026-09-12 | |

## Anhang: Herangezogene Quellen

Dieses Sicherheitskonzept stützt sich ausschließlich auf öffentlich einsehbaren
Quellcode und dessen Code-Kommentare/Dokumentation:

- `electron/main.js` — Electron-Sicherheitskonfiguration (Sandbox, Rechtevergabe, externe Navigation)
- `vite.config.ts` — Content-Security-Policy des Produktions-Builds
- `vendor/eeb-format/src/signatur.ts`, `src/app/geraete-schluessel.ts` — Schlüsselerzeugung, Signatur, Speicherung
- `vendor/eeb-format/src/codec.ts` — QR-/Datei-Payload-Format, Kompression/Dekompression
- `src/app/csv.ts`, `src/app/xlsx.ts` — Exportformate und deren Absicherung
- `src/app/sicherung.ts`, `src/app/vorlagen.ts`, `src/app/hilfen.ts` — Papierkorb-/Löschfunktion, Schema-Migration
- `docs/datenmodell.md` — Datenmodell, Trust-Modell, QR-Payload-Format
- `package.json` (Feld `build`), `.github/workflows/release.yml`, `.github/workflows/ci.yml` — Build-, Signier- und CI/CD-Konfiguration
- `PRODUCT.md`, `docs/entwicklung.md` — Produktkontext und technische Gesamtübersicht
- [Arc42-Architekturdokumentation](arc42-architektur.md) dieses Projekts
