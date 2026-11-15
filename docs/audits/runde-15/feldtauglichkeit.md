# Audit „Helfer im Feld“, Runde 15 (Feldtauglichkeit)

Prüfer: Rollenaudit `thw-field-user-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `a7874f0` (`main` nach Runde 14).

Zählung: **P0 0 · P1 0 · P2 0 · P3 3**

Reiner Prüfbericht, keine Codeänderung. Die bekannten Grenzen und Reste aus den
Runden 6 bis 14 wurden nicht neu gemeldet (u. a. R14-E7, R14-S2, R14-H1, R14-W3).

## Prüfaufbau

Playwright/Chromium (`chromium.launch()` ohne Optionen, globales Modul, da die
Projektkopie keinen passenden Browser fand), `isMobile`/`hasTouch`, Locale de-DE,
Telefon 360 × 640 und 390 × 844, einzelne Läufe quer (640 × 360). Frischer Kontext
je Lauf, keine Kamera. Einsatzdaten: Kopien der Übungsbögen unter
`examples/thw/` mit `uebung: false` (3, 5, 6 und 8 Dateien), über „Bögen
einlesen…“ in eine frisch angelegte Sammlung eingespielt; eigener Bogen im
Assistenten ausgefüllt (BGr, Oldenburg (NI)).

Durchgespielt: eigener Bogen Schritte 1 bis 6 (Zielgrößen und seitliches
Überlaufen je Schritt, Vorschläge für Typ und Ort), „Bogen übergeben…“, PDF des
eigenen Bogens; Sammlung anlegen, Dateien einlesen (auch doppelt), „Zur Kenntnis
genommen“, Karte aufklappen, „Abrücken“ (auch Doppeltipp), „Mehr…“, „Stärke
ändern…“, „Entfernen“, „Zug für N Einheiten ohne Zug“, Tabelle, Lageblatt,
Sammel-PDF; Schnellerfassung mit Sammlungswahl; „Aus Datei laden…“ mit
Fremddatei und Übungsbogen; Datensicherung (falsche Datei, dann Sicherung);
„Alle Daten löschen“, „Geräteschlüssel neu erzeugen“; Offline (Service Worker
aktiv, Neuladen und Arbeiten ohne Netz); Neuladen und Browser-Zurück in der
Sammlung und in der manuellen Erfassung.

**Nicht verifiziert:** echte Handschuhe und nasse Finger, Sonnenlicht und
Dunkelheit am Display, Kamera-Scan, native Datums- und Zeitauswahl, echte
Bildschirmtastatur und Autokorrektur, WebKit/Safari, echtes Drucken, voller
Speicher. Hinweis: Die Übungsbögen tragen Stände von vor rund 100 Tagen; die
dadurch erscheinenden Hinweise (Datenschutzfrist, „Zeitraum vorbei“, lange
Aufnahmemeldung) sind ein Artefakt des Prüfaufbaus und wurden nicht gewertet. Ein
Lauf, bei dem `fill()` unmittelbar nach dem Öffnen des Dialogs „Neue
Einsatz-Sammlung anlegen“ den Namen nicht übernahm, ließ sich mit echtem Tippen und
mit 500 ms Wartezeit nicht wiederholen und wurde nicht gewertet.

## Urteil

Alle Szenarien wurden **abgeschlossen**, ohne Datenverlust und ohne Sackgasse. Es
gibt keinen P0-, P1- oder P2-Befund. Drei Kleinigkeiten (P3).

## Nachprüfung der Behebungen aus Runde 14 im echten Browser

- **R14-H2 Zug für N Einheiten:** Quittung „Zug „3. Zug“ gesetzt: 5 Einheiten“ mit
  „Rückgängig“ und ✕ erscheint. Hält.
- **R14-H4 Datensicherung:** Nach falscher Datei und anschließender Sicherung ist die
  rote Zeile weg; „Sicherung … erzeugt — liegt im Download-Ordner …“ und „Letzte
  Sicherung … enthält 1 Einsatz, 3 Meldungen“ stehen im Bild. Hält.
- **R14-H3 Länderliste:** Ziele der Liste in `uebersicht.html` nicht mehr unter
  44 px; kein seitliches Überlaufen bei 360 px. Hält (Fließtext-Verweise bleiben
  17 px hoch, Nachschlageseiten).
- **R14-G1 Doppeltipp:** Zwei Taps im Abstand von 150 ms auf „Abrücken“: nach dem
  ersten Tipp steht an derselben Stelle „✓ Abgerückt“, der zweite bewirkt nichts,
  eine Quittung. Sammel-PDF: ein Download nach rund 3 s, Hinweis „bitte nicht noch
  einmal tippen“ während der Erzeugung. Hält.
- **R14-M1 Tabelle:** Kopfzelle „Ges.“ sichtbar, Namensspalte 120 px, kein
  Seitenüberlauf. Hält.
- **R14-D4 Verschieben/Entfernen:** Rückfrage „Meldung entfernen?“ nennt Namen,
  Personenzahl, Stand und die Umnummerierung; „Abbrechen“ 80 px entfernt. Hält.
- **R14-K5 Erfassungsknöpfe und Bedarf:** Bei 360 × 640 stehen Erfassungsknöpfe und
  Bedarf auf dem ersten Bildschirm der Sammlung. Hält.
- **R14-S1 Zurück:** Browser-Zurück aus der manuellen Erfassung führt in die
  Sammlung mit „Angefangene Erfassung für diesen Einsatz: „THW BGr“. Weiter
  erfassen“; nächstes Zurück zur Startseite. Hält.
- **Offline:** Neuladen ohne Netz, Sammlung anlegen, Dateien einlesen, Lageblatt:
  alles ohne Netz möglich, Quittung „Lageblatt erzeugt“. Hält.

## Befunde

### R15-H1 [P3] Quittungsleiste schneidet den Text bei „Zur Kenntnis genommen“ und „Stärke geändert“ nach zwei Zeilen ab

**Evidence:** Observed (360 × 640 und 390 × 844, Produktionsbuild; gemessen:
`scrollHeight` 70 bzw. 53 px gegen `clientHeight` 35 px, `-webkit-line-clamp: 2`).
**Ort:** Quittungsleiste mit „Rückgängig“ und ✕ am unteren Bildrand der
Einsatzansicht (Meldekopf).
**Beobachtung:** „Zur Kenntnis genommen: 8 Einheiten“ erscheint bei 360 px als
„Zur Kenntnis genommen: 8…“ (bei 390 px vollständig). Nach „Stärke ändern…“ steht
bei 360 und 390 px nur „Stärke 4 → 5 geändert: „THW…“; der Name der Einheit fehlt.
Dieselbe Leiste zeigt „Abgerückt 11:32: Nr. 1 „THW Albstadt Zugtrupp Technischer
Zug““ vollständig in vier Zeilen. Die Leiste ist also je nach Meldung gekürzt oder
nicht; Runde 11 (R11-D2/D5 „Quittungen vierzeilig“) hält damit nur teilweise.
**Erwartung des Helfers:** Was geändert wurde und an welcher Einheit, steht
vollständig in der Quittung; er verlässt sich darauf, bevor er „Rückgängig“ tippt
oder weitermacht.
**Folge:** Gering. Bei fünf oder mehr Einheiten sieht der Helfer nicht, an welcher
Einheit er die Stärke gerade geändert hat, und nicht, wie viele Einheiten
„Zur Kenntnis genommen“ erfasst hat („8…“). Die Karte darunter zeigt die Änderung,
liegt aber hinter der Leiste.
**Empfehlung:** Einheitliche Grenze von vier Zeilen (wie bei „Abgerückt“) oder
Kurzfassung mit dem Wichtigsten vorn („Stärke 4 → 5 · Nr. 1 THW Albstadt“).
**Nachprüfung:** Bei 360 × 640 „Zur Kenntnis genommen“ und „Stärke ändern…“
ausführen: Text und Einheitenname vollständig lesbar, `scrollHeight` gleich
`clientHeight`.

### R15-H2 [P3] Funkrufname trägt den Klammerzusatz des Ortes: „Heros Oldenburg (NI) 22/51“

**Evidence:** Observed (Schritt 4 „Fahrzeuge“ und „Gesamtübersicht“ des eigenen
Bogens; PDF des Bogens, Zeile „FuRn: Heros Oldenburg (NI) 22/51“ und
„Bergungsgruppe · FuRn Heros …“). Dass im Funk „Heros Oldenburg 22/51“ gerufen wird,
ist eine **Annahme** (übliche Rufnamenbildung), keine geprüfte Vorgabe.
**Ort:** Schritt 4, „eigener Standort“ mit Hinweis „Ort im Funkrufnamen = Ort der
Einheit (Oldenburg (NI))“; daraus abgeleitet Übersicht, PDF, Meldung.
**Beobachtung:** Wählt der Helfer in Schritt 1 den Ortsvorschlag „Oldenburg (NI)“
(Unterscheidung von „Oldenburg in Holstein“), wandert der Klammerzusatz „(NI)“ in den
Funkrufnamen des Fahrzeugs. Beim Übungsbogen „Albstadt“ gibt es keinen Zusatz
(„Heros Albstadt 21/10“); nur Orte mit Zusatz sind betroffen.
**Erwartung des Helfers:** Der Rufname enthält den Ort wie er gesprochen wird; die
Zusatzangabe für das Bundesland ist ein Merkmal des Verzeichnisses, nicht des
Rufnamens.
**Folge:** Gering. Der Meldekopf liest einen Rufnamen, der so nicht gerufen wird;
bei Rückruf muss er den Zusatz weglassen. Das Feld ist änderbar (Freitext), die
Vorbelegung aber falsch für jeden Ort mit Zusatz.
**Empfehlung:** Beim Bilden des Rufnamens den Klammerzusatz weglassen oder das Feld
„eigener Standort“ mit dem reinen Ortsnamen belegen.
**Nachprüfung:** Ort „Oldenburg (NI)“ wählen, Schritt 4 und PDF öffnen: Rufname
„Heros Oldenburg 22/51“.

### R15-H3 [P3] „Alle Daten löschen“: Satz „Der Widerspruch zur Reichweitenmessung bleibt bestehen.“ ist ohne Vorwissen unverständlich

**Evidence:** Observed (360 × 640, Dialog „Alle lokalen Daten löschen“, letzter
Absatz).
**Ort:** Startseite, Fuß › „Alle Daten löschen“.
**Beobachtung:** Der Dialog listet verständlich, was verloren geht (Vorlagen,
Sammlung mit Zahl der Bögen und „noch kein Export“, Absenderkarte,
Geräteschlüssel, Einstellungen). Der Schlussabsatz endet mit „Der Widerspruch zur
Reichweitenmessung bleibt bestehen.“ Ein Helfer weiß nicht, welchen Widerspruch er
je eingelegt hat und was eine Reichweitenmessung ist; der Satz steht zwischen der
Aussage über erzeugte PDFs und dem Bestätigen des endgültigen Löschens.
**Erwartung des Helfers:** Ein Satz, der zur Entscheidung „löschen oder nicht“
beiträgt; Begriffe aus dem Einsatz, nicht aus dem Datenschutz.
**Folge:** Gering. Der Satz wird übersprungen oder verunsichert kurz vor einer
unumkehrbaren Handlung; keine Fehlbedienung beobachtet.
**Empfehlung:** Umformulieren („Die Einstellung „Besuche nicht zählen“ bleibt
bestehen.“) oder an die Stelle verlagern, an der die Einstellung auch angeboten wird.
**Nachprüfung:** Dialog öffnen: Der Schlussabsatz nennt in Alltagssprache, was
erhalten bleibt, ohne Begriff „Widerspruch“/„Reichweitenmessung“.

## Was gehalten hat (nicht ändern)

- **Eigener Bogen:** Alle sechs Schritte bei 360 × 640: Ziele ≥ 44 px (Kästchen und
  Optionsfelder 24 px innerhalb größerer Beschriftung), kein seitliches
  Überlaufen; Vorschläge für Einheitstyp („BGr“) und Ort („Oldenburg“) mit Kürzel
  und Postleitzahl; Autokorrektur aus an Namensfeldern.
- **Gesamtübersicht:** „⚠ 7 offene Punkte“ stimmt mit der Aufzählung überein;
  „Bogen übergeben…“ mit QR im Vollbild, Nahbereich, PDF, weiteren Formaten.
- **Löschen und Sichern:** Rückfrage mit Aufzählung der Folgen und Zähler, Knopf
  „Vorher Sicherung erstellen…“, Bestätigungshaken; Sicherung mit Dateiname und
  Zählstand.
- **Quittungen mit Rückgängig:** „Abgerückt 11:32“, „Zug gesetzt: 5 Einheiten“,
  „Zur Kenntnis genommen“; „Stärke ändern…“ zeigt Vorher-Nachher („Gesamt: 5
  (bisher 4)“).
- **Schnellerfassung:** Frage „für welche Sammlung?“ mit „Ohne Sammlung erfassen“.
- **Doppelte Dateien:** „0 Bögen aufgenommen, 3 bereits vorhanden.“

## Verständnis-Check

- Orientierung: verstanden
- Nächste Handlung: verstanden
- Systemstatus: verstanden (Quittungen bei 360 px teils gekürzt, R15-H1)
- Fehlerbehebung: verstanden
- Feldtauglichkeit: eingeschränkt geprüft (echte Handschuhe, Sonnenlicht, Kamera,
  Telefontastatur nicht prüfbar); soweit prüfbar geeignet
