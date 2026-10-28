# Audit „Zerstörende Handlungen“, Runde 20 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `7c06324` (`main`, Runde 19).

**Zählung: P0 0 · P1 1 · P2 0 · P3 3 · Hinweise 7** (R20-D1 bis R20-D4; Hinweise H1 bis H7).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, der
Abschnitt „Stand der Behebung“ in `runde-19/README.md` und der Bericht
`runde-19/zerstoerende-handlungen.md`. Es gibt keine „bekannten Grenzen“, die
ausgelassen werden: Was im Browser noch zu beobachten ist, steht hier.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale de-DE,
Viewports 360 × 640 und 390 × 844, Tipps über `touchscreen.tap`. Je Szenario ein frischer
Browserkontext. Zustand über die Bedienung: Einsatz-Sammlung „Hochwasser Weser“ anlegen,
die THW-Beispielbögen 012 bis 016 aus `examples/thw` als Kopien außerhalb des Repositorys
(`uebung: false`, `stand` fünf Minuten vor der Geräteuhr) über „Bögen einlesen…“ aufnehmen.
Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt (wie in Runde 19). Kein
Kamera-Scan, keine Handschuhe, kein Zweitgerät, keine nativen Builds.

Durchgespielt (360 und, wo vermerkt, 390): Meldung entfernen (Rückfrage, Abbrechen nach
150 ms, Bestätigung gesperrt und freigegeben, Doppeltipp, Quittung, Neuladen, Papierkorb,
erneutes Einlesen derselben Datei, „Zurückholen“), Abrücken und „Wieder anwesend“,
Stärke ändern, Aufteilen, Als Übung kennzeichnen, Verschieben (ohne zweiten Einsatz),
Einsatzbeginn („Jetzt“, Feld überschreiben), Übergabe vermerken, „Einsatz als beendet
markieren“ mit anschließend eingelesenem Bogen, Einsatz löschen, Papierkorb der Einsätze,
„Wiederherstellen“, „Endgültig löschen…“, Sammel-PDF erzeugen und mit „Einsatz
importieren…“ in vorhandene Sammlung einlesen (mit und ohne neue Einheiten), „Alle Daten
löschen“ (bis zur Bestätigung „Neu starten“), „Geräteschlüssel neu erzeugen“,
Datensicherung erstellen und einspielen (Rückfrage), Bogen aus Datei laden, „Bogen
schließen“, „Neuen Bogen erstellen“ bei Entwurf und geschlossenem Bogen, „Zuletzt
geschlossenen Bogen zurückholen“, Person entfernen, Umschalten auf „Nur Stärke“,
Schnellerfassung (leerer Ort, Doppeltipp auf „In Einsatz übernehmen“, Stärke 0), Fußleiste
aller sechs Schritte, Tabelle am Telefon. Dazu jeweils mit vollem Speicher: Meldung
entfernen, Einsatz löschen, Einsatz beenden, Übergabe vermerken, Abrücken, Stärke ändern,
Als Übung kennzeichnen, Einsatzbeginn „Jetzt“, Wiederherstellen aus dem Papierkorb,
„In Einsatz übernehmen“, Bogen schließen, Neuen Bogen anfangen, Geschlossenen Bogen
zurückholen.

## Urteil

Der Stand ist deutlich besser als in Runde 19. Rückfragen nennen Gegenstand und Folge,
„Abbrechen“ wirkt sofort, die Bestätigung wird kurz gesperrt („Einen Moment …“),
Doppeltipps lösen nur einmal aus, die meisten Handlungen haben ein Rückgängig und
Einsätze wie Meldungen einen Papierkorb. Alle Aufgaben ließen sich ohne fremde Hilfe
erledigen. Der in Runde 19 gemeldete P2 (falscher Abschlussstatus) ist behoben, die
Speicherfälle der Einsatzansicht ebenfalls. Es bleibt ein echter Datenverlust im Randfall
„voller Speicher“: die Ablage „Zuletzt geschlossener Bogen“ (R20-D1), dazu drei kleine
Befunde.

