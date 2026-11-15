# Audit „Mobile UI", Runde 11 (Darstellung und Bedienung auf dem Telefon)

Prüfer: Rollenaudit `mobile-ui-reviewer` · Datum: 2026-10-25 ·
Prüfgegenstand: Web-App unter `http://localhost:4173` (laufender Server,
Zweig `main`, nach Runde 10) · Zählung: **P0 0 · P1 0 · P2 1 · P3 4**

Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`
und `docs/audits/runde-10/README.md`. Nicht neu gemeldet sind die dort
genannten Grenzen (R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6,
R9-M3, R9-G5, R8-H5/S4) und die Reste aus Runde 10 (leere Karten bei „Nur
Stärke", Rückgängig für Meldungen nach Neuladen, Tabellenzeilenhöhe und Kopf
der Einsatzansicht bei 180 × 320).

## Prüfaufbau

Chromium über Playwright (`chromium.launch()` ohne Optionen), `isMobile`,
`hasTouch`, Locale de-DE, je Lauf ein eigener Kontext. Viewports 390 × 844,
360 × 640, 320 × 568, quer 640 × 360 und 568 × 320, dazu `html { font-size }`
auf 130 und 150 %. Zustände über `localStorage`-Seeds (Entwurf `eeb.entwurf.v1`
aus einem Übungsbogen, Sammlung „Hochwasser Musterstadt" mit sechs Meldungen
aus `examples/thw/`, `uebung: false`); der Hinweis „Zeitraum vorbei" und die
Datenschutzfrist stammen aus den Beispieldaten und sind nicht gewertet.

Durchlaufen: Startseite (leer, mit Entwurf), Ansicht-Menü, Assistent Schritt 1
bis 6, Schnellerfassung und manuelle Erfassung, Rückfragen („Angefangenen Bogen
verwerfen?", „Ort der Einheit fehlt", Datensicherung), Einsatzansicht (Karten,
aufgeklappte Karte mit „Mehr…", „Zug zuordnen", „Auftrag/Notiz", „Details",
Abrücken samt Quittung, Filter, Tabelle), Scanner ohne Kamera, Lagemonitor.
Gemessen: `scrollWidth` gegen `innerWidth` (nirgends ein seitlicher Überlauf),
Ziele unter 40 px, Schriften unter 12 px, Eingabefelder unter 16 px (keine),
Lage der klebenden Leisten, Zugriffsnamen der Symbolknöpfe.

Nicht prüfbar: echte Bildschirmtastatur, Safe-Area, WebKit, Kamera, Handschuhe,
Licht. Datums- und Zeitfelder zeigen im Testbrowser „mm/dd/yyyy" (nicht
gewertet).

Kennzeichnung: *gemessen* = mit Zahlen reproduziert, *beobachtet* = im Bild
gesehen.

## Urteil

Die Umbauten aus Runde 10 halten in den geprüften Lagen: kein seitlicher
Überlauf bei 320, 360, 390 und quer, alle Eingabefelder mit mindestens 16 px,
Rückfragen mit allen Wegen im Bild, Symbolknöpfe mit sprechenden Namen („Person
1 nach oben"), „Ort der Einheit fehlt" führt mit einem Knopf zum Feld. Neu sind
ein Layoutproblem der Schnell- und manuellen Erfassung (P2) und vier kleine
Stellen (P3).

## Befunde

### R11-M1 [P2] Schnell- und manuelle Erfassung: Kopf und zweizeilige Fußleiste nehmen die Hälfte des Bildes, das Pflichtfeld „Ort der Einheit" liegt über zwei Bildschirme tiefer

**Kennzeichnung:** gemessen.

**Ort:** Einsatzansicht → „Einheit schnell erfassen (nur Stärke)…" bzw.
„Einheit manuell erfassen…" → Schritt 1 (und Schritt 3).

**Beobachtung:** Der Kopf (Rücksprung, Marke „Schnellerfassung", Kasten
„Aufnahme für: …", Statuszeile, Schrittleiste) reicht bis 195 px, die Fußleiste
hat zwei Zeilen („In Einsatz übernehmen" über „← ◐ Weiter →") und ist 128 px
hoch (im normalen Assistenten 70 px). Sichtbare Formularfläche:

| Viewport | Fußleiste ab | Fläche zwischen Schrittleiste und Fuß | Anteil |
| --- | --- | --- | --- |
| 390 × 844 | 716 px | 541 px | 64 % |
| 360 × 640 | 512 px | 318 px | 50 % |
| 320 × 568 | 440 px | 246 px | 43 % |

Das erste Bild zeigt drei optionale Zettelfelder („Eingetroffen um", „Nr. laut
Zettel", „Zug / Verband") samt Erklärtext. Der Fokus nach dem Öffnen liegt auf
der Überschrift „1. Einheit"; das einzige Pflichtfeld „Ort der Einheit" hat die
Oberkante 1 247 px (360 × 640), 1 332 px (320 × 568), 1 227 px (390 × 844) –
also 735 bis 890 px unter dem Fußrand, nach Organisation, Organisationsname,
Einheitstyp, Erklärtext und „Ebene". In Schritt 3 („Nur Stärke") beginnen die
Zähler „Führer / Unterführer / Mannschaft" bei 360 × 640 erst unter den zwei
Optionsfeldern, die Zähler sind halb von der Fußleiste verdeckt.

**Folge:** Die Schnellerfassung ist der Weg für den Meldekopf unter Zeitdruck
(„Es reichen der Ort der Einheit … und die Stärke"). Wer „In Einsatz
übernehmen" tippt, bevor er den Ort gefunden hat, bekommt die Rückfrage „Ort
der Einheit fehlt" (gut, mit Knopf zum Feld); der Normalweg verlangt aber
zweimal Rollen über Felder, die die Schnellerfassung nicht braucht.

**Empfehlung:** In Schnell- und manueller Erfassung „Ort der Einheit" und die
Stärke nach oben (oder die optionalen Zettelfelder und die Felder Organisation
bis Ebene hinter einen Aufklapper „Weitere Angaben"), und die Fußleiste auf eine
Zeile bringen (etwa „In Einsatz übernehmen" als Hauptknopf, „Weiter" entfällt
oder rückt in die Schrittleiste). Fokus beim Öffnen auf „Ort der Einheit".

### R11-M2 [P3] Tabelle der Einsatzansicht: Einheitennamen bei 320 und 360 px nur 11 px groß, bei 390 px 13 px

**Kennzeichnung:** gemessen (Schriftgröße je Viewport).

**Ort:** Einsatzansicht → „Tabelle", Spalte „Einheit".

**Beobachtung:** Die klebende Namensspalte setzt Nummer und Name in 11 px (fett)
bei 360 und 320 px, in 13 px bei 390 px; die Zahlenzellen daneben stehen in 14
px. Spaltenbreite 134 px (360), Namen laufen über drei bis vier Zeilen
(„Nr. 3 THW Freiburg Fachgruppe Wasserschaden/Pumpen (A)"), Zeilenhöhe 62–96 px.

**Folge:** Der Name ist das Merkmal, an dem die Zeile gefunden wird, und ist
die kleinste Schrift der Zeile; bei Dämmerung oder Armlänge schwer lesbar. Mit
den Karten gibt es einen lesbaren Ausweichweg, daher P3.

**Empfehlung:** Name bei schmalem Fenster nicht unter 13 px; lieber Kurzform
(„Nr. 3 · THW Freiburg") in der Tabelle und der volle Name in der Karte.

### R11-M3 [P3] Quittung nach „Abrücken" kürzt die Einheit auf „Nr. 1…", und Quittung plus Ansicht-Balken belegen 19 bis 21 % des Bildes

**Kennzeichnung:** beobachtet im Bild (320 × 568 und 360 × 640), Höhen gemessen.

**Ort:** Einsatzansicht, aufgeklappte Karte → „Abrücken" → Streifen
„Abgerückt 16:34: …  Rückgängig ✕".

**Beobachtung:** Bei 320 px steht im Streifen „Abgerückt 16:34: Nr. 1…", bei
360 px „Nr. 1 „THW…". Der Streifen ist fest (65 px hoch) und liegt über dem fest
stehenden Balken „◐ Ansicht: Standard" (57 px): zusammen 122 px von 640 (19 %)
bzw. 568 (21 %), die Karte darunter ist nur noch in einem schmalen Streifen zu
sehen.

**Folge:** Wer in der Liste mehrere Einheiten nacheinander abrückt, kann an der
Quittung nicht mehr ablesen, welche gerade abgerückt wurde, und hat „Rückgängig"
im Daumenbereich, aber ohne vollständigen Bezug. Es ist rückgängig machbar, daher
P3.

**Empfehlung:** Erst den Namen kürzen (Nummer und Ortsteil des Namens), nicht
abschneiden; alternativ den Streifen in den Ansicht-Balken einbauen statt zu
stapeln.

### R11-M4 [P3] „Bogen fortsetzen" in der Einsatzansicht ist ein 30 px hoher Textknopf

**Kennzeichnung:** gemessen (108 × 30 px bei allen drei Phone-Viewports).

**Ort:** Einsatzansicht, Hinweis „Dein eigener Bogen „…" ist noch offen. Bogen
fortsetzen".

**Beobachtung:** Der Knopf ist der einzige Bedienpunkt der Einsatzansicht unter
44 px Höhe (alle übrigen gemessen ≥ 44 px) und als unterstrichener Link
gestaltet; er liegt unmittelbar unter den drei großen Knöpfen „Bogen scannen…",
„Einheit manuell erfassen…", „Bögen einlesen…".

**Folge:** Der Weg zurück in den eigenen offenen Bogen ist für Handschuhe der
unscheinbarste und am schwersten zu treffende Knopf der Seite; Fehltipp trifft
den Hinweiskasten ohne Wirkung.

**Empfehlung:** Als Knopf in 44 px Höhe wie die Nachbarn (ruhige Form).

### R11-M5 [P3] Einsatzansicht quer bei 568 × 320: Kachel „Gesamt" bricht in eine zweite Zeile, „Bogen scannen…" beginnt erst bei 317 px

**Kennzeichnung:** gemessen.

**Ort:** Einsatzansicht, Zahlenkacheln über den drei Aufnahmeknöpfen.

**Beobachtung:** Bei 568 × 320 stehen vier Kacheln in einer Zeile, „53 Gesamt"
allein in einer zweiten (Oberkante 186 und 256 px). „Bogen scannen…" beginnt
dadurch bei 317 px von 320 px und liegt vollständig unter dem Bild; bei 640 × 360
und 844 × 390 passen alle fünf Kacheln in eine Zeile, der Knopf beginnt bei 246
bzw. 252 px.

**Folge:** Im Querformat kleiner Telefone ist im ersten Bild keine Aktion
erreichbar; die Gesamtzahl, die wichtigste Zahl, steht abgesetzt in der zweiten
Zeile.

**Empfehlung:** Kacheln im Querformat enger (fünf in einer Zeile, kleinere Ziffer)
oder „Gesamt" an den Anfang.

## Hinweis ohne Wertung

Bei vergrößerter Schrift (`html { font-size: 130 % }` und mehr, 360 × 640) schaltet
der Kopf des Assistenten auf die kompakte Form; die Statuszeile zeigt dann nur
„✓ 16:38", ohne „gespeichert" und ohne „nur auf diesem Gerät". Der Wortlaut bleibt
im Text vorhanden (Schriftgröße 0), ist aber nicht sichtbar. Beobachtet, nicht
gewertet, weil die kompakte Form eine bewusste Entscheidung aus früheren Runden
ist.
