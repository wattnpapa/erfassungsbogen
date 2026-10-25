# Audit „Führungssicht", Runde 6 (Lage erfassen, Lagemonitor, Stand übergeben)

Stand: 17.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 03a0011.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-5-Befunde; neu in dieser Runde ist der **Lagemonitor** (Fernsehanzeige
für das Führungsfahrzeug).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch` auf Telefon und Tablet, Locale de-DE, Zeitzone des
Containers. Geräte: Telefon 360 × 640, Tablet 820 × 1180, Laptop 1366 × 768
(ab 72 rem zweispaltig), für den Lagemonitor zusätzlich 1920 × 1080 (ohne
Touch), 1366 × 768 und 1280 × 720. Jeder Lauf hatte einen eigenen
Browser-Kontext; elf weitere Prüfer nutzten denselben Server, Laufzeiten sind
unsicher. Ich habe zuerst ohne Blick in frühere Berichte getestet, danach den
Runde-5-Bericht samt „Stand der Behebung" und dessen README gelesen, zuletzt
die anderen Runde-6-Berichte (zum Teil nur Entwürfe).

Grundzustand über `localStorage`-Seeds (`eeb.einsaetze.v1`, `eeb.vorlagen.v1`)
aus `examples/thw/`, alle mit `uebung: false`.

**Lage „Hochwasser Neckar · Heilbronn, Neckarvorland"** (Art „Einsatz"):
23 gemeldete Einheiten, davon 20 zählend und 3 abgerückt (Cottbus,
Berlin-Tempelhof, Berlin-Lichtenberg); drei Zugetiketten („1. Bergungszug
Heilbronn", „2. Bergungszug Stuttgart", „Fachgruppen Nord", je 5 Einheiten),
5 Einheiten ohne Zug. Ausgangskopf: 20 zählend, 5 / 43 / 124 / 172.

**Folgemeldungen** habe ich über „Bögen einlesen…" eingespielt, nicht über
den Seed: Albstadt (−2 Helfer, später +1), Lichtenberg und Cottbus **nach dem
Abrücken**, zwei neue Einheiten (Gieboldehausen, Hannover/Langenhagen), dazu
eine Datei mit Fremdtext („murks.json") und doppelt eingelesene Dateien.
Zweites Gerät: zweiter Kontext mit Seed derselben Lage (18 Einheiten, 14
Minuten versetzt), Import der Sammel-PDF über „Einsatz importieren…".

Heruntergeladen und gegengelesen: Lageblatt (`pdftotext`, Bild; 3 Seiten),
Sammel-PDF (51 Seiten), Nachtrag-Sammel-PDF (56 Seiten), Übersicht-CSV, „Alle
Daten"-CSV, Excel „Oldenburg" (openpyxl), jeweils als Vollexport und als
Nachtrag. Die Zahlen habe ich zwischen App, Lageblatt, Exporten und Monitor
verglichen (nach den Folgemeldungen überall 5 / 45 / 123 / 173, 21 zählend,
51 Fahrzeuge). Die Screenshots habe ich angesehen.

**Lagemonitor** geprüft: Aufruf aus der Einsatzansicht (zweites Fenster) und
mit blockiertem Popup (gleiches Fenster), Zustände leer, nur abgerückt, mit und
ohne Einsatzbeginn, Beginn in der Zukunft, Beginn 31 Tage zurück, Übung, sehr
langer Name und Ort, Einsatz nicht vorhanden, Hell, 100 Einheiten, acht Züge,
Uhrzeitsprung um 75 Stunden (`page.clock`), Abrücken und Folgemeldung bei
offenem Monitor (Aktualisierung nach 60 bzw. 161 ms unter Last).

**Nicht prüfbar:** echter Fernseher, Sitzabstand und Umgebungslicht (die
Lesbarkeit aus drei Metern ist gerechnet, nicht gesehen), HDMI-Erweiterung und
Fensterwahl auf dem zweiten Bildschirm, Vollbild und Bildschirm-Wachhalten
(`requestFullscreen`/`wakeLock` im Headless-Chromium nicht beurteilbar),
Burn-in, echte Laufzeit über Stunden (nur Zeitraffer), Kamera und
Handscanner, WebKit/Safari, native Builds, echtes Drucken. Das Datumsfeld
„Einsatzbeginn" zeigt in diesem Chromium „mm/dd/yyyy"; wie es auf einem
deutschen System aussieht, ist nicht beurteilbar. Zeitmessungen unter Last.

## Urteil

Der Lagemonitor tut das Wichtigste richtig: Er zeigt aus drei Metern
lesbar Name, Ort, Datum-Zeit-Gruppe, Stärke als F / U / M // gesamt und die
Einsatzdauer („3 Tage, 4 Stunden, 0 Minuten"), nennt keine Personen, zeigt
dieselben Summen wie Einsatzansicht, Lageblatt und Exporte (nach drei
Folgemeldungen und einem Abrücken überall 173 bzw. 168) und zieht Änderungen
praktisch sofort nach. Weg hin und zurück funktionieren: „Schließen" bringt
auch ohne Popup in die App zurück, und ein gelöschter Einsatz gibt eine klare
Meldung statt einer leeren Seite.

Reibung entsteht bei der Aussage. Der Monitor zeigt, **wie viele** da sind,
aber nicht, **was sich bewegt hat**: Wer abrückt, lässt die Stärke ohne Spur
sinken; eine Folgemeldung, eine Rückkehr nach dem Abrücken, die Zahl der
Abgerückten, das Alter der Daten und ob es eine Übung ist — nichts davon
steht im Hauptbild (R6-K1, R6-K3). Der Platz geht an die Uhr (45 % der
Bildhöhe), die Stärke bekommt 10 % und keine Beschriftung (R6-K2). Der Beginn,
aus dem die Dauer entsteht, muss von Hand weit unten in der Einsatzansicht
gesetzt werden und reist nicht mit der Weitergabe (R6-K4, R6-K5).

Die Runde-5-Umbauten halten fast alle: Folgemeldung nach dem Abrücken
(Quittung, Karte, Lageblatt, Nachtrag in allen drei Formaten), „Nur neue
Bögen" je Format, „Anderer Einsatz?" in allen Exporten, „Hinweise" statt
„Rückfrage" (nirgends mehr „Rückfrage"), Lageblatt nach Nr. sortiert, Bedarf
im Lageblatt. Zwei Reste: Die Import-Quittung ist gegliedert, aber ein
Satz zu Nummernwechseln füllt den größten Teil (R6-K6), und der
„Anderer Einsatz?"-Hinweis verschwindet, sobald eine weitere abweichende
Einheit ein gleiches Wort nennt (R6-K7).

Die Aufgabe — Lage führen, Monitor einrichten, übergeben — lässt sich ohne
fremde Hilfe erledigen; wer den Monitor hinstellt, muss selbst wissen, dass er
Veränderungen nicht erklärt.

## Befunde

### R6-K1 [P1] Lagemonitor: Abrücken, Folgemeldung und Rückkehr ändern die Stärke ohne jede Spur; kein Datenstand; „alle abgerückt" sieht aus wie „leer" (neu)

**Priorität:** P1

**Kennzeichnung:** beobachtet und gemessen (1920 × 1080, Abrücken und
Folgemeldung bei offenem Monitor; Zustände „leer" und „alle abgerückt").

**Fundstelle / Aufgabe:** Lagemonitor, Hauptbild (Zeilen Name, Ort, Zeit,
Stärke, Dauer). Code: `src/app/lagemonitor-ui.tsx` (`Lagemonitor`),
`src/app/lagemonitor.ts` (`lagebild` verwirft Abgerückte über
`aktuelleMeldungen`, die Zahl der Abgerückten wird nirgends gebildet).

**Beobachtung:**
- Monitor offen, in der App „Abrücken" bei der ersten Karte: Die Stärke
  springt von „5 / 43 / 124 // 172" auf „4 / 42 / 122 // 168", nach 60 ms.
  Keine Meldung, keine Markierung, keine Zahl „abgerückt". Die abgerückte
  Einheit verschwindet auch aus „Zuletzt gemeldet" (zugeklappt, s. R6-K2).
- Folgemeldungen: Albstadt (4 → 2) und die Rückkehr von Lichtenberg
  („wieder anwesend") erscheinen im Monitor nur als „gerade eben" in
  „Zuletzt gemeldet", ohne den Zusatz „Folgemeldung" oder „wieder
  anwesend" — die App, das Lageblatt und alle Nachträge sagen es dort
  ausdrücklich. Die Summe steigt von 172 auf 173, ohne dass man erfährt,
  warum.
- Eine leere Sammlung und eine Sammlung, in der alle Einheiten abgerückt
  sind, zeigen beide „0 / 0 / 0 // 0" und „Einsatzbeginn nicht gesetzt" bzw.
  eine Dauer. Erst die zugeklappte Liste sagt bei „leer" „Noch keine Einheit
  gemeldet"; bei „alle abgerückt" gibt es keinen Hinweis.
- Kein Datenstand im Hauptbild: Die laufende Uhr tickt immer, auch wenn die
  letzte Meldung Stunden alt ist. Läuft der Monitor in einem anderen
  Browserprofil als die App (anderer Speicher), steht dort immerhin „Dieser
  Einsatz ist auf diesem Gerät nicht (mehr) vorhanden". Ein Monitor, der
  zwar Daten hat, aber nicht mehr aktualisiert wird (Risiko, nicht
  nachgestellt), ließe sich an der laufenden Uhr nicht erkennen.

**Erwartung der Rolle:** Wer vor dem Fernseher steht, sieht neben der Stärke
„21 Einheiten · 2 abgerückt · letzte Meldung vor 4 Min" und erkennt eine
Veränderung (Pfeil oder kurz hervorgehobene Zeile „Lichtenberg wieder da"),
ohne die App aufzurufen.

**Folge:** Die Führung diskutiert vor dem Bildschirm Zahlen, die sich
unerklärt bewegen („gerade waren es 172"). Bei „0 / 0 / 0 // 0" ist nicht zu
unterscheiden, ob noch niemand gemeldet hat oder alle fort sind — für eine
Lagedarstellung sind das zwei grundverschiedene Aussagen. Ein Hinweis auf
das Alter der Daten fehlt genau dort, wo ein Fernseher am längsten
unbeachtet läuft.

**Empfehlung:** Im Hauptbild eine Zeile mit Einheiten (anwesend / abgerückt)
und „letzte Meldung vor …". Folgemeldungen, Rückkehr und Abrücken der letzten
15 Minuten als kurze Ereigniszeile oder Marke in der Liste benennen („Abgerückt:
Cottbus", „wieder da: Lichtenberg"). Bei null Anwesenden den Grund nennen
(„noch nichts gemeldet" / „alle abgerückt").

**Nachprüfung:** Monitor auf 1920 × 1080 offen lassen, in der App eine Einheit
abrücken und eine abgerückte per Folgemeldung zurückholen: Beides muss im
Hauptbild ohne Aufklappen mit Namen stehen; leere und vollständig abgerückte
Lage müssen sich im Hauptbild unterscheiden.

### R6-K2 [P2] Lagemonitor: Die Uhr nimmt 45 % der Bildhöhe, die Stärke 10 % und keine Beschriftung; Einheiten und Fahrzeuge fehlen im Hauptbild (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (Schriftgrößen aus `getComputedStyle`, 1920 × 1080)
und beobachtet; Lesbarkeit aus drei Metern ist gerechnet, nicht gesehen
(Risiko).

**Fundstelle / Aufgabe:** Lagemonitor, Zeilen `lm-dtg` und `lm-r3`. Code:
`src/app/lagemonitor.css` (`.lm-dtg` 14 vh, die Uhrzeit mit 1,5 em; `.lm-r3`
6,4 vh), `src/app/lagemonitor-ui.tsx`.

**Beobachtung:**
- Die Datum-Zeit-Gruppe „17 **1109** okt 26" steht in 151 px, die Uhrzeit
  darin in 227 px, rot, in einer Zeile von 480 px Höhe (45 % von 1 080 px).
  Die Stärke „5 / 43 / 124 // 172" hat 69 px in einer Zeile von 105 px (10 %).
- Das Wort „Stärke" und die Beschriftung F / U / M / gesamt kommen im
  Hauptbild nicht vor; der Text steht nur als `aria-label`. Wer die Reihe
  nicht kennt, liest vier Zahlen.
- Einheiten (20) und Fahrzeuge (50) stehen nur im zugeklappten Abschnitt
  „Einsatzdaten"; die Aufteilung nach Zügen und die letzten Meldungen im
  zugeklappten Abschnitt „Einheiten" (dessen Überlauf siehe
  [nacht-und-sicht.md](nacht-und-sicht.md), R6-L2).
- Aus drei Metern: Eine Schrift von 69 px hat bei einem 55-Zoll-Fernseher
  (Pixel 0,63 mm) eine Versalhöhe von rund 31 mm; nach der Faustregel
  „Zeichenhöhe ≥ Abstand / 200" (15 mm) ist das reichlich. Die Zeilen in den
  Klappabschnitten haben 34,6 px, also rund 15 mm bei 55 Zoll und rund 12 mm
  bei 43 Zoll — an der Grenze bzw. darunter (Risiko).

**Erwartung der Rolle:** Die größte Schrift gehört der Zahl, nach der die
Führung fragt (Stärke), und sie trägt ein Wort („Stärke F / U / M // ges.").
Die Uhrzeit hängt an jeder Wand; sie darf kleiner sein.

**Folge:** Das Bild ist aus drei Metern gut lesbar, aber die Gewichtung
stimmt nicht mit dem Zweck überein. Die Zahlen, über die man sich abspricht
(Einheiten, Fahrzeuge, Stärke), sind ohne Maus nicht zu bekommen oder nicht
beschriftet.

**Empfehlung:** Zeit und Stärke ähnlich groß; ein Beschriftungswort an der
Stärkezeile; „Einheiten · Fahrzeuge" als vierte große Zeile, wie die
Status-Monitor-Zeilen. Zeilen in den Klappabschnitten auf mindestens
1,5-fache Größe, sobald sie dauerhaft sichtbar werden (siehe R6-L2).

**Nachprüfung:** 1920 × 1080: Stärke, Einheiten, Fahrzeuge und Stand ohne
Bedienung im Bild, jede Zeile mit einem Wort beschriftet; Schriftgröße der
kleinsten Zeile ≥ 48 px (≈ 21 mm bei 55 Zoll).

### R6-K3 [P2] Lagemonitor: Übung und Einsatz sind im Hauptbild nicht zu unterscheiden, sobald ein Ort eingetragen ist (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Sammlung der Art „Übung" mit Ort, Name ohne
das Wort „Übung") und im Code gelesen.

**Fundstelle / Aufgabe:** Lagemonitor, Zeile 2. Code:
`src/app/lagemonitor-ui.tsx` (`{bild.ort ? bild.ort : art}`); `lagebild`
berechnet `uebung`, die Oberfläche nutzt das Feld nicht.

**Beobachtung:** Zeile 2 zeigt den Ort, wenn einer gesetzt ist, und sonst die
Art („Einsatz", „Übung", „Veranstaltung"). Bei einer Übung mit Ort steht
im Hauptbild „Heilbronn, Neckarvorland" und sonst nichts; die Art steht nur
im zugeklappten Abschnitt „Einsatzdaten". In der Einsatzansicht der App ist
die Art dagegen sichtbar („Einsatz · Heilbronn, …" im Kopf), und
Übungsbögen zählen dort nicht in die Lage.

**Erwartung der Rolle:** Ein Fernseher, an dem Fremde vorbeikommen (Presse,
Behörden, Besuch), zeigt „ÜBUNG" deutlich, sonst ist der Bildschirm eine
Echtlage.

**Folge:** Übungszahlen können als Einsatzzahlen gelesen werden. Der Name der
Sammlung enthält das Wort nur, wenn jemand es hineinschreibt.

**Empfehlung:** Art immer in Zeile 2 nennen („Übung · Heilbronn, …"), bei
Übung zusätzlich ein dauerhaftes Kennzeichen im Rahmen.

**Nachprüfung:** Sammlung „Übung" mit Ort anlegen, Monitor öffnen: „Übung"
muss ohne Aufklappen im Bild stehen.

### R6-K4 [P2] Lagemonitor: Einsatzbeginn nur von Hand, unten in der Einsatzansicht, nicht in Weitergabe und Import; der Fernseher zeigt dauerhaft „Einsatzbeginn nicht gesetzt" (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Monitor ohne Beginn; zweites Gerät nach
Sammel-PDF-Import) und im Code gelesen.

**Fundstelle / Aufgabe:** `LagemonitorBlock` in `src/app/lagemonitor-ui.tsx`,
Speicher `eeb.lagebeginn.v1` (`src/app/lagemonitor-beginn.ts`); der Beginn
steht nicht in der Sammlung und damit weder in Sammel-PDF noch in
„Einsatz weitergeben / sichern".

**Beobachtung:**
- Ohne gesetzten Beginn steht in der Dauer-Zeile in 69 px „Einsatzbeginn nicht
  gesetzt". Die App leitet nichts ab, obwohl Eintreffzeiten da sind (erste
  Einheit eingetroffen 05:48) und die Sammlung ein Anlegedatum hat.
- Die Eingabe sitzt in der Einsatzansicht unter allen Karten: bei 23
  Einheiten auf dem Telefon bei 4 723 px von 6 929 px Seitenhöhe, auf dem
  Laptop bei 5 708 px, auf dem Tablet bei 6 273 px; je mehr Einheiten, desto
  weiter.
- Beim zweiten Gerät (Import der Sammel-PDF) ist der Beginn nicht gesetzt;
  die Ablösung, die die Lage übernimmt, sieht auf dem Fernseher wieder
  „Einsatzbeginn nicht gesetzt" und kennt den Wert nicht.
- Positiv: „Jetzt" setzt ihn mit einem Tipp, „Löschen" erscheint erst
  danach, ein Beginn in der Zukunft zeigt „Einsatz beginnt noch", 31 Tage
  zurück „31 Tage, 6 Stunden, 6 Minuten" ohne Überlauf; die Dauer rechnet
  nach einem Zeitsprung von 75 Stunden richtig weiter.

**Erwartung der Rolle:** Der Beginn kommt mit der Lage mit, oder die
Übergabe benennt ihn. Fehlt er, steht auf dem Fernseher keine
Fehlermeldung, sondern die Zeile entfällt oder zeigt den Vorschlag
„seit erster Meldung 05:48".

**Folge:** Die Dauer, die einzige Zeitgröße des Monitors, fehlt nach jeder
Übergabe und bei jedem neuen Einsatz, bis jemand das Feld findet. Auf dem
Fernseher sieht die leere Einstellung wie ein Fehler aus.

**Empfehlung:** Vorschlag aus der frühesten Eintreffzeit oder dem
Anlegezeitpunkt (mit „anpassen"); den Beginn in die Weitergabe aufnehmen;
die Zeile bei fehlendem Beginn auf dem Fernseher weglassen; die Eingabe
nach oben (Kopf der Einsatzansicht oder neben „Lageblatt").

**Nachprüfung:** Einsatz anlegen, eine Einheit einlesen, Monitor öffnen:
Dauer oder Vorschlag steht ohne Handeingabe da. Sammel-PDF auf einem
zweiten Gerät importieren: Beginn ist übernommen.

### R6-K5 [P2] Weg zum Lagemonitor: Block steht am Seitenende und trennt die Export-Erklärung von den Export-Knöpfen (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Laptop, Tablet, Telefon; Screenshot
`a3-block.png`).

**Fundstelle / Aufgabe:** Einsatzansicht, `LagemonitorBlock` an
`src/app/einsaetze-ui.tsx` Zeile 1908.

**Beobachtung:** Der Block „Lagemonitor für den Fernseher" (Beginn, „Jetzt",
„Lagemonitor öffnen") steht nach „Lageblatt (A4 quer)" und **vor** dem
Absatz „„Einsatz weitergeben / sichern" erzeugt die Sammel-PDF … Ein
Nachtrag … weiter unten „Nur neue Bögen …" ankreuzen". Dieser Absatz
erklärt die Knöpfe darüber und das Kästchen darunter; er steht jetzt unter
dem Monitor-Block und wirkt wie dessen Fortsetzung. Der Block liegt am
Laptop bei 5 708 px (7,4 Bildschirme; Seite 7 119 px), am Telefon bei 4 723 px
(Seite 6 929 px) und am Tablet bei 6 273 px (Seite 7 811 px). Auf der Startseite und im Kopf der Einsatzansicht
gibt es keine Abkürzung. Der Weg zurück ist gut: „Schließen" (unter
„Optionen") schließt das zweite Fenster; ohne Popup wechselt das eigene
Fenster, „Schließen" führt dann auf die Startseite, und die App öffnet die
zuletzt geöffnete Einsatzansicht wieder.

**Erwartung der Rolle:** Der Monitor ist etwas, das man einmal pro Lage
einrichtet; ein Knopf „Lagemonitor" im Kopf der Einsatzansicht, wo auch
„Startseite" und Ansicht-Wahl stehen. Der Erklärabsatz bleibt bei den
Export-Knöpfen.

**Folge:** Wer den Fernseher anschließt, sucht den Knopf auf einer 7 000 px
langen Seite; wer die Exporte liest, stolpert über einen fremden Block in der
Mitte der Erklärung.

**Empfehlung:** Block hinter „Einsatz verwalten" oder einen Kurzlink
„Lagemonitor…" im Kopf; Erklärabsatz an die Exportzeile zurück.

**Nachprüfung:** Einsatzansicht mit 20 Einheiten: Der Knopf ist ohne Scrollen
erreichbar; der Erklärabsatz folgt unmittelbar auf „Einsatz weitergeben /
sichern".

### R6-K6 [P2] Import-Quittung bei „Einsatz importieren…": gegliedert, aber ein Satz über Nummernwechsel füllt vier Fünftel (Rest von R5-K3)

**Priorität:** P2

**Kennzeichnung:** gemessen (Telefon 360 × 640, zweites Gerät mit 18
Einheiten, Import der Sammel-PDF mit 25 Einheiten).

**Fundstelle / Aufgabe:** Zweites Gerät, Startseite, „Einsatz importieren…",
danach Einsatzansicht. Code: `src/app/app.tsx`, `importiereEinsatzDatei`.

**Beobachtung:**
- Die Quittung ist gegliedert und kommt in die Ansicht: Kopfsatz „5 neue
  Einheiten, 2 Folgemeldung(en). Jetzt 23 Einheiten, davon 21 anwesend", die
  Eintreffzeit-Abweichungen als eine Zeile „18 kleine Abweichungen bei der
  Eintreffzeit" mit aufklappbarer Einzelheit, „Stand der Datei: letzte
  Meldung 17.10.2026, 11:15".
- Danach folgt, im selben Absatz, „Nummern geändert: Nr. 1 gehört jetzt THW
  Cottbus … (vorher THW Albstadt …), THW Albstadt … hat Nr. 4; Nr. 2 gehört
  jetzt … und 14 weitere — am Funk genannte Nummern und das gedruckte
  Lageblatt gelten nicht mehr, Lageblatt neu drucken". Das sind rund 900 px
  Fließtext von 1 200 px; der wichtige Schluss („Lageblatt neu drucken")
  steht am Ende.
- Ursache ist mein Aufbau (zwei Geräte vergeben Nummern nach ihrer
  Eintreffreihenfolge), das Muster ist aber der Normalfall bei zwei Geräten.
  Ein Abrücken, das im ersten Gerät noch nicht bekannt war, kam in meinem
  Aufbau nicht vor und ist nicht nachgeprüft.

**Erwartung der Rolle:** „Nummern von 15 Meldungen haben sich geändert — am
Funk genannte Nummern gelten nicht mehr. Lageblatt neu drucken." Die Liste
der Zuordnungen steht eingeklappt dahinter.

**Folge:** Der Satz, der eine Handlung verlangt (neu drucken, Funknummern
verwerfen), ist vom Rest nicht zu trennen und liegt unten in einem langen
Textblock.

**Empfehlung:** Die Nummernliste wie die Eintreffzeiten hinter eine
Aufklappzeile, die Handlungsaufforderung zuerst („15 Nummern geändert —
Lageblatt neu drucken").

**Nachprüfung:** Wie oben: Quittung höchstens sechs Zeilen im ersten
Bildschirm, Nummernliste eingeklappt.

### R6-K7 [P2] „Anderer Einsatz?": Der Hinweis verschwindet, sobald eine weitere abweichende Einheit dasselbe Wort nennt (neu)

**Priorität:** P2

**Kennzeichnung:** gemessen (Lageblatt vor und nach dem Einlesen zweier
Einheiten, Nachtrag-CSV) und im Code gelesen.

**Fundstelle / Aufgabe:** `abweichenderOrt` in
`src/app/einheiten-tabelle.ts` (Zeile 256 ff.).

**Beobachtung:**
- Vor dem Einlesen trugen drei Einheiten den Hinweis (Ansbach
  „Bereitstellungsraum Ansbach — Materialwirtschaft …", Weinsberg
  „Ölschaden Gewässer bei Weinsberg …", Cottbus „Stromausfall Cottbus …"); im
  Lageblatt, in beiden CSV und im Excel (Spalten Hinweise, Hinweis zur
  Meldung, Bemerkung) stand er überall.
- Nach dem Einlesen von Gieboldehausen („Ölschaden Hafen Gieboldehausen")
  und Hannover/Langenhagen („Stromausfall Langenhagen …") trägt nur noch
  Ansbach den Hinweis. Weinsberg und Cottbus verloren ihn; die Nachtrag-CSV
  zählt keinen Treffer mehr (davor 3).
- Ursache im Code: Hat die Sammlung einen Ort („Heilbronn, Neckarvorland"),
  zählt „jedes Wort der Nachbarn als passend". Zwei Einheiten, die beide
  nicht zu Heilbronn gehören, aber ein Wort teilen („Ölschaden",
  „Stromausfall"), machen sich gegenseitig passend. Der eingetragene Ort der
  Lage selbst kommt in keinem der Bögen vor.

**Erwartung der Rolle:** Die Marke bleibt, solange der Bogen nicht zum Ort
der Lage passt; ein weiterer Fremdbogen entlastet ihn nicht.

**Folge:** Der Hinweis ist verlässlich nur für den ersten Ausreißer.
Kommen Einheiten aus einer anderen Lage gebündelt an (Annahme:
Bereitstellungsraum mit Doppelbelegung), sieht die Führung keine einzige
Marke — auf Karte, Lageblatt und Exporten.

**Empfehlung:** Bei bekanntem Ort der Lage gegen diesen Ort (und den Namen)
vergleichen, nicht gegen die Nachbarn; die Nachbarwörter nur als Basis
nehmen, wenn kein Ort gesetzt ist.

**Nachprüfung:** Lage mit Ort „Heilbronn": zwei Bögen mit „Stromausfall
Cottbus" und „Stromausfall Langenhagen" einlesen — beide tragen die Marke,
auch im Lageblatt und in der CSV.

### R6-K8 [P3] Lagemonitor: Kleinigkeiten an „Zuletzt gemeldet", Uhr und Takt (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet; die Zeilen zum Takt sind im Code gelesen
(Risiko).

**Fundstelle / Aufgabe:** Lagemonitor, Abschnitt „Einheiten", Hauptzeile
Zeit. Code: `src/app/lagemonitor.ts` (`NEU_MS`, `vorText`),
`src/app/lagemonitor-ui.tsx` (`TAKT_MS = 5000`), `src/app/lagemonitor.css`
(`.lm-liste li.lm-neu { font-weight: 700 }`).

**Beobachtung:**
- „Neu" (bis 15 Minuten) wird nur durch fette Schrift gekennzeichnet; aus
  drei Metern ist der Unterschied zwischen 400 und 700 schwer zu sehen. Die
  App nennt „neu" bis 30 Minuten (`NEU_MS` in `einheiten-tabelle.ts`), der
  Monitor bis 15 — zwei Schwellen für denselben Begriff.
- Nach drei Tagen steht bei allen sechs Einträgen „vor 3 d"; die Liste
  sagt dann nichts mehr zur Reihenfolge.
- Die Datum-Zeit-Gruppe tickt im 5-Sekunden-Takt; zur vollen Minute kann
  sie bis zu fünf Sekunden nachgehen. Die DTG hat keinen Zonenbuchstaben
  und zeigt Ortszeit (Annahme).
- Gelöschte oder nicht mehr vorhandene Einsätze: „Dieser Einsatz ist auf
  diesem Gerät nicht (mehr) vorhanden" in der Größe der Zeile 1 mit einer
  „Schließen"-Taste — bei dunklem Grund; Nachtseite siehe R6-L6.

**Empfehlung:** „neu" mit einem Wort oder einer Farbe, dieselbe Schwelle wie
in der App; nach 24 Stunden Datum und Uhrzeit statt „vor n d"; Takt auf eine
Sekunde oder an die Minutengrenze koppeln.

**Nachprüfung:** Monitor mit einer eben eingelesenen Einheit: „neu" ist aus
drei Metern erkennbar; nach Zeitsprung steht eine Uhrzeit statt „vor 3 d".

### R6-K9 [P3] „Sammel-PDF (nur neue Bögen)" liefert beim ersten Nachtrag die ganze Lage (Rest aus Runde 5)

**Priorität:** P3

**Kennzeichnung:** gemessen (Sammel-PDF 51 Seiten nach „Einsatz weitergeben",
danach Nachtrag-PDF mit 56 Seiten).

**Fundstelle / Aufgabe:** Einsatzansicht, Kästchen „Nur neue Bögen seit dem
letzten Export", Knopf „Sammel-PDF (nur neue Bögen)".

**Beobachtung:** Die Zeile erklärt jetzt, warum: „Sammel-PDF an den Stab:
noch nie als Nachtrag geliefert — alle Bögen sind neu. Die Weitergabe vom
11:13 zählt hier nicht (sie geht an die Ablösung oder ins Archiv). Ab dieser
Weitergabe rechnen". Der Knopf trägt trotzdem „(nur neue Bögen)", und die
Datei (`…-erste-lieferung-…`) enthält alle 25 Einheiten. Die CSV- und
Excel-Knöpfe bleiben mit „Übersicht als CSV" und „Excel-Liste" unbeschriftet;
ihr Inhalt wird erst durch die Zeile darüber und die Datei erklärt
(„… nachtrag-seit-20261017-1116 …", Spalte „Im Nachtrag wegen", Kopfzeile
„NACHTRAG – Teil der Lage").

**Folge:** Gering. Wer auf den Knopf tippt, erwartet eine kleine Datei und
erhält die ganze Lage; erst die Dateigröße (1,36 MB) verrät es.

**Empfehlung:** Knopf an die Zeile anpassen („Sammel-PDF: erste Lieferung,
alle Bögen"), die anderen Knöpfe mit „Nachtrag" beschriften, solange das
Kästchen gesetzt ist.

**Nachprüfung:** Kästchen setzen: Jeder Knopf sagt, ob er die ganze Lage
oder einen Nachtrag liefert.

### R6-K10 [P3] Lageblatt: Schreibweise der Unterbringungsänderung uneinheitlich (neu)

**Priorität:** P3

**Kennzeichnung:** gemessen (Lageblatt, Zeilen Nr. 3 und Nr. 4).

**Fundstelle / Aufgabe:** Lageblatt, Spalte „Veränderung seit der letzten
Meldung".

**Beobachtung:** Dieselbe Angabe steht in zwei Schreibweisen in einer
Zeile: „Unterbringung M/W/D von M 4 / W 0 / D 0 auf M3/W0/D0". Das Lageblatt
ordnet im Übrigen richtig (Gesamtstärke, „Bedarf/Auftrag", „weitere: …
Personal (1)"); die Bedarfsänderung steht, die Namen nicht.

**Folge:** Gering; auf Papier wirkt die Zeile fehlerhaft.

**Empfehlung:** Eine Schreibweise („M 4 / W 0 / D 0 → M 3 / W 0 / D 0").

**Nachprüfung:** Folgemeldung mit geänderter Unterbringung: beide Seiten
gleich gesetzt.

## Verweise auf Befunde in anderen Runde-6-Berichten

Hier nicht erneut gezählt:

- **Überschriften „Züge" und „Zuletzt gemeldet" im Lagemonitor fast
  unsichtbar** (Farbe `rgb(17, 20, 27)` auf Schwarz, von mir mit
  `getComputedStyle` bestätigt: Verhältnis etwa 1,1 : 1): siehe
  [nacht-und-sicht.md](nacht-und-sicht.md), R6-L1.
- **Einheitenliste standardmäßig zu, aufgeklappt unten aus dem Bild** (bei mir
  1 774 px bei acht Zügen, 1 804 px mit allen drei Abschnitten, 1 016 px bei
  1 280 × 720), kein „+ n weitere": R6-L2.
- **Weißer Blitz beim Start, keine Nachtstufe, Fehlerzustand klein:** R6-L3,
  R6-L4, R6-L6.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Lagemonitor, Lesbarkeit:** Name 76 px, Ort 65 px, DTG 151 px mit
  hervorgehobener Uhrzeit, Stärke 69 px (`5 / 43 / 124 // 172`, Gesamtzahl
  unterstrichen), Dauer 69 px. Langer Name und langer Ort brechen in zwei
  Zeilen um, ohne dass das Bild springt oder überläuft; mit 100 Einheiten
  steht „25 / 215 / 620 // 860" in einer Zeile.
