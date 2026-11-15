# Audit Runde 17 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-27 · Zählung: P0 0 · P1 0 · P2 0 · P3 2

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, Code-Stand Commit `be6b396`, `main`),
Playwright mit Chromium (globales Modul), Telefon 390 × 844 und 360 × 640, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener
Browser-Kontext. Netz weg über `context.setOffline`, CPU-Last über `Emulation.setCPUThrottlingRate`, Zeitsprünge über `page.clock`,
zwei Tabs im selben Kontext für Parallelzugriff. Einsätze und Bögen über die Oberfläche (Übungsbögen aus `examples/thw` über
„Bögen einlesen…“); nur der Speicher wurde für den Vollast-Test gezielt aufgefüllt.

Nach dem Auftrag dieser Runde gelten keine „bekannten Grenzen“ mehr als ausgenommen. Gemeldet ist alles, was im Browser noch zu
beobachten war, mit Verweis auf die alte Befund-ID.

## Urteil

Die Offline-Fähigkeit trägt. Die Behebung R16-O1 hält, ebenso die Behebungen aus den Runden 11 bis 16, die diese Rolle berühren. Ich habe
keinen Datenverlust, keine Duplikate und keinen blockierten Ablauf gefunden. Zwei kleine Reste aus früheren Runden sind weiter im Browser
zu beobachten (beide P3). Die Aufgaben „Einsatz führen, Bögen einlesen, Netz weg, neu laden, Sammel-PDF und Sicherung erzeugen“ gelingen
ohne fremde Hilfe.

## Nachprüfung der Behebungen

| Befund | Ergebnis | Messung |
| --- | --- | --- |
| R16-O1 Zwischenstand des Papier-Abgleichs nach „Endgültig löschen“ | hält | Zwischenstand für einen Einsatz in `localStorage` und `sessionStorage` abgelegt (Schlüssel `eeb.papierabgleich.v1.<Einsatz-ID>`, von Hand gesetzt, da kein Bogen „vom Papier“ erzeugt wurde), Einsatz → „In den Papierkorb“ → „Endgültig löschen…“ → „Endgültig löschen“: beide Speicher enthalten keinen Schlüssel `papierabgleich` mehr. |
| R15-A4 / R16-A2 Papier-Abgleich, Frist | nicht erneut geprüft | durch O1-Messung nur der Löschweg berührt. |
| R13-O1 Sicherung einspielen | hält | Beschädigte JSON-Datei: Fehlermeldung im Dialog, Speicherschlüssel danach unverändert. |
| R13-O3 / R11-O5 voller Speicher | hält | Speicher auf 5 von 5 Mio. Zeichen gefüllt, sechs weitere Bögen einlesen: „Nicht aufgenommen: 6 Bögen — der Speicher dieses Geräts ist voll, die Datei selbst ist in Ordnung … danach dieselbe Datei noch einmal einlesen.“ Der Bestand (2 Einheiten) blieb nach Neuladen unverändert, keine falsche Erfolgsmeldung. |
| R12-O4 Sicherung erstellen | hält | Quittung „Sicherung „eeb-sicherung-2026-10-27.json“ erzeugt … Gesichert ist sie erst, wenn sie auf einem zweiten Gerät oder Datenträger liegt“; danach „Letzte Sicherung … enthält 1 Einsatz, 3 Meldungen; seitdem ist nichts Neues dazugekommen“. |
| R14-O1 Altersangaben laufen mit | hält | Mit `page.clock`: Kopfzeile „(gerade eben)“ → nach 2 h 5 min „⚠ … (vor 2 Std 5 Min)“ → nach 32 h „(vor 1 Tag)“. |
| R12-O1 / R11-O2 Einsatz im anderen Fenster gelöscht | hält | Tab 2 wechselt auf die Startseite mit „Die Sammlung „Loesch Race“ wurde in einem anderen Fenster in den Papierkorb gelegt …“, Papierkorb zeigt (1). |
| Parallele Änderungen in zwei Tabs | hält | Je zwei Bögen in jedem Tab auf demselben Einsatz: beide Tabs zeigen 6 Einheiten, nach Neuladen weiter 6, nichts überschrieben. |
| Vorratsanzeige | hält | Nach 0 s „… werden nachgeladen (235 von 549)“, nach 1,4 s „Funktioniert komplett offline“ (Cache 637 Einträge); Netz weg bei 1 s: „… fehlen noch (451 von 549), sie folgen beim nächsten Netz“. |
| Einsatz offline | hält | Netz weg, Einsatz anlegen, vier Bögen einlesen, Neuladen, „Einsatz weitergeben / sichern“: Einsatz und Bögen da, Sammel-PDF `eeb-einsatz-271819okt26_Offline_Einsatz.pdf` erzeugt, Quittung „Empfang nicht bestätigt“. |
| Prellschutz „In den Papierkorb“ | hält | Tipp 0,6 s nach Öffnen des Dialogs wird ignoriert, „Einen Moment …“ erscheint, nach 2,6 s löscht jeder Tipp genau einmal. |

