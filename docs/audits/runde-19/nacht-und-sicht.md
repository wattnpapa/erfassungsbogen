# Audit „Nacht und Sicht", Runde 19 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-10-28 ·
Zählung: **P0 0 · P1 0 · P2 1 · P3 5**

Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `0ac0d7f`
(`main`, nach Behebung der Runde 18). Reiner Prüfbericht, keine Codeänderung.

Gelesen vor dem Lauf: [docs/audits/README.md](../README.md), „Stand der Behebung" in
[runde-18/README.md](../runde-18/README.md) und [runde-18/nacht-und-sicht.md](../runde-18/nacht-und-sicht.md).
Es gibt keine „bekannten Grenzen": Auch früher als offen oder teilweise geführte Punkte werden gemeldet,
wenn sie im Browser noch zu beobachten sind.

## Prüfaufbau

Chromium über Playwright (`chromium.launch()` ohne Optionen, globales playwright-Modul), Locale de-DE,
`isMobile`/`hasTouch`, Viewports 360 × 640 und 390 × 844, alle vier Ansichten (Standard, Dunkel, Feld, Nacht)
über `eeb.anzeigemodus.v1` (Werte `standard`, `dunkel`, `feld`, `nacht`). Zustand: Sammlung „Hochwasser Nord"
(Art Einsatz), sechs Bögen aus `examples/thw/` über „Bögen einlesen…".

Gemessen wurde je Zustand: Kontrast jedes sichtbaren Textknotens gegen die tatsächliche Fläche darunter,
Schrift unter 12 px, waagerechtes Rollen, Zielgrößen unter 44 px. Zustände: Einsatzansicht, aufgeklappte
Karte, „Mehr…", Tabelle, „Suchen, sortieren, filtern", „Ort eintragen…", Scanner ohne Kamera, „Einheit manuell
erfassen…", „Einheit schnell erfassen…", „Bögen einlesen…", „Einsatz weitergeben / sichern", Lagemonitor-Fenster
mit beiden Anschlägen der Helligkeitsstufe, „Übergabe vermerken…", „Einsatz als beendet markieren", „Einsatz
löschen…", Datensicherung, Beispielbögen, „Alle Daten löschen", Bogen Schritt 1 bis 5, Startseite. Zusätzlich
Abrücken-Quittung, „Entfernen"-Rückfrage mit Tipp-Sperre, Papierkorb nach Neuladen, Dateinamen aller Downloads,
Ränder interaktiver Elemente (Kontrast von Nicht-Text, Schwelle 3 : 1).

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit, Kamerabild im Dunkeln
(keine Kamera), native Auswahlfenster des Betriebssystems, Ausdruck, Rot-Grün-Schwäche am echten Auge.

## Urteil

