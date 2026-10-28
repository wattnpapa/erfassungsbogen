# Prüfbericht Runde 20: Stress und Unterbrechung

- **Prüfer:** Rolle „Stress und Unterbrechung“ (thw-stress-test-user), erfahrener Helfer unter Zeitdruck, mit Unterbrechungen und wenig Aufmerksamkeit
- **Datum:** 2026-10-28
- **Code-Stand:** Commit `7c06324` (= `main`, Runde 19), Produktionsbuild, `http://localhost:4173`
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 5 · Hinweise: 4 (5 Befunde, davon 4 mit Verweis auf ältere Befunde und 1 neu: R20-S1 und R20-S4)
- **Methode:** Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen, je Lauf neuer Kontext), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Viewports 360 x 640 (Hauptlauf), 390 x 844, 320 x 568 und 568 x 320 (Querformat, Ansicht „Feld“). Tipps mit `touchscreen.tap` an den Koordinaten des Knopfes. Voller Speicher nachgestellt: `localStorage` bis zum Quota-Fehler gefüllt (5 240 747 Zeichen), danach Entfernen, Löschen, Beenden und Übergabe.
- **Maßstab:** Keine „bekannten Grenzen“. Gelesen: `docs/audits/README.md`, „Stand der Behebung“ in `runde-19/README.md`, `runde-19/stress-und-unterbrechung.md`. Auch die dort als offen geführten Punkte (R19-L2/M5/G9/S10, R19-N8) sind gemeldet, soweit sie noch zu sehen sind.
- **Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur, native Zeitwähler, WebKit, native Builds, Teilen-Menü des Betriebssystems, Dunkel/Nacht, der Fall „7 aufgenommen, 7 bereits vorhanden“ (R19-K10, Stapelimport mit Fremddateien nicht nachgestellt).
- **Kennzeichnung:** *gemessen* = im Testbrowser reproduziert, *Risiko* = abgeleitet, nicht nachgestellt.

## Urteil aus Sicht der Rolle

Die App trägt unter Stress gut. Einsatz anlegen, Einheit schnell erfassen, Abrücken, Meldung entfernen, aus dem Papierkorb zurückholen, Sammel-PDF erzeugen, Neuladen mitten im Assistenten und Zurück-Geste gelingen ohne fremde Hilfe und ohne Datenverlust. Auch bei vollem Speicher sagt die App jedes Mal, dass nichts gespeichert wurde, und nennt den Weg. Es bleiben fünf Kleinigkeiten (alle P3), vor allem im Querformat in „Feld“ und eine Bestätigung, die am 360-px-Telefon außerhalb des Bildes steht.

## Haltbarkeit der Behebungen aus Runde 19 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Voller Speicher: Entfernen | hält: Dialog „Papierkorb voll“ („Die Meldung kam nicht in den Papierkorb …, Endgültig entfernen?“); danach Quittung „Nicht im Papierkorb: nur bis zum Neuladen zurückholbar“; nach Neuladen Warnzeile „Gerätespeicher ist voll: 100 %“ oben |
| Voller Speicher: Übergabe vermerken | hält: „Übergabe nicht vermerkt … Nichts hat sich geändert“ |
| Voller Speicher: Einsatz beenden | hält: „Einsatz nicht beendet“ mit Weg zum Platzschaffen |
| Voller Speicher: Einsatz löschen | hält: „Nicht gelöscht. Der Speicher ist voll …“, mit der Wahl „Endgültig löschen / Abbrechen“ und Hinweis „keine Sicherung vorhanden“ |
| Fußleiste ohne Textüberlauf | hält: „In Einsatz übernehmen“ 165/165 px bei 360 px, kein Überlauf (Rest siehe Hinweis H1); bei 320 x 568 und 390 x 844 kein Überlauf |
| Quittungsleiste als Kurzfassung | hält: nach „Entfernen“ 60 px hoch (9 % des Bildes, vorher 119 px), „Nr. 2 entfernt · Papierkorb“, Knöpfe „Rückgängig“ und „✕“; der Papierkorb liegt nach dem Aufklappen über der Leiste (Zurückholen 169 px oben) |
| Papierkorb | hält: Rückfrage nennt Nummernfolge und 7 Tage; „Zurückholen“ stellt die Meldung zurück („zurückgeholt“, 3 gemeldet) |
| Tipp-Sperre mit „Einen Moment …“ | hält: „Trotzdem mit Stärke 0 übernehmen“ ist bei 0,4 s gesperrt und zeigt „Einen Moment …“ als Beschriftung, bei 3 s offen; „Stärke eintragen“ und „Abbrechen“ sind bei 0,25 s frei |
| Schnellerfassung mit Ortsfeld zuerst | hält: „Ort der Einheit“ hat den Fokus und liegt bei y = 183 (360 x 640), 214 in „Feld“; Schritt 3 trägt Kopf und Überschrift „3. Personal“ gleich |
| Rückfrage „Stärke fehlt“ | hält: Dialog 380 px (Standard, 360 x 640), je Antwort eine Unterzeile; in „Feld“ 429 px |
| Tabelle am Telefon | hält teilweise: Namen vollständig, Spalte „Auftrag“ weg, kein seitlicher Überlauf (Rest in R20-S5) |
| Startseite | hält: „Neuen Bogen erstellen“ und „Neue Einsatz-Sammlung…“ nebeneinander bei y = 362 (360 x 640); mit Einsatz steht dessen Karte mit „Öffnen“ bei y = 285 |
| Karte und Kennzahlen | halten: „Auftrag/Notiz“ 145/145 px, Kennzahlen mit „Einheiten“ in voller Breite, Linkabstände 8 px, „Karten | Tabelle“ 16 px |
| Sammel-PDF und „Nur neue Bögen“ | hält: „Kein Export an den Stab … die Weitergabe-Datei vom … zählt hier nicht“ |
| Neuladen im Assistenten, Zurück-Geste | halten: Ort „Flensburg“ nach Neuladen im Feld, „Entwurf … wiederhergestellt“; Zurück führt auf den Einsatz |

