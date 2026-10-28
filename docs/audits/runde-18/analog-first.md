# Audit „Analog first", Runde 18 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-27 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `ae3a8e9` (`main`).

Zählung: **P0 0 · P1 0 · P2 1 · P3 8** (9 Befunde: 3 neu, 6 alt mit Verweis).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, der Abschnitt „Stand der Behebung" in
`runde-17/README.md` sowie die Tabellen „teilweise/offen/nicht reproduzierbar" in `runde-11` bis `runde-16`. Gemeldet ist
alles, was im Browser noch zu beobachten war (mit Verweis auf die alte Befund-ID); Behebungen, die im Browser nicht mehr zu
beobachten sind, sind nicht gemeldet.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales Playwright-Modul), `isMobile`/`hasTouch`, Locale de-DE,
Telefon 390 × 844 und 360 × 640, jeweils frischer Kontext. Einsatz-Sammlung „Hochwasser Test" mit 2 bis 24 THW-Beispielbögen
aus `examples/thw/` (auf `uebung: false`, Stand 30 bis 240 Minuten alt, Zeitraum heute), eingelesen als JSON-Dateien und als
PNG-Fotos (150 dpi) der Sammel-PDF. Durchgespielt:

- Einsatzansicht: „Stärke ändern…" (Mannschaft 9 → 6), „Abrücken" (auch per Doppeltipp), „Entfernen" mit „Zuletzt entfernte
  Meldungen" und „Zurückholen", „Als Übung kennzeichnen…", Neuladen mit aufgeklappter Karte, Browser-Zurück (auch bei offenem
  Dialog), Tabelle am Telefon mit „Alle Spalten zeigen".
- Dateien: Lageblatt, Sammel-PDF (5 und 24 Bögen, mit Fortschrittsmessung über `requestAnimationFrame`), Einzelbogen, Übersicht-CSV,
  Alle-Daten-CSV, Excel „Oldenburg", Nachtrag-CSV, Blanko-Vordruck, Datensicherung; gelesen mit `pdftotext -layout`, `pdfinfo` und
  durch Entpacken der Excel-Datei.
- Papierweg: Fotos der Sammel-PDF-Seiten eingelesen, „Lage vom Papier abgleichen…" geöffnet; Sammel-PDF und Sicherung als Rückweg;
  falsche Dateien (Lageblatt-PDF, beide CSV, Excel) bei „Einsatz importieren…"; „Einheit schnell erfassen (nur Stärke)…" mit
  Zettelangaben (Nr., Zug, Eintreffzeit, vertauschte Zeiten), leerer Ort.
