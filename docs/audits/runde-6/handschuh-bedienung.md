# Audit „Handschuh-Bedienung“, Runde 6 (Touch-Ziele, Abstände, Doppeltipps, Formate)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde. Geprüft sind vor allem die in Runde 5 umgebauten Stellen:
Kurz-Liste der Personen (feste Plätze von „▲ ▼ ⇑ ✕“), Fußleisten-Raster mit
„Weiter →“ und „◐“, die feste Leiste „◐ Ansicht“ der Einsatzansicht,
Daumen-Quittung mit der Folge vorn, Abstand „In Einsatz übernehmen“ zu
„Weiter →“, Schrittleisten-Ziele, „Alle abwählen“ in der Musterung und das
QR-Vollbild.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, je Prüfung ein eigener Browser-Kontext.
Viewports 360 × 640, 640 × 360 und 320 × 568, im Standard- und im Feld-Modus
(`eeb.anzeigemodus.v1`), bei 100 % und bei „200 %“ Schrift
(`html { font-size: 200% !important }`) und zusätzlich bei nachgestelltem
Browser-Zoom 200 %: Der CSS-Viewport ist halbiert (180 × 320, 320 × 180,
160 × 284), die Pixeldichte verdoppelt. Das ist kein echter Chrome-Zoom,
sondern dessen Layout-Wirkung.

