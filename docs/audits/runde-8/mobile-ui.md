# Audit „Mobile UI", Runde 8 (Darstellung und Bedienung auf dem Telefon)

Stand: 24.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Bericht prüft nach, was
[Runde 7](../runde-7/mobile-ui.md) samt „Stand der Behebung" in
[Runde 7, README](../runde-7/README.md) festgestellt hat, und die Umbauten aus
Runde 7 am Lagemonitor, an der Zwei-Fenster-Leiste, an den Rückfragen, an der
Kurz-Liste ab 8 Personen, an der Musterung und am Layout bei großer Schrift und
Zoom.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, jeder Lauf in einem
eigenen Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten. Der
Server wurde weder neu gebaut noch angehalten. Viewports: 360 × 640 (Grundlage),
320 × 568, 640 × 360 (quer), Tablet 820 × 1180 und 1180 × 820, dazu
`html { font-size: 200% }` (im Folgenden „200 %") und die Nachbildung eines
Browser-Zooms von 200 % am 360er Telefon: Fenster 180 × 320 Layout-Pixel bei
Skalierung 4 (im Folgenden „180 × 320"). Zusätzlich Feld-Modus
(`eeb.anzeigemodus.v1` = `feld`) am Tablet.

Zustände kamen aus `localStorage`-Seeds, alle mit `uebung: false` und Stand auf
heute: `eeb.entwurf.v1` (THW Oldenburg, Verstärkter Bergungszug, 38 Personen),
`eeb.einsaetze.v1` (Sammlung „Hochwasser Musterstadt", 6 Meldungen). Eine
Vorlage entstand durch Bedienung („Als Vorlage speichern", dann Startseite).

Durchlaufen habe ich: Startseite (mit Entwurf, mit Sammlung, leer),
Assistent Schritt 1 bis 6, Personal-Schritt mit „Nur Stärke"-Rückfrage und
Kurz-Liste, Einsatzansicht als Karten und Tabelle samt aufgeklapptem Eintrag,
Lagemonitor (`?lagemonitor=<id>`, auch über „Lagemonitor öffnen"),
Zwei-Fenster-Konflikt (zweite Seite im selben Kontext ändert den Entwurf; Leiste,
„Entscheiden", Rückfrage „Meine Fassung behalten?"), Musterung der Vorlage,
Browser-Zurück und -Vorwärts über Startseite, Assistent und Einsatz, Dialoge der
Startseite (Einheit schnell erfassen, Datensicherung, Beispielbögen, Alle Daten
löschen, Neue Einsatz-Sammlung, Verwerfen, QR-Code scannen).

Gemessen habe ich `scrollWidth` gegen `innerWidth`, Lage und Höhe fester und
klebender Leisten, Maße und Abstände der Ziele (Breite, Höhe, nächster Nachbar),
Rollhöhen innerhalb von Dialogen und Leisten, Spaltenbreiten von Tabellen und
Überlauf von Knopfbeschriftungen (`scrollWidth` gegen `clientWidth`). Jede
Aussage zu Lage und Größe habe ich am Screenshot gegengeprüft.

Reihenfolge: Ich habe zuerst getestet und den Bericht aus Runde 7 samt „Stand
der Behebung" erst danach gelesen. Skripte und Screenshots liegen außerhalb des
Repositorys im Scratchpad (`.../scratchpad/runde8/m/`).

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
- die Geräteuhr-Rückfrage und die Rückfragen des Papier-Abgleichs habe ich
  nicht ausgelöst; die Geräteuhr-Warnung bei 200 % und 320 × 568 ist als
  R7-G8/H9 eine bekannte Grenze;
- Das Datumsfeld des Lagemonitors zeigt im Testbrowser „mm/dd/yyyy"
  (Eigenheit von Headless-Chromium, nicht gewertet).

## Urteil

Die Umbauten aus Runde 7 halten im Kern, und mehrere frühere Mängel sind
gemessen weg. „Bedarf:" steht in der Einsatzansicht bei 360, 320 und 200 % in
einer Zeile (56 × 24 px, Runde 7: bis 30 × 288 px). Die Zwei-Fenster-Leiste ist
bei 360 × 640 16 % hoch und zeigt beide Entscheidungsknöpfe schon im Ruhezustand
(Runde 7: 34 bis 50 %, Knöpfe erst nach innerem Rollen); die Rückfrage hat
einen rollenden Rumpf mit festem Fuß und nennt den Unterschied („anders: Ort /
Auftrag"). Die Kurz-Liste ab 8 Personen verkürzt die Personalseite am Telefon
von 56 321 auf 8 826 px. Der Kopf des Assistenten ist bei 200 % 123 px hoch
(Runde 7: rund 175). Der Lagemonitor hat am Telefon Knöpfe von 44 px, keinen
Wortbruch in „Orga" und keinen seitlichen Überlauf. Der Browser-Verlauf ist
stimmig, auch über Zurück und Vorwärts. Kein seitlicher Überlauf in keiner
geprüften Lage.

Neu und am deutlichsten: Bei 320 px Breite und 200 % Schrift ragt der
unsichtbar gedachte Sprungmarken-Link mit 22 px in den Bildschirm und verdeckt
den Kopf, darunter die erste Zeile der festen Warnleiste und die Speicher-Zeile
(R8-M1). Und beim Zoom-Fenster 180 × 320 bleibt vom Rückfrage-Dialog ein
Streifen von drei Textzeilen; die Knopfbeschriftungen laufen aus den Knöpfen
(R8-M2). Der Rest sind kleine Stellen bei starkem Zoom (Fußleiste bleibt
zweizeilig, R8-M3), die Tabelle im Lagemonitor am Telefon (R8-M4), zwei
Dialoge ohne mitlaufendes „Schließen" (R8-M5) und ein paar Restposten aus
Runde 7.

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt in allen
geprüften Lagen. Die Befunde sind 0 × P0, 0 × P1, 2 × P2, 8 × P3.

## Befunde

### R8-M1 [P2] Sprungmarke „Zum Inhalt springen" liegt bei 320 px und 200 % Schrift 22 px im Bild und verdeckt Kopf, Warnleiste und Speicher-Zeile

**Priorität:** P2

**Kennzeichnung:** gemessen, im Screenshot beobachtet (`fw-klein-g.png`,
`st3-klein-g.png`, `start-klein-gross.png`).

**Fundstelle:** `a.sprungmarke` (Verweis „Zum Inhalt springen", `position:
absolute`, `z-index: 100`), auf jeder Seite. Wirkt zusammen mit dem Kopf des
Assistenten und der festen Warnleiste `fenster-konflikt`.

**Beobachtung:** Der Link ist über einen festen Versatz nach oben versteckt. Bei
200 % Schrift wird er höher als der Versatz:

| Lage | Oberkante | Unterkante | Höhe |
| --- | --- | --- | --- |
| 360 × 640, 100 % | −48 | −9 | 39 |
| 360 × 640, 200 % | −96 | −20 | 76 |
| 320 × 568, 200 % | −96 | **+22** | 118 |

Bei 320 × 568 und 200 % liegt daher ein weißer Balken mit Rand über den obersten
22 px jeder Seite, ohne dass jemand die Tab-Taste gedrückt hat. Er überdeckt auf
der Startseite die Kopfzeile („Alle Themen", „Anleitung"), im Assistenten die
Zeile „✓ gespeichert · … · nur auf diesem Gerät" und in der Zwei-Fenster-Konflikt
die erste Zeile der festen Warnleiste („⚠ Hier wird nichts gespeichert."): Im
Screenshot beginnt der Satz bei „gespeichert. Das andere Fenster hat den Bogen
geändert". Auch bei 360 × 640 und 200 % ist der Link mit −20 knapp außerhalb.

**Erwartung der Rolle:** Ein versteckter Verweis ist in Ruhe vollständig
außerhalb des Bildes; nur der Fokus holt ihn herein.

**Folge:** Die Warnung „Hier wird nichts gespeichert" ist genau die Stelle, die
bei großer Schrift auf dem kleinen Telefon gelesen werden muss; ihr erstes Wort
fehlt, die Speicherzeile fehlt ganz. Wer mit großer Schrift arbeitet, sieht
außerdem dauerhaft einen leeren Balken am Bildrand. Der Fall braucht 320 px und
große Schrift, ist aber ohne Fehlbedienung dauerhaft da.

**Empfehlung:** Den Versatz an die Höhe des Links koppeln (der Link rückt um
seine eigene Höhe nach oben, nicht um einen festen Wert) oder ihn ohne Fokus
unsichtbar machen (`clip`/`visibility`), damit nur der Fokus ihn zeigt.

**Nachprüfung:** 320 × 568 und 360 × 640, 100 % und 200 %: Unterkante des Links
ohne Fokus kleiner als 0; Zwei-Fenster-Warnleiste zeigt ihre erste Zeile ganz.

### R8-M2 [P2] Rückfrage-Dialog im Zoom-Fenster 180 × 320: Text nur noch drei Zeilen, Knopfbeschriftung läuft aus den Knöpfen

**Priorität:** P2

**Kennzeichnung:** gemessen in der Nachbildung (kleineres Fenster, kein echter
Zoom); im Screenshot beobachtet (`fw3-telefon-z.png`, `ns-telefon-z.png`).
Echter Browser-Zoom ist Risiko.

**Fundstelle:** Gemeinsame Rückfrage (`dialog` mit `abfrage-rumpf` und festem
Fuß), geprüft mit „Meine Fassung behalten?" (Zwei-Fenster-Konflikt), „Nur die
Stärke melden?" (Personal-Schritt) und „Einheit schnell erfassen".

**Beobachtung:**

| Lage | Dialog | sichtbarer Rumpf / ganzer Rumpf | Knöpfe |
| --- | --- | --- | --- |
| 360 × 640, 100 % | 328 × 316 | alles sichtbar | 278 × 44, untereinander |
| 360 × 640, 200 % | 328 × 640 | 320 / 734 px (44 %) | 276 breit, untereinander |
| 320 × 568, 200 % | 288 × 536 | 248 / 782 px (32 %) | 238 breit, 118 und 88 hoch |
| 180 × 320 | 148 × 288 | 161 / 439 px (37 %) | **45 und 45 px breit**, nebeneinander |
| 640 × 360 | 243 breit | alles sichtbar | 44 hoch, **12 px gegeneinander versetzt** |

Im 180er Fenster stehen der Primärknopf („Nur Stärke melden" oder „Meine
Fassung behalten", 45 × 81 px) und „Abbrechen" (45 × 44 px) nebeneinander;
beschriftungsbreite 45 und 57 gegen 43 px Knopfbreite: „Fassung" und „melden"
sind am Rand abgeschnitten, „Abbrechen" ragt über den Knopf hinaus in den
Dialograum (Screenshot `ns-telefon-z.png`). Der Text der Frage („38 erfasste
Personen zählen dann nicht mehr einzeln …") zeigt sich in einem Streifen von
etwa drei Zeilen; der Rest rollt hinter einem Verlauf. Bei 320 × 568 und 200 %
liegen zwei volle Knöpfe (zusammen 206 px) unter einem Rumpf von 248 px, der
782 px Inhalt hat: Die Folgen der Entscheidung stehen auf der dritten
Bildschirmseite.

**Erwartung der Rolle:** Bei jeder Schrift stehen Kurztext der Frage und beide
Knöpfe im Bild und sind vollständig beschriftet; unter etwa 240 px Breite
stehen die Knöpfe untereinander.

**Folge:** „Meine Fassung behalten?" und „Nur die Stärke melden?" sind
Entscheidungen mit Verlustfolge („Deine Fassung wird ab jetzt gespeichert", „die
Stärke wird von Hand geführt"). Wer sie mit starkem Zoom bestätigt, tippt
wenigstens ohne den Wortlaut der Folge zu sehen. Der Fall ist selten (starker
Zoom plus Rückfrage); der rollende Rumpf mit festem Fuß aus Runde 7 verhindert
aber, dass die Knöpfe verschwinden, und hält deshalb gegenüber Runde 6.

**Empfehlung:** Unter etwa 240 px Breite die Knöpfe untereinander setzen und die
seitliche Füllung des Dialogs auf 12 px verringern; bei 200 % Schrift den
Dialogkopf verkleinern, sodass der Rumpf mindestens die Hälfte der Höhe behält.

**Nachprüfung:** 180 × 320 und 320 × 568, 200 %: Knopfbeschriftung
`scrollWidth` gleich `clientWidth`; Rumpf mindestens 50 % der Fensterhöhe.

### R8-M3 [P3] Zoom-Fenster 180 × 320: Fußleiste weiter zweizeilig und 38 % der Höhe; Reiter der Schrittleiste 23 bis 25 px breit (Rest von R7-M3)

**Priorität:** P3

**Kennzeichnung:** gemessen in der Nachbildung; echter Zoom ist Risiko.

**Fundstelle:** `footer.nav.assistent-nav`, Schrittleiste `.schritte`, feste
Warnleiste in der Zwei-Fenster-Lage.

**Beobachtung:** Im Stand der Behebung steht „Fußleiste einzeilig bei 180 px".
Gemessen ist sie zweizeilig: „→" über die volle Breite (8–172 px, Oberkante
211), darunter „←" (8–52) und „◐" (60–104), Höhe 122 px (38 % von 320). Der Kopf
ist 105 px (33 %, Runde 7: 162) hoch und rollt weg. Die Beschriftung „Weiter"
entfällt, der Knopf trägt `aria-label="Weiter →"`; „Zurück" ebenso. Die Reiter
der Schrittleiste sind 23 bis 25 px breit und 44 px hoch (Ziffer und Haken
untereinander); die Tipp-Fläche je Reiter ist damit schmaler als 44 px, der
Nachbar liegt ohne Abstand daneben. In der Zwei-Fenster-Lage kommt die feste
Warnleiste hinzu (88 px, zugeklappt, „Hier wird nichts gespeichert. Das …"
abgeschnitten, mit „Entscheiden"): 88 + 122 von 320 px sind fest, es bleiben
110 px für Kopf und Formular. Aufgeklappt (160 px) bleiben rund 38 px.

**Erwartung der Rolle:** Bei starkem Zoom bleibt mindestens die Hälfte der Höhe
für das Formular, auch in der Konfliktlage.

**Folge:** Gering; wenige Nutzer, die Seite ist bedienbar. In der Konfliktlage
ist aber der Platz fürs Formular fast weg; die Rückfrage ist dann der einzige
Weg weiter.

**Empfehlung:** Unter etwa 240 px Breite die Fußleiste einzeilig (drei Symbole)
und die Reiter auf Ziffern bei mindestens 36 px Breite beschränken; die
Warnleiste in dieser Lage nur als einzeiliges „Entscheiden".

**Nachprüfung:** 180 × 320, Schritt 1–5: Fußleiste höchstens 25 % der Höhe;
Konfliktlage: mindestens 40 % der Höhe frei.

### R8-M4 [P3] Lagemonitor am Telefon: Tabelle rechts abgeschnitten, Stärke-Spalten F/U/M liegen außerhalb des Bildes, ohne Hinweis zum Seitwärtsrollen

**Priorität:** P3

**Kennzeichnung:** gemessen, im Screenshot beobachtet (`lm-telefon.png`).

**Fundstelle:** `?lagemonitor=<id>`, Tabelle „Einheiten" (`.lm-tabelle`,
`overflow-x: auto`, Tabelle 448 px breit); Fallback, wenn kein zweites Fenster
aufgeht, oder Telefon als Anzeige.

**Beobachtung:** Bei 360 × 640 und 320 × 568 ist die Tabelle 448 px breit in
einem Rahmen von 336 bzw. 298 px. „Einheitentyp" endet bei 380 px, „F" bei 404,
„U" bei 429, „M" bei 460: Die drei Zahlen je Einheit sind im ersten Bild nicht
zu sehen, „Einheitentyp" bricht sichtbar mitten im Wort („Materialwirtsc…",
„Bergungsgrup…"). Es gibt weder Schatten noch Pfeil als Hinweis; der Rahmen
rollt seitwärts, ohne es zu zeigen. Bei 200 % Schrift (360 px) gleich, im
180er Fenster sieht man nur „Orga" und „Ort". Die Gesamtstärke steht oben
(„1 / 15 / 43 // 59") und ist lesbar; die Knöpfe sind 44 px hoch, „Orga" bricht
nicht mehr (Stand der Behebung L2, G3, M6 und K7 halten). Quer (640 × 360) passt
die Tabelle ohne Rollen.

**Erwartung der Rolle:** Wenn der Monitor am Telefon zu sehen ist, sind die
Zahlen je Einheit im ersten Bild oder ein Rollhinweis ist sichtbar.

**Folge:** Gering: Die Ansicht ist für den Fernseher gedacht, das Telefon ist
nur der Notweg bei gesperrtem Popup. Wer sie dort liest, sieht Namen und Orte,
aber die Stärke je Einheit nicht.

**Empfehlung:** Unter 640 px Breite „Einheitentyp" ausblenden oder die
Tabelle auf Orga, Ort und F/U/M kürzen; sonst Rollschatten am Rand.

**Nachprüfung:** `?lagemonitor=<id>` bei 360 × 640: `scrollWidth` der Tabelle
gleich ihrem Rahmen, oder „M" liegt im Bild.

### R8-M5 [P3] „Beispielbögen" und „Datensicherung": „Schließen" liegt nur oben im Dialog und rollt aus dem Bild; Links 33 px hoch

**Priorität:** P3

**Kennzeichnung:** gemessen, im Screenshot beobachtet (`dlgend-Beis.png`,
`dlgend-Date.png`).

**Fundstelle:** Dialoge der Startseite „Beispielbögen" (Liste „Organisation oder
Thema wählen") und „Datensicherung" (`dialog`, rollt als Ganzes; kein fester
Fuß wie bei den Rückfragen).

**Beobachtung:** Bei 360 × 640 ist der Dialog 606 px hoch bei 812 px
(„Beispielbögen") und 883 px („Datensicherung") Inhalt. Am Ende der Liste liegt
„Schließen" bei −173 bis −129 px, also außerhalb; im Screenshot steht am Fuß
des Dialogs kein Schließen-Weg. In „Beispielbögen" gehen 15 Zeilen Erklärtext
(Anzeigen, PDF, Link) der Liste voran; die Liste beginnt erst auf dem zweiten
Bild. Die Listeneinträge („ASB (4 Bögen)", „THW (101 Bögen)" …) sind
unterstrichene Verweise von 33 px Höhe in 33-px-Abstand (kein Zwischenraum). In
„Datensicherung" ist „Dauerhaften Speicher anfragen" ein Textknopf von 193 × 30
px. Bei 320 × 568 und 200 % ist der Dialog 536 px hoch; „Schließen" liegt bei
rund 2 000 px im Inhalt.

**Erwartung der Rolle:** Ein Dialog, der rollt, behält sein „Schließen" im Bild
(fester Kopf oder Fuß wie bei den Rückfragen); Listeneinträge haben 44 px.

**Folge:** Gering; zurück geht es mit „Escape", Zurück oder Rollen nach oben.
Wer am Listenende ohne Treffer ist, sucht den Ausgang.

**Empfehlung:** „Schließen" als festen Fuß wie in der Rückfrage; die Liste vor
den Erklärtext setzen; Listenzeilen auf 44 px.

**Nachprüfung:** 360 × 640, beide Dialoge ans Ende gerollt: „Schließen" im Bild;
Listenzeilen mindestens 44 px hoch.

### R8-M6 [P3] Tabellenansicht der Einsatzansicht: Name bricht mitten im Wort, klebende Spalte 37 % des Rahmens (Rest von R7-M4, unverändert)

**Priorität:** P3

**Kennzeichnung:** gemessen und im Screenshot beobachtet (`tb-telefon.png`).

**Fundstelle:** Einsatzansicht, „Tabelle" (`.tabellen-scroll`, klebende erste
Spalte „Einheit").

**Beobachtung:** 360 × 640: Rollrahmen 326 px, Tabelle 1 663 px breit, 24
Spalten. Die klebende Spalte „Einheit" ist rund 264 von 720 Bildpixeln breit,
also 37 % (Runde 7: 36 %); im Rahmen sichtbar sind danach „Zug", „F", „U", „M"
und der Anfang von „Ges.". Die Namen brechen mitten im Wort: „Materialwirtsch /
aft", „Wassergefahre / n (A)", „Bergungsgrup / pe". Im 180er Fenster ist der
Rahmen 86 px breit (Tabelle 1 578 px). Der Stand der Behebung nennt „Tabellenspalte
gedeckelt" (M3, M4, M5, M7); die Spaltenbreite ist gegenüber Runde 7 gleich
geblieben, der Wortbruch auch.

**Erwartung der Rolle:** Namen brechen nur an Trennstellen und Leerzeichen.

**Folge:** Gering; die Karten zeigen alle Zahlen im ersten Bild.

**Empfehlung:** Kurzname („Nr. 3 THW Ulm") in der klebenden Spalte, den Rest in
der Zeile.

**Nachprüfung:** 360 × 640, Tabelle: kein Buchstabe einer Wortmitte in einer
neuen Zeile.

### R8-M7 [P3] Kurz-Liste der Personen: je Person drei Zeilen ohne sichtbare Feldbeschriftung; bei 200 % schneidet das Rollenfeld „Führer/in" ab

**Priorität:** P3

**Kennzeichnung:** gemessen (Höhen, Beschriftung im DOM) und im Screenshot
beobachtet (`kl-telefon.png`, `kl-klein-g.png`).

**Fundstelle:** Schritt 3, „Kurz-Liste (Tabelle)" (Vorgabe ab 8 Personen).

**Beobachtung:** Die Kurz-Liste verkürzt die Personalseite deutlich: 8 826 px
statt 56 321 px bei 38 Personen (360 × 640), quer 8 428 statt 30 386 px. Am
Telefon ist die „Tabelle" aber je Person eine Karte aus drei Zeilen (▲ ▼ ⇑ ✕,
Vorname und Nachname, Rolle und Geschlecht) von rund 197 px Höhe, bei 320 × 568
und 200 % 394 px. Die Felder tragen nur ein `aria-label` („Person 1: Vorname"),
keine sichtbare Beschriftung; sobald der Wert drinsteht, erkennt man Vorname und
Nachname nur an der Reihenfolge. Bei 200 % schneidet das Rollenfeld ab
(„Führer/ir"), das Namensfeld zeigt nur die erste Hälfte. Die Ziele ▲ ▼ ⇑ ✕ sind
44 × 44 px mit 0 px Abstand zu den Nachbarn; „✕" (Person entfernen) liegt an
einer Seite, ▲ ▼ ⇑ an der anderen.

**Erwartung der Rolle:** Felder tragen eine Beschriftung, die nach dem Eintragen
sichtbar bleibt; die Kurz-Liste ist am Telefon merklich kürzer als die Karten.

**Folge:** Gering. Die Liste ist bedienbar; sie ist für 38 Personen lang (rund
7 500 px).

**Empfehlung:** Je Zeile eine einzeilige Kurzfassung (Name, Rolle) mit
Aufklappen für die Bearbeitung, oder wenigstens kleine Feldnamen über den
Eingaben.

**Nachprüfung:** 360 × 640, Schritt 3 mit 38 Personen: Höhe je Person höchstens
120 px; 320 × 568, 200 %: Rollenfeld ohne abgeschnittenen Wert.

### R8-M8 [P3] Querformat 640 × 360: Knöpfe der Rückfrage nebeneinander, aber 12 px gegeneinander versetzt

**Priorität:** P3

**Kennzeichnung:** gemessen und im Screenshot beobachtet (`fw3-quer.png`).

**Fundstelle:** Gemeinsame Rückfrage bei 640 × 360 („Meine Fassung behalten?",
„Nur die Stärke melden?").

**Beobachtung:** Der Primärknopf („Nur Stärke melden", 243 × 44, 219–263) und
„Abbrechen" (243 × 44, 231–275) stehen nebeneinander, „Abbrechen" 12 px tiefer
(bei „Meine Fassung behalten": 231–275 und 243–287). Der Dialog ist 224 bzw. 248
px hoch bei 360 px Fensterhöhe. Der Versatz ist gleich in beiden Rückfragen.

**Erwartung der Rolle:** Nebeneinanderstehende Knöpfe sitzen auf einer Linie.

**Folge:** Gering; sieht unruhig aus, beide Knöpfe sind voll tippbar.

**Empfehlung:** Knöpfe auf gleiche Oberkante setzen.

**Nachprüfung:** 640 × 360: Oberkanten beider Knöpfe gleich.

### R8-M9 [P3] „Bedarf:"-Zeile der Einsatzansicht im Zoom-Fenster 180 × 320: Zeile 288 px hoch, 90 % der Fensterhöhe (Rest von R7-M1)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle:** Einsatzansicht, aufklappbare Zeile „Bedarf: …".

**Beobachtung:** Das Wort „Bedarf:" bricht nicht mehr (56 × 24 px bei 360 × 640,
320 × 568, 200 % und 180 × 320; Runde 7: 30 × 288 px). Die Zeile selbst ist bei
360 × 640 72 px, bei 320 × 568 und 200 % 88 px hoch. Im 180er Fenster ist sie
aber 288 px hoch, weil der Wert („Verpflegung 59 · Unterbringung 7 · Diesel 745 l
· Ruhezeit 3×") rechts neben dem unteilbaren Wort in einer schmalen Spalte läuft.

**Erwartung der Rolle:** Bei starkem Zoom steht die Beschriftung über dem Wert
und der Wert nutzt die volle Breite.

**Folge:** Gering; ein Bild der Einsatzansicht geht an die Zeile. M1 und G9 aus
Runde 7 sind für 320 bis 360 px behoben.

**Empfehlung:** Unter etwa 240 px Beschriftung und Wert untereinander stellen.

**Nachprüfung:** 180 × 320: Höhe der Zeile höchstens 40 % der Fensterhöhe.

### R8-M10 [P3] Musterung: Kopfleiste mit Stärke und Name plus Fußleiste kleben mit 38 bis 40 % der Höhe

**Priorität:** P3

**Kennzeichnung:** gemessen (Höhen der klebenden Leisten), im Screenshot
beobachtet (`mu3-telefon.png`, `mu3-quer.png`).

**Fundstelle:** Musterung einer Vorlage („Einsatz vorbereiten"): klebende Leiste
`staerke-leiste`, klebende `kopfzeile` (Überschrift „Personal (38/38)" mit
„Alle abwählen"), `footer.nav` mit „Bogen anlegen · 38 Pers · 10 Fz".

**Beobachtung:** Beim Rollen kleben bei 360 × 640 die Stärkeleiste (85 px), die
Kopfzeile der Liste (93 px) und die Fußleiste (67 px): 245 von 640 px (38 %), es
bleiben 395 px für die Haken. Bei 320 × 568 gleich (43 %). Quer (640 × 360): 90
+ 53 = 143 von 360 px (40 %), dort ohne Listenüberschrift. Bei 180 × 320: 107
+ 67 von 331 px. Die Ansicht ist als eigene Verlaufsansicht erreichbar (Runde 7,
H2 hält: Zurück führt zur Startseite).

**Erwartung der Rolle:** Beim Rollen durch lange Listen bleibt mindestens die
Hälfte der Höhe für den Inhalt.

**Folge:** Gering; die Liste ist lang und auch lesbar, aber jede Zeile ist 64
px hoch, im sichtbaren Streifen stehen nur sechs Zeilen.

**Empfehlung:** Die Kopfzeile der Liste beim Rollen nicht kleben lassen oder
die Stärkeleiste einzeilig führen.

**Nachprüfung:** 360 × 640 und 640 × 360: klebende Leisten zusammen höchstens
30 % der Höhe.

### Verweise auf andere Berichte

- **Geräteuhr-Warnung bei 200 % und 320 × 568:** bekannte Grenze R7-G8/H9; nicht
  erneut gemessen.
- **Ecken-Knopf „◐ Ansicht: Standard" hochkant (57 px Balken, 9 % der Höhe,
  quer 63 × 52 px):** bekannte Grenze R7-G4/M8; unverändert (360 × 640: Balken
  Oberkante 583, 320 × 568: 511, quer 308).
- **Zwei „Ansicht"-Schalter im Assistenten (Kopf und Fußleiste):** bleibt, siehe
  [neuer-nutzer.md](../runde-7/neuer-nutzer.md).
- **Ziffern der Schrittleiste (R7-N9)** und **fehlender Zusammenführen-Tipp
  (R7-N1):** bekannte Grenzen, nicht erneut gemeldet.

## Bestätigtes

- **Kein seitlicher Überlauf:** Startseite, Assistent 1–6, Einsatzansicht,
  Tabelle im Rollrahmen, Lagemonitor, Musterung, Dialoge, Tablet
  (820 × 1180, 1180 × 820, auch Feld), Zoom-Fenster: `scrollWidth` gleich
  `innerWidth` in jeder Lage.
- **Zwei-Fenster-Leiste (Runde 7: M2, O1, G6):** 360 × 640 104 px (16 %), 320 ×
  568 und 200 % 136 px (24 %), quer 53 px (15 %). Bei 360 und 320 stehen
  „Meine Fassung behalten" und „Anderen Stand laden" im ersten Bild der Leiste
  (Oberkante 55 bzw. 100 px). Aufgeklappt (272 px bei 360 × 640) nennt sie
  „Dort: … gespeichert 21:24:54 Uhr, 38 Personen" und „Hier: … zuletzt
  gespeichert 21:24:41 Uhr" mit Sekunden, bei Inhaltsunterschied „anders: Ort /
  Auftrag". Quer und im Zoom-Fenster erst nach „Entscheiden"; das ist ein
  Zwischenschritt, keine Sackgasse.
- **Rückfragen (W1, E4):** Rumpf rollt, Fuß fest, Knöpfe 44 px, 278 px breit
  untereinander bei 360 × 640; bei 320 × 568 und 200 % 238 px breit; das Wesentliche
  der Folge steht im ersten Satz („kommt auf der Startseite unter „Zuletzt
  geschlossener Bogen" und lässt sich von dort zurückholen. Deine Fassung wird ab
  jetzt gespeichert.").
- **„Nur Stärke"-Rückfrage (A1):** Wortlaut mit Zahl („38 erfasste Personen zählen
  dann nicht mehr einzeln — die Stärke … startet mit 1 / 9 / 28 / 38. Die Namen
  bleiben als Erreichbarkeiten erhalten."), Knöpfe „Nur Stärke melden" und
  „Abbrechen".
- **Kurz-Liste ab 8 Personen (H6):** Vorgabe bei 38 Personen; 8 826 px statt
  56 321 px (360 × 640).
- **Lagemonitor am Telefon (L2, G3, M6, K7):** Knöpfe und Aufklapper 44 px
  hoch, Schrift 16 px, Seite rollt (809 px bei 640 px Höhe), „Orga" bricht nicht,
  „Uhr", „Stärke F / U / M // gesamt", „6 Einheiten · 22 Fahrzeuge", „letzte
  Meldung vor 1 Min", „seit erster Meldung: 0 Stunden, 6 Minuten" lesbar;
  Bewegungen höchstens drei Zeilen plus „+ 3 weitere Bewegungen", „Eingetroffen:
  …". Quer ohne Überlauf; die Tabelle füllt die Breite.
- **„Bedarf:" (M1, G9):** 56 × 24 px bei 360 × 640, 320 × 568, 200 %.
- **Kopf des Assistenten bei 200 % (M5):** 123 px (19 bis 22 %), sechs Reiter 41
  bis 50 px breit, „1 offen" in zwei Zeilen statt abgeschnitten.
- **Zurück-Verlauf (H2, späte Rückkehr von `back()`):** Startseite → Assistent →
  Schritt 3 → Zurück zeigt „Gesamtübersicht", nochmals Zurück die Startseite,
  Vorwärts wieder die Übersicht; Startseite → Einsatzansicht → Zurück führt zur
  Startseite. Keine Sackgasse, kein Sprung aus der App.
- **Musterung als Verlaufsansicht (H2):** eigene Ansicht, „‹ Abbrechen" oben,
  „Bogen anlegen · 38 Pers · 10 Fz" fest unten; Zeilen 64 px hoch, Haken 40 px.
- **Fußleiste bei 320 und 360 px:** 70 bis 78 px (11 bis 14 %), „←", „◐", „Weiter
  →" ohne Überlappung (12 bis 24 px Abstand), auch bei 200 %.
- **Tablet:** Assistent und Einsatzansicht ohne Überlauf; Feld-Modus: Ziele 54 bis
  68 px.
- **Rückfragen der Startseite:** Verwerfen (372 px), Neue Einsatz-Sammlung
  (523 px) und „Alle Daten löschen" mit Kästchen 24 px, dessen Beschriftung
  mitzählt; keine Überläufe bei 360 × 640.

## Abgleich mit Runde 7

Legende: **hält**, **teilweise**, **nicht behoben**.

| Befund Runde 7 | Stand in Runde 8 | Nachweis |
| --- | --- | --- |
| R7-M1 „Bedarf:" bricht im Wort | **hält** (Rest bei 180 px) | 56 × 24 px in allen Lagen; im 180er Fenster Zeile 288 px, R8-M9. |
| R7-M2 Warnleiste bei 200 %, Knöpfe erst nach Rollen | **hält** | Leiste 16 bis 24 % der Höhe, beide Knöpfe im ersten Bild (360, 320); Nebenwirkung R8-M1 (Sprungmarke deckt die erste Zeile bei 320/200 %). |
| R7-M3 Zoom 180 × 320: Kopf 51 %, Fußleiste 40 % | **teilweise** | Kopf 105 px (33 %), Fußleiste 122 px (38 %) weiter zweizeilig; Stand der Behebung („einzeilig bei 180 px") nicht gemessen, R8-M3. |
| R7-M4 Tabelle: klebende Spalte 36 %, Wortbruch | **nicht behoben** | 37 % bei 360 × 640; „Materialwirtsch / aft", R8-M6. |
| R7-M5 Kopf bei 200 %: Reiter abgeschnitten | **hält** | Kopf 123 px, „1 offen" zweizeilig, Reiter ohne Überlauf. |
| R7-M6 Lagemonitor am Telefon: Knöpfe 19 px, Aufklapper 12 px, „TH / W" | **hält, mit Rest** | Knöpfe und Aufklapper 44 px, „Orga" ohne Wortbruch; Tabelle rechts abgeschnitten, F/U/M außerhalb, R8-M4. |
| R7-M7 Fußleiste Schritt 5: „◐ Ansicht" schneidet ab | **hält** | In allen Schritten „◐" ohne abgeschnittenen Text bei 320/360 px. |
| R7-M8 Quer: Ecken-Knopf überdeckt Randfelder; hochkant Balken | **teilweise (bekannte Grenze)** | Quer 63 × 52 px; hochkant Balken 57 px, 9 % der Höhe, R7-G4/M8 unverändert. |

**Nebenwirkungen der Umbauten aus Runde 7:**
- **Rückfragen mit rollendem Rumpf und festem Fuß:** halten bei 320 bis 360 px; im
  Zoom-Fenster zu schmal (R8-M2); quer 12 px Versatz (R8-M8).
- **Zwei-Fenster-Leiste:** bei 320/200 % verdeckt die Sprungmarke die erste Zeile
  (R8-M1); in der Konfliktlage im Zoom-Fenster bleibt kaum Platz (R8-M3).
- **Kurz-Liste ab 8 Personen:** die Länge ist gelöst; Feldnamen und 200 %-Beschnitt
  offen (R8-M7).
- **Lagemonitor „+ n weitere" und Bewegungsbegrenzung:** keine Nebenwirkung
  gefunden, am Telefon aber die Tabellenbreite (R8-M4).
- **Beiseitelegen unlesbarer Daten, Papier-Abgleich mit Sitzungsspeicher,
  Geräteuhr-Halt:** nicht ausgelöst (siehe „Nicht prüfbar").

## Abschluss

Die Hauptaufgabe gelingt auf allen geprüften Telefon-Viewports bei 100 % und 200 %
Schrift, am Tablet und quer. Die Behebungen aus Runde 7 halten bei 320 bis 360 px
gemessen. Offen sind zwei Stellen bei der Kombination 320 px mit 200 % Schrift
beziehungsweise Zoom-Fenster: die Sprungmarke, die ins Bild ragt (R8-M1), und der
Rückfrage-Dialog im 180er Fenster (R8-M2). Alles andere sind kleine Reste bei
starkem Zoom und kleine Stellen am Lagemonitor, an Dialogen und an der Tabelle.

Befunde: 0 × P0, 0 × P1, 2 × P2, 8 × P3.

**Zuerst beheben:**
1. R8-M1: Sprungmarke ohne Fokus ganz aus dem Bild (Versatz an ihre Höhe koppeln).
2. R8-M2: Rückfrage-Dialog unter etwa 240 px Breite mit untereinanderstehenden
   Knöpfen und schmalerem Rand.
3. R8-M3: Fußleiste und Schrittleiste im Zoom-Fenster einzeilig, Konfliktlage
   entlasten.
4. R8-M5: „Schließen" der Dialoge „Beispielbögen" und „Datensicherung" als festen
   Fuß.