Text-Kontrast und Codierung halten: In allen vier Ansichten und beiden Viewports liegt in den gemessenen
Zuständen kein sichtbarer Text unter 4,5 : 1 und keine Schrift unter 12 px; die Seite rollt nie waagerecht.
Zustände tragen Wort oder Form („✓ Abgerückt", „○ … noch nicht", „⚠ Stand vor 102 Tagen", „ÜBUNG", „neu").
Die Runde-18-Befunde R18-L1 (Tabellenschrift), R18-L3 (Lagemonitor-Stufenknöpfe, jetzt „Dunkler (am Ende)" mit
über 4,5 : 1) und R18-L4 („Gehört zu dieser Lage" jetzt 44 px hoch) halten. Übrig sind sechs Punkte, einer davon
mit Fehlinterpretationsrisiko am Lagemonitor. Die Aufgabe ist ohne fremde Hilfe machbar.

## Prüfung der Behebungen aus Runde 18

| Befund | Ergebnis |
| --- | --- |
| R18-L1 Tabellenschrift | hält: Kopfzeile und Marke 12 px, Tabelle 326 px breit bei 360 px |
| R18-L3 Lagemonitor-Stufenknöpfe | hält: Deckkraft 1, Anschlag als Text „Dunkler (am Ende)" / „Heller (weiß)", gestrichelter Rand |
| R18-L4 „Gehört zu dieser Lage" | hält: 171 × 44 px |
| R18-L2 Scanner ohne Kamera | hält nicht, siehe R19-L2 |
| Quittungsleiste Abrücken | hält: eine Leiste, „Rückgängig" 100 × 44, „✕" 44 × 44, Kontrast über 4,5 : 1; Rest siehe R19-L6 |
| Nummern bleiben nach „Entfernen" | hält: Rückfrage und Quittung nennen „Nr. 2 bleibt frei", Nr. 3 bis 6 bleiben |
| Papierkorb | hält: „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" nach Neuladen, „Zurückholen" und „Endgültig löschen…" |
| Dateinamen | hält: `2026-10-28_0351_eeb-lageblatt_Hochwasser_Nord.pdf`, `…_eeb-einsatz_Hochwasser_Nord.pdf/.csv`, `…_eeb-einsatz-oldenburg_….xlsx` |
| Hauptaktion oben | hält: „Bogen scannen…" steht als gefüllter Knopf oben |
| Tipp-Sperre | hält (Sperre etwa 0,75 s in der Rückfrage), Darstellung siehe R19-L3 |

## Befunde

### R19-L1 (P2) Lagemonitor meldet „Noch nichts gemeldet" und nennt im selben Bild sechs Eingänge

- **Ort:** Einsatzansicht → „Lagemonitor öffnen" → zweites Fenster, 360 × 640, Nacht (Sammlung Art Einsatz, sechs Bögen mit Kennzeichen Übung).
- **Beobachtung:** Das Fenster zeigt groß „0 / 0 / 0 = 0" und „Noch nichts gemeldet · letzte Meldung gerade eben"
  und darunter „Eingetroffen: THW Karlsruhe Zugtrupp Technischer Zug gerade eben · + 5 weitere Bewegungen",
  „Einheiten: Noch keine Einheit gemeldet." Das Wort „Übung" oder ein Hinweis „6 Übungsmeldungen nicht
  gezählt" fehlt im Fenster; die Einsatzansicht erklärt es („alle 6 Übung, nicht gezählt").
- **Folge:** Wer aus Entfernung auf den Fernseher blickt, liest „nichts gemeldet" und „gerade eben eingetroffen"
  gleichzeitig; die Stärke 0 kann als „keine Kräfte vor Ort" gelesen werden. Bei Dunkelheit und Abstand wird
  der Kleindruck nicht gelesen.
- **Empfehlung:** Nicht gezählte Übungsmeldungen im Lagemonitor in gleicher Größe wie die Zahlen benennen
  („6 Übungsmeldungen — nicht gezählt"), die Zeile „Noch nichts gemeldet" in diesem Fall nicht zeigen.
- **Neu oder alt (Verweis):** neu (Verweis: Übungs-Kennzeichnung in Karten und Liste, z. B. R18-L1; im Lagemonitor nicht erfasst).
- **Nachprüfung:** Einsatz mit ausschließlich Übungsbögen anlegen, Lagemonitor öffnen: die Aussage „nicht gezählt" steht im Fenster.

### R19-L2 (P3) Scanner ohne Kamera: „Hinweise zum Handscanner" liegt unter der Knopfleiste

- **Ort:** Einsatzansicht → „Bogen scannen…", Ausweichansicht ohne Kamera, 360 × 640 (Nacht; Feld 636 bis 690 px, also unter dem Bildrand).
- **Beobachtung:** In Nacht liegt die Zeile „Hinweise zum Handscanner" bei y 552 bis 596, die feste Leiste mit „QR aus Bild einlesen…" und „Fertig" ab y 584 und deckt sie ab; `elementFromPoint` in der Zeilenmitte trifft nicht die Zeile. In Feld liegt sie außerhalb des Bildes, die Leiste (y 573 bis 627) steht davor. Erst nach Rollen im Fenster frei. Bei 390 × 844 passt alles.
- **Folge:** Wer nachts den Handscanner einrichten will, sieht die Hilfe nicht und tippt eher in die Leiste.
- **Empfehlung:** Aufklappzeile nicht unter der Leiste liegen lassen (Leiste kompakter, Abstand unten im Fenster oder Zeile oberhalb).
- **Neu oder alt (Verweis):** alt – R18-L2, R16-M3 (R18 vermerkt den Scanner als behoben, der Rest bleibt bei 360 × 640).
- **Nachprüfung:** Scanner ohne Kamera bei 360 × 640 in Nacht und Feld öffnen: „Hinweise zum Handscanner" ohne Rollen vollständig sichtbar und nicht überdeckt.

### R19-L3 (P3) Tipp-Sperre der „Meldung entfernen"-Rückfrage: gedimmter Knopf bei etwa 3 : 1, ohne Begründung

- **Ort:** Einsatzansicht → Karte aufklappen → „Mehr…" → „Entfernen" → Rückfrage, 360 × 640, alle Ansichten.
- **Beobachtung:** In den ersten etwa 0,75 s ist „Meldung entfernen" deaktiviert, Deckkraft 0,55, gestrichelter Rand (Nacht: 224/138/126 auf 23/21/15 ergibt etwa 3,0 : 1; Standard rot auf weiß etwa 2,9 : 1). Kein Text nennt den Grund; „Einen Moment …" erscheint nur, wenn man in die Sperre tippt.
- **Folge:** Bei Sonne oder schwacher Helligkeit wirkt der Knopf kurz „kaputt"; wiederholtes Tippen. Gering, die Sperre endet nach unter einer Sekunde.
- **Empfehlung:** Knopf in der Sperre mindestens 4,5 : 1 lassen und den Grund sichtbar nennen, wie bei „Zuordnen" und „Endgültig löschen" (dort steht der Grund als Text).
- **Neu oder alt (Verweis):** neu, Variante von R17-L1 und R18-L3 (gedimmte Knöpfe).
- **Nachprüfung:** Rückfrage öffnen und sofort messen: Kontrast des Knopfes über 4,5 : 1 oder Grund als Text.

### R19-L4 (P3) Ansicht „Dunkel": Rand von „Ort eintragen…" bei 2,8 : 1

- **Ort:** Einsatzansicht, Kopfband, 360 × 640, Ansicht „Dunkel".
- **Beobachtung:** Der Knopf hat einen 1-px-Rand rgb(103, 111, 128) auf dem blauen Band rgb(18, 39, 94), Kontrast 2,82 : 1 (Schwelle für Nicht-Text 3 : 1). Text und Füllung sind lesbar. Alle übrigen Ränder liegen darüber.
- **Folge:** Bei Sonne verschwindet die Knopfkante auf dem blauen Band; der Knopf wird als Beschriftung gelesen. Gering, Text bleibt lesbar.
- **Empfehlung:** Rand des Knopfes im Kopfband heller oder Füllung deutlicher abgesetzt.
- **Neu oder alt (Verweis):** neu (Verweis R17-L1, Nicht-Text-Kontrast bisher nicht gemessen).
- **Nachprüfung:** Ansicht „Dunkel", Einsatzansicht: Rand von „Ort eintragen…" mindestens 3 : 1.

### R19-L5 (P3) „Einsatz beendet" ist nur eine Zeile im Kopf; Startseite und Aktionen bleiben unverändert

- **Ort:** Einsatzansicht → „Einsatz als beendet markieren", dann Startseite, 360 × 640, Nacht und Feld.
- **Beobachtung:** Nach dem Abschluss erscheint „Einsatz beendet 28.10.2026, 03:55" als fettgedruckte Zeile im Kopf (offene Punkte und „Wieder öffnen" weiter unten in der Verwaltung). „Bogen scannen…" bleibt gefüllt und gleichwertig oben; auf der Startseite zeigt die Karte „Hochwasser Nord" nur „Einsatz", „6 Einheiten gemeldet", „Lageblatt: noch keins · Export: noch keiner", das Wort „beendet" fehlt.
- **Folge:** Wer nachts zurückkehrt, erkennt den abgeschlossenen Einsatz nicht auf einen Blick und kann weitere Bögen in einen beendeten Einsatz einlesen.
- **Empfehlung:** „beendet" auf der Startseitenkarte als Wort-Marke zeigen und im Kopf der Einsatzansicht stärker abheben.
- **Neu oder alt (Verweis):** neu (Verweis: Abschluss aus R18, Zustand „beendet").
- **Nachprüfung:** Einsatz beenden, Startseite öffnen: Marke „beendet" auf der Karte sichtbar.

### R19-L6 (P3) Quittungsleiste: 103 px hoch, 12 px über dem Rand, bleibt stehen und deckt Knöpfe ab

- **Ort:** Einsatzansicht → Karte → „Abrücken", 360 × 640 und 390 × 844, Nacht.
- **Beobachtung:** Die Leiste „Abgerückt 03:48: Nr. 1 …" misst bei 360 × 640 y 525 bis 628 (103 px von 640), bei 390 × 844 y 765 bis 832 (12 px Abstand zum unteren Rand, darunter scheint der Seitenhintergrund durch). Sie stand nach 8 s noch. Sie deckt die Knöpfe darunter ab (im Test „Einsatz weitergeben / sichern").
- **Folge:** Ein Sechstel des Bildes ist belegt; ein überdeckter Knopf wird verfehlt, bis die Leiste mit „✕" geschlossen ist. Gering, „Rückgängig" und „✕" sind 44 px groß und gut erkennbar.
- **Empfehlung:** Leiste bündig am Rand, nach einigen Sekunden von selbst schließen oder Abstand für die Knöpfe darunter lassen.
- **Neu oder alt (Verweis):** alt – R18-A8 (Höhe der Quittung nicht neu gemessen), R17-H7/K6/G7 (Leiste).
- **Nachprüfung:** Abrücken bei 360 × 640 auslösen: kein Knopf bleibt unter der Leiste unerreichbar, Leiste liegt bündig.

## Schluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Noch nichts gemeldet" auf dem Lagemonitor bei sechs nicht gezählten Übungsmeldungen.
- **Größtes Einsatzrisiko:** nicht prüfbar bleibt die echte Wirkung von Sonne und Scheinwerfer; die Messwerte sind Kontrastwerte, keine Helligkeitsmessung.
- **Top-Priorität für die nächste Iteration:** R19-L1 (Übungsmeldungen im Lagemonitor benennen), danach R19-L2 (verdeckte Hilfe im Scanner).
