# Audit „Stress und Unterbrechung“, Runde 6 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde. Die Prüfung begann am 17.10.2026 und wurde am 23.10.2026
nach einer Unterbrechung (Server neu gestartet, gleicher Build) zu Ende
geführt. Die zwei späteren Commits auf `main`, die nur den Lagemonitor
ändern, sind im geprüften Build nicht enthalten.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px (für die Tastaturnachstellung 360 × 380 px),
`isMobile`/`hasTouch`, Locale de-DE, ohne Kamera. Jeder Ablauf lief in einem
eigenen Browser-Kontext, damit die elf anderen Prüfer am selben Server nicht
hineinwirken. Doppeltipps und Tipp-Reihen mit `touchscreen.tap` an derselben
Bildstelle (Abstände 60 bis 1 800 ms), Zurück-Geste mit `page.goBack()`, zwei
Fenster als zwei Seiten im selben Kontext. Der Seed wurde je Kontext genau
einmal geschrieben, nie in jedem neuen Tab (sonst Scheinkonflikte). Der Server
war ausgelastet; Zeitangaben sind Abstände im Skript, keine Bedienzeiten.

Getestet habe ich zuerst ohne Blick in frühere Berichte, gezielt an den in
Runde 5 umgebauten Stellen: QR-Vollbild (Doppeltipp auf „Weiter zu Teil n“,
1,5-s-Regel, „übergeben“ erst nach Bestätigung), „Einen Moment …“ bei
verworfenem Tipp, „Person entfernen“ in Karten und Kurz-Liste mit
„Rückgängig“, Zurück-Geste bei offenen Rückfragen auf der Startseite, zwei
Fenster mit „Meine Fassung behalten“ und der festen Konfliktwarnung, „Wohin
damit?“ nach Neuladen, die Leiste „◐ Ansicht“ in der Einsatzansicht. Danach
habe ich den Runde-5-Bericht samt „Stand der Behebung“ und die Runde-5-README
gelesen und die Behebungen einzeln gegengeprüft, zuletzt die vorliegenden
Runde-6-Berichte.

Zustände über `localStorage`-Seeds aus `examples/thw/`, jeweils mit
`uebung: false` und auf den Prüftag datiert (Stand, Einsatzzeitraum):
`eeb.entwurf.v1` mit 001 Albstadt, mit dem Großbogen
`grossbogen-verstaerkter-bergungszug.json` (7 QR-Teile) und mit 005
Haßmersheim; `eeb.einsaetze.v1` mit der Sammlung „Hochwasser Test“ (2 bis 5
Einheiten aus 001, 003, 005, 007, 010). Der Bogen-Link für 002 Biberach/Riß
stammt aus „Bogen übergeben… → Weitere Formate → Link teilen“ der App selbst.
Skripte und Screenshots liegen im Scratchpad unter `runde6/stress/`.

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, die echte
Bildschirmtastatur (nur als verkleinerter Viewport nachgestellt), die
Zurück-Geste der installierten PWA und der nativen Builds (nur
`page.goBack()`), echte Doppeltipps mit Handschuh (Abstand und Trefferfläche
nachgestellt), Kamera und Handscanner, Messenger-Verhalten beim Öffnen eines
Links (nur `location.hash` und `goto` nachgestellt), echte Bedienzeiten unter
Last, Hintergrund-Beenden des Tabs durch das Betriebssystem (nur Neuladen),
WebKit/Safari. Nicht erneut gemessen: Tipp-Reihe im Takt von 0,7 s auf
„Weiter →“ (R5-S2, nur die Doppeltipp-Abstände) und der Lagemonitor (gehört zu
anderen Berichten).

## Urteil

