# Audit „Analog first", Runde 19 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-28 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `0ac0d7f` (`main`).

Zählung: **P0 0 · P1 0 · P2 0 · P3 11** (11 Befunde: 5 neu, 6 alt mit Verweis).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und der Abschnitt „Stand der Behebung" in
`runde-18/README.md` sowie `runde-18/analog-first.md`. Gemeldet ist alles, was im Browser noch zu beobachten war (mit
Verweis auf die alte Befund-ID); Behebungen, die im Browser nicht mehr zu beobachten sind, sind nicht gemeldet.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales Playwright-Modul, weil die Projektkopie keinen Browser
findet), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer Kontext. Einsatz-Sammlung
„Hochwasser Test" mit 5 THW-Beispielbögen aus `examples/thw/` (Kopien mit `uebung: false`, Stand 30 bis 62 Minuten alt,
Zeitraum heute), eingelesen als JSON-Dateien. Durchgespielt:

- Einsatzansicht: „Entfernen" (Rückfrage, Doppeltipp auf „Meldung entfernen", Quittung, Papierkorb, „Zurückholen", Neuladen),
  „Stärke ändern…" (Mannschaft 9 → 6), „Abrücken", „Übergabe vermerken…", „Einsatz als beendet markieren", Wechsel auf
  die Startseite, Tabelle am Telefon mit „Alle Spalten zeigen".
- Dateien: Lageblatt (5 Einheiten, auch nach „Entfernen" und nach „Stärke ändern…"), Sammel-PDF, Übersicht-CSV, Alle-Daten-CSV,
  Nachtrag-CSV, Excel „Oldenburg", Datensicherung; gelesen mit `pdftotext -layout`, `pdfinfo`, CSV-Spalten und durch Entpacken
  der Excel-Datei.
- Papierweg: Sammel-PDF mit „Einsatz importieren…" eingelesen, die 12 Seiten der Sammel-PDF als PNG (150 dpi) über „Bögen
  einlesen…" (5 Bögen aus 6 Codeseiten), „Lage vom Papier abgleichen…" geöffnet, „Einheit schnell erfassen (nur Stärke)…" mit
  Zettelangaben (Nr. 7, Eintreffzeit, Abrückzeit, Zug), leere Stärke.
- Scanner ohne Kamera, Browserkontext offline mit Neuladen, Lageblatt offline, Datensicherung.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; die Nr. aus dem Meldeblock und vom Lageblatt dient als
Schlüssel zwischen Papier, Funk und Gerät; das Lageblatt hängt an der Wand; CSV und Excel gehen an den Stab.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle,
Zeitverhalten auf einem echten Telefon, das Aussehen der nativen Zeit- und Datumsfelder auf einem echten Telefon. Die
Hinweise „Anderer Einsatz?", „Kennzeichen doppelt", „Sitzplätze fehlen" und „alle als männlich" bei den Beispielbögen sind
Seed-Artefakte und nicht gewertet.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, Dateiinhalt, Messwert); *beobachtet* = gesehen.

## Urteil

Die Papierseite trägt, und die Behebungen aus Runde 18 halten: Nach „Entfernen" bleiben die Nummern stehen, der Papierkorb
und „Zurückholen" funktionieren, Exporte werden mit Dateinamen quittiert, die Übergabe lässt sich vermerken, der Abschluss hat
einen Zustand, und das Lageblatt führt die Nachtragstafel geschlossen auf einer eigenen Seite. Offline läuft die App weiter,
Lageblatt und Sicherung entstehen ohne Netz, und der Rückweg vom Papier (Sammel-PDF, Fotos der Codeseiten, Abgleich,
Zettelangaben mit Nr.) ist ohne fremde Hilfe zu gehen. Reibung bleibt in Kleinigkeiten, die Papier und Gerät auseinanderlaufen
lassen (Lücke in den Nummern ohne Erklärung, Sternchen fehlt in der Tabelle) und in der Schnellerfassung am 360-px-Telefon.
Die Aufgabe ist ohne fremde Hilfe zu erledigen.

## Prüfung der Behebungen aus Runde 18

