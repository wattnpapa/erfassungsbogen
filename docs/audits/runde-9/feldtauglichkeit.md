# Audit „Helfer im Feld“, Runde 9 (Feldtauglichkeit)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-field-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-8-Befunde
([../runde-8/feldtauglichkeit.md](../runde-8/feldtauglichkeit.md) und
[../runde-8/README.md → Stand der Behebung](../runde-8/README.md#stand-der-behebung-24102026)).
Runde 8 änderte u. a. das Beiseitelegen beschädigter Gesamttexte
(`eeb.unlesbar.v1`), die Sprungmarke, die Rückfragen bei Zoom 200 %, den
Lagemonitor am Telefon, den Fokus der Rückfrage „Nur Stärke melden?“, den
Kasten zum beiseitegelegten Bogen, die Zwei-Fenster-Rückfrage mit Werten, die
Zug-Normalisierung und den Hinweis zur Anonymisierung. Der Bericht prüft sie
auf Wirkung und Nebenwirkung im Helferweg.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Jeder Lauf in einem
eigenen Browser-Kontext mit frischem Speicher, weil elf weitere Prüfer
denselben Server nutzten; der Server wurde weder neu gebaut noch angefasst.
**Zeitangaben sind unter Last gemessen und nur grob.** Grundeinstellung Telefon
360 × 640 px, dazu 320 × 568, quer 640 × 360; Browser-Zoom 200 % über halbierte
CSS-Pixel nachgestellt (180 × 320), große Schrift über `html { font-size: 200% }`
(im Folgenden „200 % Schrift“), dazu der Feld-Modus
(`eeb.anzeigemodus.v1` = `feld`). Bedient wurde mit `tap()`.

Zustände kamen über `localStorage`-Seeds mit `uebung: false` und `stand` auf
heute: Entwurf (`eeb.entwurf.v1`) aus `examples/thw/` (Bergungsgruppe Ulm,
Zugtrupp Albstadt, Großbogen „Verstärkter Bergungszug“ Oldenburg), Einsatz-
Sammlung „Hochwasser Musterstadt“ mit sechs THW-Bögen (`eeb.einsaetze.v1`),
absichtlich abgeschnittene Sammlung, Vorlagenliste und Entwurf, ein Entwurf mit
80 Tage altem Stand. Dass die Übungsbögen einen vergangenen Einsatzzeitraum
tragen („Zeitraum vorbei“, „Anderer Einsatz?“), ist Seed-Wirkung und kein
Befund. Skripte und Bilder liegen im Scratchpad unter `runde9/h/`.

Reihenfolge: Zuerst blind geprüft, ohne die Berichte unter `docs/audits/`
gelesen zu haben — Startseite (leer, mit Entwurf, mit Sammlung), „Neuen Bogen
erstellen“ mit Einheitstyp-Eingabe durch die Schritte 1 bis 6, Einsatz-
Sammlung als Karten, „Einheit manuell erfassen“, Offline nach geladenem
Dienst, Zurück-Verlauf, Lagemonitor, Zwei-Fenster-Konflikt. Danach habe ich den
Runde-8-Bericht meiner Rolle und den Stand der Behebung gelesen und H1 bis H5
sowie die übrigen Runde-8-Änderungen im Helferweg einzeln nachgemessen.
Befunde anderer Runde-9-Berichte kenne ich nicht.

Rolle: Helfer einer Bergungsgruppe oder Meldekopf-Helfer, praktisch erfahren,
bedient die App selten, steht mit dem Telefon in einer Hand am Fahrzeug oder
am Meldekopf und wird zwischendurch gerufen.

Szenarien, jeweils vom natürlichen Einstieg aus:

1. **Neuen Bogen anlegen:** Startseite → „Neuen Bogen erstellen“ →
   Einheitstyp „Bergungsgruppe“ tippen und wählen → Name → Schritte 2 bis 6.
   Abgeschlossen: **ja**. Die Warnungen je Schritt nennen, was fehlt.
2. **Angefangenen Bogen finden und übergeben:** „Fortsetzen“ → Übersicht →
   „Bogen übergeben…“ in vier Maßen. Abgeschlossen: **ja**, bei Zoom 200 %
   **mit Schwierigkeit** (R9-H1).
3. **Meldekopf, Einheit im Stehen aufnehmen:** Sammlung öffnen → „Einheit
   manuell erfassen…“ → Nr., Name, Typ → „Nur Stärke“ mit Rückfrage → Zahlen →
   „In Einsatz übernehmen“. Abgeschlossen: **ja**; Hinweisrauschen danach
   (R9-H2); Folgetipp nach dem Öffnen der Sammlung geschluckt (R9-H5).
4. **Zug zuordnen, Abrücken, Rückgängig:** Karte aufklappen, „Zug zuordnen“ mit
   vier Schreibweisen, „Abrücken“ und „Rückgängig“. Abgeschlossen: **ja**.
5. **Unterbrechung und Zurück:** Zurück-Geste im Assistenten, Neuladen direkt
   nach einer Eingabe, Zwei-Fenster-Konflikt, Entwurf mit Anonymisierungsfrist.
   Abgeschlossen: **ja**.
6. **Lagemonitor am Telefon:** hoch, quer, kleine Schirme, große Schrift,
   Zoom 200 %. Abgeschlossen: **ja**, bei großer Schrift **mit Schwierigkeit**
   (R9-H3).
7. **Beschädigter Speicher:** abgeschnittene Sammlung, Vorlagenliste und
   Entwurf. Abgeschlossen: **ja**, Wortlaut verbesserungsfähig (R9-H4).
8. **Ohne Netz:** Dienst aktiv, `setOffline(true)`, Neuladen, Sammlung öffnen,
   Assistent öffnen. Abgeschlossen: **ja**.

**Nicht prüfbar** und deshalb *nicht geprüft*: echte Handschuhe und nasse
Finger, Sonnenlicht und Dunkelheit am echten Display, Kamera-Scan, die
Zurück-Geste der installierten PWA (hier nur `history.back()`), Bildschirm-
tastatur und ihr Einfluss auf die untere Leiste, native Datums- und
Auswahllisten, WebKit/Safari, native Builds, echtes Drucken, Wake-Lock.
**Nicht erneut gemessen** (siehe Abgleich): CSV nach Nr., Umschrift im
Papierfeld, Kontrast von Musterung, iOS und Nacht, Spaltenfolge der
Einsatztabelle, die Messlogik des Lagemonitors am Fernseher, die Musterung bei
180 × 320 und die Sollstärke-Marke in Lageblatt und Sammel-PDF.

## Urteil

Der Kernweg trägt, und die Runde-8-Behebungen meiner Rolle halten. Eine
abgeschnittene Sammlung wird nicht mehr still zu `[]`: Der Rohtext liegt unter
`eeb.unlesbar.v1`, die Startseite sagt es an und bietet „Daten sichern…“ an
(R8-H1). Die Rückfrage „Nur Stärke melden?“ setzt den Fokus auf „Abbrechen“ und
zeigt ihren Hauptknopf in allen vier Maßen im Bild (R8-H2). Der Lagemonitor am
Telefon zeigt F, U und M im Bild (R8-H3), der Kasten zum beiseitegelegten Bogen
hat drei Zeilen (R8-H4), und ein Tipp auf den Hauptknopf einer Rückfrage wirkt
ab 400 ms (R8-H5). Die Sprungmarke liegt in allen gemessenen Lagen 8 px über
dem Bild, die Zug-Schreibweisen fallen in eine Gruppe, die Zwei-Fenster-
Rückfrage nennt beide Stände.

Neu und als einziges mit P2 gewertet: Der Dialog „Bogen übergeben“ ist bei
Browser-Zoom 200 % (180 × 320) nicht mit der Kompaktheit der Rückfragen
nachgezogen worden — der Titel bricht mitten im Wort, der Text hat 98 von
180 px Breite, und „QR-Code im Vollbild zeigen“ beginnt erst bei 583 px (R9-H1).
Sonst fünf Kleinigkeiten (P3): Hinweisrauschen nach der Schnellerfassung
(R9-H2), der Lagemonitor am Telefon bei großer Schrift mit verkehrter
Größenordnung (R9-H3), der Wortlaut des Beiseitelegen-Hinweises (R9-H4), ein
geschluckter Folgetipp nach dem Seitenwechsel (R9-H5) und der halbe
„Fortsetzen“-Knopf bei Zoom 200 % mit langem Namen (R9-H6). Kein P0, kein P1.

## Befunde

Zählung (ohne die Verweise unten): P0: 0 · P1: 0 · P2: 1 · P3: 5.

### R9-H1 [P2] „Bogen übergeben“ bei Zoom 200 % (180 × 320): Titel bricht im Wort, schmale Textspalte, „QR-Code im Vollbild zeigen“ erst bei 583 px (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (`getBoundingClientRect` von Dialog, Titel und
Hauptknopf; Bild `ueb-zoom.png`), beobachtet. Echter Browser-Zoom am Gerät
nicht geprüft (*Annahme*: die Nachstellung über halbierte CSS-Pixel entspricht
ihm).

**Fundstelle / Aufgabe:** Entwurf „Verstärkter Bergungszug“ → „Fortsetzen“ →
Schritt 6 → „Bogen übergeben…“. Der Dialog gehört zum häufigsten Weg am Ende
des Bogens. Code: Übergabe-Dialog der Übersicht (gemeinsame Dialogbauart mit
innerem Rahmen).

**Beobachtung:**

| Maß | Dialog | Textspalte | Titel | „QR-Code im Vollbild zeigen“ |
| --- | --- | --- | --- | --- |
| 360 × 640 | 328 px | 278 px | 1 Zeile | Oberkante 278 px |
| 320 × 568 | 288 px | 238 px | 1 Zeile | Oberkante 299 px |
| 320 × 568, 200 % Schrift | 288 px | 238 px | 1 Zeile | Oberkante 405 px |
| 180 × 320 (Zoom 200 %) | **148 px** | **98 px** | **3 Zeilen („Bogen / übergebe / n“)** | **Oberkante 583 px** |

Bei 180 × 320 stehen im ersten Bild der Titel, „Schließen“ und der Anfang des
Hinweises „Dieser Bogen gehört zum Einsatz 16.07.2026 …“, eine Zeile pro Wort.
Von den 180 px gehen 82 px (46 %) für Rand und Innenabstand weg; der Dialog
„Neue Einsatz-Sammlung anlegen“ hat dagegen bei gleichem Maß 130 px
Titelbreite. Die Rückfragen sind in Runde 8 für dieses Maß verdichtet worden
(R8-G1/M2), dieser Dialog nicht.

**Erwartung der Rolle:** „Bogen übergeben“ zeigt den Hauptweg („QR-Code im
Vollbild zeigen“) ohne Rollen und bricht kein Wort.

**Reaktion des Helfers:** Er sieht den Titel, ein Feld mit Datum und liest nur
Einzelwörter. Er rollt, ohne zu wissen, wie weit.

**Folge im Einsatz:** Der Weg bleibt erreichbar (der Dialog rollt), kostet aber
rund zwei Bildschirmhöhen Rollen an der Stelle, an der die Gegenstelle wartet.
Betrifft Helfer mit Browser-Zoom 200 % oder sehr kleinem Display, nicht den
Normalfall.

**Empfehlung:** Den inneren Rahmen und den seitlichen Innenabstand des Dialogs
unter etwa 280 px wie bei den Rückfragen verkleinern (Textspalte mindestens
140 px), den Titel nicht im Wort brechen, den Hauptknopf vor die Hinweise
stellen oder die Hinweise einklappen.

**Nachprüfung:** 180 × 320: „QR-Code im Vollbild zeigen“ im ersten Bild oder
höchstens 100 px darunter, Titel in höchstens zwei Zeilen und in ganzen Wörtern.

Verweis: Zoom-Dialoge allgemein [../runde-8/mobile-ui.md](../runde-8/mobile-ui.md)
(R8-M2) und [../runde-8/handschuh-bedienung.md](../runde-8/handschuh-bedienung.md)
(R8-G1), dort nur Rückfragen.

### R9-H2 [P3] Schnellerfassung: Platzhalter aus dem Einheitstyp erzeugen fünf Hinweise, die dem Satz „zählen nicht“ widersprechen (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet und gemessen (Wortlaut aus `innerText`, Bild
`sq-karte7.png`). Wirkung auf den Stab ist *Risiko*.

