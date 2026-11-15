# Audit „Arbeitsablauf", Runde 9 (Einheit → Meldekopf → zweites Gerät, dazu Papier und Rückwege)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Build wurde weder neu gebaut noch
wurde der Server angefasst. Wiederholung nach der Behebung der Runde-8-Befunde
R8-W1 bis R8-W6 und der übrigen Runde-8-Änderungen, soweit sie den Arbeitsablauf
berühren: Rohtext-Rettung (`eeb.unlesbar.v1`), Sprungmarke, Rückfragen bei Zoom
200 %, Zwei-Fenster-Rückfragen mit Werten, Lagemonitor, Nummern-Verschiebung in
der Rückfrage des Papier-Abgleichs, Sollstärke-Marke, Zug-Normalisierung „n. Zug",
CSV nach Nr., Umschrift im Papierfeld, Ankündigung der Entwurfsanonymisierung und
der Verlauf. Der Abgleich bezieht sich auf [Runde 8](../runde-8/arbeitsablauf.md)
samt „Stand der Behebung" in der [README von Runde 8](../runde-8/README.md).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Grundeinstellung Telefon
360 × 640; zusätzlich 320 × 568, 640 × 360 quer, Browser-Zoom nachgestellt
(180 × 320 bei Gerätepixelfaktor 4) und `html { font-size: 200% }`; für den
Lagemonitor das Fenster, das „Lagemonitor öffnen" selbst aufmacht. Jeder Lauf
hatte einen eigenen Browser-Kontext; elf weitere Prüfer nutzten den Server
gleichzeitig. Die Geräteuhr der Testumgebung stand auf dem 24.10.2026; alle
Seeds tragen `uebung: false` und einen Stand auf die Minute des Laufs, die
Einsatzzeiträume der Übungsbögen liegen teils in der Vergangenheit (dann
erscheinen „Zeitraum vorbei" und „Anderer Einsatz?", das ist eine Folge der
Seeds und kein Befund). Die Tipp-Sperre habe ich in den Skripten meist mit 1,5 s
oder mehr eingehalten; wo ein Tipp früher kam, steht es im Abgleich.

- **A-Gerät (Einheit):** leerer Kontext, „Neuen Bogen erstellen" über Schritt 1
  bis 6 (OV, „Bergungsgruppe", Ort, zwei Namen, „Vorbelegung entfernen"),
  außerdem „Namen einfügen…" mit fünf Namen; Entwürfe aus `examples/thw/`
  (`001`, `018`, `grossbogen-verstaerkter-bergungszug`). Übergabe über „Bogen
  übergeben… → Weitere Formate → Link teilen" (`navigator.share` abgefangen,
  Host auf `localhost:4173` umgeschrieben) und „PDF erzeugen" (Download
  gespeichert, mit `pdftotext` gelesen). Drei Links desselben Bogens: gleicher
  Stand, neuerer Stand mit 120 l Diesel und anderem Ort, älterer Stand mit 60 l.
- **M1 (Meldekopf):** Sammlung „Hochwasser Test" über die Oberfläche angelegt,
  Links als Kaltstart (erst `about:blank`, dann der Link) aufgenommen; Nachmeldung
  mit neuerem und älterem Stand; Sammlung „Hochwasser Musterstadt" als Seed mit
  sechs Einheiten (`001`, `003`, `009`, `013`, `016`, `052`): Karten, Zug,
  Abrücken, Lageblatt, CSV, Excel, „Einsatz weitergeben / sichern",
  „Einheit schnell erfassen (nur Stärke)…", „Einheit manuell erfassen…".
- **Papier:** vier der sechs Einträge mit `vomPapier`, „Lage vom Papier
  abgleichen…" mit einer Nummer, die eine nicht beteiligte Einheit trägt, und mit
  zwei Zug-Schreibweisen.
- **Zwei Fenster:** derselbe Bogen in zwei Tabs, im zweiten Ort, Diesel, Person
  und Kennzeichen geändert.
- **Beschädigte Daten:** abgeschnittener Text, Objekt statt Liste in
  `eeb.einsaetze.v1` und abgeschnittener Text in `eeb.vorlagen.v1`; Sicherung aus
  dem Hinweiskasten gespeichert und gelesen.
- **Entwurf mit Alter:** 20, 75, 85 und 95 Tage alte Entwürfe.
- **Verlauf:** „Schließen" des Dialogs „Bogen übergeben", nach 0, 150, 400 und
  1 700 ms gefolgt von Browser-Zurück.

Reihenfolge: Ich habe zuerst blind getestet (Startseite, Einheit von vorn bis zur
Übersicht, Einsatzansicht, Nachmeldung, Papier-Abgleich, Schnellerfassung) und
erst danach den Bericht „Arbeitsablauf" aus Runde 8 und „Stand der Behebung"
gelesen. Die Überschriften der parallel entstandenen Runde-9-Berichte habe ich
erst nach allen Messungen gelesen, um Doppelungen als Verweis zu kennzeichnen.
Skripte und Bilder: `scratchpad/runde9/w/`.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit füllt ihren Bogen aus und übergibt ihn; **Annahme:** der Link
   kommt per Chat oder als PDF, der QR-Code wird vom Display gescannt.
