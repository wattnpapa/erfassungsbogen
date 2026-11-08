# Audit „Analog first“, Schwerpunkt Beispielbögen (Papier als Übungsunterlage)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-11-08 · Prüfgegenstand: Bereich „Beispielbögen“ der
Live-Seite https://erfassungsbogen.app/ (Stand `main`, Commit `0dd56d4`, frisch deployt; Fußzeile „v2026.1108.2056“):
Abschnitt „Beispielbögen“ auf der Startseite unter „So funktioniert’s“ mit dem Primärknopf „Beispielbögen ansehen“,
Dialog „Beispielbögen“ (Register, Pfadleiste, Tabelle, Knöpfe Anzeigen/PDF/Link), die daraus erzeugten PDFs und ihr
Verhältnis zum Blanko-Vordruck.

Zählung: **P0 0 · P1 0 · P2 2 · P3 6 · Hinweise 3** (8 Befunde BB-A1 bis BB-A8, alle neu in diesem Schwerpunkt).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und `docs/audits/runde-21/analog-first.md`
(Aufbau, Zählweise). Code nur zum Nachschlagen: `src/app/fusszeile.tsx` (`beispielPdf`, `blankoHerunterladen`, Dialog),
`src/app/app.tsx` (`BeispielboegenStart`, `oeffneBeispiel`), `src/app/pdf-dokument.ts` (Wasserzeichen, Störer, QR-Maße).
Je Sachverhalt ein Befund, mit Typ (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast). Geschmacksfragen stehen
als „Hinweis“ ohne Priorität im eigenen Abschnitt. Die Warnhinweise an den Beispieldaten („Zeitraum vorbei“ u. a.), die
in R21 als Artefakte ausgeklammert waren, sind hier gewertet (BB-A8), weil die Beispielbögen selbst der Prüfgegenstand
sind.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen), Locale de-DE, `deviceScaleFactor` 1, Viewports 390 × 844
(`isMobile`/`hasTouch`) und 1280 × 900. Keine Skripteinschleusung, kein DOM-Eingriff; je Szenario ein frischer Kontext.
Skripte, Bildschirmfotos, PDFs und Seitenbilder unter `/tmp/claude-0/audit-analog/bb/`.

- Startseite: Lage des Abschnitts „Beispielbögen“ (390: Überschrift y = 1 692, Knopf y = 1 823, 182 × 44 px;
  1280: y = 1 438 bzw. 1 529) und des Knopfs „Leeren Vordruck drucken (PDF)“ (390: y = 551).
- Dialog: Register der obersten Ebene (ASB 4, BBK 5, Bundeswehr 8, DLRG 7, DRK 16, Feuerwehr 12, Katastrophenschutz 290,
  Praktische Ausbildung 41, THW 3 634 Bögen), Unterordner, Pfadleiste, Tabelle; Knöpfe am Telefon 104/72/71 × 44 px.
- **PDF-Download** (`page.waitForEvent('download')`) von neun Beispielbögen: THW Albstadt ZTr TZ, THW Ansbach FGr Log-MW,
  THW Weinsberg FGr Öl (C), JUH Hannover 2. Einsatzzug (nur Stärke), JUH Malter Verpflegungsgruppe und Zugtrupp, JUH
  Akkonia Zugtrupp, Feuerwehr Ammerland Aufklärungstrupp Luft, DRK BHP 25 Kat. GELB; dazu Blanko-Vordruck von der
  Startseite und aus der Fußzeile.
- Gelesen mit `pdfinfo`, `pdftotext -layout`, `pdfimages -list`; Seiten mit `pdftoppm` (100 dpi Farbe, 300 dpi Graustufen)
  gerastert, Graustufen-Histogramm für das Wasserzeichen, QR-Codes mit `zxing-cpp` aus den Rasterbildern dekodiert
  (Version, Fehlerkorrektur, Kantenlänge).
- **Rückweg in die App:** Der dekodierte QR-Inhalt des Albstadt-PDFs in einem frischen Kontext geöffnet; 300-dpi-Bild der
  Albstadt-Seite und die beiden QR-Seiten von Weinsberg (150 dpi) über „Bögen einlesen…“ in eine Einsatz-Sammlung
  eingelesen; „Lage vom Papier abgleichen…“ geöffnet.
