# Audit „Analog first", Runde 15 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-26 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `a7874f0` (`main` nach Runde 14).

Zählung: **P0 0 · P1 0 · P2 1 · P3 4** (5 Befunde, neu).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, `runde-14/README.md`,
`runde-13/README.md`, `runde-12/README.md` sowie `runde-14/analog-first.md`. Befunde, die dort oder in der Aufgabe als
bekannte Grenze stehen (R14-E7, R14-S2, R14-H1, R14-W3, R13-W1/W6/H1, R12-W3/O2/O4 u. a.), sind nicht erneut gemeldet.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen; die Projektkopie fand keinen Browser, das globale
Playwright-Modul schon), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer
Kontext. Einsatz-Sammlung mit 1, 2, 3 und 6 THW-Übungsbögen aus `examples/thw/` (auf `uebung: false`, Stand auf
„vor 60 bis 210 Minuten" gesetzt), eingelesen über „Bögen einlesen…" als JSON-Dateien und als Fotos (PNG der gedruckten
Seiten, 110 und 150 dpi). Durchgespielt:

- Zug für alle, Abrücken, „Wieder anwesend", Auftrag/Notiz, Eintreffzeit „ändern", „Stärke ändern…" (12 → 9, 12 → 8),
  „Entfernen" (nur Rückfrage), „Lage vom Papier abgleichen…" (Nr., Zug, Status, Notiz je Einheit; mit und ohne Nr.).
- Lageblatt (leer, 3, 5, 6 Einheiten, mit Zwischensummen je Zug), Sammel-PDF, Blanko-Vordruck der Einheit, Übersicht-
  und Vollständig-CSV, Excel-Liste; alle PDFs mit `pdftotext -layout`, `pdfinfo` und `pdftoppm` gelesen.
- Rundlauf Gerät A → Sammel-PDF → Gerät B („Einsatz importieren…"), Import einer älteren Datei über neueren Stand mit
  „In die vorhandene Sammlung übernehmen", Datensicherung erstellen und Vorschau des Einspielens auf leerem Gerät.
- Papierweg mit Fotos: Seiten eines 7-teiligen Bogens (38 Personen) und einer 15-seitigen Sammel-PDF als Bilder
  eingelesen, vollständig, mit fehlendem Blatt, in umgekehrter Reihenfolge.
- Geräteuhr mit `page.clock` um drei Stunden zurückgestellt; Offline-Betrieb mit `setOffline(true)`, Neuladen, dann
  Sammlung anlegen, einlesen, Lageblatt und Sammel-PDF erzeugen (auch das erste PDF des Besuchs).
- Neuer Browserkontext mit übernommenem `localStorage` (Tab zu, Browser neu geöffnet).

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; das zuletzt gedruckte Lageblatt hängt nach einem
Geräteausfall weiter an der Wand; Sammel-PDF und Einzelbögen gehen als Ausdruck an die Ablösung bzw. ins Klemmbrett.

**Nicht prüfbar:** echtes Drucken (Druckrand, Graustufen), Kamera- und Handscanner, Safari, native Builds, echte
Akku- oder Geräteausfälle, Android-Chrome (Verhalten von Blob-PDFs in neuen Tabs). Das Datumsfeld zeigte im
Testbrowser das 12-Stunden-Format; das ist Eigenschaft des Testbrowsers und nicht gewertet. Bei Übungsbögen entstehende
Hinweise („Anderer Einsatz?", „Kennzeichen doppelt") sind Seed-Artefakte und nicht gewertet.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, PDF-Text); *beobachtet* = gesehen;
*Risiko* = abgeleitet.

## Urteil

Die Papierseite trägt und hält die Zusagen aus Runde 14. Gemessen: Der Rundlauf Gerät A → Sammel-PDF → Gerät B bringt
Zug, Auftrag, Abrückzeit, Handzeit (08:00) und die Kennzeichnung „*" unverändert an; der Import einer älteren Datei in eine
neuere Sammlung wird zusammengeführt statt überschrieben („Datei war älter oder gleich: keine Änderung übernommen"). Der
Papierweg über Fotos funktioniert auch bei einem Bogen mit sieben QR-Teilen, in beliebiger Reihenfolge; ein fehlendes
Blatt wird beim Namen genannt („5 von 7 Teilen da … es fehlen die Teile 5, 6 … einfach als weiteres Bild einlesen"). Das
Lageblatt druckt Zwischensummen je Zug, eine leere Sammlung als handschriftliche Tafel mit „____", und offline entstehen
Lageblatt und Sammel-PDF ohne Einschränkung, auch als erstes PDF des Besuchs. „Lage vom Papier abgleichen…" ist der
saubere Rückweg vom Meldeblock und kennzeichnet unbestätigte Zeiten auf dem Blatt („Zeit nicht bestätigt (vom Papier)").

Die Aufgabe „Lage auf Papier bringen, weitergeben, vom Meldeblock nachtragen, auf einem zweiten Gerät fortsetzen" gelingt
ohne fremde Hilfe. Reibung entsteht an einer Stelle, an der eine Korrektur die Kennzeichnung der Papierseite ausschaltet.

## Prüfung der Behebungen aus Runde 14

| Befund | Ergebnis |
| --- | --- |
| R14-A1 „Eingetroffen" bei eingelesenen Bögen | hält für das Lageblatt: „13:39 *" und Fußnote „Eintreffzeit = Zeit des Einlesens am Gerät, nicht vom Absender oder Meldeblock bestätigt"; Quittung nennt es; Handzeit ohne Stern. **Hält nicht** nach „Stärke ändern…" (R15-A1) und nicht auf Seite 1 der Sammel-PDF (R15-A2) |
| R14-A2 nachgehende Geräteuhr | hält. Lageblatt und Sammel-PDF: „! Geräteuhr geht vermutlich nach: 3 Stände liegen nach dem Eintreffen — alle Zeiten dieses Blatts prüfen." und „Stand nach Uhr prüfen" je Zeile |
| R14-A3 Rückruf (D)/(P) | hält. „5556968346 (P) S. Lang", Fußnote „(D) dienstlich, (P) privat" |
| R14-H2/G2/D3 Sammelzuordnung | hält. „Zug „2. Zug" gesetzt: 6 Einheiten" mit „Rückgängig" |
| R14-W1 bis W5 (Papier berührt) | halten. Abgerückt-Block mit „ab"-Zeit, Veränderungsspalte „Gesamtstärke: von 12 auf 9", Zugsummen |

Nicht erneut durchgespielt: die Zettel-Eingabe in der Schnellerfassung (R14-Befunde dort).

## Befunde

### R15-A1 [P2] „Stärke ändern…" (Papiernachtrag) löscht die Kennzeichnung der unbestätigten Eintreffzeit auf Lageblatt und Sammel-PDF

- **Ort:** Einsatzansicht → Karte → „Mehr…" → „Stärke ändern…" → Lageblatt (Spalte „Eingetroffen") und Sammel-PDF
  (Kasten „Stand am Meldekopf" über dem Bogen).
- **Beobachtung (gemessen):** Drei Bögen eingelesen, Lageblatt: alle drei „26.10.2026, 14:06 *". Bei Nr. 2 „Stärke ändern…"
  von 12 auf 9. Lageblatt danach: Nr. 1 und Nr. 3 weiter „14:06 *", Nr. 2 „14:06" ohne Stern, Fußnote zur Zeit des
  Einlesens fehlt für diese Zeile. Im Kasten der Sammel-PDF steht bei Nr. 1 und Nr. 3 „(Zeit des Einlesens, nicht
  geprüft)", bei Nr. 2 nicht. Die Zeit selbst ist unverändert die des Einlesens, niemand hat sie bestätigt. Die Karte
  nennt die Einheit nach der Korrektur „am Meldekopf von Hand erfasst", obwohl sie gescannt wurde. Zur Gegenprobe: Ein
  Auftrag an derselben Einheit („Auftrag/Notiz") lässt den Stern stehen; nur die Stärkekorrektur nimmt ihn weg. Der
  Quelltext bestätigt die Richtung: `zeitEingelesen()` in `src/app/pdf.ts` liefert für Meldungen der Quelle „manuell"
  grundsätzlich `false`.
- **Erwartung der Rolle:** Eine Zeit bleibt „nicht bestätigt", bis jemand sie bestätigt oder von Hand setzt, gleich ob die
  Stärke korrigiert wurde.
- **Folge im Einsatz:** Die Stärkekorrektur vom Zettel („ein Helfer weniger") ist die häufigste Handänderung am Meldekopf.
  Genau die Einheit, an der jemand gerade gearbeitet hat, sieht auf dem Aushang bestätigter aus als ihre Nachbarn. Wer das
  Blatt liest (Zugführer, Ablösung), hält 14:06 für eine geprüfte Ankunft; Entscheidungen zu Ruhezeit und Ablösung hängen an
  der Eintreffzeit.
- **Empfehlung:** Die Kennzeichnung hängt an der Eintreffzeit, nicht an der Quelle der letzten Fassung: Stern und Kasten-
  Hinweis bleiben, solange die Zeit nicht von Hand gesetzt oder bestätigt wurde. Die Quellenangabe der Karte soll bei einer
  Stärkekorrektur „aus Datei, Stärke von Hand korrigiert" lauten.
- **Verifikation:** Drei Bögen einlesen, bei einer Einheit Stärke ändern, Lageblatt und Sammel-PDF erzeugen: alle drei
  Zeilen und alle drei Kästen tragen die Kennzeichnung; danach bei einer Einheit die Eintreffzeit „ändern": nur diese ohne.

### R15-A2 [P3] Seite 1 der Sammel-PDF druckt die gestempelte Eintreffzeit ohne Kennzeichnung

- **Ort:** Sammel-PDF („Einsatz weitergeben / sichern"), Seite „Übergabe-Übersicht", Spalte „Eingetroffen (abgerückt)".
- **Beobachtung (gemessen):** Fünf eingelesene Einheiten stehen mit „26.10.2026, 13:41", ohne „*" und ohne Fußnote; dasselbe
  Blatt als Lageblatt trägt den Stern und die Erklärung. Die Fußzeile jeder Seite verweist auf „Eintreff-/Abrückzeiten: Seite 1 und
  Kasten über jedem Bogen"; erst der Kasten über dem Bogen sagt „(Zeit des Einlesens, nicht geprüft)".
- **Erwartung der Rolle:** Die Übersichtsseite, die die Ablösung zuerst liest, kennzeichnet die Zeit wie das Lageblatt.
- **Folge im Einsatz:** Wer nur Seite 1 liest (und das ist der Zweck einer Übersicht), nimmt die Zeit des Einlesens für eine
  Ankunftszeit. Der Hinweis steht erst 2 bis 90 Seiten weiter hinten.
- **Empfehlung:** Dieselbe Markierung und Fußnote wie im Lageblatt auf der Übersichtsseite.
- **Verifikation:** Sammel-PDF mit eingelesenen Bögen erzeugen: Seite 1 trägt Stern und Fußnote für diese Zeilen.

### R15-A3 [P3] Nach „Stärke ändern…" druckt der Einzelbogen die neue Stärke zu den alten Namen, ohne „von Hand geändert"

- **Ort:** Sammel-PDF und „Bogen als PDF" nach „Stärke ändern…"; Kästchen „von Hand geändert" unter der Stärke.
- **Beobachtung (gemessen):** Nr. 2 von 12 auf 9 korrigiert. Der gedruckte Bogen zeigt „Stärke 0 / 3 / 6 / 9", „Verpflegung für 9
  Personen" und „M8/W1/D0", führt aber weiter zwölf Namen (3 UF, 9 M); das Kästchen „von Hand geändert" ist leer. Die Karte
  sagt „Namen, Fahrzeuge, Bedarf übernommen", das Lageblatt nennt die Änderung in der Veränderungsspalte; der Bogen selbst
  nicht.
- **Erwartung der Rolle:** Der Vordruck hat ein Kästchen für genau diesen Fall; es soll angekreuzt sein, oder ein Satz
  „Stärke am Meldekopf korrigiert, Namensliste nicht angepasst" steht auf dem Bogen.
- **Folge im Einsatz:** Wer den Bogen abheftet oder ans Klemmbrett nimmt, sieht neun und zählt zwölf Namen; wer von den
  zwölf fehlt, steht nirgends. Beim Papierabgleich nach einem Geräteausfall ist das ein vermeidbarer Zählstreit.
- **Empfehlung:** Bei korrigierter Stärke das Kästchen „von Hand geändert" im Ausdruck ankreuzen und die Korrektur
  (alt → neu, Uhrzeit) in der Zeile „Sonstiges" nennen.
- **Verifikation:** Stärke ändern, „Bogen als PDF": Kästchen angekreuzt, Korrekturvermerk sichtbar.

### R15-A4 [P3] Angefangener Papierabgleich überlebt nur das Browserfenster

- **Ort:** „Lage vom Papier abgleichen…" (6 Felder je Einheit).
- **Beobachtung (gemessen):** Zwei Einheiten ausgefüllt (Nr., Eintreffzeit, Zug, Auftrag), Seite neu geladen: Eingaben
  stehen noch da, Karte „Angefangene Eingaben für 2 Einheiten sind noch da (nur in diesem Browserfenster, bis du … den Tab
  schließt)". Neuer Browserkontext mit übernommenem `localStorage` (Tab geschlossen, Browser neu gestartet): Hinweis und Eingaben
  weg, die Karte beginnt bei 0. Die Ablage ist `sessionStorage` (`papier-abgleich-entwurf.ts`). Der Hinweis ist ehrlich.
- **Erwartung der Rolle:** Wer vom Meldeblock 20 Zeilen abtippt, kann bei leerem Akku oder wegen eines vom Betriebssystem
  beendeten Browsers dort weitermachen, wo er war.
- **Folge im Einsatz:** Kein Datenverlust (der Meldeblock bleibt), aber die Nacherfassung beginnt von vorn; das ist genau
  die Doppelarbeit, die der Abgleich sparen soll. Abgeleitet: Auf Telefonen räumt der Browser Hintergrund-Tabs ab.
- **Empfehlung:** Zwischenstand in den dauerhaften Speicher legen (er enthält nur Nr., Zeit, Zug, Notiz) oder beim ersten
  Eintrag sagen, dass „Später" nur bis zum Schließen des Fensters gilt; zeilenweise „übernehmen" wäre die Alternative.
- **Verifikation:** Zwei Zeilen eintragen, Browser schließen, neu öffnen: Eingaben sind wieder da oder die Karte sagt vorher,
  dass sie verfallen.

### R15-A5 [P3] „Bogen als PDF" bestätigt nichts in der App; der geöffnete Tab bleibt bei „Bogen wird erzeugt…"

- **Ort:** Karte → „Bogen als PDF" (Einzelbogen fürs Klemmbrett).
- **Beobachtung (beobachtet, Testbrowser ohne PDF-Anzeige):** Die Schaltfläche öffnet einen neuen Tab mit dem Text „Bogen wird
  erzeugt…"; nach rund 2 s ist die PDF als Download abgelegt (bei 38 Personen, 7 Seiten, 261 KB), der Tab zeigt auch nach 15 s
  weiter „Bogen wird erzeugt…". In der App erscheint, anders als bei Lageblatt, Sammel-PDF und Datensicherung, keine
  Quittung („PDF gespeichert: …"). Ob Android-Chrome das ebenso behandelt, war nicht prüfbar (Risiko).
- **Erwartung der Rolle:** Eine Quittung wie bei den anderen PDFs; der Tab schließt sich oder sagt „Fertig, liegt im
  Download-Ordner".
- **Folge im Einsatz:** Bei Handschuhen und Zeitdruck bleibt offen, ob der Ausdruck entstanden ist; der Helfer tippt erneut
  oder wartet auf ein Fenster, das nichts mehr tut.
- **Empfehlung:** Quittung in der Einsatzansicht und ein Schlusssatz im Tab, falls kein PDF-Betrachter vorhanden ist.
- **Verifikation:** In einem Browser ohne PDF-Anzeige „Bogen als PDF" tippen: Quittung in der App, Tab ohne Dauertext.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen einer Einheit | Stärke und Bedarf stehen sofort in der Summe | Blatt der Einheit mit Meldekopf-Kästchen („Nr., eingegangen, übertragen") | Fotos der QR-Seiten oder Scan; „Lage vom Papier abgleichen…" trägt Nr., Zeit, Zug, Status vom Meldeblock ein; Zeit bleibt „nicht bestätigt", bis sie eingetragen ist |
| Lage an der Wand | Zugsummen, Alter der Meldung, Änderungsspalte | Lageblatt A4 quer mit Nachtragstafel „von Hand", leere Tafel auch ohne Einheiten | Nachtragszeilen über „Einheit manuell erfassen…" bzw. Zettel-Eingabe mit „ab"-Zeit |
| Geräteausfall am Meldekopf | Sammel-PDF trägt alle Meldungen, Zeiten, Historie | Ausgedruckte Sammel-PDF, Einzelbögen mit QR | „Einsatz importieren…" aus der PDF-Datei; Zusammenführen mit älterem Stand prüft jede Einheit einzeln |
| Stärke ändert sich | Folgemeldung mit „12 → 9" | Handschriftliche Korrektur auf dem Bogen, Kästchen „von Hand geändert" | „Stärke ändern…" (siehe R15-A1 und R15-A3: Kennzeichnung auf Papier unvollständig) |
| Weitergabe an Ablösung | Sammel-PDF, CSV, Excel | Lageblatt und Ausdruck | Import der Sammel-PDF; CSV nur lesbar (Spalte „Empfangen" erlaubt den Vergleich mit „Eingetroffen") |
| Einzelbogen fürs Klemmbrett | PDF mit QR | Ausdruck | Scan des QR (Hinweis zu R15-A5) |

## Würde ich dafür das Papier weglegen?

Nein, und die App verlangt es auch nicht: Lageblatt, Sammel-PDF, Blanko-Vordruck und die handschriftliche Nachtragstafel
halten den Ablauf bei Geräteausfall am Laufen, und der Rückweg über Fotos und „Lage vom Papier abgleichen…" ist ohne Chaos
möglich. Weglegen würde ich es erst, wenn Lageblatt und Sammel-PDF überall dieselbe Auskunft zur Verlässlichkeit der Zeiten
geben (R15-A1, R15-A2); bis dahin bleibt der Meldeblock die maßgebliche Quelle für „an" und „ab".

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Stärke ändern…" wirkt wie eine reine Zahlenkorrektur, schaltet aber auf dem Papier die
  Warnung zur Eintreffzeit der Einheit ab.
- **Größtes Einsatzrisiko:** Ein Aushang, der eine Zeit des Einlesens als geprüfte Ankunft ausgibt, sobald an der Einheit
  die Stärke korrigiert wurde (R15-A1).
- **Top-Priorität für die nächste Iteration:** R15-A1: Kennzeichnung der Eintreffzeit nicht an die Quelle der letzten
  Fassung binden; danach R15-A2 (gleiche Fußnote auf Seite 1 der Sammel-PDF).
