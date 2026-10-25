# Audit „Stress und Unterbrechung“, Runde 7 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde. Der Server lief unverändert; ich habe ihn weder neu gebaut
noch neu gestartet.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Grundeinstellung
360 × 640 px, dazu 320 × 568, 640 × 360 (quer), Zoom-Nachbildung mit
180 × 320 Layout-Pixeln (rund 200 % Browser-Zoom auf 360 px) und
`html { font-size: 200% }`. Jeder Lauf hatte einen eigenen Browser-Kontext,
weil elf weitere Prüfer denselben Server nutzten; der Seed wurde je Kontext
genau einmal geschrieben. Zwei Fenster sind zwei Seiten im selben Kontext.
Tipps mit `touchscreen.tap` an derselben Bildstelle (Abstände 100 bis
1 700 ms), Zurück-Geste mit `page.goBack()`, Unterbrechung als `reload()`.

Zustände über `localStorage`-Seeds aus `examples/thw/`, jeweils mit
`uebung: false`, `stand` auf heute und Einsatzzeitraum um den Prüftag:
`eeb.entwurf.v1` mit 013 Ulm (8 Personen) und dem Großbogen
„Verstärkter Bergungszug“ (38 Personen); `eeb.einsaetze.v1` mit der Sammlung
„Hochwasser Musterstadt“ (6 Einheiten aus 001, 003, 009, 013, 016, 052), für
den Papier-Abgleich bei drei Einheiten `vomPapier` gesetzt; `eeb.uhr.v1` mit
verschobenem `zuletzt` (Einheit: Minuten seit 2020) für die Geräteuhr-Rückfrage.
Skripte und Screenshots liegen im Scratchpad unter `runde7/stress/`.

Getestet habe ich zuerst ohne Blick in die Berichte: Neuladen mitten im Tippen
(Schritt 3 „Personal“, Schritt 2 „Einsatz“, manuelle Erfassung im Einsatz),
Zurück-Geste im Assistenten und in jedem Fenster der Startseite, „Person
entfernen“ mit „Rückgängig“ über Schrittwechsel und Neuladen, „Abrücken“ mit
Doppeltipp und Quittung, zwei Fenster mit Konfliktwarnung und beiden Wegen,
Lagemonitor als zweites Fenster mit Abrückungen, Papier-Abgleich mit
Unterbrechung, Exportstand nach CSV-Export und Abrücken, Geräteuhr-Rückfrage
(Vorwärts-, Rückwärtssprung), Fußleiste und feste Leisten bei 200 % Schrift in
sieben Lagen. Danach habe ich den Runde-6-Bericht samt „Stand der Behebung“
gelesen und die Behebungen einzeln gegengeprüft.

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, echte
Bildschirmtastatur, Zurück-Geste der installierten PWA und der nativen Builds,
echte Doppeltipps mit Handschuh, Kamera und Handscanner, Hintergrund-Beenden
des Tabs durch das Betriebssystem (nur `reload()`), Lagemonitor auf einem
echten Fernseher (nur als 1280 × 720-Seite), WebKit/Safari. Nicht geprüft: der
Weg „Nur neue Bögen seit dem letzten Export“ für PDF und Excel im Einzelnen,
der Download der Sammel-PDF.

## Urteil

Die Runde-6-Behebungen halten. „Stand aus dem anderen Fenster laden“ fragt
jetzt vorher und legt die eigene Fassung auf den Rückholplatz; die Warnung
nennt beide Stände mit Zeit und Personenzahl. Alle Fenster der Startseite
(„Datensicherung“, „Beispielbögen“, „Impressum“, „Datenschutz“, „Alle Daten
löschen“ und die Rückfragen) schließen mit Zurück, ohne die App zu verlassen.
Die entfernte Person kommt nach Schrittwechsel und Neuladen mit „Rückgängig“
zurück. „Abrücken“ nimmt einen zweiten Tipp im Abstand von 100 bis 1 700 ms
nicht an; die Quittung bleibt über 60 s stehen. Der Lagemonitor zeigt
Abrückungen sofort („Abgerückt: … gerade eben“, nach 65 s „vor 1 Min“), die
Stärke zählt Abgerückte nicht mit. Der Exportstand nennt nach dem CSV-Export
„zuletzt 17:55 · seitdem 1 Änderung (Abrücken)“. Die Geräteuhr-Rückfrage
erscheint bei 400 Tagen Rückwärtssprung und sagt, dass bis zur Antwort nichts
gelöscht wird. Neuladen mitten im Tippen verliert im Assistenten nichts, und
die manuelle Erfassung im Einsatz setzt nach dem Neuladen an derselben Stelle
fort.