## Befunde

### R20-S1 [P3, Bedienung] Bestätigung „Zuletzt abgelegt … Nr.“ liegt am 360-px-Telefon unter dem Bildrand

- **Neu oder alt (Verweis):** neu (verwandt mit R18-W4, Aufnahmeknöpfe unter dem Bildrand)
- **Kennzeichnung:** gemessen (Skript `ff.js`, `h.js`)
- **Ort / Aufgabe:** Schnellerfassung → „In Einsatz übernehmen“ → zurück in der Einsatzansicht.
- **Beobachtung:** Die Einsatzansicht öffnet oben. Die Zeile „Zuletzt abgelegt: „THW Biberach“ · jetzt 1 Einheit, Gesamt 3“ beginnt bei y = 650 (Bild 640), bei 390 x 844 bei y = 627 (sichtbar). Die Nummer für den Zettel („hat Nr. 1 — die Nummer auf dem Zettel eintragen“) steht 3 096 px tiefer. Im Bild ändert sich nur die Zahl bei „Einheiten“ und die Zeile „letzte Meldung … gerade eben“.
- **Folge:** Der Helfer sieht keine Bestätigung der abgelegten Einheit und erfährt nicht, welche Nummer er auf den Zettel schreibt; er scrollt oder legt die Einheit aus Unsicherheit ein zweites Mal an.
- **Empfehlung:** Die Bestätigung mit Nummer als Quittungsleiste (wie nach „Entfernen“) am unteren Bildrand zeigen oder über den Aufnahmeknöpfen platzieren.
- **Nachprüfung:** 360 x 640: Nach „In Einsatz übernehmen“ sind Name und Nummer ohne Scrollen sichtbar.

### R20-S2 [P3, Layout/Abstand] Scanner ohne Kamera in „Feld“ im Querformat: Inhalt rollt innen, Rahmen unten abgeschnitten

- **Neu oder alt (Verweis):** alt, R19-S10 / R19-L2 / R19-M5 / R19-G9 (568 x 320 in „Feld“)
- **Kennzeichnung:** gemessen (Skript `aa.js`, Bildschirmfoto `aa1.png`)
- **Ort / Aufgabe:** „Bogen scannen…“ auf einem Gerät ohne Kamera, 568 x 320, Ansicht „Feld“.
- **Beobachtung:** `scanner-mitte` ist 308 px hoch bei 238 px sichtbarer Höhe; der gestrichelte Rahmen endet mitten im Feld „Bereit — warte auf den Handscanner“, „Hinweise zum Handscanner“ ist nur durch inneres Rollen erreichbar. Bei 360 x 640 und 390 x 844 passt alles.
- **Folge:** Der Rahmen wirkt kaputt, der innere Bildlauf ist nicht zu erkennen; der Hinweis zum Handscanner bleibt unbemerkt.
- **Empfehlung:** Im Querformat in „Feld“ Texte im Rahmen kürzen oder den Rahmen im Bildlaufbereich schließen.
- **Nachprüfung:** 568 x 320, „Feld“: Rahmen vollständig sichtbar, kein innerer Bildlauf.

### R20-S3 [P3, Layout/Abstand] Schnellerfassung im Querformat in „Feld“: Kopf und Fußleiste lassen vom Ortsfeld nur eine Hälfte