**Fundstelle / Aufgabe:** Sammlung → „Einheit manuell erfassen…“ → Einheitstyp
„Bergungsgruppe“ → Schritt 3 → „Nur Stärke“ → Unterführer 1, Mannschaft 5 →
„In Einsatz übernehmen“.

**Beobachtung:** Der Typ bringt eine Vorgabe aus 9 Personenkarten und 2
Fahrzeugen mit. Schritt 3 sagt richtig „Vorgabe nach Einheitstyp (Sollstärke),
nicht gezählt“ und „Diese 9 Personen zählen nicht in die Stärke“. Direkt
darunter stehen trotzdem drei Warnungen: „⚠ Aufteilung nach Geschlecht: 9 männl.
+ 0 weibl. + 0 div. = 9 weicht von der Gesamtstärke 6 ab.“, „⚠ Es sind 9
Ansprechpartner erfasst, die Gesamtstärke ist aber nur 6.“ und „⚠ Keine
telefonische Erreichbarkeit erfasst“. Die neue Einheit steht danach als Nr. 7
mit „Hinweise: Aufteilung nach Geschlecht prüfen + 4 weitere“ in der Sammlung;
aufgeklappt zusätzlich „Fahrzeug 1 hat noch kein Kennzeichen“ und „Fahrzeug 2 …“.
Nichts davon hat der Helfer eingegeben.

