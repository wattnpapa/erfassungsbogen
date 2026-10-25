# Audit „Mobile UI", Runde 6 (Darstellung und Bedienung auf dem Telefon)

Stand: 23.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `03a0011`.

Reiner Prüfbericht, keine Codeänderung. Der Server wurde während der Prüfung
neu gestartet (gleicher Build); die Befunde R6-M1 und R6-M2 habe ich nach dem
Neustart noch einmal gemessen. Auf `main` liegen inzwischen weitere Commits,
laut Auftrag nur am Lagemonitor; sie sind im geprüften Build nicht enthalten.
Der Bericht prüft die in Runde 5 umgebauten Stellen nach: Schriftstufe
`schrift-gross` ab 22 px Grundschrift, Fußleisten-Raster, Erfassungsleiste,
feste Warnleiste, feste Leiste „◐ Ansicht", Daumen-Quittung, QR-Vollbild bei
200 %, Startseite mit Primärknopf im ersten Bild, Kurz-Liste, Tabelle mit
Spalte „Zug", Fehlerseite und Zwei-Spalten-Ansicht am Tablet. Der Abgleich
bezieht sich auf [Runde 5](../runde-5/mobile-ui.md) samt „Stand der
Behebung".

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, Zeitzone Europe/Berlin,
`deviceScaleFactor` 1. Jeder Lauf hatte einen eigenen Browser-Kontext, weil
elf weitere Prüfer denselben Server nutzten. Viewports: 360 × 640,
320 × 568, 390 × 844, 640 × 360 (Telefon quer), Tablet 820 × 1180 und
1180 × 820, dazu eine Zoom-Nachbildung mit 180 × 320 Layout-Pixeln (rund
200 % Browser-Zoom auf 360 px). Jeweils mit normaler Schrift und mit 200 %
Schrift, nachgebildet als `html { font-size: 200% }`; bei 200 % trägt `<html>`
die Klasse `schrift-gross` (geprüft). Zusätzlich der Feld-Modus
(`eeb.anzeigemodus.v1` = `feld`).

Zustände kamen aus `localStorage`-Seeds aus `examples/thw/`, alle mit
`uebung: false` (die Seeds der Vorrunde habe ich übernommen und die Übungs-
Kennzeichen entfernt):
- `eeb.entwurf.v1`: THW Mühldorf Bergungsgruppe (9 Personen, 2 Fahrzeuge); für
  Kurz-Liste und mehrteilige QR-Codes der Großbogen „Verstärkter Bergungszug"
  (38 Personen, 7 Teile);
- `eeb.einsaetze.v1`: „Hochwasser Kocher" mit 14 Meldungen in drei Zügen, zwei
  abgerückt, dazu eine zweite Sammlung;
- `eeb.vorlagen.v1`: Vorlage „B Regen (Stamm)";
- für die Fehlerseite eine Sammlung, in der bei einer Meldung der Einheitstyp
  fehlt; für die Warnleiste ein zweites Fenster im selben Kontext, das den
  Entwurf ändert.