Die Runde-5-Umbauten halten. Im QR-Vollbild nimmt „Weiter zu Teil n“ bei zwei
Tipps bis 1 200 ms Abstand nur den ersten an, ein zu kurz gezeigter Teil zählt
nicht, und am Ende fragt die App „Hat die Gegenstelle alle 7 Teile
gescannt?“ mit „Ja, gescannt — übergeben“ erst nach allen Teilen. „Person
entfernen“ lässt bei fünf Nachtipps im Abstand von 150 bis 1 000 ms genau
eine Person verschwinden; „Rückgängig“ holt auch zwei Personen gemeinsam
zurück. Die Rückfragen der Startseite schließen mit Zurück, ohne die App zu
verlassen. „Meine Fassung behalten“ legt den Stand des anderen Fensters auf
den Rückholplatz, und „Wohin damit?“ überlebt das Neuladen.

Reibung bleibt an zwei Stellen, an denen die Entscheidung bei zwei Fenstern
blind fällt: „Stand aus dem anderen Fenster laden“ wirft ohne Rückfrage weg,
was man nach der Warnung im eigenen Fenster noch getippt hat (R6-S1), und die
Warnung sagt nicht, welcher Stand der vollständigere ist (R6-S2). Dazu drei
Reste: Zurück schließt die Informationsfenster der Startseite nicht, sondern
verlässt die App (R6-S3), „Rückgängig“ nach „Person entfernen“ gilt nur bis
zum nächsten Schrittwechsel (R6-S4), und die Ansicht-Leiste der
Einsatzansicht öffnet ihre Wahl über der Hauptaktion (R6-S5).

Die Kernaufgaben gelingen ohne fremde Hilfe, auch mit Unterbrechungen und
hektischem Tippen. Kein P0 und kein P1: Daten gehen nur verloren, wenn man in einem zweiten
Fenster weiterarbeitet und dann „laden“ wählt.

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Stand aus dem anderen Fenster laden“ klingt
  nach „aktualisieren“, verwirft aber still die eigene, nach der Warnung
  getippte Arbeit (R6-S1).
- **Größtes Einsatzrisiko:** Zwei Fenster, in beiden weitergearbeitet, dann
  die falsche Fassung gewählt, ohne dass die Warnung sagt, welche mehr
  enthält (R6-S1, R6-S2).
- **Top-Priorität für die nächste Iteration:** Vor „Stand aus dem anderen
  Fenster laden“ die eigenen ungespeicherten Eingaben auf den Rückholplatz
  legen oder vorher fragen (R6-S1).

## Befunde

### R6-S1 [P2] „Stand aus dem anderen Fenster laden“ verwirft ohne Rückfrage, was nach der Konfliktwarnung im eigenen Fenster getippt wurde (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (Feldinhalt vor und nach „laden“, Speicher und
Rückholplatz; Skript `t46`).

**Fundstelle / Aufgabe:** Zwei Fenster mit demselben Entwurf, Konfliktwarnung
(„⚠ Dieser Bogen wurde in einem anderen Fenster geändert …“), Knopf „Stand aus
dem anderen Fenster laden“. Code: `src/app/fenster-abgleich.tsx`
(`FensterKonflikt`), `src/app/feste-warnung.tsx`.

**Beobachtung:** Fenster B ändert den Einsatzort („ … [B]“). Fenster A zeigt
die Warnung mit dem Satz „Eingaben hier werden erst wieder gespeichert, wenn du
entscheidest.“ Ich tippe in A weiter („ … [A-viel-Arbeit-nach-Konflikt]“; im
Speicher steht davon nichts) und wähle „Stand aus dem anderen Fenster laden“.
Es kommt keine Rückfrage. A zeigt danach den Ort von B, die in A getippten
Zeichen sind weg, der Rückholplatz (`eeb.entwurf.ersetzt.v1`) ist leer. Das
Gegenstück „Meine Fassung behalten“ fragt dagegen („…kommt auf den
Rückholplatz der Startseite und lässt sich von dort zurückholen“) und schützt
den fremden Stand.

**Erwartung der Rolle:** Beide Wege sind gleich sicher: Was ich in diesem
Fenster geschrieben habe, geht nicht still verloren, nur weil ich „laden“
getippt habe.

