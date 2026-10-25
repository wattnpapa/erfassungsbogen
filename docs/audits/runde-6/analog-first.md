# Audit „Analog first", Runde 6 (Papier-Rückfallebene, Rückweg vom Papier)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-analog-first-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011. Zwei spätere Commits auf `main` ändern nur den Lagemonitor und
sind im geprüften Build nicht enthalten.

Reiner Prüfbericht, keine Codeänderung. Sechste Runde nach der Behebung der
Runde-5-Befunde (Paket 2 und 4 betreffen diese Rolle).

## Prüfaufbau

Playwright aus `node_modules` mit Chromium unter `/opt/pw-browsers/chromium`,
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 px (Skalierung 2).
Jeder Durchgang lief in einem eigenen, frischen Browser-Kontext, weil elf
weitere Prüfer denselben Server nutzten. Zeitmessungen unter dieser Last sind
unsicher und stehen nur als Größenordnung da. Zuerst habe ich ohne Kenntnis
früherer Berichte getestet, danach den Runde-5-Bericht samt „Stand der
Behebung" und die Übersicht gelesen, zuletzt die übrigen Runde-6-Berichte,
soweit vorhanden.

Zustände: `localStorage`-Seeds aus `examples/thw/` mit `uebung: false`, `stand`
und Einsatzzeitraum auf den Prüftag gesetzt (sonst anonymisiert die App den
Entwurf nach 90 Tagen):

- `eeb.entwurf.v1`: `013-ulm-b` (0/2/6/8, 2 Fz), `003-crailsheim-fgr-w-a`
  mit Namen in kyrillischer und arabischer Schrift, Emoji und Sonderzeichen
  („Łukasz Şahin-Őry", „≠ → ✓ ≥ ⚠ ☎"), `grossbogen-verstaerkter-bergungszug`
  (38 Personen, 10 Fz) und `013` als Übung.
