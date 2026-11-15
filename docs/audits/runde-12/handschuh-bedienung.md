# Audit „Handschuh-Bedienung“, Runde 12 (Touch-Ziele, Abstände, Doppeltipp, Tastatur, Rückfragen, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, `vite preview`,
Code-Stand Commit `2c96abe`, `main` nach Runde 11)

**Zählung:** P0: 0 · P1: 0 · P2: 2 (R12-G1, R12-G2) · P3: 1 (R12-G3)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`
und `docs/audits/runde-11/README.md`. Nicht neu gemeldet sind die dort genannten Grenzen
und Reste (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4,
leere Karten bei „Nur Stärke“, Rückgängig für Meldungen überlebt das Neuladen nicht,
Tabellenzeilenhöhe bei 180 × 320, R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1,
R11-M3) sowie R6-G6 (Schrittleiste und Karten/Tabelle-Umschalter ohne Lücke, laut
Runde 11 offen).

## Prüfaufbau

Chromium über `require('playwright')` ohne Startoptionen (globales Modul, die
Projektkopie fand keinen Browser), `isMobile` und `hasTouch`, Pixeldichte 2, Locale
de-DE, je Lauf ein eigener Browser-Kontext. Viewports 390 × 844 und 360 × 640
(Hauptlage), 640 × 360 quer; niedrige Tastatur über Viewporthöhen von 330, 300 und
280 px, dazu 180 × 320 für die Dialoge. Zustände per `localStorage`-Seed
(`eeb.entwurf.v1`: Bogen „THW Albstadt Zugtrupp Technischer Zug“ mit 4 Personen,
2 Fahrzeugen, Stand „jetzt“, damit die Datenschutzfrist nicht anspringt;
`eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt“ mit sechs Übungsbögen,
`uebung: false`).

Gemessen sind Rechtecke per `getBoundingClientRect` (Maßstab 44 px Kante, 8 px
Abstand), Treffer per `document.elementFromPoint` und Tipps per `touchscreen.tap()`
bzw. (zur Gegenprobe) `mouse.click()`. Doppeltipps mit 90 bis 800 ms Abstand,
Downloads über das Playwright-Ereignis `download`, Speicherstand aus `localStorage`.

Geprüft: Startseite; Schritte 1 bis 6 des eigenen Bogens (alle Eingabefelder auf
Sichtbarkeit nach dem Antippen, auch mit niedriger Tastatur); Erfassung im Einsatz
(„Einheit manuell erfassen…“, Zettelangaben, „In Einsatz übernehmen“); Schnellerfassung;
Einsatzansicht (Karten, Tabelle, aufgeklappte Karte, „Mehr…“, „Abrücken“ mit Quittung,
„Stärke ändern…“, „Aufteilen…“, „Entfernen“, „Verschieben…“); Scanner ohne Kamera;
Dialoge „Bogen übergeben…“, „Einsatz löschen…“, „Datensicherung“, „Übungsbögen“,
„Alle Daten löschen“; Ansicht „Feld“; Querformat; alle Ausgaben der Einsatzansicht
(Sammel-PDF, Lageblatt, Blanko, CSV, Excel) und die Bestätigungsknöpfe der Rückfragen auf
Doppeltipp.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, echte Bildschirmtastatur
(Beschriftung der Eingabetaste, Aufspringen beim Fokus), Wischen und Ziehen,
Safari/WebKit, native Datums- und Zeitwähler (die Zettelzeit „Eingetroffen um“ ist ein
nativer Zeitwähler), echter Browser-Zoom, Kamera-Scan, Geräteuhr-Warnung (R7-G8/H9).

Kennzeichnung: **gemessen** = Zahl oder Wert aus dem Browser, **beobachtet** = im Ablauf
oder auf dem Bildschirmfoto gesehen, **Risiko** = plausibel, aber nicht nachgestellt.

## Urteil

Die Bedienung mit Handschuh trägt weiterhin. Alle Knöpfe, Eingaben und Auswahlfelder
der geprüften Schritte und Ansichten sind mindestens 44 px hoch (gemessen, außer dem
unsichtbaren Sprunglink „Zum Inhalt springen“ mit 36 px). Kein seitlicher Überlauf in
390 × 844, 360 × 640, 640 × 360 und 180 × 320. Alle Eingabefelder der Schritte 1, 3, 4
und 5 liegen nach dem Antippen frei zwischen Kopf und Fußleiste, auch bei 330 px
Fensterhöhe (Tastatur nachgestellt). Rückfragen halten sich: Der zweite Tipp eines
Doppeltipps auf „Verwerfen“, „In den Papierkorb“ und „Meldung entfernen“ trifft nichts
Darunterliegendes, die rote Wahl liegt in keinem Dialog dort, wo vorher der auslösende
Knopf stand. Alle Aufgaben (Bogen durchblättern, Personen und Fahrzeuge erfassen, Einheit
abrücken und zurücknehmen, Stärke ändern, aufteilen, von Hand aufnehmen, Bogen und
Einsatz weitergeben, Daten löschen) sind ohne fremde Hilfe zu schaffen.

