# Audit „Zerstörende Handlungen", Runde 18 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `ae3a8e9` (`main`).

**Zählung: P0 0 · P1 0 · P2 0 · P3 8** (R18-D1 bis R18-D8).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, der
Abschnitt „Stand der Behebung" in `runde-17/README.md` und der Bericht
`runde-17/zerstoerende-handlungen.md`. Es gibt keine „bekannten Grenzen" mehr, die
ausgelassen werden: Was im Browser noch zu beobachten ist, steht hier.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale de-DE,
Viewports 360 × 640 und 390 × 844, Tipps über `touchscreen.tap`. Je Szenario ein frischer
Browserkontext. Zustand über die Bedienung: Einsatz-Sammlung „Hochwasser Weser" anlegen,
die THW-Beispielbögen `012-sinsheim`, `013-ulm`, `014-weinsberg` (Kopien außerhalb des
Repositorys, `uebung: false`, `stand` fünf Minuten vor der Geräteuhr) über „Bögen
einlesen…" aufnehmen; für den Assistenten Bogen `013-ulm` über „Aus Datei laden…".
Kein Kamera-Scan, keine Handschuhe, kein Zweitgerät, keine nativen Builds.

Durchgespielt: Kenntnisnahme und Rückgängig, Abrücken (Doppeltipp 40/150/400 ms), „Wieder
anwesend", Meldung entfernen (Rückfrage, Quittung, Doppeltipp, Neuladen, Papierkorb,
Zurückholen, „Endgültig löschen…", erneutes Einlesen derselben Datei), Stärke ändern
(Plausibilitätsfrage, Rückgängig), „Als Übung kennzeichnen…", Aufteilen (Rückfrage),
Verschieben in zweiten Einsatz, Zug zuordnen (Sammelzuordnung), Einsatzbeginn „Jetzt" und
„Beginn entfernen", Einsatz löschen, Papierkorb der Einsätze, Einsatz importieren
(Sammel-PDF mit entfernter Meldung), Folgemeldung mit niedrigerer Stärke, älterer Stand,
Datenschutzfrist (100 Tage alter Bogen), „Alle Daten löschen", „Geräteschlüssel neu
erzeugen", Datensicherung erstellen und einspielen (Dialog), Sammel-PDF (Zeitverlauf,
Fortschritt, 6-fache CPU-Drosselung), Assistent: Person entfernen, „⇑", StAN-Vorbelegung bei
Fahrzeugen, „Bogen schließen", „Verwerfen", „Neuen Bogen erstellen" und „Aus Datei laden…"
bei vorhandenem Entwurf, Schnellerfassung ohne Ort und ohne Stärke, Zurück-Geste (auch bei
offenem Dialog), Neuladen mit aufgeklappter Karte, Tabellenansicht am Telefon.

## Urteil

Die Rückfragen sind in diesem Stand gut: Sie nennen Name, Stärke und die konkrete Folge
(jetzt auch die verlorenen Kennzeichen bei der StAN-Vorbelegung), Doppeltipps auf
Bestätigungen wirken nur einmal, fast jede Handlung hat ein Rückgängig, und entfernte
Meldungen sind nach dem Neuladen noch sieben Tage im Papierkorb des Einsatzes. Aufgaben ließen
sich ohne fremde Hilfe erledigen. Es bleiben acht Randpunkte, keiner mit Datenverlust ohne
Rückweg: zwei knapp beieinanderliegende Knöpfe, eine Sperre, die auch „Abbrechen" schluckt,
und drei Stellen, an denen Text oder Rückmeldung zu früh oder zu knapp erscheint.

