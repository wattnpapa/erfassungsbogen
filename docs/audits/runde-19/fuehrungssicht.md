# Audit „Führungssicht", Runde 19 (Lage führen, Lagemonitor, Stand übergeben)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-28 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `0ac0d7f` (`main`).

Zählung: **P0: 0 · P1: 0 · P2: 1 · P3: 12** (13 Befunde)

Reiner Prüfbericht, keine Codeänderung. Maßstab: Es gibt keine „bekannten
Grenzen" zum Auslassen. Was im echten Browser noch zu beobachten ist, wird
gemeldet, auch wenn es früher als „offen", „teilweise" oder „nicht gemessen"
geführt wurde (dann mit alter Befund-ID im Feld „Neu oder alt").

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales
Playwright-Modul unter `/opt/node-tools`, da die Projektkopie keinen Browser
findet), Locale de-DE, Zeitzone Europe/Berlin, `isMobile`/`hasTouch`; Telefon
390x844 und 360x640, der Lagemonitor zusätzlich bei 1280x720. Zustand:
Einsatz „Hochwasser Neckar · BR Sporthalle Rottenburg"; sieben Beispielbögen
THW (Albstadt, Biberach/Riß, Crailsheim, Freiburg, Haßmersheim, Karlsruhe,
Laufenburg) aus „Beispielbögen › PDF" über „Bögen einlesen…" aufgenommen, je
Karte „Mehr… › Als Einsatzmeldung zählen…". Danach: Zug je Karte (1. bis
3. Zug), Auftrag (Nr. 3), Abrücken (Nr. 6), „Stärke ändern…" (Nr. 2: 11 auf 8),
„Entfernen" (Nr. 6) mit Neuladen, Papierkorb „Zurückholen", Lageblatt (PDF,
mit `pdftotext` und als Bild gelesen), Übersicht und „Alle Daten" als CSV,
Excel-Liste, Sammel-PDF (16 Seiten), „Übergabe vermerken…", „Einsatz als
beendet markieren", „Einsatz importieren…" der Sammel-PDF auf einem leeren
Gerät, „Einsatz löschen…", Lagemonitor (`?lagemonitor=<id>`), Tabelle und
„Alle Spalten zeigen", Scanner ohne Kamera, Schnellerfassung und „Einheit
manuell erfassen…" bis zur letzten Fußleiste, Erstbesuch (Layoutverschiebung
mit `PerformanceObserver`), Zurück-Geste beim Kaltstart. Browserfehler in der
Konsole: keine.

Nicht geprüft: echter Fernseher, Drucken, Kamera, 320x568, Höhe der
Sollstärke-Rückfrage (R18-S4, kein Auslöser gefunden).

## Urteil

Die Lage ist ohne fremde Hilfe zu lesen, zu pflegen und zu übergeben. Die
Behebungen der Runde 18 halten im Browser fast durchweg: Karte, Lageblatt,
Dialog „Meldung entfernen" und Übersicht-CSV nennen „Stand der Angaben" jetzt
einheitlich als Alter des Bogens, die Zugsummen gehen auf (Verpflegung
12 + 34 + 4 = 50, Unterbringung 8 + 12 + 4 = 24, Stärke F/U/M 2/13/35 gegen die
Kopfzeile), die Übergabe auf ein leeres Gerät bringt Zug, Auftrag und
Abrückstatus mit. Was bleibt, ist ein Layoutfehler in der Fußleiste des
Assistenten (P2) und eine Reihe kleinerer Reste bei Wortwahl, Flächenverbrauch
und Rückmeldungen.

Geprüft und in Ordnung (Behebungen aus Runde 18, nicht erneut gemeldet):

- Tipp-Sperre: „Meldung entfernen", „Als Einsatzmeldung zählen", „Vermerken",
  „In den Papierkorb" tragen in der ersten Sekunde `aria-disabled`; ein Tipp
  nach 150 ms bleibt ohne Wirkung und der Dialog zeigt „Einen Moment …".