- **Sammeldruck:** drei Malter-Bögen über „Anzeigen → In Einsatz-Sammlung ablegen…“ in eine neue Sammlung gelegt (Tipps
  gezählt), Sammel-PDF („Einsatz weitergeben / sichern“) erzeugt; einmal mit Art „Einsatz“ (Vorgabe), einmal mit „Übung“.
- **Offline:** Erstbesuch bis „✓ Jetzt offline bereit“, Netz getrennt, neu geladen, Dialog geöffnet, PDF aus THW und aus
  „Praktische Ausbildung / JUH OV Akkonia“ erzeugt, Ordner „Alle Einheiten aller Ortsverbände“ geöffnet.

**Annahmen:** Ein Ausbilder bereitet eine Meldekopf- oder Stärkemeldungs-Übung vor und will dafür mehrere ausgefüllte
Bögen ausdrucken, die Teilnehmer ohne Gerät bearbeiten (Nr. vergeben, Eingang notieren, Änderungen von Hand eintragen);
danach sollen die Ausdrucke per QR oder Abgleich in eine Übungs-Sammlung zurück. Gedruckt wird überwiegend schwarzweiß auf
Bürolaser oder Kopierer. Den tatsächlichen Ablauf einer THW-Ausbildung kenne ich nicht; er ist hier nur als plausibles
Szenario angenommen.

**Nicht prüfbar:** echtes Drucken und Kopieren (Wasserzeichen und Kontrast sind am Rasterbild gemessen, nicht am Papier),
Scannen mit echter Telefonkamera und Handscanner (nur Dekodierung der Rasterbilder), Safari, native Builds,
Share-Sheet des Knopfs „Link“, Lesbarkeit unter Feldbedingungen.

## Urteil

Das Papier taugt. Jede geprüfte Beispiel-PDF ist A4 hoch (595 × 842 pt) und trägt das Wasserzeichen „ÜBUNG“ auf **jeder**
Seite (gemessen: 8 bis 10 % der Seitenfläche im Grauwert 241, auch auf reinen QR-Seiten). Seite 1 hat zusätzlich die rote
Störer-Zeile „ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz.“, die auch schwarzweiß dunkel genug ist. Die QR-Codes
sind groß: ein Einzelcode misst 67 mm (Version 17, 0,72 mm je Modul), Teilcodes 81 mm (Version 12, 1,11 mm je Modul). Alle
24 Codes ließen sich schon aus 100-dpi-Bildern lesen. Der Rückweg trägt: Ein eingescannter Beispielbogen kommt als Übung
an, „Bögen einlesen…“ liest Fotos ganzer Seiten, und „Lage vom Papier abgleichen…“ fragt Nr., Eingangszeit, Status, Zug
und Auftrag vom Blatt ab. Offline gehen Dialog und PDFs ebenfalls.

Reibung entsteht an zwei Stellen. Erstens gibt es keinen Sammeldruck: Für eine Übung mit mehreren Bögen bleibt nur
„einzeln herunterladen“ oder der Umweg über den eigenen Bogen. Der kostet rund acht Tipps je Bogen, fängt jedes Mal bei
„Alle“ an und fragt ab dem zweiten Bogen nach „alten Bogen endgültig löschen“ (BB-A1). Zweitens ist der Meldekopf-Kasten
der Beispiel-PDFs ein anderer als der des Blanko-Vordrucks und als das Abgleich-Formular (BB-A2). Ohne fremde Hilfe ist die
Aufgabe zu schaffen, aber mit Umwegen.

## Befunde

### BB-A1 [P2, Bedienung] Kein Sammeldruck: mehrere Beispielbögen für eine Übung nur einzeln oder über den eigenen Bogen, der dabei verdrängt wird

- **Fundstelle / Aufgabe:** Dialog „Beispielbögen“, Aufgabe „drei bis zehn Bögen einer Übung gesammelt ausdrucken“
  (1280 × 900, Ordner „Praktische Ausbildung / JUH RV Malter“, 5 Bögen).