- Offline: Browserkontext offline, Neuladen, Lageblatt erzeugen.
- Datei mit Zeitraum außerhalb des Bereichs.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; die Nr. aus dem Meldeblock und vom Lageblatt dient als
Schlüssel zwischen Papier, Funk und Gerät; das Lageblatt hängt an der Wand; CSV und Excel gehen an den Stab und werden dort
ohne die App weiterverarbeitet.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle,
Zeitverhalten auf einem echten Telefon. Die Hinweise „Anderer Einsatz?", „Kennzeichen doppelt", „Sitzplätze fehlen", „alle als
männlich" und „Stand vor …" bei den Beispielbögen sind Seed-Artefakte und nicht gewertet; sie verlängern aber Zeilen im
Lageblatt (siehe R18-A9).

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, Dateiinhalt, Messwert); *beobachtet* = gesehen.
Hinweis zum Prüfaufbau: Tipps auf Rückfragen kommen innerhalb von rund 0,45 s (bei „Entfernen" 0,8 s) nach dem Öffnen nicht an
(Prellschutz, gewollt, kein Befund); der Prüfaufbau wartet entsprechend.

## Urteil

Die Papierseite hält. Von den Behebungen aus Runde 17 tragen im Browser: Das Lageblatt nennt bei „Stärke ändern…" jetzt „WC/Dusche
M/W/D" statt „Unterbringung" (R17-A1); der Einzelbogen heißt `eeb-272326okt26_THW_Albstadt_Zugtrupp_Technischer_Zug.pdf` (R17-A2);
der Nachtrag-Vermerk steht in der Kopfzelle und in der Spalte „Nr." der Datei (R17-A3); die Sammel-PDF zeigt „n von 24 Bögen
vorbereitet", „Seiten werden gesetzt" und „Datei wird geschrieben" (R17-A4); beide CSV und die Excel-Datei werden beim Einlesen mit
Hinweis auf Sammel-PDF und Sicherung abgelehnt (R17-A5); ein Zeitraum außerhalb des Bereichs steht als „Zeitraum: Jahr prüfen"
statt „undefined" im Papier (R17-A6); die Startseite führt den Einsatz nur einmal (R17-A7). Die Papier-Rückfallebene
(Blanko-Vordruck mit Meldekopf-Zeile, Lageblatt mit Nachtragstafel, Sammel-PDF, Fotos plus „Lage vom Papier abgleichen…")
trägt, die App läuft offline weiter. Reibung bleibt an neun Stellen, überwiegend dort, wo Papier und Gerät dieselbe Größe
(Nr., Stand, Übergabe) verschieden führen. Die Aufgabe ist ohne fremde Hilfe zu erledigen.

## Prüfung der Behebungen aus Runde 17

| Befund | Ergebnis |
| --- | --- |
| R17-A1 Lageblatt: „Unterbringung" bei Stärkeänderung | hält (gemessen): „WC/Dusche M/W/D: von M 11 / W 1 / D 0 auf M 8 / W1/D0", Block „Bedarf gesamt" stimmt |
| R17-A2 Zufallsname des Einzelbogens | hält (gemessen) |
| R17-A3 Nachtrag-Vermerk am Dateiende | hält (gemessen): Kopfzelle „NACHTRAG seit 28.10.2026, 00:51 — nicht die ganze Lage", Spalte „NACHTRAG" je Zeile |
| R17-A4 Sammel-PDF ohne Fortschritt | hält (gemessen): 24 Bögen, Zähler 0 bis 24 von 24, dann zwei Schritte; erste Schätzung „48 Sekunden", nach 13 Bögen „etwa 5 Sekunden (an den ersten Bögen gemessen)" |
| R17-A5 CSV „keine Datei dieser App" | hält (gemessen) |
| R17-A6 „undefined" im Zeitraum | hält (gemessen) |
| R17-A7 Einsatz zweimal auf der Startseite | hält (beobachtet) |
| Doppeltipp | hält: zweiter Tipp auf „Abrücken" trifft keinen Knopf mehr, ein Abrückvorgang, Quittung „Abgerückt 00:56: Nr. 2 …" mit „Rückgängig"; Rückfragen verschlucken Tipps in den ersten 0,45 bis 0,8 s |
| Neuladen | hält: aufgeklappte Karte und geöffneter Einsatz bleiben (gemessen, `Zuklappen` nach Neuladen sichtbar) |
| Zurück-Geste | hält: von der Einsatzansicht zur Startseite; bei offener Rückfrage schließt Zurück nur die Rückfrage |
| Abstände | hält (gemessen): in der aufgeklappten Karte keine Ziele unter 44 px außer Kästchen (24 px, ganze Zeile antippbar) und „ändern" (44 × 47); kleinster Abstand 6 px („Karten"/„Tabelle") |
| Fußleiste | hält (gemessen): 57 px bei 390 × 844 und 360 × 640 |
| Tabelle am Telefon | hält technisch: keine Seitenüberbreite (Dokument 360 px), Kernspalten ohne Seitenscroll; Inhalt der Kernspalten siehe R18-A8 |
| Papierkorb für entfernte Meldungen | hält (gemessen): Abschnitt „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" nach Neuladen, „Zurückholen" stellt Meldung und Nummer her |
| R14-E7 leerer Bogen | hält: „Ort der Einheit fehlt" lässt keine Übernahme zu |
| R17-H1 Sprung der Startseite | nicht zu beobachten (Layout-Verschiebung 0,0004 bis 0,0008 in 5 s, Knopf „Neuen Bogen erstellen" bleibt auf seiner Position) |

## Befunde

### R18-A1 [P2] „Entfernen" lässt alle späteren Nummern aufrücken; das Papier (Meldeblock, ausgehängtes Lageblatt, Funkverkehr) trägt die alten Nummern

- **Neu oder alt (Verweis):** alt, Warnsatz aus R8-D2 (dort „hält"); die Folge für Gedrucktes ist neu.
- **Ort:** Einsatzansicht → Karte → Mehr… → „Entfernen" → „Meldung entfernen".
- **Beobachtung (gemessen):** Nach dem Entfernen von Nr. 2 heißen die Einheiten 3 bis 5 jetzt 2 bis 4; „Zurückholen" stellt die alten Nummern
  wieder her. Die Rückfrage sagt „Nummern ändern sich: Die Einheiten Nr. 3–5 rücken auf und heißen danach Nr. 2–4." und, nach einem
  Export, „Kopie: Export oder Weitergabe vom 28.10.2026, 01:01." Dass das gedruckte Lageblatt, die CSV und der Meldeblock danach
  andere Nummern tragen als das Gerät, steht nirgends. Die Nr. ist der Schlüssel zwischen Papier und Gerät („Nr. laut Blatt" im
  Papierabgleich, Kopfzeile „Meldekopf: Nr. ____" im Blanko-Vordruck).
- **Erwartung der Rolle:** Eine auf Papier vergebene Nummer bleibt der Einheit, auch wenn eine Meldung entfällt (Lücke).
- **Folge im Einsatz:** Am Funk fällt „Nr. 4" und der Meldeblock meint Freiburg, das Gerät zeigt Haßmersheim. Jedes gedruckte
  Lageblatt und jede bereits übergebene CSV ist nach dem Entfernen falsch beschriftet, ohne dass es auffällt.
- **Empfehlung:** Nummern beim Entfernen stehen lassen (Lücke) oder zumindest in der Rückfrage sagen: „Gedruckte Lageblätter und
  Meldeblock tragen die alten Nummern — Lageblatt neu drucken."
- **Verifikation:** Fünf Einheiten, Lageblatt erzeugen, Nr. 2 entfernen: Nr. 3 bis 5 behalten ihre Nummern, oder der Dialog nennt
  das gedruckte Lageblatt.

### R18-A2 [P3] Nach „Stärke ändern…" steht „Stand 00:36" neben „⚠ Stand vor 2 Std 30 Min" (Karte, Lageblatt, Sammel-PDF)

- **Neu oder alt (Verweis):** neu (verwandt mit R15-D4: dort wird der Stand bei „Als Übung kennzeichnen" gehalten, hier nicht).
- **Ort:** Karte Nr. 3 nach „Stärke ändern…" (9 → 6), Lageblatt Spalte „Stand".
- **Beobachtung (gemessen):** Karte: „Stand 28.10.2026, 00:36 · aus Datei übernommen, am Meldekopf von Hand geändert" und darüber
  „⚠ Stand vor 2 Std 31 Min". Lageblatt: Spalte „Stand" `28.10.2026, 00:36`, darunter „! Stand vor 2 Std 30 Min". Nach „Als
  Übung kennzeichnen…" bleibt der Stand dagegen der des Bogens (27.10.2026, 22:29).
- **Erwartung der Rolle:** Eine Zeit „Stand" und eine Altersangabe, die zusammenpassen; gleiche Regel bei beiden Handänderungen.
- **Folge im Einsatz:** Der Stab liest vom Aushang eine frische Stunde und eine veraltete Warnung für dieselbe Zeile und weiß nicht,
  welche Angaben wann gelten (Stärke 00:36, alles andere 22:06).
- **Empfehlung:** Zwei getrennte Angaben: „Stand der Angaben im Bogen" und „Stärke geändert am Meldekopf 00:36".
- **Verifikation:** Stärke ändern, Lageblatt erzeugen: Stand und „Stand vor …" widersprechen sich nicht.

### R18-A3 [P3] CSV und Excel tragen keinen Vermerk „am Meldekopf von Hand geändert"; die Quelle steht auf „Manuell erfasst"

- **Neu oder alt (Verweis):** neu.
- **Ort:** Übersicht-CSV, Excel „Oldenburg" nach „Stärke ändern…" an Nr. 3 (Quelle der Karte: „aus Datei übernommen").
- **Beobachtung (gemessen):** CSV Spalte „Quelle": „Manuell erfasst" für Nr. 3 (Nr. 1, 2, 4, 5: „Aus Datei"); Spalte „Hinweise" und Excel-Bemerkung
  nennen die Handänderung nicht. Die Sammel-PDF sagt unter „Sonstiges": „Stärke am Meldekopf auf 9 korrigiert (Stand 28.10.2026,
  00:36); die Namensliste führt 12 und ist nicht angepasst."
- **Erwartung der Rolle:** Wer nur die Tabelle bekommt, erfährt dasselbe wie, wer das Papier bekommt.
- **Folge im Einsatz:** Der Stab nimmt „Manuell erfasst, Stärke 9" für eine am Gerät vom Absender eingegebene Zahl; dass eine
  Namensliste mit 12 Personen dahintersteht, sieht er nur in der PDF.
- **Empfehlung:** Quelle „Aus Datei, am Meldekopf geändert" und einen Satz in „Hinweise"/„Bemerkung".
- **Verifikation:** Stärke ändern, CSV und Excel öffnen: Handänderung ist ohne die PDF erkennbar.

### R18-A4 [P3] CSV, Alle-Daten-CSV und Excel bestätigen die Ablage nicht mit Dateiname und Ort

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht → „Übersicht als CSV", „Alle Daten als CSV", „Excel-Liste (Format „Oldenburg")".
- **Beobachtung (gemessen):** Etwa 0,3 s lang „Die Übersicht als CSV wird erzeugt — bitte nicht noch einmal tippen." (Excel entsprechend), danach
  verschwindet der Satz; es folgt keine Quittung. Sichtbar ändert sich nur die Zeile „Übersicht als CSV: zuletzt erzeugt 28.10.2026,
  00:55 · seitdem keine neuen Bögen". Lageblatt („liegt im Download-Ordner bzw. wurde über das Teilen-Menü abgelegt"), Sammel-PDF,
  Blanko-Vordruck und Sicherung („Sicherung „eeb-sicherung-2026-10-28.json" erzeugt — liegt im Download-Ordner") quittieren.
- **Erwartung der Rolle:** Jede Datei, die an den Stab geht, wird mit Namen und Ablageort bestätigt.
- **Folge im Einsatz:** Wer die CSV zum Stab schicken will, weiß am Telefon nicht, ob und wo die Datei liegt; ein zweiter Tipp erzeugt eine
  zweite Lieferung mit neuem Zeitstempel im Namen.
- **Empfehlung:** Dieselbe Quittung wie beim Lageblatt, mit Dateiname.
- **Verifikation:** CSV erzeugen: Quittung mit Dateiname bleibt sichtbar.

### R18-A5 [P3] Tabelle am Telefon zeigt in den Kernspalten das Alter statt der Eintreffzeit; Zeit, Zug und Auftrag liegen hinter „Alle Spalten zeigen" und 1 915 px Seitenscroll

- **Neu oder alt (Verweis):** neu (Layout der Kernspalten aus R17 hält, der Inhalt ist hier gemeint).
- **Ort:** Einsatzansicht → „Tabelle" bei 360 × 640 und 390 × 844.
- **Beobachtung (gemessen):** Kernspalten „Einheit", „Ges.", „Meldung vor" („⚠ Stand vor 1 Std 10 Min"), „Bedarf". „Eingetr.", „Abger.", „Auftrag" und „Zug"
  stehen erst nach „Alle Spalten zeigen", dann ist die Tabelle 1 915 px breit bei 326 px Fläche.
- **Erwartung der Rolle:** Der Meldeblock führt „an um / ab um"; die Tabelle, die den Meldeblock am Gerät ersetzen soll, zeigt
  mindestens die Eintreffzeit.
- **Folge im Einsatz:** Der Abgleich Meldeblock gegen Gerät (wer ist seit wann da) braucht Karte für Karte aufklappen oder
  seitwärts durch 25 Spalten wischen.
- **Empfehlung:** „Eingetroffen" (und „Abgerückt", wenn vorhanden) in die Kernspalten.
- **Verifikation:** Tabelle öffnen: Eintreffzeit je Einheit ohne weitere Bedienung sichtbar.

### R18-A6 [P3] Kein Zustand „Einsatz beendet"; der Sicherungsstand steht nicht in der Einsatzansicht

- **Neu oder alt (Verweis):** alt, R13-W6 (teilweise) und R12-O4 (teilweise).
- **Ort:** Einsatzansicht, Bereich „Einsatz weitergeben / sichern" bis „Einsatz verwalten".
- **Beobachtung (gemessen):** Im Seitentext der Einsatzansicht kommen weder „beendet" noch „Abschluss" noch „Sicherung" vor
  (Suche über den gesamten Text); die Datensicherung liegt nur in der Fußzeile („Datensicherung"). Der Bereich nennt „Weitergabe-Datei erzeugt …
  Empfang nicht bestätigt".
- **Erwartung der Rolle:** Am Einsatzende ein Schritt „Einsatz abschließen": Sammel-PDF, Lageblatt, CSV, Sicherung, mit Haken, was
  geschehen ist.
- **Folge im Einsatz:** Am Ende bleibt es dem Helfer überlassen, an alle Wege zu denken; wer ihn vergisst, hat Papier ohne
  Gerätestand oder Gerätestand ohne Papier.
- **Empfehlung:** Abschlussliste in der Einsatzansicht mit Sicherungsstand („zuletzt gesichert vor …").
- **Verifikation:** Einsatzansicht öffnen: Sicherungsstand und Abschlussweg sichtbar.

### R18-A7 [P3] „Weitergegeben" lässt sich nicht bestätigen; das Papier hat dafür „übertragen [ ]", die App nicht

- **Neu oder alt (Verweis):** alt, R12-W3 (teilweise).
- **Ort:** Einsatzansicht, Zeile unter „Einsatz weitergeben / sichern" und Lageblatt/Sammel-PDF.
- **Beobachtung (gemessen):** „Weitergabe-Datei erzeugt 28.10.2026, 00:54 — Empfang nicht bestätigt, seitdem hier nichts Neues." Es gibt
  keinen Knopf, den Empfang zu vermerken. Lageblatt und Sammel-PDF tragen je Bogen „übertragen [ ] von ______ um ____:____ Uhr".
- **Erwartung der Rolle:** Das Haken-Feld des Papiers hat im Gerät ein Gegenstück („an Stab übergeben um …").
- **Folge im Einsatz:** Nach der Ablösung weiß keiner, ob der Stand, der zuletzt erzeugt wurde, angekommen ist.
- **Empfehlung:** Knopf „Übergabe vermerken" mit Uhrzeit und Empfänger (Freitext), im Nachtrag-Bezug verwendbar.
- **Verifikation:** Nach der Weitergabe vermerken: Einsatzansicht und nächste Datei nennen Zeit und Empfänger.

### R18-A8 [P3] Quittung füllt 13 % der Anzeige und verdeckt die Knöpfe der Karte; nach „Entfernen" landet die Ansicht im Exportbereich

- **Neu oder alt (Verweis):** alt, R11-M3 (teilweise: „Anteil nicht verkleinert").
- **Ort:** Einsatzansicht bei 360 × 640 nach „Entfernen" und nach „Abrücken".
- **Beobachtung (gemessen):** Quittungsleiste 84 px hoch (13 % von 640 px), fest am unteren Rand, der Einheitsname bricht ab
  („Wasserschaden/Pump…"); sie bleibt über 10 s stehen. Nach „Abrücken" überdeckt sie die Knöpfe „Bogen als PDF"/„Wieder
  anwesend" der eben abgerückten Karte. Nach „Entfernen" einer aufgeklappten Karte (Seite 6 850 → 5 872 px lang) steht der
  Bildschirm im Bereich „Einsatz weitergeben / sichern", die Liste liegt 480 px oberhalb.
- **Erwartung der Rolle:** Die Quittung nennt das Betroffene vollständig und ist nach dem Lesen aus dem Weg; der Bildschirm bleibt
  an der Stelle der Handlung.
- **Folge im Einsatz:** Mehr Wischen auf dem kleinen Display; der Helfer sucht die Liste, um zu prüfen, welche Nummer jetzt
  wem gehört (siehe R18-A1).
- **Empfehlung:** Nach „Entfernen" an die Stelle der entfernten Karte scrollen; Quittung kürzer oder nach einigen Sekunden einfahren.
- **Verifikation:** 360 × 640: aufgeklappte Karte entfernen — die Liste bleibt im Bild, die Quittung nennt den Namen vollständig.

### R18-A9 [P3] Lageblatt: Nachtragstafel läuft bei fünf Einheiten über zwei Seiten

- **Neu oder alt (Verweis):** neu (Hinweis: Zeilenlänge durch Seed-Hinweise der Beispielbögen mitbedingt).
- **Ort:** Einsatzansicht → „Lageblatt (A4 quer)" mit 5 Einheiten.
- **Beobachtung (gemessen):** `pdfinfo`: 2 Seiten. Seite 1 endet nach der Tafelüberschrift „Nachtrag von Hand" mit zwei Zeilen, Seite 2 trägt den Rest
  und „Summe einschl. Nachträge (von Hand)". Mit 3 Einheiten: 1 Seite; mit 24 Einheiten: 4 Seiten.
- **Erwartung der Rolle:** Ein Lageblatt für die Wand ist ein Blatt; die Nachtragstafel steht zusammen auf einer Seite.
- **Folge im Einsatz:** Zwei Blätter an die Wand, Tafel und Summenzeile getrennt; Handnachträge landen auf dem falschen Blatt.
- **Empfehlung:** Tafel immer geschlossen auf eine eigene Seite oder Zeilenzahl der Tafel an den Platz anpassen.
- **Verifikation:** Lageblatt mit 5 Einheiten: Tafel und Summenzeile auf derselben Seite.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen einer Einheit | Summen und Bedarf sofort, Hinweise zu Stand und Kennzeichen | Blanko-Vordruck mit Meldekopf-Zeile („Nr., eingegangen am, Zug, abgerückt, ins Gerät übertragen") | Fotos der Codeseiten einlesen; „Lage vom Papier abgleichen…" (Nr., Eintreffzeit, Status, Zug, Auftrag); „Einheit schnell erfassen (nur Stärke)…" mit Zettelzeiten und Nr. |
| Lage an der Wand | Zugsummen, Alter der Meldung, Änderungsspalte | Lageblatt A4 quer mit Tafel „Nachtrag von Hand" und „übertragen [ ]" | Nachtragszeilen über die Schnellerfassung; Stand und Alter widersprechen sich nach Handänderung (R18-A2); Tafel auf zwei Seiten (R18-A9) |
| Einheit entfällt oder wird entfernt | Papierkorb 7 Tage, „Zurückholen" | Strich im Meldeblock | Nummern rücken auf, Papier trägt alte Nummern (R18-A1) |
| Stärke ändert sich | Folgemeldung „12 → 9" | Kästchen „von Hand geändert" | Sammel-PDF vermerkt die Handänderung, CSV und Excel nicht (R18-A3) |
| Geräteausfall am Meldekopf | Sammel-PDF mit Bögen, Zeiten, Historie; Sicherung | Ausgedruckte Sammel-PDF | „Einsatz importieren…" aus der Sammel-PDF (gemessen: Abrückzeiten und Handänderung bleiben) oder Fotos; CSV wird mit richtigem Verweis abgewiesen |
| Übergabe an den Stab | Excel „Oldenburg", CSV, Nachtrag | Lageblatt, Sammel-PDF | CSV/Excel ohne Quittung mit Dateiname (R18-A4); keine Übergabebestätigung (R18-A7) |
| Einsatzende | Alle Exporte, Sicherung | Ausgedruckte Sammel-PDF, Lageblatt | Kein Abschlussweg, Sicherungsstand nicht sichtbar (R18-A6) |

## Würde ich dafür das Papier weglegen?

Nein, und die App verlangt es auch nicht: Blanko-Vordruck, Lageblatt mit Nachtragstafel und Sammel-PDF halten den Ablauf bei
Geräteausfall am Laufen, die App arbeitet offline weiter, und der Rückweg über Fotos, Sammel-PDF und Zettelangaben ist ohne
Chaos möglich. Papier bleibt dort maßgeblich, wo es die Nr. und die Übergabe trägt; die App darf diese Nr. nicht stillschweigend
umnummerieren (R18-A1).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Nr." gilt dem Helfer als die Nummer vom Meldeblock, für das Gerät ist sie eine Listenposition, die beim Entfernen aufrückt.
- **Größtes Einsatzrisiko:** Gedruckte Lageblätter und Funknummern passen nach einem Entfernen nicht mehr zum Gerät (R18-A1).
- **Top-Priorität für die nächste Iteration:** R18-A1: Nummern beim Entfernen stehen lassen oder den Folgen für Gedrucktes eine ausdrückliche Warnung geben.
