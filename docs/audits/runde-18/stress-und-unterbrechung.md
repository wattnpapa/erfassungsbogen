# Prüfbericht Runde 18: Stress und Unterbrechung

- **Prüfer:** Rolle „Stress und Unterbrechung“ (thw-stress-test-user), erfahrener Helfer unter Zeitdruck, mit Unterbrechungen und wenig Aufmerksamkeit
- **Datum:** 2026-10-27
- **Code-Stand:** Commit `ae3a8e9` (`main`), Produktionsbuild, `http://localhost:4173`
- **Zählung:** P0: 0 · P1: 0 · P2: 1 · P3: 10 (11 Befunde, davon 8 mit Verweis auf ältere, teilweise behobene oder bewusst belassene Befunde)
- **Methode:** Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne Optionen, je Lauf neuer Kontext), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Viewports 390 x 844 und 360 x 640 (Dialoge zusätzlich 640 x 360). Tipps mit `touchscreen.tap` an den Koordinaten des Knopfes (der Playwright-eigene `tap()` scrollt mitten in der Geste und erzeugt dadurch Fehltipps, die kein App-Befund sind). Doppeltipps mit 60, 150, 200, 300, 500 und 700 ms, Unterbrechung mit `reload()` (100 ms bis 3 s nach der letzten Eingabe), Zurück-Geste mit `goBack()`, verstellte Uhr (`page.clock`, 45 Min und 3 h 45 Min), Offline-Kontext, zweiter Tab. Zustand über die Oberfläche: Einsatz anlegen, 1 bis 40 Beispielbögen aus `examples/thw/` (mit `uebung: false` und Stand/Zeitraum auf heute, Kopien im Scratchpad), „Einheit manuell erfassen…“, „Einheit schnell erfassen (nur Stärke)…“, „Namen einfügen…“, „Stärke ändern…“, Abrücken, Zug zuordnen, Entfernen, Exporte, Fremddateien (`.txt`, fremdes `.json`, kaputtes `.png`), Scanner ohne Kamera.
- **Maßstab:** Keine „bekannten Grenzen“. Auch früher als teilweise, offen oder gewollt geführte Punkte stehen hier, wenn sie im Browser noch zu sehen sind (mit alter ID). Gelesen: `docs/audits/README.md`, „Stand der Behebung“ in `runde-17/README.md`, `runde-17/stress-und-unterbrechung.md`.
- **Nicht geprüft:** echte Kamera, Lärm, Handschuhe, echte Bildschirmtastatur, native Zeitwähler, WebKit, native Builds, Teilen-Menü des Betriebssystems, große Systemschrift. Die Darstellung des Datumsfeldes („10/28/2026“) folgt dem Testbrowser, nicht der App, und ist kein Befund.
- **Kennzeichnung:** *gemessen* = im Testbrowser reproduziert, *Risiko* = abgeleitet, nicht nachgestellt.

## Urteil aus Sicht der Rolle

Die App trägt unter Stress gut. Einsatz anlegen, 40 Bögen einlesen, Einheit von Hand und in der Schnellerfassung aufnehmen, Abrücken, Stärke korrigieren, Zug zuordnen, Meldung entfernen und zurückholen, Fremddateien, Neuladen und Zurück-Geste gelingen ohne fremde Hilfe und ohne Datenverlust. Die Rückfrage „Stimmt die Stärke?“ fängt einen Zahlendreher (9 → 90) ab. Reibung bleibt an elf Stellen: Die wichtigste Handlung des Meldekopfs („Bogen scannen…“, „Einheit erfassen“) liegt am Telefon ein bis zwei Bildschirme unter dem Falz (P2); der Rest sind P3-Stellen, an denen ein Helfer im Stehen eine plausible, aber falsche Aktion wählt oder die App sich anders verhält, als er nach der letzten Aktion erwartet.

## Haltbarkeit der Behebungen aus Runde 17 (im echten Browser)

