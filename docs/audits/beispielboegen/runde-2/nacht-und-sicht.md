# Audit „Nacht und Sicht", Schwerpunkt Beispielbögen, Runde 2

Prüfer: Rollenaudit `thw-night-visibility-reviewer` · Datum: 2026-11-09 ·
Prüfgegenstand: Live-Seite `https://erfassungsbogen.app/` (Fassung `v2026.1109.833`, Code-Stand
Commit `085a93b` = `main`), nur der Bereich Beispielbögen: Abschnitt „Beispielbögen" der Startseite,
Dialog „Beispielbögen" (Aufklapper, Suche, Pfadleiste, Register, Tabelle bzw. Karten, Sammelweg,
Hinweis- und Fehlerzeilen, Quittung) und die Marken „BEISPIEL"/„ÜBUNG" auf Startseitenkarte und
Vorlage · Zählung: **P0 0 · P1 0 · P2 0 · P3 4 · Hinweise 2** (dazu vier Hinweise aus Runde 1, die
weiter offen sind)

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: der Bericht von Runde 1
(`../nacht-und-sicht.md`), `../README.md` mit „Stand der Behebung", `DESIGN.md` (Fokus- und
Modus-Regeln), `src/app/beispiele-dialog.tsx` und die Stile in `index.html` (Suche `beispiel-`,
`einheit-avatar`, `warnung-text`, `.hinweis`, `nacht-modus`, `dunkel-modus`, `feld-modus`). Zählregel
wie in Runde 1: ein Befund je Sachverhalt, ein Typ je Befund (Daten/Verlust, Bedienung,
Layout/Abstand, Text, Kontrast); P3 nur bei echter Beeinträchtigung der Aufgabe, der Rest steht unter
„Hinweise" ohne Priorität.

## Prüfaufbau

Chromium über das globale Playwright-Modul, `chromium.launch()` ohne Optionen, Locale de-DE,
`deviceScaleFactor` 1. Viewports 390 x 844 (`isMobile`, `hasTouch`, Kartenansicht) und 1280 x 900
(Maus, Tabellenansicht, `hover: hover`), für die Pfadleiste zusätzlich 360 x 844, dazu 390 x 844 mit
`colorScheme: 'dark'` ohne gespeicherte Wahl. Die vier Ansichten wurden über die Bedienung
umgeschaltet (Umschalter „Anzeigemodus" in der Fußzeile, Knopf „Dunkel"/„Feld"/„Nacht" angetippt),
danach die Klasse auf `<html>` ausgelesen. Kein `addScriptTag`, keine DOM-Änderung; Messfunktionen nur
lesend per `page.evaluate`.

