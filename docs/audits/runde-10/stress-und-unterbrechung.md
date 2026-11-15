# Audit „Stress und Unterbrechung“, Runde 10 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 25.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `441811c` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-9-Befunde und nach den Rückmeldungen aus der Erprobung („Ort der Einheit
(Pflicht)“, Einheiten-Anzahl-Fläche, linksbündige Organisationslisten). Der
Server lief unverändert; ich habe ihn weder neu gebaut noch angehalten und
keinen Prozess beendet. Ein kurzer Ausfall des Servers während des Laufs
(Nutzungslimit) hat keine Messung beeinflusst; die Lage danach lief unverändert
weiter.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Grundeinstellung
360 × 640 px. Jeder Lauf hatte einen eigenen Browser-Kontext, weil elf weitere
Prüfer denselben Server nutzten. Tipps mit `touchscreen.tap` an festen
Bildstellen (Abstände 150 bis 2 800 ms), Zurück-Geste mit `page.goBack()`,
Unterbrechung als `reload()`.

Zustände über `localStorage`-Seeds aus `examples/thw/`, mit `uebung: false` und
`stand` auf heute: `eeb.entwurf.v1` mit dem Großbogen „Verstärkter Bergungszug“
(38 Personen, 10 Fahrzeuge) und `eeb.einsaetze.v1` mit der Sammlung
„Hochwasser Musterstadt“ (6 Einheiten aus 001, 003, 009, 013, 016, 052). In den
Seeds tragen die Karten „⚠ Anderer Einsatz?“ und „Zeitraum vorbei“, weil Ort und
Zeitraum der Übungsbögen nicht zur Sammlung passen; das ist dem Seed
geschuldet und kein Befund. Skripte und Screenshots liegen im Scratchpad unter
`runde10/s/`.

Getestet habe ich zuerst ohne Blick in die Berichte: leere Startseite, neuer
Bogen mit Weiter-Tipps in verschiedenen Abständen, Neuladen mitten im
Assistenten, Zurück-Kette, Zahlenfelder in „5. Sofortbedarf“ (Komma, Punkt,
Minus, Text, Einheit, leer), Schalter „Sofortbedarf erfassen“, „Verwerfen“,
„Fahrzeug hinzufügen“ mit Doppeltipp, „Person entfernen“ mit Zweittipp,
Sammlung mit manueller Aufnahme (leer übernehmen, mit Zettelfeldern, Neuladen,
Zug in Schreibweisen), „Abrücken“ mit Zweittipp in fünf Abständen,
„Meldung entfernen“ mit „Rückgängig“ und Neuladen, Lagemonitor (360 × 640).
Danach habe ich den Runde-9-Bericht und den „Stand der Behebung“ gelesen und
gegengeprüft.

Nicht geprüft: echter Lärm und Unterbrechung durch Personen, echte
Bildschirmtastatur, Handschuhe, Hintergrund-Beenden durch das Betriebssystem,
WebKit, native Builds, QR-Vollbild, Zwei-Fenster-Abgleich, Rohtext-Rettung,
Datenschutzfristen, 320 × 568, Querformat, Tablet und Zoom-Nachbildung (diese
Lagen gehören anderen Rollen), die Rückmeldung „Einen Moment …“ bei verworfenen
Tipps auf Rückfrage-Knöpfen (R9-S2; meine Tipps lagen nie früher als 700 ms
nach dem Öffnen). Nicht geprüft: R6-O9, R7-N1, Sollstärke-Marke, CSV und Excel.

**Prioritäten:** Der Skill verwendet P0 bis P3.

**Kennzeichnung:**
- *gemessen*: im Testbrowser mit Zahlen reproduziert;
- *beobachtet*: im Testbrowser gesehen, ohne eigene Messreihe;
- *Risiko*: aus Code oder Verhalten abgeleitet, nicht nachgestellt.

## Urteil

