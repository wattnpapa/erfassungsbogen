# Audit „Analog first", Runde 5 (Papier-Rückfallebene, Rückweg vom Papier)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-analog-first-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Fünfte Runde nach der Behebung der
Runde-4-Befunde.

## Prüfaufbau

Playwright aus `node_modules` mit Chromium unter `/opt/pw-browsers/chromium`,
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 px (Skalierung 2).
Jeder Durchgang lief in einem eigenen, frischen Browser-Kontext, weil elf
weitere Prüfer denselben Server nutzten. Zeiten habe ich deshalb nicht
gewertet. Zuerst habe ich ohne Kenntnis früherer Berichte getestet, danach den
Runde-4-Bericht samt „Stand der Behebung" und die Übersicht gelesen, zuletzt
die übrigen Runde-5-Berichte (soweit vorhanden; sie überschneiden sich nicht
mit diesem Bericht).

Die Zustände kamen als `localStorage`-Seeds aus `examples/thw/`, mit
`uebung: false`:

- `eeb.entwurf.v1`: eigener Bogen `003-crailsheim-fgr-w-a` (0/3/9/12, 3 Fz,
  Code in 2 Teilen).
- `eeb.einsaetze.v1`: Einsatz „Hochwasser Jagst Okt 2026" mit 8 Einheiten
  (Crailsheim, Albstadt, Ulm, Ansbach, Kirchehrenbach, Neu-Ulm, Schwabach,
  Füssen), Füssen abgerückt, vier Einheiten in „1. TZ" und „2. TZ", Eintreffzeiten
  im Abstand von 10 Minuten, Nr. nach Ankunft. Dazu „Grosslage" mit den
  Beispielbögen 001–030.
- Für Seitenumbrüche außerdem `015-ansbach-fgr-log-mw` (9 Fahrzeuge) und
  `grossbogen-verstaerkter-bergungszug` (10 Fahrzeuge, 38 Personen) als eigener
  Bogen.

Heruntergeladen, mit `pdfinfo` und `pdftotext -layout` gelesen und mit
`pdftoppm` gerendert (die Bilder habe ich angesehen):

| Datei | Weg | Seiten |
| --- | --- | --- |
| Blanko-Vordruck | Startseite „Leeren Vordruck drucken (PDF)", Fußzeile, Einsatzansicht, offline | je 2 |
| Blanko-Vordruck | `public/downloads/einheiten-erfassungsbogen-blanko.pdf` | 2, Text identisch zu den App-Fassungen |
| Einzel-PDF Crailsheim | „Bogen übergeben…" → „PDF erzeugen" | 2 (Bogen + Codeseite) |
| Einzel-PDF als Übung | dito | 2, mit Kopfzeile und Wasserzeichen |
| Einzel-PDF Ansbach, Großbogen | dito | 4 / 7 |
| Lageblatt | Einsatzansicht, 8 Einheiten (auch offline, auch als Übung, auch mit einer Übungsmeldung in echter Lage) | 2 |
| Lageblatt | „Grosslage", 30 Einheiten | 3 |
| Sammel-PDF | „Einsatz weitergeben / sichern", 8 Einheiten (auch offline) | 20 |
| Sammel-PDF | „Grosslage", 30 Einheiten | 69 |
| Lageblatt Ersatzgerät | nach Wiederanlauf nur vom Papier | 2 |

Szenarien:

1. **Papier-Rückfallebene:** alle Druckstücke erzeugen und gegenlesen; nach
   „Jetzt offline bereit" mit `setOffline(true)` und Neuladen Blanko,
   Lageblatt und Sammel-PDF noch einmal.
2. **Wiederanlauf nur vom Papier:** die 20 Seiten der Sammel-PDF als Bilder
   (130 dpi) in umgekehrter Reihenfolge auf einem leeren Gerät über „Bögen
   einlesen…" eingelesen, „Lage vom Papier abgleichen…" mit „Nr. laut Blatt"
   und Zug vom Lageblatt, ein doppelt vergebenes Nr. ausprobiert, danach neues
   Lageblatt gedruckt und mit dem alten verglichen.
3. **Wiederanlauf mit Datei:** dieselbe Sammel-PDF über „Einsatz
   importieren…" auf einem leeren Gerät.
4. **Verschlechterte Fotos:** neun Codeseiten, gedreht, verkleinert,
   verrauscht bzw. unscharf, in drei Stufen eingelesen.
