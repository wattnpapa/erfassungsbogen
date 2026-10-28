# Audit „Handschuh-Bedienung“, Runde 19 (Touch-Ziele, Abstände, Tipp-Sperren, Quittung, Übergabe, Scanner)

Prüfer: Rollenaudit `thw-glove-touch-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (Produktionsbuild, Code-Stand `0ac0d7f`, `main`)

**Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 13 (R19-G1 bis R19-G13)

Reiner Prüfbericht, keine Codeänderung. Gelesen vor dem Prüfen: `docs/audits/README.md`, der Abschnitt „Stand der
Behebung“ in `runde-18/README.md` und `runde-18/handschuh-bedienung.md`. Was im Browser noch zu beobachten ist, steht
hier, auch wenn es früher als „offen“, „teilweise“ oder „nicht gemessen“ geführt wurde (Feld „Neu oder alt (Verweis)“).
Behebungen, die im Browser nicht mehr zu beobachten sind, stehen nur in der Nachprüfungstabelle.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen, nichts installiert; die Projektkopie fand
keinen Browser), `isMobile`, `hasTouch`, Pixeldichte 2, de-DE. Viewports 360 x 640 und 390 x 844, dazu 320 x 568 sowie quer
640 x 360 und 568 x 320. Zustand: frisch angelegte Einsatz-Sammlung „Hochwasser Test“ mit 2, 3, 4, 6 oder 11 THW-Beispielbögen
(`examples/thw`, über „Bögen einlesen…“), eigener Bogen im Assistenten (Schritt 1 bis 6, Personen, Übergabe, „Bogen
schließen“), Schnellerfassung, Scanner (ohne Kamera), Papierkorb, Exporte, Anzeigemodus „Feld“. Tipps als Touch-Tipps
(`touchscreen.tap()`) an festen Koordinaten, Zeitabstände gestuft (100 bis 1 300 ms). Maße aus `getBoundingClientRect()`
aller Knöpfe, Verweise, Felder (Größe, kleinster Randabstand benachbarter Ziele, Textüberlauf, Treffer-Test mit
`elementFromPoint`). Nicht prüfbar: echte Handschuhe, echte Bildschirmtastatur (nachgestellt über Fensterhöhe 340),
Kamera-Scan, native Zeitwähler (Chromium zeigt im Prüfbrowser ein 12-Stunden-Feld „--:-- --“; ob das am Gerät ebenso ist,
bleibt offen), Pull-to-Refresh, echte Downloads auf dem Gerät.

Kennzeichnung: **gemessen** = Zahl oder Ablauf aus dem Browser.

## Urteil

Die Bedienung mit Handschuh trägt. Alle P2-Befunde der Runde 18 sind behoben: Die Aufnahmeknöpfe stehen jetzt direkt unter
den Kennzahlen („Bogen scannen…“ bei 361 px, mit elf eingelesenen Bögen unverändert), „Zurückholen“ und „Endgültig
löschen…“ im Papierkorb haben 54 px Abstand, „Abbrechen“ und „Rückgängig“ werden ab rund 300 ms angenommen, „Gehört zu
dieser Lage“ ist ein 44-px-Knopf. Tipp-Sperren, Quittungsleiste, Nummern nach „Entfernen“, Papierkorb nach Neuladen,
Übergabe und Abschluss, Dateinamen, Tabelle am Telefon, Scanner ohne Kamera und Tastaturverhalten halten. Es bleiben 13
Kleinigkeiten (P3): abgeschnittene Beschriftungen auf drei Knopfgruppen, zu enge Reihen (alt), eine breite Quittung (alt),
ein Layoutsprung nach „Zur Kenntnis genommen“, der Ansichtsschalter am Seitenende, Unklarheiten im Block „Übergabe und
Abschluss“, die Anleitung im Scanner ohne Kamera (quer), abgeschnittene Namen in der Tabelle, die Länge der Schnellerfassung
und der Karte im Feld-Modus sowie ein Dateiname. Die Aufgabe (Bogen erfassen, Bögen einlesen, Karte bedienen, Abrücken,
Entfernen, Zurückholen, Übergabe vermerken, Einsatz beenden) ist ohne fremde Hilfe zu schaffen.

## Befunde

### R19-G1 [P3] Fußleiste der Schnellerfassung: „In Einsatz übernehmen“ ist bei 360 px abgeschnitten

**Kennzeichnung:** gemessen (360 x 640 und 320 x 568; Schnellerfassung, alle vier Schritte).

**Ort:** feste Fußleiste der Schnellerfassung („In Einsatz übernehmen“ neben „Weiter →“ beziehungsweise „Übersicht →“).

**Beobachtung:** Bei 360 px ist der Knopf 121 x 44, der Text 147 px breit (`scrollWidth` 134 gegen `clientWidth` 119); im Bild
steht „Einsatz übernehme“, links und rechts abgeschnitten. Bei 320 px heißt der Knopf „Übernehmen“ und der Text berührt
beide Ränder. Bei 390 px passt er (157 x 44). Der Knopf ist die Hauptaktion der Schnellerfassung.

**Erwartung der Rolle:** Die Beschriftung des Knopfes, der die Meldung in die Lage übernimmt, ist vollständig lesbar,
ohne zu raten.

**Auswirkung im Einsatz:** Gering. Wer „…übernehme“ liest, versteht es meist; aber gerade die Aktion mit Wirkung steht in
der kleinsten Schrift-Ausnutzung des Bildschirms am Rand.

**Empfehlung:** Knopf so breit, dass die Beschriftung passt (oder zweizeilig ohne Abschneiden); einheitlicher Text bei
jeder Breite.

**Nachprüfung:** 360 x 640 und 320 x 568: Text des Knopfes liegt vollständig im Knopf (`scrollWidth` <= `clientWidth`).

**Neu oder alt (Verweis):** neu (verwandt: R17-G2, „Weiter“ und „Übernehmen“ bei 320 px, damals nur Maße gemessen).

### R19-G2 [P3] Kartenknöpfe: Beschriftung läuft über den Rand („Als Einsatzmeldung zählen…“, „Verschieben…“, „Auftrag/Notiz“)

**Kennzeichnung:** gemessen (360 x 640: „Als Einsatzmeldung zählen…“ Knopf x 230 bis 314, Text x 220 bis 324;
„Verschieben…“ Knopf 46 bis 130, Text 41 bis 136; 390 x 844: Text 245 bis 349 im Knopf 250 bis 344; „Auftrag/Notiz“ 320 px
im Feld-Modus: Text 53 bis 155 im Knopf 52 bis 156).

**Ort:** aufgeklappte Einheitenkarte, Knopfraster; Bereich „Mehr…“.

**Beobachtung:** Die Knöpfe sind je 84 bis 94 px breit, 44 bis 50 px hoch. Dreizeilige Texte wie „Als Einsatzmeldung
zählen…“ ragen rechts und links über die Umrandung hinaus; „Auftrag/Notiz“ füllt den Knopf vom linken bis zum rechten Rand
(Innenabstand 4 px).

**Erwartung der Rolle:** Beschriftungen liegen im Knopf; sie sind mit Handschuh auf einen Blick zu lesen.

**Auswirkung im Einsatz:** Gering. Die Zuordnung eines Textes zu dem Knopf, in dem er steht, ist beim schnellen Blick
unsicher (benachbarte Knöpfe, „Entfernen“ in der Reihe darunter).

**Empfehlung:** Knopfbreite oder Schriftbild so wählen, dass die längste Beschriftung ohne Überlauf passt, oder kürzere
Texte („Als zählend markieren…“).

**Nachprüfung:** Aufgeklappte Karte bei 360, 390 und 320 px (auch „Feld“): kein Knopftext breiter als sein Knopf.

**Neu oder alt (Verweis):** neu.

### R19-G3 [P3] Reihen verschiedener Ziele mit nur 4 bis 6 px Abstand („Karten | Tabelle“, Fußzeilen-Linklisten)

**Kennzeichnung:** gemessen (360 x 640, 390 x 844, 320 x 568, 640 x 360).

**Ort:** „Karten“ und „Tabelle“ über der Einheitenliste (6 px, je 73 x 44 und 79 x 44); Fußzeile der Startseite und der
Einsatzansicht: „Anleitung“, „Aufbau des Bogens“, „Blanko-Vordruck (PDF)“ (4 px), „Kontakt“ und „Open Source auf GitHub“ (4 px),
Themenliste „THW“, „Feuerwehr“, „DLRG“, „DRK“, „Johanniter“, „Malteser“, „ASB“, „Katastrophenschutz“, „Bundeseinheiten (BBK)“,
„Bundeswehr“, „Meldekopf“ (je 44 hoch, 4 px), die Verweise `erfassungsbogen.app`, `fmbauplaner.app`,
`nachrichtenvordruck.app`, `sprechfunk-uebung.de` (4 px).

**Beobachtung:** Alle Ziele sind 44 px hoch, aber die Lücken sind kleiner als 8 px. Die Schrittleiste des Assistenten
(8 px) und die Knöpfe in Rückfragen (41 px und mehr) sind in Ordnung.

**Erwartung der Rolle:** Mindestens 8 px zwischen benachbarten Zielen mit verschiedener Wirkung.

**Auswirkung im Einsatz:** Gering. Ein Fehltipp wechselt die Ansicht oder öffnet eine Hilfe- oder Fremdseite; Daten gehen
nicht verloren.

**Empfehlung:** 8 px Abstand in den Reihen; bei den Linklisten Zeilenabstand von mindestens 8 px.

**Nachprüfung:** Abstand der genannten Reihen mindestens 8 px.

**Neu oder alt (Verweis):** alt, R18-G5, R17-G6, R6-G6 (Schrittleiste inzwischen behoben, Rest „Karten | Tabelle“ und
Fußzeilen).

### R19-G4 [P3] Quittungsleiste deckt 18 bis 24 % des Bildschirms, 30 Sekunden lang

**Kennzeichnung:** gemessen (Höhe nach „Entfernen“ nun gemessen: 360 x 640 119 px = 19 %; 320 x 568 136 px = 24 %;
390 x 844 118 px = 14 %; 568 x 320 74 px = 23 %; nach „Abrücken“ 103 px bei 360 x 640 und 320 x 568 = 16 bis 18 %,
quer 640 x 360 65 px = 18 %; „Abgerückt“-Quittung verschwand nach 30 s).

**Ort:** feste Quittungsleiste unten („Abgerückt …“, „Entfernt: Meldung Nr. 1 …“, „Zur Kenntnis genommen“, „Zug … gesetzt“).

**Beobachtung:** Die Leiste liegt über dem Seitenende und verdeckt beim Weiterarbeiten die untere Kartenzeile samt Knöpfen.
Nach „Entfernen“ steht sie zusätzlich neben der in der Seite stehenden Einlese-Quittung (105 px, bleibt stehen).
„Rückgängig“ (100 x 44) und „✕“ (44 x 44) liegen 16 px auseinander, das ist in Ordnung.

**Erwartung der Rolle:** Die Quittung nimmt höchstens einen schmalen Streifen; die Karte darunter bleibt bedienbar.

**Auswirkung im Einsatz:** Gering. Bis zum Ausblenden (oder Wegtippen) ist die untere Kartenreihe schwerer zu erreichen;
der Helfer scrollt zusätzlich.

**Empfehlung:** Quittung einzeilig mit „Rückgängig“ in derselben Zeile oder mit dem Text gekürzt („Entfernt: Nr. 1.
Rückgängig“), die längere Erklärung („Nr. 1 bleibt frei …“) in der Seite.

**Nachprüfung:** 320 x 568: Quittung nach „Entfernen“ höchstens 15 % der Fensterhöhe.

**Neu oder alt (Verweis):** alt, R18-A8 („Höhe nach ‚Entfernen‘ nicht neu gemessen“), R18-H2, R17-G5.

### R19-G5 [P3] „Zur Kenntnis genommen“ lässt die Seite springen; unter dem Finger liegt danach ein anderes Ziel

**Kennzeichnung:** gemessen (360 x 640: Knopf vor dem Tipp bei y 221, Bildlauf 978; nach dem Tipp Bildlauf 1 052; unter der
Fingerposition liegt „Suchen, sortieren, filtern“).

**Ort:** Einsatzansicht, Kasten „Neu seit der letzten Kenntnisnahme (n)“.

**Beobachtung:** Der Tipp klappt den gesamten Kasten (rund 480 bis 520 px) weg, die Liste rückt nach oben, das Ziel unter
dem Finger wird ein Auf-/Zuklapp-Schalter. Ein zweiter Tipp an derselben Stelle (Doppeltipp, 250 ms) öffnet dann das Filterfeld
oder trifft eine Karte. Die Quittung „Zur Kenntnis genommen: n Einheiten“ mit „Rückgängig“ erscheint (86 px).

**Erwartung der Rolle:** Nach einer Sammelaktion bleibt die Seite stabil oder der Bildlauf so, dass kein anderes Bedienelement
unter den Finger rutscht.

**Auswirkung im Einsatz:** Gering. Ein zweiter Tipp trifft einen harmlosen Schalter; unter Handschuhen wirkt der Sprung
aber wie ein Fehler der App.

**Empfehlung:** Kasten nicht entfernen, sondern auf eine Zeile einklappen; Bildlaufposition stabil halten.

**Nachprüfung:** 360 x 640: Position von „Einheiten (n gemeldet)“ ändert sich nach „Zur Kenntnis genommen“ um weniger als
50 px.

**Neu oder alt (Verweis):** neu.

### R19-G6 [P3] Ansichtsschalter (Standard / Feld / Dunkel / Nacht) liegt in der Einsatzansicht am Seitenende

**Kennzeichnung:** gemessen (360 x 640: Schalter bei y 5 380 von 5 500 beziehungsweise 7 992 im Feld-Modus; die feste Leiste
„◐ Ansicht: Standard“ ist im Standardmodus nur am Seitenende sichtbar, im Modus „Feld“ dauerhaft sichtbar, 57 px hoch).

**Ort:** Einsatzansicht (im Assistenten steht „Ansicht: Standard ▾“ in der Kopfzeile).

**Beobachtung:** Wer mit Handschuh den Modus „Feld“ (große Tasten) oder „Nacht“ einschalten will, findet den Schalter erst
ganz unten (rund acht Bildschirmhöhen). Im Feld-Modus bleibt die Leiste danach über allen Karten stehen und deckt 57 px.

**Erwartung der Rolle:** Der Schalter für große Tasten ist dort, wo die Bedienung beginnt (Kopfzeile wie im Assistenten).

**Auswirkung im Einsatz:** Gering. Die Hilfe für Handschuhbedienung wird gerade dort nicht gefunden, wo sie gebraucht
wird; wer sie hat, verliert 57 px.

**Empfehlung:** „Ansicht“ in die Kopfzeile der Einsatzansicht; Leiste im Feld-Modus nicht dauerhaft.

**Nachprüfung:** 360 x 640 Einsatzansicht: Ansichtsschalter ohne Bildlauf erreichbar.

**Neu oder alt (Verweis):** neu (R18-G2/R17-G5: feste Ansichtsleiste entfernt; der Schalter ist seitdem nur noch am
Seitenende).

### R19-G7 [P3] Block „Weitergeben“ und „Übergabe und Abschluss“: Beschriftung und Knopfart nicht eindeutig

**Kennzeichnung:** gemessen (360 x 640 und 390 x 844).

**Ort:** Einsatzansicht, „Einsatz weitergeben / sichern“, „Übergabe vermerken…“, „Einsatz als beendet markieren“.

**Beobachtung:** (1) „Einsatz weitergeben / sichern“ (221 x 44, dunkel, Hauptknopf) erzeugt sofort ohne Auswahl das
Sammel-PDF; erst danach steht „als PDF gespeichert“, und der Punkt „Weitergabe-Datei (Sammel-PDF): erzeugt“ in „Übergabe
und Abschluss“ erhält ein Häkchen. (2) „Übergabe vermerken…“ ist ein unterstrichener Textverweis (175 x 44) und wirkt nicht
wie die Folgeaktion der Liste, „Einsatz als beendet markieren“ (226 x 44) ein Knopf; die Rückfrage zu „Übergabe vermerken…“
(Name, „Vermerken“, „Abbrechen“, 332 px hoch) ist gut. (3) „Einsatz als beendet markieren“ wirkt sofort ohne Rückfrage und ohne
Quittungsleiste; zurück geht es nur über den Textverweis „Wieder öffnen“ im Absatz „Einsatz beendet … — noch offen: …“.

**Erwartung der Rolle:** Der Hauptknopf sagt, was er macht („Sammel-PDF erzeugen und weitergeben“); gleichartige
Abschlussaktionen sehen gleich aus; „beendet“ hat eine sichtbare Gegenhandlung als Knopf.

**Auswirkung im Einsatz:** Gering. Ein Tipp auf den ersten Knopf der Exportgruppe legt eine Datei ab und hakt „Weitergabe“
auf der Checkliste ab, obwohl der Helfer nur nachsehen wollte; der Textverweis „Wieder öffnen“ ist mit Handschuh am
Zeilenumbruch schwer zu treffen.

**Empfehlung:** Beschriftung „Sammel-PDF erzeugen“; „Übergabe vermerken…“ und „Wieder öffnen“ als Knöpfe; „beendet“
mit Quittung und „Rückgängig“.

**Nachprüfung:** 360 x 640: „Wieder öffnen“ mindestens 44 px hoch und als Knopf erkennbar; Beschriftung nennt PDF.

**Neu oder alt (Verweis):** neu (Übergabe und Abschluss selbst ist die Behebung von R18-W1/D6).

### R19-G8 [P3] „Jetzt“ und „Lagemonitor öffnen“ stoßen ohne Abstand an die Karte „Übergabe und Abschluss“

**Kennzeichnung:** gemessen (360 x 640: Unterkante der Knopfreihe y 3 910,7, Oberkante der Karte y 3 910,7, 0 px).

**Ort:** Einsatzansicht, „Lagemonitor für den Fernseher“, Knöpfe „Jetzt“ (62 x 44) und „Lagemonitor öffnen“ (155 x 44).

**Beobachtung:** Die Knopfreihe endet bündig am Rahmen der nächsten Karte; „Jetzt“ ändert den Einsatzbeginn, „Lagemonitor
öffnen“ öffnet ein zweites Fenster. Darunter folgt „Übergabe und Abschluss“ ohne Zwischenraum.

**Erwartung der Rolle:** Abstand zu der folgenden Karte (mindestens 16 px), damit ein Tipp am unteren Rand keine Folgeaktion
trifft.

**Auswirkung im Einsatz:** Gering; die nächste Karte beginnt mit Text, kein Knopf grenzt an.

**Empfehlung:** Außenabstand unter der Knopfreihe.

**Nachprüfung:** 360 x 640: mindestens 16 px zwischen „Jetzt“ und der Karte „Übergabe und Abschluss“.

**Neu oder alt (Verweis):** neu.

### R19-G9 [P3] Scanner ohne Kamera: Anleitung wird abgeschnitten, Hauptweg am Telefon steht quer unter dem Handscanner

**Kennzeichnung:** gemessen (360 x 640: gestrichelter Rahmen unten abgeschnitten; 640 x 360: Reihenfolge „Oder mit dem
USB-Handscanner scannen“ vor „Am Telefon: Foto oder Bildschirmfoto des Codes“, letzterer von der Leiste halb verdeckt; Leiste
mit „QR aus Bild einlesen…“ und „Fertig“ je 44 hoch).

**Ort:** Scanner („Dieses Gerät meldet keine nutzbare Kamera.“), Anleitungsrahmen.

**Beobachtung:** Die Knöpfe stehen jetzt fest unten (Behebung hält). Der Anleitungsrahmen endet im Hochformat mitten in „Hinweise zum
Handscanner“; im Querformat steht der Telefon-Weg („Knopf ‚QR aus Bild einlesen…‘ unten“) zweispaltig unter dem
Handscanner-Weg, zum Teil hinter der Leiste.

**Erwartung der Rolle:** Am Telefon steht der Weg für das Telefon zuerst und vollständig; der Rahmen ist nicht angeschnitten.

**Auswirkung im Einsatz:** Gering. Am Telefon ohne Kamera (häufiger Fall) muss man in den Rahmen scrollen, um den Hinweis
auf „QR aus Bild einlesen…“ zu lesen.

**Empfehlung:** Telefon-Weg zuerst, Rahmen mit sichtbarem unteren Rand, im Querformat einspaltig.

**Nachprüfung:** 640 x 360 und 568 x 320: „Am Telefon …“ steht über dem Handscanner-Weg und ist ohne Bildlauf lesbar.

**Neu oder alt (Verweis):** neu (verwandt R18-H8, R18-M5, R18-L2, R18-S9, im Wesentlichen behoben).

### R19-G10 [P3] Tabelle am Telefon: Einheitennamen werden mit „…“ abgeschnitten

**Kennzeichnung:** gemessen (360 x 640: Spalten 111 / 39 / 88 / 88 px, Zeile 94 px; „THW Crailsheim Fachgruppe
Wassergefahre…“, „THW Haßmersheim Fachgruppe…“, „THW Freiburg Fachgruppe Wasserschade…“).

**Ort:** Einheitenliste in der Ansicht „Tabelle“.

**Beobachtung:** Die Tabelle passt jetzt in die Breite (326 px, kein seitliches Wischen, Behebung hält); dafür sind die
Namen dreizeilig abgeschnitten, bei „Haßmersheim“ fehlt die Bezeichnung der Fachgruppe (A/B, Typ). Die Spalte „Auftrag“
(88 px) ist bei allen Zeilen leer. Ein Tipp auf den Namen springt in die Kartenansicht mit aufgeklappter Karte.

**Erwartung der Rolle:** Der vollständige Name ist lesbar; eine leere Spalte macht keinen Platz.

**Auswirkung im Einsatz:** Gering. Zwei ähnliche Fachgruppen sind in der Tabelle nicht zu unterscheiden.

**Empfehlung:** Namen umbrechen statt kürzen; leere Spalten am Telefon ausblenden.

**Nachprüfung:** 360 x 640: kein Name mit „…“ in der Tabelle.

**Neu oder alt (Verweis):** neu (Tabelle am Telefon selbst: R18-E5/R18-S10 behoben).

### R19-G11 [P3] Schnellerfassung: Pflichtfeld „Ort der Einheit“ liegt rund 870 px unter dem Seitenanfang

**Kennzeichnung:** gemessen (360 x 640 und 390 x 844: „Organisation“ y 384, „Organisationsname“ y 471, „Einheitstyp“ y 543, „Ebene“
y 760, „Ort der Einheit (Pflicht)“ y 870; Kopf mit Name, „Schnellerfassung“, Speicherzeile und „Schritt 1 von 4“ rund 160 px,
Fußleiste 57 px).

**Ort:** Schnellerfassung, Schritt 1 („Angaben vom Zettel“ eingeklappt, 77 px).

**Beobachtung:** Die Schnellerfassung verspricht „Ort und Stärke vom Zettel“; Ort steht aber nach vier Feldern, die meist
leer bleiben, und die Stärke erst in Schritt 3. Kopf und Fußleiste nehmen bei 360 x 640 rund 34 % ein.

**Erwartung der Rolle:** Die beiden Pflichtangaben stehen zuoberst; Organisationsname, Ebene und Kontakt bei Bedarf
dahinter.

**Auswirkung im Einsatz:** Gering. Je Einheit am Meldekopf zwei bis drei Bildschirmhöhen Bildlauf mit Handschuh.

**Empfehlung:** Ort und Stärke zuerst, übriges einklappen; Kopf auf eine Zeile.

**Nachprüfung:** 360 x 640: erstes Eingabefeld der Schnellerfassung ist „Ort der Einheit“ und liegt unter 300 px.

**Neu oder alt (Verweis):** alt, R18-W7, R18-S1.

### R19-G12 [P3] Karte im Modus „Feld“ ist länger als das Display; Kontrollkästchen 30 px

**Kennzeichnung:** gemessen (aufgeklappte Karte: 360 x 640 828 px, 320 x 568 907 px; Kästchen „Nur Anwesende“ und
Filterkästchen 30 x 30 px im 44-px-Etikett; Kartenbreite bei 320 px nur etwa 240 px Text).

**Ort:** Einsatzansicht im Modus „Feld“, aufgeklappte Karte.

**Beobachtung:** Gegenüber Runde 18 (1 139 px bei 320 x 568) ist die Karte kürzer, aber noch rund 160 % der Fensterhöhe.
Doppelter Rand und Innenabstand lassen bei 320 px etwa 240 px für den Text.

**Erwartung der Rolle:** Eine aufgeklappte Karte mit ihren Knöpfen ist in höchstens einer bis zwei Bildschirmhöhen zu
überblicken.

**Auswirkung im Einsatz:** Gering. Mehr Bildlauf in dem Modus, der Bildlauf vermeiden soll.

**Empfehlung:** Rand im Feld-Modus verschlanken, Hinweiszeilen einklappen.

**Nachprüfung:** 320 x 568 „Feld“: aufgeklappte Karte höchstens 800 px.

**Neu oder alt (Verweis):** alt, R18-M7 (verbessert, nicht behoben).

### R19-G13 [P3] Dateiname des Karten-PDFs trägt das Stand-Datum des Bogens statt des Erzeugungszeitpunkts

**Kennzeichnung:** gemessen (Download „Bogen als PDF“ aus der Karte: `2026-07-17_0805_eeb_THW_Albstadt_Zugtrupp_Technischer_Zug.pdf`,
dagegen Einsatz-Exporte mit `2026-10-28_0342_…`).

**Ort:** Karte, „Bogen als PDF“.

**Beobachtung:** Alle Exporte der Einsatzansicht tragen den Zeitpunkt des Exports (Behebung R18-H9 hält); das Karten-PDF den
Stand des Bogens vom 17.07.2026. Im Download-Ordner sortiert es sich zwischen alte Dateien.

**Erwartung der Rolle:** Gleiches Schema; der Stand des Bogens darf zusätzlich im Namen stehen.

**Auswirkung im Einsatz:** Gering. Die Datei ist im Download-Ordner schwer zu finden.

**Empfehlung:** Erzeugungszeitpunkt vorne, Stand des Bogens danach.

**Nachprüfung:** Dateiname des Karten-PDFs beginnt mit dem Datum des Tages.

**Neu oder alt (Verweis):** neu (verwandt R18-H9, R18-W6).

## Nachprüfung der Behebungen aus Runde 18 (echter Browser)

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R18-G1 Papierkorb „Zurückholen“ / „Endgültig löschen…“ | hält | 113 x 44 und 161 x 44, 360 x 640 nach Neuladen, Abstand 54 px (nebeneinander), Meldung mit Ablaufdatum |
| R18-G2 Aufnahmeknöpfe unter dem Falz | hält | „Bogen scannen…“ y 361 bei 360 x 640 und y 327 bei 390 x 844, auch mit elf Bögen; vier Knöpfe 57 hoch, 328 breit |
| R18-G3 Tipp-Sperre bei „Abbrechen“ / „Rückgängig“ / „Weiter“ | hält | „Abbrechen“ in „Meldung entfernen?“ nach 300 ms angenommen; „Rückgängig“ nach „Abrücken“ ab rund 300 ms; „Meldung entfernen“ (`aria-disabled`) bei 100 ms gesperrt, nach 1,3 s frei; „Weiter →“ bei 300 ms Abstand jeder Tipp, bei 150 ms jeder zweite |
| R18-G4 „Gehört zu dieser Lage“ | hält | Knopf 44 hoch (360 x 640, Karte Nr. 3) |
| Sichere Gegenhandlungen | hält | „Abbrechen“ bei jeder Rückfrage 44 hoch, Abstand zur Bestätigung 41 px und mehr; Rückfrage „Meldung entfernen?“ 513 px (360 x 640), 536 px (320 x 568), alles ohne Bildlauf erreichbar |
| Quittungsleiste | hält, Höhe siehe R19-G4 | „Abgerückt“ nach 30 s weg; „Rückgängig“ 100 x 44, „✕“ 44 x 44; Doppeltipp „Zur Kenntnis genommen“ (250 ms) setzt genau eine Kenntnisnahme |
| Nummern bleiben nach „Entfernen“ | hält | Nr. 1 entfernt, Liste Nr. 2 bis 11; Dialog und Quittung sagen „Nr. 1 bleibt frei“ |
| Papierkorb nach Neuladen | hält | „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“, liegt bis 04.11.2026 |
| Übergabe und Abschluss | hält | Checkliste (Sammel-PDF, Lageblatt, CSV, Excel, Datensicherung), „Übergabe vermerken…“ mit Rückfrage („Vermerken“ / „Abbrechen“), „Einsatz beendet … — noch offen: …“ mit „Wieder öffnen“; Rückfrage „Einsatz löschen?“ mit Papierkorb 30 Tage, „In den Papierkorb“ anfangs gesperrt |
| Dateinamen | hält, Ausnahme R19-G13 | `2026-10-28_0342_eeb-einsatz_Hochwasser_Test.pdf`, `…-lageblatt_…pdf`, `….csv`, `…-alle-daten_….csv`, `…-oldenburg_….xlsx` |
| Tabelle am Telefon | hält, Namen siehe R19-G10 | vier Spalten in 326 px, kein seitliches Wischen (sw = Fensterbreite bei 360 und 390) |
| Hauptaktion oben | hält | siehe R18-G2 |
| Scanner ohne Kamera | hält, Anleitung siehe R19-G9 | „QR aus Bild einlesen…“ und „Fertig“ in fester Leiste, 44 hoch, 360 x 640, 390 x 844, 640 x 360 |
| „Stärke 0“-Rückfrage, „Ort fehlt“-Rückfrage | hält | 487 px (76 % bei 640), Knöpfe 44 hoch, „Trotzdem mit Stärke 0 übernehmen“ 72 px über „Abbrechen“; „Zum Feld ‚Ort der Einheit‘“ setzt den Fokus |
| Person entfernen, „Bogen schließen?“, „Alle Daten löschen“ | hält | Rückfragen mit 44-px-Knöpfen; „Endgültig löschen“ und „Abbrechen“ 32 px Abstand |
| Zug für alle (Sammelaktion) | hält | „Zug ‚3. Zug‘ gesetzt: 11 Einheiten“ mit „Rückgängig“ |
| Schrittleiste Assistent | hält | 6 Reiter 44 hoch, Lücke 8 px; bei 320 px nur Nummern sichtbar |
| Tastatur (Fensterhöhe 340) | hält | Fußleiste verschwindet, fokussiertes Feld (Zug, Organisationsname) bleibt im Bild |
| Zurück-Geste | hält | schließt Rückfrage, dann zur Startseite; Vorwärts kehrt zur Einsatzansicht zurück |
| Seitliches Überlaufen | hält | 320, 360, 390 px: Seitenbreite = Fensterbreite |
| Zielgrößen | hält | Startseite, Einsatzansicht, Karte, Assistent Schritt 1 bis 6 bei 320, 360, 390: außer Kontrollkästchen (24 px in 44 px hohen Etiketten) kein Ziel unter 44 px |

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Einsatz weitergeben / sichern“ wirkt wie ein Menü, legt aber sofort ein PDF ab und hakt die Weitergabe-Checkliste ab (R19-G7).
- **Größtes Einsatzrisiko:** Gering: Die Fußleiste der Schnellerfassung schneidet bei 360 px die Beschriftung der Hauptaktion ab (R19-G1), und „Zur Kenntnis genommen“ lässt die Seite unter dem Finger springen (R19-G5).
- **Top-Priorität für die nächste Iteration:** Beschriftungen auf Knöpfen, die schmaler als ihr Text sind, vollständig sichtbar machen (R19-G1, R19-G2) und Pflichtangaben der Schnellerfassung nach oben ziehen (R19-G11).
