# Audit „Neuer Nutzer", Runde 9 (THW-Helfer ohne Einweisung)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-8-Befunde (Stand der Behebung in
[../runde-8/README.md](../runde-8/README.md), Bericht meiner Rolle:
[../runde-8/neuer-nutzer.md](../runde-8/neuer-nutzer.md)). Geprüft habe ich auch
die Nebenwirkungen der Runde-8-Umbauten: Rohtext-Rettung (`eeb.unlesbar.v1`),
Zwei-Fenster-Rückfrage mit Werten, Lagemonitor (Telefon, Fernseher, große
Schrift), Nummern-Verschiebung in der Rückfrage, Sollstärke-Marke, Zug-
Normalisierung, Rückfragen bei Zoom 200 % und bei 180 × 320, Texte der
Schnellerfassung, Fahrzeugkarte.

## Prüfaufbau

Playwright aus `node_modules`, Chromium unter `/opt/pw-browsers/chromium`
(`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640
(Gerätepixelverhältnis 2), dazu 320 × 568; große Schrift als
`html { font-size: 200% }`, Browser-Zoom als halbierte Layoutbreite bei
doppeltem Pixelverhältnis (180 × 320); der Lagemonitor zusätzlich als
Desktop-Fenster (ohne Touch) auf 1 920 × 1 080, 1 366 × 768 und 1 024 × 600.
Produktionsbuild unter `http://localhost:4173`; je Lauf ein eigener
Browser-Kontext, Server weder neu gebaut noch angehalten. Elf weitere Prüfer
nutzten ihn gleichzeitig; Zeitwerte habe ich nicht gewertet.

Zustände entstanden durch Bedienung (leeres Gerät, „Neuen Bogen erstellen“ mit
Einheitstyp „Bergungsgruppe“, Schnellerfassung bis Schritt 1, „Bogen
übergeben…“, „In Einsatz-Sammlung ablegen…“ mit „Als Sollstärke ablegen“,
Abrücken-Umfeld „Mehr…“ › „Entfernen“, „Zug zuordnen“ mit sechs Schreibweisen,
„Daten sichern…“, zwei Seiten im selben Kontext für das Zwei-Fenster-Verhalten)
und durch `localStorage`-Seeds (`eeb.entwurf.v1`, `eeb.einsaetze.v1`) aus
`examples/thw/` (Hilfsmodul `lib6.mjs`), jeweils mit `uebung: false` und `stand`
auf die Prüfzeit. Für die Rohtext-Rettung kürzte ich den Gesamttext von
`eeb.einsaetze.v1` um 40 Zeichen. Der Lagemonitor lief als `?lagemonitor=s1`,
auch mit 18 Einheiten.

Ich habe zuerst ohne Blick in Berichte getestet (Startseite, Assistent Schritt 1
bis 6 mit Einheitstyp-Vorschlägen und StAN-Vorbelegung, Übergabe-Fenster,
Sammlung, Schnellerfassung), danach `runde-8/neuer-nutzer.md` mit dem „Stand der
Behebung“ gelesen und jede Behebung meiner Rolle nachgestellt.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, Handscanner, echte Handschuhe,
echtes Licht, Bildschirmtastatur, native Datumsauswahl (headless Chromium zeigt
„10/24/2026“ im US-Format; nicht gewertet), Safari/WebKit, echtes Drucken,
native Builds.
**Nicht gesondert nachgestellt:** Sprungmarke, späte Rückkehr eines eigenen
`history.back()`, Umschrift im Papierfeld, CSV nach Nr., Ankündigung der
Anonymisierung 14 Tage vorher, Spaltenfolge der Einsatztabelle, Kontrast in
Musterung/iOS/Nacht (andere Rollen), Musterung und Kopf bei 180 × 320, R6-O9,
Zusammenführen-Tipp (R7-N1).

Hinweis zum Prüfwerkzeug: Ein Tipp 0,8 s nach dem Öffnen eines Schritts bzw. ein
zweiter Tipp auf „Weiter“ nach 1 s wurde mehrfach nicht angenommen („Einen
Moment …“ unten rechts); nach 1,5 s geht er. Das ist der bekannte Prellschutz
(R8-H5/S4), kein neuer Befund. Die Seeds tragen die Zeiträume der Übungsbögen
(Juli 2026); dass Karten „Zeitraum vorbei“ und „Anderer Einsatz?“ melden, ist
dadurch bedingt und nicht gewertet.

## Urteil

Der eigene Bogen und der Meldekopf gelingen auch in Runde 9 ohne fremde Hilfe.
Startseite mit zwei Rollen, die Einheitstyp-Vorschläge („Berg“ → „B –
Bergungsgruppe“, „FGr BT“ …), die sechs Schritte mit Erklärung der Vorbelegung
und der Warnzeilen („8 Personenkarten ohne Angaben zählen in die Stärke —
ausfüllen oder entfernen“), „Bogen übergeben…“ mit „2 offene Punkte — ansehen ·
Übergeben ist trotzdem möglich“ und die Rückfragen sind verständlich. Alle
sieben Befunde meiner Rolle aus Runde 8 (R8-N1 bis R8-N7) halten: der
Lagemonitor am Telefon zeigt F/U/M ohne Wischen, die Zwei-Fenster-Rückfrage
nennt beide Werte, „2. Zug“ und „Zug 2“ bilden einen Zug, die Texte der
Schnellerfassung sagen dasselbe, die Fahrzeugkarte zeigt „— k. A.“ lesbar.

Reibung bleibt in vier kleinen Stellen (alle P3): Die Kennzahlen-Kacheln der
Sammlung brechen bei großer Schrift mitten im Wort („EINHE / ITEN“, R9-N1); der
Lagemonitor am Telefon vergrößert bei großer Schrift nur die Beschriftungen, die
Zahlen nicht (R9-N2); die Rückfrage „Stärke nicht gezählt“ sagt im nächsten Satz,
die Zahl zähle mit (R9-N3); der Kasten der Rohtext-Rettung spricht von einem
„beschädigten Gesamttext“ und schiebt „Neuen Bogen erstellen“ bei 360 × 640 aus
dem Bild (R9-N4). Kein P0, kein P1, kein P2.

## Befunde

### R9-N1 [P3] Große Schrift: Kennzahlen-Kacheln der Sammlung brechen mitten im Wort

**Priorität:** P3

**Kennzeichnung:** gemessen (`html { font-size: 200% }`, 360 × 640 und
320 × 568; Textbereiche über `Range.getClientRects`) und im Screenshot
beobachtet; Wirkung im Einsatz: Risiko.

**Fundstelle / Aufgabe:** Startseite → Sammlung „Hochwasser Musterstadt“ öffnen,
Kachelblock unter der Überschrift („6 Einheiten, 1 Führer, 15 Unterf., 43
Mannsch., 59 gesamt“).

**Beobachtung:** Bei 100 % stehen die Beschriftungen einzeilig. Bei 200 % und
360 Pixel Breite brechen „EINHE / ITEN“, „FÜHRE / R“, „UNTER / F.“, „MANNS /
CH.“; bei 320 Pixel Breite „EINH / EITE / N“, „FÜHR / ER“, „UNTE / RF.“,
„MANN / SCH.“. „GESAMT“ bleibt heil. Die Kacheln sind zwei Spalten breit, die
Innenränder bleiben dabei groß (links etwa 50 px bei 200 %), die Beschriftung in
gesperrter Schrift mit Buchstabenabstand. Die Zahlen stehen darüber
unbeschädigt. Zwei Zeilen zuvor („Dein eigener Bogen …“, Chips, „Bedarf:“) bricht
nichts im Wort (R7-M1/G9/K7 halten).

**Erwartung der Rolle:** Beschriftungen, die der Helfer täglich liest, bleiben
ganze Wörter; wenn der Platz fehlt, steht „Unterf.“ allein in der Zeile oder die
Kachel wird einspaltig.

**Folge:** Gering: „UNTER / F.“ ist lesbar, „EINH / EITE / N“ kostet beim
Überfliegen Aufmerksamkeit; wer mit Brille oder großer Systemschrift die Lage
zählt, liest die Kacheln langsamer. Die Zahl selbst bleibt richtig.

**Empfehlung:** Beschriftung bei großer Schrift nicht mitten im Wort trennen
(ganze Wörter umbrechen lassen, Buchstabenabstand und Innenrand verkleinern oder
eine Kachel je Zeile).

**Nachprüfung:** 360 × 640 und 320 × 568 mit 200 % Schrift: kein Kachel-Label
besteht aus mehreren Textzeilen, die ein Wort teilen.

### R9-N2 [P3] Lagemonitor am Telefon bei großer Schrift: Beschriftungen wachsen, die Zahlen nicht

**Priorität:** P3

**Kennzeichnung:** gemessen (Computed Style, 360 × 640, 100 % und 200 %) und im
Screenshot (320 × 568) beobachtet. Nebenwirkung der Runde-8-Änderung „Schrift
folgt der Systemschrift“; Wirkung im Einsatz: Risiko.

**Fundstelle / Aufgabe:** Sammlung → „Lagemonitor öffnen“ (`?lagemonitor=s1`) am
Telefon, Systemschrift groß.

**Beobachtung:** Bei 100 % stehen „Stärke F / U / M // gesamt“ mit 14 px und die
Zahlen „1 / 15 / 43 // 59“ mit 16,56 px. Bei 200 % wächst die Beschriftung auf
28 px, die Zahlen bleiben bei 16,56 px; ebenso „6 Einheiten · 22 Fahrzeuge“
(16,56 px) und „Eingetroffen: …“ (12,96 px), während „letzte Meldung vor 1 Min“
und das „vor 1 Min“ in der Bewegungszeile auf 28 px springen. Die Schriftgrößen
in einer Zeile stehen damit verkehrt: „vor 1 Min“ (28 px) neben „Eingetroffen:
THW Albstadt …“ (12,96 px), die Gesamtstärke kleiner als ihre Beschriftung. Die
Seite bleibt ohne seitlichen Überlauf (320, 360 und 180 Pixel breit); die Tabelle
„Einheiten“ zeigt „Orga, Ort, Funkruf, F, U, M“ ohne Rollen (R8-N1 hält).

**Erwartung der Rolle:** Die Zahl, wegen der man den Lagemonitor öffnet, ist die
größte Schrift im Block; bei Systemschrift groß wächst sie mit.

**Folge:** Gering: Wer den Lagemonitor am Telefon mit großer Systemschrift liest,
sieht große Worte und kleine Zahlen; die Gesamtstärke ist am schwersten zu
finden. Der Lagemonitor ist für den Fernseher gedacht, das Telefon ist der Notfall.

**Empfehlung:** Zahlen und Beschriftungen gemeinsam mit der Systemschrift
skalieren, mindestens die Zahlen nicht unter der Beschriftung halten.

**Nachprüfung:** 360 × 640, 200 % Schrift: Gesamtstärke mindestens so groß wie
„Stärke F / U / M // gesamt“; Bewegungszeile in einheitlichem Verhältnis.

### R9-N3 [P3] „Stärke nicht gezählt“ und im nächsten Absatz „zählt in den Summen mit“

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640; neuer Bogen „Bergungsgruppe“ ohne
Namen, „In Einsatz-Sammlung ablegen…“ › Sammlung wählen).