| Behebung | Ergebnis |
| --- | --- |
| Doppeltipp „Einsatz anlegen“, „Zahlen stimmen, so gezählt“, „Abrücken“, „In Einsatz übernehmen“ (60 bis 600 ms) | hält: je ein Einsatz, eine Einheit, eine Abrückung; der zweite Tipp trifft nach dem Schließen des Dialogs nichts Falsches |
| Doppeltipp „Weiter“ im Assistenten | hält bis 300 ms (ein Schritt); bei 700 ms Abstand zwei Schritte (gewollt, zwei Tipps) |
| Neuladen im Assistenten (150 ms nach Eingabe) | hält: Schritt, Ort, Typ, Kürzel kommen zurück; Entwurf steht auf der Startseite mit „Fortsetzen / Verwerfen“ und dem Satz „Angefangene Erfassung für „…““ |
| Neuladen mit aufgeklappter Karte, Bildlaufstelle, Notiz (R17-S10) | hält: Karte bleibt offen (offene Karten 1 → 1), Bildlaufstelle gleich (2 468 px), Notiz nach 100 ms Neuladen auf der Karte |
| Zurück-Geste nach Neuladen (R17-S2) | hält: Einsatz → Startseite → erst die zweite Geste verlässt die App; im Assistenten 4 → 3 → … → Einsatz → Startseite |
| Stapelimport mit Neuladen | hält: 40 Dateien, Neuladen nach 150 ms → „Import unterbrochen: 40 Dateien waren gewählt, 36 Meldungen kamen an …“; nach 700 ms und 3 s alle 40, kein Hinweis |
| Einsatz auf der Startseite oben (R17-S9) | hält: „Einsatz-Sammlung (Meldekopf)“ steht vor „Meinen Bogen ausfüllen“ |
| Quittung „Zuletzt abgelegt … jetzt“ (R17-S8) | hält: nach 45 Min und 3 h 45 Min ist die Zeile weg; die Kopfzeile zählt mit („vor 3 Std 45 Min“, „älteste Meldung …“). Der Rest steht in R18-S2 |
| „Zahlen stimmen, so gezählt“ mit „Rückgängig“ (R17-S1) | hält: Quittung mit „Rückgängig“; bei „Als Sollstärke ablegen“ trägt die Karte „Sollstärke, nicht gemeldet“, die Liste „(0 gemeldet · 1 nur Sollstärke · 1 zählend)“ |
| „Einheit manuell erfassen…“ nach Schnellerfassung (R17-S3) | hält: normaler Assistent ohne Marke „Schnellerfassung“, Reiter 2 und 5 offen |
| „Ort eintragen…“ (R17-S4) | hält: Fokus im Feld „Ort / Auftrag“, Name bleibt; Kopf zeigt „Einsatz · Flensburg“ |
| Personenzeile (R17-S5), Dienststelle (R17-S6) | halten: ▲ ▼ ⇑ je 44 px mit 12 px Abstand, „✕“ 124 px abgesetzt; „Dienststelle“ beschriftet und 294 px breit |
| Abrücken verschiebt den Knopf nicht (R17-S11) | hält: „Wieder anwesend“ steht an derselben Bildschirmstelle (y 443 → 443) |
| Fußleiste im Assistenten 57 px, Quittung neben Ansichtsleiste | hält: bei 360 x 640 57 px; die Quittung ersetzt die Ansichtsleiste, kein doppelter Balken |
| Tabelle am Telefon 360 px | hält: kein seitlicher Überlauf (360 von 360), Spalten Einheit, Ges., Meldung vor, Bedarf; Abgerückte am Ende mit Marke |
| Papierkorb für entfernte Meldungen | hält: Rückfrage nennt Folgen und Nummernänderung, „Rückgängig“ bei Entfernen, nach Neuladen „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“, „Zurückholen“ stellt die Einheit auf Nr. 2 zurück |
| Querformat 640 x 360, Dialog „Nur Sollplätze …“ | hält: alle vier Knöpfe ohne inneren Bildlauf (Dialog 328 von 360 px) |
| Offline (Kontext offline, Neuladen) | hält: Startseite, Einsatz anlegen, Einlesen funktionieren |
| Zweiter Tab | hält: Änderungen aus Tab A erscheinen live in Tab B und umgekehrt |
| Layoutsprung der Startseite beim Erstbesuch (R17-H1) | nicht mehr zu beobachten: Layoutverschiebung 0,0004 bis 0,0008 (nur die Kopfnavigation, 0 px) |