Die Kernaufgaben gelingen ohne fremde Hilfe, auch unter Unterbrechung und
hektischem Tippen. Die Runde-9-Behebung der manuellen Aufnahme hält:
Eintreffzeit, „Nr. laut Zettel“ und „Zug / Verband“ überleben das Neuladen, den
Schrittwechsel und die Rückkehr (06:55 / 7 / „2. Zug“ vorher wie nachher). Die
Zahlenfelder lesen den Text selbst und sagen, was sie daraus machen („12,6“ →
13 mit Satz, „-5“, „abc“, „1e3“ abgelehnt mit Satz). Der Schalter „Sofortbedarf
erfassen“ fragt beim Ausschalten und nennt die verlorenen Werte. „Verwerfen“,
„Person entfernen“ und „Meldung entfernen“ nennen Folge und Rückweg. Doppeltipp
auf „Fahrzeug hinzufügen“ legt ein Fahrzeug an (10 → 11). Die Zurück-Kette bleibt
in der App (Schritt 4 → 3 → 2 → Übersicht → Startseite). „Abrücken“ mit Zweittipp
nach 250 bis 2 800 ms ändert den Status nicht zurück.

Reibung bleibt an drei Stellen: Die manuelle Aufnahme führt den Zug nicht in
die Schreibweise „n. Zug“ (R10-S1), der Prellschutz an „Weiter →“ verwirft bei
zügigem Durchtippen jeden zweiten Tipp ohne Zeichen (R10-S2), und nach der
Umbenennung auf „Ort der Einheit“ sprechen Rückfrage und Warnung weiter vom
„Namen“ (R10-S4).

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Name der Einheit fehlt – Zum Namensfeld“ meint
  das Feld „Ort der Einheit (Pflicht)“ (R10-S4).
- **Größtes Einsatzrisiko:** Zwei Schreibweisen desselben Zuges („2“, „Zug 2“)
  ergeben in der Aufnahme zwei Züge mit getrennten Zwischensummen (R10-S1).
- **Top-Priorität für die nächste Iteration:** Den Zug der manuellen Aufnahme mit
  derselben Normalisierung speichern wie den der Karte (R10-S1).

## Befunde

### R10-S1 [P2] Manuelle Aufnahme: „Zug / Verband (laut Zettel)“ wird nicht normalisiert, „2“ und „Zug 2“ sind zwei Züge

**Priorität:** P2

**Kennzeichnung:** gemessen (Skripte `c7`; `zugEtikett` im Speicher). Die Folge
für Lageblatt und Export ist Risiko.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Musterstadt“ → „Einheit manuell
erfassen…“ → Feld „Zug / Verband (laut Zettel)“ → „In Einsatz übernehmen“.

**Beobachtung:** Ich nahm nacheinander „THW Emden2“ mit Zug „2“ und „THW
EmdenZug 2“ mit Zug „Zug 2“ auf (zusätzlich ein Lauf mit „Zug 3“). Im Speicher
steht `zugEtikett` unverändert als `"2"`, `"Zug 2"` und `"Zug 3"`, die
Vermerke lauten „Zug: 2“, „Zug: Zug 2“. Die Übersicht zählt „Zwischensummen nach
Zug (2 Züge + Einheiten ohne Zug)“; auf der Karte erscheint nur „2“ in einem
Kästchen neben dem Namen. Die Zug-Normalisierung („2“, „Z2“, „Zug 2“ →
„2. Zug“, `zug-name.ts`, laut Runde 9 R9-E6 behoben) greift hier nicht.

**Erwartung der Rolle:** Wer am Funk „zweiter Zug“ hört und „2“ oder „Zug 2“
schreibt, landet im selben Zug wie der Kollege, der „2. Zug“ schreibt.

**Folge im Einsatz:** Zwei Meldeköpfe oder zwei Schichten tippen den Zug
verschieden; die Zwischensumme des 2. Zuges ist in zwei Zeilen geteilt, die
Gesamtstärke stimmt, die Zugstärke nicht (Risiko).

**Empfehlung:** Den Zug beim Übernehmen wie beim Zuordnen an der Karte
behandeln (eine Schreibweise „n. Zug“, vorhandene Schreibweise übernehmen) und
die Karte mit „2. Zug“ beschriften.

