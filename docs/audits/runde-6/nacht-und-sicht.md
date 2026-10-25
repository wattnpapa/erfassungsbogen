# Audit „Nacht und Sicht“, Runde 6 (Dunkelheit, Blendung, Sonnenlicht, Farbcodierung)

Stand: 17.10.2026 · Prüfer: Rollenaudit `thw-night-visibility-reviewer` ·
Prüfgegenstand: Web-App einschließlich der Begleitseiten unter `public/` und
des neuen Lagemonitors (`src/app/lagemonitor-ui.tsx`, `lagemonitor.css`),
Produktionsbuild (`vite preview`, Port 4173), Commit 03a0011.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde. Geprüft habe ich zuerst ohne Kenntnis der Berichte von
Runde 5 und Runde 6; den Abgleich habe ich erst danach gemacht. Aufbau und Ton
des Runde-5-Berichts kannte ich, seine Befunde und den „Stand der Behebung“
habe ich erst nach den Messungen gelesen. Die anderen Runde-6-Berichte habe
ich erst nach dem Abgleich angesehen; was dort schon steht, ist als Verweis
genannt.

## Prüfaufbau

Produktionsbuild über `vite preview` (http://localhost:4173), Playwright aus
`node_modules` mit Chromium aus `/opt/pw-browsers/chromium`, Locale de-DE, je
Messung ein eigener Browser-Kontext, weil elf weitere Prüfer denselben Server
nutzen. Telefon 360 × 640 bei Pixelverhältnis 2 mit `isMobile`/`hasTouch`; der
Lagemonitor zusätzlich auf 1920 × 1080 (ohne Touch) und zum Vergleich auf
360 × 640. Geprüft in allen vier Modi (Standard, Feld, Dunkel, Nacht) und mit
Systemeinstellung „dunkel“ ohne gespeicherte Wahl.

Zustände über `localStorage`-Seeds (`uebung: false`, `stand` auf heute):

- THW: Entwurf FGr Öl (C) Weinsberg (`examples/thw/014-…`), Einsatz-Sammlung
  „Hochwasser Neckar“ mit sieben Meldungen aus `examples/thw/` (eine
  abgerückt, eine mit gültiger, eine mit ungültiger Signatur, mehrere mit
  Ruhezeit, „Anderer Einsatz?“ und „Zeitraum vorbei“), eine ruhende
  Übungssammlung (70 Tage), eine Vorlage. Für den Lagemonitor zusätzlich
  `eeb.lagebeginn.v1` (Beginn vor 5 h 23 min) bzw. ohne Beginn.
- Kennfarbe des Kopfbalkens: je ein Entwurf für THW (`examples/thw`), DRK
  (`examples/drk/seg-sanitaet`), DLRG
  (`examples/dlrg/wrz-mittelbaden-bootsgruppe`), Feuerwehr
  (`examples/feuerwehr/niedersachsen/gruppe-sudheim`), ASB
  (`examples/asb/einsatzeinheit-sanitaetsgruppe`), Bundeswehr
  (`examples/bundeswehr/panzerpionierzug`) sowie Polizei, Rettungsdienst,
  Malteser und Johanniter (Bogen aus `examples/thw` bzw. `examples/drk`,
  Organisation im Seed umgestellt), je in allen fünf Zuständen (50 Läufe).

Durchlaufen: Startseite (vier Bildlagen), Assistent Schritt 1–5,
Gesamtübersicht, Einsatzansicht (Kopf, Kartenliste, Tabelle, Ende der Seite,
Ansicht-Wahl der festen Leiste), Block „Lagemonitor für den Fernseher“ in
vier Modi, Lagemonitor (Standard, Feld, Dunkel, Nacht, System-dunkel; zu- und
aufgeklappt; „Hell“; Einsatz ohne Beginn; Einsatz nicht vorhanden; Kaltstart
mit um 2,5 s verzögertem Bundle), alle zwölf Moduswechsel über die feste
Leiste im Assistenten und in der Einsatzansicht, Blanko-Vordruck von
Einsatzansicht und Startseite, Anleitung mit Aufnahmen in fünf Zuständen,
alle 36 Begleitseiten unter `public/` in fünf Zuständen (180 Aufrufe).

Kontraste sind **gerechnet**: für jeden sichtbaren Textknoten Schriftfarbe
gegen die tatsächlich darunterliegende Fläche (Deckkraft der Vorfahren
eingerechnet), WCAG-Formel, Schwelle 4,5:1 bzw. 3:1 für große Schrift. Die
Farben des Lagemonitors habe ich aus dem Stylesheet gerechnet. Blendung als
mittlerer Luma-Wert (sRGB, 0–255) und Anteil heller Bildpunkte (Luma > 200) je
Bildschirmfoto. Graustufen als Bildfilter auf Bildschirmfotos der
Einsatzansicht. Bildschirmfotos habe ich angesehen, nicht nur gerechnet.

**Nicht prüfbar:** echtes Licht (Sonne, Arbeitsscheinwerfer, Rotlicht),
tatsächliche Displayhelligkeit und Kontrastverhältnis eines Fernsehers im
Fahrzeug (Abstand, Spiegelung, Blickwinkel, Overscan), OLED-Schwarz,
WebKit/Safari, die native Android-/iOS-Fassung, Kamera-Scanner im Dunkeln,
Ausdruck auf Papier, Verhalten von `window.open` und „Vollbild“ auf einem
echten zweiten Bildschirm (im Headless-Browser nicht abbildbar), Wachhalten des
Bildschirms (`wakeLock`). Der eingebettete PDF-Betrachter und die geöffnete
PDF bleiben im Headless-Chromium leer bzw. werden heruntergeladen; wie sie auf
einem Telefon nachts aussehen, ist nicht beobachtet. Das Datumsfeld zeigt im
Testbrowser „mm/dd/yyyy“ (Oberflächensprache von Chromium, kein Befund der
App). Zeitmessungen liefen unter Last durch elf parallele Prüfer und sind
unsicher.

## Urteil

Die Runde-5-Behebungen halten. Die feste Leiste „◐ Ansicht: …“ der
Einsatzansicht ist jetzt über die volle Breite gelegt und deckt am Seitenende
nichts mehr ab (Leiste ab 583 px, letzter Inhalt endet davor). Der Feld-Kopf
ist für alle zehn Organisationen ≥ 7,02:1, die Speicherzeile bricht um, die
Aufnahmen der Anleitung sind nachts dunkel (Luma 38 statt 228), und der
Hinweis „PDFs sind für Papier gedacht – hell“ steht an beiden Stellen. Im
Nacht-Modus liegt kein aktiver Text unter 3,99:1 (die Zusatzzeile der
Ansicht-Wahl, R6-L5; sonst ≥ 4,48:1), im Dunkel-Modus keiner unter 5,68:1. Der Kaltstart der App ist dunkel.

Der neue Lagemonitor ist ein sinnvolles dunkles Großbild: reines Schwarz,
Weiß und Rot, große Zeit in Rot (5,25:1), mittlerer Luma-Wert 6,7 bei 1,6 %
hellen Bildpunkten, das ist für ein Fahrzeug nachts gut. Reibung gibt es
dort an fünf Stellen. Zwei Überschriften sind in den hellen Modi unsichtbar
(1,14:1, im Feld-Modus 1,0:1), die Einheitenliste ist zugeklappt und läuft
beim Aufklappen unten aus dem Bild, der Monitor beginnt in Standard und Feld
mit einem weißen Bildschirm, er folgt dem gewählten Anzeigemodus nicht, und
sein Fehlerzustand ist ein weißer Streifen mit 14-px-Schrift. In der App
selbst bleibt nur eine Zusatzzeile unter der Ansicht-Wahl knapp unter der
Schwelle.

Die Aufgabe gelingt bei Nacht und in der Sonne ohne fremde Hilfe: Bogen
erfassen, am Meldekopf sammeln, Lage auf dem Fernseher zeigen, Blanko-Vordruck
ziehen.

## Befunde

Keine P0- und keine P1-Befunde. Zwei P2-Befunde, vier P3-Befunde.

### R6-L1 [P2] Lagemonitor: Überschriften „Züge“ und „Zuletzt gemeldet“ in Standard und Feld praktisch unsichtbar (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Lagemonitor, aufgeklappter Abschnitt „Einheiten“,
`.lm-klapp h2`. Code: `src/app/lagemonitor.css` (setzt Text- und Grundfarbe
nur auf `main.lm`; die `h2`-Regel der App in `index.html` überschreibt die
Farbe der Überschrift).

**Beobachtung:** Der Monitor malt immer schwarzen Grund und weiße Schrift, die
Überschriften der beiden Spalten bekommen aber die Überschriftenfarbe des
gewählten App-Modus. Gerechnet (1920 × 1080, Schrift 38 px):

| Modus | „Züge“ / „Zuletzt gemeldet“ auf #000 | Ergebnis |
| --- | --- | --- |
| Standard | #11141b, 1,14:1 | auf dem Bildschirmfoto nur als Schatten erkennbar |
| Feld | schwarz, 1,0:1 | unsichtbar |
| Dunkel, Nacht, System-dunkel | 13–17:1 | gut |
| „Hell“ (Schalter im Monitor) | dunkel auf Weiß | gut |

Standard ist der Modus, mit dem die App ohne gespeicherte Wahl bei hellem
System startet; wer den Monitor am Meldekopf öffnet, ohne vorher auf Dunkel
gestellt zu haben, sieht die Tabelle ohne Überschrift. Die Spaltenköpfe
(„Zug / Verband“, „Einh.“, „Stärke“, „Fzg.“) bleiben lesbar, die Tabelle ist
also noch zu deuten; die rechte Spalte (Meldungen mit „vor 3 Min“) hat dann gar
keine Überschrift.

**Erwartung der Rolle:** Der Fernseher zeigt dieselbe Lage, egal in welchem
Modus das Arbeitsgerät steht.

**Auswirkung im Einsatz:** Gering bis mittel. Die Zahlen sind da, aber die
Zuordnung („Zuletzt gemeldet“ = Eingangsliste) fehlt dem, der den Monitor nicht
kennt. Es fällt im Fahrzeug nicht auf, weil der Fehler nur der Schrift fehlt.

**Empfehlung:** Die Überschriften im Monitor auf die Farbe des Monitors
setzen, unabhängig vom App-Modus.

**Nachprüfung:** Lagemonitor, Einheiten aufgeklappt, in allen vier Modi und
mit „Hell“: Überschriften ≥ 7:1 gegen den Monitorgrund.

### R6-L2 [P2] Lagemonitor: Einheitenliste standardmäßig zugeklappt, aufgeklappt läuft sie unten aus dem Bild (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet und gemessen (Seitenhöhe).

**Fundstelle / Aufgabe:** Lagemonitor, `<details class="lm-klapp">`
„Einheiten“, „Einsatzdaten“, „Optionen“. Code: `src/app/lagemonitor-ui.tsx`,
`src/app/lagemonitor.css` (`min-height: 100vh`, die Zeit-Zeile wächst nur).

**Beobachtung:** Beim Öffnen sieht der Fernseher nur Name, Ort, Zeit, Stärke
und Dauer; „Einheiten“, „Einsatzdaten“ und „Optionen“ sind drei geschlossene
Zeilen in 34 px Schrift am unteren Rand. Wer wissen will, welche Einheit
zuletzt gemeldet hat, muss mit Maus oder Touch an den Fernseher. Klappt man
„Einheiten“ auf, wächst die Seite auf 1 496 px bei 1 080 px Bildhöhe: Die
Zeit-Zeile bleibt 243 px hoch, im Bild stehen nur die ersten drei Meldungen
der Liste „Zuletzt gemeldet“; die Meldungen 4–6 sowie „Einsatzdaten“ und
„Optionen“ liegen unter dem Bildrand und verlangen Scrollen. Auf dem Fernseher gibt es nicht mehr als „Vollbild“
(Taste im Monitor); ein Scrollrad steht dort selten bereit. Die Liste ist auf die letzten
sechs Meldungen gekürzt (`LETZTE_MELDUNGEN = 6`); bei mehr Einheiten steht kein
„+ n weitere“ da.

**Erwartung der Rolle:** Das Großbild zeigt auf einen Blick, wer gemeldet hat,
ohne dass jemand daran klickt; in einem Fahrzeug hat niemand die Maus am
Fernseher.

**Auswirkung im Einsatz:** Der Monitor ist für das Gesamtbild brauchbar (Zeit,
Stärke, Dauer), die eigentliche Lage „wer ist da, wer fehlt“ ist am Fernseher
nicht ablesbar, ohne den Rechner zu bedienen. Nachts verschärft: Wer im
Fahrzeug das Notebook zum Aufklappen holen muss, schaltet Licht an.

**Empfehlung:** Einheiten- und Meldungsliste als feste, immer sichtbare
Fläche unter der Zeit (die Zeit darf dafür kleiner werden), die Höhe auf das
Bild begrenzen und, wenn mehr Einträge da sind, eine Zeile „+ n weitere“
zeigen. Die Optionen (Hell, Vollbild, Schließen) dürfen eingeklappt bleiben.

**Nachprüfung:** 1920 × 1080, sieben Meldungen: Zeit, Stärke und Liste ohne
Bedienung vollständig im Bild, Seitenhöhe = Bildhöhe.

### R6-L3 [P3] Lagemonitor in Standard und Feld: erst weißer Bildschirm, dann Schwarz (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (mit künstlich um 2,5 s verzögertem Bundle).

**Fundstelle / Aufgabe:** Aufruf `?lagemonitor=<Kennung>`. Code:
`index.html` (Boot-Skript setzt die Grundfarbe nach dem Modus, kennt den
Monitor nicht), `src/app/lagemonitor.css` (`body:has(main.lm) { background: #000 }`
greift erst nach dem Aufbau).

**Beobachtung:** Bis die Anwendung geladen ist, steht die Seite im Grund des
App-Modus. Gemessen (1920 × 1080, Luma-Mittel vor dem Aufbau → danach):
Standard 228,8 → 7,1; Nacht 15,1 → 7,2. Die Startseite der App selbst bleibt in
Standard durchgehend hell (218,7), das ist dort erwartbar.

**Erwartung der Rolle:** Der Monitor beginnt schwarz.

**Auswirkung im Einsatz:** Gering. Beim Wechsel auf den Fernseher oder nach einem
Neuladen (z. B. nach Wiederaufnahme des Rechners) steht für die Dauer des
Ladens eine weiße Vollfläche im dunklen Fahrzeug; das Bundle kommt aus dem
Cache, die Zeit ist kurz, auf einem schwachen Gerät länger.

**Empfehlung:** Dem Boot-Skript die Adresse `?lagemonitor=` mitgeben, damit der
Grund vor dem ersten Malen schwarz ist.

**Nachprüfung:** `?lagemonitor=<Kennung>` in Standard und Feld mit gebremstem
Bundle: Luma-Mittel vor dem Aufbau < 30.

### R6-L4 [P3] Lagemonitor: keine Nachtstufe, blaue Linien nur 2,44:1, „Hell“ ein Tipp bis zur Vollblendung (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Linien, Helligkeit), Risiko (Wirkung am Fernseher).

**Fundstelle / Aufgabe:** Lagemonitor, Optionen und Rahmen. Code:
`src/app/lagemonitor.css` (`--lm-grund: #000`, `--lm-text: #fff`,
`--lm-rahmen: #0000ff`), `src/app/lagemonitor-ui.tsx` (Zustand `hell`).

**Beobachtung:**

- Der Monitor hat eine eigene Farbwelt und ignoriert den Anzeigemodus: in
  Nacht, Dunkel und Standard gleich Weiß #fff auf Schwarz #000 (Luma-Mittel
  6,7 bis 6,8). Eine gedimmte, warme Stufe wie „Nacht“ gibt es nicht. Reines
  Weiß auf reinem Schwarz hat den größten möglichen Kontrast und blendet auf
  einem Fernseher bei Dunkeladaption stärker als der gedimmte Text der App
  (Nacht: Schrift #d9cdb6); gemessen am Bild ist die Fläche klein (1,6 % helle
  Bildpunkte), das Risiko liegt bei großen Zeichen wie der Zahl „65“.
