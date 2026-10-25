# Audit „Arbeitsablauf", Runde 6 (Einheit → Meldekopf → zweiter Meldekopf → Stab, dazu Papier)

Stand: 23.10.2026 (erster Durchgang 17.10., Fortsetzung 23.10.) · Prüfer:
Rollenaudit `thw-workflow-reviewer` · Prüfgegenstand: Web-App,
Produktionsbuild (`vite preview`, Port 4173), Commit `03a0011`. Der Server
wurde zwischen den beiden Tagen neu gestartet, gleicher Build. Zwei später auf
`main` gelandete Commits (nur Lagemonitor) sind im geprüften Build nicht
enthalten.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde. Schwerpunkt auf den dort umgebauten Stellen: Fassungswechsel
im Exportstand, Nachtrag-Dateien (`nachtrag-seit-…`), Rückkehr abgerückter
Einheiten durch Folgemeldung, „Einsatz importieren…" mit „In die vorhandene
Sammlung übernehmen", Exportstand im Umschlag der Sammel-PDF (Ablösung),
Abgleich in beide Richtungen mit Nummernänderungen und Papier-Abgleich ohne
vorbelegte Eintreffzeit.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Locale de-DE, Telefon 360 × 640 mit `isMobile`/`hasTouch`. Jedes Gerät ist ein
eigener Browser-Kontext mit eigenem Speicher; zwischen Skripten reichte ich
`storageState` weiter (wie ein Gerät, das zwischendurch neu geöffnet wird).
Elf weitere Prüfer nutzten den Server gleichzeitig; Zeiten habe ich nicht
gemessen. Maße, Zählungen und Dateiinhalte sind davon unberührt.

- **A-Geräte** (Einheiten): `eeb.entwurf.v1` aus `examples/thw/` (`001`
  Albstadt, `003` Crailsheim, `005` Haßmersheim, `007` Laufenburg, `009`
  Oberhausen-Rheinhausen, `011` Rottweil), `uebung: false`, `stand` auf
  Minuten vor jetzt, Einsatzzeitraum auf den Prüftag. Der Link kam aus „Bogen
  übergeben… → Weitere Formate → Link teilen" (`navigator.share` abgefangen,
  Host auf `localhost:4173` umgeschrieben). Von Albstadt mehrere Fassungen
  (älterer Stand, eine Person ersetzt, eine Person mehr, zwei Personen weniger).
- **M1** (Meldekopf): Sammlung „Hochwasser Weser" bzw. „Lage X"/„Lage Y" über
  die Oberfläche angelegt, Bögen über die Links aufgenommen, Fassungswechsel,
  Abrücken und Rückkehr durch Folgemeldung, Lageblatt, Sammel-PDF,
  Übersichts-CSV, „Alle Daten", Excel, jeweils vollständig und als Nachtrag.
- **M2** (zweiter Meldekopf): eigene, unabhängig angelegte Sammlung gleichen
  Namens mit eigenen Einheiten (`007`, `009`) und älterem Albstadt-Stand;
  „Einsatz importieren…" mit der Sammel-PDF von M1, dann Gegenimport M2 → M1,
  wobei M1 inzwischen Rottweil als Nr. 4 vergeben hatte (Nummernkollision).
- **M4** (Ablösung): leeres Gerät, „Einsatz importieren…" mit der Sammel-PDF
  von M1 nach mehreren Lieferungen an den Stab.
- **S** (Stab): leeres Gerät, Import der Nachtrag-Sammel-PDF, danach des
  zweiten Nachtrags in dieselbe Sammlung.
- **M3** (Papier): Sammel-PDF von M2 mit `pdftoppm` in 12 Seitenbilder zerlegt,
  auf einem leeren Gerät über „Bögen einlesen…" gelesen, danach „Lage vom
  Papier abgleichen…" mit absichtlicher Doppelnummer, Nummerntausch und
  teilweise leeren Eintreffzeiten. Lageblatt danach gelesen.
- **V** (Fassungsvorrang): Schnellerfassung 0 / 2 / 8 / 10 über einen Entwurf
  mit `fremd.einsatzId`, „In Einsatz übernehmen", CSV-Lieferung, danach der
  Bogen 0 / 3 / 9 / 12 mit älterem Stand.

