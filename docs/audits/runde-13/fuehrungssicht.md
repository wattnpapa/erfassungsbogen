# Audit „Führungssicht", Runde 13 (Lage führen, Lagemonitor, Stand übergeben)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `7637e61` (`main` nach Runde 12).

Zählung: **P0: 0 · P1: 0 · P2: 1 · P3: 1** (2 Befunde)

Reiner Prüfbericht, keine Codeänderung. Nicht neu gemeldet sind die Grenzen aus
`docs/audits/README.md` und den Runden 10 bis 12 (darunter R11-S4, R11-H2,
R11-K2, R11-A2, R11-A5, R11-M1, R11-M3, R12-W3, R12-H3, R12-O2, R12-O4,
R12-G3).

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales
Playwright-Modul, weil die Projektkopie keinen Browser fand), Locale de-DE,
`isMobile`/`hasTouch`, Telefon 390x844 und 360x640. Zustand aus
`localStorage`-Seed (`eeb.einsaetze.v1`) mit acht Bögen aus `examples/thw/`
(`uebung: false`), Meldealter 2 bis 400 Minuten, zwei Züge, eine abgerückte
Einheit. Seed-Artefakte: Das „Stand" der Bögen liegt teils in der Zukunft, und
mehrere Karten tragen „Anderer Einsatz?", weil die Übungsbögen nicht zum
Einsatznamen passen. Beides wurde nicht bewertet.

Bedient: Startseite, Einsatzansicht, Aufklapper „Bedarf" und „Zwischensummen
nach Zug", Karte aufklappen, Abrücken mit Quittung und Neuladen, Tabelle bei
360x640, „Suchen, sortieren, filtern" (Sortierung „Älteste Meldung zuerst",
Status „nur ⚠ ältere als 1 Std"), Lageblatt (PDF erzeugt, mit `pdftotext`
gelesen), Lagemonitor (`?lagemonitor=s1`).

Nicht prüfbar: echter Fernseher, Vollbild, Drucken, Kamera.

## Urteil

Die Behebungen aus Runde 12 halten. Die Altersangabe in Kopf, Startseite und
Monitor misst an den Anwesenden („älteste Meldung vor 6 Std 40 Min, 4 von 7
älter als 1 Std") und ändert sich nach dem Abrücken richtig („3 von 6"). Die
Zugsummen tragen die Altersaussage je Zug („1. Zug … ⚠ älteste Meldung vor 6
Std 40 Min", 2. Zug „vor 2 Std 0 Min"). Sortierung „Älteste Meldung zuerst"
und der Status-Filter „nur ⚠ ältere als 1 Std (4)" arbeiten; die Tabelle hat
die Spalte „Meldung vor". „Unterbringung 23 Personen" steht mit Leerzeichen,
und die Zugsummen stimmen mit der Gesamtzeile überein (nachgerechnet:
Unterbringung 11 + 12 + 0 = 23, Stärke 27 + 22 + 16 = 65). Die Abrückquittung
nennt Uhrzeit und „Rückgängig", der Stand überlebt das Neuladen. Das Lageblatt
trägt die Altersaussage im Kopf. Die Aufgabe „Lage erfassen, Abweichungen
sehen, Stand weitergeben" ist ohne fremde Hilfe machbar. Reibung bleibt an
zwei Stellen, an denen die Zusammenfassung weniger sagt als das Detail.

## Befunde

### R13-K1 [P2] Zusammengefasste Bedarfszeile nennt nur Diesel; Benzin und Gemisch fehlen in Einsatzansicht und Lagemonitor

**Ort:** Einsatzansicht, Kopfzeile des Aufklappers „Bedarf:"; Lagemonitor, Zeile
„Bedarf".

**Beobachtung:** Bei Seed mit Diesel 580 l, Benzin 160 l und Gemisch 10 l zeigt
die zugeklappte Zeile „Verpflegung 65 · Unterbringung 23 Personen · Diesel 580
l · Ruhezeit 4 Einheiten". Erst nach dem Aufklappen steht „Kraftstoff: Diesel
580 l · Benzin 160 l · Gemisch 10 l". Das Lageblatt führt „Diesel 580 l · Benzin
160 l · Gemisch 10 l", die Zwischensummen je Zug führen Benzin (Zug 1: „Diesel
210 l · Benzin 80 l"). Der Lagemonitor hat keinen Aufklapper und zeigt ebenfalls
nur „Diesel 580 l". Nach dem Abrücken einer Einheit gleich (Diesel 500 l, kein
Benzin).

**Erwartung der Rolle:** Die Zeile, die den Sofortbedarf auf einen Blick nennt,
nennt alle Kraftstoffarten, die angefordert sind, wie Lageblatt und Zugsummen.

**Folge:** Wer die Lage vom Monitor oder von der zugeklappten Zeile abliest und
Nachschub veranlasst, bestellt Diesel und vergisst 160 l Benzin (Pumpen,
Motorsägen) und Gemisch. Am Fernseher ist das Detail gar nicht erreichbar; die
Zahlen von Bildschirm und Blatt widersprechen sich.

**Empfehlung:** In Kurzzeile und Monitor alle Kraftstoffe mit Menge größer 0
nennen, in derselben Schreibweise wie das Lageblatt.

**Nachprüfung:** Seed mit Diesel, Benzin und Gemisch größer 0: Kurzzeile und
Monitor nennen alle drei Mengen; Summe stimmt mit dem Lageblatt überein.

### R13-K2 [P3] Lageblatt nennt „4 von 7 älter als 1 Std", markiert die Einheiten aber nicht

**Ort:** Lageblatt (A4 quer, PDF), Kopf und Tabellenzeilen.

**Beobachtung:** Der Kopf trägt „! älteste Meldung vor 6 Std 41 Min, 4 von 7
älter als 1 Std". In den Zeilen steht kein Zeichen und keine Altersangabe; es
gibt nur absolute Zeiten („Eingetroffen 26.10.2026, 00:02", „Stand …"). Welche
vier Einheiten gemeint sind, ergibt sich nur durch Rechnen gegen „Erstellt
06:43". Bildschirm (⚠-Marke je Karte) und Monitor (⚠ 2 Std je Zeile) markieren
sie.

**Folge:** Das Blatt an der Wand oder in der Übergabe sagt, dass es alte
Meldungen gibt, aber nicht von wem; die ablösende Führungskraft muss
nachrechnen oder das Gerät befragen.

**Empfehlung:** Zeilen mit Meldung älter als 1 Std auf dem Blatt kennzeichnen
(Zeichen oder Spalte „Meldung vor" zum Erstellzeitpunkt).

**Nachprüfung:** Seed mit Meldealter über 60 Minuten: Lageblatt-Text trägt bei
genau diesen vier Zeilen die Kennzeichnung.

## Aufgabe geschafft

ja (ohne Umweg) · Fremde Hilfe nötig: nein · Größtes Missverständnis: Die
zugeklappte Bedarfszeile wirkt vollständig, nennt aber nur Diesel. · Größtes
Einsatzrisiko: Nachschub für Benzin und Gemisch wird nach Monitor oder
Kurzzeile nicht angefordert. · Top-Priorität: R13-K1.
