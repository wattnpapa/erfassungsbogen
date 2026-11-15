# Audit „Helfer im Feld“, Runde 13 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `7637e61` (`main` nach Runde 12).

Zählung: **P0 0 · P1 0 · P2 0 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Die bekannten Grenzen und Reste aus den
Runden 6 bis 12 (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3,
R9-G5, R8-H5/S4 einschließlich der Tipp-Sperre nach einem Schrittwechsel, leere
Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt das Neuladen nicht,
Tabellenzeilenhöhe bei 180 × 320, R11-S4, R11-H2 „Passende Typen zeigen“, R11-K2,
R11-A2, R11-A5, R11-M1, R11-M3, R12-W3, R12-H3, R12-O2, R12-O4, R12-G3) wurden
nicht neu gemeldet.

## Prüfaufbau

Playwright/Chromium (`chromium.launch()` ohne Optionen, globales Modul, da die
Projektkopie keinen passenden Browser fand), `isMobile`/`hasTouch`, Locale
de-DE, Telefon 390 × 844 und 360 × 640; einzelne Läufe quer (640 × 360) und mit
auf 300 px Höhe verkleinertem Fenster (Bildschirmtastatur nachgestellt). Jeder
Lauf mit frischem Kontext. Einsatzdaten: die Übungsbögen unter
`examples/thw/` (Kopien mit `uebung: false`, heutiges Datum), über „Bögen
einlesen…“ in eine frisch angelegte Sammlung eingespielt (3, 4, 5 und 8 Bögen).

Durchgespielt: (1) eigener Bogen: Einheit mit Ort und Typ, Einsatz mit
„Einsatzbeginn eintragen“, Personal, Fahrzeuge, Sofortbedarf, Übersicht,
„Bogen übergeben…“ (QR im Vollbild, hoch und quer), „Als Vorlage speichern“,
„Bogen schließen“, „Einsatz vorbereiten“ aus der Vorlage, Neuladen 100 ms nach
dem Tippen, Empfang eines Links bei angefangenem Entwurf; (2) Meldekopf:
Sammlung anlegen, Dateien einlesen (auch Müll, falsches JSON, doppelte und
gemischte Dateien), „Zur Kenntnis genommen“, Aufklappen, „Details“,
„Aufteilen…“, „Verschieben…“, „Entfernen“, „Stärke ändern…“, „Abrücken“,
Suche, Lageblatt (Text, Schriftgröße und Summen mit `pdftotext` geprüft),
Sammel-PDF, „Einsatz löschen…“, Einsatz-Schnellerfassung „Nur Stärke“ bis zur
Rückfrage „Nur Sollplätze“; (3) Offline: Dienstarbeiter aktiv, Netz getrennt,
Neuladen, Anleitung und Themenseiten aus dem Zwischenspeicher; (4) Dialoge
„Datensicherung“, „Übungsbögen“, „Geräteschlüssel“, „Alle Daten löschen“;
(5) Eingabe-Attribute aller Felder der Schritte 1 bis 5.

**Nicht prüfbar** und deshalb *nicht verifiziert*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am Display, Kamera-Scan, native Datums- und
Zeitauswahl, echte Bildschirmtastatur samt Autokorrektur, WebKit/Safari, echtes
Drucken (die PDF-Datei wurde als Text und Größe gelesen, nicht gedruckt).

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse.
Neu gefunden wurden drei Kleinigkeiten, alle in der Eingabe der Einheit
(Suche und Tastatur). Der Kernweg trägt.

## Nachprüfung der Behebungen aus Runde 12

- **R12-H1 Bedarfszeile:** „Verpflegung 69 · Unterbringung 27 Personen · Diesel
  610 l · Ruhezeit 4 Einheiten“ mit Leerzeichen; Lageblatt gleich. Hält.
- **R12-H2 „Stärke ändern…“:** Zeile „Gesamt: 6 (bisher 11)“ aktualisiert sich
  beim Tippen. Hält.
- **R12-K1/L1 Kontrast der Alterszeile:** gerechnet 9,14 : 1 (Standard, Feld,
  Dunkel) und 5,69 : 1 (Nacht). Hält.
- **R12-W1 Rückruf:** Telefonnummern der Ansprechperson und E-Mail-Adressen der
  Stellen in „Details“ sind `tel:`- und `mailto:`-Verknüpfungen, 44 px hoch.
  Hält.
- **R12-W3 „Weitergegeben“ (teilweise):** Satz „Weitergabe-Datei erzeugt …
  Empfang nicht bestätigt“ und der Hinweis, dass die Weitergabe nicht als
  Lieferung an den Stab zählt, stehen wie beschrieben. Bleibt bekannt.
- **R12-H3 Ortsname:** Die Vorschlagsliste zeigt „74523 Schwäbisch Hall“
  getrennt; der Eintrag im Submodul bleibt bekannt.