**Fundstelle / Aufgabe:** Fenster nach dem Ablegen eines Bogens, dessen Personal
nur aus der Vorbelegung besteht.

**Beobachtung:** Überschrift: „Stärke nicht gezählt“. Text: „Für „THW Musterdorf
Bergungsgruppe“ stehen nur die Sollplätze nach StAN (Stärke 0 / 2 / 7 / 9, 2
Fahrzeuge) — niemand hat Personen eingetragen.“ Knöpfe: „Stärke jetzt eintragen“,
„Als Sollstärke ablegen“ mit Erklärung „Die Zahl zählt in den Summen mit, bis eine
echte Zahl vorliegt.“ Nach „Als Sollstärke ablegen“ steht oben „7 Einheiten … 68
gesamt“ und „Davon 1 Einheit nur Sollstärke, nicht gemeldet (9 Personen) — zählt
in der Summe mit, bis eine Zahl vorliegt.“, die Karte trägt „Nr. 7 …
Sollstärke, nicht gemeldet“ (R8-A1 steht, mit Marke). Die Überschrift sagt das
Gegenteil dessen, was folgt: gezählt wird sie doch. Eine Zeile darunter heißt es
„Zuletzt eingelesen: „THW Musterdorf Bergungsgruppe“ · jetzt 7 Einheiten, Gesamt
68“ für einen Bogen, der nicht eingelesen, sondern abgelegt wurde.