5. **Nachtrag vom Meldeblock:** „Einheit schnell erfassen (nur Stärke)…"
   („Biberach", Uhrzeit vom Meldeblock) und Blick in „Einheit manuell
   erfassen…" als Gegenstück zum handgeschriebenen Blanko.

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Die laufende
Nummer („Nr. 3") dient am Meldekopf und im Funk als Kurzbezeichnung. Nach
einem Geräteausfall hängt das zuletzt gedruckte Lageblatt weiter an der
Wand. Eine handschriftlich ausgefüllte Blanko-Seite kommt im Normalfall ohne
Gerät zum Meldekopf, der Meldekopf-Kasten oben auf ihr wird dort ausgefüllt.

**Nicht prüfbar** waren der Kamera-Live-Scan, der Handscanner, echtes Drucken
(Rand, Graustufen, Heften), echte Fotos im Zelt (ersetzt durch gerenderte
Seitenbilder, schärfer als ein Handyfoto, und durch Stufe 3 absichtlich
verschlechterte), echte Akku- und Geräteausfälle (ersetzt durch frische
Browser-Kontexte), nativen Builds und Safari. Das Datum-Zeit-Feld im
Papier-Abgleich zeigte das Headless-Chromium trotz Locale de-DE wieder im
US-Format („10/06/2026, 11:40 AM"). Das hängt an der Prüfumgebung und ist
nicht gewertet; auf einem deutschen Gerät sollte es nachgesehen werden.

## Urteil

Die Papierseite trägt, und sie ist besser geworden. Blanko, Einzel-PDF,
Lageblatt und Sammel-PDF entstehen auch ohne Netz. Der Blanko hat den
Meldekopf-Kasten mit Nr., Zug, „[ ] ÜBUNG" und „ins Gerät übertragen". Das
Lageblatt hat bei acht Einheiten 22 Nachtragszeilen auf zwei Seiten, mit Spalte
„übertragen", und eine eigene letzte Seite. Jede Codeseite nennt die Einheit.
Der Stapelbericht ist kurz, und der Abgleich fragt „Nr. laut Blatt" und
„Auftrag / Notiz" ab. Alle 8 Bögen kamen aus den Seitenbildern zurück, nach
dem Abgleich standen Nr., Zug, Abrückstatus, Stärke und Bedarf wie auf dem
Wandblatt. Eine doppelte Nr. weist der Abgleich ab, ohne etwas zu
übernehmen.

Reibung bleibt an drei Stellen. Erstens verschwindet nach „Abgleich
übernehmen" die Marke „vom Papier, Zeiten prüfen", auch wenn die Eintreffzeiten
nie angefasst wurden; das neue Lageblatt druckt dann für alle Einheiten die
Zeit des Einlesens (R5-A1). Zweitens kommt der Meldekopf-Kasten zwar auf den
Blanko, nicht aber auf das gedruckte Einzel-PDF, das am Meldekopf am häufigsten
ankommt, und die manuelle Erfassung hat für Nr. und Zug kein Feld (R5-A2,
R5-A4). Drittens tragen Folgeseiten mehrseitiger Bögen weder Einheit noch Nr.
(R5-A3).

Aufgaben: Papier erzeugen geht ohne fremde Hilfe, auch offline. Nachträge vom
Meldeblock gehen ohne Umweg zurück. Der Wiederanlauf nur vom Papier gelingt
ohne Hilfe und stimmt diesmal bei den Nummern; nur die Zeiten bleiben auf dem
Wert des Einlesens, wenn man sie nicht selbst einträgt.

## Befunde

### R5-A1 [P1] „Abgleich übernehmen" schreibt die Zeit des Einlesens als Eintreffzeit fort und nimmt die Warnmarke weg

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Leeres Gerät → Einsatz → „Bögen einlesen…" mit den 20
Seitenbildern → „Lage vom Papier abgleichen…" → Nr. und Zug vom Blatt eintragen,
die Eintreffzeit stehen lassen → „Abgleich übernehmen" → Lageblatt. Code:
`src/app/papier-abgleich-ui.tsx` (`oeffnen` belegt `eingetroffen` mit
`eintreffzeit(e)` vor, `uebernehmen` schreibt sie zurück),
`papierAbgleichUebernehmen` in `src/app/eintrag-zeiten.ts` (entfernt `vomPapier`
je Einheit).

**Beobachtung:**
- Das Feld „Eingetroffen am" steht bei allen 8 Zeilen auf „06.10.2026 11:40",
  der Zeit des Einlesens. Das Blatt nennt 10:12 bis 11:22.
- Nach „Abgleich übernehmen" (nur Nr. und Zug geändert, ein Haken bei Füssen
  „abgerückt") steht an den Karten nur „neu" bzw. „kürzlich eingetroffen", die
  Marke „vom Papier, Zeiten prüfen" ist bei allen 8 Einheiten weg. Die Karte
  zeigt „eingetroffen 06.10.2026, 11:40".
- Das neue Lageblatt druckt in „Eingetroffen (abgerückt)" bei allen 8
  Einheiten „06.10.2026, 11:40", bei Füssen als Abrückzeit ebenfalls 11:40. Nichts
  auf dem Blatt kennzeichnet die Zeiten als geschätzt. Das alte Blatt an der
  Wand nennt andere.
- Der Hinweis über der Liste sagt „Eintreffzeit ist die Zeit des Einlesens";
  nach der Übernahme steht er nirgends mehr.

**Erwartung der Rolle:** Was ich nicht vom Blatt eingetragen habe, bleibt als
„Zeit unbestätigt" sichtbar. Oder die App fragt vor dem Übernehmen, ob die
Zeiten wirklich alle gleich sind.

**Auswirkung im Einsatz:** Das Ersatzgerät druckt ein sauberes Lageblatt mit
falschen Eintreffzeiten, ohne Hinweis. Die Zeiten dienen für Nachweise und
für die Einsatzdauer und als Beleg, wer wann da war. Wer nur die Nummern vom
Blatt übernimmt, hat danach den Eindruck, die Lage sei wiederhergestellt, und
übersieht es. Das ist derselbe Mechanismus wie R4-A1 bei den Nummern, nur bei
der Zeit.

**Empfehlung:** Eintreffzeit im Abgleich nicht mit der Einlesezeit vorbelegen,
sondern leer lassen und beim Übernehmen darauf hinweisen, welche Einheiten
keine Zeit haben. Oder die Marke „Zeit nicht vom Blatt" an der Karte und im
Lageblatt so lange stehen lassen, bis die Zeit angefasst wurde. Mindestens vor
dem Übernehmen fragen, wenn alle Zeiten einer Liste gleich sind.

**Verifikation:** Sammel-PDF einlesen, im Abgleich nur Nr. und Zug eintragen,
übernehmen. Die Zeiten müssen danach als nicht bestätigt an Karte und
Lageblatt stehen.

### R5-A2 [P2] Der Meldekopf-Kasten steht nur auf dem Blanko, nicht auf dem gedruckten Einzel-PDF; der Kasten der Sammel-PDF hat kein „übertragen"

**Priorität:** P2

**Nachweis:** beobachtet. Die Folge ist abgeleitet.

**Fundstelle / Aufgabe:** Einzel-PDF (`einzelPdfDokument` in
`src/app/pdf-dokument.ts`), Kasten „Stand am Meldekopf" der Sammel-PDF
(`vermerkKasten`), Blanko (`blankoMeldekopf`, Zeile 1419 ff.).

**Beobachtung:**
- Blanko Seite 1 trägt oben den Kasten „Meldekopf: Nr. ___ · eingegangen am
  ___ um ___ Uhr · Zug / Verband ___" und „[ ] ÜBUNG — kein echter Einsatz ·
  ins Gerät übertragen [ ] von (Kürzel) ___ um ___ Uhr".
- Das Einzel-PDF Crailsheim (Seite 1) beginnt mit dem Kopfbalken
  „Erfassungsbogen …". Es gibt weder Nr., „eingegangen", Zug noch „ins Gerät
  übertragen". Auch auf dem Einzel-PDF eines Ansbacher Bogens (4 Seiten) nicht.
- Der Kasten „Stand am Meldekopf" in der Sammel-PDF ist gedruckter Text
  („Nr. 2 · Eingetroffen … · anwesend · Zug: 1. TZ · Auftrag / Notiz: –") ohne
  Haken „ins Gerät übertragen".
- Der Übungsbogen trägt oben „ÜBUNG — Dieser Bogen beschreibt keinen echten
  Einsatz." und das Wasserzeichen; das ist in Ordnung.

**Erwartung der Rolle:** Jedes Blatt, das ein Meldekopf in die Hand bekommt,
trägt den Platz, auf dem er „angenommen, Nr., übertragen" quittiert.

**Auswirkung im Einsatz:** Die Einheiten drucken ihr Einzel-PDF und geben es
ab; der Blanko ist die Ausnahme. Auf dem häufigsten Papier fehlt der Vermerk,
ob es schon im Gerät ist. Zwei Helfer tippen denselben Stapel, oder ein Blatt
liegt unbemerkt unten. Die Aussage im „Stand der Behebung" von Runde 4, das
Einzel-PDF trage den Kasten „schon", trifft für das Einzel-PDF nicht zu.

**Empfehlung:** Den schmalen Kasten „Eingang Nr. __ · übertragen [ ] Kürzel __"
auch auf das Einzel-PDF (Kopf von Seite 1 oder Fußzeile) und in den Kasten der
Sammel-PDF. Das kostet bei den Einzel-PDFs keine Seite, wenn er in die
Fußzeile oder neben die Stärke kommt.

**Verifikation:** Einzel-PDF und Sammel-PDF drucken. Auf Seite 1 jedes Bogens
steht ein Feld für „übertragen".

### R5-A3 [P2] Folgeseiten mehrseitiger Bögen tragen keine Einheit, und ein Fahrzeugblock reißt über die Seitengrenze

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einzel-PDF und Sammel-PDF eines Bogens mit mehr als
etwa sieben Fahrzeugen oder 25 Personen; Blanko Seite 2
(`src/app/pdf-dokument.ts`).

**Beobachtung:**
- Einzel-PDF Großbogen (10 Fahrzeuge, 38 Personen, 7 Seiten): Seite 2 beginnt mit
  einem zerrissenen Fahrzeugblock („Tiefl 18 t" nur als Bild, der Text fehlt),
  dann kommen zwei ganze Blöcke und 28 Namen. Seite 3 beginnt mit zwei
  Personenzeilen. Beide Seiten tragen als einzige Kennung „Stand: 160900jul26
  2/7" bzw. „3/7" in der Fußzeile, keinen Einheitsnamen.
- Sammel-PDF „Hochwasser Jagst" (8 Einheiten), Ansbach: Seite 5 endet mit einem
  Fahrzeugblock, der oben auf Seite 6 als leerer Kasten mit halbem Bild
  weitergeht („Anhänger THW-80138" folgt als ganzer Block). Seite 6 trägt
  18 Namen, den Sofortbedarf und „Sonstiges: 2 Helfer über StAN-Soll", aber
  weder Einheit noch Nr. Der Kasten „Stand am Meldekopf" steht nur auf Seite 5.
- Blanko Seite 2 hat keine Zeile für die Einheit. Auf ihr stehen Personal,
  Qualifikationen und Sofortbedarf. Die Fußzeile „Stand:" ist leer.

**Erwartung der Rolle:** Jedes Blatt nennt, zu welcher Einheit es gehört, so
wie es die Codeseiten jetzt tun.

**Auswirkung im Einsatz:** Am Meldekopf liegen ungeheftete Stapel mehrerer
Einheiten. Eine verrutschte Seite 6 ist eine Liste von 18 Namen und ein
Sofortbedarf ohne Absender. Die Verpflegung und die Unterbringung einer Einheit
lassen sich dann nicht mehr zuordnen. Mit einer Kopfzeile wäre das ein Blick.

**Empfehlung:** Eine schmale Kopfzeile auf jeder Folgeseite („Nr. 4 · THW
Ansbach · Seite 2 von 2 dieses Bogens"). Fahrzeugblöcke nicht über die Grenze
teilen. Auf dem Blanko ein Feld „Einheit" auch auf Seite 2.

**Verifikation:** Einzel- und Sammel-PDF von Ansbach (9 Fahrzeuge) und dem
Großbogen drucken. Jede Seite nennt die Einheit, kein Fahrzeugblock liegt auf
zwei Seiten. Blanko Seite 2 hat ein Feld „Einheit".

### R5-A4 [P2] Handschriftlicher Blanko: im Gerät fehlt das Gegenstück zu Nr., Zug und Übung; Nachtrag-Zeilen des Lageblatts sind anders aufgebaut als die Erfassung

**Priorität:** P2

**Nachweis:** beobachtet (Felder). Die Folge ist ein Risiko.

**Fundstelle / Aufgabe:** „Einheit manuell erfassen…" und „Einheit schnell
erfassen (nur Stärke)…" (`src/app/schritte/einheit.tsx`, `einsatz.tsx`), Blanko
und Lageblatt (`src/app/pdf-dokument.ts`).

**Beobachtung:**
- Der Meldekopf-Kasten des Blanko hat fünf Angaben: Nr., eingegangen am/um, Zug /
  Verband, Übung, übertragen. In der manuellen Erfassung stehen davon: „Eingetroffen
  um (vom Meldeblock)" (nur Uhrzeit, kein Datum) und, erst in Schritt 2, das
  Häkchen „Dies ist eine Übung". Für Nr. und Zug gibt es kein Feld.
- „Lage vom Papier abgleichen…" mit „Nr. laut Blatt" und „Zug" erscheint nur für
  Meldungen, die aus Seitenbildern kamen. Eine von Hand eingetippte Einheit
  bekommt die nächste Nr. der App; wer nach dem Stapel eine andere Reihenfolge
  hat als der Meldekopf auf dem Papier, hat zwei Nummernreihen.
- Die Nachtragszeilen des Lageblatts haben Spalten „Einheit, Zug, Uhrzeit,
  Stärke …" und „übertragen". Die Schnellerfassung hat dafür Name, Uhrzeit
  und Stärke, aber kein Zugfeld und keine Nr. („Nr." steht auch nicht in der
  Nachtragszeile). „Zug ändern" geht erst an der fertigen Karte.
- Positiv: Die Uhrzeit in der Zukunft fängt eine Rückfrage ab („Stimmt die
  Zeit? Heute / Gestern / Zeit korrigieren"). Schritt 3 verweist auf den Vordruck
  („Vom Papier abtippen? … erst Schritt 4").

**Erwartung der Rolle:** Was auf dem Papier im Kasten steht, kann ich so ins
Gerät übernehmen, auch die Nummer, die ich dem Zettel gegeben habe.

**Auswirkung im Einsatz:** Gerade der Fall, für den der Blanko da ist (Gerät
fehlt, Papier läuft), endet mit zwei Nummernreihen: die auf dem Papier und die
im Gerät. Ein Funkspruch mit „Nr. 9" trifft dann eine andere Einheit.

**Empfehlung:** In der manuellen Erfassung und der Schnellerfassung ein
optionales Feld „Nr. laut Zettel" und „Zug" neben „Eingetroffen um". Damit
passen Papier und Maske zusammen. Mindestens nach dem Übernehmen sagen, welche
Nr. vergeben wurde, und sie am Zettel eintragen lassen.

**Verifikation:** Blanko mit Nr. 9, Zug „2. TZ" ausfüllen, manuell erfassen. Die
Karte trägt Nr. 9 und „2. TZ".

### R5-A5 [P3] Stapelbericht nennt nicht gelesene Codeseiten „Bogen- und Übersichtsseiten"

**Priorität:** P3

**Nachweis:** beobachtet, nachgestellt. Die verschlechterten Fotos sind
absichtlich härter als ein scharfes Handyfoto.

**Fundstelle / Aufgabe:** „Bögen einlesen…" mit schlechten Fotos
(`src/app/stapel-quittung.tsx`).

**Beobachtung:**
- Stufe 1 (2° gedreht, 80 % Größe, JPEG 70) und Stufe 2 (4°, 70 %, Rauschen,
  JPEG 60): 9 Bilder, 8 Bögen aufgenommen.
- Stufe 3 (3°, 55 % Größe, Unschärfe, JPEG 40): „9 Bilder gelesen — 2 Bögen
  aufgenommen. 6 Bilder ohne QR-Code (f-04.jpg, f-12.jpg, f-14.jpg, …) —
  Bogen- und Übersichtsseiten tragen keinen."
- Alle 9 Bilder waren Codeseiten. Die genannten Dateien sind gerade welche, die
  einen Code tragen und nicht gelesen wurden. Die Erklärung „tragen keinen"
  stimmt für sie nicht. Die Liste endet bei drei Namen, den Rest muss man
  raten.

**Erwartung der Rolle:** Seiten, auf denen die App einen Code vermutet, aber ihn
nicht lesen kann, heißen anders als Seiten ohne Code.

**Auswirkung im Einsatz:** Der Satz beruhigt, wo er warnen soll. Wer 8 Einheiten
fotografiert hat und „2 Bögen" liest, merkt es, aber die Dateien, die man
neu fotografieren müsste, sind nicht alle benannt.

**Empfehlung:** Die Zahl der erwarteten Bögen kennt die App nicht; sie kann aber
„nicht lesbar" von „kein Code" trennen (viel Struktur, aber kein Code gefunden)
und die Dateinamen vollständig oder auf Antippen nennen.

**Verifikation:** Neun Codeseiten verschlechtert einlesen. Der Bericht trennt
„nicht lesbar" von „ohne Code" und nennt alle betroffenen Dateien.

### R5-A6 [P3] Blanko fasst 4 Fahrzeuge und 6 Qualifikationen, ohne Hinweis aufs Beiblatt

**Priorität:** P3

**Nachweis:** beobachtet (Kapazität), Risiko (Folge).

**Fundstelle / Aufgabe:** `BLANKO_ZEILEN` in `src/app/blanko.ts`
(Fahrzeuge 4, Personal 34, Qualifikationen 6).

**Beobachtung:**
- 6 der 101 Beispielbögen haben mehr als 4 Fahrzeuge (Ansbach und Hamburg-Mitte
  FGr Log-MW je 9, Waldbröl 6, Schleswig und Westerburg 5, Großbogen 10). Der
  Großbogen hat zudem 38 Personen, die alle eine Zusatzqualifikation tragen.
- Auf dem Blanko steht kein Satz wie „weitere Fahrzeuge auf zweitem Vordruck,
  Blatt 2 von __". Zwei Blanko-Sätze haben zwei Seiten 2 ohne gemeinsame
  Kennung (siehe R5-A3).

**Erwartung der Rolle:** Passt die Einheit nicht auf den Vordruck, sagt der
Vordruck, wie es weitergeht.

**Auswirkung im Einsatz:** Gering. Der Helfer schreibt an den Rand oder greift
zum zweiten Satz, der nicht zum ersten gehört.

**Empfehlung:** Ein Feld „Blatt __ von __" und ein Satz zu weiteren Fahrzeugen
und Qualifikationen.

**Verifikation:** Blanko drucken: Hinweis und Feld sind da, die Seitenzahl
bleibt 2.

### R5-A7 [P3] Sofortbedarf-Kasten des Blanko: Zeilen berühren sich, „Sonstiges" hat nur eine Zeile

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Blanko Seite 2, unten (`src/app/pdf-dokument.ts`).

**Beobachtung:** Im Kasten „Sofortbedarf" liegen vier Zeilen ohne Luft
aufeinander, „[ ] Betriebsstoff" ist oben angeschnitten, die Linie „____ vegan"
läuft in die nächste Zeile. Darunter bleiben für „Sonstiges:" etwa 14 mm bis
zur Fußzeile, also eine Zeile Handschrift. Das gefüllte Einzel-PDF druckt
„Sonstiges" nur, wenn etwas drinsteht.

**Erwartung der Rolle:** Die Kästchen sind groß genug zum Ankreuzen, und für
„Sonstiges" ist Platz.

**Auswirkung im Einsatz:** Gering. Die Kästchen sind mit dem Stift schwer zu
treffen; „Sonstiges" läuft an den Rand.

**Empfehlung:** Zeilenabstand im Kasten erhöhen. Statt der letzten zwei
Personalzeilen auf Seite 2 Platz für „Sonstiges" lassen.

**Verifikation:** Blanko rendern: alle Kästchen frei, mindestens drei Zeilen
für „Sonstiges".

### R5-A8 [P3] Restseiten und Umbrüche der Sammel-PDF bleiben bei großen Lagen

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Sammel-PDF „Grosslage", 30 Einheiten
(`src/app/pdf-dokument.ts`).

**Beobachtung:**
- 69 Seiten. Seite 6 trägt nur den Block „Bedarf gesamt" (9 Textzeilen), alles
  andere der Übersicht steht auf den Seiten 1 bis 5. Seite 67 (Weinsberg, Rest
  des Bogens) trägt drei Qualifikationszeilen, den Sofortbedarf und „Sonstiges"
  (11 Zeilen).
- Bei 8 Einheiten (20 Seiten) keine Seite unter 16 Textzeilen; dort tritt der
  zerrissene Fahrzeugblock aus R5-A3 auf.
- Das Lageblatt der „Grosslage" hat keine zerrissene Zeile mehr (3 Seiten).

**Erwartung der Rolle:** Eine Seite trägt, was zu einer Einheit gehört, nicht
nur ihren Rest.

**Auswirkung im Einsatz:** Gering. Ein Blatt mehr in der Mappe, ein Rest ohne
Kopf (siehe R5-A3).

**Empfehlung:** „Bedarf gesamt" auf Seite 5 oder 1 unterbringen. Mit R5-A3
zusammen lösen.

**Verifikation:** Sammel-PDF der Beispielbögen 001–030: keine Seite unter 12
Textzeilen.

### R5-A9 [P3] Lageblatt: Reihenfolge alphabetisch statt nach Nr., Bemerkung der Einheit am Zeilenende abgeschnitten

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Lageblatt „Grosslage", 30 Einheiten
(`src/app/pdf-dokument.ts`).

**Beobachtung:**
- Die Einheiten stehen alphabetisch (Albstadt, Ansbach, Bamberg, Biberach …),
  die Nr. folgt der Ankunft. In der Spalte stehen sie deshalb als 1, 15, 16, 2, 3,
  17, 18, 4, 19, 5 … Wer „Nr. 17" sucht, liest die Seite von oben.
- In der Spalte „Auftrag / Notiz (Bemerkung der Einheit)" endet die Bemerkung
  bei Weinsberg mit „… MTW OV zusätzlich über St …" und bei Weiden mit „nicht m …".
  Die Notiz des Meldekopfs („Pumpe 2 defekt, Ersatzpumpe …", 120 Zeichen) steht
  dagegen vollständig.
- Bei 8 Einheiten sind die Bemerkungen vollständig.

**Erwartung der Rolle:** Am Wandblatt finde ich per Funk genannte Nr. schnell,
und eine Bemerkung ist ganz oder deutlich als gekürzt mit Verweis gekennzeichnet.

**Auswirkung im Einsatz:** Gering. Die Kürzung ist mit „…" erkennbar, die
vollständige Bemerkung steht auf dem Bogen der Sammel-PDF. Bei 30 Einheiten
kostet die alphabetische Reihenfolge Suchzeit.

**Empfehlung:** Auf dem Lageblatt wahlweise nach Nr. sortieren oder die Nr. in
eine eigene schmale Spalte. Gekürzte Bemerkungen mit „siehe Sammel-PDF" enden
lassen.

**Verifikation:** Lageblatt der 30 Beispielbögen: Nr. in einer eigenen Spalte,
Reihenfolge nach Nr. einstellbar.

**Nur Verweis:** Die gekürzten Rückfragen („Kennzeichen auf Anh steht mehr …")
und „seitdem keine neue Meldung" stehen als R4-K3 und R4-K1 im Bericht
Führungssicht der Runde 4; in den Runde-5-Berichten habe ich keine
Überschneidung mit diesen Befunden gefunden.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, Summen, Prüfhinweise | Blanko aus App oder Datei, offline, textgleich, mit Meldekopf-Kasten (Nr., Zug, Übung, übertragen). Fahrzeuge 4, Beiblatt ungeregelt (R5-A6), Seite 2 ohne Einheit (R5-A3) | „Einheit manuell erfassen…" mit „Eingetroffen um". Nr. und Zug aus dem Kasten haben kein Feld (R5-A4) |
| Bogen übergeben | QR, Link, Datei, PDF mit Code | Einzel-PDF mit Kästchen „von Hand geändert" bei der Stärke und Kopfzeile auf jeder Codeseite. Kein Meldekopf-Kasten (R5-A2) | Code aus Seitenbild lesbar, Stapelbericht kurz. Bei schlechten Fotos ungenau (R5-A5) |
| Lage führen | Laufende Summen, Zwischensummen je Zug, Lageblatt-Stand | Lageblatt mit 22 Nachtragszeilen auf eigener Seite und Spalte „übertragen" | Neue Einheit vom Zettel: Name, Uhrzeit, Stärke. Zug und Nr. nicht erfassbar (R5-A4) |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern": Datei bringt alles, Nummern und Zeiten bleiben | Letzte Sammel-PDF (20 Seiten bei 8 Einheiten, Rest ohne Kopf, R5-A3) oder Lageblatt | Nur Papier: Bögen 8/8, Nr. laut Blatt, Zug, Abrückstatus, Notiz in einem Abgleich. Eintreffzeiten bleiben auf dem Wert des Einlesens, ohne Marke (R5-A1) |

## Würde ich dafür das Papier weglegen?

Für den eigenen Bogen und für den Meldekopf im Normalbetrieb: ja. Die App druckt
offline alles, was ich als Rückfallebene brauche, und der Weg zurück vom Papier
hat sich verbessert: Nummern, Zug, Notiz und Abrückstatus kommen in einem
Abgleich vom Blatt zurück, und eine doppelte Nr. wird nicht still übernommen. Für
den Wiederanlauf nach einem Ausfall noch nicht ganz: Eintreffzeiten bleiben auf
dem Wert des Einlesens, und die Warnmarke verschwindet trotzdem (R5-A1). Bis
das behoben ist, gilt nach einem Wiederanlauf: Zeiten selbst vom Blatt
eintragen, das neue Lageblatt gegen das alte an der Wand lesen.

## Bestätigtes

- Offline nach „Jetzt offline bereit" (`setOffline`, Neuladen): Blanko,
  Lageblatt und Sammel-PDF entstehen ohne Netz. Die Seitenzahlen stimmen mit der
  Online-Fassung überein (2, 2, 20).
- Blanko aus Startseite (im Block „Meinen Bogen ausfüllen", ein Tipp),
  Fußzeile und Einsatzansicht ist im Text identisch mit
  `public/downloads/einheiten-erfassungsbogen-blanko.pdf` (`pdftotext`-Vergleich
  ohne Unterschied, 2 Seiten A4). Er hat den Meldekopf-Kasten, 4 Fahrzeugblöcke,
  34 ganze Personalzeilen (11 auf Seite 1, 23 auf Seite 2), eine Kopfzeile auf
  Seite 2, 6 Qualifikationszeilen und Sofortbedarf mit Ausfülllinien.
- Einzel-PDF Crailsheim: Stärke mit Legende und „[ ] von Hand geändert" in der
  Zelle der Stärke, Rolle je Person, 2 freie Personalzeilen, Einsatzbeginn und
  -ende leer. Die Codeseite trägt „THW Crailsheim … · FuRn … · Stand …" in der
  Kopfzeile. Übungsbogen mit Kopfzeile und Wasserzeichen.
- Lageblatt 8 Einheiten: 2 Seiten. Seite 1 mit den Einheiten, „Abgerückt (1)",
  „Summe laut Gerät" und 8 Nachtragszeilen, Seite 2 mit 14 Zeilen, „Summe
  einschl. Nachträge (von Hand)", „Bedarf gesamt" und „Zwischensummen nach Zug".
  Die Spalte „übertragen [ ] ______" steht an jeder Zeile. Bei 30 Einheiten
  3 Seiten, die letzte mit 12 Zeilen, Summe und Bedarf. Als Übung mit
  Wasserzeichen und „ÜBUNG" je Zeile; eine Übungsmeldung in echter Lage steht mit
  „ÜBUNG — zählt nicht in diese Lage" und zählt nicht in die Summe.
- Sammel-PDF: Übersicht mit Lage und Bedarf, über jedem Bogen der Kasten „Stand am
  Meldekopf" mit Nr., Eintreffzeit, Status, Zug und Notiz; Codeseiten mit
  Kopfzeile aus Nr., Einheit und FuRn.
- Wiederanlauf mit Datei: „Einsatz importieren…" mit der Sammel-PDF auf einem
  leeren Gerät bringt 8 Einheiten, davon 7 anwesend, mit Nr., Zug und Status.
- Wiederanlauf aus Seitenbildern: 20 Bilder, 8 Bögen, Bericht mit 4 statt
  mehr als 10 Zeilen (11 Bilder ohne Code), Knopf „Lage vom Papier
  abgleichen…" im Bericht. Der Abgleich fragt „Nr. laut Blatt (leer = App
  vergibt)", „Eingetroffen am", Status, „Zug" und „Auftrag / Notiz". Mit den Nr.
  und Zügen vom Blatt stimmen Reihenfolge, Stärke 1 / 17 / 49 / 67, 24
  Fahrzeuge, Bedarf und Zwischensummen mit dem alten Lageblatt überein. „Pumpe 2
  defekt" aus dem Notizfeld steht danach an der Einheit. Eine doppelte Nr. wird
  mit „Nichts übernommen" abgelehnt; bleibt eine Nr. leer, sagt die App „Nummern
  vergibt die App neu … neues Lageblatt drucken und das alte abnehmen". Die
  Liste für 8 Einheiten ist 5,8 Bildschirme lang.
- Schnellerfassung: „Eingetroffen um (vom Meldeblock)" und Rückfrage bei
  zukünftiger Zeit. Schritt 3 „Vom Papier abtippen? … erst Schritt 4".
- Fotos mit 2° bis 4° Drehung, 70 bis 80 % Größe und JPEG 60 bis 70: alle 8 Bögen.

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen, auch offline: ja. Nachtrag vom
  Meldeblock: ja. Wiederanlauf nur vom Papier: ja, mit einem Umweg (Zeiten
  selbst eintragen, R5-A1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Abgleich übernehmen" scheint die Lage
  wiederherzustellen, die Eintreffzeiten sind aber noch die des Einlesens.
- **Größtes Einsatzrisiko:** Das Ersatzgerät druckt ein Lageblatt mit richtigen
  Nummern und falschen Zeiten ohne Hinweis (R5-A1).
- **Top-Priorität für die nächste Iteration:** Zeiten im Abgleich nicht
  vorbelegen oder als „nicht vom Blatt" gekennzeichnet lassen (R5-A1).

## Abgleich mit Runde 4

Grundlage: [../runde-4/analog-first.md](../runde-4/analog-first.md) samt „Stand
der Behebung" und [../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Tabelle | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-A1 Nummern nach Wiederanlauf | behoben, mit Grenze | hält | Kasten mit Nr. über jedem Bogen, „Nr. laut Blatt" im Abgleich, 8 von 8 Nummern wie auf dem Wandblatt, doppelte Nr. abgewiesen, Hinweis bei leerer Nr. Grenze wie angegeben: Der QR trägt keine Nr. Ein Gegenstück dazu bei der manuellen Erfassung fehlt (R5-A4). |
| R4-A2 Notiz im Abgleich | behoben | hält | Feld „Auftrag / Notiz" je Zeile, „Pumpe 2 defekt" steht danach an der Einheit. Die Marke verschwindet aber auch ohne Zeiten (R5-A1). |
| R4-A3 Nachtragszeilen | behoben | hält | 8 + 14 Zeilen bei 8 Einheiten, eigene letzte Seite, bei 30 Einheiten 12 Zeilen und Bedarf auf der Seite. |
| R4-A4 „ins Gerät übertragen", „Übung" | behoben | wirkt teilweise | Hält: Meldekopf-Kasten auf dem Blanko, Spalte „übertragen" im Lageblatt. Teilweise: Das Einzel-PDF trägt den Kasten nicht, auch die Sammel-PDF hat keinen Haken (R5-A2); die Aussage, beide brauchten das Feld nicht, trifft nicht zu. Die Felder des Kastens haben in der Erfassung kein Gegenstück (R5-A4). |
| R4-A5 Codeseiten ohne Einheit | behoben | hält, Rest an Folgeseiten | Kopfzeile auf jeder Codeseite (Einzel und Sammel), „von Hand geändert" bei der Stärke auf Seite 1. Folgeseiten des Formulars tragen weiter keine Einheit (R5-A3). |
| R4-A6 Stapelbericht | behoben | hält | 4 statt mehr als 10 Zeilen, Knopf im Bericht, ein Tipp öffnet den Abgleich. Bei nicht lesbaren Fotos die falsche Erklärung (R5-A5). |
| R4-A7 Umbrüche | behoben | wirkt teilweise | Lageblatt ohne zerrissene Zeile. Sammel-PDF „Grosslage": 69 Seiten, Seite 6 mit 9 und Seite 67 mit 11 Zeilen, damit nicht „keine Seite unter 12 Zeilen". Fahrzeugblöcke reißen über die Grenze (R5-A3, R5-A8). |
| R4-A8 Kleinere Stellen | weitgehend | hält wie angegeben | 34 ganze Personalzeilen statt eines Streifens, Kopf wiederholt auf Seite 2, Blanko bei „Meinen Bogen ausfüllen" mit einem Tipp, Hinweis in Schritt 3. Reihenfolge der Schritte unverändert, wie angegeben. |

Bilanz: Von acht Runde-4-Befunden halten fünf voll (R4-A1, R4-A2, R4-A3, R4-A6,
R4-A8 im angegebenen Umfang), drei wirken teilweise (R4-A4, R4-A5, R4-A7).
Sich ins Gegenteil verkehrt hat sich nichts. Die Behebung von R4-A2 hat aber die
Lücke vergrößert, die R5-A1 beschreibt: Nr., Zug und Notiz sind jetzt sorgfältig
abfragbar, die Zeit ist es nicht, und die Marke fällt trotzdem. Die Lageblatt-
Behebung (R4-A3) hat den Preis, den die Tabelle nannte: 6 bis 10 Einheiten ergeben
zwei Seiten, davon eine zum Ausfüllen. Das trägt sich gut, die Wand bleibt
Seite 1.
