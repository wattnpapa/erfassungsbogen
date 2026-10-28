# Audit „Analog first“, Runde 21 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-29 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173 (`vite preview`), Code-Stand Commit `f007590` (`main`).

Zählung: **P0 1 · P1 0 · P2 0 · P3 9 · Hinweise 5** (10 Befunde R21-A1 bis R21-A10: 6 neu, 4 alt mit Verweis).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, der Abschnitt „Stand der Behebung“ in
`runde-20/README.md` und `runde-20/analog-first.md`. Gemeldet ist alles, was im Browser noch zu beobachten war, auch Punkte,
die dort als „offen“ oder „nicht ganz erreicht“ stehen (mit alter Befund-ID). Behebungen, die im Browser nicht mehr zu
beobachten sind, sind nicht gemeldet. Je Sachverhalt ein Befund, mit Typ (Daten/Verlust, Bedienung, Layout/Abstand, Text,
Kontrast). Geschmacksfragen stehen als „Hinweis“ ohne Priorität im eigenen Abschnitt.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` bzw. `launchPersistentContext` ohne Optionen; die Projektkopie findet keinen
Browser, deshalb das globale Modul `/opt/node22/lib/node_modules/playwright`), `isMobile`/`hasTouch`, Locale de-DE,
Viewports 390 × 844, 360 × 640, 320 × 568, Querformat 640 × 360, 568 × 320, 844 × 390. Je Szenario ein frisches oder
kopiertes Profil. Einsatz-Sammlung „Hochwasser Test“ mit sechs THW-Beispielbögen aus `examples/thw/` (Kopien mit
`uebung: false`, „Stand“ 30 bis 70 Minuten alt), über „Bögen einlesen…“ aufgenommen, dazu „THW Oldenburg“ per
Schnellerfassung. Geprüft:

- Voller Speicher (`localStorage` bis zum Quota-Fehler gefüllt): Bogen schließen, Bogen ersetzen („Neuen Bogen“ bei
  vorhandenem Entwurf), geschlossenen Bogen zurückholen, Einsatz löschen mit „Endgültig löschen…“ im Notweg.
- Schnellerfassung (Schrittzählung, „THW Oldenburg“ als Ort), „Ort der Einheit ändern…“.
- Scanner ohne Kamera quer (640 × 360, 844 × 390) und hoch; Vollassistent quer, alle Schritte, Standard und „Feld“.
- Dialoge bei 320 × 568 (Stärke, Als Übung, Ort, Entfernen, Übergabe, Einsatz löschen, Datensicherung).
- Tabelle am Telefon (360 und 390).
- Nachgeladene Teile: Kaltstart mit gedrosseltem Netz und CPU (Bild-für-Bild, Layout-Shift-Messung), Zeichensammlung im
  Assistenten (Schritt 4), Einsatzansicht; **Offline**: Erstbesuch online bis „✓ Jetzt offline bereit“, dann Netz getrennt,
  einmal im geladenen Zustand (ohne Neuladen) und einmal nach Neuladen im Offline-Zustand; Lageblatt, Sammel-PDF, CSV,
  Excel, Bogen-PDF, Blanko-PDF, Scanner, Datensicherung.
- Dateien mit `pdftotext -layout` und `pdfinfo` gelesen (Lageblatt 2 Seiten A4 quer, Sammel-PDF 16 Seiten).

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; das Lageblatt hängt an der Wand; die Nr. ist der
Schlüssel zwischen Papier, Funk und Gerät; der Meldekopf kann im Funkloch stehen und das Gerät (oder der Browser-Tab) wird
dort neu geladen.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle,
Zeitverhalten auf einem echten Telefon (gedrosselt nachgestellt), Aussehen nativer Zeit- und Datumsfelder. Die Hinweise
„Anderer Einsatz?“, „Zeitraum vorbei“, „Kennzeichen doppelt“, „Sitzplätze fehlen“ an den Beispielbögen sind Artefakte der
Beispieldaten und nicht gewertet.

## Urteil

Die Papierseite trägt, und die Behebungen der Runde 20 halten fast durchweg: Bei vollem Speicher bleibt der geschlossene,
ersetzte und zurückgeholte Bogen erhalten, „Endgültig löschen…“ fragt nach, „THW THW Oldenburg“ ist weg, „Ort der Einheit
ändern…“ wirkt, Scanner und Assistent passen quer ohne inneres Scrollen, Dialoge und Tabelle sind bei 320 und 360 px in
Ordnung, im geladenen Zustand läuft alles offline. **Ein Befund wiegt aber schwer:** Wird die Seite im Funkloch neu geladen,
lässt sich der Einsatz nicht mehr öffnen (R21-A1). Dagegen ist das Papier die einzige Rückfallebene, und genau darauf
verlässt sich der Hinweis „✓ Funktioniert komplett offline“ auf der Startseite. Der eigene Einzelbogen, das Blanko-PDF und
die Datensicherung bleiben offline benutzbar. Ohne fremde Hilfe ist die Aufgabe „Lage digital führen“ in diesem Zustand
nicht zu erledigen, wohl aber „Papier weiterführen und später nacherfassen“.

## Prüfung der Behebungen aus Runde 20 (nur Zusammenfassung, kein Befund)

| Befund | Ergebnis |
| --- | --- |
| R20-D1 Ablage bei vollem Speicher (schließen, ersetzen, zurückholen) | hält (gemessen): geschlossener Bogen steht als „Zuletzt geschlossener Bogen“ auf der Startseite, auch nach Neuladen; beim Ersetzen und Zurückholen wandert der bisherige Entwurf in `eeb.entwurf.ersetzt.v1`, nichts geht verloren |
| R20-W1 „Endgültig löschen…“ im Notweg | hält: Rückfrage „Hochwasser Test endgültig löschen? … das wäre die einzige Kopie“ mit „Ja, endgültig löschen“ und „Einsatz behalten“ (Zahl der Meldungen siehe R21-A7) |
| R20-H1 „THW THW Oldenburg“ | hält: Karte „Nr. 7 THW Oldenburg“; Ort mit Vorsilbe „THW Bremen“ ergibt „Nr. 7 THW Bremen“ |
| „Ort der Einheit ändern…“ | hält: Dialog, Historie, „Ort der Einheit am Meldekopf geändert“ auf der Karte |
| Scanner ohne Kamera quer | hält: 640 × 360 und 844 × 390 füllen genau, kein inneres Scrollen, „Fertig“ erreichbar |
| Assistent quer (Standard und Feld) | hält: „Ort der Einheit (Pflicht)“ liegt über der Fußleiste (Rest siehe R21-A5, R21-A6) |
| Dialoge bei 320 px | halten: Breite und Höhe passen, Knöpfe 119 × 44 bis 77 px, kein seitlicher Überlauf |
| Tabelle am Telefon | hält: Dokument 360 px, Namen umbrochen, „Alle Spalten zeigen“ scrollt nur in der Tabelle |
| Startseite, Aufnahmeknöpfe | hält: „Neuen Bogen erstellen“ bei y = 351 (360 × 640), auch bei beendetem, übergebenem Einsatz |
| Kartenwarnung „Stand vor …“ (R20-A3) und „ganz zeigen“ (R20-A4) | halten: einheitlich „⚠ Stand vor …“, „ganz zeigen“ 92 × 44 |
| Offline, Einsatz im geladenen Zustand | hält: Lageblatt, Sammel-PDF, CSV, Excel, Bogen-PDF ohne Absturz; Zeichensammlung im Assistenten sofort „geladen“, kein Sprung |
| Offline nach Neuladen | **hält nicht**, siehe R21-A1 |

## Befunde

### R21-A1 [P0, Bedienung] Offline nach Neuladen: Einsatz lässt sich nicht öffnen („Hier ist etwas schiefgelaufen“), jeder weitere Neuladen führt wieder dorthin

- **Neu oder alt (Verweis):** neu. Folge der Verkleinerung des Startbündels (R20, „Nachgeladene Teile“); in R20-analog-first hielt „Offline: Neuladen zeigt den Einsatz“ noch.
- **Ort:** Startseite und Einsatzansicht, Netz getrennt, Seite neu geladen (Tab vom Telefon verworfen, Browser neu gestartet, „Neu laden“).
- **Beobachtung (gemessen, mehrfach, mit und ohne Einsatz-Vorgeschichte):** Erstbesuch online, Meldung „✓ Jetzt offline bereit“, Service-Worker aktiv, 659 Einträge im Cache. Netz getrennt, Seite neu geladen: Die Startseite erscheint und trägt „✓ Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät.“. Tipp auf „Öffnen“ der Einsatz-Sammlung, oder „Neue Einsatz-Sammlung… → Einsatz anlegen“, ergibt den Fehlerbildschirm „Hier ist etwas schiefgelaufen — Die Ansicht ließ sich nicht aufbauen. Deine Daten liegen weiter auf diesem Gerät“. Hat die Sammlung in den letzten Stunden offen gestanden, öffnet jeder Neuladen sie wieder und landet im selben Fehler; „Neu laden“ hilft nicht, „Zur Startseite“ führt zurück zur Startseite, ein erneutes „Öffnen“ stürzt wieder ab. Ursache in der Konsole: `Unable to preload CSS … /assets/index-Bp0pLAQP.css`. Das Stylesheet wird vom nachgeladenen Teil der Einsatzansicht (`einsaetze-ui-….js`) angefordert, liegt aber weder im Build-Ordner `dist/assets` noch im Offline-Zwischenspeicher; online beantwortet der Server die Anfrage mit der Startseite (`text/html`), was der Browser hinnimmt, offline scheitert die Anfrage. Ohne Neuladen (Teil schon im Speicher) laufen Lageblatt, Sammel-PDF, CSV, Excel und Bogen-PDF offline; der eigene Einzelbogen, Blanko-PDF, QR-Scanner, Datensicherung und die Anleitung laufen offline auch nach Neuladen.
- **Erwartung der Rolle:** Was „komplett offline“ heißt, gilt auch nach einem Neustart des Geräts oder des Tabs im Funkloch; der Einsatz liegt auf dem Gerät und öffnet sich.
- **Folge im Einsatz:** Im Funkloch (typisch: Keller, Tal, Katastrophenlage mit überlastetem Netz) kann ein verworfener Tab, ein leerer Akku mit Neustart oder ein Browserabsturz die Einsatzführung auf dem Gerät beenden: Die Lage ist nicht mehr sichtbar, kein Lageblatt, kein Sammel-PDF, keine Nacherfassung. Die Daten bleiben erhalten (nur „Daten sichern“ und „Löschen…“ erreichbar), aber der Meldekopf muss auf Papier weiterarbeiten, ohne zu wissen, dass die Software sich so verhält; die Startseite behauptet das Gegenteil.
- **Empfehlung:** Alles, was die Einsatzansicht beim Öffnen braucht, muss auch nach Neuladen ohne Netz da sein (die Anfrage des Teils nach seinem Stylesheet muss aus dem Offline-Speicher bedient werden oder entfallen). Bis dahin die Zusage „funktioniert komplett offline“ auf die tatsächlich verfügbaren Teile beschränken.
- **Verifikation:** Erstbesuch online bis „Jetzt offline bereit“, Netz trennen, Seite neu laden, „Öffnen“ und „Neue Einsatz-Sammlung… → Einsatz anlegen“, danach Neuladen im Einsatz: die Einsatzansicht öffnet sich jedes Mal; Lageblatt und Sammel-PDF entstehen.

### R21-A2 [P3, Layout/Abstand] Kaltstart mit offenem Einsatz: Startseite blitzt auf, dann leere Seite mit Fußzeile, dann die Einsatzansicht (Sprung 0,3)

- **Neu oder alt (Verweis):** neu. Folge des Nachladens der Einsatzansicht.
- **Ort:** Neuladen oder Start, wenn die Sammlung in den letzten Stunden offen stand (360 × 640).
- **Beobachtung (gemessen, `MutationObserver` und Layout-Shift-API):** Reihenfolge ohne Drosselung: Startseite (80 ms), seitenlose Ansicht nur mit Fußzeile „DATEN / Datensicherung / Beispielbögen …“ (190 ms, Dokumenthöhe 1 778 statt 5 300 px, kein Platzhalter im Hauptbereich), Einsatzansicht (280 ms). Layout-Shift-Wert 0,3. Bei 4-facher CPU-Drosselung dauert jede der beiden ersten Zustände rund 350 ms (Startseite 210 bis 560 ms, leere Seite 560 bis 910 ms), bei 100 kB/s und 300 ms Latenz kamen sie als entformatierte Startseite (Stylesheet noch nicht da) und danach als Fußzeile allein. Nach dem ersten Laden ist die Einsatzansicht stabil; die Zeichen im Assistenten sind sofort da (kein Platzhalter sichtbar, Zeile springt nicht).
- **Erwartung der Rolle:** Der erste sichtbare Bildschirm ist der, den ich öffne, oder ein ruhiger Platzhalter an seiner Stelle.
- **Folge im Einsatz:** Auf einem schwächeren Telefon blitzen für rund eine halbe Sekunde Startseitenknöpfe an der Stelle der späteren Aufnahmeknöpfe auf; ein früher Tipp trifft „Neuen Bogen erstellen“ oder „Neue Einsatz-Sammlung…“ statt „Einheit manuell erfassen…“.
- **Empfehlung:** Beim Wiederöffnen des Einsatzes keine Startseite zeigen, sondern einen ruhigen Platzhalter (Kopf mit Einsatzname) bis die Ansicht da ist, damit die Fußzeile nicht allein steht.
- **Verifikation:** Kaltstart mit offenem Einsatz bei vierfacher CPU-Drosselung: kein Zwischenbild der Startseite, Layout-Shift unter 0,1.

### R21-A3 [P3, Text] Schnellerfassung zählt „Schritt 2 von 4“, die Überschrift darunter heißt „3. Personal“

- **Neu oder alt (Verweis):** alt, R20-A2 / R19-A5 / R19-A6 (teilweise behoben: „1 von 4“ stimmt jetzt, „entfallen“ ist weg, aber die Nummern widersprechen sich).
- **Ort:** „Einheit schnell erfassen (nur Stärke)…“, Kopfzeile und Karte, 360 × 640.
- **Beobachtung (gemessen):** Kopf „Schritt 2 von 4: Personal“, Überschrift der Karte „3. Personal“; Kopf „Schritt 3 von 4: Fahrzeuge“, Überschrift „4. Fahrzeuge“. Die Rückfrage „Stärke fehlt“ sagt „Springt zu „3. Personal““ bei „Schritt 2 von 4“.
- **Erwartung der Rolle:** Eine Zählung. Wer „Schritt 2“ liest und „3.“ sieht, sucht den Schritt dazwischen.
- **Folge im Einsatz:** Kleiner Zweifel, ob etwas übersprungen wurde; am Meldekopf unter Zeitdruck ein Anlass, zurückzugehen.
- **Empfehlung:** Dieselbe Nummer in Kopf, Überschrift und Rückfrage.
- **Verifikation:** Schnellerfassung durchklicken: Kopfzahl und Überschrift gleich, Rückfrage nennt dieselbe Nummer.

### R21-A4 [P3, Layout/Abstand] Einheitenliste beginnt am 360 × 640-Display erst bei y = 1 049

- **Neu oder alt (Verweis):** alt, R20-W6 / R20-H5 / R20-G6 (teilweise behoben: 1 209 px, jetzt 1 049 px; Ziel unter 960 px nicht erreicht).
- **Ort:** Einsatzansicht, 360 × 640, sieben Einheiten, vier davon „älter als 1 Std“.
- **Beobachtung (gemessen):** Die erste Karte „Nr. 2 …“ liegt bei y = 1 049, also gut eine Bildschirmhöhe plus ein Drittel unter dem Seitenanfang. Davor: Kopf, Kennzahlen, vier Aufnahmeknöpfe (je 57 px), „Neu seit der letzten Kenntnisnahme“, „Bedarf“, zwei Sprungverweise, Karten/Tabelle, Filter.
- **Erwartung der Rolle:** Nach dem Einlesen sehe ich die Einheit, die ich eben aufgenommen habe, ohne zu suchen.
- **Folge im Einsatz:** Wer nach „Zuletzt abgelegt: Nr. 7 …“ nachsehen will, scrollt zwei Bildschirme; die Quittung „Rückgängig“ deckt zudem 60 px ab.
- **Empfehlung:** Aufnahmeknöpfe auf zwei Reihen oder „Bedarf“ einklappen, bis die erste Karte im ersten Bild steht.
- **Verifikation:** 360 × 640, sieben Einheiten: Oberkante der ersten Karte kleiner 640 px, oder mindestens deren Name sichtbar.

### R21-A5 [P3, Layout/Abstand] „Entwurf vom … wiederhergestellt“ bleibt auf jedem Schritt der Aufnahme stehen und belegt 75 bis 80 px

- **Neu oder alt (Verweis):** neu.
- **Ort:** „Einheit manuell erfassen…“ und „Einheit schnell erfassen…“ im Einsatz, nach Neuladen oder Wiederöffnen; alle Schritte.
- **Beobachtung (gemessen):** Der Kasten „Entwurf vom 28.10.26, 12:26 Uhr wiederhergestellt. Die Aufnahme läuft dort weiter, wo du warst.“ erscheint auch bei einem leeren Formular, bleibt nach Eingaben, nach „Weiter“ und nach 10 s auf allen Schritten stehen und lässt sich nicht schließen. 360 × 640: 75 px; Querformat 640 × 360: 75 px bei 360 px Höhe, im ersten Bild sehen Schritt 1 und 3 nur noch Kopf, Kasten und ein bis zwei Felder.
- **Erwartung der Rolle:** Ein Hinweis, der einmal gesagt wird und dann verschwindet.
- **Folge im Einsatz:** Der Platz fehlt im Querformat, wo ohnehin nur ein Feld sichtbar ist.
- **Empfehlung:** Nach der ersten Eingabe oder dem ersten Schritt ausblenden, bei leerem Entwurf gar nicht zeigen.
- **Verifikation:** Entwurf ablegen, neu laden: Kasten erscheint einmal und ist nach „Weiter“ weg.

### R21-A6 [P3, Layout/Abstand] Fußleiste Schritt 5 in „Feld“ quer (640 × 360): „In Einsatz übernehmen“ bricht mitten im Wort um, Leiste wächst auf 84 px

- **Neu oder alt (Verweis):** alt, verwandt mit R19-M1 (Fußleiste, Beschriftung läuft aus dem Knopf), dort für Standard und 360/320 behoben; hier Feld, Querformat.
- **Ort:** Vollassistent in der Einsatz-Aufnahme, Ansicht „Feld“, 640 × 360, Schritt 5 „Sofortbedarf & Sonstiges“.
- **Beobachtung (gemessen):** Der Knopf misst 127 × 73 px, die Beschriftung bricht in vier Zeilen („In / Einsa / tz / überne / hmen“); die Leiste ist 84 statt 65 px hoch (Schritte 1 bis 4: 184 × 48 px, einzeilig). Bei 568 × 320 bricht nichts.
- **Erwartung der Rolle:** Die Hauptaktion der Aufnahme bleibt lesbar.
- **Folge im Einsatz:** Der Knopf ist erkennbar, die Beschriftung nicht; die Leiste verdrängt zusätzlich 19 px des ohnehin kleinen Inhalts.
- **Empfehlung:** Auf Schritt 5 die Beschriftung zweizeilig an Wortgrenzen oder kürzer.
- **Verifikation:** 640 × 360, Ansicht „Feld“, Schritt 5: kein Umbruch im Wort, Leistenhöhe wie auf Schritt 4.

### R21-A7 [P3, Text] „Einsatz löschen“ nennt 7 Einheiten, „endgültig löschen“ danach 8 Meldungen

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatz löschen → Papierkorb-Rückfrage, Notweg „Endgültig löschen…“ bei vollem Speicher (360 × 640 und 320 × 568).
- **Beobachtung (gemessen):** Erste Rückfrage: „„Hochwasser Test“ mit 7 gemeldeten Einheiten wandert in den Papierkorb …“. Nach „Endgültig löschen…“: „8 Meldungen sind danach weg — nicht im Papierkorb, nicht rückholbar“. Die Liste zeigt „Einheiten (7 gemeldet · 7 anwesend)“; der Unterschied sind die Fassungen (Nr. 7 hat nach „Ort ändern“ zwei Stände, „Historie (2)“). Zahl und Wort wechseln, ohne dass das gesagt wird.
- **Erwartung der Rolle:** In der unumkehrbaren Rückfrage steht dieselbe Zahl wie in der Liste, oder der Unterschied wird erklärt.
- **Folge im Einsatz:** Der Meldekopf zählt 7 Karten und liest 8; vor einem Löschen ohne Kopie wirft das Zweifel auf.
- **Empfehlung:** „7 Einheiten (mit allen früheren Fassungen)“.
- **Verifikation:** Einheit ändern, dann Einsatz endgültig löschen: Zahlen in beiden Rückfragen stimmen oder erklären sich.

### R21-A8 [P3, Text] Lageblatt lässt bei Bemerkungen den zweiten Satz weg („… Rest: Sammel-PDF“)

- **Neu oder alt (Verweis):** alt, R20-A5 (teilweise behoben: schneidet jetzt an der Satzgrenze, nicht mehr mitten im Satz).
- **Ort:** Lageblatt (A4 quer), Spalte „Auftrag / Notiz (Bemerkung der Einheit)“, Nr. 2 und Nr. 4.
- **Beobachtung (gemessen, `pdftotext`):** Nr. 2: „(2 Helfer über StAN-Soll [Reserve aktiviert]. … Rest: Sammel-PDF)“; Nr. 4: „(2 Sollplätze unbesetzt. … Rest: Sammel-PDF)“. Auf der Karte und in der Sammel-PDF steht der volle Text; der weggelassene zweite Satz lautet „PKW OV zusätzlich über …“ bzw. „Anh Plane/Spriegel in Instandsetzung — nicht mit ausgerückt“.
- **Erwartung der Rolle:** Das Wandblatt nennt Fahrzeuge, die zusätzlich da sind oder fehlen.
- **Folge im Einsatz:** Das Lageblatt wird gelesen, die Sammel-PDF nicht; ein nicht ausgerückter Anhänger fehlt an der Wand.
- **Empfehlung:** Bemerkungen bis zur Zeilengrenze der Spalte ganz ausschreiben (Spalte breiter) oder Fahrzeugangaben nie weglassen.
- **Verifikation:** Lageblatt mit der Freiburg-Bemerkung: „… nicht mit ausgerückt“ steht auf dem Blatt.

### R21-A9 [P3, Layout/Abstand] Die Speicherzeile „✓ gespeichert“ erscheint etwa zwei Sekunden nach der ersten Eingabe und schiebt den Inhalt um 20 px nach unten

- **Neu oder alt (Verweis):** neu (verwandt mit R19-N14, dort ging es um den Inhalt der Zeile).
- **Ort:** Assistent (eigener Bogen, Aufnahme im Einsatz), erste Eingabe in einem frischen Bogen, 360 × 640.
- **Beobachtung (gemessen, Layout-Shift-Messung):** Beim Wechsel auf „4. Fahrzeuge“ und Tipp auf „+ Fahrzeug hinzufügen“ springt nach rund zwei Sekunden der Reiter-Streifen von y = 56 auf 76 und der Hauptbereich um 20 px nach unten (Layout-Shift-Wert 0,9 laut Browser, weil der ganze Hauptbereich rutscht).
- **Erwartung der Rolle:** Nichts rutscht unter dem Finger.
- **Folge im Einsatz:** Wer in diesem Moment ein Feld oder „Fahrzeug entfernen“ trifft, trifft das Feld daneben; mit Handschuh fällt das kaum auf.
- **Empfehlung:** Platz für die Zeile von Anfang an freihalten.
- **Verifikation:** Neuer Bogen, erste Eingabe, zwei Sekunden warten: kein Layout-Shift.

### R21-A10 [P3, Text] Lageblatt: „Veränderung seit der letzten Meldung“ nennt eine Ortsänderung „weitere: Bemerkung/Sonstiges“

- **Neu oder alt (Verweis):** neu.
- **Ort:** Lageblatt (A4 quer), Zeile Nr. 7 nach „Ort der Einheit ändern…“.
- **Beobachtung (gemessen, `pdftotext`):** „gegenüber 28.10.2026, 12:28: weitere: Bemerkung/Sonstiges“. Die Spalte „Stand der Angaben“ derselben Zeile nennt „Ort der Einheit am Meldekopf geändert 28.10.2026, 12:28“, die Veränderungsspalte nicht; „weitere:“ steht ohne vorherige Aufzählung.
- **Erwartung der Rolle:** Die Spalte sagt „Ort geändert“.
- **Folge im Einsatz:** Auf Papier, ohne Karte, ist unklar, was sich verändert hat.
- **Empfehlung:** „Ort der Einheit geändert“ in der Veränderungsspalte, „weitere:“ nur nach einer Aufzählung.
- **Verifikation:** Lageblatt nach Ortsänderung: Spalte nennt den Ort.

## Hinweise (ohne Priorität)

- **H1, Quittungen liegen übereinander:** Nach „Meldung entfernen“ und „Lageblatt (A4 quer)“ binnen weniger Sekunden liegen „Nr. 1 entfernt · Papierkorb / Rückgängig“ und „✓ Lageblatt erzeugt …“ beide bei y = 580 (60 px hoch); sichtbar ist die erste, der Beleg für die Datei erscheint erst nach ihrem Verschwinden, die Zeile „Lageblatt erstellt 12:53“ in der Liste bleibt. Kein Verlust. Alt, R20-analog-first H1.
- **H2, Schritt 5 zeigt nur „→“:** Auf dem Hauptknopf von Schritt 5 steht bei 360 und 320 px sichtbar nur der Pfeil (zugänglicher Name „Zur Übersicht →“). Alt, R20-mobile-ui H2.
- **H3, Schriftgrade in der Fußleiste „Feld“ quer:** „In Einsatz übernehmen“ in 14,4 px neben „Zurück“ in 17,9 px und „Ansicht“ in 20 px; die wichtigste Aktion ist die kleinste Schrift. Geschmacks- und Ordnungsfrage.
- **H4, „Mehr…“ als Blatt:** Das Blatt mit „Aufteilen… / Stärke ändern… / Ort … ändern… / Entfernen“ sitzt am unteren Rand getrennt von der Karte und hat zwei Schließen-Knöpfe („Weniger“ in der Karte, „Weniger anzeigen“ im Blatt); der Ortsdialog legt sich darüber, „Ort übernehmen“ bricht bei 320 px in zwei Zeilen.
- **H5, Tabelle am Telefon:** Die Kopfzelle „Stärke“ endet bei 360 px am Spaltenrand, in „Bedarf“ stehen einzelne „·“ allein in Zeilen (z. B. „Diesel 80 l · / · / Benzin 80 l“). Lesbar, nicht aufgabenrelevant.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Ankunft einer Einheit am Meldekopf | QR-Code lesen, Nr. vergeben, Stärke ohne Abschreiben | Meldeblock mit Nr., Ort, Uhrzeit, Stärke | „Einheit schnell erfassen“ mit „Angaben vom Zettel“; „THW Oldenburg“ bleibt „THW Oldenburg“, „Ort der Einheit ändern…“ korrigiert nachträglich |
| Lage an der Wand | Lageblatt A4 quer mit Summen (offline erzeugbar) | Whiteboard, Nachtrag von Hand | Nachtrag per Schnellerfassung mit Nr. vom Blatt; Lageblatt kürzt Bemerkungen (R21-A8) |
| Übergabe an die Ablösung | Sammel-PDF (16 Seiten) mit allen Bögen, „Übergabe vermerken…“ | Ausdruck von Sammel-PDF und Lageblatt | „Einsatz importieren…“ aus der Sammel-PDF |
| Gerät oder Tab fällt aus, Neustart im Funkloch | Datensicherung (offline, eine Datei) | Papier-Reserve (Blanko-PDF), Lageblatt auf Papier | **Einsatzansicht öffnet sich offline nicht (R21-A1)**: Wiedereinstieg erst mit Netz oder per Datensicherung auf einem zweiten Gerät |
| Speicher voll | Bogen bleibt beim Schließen, Ersetzen, Zurückholen erhalten; klare Meldung | Lageblatt und Sammel-PDF ausdrucken, dann Platz schaffen | Erst sichern, dann „Endgültig löschen…“ mit Rückfrage (Zahl siehe R21-A7) |

## Würde ich dafür das Papier weglegen?

Nein, noch nicht: Das Gerät erleichtert Nachträge, Übergaben und die Rückführung vom Papier spürbar, aber solange ein
Neuladen im Funkloch den Einsatz unzugänglich macht, während die Startseite „komplett offline“ verspricht, bleiben
Meldeblock und Wandblatt die einzige Rückfallebene, auf die ich mich im Einsatz verlassen würde.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen (im geladenen Zustand und mit Netz ja; nach Neuladen im Funkloch nein, dort nur Papier und Einzelbogen)
- **Fremde Hilfe nötig:** nein (der Fehlerbildschirm benennt „Daten sichern“ und „Zur Startseite“, hilft aber nicht beim Weiterarbeiten)
- **Größtes Missverständnis:** „✓ Funktioniert komplett offline“ auf der Startseite gilt nicht für das Öffnen des Einsatzes nach einem Neuladen.
- **Größtes Einsatzrisiko:** Ein verworfener Tab oder Neustart im Funkloch sperrt den Einsatz aus (R21-A1).
- **Top-Priorität für die nächste Iteration:** Einsatzansicht nach Neuladen ohne Netz öffnen können (R21-A1) und die Offline-Zusage entsprechend absichern.