Neu und belegt sind zwei P2-Punkte und ein P3-Punkt: eine Fehlbedienung, die still eine
Funktion der Person löscht (R12-G1), und fehlende Doppeltipp-Sperren an allen Ausgaben der
Einsatzansicht (R12-G2). Kein P0, kein P1.

## Befunde

### R12-G1 [P2] Ein Tipp neben ein Funktionsfeld in Schritt 3 löscht still die erste Funktion der Person

**Priorität:** P2

**Kennzeichnung:** gemessen (Speicherstand vor und nach dem Tipp, Treffer-Elemente) und mit
Mausklick gegengeprüft; für „Weitere Qualifikationen“ mit Chips Risiko (gleiche Bauart,
im Seed hat niemand eine Zusatzqualifikation).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“, je Person das Feld „Funktionen /
Zusatzfunktionen“ (Chips „ZFü ×“, darunter Eingabefeld „Funktion…“ und „+ eigener Text“).

**Beobachtung:** Das ganze Feld ist eine einzige Beschriftung (`label.feld`, bei 360 px
Breite 260 × 177 px), in der der Chip-Knopf „ZFü entfernen“ als erstes bedienbares Element
steht. Ein Tipp irgendwo auf der Beschriftung außerhalb des Eingabefelds löst darum den
Knopf „entfernen“ des ersten Chips aus. Gemessen bei 360 × 640 (Person 1, eine Funktion „ZFü“):

- auf die Titelzeile „Funktionen / Zusatzfunktionen“ (+200/+6 und +20/+16 px): Funktion weg
- neben dem Chip rechts, zwischen Chip und Eingabefeld (+200/+60, +250/+100): Funktion weg
- unterhalb, neben „+ eigener Text“ (+200/+150): Funktion weg
- ein Tipp 7 px links außerhalb des Chips: Funktion weg (Berührungsradius des Browsers)
- Kontrolle: Tipp im Eingabefeld und Tipp weit außerhalb des Felds: nichts passiert

Bei Person 3 („He“, „Spr“) verschwindet mit einem Tipp auf die Titelzeile „He“ (Speicher
vorher `5+30`, nachher `30`). Mit der Maus (Desktop-Kontext, ein Klick auf die Titelzeile)
dasselbe. Es kommt keine Rückfrage, keine Quittung, kein „Rückgängig“; die Statuszeile
bleibt bei „✓ gespeichert“. Zusätzlich springt der Fokus ins Feld „Funktion…“, und die
Vorschlagsliste („6 Vorschläge“) legt sich über die Felder darunter.

**Erwartung der Rolle:** Ein Tipp auf die Überschrift oder daneben holt entweder das
Eingabefeld hervor oder tut nichts. Gelöscht wird nur, wenn ich das kleine ✕ an genau
dem Chip antippe.

**Auswirkung im Einsatz:** Wer das Feld anfassen will und es mit Handschuh nicht
genau trifft (das Eingabefeld ist nur 44 px hoch, die Beschriftung drumherum aber
dreimal so hoch), löscht die Funktion der Person („Zugführer“, „Sprechfunker“,
„Sanitätshelfer“). Es fällt nicht auf: der Chip fehlt nur, die Statuszeile meldet
„gespeichert“. Die Funktion fehlt damit in der gespeicherten Person und, wenn niemand
es bemerkt, in der weitergegebenen Meldung (Risiko, Übergabe nicht nachgestellt).
Wiederherstellen geht nur durch Neueintragen aus dem Gedächtnis oder vom Papier.

**Empfehlung:** Die Beschriftung des Funktionsfelds darf kein Entfernen auslösen: Titel
und Eingabefeld sollen zusammengehören, die Chips daneben nicht. Zusätzlich beim
Entfernen eines Chips eine kurze Quittung mit „Rückgängig“ wie beim Abrücken. Dieselbe
Prüfung für „Weitere Qualifikationen“ und „Fahrerlaubnis“.