**Erwartung der Rolle:** Wer nur drei Zahlen vom Zettel aufnimmt, bekommt keine
Warnungen über Dinge, die er nicht erfasst hat — und schon gar nicht solche, die
der Satz darüber für unbeachtlich erklärt.

**Reaktion des Helfers:** „Habe ich etwas falsch gemacht? Neun männlich — ich habe
doch sechs gemeldet.“ Er sucht die Ursache oder lernt, Hinweise zu übergehen.

**Folge im Einsatz:** Gering; die Zahlen stimmen. Auf Dauer stumpfen die Hinweise
ab, die in der Karte echte Abweichungen („Anderer Einsatz?“) anzeigen.

**Empfehlung:** Im Modus „Nur Stärke“ Warnungen zu den Personenkarten, zur
Geschlechtsverteilung und zu den Fahrzeugen der Vorgabe unterdrücken, solange sie
unverändert sind; „Keine Erreichbarkeit“ nur, wenn der Helfer dort etwas
eingetragen hat.

**Nachprüfung:** Schnellerfassung mit Typ „Bergungsgruppe“, nur Zahlen: Keine
Warnung in Schritt 3, in der Karte höchstens die Hinweise zur Lage.

Verweis: Die Sollstärke-Marke selbst (R8-A1) ist bekannte Grenze; hier geht es um
die Warnungen daneben.