- **Nicht gesondert erneut geprüft:** R12-E1 bis E5, R12-D1 bis D3, R12-O1/O3,
  R12-S1/S2, R12-G1/G2, R12-A1.

## Befunde

### R13-H1 [P3] Einheitstyp-Suche: „TZ“ findet den Technischen Zug zuletzt, „BGr“ und „1. BGr“ nichts

**Evidence:** Observed (Trefferlisten); die Alltagsschreibweisen sind eine
*Annahme* aus THW-Sprachgebrauch.
**Ort:** Schritt 1, Feld „Einheitstyp“ (Vorschlagsliste).
**Beobachtung:** „TZ“ liefert neun Treffer in dieser Reihenfolge: „B (ASH)
Bergungsgruppe (Abstützsystem Holz)“, „ENT Einsatznachsorgeteam“, „FGr F
Fachgruppe Führungsunterstützung“, … und erst als letzten „ZTr TZ Zugtrupp
Technischer Zug“. Die Treffer vor ihm enthalten „tz“ mitten im Wort
(„Abstü**tz**system“, „Unterstü**tz**ung“). Ebenso „OV“: erst „FGr E
Fachgruppe Elektr**ov**ersorgung“, dann „OV-Stab“. Eingaben „BGr“, „1. BGr“,
„1.BGr“ und „1. Bergungsgruppe“ ergeben **keinen** Treffer (nur „Bergungsgruppe“
und „B“ führen zu „B Bergungsgruppe“); die Bogenzeile lautet dann „THW
Biberach/Baden 1. BGr“ mit dem Hinweis „Einheitstyp „1. BGr“ nicht erkannt …
fehlen taktisches Zeichen und Soll-Vergleich“.
**Folge:** Wer die Kurzform tippt, die im Ortsverband gebräuchlich ist, sieht
entweder eine Liste, in der der gemeinte Eintrag unten steht (und beim
Antippen des ersten Treffers die falsche Einheit nimmt), oder gar keine Liste.
Der Hinweis nach dem Eintippen ist ehrlich, hilft aber nicht weiter: Er nennt
nicht, wie der Typ heißen müsste. Folge ist ein Bogen ohne taktisches Zeichen
und ohne Soll-Vergleich oder ein Typ, der nicht zur Einheit passt.
**Empfehlung:** Treffer am Wortanfang und auf das Kürzel (ganzes Wort) vor
Treffern mitten im Wort einsortieren; gebräuchliche Kurzformen („BGr“, „1./2.
BGr“, „TZ“, „FZ“) als Suchbegriffe am Eintrag hinterlegen; bei „nicht erkannt“
die zwei nächsten Typen als Knöpfe anbieten.
**Nachprüfung:** „TZ“ tippen: „ZTr TZ Zugtrupp Technischer Zug“ steht oben.
„1. BGr“ tippen: „B Bergungsgruppe“ wird vorgeschlagen.

### R13-H2 [P3] Ort der Einheit: „Neu Ulm“, „Baden Baden“ und weitere Namen mit Bindestrich ohne Treffer

**Evidence:** Observed.
**Ort:** Schritt 1, Feld „Ort der Einheit (Pflicht)“, Vorschlagsliste.
**Beobachtung:** Ohne Treffer bleiben „Neu Ulm“ (Eintrag „Neu-Ulm“ liegt vor),
„Baden Baden“, „Villingen Schwenningen“, „Garmisch Partenkirchen“, „Hamburg
Altona“, „Köln Porz“, „Oberhausen Rheinhausen“. Es erscheint „Kein Ort mit
diesem Namen in der Liste — Schreibweise prüfen. Ein Ortsverband, den es dort
nicht gibt, darf so stehen bleiben …“. Mit Bindestrich („Neu-Ulm“) oder nur dem
ersten Wortteil („Villingen“, „Garmisch“) kommt der Treffer. Die Suche in der
Einheitenliste des Meldekopfs kennt dagegen schon Varianten („Biberach Riss“,
„Hassmersheim“, „THW 80103“ für „THW-80103“).
**Folge:** Der Helfer hat den Ort richtig geschrieben und bekommt die Meldung
„Schreibweise prüfen“. Er nimmt an, sein Ortsverband stehe nicht im
Verzeichnis, und lässt den Freitext stehen: Dienststellen-Kürzel, Regionalbereich
und Landesverband samt Telefon und E-Mail werden dann nicht vorbelegt und
müssen von Hand getippt werden, mit der Zahl der Fehler, die das am Funktisch
mit sich bringt. Kein Datenverlust.
**Empfehlung:** Bindestrich, Leerzeichen und Schrägstrich bei der Suche
gleichbehandeln (wie die Einheitensuche es tut); den Hinweis um „Bindestrich
beachten“ ergänzen, solange das nicht greift.
**Nachprüfung:** „Neu Ulm“ und „Baden Baden“ tippen: „Neu-Ulm“ bzw.
„Baden-Baden“ werden vorgeschlagen.