**Folge im Einsatz:** Wer die Warnung überlesen hat und weitergearbeitet hat
(Personal nachgetragen, Fahrzeuge geändert), verliert diese Arbeit mit einem
Tipp. Die Warnung nennt den Verlust zwar („werden erst wieder gespeichert“),
der Knopf klingt aber nach Aktualisieren. Bei einem Entwurf, der im Gehen und
mit zwei Fenstern bearbeitet wird, ist das genau der Fall, den der Abgleich
verhindern soll.

**Empfehlung:** Den eigenen, nicht gespeicherten Stand vor dem Laden auf den
Rückholplatz legen, wie es „Meine Fassung behalten“ für den fremden Stand tut,
oder bei geänderten eigenen Eingaben vorher fragen und den Verlust nennen.

**Nachprüfung:** Zwei Fenster, in B ändern, in A nach der Warnung weitertippen,
„Stand aus dem anderen Fenster laden“: Der Stand von A ist über die Startseite
zurückholbar oder die App fragt vorher.

### R6-S2 [P2] Die Konfliktwarnung nennt nur den Stand des anderen Fensters, nicht den eigenen und nicht, was sich unterscheidet

**Priorität:** P2

**Kennzeichnung:** beobachtet (Text der Warnung und der beiden Rückfragen,
Screenshots `f26-A-nach-Tippen`, `f26-behalten`; Skripte `t26`, `t30`).
Auswirkung im Einsatz: Risiko.

**Fundstelle / Aufgabe:** Warnung „⚠ Dieser Bogen wurde in einem anderen Fenster
geändert (dort: „THW Albstadt Zugtrupp Technischer Zug“, Stand 17.10.26, 11:27
Uhr)“ mit „Stand aus dem anderen Fenster laden“ und „Meine Fassung behalten“.
Code: `src/app/fenster-abgleich.tsx`.

**Beobachtung:** Der Text zeigt Einheitsname und Zeit des anderen Standes. Beide
Fenster tragen denselben Namen (derselbe Bogen), der eigene Stand steht nirgends
daneben, und es fehlt jeder Hinweis darauf, was sich geändert hat (Stärke,
Personenzahl, Ort). Nach „Meine Fassung behalten“ zeigt umgekehrt Fenster B
dieselbe Warnung mit der Zeit von A; der Wechsel lässt sich beliebig oft
wiederholen, jede Seite hält die andere für „geändert“.

**Erwartung der Rolle:** Ich sehe auf einen Blick, welche Fassung die neuere
oder vollständigere ist (etwa „dort 4 Personen, 11:27 · hier 3 Personen,
11:21“), und entscheide dann.

**Folge im Einsatz:** Unter Zeitdruck wird die Wahl geraten. Ein Helfer, der den
Stand von B nicht mehr kennt, entscheidet nach dem Wortlaut der Knöpfe, nicht
nach dem Inhalt. Zusammen mit R6-S1 wird so die falsche Fassung gewählt und
die andere unwiederbringlich oder nur über den Rückholplatz verfügbar.

**Empfehlung:** Neben der Zeit des anderen Standes die des eigenen nennen und
zwei Kennzahlen beider Stände (Stärke, Personen), nicht mehr.

**Nachprüfung:** Zwei Fenster, in B eine Person hinzufügen: Die Warnung in A
nennt beide Zeiten und die Personenzahl beider Stände.

### R6-S3 [P3] Zurück schließt die Informations- und Datenfenster der Startseite nicht, sondern verlässt die App (Rest von R5-S5)

**Priorität:** P3

**Kennzeichnung:** gemessen (Verlaufslänge vor und nach dem Öffnen, Adresse nach
Zurück; Skripte `t24`, `t25`). Auf dem Telefon: Risiko, die Geste der
installierten PWA ist nicht prüfbar.

**Fundstelle / Aufgabe:** Startseite im ersten Verlaufseintrag, Fenster
„Alle lokalen Daten löschen“, „Datensicherung“, „Beispielbögen“, „Impressum“,
„Datenschutz“. Code: Fenster der Startseite in `src/app/app.tsx`, Abfangweg
`ersteEbeneBetreten` in `src/app/modal-overlay.ts`.

