# Audit „Stress und Unterbrechung", Runde 16 (Zeitdruck, Ablenkung, Wiedereinstieg)

**Prüfer:** Rollenaudit `thw-stress-test-user` · **Datum:** 2026-10-26 ·
**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 3 (insgesamt 3 neue Befunde)

Prüfgegenstand: Web-App, laufender Produktionsbuild unter
`http://localhost:4173`, Code-Stand Commit `36d549a` (`main` nach Runde 15).
Reiner Prüfbericht, keine Codeänderung; es wurde kein Prozess beendet.

## Prüfaufbau

Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`,
`chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE,
Dichte 2, Viewports 360 × 640 und 390 × 844 (je neuer Browser-Kontext), dazu
640 × 360 als Drehung mitten in der Eingabe. Tipps mit `touchscreen.tap` an
festen Koordinaten (Doppeltipp in Abständen von 60 bis 1 400 ms), Unterbrechung
mit `reload()` (150 ms bis 3 s nach der letzten Eingabe), Zurück-Geste mit
`goBack()`. Zustände über die Oberfläche („Neue Einsatz-Sammlung…", „Bögen
einlesen…" mit 3, 5, 30 und 40 Übungsbögen aus `examples/thw/`, „Einheit
manuell erfassen…", Schnellerfassung von der Startseite, „Neuen Bogen
erstellen"). Skripte im Scratchpad unter `.../scratchpad/s16/`.

Vorher gelesen: `docs/audits/README.md`, `runde-15/README.md`,
`runde-14/README.md`, `runde-13/README.md` (und den Bericht
`runde-15/stress-und-unterbrechung.md`). Die dort genannten bekannten Grenzen
wurden nicht neu gemeldet, darunter R15-E1, R15-E2, R15-D4, R15-S4 (die
Übernahme-Schaltfläche liegt jetzt in einer Reihe mit „→", Abstand 11 px),
R15-M2 und R15-O1.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert; *Risiko* =
abgeleitet, nicht nachgestellt.

**Nicht geprüft:** echte Kamera (der Scanner ließ sich im Testbrowser nicht
sinnvoll öffnen), Lärm, Handschuhe, echte Bildschirmtastatur, WebKit, native
Builds, Zwei-Geräte-Abgleich, 180 × 320, Teilen-Menü des Betriebssystems.

## Urteil

Unter Stress und Unterbrechung bleibt die App sehr belastbar. Die Aufgaben
(Einsatz anlegen, 30 bis 40 Bögen einlesen, Einheit schnell erfassen,
abrücken, Stärke korrigieren, eigenen Bogen bis zur Übergabe führen) gelingen
ohne fremde Hilfe; in keinem Versuch ging eine Eingabe verloren, die ein Mensch
in realer Geschwindigkeit getippt hat. Die drei neuen Befunde sind P3 und
betreffen Zahlenfelder und die Sollstärke der Schnellerfassung.

### Behebungen aus Runde 15, im echten Browser geprüft

- **R15-S1** (Stapelimport durch Neuladen unterbrochen) *gemessen, hält:*
  40 Dateien gewählt, Neuladen nach 150 ms: der Einsatz zeigt „⚠ Import
  unterbrochen: 40 Dateien waren gewählt, 24 Meldungen kamen an …" (bei
  weiteren Läufen 26). Erneutes Wählen derselben Dateien: „14 Bögen
  aufgenommen, 26 bereits vorhanden", der Hinweis ist danach weg, auch nach
  Neuladen. Neuladen nach 600 ms: alle 40 da, kein Hinweis (richtig).
- **R15-S2** (Kasten „Neu seit …" nach Stapelimport) *gemessen, teilweise:*
  bei 30 Bögen steht „Zur Liste springen ↓" bei 637 px, die Überschrift
  „Einheiten (…)" bei 1 265 px (Runde 15: 1 810 px); der Kasten ist als Kurzfassung
  mit „24 Einheiten ohne Einzelsatz, siehe Liste" und „Alle 24 einzeln anzeigen"
  gekürzt. Die Liste liegt bei 360 × 640 noch gut eine Bildschirmhöhe unter dem
  Kopf; das ist nur eine Restbeobachtung, kein neuer Befund.
- **R15-S3** (Zeile ohne Zusammenhang nach Zurück) *gemessen, hält:*
  Startseite → Schnellerfassung → „In Einsatz übernehmen" → Zurück-Geste: auf
  der Startseite steht keine Zeile „hat Nr. 1 — die Nummer auf dem Zettel
  eintragen" mehr; die zweite Zurück-Geste führt in den Einsatz.
- **R15-D1** (nur die jüngste Quittung) *gemessen:* Zwei Einheiten nacheinander
  abgerückt: „Abgerückt 16:41: Nr. 2 …" mit „Rückgängig" ersetzt die erste
  Quittung; die erste Einheit bleibt über „Wieder anwesend" an ihrer Karte
  zurückholbar. Die Quittung „Zur Kenntnis genommen: 3 Einheiten – Rückgängig"
  stand über 70 s.
- Weiter in Ordnung (gemessen):
  - Zwei Fenster (zweiter Tab) desselben Einsatzes: Einlesen in Fenster A und in
    das nicht neu geladene Fenster B ergibt 2 → 4 → 6 Einheiten, in beiden
    Fenstern, ohne Überschreiben.
  - Doppeltipp auf „Weiter" im Assistenten mit 60, 200 und 500 ms Abstand
    springt nur einen Schritt weit; ab 900 ms zählt der Zweittipp (gewollt).
  - Neuladen 500 ms nach Tippen von Ort und Einheitstyp: „THW Husum
    Bergungsgruppe … Fortsetzen / Verwerfen" und der Satz „Entwurf … wiederhergestellt"
    stehen oben auf der Startseite; im geöffneten Einsatz steht „Dein eigener
    Bogen „…" ist noch offen."
  - „QR-Code im Vollbild" mit Zurück-Geste und Neuladen: Der Bogen steht als
    Entwurf mit „QR-Code gezeigt 16:40 Uhr — Empfang nicht bestätigt." bereit; im
    Vollbild steht „⚠ 9 Plätze ohne Namen — Stärke nach Soll".
  - Auftrag/Notiz im Textfeld getippt, Drehung 360 × 640 → 640 × 360 → zurück,
    dann Neuladen: Der Text steht in der Karte.
  - „Stärke ändern…": Mannschaft 2 → 20 löst „Stimmt die Stärke? … mehr als das
    Dreifache der bisherigen Stärke — stimmt das?" aus (Knöpfe „Ja, so
    übernehmen" und „Zahlen korrigieren"). Entsprechend in der Schnellerfassung
    „Stärke: 73 Mannschaft — stimmt das?".
  - Rückfragen „Einsatz löschen?" (Knopf „In den Papierkorb", „Abbrechen" 85 px
    darunter), „Alle lokalen Daten löschen" (zusätzliches Ankreuzfeld, „Schließen"
    oben erreichbar) und „Geräteschlüssel erzeugen?" nennen die Folge.
  - Die Frage der Startseite „Einheit schnell erfassen — für welche Sammlung?"
    fragt bei offenem eigenen Bogen noch einmal nach („wird … ersetzt, … unter
    „Zuletzt geschlossenen Bogen zurückholen" erreichbar").
  - Der Zugwert in „Zug zuordnen" bietet Vorschläge aus den vorhandenen Zügen an
    (Datenliste); das Ergebnis steht sofort als Marke („2. Zug", „Zug ändern") an
    der Karte.

