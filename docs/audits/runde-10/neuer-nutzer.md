# Audit „Neuer Nutzer", Runde 10 (THW-Helfer ohne Einweisung)

Stand: 25.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `441811c` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-9-Befunde (Stand der Behebung in [../runde-9/README.md](../runde-9/README.md),
Bericht meiner Rolle: [../runde-9/neuer-nutzer.md](../runde-9/neuer-nutzer.md)).
Geprüft habe ich auch die Nebenwirkungen der Runde-9-Umbauten (Zahlenfelder,
Rückfrage beim Ausschalten von „Sofortbedarf erfassen", Lagemonitor bei großer
Schrift, Kasten für Beiseitegelegtes, Fenster „Nur Sollplätze") und die
parallelen Änderungen aus der Erprobung (Feld „Ort der Einheit (Pflicht)").

## Prüfaufbau

Playwright aus `node_modules`, Chromium unter `/opt/pw-browsers/chromium`
(`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, jeder Lauf in einem
eigenen Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten
(Server weder neu gebaut noch angehalten). Viewports: Telefon 360 × 640
(Grundlage), 320 × 568, 640 × 360 quer, dazu `html { font-size: 200% }` und die
Nachbildung eines Browser-Zooms von 200 % (180 × 320 Layout-Pixel bei doppeltem
Pixelverhältnis). Der Lagemonitor lief als `?lagemonitor=s1`.

Zustände entstanden durch Bedienung (leeres Gerät, „Neuen Bogen erstellen" mit
Einheitstyp „Bergungsgruppe" und Ort „Oldenburg (NI)", Schritte 1 bis 6,
„Bogen übergeben…" mit „Weitere Formate", „In Einsatz-Sammlung ablegen…" mit
„Als Sollstärke ablegen", „Einheit manuell erfassen…", „Nur Stärke", Wechsel auf
Organisation „Feuerwehr") und durch `localStorage`-Seeds (`eeb.einsaetze.v1`
mit sechs Meldungen aus `examples/thw/` über das Hilfsmodul `lib6.mjs`, mit
`uebung: false` und `stand` auf die Prüfzeit; für den Kasten der Rohtext-Rettung
der um 40 Zeichen gekürzte Gesamttext).

Ich habe zuerst ohne Blick in Berichte getestet (Startseite, Assistent Schritt 1
bis 6, Übergabe-Fenster, Sammlung, manuelle Aufnahme), danach den Bericht der
Runde 9 und den „Stand der Behebung" gelesen und die Behebungen meiner Rolle
nachgestellt.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, Handscanner, echte Handschuhe,
echtes Licht, Bildschirmtastatur, native Datumsauswahl (headless Chromium zeigt
„10/25/2026" im US-Format; nicht gewertet), Safari/WebKit, echtes Drucken,
native Builds.
**Nicht gesondert nachgestellt:** Stufentasten „Dunkler/Heller" des Lagemonitors,
Druck-CSS, ASCII-Dateinamen, „Beiseitegelegtes entfernen…", „Sicherung
einspielen" mit Beiseitegelegtem, Rückwege-Stapel, Umschrift in der
Personenliste, Zug-Normalisierung, R6-O9, R7-N1.

Hinweis zum Prüfwerkzeug: Ein „Weiter"-Tipp kurz (unter etwa einer Sekunde) nach
einem Schrittwechsel wurde unter Last mehrfach nicht angenommen („Einen Moment …"
unten rechts). Mit 1,5 bis 2 s Abstand ging jeder Tipp durch. Das ist der bekannte
Prellschutz (R8-H5/S4), kein neuer Befund. Die Seeds tragen die Zeiträume der
Übungsbögen (Juli 2026); „Zeitraum vorbei" und „Anderer Einsatz?" an allen
Karten sind dadurch bedingt und nicht gewertet.

## Urteil

Der eigene Bogen und der Meldekopf gelingen auch in Runde 10 ohne fremde Hilfe.
Startseite mit zwei Rollen, die Einheitstyp-Vorschläge („Bergung" → „B –
Bergungsgruppe"), Ortsvorschläge („Oldenburg (NI) · OODE · 26129"), die sechs
Schritte mit erklärter Vorbelegung, die Warnzeilen („7 Personenkarten ohne
Angaben zählen in die Stärke — ausfüllen oder entfernen"), „Bogen übergeben…"
mit „6 offene Punkte — ansehen · Übergeben ist trotzdem möglich" und die
Rückfragen sind verständlich. Alle vier Befunde meiner Rolle aus Runde 9
(R9-N1 bis R9-N4) halten; die Zahlenfelder lesen „12,5" als 13 mit Hinweis, lehnen
„-3" und „abc" mit Satz ab, und das Ausschalten von „Sofortbedarf erfassen"
fragt mit den Werten („Diese Angaben gehen verloren: Diesel 120 l.").

Reibung entsteht an drei Stellen (alle P2) und fünf kleinen Stellen (P3): Die
Rückfrage zu „Nur Stärke" nennt „2 erfasste Personen" bei einer Stärke von 9 und
lässt danach neun volle Personenkarten stehen (R10-N1); das Zahlenfeld sagt bei
„20 l" „nicht übernommen" und speichert 20 (R10-N2); die Warnzeile verlangt den
„Namen der eigenen Einheit", das Feld heißt „Ort der Einheit (Pflicht)"
(R10-N3). Kein P0, kein P1.

## Befunde

### R10-N1 [P2] „Nur Stärke": Rückfrage nennt „2 erfasste Personen", dahinter stehen neun Personenkarten

**Priorität:** P2

**Kennzeichnung:** gemessen (Text der Rückfrage; Seitenhöhe 21 484 px bei
Gerätepixelverhältnis 2, also 10 742 Layout-Pixel) und beobachtet; Wirkung im
Einsatz: Risiko.

**Fundstelle / Aufgabe:** Neuer Bogen „Bergungsgruppe" → Schritt 3 → „Nur Stärke
(Meldekopf-Schnellerfassung)".

**Beobachtung:** Vorbelegt sind 9 Sollplätze (GrFü, TrFü und sieben
„Mannschaft"), Stärke 0 / 2 / 7 / 9. Die Rückfrage lautet: „2 erfasste Personen
zählen dann nicht mehr einzeln — die Stärke wird von Hand geführt und startet mit
0 / 2 / 7 / 9. Die Namen bleiben als Erreichbarkeiten erhalten." Von „2 Personen"
ist im selben Satz die Rede, in dem die Stärke 9 heißt; „Namen" gibt es keine. Nach
„Nur Stärke melden" erscheint oben die Zahlenerfassung (Führer, Unterführer,
Mannschaft, Gesamt, Geschlecht, Verpflegung), darunter „Diese 9 Personen zählen
nicht in die Stärke mit" und neun volle Karten „Person 3 von 9 · nicht gezählt" mit
Geschlecht, Ernährung, Fahrerlaubnis (15 Klassen), Funktionen, Qualifikationen.

**Erwartung der Rolle:** Die Rückfrage nennt dieselbe Zahl wie die Stärke (9
Sollplätze, 2 mit Funktion) oder sagt „Die leeren Sollplätze werden nicht mehr
gezählt". Wer nur die Zahl melden will, sieht nicht zehn Bildschirme leerer Karten.

**Folge:** Der Helfer am Meldekopf, der „im Stehen" aufnimmt, liest „2 Personen"
und „startet mit 9" und weiß nicht, was gilt. Er scrollt zum Weitergehen durch
leere Karten, die er nicht braucht (Zeit, Aufmerksamkeit).

**Empfehlung:** In der Rückfrage die Zahl der Personen mit Angaben („keine Person
mit Namen") und die Sollplätze getrennt nennen; in „Nur Stärke" die leeren Karten
einklappen oder hinter „Erreichbarkeit für Rückfragen" verbergen.

**Nachprüfung:** Neuer Bogen mit Vorbelegung → „Nur Stärke": Satz nennt eine
widerspruchsfreie Zahl; Seite unter drei Bildschirmhöhen bei 360 × 640.

### R10-N2 [P2] Zahlenfeld: „20 l" wird als „nicht übernommen" gemeldet, aber als 20 gespeichert

**Priorität:** P2

**Kennzeichnung:** gemessen (Feld „Gemisch (l)", Eintrag `eeb.entwurf.v1`
`sofortbedarf.gemischLiter`).

**Fundstelle / Aufgabe:** Schritt 5 → „Sofortbedarf erfassen" anhaken → Feld
„Gemisch (l)" → „20 l" tippen, Feld verlassen.

**Beobachtung:** Unter dem Feld steht „„20 l" ist keine Zahl — nicht
übernommen." Das Feld zeigt danach „20", im gespeicherten Entwurf steht
`gemischLiter: 20`. „abc" wird dagegen tatsächlich abgelehnt (Feld 0, Satz „„abc"
ist keine Zahl — nicht übernommen"), „-3" ebenso („Minus geht nicht — … wurde
nicht übernommen"); „12,5" wird auf 13 gerundet, „1.500" ergibt 1500.

**Erwartung der Rolle:** Meldung und Feldinhalt sagen dasselbe: entweder „20 l"
wird als 20 übernommen („„20 l" gelesen als 20") oder abgelehnt.

**Folge:** Der Helfer liest „nicht übernommen", tippt neu oder glaubt, das Feld
sei leer; tatsächlich steht 20 l Gemisch im Bedarf, den der Meldekopf zählt.

**Empfehlung:** Nachsatz mit Ziffernrest ehrlich benennen („„20 l" als 20
übernommen") oder konsequent ablehnen.

**Nachprüfung:** „20 l", „20l", „20 Liter" tippen: Hinweis und Feldwert stimmen
überein.

### R10-N3 [P2] Warnzeile fragt nach dem „Namen der Einheit", das Feld heißt „Ort der Einheit (Pflicht)"

**Priorität:** P2

**Kennzeichnung:** gemessen (Wortlaut an Bildschirm und in `hilfen.ts`
Zeile 750) und beobachtet (THW und Feuerwehr, 360 × 640).

**Fundstelle / Aufgabe:** Schritt 1 „Einheit", Zeile „Zugehörigkeit / Kontaktstellen";
Warnzeile am Ende und in der Übersicht.

**Beobachtung:** Die Zeile lautet „⚠ Zugehörigkeit: Der Name der eigenen Einheit
(unterste Ebene) fehlt." Das Feld darüber heißt seit der Änderung „Ort der Einheit
(Pflicht)" (THW mit Platzhalter „tippen für Vorschläge…", bei Feuerwehr leer ohne
Platzhalter); ein Feld „Name" gibt es nicht. Auch der Satz darüber („Aus Name,
Organisation und Einheitstyp bildet sich die Bezeichnung auf dem Bogen: THW")
spricht von „Name".

**Erwartung der Rolle:** Die Warnzeile nennt das Feld mit seiner Beschriftung:
„Ort der Einheit fehlt".

**Folge:** Der Helfer sucht ein Feld „Name der Einheit", trägt den Namen einer
Einheit in „Organisationsname (optional)" ein und lässt „Ort" leer; die Warnung
bleibt stehen. Gering bis mittel: Er kommt nach dem zweiten Versuch weiter.

**Empfehlung:** Warnung, Erklärsatz und Feldbeschriftung auf denselben Begriff
bringen („Ort der Einheit").

**Nachprüfung:** Schritt 1 leer: Warnzeile wiederholt die Feldbeschriftung; nach
Eingabe des Ortes verschwindet sie.

### R10-N4 [P3] Verpflegung leeren setzt 0 und stellt die Vorbelegung nicht wieder her

**Priorität:** P3

**Kennzeichnung:** gemessen (Entwurf `verpflegungPersonen: 0` nach Leeren und
Verlassen des Feldes).

**Fundstelle / Aufgabe:** Schritt 5 → Feld „Verpflegung (Personen)" (vorbelegt 9)
leeren.

**Beobachtung:** Der Hinweis unter den Feldern sagt „Verpflegung ist aus der
Stärke vorbelegt und zieht mit ihr mit; abweichend eintragen …". Nach dem Leeren
steht 0 im Feld und im Entwurf; die Verbindung zur Stärke ist weg, ein Hinweis
erscheint nicht.

**Erwartung der Rolle:** Leeres Feld heißt „wie Stärke" oder es erscheint ein Satz
„Verpflegung steht jetzt auf 0".

**Folge:** Gering: Der Meldekopf zählt 0 Portionen; erst die Übersicht zeigt es.

**Empfehlung:** Leeres Feld auf die Vorbelegung zurückführen oder den Wechsel in
einem Satz nennen.

**Nachprüfung:** Feld leeren, verlassen: Wert 9 mit Satz „wieder wie Stärke" oder
Hinweis „0".

### R10-N5 [P3] „Als Sollstärke ablegen": Die Sammlung öffnet mitten in der Seite

**Priorität:** P3

**Kennzeichnung:** gemessen (`scrollY` 281, Oberkante der Überschrift bei −132 px,
über 3 s unverändert; 360 × 640).

**Fundstelle / Aufgabe:** Übersicht → „In Einsatz-Sammlung ablegen…" → Sammlung →
„Als Sollstärke ablegen".

**Beobachtung:** Die Sammlung erscheint so weit unten, dass Name und die oberen
Kacheln („7 Einheiten") angeschnitten sind; im Bild stehen „Davon 1 Einheit nur
Sollstärke, nicht gemeldet (9 Personen) — zählt in der Summe mit", die drei
Aufnahme-Knöpfe, „Dein eigener Bogen … ist noch offen" und „Zuletzt abgelegt:
„THW Oldenburg (NI) Bergungsgruppe" · jetzt 7 Einheiten, Gesamt 68" (hinter der
Ansichtsleiste angeschnitten). Wortlaut des Fensters und „Zuletzt abgelegt"
halten (R9-N3).

**Erwartung der Rolle:** Nach dem Ablegen steht die Sammlung oben, oder die Karte
„Nr. 7" ist im Bild.

**Folge:** Gering: Wer wissen will, in welcher Sammlung er gelandet ist, scrollt
nach oben.

**Empfehlung:** Nach dem Ablegen an den Kopf der Sammlung springen oder die neue
Karte zeigen.

**Nachprüfung:** Ablegen: `scrollY` 0 oder neue Karte sichtbar.

### R10-N6 [P3] Zoom 180 × 320: „Gesamtübersi / cht" bricht im Wort, die Schrittleiste zeigt nur Punkte

**Priorität:** P3

**Kennzeichnung:** beobachtet (Screenshot, Nachbildung Browser-Zoom 200 %).

**Fundstelle / Aufgabe:** Übersicht (Schritt 6) bei 180 × 320.

**Beobachtung:** Die Überschrift bricht „Gesamtübersi / cht"; „Bogen übergeben…"
und „In Einsatz-Sammlung ablegen…" brechen in zwei bis drei Zeilen. Die Schrittleiste
ist so gescrollt, dass „4 •", „5", „6" stehen; „offen" wird zum Punkt (die
Ziffern allein sind bekannte Grenze R7-N9). Seitlicher Überlauf: keiner.

**Erwartung der Rolle:** Überschriften brechen an Wortgrenzen oder die Schrift
schrumpft einmal; die Punkte tragen eine Erklärung.

**Folge:** Gering: Der Helfer liest „Gesamtübersicht" verzögert; „•" ohne Text
bedeutet nicht „offen".

**Empfehlung:** Überschrift nicht im Wort trennen; „•" im Zoom mit Namen versehen
oder erklären.

**Nachprüfung:** 180 × 320: Überschrift der Übersicht ohne Wortbruch.

### R10-N7 [P3] Auswahlfelder und Platzhalter in schmalen Spalten abgeschnitten

**Priorität:** P3

**Kennzeichnung:** beobachtet (360 × 640, Screenshots).

**Fundstelle / Aufgabe:** Schritt 1 und 4.

**Beobachtung:** „Ebene (eigene Einheit)" bei Feuerwehr zeigt „Gemeinde – Gemeind▾",
„Ort der Einheit (Pflicht)" und „Dienststellen-Kürzel" sind nur etwa 60 % breit
(Platzhalter „z. B. OODE für OV Olde…" läuft ab); Schritt 4: „Fahrzeugtyp" zeigt
„GKW – Gerätekraftwag▾", „Sitzplätze" den Platzhalter „9 (Richtwert," ,
„Kennwort" „Heros – Heros (THW)" abgeschnitten. Nach der Wahl lässt sich der
volle Text nur an anderer Stelle lesen (Übersicht).

**Erwartung der Rolle:** Das Auswahlfeld zeigt die Wahl lesbar; Platzhalter sind
kurz genug.

**Folge:** Gering: Der Helfer erkennt „GKW" und „Heros"; bei ähnlichen Typen
(„GKW I" und „GKW II" mit Namensende) kann er verwechseln.

**Empfehlung:** Felder in voller Zeilenbreite oder Kurzform vor der Langform;
Platzhalter kürzen.

**Nachprüfung:** 360 × 640: Wahl in Schritt 1 und 4 ohne Abschnitt am Ende.

### R10-N8 [P3] „Ernährung (aus Personal)" sieht aus wie ein Feld, in das man tippen kann

**Priorität:** P3

**Kennzeichnung:** beobachtet (Screenshot Schritt 5, 360 × 640).

**Fundstelle / Aufgabe:** Schritt 5 neben „Verpflegung (Personen)".

**Beobachtung:** Ein grau gestrichelter Kasten mit „0 vegetarisch · 0 vegan" steht
neben dem Eingabefeld; er ist nicht bedienbar, der Hinweis, wo man die Ernährung
einträgt (Personenkarte, „Ernährung"), fehlt.

**Erwartung der Rolle:** Ein Hinweis „in Schritt 3 bei der Person" oder ein
Anzeigefeld ohne Feldform.

**Folge:** Gering: Der Helfer tippt ins Leere und sucht.

**Empfehlung:** Satz „Wird bei den Personen in Schritt 3 gewählt" ergänzen.

**Nachprüfung:** Kasten antippen: Hinweis oder Sprung zu Schritt 3.

## Verweise auf Befunde in anderen Berichten

- **Prellschutz nach Schrittwechsel:** bekannte Grenze R8-H5/S4; hier nur der
  Stand (Tipp unter etwa 1 s abgewiesen).
- **Ziffern der Schrittleiste:** bekannte Grenze R7-N9; Telefon 360 × 640 zeigt
  „1 ✓ · 2 ✓ · 3 offen · 4 offen · 5 · 6", bei Zoom Ziffern und Punkte.
- **Zeitgruppe „25 1023 okt 26" am Lagemonitor:** [../runde-7/neuer-nutzer.md](../runde-7/neuer-nutzer.md),
  Befund zur Zeitgruppe; Stand unverändert, mit Beschriftung „Uhr".
- **Sollstärke zählt mit:** bekannte Grenze R8-A1; Marke und Satz „Davon 1 Einheit
  nur Sollstärke, nicht gemeldet (9 Personen)" vorhanden.
- **Geräteuhr/Datumsformat:** Datumsfelder zeigen im Prüfwerkzeug „10/25/2026";
  nicht gewertet.

## Bestätigtes

- **Startseite:** „Meinen Bogen ausfüllen" und „Bögen sammeln (Meldekopf)" mit je
  einem Satz, „So funktioniert's" in drei Schritten, Offline-Zeile mit Fortschritt
  („Wird für den Offline-Betrieb geladen: 1,9 von 7,0 MB — bitte mit Netz geöffnet
  lassen", später „Jetzt offline bereit …"), Papier-Rückfallebene („Leeren Vordruck
  drucken (PDF) · Papier-Reserve zum Ausfüllen mit der Hand").
- **Assistent:** Einheitstyp-Vorschläge nach „Bergung" (sechs Treffer),
  Ortsvorschläge mit Kürzel und PLZ, Schritt 2 mit Erklärung zu „Zeitraum bis" und
  „Zeitraum vorbei", Schritt 3 „Vom Papier abtippen? … erst Schritt 4", Schritt 4
  „— k. A." im Feld „Ausstattung nach StAN", Funkrufname mit „Kennwort … eigener
  Standort", Warnungen „Fahrzeug 1 hat noch kein Kennzeichen".
- **Zahlenfelder (R9-E1):** „12,5" → 13 mit „„12,5" auf ganze Liter gerundet: 13.";
  „-3" und „abc" abgelehnt mit Satz; „1.500" → 1500; `inputmode="numeric"` an
  allen vier Mengenfeldern (Ausnahme R10-N2).
- **Rückfrage Schalter (R9-D1):** „Sofortbedarf entfernen? Diese Angaben gehen
  verloren: Diesel 120 l. Die Verpflegung kommt beim erneuten Anhaken wieder aus der
  Stärke." mit „Sofortbedarf entfernen" (rot) und „Behalten".
- **Übergabe:** „Bogen übergeben…" mit „6 offene Punkte — ansehen · Übergeben ist
  trotzdem möglich", „QR-Code im Vollbild zeigen", „PDF erzeugen" („immer hell,
  für Papier"), „Weitere Formate (Link, Tabelle, Excel, Blanko)" mit Erklärung je
  Format („Zum Auswerten, nicht zum Zurücklesen").
- **Ablegen:** „In Einsatz-Sammlung ablegen" mit Satz „Dein Bogen bleibt unter
  „Fortsetzen" … geöffnet", Fenster „Nur Sollplätze, keine gemeldete Stärke" (R9-N3
  behoben), „Zuletzt abgelegt: …".
- **Manuelle Aufnahme:** „Aufnahme für: Hochwasser Musterstadt", Felder „Eingetroffen
  um (vom Meldeblock)", „Nr. laut Zettel (leer = die App vergibt)", „Zug / Verband
  (laut Zettel)", Knopf „In Einsatz übernehmen" im festen Fuß.
- **Kasten Rohtext-Rettung (R9-N4):** „Nicht lesbar: Sammlung „Hochwasser
  Musterstadt" (etwa 6 Meldungen). Liegt beiseite, fehlt in Listen und Zählung. ›";
  „Neuen Bogen erstellen" bei 360 × 640 auf y = 477, bei 320 × 568 auf y = 492
  (beide im Bild).
- **Lagemonitor am Telefon:** Zahlen größer als Beschriftung (R9-N2): 100 %
  Zahlen 20 px, Gesamt 23 px, Beschriftung 14 px; 200 % 31,5/36,2 gegen 22,1 px;
  320 × 568 mit 200 %: 28/32,2 gegen 19,6 px; Zoom 180 × 320: 15,8/18,1 gegen
  11 px; kein seitlicher Überlauf.
- **Kacheln der Sammlung (R9-N1):** „Einheiten", „Führer", „Unterf.", „Mannsch.",
  „Gesamt" einzeilig bei 200 % (360 und 320 Pixel), kein Überlauf.

## Abgleich mit Runde 9

| Runde-9-Befund | Stand laut Runde 9 | Bewertung Runde 10 | Beobachtung |
| --- | --- | --- | --- |
| R9-N1 Kachel-Labels brechen im Wort (P3) | behoben | hält | Alle fünf Beschriftungen eine Textzeile bei 200 % (360 und 320). |
| R9-N2 Lagemonitor Telefon: Zahlen kleiner als Labels (P3) | behoben | hält | Gesamt größer als Beschriftung in allen vier Fällen. |
| R9-N3 „Stärke nicht gezählt" widerspricht (P3) | behoben | hält | Überschrift „Nur Sollplätze, keine gemeldete Stärke"; „Zuletzt abgelegt". Landeposition: R10-N5. |
| R9-N4 Kasten Rohtext (P3) | behoben | hält | „Neuen Bogen erstellen" bei y = 477 (360 × 640); bei 200 % y = 868 und bei Zoom 180 × 320 y = 673, also zu scrollen (Stand, nicht neu gewertet). |
| R9-E1 Komma/Minus im Zahlenfeld | behoben | hält mit Rest | Hinweise lesbar; Rest R10-N2. |
| R9-D1 Schalter ohne Rückfrage | behoben | hält | „Sofortbedarf entfernen?" mit Werten. |
| R9-H5/S2 Tipp-Sperre 600 ms | behoben | hält | „Einen Moment …"; unter Last Tipp nach unter 1 s abgewiesen (Grenze R8-H5/S4). |
| R9-W3 Weiter-Taste | behoben | hält | „Zur Übersicht →" in Schritt 5. |
| R9-A2 Vorbelegung gekennzeichnet | behoben | hält | „Verpflegung ist aus der Stärke vorbelegt …"; Rest R10-N4. |
| R9-S1 manuelle Aufnahme behält Zettel-Angaben | behoben | teilweise geprüft | Felder „Nr." und „Zug" nehmen „7" und „2. Zug"; Karte der Sammlung nicht nachgeprüft. |
| Parallele Änderung „Ort der Einheit (Pflicht)" | neu | Nebenwirkung | Warnzeile nennt „Name": R10-N3. |
| R7-N9 Ziffern der Schrittleiste | Grenze | Stand unverändert | Ziffern und Punkte. |
| R6-O9, R7-N1, R7-G4/M8, R7-G8/H9, R8-A1, R8-M6, R9-M3, R9-G5 | Grenzen | nicht gesondert geprüft, R8-A1 Stand unverändert | R8-A1: Marke vorhanden. |

Bilanz: Von vier Befunden meiner Rolle halten vier. Neu: kein P0, kein P1, drei
P2 (R10-N1 bis R10-N3), fünf P3 (R10-N4 bis R10-N8).

## Abschluss

- **Aufgabe geschafft:** ja (eigener Bogen bis zur Übergabe, Ablegen in der
  Sammlung als Sollstärke, manuelle Aufnahme, Sofortbedarf mit Rückfrage,
  Lagemonitor am Telefon, Kasten Rohtext-Rettung).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Warnzeile verlangt den „Namen der Einheit",
  das Feld heißt „Ort der Einheit (Pflicht)" (R10-N3).
- **Größtes Einsatzrisiko:** „20 l" meldet „nicht übernommen", der Entwurf trägt
  20 l, der Meldekopf zählt sie mit (R10-N2).
- **Top-Priorität für die nächste Iteration:** Meldung und Wert im Zahlenfeld in
  Übereinstimmung bringen (R10-N2) und die Rückfrage „Nur Stärke" mit der Stärke
  abgleichen (R10-N1).
