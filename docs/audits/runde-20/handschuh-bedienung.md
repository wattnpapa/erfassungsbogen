# Audit „Handschuh-Bedienung“, Runde 20 (Touch-Ziele, Abstände, Tipp-Sperre, Quittung, Speicher voll, Schnellerfassung, Tabelle, Scanner)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand `7c06324`, `main`)

**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 8 (R20-G1 bis R20-G8) · Hinweise ohne Priorität: 9 (H1 bis H9)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`, der Abschnitt „Stand der
Behebung“ in `runde-19/README.md` und `runde-19/handschuh-bedienung.md`. Was im Browser noch zu beobachten ist, steht hier,
auch wenn es früher als „offen“ oder „teilweise“ geführt wurde (Feld „Neu oder alt (Verweis)“). Behebungen, die im Browser
nicht mehr zu beobachten sind, stehen nur in der Nachprüfungstabelle. Je Sachverhalt ein Befund, mit Typ (Daten/Verlust,
Bedienung, Layout/Abstand, Text, Kontrast).

## Urteil aus Sicht der Rolle

Die Aufgaben am Meldekopf sind mit Handschuh ohne fremde Hilfe zu schaffen: Einsatz anlegen, Einheit schnell erfassen (Ort
steht jetzt zuerst, „In Einsatz übernehmen“ ist auf jedem Schritt vollständig lesbar), Karte öffnen, abrücken, entfernen,
zurückholen, beenden, Übergabe vermerken. Die Speicher-Behebungen aus Runde 19 halten: bei vollem Gerätespeicher
quittiert die App nichts Falsches mehr, sondern sagt es in einer Rückfrage. Die Quittungsleiste ist eine Kurzfassung
(57 bis 60 px, 7 bis 10 % des Bildes). Reibung bleibt bei kleinen oder überdeckten Textverweisen in der aufgeklappten Karte,
bei Verweisen, die etwas anderes tun, als ihre Beschriftung sagt, bei der weit unten liegenden Einheitenliste, beim
Ansichtsschalter für „Feld“ und im Querformat.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen, nichts installiert), `isMobile`, `hasTouch`,
Pixeldichte 2, de-DE. Viewports 360 x 640 und 390 x 844, dazu 320 x 568 sowie quer 640 x 360 und 568 x 320. Zustand: frisch
angelegte Einsatz-Sammlung „Hochwasser Test“ mit 0, 3 oder 6 THW-Beispielbögen (`examples/thw`, über „Bögen einlesen…“),
Schnellerfassung bis „In Einsatz übernehmen“, eigener Bogen im Assistenten (Schritt 1 bis 6, auch „‹ Startseite“ und „Bogen
schließen“), Scanner ohne Kamera, Papierkorb, Anzeigemodus „Feld“ (über den Speicherschlüssel `eeb.anzeigemodus.v1`).
Tipps als Touch-Tipps (`touchscreen.tap()`), Zeitabstände gestuft (300, 1 000, 1 600, 2 500 ms). Maße aus
`getBoundingClientRect()` aller Knöpfe, Verweise und Felder (Größe, Randabstand benachbarter Ziele, Textüberlauf,
Treffer-Test mit `elementFromPoint`). Voller Speicher: `localStorage` im Browser bis zum Quota-Fehler gefüllt (rund
5,2 Mio. Zeichen), dann die Aktion ausgeführt. Nicht prüfbar: echte Handschuhe, echte Bildschirmtastatur (nachgestellt über
Fensterhöhe 340), Kamera-Scan.

## Nachprüfung der Behebungen aus Runde 19

| Behebung | Ergebnis im Browser |
| --- | --- |
| Voller Speicher bei „Meldung entfernen“ (R19-O1) | hält: Rückfrage „Papierkorb voll … Endgültig entfernen?“; Meldung bleibt in der Liste und nach dem Neuladen stehen |
| Voller Speicher bei „Einsatz löschen“ (R19-O3) | hält: „Nicht gelöscht“ mit „Endgültig löschen“ / „Abbrechen“; Einsatz bleibt nach Neuladen |
| Voller Speicher bei „Einsatz als beendet markieren“ und „Übergabe vermerken“ (R19-O2, O4) | hält: „Einsatz nicht beendet“ / „Übergabe nicht vermerkt“, „Nichts hat sich geändert“; kein Vermerk in der Seite |
| Fußleiste ohne Textüberlauf (R19-G1) | hält: „In Einsatz übernehmen“ 167 x 44 bei 360 px, 127 x 44 bei 320 px, 159 x 44 bei 390 px, Text vollständig im Knopf |
| Quittungsleiste als Kurzfassung (R19-G4) | hält: „Entfernt“, „Abgerückt“, „Zur Kenntnis genommen“, „Einsatz beendet“ 57 bis 60 px (9 bis 10 %); nach „Details“ 83 px (13 %); „Rückgängig“ 100 x 44, „✕“ 44 x 44 |
| Tipp-Sperre mit „Einen Moment …“ | hält: zweiter Tipp nach 300 ms zeigt „Einen Moment …“ auf dem Knopf (gestrichelter Rahmen); nach 1 000 ms wird er angenommen |
| Schnellerfassung mit Ortsfeld zuerst (R19-G11) | hält: „Ort der Einheit (Pflicht)“ bei y 183 (360 x 640), Fokus-Rahmen sichtbar; Kopf und Fußleiste lassen Raum |
| Tabelle am Telefon (R19-G10) | hält: 354 px breit, kein seitliches Wischen, Namen umbrochen ohne „…“, Spalte „Auftrag“ ausgeblendet |
| Startseite (Sammlung unter dem Falz) | hält: „Neue Einsatz-Sammlung…“ bei y 362 (360 x 640), Abstände der Knopfreihen 7 bis 8 px, Fußzeilenlinks 8 px |
| Kartenknöpfe ohne Textüberlauf (R19-G2) | hält: „Als Einsatzmeldung zählen…“, „Verschieben…“, „Auftrag/Notiz“ liegen in ihren Knöpfen (320, 360, 390 px, auch „Feld“) |
| „Karten | Tabelle“ und Fußzeilen mit 8 px Abstand (R19-G3) | hält |
| „Wieder öffnen“ als Knopf, „beendet“ mit Quittung und „Rückgängig“ (R19-G7) | hält: 119 x 44, Quittung „Einsatz beendet.“ |
| „Jetzt“ / „Lagemonitor öffnen“ ohne Abstand zur Karte (R19-G8) | nicht mehr zu beobachten: Lagemonitor ist eingeklappt |
| Scanner ohne Kamera, Hochformat (R19-G9) | hält bei 360 x 640 und 568 x 320 Standard: Anleitung vollständig, Knöpfe fest unten; Rest siehe R20-G5 |

## Befunde

### R20-G1 [P3] Textverweise in der aufgeklappten Karte: „ganz zeigen“ liegt unter „Hinweise: …“, „Warum?“ ist 15 px hoch

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 x 640 und 320 x 568, Standard und „Feld“).

**Ort:** aufgeklappte Karte, Zeile mit der Bemerkung der Einheit („… (Reserve aktivie … ganz zeigen“) und der Zeile darunter
„Hinweise: Zeitraum vorbei“; in Karte Nr. 3 der Warnsatz „… passt das zu dieser Lage? Zählt trotzdem mit. Warum?“.

**Beobachtung:** „ganz zeigen“ ist 76 x 26 px, der Verweis „Hinweise: Zeitraum vorbei“ (168 x 43) beginnt 7 px über ihm und
überdeckt seine Mitte. Treffer-Test am Mittelpunkt von „ganz zeigen“: nur ein 5-px-Streifen am oberen Rand gehört wirklich dazu. Ein
Touch-Tipp auf die Mitte von „ganz zeigen“ öffnete stattdessen den Text des Hinweises („Einsatzzeitraum … ist vorbei“);
die Bemerkung blieb gekürzt. „Hinweise: …“ ragt außerdem 4 px in die Oberkante von „Abrücken“ und „Zug zuordnen“. „Warum?“
(Karte Nr. 3) ist 54 x 15 px und liegt 5 px über dem Knopf „Gehört zu dieser Lage“ (171 x 44).

**Erwartung der Rolle:** Jedes Ziel reagiert dort, wo sein Text steht; Textverweise sind so hoch wie die Knöpfe daneben.

**Auswirkung im Einsatz:** Der Helfer will die ganze Bemerkung lesen und bekommt einen anderen Text; er tippt ein zweites Mal
oder gibt auf. Ein Tipp an der Oberkante von „Abrücken“ kann den Hinweis öffnen statt abzurücken (kein Datenverlust).

**Empfehlung:** Verweise in der Karte mit mindestens 44 px Trefferhöhe und ohne Überlappung; „ganz zeigen“ hinter die
gekürzte Bemerkung in eine eigene Zeile mit Abstand; „Warum?“ als Knopf.

**Nachprüfung:** 360 x 640, Karte Nr. 2 und Nr. 3: Tipp auf die Mitte von „ganz zeigen“ zeigt die ganze Bemerkung; „Warum?“ mindestens 44 px hoch.

**Neu oder alt (Verweis):** neu (verwandt R19-M11, R18-G4 „Gehört zu dieser Lage“ als 30-px-Textverweis, damals behoben).

### R20-G2 [P3] „⚠ Anderer Einsatz? Prüfen ▸“ auf der eingeklappten Karte klappt nur die Karte auf

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 x 640: Chip 210 x 44; Playwright: „karte-aufklappen intercepts pointer events“).

**Ort:** eingeklappte Karten Nr. 1 und Nr. 4 bis Nr. 6 mit Hinweis „Anderer Einsatz?“.

**Beobachtung:** Der Chip sieht wie ein Knopf mit Pfeil aus; ein Tipp wird vom Aufklapp-Knopf der Karte aufgefangen. Die Entscheidung
(„Gehört zu dieser Lage“) liegt danach rund 400 px tiefer in der Karte.

**Erwartung der Rolle:** „Prüfen“ führt zur Frage.

**Auswirkung im Einsatz:** Wer die Frage beantworten will, sucht den Warnsatz in der geöffneten Karte.

**Empfehlung:** Nach dem Aufklappen zum Warnsatz springen oder den Chip als Marke ohne Pfeil darstellen.

**Nachprüfung:** Tipp auf den Chip bringt „Gehört zu dieser Lage“ in den ersten Bildschirm.

**Neu oder alt (Verweis):** alt, R19-M11.

### R20-G3 [P3] „Zur Kenntnis genommen“ lässt die Liste springen; ein zweiter Tipp an derselben Stelle öffnet die Dateiauswahl

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 x 640: Kasten „Neu seit der letzten Kenntnisnahme (3)“ geöffnet; vor dem
Tipp Bildlauf 997 px, Seitenhöhe 5 350 px; danach Bildlauf 390 px, Seitenhöhe 4 761 px).

**Ort:** Einsatzansicht, Kasten „Neu seit der letzten Kenntnisnahme“, Verweis „Zur Kenntnis genommen“.

**Beobachtung:** Der Tipp klappt den Kasten weg, der Bildlauf springt um rund 600 px. Unter dem Finger liegt danach „Bögen
einlesen…“. Ein zweiter Tipp nach 300 ms wird verworfen („Einen Moment …“ auf dem Knopf, gut), ab 1 000 ms öffnet er die
Dateiauswahl des Systems. Die Quittung „Zur Kenntnis genommen: 3 Einheiten“ mit „Rückgängig“ erscheint (60 px).

**Erwartung der Rolle:** Nach einer Sammelaktion bleibt unter dem Finger dasselbe oder nichts Wirksames.

**Auswirkung im Einsatz:** Gering: Wer nach einer Sekunde noch einmal tippt, weil er der Quittung nicht traut, öffnet die
Dateiauswahl.

**Empfehlung:** Den Bildlauf so halten, dass dort, wo der Finger war, nichts Wirksames liegt; oder die Quittung am Finger zeigen.

**Nachprüfung:** Tipp auf „Zur Kenntnis genommen“, zweiter Tipp nach 1,5 s an derselben Stelle: keine Dateiauswahl.

**Neu oder alt (Verweis):** alt, R19-G5 (teilweise verbessert: die Quittung ist kurz, der Sprung bleibt).

### R20-G4 [P3] Ansichtsschalter (Standard / Feld / Dunkel / Nacht) liegt in der Einsatzansicht am Seitenende; die feste Leiste deckt 57 px

**Typ:** Bedienung · **Kennzeichnung:** gemessen (360 x 640: Schalterblock bei y rund 5 400 von 5 550 mit sechs Bögen, rund 7 460
Seitenhöhe im Modus „Feld“; schmale Leiste „◐ Ansicht: Standard“ erscheint nach dem Aufwärtsrollen und nach dem Öffnen von
Karten, 57 px = 9 % am unteren Rand, im Modus „Feld“ 48 px Knopf).

**Ort:** Einsatzansicht (im Assistenten und auf der Startseite steht „Ansicht: Standard ▾“ im Kopf).

**Beobachtung:** Wer in der Einsatzansicht auf „Feld“ (große Tasten) oder „Nacht“ umschalten will, findet den Schalter ganz
unten (rund neun Bildschirmhöhen). Am Seitenende stehen der Schalterblock „ANSICHT“ und die Leiste „Ansicht: Standard“ doppelt
übereinander. Die Leiste liegt sonst über den untersten 57 px der Karten.

**Erwartung der Rolle:** Der Schalter für große Tasten ist dort, wo die Bedienung beginnt (Kopf wie im Assistenten).

**Auswirkung im Einsatz:** Gering: Die Hilfe für Handschuhbedienung wird gerade dort nicht gefunden, wo sie gebraucht wird.

**Empfehlung:** „Ansicht“ in die Kopfzeile der Einsatzansicht; die Leiste nicht dauerhaft über den Karten.

**Nachprüfung:** 360 x 640 Einsatzansicht: Ansichtsschalter ohne Bildlauf erreichbar.

**Neu oder alt (Verweis):** alt, R19-G6 und R19-K12 (Ruhehöhe der Leiste von 57 px bleibt).

### R20-G5 [P3] Scanner ohne Kamera, quer 568 x 320 im Modus „Feld“: Anleitungsrahmen unten abgeschnitten, rollt innen

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen (568 x 320 „Feld“: `scanner-mitte` scrollHeight 308 gegen clientHeight 238; im Bild
endet der gestrichelte Rahmen mitten in „Am Handscanner auslösen …“; „Hinweise zum Handscanner“ nicht sichtbar).

**Ort:** Scanner („Dieses Gerät meldet keine nutzbare Kamera.“), Querformat, Modus „Feld“.

**Beobachtung:** In 568 x 320 Standard und 360 x 640 (Standard und „Feld“) liegt der Rahmen vollständig im Bild. Im Querformat mit
großer Schrift fehlen die Unterkante des Rahmens und der Absatz „Hinweise zum Handscanner“, der Rahmen rollt für sich.
„QR aus Bild einlesen…“ und „Fertig“ stehen fest unten (je 44 hoch).

**Erwartung der Rolle:** Der Weg am Telefon ist vollständig lesbar, der Rahmen nicht angeschnitten.

**Auswirkung im Einsatz:** Gering: Der Hinweis auf den Handscanner ist nur mit einem Bildlauf in einem kleinen Fenster zu lesen.

**Empfehlung:** Im Querformat Kopfzeile des Scanners verdichten (Fehlertext und „Kamera erneut versuchen“ nebeneinander).

**Nachprüfung:** 568 x 320 „Feld“: Rahmen ohne inneren Bildlauf vollständig sichtbar.

**Neu oder alt (Verweis):** alt, R19-G9 (Rest; auch R19-L2, R19-M5, R19-S10).

### R20-G6 [P3] Die Einheitenliste beginnt nach 1,9 Bildschirmen

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen (360 x 640: Überschrift „Einheiten (n gemeldet …)“ bei y 1 247, erste Karte bei y 1 522;
390 x 844: 1 224 und 1 500; „Bogen scannen…“ bei y 434).

**Ort:** Einsatzansicht, zwischen den vier Aufnahmeknöpfen und der Liste.

**Beobachtung:** Die Aufnahmeknöpfe stehen oben (Behebung hält). Dahinter folgen bis zu vier Kästen (Aufnahmequittung,
„Neu seit der letzten Kenntnisnahme“, „n Übungsmeldungen nicht gezählt — anzeigen“, „Bedarf“) und zwei Sprungverweise, bevor die
erste Karte erscheint.

**Erwartung der Rolle:** Die gerade aufgenommene Einheit ist im ersten oder zweiten Bildschirm zu sehen.

**Auswirkung im Einsatz:** Gering: Wer die Aufnahme prüfen will, wischt rund 900 px.

**Empfehlung:** Kästen einklappen oder hinter die Liste; Sprungverweise überflüssig machen.

**Nachprüfung:** 360 x 640 mit sechs Bögen: erste Karte innerhalb von 1,5 Bildschirmen (unter y 960).

**Neu oder alt (Verweis):** alt, R19-K6 (verwandt R18-G2, dort die Aufnahmeknöpfe, behoben).

### R20-G7 [P3] Assistent und Schnellerfassung quer: Kopf, Schrittleiste und Fußleiste lassen 141 von 320 px

**Typ:** Layout/Abstand · **Kennzeichnung:** gemessen (568 x 320: Kopf mit Schrittleiste bis y 123, Fußleiste ab y 264, dazwischen
141 px = 44 %; 640 x 360: 179 px = 50 %; „Ort der Einheit“ y 211 bis 255, vor der Fußleiste sichtbar).

**Ort:** Schnellerfassung und Assistent im Querformat.

**Beobachtung:** Das erste Feld ist erreichbar, mit eingeblendeter Bildschirmtastatur (nachgestellt, Fensterhöhe 340 im Hochformat)
bleibt von der Fußleiste nichts: „Weiter →“ und „In Einsatz übernehmen“ sind verschwunden, bis die Tastatur geschlossen ist.

**Erwartung der Rolle:** Quer bleibt mindestens die Hälfte der Höhe für Eingabefeld und Vorschläge.

**Auswirkung im Einsatz:** Gering: Für jeden Schritt muss die Tastatur geschlossen werden, um weiterzukommen.

**Empfehlung:** Kopf quer auf eine Zeile verdichten, Schrittleiste mitrollen lassen.

**Nachprüfung:** 568 x 320: mindestens 50 % der Höhe für den Inhalt.

**Neu oder alt (Verweis):** alt, R19-M10 (R18-M6).

### R20-G8 [P3] Dateiname des Karten-PDFs trägt das Stand-Datum des Bogens statt des Erzeugungszeitpunkts

**Typ:** Text · **Kennzeichnung:** gemessen (Download „Bogen als PDF“ aus der Karte: `2026-07-17_0805_eeb_THW_Albstadt_Zugtrupp_Technischer_Zug.pdf`; Sammel-PDF
`2026-10-28_0754_eeb-einsatz_Hochwasser_Test.pdf`; Quittung in der Karte nennt den Namen).

**Ort:** Karte, „Bogen als PDF“.

**Beobachtung:** Alle Exporte der Einsatzansicht tragen den Zeitpunkt des Exports, das Karten-PDF den Stand des Bogens vom 17.07.2026.

**Erwartung der Rolle:** Gleiches Schema; der Stand des Bogens darf zusätzlich im Namen stehen.

**Auswirkung im Einsatz:** Gering: Im Download-Ordner sortiert sich die Datei zwischen alte Dateien.

**Empfehlung:** Zeitpunkt des Exports vorn, Stand des Bogens danach.

**Nachprüfung:** Karten-PDF heute erzeugt: Name beginnt mit dem heutigen Datum.

**Neu oder alt (Verweis):** alt, R19-G13.

## Hinweise (ohne Priorität)

Beobachtungen, die den Ablauf nicht beeinträchtigen oder reine Gestaltungsfragen sind.

- **H1 Zählung Schnellerfassung (Text):** Kopf „Schritt 3 von 6: Personal · 2, 5 entfallen“. Kopf und Überschrift tragen jetzt dieselbe Zahl
  (Rest von R19-S3), der Zusatz „2, 5 entfallen“ ist ohne Vorwissen nicht zu deuten.
- **H2 Drei Zuklapp-Beschriftungen in der Karte (Text):** Nach „Mehr…“ stehen „Zuklappen“, „Weniger“ und „Weniger anzeigen“
  untereinander im Raster.
- **H3 Textmenge in der Rückfrage „Nicht gelöscht“ (Text):** neun Zeilen bei 360 px; der Weg („Endgültig löschen“) steht links, „Abbrechen“ rechts, beide 44 bis 58 px hoch.
- **H4 Bedarfskasten (Layout):** „Bedarf: Verpflegung 0“ steht in einem 78 px hohen Kasten mit leerem Raum; bei „Verpflegung angefordert 0 (Stärke 6) · bei 1 Einheit nicht erfasst“ steht das „·“ allein in einer Zeile.
- **H5 Startseite (Layout):** „Einsatz importieren…“ und „Name/Kontakt hinterlegen…“ sind linksbündig, die Knöpfe daneben zentriert.
- **H6 „Verschieben…“ ohne zweiten Einsatz:** der Knopf steht da, die Rückfrage sagt nur „Es gibt keine andere Einsatz-Sammlung auf diesem Gerät.“
- **H7 Sprungverweise (Layout):** „Zur Einheitenliste ↓“ und „Weitergeben, Lageblatt, Export ↓“ 6 px auseinander; „Übergabe, Abschluss ↓“ bricht
  in die zweite Zeile um, die Trefferflächen (je 47 px) überlappen um 19 px; die Wirkung (Bildlauf) ist harmlos.
- **H8 Assistentenkopf (Layout):** „‹ Startseite“ und „Ansicht“ (12 bis 56 px) berühren die Schrittleiste (ab 57 px) mit 1 px Abstand; ein Fehltipp verlässt den
  Bogen, der Entwurf bleibt (Startseite: „Fortsetzen“ / „Bogen schließen“ mit Rückfrage).
- **H9 Quittung der Schnellerfassung (Layout):** Nach „In Einsatz übernehmen“ steht „Zuletzt abgelegt: … jetzt 2 Einheiten, Gesamt 9“ bei y rund 650 und damit unter dem Falz (640);
  die Kennzahlen darüber zählen mit.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Ein Textverweis in der Karte („ganz zeigen“, „Anderer Einsatz? Prüfen ▸“) tut nicht, was sein Wortlaut verspricht.
- **Größtes Einsatzrisiko:** Keines für die Daten; die Speicher-Fälle sind ehrlich quittiert, der Rest kostet nur Zeit und Fehltipps.
- **Top-Priorität für die nächste Iteration:** R20-G1: Verweise in der aufgeklappten Karte auf 44 px Trefferfläche ohne Überlappung bringen.
