# Prüfbericht Runde 19: Stress und Unterbrechung

- **Prüfer:** Rolle „Stress und Unterbrechung“ (thw-stress-test-user), erfahrener Helfer unter Zeitdruck, mit Unterbrechungen und wenig Aufmerksamkeit
- **Datum:** 2026-10-28
- **Code-Stand:** Commit `0ac0d7f` (= `main`, Runde 18), Produktionsbuild, `http://localhost:4173`
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 15 (15 Befunde, davon 13 mit Verweis auf ältere, teilweise behobene Befunde und 2 neu: R19-S11, R19-S13)
- **Methode:** Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen, je Lauf neuer Kontext), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Viewports 360 x 640 (Hauptlauf), 390 x 844 und 320 x 568 (Kartenhöhe, Fußleiste). Tipps mit `touchscreen.tap` an den Koordinaten des Knopfes (kein Playwright-`tap()`, das mitten in der Geste scrollt). Doppeltipps und Wartezeiten von 80 ms bis 4 s, Neuladen (150 ms bis 4 s nach der letzten Eingabe), Zurück-Geste mit `goBack()`, verstellte Uhr (`page.clock`, bis 1 Std.), Stapel mit 40 Beispielbögen aus `examples/thw/` (Kopien mit `uebung: false`, Stand auf heute), Fremddateien (`.txt`, fremdes `.json`, kaputtes `.png`), Scanner ohne Kamera, Downloads (Namen gelesen). Kein Code geändert.
- **Maßstab:** Keine „bekannten Grenzen“. Auch Punkte, die in Runde 18 als offen, teilweise oder „nicht gemessen“ standen (R18-W7, R18-M7, R18-S4, R18-G5, R18-A8), sind gemeldet, soweit sie im Browser noch zu sehen sind. Gelesen: `docs/audits/README.md`, „Stand der Behebung“ in `runde-18/README.md`, `runde-18/stress-und-unterbrechung.md`.
- **Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur, native Zeitwähler, WebKit, native Builds, Teilen-Menü des Betriebssystems. Die Rückfrage „Nur Sollplätze, keine gemeldete Stärke“ ließ sich über „Einheit schnell erfassen“ nicht auslösen (mit Einheitstyp „Bergungsgruppe“ steht die Stärke in „Nur Stärke“ auf 0, es erscheint „Stärke fehlt“); ihre Höhe bleibt daher ungemessen. Das Datumsfeld („mm/dd/yyyy“) folgt dem Testbrowser und ist kein Befund.
- **Kennzeichnung:** *gemessen* = im Testbrowser reproduziert, *Risiko* = abgeleitet, nicht nachgestellt.

## Urteil aus Sicht der Rolle

Die App trägt unter Stress sehr gut. Einsatz anlegen, 40 Bögen einlesen, Einheit schnell erfassen, Abrücken, Meldung entfernen und aus dem Papierkorb zurückholen, Übergabe vermerken, Einsatz beenden, Fremddateien, Neuladen mitten im Assistenten und Zurück-Geste gelingen ohne fremde Hilfe und ohne Datenverlust. Die Hauptaktion „Bogen scannen…“ liegt jetzt in jedem Zustand auf der ersten Bildschirmseite. Es bleiben keine Befunde über P3: Reibung entsteht an Stellen, an denen ein Knopfname abgeschnitten ist, eine Quittungsleiste ein Fünftel des Bildes deckt oder eine Ansicht anders aufgebaut ist, als man nach der letzten Handlung erwartet.