- **Beobachtung (gemessen):** Die Tabelle hat je Zeile nur „Anzeigen“, „PDF“ und „Link“. Es gibt keine Mehrfachauswahl und
  keinen Knopf „alle Bögen dieses Ordners als PDF“, auch nicht in Ordnern, die eine Übung bilden (Malter 5, Akkonia 7,
  Johannesburg 6, Hannover 23 Bögen) oder in einem Ortsverband unter „Alle Einheiten aller Ortsverbände“. In der
  Einsatzansicht gibt es keinen Weg zu den Beispielbögen (der Dialog öffnet nur von der Startseite). Gesammelt geht es nur
  so: „Beispielbögen ansehen → Praktische Ausbildung → JUH RV Malter → Anzeigen → In Einsatz-Sammlung ablegen… → Sammlung
  wählen → ‹ Startseite“, für **drei Bögen 23 Tipps**. Der Pfad springt bei jedem Öffnen auf „Alle“ zurück. Jedes
  „Anzeigen“ ersetzt den eigenen Bogen. Ab dem zweiten Bogen lautet die Rückfrage: „Der Bogen … auf dem Platz ‚Zuletzt
  geschlossener Bogen‘ wird dabei endgültig gelöscht“, mit den Wahlknöpfen „… vorher als Datei sichern“ und „… alten Bogen
  endgültig löschen“. Eine neue Sammlung steht auf Art „Einsatz“, auch wenn die erste Meldung eine Übung ist. Die Sammel-PDF
  (7 Seiten, Übersicht A4 quer, Wasserzeichen auf allen Seiten) meldet dann „Lage: 0 Einheiten zählend“ und „zählt nicht in
  diese Lage“ je Einheit. Erst mit Art „Übung“ zählt „1 Einheit · 1 / 1 / 2 // 4“. Der zweite Weg (PDFs einzeln laden,
  danach über „Bögen einlesen…“ in eine Sammlung und dort die Sammel-PDF) ist im Dialog nicht beschrieben.
- **Erwartung der Rolle:** Ein Ordner, der eine Übung ist, lässt sich als ein Stapel drucken: ein Tipp, eine Datei, alle
  Bögen hintereinander. Dabei bleibt mein eigener Bogen unberührt.
- **Auswirkung im Einsatz:** Wer am Abend vor dem Ausbildungsdienst zehn Bögen braucht, lädt zehn Dateien und druckt zehn
  Mal, oder er geht den Umweg über den eigenen Bogen. Hat er auf dem Gerät einen echten eigenen Bogen offen, steht er bei
  der dritten Rückfrage vor „endgültig löschen“. Als Sammelmappe druckt er „0 Einheiten zählend“ aus, solange er die Art
  nicht von Hand auf „Übung“ umgestellt hat.
- **Empfehlung:** Je Ordner (und für eine Auswahl) „Alle als eine PDF“, also hintereinander die Bögen mit ihren QR-Seiten
  und gern mit einer Deckblatt-Liste. Alternativ „Diesen Ordner als Übungs-Sammlung anlegen“, ohne den eigenen Bogen zu
  berühren und mit Art „Übung“ voreingestellt. Mindestens im Dialog den Weg „PDFs laden → Bögen einlesen… → Sammel-PDF“
  nennen.
- **Verifikation:** Ordner „JUH RV Malter“: eine Datei mit fünf Bögen in höchstens drei Tipps; der eigene Bogen und
  „Zuletzt geschlossener Bogen“ sind danach unverändert; eine aus Beispielen angelegte Sammlung zählt die Übungsbögen.

### BB-A2 [P2, Text] Meldekopf-Kasten der Beispiel-PDFs passt weder zum Blanko-Vordruck noch zum Abgleich-Formular

- **Fundstelle / Aufgabe:** Kopfzeile Seite 1 aller Beispiel-PDFs, verglichen mit dem Blanko-Vordruck (Startseite und
  Fußzeile, 2 Seiten A4) und mit „Lage vom Papier abgleichen…“ in der Einsatzansicht.
