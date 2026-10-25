# Audit „Handschuh-Bedienung“, Runde 7 (Touch-Ziele, Abstände, Doppeltipps, Rückfragen)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde. Geprüft sind die in Runde 6 geänderten Stellen: Fußleiste des
Assistenten, Zurück-Verlauf der Startseitenfenster, Rückfragen,
Zwei-Fenster-Abgleich, Lagemonitor, Papier-Abgleich, Geräteuhr-Rückfrage,
Deckel bei großer Schrift, Ecke „◐“ im Querformat.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener Browser-Kontext.
Viewports 360 × 640 (Grundeinstellung), 320 × 568, 640 × 360 quer und Tablet
820 × 1180; Standard- und Feld-Modus (`eeb.anzeigemodus.v1`); 100 % und
„200 %“ Schrift (`html { font-size: 200% !important }`); Browser-Zoom 200 %
nachgestellt (halbierter CSS-Viewport, doppelte Pixeldichte: 180 × 320,
160 × 284, 320 × 180). Das ist kein echter Chrome-Zoom.

Zustände per `localStorage`-Seed, jeweils mit `uebung: false` und aktuellem
`stand`: `eeb.entwurf.v1` (Großbogen mit 38 Personen, Bogen 013),
`eeb.einsaetze.v1` (Sammlung „Hochwasser Musterstadt“ aus sechs Beispielbögen,
einmal mit `vomPapier` je Eintrag, einmal mit alter Änderungszeit),
`eeb.vorlagen.v1` (über die Übersicht erzeugt), `eeb.uhr.v1` (365 Tage alt).

Blindprüfung: Die Berichte unter `docs/audits/` habe ich erst nach den
Messungen gelesen. Gemessen habe ich Rechtecke per `getBoundingClientRect`
und Tipps per `touchscreen.tap`. Maßstab wie in Runde 6: 44 px Mindestkante,
8 px Mindestabstand, mit Arbeitshandschuh eher 48 px und 12 px. Elf weitere
Prüfer nutzten den Server gleichzeitig; Zeitmessungen sind unsicher. Playwright
tippt nach `scrollIntoView` in die Bildmitte: zwei Tipps nacheinander an
derselben Stelle fallen in die Ortssperre (1,5 s, 40 px, „Einen Moment …“);
wo ein Lauf daran scheiterte, habe ich 1,8 bis 2,5 s gewartet. Das ist die
Sperre, kein Fehler. Skripte und Bildschirmfotos liegen außerhalb des
Repositorys im Scratchpad (`runde7/handschuh/`).

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, die echte
Bildschirmtastatur (nachgestellt durch einen niedrigeren Viewport), Wischen und
Ziehen, Safari/WebKit, native Datums- und Zeitpicker, Kamera und Handscanner,
echter Browser-Zoom und echte Systemschrift, Zeitmessungen ohne Last.

Kennzeichnung: **gemessen** heißt Zahl aus dem Browser, **beobachtet** heißt im
Ablauf gesehen, **Risiko** heißt plausibel, aber nicht nachgestellt.

## Urteil

Die Runde-6-Behebungen tragen überwiegend. Die Fußleiste des Assistenten
überdeckt sich nirgends mehr (3 Breiten × Standard/Feld × 100 %/200 %, Schritte
1, 3, 5: Überlappung 0 px, kein Überlauf; „◐“ ist bei Enge ein reines Symbol,
„Zur Übersicht →“ wird schmaler). Die Einsatzansicht läuft bei 200 % Schrift
nicht mehr seitlich über. Beim Verschieben mit „▼“ rollt die Ansicht um 198 px
mit, die Person bleibt unter dem Finger (dreimal getippt: Person 4 steht danach
an Platz 7). „✕“ trägt einen sichtbaren Rahmen. Der Zurück-Verlauf ist
stimmig: Zurück schließt zuerst das Fenster, dann den Schritt, zuletzt die
Startseite; der Entwurf bleibt erhalten. Gefährliche Handlungen haben
Rückfragen mit getrennten Knöpfen (Person entfernen, Verwerfen, Einsatz löschen,
„Alle Daten löschen“ mit Haken, Geräteuhr mit zweiter Rückfrage).