## Haltbarkeit der Behebungen aus Runde 18 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Hauptaktion oben (R18-S1) | hält: „Bogen scannen…“ Oberkante 361 px (360 x 640) und 327 px (390 x 844), gleich bei 0, 1, 6, 12 und 30 Einheiten; „Einheit manuell erfassen…“ endet bei 484 bzw. 453 px |
| Doppeltipp „Einsatz anlegen“ (80 ms) | hält: ein Einsatz |
| Doppeltipp „In Einsatz übernehmen“ (100 ms, 400 ms, 1 s) | hält: ein Dialog, nichts doppelt abgelegt |
| „Abbrechen“ in Rückfragen (R18-S3) | hält: „Stärke fehlt“ und „Einsatz löschen“ lassen sich 0,3 s nach dem Öffnen abbrechen; die gefährliche Antwort „Trotzdem mit Stärke 0 übernehmen“ ignoriert den Tipp bei 0,45 s, nimmt ihn bei 3 s an |
| Quittung nach Frist (R18-S2) | hält: „Zur Kenntnis genommen“, „Abgerückt“ und „Entfernt“ stehen nach 60 s nicht mehr da (bei 20 s noch ja); nach 5 Min und 1 Std. weg |
| Papierkorb für Meldungen | hält: Rückfrage nennt Nummernfolge und 7 Tage; nach Neuladen „Zuletzt entfernte Meldungen (1)“; „Zurückholen“ stellt Nr. 2 zurück und quittiert; „Endgültig löschen…“ fragt mit Folge nach |
| Nummern bleiben nach „Entfernen“ | hält: Nr. 2 entfernt, neuer Bogen bekommt Nr. 5, Nr. 3 und 4 bleiben |
| Tabelle am Telefon (R18-S10) | hält: kein seitlicher Überlauf (360 von 360), Zeilen reagieren auf Tipp (Karte klappt auf) |
| Scanner ohne Kamera (R18-S9) | hält teilweise: „Kamera erneut versuchen“ steht jetzt über dem Rahmen, die Knöpfe „QR aus Bild einlesen…“ und „Fertig“ unten; Rest in R19-S10 |
| „Zuordnen“ ohne Zugname (R18-S5) | hält: Grund „„Zuordnen“ geht erst, wenn ein Zugname eingetragen ist.“ steht unter dem Feld |
| Schnellerfassung „←“ (R18-S6) | hält: von Schritt 3 führt „Zurück“ auf Schritt 1; Rest in R19-S3 |
| „Namen einfügen…“ (R18-S7) | hält: keine Vorauswahl, „3 Personen übernehmen“ gesperrt mit Satz, warum |
| Aktionsknöpfe der Karte (R18-S11) | hält: „Abrücken“, „Zug zuordnen“, „Auftrag/Notiz“ in der ersten Zeile, „Entfernen“ hinter „Mehr…“; Rest in R19-S7 |
| Dateinamen | halten: `2026-10-28_0331_eeb-einsatz_Hochwasser_Test.csv`, `…_eeb-einsatz-alle-daten_…csv`, `…_eeb-einsatz-oldenburg_….xlsx`, `…_eeb-lageblatt_….pdf`, `…_eeb-einsatz_….pdf` (Sammel-PDF) |
| Neuladen im Assistenten, Zurück-Geste | halten: Ort „Flensburg“ nach Neuladen im Feld; Zurück → Einsatz → Startseite mit „Angefangene Erfassung … Fortsetzen“ |
| Stapelimport mit Neuladen | hält: nach 150 ms „Import unterbrochen: 40 Dateien waren gewählt, 37 Meldungen kamen an …“; nach 700 ms und 4 s alle 40, kein Hinweis |
| Fremddateien | halten: „2 Dateien und 1 Bild gelesen — 0 Bögen aufgenommen“ mit Grund je Datei, Seite springt zur Meldung |
| Übergabe und Abschluss | hält: „Übergabe vermerken…“ mit Feld „An“, Vermerk mit Uhrzeit und „Vermerk entfernen“; „Einsatz als beendet markieren“ zeigt „noch offen: …“ und „Wieder öffnen“ |

## Befunde

### R19-S1 [P3] Der Knopf „In Einsatz übernehmen“ in der Fußleiste des Assistenten ist abgeschnitten

