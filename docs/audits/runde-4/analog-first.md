# Audit „Analog first", Runde 4 (Papier-Rückfallebene, Rückweg vom Papier)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-analog-first-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Vierte Runde nach der Behebung der
Runde-3-Befunde.

## Prüfaufbau

Playwright aus `node_modules` mit Chromium unter `/opt/pw-browsers/chromium`,
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 px. Jeder Durchgang lief
in einem eigenen, frischen Browser-Kontext, weil elf weitere Prüfer denselben
Server nutzten. Zeiten habe ich deshalb nicht gewertet. Zuerst habe ich ohne
Kenntnis früherer Berichte getestet. Den Runde-3-Bericht samt „Stand der
Behebung" habe ich danach gelesen, die anderen Runde-4-Berichte zuletzt.

Die Zustände kamen als `localStorage`-Seeds aus `examples/thw/`, mit
`uebung: false`:

- `eeb.entwurf.v1`: eigener Bogen `003-crailsheim-fgr-w-a` (FGr W (A),
  0/3/9/12, 3 Fz, Code in 2 Teilen).
- `eeb.einsaetze.v1`: Einsatz „Hochwasser Jagst Okt 2026" mit 8 Einheiten
  (Crailsheim, Albstadt, Ulm, Ansbach, Kirchehrenbach, Neu-Ulm, Schwabach,
  Füssen). Füssen ist abgerückt, vier Einheiten verteilen sich auf „1. TZ" und
  „2. TZ", Ulm trägt die Notiz „Pumpe 2 defekt". Eintreffzeiten 19:16 bis
  20:26 im Abstand von 10 Minuten, die laufende Nummer folgt der Ankunft
  (Crailsheim Nr. 1 … Füssen Nr. 8).
- Für die Seitenzahlen zusätzlich „Grosslage" mit den Beispielbögen 001–030.

Heruntergeladen, mit `pdfinfo` und `pdftotext -layout` ausgelesen, mit
`pdftoppm` gerendert und als Bild angesehen habe ich:

| Datei | Weg | Seiten |
| --- | --- | --- |
| Einzel-PDF Crailsheim | „Bogen übergeben…" → „PDF erzeugen" | 2 (Bogen + Codeseite) |
| Einzel-PDF Ulm als Übung, Deggendorf | dito | 2 / 2 |
| Blanko-Vordruck | Übergabe-Dialog „Weitere Formate", Einsatzansicht, Startseiten-Fußzeile, offline | je 2 |
| Blanko-Vordruck | `public/downloads/einheiten-erfassungsbogen-blanko.pdf` | 2 |
| Lageblatt | Einsatzansicht, 8 Einheiten / 30 Einheiten, auch offline | 1 / 3 |
| Sammel-PDF | „Einsatz weitergeben / sichern", 8 / 30 Einheiten, auch offline | 19 / 68 |
| Lageblatt Ersatzgerät | nach Wiederanlauf nur vom Papier | 1 |

Szenarien:

1. **Papier-Rückfallebene:** alle Druckstücke erzeugen und gegenlesen, nach
   „Jetzt offline bereit" mit `setOffline(true)` und Neuladen noch einmal.
2. **Wiederanlauf nur vom Papier:** Die 19 Seiten der Sammel-PDF als Bilder
   (130 dpi) auf einem leeren Gerät über „Bögen einlesen…" eingelesen, in
   umgekehrter Reihenfolge, wie ein vom Klemmbrett gegriffener Stapel. Danach
   „Lage vom Papier abgleichen…" mit den Werten von Seite 1 ausgefüllt und
   übernommen, dann ein neues Lageblatt gedruckt und mit dem alten verglichen.
3. **Wiederanlauf mit Datei:** dieselbe Sammel-PDF über „Einsatz
   importieren…" auf einem leeren Gerät.
