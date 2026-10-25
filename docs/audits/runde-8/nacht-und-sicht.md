# Audit „Nacht und Sicht", Runde 8 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App einschließlich Lagemonitor, Produktionsbuild
(`vite preview`, Port 4173), Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde. Ich habe zuerst blind geprüft (Startseite, Assistent,
Einsatzansicht, Lagemonitor in allen Stufen, Übergabe, Zwei-Fenster-Leiste,
Musterung, Dialoge) und den Bericht [Runde 7](../runde-7/nacht-und-sicht.md)
samt „Stand der Behebung" erst danach gelesen. Berichte anderer Rollen aus
Runde 8 habe ich erst nach dem Messen auf Überschneidungen durchgesehen; was
dort steht, ist als Verweis genannt.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), Locale de-DE, je Lauf ein eigener Browser-Kontext, weil elf
weitere Prüfer denselben Server nutzen. Telefon 360 × 640 bei Pixelverhältnis 2
mit `isMobile`/`hasTouch` als Grundeinstellung, dazu 320 × 568, 640 × 360 quer,
Tablet 820 × 1180; der Lagemonitor zusätzlich auf 1920 × 1080, 1366 × 768 und
1280 × 720 (ohne Touch). Browser-Zoom 150 % und 200 % nachgestellt (Fenster
durch den Faktor geteilt, Pixelverhältnis mal Faktor) und `html { font-size:
200% }`. Geprüft in allen vier Modi (Standard, Feld, Dunkel, Nacht) und mit
Systemeinstellung „dunkel" ohne gespeicherte Wahl. Skripte und Bildschirmfotos
liegen im Scratchpad `runde8/l/`, nicht im Repository.

Zustände aus `localStorage`-Seeds, alle mit `uebung: false` und `stand` auf
heute (Datum 24.10.2026), Ausnahmen genannt:

- `eeb.entwurf.v1`: Großbogen „Verstärkter Bergungszug" (`examples/thw/`);
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt" mit sechs Meldungen
  aus `examples/thw/`; Varianten: um 3 Stunden gealterte Meldungen bei
  `art: 1` (Übung), 28 Meldungen, eine abgerückte Einheit;
- `eeb.vorlagen.v1`: eine Vorlage aus dem Großbogen (Musterung);
- `eeb.anzeigemodus.v1` (vier Werte) und `eeb.lagestufe.v1`;
- ein zweiter Tab im selben Kontext, der den Entwurf ändert (Warnleiste des
  Zwei-Fenster-Abgleichs).

Durchlaufen habe ich: Startseite in vier Modi, Assistent Schritt 1–5 in vier
Modi, Übersicht, „Vorschau anzeigen", „Bogen übergeben…" und QR-Vollbild,
Einsatzansicht (Kopf, Karten, aufgeklappte Karte, Tabellenansicht, „Details",
Block „Lagemonitor für den Fernseher", Ansicht-Wahl in der festen Leiste),
Lagemonitor (Dunkel, Gedimmt, Hell; mit und ohne Bewegungen; mit gealterten
Daten und Übung; 6 und 28 Einheiten; auf 1920 × 1080, 1366 × 768,
1280 × 720, am Tablet, am Telefon in vier Ausführungen), alle sieben Dialoge
der Einsatzansicht in Dunkel und Nacht, Zwei-Fenster-Warnleiste, Musterung in
vier Modi, Kaltstart mit verzögertem Bundle (Nacht, Systemeinstellung dunkel,
Lagemonitor in Standard, Nacht und Systemeinstellung dunkel). Die
Plattformklassen `platform-ios` und `platform-android` habe ich auf `<html>`
nachgestellt (nicht die native App).

Gemessen habe ich Kontraste (Schriftfarbe gegen die tatsächlich darunter
liegende Fläche, Deckkraft der Vorfahren eingerechnet, WCAG-Formel), das
mittlere Luma und den Anteil heller Bildpunkte je Bildschirmfoto,
Schriftgrößen, Lage und Größe von Elementen (`getBoundingClientRect`,
`scrollHeight`) und einzelne Bildpunkte (Kästchen). Bildschirmfotos habe ich
angesehen, nicht nur gerechnet. Zusätzlich ein Graustufenfilter auf der
Einsatzansicht, um zu prüfen, ob Zustände ohne Farbe lesbar bleiben.

**Nicht prüfbar:** echtes Licht (Sonne, Arbeitsscheinwerfer, Rotlicht),
tatsächliche Displayhelligkeit, ein Fernseher im Fahrzeug (Abstand, Spiegelung,
Overscan), OLED-Schwarz, WebKit/Safari, die native Android-/iOS-Fassung,
Kamera-Scanner im Dunkeln (die Aufnahme öffnete sich mit der Prüf-Kamera nicht,
daher ungeprüft), Ausdruck und PDF-Betrachter (die Vorschau blieb im
Prüfbrowser leer), die Auswahlliste und der Datumsdialog des Betriebssystems,
`window.open` und „Vollbild" auf einem zweiten Bildschirm (der Monitor wurde
über `?lagemonitor=<Kennung>` direkt aufgerufen). Die Datumsfelder zeigen im
Prüfbrowser „mm/dd/yyyy" trotz de-DE; das ist eine Eigenart des Browsers und
kein Befund. Zeitmessungen liefen unter Last durch elf parallele Prüfer.