- **Neu oder alt (Verweis):** alt, R17-G2/R17-M2 (Fußleiste im Assistenten, Rest bei der Beschriftung)
- **Kennzeichnung:** gemessen (Schnellerfassung, Schritt 1 und 2; Bildschirmfotos `f1.png`, `g_320.png`)
- **Ort / Aufgabe:** Assistent „Schnellerfassung“, Fußleiste mit „← Zurück“, „In Einsatz übernehmen“, „Weiter →“.
- **Beobachtung:** Bei 360 x 640 ist der Knopf 121 px breit, der Text läuft über (`scrollWidth` größer als `clientWidth`), sichtbar bleibt „Einsatz übernehm…“, „In“ und das Wortende fehlen. Bei 320 x 568 steht dort nur „Übernehmen“, das den Knopf von Rand zu Rand füllt. Bei 390 x 844 passt der Text (159 px).
- **Folge:** Die wichtigste Abschlusshandlung des Assistenten ist am häufigen Telefonmaß (360 px) nicht ganz lesbar; wer nach einer Unterbrechung zurückkommt, liest „Einsatz übernehm…“ und weiß nicht, ob damit der Bogen abgelegt wird.
- **Empfehlung:** Beschriftung kürzen („Ablegen“) oder den Knopf zweizeilig und breiter setzen; „Zurück“ und „Weiter“ dürfen schmaler werden.
- **Nachprüfung:** 360 x 640 und 320 x 568: Beschriftung des mittleren Knopfes vollständig lesbar, kein Überlauf.

### R19-S2 [P3] Schnellerfassung: Das einzige Pflichtfeld „Ort der Einheit“ liegt anderthalb Bildschirme unter dem Kopf

- **Neu oder alt (Verweis):** alt, R18-W7 (erstes Eingabefeld: Rest, jetzt das Pflichtfeld)
- **Kennzeichnung:** gemessen (Skript `g.js`)
- **Ort / Aufgabe:** „Einheit schnell erfassen (nur Stärke)…“ → Schritt 1.
- **Beobachtung:** Der Kopf nimmt 138 px, es folgen „Angaben vom Zettel (optional)“, Organisation, Organisationsname, Einheitstyp, Ebene; „Ort der Einheit (Pflicht)“ (Feld `feld-einheit-name`) liegt bei y = 868 px (360 x 640) und 914 px (320 x 568), „Ort und Stärke vom Zettel“ steht auf dem Knopf, der hierher führt. Ohne Ort zeigt erst die Zeile über der Fußleiste „Zugehörigkeit: Der Ort der Einheit … fehlt“.
- **Folge:** Der Helfer sucht zwei Bildschirme lang nach dem Ort; wer nur „Weiter“ tippt, bekommt die Fehlerzeile statt des Feldes.
- **Empfehlung:** In der Schnellerfassung den Ort zuerst, die übrigen Felder als optionaler Block darunter; Fokus auf den Ort setzen.
- **Nachprüfung:** 360 x 640, Schnellerfassung: „Ort der Einheit“ liegt ohne Scrollen im Bild und hat den Fokus.

### R19-S3 [P3] Schnellerfassung: Kopfzeile sagt „Schritt 2 von 4: Personal“, die Überschrift darunter „3. Personal“

- **Neu oder alt (Verweis):** alt, R18-S6 (Rest: der Weg stimmt, die Zählung nicht)
- **Kennzeichnung:** gemessen (Skript `ai.js`)
- **Ort / Aufgabe:** Schnellerfassung, zweiter Schritt.
- **Beobachtung:** Kopf „Schritt 2 von 4: Personal“, Überschrift „3. Personal“, Kurzfassung „3 . Personal“ in der Schrittleiste mit sechs Punkten (1 bis 6), von denen 2 und 5 entfallen.
- **Folge:** Zwei verschiedene Zählungen auf einem Bildschirm; wer „Schritt 3“ in der Anleitung oder am Telefon sucht, zählt falsch.
- **Empfehlung:** Eine Zählung: in der Schnellerfassung die Überschrift „2. Personal“ oder die Kopfzeile „Schritt 3 von 6“.
- **Nachprüfung:** Schnellerfassung Schritt 2: Kopf und Überschrift tragen dieselbe Zahl.

### R19-S4 [P3] Quittungsleiste deckt bis 19 % des Bildes und verdeckt die Knöpfe, die sie gerade anbietet