Durchlaufen habe ich: Startseite (mit Entwurf und leer), Assistent Schritt 1–6
mit Fußleiste, Kurz-Liste, Übergabe-Dialog und QR-Vollbild (einteilig und
7 Teile), Einsatzansicht als Karten und Tabelle, „Abrücken" mit
Daumen-Quittung, Meldekopf-Erfassung („Einheit manuell erfassen…", „Einheit
schnell erfassen"), feste Warnleiste der zwei Fenster, feste Leiste „◐ Ansicht"
in der Einsatzansicht, Fehlerseite, Tastatur-Nachstellung (Fenster auf 53 %
der Höhe, Fokus im Textfeld), Modalität des Übergabe-Dialogs (Hintergrund
rollt nicht, Esc schließt, Fokus kehrt zurück, Tab bleibt im Dialog).

Gemessen habe ich `scrollWidth` gegen `clientWidth` und das verbreiternde
Element, Lage und Höhe fester Leisten, die Ränder der Fußleisten-Knöpfe
(Überlappung), Unterkante von Primärknöpfen gegen die Fensterhöhe sowie Spalten-
und Zeilenmaße der Tabellen. Jede Aussage zu Lage und Größe habe ich am
Screenshot gegengeprüft.

Reihenfolge: Ich habe zuerst getestet. Beim Nachschlagen des Prüfaufbaus fiel
mein Blick allerdings schon vorab auf die Zusammenfassung „Stand der Behebung"
in `docs/audits/runde-5/README.md` (Befundkennungen und Restpunkte). Den Bericht
`runde-5/mobile-ui.md` habe ich erst nach den Messungen gelesen, die anderen
Runde-6-Berichte erst danach; Treffer dort nenne ich nur als Verweis. Skripte
und Screenshots liegen außerhalb des Repositorys im Scratchpad.

**Prioritäten:** Der Skill verwendet Critical / High / Medium / Low. Ich habe
das auf P0 / P1 / P2 / P3 abgebildet.

**Kennzeichnung der Nachweise:**
- *gemessen* heißt im Testbrowser mit Zahlen reproduziert;
- *beobachtet* heißt im Testbrowser gesehen, aber ohne eigene Messreihe;
- *Risiko* heißt aus Code oder CSS abgeleitet, im Testbrowser nicht
  nachgestellt.

**Nicht prüfbar:**
- echte Geräte mit Systemschrift unter Android und iOS. Die 200 % sind eine
  Nachbildung über die Wurzelschrift (Media-Queries in `rem` rechnen dabei mit
  16 px). Auch der Zoom (180 × 320) ist nur ein kleineres Fenster;
- die echte Bildschirmtastatur (nachgestellt durch ein kleineres Fenster),
  Browserleisten (`vh` gegen `dvh`);
- Safe-Area-Einsätze (Notch, Home-Indikator): `env()` ist im Testbrowser 0.
  Gelesen habe ich nur das CSS (`viewport-fit=cover`, rund 25 Stellen mit
  `env(safe-area-inset-*)`, darunter feste Fußleiste, Balken, Quittung, Warnleiste
  und QR-Vollbild);
- wie ein echter mobiler Browser die Seite bei Überbreite behandelt (R6-M3): Die
  Emulation weitet das Layout auf die Inhaltsbreite;
- die Rückfrage „Einheit schnell erfassen?" nach der Sammlungswahl: Sie schloss
  sich im Test nach 83 ms selbst (Protokoll per `MutationObserver`). Das deckt
  sich mit R6-N1 in [neuer-nutzer.md](neuer-nutzer.md); ob echte Finger es auslösen,
  kann ich mit der Emulation nicht trennen;
- Vorleseprogramme (TalkBack, VoiceOver), Kamera und Handscanner, echte
  Handschuhe und echtes Licht, WebKit/Safari und die nativen Builds.

## Urteil

Die Umbauten aus Runde 5 halten im Kern. Bei 100 % Schrift läuft auf allen
vier Telefon-Viewports keine Ansicht seitlich über, der Übergabe-Dialog
zeigt den QR-Knopf im ersten Bild (Unterkante 239–314 px), das QR-Vollbild
zeigt bei 200 % Code und Knöpfe ohne Rollen (einteilig und 7 Teile), die
Erfassung lässt bei 200 % das erste Feld über der Leiste, die Fehlerseite ist
klar und vollständig, der Tastatur-Wächter blendet die Fußleiste aus und das
Feld bleibt im Bild, der Übergabe-Dialog ist modal, und das Tablet zeigt
quer die zwei Spalten ohne Überlauf, auch bei 200 %.

Drei Dinge halten nicht. Erstens ist das Fußleisten-Raster nur auf dem Papier
ein festes Raster: Wo „Zur Übersicht →" breit wird (Schritt 5) oder die Schrift
wächst, schiebt sich der Primärknopf über „◐ Ansicht", schon bei 320 px und
100 %, im Feld-Modus schon bei 360 px (R6-M2). Zweitens verbreitert in der
Einsatzansicht ein Datumsfeld bei 200 % die ganze Seite auf 471 px, womit die
Zusage „kein seitlicher Überlauf" aus Runde 5 für diese Ansicht verfällt und
die Daumen-Quittung bei 320 px angeschnitten wird (R6-M3). Drittens ist die
feste Warnleiste der zwei Fenster bei 200 % höher als das Fenster; der Knopf
„Meine Fassung behalten" liegt bei 320 × 568 ganz unter dem Rand (R6-M1). Dazu
kommen fünf kleine Stellen vor allem bei 200 % Schrift und am schmalen Zoom.

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt bei normaler und
bei 200 % Schrift auf allen vier Telefon-Viewports. Die Befunde sind 0 × P0,
0 × P1, 3 × P2, 5 × P3.

## Befunde

### R6-M1 [P2] Feste Warnleiste der zwei Fenster ist bei 200 % Schrift höher als das Fenster; „Meine Fassung behalten" liegt unter dem Rand (Rest von R5-S4, neu)

**Priorität:** P2

**Nachweis:** gemessen und im Screenshot beobachtet.

**Fundstelle:** `src/app/feste-warnung.tsx` (`FesteWarnung`, Klassen
`fest-warnung fenster-konflikt`), CSS in `index.html` um Zeile 837: `position:
fixed`, `overflow: visible`, keine Höhenbegrenzung. Schrift und Knopfmaß sind
unter `schrift-gross` nicht gedeckelt. `#app` rückt um `--fest-warnung-hoehe`
nach unten.

**Beobachtung:** Ausgelöst mit einem zweiten Fenster im selben Kontext, das
den Entwurf ändert. Die Leiste beginnt ausgeklappt („Weniger" steht daneben).
Höhe der Leiste und Lage der beiden Entscheidungsknöpfe (Oberkante bis
Unterkante, Fensterhöhe in Klammern):

| Viewport | Leiste | „Stand aus dem anderen Fenster laden" | „Meine Fassung behalten" |
| --- | --- | --- | --- |
| 360 × 640, 100 % | 199 px (31 %) | 122–195 | 122–195 |
| 320 × 568, 100 % | 216 px (38 %) | nicht einzeln gemessen | nicht einzeln gemessen |
| 390 × 844, 200 % | 633 px (75 %) | 405–507 | 523–625 |
| 360 × 640, 200 % | **676 px (106 %)** | 405–549 | 565–**667** (640) |
| 320 × 568, 200 % | **741 px (130 %)** | 470–**614** (568) | **630–732** (568) |
| 640 × 360, 100 % | 53 px (knapp, eingeklappt) | hinter „Entscheiden" | hinter „Entscheiden" |

Bei 320 × 568 und 200 % füllt die Leiste das ganze Bild, der Satz „Dieser Bogen
wurde in einem anderen Fenster geändert …" beginnt über dem oberen Rand
(Screenshot `t23-b-f`), und „Meine Fassung behalten" ist gar nicht zu sehen. Die
Leiste ist fest und kann nicht gerollt werden; die Seite dahinter ist um
dieselbe Höhe nach unten geschoben. „Weniger" klappt zwar zu, der Knopf
„Entscheiden" klappt dieselbe Höhe wieder auf. Bei 100 % ist die Leiste in
Ordnung (122–195 px, Knöpfe nebeneinander, Screenshot `t23-a`).

**Folge:** Der Text sagt: „Eingaben hier werden erst wieder gespeichert, wenn du
entscheidest." Bei großer Schrift auf kleinem Telefon kommt man an eine der
zwei Entscheidungen nicht heran, solange das Fenster so klein bleibt; bis dahin
wird nichts gesichert. Das ist der seltene Fall (zwei Fenster, 200 %, 320 px),
aber genau der, in dem man die Leiste nicht wegtippen kann.

**Empfehlung:** Die Leiste bei großer Schrift deckeln wie die Quittung (Schrift
und Knopfmaß in px) und ihre Höhe auf rund 45 % des Fensters begrenzen,
darüber innen rollbar; Kurztext und die beiden Knöpfe zuerst, Einzelheiten
danach.

**Nachprüfung:** Zwei-Fenster-Konflikt, 360 × 640 und 320 × 568 bei 200 %:
`bottom` beider Knöpfe kleiner als `innerHeight`, Leistenhöhe höchstens 50 % der
Fensterhöhe.

Der Inhalt der Warnung (nur Stand des anderen Fensters, Laden ohne Rückfrage)
ist Gegenstand von R6-S1 und R6-S2 in
[stress-und-unterbrechung.md](stress-und-unterbrechung.md).

### R6-M2 [P2] Fußleisten-Raster: „Zur Übersicht →" und „Weiter →" schieben sich über „◐ Ansicht"; die Schrittleiste schneidet Schritt 6 ab (Rest von R5-G1)

**Priorität:** P2

**Nachweis:** gemessen und im Screenshot beobachtet (`f-combo.png`,
`t24-a-s5`, `t4-b-f-s1`).

**Fundstelle:** `footer.nav.assistent-nav` (`src/app/app.tsx`, CSS in
`index.html` um Zeile 1520–1690). Die Leiste ist ein Flex-Raster; der
Primärknopf läuft von rechts, „◐ Ansicht" hat eine feste Breite von 106–142 px.
Schrittleiste `.schritte button` in `index.html` ab Zeile 1743.

**Beobachtung:** Linker und rechter Rand der drei Knöpfe, gemessen am echten
DOM. Überlappung = Ende von „◐ Ansicht" minus Anfang des Primärknopfs.

| Lage | Schritt | „◐ Ansicht" | Primärknopf | Überlappung |
| --- | --- | --- | --- | --- |
| 320 × 568, 100 % | 1–4 | 79–185 | 203–304 | keine |
| 320 × 568, 100 % | 5 | 79–185 | 150–304 | **35 px** |
| 360 × 640, Feld-Modus | 5 | 88–208 | 168–342 | **40 px** |
| 320 × 568, Feld-Modus | 1–4 | 87–207 | 195–302 | **12 px** |
| 320 × 568, Feld-Modus | 5 | 87–207 | 142–302 | **65 px** |
| 320 × 568, 200 % | 1–4 | 85–225 | 196–302 | **29 px** |
| 320 × 568, 200 % | 5 | 85–225 | 144–302 | **81 px** |
| 360 × 640, 200 % | 5 | 87–227 | 169–342 | **58 px** |
| 390 × 844, 200 % | 5 | 88–228 | 188–372 | **40 px** |
| 360 × 640, Feld, 200 % | 5 | 89–231 | 167–342 | **64 px** |

Der Primärknopf liegt jeweils oben auf, „◐ Ansich" wird abgeschnitten
(Screenshot: „◐ Ansic" bzw. nur „◐ A"). Es bleibt also die Hälfte bis ein
Drittel der Fläche des Knopfs „Ansicht". Auch sonst bricht das Raster bei
320 px und 200 %: Die Schrittleiste zeigt „6. Übersicht" mit `right` 334 bei
320 px Breite, der Knopf ist rechts abgeschnitten; die Leiste rollt nicht
(Screenshot `t4-b-f-s1`).

Bei 100 %, 360 × 640 und 390 × 844 und in allen Schritten 1–4 bleibt das Raster
sauber (Leiste 70 px, 11 % der Höhe; Knöpfe 44–52 px hoch, Ränder 16–18 px).

**Folge:** Der Knopf „Ansicht" ist wichtig für den Wechsel auf Feld oder Nacht.
Der Tipp trifft in der Überlappung den Primärknopf „Zur Übersicht →", also
einen Schrittwechsel statt der Ansicht; das ist harmlos, aber es überrascht,
und der Feld-Modus, gedacht für grobe Bedienung, ist gerade am betroffenen Rand
(360 px, Schritt 5). Die Leiste war in Runde 5 als „festes Raster" bestätigt.

**Empfehlung:** Den Ansicht-Knopf auf das Zeichen „◐" mit Namen im Tooltip
kürzen, sobald zwei Knöpfe zusammen mehr als etwa 60 % der Breite brauchen,
oder den Primärknopf auf „Weiter →" gleich breit halten, wie in Schritt 1–4.
Die Schrittleiste so teilen, dass sechs Knöpfe in 320 px passen (nur Ziffern),
oder in ihrem Rahmen rollbar machen.

**Nachprüfung:** 320 × 568 und 360 × 640, 100 %, 200 % und Feld-Modus, Schritt
1–5: `right` von „◐ Ansicht" kleiner als `left` des Primärknopfs; „6. Übersicht"
mit `right` höchstens Fensterbreite.

### R6-M3 [P2] Einsatzansicht bei 200 % Schrift: Ein Datumsfeld verbreitert die ganze Seite auf 471 px; die Quittung wird angeschnitten (verkehrt „kein seitlicher Überlauf" aus Runde 5 ins Gegenteil)

**Priorität:** P2

**Nachweis:** gemessen in der Emulation; wie sich ein echtes Telefon bei
Überbreite verhält, ist **Risiko**.

**Fundstelle:** Block „Fernseher" / Lagemonitor in der Einsatzansicht,
`src/app/lagemonitor-ui.tsx` Zeile 235 (`<input type="datetime-local">`, Feld
„Einsatzbeginn"). Das Feld und sein Label folgen nicht der Deckel-Regel von
`schrift-gross` (index.html ab Zeile 1738, dort nur Assistent, Kopf und
Erfassung).

**Beobachtung:** Einsatzansicht „Hochwasser Kocher", 200 %: `scrollWidth` 471 bei
360, 390 und 320 px Fensterbreite. Verursacher ist das `input` (links 18,
rechts 471, Breite 453 px) mit Label „Einsatzbeginn" in 32 px Schrift;
auch Überschrift und Hinweis darüber stehen in 32 px. Die Seite ist
dort 16 224 px hoch (360 × 640). Der feste Balken „◐ Ansicht: Standard" liegt
dadurch bei `top` 781 (Fenster 640), und bei 320 × 568 ragt die
Daumen-Quittung nach „Abrücken" über den rechten Rand: „Rückgän" ist
abgeschnitten, „✕" nicht zu sehen (Screenshot `t20-b-f-b`). Bei 100 % sind
alle Ansichten gerätebreit. Die Seite, die in Runde 5 bei allen Größen als
gerätebreit bestätigt war, ist es bei 200 % nicht mehr (der Lagemonitor-Block
ist neu).

**Folge:** Wer mit großer Schrift arbeitet, bekommt die Einsatzansicht als
seitlich verschiebbare Seite; Quittung und feste Leisten stehen an Stellen,
die nicht zum sichtbaren Ausschnitt passen, und „Rückgängig" ist bei 320 px
nicht erreichbar. Bei echtem Gerät hängt es davon ab, ob der Browser die Seite
verkleinert zeigt oder seitlich rollen lässt.

**Empfehlung:** Datumsfeld und Label des Lagemonitor-Blocks unter
`schrift-gross` deckeln und das Feld auf `max-width: 100%` setzen; der Block
steht ohnehin am Seitenende (siehe R6-K5 in
[fuehrungssicht.md](fuehrungssicht.md)). Prüfen, ob die neueren Commits zum
Lagemonitor das Feld berühren: Sie sind nicht im geprüften Build.

**Nachprüfung:** Einsatzansicht, 200 %, 360, 320 und 390 px Breite:
`scrollWidth` gleich `clientWidth`, Quittung nach „Abrücken" mit beiden Knöpfen
im Bild.

### R6-M4 [P3] Tabellenansicht am Telefon: Die klebende Spalte nimmt 37 bis 53 % des Rollrahmens; bei 200 % steht in keiner Sicht eine Zahl, Namen brechen mitten im Wort (Rest von R5-M4)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle:** Einsatzansicht, Umschalter „Tabelle" (`.einheiten-tabelle`,
`.tabellen-scroll`, `index.html`; `einheiten-tabelle.ts`).

**Beobachtung:** Rollrahmen 326 px (360 px Fenster), Tabelle 1 828 px breit
(rund 20 Spalten, 14 Zeilen). Klebende Spalte „Einheit" 121 px (37 %), danach „Zug" mit
81 px (155–236 px), die Zahlen „F", „U", „M" beginnen bei 235 px; „Ges." liegt
außerhalb des ersten Bildes. Bei 320 px Fenster: 121 von 286 px (42 %). Bei 200 %
Schrift: klebende Spalte 174 von 326 px (53 %), „Zug" 160 px, „F" beginnt bei
370 px, also gar keine Zahl im ersten Bild; Tabelle 3 566 px breit. In der
klebenden Spalte brechen Namen mitten im Wort: „Materialwirtsch / aft",
„Wassergefahre / n" bei 100 %, „Hilpoltstei / n", „Notversor / gung" bei 200 %
(Screenshots `t9-a`, `t9-a-f`). Behoben gegenüber Runde 5: Der Text der Zelle
„Zug" beginnt mit Abstand rechts der klebenden Spalte, und „ABGERÜCKT" steht in
einer Zeile.

**Folge:** Die Zugzuordnung ist lesbar, aber die Tabelle zeigt im ersten Bild vor
allem Namen. Wer Zahlen vergleichen will, rollt erst nach rechts, und beim
Rollen wandert die Zahl ohne Kopf mit. Die Karten zeigen dieselben Zahlen im
ersten Bild.

**Empfehlung:** Die klebende Spalte am Telefon auf rund 30 % begrenzen und den
Namen dort abkürzen oder in zwei Zeilen setzen („Nr. 7 THW Albstadt" und der
Typ in der Zeile darunter, mit Auslassung); bei 200 % keine klebende Spalte oder
nur „Nr.".

**Nachprüfung:** 360 × 640, 100 % und 200 %: `right` der Spalte „F" kleiner als
Rollrahmenbreite; kein Wortbruch bei „ABGERÜCKT" und Namen (der Trennstrich
hängt in Chromium unter Linux an fehlendem Wörterbuch).

### R6-M5 [P3] Deckel-Regel bei 200 % nicht überall: Ansicht-Wahl, Einheitentyp-Feld und Kurz-Liste schneiden Text ab (Rest von R5-G6/G7)

**Priorität:** P3

**Nachweis:** beobachtet im Screenshot (`t5-a-f-ansicht`, `t16-a-f`,
`t19-a-f-tab`).

**Fundstelle:** Wahl „Standard / Feld / Dunkel / Nacht" (`.anzeige-leiste-wahl`,
`src/app/anzeige-schalter.tsx`), Feld „Einheitentyp" in Schritt 1
(`src/app/schritte/einheit.tsx`), Kurz-Liste `table.schnell-tabelle`
(`src/app/schritte/personal.tsx`).

