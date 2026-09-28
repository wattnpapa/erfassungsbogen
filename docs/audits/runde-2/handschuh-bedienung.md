# Audit „Handschuh-Bedienung", Runde 2 (Touch-Ziele, Abstände, Gesten, Formate)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), `isMobile`/`hasTouch`,
Locale de-DE, Viewports 360 × 640 (hochkant), 640 × 360 (quer) und
320 × 568. Standard-Thema, zum Vergleich das Feld-Thema. Getestet habe ich
zuerst ohne Blick in frühere Berichte. Den Runde-1-Bericht, die Tabelle
„Stand der Behebung" und die vorliegenden Runde-2-Berichte habe ich erst
danach gelesen.

Zustände per `localStorage`-Seed: `eeb.entwurf.v1` mit
`examples/thw/014-weinsberg-fgr-oel-c.json` (19 Personen, 4 Fahrzeuge) und
`eeb.einsaetze.v1` mit einer Sammlung „Hochwasser Neckar" aus den
Beispielbögen 001–008 (acht Einheiten, zwei Züge, `uebung` auf `false`
gesetzt). Neuer Bogen und Schnellerfassung habe ich über die Bedienung
geöffnet.

Gemessen habe ich auf jedem Screen alle sichtbaren Bedienelemente per
`getBoundingClientRect` (`button`, `a`, `input`, `select`, `textarea`,
`summary`, `label`, Rollen `button`/`tab`/`checkbox`/`radio`): Kantenlänge,
Abstand zum nächsten Ziel und feste oder klebende Lage. Die Screens:
Startseite (leer, mit Entwurf, mit Sammlung), Assistent Schritte 1–6,
Personal als Karten und als Tabelle, Schnellerfassung „nur Stärke",
Einsatzansicht als Karten und als Tabelle, Bestätigungsdialoge und
Vorschlagslisten. Getippt habe ich mit `tap()` bzw. `touchscreen.tap`.
Grobe Tipps habe ich simuliert, indem ich an kritischen Stellen per
`elementFromPoint` 8–12 px (teils bis 55 px) neben dem Mittelpunkt geprüft
habe, was getroffen würde. Doppeltipps: zwei Tipps im Abstand von 120–350 ms
auf dieselbe Stelle.

Maßstab: 44 px Mindestkante, 8 px Mindestabstand. Mit Arbeitshandschuh eher
48 px und 12 px. Ein Handschuhfinger deckt auf dem Glas grob 12–18 mm ab, das
sind je nach Gerät etwa 70–110 CSS-px.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, Nässe auf dem Display,
die Bildschirmtastatur (die Emulation öffnet keine), native Datums- und
Auswahlpicker, Systemgesten. Wischgesten ließen sich in dieser Umgebung nicht
auslösen (`Input.synthesizeScrollGesture` blieb ohne Wirkung). Seitliches
Scrollen ist deshalb nur über die Seitenmaße und `scrollTo` belegt. Nicht
geprüft habe ich native Builds und das Feld-Thema im Querformat.

Kennzeichnung im Nachweis: **gemessen** heißt Zahl aus dem Browser,
**beobachtet** heißt im Ablauf gesehen, **Risiko** heißt plausibel, aber
nicht nachgestellt.

Skripte und Bildschirmfotos liegen außerhalb des Repositorys im Scratchpad
der Sitzung (`runde2/handschuh/`).

## Urteil

Die Runde-1-Arbeit trägt. Formularfelder, Auswahllisten und Knöpfe auf den
Hauptwegen messen 44 px, Sortierpfeile 44 × 44 px mit 8 px Abstand,
Kästchen 24 px. Die Chips sind 44 px hoch, ihr ✕ 32 px. „← Zurück" und
„Weiter →" stehen fest unten links und rechts, „Weiter" im Daumenbereich der
rechten Hand. Der Stärke-Zähler (−/+ je 52 × 52 px, getrennt durch das
60 px breite Zahlenfeld) erspart die Tastatur. Grobe Tipps 8–12 px neben dem
Mittelpunkt landeten auf allen 44-px-Knöpfen, die ich geprüft habe, noch im
richtigen Ziel. Pflichtgesten gibt es nicht: kein Wischen zum Löschen, kein
Langdruck, kein Ziehen. Das Feld-Thema hebt die verbleibenden kleinen Ziele
auf 44–54 px.

