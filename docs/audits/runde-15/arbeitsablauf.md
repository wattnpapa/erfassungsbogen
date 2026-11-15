# Audit „Arbeitsablauf", Runde 15 (Einheit → Meldekopf → Ablösung → Sicherung)

Prüfer: Rollenaudit `thw-workflow-reviewer` · Datum: 2026-10-26 · Prüfgegenstand:
Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand Commit `a7874f0`
(Stand `main` nach Runde 14).

**Zählung: P0 0 · P1 0 · P2 2 · P3 2**

Reiner Prüfbericht, keine Codeänderung. Nicht erneut gemeldet sind die bekannten
Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4), die Reste aus Runde 10 (leere Karten bei „Nur Stärke", Rückgängig für
Meldungen überlebt das Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320), Runde 11
(R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3), Runde 12 (R12-W3, R12-H3,
R12-O2, R12-O4, R12-G3), Runde 13 (R13-W1, R13-W6, R13-H1) und Runde 14 (R14-E7,
R14-S2, R14-H1 nur Mindestvariante, R14-W3 Regelsatz nicht im Lageblatt). Der
Hinweis „Anderer Einsatz?" an Übungsbögen (Ortsname aus dem Auftrag kommt in der
Sammlung nicht vor) ist R14-W3 und wird nicht wiederholt.

## Prüfaufbau

Playwright (Projektkopie fand den Browser, `chromium.launch()` ohne Optionen,
nichts installiert), `isMobile`/`hasTouch`, Locale de-DE, Viewports 390 × 844
(durchgehend) und 360 × 640 (Tabelle, Aufteilen, Details, Scanner, Überlauf auch
bei 320 × 568). Geräteuhr 26.10.2026. Je „Gerät" ein eigener Browserkontext.

Eingang der Bögen auf dem echten Weg: Übungsbogen öffnen, Zeitraum auf heute
setzen, „Dies ist eine Übung" abwählen (Rückfrage „Beispieldaten im Bogen" mit
„Trotzdem als Einsatz" bestätigt), „Bogen übergeben… → Weitere Formate → Link
teilen" (`navigator.share` gestubbt, Host auf `localhost:4173` umgeschrieben), dann
Öffnen des Links am Meldekopf. Vier Einheiten (Albstadt Ztr TZ, Biberach FGr O,
Crailsheim FGr W, Rottweil Tr UL). Weiter: Aufnehmen, Zug zuordnen, Auftrag,
Eintreffzeit ändern, Abrücken, Stärke ändern, Aufteilen, Lageblatt, Sammel-PDF,
Nachtrag („Nur neue Bögen"), CSV, Excel („Oldenburg"), Lagemonitor, Sammel-PDF auf
einem zweiten Gerät (zweimal, Stand 1 und Stand 2), Datensicherung erstellen und auf
einem leeren Gerät einspielen, Einsatz löschen. PDF mit `pdftotext`, Excel mit
`openpyxl` gelesen. Nicht prüfbar: Kamera-Scan, Nahbereich, echte Handschuhe,
Bildschirmtastatur, native Builds.

Erwartete Arbeitsfolge (**Annahme** zum realen THW-Ablauf, nicht bekannt):

1. Die Einheit schickt ihren Bogen als Link oder Datei; der Meldekopf legt ihn in
   seinem Einsatz ab, ordnet Zug und Auftrag zu und korrigiert Zeit und Stärke.
2. Einheiten rücken ab oder werden aufgeteilt; der Stab bekommt Lageblatt, Tabelle
   oder Excel-Liste.
3. Zur Schichtübergabe geht die Sammlung als Sammel-PDF an die Ablösung, am Ende
   wird gesichert.

## Urteil

Der Ablauf trägt und ist gegenüber Runde 14 stabil. Link → Aufnehmen → Zug (mit
Quittung und „Rückgängig") → Auftrag → Abrücken → Stärke ändern (Folgemeldung mit
Gegenüberstellung) → Aufteilen → Lageblatt → Sammel-PDF → zweites Gerät → Sicherung
laufen ohne fremde Hilfe, auch bei 360 × 640 und 320 × 568 ohne seitlichen Überlauf.
Zahlen in Bildschirm, Lageblatt, Sammel-PDF, CSV und Excel stimmen bis auf die unten
genannte Tabellenspalte überein. Reibung entsteht dort, wo die App **nichts
Sichtbares tut**: ein übersprungener Doppelempfang, ein stilles Speichern des
Auftrags und eine Tabelle, die Zahlen unter einer anderen Überschrift führt als
alle anderen Ausgaben.

