# Audit „Zerstörende Handlungen“, Runde 19 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `0ac0d7f` (`main`, Runde 18).

**Zählung: P0 0 · P1 0 · P2 1 · P3 10** (R19-D1 bis R19-D11).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, der
Abschnitt „Stand der Behebung“ in `runde-18/README.md` und der Bericht
`runde-18/zerstoerende-handlungen.md`. Es gibt keine „bekannten Grenzen“, die
ausgelassen werden: Was im Browser noch zu beobachten ist, steht hier.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale de-DE,
Viewports 360 × 640 und 390 × 844, Tipps über `touchscreen.tap`. Je Szenario ein frischer
Browserkontext. Zustand über die Bedienung: Einsatz-Sammlung „Hochwasser Weser“ anlegen,
die THW-Beispielbögen `012-sinsheim`, `013-ulm`, `014-weinsberg`, `015-ansbach` (Kopien
außerhalb des Repositorys, `uebung: false`, `stand` fünf Minuten vor der Geräteuhr) über
„Bögen einlesen…“ aufnehmen; für den Assistenten Bogen `013-ulm` über „Aus Datei laden…“.
Kein Kamera-Scan, keine Handschuhe, kein Zweitgerät, keine nativen Builds.

Durchgespielt: Meldung entfernen (Rückfrage, Tipp nach 100/300/1400 ms, Doppeltipp,
Quittung, Neuladen, Papierkorb, „Zurückholen“, „Endgültig löschen…“, erneutes Einlesen
derselben Datei, Zurückholen danach), Abrücken (Doppeltipp, Quittungsdauer, „Wieder
anwesend“), Kenntnisnahme und Rückgängig, Stärke ändern (11 → 88, Plausibilitätsfrage),
„Als Übung kennzeichnen…“, Aufteilen, Verschieben (mit und ohne zweiten Einsatz), Zug
zuordnen (Sammelzuordnung), Einsatzbeginn („Jetzt“ doppelt, „Beginn entfernen“, Feld
überschreiben und leeren), Übergabe vermerken, „Einsatz als beendet markieren“ mit
anschließend neu eingelesenem Bogen, Einsatz löschen, Papierkorb der Einsätze,
„Endgültig löschen…“ eines Einsatzes, Zurück-Geste bei offener Rückfrage, Einsatz
importieren (Sammel-PDF in vorhandene Sammlung, Rückfrage zu entfernter Meldung),
Sammel-PDF mit 6-facher CPU-Drosselung, „Alle Daten löschen“ (360 und 390 px),
„Geräteschlüssel neu erzeugen“ (ohne und mit vorhandenem Schlüssel), Datensicherung
erstellen und einspielen (Rückfrage), Assistent: „Bogen schließen“, „Neuen Bogen
erstellen“, „Aus Datei laden…“ und „Zuletzt geschlossenen Bogen zurückholen“ bei
vorhandenem Entwurf und vorhandenem geschlossenen Bogen, Person entfernen, Umschalten
auf „Nur Stärke“, Tabellenansicht am Telefon, Scanner ohne Kamera, leerer Einsatz.

## Urteil

Die Rückfragen sind in diesem Stand sehr gut: Sie nennen Name, Stärke und konkrete Folge,
„Abbrechen“ wirkt von Anfang an sofort, nur die zerstörende Bestätigung wird kurz gesperrt
(„Einen Moment …“), Doppeltipps lösen nur einmal aus, fast jede Handlung hat ein Rückgängig
und entfernte Meldungen und Einsätze liegen im Papierkorb. Alle Aufgaben ließen sich ohne
fremde Hilfe und ohne Datenverlust ohne Rückweg erledigen. Es bleibt ein Befund mit
falschem Status am Abschluss (P2) und zehn Randpunkte: zwei stille Überschreibungen, ein
Zurückholen mit missverständlicher Quittung, die Quittungsleiste (Höhe, Abstand zu „✕“),
Knopfabstände in einigen Rückfragen und das Verdrängen des einzigen „geschlossenen Bogens“.