Gemessen (WCAG-Formel, Vorder- gegen die zusammengesetzte Hintergrundfläche aus `getComputedStyle`,
Pseudo-Elemente `::after`/`::before`/`::placeholder` eingeschlossen): Aufklapper (zu, offen, Fokus),
Suchfeld (Beschriftung, Eingabe, Platzhalter, Rahmen, Fokusring), Register, Pfadleiste (Hintergrund,
Unterkante, „Alle", „…", Trenner, aktueller Ordner), Pfadleiste beim Rollen (Element unter der
Unterkante), Hinweiszeilen, „Noch ohne Beispielbögen", Sammelknopf „Alle … in eine Übungs-Sammlung"
(ruhend, Hover, Fokus, gesperrt während „PDF"), Quittung nach „PDF" (Farbe und Lage im Bild),
Ladefehler mit „Erneut laden", Marken „BEISPIEL"/„ÜBUNG", Fokus per Tab, Hover (1280 px). Taktische
Zeichen: Klasse, `filter`, Unterlage, dazu ein Bildschirmfoto jedes Zeichens (DRK, BBK) auf Pixel
ausgewertet (hellster Wert, Pixel über Luma 206, Kontrast des dunkelsten Pixels im Größenzeichen
gegen die Unterlage). Helligkeit des ganzen Bilds mit offenem Ordner per Canvas (Mittel, Höchstwert,
Pixel über Luma 206). Ein PDF-Knopf wurde in Zeile 1 und Zeile 5 ausgelöst (Download kam an).

Zwei Zustände ließen sich nur über das Netz herstellen, ohne das DOM anzufassen: das Bündel der
Ortsverbände (`beispiele-thw-ov-*.js`) per `page.route` um 6 bzw. 8 s verzögert (für den Platzhalter
„wird geladen …"), und die Bogendaten (`/assets/*.json`) per `route.abort` abgebrochen (für den
Ladefehler).

Skripte und Bildschirmfotos: `/tmp/claude-0/r2-nacht/` (u. a. `messen.js`, `marken.js`, `laden.js`,
`pfad.js`, `rest.js`, `zoom-nacht.png`, `390-nacht-drk.png`, `1280-nacht-bbk.png`,
`390-nacht-klebend.png`, `zoom-pfade.png`, `390-nacht-ladefehler.png`,
`390-nacht-thw-waehrend-laden.png`, `390-nacht-thw-nach-laden.png`, `zoom-fokus.png`,
`zoom-marken.png`).

**Annahmen:** wie in Runde 1. Die Beispielbögen dienen dem Üben und Zeigen (Dienstabend, Fahrzeug,
Zelt), nicht dem laufenden Einsatz; Maßstab ist der Anspruch der App selbst („Nacht: gedimmt, blendet
nicht"; DESIGN.md: „Tastaturfokus überall gleich"). Ein verzögertes OV-Bündel von 6 bis 8 s ist ein
plausibler Fall bei schwachem Netz: Das Bündel ist 738 kB groß (85 kB komprimiert) und wird beim
ersten Öffnen des Dialogs geholt.

**Nicht prüfbar:** echtes Licht (Sonne, Scheinwerfer, Rotlicht), Displayhelligkeit und Panel-Gamma,
Dunkeladaption am echten Auge, Rot-Grün-Schwäche (nur rechnerisch: Farbe gegen Schriftstärke und
Zeichen), die iOS- und Android-App, der Inhalt der erzeugten PDF, ein echter Netzabriss
(nachgestellt nur über abgebrochene Anfragen).

## Urteil aus Sicht der Rolle

Der Hauptbefund aus Runde 1 ist behoben: Die taktischen Zeichen in der Tabelle liegen in Dunkel und
Nacht auf der hellen, gedämpften Unterlage. Nachts ist kein Pixel des Zeichens heller als Luma 166,
das ganze Bild mit offenem Ordner erreicht höchstens 206 (= Schrift), und das schwarze Größenzeichen
steht mit 8 : 1 auf seiner Unterlage. Ländernamen sind ausgeschrieben, „Alle" ist 44 px breit, die
THW-Zahl springt nicht mehr. Das neue Suchfeld trägt in allen Modi (Platzhalter mindestens 4,69 : 1,
Rahmen 3,37 : 1 und mehr, Fokusring in Kennfarbe). Kein gemessener Text im Dialog liegt unter 4,5 : 1 (kleinster Wert 4,69 : 1, Platzhalter in Standard).

Reibung entsteht bei den neuen Rückmeldungen und der klebenden Pfadleiste: Die Fehlerzeile mit
„Erneut laden" sieht genauso aus wie eine Erklärung (BB2-L1), die grüne Quittung nach „PDF" steht am
Telefon außerhalb des Bilds, sobald man in der Liste gerollt hat (BB2-L2), die angeheftete Pfadleiste
hat keine sichtbare Unterkante und belegt in tiefen Ordnern bis zu einem Viertel des Bildschirms
(BB2-L3), und der angekündigte Platzhalter „wird geladen …" erscheint nie, sodass die THW-Liste beim
Nachladen um 142 px springt (BB2-L4). Die Aufgabe „Beispiel finden und öffnen" gelingt in allen vier
Ansichten ohne fremde Hilfe.

## Nachprüfung Runde 1

| Alte ID | Stand | Gemessen (Runde 2) |
| --- | --- | --- |
| BB-L1 Zeichen ohne Unterlage und Dämpfung | **behoben** | Zeichen trägt `einheit-avatar`. Nacht: `brightness(0.6) sepia(0.4)` auf `#fff`, 2 px Polster, Unterlage `#aea595`; je Zeichen höchstens Luma 166, kein Pixel über 206; dunkelstes Pixel des Größenzeichens gegen die Unterlage 7,97 : 1 (DRK) bzw. 8,62 : 1 (BBK „Behandlungsbereitschaft"); ganzes Bild DRK offen: Höchstwert 206, 0 Pixel über 206 (390 und 1280 px). Dunkel: `brightness(0.85)`, Zeichen höchstens Luma 217, Schrift 233. Standard und Feld unverändert ohne Filter. `colorScheme: 'dark'` startet in `dunkel-modus`, Zeichen ebenfalls gedämpft. Prüfkriterium (Größenzeichen mindestens 3 : 1, nachts nichts über 206) erfüllt. |
| BB-L2 Ordnernamen in Versalien | **teilweise** | Unter „Katastrophenschutz" zwölf Länder richtig geschrieben („Baden-Württemberg", „Mecklenburg-Vorpommern", „Nordrhein-Westfalen" …). Der zweite Teil des Prüfkriteriums ist nicht erfüllt: Bei 390 px beginnt die letzte Zeile der Pfadleiste weiter mit dem Trenner, „› Baden-Württemberg" (Katastrophenschutz), „› Alle Einheiten aller Ortsverbände …" (THW), in tiefen OV-Ordnern zwei solche Zeilen (`zoom-pfade.png`). Siehe BB2-L3. |
| H1 Trennlinien unter 3 : 1 | offen | unverändert: Registerlinie Nacht 1,67 : 1, Dunkel 1,70, Standard 1,77, Feld 18,58. Neu kommt die Unterkante der Pfadleiste hinzu (BB2-L3). |
| H2 Register-Pfeil bei Hover | offen | unverändert: „›" auf der Hover-Fläche Nacht 4,29 : 1, Standard 3,93 : 1 (ruhend 4,75 bzw. 4,69). Als Richtungszeichen ausreichend. |
| H3 Aufklapper ohne Aufklappzeichen | offen | `summary` weiter `display: flex`, kein `::before`/`::after`, kein Dreieck; offen oder zu sieht man nur am Text darunter. Bei 390 px weiter „Anzei-gen". Dazu der abweichende Fokusring (neuer Hinweis H1). |
| H4 Ansicht bei offenem Dialog nicht umschaltbar | offen | Der Kopfknopf „Ansicht: …" liegt unter dem modalen Dialog (`elementFromPoint` trifft den Dialog), in Standard und Nacht geprüft. Weiter ein Schritt mehr: Dialog schließen, umschalten, wieder öffnen (öffnet jetzt im zuletzt offenen Ordner). |
| H5 Bogenzahl „THW" springt | behoben | Während das OV-Bündel lädt, zeigt das Register „THW … Bögen", danach „3.634 Bögen"; keine zweite Zahl mehr. |
| H6 „Alle" in der Pfadleiste schmal | behoben | „Alle" 44 x 44 px (Feld 44 x 54 px). |

## Positiv geprüft (im echten Browser)

| Prüfpunkt | Ergebnis |
| --- | --- |
| Startseite, Abschnitt „Beispielbögen" | unverändert: Überschrift Nacht 12,45 : 1, Hinweis 6,77, Primärknopf Schrift 5,00 / Fläche 5,05; Standard 16,88 / 5,42 / 14,21; Dunkel 15,68 / 8,86 / 9,22; Feld 17,45 / 11,78 / 14,21 |
| Suchfeld „Suchen" | Beschriftung Nacht 6,31 : 1 (Dunkel 8,17, Standard 5,92, Feld 14,18); Eingabe 11,61 (14,46 / 18,43 / 21); Platzhalter „Ort, OV oder Einheit, z. B. Oldenburg" Nacht 4,75, Dunkel 5,22, Standard 4,69, Feld 14,18 — überall über 4,5 : 1; Feldrahmen 3,41 / 3,45 / 3,37 / 18,58 (Feld 2 px); Höhe 44 px (Feld 54 px); Schrift 16 px, also kein Zoom beim Antippen. Fokus per Tab: 3 px Kennfarbe, Nacht 4,71 : 1, Dunkel 9,31, Standard 14,21, Feld 4 px 14,21. Suche „Oldenburg" zeigt „2 Ordner, 57 Bögen" in Schriftfarbe. |
| Pfadleiste | „‹ Zurück" Nacht 11,61, „Alle" 6,69 (unterstrichen), aktueller Ordner 11,61 fett, Trenner 4,75; „…" (aria-hidden, kein Ziel) 11,61 : 1 in normaler Stärke, nicht unterstrichen — vom Link „Alle" klar zu unterscheiden |
| Hinweis- und Erklärzeilen | jede sichtbare `.hinweis` im Dialog Nacht 6,31 : 1, Dunkel 8,17, Standard 5,92, Feld 14,18 (13 bis 14 px, Feld 15,7 bis 16,8 px); darunter „Noch ohne Beispielbögen: Bremen, Hamburg, Sachsen-Anhalt, Schleswig-Holstein.", die OV-Offline-Zeile, „Angaben werden geladen … n von 101", „wird vorbereitet …" |
| Sammelknopf „Alle … in eine Übungs-Sammlung" | Schrift Nacht 11,61, Rahmen 3,41 (Dunkel 14,46 / 3,45, Standard 18,43 / 3,37, Feld 21 / 18,58), 44 px hoch (Feld 54); Hover (1280 px) Text und Rahmen in Kennfarbe Nacht 4,71, Dunkel 9,31; Fokus 3 px Kennfarbe. Gesperrt während „PDF": gestrichelter Rahmen und Fläche `--flaeche-2`, Schrift 5,69 : 1 (Nacht), keine Deckkraft-Absenkung — gesperrt ist an der Form erkennbar, nicht nur an der Farbe |
| Fokus per Tab im Ordner | Register, Sammelknopf, „Anzeigen", „PDF", „Link", „Erneut laden": 3 px Kennfarbe (Feld 4 px), Nacht 4,71 : 1. Nach dem Ordnerwechsel liegt der Fokus auf dem Ordnernamen (programmatisch, ohne Ring) |
| Quittung nach „PDF" (Farbe) | `--gut`, fett 600, 13 px: Nacht #8fae63 7,30 : 1, Dunkel #6cd18a 9,22, Standard und Feld #146b3a 6,57; Dateiname `uebung-beispiel-drk-bhp25-behandlung-gelb.pdf` |
| Marken „BEISPIEL" (Startseitenkarte) und „ÜBUNG" (gespeicherte Vorlage) | Text Nacht #d9b96a 8,15 : 1, Dunkel 10,27, Standard und Feld 7,51; 13 px (Feld 15,7 px) fett, Versalien; Rahmen Nacht 2,42, Dunkel 2,59, Standard 1,79, Feld 4,02. Die Kennzeichnung trägt über das Wort, nicht über die Farbe; auf der Karte liegt das Zeichen (`einheit-avatar gross`) nachts gedämpft |
| Meldung nach „Anzeigen" („Beispielbogen geöffnet — fiktive Daten …") | Text Nacht 11,61 : 1, 4-px-Oberkante in Schriftfarbe (nicht heller als die Schrift) |
| Helligkeit Nacht | DRK offen: Luma-Mittel 28,5 (390 px) bzw. 23,5 (1280 px), Höchstwert 206, kein Pixel darüber; Dunkel Höchstwert 234 (= Schrift) |
| Schriftgröße | kein gemessener Text unter 13 px (Feld 15,7 px); Marken 13 px |

