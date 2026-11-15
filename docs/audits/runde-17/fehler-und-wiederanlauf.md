# Audit „Fehler und Wiederanlauf", Runde 17 (Bedienfehler provozieren, selbst korrigieren)

- **Prüfer:** Rollenaudit `thw-error-recovery-reviewer`
- **Datum:** 2026-10-27
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 7 (davon 3 neu, 4 alt mit Verweis)
- **Gegenstand:** Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `be6b396` (`main`). Reiner Prüfbericht, keine Codeänderung.
- **Maßstab ab dieser Runde:** Es gibt keine „bekannten Grenzen" zum Auslassen. Auch Punkte, die in `runde-16` bis `runde-11` als „teilweise", „offen" oder „nicht reproduzierbar" stehen, werden gemeldet, wenn sie im Browser noch zu beobachten sind. Vorab gelesen: `docs/audits/README.md` und die Abschnitte „Stand der Behebung" in `runde-16/README.md` bis `runde-11/README.md` sowie `runde-16/fehler-und-wiederanlauf.md`.

## Prüfaufbau

Playwright (globales Modul `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2. Viewports 390 x 844 (Hauptlauf) und 360 x 640 (Sammlung mit acht Bögen, Quittungsleiste, seitlicher Überlauf: keiner). Übungsbögen aus `examples/thw/` als Kopien mit `uebung: false` und aktuellem Stand, über „Bögen einlesen…" aufgenommen; zusätzlich selbst abgewandelte Dateien (älterer und neuerer Stand derselben Einheit, abgeschnittenes JSON, Textdatei, CSV, Excel, Lageblatt-PDF). Lageblatt, Sammel-PDF, CSV und Excel wurden heruntergeladen und gelesen (`pdftotext`, `pdfinfo`, Zip-Inhalt). Nichts installiert, kein Prozess beendet.

Nicht geprüft: echte Kamera, Nahbereich, native Builds, echte Bildschirmtastatur, große Systemschrift (R15-M2 am Telefon mit 200 %), PDF-Dateiname im Tab-Betrachter (R16-A3), HEIC-Fotos. Der Weg „QR aus Bild einlesen…" mit einer Textdatei `fake.png` ließ sich im Lauf nicht auslösen (kein Ergebnis, nicht belegt).

Geprüft: Startseite, Assistent Schritt 1 bis 6 (Ort mit Mehrdeutigkeit, Telefon-/E-Mail-Felder, Zeitraum vertauscht/alt/fern, „Namen einfügen…", Person entfernen, Fahrzeug entfernen, Kennzeichen doppelt, Sitzplätze unplausibel, Sofortbedarf mit 9999, „-3", „abc", „1,5", „80000"), Neuladen mitten in der Eingabe, Browser-Zurück, „Bogen übergeben…", „Bogen schließen", „Neu anfangen" mit vorhandenem Entwurf (auch zweimal hintereinander), „Verwerfen", „Für neuen Einsatz vorbereiten" mit Rückgängig, Absenderkarte, Einsatz-Sammlung (anlegen, 1 bis 30 Bögen einlesen, doppelt, älterer/neuerer Stand, defekte und fremde Dateien, Kenntnisnahme, Abrücken, Stärke ändern mit Zahlendreher, Aufteilen, Meldung entfernen, Zeiten ändern, Zug zuordnen, Schnellerfassung ohne Ort und ohne Stärke, Lageblatt, Sammel-PDF, Nachtrag, CSV, Excel, Einsatz importieren mit fremden Dateien, Einsatzbeginn und Lagemonitor-Felder), Handscanner-Fenster mit Fremdcodes, Dialoge „Alle Daten löschen", „Datensicherung", „Geräteschlüssel".

## Urteil aus Sicht der Rolle

Die Fehlerabsicherung ist weiter sehr dicht, und die Behebungen der Runde 16 halten. Zahlendreher werden vor der Wirkung erkannt („Stimmt die Stärke? … mehr als das Dreifache", „liegt in der Zukunft", „mehr als einen Tag vor der Aufnahme"), jede destruktive Handlung fragt mit Folgen und hat Rückgängig oder Papierkorb, fremde Dateien enden mit eigenem Satz und die Meldung springt ins Bild, Neuladen und Browser-Zurück kosten keine Eingaben. Datenverlust im Hauptweg fand ich nicht; jede Korrektur gelang ohne fremde Hilfe. Übrig sind sieben Randpunkte, alle P3: drei neue (eine Rückholung, die kürzer lebt als die der Nachbarn, ein unklarer Bezugspunkt beim Nachtrag, ein verfälschtes Echo im Handscanner-Fenster) und vier Reste aus früheren Runden.

### Runde-16-Behebungen, im echten Browser geprüft und gehalten

- R16-E1 (Teil): `Meier⇥Klaus⇥Führer` und `Koch;Jan;Helfer` werden als Spalten gelesen („Meier, Klaus · Führer", „Koch, Jan · Helfer"); `Mustermann Max Truppführer` trägt „Reihenfolge prüfen"; „Meier, Klaus - Gruppenführer" trennt die Funktion ab. Der Rest steht als R17-E1.
- R16-E2: „Für neuen Einsatz vorbereiten" zeigt nach „Zurücksetzen" eine Quittung mit „Rückgängig"; Rückgängig stellt Zeitraum, Ort/Auftrag und Sofortbedarf wieder her.
- R16-E3: `0441 123456 App 12` ergibt „Zweite Nummer „App 12" nicht übernommen" statt einer angehängten „12".
- R16-E4: „Oldenburg" meldet „kann mehrere Ortsverbände meinen (Oldenburg (NI), Oldenburg in Holstein) — Vorschlag antippen".
- R16-D1/W1/S3 (Rückfragen): „Stärke ändern…" mit 1/1/22 fragt „Gesamt 4 → 24: mehr als das Dreifache"; Eintreffzeit 2025 fragt „Jahr, Tag oder Monat vertauscht?"; Eintreffzeit in drei Stunden oder morgen fragt „liegt in der Zukunft".
- Doppelte oder fremde Dateien: „0 Bögen aufgenommen, 1 bereits vorhanden"; älterer Stand „nur in die Historie gelegt, die Lage bleibt unverändert"; defekte JSON-Datei „beschädigt oder unvollständig"; Textdatei und Excel „stammt nicht aus dieser App"; CSV „ist eine Tabelle oder Liste"; Lageblatt-PDF „ist ein Lageblatt — nur zum Lesen".
- Neu-Anfangen-Kette: Die zweite Rückfrage warnt ausdrücklich, dass „Zuletzt geschlossener Bogen" nur einen Bogen fasst und der bisherige endgültig gelöscht wird.
- Sammel-PDF mit 30 Bögen: 9,9 s, Zeile „Einsatz wird erzeugt…" im Bild (R15-O1: Zeit und Hinweis jetzt vorhanden, weiter ohne Prozentanzeige, siehe unten ohne eigenen Befund).

## Befunde

### R17-E1 (P3) „Namen einfügen…": Zeilen „Nachname Vorname [Zweitname]" ohne Komma werden still umgedeutet

- **Neu oder alt (Verweis):** alt, wie R16-E1 („Anna Maria Schmidt" ohne Funktion bleibt ohne Prüfmarke), weiter teilweise.
- **Ort:** Assistent, Schritt 3 „Personal" → „Namen einfügen…", 390 x 844.
- **Beobachtung:** `Schmidt Anna Maria` wird in der Vorschau zu „Maria, Schmidt Anna" ohne Prüfmarke und nach „Übernehmen" Person mit Vorname „Schmidt Anna", Nachname „Maria"; die Quittung lautet „4 Namen übernommen — 4 davon in freie Sollplätze". `Meier Karl` wird zu „Karl, Meier". Die Marke „Reihenfolge prüfen" erscheint nur, wenn eine Funktion ohne Komma mitkommt (`Mustermann Max Truppführer`) oder Klammern vorkommen. Richtig gelöst sind „Karl Heinz Meier", „Dr. Hans Peter von Haase", Tabulator, Semikolon und das Komma.
- **Folge:** Eine Namensliste „Nachname Vorname" aus einer Nachricht landet mit vertauschten Namen im Bogen und im QR-Code. Der Fehler fällt nur beim Zeile-für-Zeile-Lesen der Vorschau oder erst am Meldekopf auf.
- **Empfehlung:** Zeilen ohne Komma mit mehr als zwei Wörtern immer mit „Reihenfolge prüfen" kennzeichnen; für die ganze Liste eine Wahl „Nachname zuerst / Vorname zuerst" anbieten, damit die Reihenfolge einmal festgelegt und nicht je Zeile geraten wird.

### R17-E2 (P3) „Meldung entfernen": Rückgängig lebt nur bis zum Neuladen, anders als bei Fahrzeug und Person

- **Neu oder alt (Verweis):** neu (verwandt mit R15-D2, das nur die Lebensdauer über Ansichtswechsel betraf).
- **Ort:** Einsatz-Sammlung → Karte aufklappen → „Mehr…" → „Entfernen", 390 x 844.
- **Beobachtung:** Die Rückfrage ist vorbildlich („Nr. 2 … (11 Personen, Stand …) entfernen — samt Historie. Nummern ändern sich: Die Einheit Nr. 3 rückt auf und heißt danach Nr. 2. „Rückgängig" gilt bis zum Neuladen oder Schließen der App; danach ist die Meldung endgültig weg."). Die Quittung „Entfernt: Meldung Nr. 2 …" mit „Rückgängig" übersteht den Wechsel auf die Startseite und zurück. Nach einem Neuladen der Seite ist weder Quittung noch ein anderer Weg zurück zu sehen; die Meldung ist weg. Bei „Fahrzeug entfernen" und „Person entfernen" gilt dagegen „auch nach „Weiter" oder Neuladen, 15 Minuten lang", ein gelöschter Einsatz liegt 30 Tage im Papierkorb.
- **Folge:** Ein Telefon, das im Hintergrund die Seite verwirft, oder die Aufforderung „Neu laden" nach einem App-Update kostet die Meldung samt Historie, Zeiten, Zug und Auftrag. Die Einheit ließe sich neu einlesen, ihre Eintreffzeit, die Folgemeldungen und der Auftrag nicht. Das Schwächste unter den Rückholwegen liegt ausgerechnet bei der Handlung mit den meisten Folgen (Nummern rücken auf).
- **Empfehlung:** Die entfernte Meldung wie Fahrzeug und Person eine Zeit lang überdauernd rückholbar halten (etwa im Papierkorb der Sammlung oder unter der Einheitenliste „Zuletzt entfernt: … Rückgängig"), oder die Rückfrage um einen Satz ergänzen, wie sich die Meldung außerhalb der Quittung zurückholen lässt.

### R17-E3 (P3) Nachtrag: Der Bezugspunkt „Sammel-PDF an den Stab" ignoriert die gerade erzeugte Weitergabe-Datei

- **Neu oder alt (Verweis):** neu (verwandt mit R16-W2 und R12-W3, die den Nachtrag und die „Empfang nicht bestätigt"-Zeile betrafen).
- **Ort:** Einsatz-Sammlung → „Einsatz weitergeben / sichern" und „Nur neue Bögen seit dem letzten Export", 390 x 844.
- **Beobachtung:** Zwei Bögen aufgenommen, „Einsatz weitergeben / sichern" gedrückt (Datei 18:04, Zeile „Weitergabe-Datei erzeugt 27.10.2026, 18:04 — Empfang nicht bestätigt"). Dritten Bogen aufgenommen, „Nur neue Bögen seit dem letzten Export" angekreuzt: Der Knopf heißt „Sammel-PDF (erste Lieferung: alle Bögen)", die Statuszeile „Sammel-PDF an den Stab: noch nicht in diesem Format exportiert — alle Bögen sind neu". Die Datei enthält alle drei Einheiten (8 Seiten, Dateiname „…erste-lieferung…"). Erst danach steht dort „zuletzt erzeugt 18:04 · seitdem keine neuen Bögen". Die Weitergabe-Datei und die Sammel-PDF „für den Stab" sind zwei getrennte Bezugspunkte, obwohl der Text darüber „Einsatz weitergeben / sichern erzeugt die Sammel-PDF" sagt.
- **Folge:** Wer die Sammel-PDF eben vollständig übergeben hat und nach dem dritten Bogen einen Nachtrag erwartet, bekommt wieder alle Bögen und liest „erste Lieferung" für etwas, das nicht die erste war. Der Stab erhält Doppelzählungen von Hand, oder der Helfer misstraut dem Knopf.
- **Empfehlung:** Die über „Einsatz weitergeben / sichern" erzeugte Sammel-PDF als Bezugspunkt für das Format „Sammel-PDF" mitzählen, oder in der Statuszeile ausdrücklich unterscheiden („Weitergabe-Datei 18:04 (zum Sichern) — für den Stab noch keine Lieferung").

### R17-E4 (P3) „⚠ Anderer Einsatz?" bleibt auf der Karte stehen und lässt sich nicht quittieren

- **Neu oder alt (Verweis):** alt, wie R14-W3 („Anderer Einsatz?" teilweise), weiter teilweise.
- **Ort:** Einsatz-Sammlung, Einheitenliste, Lageblatt, 390 x 844 und 360 x 640.
- **Beobachtung:** Nach dem Einlesen von vier Übungsbögen trägt jede Karte außer einer „⚠ Anderer Einsatz?"; die aufgeklappte Karte sagt „Kein Ortsname daraus kommt beim Ort der Sammlung oder bei den übrigen Einheiten vor. Zählt trotzdem mit." Auch nach „Zur Kenntnis genommen" bleibt die Marke; es gibt keinen Knopf „Passt so" an der Karte. Das Lageblatt druckt die Marke mit dem vollen Satz je Einheit („Anderer Einsatz? Bogen nennt: …"), bei sechs Einheiten viermal.
- **Folge:** Eine Warnung, die für jede Einheit mit eigenem Auftragstext gilt und nicht wegzubekommen ist, wird nach dem dritten Mal nicht mehr gelesen; der eine echte Fehlgriff (Bogen aus einem anderen Einsatz) geht darin unter. Auf Papier steht der Zweifel dauerhaft über den Einheiten.
- **Empfehlung:** Eine Entscheidung je Karte zulassen („Gehört zu dieser Lage"), die die Marke auf Karte und Lageblatt entfernt und in der Historie vermerkt wird; im Lageblatt Marke kurz halten.

### R17-E5 (P3) Neuladen klappt die aufgeklappte Karte zu

- **Neu oder alt (Verweis):** alt, wie R14-S2 (Neuladen: Bildlaufstelle bleibt, aufgeklappte Karte und zuletzt bearbeitete Person nicht), weiter teilweise.
- **Ort:** Einsatz-Sammlung, Einheitenliste, 390 x 844.
- **Beobachtung:** Karte Nr. 2 aufgeklappt, „Abrücken" getippt, Seite neu geladen: Die Sammlung öffnet an derselben Stelle (kein Rückfall auf die Startseite), die Karten sind alle zugeklappt, auch die eben bearbeitete.
- **Folge:** Nach einer Unterbrechung (Telefon gesperrt, App aus dem Speicher geworfen) muss die Karte, an der gerade gearbeitet wurde, erneut gesucht und aufgeklappt werden; bei 30 Karten ist das ein Suchlauf.
- **Empfehlung:** Die zuletzt bearbeitete Karte nach dem Neuladen aufgeklappt wiederherstellen (oder wenigstens hervorheben und in den Bildschirm rollen).

### R17-E6 (P3) Abgerückte Einheiten bleiben zwischen den anwesenden an ihrem Listenplatz

- **Neu oder alt (Verweis):** alt, wie R11-K2 (Abgerückte bleiben an ihrem Listenplatz) und R12-G3 (Knöpfe nach Abrücken), weiter teilweise.
- **Ort:** Einsatz-Sammlung, Einheitenliste, Reihenfolge „Nach Nr.", 390 x 844.
- **Beobachtung:** Nach dem Abrücken von Nr. 2 steht die Karte „THW Biberach/Riß … ABGERÜCKT" mit voller Stärkezeile, Ruhezeit-, Unterbr.- und Diesel-Marken und „⚠ Anderer Einsatz?" zwischen Nr. 1 und Nr. 3, die anwesend sind. Kopfzeile und Bedarf zählen sie richtig nicht mehr mit („4 gemeldet · 3 zählend"). Die Marke ABGERÜCKT ist klein hinter dem Namen; die Karte ist sonst nicht abgesetzt.
- **Folge:** Beim schnellen Überfliegen der Liste („wer ist noch da?") wird eine abgerückte Einheit mit 11 Personen und einem Dieselbedarf für anwesend gehalten; die Zeile mit den Zahlen sieht aus wie die der anderen.
- **Empfehlung:** Abgerückte Karten gedämpft darstellen (Stärke und Bedarfsmarken zurücknehmen, „ABGERÜCKT" als eigene Zeile) oder ans Listenende rücken.

### R17-E7 (P3) Handscanner-Fenster: Das Echo „Empfangen: …" lässt Leerzeichen weg

- **Neu oder alt (Verweis):** neu.
- **Ort:** Start → „QR-Code scannen…" (Gerät ohne Kamera, Handscanner-Fenster), 390 x 844.
- **Beobachtung:** Wird `hallo welt` getippt (wie ein Handscanner), lautet die Meldung „✗ Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen. Empfangen: „hallowelt"". Fremde Codes ohne Leerzeichen (`https://example.com/?x=1`, `EEB1:ABCDEF`, eine Ziffernfolge) werden unverändert wiedergegeben und mit eigenem Satz abgelehnt; das Fenster bleibt danach bereit.
- **Folge:** Der Helfer, der prüfen will, was er eben gescannt hat (Zettel, WLAN-Code, Fremdcode), liest eine verfälschte Zeichenfolge und kann den Code nicht eindeutig erkennen. Kleiner Mangel, weil gültige Bögen keine Leerzeichen enthalten.
- **Empfehlung:** Das Echo unverändert zeigen (Leerzeichen sichtbar machen) oder das Weglassen im Satz nennen.

## Kein Befund (geprüft, trägt)

- R15-O1 Sammel-PDF-Dauer: 30 Bögen in 9,9 s mit „Einsatz wird erzeugt…" im Bild; keine Prozentanzeige, aber auch keine stumme Wartezeit mehr.
- Doppeltipp-Sperre: Tipps in den ersten rund 0,9 s nach dem Öffnen eines Dialogs oder Editors werden verschluckt (Abbrechen, Speichern); bei menschlicher Geschwindigkeit nicht zu spüren, daher kein Befund.
- Zahlenfelder im Sofortbedarf: „-3" → „Minus geht nicht — „-3" wurde nicht übernommen", „abc"/„3 Kanister" → „keine Zahl", „1,5" → „auf ganze Liter gerundet: 2", 80 000 l Diesel → Plausibilitätswarnung.

## Abschluss

- **Aufgabe geschafft:** ja (Bogen erfassen, Fehler machen und beheben, übergeben; Einsatz-Sammlung führen, Bögen einlesen, abrücken, ändern, entfernen, exportieren) — ohne Umwege.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Weitergabe-Datei und die Sammel-PDF „für den Stab" sehen wie ein Ding aus, haben aber getrennte Bezugspunkte (R17-E3).
- **Größtes Einsatzrisiko:** Eine versehentlich entfernte Meldung samt Historie ist nach einem Neuladen der Seite unwiederbringlich (R17-E2).
- **Top-Priorität für die nächste Iteration:** „Meldung entfernen" wie „Fahrzeug entfernen" über Neuladen hinweg rückholbar halten (R17-E2).