Reibung bleibt an einer Stelle, an der ein neuer Bildschirm Eingaben nicht
sichert: Im Papier-Abgleich gehen alle Einträge bei Neuladen, „Später“ und
Verlassen der Seite ohne Rückfrage verloren (R7-S1). Dazu vier kleine Reste an
den Zwei-Fenster- und Uhr-Texten sowie bei Querformat mit 200 % Schrift.

Die Kernaufgaben gelingen ohne fremde Hilfe, auch mit Unterbrechungen und
hektischem Tippen. Kein P0 und kein P1.

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Später“ im Papier-Abgleich klingt nach
  „Zwischenstand ablegen“, verwirft aber alles, was schon eingetragen ist
  (R7-S1).
- **Größtes Einsatzrisiko:** Ein Meldekopf trägt die Blattangaben von acht
  Einheiten in den Papier-Abgleich ein, wird unterbrochen, das Telefon lädt
  die Seite neu, und alle Einträge sind weg (R7-S1).
- **Top-Priorität für die nächste Iteration:** Den Papier-Abgleich wie die
  manuelle Erfassung sichern oder vor dem Verwerfen fragen (R7-S1).

## Befunde

### R7-S1 [P2] Papier-Abgleich: Alle Eingaben gehen bei Neuladen, „Später“ und Verlassen der Seite verloren, ohne Rückfrage (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (Feldwerte vor und nach den drei Wegen; Skripte
`g1`, `g2`).

**Fundstelle / Aufgabe:** Einsatzansicht, Karte „Lage vom Papier abgleichen
(n)“ mit den Feldern „Nr. laut Blatt“, „Eingetroffen am“, „Status“, „Zug“,
„Auftrag / Notiz“ je Einheit, Knöpfe „Abgleich übernehmen“ und „Später“. Code:
`src/app/papier-abgleich-ui.tsx` (`PapierAbgleich`, Zeilen im Komponenten-
zustand `zeilen`).

**Beobachtung:** Drei Einheiten mit `vomPapier`. Ich trage bei der ersten
Einheit „Nr. 77“ ein und setze „abgerückt“. Dann drei Wege: (1) Neuladen: Die
Einsatzansicht steht wieder, die Karte ist zu, nach „Lage vom Papier
abgleichen…“ stehen „Nr.“ leer und „anwesend“ gewählt. (2) „Später“: kein
Dialog, die Karte schließt, beim erneuten Öffnen ist alles leer. (3) „‹ Startseite“ und zurück: ebenso.
Nichts davon steht im Speicher oder auf dem Rückholplatz. Die manuelle
Erfassung im selben Einsatz überlebt das Neuladen dagegen (Skript `j7`).

**Erwartung der Rolle:** Wer vom Papier abtippt und vom Kameraden gerufen wird,
findet die halbe Arbeit wieder vor, oder die App fragt, bevor sie sie
wegwirft. „Später“ legt den Zwischenstand ab.

**Folge im Einsatz:** Der Abgleich ist die Arbeit nach einem Geräteausfall
und hat je Einheit fünf Felder, bei acht Einheiten rund vierzig. Gerade
dieser Weg wird im Stehen und mit Unterbrechung gemacht. Ein Neuladen durch
das Betriebssystem oder ein versehentliches „Später“ kostet die ganze
Eingabe; die Karten tragen weiter „vom Papier, Zeiten prüfen“, die
Information bleibt also lückenhaft, nicht falsch.

**Empfehlung:** Die Zeilen wie die manuelle Erfassung zwischenspeichern, mindestens
im Sitzungsspeicher; hilfsweise vor „Später“ und beim Verlassen fragen, wenn
schon etwas eingetragen ist, und den Verlust nennen.

**Nachprüfung:** Abgleich öffnen, bei einer Einheit „Nr.“ eintragen und
„abgerückt“ wählen, Seite neu laden, Abgleich wieder öffnen: Die Einträge
stehen noch da. Ebenso nach „Später“ und nach „‹ Startseite“.