## Befunde

### P3

#### R17-O1 – Sammel-PDF: keine Fortschrittsanzeige, bei Handy-Rechenleistung über eine Minute

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt – wie R15-O1, weiter offen (R16-Behebung betraf nur die Zeitangabe)
- **Ort:** Einsatzansicht → „Einsatz weitergeben / sichern“ bei 30 Bögen.
- **Beobachtung:** Der Knopf wechselt auf „Einsatz wird erzeugt…“ (deaktiviert) und bleibt es ohne Zähler, Balken oder Zwischenstand. Dauer
  bei 30 Bögen: 10 s bei normaler Rechner-CPU, rund 66 s bei 6-fach gedrosselter CPU (Handy-nah). Während der Zeit gibt es keine Aussage,
  ob die App arbeitet oder hängt.
- **Folge:** Ein Helfer ohne Hinweis auf Fortschritt tippt erneut, wechselt die Ansicht oder lädt neu und bricht damit die Sicherung
  des Einsatzes ab, ohne es zu merken.
- **Empfehlung:** Fortschritt „Bogen 12 von 30“ am Knopf oder darunter anzeigen; bei langer Dauer den Satz „Das dauert bei vielen Bögen
  mehrere Minuten, Seite offen lassen“ einblenden.
- **Verifikation:** Einsatz mit 30 Bögen, CPU 6-fach gedrosselt, Knopf antippen: Zähler läuft durch bis zum Download.

#### R17-O2 – Nach Neuladen ist die aufgeklappte Karte wieder zu

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt – wie R14-S2, weiter teilweise (Bildlaufstelle bleibt, aufgeklappte Karte nicht)
- **Ort:** Einsatzansicht mit 30 Einheiten → Karte „Aufklappen: Zeiten, Details und Aktionen“ → Neuladen (F5, Absturz des Browsers).
- **Beobachtung:** Vor dem Neuladen ist eine Karte aufgeklappt (`aria-expanded=true`: 1), danach keine (0). Die Bildlaufposition (1500 px)
  bleibt erhalten, sodass der Helfer an der alten Stelle steht, aber vor einer zugeklappten Liste.
- **Folge:** Nach einer Unterbrechung (Telefon, Browser vom System beendet) muss die zuletzt bearbeitete Einheit unter 30 Karten erneut
  gesucht und aufgeklappt werden; die angefangene Bearbeitung sieht der Helfer nicht mehr.
- **Empfehlung:** Zuletzt aufgeklappte Karte mit der Bildlaufstelle merken und nach dem Neuladen wieder öffnen.
- **Verifikation:** Karte aufklappen, Neuladen: dieselbe Karte ist wieder offen.

## Nicht prüfbar

Echte Funkloch-Übergänge auf dem Telefon (Playwright schaltet das Netz hart ab), Verhalten von iOS-Safari bei geräumtem Speicher,
Hintergrund-Beenden durch das Betriebssystem, Kamera-Scan, native Builds, der Ablauf der 30 Tage im Papierkorb (nur der Löschweg
„Endgültig löschen“ geprüft), ein Bogen „vom Papier“ mit echtem Zwischenstand des Abgleichs (Schlüssel von Hand gesetzt).

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Wer bei „Einsatz wird erzeugt…“ keinen Fortschritt sieht, hält die App bei vielen Bögen für hängend (R17-O1).
- **Größtes Einsatzrisiko:** Keines über P3; eine zu früh abgebrochene Sammel-PDF bei vielen Bögen (R17-O1).
- **Top-Priorität für die nächste Iteration:** R17-O1: Fortschritt der Sammel-PDF anzeigen.