- **Neu oder alt (Verweis):** alt, R18-A8 (Höhe nach „Entfernen“ nicht gemessen) und R18-S2 (Quittungsleiste)
- **Kennzeichnung:** gemessen (Skripte `t.js`, `v.js`, `w.js`, Bildschirmfotos `w1.png`, `u3.png`)
- **Ort / Aufgabe:** Einsatzansicht nach „Entfernt“, „Abgerückt“, „Zur Kenntnis genommen“.
- **Beobachtung:** Höhe bei 360 x 640: „Zur Kenntnis genommen“ 86 px, „Abgerückt“ 103 px, „Entfernt“ 119 px (19 % des Bildes, vier Zeilen Text), jeweils bis über 20 s; nach 60 s weg. Öffnet man unmittelbar nach dem Entfernen „Zuletzt entfernte Meldungen“, liegen „Zurückholen“ und „Endgültig löschen…“ unter der Leiste; ein Tipp an der Stelle trifft die Leiste, nicht den Knopf (Zurückholen wirkte erst nach Weiterscrollen).
- **Folge:** Wer die entfernte Meldung sofort zurückholen will, tippt auf einen verdeckten Knopf und glaubt, die App reagiere nicht.
- **Empfehlung:** Text der Leiste auf eine Zeile mit Nummer und Name kürzen („Entfernt: Nr. 2 · Biberach/Riß“), Folge im Papierkorb nennen; oder Seitenende und Bildlauf um die Leistenhöhe freihalten.
- **Nachprüfung:** 360 x 640 nach „Entfernen“: Leiste höchstens 70 px; „Zurückholen“ nach dem Aufklappen des Papierkorbs nicht verdeckt.

### R19-S5 [P3] Tipp-Sperre: Die sichere Antwort „Stärke eintragen“ wird bis etwa 1 s ignoriert, „Einen Moment …“ liegt über der Beschriftung

- **Neu oder alt (Verweis):** alt, R18-S3 (Rest: Abbrechen frei, sichere Gegenhandlung nicht)
- **Kennzeichnung:** gemessen (Skripte `q.js`, `o.js`, `ag.js`; Bildschirmfoto `o1.png`)
- **Ort / Aufgabe:** Rückfrage „Stärke fehlt“; „Übergabe vermerken…“ kurz nach „Zur Kenntnis genommen“.
- **Beobachtung:** „Stärke eintragen“ (zurück zum Eintragen, harmlos) reagiert bei 0,4 s nicht („Einen Moment …“), bei 1,2 s ja; der Schriftzug überdeckt die Beschriftung des Knopfes („Trotzd… nehmen“), der Knopf ist gedämpft. Die Sperre gilt über Knöpfe hinweg: „Übergabe vermerken…“ 0,32 s nach „Zur Kenntnis genommen“ wird verschluckt, bei 0,72 s öffnet es.
- **Folge:** Der Helfer, der „Stärke eintragen“ will, sieht „Einen Moment …“ und tippt ein zweites Mal, möglicherweise schon auf den Nachbarknopf.
- **Empfehlung:** Sichere Antworten („Stärke eintragen“, „Abbrechen“) nie sperren; die Meldung neben den Knopf statt über die Beschriftung setzen.
- **Nachprüfung:** Rückfrage öffnen, nach 300 ms „Stärke eintragen“ tippen: Das Formular springt zur Stärke.

### R19-S6 [P3] Tabelle am Telefon schneidet Einheitsnamen ab