- `eeb.einsaetze.v1`: „Hochwasser Weser" mit 6 Bögen (013, 001, 003, 004, 011,
  022), über „Bögen einlesen…" aufgenommen; dieselbe Lage um eine von Hand
  erfasste Einheit (Sinsheim, Nr. 7 und Zug „1. TZ" laut Zettel, Eintreffzeit
  10:30, „Nur Stärke"); „Grosslage" mit den Bögen 001–030; „Wiederanlauf" und
  „Fotos" als leere Geräte für den Rückweg.

Heruntergeladen, mit `pdfinfo`, `pdftotext -layout`, `pdftotext -bbox`,
`pdffonts` gelesen und mit `pdftoppm` gerendert (die Bilder habe ich
angesehen):

| Datei | Weg | Seiten |
| --- | --- | --- |
| Einzel-PDF Ulm | „Bogen übergeben…" → „PDF erzeugen" | 2 |
| Einzel-PDF Großbogen | dito | 7 (4 Codeseiten, 7 Teile) |
| Einzel-PDF als Übung, Ansicht „Nacht" | dito | 2, hell, mit Wasserzeichen |
| Einzel-PDF mit Sonderzeichen | dito | 2 |
| Blanko-Vordruck | Startseite „Leeren Vordruck drucken (PDF)" | 2 |
| Blanko-Vordruck | `public/downloads/einheiten-erfassungsbogen-blanko.pdf` | 2, pixelgleich (Differenzbild bei 80 dpi leer), Text identisch |
| Lageblatt | 6 Einheiten / 7 Einheiten mit Nachtrag / nach Abgleich mit Abrückstand / 30 Einheiten / Sonderzeichen | 2 / 2 / 2 / 4 / 1 |
| Sammel-PDF | 6 / 7 / nach Abgleich / 30 Einheiten / Sonderzeichen | 11 / 14 / 11 / 66 / 4 |

Szenarien:

1. **Papier erzeugen und gegenlesen:** alle Druckstücke, Kopfzeile im
   Seitenrand (Nr., Einheit, Blatt x von y, „übertragen"), Meldekopf-Kasten und
   Beiblatt-Hinweis des Blanko, Nachtragszeilen, Kürzung „Rest: Sammel-PDF",
   Sortierung nach Nr., Schriftcodierung (`pdffonts`: Helvetica/WinAnsi) und
   Zeichenersatz.
2. **Wiederanlauf nur vom Papier:** die elf Seiten der Sammel-PDF als Bilder
   (130 dpi) auf einem leeren Gerät über „Bögen einlesen…", dann „Lage vom
   Papier abgleichen…" mit Nr. 1–6 laut Blatt, Eintreffzeit nur bei zwei
   Einheiten, Zug, eine Einheit „abgerückt" (zuerst ohne Abrückzeit); danach
   Lageblatt und Sammel-PDF neu.
3. **Verschlechterte Fotos:** vier Codeseiten (60 dpi, Unschärfe, 6° Drehung,
   JPEG 35) neben zwei guten Seiten.
4. **Wiederanlauf mit Datei:** Sammel-PDF mit Nr. 7 und Zug über „Einsatz
   importieren…" auf einem leeren Gerät.
5. **Nachtrag vom Meldeblock:** „Einheit manuell erfassen…" mit „Nr. laut
   Zettel", „Zug / Verband", „Eingetroffen um", Rückfrage „Stärke nicht
   gezählt", „Nur Stärke".

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Die laufende
Nummer („Nr. 3") dient am Meldekopf und im Funk als Kurzbezeichnung. Nach einem
Geräteausfall hängt das zuletzt gedruckte Lageblatt weiter an der Wand. Ein
handschriftlich ausgefüllter Blanko kommt ohne Gerät zum Meldekopf.

**Nicht prüfbar** waren echtes Drucken (nicht bedruckbarer Rand, Graustufen,
Heften, Lochen), der Kamera-Live-Scan, der Handscanner, echte Fotos im Zelt
(ersetzt durch gerenderte und absichtlich verschlechterte Seitenbilder),
die PDF-Vorschau im Bogen (Headless-Chromium zeigt sie nicht), das
Datum-Zeit-Feld im Abgleich (Headless-Chromium zeigt es trotz de-DE im
US-Format, nicht gewertet), echte Akku- und Geräteausfälle (ersetzt durch
frische Browser-Kontexte), native Builds und Safari. Zeitmessungen unter der
Last von elf Prüfern sind unsicher.

## Urteil

Die Papierseite trägt, und sie trägt besser als in Runde 5. Jeder Bogen, jedes
Lageblatt und die Sammel-PDF entstehen mit Kopfzeile im Seitenrand; auf jeder
Folgeseite stehen Nr., Einheit und „Blatt x von y", kein Fahrzeugblock reißt
mehr über die Seitengrenze. Der Blanko hat Meldekopf-Kasten und Beiblatt-
Hinweis und ist mit der ausgelieferten Datei pixelgleich. Das Lageblatt steht
nach Nr., kürzt Bemerkungen mit „(Rest: Sammel-PDF)" und hat auch bei 30
Einheiten Nachtragszeilen mit „übertragen". Der Rückweg gelingt: Aus elf
Seitenbildern kamen alle sechs Bögen zurück, der Abgleich übernimmt Nr., Zug,
Status und Abrückzeit, ohne Eintreffzeit steht die Zeit „nicht bestätigt (vom
Papier)" an Karte, Lageblatt und Übersichtsseite der Sammel-PDF, und die Zeit
des Einlesens ist nicht mehr vorbelegt. „Nr. laut Zettel" und „Zug" gibt es
jetzt in der manuellen Erfassung, und die vergebene Nr. kommt in der Sammel-PDF
und im Lageblatt an.

Reibung bleibt an drei Stellen, alle in der Spur der Runde-5-Behebungen. Die
Marke „nicht bestätigt" fehlt genau in dem Kasten, aus dem der Abgleich die
Angaben ablesen lässt (R6-A1). Die neue Kopfzeile liegt 2,1 mm vom Papierrand
und könnte beim Drucken fehlen (R6-A2). Und eine am Meldekopf nur nach Stärke
erfasste Einheit druckt vorbelegte Fahrzeugangaben wie gemeldet (R6-A3).

Aufgaben: Papier erzeugen geht ohne fremde Hilfe. Nachtrag vom Meldeblock geht
mit Nr. und Zug zurück. Der Wiederanlauf nur vom Papier gelingt ohne Hilfe.

## Befunde

### R6-A1 [P2] Kasten „Stand am Meldekopf" druckt die Einlesezeit als „Eingetroffen", ohne „nicht bestätigt"

**Priorität:** P2

**Nachweis:** gemessen (`pdftotext` der Sammel-PDF nach teilweisem Abgleich).

**Fundstelle / Aufgabe:** Sammel-PDF nach „Lage vom Papier abgleichen…" ohne
Eintreffzeit; `meldekopfVermerk` in `src/app/pdf-dokument.ts` (Zeile 1112 ff.).
Die Marke kommt nur über `zeitUnbestaetigt` (`src/app/pdf.ts` Zeile 179) in die
Übersichtstabelle.

**Beobachtung:**
- Übersichtsseite 1 der Sammel-PDF und das Lageblatt tragen bei den vier
  Einheiten ohne Zeit vom Blatt „11:22 / Zeit nicht bestätigt (vom Papier)".
- Der Kasten über jedem Bogen und der Kasten auf jeder Codeseite derselben
  Datei lauten „Nr. 4 · Eingetroffen 17.10.2026, 11:22 · anwesend · Zug: – ·
  Auftrag / Notiz: –", ohne Marke (sechs Kästen in 11 Seiten, alle ohne).
- Die App verweist beim Abgleich auf diesen Kasten: „Die Angaben vom Blatt
  (Seite 1 bzw. Kasten „Stand am Meldekopf") hier in einem Schritt eintragen."

**Folge:** Fällt das Ersatzgerät ein zweites Mal aus und der Wiederanlauf läuft
von dieser Sammel-PDF, liest der Helfer im Kasten eine Eintreffzeit, die nie
bestätigt war, und trägt sie als vom Blatt ein. Die Marke ist dann gelöscht,
und die falsche Zeit gilt als belegt. Das ist der Mechanismus aus R5-A1 eine
Papiergeneration später.

**Empfehlung:** Den Kasten mit denselben Daten füttern wie die Übersicht:
„Eingetroffen 11:22 (nicht bestätigt, vom Papier)". Alternativ bei unbestätigter
Zeit im Kasten „Eingetroffen (nicht festgehalten)" drucken; den Text gibt es
im Code schon.

**Nachprüfung:** Einheit vom Papier ohne Zeit abgleichen, Sammel-PDF erzeugen:
Kasten und Codeseiten tragen dieselbe Kennzeichnung wie die Übersicht.

### R6-A2 [P2] Kopfzeile jeder Bogenseite liegt 2,1 mm vom oberen Papierrand, mit 7,5 pt

**Priorität:** P2

**Nachweis:** gemessen (Position), Folge Risiko. Echtes Drucken war nicht
prüfbar.

**Fundstelle / Aufgabe:** `RAND_ZEILE_Y = 6` und `randZeile` in
`src/app/pdf-dokument.ts` (Zeile 1154 ff.); Einzel-PDF Seite 1, alle Seiten der
Sammel-PDF.

**Beobachtung:**
- Der Rahmen der Kopfzeile beginnt bei y = 6 pt, der Text bei 8 pt, also 2,1 bzw.
  2,8 mm vom Papierrand (`pdftotext -bbox`, gerendert bestätigt). Auf Seite 1
  des Einzel-PDFs steht dort der einzige Platz für Nr., „eingegangen" und
  „übertragen"; er ist fett gerahmt, die Zeilen zum Schreiben („____:____")
  sind je etwa 4 mm breit.
- Die Fußzeile liegt dagegen 8,8 mm vom unteren Rand.

**Folge:** Viele Laser- und Tintendrucker lassen oben etwa 3 bis 6 mm unbedruckt
(Annahme, Geräte nicht geprüft). Dann fehlt der Rahmen oder die obere Hälfte der
Zeile, ausgerechnet die Quittung des Meldekopfs. Die Nr. steht im Einzel-PDF
sonst nirgends. Auf dem Bildschirm und in jeder PDF-Ansicht sieht es richtig
aus; der Fehler fällt erst am Papier auf.

**Empfehlung:** Die Zeile mindestens 6 bis 8 mm vom Rand setzen (der Satz hat
laut Code oben Luft) und mit einem Probedruck auf einem Bürodrucker prüfen. Ein
Ausdruck „Seite 1 von Ulm" ohne gelesene Kopfzeile sollte im Test auffallen.

**Nachprüfung:** Einzel-PDF und Sammel-PDF auf zwei Bürodruckern ausdrucken;
Kopfzeile ist ganz lesbar, das Kästchen „übertragen" lässt sich ankreuzen.

### R6-A3 [P2] Vorbelegung aus dem Einheitstyp druckt als gemeldet: „Ausstattung nach StAN: ja [X]" und Funkrufname einer nur nach Stärke erfassten Einheit

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** „Einheit manuell erfassen…" (Sinsheim, „Nur Stärke",
Nr. 7) → Sammel-PDF Seite 13 und Lageblatt Zeile Nr. 7; Vorbelegung nach StAN in
`src/app/nacherfassung.tsx` / Bogen aus dem Einheitstyp; Ausgabe in
`src/app/pdf-dokument.ts`.

**Beobachtung:**
- Das Gerät belegt beim Wählen des Einheitstyps „Bergungsgruppe" 9 Personen
  (Namen offen) und 2 Fahrzeuge (Kennzeichen offen) vor. Die Rückfrage „Stärke
  nicht gezählt" und der Satz „Personal am Meldekopf nur in Stärke erfasst."
  auf dem Bogen sind gut.
- Auf dem Bogen der Sammel-PDF stehen die beiden Fahrzeugblöcke mit
  „Ausstattung nach StAN: ja [X] / nein [ ]" angekreuzt und „FuRn: Heros
  Sinsheim 22/51" im Kopf. Niemand hat das gemeldet.
- Im Lageblatt zeigt Nr. 7 „Heros Sinsheim 22/51" in der Spalte „Funkrufname /
  Rückruf" und „Fzg 2"; die Summe lautet 14 statt 12 Fahrzeuge. Die Zeile nennt
  „Kennzeichen fehlt; Kennzeichen fehlt" zweimal und „Sitzplätze fehlen: 9".

**Folge:** Das Papier ist das, was an der Wand hängt und am Funk gelesen wird.
Ein Funkrufname, den der Meldekopf selbst nie bekommen hat, steht in derselben
Spalte wie die gemeldeten; „StAN ja" sagt der Führungsstelle, die Einheit habe
das bestätigt. Es ist ein Vorschlag, aber er sieht aus wie eine Aussage.

**Empfehlung:** Bei Einheiten, deren Personal nur als Stärke erfasst ist, die
Vorbelegung auf dem Papier als solche kennzeichnen („nach StAN vorbelegt, nicht
gemeldet") oder die Kästchen leer lassen. Doppelte Hinweise („Kennzeichen
fehlt") einmal nennen, mit Zahl.

**Nachprüfung:** Einheit nur nach Stärke erfassen, Lageblatt und Sammel-PDF
drucken: kein „ja [X]" und kein Funkrufname ohne Kennzeichnung „nicht gemeldet".

### R6-A4 [P3] Beiblatt-Hinweis des Blanko nennt Personal nicht und ist mit 6,5 pt eng gesetzt

**Priorität:** P3

**Nachweis:** gemessen (Zeilenzahl und Beispiele), Folge Risiko.

**Fundstelle / Aufgabe:** Blanko Seite 1, Kasten „Meldekopf", Zeile „Blatt ____
von ____ · Reicht der Platz nicht …" (`src/app/pdf-dokument.ts` Zeile 1701 ff.).

**Beobachtung:**
- Der Blanko fasst 10 + 19 = 29 Personalzeilen. Der Hinweis nennt „mehr als 4
  Fahrzeuge oder 6 Qualifikationen", das Personal fehlt.
- Von den 443 Beispielbögen haben 20 mehr als 29 Personen (THW: der Großbogen
  mit 38; sonst Züge der Feuerwehr, des Katastrophenschutzes und der
  Bundeswehr mit 30 bis 73).
- Die beiden Hinweiszeilen sind klein und berühren einander
  (gerendert bei 150 dpi; Unterlängen der oberen Zeile laufen in die untere).

**Folge:** Ein Zug mit 34 Helfern schreibt die letzten fünf an den Rand oder
lässt sie weg. Der Hinweis auf das Beiblatt trifft ihn nicht.

**Empfehlung:** „… oder mehr als 29 Personen" ergänzen und die Zeile in 7–8 pt
mit Luft setzen.

**Nachprüfung:** Blanko drucken: Der Hinweis nennt die Personenzahl, die Zeilen
berühren sich nicht.

### R6-A5 [P3] Namen in nicht lateinischer Schrift und Emoji erscheinen auf allen PDFs als „?"

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** `winAnsiText` in `src/app/pdf-dokument.ts` (Zeile 211);
Einzel-PDF, Lageblatt, Sammel-PDF.

**Beobachtung:**
- Ersatz funktioniert für Sonderzeichen und lateinische Akzente: „≠" wird „!=",
  „→" „->", „✓" „x", „Łódź" „Lódz", „Şahin-Őry" „Sahin-Ory", „Čapek" „Capek",
  „Đorđe" „Dorde". Der Titel, die Kopf- und Fußzeilen und der Einsatzname
  laufen durch denselben Ersatz („Lódz Übung != Ernstfall x ?").
- Kyrillische und arabische Namen werden „???????, ?????" bzw. „??????, ????"
  in der Personenliste; ein Emoji ein „?". Eine Warnung steht weder am Bogen noch
  auf dem Papier. Der Code im QR und die JSON-Datei in der PDF tragen den Namen
  weiter.

**Folge:** Gering. Wer Helfer mit nicht lateinischen Namen führt, hat auf
Papier eine Zeile aus Fragezeichen; die Person ist nicht zuzuordnen.

**Empfehlung:** Beim Erzeugen kurz sagen, dass n Namen auf Papier nicht
darstellbar sind, oder die Umschrift (nach DIN 1460) vorschlagen.

**Nachprüfung:** Bogen mit kyrillischem Namen drucken: ein Hinweis nennt es
oder die Umschrift steht dort.

### R6-A6 [P3] Abgleich verweigert alles, wenn bei einer abgerückten Einheit die Abrückzeit fehlt

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** „Lage vom Papier abgleichen…", `src/app/papier-abgleich-ui.tsx`
Zeile 118.

**Beobachtung:** Wer bei Crailsheim „abgerückt" wählt, aber keine Abrückzeit hat,
bekommt „Abgleich unvollständig … Abrückzeit fehlt. Nichts übernommen." Die
bereits eingetragenen Felder (Nr., Zug, Status) bleiben stehen (geprüft), es
wird aber auch für die anderen fünf Einheiten nichts übernommen. Die Eintreffzeit
darf dagegen fehlen („nicht bestätigt").

**Folge:** Gering. Wo das Wandblatt nur „abgerückt" sagt, ohne Uhrzeit, muss der
Helfer eine schätzen oder den Haken weglassen.

**Empfehlung:** Abrückzeit wie die Eintreffzeit behandeln: leer lassen
dürfen, Hinweis „Abrückzeit nicht bestätigt" an Karte und Lageblatt.

**Nachprüfung:** Einheit „abgerückt" ohne Zeit übernehmen: Übernahme klappt,
Karte und Lageblatt kennzeichnen die fehlende Zeit.

### R6-A7 [P3] Der Hinweis „PDF ist für Papier, hell" steht nicht dort, wo das PDF erzeugt wird

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** „Bogen übergeben…" → „PDF erzeugen" in Ansicht „Nacht";
Hinweise in `src/app/fusszeile.tsx` (Zeile 817) und `src/app/einsaetze-ui.tsx`
(Zeile 1899).

**Beobachtung:** Der Satz steht unter „Blanko-Vordruck (PDF)" in der Fußzeile und
in der Einsatzansicht („Die PDFs sind für Papier gedacht — hell, auch in der
Ansicht „Nacht"."). Im Dialog „Bogen übergeben", wo die meisten das PDF
erzeugen, und bei „PDF-Vorschau" fehlt er. Das erzeugte PDF ist in „Nacht"
hell (mittlere Helligkeit 224 von 255, Weiß-Papier, ÜBUNG-Wasserzeichen rot).

**Folge:** Gering. Wer in „Nacht" arbeitet, sieht eine dunkle Maske und fürchtet
einen schwarzen Ausdruck oder wechselt die Ansicht für den Druck.

**Empfehlung:** Den Satz an „PDF erzeugen" setzen, mindestens in der Ansicht
„Nacht".

**Nachprüfung:** In „Nacht" „Bogen übergeben…" öffnen: der Satz steht am Knopf.

### R6-A8 [P3] „Nur Stärke" startet mit den Sollzahlen der StAN in den Zählfeldern

**Priorität:** P3

**Nachweis:** beobachtet. Folge Risiko.

**Fundstelle / Aufgabe:** Schnellerfassung „Nur Stärke (Meldekopf-Schnellerfassung)"
in der manuellen Erfassung (Schritt 3).

**Beobachtung:** Nach der Bestätigung „Nur die Stärke melden? … startet mit 0 / 2
/ 7 / 9" stehen Führer 0, Unterführer 2, Mannschaft 7, Gesamt 9 in den
Zählfeldern, nicht als Platzhalter. Wer die Zahlen vom Zettel mit „+" aufbaut
(statt zu überschreiben), addiert zur Sollstärke (bei mir 0/4/14/18 statt
0/2/7/9; Lage Gesamt 60 statt 51). Die Karte trägt danach keinen Hinweis, dass es
Eingaben auf Sollbasis waren.

**Folge:** Gering bis mittel. Ein Zettel „0/2/6/8" wird bei Eile als Sollstärke
stehen gelassen, und die Lage zählt Personen, die nicht da sind.

**Empfehlung:** Zählfelder leer starten oder die Sollzahlen als Platzhalter
(grau) zeigen und „Gesamt" erst nach Eingabe füllen.

**Nachprüfung:** „Nur Stärke" wählen: die Felder sind leer, bis jemand etwas
eingibt.

### R6-A9 [P3] Stapelbericht: bei vollem Erfolg stehen fünf von elf Dateien als „ohne lesbaren QR-Code"

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** „Bögen einlesen…" mit den 11 Seitenbildern;
`src/app/stapel-quittung.tsx`.

**Beobachtung:**
- 11 Bilder, 6 Bögen aufgenommen. Der Bericht nennt zusätzlich „5 Bilder ohne
  lesbaren QR-Code (s1-01.png, s1-02.png, s1-04.png, s1-06.png, s1-08.png)" und
  setzt nach: „Bogen- und Übersichtsseiten tragen keinen — war eines davon eine
  Codeseite, ist das Foto zu unscharf …". Das sind genau die fünf Seiten
  ohne Code.
- Mit vier absichtlich verschlechterten Codeseiten (60 dpi, Unschärfe, 6°, JPEG
  35) und zwei guten: „2 Bögen aufgenommen. 4 Bilder ohne lesbaren QR-Code
  (foto-03.jpg …)". Dieselbe Formulierung, aber diesmal waren alle vier
  Codeseiten.
- Der Bericht kennt die erwartete Zahl der Einheiten nicht (Seite 1 der
  Sammel-PDF nennt sie).

**Folge:** Gering. Wer 6 von 6 hat, sieht fünf rote Dateien und zweifelt; wer 2
von 6 hat, liest dieselbe Zeile. Der Helfer muss selbst zählen.

**Empfehlung:** Zahl der Einheiten von der Übersichtsseite lesen, wenn sie mit
im Stapel ist, und „6 von 6 Einheiten laut Übersicht" bzw. „2 von 6, es fehlen …"
sagen. Sonst nur die Dateien nennen, bei denen die Seite einen Codebereich
erkennen lässt.

**Nachprüfung:** Sammel-PDF komplett einlesen: Bericht sagt „6 von 6". Zwei Codeseiten
weglassen: „4 von 6", ohne Warnung zu Seiten, die ohnehin keinen Code haben.

### Nur Verweise auf andere Runde-6-Berichte

- Der Abgleich-Text „… alle stehen als anwesend, ohne Zug, Auftrag und Nummer"
  bleibt nach einer Teilübernahme für die vier übrigen Einheiten stehen, obwohl
  Nr. und Zug eingetragen sind: `neuer-nutzer.md` (Arbeitsnotiz). Bei mir
  gleicher Befund.
- PDF-Erzeugung friert die Maske bis zu 10 s ein (gemessen: 6 Einheiten 11 s
  Dauer, größte Lücke 8,1 s; 30 Einheiten 21 s, 10,3 s; unter Last). Der Text
  „Einsatz wird erzeugt…" erscheint nach 0,6 s und wird gezeichnet:
  `offline-und-speicher.md` (T4).
- „Organisation / Einheit" im dunklen Kopf des Blanko ohne Schreibfläche
  (Zelle etwa 36 mm, ein Teil davon die Beschriftung): `neuer-nutzer.md`.
- Doppelter „Ansicht"-Schalter und „Bedarf:" mitten im Wort: `neuer-nutzer.md`.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, Summen, Prüfhinweise | Blanko aus App oder Datei, pixelgleich, offline, mit Meldekopf-Kasten, 29 Personalzeilen, Beiblatt-Hinweis (Personal fehlt, R6-A4) | „Einheit manuell erfassen…" mit „Nr. laut Zettel", „Zug / Verband", „Eingetroffen um" |
| Bogen übergeben | QR, Link, Datei, PDF mit Code | Einzel-PDF mit „von Hand geändert", Kopfzeile je Seite (R6-A2: Randabstand) | Code aus Seitenbild lesbar; Stapelbericht nennt alle Dateien (R6-A9) |
| Lage führen | Laufende Summen, Zwischensummen je Zug, Lageblatt nach Nr. | Lageblatt mit Nachtragszeilen und „übertragen", Bemerkung gekürzt mit „(Rest: Sammel-PDF)" | Neue Einheit vom Zettel mit Nr. und Zug; Vorbelegung druckt als gemeldet (R6-A3, R6-A8) |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern": Datei bringt alles zurück | Letzte Sammel-PDF (11 Seiten bei 6 Einheiten, 66 bei 30) mit Kopfzeile je Seite | Nur Papier: 6 von 6 Bögen, Abgleich mit Nr., Zug, Status; Zeit bleibt „nicht bestätigt", im Kasten ohne Marke (R6-A1) |

## Würde ich dafür das Papier weglegen?

Für den eigenen Bogen und den Meldekopf im Normalbetrieb ja, und für den
Wiederanlauf nach einem Ausfall jetzt auch, wenn ich Lageblatt und Übersichtsseite
der Sammel-PDF als Quelle benutze. Das Papier trägt Nr., Einheit und Blatt auf
jeder Seite, der Abgleich holt sie zurück, und eine nicht bestätigte Zeit bleibt
sichtbar. Nicht ganz: Der Kasten über dem Bogen verschweigt die Unsicherheit
(R6-A1), und die Kopfzeile müsste ich auf meinem Drucker einmal ausprobieren
(R6-A2). Bis dahin gilt: Den Probedruck machen, bevor das Blatt gebraucht wird.

## Bestätigtes

- **Blanko:** Aus der Startseite und `public/downloads/…` pixelgleich (80 dpi,
  beide Seiten). Meldekopf-Kasten mit Nr., eingegangen am/um, Zug / Verband,
  „[ ] ÜBUNG", „ins Gerät übertragen [ ] von (Kürzel) … um …", Beiblatt-Hinweis
  mit „Blatt ____ von ____", Seite 2 mit „Einheit: ____ · Nr. ____ · Blatt ____
  von ____", 4 Fahrzeugblöcke, 29 Personalzeilen, 6 Qualifikationszeilen,
  Sofortbedarf mit Luft, „Sonstiges" mit drei Zeilen. Schriften: Helvetica/WinAnsi.
- **Kopfzeile:** Einzel-PDF Seite 1 „Meldekopf: Nr. ____ · eingegangen ____ um
  ____ Uhr · übertragen [ ] von ____ um ____ Uhr"; Folgeseiten und alle Seiten der
  Sammel-PDF „Nr. · Einheit · Blatt x von y" (Sammel-PDF mit der Nr. des
  Meldekopfs, Seite 1 mit „übertragen"). Großbogen: 7 Seiten, „Blatt 2 … 7 von 7".
- **Fahrzeugblöcke:** Großbogen (10 Fz): Seite 1 endet mit einem ganzen Block, Seite
  2 beginnt mit einem ganzen Block. Kein Block über der Seitengrenze.
- **Lageblatt:** Sortierung nach Nr. (1–30 lückenlos bei 30 Einheiten, abgerückte im
  eigenen Block „Abgerückt (1)"), Bemerkung gekürzt als „… (Rest: Sammel-PDF)",
  Nachtragszeilen mit „übertragen [ ] ______" (6 Einheiten: 8 auf Seite 1, Rest auf
  Seite 2; 30 Einheiten: auf Seite 3 und 4), „Summe einschl. Nachträge", Bedarf
  gesamt und Zwischensummen. Nr. 7 mit Zug „1. TZ" und Eintreffzeit 10:30 vom
  Zettel.
- **Sammel-PDF:** Bei 30 Einheiten 66 Seiten, „Bedarf gesamt" auf Seite 1, keine
  Seite unter 19 Textzeilen.
- **Übung:** Kopfzeile rot, „ÜBUNG — Dieser Bogen beschreibt keinen echten
  Einsatz.", Wasserzeichen. In Ansicht „Nacht" bleibt das PDF hell.
- **WinAnsi:** Zeichenersatz in allen drei PDFs und im Titel (siehe R6-A5);
  kein Fremdzeichen im Text.
- **Rückweg vom Papier:** elf Seitenbilder (130 dpi), 6 von 6 Bögen. Der Abgleich
  fragt „Nr. laut Blatt", „Eingetroffen am (leer = Zeit des Einlesens, nicht
  bestätigt)", Status, „Zug", „Auftrag / Notiz", nimmt die Zeit nicht mehr vor
  und lässt die Marke „vom Papier, Zeiten prüfen" bei Einheiten ohne Zeit stehen.
  Nach der Übernahme: Hinweis „Eintreffzeit nicht bestätigt" mit Zahl der
  Einheiten, Lageblatt „Zeit nicht bestätigt (vom Papier)" je betroffener
  Einheit, abgerückte mit „ab 17.10.2026, 11:05".
- **Einsatz importieren:** Sammel-PDF (Nr. 7, Zug „1. TZ") auf leerem Gerät: 7
  Einheiten, Nr. und Zug erhalten.
- **Manuelle Erfassung:** „Nr. laut Zettel (leer = die App vergibt)", „Zug /
  Verband (laut Zettel)", „Eingetroffen um (vom Meldeblock)"; Nr. 7, Zug und
  Eintreffzeit 10:30 stehen danach in Lageblatt und Sammel-PDF; Rückfrage „Stärke
  nicht gezählt" mit „Stärke jetzt eintragen / Als Sollstärke ablegen"; Schritt 3
  „Vom Papier abtippen? … erst Schritt 4"; „Dies ist eine Übung" in Schritt 2.
- **Rückmeldung:** „Einsatz wird erzeugt…" 0,6 s nach dem Tipp gezeichnet, vor der
  Blockade; „Die PDFs sind für Papier gedacht — hell, auch in der Ansicht
  „Nacht"" in Einsatzansicht und Fußzeile.

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen: ja. Nachtrag vom Meldeblock mit Nr. und
  Zug: ja. Wiederanlauf nur vom Papier: ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Dass „nicht bestätigt" überall dort steht, wo die
  Einlesezeit gedruckt ist; im Kasten über dem Bogen fehlt es.
- **Größtes Einsatzrisiko:** Die Kopfzeile mit Nr. und „übertragen" liegt 2,1 mm
  vom Papierrand und kann beim Drucken fehlen (R6-A2, nicht am Drucker geprüft).
- **Top-Priorität für die nächste Iteration:** Kasten „Stand am Meldekopf" mit der
  Marke „nicht bestätigt" versehen (R6-A1), dann den Probedruck der Kopfzeile.

## Abgleich mit Runde 5

Grundlage: [../runde-5/analog-first.md](../runde-5/analog-first.md) samt „Stand der
Behebung" (Paket 2 vom 15.10. und Paket 4 vom 17.10.2026) und
[../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Tabelle | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-A1 Abgleich schreibt Einlesezeit fort, Marke fällt (P1) | behoben | **hält, mit Rest** | Feld nicht mehr vorbelegt, Marke und Lageblatt-Text bleiben bei Einheiten ohne Zeit, Hinweis mit Zahl. Rest: Kasten „Stand am Meldekopf" der Sammel-PDF kennzeichnet die Zeit nicht (R6-A1). |
| R5-A2 Kasten nur auf dem Blanko (P2) | behoben | **wirkt teilweise** | Kopfzeile je Bogenseite vorhanden, Einzel-PDF Seite 1 mit Nr./eingegangen/übertragen, Sammel-PDF mit „übertragen". Sie liegt aber 2,1 mm vom Rand (R6-A2) und das Einzel-PDF hat kein Feld für Zug/Übung. |
| R5-A3 Folgeseiten ohne Einheit, Fahrzeugblock reißt (P2) | behoben | **hält** | Nr., Einheit und „Blatt x von y" auf jeder Folgeseite, auch Blanko Seite 2; Großbogen ohne zerrissenen Block. |
| R5-A4 Manuelle Erfassung ohne Nr. und Zug (P2) | behoben | **hält** | „Nr. laut Zettel" und „Zug / Verband" vorhanden und wirksam bis ins Lageblatt. Nebenwirkung: Vorbelegung druckt als gemeldet (R6-A3), „Nur Stärke" mit Sollzahlen (R6-A8). |
| R5-A5 Stapelbericht „tragen keinen" (P3) | teilweise behoben | **wirkt teilweise, wie angegeben** | „ohne lesbaren QR-Code", Dateien vollständig. Bei vollem Erfolg stehen fünf legitime Dateien in der Warnzeile, bei Misserfolg dieselbe Zeile (R6-A9). |
| R5-A6 Beiblatt-Hinweis (P3) | behoben | **hält, Lücke** | Hinweis und „Blatt ___ von ___" da, 2 Seiten. Personal fehlt im Hinweis, Zeilen eng (R6-A4). |
| R5-A7 Sofortbedarf-Kasten (P3) | behoben | **hält** | Kästchen frei, „____ vegan" in der Zeile, „Sonstiges" mit drei Zeilen. |
| R5-A8 Restseiten Sammel-PDF (P3) | behoben | **hält** | 30 Einheiten: 66 Seiten, „Bedarf gesamt" auf Seite 1, keine Seite unter 19 Zeilen. |
| R5-A9 Lageblatt alphabetisch, Bemerkung abgeschnitten (P3) | behoben | **hält** | Nach Nr., „(Rest: Sammel-PDF)". Eine Umschaltung gibt es nicht (wie angegeben). |

Bilanz: Von neun Runde-5-Befunden halten sieben (A1 mit Rest), zwei wirken nur
teilweise (A2, A5 wie angegeben). Nichts hat sich ins Gegenteil verkehrt. Die
Behebung von R5-A1 hat die Lücke nur verschoben: Die Marke steht jetzt in
Karte, Lageblatt und Übersichtsseite, aber nicht im Kasten, den der Abgleich
selbst als Quelle nennt. Die Behebung von R5-A2 hat das Meldekopf-Feld auf jede
Seite gebracht und dafür den Platz im Rand gewählt, der am Drucker am ehesten
verloren geht.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 5 behoben, 4 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-A1 | behoben | Der Kasten „Stand am Meldekopf“ trägt „(nicht bestätigt, vom Papier)“ (Unit-Test). |
| R6-A2 | behoben | Die Kopfzeile liegt bei 16 pt (5,6 mm) statt 6 pt; die Seitenzahlen bleiben gleich, das Bild der Blanko-Seite geprüft. |
| R6-A3 | teilweise | Bei nur nach Stärke erfassten Einheiten entfallen „nach StAN: ja“ und der Funkrufname auf Papier und im Lageblatt. Die Fahrzeugsumme im Lageblatt zählt die vorbelegten Fahrzeuge weiter. |
| R6-A4 | behoben | Der Hinweis nennt „mehr als 29 Personen“, 7,5 pt mit Zeilenabstand 1,25. |
| R6-A5 | teilweise | Beim Erzeugen nennt die Quittung, wie viele Namen nicht darstellbare Zeichen enthalten. Eine Umschrift gibt es nicht. |
| R6-A6 | behoben | Eine fehlende Abrückzeit hält den Abgleich nicht mehr auf, sie bleibt „nicht bestätigt“. |
| R6-A7 | behoben | Der Satz steht am Knopf „PDF erzeugen“. |
| R6-A8 | teilweise | Ein Hinweis über den Zählfeldern sagt, dass die Zahlen die Sollstärke sind. Die Felder starten weiter damit. |
| R6-A9 | teilweise | Der Bericht nennt zuerst, was an Bildern ohne Code normal ist. Die Zählung „6 von 6 Einheiten“ fehlt. |
