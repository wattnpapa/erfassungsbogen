# Audit „Analog first“, Schwerpunkt Beispielbögen, Runde 2 (Papier als Übungsunterlage)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-11-09 · Prüfgegenstand: Bereich „Beispielbögen“ der
Live-Seite https://erfassungsbogen.app/ (Stand `main`, Commit `085a93b`; Fußzeile „v2026.1109.833“): Dialog
„Beispielbögen“ mit Knöpfen Anzeigen/PDF/Link und dem neuen Sammelweg „Alle … in eine Übungs-Sammlung“, die daraus
erzeugten Einzel-PDFs, Sammel-PDF und Lageblatt der Übungs-Sammlung, der Rückweg über „Bögen einlesen…“ und „Lage vom
Papier abgleichen…“, verglichen mit dem Blanko-Vordruck im neuen Raster der THWin-Papiervorlage (Commit „Bogen-PDF im
Raster der THWin-Papiervorlage“).

Zählung: **P0 0 · P1 0 · P2 1 · P3 4 · Hinweise 3** (5 neue Befunde BB2-A1 bis BB2-A5). Nachprüfung Runde 1: 8 Befunde,
davon **2 behoben, 6 teilweise, 0 offen**.

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/beispielboegen/analog-first.md` (Runde 1) und
`docs/audits/beispielboegen/README.md` mit „Stand der Behebung“. Code nur zum Nachschlagen: `src/app/beispiele-dialog.tsx`
(`beispielHolen`, `beispielPdf`, `alleAlsUebung`), `src/app/pdf-dokument.ts` (Kopfzeile, Fußzeile „ÜBUNG ·“,
`blankoMeldekopf`, `UEBUNG_DECKKRAFT`), `src/app/papier-abgleich-ui.tsx`, dazu die Hinweise im Generator
`scripts/praktische-ausbildung-beispielboegen.mts`. Aufbau, Typen (Daten/Verlust, Bedienung, Layout/Abstand, Text,
Kontrast) und Zählweise wie in Runde 1. Geschmacksfragen stehen als „Hinweis“ ohne Priorität.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()`), Locale de-DE, `deviceScaleFactor` 1, Viewports 390 × 844
(`isMobile`/`hasTouch`) und 1280 × 900. Keine Skripteinschleusung, kein DOM-Eingriff; je Szenario ein frischer Kontext,
für Folgeschritte mit gespeichertem Speicherstand. Skripte, Bildschirmfotos, PDFs und Seitenbilder unter
`/tmp/claude-0/r2-analog/`.

- **PDF-Download** (`page.waitForEvent('download')`) von elf Beispielbögen: alle fünf aus „Praktische Ausbildung / JUH RV
  Malter“, JUH Akkonia Zugtrupp, Hannover „2. Einsatzzug – Zugtrupp“ (nur Stärke), Hannover SEG Wunstorf (Karte 23 am
  Telefon), THW Albstadt ZTr TZ und THW Weinsberg FGr Öl (C) über die Suche; dazu der Blanko-Vordruck von der Startseite.
  Dateiname, Quittung und Dauer je Download notiert.
- Gelesen mit `pdfinfo`, `pdftotext -layout` und `-bbox-layout`; Seiten mit `pdftoppm` gerastert (70/100/150 dpi Farbe,
  300 dpi Graustufen, Ausschnitte der Kopfzeile mit 200 dpi). Graustufen-Histogramm für das Wasserzeichen, Rand- und
  Kastenhöhen am 300-dpi-Bild gemessen, QR-Codes mit `zxing-cpp` aus den Rasterbildern dekodiert.
- **Sammelweg:** „Beispielbögen ansehen → Praktische Ausbildung → JUH RV Malter → Alle 5 in eine Übungs-Sammlung“; danach
  „Einsatz weitergeben / sichern“ (Sammel-PDF) und „Lageblatt (A4 quer)“. Ebenso „OV Albstadt“ (3 Bögen) unter THW mit
  Lageblatt; Verfügbarkeit des Knopfs auf den Ebenen THW, Alle Ortsverbände, Landesverband, Regionalstelle.
- **Rückweg:** In die Malter-Übungs-Sammlung über „Bögen einlesen… → Dateien wählen…“ die Einzel-PDFs Akkonia Zugtrupp
  und Malter 1. Betreuungstrupp sowie die zwei Seitenbilder (150 dpi) von Albstadt eingelesen; „Lage vom Papier
  abgleichen…“ geöffnet und mit Seite 1 der Einzel-PDF verglichen.
