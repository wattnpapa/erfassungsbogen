# Runde 11 – Helfer ohne Einweisung

- Prüfer: Rolle „Helfer ohne Einweisung“ (thw-new-user-reviewer)
- Datum: 2026-10-25
- Zählung: P0 0 · P1 0 · P2 0 · P3 2
- Prüfaufbau: Produktionsbuild auf http://localhost:4173, Playwright/Chromium, Telefon 390×844 und 360×640 (Überlauf-Prüfung zusätzlich 320×568), Touch, de-DE. Kamera, Handschuhe, Bildschirmtastatur nicht prüfbar. Bekannte Grenzen aus `docs/audits/README.md` und Runde 10 wurden nicht neu gemeldet.

## Urteil

Ein Helfer ohne Einweisung kommt ohne fremde Hilfe zum Ziel. Geprüft wurden: Startseite, Assistent Schritt 1–6, Übersicht mit Offene-Punkte-Liste, Einsatz-Sammlung anlegen, manuelle Aufnahme, Schnellerfassung, Scanner-Dialog ohne Kamera, Datensicherung, Übungsbögen, Geräteschlüssel, „Alle Daten löschen“, Datenschutz, Impressum. Die Rückfragen sind verständlich (zum Beispiel „Ort der Einheit fehlt“ mit Sprungknopf). Die Verzeichnis-Ergänzung nach Eingabe des Ortes wird im Text angekündigt und lässt sich rückgängig machen. In keiner Ansicht gab es horizontalen Seitenüberlauf (390, 360, 320 px), keine Konsolenfehler. Es entstand kein neuer Befund oberhalb von P3.

## Befunde

### R11-N1 (P3) – Telefonnummer und E-Mail im Verzeichnis-Vorschlag abgeschnitten

- Ort: Schritt 1 „Zugehörigkeit / Kontaktstellen“, nach Eingabe „Freiburg“ (OV-Verzeichnis ergänzt Telefon und E-Mail, dazu RB und LV).
- Beobachtung: Das Telefonfeld ist 110 px breit (Textbreite 117 px); die elfstellige Nummer „07612089560“ ist am Ende abgeschnitten. Die E-Mail „Poststelle.RSt_Freiburg@thw.de“ ist 258 px breit in einem 197-px-Feld (360 px Viewport: 167 px), also etwa ein Drittel verdeckt. Gemessen bei 390 und 360 px, scrollWidth größer als clientWidth.
- Folge: Der Helfer sieht die vom Verzeichnis eingesetzten Kontaktdaten nicht vollständig und kann nicht prüfen, ob die Nummer stimmt, die später als Rückfragekanal auf dem Bogen steht. Eine falsche oder unvollständige Nummer fällt erst im PDF auf.
- Empfehlung: Telefon- und E-Mail-Feld untereinander in voller Breite, oder die Ziffernbreite des Telefonfelds auf mindestens zwölf Zeichen auslegen; E-Mail mit Umbruch oder volle Breite.

### R11-N2 (P3) – Vorschlagsliste öffnet sich nach der Verzeichnis-Ergänzung über dem Telefonfeld

- Ort: Schritt 1, Weg Tab nach der Ortseingabe.
- Beobachtung: Nach dem Ergänzen springt der Fokus in „Dienststellen-Kürzel“ (Inhalt „OFRE“ markiert), und sofort erscheint eine Vorschlagsliste mit genau diesem Eintrag („Freiburg OFRE · 79108 Freiburg i. B.“). Sie liegt über dem Telefon- und E-Mail-Feld der soeben ergänzten Zeile.
- Folge: Der Vorschlag wiederholt, was schon eingetragen ist, und verdeckt die Felder, die der Helfer als Nächstes prüfen würde (siehe R11-N1). Ein Antippen der Liste an der falschen Stelle überschreibt das Kürzel erneut.
- Empfehlung: Nach der automatischen Ergänzung keine Vorschlagsliste für das Kürzel öffnen, solange der Wert dem einzigen Vorschlag entspricht.

## Bestätigt (keine Befunde)

- Rückfragen mit Sprungknopf, Rückgängig nach Verzeichnis-Ergänzung, Offene-Punkte-Liste der Übersicht mit Antippen zum Beheben.
- „Alle Daten löschen“: Aufzählung des Betroffenen und doppelte Bestätigung; „Geräteschlüssel neu erzeugen“ mit Abbrechen.
- Alle Ziele im Assistenten mindestens 44 px hoch, kein Seitenüberlauf bei 320 px.

Aufgabe geschafft: ja
Fremde Hilfe nötig: nein
Größtes Missverständnis: Keines belegt; die Felder zur Kontaktstelle wirken nach der Ergänzung unvollständig, weil sie abgeschnitten sind.
Größtes Einsatzrisiko: Unprüfbare, abgeschnittene Rückfrage-Nummer aus dem Verzeichnis (R11-N1).
Top-Priorität für die nächste Iteration: Kontaktfelder der Zugehörigkeitszeilen in voller Breite darstellen.