**Beobachtung:** Bei 360 × 640 und 200 %:
- Die Wahl über der Fußleiste zeigt die Namen in gedeckelter Schrift, die
  Zusatzzeilen („normal", „große Tasten", „abends", „gedimmt") aber in 32 px; sie
  laufen über die Knopfränder und werden beschnitten („bendsc", „edimmt").
- Das Feld „Einheitentyp" zeigt seinen Platzhalter „z. B. Bergungsgruppe, FGr
  Wasser…" in großer Schrift, „Bergungs" ist abgeschnitten; das benachbarte Feld
  „Organisationsname" ist auf 20 px gedeckelt, die beiden sehen sich nicht
  ähnlich.
- In der Kurz-Liste zeigt das Auswahlfeld der Rolle nur „Führe"
  statt „Führer/in"; das Kürzel der Zeile bleibt ganz.

**Folge:** Die Rolle ist in der Kurz-Liste das Wichtigste neben dem Namen; bei
200 % muss man das Feld antippen, um zu sehen, was gewählt ist. Die Abweichungen
sind gering, zeigen aber, dass die Deckel-Regel stellenweise greift und
stellenweise nicht.

**Empfehlung:** Die Zusatzzeilen der Wahl und das Feld „Einheitentyp" unter
`schrift-gross` mitdeckeln; in der Kurz-Liste die Rolle bei großer Schrift auf
eine eigene Zeile über beide Felder oder verkürzte Werte („Führer", „UF", „M")
stellen.

**Nachprüfung:** 360 × 640 und 320 × 568, 200 %: kein abgeschnittener Text in
Wahl, Feld „Einheitentyp" und Rollenfeld der Kurz-Liste (`scrollWidth` des
Textes gleich `clientWidth`).

