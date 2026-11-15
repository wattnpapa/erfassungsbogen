# Audit „Mobile UI", Runde 12 (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender Server, Code-Stand
Commit `2c96abe` = `main` nach Runde 11) · Zählung: **P0 0 · P1 0 · P2 0 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und
`docs/audits/runde-11/README.md`. Nicht neu gemeldet sind die dort genannten Grenzen
(R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, die
Reste aus Runde 10 sowie aus Runde 11 R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1 und
R11-M3). Dazu zählt auch, dass ein Tipp in den ersten rund 0,5 s nach dem Öffnen der
Einsatzansicht verworfen wird (Ortssperre, R8-H5).

## Prüfaufbau

Chromium über Playwright (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Locale de-DE, je Lauf ein eigener Kontext. Viewports 390 × 844, 360 × 640,
320 × 568, quer 640 × 360 und 568 × 320, zusätzlich 768 × 1024. Zustände über
`localStorage`-Seeds (Sammlung „Hochwasser Musterstadt" mit sechs Meldungen aus
`examples/thw/`, `uebung: false`; Entwurf `eeb.entwurf.v1`). Die Bildschirmtastatur
wurde durch eine Verkleinerung des Viewports auf 360 × 330 nachgestellt.

Durchlaufen: Startseite (leer, mit Entwurf), Ansicht-Menü, Assistent Schritt 1 bis 6
(Eingabearten, Zielgrößen, klebende Leisten), Person hinzufügen (zwei Karten),
Schnellerfassung bis zur Rückfrage „Ort der Einheit fehlt" und „Stärke fehlt",
Ortsvorschläge bei verkleinertem Viewport, Einsatzansicht (Kacheln, Karten, „Mehr…",
„Details", „Zug zuordnen", „Auftrag/Notiz", Abrücken mit Quittung, Filter, Tabelle),
Einsatz weitergeben, Scanner ohne Kamera, Datensicherung, Übungsbögen, Impressum,
Datenschutz, „Alle Daten löschen", „Neue Einsatz-Sammlung", Begleitseiten
`anleitung.html` und `themen.html`. Gemessen: `scrollWidth` gegen `innerWidth`, Ziele
unter 40 px, Schriften unter 12 px, Eingabefelder unter 16 px, Lage der klebenden
Leisten, Zugriffsnamen der Symbolknöpfe, Eingabearten.

Nicht prüfbar: echte Bildschirmtastatur, Safe-Area, WebKit, Kamera, Handschuhe, Licht.
Datums- und Zeitfelder zeigen im Testbrowser „mm/dd/yyyy" (nicht gewertet).

## Urteil

Die Behebungen aus Runde 11 halten. Neue Befunde sind nur drei Kleinigkeiten (P3); zwei
davon sind Nebenwirkungen der Behebungen von R11-M2 und R11-M5.

Gehalten (gemessen):

- **Kein seitlicher Überlauf** bei 320, 360, 390, 640 × 360, 568 × 320 und 768 px, auch
  nicht in den Rückfragen und Dialogen (`scrollWidth` = Fensterbreite, Dialoge 286 px
  bei 320 px).
- **Fokus auf „Ort der Einheit"** beim Öffnen der Schnellerfassung (R11-M1, Teil Fokus);
  Ortsvorschläge liegen bei 330 px Resthöhe vollständig im Bild, die Fußleiste ist dann
  ausgeblendet und deckt weder Feld noch Liste.
- **R11-M4:** „Bogen fortsetzen" ist 143 × 44 px (vorher 108 × 30).
- **R11-M5:** Im Querformat 568 × 320 und 640 × 360 stehen alle fünf Kacheln in einer
  Zeile, „Bogen scannen…" beginnt bei 229 px (vorher 317 px).
- **R11-M2:** Einheitennamen in der Tabelle 13 px bei 320 bis 390 px (vorher 11 px),
  14 px quer.
- **Eingabefelder:** keine unter 16 px, Telefon als `tel`, E-Mail als `email`, Orts- und
  Typfelder mit `autocomplete="off"`.
- **Ziele:** alle Knöpfe der Einsatzansicht, der Dialoge und des Assistenten mindestens
  44 px hoch; Kästchen und Optionsfelder 24 px mit größerer Beschriftungsfläche
  (bekannt). Einzige Ausnahme: Verweis „GoatCounter" im Datenschutztext (94 × 17 px,
  Fließtextlink).
- **Rückfragen** („Ort der Einheit fehlt", „Stärke fehlt", „Alle lokalen Daten löschen",
  „Angefangenen Bogen verwerfen?") haben alle Wege im Bild, der Knopf zum Feld steht
  zuerst. Symbolknöpfe tragen sprechende Namen („Person 2 an die erste Stelle").

## Befunde

### R12-M1 [P3] Eingeklappte Zeile „Suchen, sortieren, filtern" hat keine Aufklappmarke und sieht aus wie eine Zwischenüberschrift

**Kennzeichnung:** gemessen und im Bild beobachtet (360 × 640).

**Ort:** Einsatzansicht → Liste „Einheiten (…)", unter „6 ohne Auftrag · 6 ohne Zug";
`<summary>` in `details.einheiten-filter-wahl` (`index.html`, Regel ab Zeile 2722).

**Beobachtung:** Die Zeile ist ein `<summary>` mit `display: flex`; dadurch entfällt die
eingebaute Aufklappmarke, und es gibt keine eigene (kein `::before`/`::after`). Sie
steht in 14 px, fett, grau (`rgb(92, 100, 120)`) ohne Rahmen, Pfeil oder Unterstreichung,
44 px hoch. Im Bild unterscheidet sie sich nicht von einer grauen Feldbeschriftung wie
„Suche" darunter; aufgeklappt sieht sie genauso aus. Die übrigen Aufklapper („Bedarf:")
tragen eine Marke.

**Folge:** Wer in einer Liste mit mehr als einer Einheit eine Einheit nach Namen, Zug
oder Qualifikation sucht, sieht Suche, Sortierung und Filter nicht und erkennt die
Zeile nicht als Bedienelement. Die Liste ist kurz, die Karten sind bedienbar; der
Weg ist also nur schwerer zu finden, nicht versperrt.

**Empfehlung:** Dieselbe Marke wie bei „Bedarf:" (▸/▾) oder eine Umrandung als Knopf in
Ruhe-Form; Aufklapp-Zustand an der Marke ablesbar.

### R12-M2 [P3] Kachelbeschriftungen (EINHEITEN, FÜHRER, UNTERF., MANNSCH., GESAMT) im Querformat nur 11 px

**Kennzeichnung:** gemessen (Schriftgrößenprüfung, 568 × 320 und 640 × 360).

**Ort:** Einsatzansicht, Zahlenkacheln über den Aufnahmeknöpfen.

**Beobachtung:** Damit die fünf Kacheln im Querformat in eine Zeile passen (Behebung
R11-M5), sind die Beschriftungen auf 11 px verkleinert; im Hochformat (320 bis 390 px)
und bei 768 px sind es mindestens 12 px, die Prüfung auf Schriften unter 12 px bleibt
dort leer. Die Beschriftungen sind Großbuchstaben in Festbreitenschrift, die Ziffern
darüber sind groß.

**Folge:** Die Zahlen sind gut lesbar; was sie zählen („Unterf." gegen „Mannsch."),
steht in der kleinsten Schrift der Seite. Bei Sonne oder Armlänge am Tablet-Halter im
Querformat ist das die Stelle, an der man sich verliest. Kein Datenrisiko.

**Empfehlung:** Beschriftung auch quer bei mindestens 12 px halten und dafür die Kacheln
enger setzen oder „Einheiten" kürzen; die Ziffer darf dafür kleiner werden.

### R12-M3 [P3] Tabelle der Einsatzansicht: klebende Namensspalte belegt am Telefon die Hälfte der Breite, sichtbar bleiben drei Zahlenspalten

**Kennzeichnung:** gemessen (Spaltenbreite, `scrollWidth` der Tabelle) und im Bild
beobachtet (360 × 640).

**Ort:** Einsatzansicht → „Tabelle", Spalte „Einheit".

**Beobachtung:** Seit der Behebung von R11-M2 (13 px) ist die klebende Namensspalte 160 px
breit (vorher 134 px): 56 % der 286 px Tabellenbreite bei 320 px, 49 % der 326 px bei
360 px, 46 % bei 390 px. Daneben passen „Ges.", „F" und „U"; „M" und die Bedarfsspalten
liegen im seitlichen Rollbereich (Tabelle 1 514 bis 1 652 px breit). Die Zeilen sind
71 bis 96 px hoch, Namen laufen über drei Zeilen.

**Folge:** Wer die Zahlen vieler Einheiten vergleichen will (Ruhezeit, Unterbringung,
Diesel), rollt seitlich, während die Namensspalte die Hälfte des Bildes behält. Die
Karten sind der lesbare Ausweichweg, daher P3.

**Empfehlung:** Namensspalte am Telefon auf Nummer und Ort kürzen (volle Bezeichnung in
der Karte) oder die Spalte höchstens ein Drittel der Breite belegen lassen; so bleibt
13 px Schrift, und mehr Zahlenspalten sind im ersten Bild.

## Hinweise ohne Wertung

- Tippt man in den ersten rund 0,5 s nach dem Öffnen der Einsatzansicht auf „Aufklappen",
  geschieht nichts und es erscheint keine Rückmeldung (Ortssperre, bekannte Grenze
  R8-H5). Ein Tipp nach 0,6 s wirkt.
- Im Ansicht-Menü stehen die Beschriftungen der vier Kacheln („normal", „große Tasten",
  „abends", „gedimmt") nicht auf einer Höhe; rein optisch.
- Der Hinweis „Vom Papier abtippen? …" erscheint auch in der Schnellerfassung in Schritt 3,
  die ohne Papier arbeitet; inhaltlich, keine Mobile-UI-Frage.
