# Audit „Stress und Unterbrechung", Runde 2 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, ohne Kamera. Getestet habe ich zuerst
ohne Blick in frühere Berichte. Den Runde-1-Bericht, die Tabelle „Stand der
Behebung" und die anderen Runde-2-Berichte habe ich erst danach gelesen. Die
meisten Zustände sind durch Bedienung entstanden. Mit `localStorage`-Seeds
habe ich nur eigene Entwürfe vorbelegt: `eeb.entwurf.v1` mit
`examples/thw/013-ulm-b.json` (8 Personen mit Namen), einmal als Übung, einmal
mit `uebung: false` und 3 bzw. 60 Tage altem Speicherzeitpunkt.

Rolle: ein Gruppenführer, der zwischen Fahrzeug, Funk und Meldekopf jeweils
10 bis 20 Sekunden für einen Bildschirm hat, und ein Helfer am Meldekopf, bei
dem mehrere Einheiten kurz hintereinander ankommen. Gezählt habe ich Tipps und
Eingabefelder auf dem kürzesten Weg. Echte Bedienzeiten lassen sich im Skript
nicht messen; die Zeiten der Automatisierung (unter 2 s je Einheit) sagen
nichts über einen Menschen aus und werden nicht gewertet.

Szenarien:

1. **Zeitdruck, Meldekopf:** Sammlung „Hochwasser Test" → drei Einheiten
   hintereinander über „Einheit manuell erfassen…" → Name → „3. Personal" →
   „Nur Stärke" → F/UF/M → „In Einsatz übernehmen". Dasselbe zweimal über
   „Einheit schnell erfassen (nur Stärke)…" von der Startseite.