Die Zusatzzeilen der Wahl bei 100 % sind in R6-L5 in
[nacht-und-sicht.md](nacht-und-sicht.md) (Kontrast) beschrieben.

### R6-M6 [P3] Startseite mit Entwurf bei 200 % Schrift: „Fortsetzen" liegt auf dem zweiten bis sechsten Bildschirm, das Logo nimmt 130 px, „Bergungsgruppe" bricht im Wort (Rest von R5-M2)

**Priorität:** P3

**Nachweis:** gemessen und im Screenshot beobachtet (`t1-a-f`, `t1-c-f`).

**Fundstelle:** Startseite, Karte „Aktuellen Bogen fortsetzen" (`src/app/app.tsx`,
Klassen `entwurf-karte`, Logo `img.einheit-avatar`).

**Beobachtung:** Oberkante von „Fortsetzen" (Fensterhöhe in Klammern):

| Viewport | 100 % | 200 % |
| --- | --- | --- |
| 360 × 640 | 391 | **854** (640) |
| 320 × 568 | 382 | **1 016** (568) |
| 390 × 844 | 367 | **1 146** (844) |
| 640 × 360 | 263 | **2 125** (360) |

Ohne Entwurf liegt „Neuen Bogen erstellen" bei 100 % im ersten Bild (397 px bei
360 × 640, 411 bei 320 × 568, 442 bei 390 × 844), bei 200 % bei 629 bis 765 px
(360 × 640) und 673 bis 857 px (320 × 568), also unter oder an der Bildkante.
Bei 200 % steht das Logo (130 px) links neben dem Text und lässt 150 px für
„THW Mühldorf Bergungsgruppe"; das Wort bricht als „Bergungsg / ruppe". Die
Knöpfe „Fortsetzen" und „Verwerfen" sitzen gleich groß nebeneinander, der Text
reicht fast an den Rand der Knöpfe. Bei 100 % steht „Fortsetzen" im ersten Bild
und ist gut gelöst.