## Behebungen aus Runde 18, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R18-D1 „Zurückholen“ und „Endgültig löschen…“ berühren sich | behoben. 54 px (360) bzw. 85 px (390) Abstand nebeneinander |
| R18-D2 Sperre schluckt auch „Abbrechen“ | behoben. „Abbrechen“ wirkt nach 150 und 300 ms sofort; die Bestätigung ist anfangs gesperrt (`aria-disabled`, „Einen Moment …“), Tipp nach 1,4 s wirkt |
| R18-D3 „Alle Daten löschen“ 16 px | behoben. „Endgültig löschen“ zu „Abbrechen“ 32 px |
| R18-D4 Knopfleiste verdeckt Folgetext | teilweise behoben. Der Satz „noch kein Export …“ ist jetzt lesbar, siehe aber R19-D7; „Geräteschlüssel neu erzeugen“ passt bei 360 × 640 ohne Scrollen |
| R18-D5 Quittung „Entfernt“ abgeschnitten | behoben. Text vollständig („Nr. 1 bleibt frei. 7 Tage im Papierkorb unter der Liste.“), siehe R19-D4 zur Höhe |
| R18-D6 „✕“ 8 px neben „Rückgängig“ | teilweise behoben (16 px), siehe R19-D5 |
| R18-D7 Sammel-PDF meldet zu früh | behoben. Bei 6-facher Drosselung „Einsatz wird erzeugt…“ mit „1 von 3 Bögen“, Knopf gesperrt; Erfolgsmeldung und Download kommen gleichzeitig (7 631 / 7 641 ms) |
| R18-D8 „Verschieben…“ ohne Verb | behoben. Knopf „In „Übung Nord“ verschieben“, 24 px zu „Abbrechen“ |
| Nummern bleiben nach „Entfernen“ | hält. Nr. 1 bleibt frei, Karten heißen danach Nr. 2 und 3; „Zurückholen“ stellt „Nr. 1“ wieder her |
| Papierkorb Meldungen | hält. Nach Neuladen „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“; „Endgültig löschen…“ fragt mit gesperrtem Knopf |
| Quittungsleiste | hält. Entfernen, Abrücken, Zug, Kenntnisnahme, Zurückholen quittiert; Rückgängig stellt „Neu seit der letzten Kenntnisnahme“ wieder her |
| Tipp-Sperren und Gegenhandlungen | halten. Doppeltipp auf „Abrücken“ ergibt eine Abrückung, auf „Meldung entfernen“ eine Entfernung |
| Tabelle am Telefon | hält. Kein seitliches Scrollen bei 360 und 390 px; Zeilenhöhe siehe R19-D11 |
| Hauptaktion oben | hält. „Bogen scannen…“ im leeren Einsatz bei y = 361 (360 × 640) bzw. 327 (390 × 844) |
| Scanner ohne Kamera | hält. Hinweis „Dieses Gerät meldet keine nutzbare Kamera“, „Kamera erneut versuchen“ und „Fertig“ |
| Zurück-Geste bei offener Rückfrage | hält. Schließt nur die Rückfrage |

## Befunde

### R19-D1 [P2] „Übergabe vermerkt“ und „Einsatz beendet“ bleiben gültig, wenn danach noch Bögen eintreffen

**Neu oder alt (Verweis):** neu (Abschluss-Speicher `eeb.abschluss.v1` stammt aus der Behebung von Runde 18). Gleichzeitig beobachtet in `arbeitsablauf.md` R19-W1 und `feldtauglichkeit.md` R19-H11.

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Einsatzansicht → „Übergabe und Abschluss“ → „Übergabe vermerken…“ / „Einsatz als beendet markieren“.

**Beobachtung:** „Übergabe vermerken…“ → „Vermerken“ (Feld „An“ leer) setzt „✓ Übergabe vermerkt
28.10.2026, 03:10“, obwohl in derselben Liste alle fünf Zeilen (Sammel-PDF, Lageblatt, CSV,
Excel, Datensicherung) „noch nicht“ zeigen. „Einsatz als beendet markieren“ setzt
„Einsatz beendet … — noch offen: …“ ohne Rückfrage (Rückweg „Wieder öffnen“ vorhanden).
Danach wurde ein vierter Bogen (`015-ansbach`) eingelesen: Der Einsatz bleibt „beendet“, der
Vermerk „✓ Übergabe vermerkt 03:10“ bleibt stehen, keine Meldung, keine Rückstufung. Die
Kopfzeile zeigt nur „Einsatz beendet 28.10.2026, 03:10“ über „4 Einheiten“.