| Befund | Ergebnis |
| --- | --- |
| R18-A1 Nummern rücken nach „Entfernen" auf | hält (gemessen): Rückfrage „Nummern bleiben: Nr. 2 bleibt frei, die übrigen (3–5) bleiben — wie auf Lageblatt und Meldeblock"; Lageblatt und CSV führen Nr. 1, 3, 4, 5; „Zurückholen" stellt Nr. 2 her. Folge der Lücke siehe R19-A2 |
| R18-A2 Stand neben „Stand vor …" nach Stärkeänderung | hält (gemessen): Karte, Lageblatt, CSV nennen „Stand der Angaben 03:12" und „Stärke am Meldekopf geändert 04:01" getrennt |
| R18-A3 CSV/Excel ohne Handänderungsvermerk | hält (gemessen): CSV „Aus Datei, am Meldekopf geändert" und „Stärke am Meldekopf geändert …" in „Hinweise"; Excel-Bemerkung ebenso |
| R18-A4 CSV/Excel ohne Quittung | hält (gemessen): „✓ Gespeichert: <Dateiname> — im Download-Ordner bzw. über das Teilen-Menü abgelegt." |
| R18-A5 Tabelle am Telefon | hält technisch (Dokument 360 px, Kernspalten Einheit / Ges. / Eingetr. / Auftrag ohne Seitenscroll); Inhalt siehe R19-A1 |
| R18-A6 Kein Zustand „Einsatz beendet" | hält (gemessen): Kopfzeile „Einsatz beendet 28.10.2026, 04:10", Abschlussliste mit „noch offen: …", „Wieder öffnen"; bleibt nach Neuladen; Startseite siehe R19-A11 |
| R18-A7 „Weitergegeben" nicht bestätigbar | hält (gemessen): „Übergabe vermerken…" mit „An (Name oder Stelle)", Vermerk „Übergabe vermerkt 28.10.2026, 04:10 an Stab THW", „Vermerk entfernen" |
| R18-A8 Quittung nach „Entfernen" | teilweise: Ansicht bleibt an der Stelle der Liste (gemessen, scrollY 2254), Rest siehe R19-A3 |
| R18-A9 Nachtragstafel über zwei Seiten | hält: Tafel und „Summe einschl. Nachträge" stehen geschlossen auf Seite 2 (gemessen mit `pdftotext` je Seite) |
| Tipp-Sperren, sichere Gegenhandlung | hält: zweiter Tipp auf „Meldung entfernen" trifft nichts; „Abrücken" ist per „Rückgängig" umkehrbar; „Entfernen" nur über Rückfrage |
| Papierkorb | hält: „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar" nach Neuladen, „Zurückholen" und „Endgültig löschen…" getrennt (Rückholen 113 × 44, Löschen 161 × 44) |
| Dateinamen | hält: `2026-10-28_0359_eeb-lageblatt_Hochwasser_Test.pdf`, `…_eeb-einsatz_…csv`, `…-nachtrag_…csv`, `…-oldenburg_….xlsx` |
| Scanner ohne Kamera | hält: „Dieses Gerät meldet keine nutzbare Kamera." mit „QR aus Bild einlesen…", Handscanner-Feld und „Fertig" |
| Hauptaktion oben (Einsatzansicht) | hält: „Bogen scannen…", „Einheit manuell erfassen…" vor der Liste; Startseite siehe R19-A10 |

## Befunde

### R19-A1 [P3] Tabelle zeigt die Eintreffzeit ohne „*", obwohl der Hinweis sagt, Tabellen seien markiert

- **Neu oder alt (Verweis):** neu (Folge der Kernspalte „Eingetr." aus R18-A5).
- **Ort:** Einsatzansicht → „Tabelle" (Kernspalten und „Alle Spalten zeigen"), Spalte „Eingetr." bzw. „Eingetroffen".
- **Beobachtung (gemessen):** Der Hinweis nach dem Einlesen lautet „Eintreffzeit dieser 5 Bögen ist die Zeit des Einlesens (in Lageblatt
  und Tabellen mit * markiert)". Lageblatt und CSV tragen „28.10.2026, 03:59 *". Die Tabelle am Telefon zeigt „04:10" bzw.
  „28.10.2026, 04:11" ohne Sternchen und ohne Fußzeile dazu.
