# Audit „Stress und Unterbrechung“, Runde 13 (Zeitdruck, Ablenkung, Wiedereinstieg)

**Prüfer:** Rollenaudit `thw-stress-test-user` · **Datum:** 2026-10-26 ·
**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 3 (insgesamt 3 neue Befunde)

Prüfgegenstand: Web-App, laufender Produktionsbuild unter
`http://localhost:4173` (`vite preview`), Code-Stand Commit `7637e61`
(`main` nach Runde 12). Reiner Prüfbericht, keine Codeänderung; es wurde kein
Prozess beendet.

## Prüfaufbau

Playwright (global, `/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, `isMobile`/`hasTouch`, Locale de-DE,
Viewports 360 × 640 und 390 × 844 (je eigener Browser-Kontext). Tipps mit
`tap`/`touchscreen.tap`, Unterbrechung mit `reload()`, Zurück-Geste mit
`goBack()`, zweiter Tab im selben Kontext, `setOffline(true)`. Zustände über die
Oberfläche („Neue Einsatz-Sammlung…“, „Bögen einlesen…“ mit Übungsbögen aus
`examples/thw/`, „Einheit manuell erfassen…“, Schnellerfassung). Skripte im
Scratchpad unter `.../scratchpad/r13/`.

Vorher gelesen: `docs/audits/README.md`, `docs/audits/runde-12/README.md`,
`docs/audits/runde-11/README.md`. Die dort genannten bekannten Grenzen (R6-O9,
R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4; leere
Karten bei „Nur Stärke“, Rückgängig für Meldungen nach dem Neuladen,
Zeilenhöhe bei 180 × 320; R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1,
R11-M3; R12-W3, R12-H3, R12-O2, R12-O4, R12-G3) wurden nicht neu gemeldet.
Die gewollten Tipp-Sperren (Weiter 0,9 s, Rückfragen kurz nach dem Öffnen)
sind bekannt und kein Befund.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert; *Risiko* =
abgeleitet, nicht nachgestellt.

**Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur
(damit auch das Verhalten der Zurück-Taste bei offener Tastatur), WebKit,
native Builds, Zwei-Geräte-Abgleich, 180 × 320, Tablet. Die Tipp-Sperre bei
Ausgaben (R12-G2) ließ sich mit den Übungs-Übungsbögen nicht nachstellen
(kein Download ausgelöst) und ist daher nicht bestätigt.

## Urteil

Die Kernaufgaben gelingen unter Stress und Unterbrechung ohne fremde Hilfe,
und die Behebungen aus Runde 12 halten, soweit geprüft (gemessen):

- **R12-S1** (Einsatz löschen mit angefangener Aufnahme): Die Rückfrage nennt
  „Die angefangene Erfassung einer fremden Einheit …“; nach „In den Papierkorb“
  bleibt die Startseite stehen, der Entwurf steht als Karte „Angefangene
  Erfassung einer fremden Einheit“ mit „Fortsetzen“/„Verwerfen“ (44 px, 12 px
  Abstand) und einem erklärenden Satz. Kein Sprung ins Formular, keine Meldung
  über ein „anderes Fenster“.
- **R12-S2** („Einheitstyp fehlt“): Bei 360 und 390 px nennt die Übersicht
  „⚠ 3 offene Punkte“, darunter „Einheitstyp fehlt — ohne Typ fehlen
  taktisches Zeichen und Soll-Vergleich.“
- Weiter in Ordnung: Neuladen mitten in der Aufnahme (Ort bleibt; „Fortsetzen“
  öffnet Schritt 4 bzw. in der Schnellerfassung Schritt 3 mit Stärke); „Neuen
  Bogen erstellen“ bei vorhandenem Entwurf fragt „Neuen Bogen anfangen?“;
  „Verwerfen“ fragt nach; Erfassung in Einsatz B bei angefangener Erfassung
  für Einsatz A fragt „Diese Erfassung fortsetzen / Verwerfen und neue Einheit
  erfassen“; Doppeltipp auf „In Einsatz übernehmen“ ergibt eine Meldung
  („Zuletzt abgelegt: THW Kiel · 1 Einheit, Gesamt 9“); Abrücken in zwei Tabs
  gleichzeitig: beide Abrückungen bleiben erhalten; die Quittung „Abgerückt
  hh:mm“ mit „Rückgängig“ bleibt über mindestens 2 Minuten stehen; eine
  gemischte Auswahl aus gültiger Datei, falscher JSON- und Textdatei nimmt den
  Bogen auf und nennt die beiden Dateien beim Namen; dieselbe Datei zweimal
  ergibt „0 Bögen aufgenommen, 1 bereits vorhanden“; Neuladen und
  Offline-Neuladen behalten Entwurf und Tabellenansicht; kein horizontaler
  Überlauf bei 360 und 390 px (Start, Einsatz, offene Karte, Tabelle).

Reibung bleibt an drei Stellen, jeweils ohne Datenverlust im Kern: eine
veraltete Meldung nach „Rückgängig“ (R13-S1), die Schnellerfassung ohne Einsatz
mit „Bogen übergeben…“ an erster Stelle (R13-S2) und ungespeicherter Text in den
Inline-Feldern „Zug“ und „Auftrag/Notiz“ bei Browser-Zurück ohne Fokuswechsel
(R13-S3).

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Nach „Rückgängig“ steht weiter der Satz, der
  Einsatz liege im Papierkorb (R13-S1).
- **Größtes Einsatzrisiko:** Eine am Meldekopf aufgenommene fremde Einheit
  (Schnellerfassung ohne Sammlung) endet in einer Übersicht, deren erster Knopf
  sie mit dem Siegel des eigenen Geräts weitergibt (R13-S2, P3, Risiko).
- **Top-Priorität für die nächste Iteration:** Stehende Meldungen beim
  Rückgängig-machen mit zurücknehmen (R13-S1).

## Befunde

### R13-S1 [P3] Nach „Rückgängig“ beim Einsatz-Löschen bleibt die Meldung „in den Papierkorb gelegt … zurückholen“ stehen

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `c1.js`, `c3.js`, 360 × 640).

**Fundstelle / Aufgabe:** Einsatz mit angefangener Erfassung („Einheit manuell
erfassen…“, Ort „Wilhelmshaven“, „‹ Einsatz“) → „Einsatz löschen…“ → „In den
Papierkorb“ → auf der Startseite „Rückgängig“ (Quittung „In den Papierkorb
gelegt (30 Tage rückholbar): Einsatz „…““).

**Beobachtung:** Nach „Rückgängig“ verschwindet die Quittung, der Einsatz
steht wieder in der Liste „„Hochwasser Test“ öffnen · 4 Einheiten“, und der
Entwurf-Kasten heißt jetzt „Angefangene Erfassung für „Hochwasser Test““. Die
Statuszeile darüber bleibt aber unverändert: „Einsatz „Hochwasser Test“ in den
Papierkorb gelegt. Die angefangene Erfassung einer fremden Einheit „THW
Wilhelmshaven“ bleibt als Entwurf — oben auf der Startseite „Fortsetzen“ oder
„Verwerfen“; zum Ablegen vorher den Einsatz unter „Papierkorb Einsätze“
zurückholen.“

**Erwartung der Rolle:** Habe ich „Rückgängig“ getippt, ist der Satz weg oder
sagt, dass der Einsatz wieder da ist. Eine Anweisung, die ich schon ausgeführt
habe, soll nicht weiter oben stehen.

**Folge im Einsatz:** Der Helfer ist nach der Unterbrechung unsicher, ob der
Einsatz wirklich zurück ist, sucht unter „Papierkorb Einsätze“ (dort ist er
nicht mehr) und liest zwei widersprüchliche Angaben nebeneinander („fremde
Einheit“ im Satz, „für „Hochwasser Test““ im Kasten). Daten gehen nicht
verloren.

**Empfehlung:** Mit „Rückgängig“ auch die zugehörige Statuszeile zurücknehmen
oder durch „Einsatz „…“ ist wieder da; die angefangene Erfassung gehört wieder
dazu.“ ersetzen.

**Nachprüfung:** Einsatz mit angefangener Erfassung löschen, „Rückgängig“
tippen: Es steht kein Satz mehr, der den Einsatz im Papierkorb nennt.

### R13-S2 [P3] Schnellerfassung ohne Einsatz: Übersicht bietet „Bogen übergeben…“ an erster Stelle, „In Einsatz-Sammlung ablegen…“ an zweiter

**Priorität:** P3

**Kennzeichnung:** Anordnung gemessen (Skripte `l3.js`, `n1.js`, 360 × 640);
die Verwechslung ist Risiko. Das THW-Verfahren am Meldekopf ist Annahme.

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur
Stärke)…“ (steht unter „Bögen sammeln (Meldekopf)“) → Ort „Kiel“ → Schritt 3
„Nur Stärke“ 1 / 2 / 6 → „Weiter“ bis zur Übersicht.

**Beobachtung:** Die Gesamtübersicht (Marke „Schnellerfassung“) zeigt vier
Knöpfe untereinander: „Bogen übergeben…“ (y 224), „In Einsatz-Sammlung
ablegen…“ (y 280), „Als Vorlage speichern“, „Bogen schließen“, je 44 px,
12 px Abstand. „Bogen übergeben…“ öffnet „QR-Code im Vollbild zeigen“ und „PDF
erzeugen“, ohne darauf hinzuweisen, dass es eine Meldung für eine fremde
Einheit ist und mit dem Siegel dieses Geräts übergeben würde. „In Einsatz-
Sammlung ablegen…“ funktioniert (ohne Sammlung: „Noch keine Sammlung
vorhanden — der Bogen ist die erste Meldung darin.“ mit „Neue Sammlung
anlegen…“). Im Einsatz selbst (Aufnahme für: …) ist der Weg eindeutig; nur
dieser Einstieg von der Startseite endet in der Übersicht des eigenen Bogens.

**Erwartung der Rolle:** Wer „Meldekopf“ gewählt und nur die Stärke
aufgenommen hat, erwartet als nächsten Schritt „In Einsatz ablegen“, nicht die
Weitergabe.

**Folge im Einsatz:** Unter Zeitdruck greift der Helfer zum obersten Knopf. Er
erzeugt QR oder PDF einer fremden Einheit mit dem Siegel des eigenen Geräts;
die Gegenstelle liest sie als Meldung des eigenen Verbands. Verloren geht
nichts; die Gefahr ist die falsche Zuordnung.

**Empfehlung:** In der Schnellerfassung „In Einsatz-Sammlung ablegen…“ als
ersten, hervorgehobenen Knopf zeigen und „Bogen übergeben…“ nach unten
nehmen oder mit einem Satz („Das ist die Meldung einer fremden Einheit“)
versehen.

**Nachprüfung:** Schnellerfassung von der Startseite bis zur Übersicht: Der
erste Knopf legt in die Sammlung ab; „Bogen übergeben…“ nennt die fremde
Einheit oder steht nicht an erster Stelle.

### R13-S3 [P3] „Zug“ und „Auftrag/Notiz“ an der Einheitenkarte: Browser-Zurück ohne Fokuswechsel verwirft den getippten Text

**Priorität:** P3

**Kennzeichnung:** gemessen im Testbrowser (Skripte `v3.js`, `v6.js`,
360 × 640, `goBack()` ohne Fokuswechsel); auf einem echten Telefon mit
Bildschirmtastatur *nicht prüfbar* (dort schließt die erste Zurück-Geste
meist zuerst die Tastatur und löst damit den Fokuswechsel aus). Daher Risiko
für das Gerät.

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Auftrag/Notiz“
(oder „Zug zuordnen“) → Text tippen, ohne „Speichern“ → Zurück.

**Beobachtung:** Neuladen (`reload`), Tab-Wechsel und Schließen der Seite
behalten den Text (Gegenprobe: danach steht er in der Karte). Ein
Fokuswechsel (Tipp neben das Feld) vor dem Zurück behält ihn ebenfalls. Nur
„Zurück“ ohne vorherigen Fokuswechsel führt auf die Startseite, und der Text
steht nach erneutem Öffnen des Einsatzes nicht in der Karte. Eine Meldung
darüber erscheint nicht.

**Erwartung der Rolle:** Was ich getippt habe, ist da, wenn ich
zurückkomme — wie bei Neuladen und Tab-Wechsel.

**Folge im Einsatz:** Ein Auftrag („Pumpen Keller Nord, Abschnitt 2“), der
unter Zeitdruck getippt wurde, fehlt nach einem Fehlgriff auf Zurück; der
Helfer vermutet, er habe nicht gespeichert, und tippt ihn nochmals oder
vergisst ihn.

**Empfehlung:** Auch beim Verlassen der Ansicht (Zurück, Startseite,
Einsatzwechsel) den Text der geöffneten Inline-Felder sichern, wie es beim
Neuladen schon geschieht.

**Nachprüfung:** Auftrag tippen, ohne Fokuswechsel Zurück, Einsatz erneut
öffnen: Der Auftrag steht in der Karte. Gleiches für „Zug“. Auf einem echten
Telefon mit offener Tastatur wiederholen.
