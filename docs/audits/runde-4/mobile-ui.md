# Audit „Mobile UI", Runde 4 (Darstellung und Bedienung auf dem Telefon)

Stand: 05.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3dd2ab5`.

Reiner Prüfbericht, keine Codeänderung. In Runde 3 lief diese Rolle nicht
mit. Der Abgleich bezieht sich deshalb auf
[Runde 2](../runde-2/mobile-ui.md) und auf die Änderungen aus Runde 3.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, Zeitzone Europe/Berlin,
`deviceScaleFactor` 1. Jeder Lauf hatte einen eigenen Browser-Kontext, weil
elf weitere Prüfer denselben Server nutzten. Geprüft habe ich die Viewports
360 × 640, 320 × 568, 390 × 844 und 640 × 360 (Telefon quer), jeweils mit
normaler Schrift und mit 200 % Schrift. Die 200 % habe ich wie in Runde 2
als `html { font-size: 200% !important }` eingespielt. Die App bemisst
Schrift und Ziele in `rem`, deshalb wirkt die Einstellung überall.

Zustände kamen aus `localStorage`-Seeds aus `examples/thw/`, alle mit
`uebung: false`:
- `eeb.entwurf.v1`: THW Mühldorf Bergungsgruppe (9 Personen, 2 Fahrzeuge),
  zuletzt in Schritt 6. Für mehrteilige QR-Codes stattdessen der Großbogen
  „Verstärkter Bergungszug" (7 Teile).
- `eeb.einsaetze.v1`: „Hochwasser Kocher" mit 14 Meldungen in drei Zügen,
  davon zwei abgerückt und eine Übung, dazu eine Übungssammlung.
- `eeb.vorlagen.v1`: Vorlage „B Regen (Stamm)".

Durchlaufen habe ich die Startseite, die Assistentenschritte 1 bis 6, den
Übergabe-Dialog, das QR-Vollbild (einteilig und in 7 Teilen) und die
Einsatz-Sammlung als Karten und als Tabelle. Dazu kamen „Abrücken" mit der
Daumen-Quittung, „Einheit manuell erfassen…" und „Einheit schnell erfassen"
mit der Leiste „In Einsatz übernehmen", die „◐"-Wahl in der Fußleiste, die
Rückfragen vor dem Ersetzen des Entwurfs sowie die Geräte-Zurück-Geste im
QR-Vollbild.

Gemessen habe ich:
- `innerWidth`/`scrollWidth` gegen den sichtbaren Ausschnitt, und welches
  Element die Seite verbreitert;
- Lage, Höhe und Flächenanteil fester Elemente wie Fußleiste, Quittung und
  Overlay-Knopfleisten;
- einen Tab-Durchlauf über 116 Fokusziele in Schritt 3 (bei 100 % und
  200 %): ob ein fokussiertes Element unter der Fußleiste liegt und ob ein
  Fokusrahmen da ist;
- bei offenem Dialog: Modalität, Tab-Folge, Escape und den Fokus danach,
  dazu ob die Seite beim Wischen (CDP-Touch) oder per Mausrad mitrollt.

Jede Aussage zu Lage und Größe habe ich am Screenshot gegengeprüft. Skripte
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
  Nachbildung über die Wurzelschrift;
- die Bildschirmtastatur, also ob sie Fußleiste oder Dialogknöpfe verdeckt;
- Safe-Area-Einsätze (Notch, Home-Indikator), weil `env()` im Testbrowser 0
  ist. Die Regeln habe ich nur im CSS gelesen;
- ein- und ausgeblendete Browserleiste (`vh` gegen `dvh`);
- Vorleseprogramme (TalkBack, VoiceOver), Kamera und Handscanner;
- echtes Wischen vom Bildschirmrand für die Zurück-Geste. Nachgestellt habe
  ich es mit `history.back()`.

Ich habe zuerst getestet, ohne frühere Berichte zu kennen. Danach habe ich
Runde 2 und die Runde-3-Übersicht gelesen und zuletzt die schon vorhandenen
Runde-4-Berichte. Befunde, die dort schon stehen, nenne ich nur als Verweis.

## Urteil

Bei normaler Schrift ist die App auf dem Telefon in gutem Zustand. Keine
Ansicht läuft auf 320, 360, 390 oder 640 px seitlich über, auch die
Einsatz-Tabelle nicht mehr, weil sie in ihrem Rollrahmen bleibt. Dialoge sind
modal, halten die Seite fest und geben den Fokus zurück. Das QR-Vollbild
passt auf allen vier Größen ganz ins Bild, auch quer und mit 7 Teilen. Kein
fokussiertes Feld verschwindet unter der festen Fußleiste. Die
Daumen-Quittung steht bei 100 % im Daumenbereich, und die Seite hält unten
Platz für sie frei.

Bei 200 % Schrift ist ein Teil dessen, was Runde 2 als behoben gemeldet hat,
wieder offen, und zwar durch Bausteine aus Runde 3:
- Der neue Knopf „◐" in der Fußleiste wächst mit der Schrift auf 88 px.
  „Weiter →" und „Zur Übersicht →" ragen dadurch 20 bis 80 px über den
  rechten Rand (R4-M2).
- Die Fußleiste der Meldekopf-Erfassung mit „In Einsatz übernehmen" belegt
  42 % der Höhe. Im ersten Bild steht dann kein Formularfeld (R4-M2).
- In der Einsatzansicht verbreitert die Überschrift „Zwischensummen nach
  Zug" die Seite auf 446 px. Daumen-Quittung und Rückfragen liegen dadurch
  halb außerhalb des Bilds, „Rückgängig" ist nicht zu sehen (R4-M1).
- Das QR-Vollbild zeigt im ersten Bild keinen Code (R4-M4).

Auch bei normaler Schrift springt die Erfassungsleiste in Schritt 5 auf drei
Zeilen um, und „◐" landet dort, wo vorher „Weiter →" stand (R4-M3).

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt bei normaler
Schrift auf allen vier Größen. Mit 200 % Schrift gelingt sie auf dem
Telefon, aber nur mit Mühe: Der Primärknopf ist angeschnitten, und der Code
muss erst ins Bild gerollt werden. Am Meldekopf ist „Abrücken → Rückgängig"
mit 200 % Schrift ohne Herauszoomen nicht möglich.

## Befunde

### R4-M1 [P1] 200 % Schrift: Einsatzansicht und 320-px-Seiten wieder breiter als das Gerät; Daumen-Quittung und Rückfragen rutschen aus dem Bild (Rest von R2-M1, neu durch die Zwischensummen)

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle:**
- Einsatzansicht, `<summary><h2>Zwischensummen nach Zug (n Züge)</h2>`
  (`src/app/einsaetze-ui.tsx`, um Zeile 1266);
- Fußzeile der Seite, Werkzeug-Link „nachrichtenvordruck.app"
  (`nav.fuss-werkzeuge`, `src/app/fusszeile.tsx`);
- Folgen an `.quittung-daumen` (`src/app/daumen-quittung.tsx`, CSS in
  `index.html` um Zeile 2123) und an den nativen Rückfragen
  (`dialog.abfrage`).

**Beobachtung:**

| Ansicht (200 %) | Layout-Fenster | Ursache |
| --- | --- | --- |
| Einsatzansicht, 360 × 640 | 446 × 792 | „Zwischensummen" bricht nicht um (`h2` reicht bis 445 px) |
| Einsatzansicht, 320 × 568 | 445 × 790 | dasselbe |
| jede Seite mit Fußzeile, 320 × 568 | 342 × 608 | Link „nachrichtenvordruck.app" bis 342 px |

Was daraus folgt:
- **Daumen-Quittung nach „Abrücken", 360 × 640:** Die Leiste steht bei
  `top` 643 px und reicht bis 768 px. Der sichtbare Ausschnitt endet bei
  640 px. Sie ist 398 px breit (24–422 px). Der Text hat 21 px Breite, weil
  „Rückgängig" (215 × 88) und „✕" (88 × 88) nicht schrumpfen. Im Screenshot
  ist von der Quittung nur ein Schattenstreifen am unteren Rand zu sehen.
- **Rückfrage „Einheit für den Einsatz erfassen?":** Der Dialog steht bei
  360 px Breite bei x 75–371 (320 px: x 95–351), also rechts angeschnitten.
  „Abbrechen" liegt bei y 636–724, unter dem Bildrand. Bei 320 px kam
  Playwright nicht an „Einheit erfassen" heran, weil der Dialogtext den
  Klick abfing.
- **320 × 568, Assistent:** Die feste Fußleiste reicht bis 342 px.
  „Zur Übersicht →" ist rechts um 19 px angeschnitten, und die Überschrift
  „5. Sofortbedarf & Sonstiges" bricht als „Sofortbedar / f &".
- Bei 100 % Schrift bleibt jede dieser Ansichten gerätebreit.

**Folge:** Wer mit großer Systemschrift am Meldekopf eine Einheit abrückt,
sieht keine Quittung und kein „Rückgängig". Der Rückweg, für den die Leiste
in Runde 2 und 3 gebaut wurde, fehlt genau bei diesen Nutzern. Ein
Fehlgriff lässt sich dann nur über „Mehr…" oder die Historie korrigieren.
Bei den Rückfragen ist der Abbruch nur durch Rollen im Dialog zu
erreichen. Auslöser ist ein einzelnes langes Wort. Die Behebung von R2-M1
hat sich auf feste Stellen gestützt, und jede neue Überschrift kann sie
wieder aushebeln.

**Empfehlung:**
- Überschriften und Fußzeilen-Links bei Bedarf im Wort umbrechen lassen
  (`overflow-wrap: anywhere` oder `hyphens: auto` mit `lang="de"`), am
  besten als allgemeine Regel für `h1`–`h3`, `summary` und `a` statt Stelle
  für Stelle.
- Feste Leisten an der sichtbaren Breite ausrichten, nicht am
  Layout-Fenster: `max-width: 100vw` wie beim QR-Vollbild.
- Den Text der Quittung nicht unter eine Mindestbreite drücken lassen. Bei
  großer Schrift „Rückgängig" und „✕" unter den Text stellen.

**Nachprüfung:** 360 × 640 und 320 × 568 bei 200 %: Einsatzansicht mit
mindestens einem Zug, Startseite, Assistent. Erwartet wird
`document.documentElement.scrollWidth` gleich der Gerätebreite. Nach
„Abrücken" müssen Quittung, „Rückgängig" und „✕" vollständig im Bild
stehen. Die Rückfrage „Einheit für den Einsatz erfassen?" muss beide Knöpfe
ohne Rollen zeigen oder mit klebenden Knöpfen rollen. Den Kontrolltest in
`src/test/grosse-schrift.test.ts` um die Zwischensummen und die Fußzeile
erweitern.

### R4-M2 [P1] 200 % Schrift: Fußleiste des Assistenten läuft wieder über den Rand, die Erfassungsleiste belegt 42 % der Höhe (neu durch „◐" und „In Einsatz übernehmen", Rückfall von R2-M1)

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle:** `footer.nav` in `src/app/app.tsx` (um Zeile 3496).
Knopf „◐" aus `AnzeigeLeistenKnopf` (`src/app/anzeige-schalter.tsx`). CSS in
`index.html`: `footer.nav .anzeige-leiste-knopf` mit
`min-width: calc(var(--ziel-basis) + var(--ziel)); font-size: var(--t-l)`
(um Zeile 1384) und `footer.nav.mit-uebernehmen` (um Zeile 1500).

**Beobachtung:**

| Lage (200 %) | Fußleiste | rechter Rand des Primärknopfs |
| --- | --- | --- |
| Assistent 360 × 640, Schritt 1–4 | 102 px (16 %) | „Weiter →" bis 380 px |
| Assistent 360 × 640, Schritt 5 | 102 px | „Zur Übersicht →" bis 440 px, im Bild „Zur Über…" |
| Assistent 390 × 844, Schritt 5 | 102 px | „Zur Übersicht →" bis 459 px |
| Erfassung (Meldekopf) 360 × 640 | 267 px (42 %) | „Weiter →" klein in Zeile 3 links (18–132 px) |

Was die Leiste sprengt, ist der neue Knopf „◐". Seine Schrift (`--t-l`)
und sein Mindestmaß wachsen mit, statt wie „Weiter" gedeckelt zu sein. Bei
200 % ist er 88 × 76 px groß, bei normaler Schrift 44 × 47 px. Daneben
bleibt für „← Zurück" und „Weiter →" kein Platz mehr.
`.platzhalter` schrumpft auf 0. Bei 320 px passt die Zeile nur, weil dort das
Wort „Zurück" entfällt.

In der Meldekopf-Erfassung (Hochformat) kommt die Zeile „In Einsatz
übernehmen" hinzu (88 px hoch). Die Leiste bricht dreizeilig um:
1. Zeile: „In Einsatz übernehmen";
2. Zeile: „← Zurück" links, „◐" rechts;
3. Zeile: „Weiter →" links, 49 px hoch.

Mit dem Assistenten-Kopf bis 372 px zeigt das erste Bild bei 360 × 640 nur
Kopf und Fußleiste, kein einziges Feld (Screenshot `10-manuell-a-f`).
Beim Rollen bleiben über der Leiste 373 px Formular. Am Seitenende liegt
der letzte Fußzeilen-Link unter der Leiste, weil `main` nur 10rem
freihält.

**Folge:** R2-M1 hatte genau diesen Zustand: „Weiter →" über den Rand, die
Fußleiste ein Viertel des Bilds. Er ist zurück, diesmal durch einen
Bedienknopf, der selten gebraucht wird. In der Erfassung steht der
häufigste Knopf „Weiter →" in der dritten Zeile links, wo ihn niemand
erwartet. Rechts unten, wo er bei normaler Schrift steht, ist dann leer.
Am Meldekopf mit großer Schrift ist das Formular nur noch durch einen
Spalt von gut einem Drittel der Höhe zu sehen.

**Empfehlung:**
- „◐" wie die anderen Leistenknöpfe deckeln (`min()` mit Pixelgrenze für
  Schrift und Mindestbreite) oder bei großer Schrift aus der Leiste nehmen.
  Der Moduswechsel ist auch im Kopf erreichbar.
- Für die Erfassungsleiste eine feste Ordnung festlegen, die bei jeder
  Schriftgröße hält: „In Einsatz übernehmen" eine Zeile, darunter
  „← Zurück" links und „Weiter →" rechts. „◐" höchstens als kleiner Knopf
  in die Mitte oder ganz heraus.
- Die Leistenhöhe bei 200 % auf höchstens etwa 25 % begrenzen.

**Nachprüfung:** 320, 360 und 390 px bei 200 %, Assistent Schritt 1 und 5
sowie Erfassung Schritt 1 und 5. Jeder Knopf der Fußleiste muss vollständig
im Bild stehen, „Weiter →" bzw. „Zur Übersicht →" rechts unten. Die
Fußleiste darf höchstens 25 % der Höhe belegen, und über ihr muss im
ersten Bild mindestens ein Eingabefeld sichtbar sein.

### R4-M3 [P2] Erfassungsleiste springt in Schritt 5 auf drei Zeilen, „◐" steht dann am Platz von „Weiter →" (neu durch R3-G3/R3-L6)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle:** Meldekopf-Erfassung („Einheit manuell erfassen…",
„Einheit schnell erfassen"), Schritt 5, Hochformat 360 × 640.
`footer.nav.mit-uebernehmen` mit `flex-wrap: wrap` (`index.html`, um Zeile
1500).

**Beobachtung:** In den Schritten 1 bis 4 ist die Leiste 128 px hoch und
zweizeilig. Oben steht „In Einsatz übernehmen", darunter „← Zurück"
(16–125 px), „◐" (158–211 px) und „Weiter →" (243–344 px). In Schritt 5
heißt der Primärknopf „Zur Übersicht →" und ist breiter. Die Leiste bricht
dann dreizeilig um und wird 186 px hoch (29 % der Höhe):
- „◐" steht bei 291–344 px, y 525, also dort, wo bisher „Weiter →" stand;
- „Zur Übersicht →" rutscht in eine dritte Zeile nach links (16–170 px,
  y 585).

Bei 320 und 390 px und quer bleibt die Leiste zweizeilig bzw. einzeilig.
Der Sprung tritt nur bei 360 px auf, der häufigsten Android-Breite.
(Screenshots `10-manuell-a`, `10-manuell-s5-a`.)

**Folge:** Wer viermal rechts unten auf „Weiter →" getippt hat, trifft beim
fünften Mal „◐" und öffnet die Moduswahl. Sie klappt über der Leiste auf und deckt den
unteren Rand des Formulars ab. Die Daten bleiben unberührt, aber der Tipp
geht ins Leere, und der Helfer muss erst die Wahl schließen und dann
„Zur Übersicht →" links unten suchen. Dazu verliert er 58 px
Formularfläche.

**Empfehlung:** Die Primärposition rechts unten in allen Schritten
festhalten. Im Hochformat „Weiter →" und „Zur Übersicht →" gleich breit
anlegen oder den Text kürzen („Übersicht →"), damit die Zeile nicht
umbricht. „◐" nicht rechts außen anordnen.

**Nachprüfung:** 360 × 640, Erfassung, Schritt 1 bis 5: Der Primärknopf
liegt in jedem Schritt an derselben Stelle (rechter Rand gleich, `top`
gleich), und die Leiste bleibt bei 128 px.

### R4-M4 [P2] QR-Vollbild bei 200 % Schrift: Im ersten Bild ist kein Code zu sehen (Rest von R2-M2)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle:** `QrVollbild` in `src/app/schritte/uebersicht.tsx` (um Zeile
1085). CSS `dialog.qr-vollbild` in `index.html` (um Zeile 3817 und 3876):
`.qr-vollbild-code` mit `min-height: 12rem`, klebende `.qr-vollbild-nav`.

**Beobachtung:** Großbogen, 7 Teile, 200 % Schrift:
- **360 × 640:** Der Kopf (Einheit, Stärke, Stand) ist 328 px hoch. Die
  klebende Knopfleiste reicht von 370 bis 640 px (270 px). Der Code beginnt
  bei 509 px und liegt damit hinter der Leiste. Im ersten Bild sieht man
  Kopf und Knöpfe, aber weder „Teil 1 von 7" noch den Code. Erst nach
  Rollen um 504 px steht der Code frei (5–301 px). Dann ist „Teil x von n"
  oben herausgerollt.
- **Ab Teil 2, 360 × 640:** „← Teil 1" und „Weiter zu Teil 3 →" sind 202 px
  hoch. Der rechte Knopf bricht als „Weite / r zu / Teil 3 / →".
- **640 × 360 quer:** Das Overlay öffnet mit `scrollTop` 467. Die linke
  Spalte ist leer, weil der Code (−435 px) oben herausgerollt ist. Rechts
  stehen „Teil 1 von 7" und die Knöpfe.

Bei 100 % Schrift passt alles auf allen vier Größen ins Bild: Code 328 px
(360 × 640), 273 px (320 × 568) und 328 px (quer).

**Folge:** Die Übergabe per Code ist der Kernweg der App. Wer mit großer
Schrift arbeitet, öffnet das Vollbild und sieht keinen Code. Ein Hinweis,
dass gerollt werden muss, fehlt. Die Gegenstelle wartet, und der Helfer
tippt „Weiter zu Teil 2 →", ohne dass Teil 1 je zu sehen war.

**Empfehlung:** Im Vollbild hat der Code Vorrang vor der Schrift. Kopf und
Knopfbeschriftungen sollten dort nicht mit der Systemschrift wachsen, also
mit Pixelgrenzen gedeckelt werden, wie es die Fußleiste für „Weiter"
schon tut. Alternativ öffnet das Overlay so gerollt, dass Code und
„Teil x von n" zusammen im Bild stehen. Quer nicht zur Knopfleiste rollen.

**Nachprüfung:** Großbogen bei 200 %, 360 × 640, 320 × 568 und 640 × 360:
Beim Öffnen und nach jedem Blättern stehen der Code ganz und „Teil x von 7"
im Bild, ohne zu rollen.

### R4-M5 [P2] Geräte-Zurück im mehrteiligen QR-Vollbild schließt ohne Hinweis auf fehlende Teile, beim Wiederöffnen beginnt es bei Teil 1 (neu)

**Priorität:** P2

**Nachweis:** gemessen (`history.back()` als Ersatz für die Zurück-Geste).

**Fundstelle:** `QrVollbild` in `src/app/schritte/uebersicht.tsx`:
`useEbeneZurueck(VOLLBILD_EBENE, () => props.onZurueck(ohneFrage()))` und
ebenso `useModalesOverlay(…, { onSchliessen: () => props.onSchliessen(ohneFrage()) })`
für Escape.

**Beobachtung:** Großbogen, 7 Teile, 360 × 640: Vollbild öffnen, auf Teil 2
blättern, Zurück. Das Vollbild und der Übergabe-Dialog sind zu, und man
steht auf der Gesamtübersicht. Ein Hinweis kommt nicht. Der Knopf
„Schließen" fragt im selben Zustand nach: „Teil 3 von 7 wurde noch nicht
gezeigt … Teil 3 von 7 zeigen / Trotzdem schließen" (R3-H3). Escape
schließt ebenso ohne Frage. Erneutes Öffnen beginnt bei „Teil 1 von 7".

**Folge:** Auf dem Telefon ist die Zurück-Geste der häufigste Weg, ein
Vollbild zu verlassen. Unter Android löst sie schon ein Wischen vom Rand
aus, und das passiert leicht, wenn man das Gerät einem Scanner
entgegenhält. Mitten in einer Übergabe von 7 Teilen bricht die Anzeige
ohne Warnung ab. Der Helfer muss von vorn blättern. Die Gegenstelle
quittiert die doppelten Teile zwar („war schon dabei"), aber der Vorgang
dauert länger, und der Helfer weiß nicht, bis zu welchem Teil er gekommen
war.

**Empfehlung:** Zurück und Escape wie „Schließen" behandeln. Fehlen
Teile, die Zurück-Geste einmal abfangen und die Frage „Teil n fehlt noch"
zeigen. Beim Wiederöffnen mit dem ersten nicht gezeigten Teil beginnen.

**Nachprüfung:** 7 Teile, auf Teil 3 blättern, Zurück-Geste: Die Rückfrage
erscheint, das Vollbild bleibt offen. „Trotzdem schließen", wieder öffnen:
Es startet bei Teil 4.

### R4-M6 [P3] Startseite bei 200 % Schrift: „Standard ▾" liegt über dem Titel (Rest von R3-H5)

**Priorität:** P3

**Nachweis:** gemessen und im Screenshot beobachtet.

**Fundstelle:** `.seiten-kopf.start-kopf`, Container-Abfrage
`@container startkopf (max-width: 22rem)` in `index.html` (um Zeile 966):
`.titelzeile { flex-wrap: nowrap }`, `h1 { overflow-wrap: normal }`.

**Beobachtung:** Bei 360 × 640 und 320 × 568 mit 200 % steht der
Klappknopf „Standard ▾" mitten auf „Digitaler Einheiten-" (Screenshots
`20-start-a-f`, `20-start-b-f`). Bei 320 px ist „Erfassungsbogen" rechts
abgeschnitten. Die Zeile darf nicht umbrechen, das Wort „Erfassungsbogen"
ist breiter als der Platz neben dem Knopf, und der Titel läuft unter den
Knopf. Bei 100 % Schrift steht beides sauber nebeneinander.

**Folge:** Der Titel der App ist auf dem Startbild nicht lesbar. Bedienung
ist nicht betroffen, der Knopf bleibt tippbar. Der erste Eindruck bei
großer Schrift ist aber „kaputt".

**Empfehlung:** Bei großer Schrift den Umbruch der Titelzeile erlauben
(Knopf unter den Titel) oder dem Titel `overflow-wrap: anywhere` geben.

**Nachprüfung:** 320 und 360 px bei 200 %: Titel und Knopf überlappen
nicht (Rechtecke schneiden sich nicht), und der Titel ist vollständig
sichtbar.

### R4-M7 [P3] Kleinere Stellen (neu)

**Priorität:** P3

**Nachweis:** gemessen bzw. beobachtet, je Punkt.

**Beobachtung:**
- **„◐"-Wahl (gemessen):** Die vier Knöpfe Standard, Dunkel, Feld und
  Nacht sind 42 px hoch, also unter dem Grundmaß der übrigen Leiste (44 bis
  47 px). Sie stoßen ohne Abstand aneinander (83–84 px breit). Im
  Screenshot setzt sich die Wahl kaum von der Seite ab, und die Beschriftung
  des Felds darunter scheint durch.
- **Erfassungskopf (beobachtet):** Die Marken „Schnellerfa…" und
  „Aufnahme für: Hochwas…" sind bei 360 px gekürzt, bei 320 px
  „Schnelle…" und „Aufnahme für: Hoch…". Gerade die Angabe, *für welche
  Sammlung* erfasst wird, ist damit nicht lesbar. Bei 200 % steht nur
  „Aufnahme fü…".
- **Speicherzeile im Assistenten-Kopf (beobachtet):** „✓ automatisch
  gespeichert · 22:24 Uhr — bleibt auf die…". Der Teil, um den es geht
  („bleibt auf diesem Gerät"), fehlt auf allen drei Hochformat-Breiten.
- **Erfassung quer, 640 × 360 (gemessen):** Der Kopf endet bei 128 px statt
  bei 97 px wie im eigenen Assistenten, weil die Marke „Aufnahme für: …" eine
  dritte Zeile erzwingt. Zwischen Kopf und Fußleiste (ab 304 px) bleiben
  176 px.
- **Einsatz-Tabelle bei 200 % (gemessen):** Die klebende Spalte „Einheit"
  ist 256 von 322 px breit. Für die Zahlen bleiben 66 px, also eine
  Spalte. Bei 100 % sind es 128 px, das ist in Ordnung.

**Folge:** Jeweils kleine Reibung: Fehlgriffe in der Moduswahl,
unklarer Kontext in der Erfassung, weniger Formular im Querformat.

**Empfehlung:** Moduswahl auf das Grundmaß bringen und mit Schatten
absetzen, wie es die CSS-Regel schon vorsieht. Die Sammlungsmarke vor der
Erfassungsmarke vollständig zeigen, notfalls zweizeilig. Die Speicherzeile
kürzen („✓ gespeichert 22:24 · nur auf diesem Gerät"). Quer die
Sammlungsmarke in die Titelzeile ziehen. Die klebende Spalte bei großer
Schrift auf etwa 40 % der Rahmenbreite begrenzen.

**Nachprüfung:** je Punkt wie beschrieben nachmessen.

### Verweise auf andere Runde-4-Berichte

- **R4-K5** ([fuehrungssicht.md](fuehrungssicht.md)): Die Einheitenliste
  der Einsatzansicht liegt weit unten. Ich habe unabhängig gemessen, wo die
  erste Karte beginnt: 2 234 px bei 360 × 640 (3,5 Bildhöhen), 2 368 px bei
  320 × 568 (4,2), 2 085 px bei 390 × 844 und 1 461 px quer (4 Bildhöhen).
  Darüber liegen Kopfzahlen, Aufnahmeknöpfe, Bedarf, Zwischensummen,
  Weitergabe und Exporte. Kein eigener Befund.

## Bestätigtes

- **Kein seitlicher Überlauf bei 100 %:** Startseite, Assistent 1–6,
  Einsatzansicht, Tabelle und alle geöffneten Dialoge bleiben auf 320, 360,
  390 und 640 px gerätebreit. Die Einsatz-Tabelle (1 830 px Inhalt) rollt
  nur in ihrem Rahmen, und die Spalte „Einheit" klebt links.
- **Fokus und Fußleiste:** Beim Tab-Durchlauf über 116 Ziele in Schritt 3
  lag kein fokussiertes Element unter der Fußleiste oder außerhalb des
  Bilds, auch bei 200 % nicht, und jedes hatte einen sichtbaren
  Fokusrahmen.
- **Dialoge:** Der Übergabe-Dialog und das QR-Vollbild sind `:modal`. Der
  Fokus steht nach dem Öffnen im Dialog und bleibt dort, Escape schließt,
  danach steht der Fokus wieder auf „Bogen übergeben…". `html` ist
  `overflow: hidden`. Die Seite blieb bei 900 px stehen, nach zwei
  Wischgesten und einem Mausrad-Schritt auf der Abdeckung.
- **QR-Vollbild bei 100 %:** Code, „Teil 1 von 7", Blättern und
  „Schließen" stehen vollständig im Bild, bei 320 × 568 mit 273 px Code und
  quer zweispaltig mit 328 px Code. „Schließen" fragt nach, wenn Teile
  fehlen (R3-H3).
- **Daumen-Quittung bei 100 %:** 65 px hoch, „Rückgängig" und „✕" mit 44 px
  Zielmaß. Der Name wird nach zwei Zeilen gekürzt. Am Seitenende hält
  `main` Platz frei, sodass der letzte Inhalt über der Leiste steht
  (360 und 320 px).
- **Fußleiste bei 100 %:** einzeilig mit 70 px (11 %) im Hochformat und
  56 px quer. Das `padding-bottom` beträgt quer 4 px (R2-M7). Unter 360 px
  entfällt das Wort „Zurück", der Name bleibt „← Zurück". Die
  Erfassungsleiste ist quer einzeilig (56 px), die Abstände zwischen den
  Knöpfen liegen dort über 50 px.
- **Formulare:** Eingabefelder haben durchgehend 16 px Schrift.
  Kontrollkästchen und Optionsfelder sind über ihre ganze Beschriftung
  tippbar. Die Schrittleiste hat mindestens 44 × 44 px.
- **Safe-Area (nur CSS gelesen):** `viewport-fit=cover`. Fußleiste,
  Quittung, QR-Knopfleiste und Kopf verwenden `env(safe-area-inset-*)`
  mit `max()`.

## Abgleich mit Runde 2

| R2-Befund | Stand in Runde 4 | Nachweis |
| --- | --- | --- |
| R2-M1 200 % Schrift, Seite breiter als Gerät | **teilweise zurück** | Die in Runde 2 genannten Ursachen (Stärke, Marken, Summenleiste, Vorschlagsfeld) halten: Übersicht und Assistent bei 360/390 gerätebreit. Neu sprengen „Zwischensummen nach Zug" (Einsatz 446 px) und ein Fußzeilen-Link (320 px → 342 px), siehe R4-M1. Die Fußleiste ist 102 px statt 75 px hoch, und „Weiter →" ragt wieder hinaus, diesmal durch „◐", siehe R4-M2. |
| R2-M2 QR-Vollbild rollt nicht | **hält bei 100 %, Rest bei 200 %** | Rollt, `dvh`, klebende Leiste, quer zweispaltig, Escape schließt. Bei 200 % im ersten Bild kein Code, siehe R4-M4. |
| R2-M3 Overlays nicht modal | **hält** | `:modal`, Fokus im Overlay, Escape, Fokus zurück auf den Auslöser, Seite rollt nicht. |
| R2-M4 Karten ohne Struktur | **hält** | 14 `li.einheit-zeile` mit 14 Überschriften, Knöpfe mit `aria-describedby` auf den Einheitsnamen. |
| R2-M5 Namensfelder ohne Namen | **hält** | Kurz-Liste: „Person 1: Vorname", „Person 1: Nachname". |
| R2-M6 autocomplete | **hält** (Attribute) | Dienststellen-Telefon und -E-Mail sowie Personennamen `autocomplete="off"`. Kennzeichen mit `autocapitalize="characters"`, `autocorrect="off"`, `spellcheck="false"`. Auf echten Geräten nicht prüfbar. |
| R2-M7 Safe-Area der Fußleiste | **hält** | Quer `padding-bottom` 4 px, Fußleiste 56 px. |
| R2-M8 Seite rollt hinter Dialogen | **hält** | Übergabe-Dialog: Seite blieb bei 900 px, nach zwei Wischgesten und einem Mausrad-Schritt. |

**Neue Mobile-Probleme durch die Änderungen aus Runde 3 (und eine ältere Ursache):**
- **„◐" in der Fußleiste (R3-L6):** Bei 100 % unauffällig und
  platzsparend. Bei 200 % ist er die Ursache, dass die Fußleiste überläuft
  (R4-M2). In der Erfassung steht er in Schritt 5 an der Stelle von
  „Weiter →" (R4-M3). Die aufklappende Wahl ist knapp bemessen (R4-M7).
- **Leiste „In Einsatz übernehmen" (R3-G3):** Die eigene Zeile trennt das
  Ablegen sauber vom Blättern. Sie macht die Leiste aber 128 px hoch, in
  Schritt 5 bei 360 px 186 px und bei 200 % 267 px (R4-M2, R4-M3).
- **Feste Daumen-Quittung (R3-G2, R3-S5):** Bei 100 % gut: zwei Zeilen,
  volle Ziele, Platz am Seitenende. Sie hängt aber am Layout-Fenster. Wird
  die Seite durch irgendein Element breiter, wandert sie aus dem Bild
  (R4-M1).
- **QR-Vollbild mit „Teil x von n" (R3-H2, R3-H3):** Bei 100 % auf allen
  Größen gelöst. „Teil x von n" steht über dem Code, und „Schließen" fragt
  nach fehlenden Teilen. Offen bleiben die große Schrift (R4-M4) und die
  Zurück-Geste, die an der Nachfrage vorbeiführt (R4-M5).
- **Zwischensummen nach Zug:** Sie stammen aus der Behebung von R2-S3,
  also nicht aus Runde 3. Die Nachmessung zu R2-M1 hat sie offenbar nicht
  erfasst, vermutlich ohne Sammlung mit Zügen. Mit drei Zügen sind sie
  jetzt die Ursache für den Überlauf in der Einsatzansicht (R4-M1).