**Erwartung der Rolle:** Die Überschrift nennt die Lage („Nur Sollplätze, keine
gemeldete Stärke“) und lässt offen, ob die Zahl zählt; der Satz „zählt mit“ steht
nur beim Knopf.

**Folge:** Gering: Der Helfer liest „nicht gezählt“, legt als Sollstärke ab und
nimmt an, die Summe sei unverändert; die Summe steigt aber von 59 auf 68. Die
Marke und „Davon 1 Einheit nur Sollstärke“ fangen das ab (R8-A1).

**Empfehlung:** Überschrift an den Text angleichen („Nur Sollplätze, keine
gemeldete Stärke“) und die Zeile „Zuletzt eingelesen“ für abgelegte Bögen als
„Zuletzt abgelegt“ führen.

**Nachprüfung:** Fenster ohne Namen ablegen: Überschrift und Absatz sprechen
dasselbe von „gezählt“; die Zeile unter dem Kopf nennt „abgelegt“.

### R9-N4 [P3] Rohtext-Rettung: „beschädigter Gesamttext“, „Datensicherung“ vor jeder Sicherung, „Neuen Bogen erstellen“ unter dem Bildrand

**Priorität:** P3

**Kennzeichnung:** beobachtet (Wortlaut) und gemessen (Lage der Knöpfe;
360 × 640, 320 × 568, 200 % und 180 × 320). Bei „Gesamttext“ nehme ich an, dass
der Helfer den Begriff nicht kennt.