- **Beobachtung (gemessen, `pdftotext`):** Die Beispiel-PDF hat „Meldekopf: Nr. ______ · eingegangen ____________ um
  ____:____ Uhr · übertragen [ ] von ______ um ____:____ Uhr“. Der Blanko-Vordruck hat „Meldekopf: Nr. ______ ·
  eingegangen **am** ____ um ____ Uhr · **Zug / Verband:** ________ / [ ] ÜBUNG (kein Einsatz) · **abgerückt am** ____ um
  ____ Uhr · ins Gerät übertragen [ ] von ______ um ____ Uhr / **Blatt ____ von ____**“. Das Abgleich-Formular fragt je
  Einheit „Nr. laut Blatt“, „Eingetroffen am“, „Status: anwesend / abgerückt“, „Zug“, „Auftrag / Notiz“ und verweist auf
  „Seite 1 bzw. Kasten ‚Stand am Meldekopf‘“. Diesen Kasten gibt es nur in der Sammel-PDF, nicht auf der Einzel-PDF eines
  Beispielbogens. Auf der Beispiel-PDF fehlen damit Platz für Zug, Abrücken und Auftrag. Folgeseiten tragen „Nr. ______ ·
  … · Blatt 2 von 4 dieses Bogens“.
- **Erwartung der Rolle:** Ein Meldekopf-Kasten, den ich einmal lerne, auf dem leeren wie auf dem ausgefüllten Bogen, und
  das Abgleich-Formular fragt genau die Kästchen dieses Kastens ab.
- **Auswirkung im Einsatz:** In der Übung schreiben die Teilnehmer Zug und Abrückzeit auf den Rand oder gar nicht. Beim
  Abgleich sucht der Meldekopf auf dem Blatt nach Feldern, die es dort nicht gibt. Geübt wird mit einem anderen Kasten als
  dem auf dem Blanko-Vordruck im Ernstfall.
- **Empfehlung:** Auf allen Bögen derselbe Meldekopf-Kasten wie auf dem Blanko-Vordruck (mit Zug/Verband, abgerückt,
  Datum). Das Abgleich-Formular benennt dieselben Felder in derselben Reihenfolge.
- **Verifikation:** `pdftotext` von Beispiel-PDF und Blanko: die erste Zeile ist bis auf das Kästchen „Übung“ gleich; jedes
  Feld des Abgleich-Formulars hat ein Gegenstück auf Seite 1 der Einzel-PDF.

### BB-A3 [P3, Kontrast] Wasserzeichen sehr blass; auf Folgeseiten der einzige Übungshinweis

- **Fundstelle / Aufgabe:** Alle Seiten der Beispiel-PDFs, besonders Folgeseiten (Personal, Qualifikationen) und reine
  QR-Seiten, z. B. Weinsberg Blatt 2 bis 4, Malter Blatt 2 bis 7.
- **Beobachtung (gemessen):** Das Wasserzeichen „ÜBUNG“ steht auf jeder Seite, als Kontur in #b02a1e mit 8 % Deckkraft. Im
  Graustufenbild hat es den Wert 241 von 255 (rund 5 % Deckung). Die Störer-Zeile (Graustufe ≈ 80, gut lesbar) steht nur auf
  Seite 1. Der Folgeblattkopf „Nr. ______ · THW Weinsberg Fachgruppe Ölschaden (C) · Blatt 3 von 4 dieses Bogens“ nennt
  keine Übung. Der QR-Inhalt trägt die Kennung: Der eingescannte Albstadt-Code öffnet mit „ÜBUNG — Dieser Bogen ist als
  Übung gekennzeichnet …“.
- **Erwartung der Rolle:** Jedes lose Blatt eines Übungsstapels ist auch nach Schwarzweiß-Kopie als Übung erkennbar.
- **Auswirkung im Einsatz:** Ein Kopierer oder sparsamer Laserdruck lässt 5 % Grau oft ganz weg. Lose Folgeseiten mit
  fiktiven Namen und Telefonnummern liegen dann ohne jede Kennzeichnung im Ausbildungsordner oder auf dem Meldekopftisch.
  Digital richtet das keinen Schaden an (der Code bleibt Übung), auf Papier stiftet es Verwirrung.
- **Empfehlung:** Die Textkennung „ÜBUNG“ auch in den Folgeblattkopf setzen; das Wasserzeichen etwas kräftiger oder als
  Umriss.
- **Verifikation:** Seite 2 einer Beispiel-PDF schwarzweiß kopieren (oder mit Schwelle 235 binarisieren): „ÜBUNG“ ist noch
  zu lesen.