Nicht nachgestellt und im Stand unverändert angenommen: die bekannten Grenzen
R6-O9, R7-G4/M8, R7-G8/H9, R7-N1 und R7-N9.

## Urteil

Die Behebungen aus Runde 7 halten bis auf einen Rest. Die App selbst ist
nachts und in der Sonne in sehr gutem Zustand: Luma-Mittel Nacht 33 bis 38,
Dunkel 40 bis 43, Feld 182 bis 187, Standard 202 bis 207; im Nacht-Modus ist
das hellste Pixel 206, der Kaltstart beginnt dunkel (Luma 25 in Nacht, 31 mit
Systemeinstellung „dunkel", 0 im Lagemonitor vor dem Aufbau). Kein aktiver
Text liegt in Nacht unter 4,71:1, in Dunkel unter 7,0:1, in Feld unter 6,8:1,
in Standard unter 4,96:1; das gilt für Start, Schritt 1 bis 5, Übergabe,
Einsatzansicht (Karten, Tabelle, Details) und alle Dialoge. Zustände tragen
Wort oder Zeichen (zugeklappt/aufgeklappt, „neu", „● Ruhezeit", „⚠ Anderer
Einsatz?", „1 offen" im Rahmen); im Graustufenbild bleiben sie unterscheidbar.
Der Lagemonitor startet bei Nacht-Modus gedimmt, merkt die Stufe, nennt sie in
der Taste und hat auf dem Telefon Schrift ab 14 px und Tasten ab 44 px.

Reibung gibt es an zwei Stellen. Erstens zeigt der Lagemonitor auf dem
Fernseher bei sechs Einheiten nur drei, obwohl der Platz für alle sechs
reicht (R8-L1): die Behebung von R7-L1 hält also nur zur Hälfte. Zweitens sind
in der Musterung vorbelegt abgewählte Zeilen samt dem Hinweis, was der Helfer
tun soll, mit 1,96 bis 2,69:1 kaum lesbar (R8-L2). Dazu kommen fünf Kleinigkeiten
(P3), darunter eine Stufentaste, die aus dem dunkelsten Bild auf Vollweiß führt.

Die Aufgabe gelingt bei Nacht und in der Sonne ohne fremde Hilfe: Bogen
erfassen, übergeben, am Meldekopf sammeln, Lage zeigen. Auf dem Fernseher
fehlt ohne Bedienung die Hälfte der Liste.

## Befunde

Keine P0- und keine P1-Befunde. Zwei P2-Befunde, fünf P3-Befunde.

### R8-L1 [P2] Lagemonitor am Fernseher: bei sechs Einheiten stehen drei im Bild, der Platz für alle sechs ist frei (Rest von R7-L1)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Lagemonitor, Abschnitt „Einheiten", Zeile „+ n weitere
Einheiten". Code: `src/app/lagemonitor-ui.tsx` (`EinheitenTabelle`,
Messung in `useLayoutEffect`).