Reibung entsteht jetzt vor allem bei **zweifachem Kontakt**, nicht mehr bei
zu kleinen Zielen. Die Rückfrage vor dem Löschen öffnet sich mittig. Liegt der
auslösende Knopf zufällig in derselben Höhe wie „Person entfernen" oder
„Meldung entfernen" im Dialog, bestätigt ein Doppeltipp, der mit Handschuh
leicht passiert, die Löschung gleich mit. Bei einer Person gibt es danach
keinen Rückweg. „Abrücken" ohne Rückfrage verschiebt beim Doppeltipp die
Knöpfe so, dass der zweite Tipp den Zug-Editor mit Tastatur öffnet. Die
Einsatz-Tabelle macht die ganze Seite seitlich verschiebbar. Im
voreingestellten Standard-Thema bleiben einige Ziele unter 44 px
(Schrittleiste 40 px ohne Abstand, Vorschlagseinträge 38 px, „ändern" an der
Eintreffzeit 41 × 28 px).

Die Aufgaben (eigenen Bogen ausfüllen, am Meldekopf Einheiten aufnehmen,
abrücken) sind ohne fremde Hilfe zu schaffen. Die Fehlgriffe kosten Zeit, im
ungünstigen Fall auch Daten einer Person.

## Befunde

### R2-G1 [P1] Doppeltipp auf einen Löschknopf bestätigt die Rückfrage gleich mit (neu)

**Priorität:** P1

**Nachweis:** gemessen, beobachtet, reproduziert (360 × 640, Standard).

**Fundstelle / Aufgabe:** Schritt 3 „Person entfernen" (Karte und Tabelle),
Einsatzansicht „Entfernen" an einer Meldung, Übersicht „Neuer Bogen",
Startseite „Verwerfen".

**Beobachtung:** Die Rückfrage erscheint als Dialog in Bildmitte. Die
gefährliche Aktion steht oben, „Abbrechen" darunter:

| Auslöser | Dialogknopf (Oberkante–Unterkante im Bild) | „Abbrechen" |
| --- | --- | --- |
| „Person entfernen" | „Person entfernen" 318–362 px | 403–447 px |
| „Entfernen" (Meldung) | „Meldung entfernen" 330–374 px | 415–459 px |
| „Neuer Bogen" | „Verwerfen und neu beginnen" 331–375 px | 416–460 px |
| „Verwerfen" (Startseite) | „Verwerfen" 367–411 px | 452–496 px |

Den Auslöser habe ich per Scrollen auf verschiedene Bildhöhen gelegt und dann
zweimal im Abstand von 150 ms auf dieselbe Stelle getippt:

- **Meldung entfernen:** Mitte bei 330, 350 und 370 px: Die Meldung war
  jeweils weg (8 → 7 → 6 → 5 Karten), ohne dass der Dialog sichtbar stehen
  blieb. Bei 300 und 390 px blieb der Dialog offen, bei 410 px traf der
  zweite Tipp „Abbrechen".
- **Person entfernen:** Mitte bei 340 px: „Stein, Paul" war weg. Es erschien
  keine Quittung und kein „Rückgängig", weder an der Karte noch oben.
- **Neuer Bogen:** Mitte bei 353 px: Der Bogen war geschlossen. Er ließ sich
  über „Zuletzt verdrängten Bogen zurückholen" auf der Startseite
  zurückholen.
- Nach „Meldung entfernen" steht „Rückgängig" (74 × 30 px) oben auf der
  Seite: bei Scrollposition 3 220 px auf −2 931 px, also nicht im Bild.

Im Querformat (640 × 360) füllt „Person entfernen" die ganze Dialogbreite,
„Abbrechen" ist ein 152 × 44-px-Knopf unten links.

**Erwartung der Rolle:** Ein Handschuh prellt, ein Tipp wird oft doppelt
erkannt. Die Rückfrage soll genau diesen Fehlgriff abfangen. Ein zweiter
Tipp an derselben Stelle darf sie nicht beantworten.

**Auswirkung im Einsatz:** Die Absicherung greift in einem 44 px hohen Band
mitten im Bild nicht. Dort liegt die Hand bei einhändiger Bedienung am
häufigsten. Eine gelöschte Person nimmt Name, Funktionen (GrFü, TrFü),
Qualifikationen und Erreichbarkeit mit. Einen Rückweg gibt es nicht, der
Bogen geht mit einer Stärke weniger und ohne Führungsfunktion zum Meldekopf.
Eine entfernte Meldung fällt am Meldekopf aus den Summen. Der Rückweg dafür
liegt drei Bildschirmhöhen darüber.