**Beobachtung:** Die Rückfragen („Angefangenen Bogen verwerfen?“, „Neuen Bogen
anfangen?“, „Einheit schnell erfassen?“, „Geräteschlüssel neu erzeugen?“,
„Neue Einsatz-Sammlung anlegen“, „Empfangenen Bogen öffnen?“) legen einen
Verlaufseintrag an (Länge 2 → 3), Zurück schließt sie, die Startseite bleibt
(R5-S5 hält für sie). Die genannten fünf Fenster legen keinen an (Länge bleibt
2), Zurück führt auf `about:blank`, also aus der App heraus. Der Entwurf bleibt
erhalten.

**Erwartung der Rolle:** Zurück schließt, was offen ist, auf der Startseite wie
im Assistenten.

**Folge im Einsatz:** Gering: Wer „Alle lokalen Daten löschen“ oder
„Datensicherung“ per Zurück schließen will, steht im Startbildschirm oder auf
der Seite davor und muss die App neu öffnen. Es geht nichts verloren; wer aus
Versehen zurück tippt, während eine Sicherung läuft, bricht sie vermutlich ab
(nicht geprüft).

**Empfehlung:** Dieselbe Behandlung für alle Fenster der Startseite, nicht nur
für Rückfragen.

**Nachprüfung:** App frisch öffnen, „Datensicherung“ tippen, Zurück: Die
Startseite steht, das Fenster ist zu. Ebenso „Alle Daten löschen“, „Impressum“,
„Datenschutz“, „Beispielbögen“.

### R6-S4 [P3] „Rückgängig“ nach „Person entfernen“ verschwindet beim Schrittwechsel; die entfernte Person, auch die Ansprechperson, ist dann nicht mehr zurückzuholen

**Priorität:** P3