## Befunde

### R16-S1 [P3] Zahlenfelder markieren beim Antippen den Inhalt nicht; eine getippte Ziffer wird angehängt

**Kennzeichnung:** gemessen (Skripte `mm.js`, `oo.js`, `nn.js`, 360 × 640,
Taps per `touchscreen.tap`).

**Fundstelle / Aufgabe:** (a) „Stärke ändern…" an der Karte (Mehr… → Stärke
ändern…), Felder „Unterführer" und „Mannschaft"; (b) Assistent Schritt 3 →
„Nur Stärke (Meldekopf-Schnellerfassung)", wenn dort die Sollzahlen 0 / 2 / 7 / 9
vorbelegt sind (Einsatz → „Einheit manuell erfassen…", nicht der Weg über die
Startseite).

**Beobachtung:** Beim Antippen des Feldes „Führer" im Dialog „Stärke ändern"
ist der Wert markiert (Auswahl 0 bis 1). In „Unterführer" und „Mannschaft" steht
nur der Textzeiger (Auswahl 1 bis 1 bzw. 0 bis 0 je nach Tippstelle), der Wert
bleibt unmarkiert. Mannschaft 2, Tipp, Ziffer „6" ergibt 26; im Schritt 3 mit
vorbelegter 7 ergibt Tipp und „3" den Wert 37 (gesamt 39) und mit Tipp am
rechten Rand 73 (gesamt 75). In der Schnellerfassung von der Startseite ist das
Feld mit 0 vorbelegt und tritt nicht auf.