### R7-S2 [P3] Konfliktwarnung: Bei einer Änderung nur im Text sind „dort“ und „hier“ nicht zu unterscheiden; die Rückfrage nennt nur die eigene Fassung

**Priorität:** P3

**Kennzeichnung:** beobachtet (Text der Warnung und der Rückfrage, Screenshots
`z1`, `z3`; Skript `b1`).

**Fundstelle / Aufgabe:** Zwei Fenster mit demselben Entwurf (013 Ulm), in B
wird „Einsatzort / Auftrag“ geändert. Warnung in A und Rückfrage „Stand aus dem
anderen Fenster laden?“. Code: `src/app/fenster-abgleich.tsx`.

**Beobachtung:** Die Warnung lautet „(dort: „THW Ulm Bergungsgruppe“, Stand
23.10.26, 17:44 Uhr, 8 Personen · hier: Stand 23.10.26, 17:44 Uhr, 8
Personen)“. Beide Stände tragen dieselbe Minute und dieselbe Personenzahl;
was sich geändert hat (der Ort), steht nirgends. Die Rückfrage vor „laden“
nennt nur „Deine Fassung hier (… Stand 17:44 Uhr) wird nicht übernommen; sie
kommt auf den Rückholplatz“, nicht den Stand, der geladen wird. Die R6-S2-Verbesserung (beide Stände mit Zeit und
Personenzahl) hält, trägt aber nur bei Personenänderungen oder bei Minuten Abstand.

**Erwartung der Rolle:** Ich erkenne, welche Fassung neuer ist, auch wenn
nur ein Textfeld geändert wurde.

**Folge im Einsatz:** Gering: Wer sich entscheidet, rät bei Textänderungen
weiter. Die eigene Fassung ist nach „laden“ über den Rückholplatz gesichert
(gemessen, R6-S1 hält), der Fehlgriff ist also umkehrbar.

**Empfehlung:** Die Zeit mit Sekunden oder eine Angabe „vor 40 s“ und, falls
nur Texte abweichen, das geänderte Feld nennen („Einsatzort / Auftrag
anders“).

**Nachprüfung:** Zwei Fenster, in B nur den Einsatzort ändern: Die Warnung in
A nennt, was anders ist, oder zwei unterscheidbare Zeiten.

### R7-S3 [P3] Rückholplatz: Die zurückgelegte Fassung heißt „Zuletzt geschlossener Bogen“ und trägt denselben Namen wie der aktive Entwurf

**Priorität:** P3

**Kennzeichnung:** beobachtet (Startseite nach „Stand laden“, Screenshot
`z5`; Skript `b1`).

**Fundstelle / Aufgabe:** Startseite nach „Stand aus dem anderen Fenster
laden“ mit Bestätigung. Code: Rückholplatz der Startseite in
`src/app/app.tsx`.

**Beobachtung:** Unter der Entwurfskarte „THW Ulm Bergungsgruppe · Fortsetzen ·
Verwerfen“ steht eine zweite Karte „THW Ulm Bergungsgruppe“ mit „Zuletzt
geschlossener Bogen · zuletzt bearbeitet 23.10.26, 17:45 Uhr“ und „Zuletzt
geschlossenen Bogen zurückholen“. Die Fassung wurde nicht geschlossen, sondern
durch „laden“ ersetzt; beide Karten tragen denselben Namen, der Unterschied
(die eigene Eingabe „[A-nach-Warnung]“) ist nicht zu sehen.

**Erwartung der Rolle:** Die Karte sagt, was sie ist: „Deine Fassung aus dem
Fenster-Konflikt“, mit einem Merkmal, an dem ich sie erkenne.

**Folge im Einsatz:** Gering: Wer nach dem Konflikt die verlorene Fassung
sucht, hält „Zuletzt geschlossener Bogen“ für etwas anderes und tippt
vielleicht „Verwerfen“ statt „zurückholen“.

**Empfehlung:** Den Grund der Zurücklegung in die Karte schreiben („ersetzt
durch das andere Fenster“) und die Stärke nennen.

**Nachprüfung:** Konflikt wie in R7-S2 herstellen, „Stand laden“, Startseite:
Die Rückholkarte nennt den Anlass.

