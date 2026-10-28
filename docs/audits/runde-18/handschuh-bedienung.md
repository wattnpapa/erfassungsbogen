# Audit „Handschuh-Bedienung“, Runde 18 (Touch-Ziele, Abstände, Doppeltipp, Neuladen, Zurück-Geste)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand `ae3a8e9`, `main`)

**Zählung:** P0: 0 · P1: 0 · P2: 2 · P3: 3 (R18-G1 bis R18-G5)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`, der Abschnitt „Stand der
Behebung“ in `runde-17/README.md` und `runde-17/handschuh-bedienung.md`. Was im Browser noch zu beobachten ist,
steht hier, auch wenn es früher als „teilweise“ oder „offen“ geführt wurde (Feld „Neu oder alt (Verweis)“).
Behebungen, die im Browser nicht mehr zu beobachten sind, stehen nur in der Nachprüfungstabelle.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen, nichts installiert), `isMobile`,
`hasTouch`, Pixeldichte 2, de-DE. Viewports 360 x 640 und 390 x 844, dazu 320 x 568, 385 x 800 sowie quer 640 x 360,
568 x 320 und 844 x 390. Zustand: frisch angelegte Einsatz-Sammlung „Hochwasser Test“ mit elf THW-Beispielbögen
(`examples/thw`, `uebung` false, `stand` fünf Minuten zurück, über „Bögen einlesen…“), eigener Bogen im Assistenten
(Schritte 1 bis 6, Personen), Schnellerfassung, Scanner, Papierkorb. Tipps über `tap()` und `touchscreen.tap()` an
festen Koordinaten, Zeitabstände zwischen Tipps gestuft (150 bis 1 300 ms). Die Maße stammen aus
`getBoundingClientRect()` aller Knöpfe, Verweise, Felder und Reiter; Lücken sind der kleinste Randabstand zwischen
Nachbarn mit verschiedenem Ziel. Nicht prüfbar: echte Handschuhe, echte Bildschirmtastatur (Tastatur nur über
verkleinerte Fensterhöhe nachgestellt), Kamera-Scan, native Datums- und Zeitwähler, Pull-to-Refresh am echten Gerät,
ein zweites Gerät.

Kennzeichnung: **gemessen** = Zahl oder Ablauf aus dem Browser.

## Urteil

Die Bedienung mit Handschuh trägt. Fast alle Behebungen der Runde 17 halten im echten Browser: Fußleiste im Assistenten
57 px bei jeder Breite, Quittung und Ansichtsleiste stören nicht mehr gemeinsam, die Tabelle am Telefon hat vier Spalten
ohne Sortierköpfe, nach „Abrücken“ bleibt die Stelle unter dem Finger ruhig, Neuladen und Zurück-Geste führen dorthin,
wo man sie erwartet. Es bleiben fünf Punkte: im Papierkorb stoßen „Zurückholen“ und „Endgültig löschen…“ ohne Lücke
aneinander (P2), die vier Aufnahmeknöpfe des Meldekopfs liegen nach einem Einlesen 1 259 px unter dem Seitenanfang (P2),
der Doppeltipp-Schutz hält auch „Abbrechen“ und „Rückgängig“ eine halbe bis eine Sekunde zurück (P3), „Gehört zu dieser
Lage“ ist ein 30 px hoher Textverweis (P3), und einige Reihen verschiedener Ziele haben nur 4 bis 6 px Abstand (P3). Die
Aufgabe (Bogen erfassen, Bögen einlesen, Karte bedienen, Abrücken, Entfernen, Zurückholen) ist ohne fremde Hilfe zu
schaffen.

## Befunde

### R18-G1 [P2] Papierkorb: „Zurückholen“ und „Endgültig löschen…“ berühren sich ohne Lücke

**Kennzeichnung:** gemessen (360 x 640 und 390 x 844, nach „Entfernen“ und Neuladen, „Zuletzt entfernte Meldungen“
aufgeklappt).

**Ort:** Einsatzansicht unter der Einheitenliste, „Zuletzt entfernte Meldungen (n) — 7 Tage zurückholbar“, Zeile der
entfernten Meldung.

**Beobachtung:** „Zurückholen“ (113 x 44, y 355,5 bis 399,5) steht rechts neben dem Fließtext der Zeile; „Endgültig
löschen…“ (161 x 44, rot umrandet, y 399,5 bis 443,5) bricht direkt darunter um. Der Abstand zwischen beiden ist 0 px, bei
390 x 844 ebenso (501,3 gegen 501,3). Der eine Knopf holt Daten zurück, der andere schiebt sie in die Rückfrage zum
endgültigen Löschen; beide hängen am Zeilenende des Fließtexts, ihre Lage hängt von Textlänge und Breite ab.

**Erwartung der Rolle:** Rückholen und endgültiges Löschen sind getrennte Knöpfe mit mindestens 8 px Abstand, besser in
einer eigenen Knopfzeile unter dem Text.

**Auswirkung im Einsatz:** Ein Fehltipp am unteren Rand von „Zurückholen“ öffnet die Rückfrage „Meldung endgültig
löschen?“ (diese fängt ab: „Endgültig löschen“ und „Abbrechen“ liegen 41 px auseinander). Gelöscht wird nichts ohne
zweiten Tipp, aber der Helfer gerät mit Handschuh in einen Dialog, den er nicht wollte, und sieht nur den Zeitablauf
(7 Tage), nicht die Folge für den Zählstand.

**Empfehlung:** Beide Knöpfe in eine Knopfzeile unter den Text, 8 bis 12 px Abstand, „Endgültig löschen…“ räumlich
abgesetzt (wie „Entfernen“ im Mehr-Menü der Karte).

**Nachprüfung:** 360 x 640: Abstand „Zurückholen“ zu „Endgültig löschen…“ mindestens 8 px.

**Neu oder alt (Verweis):** neu (der Papierkorb selbst ist die Behebung von R17, Papierkorb für entfernte Meldungen).

### R18-G2 [P2] Einsatzansicht: die vier Aufnahmeknöpfe liegen nach dem Einlesen 1 259 px unter dem Seitenanfang

**Kennzeichnung:** gemessen (360 x 640: leere Sammlung 663 px, mit elf eingelesenen Bögen 1 259 px; 390 x 844: 628 px
beziehungsweise 1 224 px).

**Ort:** Einsatzansicht, Knöpfe „Bogen scannen…“, „Einheit manuell erfassen…“, „Einheit schnell erfassen…“, „Bögen
einlesen…“.

**Beobachtung:** Vor den Knöpfen stehen Kennzahlen, Quittung des Einlesens, „Zuletzt abgelegt“, der Kasten „Neu seit der
letzten Kenntnisnahme (n)“ mit Zugfeld und drei Verweisen, „Bedarf“ (vier Zeilen) und zwei Sprungverweise. Bei 360 x 640
beginnt „Bogen scannen…“ erst nach mehr als zwei Bildschirmhöhen; selbst in der leeren Sammlung liegt der erste
Aufnahmeknopf mit 663 px unter dem Bildrand (640). Der nächste Bogen am Meldekopf verlangt also jedes Mal einen Bildlauf
von rund 1 200 px; dazwischen liegen Textverweise („Zur Kenntnis genommen“, „Alle 11 einzeln anzeigen“) und ein Eingabefeld
mit „Zuordnen“, die beim Wischen getroffen werden können.

**Erwartung der Rolle:** Die Hauptaufgabe am Meldekopf, den nächsten Bogen aufnehmen, ist ohne Scrollen einhändig mit dem
Daumen erreichbar; Hinweisblöcke stehen danach.

**Auswirkung im Einsatz:** Bei jeder Aufnahme einer Folge von Bögen (typisch am Meldekopf) wird gescrollt, mit Handschuh
auf kleinem Display fehleranfällig; der Daumen kommt unterwegs an Verweisen und dem Zugfeld vorbei.

**Empfehlung:** Aufnahmeknöpfe direkt unter die Kennzahlen; Quittungen, „Neu seit der letzten Kenntnisnahme“ und „Bedarf“
darunter; alternativ eine feste Aufnahmeleiste unten.

**Nachprüfung:** 360 x 640 mit elf Bögen: „Bogen scannen…“ höchstens 400 px vom Seitenanfang.

**Neu oder alt (Verweis):** neu; gleiche Ursache in anderen Berichten dieser Runde (R18-W4 Arbeitsablauf, R18-N5 Neuer
Nutzer); verwandt mit R17-G5 (Fläche oberhalb der Liste).

### R18-G3 [P3] Doppeltipp-Schutz hält auch die sichere Gegenhandlung zurück: „Abbrechen“, „Rückgängig“, schnelles „Weiter“

**Kennzeichnung:** gemessen (360 x 640; Tipps an festen Koordinaten).

**Ort:** Rückfrage „Meldung entfernen?“ (Mehr-Menü der Karte), Quittungsleiste nach „Abrücken“, „Weiter →“ im
Assistenten.

**Beobachtung:** Öffnet ein Tipp die Rückfrage „Meldung entfernen?“, wird „Abbrechen“ nach 300 und nach 700 ms nicht
angenommen; stattdessen erscheint „Einen Moment …“, der Dialog bleibt offen. Nach 1 000 ms schließt „Abbrechen“. Ebenso
nimmt die Quittung nach „Abrücken“ ein „Rückgängig“ nach 300 ms nicht an („Einen Moment …“, Zustand bleibt „Abgerückt“),
nach 700 ms und später schon. „Weiter →“ im Assistenten wechselt bei 600 ms Tippabstand jeden Schritt, bei 400 ms nur
jeden zweiten und bei 150 ms etwa jeden fünften Tipp.

**Erwartung der Rolle:** Der Schutz gilt dem Vorwärts- und dem endgültigen Schritt. Wer eine falsch geöffnete Rückfrage
sofort wieder schließen oder eine falsche Aktion zurücknehmen will, wird nicht gebremst.

**Auswirkung im Einsatz:** Gering. Der Helfer tippt nach einem Fehltipp sofort „Abbrechen“ oder „Rückgängig“, sieht nur
„Einen Moment …“ und tippt ein drittes Mal; er hält das für einen verfehlten Tipp. Die Sperrzeit ist kurz, der Ausweg bleibt
aber für etwa eine halbe bis eine Sekunde gesperrt, genau dann, wenn er gebraucht wird.

**Empfehlung:** Den Schutz nur auf Knöpfe mit Wirkung anwenden („Meldung entfernen“, „Abrücken“, „Weiter“), nicht auf
„Abbrechen“ und „Rückgängig“; im Assistenten die Sperre auf rund 0,3 s kürzen.

**Nachprüfung:** 360 x 640: „Abbrechen“ in der Rückfrage und „Rückgängig“ in der Quittung 300 ms nach dem öffnenden Tipp
werden angenommen.

**Neu oder alt (Verweis):** alt für „Weiter“ (R17-G11, bei 600 ms behoben, bei 400 ms weiter beobachtbar); neu für
„Abbrechen“ und „Rückgängig“ (Doppeltipp-Schutz selbst: R14-G1, R16-D1).

### R18-G4 [P3] Karte: „Gehört zu dieser Lage“ ist ein 30 px hoher Textverweis am Ende eines Warntextes

**Kennzeichnung:** gemessen (360 x 640, Karte Nr. 3 aufgeklappt: 141 x 30 bei x 46, y 2 391; Querformat 640 x 360: bei
allen Karten mit „Anderer Einsatz?“, 141 x 30).

**Ort:** Einheitenkarte, Warnzeile „⚠ Bogen nennt: …“ — passt das zu dieser Lage? …“ mit dem Verweis „Gehört zu dieser Lage“.

**Beobachtung:** Der Verweis ist kein Knopf, sondern ein unterstrichener Text (141 x 30) in der Warnzeile; er bestätigt die
Zugehörigkeit und löscht die Warnung. Er liegt unter einem vierzeiligen Absatz, darüber und darunter Text beziehungsweise die
Hinweisfelder („Ruhezeit“, „Diesel 80 l“). Alle anderen Entscheidungsknöpfe der Karte messen 44 px.

**Erwartung der Rolle:** Eine Bestätigung mit Wirkung ist ein Knopf von mindestens 44 px Höhe.

**Auswirkung im Einsatz:** Gering. Ein verfehlter Tipp trifft Text (nichts passiert) oder die Nachbarzeile; ein getroffener
Tipp nimmt die Warnung zurück, ohne Rückfrage.

**Empfehlung:** Als Knopf (44 px) mit 8 px Abstand zu den Hinweisfeldern führen.

**Nachprüfung:** 360 x 640 und 640 x 360: „Gehört zu dieser Lage“ mindestens 44 px hoch.

**Neu oder alt (Verweis):** neu.

### R18-G5 [P3] Reihen verschiedener Ziele mit nur 4 bis 6 px Abstand

**Kennzeichnung:** gemessen (360 x 640, 390 x 844, 320 x 568).

**Ort:** Schrittleiste 1 bis 6 des Assistenten (4 px, Reiter 50 bis 52 x 44); „Karten | Tabelle“ in der Einheitenliste (6 px);
Fußzeilen-Linklisten der Seiten (Anleitung, Aufbau, Blanko, THW, Feuerwehr, DLRG, DRK, … je 44 px hoch, 4 px; die beiden
Fremdseiten-Verweise `erfassungsbogen.app | …` 4 px).

**Beobachtung:** Die Lücken sind gegenüber Runde 17 (0 px) gewachsen, bleiben aber unter 8 px. Bei 320 x 568 messen
die Reiter nur „1 . Einheit“ 43 x 44.

**Erwartung der Rolle:** Mindestens 8 px zwischen benachbarten Zielen mit verschiedener Wirkung.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp wechselt den Schritt (der Schrittwechsel speichert), die Ansicht oder öffnet
eine Hilfeseite; Daten gehen nicht verloren.

**Empfehlung:** 8 px Abstand oder breitere Reiter; bei den Verweislisten Zeilenabstand von mindestens 8 px.

**Nachprüfung:** Abstand der genannten Reihen mindestens 8 px (Schrittleiste bei 360 px: Reiter schmaler oder Leiste
zweizeilig).

**Neu oder alt (Verweis):** alt, wie R17-G6 und R6-G6 (teilweise behoben: 0 px auf 4 bis 6 px).

## Nachprüfung der Behebungen aus Runde 17 (echter Browser)

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R17-G1 Hinweisverweis über Knopfreihe | hält | Verweis zu „Zuklappen“, „Details“, „Abrücken“ rund 18 bis 50 px Abstand (360 x 640, 640 x 360) |
| R17-G2 „Weiter“ bei 320 px nur Pfeil | hält | „Weiter →“ 93 x 44, „Übernehmen“ 127 x 44 bei 320 x 568 |
| R17-G3 Fußleiste quer | hält | 568 x 320: „◐“ 44 x 47, „In Einsatz übernehmen“ 44 hoch; 640 x 360, 844 x 390: Knöpfe 44 hoch |
| R17-G4 Fußleiste 128 px | hält | 57 px bei 320, 360, 385, 390 px, quer 56 px |
| R17-G5 Quittung und Ansichtsleiste | hält | feste Ansichtsleiste in der Einsatzansicht nicht mehr sichtbar; Quittung 67 px bei 360 x 640 |
| R17-G7 Tabelle am Telefon | hält | vier Spalten (Einheit, Ges., Meldung vor, Bedarf) in 326 px, kein seitliches Wischen, keine Sortierköpfe |
| R17-G8 Fließtext-Verweise 17 px | hält | Verweise der Startseite 44 px hoch, 4 px Abstand |
| R17-G9 „−“ und „+“ der Stärkefelder | hält | 52 x 52, keine Lücke unter 8 px gemeldet (360 x 640, 320 x 568) |
| R17-G10 Filterverweise über „Suchen, sortieren, filtern“ | hält | keine Lücke unter 8 px |
| R17-G12 Scanner quer | hält | 640 x 360, 568 x 320: Leiste einzeilig, „Hinweise zum Handscanner“ nicht verdeckt |
| R17-G13 elf gleiche Fehlermeldungen | hält | ein Block (228 px) mit „Betroffen: 6 Dateien, …“ |
| R17-G14 Bildlauf nach „Abrücken“ | hält | Knopf y 222 vorher, 221 nachher (die Karte wandert in der Liste, der Bildlauf folgt) |
| Doppeltipp „Zur Kenntnis genommen“ / „In Einsatz übernehmen“ | hält | zweiter Tipp nach 250 ms legt genau eine Einheit an (12 statt 13) |
| Neuladen | hält | aufgeklappte Karte bleibt offen; Entwurf im Assistenten: Startseite mit „Fortsetzen“ / „Verwerfen“ (141 x 44, Rückfrage vor dem Verwerfen) |
| Zurück-Geste | hält | Dialog schließt, Assistent geht Schritt für Schritt zurück, Einsatzansicht führt zur Startseite |
| Layoutsprung der Startseite (R17-H1) | hält | Verschiebung 0,0008 beim Erstbesuch (360 und 390 px) |
| Papierkorb für entfernte Meldungen | hält, Abstand siehe R18-G1 | Meldung nach Neuladen unter „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“ |
| Rückfragen (Person entfernen, „Nur Stärke melden“, „Verwerfen“, „Endgültig löschen“) | hält | Knöpfe 44 px, Abstand 41 px und mehr |
| Tastatur (Fensterhöhe 340) | hält | Fußleiste verschwindet, fokussiertes Feld bleibt im Bild |
| Seitliches Überlaufen | hält | 320, 360, 390 px: Seitenbreite = Fensterbreite |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer eine falsche Rückfrage sofort mit „Abbrechen“ schließen will, liest das „Einen Moment …“ als Fehltipp (R18-G3).
- **Größtes Einsatzrisiko:** Gering: Im Papierkorb steht „Endgültig löschen…“ ohne Abstand unter „Zurückholen“ (R18-G1), abgefangen durch die Rückfrage.
- **Top-Priorität für die nächste Iteration:** Aufnahmeknöpfe vor die Hinweisblöcke (R18-G2) und Papierkorb-Knöpfe trennen (R18-G1).
