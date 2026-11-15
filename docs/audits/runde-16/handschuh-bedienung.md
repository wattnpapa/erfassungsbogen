# Audit „Handschuh-Bedienung“, Runde 16 (Touch-Ziele, Abstände, Doppeltipp, Sammelaktionen, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand `36d549a`, `main` nach Runde 15)

**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 2 (R16-G1, R16-G2)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`,
`runde-15/README.md`, `runde-14/README.md`, `runde-13/README.md`. Nicht neu gemeldet sind die dort
genannten Grenzen (u. a. R15-S4 Abstand 15,5 px, R15-M2 Fußleiste bei 390 x 844, R15-O1, R12-G3,
Sortierköpfe der Tabelle dicht nebeneinander). Nicht doppelt gemeldet ist ferner R16-H1 aus
`feldtauglichkeit.md` („Zur Liste springen ↓“ und „Alle n einzeln anzeigen“ nur 30 px hoch); ich habe
es unabhängig gemessen (123 x 30 und 150 x 30 bei 11 neuen Bögen) und ergänzend festgestellt, dass auch
„Weniger zeigen“ nur 97 x 30 misst. Ebenso nicht doppelt gemeldet ist R16-D1 (stilles Verwerfen
zweiter Tipps in den ersten 2,5 s).

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`chromium.launch()` ohne Optionen; die Projektkopie
fand keinen Browser), `isMobile`, `hasTouch`, Pixeldichte 2, de-DE. Viewports 390 x 844, 360 x 640,
dazu 320 x 568, 375 x 667, 385 x 800, 412 x 915, 430 x 932 sowie quer 640 x 360, 568 x 320, 844 x 390.
Tipps über `tap()` und `touchscreen.tap()` an festen Koordinaten. Zustand: frisch angelegte
Einsatz-Sammlung „Hochwasser Test“ mit elf Übungsbögen THW (`examples/thw`, über „Bögen einlesen…“),
eigener Bogen im Assistenten, Aufnahme von Hand und Schnellerfassung. Nicht prüfbar: echte Handschuhe,
echte Bildschirmtastatur, Kamera-Scan, native Datums- und Zeitwähler.

Kennzeichnung: **gemessen** = Zahl oder Ablauf aus dem Browser, **Risiko** = plausibel, nicht nachgestellt.

## Urteil

Die Bedienung mit Handschuh trägt weiter. Karten-, Dialog-, Quittungs- und Assistentenknöpfe messen
mindestens 44 px, Paare liegen 8 bis 12 px auseinander. Die Behebungen aus Runde 15 halten (Tabelle
unten). Neu sind zwei kleine P3-Punkte: In der Aufnahme am Meldekopf verliert der Weiter-Knopf bei
Breiten bis 375 px seine Beschriftung und steht neben dem größeren „In Einsatz übernehmen“, und die
Zeilen der offenen Punkte in der Übersicht liegen nur 2 px auseinander.

## Befunde

### R16-G1 [P3] Aufnahme am Meldekopf: bei 375 px Breite und schmaler ist „Weiter“ nur ein Pfeil, 12 px neben dem größeren „In Einsatz übernehmen“

**Kennzeichnung:** gemessen (320 x 568, 360 x 640, 375 x 667, quer 568 x 320).

**Ort:** Assistent in der Aufnahme („Einheit manuell erfassen…“ und Schnellerfassung aus der Einsatzansicht),
feste Fußleiste, alle Schritte.

**Beobachtung:** Die einzeilige Fußleiste (Behebung R15-M2) zeigt bei 360 x 640 „←“ (51 x 44), „◐“ (44 x 47),
„In Einsatz übernehmen“ (147 x 52) und „→“ (51 x 44, nur Pfeil; das Beschriftungsattribut lautet „Weiter →“).
Zwischen „In Einsatz übernehmen“ und „→“ liegen 11 bis 12 px (375 x 667: 162 x 44, 11 px). Im Schritt 5
heißt der Pfeil weiterhin nur „→“, obwohl er zur Übersicht führt. Ab 385 px Breite steht wieder „Weiter →“
(104 x 44) in einer zweiten Zeile, die Leiste ist dann 128 px hoch; quer bei 640 x 360 ebenfalls mit
Beschriftung, bei 568 x 320 wieder nur der Pfeil. Das Antippen von „In Einsatz übernehmen“ im Schritt 4
öffnet die Rückfrage „Erfassung schon abschließen?“ (Jetzt übernehmen / Weiter erfassen), ein Tipp 4 px
links vom Pfeil trifft den Pfeil. Im Schritt 3 mit Stärke 6 habe ich den Weg ohne Rückfrage nicht weiter
verfolgt.

**Erwartung der Rolle:** Der Hauptweg „weiter“ ist der größte oder zumindest benannte Knopf; der
abschließende Knopf ist klar davon abgesetzt.

**Auswirkung im Einsatz:** Gering. Das Zielpaar ist handschuhtauglich getrennt, aber der wichtigste Knopf
ist der kleinste und unbeschriftet; wer mit dem Daumen am rechten Rand zielt, trifft bei einer Fehlbreite von
einem halben Finger „In Einsatz übernehmen“. Die Rückfrage in den Schritten 4 und 5 fängt das ab, in den
Schritten 1 bis 3 nicht geprüft.

**Empfehlung:** Auch bei schmalen Telefonen „Weiter“ als Text führen (etwa „Weiter →“ statt nur „→“, dafür
„◐“ in die Kopfzeile) oder den Abstand zwischen Weiter und „In Einsatz übernehmen“ auf mindestens 16 px legen.

**Nachprüfung:** 360 x 640 und 375 x 667: Der Knopf nach rechts trägt das Wort „Weiter“ (oder „Zur Übersicht“)
und liegt mindestens 16 px von „In Einsatz übernehmen“.

### R16-G2 [P3] Übersicht: die Zeilen der offenen Punkte („antippen zum Beheben“) liegen nur 2 px auseinander

**Kennzeichnung:** gemessen (360 x 640, eigener Bogen ohne Typ, Personal und Ort).

**Ort:** Assistent, Schritt 6 „Gesamtübersicht“, Kasten „3 offene Punkte für die Weitergabe“.

**Beobachtung:** Drei Verweise („Einheitstyp fehlt …“ 250 x 51, „Stärke ist 0 …“ 250 x 51, „Ort/Auftrag ist noch
leer.“ 152 x 44) sind als Aufzählung gesetzt; benachbarte Ziele liegen 2 px auseinander. Jeder Verweis springt in einen
anderen Schritt (1, 3, 2).

**Erwartung der Rolle:** Wie bei den übrigen Listen der App mindestens 8 px Lücke zwischen Zielen mit unterschiedlichem Ziel.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp führt in den falschen Schritt; „Zurück zu Schritt 6“ über die
Reiter kostet einen Tipp, es gehen keine Daten verloren.

**Empfehlung:** Zeilen mit 8 bis 12 px Abstand oder als Knopfreihe mit Rahmen setzen.

**Nachprüfung:** Abstand der drei Zeilen bei 360 x 640 mindestens 8 px.

## Nachprüfung der Behebungen aus Runde 15 (echter Browser)

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R15-G1 Zweiter Tipp nach „Zur Kenntnis genommen“ | hält | 390 x 844 und 360 x 640: zweiter Tipp nach 250, 700, 1300 ms an derselben Stelle zeigt „Einen Moment …“, keine Karte klappt auf; Quittung mit „Rückgängig“ (121 x 44) bleibt |
| R15-G2 Schrittleiste springt | hält | 360 x 640: Reiter 16/69/124/179/234/289, je 55 px, vor und nach „+ Person hinzufügen“ („3. Personal offen“) unverändert |
| Abrücken (Zweittipp) | hält | Knopf wird „✓ Abgerückt“ (gestrichelt), zweiter Tipp nach 0,7 s: „Einen Moment …“; Bildlauf springt nach der Aktion um rund 176 px, die Quittung steht unten mit „Rückgängig“ 121 x 44 |
| Karten „Mehr…“ | hält | 390 x 844: Aufteilen…, Stärke ändern…, Als Einsatzmeldung zählen…, Verschieben…, Entfernen 44 px hoch, „Entfernen“ 81 px von „Verschieben…“ |
| Dialoge (Stärke ändern, Entfernen, Zählen) | hält | 360 x 640: Knöpfe 302 x 44, Abstand 8 px, Dialog passt in 640 px |
| Aufteilen | hält | Kästchenzeilen 64 px hoch, Tipp neben dem Namen schaltet das Kästchen; „Aufteilen“/„Abbrechen“ 44 px |
| Rückfrage „Erfassung schon abschließen?“ | hält | Knöpfe 302 x 44, 12 px Abstand, „Jetzt übernehmen“ oben |
| Zahlenfelder Schnellerfassung | hält | „−“/„+“ 52 x 52, Feld 60 x 52, Zifferntastatur (`inputmode=numeric`), 6 bis 7 px Abstand |
| Tabelle 360 x 640 | hält | Sortierköpfe 44 px hoch; keine Zeilenaktionen, nur Lesen |
| Querformat 640 x 360, 568 x 320, 844 x 390 | hält | Fußleiste 56 px, Felder im Bild (Beschriftung siehe R16-G1) |
| Lagemonitor | hält | „Dunkler“ 83 x 44, „Heller (weiß)“ 116 x 44, 8 px Abstand; öffnet in neuem Fenster |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Der unbeschriftete Pfeil neben dem breiten „In Einsatz übernehmen“ lässt offen, welcher Knopf weiterführt.
- **Größtes Einsatzrisiko:** Gering: Ein Fehltipp auf „In Einsatz übernehmen“ in den Schritten 1 bis 3 der Aufnahme.
- **Top-Priorität für die nächste Iteration:** „Weiter“ bei schmalen Telefonen wieder beschriften (R16-G1).