**Fundstelle / Aufgabe:** Startseite nach beschädigtem `eeb.einsaetze.v1`
(Gesamttext der Sammlungen um 40 Zeichen gekürzt).

**Beobachtung:** Oben steht: „Nicht lesbar: 1 beschädigter Gesamttext
(Sammlungen oder Vorlagen). Sie fehlen in Listen und Zählung — die Stärke kann zu
niedrig sein. Nichts davon ist gelöscht; die Daten stecken in der
Datensicherung.“ Die Sammlung „Hochwasser Musterstadt“ ist aus der Liste weg
(`eeb.einsaetze.v1` steht auf `[]`, 22 630 Zeichen liegen unter
`eeb.unlesbar.v1`). Der Satz sagt nicht, wie viele Einsatz-Sammlungen und welche
fehlen („1 beschädigter Gesamttext“ steht für alle Sammlungen oder alle Vorlagen
zusammen). „Die Daten stecken in der Datensicherung“ steht vor dem Antippen von
„Daten sichern…“; erst danach meldet die Seite „Sicherung
„eeb-sicherung-2026-10-24.json“ erzeugt (Downloads)“. Die Knöpfe „Daten
sichern…“ und „Beiseitegelegtes entfernen…“ sind eindeutig, das zweite in Rot.
Lage: Bei 360 × 640 liegt „Neuen Bogen erstellen“ mit der Oberkante bei y = 660
(Fenster 640 hoch), bei 320 × 568 bei 696, bei 200 % Schrift bei 1 397, bei
180 × 320 bei 998. Mit gleichzeitigem Entwurf („Fortsetzen“, „Verwerfen“) liegt er
bei 979 (360 × 640). „Fortsetzen“ und „Verwerfen“ bleiben im ersten Bild (391 bis
435).

**Erwartung der Rolle:** Der Kasten sagt „Gespeicherte Einsätze sind nicht lesbar
und liegen beiseite“ und was der nächste Knopf tut; der Weg zum eigenen Bogen
bleibt im ersten Bild.

**Folge:** Gering: Wer nur einen Bogen erfassen will, muss unter den Kasten
scrollen und weiß nicht, ob seine Sammlung verloren ist. Die Daten sind nicht
verloren; der Text beruhigt, aber „Datensicherung“ erklärt nicht, wo sie liegen.

