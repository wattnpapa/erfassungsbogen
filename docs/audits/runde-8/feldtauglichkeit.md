# Audit „Helfer im Feld“, Runde 8 (Feldtauglichkeit)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-7-Befunde
([../runde-7/feldtauglichkeit.md](../runde-7/feldtauglichkeit.md) und
[../runde-7/README.md → Stand der Behebung](../runde-7/README.md#stand-der-behebung-24102026)).
Runde 7 änderte u. a. Lagemonitor, Zwei-Fenster-Leiste und Rückfragen, den
Geräteuhr-Halt samt Hinweis im Assistenten, das Beiseitelegen unlesbarer Daten,
die „Nur Stärke“-Rückfrage, die Kurz-Liste ab 8 Personen, die Musterung als
Verlaufsansicht und das Layout bei großer Schrift und Zoom; der Bericht prüft
sie auf Wirkung und Nebenwirkung im Helferweg.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Jeder Lauf in einem
eigenen Browser-Kontext mit frischem Speicher, weil elf weitere Prüfer
denselben Server nutzten; der Server wurde weder neu gebaut noch angefasst.
**Zeitangaben sind unter Last gemessen und nur grob.** Grundeinstellung Telefon
360 × 640 px, dazu 320 × 568, quer 640 × 360, 560 × 360 und 844 × 390, Tablet
820 × 1180. Browser-Zoom über halbierte CSS-Pixel nachgestellt (150 % =
240 × 427, 200 % = 180 × 320), große Schrift über `html { font-size: 200% }`,
dazu der Feld-Modus (`eeb.anzeigemodus.v1` = `feld`). Bedient wurde mit
`tap()`, Wartezeiten zwischen Tipps 150 ms bis 2,5 s (die Tipp-Sperre liegt bei
1,5 s).

Zustände kamen über `localStorage`-Seeds mit `uebung: false` und `stand` auf
heute: Entwurf (`eeb.entwurf.v1`) aus `examples/thw/` (Bergungsgruppe Ulm mit
8 Personen, Zugtrupp Albstadt, Großbogen „Verstärkter Bergungszug“ Oldenburg mit
38 Personen und 7 QR-Teilen), Vorlage (`eeb.vorlagen.v1`), Einsatz-Sammlung mit
sechs THW-Bögen (`eeb.einsaetze.v1`), Uhrstand (`eeb.uhr.v1`) 100 Tage zurück
bei einer 100 Tage alten Sammlung sowie absichtlich abgeschnittene
Speicherinhalte. Dass die Beispielbögen einen vergangenen Einsatzzeitraum tragen
(„Zeitraum vorbei“, „Anderer Einsatz?“, „gilt er noch?“), ist Seed-Wirkung und
kein Befund. Skripte und Bilder liegen im Scratchpad unter `runde8/h/`.

Reihenfolge: Zuerst blind geprüft, ohne die Berichte unter `docs/audits/`
gelesen zu haben — Startseite (leer, mit Entwurf, mit Sammlung), „Neuen Bogen
erstellen“ mit Einheitstyp-Eingabe bis zur Übersicht, Schritte 2 bis 5 im
Feld-Modus, „Bogen übergeben…“ und QR-Vollbild (hoch, quer, 200 % Schrift),
Einsatz-Sammlung als Karten und Tabelle, „Einheit schnell erfassen“,
Zurück-Verlauf im Assistenten, „Verwerfen“ des Entwurfs. Danach habe ich den
Runde-7-Bericht meiner Rolle und den Stand der Behebung gelesen und die neun
Befunde H1 bis H9 einzeln nachgemessen sowie die übrigen Runde-7-Änderungen auf
Nebenwirkungen geprüft. Befunde anderer Runde-8-Berichte kenne ich nicht.

Rolle: Helfer einer Bergungsgruppe, praktisch erfahren, bedient die App selten,
steht mit dem Telefon in einer Hand am Fahrzeug oder am Meldekopf und wird
zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Neuen Bogen anlegen:** Startseite → „Neuen Bogen erstellen“ → Einheitstyp
   tippen und wählen → Name → Schritte 2 bis 6. Abgeschlossen: **ja** (die
   Warnungen je Schritt nennen, was fehlt: „Ort/Auftrag ist noch leer“,
   „7 Personenkarten ohne Angaben …“, „Fahrzeug 1 hat noch kein Kennzeichen“).
2. **Angefangenen Bogen finden und übergeben:** Startseite → „Fortsetzen“ →
   „Bogen übergeben…“ → „QR-Code im Vollbild zeigen“, auch der Großbogen mit
   sieben Teilen und der zweite Tipp nach 150 ms. Abgeschlossen: **ja**.
3. **Unterbrechung und Zurück:** Zurück-Geste im Assistenten (Schritt 4 → 3 → 2 →
   Übersicht → Startseite), in der Musterung, „Verwerfen“. Abgeschlossen: **ja**.
4. **Meldekopf:** Sammlung öffnen, Karten und Tabelle, „Einheit schnell
   erfassen“, Lagemonitor am Telefon. Abgeschlossen: **ja, mit Schwierigkeit**
   (R8-H3).
5. **Sicht und Schrift:** Startseite, Assistent, Rückfragen und Musterung bei
   200 % Schrift, Zoom 150 % und 200 %, hoch und quer. Abgeschlossen: **ja**.
6. **Zwei Fenster und Geräteuhr:** zwei Seiten im selben Kontext;
   Uhr 100 Tage zurück mit alter Sammlung; Hinweis im Assistenten.
   Abgeschlossen: **ja**.
7. **Beschädigter Speicher:** abgeschnittener Entwurf, abgeschnittene Sammlung,
   abgeschnittene Vorlage. Abgeschlossen: **mit Schwierigkeit** (R8-H1).

**Nicht prüfbar** und deshalb *nicht geprüft*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am echten Display, Kamera-Scan (auch ob
sieben Teile am echten Gerät mit der 1,5-s-Mindestzeit sicher lesen), die
Zurück-Geste der installierten PWA (hier nur `history.back()`; die späte
Rückkehr eines eigenen `back()` ließ sich ohne Gerät nicht nachstellen),
Bildschirmtastatur und ihr Einfluss auf die untere Leiste, native Datums- und
Auswahllisten (die Datumsfelder zeigten im Prüfbrowser „07/18/2026“; auf einem
deutschen Gerät ist das Format offen), WebKit/Safari, native Builds, echtes
Drucken, Wake-Lock, Funkloch-Verhalten der Themenseiten.

## Urteil

Der Kernweg trägt, und die Runde-7-Behebungen meiner Rolle halten alle: Die
Entwurfskarte steht auch bei 200 % Schrift quer und am Tablet im Bild
(„Fortsetzen“ bei 246 px statt 1 457 px, R7-H1), die Musterung führt per Zurück
auf die Startseite (R7-H2), die Zwei-Fenster-Leiste nennt jetzt, was sich
geändert hat („Personal (2 Einträge)“, mit „Genauer“), die Pille „Einen Moment
…“ liegt quer an einer festen Stelle unter den Knöpfen (R7-H4), der
Sperrradius sperrt bei Zoom 150 % und 200 % den Nachbarreiter nicht mehr
(R7-H5), die Kurz-Liste ist ab 8 Personen Voreinstellung (R7-H6), die Kopfzeile
der Musterung klebt quer nicht mehr (R7-H7), und die Geräteuhr-Warnung ist bei
200 % Schrift statt 1 502 px nur noch 370 px hoch mit beiden Knöpfen im ersten
Bild (R7-H9). Nur der erste Hauptknopf quer mit Vorlage liegt weiter 3 px unter
der Bildkante (R7-H8, wie gemeldet „knapp“).

Neu und als einziges mit P2 gewertet: Ein **abgeschnittener** (syntaktisch
kaputter) Inhalt von `eeb.einsaetze.v1` wird beim Start ohne Hinweis zu `[]`
geschrieben; eine kaputte Vorlagenliste bleibt unsichtbar liegen. Das
Beiseitelegen aus Runde 7 (`eeb.unlesbar.v1`) greift nur bei gültigem JSON mit
unbrauchbaren Teilen, nicht beim abgebrochenen Text, den der Entwurf dagegen
erkennt (R8-H1). Sonst vier Kleinigkeiten (P3), darunter F/U/M-Spalten des
Lagemonitors außerhalb des Bildes am Telefon (R8-H3) und die Rückfrage „Nur
Stärke melden?“, deren Folgesatz bei 200 % Schrift fast ganz unter dem Rollrumpf
liegt (R8-H2). Kein P0, kein P1.

## Befunde

Zählung (ohne die Verweise unten): P0: 0 · P1: 0 · P2: 1 · P3: 4.

### R8-H1 [P2] Abgeschnittene Sammlung wird beim Start still zu „[]“; kaputte Vorlagenliste bleibt unsichtbar (neu, Lücke in R7-E1/E2/N3)

**Priorität:** P2

**Kennzeichnung:** gemessen (`localStorage` nach dem Laden; Seed: die
Sammlung mit sechs Meldungen auf 60 % der Zeichen gekürzt, Seite 2,5 s offen
gelassen). Wie oft ein Gerät so einen Text liefert, ist *Risiko* (nicht
geprüft; ein Abbruch beim Schreiben, voller Speicher oder eine Sicherung, die
halb zurückgespielt wurde).

**Fundstelle / Aufgabe:** Startseite beim Öffnen mit beschädigtem
`eeb.einsaetze.v1` bzw. `eeb.vorlagen.v1`. Code: `src/app/unlesbar.ts` (die
Funktion `parsen` liefert bei ungültigem JSON `null`; Beiseitelegen nur für
gültiges JSON mit unbrauchbaren Teilen), `src/app/einsaetze-lesen.ts`
(`unlesbaresRetten`).

**Beobachtung:**

- Sammlung: Vor dem Laden stand ein langer Text im Schlüssel, 2,5 s nach dem
  Öffnen steht dort `[]` (2 Zeichen). Auf der Startseite erscheint weder eine
  Sammlung noch ein Hinweis („Ein gespeicherter Bogen ließ sich nicht öffnen“
  o. ä.); `eeb.unlesbar.v1` und `eeb.einsaetze.v1.beschaedigt` gibt es nicht.
  Der ursprüngliche Text steht nirgends mehr. Gleiche Prüfung mit
  beschädigtem Entwurf: Die App zeigt die Karte „Ein gespeicherter Bogen ließ
  sich nicht öffnen“ mit „Als Datei sichern“ und legt den Text unter
  `eeb.entwurf.beschaedigt.v1` ab — so soll es sein.
- Vorlagen: Der abgeschnittene Text (9 015 Zeichen) bleibt unverändert im
  Speicher, die Startseite zeigt keine Vorlage und keinen Hinweis. Das nächste
  „Als Vorlage speichern“ überschreibt ihn (nach dem Code, nicht ausgeführt).

**Erwartung der Rolle:** Was die App nicht lesen kann, sagt sie an und hebt es
auf — so wie beim angefangenen Bogen. Eine Sammlung mit Einheiten und Zeiten
verschwindet nicht, ohne dass jemand es merkt.

**Reaktion des Helfers:** „Wo ist unser Einsatz? Gestern waren sechs Einheiten
drin.“ Er sucht, findet nichts, hält die App für zurückgesetzt. Eine
Rückholmöglichkeit sieht er nicht.

**Folge im Einsatz:** Beim Meldekopf geht die gesamte Sammlung (Zählung, Zeiten,
Historie) lautlos verloren; eine Vorlage („Mein Zug“) fehlt am Ausrückmorgen.
Der Papierabgleich und die Sicherung („Einsatz weitergeben / sichern“) sind der
Notweg, wenn sie vorher benutzt wurden. Selten, aber ohne Vorwarnung.

**Empfehlung:** Ungültigen Text vor dem ersten Schreiben unverändert
beiseitelegen (wie beim Entwurf), die Startseite sagt in einem Satz „Eine
Sammlung / Vorlage ließ sich nicht lesen — beiseitegelegt“ mit „Als Datei
sichern“.

**Nachprüfung:** `eeb.einsaetze.v1` und `eeb.vorlagen.v1` mit abgeschnittenem
JSON setzen, Seite öffnen: Hinweis steht da, der Rohtext ist unter einem
eigenen Schlüssel erhalten und als Datei zu sichern; der Hauptschlüssel wird
nicht stumm mit `[]` überschrieben.

Verweis: R7-Behebung E1, E2, N3 („Unlesbares behoben“, `eeb.unlesbar.v1`);
die Datenschutz- und Sicherungsseite des Berichts
[../runde-7/](../runde-7/) behandelt den gültigen-JSON-Fall.

### R8-H2 [P3] Rückfrage „Nur Stärke melden?“: Hauptknopf hat den Fokus; bei 200 % Schrift liegen nur Titel und zwei Zeilen im Bild (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (sichtbare Höhe des Rollrumpfs, aktives Element),
beobachtet (Bild `t_ns_kleinG.png`).

**Fundstelle / Aufgabe:** Schritt 3 „Personal“ mit 8 erfassten Personen →
Auswahl „Nur Stärke (Meldekopf-Schnellerfassung)“. Code: Rückfrage der
Schrittansicht Personal, gemeinsame Dialogbauart (R7-W1/E4).

**Beobachtung:** Die Rückfrage verhindert das versehentliche Umschalten und
nennt die Folge („8 erfasste Personen zählen dann nicht mehr einzeln — die
Stärke wird von Hand geführt und startet mit 0 / 2 / 6 / 8. Die Namen bleiben
als Erreichbarkeiten erhalten.“). Der Rumpf rollt, der Fuß mit „Nur Stärke
melden“ und „Abbrechen“ steht fest. Bei 320 × 568 mit 200 % Schrift sind vom
Rumpf 248 von 782 px sichtbar, quer 640 × 360 mit 200 % Schrift 152 von 341 px:
Im Bild stehen der Titel und zwei Zeilen („8 erfasste“ / „Personen zählen …“),
die Folge steht erst nach Rollen darunter, davor liegt als dunkler Hauptknopf
„Nur Stärke melden“. Als Rollhinweis dient ein Schattenverlauf. Bei normaler
Schrift (360 × 640, quer) liegt der Fokus nach dem Öffnen auf „Nur Stärke
melden“, nicht auf „Abbrechen“; bei großer Schrift liegt er auf dem Rumpf.

**Erwartung der Rolle:** Die Folge ist lesbar, bevor der dunkle Knopf erreichbar
wirkt; der vorbelegte Knopf ist der harmlose.

**Reaktion des Helfers:** Er liest „Nur die Stärke melden? 8 erfasste …“ und
tippt den dunklen Knopf, weil er die Frage für eine Bestätigung seiner
Auswahl hält.

**Folge im Einsatz:** Gering: Die Namen gehen nach dem Text nicht verloren, die
Auswahl lässt sich zurücknehmen; bei Tastatur oder Handscanner löst Enter auf
dem Hauptknopf die Folge aus.

**Empfehlung:** Bei großer Schrift den Titel aus dem Rollrumpf nehmen oder die
Folge in den Titel („8 Namen werden zur Stärke 0 / 2 / 6 / 8“) ziehen;
Anfangsfokus bei folgenreichen Rückfragen auf „Abbrechen“.

**Nachprüfung:** 320 × 568, 200 % Schrift, „Nur Stärke“ wählen: Der Folgesatz
steht vollständig im ersten Bild; Fokus auf „Abbrechen“.

Verweis: Den Rollrumpf und den festen Fuß an sich bestätigt
[../runde-7/](../runde-7/) (W1, E4) als behoben; hier geht es um seine
Sichtfläche bei großer Schrift.

### R8-H3 [P3] Lagemonitor am Telefon hochkant: F/U/M-Spalten liegen außerhalb des Bildes, kein Hinweis zum seitlichen Wischen (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (`getBoundingClientRect` der Kopfzellen; Bild
`z_lm_telefon.png`). Die Verwendung am Telefon ist laut Seite ein Ausweichweg
(*Annahme*).

**Fundstelle / Aufgabe:** Einsatz-Sammlung → „Lagemonitor öffnen“ → die Seite
`?lagemonitor=<id>` am Telefon. Code: Lagemonitor-Tabelle
(`src/app/lagemonitor.ts` und seine Stilregeln).

**Beobachtung:** Bei 360 × 640 und 320 × 568 ist die Tabelle 448 px breit in
einem Rahmen von 336 bzw. 298 px (horizontal rollbar, `overflow-x: auto`);
„F“, „U“, „M“ stehen bei x = 380 bis 460 px, also außerhalb des Bildes. Im Bild
bleiben Orga, Ort, Funkrufname und Einheitentyp, der Typ ist am rechten Rand
abgeschnitten („Materialwirtsc“, „Bergungsgrup“). Ein Hinweis, dass man die
Tabelle seitlich wischen kann, steht nicht da. Quer (640 × 360) passt die
Tabelle in den Rahmen (602 px). Die Gesamtzahl steht oben im Bild („1 / 15 / 43
// 59“), die Stärke je Einheit nicht.

**Erwartung der Rolle:** Auf dem Telefon sieht er je Einheit die Stärke (die
Zahl, um die es geht) vor dem Funkrufnamen oder bekommt einen Wisch-Hinweis.

**Reaktion des Helfers:** Er liest „Bergungsgrup“ am Rand, hält den Rest für
abgeschnitten und sucht die Zahlen nicht.

**Folge im Einsatz:** Gering; das Telefon ist nicht der vorgesehene
Anzeigeweg, die Summe steht oben. Wer die Stärke einer Einheit braucht, geht in
die Sammlung.

**Empfehlung:** Hochkant am Telefon F/U/M vor Funkrufnamen und Typ stellen oder
Typ unter den Ort umbrechen; sonst einen Satz „Tabelle seitlich wischen“.

**Nachprüfung:** 360 × 640: „F“, „U“, „M“ im Bild, keine abgeschnittene Zelle
ohne Hinweis.

Verweis: Die Telefondarstellung des Lagemonitors fiel in
[../runde-7/mobile-ui.md](../runde-7/mobile-ui.md) (R7-M6, Knöpfe und
Schrift) auf; die Lage der Spalten ist dort nicht genannt.

### R8-H4 [P3] Hinweis „Ein gespeicherter Bogen ließ sich nicht öffnen“: neun Zeilen, „Support-Stelle“, „beiseitegelegt“ (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640, Bild `s_unl.png`).

**Fundstelle / Aufgabe:** Startseite mit beschädigtem `eeb.entwurf.v1`. Code:
Hinweiskarte zum unlesbaren Entwurf (R7-E1).

**Beobachtung:** Unter der Überschrift stehen in fetter Schrift neun Zeilen:
„Ursache: der gespeicherte Text ist abgebrochen oder beschädigt. Er ist nicht
gelöscht, sondern beiseitegelegt — als Datei sichern. „Aus Datei laden…“ öffnet
sie nur, wenn die genannte Ursache nicht mehr zutrifft; fehlt eine Pflichtangabe,
nennt die App sie beim Einlesen — nachtragen lässt sie sich in der App nicht,
die Datei dient dann der Support-Stelle. Die App löscht ihn am 21.01.2027 von
selbst (90 Tage nach dem Beiseitelegen).“ Darunter „Als Datei sichern“ und
„Entfernen…“.

**Erwartung der Rolle:** Ein Satz, was passiert ist, und ein Knopf, was er
tun soll („Bogen sichern und dem OV-Admin geben“).

**Reaktion des Helfers:** Er liest bis „Ursache“ und tippt „Als Datei sichern“,
ohne zu wissen, wem er die Datei gibt; „Support-Stelle“ kennt er nicht.

**Folge im Einsatz:** Gering; die Daten sind erhalten, der Weg dahin ist
verständlich genug.

**Empfehlung:** Zwei Sätze („Der angefangene Bogen ließ sich nicht lesen. Er
liegt noch auf dem Gerät.“) und die Erklärung hinter „Mehr dazu“; „Support-
Stelle“ durch „wer die App betreut“ ersetzen.

**Nachprüfung:** 360 × 640: Karte höchstens fünf Zeilen, beide Knöpfe im
ersten Bild.

### R8-H5 [P3] Tipp-Sperre 1,5 s: Ein Tipp 1,2 s nach dem Öffnen einer Rückfrage wirkt nicht, die Pille liegt über dem Text (Rest aus R7, dort „gewollt“)

**Priorität:** P3

**Kennzeichnung:** beobachtet (Rückfrage „Einheit schnell erfassen — für welche
Sammlung?“, Tipp auf „Für „Hochwasser Musterstadt“ erfassen“ nach 1,2 s: kein
Wechsel, Pille „Einen Moment …“, Bild `o3.png`; nach 2,2 s geht derselbe Tipp
durch).

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur Stärke)…“
→ Hauptknopf der Rückfrage. Code: `src/app/tipp-schutz.ts` (Ortssperre).

**Beobachtung:** Die Sperre schützt gegen den Nachtipp an derselben Stelle und
meldet sich sichtbar. Die Pille liegt aber mittig über dem zweiten Satz der
Rückfrage („dort abgel…“ verdeckt), und die Sperre trifft auch den bewussten
ersten Tipp auf die neue Rückfrage, wenn er innerhalb von 1,5 s nach dem Öffnen
kommt.

**Erwartung der Rolle:** Ein Tipp, den er nach dem Lesen der Frage macht, wirkt.

**Reaktion des Helfers:** „Hat nicht gewirkt“ — er tippt ein zweites Mal, was
nach 0,3 s gelingt.

**Folge im Einsatz:** Gering; ein Tipp mehr, die Rückmeldung ist da.

**Empfehlung:** Die Sperre nur auf den Doppeltipp (gleiche Stelle, unter
etwa 0,5 s nach dem ersten Tipp) beziehen; die Pille an den Rand des Dialogs
statt über den Text setzen.

**Nachprüfung:** Rückfrage öffnen, nach 1,2 s den Hauptknopf tippen: Er wirkt;
bei zwei Tipps in 150 ms bleibt „Einen Moment …“ unter dem Knopf.

Verweis: [../runde-7/feldtauglichkeit.md](../runde-7/feldtauglichkeit.md)
(Bestätigtes: „Verhalten gewollt, siehe `tipp-schutz.ts`“).

### Verweise auf andere Berichte

Dort zuerst festgehalten, von mir hier nachgemessen, nicht doppelt gezählt:

- **Ecken-Knopf „◐ Ansicht“ hochkant** (R7-G4/M8, „teilweise“): In der
  Sammlung hochkant (360 × 640) liegt der feste Balken (80 px von 640) über dem
  unteren Rand der Seite; „Einheit manuell erfassen…“ steht beim Öffnen unter
  dem Balken. Stand unverändert gegenüber Runde 7.
- **Geräteuhr-Warnung bei 200 % und 320 × 568** (R7-G8/H9, „teilweise“): Mit
  Entwurf und alter Sammlung 414 px hoch, beide Knöpfe bei y = 449 bis 493 im
  Bild (Bildhöhe 568 px); „Fortsetzen“ bei 930 px. Bei 360 × 640 mit 200 %
  Schrift 370 px (vorher 1 502 px). Aus meiner Sicht wirkt die Behebung, der
  Rest ist die Kopfhöhe der Startseite.
- **Tabellenansicht der Sammlung am Telefon** (R7-M4): „Einheit“ 118 px, die
  Spalten F, U, M, Ges. liegen weit rechts; die Zelle „Logistik-
  Materialwirtschaft“ bricht hochkant mitten im Wort („Materialwirtsch / aft“),
  die Tabelle ist 1 663 px breit (4,6 Bildschirme), ein Hinweis zum Wischen fehlt.
- **Ziffern der Schrittleiste** (R7-N9, „teilweise“): Reiter zeigen auf dem
  Telefon weiter nur „1 ✓ … 6“; Zielgröße 44 × 44 px, Abstand 0 px.

## Bestätigtes

- **Kernweg neuer Bogen:** „Neuen Bogen erstellen“, Einheitstyp „Bergungsgruppe“
  eintippen → Vorschläge „B Bergungsgruppe“ und „B (ASH) …“, Übernahme der
  Vorbelegung mit „Vorbelegung entfernen“. Die Warnungen je Schritt nennen, was
  fehlt.
- **Entwurfskarte bei großer Schrift (R7-H1):** „Fortsetzen“ bei 246 px
  (640 × 360), 272 px (560 × 360), 246 px (844 × 390), 614 px (820 × 1180),
  542 px (360 × 640), 543 px (320 × 568); `scrollWidth` gleich Bildbreite;
  Name in Wörtern (Bild `i_quer_g.png`).
- **QR-Vollbild (R7-H4):** „Teil 2 von 7“, „← Teil 1“, „Weiter zu Teil 3 →“,
  „Schließen“; quer bei zweitem Tipp nach 150 ms liegt „Einen Moment …“ unten
  rechts unter den Knöpfen, „Teil n von 7“ bleibt lesbar; hochkant im weißen
  Rand unter dem Code, die Code-Module bleiben frei. Ein einzelner Code
  (Zugtrupp Albstadt) zeigt Name, Stärke und Stand über dem Code. Bei 320 × 568
  mit 200 % Schrift füllt der Code die Breite.
- **Zurück-Verlauf (R7-H2):** Assistent Schritt 4 → 3 → 2 → Übersicht →
  Startseite → App; Musterung: Verlauf 2 → 3, Zurück zeigt die Startseite.
- **Zwei-Fenster-Leiste (R7-H3):** fest oben, 104 px von 640, „⚠ Hier wird nichts
  gespeichert. Das andere Fenster hat den Bogen geändert: Personal (2 Einträge)“,
  „Anderen Stand laden“, „Meine Fassung behalten“, „Genauer“ mit beiden
  Ständen (mit Sekunden) und der Folge beider Knöpfe.
- **Sperrradius bei Zoom (R7-H5):** Reiter 5 → 4 im Abstand von 600 ms springt bei
  Zoom 150 % und 200 %.
- **Kurz-Liste (R7-H6):** Ulm mit 8 Personen: Schritt 3 hat 2 962 px
  Seitenhöhe (Kurz-Liste vorgewählt); Großbogen mit 38 Personen 8 826 px.
- **Musterung (R7-H7):** quer mit 200 % Schrift keine klebende Kopfzeile, nur
  die untere Leiste (66 px von 360 px); hochkant mit 200 % Schrift Stärke-Leiste
  96 px plus Kopfzeile 129 px plus Leiste 75 px von 640 px.
- **Hauptknopf quer mit Vorlage (R7-H8):** 318 px bei 640 × 360 (vorher 362 px),
  449 px bei 360 × 640, 440 px bei 320 × 568; der Knopf ist 45 px hoch, die
  letzten 3 px liegen unter der Kante.
- **Geräteuhr:** Im Assistenten steht „⚠ Geräteuhr nicht bestätigt: Das Gerät
  zeigt den 23.10.2026, beim letzten Start war der 15.07.2026. Datum und Stand
  dieses Bogens stimmen vielleicht nicht. Antworten kannst du auf der
  Startseite unter „Geräteuhr prüfen“; der Bogen bleibt dabei gespeichert.“
  (139 px, nicht klebend); auf der Startseite „Geräteuhr stimmt“ und „Uhr
  korrigieren“ im ersten Bild.
- **Beiseitelegen des Entwurfs:** „Als Datei sichern“ und „Entfernen…“, Löschdatum
  genannt; der Rohtext liegt unter `eeb.entwurf.beschaedigt.v1`.
- **„Verwerfen“ des Entwurfs:** Rückfrage mit Namen und dem Weg zurück
  („Zuletzt geschlossenen Bogen zurückholen“); Knöpfe bei 200 % Schrift und
  320 × 568 im Bild (Verwerfen 278 bis 366 px, Abbrechen 447 bis 535 px).
- **Sammlung am Telefon:** Zusammenfassung „6 Einheiten · 1 Führer · 15 Unterf. ·
  43 Mannsch. · 59 gesamt“, Karten mit „Stärke 0 / 4 / 13 / 17“, „Diesel 335 l“,
  „⚠ Anderer Einsatz?“, „Hinweise: Zeitraum vorbei“; im Feld-Modus Knöpfe
  54 px hoch („Zuklappen“, „Details“, „Bogen als PDF“, „Abrücken“, „Zug
  zuordnen“, „Auftrag/Notiz“, „Mehr…“). „Einheit schnell erfassen“ fragt zuerst
  „für welche Sammlung?“ mit dem Einsatznamen als Hauptknopf.
- **Lagemonitor:** Uhr als Datums-Zeit-Gruppe „23 2134 okt 26“, Summen, höchstens
  drei Bewegungen mit „+ 3 weitere Bewegungen“, quer passt die Tabelle (602 px);
  kein Überlauf der Seite.
- **Eingabefelder im Feld-Modus:** Höhe 54 px, Fahrzeug-Sitzplätze mit
  `inputmode="numeric"`, Sofortbedarf als `type="number"`; Kennzeichen und
  Fahrzeugtyp ohne Autovervollständigung.

## Abgleich mit Runde 7

Grundlage: [../runde-7/feldtauglichkeit.md](../runde-7/feldtauglichkeit.md)
samt „Stand der Behebung“.

| Runde-7-Befund | Stand laut Bericht | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-H1 Entwurfskarte bei großer Schrift ab 481 px | behoben | **hält** | „Fortsetzen“ 246 bis 614 px in allen sechs Maßen; Name in Wörtern. |
| R7-H2 Musterung verlässt die App | behoben | **hält** | Verlauf 2 → 3, Zurück zeigt die Startseite. |
| R7-H3 Zwei-Fenster-Warnung ohne Unterschied | behoben | **hält** | „Personal (2 Einträge)“, „Genauer“ mit beiden Ständen; 16 % der Höhe. |
| R7-H4 „Einen Moment …“ verdeckt „Teil n von m“ | behoben | **hält** | Quer unten rechts, hoch unter dem Code; „Teil n von 7“ bleibt lesbar. |
| R7-H5 Sperrradius bei Zoom | behoben | **hält** | Nachbarreiter nach 600 ms bei 150 % und 200 % wirksam. |
| R7-H6 Karten bis 12 Personen | behoben | **hält** | Kurz-Liste ab 8; Ulm 2 962 px statt 14 481 px. |
| R7-H7 Klebende Kopfzeile der Musterung | behoben | **hält** | Quer keine klebende Kopfzeile; hochkant 200 % noch 300 von 640 px fest (Stärke, Kopf, Leiste). |
| R7-H8 Erster Hauptknopf quer mit Vorlage | behoben | **teilweise** | Oberkante 318 px, der 45 px hohe Knopf endet 3 px unter der Bildkante (360 px). |
| R7-H9 Geräteuhr-Warnung bei 200 % Schrift | teilweise | **hält besser als gemeldet** | 370 px statt 1 502 px; Knöpfe bei 478 bis 522 px von 640; bei 320 × 568 bei 449 bis 493 px von 568. |

Zu den Runde-7-Änderungen anderer Rollen, soweit sie meinen Weg berührten:

| Runde-7-Änderung | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- |
| Zwei-Fenster-Leiste und Rückfragen (rollender Rumpf, fester Fuß, Unterschiedstexte) | **hält, Nebenwirkung** | Wirkt; bei 200 % Schrift sieht man vom Rumpf nur Titel und zwei Zeilen (R8-H2). |
| Geräteuhr-Halt und Hinweis im Assistenten | **hält** | Hinweis steht im Assistenten (139 px) und nennt den Weg. |
| Beiseitelegen unlesbarer Daten (`eeb.unlesbar.v1`) | **teilweise** | Entwurf gut (R8-H4 zum Wortlaut); abgeschnittene Sammlung und Vorlagen unbemerkt (R8-H1). |
| „Nur Stärke“-Rückfrage | **hält** | Rückfrage mit Zahlen; Fokus auf Hauptknopf (R8-H2). |
| Kurz-Liste ab 8 Personen | **hält** | Siehe R7-H6. |
| Musterung als Verlaufsansicht | **hält** | Siehe R7-H2. |
| Layout bei großer Schrift und Zoom | **hält** | Kein Seitenüberlauf in Start, Assistent, QR-Vollbild bei 360, 320 mit 200 % und Zoom 150/200 %. |
| Lagemonitor (Tabelle im Bild, „+ n weitere“, Bewegungen, Telefonansicht) | **teilweise** | Bewegungen, Zeile „+ 3 weitere Bewegungen“ und Schrift gut; hochkant F/U/M außerhalb des Bildes (R8-H3). |
| Papier-Abgleich mit Sitzungsspeicher, Zug-Normalisierung, Umschlagfeld „lage“, Sortierung nach Nr. | **nicht gezielt geprüft** | Sortierung „Nr. 1 … Nr. 6“ in Karten und Tabelle gesehen; die übrigen Wege gehören nicht zum Helferweg. |
| Verlauf: späte Rückkehr eines eigenen `back()` | **nicht prüfbar** | Mit `history.back()` ist die Schrittfolge richtig; die Geräte-Geste fehlt (Risiko). |

Bekannte Grenzen aus Runde 7, nur Stand:

| Grenze | Stand Runde 8 |
| --- | --- |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | nicht geprüft, keine Änderung gesehen |
| R7-G4/M8 Ecken-Knopf hochkant | unverändert, siehe Verweise |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | Knöpfe im ersten Bild (449 bis 493 px von 568), siehe Verweise |
| R7-N1 kein Zusammenführen-Tipp | nicht berührt |
| R7-N9 Ziffern der Schrittleiste | unverändert, siehe Verweise |

## Abschluss

- **Aufgabe geschafft:** Neuer Bogen bis zur Übersicht: ja. Angefangenen Bogen
  finden und übergeben, auch sieben Teile: ja. Zurück durch den Assistenten:
  ja. Sammlung am Telefon lesen: ja. Beschädigten Speicher bemerken: **mit
  Schwierigkeit** (Entwurf ja, Sammlung und Vorlagen nein, R8-H1).
- **Fremde Hilfe nötig:** nein, außer beim beschädigten Speicher.
- **Mentales Modell:** Papierbogen aus der Mappe (Vorlage), Fehlendes
  streichen, vorzeigen, nachfragen „hast du’s?“; am Meldekopf: scannen, zählen,
  weitergeben.
- **Größtes Einsatzrisiko:** Kein P0 oder P1. Am nächsten kommt R8-H1:
  Eine abgeschnittene Sammlung wird ohne Hinweis zu „[]“, der Rohtext ist weg.
- **Top-Priorität für die nächste Iteration:** Ungültigen Text von Sammlung und
  Vorlagen vor dem ersten Schreiben beiseitelegen und anzeigen (R8-H1); danach
  die Sichtfläche der Rückfragen bei großer Schrift und den Fokus auf
  „Abbrechen“ (R8-H2).

**Verständnisprüfung**

- Orientierung: **verstanden**. Schrittleiste mit Haken, „Teil n von m“ über dem
  Code, Sammlung mit Summen und Einsatzname, Zwei-Fenster-Leiste mit Ort der
  Änderung.
- Nächster Schritt: **verstanden**. „Fortsetzen“, „Bogen übergeben…“, „QR-Code im
  Vollbild zeigen“, „Weiter zu Teil n →“, „Einheit schnell erfassen“ mit
  Rückfrage zur Sammlung.
- Systemzustand: **verstanden**. „✓ gespeichert · … nur auf diesem Gerät“,
  Offline-Zeile, Teilzähler, „Einen Moment …“, Geräteuhr-Hinweis. Lücke:
  abgeschnittene Sammlung und Vorlagen ohne Meldung (R8-H1).
- Fehlerbehebung: **verstanden**. Rückfragen mit Namen und Zahlen, „Zuletzt
  geschlossenen Bogen zurückholen“, Zurück schrittweise, Beiseitelegen des
  Entwurfs. Lücke: R8-H1.
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, echter Kamera-Scan mit 1,5 s Mindestzeit, Bildschirmtastatur,
  deutsches Datumsformat der nativen Auswahl, echter Browser-Zoom und die
  Zurück-Geste der installierten App gehören in einen Praxistest.
