# Audit „Mobile UI", Schwerpunkt Beispielbögen (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-11-08 · Prüfgegenstand: Live-Seite
`https://erfassungsbogen.app/` (Stand `main`, Commit `0dd56d4`, frisch deployt), nur der Bereich
Beispielbögen: Abschnitt „Beispielbögen" auf der Startseite und Dialog „Beispielbögen" ·
Zählung: **P0 0 · P1 1 · P2 2 · P3 6 · Hinweise 4**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`,
`docs/audits/runde-21/mobile-ui.md` (Aufbau), `DESIGN.md` (Kennfarben-, Deckel- und
Deckzeilen-Regel, „Eine primäre Aktion je Ansicht"), zum Nachschlagen `src/app/fusszeile.tsx`
(Dialog), `src/app/app.tsx` (`BeispielboegenStart`) und die Regeln `beispiel-*`, `dialog.breit`,
`kopfzeile` in `index.html`.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), Locale de-DE,
`deviceScaleFactor` 1, `hasTouch`, `isMobile` für Telefon-Viewports. Viewports 320 x 568,
360 x 640, 390 x 844, quer 844 x 390, Tablet 820 x 1180; für die Umbruchgrenze der Tabelle
zusätzlich 480, 544, 560, 600, 700, 768, 1024 und 1280 px Breite. Ansichten „Standard" und „Feld"
(über „Ansicht: Standard ▾"). Große Schrift: Grundschrift des Browsers per CDP
`Page.setFontSizes` auf 24 px (150 %) und 32 px (200 %); die App setzt dann selbst
`html.schrift-gross`. Kein Eingriff ins DOM; Skripte lesen nur Maße, Fokus und Scrollstand.
Wege: Startseite → „Beispielbögen ansehen" → Ordner ASB (4 Bögen), Katastrophenschutz,
Praktische Ausbildung, THW (101 Bögen direkt), THW → „Alle Einheiten aller Ortsverbände" →
Baden-Württemberg → RSt Villingen-Schwenningen → OV Bad Säckingen (fünf Ebenen); „‹ Zurück",
Pfad „Alle", Esc und „Schließen"; Tastatur (Enter/Tab/Umschalt+Tab) bei 390 x 844. Skripte und
Bildschirmfotos unter `/tmp/claude-0/audit-mobile/`.

Annahmen: Zustand frischer Browser (Erststart) und einmal mit angelegter Sammlung „Testlage".
Die Beispielbögen kommen vom Live-Server; Ladezeiten entsprechen der Prüfumgebung, nicht einem
schwachen Mobilnetz. „Anzeigen", „PDF" und „Link" wurden nicht ausgelöst (außerhalb des
Schwerpunkts Layout/Bedienung des Dialogs).

Nicht prüfbar: echte Safe-Area-Werte (Chromium meldet `env(safe-area-inset-*)` = 0; siehe
Hinweis unten), WebKit/iOS Safari (u. a. Scroll-Verankerung beim Nachladen, die Chromium hat),
echte Systemschrift-Skalierung von Android/iOS (nur über die Browser-Grundschrift nachgestellt),
Bildschirmleser-Ansagen (nur Fokus und `role=status` gemessen), Feld-Ansicht im Querformat
(Umschalter im Testlauf quer nicht erreicht), Handschuhe, Licht.

## Was im Browser hält (nicht gemeldet)

- Kein seitlicher Überlauf der Seite in allen Viewports; im Dialog unter 545 px Breite kein
  seitliches Rollen (Karten statt Tabelle).
- Keine Bedienziele unter 44 px Höhe im Dialog (Register-Zeilen 53 px, Aktionsknöpfe 44 px,
  in „Feld" 54 px; einzige Ausnahme in der Breite: „Alle", siehe BB-M4).
- Kopfzeile mit „Schließen" klebt beim Rollen in allen Viewports (bei 360 x 640 nach 3.647 px
  Rollen weiter bei 17 px oben).
- Ordnerwechsel setzt die Dialog-Rollposition auf 0 (vorher 23 px gerollt, danach 0): Pfadleiste
  und Register stehen nach dem Tipp oben im Bild.
- Esc und „Schließen" schließen den Dialog, der Fokus kehrt auf „Beispielbögen ansehen" zurück,
  die Startseite steht an derselben Stelle (Rollposition 1.593 px vor und nach dem Dialog).
- Seite hinter dem Dialog rollt nicht mit (`overflow: hidden` auf `html`).
- Nachladen der 101 THW-Bögen (Zählung „Angaben werden geladen … 2 von 101" bis „90 von 101"):
  in Chromium bleibt die gerade gelesene Karte trotz wachsender Höhe (24.992 → 30.306 px) an
  derselben Stelle (112 px).
- Taktische Zeichen laden nach und halten ihren Platz (30 x 30 px), keine fehlgeschlagenen
  Anfragen.

## Befunde

### BB-M1 [P1] Register bei großer Schrift: Ordnernamen zerfallen in Einzelbuchstaben, „THW" liegt unter der Bogenzahl

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu (neu gestaltetes Register)

**Ort:** Dialog „Beispielbögen", oberste Ebene und jede Ordnerebene; 360 x 640 und 320 x 568
mit 200 % und 150 % Schrift, abgeschwächt auch 320 x 568 bei normaler Schrift.

**Beobachtung (gemessen):** Bei 200 % (Grundschrift 32 px, `html.schrift-gross`) bleibt die
Bogenzahl rechts in voller Breite stehen (`.beispiel-register-zahl` 118 bis 185 px), der Name
bekommt den Rest: „ASB" 58 px, „Katastrophenschutz" 24 px, „THW" **0 px**. Wegen
`overflow-wrap: anywhere` bricht der Name nach jedem Buchstaben: „AS / B", „BB / K / (Bu …",
„K / a / t / a / s / tr / o / p / h …" (Zeile 849 px hoch), „Praktische Ausbildung" 513 px.
„THW" (Name 0 px breit, Inhalt 31 px) ragt mit dem „T" in die Zahl „3.634 Bögen", „H" und „W"
stehen darunter. Bei 150 % (24 px) brechen bei 320 und 360 px „Katastrophenschutz" und
„Praktische Ausbildung" mitten im Wort (Namen 47 bis 99 px breit). Bei 320 x 568 und normaler
Schrift: „(Bundeseinheite / n)" und „Katastrophens / chutz".

**Folge:** Wer die Systemschrift groß gestellt hat, kann die Ordner nicht lesen; ausgerechnet
„THW" ist nur als Buchstabensäule neben der Zahl zu erkennen. Die Liste wird mehrere Bildschirme
lang (oberste Ebene 3.286 px statt 670 px). Die Navigation zu den Beispielbögen ist für diese
Nutzer praktisch nur noch durch Raten bedienbar.

**Empfehlung:** Bogenzahl unter den Namen umbrechen lassen, sobald der Platz nicht reicht (oder
bei großer Schrift grundsätzlich in eine zweite Zeile), und den Namen nur an Wortgrenzen bzw.
mit Silbentrennung umbrechen statt `anywhere`. Die Zahl nach der Deckel-Regel in px deckeln.

**Nachprüfung:** 360 x 640 mit 32 px Grundschrift: jeder Ordnername steht in ganzen Wörtern,
keine Zeile über 2 Zeilen Text pro Wort, `.beispiel-register-name` nie schmaler als sein
längstes Wort; bei 320 px normaler Schrift „Katastrophenschutz" ungebrochen.

### BB-M2 [P2] Tablet hoch und Telefon quer: Tabelle breiter als der Dialog, „Link" (teils auch „PDF") liegt verdeckt außerhalb

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu

**Ort:** Dialog „Beispielbögen", jeder Ordner mit Bögen (geprüft ASB, OV Bad Säckingen);
Fensterbreite 545 bis etwa 900 px, also 820 x 1180, 768 px und quer 844 x 390.

**Beobachtung (gemessen):** Die Umschaltung Karten/Tabelle hängt an `@media (max-width: 34rem)`
(544 px Fenster), nicht an der Breite des Dialogs. Ab 560 px steht die Tabelle, ihr Inhalt ist
aber 686 px breit: Rahmen 478 px (560), 494 (600), 510 (700), 564 (768), 606 (820), 625 (844).
Der Knopf „Link" endet bei 718 bis 784 px, der Rahmen bei 519 bis 734 px; bei 560 bis 700 px
liegt auch „PDF" teilweise draußen. Im Bild steht bei 820 x 1180 und 844 x 390 rechts ein
angeschnittenes Knopfende ohne Rollhinweis (`::after` leer). Die Spalte „Herkunft" bricht auf
sechs Zeilen („ASB- / Kreisverband / Rheindorf e. V. / Landesverband / Nordrhein- / Westfalen"),
jede Zeile 150 px hoch. Erst ab etwa 1024 px Fenster passt die Tabelle (769 von 769 px).

**Folge:** Auf Tablets im Hochformat und Telefonen quer ist „Link" (Bogen weitergeben) nur durch
seitliches Wischen in der Tabelle erreichbar, und dass es diese dritte Aktion gibt, sieht man
nicht. Die Tabelle ist dabei weniger lesbar als die Karten, die bei 544 px noch passen.

**Empfehlung:** Den Wechsel Karten/Tabelle an die Breite des Dialogs binden (Container-Abfrage,
wie `DESIGN.md` in der Deckel-Regel für „Karten statt Tabellenzeile" verlangt) und die Schwelle
so setzen, dass Einheit, Herkunft, Stärke und drei Knöpfe ohne Rollen passen; sonst Karten.

**Nachprüfung:** Bei 560, 768, 820 und 844 px: `scrollWidth` des Tabellenrahmens höchstens
`clientWidth`, „Link" vollständig im Bild; Herkunft höchstens drei Zeilen.

### BB-M3 [P2] Ordnerwechsel lässt den Fokus auf die Seite fallen; der neue Ordner wird nicht angesagt

**Typ:** Bedienung
**Neu oder alt (Verweis):** neu

**Ort:** Dialog „Beispielbögen", Tipp oder Enter auf eine Register-Zeile, auf „Alle" in der
Pfadleiste und „‹ Zurück" von der ersten Ebene; alle Viewports (gemessen 360 x 640, 390 x 844).

**Beobachtung (gemessen):** Beim Öffnen steht der Fokus auf „Schließen" (sinnvoll). Nach dem
Tipp auf eine Register-Zeile ist `document.activeElement` `<body>` (außerhalb des Dialogs), weil
die angetippte Zeile aus dem DOM verschwindet. Ebenso nach „Alle" und nach „‹ Zurück" zur
obersten Ebene (die Pfadleiste fällt weg). Mit Tastatur: nach Enter auf „THW" springt Tab auf
„Alle Einheiten aller Ortsverbände" und überspringt „‹ Zurück" und den Pfad; Umschalt+Tab landet
auf dem Pfad-Link „THW". Eine Ansage des neuen Ordners gibt es nicht; `role="status"` trägt nur
die Ladezeile „Angaben werden geladen …", die bei kleinen Ordnern gar nicht erscheint.
„‹ Zurück" innerhalb tieferer Ebenen behält den Fokus (der Knopf bleibt stehen).

**Folge:** Mit Bildschirmleser oder Tastatur verliert man nach jedem Ordnerwechsel die Stelle;
VoiceOver/TalkBack setzen je nach Gerät am Seitenanfang hinter dem Dialog wieder an. Wer den
Ordner gewechselt hat, erfährt nicht, wo er jetzt ist und wie viele Bögen dort liegen.

**Empfehlung:** Nach jedem Ordnerwechsel den Fokus gezielt setzen, etwa auf den aktuellen
Ordnernamen in der Pfadleiste (`aria-current`) oder die Bogenzahl, und beim Rückweg auf die
Zeile des Ordners, aus dem man kam. Die Rollposition bleibt dabei wie heute oben.

**Nachprüfung:** Nach Tipp auf „ASB", „Alle" und „‹ Zurück": `activeElement` liegt im Dialog
und benennt den neuen Ordner; nach „‹ Zurück" steht der Fokus auf der vorher geöffneten Zeile.

### BB-M4 [P3] Tiefe Ordner: Pfadleiste nimmt vier bis fünf Zeilen, „›" im Ordnernamen täuscht weitere Ebenen vor

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu

**Ort:** THW → „Alle Einheiten aller Ortsverbände (LV › RSt › OV)" → Baden-Württemberg →
RSt Villingen-Schwenningen → OV Bad Säckingen; 320 x 568, 360 x 640, 390 x 844, 844 x 390.

**Beobachtung (gemessen):** „‹ Zurück" steht in einer eigenen Zeile, darunter der Pfad in vier
Zeilen; jede umgebrochene Stufe beginnt mit einem freistehenden „›" am linken Rand. Der
Ordnername „Alle Einheiten aller Ortsverbände (LV › RSt › OV)" enthält selbst dasselbe Zeichen
„›" wie der Pfad-Trenner und liest sich wie drei weitere Stufen. Erste Karte: bei 320 x 568 bei
481 von 534 px Dialoghöhe (nur der Titel der Karte im Bild), bei 360 x 640 bei 448 von 606, quer
844 x 390 bei 333 von 356 px (nur der Tabellenkopf, keine Zeile). Der Pfad-Link „Alle" ist
24 px breit (44 px hoch), 12 px neben „‹ Zurück".

**Folge:** Im Ortsverband, dem Ziel der Suche, sieht man im ersten Bild fast nur Navigation.
Der Pfad ist schwer zu lesen; wer „LV › RSt › OV" für Stufen hält, tippt auf Text, der kein Link
ist.

**Empfehlung:** Im Ordnernamen ein anderes Zeichen oder Wort verwenden („LV, RSt, OV" bzw.
„nach Landesverband, Regionalstelle, Ortsverband"); auf schmalen Fenstern mittlere Stufen
zusammenfassen („Alle › … › RSt Villingen-Schwenningen › OV Bad Säckingen") und „‹ Zurück" mit
dem Pfad in einer Zeile halten.

**Nachprüfung:** OV Bad Säckingen bei 360 x 640: Pfadleiste höchstens zwei Zeilen, erste Karte
mit Aktionsknöpfen im ersten Bild; quer mindestens eine Tabellenzeile im ersten Bild.

### BB-M5 [P3] Karten am Telefon: „Link" allein in der zweiten Zeile, THW-Ordner rund 50 Bildschirme lang ohne Weg nach oben

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu

**Ort:** Ordner mit Bögen als Karten (unter 545 px), besonders THW (101 Bögen direkt im Ordner);
320 x 568, 360 x 640.

**Beobachtung (gemessen):** Die drei Knöpfe brauchen bei 360 px 104 + 72 + 71 px plus zwei
Abstände von 1,2 rem, der Platz in der Karte sind 278 px: „Link" bricht in eine eigene Zeile,
jede Karte ist 292 px hoch (ASB: 4 Karten 1.191 px). Im Ordner THW stehen unter der Zeile „Alle
Einheiten aller Ortsverbände" 101 Karten, Dialoginhalt 29.587 bis 30.306 px bei 606 px Höhe.
Pfadleiste und „‹ Zurück" kleben nicht; wer unten ist, muss den ganzen Weg zurückwischen, um den
Ordner zu wechseln (nur „Schließen" bleibt oben). Die Ladezeile („… 77 von 101") steht nur über
der ersten Karte.

**Folge:** Viel Wischen in einer Liste, deren Inhalt sich nur in Einheitstyp und Ort
unterscheidet; der Rückweg zum Register kostet ebenso viel.

**Empfehlung:** Die drei Knöpfe in einer Zeile halten (kleinerer Abstand zwischen Knöpfen
gleicher Wirkung oder gleich breite Drittel) und lange Ordner kürzen (Unterordner statt 101
loser Bögen, oder „nach oben" bzw. eine klebende Pfadleiste).

**Nachprüfung:** 360 x 640: Karte höchstens etwa 220 px; aus der Mitte des THW-Ordners ist
„‹ Zurück" ohne langes Wischen erreichbar.

### BB-M6 [P3] Dialog ändert beim Ordnerwechsel Höhe und Lage; „Schließen" springt

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu

**Ort:** Dialog „Beispielbögen", 820 x 1180 (Wurzel → ASB → THW), 360 x 640 (Wurzel →
„Praktische Ausbildung").

**Beobachtung (gemessen):** Der Dialog ist senkrecht mittig und so hoch wie sein Inhalt. Bei
820 x 1180: Wurzel 648 px hoch, Kopf bei 267 px; ASB 871 px, Kopf bei 155 px; THW volle Höhe.
Bei 360 x 640: Wurzel 606 px Innenhöhe, „Praktische Ausbildung" 517 px, die Pfadleiste steht
bei 189 statt 145 px; Kopfzeile und „Schließen" rutschen um rund 45 px nach unten.

**Folge:** Bei jedem Ordnerwechsel springt das ganze Fenster; der Daumen, der eben auf
„‹ Zurück" lag, trifft nach dem nächsten Wechsel daneben.

**Empfehlung:** Den breiten Dialog oben verankern oder mit fester Höhe (wie bei langen Ordnern
ohnehin erreicht) öffnen, sodass Kopf, Pfad und Register an derselben Stelle bleiben.

**Nachprüfung:** Wurzel → ASB → THW → Zurück bei 820 x 1180 und 360 x 640: Oberkante der
Kopfzeile ändert sich um höchstens 2 px.

### BB-M7 [P3] Startseite: drei gleich gefärbte Primärknöpfe, „Beispielbögen ansehen" klebt an der nächsten Überschrift

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu (Einstieg von der Fußzeile auf die Startseite verlegt)

**Ort:** Startseite, Erststart und mit Daten; 320 x 568 bis 820 x 1180.

**Beobachtung (gemessen):** Erststart: „Neuen Bogen erstellen", „Neue Einsatz-Sammlung…" (beide
oben in der Weiche, 55 px hoch) und „Beispielbögen ansehen" (44 px, bei 360 px auf 1.843 px)
tragen dieselbe Fläche `rgb(18, 39, 94)`. Mit einer Sammlung: „Öffnen", „Neuen Bogen erstellen"
und „Beispielbögen ansehen" (bei 2.054 px von 3.539). `DESIGN.md`: „Eine primäre Aktion je
Ansicht". Zwischen „Beispielbögen ansehen" (Unterkante 1.887) und der Überschrift „Absender für
übergebene Bögen" (1.899) liegen 12 px; über „Beispielbögen" selbst deutlich mehr.

**Folge:** Das Beiwerk „Beispiele ansehen" ist im Bild genauso laut wie die Arbeitsaktionen;
wer weiter unten auf der Seite steht, sieht eine dominante Aktion, die nicht die Hauptaufgabe
ist. Der Knopf wirkt wie der Anfang des Absender-Abschnitts.

**Empfehlung:** „Beispielbögen ansehen" als normalen (umrandeten) Knopf führen und vor der
nächsten Überschrift den üblichen Abschnittsabstand setzen.

**Nachprüfung:** Auf der Startseite genau eine Fläche in Kennfarbe je Bereich der Weiche, keine
im Beispielbögen-Abschnitt; Abstand Knopf → nächste Überschrift wie zwischen den übrigen
Abschnitten.

### BB-M8 [P3] Ordnernamen uneinheitlich: „BADENWUERTTEMBERG", „NORDRHEIN WESTFALEN" neben „Brandenburg"

**Typ:** Text
**Neu oder alt (Verweis):** neu

**Ort:** Dialog „Beispielbögen" → Katastrophenschutz; 360 x 640 (gilt für alle Viewports).

**Beobachtung:** Register: „BADENWUERTTEMBERG", „BAYERN", „BERLIN", „Brandenburg", „HESSEN",
„MECKLENBURG VORPOMMERN", „Niedersachsen", „NORDRHEIN WESTFALEN", „RHEINLAND PFALZ", „SAARLAND",
„Sachsen", „Thüringen". Unter THW heißen dieselben Länder „Baden-Württemberg",
„Nordrhein-Westfalen". Bei 360 px bricht „BADENWUERTTEM / BERG" mitten im Wort.

**Folge:** Die Liste wirkt wie Rohdaten; Versalien sind am Telefon schwerer zu überfliegen und
brechen schneller um. Dieselben Länder sind je Organisation anders geschrieben.

**Empfehlung:** Ordnernamen wie unter THW ausschreiben (Umlaute, Bindestrich, normale
Groß-/Kleinschreibung), etwa über die Anzeigenamen der Ordner.

**Nachprüfung:** Katastrophenschutz-Register: alle Länder in derselben Schreibweise wie unter THW.

### BB-M9 [P3] 200 % Schrift: Erklärung lauter als der Dialogtitel, Kopf und Erklärung füllen das erste Bild

**Typ:** Layout/Abstand
**Neu oder alt (Verweis):** neu

**Ort:** Dialog „Beispielbögen", 360 x 640 mit 32 px Grundschrift; ASB.

**Beobachtung (gemessen):** Der Titel „Beispielbögen" ist auf 22 px gedeckelt, „Schließen"
bricht in eine zweite Zeile, die klebende Kopfzeile ist 132 px hoch (22 % der Dialoghöhe). Die
Zusammenfassung „Was sind Beispielbögen? Was heißen Anzeigen, PDF und Link?" ist nicht gedeckelt
(etwa 32 px, fett, Kennfarbe) und läuft über vier Zeilen. In ASB: Pfadleiste 192 px, Bogenzahl
bei 573 px, erste Karte bei 637 px, also vollständig unter dem ersten Bild (Dialogunterkante
622 px). Bei 320 x 568 und normaler Schrift steht „Schließen" ebenfalls unter dem Titel
(Kopfzeile 101 px).

**Folge:** Die Erklärung wirkt wie die Überschrift; nach dem Öffnen eines Ordners sieht man
keinen einzigen Bogen ohne Wischen.

**Empfehlung:** Die Zusammenfassung wie Kopf und Pfad nach der Deckel-Regel in px deckeln und
kürzer fassen („Was ist das?"); Titel und „Schließen" in einer Zeile halten.

**Nachprüfung:** 360 x 640 bei 32 px: Zusammenfassung höchstens zwei Zeilen, kleiner als der
Titel; in ASB beginnt die erste Karte im ersten Bild.

## Hinweise (ohne Priorität)

- **H1 (Layout, neu):** Das Register wird erst ab etwa 1.024 px Fensterbreite zweispaltig
  (`minmax(min(100%, 19rem), 1fr)` plus Spaltenabstand braucht rund 632 px Dialoginhalt). Bei
  820 x 1180 und 844 x 390 stehen 606 bzw. 625 px breite Einzelzeilen, Name links, Zahl rund
  450 px weiter rechts; das Auge muss über die Lücke springen.
- **H2 (Text, neu):** Im Ordner THW steht über den Karten „101 Bögen", die Register-Zeile
  davor nennt „3.533 Bögen" für den Unterordner, die Wurzel „3.634" (101 + 3.533). Die Zahl über der Tabelle
  zählt nur die Bögen direkt in diesem Ordner; „101 Bögen direkt in THW" wäre eindeutiger.
- **H3 (Layout, neu):** Das Register zeigt bei Hover und Tastaturfokus einen 3 px breiten
  Streifen in der Kennfarbe an der linken Flanke. `DESIGN.md` (Deckzeilen-Regel) schließt den
  farbigen Seitenstreifen aus; am Telefon nur beim Tastaturfokus sichtbar.
- **H4 (Layout, neu, nicht prüfbar):** Der Dialog hält oben und unten 16 px Rand
  (`max-height: calc(100dvh - 32px)`), die Seite setzt `viewport-fit=cover`. In der installierten
  App (`display: standalone`) auf Telefonen mit Aussparung könnte die klebende Kopfzeile mit
  „Schließen" unter Statusleiste oder Dynamic Island liegen, quer unten die letzte Zeile unter
  dem Home-Indikator. Chromium meldet die Safe-Area mit 0; am echten Gerät prüfen.