**Empfehlung:** „Gesamttext“ durch „gespeicherte Sammlungen“ ersetzen,
„Datensicherung“ erst nennen, wenn eine besteht („Mit ‚Daten sichern…‘ landen sie
in einer Datei“), und den Kasten bei kleinem Fenster auf zwei Zeilen kürzen oder
unter „Meinen Bogen ausfüllen“ stellen.

**Nachprüfung:** Seed mit gekürztem Gesamttext, 360 × 640: „Neuen Bogen
erstellen“ im ersten Bild; Text ohne „Gesamttext“.

## Verweise auf Befunde in anderen Berichten

- **Prellschutz nach dem Öffnen eines Schritts:** Der erste Tipp 0,8 s nach dem
  Öffnen von „Neuen Bogen erstellen“ (Feld „Einheitstyp“) und ein zweiter Tipp
  auf „Weiter“ nach 1 s wurden mit „Einen Moment …“ abgewiesen. Bekannte Grenze
  R8-H5/S4 (Prellschutz 450/800 ms), hier nur der Stand.
- **Ziffern der Schrittleiste:** bekannte Grenze R7-N9; die Leiste zeigt am
  Telefon „1 2 3 4 5 6“ ohne Wörter (nur die Seitenüberschrift „1. Einheit“, „2.
  Einsatz“ steht darunter).
- **Übersichtstabellen (Personal, Fahrzeuge) rollen seitlich:** unverändert
  R6-G9 in `../runde-7/handschuh-bedienung.md`; bei 360 × 640 stehen
  „Name, Vorname“ und „Erreichbarkeit“ in der rollenden Tabelle.
- **Sollstärke zählt mit:** bekannte Grenze R8-A1, Marke vorhanden („Sollstärke,
  nicht gemeldet“ an der Karte, „Davon 1 Einheit nur Sollstärke“ in der Summe);
  nur die Überschrift des Fensters siehe R9-N3.

## Bestätigtes

- **Startseite:** zwei Rollen („Meinen Bogen ausfüllen“, „Bögen sammeln
  (Meldekopf)“), „So funktioniert’s“, Offline-Zeile mit Fortschritt („Wird für
  den Offline-Betrieb geladen: 0,8 von 7,0 MB — bitte mit Netz geöffnet lassen“,
  später „Jetzt offline bereit …“), Entwurfskarte mit Stärke und Zeitstempel.
- **Assistent:** Einheitstyp-Vorschläge nach Eingabe („B Bergungsgruppe“, „FGr
  BT Fachgruppe Bergungstauchen“ …), „Weiter“ blockiert nicht, die Schrittleiste
  zeigt „offen“ und „✓“, Schritt 2 erklärt „Zeitraum bis“ und „Zeitraum vorbei“,
  Schritt 3 „Vom Papier abtippen? … erst Schritt 4“, „Nur Stärke“ mit „… die
  Fahrzeuge folgen in Schritt 4“ (R8-N4 hält, Startseite „mit Stärke,
  Führungskraft und Fahrzeugen“), Schritt 4 „— k. A.“ im Feld „Ausstattung nach
  StAN“ (R8-N7 hält, 112 px breit, nichts abgeschnitten).
- **Übergabe:** „Bogen übergeben…“ mit „Dieser Bogen gehört zum Einsatz
  16.07.2026 – 23.07.2026 — gilt er noch?“, „2 offene Punkte — ansehen ·
  Übergeben ist trotzdem möglich“, „QR-Code im Vollbild zeigen“ („7 Teile
  nacheinander“), „PDF erzeugen“, „Weitere Formate (Link, Tabelle, Excel,
  Blanko)“.
- **Zwei Fenster (R8-N6):** Leiste „Hier wird nichts gespeichert. Das andere
  Fenster hat den Bogen geändert: Ort / Auftrag.“; „Genauer“ nennt Dort und Hier
  mit Sekunden und Personenzahl; die Rückfrage „Stand aus dem anderen Fenster
  laden?“ nennt „dort anders: Ort / Auftrag (dort: „Deich Süd,
  Sandsackkette“, hier: „Großschadenslage nach Stark…“)“ und den Weg zurück über
  „Zuletzt geschlossener Bogen“.