Reibung bleibt an den neuen Stellen der Runde 6: Der Papier-Abgleich, der
Rückweg nach einem Geräteausfall, wirft 36 Eingabefelder mit einem Tipp auf
„Später“ weg, 8 px neben dem Hauptknopf (R7-G1). „Für neuen Einsatz
vorbereiten“ setzt Einsatzdaten ohne Rückfrage und ohne „Rückgängig“ zurück
(R7-G2). Der Lagemonitor hat auf dem Telefon Bedienelemente von 11 bis 19 px
Höhe (R7-G3). Es gibt keinen P0 und keinen P1. Alle Aufgaben (Personal
durchblättern, sortieren, entfernen, Einheit abrücken, Namen einfügen, Bogen
übergeben, Einsatz öffnen, Abgleich) sind ohne fremde Hilfe zu schaffen.

## Befunde

### R7-G1 [P2] Papier-Abgleich: „Später“ verwirft alle Eingaben ohne Rückfrage, 8 px neben „Abgleich übernehmen“; das Formular ist 3 114 px lang (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen und beobachtet (360 × 640, Sammlung mit sechs
Einheiten, alle „vom Papier“).

**Fundstelle / Aufgabe:** Einsatzansicht → „Lage vom Papier abgleichen…“,
Abschnitt „Lage vom Papier abgleichen (6)“, Fußknöpfe „Abgleich übernehmen“ und
„Später“. Code: `src/app/papier-abgleich-ui.tsx` (`setZeilen(null)` im
Knopf „Später“).

**Beobachtung:** Der Abschnitt hat 36 Eingabefelder (je Einheit Nr., Eingetroffen
am, Status, Zug, Notiz) und ist 3 114 px hoch, rund 520 px je Einheit. Am Ende
stehen „Abgleich übernehmen“ (172 × 44 px, x 33) und „Später“ (74 × 44 px,
x 213), Lücke 8 px. In Nr. laut Blatt der ersten Einheit „77“ eingetragen, „Später“
getippt: Der Abschnitt schließt sofort, keine Rückfrage, keine Quittung mit
„Rückgängig“. Nach erneutem Öffnen steht das Feld leer.

**Erwartung der Rolle:** Wer nach einem Geräteausfall zehn Minuten Zahlen vom
Papier abtippt, verliert sie nicht mit einem Fehltipp neben dem Hauptknopf.

**Auswirkung im Einsatz:** Der Abgleich ist der Rückweg nach dem Papierbetrieb,
also in der Stresslage. Ein Handschuhfinger, der „Abgleich übernehmen“ am linken
Rand sucht und „Später“ trifft, vernichtet die Eingaben aller Einheiten. Die
Zeiten stehen nur auf dem Papier; sie müssen neu getippt werden. Kein Verlust
gespeicherter Daten, aber Verlust von Arbeit.

**Empfehlung:** „Später“ nicht gleichrangig neben die Hauptaktion legen
(eigene Zeile mit Abstand), bei eingetragenen Werten zurückfragen oder die
Eingaben im Sitzungsspeicher halten, bis sie bewusst verworfen werden.
Zusätzlich die Einheiten einzeln einklappbar oder abschnittsweise übernehmbar
machen.

**Nachprüfung:** Wert eintragen, „Später“ tippen: Rückfrage oder wiederherstellbarer
Stand; Abstand „Später“ zu „Abgleich übernehmen“ mindestens 12 px.

### R7-G2 [P2] „Für neuen Einsatz vorbereiten“ setzt Einsatzdaten mit einem Tipp zurück, ohne Rückfrage und ohne „Rückgängig“ (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (360 × 640, Bogen mit Einsatz 16.07.–23.07.2026).

**Fundstelle / Aufgabe:** Schritt 6 → „Bogen übergeben…“ → Fenster, Knopf „Für
neuen Einsatz vorbereiten“ (278 × 44 px) zwischen „QR-Code im Vollbild zeigen“
und „PDF erzeugen“. Code: `src/app/schritte/uebersicht.tsx` (um Zeile 1015).

**Beobachtung:** Ein Tipp schließt das Fenster, springt zu Schritt 2 und meldet
„Einsatzdaten für den neuen Einsatz zurückgesetzt – Ort/Auftrag eintragen.“
Zeitraum steht auf heute, Ort/Auftrag und Sofortbedarf sind leer. Weder eine
Rückfrage noch ein „Rückgängig“ ist im Baum (`Rückgängig` nirgends vorhanden),
die Fußleiste zeigt nur „←“, „◐“, „Weiter →“. Der Knopf steht in derselben
Liste wie QR-Code und PDF, mit gleicher Größe und derselben Form; nur die
Erklärzeile darunter nennt die Folge.

