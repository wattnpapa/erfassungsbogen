# Audit „Fehler und Wiederanlauf“, Runde 20 (Bedienfehler provozieren, selbst korrigieren)

- **Prüfer:** Rollenaudit `thw-error-recovery-reviewer`
- **Datum:** 2026-10-28
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 2 (1 neu, 1 alt mit Verweis) · Hinweise (ohne Priorität): 4
- **Gegenstand:** Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `7c06324` (`main`). Reiner Prüfbericht, keine Codeänderung.
- **Maßstab:** Keine „bekannten Grenzen“ zum Auslassen. Je Sachverhalt ein Befund, mit Typ (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast). P3 nur bei echter Beeinträchtigung der Aufgabe, Geschmacksfragen als Hinweis. Vorab gelesen: `docs/audits/README.md`, „Stand der Behebung“ und `fehler-und-wiederanlauf.md` in `runde-19`.

## Prüfaufbau

Playwright (globales Modul, `chromium.launch()` ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Tipps als Touch-Tipps. Viewports 390 x 844 (Hauptlauf), 360 x 640, 320 x 568 und 568 x 320 (Ansicht „Feld“). Frischer Browserkontext je Lauf. Einsatzdaten: Sammlung „Hochwasser Weser“ (Ort Oldenburg) mit 3 bis 6 Beispielbögen aus `examples/thw/` (Kopien mit `uebung: false`, Stand und Zeitraum auf heute gesetzt, sonst greift die 90-Tage-Anonymisierung), dazu defekte Datei, Textdatei, Duplikat. Kein Code geändert, nichts installiert, kein Prozess mit `pkill` beendet.

Geprüft: Startseite (390, 360), Assistent Schritt 1 bis 6 (Weiter ohne Angaben, Ort „Neustadt“ mit Mehrdeutigkeit, Telefon „abc 12x“, E-Mail ohne „@“), Schnellerfassung (Ort fehlt, Stärke 0, „Zum Feld“), Sammlung (Einlesen 6 Bögen, doppelt, gemischt mit defekter und Textdatei, Karte aufklappen, „Abrücken“, „Entfernen“, „Stärke ändern…“, Tabelle, „Übergabe vermerken…“ ohne Empfänger, „Einsatz beenden“, „Einsatz löschen…“), Quittungsleiste (Höhe, Ausblenden), Tipp-Sperre, Scanner ohne Kamera, Übersicht mit Personal- und Fahrzeugtabelle. Speicher mit einem bis zum Quota-Fehler gefüllten `localStorage`.

Nicht geprüft: echte Kamera, echte Bildschirmtastatur, native Builds, Nahbereich, Inhalt der erzeugten PDF.

## Urteil aus Sicht der Rolle

Die Fehlerabsicherung trägt, auch bei vollem Gerätespeicher. Jede zerstörende oder speichernde Handlung meldet das Scheitern ausdrücklich und lässt den Zustand unverändert; Neuladen bestätigt das. Zahlen- und Pflichtfehler werden vor der Wirkung erkannt. Datenverlust fand ich nicht. Zwei kleine P3 bleiben, beide Layout.

### Behebungen der Runde 19, im echten Browser geprüft und gehalten (nicht als Befund)

- **Voller Speicher:** „Meldung entfernen“ meldet „Papierkorb voll … Endgültig entfernen?“, die Meldung bleibt nach Neuladen. „Einsatz als beendet markieren“ („Einsatz nicht beendet … Nichts hat sich geändert“), „Übergabe vermerken“ („Übergabe nicht vermerkt“), „Abrücken“ (Karte bleibt unverändert, „Speichern fehlgeschlagen“), „Bögen einlesen“ („Nicht aufgenommen: 1 Bogen — der Speicher … die Datei selbst ist in Ordnung“) und „Einsatz löschen“ („Nicht gelöscht“) melden das Scheitern.
- **Quittungsleiste als Kurzfassung:** 51 bis 60 px hoch (390, 360, 320), eine Zeile mit „Rückgängig“ und „✕“, blendet nach unter 13 s aus.
- **Tipp-Sperre:** Ein Tipp in der ersten 0,7 s auf „Meldung entfernen“ wird verworfen, der Knopf zeigt „Einen Moment …“.
- **Fußleiste im Assistenten:** Keine Textüberlaufe, kein seitlicher Überlauf bei 390, 360, 320; Schnellerfassung mit „Zurück · In Einsatz übernehmen · Weiter“ ohne Abschneiden.
- **Schnellerfassung:** „Ort der Einheit (Pflicht)“ ist das erste Feld (y = 183); eine Zählung („Schritt 3 von 6 · 2, 5 entfallen“); „In Einsatz übernehmen“ ohne Ort fragt mit „Zum Feld“ und setzt den Fokus ins Feld.
- **Tabelle am Telefon:** Kein Überlauf bei 390, 360, 320; Köpfe 12 px; Fahrzeugtabelle in der Übersicht passt (324 von 356 px).
- **Startseite:** Zwei Spalten, „Neue Einsatz-Sammlung…“ und „Neuen Bogen erstellen“ beide über dem Falz (y = 395 bei 390, 362 bei 360).
- **Weitere:** E-Mail-Warnung steht direkt unter dem Feld; „Stärke ändern…“ bei 320 x 568 ohne Verdeckung; „Übergabe vermerken“ ohne Empfänger vermerkt „(ohne Empfänger)“; Einlesemeldungen (doppelt, defekt, Textdatei) einzeln und konkret; „7 aufgenommen, 7 bereits vorhanden“ (R19-K10) nicht nachstellbar (6 Bögen zweimal: „0 aufgenommen, 6 bereits vorhanden“).

## Befunde

### R20-E1 (P3, Layout/Abstand) Scanner ohne Kamera im Querformat 568 x 320 scrollt noch innen

- **Neu oder alt (Verweis):** alt, R19-L2 / M5 / G9 / S10 (Rest, in „Stand der Behebung“ von Runde 19 als offen genannt).
- **Ort:** Sammlung → „Bogen scannen…“ ohne Kamera, Ansicht „Feld“, 568 x 320.
- **Beobachtung:** Der Inhalt des Fensters scrollt innen (308 von 238 px sichtbar); der Handscanner-Kasten („Bereit — warte auf den Handscanner“) ist unten abgeschnitten, „QR aus Bild einlesen…“ und „Fertig“ stehen fest darunter.
- **Folge:** Der Helfer im Querformat sieht den Zustand des Handscanners nur zum Teil und muss in einem kleinen Fenster scrollen.
- **Empfehlung:** Im Querformat den Erklärtext einklappen oder die Elemente nebeneinander setzen, damit alles ohne inneren Bildlauf sichtbar ist.

### R20-E2 (P3, Layout/Abstand) Übersicht: Personaltabelle schneidet „Erreichbarkeit“ am Telefon ab

- **Neu oder alt (Verweis):** neu (zu R19-E14, dort die Fahrzeugtabelle, die inzwischen passt).
- **Ort:** Assistent Schritt 6 „Personal (12)“; 390 x 844 und 360 x 640.
- **Beobachtung:** Vier Spalten, Tabelle 418 px in 356 bzw. 326 px Kasten; die Spalte „Erreichbarkeit“ liegt zum Teil außerhalb („Mobil: 5552…“ abgeschnitten). Der Hinweis „Zum Weiterlesen seitlich wischen →“ steht darüber.
- **Folge:** Beim Prüfen vor der Übergabe (stimmt die Rufnummer des Gruppenführers?) muss gewischt werden; wer den Hinweis nicht beachtet, sieht die Nummern nicht.
- **Empfehlung:** Auf dem Telefon Erreichbarkeit unter dem Namen in derselben Zelle zeigen, damit nichts seitlich liegt.

## Hinweise (ohne Priorität)

- **H1 (Layout):** Die Sprunglinks „Weitergeben, Lageblatt, Export ↓“ und „Übergabe, Abschluss ↓“ in der Sammlung haben Trefferflächen von 47 px Höhe bei 29 px Zeilenabstand; sie überlappen um 18 px (im Überlappungsbereich gewinnt der untere Link). Folgenlos außer einem falschen Sprung. Neu.
- **H2 (Bedienung):** „Weiter“ in Assistent und Schnellerfassung geht ohne Ort und Stärke ohne Warnung zum nächsten Schritt; aufgefangen wird es zuverlässig in der Übersicht bzw. von „In Einsatz übernehmen“ mit „Zum Feld“. Alt, Rest von R19-E3 (zweiter Teil).
- **H3 (Text):** Kopfzeile der Schnellerfassung „‹ Einsatz „Hochwasser …“ wird bei 390 px mit Auslassung gekürzt. Neu.
- **H4 (Bedienung):** Nach „Entfernen“ der aufgeklappten Karte bleibt die Bildlaufposition stehen, die Seite wird kürzer, und der Blick liegt am Listenende statt bei den übrigen Einheiten; die Quittung steht korrekt unten. Nicht eigens vermessen. Neu.

## Aufgabe geschafft: ja
## Fremde Hilfe nötig: nein
## Größtes Missverständnis: „Weiter“ gilt als bestätigt, obwohl Pflichtfelder noch leer sind; das fängt erst die Übersicht ab.
## Größtes Einsatzrisiko: Keines belegt; Datenverlust bei vollem Speicher ist behoben.
## Top-Priorität für die nächste Iteration: Scanner ohne Kamera im Querformat (R20-E1) und Personaltabelle am Telefon (R20-E2).
