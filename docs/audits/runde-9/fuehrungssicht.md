# Audit „Führungssicht", Runde 9 (Lage führen, Lagemonitor, Stand übergeben)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Server wurde weder neu gebaut noch
neu gestartet. Der Bericht prüft die Behebungen aus
[Runde 8](../runde-8/fuehrungssicht.md) (Abschnitt „Stand der Behebung" in der
[README](../runde-8/README.md)) und achtet auf Nebenwirkungen der übrigen
Runde-8-Änderungen (Rohtext-Rettung, Nummern-Verschiebung, Sollstärke-Marke,
Zug-Normalisierung, CSV nach Nr., Lagemonitor-Messlogik, Schrift folgt der
Systemschrift).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`), Locale
de-DE, je Lauf ein eigener Browser-Kontext. Telefon 360 × 640 (`isMobile`,
`hasTouch`) als Grundeinstellung, dazu 320 × 568, 640 × 360 quer, Tablet
820 × 1180, Browser-Zoom nachgestellt (180 × 320 bei Skalierung 2) und
`html { font-size: 200% }`. Der Lagemonitor zusätzlich ohne Touch auf
1366 × 768.

Ich habe zuerst blind getestet (ohne die Berichte unter `docs/audits/` zu
lesen) und danach den Runde-8-Bericht und „Stand der Behebung" gelesen.

Zustände aus `localStorage`-Seeds (`eeb.einsaetze.v1`), `uebung: false`,
`stand` auf heute, Einsatzzeitraum der Bögen auf heute gesetzt (der
Einsatzzeitraum ist ein Tageszähler seit 2020-01-01; sonst tragen alle Einheiten
„Zeitraum vorbei", das ist Seed-Artefakt und zählt nicht):
- Sammlung „Hochwasser Musterstadt" mit 6, 8, 14 und 30 Einheiten aus
  `examples/thw/`; Varianten: Meldungen 5 Stunden alt, Meldungen 2 Stunden in der
  Zukunft, zwei Einheiten mit unbenannten Sollplätzen (Namen, Kontakte,
  Fahrerlaubnis, Zusatzqualifikationen geleert);
- beschädigter Gesamttext von `eeb.einsaetze.v1` (letzte 40 Zeichen abgeschnitten);
- Lagemonitor als zweites Fenster über „Lagemonitor öffnen" (mit Funkrufname und
  „Jetzt") sowie direkt über `?lagemonitor=s1`.

Bedient: Karten auf- und zuklappen, „Zug zuordnen" (fünf Schreibweisen),
„Auftrag/Notiz" (126 Zeichen), „Abrücken", „Mehr… → Entfernen", Zähler „ohne
Auftrag / ohne Zug", Tabelle, „Übersicht als CSV" und „Alle Daten als CSV"
(heruntergeladen und gelesen), Zwischensummen nach Zug, Lagemonitor mit
Optionen und Einsatzdaten, Gleichlauf der beiden Fenster beim Abrücken.

**Nicht prüfbar:** echter Fernseher, Vollbild und Wachhalten im
Headless-Chromium, Drucken, Kamera, WebKit, Lageblatt-PDF (diesmal nicht
gelesen), Inhalt der Datensicherung bei beiseitegelegten Texten (nur aus dem
Hinweistext geschlossen, nicht im Browser nachvollzogen).

## Urteil

Die Runde-8-Behebungen für die Führung halten. Der Lagemonitor zeigt am Telefon
jetzt F, U und M ohne Rollen im Bild (Tabelle gleich Rahmenbreite bei 360, 320
und 640 px, Einheitentyp entfällt), die Einsatztabelle am Tablet stellt Auftrag
und Eingetroffen vor den Bedarf, der Monitor nennt unter „+ n weitere" die
Regel („zuletzt gemeldet zuerst"), der Auftrag steht auf der Karte bis rund 80
Zeichen mit „… (mehr)". Zug-Schreibweisen („1. Zug", „1.Zug", „1. zug", „2.
zug") laufen in einen Zug zusammen, die CSV steht nach Nr., die
Entfernen-Rückfrage nennt die Nummern-Verschiebung („Die Einheiten Nr. 2–6
rücken auf und heißen danach Nr. 1–5"), ein beschädigter Gesamttext wird mit
sichtbarem Hinweis beiseitegelegt statt still verworfen. Abrücken in einem
Fenster erscheint nach wenigen Sekunden im Monitor („1 abgerückt", „Abgerückt:
… gerade eben").

Reibung entsteht an zwei Stellen, die genau die Führungsfrage „Was ist die
Zahl wert?" berühren: Der Lagemonitor zählt reine Sollstärke ohne Marke in die
große Gesamtstärke (R9-K1), und bei Systemschrift 200 % werden Beschriftungen
größer als die Hauptzahlen des Monitors (R9-K2). Befunde mit P0 oder P1 habe ich
nicht gefunden.

Die Aufgabe — Lage führen, Monitor einrichten, Stand übergeben — lässt sich ohne
fremde Hilfe erledigen.

## Befunde

### R9-K1 [P2] Lagemonitor und Startseiten-Kachel zählen reine Sollstärke ohne Marke in die Gesamtstärke

**Priorität:** P2

**Kennzeichnung:** gemessen (Seed: Nr. 1 und 2 mit unbenannten Sollplätzen,
zusammen 15 Personen; Monitor 360 × 640).

**Fundstelle / Aufgabe:** Lagemonitor, Block „Stärke F / U / M // gesamt";
Startseite, Kachel der Einsatz-Sammlung („6 Einheit(en) anwesend · Stärke 1 / 15
/ 43 / 59"). Code-Bereich: Marke zu R8-A1 (`einsaetze-ui.tsx`,
`sollstaerkeAnteil`), nicht am Monitor.

**Beobachtung:** In der Einsatzansicht stehen die Marke „Sollstärke, nicht
gemeldet" auf den beiden Karten und die Summenzeile „Davon 2 Einheiten nur
Sollstärke, nicht gemeldet (15 Personen) — zählt in der Summe mit, bis eine
Zahl vorliegt." Im Lagemonitor desselben Einsatzes steht „2 / 13 / 38 // 53"
ohne Hinweis, der Text „Sollst…" kommt im Monitor nirgends vor. Die Kachel auf
der Startseite zeigt ebenfalls nur die Zahlen.

**Erwartung der Rolle:** Die Zahl, die ich dem Stab vom Fernseher vorlese, trägt
denselben Vorbehalt wie in der Einsatzansicht. Wer nur den Monitor sieht, kann
nicht wissen, dass 15 der 53 Personen niemand gezählt hat.

**Folge:** Am Meldekopf-Fernseher wirkt die Gesamtstärke wie gemeldete Stärke;
die Marke aus R8-A1 greift dort, wo gerade die meisten Entscheidungen
vorbereitet werden, nicht. Bekannte Grenze R8-A1 (Sollstärke zählt mit) bleibt
bestehen; hier geht es nur um die fehlende Marke an den zwei Stellen.

**Empfehlung:** Im Monitor unter der Gesamtstärke eine Zeile „davon 15
Sollstärke, nicht gemeldet" (ohne Personennamen, nur Zahl), auf der
Startseiten-Kachel ein kurzes „davon n Soll".

**Nachprüfung:** Seed wie oben: Monitor und Kachel nennen den Sollanteil, die
Zeile verschwindet, sobald alle Einheiten gezählt sind.

### R9-K2 [P2] Lagemonitor bei Systemschrift 200 %: Beschriftungen wachsen, die Hauptzahlen nicht

**Priorität:** P2

**Kennzeichnung:** gemessen (`getComputedStyle`, 360 × 640 und 320 × 568 mit
`html { font-size: 200% }`; Browser-Zoom 180 × 320 zum Vergleich).

**Fundstelle / Aufgabe:** Lagemonitor, Blöcke „Stärke F / U / M // gesamt",
„n Einheiten · n Fahrzeuge", „letzte Meldung vor …", Bewegungen und Tabelle.
Anlass: Runde-8-Änderung „Schrift folgt der Systemschrift".

**Beobachtung:** Normal: Beschriftung 14 px, Zahlenzeile 16,56 px. Bei
Systemschrift 200 %: Beschriftung („Stärke F / U / M // gesamt", „letzte
Meldung vor 1 Min", „vor 1 Min" in den Bewegungen) 28 px, die Zahlenzeile „3 /
17 / 49 // 69" und „8 Einheiten · 20 Fahrzeuge" bleiben bei 16,56 px. Die Zahl
steht damit kleiner als ihre eigene Überschrift; die Meldezeit „vor 1 Min" ist
größer als der Name der Einheit davor. Bei 320 px bricht der Ort in der Tabelle
mitten im Wort („Alb / sta / dt"). Beim nachgestellten Browser-Zoom (alles
skaliert) tritt das nicht auf: Verhältnisse bleiben, Zahlenzeile 8,28 CSS-px bei
14 px Beschriftung.

**Erwartung der Rolle:** Wer die Systemschrift vergrößert hat, will die Zahlen
größer sehen, nicht die Beschriftungen.

**Folge:** Gerade Nutzer, die große Schrift brauchen (Brille, Sonne, Abstand),
bekommen auf dem Telefon-Monitor die Zahlen, auf die es ankommt, relativ
kleiner als vorher; die Hierarchie kippt.

**Empfehlung:** Die Zahlenzeilen an die Systemschrift koppeln wie die
Beschriftungen (mindestens gleiche Größe wie die Überschrift), Ortsnamen nicht
mitten im Wort brechen (kürzen oder Spalte Orga schmaler).

**Nachprüfung:** 360 × 640 mit 200 %: Zahlenzeile ist mindestens so groß wie
ihre Beschriftung; kein Wortbruch in „Albstadt".

### R9-K3 [P3] Einsatzansicht am Telefon: Erste Einheit bei 1 077 px, ohne Sprung zur Liste (Stand R8-K4)

**Priorität:** P3

**Kennzeichnung:** gemessen (6 Einheiten: 360 × 640 bei 1 077 px, 320 × 568 bei
1 188 px, 200 % Schrift bei 2 390 px, quer 640 × 360 bei 1 164 px).

**Fundstelle / Aufgabe:** Einsatzansicht, Strecke von der Summenzeile zur ersten
Karte.

**Beobachtung:** Der Weg ist etwas kürzer als in Runde 8 (1 142 → 1 077 px),
bleibt aber über dem Ziel von 900 px. Der Sprunglink gilt weiter nur dem Export
(„Weitergeben, Lageblatt, Export ↓"); ein „Zu den Einheiten ↓" gibt es nicht.

**Erwartung der Rolle:** Eine Geste von den Summen zu den Einheiten.

**Folge:** Gering; pro Blick zwei Bildschirme Scrollen, bei 200 % vier.

**Empfehlung:** Siehe R8-K4.

**Nachprüfung:** 360 × 640: Erste Karte bei höchstens 900 px oder Sprunglink
vorhanden.

### R9-K4 [P3] „Zwischensummen nach Zug (2 Züge)" zählt den Sammelblock „Ohne Zug" mit

**Priorität:** P3

**Kennzeichnung:** gemessen (6 Einheiten, nur Nr. 1 „1. Zug" zugeordnet).

**Fundstelle / Aufgabe:** Einsatzansicht, Aufklapper „Zwischensummen nach Zug".

**Beobachtung:** Der Kopf nennt „(2 Züge)", obwohl nur ein Zug vergeben ist; im
Aufklapper stehen „1. Zug · 1 Einheit(en)" und „Ohne Zug · 5 Einheit(en)". Der
Zähler darüber sagt zugleich „5 ohne Zug".

**Erwartung der Rolle:** „1 Zug" (plus „5 ohne Zug").

**Folge:** Gering; wer „2 Züge" liest, erwartet zwei benannte Züge.

**Empfehlung:** Nur benannte Züge zählen, der Rest als „+ ohne Zug".

**Nachprüfung:** Ein Zug vergeben: Kopf „(1 Zug)".

### R9-K5 [P3] Lagemonitor am Telefon: Wortbruch im Ort („Haßmershei / m")

**Priorität:** P3

**Kennzeichnung:** gemessen (Screenshot und Spaltenbreiten, 360 × 640; Orga
13–51, Ort 51–140 px).

**Fundstelle / Aufgabe:** Lagemonitor, Tabelle „Einheiten" bei 360 px.

**Beobachtung:** „Haßmersheim" wird in der Ort-Spalte mitten im Wort getrennt.
Die Spalte „Funkruf" wiederholt den Ort („Heros Albstadt 21/10"), liegt mit 164
px aber doppelt so breit; der Ort steht damit zweimal, einmal gebrochen.

**Erwartung der Rolle:** Ein Name steht ungebrochen.

**Folge:** Gering; lesbar, aber unruhig.

**Empfehlung:** Ort-Spalte auf den längsten Ortsnamen auslegen oder den Ort
entfallen lassen, wenn der Funkrufname ihn schon enthält.

**Nachprüfung:** 360 × 640, Seed mit „Haßmersheim": kein Wortbruch.

### R9-K6 [P3] Lagemonitor: Uhr und Warnung „letzte Meldung vor 5 Std" haben dasselbe Rot

**Priorität:** P3

**Kennzeichnung:** gemessen (beide `rgb(255, 0, 0)`, Stufe Dunkel, 360 × 640) und
beobachtet.

**Fundstelle / Aufgabe:** Lagemonitor, Uhr und Zeile unter „n Einheiten".

**Beobachtung:** Die Uhr ist dauerhaft in diesem Rot, die Warnung bei Datenstand
ab einer Stunde (“⚠ letzte Meldung vor 5 Std 0 Min”) ebenso. Unterscheidbar
bleibt sie über Zeichen und Fettschrift, nicht über die Farbe.

**Erwartung der Rolle:** Rot bedeutet am Monitor „hinsehen".

**Folge:** Gering; die Warnung geht in der Farbfläche der Uhr nicht unter, weil
das Zeichen sie trägt. Risiko: Auf dem Fernseher aus der Ferne ist das ⚠ klein.

**Empfehlung:** Warnung in einer anderen Farbe oder als gefüllter Streifen;
Uhr in neutraler Farbe der Stufe.

**Nachprüfung:** Stufe Dunkel und Gedimmt: Uhr und Warnung unterscheiden sich in
Farbe oder Fläche.

## Verweise auf Befunde in anderen Berichten

Nicht erneut gezählt: die Grenzen R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9,
R8-A1, R8-M6, R8-H5/S4 (ihr Stand ist unverändert bekannt; nicht nachgestellt,
soweit nicht oben genannt). R9-K1 ergänzt R8-A1 nur um die fehlende Marke am
Monitor und auf der Kachel.

Beobachtung, kein Befund: Auf allen Karten des Seeds steht „⚠ Anderer Einsatz?"
(die Übungsbögen nennen einen anderen Ort); dadurch trägt jede Karte ein
Warnzeichen. Das ist Seed-Artefakt (Übungsbögen aus verschiedenen Einsätzen),
würde im Betrieb aber nur bei echter Abweichung erscheinen.

## Bestätigtes

- **Beschädigter Gesamttext:** Der Hinweis „Nicht lesbar: 1 beschädigter
  Gesamttext (Sammlungen oder Vorlagen) … die Stärke kann zu niedrig sein.
  Nichts davon ist gelöscht" steht oben auf der Startseite mit „Daten sichern…"
  und „Beiseitegelegtes entfernen…"; `eeb.unlesbar.v1` hält 20 551 Zeichen,
  `eeb.einsaetze.v1` bleibt nach dem Neuladen unverändert (beobachtet).
- **Nummern-Verschiebung:** „Meldung entfernen?" nennt „Nummern ändern sich: Die
  Einheiten Nr. 2–6 rücken auf und heißen danach Nr. 1–5 …", „Rückgängig" und
  das Ende von „Rückgängig" beim Neuladen.
- **Zug:** „1. Zug", „1.Zug", „1. zug" gleich ein Zug; „2. zug" erscheint in der CSV
  als „2. Zug". Zähler „5 ohne Zug" fällt mit jeder Zuordnung.
- **Auftrag:** 126 Zeichen werden aufgeklappt vollständig gezeigt, zugeklappt
  bis „…bis 22:00 U… (mehr)"; „Auftrag ändern" statt „Auftrag/Notiz" nach dem
  Speichern; „5 ohne Auftrag".
- **Tabelle am Tablet (820 × 1180, 14 Einheiten):** Reihenfolge Einheit, Zug, F,
  U, M, Ges., Kfz, Auftrag (490–650 px), Eingetr. (650–742 px), Bedarf (ab 742
  px); Auftrag und Eingetroffen liegen im Bild (Rahmen bis 787 px).
- **Monitor am Telefon:** Tabelle 336 px in 336 px Rahmen (360), 298 in 298 (320),
  602 in 602 (quer); F, U, M bei 304–348 px im Bild; Einheitentyp entfällt;
  Seite kein Überlauf (`scrollWidth` gleich Fensterbreite) in allen Lagen.
- **Monitor am Fernseher (1366 × 768, 30 Einheiten):** Vier Zeilen, „+ 26
  weitere Einheiten · zuletzt gemeldet zuerst", Seitenhöhe gleich Bildhöhe; unter
  der Zeile bleibt rund eine Zeilenhöhe frei.
- **Zwei Fenster:** „Lagemonitor öffnen" öffnet `?lagemonitor=s1` mit
  Funkrufname „Heros Führung 1" und „seit Beginn: 0 Stunden, 0 Minuten"; Abrücken
  im Hauptfenster erscheint nach wenigen Sekunden im Monitor („49 gesamt",
  „1 abgerückt", „Abgerückt: THW Karlsruhe … gerade eben").
- **Zustände:** Meldungen 5 Stunden alt: „⚠ letzte Meldung vor 5 Std 0 Min" in
  Rot; Meldungen 2 Stunden in der Zukunft: „Meldezeiten liegen in der Zukunft –
  Zeiten prüfen (Geräteuhr?)", „Dauer unklar", „liegt in der Zukunft".
- **CSV:** „Übersicht als CSV" sortiert nach Nr. (1, 2, 3 …) mit Spalte Zug;
  „Alle Daten als CSV" je Meldung mit Zeile Einheit und Zeilen Person.
- **Sollstärke in der Einsatzansicht:** Marke auf den Karten und Summenzeile
  „Davon 2 Einheiten nur Sollstärke, nicht gemeldet (15 Personen)".

## Abgleich mit Runde 8

Grundlage: [../runde-8/fuehrungssicht.md](../runde-8/fuehrungssicht.md)
einschließlich „Stand der Behebung".

| Runde-8-Befund | Stand laut Runde 8 | Bewertung Runde 9 | Beobachtung |
| --- | --- | --- | --- |
| R8-K1 Monitor am Telefon: F/U/M außerhalb (P2) | behoben | hält | Tabelle gleich Rahmenbreite, F/U/M im Bild bei 360, 320, 640; Wortbruch im Ort (R9-K5), Systemschrift (R9-K2). |
| R8-K2 Tablet: Auftrag/Eingetroffen hinter dem Rand (P2) | behoben | hält | Auftrag 490–650 px, Eingetr. 650–742 px, Rahmen bis 787 px. |
| R8-K3 Auftrag auf der Karte nach 40 Zeichen (P3) | behoben | hält | Bis rund 80 Zeichen mit „… (mehr)"; aufgeklappt vollständig. |
| R8-K4 Erste Einheit bei 1 142 px (P3) | in der README nicht aufgeführt | unverändert, geringfügig kürzer | 1 077 px, kein Sprung zur Liste; R9-K3. |
| R8-K5 Restplatz und Kriterium am Monitor (P3) | behoben | hält | „zuletzt gemeldet zuerst" steht unter „+ n weitere"; Rest unter einer Zeilenhöhe. |
| R8-A1 Sollstärke zählt mit (Grenze) | teilweise (Marke) | Grenze, Marke fehlt am Monitor und auf der Kachel | R9-K1. |
| R8-D2/W1 Nummern verschieben sich | behoben | hält | Rückfrage nennt „Nr. 2–6 … Nr. 1–5". |
| R8-D1/H1/O2/E1 Beschädigter Gesamttext | behoben | hält | Hinweis auf der Startseite, Rohtext erhalten. |
| R8-N5 „n. Zug" normalisiert | behoben | hält | Vier Schreibweisen geprüft, alle landen im selben Zug. |
| R8-A2 CSV nach Nr. | behoben | hält | Nr. 1, 2, 3 …; Zug „2. Zug". |
| R8-L1 Monitor zeigt 3 von 6 | behoben | hält | Alle 6 bis 8 Einheiten im Bild bei Telefon; vier von 30 bei 1366 × 768, mit „+ 26". |
| R8-L5 Schrift folgt Systemschrift | behoben | teilweise | Beschriftungen folgen, Zahlen nicht; R9-K2. |
| R8-L3/L4 Stufenleiste | behoben | hält | „Stufe: Dunkel · heller: Hell", „dunkler: Gedimmt" in den Optionen. |

Bilanz: Vier Runde-8-Befunde der Führungssicht halten, einer ist
unverändert (R8-K4), eine Grenze bleibt (R8-A1), eine Behebung hat eine Nebenwirkung
(R8-L5 → R9-K2). Verkehrt hat sich keine Behebung.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Gesamtstärke im Lagemonitor wirkt wie
  gemeldete Stärke, obwohl ein Teil nur Sollstärke ist (R9-K1).
- **Größtes Einsatzrisiko:** Bei großer Systemschrift stehen die Beschriftungen
  größer als die Hauptzahlen des Telefon-Monitors (R9-K2); sonst keines, das
  über P2 hinausgeht.
- **Top-Priorität für die nächste Iteration:** Sollanteil am Lagemonitor und auf
  der Startseiten-Kachel nennen und die Zahlenzeilen des Monitors an die
  Systemschrift koppeln (R9-K1, R9-K2).