**Erwartung der Rolle:** Eine Handlung, die eingetippten Ort/Auftrag und
Sofortbedarf löscht, fragt zurück oder lässt sich zurücknehmen, wie „Person
entfernen“.

**Auswirkung im Einsatz:** Wer das Fenster zum Weitergeben öffnet und bei
Müdigkeit oder Handschuh den mittleren Knopf trifft, hat Auftrag und Bedarf
verloren, bevor der QR-Code gezeigt wurde. Die Daten lassen sich nur neu
eintippen.

**Empfehlung:** Rückfrage mit Nennung der gelöschten Felder oder „Rückgängig“ in
der Daumen-Quittung; den Knopf optisch von den Weitergabewegen trennen.

**Nachprüfung:** Knopf tippen: Rückfrage mit „Abbrechen“ oder „Rückgängig“ stellt
Ort/Auftrag und Sofortbedarf wieder her.

### R7-G3 [P2] Lagemonitor auf dem Telefon: Aufklapper 11 bis 12 px hoch, „Gedimmt“, „Vollbild“, „Schließen“ nur 19 px hoch (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (360 × 640, Adresse `/?lagemonitor=<id>` über
„Lagemonitor öffnen“, öffnet in zweitem Tab); Nutzung mit Handschuh am Telefon
ist Risiko, da der Monitor auf einen großen Bildschirm zielt.

**Fundstelle / Aufgabe:** Einsatzansicht → „Lagemonitor öffnen“ (156 × 44 px) →
Fenster mit Zusammenfassungen „Einheiten“, „Einsatzdaten“, „Optionen“ und Knöpfen.

**Beobachtung:** Auf 360 × 640: „Einheiten“ 336 × 11 px, „Einsatzdaten“ 336 × 12 px,
„Optionen“ 336 × 12 px, „Gedimmt“ 52 × 19 px, „Vollbild“ 45 × 19 px,
„Schließen“ 55 × 19 px, ohne Lücke zwischen den Zusammenfassungen. Auf dem Tablet
(820 × 1180) sind die Knöpfe 43 px hoch, die Zusammenfassungen 26 bis 27 px.
Die Uhr und die Stärke sind dagegen sehr groß.

**Erwartung der Rolle:** Auch eine Anzeigeseite, die am Telefon geöffnet wird,
lässt sich mit Handschuh schließen und umschalten.

**Auswirkung im Einsatz:** Wer den Monitor auf dem Telefon aufruft (der Knopf
steht am Telefon genauso wie am Tablet), trifft „Schließen“ nur mit mehreren
Versuchen und öffnet dabei leicht „Optionen“ oder „Einsatzdaten“. Der Rückweg
ist sonst nur die Zurück-Geste des Browsers.

**Empfehlung:** Bedienelemente des Monitors mindestens 44 px hoch, mit Abstand;
„Schließen“ groß und an fester Stelle.

**Nachprüfung:** 360 × 640 und 320 × 568: alle Ziele des Monitors mindestens
44 px hoch, 8 px Lücke.

### R7-G4 [P3] Ecke „◐“ im Querformat liegt über Knöpfen beim Rollen; „Auftrag/Notiz“ ist angeschnitten (Nebenwirkung der Behebung von R6-G7)

**Priorität:** P3

**Kennzeichnung:** gemessen (640 × 360, Einsatzansicht, Sammlung mit sechs
Einheiten, Rollen in 100-px-Schritten) und beobachtet (Screenshot).

**Fundstelle / Aufgabe:** Einsatzansicht quer, feste Ecke „◐“ (47 × 44 px bei
x 582, y 312, rechts unten).

**Beobachtung:** Der Balken ist quer jetzt eine Ecke (52 px hoch, 62 px breit,
`position: fixed`). Beim Rollen läuft sie über Ziele des Inhalts: „Auftrag/Notiz“
(14 × 26 px überdeckt, der Schriftzug ist am rechten Rand abgeschnitten),
„Tabelle“ (26 × 14), „Lagemonitor öffnen“ (22 × 14), „Einsatz löschen…“
(26 × 10), Fußverweise (8 bis 31 px). Die Ecke liegt oben, ein Tipp in die
Überlappung öffnet die Ansichtswahl.