- Die Rahmen (3 px) und Tabellenlinien (1 px) sind #0000ff auf #000: 2,44:1.
  Blau ist für das Auge bei Dunkelheit schwach auflösbar; die Linien tragen
  die Gliederung der Zeilen, ihre Dünnheit (1 px in der Tabelle) macht sie
  auf einem Fernseher in der Entfernung schlecht erkennbar. Text steht nicht
  auf den Linien, die Lesbarkeit der Zahlen ist nicht betroffen.
- „Hell“ steht als erste Taste in den Optionen, ein Tipp schaltet ohne
  Rückfrage auf weißen Grund (Luma-Mittel 241, 94 % helle Bildpunkte). Nach
  dem Neuladen ist der Monitor wieder dunkel (die Wahl wird nicht gespeichert,
  das ist nachts günstig). Die drei Tasten der Optionen sind reinweiße Blöcke
  auf Schwarz (#fff, 93–191 × 58 px bei 1920 × 1080) und damit die hellsten
  Flächen des dunklen Bildes.

**Erwartung der Rolle:** Der Fernseher im Fahrzeug nachts ist gedimmt, die
Wahl „Hell“ ist ein bewusster Schritt.

**Auswirkung im Einsatz:** Gering. Die Schrift ist groß und kontrastreich, ein
versehentliches „Hell“ blendet für Sekunden, das Zurückschalten ist ein
weiterer Tipp.

**Empfehlung:** Den Anzeigemodus „Nacht“ auch für den Monitor gelten lassen
(gedämpftes Weiß/Rot, Linien in einem helleren Ton), die Linien heller als
2,44:1, „Hell“ an das Ende der Optionen und weniger leuchtend setzen.

**Nachprüfung:** Monitor in Nacht: Luma-Mittel und Spitzenwert niedriger als in
Standard; Linien ≥ 3:1; „Hell“ nach zwei Tipps oder mit Rückfrage.

### R6-L5 [P3] Ansicht-Wahl: Zusatzzeile „normal / große Tasten / abends / gedimmt“ unter 4,5:1 (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht, Kopf, Ansicht-Wahl, `.modus-kurz`
(13 px). Stil in `index.html` (`.seiten-kopf.einsatz-kopf .anzeige-schalter .modus-kurz`).

**Beobachtung:** Die vier Zusatzzeilen sind 13 px groß, `aria-hidden`, und
liegen unter der Schwelle:

| Modus | Zeile | Wert |
| --- | --- | --- |
| Standard | „abends“, „gedimmt“, „große Tasten“ (#5c6478 auf Weiß) | 3,79:1 |
| Nacht | „gedimmt“ auf dem aktiven Bernsteinfeld (#100d07 auf #a8791a) | 3,99:1 |
| Nacht | „normal“, „große Tasten“, „abends“ (#a2977e auf #17150f) | 4,48:1 |
| Dunkel, Feld | | ≥ 5,68:1 |

Es ist ausgerechnet der Nacht-Modus, in dem die Zeile des aktiven Modus am
schwächsten ist. Die Hauptwörter („Standard“, „Feld“, …) stehen davon nicht
betroffen.

**Erwartung der Rolle:** Auch die Zusatzzeile, die einem Fremden sagt, was
„Feld“ ist, ist gut zu lesen.

**Auswirkung im Einsatz:** Gering; wer die Namen kennt, braucht die Zeile
nicht. Wer „Feld“ nicht kennt, liest „große Tasten“ im Dunkeln schwer.

**Empfehlung:** Die Zusatzzeile in der Textfarbe des Knopfs ohne Abdunkelung
setzen (≥ 4,5:1 auch auf dem aktiven Feld).

**Nachprüfung:** Einsatzansicht, alle vier Modi: alle `.modus-kurz` ≥ 4,5:1.

### R6-L6 [P3] Lagemonitor: Fehlerzustand „Einsatz nicht vorhanden“ als weißer Streifen mit 14-px-Schrift, ohne Uhr (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen und beobachtet.

**Fundstelle / Aufgabe:** Lagemonitor mit unbekannter oder gelöschter
Kennung (`main.lm-leer`). Code: `src/app/lagemonitor-ui.tsx`.

**Beobachtung:** Wird der Einsatz auf dem Gerät gelöscht, während der Monitor
läuft (oder ist die Kennung falsch), zeigt der Monitor einen großen Satz
(„Dieser Einsatz ist auf diesem Gerät nicht (mehr) vorhanden.“) und darunter
einen weißen Vollbreiten-Streifen von 1 824 × 44 px mit „Schließen“ in 14 px
(Standardschrift der App, nicht die Schriftgröße des Monitors). Auf einem
1080-p-Fernseher ist das die hellste Fläche des Bildes und von weitem
unlesbar; die Zeit fehlt in diesem Zustand, ebenso ein Hinweis, was zu tun
ist.

**Erwartung der Rolle:** Der Fehlerzustand ist so groß und so gedimmt wie der
Rest des Monitors.

**Auswirkung im Einsatz:** Gering. Der Fall ist selten (Einsatz gelöscht oder
Browser-Daten geleert), dann aber ein leeres Bild auf dem Fernseher mit
einem grellen Balken.

**Empfehlung:** „Schließen“ in der Schriftgröße der Optionen und in der
Farbe des Monitors; die Uhr weiter zeigen.

**Nachprüfung:** `?lagemonitor=gibtsnicht`, 1920 × 1080: Taste ≥ 34 px Schrift,
kein weißer Vollstreifen.

## Verweise auf andere Berichte

- „Bedarf:“ bricht in der Kopfzeile der Einsatzansicht mitten im Wort („Bed |
  arf:“, im Feld-Modus „Be | dar | f:“). Beobachtet bei 360 und 412 px in allen
  vier Modi, Ursache: `summary` der Karte `.bedarf-block` ist
  `display: flex`, Beschriftung und Text sind getrennte Flex-Kinder. Steht
  bereits in [neuer-nutzer.md](neuer-nutzer.md); hier nur der Sichtbezug: Die
  Beschriftung ist in allen Modi zerrissen, nicht nur nachts.
- Ansicht-Wahl bei 200 % Schrift, Zusatzzeile groß und abgeschnitten
  (Randnotiz in [mobile-ui.md](mobile-ui.md)).

## Bestätigtes

- **Feste Leiste „Ansicht: …“:** 57 px hoch (Feld 62 px), volle Breite, am
  Seitenende beginnt sie bei 583 px und deckt keinen Text ab; der Wahlkasten
  öffnet sich darüber. Standard, Feld, Dunkel, Nacht.
- **Moduswechsel:** alle zwölf Wechsel in Assistent (Schritt 3, `scrollY` 700)
  und Einsatzansicht: ±3 px, Wechsel in den Feld-Modus hinein 18 bis 28 px
  nach oben (Schrift wächst), Wechsel aus Feld heraus 0 px.
- **Kopf der Kennfarben:** zehn Organisationen × fünf Zustände (50 Läufe, ohne
  deaktivierten „← Zurück“ in Schritt 1): kein Text unter 4,5:1. Feld-Kopf:
  DRK #b1050f 7,25:1, Feuerwehr #b00e29 7,14:1, DLRG #734f00 7,38:1, ASB
  #944000 7,02:1, Bundeswehr 7,04:1, THW/Polizei #20214f 9,66:1. Dunkel-Kopf
  ≥ 6,38:1, Nacht-Kopf überall #221f16.
- **Speicherzeile:** „✓ gespeichert · 11:09 Uhr · nur auf diesem Gerät“ bricht in
  allen Modi sauber um, nichts abgeschnitten.
- **Anleitung:** Aufnahmen mit `brightness(0.4)` in Nacht, Dunkel und
  System-dunkel (Luma-Mittel der Seite 38 bis 45, Standard 228, Feld 217); die
  Handscanner-Codes (weiß, 158 px) bleiben bewusst ungefiltert. Kein Text
  unter 4,5:1.
- **Hinweis zum PDF:** „Die PDFs sind für Papier gedacht — hell, auch in der
  Ansicht „Nacht“.“ unter den Ausgabeknöpfen der Einsatzansicht und „Das PDF
  ist für Papier gedacht, hell.“ in der Fußzeile; Kontrast in allen Modi
  ≥ 4,5:1.
- **Blanko-Vordruck:** Knopf zeigt nach unter 0,4 s „wird erzeugt…“
  (`aria-busy`, gesperrt), die Zeile „Der Blanko-Vordruck wird erzeugt …“ steht
  bei 274 px im Bild, danach „✓ … erzeugt (2 Seiten A4 …)“. Von der Startseite
  zeigt nur der Knopf den Zustand (siehe Abgleich).
- **Hinweis-Marken** („neu“, „⚠ Anderer Einsatz?“, „Zeitraum vorbei“, „●
  Ruhezeit“, „ABGERÜCKT“): jede trägt Wort oder Zeichen; in Graustufen sind sie
  an Umriss und Text trennbar; Kontrast in allen Modi ≥ 4,5:1.
- **Block „Lagemonitor für den Fernseher“** in der Einsatzansicht: alle Texte
  ≥ 4,5:1 in vier Modi; das Datumsfeld folgt in Dunkel und Nacht dem dunklen
  Schema (`color-scheme: dark`), die Knöpfe „Jetzt“ und „Lagemonitor öffnen“
  sind in Nacht bernsteinfarben, nicht weiß.
- **Lagemonitor-Zahlen:** rote Zeit #ff0000 auf #000 5,25:1 bei 14 vh,
  Weiß auf Schwarz 21:1; „Hell“: #cc0000 auf Weiß 5,89:1, Rahmen #0000cc
  11,2:1. Zustände in Worten („Einsatzbeginn nicht gesetzt“, „Einsatz beginnt
  noch“), nicht in Farbe; die Meldungsliste hebt „neu“ durch Fettdruck, nicht
  durch Farbe, hervor. Luma-Mittel Monitor 6,7 bis 6,8 bei 1,6 bis 2,9 %
  hellen Bildpunkten, auf 360 × 640 4,5 bis 4,6.
- **Kaltstart der App:** dunkel bei Nacht, Dunkel und System-dunkel (siehe
  R5), im Lagemonitor siehe R6-L3.
- **Helligkeit der App:** Luma-Mittel je Bildlage Nacht 19 bis 44,
  Dunkel 25 bis 55, Standard 170 bis 242, Feld 159 bis 236.
- **Begleitseiten:** 36 Seiten × 5 Zustände (180 Aufrufe), kein Fehler beim
  Laden, kein Text unter 4,5:1 (3:1 bei großer Schrift). Luma-Mittel Nacht
  26 bis 41, Dunkel 34 bis 48, System-dunkel 34 bis 48, Feld 207 bis 226,
  Standard 211 bis 236; Anteil heller Bildpunkte nachts 1,7 bis 6,1 %, Dunkel
  2,8 bis 7,5 %. Alle Fotos und Aufnahmen tragen in den dunklen Zuständen
  `brightness(0.4)`; ungefiltert bleiben nur die drei Handscanner-Codes der
  Anleitung (176 px, bewusst).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der Lagemonitor sieht in allen Modi gleich aus,
  man erwartet aber, dass der Fernseher dem gewählten (dunklen) Modus folgt
  und die Liste der Einheiten zeigt, ohne dass jemand klickt (R6-L2, R6-L4).
- **Größtes Einsatzrisiko:** Am Fernseher im Fahrzeug fehlt ohne Bedienung die
  Liste der gemeldeten Einheiten, und die Überschriften der Liste sind in
  Standard und Feld unsichtbar (R6-L1, R6-L2).
- **Top-Priorität für die nächste Iteration:** Den Lagemonitor in der
  Farbe unabhängig vom App-Modus machen (Überschriften) und Einheiten- und
  Meldungsliste dauerhaft ins Bild legen (R6-L1, R6-L2).

## Abgleich mit Runde 5

Grundlage: [../runde-5/nacht-und-sicht.md](../runde-5/nacht-und-sicht.md) samt
„Stand der Behebung“ und [../runde-5/README.md](../runde-5/README.md).

| Runde-5-Befund | Stand laut Bericht | Bewertung Runde 6 | Messwert / Beobachtung |
| --- | --- | --- | --- |
| R5-L1 Fester „◐“ liegt über Text und Marken (P2) | behoben | **hält** | Feste Leiste voll breit (57 px, Feld 62 px), Text „Ansicht: …“; am Seitenende endet der Inhalt vor der Leiste (583 px), nichts verdeckt; Wahlkasten öffnet darüber. Kosten 57 px am unteren Rand, wie angegeben. |
| R5-L2 Feld: Speicherzeile abgeschnitten (P3) | behoben | **hält** | Zeile zweizeilig, in allen Modi vollständig. |
| R5-L3 Feld: Kopf in voller Kennfarbe, 4,5–4,6:1 (P3) | behoben | **hält** | Feld-Kopf 7,02 bis 8,21:1 (DRK #b1050f 7,25:1, DLRG #734f00 7,38:1, ASB #944000 7,02:1), THW 9,66:1. Nebenwirkung: Der Feld-Kopf hat einen dunkleren Ton als der Standard-Kopf derselben Organisation (DRK #b1050f statt #e30613), der Knopf „Weiter“ bleibt in der hellen Kennfarbe (DRK 4,88:1); kein Mangel. |
| R5-L4 Blanko-Vordruck ohne Rückmeldung, Bestätigung weit weg (P3) | im Stand der Behebung dieses Berichts nicht aufgeführt | **hält überwiegend** | Einsatzansicht: nach unter 0,4 s „wird erzeugt…“, gesperrt, Zeile bei 274 px im Bild, Bestätigung an derselben Stelle. Startseite: nur der Knopf wechselt die Beschriftung; eine Bestätigungszeile gibt es dort weiter nicht (Rest). |
| R5-L5 PDFs weiß, kein Hinweis (P3) | behoben (Hinweis) | **hält** | Hinweis an beiden Stellen vorhanden, Kontrast ≥ 4,5:1; die PDFs bleiben weiß, die Vorschau im Headless-Browser nicht beobachtbar. |
| R5-L6 Anleitung: Aufnahmen hell (P3) | behoben (0,4) | **hält** | `brightness(0.4)`, Seite Luma 38 (Nacht), 45 (Dunkel) statt 228; Codes ungefiltert, bewusst. |
| R5-L7 Moduswechsel springt aus Feld um 44–49 px (P3) | nicht mehr reproduzierbar | **hält** | Aus Feld heraus 0 px, in alle anderen ±3 px; in den Feld-Modus hinein 18–28 px (Schriftgröße ändert sich, die Sonde ist ein hohes Element). Die Grenze 40 px aus R5 ist eingehalten. |

Keine Behebung hat sich ins Gegenteil verkehrt. Alle sieben Runde-5-Befunde
halten; bei R5-L4 bleibt auf der Startseite eine fehlende Bestätigungszeile
(kein neuer Befund). Neu in Runde 6: R6-L1 und R6-L2 (je P2), R6-L3 bis R6-L6
(je P3), alle an dem neuen Lagemonitor bzw. an einer Zusatzzeile der
Ansicht-Wahl. Zusammen: 0 × P0, 0 × P1, 2 × P2, 4 × P3.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 5 behoben, 1 teilweise, 0 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-L1 | behoben | Beschriftungen und Überschriften des Lagemonitors nehmen die Monitorfarbe. Der Monitor wurde nach der Prüfung von anderer Seite umgebaut (Einheitentabelle); die Überschriften „Züge“ und „Zuletzt gemeldet“ gibt es nicht mehr. |
| R6-L2 | teilweise | Die Einheitentabelle ist standardmäßig offen und auf 38 % der Bildhöhe begrenzt (rollt in sich); „+ n weitere“ fehlt. |
| R6-L3 | behoben | Das Boot-Skript setzt bei `?lagemonitor=` die Klasse `lagemonitor-start`; Grund und Seite sind von Anfang an schwarz (Stilregel-Test). |
| R6-L4 | behoben | Linien 6:1 statt 2,44:1, Stufen Dunkel → Gedimmt → Hell (Hell zuletzt). |
| R6-L5 | behoben | Die Zusatzzeile im Kopf der Einsatzansicht hat keine Abdunkelung mehr; im Assistenten und in der Einsatzansicht gemessen ≥ 5,9:1 (Standard, Dunkel, Feld, Nacht). |
| R6-L6 | behoben | Fehlerzustand mit Uhr und Taste in Monitorschrift statt weißem Streifen. |