**Empfehlung:** Die Rückfrage darf den ersten Sekundenbruchteil keine
Eingabe annehmen. Oder die gefährliche Aktion liegt nicht an der Stelle,
auf die der Finger gerade getippt hat, etwa „Abbrechen" dort und die
Löschung darunter bzw. seitlich. Nach „Person entfernen" eine Quittung mit
„Rückgängig" im Daumenbereich zeigen, wie es die Meldung schon hat. Deren
„Rückgängig" ins Bild holen (siehe R2-H4).

**Verifikation:** Jeden der vier Auslöser nacheinander auf 300, 320, 340,
360, 380 und 400 px Bildhöhe legen und doppelt tippen (100–300 ms). Danach
muss der Dialog offen stehen oder die Löschung mit „Rückgängig" im Bild
quittiert sein. Mit Handschuh auf echtem Gerät wiederholen.

### R2-G2 [P2] Einsatz-Tabelle: die ganze Seite wird seitlich verschiebbar (neu)

**Priorität:** P2

**Nachweis:** gemessen. Das Wischen selbst ist nicht nachgestellt, siehe
Prüfaufbau.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Neckar", Umschalter
„Tabelle" (Meldekopf, Überblick über alle Einheiten).

**Beobachtung:** In der Kartenansicht ist die Seite 360 px breit
(`scrollWidth` 360). Nach „Tabelle" ist das Dokument 1 677 px breit, das
Layout-Fenster wächst auf 1 440 px (`innerWidth`). Die Seite lässt sich
seitlich verschieben: `scrollTo(400, …)` ergab `scrollX` 237, und das Bild
zeigte dann leere Fläche rechts neben den Summenknöpfen. Die Tabelle selbst
liegt in einem eigenen Rollrahmen (326 px sichtbar von 1 757 px). Aus diesem
Rahmen ragen aber die unsichtbaren Vorleser-Beschriftungen der Spaltenköpfe
(`span.nur-sr`, absolut positioniert) heraus und verbreitern die Seite.
Personal-Tabelle und Übersichtstabellen haben das nicht (`scrollWidth` 360).

**Erwartung der Rolle:** Wische ich in der Tabelle seitlich, rollt die
Tabelle. Wische ich schräg nach unten, rollt die Seite nach unten. Die Seite
selbst bleibt seitlich stehen.

**Auswirkung im Einsatz:** Mit Handschuh gerät jedes Wischen etwas schräg.
Die Seite rutscht dann seitlich weg, Summen und Knöpfe stehen halb oder gar
nicht mehr im Bild, und man muss zurückwischen. Ob mobile Browser die Seite
wegen der Breite zusätzlich verkleinert darstellen oder ein Auszoomen
zulassen, konnte ich nicht prüfen (Risiko).

**Empfehlung:** In der Tabellenansicht darf nichts außerhalb des
Tabellenrahmens liegen. Die Seite muss so breit bleiben wie das Gerät.

**Verifikation:** Einsatzansicht, „Tabelle", 360 × 640: `scrollWidth` gleich
360. Auf echtem Telefon mit Handschuh schräg über die Tabelle wischen: Die
Seite verschiebt sich nicht seitlich.

### R2-G3 [P2] Im Standard-Thema bleiben einzelne Ziele unter 44 px oder ohne Abstand (Wiederaufnahme von G2/G4/G5, Reste)

**Priorität:** P2

**Nachweis:** gemessen (360 × 640; Feld-Thema zum Vergleich).

**Fundstelle / Aufgabe:** verschiedene; das Standard-Thema ist voreingestellt.

**Beobachtung:**