**Erwartung der Rolle:** Die feste Ecke deckt keine Bedienknöpfe ab.

**Auswirkung im Einsatz:** Ein Tipp auf den rechten Rand von „Auftrag/Notiz“
oder „Einsatz löschen…“ öffnet stattdessen die Ansichtswahl. Folgenlos, aber
ein Fehlversuch mehr. Kein Datenverlust.

**Empfehlung:** Rechten Rand der Knopfreihen und des Inhalts so freihalten, dass
die Ecke nichts verdeckt (Innenabstand rechts), oder die Ecke in den Kopf legen.

**Nachprüfung:** 640 × 360, Rollen über die ganze Seite: kein Ziel wird von der
Ecke um mehr als 0 px überdeckt.

### R7-G5 [P3] Browser-Zoom 200 % im Feld-Modus: Seite 8 bis 28 px breiter als das Bild (Rest von R6-G3, neu in Schritt 1/2)

**Priorität:** P3

**Kennzeichnung:** gemessen in der Nachstellung.

**Fundstelle / Aufgabe:** Assistent Schritt 1 und 2 (Feld, 180 × 320 und
160 × 284) sowie Einsatzansicht (Feld, 160 × 284).

**Beobachtung:** `innerWidth` 188 statt 180 (bzw. 188 statt 160) in Schritt 1
und 2, die feste Fußleiste ist 188 px breit. Ursache: der Hinweisknopf
„Einsatzzeitraum … ist vorbei — gilt dieser Bogen noch für den aktuellen
Einsatz?“ (Knopf als Text, 120 px breit ab x 74, rechts 194). In der
Einsatzansicht (160 × 284, Feld) 179 px, mehrere Elemente rechts bei 173 bis
175 px. Standard-Modus und 320 × 568 mit 200 % Schrift laufen nicht über
(`scrollWidth` gleich Bild); Schritte 3 bis 6 ebenfalls nicht.

**Erwartung der Rolle:** Auch im Feld-Modus bei Zoom bleibt die Seite in der
Bildbreite.

**Auswirkung im Einsatz:** Risiko: Der Browser kann die Seite verkleinern, dann
sind die 44-px-Ziele kleiner. Betrifft nur Zoom 200 % im Feld-Modus, und im
Assistenten nur bei vorbeigegangenem Einsatzzeitraum.

**Empfehlung:** Den Hinweisknopf umbrechen lassen; die Prüfung „`scrollWidth`
gleich Bildbreite“ auf Feld und Zoom ausdehnen.

**Nachprüfung:** Schritt 1 und 2, Feld, 180 × 320 und 160 × 284: `scrollWidth` gleich
Bildbreite.

### R7-G6 [P3] Zwei-Fenster-Leiste nimmt 34 bis 50 % der Bildhöhe, die beiden Entscheidungsknöpfe stehen gleichrangig nebeneinander

**Priorität:** P3

**Kennzeichnung:** gemessen (Leiste aus zwei Tabs im selben Kontext erzeugt).

**Fundstelle / Aufgabe:** Assistent, feste Warnleiste „Dieser Bogen wurde in
einem anderen Fenster geändert …“ mit „Stand aus dem anderen Fenster laden“,
„Meine Fassung behalten“, „Weniger“.

**Beobachtung:** 360 × 640: Leiste 216 px (34 %), Knöpfe 164 × 73 px, „Weniger“
84 × 44 px. 320 × 568, Feld: 284 px (50 %), Knöpfe 293 × 63 und 293 × 54 px.
320 × 568 mit 200 % Schrift: 284 px (50 %), Knöpfe 272 × 144 und 272 × 102 px
(der Deckel hält die Leiste bei 50 %, das Feld darunter bleibt sichtbar). Quer
(640 × 360): 53 px hoch mit dem Knopf „Entscheiden“ (das ist gelöst). Die zwei
Wahlen haben gleiches Gewicht; die Folge („Eingaben hier werden erst wieder
gespeichert, wenn du entscheidest“) steht im Fließtext. Der Zweitfenster-Fall
selbst ist am Telefon selten (Risiko).

