# Audit „Helfer im Feld“, Runde 12 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `2c96abe` (`main` nach Runde 11).

Zählung: **P0 0 · P1 0 · P2 0 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Die bekannten Grenzen und Reste aus den
Runden 6 bis 11 (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3,
R9-G5, R8-H5/S4, leere Karten bei „Nur Stärke“, Rückgängig für Meldungen
überlebt das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320, R11-S4, R11-H2
„Passende Typen zeigen“, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3) wurden nicht neu
gemeldet.

## Prüfaufbau

Playwright/Chromium (`chromium.launch()` ohne Optionen, globales Modul, da die
Projektkopie keinen Browser fand), `isMobile`/`hasTouch`, Locale de-DE, Telefon
390 × 844 und 360 × 640. Jeder Lauf mit frischem Kontext. Einsatzdaten aus den
Übungsbögen unter `examples/thw/` (Kopien mit `uebung: false`, aktuellem
Stand und Zeitraum), über „Bögen einlesen…“ in eine frisch angelegte Sammlung
eingespielt (3, 4, 6 und 12 Bögen).

Durchgespielt: (1) Bogen anlegen (Einheit, Einsatz, Personal mit „Namen
einfügen…“, Fahrzeuge, Sofortbedarf, Übersicht, „Bogen übergeben…“, „Bogen
schließen“, Neuladen mit Entwurfsrettung, Browser-Zurück aus dem Dialog);
(2) Meldekopf: Sammlung anlegen, Bögen einlesen, „Zur Kenntnis genommen“ mit
Rückgängig, Suche, Karten und Tabelle, Aufklappen, „Abrücken“ mit Neuladen,
„Stärke ändern…“, „Entfernen“, „Zug zuordnen“, „Auftrag/Notiz“, Lageblatt,
Sammel-PDF, CSV, Excel, „Einsatz löschen…“, „Alle Daten löschen“, Scanner ohne
Kamera; (3) Zahlenfelder bei Sitzplätzen. Zielgrößen vermessen: in Karten,
Tabelle und Assistent außer den beiden 24-px-Kästchen (mit 44-px-Zeile) alles
≥ 44 px; kein seitliches Überlaufen bei 360 und 390 px.

**Nicht prüfbar** und deshalb *nicht verifiziert*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am Display, Kamera-Scan, native Datums- und
Zeitauswahl, echte Bildschirmtastatur samt Autokorrektur, WebKit/Safari, echtes
Drucken, die PDF-Inhalte selbst (Download wurde nur auf Dateiname und Quittung
geprüft).

## Urteil

Alle Szenarien wurden **abgeschlossen**. Der Kernweg trägt. Die vier Befunde
H1 bis H4 aus Runde 11 (Schreibweisen) halten. Neu gefunden wurden drei
Kleinigkeiten ohne Datenverlust und ohne Auswirkung auf den Ablauf.

## Nachprüfung der Behebungen aus Runde 11

- **R11-H1 Ort der Einheit:** „Hassmersheim“, „Muellheim“, „Tuebingen“,
  „Schwaebisch Hall“ liefern den Vorschlag samt Kürzel und Ebenen; ein
  unbekannter Ort zeigt „Kein Ort mit diesem Namen in der Liste — Schreibweise
  prüfen …“. Hält.
- **R11-H2 Einheitstyp:** „FGr Wasserschaden/Pumpen“ (das Beispiel im Feld),
  „FGr Wasser“ und „Wasserschaden Pumpen“ zeigen FGr WP (A) bis (C); die
  StAN-Vorbelegung („12 Personen, 4 Fahrzeuge“) mit „Vorbelegung entfernen“
  erscheint. Hält (der Knopf „Passende Typen zeigen“ bleibt bekannt offen).
- **R11-H3 Suche:** „hassmersheim“, „Riss“, „ZTr“, „OV Radolfzell“,
  „Muellheim“ finden je ihre Einheit(en). Hält.
- **R11-H4 Namen einfügen:** „van Dijk“, „von Hagen“, „de la Cruz“, „von der
  Heide“ landen als Nachname; die Tabulatorzeile ergibt Name „Hans Müller“;
  Zeilen mit Klammern werden mit Hinweis ausgespart. Hält.
- **R11-D1 Kenntnisnahme:** Quittung „Zur Kenntnis genommen: 12 Einheiten“ mit
  „Rückgängig“ (121 × 44 px) und ✕ (44 × 44 px), 8 px Abstand. Hält.
- **Abrücken:** Zeit wird gestempelt, ändert sich korrigierbar, übersteht das
  Neuladen; Summen fallen sofort („12 gemeldet · 11 zählend“). Hält.

## Befunde

### R12-H1 [P3] Kopfzeile „Bedarf“: „Unterbringung 52Personen“ ohne Leerzeichen

**Evidence:** Observed.
**Ort:** Einsatzansicht, aufgeklappter Kasten „Bedarf:“ (Zusammenfassungszeile),
sichtbar ab einer Einheit mit angeforderter Unterbringung; geprüft bei 360 und
390 px mit 4 bis 12 Bögen.
**Beobachtung:** Die Zeile lautet „Verpflegung 94 · Unterbringung 52Personen ·
Diesel 950 l · Ruhezeit 5 Einheiten“. Zahl und Wort „Personen“ sind verklebt;
im Aufklapper darunter steht dasselbe richtig getrennt („52 Personen“).
**Folge:** Die Zeile ist das Erste, was der Meldekopf zum Bedarf liest und
vorliest. „52Personen“ liest sich wie ein Kennzeichen oder eine Kennung und
bremst; in der Nacht-Ansicht und bei Handschuh-Blick auf 12-pt-Schrift noch
mehr. Kein Zahlenfehler.
**Empfehlung:** Leerzeichen zwischen Zahl und „Person/Personen“ setzen; das
Wort wie im Aufklapper behandeln.
**Nachprüfung:** Eine Einheit mit Unterbringung anfordern: Kopfzeile zeigt
„Unterbringung 52 Personen“, bei einer Person „1 Person“.