**Nachprüfung:** Schritt 3, Person mit zwei Funktionen: Tipp auf die Titelzeile, neben den
Chip und unter das Feld ändert nichts (Speicher bleibt `5+30`); Tipp auf das ✕ am Chip
entfernt genau diesen Chip und zeigt „Rückgängig“.

### R12-G2 [P2] Alle Ausgaben der Einsatzansicht erzeugen bei Doppeltipp zwei Dateien, ohne Rückmeldung bis zur Datei

**Priorität:** P2

**Kennzeichnung:** gemessen (Downloads, Tippabstand 150 bis 800 ms, 360 × 640).

**Fundstelle / Aufgabe:** Einsatzansicht, Abschnitt unter der Liste: „Einsatz
weitergeben / sichern“, „Lageblatt (A4 quer)“, „Blanko-Vordruck (Papier-Reserve)“,
„Übersicht als CSV“, „Alle Daten als CSV“, „Excel-Liste (Format „Oldenburg“)“.

**Beobachtung:** Ein zweiter Tipp erzeugt jedes Mal eine zweite, gleichnamige Datei, bei
„Einsatz weitergeben / sichern“ (Sammel-PDF mit 6 Bögen) noch nach 500 ms. Gemessen:

| Knopf | Tipps | Dateien | erste Datei nach |
| --- | --- | --- | --- |
| Einsatz weitergeben / sichern | 2 (150, 600 ms) | 2, 2 | rund 1,5 bis 2,6 s |
| Lageblatt (A4 quer) | 2 (150, 800 ms) | 2, 2 | rund 0,15 bis 0,2 s |
| Übersicht als CSV / Alle Daten als CSV | 2 (200 ms) | 2, 2 | sofort |
| Excel-Liste | 2 (200 ms) | 2 | sofort |

Beim Sammel-PDF zeigt der Knopf bis zur fertigen Datei keinerlei Zustand (nicht
`disabled`, kein `aria-busy`, Beschriftung unverändert, gemessen nach 150, 400 und
900 ms); die Meldung „✓ Einsatz … als PDF erzeugt“ erscheint erst mit der Datei. Im
Gegensatz dazu hat „PDF erzeugen“ im Dialog „Bogen übergeben…“ (Schritt 6) eine Sperre:
zwei Tipps im Abstand von 250 ms ergeben genau eine Datei.

**Erwartung der Rolle:** Nach dem Tipp sehe ich sofort, dass etwas läuft („PDF wird
erzeugt…“), und ein zweiter Tipp tut nichts. So verhält sich die Weiterschalten-Taste
im Assistenten bereits.

**Auswirkung im Einsatz:** Mit Handschuh und einer Pause von 2 s ohne Rückmeldung tippt
man ein zweites Mal. Im Download-Ordner liegen dann zwei Sammel-PDFs derselben Sammlung
(„…(1).pdf“), beide mit fremden Personendaten. Beim Weitergeben an den Stab ist unklar,
welche die richtige ist, und die doppelte Datei muss später gelöscht werden. Kein
Datenverlust.

**Empfehlung:** Dieselbe Tipp-Sperre wie bei „PDF erzeugen“ im Übergabe-Dialog für alle
sechs Knöpfe, und beim Sammel-PDF sofort eine sichtbare Zwischenmeldung („wird erzeugt…“)
mit gesperrtem Knopf.

**Nachprüfung:** Je Knopf zwei Tipps im Abstand von 150 ms und 800 ms, danach genau eine
Datei; beim Sammel-PDF zeigt der Knopf ab dem ersten Tipp „wird erzeugt…“.

### R12-G3 [P3] Nach „Abrücken“ wandern die Knöpfe der Karte (Block 11 px nach rechts, 26 px nach unten, „Mehr…“ um 105 px)

**Priorität:** P3

**Kennzeichnung:** gemessen (Rechtecke vor und nach dem Tipp, 360 × 640).

**Fundstelle / Aufgabe:** Einsatzansicht, aufgeklappte Karte, „Abrücken“.

**Beobachtung:** Vor dem Tipp: „Zuklappen“ bei x 33, y 1707; „Mehr…“ bei x 33, y 1875. Nach dem
Tipp trägt die Karte einen Rand links, der ganze Block liegt bei x 44 und y 1733 (alle
Knöpfe 11 px nach rechts, 26 px nach unten); „Abrücken“ wird zu „✓ Abgerückt“ (94 → 116 px
breit), eine neue Taste „Historie“ steht an der alten Stelle von „Mehr…“, und „Mehr…“
wandert nach x 138 (105 px weiter rechts, 26 px tiefer).

