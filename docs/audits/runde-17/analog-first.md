# Audit „Analog first", Runde 17 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-27 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `be6b396` (`main`).

Zählung: **P0 0 · P1 0 · P2 1 · P3 6** (7 Befunde: 3 neu, 4 alt mit Verweis).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und die Abschnitte „Stand der
Behebung" in `runde-16/README.md` bis `runde-11/README.md`. Ab dieser Runde gibt es keine „bekannten Grenzen" mehr: Was
dort als „teilweise", „offen" oder „nicht reproduzierbar" steht und im Browser noch zu sehen ist, ist gemeldet, mit
Verweis auf die alte Befund-ID. Behebungen, die im Browser nicht mehr zu beobachten sind, sind nicht gemeldet.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales Playwright-Modul, weil die Projektkopie keinen Browser
findet), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer Kontext. Einsatz-Sammlung
mit 4 bis 24 THW-Übungsbögen aus `examples/thw/` (auf `uebung: false`, Stand 30 bis 210 Minuten alt, Zeitraum heute),
eingelesen als JSON-Dateien und als PNG-Fotos (150 dpi) der Sammel-PDF. Durchgespielt:

- Einsatzansicht: „Stärke ändern…" (Mannschaft 9 → 6), „Abrücken", „Bogen als PDF" (neuer Tab, Download aus dem Tab
  aufgefangen), Lageblatt, Sammel-PDF, Übersicht-CSV, Alle-Daten-CSV, Excel „Oldenburg"; Dateien mit `pdftotext -layout`,
  `pdfinfo` und durch Entpacken der Excel-Datei gelesen.
- Papierweg: Fotos der Sammel-PDF-Seiten eingelesen, „Lage vom Papier abgleichen…" geöffnet, doppelte „Nr." eingetragen,
  „Abgerückt" gewählt; Blanko-Vordruck (Startseite) als PDF gelesen.
- Falsche Dateien in „Einsatz importieren…": Lageblatt-PDF, CSV, Excel, Blanko-PDF; Sammel-PDF als Rückweg.
- „Einheit schnell erfassen (nur Stärke)…" mit Zettelangaben (Eingetroffen 18:00, Abgerückt 18:30, vertauscht und dann
  richtig), „Trotzdem mit Stärke 0 übernehmen"; Nachtrag („Nur neue Bögen seit dem letzten Export") als CSV.
- Offline: Browserkontext offline, Neuladen, Lageblatt erzeugen, Startseite. Datensicherung erstellen. Sammel-PDF mit
  24 Bögen (Dauer und Anzeige).

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; das Lageblatt hängt an der Wand; CSV und Excel gehen an
den Stab und werden dort ohne die App weiterverarbeitet.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle, PDF-Anzeige
in Android-Chrome (Dateiname beim Speichern aus dem Tab), Zeitverhalten auf einem echten Telefon.
Hinweise „Anderer Einsatz?", „Kennzeichen doppelt", „Stand vor …" und „Zeitraum vorbei" bei den Übungsbögen sind
Seed-Artefakte und nicht gewertet.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, Dateiinhalt); *beobachtet* = gesehen.

## Urteil

Die Papierseite hält. Von den Behebungen aus Runde 16 tragen im Browser: Excel und Übersicht-CSV haben jetzt Einsatzname,
Erstellzeit, „*" an der Eintreffzeit und die Fußnote, die Dateinamen eine Datum-Zeit-Gruppe (R16-A1); der Papierabgleich
nennt „auf diesem Gerät, bis du sie übernimmst oder verwirfst, höchstens drei Tage" (R16-A2); der Papierabgleich lehnt
doppelte Nummern ab und übernimmt dann nichts; die Schnellerfassung fragt bei vertauschten Zettelzeiten nach. Die App läuft
offline weiter (Neuladen, Lageblatt, Startseite). Blanko-Vordruck, Lageblatt mit Nachtragstafel und Sammel-PDF
funktionieren als Rückfallebene, falsche Dateien werden mit einem Satz abgelehnt. Reibung bleibt an drei Stellen:
Das Lageblatt behauptet bei geänderter Stärke eine Änderung der Unterbringung, die nie angefordert war (R17-A1). Der
Einzelbogen trägt weiter einen Zufallsnamen (R17-A2). Die Nachtragskennzeichnung steht in der CSV am Dateiende (R17-A3).
Die Aufgabe ist ohne fremde Hilfe zu erledigen.

## Prüfung der Behebungen aus Runde 16