Heruntergeladen und gegengelesen: Lageblatt (auch das von M3), Sammel-PDF
(9 bzw. 12 Seiten), Nachtrag-Sammel-PDF, „Übersicht als CSV" (voll und
Nachtrag), „Alle Daten als CSV" (voll und Nachtrag), Excel „Oldenburg" (voll
und Nachtrag, Zellen aus dem XML gelesen), dazu `pdftotext`, `pdftoppm` und die
Seitenbilder. Die Screenshots habe ich angesehen. Skripte und Bilder:
`scratchpad/runde6/ablauf/`.

Reihenfolge: Ich habe zuerst ohne Blick in frühere Berichte getestet. Vorab
gelesen habe ich nur den Abschnitt „Prüfaufbau" des Runde-5-README; mein
`grep -A40` hat dabei die ersten Zeilen des dort anschließenden Abschnitts
„Stand der Behebung" mit ausgegeben (Paketübersicht, kein Befundtext). Ins
Verzeichnis der Runde-5-Skripte habe ich nur die Dateinamen gelistet. Nach
dem ersten Durchgang habe ich `runde-5/arbeitsablauf.md` samt „Stand der
Behebung" gelesen und erst danach die Überschriften der anderen
Runde-6-Berichte und die Stellen, die mein Thema berühren. Was dort steht,
nenne ich nur als Verweis. Einzelne Code-Stellen habe ich nach dem Beobachten
nachgelesen, um die Ursache einzugrenzen; geändert habe ich nichts.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit übergibt ihren Bogen (QR, Link oder PDF); **Annahme:** der Link
   kommt per Chat oder Mail und öffnet die App in einem neuen Tab (Kaltstart).
2. Der Meldekopf nimmt auf, bei einer Nachmeldung entscheidet er über die
   Fassung, lässt abrücken, druckt das Lageblatt.
3. Ein zweiter Meldekopf oder die Ablösung führt die Lage auf einem eigenen
   Gerät weiter; beide gleichen später ab.
4. **Annahme:** Der Meldekopf liefert dem Stab erst alles, dann nur das Neue
   (PDF, CSV, Excel); der Stab ersetzt dabei Zeilen geänderter Einheiten.
5. Fällt ein Gerät aus, bleibt das gedruckte Übergabeblatt; ein neues Gerät
   liest es ein und gleicht Nr., Zeiten und Zug vom Blatt ab.

**Nicht prüfbar:** Kamera-Scan und QR-Anzeige im Vollbild (die QR-Codes habe
ich über PDF, Link und Seitenbilder gelesen), Handscanner, Nahbereichs-
Weitergabe, natives Share-Sheet (nur abgefangen), echtes Drucken, Darstellung
der Excel-Datei in Excel, native Builds, WebKit. Alle Geräte teilen dieselbe
Systemuhr; ein Uhrversatz zwischen den Geräten (der die Regel „der jüngere
Stand gilt" belasten würde) war nicht nachzustellen. Das Feld „Eingetroffen
am" im Papier-Abgleich zeigt hier das US-Format; das ist die Browsersprache
der Testumgebung, kein Befund. Nicht nachgestellt habe ich auf der
Einheitenseite, ob eine Änderung nach der Übergabe als „seit der Übergabe
geändert" markiert wird (zwei Anläufe scheiterten an meinem Skript), und den
Weg „Karte → Bogen übernehmen" aus R5-W1 (stattdessen die Entscheidung bei
der Rückfrage beim Eintreffen). Einmal schlug unter Last in meinem Skript das
Anlegen einer Sammlung still fehl (dreimal nacheinander, kurz danach nicht mehr
reproduzierbar, Ursache offen); als Befund taugt das nicht. Alle Zeiten sind
unter Last entstanden und nicht gemessen.

## Urteil