## Behebungen aus Runde 17, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R17-D1 StAN-Vorbelegung ersetzt Kennzeichen ohne Rückweg | behoben. Rückfrage nennt „Kennzeichen THW-80125, THW-80126; 1 Funkrufname; 2 Angaben zur StAN-Ausstattung", Quittung „2 bisherige Fahrzeuge ersetzt" mit Rückgängig |
| R17-D2 „⇑" stille Umordnung | behoben. Quittung „Neue Ansprechperson: Brandt, Uwe" mit Rückgängig; „✕" 94 px von „⇑" entfernt, „▲ ▼ ⇑" 12 px Abstand, 44 px hoch |
| R17-D3 Rückgängig in der Ortssperre | behoben. Abrücken → Rückgängig (3 s) → Kenntnisnahme (0,6 s) → Rückgängig (0,6 s) wirkt beim ersten Tipp |
| R17-D4 Sammel-PDF ohne Fortschritt | größtenteils behoben (Fortschritt „2 von 3 Bögen vorbereitet", Knopf gesperrt); Rest siehe R18-D7 |
| R17-D5 „Als Übung" überschreibt Stand | behoben. Stand bleibt 23:13, Zusatz „am Meldekopf von Hand geändert", Eintreffzeit unverändert |
| R17-D6 Entfernte Meldung nach Neuladen weg | behoben. „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" mit „Zurückholen"; bleibt auch nach Löschen und Wiederherstellen des Einsatzes; Neuladen, Zurück-Geste (bei offenem Dialog schließt sie nur den Dialog) und Doppeltipp (40/150/400 ms) halten |
| R17-D7 „Alle Daten löschen" 8 px Abstand | teilweise, siehe R18-D3 |
| Tabelle am Telefon | hält: Kernspalten, kein seitliches Scrollen bei 360 und 390 px |

## Befunde

### R18-D1 [P3] Meldungen-Papierkorb: „Zurückholen" und „Endgültig löschen…" berühren sich (0 px Abstand)

**Neu oder alt (Verweis):** neu (Papierkorb für entfernte Meldungen stammt aus der Behebung von R17-D6).

**Kennzeichnung:** gemessen (360 × 640 und 390 × 844).

**Ort:** Einsatzansicht → „Zuletzt entfernte Meldungen (n) — 7 Tage zurückholbar" aufklappen.

**Beobachtung:** Der Eintrag bricht um; „Zurückholen" (x 185–298, y 457–501) steht rechts neben dem
Datumstext, „Endgültig löschen…" (x 56–217, y 501–545) beginnt in derselben Pixelzeile
darunter und überlappt „Zurückholen" auf 32 px Breite. Bei 360 × 640: Oberkante 187/44 und
231/44, also 0 px Zwischenraum. Im Papierkorb der Einsätze auf der Startseite liegen die
gleichen Knöpfe dagegen 125 px auseinander.

**Folge:** Ein Tipp mit dem Handschuh, der „Zurückholen" meint, kann „Endgültig löschen…" treffen. Es
folgt noch die Rückfrage („wird mit Historie, Zeiten, Zug und Auftrag endgültig gelöscht"), der
Schaden ist daher gering, die Rückfrage wird aber unter Zeitdruck leicht bestätigt.

**Empfehlung:** Die beiden Knöpfe wie im Einsatz-Papierkorb deutlich trennen (mindestens 24 px,
„Endgültig löschen…" rechtsbündig und abgesetzt), „Zurückholen" nicht in den Fließtext einbetten.

**Nachprüfung:** Meldung entfernen, Neuladen, Papierkorb öffnen: Abstand der beiden Knöpfe mindestens 24 px.

### R18-D2 [P3] Alle Rückfragen schlucken Tipps etwa 0,8 s lang, auch „Abbrechen"

**Neu oder alt (Verweis):** neu (Folge der Doppeltipp-Sperre aus R16/R17).

**Kennzeichnung:** gemessen (390 × 844, `touchscreen.tap`).

**Ort:** jede Rückfrage mit Sperre, geprüft bei „Einsatz löschen…" und „Meldung entfernen".

**Beobachtung:** Nach dem Öffnen der Rückfrage bleibt der Dialog beim Tipp auf „Abbrechen" stehen,
solange seit dem Öffnen weniger als rund 0,8 s vergangen sind (Tipp nach 300 und 750 ms: offen; nach
850 und 1200 ms: schließt). Die einzige Rückmeldung ist ein kurzes „Einen Moment …" über dem Knopf.
Ebenso wirkt „Meldung entfernen" bei Tipps nach 200, 550 und 900 ms (nach dem Öffnen plus 200 ms
Wartezeit) erst beim dritten Tipp.

**Erwartung der Rolle:** „Abbrechen" wirkt immer sofort; nur die zerstörende Bestätigung braucht eine Sperre.

**Folge:** Wer die Rückfrage versehentlich geöffnet hat und sofort „Abbrechen" tippt, sieht nichts und tippt
erneut oder wischt weg. Die Sperre schützt vor dem Nachtippen (Geisterklick), das Abbrechen braucht
diesen Schutz nicht.

**Empfehlung:** Sperre nur auf den bestätigenden Knopf; „Abbrechen" und „Schließen" von Anfang an
wirksam; die Sperre sichtbar machen (Knopf ausgegraut mit Restzeit statt Hinweisblase).

**Nachprüfung:** „Einsatz löschen…" tippen, nach 0,3 s „Abbrechen" tippen: Rückfrage schließt.

### R18-D3 [P3] „Alle Daten löschen": „Endgültig löschen" und „Abbrechen" liegen nur 16 px auseinander

**Neu oder alt (Verweis):** alt, R17-D7 (dort 8 px, jetzt 16 px, damit nur teilweise behoben).

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** Startseite → Fußzeile „Alle Daten löschen" → Dialog, nach gesetztem Haken.

**Beobachtung:** „Endgültig löschen" y 503–547, „Abbrechen" y 563–607, Abstand 16 px; beide 44 px
hoch, volle Breite. Beim Einsatz-Löschen sind es 41 px, bei „Geräteschlüssel neu erzeugen" 41 px mit
Trennlinie. Der Haken schaltet den Knopf erst frei (Layout rückt dabei um 45 px).

**Folge:** Nach dem Haken genügt ein knapp danebengesetzter Tipp, um alle Einsatzdaten zu löschen. Der
Haken hält die Gefahr klein, deshalb P3.

**Empfehlung:** Abstand wie bei den übrigen Rückfragen (mindestens 24 px, besser 40 px mit Trennlinie).

**Nachprüfung:** Dialog bei 360 × 640 mit gesetztem Haken: Abstand mindestens 24 px.

### R18-D4 [P3] Feste Knopfleiste in großen Rückfragen verdeckt bei 360 × 640 den Folgetext

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640).

**Ort:** „Alle Daten löschen" und „Geräteschlüssel neu erzeugen".

**Beobachtung:** Die Knopfleiste ist am unteren Rand festgeheftet. Bei „Alle Daten löschen" belegt sie
mit Haken und beiden Knöpfen die Zone y 414–607 von 640 px (rund 30 % des Bildes); die Liste „Betroffen
sind: … Einsatz-Sammlung mit 3 gemeldeten Bögen — noch kein Export, kein Lageblatt und keine
Weitergabe" läuft darunter durch und ist ohne Scrollen nur halb lesbar (im Screenshot an der Kante
abgeschnitten). Bei „Geräteschlüssel neu erzeugen" liegt der Satz zu „Empfänger müssen die Kurzform
danach neu abgleichen … nur gegen den alten öffentlichen Schlüssel" hinter der Leiste.