- Quittungsleiste ersetzt die Ansichtsleiste, verschwindet zwischen 20 und
  40 s; „Rückgängig" arbeitet als Stapel (Abrücken zuerst, danach Entfernen).
- „Entfernen": Nummern bleiben („Nr. 6 bleibt frei"), Papierkorb nach Neuladen
  mit Zug, Stand und Auftrag je Fassung, „Zurückholen" liefert die Meldung.
- Übergabe: „Übergabe vermerken…" (mit Stelle), „Einsatz als beendet
  markieren" nennt „noch offen: Übersicht als CSV, Datensicherung" und bietet
  „Wieder öffnen". Dateinamen mit Datum, Uhrzeit, Art und Einsatz
  (`2026-10-28_0506_eeb-lageblatt_Hochwasser_Neckar.pdf`).
- Tabelle am Telefon ohne seitliches Wischen (fünf Kernspalten, 26 bei „Alle
  Spalten zeigen" mit Wischfläche), Kennzahlenraster auf einer Linie, „Bogen
  scannen…" bei y = 400 bis 443, „Gehört zu dieser Lage" 44 px, Scanner ohne
  Kamera mit Handscanner-Hinweis und „QR aus Bild einlesen…", Erstbesuch ohne
  Sprung (Seitenhöhe und „Einsatz-Sammlung" über 4 s unverändert), Zurück beim
  Kaltstart führt zur Startseite (R18-K12 behoben), Lagemonitor bei 1280x720
  alle sechs Einheiten ohne Scrollen, Warnzeile groß, „103 Tage" ausgeschrieben,
  Reihenfolge benannt.

## Befunde

### R19-K1 [P2] Fußleiste des Assistenten: „In Einsatz übernehmen" abgeschnitten, auf der letzten Seite überlagert sie „Zurück"

- **Neu oder alt (Verweis):** neu.
- **Ort:** „Einheit manuell erfassen…" und „Einheit schnell erfassen…", alle
  Schritte bei 360x640, letzter Schritt („Fahrzeuge") auch bei 390x844.
- **Beobachtung:** Der Knopf „In Einsatz übernehmen" ist bei 360 px 121 px breit
  (`nowrap`, Text 157 px) und zeigt „Einsatz übernehme". Im letzten Schritt
  schrumpft er auf 96 bis 103 px, der Text läuft über den Nachbarn: „← Zurück"
  erscheint als „Zurüc", davor „insatz übernehm". Am Telefon mit 390 px ist es in
  Schritt 1 bis 3 noch unauffällig, im letzten Schritt gleich.
- **Folge:** Die Aktion, die eine Meldung in die Lage übernimmt, ist beschriftet
  wie ein Fehlerbild; wer am Meldekopf mehrere Einheiten hintereinander erfasst,
  zweifelt, ob der Knopf „Übernehmen" oder etwas anderes tut, und trifft bei
  Handschuhen den überlagerten „Zurück".
- **Empfehlung:** Beschriftung kürzen („Übernehmen") oder die Fußleiste in zwei
  Zeilen umbrechen; Texte dürfen Nachbarknöpfe nicht überlagern.

### R19-K2 [P3] „Alle Daten als CSV" nennt als „Stand" die Zeit der Bearbeitung am Meldekopf, nicht das Alter des Bogens

- **Neu oder alt (Verweis):** alt, R18-K1 / R17-K1 (Karte, Lageblatt, Dialog und
  „Übersicht als CSV" behoben, diese Datei nicht).
- **Ort:** „Alle Daten als CSV", Spalte „Stand".
- **Beobachtung:** Nr. 1 (Bogen vom 17.07.2026, 08:05) trägt in „Stand" den Wert
  „28.10.2026, 05:00" (Zeitpunkt der Kennzeichnung am Meldekopf), Nr. 2 „05:03"
  (Stärkeänderung). „Übersicht als CSV" und Lageblatt nennen für dieselben
  Einheiten „Stand der Angaben" 17.07.2026 und 16.07.2026. Die Datei „Alle Daten"
  hat keine Spalte „Stand der Angaben" und keinen Hinweis auf das Alter.
- **Folge:** Wer „Alle Daten" auswertet, liest frische Zeiten für über drei
  Monate alte Angaben; dieselbe Einheit hat in zwei Exporten zwei „Stand".
- **Empfehlung:** Spalte „Stand der Angaben" (Bogen) und getrennt „Geändert am
  Meldekopf" führen, wie in der Übersicht.

### R19-K3 [P3] Lageblatt-PDF: Spalte „Stand der Angaben" bricht mitten im Wort und wiederholt in jeder Zeile denselben Satz

- **Neu oder alt (Verweis):** neu.
- **Ort:** Lageblatt (A4 quer), Spalte „Stand der Angaben".
- **Beobachtung:** In jeder Zeile steht „Kennzeichnun-g am Meldekopf geändert
  28.10.2026, 05:00" in einer etwa 17 mm breiten Spalte, getrennt mitten im
  Wort „Kennzeichnun / g"; je Zeile kommen sechs bis sieben Zeilen hinzu. Mit
  sieben Einheiten läuft das Blatt auf zwei Seiten, Nr. 7 und der Block
  „Abgerückt" stehen auf Seite 2; bei Nr. 5 sind Hinweise und Seitenrand eng.
- **Folge:** Die Zeile je Einheit wird hoch, das Blatt „eine Seite Lage" geht
  verloren; die eigentliche Angabe (Stand) geht neben dem Satz unter.
- **Empfehlung:** Satz nur dort nennen, wo er etwas anderes als „am Meldekopf
  gezählt" bedeutet, oder kürzen („am Meldekopf gekennzeichnet 05:00"); Spalte
  breiter.

### R19-K4 [P3] Zweiter Export innerhalb einer halben Sekunde wird still verworfen

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht, Block „Weitergeben, Lageblatt, Export".
- **Beobachtung:** „Lageblatt (A4 quer)" tippen, 500 ms später „Übersicht als
  CSV": kein Download, keine Meldung; die Übergabe-Liste führt die CSV weiter als
  „noch nicht". Nach 3 s Abstand lädt die CSV.
- **Folge:** Wer zwei Dateien kurz hintereinander anstößt, glaubt, beide zu
  haben; die fehlende Datei fällt erst beim Stab auf.
- **Empfehlung:** Ein verworfener Export meldet „Einen Moment — läuft noch" wie
  die Tipp-Sperren der Dialoge.

### R19-K5 [P3] Die Quittungsleiste nach „Entfernen" ist 135 bis 136 px hoch und verdeckt die Karte darunter

- **Neu oder alt (Verweis):** alt, R18-A8 („nicht neu gemessen").
- **Ort:** Einsatzansicht, nach „Meldung entfernen" (390x844: 135 px,
  360x640: 136 px = 21 % der Höhe); zum Vergleich „Auftrag gesetzt" 101 px,
  „Abgerückt" 103 px, „Stärke geändert" 67 px.
- **Beobachtung:** Der Text „Entfernt (3 Fassungen): Meldung Nr. 2 „…" (8
  Personen). Nr. 2 bleibt frei. 7 Tage im Papierkorb unter der Liste." steht in
  vier Zeilen, die Leiste liegt über Nr. 7. Sie ist 20 bis 40 s sichtbar.
- **Folge:** Ein Fünftel des Bildschirms ist für Text gesperrt, den die Führung
  beim Entfernen schon kennt; die Nachbarkarte ist nicht bedienbar.
- **Empfehlung:** Zwei Zeilen („Nr. 2 entfernt · Rückgängig"); die Erklärung
  zum Papierkorb im Papierkorb selbst.

### R19-K6 [P3] Die Einheitenliste beginnt nach 1,6 bis 2,3 Bildschirmen; die Tabelle nach 2,6

- **Neu oder alt (Verweis):** alt, R18-K3 / R17-K12 und R18-K8.
- **Ort:** Einsatzansicht, 360x640 und 390x844, mit sieben Einheiten.
- **Beobachtung:** Überschrift „Einheiten (…)" bei y = 1002 (360x640) bzw. 1014
  (390x844); bei einem Block „Neu seit der letzten Kenntnisnahme" erst bei
  1495. Die Tabelle beginnt bei y = 1682 (390) bzw. 1692 (360), Zeilen 78 bis
  108 px, Schrift 12 und 13 px, Namen mit „…" abgeschnitten („Wassergefahre…",
  „Wasserschade…"). Vier Erfassungsknöpfe und ein Bedarfsblock stehen davor;
  „Zur Einheitenliste ↓" ist vorhanden.
- **Folge:** Wer die Lage lesen will, scrollt an Erfassungsknöpfen vorbei; in
  der Tabelle sind bei 640 px höchstens vier Zeilen zugleich sichtbar.
- **Empfehlung:** Erfassungsknöpfe unter die Liste oder als eine Zeile; in der
  Tabelle Namen auf „Nr. + Ort" kürzen, damit „(A)/(B)" nicht abgeschnitten wird.

### R19-K7 [P3] Die Startseite nennt weder „Einsatz beendet" noch „Übergabe vermerkt an …"

- **Neu oder alt (Verweis):** neu.
- **Ort:** Startseite, Karte „Einsatz-Sammlung (Meldekopf)".
- **Beobachtung:** In der Einsatzansicht steht oben „Einsatz beendet 28.10.2026,
  05:08" und „Übergabe vermerkt … an Stab Rottenburg". Die Karte auf der
  Startseite zählt nur Lageblatt, Export und Weitergabe-Datei auf („Empfang nicht
  bestätigt") und trägt „Öffnen"; ein beendeter Einsatz sieht aus wie ein laufender.
- **Folge:** Bei mehreren Einsätzen auf dem Gerät ist der Abschluss nur nach
  Öffnen jedes Einsatzes zu erkennen; die Ablösung hält einen beendeten Einsatz
  für laufend.
- **Empfehlung:** Status „beendet 05:08 · übergeben an Stab Rottenburg" in die
  Karte.

### R19-K8 [P3] Auf dem Empfängergerät steht ein Export-Stempel des Absenders als „erzeugt"

- **Neu oder alt (Verweis):** neu.
- **Ort:** „Übergabe und Abschluss" nach „Einsatz importieren…" auf einem leeren
  Gerät.
- **Beobachtung:** Die Liste zeigt „✓ Excel-Liste: erzeugt 28.10.2026, 05:06",
  obwohl auf diesem Gerät keine Datei erzeugt wurde; Sammel-PDF, Lageblatt,
  Übersicht-CSV und Datensicherung stehen auf „noch nicht".
- **Folge:** Die Ablösung hält die Excel-Liste für ihre eigene Lieferung und
  gibt sie ggf. nicht neu aus; die Liste widerspricht sich selbst.
- **Empfehlung:** Stempel des Absenders nicht übernehmen oder alle nachweisen
  („vom Quellgerät 05:06").

### R19-K9 [P3] Schnellerfassung: Schrittzählung widerspricht sich, Pflichtfeld „Ort" erst bei y = 870

- **Neu oder alt (Verweis):** alt, R18-W7 (erstes Eingabefeld bei y = 248 statt
  unter 200); Zählung neu.
- **Ort:** „Einheit schnell erfassen (nur Stärke)…", 390x844 und 360x640.
- **Beobachtung:** Der Kopf sagt „Schritt 2 von 4: Personal", die Überschrift
  „3. Personal"; „Schritt 3 von 4: Fahrzeuge" steht über „4. Fahrzeuge"; der
  Hinweis in Schritt 1 sagt „Ort hier, Stärke in Schritt 3", das Personal ist
  Schritt 2. Das erste Eingabefeld liegt bei y = 248, der Ort („Pflicht") bei
  y = 870 hinter Organisation, Organisationsname, Einheitstyp, Zugehörigkeit.
  Kopf 150 px und Fußleiste 57 px lassen bei 640 px etwa 430 px für Felder.
- **Folge:** Die „Schnell"-Erfassung braucht vier Schritte mit unklarer Zählung;
  der Meldekopf sucht das einzige Pflichtfeld unter den optionalen.
- **Empfehlung:** Zählung vereinheitlichen; Ort und Stärke zuerst, Organisation
  als Vorbelegung dahinter.

### R19-K10 [P3] Sieben Dateien auf einmal: Meldung „7 aufgenommen, 7 bereits vorhanden" (nicht jedes Mal)

- **Neu oder alt (Verweis):** neu.
- **Ort:** „Bögen einlesen…" mit sieben PDFs, leerer Einsatz, 390x844.
- **Beobachtung:** In zwei von sieben Läufen lautete die Meldung „7 Bögen
  aufgenommen, 7 bereits vorhanden. Aufnahme 04:58 …", in fünf Läufen mit
  gleichen Dateien „7 Bögen aufgenommen" (Liste zeigte jeweils sieben
  Einheiten). Mit zwei bis sechs Dateien kam die Meldung nie. Ursache nicht
  geklärt.
- **Folge:** Der Stab zweifelt, ob Bögen doppelt zählen; das Ergebnis (sieben
  Einheiten, Summe 57) war richtig.
- **Empfehlung:** Die Meldung nur zeigen, wenn Bögen tatsächlich schon vor dem
  Einlesen vorhanden waren.

### R19-K11 [P3] Lagemonitor: Warnzeile beginnt mit einem hängenden „·", Zug und Stand stehen in der Spalte „Orga"

- **Neu oder alt (Verweis):** alt, R18-K5 (Hauptpunkte behoben).
- **Ort:** Lagemonitor, 360x640.
- **Beobachtung:** Die Warnzeile beginnt mit „· ⚠ älteste Meldung vor 104 Tagen,
  6 von 6 älter als 1 Std" (Trennpunkt am Zeilenanfang, Zeile in drei Zeilen
  gebrochen); in der Tabelle teilen sich „THW", „⚠ Stand 104 Tage" und „2. Zug"
  die Spalte „Orga", der Auftrag steht unter dem Funkruf. Der Satz „seit erster
  Meldung: 0 Stunden, 9 Minuten" mischt Einheiten.
- **Folge:** Gering; die Zeile liest sich zuerst als Rest eines vorigen Satzes.
- **Empfehlung:** Trennpunkt nur zwischen Teilen; „seit 9 Min" statt
  „0 Stunden, 9 Minuten"; Zug in eigene Spalte.

### R19-K12 [P3] Dauerleiste „Ansicht: Standard" belegt 57 px unter jeder Seite und teilt sich den Rand mit der Quittung

- **Neu oder alt (Verweis):** neu.
- **Ort:** Einsatzansicht und Assistent, 360x640 (57 px = 9 % der Höhe) und
  390x844.
- **Beobachtung:** Eine feste Leiste `anzeige-balken` (Knopf „Ansicht:
  Standard") liegt dauerhaft am unteren Rand; Quittungen ersetzen sie (siehe
  R19-K5). Im Assistenten kommt die Fußleiste mit „Zurück/Übernehmen/Weiter"
  dazu.
- **Folge:** Bei 640 px bleiben etwa 580 px für Inhalt, nach „Entfernen" etwa
  440 px; die Führung braucht die Ansicht „Nacht" selten, aber ständig sichtbar.
- **Empfehlung:** Ansicht in den Kopf oder hinter „Mehr"; unten nur
  Handlungsleisten.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Stand" meint im Lageblatt und in der
  Übersicht das Alter des Bogens, in „Alle Daten als CSV" die Zeit der
  Bearbeitung am Meldekopf.
- **Größtes Einsatzrisiko:** Die abgeschnittene, im letzten Schritt
  überlagerte Fußleiste des Assistenten (R19-K1) beim Erfassen am Meldekopf
  mit Handschuhen.
- **Top-Priorität für die nächste Iteration:** R19-K1, Fußleiste des
  Assistenten bei 360 px.
