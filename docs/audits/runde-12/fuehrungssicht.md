# Audit „Führungssicht", Runde 12 (Lage führen, Lagemonitor, Stand übergeben)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `2c96abe` (`main` nach Runde 11).

Zählung: **P0: 0 · P1: 0 · P2: 1 · P3: 3** (4 Befunde)

Reiner Prüfbericht, keine Codeänderung. Nicht neu gemeldet sind die Grenzen aus
`docs/audits/README.md`, `runde-10/README.md` und `runde-11/README.md`
(darunter R11-S4, R11-H2, R11-K2 „Abgerückte bleiben am Listenplatz",
R11-A2, R11-A5, R11-M1, R11-M3).

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales
Playwright-Modul, weil die Projektkopie keinen Browser fand), Locale de-DE,
`isMobile`/`hasTouch`, Telefon 390x844 und 360x640. Zustand aus
`localStorage`-Seed (`eeb.einsaetze.v1`) mit acht Bögen aus `examples/thw/`,
`uebung: false`, Meldealter 2 bis 400 Minuten, zwei Abgerückte (Seed-Artefakt:
alle Karten „ANONYMISIERT" und „Zeitraum vorbei", weil die Übungsbögen alt
sind). Bedient: Startseite, Einsatzansicht, Karte aufklappen, Abrücken mit
Quittung, Zug zuordnen (neuer Zug), Zwischensummen, Karten/Tabelle bei 360x640,
Filterfeld, „Neue Einsatz-Sammlung…" mit gleichem Namen, Lageblatt (PDF
heruntergeladen und als Text gelesen), „Einsatz weitergeben / sichern" und
Wiedereinlesen der Datei in einem frischen Browserprofil, Neuladen,
Lagemonitor (`?lagemonitor=s1`), Kontrastmessung in den vier Ansichten.

Nicht prüfbar: echter Fernseher, Vollbild, Drucken, Kamera.

## Urteil