**Erwartung der Rolle:** Die Leiste lässt Platz für das Formular und macht die
sicherere Wahl erkennbar.

**Auswirkung im Einsatz:** Bei kleinen Geräten bleibt die Hälfte des Bildes für
Feld und Fußleiste. Die Verwechslung der zwei Knöpfe kostet im schlechtesten Fall
die eben eingetippte Fassung.

**Empfehlung:** Hochformat wie quer: erst eine Zeile, Entscheidung in eigenem Fenster
mit Folgezeile je Knopf.

**Nachprüfung:** 320 × 568 mit 200 %: Leiste höchstens ein Viertel der Höhe.

### R7-G7 [P3] Musterung: „Alle abwählen“ springt weiterhin um 33 px; ein Tipp an der alten Stelle nach der Sperre hakt eine Person an (Rest von R6-G4)

**Priorität:** P3

**Kennzeichnung:** gemessen (360 × 640, Vorlage mit 38 Personen).

**Fundstelle / Aufgabe:** Startseite → „Einsatz vorbereiten: Mein OV“ →
Kopfzeile „Personal (n/38)“ mit „Alle abwählen“.

**Beobachtung:** Der Knopf steht vor dem Tipp bei (206, 382) und heißt danach „Alle
anhaken“ bei (214, 349): 33 px höher. Zweiter Tipp an der alten Stelle nach
300 ms: bleibt „0/38“ (die Sperre hält). Nach 2 s an der alten Stelle:
„Personal (1/38)“, die Führungskraft ist angehakt.

**Erwartung der Rolle:** Der Knopf bleibt an seinem Platz.

**Auswirkung im Einsatz:** Wer langsam nachtippt, hakt eine Person an, die er
abgewählt wollte. Anzeige „1/38“ zeigt es; mit einem Tipp rückholbar.

**Empfehlung:** Die Kopfzeile nach dem Umschalten nicht in der Höhe ändern.

**Nachprüfung:** „Alle abwählen“, nach 2 s an dieselbe Stelle: „0/38“, Knopf
unverändert.

### R7-G8 [P3] Geräteuhr-Rückfrage steht im Seitenfluss; die zwei Knöpfe liegen unter dem Bildrand

**Priorität:** P3

**Kennzeichnung:** gemessen (Startseite, `eeb.uhr.v1` 365 Tage alt, Sammlung 200
Tage alt).

**Fundstelle / Aufgabe:** Startseite, Block „⚠ Geräteuhr prüfen“ mit „Geräteuhr
stimmt“ und „Uhr korrigieren“.

**Beobachtung:** Der Block ist nicht modal (`position: static`) und liegt bei
360 × 640 von y 352 bis 743; die Knöpfe (143 × 44 und 126 × 44 px, 8 px Lücke)
stehen bei y 690, also unter dem Bildrand. Bei 320 × 568 mit 200 % Schrift und
Feld ist der Block 1 999 px hoch, die Knöpfe stehen bei y 2 617 und 2 759.
Quer (640 × 360): Knöpfe bei y 517. „Geräteuhr stimmt“ führt in eine zweite
Rückfrage („Datum stimmt — jetzt endgültig löschen?“, „nicht im Papierkorb“); das
hält.

**Erwartung der Rolle:** Eine Rückfrage, die eine Antwort verlangt, steht im Bild.

**Auswirkung im Einsatz:** Wer den Hinweis nicht wegrollt, sieht die Wahl nicht.
Das Löschen ist durch die zweite Rückfrage gesichert.

**Empfehlung:** Knöpfe zuerst zeigen oder die Rückfrage als Fenster führen.

**Nachprüfung:** 360 × 640: beide Knöpfe ohne Rollen im ersten Bild.

### R7-G9 [P3] Einsatzansicht: Das Wort „Bedarf:“ der Bedarfszeile bricht mitten im Wort („Bed … arf:“)

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640, Standard, Screenshot).

**Fundstelle / Aufgabe:** Aufklapper „Bedarf: Verpflegung 59 · Unterbringung 7 · …“
über der Liste der Einheiten (294 × 48 px).