Die Wege, die Runde 5 umgebaut hat, tragen. Ein Fassungswechsel zählt im
Exportstand („seitdem 1 neuer Bogen"), die Nachtrag-Dateien heißen einheitlich
`nachtrag-seit-…` (die erste Lieferung `erste-lieferung-…`), tragen die
Hinweiszeile „nicht die ganze Lage" und trennen „Summe Nachtrag — nur neue
Einheiten" von „Geänderte Einheiten … ersetzen ihre Zeile". Die Rückkehr einer
abgerückten Einheit durch eine Folgemeldung steht in Karte, Quittung und
Historie. „Einsatz importieren…" fragt bei zwei unabhängig angelegten,
gleichnamigen Sammlungen, führt zusammen und nennt die geänderten Nummern.
Der Exportstand reist im Umschlag der Sammel-PDF auf die Ablösung („zuletzt …
(vom anderen Gerät)"). Der Papier-Abgleich lässt die Eintreffzeit leer, prüft
Doppelnummern, nimmt einen Nummerntausch an, und das Lageblatt trägt „Zeit
nicht bestätigt (vom Papier)", solange die Zeit fehlt.

Reibung entsteht an einer Naht, die erst mit zwei Meldeköpfen sichtbar wird:
Der Exportstand zählt jede unbekannte Meldung als „neu", auch eine ältere
Fassung, die erst beim Abgleich vom anderen Gerät eintrifft und nur in der
Historie landet. Sie löst „seitdem 1 neuer Bogen" aus, und der Nachtrag
liefert dann die alte Zeile der Einheit, ohne Grund, in der Übersichts-CSV mit
der alten Stärke (R6-W1). Der Stab, der geänderte Zeilen ersetzt, würde die
richtige Zeile durch die falsche überschreiben. Daneben stehen zwei kleine
Stellen: Die Rückfrage bei einer Nachmeldung zeigt nicht, was sich geändert
hat (R6-W2), und die Quittung des Abgleichs meldet die normale Zeitabweichung
doppelt als „Abweichung" (R6-W3).

Nicht neu, aber für diesen Arbeitsablauf der größte Fehler im Alltag: Wer den
Link einer Nachmeldung aus dem Chat antippt (Kaltstart), bekommt die Rückfrage
„Einheit ist bereits gemeldet" nur für Bruchteile einer Sekunde und danach
„… nicht aufgenommen." Das steht schon als R6-N1 im Bericht „Neuer Nutzer"; ich
habe es im Arbeitsablauf nachgestellt (siehe Verweise).

Die Einzelaufgaben schafft man ohne fremde Hilfe, außer der Nachmeldung per
Link beim Kaltstart (dort nur über den Umweg „Bogen öffnen"). Beim Zusammenführen
zweier Meldeköpfe und der Lieferung an den Stab stimmt das Ergebnis in einem
Sonderfall nicht, ohne dass die App es sagt.

## Befunde

### R6-W1 [P1] Nachtrag und Exportstand zählen eine ältere, nachträglich eingetroffene Fassung als „neuen Bogen" und liefern deren Zeile statt der geltenden (neu)

**Priorität:** P1 · gemessen (Übersichts-CSV, Zähler, Quittung, Sammel-PDF,
Excel; zweimal mit anderen Bögen wiederholt) · Ursache im Code gelesen, nicht
durch Eingriff belegt

**Fundstelle / Aufgabe:** Meldekopf M1 hat Einheit X in Fassung 2 (Stand
15:45) und dem Stab per Übersichts-CSV geliefert. Der zweite Meldekopf M2
kannte nur eine ältere Fassung (Stand 14:15 bzw. 13:59). M1 importiert die
Sammel-PDF von M2 („In die vorhandene Sammlung übernehmen"), danach
„Nur neue Bögen seit dem letzten Export" → „Übersicht als CSV". Code:
`src/app/export-stand.ts`, `neueEintraege()` (Z. 463–467) zählt jeden
Eintrag, dessen ID beim Stand fehlte, auch einen, der nicht die geltende
Fassung ist und in der Historie liegt; `nachtragEintraege()` (Z. 475–484)
übernimmt ihn in die Lieferung; `nachtragGruende()` (Z. 536–551) kennt nur
geltende Fassungen, deshalb bleibt der Grund leer.

**Beobachtung:**
- Zustand an M1 vor dem Import: Karte „Nr. 1 THW Albstadt …", Stärke 1 / 1 / 3 / 5,
  Stand 15:45. Block „Nur neue Bögen": „Übersicht als CSV: zuletzt 15:30 ·
  seitdem keine neuen Bögen".
- Nach dem Import von M2 (Quittung: „keine neue Einheit, 1 Folgemeldung(en)",
  die Karte zeigt weiter Stärke 1 / 1 / 3 / 5, die ältere Fassung steht in
  „Historie"): Block „seitdem **1 neuer Bogen**". Die geltende Fassung hat
  sich nicht geändert.
- Nachtrag-CSV: eine Zeile für Albstadt mit **Stärke gesamt 3**, **Stand
  13:59** (die alte Fassung), Eingetroffen und Empfangen 15:30 (Zeit des
  Einlesens der alten Fassung), Spalte „Im Nachtrag wegen" **leer**, Kopfzeile
  „1 Einheit in dieser Datei". Die Karte, die Übersichts-CSV der ganzen Lage
  und „Alle Daten" zeigen dagegen Stärke 5.
- Die Formate sind uneins: Die Nachtrag-Sammel-PDF zeigt Stärke 1 / 1 / 3 / 5,
  das Nachtrag-Excel zeigt in den Personalspalten die geltenden 1 / 1 / 3, die
  Nachtrag-CSV die alte Stärke 3.
- Beim ersten Durchgang (17.10.) mit zwei weiteren Einheiten: „seitdem 5 neue
  Bögen", obwohl nur vier Einheiten Neues brachten; auch dort stand Albstadt
  mit der alten Fassung (Stand 10:23 statt 11:12) und leerem Grund im Nachtrag.

**Folge:** Der Stab ersetzt laut Kopfzeile die Zeile der Einheit durch die
Nachtragszeile. Er bekommt dadurch die ältere Stärke und den falschen Stand,
ohne Warnung und ohne Grund. Zusätzlich ist der Zähler „seitdem N neue
Bögen" unzuverlässig; er schlägt nach jedem Abgleich zweier Meldeköpfe an,
ohne dass sich die Lage geändert hat. Wer dem Zähler traut, verschickt einen
unnötigen Nachtrag (und liefert dabei einen falschen); wer ihm misstraut,
übersieht eine echte Änderung. Das trifft genau den Fall, den die Ablösung und
der zweite Meldekopf erzeugen.

**Empfehlung:** Für den Exportstand und den Nachtrag zählt, was sich an der
geltenden Fassung je Einheit ändert, nicht, welche Meldung neu eingetroffen
ist. Eine ältere Fassung, die nur in die Historie geht, ändert weder Zähler
noch Nachtrag. Wo sie ausnahmsweise im Nachtrag steht (etwa weil sie die
einzige Meldung der Einheit ist), trägt die Zeile die geltende Fassung und
den Grund. Alle vier Formate sollen für dieselbe Einheit dieselbe Stärke
zeigen.

**Nachprüfung:** M1: Einheit in zwei Fassungen aufnehmen (Stand −60 und −5 min,
Stärke 4 und 5), „Übersicht als CSV" mit „Nur neue Bögen" liefern. M2:
unabhängige Sammlung gleichen Namens mit einer dritten, noch älteren Fassung
(Stand −90, Stärke 3), Sammel-PDF erzeugen. M1: Import → „In die vorhandene
Sammlung übernehmen". Erwartet: „seitdem keine neuen Bögen", Nachtrag-CSV ohne
Albstadt bzw. mit Stärke 5. Wiederholen für „Alle Daten", Excel und PDF.

### R6-W2 [P3] Die Rückfrage „Einheit ist bereits gemeldet" zeigt nicht, was sich geändert hat, und nennt den Abrückstand nicht (neu)

**Priorität:** P3 · beobachtet

**Fundstelle / Aufgabe:** Link oder Datei einer Nachmeldung für eine Einheit,
die schon in der Sammlung steht. Code: `src/app/app.tsx`, Rückfrage ab Z. 1822
(`MeldungsGegenueberstellung`).

**Beobachtung:**
- Albstadt, Fassung 2 mit einem anderen Namen an dritter Stelle
  (Lehmann → Neumann), sonst gleich: „Bisher: Stärke 1 / 1 / 2 / 4 · Lang,
  Sabine · THW-80101, THW-80102 · Stand 10:40" und „Neu: Stärke 1 / 1 / 2 / 4 ·
  Lang, Sabine · THW-80101, THW-80102 · Stand 11:11". Beide Zeilen sind bis auf
  den Stand gleich; die Änderung steht nirgends.
- Crailsheim, vorher abgerückt: Die Rückfrage sagt nicht, dass die Einheit
  abgerückt war und mit der neuen Fassung wieder zählt. Das erfährt man erst
  aus der Quittung („⚠ wieder anwesend … zählt wieder mit", mit „Rückgängig").

**Folge:** Die Entscheidung „neue Fassung" ist fast immer richtig, wird aber
ohne Anhalt getroffen; bei einer zweiten, gleichnamigen Einheit fehlt der
Anhalt für „Als eigene Einheit führen". Der Rückkehr-Hinweis kommt zwar,
aber nach der Entscheidung.

**Empfehlung:** In der Gegenüberstellung eine Zeile „Geändert:" mit den
Unterschieden (Personen, Fahrzeuge, Bedarf; wie die Karte sie nach der
Aufnahme nennt) und, falls zutreffend, „war abgerückt seit …, zählt dann
wieder mit".

**Nachprüfung:** Bogen mit einem getauschten Namen und gleicher Stärke an
eine Sammlung schicken, in der die Einheit abgerückt ist; die Rückfrage muss
beides nennen.

### R6-W3 [P3] Die Quittung beim Abgleich zweier Meldeköpfe meldet die normale Eintreffzeit-Abweichung doppelt und als „Abweichungen" (neu)

**Priorität:** P3 · beobachtet (drei Importe)

**Fundstelle / Aufgabe:** „Einsatz importieren…" → „In die vorhandene Sammlung
übernehmen" für eine Lage, die beide Geräte unabhängig empfangen haben.

**Beobachtung:** Die Quittung enthält den Satz „1 kleine Abweichung bei der
Eintreffzeit (Minuten, weil beide Geräte sie beim Empfang selbst vergeben)"
und darunter noch einmal die Zeile „Eintreffzeit: 1 Abweichungen" (bei
mehreren „n Abweichungen"). Sie erscheint bei jedem Doppelempfang derselben
Einheit, also immer, wenn zwei Meldeköpfe dieselbe Lage führen.

**Folge:** Eine Meldung, die in diesem Ablauf immer kommt und nie eine Handlung
verlangt, gewöhnt daran, das Wort „Abweichung" zu überlesen; die echten
Widersprüche (anderer Auftrag, anderer Zug) stehen in derselben Rubrik.

**Empfehlung:** Zeitabweichungen unter einer Schwelle (etwa 15 Minuten) nicht
melden oder nur im eingeklappten Teil; die Zeile nicht doppelt führen; „1
Abweichung" im Singular.

**Nachprüfung:** Zwei Geräte empfangen denselben Link im Abstand von zwei
Minuten, Import von A nach B: keine Zeile „Eintreffzeit" im sichtbaren Teil.

## Verweise auf andere Runde-6-Berichte

- **R6-N1 (Neuer Nutzer, P1):** Eine Rückfrage, die direkt auf „Wohin damit?"
  folgt, schließt sich selbst („… nicht aufgenommen."). Ich habe es im
  Arbeitsablauf über den Link nachgestellt: App kalt starten (neuer Tab) mit
  dem Link einer Nachmeldung für eine schon gemeldete Einheit, „In …
  aufnehmen" tippen. Die Rückfrage „Einheit ist bereits gemeldet" stand
  rund 240 ms (Messung unter Last), danach „„THW Albstadt Zugtrupp Technischer
  Zug" nicht aufgenommen." (viermal in vier Versuchen, auch mit sechs Sekunden
  Wartezeit vor dem Tipp). Bei geöffneter Sammlung und Wechsel des Link-Teils
  im selben Tab (`location.hash`) erscheint die Rückfrage normal; eine neue
  Einheit wird auch bei Kaltstart aufgenommen. Für den Arbeitsablauf ist das
  der Regelfall der Nachmeldung: Der Link aus dem Chat öffnet einen neuen Tab.
  Der Ausweg „Bogen öffnen → In Einsatz-Sammlung ablegen…" ist nicht
  ausgeschildert.
- **R6-K6 (Führungssicht, P2):** Der Satz über Nummernwechsel beim Import füllt
  die Quittung. Bestätigt: Bei M2 (drei Nummern verschoben) bestand die
  Quittung zu rund zwei Dritteln aus diesem Satz.
- **R6-K9 (Führungssicht, P3):** „Sammel-PDF (nur neue Bögen)" liefert beim
  ersten Nachtrag die ganze Lage (die Datei heißt dann `erste-lieferung-…`).
- **R6-A1 (Analog first, P2):** Kasten „Stand am Meldekopf" und die Einlesezeit.
  Mein Lageblatt von M3 trägt „Zeit nicht bestätigt (vom Papier)" (siehe
  Bestätigtes); die Sammel-PDF habe ich dazu nicht gegengelesen.
- **R6-N3 (Neuer Nutzer, P2):** Die Karte „Lage noch nicht abgeglichen" nach
  „Abgleich übernehmen". Bei meinem Teil-Abgleich (zwei Einheiten ohne Zeit)
  blieben die Karten dieser beiden Einheiten richtig auf „vom Papier, Zeiten
  prüfen"; die Karte oben habe ich nicht gesondert verfolgt.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Fassungswechsel im Exportstand:** Eine Folgemeldung nach der Lieferung
  zählt als „seitdem 1 neuer Bogen"; die Fassung, die beim Eintreffen mit
  älterem Stand gewählt wird („gilt trotz älterem Stand … die bisherige Fassung
  liegt in der Historie"), zählt ebenfalls (CSV „seitdem 1 neuer Bogen",
  Sammel-PDF und Excel „seitdem 2 neue Bögen").
- **Nachtrag-Dateien:** `eeb-einsatz-nachtrag-seit-20261017-1112-…` in allen
  vier Formaten (PDF, CSV, „Alle Daten", Excel); `erste-lieferung-…` für „nur
  neue" ohne Bezugspunkt. CSV: Spalte „Im Nachtrag wegen" („geändert:
  Folgemeldung"), Zeile „Summe Nachtrag — nur neue Einheiten (0)" getrennt von
  „Geänderte Einheiten (1) — ersetzen ihre Zeile der letzten Lieferung, NICHT
  zur Summe addieren", Schlusszeile „NACHTRAG seit … — nicht die ganze Lage".
  Excel: Kopfzeile „NACHTRAG – Teil der Lage", Block „Geänderte Einheiten".
  Der Stab (Gerät S) übernimmt den zweiten Nachtrag in seine Sammlung:
  „1 neue Einheit, 1 Folgemeldung(en) … Stärke 5 → 2 (−3)".
- **Exportstand je Format** mit eigenem Bezugspunkt; die Zeile „Sammel-PDF an
  den Stab: noch nie als Nachtrag geliefert — alle Bögen sind neu. Die
  Weitergabe vom … zählt hier nicht (sie geht an die Ablösung oder ins
  Archiv)" erklärt, warum; „Ab dieser Weitergabe rechnen" steht daneben.
- **Rückkehr abgerückter Einheiten:** Nach „Abrücken" (sofort, mit
  „Rückgängig") und einer Folgemeldung zeigt die Karte „⚠ wieder anwesend —
  war abgerückt seit … (durch die Folgemeldung) — zählt wieder mit" mit
  „Wieder abrücken"; Quittung, Kenntnis-Liste und der Import auf einem zweiten
  Gerät nennen es („⚠ wieder da").
- **„Einsatz importieren…":** Bei gleichnamiger, unabhängig angelegter
  Sammlung die Frage „Es gibt schon eine Sammlung …" mit „In die vorhandene
  Sammlung übernehmen" / „Als eigene Sammlung" und Hinweis „Laufende Nummern
  können sich dabei ändern"; Zusammenführen in beide Richtungen (M2 → M1,
  M1 → M2). Bei gleicher Sammlungskennung kein Dialog, Quittung „keine neue
  Einheit, 2 Folgemeldung(en)".
- **Nummernänderungen:** „Nummern geändert: Nr. 4 gehört jetzt THW Laufenburg
  … (vorher THW Rottweil …), THW Rottweil … hat Nr. 6 — am Funk genannte
  Nummern und das gedruckte Lageblatt gelten nicht mehr, Lageblatt neu
  drucken." Nach dem Gegenimport tragen beide Meldeköpfe dieselben Nummern;
  die Einheit, die das eine Gerät nicht kannte, folgt am Ende.
- **Exportstand im Umschlag:** Gerät M4 (Ablösung) zeigt nach dem Import „zuletzt
  … (vom anderen Gerät) · seitdem 5 neue Bögen" für alle vier Formate und
  rechnet den Nachtrag ab dort weiter.
- **Papier-Abgleich:** Das Feld „Eingetroffen am" ist leer („leer = Zeit des
  Einlesens, nicht bestätigt"); „Nr. laut Blatt" mit Doppelnummern-Prüfung
  („Abgleich unvollständig — „Nr. 2" steht bei … und …. Nichts übernommen.");
  ein Nummerntausch (Albstadt 2, Crailsheim 1) geht durch; ein Teil-Abgleich
  nennt „Für 2 Einheiten stand keine Eintreffzeit im Abgleich"; die
  übrigen Karten bleiben „vom Papier, Zeiten prüfen"; das Lageblatt von M3
  trägt „Zeit nicht bestätigt (vom Papier)" und führt die abgerückte Einheit
  mit Zug und Zeit im eigenen Block. Beim Einlesen der Seitenbilder: „12 Bilder
  gelesen — 5 Bögen aufgenommen", mit Knopf „Lage vom Papier abgleichen…".
- **Sammel-PDF einer anderen Sammlung** in „Bögen einlesen…": die Wahl
  „Übernehmen, Zug …", „Ohne Zug-Zuordnung", „Nur die Bögen" mit den Folgen
  in Klartext.
- **Lageblatt/Sammel-PDF:** Summen laut Gerät stimmen mit der Karte überein;
  die Zeile „Lageblatt erstellt … · seitdem 1 neue Meldung — Aushang ist nicht
  mehr aktuell, neu drucken" meldet nach einer Folgemeldung.
- **Link-Übergabe:** „Link geteilt 15:35 Uhr — Empfang nicht bestätigt." mit
  „Gegenstelle hat ihn — als übergeben vermerken"; der Dialog „Meldung von …
  empfangen. Wohin damit?" bei geöffneter Sammlung.

## Abgleich mit Runde 5

Geprüft gegen `runde-5/arbeitsablauf.md` samt „Stand der Behebung".

| Befund Runde 5 | Stand in Runde 6 | Beleg |
| --- | --- | --- |
| R5-W1 Fassungsentscheidung nach Export: „keine neuen Bögen", Nachtrag gesperrt (P1) | hält, mit Vorbehalt | Die Entscheidung bei der Rückfrage („gilt trotz älterem Stand") und eine Folgemeldung zählen im Exportstand (CSV „seitdem 1 neuer Bogen", Sammel-PDF/Excel „2 neue Bögen"). Der Weg „Karte → Bogen übernehmen" wurde nicht nachgestellt. Neue Lücke daneben: R6-W1 (ältere Fassung zählt als neu). |
| R5-W2 Import legt still eine zweite gleichnamige Sammlung an (P1) | hält | Frage mit beiden Antworten, Zusammenführen in beide Richtungen. |
| R5-W3 Nr. ändern sich still beim Zusammenführen (P2) | hält, nur teilweise gut lesbar | Hinweis samt „Lageblatt neu drucken" steht in der Quittung; der Satz ist lang (R6-K6). |
| R5-W4 Quittung „enthält nichts, was hier fehlte" (P2) | hält | Quittungen nennen Folgemeldungen und Zahl; der Fall „Bogen der Einheit gilt, ersetzt die Schnellerfassung (Stärke 2 → 6)" wurde nicht eigens nachgestellt. |
| R5-W5 Sammel-PDF-Nachtrag ignoriert die Weitergabe; „Sammel-PDF" meint zwei Dinge (P2) | wirkt teilweise | Die Zeile erklärt die Weitergabe, „Ab dieser Weitergabe rechnen" ist da, die erste Lieferung heißt `erste-lieferung-…`. Der Knopf „Sammel-PDF (nur neue Bögen)" liefert beim ersten Mal weiter die ganze Lage (R6-K9). |
| R5-W6 Exportstand wandert nicht mit der Lage (P2) | hält | M4 zeigt die Stände „(vom anderen Gerät)" in allen vier Formaten. |
| R5-W7 Nachtrag: Zeile ohne Grund, volle Stärke in „Summe Nachtrag" (P2) | wirkt teilweise | Grund und getrennte Summen stehen in allen geprüften Fällen, außer bei einer älteren Fassung, die nachträglich eintrifft: Grund leer, Zeile mit der alten Stärke (R6-W1). |
| R5-W8 Drei Namensschemata für Nachtrag-Dateien (P3) | hält | Ein Schema `nachtrag-seit-<Zeitpunkt>-…` für PDF, CSV, „Alle Daten", Excel. |
| R5-W9 „3 Fahrzeuge abgemeldet" an der Schnellerfassung (P3) | nicht nachgestellt | In der umgekehrten Richtung (Bogen nach Schnellerfassung) las ich „3 Fahrzeuge dazu"; den Wortlaut aus R5-W9 habe ich nicht ausgelöst. |
| R5-K1 Folgemeldung holt Abgerückte still zurück (aus Runde 5, Führungssicht) | hält | Karte, Quittung und Import nennen die Rückkehr; „Wieder abrücken" an der Karte. |
| Papier-Abgleich ohne vorbelegte Eintreffzeit (Runde-5-Schwerpunkt) | hält | Feld leer, Lageblatt „Zeit nicht bestätigt (vom Papier)". |

Verkehrt hat sich keine der Runde-5-Behebungen. Die beiden Punkte, die nur
teilweise wirken (R5-W5, R5-W7), sind benannt; R6-W1 ist die Lücke neben der
Behebung von R5-W1/W7, kein Rückschritt.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Einheit → Meldekopf → zweiter Meldekopf →
  Stab und der Papierweg gelingen; Nachmeldung per Link beim Kaltstart nur
  über „Bogen öffnen" (R6-N1), der Nachtrag nach einem Abgleich zweier
  Meldeköpfe nicht verlässlich (R6-W1).
- **Fremde Hilfe nötig:** nein für die Einzelschritte; ja, um zu erkennen, dass
  die Nachtragszeile die alte Fassung trägt, denn die App sagt es nicht.
- **Größtes Missverständnis:** „Seitdem 1 neuer Bogen" klingt nach einer
  Änderung der Lage, zählt aber auch eine ältere Fassung, die nur in der
  Historie liegt.
- **Größtes Einsatzrisiko:** Der Stab ersetzt eine richtige Zeile durch die alte
  Stärke aus dem Nachtrag, ohne dass jemand etwas bemerkt.
- **Top-Priorität für die nächste Iteration:** Exportstand und Nachtrag auf die
  geltende Fassung je Einheit stützen (R6-W1), danach die Rückfrage bei der
  Nachmeldung beim Kaltstart (R6-N1).

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 3 behoben, 0 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-W1 | behoben | Nur die geltende Fassung zählt als neuer Bogen und kommt in den Nachtrag (`export-stand.ts`, `neueEintraege`); eine ältere, nachträglich eingetroffene Fassung ändert Zähler und Nachtrag nicht. Unit-Test. |
| R6-W2 | behoben | Die Gegenüberstellung nennt „Geändert: …“ und, wenn die Einheit abgerückt war, dass sie wieder mitzählt. |
| R6-W3 | behoben | Die Einzelheiten heißen „Einzelheiten zur Eintreffzeit“; keine doppelte Zahl, kein „1 Abweichungen“. Eine Schwelle (15 Minuten) wurde nicht eingeführt. |
