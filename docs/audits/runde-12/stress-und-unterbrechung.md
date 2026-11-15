# Audit „Stress und Unterbrechung“, Runde 12 (Zeitdruck, Ablenkung, Wiedereinstieg)

**Prüfer:** Rollenaudit `thw-stress-test-user` · **Datum:** 2026-10-26 ·
**Zählung:** P0: 0 · P1: 0 · P2: 1 · P3: 1 (insgesamt 2 neue Befunde)

Prüfgegenstand: Web-App, laufender Produktionsbuild unter
`http://localhost:4173` (`vite preview`), Code-Stand Commit `2c96abe`
(`main` nach Runde 11). Reiner Prüfbericht, keine Codeänderung; es wurde kein
Prozess beendet.

## Prüfaufbau

Playwright (global, 1.56.1), `chromium.launch()` ohne Optionen,
`isMobile`/`hasTouch`, Locale de-DE, Viewports 360 × 640 und 390 × 844 (je
eigener Browser-Kontext). Tipps mit `tap`/`touchscreen.tap`, Unterbrechung mit
`reload()`, Zurück-Geste mit `goBack()`. Zustände über die Oberfläche
(„Neue Einsatz-Sammlung…“, „Bögen einlesen…“ mit Übungsbögen aus
`examples/thw/`, „Aus Datei laden…“). Skripte im Scratchpad unter `.../r12/`.

Vorher gelesen: `docs/audits/README.md` und `docs/audits/runde-11/README.md`.
Die dort genannten bekannten Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9,
R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4; leere Karten bei „Nur Stärke“,
Rückgängig für Meldungen nach dem Neuladen, Zeilenhöhe bei 180 × 320;
R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3) wurden nicht neu
gemeldet.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert; *Risiko* =
abgeleitet, nicht nachgestellt.

**Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur,
WebKit, native Builds, Zwei-Geräte-Abgleich, 180 × 320, Tablet.

## Urteil

Die Kernaufgaben gelingen unter Stress und Unterbrechung ohne fremde Hilfe.
Die Behebungen aus Runde 11 halten (gemessen):

- **R11-S1** (QR-Vollbild „Weiter zu Teil n →“): Fünf Tipps im Abstand von
  1,0 s und 1,3 s ergeben jeweils Teil 6 von 7 (vorher jeder zweite verworfen).
  Bei 0,8 s inklusive Tipp-Dauer fällt weiterhin gelegentlich ein Tipp aus;
  das ist die gewollte Doppeltipp-Sperre von 0,9 s.
- **R11-S2** (Browser-Zurück): Nach „In Einsatz übernehmen“ (Weg über
  „Trotzdem mit Stärke 0 übernehmen“) und nach „Fertig“ im Scanner führt die
  erste Zurück-Geste aus der Einsatzansicht auf die Startseite; kein
  Formular, kein wieder geöffneter Scanner.
- **R11-S3** („Zur Kenntnis genommen“): „Zuletzt gemeldete oben zeigen“ und
  „Zur Kenntnis genommen“ sind je 44 px hoch mit 8 px Abstand (360 und
  390 px); danach erscheint die Quittung mit „Rückgängig“ (44 px), das die
  „neu“-Marken zurückbringt.
- Weiter in Ordnung: Neuladen mitten in der Aufnahme (Ort bleibt, Hinweis
  „Entwurf … wiederhergestellt“), Doppeltipp auf „Einsatz anlegen“ (eine
  Sammlung), Doppeltipp auf „Abrücken“ (eine Quittung „Abgerückt 03:45“ mit
  „Rückgängig“), Doppeltipp auf „+ Person hinzufügen“ (eine Person), kein
  horizontaler Überlauf bei 360 und 390 px, „Einsatz löschen?“ mit klarer
  Rückfrage und „Abbrechen“ auf Abstand.

Reibung bleibt an zwei Stellen: Wer eine angefangene Aufnahme liegen lässt und
den Einsatz löscht, landet in einem Formular mit einer Meldung, die auf ein
nicht vorhandenes zweites Fenster verweist (R12-S1), und die Markierung
„1 Einheit offen“ nennt in der Übersicht keinen Grund (R12-S2).

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „anderes Fenster“ nach dem Löschen im selben
  Fenster (R12-S1).
- **Größtes Einsatzrisiko:** Die angefangene Meldung einer fremden Einheit
  wird nach dem Löschen des Einsatzes zum „eigenen Bogen“ und kann als solcher
  weitergegeben werden (R12-S1, P2).
- **Top-Priorität für die nächste Iteration:** Beim Löschen eines Einsatzes mit
  angefangener Aufnahme in der Rückfrage darauf hinweisen und danach auf der
  Startseite bleiben (R12-S1).

## Befunde

### R12-S1 [P2] Einsatz löschen mit angefangener Aufnahme: Sprung ins Formular, Hinweis „in einem anderen Fenster“, fremde Meldung wird „eigener Bogen“

**Priorität:** P2