- **Zug (R8-N5):** „2. Zug“, „Zug 2“, „2.zug“, „Zug 2.“ und „ZUG  2“ ergeben eine
  Zeile „2. Zug · 5 Einheit(en) · Stärke 0 / 14 / 41 / 55“, Schreibweise
  normalisiert; „Technischer Zug“ bleibt eigener Zug (2 Züge).
- **Nummern (R8-D2/W1):** „Meldung entfernen?“ nennt „Die Einheiten Nr. 3–6
  rücken auf und heißen danach Nr. 2–5. Am Funk genannte Nummern und ein schon
  gedrucktes Lageblatt passen dann nicht mehr; „Rückgängig“ stellt die alten
  Nummern wieder her.“ plus Hinweis „nur solange die App geöffnet bleibt“; beide
  Knöpfe bleiben bei 360 × 640 mit 200 % Schrift, 180 × 320 und 320 × 568 im
  Bild (Rückfrage mit Rumpf zum Rollen, R8-G1/M2 halten).
- **Lagemonitor (R8-N1/N2):** Telefon 360 × 640, 320 × 568, 200 % und 180 × 320:
  Tabelle in Rahmenbreite (336/298/165 px), „Orga, Ort, Funkruf, F, U, M“ ohne
  Wischen, Einheitentyp unter 640 px entfällt. Fernseher mit 18 Einheiten: „+ 13
  weitere Einheiten · zuletzt gemeldet zuerst“ steht 41 px über der Fußleiste
  bei 1 920 × 1 080 (Zeilenhöhe 43 px), 35 px bei 1 366 × 768 (31 px), 5 px bei
  1 024 × 600; es bleibt keine volle Zeile frei.
- **Große Schrift in der Sammlung (R8-N3):** Der Name der Sammlung hat bei 200 %
  22 px wie bei 100 % (vorher 16 px) und ist größer als die Zeile darunter; die
  Seite hat bei 360 und 320 Pixel keinen seitlichen Überlauf.
- **Unlesbares (R8-D1/H1/O2/E1):** Rohtext liegt unter `eeb.unlesbar.v1`,
  „Daten sichern…“ erzeugt `eeb-sicherung-2026-10-24.json` mit Meldung;
  Wortlaut siehe R9-N4.
- **Schnellerfassung** von der Startseite öffnet denselben Assistenten mit dem
  Hinweis „Es reichen der Name der Einheit hier und die Stärke in Schritt 3“.

## Abgleich mit Runde 8

Grundlage: [../runde-8/neuer-nutzer.md](../runde-8/neuer-nutzer.md) mit „Stand der
Behebung“ in [../runde-8/README.md](../runde-8/README.md).

