# Prüfbericht Runde 17: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer), Meldekopf-Bediener und Helfer mit eigenem Bogen in einer Person
- **Datum:** 2026-10-27
- **Code-Stand:** Commit `be6b396` (`main`), Produktionsbuild, `http://localhost:4173`
- **Methode:** Playwright (globales Modul, Chromium ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Viewports 360 x 640 und 390 x 844. Als Bögen dienten die Übungsbögen aus `examples/thw/` mit `uebung: false` und aktuellem Stand. Kein Code geändert. Nicht geprüft: Kamera-Scan, Nahbereich, Bildschirmtastatur, native Builds, der Dialog „Namen einfügen…“ (R16-E1) und „Link teilen“ (nur in Runde 16 gesehen).
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 5

## Urteil aus Sicht der Rolle

Erwartete Arbeitsfolge (Annahme, kein bekannter THW-Vorschrifttext): Der Meldekopf legt einen Einsatz an, nimmt Bögen auf, ordnet Zug und Auftrag zu, rückt Einheiten ab, gibt die Lage weiter (Sammel-PDF, Lageblatt, CSV) und kann nach Unterbrechung weiterarbeiten.

Der Ablauf trägt auch in dieser Runde. Alle Strecken ließen sich ohne fremde Hilfe, ohne doppelte Eingabe und ohne Datenverlust durchlaufen. Die verbleibende Reibung liegt in Kleinigkeiten, vor allem in den Rückgängig-Quittungen und in den Dateitexten.

Durchlaufen im echten Browser: Einsatz anlegen; 2, 4 und 8 Bögen aufnehmen (bei 8 die Kurzfassung mit „Alle 8 einzeln anzeigen“ und den Ortswarnungen, die für die Übungsbögen zutreffen); Sammelzuordnung Zug; Abrücken; Auftrag/Notiz mit Neuladen bei offenem Feld (Text bleibt erhalten); Sammel-PDF (2,4 s bei 4 Bögen) und Import auf einem zweiten Gerät (4 Einheiten, 3 anwesend, Abgerückte als „ABGERÜCKT“); Sammel-PDF versehentlich über „Aus Datei laden…“ (App erklärt „Die PDF enthält 4 Bögen … Alle auf einmal: Einsatz importieren…“); CSV, Nachtrags-CSV, Lageblatt; Sammel-PDF nach Abrücken einer Einheit; „Einheit schnell erfassen“ aus der Einsatzansicht (Schritt 2 übersprungen, Zug im Ergebnis abfragbar); eigener Bogen aus Datei bis „Bogen übergeben…“; Entwurf auf der Startseite mit „Fortsetzen / Verwerfen“ (fragt beim Verwerfen nach).

## Haltbarkeit der Behebungen aus Runde 16

| Befund | Ergebnis |
| --- | --- |
| R16-W3 „Einheit schnell erfassen“ in der Einsatzansicht | hält: Knopf vorhanden, Ort, Stärke, „In Einsatz übernehmen“ ohne Schritt 2, danach „Zuletzt abgelegt: „THW Ulm“ · jetzt 1 Einheit, Gesamt 4“ mit Zugabfrage |
| R16-W2 Nachtrag-Knöpfe | teilweise: Knopf heißt jetzt „Übersicht als CSV — Nachtrag (1 Einheit)“, andere Knöpfe „erste Lieferung: alle Bögen“; Vermerk „NACHTRAG“ steht weiter ganz unten (siehe R17-W2) |
| R16-W1 Quittungsleiste | teilweise: nach 15 s einzeilig (siehe R17-W1 und R17-W3) |
| R16-A1 CSV-Schlusszeile | hält: „Einsatz „Hochwasser Weser“ · Erstellt …“ und Fußnote „* Eintreffzeit = Zeit des Einlesens …“ |
| R16-K2 / K3 Kurzfassung ab sechs Einheiten | hält: „8 Einheiten neu gemeldet — Zeilen je Einheit ausgeblendet, siehe Liste“ |
| R16-D1 Prellschutz | hält: „Die Übersicht als CSV wird erzeugt — bitte nicht noch einmal tippen.“ |
| R16-H1 bis H3 Zielgrößen | hält: keine Bedienfläche unter 44 px in Einsatzansicht und aufgeklappter Karte bei 360 x 640 |
| R15-W1 Doppelempfang, R15-D1 jüngste Quittung | hält im geprüften Umfang |

## Befunde

### R17-W1 [P3] Die einzeilige Quittung kürzt den Einheitennamen weg, „Rückgängig“ bleibt ohne erkennbares Ziel

- **Neu oder alt (Verweis):** neu, Folge der Behebung von R16-W1
- **Ort:** Einsatzansicht, Quittungsleiste unten, 15 s nach „Abrücken“ und nach „Zug zuordnen“.
- **Beobachtung:** Nach 15 s schrumpft die Quittung auf eine Zeile. Bei 360 x 640 steht dort nur „Abgerückt 17:41:…“, bei 390 x 844 „Zug „1. Zug“ gesetzt: …“. Der Einheitenname beziehungsweise die Zahl der betroffenen Einheiten ist abgeschnitten; daneben stehen „Rückgängig“ und „✕“.
- **Folge:** Wer nach einer Unterbrechung auf den Bildschirm schaut, sieht ein „Rückgängig“, ohne zu erkennen, welche Einheit es betrifft. Ein Tipp darauf nimmt die jüngste Aktion zurück; ein Fehlgriff ist möglich, aber folgenarm, weil nur diese eine Aktion betroffen ist.
- **Empfehlung:** In der Einzeile Einheit und Aktion zuerst und kurz nennen („Nr. 2 abgerückt 17:41“), die Uhrzeit weglassen oder dahinter setzen.
- **Verifikation:** 360 x 640, „Abrücken“, 20 s warten: Nummer der Einheit in der Zeile lesbar.

### R17-W2 [P3] Nachtrag-CSV: Vermerk „NACHTRAG“ steht weiter unten, nicht in der ersten Zeile

- **Neu oder alt (Verweis):** alt, wie R16-W2, weiter teilweise (Knopfbeschriftung behoben)
- **Ort:** Einsatzansicht, „Nur neue Bögen seit dem letzten Export“, „Übersicht als CSV — Nachtrag (1 Einheit)“.
- **Beobachtung:** Datei `eeb-einsatz-nachtrag-seit-20261027-1742-….csv` beginnt mit der Kopfzeile und der einen Einheit. Die Zeile „NACHTRAG seit 27.10.2026, 17:42 — nicht die ganze Lage (1 Einheit in dieser Datei)“ steht als vorletzte Zeile unter der Summe; die Summenzeile heißt „Summe Nachtrag — nur neue Einheiten (1)“, die Spalte „Im Nachtrag wegen“ ist gesetzt.
- **Folge:** Beim Stab zählt eine Datei mit einer von fünf Einheiten möglicherweise als Lage, wenn nur die obersten Zeilen angesehen werden; Dateiname und Spalte mildern das.
- **Empfehlung:** Den Vermerk in die erste Zeile setzen, die Kopfzeile folgt in Zeile 2.
- **Verifikation:** Nachtrag-CSV öffnen: erste Zeile nennt „NACHTRAG“.

### R17-W3 [P3] Gemischte Anführungszeichen: öffnend „ (unten), schließend " (gerade)

- **Neu oder alt (Verweis):** neu
- **Ort:** Quittung „Abgerückt 17:50: Nr. 1 „THW Biberach/Riß Fachgruppe Ortung (B)"“, Einlese-Quittung „Einsatz „Hochwasser Weser" übernommen: …“, Hinweis „„Einsatz weitergeben / sichern" erzeugt …“, „„Einsatz importieren…" einlesbar“, Zuletzt-abgelegt-Zeile „„THW Ulm"“, CSV-Hinweis „… auf Geschlecht „männlich"“.
- **Beobachtung:** Zeichencodes gemessen: öffnend U+201E, schließend U+0022 (gerades Zeichen) an den genannten Stellen; an anderen Stellen („Nacht“, „Jetzt“, „Nur neue Bögen seit dem letzten Export“) korrekt U+201C.
- **Folge:** Wirkt unfertig, in Quittungen und Dateihinweisen, die gelesen und weitergegeben werden. Keine Fehlbedienung.
- **Empfehlung:** Ein einheitliches Paar „…“ in allen Texten, auch in den Dateien.
- **Verifikation:** Alle sichtbaren Texte auf U+0022 durchsuchen: kein Treffer außerhalb von Code.

### R17-W4 [P3] Lageblatt: „1 Einheiten“, Kürzung mitten im Wort mit Klammerverschachtelung

- **Neu oder alt (Verweis):** neu
- **Ort:** Lageblatt (A4 quer) mit einer zählenden Einheit; Spalte „Auftrag / Notiz (Bemerkung der Einheit)“ und Kasten „Bedarf gesamt“.
- **Beobachtung:** Kasten „Bedarf gesamt (1 Einheiten, 11 Personen)“ und „Ruhezeit erforderlich bei 1 Einheit(en)“. In der Bemerkungsspalte steht „(2 Helfer über StAN-Soll (Reserve aktiviert). PKW OV zusätzlich über St … (Rest: Sammel-PDF))“: Die Kürzung schneidet „StAN“ nach zwei Buchstaben ab, die Klammern sind verschachtelt.
- **Folge:** Der Stab liest ein halbes Wort; der Hinweis auf die Sammel-PDF rettet den Inhalt.
- **Empfehlung:** An Wortgrenzen kürzen, die Klammern des Zusatzes nicht in die eigenen Klammern setzen, Einzahl bei einer Einheit.
- **Verifikation:** Lageblatt mit langer Bemerkung erzeugen: Kürzung am Wortende, Einzahl korrekt.

### R17-W5 [P3] Neuladen klappt die zuletzt geöffnete Karte nicht wieder auf

- **Neu oder alt (Verweis):** alt, wie R14-S2, weiter teilweise
- **Ort:** Einsatzansicht, aufgeklappte Karte, Neuladen (Seite wird neu geladen oder vom System beendet).
- **Beobachtung:** Nach dem Neuladen steht der Einsatz mit allen Daten und dem gespeicherten Auftrag („Sandsäcke Deich Nord“, „1 ohne Auftrag“) da; die zuvor aufgeklappte Karte ist wieder zugeklappt.
- **Folge:** Gering. Der Meldekopf muss die Einheit in der Liste erneut suchen und öffnen.
- **Empfehlung:** Die zuletzt geöffnete Karte merken und nach dem Neuladen wieder öffnen.
- **Verifikation:** Karte aufklappen, Neuladen: dieselbe Karte ist offen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Eine verkürzte „Rückgängig“-Zeile ohne Einheitennamen (R17-W1).
- **Größtes Einsatzrisiko:** Eine Nachtrags-CSV wird als ganze Lage gelesen (R17-W2); Datenverlust oder Statusfehler wurden in keinem Ablauf beobachtet.
- **Top-Priorität für die nächste Iteration:** R17-W1 und R17-W2 gemeinsam angehen (Einzeilen-Quittung nennt die Einheit, Nachtrag-Vermerk in Zeile 1).