## Befunde

### BB2-L1 (P3, Kontrast) Ladefehler mit „Erneut laden" sieht aus wie eine Erklärung — die Warnfarbe greift nicht

- **Ort:** Dialog → Ordner, dessen Bögen nicht geladen werden konnten (nachgestellt: ASB mit abgebrochenen Anfragen `/assets/*.json`), Zeile über der Liste, alle Modi. Code: `beispiele-dialog.tsx` Zeile 867 (`<p className="hinweis warnung-text beispiel-ladefehler">`); in `index.html` steht `.warnung-text { color: var(--warn-text) }` (Zeile 1917) vor `.hinweis { color: var(--text-2) }` (Zeile 1929), gleiche Spezifität, die spätere Regel gewinnt.
- **Beobachtung (gemessen):** Die Zeile „Einige Beispielbögen liegen noch nicht auf dem Gerät — sie werden mit Netz nachgeladen (siehe Offline-Zeile der Startseite). Erneut laden" hat die Farbe der gewöhnlichen Hinweise: Nacht #a2977e (6,31 : 1) statt `--warn-text` #d9b96a, Dunkel #aab2c2 statt #f0cf88, Standard #5c6478 statt #6d4700. Unterschied zur Erklärzeile des Sammelknopfs zwei Zeilen darunter: nur Schriftstärke 600 statt 400; kein Zeichen, kein Rahmen, keine Fläche (`::before` leer). „Erneut laden" ist ein unterstrichener Link in Kennfarbe (Nacht 6,69 : 1, 47 px hoch, 76 px breit). Darunter stehen die Karten mit „nicht geladen" und „—" (`390-nacht-ladefehler.png`).
- **Erwartung der Rolle:** Was nicht geklappt hat, hebt sich von Erklärtexten ab — in derselben Warn-Handschrift wie anderswo in der App, und nicht nur über die Farbe.
- **Folge:** Nachts und bei gedimmtem Display liest sich die Zeile als eine weitere Erklärung im Grau des Dialogs; man sieht leere Karten und weiß nicht, dass es einen Knopf „Erneut laden" gibt und dass die App selbst einen Fehler meldet. Die Aufgabe bleibt lösbar (Text und Link sind lesbar), kostet aber einen Fehlversuch, wenn man auf „Anzeigen" einer leeren Karte tippt.
- **Empfehlung:** Die Fehlerzeile sichtbar als Warnung kennzeichnen, wie die übrigen Warnungen der App (Warnfarbe und ein Merkmal, das ohne Farbe trägt, etwa Zeichen oder Rahmen).
- **Neu oder alt (Verweis):** neu (die Zeile selbst kam mit Sachverhalt 19 der Runde 1).
- **Nachprüfung:** Bogendaten abbrechen, ASB öffnen: Zeilenfarbe = `--warn-text` des Modus (Nacht #d9b96a), dazu ein nicht-farbliches Merkmal; in Graustufen von der Erklärzeile des Sammelknopfs unterscheidbar.

### BB2-L2 (P3, Bedienung) Quittung nach „PDF" am Telefon außer Sicht und bleibt im nächsten Ordner stehen

- **Ort:** Dialog → Ordner mit Bögen → „PDF" einer Karte, 390 x 844, alle Modi. Code: `beispiele-dialog.tsx` Zeile 873 (Quittung als `<p role="status">` über Bogenzahl und Liste).
- **Beobachtung (gemessen):** Die Quittung „PDF „uebung-beispiel-drk-…pdf" erzeugt — liegt im Download-Ordner." erscheint über der Liste. Bei „PDF" in Zeile 1 (DRK, Knopf auf 750 px) steht sie sichtbar auf 377 px. Bei „PDF" in Zeile 5 (Knopf auf 400 px) steht sie auf −973 px, also gut einen Bildschirm über dem sichtbaren Bereich, und darüber liegt die angeheftete Pfadleiste; im Bild ändert sich nur, dass „wird vorbereitet …" verschwindet und die Knöpfe wieder durchgezogene Rahmen haben. Nach „Alle" → „Katastrophenschutz" steht dieselbe Quittung weiter im neuen Ordner (über „Noch ohne Beispielbögen: …"). Bei 1280 px steht sie bei kurzen Ordnern im Bild (152 bis 169 px). Unterschied zum Hinweistext: Grün `--gut` und Schriftstärke 600, kein Haken oder Zeichen.
- **Erwartung der Rolle:** Nach dem Tippen auf „PDF" an der Stelle, wo man hinsieht, eine Bestätigung, dass die Datei da ist — und im nächsten Ordner keine Meldung zu einem Bogen von vorher.
- **Folge:** Wer nachts ein Beispiel weiter unten als PDF holt (Übungsvorbereitung, Ausdruck für Teilnehmer), sieht keine Rückmeldung und tippt erneut — es entsteht eine zweite gleichnamige Datei. Die stehengebliebene Quittung im neuen Ordner nennt einen Bogen, der dort nicht liegt. Bei Rot-Grün-Schwäche unterscheidet sich die Quittung von den grauen Hinweisen nur über die Schriftstärke.
- **Empfehlung:** Die Bestätigung dort zeigen, wo getippt wurde (an der Karte oder in einer Leiste, die im Bild bleibt), mit einem Merkmal ohne Farbe, und beim Ordnerwechsel entfernen.
- **Neu oder alt (Verweis):** neu in der Ausführung; die Quittung selbst ist die Behebung von BB-H9/BB-A6 (Sachverhalt 20).
- **Nachprüfung:** 390 x 844, DRK, „PDF" in Zeile 5: Bestätigung innerhalb des sichtbaren Bereichs unterhalb der Pfadleiste; nach Wechsel nach „Katastrophenschutz" keine Quittung mehr; in Graustufen von einem Hinweis unterscheidbar.