**Beobachtung:** Sammlung „Hochwasser Musterstadt" mit sechs Einheiten, drei
Bewegungszeilen, Fenster 1920 × 1080: die Tabelle zeigt drei Zeilen (Hamburg
Mitte, Bamberg, Ulm) und darunter „+ 3 weitere Einheiten". Der Behälter ist
340 px hoch (Oberkante 679 px, Unterkante 1 019 px), die drei Zeilen und die
Kopfzeile enden bei 852 px; rund 165 px bleiben leer, das sind etwa drei
Zeilen. Auf 1366 × 768 und 1280 × 720 ebenfalls drei Zeilen mit „+ 3 weitere";
leer bleiben dort 93 px und 82 px. Auch nach 12 Sekunden unverändert (die
Anzeige läuft alle 5 Sekunden neu). Mit 28 Einheiten stehen bei 1920 × 1080
vier Zeilen und „+ 24 weitere Einheiten" da.

Ursache nach Messung: Werden alle sechs Zeilen eingeblendet, bricht die Zeile
„Oberhausen-Rheinhausen" um und ist 80 px statt 43 px hoch; die Zeilenunterkanten
liegen dann bei 123, 166, 209, 289, 332 und 375 px bei einem Behälter von
340 px. Die Messung schließt daraus, dass nur drei Zeilen passen, und blendet
den Rest aus; mit den ausgeblendeten Zeilen sind die Spalten breiter, der
Umbruch entfällt, und der Platz bleibt leer. Alle sechs Zeilen würden
(Kopf 42 + 6 × 43 px = 300 px) in 340 px passen.

**Erwartung der Rolle:** Das Großbild zeigt bei sechs Einheiten alle sechs; die
Zeile „+ n weitere" erscheint nur, wenn der Platz wirklich fehlt.

**Folge:** Nachts im Fahrzeug bedient niemand den Fernseher. Wer „3 von 6"
liest, hält die Lage für unvollständig oder übersieht „+ 3 weitere" ganz; die
Hälfte der Einheiten fehlt im Bild, ohne dass es nötig wäre. Bei großen Lagen
verschärft sich das, weil die Zahl der angezeigten Zeilen von zufälligen
Zeilenumbrüchen abhängt.

**Empfehlung:** Die Zeilenzahl auf den tatsächlich verfügbaren Platz im
endgültigen Zustand auslegen, nicht auf die Höhe der Zeilen im vollen
Zustand; oder Umbrüche in der Tabelle ausschließen, sodass beide Zustände
gleich hoch sind.

**Nachprüfung:** 1920 × 1080, 1366 × 768 und 1280 × 720 mit der Sechser-
Sammlung und drei Bewegungen: alle sechs Zeilen im Bild, keine Zeile
„+ n weitere"; bei zwölf und mehr Einheiten höchstens eine Zeilenhöhe Leerraum
unter der letzten Zeile. Verweis: [fuehrungssicht.md](fuehrungssicht.md) R8-K5
beschreibt den leeren Streifen unter „+ n weitere" bei 30 Einheiten; hier kommt
dazu, dass schon bei sechs Einheiten die Hälfte fehlt.

### R8-L2 [P2] Musterung: abgewählte Zeilen und ihr Hinweistext mit 1,96 bis 2,69:1

**Priorität:** P2

**Kennzeichnung:** gemessen (Kontrast, Deckkraft), beobachtet (Bildschirmfoto);
Wirkung im Einsatz Risiko.

**Fundstelle / Aufgabe:** Startseite → „Einsatz vorbereiten" (Musterung einer
Vorlage), Abschnitte „Personal", „Sofortbedarf aus der Vorlage" und „Bemerkung
aus der Vorlage". Code: Stil `.muster-zeile.gestrichen` (Deckkraft 0,45) und
`.muster-sub` in `index.html`.

