# Audit „Handschuh-Bedienung“, Runde 17 (Touch-Ziele, Abstände, Doppeltipp, Querformat)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand `be6b396`, `main`)

**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 14 (R17-G1 bis R17-G14)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`, die Abschnitte
„Stand der Behebung“ in `runde-16/README.md` bis `runde-11/README.md` und `runde-16/handschuh-bedienung.md`.
Ab dieser Runde gibt es keine „bekannten Grenzen“ mehr, die ausgelassen werden: Was im Browser noch zu
beobachten ist, steht hier, auch wenn es früher als „teilweise“, „offen“ oder „bekannte Grenze“ geführt
wurde (Feld „Neu oder alt (Verweis)“). Behebungen, die im Browser nicht mehr zu beobachten sind, stehen
nicht als Befund, sondern nur in der Nachprüfungstabelle.

## Prüfaufbau

Chromium über das Playwright-Modul (`chromium.launch()` ohne Optionen, nichts installiert), `isMobile`,
`hasTouch`, Pixeldichte 2, de-DE. Viewports 390 x 844 und 360 x 640, dazu 320 x 568, 375 x 667, 385 x 800,
412 x 915 sowie quer 640 x 360, 568 x 320, 844 x 390. Tipps über `tap()` und `touchscreen.tap()` an festen
Koordinaten. Zustand: frisch angelegte Einsatz-Sammlung „Hochwasser Test“ mit elf THW-Übungsbögen
(`examples/thw`, `uebung` false, `stand` auf „vor fünf Minuten“, über „Bögen einlesen…“), eigener Bogen im
Assistenten, Schnellerfassung und manuelle Aufnahme. Die Maße stammen aus `getBoundingClientRect()` aller
Knöpfe, Verweise, Felder und Reiter; Lücken sind der kleinste Randabstand zwischen Nachbarn mit
verschiedenem Ziel. Nicht prüfbar: echte Handschuhe, echte Bildschirmtastatur, Kamera-Scan, native Datums-
und Zeitwähler, ein zweites Gerät.

Kennzeichnung: **gemessen** = Zahl oder Ablauf aus dem Browser.

## Urteil

Die Bedienung mit Handschuh trägt weiter. Alle Hauptknöpfe (Karten, Dialoge, Quittung, Assistent,
Schnellerfassung, Scanner) messen mindestens 44 px, Paare liegen meist 8 bis 20 px auseinander, nichts läuft
seitlich über (320, 360, 390 px geprüft). Die Behebungen aus Runde 16 halten bis auf zwei Reste (R17-G2,
R17-G14). Es bleiben 14 kleine P3-Punkte: zusammenstoßende Ziele (Verweise dicht über Knöpfen, lückenlose
Reihen), Fußleiste und Quittung im Hoch- und Querformat, ein Doppeltipp-Schutz, der absichtliches Weiterblättern
schluckt, und eine unlesbar wiederholte Fehlermeldung. Die Aufgabe (Bogen erfassen, Bögen einlesen, Karte
bedienen, Stärke ändern, Abrücken, Entfernen) ist ohne fremde Hilfe zu schaffen.

## Befunde

### R17-G1 [P3] Karte: Verweis „Hinweise: …“ liegt nur 3,6 px über „Details“, „Bogen als PDF“ und „Abrücken“

**Kennzeichnung:** gemessen (360 x 640 aufgeklappte Karte; 640 x 360 alle Karten).

**Ort:** Einheitenkarte, Zeile „Hinweise: Zeitraum vorbei“ (Verweis 168 x 47) über der Knopfreihe.

**Beobachtung:** Im Hochformat liegt der Verweis 3,6 px über „Zuklappen“ und „Details“. Im Querformat sind die Karten
immer aufgeklappt, und der Verweis liegt 3,6 px über „Details“ (77 x 44), „Bogen als PDF“ und bei Karten mit
vier Hinweisen auch über „Abrücken“ (144 x 44, y 257 bis 304 gegen 308). Die Knöpfe untereinander haben 12 px.

**Erwartung der Rolle:** Ein Verweis auf Text hält zu Knöpfen mit Wirkung mindestens 8 px Abstand.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp von oben öffnet Hinweise statt „Details“, von unten kann er
„Abrücken“ auslösen (mit „Rückgängig“ in der Quittung).

**Empfehlung:** 8 bis 12 px Abstand zwischen Hinweisverweis und Knopfreihe oder den Verweis in die Kopfzeile der Karte.

**Nachprüfung:** 640 x 360 und 360 x 640: Abstand Verweis zu Knopfreihe mindestens 8 px.

**Neu oder alt (Verweis):** neu.

### R17-G2 [P3] Assistent bei 320 px Breite: „Weiter“ ist nur ein Pfeil, 18 px neben „In Einsatz übernehmen“

**Kennzeichnung:** gemessen (320 x 568, Schnellerfassung und Aufnahme).

**Ort:** Fußleiste des Assistenten in der Aufnahme am Meldekopf, alle Schritte.

**Beobachtung:** Bei 320 px steht rechts nur „→“ (51 x 44), links davon „In Einsatz übernehmen“ (99 x 52, zweizeilig,
Abstand 18 px). Ab 360 px steht wieder „Weiter →“ (104 x 44), ebenso quer. Im Schritt 5 heißt der Knopf bei 360 px
„Zur Übersicht →“.

**Erwartung der Rolle:** Der Knopf, der weiterführt, ist auch bei schmalen Telefonen benannt.

**Auswirkung im Einsatz:** Gering; nur sehr schmale Geräte (Feld- oder Kompaktgeräte mit großer Systemschrift).

**Empfehlung:** Bei 320 px „Weiter“ als Wort führen, das Kontrastsymbol „◐“ in die Kopfzeile verlegen.

**Nachprüfung:** 320 x 568: Knopf nach rechts trägt das Wort „Weiter“.

**Neu oder alt (Verweis):** alt, wie R16-G1, bei 320 px weiter offen (bei 360, 375, 390, 412 px behoben).

### R17-G3 [P3] Fußleiste im Querformat: „◐“ bei 568 x 320 nur 37 px breit, „In Einsatz übernehmen“ bei 640 x 360 und 844 x 390 nur 42 px hoch

**Kennzeichnung:** gemessen.

**Ort:** Fußleiste des Assistenten in der Aufnahme, quer.

**Beobachtung:** 568 x 320: „◐“ 37 x 47. 640 x 360 und 844 x 390: „In Einsatz übernehmen“ 168 x 42. Alle übrigen
Knöpfe der Leiste (Zurück 109 x 44, Weiter 104 x 44) messen 44 px.

**Erwartung der Rolle:** Jeder Knopf der Leiste mindestens 44 x 44.

**Auswirkung im Einsatz:** Gering; die Rückfrage „Erfassung schon abschließen?“ fängt einen Fehltipp ab.

**Empfehlung:** Mindestmaß 44 px auch im Querformat setzen.

**Nachprüfung:** 568 x 320 und 640 x 360: alle Knöpfe der Leiste mindestens 44 x 44.

**Neu oder alt (Verweis):** neu.

### R17-G4 [P3] Fußleiste des Assistenten ab 385 px Breite 128 px hoch

**Kennzeichnung:** gemessen (385 x 800, 390 x 844, 412 x 915: 128 px; 360 x 640 und 375 x 667: 75 px; quer 56 px).

**Ort:** Fußleiste des Assistenten in der Aufnahme.

**Beobachtung:** Ab 385 px Breite steht „In Einsatz übernehmen“ (voll breit, 44 px) in einer zusätzlichen Zeile
über „← ◐ Ansicht … Weiter →“; die Leiste deckt 15 % der Höhe bei 390 x 844 und bleibt auch beim Tippen in
Felder fest. Bei 360 x 640 sind es 75 px (12 %).

**Erwartung der Rolle:** Möglichst viel Platz für Felder; größere Telefone sollten nicht mehr Leiste als kleine zeigen.

**Auswirkung im Einsatz:** Gering; weniger sichtbare Felder je Bildschirm, mehr Scrollen.

**Empfehlung:** Auch bei 385 px und mehr eine Zeile (wie bei 375 px).

**Nachprüfung:** 390 x 844: Leiste höchstens 80 px.

**Neu oder alt (Verweis):** alt, wie R15-M2, weiter offen.

### R17-G5 [P3] Sammlung: Quittungsleiste und feste Ansichtsleiste zusammen bis 23 % des Bildschirms

**Kennzeichnung:** gemessen (360 x 640 und 640 x 360, nach „Zur Kenntnis genommen“, „Abrücken“).

**Ort:** Einsatzansicht, unten.

**Beobachtung:** Die Quittungsleiste misst 91 px (65 px quer, vier Zeilen bis höchstens 91), nach 15 s 57 px. Die
Ansichtsleiste („◐ Ansicht: Standard“) bleibt immer 56 px hoch. Zusammen sind das 147 px von 640 (23 %) und
im Querformat 121 px von 360 (34 %). Karten und Knöpfe laufen darunter durch; die erste Seite zeigt „Bögen
einlesen…“ nur halb über der Ansichtsleiste.

**Erwartung der Rolle:** Die Fläche für die Einheitenliste bleibt groß; Quittungen verschwinden oder schrumpfen schneller.

**Auswirkung im Einsatz:** Gering; Knöpfe unter der Leiste müssen erst herausgescrollt werden.

**Empfehlung:** Ansichtsleiste in der Einsatzansicht nicht dauerhaft fest halten oder bei Quittung ausblenden.

**Nachprüfung:** 360 x 640 nach einer Quittung: höchstens 100 px feste Leiste.

**Neu oder alt (Verweis):** alt, wie R11-M3 (Fläche der Quittung), weiter offen.

### R17-G6 [P3] Lückenlose Reihen verschiedener Ziele: Schrittleiste, „Karten | Tabelle“, Vorschlagslisten, Fußzeilen-Linklisten

**Kennzeichnung:** gemessen (360 x 640, 390 x 844).

**Ort:** Reiter 1 bis 6 des Assistenten (je 55 px breit, 0 px); „Karten | Tabelle“ in der Einheitenliste (0 px); Zeilen
der Vorschlagslisten bei „Funktion…“ (je 44 px hoch, 0 px); Fußzeilen-Linklisten (Anleitung, Aufbau, Blanko, THW,
Feuerwehr, DLRG, … je 44 px hoch, 0 px; zwei Fremdseiten-Verweise `erfassungsbogen.app | …` 0 px).

**Beobachtung:** Nachbarn mit unterschiedlichem Ziel berühren sich ohne Lücke; jeder Tipp trifft nur dann sicher, wenn
er genau in der Mitte der Zeile liegt.

**Erwartung der Rolle:** Mindestens 8 px zwischen benachbarten Zielen, wie bei den Knöpfen der Karten.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp wechselt den Schritt, die Ansicht oder öffnet eine Hilfeseite; Daten
gehen nicht verloren (der Schrittwechsel speichert).

**Empfehlung:** 4 bis 8 px Lücke oder deutliche Trennlinie mit mehr Zeilenhöhe.

**Nachprüfung:** Abstand der genannten Reihen mindestens 4 px.

**Neu oder alt (Verweis):** alt, wie R6-G6 (Schrittleiste, Karten/Tabelle ohne Lücke) und die in R15 vermerkten lückenlosen Fußzeilen- und Vorschlagslisten.

### R17-G7 [P3] Tabelle: 25 Spalten auf 1 835 px, Sortierköpfe 44 bis 49 px breit mit 5 px Abstand

**Kennzeichnung:** gemessen (360 x 640, Tabellenansicht).

**Ort:** Einheitenliste, Ansicht „Tabelle“.

**Beobachtung:** Die Tabelle ist 1 835 px breit in einem 326 px breiten Feld; sichtbar sind bei 360 px die Spalten
Einheit, Ges., F, U, M. Die Sortierköpfe der schmalen Zahlenspalten messen 44 bis 49 x 44 bis 51 px mit 5 px Abstand
(„Ges.“, „F“, „U“, „M“, „KFZ“, …). Der Hinweis „Zum Weiterlesen seitlich wischen →“ steht über der Tabelle; die
Zeilen haben keine Aktionen.

**Erwartung der Rolle:** Ein Wisch zur Seite trifft nicht aus Versehen einen Sortierkopf; sortiert wird bewusst.

**Auswirkung im Einsatz:** Gering. Wer in der Tabelle seitlich wischt und am Kopf ansetzt, kann die Sortierung wechseln,
die Zeilen springen.

**Empfehlung:** Sortierung über das Auswahlfeld „Sortierung“ im Filter (vorhanden) belassen und die Köpfe nur beschriften
oder 8 px Abstand geben.

**Nachprüfung:** 360 x 640: Abstand der Sortierköpfe mindestens 8 px, oder Köpfe ohne Tippfunktion.

**Neu oder alt (Verweis):** alt, wie die in R15 vermerkte Grenze „Sortierköpfe der Tabelle dicht nebeneinander“.

### R17-G8 [P3] Startseite: Fließtext-Verweise nur 17 px hoch mit 7 px Abstand

**Kennzeichnung:** gemessen (360 x 640, Startseite, Abschnitt „Für Einsatz, Übung und Bereitstellungsraum“ und folgende).

**Ort:** Startseite, Textabschnitte unter „So funktioniert’s“ (Vollmessung der Seite).

**Beobachtung:** Verweise im Fließtext messen 17 px Höhe: „Erfassungsbogen im THW“ (184 x 17), „Feuerwehr“ (75 x 17),
„DLRG“ (46 x 17), „DRK“ (35 x 17), „Johanniter“, „Malteser“, „ASB“, „Katastrophenschutz der Länder“, „Übersicht“
(69 x 17), „Datenschutzhinweis“ (146 x 17), „Meldekopf“ (73 x 17), „Meldekopf digital“ (121 x 17); Zeilenabstand 24 px, Lücke
zwischen Nachbarn 7 px. Alleinstehende Verweise („Aufbau des Bogens und Blanko-Vorlage“, „Anleitung zum
Erfassungsbogen“, „Papier oder digital?“, „Fachgruppe Räumen“) sind 41 px hoch mit 7 px Abstand.

**Erwartung der Rolle:** Verweise, die man im Einsatz anfassen soll, sind mindestens 44 px hoch.

**Auswirkung im Einsatz:** Gering; es sind Wege in Hilfeseiten, keine Einsatzfunktion, aber eng gesetzt mit Handschuh.

**Empfehlung:** Mehrere Verweise nebeneinander als Knopfreihe mit 44 px Höhe oder mit Zeilenabstand von mindestens 44 px.

**Nachprüfung:** 360 x 640: die genannten Verweise mindestens 44 px hoch oder 8 px Abstand.

**Neu oder alt (Verweis):** alt, wie die in R15 vermerkten „Fließtext-Links der Begleitseiten“, in R12 als Fließtextlink vermerkt.

### R17-G9 [P3] „−“ und „+“ der Stärkefelder liegen nur 6,4 px auseinander

**Kennzeichnung:** gemessen (360 x 640 und 320 x 568, Schnellerfassung, Schritt 3 „Nur Stärke“).

**Ort:** Stufenfelder Führer, Unterführer, Mannschaft, vegetarisch, vegan.

**Beobachtung:** „−“ (52 x 52) und „+“ (52 x 52) umrahmen das Zahlenfeld (60 x 52) mit je 6,4 px Lücke. Gegensätzliche
Wirkung (verringern, erhöhen) mit weniger als 8 px Abstand.

**Erwartung der Rolle:** Gegensätzliche Knöpfe in einer Reihe mindestens 8 px auseinander, das Feld als Zahleneingabe antippbar.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp verändert die Zahl um 1; die Gesamtzahl steht daneben und fällt auf.

**Empfehlung:** 8 bis 12 px Abstand zwischen „−“, Feld und „+“.

**Nachprüfung:** 360 x 640: Abstand mindestens 8 px.

**Neu oder alt (Verweis):** alt, in der Nachprüfung von R16 als „Zahlenfelder Schnellerfassung: 6 bis 7 px Abstand“ geführt, nicht behoben.

### R17-G10 [P3] Verweise „11 ohne Auftrag · 11 ohne Zug“ liegen 2,9 px über „Suchen, sortieren, filtern“

**Kennzeichnung:** gemessen (360 x 640, 390 x 844).

**Ort:** Einheitenliste, Zeile unter „Karten | Tabelle“.

**Beobachtung:** „11 ohne Auftrag“ (90 x 47) und „11 ohne Zug“ (70 x 47) sind Filterverweise; der Schließbalken
„Suchen, sortieren, filtern“ (volle Breite, 44 px) liegt 2,9 px darunter, „Karten“ 3,9 px darüber.

**Erwartung der Rolle:** Ein Verweis, der die Liste filtert, hält Abstand zu Nachbarknöpfen.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp filtert die Liste auf eine Teilmenge, ohne dass es sofort auffällt.

**Empfehlung:** 8 px Abstand über und unter der Filterzeile.

**Nachprüfung:** 360 x 640: Abstand mindestens 8 px.

**Neu oder alt (Verweis):** neu.

### R17-G11 [P3] Assistent: Ein zweiter „Weiter“-Tipp innerhalb von 1,2 s wird verworfen

**Kennzeichnung:** gemessen (360 x 640, Tipps an derselben Stelle (290, 606), eigener Bogen).

**Ort:** „Weiter →“ im Assistenten, Schritte 1 bis 5.

**Beobachtung:** Bei Tippabstand 150 ms bleibt der Assistent in Schritt 2; bei 400 ms wechselt jeder dritte Tipp, bei
800 ms jeder zweite (Folge 2, 2, 3, 3, 4), bei 1 500 ms jeder Tipp (2, 3, 4, 5, Übersicht). Der abgefangene
Tipp zeigt „Einen Moment …“.

**Erwartung der Rolle:** Wer in leeren oder bekannten Schritten zügig „Weiter“ tippt, kommt zügig voran.

**Auswirkung im Einsatz:** Gering. Der Schutz gegen versehentliches Doppeltippen kostet beim bewussten Durchblättern
je zweiten Schritt einen zweiten Tipp; Nutzer vermuten „Tipp daneben“.

**Empfehlung:** Sperre im Assistenten nur für den Wechsel in den Schritt, der das Ziel trägt, und kürzer (etwa 0,5 s),
oder Hinweis „Weiter in einer Sekunde“ neben dem Knopf.

**Nachprüfung:** 360 x 640: Tipps im Abstand 600 ms wechseln jeden Schritt.

**Neu oder alt (Verweis):** neu (der Doppeltipp-Schutz selbst ist R14-G1/R16-D1).

### R17-G12 [P3] Scanner im Querformat: Knopfleiste deckt „Hinweise zum Handscanner“ und das Statusfeld ab

**Kennzeichnung:** gemessen (640 x 360, 568 x 320, 844 x 390; Browser ohne Kamera).

**Ort:** Dialog „Bogen scannen…“ (Meldung „Dieses Gerät meldet keine nutzbare Kamera“).

**Beobachtung:** Die untere Leiste („Kamera erneut versuchen“ 616 x 44, darunter „QR aus Bild einlesen…“ und „Fertig“)
überdeckt das Feld „Bereit — warte auf den Handscanner“ teilweise und die Zeile „Hinweise zum Handscanner“
vollständig (`elementFromPoint` an der Zeile liefert „Kamera erneut versuchen“ bzw. „QR aus Bild einlesen…“).
Der Dialog lässt sich scrollen (457 px Inhalt bei 360 px); nach 200 px Scrollen ist die Zeile antippbar.

**Erwartung der Rolle:** Die Hinweiszeile ist ohne Wisch erreichbar, oder die Leiste lässt Platz.

**Auswirkung im Einsatz:** Gering. Ein Tipp auf die verdeckte Zeile löst „Kamera erneut versuchen“ aus.

**Empfehlung:** Im Querformat die Leiste in eine Zeile legen oder den Dialoginhalt mit Polster unter die Leiste setzen.

**Nachprüfung:** 640 x 360: „Hinweise zum Handscanner“ ohne Scrollen frei sichtbar.

**Neu oder alt (Verweis):** neu.

### R17-G13 [P3] Bögen einlesen: mehrere unlesbare Dateien erzeugen elfmal denselben roten Absatz

**Kennzeichnung:** gemessen (360 x 640, elf Übungsbögen mit einem Zeitfeld, das das Format nicht erkennt, in einem Zug gewählt).

**Ort:** Einsatzansicht, Meldung nach „Bögen einlesen…“.

**Beobachtung:** Es erscheint ein rotes Feld, in dem der Satz „In der Datei ist kein Bogen lesbar — 1 von 1 Bogen ist
unvollständig (der Stand (Zeitpunkt der letzten Änderung) fehlt) und wurde nicht übernommen.“ elfmal ohne Trenner
und ohne Dateinamen hintereinandersteht (rund 1 000 px, mehr als ein Bildschirm); die Knöpfe darunter („Bedarf“, Liste)
rutschen aus dem Bild.

**Erwartung der Rolle:** Ein Satz: „11 von 11 Dateien nicht lesbar: Stand fehlt“, mit den Dateinamen.

**Auswirkung im Einsatz:** Gering. Ein Stapel defekter Dateien (etwa vom falschen Gerät) ist selten, aber wer ihn erwischt,
sieht eine rote Wand, aus der nicht hervorgeht, welche Datei betroffen ist.

**Empfehlung:** Gleiche Meldungen zusammenfassen mit Zahl und Dateinamen.

**Nachprüfung:** Elf gleichartig defekte Dateien: ein Satz mit „11“ und höchstens fünf Zeilen.

**Neu oder alt (Verweis):** neu.

### R17-G14 [P3] Nach „Abrücken“ springt der Bildlauf: die Karte rückt 93 px nach oben

**Kennzeichnung:** gemessen (360 x 640, Karte Nr. 1, aufgeklappt).

**Ort:** Karte, „Abrücken“; die Quittung „Abgerückt …: Nr. 1 …“ erscheint unten mit „Rückgängig“ (121 x 44) und „✕“.

**Beobachtung:** „Abrücken“ steht beim Tipp bei y = 168 und nach der Aktion bei y = 75 (neuer Bildlauf 1 587 px); der Knopf
wird zu „✓ Abgerückt“ (gestrichelt, gleiche Breite 144 px), neben „Mehr…“ erscheint „Historie“. Die Knopfreihe der Karte
verschiebt sich dabei nicht gegeneinander (Abstand „Abrücken“ zu „Mehr…“ 112 px vorher und nachher); nur das ganze Blatt springt.

**Erwartung der Rolle:** Nach einem Tipp bleibt die Stelle unter dem Finger ruhig.

**Auswirkung im Einsatz:** Gering. Wer schnell nachtippt, trifft den jetzt dort liegenden Knopf; abgefangen wird das nur
innerhalb des Doppeltipp-Schutzes („Einen Moment …“).

**Empfehlung:** Bildlaufstelle halten, die Quittung unten einblenden, ohne die Liste zu verschieben.

**Nachprüfung:** 360 x 640: y des Knopfs vor und nach „Abrücken“ höchstens 10 px verschoben.

**Neu oder alt (Verweis):** alt, wie R16-Nachprüfung „Abrücken (Zweittipp)“ (Bildlauf springt um 176 px), weiter beobachtbar (93 px).

## Nachprüfung der Behebungen aus Runde 16 (echter Browser)

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R16-G1 „Weiter“ nur Pfeil | hält bei 360 bis 412 px, offen bei 320 px | „Weiter →“ 104 x 44 bei 360, 375, 390, 412 px; bei 320 x 568 nur „→“ (R17-G2) |
| R16-G2 Zeilen der offenen Punkte | hält | 360 x 640 und 390 x 844: vier Verweise 250 x 51, 250 x 51, 250 x 51, 152 x 44 mit je 13 px Abstand |
| R16-H1 „Zur Liste springen ↓“, „Alle 11 einzeln anzeigen“, „Zur Kenntnis genommen“ | hält | 123 x 44, 150 x 44, 155 x 44 |
| R16-D1 zweiter Tipp nach „Zur Kenntnis genommen“ | hält | zweiter Tipp nach 300 ms: „Einen Moment …“, Quittung mit „Rückgängig“ 121 x 44 und „✕“ 44 x 44, 12 px Abstand |
| R16-K1 bis K4, M1 bis M3 | hält | Dialoge „Stärke ändern“, „Meldung entfernen“, „Als Übung kennzeichnen“: Knöpfe 302 x 44, Abstand 8 bis 41 px, am Dialogfuß |
| R16-S1/S2 Zahl markiert beim Antippen | hält | Feld „Führer“ im Dialog „Stärke ändern“ trägt die Markierung |
| Mehr-Menü der Karte | hält | Aufteilen…, Stärke ändern…, Als Übung kennzeichnen…, Verschieben…, Entfernen alle 44 px hoch, „Entfernen“ rot abgesetzt |
| Aufteilen | hält | Zeilen 64 px, Kästchen 20 px mit voller Zeile als Ziel |
| Kästchen und Optionsfelder (24 px) | hält | Beschriftung als Ziel 48 px hoch („nur dringender Bedarf“, „Nur neue Bögen seit dem letzten Export“) |
| Funktionsvorschläge „Funktion…“ | hält | Zeilen 44 px, erscheinen beim Antippen und Tippen |
| R12-G3 Versatz nach „Abrücken“ | im Browser nicht mehr zu beobachten | Knopfreihe verschiebt sich nicht (112 px Abstand vorher und nachher) |
| Startseite, Dialog „Neue Einsatz-Sammlung“ | hält | Knöpfe 302 x 44, Feld 304 x 44, passt in 640 px |
| Querformat 640 x 360, 568 x 320, 844 x 390 | hält mit Ausnahmen | Fußleiste 56 px, Felder im Bild (Ausnahmen R17-G3, R17-G12) |
| Seitliches Überlaufen | hält | 320, 360, 390 px: Seitenbreite = Fensterbreite |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Wer im Assistenten zügig zweimal „Weiter“ tippt, hält den verworfenen Tipp für einen Fehltipp (R17-G11).
- **Größtes Einsatzrisiko:** Gering: Ein Fehltipp auf „Abrücken“ unter dem 3,6 px entfernten Hinweisverweis (R17-G1), abgefangen durch „Rückgängig“.
- **Top-Priorität für die nächste Iteration:** Abstände zwischen Verweisen und Knöpfen mit Wirkung auf mindestens 8 px bringen (R17-G1, R17-G9, R17-G10, R17-G6).