**Erwartung der Rolle:** Beim Abrücken ändert sich der Knopf, die übrigen bleiben, wo sie
waren.

**Auswirkung im Einsatz:** Wer nach dem Abrücken gleich „Mehr…“ (zum Entfernen oder
Aufteilen) oder „Zug zuordnen“ antippt, trifft nach der Verschiebung die Nachbarn
(„Historie“, „Details“). Die Folge ist harmlos (öffnet nur eine Ansicht), kostet aber
einen Zug und verunsichert, weil die Quittung zugleich unten aufspringt.

**Empfehlung:** Die Knopfreihen der Karte vor und nach dem Abrücken an derselben Stelle
halten, den Rand der abgerückten Karte ohne Verschiebung darstellen, „Historie“ hinter
„Mehr…“ setzen.

**Nachprüfung:** Positionen der Knöpfe vor und nach „Abrücken“ per
`getBoundingClientRect` gleich (bis auf den Statusknopf selbst).

## Nachprüfung der Behebungen aus Runde 11

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R11-G1 Eingabetaste in Schritt 1 und 4 | hält | „Ort der Einheit“, „Dienststellen-Kürzel“, „Einheitstyp“ und „Fahrzeugtyp“ tragen `enterkeyhint="next"`; die Eingabetaste springt in Schritt 1 und 4 von Feld zu Feld bis zum Ende (tatsächlich nachgedrückt). Ausnahme „Eingetroffen um“ (nativer Zeitwähler, nicht prüfbar). |
| R11-G2 Fokus bei „Aufteilen…“ | hält | Fokus liegt auf der Überschrift „Aufteilen“, nicht im Textfeld |
| R11-G3 Abstände | hält teilweise | Aufklapp-Karten jetzt mit 7 px Lücke; Hinweise-Link stößt nicht mehr an. Offen: „6 ohne Auftrag“ / „6 ohne Zug“ stehen 3 px über „Suchen, sortieren, filtern“; Spaltenköpfe der Tabelle 5 px; Karten/Tabelle 0 px (R6-G6); Links „Zur Einheitenliste ↓“ und „Weitergeben, Lageblatt, Export ↓“ ohne Lücke (je rund 42 px Treffzone). Folgen weiter harmlos. |
| R11-D1/S3 Kenntnisnahme mit Quittung | hält | „Rückgängig“ 121 × 44 px, „✕“ 44 × 44 px, 12 px Abstand; bleibt über 9 s stehen |
| R11-S1 Sperre im QR-Vollbild | hält | „Schließen“ 111 × 44 px |
| Rückfragen gegen Durchtippen | hält | Rückfragen mit „Abbrechen“ auf Abstand, kein Durchtippen bei Doppeltipp (siehe Urteil) |

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Zielgrößen:** Alle Knöpfe, Eingaben und Auswahlfelder 44 px oder höher; Kästchen 24 px in
  44 bis 62 px hohen Beschriftungen; Feld-Ansicht (große Tasten) 51 bis 54 px.
- **Doppeltipp-Sperre im Assistenten:** „Weiter →“, „PDF erzeugen“ im Übergabe-Dialog:
  zwei Tipps ergeben einen Schritt bzw. eine Datei.
- **Niedrige Tastatur (330, 300, 280 px Fensterhöhe):** Fußleiste bleibt im Bild, jedes
  Eingabefeld der Schritte 1, 3, 4 und 5 liegt nach dem Antippen frei sichtbar; Dialoge
  rollen und behalten „Schließen“ und die Hauptknöpfe erreichbar (auch 180 × 320).
- **Rückfragen:** „Stärke fehlt“ bei „In Einsatz übernehmen“ (rote Wahl nicht dort, wo der
  Auslöser stand), „Meldung entfernen?“, „Verwerfen“, „In den Papierkorb“, „Alle lokalen
  Daten löschen“ mit „Abbrechen“ auf Abstand.
- **Abrücken:** Quittung mit Uhrzeit, „Rückgängig“ und „✕“ auf festem Platz über der
  Ansichtsleiste, im Querformat 65 px hoch.
- **Querformat:** Fußleiste mit „Zurück“, „Ansicht“, „In Einsatz übernehmen“, „Weiter“;
  frei bleiben 304 px Höhe bei 360 px Fensterhöhe.
- **Keine Pflichtgesten:** Weder Wischen noch Ziehen noch Langdruck nötig.