Die Behebungen aus Runde 11 halten: Die Altersangabe misst jetzt an den
anwesenden Einheiten („⚠ älteste Meldung vor 6 Std 40 Min, 4 von 6 älter als 1
Std" auf Startseite, Kopf und Monitor; Marken „⚠ vor 5 Std 0 Min" je Karte;
Monitorzeilen „⚠ 3 Std"), das Anlegen einer gleichnamigen Sammlung fragt nach
(„Vorhandene öffnen / Trotzdem neu anlegen"), der Filter „Status" mit „nur
Anwesende (6)" und „nur Abgerückte (2)" ist da, die Quittung beim Abrücken nennt
Uhrzeit und bietet „Rückgängig". Die Übergabe an eine zweite Führungskraft
funktioniert ohne fremde Hilfe: Sammel-PDF erzeugen, auf dem zweiten Gerät
„Einsatz importieren…", Quittung „8 Einheiten, davon 6 anwesend. Stand der
Datei: letzte Meldung …", Zahlen und Warnung identisch. Reibung bleibt bei
genau dem Signal, das der Führungskraft sagt, ob sie der Summe trauen darf.

## Befunde

### R12-K1 [P2] Altersangabe im Kopf der Einsatzansicht ist in „Standard" und „Feld" kaum lesbar (Kontrast 1,7 : 1)

**Ort:** Einsatzansicht, blauer Kopf unter dem Namen („⚠ älteste Meldung vor … ,
n von m älter als 1 Std", Klasse `aelteste-meldung warnung-text`).

**Beobachtung (gemessen):** Schrift `rgb(109, 71, 0)` (13 px) auf Kopfgrund
`rgb(18, 39, 94)`: Kontrastverhältnis 1,73 : 1 in den Ansichten „Standard" und
„Feld"; in „Dunkel" (9,47 : 1) und „Nacht" (8,70 : 1) ist sie lesbar. Im
Screenshot ist der Teil hinter „Einsatz · letzte Meldung … (vor 2 Min)" nur als
dunkler Schleier zu erkennen, das ⚠ ist kaum auszumachen. Die Warnung aus
R10-K1/R11-K1 ist damit genau dort schwach, wo sie den größten Nutzen hat.

**Folge:** Die Führungskraft liest „letzte Meldung vor 2 Min" in Weiß und
übersieht, dass vier von sechs Einheiten über eine Stunde alt sind. Gerade
„Feld" (Sonnenlicht) ist die Ansicht, die draußen am Meldekopf gewählt wird.

**Empfehlung:** Für die Warnzeile im dunklen Kopf dieselbe helle Warnfarbe wie
in „Dunkel" verwenden (oder die Zeile auf helle Fläche setzen); in allen vier
Ansichten mindestens 4,5 : 1.

**Nachprüfung:** Seed mit Meldealter über 60 Minuten; Kontrast der Zeile in
allen vier Ansichten messen; Screenshot 360x640 in „Feld" lesen.

### R12-K2 [P3] Sortierung kennt kein „Älteste Meldung zuerst"; „nur veraltete" fehlt

**Ort:** Einsatzansicht, „Suchen, sortieren, filtern".

**Beobachtung:** Sortierungen: „Nr.", „Name (A–Z)", „Zuletzt gemeldet (neueste
zuerst)", „Eintreffzeit vor Ort (neueste zuerst)", dazu Zug, Organisation,
„nur dringender Bedarf", Auftrag/Zug, Status. Eine Ordnung nach dem Alter der
Meldung mit der ältesten zuerst und ein Filter „älter als 1 Std" gibt es nicht;
die ⚠-Marken stehen verstreut an den Karten.

**Folge:** Die Frage „von wem habe ich seit Stunden nichts gehört?" verlangt bei
30 Einheiten das Durchblättern aller Karten; der Hinweis „4 von 6 älter als 1
Std" nennt die Zahl, aber nicht welche.

**Empfehlung:** Sortierung „Älteste Meldung zuerst" und Filter „nur ⚠ ältere";
optional die Zahl im Kopf („4 von 6 …") antippbar machen, sie setzt den Filter.

**Nachprüfung:** Seed wie oben: Sortierung zeigt Nr. 1 (6 Std 40 Min) zuerst;
Filter zeigt vier Karten.

### R12-K3 [P3] Alter fehlt in der Tabelle, in den Zwischensummen je Zug und auf dem Lageblatt

**Ort:** Einsatzansicht „Tabelle" (360x640), „Zwischensummen nach Zug",
Lageblatt (PDF).

**Beobachtung:** Die Tabelle hat 22 Spalten, sichtbar sind am Telefon „Einheit",
„Ges.", „F", „U"; eine Spalte „Meldung vor" gibt es nicht, nur „Eingetr."
(absolut) und „Stand" (Stand des Bogens, bei der Einheit selbst gesetzt). Die
Zwischensumme „1. Zug · 3 Einheit(en) · Stärke 0 / 8 / 25 / 33" sagt nicht, dass
dieser Zug 3 bis 5 Stunden alt ist. Das Lageblatt trägt im Kopf „Lage: 6
Einheiten zählend · Stärke …" ohne den Satz „älteste Meldung vor …, 4 von 6 älter
als 1 Std", den Bildschirm und Monitor zeigen.

**Folge:** Wer das Lageblatt an die Wand hängt oder die Zugsummen vorliest,
trägt die Warnung nicht mit; Stärke je Zug wirkt frisch, obwohl sie es nicht ist.

**Empfehlung:** Dieselbe Altersaussage in die Kopfzeile des Lageblatts und je Zug
in die Zwischensumme („älteste Meldung vor 5 Std"); in der Tabelle eine Spalte
„Meldung vor" neben „Ges.".

**Nachprüfung:** Lageblatt-Text enthält die Altersaussage; Zwischensumme des
1. Zugs nennt 5 Std.

### R12-K4 [P3] Bedarfszeile uneinheitlich: „27Personen" ohne Leerzeichen, Monitor ohne Verpflegung und ohne Einheit bei Unterbringung

**Ort:** Einsatzansicht, Zeile „Bedarf:" (Aufklapper); Lagemonitor, Zeile
„Bedarf".

**Beobachtung:** Die Einsatzansicht zeigt „Verpflegung 53 · Unterbringung
27Personen · Diesel 480 l · Ruhezeit 3 Einheiten" (kein Leerzeichen zwischen Zahl
und „Personen", im Screenshot sichtbar). Der Lagemonitor zeigt „Bedarf: Diesel
480 l · Unterbringung 27 · Ruhezeit 3 Einheiten": keine Verpflegung (App, Lageblatt
und CSV führen sie seit R11-W1), „Unterbringung 27" ohne „Personen".

**Folge:** Kleiner Lesefehler an der Stelle, die den Sofortbedarf nennt; auf dem
Fernseher fehlt eine Zahl, die am Gerät und auf dem Blatt steht.

**Empfehlung:** Leerzeichen setzen; Verpflegung und Einheit „Personen" auch im
Monitor führen oder im Bericht vermerken, dass der Monitor sie bewusst auslässt.

**Nachprüfung:** Seed mit angeforderter Unterbringung: Zeile liest „27 Personen";
Monitor nennt Verpflegung.