## Befunde

### R18-S1 [P2] Die Hauptaktion des Meldekopfs („Bogen scannen…“, „Einheit erfassen“) liegt am Telefon ein bis zwei Bildschirme unter dem Falz

- **Neu oder alt (Verweis):** alt, R17-K12 (teilweise behoben: Lage steht jetzt vor den Knöpfen, die Knöpfe sind dafür weiter nach unten gerückt)
- **Kennzeichnung:** gemessen (Skript `au.js`, 360 x 640; Bildschirmfoto `f1.png`)
- **Ort / Aufgabe:** Einsatzansicht, jede weitere Einheit aufnehmen.
- **Beobachtung:** Oberkante von „Bogen scannen…“ (Seitenkoordinate, Viewport 640 hoch): leerer Einsatz 663 px, mit 1 Einheit 1 018 px, mit 6 Einheiten 1 235 px, mit 12 und 30 Einheiten 1 259 px; nach „Zur Kenntnis genommen“ 825 bis 849 px. „Einheit manuell erfassen…“ je 65 px tiefer. Beim leeren Einsatz zeigt die erste Bildschirmseite Kopf, fünf Nullkacheln, „Bedarf: Verpflegung 0“ und zwei Sprungverweise („Zur Einheitenliste ↓“, „Weitergeben, Lageblatt, Export ↓“), aber keinen Weg zum Erfassen; der Sprung „Zur Einheitenliste“ führt zur (leeren) Liste, nicht zu den Erfassungsknöpfen. Bei 390 x 844 und leerem Einsatz liegt der Knopf bei 628 px und ist sichtbar, mit 6 Einheiten bei 1 248 px.
- **Erwartung der Rolle:** Beim Eintreffen der nächsten Einheit tippe ich auf „Einheit aufnehmen“, ohne zu suchen und ohne zu scrollen.
- **Folge im Einsatz:** Bei jeder eintreffenden Einheit scrollt der Meldekopf an Kennzahlen, Neu-Block und Bedarf vorbei (rund zwei Bildschirmhöhen), mit einer Hand und mitten im Gespräch. Wer die Knöpfe nicht sofort findet, tippt auf einen Sprungverweis, der woanders hinführt.
- **Empfehlung:** Einen festen oder oben stehenden Knopf „Einheit aufnehmen“ (öffnet Scannen und Erfassen) in die erste Bildschirmseite; die Sprungverweise sollen auch einen Weg zum Erfassen nennen.
- **Nachprüfung:** 360 x 640, leerer Einsatz und Einsatz mit 12 Einheiten: ein Erfassungsknopf liegt ohne Scrollen im Bild.

### R18-S2 [P3] Die Quittungsleiste schrumpft nach 15 s zu einer abgeschnittenen Zeile und bleibt danach stehen, auch nach Stunden