## Behebungen aus Runde 19, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R19-O1 Meldung entfernen bei vollem Speicher | hält. Dialog „Papierkorb voll … Endgültig entfernen?“ mit „Rückgängig gilt dann nur bis zum Neuladen“; ohne Bestätigung bleibt die Meldung (auch nach Neuladen) |
| R19-O2 Einsatz beenden, Übergabe vermerken bei vollem Speicher | hält. „Einsatz nicht beendet“ / „Übergabe nicht vermerkt … Nichts hat sich geändert“, Zustand nach Neuladen unverändert |
| R19-O3 Einsatz löschen bei vollem Speicher | hält. „Nicht gelöscht“; der Einsatz steht nach Neuladen weiter da |
| R19-O4, O5 Abrücken, Stärke ändern, Als Übung, Beginn, Übernehmen bei vollem Speicher | halten. Jeweils Dialog oder Hinweis im Text, nichts wird still verworfen; „In Einsatz übernehmen“ nennt Einheit und Stärke zum Notieren auf dem Meldeblock |
| R19-D1/W1 Übergabe und „beendet“ bleiben gültig | behoben. Nach dem vierten Bogen: „⚠ Übergabe vermerkt … Nicht mehr aktuell: seitdem 1 neue Meldung“, Kopfzeile ebenso, „Neu vermerken…“ |
| R19-D3 Zurückholen nach erneutem Einlesen | behoben. Papierkorb nennt „Schon wieder eingelesen als Nr. 4 — ‚Zurückholen‘ bringt sie nicht unter Nr. 1 zurück“, kein irreführender Knopf mehr |
| R19-D4, D5 Quittungsleiste | behoben. Kurzfassung, 60 px, 2 Zeilen (360 und 390), „Details“, 24 px zwischen „Rückgängig“ und „✕“, steht rund 8,5 s |
| R19-D6 Abstand Bestätigen/Abbrechen | behoben. 24 px in Entfernen, Stärke ändern, Als Übung, Übergabe vermerken, Aufteilen, Sicherung einspielen, Person entfernen |
| R19-D7 „Alle Daten löschen“ bei 360 × 640 | behoben. „Vorher Sicherung erstellen…“ lesbar ohne Scrollen, Haken, Bestätigung gesperrt bis zum Haken, danach „Alle lokalen Daten gelöscht … Neu starten“ |
| R19-D8 Verdrängen des geschlossenen Bogens | gemildert. Rückfrage nennt den Bogen und bietet „den alten Bogen vorher als Datei sichern“ (liefert die Datei des zu löschenden Bogens), siehe aber R20-D1 |
| R19-D9 „Wieder anwesend“ an der Stelle von „Abgerückt“ | behoben. Rückfrage „Wieder anwesend?“ mit „Abgerückt lassen“ |
| R19-D10 „Entfernen“ neben „Verschieben…“ | behoben. Eigene Zeile, 24 px Abstand |
| R19-D11 Tabellenzeile 30 px | behoben. Alle Namensknöpfe 44 bis 45 px, kein seitliches Scrollen (360 und 390) |
| Tipp-Sperre | hält. Nach Tipp auf die gesperrte Bestätigung „Einen Moment …“, nach 1,4 s wirkt sie; „Abbrechen“ wirkt von Anfang an |
| Fußleiste | hält. In allen sechs Schritten kein Überlauf (360: „In Einsatz übernehmen“ 167 px, „Weiter →“ 93 px, 44 px hoch) |
| Schnellerfassung | hält. „Ort der Einheit (Pflicht)“ steht als erstes Feld, hat den Fokus; leerer Ort ergibt „Ort der Einheit fehlt“, Doppeltipp auf „In Einsatz übernehmen“ ergibt einen Dialog |
| Startseite | hält. „Neue Einsatz-Sammlung…“ bei y = 362 (360 × 640) ohne Entwurf, siehe aber Hinweis H3 |

## Befunde

### R20-D1 [P1] Bei vollem Speicher geht der Bogen verloren, obwohl die Rückfrage „bleibt erreichbar“ verspricht

**Neu oder alt (Verweis):** neu. Gleiche Ursache wie R19-O1 bis R19-O4 (Schreibvorgang scheitert, die Oberfläche geht trotzdem weiter), aber an einer Stelle, die in Runde 19 nicht erfasst wurde: die Ablage „Zuletzt geschlossener Bogen“ (R19-D8 betraf nur den Inhalt der Rückfrage).

