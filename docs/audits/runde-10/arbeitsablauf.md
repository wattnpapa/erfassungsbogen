# Audit „Arbeitsablauf", Runde 10 (Einheit → Meldekopf → zweites Gerät)

Stand: 25.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `441811c` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Build wurde weder neu gebaut noch
wurde der Server angefasst. Wiederholung nach der Behebung der Runde-9-Befunde
R9-W1 bis R9-W5 und der übrigen Runde-9-Änderungen, soweit sie den Arbeitsablauf
berühren (Zahlenfelder, Rückfrage beim Ausschalten von „Sofortbedarf erfassen",
Wahl-Rückfragen mit Wegen im festen Fuß, Zettel-Angaben der manuellen Aufnahme,
Sollstärke-Marke, Zug-Normalisierung, Umschrift, Lagemonitor, ASCII-Dateinamen).
Dazu die Änderungen aus der Erprobung: „Ort der Einheit (Pflicht)", Einheiten-
Anzahl in der Sammlung. Der Abgleich bezieht sich auf
[Runde 9](../runde-9/arbeitsablauf.md) samt „Stand der Behebung" in der
[README von Runde 9](../runde-9/README.md).

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Grundeinstellung Telefon
360 × 640; zusätzlich 320 × 568, 640 × 360 quer, Zoom nachgestellt (180 × 320
bei Gerätepixelfaktor 4) und `html { font-size: 200% }`. Jeder Lauf hatte einen
eigenen Browser-Kontext; elf weitere Prüfer nutzten den Server gleichzeitig. Die
Geräteuhr stand auf dem 25.10.2026; Seeds tragen `uebung: false` und einen Stand
auf die Minute des Laufs. Die Einsatzzeiträume der Übungsbögen liegen teils in
der Vergangenheit (dann erscheinen „Zeitraum vorbei" und „Anderer Einsatz?"; das
ist eine Folge der Seeds und kein Befund). Für die Nachmeldung habe ich die
Zeiträume der Seeds auf heute gesetzt. Tipp-Sperre mit mindestens 0,9 s
eingehalten.

- **A-Gerät (Einheit):** leerer Kontext, „Neuen Bogen erstellen" über die
  Schritte 1 bis 6 (Typ „Bergungsgruppe", Ort „Musterstadt", Auftrag
  „Deichsicherung"), Neuladen in Schritt 3 und „Fortsetzen"; Entwürfe aus
  `examples/thw/` (`001`, `002`, `grossbogen-verstaerkter-bergungszug`). Übergabe
  über „Bogen übergeben… → Weitere Formate → Link teilen" (`navigator.share`
  abgefangen, Host auf `localhost:4173` umgeschrieben) und „PDF erzeugen"
  (Download gespeichert, mit `pdftotext` gelesen). Links: neuerer Stand (120 l
  Diesel, anderer Ort), älterer Stand (60 l), Bogen mit neun leeren Sollplätzen.
- **M1 (Meldekopf):** Sammlung „Hochwasser Musterstadt" als Seed mit sechs
  Einheiten: Empfangsdialog, Nachmeldung in fünf Lagen, Zug zuordnen, Abrücken
  und Rückgängig, Lageblatt, CSV, Excel, „Einsatz weitergeben / sichern" samt
  „Einsatz importieren…" auf einem zweiten Gerät, Lagemonitor in vier Lagen,
  „Einheit manuell erfassen…" mit Zettel-Angaben und Neuladen.
- **Eingaben:** Sofortbedarf mit „150,5", „-20", „80-" und Ausschalten des
  Schalters; Zwei-Fenster-Leiste mit Diesel und Ort.

Reihenfolge: Ich habe zuerst blind getestet (Startseite, Einheit von vorn bis zur
Übersicht, Übergabe, Empfang, Sammlung, manuelle Aufnahme) und erst danach den
Bericht „Arbeitsablauf" aus Runde 9 und „Stand der Behebung" gelesen. Berichte
anderer Rollen aus Runde 10 habe ich nicht herangezogen. Skripte und Bilder:
`scratchpad/runde10/w/`.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit füllt ihren Bogen aus und übergibt ihn; **Annahme:** der Link kommt
   per Chat oder als PDF, der QR-Code wird vom Display gescannt.