**Beobachtung:** Abgewählte Zeilen sind durchgestrichen und auf 45 % Deckkraft
gesetzt; das gilt auch für den kleinen Hinweis darunter. Der Sofortbedarf der
Vorlage ist beim Öffnen nicht angehakt (er „stammt aus einem früheren
Einsatz"), steht also von Anfang an im abgeblendeten Zustand: Zeilentext
„Ruhezeit · Unterbringung angefordert · Diesel 620 l · Benzin 40 l · Gemisch
20 l" mit 3,29:1 (16 px), der Hinweis „Stammt aus einem früheren Einsatz — nur
anhaken, wenn er auch jetzt gilt." (14 px) mit:

| Modus | Hinweis (14 px) | Zeilentext (16 px) |
| --- | --- | --- |
| Standard | 1,96:1 | 2,99:1 |
| Feld (Sonne) | 2,63:1 | 3,35:1 |
| Dunkel | 2,69:1 | 3,92:1 |
| Nacht | 2,26:1 | 3,29:1 |

Dasselbe gilt für die „Bemerkung aus der Vorlage" und für jede abgewählte
Person. Die Zeilen sind nicht deaktiviert (anhakbar), und der Zustand wird auch
durch Durchstreichen und leeres Kästchen gezeigt, nicht nur durch Farbe.

**Erwartung der Rolle:** Was ich noch entscheiden muss, ist lesbar; abgewählt
heißt „kommt nicht mit", nicht „nicht mehr zu erkennen". Der Hinweis, der
erklärt, wann man anhakt, darf nicht der blasseste Text der Seite sein.

**Folge:** Bei Nacht und bei Sonne liest man Menge und Hinweis nicht; wer den
Sofortbedarf (Kraftstoffmengen!) übernehmen oder bewusst weglassen will, muss
die Zeile erst anhaken, um sie zu lesen. Durchgestrichener Text mit 2:1 ist
praktisch nicht zu entziffern; der Fehler (alte Mengen unbemerkt übernommen oder
verworfen) ist nicht auszuschließen.

**Empfehlung:** Abgewählt über Durchstreichung und Kästchen zeigen, den Text
selbst aber nicht unter 4,5:1 abblenden; den Hinweis „Stammt aus einem früheren
Einsatz …" nie abblenden.

**Nachprüfung:** Musterung in allen vier Modi: Zeilentext und Hinweis
abgewählter Zeilen ≥ 4,5:1; Hinweistext des Sofortbedarfs in der
Ausgangsstellung ≥ 4,5:1.

### R8-L3 [P3] Lagemonitor, Stufe „Gedimmt": kleine Warntexte mit 4,05:1 auf dem Telefon

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Lagemonitor bei 360 × 640 und 320 × 568, Stufe
„Gedimmt" (seit R7-L3 die Vorgabe bei Nacht-Modus). Code:
`src/app/lagemonitor.css` (`--lm-zeit: #c04040`, `.lm-label.lm-veraltet`,
`.lm-uebung`).

**Beobachtung:** In „Gedimmt" liegen die Warnfarbe und die Uhr auf #c04040
gegen Schwarz, 4,05:1. Das genügt für die große Uhr (28,8 bis 43,2 px), aber
auch zwei Warntexte tragen die Farbe in Kleinschrift: „⚠ letzte Meldung vor
3 Std 0 Min" (14 px, fett) und „ÜBUNG – keine Echtlage" (15,8 px, fett), je
4,05:1. In Dunkel (5,25:1) und Hell (5,89:1) liegen beide über 4,5:1. Auf dem
Fernseher sind die Schriften groß genug (3:1 genügt dort).

**Erwartung der Rolle:** Die Warnung „Daten veraltet" ist auch bei kleinster
Schrift auf dem Telefon sicher lesbar.

**Folge:** Gering: Wort, Zeichen ⚠ und Fettdruck tragen die Aussage, die Zeile
ist gut zu finden. Bei geringer Displayhelligkeit bleibt es der blasseste Text
des Monitors.

**Empfehlung:** Für Kleinschrift eine hellere Warnfarbe in „Gedimmt" nehmen
oder die Warnzeile in der Textfarbe setzen und nur das Zeichen färben.

**Nachprüfung:** Monitor in „Gedimmt" mit gealterter Meldung und Übung auf dem
Telefon: beide Zeilen ≥ 4,5:1.

### R8-L4 [P3] Lagemonitor: aus „Gedimmt" führt die Taste in einem Tipp auf Vollweiß

**Priorität:** P3

**Kennzeichnung:** beobachtet (Reihenfolge), gemessen (Helligkeit).

**Fundstelle / Aufgabe:** Lagemonitor → Optionen → „Stufe: Gedimmt · weiter:
Hell". Code: `src/app/lagemonitor-ui.tsx` (`naechsteStufe`, Reihenfolge Dunkel →
Gedimmt → Hell → Dunkel).

