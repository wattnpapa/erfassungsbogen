# Audit „Handschuh-Bedienung“, Runde 15 (Touch-Ziele, Abstände, Doppeltipp, Sammelaktionen, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand
`a7874f0`, `main` nach Runde 14)

**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 2 (R15-G1, R15-G2)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`,
`runde-14/README.md`, `runde-13/README.md`, `runde-12/README.md` und der Bericht
`runde-14/handschuh-bedienung.md`. Nicht neu gemeldet sind die dort genannten Grenzen und Reste
(u. a. R6-G6 Schrittleiste und Karten/Tabelle ohne Lücke, Sortierköpfe der Tabelle dicht
nebeneinander, lückenlose Fußzeilen-Linklisten und Vorschlagslisten, Fließtext-Links der
Begleitseiten, R12-G3, R13-W1, R13-W6, R13-H1, R14-S2, R14-E7). Nicht doppelt gemeldet sind
ferner Befunde, die in den übrigen Runde-15-Berichten stehen (u. a. R15-D1, R15-D2, R15-E4,
R15-H1, R15-N2).

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`chromium.launch()` ohne Optionen; die Projektkopie
fand keinen passenden Browser), `isMobile`, `hasTouch`, Pixeldichte 2, de-DE. Viewports 390 × 844,
360 × 640, 640 × 360, einzelne Läufe 320 × 568. Tipps über `tap()` und `touchscreen.tap()` an festen
Koordinaten (für Doppeltipps). Zustand: frisch angelegte Einsatz-Sammlung „Hochwasser Test“ mit
elf Übungsbögen THW (`examples/thw`, `uebung` false, `stand` auf „vor zwei Stunden“), eingelesen
über „Bögen einlesen…“; eigener Bogen im Assistenten; Schnellerfassung. Tastatur nachgestellt durch
Verkleinern der Fensterhöhe (300 bis 330 px). Nicht prüfbar: echte Handschuhe, echte
Bildschirmtastatur, Kamera-Scan, native Zeit- und Datumswähler.

Kennzeichnung: **gemessen** = Zahl oder Ablauf aus dem Browser, **Risiko** = plausibel, nicht
nachgestellt.

## Urteil

Die Bedienung mit Handschuh trägt weiter. Alle Knöpfe der Einsatzansicht, der Karten, der
Quittung, der Dialoge und des Assistenten messen mindestens 44 px Höhe, Paare liegen 8 bis 12 px
auseinander; bei 320 × 568 ragt nichts über den Rand und nichts außer den Kästchen (24 px in
44-px-Zeilen) unterschreitet 44 px. Zahlenfelder verlangen die Zifferntastatur. Zerstörende
Knöpfe („Meldung entfernen“, „Fahrzeug entfernen“, „Verwerfen“, „Bogen schließen“, „Alle Daten
löschen“) fragen zurück und liegen mit „Abbrechen“ 12 bis 57 px getrennt. Bei verkleinerter
Fensterhöhe (Tastatur) rücken Dialoge und Fußleiste so, dass Feld und Knöpfe erreichbar bleiben.
Neu belegt sind zwei P3-Punkte: ein zweiter Tipp nach „Zur Kenntnis genommen“ trifft eine
Karte, und die Schrittleiste springt, sobald ein Schritt „offen“ bekommt.

## Befunde

### R15-G1 [P3] Zweiter Tipp auf „Zur Kenntnis genommen“ klappt eine Karte auf, weil die Liste darunter nachrückt

**Kennzeichnung:** gemessen (390 × 844 und 360 × 640, elf Bögen, Abstand der Tipps 250 ms, 700 ms
und 1 300 ms; `touchscreen.tap` an derselben Koordinate).

**Ort:** Einsatzansicht, Block „Neu seit der letzten Kenntnisnahme (11)“, Knopf „Zur Kenntnis
genommen“ (155 × 44).

**Beobachtung:** Nach dem ersten Tipp verschwindet der Block mit den elf Zeilen, die Inhalte
darunter rücken um mehrere hundert Pixel nach oben. Unter der Fingerposition liegt danach die
Kopfzeile der Karte Nr. 1 („Aufklappen: Zeiten, Details und Aktionen“). Der zweite Tipp, auch nach
1,3 s, klappt diese Karte auf („Zuklappen“, „Abrücken“, „Mehr…“ sichtbar); die Quittung „Zur
Kenntnis genommen: 11 Einheiten“ bleibt mit „Rückgängig“ stehen. Zum Vergleich: Bei „Zuordnen“
(Zug für alle) und „Abrücken“ trifft ein zweiter Tipp an derselben Stelle nichts Wirksames (Lücke
bzw. gesperrt, „Einen Moment …“). Der Knopf selbst hat keine Sperre für den Nachlauf.

**Folge:** Wer mit Handschuh doppelt tippt oder nach dem Tipp zweifelt, klappt unbeabsichtigt eine
beliebige Karte auf; die Liste springt ein weiteres Mal und die Aufmerksamkeit geht an die falsche
Stelle. Kein Datenverlust, die Aktionsknöpfe der geöffneten Karte liegen nicht unter dem Finger.

**Empfehlung:** Nach „Zur Kenntnis genommen“ die Bildlaufstelle so halten, dass nichts
Tippbares an die Fingerposition rückt (etwa den Block durch eine Zeile gleicher Höhe ersetzen oder
den Bildlauf zur Quittung führen), oder den Nachlauf wie bei den anderen Sammelaktionen sperren.

**Nachprüfung:** Zwei Tipps im Abstand von 250 ms, 700 ms und 1,3 s an derselben Stelle lassen
keine Karte aufklappen; die Quittung steht einmal da.

### R15-G2 [P3] Schrittleiste des Assistenten springt, sobald ein Schritt „offen“ bekommt

**Kennzeichnung:** gemessen (360 × 640, Schritt 3 „Personal“, „+ Person hinzufügen“ mit leerer
Person).

**Ort:** Assistent, Schrittleiste unter dem Kopf.

**Beobachtung:** Vor dem Hinzufügen messen die Reiter 53 bis 55 px Breite, „4. Fahrzeuge“ liegt
bei x = 179, „5. Sofortbedarf“ bei 234, „6. Übersicht“ bei 289. Mit der leeren Person erscheint
„3. Personal offen“ (85 px); alle übrigen Reiter schrumpfen auf 47 bis 49 px und rücken: „4.
Fahrzeuge“ auf x = 197 (+18), „5. Sofortbedarf“ auf 246 (+12), „6. Übersicht“ auf 295 (+6). Die
Verschiebung geschieht ohne Zutun des Fingers, während man tippt oder liest.

**Folge:** Gering. Wer sich die Lage eines Reiters gemerkt hat, trifft bei der Rückkehr zur Leiste
den Nachbarn und landet in einem anderen Schritt (umkehrbar, kostet einen Tipp). Die Hauptführung
(„Weiter →“, 104 × 44, unten fest) bleibt davon unberührt.

**Empfehlung:** Reiterbreite von der Marke „offen“ entkoppeln (Marke als kleines Zeichen im
gleichen Platz, oder feste Breite je Reiter), damit sich die Lage nicht ändert.

**Nachprüfung:** Lage und Breite der sechs Reiter bei 360 px sind vor und nach „+ Person
hinzufügen“ gleich.

## Nachprüfung der Behebungen aus Runde 14 (echter Browser)

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R14-G1 Doppeltipp „Einsatz weitergeben / sichern“ | hält | 390 × 844, 11 Bögen: Tipps im Abstand von 150 ms und 3,5 s ergeben je eine Datei (`eeb-einsatz-…pdf`, nach 3,8 bis 4,0 s); Lageblatt (A4 quer), „Übersicht als CSV“, „Alle Daten als CSV“ und Excel-Liste je ein Download bei zwei Tipps im Abstand von 300 ms |
| R14-G2 „Zuordnen“ ohne Quittung | hält | 390 × 844: Quittung „Zug „3. Zug“ gesetzt: 11 Einheiten“ mit „Rückgängig“ 121 × 44 und „✕“ 44 × 44; Quittung bleibt mindestens 60 s stehen; ein zweiter Tipp an derselben Stelle (700 ms, 1,3 s) löst nichts Weiteres aus |
| R14-G3 Ansicht-Kacheln | hält | Startseite und Fußzeile: „Standard“ 95 × 44, „Feld“ 65 × 44 (8 px Abstand), „Dunkel“ 83 × 44, „Nacht“ 77 × 44 (8 px Abstand, 8 px zur Zeile darüber) |
| R14-H3 Länderliste der Übersichtsseite | hält | `uebersicht.html`, 360 × 640: Listenzeilen 44 px hoch, 8 px Abstand. Die anklickbare Karte darüber hat kleine Flächen (Berlin 23 × 17, Saarland 38 × 30); die Liste darunter ist der Handschuh-Weg |
| R14-K5 Erfassungsknöpfe kompakt | hält | 360 × 640: „Bögen einlesen…“ und „Einheit manuell erfassen…“ nebeneinander (160 × 61, 8 px Abstand), „Bogen scannen…“ darüber (328 × 57) |
| R14-S1 Rückgängig nach Abrücken | hält | „Abrücken“ unten im Bild (y = 520 von 640): zweiter Tipp nach 0,7 s und 1,5 s an derselben Stelle trifft „Rückgängig“, macht aber nichts rückgängig (gesperrt, „Einen Moment …“) |
| Personal- und Fahrzeugzeilen | hält | 360 × 640: „Person entfernen“ 136 × 44, „Fahrzeug entfernen“ 150 × 44 mit Rückfrage („THW-91234 entfernen?“, 15 Minuten Rückgängig), ▲ ▼ ⇑ je 44 × 44 mit 12 px Abstand |
| Querformat 640 × 360 | hält | Karten zeigen die Aktionen ohne Aufklappen, Rückfrage „Meldung entfernen?“ teilt Text links und Knöpfe rechts (217 × 44, 12 px Abstand), Scanner-Knöpfe 3 × 44 px bleiben im Bild |
| Tastatur (Fensterhöhe 300 bis 330) | hält | Fußleiste des Assistenten verschwindet, fokussiertes Feld bleibt im Bild; Dialog „Stärke ändern…“ 286 px hoch, beide Knöpfe im Bild; Vorschlagsliste Einheitstyp 254 px mit eigenem Bildlauf |
| 320 × 568 | hält | Kein seitliches Überlaufen (Einsatzansicht, geöffnete Karte mit „Mehr…“); keine Fläche unter 44 px außer „Zum Inhalt springen“ (verborgen) und den 24-px-Kästchen in 44-px-Zeilen |
| Dialoge Datensicherung, Alle Daten löschen, Geräteschlüssel | hält | Knöpfe 278 bis 302 × 44 bis 45 px, „Endgültig löschen“ 57 px von „Abbrechen“ getrennt, Bestätigungskästchen mit 48-px-Zeile |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Nach „Zur Kenntnis genommen“ sieht die Seite so anders aus, dass ein zweiter Tipp wie eine Wiederholung wirkt und stattdessen eine Karte öffnet.
- **Größtes Einsatzrisiko:** Gering: Nachrückende Inhalte unter dem Finger nach einer Sammelaktion; wirksam geschützt sind inzwischen die Aktionen mit Datenfolgen.
- **Top-Priorität für die nächste Iteration:** Bildlaufstelle und Nachlauf nach „Zur Kenntnis genommen“ (R15-G1), dann feste Lage der Reiter in der Schrittleiste (R15-G2).