**Folge:** Ein Helfer, der am Meldekopf den Stand sucht, liest „Übergabe vermerkt“ und „Einsatz
beendet“ und geht davon aus, dass alle vier Einheiten übergeben sind; die vierte wurde nie
übergeben. Im Einsatz ist das ein falscher Status, auf den sich die Ablösung verlässt.

**Empfehlung:** Treffen nach Vermerk oder Abschluss neue Bögen ein, den Vermerk sichtbar auf
„vor dem Eintreffen von n Einheiten vermerkt“ zurückstufen und „beendet“ mit Hinweis öffnen oder
beim Einlesen nachfragen. Einen Vermerk ohne Empfänger und ohne Export als solchen
kennzeichnen („ohne Export, ohne Empfänger“).

**Nachprüfung:** Übergabe vermerken, Bogen einlesen: Vermerk zeigt, dass er älter ist als die letzte Meldung.

### R19-D2 [P3] Einsatzbeginn überschreiben per Feld ohne Rückfrage und ohne Rückgängig

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Einsatzansicht → „Lagemonitor für den Fernseher“ → Feld „Einsatzbeginn“.

**Beobachtung:** „Jetzt“ auf einem vorhandenen Beginn fragt („der alte Beginn ist danach nicht mehr
gespeichert“), „Beginn entfernen“ fragt ebenfalls. Der Wert im Feld selbst wurde dagegen sofort
von 03:15 auf 20:00 des Vortags gesetzt: kein Dialog, keine Quittung, kein Rückgängig. Das Leeren
des Feldes fragt wieder.

**Folge:** Ein Daumentipp auf das Feld, das beim Bildlauf unter dem Finger liegt, ersetzt den
Beginn, den der Fernseher als Dauer anzeigt, still. Der alte Wert ist weg.

**Empfehlung:** Änderung eines vorhandenen Beginns wie „Jetzt“ behandeln (Rückfrage oder
Quittung mit Rückgängig „Beginn war 03:15“).

**Nachprüfung:** Beginn setzen, Feld ändern: Quittung mit Rückgängig oder Rückfrage.

### R19-D3 [P3] „Zurückholen“ einer Meldung, die inzwischen neu eingelesen wurde, quittiert „zurückgeholt“, ohne dass „Nr. 1“ wiederkommt

**Neu oder alt (Verweis):** neu (Papierkorb für Meldungen stammt aus der Behebung von R17-D6).

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Einsatzansicht → Meldung entfernen → dieselbe Datei erneut über „Bögen einlesen…“ → „Zuletzt entfernte Meldungen“ → „Zurückholen“.

**Beobachtung:** Das erneute Einlesen der einzelnen Datei nimmt die Meldung ohne Rückfrage als „Nr. 4“
auf (die Rückfrage „Hier entfernte Meldungen in der Datei“ gibt es nur beim Einsatz-Import aus
einer Sammel-PDF); der Eintrag im Papierkorb bleibt. „Zurückholen“ meldet „Meldung … zurückgeholt.“,
der Papierkorbeintrag verschwindet, die Liste bleibt bei „3 gemeldet“ und zeigt weiter Nr. 2, 3, 4.

**Folge:** Wer „Nr. 1“ vom Funk her kennt, sucht sie vergeblich und hält die Quittung für falsch
oder die Meldung für verloren.

**Empfehlung:** Quittung nennen: „… ist schon als Nr. 4 vorhanden — Papierkorbeintrag entfernt“.
Beim Einlesen einer Datei, deren Meldung im Papierkorb liegt, einen Hinweis zeigen.

**Nachprüfung:** Entfernen, Datei erneut einlesen, Zurückholen: Quittung nennt Nr. 4.

### R19-D4 [P3] Quittungsleiste nach „Entfernen“ ist 136 px hoch und bleibt über 20 s

**Neu oder alt (Verweis):** alt, R18-A8 („Höhe der Quittung nach Entfernen nicht neu gemessen“); verwandt R18-D5. Gleichzeitig in R19-H6, R19-N12, R19-W12.