- **Zeitversatz:** Den QR-Inhalt der heute erzeugten Albstadt-PDF in einem Kontext mit Zeitzone Europe/Berlin und
  Playwright-Uhr auf 16.11.2026, 19:00 geöffnet (Ausbilder druckt eine Woche vor dem Ausbildungsdienst).
- **Offline:** 390 × 844, Seite geladen, Netz getrennt, neu geladen; PDF aus Malter, Sammelweg und Sammel-PDF.

**Annahmen:** wie in Runde 1. Ein Ausbilder bereitet eine Meldekopf- oder Stärkemeldungs-Übung vor, druckt ausgefüllte
Bögen, Teilnehmer bearbeiten sie ohne Gerät (Nr., Eingang, Änderungen von Hand), danach gehen die Blätter per QR oder
Abgleich zurück in eine Übungs-Sammlung. Gedruckt wird überwiegend schwarzweiß. Zusätzlich angenommen: Zwischen Druck und
Übung liegen oft Tage. Den tatsächlichen Ablauf einer THW-Ausbildung kenne ich nicht. Die Live-Seite habe ich als Stand
`085a93b` genommen (Fußzeile „v2026.1109.833“); ein Abgleich Build ↔ Commit war nicht möglich. Die Uhrzeiten in den PDFs
(08:43 usw.) sind UTC des Prüfrechners, nicht Ortszeit.

**Nicht prüfbar:** echtes Drucken und Kopieren (Kontrast nur am Rasterbild), Scannen mit echter Kamera, Safari, native
Builds, Share-Sheet; die Anzeige des Datumsfelds im Abgleich-Formular („mm/dd/yyyy“) stammt vom Headless-Chromium und ist
nicht gewertet. Ob der eigene offene Bogen beim Sammelweg unberührt bleibt, habe ich nicht mit einem echten eigenen Bogen
nachgestellt (Text im Dialog: „Dein offener Bogen bleibt, wie er ist.“).

## Urteil