- **Neu oder alt (Verweis):** alt, R18-S10 / R17-K7 (Breite behoben, Inhalt der Spalte „Einheit“ nicht)
- **Kennzeichnung:** gemessen (Skript `y.js`, Bildschirmfoto `y1.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht → „Tabelle“.
- **Beobachtung:** Die Spalte „Einheit“ ist dreizeilig und endet mit „…“: „Wassergefahre…“, „Wasserschade…“, „Fachgruppe…“ (Nr. 3 und Nr. 5 sind beide „Fachgruppe Wassergefahren (A)“, Nr. 5 zeigt nur „THW Haßmersheim Fachgruppe…“). Die Spalte „Auftrag“ ist leer und belegt ein Viertel der Breite. Ein Tipp auf eine Zeile wechselt in die Kartenansicht (Tabelle weg, Knopf „Tabelle“ muss erneut getippt werden).
- **Folge:** Zwei ähnliche Einheiten sind nur über die Nummer zu unterscheiden; wer zur Tabelle zurück will, tippt ein zweites Mal.
- **Empfehlung:** Namen vollständig zeigen (Zeilenumbruch statt Auslassungspunkte), leere Spalte „Auftrag“ am Telefon ausblenden; der Tipp auf die Zeile klappt die Karte auf und lässt die Tabelle zurück erreichbar.
- **Nachprüfung:** 360 x 640: Alle Einheitsnamen ohne „…“; Zeilentipp, dann „Tabelle“: gleiche Bildlaufstelle.

### R19-S7 [P3] Aufgeklappte Karte: „Auftrag/Notiz“ läuft über den Knopf, bei 320 x 568 in „Feld“ höher als das Bild

- **Neu oder alt (Verweis):** alt, R18-S11 und R18-M7
- **Kennzeichnung:** gemessen (Skripte `y.js`, `ak.js`; Bildschirmfoto `ak_Feld.png`)
- **Ort / Aufgabe:** Einsatzansicht → Karte aufklappen.
- **Beobachtung:** „Auftrag/Notiz“ steht in einem 84 px breiten Knopf (14 px Schrift) und läuft über (`scrollWidth` größer als `clientWidth`), die Schrift berührt beide Ränder. Karte aufgeklappt bei 320 x 568: in „Standard“ 498 px, in „Feld“ 634 px (Bild 568 px), sechs Knopfzeilen, Knopfhöhen 54 bis 61 px.
- **Folge:** Die Beschriftung wirkt gequetscht; in „Feld“ lässt sich die Karte nicht mit einem Blick erfassen.
- **Empfehlung:** „Notiz“ statt „Auftrag/Notiz“ oder zweizeilig mit mehr Innenabstand; in „Feld“ „Details“ und „Bogen als PDF“ unter „Mehr…“.
- **Nachprüfung:** 320 x 568, „Feld“: Karte höchstens eine Bildschirmhöhe; kein Überlauf im Knopf.

### R19-S8 [P3] Zu geringe Abstände zwischen den Linklisten der Fußzeile und bei „Karten | Tabelle“

- **Neu oder alt (Verweis):** alt, R18-G5
- **Kennzeichnung:** gemessen (Skript `al.js`, 360 x 640 und 390 x 844)
- **Ort / Aufgabe:** Fußzeile (Anleitung, Aufbau, Organisationen, Schwesterseiten); Umschalter „Karten | Tabelle“ in der Einsatzansicht.
- **Beobachtung:** Die Ziele sind 44 px hoch, stehen aber mit 4 px Abstand untereinander (Anleitung, Aufbau des Bogens, Blanko-Vordruck, Kontakt, Open Source auf GitHub, THW … Meldekopf, erfassungsbogen.app …); „Karten“ und „Tabelle“ haben 6 px Abstand.
- **Folge:** Mit dicken Fingern trifft man den Nachbarlink, hier ohne Datenfolge.
- **Empfehlung:** Mindestens 8 px Abstand, in der Fußzeile besser 12 px.
- **Nachprüfung:** 360 x 640: Abstand zwischen benachbarten Zielen mindestens 8 px.

### R19-S9 [P3] Kennzahlen in 3 + 2 Zellen mit leerer dritter Zelle, „Gesamt“ steht unter „Führer“

- **Neu oder alt (Verweis):** alt, R18-S8 (Spalten fluchten jetzt, die Aufteilung bleibt)
- **Kennzeichnung:** gemessen (Bildschirmfoto `e_360_6.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht, Kennzahlen.
- **Beobachtung:** Erste Zeile Einheiten, Führer, Unterf.; zweite Mannsch., Gesamt und eine leere Zelle. Die Gesamtzahl (blau) steht in der Mitte der zweiten Zeile.
- **Folge:** Gering; die wichtigste Zahl hat keinen festen Platz.
- **Empfehlung:** „Gesamt“ an den Anfang der Zeile oder über die ganze Breite; leere Zelle vermeiden.
- **Nachprüfung:** 360 x 640: „Gesamt“ steht links oder spannt die Zeile.

### R19-S10 [P3] Scanner ohne Kamera: Rahmen des Handscanner-Feldes unten abgeschnitten

- **Neu oder alt (Verweis):** alt, R18-S9 (Knopf und Rahmen jetzt getrennt, Rahmenunterkante fehlt)
- **Kennzeichnung:** gemessen (Skript `z2.js`, Bildschirmfoto `z2.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatz → „Bogen scannen…“ auf einem Gerät ohne Kamera.
- **Beobachtung:** Der gestrichelte Rahmen („Am Telefon: Foto … einlesen“, „Oder mit dem USB-Handscanner scannen“) ragt 19 px über den Bildlaufbereich (`scanner-mitte`, 571 zu 552 px); die untere Kante und der Raum bis „QR aus Bild einlesen…“ sind nur durch Scrollen zu sehen, „Hinweise zum Handscanner“ steht auf der Schnittkante.
- **Folge:** Gering; der Rahmen wirkt kaputt, der Bildlauf ist nicht zu erkennen.
- **Empfehlung:** Inhalt so verkürzen, dass er ohne Bildlauf passt, oder den Rahmen im Bildlaufbereich vollständig schließen.
- **Nachprüfung:** 360 x 640: Rahmen vollständig sichtbar, kein innerer Bildlauf.

### R19-S11 [P3] Kein Abstand zwischen „Lagemonitor öffnen“ und dem Block „Übergabe und Abschluss“

- **Neu oder alt (Verweis):** neu
- **Kennzeichnung:** gemessen (Skript `ah.js`: Unterkante „Lagemonitor öffnen“ 3259 px, Oberkante des Blocks 3259 px; Bildschirmfoto `af1.png`)
- **Ort / Aufgabe:** Einsatzansicht, unterer Teil, 360 x 640.
- **Beobachtung:** Die Knöpfe „Jetzt“ und „Lagemonitor öffnen“ berühren die Oberkante des Blocks „Übergabe und Abschluss“ (0 px).
- **Folge:** Gering; zwei Bereiche verschwimmen kurz vor der Übergabe.
- **Empfehlung:** Abstand wie zwischen den anderen Blöcken (mindestens 16 px).
- **Nachprüfung:** 360 x 640: Lücke zwischen Lagemonitor-Block und „Übergabe und Abschluss“ sichtbar.

### R19-S12 [P3] „Übergabe und Abschluss“ steht am Seitenende, der Sprungverweis führt woanders hin

- **Neu oder alt (Verweis):** alt, R18-S1 (Sprungverweise; Rest bei Übergabe und Abschluss)
- **Kennzeichnung:** gemessen (Skripte `ac.js`, `ad.js`, `ah.js`)
- **Ort / Aufgabe:** Einsatzende: Übergabe vermerken, Einsatz beenden.
- **Beobachtung:** „Übergabe vermerken…“ liegt bei 3 328 px (3 Einheiten) bis 4 368 px (6 Einheiten), also fünf bis sieben Bildschirmhöhen unter dem Kopf; „Einsatz als beendet markieren“ 56 px darunter. Der Sprungverweis „Weitergeben, Lageblatt, Export ↓“ führt zum Block „Einsatz weitergeben / sichern“, nicht zum Abschluss. Nach dem Beenden zeigt der Kopf nur „Einsatz beendet 28.10.2026, 03:34“; „noch offen: Weitergabe-Datei, Lageblatt, Übersicht als CSV, Excel-Liste, Datensicherung“ steht erst dort unten, die Aufnahmeknöpfe bleiben ohne Hinweis aktiv.
- **Folge:** Wer in der Hektik des Einsatzendes „beendet“ markieren will, scrollt lang; ein beendeter Einsatz mit offenen Exporten zeigt das im Kopf nicht.
- **Empfehlung:** Sprungverweis „Übergabe, Abschluss ↓“; im Kopf nach dem Beenden „noch offen: 5“.
- **Nachprüfung:** 360 x 640: Verweis führt zum Abschluss; Kopf nennt offene Punkte.

### R19-S13 [P3] Nach dem Sammel-PDF steht „Noch kein Export aus diesem Einsatz — alle Bögen sind neu.“

- **Neu oder alt (Verweis):** neu
- **Kennzeichnung:** gemessen (Skript `ac.js`)
- **Ort / Aufgabe:** Einsatzansicht, Block „Weitergeben“, nach „Einsatz weitergeben / sichern“.
- **Beobachtung:** Nach dem Download `2026-10-28_0332_eeb-einsatz_Hochwasser_Test.pdf` meldet „Übergabe und Abschluss“: „Weitergabe-Datei (Sammel-PDF): erzeugt 28.10.2026, 03:32“, der Block „Nur neue Bögen seit dem letzten Export“ aber „Noch kein Export aus diesem Einsatz — alle Bögen sind neu.“
- **Folge:** Zwei Aussagen auf einer Seite widersprechen sich; wer danach „Nur neue Bögen“ anhakt, erwartet, dass nur Nachzügler ausgegeben werden, und bekommt alle.
- **Empfehlung:** Den Satz „Noch kein Export“ auf „kein CSV-/Excel-Export“ präzisieren oder das Sammel-PDF mitzählen.
- **Nachprüfung:** Sammel-PDF erzeugen: beide Zeilen nennen denselben Stand.

### R19-S14 [P3] Startseite ohne Einsatz: „Neue Einsatz-Sammlung…“ liegt unter dem Falz, davor der eigene Bogen

- **Neu oder alt (Verweis):** alt, R17-S9 (Einsatz oben gilt nur, wenn schon ein Einsatz besteht)
- **Kennzeichnung:** gemessen (Skript `ar.js`)
- **Ort / Aufgabe:** Startseite, erster Aufruf eines Meldekopf-Bedieners.
- **Beobachtung:** „Neue Einsatz-Sammlung…“ liegt bei 753 px (360 x 640) und 830 px (390 x 844, Bild 844 px); davor „Meinen Bogen ausfüllen“ mit „Neuen Bogen erstellen“ bei 395 px. Mit bestehendem Einsatz steht dessen Karte („Öffnen“) oben, „Löschen…“ bei 639 px.
- **Folge:** Der Meldekopf muss beim ersten Mal scrollen oder greift zu „Neuen Bogen erstellen“.
- **Empfehlung:** Zwei gleichrangige Einstiege nebeneinander am Anfang („Meinen Bogen ausfüllen“, „Einsatz-Sammlung anlegen“) oder den zuletzt benutzten zuerst.
- **Nachprüfung:** 360 x 640 ohne Einsatz: beide Einstiege ohne Scrollen im Bild.

### R19-S15 [P3] Rückfrage „Stärke fehlt“ ist drei Viertel des Bildes hoch

- **Neu oder alt (Verweis):** alt, R18-S4 (dort „Nur Sollplätze“, jetzt am Beispiel „Stärke fehlt“ gemessen)
- **Kennzeichnung:** gemessen (Skript `n.js`, 360 x 640; Bildschirmfoto `o1.png`)
- **Ort / Aufgabe:** Schnellerfassung → „In Einsatz übernehmen“ mit Stärke 0.
- **Beobachtung:** Dialog 487 von 640 px, Titel, ein Satz und zwei Aufzählungspunkte mit je zwei bis drei Zeilen, die Knöpfe beginnen bei 345 px: „Stärke eintragen“, „Trotzdem mit Stärke 0 übernehmen“ (gestrichelt, rot), „Abbrechen“. Die Folge („Karte trägt die Marke ‚Stärke fehlt‘; nachtragen als Folgemeldung“) steht im Text, nicht am Knopf.
- **Folge:** Unter Zeitdruck liest man den Titel und tippt; die Folge von „Trotzdem“ bleibt ungelesen.
- **Empfehlung:** Je Antwort ein Knopf mit einer Unterzeile; Liste entfällt. Höhe höchstens 60 % des Bildes.
- **Nachprüfung:** 360 x 640: Dialog höchstens 384 px; Folge steht am Knopf.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Ein gedämpfter Knopf mit „Einen Moment …“ über der Beschriftung (auch bei der sicheren Antwort) wird als „App hängt“ gelesen.
- **Größtes Einsatzrisiko:** Die Quittungsleiste deckt bis 19 % des Bildes und liegt über genau den Knöpfen („Zurückholen“), die sie anbietet.
- **Top-Priorität für die nächste Iteration:** R19-S4 und R19-S1, Quittungsleiste kürzen und die Beschriftung von „In Einsatz übernehmen“ vollständig lesbar machen.