**Beobachtung:** Mit App-Modus „Nacht" startet der Monitor in „Gedimmt"
(bestätigt). Ein weiterer Tipp auf die Stufentaste gibt „Hell": schwarze
Schrift auf Weiß, mittleres Luma 224 statt 18, 86 % der Bildfläche über 180.
Zurück zu „Gedimmt" führt der Weg über „Dunkel" (Luma 30, Vollweiß als Schrift
und #ff0000): ein Fehltipp kostet zwei weitere Tipps mit zwei hellen Bildern,
es gibt keine Taste „dunkler". Die Taste nennt die nächste Stufe, das warnt
vor dem Ergebnis; „Hell" wird nicht gemerkt (ein Neuladen stellt die gemerkte
dunkle Stufe wieder her), das ist dokumentiert und gewollt.

**Erwartung der Rolle:** Aus der dunkelsten Stufe führt kein Einzeltipp auf die
hellste; ein Zurück ohne Umweg über ein helles Bild.

**Folge:** Gering bis mittel für einen Monitor im abgedunkelten Fahrzeug: ein
Tipp nach hinten blendet die Besatzung; der Rückweg blendet zweimal.

**Empfehlung:** Die Folge Gedimmt → Dunkel → Hell oder eine zweite Taste
„dunkler" anbieten; oder „Hell" mit einer kurzen Rückfrage absichern.

**Nachprüfung:** Monitor in „Gedimmt": ein Tipp führt nicht auf Luma über 100;
von „Hell" gelangt man mit einem Tipp zurück in die zuvor gemerkte Stufe.

### R8-L5 [P3] Lagemonitor am Telefon: Schrift bleibt bei 200 % Systemschrift bei 14 px

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Lagemonitor bei 360 × 640 mit `html { font-size: 200% }`.
Code: `src/app/lagemonitor.css` (`font-size: max(14px, …)`, Größen aus `vh`/`vw`
und festen Pixeln).