### R7-S4 [P3] Querformat mit 200 % Schrift: „Fortsetzen“ liegt auf der Startseite bei 1 119 px, drei Bildschirme unter dem Anfang

**Priorität:** P3

**Kennzeichnung:** gemessen (Oberkante des Knopfes, Screenshot `h2`; Skript
`h1`, `h2`).

**Fundstelle / Aufgabe:** Startseite mit Entwurf bei 640 × 360 und
`html { font-size: 200% }`. Dazu: 180 × 320 (Browser-Zoom 200 % auf 360 px):
„Fortsetzen“ bei 516 px.

**Beobachtung:** Die Deckel aus R6-M6 greifen für Hochformat: 360 × 640 mit
200 %: „Fortsetzen“ bei 515 px, 320 × 568: 465 px (Runde 6: 542 und 516,
besser). Quer mit 200 % liegt der Knopf bei 1 119 bis 1 183 px auf einem
360 px hohen Bild; das erste Bild zeigt Kopfnavigation (zwei Zeilen) und den
Seitentitel „Digitaler Einheiten-Erfassungsbogen“ mit „Ansicht: Standard ▾“,
sonst nichts. Im Zoom-Fall (180 × 320) liegt er hinter dem ersten Bild.

**Erwartung der Rolle:** Wer die Schrift groß gestellt hat, findet „Fortsetzen“
im ersten Bild, auch quer.

**Folge im Einsatz:** Gering, die Lage ist selten (Quer plus doppelte Schrift).
Wer es dennoch trifft, sucht den Hauptknopf durch drei Bildschirme. Der
Entwurf ist nicht gefährdet.

**Empfehlung:** Im Querformat den Titelblock der Startseite und die
Kopfnavigation bei großer Schrift verkleinern oder „Fortsetzen“ in den Kopf
ziehen. Rest von R6-M5/R6-M7 (Verweis).

**Nachprüfung:** Entwurf vorhanden, 640 × 360, Schrift 200 %: „Fortsetzen“
liegt im ersten Bild.

### R7-S5 [P3] Geräteuhr-Rückfrage: „… war der 27.11.2027 (400 Tage danach)“ liest sich verkehrt herum

**Priorität:** P3

**Kennzeichnung:** beobachtet (Text bei Rückwärtssprung um 400 Tage; Skript
`f1`). Der Text bei Vorwärtssprung ist nicht gemessen: Mit frischen Seeds
fällt nichts fällig, die Rückfrage erscheint nicht.

**Fundstelle / Aufgabe:** Startseite, Warnung „⚠ Geräteuhr prüfen“ mit „Geräteuhr
stimmt“ und „Uhr korrigieren“. Code: `src/app/uhr-warnung.tsx`.

**Beobachtung:** „Das Gerät zeigt den 23.10.2026, beim letzten Start war der
27.11.2027 (400 Tage danach). Stimmt das heutige Datum? Bis du antwortest,
löscht und anonymisiert die App nichts.“ Das Gerät zeigt ein früheres Datum
als der letzte Start; „danach“ meint den letzten Start relativ zum heutigen
Datum, liest sich aber, als liege das heutige Datum 400 Tage nach dem letzten
Start. Die Warnung schiebt „Fortsetzen“ von 391 auf 541 px; auf 360 × 640
bleibt er im Bild.

**Erwartung der Rolle:** Ein Satz, der die Richtung sagt: „Die Uhr ist 400
Tage zurückgegangen.“

**Folge im Einsatz:** Gering. Die sichere Folge (nichts wird gelöscht) steht im
Text; die falsche Lesart führt eher zu „Geräteuhr stimmt“ als zu „Uhr
korrigieren“, ohne Datenfolge.

**Empfehlung:** Die Richtung in Worten nennen („Die Uhr geht 400 Tage nach
bzw. vor …“).

**Nachprüfung:** `eeb.uhr.v1` mit `zuletzt` 400 Tage in der Zukunft: Der Text
nennt die Richtung ohne „danach“.

### Verweise auf Befunde anderer Berichte

- **Dreifache Ansicht-Wahl in der Einsatzansicht** (Kopf, fester Balken „◐
  Ansicht“, Seitenende „ANSICHT“): beobachtet im Text der Einsatzansicht; im
  Assistenten steht „Ansicht: Standard ▾“ im Kopf und „◐ Ansicht“ in der
  Fußleiste. Rest von R6-S5, ausgearbeitet in
  [mobile-ui.md](../runde-6/mobile-ui.md) (R6-M8, dort „behoben“ für Quer).