### BB-A4 [P3, Text] Dateiname und PDF-Titel sagen nicht „Beispiel“ oder „Übung“

- **Fundstelle / Aufgabe:** Knopf „PDF“ im Dialog, gespeicherte Datei.
- **Beobachtung (gemessen):** Dateinamen „001-albstadt-ztr-tz.pdf“, „014-weinsberg-fgr-oel-c.pdf“, „01-zugtrupp.pdf“
  (zweimal vergeben, Malter und Akkonia), „05-verpflegungsgruppe.pdf“. PDF-Titel „Erfassungsbogen THW Albstadt Zugtrupp
  Technischer Zug, Stand 17.07.2026, 08:05“, ohne „Übung“. Die anderen PDF-Wege der App benennen nach dem Muster
  „<Erzeugung>_eeb_<Einheit>_Stand_…“ (`src/app/pdf.ts`).
- **Erwartung der Rolle:** Im Download-Ordner sehe ich am Namen, dass es ein Beispiel ist und zu welchem Satz es gehört.
- **Auswirkung im Einsatz:** Zwei Dateien „01-zugtrupp.pdf“ aus zwei Ordnern überschreiben sich oder heißen „(1)“. Beim
  Drucken für eine Übung fällt eine echte Bogen-PDF zwischen die Beispiele, ohne dass der Name warnt.
- **Empfehlung:** Dateiname mit Präfix „Beispiel“/„Uebung“ und Ordner, z. B. „Uebung_JUH-Malter_01-zugtrupp.pdf“; „ÜBUNG“ im
  PDF-Titel.
- **Verifikation:** PDF aus Malter und aus Akkonia laden: zwei verschiedene Namen, beide mit Übungskennung; `pdfinfo` zeigt
  „ÜBUNG“ im Titel.

### BB-A5 [P3, Layout/Abstand] Einseitige Beispielbögen haben keine Leerzeile für Nachträge von Hand

- **Fundstelle / Aufgabe:** Einseitige Beispiel-PDFs (Albstadt ZTr TZ, Hannover 2. Einsatzzug, Ammerland Aufklärungstrupp
  Luft), Übung „Einheit meldet am Meldekopf eine Änderung, Teilnehmer trägt sie von Hand nach“.
- **Beobachtung (gemessen, `pdftotext`, Seitenbild):** Die Personaltabelle endet mit der letzten Person (Albstadt: vier
  Zeilen, keine leere Zeile). Einen leeren Fahrzeugblock „Fahrzeug: / Kennzeichen: / Funkrufname:“ haben nur die
  mehrseitigen Bögen (Weinsberg, Ansbach, Malter, BHP 25), die einseitigen nicht. Das Kästchen „[ ] von Hand geändert“ und
  der Hinweis „abtippen oder neu erzeugen, nicht scannen“ stehen da, Platz für die Änderung aber nicht. Der Blanko-Vordruck
  hat 10 Personalzeilen auf Seite 1, weitere auf Seite 2 und vier Fahrzeugblöcke.
- **Erwartung der Rolle:** Wo „von Hand geändert“ ankreuzbar ist, gibt es mindestens eine leere Personal- und eine leere
  Fahrzeugzeile.
- **Auswirkung im Einsatz:** Nachträge landen am Rand oder auf einem Zettel daneben; beim Abtippen wird der Nachtrag
  übersehen.
- **Empfehlung:** Je Tabelle wenigstens eine leere Zeile, auch wenn der Bogen dann auf eine zweite Seite geht.
- **Verifikation:** Albstadt-PDF: unter der letzten Person und unter dem letzten Fahrzeug je eine leere Zeile.

### BB-A6 [P3, Bedienung] Nach „PDF“ keine Rückmeldung im Dialog

- **Fundstelle / Aufgabe:** Knopf „PDF“ in der Tabelle, 390 × 844 und 1280 × 900.
- **Beobachtung (gemessen):** Während der Erzeugung (0,9 bis 3,2 s) steht „wird vorbereitet …“ in der Zeile, und alle
  Knöpfe sind gesperrt. Danach ist der Dialog wieder wie vorher: keine Zeile „✓ PDF gespeichert …“, kein Dateiname. Am
  Telefon geht die Datei still in den Download-Ordner. Blanko-Vordruck aus der Einsatzansicht und Lageblatt quittieren dagegen
  („Blanko-Vordruck erzeugt (2 Seiten A4 …)“).