### R9-H3 [P3] Lagemonitor am Telefon bei großer Schrift: Beschriftungen größer als die Zahlen, Wortbruch in der Tabelle (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (`getComputedStyle().fontSize` je Textknoten, Bilder
`lm-telG.png`, `lm-zoom.png`). Das Telefon ist laut Seite ein Ausweichweg
(*Annahme*).

**Fundstelle / Aufgabe:** `?lagemonitor=<id>` der Sammlung am Telefon bei
`html { font-size: 200% }` oder Browser-Zoom 200 %. Runde 8 ließ die Schrift der
Seite der Systemschrift folgen (R8-L5).

**Beobachtung:** Bei 360 × 640 mit 200 % Schrift verdoppeln sich die
Beschriftungen („Uhr“ 14 → 28 px, „Stärke F / U / M // gesamt“ 14 → 28 px,
„letzte Meldung vor 1 Min“ 14 → 28 px, „vor 1 Min“ in den Bewegungen 14 → 28 px),
während die Zahlen gleich bleiben: Summe „1 / 15 / 43 // 59“ 17 px, die Namen der
Bewegungen 13 px. Auf dem Bild steht damit „Stärke F / U / M // gesamt“ groß und
die Stärke klein, „vor 1 Min“ groß und die Einheit klein. Die Tabelle bricht
Wörter („Alb / sta / dt“, „Albsta / dt“, bei 180 × 320 „Al / bs / ta“), F, U und M
bleiben im Bild (bei 180 × 320 bei x = 120 bis 172). Auch ohne große Schrift ist
die Gesamtzahl am Telefon mit 17 px nur 3 px größer als ihre Beschriftung (14 px).
Kein Seitenüberlauf (`scrollWidth` gleich Breite).

**Erwartung der Rolle:** Die Zahl, um die es geht, ist die größte Schrift der
Zeile; Wörter bleiben ganz.

**Reaktion des Helfers:** Er liest „vor 1 Min“ und „letzte Meldung“ und sucht die
Einheit und die Zahl.

**Folge im Einsatz:** Gering; die Summe ist da, aber leicht zu übersehen. Der
Fernseher ist der vorgesehene Anzeigeweg.

**Empfehlung:** Zahlen und Beschriftungen im selben Verhältnis mitwachsen lassen;
in der Tabelle die Spalte „Ort“ nicht unter eine Mindestbreite pressen (Funkrufname
oder Orga dafür umbrechen).

**Nachprüfung:** 360 × 640 mit 200 % Schrift: Die Summe ist größer als jede
Beschriftung, kein Wortbruch in „Ort“ und „Funkruf“.

Verweis: Die Telefondarstellung ohne große Schrift bestätigt R8-K1/N1/H3/M4 als
behoben (siehe Bestätigtes).

### R9-H4 [P3] Hinweis zu beschädigtem Gesamttext: „Gesamttext“, ohne Namen der Sammlung, ohne Weg zurück in die App (Rest aus R8-H1)

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640, Bild `h1-sammlung.png`). Ob die
Sicherung den Rohtext in der App wieder öffnen lässt, habe ich nicht geprüft
(*Risiko*).

**Fundstelle / Aufgabe:** Startseite nach abgeschnittenem `eeb.einsaetze.v1` oder
`eeb.vorlagen.v1`.

**Beobachtung:** Der Hinweis steht gelb über „Meinen Bogen ausfüllen“: „Nicht lesbar:
1 beschädigter Gesamttext (Sammlungen oder Vorlagen). Sie fehlen in Listen und
Zählung — die Stärke kann zu niedrig sein. Nichts davon ist gelöscht; die Daten
stecken in der Datensicherung.“ mit „Daten sichern…“ und „Beiseitegelegtes
entfernen…“. „Daten sichern…“ erzeugt `eeb-sicherung-2026-10-24.json`; sie enthält
`eeb.unlesbar.v1` mit dem Rohtext (13 660 Zeichen) und `eeb.einsaetze.v1` als `[]`.
Der Hinweis gilt für Sammlung und Vorlagenliste gleich und nennt weder die Art
(„Sammlung“ oder „Vorlagen“) noch den Namen („Hochwasser Musterstadt“) oder die
Zahl der Einheiten.