2. **Parallele Ankunft:** vier Bögen auf einmal über „Bögen einlesen…"; drei
   Handscanner-Eingaben derselben Einheit hintereinander (Link aus „Link
   teilen" als Tastatureingabe in den Scanner getippt), zuletzt mit
   veränderter Stärke; Doppeltipp auf „In Einsatz übernehmen"; dieselbe
   Einheit zweimal manuell.
3. **Unterbrechung:** Neuladen mitten in der Einsatz-Erfassung (Schritt 3,
   Stärke halb eingetragen); Neuladen 150 ms nach dem letzten Tastendruck im
   eigenen Bogen; Tab-Wechsel; Browser-Zurück; „‹ Einsatz ‚…'" mitten in der
   Erfassung und neu anfangen; „Zug zuordnen" halb eingetippt und Ansicht
   verlassen.
4. **Beides auf einem Gerät:** eigener Bogen angefangen bzw. vollständig
   (8 Namen), dann am selben Telefon fremde Einheiten erfassen.
5. **Wiedereinstieg nach Tagen:** eigener Entwurf 60 Tage alt, Einsatz vom
   Juli, dann „Fortsetzen" → „Bogen übergeben…" → QR-Vollbild.
6. **Flüchtiger Blick:** Einsatzansicht mit 3 bzw. 7 Einheiten im Thema
   Standard und Feld, erstes Bild (640 px) nach dem Öffnen und nach jeder
   Aufnahme.
7. **Lange Texte:** Wortzahl der Dialoge „Bogen übergeben", „Meldung
   entfernen?", „Einsatz löschen?", Scanner ohne Kamera.

Nicht prüfbar: echter Lärm, echte Unterbrechung durch Personen, der
Kamera-Scan mit echtem Bild, die Bildschirmtastatur (sie verdeckt auf einem
Telefon zusätzlich einen Teil der gemessenen Flächen) und die nativen Builds.
Der Handscanner wurde nur als Tastatureingabe nachgebildet.

## Urteil

Der eigene Bogen ist unter Stress robust: Jeder Tastendruck ist gesichert, auch
150 ms vor dem Neuladen. Tab-Wechsel kostet nichts, Browser-Zurück geht einen
Schritt zurück, und „Fortsetzen" steht nach dem Neuladen oben. Der Stapel am
Meldekopf hält nicht mehr an: Derselbe Bogen dreimal gescannt ergibt eine
Meldung und zweimal „Bereits vorhanden — übersprungen", eine veränderte
Fassung wird ohne Rückfrage mit „Folgemeldung: Stärke 8 → 7" quittiert.
Doppeltipp erzeugt keine Doppelmeldung, und die Dialoge sind kurz (17 bis
31 Wörter).

Die Reibung liegt jetzt dort, wo zwei Aufgaben auf einem Telefon
zusammentreffen oder ein alter Zustand wieder auftaucht. Wer am selben Gerät
den eigenen Bogen führt und am Meldekopf zwei Einheiten aufnimmt, verliert den
eigenen Bogen. Das habe ich unabhängig nachgestellt, es ist bereits als
R2-N1/R2-E1 gemeldet. Ein zwei Monate alter Entwurf geht mit drei Tipps als
„✓ vollständig und plausibel" in den QR-Code, samt Auftrag und Zeitraum vom
Juli (R2-S1). Am Meldekopf sind der schnelle und der richtige Weg zwei
verschiedene Wege (R2-S2). Die Aufnahme-Knöpfe liegen unter dem ersten Bild,
und nach jeder Aufnahme springt die Ansicht an die Karte, weg von Knopf und
Summe (R2-S3).

Die Kernaufgaben gelingen ohne fremde Hilfe. Am Meldekopf geht es mit
Umwegen, wer zugleich den eigenen Bogen führt, verliert ihn.

## Befunde

### R2-S1 [P1] Alter Entwurf geht mit drei Tipps als „vollständig und plausibel" in den QR-Code (neu; Umfeld R2-O3, R2-E4, R2-N4)

**Priorität:** P1

**Nachweis:** beobachtet (Seed eines echten Beispielbogens mit
`uebung: false`, Speicherzeitpunkt 60 Tage zurück).

**Fundstelle / Aufgabe:** Startseite → Entwurfskarte „THW Ulm
Bergungsgruppe" → „Fortsetzen" → Gesamtübersicht → „Bogen übergeben…" →
„QR-Code im Vollbild zeigen".

**Beobachtung:** Die Karte sagt „Stärke 0 / 2 / 6 / 8 · gespeichert 13:15
Uhr", ohne Datum. Nur die Zeile darunter nennt „Entwurf vom 30.07.26"
(zum Zeitstempel selbst siehe R2-O3). Nach „Fortsetzen" meldet die Übersicht
„✓ Alle Angaben vollständig und plausibel.", obwohl dort „Zeitraum
18.07.2026 – 22.07.2026" und „Ort / Auftrag: Gebäudeschaden Ulm — Abstützen,
Räumen" stehen, also Einsatzdaten von vor über zwei Monaten. Drei Tipps
später steht der QR-Code im Vollbild. Keiner der drei Bildschirme fragt, ob
das noch der aktuelle Einsatz ist, und das Vollbild nennt weder Einheit noch
Stand. Am Meldekopf hilft die Marke „alt" nicht als Gegenprobe, weil sie
derzeit an jeder Karte steht (R2-N4, siehe unten).

**Erwartung der Rolle:** Unter Zeitdruck tippe ich „Fortsetzen", weil das
mein Bogen ist. Ist er von einem anderen Einsatz, muss mir das auffallen,
bevor ich den Code zeige, nicht erst beim Meldekopf. Ein grüner Haken heißt
für mich: kann so raus.

**Auswirkung im Einsatz:** Der Meldekopf übernimmt Auftrag, Zeitraum und
Personalliste des Juli-Einsatzes als aktuelle Meldung. Wer inzwischen nicht
mehr dabei ist, steht trotzdem in der Stärke. Der grüne Haken bestätigt den
Fehler, statt ihn zu stoppen. Die Runde-1-Stärke des Schnellwegs über „Einsatz
vorbereiten" (neuer Zeitraum, leerer Auftrag) greift auf diesem Weg nicht,
und das ist genau der Weg, den ein gestresster Helfer nimmt.

**Empfehlung:** Liegt der Einsatzzeitraum oder der letzte Änderungszeitpunkt
nicht beim heutigen Tag, das auf Karte und Übersicht sichtbar sagen („Bogen
vom Einsatz 18.–22.07.") und im Übergabe-Dialog zuerst anbieten: „Für neuen
Einsatz vorbereiten" (wie aus der Vorlage) oder „So übergeben". Den Haken
„plausibel" nicht vergeben, solange der Zeitraum abgelaufen ist. Im
QR-Vollbild Einheit und Stand nennen.

**Verifikation:** Entwurf mit Zeitraum vor 60 Tagen öffnen, „Fortsetzen",
„Bogen übergeben…": Bevor der QR-Code erscheint, muss der alte Zeitraum
genannt und ein Weg zum neuen Einsatz angeboten werden.

### R2-S2 [P2] Am Meldekopf sind der schnelle Weg und der richtige Weg zwei verschiedene (neu; Umfeld R2-N6)

**Priorität:** P2

**Nachweis:** beobachtet, Tipps gezählt.

**Fundstelle / Aufgabe:** Drei Einheiten kurz hintereinander aufnehmen, nur
Stärke.

**Beobachtung:**
- **Weg über die Sammlung** („Einheit manuell erfassen…"): Er ist an die
  Sammlung gebunden („Aufnahme für: Hochwasser Test", „In Einsatz
  übernehmen"), startet aber jedes Mal auf Schritt 1 mit „Personal
  vollständig erfassen". „Nur Stärke" war bei keiner der drei Einheiten
  vorgewählt, auch nicht bei der zweiten und dritten direkt hintereinander.
  Je Einheit: 8 Tipps (Erfassen, Name, „3. Personal", „Nur Stärke", F, UF,
  M, Übernehmen), 4 Eingabefelder, zusammen 24 Tipps für drei Einheiten.
  Wer „Nur Stärke" vergisst, landet bei Karten mit Vor- und Nachname,
  Geschlecht und Fahrerlaubnis.
- **Weg über die Startseite** („Einheit schnell erfassen (nur Stärke)…"):
  „Nur Stärke" ist vorgewählt, aber der Weg kennt keine Sammlung. Je
  Einheit waren es 9 bis 10 Tipps: Er führt über „6. Übersicht" → „In
  Einsatz aufnehmen…" → Sammlung wählen. Ab der zweiten Einheit kommt vorher
  die Rückfrage „Der angefangene Bogen ‚THW Crailsheim' wird … ersetzt",
  obwohl Crailsheim längst abgelegt ist. Danach bleibt die fremde Einheit als
  „Dein Bogen" offen („Dein Bogen bleibt geöffnet — Startseite →
  ‚Fortsetzen'"), und „‹ Einsätze" führt zurück in diesen Bogen statt zur
  Startseite (R2-N7).

**Erwartung der Rolle:** Am Meldekopf gibt es *einen* Knopf „nächste Einheit":
Name, drei Zahlen, fertig, und die App weiß, in welche Sammlung das gehört.
Was ich eben gewählt habe („Nur Stärke"), gilt auch für die nächste Einheit.

**Auswirkung im Einsatz:** Bei drei ankommenden Einheiten gibt es mehr
Entscheidungen als nötig: welcher Weg, welcher Modus, welche Sammlung, und
auf dem Startseitenweg eine Ersetzen-Rückfrage, die man nach dem zweiten Mal
wegtippt. Genau diese weggetippte Rückfrage führt in R2-N1. Die Schlange am
Meldekopf wächst, und im vollen Personalmodus bleibt die Stärke 0, wenn der
Helfer nur die Namensfelder überspringt.

**Empfehlung:** In der Sammlung einen Knopf „Einheit schnell erfassen" mit
vorgewähltem „Nur Stärke", Name und F/UF/M auf *einer* Seite und
„Übernehmen & nächste Einheit". Den Startseiten-Knopf entweder auf die
zuletzt offene Sammlung zielen lassen oder zuerst die Sammlung wählen lassen
(wie R2-N6). Die letzte Moduswahl je Sammlung merken.

**Verifikation:** Drei Einheiten nur mit Stärke hintereinander aufnehmen:
höchstens 6 Tipps je Einheit, keine Rückfrage, kein offener Entwurf auf der
Startseite danach.

### R2-S3 [P2] Aufnahme-Knöpfe unter dem ersten Bild; nach jeder Aufnahme springt die Ansicht weg von Knopf und Summe (neu)

**Priorität:** P2

**Nachweis:** beobachtet, gemessen (Oberkante der Elemente, Seitenkoordinate).

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Test" beim Öffnen und
nach „In Einsatz übernehmen".

**Beobachtung:**

| Zustand | „Bogen scannen…" | „Einheit manuell erfassen…" | Beschriftung „Gesamt" | Einheitenliste |
| --- | --- | --- | --- | --- |
| 3 Einheiten, Standard | 691 px | 744 px | 407 px | 1 342 px |
| 3 Einheiten, Feld | 828 px | 890 px | 474 px | 1 686 px |
| 7 Einheiten (4 Übung), Standard | 862 px | 915 px | 578 px | 1 513 px |
| 7 Einheiten (4 Übung), Feld | 1 080 px | 1 143 px | 727 px | 1 938 px |

Bei 640 px Bildhöhe steht der Hauptknopf des Meldekopfs in keinem Fall im
ersten Bild. Mit Übungsmeldungen im Einsatz schiebt der Hinweis „4
Übungsmeldungen zählt nicht in diese Lage (THW Albstadt Zugtrupp …, THW
Karlsruhe …, THW Ulm …, THW Weinsberg …)" die Summen nach unten; im
Feld-Thema liegt dann auch „Gesamt" unter dem Bildrand. Der Hinweis wächst mit
jedem Namen. Nach „In Einsatz übernehmen" steht die Seite bei rund 1 445 px an
der neuen Karte. Das ist als Quittung gut, aber der Knopf für die nächste
Einheit liegt dann rund 700 px darüber, die Summe außerhalb des Bilds. Auch der
Einstieg in die Sammlung und in die Einsatz-Erfassung öffnet mitten auf der
Seite (283 px bzw. 494 px); in der Erfassung ist die Marke „Aufnahme für:
Hochwasser Test" dadurch nicht zu sehen (gleiche Ursache wie R2-H1).

**Erwartung der Rolle:** Beim Blick aufs Telefon: oben die Gesamtzahl, direkt
darunter „nächste Einheit". Nach dem Übernehmen sehe ich kurz die Quittung
und bin wieder am Anfang.

**Auswirkung im Einsatz:** Jede Aufnahme kostet zusätzlich ein Hochwischen
über gut ein Bild. Wer bei der Funkabfrage „wie viele sind da?" auf das
Telefon schaut, sieht eine Karte statt der Summe. Im Feld-Thema mit
Übungsmeldungen ist die Gesamtzahl beim Öffnen gar nicht im Bild.

**Empfehlung:** Die Aufnahme-Knöpfe direkt unter die Summenkacheln oder als
feste Leiste unten im Daumenbereich setzen. Nach dem Übernehmen die Quittung
mit Namen und neuer Gesamtzahl zeigen und oben bleiben. Den Übungshinweis auf
eine Zeile kürzen („4 Übungsmeldungen nicht gezählt — anzeigen").

**Verifikation:** Einsatzansicht bei 360 × 640 im Feld-Thema mit
Übungsmeldungen öffnen: Gesamtzahl und ein Aufnahme-Knopf müssen ohne
Scrollen sichtbar sein. Nach dem Übernehmen einer Einheit ebenso.

### R2-S4 [P3] Parallele Ankunft: Wer zuletzt kam, sieht man nicht auf einen Blick (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einheitenliste nach drei Aufnahmen innerhalb von
einer Minute und nach vier gleichzeitig eingelesenen Bögen.

**Beobachtung:** Die Liste ist voreingestellt nach „Name (A–Z)" sortiert.
Alle Karten tragen „neu", weil die Marke 30 Minuten gilt. Die Quittung „4
Bogen/Bögen aufgenommen." nennt keine Namen und sagt nicht, dass vier davon
Übungsbögen sind und nicht zählen. Das steht nur im Hinweis oben (R2-S3).

**Erwartung der Rolle:** Kommen drei Einheiten gleichzeitig, will ich prüfen:
Sind alle drei drin, und welche fehlt noch?

**Auswirkung im Einsatz:** Man sucht die zuletzt aufgenommene Einheit
alphabetisch oder stellt die Sortierung um. Gering, weil die App nach der
Einzelaufnahme selbst an die Karte springt.

**Empfehlung:** Während eines laufenden Einsatzes „Eintreffzeit (neueste
zuerst)" voreinstellen oder die zuletzt aufgenommenen Einheiten in der
Quittung mit Namen nennen („Aufgenommen: Albstadt, Karlsruhe, Ulm, Weinsberg —
alle vier Übung, nicht gezählt").

**Verifikation:** Vier Bögen gleichzeitig einlesen: Die Quittung nennt die
Namen, und ohne Umstellen stehen die vier oben.

## Bestätigt aus anderen Runde-2-Berichten

Unabhängig nachgestellt, hier nicht mitgezählt:

- **R2-N1 / R2-E1 [P0] Eigener Bogen geht verloren.** Eigener Bogen mit 8
  Namen per Seed, dann zweimal „Einheit schnell erfassen (nur Stärke)…" mit
  Ablegen in der Sammlung: Danach ist kein einziger Name des eigenen Bogens
  mehr im Gerätespeicher, obwohl beide Rückfragen „bleibt … erreichbar"
  versprechen. Ebenso über die Sammlung: eigener Entwurf → „Einheit manuell
  erfassen…" → „‹ Einsatz" (Unterbrechung) → erneut erfassen → übernehmen.
  Der Rückholplatz enthält danach die abgebrochene fremde Einheit, nicht den
  eigenen Bogen. Aus Stresssicht ist das das größte Risiko: Die zweite
  Rückfrage nennt eine fremde Einheit, die man unter Zeitdruck ohne Zögern
  bestätigt.
- **R2-E3 [P2] Neuladen in der Einsatz-Erfassung.** Neuladen auf Schritt 3
  führt zur Startseite mit „THW Crailsheim · Stärke 1 / 2 / 0 / 3 …
  Fortsetzen / Verwerfen" unter „Meinen Bogen ausfüllen"; „Fortsetzen" öffnet
  die Übersicht ohne „Aufnahme für" und ohne „In Einsatz übernehmen".
- **R2-N4 [P2] Marke „alt".** Sie stand an *jeder* Karte, auch an Einheiten,
  die Sekunden zuvor aufgenommen wurden (Stand 281300sep26, eingetroffen
  13:00). Technischer Hinweis für die Behebung, nicht Teil der
  Rollenbewertung: `standIstAlt` in `src/app/einheiten-tabelle.ts` zieht
  `bogen.stand` (Minuten seit 2020, `EebZeitpunkt`) von der Eintreffzeit in
  Millisekunden ab; die Bedingung ist dadurch immer erfüllt.
- **R2-N5 [P2] Verpflegung 0.** Drei Einheiten nur mit Stärke (52 gesamt):
  „Verpflegung 0 (0 vegetarisch / 0 vegan)", in der Erfassung zuvor „0 von 18
  … · 18 sonstige". Zusätzlich beobachtet: Legt man unter „Führungskraft /
  erreichbar für Rückfragen" eine (laut Hinweis „nicht gezählte") Person an,
  zeigt der Bedarf für diese Einheit mit Stärke 18 „Verpflegung 1" und
  „Unterbringung M 1".
- **R2-H4 [P2] Rückgängig beim Abrücken außerhalb des Bilds.** Nachgemessen:
  „Rückgängig" 74 × 30 px bei −1 487 px, nach 15 s unverändert dort.
- **R2-H1 [P1] Scrollposition beim Wechsel.** Siehe R2-S3 (Einstieg in
  Sammlung und Erfassung).
- **R2-O3 [P2] „gespeichert" ohne Datum.** Siehe R2-S1.

## Was gut funktioniert und erhalten bleiben sollte

- Sicherung bei jedem Tastendruck: Ortsangabe getippt, 150 ms später neu
  geladen, Text vollständig erhalten. Tab-Wechsel mitten in der Erfassung
  ändert nichts.
- Neuladen mit offener Sammlung öffnet wieder die Sammlung (nicht die
  Startseite).
- Stapel-Scan: Gleicher Inhalt → „Bereits vorhanden — übersprungen (gleicher
  Inhalt). 1 Bogen in diesem Durchgang."; veränderter Inhalt → „aufgenommen
  (Folgemeldung: Stärke 8 → 7) — 2 Bögen in diesem Durchgang", ohne Dialog,
  danach genau eine Karte mit „seit 181122jul26: Stärke 8 → 7".
- Doppeltipp auf „In Einsatz übernehmen" erzeugt keine zweite Meldung.
- Dieselbe Einheit manuell ein zweites Mal: kurze Rückfrage mit dem
  Normalfall zuerst („Als neue Fassung anhängen").
- Nach dem Übernehmen springt die Ansicht an die neue Karte mit „neu": Man
  sieht, dass die Einheit drin ist.
- Browser-Zurück geht in der Erfassung einen Schritt zurück, nicht aus der
  App.
- „Zug zuordnen" halb eingetippt, Ansicht verlassen, zurück: Zuordnung
  steht.
- Dialoge sind kurz: „Bogen übergeben" 31 Wörter mit QR und PDF oben,
  „Meldung entfernen?" 17, „Einsatz löschen?" 24. Der Scanner ohne Kamera
  zeigt „Kamera erneut versuchen / QR aus Bild einlesen… / Fertig" im ersten
  Bild.
- „Abrücken" wirkt ohne Rückfrage, die Karte bleibt durchgestrichen stehen,
  mit „Als anwesend" an der Karte.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen melden: ja (3 Tipps von der
  Startseite bis zum QR-Vollbild). Meldekopf mit mehreren Einheiten: mit
  Umwegen (8 bis 10 Tipps je Einheit, Hochwischen nach jeder Aufnahme).
  Eigener Bogen plus Meldekopf auf einem Telefon: nein, der eigene Bogen ging
  verloren (R2-N1/R2-E1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Fortsetzen" wirkt wie „mein aktueller
  Bogen", und die Übersicht bestätigt mit grünem Haken auch einen Bogen vom
  Einsatz vor zwei Monaten (R2-S1).
- **Größtes Einsatzrisiko:** Zwei schnelle Aufnahmen am Meldekopf löschen
  den eigenen Bogen, weil die zweite Rückfrage nur eine fremde Einheit nennt
  (R2-N1/R2-E1, hier bestätigt). Unter den eigenen Befunden: ein alter Bogen
  geht als aktuelle Meldung durch (R2-S1).
- **Top-Priorität für die nächste Iteration:** Fremde Aufnahmen dürfen den
  eigenen Bogen nie verdrängen (R2-N1). Danach ein einziger
  Meldekopf-Schnellweg in der Sammlung mit „Nur Stärke" und „Übernehmen &
  nächste Einheit" (R2-S2).

## Abgleich mit Runde 1

Grundlage: [../stress-und-unterbrechung.md](../stress-und-unterbrechung.md)
und [../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| S1 Stapel hält beim zweiten Scan an | bestätigt behoben | Handscanner-Eingabe (als Tastatureingabe nachgebildet) dreimal derselbe Bogen: einmal aufgenommen, zweimal „Bereits vorhanden — übersprungen", kein Dialog. Veränderte Fassung: Quittung „Folgemeldung: Stärke 8 → 7", eine Karte mit Historie. Kamera-Scan nicht prüfbar. |
| S2 Fremder Bogen als Entwurf nach Unterbrechung | teilweise | Neuladen mit offener Sammlung öffnet die Sammlung. Neuladen *während* einer Einsatz-Erfassung legt die fremde Einheit weiter als „Meinen Bogen" auf die Startseite (R2-E3). Die Schnellerfassung von der Startseite lässt die fremde Einheit nach dem Ablegen als „Dein Bogen" offen (R2-N6, R2-S2). |
| S3 Sieben plausible Fehlgriffe | teilweise | Behoben: Kopf „‹ Einsatz ‚…'" in der Einsatz-Erfassung, Browser-Zurück schrittweise, „Einsatz weitergeben / sichern" als eigener Knopf, „Neue Einsatz-Sammlung…". Offen oder neu: „‹ Einsätze" führt in einen offenen Entwurf (R2-N7), Abrück-Quittung außerhalb des Bilds (R2-H4), Startseiten-Schnellerfassung ohne Sammlungsbezug (R2-N6, R2-S2). „Nur Stärke" mit vorhandenen Karten (D2) habe ich nicht erneut geprüft, siehe R2-D-Bericht. |
| S4 Lange Texte | bestätigt behoben (Rest in R2-H6) | Übergabe-Dialog 31 Wörter, QR und PDF oben; Scanner ohne Kamera kompakt mit Ausgängen im ersten Bild. Die eingeklappte Datenschutzfrist auf Schritt 2 habe ich nicht eigens geprüft. Bei vielen offenen Punkten rutscht die Übergabe laut R2-H6 wieder nach unten. |
| S5 Inline-Formulare vergessen Eingaben | bestätigt behoben | „1. Zug" eingetippt, zur Startseite und zurück: Zuordnung steht. |

Einordnung der eigenen Befunde: R2-S1 bis R2-S4 sind neu. R2-S1 berührt
R2-O3 (Zeitstempel), R2-E4 (Zeitraum-Plausibilität) und R2-N4 (Marke „alt"),
beschreibt aber den Stressweg „Fortsetzen → Übergeben" als Ganzes. R2-S2
berührt R2-N6. Die unter „Bestätigt aus anderen Runde-2-Berichten"
genannten Befunde sind nicht mitgezählt.

Bilanz: Von fünf Runde-1-Befunden sind drei bestätigt behoben (S1, S4, S5),
zwei teilweise (S2, S3). Weiterhin offen ist keiner vollständig. Was aus S2
und S3 übrig bleibt, fällt mit dem schwersten Runde-2-Befund zusammen: Am
Meldekopf gerät eine fremde Einheit in den Platz des eigenen Bogens
(R2-N1/R2-E1).
