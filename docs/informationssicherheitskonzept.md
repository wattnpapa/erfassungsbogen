# Informationssicherheitskonzept

**Digitaler Einheiten-Erfassungsbogen — Vorlage/Entwurf**
Grundlage: Repository `wattnpapa/erfassungsbogen`, Stand 2026-11-28 — Version 0.1 (Entwurf)

> Diese Markdown-Fassung ist die gepflegte Fassung (ursprünglich aus
> `ISK-Erfassungsbogen.docx`). Der Text beschreibt den Stand des Repositorys zum
> oben genannten Datum; der Änderungsverlauf steht in der Git-Historie dieser Datei.

## Hinweis zu diesem Dokument

Dies ist eine KI-gestützt erstellte Entwurfsvorlage, keine geprüfte oder
freigegebene Fassung. Grundlage ist eine technische Analyse des öffentlich
einsehbaren Quellcodes des Repositorys `wattnpapa/erfassungsbogen` samt der
eingebundenen Submodule; der Text gibt den Checkout-Stand wieder, der im Kopf und
in den Rahmendaten genannt ist. Das Dokument ersetzt weder die Bestellung und
Mitwirkung einer/eines IT-Sicherheitsbeauftragten noch eine formale Freigabe
durch die Leitung der einsetzenden Organisation.

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
Sicherheitsaufgaben), mit der eine Einheit ihre Stärke-, Fahrzeug- und
Bedarfsmeldung im Einsatz- und Übungsfall erfasst und weitergibt. Die Architektur
ist bewusst serverlos: Es gibt keine zentrale Infrastruktur, jede Installation ist
eigenständig, und Daten wandern ausschließlich über einen physisch/lokal
begrenzten Kanal (QR-Code-Scan, Link, Datei-Export/-Import, Nahfeld-Freigabe)
zwischen zwei Geräten.

Das Sammeln und Auswerten eingehender Bögen am Meldekopf (Einsatz-Sammlung,
Lagemonitor, Sammel-PDF, Lageblatt) gehört nicht zu dieser App, sondern zur
eigenständigen Meldekopf-App (Repository `wattnpapa/meldekopf`,
`meldekopf.erfassungsbogen.app`), die ein eigenes Sicherheitskonzept führt. Der
Erfassungsbogen verweist dorthin und kann einen Bogen als Link an sie
weitergeben; Sammlungen, die eine frühere App-Fassung auf einem Gerät abgelegt
hat, behandelt er als Altbestand (siehe 3.3).

Diese Architektur eliminiert eine ganze Klasse klassischer IT-Sicherheitsrisiken
(kein Server, der kompromittiert werden kann; keine Netzwerk-Angriffsfläche
zwischen den Geräten; keine zentrale Datenbank mit Massenzugriff). Sie
verschiebt die Verantwortung für Vertraulichkeit und Verfügbarkeit jedoch fast
vollständig auf das einzelne Endgerät und dessen Absicherung durch
Betriebssystem, Gerätesperre und die einsetzende Organisation.

Die technische Analyse des Quellcodes zeigt eine überdurchschnittlich sorgfältige
Sicherheitsgrundhaltung: kontextisolierter Electron-Prozess ohne Node-Zugriff im
Renderer, eine restriktive Content-Security-Policy mit Hash-Freigabe der
Inline-Skripte, eine bewusst minimale Rechtevergabe (nur Kamera und
Zwischenablage), eine dokumentierte kryptografische Signaturkette zur
Herkunftsprüfung, größenbegrenzte Dekomprimierung an allen Eingängen,
Schutz gegen CSV-Formel-Injection, automatische Löschfristen für Personaldaten
sowie eine Lieferkette mit Stückliste (SBOM), Schwachstellenprüfung der
Abhängigkeiten und dokumentiertem Meldeweg (`SECURITY.md`).