- **Erwartung der Rolle:** Ich sehe, dass die Datei da ist und wie sie heißt, bevor ich den nächsten Bogen hole.
- **Auswirkung im Einsatz:** Beim Sammeln für eine Übung (BB-A1) weiß man nach dem fünften Tipp nicht mehr, welche Bögen
  schon geladen sind; es entstehen doppelte Dateien oder Lücken.
- **Empfehlung:** Kurze Quittung in der Zeile („✓ gespeichert: …pdf“), wie bei „Kopiert“ unter „Link“.
- **Verifikation:** PDF tippen: in der Zeile steht für einige Sekunden der Dateiname.

### BB-A7 [P3, Text] Ordnernamen unter „Katastrophenschutz“ teils in Großbuchstaben ohne Umlaut

- **Fundstelle / Aufgabe:** Dialog → „Katastrophenschutz“.
- **Beobachtung (gemessen):** „BADENWUERTTEMBERG“, „BAYERN“, „BERLIN“, „HESSEN“, „MECKLENBURG VORPOMMERN“, „NORDRHEIN
  WESTFALEN“, „RHEINLAND PFALZ“, „SAARLAND“ neben „Brandenburg“, „Niedersachsen“, „Sachsen“, „Thüringen“. Unter „THW / Alle
  Einheiten aller Ortsverbände“ stehen die Namen richtig („Baden-Württemberg“).
- **Erwartung der Rolle:** Bundesländer heißen wie auf jedem Papier.
- **Auswirkung im Einsatz:** Gering; wer „Baden-Württemberg“ sucht, liest zweimal, und die Liste wirkt unfertig.
- **Empfehlung:** Anzeigenamen für alle Länderordner.
- **Verifikation:** Ordner „Katastrophenschutz“: alle Ländernamen in amtlicher Schreibweise.

### BB-A8 [P3, Text] Übungsunterlagen voller Warnhinweise wegen alter Beispieldaten

- **Fundstelle / Aufgabe:** Beispielbögen in einer Übungs-Sammlung und auf deren Sammel-PDF (Malter, Albstadt, Weinsberg).
- **Beobachtung (gemessen):** Die Beispiele tragen Zeiträume wie „17.02.2024“ (Praktische Ausbildung) oder „17.07.2026 –
  18.07.2026“ (THW). Die Sammel-PDF druckt je Einheit „Hinweise (4)“ bzw. „(5)“: „Einsatzzeitraum 17.02.2024 ist vorbei …“,
  „liegt mehr als ein Jahr entfernt — Tippfehler im Jahr?“, „Keine telefonische Erreichbarkeit erfasst …“. Auf den Karten
  stehen „⚠ Stand vor 995 Tagen“ und „⚠ Bogen nennt: ‚Hochwasserlage Albstadt …‘ — passt das zu dieser Lage? Zählt trotzdem
  mit.“, letzteres auch in einer Sammlung der Art „Einsatz“, in der dieselbe Karte als Übung **nicht** zählt („Nichts
  gezählt: alle 5 … sind Übung“). Die zwei Malter-Bögen, die über „Anzeigen → ablegen“ in die Sammlung kamen, heißen auf der
  Karte „am Meldekopf von Hand erfasst“.
- **Erwartung der Rolle:** Ein Übungsstapel enthält die Fehler, die der Ausbilder einbaut, nicht zufällige.
- **Auswirkung im Einsatz:** Die Teilnehmer üben, Warnungen zu übergehen; auf der ausgedruckten Übersicht verdrängen die
  Hinweise die Spalten, um die es geht. „Zählt trotzdem mit“ neben „zählt nicht“ ist auf Papier ein Widerspruch.
- **Empfehlung:** Beispielbögen beim Laden auf einen aktuellen Zeitraum heben oder Zeitwarnungen für Übungsbögen
  unterdrücken. „Zählt trotzdem mit“ nur, wenn die Karte wirklich zählt. Für abgelegte Beispiele eine eigene Herkunft
  („aus Beispielbogen“).