**Nachprüfung:** Zwei Einheiten mit „2“ und „Zug 2“ aufnehmen: Beide tragen „2.
Zug“, die Übersicht zählt „1 Zug“.

### R10-S2 [P3] „Weiter →“ nimmt bei zügigem Durchtippen jeden zweiten Tipp nicht an, ohne dass ich ein Zeichen sah

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `a6`, `a7`; Tipps per `touchscreen.tap` auf
die feste Stelle der Taste). Ob „Einen Moment …“ aufleuchtet, habe ich in diesem
Lauf nicht ausgewertet.

**Fundstelle / Aufgabe:** Neuer Bogen, leere Schritte 1 bis 5, Taste „Weiter →“
im festen Fuß (Bildstelle ändert sich zwischen den Schritten nicht).

**Beobachtung:** Fünf Tipps hintereinander im Abstand von 400 / 700 / 1 000 /
1 300 / 1 700 ms führten zu Schritt 3 / 3 / 4 / 4 / 6 (Übersicht). Bei 1 000 und
1 300 ms Abstand zählte jeder zweite Tipp nicht; erst bei 1 700 ms kam jeder
an. Das entspricht der Ortssperre von 1,5 s nach einem Wechsel der Ansicht
(`tipp-schutz.ts`). Mit Abständen ab 1 500 ms liefen alle sechs Schritte
ohne Verlust.

**Erwartung der Rolle:** Wer durch einen leeren Bogen tippt, weil die Angaben
später folgen, erreicht pro Tipp einen Schritt oder sieht, dass der Tipp
abgefangen wurde.

**Folge im Einsatz:** Gering. Der Doppeltipp-Schutz ist gewollt (R4-S2); wer
mit gleichmäßigem Tempo tippt, verliert aber unmerklich Tipps und zweifelt, ob
die Taste greift. Grenze in der Nähe von R8-H5/S4 (Prellschutz), neu ist die
Länge von 1,5 s an der Weiter-Taste.

**Empfehlung:** Für die Weiter-Taste die Sperre nach einem Schrittwechsel
auf rund 600 ms kürzen (wie bei Ansichtswechseln) oder die abgefangenen Tipps
sichtbar quittieren.

**Nachprüfung:** Fünf Tipps im Abstand von 1 000 ms: fünf Schritte oder jedes
Mal ein sichtbares „Einen Moment …“.

### R10-S3 [P3] „Rückgängig“ nach „Meldung entfernen“ trägt bis zum Neuladen; die Rückfrage dazu ist lang

**Priorität:** P3

**Kennzeichnung:** beobachtet (Skripte `g2`, `g3`; Screenshots `me1.png`,
`me2.png`).

**Fundstelle / Aufgabe:** Sammlung → Karte aufklappen → „Mehr…“ → „Entfernen“ →
„Meldung entfernen“.

**Beobachtung:** Zwei Meldungen nacheinander entfernt (6 → 5 → 4): Die Leiste
zeigt „Entfernt: Meldung Nr. 1 … · davor noch 1 entfernt“ mit „Rückgängig“;
ein Tipp holt die zuletzt entfernte zurück (4 → 5). Nach `reload()` ist
`sessionStorage` bis auf `__i` leer, die Leiste fehlt, die erste Entfernung
ist endgültig (5 Einheiten bleiben). Die Rückfrage nennt das, ist aber lang:
rund 95 Wörter in drei Absätzen mit Nummern-Verschiebung, Rückgängig-Regel,
Stapel und Exportstand; bei 360 × 640 läuft der letzte Satz hinter einen
Verlauf unter dem rot umrandeten Knopf „Meldung entfernen“.

**Erwartung der Rolle:** Ein Stapel mit Rückweg, der Neuladen übersteht wie
nach „Person entfernen“; und eine Rückfrage, die ich unter Zeitdruck in
einem Blick erfasse.

**Folge im Einsatz:** Gering, offengelegt. Ein Neuladen nach dem Entfernen
macht die Meldung endgültig (Anruf, Tab beendet). Die Rückfrage verlangt
Lesen unter Druck; der kritische Satz steht im mittleren Absatz.