- **Neu oder alt (Verweis):** alt, R17-W1 und R17-S8 (teilweise: die Zeile „Zuletzt abgelegt … jetzt“ verschwindet, die Leiste nicht)
- **Kennzeichnung:** gemessen (Skripte `at.js`, `q2.js`; verstellte Uhr 45 Min und 3 h 45 Min)
- **Ort / Aufgabe:** Einsatzansicht nach „Zahlen stimmen, so gezählt“ (gleich bei Zug zuordnen, Entfernen, Abrücken).
- **Beobachtung:** Bei 360 x 640 ist die Leiste 84 px hoch mit vollem Text („Als gezählt übernommen: „THW Husum Bergungsgruppe“ mit den Sollzahlen — „Rückgängig“ führt sie wieder als Sollstärke.“). Nach 15 s wird sie 57 px hoch, der Text auf „Als gezählt übernommen:…“ gekürzt (Einheit und Folge nicht mehr lesbar); „Rückgängig“ und „✕“ bleiben. Nach 47 s, 45 Min und 3 h 45 Min steht sie unverändert da. Nach dem Neuladen ist sie weg. Verlässt man den Assistenten, kommt die Leiste wieder mit vollem Text und 84 px.
- **Erwartung der Rolle:** Eine Rückgängig-Leiste ist kurz da und verschwindet; steht sie noch, sagt sie, was sie zurücknimmt.
- **Folge im Einsatz:** Ein dauerhaftes „Rückgängig“ ohne lesbaren Gegenstand verdeckt 9 % des Bildes (57 von 640 px) und lädt nach einer Unterbrechung zum Tipp auf eine Handlung ein, deren Gegenstand man nicht mehr liest.
- **Empfehlung:** Leiste nach einer Frist (etwa 30 s) ausblenden, bis dahin mit Namen der Einheit und der Folge in zwei Zeilen; danach ist die Handlung über die Historie erreichbar.
- **Nachprüfung:** Einheit ablegen, 60 s warten: Leiste weg oder mit vollem Text; kein „Rückgängig“ mit abgeschnittenem Text nach Stunden.

### R18-S3 [P3] Die Tipp-Sperre von 2,5 s fängt auch „Abbrechen“ ab

- **Neu oder alt (Verweis):** alt, R15-S1 (gewollte Doppeltipp-Sperre; ihre Wirkung auf „Abbrechen“ ist weiter zu sehen)
- **Kennzeichnung:** gemessen (Skripte `o4.js`, `o5.js`, `o6.js`, 390 x 844)
- **Ort / Aufgabe:** Dialog „Nur Sollplätze, keine gemeldete Stärke“ (gleich für andere Rückfragen), Tipp auf „Abbrechen“ unmittelbar nach dem Öffnen.
- **Beobachtung:** Tipp auf „Abbrechen“ 0,3 bis 2 s nach dem Öffnen: Der Dialog bleibt, ein Hinweis „Einen Moment …“ liegt über der Beschriftung des Knopfes. Nach 2,5 s schließt derselbe Tipp den Dialog. Ebenso wirkungslos ist der erste Tipp auf „Zahlen stimmen, so gezählt“ (bis 1,5 s) und „Als Sollstärke ablegen“.
- **Erwartung der Rolle:** Wer versehentlich einen Dialog öffnet, kommt sofort wieder heraus. Die Sperre schützt die gefährliche Antwort, nicht den Ausstieg.
- **Folge im Einsatz:** Wer den Dialog aus Versehen geöffnet hat und sofort „Abbrechen“ tippt, sieht nur „Einen Moment …“ und tippt ein zweites und drittes Mal, möglicherweise schon auf einen anderen Knopf des Dialogs.
- **Empfehlung:** „Abbrechen“ und „Schließen“ nie sperren; nur die folgenreichen Antworten.
- **Nachprüfung:** Dialog öffnen, nach 300 ms „Abbrechen“ tippen: Der Dialog schließt.

### R18-S4 [P3] Die Rückfrage „Nur Sollplätze, keine gemeldete Stärke“ ist ein Textblock von knapp einem Bildschirm mit vier Knöpfen

