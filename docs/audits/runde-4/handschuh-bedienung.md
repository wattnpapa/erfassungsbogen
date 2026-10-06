# Audit „Handschuh-Bedienung", Runde 4 (Touch-Ziele, Abstände, Doppeltipps, Formate)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde vom 05.10.2026.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, je Prüfung ein eigener
Browser-Kontext. Viewports 360 × 640 (hochkant), 640 × 360 (quer) und
320 × 568, für zwei Gegenproben 390 × 844. Weil der Handschuh das
Feld-Thema nahelegt, habe ich zuerst im Feld-Modus gemessen, dann im
Standard-Modus gegengeprüft. Getestet habe ich zuerst ohne Blick in frühere
Berichte. Den Runde-3-Bericht samt „Stand der Behebung" und die
Runde-3-Übersicht habe ich danach gelesen, die vorliegenden Runde-4-Berichte
erst zuletzt.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false`, `stand` auf
die aktuelle Minute gesetzt:

- `eeb.entwurf.v1` mit `examples/thw/003-crailsheim-fgr-w-a.json`
  (12 Personen, 3 Fahrzeuge), direkt auf Schritt 1 bis 6; für die
  Nachprüfung von R3-G1 `015-ansbach-fgr-log-mw.json` (18 Personen).
- `eeb.einsaetze.v1` mit einer Sammlung „Hochwasser Musterstadt" aus 1, 2,
  4 oder 6 Beispielbögen (001, 003, 009, 013, 016, 021; für die
  Quittungsleiste 052).
- `eeb.vorlagen.v1` mit einer Vorlage aus 008.

Schnellerfassung, Übergeben, QR-Vollbild, Rückfragen und Moduswahl habe ich
über die Bedienung geöffnet.

Gemessen habe ich auf jedem Screen alle sichtbaren Bedienelemente per
`getBoundingClientRect` (`button`, `a`, `input`, `select`, `textarea`,
`summary`, `label` mit Eingabe, Rollen `button`/`tab`/`checkbox`/`radio`):
Kantenlänge, Abstand zum Nachbarn, feste Lage. Grobe Tipps habe ich per
`elementFromPoint` 12 bzw. 15 px neben der Knopfkante nachgestellt.
Doppeltipps habe ich als zwei Touch-Ereignisse (CDP
`Input.dispatchTouchEvent`) auf dieselbe Stelle gesetzt, Soll-Abstand
120 bis 2 000 ms. Den tatsächlichen Abstand habe ich in der Seite über die
Zeitstempel der beiden `pointerdown` gemessen. Elf weitere Prüfer nutzten
den Server gleichzeitig. Die Ist-Abstände lagen deshalb 30 bis 220 ms über
dem Soll, und in den Tabellen steht der Ist-Wert. Die Tastatur habe ich
grob nachgestellt, indem ich das Bild nach dem Antippen eines Felds auf
360 × 360 verkleinert habe. Das entspricht einer Android-App, die ihr
Fenster über der Tastatur verkleinert.

Maßstab wie in Runde 3: 44 px Mindestkante, 8 px Mindestabstand, mit
Arbeitshandschuh eher 48 px und 12 px. Ein Handschuhfinger deckt auf dem Glas
grob 12–18 mm ab, je nach Gerät etwa 70–110 CSS-px.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, Nässe auf dem Display,
die echte Bildschirmtastatur (der verkleinerte Viewport ist nur ein Ersatz;
Chrome ab Version 108 und iOS verkleinern das Layout nicht, dort liegt die
feste Leiste hinter der Tastatur), native Datums-, Zeit- und
Auswahlpicker, Wischgesten (`Input.synthesizeScrollGesture` rollte im
Headless-Chromium weder die Seite noch die Tabelle, seitliches Rollen ist
deshalb nur über Maße belegt), Safari/WebKit (kein WebKit im Prüfaufbau,
deshalb kein Test auf Doppeltipp-Zoom), Kamera, native Builds.
Zeitmessungen unter Last sind unsicher. Die Sperrgrenzen unten habe ich
deshalb nur in Stufen von etwa 150 ms eingegrenzt.

Kennzeichnung im Nachweis: **gemessen** heißt Zahl aus dem Browser,
**beobachtet** heißt im Ablauf gesehen, **Risiko** heißt plausibel, aber
nicht nachgestellt.

Skripte, Messprotokolle und Bildschirmfotos liegen außerhalb des
Repositorys im Scratchpad der Sitzung (`runde4/handschuh/`).

## Urteil

Im Feld-Modus ist die App mit Handschuh gut zu bedienen. Fast jedes Ziel
misst 54 px. Die Stärke-Zähler messen 67 × 67 px und zählen auch bei vier
Tipps pro Sekunde jeden Tipp. Die Einheitenkarten am Meldekopf sind als
Ganzes antippbar. Pflichtgesten gibt es keine. Die Runde-3-Behebungen
halten: „Rückgängig" nach „Person entfernen" steht unten im Bild.
„In Einsatz übernehmen" hat eine eigene Zeile. Die Quittungsleiste ist
kompakt, und ein zögernder zweiter Tipp auf „Abrücken" bleibt bis etwa
1,5 s wirkungslos.

Die größte Lücke ist der **Doppeltipp in Rückfragen**. Abrücken und die
Daumenleiste sperren die Fingerstelle 1,5 s, die Rückfrage-Dialoge nur
450 ms. Liegt der Auslöser dort, wo der Bestätigungsknopf aufgeht, bestätigt
ein zweiter Tipp nach gut einer halben Sekunde „Verwerfen", „Person
entfernen" oder „In den Papierkorb". Beim Einsatz landet der Helfer dann
oben auf der Startseite. Das „Rückgängig" steht dreieinhalb Bildschirme
tiefer. Runde 3 hatte die Rückfragen nur mit 150 und 350 ms geprüft.

Zweitens wirkt der **neue Knopf „◐" in der Fußleiste** gerade im Feld-Modus
gegen den Handschuh. In Schritt 5 ragt „Zur Übersicht →" über den Rand,
oder er rutscht in eine dritte Zeile nach links, und an seinem gewohnten
Platz steht „◐". Drittens legt sich die feste Leiste bei offener Tastatur
über die Vorschlagsliste.

Die Aufgaben (eigenen Bogen ausfüllen und übergeben, am Meldekopf
erfassen, abrücken) sind ohne fremde Hilfe zu schaffen. Ein Fehlgriff kann
einen Einsatz in den Papierkorb legen. Er ist rückholbar, aber der Rückweg
liegt nicht im Bild.

## Befunde

### R4-G1 [P1] Rückfragen: Ein zweiter Tipp nach gut einer halben Sekunde bestätigt Löschen und Verwerfen (Rest von R2-G1, neu gemessen über 350 ms)

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Jede Rückfrage der Dialogschicht, geprüft an
„Verwerfen" (Startseite), „Person entfernen" (Schritt 3, Karten) und
„Einsatz löschen…" (Einsatzansicht). Code: `src/app/dialoge.tsx`,
`prellschutzMs = 450` (um Zeile 210) und `prellschutz()` im
`Dialogfenster`. Im Vergleich dazu `src/app/tipp-schutz.ts`,
`ORTSSPERRE_MS = 1500`.

**Beobachtung:** Die Rückfrage erscheint mittig. Ihr Bestätigungsknopf liegt
bei 360 × 640 (Feld) je nach Text zwischen y 326 und 448 px. Auf der
Startseite liegt „Verwerfen" vor dem Rollen bei y 384–438. Der Knopf
„Verwerfen" der Rückfrage liegt bei 381–435, also unter demselben Finger.
In den anderen Fällen habe ich den Auslöser vor dem Tipp auf die Höhe des
Bestätigungsknopfs gerollt. Dann zwei Tipps auf dieselbe Stelle:

| Auslöser | Abstand (Ist, wo gemessen) | Ergebnis |
| --- | --- | --- |
| „Verwerfen" (Startseite) | Soll 200 ms | Rückfrage bleibt offen |
| „Verwerfen" (Startseite) | Soll 700 / 1 200 ms | **Bogen verworfen**, liegt auf dem Rückholplatz |
| „Wagner, Hanna entfernen" | 357 ms | Rückfrage bleibt offen |
| „Wagner, Hanna entfernen" | 551 / 761 / 1 148 ms | **Person entfernt** (12 → 11), Daumenleiste „Entfernt: Wagner, Hanna · Rückgängig" |
| „Einsatz löschen…" | 381 ms | Rückfrage bleibt offen |
| „Einsatz löschen…" | 574 / 746 / 1 156 ms | **Einsatz im Papierkorb** |

Nach dem Löschen des Einsatzes steht die Startseite bei `scrollY` 0. Im
ersten Bild ist keine Quittung zu sehen. Der Hinweis „Einsatz … in den
Papierkorb gelegt" steht bei y 2 209 px, sein „Rückgängig" (129 × 54 px)
bei y 2 273 px, also gut dreieinhalb Bildschirme tiefer. Der Knopf
„Papierkorb (1)" darunter misst im Feld-Modus nur 112 × 41 px.

**Erwartung der Rolle:** Wer unsicher ist und nachtippt, löst keine
Rückfrage aus, die er nie gelesen hat. Das soll für Rückfragen ebenso lange
gelten wie für „Abrücken".

**Auswirkung im Einsatz:** Mit Handschuh tippt man nach, wenn der erste Tipp
nicht spürbar ankam. Die App selbst rechnet mit Nachtipps bis etwa 1 s
(Kommentar in `tipp-schutz.ts`). Am Meldekopf verschwindet so die ganze
Lage vom Bild. Der Helfer steht auf der Startseite, sieht den Grund nicht
und findet den Rückweg erst nach langem Rollen. Bei „Person entfernen" und
„Verwerfen" ist der Rückweg im Bild bzw. auf der Startseite. Sie kosten
aber Suchzeit und Vertrauen.

**Empfehlung:** Die Rückfrage-Dialoge an dieselbe Ortssperre binden wie
„Abrücken": Die Fingerstelle des Auslösers nimmt 1,5 s keinen Tipp an.
Alternativ den Bestätigungsknopf nie dort aufgehen lassen, wo der Auslöser
lag (etwa „Abbrechen" oben, Bestätigen unten außerhalb der Bildmitte).
Nach „Einsatz löschen" die Quittung mit „Rückgängig" im ersten Bild zeigen,
zum Beispiel als Daumenleiste wie in der Einsatzansicht.

**Nachprüfung:** Die drei Auslöser auf die Höhe ihres Bestätigungsknopfs
legen. Zweimal tippen im Abstand von 500, 750, 1 000 und 1 250 ms: Die
Rückfrage bleibt jedes Mal offen. Nach bewusstem „In den Papierkorb" steht
„Rückgängig" ohne Rollen im Bild.

### R4-G2 [P2] Feld-Modus, Schritt 5: „Zur Übersicht →" ragt über den Rand oder rutscht in die dritte Zeile, „◐" steht am Platz von „Weiter →" (neu, Folge der Behebung von R3-L6)

**Priorität:** P2

**Nachweis:** gemessen, beobachtet.

**Fundstelle / Aufgabe:** Feste Fußleiste des Assistenten (eigener Bogen)
und der Meldekopf-Erfassung („Einheit schnell erfassen"), Schritt 5. Code:
`index.html`, `footer.nav button` mit `flex-shrink: 0` und `white-space:
nowrap` (um Zeile 1478), `@media (max-width: 22.4rem)` (um Zeile 1405) und
`footer.nav.mit-uebernehmen` (um Zeile 1500). Knopf „◐" aus
`src/app/anzeige-schalter.tsx`, `AnzeigeLeistenKnopf`.

**Beobachtung:**

| Ansicht, Feld-Modus | „← Zurück" | „◐" | Primärknopf | Leiste |
| --- | --- | --- | --- | --- |
| Assistent 360 × 640, Schritt 1–4 | 18–142 | 153–206 | „Weiter →" bis 343 | 81 px |
| Assistent 360 × 640, Schritt 5 | 18–142 | 153–206 | „Zur Übersicht →" 228–**402** | 81 px |
| Assistent 390 × 844, Schritt 5 | 18–142 | 153–207 | „Zur Übersicht →" 231–**404** | – |
| Assistent 320 × 568, Schritt 5 | 18–75 (nur „←") | 81–135 | 148–307 | 81 px |
| Erfassung 360 × 640, Schritt 5 | 18–142, Zeile 2 | **281–342**, Zeile 2 | 18–192, **Zeile 3** | 214 px (33 %) |
| Erfassung 320 × 568, Schritt 5 | 18–75, Zeile 2 | **241–302**, Zeile 2 | 18–178, **Zeile 3** | 214 px (38 %) |
| Erfassung 390 × 844, Schritt 5 | 18–142, Zeile 2 | **311–372**, Zeile 2 | 18–192, **Zeile 3** | 214 px (25 %) |

Im Assistenten bei 360 px sind 42 px des Knopfs abgeschnitten. Im Bild
steht „Zur Übersicht" ohne Pfeil am Rand (Screenshot `s5-feld-360x640`).
In der Erfassung stehen in den Schritten 1–4 „Weiter →" und „◐" in einer
Zeile, „Weiter →" rechts. In Schritt 5 steht rechts unten „◐", der
Primärknopf liegt links in einer dritten Zeile (Screenshot
`erf-s5-feld-320x568`). Bei 320 px liegt „←" nur 6 px neben „◐".

Ursache für den Überlauf im Assistenten: Die Media Query, die „Zurück" auf
den Pfeil kürzt, rechnet `22.4rem` mit der Grundschrift 16 px, also
358,4 px. Der Feld-Modus hebt die Schrift auf 112 %. Bei 360 und 390 px
greift die Kürzung nicht mehr, obwohl die Knöpfe breiter sind.

**Erwartung der Rolle:** Der Knopf, den ich viermal rechts unten getroffen
habe, steht beim fünften Mal am selben Platz und ist ganz zu sehen.

**Auswirkung im Einsatz:** Gerade im Modus für Handschuhe wandert der
häufigste Knopf. In der Erfassung öffnet der gewohnte Tipp rechts unten
die Moduswahl, statt weiterzublättern. Der Helfer muss die Wahl schließen
und „Zur Übersicht →" links unten suchen. Die Leiste belegt dabei ein
Drittel des Bilds. Im Assistenten ist der abgeschnittene Knopf noch
treffbar (132 px sichtbar), aber er sieht kaputt aus.

**Empfehlung:** Den Primärknopf in jedem Schritt rechts unten festhalten.
Die Grenze für den kurzen Rückweg an der tatsächlichen Breite der Knöpfe
festmachen statt an `rem` (oder „Zur Übersicht →" auf „Übersicht →"
kürzen). „◐" nicht an den rechten Rand und im Feld-Modus nicht in die
Primärzeile stellen.

**Nachprüfung:** Feld-Modus bei 320, 360 und 390 px, Assistent und
Erfassung, Schritt 1 bis 5. Der Primärknopf hat in jedem Schritt denselben
rechten Rand (≤ Bildbreite − 16 px) und dieselbe Höhe. Die
Erfassungsleiste bleibt zweizeilig.

Verweis: Dieselbe Ursache bei 200 % Systemschrift und im Standard-Modus bei
360 px steht in [mobile-ui.md](mobile-ui.md) als R4-M2 und R4-M3. Neu ist
hier der Feld-Modus bei normaler Schrift. Er trifft alle drei Breiten.

### R4-G3 [P2] Offene Tastatur: Die feste Leiste liegt über der Vorschlagsliste, ein Tipp auf den Vorschlag trifft „In Einsatz übernehmen" (neu, Folge der Behebung von R3-S4)

**Priorität:** P2

**Nachweis:** gemessen in der Tastatur-Nachstellung, auf echten Geräten
Risiko.

**Fundstelle / Aufgabe:** Meldekopf → „Einheit schnell erfassen" →
Schritt 1, Feld „Name (Pflicht)", „Ul" eingeben. Code: `index.html`,
`footer.nav` mit `z-index: 25` über `ul.vorschlaege` (20), Kommentar zu
R3-S4 (um Zeile 1356). Eine Tastaturbehandlung (`visualViewport`,
`interactive-widget`) gibt es im Code nicht.

**Beobachtung:** Bei 360 × 640 (Feld) misst die Erfassungsleiste 134 px
(zwei Zeilen). Nach dem Verkleinern auf 360 × 360 (Tastatur nachgestellt)
steht das Feld bei y 144–198, die Leiste beginnt bei 211. Die Vorschläge
„Ulm", „Daun-Vulkaneifel", „Fulda" … liegen bei 202–445, also ganz unter
der Leiste (Screenshot `tastatur-sim`). Ein Tipp auf die Mitte des ersten
Vorschlags (180/229) trifft „In Einsatz übernehmen". Es folgte die
Rückfrage „Stärke fehlt". Ohne Tastatur sind die Vorschläge gut: 54–90 px
hoch, lückenlos und vollständig lesbar.

**Erwartung der Rolle:** Was ich gerade eintippe, und die Vorschläge dazu
sind zu sehen, während die Tastatur offen ist. Ein Tipp dorthin wählt einen
Vorschlag.

**Auswirkung im Einsatz:** In der Android-App, deren Fenster über der
Tastatur schrumpft, sieht der Helfer keine Vorschläge und muss den OV-Namen
ganz tippen, mit Handschuh Buchstabe für Buchstabe. Ein Tipp in die Gegend
der unsichtbaren Liste übernimmt die halbe Einheit. Die Rückfrage fängt das
bei fehlender Stärke ab, bei schon eingetragener Stärke nicht (nicht
geprüft). Im Browser liegt die Leiste hinter der Tastatur. Dann sind die
Vorschläge sichtbar, aber „Weiter →" ist erst nach dem Schließen der
Tastatur zu erreichen.

**Empfehlung:** Bei offener Tastatur die feste Leiste ausblenden oder auf
eine Zeile verkleinern, solange ein Feld den Fokus hat. Alternativ die
Vorschlagsliste über dem Feld öffnen, wenn darunter kein Platz ist.

**Nachprüfung:** Android-App (Capacitor) und Chrome auf einem 360-px-Gerät,
OV-Feld fokussieren, zwei Buchstaben tippen. Mindestens zwei Vorschläge
sind sichtbar und antippbar, und ein Tipp auf sie übernimmt nichts in die
Lage.

### R4-G4 [P3] Enge Paare: „+ übergeordnete Ebene" ohne Abstand, „Schließen" 11 px unter „Weiter zu Teil 2" (neu)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** siehe Tabelle (360 × 640, Feld-Modus, wo nicht
anders angegeben).

**Beobachtung:**

| Paar | Lage | Abstand | Folge eines Fehlgriffs |
| --- | --- | --- | --- |
| „+ übergeordnete Ebene" / „OV/RB/LV-Vorlage" (Schritt 1 der Erfassung) | 218 × 54 bei y 1 752, 177 × 54 bei y 1 806 | **0 px**, übereinander | falsche Ebene bzw. Vorlage geladen |
| „Weiter zu Teil 2 →" / „Schließen" (QR-Vollbild) | y 507–561 / 572–626 | 11 px | grober Tipp 15 px unter „Weiter" trifft „Schließen". Das Vollbild geht zu, beim Wiederöffnen beginnt es bei Teil 1 (siehe R4-M5) |
| „Rückgängig" / „✕" (Daumenleiste) | x 144–273 / 282–336 | 9 px | Rückweg weg bzw. Handlung zurückgenommen (mit Quittung) |
| „←" / „◐" (Fußleiste 320 × 568) | x 18–75 / 81–135 | 6 px | Moduswahl klappt auf |
| „Fortsetzen" / „Verwerfen" (Startseite) | x 38–176 / 184–322 | 8 px | Rückfrage. Mit Doppeltipp siehe R4-G1 |

**Erwartung der Rolle:** Gegensätzliche oder folgenreiche Knöpfe haben eine
Lücke, die ein Handschuhfinger sieht.

**Auswirkung im Einsatz:** Meist ein Suchmoment. Beim QR-Vollbild steht die
Gegenstelle mit der Kamera da, und die Übergabe beginnt von vorn.

**Empfehlung:** Zwischen benachbarten Knöpfen mindestens 12 px. Im
QR-Vollbild „Schließen" weiter absetzen oder erst nach dem letzten Teil
hervorheben. In der Daumenleiste „✕" mit mehr Abstand.

**Nachprüfung:** Tabelle neu messen. Keine Lücke unter 12 px, und ein Tipp
15 px unter „Weiter zu Teil 2 →" trifft nicht „Schließen".

### R4-G5 [P3] Der Handschuh-Modus heißt nur „Feld", Standard bleibt bei 44 px (neu)

**Priorität:** P3

**Nachweis:** beobachtet, gemessen.

**Fundstelle / Aufgabe:** Moduswahl „Standard ▾" im Kopf der Startseite und
„◐" in der Fußleiste. Code: `src/app/anzeige-modus.ts` (`ANZEIGE_MODI`,
Erklärung nur als `title`).

**Beobachtung:** Im Standard-Modus messen fast alle Ziele 44 px, die
Leistenknöpfe 47 px, Kästchen 24 px in 44-px-Zeilen. Im Feld-Modus sind es
54 px, Kästchen 30 px, Zähler 67 px. Die Wahl zeigt vier gleich große
Felder „Standard / Dunkel / Feld / Nacht" (je 81–82 × 44 px) ohne
sichtbaren Hinweis, dass „Feld" große Tippziele bedeutet. Die Erklärung
„Große Tippziele und hoher Kontrast …" steht nur im Tooltip, und den gibt
es auf dem Telefon nicht.

**Erwartung der Rolle:** Ich erkenne auf einen Blick, welche Einstellung für
Handschuhe ist.

**Auswirkung im Einsatz:** Wer die App ohne Einweisung mit Handschuh
bedient, bleibt im Standard-Modus und arbeitet mit 44-px-Zielen. Das geht,
kostet aber Fehlgriffe, die der Feld-Modus vermeiden würde.

**Empfehlung:** Unter „Feld" eine Zeile „große Knöpfe, Handschuh, Sonne"
oder ein Handschuh-Zeichen. Gegebenenfalls den Feld-Modus beim ersten
Start auf Touch-Geräten anbieten.

**Nachprüfung:** Neuen Helfer mit Handschuh fragen, welche Einstellung er
wählen würde. Er findet „Feld" ohne Tooltip.

### R4-G6 [P3] Kein Schutz gegen Doppeltipp-Zoom an den Zählern (Risiko)

**Priorität:** P3

**Nachweis:** Risiko (Code gelesen, WebKit nicht prüfbar).

**Fundstelle / Aufgabe:** Stärke-Zähler „−"/„+" in der Schnellerfassung
und im Sofortbedarf. Code: `index.html`, Viewport
`width=device-width, initial-scale=1` ohne `touch-action: manipulation`
an irgendeinem Element.

**Beobachtung:** In Chromium zählten neun Tipps im Abstand von 120, 250,
400 und 700 ms, mit ±12 px Streuung, jedes Mal genau 9. Safari auf iOS
kann einen schnellen zweiten Tipp auf einen Knopf ohne
`touch-action: manipulation` als Doppeltipp-Zoom deuten. Das ließ sich hier
nicht prüfen.

**Erwartung der Rolle:** Schnelles Hochzählen zählt und zoomt nicht.

**Auswirkung im Einsatz:** Zoomt die Seite, liegen die Zähler woanders. Der
nächste Tipp trifft daneben, und der Helfer muss erst zurückzoomen.

**Empfehlung:** `touch-action: manipulation` auf Knöpfe, mindestens auf die
Zähler und die Fußleiste.

**Nachprüfung:** iPhone mit Safari, Schnellerfassung, „Mannschaft +" zehnmal
schnell antippen. Kein Zoom, Wert 10.

## Verweise auf andere Runde-4-Berichte

Unabhängig beobachtet, dort zuerst beschrieben, hier nicht gezählt:

- **R4-K5** ([fuehrungssicht.md](fuehrungssicht.md)): Die Einheitenliste
  der Einsatzansicht beginnt erst nach rund vier Bildschirmen. Gemessen im
  Feld-Modus: erste Karte bei y 2 559 (360 × 640) bzw. rund 1 700 (640 × 360).
  Davor liegen die Export-Knöpfe. Mit Handschuh heißt das lange Wischwege
  über Knöpfe, die man zum Anhalten des Rollens antippen kann.
- **R4-M2, R4-M3** ([mobile-ui.md](mobile-ui.md)): Fußleiste mit „◐" bei
  200 % Schrift bzw. im Standard-Modus in Schritt 5. Die Feld-Variante
  steht in R4-G2.
- **R4-M5** ([mobile-ui.md](mobile-ui.md)): Ein geschlossenes mehrteiliges
  QR-Vollbild beginnt wieder bei Teil 1. Der grobe Tipp auf „Schließen"
  steht in R4-G4.
- **R4-H2** ([feldtauglichkeit.md](feldtauglichkeit.md)) und **R4-N3**
  ([neuer-nutzer.md](neuer-nutzer.md)): Kurz-Liste im Personalschritt. Die
  Tabelle ist 723 px breit in einem 320 px breiten Rahmen. „Entfernen"
  (x 697), Sortierpfeile (x 619) und „Geschlecht" (x 494) erreicht man erst
  nach seitlichem Wischen, und zwar über einer Fläche, die fast nur aus
  Eingabefeldern besteht. Mit Handschuh öffnet ein Wisch, der auf einem Feld
  beginnt, leicht die Tastatur. Das ist Risiko, weil Wischen nicht prüfbar
  war.
- **R4-S2** ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)):
  Doppeltipp auf „Weiter →" überspringt einen Schritt. Hier nicht
  nachgemessen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Feld-Modus:** Auf Startseite, Assistent (Schritte 1–6), Übergeben,
  QR-Vollbild, Einsatzansicht und Schnellerfassung liegen bei 360 × 640
  alle Ziele bei 54 px (Fußleiste 54 px, Kopfnavigation 49 px). Ausnahmen
  sind nur Kästchen und Radios (30 px), die in einer 54 px hohen, ganz
  antippbaren Zeile stehen, und „6. Übersicht" in der Schrittleiste (44 px
  breit).
- **Stärke-Zähler:** „−"/„+" je 67 × 67 px, getrennt durch das 67 px breite
  Zahlenfeld, 42 px Abstand zwischen den Zeilen. Neun Tipps mit 120–700 ms
  Abstand und ±12 px Streuung ergeben jedes Mal 9.
- **Abrücken gegen Doppeltipp:** „Abrücken" im unteren Bildteil, zwei Tipps
  mit Ist-Abstand 211, 370, 751, 1 035, 1 420 und 1 463 ms: Die Einheit
  bleibt abgerückt. Ab 1 635 ms nimmt der zweite Tipp das Abrücken über
  „Rückgängig" bewusst zurück. Die Leiste quittiert das mit „Wieder
  anwesend: Abrücken von Nr. 2 … zurückgenommen". In der Bildmitte rückt
  der Gegenknopf nach dem Abrücken eine Zeile tiefer. Der zweite Tipp trifft
  dort Leerraum.
- **Daumenleiste:** 65 px hoch bei 320 × 568 und 360 × 640 (Standard,
  11 % bzw. 10 %), 78 px im Feld-Modus (14 % bei 320 × 568). Sie bleibt
  stehen (nach 15 s noch da). „Rückgängig" 129 × 54 px (Feld).
- **Einheitenkarten:** Die ganze zugeklappte Karte ist der Knopf zum
  Aufklappen (284 × 99–210 px). Ein Fehlgriff klappt nur die Nachbarkarte
  auf.
- **Vorschlagslisten** ohne Tastatur: Einheitstyp und OV je 54–90 px hoch,
  280 px breit, lückenlos. Ein Tipp wählt sauber.
- **Keine Pflichtgesten:** In `src/app` reagiert nichts auf Wischen, Ziehen
  oder langes Drücken. Alles geht mit einfachem Tippen.
- **Kein seitlicher Seitenversatz:** `scrollWidth` gleich der Bildbreite auf
  allen geprüften Screens bei 320, 360 und 640 px. Tabellen rollen in ihrem
  Rahmen.
- **Rückfragen bei kurzem Doppeltipp:** Bis etwa 380 ms bleibt jede geprüfte
  Rückfrage offen (zur Grenze siehe R4-G1). „Alle Daten löschen" verlangt
  zusätzlich einen Haken und ist mit Doppeltipp nicht auszulösen.
- **Querformat:** Kopf und Schrittleiste rücken zusammen, Schrittleiste 44 px
  (Standard) bzw. 45 px (Feld). „In Einsatz übernehmen" steht quer 43 px
  neben „Weiter →". Die aufgeklappten Karten zeigen alle Aktionen mit 54 px
  Höhe.

## Abschluss

- **Aufgabe geschafft:** ja. Eigener Bogen, Übergabe per QR, Schnellerfassung
  und Abrücken gehen im Feld-Modus mit Handschuhmaß. Mit Umwegen nach einem
  Doppeltipp in einer Rückfrage (R4-G1) und in Schritt 5 (R4-G2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Nach einem nachgesetzten Tipp auf
  „Einsatz löschen…" steht der Helfer auf der Startseite und glaubt, die
  Lage sei weg. Das „Rückgängig" liegt dreieinhalb Bildschirme tiefer
  (R4-G1).
- **Größtes Einsatzrisiko:** Rückfragen nehmen einen zweiten Tipp nach
  450 ms an, und der Bestätigungsknopf erscheint oft genau unter dem Finger
  (R4-G1).
- **Top-Priorität für die nächste Iteration:** Die Rückfrage-Dialoge unter
  dieselbe 1,5-s-Ortssperre stellen wie „Abrücken", und „◐" aus der
  Primärposition der Fußleiste nehmen.

## Abgleich mit Runde 3

Grundlage: [../runde-3/handschuh-bedienung.md](../runde-3/handschuh-bedienung.md)
mit „Stand der Behebung" und
[../runde-3/README.md → Stand der Behebung](../runde-3/README.md#stand-der-behebung).

| Runde-3-Befund | Stand laut Tabelle | Bewertung Runde 4 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R3-G1 „Rückgängig" nach „Person entfernen" über dem Bildrand (P2) | behoben | **hält** | Knopf bei 150, 320 und 500 px Bildhöhe: „Rückgängig" jedes Mal im Bild, 108 × 44 px bei y 509 (360 × 640) bzw. 437 (320 × 568), Feld 129 × 54 px bei y 486. |
| R3-G2 Quittungsleiste deckt bis 26 %, fängt den zweiten Tipp (P2) | behoben | **hält** | Leiste 65 px = 11 % bei 320 × 568 (Standard), 78 px = 14 % (Feld), 18 % quer. Doppeltipp unten bis 1 463 ms → abgerückt, ab 1 635 ms bewusstes Zurücknehmen mit Quittung. |
| R3-G3 „In Einsatz übernehmen" zwischen den Blätterknöpfen (P2) | behoben | **hält, mit Nebenwirkung** | Eigene Zeile 288 × 44 (320) / 328 × 44 (360) bzw. Feld 284–324 × 54, 14 px über der Blätterzeile. Ein Tipp 30 px links der Mitte von „Weiter →" blättert nur (Einträge unverändert). Nebenwirkung: Die Leiste ist im Feld-Modus 134 px hoch, in Schritt 5 dreizeilig 214 px (R4-G2), und bei offener Tastatur deckt sie die Vorschläge (R4-G3). |
| R3-G4 Restliche kleine Ziele (P3) | behoben | **hält** | Schrittleiste quer 44 px (Feld 45), Bedarfslink „Ruhezeit: 1×" 79 × 47, „Weitere Formate" 272 × 65, „Datenschutzfrist" quer 574 × 44, Themenwahl 44–69 px breit (Feld 54–91), „THW" 44 × 44. |
| R2-G1 Doppeltipp bestätigt Rückfrage (Runde 3: „hält") | behoben (Runde 2) | **hält nur teilweise** | Bei 150–380 ms bleibt die Rückfrage offen. Ab rund 550 ms bestätigt der zweite Tipp, sofern der Knopf unter dem Finger aufgeht. Runde 3 hatte nur 150 und 350 ms geprüft (R4-G1). |
| R3-S5 Doppeltipp „Abrücken" (Bezug Handschuh) | behoben | **hält** | Ortssperre 1,5 s wirkt, siehe Bestätigtes. |
| R3-D3 Person entfernen, Quittung über dem Bild (Bezug Handschuh) | behoben | **hält** | wie R3-G1. Ein zweiter Tipp auf die alte Stelle nach 551 ms bestätigt aber die Rückfrage, wenn sie dort aufgeht (R4-G1). |
| R3-L6 Moduswechsel nur ganz oben (Bezug Handschuh) | behoben | **hält, mit Nebenwirkung, im Feld-Modus ins Gegenteil verkehrt** | „◐" ist in der Leiste und funktioniert. Im Feld-Modus drückt er „Zur Übersicht →" 42 px über den Rand (Assistent 360/390 px) bzw. nimmt dessen Platz rechts unten ein (Erfassung, alle Breiten). Laut Nachlauf sollte die Leiste „in allen Größen gerätebreit" sein, das gilt für Schritt 5 im Feld-Modus nicht (R4-G2). |
| R3-S4 Vorschlagsliste über der Aktionsleiste (Bezug Handschuh) | behoben | **hält ohne Tastatur, Nebenwirkung mit Tastatur** | Ohne Tastatur trifft ein Tipp auf die Leiste den Knopf. Mit nachgestellter Tastatur liegt die ganze Liste unter der Leiste, und der Tipp auf den Vorschlag trifft „In Einsatz übernehmen" (R4-G3). |
| R3-H6 Kurz-Liste rollt seitlich (Bezug Handschuh) | weitgehend | **unverändert** | Tabelle 723 / 320 px, „Entfernen" bei x 697 (siehe Verweis R4-H2/R4-N3). |

Bilanz: Alle vier eigenen Runde-3-Befunde halten. Zwei Behebungen anderer
Rollen haben Nebenwirkungen auf die Handschuh-Bedienung: Der Knopf „◐"
(R3-L6) verschiebt im Feld-Modus den Primärknopf. Die Leiste über der
Vorschlagsliste (R3-S4) deckt bei offener Tastatur die Vorschläge. Die
Behebung von R2-G1 deckt Doppeltipps nur bis etwa 450 ms ab, während
Abrücken und Daumenleiste inzwischen 1,5 s sperren. Daraus wird R4-G1, der
einzige P1 aus Handschuhsicht.

## Stand der Behebung

Stand 05.10.2026, Paket 1 „Rückfragen, Links, Rückholplatz, Zurück-Geste".
Geprüft mit Typprüfung, Unit-Tests (2 446 grün), Verhaltenstests (137
Szenarien grün) und Nachmessung im Dev-Server (360 × 640,
`isMobile`/`hasTouch`, de-DE, Port 5180). Aufgeführt sind nur die Befunde
dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-G1 Rückfragen nehmen nach 450 ms einen zweiten Tipp an | behoben | Jede Rückfrage sperrt beim Öffnen die Fingerstelle des Auslösers 1,5 s (`ortSperren()`, wie nach „Abrücken"); daneben wirkt ein Tipp sofort. „Einsatz löschen" aus der Einsatzansicht quittiert in der Daumenleiste. Nachlauf (Feld, Auslöser auf Höhe des Bestätigungsknopfs, 500/750/1 000/1 250 ms): „Verwerfen", „Einsatz löschen…", „Person entfernen" — Rückfrage jedes Mal offen, nichts verändert (Gegenprobe ohne Sperre bei 750 ms: verworfen/gelöscht/entfernt). Nach „In den Papierkorb": „Rückgängig" 129 × 54 px bei y 562, ohne Rollen. |

Stand 06.10.2026, Paket 3 „Layout, 200 % Schrift, Touch, Sicht“.
Geprüft mit Typprüfung, Unit-Tests (2 562 grün), Verhaltenstests (137 Szenarien, 1 749 Schritte grün)
und Nachmessung im Dev-Server (`isMobile`/`hasTouch`, de-DE, Port 5180):
360 × 640, 320 × 568, 390 × 844 und 640 × 360, Schrift 100 % und 200 %,
Standard, Feld, Dunkel und Nacht; Positionen per `getBoundingClientRect`,
Kontraste gerechnet. Aufgeführt sind nur die Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R4-G2 Feld-Modus, Schritt 5: „Zur Übersicht →“ ragt über den Rand, „◐“ am Platz von „Weiter →“ | behoben | Ursache war die Media Query `22.4rem` (rechnet mit 16 px, der Feld-Modus hebt auf 112 %). Die Leiste ist jetzt ein Raster mit festem Platz rechts außen; „← Zurück“ kürzt per Container-Abfrage auf die tatsächliche Breite (25rem in Seitenschrift). Nachlauf (Feld, 320/360/390 px, Assistent und Erfassung, Schritt 1–5): Primärknopf in jedem Schritt mit demselben rechten Rand (342 px bei 360, 302 px bei 320, 372 px bei 390) und derselben Zeile; Assistent 360 × 640, Schritt 5: „Zur Übersicht →“ 168–342 px (vorher 228–402); Erfassung bleibt zweizeilig (137 px, 21 % bzw. 24 % bei 320 × 568; vorher 214 px, 33 %); „←“ und „◐“ 12 px auseinander (vorher 6 px). |
| R4-G3 Offene Tastatur: Leiste über der Vorschlagsliste | behoben | `src/app/tastatur.ts` setzt `tastatur-offen` auf `<html>`, solange ein Feld mit Texteingabe den Fokus hat UND die sichtbare Höhe (kleinere von `innerHeight` und `visualViewport.height`) um mindestens 120 px und 20 % unter der gewohnten liegt; `footer.nav` und der feste „◐“ der Einsatzansicht sind dann ausgeblendet, das Feld rückt in die obere Bildhälfte. Am Rechner und bei Pinch-Zoom bleibt die Leiste. Nachstellung (360 × 640 → 360 × 360, Feld, „Ul“ im Namensfeld): Leiste weg, Vorschläge bei 138–313 px im Bild, ein Tipp auf den ersten übernimmt „Ulm“ (vorher traf er „In Einsatz übernehmen“); ebenso bei 320 × 568 → 320 × 360. Nicht geprüft: echte Geräte (Android-App mit verkleinertem Fenster, iOS mit `visualViewport`); die Rechnung ist durch Unit-Tests abgedeckt. |
| R4-G4 Enge Paare | behoben | Mindestens 12 px: „← Zurück“/„◐“ in der Fußleiste 12 px (vorher 6 px bei 320 px); „Weiter zu Teil 2 →“/„Schließen“ im QR-Vollbild 16 px (vorher 11 px); „Rückgängig“/„✕“ in der Daumenleiste 12 px (vorher 9 px); „+ übergeordnete Ebene“/„OV/RB/LV-Vorlage“ 12 px (vorher 0 px, jetzt eine Knopfreihe); „Fortsetzen“/„Verwerfen“ auf der Startseite 12 px (vorher 8 px); Knopfreihen (`.aktionen`) allgemein 12 px (vorher 8 px). Nachlauf: Tabelle neu gemessen (320 und 360 px, Standard und Feld) — keine Lücke unter 12 px, und ein Tipp 15 px unter „Weiter zu Teil 2 →“ liegt im Zwischenraum, nicht auf „Schließen“. |
| R4-G5 Der Handschuh-Modus heißt nur „Feld“ | behoben | Die aufgeklappte Wahl (Fußleiste, Einsatzansicht, Kopf auf dem Telefon) trägt unter jedem Namen eine Zweckzeile: „Standard · normal“, „Feld · große Tasten“, „Dunkel · abends“, „Nacht · gedimmt“; der Tooltip nennt „Handschuhe, Sonne“. Die Segmente messen 44 px (Feld 54 px), zuvor 42 px. Reihenfolge Standard, Feld, Dunkel, Nacht. Nicht umgesetzt: den Feld-Modus beim ersten Start auf Touch-Geräten anbieten (Produktentscheidung). |
| R4-G6 Kein Schutz gegen Doppeltipp-Zoom | behoben (Risiko) | `touch-action: manipulation` an Knöpfen, Links, Feldern, Zusammenfassungen und Beschriftungen (gemessen: alle 128 Bedienelemente der Startseite); Wischen und Zwei-Finger-Zoom bleiben erlaubt (der Viewport sperrt den Zoom nicht, Test). Safari auf dem iPhone ist nicht prüfbar, der Nachlauf „zehnmal schnell auf „Mannschaft +“ tippen“ steht aus. |
