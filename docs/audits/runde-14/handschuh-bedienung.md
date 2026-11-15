# Audit „Handschuh-Bedienung“, Runde 14 (Touch-Ziele, Abstände, Doppeltipp, Sammelaktionen, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand
`429c41a`, `main` nach Runde 13)

**Zählung:** P0: 0 · P1: 0 · P2: 2 (R14-G1, R14-G2) · P3: 1 (R14-G3)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`,
`runde-13/README.md`, `runde-12/README.md`, `runde-11/README.md`. Nicht neu gemeldet sind
die dort genannten Grenzen und Reste (u. a. R6-G6 Schrittleiste und Karten/Tabelle ohne
Lücke, „n ohne Auftrag/Zug“ dicht über „Suchen, sortieren, filtern“, „Zur Einheitenliste ↓“ /
„Weitergeben …“ ohne Lücke, R12-G3, R13-W1, R13-W6, R13-H1).

## Prüfaufbau

Chromium über das globale `playwright`-Modul, `isMobile`, `hasTouch`, Pixeldichte 2, de-DE.
Viewports 390 × 844, 360 × 640, 640 × 360. Zustand: neue Einsatz-Sammlung „Hochwasser Test“
mit elf Übungsbögen THW (`examples/thw`, `uebung` false, `stand` auf „vor zwei Stunden“
gesetzt, damit die Datenschutzfrist nicht anonymisiert), importiert über „Bögen einlesen…“.
Gemessen sind Rechtecke (`getBoundingClientRect`), Tipps über `tap()`, Downloads über das
Playwright-Ereignis `download`. Nicht prüfbar: echte Handschuhe, echte Bildschirmtastatur,
Kamera-Scan, native Zeitwähler.

Kennzeichnung: **gemessen** = Zahl aus dem Browser, **Risiko** = plausibel, nicht nachgestellt.

## Urteil

Die Bedienung mit Handschuh trägt weiter: Knöpfe der Einsatzkarten, der Quittung
(„Rückgängig“ 121 × 44, „✕“ 44 × 44, 12 px Abstand), des Assistenten (Schrittfuß 44 px,
Personenzeile, „Person entfernen“ mit Rückfrage) und die Radio- und Kästchenzeilen
(44 px Zeilenhöhe, 9 bis 13 px Abstand) sind groß genug und getrennt. Neu belegt sind zwei
P2-Punkte: das Sammel-PDF entsteht bei Doppeltipp weiter doppelt, und „Zug für alle“ schreibt
ohne Rückfrage, Quittung und Rückgängig in alle Einheiten.

## Befunde

### R14-G1 [P2] „Einsatz weitergeben / sichern“ erzeugt bei Doppeltipp weiter zwei Sammel-PDFs, ohne Zustandsanzeige (R13-G1 hält nicht)

**Kennzeichnung:** gemessen (je ein Lauf mit 150 ms, 1,5 s und 2,5 s zwischen den Tipps,
390 × 844, elf Bögen).

**Ort:** Einsatzansicht, Abschnitt unter der Liste, Knopf „Einsatz weitergeben / sichern“.

**Beobachtung:** Der zweite Tipp nach 150 ms, 1,5 s und 2,5 s ergibt jedes Mal zwei Dateien
(erste nach rund 4 bis 6 s, zweite 2,7 bis 4 s später; beim Abstand von 2,5 s mit
unterschiedlichem Dateinamen, Minute 33 und 34). Der Knopf zeigt zum Zeitpunkt des zweiten
Tipps unverändert „Einsatz weitergeben / sichern“, ist nicht `disabled` und trägt kein
`aria-busy`. Die Erzeugung dauert hier 4 bis 6 s ohne jede Anzeige.

**Folge:** Wer nach dem Tipp mehrere Sekunden nichts sieht, tippt mit Handschuh ein zweites
Mal. Im Download-Ordner liegen zwei Sammel-PDFs mit fremden Personendaten, beim Weitergeben
ist unklar, welche gilt. Kein Datenverlust.

**Empfehlung:** Knopf ab dem ersten Tipp sperren und „wird erzeugt…“ anzeigen, bis die Datei
da ist (wie bei „Bogen als PDF“); die Sperre muss die gesamte Erzeugungsdauer abdecken, nicht
nur eine feste Zeitspanne.

**Nachprüfung:** Zwei Tipps im Abstand von 150 ms, 1,5 s und 2,5 s ergeben eine Datei; der
Knopf zeigt ab dem ersten Tipp einen Zustand.

### R14-G2 [P2] „Zuordnen“ bei „Zug für 11 Einheiten ohne Zug“ schreibt ohne Rückfrage, Quittung und Rückgängig

**Kennzeichnung:** gemessen (390 × 844; Ablauf mehrfach wiederholt).

**Ort:** Einsatzansicht, Zeile „Zug für 11 Einheiten ohne Zug:“ mit Feld (231 × 44) und Knopf
„Zuordnen“ (93 × 44, 8 px Abstand zum Feld).

**Beobachtung:** Nach „3. Zug“ (oder „9. Zug“) und einem Tipp auf „Zuordnen“ tragen sofort alle
elf Karten diesen Zug. Es erscheint keine Rückfrage, keine Quittung, kein „Rückgängig“ (0
Rückgängig-Knöpfe, keine Statuszeile mit „zugeordnet“). Die ganze Zeile verschwindet, die
Inhalte darunter rutschen nach oben; das Feld ist danach nicht mehr da. Im Gegensatz dazu
bekommen „Abrücken“ und „Zur Kenntnis genommen“ eine Quittung mit „Rückgängig“.

**Folge:** Ein Zahlendreher auf der Bildschirmtastatur (Handschuh) landet in elf Meldungen
gleichzeitig. Korrigiert werden kann nur je Karte über „Zug zuordnen“ (mindestens
aufklappen, tippen, tippen, speichern, elfmal). Der Bedienende sieht nicht, dass seine Eingabe
verarbeitet wurde, sondern nur, dass die Zeile weg ist.

**Empfehlung:** Dieselbe Quittung mit „Rückgängig“ wie beim Abrücken („Zug „3. Zug“ für 11
Einheiten“), die Zeile erst danach ausblenden oder an Ort und Stelle durch die Quittung
ersetzen.

**Nachprüfung:** Nach „Zuordnen“ erscheint eine Quittung mit Zahl der Einheiten und
„Rückgängig“; Tipp auf „Rückgängig“ stellt „11 Einheiten ohne Zug“ und das Feld wieder her.

### R14-G3 [P3] Ansicht-Umschalter in der Fußzeile: vier Kacheln ohne Lücke

**Kennzeichnung:** gemessen (390 × 844 und 360 × 640, Startseite und Einsatzansicht).

**Ort:** Fußzeile, Gruppe „ANSICHT“ („Standard“ 97 × 44, „Feld“ 69 × 44, „Dunkel“ 86 × 44,
„Nacht“ 80 × 44) als 2 × 2-Raster.

**Beobachtung:** Die Kacheln grenzen mit 0 px aneinander (horizontal und vertikal); die gewählte
Stufe erkennt man nur an der dunklen Fläche. „Standard“ und „Feld“ sind unterschiedlich breit,
die Tippflächen von „Dunkel“ und „Nacht“ stoßen aneinander.

**Folge:** Gering: Ein ungenauer Tipp wechselt die Anzeige in „Nacht“ oder „Dunkel“ (bei Sonne
ein dunkler Bildschirm). Umkehrbar, kostet aber einen Zug. Der Umschalter im Kopf („Ansicht:
Standard ▾“) ist als Auswahlliste dagegen robust.

**Empfehlung:** 6 bis 8 px Abstand zwischen den Kacheln oder die Auswahlliste auch in der
Fußzeile.

**Nachprüfung:** Abstand zwischen allen vier Kacheln ≥ 6 px bei 360 und 390 px.

## Nachprüfung der Behebungen aus Runde 13

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R13-G1 Sammel-PDF bei Doppeltipp | hält nicht | siehe R14-G1: zwei Dateien bei 150 ms, 1,5 s, 2,5 s |
| R13-G2 „Zug zuordnen“ | hält | 360 × 640: Feld 208 × 44, „Speichern“ 97 × 44 mit 8 px Abstand, „Abbrechen“ 8 px darunter; Seite rollt zum Feld, Fokus im Feld (auch bei offenen „Details“) |
| R13-G3 Anruf/E-Mail in „Details“ | hält | 390 × 844: `tel:` 88 × 44 und `mailto:` 44 hoch, Abstand 8 bis 11 px, zur nächsten Stelle 11 bis 76 px |
| Personenzeile entfernen | hält | „Person entfernen“ 136 × 44 mit Rückfrage („Max entfernen?“) und Hinweis auf die Ansprechperson |
| Abrücken mit Quittung | hält | Quittung 336 × 91 unten, „Rückgängig“ 121 × 44, „✕“ 44 × 44, 12 px Abstand; „✓ Abgerückt“ an der Stelle des Knopfes, „Historie“ daneben |
| Querformat 640 × 360 | hält | Karten zeigen die Aktionen mit 12 px Abstand, Filterauswahlen 240 × 44 |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Der Knopf „Einsatz weitergeben / sichern“ zeigt nach dem Tipp mehrere Sekunden nichts an, das wirkt wie „nichts passiert“.
- **Größtes Einsatzrisiko:** Ein Zahlendreher bei „Zug für alle“ landet ohne Rückgängig in allen Einheiten.
- **Top-Priorität für die nächste Iteration:** Quittung mit „Rückgängig“ für „Zuordnen“ (R14-G2) und echte Sperre samt Zwischenanzeige am Sammel-PDF (R14-G1).