2. Der Meldekopf nimmt auf, entscheidet bei einer Nachmeldung über die Fassung,
   vergibt Zug, lässt abrücken, druckt das Lageblatt und zeigt die Lage am
   Fernseher.
3. Fällt das Gerät aus oder löst ein zweites ab, geht die Lage als Sammel-PDF
   weiter.
4. Hat der Meldekopf eine Einheit nur auf dem Zettel, nimmt er sie von Hand auf
   (Nr., Zug und Eintreffzeit laut Zettel).

**Nicht prüfbar:** Kamera-Scan, echtes Drucken, Handscanner, natives Share-Sheet,
Darstellung der Excel-Datei in Excel, WebKit, native Builds, ein Uhrversatz
zwischen zwei Geräten. Papier-Abgleich („Lage vom Papier abgleichen…") habe ich
in dieser Runde nicht erneut durchgespielt. Das Datumsfeld zeigt hier das
US-Format (Browsersprache der Testumgebung), kein Befund.

## Urteil

Der Arbeitsablauf trägt, und alle fünf Runde-9-Befunde zum Ablauf sind behoben.
Die Rückfrage bei einer Nachmeldung zeigt ihre Wege jetzt in jeder geprüften
Lage ganz im Bild (360 × 640, 320 × 568, 640 × 360 quer, 200 % Schrift, Zoom
180 × 320). Der Empfangsdialog nennt „nur Sollstärke: 9 Plätze ohne Namen,
niemand hat gezählt". Die Zwei-Fenster-Leiste nennt bei Ort und Diesel beide
Werte. Nach „Bearbeiten" in der Übersicht steht in der Fußleiste „Zur Übersicht →".
Die PDF schreibt die Ansprechperson und die Personenliste gleich in Umschrift, und
die Quittung zählt eine Person. Die manuelle Aufnahme behält „Eingetroffen um",
„Nr." und „Zug" über das Neuladen. Das Sammel-PDF lässt sich auf einem zweiten
Gerät einlesen und trägt den Zug mit.

Reibung bleibt an vier kleinen Stellen: Das Zeichen „Ł" wird in der PDF still zu
„L" (R10-W1), die Seite „2. Einsatz" der manuellen Aufnahme spricht die Einheit
statt den Meldekopf an (R10-W2), das Neuladen mitten im eigenen Bogen und mitten
in der manuellen Aufnahme führt an unterschiedliche Stellen (R10-W3), und im
Querformat liegen bei der Rückfrage zum älteren Stand die Sätze, die die drei
Wege erklären, außerhalb des Bildes (R10-W4).

Alle Einzelaufgaben schafft man ohne fremde Hilfe. Ein P0, P1 oder P2 habe ich
nicht gefunden.

## Befunde

### R10-W1 [P3] PDF: Zeichen außerhalb des PDF-Zeichensatzes werden ohne Vermerk ersetzt („Łukasz" → „Lukasz"), die Quittung nennt nur die kyrillischen Namen

**Priorität:** P3

**Kennzeichnung:** beobachtet (PDF mit `pdftotext -layout` gelesen, Quittung im
Dialog gelesen)

**Fundstelle / Aufgabe:** „Bogen übergeben… → PDF erzeugen" mit Bogen `001`, in
dem die ersten beiden Personen „Мария Иванова" und „Zoë Łukasz" heißen. Rest von
R9-W3.

**Beobachtung:**
- Feld „Ansprechpartner/in": „Marija Ivanova (Umschrift)". Personenliste: „Ivanova,
  Marija (Umschrift)". Beides stimmt überein (R9-W3 behoben).
- Quittung: „1 Name steht in Umschrift („(Umschrift)" dahinter): Мария Иванова →
  Marija Ivanova (Ansprechperson). Der QR-Code trägt die Namen unverändert."
- Zweite Person: In der Liste steht „Lukasz, Zoë" ohne den Zusatz „(Umschrift)",
  die Quittung erwähnt sie nicht.

**Erwartung der Rolle:** Wird ein Name auf dem Blatt anders geschrieben, als er im
Bogen steht, steht es dabei und in der Quittung.

**Folge:** Gering. „Lukasz" ist lesbar; beim Abgleich einer Namensliste vom Papier
fällt der Unterschied zum QR-Code nicht auf.

**Empfehlung:** Jede Ersetzung gleich behandeln: Zusatz „(Umschrift)" und Nennung in
der Quittung, auch bei einem einzelnen Buchstaben.

**Nachprüfung:** Bogen mit „Łukasz" als zweiter Person als PDF erzeugen: Liste und
Quittung nennen beide Personen.

### R10-W2 [P3] Manuelle Aufnahme, Schritt „2. Einsatz": Text und Felder sind an die Einheit gerichtet, nicht an den Meldekopf

**Priorität:** P3

**Kennzeichnung:** beobachtet (Text gelesen, Bild `k1.png`); Wirkung auf einen
Meldekopf-Helfer ist **Risiko**

**Fundstelle / Aufgabe:** Sammlung → „Einheit manuell erfassen…" → Schritt 2.
Kopf der Seite: „Aufnahme für: Hochwasser Musterstadt".

**Beobachtung:** Der Schritt trägt denselben Text wie im eigenen Bogen: „Wofür deine
Einheit gemeldet wird …", „sonst steht die Einheit am Folgetag beim Meldekopf als
„Zeitraum vorbei"", „Für den eigenen Bogen (Nachweis, Freistellung, Abrechnung)
hier eintragen — der Meldekopf führt seine Eintreff- und Abrückzeiten getrennt",
dazu die Haken „Einsatzbeginn eintragen", „Einsatzende eintragen" und „Dies ist eine
Übung". Der Meldekopf trägt die Eintreffzeit aber schon in Schritt 1 („Eingetroffen
um (vom Meldeblock)") ein.

**Erwartung der Rolle:** Wer am Meldekopf eine Einheit vom Zettel aufnimmt, will in
Schritt 2 sehen, was für ihn gilt (Auftrag der Einheit, Übung ja/nein), und nicht
lesen, was die Einheit in ihrem eigenen Bogen tun soll.

**Folge:** Gering. Der Meldekopf überspringt den Schritt oder fragt sich, ob
„Einsatzbeginn eintragen" die Eintreffzeit aus Schritt 1 ersetzt. **Risiko:** ein
Haken „Dies ist eine Übung" aus Versehen, der die Einheit aus der Lage nimmt.

**Empfehlung:** In der Aufnahme den Erklärtext auf den Meldekopf zuschneiden und die
Zeithaken ausblenden oder erklären, wie sie sich zu „Eingetroffen um" verhalten.

**Nachprüfung:** Manuelle Aufnahme, Schritt 2: Der Text spricht den Meldekopf an,
die Eintreffzeit steht an genau einer Stelle.

### R10-W3 [P3] Neuladen mitten im Bogen: Der eigene Bogen kommt über die Startseite („Fortsetzen"), die manuelle Aufnahme öffnet gleich wieder

**Priorität:** P3

**Kennzeichnung:** beobachtet (je ein Neuladen)

**Fundstelle / Aufgabe:** (a) „Neuen Bogen erstellen", Schritt 3, Neuladen;
(b) Sammlung → „Einheit manuell erfassen…", Schritt 1 mit Zettel-Angaben,
Neuladen.

**Beobachtung:** (a) Nach dem Neuladen steht die Startseite mit „Entwurf vom
25.10.26 … wiederhergestellt", „Fortsetzen / Verwerfen"; „Fortsetzen" führt in
Schritt 3 zurück, nichts ist verloren. (b) Nach dem Neuladen steht die Aufnahme
sofort im Bild („Aufnahme für: Hochwasser Musterstadt", „Entwurf … wiederhergestellt"),
mit Zeit 09:41, Nr. 7 und „2.ZUG" (R9-S1 hält).

**Erwartung der Rolle:** Nach einem Absturz oder Neuladen (Akkuwechsel, Tab
verworfen) landet der Helfer an derselben Stelle, an der er war, in beiden
Abläufen gleich.

**Folge:** Gering. Ein Tipp mehr beim eigenen Bogen. Wer „Verwerfen" statt
„Fortsetzen" tippt, verliert den Entwurf; die Tasten stehen nebeneinander (nicht
darauf geprüft, ob eine Rückfrage folgt).

**Empfehlung:** Beide Abläufe gleich behandeln: entweder immer sofort zur letzten
Stelle oder immer über die Startseite.

**Nachprüfung:** Neuladen in Schritt 3 des eigenen Bogens: Schritt 3 steht im Bild
oder die Startseite führt mit einem Tipp dorthin; die Aufnahme verhält sich
genauso.

### R10-W4 [P3] Rückfrage zu einem älteren Stand im Querformat: Vorbelegt ist „Nur in die Historie legen", die Sätze, die die Wege erklären, stehen außerhalb des Bildes

**Priorität:** P3

**Kennzeichnung:** gemessen (Knöpfe vermessen) und im Screenshot beobachtet
(`o-quer-n-alt.png`)

**Fundstelle / Aufgabe:** Meldekopf nimmt den Link einer schon gemeldeten Einheit
mit älterem Stand auf („Einheit ist bereits gemeldet").

**Beobachtung:** Bei 640 × 360 stehen alle vier Knöpfe im Bild (drei Wege je
149 × 77 px nebeneinander, „Abbrechen" 494 × 44 px darunter). Der dunkle, vorbelegte
Knopf ist „Nur in die Historie legen". Im Rumpf sichtbar sind nur die Überschrift,
die Zeile „Bisher … Stand 10:19" und der Anfang von „Neu …"; die Stände („Neu … 09:49"),
die Zeile „Geändert" und die Sätze zu den Wegen („Der Bogen trägt einen älteren
Stand … — er gilt trotzdem") liegen unter dem Schatten am Rumpfende. Bei 360 × 640
und 320 × 568 stehen alle Wege untereinander, bei 360 × 640 mit 200 % Schrift und im
Zoom 180 × 320 sind alle vier Knöpfe ganz im Bild (gemessen).

**Erwartung der Rolle:** Wer eine Wahl vorbelegt vorfindet, sieht beim Öffnen,
warum sie empfohlen wird.

**Folge:** Gering. Die vorbelegte Wahl ist die sichere (die bisherige Meldung gilt
weiter, nichts ändert sich); wer „Als neue Fassung anhängen" wollte, findet den Knopf
im Bild. Es kostet das Rollen, um den Unterschied zu lesen.

**Empfehlung:** Im Querformat die Sätze zu den Wegen an den Knöpfen kürzen oder die
Zeile „Neu … Stand" mit dem Hinweis „älter" vor die Knöpfe setzen.

**Nachprüfung:** Link mit älterem Stand bei 640 × 360 aufnehmen: Der Hinweis „älter
als die bisherige Meldung" steht im ersten Bild.

## Verweise auf andere Berichte

Ich habe in dieser Runde keinen eigenen Befund gemessen, den ein anderer
Runde-10-Bericht führt und den ich daher nur verweisen würde. Die Berichte
anderer Rollen habe ich vor dem Schreiben nicht gelesen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Von der Startseite bis zur Übergabe (Einheit):** „Neuen Bogen erstellen" →
  Schritt 1 bis 6 mit Vorbelegung (Bergungsgruppe: 9 Plätze, 2 Fahrzeuge „GKW" und
  „Anh Plane/Spriegel", Funkruf „Heros Musterstadt 22/51"), „Ort der Einheit
  (Pflicht)" erscheint in der Übersicht als „OV Musterstadt", sechs offene Punkte
  zum Antippen, „Bogen übergeben… / In Einsatz-Sammlung ablegen… / Als Vorlage
  speichern / Bogen schließen". Warnung bei fehlendem Namen lässt „Weiter" zu.
- **Übergabe:** Dialog „Bogen übergeben" nennt den Einsatzzeitraum („gilt er noch?")
  und „Übergeben ist trotzdem möglich"; „Link geteilt 10:15 Uhr — Empfang nicht
  bestätigt."; PDF-Quittung mit Dateinamen und Hinweis zur Umschrift.
- **Empfang:** „Meldung von … empfangen. Stärke 0 / 2 / 9 / 11. Wohin damit?" mit
  „In „…" aufnehmen / Bogen öffnen / Abbrechen. Bei neun leeren Plätzen: „(nur
  Sollstärke: 9 Plätze ohne Namen, niemand hat gezählt)"; danach „Davon 1 Einheit
  nur Sollstärke, nicht gemeldet (9 Personen) — zählt in der Summe mit".
- **Nachmeldung (R9-W1):** Alle Wege im festen Fuß ganz im Bild in allen fünf
  Lagen; Erklärsätze bei jedem Weg; „Geändert: Diesel 80 l → 120 l · Ort / Auftrag
  geändert"; bei älterem Stand zusätzlich „Nur in die Historie legen".
- **Zahlenfelder:** „150,5" → „auf ganze Liter gerundet: 151"; „-20" → „Minus geht
  nicht — … nicht übernommen"; „80-" → „ist keine Zahl — nicht übernommen", Wert
  bleibt 80; Ziffernblock (`inputmode=numeric`).
- **Schalter „Sofortbedarf erfassen":** Ausschalten fragt „Sofortbedarf entfernen?
  Diese Angaben gehen verloren: Diesel 80 l …" mit „Sofortbedarf entfernen /
  Behalten".
- **Fußleiste nach „Bearbeiten" (R9-W4):** „Zur Übersicht →" in Schritt 3.
- **Manuelle Aufnahme:** Rückfrage „Nur Sollplätze, keine gemeldete Stärke" mit drei
  Wegen („Stärke jetzt eintragen / Als Sollstärke ablegen / Abbrechen"); „Nr. schon
  vergeben — Nr. 2 gehört schon „THW Bamberg …"" mit „Alles klar"; Zettel-Angaben
  überleben das Neuladen.
- **Zug:** „1.zug" wird zu „1. Zug"; „Zwischensummen nach Zug (1 Zug + Einheiten
  ohne Zug)", „5 ohne Zug".
- **Abrücken:** Quittung „Abgerückt 10:31: Nr. 1 … Rückgängig", Zähler „5 zählend";
  „Rückgängig" stellt die Einheit wieder her (4 → 5 zählend); an der abgerückten
  Einheit steht „Wieder anwesend".
- **Zweites Gerät:** „Einsatz weitergeben / sichern" erzeugt
  `eeb-einsatz-251025okt26_Hochwasser_Musterstadt.pdf`; „Einsatz importieren…" auf
  einem leeren Gerät: „Einsatz „Hochwasser Musterstadt" übernommen: 6 Einheiten,
  davon 6 anwesend", Zug „Zug Ä/Ü" und Summen identisch.
- **Exporte und Dateinamen:** Lageblatt, CSV und Excel mit ASCII-Dateinamen
  (`eeb-lageblatt-…`, `eeb-einsatz-Hochwasser_Musterstadt.csv`,
  `…-oldenburg.xlsx`); CSV führt „zuletzt erzeugt 25.10.2026, 10:26 · seitdem keine
  neuen Bögen"; Lageblatt-Quittung „Lageblatt erstellt 10:25 · seitdem keine neue
  Meldung".
- **Zwei-Fenster-Leiste (R9-W2):** „Ort / Auftrag (dort: „Deich Süd", hier:
  „Hochwasserlage Albs…"); Diesel (dort: „150 l", hier: „80 l")" mit „Anderen Stand
  laden / Meine Fassung behalten / Genauer".
- **Lagemonitor am Telefon:** Fenster `?lagemonitor=s1`, „Stärke F / U / M // gesamt
  1 / 15 / 43 // 59", „6 Einheiten · 22 Fahrzeuge", Tabelle mit Orga, Funkruf/Ort,
  F, U, M ohne Namen; kein Seitenüberlauf bei 360, 320, 640 und 200 %; Tasten 44 px
  hoch.

## Abgleich mit Runde 9

Geprüft gegen `runde-9/arbeitsablauf.md` samt „Stand der Behebung" und gegen die
„Bekannten Grenzen".

| Befund Runde 9 | Stand in Runde 10 | Beleg |
| --- | --- | --- |
| R9-W1 Rückfrage Nachmeldung: beim Öffnen keine Wahl ganz im Bild (P2) | **hält** | Alle Wege ganz im Bild bei 360 × 640, 320 × 568, 640 × 360, 200 % und Zoom 180 × 320; Rest R10-W4. |
| R9-W2 Zwei-Fenster-Leiste ohne Werte bei Ort und Diesel (P3) | **hält** | „Diesel (dort: „150 l", hier: „80 l")", ebenso Ort. |
| R9-W3 Umschrift nur im Feld, Quittung falsch (P3) | **hält mit Rest** | Liste und Feld in Umschrift, Quittung „1 Name"; „Ł" ohne Vermerk (R10-W1). |
| R9-W4 Kein Rückweg zur Übersicht (P3) | **hält** | „Zur Übersicht →" nach „Bearbeiten". |
| R9-W5 Empfangsdialog ohne Sollstärke-Hinweis (P3) | **hält** | „nur Sollstärke: 9 Plätze ohne Namen, niemand hat gezählt". |
| R9-S1 Manuelle Aufnahme verliert Zettel-Angaben (Verweis) | **hält** | Zeit 09:41, Nr. 7, „2.ZUG" nach dem Neuladen; Unterschied zum eigenen Bogen siehe R10-W3. |
| R9-E1 Komma und Minus in Zahlenfeldern (Verweis) | **hält** | „151" mit Hinweis, „-20" abgelehnt, „80-" bleibt 80. |
| R9-D1 Schalter ohne Rückfrage (Verweis) | **hält** | „Sofortbedarf entfernen?" nennt „Diesel 80 l". |
| R9-E6/N3 Zug-Schreibweisen (Verweis) | **hält** | „1.zug" wird „1. Zug". |
| R9-K1 Sollstärke-Marke in Summe (Verweis) | **hält** | „Davon 1 Einheit nur Sollstärke, nicht gemeldet (9 Personen)". |
| R9-A4/A5 ASCII-Dateinamen (Verweis) | **hält** | Alle fünf Downloads ohne Umlaute und Leerzeichen. |
| R9-H5/S2 Tipp-Sperre 600 ms (Verweis) | nicht gesondert gemessen | Skripte hielten ≥ 0,9 s ein; ein zu frühes zweites „Weiter" im Skript (0,4 s) blieb ohne Wirkung, wie bekannt. |
| R9-K2/M1 Lagemonitor bei großer Schrift (Verweis) | **hält** | Kein Seitenüberlauf bei 200 %; Tabelle mit F / U / M im Bild bei 360 px (Bild `ad-telefon-n.png`). |
| R6-O9 Uhrstand in der Zukunft (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 9 vermerkt. |
| R7-G4 / M8 Ecken-Knopf hochkant (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 9 vermerkt. |
| R7-G8 / H9 Geräteuhr-Warnung bei 200 % und 320 × 568 (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 9 vermerkt. |
| R7-N1 kein Zusammenführen-Tipp (bekannte Grenze) | unverändert | Weder „Als neue Fassung anhängen" noch die Nr.-Rückfrage bietet einen Zusammenführen-Weg. |
| R7-N9 Ziffern der Schrittleiste (bekannte Grenze) | unverändert | Reiter tragen „1" bis „6". |
| R8-A1 Sollstärke zählt mit, mit Marke (bekannte Grenze) | unverändert | Zählt mit, Marke in Empfangsdialog, Rückfrage und Summe. |
| R8-M6 klebende Namensspalte (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 9 vermerkt. |
| R9-M3, R9-G5 (bekannte Grenzen) | nicht erneut geprüft | Stand laut README von Runde 9: teilweise. |
| R8-H5/S4 Prellschutz 450/800 ms (bekannte Grenze) | unverändert | Ein zu früher zweiter Tipp bleibt ohne Wirkung und ohne Rückmeldung. |

**Nebenwirkungen der Runde-9-Änderungen auf den Arbeitsablauf:**

- **Rückfragen mit festem Fuß:** Wirken jetzt in allen Lagen; die Sätze über den
  Wegen rollen im Querformat aus dem Bild (R10-W4).
- **Schalter-Rückfrage:** Ein zusätzlicher Dialog beim Ausschalten; Wortlaut klar,
  „Behalten" ist nach dem Wortlaut die sichere Wahl. Keine Nebenwirkung gefunden.
- **Rückfrage „Nur Sollplätze" bei der manuellen Aufnahme:** Eine zusätzliche
  Stufe vor „In Einsatz übernehmen"; danach „Nr. schon vergeben" als zweiter Dialog.
  Beide Dialoge klar; nach „Alles klar" muss die Wahl „Als Sollstärke ablegen" beim
  nächsten Übernehmen erneut getroffen werden (gemessen: der Dialog erscheint neu).
- **Neue Felder aus der Erprobung:** „Ort der Einheit (Pflicht)" und die Anzahl in
  der Sammlung arbeiten im Ablauf zusammen, die Übersicht trägt den Ort als
  „OV Musterstadt". Keine Nebenwirkung gefunden.

## Abschluss

Der Arbeitsablauf von der Einheit über den Meldekopf bis zum zweiten Gerät lässt
sich ohne fremde Hilfe durchlaufen. Die fünf Befunde aus Runde 9 zum Ablauf halten.
Offen bleiben vier kleine Stellen: ein still ersetztes Zeichen in der PDF
(R10-W1), ein Erklärtext der manuellen Aufnahme, der die Einheit statt des
Meldekopfs anspricht (R10-W2), ein unterschiedliches Verhalten beim Neuladen
(R10-W3) und Erklärsätze der Nachmeldungs-Rückfrage, die im Querformat außerhalb
des Bildes liegen (R10-W4).

Befunde: 0 × P0, 0 × P1, 0 × P2, 4 × P3.

- **Aufgabe geschafft:** ja. Einheit → Übergabe (Link, PDF) → Meldekopf →
  Nachmeldung (neuer und älterer Stand) → Zug, Abrücken, Lageblatt, CSV, Excel →
  Sammel-PDF auf ein zweites Gerät → manuelle Aufnahme vom Zettel ließen sich
  durchlaufen.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der Meldekopf liest in der manuellen Aufnahme den
  Text des eigenen Bogens und weiß nicht, ob „Einsatzbeginn eintragen" die
  Eintreffzeit aus Schritt 1 ersetzt (R10-W2).
- **Größtes Einsatzrisiko:** Ein Name erscheint in der PDF anders als im QR-Code,
  ohne dass es dasteht (R10-W1); der Schaden bleibt klein, weil die Rückfrage-Nummer
  mitgedruckt wird.
- **Top-Priorität für die nächste Iteration:** Den Schritt „2. Einsatz" der
  manuellen Aufnahme auf den Meldekopf zuschneiden (R10-W2).