### Behebungen aus Runde 14, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R14-G1 Doppeltipp | hält. Zwei Taps im Abstand von 100 bis 150 ms auf „Einsatz anlegen", „In … aufnehmen" und „Abrücken": je ein Einsatz, eine Meldung, ein Abrückvermerk (Speicher geprüft) |
| R14-H1 Link ohne Sammlung | hält als Mindestvariante. Kaltstart mit Link: Übersicht mit Hinweis „Meldung einer fremden Einheit: Sie gehört in eine Einsatz-Sammlung", Hauptknopf „In Einsatz-Sammlung ablegen…" steht vor „Bogen übergeben…"; ohne Sammlung führt er über „Neue Sammlung anlegen…" in die Ablage, die Einheit liegt danach als Nr. 1 in der neuen Sammlung |
| R14-H2/D3/G2 Zugzuordnung | hält. „Zug „1. Zug" gesetzt: 4 Einheiten" mit „Rückgängig"; „Zug 1", „ZUG1" und „1.Zug" landen im selben Zug, „TZ 2" bleibt eigener Zug |
| R14-E1 Übung zählen | hält. Unter „Mehr…" der Karte „Als Einsatzmeldung zählen?" mit Zahl der Personen und Hinweis auf „Rückgängig" |
| R14-E6 Übung abwählen | hält. Beim Abwählen am Übungsbogen kommt „Beispieldaten im Bogen" mit „Übung beibehalten" / „Trotzdem als Einsatz" |
| R14-W5 Zahlen in Dialog und Quittung | hält. Stärke 11 → 9 steht in Dialog („Gesamt: 9 (bisher 11)"), Quittung und Karte gleich; Verpflegung zieht mit (27 → 25) |
| R14-A1 Eintreffzeit | hält. Lageblatt trägt „11:52 *" mit Fußnote „Zeit des Einlesens am Gerät, nicht vom Absender … bestätigt" |
| R14-S1 Zurück-Geste | hält für Auftrag/Notiz. Ein getippter, nicht gespeicherter Auftrag steht nach Browser-Zurück und erneutem Öffnen der Sammlung auf der Karte |
| Sammel-PDF auf zweitem Gerät | hält. Stand 1 (3 Einheiten) und danach Stand 2 auf demselben Gerät: „1 neue Einheit. Jetzt 4 Einheiten, davon 3 anwesend. 1 Meldung aktualisiert: Albstadt abgerückt 12:02"; nur die neue Einheit steht unter „Neu seit der letzten Kenntnisnahme" |
| Eintreffzeit in der Zukunft | hält. „Stimmt die Zeit? … liegt in der Zukunft — Tag oder Monat vertauscht?" |
| Aufteilen (R14-D1) | hält. Quittung „„Trupp Ortung 1" von „THW Biberach/Riß …" abgeteilt. Später zurück über „Mehr…" › „Zusammenführen…"" mit „Rückgängig"; Rest zeigt „Stärke 11 → 9 · 1 Fahrzeug abgemeldet" |

## Befunde

### R15-W1 [P2] Übersprungener Doppelempfang: sichtbar steht dasselbe wie bei einer neuen Meldung, die Quittung liegt rund 4 300 px weiter unten

**Fundstelle / Aufgabe:** Meldekopf, Einsatzansicht. Dieselbe Einheit ein zweites Mal
per Link erhalten (Funkgerät-Rückfrage „schick's nochmal", Messenger doppelt,
Wiederholung nach Funkloch) und im Dialog „Wohin damit?" auf „In „Hochwasser Weser"
aufnehmen" tippen. Gemessen bei 390 × 844.

**Beobachtung:** Der Dialog „Meldung … empfangen" sagt weder, dass die Einheit schon
in der Sammlung liegt, noch dass sich nichts ändern würde. Nach dem Tippen steht oben
im sichtbaren Bereich „Zuletzt eingelesen: „THW Albstadt Zugtrupp Technischer Zug" ·
jetzt 3 Einheiten, Gesamt 27" und darunter „Neu seit der letzten Kenntnisnahme (3)
… Albstadt — neu gemeldet" — also genau das, was auch eine neu aufgenommene Meldung
zeigt. Die eigentliche Auskunft „Bereits vorhanden — übersprungen (gleicher Inhalt).
Die Zeile in der Liste ist quittiert." steht in der Statusmeldung am Seitenende
(Oberkante 4 303 px, Bildlauf bei 0, Fensterhöhe 844). Kein Toast, keine Meldeleiste.
Zweite Variante: Wurde die Einheit am Meldekopf vorher korrigiert (Stärke 11 → 9) und
kommt danach der alte Link (11) noch einmal, bleibt oben die Meldung der Korrektur
stehen („Zuletzt abgelegt: … Folgemeldung: ▼ Stärke 11 → 9 (−2) …" mit „Rückgängig"
und der Leiste „Stärke 11 → 9 geändert"). Das liest sich, als habe der eben
aufgenommene Link die Stärke auf 9 gesenkt; dass er verworfen wurde und die 9
Handarbeit sind, steht wieder nur ganz unten.

**Erwartung der Rolle:** Nach dem Tippen eine kurze, sichtbare Antwort: „Schon da —
nichts geändert" bzw. „Alte Fassung (11) — Ihre Korrektur (9) bleibt".

**Folge:** Der Meldekopf weiß nicht, ob die Meldung angekommen ist, ob sie etwas
verändert hat oder ob sie ignoriert wurde; er scrollt oder tippt erneut. Bei der
zweiten Variante hält er die Korrektur auf 9 für eine Meldung der Einheit.

**Empfehlung:** Die Quittung für „übersprungen" in dieselbe sichtbare Leiste legen
wie die übrigen Quittungen (Zug, Abrücken, Stärke), mit dem Wort „übersprungen" und
bei abweichender Stärke mit beiden Zahlen. Die Zeile „Zuletzt eingelesen" bei einem
übersprungenen Empfang nicht neu setzen oder als „bereits vorhanden" kennzeichnen.
Bereits im Dialog „Wohin damit?" erwähnen, wenn die Einheit in der Sammlung liegt.

**Verifikation:** Link zweimal aufnehmen, bei 390 × 844 mit Bildlauf 0 prüfen, dass
„übersprungen" im Fenster steht; Variante mit korrigierter Stärke wiederholen.

### R15-W2 [P2] Tabelle: Spalten „UNT. M/W/D — Unterbringung" führen die WC/Dusche-Zahlen aller Anwesenden; Summe 25 / 6 / 0 steht neben „Unterbringung 15 Personen"

**Fundstelle / Aufgabe:** Meldekopf, Einheitenliste → „Tabelle" (390 × 844 und
360 × 640), vier gemeldete Einheiten, davon nur Biberach (11) und Rottweil (4) mit
„Unterbr.".

**Beobachtung:** Spaltenköpfe „UNT. M", „UNT. W", „UNT. D" mit Langform
„UNTERBRINGUNG MÄNNLICH/WEIBLICH/DIVERS". Albstadt, das keine Unterbringung
angefordert hat (Karte: „keine Unterbringung"), steht dort mit 2 / 2 / 0; Crailsheim
mit 11 / 1 / 0. Die Summenzeile lautet 25 / 6 / 0 = 31 Personen. Die Bedarfszeile
derselben Ansicht sagt „Unterbringung 15 Personen". CSV („Unterbringung angefordert
M/W/D" Albstadt 0/0/0, Biberach 8/3/0, daneben „WC/Dusche M/W/D" 2/2/0 …), Excel
(„ÜN (m/w/d)" Albstadt 0/0/0), Lageblatt und Sammel-PDF („Unterbringung angefordert:
2 Einheiten, 15 Personen" getrennt von „WC/Dusche (alle Anwesenden)") trennen beides.
Nur die Bildschirmtabelle beschriftet die WC/Dusche-Zahlen als Unterbringung. Das
war in Runde 4 (R4-W5) nur für CSV und Excel bereinigt worden.

**Erwartung der Rolle:** Unter „Unterbringung" steht, was zum Schlafen angefordert
wurde, und die Summe passt zur Bedarfszeile.

**Folge:** Wer die Tabelle für die Planung der Schlafplätze liest, plant rund das
Doppelte (31 statt 15) und führt Einheiten als Unterbringungsbedarf, die nichts
angefordert haben. Die Zahl widerspricht dem Lageblatt, das derselbe Meldekopf dem
Stab gibt.

**Empfehlung:** Die Spalten wie in CSV und Excel führen: „Unterbringung angefordert
M/W/D" nur bei Anforderung, „WC/Dusche M/W/D" getrennt, oder die vorhandenen Spalten
in „WC/Dusche M/W/D" umbenennen und eine Unterbringungsspalte ergänzen.

**Verifikation:** Beispiel mit einer Einheit ohne Unterbringungsanforderung: Tabellen-
summe „Unterbringung" gleich Bedarfszeile, gleich Lageblatt, gleich CSV.

### R15-W3 [P3] Auftrag/Notiz speichern ohne Quittung; bei aktivem Filter „ohne Auftrag" verschwindet die Karte und der Bildlauf springt

**Fundstelle / Aufgabe:** Meldekopf, Einheitenliste, Filter „4 ohne Auftrag", Karte
aufklappen → „Auftrag/Notiz" → Text → „Speichern" (390 × 844).

**Beobachtung:** Das Speichern meldet nichts (Zug-Zuordnung, Abrücken und
Stärke melden mit Leiste und „Rückgängig"). Mit aktivem Filter fällt die Karte
sofort aus der Liste; Kopf „Einheiten (3 von 4 gemeldet …)" und „3 ohne Auftrag"
ändern sich, die Seite springt von 2 033 px auf 1 372 px. Eine Aussage „Auftrag
für Nr. 1 gespeichert" gibt es nicht. Ohne Filter erscheint der Auftrag nur auf der
Karte („Auftrag/Notiz: …").

**Erwartung der Rolle:** Beim Durcharbeiten der Liste „ohne Auftrag" die Bestätigung,
welche Einheit eben welchen Auftrag erhalten hat.

**Folge:** Gering; der Helfer sieht die Zahl sinken und kann schließen, dass es
geklappt hat. Bei Unsicherheit sucht er die verschwundene Karte, um den Text zu
prüfen.

**Empfehlung:** Auftrag/Notiz wie die Zugzuordnung quittieren („Auftrag für Nr. 1
gesetzt", mit „Rückgängig").

**Verifikation:** Filter „ohne Auftrag", Auftrag speichern: Leiste mit Einheit und
Text sichtbar.

### R15-W4 [P3] „Sicherung eingespielt … Die App lädt jetzt neu." — es lädt nichts neu, bis „Neu laden" getippt wird

**Fundstelle / Aufgabe:** Startseite → „Datensicherung" → „Sicherung einspielen…" auf
einem leeren Gerät → „Einspielen und ersetzen".

**Beobachtung:** Der Dialog „Sicherung eingespielt: 4 Einträge übernommen. Die App
lädt jetzt neu." steht mit der einzigen Schaltfläche „Neu laden". In sechs Sekunden
löst die App kein Neuladen aus (kein Load-Ereignis); erst der Tipp lädt neu. „Escape"
schließt den Dialog ohne Neuladen; die Oberfläche zeigt dann bereits den
eingespielten Stand. Dasselbe Muster steht im Quelltext beim Geräteschlüssel („Der
neue Schlüssel steht. Die App lädt jetzt neu.").

**Erwartung der Rolle:** Entweder lädt die App von selbst neu, oder der Text sagt
„Zum Abschluss neu laden".

**Folge:** Gering; ein Helfer wartet auf etwas, das nur er auslösen kann.

**Empfehlung:** Text angleichen: „Zum Abschluss „Neu laden" tippen."

**Verifikation:** Einspielen, Dialogtext lesen; Text und Verhalten stimmen überein.

## Ausdrücklich ohne Befund

Zahlen in App, Lageblatt (3 Einheiten, 1 / 6 / 20 / 27), Sammel-PDF und Excel;
Nachtrag-Logik „Nur neue Bögen" (Weitergabe an die Ablösung zählt nicht als
Lieferung an den Stab); Lagemonitor (ohne Namen, „1 abgerückt"); Einsatz löschen
(Papierkorb, 30 Tage, Namensnennung); Fremdbogen-Dialog bei zwei Sammlungen (beide
zur Wahl); angefangene Erfassung bleibt beim Eintreffen eines Links erhalten
(„Angefangene Erfassung für diesen Einsatz: …") und ist wieder erreichbar; kein
seitlicher Überlauf bei 360 × 640 und 320 × 568.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Tabelle führt WC/Dusche-Zahlen unter „Unterbringung" (R15-W2).
- **Größtes Einsatzrisiko:** Ein übersprungener oder veralteter Doppelempfang ist am Telefon nicht von einer neuen Meldung zu unterscheiden (R15-W1).
- **Top-Priorität für die nächste Iteration:** R15-W2, Tabellenspalten „Unterbringung" und „WC/Dusche" wie in CSV, Excel und Lageblatt trennen.