### BB2-L3 (P3, Layout/Abstand) Angeheftete Pfadleiste ohne sichtbare Unterkante, in tiefen Ordnern bis 236 px hoch

- **Ort:** Dialog → beliebiger Ordner, beim Rollen durch die Liste; 390 x 844 und 360 x 844, alle Modi. Code: `index.html` `.beispiel-pfad` (`position: sticky`, `background: var(--flaeche)`, `box-shadow: 0 1px 0 var(--linie-fein)`).
- **Beobachtung (gemessen):** Die Pfadleiste klebt unter der Kopfzeile (Unterkante Kopfzeile 85 px, Feld 91 px). Ihr Grund ist gleich dem Dialoggrund (Kontrast zum Inhalt darunter 1,00 : 1), ihre Unterkante ist ein 1-px-Schatten in `--linie-fein`: Nacht #2b271d 1,23 : 1, Dunkel #272c36 1,24, Standard #d7dce7 1,37 (Feld #111318 18,58). Beim Rollen werden Textzeilen an dieser unsichtbaren Kante mitten im Buchstaben abgeschnitten („ist." halb unter der Leiste, `390-nacht-klebend.png`). Höhe der Leiste bei 390 px: DRK 52 px, „Katastrophenschutz › Baden-Württemberg" 122 px, THW › „Alle Einheiten aller Ortsverbände" 143 px, eine Ebene tiefer 174 px (Feld 146, 196 und 236 px). „‹ Zurück" steht allein in der ersten Zeile, die letzte Zeile beginnt mit „›" (bei tiefen OV-Ordnern zwei Zeilen). Mit der Kopfzeile sind damit dauerhaft 259 px (31 %, Nacht) bzw. 327 px (39 %, Feld) der 844 px belegt. Bei 1280 px einzeilig, 52 px.
- **Erwartung der Rolle:** Eine angeheftete Leiste, deren Ende man sieht, und die wenig Platz nimmt, damit man in der Liste sieht, was kommt.
- **Folge:** Nachts und bei schwacher Displayhelligkeit verschwimmt die Grenze zwischen Leiste und Liste: angeschnittene Zeilen wirken wie ein Darstellungsfehler, und welche Karte gerade unter der Leiste beginnt, ist nicht zu erkennen. In tiefen Ordnern bleibt am Telefon gut die Hälfte des Bildschirms für die Karten (eine Karte ist rund 230 px hoch), man rollt öfter und verliert die Stelle leichter. Der Trenner „›" am Zeilenanfang liest sich wie eine weitere Ebene.
- **Empfehlung:** Die angeheftete Leiste sichtbar gegen die Liste abgrenzen (Linie mindestens 3 : 1 wie im Feld-Modus) und in tiefen Ordnern am Telefon auf eine Zeile beschränken, mit dem Trenner nie am Zeilenanfang.
- **Neu oder alt (Verweis):** neu durch das Anheften (Sachverhalt 8 der Runde 1); die Zeile mit „›" am Anfang ist der offene Teil von BB-L2.
- **Nachprüfung:** 390 x 844 Nacht, THW › Ortsverbände › Baden-Württemberg, 400 px gerollt: Unterkante der Leiste mindestens 3 : 1 zum Dialoggrund; Leiste höchstens rund 100 px hoch; keine Zeile, die mit „›" beginnt.

