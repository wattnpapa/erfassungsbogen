# Audit „Zerstörende Handlungen", Runde 15 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `a7874f0` (`main` nach Runde 14).

**Zählung: P0 0 · P1 0 · P2 2 · P3 2** (R15-D1 bis R15-D4).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`,
`runde-14/README.md`, `runde-13/README.md`, `runde-12/README.md` und der Bericht
`runde-14/zerstoerende-handlungen.md`. Die dort geführten bekannten Grenzen (u. a. R6-O9,
R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, leere Karten bei
„Nur Stärke", Rückgängig für Meldungen überlebt das Neuladen nicht, Tabellenzeilenhöhe bei
180 × 320, R11-S4/H2/K2/A2/A5/M1/M3, R12-W3/H3/O2/O4/G3, R13-W1/W6/H1, R14-E7, R14-S2,
R14-H1, R14-W3) sind nicht erneut gemeldet.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale
de-DE, Tipps als Touch-Tipp. Viewports 390 × 844 (durchgehend) und 360 × 640 (Quittungsleiste,
Löschen). Je Szenario ein frischer Browserkontext, eigenes Arbeitsverzeichnis im Scratchpad.
Zustände über die Bedienung: Einsatz-Sammlung „Hochwasser Weser" anlegen, Übungsbögen
`012-sinsheim`, `013-ulm`, `014-weinsberg` (Kopien außerhalb des Repositorys, `uebung: false`,
`stand` auf 11:50 der Geräteuhr und Zeitraum auf heute) über „Bögen einlesen…" aufnehmen. Kein
Kamera-Scan, keine Handschuhe, keine nativen Builds, kein Zweitgerät. Die Rückfragen haben
eine kurze Tippsperre; die Skripte haben vor dem Bestätigen gewartet.

Durchgespielt: Aufteilen („Trupp 2", vier Personen), Entfernen von Teil und Stammeinheit,
Rückgängig, Zusammenführen und Rückgängig, Einlesen einer neueren und einer älteren Datei
nach dem Aufteilen, „Zuordnen" des Zugs für alle Einheiten ohne Zug (leer, nur Leerzeichen,
Tippfehler „2.Zug", danach Zug je Karte ändern), „Zur Kenntnis genommen" mit Rückgängig,
Abrücken/„Wieder anwesend"/Rückgängig, „Als Übung kennzeichnen…" und Rückgängig, „Stärke
ändern…", Verschieben in eine zweite Sammlung, Einsatz löschen (inklusive Doppeltipp),
Papierkorb und „Endgültig löschen…", Auftrag/Notiz mit Zurück-Geste und Neuladen,
Telefonnummer der Absenderkarte, Tabellenansicht, Navigation zwischen Sammlungen.

## Urteil

Die zerstörenden Handlungen sind weiterhin sehr gut gesichert, und die vier Behebungen aus
Runde 14 halten im echten Browser. Rückfragen nennen Name, Stärke und Folge, Quittungen mit
„Rückgängig" stehen nach fast jeder Handlung. Zwei Ränder sind neu: Eine Quittung kann
unter einer älteren Quittung unerreichbar liegen (R15-D1), und die Rückgängig-Möglichkeit
nach „Entfernen" endet schon beim Verlassen der Einsatzansicht, nicht erst beim Schließen der
App, wie die Rückfrage sagt (R15-D2). Alle Aufgaben ließen sich ohne fremde Hilfe erledigen.

## Behebungen aus Runde 14, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R14-D1 Entfernen von Teil und Stamm | hält. Rückfrage beim Teil: „Nr. 4 „THW Sinsheim …" (Teil „Trupp 2", 4 Personen, Stand …) … Diese 4 Personen zählen danach nirgends mehr; zurück in die Einheit geht es über „Zusammenführen…"". Bei der Stammeinheit: „Abgeteilt bleibt stehen: „Trupp 2" (4 Personen)". Quittung nennt „Teil „Trupp 2", 4 Personen"; Rückgängig holt die Meldung zurück (Kopf 3 → 4 Einheiten, 38 Personen) |
| R14-D2 Stapelweg, neuere Datei | hält. Statuszeile: „⚠ Trupp 2 (4 Personen) ist abgeteilt; Scherer, Thomas; … stehen auch in der neuen Meldung. Sie zählen jetzt doppelt — Trupp entfernen oder „Zusammenführen…"." Gesamt 15, die Warnung steht dabei. Falschmeldung bei älterer Datei siehe R15-D3 |
| R14-D3 Sammelzuordnung des Zugs | hält. Quittung „Zug „1. Zug" gesetzt: 3 Einheiten — Rückgängig ✕", bleibt auch nach 9 s; wird bei einer Zugänderung an einer Karte durch die neue Quittung ersetzt. Leere Eingabe und nur Leerzeichen sperren „Zuordnen" |
| R14-D4 Verschieben | hält. Nach „Alles klar" bleibt die Leiste „Verschoben: „…" liegt jetzt in „Bereitstellungsraum"." mit „Rückgängig" |
| R14-E3 und folgende | Zusammenführen mit Rückgängig, Abrücken/„Wieder anwesend" mit Rückgängig, „Als Übung kennzeichnen…" mit Rückgängig („Zurückgenommen: … zählt wieder als Einsatzmeldung"), Telefonnummer „Nur 6 Ziffern — stimmt die Nummer? … Gespeichert würde: „017012"" mit „Trotzdem übernehmen"/„Nummer prüfen", Einsatz löschen („30 Tage … zurückholen", Doppeltipp löscht einmal), „Endgültig löschen…" („einzige Kopie"), Zurück-Geste speichert den Auftragstext (nach Vorwärts und Neuladen vorhanden) halten |

## Befunde

### R15-D1 [P2] Eine ältere Quittung ohne Knopf liegt über der neuen „Zur Kenntnis genommen" und macht deren „Rückgängig" unerreichbar

**Kennzeichnung:** gemessen (Position der Leisten, Tipp-Versuch, Bildschirmfoto).

**Fundstelle / Aufgabe:** Einsatzansicht → eine Handlung mit „Rückgängig" auslösen und
zurücknehmen (zum Beispiel „Abrücken" → „Rückgängig", oder „Als Übung kennzeichnen…" →
„Rückgängig") → danach „Zur Kenntnis genommen"; 390 × 844 und 360 × 640.

**Beobachtung:** Nach dem Zurücknehmen steht eine Info-Leiste ohne Knopf („Wieder
anwesend: Abrücken von Nr. 1 …", „Zurückgenommen: „…" zählt wieder als Einsatzmeldung",
„Wieder abgerückt: …"). Sie bleibt stehen (nach 20 s noch da). Tippt man danach „Zur Kenntnis
genommen", entsteht eine zweite Leiste „Zur Kenntnis genommen: 2 Einheiten — Rückgängig ✕"
an derselben Stelle (Oberkante 710 px bei 844 px Höhe, 506 px bei 640 px Höhe, beide z-index
20). Sichtbar bleibt die ältere Leiste; ein Tipp auf „Rückgängig" der neuen scheitert, weil
der Text der älteren die Tipps abfängt (Playwright: „`quittung-text` … subtree intercepts
pointer events", 30 s Timeout). Auf dem Bildschirm steht nur „Zurückgenommen: …". Bei „Abrücken"
nach „Rückgängig" tritt das nicht auf, dort ersetzt die neue Leiste die alte; es betrifft
die Leiste der Kenntnisnahme.

**Erwartung der Rolle:** Die letzte Handlung steht oben, mit ihrem „Rückgängig"; ältere
Meldungen weichen.

**Folge:** Wer „Zur Kenntnis genommen" versehentlich tippt (der Knopf sitzt neben „Zuletzt
gemeldete oben zeigen"), sieht einen Satz über etwas anderes und findet das Rückgängig nicht.
Der Block „Neu seit der letzten Kenntnisnahme" ist dann leer, auch Warnungen wie „passt das zu
dieser Lage?" erscheinen dort nicht mehr. Nur ✕ der sichtbaren Leiste legt die darunter
liegende frei; das weiß niemand. Es geht nichts verloren, der Zustand lässt sich aber unter
Zeitdruck nicht zurücknehmen. P2.

**Empfehlung:** Immer nur eine Leiste zeigen, die zuletzt ausgelöste; ältere beim Erscheinen
einer neuen schließen. Info-Leisten ohne Knopf nach einigen Sekunden von selbst schließen.

**Nachprüfung:** Abrücken → Rückgängig → „Zur Kenntnis genommen": sichtbar ist nur „Zur Kenntnis
genommen … Rückgängig", und der Tipp darauf nimmt die Kenntnisnahme zurück (390 und 360 px).

### R15-D2 [P2] „Rückgängig" nach „Meldung entfernen" endet beim Verlassen der Einsatzansicht; die Rückfrage verspricht „solange die App geöffnet bleibt"

**Kennzeichnung:** gemessen (Leiste vor und nach dem Wechsel, Zahl der Einheiten, Seitentext).
Ob das die bekannte Grenze „überlebt das Neuladen nicht" mitmeint, ist offen; hier genügt
ein Wechsel der Ansicht ohne Neuladen.

**Fundstelle / Aufgabe:** Einsatzansicht → Karte → „Mehr…" → „Entfernen" → „Meldung entfernen"
→ „‹ Startseite" (oder Zurück-Geste) → Einsatz wieder öffnen; 390 × 844.

**Beobachtung:** Die Rückfrage sagt: „„Rückgängig" gibt es nur, solange die App geöffnet
bleibt." Die App bleibt offen, trotzdem ist nach „‹ Startseite" und erneutem Öffnen der
Sammlung die Leiste „Entfernt: Meldung Nr. 1 … (11 Personen)" weg; die Zahl bleibt bei 1
Einheit, auf der Seite steht weder „Papierkorb" noch „zurückholen" noch „wiederherstellen".
Mit der Zurück-Geste zeigt sich dasselbe; mit Browser-„Vorwärts" kommt die Leiste wieder.
Dieselbe Handlung in einer zweiten Sammlung geöffnet zeigt keine fremde Leiste (gut).

**Erwartung der Rolle:** Die Rückfrage nennt die tatsächliche Grenze („nur, bis Sie diese
Ansicht verlassen"), oder die Rückgängig-Möglichkeit bleibt, bis die App geschlossen wird.

**Folge:** Wer nach dem Entfernen kurz die Startseite aufruft (oder die Zurück-Taste drückt,
wie am Telefon üblich), hat die Meldung mit bis zu elf Personen endgültig aus der Lage. Der
einzige Weg zurück ist, den Bogen erneut einzulesen oder zu scannen; ist die Datei nicht mehr
zur Hand, fehlt die Einheit samt Historie und Zeiten. P2, weil die Rückfrage davor Name und
Stärke nennt und der Wortlaut die Grenze zu weit fasst.

**Empfehlung:** Den Satz in der Rückfrage an die echte Grenze anpassen; besser die
Rückgängig-Möglichkeit für entfernte Meldungen an der Sammlung festhalten (wie beim
Einsatz-Papierkorb) und beim Wiederöffnen anbieten.

**Nachprüfung:** Meldung entfernen, „‹ Startseite", Einsatz öffnen: Hinweis mit „Rückgängig"
bzw. „Zuletzt entfernt" ist da; Rückfrage nennt die tatsächliche Frist.

### R15-D3 [P3] Ältere Datei nach dem Aufteilen: Warnung „Sie zählen jetzt doppelt" und „1 Bogen aufgenommen", obwohl nur die Historie wächst

**Kennzeichnung:** gemessen (Statuszeile, Kopfzahlen vor und nach dem Einlesen).

**Fundstelle / Aufgabe:** Einheit aufteilen („Trupp 2", vier Personen, bleibt im Einsatz) →
„Bögen einlesen…" → Datei derselben Einheit mit älterem Stand als die Aufteilung (11:52 gegen
12:35); 390 × 844.

**Beobachtung:** Statuszeile: „1 Bogen aufgenommen. „THW Sinsheim …": ⚠ Trupp 2 (4 Personen) ist
abgeteilt; … stehen auch in der neuen Meldung. Sie zählen jetzt doppelt — Trupp entfernen oder
„Zusammenführen…". „THW Sinsheim …": älterer Stand als der vorhandene (26.10.2026, 12:35) — nur
in die Historie gelegt, die Lage bleibt unverändert." Gemessen: Gesamt vorher 11, nachher 11,
Einheiten 2, Historie (3). Es zählt nichts doppelt; der Satz davor widerspricht dem letzten.

**Erwartung der Rolle:** Die Doppelzählungs-Warnung erscheint nur, wenn die Datei die Lage
verändert hat; bei einer nur abgelegten älteren Fassung steht keine solche Aussage.

**Folge:** Wer der Warnung folgt und „Trupp entfernen" tippt, nimmt vier Personen aus der Lage,
die bisher richtig gezählt waren (Gesamt 11 → 7). Die Rückfrage dazu (R14-D1) ist gut, aber der
Anlass ist falsch. P3.

**Empfehlung:** Prüfung nur auf Fassungen anwenden, die in die Lage übernommen werden; bei
„nur in die Historie gelegt" nicht „aufgenommen" und keine Doppelzählung melden.

**Nachprüfung:** Aufteilen, ältere Datei einlesen: Statuszeile ohne „zählen jetzt doppelt";
neuere Datei: Warnung wie bisher.

### R15-D4 [P3] „Als Übung kennzeichnen…" ändert die Herkunftszeile in „am Meldekopf von Hand erfasst"

**Kennzeichnung:** gemessen (Kartentext vor und nach dem Kennzeichnen).

**Fundstelle / Aufgabe:** Karte einer aus Datei eingelesenen Einheit → „Mehr…" → „Als Übung
kennzeichnen…" → bestätigen; 390 × 844.

**Beobachtung:** Vorher: „Stand 26.10.2026, 11:50 · aus Datei übernommen". Nachher: „Stand
26.10.2026, 12:25 · am Meldekopf von Hand erfasst", Marke „neue Fassung", „Folgemeldung 12:25 …
inhaltlich unverändert". Der Bogen selbst ist nicht von Hand erfasst worden. Rückgängig stellt
„aus Datei übernommen" und Stand 11:50 wieder her.

**Erwartung der Rolle:** Die Herkunft bleibt „aus Datei übernommen"; neu ist nur die
Kennzeichnung als Übung mit Zeitpunkt.

**Folge:** Wer später nachvollziehen will, ob ein Bogen von der Einheit selbst kam, liest
fälschlich „von Hand erfasst" und zweifelt die Zahlen an. Keine Zählung betroffen. P3.

**Empfehlung:** Herkunftsangabe beim Umkennzeichnen übernehmen und den Stand der Einheit
(11:50) nicht auf den Zeitpunkt der Kennzeichnung setzen, oder beide Zeitpunkte nennen.

**Nachprüfung:** Datei einlesen, als Übung kennzeichnen: Karte zeigt weiter „aus Datei
übernommen" und nennt Kennzeichnung und Zeitpunkt getrennt.

## Nicht prüfbar / nicht geprüft

Kamera-Scan und Link-Weg, Nahbereich-Weitergabe, echte Handschuhe, native Builds, ein
zweites Gerät, Ablauf der 30 Tage im Papierkorb, „Sicherung einspielen…" und „Geräteschlüssel
neu erzeugen" (in Runde 14 gehalten, hier nicht wiederholt).

## Aufgabe geschafft

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Rückfrage zum Entfernen nennt „App geöffnet" als Grenze des Rückgängig, tatsächlich endet es schon beim Wechsel auf die Startseite (R15-D2).
- **Größtes Einsatzrisiko:** Eine Quittung mit „Rückgängig" kann unter einer älteren Info-Leiste liegen und ist nicht antippbar (R15-D1).
- **Top-Priorität für die nächste Iteration:** R15-D1, immer nur eine Quittungsleiste zeigen, die zuletzt ausgelöste.
