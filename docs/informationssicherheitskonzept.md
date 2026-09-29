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
>
> **Nachgezogen 2026-09-13:** Datenschutzfrist — nach 90 Tagen anonymisiert die
> App die Personaldaten gespeicherter und eingelesener Bögen, Übungen
> ausgenommen (3.3, 5.5; Branch `feat/datenschutzfrist`).
>
> **Nachgezogen 2026-09-23:** „Vorlage teilen" (Issue #26) — eine einzelne
> Vorlage lässt sich als signierter QR-Code/Link oder als unsignierte
> JSON-Datei weitergeben und wieder einlesen (3.3 D5, 5.4).
>
> **Nachgezogen 2026-09-27:** Teilexport „Nur neue Bögen seit dem letzten
> Export" — die App merkt sich je Einsatz-Sammlung, welche Meldungen schon
> exportiert wurden (3.3 D2b, 5.4).
>
> **Nachgezogen 2026-09-28:** Rückholung des Entwurfs (Audit Runde 2, R2-N1,
> R2-E1, R2-K1) — der Entwurf kennzeichnet die Erfassung einer fremden Einheit
> am Meldekopf; sie darf den eigenen Bogen nicht mehr vom Rückholplatz
> verdrängen und wird im Zweifel mit Ansage verworfen. Folgemeldungen erben auf
> jedem Eingangsweg Zug, Auftrag und Eintreffzeit (3.3 D1, D2c).
>
> **Nachgezogen 2026-09-29:** Excel-Liste „Oldenburg" (Audit Runde 2, R2-K2) —
> trägt jetzt Eintreff-/Abrückzeit und den Auftrag/die Notiz der
> Führungsstelle; nicht zählende Einheiten stehen in einem Block außerhalb der
> SUBTOTAL-Summen (5.4).
>
> **Nachgezogen 2026-09-29:** „Entfernen" einer Meldung (Audit Runde 2, R2-D1)
> nimmt die Einheit jetzt mit allen Fassungen aus der Einsatz-Sammlung; bisher
> blieb die ältere Fassung samt Personendaten stehen und zählte wieder. Eine
> einzelne Fassung lässt sich getrennt in der Historie verwerfen (5.5).
>
> **Nachgezogen 2026-09-29:** Stand am Meldekopf auf den Bogenseiten der
> Sammel-PDF (Audit Runde 2, R2-A1) — Eintreff-/Abrückzeit, Zug und
> Auftrag/Notiz stehen zusätzlich über jedem Bogen und neben jedem QR-Code;
> der QR-Code selbst bleibt unverändert (kein Formatwechsel) (5.4).
>
> **Nachgezogen 2026-09-29:** „Sicherung einspielen" (Audit Runde 2, R2-D3)
> prüft die Datei vor der Rückfrage und nennt dort die laufenden Sammlungen des
> Geräts mit Namen und Meldungszahl sowie den Inhalt der Datei; es bietet
> „Vorher Sicherung erstellen…" an und verlangt einen Haken, sobald laufende
> Sammlungen ersetzt würden (5.5).
>
> **Nachgezogen 2026-09-29:** Gedächtnis entfernter Meldungen (Audit Runde 2,
> R2-D4) — die App merkt sich je Sammlung die Kennungen vor Ort entfernter
> Einträge (`eeb.entfernt.v1`) und fragt bei „Einsatz importieren…", bevor sie
> eine davon wieder aufnimmt (3.3 D2e, 5.5).
>
> **Nachgezogen 2026-09-29:** Dauerhafter Speicher und Sicherungs-Erinnerung
> (Audit Runde 2, R2-O6) — die Web-App bittet den Browser um dauerhaften
> Speicher (`navigator.storage.persist`), sobald Sammlungen mit Meldungen oder
> Vorlagen vorliegen, zeigt den Status und die letzte Sicherung in der
> Datensicherung und erinnert in der Fußzeile nach drei Tagen ohne Sicherung
> (3.3 D2f, 5.5).
>
> **Nachgezogen 2026-09-29:** Zwei Fenster, ein Entwurf (Audit Runde 2, R2-O4)
> — ein Fenster überschreibt den Entwurf nicht mehr still, wenn ein anderes
> Fenster ihn inzwischen geändert hat, sondern fragt; Einsatz-Sammlungen
> werden bei Änderungen aus einem anderen Fenster neu eingelesen (3.3 D1).
>
> **Nachgezogen 2026-09-29:** Die Quittung mit „Rückgängig" nach Entfernen und
> Abrücken steht fest im Daumenbereich statt am Seitenanfang (Audit Runde 2,
> R2-H4); Lebensdauer des Rückwegs präzisiert, keine neue Speicherung (5.5).
>
> **Nachgezogen 2026-09-29:** Vermerke der Führungsstelle (Audit Runde 2,
> R2-K6) — Zug, Auftrag/Notiz, Zeitkorrektur und Abrücken werden mit Uhrzeit
> als Zusatzfeld `vermerke` am Eintrag festgehalten (Vorwert eines Auftrags
> steht im Vermerk, also auch dessen Freitext); Herkunft einer Meldung auf
> Karte und in den CSV-Exporten einheitlich benannt (3.3 D2c).
>
> **Nachgezogen 2026-09-29:** Automatische Löschung ruhender Sammlungen (Audit
> Runde 2, R2-D5) — nach der Löschung nennt die Startseite die entfernte
> Sammlung einmal beim Namen (neuer Speicherort `eeb.aufgeraeumt.v1`, ohne
> Personendaten); die Ankündigung ab Tag 60 nennt die tatsächliche Ruhezeit
> (3.3 D2g).
>
> **Nachgezogen 2026-09-29:** Lageblatt/Übergabeblatt (Audit Runde 2, R2-K3) —
> Zug, Bedarf und Lückenzahl je Einheit, Änderungen als „von … auf …",
> Bedarf und Zwischensummen nebeneinander (5.4).
>
> **Nachgezogen 2026-09-29:** Lageblatt zum Weiterführen (Audit Runde 2,
> R2-A3) — Funkrufname und Rückrufnummer je Einheit, freie Zeilen; Zeitpunkt
> des letzten Lageblatts wird gemerkt (3.3 D2h, 5.4).
>
> **Nachgezogen 2026-09-29:** Hinweis „von Hand geändert" neben dem QR-Code
> (Audit Runde 2, R2-A4) — Stiftkorrekturen stecken nicht im Code (5.4).
>
> **Nachgezogen 2026-09-29:** Foto-Einlesen (Audit Runde 2, R2-A2) — liest
> alle QR-Codes eines Bildes und merkt Teile unvollständiger mehrteiliger
> Bögen bis zu einer Stunde im Arbeitsspeicher (nicht im Gerätespeicher) für
> den nächsten Durchgang (5.5).
>
> **Nachgezogen 2026-09-29:** Rückweg bei Aufteilen und Einsatz löschen (Audit
> Runde 2, R2-D6) — „Rückgängig" nach dem Aufteilen entfernt die beiden dabei
> angelegten Einträge und merkt ihre Kennungen in `eeb.entfernt.v1`; „Einsatz
> löschen" quittiert auf der Startseite mit „Rückgängig" aus dem Papierkorb.
> Kein neuer Speicherort (5.5).
>
> **Nachgezogen 2026-09-29:** Übergabevermerk (Audit Runde 2, R2-W5) — nach
> „Einsatz weitergeben / sichern" merkt sich die App Zeitpunkt und Kennungen
> der weitergegebenen Meldungen (neuer Speicherort `eeb.weitergabe-stand.v1`,
> ohne Personendaten) und zeigt ihn in der Einsatzansicht und auf der
> Startseitenkarte (3.3 D2i).
>
> **Nachgezogen 2026-09-29:** Lageblatt und Sammel-PDF (Audit Runde 2, R2-A6)
> — laufende Nummer je Meldung („Nr. 3", aus der Eingangsreihenfolge, wie an
> der Karte), Zeitpunkte einheitlich „TT.MM.JJJJ, hh:mm", Blanko-Vordruck mit
> Stärke-Legende. Keine neuen Daten (5.4).

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
| A1 | Web-App / PWA | Hauptauslieferungsform unter erfassungsbogen.app; als Progressive Web App vollständig offlinefähig (Service Worker precacht alle Bausteine). Zusätzlich aus demselben Build als GitLab Pages auf dem Open-CoDE-Spiegel veröffentlicht (`.gitlab-ci.yml`, Job `pages`) — identischer Code, anderer Host; Installer und Auto-Update laufen unverändert über GitHub | Browser (Desktop/Mobil) |
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
| D1 | Erfassungsbogen-Entwurf | Aktuell bearbeiteter Bogen (Personal, Fahrzeuge, Einsatz, Sofortbedarf); Personaldaten 90 Tage nach der letzten Änderung anonymisiert, außer bei Übungen (5.5). Wird eine Vorlage bearbeitet, trägt der Entwurf zusätzlich deren Kennung (`vorlageId`, keine Personendaten); ist er die Erfassung einer fremden Einheit am Meldekopf, die Marke `fremd` mit der Kennung der Ziel-Sammlung (keine Personendaten). Außerdem der zuletzt offene Schritt (`schritt`) und der Stand der letzten Übergabe (`uebergabe`: Zeitpunkt, Inhaltskennung, Stärke als Zahlen; keine Personendaten, R2-N7/R2-W2). Ein verdrängter oder verworfener Bogen liegt auf einem einzigen Rückholplatz (`eeb.entwurf.ersetzt.v1`), gleiche Frist; eine fremde Erfassung verdrängt dort nie einen eigenen Bogen, sondern wird dann nach Rückfrage verworfen (`src/app/entwurf.ts`). Sind zwei Fenster offen, schreibt ein Fenster nur über den Stand, den es selbst zuletzt geschrieben hat; hat ein anderes Fenster den Entwurf geändert, speichert es nicht und fragt („Stand aus dem anderen Fenster laden" / „Meine Fassung behalten", `src/app/fenster-abgleich.tsx`, `storage`-Ereignis, R2-O4) | `localStorage` des Geräts (`eeb.entwurf.v1`, `eeb.entwurf.ersetzt.v1`) |
| D2 | Gesicherte/archivierte Bögen | Übergebene bzw. empfangene Bögen inkl. Papierkorb (vor endgültiger Löschung); Meldungen der Einsatz-Sammlung unterliegen derselben Datenschutzfrist, Vorlagen nicht (5.5) | `localStorage` des Geräts |
| D2a | Uhrstand der Datenschutzfrist | Zuletzt akzeptierter Zeitpunkt der Geräteuhr, ggf. unbestätigter Sprung; keine Personendaten | `localStorage` des Geräts (`eeb.uhr.v1`) |
| D2b | Export-Stand je Einsatz-Sammlung | Kennungen der Meldungen, die beim letzten Export (Sammel-PDF, CSV, Excel) schon in der Sammlung standen, samt Zeitpunkt — Grundlage für „Nur neue Bögen seit dem letzten Export" (5.4); keine Personendaten, nur zufällige Kennungen | `localStorage` des Geräts (`eeb.export-stand.v1`), wandert mit der Datensicherung mit, fällt mit „Alle Daten löschen" weg |
| D2c | Zusatzfelder je Meldung der Einsatz-Sammlung | Eintreff- und Abrückzeit (`eingetroffenAm`, `abgerueckAm`, Geräteuhr) sowie eine Notiz/Auftrag der Führungsstelle (`notiz`, Freitext — kann Personenbezug enthalten, z. B. „Rückruf Hr. Meyer 15:00"); seit 2026-09-29 zusätzlich `vermerke` (Zeitstempel + Text je Handlung der Führungsstelle: Zug, Auftrag samt Vorwert, Zeitkorrektur, Abrücken; R2-K6). Eine Folgemeldung derselben Einheit erbt Eintreffzeit, Notiz und Zug der Vorgängerin auf jedem Eingangsweg (`meldungAufnehmen`). Reisen mit der Sammlung in Sammel-PDF und Einsatz-Transport mit; unterliegen mit der Meldung dem Papierkorb und der Löschung (`src/app/eintrag-zeiten.ts`) | `localStorage` des Geräts (`eeb.einsaetze.v1`, am Eintrag) |
| D2d | Zuletzt offene Sammlung | Kennung und Zeitpunkt der zuletzt geöffneten Einsatz-Sammlung, 12 Stunden gültig; keine Personendaten | `localStorage` des Geräts (`eeb.letzterEinsatz.v1`) |
| D2e | Entfernte Meldungen je Einsatz-Sammlung | Kennungen der Einträge, die vor Ort über „Entfernen" oder „Fassung verwerfen…" herausgenommen wurden — damit „Einsatz importieren…" sie nicht still zurückholt, sondern nachfragt (`src/app/entfernte-meldungen.ts`, Audit Runde 2, R2-D4); keine Personendaten, nur zufällige Kennungen; „Rückgängig" nimmt sie wieder heraus, Einträge endgültig gelöschter Sammlungen fallen beim nächsten Schreiben weg | `localStorage` des Geräts (`eeb.entfernt.v1`), wandert mit der Datensicherung mit, fällt mit „Alle Daten löschen" weg |
| D2f | Zeitpunkt der letzten Sicherung | Wann auf diesem Gerät zuletzt „Sicherung erstellen…" ausgelöst wurde — Grundlage für die Anzeige in der Datensicherung und die Erinnerung nach drei Tagen (`src/app/sicherung.ts`, Audit Runde 2, R2-O6); keine Personendaten | `localStorage` des Geräts (`eeb.sicherung.zuletzt.v1`), steht in der Sicherung selbst, fällt mit „Alle Daten löschen" weg |
| D2g | Nachricht über automatisch gelöschte Sammlungen (seit 2026-09-29, R2-D5) | Name, Zeitraum (angelegt/zuletzt geändert), Zahl der Einheiten und Meldungen sowie Löschzeitpunkt einer Sammlung, die die Aufräumfrist (90 Tage ohne Änderung) überschritten hat; keine Personendaten, Name der Sammlung als Freitext. Vorgemerkt von einer Hülle um die Ablage (`src/app/aufraeum-hinweis.ts`), bevor der Kern die Sammlung verwirft; bleibt bis „Verstanden" auf der Startseite | `localStorage` des Geräts (`eeb.aufgeraeumt.v1`), fällt mit „Alle Daten löschen" weg |
| D2h | Lageblatt-Stand je Einsatz-Sammlung (seit 2026-09-29, R2-A3) | Zeitpunkt des zuletzt erzeugten Lageblatts und Kennungen der Meldungen darauf — Grundlage für „Lageblatt erstellt … · seitdem n neue Meldungen"; keine Personendaten | `localStorage` des Geräts (`eeb.lageblatt-stand.v1`), fällt mit „Alle Daten löschen" weg |
| D2i | Weitergabe-Stand je Einsatz-Sammlung (seit 2026-09-29, R2-W5) | Zeitpunkt der letzten Weitergabe der ganzen Sammlung („Einsatz weitergeben / sichern") und Kennungen der Meldungen darin — Grundlage des Übergabevermerks „Weitergegeben … · seitdem n neue Meldungen"; keine Personendaten | `localStorage` des Geräts (`eeb.weitergabe-stand.v1`), fällt mit „Alle Daten löschen" weg |
| D3 | Absenderkarte | Freiwillige Kontaktangabe (Name/E-Mail/Telefon) der meldenden Person | `localStorage` des Geräts |
| D4 | Privater Geräteschlüssel | Ed25519-Schlüssel zur Signatur weitergereichter Bögen | `localStorage` des Geräts, **unverschlüsselt als Hex** |
| D5 | QR-Payload / Exportdatei | Binär kodierter, komprimierter Bogen zur Übergabe an ein zweites Gerät; ebenso eine geteilte Vorlage (QR/Link mit Marker `V.`, oder JSON-Datei `eeb-vorlage-*.json`) | Transient (QR-Code-Anzeige) bzw. Datei auf dem Gerät oder in einer vom Nutzer gewählten Ablage (z. B. Cloud-Ordner) |
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

> *Prüfvermerk zum zweiten Web-Host:* Wird die Anwendung über die GitLab-Pages-
> Fassung auf Open CoDE aufgerufen (siehe 3.2/3.6), gelten K1 bis K3
> unverändert — es ist derselbe Build. K2 zählt dabei in denselben
> GoatCounter-Bestand; unterschieden wird nur über den Zählpfad, nicht über den
> Host. Zusätzlich entstehen Abrufmetadaten (u. a. IP-Adresse) beim Betreiber
> der Plattform anstelle von GitHub Pages.

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
| B2 | CI/CD-Pipeline | GitHub Actions (`ci.yml`: Tests/Typecheck; `release.yml`: Build und Veröffentlichung der Auslieferungspakete; `spiegel-opencode.yml`: einseitiger Quellcode-Spiegel nach Open CoDE, authentifiziert über einen Deploy-Key im CI-Secret `OPENCODE_SSH_KEY` mit Schreibrecht ausschließlich auf dem Spiegel-Repository). Auf dem Spiegel selbst läuft GitLab CI (`.gitlab-ci.yml`): Prüfstufe als Nachbildung von `ci.yml` (Typprüfung, Tests, Build, Bundle-Budget, SBOM, `npm audit`, E2E) und darauf aufbauend Job `pages` (nur Standardzweig) mit Build und Veröffentlichung der Webfassung; dazu die Stufe `pakete` mit denselben Paketbauten wie `release.yml` (Linux und Android automatisch, Windows und macOS nur mit eigenem Runner und manuell ausgelöst). Die Pakete bleiben Job-Artefakte; ein GitLab-Release oder Tag entsteht nicht, dieser Teil ist nur auskommentiert vorbereitet. Die Submodule werden per HTTPS aus den öffentlichen GitHub-Repositories gezogen |
| B3 | Abhängigkeiten (Software-Lieferkette) | npm-Pakete gemäß `package-lock.json` je Teilprojekt, versioniert und gepinnt |
| B4 | Code-Signing-Material | Zertifikate/Schlüssel für macOS-Notarisierung und Windows-Signierung, als CI-Secrets hinterlegt (bedingt vorhanden, siehe 6.4). Der Android-Keystore liegt als CI-Secret im GitHub-Repository. Die Paketbauten auf dem Open-CoDE-Spiegel bauen ohne hinterlegtes Material **unsigniert**; sollen sie signieren, ist dasselbe Schlüsselmaterial zusätzlich dort als CI-Variable zu hinterlegen — dann verdoppelt sich der Ort, an dem es liegt, und das ist eine eigene Entscheidung (`.gitlab-ci.yml` nennt die Variablen) |
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

*Nachgezogen 2026-09-29 (Audit Runde 2, R2-W6):* Das in eine PDF eingebettete
Bogen-JSON ist unsigniert. Beim Einlesen einer Einzelbogen-PDF in eine
Sammlung („Bögen einlesen…", `boegenAusDatei`/`siegelAusPdfQr` in
`src/app/app.tsx`) wird deshalb zusätzlich der QR-Code der PDF gelesen. Trägt
er eine Signatur und gehört er zur selben Fassung (Einheitsschlüssel und
`stand` gleich), wird der Bogen **aus dem QR** übernommen, samt Signaturstatus
und Original-Payload für das spätere Gegenzeichnen. Der eingebettete Bogen
bekommt das Siegel nie: nur der Inhalt des QR ist signiert, eine nachträglich
geänderte Einbettung würde sonst als geprüft erscheinen. Passt der QR nicht
oder ist er unlesbar, bleibt es beim eingebetteten Bogen ohne Nachweis.

### 5.3 Content-Security-Policy

Der Produktions-Build setzt eine restriktive CSP als `<meta>`-Header
(`vite.config.ts`):

```
default-src 'self' file:; base-uri 'none'; object-src 'none'; form-action 'none';
script-src 'self' file: 'wasm-unsafe-eval' 'sha256-…' 'sha256-…' 'sha256-…';
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
>
> *Prüfvermerk (Stand 2026-09-27):* `script-src` trägt zusätzlich
> `'wasm-unsafe-eval'`. Die Freigabe erlaubt ausschließlich das Kompilieren von
> WebAssembly-Modulen (kein `eval`, kein Inline-Skript) und ist nötig für den
> QR-Decoder ZXing (`assets/zxing_reader-*.wasm`, aus dem eigenen Bundle):
> ohne sie verweigerte der Browser das Modul, und die App fiel still auf den
> reineren JavaScript-Decoder jsQR zurück. Die Angriffsfläche wächst dadurch
> nicht — geladen werden kann weiterhin nur, was `'self'` liefert.

### 5.4 Schutz bei Datenexport

- **CSV-Export** (`src/app/csv.ts`): Werte, die mit `=` `+` `-` `@` oder
  Tab/CR beginnen, werden mit einem führenden `'` versehen — eine dokumentierte,
  korrekt umgesetzte Abwehr gegen CSV-Formel-Injection.
- **XLSX-Export** (`src/app/xlsx.ts`): korrektes XML-Escaping der Zellinhalte.

> *Prüfvermerk:* Beides im Code bestätigt (`FORMEL_START = /^[=+\-@\t\r]/`;
> `&`/`<`-Escaping im XLSX-Writer).

- **Lageblatt und Übergabeblatt der Einsatz-Sammlung** (`src/app/pdf.ts`,
  `pdf-dokument.ts`, seit 2026-09-27): Das Übergabeblatt (Seite 1 der
  Sammel-PDF „Einsatz weitergeben / sichern") und das einseitige „Lageblatt"
  führen je Einheit Eintreff- und Abrückzeit sowie den Auftrag/die Notiz der
  Führungsstelle (Freitext) — abgerückte Einheiten stehen als eigener Block,
  damit Papier und eingebettete Sammlung denselben Stand zeigen. Dieselben
  drei Spalten stehen in der Übersichts-CSV (`einsatz-csv.ts`), dort mit der
  bestehenden Formel-Abwehr. Die Sammel-PDF entsteht auch ohne anwesende
  Einheiten (Einsatzende). Wohin Ausdruck und Datei gelangen, entscheidet
  weiterhin der Nutzer (DSFA 5.8).
  Seit 2026-09-29 (R2-A1) trägt in der Sammel-PDF zusätzlich jede Bogenseite
  den Kasten „Stand am Meldekopf" (Eintreff-/Abrückzeit, Zug, Auftrag/Notiz) —
  über dem Formular und auf jeder QR-Seite, mit dem Hinweis, dass der QR-Code
  nur den Bogen der Einheit enthält. Die Notiz der Führungsstelle steht damit
  im Ausdruck nicht mehr nur auf Seite 1, sondern bei der Einheit; in den
  QR-Code gelangt sie weiterhin nicht. Wer den Ausdruck nur über die QR-Codes
  wieder einliest, bekommt die Angaben nicht zurück — die App sagt das in der
  Rückmeldung und verweist bei einer Sammel-PDF-Datei auf „Einsatz
  importieren…" (`qr-stapel.ts`, `einsatz-transport.ts: pdfInhaltArt`).
  Seit 2026-09-29 (R2-K3) führen Übergabeblatt und Lageblatt je Einheit
  zusätzlich Zug, Bedarf (Ruhezeit, Unterbringung, Kraftstoff) und die Zahl
  der Lücken der Meldung; Änderungen stehen als „von … auf …" (die
  PDF-Standardschrift kennt den Pfeil nicht). Das Lageblatt heißt jetzt
  „Lageblatt (A4 quer)" und passt bis etwa zwölf Einheiten auf eine Seite.
  Seit 2026-09-29 (R2-A3) trägt das Lageblatt zusätzlich je Einheit
  Funkrufname und Rückrufnummer der Führungskraft (Personenbezug auf dem
  Aushang — Aushangort entsprechend wählen) und freie Zeilen für Nachträge.
  Die ganze Sammel-PDF gibt es nur noch über „Einsatz weitergeben / sichern";
  der Teilexport „nur neue Bögen" heißt `eeb-einsatz-nachtrag-….pdf`.
  Seit 2026-09-29 (R2-A4) steht neben jedem QR-Code eines Bogen-PDF das
  Kästchen „[  ] von Hand geändert" mit dem Stand (DTG), den der Code trägt:
  Eine Stiftkorrektur auf dem Ausdruck steckt nicht im Code, und wer scannt,
  soll das vorher sehen. Die Rückmeldung von „Bögen einlesen…" wiederholt den
  Hinweis (`STIFT_HINWEIS`, `qr-stapel.ts`). Integrität: Papier und Gerät
  können weiterhin auseinanderlaufen; der Hinweis macht es nur sichtbar.
- **Excel-Liste „Oldenburg"** (`src/app/oldenburg-xlsx.ts`, seit 2026-09-29,
  Audit Runde 2, R2-K2): führt dieselben Führungsstellen-Angaben — Eintreffzeit
  in „eingetr. / zugew.", Abrückzeit in „Einsatz-ende", Auftrag/Notiz
  (Freitext) in „Aufträge". Der Freitext steht als `inlineStr` in der Zelle
  und wird von Excel nie als Formel ausgewertet; `&`/`<` escapt der
  XLSX-Writer. Die SUBTOTAL-Summen laufen nur über die in die Lage zählenden
  Einheiten (dieselbe Regel wie App und CSV); abgerückte, aufgegangene und
  Übungsmeldungen stehen gekennzeichnet in einem Block darunter — eine zu
  hohe Stärke in der Liste der nächsten Ebene wäre ein Integritätsfehler.

- **Teilexport „Nur neue Bögen seit dem letzten Export"**
  (`src/app/export-stand.ts`, seit 2026-09-27): Sammel-PDF, beide CSV-Wege und
  die Excel-Liste lassen sich auf die Meldungen beschränken, die beim letzten
  Export dieses Einsatzes noch nicht in der Sammlung standen. Die Sammel-PDF
  bettet dann auch nur diese Meldungen als JSON ein; die Vorfassung einer
  Folgemeldung dient nur dem Diff auf der Seite. Als „übergeben" gilt der
  Stand erst nach gelungenem Export — ein abgebrochenes Share-Sheet der App
  verbucht nichts (`nativ.ts`: `teilen()` meldet den Abbruch). Vorgabe bleibt
  der Gesamtexport; die Wahl wird nicht gespeichert.
- **Vorlage teilen** (`src/app/vorlagen-ui.tsx`, `vorlagen.ts`,
  `vorlageTransportErzeugen` in `hilfen.ts`, seit 2026-09-23): QR-Code und Link
  tragen die Vorlage mit dem Geräteschlüssel signiert, wie beim Bogen. Die
  JSON-Datei (`format: "eeb-vorlage"`) enthält nur Name und Bogen dieser einen
  Vorlage, **keinen** Geräteschlüssel und keine übrigen App-Daten; sie ist
  unsigniert. Beim Einlesen wird das Format und das Bogenschema geprüft
  (`vorlageAusDatei`, `bogenPruefen`); eine Datei aus einer neueren App-Version
  wird abgewiesen. Der Dialog weist vor den Knöpfen darauf hin, dass die
  Vorlage Namen und Erreichbarkeiten enthält. Wohin die Datei gelangt (etwa in
  eine Cloud), entscheidet der Nutzer; die einsetzende Organisation sollte das
  regeln (siehe DSFA 5.8).

### 5.5 Datensparsamkeit und Löschung

- **Datenschutzfrist** (`vendor/eeb-format/src/datenschutzfrist.ts`): 90 Tage
  nach der letzten Änderung eines Bogens entfernt die App Namen, Funktionen,
  Qualifikationen, Fahrerlaubnisse und Erreichbarkeiten dauerhaft. Das gilt
  für eingelesene Bögen (Scan, Link, Datei, Einsatz-Import), für jede Meldung
  der Einsatz-Sammlung und für den Entwurf. Bei den Meldungen fallen auch der
  Rohpayload und der Signaturnachweis weg. Übungsbögen und Vorlagen sind
  ausgenommen. Eine Uhr, die mehr als 366 Tage nach vorn springt, wird erst
  übernommen, wenn sie sich einen Tag später bestätigt (`uhrPruefen`,
  `src/app/datenschutz-uhr.ts`). Das schützt vor Datenverlust durch eine
  falsch gehende Uhr. Gegen Absicht schützt die Frist nicht: Der QR-Code bleibt
  unverschlüsselt, und eine zurückgestellte Uhr wird nicht abgefangen.
- **Aufräumfrist ruhender Einsatz-Sammlungen** (`@bos/meldekopf/einsaetze`):
  90 Tage ohne Änderung, dann endgültig gelöscht; Ankündigung ab Tag 60.
- **Papierkorb-Funktion** (`src/app/sicherung.ts`, `src/app/vorlagen.ts`,
  `@bos/meldekopf/papierkorb`): gelöschte Einträge lassen sich vor endgültiger
  Löschung wiederherstellen.
- **Meldung aus einer Einsatz-Sammlung entfernen** (`einheitEntfernen`,
  `src/app/eintrag-zeiten.ts`, seit 2026-09-29): nimmt die Einheit mit
  **allen** Fassungen (Folgemeldungen) samt Zusatzfeldern aus dem Speicher;
  abgeteilte Truppteile mit eigenem Fingerabdruck bleiben. „Rückgängig" (in
  der Quittungsleiste am unteren Bildrand) hält die Einträge nur im
  Arbeitsspeicher der geöffneten Ansicht, bis die Quittung geschlossen, von
  einer neueren ersetzt oder die Ansicht verlassen wird — es gibt keinen
  Papierkorb für einzelne Meldungen. „Fassung
  verwerfen…" in der Historie nimmt gezielt eine einzelne Fassung heraus.
  Die Kennungen der entfernten Einträge bleiben in `eeb.entfernt.v1` (D2e);
  „Einsatz importieren…" fragt, bevor es eine davon wieder aufnimmt, und lässt
  sie ohne Zustimmung draußen (seit 2026-09-29, R2-D4).