- **Erwartung der Rolle:** Dieselbe Zeit trägt überall dieselbe Kennzeichnung; wer die Tabelle abliest, erkennt die Einlesezeit.
- **Folge im Einsatz:** Die Zeit des Einlesens wird in der Tabelle für die Eintreffzeit vom Meldeblock gehalten und mündlich weitergegeben.
- **Empfehlung:** Sternchen und eine Zeile „* Zeit des Einlesens, nicht bestätigt" auch unter der Tabelle.
- **Verifikation:** Fünf Bögen einlesen, „Tabelle": Eintreffzeit trägt „*" wie im Lageblatt.

### R19-A2 [P3] Nach „Entfernen" fehlt im Lageblatt und in der CSV jeder Hinweis auf die Lücke in den Nummern

- **Neu oder alt (Verweis):** neu (Folge der Behebung von R18-A1).
- **Ort:** Lageblatt und Übersicht-CSV nach dem Entfernen von Nr. 2.
- **Beobachtung (gemessen):** Das Lageblatt führt Nr. 1, 3, 4, 5, die CSV ebenso, die Summenzeile „Summe laut Gerät (4 zählend)" / „Summe (4 Einheiten)".
  Dass Nr. 2 entfernt wurde und im Papierkorb liegt, steht weder im Lageblatt noch in der Datei.
- **Erwartung der Rolle:** Wer auf der Wand „1, 3, 4, 5" liest, soll erkennen, dass Nr. 2 bewusst fehlt und nicht verloren ging.
- **Folge im Einsatz:** Der Stab fragt am Funk nach der fehlenden Nr. 2 oder hält sie für abgerückt; auf dem Meldeblock steht sie noch.
- **Empfehlung:** Eine Zeile „Nr. 2: entfernt am 04:21 — nicht in der Summe" im Lageblatt, in der CSV und im Sammel-PDF.
- **Verifikation:** Nr. 2 entfernen, Lageblatt und CSV erzeugen: die Lücke ist benannt.

### R19-A3 [P3] Quittungsleiste bleibt stehen und belegt 19 % des 360 × 640-Displays; sie deckt Knöpfe der Liste

- **Neu oder alt (Verweis):** alt, R18-A8 (teilweise), R18-H1, R18-H2, R18-S2.
- **Ort:** Einsatzansicht nach „Entfernen" (ebenso nach Zurückholen und Abrücken).
- **Beobachtung (gemessen):** Leiste am unteren Rand 119 von 640 px (bei 390 × 844: 101 px). Sie bleibt nach 1 s und nach 20 s unverändert
  stehen. Im Papierkorb deckt sie „Lageblatt (A4 quer)" und „Blanko-Vordruck (Papier-Reserve)" zur Hälfte. Schließen nur über
  „✕" (44 × 44) oder weiteres Handeln.
- **Erwartung der Rolle:** Die Bestätigung kommt, nennt die Meldung und rückt nach einigen Sekunden aus dem Weg; „Rückgängig" bleibt in
  der Quittung der Liste erreichbar.
- **Folge im Einsatz:** Der Helfer arbeitet mit einem Fünftel weniger Display und tippt Knöpfe, die halb verdeckt sind.
- **Empfehlung:** Nach einigen Sekunden auf eine einzeilige Leiste verkleinern, „Rückgängig" behalten.
- **Verifikation:** 360 × 640: Meldung entfernen, 15 s warten, Leiste ist höchstens 60 px hoch.

### R19-A4 [P3] Schnellerfassung: „In Einsatz übernehmen" ist in der Fußleiste bei 360 px abgeschnitten

- **Neu oder alt (Verweis):** neu (verwandt mit R18-G2).
- **Ort:** „Einheit schnell erfassen (nur Stärke)…", Fußleiste bei 360 × 640, Schritt 1 bis 3.
- **Beobachtung (beobachtet, Bildschirmfoto):** Der Knopf ist 121 bzw. 96 px breit; die Beschriftung läuft über den Rand, sichtbar bleibt
  „Einsatz übernehme". In Schritt 3 steht sie in zwei Zeilen („In Einsatz / übernehmen").