Als benennbare Schwachstelle bleibt der unverschlüsselt im `localStorage`
abgelegte private Signaturschlüssel (6.3, R3, M3); die App bietet dafür den
Austausch des Schlüsselpaars an („Geräteschlüssel neu erzeugen"). Die
Desktop-Pakete für Windows und Linux sind nicht code-signiert, ein macOS-Paket
wird nicht ausgeliefert (3.2, 6.4, R5, M5).

**Gesamteinschätzung dieses Entwurfs:** Unter der Voraussetzung, dass die in
Abschnitt 8 aufgeführten organisatorischen Maßnahmen (insbesondere
Geräteabsicherung, Datensicherung und Sensibilisierung) durch die einsetzende
Organisation umgesetzt werden, ist von einem für den Einsatzzweck angemessenen,
überwiegend soliden Sicherheitsniveau auszugehen. Eine abschließende Bewertung
obliegt der/dem IT-Sicherheitsbeauftragten der jeweiligen Organisation.

## 2. Rahmendaten

| Feld | Angabe |
| --- | --- |
| Bezeichnung des Informationsverbunds | Digitaler Einheiten-Erfassungsbogen (App „Erfassungsbogen") |
| Verantwortlich für IT-Sicherheit | `[Name der einsetzenden Organisation, z. B. „THW-Ortsverband …", „Freiwillige Feuerwehr …"]` |
| IT-Sicherheitsbeauftragte/r | `[Name, Kontakt]` |
| Vertreten durch | `[Name, Funktion]` |
| Ersteller dieses Entwurfs | KI-gestützte Analyse des öffentlichen Quellcodes (Claude), auf Anforderung von `[Name]` |
| Grundlage | Repository `wattnpapa/erfassungsbogen`, Checkout-Stand 2026-11-28, `main`, inkl. Submodule `@bos/eeb-format`, `@bos/meldekopf`, `@bos/vokabulare`, `@bos/taktische-zeichen` |
| Geltungsbereich dieses Dokuments | Die Anwendung „Erfassungsbogen" selbst (Client-Software) sowie ihre Build-, Auslieferungs- und Update-Kette. **Nicht enthalten:** die Meldekopf-App (eigenes Konzept) sowie die physische und organisatorische IT-Sicherheit der einsetzenden Organisation (Gebäude, Netzwerk, sonstige Fachverfahren) |
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
| A1 | Web-App / PWA | Hauptauslieferungsform unter erfassungsbogen.app (GitHub Pages); als Progressive Web App offlinefähig: Der Service Worker precacht den Kern (Bogen, PDF, QR, Empfang) und ist danach aktiv, Übungsbögen, Themenseiten und deren Fotos lädt die Seite als zweite Stufe in einen Laufzeit-Cache nach (6.1). Zusätzlich aus demselben Build als GitLab Pages auf dem Open-CoDE-Spiegel veröffentlicht (`.gitlab-ci.yml`, Job `pages`) — identischer Code, anderer Host; Installer und Auto-Update laufen über GitHub | Browser (Desktop/Mobil) |
| A2 | Desktop-App | Electron-Wrapper um dieselbe Web-App; Auslieferung über GitHub Releases mit Auto-Update. Ausgeliefert werden Windows (NSIS-Installer für x64 und ARM64) und Linux (`.deb`, `.pacman`). Der macOS-Job in `release.yml` ist stillgelegt (`if: false`, die Code-Signatur scheitert auf dem GitHub-Runner): Für macOS gibt es kein ausgeliefertes Desktop-Paket | Windows, Linux (macOS vorbereitet, nicht ausgeliefert) |
| A3 | Android-App | Capacitor-Wrapper um dieselbe Web-App; signierte APK als Release-Asset (Sideload, kein Store), mit eigener Update-Prüfung gegen GitHub Releases (5.6) | Android |
| A4 | iOS-App | Capacitor-Wrapper, laut Quellcode/Dokumentation in Vorbereitung; `release.yml` baut kein iOS-Paket | iOS (geplant) |

Alle Auslieferungsformen teilen sich denselben Anwendungscode (`dist/` aus dem
Vite-Build); es gibt keine serverseitige Variante. Beim Rollout ist zu
berücksichtigen, dass für macOS kein Paket bereitsteht.

### 3.3 Zielobjekte: Daten

Alle Fachdaten liegen im Web-Speicher des Geräts. Die App legt ihre Einträge im
`localStorage` unter dem Präfix `eeb.` ab; die Datensicherung („Sicherung
erstellen…") und „Alle Daten löschen" arbeiten über dieses Präfix und meinen
damit dieselbe Menge. Ausnahmen davon sind in der Tabelle genannt.

| # | Zielobjekt | Beschreibung | Speicherort |
| --- | --- | --- | --- |
| D1 | Erfassungsbogen-Entwurf und Rückholplatz | Aktuell bearbeiteter Bogen (Einheit, Personal, Fahrzeuge, Einsatz, Sofortbedarf). Zusatzangaben ohne Personendaten: Kennung einer bearbeiteten Vorlage (`vorlageId`), zuletzt offener Schritt (`schritt`), Stand der letzten Übergabe (`uebergabe`: Zeitpunkt, Inhaltskennung, Stärke als Zahlen, Weg — QR gezeigt, PDF erzeugt, Link, Nahbereich — und ob der Empfang bestätigt wurde) sowie die Marke `fremd` aus der früheren Meldekopf-Erfassung. Ein verdrängter oder verworfener Bogen liegt auf einem einzigen Rückholplatz; als Stand trägt er die letzte Bearbeitung des Bogens. Ein eingehender Bogen (Link, Scan, Datei) verdrängt den angefangenen Bogen erst nach einer Rückfrage, die auch nennt, welcher Bogen dabei vom Rückholplatz fällt; eine Datei wird vor der Rückfrage gelesen, eine unbrauchbare Datei verdrängt nichts; ein eingehender Bogen, der dem offenen gleicht, ersetzt nichts. Die unveränderte Bearbeitung einer Vorlage kommt nicht auf den Rückholplatz. Sind zwei Fenster offen, schreibt ein Fenster nur über den Stand, den es selbst zuletzt geschrieben hat; hat ein anderes Fenster den Entwurf geändert oder entfernt, speichert es nicht und fragt (`src/app/fenster-abgleich.tsx`, `storage`-Ereignis; Warnleiste fest am oberen Bildrand, `src/app/feste-warnung.tsx`). Personaldaten in Entwurf und Rückholplatz werden 90 Tage nach der letzten Änderung anonymisiert, außer bei Übungen (5.5) | `localStorage` (`eeb.entwurf.v1`, `eeb.entwurf.ersetzt.v1`) |
| D2 | Vorlagen und Altbestand an Einsatz-Sammlungen | (a) Gespeicherte Vorlagen der eigenen Einheit samt Papierkorb (30 Tage wiederherstellbar); sie enthalten Namen und Erreichbarkeiten und sind von der Datenschutzfrist ausgenommen (`src/app/vorlagen.ts`); nach 180 Tagen ohne Änderung der Mannschaft fragt die Vorlagenkarte, ob jemand ausgeschieden ist. (b) Altbestand: Einsatz-Sammlungen mit empfangenen Bögen fremder Einheiten, die eine frühere App-Fassung auf dem Gerät abgelegt hat. Die App zeigt und bearbeitet sie nicht; die Startseite nennt Zahl der Sammlungen und Meldungen und bietet „Datensicherung erstellen" (die Meldekopf-App spielt die Datei ein) oder Löschen mit Rückfrage (`src/app/meldekopf-weg.tsx`, `meldekopf-altbestand.ts`). Gelesen wird über den Kern (`einsaetze-lesen.ts`, `@bos/meldekopf`): Die Aufräumfrist ruhender Sammlungen (90 Tage ohne Änderung, dann endgültig gelöscht) und die Datenschutzfrist je Meldung greifen dadurch auch ohne Anzeige (5.5) | `localStorage` (`eeb.vorlagen.v1`, `eeb.einsaetze.v1`) |
| D2a | Uhrstand für alle Fristen | Zuletzt akzeptierter Zeitpunkt der Geräteuhr, ggf. ein unbestätigter Sprung (5.5); keine Personendaten | `localStorage` (`eeb.uhr.v1`); steht in der Datensicherung, beim Einspielen bleibt der des Geräts |
| D2b | Begleiteinträge des Altbestands | Einträge, die zur früheren Einsatz-Sammlung gehörten und auf Geräten mit Altbestand vorhanden sein können: Export-, Lageblatt-, Weitergabe- und Kenntnis-Stände (Kennungen, Prüfsummen, Zeitpunkte), Kennungen entfernter Meldungen, Nachricht über aufgeräumte Sammlungen (Name, Zeitraum, Zahlen; schreibt die Hülle `src/app/aufraeum-hinweis.ts`, wenn der Kern eine ruhende Sammlung verwirft), zuletzt offene Sammlung, Einsatzbeginn und Funkrufname der Führungsstelle für den Lagemonitor (Freitext), Helligkeitsstufe, Papierkorb einzelner Meldungen (mit Namen von Personen), Abschlussvermerke, Import-Widersprüche, Anzeigevorgaben der Einheitenliste. „Altbestand löschen" entfernt sie gezielt zusammen mit `eeb.einsaetze.v1` (Liste `SAMMLUNGS_SCHLUESSEL`) | `localStorage` (`eeb.export-stand.v2`, `eeb.export-stand.v1`, `eeb.lageblatt-stand.v1`, `eeb.weitergabe-stand.v1`, `eeb.kenntnis-stand.v1`, `eeb.entfernt.v1`, `eeb.aufgeraeumt.v1`, `eeb.letzterEinsatz.v1`, `eeb.lagebeginn.v1`, `eeb.lagefunkruf.v1`, `eeb.lagestufe.v1`, `eeb.meldungen-papierkorb.v1`, `eeb.abschluss.v1`, `eeb.widersprueche.v1`, `eeb.nummernhinweis.v1`, `eeb.einheiten-ansicht`, `eeb.einheiten-tabelle-alle-spalten`); in Datensicherung und „Alle Daten löschen" über das Präfix enthalten |
| D2f | Stand der letzten Sicherung | Wann auf diesem Gerät zuletzt „Sicherung erstellen…" ausgelöst wurde und wie viele Einsätze und Meldungen sie enthielt — Grundlage für die Anzeige in der Datensicherung und die Erinnerung nach drei Tagen (`src/app/sicherung.ts`); keine Personendaten | `localStorage` (`eeb.sicherung.zuletzt.v1`, `eeb.sicherung.stand.v1`) |
| D2k | Haken einer unterbrochenen Musterung | Kennung und Fassung der Vorlage, die gemustert wird, die angehakten Plätze als Wahrheitswerte nach Stelle und der Zeitpunkt des letzten Hakens; gilt höchstens einen Tag und nur für dieselbe Fassung der Vorlage, wird mit dem Ende der Musterung gelöscht (`src/app/musterung-stand.ts`); keine Namen | `localStorage` (`eeb.musterung.v1`) |
| D2l | Beiseitegelegter, unlesbarer Entwurf | Der unveränderte Text eines gespeicherten Entwurfs, den die App nicht lesen kann (abgeschnitten, Pflichtfeld fehlt), mit Ursache und Zeitpunkt — damit der nächste Entwurf ihn nicht überschreibt; die Startseite nennt ihn mit seiner Frist und lässt ihn als Datei sichern. **Kann Personendaten enthalten**, die die Datenschutzfrist nicht erreicht (die App kann nicht anonymisieren): Er fällt deshalb nach 90 Tagen selbst weg, auf Wunsch früher („Entfernen…" mit Rückfrage) (`src/app/entwurf.ts`) | `localStorage` (`eeb.entwurf.beschaedigt.v1`) |
| D2m | Merker im Sitzungsspeicher des Tabs | (a) Link eines eingegangenen Bogens, über den noch nicht entschieden ist (`eeb.wartet.fragment`): enthält den Bogen samt Personendaten wie jeder Link, damit ein Neuladen erneut fragt; gelöscht mit jeder Antwort. (b) Rückwege nach „Entfernen" im Assistenten, je 15 Minuten und nur solange die Liste unverändert ist: `eeb.personal.rueckweg` (entfernte Personen **mit Namen, Funktionen und Erreichbarkeiten**), `eeb.vorbelegung.rueckweg` (unbenannte Sollplätze), `eeb.fahrzeug.rueckweg`, `eeb.ebene.rueckweg`, `eeb.einsatz.rueckweg` (Zeitraum, Ort/Auftrag und Sofortbedarf vor „Für neuen Einsatz vorbereiten"), `eeb.funkruf.merker.<Index>` (ausgeschalteter Funkrufname einer Fahrzeugkarte). (c) Inhaltsleere Merker: `eeb.abgleich.fortsetzen` (Wert „1", nach „Stand aus dem anderen Fenster laden"), `eeb.rueck.meldekopf` (Wert „1", gesetzt beim Aufruf mit `?rueck=meldekopf`; der Parameter wird sofort aus der Adresse genommen), `eeb.ansicht-stelle.v1` (Ansicht und Bildlaufstelle, 12 Stunden), `eeb.beispiel-pfad.v1` (zuletzt offener Ordner im Übungsbögen-Dialog) | `sessionStorage` des Tabs; endet mit dem Tab, kein Teil der Datensicherung; „Alle Daten löschen" leert alle Einträge mit Präfix `eeb.` auch dort |
| D2o | Stand des Offline-Vorrats | Zwei Zähler: wie viele Dateien der zweiten Stufe im Gerät liegen und wie viele es gibt (`src/app/offline-bereit.ts`); keine Personendaten | `localStorage` (`eeb.offline-zusatz.v1`); steht in der Datensicherung, beim Einspielen bleibt der des Geräts |
| D2p | Bestätigung „Geschlecht geprüft" | Prüfsummen (FNV-1a) über Namen und Geschlecht der Personen eines Bogens, dessen Besetzung jemand als „alle männlich" bestätigt hat — damit der Hinweis auf die Geschlechts-Vorbelegung bei dieser Besetzung schweigt (`src/app/geschlecht-geprueft.ts`); höchstens 50 Einträge; keine Namen im Klartext, kein Merker im Bogen oder im Transportformat | `localStorage` (`eeb.geschlecht-geprueft.v1`) |
| D2q | Lokaler Personalstamm | Helferliste einer Dienststelle, einmal aus CSV oder Excel (.xlsx) eingelesen (`src/app/personalstamm.ts`, `personalstamm-import.ts`; höchstens 3 000 Personen): je Person Name, Rolle (F/UF/H), Funktion, Qualifikationen, Fahrerlaubnisklassen, Teileinheit; Rufnummer nur, wenn beim Einlesen angehakt (Vorgabe: ja); Geschlecht und Ernährung nur, wenn beim Einlesen angehakt (Vorgabe: nein); dazu Dateiname und Zeitpunkt des Einlesens. **Enthält auch Personen, die in keinem Bogen stehen**; in Bogen, QR-Code, PDF und Exporte gelangen nur die in „Wer ist dabei?" ausgewählten | `localStorage` (`eeb.personalstamm.v1`); wandert **nicht** in die Datensicherung und bleibt beim Einspielen einer Sicherung liegen; fällt mit „Personalstamm löschen…" und mit „Alle Daten löschen" weg; die Startseite nennt das Datum des Einlesens und erinnert nach 90 Tagen |
| D2r | Beiseitegelegte unlesbare Bestände | Unlesbare Gesamttexte und Teile von Vorlagen, Altbestand-Sammlungen und Absenderkarte, unverändert abgelegt, bevor der Kern sie beim nächsten Schreiben verwerfen würde (`src/app/unlesbar.ts`); **können Personendaten enthalten**; fallen nach 90 Tagen weg, auf Wunsch früher („Beiseitegelegtes entfernen…") | `localStorage` (`eeb.unlesbar.v1`) |
| D2s | Merker zu Übungsbögen | Namen und Rufnummern des geöffneten Übungsbogens (erfundene Daten bzw. Bogen mit Übungsmarke), damit die App warnt, wenn sie nach Abwählen der Übung als echte Angaben weitergegeben würden (`eeb.beispiel-herkunft.v1`); Prüfsumme des unverändert geöffneten Übungsbogens (`eeb.beispiel-offen.v1`). Beide entfallen, sobald kein Bogen offen ist (`src/app/beispiel-herkunft.ts`) | `localStorage` |
| D2t | Bedienvorgaben und Hilfseinträge | Anzeige-Modus (`eeb.anzeigemodus.v1`, Vorgänger `eeb.feldmodus.v1`), Sichtschutz „Namen verbergen" (`eeb.namen-verbergen.v1`, nur gesetzt, wenn an), abgeschaltete Screenshot-Sperre (`eeb.bildschirmschutz.v1`, nur gesetzt, wenn aus), zuletzt gewählte Organisation (`eeb.schnellOrganisation.v1`, eine Zahl), Ein-Zeichen-Probe bei Schreibfehlern, die sofort entfernt wird (`eeb.speicherprobe`). Ohne Präfix `eeb.` und damit weder in der Datensicherung noch von „Alle Daten löschen" erfasst: gewählte Kamera (`eeb-kamera`), gewählter Scan-Weg (`eeb-scanweg`, nur „handscanner"), Schalter der Plattform-Vorschau (`eeb-debug`, `eeb-debug-plattform`, `eeb-debug-rahmen`) und der Widerspruch gegen die Reichweitenmessung (`skipgc`). Keine Personendaten | `localStorage` |
| D2u | Offline-Vorrat im Cache Storage | Anwendungsdateien (Workbox-Precache), zweite Stufe mit Übungsbögen, Themenseiten und Fotos (`eeb-zusatz`, höchstens 1 500 Einträge), auf Abruf geöffnete Übungsbögen der THW-Ortsverbände und niedersächsischer Wachen (`eeb-ov-beispiele`, höchstens 4 000 Einträge). Nur Dateien der eigenen Herkunft; keine Bögen des Nutzers, keine Personendaten (die Übungsbögen tragen erfundene Personen; die Wachen-Bögen echte Funkrufnamen, Kennzeichen und Wachennamen von Dienstfahrzeugen) | Cache Storage des Browsers (nur Web-App) |
| D3 | Absenderkarte | Freiwillige Kontaktangabe (Name/E-Mail/Telefon) der meldenden Person | `localStorage` (`eeb.absenderkarte.v1`) |
| D4 | Privater Geräteschlüssel | Ed25519-Schlüssel zur Signatur weitergereichter Bögen (`src/app/geraete-schluessel.ts`) | `localStorage` (`eeb.geraeteschluessel.v1`), **unverschlüsselt als Hex**; lässt er sich beim ersten Erzeugen nicht speichern (Speicher voll/gesperrt), nur im Arbeitsspeicher der offenen Seite, bis Platz ist — die Übersicht sagt das am Siegel. Der private Schlüssel steht auch in jeder Sicherungsdatei |
| D5 | QR-Payload / Link / Exportdatei | Binär kodierter, komprimierter Bogen zur Übergabe an ein zweites Gerät, als QR-Code oder als Link (`https://erfassungsbogen.app/#…` bzw. `https://meldekopf.erfassungsbogen.app/#…`; der Bogen steht im Fragment und geht nicht an den Server); ebenso eine geteilte Vorlage (QR/Link mit Marker `V.`, oder JSON-Datei `eeb-vorlage-*.json`) und die Sicherungsdatei (`eeb-sicherung-*.json`) | Transient (QR-Code-Anzeige) bzw. Datei auf dem Gerät oder in einer vom Nutzer gewählten Ablage (z. B. Cloud-Ordner) |
| D6 | Ausgedruckte/exportierte Kopien | PDF im Papier-Layout, CSV-Export des Bogens | Außerhalb der App (Papier, Dateisystem des Empfängers) |

Hinweise an die einsetzende Organisation:

- Der Personalstamm (D2q) bringt Daten von Personen auf ein Einsatzgerät, die an
  keinem Einsatz beteiligt sein müssen. Auf welchen Geräten er eingelesen wird,
  ob mit Rufnummern, und wann er zu löschen ist, sollte geregelt sein (M12).
- Die Sicherungsdatei (D5) enthält alle Fachdaten und den privaten
  Geräteschlüssel; sie ist wie ein Schlüssel zu behandeln (M11).

### 3.4 Zielobjekte: Kommunikationsverbindungen

| # | Zielobjekt | Ziel | Zweck | Absicherung |
| --- | --- | --- | --- | --- |
| K1 | Geräte-zu-Geräte-Übergabe | Kein Netzwerk — QR-Kamera-Scan, USB-Handscanner, Link, Datei-Export/-Import, Nahfeld-Freigabe (AirDrop/Quick Share) | Übergabe eines Bogens zwischen zwei Geräten | Physisch/lokal begrenzter Kanal; optionale Ed25519-Signatur zur Herkunftsprüfung |
| K2 | GoatCounter-Reichweitenmessung | `https://erfassungsbogen.goatcounter.com/count` | Anonyme Nutzungsstatistik: ein Treffer je App-Start (Zählpfad nach Kanal, Titel, im Browser der Referrer) und feste Filmereignisse (Erklärfilm gestartet/halb/zu Ende, in den Apps Link geöffnet; ohne Referrer) (`src/app/statistik.ts`) | Cookielos, keine geräteübergreifende ID, kein Fremdskript; weder Adress-Parameter noch Fragment werden übertragen, also keine Bogen-Inhalte; abwählbar (Widerspruch `skipgc`) |
| K3 | Update-Prüfung gegen GitHub Releases | Desktop: `https://github.com/wattnpapa/erfassungsbogen/releases/latest/download` (`electron-updater`, läuft im Hauptprozess). Android: `https://api.github.com/repos/wattnpapa/erfassungsbogen/releases/latest`, der Download der APK erst auf Tippen über das native Plugin `AppUpdate` (`src/app/aktualisierung.tsx`) | Prüfung auf neue App-Version und Bezug des Pakets | HTTPS; Paketsignatur je Plattform, siehe 5.6 und 6.4 |
| K4 | Abrufe an die eigene Herkunft | Host der Web-App (GitHub Pages bzw. GitLab Pages auf Open CoDE) | Laden der Anwendung, Service-Worker-Aktualisierung, Nachladen des Offline-Vorrats, Übungsbögen auf Abruf, Erklärfilm (`public/video/`, erst beim Abspielen) | HTTPS; es entstehen Abrufmetadaten (u. a. IP-Adresse) beim Betreiber der Plattform; keine Bogen-Inhalte |

Weitere Netzwerkverbindungen der Seite gibt es nicht; die Content-Security-Policy
des Builds lässt als fremde Herkunft allein den GoatCounter-Host zu (siehe 5.3).
Die Desktop-Update-Prüfung läuft außerhalb der Seite im Electron-Hauptprozess.
Die Android-Update-Prüfung ist ein `fetch` der Seite an `api.github.com`; dieser
Host steht nicht in `connect-src` der ausgelieferten Policy (siehe 5.6).

Verweise sind keine Verbindungen der App: Die Startseite und der Übergabe-Dialog
verlinken auf die Meldekopf-App (`https://meldekopf.erfassungsbogen.app/`,
„An Meldekopf-App geben" mit dem signierten Bogen im Fragment), die Fußzeile auf
Themenseiten, GitHub und verwandte Werkzeuge. Erst das Antippen öffnet die
Adresse im Browser. Die installierten Apps tragen den Erklärfilm nicht mit und
verlinken auf die Website.

Wird die Anwendung über die GitLab-Pages-Fassung auf Open CoDE aufgerufen (siehe
3.2/3.6), gelten K1 bis K4 unverändert — es ist derselbe Build. K2 zählt dabei
in denselben GoatCounter-Bestand; unterschieden wird nur über den Zählpfad,
nicht über den Host.

Werkzeuge der Erstellung bauen zur Laufzeit keine Verbindung auf: Die
Sprachaufnahmen des Erklärfilms entstehen mit ElevenLabs im Werkzeug
`erklaerfilm/stimmen.mjs`, die Einheitenlisten der Übungsbögen stammen von
thw.blafusel.de und bos-fahrzeuge.info und werden nur beim Erzeugen abgerufen
(`npm run beispiele:thw-ov -- --abrufen`, `npm run quellen:bos-fahrzeuge`).

### 3.5 Zielobjekte: IT-Systeme (Endgeräte)

Die Endgeräte selbst (Smartphones, Tablets, Notebooks, Desktop-PCs) sind
Zielobjekte im Sinne der Strukturanalyse, liegen aber außerhalb des
Einflussbereichs der Software und sind durch die einsetzende Organisation zu
erfassen und abzusichern (Geräteverwaltung, Bildschirmsperre,
Festplattenverschlüsselung, Betriebssystem-Updates).

### 3.6 Zielobjekte: Build-, Auslieferungs- und Update-Kette

| # | Zielobjekt | Beschreibung |
| --- | --- | --- |
| B1 | Quellcode-Repository | `wattnpapa/erfassungsbogen` samt vier Submodulen (`@bos/*` unter `vendor/`), öffentlich auf GitHub |
| B2 | CI/CD-Pipeline | GitHub Actions (`ci.yml`: Typprüfung, Tests, Build, Bundle-Budget, SBOM, `npm audit`, E2E; `release.yml`: Build und Veröffentlichung der Auslieferungspakete und der Webfassung; `spiegel-opencode.yml`: einseitiger Quellcode-Spiegel nach Open CoDE, authentifiziert über einen Deploy-Key im CI-Secret `OPENCODE_SSH_KEY` mit Schreibrecht ausschließlich auf dem Spiegel-Repository). Auf dem Spiegel selbst läuft GitLab CI (`.gitlab-ci.yml`): Prüfstufe als Nachbildung von `ci.yml` und darauf aufbauend Job `pages` (nur Standardzweig) mit Build und Veröffentlichung der Webfassung; dazu die Stufe `pakete` mit denselben Paketbauten wie `release.yml` (Linux und Android automatisch, Windows und macOS nur mit eigenem Runner und manuell ausgelöst). Die Pakete bleiben Job-Artefakte; ein GitLab-Release oder Tag entsteht nicht, dieser Teil ist nur auskommentiert vorbereitet. Die Submodule werden per HTTPS aus den öffentlichen GitHub-Repositories gezogen |
| B3 | Abhängigkeiten (Software-Lieferkette) | npm-Pakete gemäß `package-lock.json` je Teilprojekt, versioniert und gepinnt; Swift-Pakete der iOS-Hülle über die Swift-Paketauflösung |
| B4 | Code-Signing-Material | Android-Keystore als CI-Secret im GitHub-Repository; Zertifikat und Apple-API-Schlüssel für die macOS-Signatur/-Notarisierung als CI-Secrets vorgesehen (Job stillgelegt). Für Windows und Linux ist in `release.yml` kein Signaturmaterial eingebunden. Die Paketbauten auf dem Open-CoDE-Spiegel bauen ohne hinterlegtes Material **unsigniert**; sollen sie signieren, ist dasselbe Schlüsselmaterial zusätzlich dort als CI-Variable zu hinterlegen — dann verdoppelt sich der Ort, an dem es liegt, und das ist eine eigene Entscheidung (`.gitlab-ci.yml` nennt die Variablen) |
| B5 | Auto-Update-Kanal | `electron-updater` gegen GitHub Releases (Desktop); Selbst-Update der Android-APK gegen GitHub Releases |

## 4. Schutzbedarfsfeststellung

Bewertung je Grundwert (Vertraulichkeit, Integrität, Verfügbarkeit) nach dem
dreistufigen BSI-Schema *normal – hoch – sehr hoch*. Die Einstufung geht vom
typischen BOS-Einsatzkontext aus; eine endgültige, organisationsspezifische
Einstufung obliegt der einsetzenden Organisation.

| Zielobjekt | Vertraulichkeit | Integrität | Verfügbarkeit | Begründung |
| --- | --- | --- | --- | --- |
| D1/D2 Erfassungsbogen-Daten | Normal | Hoch | Hoch | Enthält Personal-/Kontaktdaten (normaler Schutzbedarf, keine Art.-9-Daten); falsche Stärke-/Bedarfszahlen können zu Fehlentscheidungen der Einsatzleitung führen; die App muss auch ohne Netz/Strom über Stunden funktionieren. |
| D2q Lokaler Personalstamm | Normal | Normal | Normal | Personal-/Kontaktdaten einer ganzen Dienststelle, auch von Unbeteiligten; Quelle bleibt die Datei der Dienststelle, ein Verlust auf dem Gerät ist durch erneutes Einlesen behebbar. |
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

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` für jedes
  Fenster (gemeinsame `WEB_EINSTELLUNGEN`) — der Renderer-Prozess hat keinen
  Zugriff auf Node.js- oder Electron-APIs. Das Preload-Skript
  (`electron/preload.cjs`, CommonJS, läuft in der Sandbox und lädt nur das
  Modul `electron`) reicht der Seite über `contextBridge` genau zwei Dinge:
  `process.platform` und eine Funktion, die die Screenshot-Sperre schaltet.
  Der Hauptprozess nimmt den IPC-Kanal `eeb:bildschirmschutz` nur von Seiten
  der App selbst (`file:` bzw. Dev-Server) und nur mit einem Wahrheitswert an.
- **Screenshot-Sperre:** `setContentProtection` auf jedem Fenster, ab dem
  Erzeugen und für Fenster aus `setWindowOpenHandler` über `did-create-window`
  (der Schutz vererbt sich nicht von selbst). Ab Werk an; die App kann ihn in
  der Fußzeile abschalten, der Wert gilt dann für alle Fenster. Unter Windows
  (ab Windows 10 Version 2004, `SetWindowDisplayAffinity`) fehlen die Fenster
  in Bildschirmfotos, Aufnahmen und Bildschirmfreigaben. Unter macOS setzt es
  `NSWindowSharingNone`; Aufnahmeprogramme auf Basis von ScreenCaptureKit
  erfassen das Fenster laut Electron-Dokumentation trotzdem. Unter Linux wirkt
  es nicht, dort zeigt die App die Einstellung nicht an.
- **Minimale Rechtevergabe:** Permission-Request- und Permission-Check-Handler
  erlauben ausschließlich `media` (Kamera für QR-Scan) und Zwischenablage-Zugriff
  (`clipboard-read`, `clipboard-sanitized-write`); alle anderen
  Berechtigungsanfragen werden pauschal abgelehnt.
- **Kontrollierte externe Links:** `setWindowOpenHandler` und `will-navigate`
  fangen jede Navigation zu einer fremden URL ab und öffnen sie im
  System-Standardbrowser statt im App-Fenster. Ein neues Fenster mit interner
  Adresse wird abgelehnt; einzige Ausnahme im Code ist eine Adresse mit
  `?lagemonitor=`, die ein zweites App-Fenster mit denselben Einstellungen
  (`contextIsolation`, `sandbox`, kein Node-Zugriff) bekäme. Die App selbst
  öffnet keine solche Adresse — die Ausnahme ist ein Rest der ausgelagerten
  Sammlung und ohne Funktion.
- `hardenedRuntime: true` für macOS-Builds (`package.json`, Feld `build`).

Die Android-Hülle fordert im Manifest `INTERNET` und für das Selbst-Update
`REQUEST_INSTALL_PACKAGES` an (`android/app/src/main/AndroidManifest.xml`).
Sie setzt `FLAG_SECURE` auf das App-Fenster, bevor das erste Bild entsteht
(`MainActivity`, eigenes Capacitor-Plugin `Bildschirmschutz.java` zum
Abschalten). Bildschirmfotos, Bildschirmaufnahmen und Übertragungen auf
unsichere Anzeigen bleiben schwarz, die Vorschau in der App-Übersicht leer.
Das Flag gilt nur für dieses Fenster, nicht für fremde Activities, die die App
aufruft (Kamera-Scanner, Teilen-Menü, Dateiauswahl).

Die iOS-Hülle kann Bildschirmfotos nicht sperren; Apple bietet dafür keine
öffentliche Schnittstelle. Das eigene Plugin (`ios/App/App/Bildschirmschutz.swift`,
registriert über `AppViewController` in `Main.storyboard`) deckt den Inhalt
ab, solange der Bildschirm aufgenommen, gespiegelt oder per AirPlay übertragen
wird (ab iOS 17 `sceneCaptureState`, davor `UIScreen.isCaptured`), und wenn
die App den Vordergrund verlässt (Vorschau im App-Umschalter). Ein
Bildschirmfoto meldet iOS erst nach dem Speichern; die App zeigt dann einen
Hinweis zum Umgang damit.

Auf allen Plattformen, auch im Browser, gibt es den Sichtschutz „Namen
verbergen" (ab Werk aus): Personennamen erscheinen in der Oberfläche als
Balken und werden erst auf Antippen aufgedeckt (`src/app/namen-verbergen.ts`,
`src/app/personen-name.tsx`). Exporte bleiben unverändert.

### 5.2 Kryptografische Herkunfts- und Integritätsprüfung

Jeder weitergereichte Bogen kann optional mit dem lokal erzeugten
Ed25519-Schlüsselpaar des Geräts signiert werden
(`vendor/eeb-format/src/signatur.ts`, `src/app/geraete-schluessel.ts`). Das
Modell ist bewusst Trust-on-First-Use (TOFU), kein PKI-Aufbau: Die Signatur
bestätigt, dass ein weitergereichter Bogen unverändert vom Inhaber eines
bestimmten, lokal erzeugten Schlüssels stammt — nicht die reale Identität einer
Person. Mehrstufige Weitergaben werden als Signaturkette (`EEB2C`-Container,
begrenzt auf `MAX_STUFEN = 32`) abgebildet. Derselbe signierte Payload steckt im
QR-Code, im Link „Link teilen" und im Link „An Meldekopf-App geben"; eine
geteilte Vorlage wird ebenso signiert. Den öffentlichen Schlüssel und seine
Kurzform kann der Nutzer aus der Übersicht weitergeben.

Die Signatur eines eingehenden Bogens (Link, Scan, Bild) wird nach der Übernahme
geprüft und in der Übersicht angezeigt; die Prüfung blockiert den Import nicht.
Bearbeiten verwirft den Signaturstatus des empfangenen Bogens. Bögen aus einer
Datei (eingebettetes JSON einer PDF, JSON-Datei, Word-Bogen) tragen keinen
Signaturnachweis. Ein anonymisierter Bogen (5.5) verliert Rohpayload und
Nachweis, weil die Signatur den Inhalt dann nicht deckt.

Lässt sich der private Schlüssel beim ersten Erzeugen nicht speichern, signiert
die App mit einem Schlüssel nur für diese Sitzung und speichert ihn, sobald
Platz ist; das Signaturformat ist dasselbe.

**Transportformat und Schema** (`vendor/eeb-format`, `SCHEMA_VERSION = 13`): Die
Schema-Version eines Bogens richtet sich nach den genutzten Feldern — Schema 10
bei einer Dienststelle je Person, Schema 11 beim Einsatzzeitraum mit Uhrzeit
(neue Bögen sind mit 08:00–18:00 vorbelegt und damit mindestens Schema 11),
Schema 12 bei einem Funkrufnamen als Erreichbarkeit, Schema 13 bei einer
abweichenden Farbe des taktischen Zeichens je Fahrzeug. App-Stände, die eine
Version nicht kennen, lehnen den Bogen als „nicht unterstützte Schema-Version"
ab, statt Felder falsch zu lesen; ältere Bögen bleiben lesbar. Die Eingangsprüfung
(`src/app/bogen-pruefung.ts`) verwirft Zeitangaben, die kein ISO-8601-Zeitpunkt
mit Offset sind; der Encoder wirft bei unlesbaren Werten, statt still zu kürzen.

**USB-Handscanner** (`src/app/handscanner.ts`): Die App erkennt Tastenfolgen im
Scanner-Tempo auf der ganzen Seite, außerhalb von Textfeldern und offenen
Rückfragen. Ein solcher Scan nimmt denselben Weg wie ein angetippter Bogen-Link,
einschließlich Rückfrage und Signaturprüfung.

### 5.3 Content-Security-Policy

Der Produktions-Build setzt eine restriktive CSP als `<meta>`-Element im Kopf der
`index.html` (`vite.config.ts`, Plugin `eeb-csp`). Die Direktiven, im Build mit
`; ` verbunden:

```
default-src 'self' file:
base-uri 'none'
object-src 'none'
form-action 'none'
script-src 'self' file: 'wasm-unsafe-eval' 'sha256-…' 'sha256-…' 'sha256-…'
style-src 'self' file: 'unsafe-inline'
img-src 'self' file: data: blob: https://erfassungsbogen.goatcounter.com
font-src 'self' file: data:
frame-src 'self' file: blob:
connect-src 'self' file: https://erfassungsbogen.goatcounter.com
```

- `object-src 'none'`, `base-uri 'none'` und `form-action 'none'` unterbinden
  ganze Klassen von Angriffen; `connect-src`/`img-src` sind auf genau einen
  fremden Host begrenzt — jede Datenausleitung an eine andere Herkunft ist
  technisch unterbunden.
- `script-src` kommt **ohne** `'unsafe-inline'` aus: Die drei
  Inline-`<script>`-Blöcke der `index.html` (Boot-Skelett, zwei JSON-LD-Blöcke)
  werden beim Bauen gehasht und einzeln per `sha256-…` freigegeben; ein
  nachträglich eingehängtes Skript wird blockiert. Findet das Plugin keinen
  Inline-Block, bricht der Build ab.
- `'wasm-unsafe-eval'` erlaubt ausschließlich das Kompilieren von
  WebAssembly-Modulen (kein `eval`, kein Inline-Skript) und ist nötig für den
  QR-Decoder ZXing (`assets/zxing_reader-*.wasm` aus dem eigenen Bundle); ohne
  die Freigabe fiele die App still auf den JavaScript-Decoder jsQR zurück.
  Geladen werden kann nur, was `'self'` liefert.
- `style-src` behält `'unsafe-inline'` bewusst, weil React `style`-Attribute an
  Elementen setzt.
- `frame-src blob:` dient der PDF-Vorschau in der Übersicht; `file:` deckt den
  Electron-Build ab und ist im Web wirkungslos. Capacitor läuft unter
  `capacitor://localhost` bzw. `https://localhost` und fällt unter `'self'`.
- Web Worker (PDF-Satz der Übungsbögen) und Service Worker stammen aus der
  eigenen Herkunft.

Die Policy gilt nur im Build; der Vite-Entwicklungsserver läuft ohne sie.

### 5.4 Schutz bei Datenexport und -import

**Ausgabewege eines Bogens** (Übergabe-Dialog, `src/app/schritte/uebersicht.tsx`):
QR-Code (bei großen Bögen mehrteilig), Link, Nahbereich-Freigabe, „An
Meldekopf-App geben", PDF und CSV. Wohin Ausdruck, Link und Datei gelangen,
entscheidet der Nutzer (DSFA 5.8).

- **CSV-Export** (`src/app/csv.ts`, `bogen-csv.ts`): Werte, die mit `=` `+` `-`
  `@` oder Tab/CR beginnen (`FORMEL_START = /^[=+\-@\t\r]/`), werden mit einem
  führenden `'` versehen — eine dokumentierte Abwehr gegen CSV-Formel-Injection.
  Die CSV führt alle Angaben des Bogens bis zur einzelnen Person und zum
  einzelnen Fahrzeug, darunter Erreichbarkeiten (Funkrufname als `Funk: …`) und
  die Spalte „Zeichenfarbe". Einen XLSX-Export gibt es nicht.
- **PDF** (`src/app/pdf.ts`, `pdf-dokument.ts`): Papier-Layout des Bogens mit
  signiertem QR-Satz und eingebettetem, unsigniertem Bogen-JSON. Neben jedem
  QR-Code steht der Stand, den der Code trägt, mit dem Hinweis, dass eine
  Änderung mit dem Stift nicht im Code steckt — Papier und Gerät können
  auseinanderlaufen, der Hinweis macht es sichtbar. Alle Texte werden auf die
  PDF-Schrift abgebildet (`winAnsiText`); nicht darstellbare Namen stehen mit
  „(vereinfacht)" und werden beim Erzeugen genannt. Vorbelegung nach StAN und
  der Funkrufname einer nur nach Stärke erfassten Einheit stehen nicht als
  gemeldet auf dem Papier.
- **Blanko-Vordruck** (`src/app/blanko.ts`): Die App erzeugt den Vordruck selbst
  und liefert ihn als Datei mit (`public/downloads/`, im Offline-Vorrat). Er
  enthält keine Daten des Geräts.
- **Übungsbögen als Sammel-PDF oder ZIP** (`src/app/pdf.ts`, `pdf-zip.ts`,
  `zip-schreiben.ts`, `pdf-sammel-worker.ts`): Im Übungsbögen-Dialog markierte
  Bögen gehen als eine PDF oder als ZIP-Archiv mit einer PDF je Bogen in den
  Download-Ordner (App: Share-Sheet). Betroffen sind ausschließlich die
  mitgelieferten Übungsbögen mit erfundenen Personen; eigene oder empfangene
  Bögen nimmt dieser Weg nicht auf. Jede Seite trägt das Wasserzeichen „ÜBUNG".
  Das ZIP ist unkomprimiert und unverschlüsselt. Gesetzt wird in einem Web
  Worker derselben Herkunft.
- **Vorlage teilen** (`src/app/vorlagen-ui.tsx`, `vorlagen.ts`): QR-Code und Link
  tragen die Vorlage mit dem Geräteschlüssel signiert, wie beim Bogen. Die
  JSON-Datei (`format: "eeb-vorlage"`) enthält nur Name und Bogen dieser einen
  Vorlage, **keinen** Geräteschlüssel und keine übrigen App-Daten; sie ist
  unsigniert. Beim Einlesen werden Format und Bogenschema geprüft; eine Datei
  aus einer neueren App-Version wird abgewiesen. Der Dialog weist darauf hin,
  dass die Vorlage Namen und Erreichbarkeiten enthält. Wohin die Datei gelangt
  (etwa in eine Cloud), entscheidet der Nutzer; die einsetzende Organisation
  sollte das regeln (siehe DSFA 5.8).
- **Datensicherung** (`src/app/sicherung.ts`): eine JSON-Datei mit allen
  `eeb.`-Einträgen des `localStorage` außer dem Personalstamm — einschließlich
  Altbestand und **privatem Geräteschlüssel**; die Oberfläche weist darauf hin.
  Die Datei ist unverschlüsselt.

**Eingänge** — alle Wege lesen lokal, ohne Netz:

- **QR-Code, Link, Bild:** Die Dekomprimierung läuft über `inflateRawBegrenzt`
  mit Obergrenze 4 MiB (6.2).
- **Bogen-Datei** („Aus Datei laden…": PDF mit eingebettetem JSON, JSON, Word):
  Pflichtfelder werden geprüft (`bogen-pruefung.ts`), eine unbrauchbare Datei
  ändert nichts.
- **THW-Word-Bogen** (`src/app/word-bogen.ts`, ausgefüllte `.docx` aus den
  Vorlagen `06-*_Erfassungsbogen.dotx`): Dateigröße höchstens 25 MiB
  (`MAX_WORD_DATEI`); ein eigener ZIP-Leser holt ausschließlich
  `word/document.xml` (nur Verfahren „stored" und „deflate", kein ZIP64,
  verschlüsselte Einträge werden abgelehnt) und entpackt sie über
  `inflateRawBegrenzt` mit Deckel 8 MiB (`MAX_DOCUMENT_XML`). Das XML liest
  `DOMParser` als `application/xml`; dabei wird nichts ausgeführt und nichts
  nachgeladen, Makros, eingebettete Objekte und Verknüpfungen werden nie
  angefasst. Übernommen werden nur Textwerte der bekannten Formularfelder; sie
  durchlaufen danach dieselben Wege wie jeder andere Bogen (Prüfung,
  CSV-Formel-Abwehr, `winAnsiText`). Fehler meldet der Leser als ganzen Satz,
  nie als Parser-Text.
- **Personalstamm** (`src/app/personalstamm-import.ts`, CSV oder .xlsx): Datei
  höchstens 10 MB, höchstens 3 000 Personen und 60 Spalten; die .xlsx liest
  derselbe ZIP-Leser mit Entpack-Grenze 40 MB je XML-Datei, das XML der
  `DOMParser`. Gelesen werden nur Zellwerte; Formeln, Makros und eingebettete
  Objekte werden nicht ausgewertet. Die Mustervorlage (.xlsx, .csv) erzeugt die
  App selbst, ohne Formeln und Makros.
- **Sicherung einspielen:** siehe 5.5.

### 5.5 Datensparsamkeit, Löschung und Verfügbarkeit

- **Datenschutzfrist** (`vendor/eeb-format/src/datenschutzfrist.ts`,
  `DATENSCHUTZFRIST_TAGE = 90`): 90 Tage nach der letzten Änderung eines Bogens
  entfernt die App Namen, Funktionen, Qualifikationen, Fahrerlaubnisse und
  Erreichbarkeiten dauerhaft. Das gilt für den Entwurf, den Rückholplatz, aus
  Link, Scan oder Datei geöffnete Bögen und jede Meldung des Altbestands; bei
  diesen fallen auch Rohpayload und Signaturnachweis weg. Übungsbögen und
  Vorlagen sind ausgenommen. Beiseitegelegte unlesbare Bestände (D2l, D2r) kann
  die App nicht anonymisieren; sie fallen nach derselben Frist ganz weg. Gegen
  Absicht schützt die Frist nicht: Der QR-Code bleibt unverschlüsselt, und eine
  zurückgestellte Uhr verhindert nur, was fällig wäre.
- **Geprüfte Geräteuhr** (`src/app/datenschutz-uhr.ts`, `uhr-korrektur.ts`,
  `uhr-folgen.ts`, `uhr-warnung.tsx`): Alle Fristen (Datenschutzfrist,
  Aufräumfrist des Altbestands, Papierkorbfristen) rechnen mit einer geprüften
  Uhr. Weicht die Geräteuhr um 60 Tage oder mehr vom letzten Start ab
  (`UHR_SPRUNG_TAGE = 60`, vor oder zurück), gilt das als Sprung: Die App hält
  die Fristen an, löscht und anonymisiert nichts und zeigt „Geräteuhr prüfen".
  Ein Sprung wird nie durch Zeitablauf bestätigt, sondern nur durch „Geräteuhr
  stimmt" (Rückfrage mit den Folgen in Zahlen und den betroffenen Sammlungen)
  oder durch eine Uhr, die wieder zum letzten Start passt. Ein Sprung nach vorn,
  der nichts fällig macht, wird ohne Frage übernommen; die App fragt auch bei
  kleineren Sprüngen, wenn dadurch Unangekündigtes fällig würde. Der Kern
  rechnet mit `Date.now()`; eine Hülle zwischen Kern und `localStorage`
  verschiebt bei gehaltener Uhr die Zeitstempel beim Lesen um den Versatz und
  beim Schreiben zurück, im Speicher stehen ehrliche Zeitstempel. Neue Stände
  werden bei gehaltener Uhr mit der geprüften Zeit gestempelt. Bleibende Grenze:
  Ein Sprung unter 60 Tagen zählt als echte Zeit und kann Papierkorb-Einträge
  (30 Tage) und ruhende Sammlungen des Altbestands entsprechend früher entfernen.
- **Altbestand an Einsatz-Sammlungen** (D2): Aufräumfrist 90 Tage ohne Änderung
  (`@bos/meldekopf`), danach endgültig gelöscht. Der Nutzer kann den Altbestand
  jederzeit sichern (für die Meldekopf-App) oder mit Rückfrage samt
  Begleiteinträgen löschen.
- **Papierkorb für Vorlagen** (`src/app/vorlagen.ts`, `papierkorb-frist.ts`):
  gelöschte Vorlagen lassen sich 30 Tage wiederherstellen; der Papierkorb nennt
  Datum und Restzeit der endgültigen Entfernung, ab drei Tagen hervorgehoben.
- **Rückwege im Assistenten:** „Person entfernen", „Fahrzeug entfernen", „Ebene
  entfernen", „Vorbelegung entfernen" und „Für neuen Einsatz vorbereiten" haben
  ein „Rückgängig", das Schrittwechsel und Neuladen 15 Minuten übersteht
  (Sitzungsspeicher des Tabs, D2m); beim Verwerfen, Schließen und Übergeben des
  Bogens werden die Rückwege gelöscht.
- **Sicherung einspielen** (`src/app/sicherung.ts`, `src/app/fusszeile.tsx`):
  ersetzt alle `eeb.`-Einträge des Geräts ohne Papierkorb — dieselbe Folge wie
  „Alle Daten löschen". Beim Gerät bleiben Uhrstand, Stand des Offline-Vorrats
  und Personalstamm (`BEIM_GERAET`). Die Datei wird vor der Rückfrage geprüft
  (eine kaputte Datei ändert nichts); die Rückfrage nennt den Bestand des Geräts
  und den Inhalt der Datei mit denselben Posten wie „Alle Daten löschen"
  (Vorlagen aktiv und im Papierkorb, Bogen auf dem Rückholplatz, Absenderkarte,
  Geräteschlüssel mit Kurzform auf dem Gerät und in der Datei, Sammlungen,
  Beiseitegelegtes), bietet „Vorher Sicherung erstellen…" an und verlangt einen
  Haken, sobald auf dem Gerät etwas verloren geht. Sie nennt außerdem, was von
  einer alten Datei sofort unter die Fristen fällt. Scheitert das Schreiben,
  stellt die App den Bestand vor dem Einspielen wieder her.
- **Alle Daten löschen** (`alleDatenLoeschen`): entfernt alle `eeb.`-Einträge aus
  `localStorage` und `sessionStorage`, auch Papierkorb, Personalstamm und
  privaten Geräteschlüssel; die Rückfrage zählt die Posten auf. Bestehen bleiben
  die Bedienvorgaben ohne Präfix und der Widerspruch gegen die Reichweitenmessung
  (D2t). Ein zweites offenes Fenster baut seine Startseite danach neu auf.
- **Verfügbarkeit des Gerätespeichers** (`src/app/speicher-browser.ts`,
  `speicher-schonend.ts`, `speicher-warnung.tsx`): Browser dürfen Website-Daten
  bei Platzmangel oder (Safari) nach längerer Nichtnutzung räumen. Die Web-App
  bittet deshalb beim Start um dauerhaften Speicher
  (`navigator.storage.persist`), sobald wertvolle Daten vorliegen, und zeigt in
  der Datensicherung, ob der Browser zugestimmt hat. Die native App fragt nicht —
  dort gehört der Speicher der App. Die Datensicherung zeigt die letzte
  Sicherung, die Fußzeile erinnert nach drei Tagen ohne Sicherung. Lesen
  schreibt nur, wenn eine Frist etwas bereinigt hat. Scheitert ein
  Schreibvorgang, unterscheidet die App „voll" und „gesperrt" (Probe-Eintrag
  `eeb.speicherprobe`), zeigt „Nicht gespeichert" als feste Leiste am Bildrand
  und lässt den Browser vor dem Schließen nachfragen (`beforeunload`).
  Beschädigte Texte werden beiseitegelegt, bevor etwas sie überschreibt; lässt
  sich nicht beiseitelegen, bleibt das Original stehen. Eine Sicherungspflicht
  erzwingt die App nicht; das ist organisatorisch zu regeln (M11).
- **Fehlerseite** (`src/app/fehlerfaenger.tsx`): fängt Abstürze der Ansicht ab
  und bietet Neu laden, Zur Startseite, „Daten sichern" und, mit Rückfrage,
  „Alle Daten löschen".
- **Schema-Migration** (`src/app/hilfen.ts`): verhindert, dass ältere Datensätze
  mit veralteten Feldbedeutungen fehlinterpretiert werden. Was im Speicher
  liegt, wird beim Lesen wie an den Eingängen geprüft (`einsaetze-lesen.ts`,
  `vorlagen.ts`).
- **Absenderkarte vollständig optional** (Opt-in), ohne Eingabe als „keine
  Karte" kodiert.

### 5.6 Update-Mechanismus

**Desktop:** `electron-updater` prüft bei jedem Start der paketierten App gegen
das neueste GitHub-Release, lädt Updates im Hintergrund und bietet einen Neustart
an; bei „Später" wird beim nächsten Beenden installiert. Fehler (kein Netz, kein
Release, unsignierter Build) werden bewusst still ignoriert, um den für
Offline-Betrieb ausgelegten Programmstart nicht zu blockieren. Windows on ARM
nutzt einen eigenen Kanal (`latest-arm64`), damit das ARM64-Paket nicht durch das
x64-Paket ersetzt wird.

**Android:** Die per Sideload verteilte APK prüft beim Start das neueste
GitHub-Release (`src/app/aktualisierung.tsx`), vergleicht die Versionen und zeigt
ein Banner; Download und Installation starten erst auf Tippen über das native
Plugin `AppUpdate` und den Paketinstaller des Systems. Fehler führen still zu
„kein Update". Der Abruf an `api.github.com` steht nicht in `connect-src` der
ausgelieferten CSP (5.3); nach der Policy blockiert die Seite ihn. Ob die Prüfung
im ausgelieferten Paket greift, ist am Gerät zu prüfen — bis dahin sollte die
Organisation neue Android-Versionen aktiv beziehen (M8).

**Web/PWA:** Der Service Worker holt neue Fassungen von der eigenen Herkunft und
meldet sie über ein Banner.

## 6. IT-Grundschutz-Check (Ist-Soll-Vergleich)

Auswahl der einschlägigen Bausteine, soweit aus dem Quellcode heraus bewertbar.
Kein vollständiges Audit — Bausteine mit organisatorischem Schwerpunkt (z. B.
ORP.1 Organisation, INF.1 Gebäude) sind nicht Gegenstand dieses Dokuments.

### 6.1 APP.1.4 Mobile Anwendungen (Client) / APP.1.1 Client-Anwendungen allgemein

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Minimale Rechtevergabe der Anwendung | Erfüllt | `electron/main.js`: nur `media`, `clipboard-*` erlaubt |
| Schutz angezeigter Daten vor Bildschirmaufnahmen | Teilweise erfüllt | Screenshot-Sperre ab Werk an: Android (`FLAG_SECURE`) und Desktop unter Windows wirksam, macOS lückenhaft, Linux ohne; iOS nur Verdecken bei Aufnahme und im App-Umschalter, Bildschirmfotos erst nachträglich erkannt; Browser ohne Schutz. Sichtschutz „Namen verbergen" auf allen Plattformen (5.1, R10) |
| Sichere Speicherung sensibler Daten auf dem Endgerät | Teilweise erfüllt | Fachdaten in `localStorage`; privater Signaturschlüssel dort unverschlüsselt (siehe 6.3); automatische Anonymisierung nach 90 Tagen (5.5) |
| Deaktivierung nicht benötigter Schnittstellen | Erfüllt | CSP lässt als fremde Herkunft nur den GoatCounter-Host zu; Update-Prüfung des Desktops im Hauptprozess (3.4) |
| Sichere Update-Mechanismen | Teilweise erfüllt | Vorhanden (`electron-updater`, Android-Selbst-Update); Windows- und Linux-Pakete unsigniert, Android-APK signiert (siehe 6.4); Android-Prüfung steht im Widerspruch zur CSP (5.6) |
| Zusage „offline bereit" entspricht dem Gerätezustand | Erfüllt | Bricht das Erstladen ab und verwirft der Browser die Service-Worker-Registrierung, registriert die Seite beim `online`-Ereignis und bei stehendem Zähler neu (`src/app/offline-bereit.ts`); fehlt die Registrierung, steht „Laden abgebrochen … mit Netz einmal neu laden" mit Knopf. Ohne geladenen PDF-Baustein nennt „PDF erzeugen" den QR-Code als Weg |
| Offline-Vorrat wird vollständig und ehrlich nachgeladen | Erfüllt | Zwei Stufen (`vite.config.ts`, `scripts/precache-aufteilung.ts`): Precache des Kerns, danach Nachladen von Übungsbögen, Themenseiten und Fotos in den Cache `eeb-zusatz` (`src/app/offline-vorrat.ts`: Wiederholung mit wachsender Pause, Zeitgrenze 20 s je Abruf, Aufgabe nach acht Versuchen je Datei; hakt es, sagt die Zeile es). Übungsbögen der THW-Ortsverbände und der Wachen liegen nur auf Abruf im Cache `eeb-ov-beispiele`; ohne Netz fehlen nur noch nicht geöffnete Bögen dieser Ordner, Startseite und Dialog sagen das (für den Einsatz unkritisch). Themenseiten kommen per `StaleWhileRevalidate` aus dem Gerät; die Vorratsliste netzzuerst mit 1 s Zeitgrenze. Der Blanko-Vordruck gehört zum Vorrat. Der Build prüft Umfang und Vorladeliste (`npm run bundle-budget`) |

### 6.2 SYS.2.1 Allgemeiner Client / CON.10 Entwicklung von Webanwendungen

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Content-Security-Policy zur Reduktion der Angriffsfläche | Erfüllt (Skript) / bewusster Rest (Style) | `script-src` ohne `'unsafe-inline'`, Inline-Blöcke per `sha256`-Hash freigegeben; `style-src` behält `'unsafe-inline'` wegen der `style`-Attribute von React (siehe 5.3) |
| Eingabevalidierung / Schutz vor Injection | Erfüllt (für die geprüften Exportpfade) | CSV-Formel-Injection-Schutz (`src/app/csv.ts`); PDF-Texte über `winAnsiText` |
| Robustheit gegenüber fehlerhaften/böswilligen Eingabedaten | Erfüllt | Dekomprimierung importierter QR-/Link-/Dateidaten läuft über `inflateRawBegrenzt` (`src/app/hilfen.ts`) mit Obergrenze `MAX_ENTPACKT = 4 MiB`: Die Streaming-Fassung prüft die entpackte Größe stückweise und bricht mit `RangeError` ab, bevor der Speicher vollläuft. Die Grenze sitzt beim hineingereichten Kompressor (`browserKompressor`), nicht im Codec (`vendor/eeb-format/src/codec.ts`). Word-Import und Personalstamm-Import nutzen dieselbe Funktion mit eigenen Deckeln (8 MiB bzw. 40 MB) und Dateigrößengrenzen (25 MiB bzw. 10 MB), siehe 5.4 |
| Pflichtfelder von Bögen aus Dateien, Entwürfen und Speicher | Erfüllt | `src/app/bogen-pruefung.ts`: Harmloses (fehlender Einheitstyp, Listen, Namen) wird ergänzt, Unbrauchbares (Einheit, Stand, Einsatzzeitraum, Personenliste) mit Ursache abgelehnt — an den Datei-Eingängen, beim Entwurf und beim Lesen gespeicherter Vorlagen und Sammlungen; Unlesbares wird beiseitegelegt statt überschrieben (3.3 D2l, D2r) |
| Fangnetz bei Abstürzen der Ansicht | Erfüllt | `src/app/fehlerfaenger.tsx` um die ganze App: deutsche Meldung, Neu laden, Zur Startseite, „Daten sichern" (Datei mit allen `eeb.`-Einträgen) und, mit Rückfrage, „Alle Daten löschen" |
| Kontextisolation bei hybriden Apps (Electron/Capacitor) | Erfüllt | `contextIsolation`, `sandbox`, `nodeIntegration: false` für alle Fenster; Preload reicht über `contextBridge` nur Plattform und Sperr-Schalter, IPC mit Absender- und Typprüfung (5.1) |

### 6.3 CON.8 Software-Entwicklung / Kryptokonzept

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Dokumentiertes Schlüsselkonzept | Erfüllt | Trust-Modell in `docs/datenmodell.md` explizit beschrieben |
| Schutz privater Schlüssel gegen unbefugten Zugriff | Nicht erfüllt | Privater Ed25519-Schlüssel liegt als Klartext-Hex im `localStorage` (`eeb.geraeteschluessel.v1`) — jede Anwendung/jeder Prozess mit Zugriff auf den Browser-/App-Speicher des Geräts kann ihn auslesen; er steht auch in jeder Sicherungsdatei |
| Sichere kryptografische Verfahren | Erfüllt | Ed25519 ist ein etabliertes, als sicher geltendes Verfahren |
| Schlüsselwechsel bei Kompromittierungsverdacht möglich | Erfüllt | „Geräteschlüssel neu erzeugen" in der Fußzeile (`fusszeile.tsx`, `src/app/geraete-schluessel.ts`): Rückfrage, dann neues Schlüsselpaar samt Anzeige der neuen Kurzform. Kein Widerruf des alten Schlüssels — Empfänger müssen die Kurzform neu abgleichen (TOFU-Modell, keine PKI) |

### 6.4 OPS.1.1.6 Software-Tests und Freigaben / Software-Lieferkette

| Anforderung (sinngemäß) | Status | Fundstelle/Anmerkung |
| --- | --- | --- |
| Automatisierte Tests vor Veröffentlichung | Erfüllt | GitHub-Actions-Workflow `ci.yml` (Typprüfung, Unit-Tests via Vitest, Build, Bundle-Budget, E2E via Cucumber/Playwright); `release.yml` setzt den Prüf-Job vor alle Paketbauten |
| Signierte/verifizierbare Auslieferungspakete | Teilweise erfüllt | Android-APK mit dem Keystore aus den CI-Secrets signiert. Windows-Installer (NSIS) und Linux-Pakete entstehen in `release.yml` ohne Code-Signatur. macOS-Signatur und -Notarisierung sind vorgesehen und greifen nur mit hinterlegten Secrets; der macOS-Job ist stillgelegt (`if: false`) |
| Versionierte, nachvollziehbare Abhängigkeiten | Erfüllt | `package-lock.json` je Teilprojekt/Submodul, Versionen gepinnt; Submodule über `file:` eingebunden |
| Regelmäßige Prüfung auf bekannte Schwachstellen in Abhängigkeiten (SCA) | Erfüllt | `.github/dependabot.yml`: wöchentlich montags über npm und GitHub-Actions, `@bos/*` ausgenommen (Submodule). `npm audit --omit=dev --audit-level=high` blockiert in `ci.yml` und `release.yml` über die Laufzeit-Abhängigkeiten; `npm audit` über das Bau-/Testwerkzeug läuft als Hinweis ohne Blockade. Transitive Schwachstellen ohne direkten Fix werden über gezielte `overrides` in `package.json` geschlossen (glob, minimatch; beide Bau-/Testwerkzeug) |
| Stückliste der ausgelieferten Software (SBOM) | Erfüllt | `npm run sbom` (`scripts/sbom.ts`) erzeugt CycloneDX 1.6 aus den fünf `package-lock.json`; in CI und Release als Artefakt |
| Absicherung der CI-Actions | Erfüllt | Die einzige Fremd-Action außerhalb von `actions/*` mit Schreibrecht (`softprops/action-gh-release`) ist auf einen Commit-Hash gepinnt; Dependabot hebt Hash und Versionskommentar gemeinsam |
| Dokumentierter Meldeweg für Schwachstellen | Erfüllt | `SECURITY.md` im Hauptrepository: Geltungsbereich (Hauptrepo + die vier `vendor/`-Submodule), Private Vulnerability Reporting auf GitHub bzw. E-Mail, angestrebte Fristen (7 Tage Eingangsbestätigung, 30 Tage Einschätzung, Veröffentlichung nach Fix bzw. spätestens nach 90 Tagen) |

Anmerkungen zur Lieferkette:

- **Offener Befund deepmerge** (≤ 4.3.1, GHSA-gcqx-w48m-w2h4, Einstufung
  niedrig): Eine korrigierte Version gibt es nicht. Das Paket kommt nur über das
  Bauwerkzeug herein (vite-plugin-pwa, darüber workbox-build und
  @rollup/plugin-node-resolve), `npm audit --omit=dev` ist davon nicht
  betroffen, im ausgelieferten Bundle steckt kein deepmerge. Der einzige Aufruf
  verschmilzt die fest eingebauten Voreinstellungen des Plugins, keine von außen
  kommenden Objekte. Ein `overrides` auf eine Version vor 4.2.0 entfernte den
  dort eingeführten Prototyp-Schutz und scheidet aus. Der Befund wird als
  tragbares Risiko geführt, bis upstream eine korrigierte Version erscheint.
- **Capacitor/iOS:** Capacitor steht auf 8.6.0, die iOS-Paketauflösung auf
  capacitor-swift-pm 8.6.0. Die Swift-Paketauflösung wird von Dependabot
  mitgeprüft, ist aber nicht im npm-Lockfile enthalten und muss beim Heben von
  `@capacitor/ios` mit `npx cap update ios` nachgezogen werden. Ältere Stände
  der Swift-Pakete erlaubten über das interne HTTP-Proxy-Präfix das Laden
  fremder Inhalte mit dem Ursprung der App (Zugriff auf `localStorage` und
  Plugins); ein Zurückfallen unter 8.6.0 ist deshalb zu vermeiden.
- **Datenquellen der Übungsbögen:** Die Einheitenlisten der THW-Ortsverbände
  (thw.blafusel.de, inoffiziell) und der niedersächsischen Wachen
  (bos-fahrzeuge.info; Angaben zu Dienstfahrzeugen, Personen erfunden) werden
  nur beim Erzeugen abgerufen und als Dateien ins Repository gelegt; sie sind
  keine Laufzeit-Abhängigkeit.
- **Portierungen:** Der VBA-Leser des Formats (`vendor/eeb-format/ports/vba`)
  liest Bögen bis Schema 13; er wird von Hand gepflegt und in der CI gegen das
  Vokabular geprüft (`npm run vokabular:excel-vba -- --pruefen`).

## 7. Ergänzende Risikoanalyse (BSI-Standard 200-3, Auswahl)

| # | Gefährdung | Betroffenes Zielobjekt | Eintrittswahrscheinlichkeit | Schadenshöhe | Gesamt |
| --- | --- | --- | --- | --- | --- |
| R1 | Verlust/Diebstahl eines Geräts mit ungesperrtem Zugriff | D1–D4 (alle lokalen Daten, einschließlich Personalstamm D2q und Altbestand) | Mittel (Einsatzgeräte werden im Feld mitgeführt) | Hoch (Zugriff auf lokal gespeicherte Bögen, Vorlagen, Personalstamm, Absenderkarte, Signaturschlüssel); begrenzt durch die Datenschutzfrist, nach der Personaldaten in Bögen nur aus den letzten 90 Tagen vorliegen — Vorlagen und Personalstamm sind davon ausgenommen | **Hoch** |
| R2 | Dekomprimierungs-Angriff über präparierte Importdaten (QR, Link, Datei, Word, .xlsx) | A1–A4 (Anwendungsverfügbarkeit) | Sehr niedrig (alle Eingänge entpacken mit Obergrenze: 4 MiB, Word 8 MiB, Personalstamm 40 MB; Dateigrößen begrenzt) | Niedrig (Abbruch mit Fehlermeldung; kein Datenabfluss) | Sehr niedrig |
| R3 | Diebstahl/Auslesen des unverschlüsselten privaten Signaturschlüssels (Gerätespeicher oder Sicherungsdatei) | D4, K1 (Vertrauenskette) | Niedrig (setzt Gerätezugriff, Zugriff auf eine Sicherungsdatei oder eine weitere Schwachstelle voraus) | Mittel (Signieren im Namen des Geräts möglich) — durch den Austausch des Schlüssels (M3) auf die Zeit bis zum Bemerken und den Abgleich der neuen Kurzform begrenzbar | Niedrig-Mittel |
| R4 | Cross-Site-Scripting trotz CSP | A1 (Web-App) | Niedrig (`script-src` gibt Inline-Skripte nur per Hash frei; Restfläche ist `style-src 'unsafe-inline'`) | Mittel (potenziell Zugriff auf `localStorage`-Inhalte des Tabs) | Niedrig |
| R5 | Kompromittierte oder manipulierte Build-/Update-Kette | B1–B5, A2/A3 | Niedrig | Hoch (Verteilung manipulierter Software an alle Nutzer der Plattform; Windows- und Linux-Pakete tragen keine Code-Signatur, an der ein Empfänger die Herkunft prüfen könnte) | Mittel-Hoch |
| R6 | Fehlende Signaturprüfung durch den Empfänger (Signatur ist optional, die Prüfung blockiert den Import nicht) | K1, D1/D2 (Integrität) | Mittel (Prüfung könnte im Alltag vernachlässigt werden) | Mittel (unbemerkt verfälschte Meldung erreicht die Führung) | Mittel |
| R7 | Ausfall der Anwendung im Einsatzfall (Gerätedefekt, Akku, Absturz) | A1–A4 (Verfügbarkeit) | Mittel (typisches Einsatzrisiko) | Hoch | **Hoch** (durch Papierform als Rückfallebene begrenzt) |
| R8 | Bekannte Schwachstellen in Abhängigkeiten bleiben unbemerkt | B3 (Software-Lieferkette) | Niedrig (Dependabot wöchentlich, `npm audit` blockierend im CI, SBOM je Release) | Mittel | Niedrig |
| R9 | Verlust lokaler Daten ohne Zutun des Nutzers: Browser räumt Website-Daten, Speicher voll oder gesperrt, falsch gehende Geräteuhr löst Fristen aus, Einspielen einer Sicherung ersetzt den Bestand | D1, D2, D2q, D4 (Verfügbarkeit) | Niedrig-Mittel (die App bittet um dauerhaften Speicher, meldet Schreibfehler, hält Fristen bei Uhrsprüngen ab 60 Tagen an und fragt vor dem Ersetzen; Sprünge darunter zählen als echte Zeit) | Mittel (Vorlagen, angefangener Bogen und Geräteschlüssel liegen nur auf diesem Gerät) | Mittel |
| R10 | Bildschirmfotos und -aufnahmen mit Personaldaten gelangen in die Fotogalerie, in deren automatische Cloud-Sicherung und in Messenger; Datenschutzfrist und Löschwege der App erreichen sie nicht. Kein neuer Zugriffsweg: Wer das Bild macht, kann denselben Bogen auch exportieren | D1, D2, D2q (Vertraulichkeit) | Mittel (Bildschirmfoto ist der schnellste Weg, etwas weiterzugeben); auf Android und Windows durch die Sperre niedrig, auf iOS, macOS und im Browser nicht technisch begrenzt | Mittel (Namen, teils Rufnummern bei einem Cloud-Anbieter, ohne Frist) | Mittel |

**Höchste Einzelrisiken:** R1 (Geräteverlust) und R7 (Ausfall im Einsatzfall)
sind primär organisatorisch/physisch bedingt; R5 (Lieferkette) liegt in der
Verantwortung des Projektbetreibers, nicht der einzelnen einsetzenden
Organisation.

## 8. Maßnahmenplan

| # | Bezug | Maßnahme | Art | Verantwortlich | Priorität |
| --- | --- | --- | --- | --- | --- |
| M1 | R1 | Verbindliche Geräte-Bildschirmsperre (PIN/Biometrie) als Dienstanweisung; wo verfügbar, Festplatten-/Profilverschlüsselung (BitLocker/FileVault/Android-Geräteverschlüsselung) aktivieren | Organisatorisch/technisch (Geräte-Ebene) | `[Organisation/IT-Verantwortliche/r]` | Hoch |
| M2 | R2 | Ausgabegrößenbegrenzung bei der Dekomprimierung: umgesetzt (`inflateRawBegrenzt`, `MAX_ENTPACKT = 4 MiB`; eigene Deckel für Word- und Personalstamm-Import). Für die Organisation: eine aktuelle App-Version einsetzen | Technisch (umgesetzt) | `[Projektbetreiber/Maintainer]` | Umgesetzt |
| M3 | R3 | Der private Schlüssel liegt unverschlüsselt; Geräteabsicherung (M1) ist die kompensierende Maßnahme. Die App stellt den Austausch bereit: „Geräteschlüssel neu erzeugen" in der Fußzeile verwirft den Schlüssel und erzeugt sofort ein neues Paar; die neue Kurzform steht in der Bestätigung. Für die Organisation: festlegen, wer einen Kompromittierungsverdacht meldet, wer den Knopf drückt und wie die neue Kurzform den Empfängern (Meldekopf, Führungsstelle) bekannt gemacht wird. Offen beim Projekt: verschlüsselte Ablage des Schlüssels | Organisatorisch (technische Grundlage vorhanden) | `[Organisation]` | Mittel |
| M4 | R4 | Hash-Freigabe der Inline-Skripte in `script-src`: umgesetzt. Offen ist `style-src 'unsafe-inline'` (bewusster Trade-off wegen der `style`-Attribute von React) | Technisch (Software-Weiterentwicklung) | `[Projektbetreiber/Maintainer]` | Niedrig |
| M5 | R5 | Bezugsquelle verbindlich vorgeben (offizielles GitHub-Release bzw. erfassungsbogen.app) und Prüfsummen der eingesetzten Pakete dokumentieren, da Windows- und Linux-Pakete unsigniert sind; signierte Pakete einsetzen, sobald verfügbar. Für macOS steht kein Paket bereit — dort die Web-App/PWA nutzen | Organisatorisch | `[Organisation/IT-Verantwortliche/r]` | Hoch |
| M6 | R6 | Dienstanweisung: Empfangene Bögen mit Signatur sind vor der Weiterverwendung auf gültige Signatur zu prüfen (Anzeige am Siegel in der Übersicht), insbesondere bei mehrstufiger Weitergabe; Kurzformen der Geräteschlüssel der eigenen Einheiten bekannt machen | Organisatorisch | `[Organisation/Meldekopf-Verantwortliche/r]` | Mittel |
| M7 | R7 | Papierform als dokumentierte Rückfallebene vorhalten (Blanko-Vordruck der App, ausgedruckt); Ladezustand der Einsatzgeräte vor Einsatzbeginn prüfen; Zusatzakkus vorhalten | Organisatorisch | `[Organisation/Einsatzleitung]` | Hoch |
| M8 | R8 | Beim Projekt umgesetzt: Dependabot, `npm audit` im CI, SBOM. Für die Organisation: regelmäßige (mind. halbjährliche) Prüfung neuer App-Versionen auf sicherheitsrelevante Änderungen (Änderungsverlauf „Was ist neu" in der App, Git-Historie dieses Dokuments); als Prozess dokumentieren. Android-Geräte dabei aktiv auf die aktuelle Version bringen (5.6) | Organisatorisch | `[Organisation]` | Mittel |
| M9 | Alle | Sensibilisierung der Einsatzkräfte: Kurzunterweisung zu Gerätesperre, Umgang mit exportierten Ausdrucken/Dateien/Links (D5, D6) und Meldung bei Geräteverlust | Organisatorisch/personell | `[Organisation/Ausbildungsverantwortliche/r]` | Hoch |
| M10 | — | Diesen Entwurf durch die/den IT-Sicherheitsbeauftragte/n prüfen und freigeben lassen, insbesondere die Schutzbedarfsfeststellung (Abschnitt 4) | Organisatorisch | `[IT-Sicherheitsbeauftragte/r]` | Hoch |
| M11 | R9, R3 | Datensicherung regeln: wer wann „Sicherung erstellen…" auslöst (die App erinnert nach drei Tagen, erzwingt nichts) und wo die Datei liegt. Die Sicherungsdatei enthält alle Fachdaten und den privaten Geräteschlüssel unverschlüsselt und ist entsprechend geschützt abzulegen. Web-App auf Mobilgeräten installieren (Home-Bildschirm) und dauerhaften Speicher zulassen; Datum und Uhrzeit der Geräte automatisch stellen lassen | Organisatorisch | `[Organisation/IT-Verantwortliche/r]` | Mittel |
| M12 | R1 | Umgang mit dem lokalen Personalstamm regeln: auf welchen Geräten die Helferliste eingelesen wird, ob mit Rufnummern, Geschlecht und Ernährung, und wann sie zu löschen ist („Personalstamm löschen…"; die App erinnert nach 90 Tagen). Altbestand an Einsatz-Sammlungen auf Geräten in die Meldekopf-App übernehmen oder löschen | Organisatorisch | `[Organisation]` | Mittel |
| M13 | R10 | Dienstanweisung: keine Bildschirmfotos oder -aufnahmen mit Personaldaten; nötige Bilder für Fehlermeldung oder Schulung mit Übungsbogen oder „Namen verbergen" anfertigen und danach löschen; ein Bildschirmfoto mit Namen wie einen Export behandeln (M9). Auf Dienstgeräten die automatische Cloud-Sicherung der Fotogalerie abschalten oder auf freigegebenen Speicher legen; die Screenshot-Sperre der App nicht dauerhaft abschalten. Technisch umgesetzt: Sperre und Sichtschutz (5.1) | Organisatorisch / Technisch (umgesetzt) | `[Organisation/IT-Verantwortliche/r]` | Mittel |

## 9. Restrisikobetrachtung

Unter der Voraussetzung, dass die organisatorischen Maßnahmen M1, M5, M7, M9,
M11 und M13 umgesetzt werden, verbleibt nach Einschätzung dieses Entwurfs ein **mittleres
bis geringes Restrisiko**. Die verbleibenden technischen Schwachstellen (R3
Schlüsselspeicherung, R4 Restfläche `style-src`, R5 unsignierte Desktop-Pakete)
liegen im Verantwortungsbereich der Software-Weiterentwicklung und sind durch die
einsetzende Organisation nicht direkt behebbar, wohl aber durch M1, M3 und M5 zu
kompensieren. Bildschirmfotos (R10) lassen sich auf iOS, macOS und im Browser
technisch nicht verhindern; dort trägt allein M13.

Diese Einschätzung ersetzt keine rechtliche oder technische Prüfung.

## 10. Fortschreibung

Dieses Konzept ist zu überprüfen und fortzuschreiben:

- bei jeder App-Version mit sicherheitsrelevanten Änderungen (z. B. Änderungen an
  CSP, Schlüsselverwaltung, Speicherorten, Netzverbindungen, Exportwegen,
  Update-Mechanismus),
- bei wesentlichen Änderungen des Einsatzkontexts oder Geräteumfangs der
  einsetzenden Organisation,
- mindestens jedoch einmal jährlich.

Änderungen werden im betroffenen Kapitel eingearbeitet, sodass der Text den
jeweiligen Ist-Stand beschreibt; das Datum im Kopf und in den Rahmendaten wird
dabei angehoben. Ein Änderungsprotokoll führt das Dokument nicht — der Verlauf
ergibt sich aus der Git-Historie der Datei. Kennungen von Zielobjekten, Risiken
und Maßnahmen bleiben stabil; Neues bekommt die nächste freie Kennung.

## 11. Ergebnis und Freigabe

| Rolle | Name | Datum | Unterschrift |
| --- | --- | --- | --- |
| IT-Sicherheitsbeauftragte/r | `[Name]` | | |
| Verantwortlich/Leitung | `[Name]` | | |
| Ersteller/in dieses Entwurfs | KI-gestützte Analyse (Claude), fachlich zu verantworten durch `[Name]` | 2026-11-26 | |

## Anhang: Herangezogene Quellen

Dieses Sicherheitskonzept stützt sich ausschließlich auf öffentlich einsehbaren
Quellcode und dessen Code-Kommentare/Dokumentation:

- `electron/main.js` — Electron-Sicherheitskonfiguration (Sandbox, Rechtevergabe, externe Navigation, Auto-Update)
- `vite.config.ts` — Content-Security-Policy des Produktions-Builds, Service-Worker-Konfiguration
- `vendor/eeb-format/src/signatur.ts`, `src/app/geraete-schluessel.ts` — Schlüsselerzeugung, Signatur, Speicherung
- `vendor/eeb-format/src/codec.ts`, `model.ts`, `datenschutzfrist.ts` — Payload-Format, Schema, Datenschutzfrist
- `src/app/hilfen.ts`, `bogen-pruefung.ts`, `word-bogen.ts`, `personalstamm-import.ts` — Entpack-Grenzen, Eingangsprüfung, Importwege
- `src/app/csv.ts`, `bogen-csv.ts`, `pdf.ts` — Exportformate und deren Absicherung
- `src/app/sicherung.ts`, `vorlagen.ts`, `entwurf.ts`, `unlesbar.ts`, `datenschutz-uhr.ts`, `uhr-korrektur.ts` — Datensicherung, Löschwege, Papierkorb, Fristen
- `src/app/meldekopf-app.ts`, `meldekopf-altbestand.ts`, `meldekopf-weg.tsx` — Verweis auf die Meldekopf-App, Altbestand
- `src/app/statistik.ts`, `aktualisierung.tsx`, `offline-vorrat.ts`, `offline-bereit.ts` — Netzverbindungen, Update-Prüfung, Offline-Vorrat
- `docs/datenmodell.md` — Datenmodell, Trust-Modell, QR-Payload-Format
- `package.json` (Feld `build`, `overrides`), `.github/workflows/release.yml`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.gitlab-ci.yml`, `SECURITY.md` — Build-, Signier- und CI/CD-Konfiguration, Lieferkette
- `PRODUCT.md`, `docs/entwicklung.md` — Produktkontext und technische Gesamtübersicht
- [Arc42-Architekturdokumentation](arc42-architektur.md) dieses Projekts