**Folge:** Das ist der Restpunkt, den die Behebung zu R5-M2 selbst benannte
(„bei 200 % weiter unter dem Bild"). Bei großer Schrift beginnt jeder Einsatz mit
Rollen, und die Verwerfen-Taste liegt neben Fortsetzen.

**Empfehlung:** Bei `schrift-gross` das Logo ausblenden oder über den Text
setzen, die Knöpfe untereinander, Kopf und Offline-Hinweis einzeilig; Ziel:
„Fortsetzen" liegt bei 360 × 640 im ersten Bild.

**Nachprüfung:** 360 × 640 und 320 × 568, 200 %, Seed mit Entwurf: Oberkante
von „Fortsetzen" kleiner als `innerHeight`, „Bergungsgruppe" nicht
getrennt.

### R6-M7 [P3] Zoom-Nachbildung 180 × 320: Kopf und zweizeilige Fußleiste lassen am Seitenanfang 16 px (Risiko)

**Priorität:** P3

**Nachweis:** gemessen in der Nachbildung (kleineres Fenster, kein echter Zoom);
echter Browser-Zoom ist **Risiko**.

**Fundstelle:** `header.seiten-kopf` und `footer.nav.assistent-nav`
(`index.html`).

**Beobachtung:** Bei 180 × 320 (rund 200 % Browser-Zoom auf einem 360-px-Telefon)
ist der Kopf des Assistenten 162 px hoch, die Fußleiste bricht auf zwei Zeilen
um und ist 142 px hoch („← Zurück" und „◐ Ansicht" in der ersten, „Weiter →" in
der zweiten Zeile, Screenshot `t22-z1-s3`). Am Seitenanfang bleiben 16 px für das
Formular; wenn der Kopf weggerollt ist, 178 px. Die Schrittleiste zeigt nur drei
Schritte und schneidet den vierten ab. Es gibt keinen seitlichen Überlauf der
Seite (die Schrittleiste rollt im Rahmen).

**Folge:** Wer mit starkem Zoom arbeitet, muss zuerst den Kopf wegrollen, um ein
Formularfeld zu sehen. Das betrifft wenige Nutzer; die Seite bleibt bedienbar.

**Empfehlung:** Unter etwa 240 px Breite Zurück und Ansicht auf Symbole
verkürzen, damit die Leiste einzeilig (70 px) bleibt, und den Kopf auf zwei Zeilen
begrenzen.

**Nachprüfung:** 180 × 320, Schritt 1–5: Fußleiste höchstens 25 % der Höhe, erstes
Feld nach Hochrollen im Bild.

### R6-M8 [P3] Einsatzansicht quer (640 × 360): Kopf und fester Balken „◐ Ansicht" nehmen 52 % der Höhe; dieselbe Wahl steht im Kopf und im Balken

**Priorität:** P3

**Nachweis:** gemessen (Kopf, Balken) und im Screenshot beobachtet (`t8-q`).

**Fundstelle:** `.anzeige-balken` (feste Leiste „◐ Ansicht: Standard",
`src/app/anzeige-schalter.tsx`, `AnzeigeLeiste`; CSS `index.html` um Zeile 1601),
Kopf der Einsatzansicht mit den vier Segmenten.

**Beobachtung:** Bei 640 × 360 ist der Kopf der Einsatzansicht 117 px hoch (rollt
mit), der feste Balken 57 px (16 %); im ersten Bild bleiben 186 von 360 px für
Inhalt: Kopfzahlen und der Anfang von „Bogen scannen…". Beim Rollen sind es 303
px. Auf dem Telefon hochkant (360 × 640) und am Tablet (820 × 1180, 1180 × 820)
steht der Balken ebenfalls unter denselben vier Segmenten im Kopf. Im
Querformat ist der Balken groß gegenüber dem Gewinn: Er bietet nur, was der Kopf
einen Rollweg weiter oben schon zeigt. Bei 360 × 640 und 320 × 568 passt es
(Balken 57 px, 9–10 %); die Seite hält unten den Platz frei, auch bei
aufgestellter Quittung stehen Quittung und Balken übereinander (506–571 und
583–640 px, kein Überdecken, Screenshot `t20-a-b`).

**Folge:** Quer ist die Einsatzansicht des Telefons ohnehin knapp; die Doppelung
kostet dort ein Sechstel der Höhe. Die Doppelung selbst ist unter R6-S5 in
[stress-und-unterbrechung.md](stress-und-unterbrechung.md) und R6-N5 in
[neuer-nutzer.md](neuer-nutzer.md) beschrieben.

**Empfehlung:** Im Querformat (Höhe unter 480 px) den Balken weglassen oder auf
das Zeichen „◐" in der Ecke verkleinern.

**Nachprüfung:** 640 × 360, Einsatzansicht: Der feste Balken ist höchstens 44 px
hoch oder nicht vorhanden; der Inhalt hat im ersten Bild mindestens 200 px.

### Verweise auf andere Runde-6-Berichte

- **„Bedarf:" bricht mitten im Wort („Bed / arf:") und klebt an „Verpflegung":**
  Ich habe es selbst gemessen: Die `summary` ist `display: flex`, das
  `<strong>` schrumpft auf 31 px und wird gebrochen (Screenshot `t30-a`). Es steht
  schon in [neuer-nutzer.md](neuer-nutzer.md), [nacht-und-sicht.md](nacht-und-sicht.md)
  und [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md); kein eigener
  Befund.