**Erwartung der Rolle:** „Die Sammlung ‚Hochwasser Musterstadt‘ ließ sich nicht
lesen. Sie liegt noch auf dem Gerät. ‚Daten sichern‘ und weitergeben.“

**Reaktion des Helfers:** „Gesamttext? Welcher? Wo ist unser Einsatz?“ Er tippt
„Daten sichern…“ und weiß nicht, was er mit der Datei tut.

**Folge im Einsatz:** Gering; die Daten sind erhalten und der Hinweis nennt die
Folge für die Stärke. Die Sammlung selbst ist für den Helfer nicht wieder
öffnbar.

**Empfehlung:** „Gesamttext“ durch „Sammlung“ oder „Vorlagenliste“ ersetzen, den
Namen und die Einheitenzahl nennen, einen Satz zum Weg („Datei an den geben, der
die App betreut“) ergänzen; falls die Sicherung nicht einspielbar ist, das sagen.

**Nachprüfung:** Abgeschnittene Sammlung mit Namen setzen: Hinweis nennt Namen und
Zahl, kein Fachwort „Gesamttext“.

Verweis: R8-H1 ist für den Kern (kein stilles `[]`) behoben, siehe Abgleich.

### R9-H5 [P3] Folgetipp nach dem Seitenwechsel wird bis rund 1,4 s geschluckt, auch 255 px weiter unten (Rest aus R8-H5/S4, andere Stelle)

**Priorität:** P3

**Kennzeichnung:** gemessen (je drei Läufe, Zeit vom Tipp bis zum Tipp auf
`performance`-Basis; Last durch parallele Prüfer: Zeiten grob).

**Fundstelle / Aufgabe:** Startseite → „Hochwasser Musterstadt“ öffnen → sofort
„Einheit manuell erfassen…“. Tippmitten (180, 272) und (180, 527), 255 px
auseinander.

**Beobachtung:** Der zweite Tipp wird geschluckt (kurze Pille „Einen Moment …“,
dann nichts), wenn er innerhalb von 1,0 bis 1,4 s nach dem ersten kommt: Abstand
um 0,7 s 3 von 3 Läufen geschluckt, um 1,0 s 3 von 3, um 1,4 s 2 von 3, um 1,8 s
0 von 3. Der Tipp auf den Hauptknopf einer Rückfrage wirkt dagegen ab 400 ms (je
ein Lauf bei 150 ms „geschluckt“, bei 400, 700 und 1200 ms „wirkt“). Als bekannte
Grenze steht „Prellschutz 450/800 ms“; für den Seitenwechsel liegt der gemessene
Wert darüber.

**Erwartung der Rolle:** Wer die Sammlung geöffnet hat und die Knöpfe liest, tippt
nach etwa einer Sekunde — das gilt.

**Reaktion des Helfers:** „Hat nicht gewirkt“ — ein zweiter Tipp.

**Folge im Einsatz:** Gering; ein Tipp mehr bei jedem Seitenwechsel, an dem es
schnell gehen soll. Die Rückmeldung ist da, aber flüchtig.

**Empfehlung:** Die Ortssperre nach einem Seitenwechsel nur auf die Stelle des
ersten Tipps und nur 450 ms halten; die Pille so lange zeigen, bis der Tipp
wieder gilt.

**Nachprüfung:** Sammlung öffnen, nach 1 s „Einheit manuell erfassen…“ tippen: Der
Assistent öffnet beim ersten Tipp.

Verweis: R8-H5/S4 (bekannte Grenze, Stand „teilweise“); ich vermerke nur den
höheren Wert beim Seitenwechsel.

### R9-H6 [P3] Entwurfskarte bei Zoom 200 % mit langem Namen: „Fortsetzen“ liegt halb unter der Bildkante (Rest aus R8-D4/S3)

**Priorität:** P3

**Kennzeichnung:** gemessen (Bild `zoom-start.png`), Zoom nachgestellt.

**Fundstelle / Aufgabe:** Startseite mit Entwurf bei 180 × 320.

**Beobachtung:** „Fortsetzen“ liegt für den Entwurf „Bergungsgruppe Ulm“ bei
273 bis 317 px (im Bild von 320 px), für den Großbogen „Verstärkter Bergungszug“
und den „Zugtrupp Albstadt“ (längerer Name, drei Zeilen) bei 293 bis 337 px:
27 von 44 px sichtbar, die Beschriftung ist angeschnitten. Die Angabe „273 px“ aus
der Behebung gilt nur für den kurzen Namen. Kein Seitenüberlauf. Die Kopfzeile
mit „Ansicht: Standard ▾“ nimmt rund 90 px.

**Erwartung der Rolle:** Der Hauptknopf der Karte steht ganz im ersten Bild.

**Reaktion des Helfers:** Er sieht eine dunkle Kante und tippt sie, oder rollt.

**Folge im Einsatz:** Gering; der Knopf ist erreichbar.

