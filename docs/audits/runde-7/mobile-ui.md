# Audit „Mobile UI", Runde 7 (Darstellung und Bedienung auf dem Telefon)

Stand: 23.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Bericht prüft nach, was
[Runde 6](../runde-6/mobile-ui.md) samt „Stand der Behebung" festgestellt und
Runde 6 an Fußleiste, Zwei-Fenster-Warnung, Zurück-Verlauf, Lagemonitor,
Rückfragen, Offline-Zeile und Deckel bei großer Schrift geändert hat.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, jeder Lauf in einem
eigenen Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten. Der
Server wurde weder neu gebaut noch angefasst. Viewports: 360 × 640 (Grundlage),
320 × 568, 640 × 360 (quer), Tablet 820 × 1180 und 1180 × 820, Zoom-Nachbildung
180 × 320 (Layout-Pixel bei Skalierung 4). Jeweils bei 100 % und mit
`html { font-size: 200% }`; zusätzlich Feld-Modus (`eeb.anzeigemodus.v1` =
`feld`).

Zustände kamen aus `localStorage`-Seeds, alle mit `uebung: false` und Stand auf
heute: `eeb.entwurf.v1` (THW Oldenburg, Verstärkter Bergungszug, 38 Personen),
`eeb.einsaetze.v1` (Sammlung „Hochwasser Musterstadt", 6 Meldungen) und
`eeb.uhr.v1` (Uhrstand 100 Tage vor und nach heute).

Durchlaufen habe ich: Startseite (mit Entwurf, mit Sammlung), Assistent
Schritt 1–6 mit Fußleiste und Tab-Durchlauf (Fokus verdeckt?), Einsatzansicht
als Karten und Tabelle, „Einheit manuell erfassen…" (Erfassungsleiste),
Zwei-Fenster-Konflikt (zweite Seite im selben Kontext ändert den Entwurf),
Lagemonitor-Adresse `?lagemonitor=<id>` am Telefon, Browser-Zurück über
Startseite, Einsatz und Assistent, Offline-Umschaltung (`setOffline`), Ansicht-
Wahl, Tablet-Assistent und Einsatzansicht.

Gemessen habe ich `scrollWidth` gegen `innerWidth`, Lage und Höhe fester Leisten,
die Ränder der Fußleisten-Knöpfe (Überlappung), Oberkante von „Fortsetzen",
Spaltenmaße der Tabelle, Höhe und Knopflage der Warnleiste und Zielgrößen
(Breite, Höhe, Abstand). Jede Aussage zu Lage und Größe habe ich am Screenshot
gegengeprüft.

Reihenfolge: Ich habe zuerst getestet und den Bericht aus Runde 6 erst danach
gelesen. Skripte und Screenshots liegen außerhalb des Repositorys im Scratchpad
(`.../scratchpad/runde7/m/`).

**Prioritäten:** Der Skill verwendet Critical / High / Medium / Low; abgebildet
auf P0 / P1 / P2 / P3.

**Kennzeichnung:**
- *gemessen*: im Testbrowser mit Zahlen reproduziert;
- *beobachtet*: im Testbrowser gesehen, ohne eigene Messreihe;
- *Risiko*: aus Code oder CSS abgeleitet, nicht nachgestellt.

**Nicht prüfbar / nicht erreicht:**
- echte Geräte mit Systemschrift (die 200 % sind `html { font-size: 200% }`),
  echte Bildschirmtastatur, Browserleisten (`vh`/`dvh`), Safe-Area-Einsätze
  (`env()` ist im Testbrowser 0), WebKit/Safari, Kamera, Handschuhe, Licht;
- die Geräteuhr-Rückfrage: Mit Uhrstand 100 Tage voraus und 100 Tage zurück
  erschien auf der Startseite keine Rückfrage und keine Leiste (ohne Fristen,
  die davon abhängen, wohl erwartungsgemäß); die Darstellung der Rückfrage habe
  ich daher nicht gesehen;
- die Rückfragen zum Papier-Abgleich (Namensabgleich bei Nacherfassung) und der
  Exportstand: Ich habe sie nicht ausgelöst; vom Exportstand sah ich nur den
  Schalter „Nur neue Bögen seit dem letzten Export" in der Einsatzansicht, ohne
  Überlauf.

## Urteil

Die Umbauten aus Runde 6 halten im Kern. Gemessen in sieben Lagen (320 und 360
bei 100 %, Feld, 200 % und beidem) überlappt die Fußleiste des Assistenten nie
mehr: Die Knöpfe „←", „◐" und der Primärknopf stehen mit 12 bis 24 px Abstand
nebeneinander, auch in Schritt 5 mit „Zur Übersicht →"; die Schrittleiste zeigt
bei 200 % alle sechs Reiter. Die Einsatzansicht ist bei 200 % gerätebreit, der
Lagemonitor-Block verbreitert sie nicht mehr. „Fortsetzen" liegt bei 200 % im
ersten Bild. Die Zwei-Fenster-Warnung ist auf die Hälfte des Fensters gedeckelt.
Der Zurück-Verlauf ist stimmig, die Offline-Zeile benennt ihren Stand.

Zwei Dinge sind nicht erledigt. Erstens bricht „Bedarf:" in der Einsatzansicht
weiter im Wort, bei 200 % steht es Buchstabe für Buchstabe untereinander und der
Block wird 288 px hoch (R7-M1). Zweitens ist die gedeckelte Warnleiste bei 200 %
zwar nicht mehr höher als das Fenster, aber ihre Entscheidungsknöpfe liegen
erst nach Rollen *in* der Leiste im Bild (R7-M2). Dazu kommen sechs kleine
Stellen, vor allem bei starkem Zoom und am Kopf des Assistenten.

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt in allen
geprüften Lagen. Die Befunde sind 0 × P0, 0 × P1, 2 × P2, 6 × P3.

## Befunde

### R7-M1 [P2] „Bedarf:" bricht in der Einsatzansicht im Wort; bei 200 % Schrift steht es Buchstabe für Buchstabe untereinander (Rest aus Runde 6, dort nur als Verweis)

**Priorität:** P2

**Kennzeichnung:** gemessen, im Screenshot beobachtet.

**Fundstelle:** Einsatzansicht, aufklappbare Zeile „Bedarf: Verpflegung … ·
Unterbringung … · Diesel … · Ruhezeit …" (eine `summary` mit `<strong>` und
Text, vermutlich als Flex-Zeile; Quelle in `src/app/einsaetze-ui.tsx`). Runde 6
führt den Fehler als Verweis ([neuer-nutzer.md](../runde-6/neuer-nutzer.md),
[nacht-und-sicht.md](../runde-6/nacht-und-sicht.md),
[fehler-und-wiederanlauf.md](../runde-6/fehler-und-wiederanlauf.md)); im
Stand der Behebung dort ist er hier nicht behoben.