| Runde-8-Befund | Stand laut Runde 8 | Bewertung Runde 9 | Beobachtung |
| --- | --- | --- | --- |
| R8-N1 Lagemonitor Telefon: F/U/M außerhalb (P3) | behoben | hält | Tabelle 336 von 336 px (298/165 bei 320/180); „F, U, M“ im Bild ohne Wischen; Nebenwirkung bei großer Schrift: R9-N2. |
| R8-N2 „+ n weitere“ bei freiem Platz (P3) | behoben | hält | Rest zwischen „+ n“ und Fußleiste kleiner als eine Zeilenhöhe (1 920 × 1 080: 41 von 43 px; 1 366 × 768: 35 von 31 px, Grenzfall); Zusatz „zuletzt gemeldet zuerst“. |
| R8-N3 Große Schrift: Sammlungsname kleiner (P3) | behoben | hält | `h1` 22 px bei 100 % und 200 %. |
| R8-N4 „Nur Stärke“ und Fahrzeuge (P3) | behoben | hält | Startseite „… mit Stärke, Führungskraft und Fahrzeugen“; Schritt 3 „die Fahrzeuge folgen in Schritt 4“. |
| R8-N5 „Zug 2“ und „2. Zug“ (P3) | behoben | hält | Fünf Schreibweisen ergeben eine Zeile „2. Zug“. |
| R8-N6 Zwei-Fenster ohne Werte (P3) | behoben | hält | Rückfrage nennt „dort“ und „hier“ mit beiden Werten. |
| R8-N7 „— (nicht a“ abgeschnitten (P3) | behoben | hält | „— k. A.“ lesbar in 112 px. |
| R8-D1/H1/O2/E1 Beschädigter Gesamttext | behoben | hält mit Wortlautrest | Rohtext unter `eeb.unlesbar.v1`; „beschädigter Gesamttext“, „Datensicherung“ vor der Sicherung: R9-N4. |
| R8-D2/W1 Nummern verschieben sich | behoben | hält | Rückfrage nennt „Nr. 3–6 rücken auf … Nr. 2–5“. |
| R8-G1/M2 Rückfragen bei Zoom 200 % | behoben | hält | Beide Knöpfe im Bild bei 360 × 640 mit 200 %, 180 × 320, 320 × 568 mit 200 %. |
| R8-A1 Sollstärke zählt mit | teilweise (Grenze) | Stand unverändert | Marke „Sollstärke, nicht gemeldet“, „Davon 1 Einheit nur Sollstärke“; Überschrift „Stärke nicht gezählt“ widerspricht dem Text: R9-N3. |
| R8-H4/S2 Kasten beiseitegelegter Bogen | teilweise | bleibt teilweise | „Neuen Bogen erstellen“ bei 360 × 640 auf y = 660 (Fenster 640); R9-N4. |
| R8-H5/S4 Prellschutz 450/800 ms | teilweise (Grenze) | Stand unverändert | Tipp 0,8 s nach dem Schrittwechsel abgewiesen („Einen Moment …“). |
| R8-N6/E4 (Zwei-Fenster, Personen mit Namen) | behoben | hält | Personenzahl und Zeitstempel im „Genauer“. |
| R7-N1 Zusammenführen-Tipp | Grenze | nicht gesondert geprüft | – |
| R7-N9 Ziffern der Schrittleiste | Grenze | Stand unverändert | „1 2 3 4 5 6“ am Telefon. |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | Grenze | nicht geprüft | – |
| R7-G4/M8, R7-G8/H9, R8-M6 | Grenzen | nicht gesondert geprüft | – |
| Sprungmarke, Umschrift im Papierfeld, CSV nach Nr., Ankündigung der Anonymisierung, Spaltenfolge Einsatztabelle, späte Rückkehr `history.back()` | behoben | nicht nachgestellt | Siehe „Nicht gesondert nachgestellt“. |

Nebenwirkungen der Runde-8-Umbauten: Die Umstellung des Lagemonitors auf die
Systemschrift lässt am Telefon Beschriftungen wachsen, Zahlen nicht (R9-N2). Die
Rohtext-Rettung bewahrt die Daten, der Kasten schiebt die Startknöpfe aus dem Bild
(R9-N4). Die Kennzahlen-Kacheln der Sammlung trennen bei großer Schrift Wörter
(R9-N1; Zuordnung zu Runde 8 nicht bestimmbar, Quelle nicht gelesen). Die
Rückfragen, die Zwei-Fenster-Leiste und die Zug-Normalisierung verursachten bei
mir keinen Fehler. Bilanz: von sieben Befunden meiner Rolle halten sieben. Neu:
kein P0, kein P1, kein P2, vier P3 (R9-N1 bis R9-N4).

## Abschluss

- **Aufgabe geschafft:** ja (eigener Bogen, Übergabe, Schnellerfassung, Ablegen
  in der Sammlung mit Sollstärke, Zug, Entfernen mit Nummern-Rückfrage,
  Zwei-Fenster, Lagemonitor, Rohtext-Rettung).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Überschrift „Stärke nicht gezählt“ klingt, als
  zähle der abgelegte Bogen nicht; er zählt mit (R9-N3).
- **Größtes Einsatzrisiko:** Bei großer Systemschrift liest der Helfer am
  Lagemonitor des Telefons große Beschriftungen und kleine Zahlen und findet die
  Gesamtstärke schwerer (R9-N2).
- **Top-Priorität für die nächste Iteration:** Die Überschrift der Rückfrage
  „Stärke nicht gezählt“ an den Text angleichen (R9-N3) und Zahlen und
  Beschriftungen des Lagemonitors gemeinsam skalieren (R9-N2).
