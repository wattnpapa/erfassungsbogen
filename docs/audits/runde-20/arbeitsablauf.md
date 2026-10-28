# Prüfbericht Runde 20: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer), Meldekopf-Bediener und Helfer mit eigenem Bogen in einer Person
- **Datum:** 2026-10-28
- **Code-Stand:** Commit `7c06324` (= `main`, Runde 19), Produktionsbuild, `http://localhost:4173`
- **Methode:** Playwright (globales Modul, `chromium.launch()` ohne Optionen, frisches Profil je Lauf), `isMobile`/`hasTouch`, Locale de-DE, Viewports 360 x 640 (Hauptlauf), 390 x 844, 320 x 568 und 568 x 320 („Feld“). Fünf bis sieben Beispielbögen aus `examples/thw/` als Kopie mit `uebung: false`, aktuellem Stand und laufendem Einsatzzeitraum. Downloads (Lageblatt, Übersichts-CSV) erzeugt. Der Speicher wurde mit einem bis zum Quota-Fehler gefüllten `localStorage` nachgestellt. Kein Code geändert. Nicht geprüft: echte Kamera, Nahbereich, Bildschirmtastatur, native Builds, Sammel-PDF-Inhalt.
- **Maßstab:** Keine „bekannten Grenzen“. Auch Punkte, die in Runde 19 als offen oder teilweise geführt wurden, sind gemeldet, wenn sie im Browser noch zu sehen sind. Je Sachverhalt ein Befund.
- **Zählung:** P0: 0 · P1: 0 · P2: 1 · P3: 5 · Hinweise (ohne Priorität): 4

## Urteil aus Sicht der Rolle

Erwartete Arbeitsfolge (Annahme, kein bekannter THW-Vorschrifttext): Der Meldekopf legt einen Einsatz an, nimmt Bögen auf (Datei, Scan oder Schnellerfassung vom Zettel), ordnet Zug zu, rückt Einheiten ab, gibt die Lage weiter (Lageblatt, CSV), vermerkt die Übergabe und markiert den Einsatz als beendet. Daneben steht der eigene Bogen bis zur Übergabe.

Beide Strecken ließen sich ohne fremde Hilfe, ohne doppelte Eingabe und ohne Datenverlust durchlaufen. Die Behebungen aus Runde 19 halten durchweg. Auch bei vollem Speicher meldet die App jede Änderung ehrlich als „nicht gespeichert“, statt „gespeichert“ zu behaupten. Die Reibung liegt nur noch in einer ungeschützten Endgültig-Löschung im Notweg bei vollem Speicher, in zwei kryptischen Statuszeilen, in einer Meldung beim Mehrfach-Einlesen und im weiten Weg zur Einheitenliste.

## Haltbarkeit der Behebungen aus Runde 19 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Voller Speicher: Abrücken | hält: Dialog „Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll“, Karte bleibt unverändert |
| Voller Speicher: Meldung entfernen | hält: „Papierkorb voll … Endgültig entfernen?“, Meldung bleibt bis zur Entscheidung stehen |
| Voller Speicher: Einsatz löschen | hält: „Nicht gelöscht … Einsatz ist nicht gelöscht“, Einsatz bleibt (siehe R20-W1 zur Endgültig-Schaltfläche) |
| Voller Speicher: Beenden und Übergabe vermerken | halten: „Einsatz nicht beendet“ / „Übergabe nicht vermerkt … Nichts hat sich geändert“; Karte zeigt „○ Übergabe noch nicht vermerkt“ |
| Voller Speicher: Einlesen | hält: Banner „Gerätespeicher ist voll: 100 %“ und „Nicht aufgenommen: 1 Bogen … die Datei selbst ist in Ordnung“ |
| Fußleiste ohne Textüberlauf | hält: „In Einsatz übernehmen“ 167 px breit, Beschriftung vollständig (360 px) |
| Quittungsleiste als Kurzfassung | hält: 60 px hoch, nach etwa 15 bis 20 s verschwunden; „Abgerückt“ ohne Dauerleiste (Rest siehe R20-W5) |
| Tipp-Sperre „Meldung entfernen“ | hält: Tipp nach 200 ms bewirkt nichts, Knopf zeigt „Einen Moment …“ und Fortschrittsbalken, wirkt nach etwa 1 s |
| Schnellerfassung mit Ortsfeld zuerst | hält: Ort der Einheit bei 183 px, Fokus im Ortsfeld, Eingabe bis „In Einsatz übernehmen“ ohne Umweg |
| Tabelle am Telefon (360 px) | hält: kein seitlicher Überlauf, Einheitsnamen vollständig auf drei Zeilen |
| Startseite | hält: „Neuen Bogen erstellen“ und „Neue Einsatz-Sammlung…“ nebeneinander im ersten Bild (361 px) |
| Aktionsraster „Mehr…“ | hält: Beschriftungen vollständig, „Entfernen“ in eigener Zeile mit 24 px Abstand |
| Abschlussblock bei neuer Meldung | hält: „⚠ … seitdem 1 neue Meldung, nicht mehr aktuell“; „Alle Daten als CSV“ in der Liste |
| Rückfrage „Einsatz löschen?“ | hält: nennt „Noch nichts exportiert oder übergeben“ |
| Aufgeklappte Karte bei 320 x 568 | hält: 537 px statt 918 px |