Blindprüfung: Aus Runde 5 kannte ich beim Messen nur den Abschnitt
„Prüfaufbau“ der `README.md`; beim Nachschlagen fiel der Blick dabei auch auf
die darunter stehende Zusammenfassung „Stand der Behebung“ (Befundkennungen
und Restpunkte). Den Bericht `handschuh-bedienung.md` samt „Stand der
Behebung“ und die Runde-6-Berichte der anderen Rollen habe ich erst nach den
Messungen gelesen.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false` und mit
aktuellem `stand` (sonst anonymisiert die Datenschutzfrist die Namen):

- `eeb.entwurf.v1` mit `examples/thw/013-ulm-b.json` (8 Personen) und
  `examples/thw/grossbogen-verstaerkter-bergungszug.json` (38 Personen,
  Kurz-Liste ab 13, 7-teiliger QR-Code).
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt“ aus sechs
  Beispielbögen (001, 003, 009, 013, 016, 052) bzw. aus Bogen 013.
- `eeb.vorlagen.v1`: Vorlage „Mein OV“ aus dem Großbogen (Musterung).

Gemessen habe ich alle sichtbaren Bedienelemente per `getBoundingClientRect`
(Kantenlänge, Abstand zum nächsten Ziel, feste Lage), grobe Tipps per
`elementFromPoint` (Reihe von Punkten über ein Ziel) und per
`touchscreen.tap`. Doppeltipps habe ich als zwei `touchscreen.tap` auf
dieselbe Stelle gesetzt, Soll-Abstand 120 bis 1 800 ms. Maßstab wie in Runde 5:
44 px Mindestkante, 8 px Mindestabstand, mit Arbeitshandschuh eher 48 px und
12 px.

Elf weitere Prüfer nutzten den Server gleichzeitig; Zeitmessungen sind
unsicher. Der Server wurde während der Prüfung einmal neu gestartet (gleicher
Build). Ein Teil der Läufe scheiterte unter Last (Tab nicht zu öffnen, Tipp
ging ins Leere) und wurde wiederholt oder nicht gewertet. Playwright tippt
Knöpfe nach `scrollIntoView` in die Bildmitte; zwei solche Tipps hintereinander
treffen dieselbe Stelle und fallen in die Ortssperre (1,5 s, 40 px). Wo ein
Lauf daran scheiterte, habe ich 2,5 s gewartet.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas und Nässe, die echte
Bildschirmtastatur, Wischen und Ziehen (im Headless-Chromium nicht auslösbar),
Safari/WebKit (Doppeltipp-Zoom), native Datums- und Zeitpicker, Kamera und
Handscanner, native Builds, echter Browser-Zoom und echte Systemschrift (beide
nur nachgestellt), Zeitmessungen ohne Last. Nicht gemessen: Abstand „In Einsatz
übernehmen“ zu „Weiter →“ bei 320 px/Feld/200 % und bei Browser-Zoom im
Hochformat; der Weg dorthin (Einsatzansicht öffnen, „Einheit manuell
erfassen…“) blieb unter Last in diesen Kombinationen ohne Wirkung.

Kennzeichnung im Nachweis: **gemessen** heißt Zahl aus dem Browser,
**beobachtet** heißt im Ablauf gesehen, **Risiko** heißt plausibel, aber nicht
nachgestellt.

Skripte und Bildschirmfotos liegen außerhalb des Repositorys im Scratchpad der
Sitzung (`runde6/handschuh/`). Der Code-Stand ist 03a0011; zwei später auf
`main` gelandete Commits (nur Lagemonitor) sind im geprüften Build nicht
enthalten.

## Urteil

Die Runde-5-Umbauten tragen in der Sache. Die Kurz-Liste hat feste Plätze:
„▲“, „▼“, „⇑“ stehen bei x 33, 89, 145 (je 44 × 44 px, 12 px Lücke), „✕“ weit
rechts bei x 283, die Zeile ist 197 bis 198 px hoch. „✕“ führt in eine
Rückfrage mit großen, getrennten Knöpfen. Die Fußleiste hat ihr Raster, „In
Einsatz übernehmen“ liegt mit 14 bis 17 px über „Weiter →“. Die
Daumen-Quittung nennt die Handlung vorn („Abgerückt 11:20: …“), „Rückgängig“
(123 × 44 px) und „✕“ stehen 12 px auseinander. Ein Nachtipp auf „Abrücken“,
auf „▼“ und auf „Weiter zu Teil 2 →“ im QR-Vollbild wird bis rund 1,2 s
verworfen, mit sichtbarer Rückmeldung („Einen Moment …“, gestrichelter
Rahmen). Das QR-Vollbild ist in allen geprüften Lagen bedienbar.

Reibung entsteht an den engsten Stellen, und zwar durch Nebenwirkungen der
Runde-5-Behebungen. Das neue Wort „Ansicht“ in der Fußleiste macht „◐ Ansicht“
so breit, dass „Weiter →“ bzw. „Zur Übersicht →“ es überdeckt: bei 320 px im
Feld-Modus um 12 px (Schritte 1 bis 4) und in Schritt 5 um 35 bis 65 px (R6-G1).
Die Einsatzansicht läuft bei 200 % Schrift auf Telefonbreite seitlich über
(R6-G3). Beim Browser-Zoom 200 % füllt die Fußleiste die Hälfte des Bilds und
„Weiter →“ ragt über den Rand (R6-G2). „Alle abwählen“ in der Musterung
springt beim Tipp um 33 px, ein zweiter Tipp haken dann die Führungskraft an
(R6-G4).

Die Aufgaben (Personal durchblättern und sortieren, Person entfernen, Einheit
abrücken und zurücknehmen, Einheit manuell erfassen, Musterung, 7-teiligen Code
durchschalten) sind ohne fremde Hilfe zu schaffen. Es gibt keinen P0 und keinen
P1. Jeder Fehlgriff, den ich auslösen konnte, endete in einer Rückfrage, einem
„Rückgängig“ oder einem Schritt, den „←“ zurücknimmt.

## Befunde

### R6-G1 [P2] „◐ Ansicht“ liegt unter „Weiter →“ bzw. „Zur Übersicht →“: 12 px bei 320 px/Feld, in Schritt 5 35 bis 65 px, bei 200 % Schrift 29 bis 58 px (neu, Nebenwirkung des Wortes „Ansicht“ aus R5-N4)

**Priorität:** P2

**Nachweis:** gemessen (Rechtecke und `elementFromPoint`); Screenshot
`h1-klein-true-false.png`. Dass ein Handschuh-Tipp in die Überlappung blättert,
ist Risiko.

**Fundstelle / Aufgabe:** Assistent, feste Fußleiste `footer.nav.assistent-nav`.
Code: `src/app/anzeige-schalter.tsx` (`AnzeigeLeistenKnopf`, Zweig `kurz`),
`src/app/app.tsx` (Leiste, um Zeile 4390), `index.html` (Raster,
`footer.nav.assistent-nav`, um Zeile 1621 bis 1640). Dieselbe Beobachtung steht
als Rohnotiz N1 in [mobile-ui.md](mobile-ui.md).

**Beobachtung:** Rechter Rand von „◐ Ansicht“ gegen linke Kante des
Primärknopfs (x in px):

| Ansicht | Schritt | „◐ Ansicht“ | Primärknopf | Überlappung |
| --- | --- | --- | --- | --- |
| 320 × 568, Feld, 100 % | 3 | 87–207 | 195–302 | **12 px** |
| 320 × 568, Standard, 200 % | 3 | 85–225 | 196–302 | **29 px** |
| 320 × 568, Feld, 200 % | 3 | 87–229 | 194–302 | **35 px** |
| 320 × 568, Standard, 100 % | 5 | 79–185 | 150–304 | **35 px** |
| 320 × 568, Feld, 100 % | 5 | 87–207 | 142–302 | **65 px** (sichtbar 56 von 120) |
| 360 × 640, Feld, 100 % | 5 | 88–208 | 168–342 | **40 px** |
| 360 × 640, Standard, 200 % | 5 | 87–227 | 169–342 | **58 px** |

Der Primärknopf liegt oben: Ein Punkt im überlappenden Streifen (320/Feld, Schritt
3: ab x 201) trifft „Weiter →“, nicht „◐“. Im Bild läuft der Rahmen von „◐
Ansicht“ unter den dunklen Knopf, das Wort „Ansicht“ steht an dessen Kante. In
Schritt 3 bei 360 px (Standard und Feld, 100 %) und 640 px ist alles frei
(20 px und mehr).

**Erwartung der Rolle:** Die drei Knöpfe der Leiste stehen nebeneinander, ohne
einander zu überdecken. Wer „◐“ trifft, öffnet die Ansichtswahl; wer „Weiter →“
trifft, blättert.

**Auswirkung im Einsatz:** Der Tipp auf die rechte Hälfte von „◐ Ansicht“ blättert
stattdessen weiter. In Schritt 5 ist das „Zur Übersicht →“, ein Sprung, den
„←“ nur einzeln zurücknimmt. Auf dem kleinsten Gerät im Feld-Modus, der
Kombination, die der Handschuh nahelegt, bleiben in Schritt 5 56 px zum
Treffen. Kein Datenverlust.

**Empfehlung:** Die Leiste so rechnen, dass die drei Knöpfe bei 320 px und bei
200 % ohne Überdeckung passen: „◐“ ohne Wort (mit Tooltip und Namen) oder das
Wort „Ansicht“ unter 360 px weglassen, oder „Weiter →“ in eigener Zeile. „Zur
Übersicht →“ in Schritt 5 darf nicht breiter sein als „Weiter →“ (101 px).

**Nachprüfung:** Schritte 1 bis 5, 320/360/640 px, Standard und Feld, 100 % und
200 %: zwischen „◐“ und Primärknopf mindestens 8 px (besser 12 px), keine
Überlappung; `elementFromPoint` über die Breite von „◐“ trifft nur „◐“.

### R6-G2 [P2] Beim Browser-Zoom 200 % (180 × 320 CSS-px) füllt die Fußleiste 44 bis 71 % des Bilds, „Weiter →“ und „◐ Ansicht“ ragen über den rechten Rand (neu)

**Priorität:** P2

**Nachweis:** gemessen in der Nachstellung (Viewport halbiert, Pixeldichte 4);
echter Chrome-Zoom nicht geprüft.

**Fundstelle / Aufgabe:** Assistent, Schritt 3, Fußleiste. Code: `index.html`
(Raster der Leiste, um Zeile 1621 bis 1650).

**Beobachtung:**

| Ansicht (CSS-px) | Leiste | Anteil | Rand |
| --- | --- | --- | --- |
| 180 × 320, Standard | 142 px (ab y 178) | 44 % | „Weiter →“ x 16–202 (186 breit) bei Bild 180: 22 px außerhalb |
| 180 × 320, Feld | 160 px (ab y 160) | **50 %** | „Weiter →“ x 18–222, „◐ Ansicht“ x 78–198: beide über den Rand |
| 320 × 180 (quer), Standard | 56 px | 31 % | passt |
| 320 × 180 (quer), Feld | 65 px | 36 % | passt |
| 320 × 180, Erfassung für Einsatz, Standard | 114 px | **63 %** | passt |
| 320 × 180, Erfassung für Einsatz, Feld | 127 px | **71 %** | passt |

Bei 180 px steht „Weiter →“ in eigener, 186 px breiter Zeile; seine rechte
Kante und der rechte Teil von „◐ Ansicht“ liegen außerhalb des Bilds. Die Seite
selbst rollt nicht seitlich (feste Leiste). Mit nur 160 bis 180 px über der Leiste
sind bis zu einem Feld im Bild mehrere Rollschritte nötig.

**Erwartung der Rolle:** Auch bei stark vergrößerter Darstellung bleibt die
Leiste im Bild und lässt Platz für das Formular.

**Auswirkung im Einsatz:** Wer die Darstellung wegen Handschuhen oder
schlechter Sicht auf 200 % stellt, hat das Formular in einem Streifen von einem
Drittel bis zur Hälfte des Bilds; „Weiter →“ ist erreichbar (Mitte im Bild),
sieht aber abgeschnitten aus. Ein Ausnahmefall, deshalb kein P1.

**Empfehlung:** Bei sehr schmalem Bild die Leiste einzeilig lassen
(„←“, „Weiter →“; „◐“ entfällt oder wandert in den Kopf) und in der Höhe
deckeln; bei sehr niedrigem Bild („Erfassung für Einsatz“) „In Einsatz
übernehmen“ nicht als eigene feste Zeile führen.

**Nachprüfung:** Browser-Zoom 200 % auf 360 × 640 und 320 × 568 sowie 640 × 360
im Standard- und Feld-Modus: Leiste höchstens ein Viertel der Bildhöhe, alle
Knöpfe vollständig im Bild.

### R6-G3 [P2] Einsatzansicht bei 200 % Schrift oder Zoom: Die Seite ist breiter als das Bild (483 statt 360 px), das Feld „Einsatzbeginn“ und die Leiste „◐ Ansicht“ laufen über (neu)

**Priorität:** P2

**Nachweis:** gemessen; die Wirkung auf einem echten Gerät (Verkleinern oder
seitliches Rollen) ist Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht („Hochwasser Musterstadt“ öffnen), Block
„Einsatz verwalten“ am Seitenende (y rund 6 400 bei 4 300 px Seitenhöhe im
Standard) und feste Leiste „◐ Ansicht“. Code: `src/app/lagemonitor-ui.tsx`
(um Zeile 235, `type="datetime-local"`), `src/app/einsaetze-ui.tsx`
(`anzeige-balken`, um Zeile 2116). Dieselbe Beobachtung steht als Rohnotiz N7 in
[mobile-ui.md](mobile-ui.md).

**Beobachtung:** `scrollWidth` der Seite:

| Ansicht | Bild (CSS-px) | `scrollWidth` | Auslöser |
| --- | --- | --- | --- |
| 360 × 640, Standard, 200 % Schrift | 360 | **483** | Label „Einsatzbeginn“ und Feld 465 px, Leiste „◐ Ansicht: Standard“ 435 px |
| 320 × 568, Standard, 200 % Schrift | 320 | **483** | wie oben |
| 320 × 568, Feld, 200 % Schrift | 320 | **485** | wie oben |
| Browser-Zoom 200 %, 180 × 320 | 180 | **288** | Feld 272 px, Leiste 264 px |
| 640 × 360, 200 % Schrift | 640 | 640 | kein Überlauf |
| 100 %, alle Viewports | 320–640 | = Bild | kein Überlauf |

Bei 483 px Breite ist `window.innerWidth` 483 statt 360; das Layout steht also
auf einer breiteren Fläche, die feste Leiste ist 483 px breit. Im Feld-Modus bei
320 px stand das Bild nach dem Öffnen der Einsatzansicht seitlich
verschoben, die Karten stießen links an den Rand (Screenshot
`f11-klein-true-true-1.png`), und „Einheit manuell erfassen…“ ließ sich in
diesem Lauf nicht antippen (Ursache nicht gesichert, Lauf unter Last). Im Assistenten gibt es den Überlauf nicht (`scrollWidth` gleich Bild; die
Übersichtstabellen rollen im eigenen Rahmen, siehe R6-G9).

**Erwartung der Rolle:** Die Einsatzansicht passt bei großer Schrift in die
Breite und rollt nur senkrecht.

**Auswirkung im Einsatz:** Auf einem echten Telefon läuft die Seite seitlich
über. Je nach Browser wird die Seite auf 75 % verkleinert (dann sind aus 44 px
Zielen 33 px geworden) oder sie lässt sich seitlich verschieben, und die
Leiste mit der Hauptaktion sitzt halb außerhalb. In dieser Ansicht arbeitet
der Meldekopf.

**Empfehlung:** Das Zeitfeld und die Leiste unter großer Schrift auf die
Bildbreite deckeln (Umbruch, Feld in voller Breite statt Mindestbreite); die
Prüfung „`scrollWidth` gleich Bildbreite“ auf die Einsatzansicht ausdehnen.

**Nachprüfung:** Einsatzansicht bei 320 und 360 px, Standard und Feld, 200 %
Schrift und Browser-Zoom 200 %: `scrollWidth` gleich Bildbreite,
`innerWidth` gleich Bildbreite, Leiste vollständig im Bild.

### R6-G4 [P2] Musterung: „Alle abwählen“ springt beim Tipp um 33 px nach oben, der Nachtipp an derselben Stelle hakt die Führungskraft an (neu, Nebenwirkung von R5-H1)

**Priorität:** P2

**Nachweis:** gemessen und beobachtet (360 × 640, Standard, Vorlage mit 38 Personen).

**Fundstelle / Aufgabe:** Startseite → Vorlage „Mein OV“ → „Einsatz vorbereiten“
(Musterung), klebende Kopfzeile „Personal (n/38)“ mit „Alle abwählen“. Code:
`src/app/vorlagen-ui.tsx` (um Zeile 460 bis 475; der Knopf wechselt zwischen
„Alle abwählen“ und „Alle anhaken“). Nachbarn: R6-H4 und R6-H5 in
[feldtauglichkeit.md](feldtauglichkeit.md).

**Beobachtung:** Der Knopf steht vor dem Tipp bei y 250 (121 × 44 px, x 206),
direkt darunter die Zeile „Sandra Otto“ (F, Zugführerin). Nach dem Tipp
(„Personal (0/38)“) heißt er „Alle anhaken“ (113 × 44 px) und liegt bei y 217,
**33 px höher**; an der alten Stelle liegt jetzt die Zeile „Sandra Otto“.
Zweiter Tipp auf die alte Stelle nach 300 ms und nach 800 ms: „Personal (1/38)“,
Sandra Otto ist angehakt, „Bogen anlegen“ zählt „1 Pers“. Ein dritter Tipp
nimmt sie wieder heraus („0/38“). Die Zeilen sind als Ganzes Ziel (294 × 64 px,
ohne Lücke).

**Erwartung der Rolle:** Wer unsicher ist, ob „Alle abwählen“ ankam, und
nachtippt, bekommt höchstens „Alle anhaken“. Der Knopf bleibt an seinem Platz.

**Auswirkung im Einsatz:** Der Helfer will eine Gruppe aus 38 Personen auf acht
reduzieren, tippt zweimal und hat plötzlich die Führungskraft allein
angehakt. Die Zahl in der Kopfzeile und auf „Bogen anlegen“ zeigt es, aber
nur, wenn er hinsieht. Rückholbar mit einem Tipp, daher P2.

**Empfehlung:** Die Kopfzeile nach dem Umschalten nicht verschieben (feste
Höhe, kein Nachrücken beim Abstreichen der Zeilen) und die Stelle nach dem
Umschalten 1,5 s sperren wie bei „Abrücken“ (`ortSperren`).

**Nachprüfung:** „Alle abwählen“ zweimal im Abstand von 300 und 800 ms antippen:
Es steht „0/38“ und der Knopf „Alle anhaken“ an derselben Stelle; kein Haken
bei Sandra Otto.

### R6-G5 [P3] Kurz-Liste: Die verschobene Person verlässt den Finger; nach Ende der Sperre schiebt der Tipp an derselben Stelle die andere Person zurück (Rest von R5-G4)

**Priorität:** P3

**Nachweis:** gemessen und beobachtet (360 × 640, Standard, 38 Personen).

**Fundstelle / Aufgabe:** Schritt 3 → Kurz-Liste, „▼“ je Person. Code:
`src/app/schritte/personal.tsx` (`personVerschieben`, um Zeile 961).

**Beobachtung:** „▼“ bei Person 4 (Peters) vertauscht Peters und Schmidt. Die
Ansicht rollt nicht mit (`scrollY` 1 300 vorher und nachher): Peters steht
198 px tiefer, an der Fingerstelle liegt jetzt Schmidts „▼“. Der Fokus folgt
Peters (Beschriftung „Person 5 nach unten“, y 392). Der Nachtipp nach 700 ms
zeigt „Einen Moment …“ über dem Finger und einen gestrichelten Rahmen am Knopf,
die Reihenfolge bleibt (das hält). Ein Tipp nach rund 1,4 s (Sperre abgelaufen)
tauscht Schmidt und Peters zurück: Peters steht wieder an Platz 4.

**Erwartung der Rolle:** Wer „▼“ ein zweites Mal tippt, will dieselbe Person
weiter nach unten schieben und nicht die andere zurücktauschen.

**Auswirkung im Einsatz:** Ein Helfer, der Peters um zwei Plätze verschieben
will und nach einer Sekunde nachtippt, wartet nicht die 1,5 s ab und
verschiebt ihn nicht weiter; wer nach 1,6 s tippt, macht den ersten Schritt
rückgängig. Reihenfolge ist in der Stärkemeldung nachrangig, kein Datenverlust.

**Empfehlung:** Nach dem Verschieben so rollen, dass die verschobene Person an
der Fingerstelle bleibt (die Knopfreihe der Person unter dem Finger).

**Nachprüfung:** „▼“ bei Person 4 dreimal im Abstand von 1,8 s: Person 4 steht
danach an Platz 7, ohne dass der Finger die Stelle wechselt.

### R6-G6 [P3] Reihen ohne Lücke: Schrittleiste (6 Ziele, 44 bis 53 px breit), Moduswahl der Einsatzansicht, im Feld-Modus nicht größer (Rest von R5-G7)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Schrittleiste „1 . Einheit … 6 . Übersicht“ im Assistenten;
Moduswahl „Standard / Feld / Dunkel / Nacht“ im Kopf der Einsatzansicht.

**Beobachtung:** Schrittleiste, Hochformat: 72/53/53/53/53/44 px breit (360,
Standard), 0 px Lücke, 44 px hoch (Feld 49 px, 74/51/51/51/51/44 px breit). Der
sechste Reiter ist in jedem Hochformat 44 px breit; bei Browser-Zoom 44 px für
fünf Reiter. Im Feld-Modus sind die Reiter nicht breiter als im Standard (nur 5
px höher). Bei 200 % Schrift scrollt die Leiste in ihrem Rahmen
(`scrollWidth` 326 bei Rahmen 296 bzw. 274 bei 148). Quer (640 px): 8 px Lücke
(gehalten). Moduswahl der Einsatzansicht: 77/100/67/75 × 46 px, 0 px Lücke
(mit Zweckzeile „große Tasten“ usw.).

**Erwartung der Rolle:** Nebeneinander liegende Ziele mit Lücke, im Feld-Modus
größer.

**Auswirkung im Einsatz:** Ein breiter Handschuhfinger trifft zwei Reiter
zugleich; der Fehltipp springt zu Schritt n ± 1 (rückholbar), bei der
Moduswahl wechselt er die Darstellung (rückholbar). Kein Datenverlust.

**Empfehlung:** Im Feld-Modus die Reiter der Schrittleiste auf 2 Zeilen oder
auf nur den aktuellen Schritt mit „‹ ›“ umstellen; sonst die Lücke von 2 px
beibehalten und die Breite des sechsten Reiters anheben.

**Nachprüfung:** Schrittleiste bei 320 und 360 px, Feld-Modus: jedes Ziel
mindestens 48 px breit oder 8 px Lücke.

### R6-G7 [P3] Einsatzansicht: Fester Balken „◐ Ansicht“ (57 px) und Daumen-Quittung (65 px) verdecken zusammen 21 % (hoch) und 37 % (quer) des Bilds

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht, nach „Abrücken“ einer Einheit. Code:
`src/app/einsaetze-ui.tsx` (`anzeige-balken`, um Zeile 2116),
`src/app/daumen-quittung.tsx`. Verweis: R6-S5 in
[stress-und-unterbrechung.md](stress-und-unterbrechung.md) (Wahl der Leiste),
Rohnotiz N9 in [mobile-ui.md](mobile-ui.md).

**Beobachtung:** Balken 57 px hoch (y 583 bis 640 bei 640, 303 bis 360 quer),
darin ein 170 × 44 px großer Knopf „◐ Ansicht: Standard“ bei x 12, y 590. Die
Quittung 336 × 65 px (hoch y 506 bis 571; quer 616 × 65, y 226 bis 291), 12 px
über dem Balken. Zusammen 134 px: 21 % bei 640, 24 % bei 568, **37 % bei 360**
Bildhöhe. Über dem Balken bleibt in der Quer-Ansicht ein Streifen von 226 px für
die aufgeklappte Karte samt Knopfreihe. Die Quittung selbst ist gut: Folge vorn,
„Rückgängig“ 123 × 44 px, „✕“ 44 × 44 px, 12 px Lücke.

**Erwartung der Rolle:** Die Hauptsache (Liste, aufgeklappte Karte) hat mehr
Platz als die Nebenbedienung.

**Auswirkung im Einsatz:** Quer wird das Aufklappen und Abrücken mehrerer Karten
ein Rollen von Stücken von je 226 px. Kein Fehlgriffrisiko.

**Empfehlung:** Den Balken quer in den Kopf (der Schalter steht dort ohnehin
einmal) oder ohne eigene Zeile an die Quittung anlehnen.

**Nachprüfung:** 640 × 360: nach „Abrücken“ mindestens die Hälfte der Bildhöhe
frei.

### R6-G8 [P3] Kurz-Liste: „✕“ (Person entfernen) ist ein kleines rotes Zeichen ohne sichtbares Ziel, „⇑“ sagt nicht, was es tut (Risiko)

**Priorität:** P3

**Nachweis:** gemessen (Ziel 44 × 44 px bei x 283) und beobachtet (Zeichen); die
Fehlbedienung ist Risiko.

**Fundstelle / Aufgabe:** Schritt 3 → Kurz-Liste. Code: `src/app/schritte/personal.tsx`,
`index.html` (Regeln der Kurz-Liste).

**Beobachtung:** „▲“, „▼“ und „⇑“ tragen sichtbare Rahmen (44 × 44 px), „✕“ ist ein
etwa 12 px großes rotes Kreuz ohne Rahmen; sein Ziel (44 × 44 px) ist nicht zu
sehen. „⇑“ (nach ganz oben) ist ohne Beschriftung ein kleines Doppelpfeil-Zeichen
(Name nur im Baum: „Person 5 nach ganz oben“). Die Rückfrage („Peters, Dominik
entfernen?“, „Person entfernen“ rot, „Abbrechen“) ist gut und getrennt.

**Erwartung der Rolle:** Der Knopf, der löscht, sieht aus wie ein Knopf.

**Auswirkung im Einsatz:** Ein Handschuhfinger sucht das Ziel; ein Tipp daneben
trifft kein Ziel. Das Löschen selbst ist durch die Rückfrage abgesichert.

**Empfehlung:** „✕“ mit Rahmen wie die Nachbarn; „⇑“ mit „nach oben“ oder
Tooltip.

**Nachprüfung:** Kurz-Liste: Alle vier Ziele tragen einen sichtbaren Rahmen.

### R6-G9 [P3] Übersicht (Schritt 6): Die Tabellen rollen seitlich im eigenen Rahmen, bei 320 px sind 286 von 456 px sichtbar (Risiko)

**Priorität:** P3

**Nachweis:** gemessen (Rahmen `tabellen-scroll`, `overflow-x: auto`, 286 px
sichtbar, 456 px breit bei Personal, 524 bei Fahrzeugen); Wischen nicht prüfbar.

**Fundstelle / Aufgabe:** Schritt 6 „Übersicht“, Tabellen „Personal“
(ROLLE / FUNKTION / ZUSATZFUNKTION / NAME, VORNAME / ERREICHBARKEIT) und
„Fahrzeuge“. Code: `index.html` (`.tabellen-scroll`, um Zeile 2357).

**Beobachtung:** Bei 320 px fallen Namen und Erreichbarkeit hinter den Rand; nur
Wischen bringt sie ins Bild.

**Erwartung der Rolle:** Ohne Wischen lesen können.

**Auswirkung im Einsatz:** Das Lesen der Übersicht (Kontrolle vor der Übergabe)
verlangt eine Wischgeste, die mit Handschuh unsicher ist. Aufgaben im Formular
bleiben bedienbar.

**Empfehlung:** Auf schmalen Telefonen die Übersicht als gestapelte Zeilen wie die
Kurz-Liste.

**Nachprüfung:** 320 px: alle Spalten ohne seitliches Rollen lesbar.

## Verweise auf andere Runde-6-Berichte

Unabhängig beobachtet, dort zuerst beschrieben, hier nicht gezählt:

- **R6-H4 und R6-H5** ([feldtauglichkeit.md](feldtauglichkeit.md)): klebende
  Kopfzeile der Musterung nimmt bei 320 px 93 px, bei 200 % 238 px; zwei
  abgewählte Gruppen legen einen Bogen mit 0 Personen an. Hier nicht
  nachgemessen.
- **R6-H1** ([feldtauglichkeit.md](feldtauglichkeit.md)): „Einen Moment …“ liegt im
  QR-Vollbild hinter dem Vollbild. Hier nicht nachgemessen; ich habe nur den Teilwechsel
  geprüft, nicht die Pille.
- **R6-S5** ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)): Die Wahl
  der festen Leiste öffnet sich über der Hauptaktion. Hier: Die Wahl
  (84 × 58 bis 60 px) liegt über der Leiste und ist bedienbar.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Kurz-Liste, feste Plätze:** „▲ ▼ ⇑“ je 44 × 44 px bei x 33, 89, 145 (12 px
  Lücke), „✕“ bei x 283 (Standard, 360 px); Feld 54 × 54 px, Zeile 237 px;
  200 % Schrift 50 × 88 px, Zeile 395 px. Keine Überlappung von „⇑“ und „✕“ bei
  360, 320 oder 640 px, auch nicht im Feld-Modus und bei 200 %. Zeile 197 bis
  198 px hoch, 38 Personen 8 826 px Seitenhöhe. Bei 320 px/Feld bricht „⇑“ in die
  nächste Zeile (Zeile 302 px).
- **Person entfernen:** „✕“ führt immer in die Rückfrage mit Namen; „Person
  entfernen“ und „Abbrechen“ stehen groß und getrennt.
- **Nachtipp-Sperre mit Rückmeldung:** „▼“ (Pille „Einen Moment …“, gestrichelter
  Rahmen), „Abrücken“ (120, 300, 600, 1 200 ms: Zustand bleibt „abgerückt“, die
  Quittung bleibt; 1 800 ms im Lauf unter Last nicht sicher auswertbar), „Weiter
  zu Teil 2 →“ im QR-Vollbild (150, 600, 1 200 ms: „Teil 2 von 7“, 1 700 ms:
  „Teil 3 von 7“).
- **QR-Vollbild:** „Weiter zu Teil 2 →“ 276 × 44 px (Feld, 320 px, 200 %: 234 × 52),
  „Schließen“ 111 × 44 px bei y 567, quer neben dem Code (Code füllt die Höhe),
  bei 320 × 568/Feld/200 % bedienbar; der Code ist 328 px breit.
- **Abstand „In Einsatz übernehmen“ zu „Weiter →“:** 16 px (360 × 640 Standard,
  320 Standard), 16 px (360 Standard 200 %), 15 px (360 Feld), 14 px (360 Feld
  200 %), 17 px (320 Standard 200 %), 15 px (320 Feld, 100 %). Quer steht es
  zwischen „◐“ und „Weiter →“ mit 26 bis 55 px Lücke. In der Lücke zwischen
  den Zeilen liegt kein Ziel.
- **Daumen-Quittung:** „Abgerückt 11:20: Nr. 6 …“ 336 × 65 px mit „Rückgängig“
  (123 × 44 px) und „✕“ (44 × 44 px), 12 px auseinander; die Handlung steht vorn,
  der Name wird gekürzt; die Leiste steht 12 px über dem Balken.
- **Knopfreihen der Einheitenkarte** („Zuklappen“, „Details“, „Bogen als PDF“,
  „Abrücken“, „Zug zuordnen“, „Auftrag/Notiz“, „Mehr…“): 44 px hoch, 8 px Lücke;
  die zugeklappte Karte ist als Ganzes ein Ziel (294 × 112 bis 162 px). Nach
  „Abrücken“ steht „Wieder anwesend“ an der Stelle von „Abrücken“ (Ortssperre
  fängt den Nachtipp).
- **Moduswahl über „◐“:** vier Segmente 84 × 58 bis 60 px mit Zweckzeile
  („große Tasten“, „abends“, „gedimmt“) über der Leiste; bei 320 px/200 % 66 bis
  68 × 101 px.
- **Fußleisten-Raster ohne Überdeckung** bei 360 und 640 px in den Schritten 1 bis
  4 (Standard, Feld, 100 % und 200 %): „←“ und „◐“ 12 px auseinander,
  „Weiter →“ endet bei Bildbreite − 16 bis − 18 px.
- **Musterung:** Zeilen 294 × 64 px (ganze Zeile ist Ziel), Zähler „Personal
  (n/38)“, „Bogen anlegen · n Pers · n Fz“ als Fußknopf 328 × 44 px.
- **Keine Pflichtgesten** in den geprüften Abläufen (Wischen nur zum Lesen
  breiter Tabellen, R6-G9).

## Abschluss

- **Aufgabe geschafft:** ja. Mit Umwegen bei 320 px im Feld-Modus (Leiste,
  R6-G1) und bei großer Schrift in der Einsatzansicht (R6-G3).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „◐ Ansicht“ und „Weiter →“ sehen nebeneinander
  aus, sind aber überlagert; wer das Wort „Ansicht“ trifft, kann ungewollt
  weiterblättern (R6-G1).
- **Größtes Einsatzrisiko:** Die Einsatzansicht, in der der Meldekopf arbeitet,
  läuft bei 200 % Schrift seitlich über (R6-G3).
- **Top-Priorität für die nächste Iteration:** Die Fußleiste des Assistenten bei
  320 px und 200 % ohne Überdeckung rechnen (R6-G1, R6-G2), danach die Breite
  der Einsatzansicht deckeln (R6-G3).

## Abgleich mit Runde 5

Grundlage: [../runde-5/handschuh-bedienung.md](../runde-5/handschuh-bedienung.md)
mit „Stand der Behebung“ und [../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Tabelle | Bewertung Runde 6 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R5-G1 QR-Vollbild: Doppeltipp überspringt einen Teil (P2) | behoben | **hält** | 7-teiliger Code: 150, 600, 1 200 ms → „Teil 2 von 7“, 1 700 ms → „Teil 3 von 7“; 320/Feld/200 % bei 600 ms ebenfalls „Teil 2“. Die Rückmeldung selbst liegt laut R6-H1 hinter dem Vollbild. |
| R5-G2 Kurz-Liste: „✕“ über „⇑“ (P2) | behoben | **hält** | Keine Überlappung in 360/320/640 px, Standard und Feld, 100 % und 200 %; 12 px Lücke zwischen „▲ ▼ ⇑“; Zeile 197 px (Feld 237, 200 % 395). Dafür ist die Seite lang (R6-H3) und „✕“ ohne sichtbares Ziel (R6-G8). |
| R5-G3 „In Einsatz übernehmen“ nur 10 px über „Weiter →“ (P2) | behoben | **hält** | 14 bis 17 px in den gemessenen Kombinationen (360/320 Standard und Feld, 100 % und 200 %), quer nebeneinander. 320/Feld/200 % und Zoom im Hochformat nicht gemessen. |
| R5-G4 Sortierknöpfe wechseln die Stelle, Doppeltipp schiebt zurück (P3) | behoben | **hält nur teilweise** | Plätze fest (hält); Nachtipp bis rund 1,2 s verworfen mit „Einen Moment …“ (hält). Die Person verlässt aber weiter die Fingerstelle (Ansicht rollt nicht mit), und ein Tipp nach der Sperre schiebt die andere Person zurück (R6-G5). |
| R5-G5 Verworfener Tipp ohne Rückmeldung (P3) | behoben | **hält** | Pille „Einen Moment …“ und gestrichelter Rahmen beobachtet (Kurz-Liste „▼“). Im QR-Vollbild nach R6-H1 nicht sichtbar. |
| R5-G6 Quer 200 %: kein Feld im Bild, „6 . Übersicht“ außerhalb (P3) | teilweise behoben | **hält (Schrittleiste), Feld nicht nachgemessen** | 640 × 360, 200 %: sechster Reiter bei x 467 bis 511, Leiste ohne Rollbedarf (`scrollWidth` 576 gleich Rahmen). Das erste Feld im Bild habe ich nicht nachgemessen. |
| R5-G7 Schalterreihen ohne Lücke (P3) | teilweise behoben | **hält nur teilweise** | Hochformat weiter 0 px Lücke (44 bis 53 px breit, sechster 44 px), quer 8 px. Die Moduswahl der Einsatzansicht trägt die Zweckzeile, Lücke 0 px (R6-G6). |
| R5-L1 (Verweis) fester „◐“ der Einsatzansicht deckt Text | behoben (anderer Bericht) | **hält, mit Nebenwirkung** | Die feste Leiste „◐ Ansicht: Standard“ (170 × 44 px) steht in eigenem Balken (57 px) und deckt keinen Text mehr; sie nimmt aber mit der Quittung 21 bis 37 % der Höhe (R6-G7). |
| R5-N4 Wort „Ansicht“ in der Fußleiste (anderer Bericht) | behoben | **ins Gegenteil verkehrt (Nebenwirkung)** | „◐ Ansicht“ wird 106 bis 142 px breit und liegt bei 320 px/Feld, in Schritt 5 und bei 200 % unter „Weiter →“ bzw. „Zur Übersicht →“ (R6-G1). |
| R5-H1 „Alle abwählen“ in der Musterung (anderer Bericht) | behoben | **hält, mit Nebenwirkung** | Zähler und Umschalter arbeiten (38 → 0/38 → anhaken); der Knopf springt dabei um 33 px, der Nachtipp hakt die Führungskraft an (R6-G4). |
| „Kein seitlicher Seitenversatz“ (Bestätigtes Runde 5) | – | **gilt nicht für die Einsatzansicht bei 200 %** | Assistent: `scrollWidth` gleich Bild. Einsatzansicht, 200 % Schrift: 483 px bei 360/320 px Bild (R6-G3). |
| „Fußleisten-Raster: kein Überlauf, keine dritte Zeile“ (Bestätigtes Runde 5) | – | **hält nur teilweise** | Zeilen und rechter Rand stimmen (360/640 px), aber „◐ Ansicht“ wird überdeckt (R6-G1) und bei Browser-Zoom 200 % stehen drei Zeilen und die Leiste füllt 44 bis 71 % (R6-G2). |
| Daumen-Quittung, „Abrücken“ gegen Nachtipp (Bestätigtes Runde 5) | – | **hält** | Quittung 336 × 65 px, „Rückgängig“ 123 × 44 px; Nachtipp 120 bis 1 200 ms ohne Wirkung. |
| Knopfreihen der Einheitenkarte, QR-Vollbild, Rückfragen (Bestätigtes Runde 5) | – | **hält** | 44 px hoch, 8 px Lücke; „Weiter zu Teil 2 →“ 276 × 44 px, „Schließen“ 111 × 44 px; „Person entfernen“ als Rückfrage. |

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 4 behoben, 3 teilweise, 2 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-G1 | behoben | Das Raster der Fußleiste schrumpft die Primärspalte nicht mehr; das Wort „Ansicht“ und „Zur“ in „Zur Übersicht →“ entfallen bei Enge. Gemessen: 3 Breiten × Standard/Feld × 100 %/200 % × Schritt 3 und 5, keine Überlappung, kein Überlauf. |
| R6-G2 | teilweise | Bei Browser-Zoom 200 % bleiben alle Knöpfe im Bild, die Leiste hat zwei Zeilen (40–51 % der Bildhöhe in der Nachbildung statt 44–71 %); mit 44-px-Zielen ist ein Viertel nicht erreichbar. |
| R6-G3 | behoben | Das Zeitfeld und die Felder des Monitor-Blocks bleiben in der Bildbreite; `scrollWidth` gleich Bildbreite bei 320/360/640 px, 200 % Schrift und Zoom. |
| R6-G4 | behoben | Der Umschalter der Musterung behält seine Breite, die Stelle sperrt 1,5 s. Die Sprunghöhe der Kopfzeile ist nicht nachgemessen. |
| R6-G5 | teilweise | Nach dem Verschieben rollt die Ansicht um die Strecke mit, sodass die Knopfreihe der Person an der Fingerstelle bleibt. Nur im Quelltext belegt, nicht im Browser. |
| R6-G6 | offen | Die Reiter der Schrittleiste teilen bei Enge die Breite (41–50 px); die Lücke und eine größere Reiterbreite im Feld-Modus fehlen. |
| R6-G7 | teilweise | Im Querformat wird der Balken zur Ecke; im Hochformat verdecken Balken und Quittung unverändert zusammen etwa ein Fünftel. |
| R6-G8 | behoben | Das ✕ der Kurz-Liste trägt einen sichtbaren Rahmen wie die Nachbarn. |
| R6-G9 | offen | Die Tabellen der Übersicht rollen weiter seitlich; eine gestapelte Darstellung wie die Kurz-Liste steht aus. |