| Ziel | Standard | Feld-Thema | Nachbar |
| --- | --- | --- | --- |
| Schrittleiste „1. Einheit … 6. Übersicht" (3 Zeilen) | 78–136 × 40 px, 0 px Abstand | 113–161 × 49 px, 0 px | nur Navigation |
| Vorschlagsliste (Funktion, Einheitstyp), je Eintrag | 238 × 38 px, lückenlos | 265 × 43 px | nächster Vorschlag |
| „ändern" an Eintreff-/Abrückzeit (Einsatzkarte) | 41 × 28 px | 49 × 38 px | Textzeile |
| „1 Lücke" / „2 Lücken" (Einsatzkarte) | 47–56 × 30 px | 57–67 × 40 px | 10 px zu „Details" |
| Funktions-Chip ✕ | 32 × 32 px (Chip 44 px hoch) | 44 × 44 px | Chip-Beschriftung |
| Spaltenköpfe „F", „U", „M" (Einsatz-Tabelle) | 25–33 × 44 px, 1 px Abstand | nicht gemessen | Nachbarspalte |
| Kopf-Links „Alle Themen", „Anleitung" (Startseite) | 73 × 32 / 55 × 32 px | 87 × 36 / 66 × 36 px | 11 px |
| „Name/Kontakt hinterlegen…", Knopf ohne Text unter dem Siegel (Übersicht) | 162 × 28 / 216 × 28 px | 195 × 38 / 261 × 38 px | frei |
| Themenwahl Standard/Dunkel/Feld/Nacht | 49–77 × 44 px, 0 px Abstand | 58–91 × 54 px, 0 px | Nachbarthema |

