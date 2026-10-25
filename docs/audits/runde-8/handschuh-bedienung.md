# Audit „Handschuh-Bedienung“, Runde 8 (Touch-Ziele, Abstände, Doppeltipps, Rückfragen)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde. Geprüft sind die in Runde 7 geänderten Stellen: Papier-Abgleich
mit Sitzungsspeicher, Rückfrage „Für neuen Einsatz vorbereiten“, Lagemonitor am
Telefon, Zwei-Fenster-Leiste, Rückfragen (rollender Rumpf, fester Fuß), Musterung
als Verlaufsansicht, „Nur Stärke“-Rückfrage, Kurz-Liste ab 8 Personen, Layout bei
großer Schrift und Zoom, Zurück-Verlauf, Geräteuhr-Warnung.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener Browser-Kontext.
Viewports 360 × 640 (Grundeinstellung), 320 × 568, 640 × 360 quer; Standard- und
Feld-Modus (`eeb.anzeigemodus.v1`); 100 % und „200 %“ Schrift
(`html { font-size: 200% !important }`); Browser-Zoom 200 % nachgestellt
(halbierter CSS-Viewport, doppelte Pixeldichte: 180 × 320, 160 × 284,
320 × 180). Das ist kein echter Chrome-Zoom. Beim Lesen der Zoom-Messwerte gilt:
Ein CSS-Pixel ist dort doppelt so groß wie am Gerät ohne Zoom; „45 px breit“ sind
am Finger rund 90 px, die Beschriftung muss trotzdem in den Knopf passen.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false` und aktuellem
`stand`: `eeb.entwurf.v1` (Großbogen mit 38 Personen), `eeb.einsaetze.v1`
(Sammlung „Hochwasser Musterstadt“ aus sechs Beispielbögen, einmal mit
`vomPapier` je Eintrag), `eeb.vorlagen.v1` (über „Als Vorlage speichern“ erzeugt),
`eeb.uhr.v1` (365 Tage alt, Sammlung 200 Tage alt). Der Zweitfenster-Fall entstand
durch einen zweiten Tab im selben Kontext, der den Entwurf im `localStorage`
änderte.

Blindprüfung: Die Berichte unter `docs/audits/` habe ich erst nach den ersten
Messungen (Startseite, Schritte 1 bis 6, Zielgrößen, Großschrift) gelesen.
Gemessen habe ich Rechtecke per `getBoundingClientRect` und Tipps per
`touchscreen.tap`. Maßstab wie in Runde 7: 44 px Mindestkante, 8 px Mindestabstand,
mit Arbeitshandschuh eher 48 px und 12 px. Elf weitere Prüfer nutzten den Server
gleichzeitig; Zeitmessungen sind unsicher. Zwei Tipps nacheinander an derselben
Stelle fallen in die Ortssperre (1,5 s); dort habe ich 1,8 bis 2 s gewartet.
Skripte und Bildschirmfotos liegen außerhalb des Repositorys im Scratchpad
(`runde8/g/`).

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, die echte
Bildschirmtastatur (nachgestellt nur durch einen niedrigeren Viewport, ohne
Größenänderung beim Fokus), Wischen und Ziehen, Safari/WebKit, native Datums- und
Zeitpicker (der Headless-Browser zeigt Datumsfelder als MM/TT/JJJJ), echter
Browser-Zoom und echte Systemschrift, das späte Zurückkehren eines eigenen
`back()` (nicht nachgestellt), R6-O9.

Kennzeichnung: **gemessen** heißt Zahl aus dem Browser, **beobachtet** heißt im
Ablauf oder auf dem Bildschirmfoto gesehen, **Risiko** heißt plausibel, aber nicht
nachgestellt.

## Urteil

Die Runde-7-Behebungen tragen. Der Papier-Abgleich verliert nichts mehr: „Später“
schließt nur das Formular, die Eingabe „77“ steht nach erneutem Öffnen und nach
einem Neuladen noch da, „Eingaben verwerfen…“ fragt zurück („Die Eingaben für
1 Einheit werden gelöscht. Sie stehen dann nur noch auf dem Papier.“).
„Für neuen Einsatz vorbereiten“ fragt zurück, nennt Zeitraum, Ort/Auftrag und
Sofortbedarf und trennt „Zurücksetzen“ von „Abbrechen, Bogen behalten“ um 41 px.
Der Lagemonitor hat am Telefon Knöpfe von 44 px Höhe. „Alle abwählen“ bleibt an
seinem Platz. In den Schritten 1, 2, 3, 5, 6 und der Einsatzansicht läuft bei
Feld-Modus und Zoom keine Seite mehr seitlich über. Die Zwei-Fenster-Leiste ist
kompakt, beide Entscheidungsknöpfe stehen im Bild.

Reibung bleibt an einer Stelle, die Runde 7 ausdrücklich verbessert hat: Die
Rückfragen sind bei nachgestelltem Browser-Zoom 200 % nicht mehr bedienbar
gebaut. Hochkant (180 × 320) stehen „Zurücksetzen“ und „Abbrechen“ nebeneinander
in einer 98 px breiten Spalte und überdecken sich; quer (320 × 180) ist vom
Rumpftext, der die Folgen nennt, keine Zeile mehr sichtbar (R8-G1). Dazu kommen
fünf P3-Reste. Es gibt keinen P0 und keinen P1. Alle Aufgaben (Personal
durchblättern, entfernen, auf „Nur Stärke“ umstellen, Bogen übergeben, Einsatz
öffnen, Papier abgleichen, Lagemonitor schließen, Vorlage mustern) sind ohne
fremde Hilfe zu schaffen.

## Befunde

### R8-G1 [P2] Rückfragen bei Browser-Zoom 200 %: Knöpfe überdecken sich (hochkant), der Rumpf mit den Folgen ist weg (quer)

**Priorität:** P2

**Kennzeichnung:** gemessen und beobachtet (Nachstellung des Zooms; die
Rückfrage „Für neuen Einsatz vorbereiten“ stellvertretend für alle Rückfragen
der Klasse `abfrage`, Verwerfen, Person entfernen, Einsatz löschen, „Nur Stärke“
nutzen dieselbe Bauart).

**Fundstelle / Aufgabe:** Schritt 6 → „Bogen übergeben…“ → „Für neuen Einsatz
vorbereiten“ → Rückfrage. Elemente `dialog.abfrage`, `.abfrage-fuss`,
`.abfrage-weg`. Bildschirmfotos `g1-telefonZ.png`, `g1-querZ.png`.

**Beobachtung:** 180 × 320 (Zoom 200 % hochkant): Das Fenster ist 148 px breit,
der Fuß 98 px breit und als Zeile angeordnet. „Zurücksetzen“ (45 × 44 px) und
„Abbrechen, Bogen behalten“ (45 × 81 px) stehen nebeneinander; die Beschriftung
„Zurücksetzen“ läuft aus dem Knopf und liegt unter dem Rahmen von „Abbrechen“,
dessen Text („Abbrechen, / Bogen / behalten“) in den linken Knopf hineinreicht.
Von der Folgenbeschreibung ist eine Zeile sichtbar („Zurückgesetz…“), der Rest
liegt unter dem festen Fuß. Die Überschrift bricht mitten im Wort
(„vorbereit / en?“). 320 × 180 (Zoom 200 % quer): Fenster 148 px hoch, der Fuß
81 px, die Überschrift füllt den Rest; vom Rumpftext ist keine Zeile sichtbar
(Text beginnt bei y 98, Fuß bei y 66 bis 147). Die Knöpfe sind dort 115 px breit
und lesbar. 160 × 284 (Zoom 200 %, 320-px-Telefon): Fuß 78 px breit, „Zurücksetzen“
35 × 44 px. Bei 360 × 640, 320 × 568 und 320 × 568 mit 200 % Schrift stehen die
Knöpfe untereinander, 238 bis 278 px breit, der Rumpf ist sichtbar: dort in
Ordnung.

**Erwartung der Rolle:** Eine Rückfrage, die eine Handlung mit Datenverlust
absichert, zeigt, was verloren geht, und hat zwei getrennte, lesbare Knöpfe, auch
wenn jemand die Seite am Telefon auf 200 % gezogen hat.

**Auswirkung im Einsatz:** Wer wegen Sonne, Brille oder Handschuh den Browser auf
200 % stellt, soll mit „Zurücksetzen“ Ort/Auftrag und Sofortbedarf löschen,
ohne den Satz darüber zu sehen, und trifft im überlappenden Knopfpaar leicht den
falschen. Die Rückfrage verliert dort ihre Schutzwirkung; die Daten sind danach
nur durch Neutippen zurückzuholen.

**Empfehlung:** Den Fuß nicht allein von der Bildhöhe abhängig als Zeile setzen,
sondern auch von der Breite: Knöpfe bei schmaler Spalte untereinander, volle
Breite. Dem Rumpf eine Mindesthöhe von mehreren Zeilen lassen oder bei niedrigem
Bild die Knopfleiste mitrollen lassen. Überschrift nicht mitten im Wort brechen.

**Nachprüfung:** 180 × 320, 160 × 284 und 320 × 180: Rückfrage „Für neuen Einsatz
vorbereiten“ öffnen. Beide Knöpfe überlappungsfrei, Beschriftung innerhalb des
Knopfs, mindestens drei Zeilen Rumpf sichtbar oder per Rollen erreichbar.

### R8-G2 [P3] Zoom 200 % hochkant: Fußleiste des Assistenten nimmt 38 bis 44 % der Bildhöhe, „Weiter“ nur als Pfeil (Rest von R6-G2)

**Priorität:** P3

**Kennzeichnung:** gemessen (Nachstellung).

**Fundstelle / Aufgabe:** Assistent Schritt 2 (und alle weiteren), feste Leiste
`nav.assistent-nav`.

**Beobachtung:** 180 × 320: Leiste 122 px hoch (38 %), im Feld-Modus 140 px
(44 %); 160 × 284: 122 px (43 %); 320 × 180 quer: 56 px (31 %). Die Leiste hat
zwei Reihen: oben „→“ als einzige Beschriftung des Hauptknopfs (164 × 44 px),
darunter „←“ (44 × 44 px) und „◐“ (44 × 47 px). Die Eingabefelder sind dort
114 px breit (63 % der Bildbreite). Der Wert ist gegenüber Runde 7 (128 px, 40 %)
um 6 px gesunken.

**Erwartung der Rolle:** Ein Viertel der Bildhöhe oder weniger, der Hauptknopf
trägt sein Wort.

**Auswirkung im Einsatz:** Bei Zoom bleibt ein Streifen von rund 100 px für das
Formular; man rollt mehr und sieht beim Tippen weniger. Keine Fehlbedienung.
„→“ allein ist verständlich, aber der Wegfall von „Weiter“ ist ein Unterschied zu
allen anderen Größen.

**Empfehlung:** Zweite Reihe nur bei Bedarf, „←“ und „◐“ in den Kopf legen oder
Leiste bei sehr niedrigem Bild einklappen.

**Nachprüfung:** 180 × 320 und 160 × 284: Leiste höchstens ein Viertel der
Bildhöhe.

### R8-G3 [P3] Skip-Link ragt bei 200 % Schrift und 320 px Breite als weißer Streifen ins Bild

**Priorität:** P3

**Kennzeichnung:** gemessen und beobachtet (320 × 568, `html { font-size: 200% }`,
alle Schritte; Bildschirmfoto `f1-kleinG1.png`, `e1-kleinGF.png`).

**Fundstelle / Aufgabe:** „Zum Inhalt springen“ (`.sprungmarke`), oben im Dokument.

**Beobachtung:** Der Link ist `position: absolute; top: -96px` und 118 px hoch,
weil der Text in 304 px umbricht. Er endet bei y +22: ein 22 px hoher weißer
Streifen liegt über dem oberen Bildrand. Bei Schrift 100 % (39 px hoch, top -48 px)
und bei 360 px Breite mit 200 % (76 px hoch, top -96 px) ist der Link vollständig
außerhalb. Im Zweitfenster-Zustand überdeckt der Streifen die erste Zeile der
Warnleiste („Hier wird nichts gespeichert“); die Leiste liegt dort darunter.

**Erwartung der Rolle:** Nichts Unbenanntes am oberen Bildrand; die Warnung ist
vollständig lesbar.

**Auswirkung im Einsatz:** Ein Streifen ohne Inhalt, der auf eine Bedienstelle
oder Warnung drückt. Kein Verlust; im Zweitfenster-Zustand ist die erste Warnzeile
teils verdeckt, die Knöpfe sind frei.

**Empfehlung:** Den Link bei jeder Schriftgröße vollständig aus dem Bild nehmen,
wenn er nicht den Fokus hat.

**Nachprüfung:** 320 × 568 mit 200 % Schrift: Oberkante des Links bei Fokus nicht
im Bild, sonst vollständig darüber (`bottom` kleiner 0).

### R8-G4 [P3] Musterung: Stärkeleiste, Kopfzeile und Fußleiste nehmen 38 % (Telefon) bis 52 % (200 %, 320 px) der Bildhöhe

**Priorität:** P3

**Kennzeichnung:** gemessen (Vorlage mit 38 Personen, Rollen auf Mitte der Liste).

**Fundstelle / Aufgabe:** Startseite → „Einsatz vorbereiten: …“ → Liste
„Personal (38/38)“. Elemente `section.karte.staerke-leiste` (klebend),
`div.kopfzeile.klebend`, `footer.nav` („Bogen anlegen · 38 Pers · 10 Fz“).

**Beobachtung:** 360 × 640: 85 px + 93 px + 67 px = 245 px (38 %); darunter rund
vier Personenzeilen (je 64 px, Zeilen ohne Lücke, durch Linien getrennt).
320 × 568 mit 200 % Schrift: 96 px + 129 px + 73 px = 298 px (52 %); sichtbar sind
zwei Personen und ein Teil der dritten (Bildschirmfoto `u1-kleinG.png`). Die
Haken sind 52 × 52 px, die Zeile ist als Ganzes Ziel.

**Erwartung der Rolle:** Beim Durchgehen von 38 Personen bleibt die Liste der
größere Teil des Bildes.

**Auswirkung im Einsatz:** Mehr Rollen, mehr Tipps an die Zeilengrenze; bei
Handschuh trifft man leichter die Nachbarzeile (sichtbar am Haken und an der
Stärkeleiste, mit einem Tipp rückholbar). Keine Datenfolge.

**Empfehlung:** Stärkeleiste und Kopfzeile bei kleinem Bild nicht beide kleben
lassen; „Alle abwählen“ neben die Überschrift legen, wo die Breite reicht.

**Nachprüfung:** 320 × 568 mit 200 % Schrift: klebende Elemente zusammen höchstens
ein Drittel der Bildhöhe.

### R8-G5 [P3] Quer: Bestätigen und „Abbrechen“ stehen nebeneinander, 8 px Lücke, gleich große Flächen

**Priorität:** P3

**Kennzeichnung:** gemessen (640 × 360).

**Fundstelle / Aufgabe:** Rückfragen „Verwerfen“, „Person entfernen“, „Einsatz
löschen“ (Knopf „In den Papierkorb“), „Für neuen Einsatz vorbereiten“.

**Beobachtung:** Quer liegen die zwei Knöpfe je 243 px breit und 44 px hoch
nebeneinander, die Lücke ist 8 px (x 316 bis 324). Hochkant stehen sie
untereinander mit 41 px Lücke (Verwerfen, Person entfernen, Einsatz löschen: y 404
zu 445, 391 zu 432, 379 zu 420) bzw. 12 px („Nur Stärke melden“: y 405 zu 417).
Die Rückfragen verlangen sonst einen eigenen Tipp, den Nachtipp-Schutz gibt es
hier nicht, die Folge steht im Text darüber.

**Erwartung der Rolle:** Die Aktion mit Folge liegt nicht 8 px neben dem Abbruch.

**Auswirkung im Einsatz:** Ein Handschuhfinger, der den Abbruch sucht, trifft quer
leicht „Person entfernen“. Dort hilft „Rückgängig“ für Personen; bei „Verwerfen“
und „In den Papierkorb“ bleibt der Bogen bzw. Einsatz erreichbar (Papierkorb,
„zuletzt geschlossener Bogen“). Risiko, nicht als Fehltipp nachgestellt.

**Empfehlung:** Quer die gefährliche Wahl mit mindestens 12 bis 16 px Abstand
setzen oder „Abbrechen“ an die dem Daumen nähere Seite.

**Nachprüfung:** 640 × 360: Abstand zwischen Folgeknopf und „Abbrechen“ mindestens
12 px.

### R8-G6 [P3] Papier-Abgleich: „Eingaben verwerfen…“ ist ein Textlink von 33 px Höhe, 8 px neben „Später“

**Priorität:** P3

**Kennzeichnung:** gemessen (360 × 640, Sammlung mit sechs Einheiten „vom Papier“).

**Fundstelle / Aufgabe:** Einsatzansicht → „Lage vom Papier abgleichen…“ → Fußzeile
mit „Abgleich übernehmen“ (172 × 44 px, y 3 017), „Später“ (74 × 44 px, y 3 089),
„Eingaben verwerfen…“ (155 × 33 px, x 115, y 3 094).

**Beobachtung:** „Eingaben verwerfen…“ ist als Link gezeichnet, unter dem 44-px-
Minimum und mit 8 px Lücke zu „Später“. Der Tipp öffnet die Rückfrage („Die Eingaben
für 1 Einheit werden gelöscht“, „Verwerfen“, „Abbrechen“); der Abstand von
„Abgleich übernehmen“ zu „Später“ ist 12 px. Damit hält die Behebung von R7-G1.

**Erwartung der Rolle:** Jedes Ziel der Fußzeile hat Knopfgröße.

**Auswirkung im Einsatz:** Wer „Später“ treffen will und daneben tippt, öffnet nur
die Rückfrage. Kein Verlust, ein Fehlversuch mehr.

**Empfehlung:** Den Link auf 44 px Höhe bringen.

**Nachprüfung:** „Eingaben verwerfen…“ mindestens 44 px hoch.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Papier-Abgleich:** „77“ im ersten Feld, „Später“, Öffnen: Wert steht. Neuladen,
  Öffnen: Wert steht (Sitzungsspeicher). „Eingaben verwerfen…“ fragt zurück.
- **„Für neuen Einsatz vorbereiten“:** Rückfrage mit Zeitraum, Ort/Auftrag, Sofortbedarf,
  Hinweis „lässt sich hier nicht zurücknehmen“; Knöpfe 278 × 44 px, 41 px Lücke.
- **Lagemonitor (`/?lagemonitor=<id>`):** 360 × 640, 320 × 568, 640 × 360, 360 × 640 mit
  200 % Schrift: „Einsatzdaten“, „Optionen“ je 44 px hoch, 14 px Lücke; „Vollbild“ (80 px),
  „Schließen“ (97 px), Stufe-Knopf je 44 px hoch, 7 bis 8 px Lücke; kein seitlicher
  Überlauf. „Schließen“ steht am Seitenfuß unter der Tabelle (Rollen nötig).
- **Zwei-Fenster-Leiste:** 360 × 640: „Anderen Stand laden“ und „Meine Fassung behalten“
  je 164 × 44 px, beide ohne Aufklappen im Bild, Leiste ca. ein Sechstel der Höhe;
  320 × 568 mit 200 % und Feld: Knöpfe 128 × 52 px, Leiste ca. ein Viertel.
- **Rückfragen hochkant (360 × 640, 320 × 568, 200 % Schrift):** Rumpf, Fuß, Knöpfe
  untereinander, 238 bis 278 px breit, kein Überlauf.
- **„Nur Stärke“-Rückfrage:** nennt die Folge („38 erfasste Personen zählen dann nicht
  mehr einzeln …“), „Nur Stärke melden“ 278 × 44 px, „Abbrechen“ 12 px darunter.
- **Musterung:** „Alle abwählen“ bleibt bei (174, 407), der Text wechselt zu „Alle
  anhaken“; der zweite Tipp nach 2 s an gleicher Stelle schaltet bewusst zurück
  (0/38 → 38/38), keine einzelne Person wird angehakt.
- **Kurz-Liste:** „▲ ▼ ⇑“ je 44 × 44 px mit 8 px (Hochformat, x 33, 89, 145), „✕“ bei
  x 283; bei 200 % Schrift 50 × 88 px mit 12 px Lücke. Karten ab 8 Personen als
  Kurz-Liste.
- **Kein Überlauf** in Schritten 1, 2, 3, 5, 6 und der Einsatzansicht bei Feld-Modus,
  Zoom (180 × 320, 160 × 284, 320 × 180) und 200 % Schrift.
- **Geräteuhr-Warnung (Startseite):** 360 × 640: Knöpfe 143 × 44 px bei y 362, im Bild;
  320 × 568: y 352; quer y 236; 320 × 568 mit 200 % und Feld: y 461 von 568.
- **Zurück-Verlauf:** Rückfrage, dann Fenster, dann Startseite, dann Verlassen der App;
  Entwurf bleibt erhalten.
- **Fußleiste und Seitenende:** Einsatzansicht hochkant: letzter Link endet bei y 560,
  die Leiste beginnt bei y 583. Quer überdeckt die Ecke „◐“ bei Rollen in
  100-px-Schritten kein Ziel (0 Treffer, Standard und Feld).
- **Eingabe bei niedrigem Bild (360 × 300, 640 × 180):** das Feld bleibt sichtbar, die
  Leiste verdeckt es nicht (320 × 260 mit 200 %: 1 px Überschneidung).
- **Keine Pflichtgesten**; Namen und Zahlen werden getippt, wo es nötig ist.

## Abgleich mit Runde 7

Grundlage: [../runde-7/handschuh-bedienung.md](../runde-7/handschuh-bedienung.md)
mit „Stand der Behebung“ in der README von Runde 7.

| Runde-7-Befund | Stand laut README | Bewertung Runde 8 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R7-G1 Papier-Abgleich „Später“ verwirft (P2) | behoben | **hält** | Eingabe überlebt „Später“ und Neuladen; „Eingaben verwerfen…“ fragt zurück; Lücke Hauptknopf zu „Später“ 12 px. Rest: Link 33 px hoch (R8-G6). |
| R7-G2 „Für neuen Einsatz vorbereiten“ ohne Rückfrage (P2) | behoben (kein „Rückgängig“) | **hält** | Rückfrage nennt Felder und Folge; 41 px zwischen den Knöpfen hochkant. Bei Zoom 200 % unbedienbar gebaut (R8-G1). |
| R7-G3 Lagemonitor am Telefon (P2) | behoben | **hält** | Alle Knöpfe 44 px hoch; Lücken 7 bis 14 px. |
| R7-G4 Ecke „◐“ hochkant (P3) | teilweise | **Grenze unverändert** | Quer 0 überdeckte Ziele; hochkant liegt die 57 px hohe feste Leiste beim Rollen über Inhalt (Bauart); Seitenende erreichbar. |
| R7-G5 Zoom 200 % Feld-Modus zu breit (P3) | behoben | **hält** | `scrollWidth` gleich Bildbreite in Schritt 1, 2, 3, 5, 6 und der Einsatzansicht, Feld 180 × 320, 160 × 284, 320 × 180. |
| R7-G6 Zwei-Fenster-Leiste 34 bis 50 % (P3) | behoben | **hält** | Ca. 16 % (360 × 640) und ca. 25 % (320 × 568, 200 %, Feld); Knöpfe 44 bis 52 px hoch. Nebenwirkung: Skip-Link-Streifen (R8-G3). |
| R7-G7 „Alle abwählen“ springt 33 px (P3) | behoben | **hält** | Knopf bei y 407 vor und nach dem Tipp; zweiter Tipp nach 2 s schaltet zurück, kein Einzelhaken. |
| R7-G8 Geräteuhr-Rückfrage unter dem Bildrand (P3) | teilweise | **Grenze, besser** | Im Bild bei 360 × 640, 320 × 568, quer, 320 × 568 mit 200 % und Feld. Zoom 180 × 320: Knöpfe bei y 507 von 320, 53 × 50 px. |
| R7-G9 „Bedarf:“ bricht im Wort (P3) | behoben | **hält** | „Bedarf:“ steht vollständig in einer Zeile (360 × 640). |
| R6-G2 Zoom: Leiste füllt die Hälfte | teilweise | **hält nur teilweise** | 122 px (38 %), Feld 140 px (44 %), 160 × 284 43 %, quer 31 %; „Weiter“ nur als Pfeil (R8-G2). |
| R6-G6 Schrittleiste ohne Lücke | offen | **offen** | 72/53/53/53/53/44 px, 0 px Lücke (360 px); bei 320 px mit 200 % Schrift 41 bis 43 px breit. |
| R7-N9 Ziffern der Schrittleiste | teilweise | **Grenze, Stand** | „← Zurück zu Schritt 5“ (259 × 44 px) steht am Ende der Übersicht; Ziffern der Leiste unverändert. |
| R6-O9, R7-N1 | Grenzen | **nicht geprüft** | außerhalb der Rolle (Handschuh-Bedienung). |
| Rückfragen: rollender Rumpf, fester Fuß | behoben | **hält, außer bei Zoom** | Hochkant bei 100 % und 200 % Schrift in Ordnung; Zoom 200 % siehe R8-G1. |
| Zurück-Verlauf (Fenster, Schritt, Start) | – | **hält** | Reihenfolge und Entwurf geprüft; das späte Zurückkehren eines eigenen `back()` nicht nachgestellt. |

## Abschluss

- **Aufgabe geschafft:** ja. Alle Abläufe der Rolle bei 100 % Schrift und
  200 % Schrift; bei nachgestelltem Browser-Zoom 200 % nur mit Umweg in den
  Rückfragen (R8-G1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Eine Rückfrage, die bei Zoom 200 % ihren Rumpf
  verliert, sieht wie ein beliebiges Fenster mit zwei Knöpfen aus; „Zurücksetzen“
  steht ohne den Satz zur Folge.
- **Größtes Einsatzrisiko:** Rückfragen mit Datenfolge sind bei Browser-Zoom 200 %
  nicht lesbar und nicht sicher zu treffen (R8-G1).
- **Top-Priorität für die nächste Iteration:** Rückfragen bei schmaler Spalte und
  niedrigem Bild: Knöpfe untereinander in voller Breite, Rumpf mit sichtbaren Zeilen.

## Zusammenfassung

Befunde: **P0 0 · P1 0 · P2 1 · P3 5**. Neu: R8-G1 (P2), R8-G2 bis R8-G6 (P3).
Von den Runde-7-Befunden halten G1, G2, G3, G5, G6, G7 und G9; Grenzen bleiben G4
und G8 (besser); R6-G2 hält nur teilweise, R6-G6 bleibt offen.