2. Der Meldekopf nimmt auf, entscheidet bei einer Nachmeldung über die Fassung,
   vergibt Zug und Auftrag, lässt abrücken und zeigt die Lage am Fernseher.
3. Fällt das Gerät aus oder löst ein zweites ab, geht die Lage als Sammel-PDF
   weiter; **Annahme:** der Stab bekommt erst alles, dann nur das Neue.
4. Bleibt nur das gedruckte Lageblatt, liest ein Gerät es ein und gleicht vom
   Papier ab.

**Nicht prüfbar:** Kamera-Scan (QR nur über Link, PDF und Vollbildanzeige),
echtes Drucken, Handscanner, Nahbereichs-Weitergabe, natives Share-Sheet,
Darstellung der Excel-Datei in Excel, WebKit, native Builds, ein Uhrversatz
zwischen zwei Geräten (alle Kontexte teilen die Systemuhr). Das Datumsfeld zeigt
hier das US-Format (Browsersprache der Testumgebung), kein Befund.

## Urteil

Der Arbeitsablauf trägt, und die Runde-8-Befunde zum Ablauf sind behoben. Der
Papier-Abgleich fragt jetzt zurück, wenn eine „Nr. laut Blatt" schon eine nicht
beteiligte Einheit trägt („Nr. 2 trägt schon THW Bamberg … Trotzdem
übernehmen?"), und nennt nach der Übernahme jede verschobene Nummer mit alter und
neuer Zahl („Bamberg 2 → 3, Ulm 3 → 4 …"). „Nur in die Historie legen" erzeugt
keine Marke „neue Fassung" mehr und quittiert „die Lage bleibt unverändert". Der
Dialog „In Einsatz-Sammlung ablegen" sagt, dass danach die Sammlung öffnet und der
Bogen unter „Fortsetzen" bleibt. Die Sammlung zeigt „Dein eigener Bogen … ist noch
offen. Bogen fortsetzen", nach dem Neuladen auch. Die Knöpfe „4 leere Plätze
entfernen" stehen an der Warnung, und das „✓ Lageblatt erzeugt" verschwindet nach
dem Abrücken. Die Rohtext-Rettung fängt abgeschnittene Texte ab und legt sie
beiseite, die Sicherung enthält den Rohtext.

Reibung bleibt an wenigen, kleinen Stellen. Die Rückfrage bei einer Nachmeldung
zeigt im Querformat und bei großer Schrift beim Öffnen keine ihrer Wahlen ganz,
sichtbar ist dort vor allem „Abbrechen" (R9-W1). Die Zwei-Fenster-Leiste nennt bei
Ort/Auftrag und Diesel nur den Feldnamen, bei Personal und Fahrzeugen dagegen die
Werte (R9-W2). Die PDF schreibt die Ansprechperson in Umschrift, die Personenliste
darunter weiter mit Fragezeichen, und die Quittung beschreibt das Feld nicht mehr
richtig (R9-W3). Wer aus der Übersicht einen Punkt behebt, hat keinen Weg „zurück
zur Übersicht" in der Fußleiste (R9-W4), und der Empfangsdialog des Meldekopfs
kennt die Sollstärke nicht (R9-W5).

Alle Einzelaufgaben schafft man ohne fremde Hilfe. Ein P0 oder P1 habe ich nicht
gefunden.

## Befunde

### R9-W1 [P2] Rückfrage „Einheit ist bereits gemeldet": Im Querformat und bei großer Schrift ist beim Öffnen keine der Wahlen ganz im Bild, nur „Abbrechen"

**Priorität:** P2

**Kennzeichnung:** gemessen (Rumpf und Knöpfe im Dialog vermessen) und im
Screenshot beobachtet (`k2-quer-n1.png`, `k2-telefon-g1.png`,
`k2-telefon-n2.png`). Ob jemand bei Zeitdruck „Abbrechen" tippt, ist **Risiko**.

**Fundstelle / Aufgabe:** Meldekopf nimmt einen Link oder QR-Code einer schon
gemeldeten Einheit auf (Einsatzansicht, Dialog „Einheit ist bereits gemeldet").
Code: Dialogbauart mit rollendem Rumpf und festem Fuß, `abfrage-rumpf`.

**Beobachtung:** Der Rumpf rollt, der Fuß mit „Abbrechen" steht fest (das ist die
Behebung aus Runde 8 und hält). Die Wahlen liegen im Rumpf hinter drei Zeilen
Text („Bisher", „Neu", „Geändert"). Beim Öffnen steht der Rumpf auf oben. Gemessen
für die beiden Fassungen der Rückfrage:

| Lage | Rumpf (sichtbar / gesamt) | Wahlen ganz im Bild beim Öffnen |
| --- | --- | --- |
| 360 × 640, 100 %, neuerer Stand (2 Wahlen) | 518 / 539 px | 2 von 2 |
| 360 × 640, 100 %, älterer Stand (3 Wahlen) | 518 / 616 px | 2 von 3 |
| 320 × 568, 100 %, älterer Stand | 446 / 700 px | 1 von 3 |
| 640 × 360 quer, 100 %, neuerer Stand | 238 / 404 px | 0 von 2 |
| 640 × 360 quer, 100 %, älterer Stand | 238 / 486 px | 0 von 3 |
| 360 × 640, 200 % Schrift, älterer Stand | 506 / 959 px | 0 von 3 |
| 180 × 320 (Zoom), älterer Stand | 208 / 1 058 px | 0 von 3 |

Im Querformat ist die erste Wahl „Als neue Fassung anhängen" nur als angeschnittener
dunkler Balken über „Abbrechen" zu sehen; ihre Beschriftung ist abgeschnitten
(`k2-quer-n1.png`, Balken bei y = 508 bis 540, Fuß ab 566). Bei 200 % Schrift
und im Zoom-Fenster enden Rumpf und Text vor der ersten Wahl; im Bild stehen
Text, ein weicher Schatten am Rumpfende und „Abbrechen" als einziger ganzer Knopf.

**Erwartung der Rolle:** Wer eine Rückfrage öffnet, sieht, dass er wählen kann und
was. Mindestens die empfohlene Wahl („Als neue Fassung anhängen") steht beim
Öffnen vollständig im Bild, oder der Text ist so kurz, dass sie dort steht.

**Folge:** Der Meldekopf nimmt eine Nachmeldung im Stehen auf, oft quer auf dem
Tisch oder mit größerer Systemschrift. Wer nur „Abbrechen" sieht, bricht ab; die
Meldung ist dann nicht aufgenommen, und bei einem Bogen aus mehreren QR-Teilen
müssen die Teile neu gescannt werden. Es geht nichts verloren, es kostet Zeit und
einen Fehlversuch. Wer rollt, findet alle Wahlen; deshalb P2 und nicht P1.

**Empfehlung:** Die Wahlen vor die Zeilen „Bisher / Neu / Geändert" stellen oder
die Zeilen im engen Fenster hinter „Genauer" einklappen, damit die empfohlene Wahl
beim Öffnen im Bild steht. Dasselbe Muster zeigt R9-M2 („Stärke nicht gezählt")
und R9-H1 („Bogen übergeben" bei 200 %); die Lösung gehört in die gemeinsame
Dialogbauart.

**Nachprüfung:** Link einer schon gemeldeten Einheit mit älterem Stand aufnehmen
bei 640 × 360, 360 × 640 mit 200 % und 180 × 320: Mindestens „Als neue Fassung
anhängen" ist beim Öffnen ganz im Bild.

### R9-W2 [P3] Zwei-Fenster-Leiste: Bei Ort/Auftrag und Diesel steht nur der Feldname, bei Personal und Fahrzeugen stehen die Werte (Rest von R8-N6)

**Priorität:** P3

**Kennzeichnung:** beobachtet (je einmal Ort/Auftrag, Diesel, Person, Kennzeichen
in der zweiten Seite geändert, erste Seite zurückgeholt, „Genauer" geöffnet)

**Fundstelle / Aufgabe:** Derselbe Bogen in zwei Tabs; im zweiten ein Feld
ändern; im ersten die Leiste „Hier wird nichts gespeichert. Das andere Fenster hat
den Bogen geändert: …" mit „Genauer".

**Beobachtung:**
- Person umbenannt: „… geändert: Personal (1 Eintrag: Lang, Sabine → Neumann,
  Sabine)."
- Kennzeichen geändert: „… Fahrzeuge (1 Eintrag: FüKW (THW-80101) → FüKW
  (THW-99999))."
- Ort/Auftrag geändert: „… geändert: Ort / Auftrag." Ohne alten und neuen Text.
- Diesel von 80 l auf 150 l: „… geändert: Diesel." Ohne die Zahlen.
- Die Zeilen „Dort: … gespeichert 07:15:19 Uhr, 4 Personen." und „Hier: Stand …,
  4 Personen, zuletzt gespeichert …" nennen in allen vier Fällen Name, Uhrzeit
  und Personenzahl, nie das geänderte Feld.

**Erwartung der Rolle:** Die README von Runde 8 führt „dort/hier mit beiden Werten".
Wer vor „Anderen Stand laden" oder „Meine Fassung behalten" steht, will bei
einer einzelnen Zahl oder einem Ortsnamen sehen, was dort steht und was hier.
Der Weg über Namen und Kennzeichen zeigt, dass es geht.

**Folge:** Gering. Bei Diesel und Ort entscheidet der Helfer nach der Uhrzeit,
nicht nach dem Inhalt; die falsche Seite zu behalten kostet eine Eingabe, die
andere Fassung liegt unter „Zuletzt geschlossener Bogen".

**Empfehlung:** Bei einzelnen Feldern „alt → neu" nennen („Diesel: 80 l → 150 l",
„Ort/Auftrag: „…" → „…"", bei langem Text gekürzt), so wie bei Personal und
Fahrzeugen.

**Nachprüfung:** Im zweiten Fenster Diesel und Ort/Auftrag ändern: Die Leiste im
ersten nennt beide Werte.

### R9-W3 [P3] PDF: Umschrift nur im Feld „Ansprechpartner/in", die Personenliste führt denselben Namen weiter mit Fragezeichen, die Quittung beschreibt das Feld falsch

**Priorität:** P3

**Kennzeichnung:** beobachtet (PDF mit `pdftotext -layout` gelesen, Quittung im
Bild)

**Fundstelle / Aufgabe:** „Bogen übergeben… → PDF erzeugen" mit Bogen, dessen
erste Person „Мария Иванова" heißt (Übungsbogen `001`, zwei Personen geändert:
„Мария Иванова", „Zoë Łukasz"). Code: PDF-Ausgabe und Quittung zu nicht
darstellbaren Zeichen.

**Beobachtung:**
- Seite 1, Feld „Ansprechpartner/in": „Marija Ivanova (Umschrift)". Das hält
  (R8-A3 behoben).
- Personenliste auf demselben Blatt: „ZFü / Kf C  F  ???????, ?????" für dieselbe
  Person. „Łukasz" wird zu „Lukasz" umgeschrieben und ohne Vermerk geändert.
- Quittung: „2 Namen enthalten Zeichen, die die PDF nicht darstellen kann … – sie
  stehen dort als „?". Betroffen: Мария Иванова (Ansprechperson)." Es ist eine
  Person; „2 Namen" zählt Vor- und Nachname. Der Satz, die Ansprechperson stehe
  als „?" dort, stimmt für das Feld nicht mehr, für die Liste weiter.

**Erwartung der Rolle:** Auf dem Blatt steht derselbe Mensch an beiden Stellen
gleich lesbar, und die Quittung sagt, welche Stelle wie aussieht („Ansprechperson
in Umschrift, in der Liste als „?"").

**Folge:** Gering. Die Ansprechperson ist lesbar, die Rückfrage-Nummer steht daneben.
Wer eine Namensliste vom Papier abgleicht, findet bei nicht lateinischen Namen
Fragezeichen; der QR-Code trägt die Namen unverändert.

**Empfehlung:** Die Umschrift auch in der Personenliste verwenden oder dort denselben
Vermerk wie im Feld; die Quittung zählt Personen („1 Person") und nennt, wo die
Umschrift gilt und wo „?" steht.

**Nachprüfung:** Bogen mit kyrillischer erster Person erzeugen: Liste und Feld
stimmen überein, die Quittung zählt eine Person.

### R9-W4 [P3] Wer aus der Übersicht einen Punkt behebt, hat in der Fußleiste keinen Weg „zurück zur Übersicht"

**Priorität:** P3

**Kennzeichnung:** beobachtet (zweimal: „Bearbeiten" in Personal, Antippen eines
offenen Punkts im Einsatzzeitraum); die Tipp-Zahl ist gezählt

**Fundstelle / Aufgabe:** Assistent, Schritt 6 „Übersicht" → „Bearbeiten" bei
Personal (oder ein offener Punkt) → Änderung → zurück zur Übersicht. Code:
Fußleiste des Assistenten in `src/app/app.tsx`.

**Beobachtung:** Nach „Bearbeiten" steht Schritt 3 „Personal" im Bild. Die
Fußleiste trägt „←", die Ansichtstaste und „Weiter →". „Weiter →" führt in
Schritt 4 „Fahrzeuge", nicht in die Übersicht. Zurück zur Übersicht geht es mit
dem Reiter „6" in der Schrittleiste (1 Tipp) oder mit „Weiter" durch die übrigen
Schritte (bei Schritt 2 vier Tipps, in Schritt 5 heißt der Knopf erst „Zur
Übersicht →"). Browser-Zurück führt auf Schritt 3 und danach auf die Startseite,
nicht in die Übersicht.

**Erwartung der Rolle:** Wer aus der Übersicht kommt und eine Zeile behoben hat,
will zur Übersicht zurück, um den nächsten offenen Punkt zu sehen.

**Folge:** Gering. Der Reiter „6" ist da, trägt aber nur die Ziffer (siehe R7-N9
als bekannte Grenze); wer ihn nicht findet, tippt sich durch Schritte, die er
nicht ändern wollte. Das Risiko ist ein übersehener zweiter offener Punkt.

**Empfehlung:** Nach „Bearbeiten" oder Antippen eines offenen Punkts trägt die
Fußleiste „Zurück zur Übersicht" an der Stelle von „Weiter →".

**Nachprüfung:** Übersicht → „Bearbeiten" bei Personal: Die Fußleiste bietet den
Rückweg in einem Tipp.

### R9-W5 [P3] Empfangsdialog des Meldekopfs nennt bei einem Bogen aus leeren Sollplätzen nur „Stärke 0 / 2 / 7 / 9", die Marke „Sollstärke" erscheint erst in der Karte

**Priorität:** P3

**Kennzeichnung:** beobachtet (Bogen „Bergungsgruppe" mit allen neun Vorbelegungsplätzen
ohne Namen, Link, Aufnahme in eine neue Sammlung). Zählung nach R8-A1 ist bekannte
Grenze; hier geht es um die Stelle der Entscheidung.

**Fundstelle / Aufgabe:** Meldekopf scannt oder öffnet den Link → Dialog „Meldung
von … empfangen" → „In „Hochwasser Test" aufnehmen".

**Beobachtung:**
- Dialog: „Meldung von „THW OV Leerstadt Bergungsgruppe" empfangen. Stärke 0 / 2 /
  7 / 9. Wohin damit?" Kein Hinweis, dass die Zahlen Sollstärke sind.
- Nach der Aufnahme steht die Karte mit „Stärke 0 / 2 / 7 / 9", „Sollstärke, nicht
  gemeldet" und „leere Personenkarte + 6 weitere"; die Kopfzahl lautet „Gesamt 9".
- Die Einheit selbst wird beim Übergeben auf „offene Punkte" hingewiesen
  („Übergeben ist trotzdem möglich"), der Meldekopf erfährt davon im Dialog
  nichts.

**Erwartung der Rolle:** Der Dialog nennt, was die Zahl wert ist („davon 7
Sollplätze ohne Namen"), bevor der Meldekopf entscheidet; **Annahme:** der
Meldekopf will keine Soll- als Iststärke in der Summe, soweit er es nicht bewusst
tut.

**Folge:** Gering. Die Karte kennzeichnet es danach, die Stärke ist rückgängig zu
machen. Wer „Aufnehmen" tippt, ohne die Karte zu lesen, hat 9 statt 2 Personen in
der Summe. Verwandt: R9-K1 (Lagemonitor und Kachel zählen Sollstärke ohne Marke).

**Empfehlung:** Dieselbe Marke im Empfangsdialog („Stärke 0 / 2 / 7 / 9, davon 7
Sollplätze ohne Namen").

**Nachprüfung:** Link des Bogens mit neun leeren Plätzen aufnehmen: Der Dialog
nennt die Sollplätze vor „Aufnehmen".

## Verweise auf andere Berichte

Befunde, die ich selbst gemessen oder beobachtet habe und die ein anderer
Runde-9-Bericht schon führt; sie stehen hier nur als Verweis.

- **„Zwischensummen nach Zug (2 Züge)" zählt „Ohne Zug" mit** (R9-K4 in
  `fuehrungssicht.md`): Bei einem Zug und vier Einheiten ohne Zug steht „2 Züge".
- **Zug-Schreibweisen** (R9-E6 in `fehler-und-wiederanlauf.md`): „1.ZUG" und
  „1. zug" gehen im Abgleich zu einem Zug „1. Zug" auf (gemessen: 1 Zug, 2
  Einheiten, Stärke 1 / 4 / 11 / 16, vier Einheiten „Ohne Zug").
- **Tipp-Schutz** (R9-S2 in `stress-und-unterbrechung.md`, R9-H5 in
  `feldtauglichkeit.md`): Ein zweites „Weiter" 0,6 s nach dem Seitenwechsel und
  „Für neuen Einsatz vorbereiten" 1,2 s nach dem Öffnen von „Bogen übergeben"
  blieben ohne Wirkung und ohne Rückmeldung, nach 2,2 s wirkten sie.
- **Hinweiskasten zum beschädigten Gesamttext** (R9-M6, R9-N4, R9-S4, R9-H4):
  „Neuen Bogen erstellen" steht bei 360 × 640 unter dem Kasten; ich habe den Kasten
  nicht auf Wortlaut geprüft.
- **Rohtext-Rettung ohne Rückweg in die App** (R9-A1 in `analog-first.md`,
  R9-E4): Ich habe sie als halten bestätigt (siehe „Bestätigtes"); den Rohtext in
  die Sammlung zurückholen kann man nicht, nur aus der Sicherung lesen.
- **Manuelle Aufnahme verliert „Eingetroffen um", „Nr." und „Zug" beim Neuladen**
  (R9-S1): nicht von mir nachgestellt.
- **Lagemonitor bei großer Systemschrift** (R9-K2, R9-M1, R9-N2): Am Telefon stand
  die Tabelle mit F / U / M im Bild (siehe „Bestätigtes").

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Von der Startseite bis zur Übergabe (Einheit):** Neuer Bogen mit Vorbelegung,
  Warnung „Der Name der eigenen Einheit fehlt" in Schritt 1, Schrittleiste mit
  „offen"/„noch leer" je Schritt, Übersicht mit „5 offene Punkte … antippen zum
  Beheben", „Bogen übergeben… / In Einsatz-Sammlung ablegen… / Als Vorlage
  speichern / Bogen schließen". „Link geteilt 06:46 Uhr — Empfang nicht bestätigt."
  nach „Link teilen", „PDF erzeugt … Empfang nicht bestätigt" nach der PDF.
- **Rückfrage bei der Nachmeldung (R7-W1, R7-W3):** „Geändert: Diesel 80 l → 120 l ·
  Ort / Auftrag geändert", Erklärsätze unter jeder Wahl, bei älterem Stand
  zusätzlich „Nur in die Historie legen" und der Satz zum älteren Stand; bei 360 ×
  640 sitzt „Abbrechen" im festen Fuß bei 563 bis 607 px, nichts liegt darunter.
- **„Nur in die Historie legen" (R8-W2):** Quittung „Meldung … aufgenommen (nur in
  die Historie gelegt — die bisherige Fassung (24.10.2026, 06:46) gilt weiter, die
  Lage bleibt unverändert)"; die Karte trägt kein „neue Fassung"; Summe und
  „Diesel 80 l" bleiben.
- **„Als neue Fassung anhängen":** Karte „neue Fassung · Folgem.", „Folgemeldung 24.10.2026,
  06:49 (vorher Stand 24.10.2026, 06:46): Diesel 80 l → 120 l · Ort/Auftrag: „Deich
  Süd"", Historie (3).
- **Papier-Abgleich (R8-W1):** Rückfrage „Nummer schon vergeben — Nr. 2 trägt schon
  THW Bamberg …, nicht Teil des Abgleichs … Trotzdem übernehmen?" mit „Übernehmen"
  und „Abbrechen"; danach „Abgleich übernommen – zwei Hinweise" mit allen fünf
  Verschiebungen („THW Bamberg … 2 → 3, THW Ulm … 3 → 4, … THW Albstadt … 6 → 2")
  und „Lageblatt neu drucken". Die Liste danach: 1 Hamburg Mitte, 2 Albstadt, 3
  Bamberg, 4 Ulm, 5 Oberhausen-Rheinhausen, 6 Crailsheim. Danach der Hinweis
  „Abgeglichen bis auf die Eintreffzeit: 4 Einheiten … Eintreffzeiten nachtragen…".
- **Dialog „In Einsatz-Sammlung ablegen" (R8-W3):** „Dein Bogen wird als Meldung
  abgelegt. Danach öffnet die Sammlung; dein Bogen bleibt unter „Fortsetzen" auf
  der Startseite geöffnet. … Ist die Einheit dort schon gemeldet, wird nachgefragt";
  nach dem Tipp steht die Sammlung im Bild, Browser-Zurück bringt den Bogen mit
  „Meldung … aufgenommen. Dein Bogen bleibt geöffnet".
- **Leere Sollplätze (R8-W4):** Nach „Namen einfügen…" mit fünf Namen steht an der
  Warnung „4 leere Plätze entfernen"; die Quittung „5 Namen übernommen — 5 davon in
  freie Sollplätze. Rückgängig". Die Vorschau zeigt die Lesart („Hannes, Fuchs · →
  Platz 1: GrFü").
- **Eigener Bogen in der Sammlung (R8-W5):** „Dein eigener Bogen „THW Albstadt …" ist
  noch offen. Bogen fortsetzen" in der Sammlung, auch nach dem Neuladen.
- **Lageblatt (R8-W6):** Nach „Abrücken" steht nur noch „Lageblatt erstellt 07:00 ·
  seitdem 1 Änderung (Abrücken) — Aushang ist nicht mehr aktuell, neu drucken";
  das grüne „✓ Lageblatt erzeugt" ist weg. Die Startseite führt „Lageblatt …
  (seitdem 1 Änderung (Abrücken)) — neu drucken · Export: noch keiner".
- **CSV nach Nr.:** „Übersicht als CSV" beginnt mit „Nr.;Einheit;Teil;Organisation;
  Zug;…", Zeilen 1 bis 6 in Nummernfolge, Summenzeile „Summe (6 Einheiten)".
- **Sprungmarke (R8-M1):** Unterkante −8 px bei 360 × 640 (100 % und 200 %) und 320
  × 568 mit 200 %; mit Tab wird „Zum Inhalt springen" fokussiert, Enter setzt den
  Fokus auf `main#inhalt`.
- **Rohtext-Rettung (R8-D1/H1):** Abgeschnittener Text, Objekt statt Liste in
  `eeb.einsaetze.v1` und abgeschnittener Text in `eeb.vorlagen.v1`: Beim Start
  steht „Nicht lesbar: 1 beschädigter Gesamttext …", `eeb.unlesbar.v1` trägt den
  Rohtext unter `texte` (450 Zeichen, bleibt nach dem Neuladen), `eeb.einsaetze.v1`
  steht auf `[]`. „Daten sichern…" speichert „eeb-sicherung-2026-10-24.json" mit
  dem Rohtext; „Beiseitegelegtes entfernen…" fragt vor dem Löschen und nennt die
  Sicherung.
- **Entwurfsanonymisierung (R8-E3):** 20 und 75 Tage alt: kein Hinweis; 85 Tage:
  „Namen werden am 29.10.2026 anonymisiert (noch 5 Tage) — vorher weitergeben oder
  sichern; Bearbeiten beginnt die Frist neu."; 95 Tage: „Datenschutzfrist
  abgelaufen: Namen, Funktionen und Erreichbarkeiten wurden am 19.10.2026
  anonymisiert."
- **„Für neuen Einsatz vorbereiten":** Zweite Rückfrage nennt Zeitraum, Ort und
  Sofortbedarf, „Das lässt sich hier nicht zurücknehmen — wer die Angaben noch
  braucht, gibt den Bogen vorher weiter", „Zurücksetzen / Abbrechen, Bogen
  behalten"; danach Schritt 2 mit „Einsatzdaten für den neuen Einsatz
  zurückgesetzt — Ort/Auftrag eintragen. Personal und Fahrzeuge sind geblieben.".
- **Schnellerfassung:** „Einheit schnell erfassen — für welche Sammlung?", danach
  Schritt 1 und gleich „Nur Stärke" in Schritt 3, „In Einsatz übernehmen" in beiden
  Schritten; Übernahme „THW OV Schnelldorf Bergungsgruppe · jetzt 7 Einheiten,
  Gesamt 68" (59 + 9).
- **Lagemonitor am Telefon (R8-K1/M4):** Bei 360 × 640 und 320 × 568 stehen in der
  Tabelle Orga, Ort, Funkruf, F, U, M im Bild (kein Einheitentyp), „Eingetroffen:
  … vor 1 Min", „+ 3 weitere Bewegungen", keine Personennamen.
- **Zwei-Fenster-Leiste bei Personal und Fahrzeugen:** „Personal (1 Eintrag: Lang,
  Sabine → Neumann, Sabine)", „Fahrzeuge (1 Eintrag: FüKW (THW-80101) → FüKW
  (THW-99999))", Wahl „Anderen Stand laden / Meine Fassung behalten", Hinweis auf
  „Zuletzt geschlossener Bogen". Bloßes Öffnen im zweiten Fenster und Wechsel in
  einen Schritt ohne Änderung lösen keine Leiste aus.
- **Verlauf:** „Schließen" des Dialogs „Bogen übergeben", nach 0, 150, 400 und
  1 700 ms gefolgt von Browser-Zurück, führt jedes Mal auf dieselbe Seite
  (Startseite), nie zu weit; kein Dialog bleibt offen.
- **Kein Verlust durch „Abrücken":** „Abgerückt 07:00: Nr. 1 „THW Hamburg Mitte …"
  Rückgängig" erscheint nach einem Tipp, der Zähler steht auf 5 zählend.

## Abgleich mit Runde 8

Geprüft gegen `runde-8/arbeitsablauf.md` samt „Stand der Behebung" und gegen die
„Bekannten Grenzen".

| Befund Runde 8 | Stand in Runde 9 | Beleg |
| --- | --- | --- |
| R8-W1 Papier-Abgleich: Nummern verschieben sich, Rückfrage nennt sie nicht (P2) | **hält** | Rückfrage bei Nummer einer nicht beteiligten Einheit; nach der Übernahme alle fünf Verschiebungen mit alter und neuer Nummer. |
| R8-W2 „Nur in die Historie" liest sich wie Änderung der Lage (P3) | **hält** | Keine Marke „neue Fassung", Quittung „die Lage bleibt unverändert", Summe unverändert. |
| R8-W3 Dialog „In Einsatz-Sammlung ablegen": „hier" (P3) | **hält** | Dialogtext nennt, dass die Sammlung öffnet und der Bogen unter „Fortsetzen" bleibt. |
| R8-W4 Warnung oben, „Vorbelegung entfernen" 2 950 px tiefer (P3) | **hält** | „4 leere Plätze entfernen" bei y = 867 px, an der Warnung; „Vorbelegung entfernen" bleibt unten als zweiter Weg. |
| R8-W5 Sammlung ohne Hinweis auf eigenen Bogen (P3) | **hält** | „Dein eigener Bogen … ist noch offen. Bogen fortsetzen" auch nach dem Neuladen. |
| R8-W6 „✓ Lageblatt erzeugt" steht nach Abrücken (P3) | **hält** | Häkchen verschwindet; Startseite trägt „— neu drucken". |
| R8-D1/H1 Beschädigter Gesamttext wird still zu `[]` (Verweis) | **hält** | `eeb.unlesbar.v1` mit Rohtext, Hinweiskasten, Sicherung enthält den Rohtext. Offen bleiben Wortlaut und Rückweg (R9-H4, R9-A1). |
| R8-N6/E4 Zwei-Fenster-Rückfrage ohne Werte (Verweis) | **teilweise** | Personal und Fahrzeuge mit Werten, Ort/Auftrag und Diesel ohne (R9-W2). |
| R8-G1/M2 Rückfragen bei 200 % (Verweis) | **teilweise** | Rumpf rollt, Knöpfe untereinander, Fuß fest; beim Öffnen keine Wahl ganz im Bild (R9-W1). |
| R8-A3 Umschrift im Papierfeld (Verweis) | **hält mit Rest** | Feld „Marija Ivanova (Umschrift)"; Liste und Quittung unverändert (R9-W3). |
| R8-N5 „n. Zug" normalisiert (Verweis) | **hält** | „1.ZUG" und „1. zug" ergeben einen Zug „1. Zug"; Rest R9-E6. |
| R8-A2 CSV nach Nr. (Verweis) | **hält** | Spalte „Nr." vorn, Zeilen 1 bis 6. |
| R8-M1 Sprungmarke (Verweis) | **hält** | Unterkante −8 px in allen drei Lagen. |
| R8-E3 Ankündigung der Anonymisierung (Verweis) | **hält** | Hinweis ab 85 Tagen mit Datum und Resttagen. |
| R8-K1/M4 Lagemonitor am Telefon (Verweis) | **hält** | F / U / M im Bild bei 360 und 320 px. |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 8 vermerkt. |
| R7-G4 / M8 Ecken-Knopf hochkant (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 8 vermerkt. |
| R7-G8 / H9 Geräteuhr-Warnung bei 200 % und 320 × 568 (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 8 vermerkt. |
| R7-N1 kein Zusammenführen-Tipp (bekannte Grenze) | unverändert | Bei „Einheit ist bereits gemeldet" und beim Papier-Abgleich kein Tipp zum Zusammenführen. |
| R7-N9 Ziffern der Schrittleiste (bekannte Grenze) | unverändert | Reiter tragen „1" bis „6"; relevant für R9-W4. |
| R8-A1 Sollstärke zählt mit, mit Marke (bekannte Grenze) | unverändert | Karte „Sollstärke, nicht gemeldet", „Gesamt 9" zählt mit; Empfangsdialog ohne Marke (R9-W5). |
| R8-M6 klebende Namensspalte 37–42 % (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 8 vermerkt. |
| R8-H5/S4 Prellschutz 450/800 ms (bekannte Grenze) | unverändert | Zweites „Weiter" nach 0,6 s und „Für neuen Einsatz vorbereiten" nach 1,2 s ohne Wirkung und ohne Rückmeldung. |

**Nebenwirkungen der Runde-8-Änderungen auf den Arbeitsablauf:**

- **Neue Rückfrage „Nummer schon vergeben":** Sie öffnet zusätzlich vor „Abgleich
  übernommen – zwei Hinweise"; zwei Dialoge hintereinander, beide mit klarem
  Wortlaut. Keine Nebenwirkung gefunden.
- **Rückfragen mit festem Fuß:** Wirken im Querformat und bei großer Schrift wie
  ein Dialog, der nur „Abbrechen" anbietet (R9-W1).
- **Rohtext-Rettung:** Der Rohtext bleibt auch nach dem Neuladen in
  `eeb.unlesbar.v1`; `eeb.vorlagen.v1` behält den beschädigten Text weiter im
  Speicher (R9-E4).
- **Sollstärke-Marke:** Wirkt an Karte und Tabelle, nicht im Empfangsdialog
  (R9-W5).
- **Umschrift im Papierfeld:** Die Quittung zum Feld ist nicht mitgezogen
  (R9-W3).
- **Verlauf:** keine Nebenwirkung gefunden.

## Abschluss

Der Arbeitsablauf von der Einheit über den Meldekopf bis zum zweiten Gerät und zum
Papier lässt sich ohne fremde Hilfe durchlaufen. Die sechs Befunde aus Runde 8 zum
Ablauf halten, ebenso Rohtext-Rettung, Sprungmarke, CSV nach Nr., Zug-Normalisierung
und der Hinweis vor der Anonymisierung. Offen bleiben kleine Stellen: Rückfragen,
die im Querformat und bei großer Schrift ihre Wahlen erst nach dem Rollen zeigen
(R9-W1), Zwei-Fenster-Hinweise ohne Werte bei Ort und Diesel (R9-W2), eine
Umschrift, die nur im Feld und nicht in der Liste steht (R9-W3), ein fehlender
Rückweg zur Übersicht (R9-W4) und ein Empfangsdialog ohne Sollstärke-Hinweis
(R9-W5).

Befunde: 0 × P0, 0 × P1, 1 × P2, 4 × P3.

- **Aufgabe geschafft:** ja. Einheit → Übergabe (Link, PDF) → Meldekopf →
  Nachmeldung (neuer und älterer Stand) → Zug, Auftrag, Abrücken, Lageblatt →
  Papier-Abgleich → Schnellerfassung ließen sich durchlaufen.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Im Querformat oder bei großer Schrift hält der
  Meldekopf „Abbrechen" für die einzige Antwort der Rückfrage zur Nachmeldung
  (R9-W1).
- **Größtes Einsatzrisiko:** Der Meldekopf bricht eine Nachmeldung ab oder nimmt
  Sollplätze als Iststärke auf, weil Rückfrage und Empfangsdialog die Entscheidung
  nicht im ersten Bild tragen (R9-W1, R9-W5).
- **Top-Priorität für die nächste Iteration:** Die Wahlen der Nachmeldungs-Rückfrage
  vor die Vergleichszeilen stellen, damit „Als neue Fassung anhängen" beim Öffnen im
  Bild steht (R9-W1).
