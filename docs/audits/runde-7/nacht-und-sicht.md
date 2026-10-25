# Audit „Nacht und Sicht", Runde 7 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App einschließlich Lagemonitor, Produktionsbuild
(`vite preview`, Port 4173), Code-Stand Commit `a52f20a`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-6-Befunde. Ich habe zuerst blind geprüft (Startseite, Assistent,
Einsatzansicht, Lagemonitor in allen Modi, Übergabe, Warnleiste, Rückfragen) und
den Bericht [Runde 6](../runde-6/nacht-und-sicht.md) samt „Stand der Behebung"
erst danach gelesen. Andere Berichte habe ich nicht herangezogen; was bereits
anderswo steht, ist als Verweis genannt.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`), Locale
de-DE, je Lauf ein eigener Browser-Kontext, weil elf weitere Prüfer denselben
Server nutzen. Telefon 360 × 640 bei Pixelverhältnis 2 mit `isMobile`/`hasTouch`
als Grundeinstellung, dazu 320 × 568, 640 × 360 quer, Tablet 820 × 1180; der
Lagemonitor zusätzlich auf 1920 × 1080, 1366 × 768 und 1280 × 720 (ohne Touch).
Geprüft in allen vier Modi (Standard, Feld, Dunkel, Nacht) und mit
Systemeinstellung „dunkel" ohne gespeicherte Wahl (Skripte aus dem
Scratchpad `runde7/`, nicht im Repository). Bei 200 % Schrift
(`html { font-size: 200% }`) habe ich nur die feste Fußleiste des Assistenten
gemessen.

Zustände aus `localStorage`-Seeds, alle mit `uebung: false` und `stand` auf
heute:

- `eeb.entwurf.v1`: Großbogen „Verstärkter Bergungszug" (`examples/thw/`,
  38 Personen, 7 QR-Teile);
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Musterstadt" mit sechs Meldungen aus
  `examples/thw/`; Varianten: ohne Bewegung, mit einer Bewegung (eine
  Einheit abgerückt), mit drei Bewegungen (abgerückt, „Wieder da",
  Folgemeldung), mit um 3 Stunden gealterten Meldungen, mit zwei Meldungen
  „vom Papier" (`vomPapier`), mit 200 Tage alter Sammlung und `eeb.uhr.v1`
  200 Tage zurück (Geräteuhr-Rückfrage), eine Übungssammlung;
- ein zweiter Tab im selben Kontext, der den Entwurf ändert (Warnleiste des
  Zwei-Fenster-Abgleichs).

Durchlaufen habe ich: Startseite in vier Modi, Assistent Schritt 1–6 in vier
Modi, „Bogen übergeben…" und QR-Vollbild (7 Teile), Einsatzansicht (Kopf,
Karten, aufgeklappte Karte, „Abrücken" mit Quittung, Papier-Abgleich, Block
„Lagemonitor für den Fernseher", Ansicht-Wahl im Kopf und in der festen
Leiste), Lagemonitor (Dunkel, Gedimmt, Hell; zu- und aufgeklappt; mit und ohne
Bewegungen; mit gealterten Daten; Einsatz nicht vorhanden; Übung), Warnleiste
des Zwei-Fenster-Abgleichs, Geräteuhr-Rückfrage samt Löschdialog, Offline-Zeile
der Startseite, Kaltstart mit blockiertem Bundle (Systemeinstellung dunkel und
hell, Lagemonitor in Standard und Feld).

Gemessen habe ich Kontraste (Schriftfarbe gegen die tatsächlich darunter
liegende Fläche, Deckkraft der Vorfahren eingerechnet, WCAG-Formel), das
mittlere Luma je Bildschirmfoto (sRGB, 0–255), Schriftgrößen, Lage und Größe
von Elementen (`getBoundingClientRect`, `scrollHeight`) und ausgewählte
Bildpunkte (Radioknöpfe). Bildschirmfotos habe ich angesehen, nicht nur
gerechnet.

**Nicht prüfbar:** echtes Licht (Sonne, Arbeitsscheinwerfer, Rotlicht),
tatsächliche Displayhelligkeit, ein Fernseher im Fahrzeug (Abstand,
Spiegelung, Overscan), OLED-Schwarz, WebKit/Safari, die native Android-/iOS-
Fassung, Kamera-Scanner im Dunkeln, Ausdruck und PDF-Betrachter,
`window.open` und „Vollbild" auf einem zweiten Bildschirm (der Monitor wurde
daher über `?lagemonitor=<Kennung>` direkt aufgerufen), Wachhalten des
Bildschirms. Zeitmessungen liefen unter Last durch elf parallele Prüfer.

## Urteil

Die Behebungen von Runde 6 halten überwiegend. Der Lagemonitor ist von Anfang
an schwarz (Luma 0,0 vor dem Aufbau in Standard und Feld), die Linien haben
6,64:1 (Gedimmt 3,74:1), die Stufenfolge Dunkel → Gedimmt → Hell hält „Hell" ans
Ende, der Fehlerzustand hat Uhr und eine Taste in Monitorschrift (34,6 px bei
1080 p), und die Zusatzzeile der Ansicht-Wahl liegt in allen vier Modi bei
mindestens 5,0:1. In der App selbst liegt im Nacht-Modus kein aktiver Text
unter 4,7:1 (ohne deaktivierte Knöpfe), im Dunkel-Modus keiner unter 5,9:1, im
Feld-Modus keiner unter 6,8:1. Zustände tragen Wort oder Zeichen
(„● Ruhezeit", „⚠ Anderer Einsatz?", „✓ Abgerückt" mit gestricheltem Rand,
„Folgemeldung:", „Abgerückt:", „Wieder da:"); keine Meldung hängt allein an der
Farbe. Warnleiste, Geräteuhr-Rückfrage und Löschdialog sind im Nacht-Modus
gut lesbar und blenden nicht (Luma 32 bis 40).

Reibung gibt es an einer Stelle, die Runde 6 nur teilweise behoben hat und
die durch die neuen Bewegungszeilen verschärft wurde: Auf dem Fernseher liegt
die Einheitentabelle des Lagemonitors schon ohne Bewegung zur Hälfte unter dem
Bildrand und mit drei Bewegungszeilen ganz darunter (R7-L1). Auf dem Telefon
sind die neue Datenstand-Zeile und die Tabelle in 7,5 bis 9 px gesetzt
(R7-L2). Der Monitor folgt dem Nacht-Modus weiterhin nicht von selbst
(R7-L3).

Die Aufgabe gelingt bei Nacht und in der Sonne ohne fremde Hilfe: Bogen
erfassen, übergeben (QR hell auf dunklem Grund mit Hinweis), am Meldekopf
sammeln, Lage zeigen. Auf dem Fernseher fehlt ohne Bedienung die Liste der
Einheiten.

## Befunde

Keine P0- und keine P1-Befunde. Zwei P2-Befunde, zwei P3-Befunde.

### R7-L1 [P2] Lagemonitor: Einheitentabelle liegt auf dem Fernseher größtenteils unter dem Bildrand, mit Bewegungszeilen ganz (Rest von R6-L2, durch Runde 6 verschärft)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Lagemonitor, `.lm-klapp` „Einheiten" und die Zeilen
`.lm-bewegung` (Abrücken, Wieder da, Folgemeldung). Code:
`src/app/lagemonitor.css` (`min-height: 100vh`, `.lm-klapp[open] .lm-tabelle
{ max-height: 38vh }`), `src/app/lagemonitor-ui.tsx` (bis zu drei
Bewegungszeilen über der Dauer).

**Beobachtung:** Die Tabelle ist jetzt standardmäßig offen und rollt in sich
(731 px Inhalt in 410 px Höhe bei 1080 p). Sie beginnt aber erst weit unten;
die Zeit-Zeile bleibt 243 px hoch, jede Bewegungszeile kommt dazu. Obere Kante
der Tabelle (Fenstergrenze = Bildhöhe), Nacht-Modus, sechs Einheiten:

| Fenster | ohne Bewegung | eine Bewegung | drei Bewegungen | Seitenhöhe (drei) |
| --- | --- | --- | --- | --- |
| 1920 × 1080 | 804 px | 933 px | **1 264 px, nicht im Bild** | 1 796 px |
| 1366 × 768 | 582 px | 675 px | **914 px, nicht im Bild** | 1 297 px |
| 1280 × 720 | 548 px | 636 px | **860 px, nicht im Bild** | 1 220 px |

Auch ohne Bewegung ragt die Tabelle unten aus dem Bild (bei 1080 p enden die
410 px bei 1 214 px, im Bild stehen rund 276 px, etwa drei der sechs Zeilen);
die Seite ist 1 336 px hoch. Am Tablet (820 × 1180) liegt die Tabelle mit drei
Bewegungen ab 776 px, die Seite ist 1 299 px hoch. Die innere Rollfläche der
Tabelle hat keinen Hinweis, dass weitere Zeilen folgen; „+ n weitere" gibt es
weiterhin nicht. „Einsatzdaten" und „Optionen" liegen immer unterhalb.

**Erwartung der Rolle:** Das Großbild zeigt Zeit, Stärke, Bewegungen und die
Liste der Einheiten gleichzeitig, ohne dass jemand daran rollt oder tippt;
die Seitenhöhe entspricht der Bildhöhe.

**Folge:** Nachts im Fahrzeug bedient niemand den Fernseher. Die Bewegungszeilen
(Abgerückt, Wieder da, Folgemeldung) sind der neue, wichtigste Zusatz von
Runde 6; sie schieben aber genau die Fläche aus dem Bild, die zeigt, welche
Einheiten da sind. In der Lage mit mehreren Bewegungen in 15 Minuten ist die
Tabelle am Fernseher nicht mehr ablesbar.

**Empfehlung:** Die Bewegungszeilen in einer Zeile mit der Dauer oder
kleiner setzen, die Zeit-Zeile zugunsten der Liste schrumpfen lassen und die
Höhe der Liste auf den Rest des Bildes begrenzen (statt 38 vh ab einer
beliebigen Oberkante); bei mehr Zeilen als Platz „+ n weitere" zeigen.

**Nachprüfung:** 1920 × 1080, 1366 × 768 und 1280 × 720, sechs Einheiten und
drei Bewegungen: Seitenhöhe gleich Bildhöhe, alle sechs Zeilen im Bild; bei
zwölf Einheiten steht „+ n weitere" da.

### R7-L2 [P2] Lagemonitor auf dem Telefon: Datenstand 7,5 px, Tabelle 9 px, Taste 19 px hoch

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Lagemonitor bei 360 × 640 und 320 × 568, erreicht über
„Lagemonitor öffnen" in der Einsatzansicht (der Knopf steht auf dem
Telefon). Code: `src/app/lagemonitor.css` (alle Größen aus
`min(… vh, … vw)`).

**Beobachtung:** Die Schrift richtet sich nach der kürzeren Fensterseite und
wird auf dem Telefon sehr klein. Gemessen:

| Element | 360 × 640 | 320 × 568 | 640 × 360 quer | 820 × 1180 |
| --- | --- | --- | --- | --- |
| Datenstand „letzte Meldung vor 1 Min" und Bewegungsalter | 7,5 px | 6,6 px | 10,4 px | 17,0 px |
| Tabellenkopf und -zeilen | 9,1 px | 8,1 px | 13,2 px | – |
| „Einsatzdaten", „Optionen" | 7,9 px | 7,0 px | 11,5 px | – |
| Tasten „Gedimmt" / „Vollbild" / „Schließen" | 19 px hoch | – | – | – |

Der Kontrast ist in Ordnung (Gedimmt ≥ 6,76:1 für die kleine Schrift); es
liegt allein an der Größe. Im Querformat (640 × 360) ist die Seite 643 px
hoch und rollt.

**Erwartung der Rolle:** Wer den Monitor auf dem Telefon oder Tablet im Zelt
anschaut, kann die Angabe „letzte Meldung vor … Min" lesen, ohne die
Dunkeladaption aufzugeben und das Gerät an die Nase zu halten.

**Folge:** Die in Runde 6 eingeführte Datenstand-Angabe, mit der man erkennt,
ob die Lage frisch ist, ist auf dem Telefon bei Nacht praktisch unlesbar. Die
Tasten sind für Handschuhe zu klein (Verweis auf den Bericht zur
Handschuh-Bedienung, hier nur der Sichtbezug).

**Empfehlung:** Eine Untergrenze für die Schrift (etwa 14 px für Datenstand und
Tabelle) und für die Tasten, die auf kleinen Fenstern den Platz mit
weniger Inhalt oder Rollen bezahlt; oder die Tabelle auf dem Telefon in der
Schrift der App setzen.

**Nachprüfung:** 360 × 640 und 320 × 568: Datenstand, Tabelle und
Optionszeilen ≥ 14 px, Tasten ≥ 44 px hoch.

### R7-L3 [P3] Lagemonitor folgt dem Nacht-Modus nicht von selbst; Stufe wird nicht gemerkt und nicht angezeigt (Rest von R6-L4)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Verhalten), gemessen (Helligkeit); Wirkung am
Fernseher Risiko.

**Fundstelle / Aufgabe:** Lagemonitor, Optionen. Code:
`src/app/lagemonitor-ui.tsx` (`useState<"dunkel" | "gedimmt" | "hell">("dunkel")`).

**Beobachtung:** Steht die App auf „Nacht", öffnet der Monitor trotzdem in
Stufe „Dunkel": reines Weiß #fff und Rot #ff0000 auf Schwarz (`<html>` trägt
`nacht-modus`, die Klasse des Monitors nur `lm`). Die gedimmte Stufe liegt
hinter zwei Aufklappungen (Optionen, Taste „Gedimmt"); nach einem Neuladen ist
wieder „Dunkel" eingestellt (geprüft, kein Schlüssel im `localStorage`). Mittleres
Luma, Seite 1920 × 3000 mit allen Bereichen offen: Dunkel 19,2, Gedimmt 15,0,
Hell 232,4. Die Taste trägt den Namen der nächsten Stufe („Gedimmt", dann
„Hell", dann „Dunkel"), die aktuelle Stufe steht nirgends. Die Linien sind in
Gedimmt 3,74:1, die rote Zeit 4,05:1 (große Schrift, ausreichend).

**Erwartung der Rolle:** Wer die App auf „Nacht" gestellt hat, erwartet das
gedämpfte Bild auch am Fernseher, ohne es dort einzustellen; nach einem
Neuladen (z. B. nach Ruhezustand des Rechners) soll es dabei bleiben.

**Folge:** Gering. Weiß auf Schwarz bei großer Schrift ist am Fernseher
im dunklen Fahrzeug heller als nötig; wer den Monitor nach einem Neuladen
nicht neu dimmt, sieht wieder die helle Stufe. Wer „Hell" gesehen hat, weiß
nicht, wie viele Tipps er bis zum dunklen Bild braucht.

**Empfehlung:** Den Nacht-Modus des Geräts als Vorgabe der Stufe
„Gedimmt" übernehmen, die gewählte Stufe merken (ohne „Hell" zu speichern) und
die aktuelle Stufe in der Taste mitsagen („Stufe: Gedimmt · weiter: Hell").

**Nachprüfung:** App auf „Nacht", Monitor öffnen: Klasse `lm-gedimmt`, Luma
unter dem der Stufe „Dunkel"; nach Neuladen unverändert; die Taste nennt die
aktuelle Stufe.

### R7-L4 [P3] Nacht-Modus: „offen" im Schrittband trägt dieselbe Bernsteinfarbe wie der aktive Schritt

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Assistent, Schrittband („1 offen", „2 ✓", …) im
Nacht-Modus. Code: `index.html` (Stil `.schritt-status`, Akzentfarbe des
Modus).

**Beobachtung:** Im Nacht-Modus ist der aktive Schritt bernsteinfarben mit
Unterstreichung (Schritt 3: Text rgb(201,147,44)), das Wort „offen" in
Schritt 1 ebenfalls. Auf dem Bildschirmfoto von Schritt 6 stehen „1 offen"
und die aktive „6" beide in Bernstein nebeneinander; unterscheidbar bleiben sie
nur an der Unterstreichung und am Wort. In Standard, Dunkel und Feld ist der
aktive Schritt weiß (255,255,255) gegen graue (206,206,216) übrige.

**Erwartung der Rolle:** Der aktive Schritt hebt sich ab; ein offener Schritt
ist eine Warnung und sieht nicht aus wie „hier bin ich".

**Folge:** Gering; die Unterstreichung trägt den aktiven Schritt, das Wort
„offen" den Zustand. Bei flüchtigem Blick bei Nacht liest man zwei
Markierungen als gleich wichtig.

**Empfehlung:** „offen" im Nacht-Modus als Wort in einer anderen Form
(z. B. umrandet wie „● Ruhezeit") und die aktive Farbe dem Schritt allein
vorbehalten.

**Nachprüfung:** Assistent bei Schritt 3 und 6, Nacht: aktiver Schritt und
„offen" in Farbe oder Form unterscheidbar, auch im Graustufenbild.

## Verweise auf andere Berichte

- „Bedarf:" bricht in der Kopfzeile der Einsatzansicht weiter mitten im Wort
  („Bed | arf:"), beobachtet bei 360 px im Nacht-Modus. Steht in
  [Runde 6, neuer-nutzer.md](../runde-6/neuer-nutzer.md); hier kein neuer Befund.
- Taste-Größen im Lagemonitor (19 px) und Fußleisten-Raster: Bericht zur
  Handschuh-Bedienung und zur mobilen Oberfläche; hier nur R7-L2 mit dem
  Sichtbezug.

## Bestätigtes

- **Kaltstart:** Mit Systemeinstellung „dunkel" ohne gespeicherte Wahl und
  blockiertem Bundle: `dunkel-modus`, Grund rgb(15,17,22), Luma 31,1; bei „hell"
  Standard (Luma 207,9). Lagemonitor in Standard und Feld: Klasse
  `lagemonitor-start`, Grund schwarz, Luma 0,0 vor dem Aufbau (R6-L3).
- **Kontraste der App:** niedrigste aktive Werte Nacht ≥ 4,71:1 („Erfassungsbogen"
  im Kopf; Rest ≥ 5,0:1), Dunkel ≥ 5,9:1, Feld ≥ 6,8:1, Standard ≥ 4,96:1. Nur der
  deaktivierte „← Zurück"/„←" in Schritt 1 und beim ersten QR-Teil liegt bei
  2,6 bis 3,4:1 (deaktiviert, ausgenommen).
- **Ansicht-Wahl, Zusatzzeile:** `.modus-kurz` Standard 5,92:1 (aktiv 14,2:1),
  Feld ≥ 14,2:1, Dunkel ≥ 8,17:1, Nacht ≥ 6,31:1 (aktives Feld 5,00:1) (R6-L5).
  Der Wechsel von Nacht auf Standard geschieht mit einem Tipp ohne Rückfrage
  (Luma 33 → 206); die hellen Modi stehen links, Nacht rechts, vier Felder à 168 px.
- **Lagemonitor, Farben:** Zeit #ff0000 auf #000 5,25:1, Gedimmt 4,05:1 (große
  Schrift), Hell #cc0000 auf Weiß 5,89:1; Labels, Tabellenkopf und
  Beschriftungen mit der Monitorfarbe (Dunkel ≥ 11,45:1, Gedimmt ≥ 6,76:1, Hell
  ≥ 10,41:1), in allen vier App-Modi gleich (R6-L1).
- **Lagemonitor, Fehlerzustand:** `?lagemonitor=gibtsnicht` bei 1920 × 1080:
  Taste 34,6 px, 226 × 83 px, transparent mit Monitorrahmen, Seitenhöhe 1 080 px,
  Uhr läuft weiter; auf dem Telefon 7,9 px (siehe R7-L2) (R6-L6).
- **Bewegungszeilen im Lagemonitor:** „Abgerückt:", „Wieder da:", „Folgemeldung:"
  stehen als Wort mit Alter („vor 2 Min"), Weiß auf Schwarz, ohne Farbcode; nach
  15 Minuten verschwinden sie, die Summe „· 1 abgerückt" bleibt. Datenstand
  „letzte Meldung vor 3 Std 1 Min" bei gealterten Daten sichtbar.
- **Zustandsmarken der Einsatzansicht:** „neu", „● Ruhezeit", „● Unterbr.",
  „⚠ Anderer Einsatz?", „Zeitraum vorbei", „✓ Abgerückt" (gestrichelter Rand und
  Seitenstrich) tragen Wort oder Zeichen und sind ohne Farbe unterscheidbar;
  Kontrast ≥ 5,0:1.
- **Zwei-Fenster-Warnleiste:** feste Leiste oben, bernstein auf dunklem Braun, mit
  „Weniger", zwei gleich große Entscheidungstasten; belegt rund 36 % der
  Fensterhöhe (232 von 640 px) bis zur Entscheidung; Luma der Seite 38,6.
- **Geräteuhr-Rückfrage und Löschdialog:** Warnung und Dialog „Datum stimmt —
  jetzt endgültig löschen?" im Nacht-Modus lesbar (Dialogtext hell auf dunkel;
  „Ja, … löschen" rosa mit Rahmen, „Abbrechen" neutral, beide Wörter tragen die
  Bedeutung); Luma 32 bis 40, kein weißer Blitz.
- **Papier-Abgleich:** Karte „Lage noch nicht abgeglichen: 2 Einheiten" und Formular
  im Nacht-Modus ≥ 6,31:1; Radioknöpfe „anwesend / abgerückt": gewählt hell (10,7:1
  gegen den Grund), ungewählt Ring 4,5:1.
- **Übergabe:** QR-Vollbild bleibt hell (weiße Fläche mit Ruhezone, Luma der Seite
  97), das ist für das Scannen nötig; Dialog und Knöpfe dunkel; „Das PDF ist immer
  hell, für Papier — auch in der Ansicht „Nacht"" steht im Dialog.
- **Offline-Zeile der Startseite:** erst „⏳ Wird … geladen", nach wenigen
  Sekunden „✓ Jetzt offline bereit …" mit Fortschritt; Nacht ≥ 5,0:1.
- **Deckel bei großer Schrift:** feste Fußleiste des Assistenten bei 200 % Schrift
  79 px (360 × 640 und 320 × 568, 12 bis 14 % der Höhe), quer 70 px von 360;
  ohne Vergrößerung 71 px bzw. 56 px.
- **Helligkeit der App:** Luma-Mittel Nacht 31 bis 40, Dunkel 38 bis 43, Standard 202
  bis 207, Feld 182 bis 187 je Bildlage.

## Abgleich mit Runde 6

Grundlage: [../runde-6/nacht-und-sicht.md](../runde-6/nacht-und-sicht.md) samt
„Stand der Behebung" (5 behoben, 1 teilweise).

| Runde-6-Befund | Stand laut Bericht | Bewertung Runde 7 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R6-L1 Überschriften des Monitors in Standard/Feld unsichtbar (P2) | behoben | **hält** | Alle Texte des Monitors ≥ 11,45:1 (Dunkel) in allen vier App-Modi; „Züge" und „Zuletzt gemeldet" gibt es nicht mehr, die Tabellenköpfe nehmen die Monitorfarbe. |
| R6-L2 Einheitenliste zugeklappt, läuft aus dem Bild (P2) | teilweise | **teilweise, durch Bewegungszeilen verschärft** | Tabelle offen und in sich rollend, aber ab 804 px (1080 p) und mit drei Bewegungszeilen ab 1 264 px, nicht im Bild; „+ n weitere" fehlt. Siehe R7-L1. |
| R6-L3 Weißer Bildschirm vor dem Aufbau (P3) | behoben | **hält** | Luma 0,0 vor dem Aufbau, Standard und Feld, Klasse `lagemonitor-start`. |
| R6-L4 Keine Nachtstufe, blaue Linien 2,44:1, „Hell" ein Tipp (P3) | behoben | **hält überwiegend** | Linien 6,64:1 (Gedimmt 3,74:1), Stufen Dunkel → Gedimmt → Hell, Hell zuletzt. Rest: Monitor folgt dem Nacht-Modus nicht von selbst, Stufe nicht gemerkt, Taste nennt nur die nächste Stufe (R7-L3). |
| R6-L5 Zusatzzeile der Ansicht-Wahl unter 4,5:1 (P3) | behoben | **hält** | `.modus-kurz` ≥ 5,00:1 in allen Modi (Nacht aktiv 5,00:1). |
| R6-L6 Fehlerzustand weißer Streifen, 14 px (P3) | behoben | **hält** | Taste 34,6 px bei 1080 p, transparent mit Monitorrahmen, Uhr läuft; auf dem Telefon 7,9 px (R7-L2). |

Nebenwirkungen der Runde-6-Änderungen: Die neuen Bewegungszeilen und die
Datenstand-Zeile des Lagemonitors sind gut lesbar und farbunabhängig, kosten
aber Höhe (R7-L1) und werden auf dem Telefon sehr klein (R7-L2). Fußleiste des
Assistenten, Warnleiste des Zwei-Fenster-Abgleichs, Geräteuhr-Rückfrage,
Papier-Abgleich, Offline-Zeile und der Deckel bei großer Schrift haben im
Nacht-Modus keine neuen Sichtmängel gezeigt. Neu in Runde 7: R7-L1 und R7-L2
(je P2), R7-L3 und R7-L4 (je P3). Zusammen: 0 × P0, 0 × P1, 2 × P2, 2 × P3.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Man erwartet, dass der Lagemonitor die gedämpfte
  Nachtstufe der App übernimmt und die Liste der Einheiten ohne Bedienung zeigt;
  beides muss man am Monitor selbst einstellen bzw. wegrollen (R7-L1, R7-L3).
- **Größtes Einsatzrisiko:** Am Fernseher im Fahrzeug fehlt bei mehreren
  Bewegungen in 15 Minuten die Liste der Einheiten im Bild (R7-L1).
- **Top-Priorität für die nächste Iteration:** Zeit-Zeile und Bewegungszeilen
  so setzen, dass die Einheitentabelle auf 1080 p, 768 p und 720 p
  vollständig im Bild bleibt (R7-L1).