**Empfehlung:** Bei Zoom 200 % die Kopfzeile und „Ansicht“ auf der Startseite eine
Zeile niedriger halten oder den Namen auf zwei Zeilen kürzen.

**Nachprüfung:** 180 × 320 mit Zugtrupp Albstadt: „Fortsetzen“ ganz im Bild.

### Verweise auf andere Berichte

Dort zuerst festgehalten, von mir hier nachgemessen, nicht doppelt gezählt:

- **Ecken-Knopf „◐ Ansicht“ hochkant** (R7-G4/M8): In der Sammlung hochkant
  (360 × 640) liegt der feste Balken (170 × 44 px bei y = 590) über der Liste;
  Stand unverändert.
- **Ziffern der Schrittleiste** (R7-N9): Reiter 44 × 44 px (Telefon), Abstand 0 px;
  die Reiter tragen „1 offen“, „2 ✓“, bei 200 % Schrift „1 / offen“ — die
  Zustände stehen jetzt dran, die Nummern bleiben nackt.
- **Tipp-Sperre** (R8-H5/S4): siehe R9-H5.
- **Sollstärke zählt mit** (R8-A1): In der Schnellerfassung steht ein Satz
  „Vorgabe nach Einheitstyp (Sollstärke), nicht gezählt: Mit der gezählten Stärke
  überschreiben, nicht dazuzählen.“ — verständlich.
- **Geräteuhr bei 200 % und 320 × 568** (R7-G8/H9), **Uhrstand in der Zukunft**
  (R6-O9): nicht erneut gemessen (Seed-Format des Uhrstands nicht getroffen,
  Hinweis erschien nicht); Stand unbekannt.

## Bestätigtes

- **Kernweg neuer Bogen:** Einheitstyp „Bergungsgruppe“ eintippen → Vorschläge
  „B Bergungsgruppe“ und „B (ASH) …“; Warnungen je Schritt nennen, was fehlt
  („Ort/Auftrag ist noch leer“, „Fahrzeug 1 hat noch kein Kennzeichen“).
- **Beiseitelegen (R8-H1):** abgeschnittene Sammlung: `eeb.einsaetze.v1` = `[]`,
  `eeb.unlesbar.v1` 13 660 Zeichen, Hinweis nach 3,5 s sichtbar; abgeschnittene
  Vorlagenliste: Original bleibt (8 985 Zeichen), Kopie unter `eeb.unlesbar.v1`
  (10 255 Zeichen), Hinweis sichtbar; abgeschnittener Entwurf unter
  `eeb.entwurf.beschaedigt.v1`.
- **Kasten zum beiseitegelegten Bogen (R8-H4):** Überschrift „Ein Bogen ließ sich
  nicht öffnen“, zwei Sätze, „Mehr dazu“, „Als Datei sichern“ und „Entfernen…“
  nebeneinander (je 44 px hoch); „Mehr dazu“ 40 px hoch. „Neuen Bogen erstellen“
  beginnt bei 360 × 640 bei 609 von 640 px (nur ein Streifen im ersten Bild, wie
  gemeldet).
- **„Nur Stärke melden?“ (R8-H2):** Fokus bei 360 × 640, 320 × 568 mit 200 %
  Schrift, quer mit 200 % Schrift und Zoom 200 % auf „Abbrechen“; beide Knöpfe im
  Bild (Zoom 200 %: 195 bis 239 und 251 bis 295 px von 320). Bei Zoom 200 % liegt
  der Folgesatz („startet mit 1 / 9 / 28 / 38“) hinter dem Rollrand; die
  Voreinstellung ist dort der harmlose Knopf.
- **Lagemonitor am Telefon (R8-H3):** F, U, M bei x = 296 bis 348 (360 px), 257
  bis 309 (320 px), 120 bis 172 (Zoom 200 %); Einheitentyp entfällt; quer 569 bis
  621 von 640; kein Seitenüberlauf; Zeilen „Heros Albstadt 21/10 1 1 2“ in
  Lesereihenfolge.
- **Tipp auf die Rückfrage (R8-H5):** Rückfrage „Einheit schnell erfassen“, Tipp
  auf den Hauptknopf nach 400, 700 und 1 200 ms wirkt.
- **Sprungmarke (R8-M1/O1/G3/S1):** Unterkante −8 px bei 360 × 640, 320 × 568 mit
  200 % Schrift, Zoom 200 %, quer mit 200 % Schrift und 360 × 640 mit 200 % Schrift,
  jeweils auf Startseite leer, mit Entwurf und mit Sammlung.
- **Zug-Normalisierung (R8-N5):** „2. Zug“, „2.zug“, „Zug 2“ und „2.  ZUG“ für vier
  Einheiten ergeben eine Gruppe „2. Zug · 4 Einheit(en)“ in den Zwischensummen; ein
  bloßes „2“ bleibt „2“.