**Typ:** Daten/Verlust. **Kennzeichnung:** gemessen (360 × 640 und 390 × 844, Speicherschlüssel vor und nach der Handlung geprüft).

**Ort:** Assistent → Übersicht → „Bogen schließen“; Startseite → „Neuen Bogen erstellen“; Startseite → „Zuletzt geschlossenen Bogen zurückholen“. „Aus Datei laden…“ nutzt dieselbe Ablage und wurde nicht einzeln geprüft.

**Beobachtung:** Bei bis zum Quota-Fehler gefülltem Speicher (oben auf der Startseite steht dann „Gerätespeicher ist voll: 100 %“):
1. „Bogen schließen?“ sagt „Der Bogen wird geschlossen, nicht gelöscht. Der Stand bleibt auf der Startseite unter ‚Zuletzt geschlossenen Bogen zurückholen‘ erreichbar.“ Nach „Schließen, zur Startseite“ ist `eeb.entwurf.v1` (8 Personen, 2 562 Zeichen) entfernt, ein Eintrag für den geschlossenen Bogen wurde nicht geschrieben. Die Startseite zeigt weder einen geschlossenen Bogen noch einen Entwurf, auch nicht nach Neuladen. Keine Meldung, kein Dialog.
2. „Neuen Bogen anfangen?“ („Der Stand bleibt … erreichbar“) → „Neu anfangen“: alter Entwurf weg, kein geschlossener Bogen, keine Meldung.
3. „Geschlossenen Bogen zurückholen?“ bei vorhandenem Entwurf („Der Stand bleibt … erreichbar“) → „Zurückholen“: der geschlossene Bogen ist wieder Entwurf, der bisherige Entwurf (5 055 Zeichen) ist weg, `eeb.entwurf.ersetzt.v1` ebenfalls, keine Meldung.

Im Gegensatz dazu melden Meldung entfernen, Einsatz löschen, beenden, Übergabe und Abrücken den Speicherfehler jetzt richtig (siehe Tabelle).

**Folge:** Der Helfer hat zuvor ausdrücklich gelesen, der Bogen sei nicht gelöscht. Er schließt oder ersetzt seinen Bogen und verliert Personal, Fahrzeuge und Bedarf der Einheit ohne jeden Hinweis; die Rückfrage „Neu anfangen — den alten Bogen vorher als Datei sichern“ bietet die Sicherung nur in der Variante mit zwei vorhandenen Bögen an. Im Einsatz ist das der Verlust der eigenen Meldung genau dann, wenn das Gerät ohnehin an der Grenze ist.

**Empfehlung:** Den Bogen erst aus dem Entwurf nehmen, wenn die Ablage geschrieben ist. Scheitert das Schreiben, dieselbe Meldung wie bei den Einsatz-Handlungen zeigen („Nicht geschlossen — der Speicher ist voll. Nichts hat sich geändert“) und den Bogen als Entwurf stehen lassen. Zusätzlich bei vollem Speicher die Rückfragen ehrlich formulieren („kann nicht abgelegt werden“) und „Bogen als Datei sichern“ anbieten.

**Nachprüfung:** `localStorage` bis zum Quota-Fehler füllen, geladenen Bogen schließen: Meldung „Nicht geschlossen“, Entwurf bleibt, nach Neuladen weiter vorhanden. Dasselbe für „Neuen Bogen erstellen“ und „Zurückholen“.

### R20-D2 [P3] Einsatzbeginn überschreiben per Feld ohne Rückfrage und ohne Rückgängig

**Neu oder alt (Verweis):** alt, R19-D2 (nicht behoben).

**Typ:** Daten/Verlust. **Kennzeichnung:** gemessen (360 × 640).

**Ort:** Einsatzansicht → „Lagemonitor für den Fernseher“ → Feld „Einsatzbeginn“.