**Empfehlung:** Rückweg in den Sitzungsspeicher legen (wie Person, Fahrzeug,
Ebene); die Rückfrage auf Kernsatz plus Knopfzeile kürzen, das Übrige nach
„Mehr“ aufklappen.

**Nachprüfung:** Meldung entfernen, Neuladen, Sammlung öffnen: „Rückgängig“
ist wieder da. Rückfrage bei 360 × 640 ohne Rollen lesbar.

### R10-S4 [P3] Nach der Umbenennung auf „Ort der Einheit (Pflicht)“ sprechen Rückfrage und Warnung weiter vom „Namen“

**Priorität:** P3

**Kennzeichnung:** beobachtet (Skripte `a2`, `c4`; Screenshots `ma2.png`,
`ma3.png`).

**Fundstelle / Aufgabe:** „1. Einheit“ (Neuer Bogen und manuelle Aufnahme),
„In Einsatz übernehmen“ ohne Eintrag.

**Beobachtung:** Das Feld heißt „Ort der Einheit (Pflicht)“. Die Warnung unter
den Feldern lautet „⚠ Zugehörigkeit: Der Name der eigenen Einheit (unterste
Ebene) fehlt.“ Der Hilfetext sagt „Aus Name, Organisation und Einheitstyp
bildet sich die Bezeichnung auf dem Bogen“. Die Rückfrage nach „In Einsatz
übernehmen“ heißt „Name der Einheit fehlt“, sagt „Bitte zuerst den Namen
eintragen“ und bietet „Zum Namensfeld“; der Knopf setzt den Fokus richtig auf
„Ort der Einheit (Pflicht)“ (Feld 202 × 44 px). Eine leere Einheit lässt sich
im Assistenten über „Weiter →“ ohne Hinweis bis zur Übersicht durchtippen
(der Hinweis steht als Warnzeile, nicht als Sperre).

**Erwartung der Rolle:** Ein Wort für eine Sache: Feld, Warnung, Rückfrage und
Knopf nennen „Ort der Einheit“.

**Folge im Einsatz:** Gering. Wer die Rückfrage liest, sucht ein Feld „Name“,
das es nicht gibt, und verliert Sekunden; der Knopf hilft, wenn er getippt
wird.

**Empfehlung:** Die drei Texte auf „Ort der Einheit“ umstellen; Knopf „Zum Feld
Ort der Einheit“.

**Nachprüfung:** „In Einsatz übernehmen“ ohne Eintrag: Titel, Text und Knopf
nennen „Ort der Einheit“; Warnzeile ebenso.

### R10-S5 [P3] Zahlenfelder ohne Obergrenze; Eingaben mit Einheit („500 l“) werden abgelehnt

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `b4`, `b5`) für das Annehmen und Ablehnen;
die Folgen für Anzeige und Lagemonitor sind Risiko, nicht geprüft.

**Fundstelle / Aufgabe:** „5. Sofortbedarf & Sonstiges“, Felder „Verpflegung
(Personen)“, „Diesel (l)“, „Benzin (l)“, „Gemisch (l)“.

**Beobachtung:** „99999999999“ im Feld „Benzin (l)“ wird angenommen und
gespeichert. „10 l“ und „500l“ werden mit „… ist keine Zahl — nicht
übernommen.“ abgelehnt, der alte Wert bleibt. „1.500“ → 1500 und „1 500“ →
1500 werden als Tausender gelesen, „2.5“ → 3 und „1,500“ → 2 als Dezimalzahl
(mit Hinweis „auf ganze Liter gerundet“). Fehlertexte: „Minus geht nicht — „-5“
wurde nicht übernommen.“

**Erwartung der Rolle:** Ein Zahlendreher mit vielen Ziffern fällt auf, bevor er
beim Meldekopf als Bedarf steht; „500 l“ wird als 500 gelesen.

**Folge im Einsatz:** Gering. Eine Tippflut im Stehen kann einen unsinnigen
Bedarf erzeugen, den nur das Lesen der Übersicht bemerkt (Risiko).

**Empfehlung:** Bei offensichtlich zu großen Mengen („über 100 000 l“) nachfragen
oder markieren; ein angehängtes „l“ ignorieren.