- **Neu oder alt (Verweis):** alt, R19-L2 / R19-M5 (Querformat 568 x 320 in „Feld“)
- **Kennzeichnung:** gemessen (Skript `z.js`, Bildschirmfoto `z_568x320_b.png`)
- **Ort / Aufgabe:** „Einheit schnell erfassen“, 568 x 320, „Feld“.
- **Beobachtung:** Kopf mit Rückweg, Hinweis „„–“ heißt: Schritt 2 und 5 entfallen hier“ und Schrittleiste nehmen rund 140 von 320 px, die Fußleiste ab etwa y = 256. Das Pflichtfeld „Ort der Einheit“ (Fokus, y = 232 bis 276) liegt zur Hälfte unter der Fußleiste.
- **Folge:** Beim Antippen des Feldes bleibt die Tastatur ohne Platz; der Helfer sieht nicht, was er schreibt.
- **Empfehlung:** Im Querformat Schrittleiste und Hinweis ausblenden oder den Bildlaufbereich so setzen, dass das fokussierte Feld über der Fußleiste liegt.
- **Nachprüfung:** 568 x 320, „Feld“: Ortsfeld nach dem Fokus vollständig über der Fußleiste.

### R20-S4 [P3, Text] Ortsvorschlag sagt „„Flensburg“ meint vielleicht Flensburg“

- **Neu oder alt (Verweis):** neu
- **Kennzeichnung:** gemessen (Skript `ii.js`, Bildschirmfoto `ii1.png`, nach Neuladen im Assistenten)
- **Ort / Aufgabe:** Schnellerfassung, Schritt 1, Feld „Ort der Einheit“ mit „Flensburg“.
- **Beobachtung:** Unter dem Feld steht „„Flensburg“ meint vielleicht Flensburg — Vorschlag antippen, sonst fehlen Kürzel, Telefon und E-Mail.“ Der Vorschlag ist im Text nicht vom Eingegebenen zu unterscheiden.
- **Folge:** Der Helfer weiß nicht, welcher Vorschlag gemeint ist, und tippt nach einer Unterbrechung auf gut Glück oder ignoriert den Satz.
- **Empfehlung:** Den vollen Namen des Vorschlags nennen („THW OV Flensburg“) oder den Satz zum Knopf machen.
- **Nachprüfung:** Ort „Flensburg“ eintragen: Der Vorschlag nennt, was sich ändert.

### R20-S5 [P3, Layout/Abstand] Tabelle am Telefon sprengt den Kartenrahmen, Zahlen oben, Name unten

- **Neu oder alt (Verweis):** alt, R19-N8 (Tabellenbefund; Namen und Spalte „Auftrag“ aus R19-S6 sind behoben)
- **Kennzeichnung:** gemessen (Skript `x.js`, Bildschirmfoto `x1.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht → „Tabelle“.
- **Beobachtung:** Die Tabelle (354 von 360 px) reicht links über den Rahmen der Karte „Einheiten“ hinaus (Kante bei 3,5 px, Rahmen bei 10 px) und rechts über ihn (357 gegenüber 350 px); am rechten Rand steht ein Rest der Spalte „Bedarf“. Je Zeile sind „Ges.“ und „Eingetr.“ oben, der Name unten ausgerichtet, die Zeilen sind 57 px hoch bei einer Textzeile.
- **Folge:** Gering; das Auge verfolgt eine Zeile über zwei Höhen, der Rahmen wirkt zerrissen.
- **Empfehlung:** Tabelle innerhalb des Rahmens setzen, Zellen gleich ausrichten (oben oder mittig).
- **Nachprüfung:** 360 x 640: Tabelle endet innerhalb des Rahmens, alle Zellen einer Zeile auf einer Höhe.

## Hinweise (ohne Priorität)

- **H1 In „Einsatz  übernehmen“ steht eine Doppellücke** zwischen „In Einsatz“ und „übernehmen“ (zwei Elemente mit eigenem Abstand), sichtbar bei 360 x 640 und 568 x 320. Der Text bleibt lesbar.
- **H2 „Alles klar“ als einziger Knopf der Fehlerdialoge bei vollem Speicher** („Einsatz nicht beendet“, „Übergabe nicht vermerkt“): Der Titel sagt „nicht“, die Beschriftung klingt nach Erfolg. „Verstanden“ wäre eindeutig.
- **H3 „Stärke eintragen“ setzt keinen Fokus** in das erste Feld von „3. Personal“; der Dialog schließt, der Helfer tippt das Feld selbst an.
- **H4 Scanner-Ausweichansicht:** „Fertig“ ist nur 52 px breit (44 px hoch), „Kamera erneut versuchen“ steht links, der übrige Inhalt mittig.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer nach „In Einsatz übernehmen“ am 360-px-Telefon keine Bestätigung im Bild sieht, hält die Eingabe für nicht angekommen.
- **Größtes Einsatzrisiko:** Die Nummer für den Zettel steht erst nach langem Bildlauf; wer sie nicht findet, legt die Einheit doppelt an.
- **Top-Priorität für die nächste Iteration:** R20-S1, Bestätigung mit Nummer als Quittungsleiste im Bild.
