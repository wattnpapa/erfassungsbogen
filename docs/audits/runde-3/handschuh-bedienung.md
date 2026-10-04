# Audit „Handschuh-Bedienung", Runde 3 (Touch-Ziele, Abstände, Gesten, Formate)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde vom 28.09.2026.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, Viewports 360 × 640 (hochkant),
640 × 360 (quer) und 320 × 568. Standard-Thema, zum Vergleich das
Feld-Thema. Getestet habe ich zuerst ohne Blick in frühere Berichte. Den
Runde-2-Bericht und die Tabelle „Stand der Behebung" habe ich danach gelesen,
die vorliegenden Runde-3-Berichte erst zuletzt.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false`:

- `eeb.entwurf.v1` mit `examples/thw/015-ansbach-fgr-log-mw.json`
  (18 Personen, Fahrzeuge, Sofortbedarf), teils direkt auf Schritt 2, 3 oder 5.
- `eeb.einsaetze.v1` mit einer Sammlung „Hochwasser Test" aus 1, 3, 5 oder 7
  Beispielbögen (001, 013, 015, 022, 033, 044, 050).
- `eeb.vorlagen.v1` mit ein bis drei Vorlagen aus 015, 013 und 001.

Neuer Bogen, Musterung („Einsatz vorbereiten") und Schnellerfassung habe ich
über die Bedienung geöffnet.

Gemessen habe ich auf jedem Screen alle sichtbaren Bedienelemente per
`getBoundingClientRect` (`button`, `a`, `input`, `select`, `textarea`,
`summary`, `label` mit Eingabe, Rollen `button`/`tab`/`checkbox`/`radio`):
Kantenlänge, Abstand zum Nachbarn, feste oder klebende Lage. Die Screens:
Startseite (leer, mit Entwurf, mit Vorlagen, mit Sammlung), Assistent
Schritte 1–6, Personal als Karten und als Tabelle, Übergeben-Dialog,
QR-Vollbild hoch und quer, Einsatzansicht als Karten und als Tabelle,
aufgeklappte Karte mit „Mehr…", Schnellerfassung (Schritt 1 und „Nur
Stärke"), Scan-Dialog mit Kunstkamera, Rückfragen und Vorschlagslisten.
Getippt habe ich mit `tap()` bzw. `touchscreen.tap`. Doppeltipps: zwei Tipps
auf dieselbe Stelle im Abstand von 150, 350, 700 und 1 000 ms. Was nach dem
ersten Tipp unter dem Finger liegt, habe ich per `elementFromPoint` geprüft.
Die Tastatur habe ich grob nachgestellt, indem ich das Bild nach dem Antippen
eines Felds auf 360 × 330 verkleinert habe.

Maßstab wie in Runde 2: 44 px Mindestkante, 8 px Mindestabstand, mit
Arbeitshandschuh eher 48 px und 12 px. Ein Handschuhfinger deckt auf dem Glas
grob 12–18 mm ab, je nach Gerät etwa 70–110 CSS-px.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, Nässe auf dem Display,
die echte Bildschirmtastatur (die Emulation öffnet keine, der verkleinerte
Viewport ist nur ein Ersatz), native Datums-, Zeit- und Auswahlpicker,
Systemgesten und Wischgesten (seitliches Rollen nur über Seitenmaße und
`scrollTo` belegt), die echte Kamera beim Scannen, native Builds. Das
Feld-Thema habe ich quer nur in Kopf und Schritt 2 gemessen.

Kennzeichnung im Nachweis: **gemessen** heißt Zahl aus dem Browser,
**beobachtet** heißt im Ablauf gesehen, **Risiko** heißt plausibel, aber
nicht nachgestellt.

Skripte, Messprotokolle und Bildschirmfotos liegen außerhalb des
Repositorys im Scratchpad der Sitzung (`runde3/handschuh/`).

## Urteil

Die Runde-2-Arbeit trägt auf den Hauptwegen. Im Standard-Thema messen
Schrittleiste (hochkant), Vorschläge, „ändern", Chip-✕, Kopf- und
Fußzeilenlinks jetzt 44 px. Rückfragen nehmen einen prellenden zweiten Tipp
nicht mehr an: Ich habe „Person entfernen" und „Meldung entfernen" gezielt
auf die Höhe des Dialogknopfs gelegt und doppelt getippt, der Dialog blieb
jedes Mal offen. Die Einsatz-Tabelle rollt in ihrem Rahmen, die Seite bleibt
360 px breit. „Funktion hinzufügen" zeigt beim Antippen sieben häufige
Funktionen ohne Tastatur. Pflichtgesten gibt es weiter keine.

Reibung entsteht jetzt an den **Rückwegen und an der unteren Bildkante**.
Nach „Person entfernen" gibt es ein „Rückgängig", aber es steht meist über
dem Bildrand, und die nächste Karte rückt unter den Finger. Die neue
Quittungsleiste in der Einsatzansicht liegt fest im Daumenbereich. Das ist
richtig, aber sie deckt bei 320 × 568 ein Viertel des Bilds ab, bleibt bis
zum Schließen stehen, und ihr „Rückgängig" fängt den zweiten Tipp eines
langsamen Doppeltipps. In der Einsatz-Erfassung steht „In Einsatz
übernehmen" als schmaler Knopf zwischen „← Zurück" und „Weiter →". Ein
Handschuhfinger, der „Weiter" sucht, legt so eine Einheit ab.

Die Aufgaben (eigenen Bogen ausfüllen, am Meldekopf Einheiten aufnehmen,
abrücken) sind ohne fremde Hilfe zu schaffen. Die Fehlgriffe kosten Zeit und
im ungünstigen Fall eine falsche Lage, aber keine Daten ohne Rückweg.

## Befunde

### R3-G1 [P2] „Person entfernen": „Rückgängig" steht über dem Bildrand, die nächste Karte rückt unter den Finger (neu, Rest von R2-G1)

**Priorität:** P2

**Nachweis:** gemessen, beobachtet (360 × 640, Standard).

**Fundstelle / Aufgabe:** Schritt 3 „Personal", Detail-Karten, Knopf
„Person entfernen" an einer Person (hier „Krüger, Florian", Person 2 von
18), Rückfrage bestätigen. Code: `src/app/schritte/personal.tsx`,
`SchrittPersonal`, Quittung `rueckweg` (Z. 640–672).

**Beobachtung:** Nach der Bestätigung steht die Quittung „Krüger, Florian
entfernt. Rückgängig" an der Stelle der entfernten Karte, also an deren
**Oberkante**. „Person entfernen" sitzt aber am unteren Ende der rund 600 px
hohen Karte. Ich habe den Knopf vor dem Tipp auf verschiedene Bildhöhen
gelegt:

| „Person entfernen" vor dem Tipp | „Rückgängig" danach (Oberkante im Bild) |
| --- | --- |
| 150 px | −290 px (nicht im Bild) |
| 320 px | −120 px (nicht im Bild) |
| 500 px | 137 px (im Bild) |

Dazu springt die Seite: `scrollY` 1 995 → 2 072 px. Im Bild steht nach dem
Entfernen die Karte der nächsten Person („Ziegler, Laura"), ihr Knopf
„Person entfernen" liegt fast an derselben Stelle wie vorher der von Krüger
(Screenshot `31-person-quittung`). Der Knopf „Rückgängig" in der Quittung ist
ein normaler Knopf (108 × 44 px), aber eben nicht sichtbar. Jede weitere
Änderung verwirft den Rückweg.

**Erwartung der Rolle:** Nach dem Löschen sehe ich, *was* weg ist, und den
Rückweg dort, wo mein Finger gerade war.

**Auswirkung im Einsatz:** Wer sich vertippt hat (falsche Person, die
Karten sehen gleich aus), sieht nur eine andere Person an derselben Stelle.
Den Rückweg findet er erst durch Hochscrollen. Tippt er vorher in ein Feld,
ist er weg (die Quittung verfällt mit jeder Änderung). Ein zweites
„Person entfernen" an der gleichen Stelle trifft die nächste Person. Die
Rückfrage fängt das ab, aber wer sie für die Wiederholung der ersten hält,
bestätigt.

**Empfehlung:** Die Quittung so platzieren, dass sie im Bild steht: an der
Stelle des Knopfs statt an der Kartenoberkante, oder als feste Leiste unten
wie in der Einsatzansicht. Den Namen der entfernten Person darin nennen
(geschieht schon).

**Nachprüfung:** „Person entfernen" bei 150, 320 und 500 px Bildhöhe
bestätigen. „Rückgängig" muss jedes Mal ohne Scrollen sichtbar sein.

### R3-G2 [P2] Quittungsleiste der Einsatzansicht: deckt bis 26 % des Bilds, bleibt stehen, und ihr „Rückgängig" fängt den zweiten Tipp (neu, Folge der Behebung von R2-H4)

**Priorität:** P2

**Nachweis:** gemessen, beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht, Karte aufklappen, „Abrücken" bzw.
„Mehr…" → „Entfernen". Code: `src/app/einsaetze-ui.tsx`, `DaumenQuittung`
(um Z. 1909–1940) und `PRELLSCHUTZ_MS` = 600 ms.

**Beobachtung:**

| Viewport | Quittungsleiste (Oberkante / Höhe) | Anteil am Bild |
| --- | --- | --- |
| 640 × 360 | 283 px / 65 px | 18 % |
| 360 × 640 | 523 px / 105 px | 16 % |
| 320 × 568 | 409 px / 147 px | 26 % |

Die Leiste bleibt beim Scrollen stehen und war nach 40 s noch da. Sie geht
erst mit ✕, mit der nächsten Quittung oder beim Ansichtswechsel. Bei
320 × 568 bricht der Einheitenname in fünf Zeilen um
(„Materialwirtscha-ft"), deshalb die 147 px. Darunter liegen die unteren
Knöpfe der aufgeklappten Karte. Nach „Abrücken" steckte „Zug zuordnen"
halb unter der Leiste (Screenshot `13-toast-320x568`), nach „Entfernen" lag
„Rückgängig" (179–287 × 2 325–2 369 px) über „Mehr…" (133–209 ×
2 322–2 366 px).

Doppeltipp auf „Abrücken", das im unteren Bildteil liegt (wo danach die
Leiste erscheint):

| Abstand der Tipps | unter dem Finger nach Tipp 1 | Status danach | sichtbare Rückmeldung |
| --- | --- | --- | --- |
| 150 ms | „Rückgängig" (gesperrt) | abgerückt | Leiste „… abgerückt" |
| 350 ms | „Rückgängig" (gesperrt) | abgerückt | Leiste „… abgerückt" |
| 700 ms | „Rückgängig" (frei) | **anwesend** | keine: Leiste weg, Karte wie vorher |

Im 700-ms-Fall ist der Abrück-Vorgang zurückgenommen, und es gibt keine
Quittung „wieder anwesend". Die Karte zeigt „kürzlich eingetroffen" wie vor
dem Tipp (Screenshot `31-abruecken-700`). Liegt „Abrücken" weiter oben,
trifft der zweite Tipp stattdessen „Wieder anwesend" in der Karte, siehe
R3-S5.

**Erwartung der Rolle:** Die Quittung bestätigt, was ich getan habe, und
verdeckt nicht, womit ich weiterarbeite. Ein zweiter Tipp, weil ich unsicher
war, nimmt die Handlung nicht still zurück.

**Auswirkung im Einsatz:** Am kleinen Telefon verdeckt die Leiste ein
Viertel der Arbeitsfläche, bis man sie bewusst wegtippt, also ein weiterer
kleiner Handgriff nach jedem Abrücken. Wer mit Handschuh nach einer
knappen Sekunde nachtippt, weil sich nichts zu tun schien, hat die Einheit
wieder anwesend gemacht. Ohne Rückmeldung steht sie weiter in Stärke und
Bedarf, obwohl sie weg ist.

**Empfehlung:** Die Leiste kompakter halten (Name kürzen oder einzeilig mit
Ellipse, Nummer „Nr. 3" statt vollem Namen) und den Rest der Seite unten um
ihre Höhe freihalten. „Rückgängig" nicht dort aufblenden, wo der auslösende
Knopf lag, oder länger sperren. Jedes Zurücknehmen soll selbst quittiert
werden („Abrücken von Nr. 3 zurückgenommen").

**Nachprüfung:** 320 × 568: Leiste höchstens rund 15 % des Bilds, kein
Bedienelement darunter verdeckt. „Abrücken" in den unteren Bildteil legen,
zweimal im Abstand von 700 und 1 000 ms tippen: Die Einheit ist abgerückt,
oder die Zurücknahme ist sichtbar quittiert.

### R3-G3 [P2] Einsatz-Erfassung: „In Einsatz übernehmen" steht schmal zwischen „← Zurück" und „Weiter →" (neu; Folgen siehe R3-N1, R3-E3)

**Priorität:** P2

**Nachweis:** gemessen, beobachtet.

**Fundstelle / Aufgabe:** Sammlung → „Einheit schnell erfassen" bzw.
„Einheit manuell erfassen…", feste untere Leiste auf jedem Schritt. Code:
`src/app/app.tsx`, Leiste Z. 2883 und 2934.

**Beobachtung:**

| Viewport | „← Zurück" | „In Einsatz übernehmen" | „Weiter →" | Abstände |
| --- | --- | --- | --- | --- |
| 320 × 568 | 93 × 64 px | 88 × 64 px | 88 × 64 px | 10 / 9 px |
| 360 × 640 | 96 × 52 px | 120 × 52 px | 91 × 52 px | 11 / 10 px |
| 640 × 360 | 106 × 44 px | 169 × 44 px | 101 × 44 px | 116 / 116 px |

Bei 320 × 568 bricht die Beschriftung in drei Zeilen mit Trennung mitten im
Wort („In Einsatz / übernehm / en", Screenshot `34-bar-320x568`). Im Assistenten
für den eigenen Bogen stehen an derselben Stelle nur zwei Knöpfe mit 137 px
Abstand. Ein Tipp auf „In Einsatz übernehmen" auf Schritt 1 mit leerem
Formular legt sofort eine Meldung ab: In der Sammlung stand danach
„2 Einheiten" statt 1, Gesamtstärke unverändert 4, Eintrag ohne Namen und
ohne Personal. Eine Rückfrage gab es nicht, ein „Rückgängig" ebenfalls nicht
(0 Knöpfe dieses Namens im Bild).

**Erwartung der Rolle:** Der Knopf, der etwas endgültig ablegt, liegt nicht
zwischen zwei Blätterknöpfen, und ein Daumen, der „Weiter" sucht, trifft
nicht daneben.

**Auswirkung im Einsatz:** Der Handschuhfinger ist breiter als jeder der drei
Knöpfe (88–96 px bei 320 px Breite), die Lücken liegen bei 9–11 px. Ein Tipp,
der „Weiter →" etwas links trifft, übernimmt die halb ausgefüllte Einheit in
die Lage (Risiko für den Fehlgriff, gemessen für die Folge). Was dann in der
Liste steht, beschreiben R3-N1 und R3-E3: Einheit mit Stärke 0 bzw. leere
Einheit „THW", Quittung unter dem Bildrand.

**Empfehlung:** „In Einsatz übernehmen" vom Blättern trennen: eigene Zeile
über der Leiste in voller Breite, oder nur auf dem letzten Schritt anstelle
von „Weiter →". Wenn er auf jedem Schritt bleiben soll, an den Rand und mit
deutlichem Abstand zu „Weiter". Dazu die Rückfrage aus R3-N1 und ein
„Rückgängig" in der Sammlung.

**Nachprüfung:** 320 × 568 und 360 × 640: zwischen „Weiter →" und dem
Übernehmen-Knopf mindestens 24 px oder eine andere Zeile, Beschriftung ohne
Worttrennung. Ein Tipp 30 px links der Mitte von „Weiter →" blättert nur.

### R3-G4 [P3] Restliche kleine oder lückenlose Ziele im Standard-Thema (Rest von R2-G3)

**Priorität:** P3

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** verschiedene, siehe Tabelle.

**Beobachtung:**

| Ziel | Standard | Feld-Thema | Nachbar |
| --- | --- | --- | --- |
| Schrittleiste quer (640 × 360) | 97–138 × 36 px, 0 px Abstand, rollt seitlich (679 von 608 px), „6. Übersicht" abgeschnitten | 115–163 × 45 px, rollt (803 von 604 px) | nächster Schritt |
| „1× angefordert", „Ruhezeit: 1×" (Bedarfskasten der Sammlung) | 91 × 30 / 79 × 30 px | 110 × 40 / 95 × 40 px | Textzeile |
| „Weitere Formate (Link, Tabelle, Excel)" (Übergeben-Dialog) | 272 × 29 px | nicht gemessen | Knopf darunter, 12 px |
| „Datenschutzfrist: Namen werden nach 90 Tagen …" (Schritt 2, aufklappbar) | 294 × 39 px hoch, quer 574 × 20 px | nicht gemessen | „Weiter →" quer 14 px darunter |
| Themenwahl im Kopf quer | 41–69 × 44 px, 0 px Abstand („Feld" 41 px) | 49–82 × 54 px, 0 px | Nachbarthema |
| Kopf-Link „THW" (Startseite quer) | 29 × 44 px | nicht gemessen | „Katastrophenschutz", „Feuerwehr" |

Hochkant misst die Schrittleiste 49–57 × 44 px (320 bzw. 360 px Breite),
ebenfalls lückenlos. Die Verweise in den Erklärtexten der Startseite
(„Feuerwehr", „DRK", „ASB", 33–75 × 17 px) sind Fließtext. Das ist laut
Behebungstabelle so gewollt und hier nicht gezählt.

**Erwartung der Rolle:** Was angetippt wird, hat Handschuhmaß, auch quer und
ohne Feld-Thema.

**Auswirkung im Einsatz:** Ein Fehlgriff in Schrittleiste oder Themenwahl
springt in einen anderen Schritt bzw. färbt den Bildschirm um. Das ist
harmlos, kostet aber einen Suchmoment. Die Bedarfslinks und das
Formate-Aufklappfeld brauchen eher zwei Versuche.

**Empfehlung:** Die Maße des Hochformats auch quer anwenden
(Schrittleiste 44 px, ganz sichtbar oder mit erkennbarem Rollhinweis),
Bedarfslinks und Aufklappzeilen auf 44 px Höhe bringen, Themenwahl mit
kleinem Abstand zwischen den Feldern.

**Nachprüfung:** Tabelle oben im Standard-Thema neu messen, keine Kante unter
44 px.

## Bestätigt aus anderen Runde-3-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind dort beschrieben und
werden hier nicht als eigene Befunde gezählt:

- **R3-H1** ([feldtauglichkeit.md](feldtauglichkeit.md)): Der Einstieg von
  der Startseite öffnet mitten im Formular. Gemessen beim Tipp auf den
  mittig gescrollten Knopf: „Neuen Bogen erstellen" 293–364 px
  (Organisation und Schrittleiste nicht im Bild), „Einsatz vorbereiten"
  (Musterung) 749 px, Schnellerfassung 490 px, „Fortsetzen" 157 px (quer
  43 px). Der Schrittwechsel selbst beginnt oben (R2-H1 hält).
- **R3-S5** ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)):
  Doppeltipp auf „Abrücken" mit 700 und 1 000 ms trifft „Wieder anwesend" am
  selben Platz, Status danach anwesend, Quittung „wieder anwesend". Die
  Variante im unteren Bildteil, bei der der zweite Tipp das „Rückgängig" der
  Leiste trifft und gar keine Quittung bleibt, steht in R3-G2.
- **R3-N1** ([neuer-nutzer.md](neuer-nutzer.md)) und **R3-E3**
  ([fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md)): „In Einsatz
  übernehmen" legt ohne Rückfrage ab, auch ganz leer. Für die Lage des
  Knopfs siehe R3-G3.
- **R3-H2** ([feldtauglichkeit.md](feldtauglichkeit.md)): QR-Vollbild quer.
  Der Dialog ist 415 px hoch bei 360 px Bild, „Schließen" steht bei 396 px
  unter dem Rand und ist erst nach Scrollen im Dialog erreichbar.
- **R3-H5** ([feldtauglichkeit.md](feldtauglichkeit.md)): Startseite quer,
  zweizeilige Kopfnavigation und Titelband. „Neuen Bogen erstellen" liegt
  unter dem ersten Bild.
- **R3-H6** ([feldtauglichkeit.md](feldtauglichkeit.md)): Schritt 3 mit
  18 Personen als Karten 19 848 px lang (Feld-Thema 25 905 px). Die
  Schnelleingabe-Tabelle rollt seitlich, Sortierpfeile und „entfernen" liegen
  bei x = 537–646 px, also erst nach seitlichem Rollen erreichbar.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Rückfragen gegen Doppeltipp:** „Person entfernen" und „Meldung
  entfernen" bei 150 und 350 ms, Auslöser genau auf Höhe des Dialogknopfs
  (±20 px): Dialog bleibt offen, nichts gelöscht (12 von 12 Versuchen). Ebenso
  „Einsatz löschen…". Quer sind „Person entfernen" und „Abbrechen" gleich
  breit (494 × 44 px).
- **Fußleiste im Assistenten:** „← Zurück" 106 × 44 px links, „Weiter →"
  101 × 44 px rechts, fest unten (67 px Leiste hochkant, 53 px quer). Feld
  120 × 51 / 115 × 51 px.
- **Formularfelder und Auswahllisten** durchgehend 44 px hoch (Feld 54 px),
  Kästchen und Radios 24 px in einer 44 px hohen, ganz antippbaren Zeile.
- **Stärke-Zähler** in der Schnellerfassung: −/+ je 52 × 52 px, getrennt
  durch das 60 px breite Zahlenfeld (6–7 px Abstand zum Feld, kein
  Nachbarknopf).
- **Funktion ohne Tastatur:** Beim Antippen von „Funktion hinzufügen"
  erscheinen sieben Vorschläge (He, TrFü, GabelSt, Bef. P. Logistik, Bed.
  Ladekran, NwFü, Spr), 44–59 px hoch. Nach Eingabe „Kr" bleiben die
  Vorschläge 44–79 px hoch und lückenlos untereinander.
- **Sortierpfeile und Chip-✕** 44 × 44 px (Feld 54 px), „Person entfernen"
  133 × 44 px, abgesetzt.
- **Einsatzkarte:** alle Knöpfe 44 px hoch mit 8 px Abstand, „ändern" an den
  Zeiten 45 × 47 px. „Wieder anwesend" steht nach dem Abrücken am Platz von
  „Abrücken" (Folge siehe R3-S5).
- **Tabelle der Einsatzansicht:** rollt im eigenen Rahmen (1 673 von 326 px),
  die Seite bleibt gerätebreit (`scrollWidth` 360).
- **Vorlage löschen** wirkt mit einem Tipp, legt aber in den Papierkorb
  („30 Tage rückholbar") und zeigt „Rückgängig". Ein Doppeltipp löscht nicht
  die zweite Vorlage mit.
- **Aufnahme-Knöpfe der Sammlung** („Bogen scannen…", „Einheit manuell
  erfassen…", „Bögen einlesen…") volle Breite × 45 px, 8 px Abstand. Im
  Scan-Dialog „Fertig" 68 × 44 px, „QR aus Bild einlesen…" 177 × 44 px.
- **Feld-Thema:** hebt Schritt 3 auf Median 54 px. Nur 6 von 326 Zielen
  bleiben unter 48 px (Standard: Median 44 px).
- **Keine Pflichtgesten**, kein seitlicher Seitenversatz auf einem der
  geprüften Screens bei 320 und 360 px Breite.

## Abschluss

- **Aufgabe geschafft:** ja. Eigener Bogen, Schnellerfassung, Aufnahme und
  Abrücken am Meldekopf gehen mit Handschuhmaß. Mit Umwegen nach Fehlgriffen
  (R3-G1 bis R3-G3).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Nach „Person entfernen" sieht der Helfer eine
  andere Person an derselben Stelle und keinen Rückweg. Er glaubt, es gebe
  keinen (R3-G1).
- **Größtes Einsatzrisiko:** Ein knapp neben „Weiter →" gesetzter Tipp legt
  eine unfertige Einheit ohne Rückfrage in die Lage (R3-G3 mit R3-N1).
- **Top-Priorität für die nächste Iteration:** „In Einsatz übernehmen" aus
  der Mitte der Blätterleiste nehmen und das „Rückgängig" nach „Person
  entfernen" ins Bild holen.

## Abgleich mit Runde 2

Grundlage: [../runde-2/handschuh-bedienung.md](../runde-2/handschuh-bedienung.md)
und [../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut Tabelle | Bewertung Runde 3 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R2-G1 Doppeltipp bestätigt Rückfrage (P1) | behoben | **hält, mit Rest** | Dialog blieb bei 150/350 ms und Auslöser ±20 px um die Dialogknopfhöhe in 12 von 12 Versuchen offen. „Person entfernen" hat jetzt ein „Rückgängig", es steht aber an der Kartenoberkante, bei Knopf auf 150/320 px bei −290/−120 px (R3-G1). |
| R2-G2 Tabelle schiebt Seite (P2) | behoben | **hält** | Einsatzansicht „Tabelle": `scrollWidth` 360 = `innerWidth` 360. Tabelle rollt im Rahmen (1 673 / 326 px). |
| R2-G3 Kleine Ziele im Standard-Thema (P2) | behoben | **hält hochkant, Reste quer** | Schrittleiste 49–57 × 44 px, Vorschläge 44–79 px, „ändern" 45 × 47 px, Chip-✕ 44 × 44 px, Kopf-Links 44 px. Neu gemessen und zu klein: Schrittleiste quer 36 px, Bedarfslinks 30 px, „Weitere Formate" 29 px, Datenschutzfrist quer 20 px (R3-G4). |
| R2-G4 „Abrücken"-Doppeltipp öffnet Zug-Editor (P2) | behoben | **hält, verlagert** | Kein Editor mehr. „Wieder anwesend" steht am Platz von „Abrücken", Karte 600 ms gesperrt. Ab 600 ms nimmt der zweite Tipp das Abrücken zurück (R3-S5), im unteren Bildteil über das „Rückgängig" der Leiste ohne Quittung (R3-G2). |
| R2-G5 Funktion nur per Tastatur, Querformat-Dialog (P3) | weitgehend | **hält** | Sieben Funktionen beim Antippen. Quer-Dialog: beide Knöpfe 494 × 44 px. „Einheitstyp" nicht nachgemessen. Zahlenfelder im Sofortbedarf: Tastatur weiter nicht prüfbar. |
| R2-H1 Schritt öffnet mitten im Formular (bestätigt) | behoben | **hält, Rest** | „Weiter →" von ganz unten: neuer Schritt bei `scrollY` 0, Überschrift bei 160 px. Der Einstieg von der Startseite übernimmt die Scrollposition weiter (R3-H1). |
| R2-S3 Sammlung öffnet mit Startseiten-Scroll (bestätigt) | behoben | **hält** | „Öffnen" aus mittiger Lage: `scrollY` 0. |
| R2-H4 Quittung außerhalb des Bilds (bestätigt) | behoben | **hält, neue Nebenwirkung** | Feste Leiste unten, „Rückgängig" 108 × 44 px, ✕ 44 × 44 px, 600 ms gesperrt. Sie deckt jetzt 16–26 % des Bilds und bleibt bis zum Schließen stehen (R3-G2). |
| R2-H7 Kopf zu hoch (bestätigt) | weitgehend | **hält** | 360 × 640: Schrittleiste endet bei 127 px. 320 × 568: ebenso bei 127 px. Quer rollt die Schrittleiste (R3-G4). |
| R2-N8 Schritt 3 sehr lang (bestätigt) | behoben (erstes Namensfeld) | **Länge bleibt** | 18 Personen als Karten 19 848 px, Feld 25 905 px (R3-H6). |

Einordnung der eigenen Befunde: R3-G1 ist der Rest von R2-G1. R3-G2 ist eine
Nebenwirkung der Behebung von R2-H4 und R2-G4. R3-G3 ist neu (die Leiste der
Einsatz-Erfassung hat Runde 2 nicht gemessen). R3-G4 sammelt die Reste von
R2-G3.

Bilanz: Von fünf eigenen Runde-2-Befunden halten drei ohne Einschränkung
(R2-G2, R2-G5, R2-G3 hochkant). Bei R2-G1 und R2-G4 hält die Behebung des
gemeldeten Fehlers, es bleibt aber ein Rest an derselben Stelle (R3-G1,
R3-S5/R3-G2). Kein P0 und kein P1 aus Handschuhsicht. Das Risiko liegt jetzt
nicht mehr bei zu kleinen Zielen und kaum noch beim Doppeltipp in Rückfragen,
sondern bei Rückwegen außerhalb des Bilds und bei einem endgültigen Knopf
zwischen zwei Blätterknöpfen.