- **Karten mit „⚠ Anderer Einsatz?“** erscheinen im Seed bei allen sechs
  Einheiten (Ort/Auftrag der Bögen weicht von der Sammlung ab). Das ist dem
  Seed geschuldet und wurde nicht als Befund gewertet.

## Bestätigtes

- **Neuladen im Assistenten:** Vorname „Zzyx“ im Schritt 3 getippt und sofort
  neu geladen: Der Speicher hält „KarstenZzyx“, die Startseite bietet
  „Fortsetzen“.
- **Zurück im Assistenten:** Bei Wechsel 3 → 4 → 5 → 6 liegt die Verlaufslänge
  bei 8 (vorher 5); „Zurück“ geht Schritt für Schritt, nicht aus der App.
- **Zurück im Einsatz:** Aus „Einheit manuell erfassen…“ führt Zurück in die
  Einsatzansicht, dann auf die Startseite („Angefangene Erfassung für
  „Hochwasser Musterstadt““ steht dort); Neuladen in der Einsatzansicht bleibt
  in der Einsatzansicht.
- **Fenster der Startseite (R6-S3):** „Datensicherung“, „Beispielbögen“,
  „Impressum“, „Datenschutz“, „Alle Daten löschen“, „Verwerfen“, „Geräteschlüssel
  neu erzeugen“, „Neue Einsatz-Sammlung…“, „Einheit schnell erfassen…“: je
  offen, Zurück schließt, die Startseite bleibt. Nach „Schließen“ mit dem Knopf
  führt ein weiteres Zurück aus der App, wie es die erste Verlaufsstelle verlangt.
- **Zwei Fenster (R6-S1, R6-S2):** Warnung in A mit Name, Stand und
  „8 Personen“ beider Fassungen; in A nach der Warnung weitergetippt, „Stand
  aus dem anderen Fenster laden“: Rückfrage „Stand aus dem anderen Fenster
  laden?“ mit „Stand laden“ und „Abbrechen“; nach „Stand laden“ steht in
  `eeb.entwurf.ersetzt.v1` die eigene Fassung mit der Zeile „[A-nach-Warnung]“.
- **Rückweg „Person entfernen“ (R6-S4):** Bestätigung nennt die Person
  („Lehmann, Karsten entfernen?“ mit Folge und „Rückgängig“), die Leiste
  „Entfernt: Lehmann, Karsten · Rückgängig“ ist nach „Weiter →“ im Schritt 4
  weg, nach Neuladen und Rückkehr in Schritt 3 wieder da; der Rückweg liegt im
  Sitzungsspeicher (`eeb.personal.rueckweg`, in ISK und DSFA beschrieben).
- **„Abrücken“:** Zweiter Tipp nach 100, 300, 700, 1 100 und 1 700 ms:
  Status bleibt „abgerückt“, die Quittung „Abgerückt 17:59: Nr. 6 …“ mit
  „Rückgängig“ bleibt über 60 s stehen. Ein Tipp kurz nach dem Aufklappen der
  Karte (600 bis 1 000 ms) wird verworfen, mit „Einen Moment …“ über dem
  Finger: bewusst, siehe Ortssperre; wer an derselben Bildstelle sofort weiter
  tippt, braucht einen zweiten Tipp.
- **Lagemonitor:** Zeile „Abgerückt: THW Albstadt … gerade eben“ nach 3,5 s,
  zwei Abrückungen untereinander, nach 65 s „vor 1 Min“; Stärke 59 → 55 → 44,
  „letzte Meldung vor 1 Min“ zählt mit der Uhr weiter; keine Personennamen.
- **Exportstand:** Vor dem Export „Noch kein Export aus diesem Einsatz — alle
  Bögen sind neu.“, nach dem CSV „Übersicht als CSV: zuletzt 23.10.2026, 17:55 ·
  seitdem keine neuen Bögen“, nach einem Abrücken „… seitdem 1 Änderung
  (Abrücken)“.