- **Neu oder alt (Verweis):** alt, R17-S1 (Rest: Inhalt jetzt richtig, Umfang hoch)
- **Kennzeichnung:** gemessen (Skript `an.js`; Bildschirmfoto `n2.png`)
- **Ort / Aufgabe:** Schnellerfassung (oder Einheit manuell) → Schritt 3 „Nur Stärke“ → „In Einsatz übernehmen“.
- **Beobachtung:** Die Rückfrage nennt Einleitung (vier Zeilen), drei Aufzählungspunkte mit je zwei bis vier Zeilen und vier Knöpfe („Stärke jetzt eintragen“, „Als Sollstärke ablegen“, „Zahlen stimmen, so gezählt“ in Rot, „Abbrechen“). Bei 360 x 640 ist der Dialog 608 von 640 px hoch, die Knöpfe beginnen bei 350 px; bei 390 x 844 sind es rund 150 Wörter bis zur Entscheidung.
- **Erwartung der Rolle:** Zwei Sätze und eine klare Hauptantwort; die Folgen stehen am Knopf, nicht in einer Liste davor.
- **Folge im Einsatz:** Wer in 10 bis 20 s entscheiden muss, liest nur den Titel und tippt die dunkle erste Antwort. Die Wahl zwischen „Sollstärke“ und „so gezählt“ hängt an einem langen Text, den niemand liest.
- **Empfehlung:** Je Antwort einen Knopf mit einer Unterzeile (ein Satz); die Liste entfällt.
- **Nachprüfung:** Dialog höchstens 60 % des Bildes bei 360 x 640; jede Antwort mit Folge am Knopf.

### R18-S5 [P3] Gesperrter Knopf „Zuordnen“ ohne Grund