| Befund | Ergebnis |
| --- | --- |
| R16-A1 Excel und CSV ohne Einsatzname, Erstellzeit, Kennzeichnung | hält (gemessen): Zeile „Einsatz „Hochwasser Test" · Erstellt 27.10.2026, 19:13", „19:13 *", Fußnote; Excel hat Einsatzname in der Kopfzeile und Fußnote; Dateinamen `eeb-einsatz-271913okt26_…csv`/`…-oldenburg.xlsx` |
| R16-A2 Widersprüchliche Dauer im Papierabgleich | hält (gemessen): Formular und Karte nennen dieselbe Dauer |
| R16-A3 Einzelbogen mit GUID-Namen | hält nicht, siehe R17-A2 |
| R16-W2 Nachtrag ohne Vermerk in Zeile 1 | teilweise, siehe R17-A3 |
| R16-N2 Einsatz zweimal auf der Startseite | weiter sichtbar, siehe R17-A7 |
| R16-W1, W3 (Quittungsleiste, Schnellerfassung in der Einsatzansicht) | halten: „Einheit schnell erfassen (nur Stärke)…" steht in der Einsatzansicht |
| R16-K1 „Name / Ort ändern…" im Einsatzkopf | hält (Knopf im Kopf); „Ort eintragen…" bei leerem Ort |
| R16-D1 „Einen Moment …" im Prellschutz | hält: „… wird erzeugt — bitte nicht noch einmal tippen" bei CSV, Excel, Sammel-PDF |
| R16-H1 bis H3, G1, G2, M1 bis M3, N1 bis N4, L1 | nicht Gegenstand dieser Rolle, nicht geprüft |

## Befunde

### R17-A1 [P2] Lageblatt und Sammel-PDF melden bei „Stärke ändern…" eine Änderung der „Unterbringung M/W/D", obwohl die Einheit keine Unterbringung angefordert hat

- **Neu oder alt (Verweis):** neu (verwandt mit der Kennzeichnung von Bedarfsfeldern, R12-K4/R14-K4, dort nicht gemeldet).
- **Ort:** Einsatzansicht → Karte „Nr. 2 THW Crailsheim Fachgruppe Wassergefahren (A)" → Mehr… → „Stärke ändern…"
  (Mannschaft 9 → 6) → Lageblatt (A4 quer) und Sammel-PDF, Spalte „Veränderung seit der letzten Meldung".
- **Beobachtung (gemessen):** Die Spalte nennt „Gesamtstärke: von 12 auf 9", „Verpflegung von 12 Personen auf 9 Personen" und
  „Unterbringung M/W/D von M 11 / W 1 / D 0 auf M 8/W1/D0". Dieselbe Seite sagt im Kopf: „Unterbringung angefordert: 1
  Einheit, 11 Personen" (das ist Nr. 1 Biberach); die Zeile von Nr. 2 trägt im Bedarf nur „Ruhezeit · Diesel · Benzin"; die
  CSV führt für Nr. 2 „Unterbringung angefordert M/W/D 0/0/0" und „WC/Dusche 11/1/0". Der Wert „M 11 / W 1" ist also die
  Zahl für WC/Dusche, nicht für Unterbringung. Der Block „Bedarf gesamt" nennt sie korrekt als „WC/Dusche (alle Anwesenden)".
- **Erwartung der Rolle:** Eine Änderungszeile spricht von dem, was die Einheit angefordert hat. Wer keine Unterbringung
  anfordert, hat auch keine Änderung der Unterbringung.
- **Folge im Einsatz:** Der Stab liest vom Aushang, Nr. 2 brauche zuerst für 11, jetzt für 8 Schlafplätze, und plant eine
  Unterkunft ein, die niemand angefordert hat; oder er hält Nr. 2 für widersprüchlich zur Kopfzeile. Das Lageblatt ist das
  Papier, das der Stab ohne die App liest.