**Beobachtung:** „Jetzt“ auf leerem Feld setzt den Beginn (07:07). Im Feld selbst auf „27.10.2026, 20:00“ geändert: Wert sofort übernommen, kein Dialog, keine Quittung, kein Rückgängig. „Jetzt“ auf vorhandenem Beginn und „Beginn entfernen“ fragen dagegen.

**Folge:** Ein versehentlicher Tipp ins Feld beim Bildlauf ersetzt den Beginn, den der Fernseher als Dauer zeigt; der alte Wert ist weg.

**Empfehlung:** Änderung eines vorhandenen Beginns wie „Jetzt“ behandeln (Rückfrage oder Quittung „Beginn war 07:07“ mit Rückgängig).

**Nachprüfung:** Beginn setzen, Feld ändern: Quittung mit Rückgängig oder Rückfrage.

### R20-D3 [P3] „In die vorhandene Sammlung übernehmen“ ändert Nummern ohne Rückgängig, der Hinweis steht nur im Seitentext

**Neu oder alt (Verweis):** neu.

**Typ:** Daten/Verlust. **Kennzeichnung:** gemessen (360 × 640).

**Ort:** Startseite → „Einsatz importieren…“ (Sammel-PDF) → „Es gibt schon eine Sammlung …“ → „In die vorhandene Sammlung übernehmen“.

**Beobachtung:** Die Rückfrage nennt „Laufende Nummern können sich dabei ändern.“ Nach dem Zusammenführen (vorhandene Sammlung: Ansbach = Nr. 1, Bamberg = Nr. 2; Datei: Sinsheim, Ulm, Weinsberg) heißt Nr. 1 jetzt Sinsheim, Nr. 2 Ulm, Ansbach hat Nr. 4, Bamberg Nr. 5. Der Hinweis („2 Nummern geändert — am Funk genannte Nummern und das gedruckte Lageblatt gelten nicht mehr …“) steht als 315 px hoher Absatz im Seitentext; es gibt keine Quittung und kein Rückgängig, nach Neuladen ist der Hinweis weg. Der Knopf „In die vorhandene Sammlung übernehmen“ ist als vorderster der drei Knöpfe hervorgehoben; „Als eigene Sammlung“ liegt 12 px darunter.

**Folge:** Wer am Funk „Nr. 1“ als Ansbach geführt hat, meldet danach Sinsheim. Der Helfer kann den Schritt nicht zurücknehmen und nicht mehr nachlesen, welche Nummern sich geändert haben.

**Empfehlung:** Die Rückfrage nennt vorab, welche vorhandenen Nummern sich ändern würden; nach dem Zusammenführen Quittung mit Rückgängig und der Hinweis dauerhaft in der Einsatzansicht (bis zum nächsten Lageblatt).

**Nachprüfung:** Zwei Sammlungen gleichen Namens mit verschiedenen Einheiten zusammenführen: Rückfrage nennt die Nummernwechsel, danach Rückgängig möglich.

### R20-D4 [P3] „Papierkorb Einsätze (n)“ ist nur 33 px hoch und einziger Weg zurück zum gelöschten Einsatz

**Neu oder alt (Verweis):** neu.

**Typ:** Bedienung. **Kennzeichnung:** gemessen (360 × 640: 166 × 33 px bei y = 1 446).

**Ort:** Startseite → Bereich „Einsatz-Sammlung (Meldekopf)“ → „Papierkorb Einsätze (1)“.

**Beobachtung:** Der Umschalter (und nach dem Aufklappen „Papierkorb Einsätze ausblenden“) ist als Textverweis gestaltet und 33 px hoch. „Wiederherstellen“ (44 px) und „Endgültig löschen…“ (44 px, rot, 63 px Abstand) darunter sind in Ordnung.

**Folge:** Wer nach einem versehentlichen „Einsatz löschen…“ mit Handschuh die Wiederherstellung sucht, trifft den kleinen Verweis schlecht; der Rückweg ist sonst nur die kurzlebige Quittung.

**Empfehlung:** Mindesthöhe 44 px wie bei den anderen Knöpfen.

**Nachprüfung:** Einsatz löschen, Startseite: „Papierkorb Einsätze“ mindestens 44 px hoch.

## Hinweise (ohne Priorität)