- **Rückfrage „Einheit schnell erfassen?" schließt sich nach rund 80 ms selbst,
  wenn sie auf die Sammlungswahl folgt:** R6-N1 in
  [neuer-nutzer.md](neuer-nutzer.md). Im Test lag das Zwischenergebnis genauso:
  Die Sammlungswahl schloss, die Rückfrage öffnete und schloss sich nach 83 ms,
  die Erfassung startete nicht.
- **Kurz-Liste 197 px je Zeile, 38 Personen 8 826 px; Karten 14 458 px bei
  12 Personen:** R6-H3 in [feldtauglichkeit.md](feldtauglichkeit.md). Ich habe
  8 826 px (360 × 640) und 18 038 px (200 %) gemessen.
- **Fehlerseite bei kaputter Sammlung:** „Neu laden" führt zum selben Absturz,
  der Einzelweg fehlt: R6-N4 in [neuer-nutzer.md](neuer-nutzer.md) und R6-E1 in
  [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md). Die Seite selbst ist
  gut gestaltet (siehe Bestätigtes).
- **Zwei „Ansicht"-Schalter im Assistenten (Kopf und Fußleiste):** R6-N5 in
  [neuer-nutzer.md](neuer-nutzer.md).
- **Einsatzbeginn nur unten in der Einsatzansicht, Lagemonitor-Block am
  Seitenende:** R6-K4 und R6-K5 in [fuehrungssicht.md](fuehrungssicht.md).