- **Empfehlung:** In der Änderungsspalte dasselbe Wort wie im Bedarf verwenden („WC/Dusche") und die Zeile nur dann nennen,
  wenn Unterbringung angefordert ist; im Papier einheitlich „angefordert" und „abgeleitet" trennen.
- **Verifikation:** Einheit ohne angeforderte Unterbringung auf geringere Stärke ändern, Lageblatt erzeugen: die Zeile
  nennt entweder WC/Dusche oder fehlt; Kopfzeile und Änderungsspalte widersprechen sich nicht.

### R17-A2 [P3] Der Einzelbogen („Bogen als PDF") landet unter einem Zufallsnamen im Download-Ordner

- **Neu oder alt (Verweis):** alt, wie R16-A3 (teilweise), weiter offen.
- **Ort:** Karte → „Bogen als PDF".
- **Beobachtung (gemessen):** Der Download aus dem neuen Tab hieß `29af791d-2865-4c42-8804-77c0f59d32be.pdf` und, nach der
  Stärkekorrektur, `7dfb63a7-db9d-4889-9294-48f54484c94d.pdf`. Der Tab zeigt „Fertig — der Bogen liegt im Download-Ordner",
  die Quittung in der App „✓ Bogen als PDF erzeugt (neuer Tab oder Download-Ordner)". Die anderen Dateien heißen
  `eeb-lageblatt-271919okt26_Hochwasser_Test.pdf` und `eeb-einsatz-271920okt26_…pdf`. Die Titelzeile des Tabs ist leer
  (`about:blank`). Der PDF-Titel in den Metadaten (R16-Behebung) hilft dem Dateinamen im Ordner nicht.
- **Erwartung der Rolle:** Einheit und Stand im Namen wie bei den anderen PDFs.
- **Folge im Einsatz:** Zwei Einzelbögen derselben Einheit (vor und nach der Stärkekorrektur) sind im Ordner nur durch
  Öffnen zu unterscheiden; beim Weiterreichen an Drucker oder Ablösung fehlt der Name als Kontrolle.
- **Empfehlung:** Dateinamen mit Einheit und Stand-Gruppe wie bei Sammel-PDF und Lageblatt, auch über den Tab-Weg; den Tab
  mit Titel „Bogen …" versehen.
- **Verifikation:** Zwei Einzelbögen erzeugen, im Download-Ordner an den Namen unterscheiden.

### R17-A3 [P3] Nachtrag-CSV: der Vermerk „NACHTRAG … nicht die ganze Lage" steht am Dateiende, nicht in der ersten Zeile

- **Neu oder alt (Verweis):** alt, wie R16-W2 (teilweise), weiter offen.
- **Ort:** Einsatzansicht → „Nur neue Bögen seit dem letzten Export" → „Übersicht als CSV — Nachtrag (1 Einheit)".
- **Beobachtung (gemessen):** Datei `eeb-einsatz-nachtrag-seit-20261027-1925-271925okt26_Hochwasser_Test.csv`: Zeile 1 ist die
  Kopfzeile, Zeile 2 Nr. 7 (Müllheim), Zeile 3 „Summe Nachtrag — nur neue Einheiten (1)", ganz am Ende „NACHTRAG seit 27.10.2026,
  19:25 — nicht die ganze Lage (1 Einheit in dieser Datei)". Der Dateiname nennt „nachtrag-seit". Die erste Lieferung
  trägt „erste-lieferung" im Namen.
- **Erwartung der Rolle:** Wer die Datei öffnet, sieht oben, dass es nur ein Nachtrag ist.
- **Folge im Einsatz:** Der Stab öffnet die CSV, sieht eine Einheit, eine Summe von 12 Personen und hält sie für die Lage; die
  Warnung steht erst nach dem Blättern, wenn die Datei länger ist. Die Summenzeile heißt „Summe Nachtrag", das mindert
  das Risiko, hebt es nicht auf.
- **Empfehlung:** Den Vermerk in die erste Zeile über der Kopfzeile (oder eine eigene Spalte „Lieferung") setzen.
- **Verifikation:** Nachtrag-CSV öffnen: der Vermerk ist ohne Blättern sichtbar.

### R17-A4 [P3] Sammel-PDF: keine Fortschrittsanzeige; die genannte Dauer ist für das Testgerät siebenfach zu hoch, für ein Telefon nicht prüfbar

- **Neu oder alt (Verweis):** alt, wie R15-O1 (teilweise), weiter offen.
- **Ort:** Einsatzansicht → „Einsatz weitergeben / sichern" bei 24 Bögen.
- **Beobachtung (gemessen):** Sofort steht „Einsatz wird erzeugt…" und „Die Sammel-PDF wird erzeugt — bei 24 Bögen am Telefon
  etwa 36 Sekunden oder länger. Nicht noch einmal tippen, Bildschirm anlassen." Im Testbrowser war die Datei nach 4,8 s
  fertig, der Download nach 6,9 s. Zwischen Start und Ende ändert sich keine Anzeige (kein Zähler, kein Balken).
- **Erwartung der Rolle:** Erkennbar, ob die App arbeitet oder hängt, und wie weit sie ist.
- **Folge im Einsatz:** Bei einer echten Wartezeit von einer halben Minute am Telefon sieht der Helfer eine unveränderte Zeile,
  tippt doch noch einmal oder legt das Gerät weg (Bildschirm sperrt, Erzeugung bricht ab).
- **Empfehlung:** Fortschritt „Bogen 7 von 24" anzeigen; die Zeitangabe an einer Messung des Geräts ausrichten statt an einer
  Pauschale.
- **Verifikation:** Sammlung mit 24 Bögen, Sammel-PDF erzeugen: die Anzeige verändert sich sichtbar bis zum Ende.

### R17-A5 [P3] „Alle Daten als CSV" wird beim Einlesen als „keine Datei dieser App" bezeichnet und verweist nicht auf die Sammel-PDF

- **Neu oder alt (Verweis):** neu.
- **Ort:** Startseite → „Einsatz importieren…" mit `eeb-einsatz-…-alle-daten.csv` bzw. der Übersicht-CSV.
- **Beobachtung (gemessen):** „„eeb-einsatz-271913okt26_Hochwasser_Test.csv" ist eine Tabelle oder Liste, keine Datei dieser
  App. Eingelesen werden die PDF eines Bogens und Dateien, die diese App selbst gespeichert hat. Namen aus einer Liste bitte im
  Schritt „Personal" eintragen." Die Datei hat die App aber selbst erzeugt („Alle Daten als CSV"); der Hinweis auf „Namen aus
  einer Liste" passt nicht zum Fall, dass ein Meldekopf nach Geräteausfall seine eigene Export-Datei zurückholen will. Die
  Ablehnung des Lageblatts nennt dagegen den richtigen Weg („Zum Weiterarbeiten die Sammel-PDF laden").
- **Erwartung der Rolle:** Ein Satz, der sagt: „Die CSV ist für den Stab, nicht zum Weiterarbeiten — dafür die Sammel-PDF
  oder die Sicherung."
- **Folge im Einsatz:** Wer nur die CSV hat (z. B. weil nur sie in der Mail des Stabs angekommen ist), liest „keine Datei dieser
  App" und gibt auf, obwohl die Sammel-PDF oder die Sicherung der richtige Weg wäre; „Personal" führt ihn in den falschen
  Teil der App.
- **Empfehlung:** Für die eigenen Exportdateien (Dateiname `eeb-einsatz-…csv`) einen eigenen Satz wie beim Lageblatt.
- **Verifikation:** Beide CSV-Dateien einlesen: der Satz nennt Sammel-PDF und Sicherung, nicht „Personal".

### R17-A6 [P3] Ungültiger Einsatzzeitraum erscheint als „undefined.07.+011842" in CSV, Lageblatt-Hinweis und Sammel-PDF

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz-Import mit einer JSON-Datei, deren `zeitraumVon`/`zeitraumBis` außerhalb des gültigen Bereichs liegen
  (von mir beim ersten Lauf versehentlich mit Minuten statt Tagen gesetzt); Übersicht-CSV, Spalte „Hinweise", Hinweis auf dem
  Lageblatt und der Übergabe-Übersicht der Sammel-PDF.
- **Beobachtung (gemessen):** „Einsatzzeitraum undefined.07.+011842 – undefined.06.+011847 liegt mehr als ein Jahr entfernt —
  Tippfehler im Jahr?" Die Karte in der App sagt dagegen „Zeitraum: Jahr prüfen".
- **Erwartung der Rolle:** Ein lesbarer Hinweis, im Papier wie in der App gleich.
- **Folge im Einsatz:** Gering; der Stab liest auf dem Aushang „undefined" und hält die Meldung insgesamt für unzuverlässig. Eine
  beschädigte oder von Hand bearbeitete Datei kann das auslösen.
- **Empfehlung:** Ungültige Datumswerte vor der Textbildung abfangen und im Papier dieselbe kurze Fassung wie in der Karte
  verwenden.
- **Verifikation:** Datei mit Zeitraum außerhalb des Bereichs einlesen, Lageblatt erzeugen: kein „undefined" im Ausdruck.

### R17-A7 [P3] Startseite zeigt denselben Einsatz weiter zweimal untereinander

- **Neu oder alt (Verweis):** alt, wie R16-N2, weiter sichtbar (dort als behoben geführt).
- **Ort:** Startseite mit einer Einsatz-Sammlung (390 × 844): unter „Bögen sammeln (Meldekopf)" der große Knopf
  „„Hochwasser Test" öffnen", darunter unter „Einsatz-Sammlung (Meldekopf)" die Karte mit „Öffnen" und „Löschen…".
- **Beobachtung (beobachtet):** Zwei Blöcke, zweimal derselbe Einsatz, zweimal „4 Einheiten anwesend", zweimal die „Letzte
  Meldung"-Zeile; die zweite Überschrift trägt wieder das Wort „Meldekopf". Die Wortwahl ist inzwischen nicht mehr
  verschieden; der Name des Einsatzes steht in der zweiten Karte groß, in der Statuszeile nur „Einsatz".
- **Erwartung der Rolle:** Ein Einsatz, ein Eintrag.
- **Folge im Einsatz:** Wer ein zweites Gerät übernimmt, zögert, ob zwei Einsätze existieren, und liest die Statuszeile
  zweimal; „Löschen…" liegt nur im zweiten Block.
- **Empfehlung:** Den Schnelleinstieg oben und die Liste unten klar benennen („Zuletzt geöffnet" gegenüber „Alle Einsätze")
  oder die Wiederholung bei nur einem Einsatz weglassen.
- **Verifikation:** Eine Sammlung anlegen, Startseite öffnen: der Einsatz erscheint einmal oder die zwei Blöcke sind
  erkennbar verschieden benannt.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen einer Einheit | Summen und Bedarf sofort, Hinweise zu Stand und Kennzeichen | Blanko-Vordruck mit Meldekopf-Zeile („Nr., eingegangen am, Zug, abgerückt, ins Gerät übertragen") | Fotos der Codeseiten einlesen; „Lage vom Papier abgleichen…" (Nr., Eintreffzeit, Status, Zug, Auftrag); doppelte Nr. werden abgelehnt |
| Lage an der Wand | Zugsummen, Alter der Meldung, Änderungsspalte | Lageblatt A4 quer mit Tafel „Nachtrag von Hand" und „übertragen [ ]" | Nachtragszeilen über „Einheit schnell erfassen (nur Stärke)…" mit Zettelzeiten; Änderungsspalte nennt bei Stärkewechsel falsche Unterbringung (R17-A1) |
| Stärke ändert sich | Folgemeldung „12 → 9" | Bogen mit Kästchen „von Hand geändert" und Vermerk der nicht angepassten Namensliste | „Stärke ändern…"; Stern bleibt auf Lageblatt und Sammel-PDF |
| Geräteausfall am Meldekopf | Sammel-PDF mit Bögen, Zeiten, Historie | Ausgedruckte Sammel-PDF | „Einsatz importieren…" aus der Sammel-PDF oder Fotos; CSV wird als „keine Datei dieser App" abgewiesen (R17-A5) |
| Übergabe an den Stab | Excel „Oldenburg", CSV, Nachtrag | Lageblatt, Sammel-PDF | Nur lesbar; Excel und CSV tragen Einsatzname, Erstellzeit und „*"; Nachtrag-Vermerk steht am CSV-Ende (R17-A3) |
| Einzelbogen aufs Klemmbrett | PDF mit Code | Ausdruck | Scan des Codes; Dateiname nicht unterscheidbar (R17-A2) |
| Sammel-PDF für die Ablösung | Alle Bögen in einer Datei | Ausdruck | Wartezeit am Telefon ohne Fortschrittsanzeige (R17-A4) |

## Würde ich dafür das Papier weglegen?

Nein, und die App verlangt es auch nicht: Blanko-Vordruck, Lageblatt mit Nachtragstafel und Sammel-PDF halten den Ablauf bei
Geräteausfall am Laufen, die App arbeitet offline weiter, und der Rückweg über Fotos und „Lage vom Papier abgleichen…" ist
ohne Chaos möglich. Das Lageblatt bleibt für den Stab maßgeblich; es darf dort nichts über Unterbringung behaupten, was die
Einheit nicht angefordert hat (R17-A1).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Änderungsspalte des Lageblatts liest sich wie eine Änderung der angeforderten Unterbringung,
  ist aber die abgeleitete WC/Dusche-Zahl (R17-A1).
- **Größtes Einsatzrisiko:** Der Stab plant nach dem Aushang eine Unterkunft, die nie angefordert wurde (R17-A1).
- **Top-Priorität für die nächste Iteration:** R17-A1: Änderungsspalte und Bedarfsblock im Lageblatt und in der Sammel-PDF
  begrifflich gleichziehen (angefordert gegenüber abgeleitet).