**Kennzeichnung:** gemessen (360 × 640: 136 px = 21 % des Bildes bei „Entfernt“, 103 px = 16 % bei Abrücken, Zug, Kenntnisnahme; 390 × 844: 118 px).

**Ort:** untere feste Quittungsleiste.

**Beobachtung:** Der Text ist vollständig, die Leiste aber so hoch, dass sie bei 360 × 640 die
Papierkorb-Zeile und die Knöpfe am Listenende überdeckt. Nach „Abrücken“ stand sie zwischen 15 und
30 s; sie nimmt für „Rückgängig“ den Platz, den die Einsatzbedienung braucht.

**Folge:** Das Rückgängig ist gut erreichbar, aber der Helfer muss die Leiste mit „✕“ wegräumen,
um weiterzuarbeiten, und verliert damit den Rückweg (siehe R19-D5).

**Empfehlung:** Text auf zwei Zeilen kürzen, Leiste unter 80 px halten.

**Nachprüfung:** Entfernen bei 360 × 640: Leiste höchstens 80 px.

### R19-D5 [P3] „✕“ der Quittungsleiste liegt 16 px neben „Rückgängig“ und nimmt es mit

**Neu oder alt (Verweis):** alt, R18-D6 (dort 8 px, jetzt 16 px, Empfehlung war mindestens 24 px).

**Kennzeichnung:** gemessen (360 × 640: „Rückgängig“ x 181–281, „✕“ x 297–341).

**Ort:** Quittungsleiste nach Abrücken, Entfernen, Zug setzen, Kenntnisnahme.

**Beobachtung:** Beide Knöpfe 44 px hoch, 16 px Abstand. „✕“ schließt die Leiste samt Rückgängig.

**Folge:** Ein Tipp mit dem Handschuh knapp daneben nimmt die schnellste Gegenhandlung weg.

**Empfehlung:** „✕“ mindestens 24 px absetzen oder entfallen lassen (die Leiste verschwindet ohnehin).

**Nachprüfung:** Abrücken → Leiste: Abstand zwischen „Rückgängig“ und „✕“ mindestens 24 px.

### R19-D6 [P3] Bestätigen und „Abbrechen“ liegen in vier Rückfragen 8 bis 12 px auseinander

**Neu oder alt (Verweis):** alt, Muster von R17-D7 und R18-D3 (dort nur „Alle Daten löschen“, jetzt 32 px).

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** „Stärke ändern…“ („Stärke übernehmen“ y 504–548, „Abbrechen“ y 556–600: 8 px), „Aufteilen…“
(„Aufteilen“ x 46–130 neben „Abbrechen“ x 138–222: 8 px), „Übergabe vermerken…“ („Vermerken“ y 373–417,
„Abbrechen“ y 425–469: 8 px), „Sicherung einspielen…“ („Einspielen und ersetzen“ y 877–922, „Abbrechen“ y 934–979: 12 px).

**Beobachtung:** Die übrigen Rückfragen (Entfernen, Einsatz löschen, Verschieben, Als Übung, Neu anfangen,
Geräteschlüssel) halten 24 bis 41 px.

**Folge:** Beim „Stärke ändern…“ greift nach der Plausibilitätsfrage (11 → 88) eine zweite Rückfrage,
beim Aufteilen ebenfalls; die übrigen bleiben mit Rückgängig oder Haken geschützt, die Gefahr ist gering.
Der Abstand ist aber der einzige Schutz gegen Fehltipp, wenn Gegenhandlung oder Haken fehlen
(„Vermerken“ hat keine Rückfrage).

**Empfehlung:** Einheitlich mindestens 24 px Abstand zwischen Bestätigung und „Abbrechen“.

**Nachprüfung:** Vier Rückfragen bei 360 × 640 öffnen: Abstand mindestens 24 px.

### R19-D7 [P3] „Alle Daten löschen“ bei 360 × 640: „Vorher Sicherung erstellen…“ liegt im Ausgangszustand unter der festen Leiste

**Neu oder alt (Verweis):** alt, Rest von R18-D4.

**Kennzeichnung:** gemessen (360 × 640, Screenshot geprüft).

**Ort:** Startseite → „Alle Daten löschen“.

