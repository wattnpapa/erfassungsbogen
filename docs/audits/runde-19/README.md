# Rollenaudits, Runde 19 (Stand 28.10.2026)

Neunzehnte Prüfrunde nach der Behebung der Befunde aus [Runde 18](../runde-18/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `0ac0d7f` (Stand `main`). Reine Prüfberichte ohne Codeänderung. Die
Prüfer melden weiter auch Reste aus früheren Runden.

Zum ersten Mal seit Runde 8 gibt es wieder einen P1-Befund: R19-O1. „Meldung
entfernen" quittiert bei vollem Gerätespeicher „7 Tage im Papierkorb", obwohl der
Papierkorb-Eintrag nicht geschrieben werden konnte; nach dem Neuladen ist die
Meldung endgültig weg. Gleiche Ursache, andere Richtung: R19-O3 („Einsatz löschen"
quittiert den Papierkorb, nach dem Neuladen steht der Einsatz wieder da), R19-O2
(„Einsatz als beendet markieren" und „Übergabe vermerken" scheitern ohne
Rückmeldung) und R19-O4 (Vermerk der Übergabe-Checkliste scheitert still).

Die Berichte enthalten zusammen 144 Einträge. Mehrfach gemeldete Sachverhalte
zählen einmal. Die größten Gruppen: „In Einsatz übernehmen" in der Fußleiste
abgeschnitten (K1, M1, O5, G1, H1, A4, W2, S1; zwei davon P2); „Übergabe vermerkt"
und „Einsatz beendet" bleiben gültig, obwohl danach neue Bögen kamen (W1, D1);
Quittungsleiste 100 bis 136 px hoch und 30 s stehend (A3, E5, H6, K5, M4, N12, O6, S4,
G4, D4, L6, W12); Abstände von 4 bis 6 px (A8, E8, H7, W7, G3, S8, N5, O8);
Schnellerfassung: Schrittzählung und Pflichtfeld „Ort" erst nach ein bis zwei
Bildschirmen (A5, E2, E3, H2, H3, K9, G11, M7, N3, N4, O7, S2, S3, W5, A6); Tipp-Sperre
ohne Rückmeldung (E1, N2, K4, W11, S5, L3); aufgeklappte Karte zu hoch (A9, W6, E7,
H4, M3, O9, G12, S7); Tabelle am Telefon schneidet Namen ab und zeigt leere Spalte
„Auftrag" (W9, G10, H9, M14, N8, S6, D11); Startseite: „Neue Einsatz-Sammlung…" unter
dem Falz (W3, E13, H10, S14, A10); Scanner ohne Kamera (L2, M5, G9, S10); Dateinamen
(G13, N11, K2). Es bleiben rund 90 verschiedene Befunde: 1 P1, 6 P2, rund 70 P3 (die
Zahl der P3 ist eine Schätzung nach Zusammenführung).

| Bericht | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 0 | 0 | 0 | 14 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 0 | 0 | 0 | 11 |
| [Arbeitsablauf](arbeitsablauf.md) | 0 | 0 | 1 | 11 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 0 | 0 | 0 | 14 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 0 | 0 | 1 | 10 |
| [Offline und Speicher](offline-und-speicher.md) | 0 | 1 | 4 | 5 |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 0 | 0 | 0 | 15 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 0 | 0 | 0 | 13 |
| [Nacht und Sicht](nacht-und-sicht.md) | 0 | 0 | 1 | 5 |
| [Führungssicht](fuehrungssicht.md) | 0 | 0 | 1 | 12 |
| [Analog-first](analog-first.md) | 0 | 0 | 0 | 11 |
| [Mobile-UI](mobile-ui.md) | 0 | 0 | 1 | 14 |
| Summe der Berichte | 0 | 1 | 10 | 135 |
| Summe ohne Doppelungen (Verlaufstabelle, P3 geschätzt) | 0 | 1 | 6 | 70 |

## Stand der Behebung (28.10.2026)

Behoben, auch der P1 (R19-O1) und die P2 (O2 bis O5, W1/D1, K1/M1, L1), jeweils mit
Test; die Speicherfälle sind im Browser mit einem bis zum Quota-Fehler gefüllten
`localStorage` nachgestellt. Offen oder nicht vollständig: R19-K10 („7 aufgenommen,
7 bereits vorhanden": Ursache nicht gefunden), R19-L2/M5/G9/S10 für 568 x 320 in
„Feld" (Scanner ohne Kamera rollt noch innen), R19-K12 (die Ruhehöhe der „Ansicht"-Leiste
von 57 px bleibt), R19-N8 (nicht bearbeitet, Tabellenbefund). Neuer Speicherschlüssel:
keiner. Startbündel 1 229 774 Byte (Budget neu gesetzt); es wächst seit Runde 12 um
rund 10 KB je Runde und wird in Runde 20 durch Nachladen verkleinert. Arc42, ISK und DSFA
nachgezogen.