- **Erwartung der Rolle:** Die Hauptaktion ist vollständig lesbar.
- **Folge im Einsatz:** Der Helfer zögert, welcher Knopf abschließt und was „übernehme" bedeutet.
- **Empfehlung:** Kurzbeschriftung („Übernehmen") oder die Knöpfe auf zwei Zeilen.
- **Verifikation:** 360 × 640, Schnellerfassung: die Beschriftung ist ungekürzt sichtbar.

### R19-A5 [P3] Schnellerfassung: Schrittzähler und Überschrift zählen verschieden („Schritt 2 von 4: Personal" über „3. Personal")

- **Neu oder alt (Verweis):** neu.
- **Ort:** Schnellerfassung, Kopf und Abschnittsüberschrift.
- **Beobachtung (gemessen):** Kopf „Schritt 2 von 4: Personal", Überschrift „3. Personal"; Kopf „Schritt 3 von 4: Fahrzeuge", Überschrift
  „4. Fahrzeuge". Der Hinweis „Auf dem Blatt stehen die Fahrzeuge oben, das Personal darunter: erst Schritt 4" nennt eine Nummer, die der
  Kopf so nicht hat.
- **Erwartung der Rolle:** Eine Nummerierung. Wer vom Zettel abtippt, folgt der Zahl in der Überschrift.
- **Folge im Einsatz:** Der Helfer sucht „Schritt 4", obwohl der Kopf nur drei Schritte bis „Fahrzeuge" zählt, und bricht ab.
- **Empfehlung:** Zähler und Überschrift auf dieselbe Zahl stellen; Hinweis ohne Schrittnummer („dann Personal").
- **Verifikation:** Schnellerfassung durchgehen: Kopf und Überschrift tragen in jedem Schritt dieselbe Nummer.

### R19-A6 [P3] Schnellerfassung „nur Stärke": vier Schritte, am Ende die Rückfrage „Erfassung schon abschließen?" zu Fahrzeugen, die der Weg nicht vorsieht

- **Neu oder alt (Verweis):** neu; Kopf und erstes Feld siehe R18-W7 (offen).
- **Ort:** „Einheit schnell erfassen (nur Stärke)…", 360 × 640.
- **Beobachtung (gemessen):** Der Kopf (Einsatzname, „gespeichert", „Schritt 1 von 4") belegt 140 px; das erste Eingabefeld liegt bei y = 248
  (aufgeklappte „Angaben vom Zettel") bzw. 384 (zugeklappt, „Organisation"). Von „Weiter" bis zur Stärke sind es zwei weitere Schritte;
  Tipp auf „In Einsatz übernehmen" in Schritt 3 öffnet „Erfassung schon abschließen? Fahrzeuge und Sofortbedarf sind noch nicht bearbeitet",
  erst „Jetzt übernehmen" legt die Einheit an (danach Quittung „Meldung von „THW Zella" aufgenommen"; Nr. 7 und „abgerückt" vom Zettel bleiben).
- **Erwartung der Rolle:** „Nur Stärke" heißt: Ort und Zahl, ein Tipp zum Übernehmen; Fahrzeuge fragt der Weg nicht ab.
- **Folge im Einsatz:** Am Funk mit fünf Einheiten in der Schlange kostet jede Einheit drei zusätzliche Tipps und eine Rückfrage zu etwas, das gewollt fehlt.
- **Empfehlung:** Bei Schnellerfassung keine Rückfrage zu Fahrzeugen und Sofortbedarf; Kopf kürzer.
- **Verifikation:** Schnellerfassung mit Ort und Stärke: ein Tipp auf „In Einsatz übernehmen" legt die Einheit an.

### R19-A7 [P3] Kartenwarnung „⚠ vor 1 Std 0 Min" nennt nicht, was alt ist

- **Neu oder alt (Verweis):** neu (verwandt mit R18-A2).
- **Ort:** Karte in der Liste, Alter-Merkmal (Nr. 3 nach „Einsatz importieren…" aus der Sammel-PDF); die Nachbarkarten tragen „⚠ Stand vor 1 Std 8 Min".
- **Beobachtung (gemessen):** `<span class="kompakt-merkmal alter-merkmal warnung-text">⚠ vor 1 Std 0 Min</span>` neben „⚠ Stand vor …". Der Quelltext
  schaltet je nach Fall zwischen „Stand" und „Meldung"; im zweiten Fall steht das Wort „Meldung" nicht dabei.
- **Erwartung der Rolle:** Jede Warnung benennt, was alt ist (Stand der Angaben oder Meldung).
- **Folge im Einsatz:** „vor 1 Std 0 Min" lässt offen, ob die Angaben oder nur der Eingang so alt sind; die Karte widerspricht scheinbar ihren Nachbarn.
- **Empfehlung:** Immer „Stand vor …" bzw. „Meldung vor …" ausschreiben.
- **Verifikation:** Karten mit unterschiedlichem Alter: jede Warnung nennt „Stand" oder „Meldung".

### R19-A8 [P3] Abstände zwischen Tippzielen von 4 bis 6 px bei „Karten | Tabelle" und in den Fußzeilen-Linklisten

- **Neu oder alt (Verweis):** alt, R18-G5.
- **Ort:** Einsatzansicht „Karten | Tabelle"; Fußzeile (Anleitung, Aufbau des Bogens, Blanko-Vordruck, Organisationen).
- **Beobachtung (gemessen):** „Karten" und „Tabelle" 6 px nebeneinander (73 × 44 und 79 × 44); die Links der Fußzeile jeweils 4 px untereinander (44 px hoch).
- **Erwartung der Rolle:** Mit Handschuh trifft der Daumen das gewollte Ziel.
- **Folge im Einsatz:** Wechsel in die falsche Ansicht bzw. auf die falsche Seite; harmlos, aber Zeitverlust.
- **Empfehlung:** Mindestens 8 px Abstand.
- **Verifikation:** Abstand zwischen allen benachbarten Tippzielen mindestens 8 px.

### R19-A9 [P3] Aufgeklappte Karte ist bei 360 × 640 711 px hoch (1,1 Anzeigen)

- **Neu oder alt (Verweis):** alt, R18-M7 (bei 320 × 568 jetzt 813 statt 1 139 px).
- **Ort:** Einsatzansicht, Karte aufklappen (Nr. 2 mit Hinweis „Anderer Einsatz?").
- **Beobachtung (gemessen):** Karte 711 px bei 640 px Anzeigehöhe; bei 320 × 568 813 px. Die Aktionen stehen in drei Reihen zu je zwei bis drei Knöpfen, „Entfernen" in der letzten Reihe.
- **Erwartung der Rolle:** Aufklappen zeigt Zeiten und Aktionen, ohne dass Kopf und Fuß der Karte nie zugleich im Bild sind.
- **Folge im Einsatz:** Wer „Abrücken" und „Zuklappen" braucht, wischt; auf Papier steht die Zeile an einer Stelle.
- **Empfehlung:** Seltene Aktionen („Aufteilen…", „Verschieben…", „Als Übung kennzeichnen…") hinter „Mehr…" halten.
- **Verifikation:** 360 × 640: aufgeklappte Karte nicht höher als die Anzeige.

### R19-A10 [P3] Startseite mit vorhandenem Einsatz: „Neuen Bogen erstellen" steht erst bei y = 852 (360 × 640) bzw. 880 (390 × 844)

- **Neu oder alt (Verweis):** neu (verwandt mit R17-H1 und der Behebung „Hauptaktion oben").
- **Ort:** Startseite nach „‹ Startseite" aus einem Einsatz.
- **Beobachtung (gemessen):** Erste Bildschirmhöhe: Kopf, Offline-Hinweis, „Einsatz-Sammlung (Meldekopf)" mit Einsatzkarte („Öffnen" bei y = 441); „Meinen Bogen
  ausfüllen" mit „Neuen Bogen erstellen" und „QR-Code scannen…" liegt unter der Falz.
- **Erwartung der Rolle:** Wer nur seinen eigenen Bogen erfassen will, findet die Aktion ohne Wischen; die Einsatzkarte bleibt ein Tipp entfernt.
- **Folge im Einsatz:** Eine Einheit, die auf einem Gerät mit altem Einsatz ihre Meldung schreiben will, sucht den Knopf; ein Einsatz bleibt bis zum Löschen oben stehen.
- **Empfehlung:** Beide Hauptaktionen (Einsatz öffnen, Neuen Bogen erstellen) in der ersten Bildschirmhöhe; beendete Einsätze nach unten.
- **Verifikation:** 360 × 640 mit einem Einsatz: beide Knöpfe ohne Scrollen sichtbar.

### R19-A11 [P3] Startseite zeigt einen beendeten Einsatz nicht als beendet

- **Neu oder alt (Verweis):** neu (Folge der Behebung von R18-A6).
- **Ort:** Startseite, Karte des Einsatzes nach „Einsatz als beendet markieren".
- **Beobachtung (gemessen):** In der Einsatzansicht steht „Einsatz beendet 28.10.2026, 04:10" (bleibt nach Neuladen). Die Karte auf der Startseite zeigt weiter „5 Einheiten
  anwesend · Stärke 1 / 12 / 36 / 49", „… 5 neu seit der letzten Kenntnisnahme" und „Lageblatt: noch keins · Export: noch keiner"; das Wort „beendet" fehlt.
- **Erwartung der Rolle:** Der Zustand, der den Abschluss festhält, erscheint dort, wo man den Einsatz wiederfindet.
- **Folge im Einsatz:** Ein Helfer hält einen längst beendeten Einsatz für laufend und nimmt Meldungen hinein oder gibt den Stand als aktuell weiter.
- **Empfehlung:** „Einsatz beendet 04:10" auf der Startseitenkarte und die Karte ans Ende der Liste.
- **Verifikation:** Einsatz beenden, „‹ Startseite": die Karte nennt „beendet" mit Uhrzeit.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen einer Einheit | Summen und Bedarf sofort, Hinweise zu Stand und Kennzeichen | Blanko-Vordruck mit Meldekopf-Zeile | Fotos der Codeseiten über „Bögen einlesen…" (gemessen: 12 Bilder, 5 Bögen); „Lage vom Papier abgleichen…" (Nr., Eintreffzeit, Status, Zug, Auftrag); „Einheit schnell erfassen…" mit Nr. und Zeiten vom Zettel, sofern R19-A5/A6 nicht stören |
| Lage an der Wand | Zugsummen, Alter der Meldung, Änderungsspalte | Lageblatt A4 quer, Nachtragstafel auf eigener Seite | Nachtragszeilen über die Schnellerfassung; Eintreffzeit in der Tabelle ohne „*" (R19-A1) |
| Einheit entfällt | Papierkorb 7 Tage, „Zurückholen" | Strich im Meldeblock | Nummern bleiben (Lücke); Lageblatt und CSV erklären die Lücke nicht (R19-A2) |
| Stärke ändert sich | Folgemeldung „12 → 9", Stand und Handänderung getrennt | Kästchen „von Hand geändert" | Handänderung in PDF, CSV und Excel vermerkt (gemessen) |
| Geräteausfall am Meldekopf | Sammel-PDF, Sicherung | Ausgedruckte Sammel-PDF | „Einsatz importieren…" aus der Sammel-PDF (gemessen: 5 Einheiten, Nummern, Zeiten) oder Fotos der Seiten |
| Übergabe an den Stab | Excel „Oldenburg", CSV, Nachtrag-CSV, Quittung mit Dateiname | Lageblatt, Sammel-PDF | „Übergabe vermerken…" mit Stelle und Uhrzeit (gemessen) |
| Einsatzende | Abschlussliste, Sicherung, „Wieder öffnen" | Ausgedruckte Sammel-PDF, Lageblatt | Startseite zeigt „beendet" nicht (R19-A11) |

## Würde ich dafür das Papier weglegen?

Nein, und die App verlangt es nicht: Blanko-Vordruck, Lageblatt und Sammel-PDF halten den Ablauf ohne Gerät am Laufen, die App
arbeitet offline weiter, und der Weg vom Papier zurück (Fotos der Codeseiten, Sammel-PDF, Abgleich, Zettelangaben mit Nr.)
gelingt ohne Nacherfassung von Hand. Papier bleibt dort maßgeblich, wo Nummer, Eintreffzeit und Übergabe stehen; die App
übernimmt sie inzwischen vollständig, kennzeichnet aber nicht überall (Tabelle, Lücke im Lageblatt), was vom Gerät und was vom Papier stammt.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Eintreffzeit in der Tabelle gilt dem Helfer als Zeit vom Meldeblock, sie ist die Zeit des Einlesens (R19-A1).
- **Größtes Einsatzrisiko:** Eine Lücke in den Nummern und ein beendeter Einsatz ohne Kennzeichnung auf der Startseite werden am Aushang und am Funk falsch gedeutet (R19-A2, R19-A11).
- **Top-Priorität für die nächste Iteration:** R19-A2: entfernte Nummern im Lageblatt und in der CSV benennen.
