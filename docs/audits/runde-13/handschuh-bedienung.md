# Audit „Handschuh-Bedienung“, Runde 13 (Touch-Ziele, Abstände, Doppeltipp, Rückfragen, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand
`7637e61`, `main` nach Runde 12)

**Zählung:** P0: 0 · P1: 0 · P2: 1 (R13-G1) · P3: 2 (R13-G2, R13-G3)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`,
`runde-12/README.md`, `runde-11/README.md`. Nicht neu gemeldet sind die dort genannten
Grenzen und Reste (insbesondere R6-G6, R11-G3-Reste wie Sortierköpfe der Tabelle mit 5 px
Abstand und „Zur Einheitenliste ↓“ / „Weitergeben …“ ohne Lücke, R12-W3, R12-H3, R12-O2,
R12-O4, R12-G3).

## Prüfaufbau

Chromium über das globale `playwright`-Modul (die Projektkopie fand keinen Browser),
`isMobile`, `hasTouch`, Pixeldichte 2, de-DE. Viewports 390 × 844, 360 × 640, 640 × 360.
Zustand: neue Einsatz-Sammlung „Hochwasser Test“ mit sechs Übungsbögen THW (aus
`examples/thw`, `uebung` auf false gesetzt, importiert über „Bögen einlesen…“); eigener
Bogen aus Datei geladen (Gesamtübersicht, Schritt 3). Gemessen sind Rechtecke
(`getBoundingClientRect`), Tipps über `tap()` / `touchscreen.tap()`, Downloads über das
Playwright-Ereignis `download`, Speicherstand aus `localStorage`.

Geprüft: Startseite; Dialoge „Einsatz löschen…“, „Datensicherung“, „Alle Daten löschen“,
„Geräteschlüssel neu erzeugen“ (360 × 640 und 640 × 360); aufgeklappte Karte mit
„Details“, „Auftrag/Notiz“, „Zug zuordnen“, „Mehr…“, „Abrücken“, „Bogen als PDF“; Tabellenansicht;
alle sechs Ausgaben der Einsatzansicht; Schritt 3 mit den Funktionschips; Schrittleiste.
Nicht prüfbar: echte Handschuhe, echte Bildschirmtastatur, Kamera-Scan (der Knopf
„Bogen scannen…“ öffnete ohne Kamera keine Scanner-Ansicht), native Zeitwähler.

Kennzeichnung: **gemessen** = Zahl aus dem Browser, **Risiko** = plausibel, nicht nachgestellt.

## Urteil

Die Bedienung mit Handschuh trägt weiter. Alle geprüften Dialoge haben ihre Knöpfe mit
mindestens 44 px und 8 px oder mehr Abstand; die rote Wahl („In den Papierkorb“,
„Endgültig löschen“) liegt jeweils mit Lücke zu „Abbrechen“. Die Aufgaben Bogen
übernehmen, Einheit abrücken, Notiz eintragen, Ausgaben erzeugen sind ohne fremde Hilfe
zu schaffen. Neu und belegt sind ein P2-Punkt (die Sperre gegen Doppeltipp fehlt noch beim
Sammel-PDF) und zwei P3-Punkte (ein Eingabefeld mit zu engen Knöpfen, eng stehende
Anruf- und E-Mail-Verknüpfungen).

## Befunde

### R13-G1 [P2] „Einsatz weitergeben / sichern“ erzeugt bei Doppeltipp weiter zwei Sammel-PDFs, ohne Zustandsanzeige

**Kennzeichnung:** gemessen (4 Läufe, 360 × 640, sechs Bögen in der Sammlung).

**Ort:** Einsatzansicht, Abschnitt unter der Liste, Knopf „Einsatz weitergeben / sichern“.

**Beobachtung:** Behebung R12-G2 hält für fünf der sechs Ausgaben: „Lageblatt (A4 quer)“,
„Übersicht als CSV“, „Alle Daten als CSV“, „Excel-Liste“ und „Blanko-Vordruck
(Papier-Reserve)“ liefern bei zwei Tipps im Abstand von 150 bis 200 ms genau eine Datei.
Das Sammel-PDF nicht: zweiter Tipp nach 150 ms, 600 ms, 1,5 s und 2,5 s ergibt jedes Mal
zwei Dateien (erste nach rund 1,9 bis 3,5 s, zweite 2,3 bis 3,6 s später; beim Abstand von
2,5 s sogar mit unterschiedlichem Dateinamen, Minute 34 und 35). Der Knopf bleibt dabei
unverändert beschriftet (kein „wird erzeugt…“, nicht `disabled`, kein `aria-busy`),
gemessen in vier Stichproben während der Erzeugung. Zum Vergleich: „Bogen als PDF“ in der
aufgeklappten Karte wechselt sofort auf „Bogen wird erzeugt…“.

**Folge:** Wer nach dem Tipp 2 bis 3 s nichts sieht, tippt mit Handschuh ein zweites Mal.
Im Download-Ordner liegen dann zwei Sammel-PDFs mit fremden Personendaten; beim Weitergeben
ist unklar, welche gilt. Kein Datenverlust.

**Empfehlung:** Dieselbe Sperre und dieselbe Zwischenanzeige („wird erzeugt…“, Knopf
gesperrt, bis die Datei da ist) wie bei „Bogen als PDF“ und bei den anderen fünf Ausgaben.

**Nachprüfung:** Zwei Tipps im Abstand von 150 ms und 2,5 s ergeben eine Datei; der Knopf
zeigt ab dem ersten Tipp einen Zustand.

### R13-G2 [P3] Feld „Zug zuordnen“ sitzt ohne Lücke an „Mehr…“, Speichern und Abbrechen nur 3 px auseinander

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Einsatzansicht, aufgeklappte Karte, „Zug zuordnen“.

**Beobachtung:** Das Eingabefeld (203 × 44 px) öffnet in der Zeile von „Mehr…“ mit 0 px
Abstand zu diesem Knopf; „Speichern“ (97 × 44) und „Abbrechen“ (102 × 44) liegen mit 0 px
unter dem Feld und 3 px nebeneinander. Das Feld „Auftrag/Notiz“ derselben Karte hält dagegen
8 px (Feld zu Knöpfen) und 8 px (Speichern zu Abbrechen).

**Folge:** Ein ungenauer Tipp auf „Speichern“ trifft „Abbrechen“ oder umgekehrt; die
Zugangabe geht verloren oder wird ungewollt gespeichert. Folge klein, die Eingabe ist kurz.

**Empfehlung:** Das Feld „Zug zuordnen“ wie „Auftrag/Notiz“ aufbauen (8 px Abstand).

**Nachprüfung:** Abstand Feld zu Knöpfen und Speichern zu Abbrechen je ≥ 8 px.

### R13-G3 [P3] Anruf- und E-Mail-Verknüpfungen in „Details“ stehen untereinander mit 0 bis 3 px Abstand

**Kennzeichnung:** gemessen (360 × 640); Folge auf dem Telefon Risiko (nicht nachgestellt).

**Ort:** Einsatzansicht, Karte, „Details“, Kontakte der Hierarchie (Ortsverband, Regionalstelle,
Landesverband).

**Beobachtung:** Je Stelle steht ein `tel:`-Link (88 × 44) über dem `mailto:`-Link (141 bis
186 × 44) mit 0 px Abstand, zur nächsten Stelle 3 px (z. B. Telefon 5557923066 bei y 2446,
E-Mail direkt darunter bei y 2490).

**Folge:** Wer die E-Mail-Adresse antippt und den Rand der Telefonnummer trifft (oder
umgekehrt), startet den Anruf bzw. das Mailprogramm. Die Folge ist durch die Wähl-/Mailvorschau
des Telefons meist abfangbar, kostet aber einen Zug.

**Empfehlung:** Zwischen Anruf- und Mail-Verknüpfungen mindestens 8 px.

**Nachprüfung:** Abstände aller `tel:`/`mailto:`-Links in „Details“ ≥ 8 px.

## Nachprüfung der Behebungen aus Runde 12

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R12-G1 Tipp neben Funktionsfeld | hält | Schritt 3: Tipps auf Titelzeile, rechts neben dem Chip und 7 px links daneben entfernen keinen Chip (Chips vorher und nachher gleich); ein Tipp unten auf „+ eigener Text“ fügt wie vorgesehen eine Zeile an |
| R12-G2 Doppeltipp bei Ausgaben | hält teilweise | fünf von sechs Ausgaben eine Datei; Sammel-PDF weiter zwei (R13-G1) |
| R12-G3 Knöpfe nach Abrücken | hält teilweise (bekannte Grenze) | Block jetzt gleich in x, 7 px (vorher 26) nach unten; „Mehr…“ bleibt, „Historie“ steht rechts daneben (82 × 44 an x 132) |
| R12-W1 Kontaktverknüpfungen | hält | `tel:`/`mailto:` mit 44 px Höhe (Abstand siehe R13-G3) |
| Dialoge „Einsatz löschen…“, „Alle Daten löschen“, „Geräteschlüssel“ | hält | Knöpfe ≥ 44 px, Abstand zu „Abbrechen“ ≥ 12 px, Dialog 640 × 360 scrollbar, Bestätigungsknöpfe erreichbar |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Der Knopf „Einsatz weitergeben / sichern“ zeigt nach dem Tipp nichts an und lädt erst nach 2 bis 3 s, das wirkt wie „nichts passiert“.
- **Größtes Einsatzrisiko:** Doppelte Sammel-PDFs mit fremden Personendaten im Download-Ordner.
- **Top-Priorität für die nächste Iteration:** Sperre und Zwischenanzeige am Sammel-PDF wie bei „Bogen als PDF“ (R13-G1).