## Befunde

### R20-W1 [P2] Typ Daten/Verlust: „Endgültig löschen“ im Notweg bei vollem Speicher wirkt sofort

- **Neu oder alt (Verweis):** neu (Randfall zur Behebung R19-O2/D2)
- **Ort:** Einsatzansicht › „Einsatz löschen…“ › „In den Papierkorb“ bei vollem Speicher, Dialog „Nicht gelöscht“, 360 x 640.
- **Beobachtung:** Dialog nennt „Es gibt noch keinen Export — das wäre die einzige Kopie“ und bietet „Endgültig löschen“ an. Ein Tipp 200 ms nach dem Öffnen löscht den Einsatz mit allen Bögen („Endgültig gelöscht … nicht rückholbar“). Keine Tipp-Sperre, kein Haken; der reguläre Weg „Endgültig löschen…“ im Papierkorb verlangt dagegen einen Haken. Der Dialog besteht aus acht Zeilen Fließtext, der Knopf steht direkt darunter.
- **Folge:** Wer den Dialog wegtippen will (Handschuh, Eile), vernichtet die einzige Kopie der Lage. Das Ereignis ist selten, aber nicht umkehrbar.
- **Empfehlung:** Denselben Schutz wie beim regulären Endgültig-Löschen (Haken oder Tipp-Sperre mit „Einen Moment …“), bei fehlendem Export zusätzlich zuerst „Sammel-PDF erzeugen“ als Hauptknopf.
- **Verifikation:** Speicher füllen, Einsatz ohne Export löschen: „Endgültig löschen“ reagiert erst nach Sperre oder Haken.

### R20-W2 [P3] Typ Text: Kopfzeile „noch offen: 6“ ohne Nennung, was offen ist

- **Neu oder alt (Verweis):** neu (Folgebefund zu R19-W1)
- **Ort:** Einsatzkopf nach „Einsatz als beendet markieren“ und einer später eingelesenen Meldung, 360 x 640.
- **Beobachtung:** „Einsatz beendet 28.10.2026, 06:51 — noch offen: 6 — nicht mehr aktuell, seitdem 1 neue Meldung“. Der Abschlussblock weiter unten nennt dieselben sechs Punkte namentlich (Weitergabe-Datei, Lageblatt, Übersicht, Alle Daten, Excel, Datensicherung), der Kopf nur die Zahl.
- **Folge:** Im Kopf ist unklar, ob sechs Einheiten, Meldungen oder Exporte offen sind; der Helfer muss nach unten scrollen.
- **Empfehlung:** „6 Übergaben offen“ oder die ersten zwei Namen mit „+4“.
- **Verifikation:** Einsatz beenden, Bogen einlesen: Kopfzeile benennt, was offen ist.

### R20-W3 [P3] Typ Text: Schnellerfassung zeigt „Schritt 1 von 6: Einheit · 2, 5 entfallen“

- **Neu oder alt (Verweis):** neu
- **Ort:** Schnellerfassung, Kopf unter „Schnellerfassung“, 360 x 640.
- **Beobachtung:** Die Statuszeile zählt sechs Schritte, nennt „2, 5 entfallen“ ohne Begriff; nach „Weiter“ springt die Anzeige von Schritt 1 auf „Schritt 3 von 6: Personal“.
- **Folge:** Der Helfer sieht Zahlen, die er nicht erklären kann, und fragt sich, ob etwas fehlt.
- **Empfehlung:** „Schritt 1 von 2“ (nur die tatsächlich gezeigten Schritte) oder „Fahrzeuge und Ausrüstung entfallen“.
- **Verifikation:** Schnellerfassung öffnen: Zählung stimmt mit den erreichbaren Schritten überein.

### R20-W4 [P3] Typ Daten: Mehrfach-Einlesen meldet „älterer Stand“ bei gleichem Stand

- **Neu oder alt (Verweis):** alt, verwandt mit R19-K10 (Zählung beim Einlesen)
- **Ort:** Einsatzansicht › „Bögen einlesen…“, 360 x 640.
- **Beobachtung:** Fünf Bögen sind aufgenommen. Wird eine Auswahl aus denselben fünf plus zwei neuen Dateien gewählt (drei von drei Läufen), steht dort „2 Bögen aufgenommen, 5 bereits vorhanden“ und zusätzlich „THW Haßmersheim …: älterer Stand als der vorhandene (06:43) — nur in die Historie gelegt“. Die Datei trägt exakt denselben Stand (06:43). Dieselbe Datei einzeln oder als Teil einer vollständig vorhandenen Auswahl ergibt nur „bereits vorhanden“. Die Lage blieb richtig (6 Einheiten, Summe unverändert).
- **Folge:** Der Bediener liest eine Warnung über einen angeblich älteren Bogen und prüft Historie und Stand, ohne dass etwas zu prüfen wäre.
- **Empfehlung:** Gleicher Stand ist „bereits vorhanden“, nicht „älterer Stand“; die Zählung („5 vorhanden“) und der Hinweis dürfen sich nicht widersprechen.
- **Verifikation:** Fünf Bögen aufnehmen, dieselben fünf mit zwei neuen erneut einlesen: nur „2 aufgenommen, 5 bereits vorhanden“.

