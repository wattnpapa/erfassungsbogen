# Audit „Analog first", Runde 20 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-28 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `7c06324` (`main`).

Zählung: **P0 0 · P1 0 · P2 0 · P3 5 · Hinweise 4** (5 Befunde: 2 neu, 3 alt mit Verweis).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und der Abschnitt „Stand der Behebung" in
`runde-19/README.md` sowie `runde-19/analog-first.md`. Gemeldet ist alles, was im Browser noch zu beobachten war (mit Verweis
auf die alte Befund-ID); Behebungen, die im Browser nicht mehr zu beobachten sind, sind nicht gemeldet. Je Sachverhalt ein
Befund; Typ je Befund angegeben (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast). Reine Geschmacksfragen und
Beobachtungen ohne Aufgabenbeeinträchtigung stehen als „Hinweis" ohne Priorität im eigenen Abschnitt.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales Playwright-Modul, weil die Projektkopie keinen Browser
findet), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer Kontext. Einsatz-Sammlung
„Hochwasser Test" mit 5 THW-Beispielbögen aus `examples/thw/` (Kopien mit `uebung: false`, „Stand" 30 bis 62 Minuten alt,
Zeitraum heute), über „Bögen einlesen…" als JSON-Dateien eingelesen. Durchgespielt:

- Einsatzansicht: „Entfernen" (Rückfrage, Doppeltipp auf „Meldung entfernen", Quittung, Papierkorb nach Neuladen,
  „Zurückholen"), „Stärke ändern…", „Abrücken" (einzeln und alle fünf), „Übergabe vermerken…", „Einsatz als beendet markieren",
  danach neue Meldung (Schnellerfassung), Wechsel auf die Startseite, Tabelle am Telefon mit „Alle Spalten zeigen".