**Beobachtung:** Das fette Label steht in zwei Teilen: „Bed“ in der ersten Zeile
vor „Verpflegung 59 …“, „arf:“ am Anfang der zweiten Zeile. Die Zeile ist als
Ganzes Ziel (kein Bedienproblem), liest sich aber verstümmelt. Dasselbe Bild
erscheint unter dem Papier-Abgleich. Dem Verweis nach gehört die Darstellung in
den Bericht Mobile UI.

**Erwartung der Rolle:** Beschriftung und Wert getrennt lesbar.

**Auswirkung im Einsatz:** Keine Fehlbedienung; kostet Aufmerksamkeit beim Lesen
des Bedarfs.

**Empfehlung:** Beschriftung nicht umbrechen lassen oder in eigene Zeile.

**Nachprüfung:** 360 × 640 und 320 × 568: „Bedarf:“ steht vollständig in einer Zeile.

## Verweise auf andere Berichte

Unabhängig beobachtet, dort zuerst zu beschreiben, hier nicht gezählt:

- Schrittleiste ohne Lücke (72/53/53/53/53/44 px bei 360 px, 0 px Lücke, im
  Feld-Modus nur 49 px hoch): unverändert zu R6-G6.
- Übersichtstabellen rollen bei 320 px seitlich (286 von 456 px, bei 360 px
  326 von 456 px): unverändert zu R6-G9.
- Bei 320 × 568 mit 200 % Schrift und Feld ist der Tab „1 offen“ der Schrittleiste
  abgeschnitten und das Logo liegt unter „‹ Startseite“ (Kopfzeile wirkt
  verschoben): Darstellung, Bericht Mobile UI.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Fußleiste des Assistenten:** keine Überlappung in 360, 320, 640 px, Standard
  und Feld, 100 % und 200 %; „←“, „◐“, „Weiter →“ liegen frei. Beim Fokus im
  Eingabefeld (niedriger Viewport 360 × 300) blendet sich die Leiste aus; das
  Feld bleibt sichtbar, Enter springt in das nächste Namensfeld.
- **Kurz-Liste:** „▲ ▼ ⇑“ je 44 × 44 px (x 33, 89, 145), „✕“ bei x 283 mit
  sichtbarem roten Rahmen; „▼“ hält die Person unter dem Finger (Rollen +198 px
  je Tipp). „Person entfernen“ als Rückfrage mit „Person entfernen“ und
  „Abbrechen“ (278 × 44 px, 34 px getrennt) und Hinweis auf „Rückgängig“.
- **Zurück-Verlauf:** Zurück schließt zuerst das Fenster (Übergeben, Neue
  Sammlung, Datensicherung), dann geht es Schritt für Schritt, zuletzt zur
  Startseite; der Entwurf bleibt gespeichert.
- **Rückfragen:** „Verwerfen“ (Bogen bleibt über „zuletzt geschlossenen Bogen“
  erreichbar), „Einsatz löschen…“ (Papierkorb, 30 Tage), „Alle Daten löschen“
  (Haken „Ja, alle lokalen Daten dieser App endgültig löschen“ schaltet
  „Endgültig löschen“ frei, 12 px über „Abbrechen“).
- **Einheitenkarte:** Knopfreihe 44 px hoch, 8 px Lücke; „Abrücken“ mit
  Quittung (336 × 65 px), Ortssperre mit „Einen Moment …“ greift.
- **Nachtipp-Schutz:** zweiter Tipp an derselben Stelle innerhalb 1,5 s wird
  verworfen, mit gestricheltem Rahmen und Pille.
- **Namen einfügen:** Fenster mit Textfeld 278 × 208 px, „3 Personen übernehmen“
  188 × 44 px, „Schließen“ 96 × 44 px, keine Pflichtgeste.
- **Tablet 820 × 1180:** keine Ziele unter 44 px in den Schritten 3 und 4,
  Fußleiste 70 px, „Weiter →“ am rechten Rand.
- **Keine Pflichtgesten** in den geprüften Abläufen außer Wischen zum Lesen
  breiter Tabellen.

## Abschluss