- **Verifikation:** Fünf Beispiele in eine Übungs-Sammlung, Sammel-PDF: keine Zeit- oder Jahreswarnung; keine Karte sagt
  zugleich „zählt nicht“ und „zählt trotzdem mit“.

## Hinweise (ohne Priorität)

- **H1, Startseite trennt Papier-Reserve und Beispiele:** Der Text des Abschnitts „Beispielbögen“ nennt „Ansehen und
  Ausprobieren“, nicht Übung oder Druck. Der Knopf „Leeren Vordruck drucken (PDF)“ steht 1 270 px darüber (390 × 844: y = 551
  gegen 1 823). Wer eine Übung vorbereitet, holt Blanko und Beispiele an zwei Stellen. Die Erklärung im Dialog („PDFs tragen
  das Wasserzeichen ‚ÜBUNG‘ …“) ist eingeklappt.
- **H2, Neun QR-Teile für neun Personen:** JUH Malter Verpflegungsgruppe hat 7 Seiten und 9 QR-Teile auf 5 Seiten, weil die
  „Begründung meiner Planung“ (rund 3 000 Zeichen) im Feld „Sonstiges“ steht. Als Übung zum Scannen ist das mühsam, als
  Lehrstück für „Bögen einlesen…“ mit Fotos ganzer Seiten taugt es. Kein Fehler des Layouts.
- **H3, Graue und farbige Flächen:** Titelbalken (dunkelblau, weiße Schrift) und farbige Fahrzeugsymbole kosten Toner,
  bleiben aber schwarzweiß lesbar; die Kopfzeilen der Tabellen sind hellgrau (#d9d9d9) wie in der Papiervorlage.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Übung vorbereiten (Unterlagen drucken) | ausgefüllte Bögen aus 4 000 Beispielen, offline erzeugbar, A4, Wasserzeichen | Blanko-Vordruck von Hand ausfüllen, kopieren | Mehrere Bögen nur einzeln oder über den eigenen Bogen (BB-A1) |
| Teilnehmer arbeiten am Meldekopf auf Papier | – | Meldekopf-Kasten (Nr., Eingang, übertragen), „von Hand geändert“ | Kasten anders als Blanko und Abgleich (BB-A2), kein Platz für Nachträge (BB-A5) |
| Ausdrucke zurück ins Gerät | QR (67/81 mm) per Kamera; „Bögen einlesen…“ mit Seitenfotos; Übungskennung bleibt | Abtippen per „Einheit manuell erfassen…“ | „Lage vom Papier abgleichen…“: Nr., Eingang, Status, Zug, Auftrag vom Blatt in einem Schritt |
| Übungsmappe ausgeben | Sammel-PDF mit Übersicht und Wasserzeichen | Stapel der Einzel-PDFs | Art „Übung“ muss von Hand gewählt werden, sonst „0 zählend“ (BB-A1); Warnhinweise (BB-A8) |

## Würde ich dafür das Papier weglegen?

Für die Übungsvorbereitung nein, für den Rückweg ja: Die Beispiel-PDFs sind ordentliche, deutlich gekennzeichnete
Papierunterlagen mit großen QR-Codes, und der Weg vom bekritzelten Blatt zurück in die Sammlung ist sauber. Einen
Übungsstapel bekomme ich aber nur Blatt für Blatt, und der Kasten, den meine Leute darauf ausfüllen, ist nicht der vom
Blanko-Vordruck.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (einzelne Bögen drucken und zurückscannen ja; Übungsstapel nur einzeln oder über den
  eigenen Bogen)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer eine Sammlung aus Beispielbögen anlegt, hält „Einsatz“ für richtig und druckt „0
  Einheiten zählend“.
- **Größtes Einsatzrisiko:** Beim Sammeln über „Anzeigen“ wird ein echter eigener Bogen auf „Zuletzt geschlossener Bogen“
  verdrängt und nach Rückfrage endgültig gelöscht (BB-A1).
- **Top-Priorität für die nächste Iteration:** „Ordner als eine PDF drucken“ im Beispielbögen-Dialog, ohne den eigenen Bogen
  zu berühren (BB-A1).