Grobe Tipps: Bei einem 38-px-Vorschlag trifft ein Tipp 20 px unter der Mitte
den nächsten Eintrag. Gerade dort stehen fachlich verschiedene Werte
untereinander (bei „S": „S 6/FeFü", „S1-4", „SanHe", „SGL"). Ein Tipp 12 px
seitlich neben ein Chip-✕ trifft noch das ✕, 20 px daneben das Label. Das
fokussiert das Funktionsfeld und öffnet auf dem Gerät die Tastatur.

**Erwartung der Rolle:** Was im Einsatz angetippt wird, hat Handschuhmaß,
auch ohne dass ich erst das Feld-Thema suchen muss.

**Auswirkung im Einsatz:** Eine falsch gewählte Funktion („SanHe" statt
„SGL") steht unbemerkt auf dem Bogen. Eine korrigierte Eintreffzeit braucht
zwei, drei Versuche. Ein Fehlgriff in der Schrittleiste springt in einen
anderen Schritt (harmlos, aber ein Suchmoment).

**Empfehlung:** Die Maße, die das Feld-Thema schon setzt (Chip-✕ 44 px,
Vorschläge 43 px, Schrittleiste 49 px), auch im Standard-Thema verwenden
oder das Feld-Thema auf dem Telefon vorschlagen. „ändern" als Knopf mit
44 px, Vorschlagseinträge mit 44 px und sichtbarer Trennung.

**Verifikation:** Die Tabelle oben im Standard-Thema neu messen, dabei keine
Kante unter 44 px. Mit Handschuh zehnmal einen Vorschlag aus einer Liste mit
mindestens fünf Einträgen wählen, ohne Fehlgriff.

### R2-G4 [P2] „Abrücken": kein Schutz gegen Doppeltipp, der zweite Tipp öffnet den Zug-Editor (neu; Umfeld R2-H4)

**Priorität:** P2

**Nachweis:** gemessen, beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht, Karte „THW Biberach/Riß Fachgruppe
Ortung (B)", Knopf „Abrücken".

**Beobachtung:** Jede Einsatzkarte trägt acht Knöpfe (93–126 × 44 px) in
vier Zeilen mit je 8 px Abstand. „Abrücken" (93 × 44) liegt 8 px unter
„Details" und 8 px links von „Zug ändern". Grobe Tipps 12 px neben der Mitte
treffen noch „Abrücken", 26 px darüber oder darunter die Lücke zwischen den
Knöpfen, 55 px rechts „Zug ändern". „Abrücken" wirkt ohne Rückfrage. Danach
ordnen sich die Knöpfe neu: An der Stelle von „Abrücken" steht jetzt „Zug
ändern", „Als anwesend" ist dazugekommen, „Entfernen" rückt eine Zeile tiefer.
Doppeltipp auf „Abrücken" (150 ms): Die Einheit ist abgerückt, *und* der
Zug-Editor ist offen, mit Cursor im Feld „Zug" (auf dem Gerät öffnet sich
die Tastatur). Die Quittung mit „Rückgängig" steht oben außerhalb des Bilds
(R2-H4).

**Erwartung der Rolle:** Ein Doppeltipp auf „Abrücken" rückt ab, und sonst
passiert nichts. Unter meinem Finger springt nicht ein anderer Knopf hin.

**Auswirkung im Einsatz:** Der Helfer sieht ein offenes Eingabefeld mit
Tastatur und eine blasse Karte. Was passiert ist, muss er erst
zusammensuchen. Tippt er „Abbrechen", bleibt die Einheit abgerückt und fehlt
in den Summen.

**Empfehlung:** Nach dem Abrücken sollen die Knöpfe an ihrem Platz bleiben,
„Als anwesend" also an die Stelle von „Abrücken". Die Quittung mit
„Rückgängig" gehört an die Karte oder in den Daumenbereich (wie R2-H4).

**Verifikation:** Doppeltipp auf „Abrücken" bei 100–300 ms: Kein Editor
öffnet sich. Unter dem Finger liegt danach „Als anwesend" bzw. der Rückweg.

### R2-G5 [P3] Kleinere Stellen bei Texteingabe, Zähler und Querformat (neu)

**Priorität:** P3

**Nachweis:** gemessen bzw. beobachtet, je Punkt; Tastaturverhalten nicht
prüfbar.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **Funktionen nur über die Tastatur:** Das Feld „Funktion hinzufügen" zeigt
  beim Antippen keine Liste (0 Vorschläge), erst nach dem ersten Buchstaben.
  „Einheitstyp" zeigt beim Antippen nur den aktuellen Wert. Bei 19 Personen
  mit je ein bis zwei Funktionen heißt das: jedes Mal Tastatur auf, Buchstabe
  tippen, Vorschlag wählen.
- **Chip-✕ ohne Rückweg:** Ein Tipp auf das ✕ entfernt die Funktion sofort,
  ohne Quittung. Das ist vertretbar, weil sie sich neu eintragen lässt, aber
  man muss den Wegfall erst bemerken.
- **Zähler zählt Doppeltipp doppelt:** Doppeltipp auf „Mannschaft: erhöhen"
  ergibt 2. Die Zahl steht groß daneben, der Fehler ist sichtbar.
- **Zahlenfelder im Sofortbedarf** (Verpflegung, Diesel, Benzin, Gemisch)
  sind `type="number"` ohne `inputmode`. Die Sitzplätze haben
  `inputmode="numeric"`. Welche Tastatur das Gerät zeigt, konnte ich nicht
  prüfen (Risiko: Zahlentastatur mit Satzzeichen statt Ziffernblock).
- **Querformat, Dialog:** Die gefährliche Aktion ist dort das größte Ziel
  (volle Breite), „Abbrechen" das kleinere (152 × 44 px unten links).
- **Querformat, Formular:** Der Kopf rollt mit weg, fest bleibt nur die
  60-px-Fußleiste. Beim Einstieg in Schritt 3 stehen 165 px Formular im Bild
  (mit Übungsbanner, ohne Banner rund 210 px), nach dem Scrollen 300 px. Mit
  offener Tastatur bleibt davon absehbar wenig (nicht prüfbar).

**Erwartung der Rolle:** Möglichst wenig tippen. Häufige Werte wähle ich aus
einer Liste, statt sie zu buchstabieren.

**Auswirkung im Einsatz:** Zeit und Aufmerksamkeit bei jeder Person, kein
Datenverlust.

**Empfehlung:** Beim Antippen des Funktionsfelds die häufigsten Funktionen
der Einheit (aus der StAN) als antippbare Liste zeigen. Im Querformat-Dialog
„Abbrechen" so groß wie die Aktion.

**Verifikation:** Funktion für eine Person ohne Tastatur zuweisen können.
Querformat-Dialog messen: beide Knöpfe gleich groß.

## Bestätigt aus anderen Runde-2-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind in den genannten
Berichten beschrieben und werden hier nicht als eigene Befunde gezählt:

- **R2-H1** ([feldtauglichkeit.md](feldtauglichkeit.md)): Beim Schrittwechsel
  bleibt die Scrollposition stehen. Aus Schritt 3 bei 2 000 px „Weiter →":
  Schritt 4 öffnet bei 2 000 px. Die Überschrift „4. Fahrzeuge" steht auf
  −1 555 px, im Bild „Fahrzeug 3 von 4" mit „Fahrzeug entfernen" direkt über
  der Fußleiste. Für den Handschuh-Helfer kommt hinzu: Er tippt nach dem
  Schrittwechsel in eine Stelle, die er nicht angesteuert hat.
- **R2-S3** ([stress-und-unterbrechung.md](stress-und-unterbrechung.md)):
  Auch das Öffnen einer Sammlung übernimmt die Scrollposition der Startseite.
  Gemessen 871 px vor und nach „Öffnen", im Querformat 743 px. Dort steht
  „Bogen scannen…" dann bei −31 px, also halb über dem Bildrand.
- **R2-H4** ([feldtauglichkeit.md](feldtauglichkeit.md)): Die Quittung
  „abgerückt … — Rückgängig" mit 74 × 30-px-Knopf steht außerhalb des Bilds
  (hier −1 944 px). Dasselbe gilt für „Meldung … entfernt. Rückgängig"
  (siehe R2-G1).
- **R2-H7** ([feldtauglichkeit.md](feldtauglichkeit.md)): Der Assistenten-Kopf
  mit Rücksprung, Themenwahl, Titel, Speicherzeile und dreizeiliger
  Schrittleiste reicht bei 360 × 640 bis rund 325 px. Im Querformat ist die
  Schrittleiste einzeilig und seitlich rollbar („6." abgeschnitten).
- **R2-N8** ([neuer-nutzer.md](neuer-nutzer.md)): Schritt 3 ist mit 19
  Personen als Karten 21 674 px lang (Feld-Thema 28 332 px). Die
  Schnelleingabe-Tabelle ist 651 px breit bei 326 px Rahmen. Die Löschknöpfe
  liegen am rechten Rand, fragen jetzt aber nach.

## Was gut funktioniert und erhalten bleiben sollte

- **Fußleiste:** „← Zurück" 106 × 44 px links, „Weiter →" 101 × 44 px rechts
  (Feld 120 × 51 / 115 × 51), 137 px dazwischen. `scroll-padding-bottom`
  96 px: Ein fokussiertes Feld rollt über die Leiste.
- **Formularfelder und Auswahllisten** durchgehend 44 px hoch, Abstände
  12–19 px. Telefon mit `inputmode="tel"`, E-Mail mit `inputmode="email"`,
  Sitzplätze und Zähler mit `inputmode="numeric"`. Datum und Eintreffzeit als
  native Auswahl (`type="date"`, `datetime-local`).
- **Stärke-Zähler:** −/+ je 52 × 52 px, getrennt durch das 60 px breite
  Zahlenfeld. Ein Tipp 25 px neben der Mitte von „+" trifft noch „+", erst
  40 px daneben das Zahlenfeld. Der Minusknopf ist nicht zu erwischen. Im
  Feld-Thema 60 × 60 px.
- **Sortierpfeile** in Karte und Tabelle 44 × 44 px mit 8 px Abstand,
  „Person entfernen" 13–20 px davon abgesetzt und mit Rückfrage.
- **Dialoge:** Aktion und „Abbrechen" je volle Breite × 44 px, 41 px
  auseinander, durch eine Linie getrennt. Beim einfachen Tipp sicher, zum
  Doppeltipp siehe R2-G1.
- **Keine Pflichtgesten:** Im Code gibt es keine Touch- oder Pointer-Handler
  für Wischen, Langdruck oder Ziehen. Sortieren, Löschen und Aufteilen gehen
  über Knöpfe. Tabellen rollen in eigenen Rahmen (Ausnahme R2-G2).
- **Feld-Thema:** hebt Chips, Vorschläge, Schrittleiste und Kopfziele auf
  43–54 px und ist von jedem Screen mit einem Tipp erreichbar.
- **Datenaktionen unten auf der Startseite** („Datensicherung",
  „Beispielbögen", „Geräteschlüssel neu erzeugen", „Alle Daten löschen")
  44–51 px hoch, 12 px Abstand.
- **Hochformat 320 × 568:** Auf keinem Screen scrollt die Seite seitlich
  (`scrollWidth` 320).

## Abschluss

- **Aufgabe geschafft:** ja. Eigener Bogen, Schnellerfassung der Stärke,
  Aufnahme und Abrücken am Meldekopf gehen mit Handschuhmaß. Mit Umwegen
  nach Fehlgriffen (R2-G1, R2-G4).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Rückfrage vor dem Löschen wirkt wie ein
  sicherer Halt, wird aber von einem prellenden Doppeltipp beantwortet, bevor
  der Helfer sie gelesen hat (R2-G1).
- **Größtes Einsatzrisiko:** Ein Doppeltipp auf „Person entfernen" in
  Bildmitte löscht eine Person samt Führungsfunktion ohne Rückweg (R2-G1).
- **Top-Priorität für die nächste Iteration:** Bestätigungsdialoge gegen den
  zweiten Tipp an derselben Stelle absichern und nach „Person entfernen" ein
  „Rückgängig" im Daumenbereich anbieten (R2-G1).

## Abgleich mit Runde 1

Grundlage: [../handschuh-bedienung.md](../handschuh-bedienung.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Messwert / Beobachtung |
| --- | --- | --- |
| G1 Sortierpfeile 36 px, 4 px Abstand, Tabellen-Löschen ohne Rückfrage | bestätigt behoben | Pfeile 44 × 44 px, 8 px Abstand (Karte und Tabelle). Im Feld-Thema kein Pfeil unter 44 px und kein Abstand unter 8 px. „Person entfernen" in der Tabelle 20 px neben dem letzten Pfeil und mit Rückfrage „Stein, Paul entfernen? …". Neu: der Doppeltipp in die Rückfrage (R2-G1). |
| G2 Chip-✕ 24 px | bestätigt behoben | ✕ 32 × 32 px, Chip 44 px hoch, im Feld-Thema ✕ 44 × 44 px. Ein Tipp 12 px daneben trifft das ✕. Rest: Standard unter 44 px, Entfernen ohne Rückweg (R2-G3, R2-G5). |
| G3 Querformat 118 px Formularfläche | bestätigt behoben | 640 × 360: Der Kopf rollt mit, fest ist nur die 60-px-Fußleiste. Beim Einstieg in Schritt 3 rund 210 px Formular (165 px mit Übungsbanner), nach dem Scrollen 300 px. Tastatur nicht prüfbar, Feld-Thema quer nicht gemessen. |
| G4 Kopf- und Fußzeilenziele 24–30 px | teilweise | „‹ Startseite" 80 × 44 px, 13 px Abstand. Themenwahl 44 px hoch (Feld 54). Fußzeilenknöpfe 44–51 px mit 12 px Abstand. Fußzeilen-Linklisten 44 px hoch, aber lückenlos und teils 29–39 px schmal („ASB", „DRK", „THW"). Kopf-Links „Alle Themen"/„Anleitung" 32 px hoch (R2-G3). |
| G5 Kästchen 18 px, Tabellenköpfe 9–20 px | bestätigt behoben (Rest) | Kästchen/Radios 24 × 24 px (Feld 1,7 rem), Zeile 44 px. Spaltenköpfe der Einsatz-Tabelle als ganze Zelle 44 px hoch antippbar. Die Spalten „F/U/M" bleiben 25–33 px schmal mit 1 px Abstand (R2-G3). |
| G6 Fußleiste über letztem Feld, Übersichtsknöpfe 6 px | bestätigt behoben | `scroll-padding-bottom` 96 px; ein angetipptes Feld über der Leiste bleibt stehen (y 500 → 500). „Bogen übergeben…", „In Einsatz aufnehmen…", „Als Vorlage speichern", „Neuer Bogen" je 44 px hoch, 12 px Abstand. Ein Tipp 20 px über „Neuer Bogen" trifft noch diesen, 26 px darüber die Lücke. |

Einordnung der eigenen Befunde: R2-G1, R2-G2, R2-G4 und R2-G5 sind neu.
R2-G3 sammelt die Reste von G2, G4 und G5 im Standard-Thema und kommt mit
Schrittleiste, Vorschlagslisten und „ändern" um Ziele erweitert, die Runde 1
nicht gemessen hat.

Bilanz: Von sechs Runde-1-Befunden sind fünf bestätigt behoben (G1, G2, G3,
G5 mit Rest, G6), G4 ist teilweise behoben. Die Ziele auf den Hauptwegen
haben jetzt 44 px und 8–12 px Abstand. Das Risiko hat sich von zu kleinen
Zielen zu Doppeltipp und Layoutsprung verschoben (R2-G1, R2-G4) und zu
einer Seite, die in der Tabellenansicht seitlich wegrutscht (R2-G2).