**Nachprüfung:** „99999999999“ eintragen: Hinweis oder Rückfrage. „500 l“ → 500.

## Bestätigtes

- **Manuelle Aufnahme überlebt das Neuladen (R9-S1):** 06:55 / „7“ / „2. Zug“
  und Ort „Emden“ stehen nach `reload()` wieder in den Feldern („Entwurf vom
  25.10.26, 10:22 Uhr wiederhergestellt.“), ebenso nach Schritt 3 und zurück.
- **Rückfrage „Stärke fehlt“:** Titel „Stärke fehlt“, Wortlaut „THW Emden hat
  noch keine Stärke (0 Personen)“, drei Wege im festen Fuß („Stärke eintragen“,
  „Trotzdem mit Stärke 0 übernehmen“, „Abbrechen“); „Trotzdem“ übernimmt die
  Einheit als Nr. 7 mit Marke „Stärke 0“.
- **Zahlenfelder:** „12,6“ / „12.6“ / „1.5“ werden gerundet mit Satz, „-5“,
  „abc“, „1e3“ und volle Breite abgelehnt mit Satz, leer wird 0, das Feld
  behält den alten Wert und zeigt `inputmode` numerisch (Feldtyp Text).
- **Schalter „Sofortbedarf erfassen“:** Rückfrage „Sofortbedarf entfernen?“
  nennt „Diesel 620 l, Benzin 1500 l, Gemisch 20 l, Unterbringung, Ruhezeit“ und
  das Wiederkommen der Verpflegung; Wahl „Sofortbedarf entfernen“ und „Behalten“.
- **Rückfragen:** „Angefangenen Bogen verwerfen?“ nennt Rückholweg, „Peters,
  Dominik entfernen?“ nennt „Rückgängig“; der Zweittipp auf „✕“ ändert nichts
  (Personen 38 bleibt vor Bestätigung).
- **Doppeltipp:** „Fahrzeug hinzufügen“ 250 ms Abstand: 10 → 11 Fahrzeuge.
- **Zurück-Geste:** Kette 4 → 3 → 2 → Übersicht → Startseite →
  `about:blank` nach sechs Zurück (Verlassen erst nach der Startseite).
- **Abrücken:** Zweittipp nach 250 / 700 / 1 200 / 1 800 / 2 800 ms ohne
  Wirkung auf den Status (Status der Karte bleibt 1); Quittung mit „Rückgängig“
  und „✕“.
- **Entwurf:** Tippen im Feld, sofortiges Neuladen: Entwurf bleibt;
  Startseite meldet „Entwurf vom … wiederhergestellt“ und bietet „Fortsetzen“
  und „Verwerfen“ (beide 141 × 44 px, nebeneinander; „Verwerfen“ fragt nach).
- **Lagemonitor, Telefon:** 360 × 640 ohne Seitenüberlauf (360 px), Tabelle ohne
  Ort-Spalte, Schrift 16 px, „Optionen“ mit „Dunkler“, „Heller (weiß)“,
  „Vollbild“, „Schließen“ (alle 44 px hoch).
- **Touchziele:** Assistent und Sammlung: kleinste Taste 44 × 44 px (Schrittleiste
  „6 Übersicht“ 44 × 44, „◐“ 44 × 47).

## Abgleich mit Runde 9

Grundlage: [../runde-9/stress-und-unterbrechung.md](../runde-9/stress-und-unterbrechung.md)
mit „Stand der Behebung“ in [../runde-9/README.md](../runde-9/README.md).

