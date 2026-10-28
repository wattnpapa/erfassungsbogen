# Audit „Neuer Nutzer", Runde 19 (Helfer ohne Einweisung)

Prüfer: Rollenaudit `thw-new-user-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender Server, Code-Stand
Commit `0ac0d7f` = `main`) · Zählung: **P0 0 · P1 0 · P2 0 · P3 14**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md` und der
Abschnitt „Stand der Behebung" von Runde 18. Es gibt keine „bekannten Grenzen"; auch Punkte
mit Stand „offen", „teilweise" oder „nicht gemessen" sind gemeldet, wenn sie im Browser noch zu
sehen sind.

## Prüfaufbau

Chromium über das globale Playwright-Modul (`chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Tipps per Touch. Viewports 390 x 844 und 360 x 640 (zusätzlich 320 x 568 in
„Feld" für R18-M7). Frischer Browserzustand je Durchlauf, keine Daten vorab eingespielt.
Durchlaufen: Startseite; „Neuen Bogen erstellen" (Schritt 1 bis 6, Neuladen mitten im
Assistenten, „Bogen schließen", „Bogen übergeben…"); „Neue Einsatz-Sammlung…" mit drei Einheiten
über die Schnellerfassung (Schritt 1 bis 3), vier und acht Bögen aus `examples/thw/` über „Bögen
einlesen…"; Karte aufklappen, „Mehr…", „Entfernen" mit Quittung, „Rückgängig", Papierkorb und
„Zurückholen", „Abrücken", Tabelle, „Bogen scannen…" ohne Kamera, Lageblatt, Sammel-PDF, CSV
(Übersicht, alle Daten), Excel, „Übergabe vermerken…", „Einsatz als beendet markieren", „Alle
Daten löschen". Gemessen: Positionen und Größen der Bedienelemente, Zeitpunkte der Rückmeldungen,
Dateinamen der Downloads.
Nicht prüfbar: Kamera, echte Bildschirmtastatur, Handschuhe, Licht, WebKit, Safe-Area.

## Urteil aus Sicht der Rolle

Beide Aufgaben gehen ohne fremde Hilfe: „eigenen Bogen erfassen und übergeben" und „Einsatz-
Sammlung anlegen, Einheiten aufnehmen, abrücken, Meldung entfernen und zurückholen, Lageblatt,
Sammel-PDF, CSV, Excel, Übergabe vermerken, Einsatz beenden". Die Startseite sagt in den ersten
Zeilen, wofür die zwei Wege („Meinen Bogen ausfüllen" / „Bögen sammeln (Meldekopf)") da sind. Was
bleibt, sind Wortwahl, widersprüchliche Zahlen in Sonderfällen, eine Rückmeldung außerhalb des
Sichtfelds und stilles Verhalten kurz nach einem Tipp. Nichts davon verhindert eine Aufgabe.

## Bestätigte Behebungen aus Runde 18 (im echten Browser)

- Tipp auf „Meldung entfernen" 0,3 s nach dem Öffnen der Rückfrage wirkt (kein verschlucktes
  Tippen mehr); „Rückgängig" 0,25 s nach dem Entfernen wirkt sofort.
- Quittung nach „Entfernen" nennt die Folge vollständig: „Entfernt: Meldung Nr. 1 … (9 Personen).
  Nr. 1 bleibt frei. 7 Tage im Papierkorb unter der Liste." mit „Rückgängig" und „✕".
- Nummern bleiben nach „Entfernen" (Rückfrage: „Nr. 1 bleibt frei, die übrigen Nummern (2–3)
  bleiben"); nach „Zurückholen" ist Nr. 1 wieder da, Eintreffzeit und Stand bleiben erhalten
  (gemessen nach 2 Minuten Wartezeit).
- Papierkorb „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" übersteht das Neuladen;
  „Zurückholen" und „Endgültig löschen…" liegen 84 px (390) beziehungsweise 54 px (360) auseinander.
- Übergabe und Abschluss: Liste „Weitergabe-Datei, Lageblatt, CSV, Excel, Datensicherung, Übergabe"
  mit ○/✓, „Übergabe vermerken…" und „Einsatz als beendet markieren" mit „Wieder öffnen".
- Dateinamen jetzt `2026-10-28_0233_eeb-lageblatt_Hochwasser_Elbe.pdf` (Datum zuerst).
- Tabelle am Telefon ohne seitlichen Überlauf (390 und 360), Kernspalten, „Alle Spalten zeigen".
- Hauptaktion oben: „Bogen scannen…" beginnt bei y = 327 (390) beziehungsweise 361 (360), alle vier
  Aufnahmeknöpfe liegen bei 360 x 640 im ersten Bildschirm; „Bogen übergeben…" steht in der
  Übersicht bei y = 187.
- Scanner ohne Kamera nennt zuerst den Weg „Foto oder Bildschirmfoto … Knopf ‚QR aus Bild
  einlesen…‘"; Dialog passt in 360 x 640.
- Kennzahlenraster fluchtet (Spalten bei 390, 360 und 320 identisch), „Bogen schließen" statt
  „Verwerfen" auf der Startseite, Erklärsatz und „9 Sollplätze, noch ohne Namen" in der
  Entwurfskarte, „anwesend" statt „zählend" im Kopf der Liste, Aufnahme-Hinweis mit Uhrzeit und
  „mit * markiert". Kein seitlicher Überlauf, keine Seitenfehler im Verlauf.
- Aufgeklappte Karte in „Feld" bei 320 x 568: 586 px, mit „Mehr…" 808 px (R18-M7 mit diesem
  Datensatz nicht mehr 1139 px); Dialog „Stärke ändern" 536 px hoch (R18-S4 passt in 568 px).

## Befunde

### R19-N1 (P3) – Quittung von CSV, Excel und Sammel-PDF erscheint außerhalb des Sichtfelds

- **Neu oder alt (Verweis):** alt – Rest von R18-N10 (Quittungstexte der Ausgaben) und R18-H1/H2
  (Quittung); der Ort der Quittung wurde bisher nicht gemessen.
- **Ort:** Einsatz-Seite → „Weitergeben, Lageblatt, Export", 390 x 844.
- **Beobachtung:** Nach Tipp auf „Übersicht als CSV" oder „Excel-Liste" liegt die Zeile „✓ Gespeichert:
  2026-10-28_0234_eeb-einsatz_Hochwasser_Elbe.csv — im Download-Ordner bzw. über das Teilen-Menü
  abgelegt." bei Seitenposition y = 2093, der Knopf bei y = 2503 bis 2542; sie steht also rund
  410 bis 450 px über dem getippten Knopf und im Fenster nicht sichtbar. Ein Toast erscheint nicht
  (anders als beim Lageblatt, dessen Knopf direkt unter der Zeile liegt). Nahe am Knopf ändert
  sich nur „Übersicht als CSV: zuletzt erzeugt 28.10.2026, 02:34 · seitdem keine neuen Bögen".
- **Erwartung der Rolle:** Die Bestätigung erscheint dort, wo ich getippt habe.
- **Folge:** Der Helfer sieht nach dem Tipp keine Reaktion, tippt erneut oder sucht die Datei
  vergeblich; ob die Datei angekommen ist, erkennt er nur am Download-Symbol des Browsers.
- **Empfehlung:** Quittung als Leiste am unteren Rand (wie bei „Entfernt: …") oder unmittelbar unter
  der Knopfreihe.
- **Verifikation:** CSV tippen, Fenster nicht scrollen: Quittung sichtbar.

### R19-N2 (P3) – Zweiter Export kurz nach dem ersten wird verschluckt, nur „Einen Moment …"

- **Neu oder alt (Verweis):** alt – R18-N1 (Tipps in der ersten Sekunde werden still verschluckt),
  für Ausgaben weiter beobachtbar.
- **Ort:** Einsatz-Seite, „Lageblatt (A4 quer)" gefolgt von „Übersicht als CSV".
- **Beobachtung:** Tipp auf „Übersicht als CSV" 0,4 s und ebenso 1,5 s nach „Lageblatt" zeigt etwa
  eine Sekunde lang „Einen Moment …" und erzeugt dann keine Datei (in beiden Läufen nur das
  Lageblatt im Download-Ordner). Ab 2,5 s Abstand werden beide Dateien erzeugt. Eine Meldung, dass
  der Tipp nicht ausgeführt wurde, gibt es nicht.
- **Erwartung der Rolle:** Entweder die zweite Datei kommt, oder die App sagt, warum nicht.
- **Folge:** Wer Lageblatt und CSV nacheinander anstößt, hält die CSV für abgelegt; sie fehlt
  später bei der Übergabe. Abgemildert durch „○ Übersicht als CSV: noch nicht" in „Übergabe und
  Abschluss".
- **Empfehlung:** Den zweiten Tipp einreihen und ausführen oder „Lageblatt wird noch erzeugt — danach
  erneut tippen" stehen lassen, bis es möglich ist.
- **Verifikation:** Lageblatt tippen, nach 1 s CSV tippen: Datei oder lesbare Absage.

### R19-N3 (P3) – Schnellerfassung zählt anders als ihre Überschriften

- **Neu oder alt (Verweis):** neu (R18 erwähnt eine Erklärung „Schritt 2 und 5 entfallen hier"; sie
  ist in der laufenden App weder sichtbar noch als Tooltip auffindbar).
- **Ort:** „Einheit schnell erfassen (nur Stärke)…", Kopfzeile und Überschrift, 390 x 844 und 360 x 640.
- **Beobachtung:** Kopf: „Schritt 2 von 4: Personal", Überschrift darunter „3. Personal"; Kopf
  „Schritt 3 von 4: Fahrzeuge", Überschrift „4. Fahrzeuge". Hinweis in Schritt 1: „Stärke in Schritt 3",
  Hinweis in Schritt 2: „Auf dem Blatt stehen die Fahrzeuge oben, das Personal darunter: erst
  Schritt 4". Gemeint sind die Nummern des Vollbogens; der Kopf zählt nach der Schnellerfassung.
- **Erwartung der Rolle:** Eine Zählung. „Stärke in Schritt 3" suche ich bei „Schritt 3 von 4" und
  finde Fahrzeuge.
- **Folge:** Der Helfer sucht die Stärke im falschen Schritt oder fragt sich, wo Schritt 2 geblieben ist.
- **Empfehlung:** Im Schnellmodus die Überschriften wie den Kopf nummerieren („2. Personal") und die
  Hinweise auf die Namen der Schritte beziehen („Stärke im Schritt ‚Personal‘").
- **Verifikation:** Schnellerfassung bis Schritt 3 durchgehen, Kopf, Überschrift und Hinweise vergleichen.

### R19-N4 (P3) – Schnellerfassung: erstes Eingabefeld liegt bei y = 248

- **Neu oder alt (Verweis):** alt – R18-W7 (erstes Eingabefeld bei y = 248 statt unter 200).
- **Ort:** Schnellerfassung Schritt 1, 390 x 844 und 360 x 640.
- **Beobachtung:** Kopf 135 px, darüber „Angaben vom Zettel (optional)" (y = 169), dann Hinweiszeile,
  erst dann „Organisation" (y = 248). Im Vollassistenten liegt das erste Feld bei y = 171.
- **Folge:** Bei 360 x 640 stehen im ersten Bildschirm nur zwei Felder; „Ort der Einheit (Pflicht)"
  liegt erst unter dem Falz.
- **Empfehlung:** „Angaben vom Zettel" nach unten oder in die Fußleiste; „Ort der Einheit" nach oben,
  weil es das einzige Pflichtfeld ist.
- **Verifikation:** Schnellerfassung öffnen, Lage von „Ort der Einheit" messen.

### R19-N5 (P3) – Knöpfe und Linkreihen mit 4 bis 8 px Abstand

- **Neu oder alt (Verweis):** alt – R18-G5 (Fußzeilen-Linklisten und „Karten | Tabelle" mit 4 bis 6 px).
- **Ort:** Einsatz-Seite („Karten | Tabelle"), Fußzeile (Links der Schwesterseiten), aufgeklappte
  Karte mit „Mehr…".
- **Beobachtung:** „Karten" (x = 169 bis 242) und „Tabelle" (x = 248) liegen 6 px auseinander; die
  Zeilen „fmbauplaner.app" und „nachrichtenvordruck.app" 4 px übereinander; im Raster der
  aufgeklappten Karte stehen „Aufteilen…", „Stärke ändern…", „Als Übung kennzeichnen…",
  „Verschieben…" und das zerstörende „Entfernen" mit 8 px Abstand, in drei verschiedenen Höhen
  (50, 52 und 44 px).
- **Folge:** Mit Handschuh trifft der Helfer leicht den Nachbarn; bei „Entfernen" fängt die Rückfrage
  das auf, bei „Verschieben…" und „Stärke ändern…" öffnet sich ein falscher Dialog.
- **Empfehlung:** Mindestens 12 bis 16 px Abstand, gleiche Höhe im Raster, „Entfernen" abgesetzt in
  eigener Zeile.
- **Verifikation:** Abstände der genannten Elemente messen.

### R19-N6 (P3) – „8 Bögen aufgenommen", aber „0 Einheiten", „0 anwesend" und Gesamt 0

- **Neu oder alt (Verweis):** alt – Rest von R18-N3 (zwei Zahlen widersprechen sich scheinbar;
  Aufnahme-Hinweis bleibt stehen).
- **Ort:** Einsatz-Seite oben und Listenkopf nach „Bögen einlesen…" mit den Beispielbögen
  (Übungsmeldungen), 390 x 844 und 360 x 640.
- **Beobachtung:** Kennzahlen „0 Einheiten · 0 Führer · 0 Unterf. · 0 Mannsch. · 0 Gesamt", darunter
  „8 Bögen aufgenommen. Aufnahme 02:37: …" und „Einheiten (8 gemeldet · 0 anwesend)". Die Erklärung
  „alle 8 Übung, nicht gezählt" steht erst in einem Kasten weiter unten und in einer Zeile
  „8 Übungsmeldungen nicht gezählt — anzeigen". Der Aufnahme-Hinweis bleibt nach „Zur Kenntnis
  genommen" stehen (jetzt mit Uhrzeit versehen).
- **Erwartung der Rolle:** Acht Einheiten sind eingetroffen; eine Null als Gesamtstärke wirkt wie ein
  Fehler.
- **Folge:** Der Stab meldet „keine Kräfte am Platz", obwohl Übungsbögen sehr wohl eingegangen sind;
  umgekehrt hält ein Helfer die Kennzahlen für kaputt.
- **Empfehlung:** In den Kennzahlen „0 (8 Übung, nicht gezählt)" ausschreiben; „0 anwesend" im
  Listenkopf mit „8 Übung" ergänzen; den Aufnahme-Hinweis nach der Kenntnisnahme ausblenden.
- **Verifikation:** Acht Beispielbögen einlesen, Kennzahlen und Listenkopf ohne Scrollen lesen.

### R19-N7 (P3) – Fachwörter der Sammlung ohne Erklärung

- **Neu oder alt (Verweis):** alt – R18-N13 (Fachwörter der Sammlung ohne Erklärung); „zählend" im
  Listenkopf ist behoben, der Rest steht noch.
- **Ort:** Einsatz-Seite (Hinweisblöcke, Quittung, Tabelle), Tabellenfuß.
- **Beobachtung:** „Neu seit der letzten Kenntnisnahme (3)", „Zur Kenntnis genommen" (Quittung: „Zur
  Kenntnis genommen: 4 Einheiten"), „Zuletzt gemeldete oben zeigen", „3 ohne Auftrag · 3 ohne Zug",
  im Tabellenfuß „Summe (3 zählend)", „8 Übungsmeldungen nicht gezählt". Nur „Merkt nur ‚gesehen‘,
  sendet nichts an die Einheiten" erklärt eines davon.
- **Erwartung der Rolle:** Wörter, die ich am Funk benutze („gesehen", „anwesend", „Übung").
- **Folge:** Der Helfer fragt, ob „Zur Kenntnis genommen" etwas an die Einheiten sendet und ob
  „zählend" „anwesend" meint.
- **Empfehlung:** „Gesehen" beziehungsweise „Alle gesehen", „Summe (3 anwesend)", „ohne Zug" erklären.
- **Verifikation:** Sammlung ohne Anleitung lesen lassen und Begriffe deuten lassen.

### R19-N8 (P3) – Tabelle: abgekürzte Köpfe, leere Spalte „Auftrag"

- **Neu oder alt (Verweis):** alt – R18-N9 (Tabellenköpfe „Meldung vor", „Ges."); die Spalte
  „Meldung vor" ist entfallen, „Ges." und „Eingetr." stehen weiter.
- **Ort:** Einsatz-Seite → „Tabelle", 360 x 640 und 390 x 844.
- **Beobachtung:** Köpfe „EINHEIT · GES. · EINGETR. · AUFTRAG" (12 px); die Spalte „AUFTRAG" ist ohne
  Eintrag leer und nimmt ein Viertel der Breite, die Namen der Einheiten brechen dafür auf drei
  Zeilen um („THW Albstadt / Bergungsgruppe"). Die Langform („Stärke gesamt", „Eingetroffen",
  „Auftrag / Notiz der Führungsstelle") steht nur im ausgeblendeten Teil des Kopfs.
- **Folge:** „Eingetr." und „Ges." müssen erraten werden; leere Spalte kostet Platz.
- **Empfehlung:** „Gesamt" und „Eingetroffen" ausschreiben, leere Spalte erst bei Bedarf zeigen.
- **Verifikation:** Tabelle bei 360 px ohne Erklärung lesen lassen.

### R19-N9 (P3) – Kennzahlen: Summe über zwei Reihen verteilt

- **Neu oder alt (Verweis):** alt – Rest von R18-N4 (Kopfzahlen brechen unregelmäßig um); das Raster
  fluchtet jetzt, die Anordnung bleibt.
- **Ort:** Einsatz-Seite oben, 390, 360 und 320 px.
- **Beobachtung:** Fünf Kacheln in 3 + 2: „Einheiten, Führer, Unterf." und darunter „Mannsch., Gesamt".
  „Einheiten" steht in der Summenreihe, „Gesamt" (blau) steht links unter „Einheiten". Die Gleichung
  „Führer + Unterführer + Mannschaft = Gesamt" ist nicht zu lesen.
- **Folge:** Die Gesamtzahl wirkt wie eine weitere Einzelzahl neben den Einheiten.
- **Empfehlung:** Erste Reihe „Führer · Unterf. · Mannsch. = Gesamt", „Einheiten" abgesetzt davor.
- **Verifikation:** Sammlung mit Einheiten bei 360 px ansehen.

### R19-N10 (P3) – Startseite: dieselbe Erklärung dreimal, 7 300 px lang

- **Neu oder alt (Verweis):** neu.
- **Ort:** Startseite ohne Einsatz, 390 x 844.
- **Beobachtung:** Seitenhöhe 7 297 px. Unter „Bögen sammeln (Meldekopf)" (y = 722) und „So
  funktioniert's" (y = 1168) steht bei y = 1695 eine weitere Überschrift „Einsatz-Sammlung
  (Meldekopf)" mit dem Satz „Fremde Bögen zu einem Einsatz/einer Übung sammeln (scannen oder
  manuell) — mit Stärke-Summen …" ohne Knopf und ohne Inhalt, solange keine Sammlung besteht. Danach
  „Absender für übergebene Bögen" (y = 1825) vor den langen Erklärtexten.
- **Erwartung der Rolle:** Unter „Einsatz-Sammlung" erwarte ich eine Liste meiner Einsätze, nicht
  den dritten Erklärsatz.
- **Folge:** Der Helfer scrollt durch Wiederholungen, bevor er „Absender" oder den Fußbereich findet;
  die leere Überschrift wirkt wie ein nicht geladener Abschnitt.
- **Empfehlung:** Abschnitt „Einsatz-Sammlung" ausblenden, solange keine Sammlung besteht; „Absender"
  hinter die Aktionen verschieben.
- **Verifikation:** Startseite im Erstbesuch ansehen, Überschriften und Texte vergleichen.

### R19-N11 (P3) – Sammel-PDF und Übersicht-CSV heißen gleich, Vorsilbe „eeb"

- **Neu oder alt (Verweis):** alt – Rest von R18-N10 (Dateinamen); Datum steht jetzt vorn, die
  Namen bleiben schwer zu unterscheiden.
- **Ort:** Download-Ordner nach „Einsatz weitergeben / sichern", „Übersicht als CSV", „Alle Daten als
  CSV", Excel.
- **Beobachtung:** `2026-10-28_0233_eeb-einsatz_Hochwasser_Elbe.pdf` (Sammel-PDF),
  `…eeb-einsatz_Hochwasser_Elbe.csv` (Übersicht), `…eeb-einsatz-alle-daten_…csv`,
  `…eeb-einsatz-oldenburg_….xlsx`, `…eeb-lageblatt_….pdf`. Auf der Oberfläche heißt die erste
  „Weitergabe-Datei (Sammel-PDF)", im Dateinamen steht „einsatz". Die Vorsilbe „eeb" erklärt sich nur
  dem Entwickler.
- **Folge:** Im Download-Ordner des Stabs sind Sammel-PDF und Übersicht nur an der Endung zu
  unterscheiden; die Datei mit Personendaten („alle-daten") ist nicht von der Übersicht zu trennen,
  solange der Name abgeschnitten wird.
- **Empfehlung:** „Sammel-PDF", „Uebersicht", „Alle-Daten-mit-Namen", „Lageblatt", „Excel-Oldenburg"
  als Wörter am Anfang nach dem Datum, ohne „eeb".
- **Verifikation:** Alle fünf Dateien erzeugen, Namen in einer schmalen Dateiliste lesen.

### R19-N12 (P3) – Quittung nach „Entfernen": 118 px hoch, schmale Textspalte

- **Neu oder alt (Verweis):** alt – R18-A8 (Höhe der Quittung nach „Entfernen" nicht neu gemessen) und
  R18-N2 (Quittung schnitt die Folge ab; Text jetzt vollständig).
- **Ort:** Einsatz-Seite nach „Meldung entfernen", 390 x 844 und 360 x 640.
- **Beobachtung:** Die Leiste ist 118 px (390) beziehungsweise 119 px (360) hoch, das sind 14 % von
  844 und 19 % von 640 px. Der Text steht in einer 180 px breiten Spalte über fünf Zeilen, rechts
  daneben „Rückgängig" und „✕". Sie bleibt (gemessen 8 s) bis „✕" oder bis zum nächsten Eintrag
  stehen und deckt unten Inhalt ab (im Bild „Nur neue Bögen seit dem letzten Export").
- **Folge:** Bei 360 x 640 fehlt ein Fünftel des Bildschirms, solange die Quittung steht.
- **Empfehlung:** Text über die volle Breite, Knöpfe darunter (zwei bis drei Zeilen), oder nach
  einigen Sekunden verkleinern.
- **Verifikation:** Meldung entfernen, Höhe der Leiste bei 360 x 640 messen.

### R19-N13 (P3) – Übergabe vermerken verweist auf das Papierkästchen

- **Neu oder alt (Verweis):** neu. Annahme: Das Kästchen „übertragen [ ]" gibt es auf dem Papierbogen
  der Organisation; ein Helfer, der den Papierbogen nie in der Hand hatte, kennt es nicht.
- **Ort:** Einsatz-Seite → „Übergabe und Abschluss" → „Übergabe vermerken…", 390 x 844.
- **Beobachtung:** Dialogtext: „Wie das Kästchen „übertragen [ ]" auf dem Papier: Die Übergabe ist
  angekommen. Die Uhrzeit ist jetzt." Feld „An (Name oder Stelle)" ist leer zulässig; „Vermerken"
  setzt „✓ Übergabe vermerkt 28.10.2026, 02:35" ohne Empfänger. „Einsatz als beendet markieren"
  schreibt danach „noch offen: Weitergabe-Datei (Sammel-PDF), Lageblatt, Übersicht als CSV,
  Excel-Liste, Datensicherung", obwohl die Übergabe vermerkt ist.
- **Erwartung der Rolle:** Ein Satz, was „Übergabe" hier bedeutet (an wen, mit welcher Datei).
- **Folge:** Der Helfer vermerkt eine Übergabe, ohne dass eine Datei existiert; die Abschlusszeile
  widerspricht sich scheinbar (übergeben, aber alles „offen").
- **Empfehlung:** Einen eigenen Satz („Du hast die Lage mündlich oder auf Papier übergeben") und bei
  „noch offen" benennen, was für den Empfänger fehlt.
- **Verifikation:** Übergabe ohne Empfänger vermerken, Einsatz beenden, Abschlusszeile lesen.

### R19-N14 (P3) – Leerer Schritt 1 und Übersicht zeigen sofort Warnungen und „gespeichert"

- **Neu oder alt (Verweis):** alt – verwandt mit R18-N7 (Stärke aus Vorbelegung liest sich wie eine
  Meldung); neue Beobachtung im Assistenten und in der Übersicht.
- **Ort:** „Neuen Bogen erstellen" → Schritt 1 (leer) und Schritt 6 „Übersicht", 390 x 844.
- **Beobachtung:** Der leere Schritt 1 zeigt oben „✓ gespeichert · 02:30 Uhr · nur auf diesem Gerät"
  und unten, ohne dass etwas getippt wurde, zwei Warnungen („⚠ Zugehörigkeit: Der Ort der Einheit …
  fehlt", „⚠ Einheitstyp fehlt"). Nach nur Ort und Einheitstyp zeigt die Übersicht „Stärke 0 / 2 / 7 /
  9 (F / UF / M / Ges)", „⚠ 7 offene Punkte", „Geschlecht: 9 männl. / 0 weibl. / 0 div." und im
  Personal 9 Zeilen „(offen)": Alles stammt aus der StAN-Vorbelegung. Die Fahrzeugtabelle mit fünf
  Spalten verlangt „Zum Weiterlesen seitlich wischen →".
- **Erwartung der Rolle:** Warnungen erst nach einer Eingabe; vorbelegte Zahlen als „Vorschlag" erkennbar.
- **Folge:** Der Helfer glaubt, er habe schon Daten gespeichert und eine Stärke von 9 gemeldet, und
  könnte die Vorbelegung ungeprüft übergeben (dagegen stehen die sieben offenen Punkte und der Hinweis
  „Übergeben ist trotzdem möglich").
- **Empfehlung:** Statuszeile erst nach der ersten Eingabe; in der Übersicht „Stärke 9 (Vorschlag aus
  StAN, nicht erfasst)"; Fahrzeugtabelle ohne seitliches Wischen (Karten je Fahrzeug).
- **Verifikation:** Neuen Bogen öffnen und Schritt 1 ohne Eingabe ansehen; Ort und Typ eintragen,
  Übersicht lesen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „0 Einheiten, 0 Gesamt" neben „8 Bögen aufgenommen", wenn die Bögen
  als Übung gekennzeichnet sind (R19-N6), und „Stärke in Schritt 3" in der Schnellerfassung, die nur
  vier Schritte hat (R19-N3).
- **Größtes Einsatzrisiko:** Die Bestätigung eines CSV- oder Excel-Exports erscheint 400 px außerhalb
  des Sichtfelds und ein zweiter Export kurz nach dem ersten bleibt ohne Datei und ohne Absage
  (R19-N1, R19-N2); abgemildert durch die Übergabe-Liste („noch nicht").
- **Top-Priorität für die nächste Iteration:** Quittungen für Exporte dort zeigen, wo getippt wurde,
  und einen zu früh getippten Export einreihen oder ausdrücklich ablehnen (R19-N1, R19-N2).