- **Sicherung einspielen** (`src/app/sicherung.ts`, `src/app/fusszeile.tsx`):
  ersetzt alle `eeb.*`-Einträge des Geräts ohne Papierkorb — dieselbe Folge
  wie „Alle Daten löschen". Seit 2026-09-29 (R2-D3) wird die Datei vorher
  geprüft (eine kaputte Datei ändert nichts), die Rückfrage nennt die
  laufenden Sammlungen des Geräts und den Inhalt der Datei, bietet „Vorher
  Sicherung erstellen…" an und verlangt einen Haken, sobald laufende
  Sammlungen mit Meldungen betroffen sind.
- **Verfügbarkeit des Gerätespeichers** (`src/app/speicher-browser.ts`,
  `src/app/sicherung.ts`, seit 2026-09-29, R2-O6): Browser dürfen
  Website-Daten bei Platzmangel oder (Safari) nach längerer Nichtnutzung
  räumen. Die Web-App bittet deshalb beim Start um dauerhaften Speicher
  (`navigator.storage.persist`), sobald Sammlungen mit Meldungen oder Vorlagen
  vorliegen, und zeigt in der Datensicherung, ob der Browser zugestimmt hat
  (mit Knopf zum erneuten Anfragen und dem Rat, die App auf iOS auf den
  Home-Bildschirm zu legen). Die native App fragt nicht — dort gehört der
  Speicher der App. Dazu zeigt die Datensicherung die letzte Sicherung, und
  die Fußzeile erinnert, wenn wertvolle Daten seit drei Tagen ungesichert sind.
  Eine Sicherungspflicht erzwingt die App nicht; organisatorisch regeln.
- **Gemerkte Teile beim Foto-Einlesen** (`TeileMerker`, `src/app/qr-stapel.ts`,
  seit 2026-09-29, R2-A2): Teile eines unvollständigen mehrteiligen Bogens
  warten je Einsatz höchstens eine Stunde nach dem letzten neuen Teil im
  Arbeitsspeicher auf den Rest; Neuladen oder „Gemerkte Teile verwerfen"
  löscht sie sofort. Kein `localStorage`.
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
