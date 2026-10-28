# Audit „Führungssicht“, Runde 20 (Lage führen, Lagemonitor, Stand übergeben)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `7c06324` (`main`).

Zählung: **P0: 0 · P1: 0 · P2: 0 · P3: 4** · Hinweise (ohne Priorität): 8

Reiner Prüfbericht, keine Codeänderung. Maßstab: Es gibt keine „bekannten
Grenzen“ zum Auslassen. Was im echten Browser noch zu beobachten ist, wird
gemeldet, auch wenn es früher als „offen“ oder „teilweise“ geführt wurde (dann
mit alter Befund-ID im Feld „Neu oder alt“). Je Sachverhalt ein Befund. P3 steht
nur dort, wo die Aufgabe der Führung (Lage lesen, Stand übergeben) tatsächlich
beeinträchtigt wird; Abwägungsfragen stehen unter „Hinweise“.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales
Playwright-Modul unter `/opt/node-tools`), Locale de-DE, Zeitzone Europe/Berlin,
`isMobile`/`hasTouch`; Telefon 360x640 und 390x844, Lagemonitor zusätzlich bei
1280x720. Zustand: Einsatz „Hochwasser Neckar · BR Sporthalle Rottenburg“, fünf
Einheiten (THW Albstadt, Biberach, Crailsheim, Freiburg, Karlsruhe) über
„Einheit schnell erfassen (nur Stärke)…“ aufgenommen. Danach: Zug je Karte und
für alle, Auftrag (Nr. 3), „Abrücken“, „Stärke ändern…“, „Entfernen“ mit
Neuladen, Papierkorb „Zurückholen“, Details, Tabelle und „Alle Spalten zeigen“,
Lageblatt (PDF, mit `pdftotext` und als Bild gelesen), Übersicht und „Alle Daten“
als CSV, Excel-Liste, Sammel-PDF (6 Seiten), „Übergabe vermerken…“, „Einsatz als
beendet markieren“, Neuaufnahme nach „beendet“, „Einsatz importieren…“ der
Sammel-PDF auf einem leeren Gerät, Lagemonitor, Scanner ohne Kamera,
Assistent (manuell und schnell) bis zur letzten Fußleiste, Startseite mit und
ohne Einsatz. Voller Speicher: `localStorage` bis zum Quota-Fehler gefüllt, dann
„Meldung entfernen“, „Übergabe vermerken“, „Einsatz als beendet markieren“,
„Einsatz löschen“. Automatische Abfragen: Tippziele unter 44 px und Abstände unter
8 px in Einsatzansicht und aufgeklappter Karte; Kontrastverhältnis aller
Textelemente in Standard, Feld, Dunkel, Nacht. Browserfehler in der Konsole:
keine.

Nicht geprüft: echter Fernseher, Drucken, Kamera, Mehrfachauswahl von
Dateien bei „Bögen einlesen…“ (R19-K10 daher nicht nachgestellt), Inhalt der
Excel-Datei, 568x320, 320x568.

## Urteil

Die Lage ist ohne fremde Hilfe zu lesen, zu pflegen und zu übergeben. Alle
Behebungen der Runde 19, die ich im Browser nachgestellt habe, halten (Liste
unten). Was bleibt, sind vier Stellen, an denen die Führung eine Angabe anders
lesen kann, als sie gemeint ist: eine Zahl ohne Bezeichnung im Kopf nach
„beendet“, uneinheitliche Darstellung von „nicht erfasst“, die Rückrufnummer in
Lageblatt und Details (OV-Nummer ohne Kennzeichnung) und die Schrittzählung der
Schnellerfassung.

Geprüft und in Ordnung (Behebungen aus Runde 19, nicht gemeldet):

- Voller Speicher: „Meldung entfernen“ meldet „Papierkorb voll … Endgültig
  entfernen?“ statt „7 Tage im Papierkorb“, nach Neuladen ist die Meldung noch da;
  „Übergabe vermerken“ („Übergabe nicht vermerkt … Nichts hat sich geändert“),
  „Einsatz als beendet markieren“ („Einsatz nicht beendet“) und „Einsatz löschen“
  („Nicht gelöscht … der Einsatz ist nicht gelöscht“) nennen den Fehlschlag, der
  Einsatz steht nach Neuladen unverändert da. Auf der Startseite nach dem Neuladen
  steht die Warnung „Gerätespeicher ist voll: 100 %“.