- **Erster Hauptknopf quer mit Vorlage knapp unter dem Bild:** R6-H6 in
  [feldtauglichkeit.md](feldtauglichkeit.md).

## Bestätigtes

- **Kein seitlicher Überlauf bei 100 %:** Startseite, Assistent 1–6, Erfassung,
  Einsatzansicht, Tabelle (im Rollrahmen), Dialoge und Vollbild bleiben auf 320,
  360, 390, 640 und am Tablet gerätebreit. Bei 200 % gilt das für alle Ansichten
  außer der Einsatzansicht (R6-M3).
- **Fußleiste in Schritt 1–4:** 360 × 640, 100 %: 70 px (11 %), 200 %: 78 px
  (12 %); 640 × 360: 56 bzw. 69 px (16–19 %). „←", „◐" und „Weiter →" liegen im
  Bild, Ränder 16–18 px, Knöpfe 44–55 px hoch. Tablet: 70 px.
- **Tastatur-Wächter:** Fokus in „Organisationsname", Fenster auf 53 % der Höhe
  (339 von 640): `<html>` trägt `tastatur-offen`, die Fußleiste ist
  ausgeblendet, das Feld liegt 72 px unter dem Rand (200 %: 144 px).
- **Erfassungsleiste und Erfassung bei 200 %:** Das erste Feld liegt über der
  Leiste (360 × 640: Feld 338–388, Leiste ab 504; 320 × 568: 362–412 gegen 432;
  390 × 844: 367–455 gegen 708; 640 × 360: 212–262 gegen 291). Der Kopf ist
  140–257 px hoch. Bei 100 % und 360 × 640: Feld 229–273, Leiste 128 px
  (20 %).
- **QR-Vollbild bei 200 %:** einteilig (360 × 640 Code 328 px, 640 × 360 296 px)
  und mit 7 Teilen (360 × 640 279 px, 320 × 568 207 px, 390 × 844 358 px,
  640 × 360 296 px): Code, „Teil 1 von 7", Navigation und „Schließen" im Bild; nur
  quer 36 px Rollweg, wie in Runde 5.
- **Übergabe-Dialog:** Unterkante des Knopfs „QR-Code im Vollbild zeigen" bei
  360 × 640: 314 px (100 %), 441 px (200 %); 320 × 568, 200 %: 468; 390 × 844,
  200 %: 417; 640 × 360: 239 und 327 px, alle im Bild. Modal: Der Hintergrund
  rollt nicht mit, Esc schließt, der Fokus geht zu „Bogen übergeben…" zurück,
  Tab bleibt im Dialog.
- **Daumen-Quittung:** 360 × 640, 100 %: 65 px, „Rückgängig" 123 × 44, „✕"
  44 × 44, steht über dem Balken (506–571 und 583–640 px, ohne Überdecken). Bei
  320 × 568 und 200 %: sieh R6-M3.
- **Fehlerseite:** „Hier ist etwas schiefgelaufen", „Deine Daten liegen weiter
  auf diesem Gerät", „Neu laden" als Primärknopf, „Zur Startseite", „Daten
  sichern", „Alle Daten löschen" abgesetzt; ohne Überlauf bei 360 × 640,
  320 × 568 mit 200 % (1 784 px) und 640 × 360 mit 200 %.
- **Zwei-Spalten-Ansicht am Tablet:** 1180 × 820, 100 %: links Kopfzahlen,
  Aufnahme, Bedarf, rechts die Liste. 200 %: Spalten 432 und 664 px,
  `scrollWidth` 1180. 820 × 1180: eine Spalte, Fußleiste des Assistenten an den
  Spaltenrändern (126–1054 px bei 1180).
- **Kurz-Liste:** ▲ ▼ ⇑ ✕ und die Felder sind bei 100 % 44 px hoch; neue
  Zeilen tragen die Platzhalter „Vorname" und „Nachname".
- **Startseite mit Entwurf bei 100 %:** „Fortsetzen" liegt im ersten Bild (263–391
  px je nach Viewport), die Schriftstufe schaltet bei 200 % die Klasse
  `schrift-gross` ein.
- **Safe-Area:** CSS liest die Insets an Fußleiste, Balken, Quittung,
  Warnleiste, Kopf und QR-Vollbild (nicht im Browser prüfbar).

## Abgleich mit Runde 5

Legende: **hält**, **teilweise**, **ins Gegenteil verkehrt**.