**Beobachtung:** Maß des Worts „Bedarf:" (Breite × Höhe):

| Lage | Maß | Anzeige |
| --- | --- | --- |
| 360 × 640, 100 % | 33 × 48 px | „Bed / arf:" in zwei Zeilen, klebt an „Verpflegung" |
| 320 × 568, 100 % | 28 × 72 px | drei Zeilen |
| 360 × 640, 200 % | 30 × 288 px | „B / e / d / a / rf / :", jede Silbe eine Zeile |
| 320 × 568, 200 % | 26 × 288 px | ebenso |

Bei 200 % ist die Zeile samt Zusammenfassung etwa 320 px hoch und damit halb so
hoch wie das Fenster; der Text daneben läuft in einer schmalen Spalte (Screenshot
`j-bedarf-G.png`). Die Seite ist bei 200 % 12 336 px hoch (360 × 640).

**Erwartung der Rolle:** Ein Wort bricht nie im Wort; die Beschriftung steht über
oder in einer eigenen Zeile vor dem Text.

**Folge:** Die Bedarfszeile ist die erste Zahl für Verpflegung, Unterbringung
und Kraftstoff am Meldekopf; bei großer Schrift ist sie kaum lesbar und
verschiebt alles darunter um ein Bild.

**Empfehlung:** Beschriftung nicht schrumpfen lassen (eigene Zeile oder
`flex: none`), die Werte darunter umbrechen.