- Fußleiste des Assistenten: bei 360 und 390 px in allen Schritten (manuell und
  schnell) ohne Textüberlauf (`scrollWidth` = `clientWidth`), „In Einsatz
  übernehmen“ voll lesbar, im letzten Schritt zweizeilig; „← Zurück“ bei 360 px
  als „←“.
- Quittungsleiste als Kurzfassung: 60 px (Zug, Abrücken, Entfernen, Übergabe,
  beendet), 66 px bei „Auftrag gesetzt“, einzeilig-kurzer Text mit „Details“,
  „Rückgängig“, „✕“; nach 25 s verschwunden. (Vorher 135 px.)
- Tipp-Sperre: In „Meldung entfernen?“ trägt der Knopf in den ersten rund 500 ms
  `aria-disabled`; ein Tipp in dieser Zeit bleibt ohne Wirkung, der Knopf zeigt
  „Einen Moment …“.
- Schnellerfassung: Ort der Einheit steht als erstes Feld (y = 183), „In Einsatz
  übernehmen“ ohne Ort fragt „Ort der Einheit fehlt“ mit Sprung zum Feld.
- Tabelle am Telefon: kein seitliches Wischen (Tabelle 354 von 360 px), Namen
  ungekürzt; mit gesetztem Zug und Auftrag wechseln die Spalten auf Zug und
  Auftrag, die leere Spalte „Auftrag“ entfällt; „Alle Spalten zeigen“ (26 Spalten)
  hat eine Wischfläche.
- Startseite: „Neue Einsatz-Sammlung…“ bei y = 362 (360x640) über dem Falz;
  mit gespeichertem Einsatz steht dessen Karte mit „Öffnen“ (y = 285) vorn.
- Weitere Behebungen, die halten: Zugsummen und Kennzahlen stimmen (6/20/52/78),
  Stand „beendet/übergeben“ auf Startseite und im Kopf, „nicht mehr aktuell,
  seitdem 1 neue Meldung“ nach Neuaufnahme, Papierkorb „Zurückholen“, Übernahme
  der Sammel-PDF auf leerem Gerät (Zug, Stand, Stärke), Dateinamen mit Datum,
  Uhrzeit, Art und Einsatz, Lageblatt auf einer A4-Seite, Scanner ohne Kamera
  mit Handscanner-Hinweis, Lagemonitor bei 1280x720 mit allen Einheiten ohne
  Scrollen, Tippziele (außer „Zum Inhalt springen“ und dem 24-px-Haken, beide mit
  größerem Bezug) mindestens 43 px („ändern“ am Eintreffzeitpunkt 44 x 43 px), Kontrast in Standard und Feld überall
  ausreichend, in Dunkel und Nacht nur drei leere Elemente unter 3:1.
- Nicht mehr nachzustellen: Zweiter Export innerhalb 500 ms (R19-K4) lädt beide
  Dateien.

## Befunde

### R20-K1 [P3] Kopf nach „Einsatz beendet“ nennt „noch offen: 6“ ohne zu sagen, was offen ist

- **Typ:** Text.
- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht, Kopfband unter „Einsatz · …“, 360x640 und 390x844.
- **Beobachtung:** Nach „Einsatz als beendet markieren“ steht im Kopf „Einsatz
  beendet 28.10.2026, 09:03 — noch offen: 1“; nach einer Neuaufnahme „noch offen: 6
  — nicht mehr aktuell, seitdem 1 neue Meldung“. Der Abschnitt „Übergabe und
  Abschluss“ weiter unten nennt dasselbe in Worten („noch offen: Datensicherung“).
  Die Zahl im Kopf ist die Zahl der offenen Punkte, nicht benannt; dass sie von 1
  auf 6 springt, erklärt sie nicht.
- **Folge:** Wer den Stab übergibt, liest „noch offen: 6“ und weiß nicht, ob sechs
  Meldungen, Exporte oder Aufträge fehlen; er muss 2 000 px weiterscrollen. Der
  Kopf ist die Stelle, die die Nachfolge zuerst sieht.
- **Empfehlung:** Im Kopf die Punkte nennen („noch offen: Datensicherung,
  Übersicht als CSV“) oder die Zahl als Wort („6 Punkte offen“) mit Sprung zur
  Liste; bei mehr als zwei Punkten „Datensicherung und 5 weitere“.

### R20-K2 [P3] „Nicht erfasst“ wird je Ansicht anders gezeigt; das Lageblatt nennt „keine“ und „0 Portionen“ ohne Vorbehalt