### R20-W5 [P3] Typ Layout/Abstand: Quittung „Zug zugeordnet“ zeigt die Zahl der Einheiten nicht

- **Neu oder alt (Verweis):** alt, R18-S2 (Quittungsleiste mit Zahl), durch die Kurzfassung aus Runde 19 wieder verloren
- **Ort:** Einsatzansicht › „Neu seit der letzten Kenntnisnahme“ › „Zuordnen“, Leiste unten, 360 x 640.
- **Beobachtung:** Sichtbar steht nur „Zug „1. Zug““ mit „Details“; im Seitentext steht „gesetzt: 5 Einheiten“ nur versteckt. Bei „Abgerückt“ nennt die Kurzfassung dagegen Nr. und Zeit.
- **Folge:** Bei einer Massenaktion über fünf Einheiten sieht der Helfer nicht, ob wirklich alle fünf betroffen waren.
- **Empfehlung:** Kurzfassung „Zug „1. Zug“: 5 Einheiten“.
- **Verifikation:** Zug für alle setzen: Leiste nennt „5 Einheiten“ sichtbar.

### R20-W6 [P3] Typ Bedienung: Die erste Einheitenkarte liegt nach dem Einlesen 1 394 px unter dem Kopf

- **Neu oder alt (Verweis):** alt, R19-W4 (vorher etwa 2 150 px; besser, nicht behoben)
- **Ort:** Einsatzansicht nach „Bögen einlesen…“ mit fünf Bögen, 360 x 640 und 390 x 844 (1 371 px).
- **Beobachtung:** Vor der ersten Karte stehen Kennzahlen, vier Aufnahmeknöpfe, die Aufnahmequittung, der eingeklappte Block „Neu seit der letzten Kenntnisnahme“ mit Bedarf, zwei Sprungverweise, Karten/Tabelle. Der Block „Neu seit …“ ist jetzt eingeklappt, die Liste liegt weiter bei über zwei Bildschirmen (640 px).
- **Folge:** Nach jeder Aufnahme muss gesucht oder „Zur Einheitenliste ↓“ gewählt werden, um die Einheit zu sehen.
- **Empfehlung:** Aufnahmequittung und „Bedarf“ als eine Zeile; Liste nach den Kennzahlen.
- **Verifikation:** Fünf Bögen einlesen: erste Karte innerhalb von zwei Bildschirmen (360 x 640).

## Hinweise (ohne Priorität)

- **H1 Scanner ohne Kamera, 568 x 320 in „Feld“** (alt, R19-L2/M5/G9/S10): Der mittlere Bereich rollt innen (308 von 238 px); „Hinweise zum Handscanner“ liegt unter dem Rand, „QR aus Bild einlesen…“ und „Fertig“ bleiben in der Fußleiste erreichbar. Bei 360 x 640 und 390 x 844 passt alles.
- **H2 Ansicht-Leiste am unteren Rand** (alt, R19-K12): in der Einsatzansicht dauerhaft 57 px (9 % von 640 px) mit „Ansicht: Standard“. Kein Inhalt geht verloren, Quittungsleiste und Leiste liegen nicht übereinander.
- **H3 Wortlaut bei vollem Speicher:** „Platz schafft nur Löschen“ (Abrücken, Einlesen) gegen „Platz schafft nur Verkleinern: unter „Mehr…“ …“ (Einsatz löschen) sind uneinheitlich; alle Dialoge sagen aber ehrlich „nicht gespeichert“.
- **H4 Alte Aufnahmequittung bleibt stehen:** Nach Schnellerfassung eines sechsten Bogens steht über „Zuletzt abgelegt: THW Delmenhorst“ weiter „5 Bögen aufgenommen …“ vom vorigen Einlesen. Folge: kaum, nur Länge der Seite.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Zahlen „6 Schritte, 2, 5 entfallen“ und „noch offen: 6“ lesen sich wie Fehler, sind aber nur unvollständig formulierte Statuszeilen (R20-W2, R20-W3).
- **Größtes Einsatzrisiko:** Der Notweg „Endgültig löschen“ bei vollem Speicher vernichtet den einzigen Stand mit einem einzigen Tipp (R20-W1); sonst wurde kein Datenverlust beobachtet.
- **Top-Priorität für die nächste Iteration:** R20-W1 (Endgültig-Löschen im Notweg schützen).