- **Zwei-Fenster-Rückfrage (R8-N6/E4):** „Das andere Fenster hat den Bogen
  geändert: Personal (1 Eintrag: Ohne Namen), Verpflegung.“ und mit „Genauer“:
  „Dort: … 9 Personen“ / „Hier: … 8 Personen“, dazu die Folge beider Knöpfe.
- **Anonymisierung (R8-D3):** Entwurf mit 80 Tage altem Stand: Karte
  „⚠ Namen werden am 3.11.2026 anonymisiert (noch 10 Tage) — vorher weitergeben
  oder sichern; Bearbeiten beginnt die Frist neu.“, im Assistenten dieselbe
  Ankündigung.
- **„Nr. schon vergeben“:** Nr. 2 in der Schnellerfassung → Rückfrage „Nr. 2 gehört
  schon „THW Bamberg Fachgruppe Wassergefahren (A)“. Eine andere Nummer eintragen
  oder das Feld leer lassen.“
- **Abrücken und Rückgängig:** nach „Abrücken“ erscheint die Leiste „Abgerückt 07:08:
  Nr. 1 …“ mit „Rückgängig“ (44 px) und „✕“, der Knopf wird zu „✓ Abgerückt“.
- **Zurück-Verlauf:** Assistent Schritt 4 → 3 → 2 → Übersicht → Startseite → App
  verlassen; jeder Zurück-Schritt eine Ebene.
- **Neuladen direkt nach einer Eingabe:** Nach „Name“ = „Oldenburg“ und sofortigem
  Neuladen steht der Entwurf „THW Oldenburg“ auf der Startseite.
- **Ohne Netz:** Dienst aktiv, danach Neuladen, Sammlung öffnen und Assistent
  öffnen funktionieren; die Startseite sagt „Offline bereit …
  Übungsbögen und Themenseiten fehlen noch (74 von 549), sie folgen beim nächsten
  Netz“.
- **Eingabefelder:** Zahlen im Personal-Schritt `type="number"` mit
  `inputmode="numeric"`, 52 px hoch; Telefon `type="tel"`, E-Mail `type="email"`.
- **Sammlung am Telefon:** Zusammenfassung „6 Einheiten · 1 Führer · 15 Unterf. ·
  43 Mannsch. · 59 gesamt“, Bedarf in einer Zeile, Karten mit „Stärke 0 / 4 / 13 /
  17“, im Feld-Modus Knöpfe 54 px hoch.

## Abgleich mit Runde 8

Grundlage: [../runde-8/feldtauglichkeit.md](../runde-8/feldtauglichkeit.md) samt
„Stand der Behebung“.

| Runde-8-Befund | Stand laut Bericht | Bewertung Runde 9 | Beobachtung |
| --- | --- | --- | --- |
| R8-H1 Abgeschnittene Sammlung wird still zu `[]`, Vorlagen unsichtbar | behoben | **hält, Rest** | Rohtext unter `eeb.unlesbar.v1`, Hinweis auf der Startseite, Sicherung enthält ihn; Wortlaut „Gesamttext“ ohne Namen (R9-H4). |
| R8-H2 „Nur Stärke melden?“, Fokus und Sichtfläche | behoben | **hält** | Fokus auf „Abbrechen“, beide Knöpfe im Bild in vier Maßen; Folgesatz bei Zoom 200 % hinter dem Rollrand. |
| R8-H3 Lagemonitor am Telefon, F/U/M außerhalb | behoben | **hält, Nebenwirkung** | F/U/M im Bild in allen Maßen; bei großer Schrift verkehrte Größen (R9-H3). |
| R8-H4 Kasten zum beiseitegelegten Bogen | teilweise | **hält, teilweise** | Zwei Sätze, „Mehr dazu“; „Neuen Bogen erstellen“ bei 609 von 640 px (wie gemeldet). |
| R8-H5 Tipp-Sperre nach dem Öffnen einer Rückfrage | teilweise | **teilweise** | Rückfrage ab 400 ms; nach dem Seitenwechsel bis rund 1,4 s (R9-H5). |

Zu den Runde-8-Änderungen anderer Rollen, soweit sie meinen Weg berührten:

| Runde-8-Änderung | Bewertung Runde 9 | Beobachtung |
| --- | --- | --- |
| Rohtext-Rettung beschädigter Gesamttexte | **hält** | Siehe R8-H1. |
| Sprungmarke | **hält** | −8 px in 15 Kombinationen aus Maß und Zustand. |
| Rückfragen bei Zoom 200 % (Knöpfe untereinander, Rumpf rollt) | **hält** | „Nur Stärke melden?“ bedienbar; der Dialog „Bogen übergeben“ nicht mitgezogen (R9-H1). |
| Tipp-Sperre nach dem Öffnen einer Rückfrage | **teilweise** | Siehe R8-H5. |
| Zwei-Fenster-Rückfragen mit Werten | **hält** | dort/hier mit Namen und Personenzahl. |
| Lagemonitor (Telefon ohne Einheitentyp, Schrift folgt Systemschrift) | **hält, Nebenwirkung** | R9-H3. Messlogik und Stufenleiter am Fernseher nicht gemessen. |
| Nummern-Verschiebung in Rückfragen | **nicht gezielt geprüft** | „Nr. schon vergeben“ in der Schnellerfassung gesehen. |
| Sollstärke-Marke | **nicht gezielt geprüft** | Satz in Schritt 3 gesehen; Warnungen daneben (R9-H2). |
| Zug-Normalisierung „n. Zug“ | **hält** | Vier Schreibweisen, eine Gruppe. |
| CSV nach Nr., Umschrift im Papierfeld | **nicht geprüft** | Gehören nicht zum Helferweg. |
| Entwurfsanonymisierung-Hinweis | **hält** | 14-Tage-Ankündigung in Karte und Assistent. |
| Musterung, Fußleiste, Kopf bei 180 × 320 | **teilweise geprüft** | Fußleiste 70 von 320 px (22 %), einzeilig; Schrittleiste zweizeilig; Musterung nicht geprüft. |
| Kontrast in Musterung, iOS, Nacht | **nicht geprüft** | Sache der Sicht-Rolle. |
| Spaltenfolge der Einsatztabelle | **nicht geprüft** | Tabelle nur kurz gesehen. |
| Späte Rückkehr eines eigenen `history.back()` | **nicht prüfbar** | Mit `goBack()` ist die Schrittfolge richtig; die Geräte-Geste fehlt (*Risiko*). |

Bekannte Grenzen, nur Stand:

| Grenze | Stand Runde 9 |
| --- | --- |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | nicht geprüft |
| R7-G4/M8 Ecken-Knopf hochkant | unverändert (Balken 170 × 44 px bei y = 590) |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | nicht erneut gemessen |
| R7-N1 kein Zusammenführen-Tipp | nicht berührt |
| R7-N9 Ziffern der Schrittleiste | Reiter 44 × 44 px, Abstand 0 px, Zustandswort dabei |
| R8-A1 Sollstärke zählt mit, mit Marke | Satz in Schritt 3 verständlich |
| R8-M6 klebende Namensspalte 37–42 % | nicht geprüft |
| R8-H5/S4 Prellschutz 450/800 ms | Rückfrage ab 400 ms, Seitenwechsel bis rund 1,4 s (R9-H5) |

## Abschluss

- **Aufgabe geschafft:** Neuer Bogen bis zur Übersicht: ja. Angefangenen Bogen
  übergeben: ja, bei Zoom 200 % mit Rollen (R9-H1). Einheit am Meldekopf aufnehmen:
  ja. Zug zuordnen, Abrücken, Rückgängig: ja. Zurück durch den Assistenten: ja.
  Beschädigten Speicher bemerken: ja. Ohne Netz arbeiten: ja.
- **Fremde Hilfe nötig:** nein, außer beim beschädigten Speicher, wo die Datei an
  den Betreuer geht.
- **Mentales Modell:** Papierbogen aus der Mappe, Fehlendes streichen, vorzeigen;
  am Meldekopf: scannen oder von Hand eintragen, zählen, weitergeben.
- **Größtes Einsatzrisiko:** Kein P0 oder P1. Am nächsten kommt R9-H1: Der
  Übergabe-Dialog bei Zoom 200 % mit Wortbruch und weit unten liegendem
  Hauptweg.
- **Top-Priorität für die nächste Iteration:** „Bogen übergeben“ bei 180 × 320 wie
  die Rückfragen verdichten (R9-H1); danach die Warnungen der Schnellerfassung auf
  das beschränken, was der Helfer erfasst hat (R9-H2).

**Verständnisprüfung**

- Orientierung: **verstanden**. Schrittleiste mit Zustandswort, „Aufnahme für:
  Hochwasser Musterstadt“, „Schnellerfassung“ im Kopf, Sammlung mit Summen.
- Nächster Schritt: **verstanden**. „Fortsetzen“, „Bogen übergeben…“, „In Einsatz
  übernehmen“ über „Weiter“.
- Systemzustand: **verstanden**. „✓ gespeichert · … nur auf diesem Gerät“,
  Offline-Zeile, Pille „Einen Moment …“ (flüchtig), Hinweis zum beschädigten
  Speicher.
- Fehlerbehebung: **verstanden**. „Rückgängig“ nach „Abrücken“, Rückfragen mit
  Zahlen, „Nr. schon vergeben“, Beiseitelegen. Lücke: Weg zurück zur beiseite-
  gelegten Sammlung (R9-H4).
- Feldtauglichkeit: **geeignet, nicht vollständig geprüft**. Handschuhe,
  Sonnenlicht, Kamera-Scan, Bildschirmtastatur, native Datumsauswahl, echter
  Browser-Zoom und die Zurück-Geste der installierten App gehören in einen
  Praxistest.