- **Typ:** Text.
- **Neu oder alt (Verweis):** neu (verwandt mit R19-W9, N8, S6: leere Spalte in der Tabelle).
- **Ort:** Bedarf von Einheiten, die nur mit Stärke aufgenommen wurden
  (Schnellerfassung): Karte, Details, Tabelle, Lageblatt und Sammel-PDF, Seite 1.
- **Beobachtung:** Die Karte sagt „Bedarf nicht erfasst“. Die Details zeigen
  „Verpflegung —“, „Betriebsstoff —“, „Unterbringung / Ruhezeit —“. Die Tabelle am
  Telefon hat eine Spalte „Bedarf“ mit fünf leeren Zellen. Der Block „Bedarf
  gesamt (5 Einheiten, 78 Personen)“ in Lageblatt und Sammel-PDF schreibt
  „Verpflegung: angefordert 0 Portionen, Stärke 78 (78 Fleisch / 0 vegetarisch / 0
  vegan)“, „Unterbringung angefordert: keine“, „Fahrzeuge / Ruhezeit: … Ruhezeit
  erforderlich bei 0 Einheiten“; nur die Kopfzeile darüber hängt „(bei 5
  Einheiten nicht erfasst)“ an. Auf dem Bildschirm steht der Vorbehalt auch bei
  Verpflegung („· bei 5 Einheiten nicht erfasst“), im PDF-Kopf nicht.
- **Folge:** Das ausgedruckte Lageblatt geht an Stellen, die keine App haben. Wer
  nur den Block „Bedarf gesamt“ liest, schließt auf „keine Unterbringung, keine
  Verpflegung nötig“, obwohl niemand gefragt wurde; „78 Fleisch“ behauptet eine
  Ernährungsangabe, die nicht erhoben wurde.
- **Empfehlung:** Überall dasselbe Wort „nicht erfasst“ verwenden (Details,
  Tabelle, PDF-Block) und im Block „Bedarf gesamt“ vor jede Summe, die auf
  unerfassten Einheiten beruht, den Vorbehalt „bei N von M Einheiten nicht
  erfasst“ setzen; „78 Fleisch“ nur, wenn die Ernährung erfasst wurde.

### R20-K3 [P3] Rückrufnummer im Lageblatt und in den Details ist die Nummer des Ortsverbands, ohne Kennzeichnung als solche

- **Typ:** Daten (Zuordnung/Beschriftung).
- **Neu oder alt (Verweis):** neu.
- **Ort:** Lageblatt, Spalte „Funkrufname / Rückruf“; Kartendetails, „Zugehörigkeit“.
- **Beobachtung:** Für jede am Meldekopf nur mit Ort erfasste Einheit steht im
  Lageblatt „07432984190 (OV)“ unter „Funkrufname / Rückruf“; die Legende darunter
  erklärt nur „Rückrufnummer: (D) dienstlich, (P) privat“, nicht „(OV)“. In den
  Details stehen dieselbe Nummer und „OV-Albstadt@thw.de“ ohne Beschriftung
  („Telefon“, „E-Mail“) unter „OV Albstadt (OALB)“, mit rund 36 px Abstand zur
  Zeile darüber; RB und LV genauso. Die Nummer stammt aus den Stammdaten des
  Ortsverbands, die Einheit selbst hat keine Nummer gemeldet.
- **Folge:** Die Führung liest „Rückruf“ und wählt die Geschäftsstelle des
  Ortsverbands statt eines Führers der Einheit im Einsatz; im Nachtdienst
  erreicht niemand jemanden. Wer die Spalte nicht kennt, hält „(OV)“ für ein
  Kürzel der Einheit.
- **Empfehlung:** Lageblatt-Legende um „(OV) Nummer des Ortsverbands, keine
  Rückrufnummer der Einheit“ ergänzen oder die Spalte leer lassen, wenn die Einheit
  keine Nummer gemeldet hat; in den Details „Telefon“ und „E-Mail“ beschriften.

### R20-K4 [P3] Schnellerfassung zählt „Schritt 3 von 6 · 2, 5 entfallen“ und springt von Schritt 1 auf 3

- **Typ:** Text.
- **Neu oder alt (Verweis):** alt, R19-K9 (Ort zuerst ist behoben; die Schrittzählung bleibt).
- **Ort:** „Einheit schnell erfassen (nur Stärke)…“, Kopfband des Assistenten, 360x640
  und 390x844.