**Nachprüfung:** Einsatzansicht, 360 × 640 und 320 × 568, 100 % und 200 %: Breite
von „Bedarf:" gleich seiner Textbreite (höchstens eine Zeile hoch), Höhe der
Zeile höchstens 120 px bei 200 %.

### R7-M2 [P2] Warnleiste der zwei Fenster bei 200 %: gedeckelt, aber die Entscheidungsknöpfe liegen erst nach innerem Rollen im Bild; Schrift nicht gedeckelt (Rest von R6-M1)

**Priorität:** P2

**Kennzeichnung:** gemessen und im Screenshot beobachtet (`h-kleinG.png`).

**Fundstelle:** Feste Warnleiste `fenster-konflikt`
(`src/app/feste-warnung.tsx`), ausgelöst durch eine zweite Seite im selben
Kontext, die den Entwurf ändert.

**Beobachtung:** Höhe der Leiste, Höhe des Inhalts darin (`scrollHeight`) und Lage
der Knöpfe im Inhalt (Fensterhöhe in Klammern):

| Lage | Leiste | Inhalt | „Stand … laden" | „Meine Fassung behalten" | „Weniger" |
| --- | --- | --- | --- | --- | --- |
| 360 × 640, 100 % | 216 (34 %) | 215 | 138–211 | 138–211 | 47–91 |
| 360 × 640, 200 % | 320 (50 %) | 805 | 535–679 | 695–797 | 439–527 |
| 320 × 568, 200 % | 284 (50 %) | 870 | 600–744 | 760–862 | 504–592 |
| 640 × 360, 100 % | 53 | 52 | nur „Entscheiden" (4–48) | – | – |
| 640 × 360, 200 % | 178 (49 %) | 177 | nur „Entscheiden" (81–169) | – | – |

Die Leiste ist also nicht mehr höher als das Fenster (Runde 6: 106 und 130 %).
Bei 200 % ist ihr Inhalt aber 805 bis 870 px hoch in einer Leiste von 284 bis
320 px; beide Knöpfe und auch „Weniger" liegen weiter unten als die Leiste hoch
ist. Man sieht beim Öffnen nur den Anfang des Satzes in 32 px Schrift (die
erste Zeile ist oben angeschnitten), keinen Knopf und keinen Hinweis, dass die
Leiste innen rollt. Die Seite darunter ist um die Leistenhöhe nach unten
geschoben; bei 320 × 568 bleiben neben Leiste (284) und Fußleiste (78) rund
200 px für Kopf und Formular.

Der Text nennt in der Klammer zwei Stände, die bei gleicher Minute gleich
aussehen („dort: … Stand 23.10.26, 17:44 Uhr … hier: … Stand 23.10.26, 17:44
Uhr"). Das ist ein Inhaltsthema ([stress-und-unterbrechung.md](../runde-6/stress-und-unterbrechung.md),
R6-S1).

**Erwartung der Rolle:** Bei jeder Schrift sind die zwei Entscheidungen im
ersten Bild der Leiste erreichbar; ein inneres Rollen zeigt sich durch einen
sichtbaren Rand oder Pfeil.

**Folge:** Bis entschieden ist, wird nichts gespeichert (Text der Warnung). Wer
bei großer Schrift nicht merkt, dass die Leiste rollt, arbeitet weiter und
verliert Eingaben. Der Fall ist selten (zwei Fenster, große Schrift), aber der
Text sagt selbst, dass Eingaben nicht gesichert werden.