- **Neu oder alt (Verweis):** neu (Gegenstück: bei „Einsatz anlegen“ steht der Grund unter dem Knopf)
- **Kennzeichnung:** gemessen (Skript `ap.js`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht → Block „Zug für N Einheiten ohne Zug:“ → „Zuordnen“ bei leerem Feld.
- **Beobachtung:** Der Knopf ist `disabled` (gestrichelt, gedämpft). Ein Tipp darauf bewirkt nichts und zeigt nichts. Der Grund steht nur im Platzhalter des Feldes („Zug für alle, z. B. 3. Zug“), der verschwindet, sobald man tippt.
- **Erwartung der Rolle:** Ein gesperrter Knopf sagt, was fehlt.
- **Folge im Einsatz:** Wer „Zuordnen“ tippt und nichts sieht, hält die App für hängend und tippt mehrfach.
- **Empfehlung:** Unter dem Feld „Erst den Zugnamen eintragen“ zeigen oder den Tipp mit einem Hinweis beantworten.
- **Nachprüfung:** Feld leer, „Zuordnen“ tippen: Hinweis sichtbar.

### R18-S6 [P3] Schnellerfassung: „Weiter“ überspringt Schritt 2, „←“ landet auf dem als „entfällt“ markierten Schritt 2

- **Neu oder alt (Verweis):** alt, R17-S12 (teilweise: der Rückweg von Schritt 4 stimmt jetzt, der von Schritt 3 nicht)
- **Kennzeichnung:** gemessen (Skripte `az.js`, `ba.js`, 360 x 640)
- **Ort / Aufgabe:** „Einheit schnell erfassen (nur Stärke)…“ → Ort und Typ → „Weiter“ → „←“.
- **Beobachtung:** „Weiter“ führt von Schritt 1 auf 3. „←“ von Schritt 3 führt auf „2. Einsatz“ mit dem vollen Formular (Zeitraum von / bis), obwohl die Kopfzeile sagt: „„–“ heißt: Schritt 2 und 5 entfallen hier.“ Von Schritt 4 führt „←“ auf 3 (richtig). Schritt 4 hat kein „Weiter“, nur „In Einsatz übernehmen“.
- **Erwartung der Rolle:** Zurück führt auf den Schritt, aus dem ich gekommen bin.
- **Folge im Einsatz:** Wer in Schritt 3 „←“ tippt, um den Ort zu korrigieren, landet auf einer Seite, die laut Kopf nicht vorkommt, und sucht den Ort dort.
- **Empfehlung:** „←“ springt wie „Weiter“ über entfallende Schritte.
- **Nachprüfung:** Von Schritt 3 „←“ tippen: Schritt 1.

### R18-S7 [P3] „Namen einfügen…“: Die vorgewählte Reihenfolge vertauscht eine Liste „Nachname Vorname“ mit einem Tipp; die Vorschau liest sich wie eine Vertauschung

- **Neu oder alt (Verweis):** alt, R17-S7 (teilweise: Funktionswörter und Kommazeilen werden richtig gelesen; die Reihenfolge ohne Komma bleibt geraten)
- **Kennzeichnung:** gemessen (Skript `bc.js`, 390 x 844)
- **Ort / Aufgabe:** Schritt 3 → „Namen einfügen…“ → drei Zeilen „Meier Hans GrFü“, „Kaya Anna“, „Weber Jonas“.
- **Beobachtung:** „Vorname Nachname“ ist vorgewählt. Die Vorschau zeigt „Hans, Meier · GrFü“, „Anna, Kaya“, „Jonas, Weber“, also „Nachname, Vorname“ (nach der vorgewählten Lesart ist „Hans“ der Nachname). Die Überschrift sagt „bitte bestätigen“, ein Bestätigungsschritt gibt es nicht; „3 Personen übernehmen“ führt direkt zu Vorname = „Meier“, Nachname = „Hans“. Jede Zeile trägt die Marke „Reihenfolge prüfen“.
- **Erwartung der Rolle:** Ich sehe die Namen so, wie ich sie eingefügt habe, und die App fragt, bevor sie etwas vertauscht.
- **Folge im Einsatz:** Namen und Rufnummern stehen vertauscht im Bogen und im Export; wer nur den Knopf „Personen übernehmen“ tippt, bemerkt es erst bei der Übersicht.
- **Empfehlung:** Keine Vorauswahl bei Zeilen ohne Komma (der Knopf bleibt gesperrt, bis eine Reihenfolge gewählt ist); die Vorschau zeigt „Vorname Nachname“ in der gewählten Lesart.
- **Nachprüfung:** Zeilen ohne Komma einfügen: „Personen übernehmen“ erst nach einer Wahl.

### R18-S8 [P3] Kennzahlenzeile bricht bei 360 px in 3 + 2 Zellen, die zweite Zeile sitzt versetzt

- **Neu oder alt (Verweis):** alt, R17-K12 (Teilpunkt: Kennzahlenzeile)
- **Kennzeichnung:** gemessen (Bildschirmfoto `f1.png`, `ay1.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht, Kennzahlen (Einheiten, Führer, Unterf., Mannsch., Gesamt).
- **Beobachtung:** Erste Zeile: Einheiten, Führer, Unterf.; zweite Zeile: Mannsch., Gesamt mit leerer dritter Zelle. Die Zellen der zweiten Zeile beginnen um etwa 6 bis 12 px weiter rechts als die der ersten (Zahlen bei x 79 und 90, 277 und 289 in 2fach-Pixeln gelesen).
- **Erwartung der Rolle:** Fünf Zahlen in einer Zeile oder in einem ruhigen Raster.
- **Folge im Einsatz:** Gering; die Gesamtzahl sitzt unter „Führer“ statt am Ende der Zeile und wird beim schnellen Blick leichter mit den Zahlen darüber verwechselt.
- **Empfehlung:** Zellen am Raster ausrichten, „Gesamt“ hervorheben und an den Zeilenanfang setzen.
- **Nachprüfung:** 360 x 640: Spalten der zweiten Zeile fluchten mit denen der ersten.

### R18-S9 [P3] Scanner ohne Kamera: „Kamera erneut versuchen“ liegt auf dem Rand des gestrichelten Rahmens

- **Neu oder alt (Verweis):** neu
- **Kennzeichnung:** gemessen (Bildschirmfoto `ad1.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatz → „Bogen scannen…“ auf einem Gerät ohne nutzbare Kamera.
- **Beobachtung:** Der Hinweis „Dieses Gerät meldet keine nutzbare Kamera.“ und der Handscanner-Rahmen sind klar; der Knopf „Kamera erneut versuchen“ überdeckt die untere Kante des gestrichelten Rahmens (Knopf y 532 bis 575 px, Rahmenkante bei etwa 550 px), darunter „QR aus Bild einlesen…“ und „Fertig“.
- **Erwartung der Rolle:** Knopf und Rahmen stehen getrennt.
- **Folge im Einsatz:** Gering; der Rahmen wirkt kaputt, der Knopf gehört scheinbar zum Handscanner-Feld.
- **Empfehlung:** Knopf unter den Rahmen mit Abstand setzen.
- **Nachprüfung:** 360 x 640: Abstand zwischen Rahmenunterkante und Knopf mindestens 8 px.

### R18-S10 [P3] Tabellenansicht am Telefon ist reine Ansicht; Zeilen reagieren auf keinen Tipp

- **Neu oder alt (Verweis):** neu (verwandt mit R17-K7, das die Breite behoben hat)
- **Kennzeichnung:** gemessen (Skript `af.js`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht → „Tabelle“ → Zeile antippen, um die Einheit zu öffnen oder abzurücken.
- **Beobachtung:** Keine Zeile enthält einen Knopf oder Verweis; ein Tipp auf die Zeile bewirkt nichts. Abrücken, Zug, Notiz und Entfernen sind nur in der Kartenansicht erreichbar. Ein abgerückte Einheit steht am Tabellenende mit der Marke „ABGERÜCKT“ und „—“ bei der Meldezeit.
- **Erwartung der Rolle:** Tippe ich in der Tabelle auf eine Einheit, öffnet sie sich.
- **Folge im Einsatz:** Wer die Tabelle für den Überblick gewählt hat, tippt zweimal ins Leere und wechselt dann zu den Karten.
- **Empfehlung:** Zeilen antippbar machen (zur Karte springen und aufklappen) oder einen kurzen Hinweis „Nur Übersicht — Aktionen in der Kartenansicht“ über der Tabelle.
- **Nachprüfung:** Zeile antippen: Karte der Einheit wird aufgeklappt.

### R18-S11 [P3] Aufgeklappte Karte bei 360 px: Aktionsknöpfe in fünf Zeilen, „Abrücken“ allein in der Mitte

- **Neu oder alt (Verweis):** neu (verwandt mit R17-H7/K6, Aktionsknöpfe der Karte)
- **Kennzeichnung:** gemessen (Skript `t.js`, Bildschirmfoto `t1.png`, 360 x 640)
- **Ort / Aufgabe:** Einsatzansicht → Karte aufklappen → „Abrücken“.
- **Beobachtung:** Die Aktionsknöpfe stehen in fünf unterschiedlich langen Zeilen: „Zuklappen, Details“ / „Bogen als PDF“ / „Abrücken“ / „Zug zuordnen, Auftrag/Notiz“ / „Mehr…“. Die Knöpfe sind 44 px hoch mit 12 px Abstand; der Block ist etwa 440 px hoch, rund 70 % des Bildes. „Abrücken“, die häufigste Handlung, steht allein zwischen „Bogen als PDF“ und „Zug zuordnen“; „Entfernen“ liegt hinter „Mehr…“ (richtig).
- **Erwartung der Rolle:** Die häufigsten Handlungen stehen oben und nebeneinander.
- **Folge im Einsatz:** Gering; kostet Scrollen und erhöht die Chance, bei hastigem Tipp „Bogen als PDF“ oder „Zug zuordnen“ statt „Abrücken“ zu treffen.
- **Empfehlung:** „Abrücken“ und „Zug zuordnen“ in eine Zeile, „Bogen als PDF“ und „Details“ unter „Mehr…“.
- **Nachprüfung:** 360 x 640: höchstens drei Zeilen Aktionsknöpfe; „Abrücken“ in der ersten.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Ein gesperrter oder gesperrt wirkender Knopf („Zuordnen“, „Abbrechen“ innerhalb der ersten 2,5 s) wird als „App hängt“ gelesen.
- **Größtes Einsatzrisiko:** Die Hauptaktion des Meldekopfs liegt am Telefon unter dem Falz; bei jeder eintreffenden Einheit kostet das Suchen und Scrollen Aufmerksamkeit.
- **Top-Priorität für die nächste Iteration:** R18-S1, ein fest sichtbarer Knopf „Einheit aufnehmen“ in der Einsatzansicht.