- **Beobachtung:** Der erste Bildschirm heißt „Schritt 1 von 6: Einheit · 2, 5
  entfallen“, der zweite „Schritt 3 von 6: Personal · 2, 5 entfallen“, der dritte
  „Schritt 4 von 6: Fahrzeuge“, danach „Übersicht“. „2, 5 entfallen“ ist ohne
  Vorwissen nicht zu deuten; der Helfer sieht drei Bildschirme, die Zählung sagt
  sechs.
- **Folge:** Am Meldekopf, bei Warteschlange, fragt der Erfassende, ob er drei
  Schritte übersehen hat, und tippt zurück statt weiter.
- **Empfehlung:** In der Schnellerfassung ohne Gesamtzahl 6 durchzählen („Schritt 2
  von 4: Personal“) oder auf „Schritt“ verzichten und nur „Personal“ nennen.

## Hinweise (ohne Priorität)

Abwägungs- und Geschmacksfragen oder Beobachtungen ohne erkennbare Beeinträchtigung
der Aufgabe; nicht in der Zählung.

- **H1 (alt, R19-K6):** Die Einheitenliste beginnt bei 360x640 bei y = 1 012 (rund
  1,6 Bildschirme), die Tabelle danach; davor stehen vier große Aufnahmeknöpfe,
  „Neu seit der letzten Kenntnisnahme“ und „Bedarf“. „Zur Einheitenliste ↓“ steht
  bei y = 645 bis 700 und führt hin.
- **H2 (alt, R19-K12):** Die „Ansicht: …“-Leiste bleibt nach dem Scrollen mit 44 px
  Knopf (rund 57 px mit Rand) am Bildschirmfuß; sie ist beim Zurücknehmen der
  Quittungsleiste durch diese ersetzt.
- **H3:** „Zug zuordnen“ an einer Karte meldet sich nicht mit der Quittungsleiste
  und hat kein „Rückgängig“; derselbe Vorgang für mehrere Einheiten („Zug für 5
  Einheiten“) hat beides. Sichtbar bleibt der Zug-Chip an der Karte und „Zug
  ändern“.
- **H4:** Im Assistenten kürzt der Zurück-Knopf den Einsatznamen bei 360 px zu
  „‹ Einsatz „Hochwass…“; mit zwei gleich beginnenden Einsätzen („Hochwasser
  Neckar“, „Hochwasser Neckar Süd“) wäre der Name nicht zu unterscheiden.
- **H5:** Lagemonitor: Die Zeile „Reihenfolge: ⚠ älteste Angaben zuerst, danach
  zuletzt gemeldet“ trägt dauerhaft ein Warnzeichen, auch wenn alle Angaben
  gleich alt sind; am Telefon steht in der Spalte „Funkruf / Ort“ bei fehlendem
  Funkrufnamen ein „–“ auf einer eigenen Zeile über dem Ort.
- **H6 (alt, Abstände der Runde 19):** „Zur Einheitenliste ↓“ und „Weitergeben,
  Lageblatt, Export ↓“ haben 5,9 px Abstand (je 47 px hoch); es sind Sprunglinks
  ohne Folgen bei Fehltipp. Sonst fanden sich in Einsatzansicht und aufgeklappter
  Karte keine Abstände unter 8 px.
- **H7:** Die Einsatzkarte auf der Startseite fasst Lageblatt, drei Exporte und
  Weitergabe-Datei in einem neunzeiligen Absatz zusammen („… (seitdem keine neue
  Meldung)“ viermal). Lesbar, aber dicht.
- **H8:** „Übersicht als CSV“ und „Alle Daten als CSV“ enden mit einer Zeile
  „Einsatz „…“ · Erstellt …“ in der ersten Datenspalte; in einer Tabellenkalkulation
  steht sie als letzte Datenzeile unter der Summe und ist beim Summieren der
  Spalte zu beachten (die Summenzeile steht davor).

## Antworten auf die Prüfaufträge der Runde

| Prüfpunkt | Ergebnis |
| --- | --- |
| Voller Speicher bei Entfernen, Löschen, Beenden, Übergabe | hält, ehrliche Meldung, Zustand nach Neuladen unverändert |
| Fußleiste ohne Textüberlauf | hält bei 360 und 390 px, alle Schritte |
| Quittungsleiste als Kurzfassung | hält, 60 bis 66 px |
| Tipp-Sperre mit „Einen Moment …“ | hält |
| Schnellerfassung mit Ortsfeld zuerst | hält; Schrittzählung bleibt (R20-K4) |
| Tabelle am Telefon | hält; „nicht erfasst“ uneinheitlich (R20-K2) |
| Startseite | hält |