**Beobachtung:** Der Knopf „Vorher Sicherung erstellen…“ (y 366–411) wird von der festen Leiste
(Haken, „Endgültig löschen“, „Abbrechen“, y 398–607) überdeckt: sichtbar sind nur eine Kante und ein
Schatten, keine Beschriftung. Erst nach dem Haken rückt der Haken um 45 px nach unten und der Knopf
wird lesbar. Unter „Abbrechen“ scheint zudem Listentext („alle Einstellungen (Darstellung …“)
durch. Bei 390 × 844 ist der Knopf sichtbar.

**Folge:** Gerade die sichere Alternative („erst sichern“) ist bei dem Gerät mit der kleinsten
Anzeige nicht zu sehen, während die zerstörende Bestätigung vollständig sichtbar ist.

**Empfehlung:** „Vorher Sicherung erstellen…“ in die feste Leiste oder direkt über den Haken stellen
und den Listentext nicht unter „Abbrechen“ durchscheinen lassen.

**Nachprüfung:** „Alle Daten löschen“ bei 360 × 640 öffnen, nicht scrollen: „Vorher Sicherung erstellen…“ ist lesbar.

### R19-D8 [P3] „Zuletzt geschlossener Bogen“ fasst nur einen Bogen: der dritte Bogen verdrängt den ersten endgültig

**Neu oder alt (Verweis):** neu (die Rückfragen dazu wurden in Runde 18 ergänzt, die Ursache blieb).

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Startseite → „Neuen Bogen erstellen“ / „Aus Datei laden…“ bei vorhandenem Entwurf und vorhandenem geschlossenen Bogen.

**Beobachtung:** Ablauf: Bogen A schließen (liegt als „Zuletzt geschlossener Bogen“), Bogen B anfangen,
dann „Neuen Bogen erstellen“. Die Rückfrage nennt: „Der dort bisher liegende Bogen „THW Ulm
Bergungsgruppe“ (… 8 Personen …) wird dabei endgültig gelöscht.“ Dieselbe Warnung steht bei
„Bogen aus Datei öffnen?“. „Zuletzt geschlossenen Bogen zurückholen“ fragt ebenfalls und tauscht
Entwurf und Ablage.

**Folge:** Personendaten und Arbeit eines Bogens gehen verloren, wenn der Helfer die lange
Warnung überfliegt. Sie wird mit der Bestätigung bewusst in Kauf genommen, ein Rückweg existiert nicht.

**Empfehlung:** Zwei Ablageplätze oder eine Exportmöglichkeit („Vorher als Datei sichern“) in dieser
Rückfrage; den verlorenen Bogen im ersten Satz nennen.

**Nachprüfung:** Drei Bögen nacheinander anfangen: der erste ist noch erreichbar oder wurde vorher gesichert.

### R19-D9 [P3] „Wieder anwesend“ ersetzt nach 15 bis 20 s „✓ Abgerückt“ an derselben Stelle und entfernt den Abrückvermerk ohne Rückfrage

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Karte → „Abrücken“.

**Beobachtung:** Nach „Abrücken“ steht an der Stelle des Knopfes (x 46–130, y 218–268) zuerst das
gesperrte „✓ Abgerückt“, nach etwa 15 bis 20 s an derselben Stelle „Wieder anwesend“. Ein Tipp
nimmt den Abrückvermerk ohne Rückfrage zurück (die Zeile „abgerückt 28.10.2026 …“ verschwindet);
die Quittung „Wieder anwesend 03:19 …“ bietet Rückgängig, die Leiste steht weniger als 30 s.

**Folge:** Ein Helfer, der nach dem ersten Tipp „noch einmal sicherheitshalber“ tippt, löscht den
Abrückvermerk der Einheit (die Lage zählt sie wieder als anwesend). Der Rückweg besteht nur über die
Quittung.

**Empfehlung:** „Wieder anwesend“ räumlich oder durch Rückfrage vom „Abrücken“ trennen.

**Nachprüfung:** Abrücken, 20 s warten, Tipp an dieselbe Stelle: Rückfrage oder anderer Ort.

### R19-D10 [P3] „Entfernen“ liegt im „Mehr…“-Raster 8 px neben „Stärke ändern…“ und „Verschieben…“

**Neu oder alt (Verweis):** neu (gleichzeitig `arbeitsablauf.md` R19-W8).

**Kennzeichnung:** gemessen (360 × 640 und 390 × 844: „Verschieben…“ y 400–452, „Entfernen“ x 138–222, y 400–444; 8 px Rand).

**Ort:** Karte → „Mehr…“.

**Beobachtung:** „Entfernen“ ist rot umrandet und von „Abrücken“ durch eine Trennlinie getrennt, steht
aber in der Raster-Reihe direkt neben „Verschieben…“ und unter „Stärke ändern…“ mit 8 px Abstand.

**Folge:** Fehltipp mit Handschuh möglich; die Rückfrage („Meldung entfernen?“, gesperrter Knopf)
und der Papierkorb begrenzen den Schaden auf einen Zusatztipp.

**Empfehlung:** „Entfernen“ in eine eigene Zeile am Ende, mindestens 24 px abgesetzt.

**Nachprüfung:** „Mehr…“ öffnen: kein anderer Knopf näher als 24 px an „Entfernen“.

### R19-D11 [P3] Tabelle am Telefon: Zeilenknopf bei kurzem Einheitsnamen nur 30 px hoch

**Neu oder alt (Verweis):** neu (Nebenbeobachtung bei der Prüfung „Tabelle am Telefon“).

**Kennzeichnung:** gemessen (360 × 640: 98 × 45, 98 × 30, 98 × 45 px; 390 × 844: 108 × 45, 108 × 30, 108 × 45 px).

**Ort:** Einheitenliste → „Tabelle“, Spalte „Einheit“.

**Beobachtung:** Der Namensknopf „THW Ulm Bergungsgruppe“ ist 30 px hoch, die Knöpfe der zweizeiligen Namen 45 px.
Die Tabelle läuft nicht seitlich über (360 von 360).

**Folge:** Der Knopf klappt die Karte auf (keine zerstörende Wirkung); ein Tipp knapp daneben trifft die Nachbarzeile.

**Empfehlung:** Mindesthöhe 44 px für alle Zeilen.

**Nachprüfung:** Tabelle bei 360 px: jede Zeile mindestens 44 px hoch.

## Geprüft ohne Befund

- Rückfragen „Meldung entfernen“, „Meldung endgültig löschen“, „Einsatz löschen“, „Einsatz endgültig löschen“
  (nennt „einzige Kopie“ bei fehlendem Export), „Als Übung kennzeichnen“, „Bogen schließen“, „Neuen Bogen
  anfangen“, „Bogen aus Datei öffnen“, „Geschlossenen Bogen zurückholen“, „Person entfernen“ (nennt den Wechsel
  der Ansprechperson), „Nur die Stärke melden?“ (nennt 8 Personen), „Sicherung einspielen?“ (listet, was
  verloren geht), Einsatz-Import (Zusammenführen oder getrennt, „Hier entfernte Meldungen in der Datei“),
  „Einsatzbeginn überschreiben/entfernen“, „Geräteschlüssel neu erzeugen“: Gegenstand und Folge genannt.
- „Stärke ändern…“ 11 → 88: Plausibilitätsfrage „mehr als das Dreifache“ mit „Zahlen korrigieren“.
- Zurück-Geste: schließt offene Rückfragen.
- Einsatz löschen: Quittung mit Rückgängig, Papierkorb „30 Tage rückholbar“, Meldungen im Papierkorb bleiben erhalten.

## Nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, Handschuhe, ein zweites Gerät mit echter Weitergabe-Datei, das Fenster des
Lagemonitors, die nativen Builds, der automatische Ablauf der 7-Tage- und 30-Tage-Fristen, ob „Rückgängig“ bei
„Wieder anwesend“ eine zuvor von Hand geänderte Abrückzeit wiederherstellt.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „✓ Übergabe vermerkt“ und „Einsatz beendet“ lesen sich wie ein geprüfter Stand, bleiben aber nach neuen Meldungen und ohne Export stehen (R19-D1).
- **Größtes Einsatzrisiko:** Falscher Abschlussstatus, auf den sich die Ablösung verlässt (R19-D1); bei den Daten selbst bleibt ein Rückweg erhalten.
- **Top-Priorität für die nächste Iteration:** Übergabevermerk und „beendet“ an neue Meldungen koppeln (R19-D1), danach die Abstände in Quittungsleiste und Rückfragen (R19-D5, R19-D6).
