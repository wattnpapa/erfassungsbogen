# Audit „Handschuh-Bedienung“, Runde 10 (Touch-Ziele, Abstände, Zahlenfelder, Tastatur, Rückfragen, Zoom)

Stand: 25.10.2026 · Prüfer: Rollenaudit `thw-glove-touch-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `441811c`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-9-Befunde. Geprüft sind die Stellen, die Runde 9 für die Bedienung mit
Handschuh geändert hat: Zahlenfelder (Komma, Minus, Ziffernblock, Weiter-Taste),
Schalter „Sofortbedarf erfassen“ mit Rückfrage, Wahl-Rückfragen im festen Fuß,
Rückwege, Layout bei Zoom 180 × 320, Dialog „Bogen übergeben“, Lagemonitor mit
Stufentasten, Tipp-Sperre nach Ansichtswechsel; dazu die Änderungen aus der
Erprobung („Ort der Einheit (Pflicht)“, Einheiten-Anzahl-Fläche).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener
Browser-Kontext. Viewports 360 × 640 (Grundeinstellung), 320 × 568, 640 × 360
quer; Browser-Zoom 200 % nachgestellt (halbierter CSS-Viewport, vierfache
Pixeldichte, 180 × 320) und `html { font-size: 200% }`. Das ist kein echter
Chrome-Zoom. Die niedrige Tastatur stelle ich über Viewports von 360 × 300,
360 × 280 und 640 × 180 nach. Tablet 820 × 1180 habe ich in diesem Lauf nicht
gemessen.

Zustände per `localStorage`-Seed mit `uebung: false` und `stand` auf heute:
`eeb.entwurf.v1` (Großbogen Verstärkter Bergungszug, 38 Personen, 10 Fahrzeuge)
und `eeb.einsaetze.v1` (Sammlung „Hochwasser Musterstadt“, sechs Übungsbögen).

Blindprüfung: Die Berichte unter `docs/audits/` habe ich erst nach den ersten
Messungen gelesen (Startseite, Schritte 1 bis 6 in vier Lagen, Zielgrößen und
Abstände mit Rollen über die ganze Seite, Zahlenfelder, Schalter, Personenliste,
Einsatzansicht, Karten, Aufnahme von Hand, Lagemonitor, Tastatur-Nachstellung).
Gemessen sind Rechtecke per `getBoundingClientRect` (Maßstab: 44 px Kante, 8 px
Abstand, mit Handschuh eher 48 und 12 px) und Tipps per `tap()`. Elf weitere
Prüfer nutzten den Server gleichzeitig; Zeitmessungen sind unsicher.

**Nicht prüfbar:** echte Handschuhe auf echtem Glas, echte Bildschirmtastatur,
Wischen und Ziehen, Safari/WebKit, native Datums- und Zeitpicker (die
Chromium-Nachstellung zeigt sie im US-Format, das ist kein Befund), echter
Browser-Zoom, Geräteuhr-Warnung (R7-G8/H9, Grenze), R6-O9 (Grenze). Die
Stufentasten des Lagemonitors habe ich nur bis zum Anschlag geprüft; die
1,5-s-Sperre habe ich nicht sauber nachgestellt.

Kennzeichnung: **gemessen** heißt Zahl oder Wert aus dem Browser, **beobachtet**
heißt im Ablauf oder auf dem Bildschirmfoto gesehen, **Risiko** heißt plausibel,
aber nicht nachgestellt.

## Urteil

Die Runde-9-Behebungen tragen. Alle Ziele der Schritte 1 bis 6 sind mindestens
44 px hoch (360 × 640, 320 × 568, 640 × 360, 200 % Schrift, Zoom); kein seitlicher
Überlauf in 24 Läufen (`scrollWidth` gleich Bildbreite). Die Zahlenfelder zeigen
den Ziffernblock (`inputmode="numeric"`), die Eingabetaste springt zum nächsten
Feld, „12,5“ wird auf 13 gerundet und sagt das, „−5“ wird mit Satz abgelehnt,
Buchstaben werden verworfen. Das Ausschalten von „Sofortbedarf erfassen“ fragt mit
Nennung der Werte (Diesel, Benzin, Gemisch, Unterbringung, Ruhezeit); „Sofortbedarf
entfernen“ (rot) und „Behalten“ stehen 302 px breit mit rund 40 px Lücke im
festen Fuß. „Person entfernen“, „Meldung entfernen“ und „Neuen Bogen anfangen?“
haben je zwei Knöpfe von 44 px Höhe; bei Zoom 146 px breit untereinander. Der
Dialog „Bogen übergeben“ hat bei Zoom eine Kopfzeile von 76 von 288 px (26 %, vorher
53 %). Bei niedriger Tastatur bleibt das Feld im Bild, und die Fußleiste weicht
(Klasse `tastatur-offen`).

Reibung entsteht an einer Stelle, die aus der Behebung von R9-G6 folgt: Die
Eingabetaste der Tastatur steht in der Kurz-Liste des Personals auf „Weiter“, springt
aber in der Spalte nach unten statt zum Nachnamen (R10-G1). Dazu kommen zwei
P3-Reste. Es gibt keinen P0 und keinen P1. Alle Aufgaben (Bogen durchblättern, Zahlen
eintragen, Sofortbedarf aus- und einschalten, Person entfernen, Einheit abrücken,
Meldung entfernen, Einheit von Hand aufnehmen, Lagemonitor öffnen und dunkler
stellen) sind ohne fremde Hilfe zu schaffen.

## Befunde

### R10-G1 [P2] Kurz-Liste Personal: Die Weiter-Taste der Tastatur springt in der Spalte nach unten, nicht zum Nachnamen

**Priorität:** P2

**Kennzeichnung:** gemessen (Eingabetaste im Browser, Fokus und Feldwerte);
die echte Bildschirmtastatur nicht geprüft (Risiko für deren Beschriftung).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“, Ansicht „Kurz-Liste“ (Schnelleingabe,
`table.schnell-tabelle`), Felder „Person n: Vorname“ und „Person n: Nachname“.
`src/app/schritte/personal.tsx` (`enterWeiter`) gegen `src/app/tastatur.ts`
(`enterkeyhint` „next“, aus R9-G6).

**Beobachtung:** Im Feld „Person 1: Vorname“ trägt die Tastaturtaste `enterkeyhint="next"`
(„Weiter“). Die Eingabetaste führt aber zu „Person 2: Vorname“, dann „Person 3:
Vorname“ und so fort; „Person 1: Nachname“ führt zu „Person 2: Nachname“. Auf dem
Telefon stehen Vor- und Nachname einer Person nebeneinander in einer Zeile. Messung:
„Anna“ in Person 1 Vorname, Eingabetaste, „Muster“ getippt ergibt Person 1 =
„Anna / Otto“ (Nachname unverändert) und Person 2 Vorname = „FelixMuster“ (an den
vorhandenen Wert angehängt, nichts markiert). Auf der Seite steht kein Hinweis zur
Eingabetaste. Der Quelltext nennt die Spaltenfolge als Absicht (für mehrere Namen
hintereinander); sichtbar ist sie nicht.

**Erwartung der Rolle:** „Weiter“ führt zum nächsten sichtbaren Feld der Zeile,
also vom Vornamen zum Nachnamen; wer eine Spalte durchgehen will, tippt sie an.

**Auswirkung im Einsatz:** Wer Namen vom Papier zeilenweise eintippt, schreibt den
Nachnamen in die nächste Person, oft außerhalb des Bildes (Person 2 liegt 148 px
tiefer). Das wird bei 38 Zeilen leicht übersehen; fremde Namen stehen dann an
falschen Stellen des Bogens. Mit Handschuh ist jede Korrektur teuer.

**Empfehlung:** Die Eingabetaste in der Kurz-Liste zum Nachnamen und von dort zur
nächsten Zeile führen (oder die Spaltenfolge sichtbar benennen und das Feld beim
Anspringen markieren, damit nichts angehängt wird).

**Nachprüfung:** Schritt 3, Kurz-Liste: Vorname, Eingabetaste, Nachname tippen ergibt
Person 1 = Vor- und Nachname, Person 2 unverändert.

### R10-G2 [P3] Kachel „n Einheiten“ in der Sammlung sieht wie ein gedrückter Knopf aus, reagiert aber nicht

**Priorität:** P3

**Kennzeichnung:** beobachtet (Bildschirmfoto, Tipp ohne Wirkung); Fehltipp
Risiko.

**Fundstelle / Aufgabe:** Einsatzansicht → Kopfkarte „Stärke“ (`div.anzahl`, 98 × 64 px,
x 33, y 266 bei 360 × 640).

**Beobachtung:** Die Zahl „6 EINHEITEN“ liegt auf grauer Fläche mit dunklem Balken am
rechten Rand, die vier anderen Zahlen auf Weiß. Das Element ist weder Knopf noch Link
(`tabIndex −1`, kein Rolle, Zeiger normal); ein Tipp mitten darauf ändert nichts
(Rollposition 0 → 0, kein Hinweis).

**Erwartung der Rolle:** Eine hervorgehobene Fläche in der Größe eines Knopfes führt
irgendwohin, etwa zur Einheitenliste; sonst sieht sie wie die anderen Zahlen aus.

**Auswirkung im Einsatz:** Ein Helfer tippt darauf, um die Liste zu erreichen, und
bekommt keine Antwort; das kostet einen Versuch, mehr nicht. Der Knopf „Zur
Einheitenliste ↓“ liegt weiter unten.

**Empfehlung:** Die Fläche entweder zum Sprung zur Liste machen oder optisch an die
anderen Zahlen angleichen.

**Nachprüfung:** Tipp auf die Kachel führt zur Einheitenliste, oder die Kachel ist nicht
mehr als Knopf lesbar.

### R10-G3 [P3] Schritt 5: Hinweise unter den 112 px breiten Zahlenfeldern brechen in sieben Zeilen, die Spalten laufen auseinander

**Priorität:** P3

**Kennzeichnung:** gemessen (Feldbreiten, Positionen) und beobachtet (Bildschirmfotos
`n-minus.png`, `komma.png`).

**Fundstelle / Aufgabe:** Schritt 5 „Sofortbedarf & Sonstiges“, Felder Verpflegung, Diesel,
Benzin, Gemisch (je 112 × 44 px, zwei Spalten, 360 × 640).

**Beobachtung:** Der Satz „Minus geht nicht — „-5“ wurde nicht übernommen. Die Menge
ohne Vorzeichen eintragen.“ steht unter „Diesel“ in der 112 px breiten Spalte in sieben
Zeilen (rund 250 px hoch); die Zeile „Benzin“ rutscht dadurch auf 1000 px (Feld von
y 497 statt 414). Der Hinweis „12,5 auf ganze Liter gerundet: 13“ unter Benzin
verschiebt Diesel und Benzin um 43 px gegeneinander. Das Feld mit dem Hinweis behält
den roten Rand, das Nachbarfeld springt aus dem Blick.

**Erwartung der Rolle:** Der Hinweis steht kurz und breit, und die Felder bleiben an
ihrem Platz.

**Auswirkung im Einsatz:** Das Bild springt nach einem Fehltipp; wer das nächste Feld
sucht, muss neu zielen. Kein Datenfehler.

**Empfehlung:** Hinweise über die volle Kartenbreite legen (eigene Zeile unter dem
Feldpaar) und kürzer fassen („Kein Minus.“).

**Nachprüfung:** Bei 360 × 640 bleiben Diesel und Benzin nach dem Hinweis auf gleicher
Höhe; der Hinweis hat höchstens zwei Zeilen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Zielgrößen:** Schritte 1 bis 6 in vier Lagen und die Einsatzansicht: alle
  Knöpfe, Eingaben und Auswahlfelder mindestens 44 px hoch; Personenliste „▲ ▼ ⇑ ✕“
  je 44 × 44 px mit 4 bis 5 px Lücke, „✕“ (rot) am rechten Rand mit Rückfrage und
  „Rückgängig“.
- **Zahlenfelder:** „12,5“ → 13 mit Satz; „−5“ abgelehnt (rot, Satz); „abc“ verworfen;
  „1.000“ → 1000; Fokus markiert den Inhalt. Eingabetaste springt in Schritt 4
  (Sitzplätze) und 5 zum nächsten Feld, im letzten zum Textfeld bzw. schließt die
  Tastatur.
- **Tastatur nachgestellt (360 × 300, 360 × 280, 640 × 180):** angetipptes Feld
  bleibt im Bild; die Fußleiste (56 px) bleibt bei 300 px stehen und weicht bei
  280 px.
- **Rückfragen:** „Sofortbedarf entfernen?“, „Braun, Felix entfernen?“, „Meldung
  entfernen?“ (nennt Nummern-Verschiebung, scrollt im Rumpf, Knöpfe im festen Fuß),
  „Neuen Bogen anfangen?“: gefährliche Wahl rot und oben, Abbruch darunter, 44 px
  hoch; quer nebeneinander 235 px mit 24 px Lücke; bei Zoom untereinander 146 px.
- **„Abrücken“:** Quittung „Abgerückt 10:21: … Rückgängig“ (110 × 44 px, „✕“ 44 px);
  „Entfernen“ (rot) liegt in „Mehr…“ von „Verschieben…“ getrennt.
- **Dialog „Bogen übergeben“ bei Zoom:** Kopfzeile 76 von 288 px; quer 52 von 168 px.
- **Layout bei Zoom (R9-G1):** Sammlung bei 180 × 320: Karten 164 px breit, Rand
  je 8 px.
- **Tipp-Sperre:** Während der Sperre erscheint „Einen Moment …“ (fest, 140 × 29 px,
  `pointer-events: none`), so dass der zweite Tipp nicht stumm bleibt.
- **Lagemonitor:** „Einsatzdaten“, „Optionen“ je 44 px hoch (14 px Lücke), „Dunkler“,
  „Heller (weiß)“, „Vollbild“, „Schließen“ 83/113/80/97 × 44 px, 8 px Lücke; „Dunkler“
  ist am Anschlag deaktiviert (`aria-disabled`).
- **Keine Pflichtgesten.**

## Abgleich mit Runde 9

Grundlage: [../runde-9/handschuh-bedienung.md](../runde-9/handschuh-bedienung.md) mit
„Stand der Behebung“ in der [README von Runde 9](../runde-9/README.md).

| Runde-9-Befund | Stand laut README | Bewertung Runde 10 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R9-G1 Zoom: 60-px-Streifen in Sammlungsseiten (P3) | behoben | **hält** | 180 × 320: Rand 8 px links und rechts, Karten 164 px breit, kein Überlauf. |
| R9-G2 Dialog-Kopfzeile bei Zoom (P3) | behoben | **hält** | Kopfzeile 76 von 288 px (26 %), quer 52 von 168 px; „Schließen“ 154 × 44 px. |
| R9-G3 „Dies ist eine Übung“ ohne Lücke zu „Datenschutzfrist“ (P3) | behoben | **hält** | 14 px Abstand (44 px Kästchen, Aufklappfeld 63,5 px hoch). |
| R9-G4 Quer: „‹ Startseite“ 2 px über Tabs (P3) | behoben | **hält** | 640 × 360: „Startseite“ y 4 bis 48, Tabs y 57: 9 px; Tabs quer mit 8 px Lücke. Die Ansicht steht quer weiterhin oben und unten. |
| R9-G5 Feste Leisten bei Zoom (P3) | teilweise | **nicht geprüft** | Zwei-Fenster-Zustand in diesem Lauf nicht nachgestellt; Stand wie in Runde 9. |
| R9-G6 Zahlenfelder ohne `inputmode`, ohne Weiter-Taste (P3) | behoben | **hält, Nebenwirkung** | Schritt 4 und 5 mit `inputmode="numeric"`, `enterkeyhint="next"`; Schritt 3 Kurz-Liste springt in der Spalte (R10-G1). |
| R9-E1 Komma und Minus in Zahlenfeldern | behoben | **hält** | Siehe Bestätigtes; Layout der Hinweise R10-G3. |
| R9-D1 Schalter „Sofortbedarf erfassen“ ohne Rückfrage | behoben | **hält** | Rückfrage nennt Diesel 999999 l, Benzin, Gemisch, Unterbringung, Ruhezeit; „Behalten“ 302 × 44 px. Eine Plausibilitätsprüfung für 999999 l fehlt; das deckt R9-E1/D1 ab (nur Verweis). |
| R9-W1, M2 Wahl-Rückfrage mit mehreren Wegen im Fuß | behoben | **hält (teilweise nachgestellt)** | Zwei-Wege-Rückfragen gemessen; Aufnahme eines älteren Standes in die Sammlung ging ohne Rückfrage in die Historie mit Hinweiszeile. Die Drei-Wege-Fälle habe ich nicht erreicht. |
| R9-H5, S2 Tipp-Sperre 600 ms | behoben | **hält** | „Einen Moment …“ sichtbar; ein zweiter Tipp nach rund 700 ms auf „Weiter“ wird weiter ignoriert (Grenze R8-H5/S4 Prellschutz 450/800 ms, Stand unverändert). |
| R9-K3, L3 Lagemonitor Stufentasten | behoben | **hält** | „Dunkler“/„Heller (weiß)“ 44 px, Anschlag deaktiviert; die 1,5-s-Sperre nicht gesondert nachgestellt. |
| Einheiten-Anzahl-Fläche (main, Erprobung) | – | **neu, R10-G2** | Fläche ohne Funktion. |
| „Ort der Einheit (Pflicht)“ (main, Erprobung) | – | **in Ordnung** | Feld 203 × 44 px in der Zeile mit „Ebene“, Schritt 1, Aufnahme von Hand. |
| R8-D5 „Rückgängig“ unter „Abrücken“ (Grenze) | teilweise | **Grenze, Stand** | Nach „Abrücken“ steht an derselben Stelle „Wieder anwesend“ (126 × 44 px); die Quittung mit „Rückgängig“ bleibt länger als 20 s stehen und deckt unten rund 130 px. |
| R8-H5/S4 Prellschutz | Grenze | **Grenze, Stand** | Siehe oben. |
| R7-G4/M8 Ecken-Knopf hochkant | Grenze | **Grenze, Stand** | Unverändert: „◐ Ansicht: Standard“ 170 × 44 px unten links, in der Fußleiste des Assistenten 44 × 47 px. |
| R6-G6 Schrittleiste ohne Lücke | offen | **offen** | Hochkant 72/53/53/53/53/44 px bei 360 px, 0 px Lücke; quer 8 px. |
| R7-N9 Ziffern der Schrittleiste | Grenze | **Grenze, Stand** | Bei Aufnahme von Hand nur „1“ bis „6“, hochkant mit Wort. |
| R6-O9, R7-G8/H9, R7-N1, R8-A1, R8-M6, R9-M3 | Grenzen | **nicht geprüft** | Außerhalb dieses Laufs. |

## Abschluss

- **Aufgabe geschafft:** ja. Alle Abläufe der Rolle bei 100 % und 200 % Schrift sowie
  bei nachgestelltem Zoom; Personen zeilenweise eintippen nur mit Umweg bei der
  Eingabetaste (R10-G1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Taste „Weiter“ der Tastatur führt in der Kurz-Liste
  nicht zum Nachnamen derselben Person, sondern zum Vornamen der nächsten (R10-G1).
- **Größtes Einsatzrisiko:** Nachnamen landen unbemerkt in der Folgezeile der
  Personenliste (R10-G1); ein Datenverlust entsteht nicht, aber falsche Zuordnung.
- **Top-Priorität für die nächste Iteration:** Eingabetaste in der Kurz-Liste vom
  Vornamen zum Nachnamen führen (R10-G1).

## Zusammenfassung

Befunde: **P0 0 · P1 0 · P2 1 · P3 2**. Neu: R10-G1 (P2), R10-G2 und R10-G3 (P3).
Von den Runde-9-Befunden halten G1, G2, G3, G4, G6; G5 nicht geprüft; Grenzen
bleiben R8-D5, R8-H5/S4, R7-G4/M8; R6-G6 bleibt offen. Skripte und Bildschirmfotos
liegen außerhalb des Repositorys im Scratchpad (`runde10/g/`).