- **Aufgabe geschafft:** ja. Mit Umweg beim Papier-Abgleich (36 Felder, kein
  Schutz vor „Später“, R7-G1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Später“ im Papier-Abgleich sieht wie ein
  harmloses Zurückstellen aus und verwirft alle Eingaben.
- **Größtes Einsatzrisiko:** Zwei Handlungen, die Eingaben ohne Rückfrage und ohne
  „Rückgängig“ entfernen, liegen in Wiederanlauf und Weitergabe (R7-G1, R7-G2).
- **Top-Priorität für die nächste Iteration:** „Später“ im Papier-Abgleich und
  „Für neuen Einsatz vorbereiten“ mit Rückfrage oder „Rückgängig“ absichern.

## Abgleich mit Runde 6

Grundlage: [../runde-6/handschuh-bedienung.md](../runde-6/handschuh-bedienung.md)
mit „Stand der Behebung“.

| Runde-6-Befund | Stand laut Tabelle | Bewertung Runde 7 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R6-G1 Fußleiste überdeckt „◐ Ansicht“ (P2) | behoben | **hält** | 0 px Überlappung in 320/360/640, Standard/Feld, 100 %/200 %, Schritte 1, 3, 5; „◐“ als Symbol (43 bis 60 px breit), „Übersicht →“ 132 bis 142 px. |
| R6-G2 Browser-Zoom 200 %: Leiste füllt die Hälfte (P2) | teilweise | **hält nur teilweise** | 180 × 320: 128 px (40 %), Feld 146 px (46 %); 160 × 284: 128 px (45 %); quer 320 × 180: 56 px (31 %). Alle Knöpfe im Bild, aber weit über einem Viertel; Feld-Zoom zusätzlich 8 px zu breit (R7-G5). |
| R6-G3 Einsatzansicht bei 200 % seitlich breiter (P2) | behoben | **hält, mit Rest** | `scrollWidth` gleich Bild bei 360/320/640 und 200 % Schrift und Zoom 180 × 320 und 320 × 180; nicht bei Feld-Zoom 160 × 284 (179 px, R7-G5). |
| R6-G4 „Alle abwählen“ springt 33 px (P2) | behoben | **hält nur teilweise** | Sperre hält (300 ms: „0/38“); Sprung weiter 33 px (382 → 349), Tipp nach 2 s hakt eine Person an (R7-G7). |
| R6-G5 Kurz-Liste: Person verlässt den Finger (P3) | teilweise | **hält** | Im Browser belegt: Rollen +198 px je Tipp, unter dem Finger liegt „Person n nach unten“ der verschobenen Person; Peters nach drei Tipps an Platz 7. |
| R6-G6 Schrittleiste ohne Lücke (P3) | offen | **offen** | 72/53/53/53/53/44 px, 0 px Lücke (Hochformat); Feld 49 px hoch. |
| R6-G7 Balken und Quittung ein Fünftel (P3) | teilweise | **hält nur teilweise** | Hoch: Quittung 506–571 + Balken 583–640 = 134 px (21 %). Quer ist der Balken eine Ecke, sie überdeckt aber Knöpfe (R7-G4). |
| R6-G8 „✕“ ohne sichtbares Ziel (P3) | behoben | **hält** | roter Rahmen 44 × 44 px sichtbar im Screenshot. |
| R6-G9 Übersichtstabellen rollen seitlich (P3) | offen | **offen** | 286 von 456 px bei 320 px, 326 von 456 px bei 360 px (`tabellen-scroll`). |
| Fußleiste: Zeilen und rechter Rand (Bestätigtes Runde 6) | – | **hält** | „Weiter →“ endet bei Breite − 18 px. |
| Rückfragen (Bestätigtes Runde 6) | – | **hält** | Entfernen, Verwerfen, Einsatz löschen, Alle Daten löschen, Geräteuhr: getrennte Knöpfe, zweite Rückfrage bei Geräteuhr. |
| Neu in Runde 6 geändert: Zurück-Verlauf, Zwei-Fenster-Leiste quer, Lagemonitor, Papier-Abgleich, Geräteuhr | – | **geprüft** | Verlauf hält; Zwei-Fenster-Leiste quer kompakt, hoch 34 bis 50 % (R7-G6); Lagemonitor-Ziele klein (R7-G3); Papier-Abgleich ohne Schutz (R7-G1); Geräteuhr unter dem Bildrand (R7-G8). |

## Zusammenfassung

Befunde: **P0 0 · P1 0 · P2 3 · P3 6**. Neu: R7-G1 bis R7-G3 (P2), R7-G4 bis R7-G9 (P3). Von den Runde-6-Befunden halten G1, G3, G5 und G8, teilweise G2, G4, G7; offen bleiben G6 und G9.