| Befund Runde 5 | Stand in Runde 6 | Nachweis |
| --- | --- | --- |
| R5-M1 Übergabe-Dialog bei 200 %: Weg zum QR-Code zwei Bildschirme tief | **hält** | Unterkante des QR-Knopfs 239–468 px in allen Lagen im Bild (vorher bis 1 212 px). |
| R5-M2 Startseite: kein Primärknopf im ersten Bild, bei 200 % auf dem dritten Bildschirm | **teilweise** | 100 %: Ohne Entwurf 397 / 411 / 442 px, mit Entwurf 263–391 px, im Bild. 200 %: „Neuen Bogen erstellen" 629–857 px, „Fortsetzen" 854–2 125 px, außerhalb. Rest wie in der Behebung benannt, siehe R6-M6. |
| R5-M3 Erfassung bei 200 % kleine Fenster: kaum Formular | **hält** | Feld über der Leiste in allen sechs Lagen (siehe Bestätigtes); quer 200 % Kopf 143 px statt 384. |
| R5-M4 Tabelle: Zug unter klebender Spalte, „ABGERÜCKT" bricht | **hält, mit Rest** | Zug mit Abstand rechts der Spalte, Marke einzeilig. Wortbruch in Namen bleibt (Chromium ohne Trennwörterbuch, in der Behebung benannt). Die klebende Spalte nimmt dennoch 37–53 %, R6-M4. |
| R5-M5 Kurz-Liste: Felder ohne Beschriftung | **hält** | Platzhalter „Vorname" / „Nachname" in neuer Zeile. |
| R5-M6 Tablet quer 200 %: Zwei-Spalten-Ansicht kippt | **hält** | Spalten 432 / 664 px, kein Überlauf. |
| R5-M7 Tablet quer: Leiste 110 px neben der Spalte | **hält** | „← Zurück" bei 126 px, „Weiter →" endet bei 1054 px. |

**Aussagen aus Runde 5, die nicht mehr tragen:**
- „Fußleiste: ‚←', ‚◐' und der Primärknopf stehen in allen Schritten bei 100 %
  und 200 % an derselben Stelle": Die Stelle ist dieselbe, aber die Knöpfe
  überlappen bei 320 px (Schritt 5, 35 px), im Feld-Modus bei 360 px (40 px) und
  bei 200 % in allen drei Breiten (29–81 px). **Teilweise**, R6-M2.
- „Kein seitlicher Überlauf, auch nicht bei 200 % Schrift": Für die
  Einsatzansicht **ins Gegenteil verkehrt**, wegen des Lagemonitor-Blocks, der
  nach dieser Prüfung dazukam, R6-M3. Auch die Daumen-Quittung ist bei 200 % und
  320 px dort nicht mehr vollständig im Bild.
- „Die feste Warnleiste" (R5-S4, in Runde 5 gekürzt auf rund die Hälfte): bei
  100 % gut (199 px), bei 200 % höher als das Fenster, R6-M1.
- „Schwebendes ◐ in der Einsatzansicht liegt über dem Inhalt" (Verweis auf
  R5-L1): Jetzt ein fester Balken, der unten Platz freihält und die Quittung
  über sich stehen lässt; **hält**. Nebenwirkung: R6-M8 (quer 16 % der Höhe).
- „Tastatur-Wächter", „QR-Vollbild", „Fehlerfänger" (R5-E1), „Erfassungsleiste":
  **halten**. Der Fehlerfänger zeigt die Fehlerseite wie vorgesehen; der Weg
  hinaus ist in R6-N4 beschrieben.

**Neue Reibung durch die Behebungen aus Runde 5:**
- **Deckel-Regel (`schrift-gross`):** Sie hält überall, wo sie angewendet wurde
  (Kopf, Assistent, Erfassung, Dialog, Quittung). Sie fehlt noch an Warnleiste
  (R6-M1), Einsatzansicht mit Lagemonitor-Block (R6-M3), Ansicht-Wahl und einigen
  Feldern (R6-M5) und an der Startseite (R6-M6).
- **Neue Funktion Lagemonitor:** bringt mit dem Datumsfeld den einzigen
  seitlichen Überlauf (R6-M3).
- **Keine Behebung aus Runde 5 hat sich vollständig ins Gegenteil verkehrt.** Nur
  die Aussage „kein seitlicher Überlauf" kippt in einer Ansicht und bei 200 %.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 5 behoben, 2 teilweise, 1 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-M1 | behoben | Die feste Warnleiste ist auf die Hälfte des Fensters gedeckelt und rollt in sich (Stilregel-Test). Nicht bei 200 % gemessen. |
| R6-M2 | behoben | Fußleiste siehe R6-G1; die Schrittleiste zeigt bei 200 % alle sechs Reiter (gemessen). |
| R6-M3 | behoben | Siehe R6-G3. |
| R6-M4 | offen | Die klebende Spalte der Tabellenansicht ist nicht geändert. |
| R6-M5 | teilweise | Deckel für Ansicht-Wahl, Felder und Kurz-Liste bei großer Schrift ergänzt; nicht nachgemessen. |
| R6-M6 | behoben | Kopfleiste, Entwurfskarte und Knöpfe sind bei großer Schrift gedeckelt; „Fortsetzen“ liegt bei 200 % auf 360 × 640 bei 542 px, auf 320 × 568 bei 516 px (vorher 806/944). |
| R6-M7 | teilweise | Die Leiste hat bei Browser-Zoom zwei Zeilen; ein einzeiliger Kopf und eine Leiste unter 25 % sind nicht erreicht. |
| R6-M8 | behoben | Quer wird der Balken zur Ecke (nur „◐“); Kopf und Wahl bleiben. |
