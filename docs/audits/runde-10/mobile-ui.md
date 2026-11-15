# Audit „Mobile UI", Runde 10 (Darstellung und Bedienung auf dem Telefon)

Stand: 25.10.2026 · Prüfer: Rollenaudit `mobile-ui-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `441811c` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Bericht prüft nach, was
[Runde 9](../runde-9/mobile-ui.md) samt „Stand der Behebung" in
[Runde 9, README](../runde-9/README.md) festgestellt hat, und die Umbauten aus
Runde 9 an Zahlenfeldern, Rückfragen, Rohtext-Rettung, Lagemonitor, Tabelle der
Einsatzansicht und Zoom-Layout. Dazu die parallelen Änderungen aus der
Erprobung: Feld „Ort der Einheit (Pflicht)", Einheiten-Anzahl-Fläche,
linksbündige Organisationslisten.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, jeder Lauf in einem
eigenen Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten. Der
Server wurde weder neu gebaut noch angehalten. Viewports: 360 × 640 (Grundlage),
320 × 568, 640 × 360 (quer), Tablet 820 × 1180 und 1180 × 820, dazu
`html { font-size: 200% }` (im Folgenden „200 %", am 320er Telefon) und die
Nachbildung eines Browser-Zooms von 200 % am 360er Telefon: Fenster
180 × 320 Layout-Pixel bei Skalierung 4 (im Folgenden „180 × 320").

Zustände kamen aus `localStorage`-Seeds, alle mit `uebung: false` und Stand auf
heute: `eeb.entwurf.v1` (THW Oldenburg, Verstärkter Bergungszug, 38 Personen;
für „Nur Sollplätze" dieselbe Meldung mit leeren Namen), `eeb.einsaetze.v1`
(Sammlung „Hochwasser Musterstadt", 6 Meldungen) und ein abgeschnittener
Rohtext (`[{"id":"s1","name":"Kaputt","eintraege":[{`). Ein leerer Bogen entstand
durch „Neuen Bogen erstellen". Der Hinweis „Zeitraum vorbei" an den Karten der
Sammlung stammt aus den Daten der Übungsbögen und wird nicht gewertet.

Durchlaufen habe ich: Startseite (leer, mit Entwurf, mit beschädigtem
Gesamttext), Assistent Schritt 1 bis 6, Rückfragen „Sofortbedarf entfernen?",
„Bogen schließen?" und „Nur Sollplätze, keine gemeldete Stärke" (mit
Sammlungswahl), Einsatzansicht als Karten und Tabelle, manuelle Aufnahme
(Schritt 1), Lagemonitor (`?lagemonitor=<id>` samt „Optionen" und Stufentasten),
Tablet.

Gemessen habe ich `scrollWidth` gegen `innerWidth`, Lage und Höhe fester und
klebender Leisten, Maße und Abstände der Ziele, Schriftgrößen im Lagemonitor,
Lage der Rückfrage-Knöpfe gegen das Fenster, Spaltenbreiten der Tabelle,
Fokus nach dem Öffnen von Rückfragen und Eingabefelder (`inputmode`,
`enterkeyhint`, Breite). Aussagen zu Lage und Größe habe ich am Screenshot
gegengeprüft.

Reihenfolge: Ich habe zuerst blind getestet (Startseite, Assistent,
Einsatzansicht, Lagemonitor, erste Messläufe) und den Bericht aus Runde 9 samt
„Stand der Behebung" danach gelesen; die gezielten Nachmessungen zu den Befunden
R9-M1 bis R9-M9 folgten dem Lesen. Skripte und Screenshots liegen außerhalb des
Repositorys im Scratchpad (`.../scratchpad/runde10/m/`).

**Prioritäten:** Der Skill verwendet Critical / High / Medium / Low; abgebildet
auf P0 / P1 / P2 / P3.

**Kennzeichnung:**
- *gemessen*: im Testbrowser mit Zahlen reproduziert;
- *beobachtet*: im Testbrowser gesehen, ohne eigene Messreihe;
- *Risiko*: aus Code oder CSS abgeleitet, nicht nachgestellt.

**Nicht prüfbar / nicht erreicht:**
- echte Geräte mit Systemschrift (die 200 % sind `html { font-size: 200% }`,
  der Zoom ist eine Nachbildung durch ein kleineres Fenster), echte
  Bildschirmtastatur, Browserleisten (`vh`/`dvh`), Safe-Area-Einsätze, WebKit,
  Kamera, Handschuhe, Licht;
- Datums- und Zeitfelder zeigen im Testbrowser „mm/dd/yyyy" bzw. „--:-- --"
  (Eigenheit von Headless-Chromium, nicht gewertet);
- **nicht geprüft** in dieser Runde: Rückwege (Stapel für Meldungen, Fahrzeug und
  Ebene im Sitzungsspeicher), Zwei-Fenster-Lage, Musterung der Vorlage, Druck-CSS
  und ASCII-Dateinamen, Zug-Normalisierung, Umschrift der Personenliste und die
  Sollstärke-Marke in CSV, Excel und Lageblatt; sie gehören eher in die Berichte
  zu Fehlerrückweg und Export. Die Tipp-Sperre von 600 ms habe ich nicht
  gemessen (sie fiel bei Läufen mit schnellen Tipps nur als verworfene Tipps
  auf);
- bekannte Grenzen, deren Stand unten steht und die nicht erneut gemeldet sind:
  R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R8-H5/S4, R9-M3
  (siehe R10-M2), R9-G5.

## Urteil

Die Umbauten aus Runde 9 halten im Kern, gemessen. Zahlenfelder nehmen „1,5" mit
Satz „auf ganze Liter gerundet: 2", lehnen „−5" mit Satz ab, verwerfen „abc" mit
Satz und tragen `inputmode="numeric"` und `enterkeyhint="next"`. Die Rückfrage
beim Ausschalten von „Sofortbedarf erfassen" startet auf „Behalten" (360, 320 mit
200 %, quer, 180 × 320, Knöpfe 44 px). Die Wahl-Rückfrage „Nur Sollplätze, keine
gemeldete Stärke" hat alle drei Wege im festen Fuß, in jeder geprüften Lage
(R9-M2 behoben). Im Lagemonitor sind die Kernzahlen in allen Lagen größer als die
Beschriftungen (R9-M1 behoben), die Stufentasten heißen „Dunkler" und „Heller" mit
Zustandszeile „Stufe: …" und einer Sperre nach dem Wechsel (R9-M9 behoben). Die
Speicherzeile steht jetzt in jeder Lage (R9-M5), die Kurz-Liste ist kürzer
(R9-M4 teilweise), die klebende Spalte der Tabelle hat bei 180 × 320 nur noch
25 % (R9-M3), „Bogen schließen?" startet auf „Abbrechen" (R9-M7). Kein
seitlicher Überlauf in keiner geprüften Lage, auch nicht am Tablet.

Neu und am deutlichsten: Der Hinweis „antippen zum Beheben" für das neue
Pflichtfeld „Ort der Einheit" springt auf die Überschrift von Schritt 1; das Feld
liegt 141 px (360 × 640) bis 667 px (320 × 568, 200 %) unter dem Fußrand, der
Hinweis nennt es noch „Name der eigenen Einheit" (R10-M1). Der Rest sind kleine
Stellen: Wortbruch in der Tabelle bei 180 × 320 als Nebenwirkung der schmalen
Namensspalte (R10-M2), ein Kopf der Einsatzansicht, der bei großer Schrift und im
Zoom das erste Bild füllt (R10-M3), Fehlerhinweise der Zahlenfelder in einer
112-px-Spalte (R10-M4), uneinheitliche Feldbreiten und abgeschnittene
Auswahltexte (R10-M5), aneinanderstoßende Ansicht-Kacheln (R10-M6), eine
Anzahl-Fläche, die wie ein Knopf aussieht (R10-M7), enge Abstände und ein
schmaler Textstreifen in der Wahl-Rückfrage im Zoom (R10-M8) und die weiter
lange Kurz-Liste (R10-M9).

Die Hauptaufgabe, einen Bogen erfassen und übergeben, gelingt in allen
geprüften Lagen. Die Befunde sind 0 × P0, 0 × P1, 1 × P2, 8 × P3.

## Befunde

### R10-M1 [P2] „Antippen zum Beheben" für das Pflichtfeld „Ort der Einheit" landet auf der Überschrift von Schritt 1, das Feld liegt unter dem Fußrand

**Priorität:** P2

**Kennzeichnung:** gemessen (Lage des Feldes, Fokus), im Screenshot beobachtet
(`n4-telefon.png`). Der Wortlaut ist in
[R10-O3](offline-und-speicher.md) beschrieben; hier geht es um das Ziel des
Sprungs.

**Fundstelle:** Übersicht (Schritt 6), Liste „⚠ 3 offene Punkte für die
Weitergabe — antippen zum Beheben": Eintrag „Zugehörigkeit: Der Name der eigenen
Einheit (unterste Ebene) fehlt." → Schritt 1, Feld „Ort der Einheit (Pflicht)".

**Beobachtung:** Bei einem neuen Bogen ohne Ort tippe ich den Eintrag. Schritt 1
öffnet, der Fokus liegt auf `H2 „1. Einheit"` (`document.activeElement`), die
Seite steht bei `scrollY` 0. Das Feld „Ort der Einheit (Pflicht)" ist ein
Eingabefeld darunter (192 bis 203 px breit), nach den Feldern Organisation,
Organisationsname, Einheitstyp, dem Erklärtext und der Auswahl „Ebene":

| Lage | Oberkante des Feldes | Oberkante der Fußleiste | Abstand unter dem Fußrand |
| --- | --- | --- | --- |
| 360 × 640 | 711 px | 570 px | 141 px |
| 320 × 568, 200 % | 1 157 px | 490 px | 667 px |
| 180 × 320 | 834 px | 262 px | 572 px |

Der Eintrag „Ort/Auftrag ist noch leer." dagegen springt in Schritt 2 auf das
Feld selbst (`INPUT`, Oberkante 286 px bei 360 × 640, im Bild). Der Hinweis nennt
das Feld „Name der eigenen Einheit (unterste Ebene)", das Feld heißt aber „Ort
der Einheit".

**Erwartung der Rolle:** Ein Eintrag mit „antippen zum Beheben" bringt das Feld
ins Bild und setzt den Fokus darauf, wie es der zweite Eintrag der Liste schon
tut.

**Folge:** Mittel: Wer den Hinweis antippt, sieht Organisation und Einheitstyp
und nicht das fehlende Feld; ein Name wird gesucht, den es so nicht gibt. Die
Weitergabe ist nicht blockiert (der Hinweis bleibt eine Warnung), aber der
Pflichtpunkt der ersten Übergabe bleibt leicht liegen, wenn man in Eile nicht
nach unten rollt. Bei 200 % liegt das Feld mehr als eine Bildschirmhöhe tiefer.

**Empfehlung:** Den Sprung auf das Feld „Ort der Einheit" setzen (Fokus und in
den sichtbaren Bereich oberhalb der Fußleiste rollen) und den Text des Hinweises
und des Erklärtextes zur Bezeichnung angleichen.

**Nachprüfung:** Neuer Bogen, Schritt 6, Eintrag „Zugehörigkeit …" tippen: das
Feld „Ort der Einheit" trägt den Fokus und liegt vollständig über der
Fußleiste, bei 360 × 640, 320 × 568 mit 200 % und 180 × 320.

### R10-M2 [P3] Tabelle bei 180 × 320: klebende Spalte jetzt 45 px, Namen und Kopf brechen mitten im Wort

**Priorität:** P3

**Kennzeichnung:** gemessen und im Screenshot beobachtet (`tb2.png`); im
Zoom-Fenster nachgebildet, echter Zoom ist Risiko. Nebenwirkung der Behebung von
R9-M3.

**Fundstelle:** Einsatzansicht, „Tabelle", klebende Spalte „Einheit"
(`.tabellen-scroll`).

**Beobachtung:** Die Spalte ist 45 px breit (Rahmen 178 px, 25 %; Runde 9: 95 %).
Die Spalten „Zug", „F", „U", „M" liegen damit im Bild. Der Preis: Der Kopf
„EINHEIT" bricht in „EIN / HEI / T", der Name der ersten Zeile in „Nr. 1 / THW /
Hamb / urg / Mitte / Fachgr / uppe / Logisti / k- / Materi …"; die Zeile ist 210 px
hoch (66 % der Fensterhöhe). Bei 360 × 640 (326 px Rahmen, Spalte 120 px, 37 %),
bei 320 × 568 mit 200 % (75 px, 26 %) und quer (132 px, 24 %) ist das Bild
stimmig; die 37 % bei 360 × 640 sind die bekannte Grenze R8-M6.

**Erwartung der Rolle:** Bei schmaler Spalte entfällt der lange Name zugunsten
der Nummer; Wörter brechen nicht mitten in der Silbe.

**Folge:** Gering: Im 180er Fenster sind die Zahlen zu erreichen, aber die
Namenszelle ist kaum lesbar und eine einzige Zeile füllt zwei Drittel des Bildes.
Die Karten bleiben der Hauptweg.

**Empfehlung:** Unter etwa 240 px Rahmenbreite nur „Nr. 3" (und Kurzform) in der
klebenden Spalte führen; den Namen in der Zelle der Karte oder in einer
aufklappbaren Zeile zeigen.

**Nachprüfung:** 180 × 320, Tabelle: kein Wort bricht mitten im Wort, Zeilen
höchstens etwa 60 px, „F" liegt im Bild.

### R10-M3 [P3] Kopf der Einsatzansicht füllt bei großer Schrift und im Zoom das erste Bild; vier Ansicht-Kacheln plus fester Balken „◐ Ansicht"

**Priorität:** P3

**Kennzeichnung:** gemessen (Höhe von `header`, Lage von „Bogen scannen…"), im
Screenshot beobachtet (`ea-klein_1_g.png`); Zoom nachgebildet.

**Fundstelle:** Einsatzansicht (Sammlung geöffnet), Kopf mit „Ansicht:" (vier
Kacheln „Standard normal / Feld große Tasten / Dunkel abends / Nacht gedimmt"),
Titel, Meta; fester Balken `div.anzeige-balken` unten.

**Beobachtung:**

| Lage | Höhe des Kopfes | Anteil am Fenster | „Bogen scannen…" bei | fester Balken |
| --- | --- | --- | --- | --- |
| 360 × 640 | 225 px | 35 % | 429 px | 57 px |
| 640 × 360 | 117 px | 33 % | 250 px | 52 px |
| 320 × 568, 200 % | 421 px | 74 % | **767 px** (unter dem Bild) | 57 px |
| 180 × 320 | 381 px | **119 %** | **623 px** (unter dem Bild) | 53 px |

Bei 320 × 568 und 200 % steht im ersten Bild „‹ Startseite", die vier Kacheln in
zwei Reihen, der Titel, die Meta-Zeile und eine halbe Zahlenkachel; im 180er
Fenster füllt der Kopf allein mehr als das Fenster. Zugleich steht derselbe
Wähler zweimal da: als aufgeklappte Kacheln im Kopf und als fester Balken „◐
Ansicht: Standard" unten, während Startseite und Assistent den Wähler eingeklappt
(„Ansicht: Standard ▾") zeigen.

**Erwartung der Rolle:** Der Kopf bleibt bei großer Schrift kleiner als die Hälfte
des ersten Bildes, der Hauptweg („Bogen scannen…") und die Summe liegen im Bild;
der Ansicht-Wähler ist auf allen Seiten gleich gebaut.

**Folge:** Gering: Wer mit großer Schrift oder im Zoom in der Sammlung steht, rollt
zuerst durch den Kopf. Der Fall ist selten; der Balken unten bleibt als zweiter
Weg. (Der Ecken-Knopf „◐" selbst, R7-G4/M8, ist bekannte Grenze; hochkant ist er
170 × 44 px breit und quer 47 × 44 px.)

**Empfehlung:** Den Wähler in der Einsatzansicht wie auf den anderen Seiten
einklappen (ein Knopf „Ansicht: Standard ▾") und die Meta-Zeile bei Zoom auf eine
Zeile kürzen.

**Nachprüfung:** Sammlung öffnen bei 320 × 568 mit 200 % und 180 × 320: Kopf
höchstens 40 % des Fensters, „Bogen scannen…" im ersten Bild.

### R10-M4 [P3] Fehlerhinweis der Zahlenfelder steht in der Feldspalte (112 px): sieben Zeilen, bei 180 × 320 teilweise hinter der Fußleiste

**Priorität:** P3

**Kennzeichnung:** gemessen (Breite und Höhe des Hinweises), im Screenshot
beobachtet (`zf-_5.png`, `zf2-quer.png`).

**Fundstelle:** Schritt 5, Felder „Diesel (l)", „Benzin (l)", „Gemisch (l)",
„Verpflegung (Personen)"; Hinweise „Minus geht nicht — „-5" wurde nicht
übernommen. Die Menge ohne Vorzeichen eintragen." und „„abc" ist keine Zahl —
nicht übernommen."

**Beobachtung:** Der Satz steht unter dem Feld in einer Spalte von 112 px Breite
und 13 px Schrift:

| Lage | Breite × Höhe des Hinweises | Lage des Hinweises | Fußleiste |
| --- | --- | --- | --- |
| 360 × 640 | etwa 125 × 190 px | unter dem Feld, schiebt die Zeile | – |
| 640 × 360 (quer) | 112 × 137 px | 163–300 px | ab 304 px |
| 180 × 320 | 112 × 137 px | 174–311 px | ab **262 px** |
| 320 × 568, 200 % | 224 × 96 px | 334–430 px | ab 490 px |

Die Feldspalte bleibt auch quer bei 640 px Fensterbreite 112 px schmal; die
Nachbarfelder („Ernährung (aus Personal)", „Benzin") rücken je nach Hinweis nach
unten, die Zeile wird ungleich. Bei 180 × 320 reicht der Satz hinter die
Fußleiste; ohne Rollen ist der Schluss („…ohne Vorzeichen eintragen.") verdeckt.
Der Wert „-5" bleibt im Feld stehen, bis das Feld verlassen wird (danach 0, wie
beschrieben). Die Hinweise selbst und die Rundung („„1,5" auf ganze Liter
gerundet: 2.") arbeiten wie in Runde 9 beschrieben.

**Erwartung der Rolle:** Der Hinweis zu einem Zahlenfeld steht in der vollen
Breite der Zeile, nicht in der Feldspalte.

**Folge:** Gering: Der Hinweis ist da und wird gelesen, erzeugt aber eine hohe,
schmale Textsäule, die die Nachbarfelder verschiebt, bei sehr engem Fenster teils
hinter der Leiste.

**Empfehlung:** Hinweise der Zahlenfelder über die ganze Breite des Blocks
(`grid-column: 1 / -1`) setzen oder in einer Zeile kürzen („Kein Minus.").

**Nachprüfung:** Schritt 5, „-5" in „Diesel": Hinweis höchstens zwei Zeilen hoch,
bei 180 × 320 nach dem Antippen ohne Rollen über der Fußleiste.

### R10-M5 [P3] Eingabefelder in Schritt 1 und 4 haben uneinheitliche Breiten, Auswahltexte werden abgeschnitten

**Priorität:** P3

**Kennzeichnung:** gemessen (Breiten), im Screenshot beobachtet
(`n1-telefon-a.png`, `tab-820-1.png`, `fz-1.png`).

**Fundstelle:** Schritt 1, Zeilen „Ebene (eigene Einheit)", „Ort der Einheit
(Pflicht)", „Dienststellen-Kürzel (optional)", „Telefon", „E-Mail", „Ebene
(übergeordnet)"; Schritt 4, „Fahrzeugtyp".

**Beobachtung:**

| Feld | 360 × 640 | 820 × 1180 |
| --- | --- | --- |
| Organisation (Auswahl) | 294 px | 371 px |
| Einheitstyp | 294 px | 754 px |
| Ebene (eigene Einheit) | 192 px | 192 px |
| Ort der Einheit (Pflicht) | 203 px | 203 px |
| Dienststellen-Kürzel | 192 px | 192 px |
| Telefon | 112 px | 112 px |
| E-Mail | 169 px (nebenan) | 697 px (eigene Zeile) |

Die Felder derselben Zeile haben drei verschiedene Breiten (192, 203, 192), die
rechte Kante läuft unruhig, am Tablet bleibt „Ort der Einheit (Pflicht)" ein
Feld von 203 px in einem Block von 754 px. Die Auswahl „Ebene (übergeordnet)" zeigt
„RB – Regionalbereicl" (abgeschnitten), „Fahrzeugtyp" zeigt „MTW gl –
Mannschaftst" (abgeschnitten, 100 % Schrift, 360 × 640); der Platzhalter „z. B.
GOLD für RSt Olde…" ist ebenfalls abgeschnitten. Die Beschriftungen von
„Ebene …", „Name" und „Telefon" stehen um 3 bis 6 px versetzt.

**Erwartung der Rolle:** Felder einer Zeile sind gleich breit und füllen die
Zeile; das Pflichtfeld ist nicht schmaler als eine optionale Angabe.

**Folge:** Gering: Der Text ist lesbar, der Abschnitt sieht unfertig aus; ein
abgeschnittener Auswahltext (Ebene, Fahrzeugtyp) verbirgt gerade den
unterscheidenden Teil („Regionalbereich" / „Mannschaftstransport").

**Empfehlung:** Feld- und Auswahlbreite je Zeile an einer Raster-Spalte
ausrichten; Auswahltexte der Ebene und des Fahrzeugtyps auf Kurzform
(„RB", „MTW gl") mit Langform in der Liste.

**Nachprüfung:** Schritt 1 bei 360 × 640 und 820 × 1180: gleiche rechte Kante in
einer Zeile, kein abgeschnittener Auswahltext.

### R10-M6 [P3] Ansicht-Kacheln stoßen ohne Abstand aneinander

**Priorität:** P3

**Kennzeichnung:** gemessen (Abstand 0 px in der Zielmessung), im Screenshot
beobachtet (`ea-quer.png`).

**Fundstelle:** Wähler „Standard / Feld / Dunkel / Nacht" (Einsatzansicht,
Startseite quer, Tablet; 77 × 44 bis 100 × 46 px).

**Beobachtung:** Die vier Knöpfe sind 44 bis 46 px hoch, zwischen ihnen liegen
0 px; die Ziele grenzen auch im Zoom-Fenster aneinander (bei 180 × 320
umbrechen sie in zwei Reihen ohne Abstand). Die gewählte Stufe ist durch die
dunkle Fläche kenntlich, nicht durch einen Haken.

**Erwartung der Rolle:** Ziele mit unterschiedlicher Folge (Standard, Feld,
Dunkel, Nacht) haben mindestens einige Pixel Abstand.

**Folge:** Gering: Ein Fehltipp wechselt die Anzeige (zum Beispiel „Nacht"), was
umkehrbar ist; die Gegenseite ist der Griff in die Dunkelstufe bei Tageslicht.

**Empfehlung:** 6 bis 8 px Abstand oder eine Auswahlliste („Ansicht: Standard ▾")
wie auf der Startseite hochkant.

**Nachprüfung:** Einsatzansicht bei 360 × 640: Abstand zwischen den Kacheln
mindestens 6 px.

### R10-M7 [P3] Einheiten-Anzahl-Fläche sieht wie ein gedrückter Knopf aus, tut aber nichts

**Priorität:** P3

**Kennzeichnung:** beobachtet im Screenshot (`s-1.png`, `ea-quer.png`), Farben
gemessen; der Tipp bewirkt nichts (`scrollY` 0, kein Hash).

**Fundstelle:** Einsatzansicht, Zahlenleiste: Kachel „6 EINHEITEN".

**Beobachtung:** Die Kachel ist die einzige der fünf Zahlenkacheln mit grauer
Fläche (`rgb(232, 235, 242)`), einem 3 px breiten Balken am rechten Rand und
gedämpfter Schriftfarbe (`rgb(92, 100, 120)`; die Zahlen Führer/Unterführer/
Mannschaft sind `rgb(17, 20, 27)`). Das Element ist ein `div.anzahl` ohne Aufgabe;
ein Tipp darauf bleibt ohne Wirkung. Die Darstellung gleicht einem gewählten
Reiter oder gedrückten Knopf. In den Ansichten Dunkel, Nacht und Feld ist sie in
gleicher Art abgesetzt.

**Erwartung der Rolle:** Was nicht tippbar ist, sieht nicht wie ein Knopf aus.

**Folge:** Gering: Wer „6 Einheiten" tippt, in der Erwartung zur Liste zu springen
(dafür gibt es „Zur Einheitenliste ↓"), erhält keine Antwort.

**Empfehlung:** Die Fläche wie die anderen Kacheln ohne Füllung und Balken
darstellen, die Anzahl nur durch Schrift trennen; oder den Tipp auf die Liste
legen.

**Nachprüfung:** Einsatzansicht: Der Tipp auf „6 Einheiten" springt zur Liste
oder die Kachel unterscheidet sich nicht mehr von einer Anzeige.

### R10-M8 [P3] Wahl-Rückfrage bei 180 × 320: alle Wege im Fuß, aber nur zwei Textzeilen im Rumpf und 6 px zwischen den beiden Wegen mit Wirkung

**Priorität:** P3

**Kennzeichnung:** gemessen (Lage der Knöpfe), im Screenshot beobachtet
(`wr-telefon_2-2.png`).

**Fundstelle:** Rückfrage „Nur Sollplätze, keine gemeldete Stärke" (Übersicht →
„In Einsatz-Sammlung ablegen…" → Sammlung wählen).

**Beobachtung:** R9-M2 ist behoben: „Stärke jetzt eintragen", „Als Sollstärke
ablegen" und „Abbrechen" liegen in allen Lagen im festen Fuß (360 × 640:
419–463, 475–519, 543–587; 320 × 568 mit 200 %: 379–423, 447–491, 515–559; quer
nebeneinander 149 × 58 px; 180 × 320: 145–189, 195–239, 251–295). Im 180er Fenster
steht über den Knöpfen ein Streifen aus der Überschrift und zwei Textzeilen („Für
„THW Oldenburg (NI) Verstärkter …"); die Erläuterung der beiden Wege (was die
Sollstärke in den Summen bewirkt) liegt im rollenden Rumpf. Der Abstand zwischen
den beiden Wegen mit Wirkung ist dort 6 px (Layout-Pixel), zu „Abbrechen" 12 px.

**Erwartung der Rolle:** Die Wege sind im Bild und wirkungsvolle Wege haben
Abstand zueinander.

**Folge:** Gering: Die Knöpfe sind erreichbar; wer im Zoom schnell tippt, wählt
leicht den falschen von zwei benachbarten Wegen. „Als Sollstärke ablegen" ist
nicht ungeschehen zu machen, ohne den Eintrag zu bearbeiten, aber die Marke
„Sollstärke, nicht gemeldet" macht den Zustand sichtbar.

**Empfehlung:** Im Zoom den Abstand zwischen den Wegen auf mindestens 12 px
setzen; den Kurztext der Wege in den Knopf („Als Sollstärke ablegen — zählt
mit") ziehen.

**Nachprüfung:** 180 × 320: Abstand der beiden oberen Knöpfe mindestens 12 px.

### R10-M9 [P3] Kurz-Liste der Personen: 148 px je Person bei 360 × 640 (275 px bei 180 × 320), Seite weiter 6 945 bis 12 364 px

**Priorität:** P3

**Kennzeichnung:** gemessen (Abstand der Vorname-Felder, Seitenhöhe), im
Screenshot beobachtet (`m5-telefon.png`).

**Fundstelle:** Schritt 3, „Alle Angaben (Karten)" / „Kurz-Liste (Tabelle)",
38 Personen, Vorgabe Kurz-Liste.

**Beobachtung:** Der Abstand von Person zu Person ist 148 px (360 × 640; Runde 9:
230 px), 175 px (320 × 568, 200 %), 148 px (quer), 275 px (180 × 320). Die Seite
ist 6 945 px hoch bei 360 × 640 (Runde 9: 10 057 px), 9 866 px bei 320 × 568 mit
200 %, 12 364 px bei 180 × 320. Je Person stehen die Zeile „▲ ▼ ⇑ ✕" und zwei
Eingabezeilen; die Ziele sind 44 × 44 px mit 4 bis 5 px Abstand. Das Ziel aus
Runde 9 (höchstens 120 px je Person) ist noch nicht erreicht.

**Erwartung der Rolle:** Die Kurz-Liste bleibt bei 38 Personen unter etwa 4 500 px.

**Folge:** Gering: Die Liste ist gut ein Drittel kürzer, mit über zehn
Bildschirmseiten für 38 Personen aber weiter schwer zu überblicken.

**Empfehlung:** Bedienzeile ▲ ▼ ⇑ ✕ in die Zeile mit dem Namen legen oder erst
beim Tippen auf die Person einblenden.

**Nachprüfung:** 360 × 640, Schritt 3 mit 38 Personen: Abstand von Person zu
Person höchstens 120 px.

## Bestätigtes

- **Kein seitlicher Überlauf:** `scrollWidth` gleich `innerWidth` auf Startseite
  (360, 320, quer), Assistent Schritt 1 bis 6 (360 × 640, 320 × 568 mit und ohne
  200 %), Schritt 1 und 5 bei 180 × 320, Einsatzansicht (360, quer, 320/200 %,
  180 × 320, Tablet 820 × 1180 und 1180 × 820), Tabelle, Lagemonitor, Dialoge.
- **Zahlenfelder (R9-E1):** `type="text"`, `inputmode="numeric"`,
  `enterkeyhint="next"`, 112 × 44 px; „1,5" meldet „auf ganze Liter gerundet: 2.",
  „-5" und „abc" werden mit Satz abgelehnt, „12 345" und „1.000" werden gelesen
  (mit Warnung bei 12.345 l Diesel für 10 Fahrzeuge: „Stimmt das?"); nach dem
  Verlassen des Feldes steht der angenommene Wert.
- **Rückfrage „Sofortbedarf entfernen?" (R9-D1):** nennt, was verloren geht
  („Diesel 620 l, Benzin 40 l, Gemisch 20 l, Unterbringung, Ruhezeit"), Fokus auf
  „Behalten", Knöpfe 44 px (262 bis 302 px breit; quer 235 px nebeneinander),
  in allen vier Lagen im Bild.
- **Rückfrage „Bogen schließen?":** Fokus auf „Abbrechen" in allen vier Lagen,
  Abstand der Knöpfe 24 px (hochkant 367–411/435–479, quer 308/332), Oberkanten
  quer gleich (225/225).
- **Rohtext-Rettung (R9-O1, M6):** Hinweis „Nicht lesbar: Sammlung „Kaputt"." ist
  eingeklappt (›), „Neuen Bogen erstellen" liegt bei 360 × 640 bei 459–504 px im
  ersten Bild, quer bei 346–391 px; aufgeklappt stehen „Daten sichern…" und
  „Beiseitegelegtes entfernen…" (44 px) davor, der Hauptweg rückt auf 802 px. Bei
  320 × 568 mit 200 % liegt „Neuen Bogen erstellen" auch eingeklappt bei
  827–1011 px (nicht im ersten Bild).
- **Lagemonitor (R9-M1, K5, L1 bis L3):** Zahlen größer als Beschriftungen in
  allen Lagen (360 × 640: Zahlen 20 px, Gesamt 23 px, Beschriftung 14 px;
  320 × 568, 200 %: 28/32/20 px; 180 × 320: 16/18/11 px); Tabelle ohne Ort-Spalte
  am Telefon, Funkruf mit Ort („Heros Hamburg 1/63/44 Hamburg Mitte"); Knöpfe
  „Dunkler", „Heller (weiß)", „Vollbild", „Schließen" 44 bis 47 px hoch, Zustand
  als Text „Stufe: Dunkel / Gedimmt / Hell"; die Sperre hält: Tipp auf „Heller"
  innerhalb von 1,5 s nach einem Stufenwechsel wartet, bis die Taste wieder frei
  ist (`aria-disabled`). Die Beschriftung der Taste wechselt zwischen „Heller
  (weiß)" und „Heller" (113 px zu 80 px Breite), das Ziel springt dabei
  seitlich.
- **Speicherzeile (R9-M5):** „✓ gespeichert · 10:22 Uhr · nur auf diesem Gerät"
  steht bei 360, 320/200 % und quer; bei 180 × 320 als „✓ 10:22" im Kopf.
- **Kopf bei 180 × 320 (R9-M8):** Kopf 95 px (30 %), Fußleiste 58 px (18 %); das
  Formular hat 52 % des Fensters.
- **Wahl-Rückfrage (R9-M2):** alle drei Wege im festen Fuß in allen vier Lagen
  (siehe R10-M8 für den Rest).
- **Sprungmarke:** `Zum Inhalt springen` liegt ohne Fokus bei −44 bis −8 px
  (bei 200 % −63 bis −50 px) außerhalb des Bildes.
- **Tablet:** Assistent Schritt 1 und Einsatzansicht ohne Überlauf; Felder
  wachsen mit, Ziele 44 px.

## Abgleich mit Runde 9

Legende: **hält**, **teilweise**, **nicht behoben**.

| Befund Runde 9 | Stand in Runde 10 | Nachweis |
| --- | --- | --- |
| R9-M1 Lagemonitor 200 %: Kernzahlen kleiner als Beschriftungen | **hält** | Zahlen 28/32 px gegen Beschriftung 20 px bei 320/200 %; Größen an einer Basis. Wortbruch in Zellen bei 200 % nicht erneut im Bild ausgewertet. |
| R9-M2 Wahl-Rückfrage: zwei Wege im Rumpf | **hält** | alle drei Wege im Fuß; Rest R10-M8 (Abstand, Textstreifen im Zoom). |
| R9-M3 klebende Spalte 95 % bei 180 × 320 | **hält, mit Nebenwirkung** | 45 px (25 %); Wortbruch und 210 px hohe Zeilen, R10-M2. |
| R9-M4 Kurz-Liste 230 px je Person | **teilweise** | 148 px, Seite 6 945 px bei 360 × 640; 275 px bei 180 × 320, R10-M9. |
| R9-M5 Speicherzeile bei großer Schrift und quer | **hält** | Zeile in allen Lagen, bei 180 × 320 als „✓ 10:22". |
| R9-M6 Rohtext-Kasten vor dem Hauptweg | **hält, mit Rest** | eingeklappt, Hauptweg 459–504 px; bei 320/200 % 827 px. |
| R9-M7 Fokus „Bogen schließen?" und Abstand | **hält** | Fokus „Abbrechen", 24 px Abstand in allen Lagen. |
| R9-M8 Kopf bei 180 × 320 | **hält** | 95 px (30 %), Formular 52 %. |
| R9-M9 Stufenknöpfe tragen Zustand und Aktion | **hält** | „Dunkler"/„Heller" und Text „Stufe: …"; Sperre 1,5 s. |

**Bekannte Grenzen (Stand):** R6-O9 nicht ausgelöst; R7-G4/M8 Ecken-Knopf
unverändert (hochkant 170 × 44 px, quer 47 × 44 px, siehe R10-M3);
R7-G8/H9 nicht erneut ausgelöst; R7-N1 nicht erneut gemeldet; R7-N9 Ziffern der
Schrittleiste: bei einem neuen Bogen stehen nur „1 2 3 4 5 6", mit Entwurf „2 ✓";
R8-A1 nicht eigens geprüft; R8-M6 37 % bei 360 × 640; R8-H5/S4 Prellschutz nicht
gemessen; R9-G5 feste Leisten: Balken „◐ Ansicht" 53 bis 57 px (17 bis 18 %) in
der Einsatzansicht, Fußleiste des Assistenten 58 bis 78 px.

**Nebenwirkungen der Umbauten aus Runde 9 und der Erprobung:**
- **Schmale Namensspalte bei Zoom:** gewonnener Platz für die Zahlen, verloren die
  Lesbarkeit der Namen (R10-M2).
- **Rückfragen mit festem Fuß:** halten; im Zoom enger Rumpf (R10-M8).
- **Fehlersätze der Zahlenfelder:** da, aber in der schmalen Feldspalte (R10-M4).
- **Feld „Ort der Einheit (Pflicht)":** Warnung und Sprungziel nicht nachgezogen
  (R10-M1; Wortlaut R10-O3); das Feld ist schmaler als die übrigen Felder der
  Zeile (R10-M5).
- **Einheiten-Anzahl-Fläche:** sieht wie ein Knopf aus (R10-M7).
- **Linksbündige Organisationslisten:** in der Auswahl „Organisation" am Telefon
  sind Einträge von „THW" bis „Sonstige" linksbündig und ohne Abschneiden
  lesbar; die Auswahlen „Ebene" und „Fahrzeugtyp" schneiden den Wert ab (R10-M5).

## Abschluss

Die Hauptaufgabe gelingt auf allen geprüften Telefon-Viewports bei 100 % und
200 % Schrift, am Tablet, quer und bei 180 × 320. Die Behebungen aus Runde 9
halten gemessen, mit zwei Resten (Kurz-Liste, Kasten bei 200 %). Offen ist ein
Befund mit Gewicht: das neue Pflichtfeld „Ort der Einheit" wird vom Hinweis der
Übersicht nicht erreicht (R10-M1). Der Rest sind kleine Stellen bei Zoom und
großer Schrift sowie Feinheiten der Feldanordnung.

Befunde: 0 × P0, 0 × P1, 1 × P2, 8 × P3.

**Zuerst beheben:**
1. R10-M1: Sprung und Wortlaut des Hinweises „Ort der Einheit" auf das Feld
   setzen, Fokus und sichtbar über der Fußleiste.
2. R10-M3: Ansicht-Wähler der Einsatzansicht einklappen, Kopf bei großer Schrift
   verkleinern.
3. R10-M2: Klebende Spalte der Tabelle im Zoom auf „Nr." verkürzen.
4. R10-M4: Fehlerhinweise der Zahlenfelder über die volle Breite setzen.
5. R10-M5 und R10-M9: Feldbreiten und Auswahltexte angleichen, Kurz-Liste weiter
   verkürzen.