| Runde-9-Befund | Stand laut Tabelle | Bewertung Runde 10 | Beobachtung |
| --- | --- | --- | --- |
| R9-S1 Zettelfelder gehen beim Neuladen verloren | behoben (`fremd.zettel`) | **hält** | Zeit, Nr. und Zug stehen nach Neuladen und Schrittwechsel wieder in den Feldern. Der Zug wird beim Übernehmen nicht normalisiert (R10-S1). |
| R9-S2 verworfene Tipps auf Rückfrage ohne Rückmeldung | behoben („Einen Moment …“ auf dem Knopf, Sperre 600 ms) | **nicht erneut gemessen** | Meine Tipps lagen nicht früher als 700 ms nach dem Öffnen; ab da ging „Person entfernen“ durch (38 → 37). |
| R9-S3 „Rückgängig“ nach „Meldung entfernen“ | behoben (Stapel von 20 bis Neuladen) | **teilweise, wie angekündigt** | Stapel trägt (zwei Meldungen, „davor noch 1 entfernt“, Rückgängig 4 → 5); nach Neuladen kein Rückweg (R10-S3). |
| R9-S4 Hinweiskästen für Unlesbares | behoben (Kasten bis y = 558) | **nicht geprüft** | Kein Seed mit beschädigten Texten in diesem Lauf. |
| R9-E1 Zahlenfelder (Komma, Minus) | behoben | **hält** | Siehe Bestätigtes; Eingaben mit Einheit und Obergrenze: R10-S5. |
| R9-D1 Schalter ohne Rückfrage | behoben | **hält** | Rückfrage nennt die Werte, kein Nebeneffekt auf Verpflegung beobachtet. |
| R9-E6 Zug-Normalisierung „n. Zug“ | behoben | **teilweise** | Unit-Test und Karte laut Code; in der manuellen Aufnahme nicht (R10-S1). |
| R9-W1/M2 Wahl-Rückfrage mit bis zu drei Wegen | behoben | **hält** | „Stärke fehlt“ mit drei Wegen im festen Fuß. |
| R9-H5/S2 Sperre 600 ms nach Ansichtswechsel | behoben | **hält für Seitenwechsel, an „Weiter →“ 1,5 s** | R10-S2; Ortssperre unverändert. |
| Ortsfeld „Ort der Einheit (Pflicht)“ (main, parallel) | neu | **Nebenwirkung im Wortlaut** | Rückfrage und Warnung sagen „Name“ (R10-S4); Fokus landet richtig. |
| R6-O9 Uhrstand in der Zukunft | bekannte Grenze | **nicht geprüft** | Stand unverändert. |
| R7-G4/M8 Ecken-Knopf hochkant | bekannte Grenze | **unverändert** | Fester Balken „◐ Ansicht: Standard“ liegt unter den Quittungen der Sammlung (`me2.png`). |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | bekannte Grenze | **nicht geprüft** | Nicht Gegenstand dieses Laufs. |
| R7-N1 kein Zusammenführen-Tipp | bekannte Grenze | **nicht geprüft** | — |
| R7-N9 Ziffern der Schrittleiste | bekannte Grenze | **unverändert** | Schrittleiste „1 offen“, „2 ✓“, „6“ ohne Ziffernwörter. |
| R8-A1 Sollstärke zählt mit | bekannte Grenze | **nicht geprüft** | — |
| R8-M6 klebende Namensspalte | bekannte Grenze | **nicht geprüft** | — |
| R9-M3, R9-G5 | teilweise | **nicht geprüft** | Zoom nicht Gegenstand dieses Laufs. |
| R8-H5/S4 Prellschutz 450/800 ms | bekannte Grenze | **unverändert** | Rückfrage-Knöpfe ab 700 ms nach Öffnen angenommen. |

Bilanz: Die Runde-9-Behebungen dieser Rolle halten, mit einer Lücke im Zug der
manuellen Aufnahme und dem angekündigten Rest beim Rückweg der Meldung. Neu:
R10-S1 (P2) sowie R10-S2 bis R10-S5 (P3): 0 / 0 / 1 / 4 für P0 / P1 / P2 / P3.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Rückfrage „Name der Einheit fehlt“ meint das
  Feld „Ort der Einheit (Pflicht)“ (R10-S4).
- **Größtes Einsatzrisiko:** Derselbe Zug, in zwei Schreibweisen aufgenommen,
  zählt als zwei Züge mit eigenen Zwischensummen (R10-S1).
- **Top-Priorität für die nächste Iteration:** Zug der manuellen Aufnahme wie an
  der Karte normalisieren (R10-S1).