- Dateien: Lageblatt (nach „Entfernen", nach „Stärke ändern…", nach „alle abgerückt"), Sammel-PDF, Übersicht-CSV,
  Alle-Daten-CSV, Excel „Oldenburg", Datensicherung-Dialog; gelesen mit `pdftotext -layout`, `pdfinfo` und CSV-Text.
- Papierweg: Sammel-PDF mit „Einsatz importieren…" eingelesen; die 9 Seiten der Sammel-PDF als PNG (150 dpi) über „Bögen
  einlesen…" (4 Bögen aus den Codeseiten), „Lage vom Papier abgleichen…" (Formular geöffnet), „Einheit schnell erfassen (nur
  Stärke)…" mit „Angaben vom Zettel" (Eintreffzeit, Abrückzeit, Nr., Zug), Wechsel durch alle Schritte, Fußleiste je Schritt.
- Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt, dann „Meldung entfernen", „Übergabe vermerken…",
  „Einsatz als beendet markieren", „Einsatz löschen…", Neuladen.
- Scanner ohne Kamera (Dialog), Browserkontext offline mit Neuladen, Lageblatt und Datensicherung offline.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; die Nr. vom Meldeblock und vom Lageblatt ist der Schlüssel
zwischen Papier, Funk und Gerät; das Lageblatt hängt an der Wand; CSV und Excel gehen an den Stab.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle,
Zeitverhalten auf einem echten Telefon, das Aussehen der nativen Zeit- und Datumsfelder auf einem echten Telefon (im
Testbrowser erscheint „mm/dd/yyyy, --:-- --"). Die Hinweise „Anderer Einsatz?", „Kennzeichen doppelt", „Sitzplätze fehlen"
bei den Beispielbögen sind Seed-Artefakte und nicht gewertet.

## Urteil

Die Papierseite trägt, und die Behebungen aus Runde 19 halten fast durchweg: Bei vollem Speicher quittiert die App nichts
Falsches mehr, sondern sagt „Papierkorb voll", „Übergabe nicht vermerkt", „Einsatz nicht beendet", „Nicht gelöscht" und ändert
nichts; Lageblatt und Datei benennen die Lücke nach „Entfernen"; der Rückweg vom Papier (Sammel-PDF, Fotos der Codeseiten,
Abgleich, Zettelangaben mit Nr.) ist ohne fremde Hilfe zu gehen; offline entstehen Lageblatt und Sicherung. Übrig sind
Kleinigkeiten in der Beschriftung und im Platz am 360-px-Telefon. Die Aufgabe ist ohne fremde Hilfe zu erledigen.

## Prüfung der Behebungen aus Runde 19

| Befund | Ergebnis |
| --- | --- |
| R19-O1 „Meldung entfernen" bei vollem Speicher | hält (gemessen): Rückfrage „Papierkorb voll — Die Meldung kam nicht in den Papierkorb … Endgültig entfernen?" mit „Endgültig entfernen" / „Abbrechen" (139 × 58); nach „Abbrechen" und Neuladen steht Nr. 2 unverändert da |
| R19-O2 beenden / Übergabe bei vollem Speicher | hält (gemessen): „Einsatz nicht beendet" und „Übergabe nicht vermerkt", jeweils „Nichts hat sich geändert", Knopf „Alles klar" (302 × 44); der Zustand in der Liste bleibt „noch nicht" |
| R19-O3 „Einsatz löschen" bei vollem Speicher | hält (gemessen): „Nicht gelöscht — Der Speicher ist voll, der Papierkorb leer"; Angebot „Endgültig löschen" mit Hinweis „Es gibt noch keinen Export — das wäre die einzige Kopie"; oben auf der Seite der Hinweis „Gerätespeicher ist voll: 100 %" |
| Fußleiste ohne Textüberlauf | hält (gemessen): Haupt- und Schnellassistent bei 360 × 640 und 320 × 568, alle Schritte, kein Knopf mit `scrollWidth` > `clientWidth`, nichts über dem Rand; „In Einsatz übernehmen" 167 × 44 |
| Quittungsleiste als Kurzfassung | hält (gemessen): 60 px hoch bei 360 × 640 („Nr. 2 entfernt · Papierkorb", „Details", „Rückgängig", „✕"); nach 6 bis 15 s weg; Rest siehe Hinweis H1 |
| Tipp-Sperre mit „Einen Moment …" | hält (gemessen): nach „Meldung entfernen" steht an Stelle der Karte „Einen Moment …"; zweiter Tipp trifft nichts |
| Schnellerfassung mit Ortsfeld zuerst | hält (gemessen): „Ort der Einheit (Pflicht)" bei y = 183, „In Einsatz übernehmen" mit Ort und Stärke legt die Einheit ohne Rückfrage an („Zuletzt abgelegt: „THW Zella" · jetzt 6 Einheiten …", „hat Nr. 6 — die Nummer auf dem Zettel eintragen") |
| Tabelle am Telefon | hält (gemessen): Dokument 360 px, Namen vollständig umbrochen, Spalte „Eingetr." mit „*" und Fußzeile „* Zeit des Einlesens, nicht bestätigt", „Alle Spalten zeigen" scrollt nur in der Tabelle (R19-A1 behoben) |
| Startseite zeigt „beendet" | hält (gemessen): „beendet 28.10.2026, 08:24 · übergeben 28.10.2026, 08:24 an Stab"; Lage der Hauptaktion siehe R20-A1 |
| Lücke in den Nummern (R19-A2) | hält (gemessen): Lageblatt, CSV und Sammel-PDF tragen „Nr. 2 entfernt 08:09 (Papierkorb) — nicht in der Summe." |
| Übergabe/Beenden nach neuer Meldung | hält (gemessen): „Übergabe vermerkt … Nicht mehr aktuell: seitdem 1 neue Meldung. Neu vermerken…", „Einsatz beendet … Nicht mehr aktuell" |
| Scanner ohne Kamera | hält (gemessen): Dialog füllt 360 × 640 genau, kein inneres Scrollen (`scrollHeight` 640 / 640) |
| Sammel-PDF, wenn alle abgerückt | hält (gemessen): Datei entsteht, Lageblatt führt „Abgerückt (5)" und „0 zählend · 5 abgerückt" |
| Dateinamen, Quittung für Dateien | hält (gemessen): `2026-10-28_0809_eeb-lageblatt_Hochwasser_Test.pdf`, `…_eeb-einsatz_….csv`, `…-oldenburg_….xlsx`; „✓ Gespeichert: <Dateiname> — im Download-Ordner bzw. über das Teilen-Menü abgelegt." |
| Offline | hält (gemessen): Neuladen offline zeigt den Einsatz, Lageblatt wird erzeugt, Datensicherung-Dialog öffnet |

## Befunde

### R20-A1 [P3, Layout/Abstand] Startseite bei 360 × 640: „Neuen Bogen erstellen" steht bei beendetem und übergebenem Einsatz unter dem Falz

- **Neu oder alt (Verweis):** alt, R19-A10 (teilweise behoben; ursprünglich „erst bei y = 852").
- **Ort:** Startseite mit vorhandener Einsatz-Sammlung, 360 × 640.
- **Beobachtung (gemessen):** Laufender Einsatz: Knopf bei y = 579 bis 634 (360 × 640) bzw. 595 bis 650 (390 × 844), eben noch sichtbar.
  Einsatz beendet und übergeben (die Karte wird dann fünf Zeilen hoch): Knopf bei y = 614 bis 669 und damit am 360 × 640-Display
  abgeschnitten; die Kopfzone mit „Digitaler Einheiten-Erfassungsbogen" und „Ansicht: Standard" belegt davor rund 200 px.
- **Erwartung der Rolle:** Die Einstiegsknöpfe stehen auf dem ersten Bildschirm, auch wenn die Einsatzkarte lang ist.
- **Folge im Einsatz:** Wer nach Einsatzende einen eigenen Bogen ausfüllen will, sucht den Knopf unterhalb der Anzeige.
- **Empfehlung:** Kopfzone verkleinern oder lange Einsatzkarte einklappen, bis die Einstiegsknöpfe vollständig sichtbar sind.
- **Verifikation:** 360 × 640, Einsatz beendet und übergeben: „Neuen Bogen erstellen" liegt vollständig im ersten Bildschirm.

### R20-A2 [P3, Text] Schnellerfassung zählt „Schritt 1 von 6 … 2, 5 entfallen" und springt von 1 auf 3

- **Neu oder alt (Verweis):** alt, R19-A5 und R19-A6 (teilweise behoben: Überschrift und Zähler stimmen jetzt überein, der Zähler bleibt schwer lesbar).
- **Ort:** „Einheit schnell erfassen (nur Stärke)…", Kopfzeile des Assistenten.
- **Beobachtung (gemessen):** „Schritt 1 von 6: Einheit · 2, 5 entfallen"; „Weiter" führt zu „Schritt 3 von 6: Personal", dann „Schritt 4 von 6: Fahrzeuge".
  Tatsächlich erreichbar sind vier Schritte; ein Tipp auf „In Einsatz übernehmen" genügt ab Schritt 1.
- **Erwartung der Rolle:** Ein Zähler, der die Zahl der Schritte nennt, die tatsächlich kommen („Schritt 1 von 4").
- **Folge im Einsatz:** „6 Schritte" und „2, 5 entfallen" wirken wie ein langer Papierweg; der Helfer wertet es als Zeichen, dass „nur Stärke" nicht gemeint war.
- **Empfehlung:** Nur die Schritte zählen, die vorkommen; „entfallen" weglassen.
- **Verifikation:** Schnellerfassung öffnen: Zähler lautet „Schritt 1 von 4", „Weiter" führt zu „Schritt 2".

### R20-A3 [P3, Text] Kartenwarnung heißt je Karte „Stand vor …" oder „Meldung vor …", obwohl beide den Stand der Angaben meinen

- **Neu oder alt (Verweis):** alt, R19-A7 (teilweise behoben: das Wort „Meldung" steht jetzt dabei, wechselt aber ohne erkennbaren Grund).
- **Ort:** Karten in der Einsatzliste nach „Einsatz importieren…" aus der Sammel-PDF (360 × 640).
- **Beobachtung (gemessen):** Nr. 4: „⚠ Meldung vor 1 Std 6 Min", aufgeklappt „Stand der Angaben 28.10.2026, 07:13"; Nr. 5: „⚠ Stand vor 1 Std 14 Min",
  aufgeklappt „Stand der Angaben 28.10.2026, 07:05". Beide Zeiten sind der Stand der Angaben, die Warnungen tragen verschiedene Wörter.
- **Erwartung der Rolle:** Gleiche Ursache, gleiche Bezeichnung; „Meldung" nur, wenn der Eingang gemeint ist.
- **Folge im Einsatz:** Der Meldekopf fragt bei Nr. 4 nach einer „alten Meldung", obwohl nur die Angaben im Bogen alt sind.
- **Empfehlung:** Immer „Stand der Angaben vor …" (oder immer dasselbe Wort) und „Eingang vor …" nur, wenn der Eingang gemeint ist.
- **Verifikation:** Zwei Karten mit gleichem Alter des Stands tragen dasselbe Wort.

### R20-A4 [P3, Bedienung] „ganz zeigen" ist ein 76 × 26-Tippziel, die Bemerkung der Einheit bricht mitten im Wort ab

- **Neu oder alt (Verweis):** neu.
- **Ort:** aufgeklappte Karte (Nr. 2 „Bemerkung der Einheit"), 360 × 640 und 390 × 844.
- **Beobachtung (gemessen):** „Bemerkung der Einheit: 2 Helfer über StAN-Soll (Reserve aktivie … ganz zeigen"; der Link misst 76 × 26 px, alle Knöpfe der Karte 44 bis 48 px hoch.
- **Erwartung der Rolle:** Das Tippziel zum Lesen der Bemerkung ist so groß wie die übrigen; der Schnitt liegt an einer Wortgrenze.
- **Folge im Einsatz:** Mit Handschuh trifft man den Link schwer; Bemerkungen wie „nicht mit ausgerückt" sind genau die Angaben, die im Anschnitt fehlen.
- **Empfehlung:** Tippziel auf mindestens 44 px Höhe; bei Wortgrenze kürzen.
- **Verifikation:** „ganz zeigen" misst mindestens 44 px in der Höhe, der gekürzte Text endet vor einem ganzen Wort.

### R20-A5 [P3, Text] Lageblatt kürzt die Bemerkung der Einheit mitten im Satz („… nicht …")

- **Neu oder alt (Verweis):** neu (verwandt mit R20-A4, aber anderer Ort: gedrucktes Lageblatt).
- **Ort:** Lageblatt (A4 quer), Spalte „Auftrag / Notiz (Bemerkung der Einheit)", Nr. 2 und Nr. 4.
- **Beobachtung (gemessen, `pdftotext`):** „(2 Sollplätze unbesetzt. Anh Plane/Spriegel in Instandsetzung — nicht … Rest: Sammel-PDF)"; „(2 Helfer über StAN-Soll [Reserve aktiviert]. PKW OV zusätzlich über … Rest: Sammel-PDF)". Die Sammel-PDF nennt den Satz vollständig („nicht mit ausgerückt").
- **Erwartung der Rolle:** Das Wandblatt hat eine Fassung, die ohne Sammel-PDF stimmt; ein abgeschnittenes „nicht" ist nicht zu deuten.
- **Folge im Einsatz:** Das Lageblatt an der Wand wird gelesen, die Sammel-PDF nicht; ein Anhänger könnte als ausgerückt gelten.
- **Empfehlung:** An Satzgrenzen kürzen oder Bemerkungen mit Verneinung nicht kürzen; „… (gekürzt)" an das Ende.
- **Verifikation:** Lageblatt mit der Freiburg-Bemerkung: der Satz endet vor oder nach „nicht mit ausgerückt", nicht dazwischen.

## Hinweise (ohne Priorität)

- **H1, Quittungen liegen übereinander:** Nach „Meldung entfernen" und einem Tipp auf „Lageblatt (A4 quer)" binnen 5 s liegen die Quittung „Nr. 2 entfernt · Papierkorb / Rückgängig" und „✓ Lageblatt erzeugt … Download-Ordner" mit gleichen Maßen übereinander (beide bei y = 580, z-index 20); sichtbar ist die erste. Nach wenigen Sekunden verschwindet sie, die Lageblatt-Quittung ist dann zu sehen, und „✓ Lageblatt: erzeugt" steht in „Übergabe und Abschluss". Kein Verlust, kurzzeitig fehlt der Beleg für die Ablage. Verweis R19-A3.
- **H2, Reihenfolge im Seitentext:** In der Schnellerfassung steht „Angaben vom Zettel (optional)" im Quelltext vor „1. Einheit", sichtbar liegt der Block darunter. Für die Tab-Reihenfolge am Handscanner mit Tastatur wäre erst „Eingetroffen um" dran; auf dem Touchscreen ohne Wirkung.
- **H3, Zurückholen nennt keine Nr.:** „Meldung „THW Albstadt Zugtrupp Technischer Zug" zurückgeholt." — die Nr. fehlt, die Karte hat sie. Kein Fehler, Meldeblock-Abgleich geht über die Karte.
- **H4, Hinweise bei vollem Speicher:** Das Banner oben sagt „Platz schafft nur Löschen", die Rückfrage „Platz schafft nur Verkleinern: unter „Mehr…" Meldungen oder Einheiten entfernen". Beides führt zum Ziel; die Wörter unterscheiden sich.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Ankunft einer Einheit am Meldekopf | QR-Code lesen, Stärke und Fahrzeuge ohne Abschreiben; Nr. wird vergeben | Meldeblock mit Nr., Ort, Uhrzeit, Stärke | „Einheit schnell erfassen" mit „Angaben vom Zettel" (Eintreffzeit, Abrückzeit, Nr., Zug): bleibt vom Zettel stehen, keine Dublette |
| Lage an der Wand | Lageblatt A4 quer mit Summen, Nachtragstafel auf Papier | Whiteboard, Nachtrag von Hand auf dem Lageblatt | Nachtrags-CSV oder „Schnell erfassen" mit Nr. vom Blatt |
| Übergabe an die Ablösung | Sammel-PDF mit allen Bögen, „Übergabe vermerken…" mit Uhrzeit und Empfänger | ausgedrucktes Sammel-PDF und Lageblatt | „Einsatz importieren…" aus der Sammel-PDF (4 Einheiten gelesen); Abgleich der Nr. mit „Lage vom Papier abgleichen…" |
| Gerät fällt aus | Datensicherung (offline, eine Datei) | Papier-Reserve (Blanko-Vordruck), Lageblatt auf Papier | Sicherung einspielen oder Bögen einlesen (Fotos der Codeseiten) |
| Speicher voll | App sagt klar, was nicht geschrieben wurde, und ändert nichts | Lageblatt und Sammel-PDF ausdrucken, dann Platz schaffen | Erst sichern, dann Papierkorb leeren oder „Endgültig löschen…" |

## Würde ich dafür das Papier weglegen?

Nein, noch nicht ganz: Das Papier bleibt als Wandblatt und Meldeblock die Rückfallebene, aber das Gerät erleichtert mir
jetzt Nachträge und Übergaben mehr, als es mir Pflichten auflädt, und bei vollem Speicher, Ausfall oder Funkloch bleibt
nichts ungeklärt zurück — wer Lageblatt, Sammel-PDF und Meldeblock nebeneinander hat, kann die Lage ohne Gerät halten und
anschließend sauber nacherfassen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Schritt 1 von 6 … 2, 5 entfallen" in der Schnellerfassung klingt nach sechs Pflichtschritten, gemeint sind vier.
- **Größtes Einsatzrisiko:** Das Lageblatt an der Wand schneidet Bemerkungen der Einheit mitten im Satz ab („nicht …").
- **Top-Priorität für die nächste Iteration:** Bemerkungen im Lageblatt an der Satzgrenze kürzen (R20-A5) und den Schrittzähler der Schnellerfassung auf die tatsächlichen vier Schritte bringen (R20-A2).