**Empfehlung:** Kurztext und die beiden Knöpfe an den Anfang der Leiste, Details
dahinter einklappen (bei 200 % Schrift und Knopfmaß der Leiste in px deckeln wie
bei der Quittung).

**Nachprüfung:** Zwei-Fenster-Konflikt, 360 × 640 und 320 × 568, 200 %: beide
Knöpfe liegen ohne Rollen in der Leiste (`bottom` kleiner als Leistenhöhe).

### R7-M3 [P3] Zoom-Nachbildung 180 × 320: Kopf 51 %, Fußleiste 40 % der Höhe; „1 offen" läuft in den nächsten Reiter (Rest von R6-M7)

**Priorität:** P3

**Kennzeichnung:** gemessen in der Nachbildung (kleineres Fenster, kein echter
Zoom); echter Browser-Zoom ist Risiko.

**Fundstelle:** `header.seiten-kopf`, `footer.nav.assistent-nav`, Schrittleiste
`.schritte`.

**Beobachtung:** Schritt 3 bei 180 × 320: Kopf 162 px, Fußleiste 128 px (zwei
Zeilen: „Weiter →" voll breit, darunter „←" und „◐"). Zusammen 290 von 320 px;
im Bild bleibt eine Formularkante von rund 30 px (Screenshot `aa-zoom-s3.png`).
Der Knopf „Ansicht: Standard ▾" im Kopf bricht in zwei Zeilen und stößt an die
Schrittleiste; „1 offen" ist als „offe" abgeschnitten und liegt an „2 ✓". Kein
seitlicher Überlauf (`scrollWidth` 180).

**Erwartung der Rolle:** Bei starkem Zoom bleibt mindestens die Hälfte der Höhe
für das Formular.

**Folge:** Wer mit 200 % Zoom arbeitet, muss zuerst den Kopf wegrollen, und die
Fußleiste deckt danach ein Drittel des Bildes. Wenige Nutzer; die Seite ist
bedienbar.

**Empfehlung:** Unter etwa 240 px Breite die Fußleiste einzeilig (Symbole), den
Kopf auf Titel und Schrittleiste begrenzen.

**Nachprüfung:** 180 × 320, Schritt 1–5: Fußleiste höchstens 25 % der Höhe;
Schrittleiste ohne überlappenden Text.

### R7-M4 [P3] Tabellenansicht am Telefon: klebende Spalte „Einheit" 36 % des Rahmens; „Ges." liegt weit rechts (Rest von R6-M4, besser als in Runde 6)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle:** Einsatzansicht, Umschalter „Tabelle" (`.tabellen-scroll`).

**Beobachtung:** Rollrahmen 326 px (360 px), Tabelle 1 695 px breit. Spalte
„Einheit" 117 px (36 %), „Zug" 45 px, „F" ab 179 px, „M" 269–314 px, „Ges." ab
314 px, also gerade am Rand. Bei 320 px: 101 von 286 px (35 %), „Ges." ab 298 px.
Bei 200 % Schrift (360 px): „Einheit" 116 px, „Zug" 89 px, „F" ab 224 px, „Ges."
ab 491 px von 326 px Rahmen (Tabelle 3 223 px), quer bei 640 px: „Einheit" 228 px.
Gegenüber Runde 6 (200 %: „F" ab 370 px, klebende Spalte 53 %) ist es merklich
besser; nach dem Stand der Behebung ist an dieser Stelle nichts geändert worden,
den Wortbruch in Namen habe ich nicht nachgemessen.

**Folge:** Im ersten Bild stehen bei 200 % Name, Zug, F und U; „M" und „Ges."
liegen rechts. Die Karten zeigen alle Zahlen im ersten Bild.

**Empfehlung:** Die Spalte „Einheit" bei 200 % nicht kleben oder auf „Nr."
verkürzen.

**Nachprüfung:** 360 × 640, 200 %: rechte Kante von „M" kleiner als
Rahmenbreite.

### R7-M5 [P3] Kopf des Assistenten bei 200 % Schrift: Logo, „Ansicht"-Knopf und Schrittleiste drängen sich; Platzhalter abgeschnitten

**Priorität:** P3

**Kennzeichnung:** beobachtet im Screenshot (`l-s1-typ.png`), Maß gemessen.

**Fundstelle:** `header.seiten-kopf` im Assistenten, Schritt 1, 360 × 640 und
320 × 568, 200 %.

**Beobachtung:** Das Logo steht in einer eigenen Reihe unter „‹ Startseite", der
Knopf „Ansicht: Standard ▾" (rund 170 × 46 px) sitzt daneben und liegt auf der
Trennlinie zur Schrittleiste. Die Beschriftung „1 offen" ist abgeschnitten
(`scrollWidth` 58 gegen 48 px bei 360 px, 55 gegen 41 px bei 320 px, „L offer"
im Screenshot). Das Feld „Organisationsname" zeigt „meist leer – OV unten
eintrag…" abgeschnitten. Der Kopf ist rund 175 px hoch (27 % bei 640 px). Das
Feld „Einheitentyp" zeigt bei 200 % jetzt den Wert „Verstärkter Bergungszug"
vollständig (Runde 6: abgeschnitten).

**Folge:** Gering: Der Kopf ist unruhig, der abgeschnittene Reiter „1 offen" ist
das Einzige, was den Stand von Schritt 1 anzeigt.

**Empfehlung:** Bei großer Schrift Logo ausblenden und den Ansicht-Knopf in die
Titelzeile setzen; Reiter „1 offen" auf Ziffer plus Punkt verkürzen.

**Nachprüfung:** 360 × 640 und 320 × 568, 200 %: `scrollWidth` der Reiter
gleich `clientWidth`, Kopf höchstens 130 px.

### R7-M6 [P3] Lagemonitor am Telefon: Knöpfe 19 px, Aufklapper 12 px, Wortbruch „TH / W" (Fallback, wenn kein zweites Fenster aufgeht)

**Priorität:** P3

**Kennzeichnung:** gemessen (Größen) und beobachtet (Screenshot `r-open.png`).

**Fundstelle:** `?lagemonitor=<id>`, `src/app/lagemonitor-ui.tsx`. Der Code öffnet
den Monitor mit `window.open`; scheitert das (Popup-Sperre), wechselt dasselbe
Fenster in den Monitor (`window.location.assign`). Dann sieht das Telefon die
Ansicht für den Fernseher.

**Beobachtung:** Bei 360 × 640 und 320 × 568 sind „Gedimmt" 52 × 19, „Vollbild"
45 × 19 und „Schließen" 55 × 19 px groß, Abstand 4 px; die Aufklapper
„Einheiten", „Einsatzdaten" und „Optionen" sind 336 × 12 px. In der Tabelle
bricht die Spalte „Orga" als „TH / W" und „Materialwirtschaft" als
„Materialwirtscha / ft". Kein seitlicher Überlauf (360/360, 320/320, 640/640).
Quer (640 × 360) ist die Seite 478 px hoch und rollt. Das Datum steht groß im
Kopf, „letzte Meldung vor 1 Min" und „seit erster Meldung: 0 Stunden, 6
Minuten" sind lesbar.

**Erwartung der Rolle:** Auch eine Fernsehansicht auf dem Telefon hat einen
erreichbaren Weg hinaus („Schließen" mit Ziel von mindestens 44 px).

**Folge:** Wer den Monitor versehentlich im eigenen Fenster öffnet (Popup-Sperre),
muss ein 19 px hohes „Schließen" treffen oder den Browser-Zurück nehmen. Gering,
weil der Monitor für den Fernseher gedacht ist.

**Empfehlung:** Für schmale Fenster (unter 640 px) die Knöpfe auf 44 px bringen
und „Orga" ohne Wortbruch setzen.

**Nachprüfung:** Monitor-Adresse bei 360 × 640: Knopfhöhe mindestens 44 px, kein
Wortbruch in „Orga".

### R7-M7 [P3] Fußleiste Schritt 5: „◐ Ansicht" schrumpft auf 102 px und schneidet sein Wort ab; Beschriftung wechselt zwischen 320 und 360 px

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle:** `footer.nav.assistent-nav`, Schritt 5 mit „Zur Übersicht →".

**Beobachtung:** Bei 360 × 640 und 100 % ist „◐ Ansicht" in Schritt 1–4 106 px
breit (79–185), in Schritt 5 nur 102 px (79–181) und sein Text ist breiter als
der Knopf (`scrollWidth` größer als `clientWidth`). Der Primärknopf „Zur Übersicht
→" belegt 187–344. Bei 320 × 568 trägt der Knopf nur „◐" (79–116), bei 360 × 640
„◐ Ansicht". Die Überlappung aus Runde 6 (29–81 px) ist weg: In allen sieben
Lagen ist der Abstand zwischen „◐" und Primärknopf positiv (6 bis 24 px).

**Folge:** Gering. Der Knopf bleibt ganz tippbar (102 × 44 px); der Wechsel der
Beschriftung zwischen den Schritten und Breiten ist eine kleine Unruhe.

**Empfehlung:** Den Knopf in Schritt 5 gleich breit halten oder ab 360 px nur
„◐" zeigen.

**Nachprüfung:** 360 × 640, Schritt 1–5: gleiche Breite und kein abgeschnittener
Text im Knopf.

### R7-M8 [P3] Querformat: Ecken-Knopf „◐" der Einsatzansicht (63 × 52 px, fest) kann am rechten Rand Bedienelemente überdecken

**Priorität:** P3

**Kennzeichnung:** beobachtet (Screenshot `f-quer-b.png`), Größe gemessen.

**Fundstelle:** `.anzeige-balken` in der Einsatzansicht (Runde 6, R6-M8).

**Beobachtung:** Bei 640 × 360 ist der Balken zum Knopf in der Ecke geschrumpft
(63 × 52 px bei 100 %, 79 × 52 px bei 200 %), Oberkante 308. Das behebt den
16-%-Streifen aus Runde 6. Beim Rollen liegt der Knopf über dem rechten Rand
der Inhaltsspalte; im Screenshot deckt er das Auswahlfeld „Sortierung" teilweise
(Pfeil am rechten Rand). Auf dem Telefon hochkant bleibt der Balken 57 px hoch
(Unterkante 640) und nimmt bei 360 × 640 und 320 × 568 9–10 % der Höhe; unter der
Zwischenzeile „Einheit manuell erfassen…" liegt er im ersten Bild über etwa 40 %
des Knopfs (Playwright tippte bei der ersten Messung genau in den Balken; mit
vorherigem Heranrollen traf der Tipp).

**Folge:** Gering; der Knopf überdeckt beim Rollen kurz Randfelder, und die
zweite Aufnahmetaste liegt im ersten Bild halb unter dem Balken.

**Empfehlung:** Der Ecken-Knopf bekommt einen freien Randstreifen (Seitenrand
der Spalte), oder er rollt mit dem Kopf weg.

**Nachprüfung:** 640 × 360 und 360 × 640, Einsatzansicht: kein Bedienelement
liegt in Ruhe unter dem Knopf oder Balken.

### Verweise auf andere Berichte

- **Quer: Hauptknopf der Startseite knapp unter dem Bild** (640 × 360: Kopfband
  180 px, Hero 200 px; „Neuen Bogen erstellen" beginnt bei 328 von 360 px): in
  [feldtauglichkeit.md](../runde-6/feldtauglichkeit.md) als R6-H6.
- **Zwei „Ansicht"-Schalter im Assistenten (Kopf und Fußleiste):** R6-N5 in
  [neuer-nutzer.md](../runde-6/neuer-nutzer.md); sichtbar in
  `aa-tab-s3.png` und `l-s1-typ.png`.
- **Kurz-Liste mit gestapelten ▲ ▼ ⇑ am Tablet (Zeile rund 260 px hoch):**
  [feldtauglichkeit.md](../runde-6/feldtauglichkeit.md), R6-H3 (Länge der Liste).
- **Datumsfeld zeigt bei Locale de-DE die Form „07/16/2026":** Eigenheit des
  Testbrowsers (Headless-Chromium); nicht gewertet, Risiko für echte Geräte
  gering.

## Bestätigtes

- **Fußleiste des Assistenten:** 360 × 640, 100 %: 70 px (11 %); Feld: 81 px;
  200 %: 78 px (12 %); 320 × 568, 200 % und Feld: 78–82 px; quer 56 bzw. 69 px
  (16–19 %). Keine Überlappung in allen sieben Lagen (320/360 × 100 %, Feld, 200 %,
  Feld + 200 %), Schritt 1, 2 und 5. Tablet: 70 px über die ganze Breite (0–820,
  0–1180), „← Zurück", „◐ Ansicht" links und „Weiter →" rechts auf den
  Spaltenrändern.
- **Schrittleiste:** bei 200 % sechs Reiter, rechte Kante 288 bis 328 px (kein
  Abschneiden von „6").
- **Tab-Durchlauf:** Bei 360 × 640 (100 %), 320 × 568 (200 %) und 640 × 360 (100 %),
  Schritt 1–5, liegt kein fokussiertes Feld unter der Fußleiste (der Prüflauf
  meldete nur die Fußleisten-Knöpfe selbst).
- **Kein seitlicher Überlauf:** Startseite, Assistent 1–6, Einsatzansicht (auch
  bei 200 % und 320 px), Tabelle im Rollrahmen, Lagemonitor, Tablet, Zoom
  (`scrollWidth` gleich `innerWidth`).
- **Fortsetzen bei 200 %:** Oberkante 542 px (360 × 640), 543 (320 × 568), 508
  (Feld, 320 × 568), 554 (Feld, 200 %, 320 × 568) und im Bild; bei 100 % 391
  (360 × 640) und 382 (320 × 568).
- **Zurück-Verlauf:** Startseite → Einsatz → Zurück führt zur Startseite;
  Startseite → Assistent → Schritt 3 → Zurück → Zurück führt zur Startseite;
  der dritte Zurück verlässt die App. Keine Sackgasse, kein Sprung auf eine fremde
  Seite.
- **Offline-Zeile:** online „Jetzt offline bereit … Beispielbögen und Themenseiten
  werden nachgeladen (88 von 508)"; ohne Netz „… fehlen noch (92 von 508), sie
  folgen beim nächsten Netz". Die Zeile ist auf der Startseite 5 Zeilen hoch (bei
  360 px) und schiebt die Entwurfskarte nicht weg („Fortsetzen" bleibt im Bild).
- **Ansicht-Wahl bei 200 %:** Zusatzzeilen „große Tasten", „abends", „gedimmt"
  stehen in den Knöpfen (Runde 6: beschnitten), Wahl liegt über der Fußleiste.
- **Einsatzansicht:** Ziele 44–57 px hoch, Kopfzahlen in zwei Spalten, „Karten /
  Tabelle" 44 px, Sammlungswahl und Aufnahmeknöpfe 57 px; Quer-Balken zur Ecke
  (R6-M8 behoben).
- **Lagemonitor:** zeigt „letzte Meldung vor 1 Min" und „seit erster Meldung"
  (Datenstand) gut lesbar, ohne Überlauf.
- **Erfassungsleiste** („Einheit manuell erfassen…"): Kopf mit „Aufnahme für: …",
  Reiter nur mit Ziffern, „In Einsatz übernehmen" über der Fußleiste; Formularfläche
  rund 54 % der Höhe bei 360 × 640.

## Abgleich mit Runde 6

Legende: **hält**, **teilweise**, **nicht behoben**.

| Befund Runde 6 | Stand in Runde 7 | Nachweis |
| --- | --- | --- |
| R6-M1 Warnleiste höher als das Fenster | **teilweise** | Leiste auf 50 % gedeckelt (320/284 px), Knöpfe aber erst nach innerem Rollen im Bild (535–862 px im Inhalt), R7-M2. |
| R6-M2 Fußleisten-Raster überlappt, Schritt 6 abgeschnitten | **hält** | Keine Überlappung in sieben Lagen, sechs Reiter bei 200 %; Rest R7-M7 (Knopfbreite). |
| R6-M3 Einsatzansicht bei 200 % 471 px breit | **hält** | `scrollWidth` 360/320 bei 200 %. |
| R6-M4 Tabelle: klebende Spalte | **teilweise** | 36 % bei 100 %, „F" ab 224 px bei 200 % (vorher 370); Wortbruch nicht nachgemessen, R7-M4. |
| R6-M5 Deckel bei 200 %: Ansicht-Wahl, Einheitentyp, Kurz-Liste | **hält, mit Rest** | Wahl und Einheitentyp vollständig; Platzhalter „Organisationsname" abgeschnitten (R7-M5); Rollenfeld der Kurz-Liste bei 200 % nicht nachgemessen. |
| R6-M6 Startseite mit Entwurf bei 200 % | **hält** | „Fortsetzen" 508–554 px, im Bild. |
| R6-M7 Zoom 180 × 320 | **teilweise** | Kopf 162 px, Fußleiste zweizeilig 128 px (40 %), R7-M3. |
| R6-M8 Quer: Balken 16 % der Höhe | **hält** | Balken quer 63 × 52 px; Nebenwirkung R7-M8. |
| Verweis „Bedarf:" bricht im Wort | **nicht behoben** | 33 × 48 bei 100 %, 30 × 288 px bei 200 %, R7-M1. |

**Nebenwirkungen der Behebungen aus Runde 6:**
- **Fußleiste und Deckel bei großer Schrift:** halten (siehe oben); die Fußleiste
  bleibt bei 200 % 78 px hoch, „◐" zeigt dort nur das Zeichen.
- **Gedeckelte Warnleiste:** löst die Höhe, verlagert die Schwierigkeit in ein
  verschachteltes Rollen (R7-M2).
- **Rückweg und Verlauf:** keine Nebenwirkung gefunden.
- **Lagemonitor mit Datenstand und Bewegungen:** In der Einsatzansicht kein Überlauf;
  am Telefon als Vollfenster kleine Ziele (R7-M6). Die Bewegungs-Ansicht habe ich
  nicht gezielt ausgelöst.
- **Papier-Abgleich, Exportstand, Geräteuhr-Rückfrage:** nicht erreicht beziehungsweise
  nicht ausgelöst (siehe „Nicht prüfbar").

## Abschluss

Die Hauptaufgabe gelingt auf allen geprüften Telefon-Viewports bei 100 % und 200 %
Schrift. Die Umbauten der Fußleiste und der Einsatzansicht aus Runde 6 halten
gemessen. Offen bleiben die Zeile „Bedarf:" (R7-M1) und die Erreichbarkeit der
Entscheidungsknöpfe der gedeckelten Warnleiste (R7-M2); alles andere sind kleine
Stellen bei starkem Zoom und im Querformat.

Befunde: 0 × P0, 0 × P1, 2 × P2, 6 × P3.

**Zuerst beheben:**
1. R7-M1: „Bedarf:" nicht im Wort brechen.
2. R7-M2: Entscheidungsknöpfe der Warnleiste an den Anfang der Leiste.
3. R7-M3 und R7-M5: Kopf und Fußleiste bei starkem Zoom und großer Schrift
   verschlanken.