**Kennzeichnung:** gemessen (Skript `u4.js`, 360 × 640; Gegenprobe
`u3.js` bei 360 und 390 px für die Rückfrage). Die Verwechslung bei der
Weitergabe ist Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht mit 3 Einheiten → „Einheit manuell
erfassen…“ → Ort „Wilhelmshaven“ tippen → „‹ Einsatz „…““ (Hinweis „Angefangene
Erfassung für diesen Einsatz: „THW Wilhelmshaven““) → „Einsatz löschen…“ →
„In den Papierkorb“.

**Beobachtung:** Die Rückfrage lautet „„Hochwasser Test“ mit 3 gemeldeten
Einheiten wandert in den Papierkorb und lässt sich dort 30 Tage lang
zurückholen.“ Die angefangene Erfassung wird nicht erwähnt. Nach „In den
Papierkorb“ wechselt die Ansicht nicht auf die Startseite, sondern in das
Aufnahmeformular (Schritt 1, Kopf „‹ Startseite“) mit der Meldung: „Der Einsatz
„Hochwasser Test“ wurde in einem anderen Fenster in den Papierkorb gelegt. Die
Eingabe ist jetzt ein eigener Bogen und lässt sich hier nicht mehr ablegen — zum
Ablegen auf der Startseite unter „Papierkorb Einsätze“ den Einsatz zurückholen
und die Meldung dort neu aufnehmen.“ Es gab nur ein Fenster; die Meldung für
den Fall „zweites Fenster“ erscheint auch, wenn man selbst gelöscht hat. Nach
dem Neuladen zeigt die Startseite den Kasten „THW Wilhelmshaven – Angefangene
Erfassung einer fremden Einheit“ mit „Fortsetzen“ und „Verwerfen“ und darunter
„Entwurf … wiederhergestellt. Die Aufnahme läuft dort weiter, wo du warst.“ Der
Kasten nennt den Entwurf „fremde Einheit“, die Meldung vorher „eigener Bogen“.

**Erwartung der Rolle:** Ich lösche den Einsatz und lande auf der Startseite.
Gibt es noch eine angefangene Meldung, sagt mir die Rückfrage das vorher und
sagt, was daraus wird.

**Folge im Einsatz:** Der Helfer, der nach dem Einsatzende aufräumt, sieht
plötzlich ein Formular mit einer langen Meldung (sieben Zeilen) über ein Fenster,
das er nie geöffnet hat; er hält das für eine Störung. Die Daten der fremden
Einheit stehen danach als „eigener Bogen“ im Entwurfsplatz; wer „Fortsetzen“
und „Bogen übergeben…“ tippt, gibt eine fremde Meldung mit dem Siegel der
eigenen Einheit weiter. Verloren geht nichts.

**Empfehlung:** Bei Löschen im selben Fenster auf der Startseite bleiben und
dort einen Satz zeigen („Angefangene Erfassung für „THW Wilhelmshaven“ bleibt
als Entwurf“); die Rückfrage vor dem Löschen die angefangene Erfassung nennen.
Die Meldung „in einem anderen Fenster“ nur zeigen, wenn es wirklich ein anderes
Fenster war. Entwurfskasten und Meldung gleich bezeichnen.

**Nachprüfung:** Einsatz mit angefangener Aufnahme im selben Fenster löschen:
Rückfrage erwähnt die Aufnahme, danach steht die Startseite, die Meldung nennt
kein anderes Fenster, die Bezeichnung „fremde Einheit“ bzw. „eigener Bogen“ ist
überall gleich.

### R12-S2 [P3] „1 Einheit offen“ ohne genannten Grund in den offenen Punkten der Übersicht

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `t6.js`, `t8.js`, 360 × 640).

**Fundstelle / Aufgabe:** „Neuen Bogen erstellen“ → nur „Ort der Einheit“
ausfüllen → fünfmal „Weiter“ → Übersicht.

**Beobachtung:** In der Schrittleiste steht bei „1 Einheit“ durchgehend
„offen“. Die Übersicht zeigt „⚠ 2 offene Punkte für die Weitergabe“, nämlich
„Stärke ist 0“ und „Ort/Auftrag ist noch leer“. Einen Punkt zum Einheitstyp
(Zeile „Einheitstyp — / (Einheitstyp offen)“) nennt sie nicht; auch der
Übergabe-Dialog zählt nur diese zwei Punkte. Mit einem frei getippten, nicht
aus der Liste gewählten Typ („Bergungszug“) bleibt „offen“ stehen, der Hinweis
steht nur auf Schritt 1.

**Erwartung der Rolle:** Zeigt die Leiste „offen“, steht in der Übersicht, was.

**Folge im Einsatz:** Der Helfer sieht „offen“, findet in der Liste der Punkte
keinen Bezug und tippt auf „Bearbeiten“, ohne zu wissen wo; unter Zeitdruck gibt
er den Bogen ohne Typ weiter (taktisches Zeichen und Soll-Vergleich fehlen beim
Meldekopf).

**Empfehlung:** Den Grund der Markierung „offen“ als Punkt in die Liste der
offenen Punkte aufnehmen, mit Sprung auf das Feld.

**Nachprüfung:** Bogen mit Ort, ohne Typ: Die Übersicht nennt „Einheitstyp
fehlt“ als Punkt; mit gewähltem Typ verschwinden Markierung und Punkt zugleich.