**Folge:** Gerade die Sätze, die die Folge nennen („noch kein Export"), sind beim ersten Blick nicht zu
lesen; der Helfer liest Titel und Haken und bestätigt.

**Empfehlung:** Die Folgeliste vor den Haken und die Knöpfe stellen, die Leiste auf Knöpfe ohne Fließtext
beschränken oder die Liste auf das Wesentliche kürzen („1 Einsatz, 3 Bögen, nie gesichert").

**Nachprüfung:** „Alle Daten löschen" bei 360 × 640 öffnen: die Zeile mit „kein Export … keine Weitergabe"
ist ohne Scrollen vollständig sichtbar.

### R18-D5 [P3] Quittung „Entfernt: Meldung Nr. 1 …" ist abgeschnitten, der Hinweis zur Umnummerierung unlesbar

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640 und 390 × 844).

**Ort:** Einsatzansicht → Meldung entfernen → Quittungsleiste.

**Beobachtung:** Der Text der Leiste umfasst 118 px (360) bzw. 101 px (390), die Leiste lässt 67 px
zu; sie endet mit „… (11 Personen)" und „(…" bzw. „Die Einheiten Nr…". Der Satz „Die Einheiten Nr. 2–3
rücken auf und heißen danach Nr. 1–2" fehlt sichtbar, steht aber im Lesebereich (`role=status`).

**Folge:** Nach dem Entfernen verschieben sich die Nummern; wer einer Einheit am Funk „Nr. 2" zugeordnet hat,
sieht den Hinweis nicht. Das Rückgängig selbst ist erreichbar.

**Empfehlung:** Quittungstext auf das Nötige kürzen („Nr. 1 Sinsheim entfernt · Nummern verschoben") und
umbrechen lassen statt abschneiden.

**Nachprüfung:** Meldung entfernen bei 360 × 640: die ganze Quittung ist sichtbar.

### R18-D6 [P3] „✕" der Quittungsleiste liegt 8 px neben „Rückgängig" und nimmt das Rückgängig mit

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640: „Rückgängig" x 189–289, „✕" x 297–341; 390 × 844: 219–319 / 327–371).

**Ort:** Quittungsleiste nach Abrücken, Stärke ändern, Zug setzen, Kenntnisnahme, Entfernen.

**Beobachtung:** Beide Knöpfe sind 44 px hoch und 8 px voneinander getrennt. „✕" schließt die Leiste und damit
den schnellen Rückweg. Die Quittung für „Entfernt" wird zudem durch die nächste Handlung ersetzt (z. B. nach
„Abrücken" zeigt die Leiste nur noch dieses).

**Folge:** Ein Tipp daneben verwirft die Rückgängig-Möglichkeit. Der Rückweg bleibt über andere Stellen
(Papierkorb, „Wieder anwesend", Historie) offen, ist aber umständlicher und nicht jedem Helfer bekannt.

**Empfehlung:** „✕" kleiner oder weiter vom Rückgängig abgesetzt (mindestens 24 px) oder ganz entfallen
lassen (die Leiste verschwindet ohnehin).

**Nachprüfung:** Abrücken → Leiste: Abstand zwischen „Rückgängig" und „✕" mindestens 24 px.

### R18-D7 [P3] Sammel-PDF: „✓ erzeugt … liegt im Download-Ordner" erscheint, bevor die Datei ankommt

**Neu oder alt (Verweis):** alt, Rest von R17-D4 (R15-O1).

**Kennzeichnung:** gemessen (390 × 844; einmal ohne, einmal mit 6-facher CPU-Drosselung).

**Ort:** Einsatzansicht → „Einsatz weitergeben / sichern".

**Beobachtung:** Ohne Drosselung zeigt die Statuszeile nach 665 ms „✓ Einsatz … als PDF erzeugt … liegt im
Download-Ordner", der Knopf bleibt bis 1865 ms gesperrt, die Datei kommt bei 1606 ms. Mit 6-facher Drosselung
(Telefon-Näherung) steht die Erfolgsmeldung samt freiem Knopf bei 5795 ms, der Download beginnt erst bei
9429 ms, also 3,6 s später.

**Folge:** Wer die Erfolgsmeldung sieht und die Seite verlässt oder das Telefon wegsteckt, hat noch keine Datei;
wer nichts im Download-Ordner findet, tippt erneut und erzeugt eine zweite Datei.

**Empfehlung:** Erfolgsmeldung und Freigabe des Knopfes erst, wenn die Datei übergeben wurde; bis dahin „wird
gespeichert…".

**Nachprüfung:** Tipp → Meldung „erzeugt" erscheint erst gleichzeitig mit dem Download, Knopf bis dahin gesperrt.

### R18-D8 [P3] „Verschieben…": Der Zielknopf trägt nur den Namen des Einsatzes, kein Verb

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (390 × 844, zweiter Einsatz „Übung Nord").

**Ort:** Karte → „Mehr…" → „Verschieben…" → Rückfrage „In anderen Einsatz verschieben".

**Beobachtung:** Die Rückfrage nennt Einheit und Verlust („verliert 11 Helfer"), die Aktion steht aber auf einem
vollbreiten, dunklen Knopf mit dem Text „Übung Nord"; er verschiebt sofort. Danach erscheint eine Rückfrage
mit „Rückgängig — zurück nach „Hochwasser Weser"", der Rückweg ist also vorhanden.

**Folge:** Der Knopf wirkt wie eine Auswahlzeile; ein Tipp auf der Zeile statt auf „Abbrechen" verschiebt die
Meldung. Rückgängig begrenzt den Schaden.

**Empfehlung:** Beschriftung „In „Übung Nord" verschieben".

**Nachprüfung:** Rückfrage öffnen: der Knopf nennt Verb und Ziel.

## Geprüft ohne Befund

- Rückfragen „Meldung entfernen", „Einsatz löschen", „Meldung endgültig löschen", „Bogen schließen", „Verwerfen"
  (nennt auch den bisher abgelegten Bogen, der dabei verloren geht), „Neuen Bogen anfangen", „Bogen aus Datei
  öffnen", „Einsatzbeginn überschreiben", „Als Übung kennzeichnen", „Person entfernen", „Sicherung einspielen"
  (listet, was auf dem Gerät verloren geht): Gegenstand und Folge genannt; Escape schließt, Enter löst nichts aus.
- „Stärke ändern…": Plausibilitätsfrage bei 11 → 88 („mehr als das Dreifache"), Rückgängig stellt 11 wieder her.
- Folgemeldung mit niedrigerer Stärke: Block „Folgemeldung: Stärke 8 → 5 (−3)"; älterer Stand wird nur in die
  Historie gelegt und benannt; Wiedereinlesen entfernter Meldungen aus einer Weitergabe-Datei fragt nach.
- Schnellerfassung: „In Einsatz übernehmen" ohne Ort und ohne Stärke wird mit Rückfrage abgefangen.
- Datenschutzfrist (100 Tage alter Bogen): Hinweis „ohne Namen und Erreichbarkeiten: Datenschutzfrist … auch die
  Bemerkung der Einheit fehlt".
- Neuladen, Zurück-Geste, Vorwärts: Einsatzansicht bleibt, aufgeklappte Karte bleibt offen, Rückfragen schließen
  mit der Zurück-Geste.

## Nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, Handschuhe, ein zweites Gerät mit echter Weitergabe-Datei, das Fenster des
Lagemonitors, die nativen Builds, der automatische Ablauf der 7-Tage- und 30-Tage-Fristen des Papierkorbs.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Verschieben…" wirkt mit dem bloßen Einsatznamen auf dem Knopf wie eine Auswahlzeile.
- **Größtes Einsatzrisiko:** Zwei Knöpfe ohne Abstand („Zurückholen" und „Endgültig löschen…") im neuen Papierkorb der entfernten Meldungen (R18-D1).
- **Top-Priorität für die nächste Iteration:** „Abbrechen" von der Sperre ausnehmen und den Abstand im Meldungen-Papierkorb herstellen (R18-D2, R18-D1).