- **Geräteuhr:** Rückwärtssprung 400 Tage: Rückfrage mit „Geräteuhr stimmt“ und
  „Uhr korrigieren“, Zusage „löscht und anonymisiert die App nichts“. Sprünge
  bis 60 Tage und ein Vorwärtssprung ohne fällige Folgen: keine Rückfrage.
- **Offline-Zeile:** „⏳ Wird für den Offline-Betrieb geladen: 0,4 von 6,9 MB —
  bitte mit Netz geöffnet lassen …“ steht beim ersten Besuch, nach dem Laden
  „✓ Offline bereit … (254 von 508)“.
- **Feste Leisten bei großer Schrift:** In sieben Lagen (360 × 640, 320 × 568,
  640 × 360, je normal und mit 200 %, dazu Zoom 180 × 320) kein Überlauf
  (`scrollWidth` gleich `clientWidth`), oben keine feste Leiste, unten höchstens
  die Fußleiste (70 bis 78 px, quer 56 bis 69 px); in Schritt 6 keine.
- **Fußleiste im Schritt 3:** „←“ 51 × 44, „◐ Ansicht“ 106 × 47, „Weiter →“
  101 × 44 px, Abstand 12 und 58 px; der Hauptknopf rechts.

## Abgleich mit Runde 6

Grundlage: [../runde-6/stress-und-unterbrechung.md](../runde-6/stress-und-unterbrechung.md)
mit „Stand der Behebung“.

| Runde-6-Befund | Stand laut Tabelle | Bewertung Runde 7 | Beobachtung |
| --- | --- | --- | --- |
| R6-S1 „Stand aus dem anderen Fenster laden“ verwirft ohne Rückfrage (P2) | behoben | **hält** | Rückfrage nennt die eigene Fassung und den Rückholplatz; nach „Stand laden“ liegt die eigene Fassung samt Eingabe nach der Warnung in `eeb.entwurf.ersetzt.v1`. Rest: R7-S3. |
| R6-S2 Konfliktwarnung nennt den eigenen Stand nicht (P2) | behoben | **hält, mit Rest** | Beide Stände mit Zeit und Personenzahl; bei einer Änderung nur im Text nicht unterscheidbar (R7-S2). |
| R6-S3 Zurück schließt Fenster der Startseite nicht (P3) | behoben | **hält** | Neun Fenster einzeln geprüft: Zurück schließt, Startseite bleibt. |
| R6-S4 „Rückgängig“ endet beim Schrittwechsel (P3) | behoben | **hält** | Leiste kehrt nach Schrittwechsel und Neuladen in Schritt 3 zurück; Rückweg im Sitzungsspeicher dokumentiert. Nur im Schritt 3 sichtbar. |
| R6-S5 Wahl der Leiste „◐ Ansicht“ über der Hauptaktion, dreifach (P3) | teilweise | **teilweise** | Dreifache Darstellung in der Einsatzansicht besteht (Kopf, Balken, Seitenende); im Assistenten zweifach (Kopf, Fußleiste). Das Überdecken der Hauptaktion nicht erneut gemessen. |
| R6-M6 Deckel bei großer Schrift (Fremdbericht, hier gegengeprüft) | behoben | **hält, quer nicht** | Hochformat 515 px (360 × 640) und 465 px (320 × 568) bei 200 %; quer 1 119 px (R7-S4). |

Bilanz: Alle fünf Runde-6-Befunde dieses Berichts halten im Kern; R6-S5
bleibt teilweise. Keine Behebung hat sich verkehrt, ich habe keine Nebenwirkung
an Fußleiste, Zurück-Verlauf, Rückfragen, Zwei-Fenster-Abgleich, Lagemonitor,
Exportstand, Geräteuhr-Rückfrage, Offline-Zeile oder Rückweg im Sitzungsspeicher
gefunden. Neu sind R7-S1 (P2) sowie R7-S2 bis R7-S5 (vier P3): 0 / 0 / 1 / 4
für P0 / P1 / P2 / P3.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Später“ im Papier-Abgleich (R7-S1).
- **Größtes Einsatzrisiko:** Unterbrechung im Papier-Abgleich mit vielen
  Einheiten, Neuladen verwirft die ganze Eingabe (R7-S1).
- **Top-Priorität für die nächste Iteration:** Zwischenspeicher oder Rückfrage
  im Papier-Abgleich (R7-S1).