### R13-H3 [P3] Autokorrektur und Rechtschreibprüfung bei Namen, Ort und Einheitstyp nicht abgeschaltet

**Evidence:** Observed (Eingabe-Attribute); die Wirkung auf einer echten
Telefontastatur ist **not verified**.
**Ort:** Schritt 1 „Ort der Einheit“, „Einheitstyp“, „Organisationsname“;
Schritt 3 „Vorname“ und „Nachname“ aller Personen; Meldekopf „Zug zuordnen“,
„Auftrag/Notiz“ und das Suchfeld der Einheitenliste.
**Beobachtung:** Diese Felder tragen weder `autocorrect="off"` noch
`spellcheck="false"`; nur Kennzeichen, Kennzahlen und Dienststellen-Kürzel haben
sie (R2-M6). Ort und Einheitstyp sind Listenfelder mit Fachwörtern und
Kürzeln („FGr“, „GrFü“, „Biberach/Riß“, „Haßmersheim“).
**Folge:** Likely: Die Tastatur des Telefons unterstreicht Familiennamen, Orte
und Kürzel rot und tauscht sie beim Leertaste-Druck durch Wörterbuchwörter
aus („FGr“ wird „For“, „Kuhn“ wird „Kuh“). Am Funktisch merkt der Helfer es
erst auf dem Bogen. Im Ortsfeld verhindert die Ersetzung zusätzlich den Treffer
in der Liste.
**Empfehlung:** `autocorrect="off"` und `spellcheck="false"` auch für
Personennamen, Ort, Einheitstyp, Zug und das Suchfeld setzen; Fließtexte
(„Sonstiges“, „Bemerkung“, „Auftrag/Notiz“) dürfen bleiben.
**Nachprüfung:** Auf einem Telefon „FGr Räumen“, „Haßmersheim“ und einen
seltenen Nachnamen tippen und mit Leertaste abschließen: Der Text bleibt
unverändert, kein roter Wellenstrich.

## Was gehalten hat (nicht ändern)

- **Entwurfsrettung:** Neuladen 100 ms nach dem Tippen eines Vornamens bringt
  den Entwurf mit „Fortsetzen / Verwerfen“ zurück, der Name ist erhalten.
- **Empfang eines Links bei angefangenem Entwurf:** Dialog „Empfangenen Bogen
  öffnen?“ nennt den Bogen, der ersetzt wird, den Rückholweg und hat
  „Abbrechen“ als Standardknopf.
- **„Nur Stärke“:** Zwei Rückfragen („Nur die Stärke melden?“, „Nur
  Sollplätze, keine gemeldete Stärke“) fangen die vorbelegten Sollzahlen ab,
  bevor sie als gemeldete Stärke zählen.
- **Fehlerhafte Dateien:** „muell.txt“ und falsches JSON werden mit Ursache und
  Weg („PDF anfordern oder QR scannen“) abgewiesen; doppelte Datei: „0 Bögen
  aufgenommen, 1 bereits vorhanden“; gemischte Auswahl nimmt das Brauchbare und
  meldet den Rest.
- **Offline:** Neuladen ohne Netz, Anleitung und Themenseiten kommen aus dem
  Zwischenspeicher; der Bestand der Sammlung bleibt.
- **Lageblatt:** Summen (2 / 16 / 47 / 65, 18 Fahrzeuge) stimmen mit den
  Karten überein; abgerückte Einheit steht getrennt mit Uhrzeit; Tabellenschrift
  7,5 pt, Platz für Nachträge von Hand.
- **QR im Vollbild:** hoch und quer vollständig sichtbar, „Teil 1 von 2“ mit
  „Weiter zu Teil 2“.
- **Vorlage und „Einsatz vorbereiten“:** Vorabanhaken mit „Alle abwählen“, Kopfzeile
  mit Stärke, Knopf „Bogen anlegen · 9 Pers · 4 Fz“.
- **Zielgrößen:** in Assistent, Karten, Dialogen und Vollbild alles ≥ 44 px
  (Feld-Ansicht ≥ 48 px) außer den bekannten 24-px-Kästchen; kein seitliches
  Überlaufen bei 360 und 390 px.

## Verständnis-Check

- Orientierung: verstanden
- Nächste Handlung: verstanden
- Systemstatus: verstanden (gespeichert, Zeit der letzten Meldung, „zählend“
  gegen „gemeldet“, Weitergabe „Empfang nicht bestätigt“)
- Fehlerbehebung: verstanden (Rückfragen mit Folgen, Rückgängig, Entwurf,
  verständliche Dateifehler)
- Feldtauglichkeit: eingeschränkt geprüft (echte Handschuhe, Sonnenlicht,
  Kamera, Telefontastatur nicht prüfbar); soweit prüfbar geeignet