**Kennzeichnung:** gemessen (Leiste nach „Weiter →“ und „←“; Skripte `t21`,
`t22`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“, „Person entfernen“ →
Bestätigung → Leiste „Entfernt: Name · Rückgängig“. Code: Daumenleiste in
`src/app/schritte/personal.tsx`, `src/app/daumen-quittung.tsx`.

**Beobachtung:** Die Leiste bleibt im Schritt mindestens 20 s stehen (nicht
von allein zurückgenommen), „Rückgängig“ stellt die Person an ihrer Stelle
wieder her; zwei Entfernungen in Folge ergeben „Entfernt: 2 Personen (…)“ und
werden gemeinsam zurückgeholt (R5-S3 hält). Nach „Weiter →“ und „←“ ist die
Leiste weg, der Speicher kennt nur noch drei Personen, der Rückholplatz kennt
sie nicht (`eeb.entwurf.v1`, `eeb.geraeteschluessel.v1`, `eeb.uhr.v1` sind die
einzigen Schlüssel). Ein weiteres Entfernen ersetzt die Leiste.

**Erwartung der Rolle:** Wer unterbrochen wird, geht nach dem Gespräch einen
Schritt weiter und sieht beim Zurückblättern, dass jemand fehlt, ohne den
Fehler beheben zu können.

**Folge im Einsatz:** Die erste Person der Liste ist die Ansprechperson; wird
sie entfernt, rückt die nächste nach, ohne dass es auffällt. Vor dem Entfernen
steht immer eine Bestätigung mit Namen, deshalb nur P3.

**Empfehlung:** „Rückgängig“ bis zum Schließen des Bogens (oder eine Minute)
vorhalten, auch nach Schrittwechsel, oder die entfernte Person auf den
Rückholplatz legen.

**Nachprüfung:** Person entfernen, „Weiter →“, „←“: Die Person lässt sich noch
zurückholen.

### R6-S5 [P3] Einsatzansicht: Die Wahl der festen Leiste „◐ Ansicht“ öffnet sich über der Hauptaktion, und dieselbe Wahl steht dreimal auf der Seite

**Priorität:** P3

**Kennzeichnung:** beobachtet (Screenshots `e40-einsatz`, `e41-bar-offen`,
`e41-ende`; Skripte `t40`, `t41`).

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Test“ (5 Einheiten),
unterer Bildrand „◐ Ansicht: Standard“. Code:
`src/app/anzeige-schalter.tsx` (`AnzeigeLeiste`), Einsatzansicht in
`src/app/einsaetze-ui.tsx`.

**Beobachtung:** Die Leiste steht fest am unteren Rand. Ein Tipp öffnet die vier
Segmente nach oben und deckt den Knopf „Bogen scannen… mit Kamera oder
Handscanner“ teilweise ab; „Einheit manuell erfassen…“ darunter ist schon im
geschlossenen Zustand von der Leiste angeschnitten. Dieselbe Wahl steht
zusätzlich im Kopf der Seite („Ansicht: Standard / Feld / Dunkel / Nacht“) und
am Seitenende („ANSICHT“). Die Wahl wirkt sofort („Nacht“ → Schwarzbild mit
Bernstein); am Seitenende verdeckt die Leiste keinen Inhalt.

**Erwartung der Rolle:** Eine Stelle für die Anzeige, und nichts, das beim
Öffnen meinen Hauptknopf überdeckt.

**Folge im Einsatz:** Gering: Wer im Gehen auf „◐“ tippt und das Fenster offen
lässt, hat die Hauptaktion bis zum Schließen unter der Wahl. Drei Schalter für
dieselbe Sache kosten Aufmerksamkeit beim Suchen.

**Empfehlung:** Die Wahl nach dem Tippen auf ein Segment oder auf eine freie
Stelle schließen; Kopfzeile und Leiste zusammenführen.

**Nachprüfung:** Einsatzansicht, „◐ Ansicht“ tippen: „Bogen scannen…“ bleibt
bedienbar, die Wahl schließt sich nach der Auswahl.

### Verweise auf Befunde anderer Berichte

- **QR-Vollbild, Nachtipp ohne Rückmeldung:** Zwei Tipps auf „Weiter zu Teil n“
  im Abstand von 120 bis 1 200 ms lassen den Teil unverändert (gemessen), der
  Hinweis „Einen Moment …“ ist im Vollbild nicht zu sehen (Screenshot
  `q7-gap120`). Ausgearbeitet als R6-H1 in
  [feldtauglichkeit.md](feldtauglichkeit.md); hier nicht doppelt gezählt.
- **Zurück-Nebenwirkung nach bestätigter Rückfrage:** R6-E4 in
  [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md).

## Bestätigtes

- **QR-Vollbild, Doppeltipp:** Großbogen, 7 Teile. „Weiter zu Teil 2 →“ zweimal
  getippt im Abstand von 120, 300, 600, 900 und 1 200 ms: Teil 2, kein
  Sprung. Ab 1 500 ms: Teil 3 (zwei gewollte Tipps).
- **Teil zählt erst nach 1,5 s:** Bis Teil 7 durchgetippt (je 1,9 s), Teil 7
  600 ms gezeigt, „Schließen“: „Teil 7 von 7 wurde noch nicht gezeigt. Ohne ihn
  hat die Gegenstelle den Bogen nicht.“ mit „Teil 7 von 7 zeigen“ und
  „Trotzdem schließen“. Teil 7 erneut zeigen, 1,8 s warten, „Schließen“:
  „Hat die Gegenstelle alle 7 Teile gescannt? Die App kann das nicht selbst
  sehen.“ mit „Ja, gescannt — übergeben“, „Nicht sicher“, „← Code wieder
  zeigen“.
- **„Übergeben“ erst nach Bestätigung:** Doppeltipp (100 ms) auf „Ja, gescannt
  — übergeben“: eine Übergabe, die Übersicht zeigt „✓ Übergeben 11:17 Uhr
  (bestätigt) — seitdem unverändert.“ Bei fehlenden Teilen („Trotzdem
  schließen“) wird nichts als übergeben vermerkt.
- **Zurück im QR-Vollbild:** schließt das Vollbild, die Übersicht steht
  (`page.goBack()`).
- **Doppeltipp „Weiter →“ im Assistenten:** 100, 400 und 900 ms: ein Schritt;
  1 500 ms: zwei Schritte.
- **„Einen Moment …“ in Karten:** ▲/▼ in Schritt 3, Nachtipp nach 120, 400 und
  900 ms: Reihenfolge bleibt (Sommer, Lang, Lehmann, Wolf), Hinweis über dem
  Finger, gestrichelter Rahmen am Knopf (Screenshot `p16-gap400`), die Ansicht
  folgt der verschobenen Person. Nach 1 500 ms nimmt die Stelle wieder an.
- **„Person entfernen“:** Bestätigung nennt die Person („Lehmann, Tobias
  entfernen?“). Doppeltipp 60 bis 1 200 ms, auch genau auf den
  Bestätigungsknopf, wirkt nicht. Nach der Bestätigung fünf Nachtipps im
  Abstand von 150, 300, 500, 700 und 1 000 ms: es fehlt genau eine Person, es
  öffnet sich keine zweite Rückfrage (R5-S3 hält). In der Kurz-Liste gleich;
  „Rückgängig“ stellt die Person an ihrer Stelle her, bei zwei Entfernungen
  beide.
- **Zurück bei Rückfragen der Startseite:** „Verwerfen“, „Neuen Bogen
  erstellen“, „Einheit schnell erfassen…“, „Geräteschlüssel neu erzeugen“,
  „Neue Einsatz-Sammlung“: Fenster zu, Startseite und Entwurf bleiben.
  Doppeltipp auf „Verwerfen“ (100, 400, 1 000 ms): Rückfrage bleibt, Entwurf
  bleibt.
- **Zwei Fenster:** A zeigt die Warnung mit Name und Stand des anderen Fensters
  und speichert nichts mehr (Speicher unverändert); „Meine Fassung behalten“
  fragt mit Rückholplatz, der Doppeltipp bestätigt nicht; nach der Bestätigung
  steht A im Speicher, B auf dem Rückholplatz, B zeigt nun selbst die Warnung.
  Sammlung in zwei Tabs: Eintrag in B erscheint sofort in A (2 → 3 Einheiten),
  Papierkorb in B erzeugt in A den Hinweis mit Weg zurück.
- **Konfliktwarnung und Tastatur (R5-S4):** bei 360 × 380 px startet sie
  eingeklappt (53 px, „Entscheiden“), das Fokusfeld liegt bei y 187 bis 231.
- **„Wohin damit?“:** Link bei offener Startseite: Rückfrage „Meldung von … 
  empfangen. Wohin damit?“ mit Sammlungsname, nach einem und nach zwei
  Neuladen unverändert da (`eeb.wartet.fragment` im Sitzungsspeicher), im neuen
  Tab nicht. Link zweimal hintereinander (0, 300, 1 000 ms): eine Rückfrage,
  nach Doppeltipp auf „In ‚Hochwasser Test‘ aufnehmen“ drei Einträge (zwei
  vorhanden plus einer). Mit eigenem Bogen nennt „Bogen öffnen“ die Folge
  („Ersetzt deinen angefangenen Bogen …“), eine Rückfrage, Doppeltipp: eine
  Übernahme, der eigene Bogen liegt auf dem Rückholplatz.
- **Link bei Kaltstart ohne Sammlung, mit eigenem Bogen:** „Empfangenen Bogen
  öffnen?“ mit Folge und Rückholplatz.

## Abgleich mit Runde 5

Grundlage: [../runde-5/stress-und-unterbrechung.md](../runde-5/stress-und-unterbrechung.md)
mit „Stand der Behebung“ und [../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Tabelle | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-S1 QR-Vollbild: Doppeltipp überspringt Teil, Schluss fragt ohne Warnung (P1) | behoben | **hält, mit Rest** | Zweiter Tipp bis 1 200 ms ohne Wirkung, ein Teil unter 1,5 s zählt nicht, Warnung und Schlussfrage richtig. Rest: Der verworfene Tipp bleibt im Vollbild stumm (R6-H1, Verweis). |
| R5-S2 Die Fingerstellen-Sperre schweigt (P2) | behoben | **hält, im Vollbild nur teilweise** | Außerhalb des Vollbilds „Einen Moment …“ und gestrichelter Rahmen (Karten ▲/▼, Rückfragen). Im QR-Vollbild nicht zu sehen (R6-H1). Die Sperre selbst bleibt bei 1,5 s. |
| R5-S3 „Person entfernen“: Nachtipps, „Rückgängig“ nur für die letzte (P2) | behoben | **hält, mit Rest** | Fünf Nachtipps 150 bis 1 000 ms: eine Person, keine zweite Rückfrage; Sammel-„Rückgängig“ für zwei Personen. Rest: „Rückgängig“ endet beim Schrittwechsel (R6-S4). |
| R5-S4 Konfliktwarnung verdeckt bei Tastatur das Feld (P2) | behoben | **hält** | 360 × 380 px: eingeklappt, 53 px, Fokusfeld frei. Bei 360 × 640 px steht sie erst aufgeklappt, 184 px (29 % des Bildes, Runde 5: 240 px / 37 %); „Weniger“ klappt auf rund 122 px. Die Inhalte der Warnung und der Weg „laden“ bleiben Thema (R6-S1, R6-S2). |
| R5-S5 Zurück bei Rückfrage im ersten Verlaufseintrag verlässt die App (P3) | behoben | **teilweise** | Alle Rückfragen schließen mit Zurück. Fünf Fenster der Startseite („Alle lokalen Daten löschen“, „Datensicherung“, „Beispielbögen“, „Impressum“, „Datenschutz“) verlassen die App weiter (R6-S3). Die Nebenwirkung nach bestätigter Rückfrage steht in R6-E4. |
| R5-S6 Wartende Meldung nach Neuladen weg (P3) | behoben | **hält** | Nach einem und zwei Neuladen fragt die App erneut, nennt die Sammlung beim Namen; im neuen Tab nicht (Sitzungsspeicher, wie beschrieben). |
| R5-S7 „Bogen öffnen“ bei eigenem Bogen: zwei Rückfragen (P3) | behoben | **hält** | Eine Rückfrage mit Folge und Rückholplatz; Doppeltipp: eine Übernahme. |

Bilanz: Alle sieben Runde-5-Befunde dieses Berichts halten im Kern; keiner hat
sich verkehrt. R5-S1, R5-S2 und R5-S3 hängen an Resten (R6-H1, R6-S4), R5-S5
nur teilweise (R6-S3). Neu sind R6-S1 und R6-S2 (zwei Fenster, beide P2) sowie
R6-S3 bis R6-S5 (drei P3): 0 / 0 / 2 / 3 für P0 / P1 / P2 / P3. R6-H1 aus
[feldtauglichkeit.md](feldtauglichkeit.md) ist hier als Verweis geführt und
nicht doppelt gezählt.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 4 behoben, 1 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-S1 | behoben | „Stand aus dem anderen Fenster laden“ fragt vorher und legt die eigene Fassung auf den Rückholplatz (Unit-Test). |
| R6-S2 | behoben | Die Warnung nennt beide Stände mit Zeit und Personenzahl. |
| R6-S3 | behoben | Ein Beobachter legt für jedes offene Fenster der Startseite den Verlaufseintrag an (`dialogVerlaufVerdrahten`), Zurück schließt das Fenster. Unit-Test; im Browser belegt: Verlauf 2 → 3 beim Öffnen von „Datensicherung“, Zurück schließt das Fenster und bleibt auf der Startseite. |
| R6-S4 | behoben | Siehe R6-D4: „Rückgängig“ nach „Person entfernen“ überlebt Schrittwechsel und Neuladen (Unit-Test mit Remount). |
| R6-S5 | teilweise | Beim Öffnen einer Ansicht-Wahl schließt die andere; im Querformat wird der Balken zur Ecke (R6-M8). Die dreifache Darstellung der Wahl bleibt. |