**Erwartung der Rolle:** Ich tippe auf die Zahl, tippe die richtige ein, und
die alte ist weg. Die Zahlenfelder verhalten sich im selben Dialog nicht
gleich.

**Folge im Einsatz:** Wer eine vorbelegte oder vorhandene Stärke im Stehen
überschreibt, bekommt eine zweistellige Zahl, die auf den ersten Blick
„irgendwie nach einer Zahl" aussieht. Die Abweichungsprüfung fängt sie fast
immer („mehr als das Dreifache …", „73 Mannschaft — stimmt das?"), kostet aber
einen Rückweg („Zahlen korrigieren"), das Löschen der Ziffer und eine erneute
Eingabe unter Zeitdruck. Eine kleine Verschiebung unter dem Dreifachen (z. B.
von 9 auf 12) liefe ungefragt durch (Risiko, nicht nachgestellt).

**Empfehlung:** Zahlenfelder, deren Inhalt als Vorgabe gedacht ist, beim
Antippen ganz markieren, in allen Feldern eines Dialogs gleich.

**Nachprüfung:** „Stärke ändern…" öffnen, in „Mannschaft" tippen, „6"
eingeben: Das Feld zeigt 6. Gleiches in Schritt 3 bei vorbelegter Sollstärke.

### R16-S2 [P3] „nicht gezählt" in Schritt 3, „zählt in der Summe mit" nach der Rückfrage; Reiter „3 ✓" trotz ungezählter Sollwerte

**Kennzeichnung:** gemessen (Skripte `t.js`, `u.js`, `v.js`, 360 × 640 und
390 × 844).

**Fundstelle / Aufgabe:** Einsatz → „Einheit manuell erfassen…" → Ort,
Einheitstyp „Bergungsgruppe" → Schritt 3 → „Nur Stärke" → Rückfrage „Nur die
Stärke melden?" → „In Einsatz übernehmen".

**Beobachtung:** Die Rückfrage sagt „… die Plätze zählen nicht mehr mit", Schritt 3
nennt die Zahlen „Vorgabe nach Einheitstyp (Sollstärke), nicht gezählt", der
Reiter „3" trägt trotzdem das Häkchen „✓". Tippt man ohne Eingabe „In Einsatz
übernehmen", erscheint „Nur Sollplätze, keine gemeldete Stärke" („Die Lage
zählte sie sonst als gemeldete Stärke"). Wählt man „Als Sollstärke ablegen",
steht danach im Einsatz Gesamt 9, „Einheiten (1 gemeldet · 1 zählend)" und der
Satz „Davon 1 Einheit nur Sollstärke, nicht gemeldet (9 Personen) — zählt in der
Summe mit, bis eine Zahl vorliegt." Das Wort „zählt" steht in den drei Texten für
zwei verschiedene Dinge (Personenkarten vs. Summe der Lage). Der Dialog hat bei
360 × 640 einen inneren Bildlauf (444 von 338 px); der dritte Erklärungspunkt
liegt hinter dem Auslauf des Textes, die vier Knöpfe stehen fest darunter.

**Erwartung der Rolle:** Was als „nicht gezählt" angekündigt wird, steht
nicht in der Summe. Ein Häkchen am Reiter heißt „fertig".

**Folge im Einsatz:** Wer den Hinweis in Schritt 3 gelesen hat und die
Rückfrage schnell mit „Als Sollstärke ablegen" quittiert, rechnet mit 0 und
findet 9 Personen in der großen Gesamtzahl. Die Kleinschrift darunter benennt
das ehrlich; wer nur auf die Zahlen schaut, übersieht sie. Daten gehen nicht
verloren.

**Empfehlung:** Dieselbe Formulierung in allen drei Stellen („Sollwert, nicht
gemeldet — erscheint in der Summe") und den Reiter 3 so lange ohne Häkchen
lassen, bis eine Stärke gezählt wurde. Die Rückfrage auf zwei Wahlmöglichkeiten
kürzen („Stärke eintragen" / „Nur Soll ablegen").

**Nachprüfung:** Die beschriebene Folge in einer Sitzung durchlaufen: Der
Satz zur Sollstärke lautet in Schritt 3, in der Rückfrage und im Einsatz gleich,
der Reiter 3 steht auf „offen".

### R16-S3 [P3] „Zahlen stimmen, so gezählt" liegt 12 px unter der Hauptaktion und lässt sich weder rückgängig machen noch später erkennen

**Kennzeichnung:** Abstand und Wirkung gemessen (Skript `w.js`, 360 × 640 und
390 × 844); die Verwechslung selbst Risiko.

**Fundstelle / Aufgabe:** Dieselbe Rückfrage „Nur Sollplätze, keine gemeldete
Stärke".

**Beobachtung:** Die Knöpfe „Stärke jetzt eintragen" (Hauptaktion), „Zahlen
stimmen, so gezählt" und „Als Sollstärke ablegen" sind je 44 px hoch mit 12 px
Abstand (360 × 640: Oberkanten bei 383, 439 und 495 px; „Abbrechen" bei 563 px).
„Zahlen stimmen, so gezählt" übernimmt die Sollzahlen als gemeldete Stärke
(Karte „Stärke 0 / 2 / 7 / 9", Gesamt 9, „zählend"), ohne Marke „Sollstärke" und
ohne Quittung mit „Rückgängig" (im Einsatz war danach kein Knopf „Rückgängig"
sichtbar). Danach zeigt nichts mehr, dass niemand gezählt hat; zurück geht es
über „Stärke ändern…" und die Historie.

**Erwartung der Rolle:** Eine Handlung, die erfundene Zahlen zu Meldezahlen
macht, ist wie die übrigen Handlungen im Einsatz (Abrücken, Zug, Auftrag,
Kenntnisnahme) mit „Rückgängig" abgesichert.

**Folge im Einsatz:** Ein Tipp 12 px neben die Hauptaktion legt Sollzahlen als
Ist-Stärke fest; die Lage führt 9 Personen, die niemand gezählt hat. Die
Korrektur ist möglich, setzt aber voraus, dass jemand den Fehler bemerkt.

**Empfehlung:** Nach „Zahlen stimmen, so gezählt" eine Quittung mit „Rückgängig"
zeigen (wie bei den übrigen Einsatzhandlungen) und die riskantere der drei
Antworten räumlich von der Hauptaktion trennen.

**Nachprüfung:** „Zahlen stimmen, so gezählt" antippen: Eine Quittung mit
„Rückgängig" erscheint, und die Einheit steht wieder auf „Sollstärke, nicht
gemeldet".

## Nebenbeobachtungen (kein Befund)

- Der Schnellweg von der Startseite ersetzt einen offenen eigenen Bogen (mit
  Rückfrage und „Zuletzt geschlossenen Bogen zurückholen"); „Einheit manuell
  erfassen…" im Einsatz lässt ihn offen. Beides ist sicher, nur uneinheitlich.
- Der Lagemonitor (Zweitfenster) zeigt bei drei eingelesenen Übungsbögen
  „Noch nichts gemeldet" und „Einheiten – Noch keine Einheit gemeldet", obwohl
  darüber „Eingetroffen: …" für drei Einheiten steht. Das ist die Folge der
  Übungsmarkierung der Übungsbögen und gehört in die Rolle Führungssicht, hier
  nicht gewertet.
- Der Scanner (`Bogen scannen…`) ließ sich im Testbrowser ohne Kamera nicht
  öffnen; nicht ausgewertet.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Sollstärke der Schnellerfassung gilt in
  Schritt 3 als „nicht gezählt", steht danach aber in der Gesamtzahl (R16-S2).
- **Größtes Einsatzrisiko:** Ein Tipp neben die Hauptaktion der Rückfrage „Nur
  Sollplätze" macht erfundene Zahlen zur gemeldeten Stärke, ohne „Rückgängig"
  (R16-S3).
- **Top-Priorität für die nächste Iteration:** „Rückgängig" nach „Zahlen
  stimmen, so gezählt" und gleiche Wortwahl zur Sollstärke an allen drei
  Stellen (R16-S2 und R16-S3).