Das Papier ist besser geworden. Jede geprüfte Einzel-PDF trägt jetzt auf **jeder** Seite unten „ÜBUNG · Stand: …“. Das
Wasserzeichen ist deutlich kräftiger: Graustufe 230 statt 241, auf 9,5 bis 9,9 % der Seite. Dateinamen nennen Übung,
Beispiel und Ordner. Der Zeitraum steht auf heute. Der neue Sammelweg legt einen Ordner in vier Tipps als Übungs-Sammlung
an, ohne Rückfrage. Die Sammlung zählt richtig („Lage: 5 Einheiten zählend · 2 / 4 / 27 // 33“). Sammel-PDF und
Lageblatt kommen daraus mit Wasserzeichen, und das alles geht auch offline. Die Bögen im THWin-Raster haben nun
Leerzeilen, wo Platz ist.

Reibung bleibt an drei Stellen. Erstens ist die Meldekopf-Kopfzeile der Einzel-PDF unverändert: eine Zeile, 2,9 mm hoch,
ohne Zug, Abrücken und Datum. Der Blanko-Vordruck hat dafür einen eigenen Kasten (BB-A2). Zweitens schreibt jede
Erzeugung die aktuelle Uhrzeit als „Stand“ in den Bogen. Liest man den ausgedruckten Bogen später wieder ein, gilt er
deshalb als „älter“ als die Sammlung, oder sein Zeitraum ist „vorbei“ (BB2-A1). Drittens ist die Sammel-PDF eine
Meldekopf-Lösung und kein Teilnehmerstapel: Nr. und Eintreffzeit sind vorgedruckt, und Leerzeilen fehlen (BB-A1, BB-A5).
Ohne fremde Hilfe ist die Aufgabe zu schaffen, aber mit Umwegen.

## Nachprüfung Runde 1

### BB-A1 [P2, Bedienung] Kein Sammeldruck — **teilweise**

- **Behoben:** Im Ordner steht „Alle 5 in eine Übungs-Sammlung“ (1280: 239 × 44 px; 390: 247 × 44 px, y = 399), mit dem
  Satz „Legt eine neue Sammlung der Art ‚Übung‘ … an — mit Sammel-PDF, Lageblatt und Weitergabe. Dein offener Bogen
  bleibt, wie er ist.“ Von der Startseite bis zur fertigen Sammlung sind es **4 Tipps** statt 23 für drei Bögen. Es kommt
  keine Rückfrage, und die Art ist „Übung“. Die Sammel-PDF (14 Seiten, Übersicht A4 quer, dann die Bögen A4 hoch) meldet
  „Lage: 5 Einheiten zählend“. Das klappt auch offline.
- **Offen:** Ein Stapel der Einzelbögen zum Ausfüllen fehlt weiter. Die Sammel-PDF ist die Unterlage des Meldekopfs: Über
  jedem Bogen steht „Nr. 1 · … · Blatt 1 von 2“ und „Stand am Meldekopf (…): Nr. 1 · Eingetroffen 09.11.2026, 08:46 ·
  anwesend“. Gerade diese Angaben sollen die Teilnehmer aber selbst eintragen. Davor stehen zwei Seiten Übergabe-Übersicht
  im Querformat. Wer Teilnehmerblätter will, lädt weiter jede Datei einzeln (5 Dateien für Malter, 23 für Hannover). Der
  Knopf steht außerdem nur in Ordnern mit eigenen Bögen: nicht in „Alle Einheiten aller Ortsverbände“, nicht im
  Landesverband und nicht in der Regionalstelle (RSt Tübingen: 10 OV-Ordner, kein Knopf). Eine Übung über mehrere
  Ortsverbände braucht also mehrere Sammlungen. Den Weg „PDFs laden → Bögen einlesen…“ nennt die Erklärung im Dialog nicht.
- **Empfehlung (Rest):** Am Ordner neben dem Sammelweg „Alle als eine PDF (Teilnehmerblätter)“: die Einzelbögen
  hintereinander, mit leerem Meldekopf. Den Sammelweg auch auf Regionalstellen-Ebene anbieten oder einen Ordner zu einer
  bestehenden Übungs-Sammlung hinzufügen lassen.

### BB-A2 [P2, Text] Meldekopf-Kasten der Beispiel-PDFs passt weder zum Blanko-Vordruck noch zum Abgleich-Formular — **teilweise**

- **Behoben:** Das Abgleich-Formular nennt beide Quellen getrennt: „‚Nr.‘ aus der Kopfzeile ‚Meldekopf‘ des Bogens,
  ‚Auftrag / Notiz‘ aus dem Kasten ‚Stand am Meldekopf‘ der Sammel-PDF“.
- **Offen (gemessen, `pdftotext`, 200-dpi-Ausschnitt):** Die Kopfzeile der Einzel-PDF hat sich auch im neuen
  THWin-Raster nicht geändert: „Meldekopf: Nr. ______ · eingegangen ____________ um ____:____ Uhr · übertragen [ ] von
  ______ um ____:____ Uhr“. Der Blanko-Vordruck hat jetzt einen eigenen Kasten im Seiteninhalt über dem Bogen (Rahmen
  rund 31 mm hoch). Darin stehen „eingegangen **am**“, „Zug / Verband“, „[ ] ÜBUNG (kein Einsatz)“, „abgerückt am … um“,
  „ins Gerät übertragen [ ] von … um“ und „Blatt ____ von ____“. Das Abgleich-Formular fragt je Einheit „Nr. laut Blatt“,
  „**Eingetroffen** am“, „Status: anwesend / abgerückt“, „Zug“ und „Auftrag / Notiz“. Für Status, Zug und Auftrag gibt es
  auf Seite 1 der Einzel-PDF kein Feld, und das Blatt sagt „eingegangen“, das Formular „Eingetroffen“. Neu gemessen ist
  die Schreibhöhe: Die Kopfzeile ist ein Rahmen von **2,9 mm** Höhe mit 7-pt-Schrift. Der obere Rand liegt 5,7 mm unter
  der Blattkante. Eine handschriftliche Nr. oder Uhrzeit passt da kaum hinein.
- **Folge:** wie in Runde 1. Dazu schreiben Teilnehmer über den Rahmen, und auf Druckern mit breitem unbedruckbarem Rand
  wird die Zeile knapp.
- **Empfehlung (Rest):** Auf Seite 1 der Einzel-PDF derselbe Kasten wie auf dem Blanko-Vordruck, auch wenn ein Bogen
  dadurch eine Seite mehr bekommt (die QR-Seite ist bei zweiseitigen Bögen ohnehin eigen). Mindestens die Kopfzeile auf
  Schreibhöhe (≥ 6 mm) bringen und die Feldnamen mit dem Formular angleichen („eingegangen“/„eingetroffen“).

### BB-A3 [P3, Kontrast] Wasserzeichen sehr blass; auf Folgeseiten der einzige Übungshinweis — **behoben**

- **Gemessen:** Das Wasserzeichen hat Graustufe 230 (vorher 241) auf 9,5 % (Seite 1) bzw. 9,9 % (QR-Seite) der Fläche,
  bei 300 dpi. Bei Schwelle 235 bleibt es also stehen. Die Fußzeile jeder Seite der Einzel-PDF beginnt mit „ÜBUNG ·
  Stand: 090843nov26“, auch auf reinen QR-Seiten (Weinsberg 4/4, Malter Verpflegungsgruppe 7/7). In der Sammel-PDF sagt
  die Fußzeile „Einsatz-Sammlung: Übung: …“, das Lageblatt hat das Wasserzeichen ebenfalls (Graustufe 230). Der
  Folgeblattkopf „Nr. ______ · THW Weinsberg … · Blatt 3 von 4 dieses Bogens“ nennt die Übung weiterhin nicht. Weil die
  Fußzeile das übernimmt, werte ich es als behoben.

### BB-A4 [P3, Text] Dateiname und PDF-Titel sagen nicht „Beispiel“ oder „Übung“ — **teilweise**

- **Behoben:** Die Dateinamen lauten jetzt „uebung-beispiel-praktische-ausbildung-malter-01-zugtrupp.pdf“ und
  „uebung-beispiel-praktische-ausbildung-akkonia-01-zugtrupp.pdf“ (also verschieden) bzw.
  „uebung-beispiel-thw-001-albstadt-ztr-tz.pdf“. Sammel-PDF und Lageblatt tragen „Uebung“ im Namen.
- **Offen:** Der PDF-Titel (`pdfinfo`) heißt weiter „Erfassungsbogen Johanniter (JUH) Malter Zugtrupp (Ztr), Stand
  09.11.2026, 08:43“, ohne Übung. Diesen Titel zeigen PDF-Betrachter und Druckwarteschlange an.

### BB-A5 [P3, Layout/Abstand] Einseitige Beispielbögen haben keine Leerzeile für Nachträge von Hand — **teilweise**

- **Behoben, wo Platz ist (Seitenbild):** Albstadt ZTr TZ hat unter den vier Personen zwei leere Zeilen und eine leere
  Qualifikationszeile. Malter Zugtrupp hat dazu einen leeren Fahrzeugblock „Fahrzeug: / Kennzeichen: / FuRn: /
  Ausstattung nach StAN: ja [ ] / nein [ ]“, Malter 1. Betreuungstrupp zwei leere Personalzeilen.
- **Offen:** Hat ein Bogen den QR-Code auf Seite 1 (Akkonia Zugtrupp, Hannover Zugtrupp), fehlt die Leerzeile. Bei
  Akkonia dienen nur die zwei unbesetzten Funktionen ZF und stv. ZF als Schreibplatz. Der Hannover-Zugtrupp (nur Stärke
  1/1/2//4) hat unter dem Tabellenkopf **keine einzige** Personalzeile, nur den Satz „Personal am Meldekopf nur in Stärke
  erfasst.“ (siehe BB2-A3). In der **Sammel-PDF**, also der eigentlichen Übungsmappe, hat derselbe Malter-Zugtrupp weder
  Leerzeilen noch einen leeren Fahrzeugblock. Unter „Sonstiges“ bleiben dort rund 74 mm frei (Seite 3/14).
- **Empfehlung (Rest):** Leerzeilen auch in der Sammel-PDF, wo Platz ist. Wo Personal nur als Stärke vorliegt, so viele
  leere Zeilen wie die Stärke.

### BB-A6 [P3, Bedienung] Nach „PDF“ keine Rückmeldung im Dialog — **teilweise**

- **Behoben:** Nach jedem Download steht grün „PDF ‚uebung-beispiel-…-01-zugtrupp.pdf‘ erzeugt — liegt im
  Download-Ordner.“ (Dauer 1,0 bis 3,5 s, `role="status"`).
- **Offen (gemessen):** Die Quittung steht **über** der Liste und nicht an der Zeile. Nach 6 s ist sie weg. Am Telefon
  (390 × 844, Ordner Hannover, PDF der 23. Karte) liegt sie bei y = −4 866 px, weit außerhalb des Bildes: Der Helfer sieht
  nach dem Tipp nichts. Welche Zeilen schon geladen sind, zeigt die Liste nicht, also verliert man beim Sammeln weiter den
  Überblick.
- **Empfehlung (Rest):** Quittung an der Karte bzw. Zeile oder im sichtbaren Bereich (klebend), und ein bleibendes
  „✓ geladen“ je Zeile, solange der Dialog offen ist.

### BB-A7 [P3, Text] Ordnernamen unter „Katastrophenschutz“ in Großbuchstaben ohne Umlaut — **behoben**

- Alle zwölf Länder stehen in amtlicher Schreibweise da („Baden-Württemberg“, „Mecklenburg-Vorpommern“,
  „Nordrhein-Westfalen“ …). Neu ist die Zeile „Noch ohne Beispielbögen: Bremen, Hamburg, Sachsen-Anhalt,
  Schleswig-Holstein.“

### BB-A8 [P3, Text] Übungsunterlagen voller Warnhinweise wegen alter Beispieldaten — **teilweise**

- **Behoben:** Der Zeitraum steht auf heute bei gleicher Dauer („09.11.2026 – 09.11.2026“ statt „17.02.2024“; Weinsberg
  „09.11.2026 – 12.11.2026“). Die Sammel-PDF hat keine Zeit- oder Jahreswarnung mehr. „Zählt trotzdem mit“ neben „zählt
  nicht“ kam nicht mehr vor, weil die Sammlung jetzt eine Übung ist.
- **Offen:** Die Sammel-PDF druckt je Einheit „Hinweise (3)“ bzw. „(2)“: „Alle 4 Personen stehen auf Geschlecht
  ‚männlich‘ — das ist die Vorbelegung“, „Keine telefonische Erreichbarkeit erfasst“, „Fahrzeuge erfasst, aber kein
  Kraftfahrer“. Die Hinweise nehmen auf Seite 1 der Übersicht mehr Höhe ein als die Einheiten selbst, und das Lageblatt
  hat dafür eine eigene Hinweiszeile je Einheit. Der eingelesene Albstadt-Bogen meldet „⚠ Ort im Bogen: ‚Hochwasserlage
  Albstadt …‘ — passt das zu dieser Lage?“. Über den Sammelweg abgelegte Beispiele tragen auf der Karte weiter „am
  Meldekopf von Hand erfasst“. Die Zeitwarnung kommt zurück, sobald das Papier später eingelesen wird (BB2-A1).

## Neue Befunde

### BB2-A1 [P2, Daten/Bedienung] Jede Erzeugung schreibt die aktuelle Uhrzeit als „Stand“ in den Bogen: Ausgedrucktes gilt beim Wiedereinlesen als „älter“ oder „vorbei“

- **Fundstelle / Aufgabe:** Einzel-PDF und Sammelweg aus demselben Ordner, Rückweg über „Bögen einlesen…“ bzw. QR-Code
  (Malter-Übungs-Sammlung, 1280 × 900; Albstadt-QR mit Uhr eine Woche später).
- **Beobachtung (gemessen):** Die Einzel-PDF von Malter 1. Betreuungstrupp, um 08:43 geladen, trägt „Stand 090843nov26“.
  Dieselben Bögen kamen um 08:46 über „Alle 5 in eine Übungs-Sammlung“ in die Sammlung, dort mit Stand 08:46 und „am
  Meldekopf von Hand erfasst“. Beim Einlesen der PDF öffnet sich „Bogen der Einheit nachgereicht: Für ‚… 1.
  Betreuungstrupp‘ gilt bisher die von Hand erfasste Meldung (Stand …, 08:46 …). Der eben eingelesene Bogen der Einheit
  trägt den **älteren** Stand …, 08:43 … — nach dem Zeitstempel bliebe die **Schnellerfassung** gültig.“ Die Wahl lautet
  „Bogen der Einheit gilt — ersetzt die Schnellerfassung“, „Schnellerfassung behalten“ oder „Später entscheiden“, obwohl
  „Bisher“ und „Neu“ Zeichen für Zeichen gleich sind („Stärke 0 / 1 / 1 // 2 · Weber, Markus · MA-JU 15“). Im Bericht
  heißt es danach „älterer Stand als die Schnellerfassung — die Schnellerfassung gilt weiter“. Zweiter Fall: Der QR-Code
  der heute erzeugten Albstadt-PDF, eine Woche später geöffnet (Uhr 16.11.2026), meldet „⚠ Einsatzzeitraum 09.11.2026 –
  10.11.2026 ist vorbei — gilt dieser Bogen noch für den aktuellen Einsatz?“. Das Rücken auf heute geschieht beim
  Erzeugen und nicht beim Einlesen.
- **Erwartung der Rolle:** Ein Übungsblatt, das ich am Abend vorher oder eine Woche vorher drucke, kommt beim Einlesen so
  an wie direkt nach dem Druck. Derselbe Beispielbogen aus zwei Wegen ist derselbe Bogen und keine „ältere Fassung“ neben
  einer „Schnellerfassung“.
- **Auswirkung im Einsatz:** In der Übung bekommt der Meldekopf zu jedem zurückgegebenen Blatt eine Konfliktfrage mit
  falschen Begriffen. Die Vorgabe ist dabei, den Bogen der Einheit liegen zu lassen. Wer üben soll, wann der Bogen der
  Einheit Vorrang hat, lernt hier das Gegenteil. Liegt zwischen Druck und Übung ein Wochenende, trägt jeder eingelesene
  Bogen wieder die Warnung „vorbei“, die Runde 1 bemängelt hat (BB-A8).
- **Empfehlung:** Für Beispielbögen einen festen Stand (z. B. Druckdatum, aber gleich für alle Wege eines Tages) oder
  Gleichheit am Inhalt erkennen: Gleicher Inhalt heißt keine Rückfrage. Zeitwarnungen für Übungsbögen beim Einlesen
  ebenfalls auf heute beziehen oder abschwächen. Über den Sammelweg abgelegte Beispiele nicht „von Hand erfasst“ bzw.
  „Schnellerfassung“ nennen, sondern „aus Beispielbogen“.
- **Verifikation:** Ordner Malter: erst Einzel-PDF laden, dann Sammelweg, dann die PDF einlesen. Keine Rückfrage, oder
  eine, die „gleicher Inhalt“ sagt. QR einer heute erzeugten PDF mit Datum +7 Tage öffnen: keine Meldung „vorbei“.

### BB2-A2 [P3, Text] Bewusst übernommene Fehler der Originalvordrucke sind für den Ausbilder nicht erkennbar

- **Fundstelle / Aufgabe:** Ordner „Praktische Ausbildung“, Einzel-PDFs und Lageblatt der Malter-Übungs-Sammlung.
- **Beobachtung (gemessen):** Das Lageblatt führt in der Spalte „Funkrufname“ „Akkon Malter **56/17/1**“, in der
  Bemerkung derselben Zeile „Rufname **54-17-1**“. Die 1. Betreuungsgruppe hat „54/75/1“ neben „Rufname 54-17-2“, die 2.
  Betreuungsgruppe „54/17/3“ neben ebenfalls „Rufname 54-17-2“. Beim Akkonia-Zugtrupp sind ZF und stv. ZF ohne Namen
  („2 / 0 / 2 // 4“ bei zwei Namen), Hannover hat „H-JU XXX“ als Kennzeichen. Laut Generator
  (`scripts/praktische-ausbildung-beispielboegen.mts`) sind das gewollte „Eigenheiten“ der Originalvordrucke, „eins zu
  eins übernommen“. Im Dialog steht dazu nichts. Der Ordner zeigt nur „Praktische Ausbildung: 0 Bögen, 4 Unterordner“, und
  die Erklärung spricht von „fiktiven Einheiten und Personen“.
- **Erwartung der Rolle:** Baut der Satz Fehler ein, will ich als Ausbilder wissen, welche, damit ich sie in der
  Nachbesprechung auflösen kann. Sonst halte ich sie für Fehler der App.
- **Auswirkung im Einsatz:** Die Teilnehmer fragen, welcher Rufname gilt. Der Ausbilder kann es nicht sagen, oder er
  korrigiert das Blatt von Hand und verliert die Übungsabsicht.
- **Empfehlung:** Am Ordner (und auf Wunsch als Beiblatt zur Sammel-PDF) eine kurze Liste „Eingebaute Eigenheiten dieses
  Satzes“ mit Einheit und Stelle.
- **Verifikation:** Ordner „JUH RV Malter“ öffnen: Der Rufname-Widerspruch des Zugtrupps ist ohne Blick in den Quelltext
  zu finden.

### BB2-A3 [P3, Text] Nur-Stärke-Bogen sagt „am Meldekopf nur in Stärke erfasst“ und hat keine Personalzeile

- **Fundstelle / Aufgabe:** Einzel-PDF „2. Einsatzzug Landeshauptstadt Hannover – Zugtrupp“ (1 Seite).
- **Beobachtung (Seitenbild, `pdftotext`):** Unter dem Tabellenkopf „Funktion/Zusatzfunktionen | Rolle | Name, Vorname“
  steht keine Zeile, nur kursiv „Personal am Meldekopf nur in Stärke erfasst.“ Der Bogen kommt aber von der Einheit und
  nicht vom Meldekopf, und auf dem Blatt ist kein Meldekopf beteiligt.
- **Erwartung der Rolle:** „Die Einheit hat nur die Stärke gemeldet“ und darunter so viele leere Zeilen, dass vier Namen
  nachgetragen werden können.
- **Auswirkung im Einsatz:** Der Teilnehmer meint, am Meldekopf sei schon gearbeitet worden. Namen, die die Einheit
  nachreicht, landen am Rand (wie BB-A5).
- **Empfehlung:** Text nach Herkunft („von der Einheit nur als Stärke gemeldet“) und Leerzeilen in Höhe der Stärke.
- **Verifikation:** Hannover-Zugtrupp-PDF: vier leere Personalzeilen, kein „am Meldekopf“.

### BB2-A4 [P3, Text] Name der Übungs-Sammlung ist der ganze Ordnerpfad

- **Fundstelle / Aufgabe:** Sammelweg aus „THW › … › OV Albstadt“, Lageblatt.
- **Beobachtung (gemessen):** Die Sammlung heißt „Übung: THW › Alle Einheiten aller Ortsverbände (nach Landesverband,
  Regionalstelle, OV) › Baden-Württemberg › RSt Tübingen › OV Albstadt“. Die Kopfzeile des Lageblatts bricht deshalb auf
  zwei Zeilen um, und die Fußzeile wiederholt den ganzen Pfad. Der Dateiname hat 161 Zeichen
  („2026-11-09_0852_eeb-lageblatt_Uebung_THW_Alle_Einheiten_aller_Ortsverbaende_nach_Landesverband_…_OV_Albstadt.pdf“).
  Aus „Praktische Ausbildung › JUH RV Malter“ ist der Name dagegen brauchbar.
- **Erwartung der Rolle:** Auf dem Lageblatt steht „Übung OV Albstadt“, kurz genug für die Tafel und den Ordnerrücken.
- **Auswirkung im Einsatz:** Gering. Die Kopfzeile ist schwer zu lesen, und unter Windows wird der Pfad im Download-Ordner
  lang (bei tiefen Ablagen nahe der 260-Zeichen-Grenze).
- **Empfehlung:** Den Namen aus der letzten Ebene (ggf. mit Organisation) vorbelegen, ohne Sammelebenen wie „Alle
  Einheiten aller Ortsverbände (…)“.
- **Verifikation:** Sammelweg aus „OV Albstadt“: Name ≤ 40 Zeichen, Lageblatt-Kopf einzeilig.

### BB2-A5 [P3, Bedienung] QR-Code nur auf Blatt 2: Das Foto von Seite 1 bringt nichts, und der Bericht sagt nicht, warum

- **Fundstelle / Aufgabe:** Zweiseitige Einzel-PDFs im neuen Raster (Albstadt ZTr TZ, Malter Zugtrupp), Rückweg über
  „Bögen einlesen…“ mit Seitenfotos.
- **Beobachtung (gemessen):** Albstadt war in Runde 1 einseitig mit Code. Mit den Leerzeilen steht der Code jetzt auf
  „Blatt 2 von 2 dieses Bogens“. Seite 1 trägt die Meldekopf-Zeile und die Nachträge von Hand. Beim Einlesen des
  150-dpi-Bilds von Seite 1 meldet der Bericht „alb150-1.png: Kein QR-Code im Bild gefunden.“, ohne Hinweis auf Blatt 2.
  Mit Seite 2 kam der Bogen an.
- **Erwartung der Rolle:** Der Bericht sagt: „Seite 1 eines Bogens, der Code steht auf Blatt 2“ bzw. „Foto von Blatt 2
  nachreichen“.
- **Auswirkung im Einsatz:** Geht Blatt 2 verloren oder fotografiert der Teilnehmer nur die bekritzelte Seite, bleibt nur
  Abtippen. Die Meldung klingt wie ein Fehler der Kamera oder des Fotos.
- **Empfehlung:** Seite 1 erkennbar machen (z. B. kleiner Code mit Kennung oder Text „Code auf Blatt 2“ in der
  Kopfzeile), und der Bericht nennt das fehlende Blatt.
- **Verifikation:** Foto nur von Seite 1 einlesen: Der Bericht nennt Einheit und „Code auf Blatt 2“.

## Hinweise (ohne Priorität)

- **H1, Blanko-Meldekopf eng gesetzt:** Im neuen Kasten des Blanko-Vordrucks berührt die Zeile „ins Gerät übertragen [ ]
  von … um“ fast die Unterstriche von „abgerückt am … um“ darüber (200-dpi-Ausschnitt). Zum Schreiben ist das knapp. Den
  Vordruck selbst prüft dieser Schwerpunkt nur am Rand.
- **H2, Personaltabelle anders als auf dem Blanko:** Der Blanko-Vordruck hat vier Spalten („Name, Vorname“ | „D =
  dienstlich / P = privat“), die Beispiel-PDF drei („Name, Vorname / Erreichbarkeit (D = …)“ in einer Zelle). Wer mit dem
  Beispiel übt, findet auf dem Blanko eine andere Tabelle.
- **H3, Papiertexte für den Bildschirm:** Unter dem Code steht „Mit der Kamera scannen oder den Link antippen“, darüber
  in Blau „Bogen direkt in der App öffnen“. Auf Papier lässt sich nichts antippen. Die Erklärung im Dialog nennt weder
  den Sammelweg noch, dass Zeitraum und Stand auf heute rücken.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Übung vorbereiten (Unterlagen drucken) | Ordner in 4 Tipps als Übungs-Sammlung, Sammel-PDF und Lageblatt mit Wasserzeichen, offline | Einzel-PDFs je Bogen (Dateiname mit Übung und Ordner), Blanko-Vordruck | Teilnehmerstapel ohne vorgedruckte Nr./Eingang nur einzeln (BB-A1) |
| Teilnehmer arbeiten am Meldekopf auf Papier | – | Kopfzeile „Meldekopf“ (2,9 mm hoch), Leerzeilen wo Platz, „ÜBUNG ·“ auf jeder Seite | Kasten anders als Blanko und Abgleich (BB-A2); keine Zeilen bei Nur-Stärke (BB2-A3) |
| Ausdrucke zurück ins Gerät | QR (61 mm) per Kamera oder Seitenfoto; Übungskennung bleibt | Abtippen per „Einheit manuell erfassen…“ | Konfliktfrage „älter als Schnellerfassung“ bei gleichem Inhalt, „vorbei“ nach Tagen (BB2-A1); Code nur auf Blatt 2 (BB2-A5) |
| Lage vom Papier abgleichen | Nr., Eingang, Status, Zug, Auftrag in einem Schritt | Lageblatt Seite 2 „Nachtrag von Hand“ | Status/Zug/Auftrag stehen nicht auf der Einzel-PDF (BB-A2) |
| Übungsmappe ausgeben | Sammel-PDF zählt richtig („5 Einheiten zählend“) | Stapel Einzel-PDFs | Hinweise aus Vorbelegung füllen die Übersicht (BB-A8) |

## Würde ich dafür das Papier weglegen?

Für die Vorbereitung fast: Einen Ordner als Übung anlegen und daraus Lageblatt und Sammelmappe drucken geht jetzt schnell,
offline und mit klar gekennzeichnetem Papier. Den Teilnehmerstapel hole ich aber weiter Blatt für Blatt. Die Zeile, in
die meine Leute Nr. und Eingang schreiben, ist 3 mm hoch und nicht die vom Blanko. Und beim Zurückscannen fragt mich das
Gerät nach einer „Schnellerfassung“, die es nie gab.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (Übungs-Sammlung samt Sammel-PDF und Lageblatt ja; Teilnehmerblätter nur einzeln;
  Rückweg mit irreführender Rückfrage)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Der Meldekopf hält den eingelesenen Übungsbogen für eine „ältere Fassung“ neben einer
  „Schnellerfassung“ und lässt ihn auf Vorgabe liegen (BB2-A1).
- **Größtes Einsatzrisiko:** Geübt wird mit einer 3 mm hohen Meldekopf-Zeile ohne Zug und Abrücken, im Ernstfall liegt der
  Blanko-Kasten mit anderen Feldern auf dem Tisch (BB-A2).
- **Top-Priorität für die nächste Iteration:** Beispielbögen mit festem Stand bzw. Inhaltsgleichheit, damit der Rückweg
  vom Papier ohne Konfliktfrage und ohne „vorbei“ läuft (BB2-A1); danach der Blanko-Kasten auf Seite 1 der Einzel-PDF
  (BB-A2).