### BB2-L4 (P3, Layout/Abstand) Platzhalter „wird geladen …" erscheint nie — die THW-Liste springt beim Nachladen um 142 px

- **Ort:** Dialog → „THW", solange das Bündel der Ortsverbände lädt; 390 x 844, alle Modi. Code: `beispiele-dialog.tsx` Zeilen 824 und 843: der Platzhalter steht innerhalb von `beispielOrdner.length > 0 && (<ul …>)`; THW hat vor dem Laden keinen Unterordner, also wird die Liste mit dem Platzhalter gar nicht ausgegeben.
- **Beobachtung (gemessen):** OV-Bündel um 6 bzw. 8 s verzögert. Im Register steht „THW … Bögen" (wie vorgesehen). Nach dem Antippen von „THW": kein Register, kein Eintrag „Alle Einheiten aller Ortsverbände … wird geladen …", sondern sofort „101 Bögen — Angaben werden geladen … 7 von 101" und die Karten (erste Karte bei 506 px). Wenn das Bündel ankommt, erscheint darüber der Ordner „Alle Einheiten aller Ortsverbände (nach Landesverband, Regionalstelle, OV) 3.533 Bögen", die Zeile wird zu „101 Bögen direkt in „THW", außerhalb der Ordner oben", und die erste Karte rutscht auf 648 px, also um 142 px (`390-nacht-thw-waehrend-laden.png`, `390-nacht-thw-nach-laden.png`). In allen vier Modi gleich. Den deaktivierten Platzhalter konnte ich deshalb nicht auf Kontrast prüfen.
- **Erwartung der Rolle:** Die angekündigte Platzhalterzeile, damit die Liste dort bleibt, wo man hinsieht, und man weiß, dass noch ein Ordner kommt.
- **Folge:** Wer in den ersten Sekunden eine THW-Karte antippen will, trifft nach dem Sprung eine andere Karte oder einen anderen Knopf (Fehltipp „Link" statt „Anzeigen" einer Nachbarkarte, wie BB-G2). Ohne Platzhalter sieht THW zunächst aus, als gäbe es nur 101 Bögen; die 3.533 OV-Bögen tauchen unangekündigt oben auf.
- **Empfehlung:** Den Platzhalter auch dann zeigen, wenn THW noch keinen anderen Unterordner hat, in der Höhe der späteren Ordnerzeile.
- **Neu oder alt (Verweis):** alt in der Sache (Sachverhalt 11, BB-G2, BB-S5, BB-H10), die Behebung „unter THW einen Platzhalter-Eintrag" wirkt auf der Live-Seite nicht.
- **Nachprüfung:** OV-Bündel um 6 s verzögern, „THW" antippen: deaktivierte Zeile „Alle Einheiten aller Ortsverbände … wird geladen …" sichtbar (Kontrast mindestens 4,5 : 1, gesperrt nicht nur über Deckkraft); nach dem Laden bewegt sich die erste Karte um höchstens wenige Pixel.

