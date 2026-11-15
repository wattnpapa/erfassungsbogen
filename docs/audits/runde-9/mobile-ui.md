# Audit „Mobile UI", Runde 9 (Darstellung und Bedienung auf dem Telefon)

Stand: 24.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Bericht prüft nach, was
[Runde 8](../runde-8/mobile-ui.md) samt „Stand der Behebung" in
[Runde 8, README](../runde-8/README.md) festgestellt hat, und die Umbauten aus
Runde 8 an Sprungmarke, Rückfragen, Fuß- und Schrittleiste bei starkem Zoom,
Lagemonitor, Tabelle der Einsatzansicht, Dialogen der Startseite, Kurz-Liste,
Musterung, Zwei-Fenster-Leiste und Kasten für beiseitegelegte Daten.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, jeder Lauf in einem
eigenen Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten. Der
Server wurde weder neu gebaut noch angehalten. Viewports: 360 × 640 (Grundlage),
320 × 568, 640 × 360 (quer), Tablet 820 × 1180 und 1180 × 820, dazu
`html { font-size: 200% }` (im Folgenden „200 %", am 360er und am 320er
Telefon) und die Nachbildung eines Browser-Zooms von 200 % am 360er Telefon:
Fenster 180 × 320 Layout-Pixel bei Skalierung 4 (im Folgenden „180 × 320").

Zustände kamen aus `localStorage`-Seeds, alle mit `uebung: false` und Stand auf
heute: `eeb.entwurf.v1` (THW Oldenburg, Verstärkter Bergungszug, 38 Personen;
für „Stärke nicht gezählt" dieselbe Meldung mit leeren Personen),
`eeb.einsaetze.v1` (Sammlung „Hochwasser Musterstadt", 6 Meldungen, in einem Lauf
eine siebte mit nur Sollstärke) und ein abgeschnittener Rohtext
(`[{"id":"s1","name":"Kaputt","eintraege":[{`) für den Kasten der Rohtext-Rettung.
Die Vorlage für die Musterung entstand durch Bedienung („Als Vorlage
speichern"). Die zweite Seite der Zwei-Fenster-Lage schrieb im selben Kontext
einen geänderten Entwurf nach `eeb.entwurf.v1`.

Durchlaufen habe ich: Startseite (leer, mit Entwurf, mit Sammlung, mit
beschädigtem Gesamttext), Assistent Schritt 1 bis 6 samt Fuß- und Schrittleiste,
Rückfragen „Bogen schließen?", „Nur die Stärke melden?", „Stärke nicht gezählt"
(mit Sammlungswahl) und „Meine Fassung behalten?", Einsatzansicht als Karten und
Tabelle, Lagemonitor (`?lagemonitor=<id>` samt „Optionen"), Musterung der Vorlage,
Dialoge „Übungsbögen" und „Datensicherung", Kurz-Liste, Browser-Zurück und
-Vorwärts, Tablet.

Gemessen habe ich `scrollWidth` gegen `innerWidth`, Lage und Höhe fester und
klebender Leisten, Maße und Abstände der Ziele, Rollhöhen innerhalb von Dialogen,
Spaltenbreiten der Tabellen, Schriftgrößen im Lagemonitor und Überlauf von
Knopfbeschriftungen (`scrollWidth` gegen `clientWidth`). Aussagen zu Lage und
Größe habe ich am Screenshot gegengeprüft.

Reihenfolge: Ich habe zuerst blind getestet (Startseite, Assistent, Sammlung,
Lagemonitor in allen Lagen) und den Bericht aus Runde 8 samt „Stand der
Behebung" erst danach gelesen. Skripte und Screenshots liegen außerhalb des
Repositorys im Scratchpad (`.../scratchpad/runde9/m/`).

**Prioritäten:** Der Skill verwendet Critical / High / Medium / Low; abgebildet
auf P0 / P1 / P2 / P3.

**Kennzeichnung:**
- *gemessen*: im Testbrowser mit Zahlen reproduziert;
- *beobachtet*: im Testbrowser gesehen, ohne eigene Messreihe;
- *Risiko*: aus Code oder CSS abgeleitet, nicht nachgestellt.

**Nicht prüfbar / nicht erreicht:**
- echte Geräte mit Systemschrift (die 200 % sind `html { font-size: 200% }`,
  der Zoom ist eine Nachbildung durch ein kleineres Fenster), echte
  Bildschirmtastatur, Browserleisten (`vh`/`dvh`), Safe-Area-Einsätze (`env()`
  ist im Testbrowser 0), WebKit/Safari, Kamera, Handschuhe, Licht;
- Datumsfelder zeigen im Testbrowser „mm/dd/yyyy" (Eigenheit von
  Headless-Chromium, nicht gewertet);
- die Geräteuhr-Warnung bei 200 % und 320 × 568 ist als R7-G8/H9 eine bekannte
  Grenze und nicht erneut ausgelöst; Ziffern der Schrittleiste (R7-N9),
  fehlender Zusammenführen-Tipp (R7-N1), Ecken-Knopf hochkant (R7-G4/M8),
  Uhrstand in der Zukunft (R6-O9), Sollstärke zählt mit (R8-A1), klebende
  Namensspalte (R8-M6) und Prellschutz 450/800 ms (R8-H5/S4) sind bekannte
  Grenzen; ihr Stand steht unten.

## Urteil

Die Umbauten aus Runde 8 halten im Kern, und die beiden P2 der Vorrunde sind
gemessen weg. Die Sprungmarke liegt ohne Fokus in allen Lagen bei −44 bis −8 px
(bei 200 % −63 bis −8), also ganz außerhalb des Bildes, auch bei 320 × 568 und
200 %. Der Rückfrage-Dialog hat bei 180 × 320 untereinanderstehende Knöpfe von
130 × 44 px ohne Überlauf, der Rumpf ist 49 % der Fensterhöhe. Die Fußleiste ist
bei 180 × 320 einzeilig (70 px, 22 %). „Übungsbögen" und „Datensicherung"
behalten „Schließen" auch am Ende der Liste im Bild, die Listenzeilen sind 44 px
hoch. Die Musterung klebt mit 21 bis 24 % der Höhe. Der Lagemonitor zeigt am
Telefon Orga, Ort, Funkruf und F/U/M im ersten Bild (Einheitentyp entfällt). Die
Kurz-Liste hat sichtbare Feldnamen. Kein seitlicher Überlauf in keiner
geprüften Lage, auch nicht am Tablet; Zurück und Vorwärts sind stimmig, ein
geöffneter Dialog schließt mit Zurück.

Neu und am deutlichsten: Im Lagemonitor wachsen bei 200 % Systemschrift die
Beschriftungen von 14 auf 28 px, die Kernzahlen („1 / 15 / 43 // 59", „seit
erster Meldung") bleiben bei 16 bis 17 px, die Tabelle bricht mitten im Wort
(R9-M1). In der Rückfrage „Stärke nicht gezählt" liegen bei 320 × 568 mit 200 %,
quer und bei 180 × 320 zwei von drei Entscheidungen im rollenden Rumpf, im festen
Fuß steht nur „Abbrechen" (R9-M2). Bei 180 × 320 ist die klebende Namensspalte
der Tabelle 95 % des Rahmens (R9-M3). Der Rest sind kleine Stellen: Kurz-Liste
weiter 230 px je Person, die Speicherzeile entfällt bei großer Schrift, der
Kasten der Rohtext-Rettung schiebt „Neuen Bogen erstellen" aus dem ersten Bild.

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt in allen
geprüften Lagen. Die Befunde sind 0 × P0, 0 × P1, 0 × P2, 9 × P3.

## Befunde

### R9-M1 [P3] Lagemonitor bei 200 % Systemschrift: Beschriftungen wachsen, Kernzahlen nicht; Tabelle bricht mitten im Wort

**Priorität:** P3

**Kennzeichnung:** gemessen (Schriftgrößen), im Screenshot beobachtet
(`lm-g.png`, `lm-z.png`).

**Fundstelle:** `?lagemonitor=<id>` (Fallback bei gesperrtem Popup oder Telefon
als Anzeige): Felder „Stärke F / U / M // gesamt", „6 Einheiten · 22
Fahrzeuge", „letzte Meldung …", „seit erster Meldung …", Bewegungszeilen,
Tabelle „Einheiten".

**Beobachtung:**

| Element | 360 × 640, 100 % | 360 × 640, 200 % | 320 × 568, 200 % |
| --- | --- | --- | --- |
| „Stärke F / U / M // gesamt" (Beschriftung) | 14 px | 28 px | 28 px |
| „1 / 15 / 43 // 59" (Zahlen) | 17 px | **17 px** | **15 px** |
| „letzte Meldung vor 1 Min" | 14 px | 28 px | 28 px |
| „seit erster Meldung: 0 Stunden, 6 Minuten" | 16 px | 16 px | 14 px |
| Tabelle (Orga, Ort, Funkruf) | 14 px | 28 px | 28 px |
| Zelle „Albstadt" (Breite) | 96 px | 54 px | 38 px |

Bei 200 % steht die Beschriftung „Stärke F / U / M // gesamt" doppelt so groß
über den Zahlen, auf die es ankommt; „letzte Meldung vor 1 Min" ist größer als
„6 Einheiten · 22 Fahrzeuge". In den Bewegungszeilen stehen „Eingetroffen: …"
(14 px) und „vor 1 Min" (28 px) in einer Zeile nebeneinander. Die Tabelle bricht
in Wortmitte („Alb / sta / dt", „Albsta / dt", „Heros / Albsta / dt / 21/10"); im
180er Fenster ist die Ortszelle 24 px breit („Al / bs / ta"), die Zahlen F/U/M
stehen in Spalten von etwa 1 Zeichen Breite. Bei 100 % ist alles stimmig
(Stand der Behebung L5 „Schrift folgt der Systemschrift" greift nur für Teile).

**Erwartung der Rolle:** Wächst die Schrift, wachsen die Kernzahlen zuerst; die
Rangfolge (Zahl vor Beschriftung) bleibt erhalten, und Ortsnamen brechen nicht
in der Wortmitte.

**Folge:** Gering: Der Monitor ist für den Fernseher gedacht, das Telefon nur
der Notweg. Wer ihn dort mit großer Schrift liest, sieht die Beschriftungen
groß und die Stärke klein, und die Tabelle ist kaum lesbar. Der Befund ist auch
ein Rest von R8-M4 (Tabelle am Telefon).

**Empfehlung:** Die gemessene Größe der Kernzahlen an die Systemschrift koppeln
wie die Beschriftungen, oder die Beschriftungen auf die Größe der Zahlen
begrenzen; bei schmalen Zellen Orga und Funkruf kürzen (nur Ort und F/U/M).

**Nachprüfung:** `?lagemonitor=<id>` bei 360 × 640 und 200 %: Schrift der Zahlen
mindestens so groß wie die der Beschriftung; kein Buchstabe einer Wortmitte in
einer neuen Zeile der Tabelle.

### R9-M2 [P3] Rückfrage „Stärke nicht gezählt": bei engem Fenster liegen zwei Wege im rollenden Rumpf, im festen Fuß nur „Abbrechen"

**Priorität:** P3

**Kennzeichnung:** gemessen (Lage der Knöpfe gegen den sichtbaren Rumpf),
im Screenshot beobachtet (`sf-kg.png`, `sf-q.png`, `sf-z.png`).

**Fundstelle:** „In Einsatz-Sammlung ablegen…" (Übersicht, Schritt 6) mit einem
Bogen aus nur Sollplätzen: nach der Sammlungswahl die Wahl-Rückfrage mit den
Wegen „Stärke jetzt eintragen", „Als Sollstärke ablegen" und „Abbrechen"
(`frageWahl`, Rumpf `abfrage-rumpf`).

**Beobachtung:**

| Lage | Rumpf sichtbar / ganz | „Stärke jetzt eintragen" | „Als Sollstärke ablegen" | „Abbrechen" |
| --- | --- | --- | --- | --- |
| 360 × 640 | 415 / 415 | im Rumpf | im Rumpf | fest |
| 320 × 568, 200 % | 434 / 669 | im Rumpf | **außerhalb** (501–545) | fest, 515–559 |
| 640 × 360 | 238 / 328 | im Rumpf | **außerhalb**, Knopf zur Hälfte abgeschnitten | fest |
| 180 × 320 | 208 / 716 | **außerhalb** (315–373) | **außerhalb** (470–547) | fest, 251–295 |

Bei 320 × 568 und 200 % sieht man „Stärke jetzt eintragen" und „Abbrechen"; der
dritte Weg liegt unter einem Verlauf im Rumpf. Im 180er Fenster steht im Bild
ein Streifen von etwa sieben Textzeilen und darunter allein „Abbrechen"
(Screenshot `sf-z.png`); beide Wege mit Wirkung (eintragen, als Sollstärke
ablegen) muss man erst im Rumpf suchen. Quer ist der Knopf „Als Sollstärke
ablegen" halb abgeschnitten, was das Rollen anzeigt.

**Erwartung der Rolle:** Bei jeder Schrift sind alle Entscheidungswege der
Rückfrage sichtbar oder zeigen sichtbar an, dass weitere folgen; bei zwei oder
mehr Wegen mit Wirkung steht nicht allein „Abbrechen" im festen Fuß.

**Folge:** Gering: Der sichere Ausgang (Abbrechen) ist immer im Bild, und die
Rückfrage kommt selten. Wer sie bei großer Schrift bedient, hält „Abbrechen"
womöglich für den einzigen Weg und legt die Meldung nicht ab.

**Empfehlung:** Bei Wahl-Rückfragen alle Wege in den festen Fuß (bei engem
Fenster untereinander, Hinweise im Rumpf), oder den Kurztext kürzen, bis die
Wege ins Bild passen.

**Nachprüfung:** 320 × 568 mit 200 %, 640 × 360 und 180 × 320: jeder Weg der
Rückfrage liegt ohne inneres Rollen im Bild.

### R9-M3 [P3] Tabelle der Einsatzansicht bei 180 × 320: klebende Spalte füllt 95 % des Rahmens, Rest der Tabelle nicht bedienbar

**Priorität:** P3

**Kennzeichnung:** gemessen und im Screenshot beobachtet (`tb-z2.png`); im
Zoom-Fenster nachgebildet, echter Zoom ist Risiko.

**Fundstelle:** Einsatzansicht, „Tabelle" (`.tabellen-scroll`, klebende erste
Spalte „Einheit").

**Beobachtung:**

| Lage | Rahmen | klebende Spalte | Anteil |
| --- | --- | --- | --- |
| 360 × 640 | 326 px | 120 px | 37 % |
| 320 × 568 | 286 px | 120 px | 42 % |
| 320 × 568, 200 % | 286 px | 75 px | 26 % |
| 640 × 360 | 546 px | 132 px | 24 % |
| 180 × 320 | 126 px | 120 px | **95 %** |

Im 180er Fenster bleiben 6 px neben der klebenden Spalte; die Spalten „Zug",
„F", „U", „M" lassen sich nicht ins Bild rollen, weil die Namensspalte sie
verdeckt. Die Kopfzeile ragt im Screenshot rechts über den Kartenrand hinaus.
Ein Wortbruch ist nicht mehr zu sehen („Materialwirtschaft", „Wassergefahren
(A)" stehen ganz). Die Spaltenfolge ist Einheit, Zug, F, U, M, Ges. (N7 hält).
Die Breite bei 360 × 640 (37 %) ist die bekannte Grenze R8-M6.

**Erwartung der Rolle:** Die klebende Spalte ist nie breiter als etwa die
Hälfte des Rahmens; bei sehr engem Rahmen klebt sie nicht.

**Folge:** Gering; die Karten zeigen alle Zahlen im ersten Bild, und der Zoom
von 200 % am 360er Telefon ist selten. In der Tabelle ist dort aber nur die
Namensspalte zu sehen.

**Empfehlung:** Unter etwa 240 px Rahmenbreite die Spalte nicht kleben lassen
oder auf die Nummer („Nr. 3") verkürzen.

**Nachprüfung:** 180 × 320, Tabelle: klebende Spalte höchstens 50 % des
Rahmens, „F" liegt im Bild.

### R9-M4 [P3] Kurz-Liste der Personen: 230 px je Person (339 px bei 200 %), Seite 10 057 px; die Höhe stieg mit den Feldnamen

**Priorität:** P3

**Kennzeichnung:** gemessen, im Screenshot beobachtet (`kl-kg.png`, `v3b-telefon.png`).

**Fundstelle:** Schritt 3, „Kurz-Liste (Tabelle)" (Vorgabe ab 8 Personen).

**Beobachtung:** Je Person stehen die Zeile ▲ ▼ ⇑ ✕, „Vorname" und „Nachname",
„Zählt als" und „Geschlecht", jetzt mit sichtbaren Feldnamen (R8-M7 teilweise
behoben). Der Abstand von Person zu Person ist 230 px (360 × 640 und 640 × 360),
339 px (320 × 568, 200 %), 342 px (180 × 320). Die Seite ist 10 057 px hoch
(360 × 640, 38 Personen; Runde 8: 8 826 px), 16 382 px bei 320 × 568 und 200 %.
Die Auswahl „Führer/in" hat 193 px Breite bei 360, 161 bei 320/200 % und 95 px
im 180er Fenster; ihr Wert ist ohne Abschnitt lesbar („Führer/in",
„Unterführer/in"). Die Optionsfelder „Alle Angaben (Karten)" und „Kurz-Liste
(Tabelle)" sind bei 320/200 % je drei Zeilen hoch.

**Erwartung der Rolle:** Die Kurz-Liste ist am Telefon merklich kürzer als die
Karten (Nachprüfung aus Runde 8: höchstens 120 px je Person).

**Folge:** Gering: Die Liste ist bedienbar und kürzer als die Karten, aber mit
rund 16 Bildschirmseiten für 38 Personen kaum zu überblicken.

**Empfehlung:** Eine Zeile je Person (Name, Rolle) mit Aufklappen zum Bearbeiten;
die Bedienzeile ▲ ▼ ⇑ ✕ dort anbieten, wo sie gebraucht wird.

**Nachprüfung:** 360 × 640, Schritt 3 mit 38 Personen: Abstand von Person zu
Person höchstens 120 px.

### R9-M5 [P3] Speicherzeile „✓ gespeichert · … Uhr" entfällt bei 200 % Schrift, im Zoom und quer ganz

**Priorität:** P3

**Kennzeichnung:** gemessen (`display: none`, 0 × 0 px); im Code als gewollte
Verdichtung belegt (Container-Abfrage unter 17,5 rem, Querformat unter 500 px
Höhe), nicht im Bild bemängelt.

**Fundstelle:** Assistent, Kopf (`.autosave`).

**Beobachtung:** Bei 360 × 640 und 320 × 568 steht die Zeile (328 × 20 bzw.
288 × 20 px). Bei 360 × 640 mit 200 %, bei 320 × 568 mit 200 %, im 180er
Fenster und quer (640 × 360) ist sie nicht da; es gibt in diesen Lagen auch an
anderer Stelle keine sichtbare Rückmeldung, dass der letzte Eintrag gespeichert
ist. Fehler dagegen bleiben sichtbar (`.speicher-fehler` ist von der Regel
ausgenommen). In Runde 8 war die Zeile bei 320/200 % noch durch die Sprungmarke
verdeckt; seit der Behebung von R8-M1 fehlt sie sichtbar.

**Erwartung der Rolle:** Die Rückmeldung „gespeichert" ist auch bei großer
Schrift und quer wenigstens als Haken oder Uhrzeit zu sehen, wenn die Seite
sonst nur eine Warnung bei Fehlern kennt.

**Folge:** Gering: Wer mit großer Schrift oder quer arbeitet, sieht den Erfolg
der Speicherung nicht, nur das Ausbleiben einer Fehlermeldung. Daten gehen nicht
verloren.

**Empfehlung:** In der Verdichtung die Zeile durch einen kurzen „✓" neben dem
Titel ersetzen oder die Uhrzeit in der Schrittleiste zeigen, statt sie ganz
auszublenden.

**Nachprüfung:** 360 × 640 mit 200 % und 640 × 360, Schritt 3: eine Rückmeldung
„gespeichert" ist im Bild.

### R9-M6 [P3] Kasten „Nicht lesbar: … beschädigter Gesamttext" schiebt „Neuen Bogen erstellen" aus dem ersten Bild

**Priorität:** P3

**Kennzeichnung:** gemessen, im Screenshot beobachtet (`rt-t.png`).

**Fundstelle:** Startseite, Kasten der Rohtext-Rettung (Hinweis, „Daten
sichern…", „Beiseitegelegtes entfernen…").

**Beobachtung:** Der Kasten ist 360 × 640 etwa 260 px hoch (vier Textzeilen, zwei
Knöpfe). „Neuen Bogen erstellen" liegt dadurch bei 660 bis 705 px, **ganz unter**
dem Bildrand (640 px); ohne Kasten liegt er bei 397 bis 442 px. Bei 320 × 568
liegt er bei 696 bis 741 px, bei 320 × 568 und 200 % bei 1 482 bis 1 666 px, im
180er Fenster bei 998 bis 1 067 px; quer (640 × 360) bei 448 bis 493 px. In
Runde 8 stand „halb unter dem Bildrand" (R8-H4); der Kasten ist von neun auf
drei Zeilen gekürzt, steht aber vor dem Hauptknopf. „Beiseitegelegtes
entfernen…" (rot) steht 12 px unter „Daten sichern…".

**Erwartung der Rolle:** Der Hauptweg „Neuen Bogen erstellen" bleibt im ersten
Bild, auch wenn ein Hinweis davorsteht.

**Folge:** Gering: Der Fall ist selten (beschädigter Gesamttext); wer ihn hat,
rollt einmal. Der Hauptweg ist nicht versperrt.

**Empfehlung:** Hinweis einzeilig mit „Genauer" oder unter die drei Hauptwege
setzen; den Knopf „Beiseitegelegtes entfernen…" erst im aufgeklappten Teil
anbieten.

**Nachprüfung:** 360 × 640 mit beschädigtem Gesamttext: „Neuen Bogen erstellen"
liegt ganz im ersten Bild.

### R9-M7 [P3] Rückfrage „Bogen schließen?": Fokus startet auf dem Bestätigen-Knopf, in den anderen Rückfragen auf „Abbrechen"; Abstand der Knöpfe 12 bis 16 px

**Priorität:** P3

**Kennzeichnung:** Fokus gemessen (`document.activeElement`), Wirkung für
Tastatur oder Schaltersteuerung Risiko; Abstände gemessen.

**Fundstelle:** Rückfragen „Bogen schließen?" (Übersicht), „Nur die Stärke
melden?" (Personal), „Meine Fassung behalten?" (Zwei-Fenster-Lage).

**Beobachtung:** In „Nur die Stärke melden?" und „Meine Fassung behalten?" steht
der Fokus beim Öffnen auf „Abbrechen" (360, 320, quer, 180 × 320; H2 hält). In
„Bogen schließen?" steht er bei 360 × 640, 320 × 568, 200 % (360) und quer auf
„Schließen, zur Startseite", bei 320/200 % und im 180er Fenster auf dem Text.
Der Abstand zwischen Bestätigen und „Abbrechen" ist hochkant 12 px (Knöpfe
361–405 und 417–461), quer 16 px (rechter Rand 312, linker 328); der Stand der
Behebung nennt „24 px, gleiche Oberkanten". Gleiche Oberkante quer: ja (249 und
249).

**Erwartung der Rolle:** Alle Rückfragen mit Folgen starten gleich auf der
sicheren Antwort; der Abstand der Knöpfe entspricht der Angabe.

**Folge:** Gering: „Bogen schließen" ist über „Zuletzt geschlossener Bogen"
umkehrbar. Wer mit Tastatur, Fußtaster oder Schaltersteuerung bedient, bestätigt
mit dem ersten Druck.

**Empfehlung:** Fokus in „Bogen schließen?" wie in den anderen Rückfragen auf
„Abbrechen"; Abstand der Knöpfe angleichen.

**Nachprüfung:** „Bogen schließen?" öffnen: `document.activeElement` ist
„Abbrechen"; Knopfabstand in allen Lagen gleich.

### R9-M8 [P3] 180 × 320: Kopf 149 px (47 %) und Fußleiste 70 px lassen 101 px für das Formular; Speicherzeile und „Ansicht" entfallen

**Priorität:** P3

**Kennzeichnung:** gemessen in der Nachbildung (kleineres Fenster); echter Zoom
ist Risiko.

**Fundstelle:** Assistent, Kopf (`header`, Schrittleiste `.schritte`) und
`footer.nav`, im 180er Fenster.

**Beobachtung:** Die Fußleiste ist einzeilig, 70 px = 22 % (R8-M3 behoben, Reiter
49 px breit statt 23 bis 25 px). Der Kopf aber ist jetzt 149 px hoch (Runde 8:
105 px; 47 % von 320), weil die Schrittleiste in zwei Reihen zu je drei Reitern
steht (Screenshot `sch3-z.png`). Im ersten Bild bleiben 320 − 149 − 70 = 101 px
(32 %) für das Formular; der Kopf rollt weg, die Fußleiste bleibt. „Ansicht:
Standard ▾" und die Speicherzeile sind ausgeblendet (siehe R9-M5). Bei 320 × 568
und 200 % ist der Kopf 123 px (22 %), die Fußleiste 78 px (14 %), das passt.

**Erwartung der Rolle:** Bei starkem Zoom bleibt im ersten Bild mindestens die
Hälfte der Höhe für das Formular.

**Folge:** Gering: Wer mit Zoom 200 % am 360er Telefon arbeitet, sieht zunächst
Kopf und Schrittleiste; der Inhalt beginnt nach einem Rollen. Der Fall ist
selten.

**Empfehlung:** Die Schrittleiste im Zoom einzeilig führen (nur Ziffern, waagerecht
rollend, wie die Container-Regel es vorsieht) oder den Kopf einzeilig halten.

**Nachprüfung:** 180 × 320, Schritt 3, ungerollt: Formular im Bild mindestens
50 % der Höhe.

### R9-M9 [P3] Lagemonitor „Optionen": Stufenknöpfe tragen Zustand und Aktion in einem Satz („Stufe: Dunkel · heller: Hell")

**Priorität:** P3

**Kennzeichnung:** beobachtet (`lmo-t.png`), Wirkung auf Nutzer Risiko.

**Fundstelle:** Lagemonitor, „Optionen": Knöpfe „Stufe: Dunkel · heller: Hell",
„dunkler: Gedimmt", „Vollbild", „Schließen".

**Beobachtung:** Der erste Knopf (278 × 44 px bei 360 × 640, auf zwei Zeilen bei
großer Schrift) nennt die aktuelle Stufe und die Wirkung („heller: Hell"); der
zweite nennt nur die Wirkung („dunkler: Gedimmt"). Die Stufenleiter („Stufe:
Dunkel") ist als Knopf gestaltet, der Zustand steht im Namen eines Knopfes, der
tippt. Ziele sind 44 px hoch, bei 320 × 568 und 200 % mehrzeilig, ohne
Überlauf. Kontrast und Messlogik des Monitors halten (R8 L1 bis L5).

**Erwartung der Rolle:** Ein Knopf trägt eine Aktion; der Zustand steht davon
getrennt.

**Folge:** Gering: Wer neben dem Fernseher das Telefon bedient, liest zuerst
„Stufe: Dunkel" als Zustand und tippt darauf, um „heller" zu erreichen; der
Name täuscht eine Anzeige vor.

**Empfehlung:** Zustand als Text („Stufe: Dunkel") über zwei Knöpfe „Heller" und
„Dunkler" setzen.

**Nachprüfung:** Optionen öffnen: Zustand und Aktion stehen getrennt, beide
Knöpfe mit je einer Aktion.

### Verweise auf andere Berichte

- **Prellschutz 450/800 ms (R8-H5/S4):** bekannte Grenze. Beobachtet: Ein Tipp
  auf „Tabelle" 0,9 s nach dem Öffnen der Sammlung bei 180 × 320 blieb ohne
  Wirkung und zeigte oben „Einen Moment …"; nach 2,5 s funktionierte er. Der
  Knopf der Rückfrage reagiert dagegen sofort (R8-H5 teilweise, Stand wie
  beschrieben).
- **Ecken-Knopf „◐ Ansicht: Standard" hochkant:** bekannte Grenze R7-G4/M8; im
  Screenshot unverändert (Knopf unten links über dem Inhalt), nicht erneut
  vermessen.
- **Geräteuhr-Warnung bei 200 % und 320 × 568:** bekannte Grenze R7-G8/H9; nicht
  erneut gemessen.
- **Zwei „Ansicht"-Schalter im Assistenten:** bleibt, siehe
  [neuer-nutzer.md](../runde-7/neuer-nutzer.md).
- **Ziffern der Schrittleiste (R7-N9)** und **fehlender Zusammenführen-Tipp
  (R7-N1):** bekannte Grenzen, nicht erneut gemeldet.
- **Uhrstand in der Zukunft bei frischer Sammlung (R6-O9):** nicht ausgelöst.
- **38 leere `role="status"`-Elemente im Personal-Schritt (je Person eines):**
  beobachtet im DOM; kein Mobile-Befund, gehört in den Bericht zu Zugänglichkeit
  und Sprachausgabe.

## Bestätigtes

- **Kein seitlicher Überlauf:** Startseite, Assistent 1–6, Einsatzansicht,
  Tabelle im Rollrahmen, Lagemonitor, Musterung, Dialoge, Tablet
  (820 × 1180, 1180 × 820), Zoom-Fenster: `scrollWidth` gleich `innerWidth` in
  jeder Lage.
- **Sprungmarke (R8-M1):** `button.sprungmarke` liegt ohne Fokus bei −44 bis −8 px
  (360 × 640, 320 × 568, 640 × 360, 180 × 320) und −63 bis −8 px bei 200 %;
  bei 320 × 568 mit 200 % verdeckt sie nichts mehr. Die Warnleiste der
  Zwei-Fenster-Lage zeigt ihre erste Zeile ganz.
- **Rückfragen (R8-M2, M8):** „Bogen schließen?" und „Nur die Stärke melden?" bei
  180 × 320: Knöpfe 130 × 44 px untereinander, kein Überlauf, Rumpf 158 von
  288 bis 303 px (49 bis 55 % der Höhe); bei 320 × 568 und 200 % 238 px breit;
  quer gleiche Oberkante (249/249 px, 225/225 px).
- **Zwei-Fenster-Leiste:** 360 × 640 119 px (19 %) mit „Anderen Stand laden" und
  „Meine Fassung behalten" im ersten Bild; 320 × 568 135 px, bei 200 % 187 px;
  quer 53 px, 180 × 320 88 px mit „Entscheiden". Rückfrage „Meine Fassung
  behalten?" nennt Stand und Unterschied („anders: Personal (8 Einträge …)"),
  der Fokus liegt auf „Abbrechen".
- **Fußleiste (R8-M3):** 70 px (11 %) bei 360 × 640, 78 px bei 200 %, 70 px (22 %)
  bei 180 × 320; „←", „◐", „Weiter →" ohne Überlappung.
- **„Bedarf:"-Zeile (R8-M9):** 94 × 92 px im 180er Fenster (29 % der Höhe;
  Runde 8: 288 px), 294 × 72 px bei 360 × 640.
- **Dialoge „Übungsbögen" und „Datensicherung" (R8-M5):** „Schließen" bleibt auch
  am Ende der Liste im Bild (33–77 px bei 360 × 640 und quer, 72–133 px bei
  320/200 %, 92–136 px im 180er Fenster); Listenzeilen 44 px, bei großer
  Schrift 114 bis 210 px.
- **Lagemonitor am Telefon (R8-M4):** Orga, Ort, Funkruf und F/U/M liegen bei
  360 × 640 und 320 × 568 im ersten Bild (Einheitentyp entfällt); alle sechs
  Einheiten stehen, „+ 3 weitere Bewegungen" mit „Eingetroffen: … vor 1 Min";
  quer ohne Überlauf; Knöpfe der „Optionen" 44 px hoch.
- **Musterung (R8-M10):** klebende Leisten 152 von 640 px (24 %) bei 360 × 640,
  152 von 568 px (27 %) bei 320 × 568, 53 von 360 px quer, 67 von 320 px im 180er
  Fenster; Haken 40 px, Stärke- und Gesamtzahl lesbar.
- **Tabelle der Einsatzansicht:** Spaltenfolge Einheit, Zug, F, U, M, Ges., Kfz,
  Auftrag (N7); Namen brechen nicht mehr mitten im Wort.
- **Sollstärke-Marke (R8-A1):** „Sollstärke, nicht gemeldet" 169 × 23 px bei 360,
  186 × 122 px bei 320/200 % (umbricht, kein Überlauf); „Davon 1 Einheit nur
  Sollstärke, nicht gemeldet (38 Personen) — zählt in der Summe mit …" in der
  Summenzeile.
- **Browser-Verlauf:** Startseite → Assistent → Schritt 3 → Zurück ergibt
  Übersicht und Startseite, Vorwärts wieder den Assistenten; ein geöffneter
  Dialog schließt mit Zurück, die Seite bleibt (späte Rückkehr von `back()`).
- **Tablet:** Assistent und Einsatzansicht ohne Überlauf; Ziele 44 px.

## Abgleich mit Runde 8

Legende: **hält**, **teilweise**, **nicht behoben**.

| Befund Runde 8 | Stand in Runde 9 | Nachweis |
| --- | --- | --- |
| R8-M1 Sprungmarke ragt bei 320 px und 200 % ins Bild | **hält** | Unterkante −8 px in allen Lagen; Warnleiste und Kopf frei. |
| R8-M2 Rückfrage im 180er Fenster | **hält** | Knöpfe 130 × 44 px untereinander, Rumpf 49 % der Höhe, kein Überlauf; für die Wahl-Rückfrage mit drei Wegen R9-M2. |
| R8-M3 Fußleiste und Schrittleiste im 180er Fenster | **teilweise** | Fußleiste 22 % einzeilig, Reiter 49 px; Kopf 149 px (47 %), R9-M8. |
| R8-M4 Lagemonitor am Telefon: F/U/M außerhalb | **hält, mit Rest** | F/U/M im Bild, Einheitentyp entfällt; bei 200 % Wortbruch und Rangfolge der Schrift, R9-M1. |
| R8-M5 „Schließen" der Dialoge im Bild, Listenzeilen 44 px | **hält** | „Schließen" am Ende der Liste im Bild, Zeilen 44 px. |
| R8-M6 klebende Namensspalte 37–42 % | **teilweise (bekannte Grenze)** | 37 % (360), 42 % (320), 26 % (320/200 %), 95 % im 180er Fenster (R9-M3); Wortbruch weg. |
| R8-M7 Kurz-Liste: drei Zeilen ohne Feldnamen | **teilweise** | Feldnamen sichtbar; 230 px je Person, Seite 10 057 px, R9-M4. |
| R8-M8 Quer: Knöpfe der Rückfrage 12 px versetzt | **hält** | Oberkanten gleich; Abstand quer 16 px, hochkant 12 px (nicht 24 px), R9-M7. |
| R8-M9 „Bedarf:" im 180er Fenster 90 % der Höhe | **hält** | 92 px (29 %). |
| R8-M10 Musterung: klebende Leisten 38–40 % | **hält** | 21–27 % der Höhe. |

**Nebenwirkungen der Umbauten aus Runde 8:**
- **Sprungmarke jetzt `button.sprungmarke`:** ohne Fokus ganz außerhalb des
  Bildes; keine Nebenwirkung gefunden. Die zuvor verdeckte Speicherzeile ist
  damit sichtbar, fehlt aber bei großer Schrift ganz (R9-M5; war schon vorher
  gewollt, aber bisher verdeckt).
- **Rückfragen mit untereinanderstehenden Knöpfen:** halten; die Wahl-Rückfrage
  mit mehreren Wegen legt zwei Wege in den Rumpf (R9-M2).
- **Schrittleiste zweireihig im Zoom:** Fußleiste kleiner, Kopf größer (R9-M8).
- **Rohtext-Rettung (`eeb.unlesbar.v1`):** Hinweis steht vor dem Hauptweg
  (R9-M6); Datensicherung und Entfernen sind 44 px hoch.
- **Lagemonitor, Telefon ohne Einheitentyp, Stufenleiter, Schrift folgt
  Systemschrift:** Tabelle und Knöpfe halten; bei 200 % Rangfolge der Schrift
  und Wortbruch (R9-M1), Stufenknopf (R9-M9).
- **Sollstärke-Marke:** hält in Karte und Summe, umbricht bei großer Schrift ohne
  Überlauf.

## Abschluss

Die Hauptaufgabe gelingt auf allen geprüften Telefon-Viewports bei 100 % und
200 % Schrift, am Tablet, quer und bei 180 × 320. Die beiden P2 aus Runde 8
(Sprungmarke, Rückfrage im Zoom-Fenster) halten gemessen, ebenso die Behebung
der Dialoge, der Fußleiste, der Musterung und der „Bedarf"-Zeile. Offen sind
kleine Stellen bei starker Schrift oder Zoom: der Lagemonitor als
Telefon-Fallback (Rangfolge der Schrift, Wortbruch), die Wahl-Rückfrage mit
drei Wegen, die klebende Spalte im 180er Fenster und der Kopf des Assistenten
dort, dazu die Länge der Kurz-Liste, die fehlende Speicherzeile bei großer
Schrift und der Kasten der Rohtext-Rettung vor dem Hauptweg.

Befunde: 0 × P0, 0 × P1, 0 × P2, 9 × P3.

**Zuerst beheben:**
1. R9-M2: Alle Wege einer Wahl-Rückfrage in den festen Fuß oder sichtbar
   gestaffelt, damit bei großer Schrift nicht nur „Abbrechen" im Bild steht.
2. R9-M1: Im Lagemonitor die Kernzahlen mit der Systemschrift wachsen lassen und
   Wortbruch in der Tabelle vermeiden.
3. R9-M5: Eine Rückmeldung „gespeichert" auch bei großer Schrift und quer
   zeigen.
4. R9-M6: Hinweis der Rohtext-Rettung hinter den Hauptweg „Neuen Bogen
   erstellen" setzen oder verkürzen.
5. R9-M8 und R9-M3: Kopf und klebende Spalte im 180er Fenster entlasten.
