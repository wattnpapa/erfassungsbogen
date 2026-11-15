# Audit Runde 16 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-26 · Zählung: P0 0 · P1 0 · P2 0 · P3 1

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, Code-Stand Commit `36d549a`,
`main` nach Runde 15), Playwright mit Chromium (globales Modul), Telefon 390 × 844 und 360 × 640, `isMobile`/`hasTouch`,
Locale de-DE, je Lauf ein eigener Browser-Kontext. Zustände über die Oberfläche (Einsatz anlegen, Übungsbögen als JSON einlesen)
und über `localStorage`/`sessionStorage`. Netz weg über `context.setOffline`, CPU-Last über `Emulation.setCPUThrottlingRate`.

Nicht neu gemeldet sind die bekannten Grenzen aus den Runden 6 bis 15 (laut Auftrag und `docs/audits/README.md`).

## Urteil

Die Offline-Fähigkeit trägt weiter. Die Behebungen aus Runde 15, die diese Rolle berühren, halten im echten Browser. Ich habe keinen
Datenverlust, keine doppelten Datensätze und keine blockierten Abläufe gefunden. Neu ist nur ein P3: Der neue dauerhafte Zwischenstand
des Papier-Abgleichs bleibt nach „Endgültig löschen“ eines Einsatzes im Gerätespeicher zurück. Die Aufgaben „Einsatz führen, Bögen
einlesen, Netz weg, neu laden, nach Unterbrechung weiterarbeiten“ gelingen ohne fremde Hilfe.

## Nachprüfung der Behebungen aus Runde 15

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R15-S1 Import unterbrochen | hält | 40 Übungsbögen mit CPU 20-fach gedrosselt, Neuladen nach 1,5 s: Einsatz zeigt „Import unterbrochen: 40 Dateien waren gewählt, 11 Meldungen kamen an. Es kann etwas fehlen — dieselben Dateien nochmal …“. Erneutes Wählen derselben 40 Dateien: „29 Bögen aufgenommen, 11 bereits vorhanden“, 40 Einheiten, Hinweis danach weg, keine Doppelten. |
| R15-A4 Zwischenstand Papier-Abgleich | hält | Eingabe „42“ in „Nr.“ einer Einheit; neuer Browserstart (nur `localStorage` übertragen, Sitzungsspeicher leer): Hinweis „Angefangene Eingaben für 1 Einheit sind noch da (… höchstens drei Tage)“. Mit um 4 Tage zurückgesetztem Zeitstempel ist der Zwischenstand weg (wie im Text angekündigt, ohne weiteren Hinweis). |
| Statusmeldung zum Vorrat | hält | Netz weg nach 1,5 s: „Offline bereit für Bogen, PDF, QR-Code und Empfang. Übungsbögen und Themenseiten fehlen noch (458 von 549), sie folgen beim nächsten Netz“. Alle 37 HTML-Seiten des Builds antworten dabei offline mit 200; der Übungsbögen-Dialog mit allen 101 THW-Bögen öffnet. |

## Weiter geprüft, ohne Befund

- Einsatz anlegen, vier Bögen einlesen, Netz weg, Neuladen: Einsatz, Kenntnisnahme-Hinweis und Karten unverändert.
- Dialog „Neue Einsatz-Sammlung anlegen“: Der erste Tipp auf „Einsatz anlegen“ innerhalb der ersten 2,5 s wird bewusst ignoriert
  (bekannte Sperre, R15-G2); danach legt jeder Tipp genau einen Einsatz an.
- Einsatz in den Papierkorb, „Endgültig löschen“: Rückfrage nennt die Folge („einzige Kopie“, keine Weitergabe vorhanden).

## Befunde

### P3

#### R16-O1 – Zwischenstand des Papier-Abgleichs bleibt nach „Endgültig löschen“ im Gerätespeicher zurück

- **Priorität:** P3
- **Kennzeichnung:** beobachtet (Speicherinhalt nach dem Löschen); Mitnahme in die Sicherungsdatei aus dem Code gelesen (`sicherung.ts`,
  Präfix `eeb.`), nicht als Datei nachgebaut.
- **Fundstelle:** Einsatz mit Bögen „vom Papier“ → „Lage vom Papier abgleichen…“ → Eingabe → „Später“ → „Einsatz löschen…“ → „In den
  Papierkorb“ → Startseite „Papierkorb“ → „Endgültig löschen…“ → „Endgültig löschen“.
- **Beobachtung:** Nach „Endgültig löschen“ (Rückfrage: „Darin stecken fremde Personendaten; … aus dem Papierkorb entfernt“) steht
  `eeb.papierabgleich.v1.<Einsatz-ID>` weiter im `localStorage`, mit Name der Einheit, Nr., Zeit, Zug und Notiz
  (`{"am":…,"zeilen":[{"name":"THW Albstadt Zugtrupp Technischer Zug",…,"nummer":"42"}]}`), ebenso der Sitzungsspeicher bis zum Schließen
  des Tabs. Die Frist von drei Tagen greift nur, wenn derselbe Einsatz noch einmal geöffnet wird; das ist nach dem endgültigen Löschen
  nicht mehr möglich. Der Rest wird erst von „Alle Daten löschen“ entfernt und läge in jeder Datensicherung dieses Geräts mit.
- **Erwartung der Rolle:** „Endgültig gelöscht“ heißt, dass vom Einsatz nichts mehr auf dem Gerät liegt, auch kein Freitext aus der Notiz.
- **Auswirkung im Einsatz:** Gering. Es sind Einheitsnamen und frei eingegebene Notizen, keine Stammdaten; relevant, wenn ein Gerät nach
  einer Übung weitergegeben wird oder die Sicherungsdatei geteilt wird und der Einsatz als endgültig gelöscht galt.
- **Empfehlung:** Beim endgültigen Löschen (und beim Ablauf der 30 Tage im Papierkorb) auch den Zwischenstand dieses Einsatzes entfernen.
- **Verifikation:** Wie oben bis „Endgültig löschen“, danach enthält der Speicher keinen Schlüssel `eeb.papierabgleich.v1.*` dieses
  Einsatzes mehr.

## Nicht prüfbar

Echte Funkloch-Übergänge auf einem Telefon (Playwright schaltet das Netz hart ab), Verhalten von iOS-Safari bei geräumtem Speicher,
Hintergrund-Beenden durch das Betriebssystem (ob der Sitzungsspeicher für den Hinweis „Import unterbrochen“ danach noch lebt),
Kamera-Scan, native Builds. Beim Offline-Test mit `setOffline` lief der Vorrat im Service Worker weiter an (21 auf 460 von 549
bei nur 1,2 s Abstand); ein harter Abbruch des Vorrats ließ sich so nur über die Zeitpunkte, nicht über echte Funklöcher herstellen.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Endgültig löschen“ wirkt vollständig, lässt aber den Zwischenstand des Papier-Abgleichs liegen (R16-O1).
- **Größtes Einsatzrisiko:** Keines über P3; ein Zwischenstand überlebt das endgültige Löschen eines Einsatzes (R16-O1).
- **Top-Priorität für die nächste Iteration:** R16-O1: Zwischenstand beim endgültigen Löschen und beim Papierkorb-Ablauf mitlöschen.
