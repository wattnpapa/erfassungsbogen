# Audit „Zerstörende Handlungen", Runde 16 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `36d549a` (`main` nach Runde 15).

**Zählung: P0 0 · P1 0 · P2 0 · P3 1** (R16-D1).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`,
`runde-15/README.md`, `runde-14/README.md`, `runde-13/README.md` und der Bericht
`runde-15/zerstoerende-handlungen.md`. Die dort geführten bekannten Grenzen (u. a. R6-O9,
R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, R10 bis R15-Listen
einschließlich R15-E1, R15-E2, R15-D4, R15-S4, R15-M2, R15-O1) sind nicht erneut gemeldet.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale de-DE.
Viewports 390 × 844 (durchgehend) und 360 × 640 (Quittungsleiste, Dialoge, Karten- und
Tabellenziele). Je Szenario ein frischer Browserkontext. Zustände über die Bedienung:
Einsatz-Sammlung „Hochwasser Weser" anlegen, Übungsbögen `012-sinsheim`, `013-ulm`,
`014-weinsberg` (Kopien außerhalb des Repositorys, `uebung: false`, `stand` fünf Minuten vor
der Geräteuhr, Zeitraum heute) über „Bögen einlesen…" aufnehmen. Kein Kamera-Scan, keine
Handschuhe, kein Zweitgerät, keine nativen Builds. Die Skripte haben vor dem Bestätigen die
Tippsperre der Rückfragen abgewartet.

Durchgespielt (Auswahl): Kenntnisnahme mit Rückgängig, Abrücken mit Rückgängig und
anschließende Kenntnisnahme, Meldung entfernen (Rückfrage, Quittung, Rückgängig, Wechsel auf die
Startseite und zurück, Neuladen, zweiter Tab), Aufteilen mit allen elf Personen, Auftrag/Notiz
setzen und leeren, Einsatzbeginn „Jetzt" und „Beginn entfernen", Einsatz löschen, Papierkorb und
Zurückholen bei gleichnamiger Sammlung, Sammel-PDF erzeugen und auf demselben Gerät einlesen
(neuerer Stand, entfernte Meldung), Datensicherung erstellen und einspielen (Gerät hat inzwischen
mehr Meldungen), „Alle Daten löschen", „Geräteschlüssel neu erzeugen" (ohne und mit vorhandenem
Schlüssel), „Übungsbögen", Entwurf (Aus Datei laden, Neuen Bogen erstellen, Verwerfen,
Einsammel-Platz „Zuletzt geschlossener Bogen"), Vorlage speichern (gleicher Name), Schritt
Personal („Nur Stärke" hin und zurück, Person entfernen mit Neuladen), Schritt Fahrzeuge
(Fahrzeug entfernen), Einheit schnell erfassen mit Doppeltipp auf „In Einsatz übernehmen",
angefangene Nacherfassung beim erneuten Öffnen, Enter und Browser-Zurück bei offener Rückfrage.

## Urteil

Die zerstörenden Handlungen sind in diesem Stand durchgehend gut gesichert. Jede geprüfte
Handlung, die Daten entfernt oder überschreibt, nennt in der Rückfrage Name, Stärke und die
konkrete Folge; der Fokus liegt beim Öffnen auf „Abbrechen", Enter bestätigt nichts, Escape und
Browser-Zurück schließen die Rückfrage ohne Wirkung. Die Behebungen aus Runde 15 halten im
echten Browser. Die Aufgaben ließen sich ohne fremde Hilfe erledigen. Neu gefunden wurde nur eine
Kante der Tippsperre (R16-D1).

## Behebungen aus Runde 15, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R15-D1 zwei Quittungen übereinander | hält. Abrücken → Rückgängig → „Zur Kenntnis genommen": sichtbar ist nur „Zur Kenntnis genommen: 3 Einheiten — Rückgängig ✕", die ältere Leiste ist ersetzt (390 und 360 px). Das Rückgängig ist erreichbar |
| R15-D2 Rückgängig nach „Meldung entfernen" | hält. Rückfrage: „„Rückgängig" gilt bis zum Neuladen oder Schließen der App". Nach „‹ Startseite" und erneutem Öffnen steht die Leiste „Entfernt: Meldung Nr. 2 … (8 Personen). Die Einheit Nr. 3 rückt auf und heißt danach Nr. 2." mit Rückgängig noch da; Rückgängig stellt die Reihenfolge Nr. 1 bis 3 wieder her. Dasselbe nach Neuladen bei einer Person im Schritt Personal |
| R15-D3 ältere Datei nach dem Aufteilen | nicht erneut ausgelöst; das Einlesen einer älteren Sammel-PDF meldet „Datei war älter oder gleich: keine Änderung übernommen, dieser Stand bleibt" |
| R15-E1 bis E5, D1 bis D4 Rest | die Teile, die ohne Kamera prüfbar waren (Rückfrage beim Entfernen, Rückfrage bei entfernter Meldung im Import: „Wieder aufnehmen / Draußen lassen", Aufteilen mit allen Personen: „Es bleibt niemand übrig") halten |
| R15 „Auftrag mit Rückgängig" | hält: „Auftrag gesetzt: Nr. 1 … — Pumpen am Wehr, 3 Schläuche" und „Auftrag entfernt: Nr. 1 …", je mit Rückgängig |
| R15 Sperre 2,5 s (G2) | wirkt (siehe R16-D1 für die Kehrseite) |

## Befunde

### R16-D1 [P3] Ein zweiter Tipp an derselben Stelle wird in den ersten 2,5 s ohne jede Rückmeldung verworfen, auch ein „Rückgängig"

**Kennzeichnung:** gemessen (mehrfach wiederholt, 390 × 844). Das Verhalten ist beabsichtigt
(Ortssperre gegen den Doppeltipp, `QUITTUNG_SPERRE_MS` 2 500 ms in `src/app/tipp-schutz.ts`);
neu ist nur, dass es keinerlei Rückmeldung gibt und ein bewusster Rückweg getroffen wird.

**Fundstelle / Aufgabe:** Einsatzansicht → „Zur Kenntnis genommen" tippen → nach 0,5 s
„Rückgängig" tippen → nach weiteren 0,5 s erneut „Zur Kenntnis genommen". Zweite Variante:
Einheit aufklappen → „Abrücken" → nach 3 s „Rückgängig" → 0,6 s später „Zur Kenntnis
genommen" → 0,6 s später dessen „Rückgängig".

**Beobachtung:** Der Tipp bleibt in beiden Varianten ohne Wirkung. Es erscheint weder eine
Leiste noch ein Hinweis („Einen Moment …" o. Ä.), die Kenntnisnahme steht weiter da, der Block
„Neu seit der letzten Kenntnisnahme" kommt nicht zurück. Wiederholt man den Tipp nach mehr als
2,5 s (gemessen ab 3 s), geht er durch. Direkt nach nur einer Handlung (ein Rückgängig 0,5 s
nach „Zur Kenntnis genommen") funktioniert „Rückgängig" dagegen sofort.

**Erwartung der Rolle:** Ein bewusster Tipp auf „Rückgängig" wirkt, oder die App zeigt kurz,
dass der Tipp verschluckt wurde.

**Folge:** Wer hintereinander zwei Handlungen mit Rückgängig auslöst und die zweite sofort
zurücknehmen will, tippt ins Leere und weiß nicht, ob die Handlung zurückgenommen wurde. Es geht
nichts verloren: Die Leiste bleibt sichtbar, ein zweiter Tipp nach etwa drei Sekunden wirkt.
P3, weil nur ein Rückweg verzögert wird und die Sperre einen Doppeltipp mit Handschuh schützt.

**Empfehlung:** Bei einem verworfenen Tipp kurz sichtbar machen, dass die Stelle gerade gesperrt
ist (zum Beispiel die Knopffläche kurz abblenden), oder die Sperre für „Rückgängig" auf den
Zeitraum des Doppeltipps (unter 1 s) begrenzen.

**Nachprüfung:** Kenntnisnahme → Rückgängig → erneut „Zur Kenntnis genommen" (je im Abstand von
0,5 s): entweder wirkt der dritte Tipp, oder die Stelle zeigt, dass der Tipp nicht angenommen
wurde.

## Geprüft ohne Befund

- Alle Rückfragen mit Folgen (Meldung entfernen, Einsatz löschen, „Alle Daten löschen",
  „Sicherung einspielen", „Geräteschlüssel neu erzeugen", Bogen verwerfen, „Neuen Bogen
  erstellen", „Aus Datei laden", Fahrzeug und Person entfernen, „Nur Stärke", „Jetzt" und
  „Beginn entfernen", Vorlage gleichen Namens) nennen Gegenstand und Folge; Bestätigen und
  Abbrechen liegen bei 360 × 640 mit 44 px Höhe und mindestens 40 px Abstand (Einsatz löschen:
  „In den Papierkorb" bei 323 px, „Abbrechen" bei 408 px). Der lange Dialog „Alle Daten löschen"
  scrollt (Inhalt 976 px in 606 px), „Endgültig löschen" liegt unten hinter dem Text, „Schließen"
  oben.
- „Sicherung einspielen" listet getrennt, was auf dem Gerät verloren geht (4 Meldungen) und was in
  der Datei steht (2 Meldungen), und sagt „ohne Papierkorb".
- „Neuen Bogen erstellen" bei vorhandenem „Zuletzt geschlossener Bogen" warnt, dass der bisherige
  endgültig gelöscht wird, und nennt ihn mit Stand und Personenzahl.
- Doppeltipp auf „In Einsatz übernehmen" legt die Einheit einmal an (2 Einheiten, Gesamt 20).
- Zwei offene Tabs derselben App: Entfernen im einen Tab erscheint im anderen, ein Abrücken im
  veralteten Tab überschreibt die Entfernung nicht.
- Abstände der Kartenaktionen bei 360 × 640: „Abrücken" (46, 2350) zu „Zug zuordnen" 12 px,
  alle 44 px hoch.

## Nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, Handschuhe, ein zweites Gerät mit echter
Weitergabe-Datei, das Fenster des Lagemonitors, die nativen Builds. Die lange Dauer beim Einlesen
einer Sammel-PDF (mehrere Sekunden ohne Anzeige) ist als R15-O1 bekannt und nicht erneut gemeldet.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer nach zwei Handlungen sofort „Rückgängig" tippt, hält den stillen Nicht-Effekt für einen Defekt.
- **Größtes Einsatzrisiko:** keines gefunden, das Daten ohne Rückfrage oder Rückweg zerstört; das größte Restrisiko bleibt, dass Rückgängig für entfernte Meldungen nur bis zum Neuladen oder Schließen der App gilt (bekannte Grenze, die Rückfrage sagt es).
- **Top-Priorität für die nächste Iteration:** den Tipp auf eine gesperrte Stelle sichtbar quittieren (R16-D1).