### R12-H2 [P3] „Stärke ändern…“ zeigt beim Tippen keine Gesamtzahl

**Evidence:** Observed.
**Ort:** Einsatzansicht, Karte aufklappen → „Mehr…“ → „Stärke ändern…“.
**Beobachtung:** Der Dialog nennt oben die bisherige Stärke („bisher 1 / 1 / 2 /
4“) und hat drei Felder (Führer, Unterführer, Mannschaft). Nach der Eingabe
(z. B. Mannschaft 9) erscheint nirgends die neue Gesamtzahl; sie sieht man erst
nach „Stärke übernehmen“ auf der Karte.
**Folge:** Funkmeldungen kommen oft als „1 / 1 / 9 / 11“. Wer eine Zahl
vertauscht, merkt es erst in der Karte, kann dann aber nur über denselben
Dialog korrigieren. Kein Datenverlust (die frühere Meldung liegt in der
Historie), aber ein vermeidbarer zweiter Durchgang am Funktisch.
**Empfehlung:** Unter den drei Feldern eine Zeile „Gesamt: 11 (bisher 4)“
mitführen, die sich beim Tippen aktualisiert.
**Nachprüfung:** Mannschaft von 2 auf 9 ändern: Zeile zeigt „Gesamt: 11 (bisher
4)“ vor dem Übernehmen.

### R12-H3 [P3] Ortsvorschlag „Schwäbisch Hall“ trägt „74523 SchwäbischHall“

**Evidence:** Observed.
**Ort:** Schritt 1, „Ort der Einheit“, Vorschlagsliste bei Eingabe „Schwäbisch
Hall“ oder „Schwaebisch Hall“ (Datenquelle `vendor/bos-vokabulare`, Feld
`ort` des Eintrags OSHA).
**Beobachtung:** Zweite Zeile des Vorschlags: „OSHA · 74523 SchwäbischHall“,
ohne Leerzeichen zwischen den Wörtern des Ortsnamens. Der Name selbst steht
richtig („Schwäbisch Hall“).
**Folge:** Rein kosmetisch in der Vorschlagsliste; Bogen, Kürzel und Ebenen
sind richtig. Fällt auf, weil sonst kein Eintrag so aussieht, und lässt an der
Verlässlichkeit der übrigen Verzeichnisdaten zweifeln.
**Empfehlung:** Verzeichniseintrag korrigieren (Quelle im Submodul) und im
Verzeichnis nach weiteren zusammengezogenen Ortsnamen suchen.
**Nachprüfung:** „Schwaebisch Hall“ tippen: zweite Zeile „OSHA · 74523
Schwäbisch Hall“.

## Was gehalten hat (nicht ändern)

- **Rückfragen mit Folgen:** „Meldung entfernen?“ nennt Namen, Stand, die
  Folge für die Nummern („Nr. 2–4 rücken auf“) und die Grenze von
  „Rückgängig“; „Einsatz löschen?“ nennt den Papierkorb und die 30 Tage; „Alle
  lokalen Daten löschen“ zählt auf, was verloren geht, inklusive „noch kein
  Export“ und bietet zuerst die Sicherung an; „Bogen schließen?“ sagt, dass der
  Bogen nicht gelöscht wird, und nennt den Rückholweg.
- **Entwurfsrettung:** Neuladen im Assistenten führt auf die Startseite mit
  „Fortsetzen / Verwerfen“, Stand, Stärke und dem Satz „… öffnet ihn dort, wo du
  warst“.
- **Browser-Zurück** schließt den Dialog „Bogen schließen?“, ohne den Schritt zu
  verlassen.
- **Zahlenfelder:** „Minus geht nicht“, „… ist keine Zahl — nicht übernommen“,
  „Höchstens 99 — dein Wert 500 wurde auf 99 gesetzt“; Kennzeichenfelder
  schlagen Großbuchstaben auf der Tastatur vor.
- **Quittungen der Ausgaben:** Lageblatt, Sammel-PDF, CSV und Excel melden
  inline, wohin die Datei gelegt wurde und wann sie erzeugt wurde; die
  Sammel-PDF nennt, dass die Weitergabe an die Ablösung nicht als Lieferung an
  den Stab zählt.
- **Scanner ohne Kamera:** klare Ausweichseite mit Handscanner, „QR aus Bild
  einlesen…“ und „Fertig“ ohne Scrollen bei 360 × 640.
- **Inline-Formulare** („Zug zuordnen“, „Auftrag/Notiz“) und der Dialog „Stärke
  ändern“ bleiben bei 360 × 640 vollständig sichtbar.

## Verständnis-Check

- Orientierung: verstanden
- Nächste Handlung: verstanden
- Systemstatus: verstanden (gespeichert, Zeit der letzten Meldung, „zählend“
  gegen „gemeldet“, Zeit des letzten Exports)
- Fehlerbehebung: verstanden (Rückfragen mit Folgen, Rückgängig, Entwurf)
- Feldtauglichkeit: eingeschränkt geprüft (echte Handschuhe, Sonnenlicht,
  Kamera, Telefontastatur nicht prüfbar); soweit prüfbar geeignet