- **Zahlen:** Der Monitor zeigt dieselbe Stärke und Einheitenzahl wie
  Einsatzansicht und Lageblatt (nach Folgemeldungen und Rückkehr überall
  173 bzw. 21 zählend, 51 Fahrzeuge); Abrücken und Folgemeldung kommen nach
  60 bis 161 ms im Monitor an.
- **Keine Personen auf dem Fernseher:** Der Monitor zeigt Einheitsnamen,
  Zugetiketten und Zahlen, keine Namen aus den Bögen.
- **Dauer:** „Einsatz beginnt noch" bei zukünftigem Beginn, „3 Tage, 23
  Stunden, 7 Minuten", „31 Tage, 6 Stunden, 6 Minuten", nach Sprung um 75
  Stunden „3 Tage, 4 Stunden, 0 Minuten" und Datum „20 1421 okt 26".
- **Weg zurück:** „Schließen" funktioniert mit und ohne Popup; ein gelöschter
  oder fremder Einsatz gibt „Dieser Einsatz ist auf diesem Gerät nicht
  (mehr) vorhanden" statt einer leeren Seite; ein zweiter Klick auf
  „Lagemonitor öffnen" öffnet kein drittes Fenster.
- **Folgemeldung nach dem Abrücken (R5-K1):** Quittung („Folgemeldung 11:13:
  Stärke 4 → 3 (−1) — ⚠ wieder anwesend — war abgerückt, zählt wieder mit"),
  Karte („neue Fassung", „Folgemeldung … ⚠ wieder anwesend — war abgerückt
  (durch die Folgemeldung) … Wieder abrücken"), Lageblatt („WIEDER ANWESEND
  — WAR ABGERÜCKT gegenüber 17.10.2026, 11:08"), Exportzeile („1 Änderung
  (Wieder anwesend)"), Nachtrag-CSV („geändert: Folgemeldung, Wieder
  anwesend"), Nachtrag-Excel („Nachtrag: geändert: Folgemeldung, Wieder
  anwesend") und Nachtrag-PDF („WIEDER ANWESEND — WAR ABGERÜCKT").
- **Nachtrag als Teilmenge gekennzeichnet:** Excel mit Hinweisleiste
  „NACHTRAG – Teil der Lage", Block „Geänderte Einheiten (2) — ersetzen ihre
  Zeile der letzten Lieferung, in den Summen oben NICHT …", CSV mit „Summe
  Nachtrag — nur neue Einheiten (2)" und Schlusszeile „NACHTRAG seit
  17.10.2026, 11:16 — nicht die ganze Lage (4 Einheiten in dieser Datei)".
- **„Nur neue Bögen" je Format:** Sammel-PDF, Übersicht-CSV, „Alle Daten"-CSV
  und Excel haben je eigenen Bezugspunkt („zuletzt 11:13 · seitdem 4 neue
  Bögen und 1 Änderung (Wieder anwesend)"); nach dem Export „seitdem keine
  neuen Bögen".
- **Import-Quittung beim Einlesen:** „1 Bogen aufgenommen, 2 bereits
  vorhanden." plus die Fremddatei („murks.json" stammt nicht aus dieser App)
  und die Liste „Neu seit der letzten Kenntnisnahme (3)" mit Stärkeverlust
  samt Vorzeichen.
- **„Hinweise" statt „Rückfrage":** In App, Lageblatt, Sammel-PDF
  („Hinweise (3): …"), CSV und Excel kommt „Rückfrage" nirgends mehr vor.
- **Lageblatt nach Nr. sortiert,** abgerückte im eigenen Block („Abgerückt
  (2)") mit „Summe laut Gerät (21 zählend · 2 abgerückt)"; „Verpfl. 4 (St. 3)"
  in der Spalte Bedarf, „Verpflegung 4 statt Stärke 3" als Hinweis,
  Veränderungsspalte nach Bedarfsrelevanz geordnet; kein Fremdzeichen mehr
  (R5-K2).
- **Erste Einheitenkarte am Laptop** bei 385 px (Zeile „Einheiten (23
  gemeldet · 20 zählend)"), Bedarf als Summenblock links, Liste rechts.

## Abschluss

- **Aufgabe geschafft:** ja, mit Umwegen beim Einrichten des Monitors
  (Block am Seitenende, Beginn von Hand) und bei der Frage, warum sich die
  Zahlen auf dem Fernseher bewegen.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „0 / 0 / 0 // 0" auf dem Fernseher kann
  „noch niemand gemeldet" und „alle abgerückt" heißen (R6-K1).
- **Größtes Einsatzrisiko:** Die Stärke auf dem Fernseher ändert sich ohne
  Erklärung und ohne Datenstand; eine Übung sieht wie ein Einsatz aus
  (R6-K1, R6-K3).
- **Top-Priorität für die nächste Iteration:** Das Hauptbild des
  Lagemonitors um Einheiten (anwesend/abgerückt), letzte Meldung und die
  Bewegungen der letzten Minuten ergänzen (R6-K1, R6-K2).

## Abgleich mit Runde 5

Grundlage: [../runde-5/fuehrungssicht.md](../runde-5/fuehrungssicht.md)
einschließlich „Stand der Behebung" und
[../runde-5/README.md](../runde-5/README.md). Der Lagemonitor ist neu und hat
keine Vorgängerbefunde.

| Runde-5-Befund | Behebung laut Runde 5 | Bewertung Runde 6 | Beobachtung |
| --- | --- | --- | --- |
| R5-K1 Folgemeldung holt Abgerückte still zurück (P1) | behoben, Entscheidung begründet | hält | Quittung, Karte, Lageblatt, Exportzeile („Wieder anwesend"), Nachtrag in CSV, Excel und PDF nennen die Rückkehr; „Wieder abrücken" steht an der Karte. Rest: Der Monitor zeigt die Rückkehr nicht (R6-K1). |
| R5-K2 Lageblatt druckt „≠" als Fremdzeichen (P2) | behoben | hält | „Verpflegung 4 statt Stärke 3", „Verpfl. 4 (St. 3)" auf dem Lageblatt; kein Fremdzeichen, kein „?" im Text. |
| R5-K3 Import-Quittung ein Absatz (P2) | behoben | teilweise | Kopfsatz, Eintreffzeit als eine Zeile mit Aufklapper, Quittung ist in der Ansicht. Ein Satz über 15 Nummernwechsel füllt vier Fünftel (R6-K6). Einen Statuswechsel beim Import habe ich nicht nachgestellt. |
| R5-K4 Erste Karte am Telefon bei 2,6 Bildschirmen (P2) | behoben | hält (andere Lage, nicht direkt vergleichbar) | Telefon 360 × 640 mit 23 Einheiten und drei Zügen: erste Karte bei 988 px (1,5 Bildschirme); Tablet 728 px (0,6); Laptop 385 px (0,5). Der Bedarf sitzt hinter einer Summenzeile, die Suche hinter einer Zeile. |
| R5-K5 „Anderer Einsatz?" nur in der App (P2) | behoben | hält, mit Schwäche | Lageblatt, Übersicht-CSV, „Alle Daten"-CSV und Excel tragen den Hinweis (je 3 Treffer im Vollexport). Die Erkennung entlastet sich selbst, sobald eine weitere Fremdeinheit ein gleiches Wort nennt (R6-K7). |
| R5-K6 Nachtrag-Excel und „Alle Daten" nur im Dateinamen (P3) | behoben | hält | Excel mit Hinweisleiste und Schlusszeile, CSV und „Alle Daten" mit Schlusszeile „NACHTRAG seit …"; Spalte „Im Nachtrag wegen". |
| R5-K7 Lageblatt „… und 4 weitere Änderungen" (P3) | behoben | hält, mit Rest | Die Spalte ordnet Gesamtstärke, „Bedarf/Auftrag" (Unterbringung), „weitere: …". Schreibweise der Unterbringung uneinheitlich (R6-K10). |
| Verweis R5: Sammel-PDF-Nachtrag nach Weitergabe zählt die ganze Lage | (andere Abgleich-Zeile) | teilweise | Die Zeile erklärt es jetzt („Die Weitergabe … zählt hier nicht", mit „Ab dieser Weitergabe rechnen"). Der Knopf heißt weiter „(nur neue Bögen)" und liefert die ganze Lage (R6-K9). |

Bilanz: Von sieben Runde-5-Befunden halten vier ganz (K1, K2, K4, K6), zwei
mit Rest (K5 mit einer neuen Schwäche, K7 mit uneinheitlicher Schreibweise),
einer nur teilweise (K3). Verkehrt hat sich keine Behebung. Neu ist der Lagemonitor: Er lässt sich gut lesen, lässt aber
das aus, was ihn für die Führung wertvoll macht — die Bewegung in der Lage.

Der Runde-6-Bericht [nacht-und-sicht.md](nacht-und-sicht.md) lag bei
Abschluss als Entwurf vor; die Verweise oben stammen daraus.

## Stand der Behebung

Stand 23.10.2026, auf demselben Zweig mit Typprüfung, Unit-Tests, Verhaltenstests (137 von 137 Szenarien) und, wo es sich messen ließ, Nachmessung im Browser (Playwright, Produktionsbuild). 4 behoben, 4 teilweise, 2 offen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R6-K1 | behoben | Das Hauptbild nennt Einheiten, Fahrzeuge, abgerückte und das Alter der letzten Meldung und führt Abrücken, Rückkehr und Folgemeldung der letzten 15 Minuten mit Namen; „alle abgerückt“ unterscheidet sich von „noch nichts gemeldet“. |
| R6-K2 | teilweise | Die Stärke trägt eine Beschriftung, Einheiten und Fahrzeuge stehen im Hauptbild. Die Gewichtung Uhr/Stärke ist die Vorlage des Status-Monitors und blieb. |
| R6-K3 | behoben | Eine Übung steht als „ÜBUNG – keine Echtlage“ im Hauptbild. |
| R6-K4 | teilweise | Ohne gesetzten Beginn gilt die erste Meldung als Vorschlag („seit erster Meldung“), kein Fehlertext auf dem Fernseher. Der Beginn geht weiter nicht in die Weitergabe. |
| R6-K5 | teilweise | Der Block steht hinter den Export-Knöpfen, die Erklärung steht bei ihren Knöpfen. Ein Kurzlink im Kopf fehlt. |
| R6-K6 | behoben | Die Quittung nennt zuerst die Aufforderung („15 Nummern geändert … Lageblatt neu drucken“), dann zwei Beispiele. |
| R6-K7 | behoben | Bei bekanntem Ort zählt ein Wort der Nachbarn nur, wenn mindestens die Hälfte der übrigen Einheiten es nennt (Unit-Test). |
| R6-K8 | offen | Bezog sich auf „Zuletzt gemeldet“, das nach dem Umbau des Monitors von anderer Seite nicht mehr existiert. |
| R6-K9 | teilweise | Der Sammel-PDF-Knopf heißt bei erster Lieferung „(erste Lieferung: alle Bögen)“; CSV- und Excel-Knöpfe sind nicht umbenannt. |
| R6-K10 | offen | Nicht nachvollzogen: Der Kern schreibt beide Seiten der Unterbringungsänderung gleich („M 4 / W 0 / D 0“); die abweichende Form „M3/W0/D0“ stammte vermutlich aus der Prüfdatei. |