4. **Nachtrag vom Meldeblock:** neue Einheit („Biberach", 0/2/7, eingetroffen
   19:05) und Stärkeänderung einer bekannten Einheit („OV Kirchehrenbach",
   0/2/6/8) über „Einheit schnell erfassen (nur Stärke)…".

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Die laufende
Nummer („Nr. 3") wird am Meldekopf und im Funk als Kurzbezeichnung benutzt,
weil sie auf Lageblatt, Karte und Sammel-PDF gleich steht. Nach einem
Geräteausfall hängt das zuletzt gedruckte Lageblatt weiter an der Wand, bis
das Ersatzgerät eins druckt.

**Nicht prüfbar** waren der Kamera-Live-Scan, der Handscanner, echtes Drucken
und Fotografieren (ersetzt durch scharfe gerenderte Seitenbilder, also
günstiger als ein Handyfoto im Zelt), echte Akku- und Geräteausfälle (ersetzt
durch frische Browser-Kontexte), der Flugmodus eines echten Geräts und die
nativen Builds. Die Datum-Zeit-Felder im Papier-Abgleich zeigte das
Headless-Chromium trotz Locale de-DE im US-Format („10/05/2026, 08:16 PM").
Das hängt an der Prüfumgebung und ist nicht gewertet. Auf einem deutschen
Gerät sollte es nachgesehen werden, weil dort Zahlen vom Blatt abgetippt
werden.

## Urteil

Die Papierseite trägt. Alle vier Druckstücke entstehen auch ohne Netz. Der
Blanko-Vordruck aus der App ist im Text mit der ausgelieferten Datei
identisch. Er hat Stärke-Legende, Rollenspalte, 4 Fahrzeugblöcke und
35 beschreibbare Personalzeilen. Das Einzel-PDF hat zwei freie Personalzeilen und das
Kästchen „von Hand geändert". Das Lageblatt hat Funkrufname mit Rückruf, den
Block „Abgerückt", „Summe einschl. Nachträge (von Hand)" und freie
Nachtragszeilen. Alle 8 Bögen kamen aus den Seitenbildern zurück. Der neue
„Lage vom Papier abgleichen…" bringt Eintreffzeiten, Abrückvermerk und Züge in
einem Schritt zurück. Danach stimmen Stärke, Bedarf und Zwischensummen wieder
mit dem alten Blatt überein. Die Stärkeänderung vom Zettel ändert jetzt nur
die Stärke.

Reibung entsteht beim Wiederanlauf nur vom Papier. Danach tragen 5 von 8
Einheiten eine andere „Nr." als auf dem Blatt, das noch an der Wand hängt. Die
Notiz einer Einheit geht dabei still verloren. Auf dem Papier selbst fehlt ein
Platz für den Vermerk „ins Gerät übertragen". Die Codeseiten sagen nicht, zu
welcher Einheit sie gehören. Bei einer typischen Lage von acht Einheiten hat
das Lageblatt weiter nur zwei Nachtragszeilen.

Aufgaben: Papier erzeugen geht ohne fremde Hilfe, auch offline. Nachträge vom
Meldeblock zurück ins Gerät gehen ohne Umweg. Den Wiederanlauf nur vom Papier
schafft man ohne Hilfe. Danach widersprechen sich Gerät und Wandblatt aber bei
den Nummern (R4-A1).

## Befunde

### R4-A1 [P1] Nach dem Wiederanlauf vom Papier tragen 5 von 8 Einheiten eine andere Nummer als auf dem Blatt (neu)

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Leeres Gerät → Einsatz öffnen → „Bögen einlesen…"
mit den 19 Seitenbildern der Sammel-PDF → „Lage vom Papier abgleichen…" →
„Abgleich übernehmen" → neues Lageblatt. Code: `meldungsNummern` in
`src/app/einheiten-tabelle.ts` (Zeile 126) zählt nach `empfangenAm`.
`papierAbgleichUebernehmen` (`src/app/eintrag-zeiten.ts`) setzt
`eingetroffenAm`. Der Kasten „Stand am Meldekopf" in `src/app/pdf-dokument.ts`
druckt keine Nummer.

**Beobachtung:**
- Ausgangsblatt (Lageblatt und Seite 1 der Sammel-PDF): Nr. 1 Crailsheim,
  Nr. 2 Albstadt, Nr. 3 Ulm, Nr. 4 Ansbach, Nr. 5 Kirchehrenbach, Nr. 6
  Neu-Ulm, Nr. 7 Schwabach, Nr. 8 Füssen.
- Ersatzgerät nach dem Einlesen und auch nach dem Abgleich mit den richtigen
  Eintreffzeiten: Nr. 1 Albstadt, Nr. 2 Ansbach, Nr. 3 Crailsheim, Nr. 4
  Füssen, Nr. 5 Kirchehrenbach, Nr. 6 Neu-Ulm, Nr. 7 Schwabach, Nr. 8 Ulm. Das
  neue Lageblatt druckt diese Nummern.
- Abweichend sind Crailsheim, Albstadt, Ulm, Ansbach und Füssen. Die alte
  „Nr. 3" (Ulm) ist jetzt Crailsheim, die alte „Nr. 8" (Füssen, abgerückt) ist
  jetzt Ulm.
- Der Abgleich fragt die Nummer nicht ab. Der Kasten „Stand am Meldekopf" über
  jedem Bogen nennt Eintreffzeit, Status, Zug und Notiz, aber keine Nummer.
- Gegenprobe: „Einsatz importieren…" mit derselben PDF als Datei behält alle
  acht Nummern.

**Erwartung der Rolle:** Nach dem Abgleich steht im Gerät, was auf dem Blatt
steht. Die Nummer, unter der eine Einheit seit Stunden läuft, bleibt dieselbe.

**Auswirkung im Einsatz:** Nach dem Wiederanlauf hängen zwei Lageblätter
nebeneinander, oder das alte hängt noch, während am Gerät gearbeitet wird.
Kommt per Funk „Nr. 3 rückt ab", markiert der Helfer am Gerät Crailsheim statt
Ulm als abgerückt. Damit stimmen Status, Stärke und Bedarf nicht mehr, und
niemand merkt es, weil beide Einheiten plausibel sind. Gerade nach einem
Ausfall, wenn ohnehin vom Papier gearbeitet wird, ist die Nummer der
naheliegende Bezug.

**Empfehlung:** Die Nummer vom Blatt muss den Wiederanlauf überstehen. Dafür
die Nummer in den Kasten „Stand am Meldekopf" drucken, im Papier-Abgleich ein
Feld „Nr. laut Blatt" anbieten oder die Reihenfolge nach der abgeglichenen
Eintreffzeit bilden. Solange das fehlt, nach dem Abgleich deutlich sagen:
„Nummern neu vergeben, altes Lageblatt abnehmen".

**Verifikation:** Sammel-PDF einer Lage mit Ankunftsreihenfolge ungleich
Alphabet drucken. Die Seiten in beliebiger Reihenfolge auf einem leeren Gerät
einlesen und abgleichen. Jede Einheit muss dieselbe Nummer tragen wie auf dem
alten Lageblatt.

### R4-A2 [P2] Papier-Abgleich übernimmt die Notiz nicht: „Pumpe 2 defekt" geht beim Wiederanlauf verloren (neu, Rest von R3-A2)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Wie R4-A1. Code:
`src/app/papier-abgleich-ui.tsx` mit den Feldern Eintreffzeit, Status samt
Abrückzeit und Zug.

**Beobachtung:**
- Auf dem Blatt steht über dem Ulmer Bogen „Stand am Meldekopf: … Zug: 2. TZ
  · Auftrag / Notiz: Pumpe 2 defekt". Auf Seite 1 steht die Notiz in der
  Spalte „Auftrag / Notiz".
- Die Abgleichliste hat je Einheit nur „Eingetroffen am", „Status" und „Zug".
- Nach dem Abgleich steht auf dem neuen Lageblatt bei Ulm nur „(1 Sollplätze
  unbesetzt.)". Die Notiz fehlt. Die Marke „vom Papier, Zeiten prüfen" ist
  trotzdem weg, die Einheit gilt also als abgeglichen.
- Der Text auf der Codeseite nennt „Auftrag" ausdrücklich unter dem, was
  „nach dem Einlesen von Hand nachzutragen" ist. Der Abgleich bietet dafür
  kein Feld.

**Erwartung der Rolle:** Der Abgleich nimmt alles auf, was im Kasten steht.
Wenn nicht, weist er mich auf den Rest hin.

**Auswirkung im Einsatz:** Ein Auftrag oder ein bekannter Ausfall („Pumpe 2
defekt", „nur für Abschnitt Nord") verschwindet aus der Lage. Die nächste
Schicht disponiert die Einheit, als wäre sie voll einsatzbereit.

**Empfehlung:** Ein Feld „Auftrag / Notiz" je Zeile im Abgleich, oder nach dem
Abgleich ein Hinweis mit den Einheiten, bei denen auf dem Blatt eine Notiz
steht.

**Verifikation:** Einheit mit Notiz drucken, vom Papier einlesen, abgleichen.
Die Notiz muss danach an Karte und Lageblatt stehen.

### R4-A3 [P2] Lageblatt einer typischen Lage hat weiter nur zwei Nachtragszeilen (Rest von R3-A5)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Lageblatt (A4 quer)", 8
Einheiten (7 anwesend, 1 abgerückt, 3 Züge einschließlich „ohne Zug", 3
Rückfragezeilen). Code: `einsatzLageblattSeiteFuellen` in
`src/app/pdf-dokument.ts`.

**Beobachtung:**
- 1 Seite. Unter „Nachtrag von Hand (Einheit, Zug, Uhrzeit, Stärke …)" stehen
  2 leere Zeilen. Danach folgen „Abgerückt (1)", „Summe laut Gerät", die neue
  Zeile „Summe einschl. Nachträge (von Hand)" sowie die Blöcke „Bedarf gesamt"
  und „Zwischensummen nach Zug".
- Bei 30 Einheiten (3 Seiten) sind es reichlich Zeilen: 4 auf Seite 2 und 15
  auf Seite 3.
- Die Behebung füllt die Seite. Eine Seite bleibt aber eine Seite, und bei
  sieben bis zehn Einheiten ist sie mit Bedarf und Zwischensummen schon voll.

**Erwartung der Rolle:** Fällt das Gerät aus, schreibe ich auf dem Aushang
weiter. Bei acht Einheiten kommen in der nächsten Stunde leicht fünf weitere.

**Auswirkung im Einsatz:** Ab dem dritten Nachtrag geht es auf einem Zettel
weiter. Damit gibt es wieder drei Quellen: Gerät, Lageblatt und Zettel.

**Empfehlung:** Mindestens 5 Nachtragszeilen auch auf einem einseitigen Blatt.
Wenn sie nicht passen, gehören „Bedarf gesamt" und „Zwischensummen" auf eine
zweite Seite oder die Nachtragszeilen auf eine Rückseite, die immer
mitgedruckt wird.

**Verifikation:** Lageblatt mit 8 bis 10 Einheiten und zwei Zügen drucken.
Es müssen mindestens 5 leere Nachtragszeilen da sein.

### R4-A4 [P2] Auf dem Papier fehlt ein Feld für den Übertragungsvermerk, auf dem Blanko-Vordruck auch für „Übung" (neu)

**Priorität:** P2

**Nachweis:** Risiko. Die Felder fehlen nachweislich, die Folge ist
abgeleitet.

**Fundstelle / Aufgabe:** Blanko-Vordruck (`src/app/blanko.ts`,
`pdfDokument` in `src/app/pdf-dokument.ts`), Nachtragszeilen des Lageblatts.

**Beobachtung:**
- Der Blanko-Vordruck hat Felder für die Einheit, aber keinen Kasten für den
  Meldekopf („eingegangen um …, Nr. …, Zug …, ins Gerät übertragen [ ] von
  …"). Seine Fußzeile „Stand:" ist leer.
- Die Nachtragszeilen des Lageblatts haben die Spalten der Gerätezeilen, aber
  keine Spalte „übertragen [ ]".
- Der Blanko-Vordruck hat kein Kästchen „Übung". Das digitale PDF druckt bei
  einer Übung „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz." und ein
  Wasserzeichen. In der Schnellerfassung fehlt der Einsatz-Schritt mit dem
  Übungs-Häkchen.

**Erwartung der Rolle:** Auf jedem Papier, das später ins Gerät soll, kann ich
abhaken, dass es drin ist, und wer es eingetragen hat. Eine Übungsmeldung
erkenne ich auch auf Papier als Übung.

**Auswirkung im Einsatz:** Nach einer Papierphase tippen zwei Helfer
denselben Zettelstapel ab, oder ein Blatt bleibt liegen. Doppelte Einheiten
fängt die Rückfrage „Ist das dieselbe Einheit?" meist ab, vergessene nicht.
Ein handschriftlicher Übungsbogen am Meldekopf einer echten Lage wird
mitgezählt.

**Empfehlung:** Auf dem Blanko einen kleinen Kasten „Meldekopf: eingegangen
__:__ · Nr. __ · übertragen [ ] Kürzel __" und ein Kästchen „[ ] Übung". In
den Nachtragszeilen des Lageblatts eine schmale Spalte „übertr.".

**Verifikation:** Blanko und Lageblatt drucken. Die Felder sind da, und der
Vordruck bleibt bei 2 Seiten.

### R4-A5 [P2] Codeseiten nennen die Einheit nicht, das Stift-Kästchen steht nicht beim Bogen (neu)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Letzte Seite des Einzel-PDF und jede Codeseite der
Sammel-PDF (`src/app/pdf-dokument.ts`, QR-Seite).

**Beobachtung:**
- Die Codeseite des Einzel-PDF (Crailsheim, 2 Teile) trägt „Digitaler Bogen
  als QR-Code (2 Teile)", die Anleitung, das Kästchen „[ ] von Hand geändert —
  dann gilt der Code (Stand 161632jul26) nicht mehr" und die Fußzeile
  „Stand: 161632jul26 2/2". Einheitsname und Funkrufname stehen dort nicht.
- In der Sammel-PDF ist es genauso (z. B. Seite 3/19). Nur die
  Seitenzahl in der Fußzeile verbindet die Codeseite mit ihrem Bogen. Beim
  Einzel-PDF fehlt auch die.
- Das Kästchen „von Hand geändert" steht auf der Codeseite. Mit dem Stift
  korrigiert wird aber auf Seite 1, beim Bogen.

**Erwartung der Rolle:** Jedes Blatt sagt, zu welcher Einheit es gehört. Das
Kästchen kreuze ich dort an, wo ich gerade korrigiere.

**Auswirkung im Einsatz:** Am Meldekopf geben mehrere Einheiten ihre
Ausdrucke ab, oft ungeheftet. Liegen die Codeseiten lose, lässt sich ohne
Scannen nicht sagen, welcher Code zu welchem Bogen gehört. Wer auf Seite 1
korrigiert und das Kästchen auf Seite 2 vergisst, liefert einen Code, der als
gültig durchgeht. Der Meldekopf scannt dann den alten Stand.

**Empfehlung:** Kopfzeile auf jeder Codeseite mit Einheit, Funkrufname und
Stand. Das Kästchen „von Hand geändert" zusätzlich auf Seite 1 neben die
Stärke oder in die Fußzeile jeder Seite.

**Verifikation:** Einzel- und Sammel-PDF drucken. Jede Codeseite nennt die
Einheit, und auf Seite 1 jedes Bogens steht das Kästchen.

### R4-A6 [P3] Stapelbericht meldet jede Bogenseite als „Kein QR-Code im Bild gefunden" (neu)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** „Bögen einlesen…" mit allen Seiten der Sammel-PDF
(Stapelbericht, `src/app/stapel-quittung.tsx`, Aufruf aus `src/app/app.tsx`).

**Beobachtung:**
- 19 Bilder, 8 Bögen aufgenommen. Darunter stehen 10 Zeilen „s-01.png: Kein
  QR-Code im Bild gefunden.", eine je Bogenseite und eine für die Übersicht.
  Diese Seiten haben gar keinen Code.
- Nach dem Einlesen zeigt das Telefon nur den Bericht mit dieser Liste. Den
  Hinweis zu „von Hand geändert" und den Knopf „Lage vom Papier abgleichen…"
  sieht man erst nach dem Weiterscrollen. Bei 30 Einheiten wären es
  31 solcher Zeilen.

**Erwartung der Rolle:** Ich fotografiere den ganzen Stapel, ohne zu
sortieren. Die App sagt mir nur, was wirklich fehlt, zum Beispiel einen
fehlenden „Teil 2 / 3".

**Auswirkung im Einsatz:** Die echte Warnung geht zwischen zehn harmlosen
Zeilen unter. Der Helfer sucht Fehler, die keine sind.

**Empfehlung:** Seiten ohne Code zusammenfassen („10 Seiten ohne Code, das
sind Bogen- und Übersichtsseiten") und fehlende Codeteile oben nennen.

**Verifikation:** Ganze Sammel-PDF als Bilder einlesen. Ohne Scrollen sind
Ergebnis, fehlende Teile und der Abgleich-Knopf zu sehen.

### R4-A7 [P3] Umbrüche zerreißen Angaben auf Papier: Sammel-PDF mit Restseite, Lageblatt-Zeile über zwei Seiten (Rest von R3-A3)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Sammel-PDF und Lageblatt der „Grosslage" mit
30 Einheiten (`src/app/pdf-dokument.ts`).

**Beobachtung:**
- Sammel-PDF, 68 Seiten. Seite 10 (Bamberg) und Seite 19 (Deggendorf) tragen
  nur die letzte Zeile des Sofortbedarfs, „M 11 / W 1 / D 0" bzw. dazu
  „Sonstiges: …". Die Beschriftung „Anzahl Unterbringung/WC/Dusche:" steht
  auf der Vorseite. Ursache ist der Kasten „Stand am Meldekopf" über dem
  Bogen. Das Einzel-PDF von Deggendorf hat 2 Seiten ohne Restseite. Bei
  8 Einheiten (19 Seiten) hat keine Seite weniger als 19 Textzeilen.
- Lageblatt, 3 Seiten. Die Zeile „Nr. 8 THW Müllheim Fachgruppe Schwere …"
  bricht am Seitenende. Oben auf Seite 2 stehen „Bergung (B)", die
  Rückfrage und „Gemisch 10 l" ohne Nummer und Namen.

**Erwartung der Rolle:** Was zu einer Einheit gehört, steht auf einem Blatt.

**Auswirkung im Einsatz:** Am Aushang nebeneinander gelesen fehlt bei
Müllheim ein Teil des Bedarfs, und auf Seite 2 steht ein Bedarf ohne Einheit.
In der Mappe ist eine Seite mit einer Zahl Ausschuss.

**Empfehlung:** Lageblatt-Zeilen nicht über Seitenwechsel teilen. Den
Sofortbedarf-Kasten zusammenhalten. Den Seitentest aus R3-A3 um die
Sammel-PDF mit Kasten bei einseitigen Bögen erweitern.

**Verifikation:** Sammel-PDF und Lageblatt der Beispielbögen 001–030 drucken.
Keine Seite unter 9 Textzeilen, keine Einheitszeile über zwei Seiten.

### R4-A8 [P3] Kleinere Stellen am Vordruck und beim Abtippen (Rest von R3-A7)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Blanko-Vordruck, Assistent, Startseite.

**Beobachtung:**
- Blanko Seite 1: Die letzte Personalzeile ist nur ein etwa 3 mm hoher
  Streifen über der Fußzeile, darin kann man nicht schreiben.
- Die Reihenfolge im Assistenten (3. Personal, 4. Fahrzeuge) weicht weiter vom
  Vordruck ab (Fahrzeuge vor Personal).
- Auf der Startseite steht „Blanko-Vordruck (PDF)" nur in der Fußzeile unter
  „Projekt", bei leerem Gerät rund 6 300 px tief. In Einsatzansicht und
  Übergabe-Dialog ist er dagegen mit einem bzw. zwei Tipps erreichbar.

**Erwartung der Rolle:** Jede vorgedruckte Zeile ist beschreibbar. Ich tippe
vom Blatt von oben nach unten ab. Die Papier-Reserve für die eigene Einheit
finde ich, bevor ich sie brauche.

**Auswirkung im Einsatz:** Gering. Eine Zeile fehlt, beim Abtippen wird
geblättert.

**Empfehlung:** Die halbe Zeile weglassen. Reihenfolge angleichen oder im
Assistenten auf den Vordruck verweisen („Fahrzeuge: Blatt oben"). Den Blanko
bei „Meinen Bogen ausfüllen" nennen.

**Verifikation:** Blanko gerendert ansehen: keine Zeile unter Normhöhe. Vom
Startbildschirm in höchstens zwei Tipps zum Blanko.

**Nur Verweis:** Gekürzte Rückfragen auf Lageblatt und Sammel-PDF („Kennzeichen
auf Anh steht mehr … + 1 weitere") stehen als R4-K3 im Bericht
Führungssicht. „Seitdem keine neue Meldung" am Lageblatt trotz Abrücken
steht als R4-K1 dort. Beides habe ich auf meinen Blättern ebenfalls gesehen.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, Summen, Prüfhinweise | Blanko aus App oder Datei, offline, textgleich, mit Legende und Rollenspalte. Kein „Übung", kein Meldekopf-Vermerk (R4-A4) | „Einheit manuell erfassen…" mit „Eingetroffen um (vom Meldeblock)". Reihenfolge weicht ab (R4-A8) |
| Bogen übergeben | QR, Link, Datei, PDF mit Code | Einzel-PDF mit 2 freien Personalzeilen und Kästchen „von Hand geändert" | Code aus Seitenbild lesbar. Codeseite ohne Einheit, Kästchen nicht beim Bogen (R4-A5) |
| Lage führen | Laufende Summen, Zwischensummen je Zug, Lageblatt-Stand | Lageblatt mit Funkrufname, Nr., „Summe einschl. Nachträge". Bei 8 Einheiten nur 2 Nachtragszeilen (R4-A3) | Neue Einheit vom Zettel: 8 Bedienschritte. Stärkeänderung: „nur die Stärke ändern", Fahrzeuge und Bedarf bleiben |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern": Datei bringt alles, Nummern bleiben | Letzte Sammel-PDF (19 Seiten bei 8 Einheiten) oder Lageblatt | Nur Papier: Bögen 8/8, Zeiten, Status, Zug in einem Abgleich. Nummern weichen ab (R4-A1), Notiz geht verloren (R4-A2), Bericht verrauscht (R4-A6) |

## Würde ich dafür das Papier weglegen?

Für den eigenen Bogen und für den Meldekopf im Normalbetrieb: ja. Die App
druckt offline alles, was ich als Rückfallebene brauche. Nachträge vom
Meldeblock kommen ohne Schaden zurück. Für den Wiederanlauf nach einem
Ausfall noch nicht ganz. Nach dem Abgleich zählt das Gerät richtig, nennt
aber dieselben Einheiten unter anderen Nummern als das Blatt an der Wand
(R4-A1). Bis das behoben ist, gilt nach einem Wiederanlauf: altes Lageblatt
abnehmen, neues drucken und die Notizen von Hand nachtragen.

## Bestätigtes

- Offline nach „Jetzt offline bereit" (`setOffline`, Neuladen): Blanko,
  Lageblatt und Sammel-PDF entstehen ohne Netz.
- Blanko-Vordruck aus Übergabe-Dialog, Einsatzansicht und Startseiten-Fußzeile
  ist im Text identisch mit `public/downloads/einheiten-erfassungsbogen-blanko.pdf`
  (`pdftotext`-Vergleich ohne Unterschied). „Stärke (F / UF / M / Ges.)",
  Spalte „Rolle F/UF/M", 4 Fahrzeugblöcke, Sofortbedarf mit Ausfülllinien.
- Einzel-PDF Crailsheim: Stärke mit Legende, Rolle je Person, 12 Personen und
  2 freie Zeilen, Einsatzbeginn/-ende leer zum Eintragen, Kästchen „von Hand
  geändert" mit Stand, eingebettetes `erfassungsbogen.json`. Übungsbogen mit
  Störer „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz."
- Nach „PDF erzeugen" steht „PDF erzeugt 20:52 Uhr — Empfang nicht bestätigt"
  mit dem Knopf „Gegenstelle hat ihn — als übergeben vermerken".
- Lageblatt: Funkrufname und Rückruf, Nr., Zug, Bedarf, Block „Abgerückt (1)"
  mit „ab 05.10.2026, 20:35", „Summe laut Gerät" und „Summe einschl. Nachträge
  (von Hand)", Zwischensummen je Zug, „Erstellt 05.10.2026, 20:36".
- Sammel-PDF mit 8 Einheiten: 19 Seiten, keine unter 19 Textzeilen, Kasten
  „Stand am Meldekopf" mit Notiz über jedem Bogen, eingebettet
  `einsatz-sammlung.json` und `einsatz.json`. Als Datei auf einem leeren Gerät
  über „Einsatz importieren…" kommt alles, auch die Nummern.
- Seitenbilder der ganzen Sammel-PDF in einem Durchgang: 8 von 8 Bögen,
  darunter Codes mit 2 und 3 Teilen. Die Karten tragen „vom Papier, Zeiten
  prüfen". Die Abgleichliste steht in derselben alphabetischen Reihenfolge wie
  Seite 1 des Blatts. Nach „Abgleich übernehmen" stimmen Stärke
  1 / 17 / 49 / 67, 24 Fahrzeuge, Bedarf und Zwischensummen mit dem alten
  Lageblatt überein. Füssen steht wieder unter „Abgerückt".
- Schnellerfassung vom Meldeblock: neue Einheit in 8 Bedienschritten mit
  „Eingetroffen um (vom Meldeblock)". Stärkeänderung „OV Kirchehrenbach"
  0/2/6/8: Die Rückfrage bietet zuerst „Ja — nur die Stärke … ändern (0 / 2 /
  7 / 9 → 0 / 2 / 6 / 8)". Danach Gesamt 67 → 66, Fahrzeuge 24, Diesel 775 l,
  Ruhezeit 3× unverändert, Nr. 5 bleibt.

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen, auch offline: ja. Nachtrag vom
  Meldeblock: ja. Wiederanlauf nur vom Papier: mit Umwegen. Nummern und Notiz
  stimmen danach nicht (R4-A1, R4-A2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Nach „Abgleich übernehmen" scheint die Lage
  wiederhergestellt. Die Nummern sind aber neu vergeben, und die Notizen fehlen.
- **Größtes Einsatzrisiko:** Eine Funkmeldung mit der alten Nummer vom
  Wandblatt trifft am Ersatzgerät die falsche Einheit (R4-A1).
- **Top-Priorität für die nächste Iteration:** Die Nummer vom Blatt muss den
  Wiederanlauf überstehen: im Kasten „Stand am Meldekopf" drucken und im
  Abgleich übernehmen (R4-A1).

## Abgleich mit Runde 3

Grundlage: [../runde-3/analog-first.md](../runde-3/analog-first.md) samt
„Stand der Behebung" und [../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Stand laut Tabelle | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-A1 Stärkeänderung als neue Fassung | behoben | hält | „Ja — nur die Stärke … ändern" steht zuerst, die neue Fassung nennt, was bleibt bzw. wegfällt. Gesamt 67 → 66, Fahrzeuge, Diesel, Ruhezeit unverändert, Nummer bleibt. |
| R3-A2 Übernahme nur vom Papier | teilweise | wirkt teilweise, mit Nebenwirkung | Hält: Marke „vom Papier, Zeiten prüfen", Abgleich in einem Schritt, Summen danach gleich dem alten Blatt. Bleibt: Abtippen vom Blatt, Abgleich-Knopf nach dem Einlesen nicht im Bild (R4-A6), Notiz fehlt im Abgleich (R4-A2). Neu sichtbar: Nummern weichen nach dem Abgleich vom Blatt ab (R4-A1). |
| R3-A3 Sammel-PDF mit Leerseiten | behoben | hält überwiegend | 8 Einheiten: 19 Seiten, keine unter 19 Textzeilen. Bei 30 Einheiten 2 Restseiten mit nur der letzten Sofortbedarf-Zeile, ausgelöst durch den Kasten über einseitigen Bögen (R4-A7). |
| R3-A4 Ausgelieferter Blanko veraltet | behoben | hält | Datei unter `public/downloads/` und App-Erzeugung im Text identisch, mit Legende und Rollenspalte. |
| R3-A5 Lageblatt: Nachtragszeilen, Summe von Hand | behoben | wirkt teilweise | Hält: „Summe einschl. Nachträge (von Hand)", mehrseitige Blätter mit vielen Zeilen (15 auf Seite 3 bei 30 Einheiten). Teilweise: einseitiges Blatt mit 8 Einheiten weiter nur 2 Zeilen (R4-A3). Leerer Einsatz nicht nachgeprüft. |
| R3-A6 Einzel-PDF ohne Platz, Legende, Rolle | weitgehend | hält wie angegeben | Legende, Rolle, 2 freie Personalzeilen bei Crailsheim. Kein leerer Fahrzeugblock, weil er nicht ohne neue Seite passt, wie in der Tabelle als offen genannt. |
| R3-A7 Kleine Abgleichhilfen | weitgehend | hält wie angegeben | „PDF erzeugt … — Empfang nicht bestätigt". Blanko in Einsatzansicht (1 Tipp), Übergabe-Dialog (2 Tipps) und Fußzeile. Offen wie angegeben: Reihenfolge Personal/Fahrzeuge (R4-A8). Auf der Startseite steht der Blanko nur tief in der Fußzeile. |

Bilanz: Von sieben Runde-3-Befunden halten drei voll (R3-A1, R3-A4, R3-A6 im
angegebenen Umfang), R3-A3 hält überwiegend und R3-A7 wie angegeben. R3-A5
wirkt nur bei mehrseitigen Blättern ganz. R3-A2 hat den größten Schritt
gemacht: Die Lage kommt jetzt in einem Abgleich zurück. Gerade dadurch
fällt auf, dass die Nummern danach nicht mehr zum Papier passen (R4-A1).
Keine Behebung hat sich ins Gegenteil verkehrt. Der Kasten „Stand am
Meldekopf" erzeugt aber bei großen Lagen wieder Restseiten (R4-A7).
