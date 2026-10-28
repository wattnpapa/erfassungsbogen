# Rollenaudits, Runde 18 (Stand 28.10.2026)

Achtzehnte Prüfrunde nach der Behebung der Befunde aus [Runde 17](../runde-17/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `ae3a8e9` (Stand `main`). Reine Prüfberichte ohne Codeänderung. Die
Prüfer melden weiter auch Reste aus früheren Runden. Es gibt keine P0- und keine
P1-Befunde.

Die Berichte enthalten zusammen 96 Einträge. Mehrfach gemeldete Sachverhalte
zählen einmal: Papierkorb „Zurückholen" und „Endgültig löschen…" berühren sich (E4,
H3, G1, D1); Tipps in der ersten Sekunde werden ohne Rückmeldung verschluckt, auch
„Abbrechen" und „Rückgängig" (W3, E1, H4, G3, S3, D2, N1); Quittung abgeschnitten
oder dauerhaft stehend (H1, H2, S2, N2, D5); Dateinamen der Exporte (W6, H9, N10);
„Gehört zu dieser Lage" nur 30 px hoch (K6, G4, M4, L4); Tabelle am Telefon ohne
Bedienung (E5, S10); Aufnahmeknöpfe unter dem Falz (G2, S1, K3, N5, W4); Knopfleiste
im Scanner ohne Kamera (M5, L2, S9, H8); Kennzahlenraster versetzt (K9, S8);
Tabellenköpfe in 11 px (M2, L1); Sprung der Startseite beim Erstbesuch (K7, M10).
Es bleiben rund 66 verschiedene Befunde, davon 6 mit P2: R18-A1, R18-K1, R18-G1,
R18-G2/S1, R18-M1, R18-O1.

| Bericht | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 0 | 0 | 0 | 13 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 0 | 0 | 0 | 9 |
| [Arbeitsablauf](arbeitsablauf.md) | 0 | 0 | 0 | 8 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 0 | 0 | 0 | 6 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 0 | 0 | 0 | 8 |
| [Offline und Speicher](offline-und-speicher.md) | 0 | 0 | 1 | 0 |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 0 | 0 | 1 | 10 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 0 | 0 | 2 | 3 |
| [Nacht und Sicht](nacht-und-sicht.md) | 0 | 0 | 0 | 4 |
| [Führungssicht](fuehrungssicht.md) | 0 | 0 | 1 | 11 |
| [Analog-first](analog-first.md) | 0 | 0 | 1 | 8 |
| [Mobile-UI](mobile-ui.md) | 0 | 0 | 1 | 9 |
| Summe der Berichte | 0 | 0 | 7 | 89 |
| Summe ohne Doppelungen (Verlaufstabelle) | 0 | 0 | 6 | 60 |

## Stand der Behebung (28.10.2026)

Behoben bis auf folgende Reste: R18-W7 (erstes Eingabefeld der Schnellerfassung
bei y = 248 statt unter 200), R18-M7 (aufgeklappte Karte bei 320 x 568 in „Feld"
1139 px hoch), R18-S4 (Höhe der Sollstärke-Rückfrage nicht im Browser gemessen),
R18-G5 (Fußzeilen-Linklisten und „Karten | Tabelle" mit 4 bis 6 px Abstand),
R18-A8 (Höhe der Quittung nach „Entfernen" nicht neu gemessen). Im echten Browser
(Produktionsbuild, Playwright) bestätigt: Tipp-Sperren und Quittungsleiste,
Papierkorb, Nummern bleiben, Tabelle am Telefon, Scanner ohne Kamera, Kennzahlenraster,
Erstbesuch-Sprung, Fußleiste im Querformat. Neuer Speicherschlüssel
`eeb.abschluss.v1`. Bundle-Budget neu gesetzt (Startbündel 1 217 601 Byte).
Arc42, ISK und DSFA nachgezogen.