Keine Beeinträchtigung der Aufgabe belegt; zur Entscheidung durch das Projekt.

- **H1 [Layout]** Quittung nach Sammel-PDF („✓ Einsatz … als PDF gespeichert … Ob sie angekommen ist, weiß das Gerät nicht.“) ist 83 px hoch (4 Zeilen), die übrigen Quittungen 60 px (R19-D4 sonst behoben). Sie steht rund 8,5 s und hat „Details“. Neu.
- **H2 [Layout]** Startseite mit Entwurf: „Fortsetzen“ und das rote „Bogen schließen“ liegen 12 px nebeneinander. Das Schließen fragt nach und ist über „Zuletzt geschlossenen Bogen zurückholen“ rückholbar (außer bei vollem Speicher, siehe R20-D1). Neu.
- **H3 [Layout]** Startseite mit Entwurf und geschlossenem Bogen: „Neue Einsatz-Sammlung…“ steht bei 360 × 640 erst bei y = 688, also unter dem Falz (ohne Entwurf bei y = 362). Betrifft Helfer mit angefangenem Bogen am Meldekopf. Verwandt mit R19-W3. Alt.
- **H4 [Layout]** Tabelle am Telefon ragt auf jeder Seite rund 7 px über den Kartenrahmen der Einheitenliste hinaus (Tabelle x 3 bis 357, Rahmen x 10 bis 350). Lesbarkeit und Bedienung nicht beeinträchtigt. Neu.
- **H5 [Text]** Schnellerfassung, Kopf: „Schritt 1 von 6: Einheit · 2, 5 entfallen“ ist für Helfer ohne Einweisung kaum zu deuten (welche Schritte entfallen?). Neu.
- **H6 [Text]** Kopfzeile nach „Einsatz als beendet markieren“: „Einsatz beendet … — noch offen: 6“; erst die Liste weiter unten zeigt, dass sechs Exporte gemeint sind. Neu.
- **H7 [Text]** Rückfrage „Stärke fehlt“: „In der Lage zählte sie als Einheit ohne Leute.“ (Zeitform „zählte“ statt „zählt“). Neu.

## Geprüft ohne Befund

- Rückfragen „Meldung entfernen“, „Papierkorb voll“, „Einsatz löschen“, „Einsatz endgültig löschen“ (nennt „einzige Kopie“), „Als Übung kennzeichnen“, „Stärke ändern“, „Bogen schließen“, „Neuen Bogen anfangen“ (mit Sicherungsangebot), „Person entfernen“ (nennt Wechsel der Ansprechperson), „Nur die Stärke melden?“ (nennt 8 Personen), „Sicherung einspielen?“ (listet, was verloren geht), Einsatz-Import (Zusammenführen oder getrennt), „Geräteschlüssel erzeugen“, „Alle lokalen Daten löschen“: Gegenstand und Folge genannt, Abstand der Knöpfe mindestens 24 px.
- Einsatz löschen: Quittung mit Rückgängig, „Wiederherstellen“ auch bei vollem Speicher, „Endgültig löschen…“ gesperrt bis nach der Wartezeit.
- Wieder anwesend, Beginn bei vollem Speicher („Der Beginn konnte nicht gespeichert werden“, Feld bleibt leer).

## Nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, Handschuhe, ein zweites Gerät mit echter Weitergabe-Datei, das Fenster des Lagemonitors, die nativen Builds, der automatische Ablauf der 7-Tage- und 30-Tage-Fristen, „Aus Datei laden…“ bei vollem Speicher und vorhandenem Entwurf (gleiche Ablage wie R20-D1), 320 px Breite.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Der Bogen wird geschlossen, nicht gelöscht“ gilt bei vollem Speicher nicht (R20-D1).
- **Größtes Einsatzrisiko:** Stiller Verlust des eigenen Bogens beim Schließen, Ersetzen oder Zurückholen, sobald der Gerätespeicher voll ist (R20-D1).
- **Top-Priorität für die nächste Iteration:** Ablage „Zuletzt geschlossener Bogen“ erst schreiben, dann den Entwurf entfernen, und bei Fehler dieselbe Meldung wie bei den Einsatz-Handlungen zeigen (R20-D1).