## Hinweise (ohne Priorität)

- **H1 Fokusring am Aufklapper ist der Browser-Ring.** „Was sind Beispielbögen? …" (`summary`) bekommt per Tab `outline: auto` statt des App-Rings (die Regel `button:focus-visible, a:focus-visible` in `index.html` Zeile 619 erfasst `summary` nicht). Nachts ist dieser Ring weiß-grau: 2 108 Pixel heller als Luma 206, Höchstwert 238, also heller als jede Schrift im Dialog; in Standard ein schwarz-weißer Doppelring (`zoom-fokus.png`). Alle anderen Ziele im Dialog haben 3 px Kennfarbe (DESIGN.md: „Tastaturfokus überall gleich"). Betrifft nur die Bedienung mit Tastatur.
- **H2 Größenzeichen sehr klein.** Das Zeichen ist in der Tabelle 30 px hoch (Feld 34 px). Die Punkte und Striche der Größe sind darin 2 bis 3 px groß, in allen vier Modi. Seit BB-L1 sind sie auch nachts sichtbar (8 : 1), bei kleinster Displayhelligkeit, mit Armlänge Abstand oder bei Sehschwäche sind Trupp, Gruppe und Zug am Zeichen allein aber kaum auseinanderzuhalten; der Name sagt es. Nicht messbar ohne echtes Gerät.

## Schluss

- **Aufgabe geschafft:** ja (Beispiel suchen und finden, Ordner wechseln, Anzeigen, PDF, Sammelweg in allen vier Ansichten)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Ein Ladefehler liest sich nachts wie eine Erklärung, weil die Warnfarbe von der Hinweisfarbe überschrieben wird; „Erneut laden" wird leicht übersehen (BB2-L1).
- **Größtes Einsatzrisiko:** gering — der Bereich dient dem Üben; am ehesten führen die fehlende Rückmeldung nach „PDF" (BB2-L2) und der Sprung der THW-Liste (BB2-L4) zu doppelten Dateien oder einem Fehltipp. Wie das bei echtem Licht und kleinster Helligkeit wirkt, war nicht prüfbar.
- **Top-Priorität für die nächste Iteration:** BB2-L4 (Platzhalter tatsächlich zeigen, damit die THW-Liste nicht springt), danach BB2-L1 (Fehlerzeile als Warnung kennzeichnen).
