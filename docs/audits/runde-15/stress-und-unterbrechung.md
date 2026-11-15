# Audit „Stress und Unterbrechung", Runde 15 (Zeitdruck, Ablenkung, Wiedereinstieg)

**Prüfer:** Rollenaudit `thw-stress-test-user` · **Datum:** 2026-10-26 ·
**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 4 (insgesamt 4 neue Befunde)

Prüfgegenstand: Web-App, laufender Produktionsbuild unter
`http://localhost:4173` (`vite preview`), Code-Stand Commit `a7874f0`
(`main` nach Runde 14). Reiner Prüfbericht, keine Codeänderung; es wurde kein
Prozess beendet.

## Prüfaufbau

Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`,
`chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE,
Dichte 2, Viewports 390 × 844 und 360 × 640 (je neuer Browser-Kontext, dazu
360 × 330 als Ersatz für eine eingeblendete Bildschirmtastatur und 640 × 360
quer). Tipps mit `tap` und `touchscreen.tap` an festen Koordinaten (Doppeltipp
in Abständen von 80 bis 1 500 ms), Unterbrechung mit `reload()` (0 bis
3 000 ms nach der letzten Eingabe), Zurück-Geste mit `goBack()`/`goForward()`.
Zustände über die Oberfläche („Neue Einsatz-Sammlung…", „Bögen einlesen…" mit
Übungsbögen aus `examples/thw/`, „Einheit manuell erfassen…",
Schnellerfassung, „Neuen Bogen erstellen"). Skripte im Scratchpad unter
`.../scratchpad/stress15/`. Hinweis: Das Scratchpad-Verzeichnis `.../r15/` wurde
von einem zweiten Prüflauf gleichzeitig beschrieben (dessen `lib.js` hat meines
überschrieben); die Messungen oben wurden vor der Überschreibung bzw. in
`stress15/` wiederholt.

Vorher gelesen: `docs/audits/README.md`, `runde-14/README.md`,
`runde-13/README.md`, `runde-12/README.md`. Die dort genannten bekannten
Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5,
R8-H5/S4; Runde 10: leere Karten bei „Nur Stärke", Rückgängig für Meldungen
überlebt Neuladen nicht, Tabellenzeilenhöhe bei 180 × 320; R11-S4, R11-H2,
R11-K2, R11-A2, R11-A5, R11-M1, R11-M3; R12-W3, R12-H3, R12-O2, R12-O4, R12-G3;
R13-W1, R13-W6, R13-H1; R14-E7, R14-S2, R14-H1, R14-W3) wurden nicht neu
gemeldet. Gewollte Tipp-Sperren (rund 1,2 s nach Seitenwechsel und
Dialog-Öffnung; „Einen Moment …") sind bekannt und kein Befund. Was andere
Rollen dieser Runde bereits gefunden haben (u. a. R15-D1/D2 Quittungen,
R15-W3 Auftrag ohne Quittung, R15-E3 Mehrteilige Codes), ist nicht wiederholt.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert; *Risiko* =
abgeleitet, nicht nachgestellt.

**Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur,
WebKit, native Builds, Zwei-Geräte-Abgleich, 180 × 320, Teilen-Menü des
Betriebssystems (der `navigator.share`-Stub änderte den Ablauf nicht; es kam in
allen drei Fällen derselbe Download), Import einer Sammel-PDF mit Neuladen
mittendrin (Ergebnis nicht auswertbar, siehe Ende).

## Urteil

Unter Stress und Unterbrechung ist die App sehr belastbar. Die Aufgaben
gelingen ohne fremde Hilfe; in keinem Versuch ging eine Eingabe verloren, die
ein Mensch in realer Geschwindigkeit getippt hat. Die vier neuen Befunde sind
P3 und betreffen den Wiedereinstieg nach einem Stapelimport, eine liegen
gebliebene Meldungszeile und eine Knopfanordnung.

### Behebungen aus Runde 14, im echten Browser geprüft

- **R14-S1** (Zug/Auftrag/Notiz bei Browser-Zurück) *gemessen, hält:* Text im
  Feld „Auftrag/Notiz" getippt, nicht gespeichert, `goBack()` zur Startseite,
  Einsatz wieder geöffnet: Der Text steht in der Karte. Neuladen unmittelbar
  nach dem Tippen behält ihn ebenfalls.
- **R14-S3** (Marke „neu") *gemessen, hält:* aufgeklappte Karte trägt
  „neu · kürzlich eingetroffen", der Kasten oben zählt weiter dieselbe Zahl.
- **R14-S4** (Kontaktzeilen) nur teilweise prüfbar: In der Karte „Müllheim"
  (Details) steht kein alleinstehendes „·" am Ort der Kontaktzeilen; am
  Zeilenende der Zeitzeile („ändern ·", „älter als 24 h ·") bleibt ein „·"
  stehen (reine Optik, kein Befund).
- **R14-G1** (Doppeltipp) *gemessen, hält:* Abrücken, „In Einsatz übernehmen",
  „Einsatz löschen…" lösen bei Zweittipp nach 80 bis 700 ms nur einmal aus;
  nach 1,2 s zählt der Zweittipp als neue Handlung (gewollt).
- **R14-H2/G2/D3** (Zug zuordnen) *gemessen, hält:* „Zug „3. Zug" gesetzt: 3
  Einheiten" mit „Rückgängig", Eingabetaste im Feld „Zug für alle" löst das
  Zuordnen mit Quittung aus.
- **R14-D4/D1** Abrücken: Quittung „Abgerückt 12:48: Nr. 1 …" mit „Rückgängig"
  bleibt mindestens 60 s stehen (Messung bei 2, 5, 8, 12, 20, 30, 45, 60 s).
  „Entfernen" einer Meldung fragt nach (Nummernverschiebung, Rückgängig-Dauer
  genannt), 66 px Abstand zu „Verschieben…".
- **R14-E3/E5** Fahrzeug entfernen: Rückfrage nennt Typ und Kennzeichen, der
  Satz „Rückgängig … auch nach „Weiter" oder Neuladen, 15 Minuten lang" stimmt:
  Nach Neuladen und „Fortsetzen" steht „Entfernt: MzKW THW-80101 – Rückgängig"
  im Bogen (auf der Startseite steht dazu nichts).
- **R14-S2** (bekannt, teilweise): Der Filter („Wasser", „7 von 12") fällt nach
  Neuladen weg, die Ansicht „Tabelle" bleibt. Das ist die sichere Richtung
  (es werden mehr Einheiten gezeigt, nicht weniger), kein Befund.
- Weiter in Ordnung (gemessen):
  - Neuladen zwischen 0 und 3 000 ms nach dem Tippen von Ort und
    Organisationsname behält beides; „Fortsetzen" öffnet den Schritt, in dem
    man war; Zettelfelder (Eingetroffen, Nr., Zug) bleiben bei der manuellen
    Erfassung erhalten, die Aufnahme läuft nach Neuladen direkt weiter.
  - Rückfragen („Einsatz löschen?", „Angefangenen Bogen verwerfen?", „Neuen
    Bogen anfangen?", „Bogen aus Datei öffnen?", „Keine Einsatz-Sammlung in der
    Datei") setzen sich auf „Abbrechen" bzw. nennen die Folge; Browser-Zurück
    schließt nur die Rückfrage, Neuladen schließt sie ohne Aktion.
  - Stepper „Mannschaft: erhöhen" (52 × 52 px) zählt bei 10 Tipps in 60, 120,
    200 und 350 ms Abstand jeden Tipp (40 von 40), die Sperre greift hier nicht.
  - Dreifach-Tipp auf „+ Fahrzeug hinzufügen" legt ein Fahrzeug an.
  - Bildschirmhöhe 330 px (Tastatur): Die Fußleiste verschwindet, das
    fokussierte Feld bleibt sichtbar (Oberkante 72 px).
  - Lageblatt: Quittung „✓ Lageblatt erzeugt (A4 quer)" steht unter dem Knopf,
    im Bild, wenn man gerade getippt hat.

## Befunde

### R15-S1 [P3] Stapelimport wird durch Neuladen mittendrin still zur Teilaufnahme

**Kennzeichnung:** gemessen (Skript `imp.js`, 360 × 640; Unterbrechung per
`reload()`, das Auslösen durch ein Telefon, das die Seite im Hintergrund
verwirft, ist Annahme).

**Fundstelle / Aufgabe:** Einsatz → „Bögen einlesen…" → 40 Bögen auf einmal
wählen → Seite wird währenddessen neu geladen.

**Beobachtung:** Neuladen 150 ms nach der Auswahl: nach „Stresstest öffnen"
stehen „Einheiten (23 gemeldet · 0 zählend)" statt 40. Nach 400 und 900 ms
sind es 40. Die Aufnahme geschieht Bogen für Bogen (das Ergebnis ist
fehlerfrei, ohne doppelte oder halbe Einträge), aber danach gibt es keinen
Hinweis, dass der Import unterbrochen wurde, und keine Angabe, welche
Dateien fehlen. Die Quittung „N Bögen aufgenommen" ist mit dem Neuladen
verschwunden.

**Erwartung der Rolle:** Wenn ich unterbrochen werde, sagt mir die App beim
Wiederkommen, dass nicht alles angekommen ist, oder sie nimmt alles oder
nichts auf.

**Folge im Einsatz:** Wer 30 bis 40 Dateien auf einmal einliest und genau
dabei unterbrochen wird (App im Hintergrund, Anruf), glaubt nach dem
Wiederkommen an eine vollständige Lage; fehlende Einheiten fallen erst auf,
wenn jemand nachfragt. Beim Wiederholen des Imports werden die schon
aufgenommenen Bögen als Doppelempfang übersprungen, der Weg zur Reparatur
ist also gangbar.

**Empfehlung:** Beim Wiederöffnen eines Einsatzes nach unterbrochenem Import
einen Satz zeigen („Import unterbrochen: 23 von 40 Bögen aufgenommen — Dateien
erneut einlesen"), oder die Aufnahme erst als Ganzes festschreiben.

**Nachprüfung:** 40 Dateien wählen, nach 150 ms neu laden: Der Einsatz nennt
die unvollständige Aufnahme.

### R15-S2 [P3] Nach einem Stapelimport liegt die Einheitenliste fast drei Bildschirme unter dem Kopf

**Kennzeichnung:** gemessen (Skript `y.js`, 360 × 640, 30 Übungsbögen).

**Fundstelle / Aufgabe:** Einsatz → „Bögen einlesen…" mit 30 Bögen → die
neuen Einheiten ansehen.

**Beobachtung:** Der Kasten „Neu seit der letzten Kenntnisnahme (30)" beginnt
bei 595 px und zeigt zehn Einheiten mit je ein bis zwei Zeilen, bei Warnungen
(„⚠ Bogen nennt: … passt das zu dieser Lage? …") bis zu sieben Zeilen in
Bernstein; danach „und 20 weitere", „Zug für 30 Einheiten ohne Zug", drei
Textknöpfe und der Hinweis „Weitergeben, Lageblatt, Export ↓". „Zur
Einheitenliste ↓" steht bei rund 1 700 px, die Überschrift „Einheiten (30
gemeldet · 0 zählend)" bei 1 810 px, die erste Karte bei 2 076 px; die Seite
ist 10 478 px hoch.

**Erwartung der Rolle:** Nach dem Einlesen sehe ich die Liste, nicht noch
einmal jede Einheit als Satz.

**Folge im Einsatz:** Wer nach dem Einlesen nur „stimmt die Zahl?" prüfen will,
scrollt knapp drei Bildschirme oder sucht den Textlink. Kein Datenverlust.

**Empfehlung:** Bei mehr als etwa fünf neuen Einheiten den Kasten auf die
Zahl und die Warnungen kürzen (die Einzelsätze hinter „anzeigen") und
„Zur Einheitenliste" als Knopf an den Anfang setzen.

**Nachprüfung:** 30 Bögen einlesen, 360 × 640: Die Überschrift „Einheiten (…)"
steht innerhalb des ersten Bildschirms nach der Quittung.

### R15-S3 [P3] Browser-Zurück nach „In Einsatz übernehmen" lässt eine Zeile ohne Zusammenhang auf der Startseite stehen

**Kennzeichnung:** gemessen (Skript `w.js`, 360 × 640, Bild `w.png`).

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur
Stärke)…" → „Für „Stresstest" erfassen" → Ort, Stärke 6 → „In Einsatz
übernehmen" → Browser-Zurück.

**Beobachtung:** Der Einsatz zeigt „Zuletzt abgelegt: „THW Husum" · jetzt 1
Einheit, Gesamt 6". Die erste Zurück-Geste führt auf die Startseite; dort
steht zwischen dem grünen Offline-Kasten und „Meinen Bogen ausfüllen" der
Satz „„THW Husum" hat Nr. 1 — die Nummer auf dem Zettel eintragen." — ohne
Einsatznamen, ohne Knopf. Er bleibt bis zum Neuladen stehen. Über „‹ Startseite"
statt der Zurück-Geste entsteht die Zeile nicht.

**Erwartung der Rolle:** Auf der Startseite stehen nur Dinge, die dort etwas
bedeuten.

**Folge im Einsatz:** Wer nach einer Unterbrechung zurückkommt, sieht eine
Aufforderung („Nummer eintragen"), die er keiner Aufgabe zuordnen kann, und
sucht sie im eigenen Bogen. Keine Folge für die Daten.

**Empfehlung:** Hinweiszeilen aus der Einsatzansicht beim Verlassen der Ansicht
(auch per Zurück) wegnehmen oder den Einsatznamen nennen.

**Nachprüfung:** Wie oben: Nach der Zurück-Geste steht auf der Startseite keine
Zeile zu einer einzelnen Einheit.

### R15-S4 [P3] „In Einsatz übernehmen" liegt 16 px über „Weiter →" und beendet die Erfassung ohne Rückfrage

**Kennzeichnung:** Abstand und Wirkung *gemessen* (Skripte `gap.js`,
`ue.js`, 360 × 640 und 390 × 844), die Verwechslung selbst *Risiko*.

**Fundstelle / Aufgabe:** Einheit manuell erfassen → Schritt 3 „Nur Stärke" mit
Stärke 6 → „Weiter →" → Schritt 4 „Fahrzeuge".

**Beobachtung:** Die feste Fußleiste zeigt auf jedem Schritt „In Einsatz
übernehmen" (volle Breite, 44 px hoch) und 16 px darunter die Reihe „←  ◐
Weiter →" (je 44 px). Ein Tipp auf die Mitte von „In Einsatz übernehmen" auf
Schritt 4 nimmt die Einheit sofort auf und springt in die Einsatzansicht, ohne
Hinweis, dass Fahrzeuge (Schritt 4) und Sofortbedarf (Schritt 5) noch nicht
bearbeitet wurden. Erst die Karte trägt später „nicht erfasst".

**Erwartung der Rolle:** Der große Knopf über „Weiter" ist die Fortsetzung,
nicht der Abschluss.

**Folge im Einsatz:** Wer mit dem Daumen „Weiter →" treffen will und 16 px zu
hoch tippt, verlässt die Erfassung mit einer Einheit ohne Fahrzeuge und
Bedarf; nachträglich lässt sich das über die Karte ergänzen, kostet aber den
Rückweg in den Bogen.

**Empfehlung:** Auf Schritten, die noch offene Folgeschritte haben, die
Übernahme einmal nachfragen („Fahrzeuge und Sofortbedarf offen — jetzt
übernehmen?") oder den Knopf optisch und räumlich von „Weiter →" trennen.

**Nachprüfung:** Auf Schritt 4 den Rand von „In Einsatz übernehmen" tippen:
Die App fragt oder bleibt im Bogen.

## Nebenbeobachtungen (kein Befund)

- Tippt man in der Erfassung unmittelbar nach einer Eingabe im Feld „Zug"
  (Zettelangaben) ohne Pause (unter etwa 300 ms, nur mit Skript möglich) in das
  Feld „Ort der Einheit" und schreibt sofort, gehen die ersten Zeichen
  verloren; mit menschlicher Pause (≥ 1 s) trat das nie auf. Nicht als Befund
  gewertet.
- Ein Tipp auf „Abbrechen" in einer Rückfrage innerhalb von etwa 400 ms nach
  dem Öffnen wird von der Tipp-Sperre geschluckt (gemessen: nach 100 und 400 ms
  bleibt die Rückfrage stehen, nach 800 ms schließt sie). Gewollt und mit dem
  Hinweis „Einen Moment …" angezeigt.
- Der Test „Einsatz importieren…" mit einer selbst erzeugten Sammel-PDF (1,2 MB)
  und Neuladen nach 50 bis 3 000 ms lieferte in allen Läufen keinen Einsatz;
  vermutlich verlangt der Import eine Bestätigung, die das Neuladen
  abgebrochen hat. Nicht ausgewertet.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Nach einem unterbrochenen Stapelimport glaubt man
  an eine vollständige Lage (R15-S1).
- **Größtes Einsatzrisiko:** Eine unterbrochene Aufnahme mehrerer Bögen bleibt
  ohne Hinweis unvollständig (R15-S1; ohne Datenverlust an schon
  aufgenommenen Bögen).
- **Top-Priorität für die nächste Iteration:** Hinweis auf unterbrochenen
  Import beim Wiederöffnen des Einsatzes (R15-S1), danach die kurze Fassung des
  Kastens „Neu seit der letzten Kenntnisnahme" (R15-S2).