**Beobachtung:** Bei Grundschrift 16 px und bei 32 px sind Tabellenzellen,
Beschriftungen („letzte Meldung …") und „Einsatzdaten"/„Optionen" gleich
14 px (berechnete Schrift). Browser-Zoom wirkt (150 % und 200 % ohne seitlichen
Überlauf, geprüft), die Einstellung „größere Schrift" nicht. Die App selbst
folgt der Schrifteinstellung. Die Stufe „großer Text" für Menschen mit
schwächerer Sehkraft wirkt also im Monitor nicht.

**Erwartung der Rolle:** Wer die Systemschrift vergrößert hat (nachts ohne
Brille), findet das auch im Monitor.

**Folge:** Gering; der Monitor ist für den Fernseher gedacht, die
Telefonansicht eine Notlösung (R7-L2).

**Empfehlung:** Auf dem Telefon die Mindestgröße in `rem` statt in Pixeln
setzen.

**Nachprüfung:** 360 × 640 mit 200 % Systemschrift: Tabelle und Datenstand
≥ 28 px.

### R8-L6 [P3] Plattformstile (nachgestellt): iOS-Nacht mit reinweißer Schrift, iOS-Dunkel mit 3,77 bis 3,86:1

**Priorität:** P3

**Kennzeichnung:** beobachtet in nachgestellter Plattformklasse (auf `<html>`
`platform-ios`/`platform-android` gesetzt); die native App nicht geprüft,
daher Risiko.

**Fundstelle / Aufgabe:** Startseite mit Entwurfskarte in Nacht und Dunkel
unter `platform-ios`. Code: `index.html` (`.nacht-modus.platform-ios`,
`.dunkel-modus.platform-ios`).

**Beobachtung:** Unter `platform-ios` und Nacht-Modus ist „Fortsetzen" in
reinem Weiß (255) auf gedämpftem Bernstein gesetzt; das hellste Pixel im Bild
ist 255, während es im Web-Nacht-Modus 206 ist (Kommentar im Stil: höchstens so
hell wie die Schrift). „Ansicht: Nacht ▾" misst 4,32:1 bei 13 px. Unter
`platform-ios` und Dunkel-Modus messen „Verwerfen" 3,86:1 (14 px) und
„Löschen…" 3,77:1 (13 px). `platform-android` liegt in Nacht bei 4,54:1 und in
Dunkel bei 5,9:1, ohne weißes Pixel.

**Erwartung der Rolle:** Die Plattformfassungen halten dieselbe Obergrenze der
Helligkeit und denselben Kontrast wie die Web-Fassung.

**Folge:** Gering: das weiße Wort auf der Hauptaktion ist nachts das hellste
Element der Startseite; die rosa Schaltflächen sind kleiner und blasser als in
der Web-Fassung.

**Empfehlung:** Die Plattformstile für Nacht und Dunkel gegen dieselben
Schwellen prüfen wie die Web-Fassung (≥ 4,5:1 für Text, höchstens Luma 206 in
Nacht).

**Nachprüfung:** Auf einem iOS-Gerät oder mit nachgestellter Klasse: Startseite
in Nacht und Dunkel, Kontrast ≥ 4,5:1 und kein Pixel über 206 in Nacht.

### R8-L7 [P3] Nacht-Modus: Haken im gewählten Kästchen nur 2,79:1 gegen die Füllung

**Priorität:** P3

**Kennzeichnung:** gemessen (Bildpunkte).

**Fundstelle / Aufgabe:** Assistent Schritt 2 („Einsatzbeginn eintragen") und
Musterung, Kontrollkästchen im Nacht-Modus. Code: `index.html`
(`filter: sepia(1) saturate(0.6) brightness(0.78)` auf Kästchen).

**Beobachtung:** Das gewählte Kästchen ist gefüllt (123/114/99), der Haken
hellgrau (199/199/191): 2,79:1. Das leere Kästchen ist dunkel gefüllt
(60/56/48) mit Rand, gegen den Grund 1,56:1 (der Rand trägt). In Dunkel stehen
dunkler Haken auf Lila (7,4:1) und in Standard/Feld weißer Haken auf Dunkelblau
(15,1:1). Gewählt und leer sind in Nacht an Füllung und Haken klar zu
unterscheiden (angesehen); die Zahl liegt nur knapp unter 3:1.

**Erwartung der Rolle:** Der Haken ist bei kleinster Helligkeit so deutlich wie
in den anderen Modi.

**Folge:** Gering; der Haken ist groß, und die Füllung unterscheidet die
Zustände zusätzlich.

**Empfehlung:** Den Haken im Nacht-Modus etwas heller oder die Füllung etwas
dunkler setzen (Ziel ≥ 3:1).

**Nachprüfung:** Kästchen in Nacht: Haken gegen Füllung ≥ 3:1, Zustände auch im
Graustufenbild unterscheidbar.

## Verweise auf andere Berichte

- Lagemonitor am Telefon hochkant: F/U/M-Spalten liegen außerhalb des Bildes,
  die Spalte „Einheitentyp" ist am Rand abgeschnitten, ohne Wischhinweis. Von
  mir ebenfalls gemessen (Tabelle 448 px in 336 px bei 360 px Breite, 448 in 298
  bei 320 px). Steht in [feldtauglichkeit.md](feldtauglichkeit.md) R8-H3 und
  [fuehrungssicht.md](fuehrungssicht.md) R8-K1; hier kein neuer Befund.
- Leerer Platz unter „+ n weitere Einheiten" bei 30 Einheiten:
  [fuehrungssicht.md](fuehrungssicht.md) R8-K5; die Erweiterung auf sechs
  Einheiten ist R8-L1.
- Ansichtswechsel Nacht → Standard geschieht mit einem Tipp ohne Rückfrage
  (Luma 33 → 212, Fokus danach auf `body`, Scrollstand 41 → 17 px, Eingabe
  bleibt erhalten): wie in Runde 7 beobachtet und mit der Reihenfolge der Wahl
  (helle Modi links, Nacht rechts) entschärft; kein neuer Befund.

## Bestätigtes

- **Kaltstart:** Nacht gespeichert, Bundle verzögert: Klasse `nacht-modus`,
  Grund rgb(13,12,8), Luma 25; Systemeinstellung „dunkel" ohne Wahl:
  `dunkel-modus`, Luma 31; Lagemonitor in Standard, Nacht und
  Systemeinstellung dunkel: Grund schwarz, Luma 0,0 vor dem Aufbau. Die
  Theme-Farbe der Fensterleiste folgt dem Modus (#221f16 Nacht, #12275e
  Dunkel).
- **Kontraste:** niedrigste aktive Werte Nacht 4,71:1, Dunkel 7,03:1, Feld
  6,86:1, Standard 4,96:1 über Start und Schritt 1 bis 5; Einsatzansicht
  (Karten, Tabelle, Details) Nacht 4,71:1, Standard 4,96:1; alle sieben
  Dialoge in Nacht ≥ 5,0:1, in Dunkel ≥ 8,17:1 (ohne den deaktivierten Knopf
  „Endgültig löschen" mit 2,14 bzw. 2,45:1). Nur deaktivierte Pfeile
  („←", Sortierpfeile) liegen bei 2,6 bis 3,4:1.
- **Helligkeit:** Luma-Mittel Nacht 33 bis 38 (höchstens 206), Dunkel 40 bis 43,
  Feld 182 bis 187, Standard 202 bis 207; Dialoge in Nacht 24 bis 38; QR-
  Vollbild Luma 97 mit weißer Ruhezone (nötig zum Scannen, bleibt).
- **Zustandsmarken der Einsatzansicht:** „neu", „● Ruhezeit", „● Unterbr.",
  „⚠ Anderer Einsatz?", „Zeitraum vorbei", „⚠ Bogen nennt: …" tragen Wort oder
  Zeichen; im Graustufenbild unterscheidbar. „Offen" im Schrittband steht
  jetzt im Rahmen (R7-L4 behoben).
- **Lagemonitor, Stufen und Farben:** Dunkel Zeit #ff0000 5,25:1, Gedimmt 4,05:1
  (große Schrift), Hell #cc0000 5,89:1; Linien Gedimmt und Hell gut sichtbar;
  Beschriftungen in Monitorfarbe. Stufen Dunkel → Gedimmt → Hell mit Luma
  30, 18, 224; die Taste nennt die aktuelle und die nächste Stufe; die gemerkte
  Stufe bleibt nach Neuladen; „Hell" wird nicht gemerkt.
- **Lagemonitor, Telefon (R7-L2):** Schrift mindestens 14 px (Tabelle,
  Beschriftungen, Einsatzdaten), Tasten und Aufklapper je 44 px hoch; kein
  seitlicher Überlauf bei 320 und 360 px, Zoom 150 % und 200 %.
- **Lagemonitor, Bewegungen und Daten:** höchstens drei Zeilen „Eingetroffen: …
  vor n Min" und „+ n weitere Bewegungen"; Datenstand „⚠ letzte Meldung vor
  3 Std 0 Min" und „seit erster Meldung: …"; „ÜBUNG – keine Echtlage" über
  dem Titel. Seitenhöhe gleich Bildhöhe bei 1920 × 1080, 1366 × 768,
  1280 × 720 und 820 × 1180.
- **Zwei-Fenster-Leiste:** feste Leiste oben mit „⚠ Hier wird nichts
  gespeichert. Das andere Fenster hat den Bogen geändert: Ort / Auftrag.",
  zwei gleich große Tasten („Anderen Stand laden", „Meine Fassung behalten")
  und „Genauer"; bei 360 × 640 etwa 103 px hoch (rund 16 %), Nacht-Modus ohne
  weißen Blitz. (Fläche und Kopf liegen im Nacht-Modus fast gleich hell; das
  Zeichen ⚠, die Wortwahl und der Bernstein tragen die Warnung.)
- **Übergabe:** Dialog dunkel, „Das PDF ist immer hell, für Papier — auch in der
  Ansicht „Nacht"" steht im Dialog; QR-Vollbild mit „Teil 1 von 7".
- **Ansicht-Wahl:** vier Felder mit Zusatzzeile (normal, große Tasten, abends,
  gedimmt); die Eingabe im Bogen bleibt beim Wechsel erhalten.
- **Zoom und große Schrift:** kein seitlicher Überlauf auf Start, Sammlung und
  Lagemonitor bei Zoom 150 %, 200 % und `font-size: 200%` (360 px).

## Abgleich mit Runde 7

Grundlage: [../runde-7/nacht-und-sicht.md](../runde-7/nacht-und-sicht.md) samt
„Stand der Behebung" (R7-L1 bis L4 als behoben gemeldet).

| Runde-7-Befund | Stand laut Bericht | Bewertung Runde 8 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R7-L1 Einheitentabelle unter dem Bildrand (P2) | behoben („Tabelle füllt den Rest, Rest als + n weitere") | **teilweise** | Seitenhöhe gleich Bildhöhe, „+ n weitere Einheiten" und gekürzte Bewegungen halten; bei sechs Einheiten aber nur drei Zeilen, 82 bis 165 px frei (R8-L1). |
| R7-L2 Lagemonitor am Telefon: 7,5 px, Tasten 19 px (P2) | behoben („Schrift ab 14 px, Knöpfe 44 px, Seite rollt") | **hält** | Tabelle, Datenstand, Optionen 14 px; Tasten 44 px; Seite rollt (667 px bei 640 × 360). Rest: Systemschrift wirkt nicht (R8-L5); F/U/M außerhalb des Bildes (Verweis R8-H3, R8-K1). |
| R7-L3 Monitor folgt dem Nacht-Modus nicht (P3) | behoben („Start gedimmt bei Nacht, Stufe gemerkt") | **hält** | Nacht-Modus: Klasse `lm lm-gedimmt`, Luma 18; Stufe in `eeb.lagestufe.v1` gemerkt; die Taste nennt „Stufe: Gedimmt · weiter: Hell". Nebenwirkungen: Warntexte in Gedimmt 4,05:1 (R8-L3), Tipp führt auf Vollweiß (R8-L4). |
| R7-L4 „offen" im Schrittband wie der aktive Schritt (P3) | behoben („offen" mit Rand) | **hält** | „1 offen" in Nacht und Dunkel im Rahmen, der aktive Schritt in Bernstein mit Unterstrich; unterscheidbar. |

Nebenwirkungen der Runde-7-Änderungen: Der rollende Rumpf mit festem Fuß der
Rückfragen und die Zwei-Fenster-Leiste haben im Nacht-Modus keinen neuen
Sichtmangel gezeigt. Die Behebung von R7-L1 hat eine neue Messung der
Zeilenzahl eingeführt, die schon bei sechs Einheiten die Hälfte ausblendet
(R8-L1). Neu in Runde 8: R8-L1 und R8-L2 (je P2), R8-L3 bis R8-L7 (je P3).
Zusammen: 0 × P0, 0 × P1, 2 × P2, 5 × P3.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Man hält die Liste „3 Einheiten + 3 weitere" im
  Lagemonitor für die ganze Lage, obwohl alle sechs Platz hätten (R8-L1); und
  man liest abgeblendete Zeilen der Musterung als „erledigt", nicht als „noch zu
  entscheiden" (R8-L2).
- **Größtes Einsatzrisiko:** Am Fernseher im Fahrzeug fehlt bei kleiner Lage die
  Hälfte der Einheiten im Bild, ohne dass der Platz fehlt (R8-L1).
- **Top-Priorität für die nächste Iteration:** Die Zeilenzahl der Lagemonitor-
  Tabelle auf den tatsächlich freien Platz auslegen, sodass sechs Einheiten auf
  1080 p, 768 p und 720 p vollständig im Bild stehen (R8-L1).
