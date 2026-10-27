# Rollenaudits, Runde 17 (Stand 27.10.2026)

Siebzehnte Prüfrunde nach der Behebung der Befunde aus [Runde 16](../runde-16/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `be6b396` (Stand `main`). Reine Prüfberichte ohne Codeänderung.

Ab dieser Runde gibt es keine „bekannten Grenzen" mehr, die ein Prüfer auslassen
darf: Ziel ist, alle Befunde auf null zu bringen. Die Berichte nennen deshalb auch
früher als „teilweise" oder „offen" geführte Punkte mit Verweis auf die alte ID.
Sie sind in den Zahlen enthalten. Es gibt keine P0- und keine P1-Befunde.

Die Berichte enthalten zusammen 92 Einträge. Mehrfach gemeldete Sachverhalte
zählen einmal: Einsatz auf der Startseite zweimal (A7, K5, N2); „Namen einfügen…"
mit „Nachname Vorname" ohne Komma (E1, N1); Quittungs- und Ansichtsleiste belegen ein
Viertel des Bildes (H7, K6, G5); Neuladen schließt die aufgeklappte Karte (W5, E5, O2,
S10); Abgerückte an ihrem Listenplatz (E6, K4); „✓ Abgerückt" wirkt wie eine
Anzeige (H4, N4); Sammel-PDF ohne Fortschrittsanzeige (A4, O1, D4); Vermerk
„NACHTRAG" nicht in der ersten CSV-Zeile (A3, W2, K9); „Meldung entfernen" nur bis
zum Neuladen rückgängig (E2, D6); Tabelle am Telefon zu breit (H8, K7, G7); Fußleiste
128 px (G4, M3); „⇑" setzt still die Ansprechperson (S5, D2); Verweise 17 px hoch (H9,
G8). Es bleiben rund 72 verschiedene Befunde, davon 4 mit P2: R17-A1, R17-K1,
R17-S1, R17-D1.

| Bericht | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 0 | 0 | 0 | 11 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 0 | 0 | 0 | 9 |
| [Arbeitsablauf](arbeitsablauf.md) | 0 | 0 | 0 | 5 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 0 | 0 | 0 | 7 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 0 | 0 | 1 | 6 |
| [Offline und Speicher](offline-und-speicher.md) | 0 | 0 | 0 | 2 |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 0 | 0 | 1 | 11 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 0 | 0 | 0 | 14 |
| [Nacht und Sicht](nacht-und-sicht.md) | 0 | 0 | 0 | 2 |
| [Führungssicht](fuehrungssicht.md) | 0 | 0 | 1 | 11 |
| [Analog-first](analog-first.md) | 0 | 0 | 1 | 6 |
| [Mobile-UI](mobile-ui.md) | 0 | 0 | 0 | 4 |
| Summe der Berichte | 0 | 0 | 4 | 88 |
| Summe ohne Doppelungen (Verlaufstabelle) | 0 | 0 | 4 | 68 |

## Stand der Behebung (27.10.2026)

Alle Befunde sind bearbeitet. Behoben: alle bis auf einen Teilpunkt: R17-H1
(Sprung der Startseite beim Erstbesuch) ist nur teilweise nachgestellt; die
Offline-Zeile hat jetzt eine feste Höhe, der Wechsel von der statischen Startseite
zur React-Ansicht ist lokal nicht reproduzierbar. Im echten Browser
(Produktionsbuild, Playwright) gemessen sind unter anderem R17-K1, A2, A7/K5/N2,
E6/K4, K3, K12, E2/D6, E5/O2/S10/W5, D1, S1, S11, A4/O1/D4, G4/M3, G2, H7/K6/G5,
H8/K7/G7, G12, G14, L1, S5/D2, S6, D7. Bundle-Budget neu gesetzt
(Startbündel 1 209 290 Byte; Lagemonitor wird nachgeladen). Neue Speicherschlüssel
`eeb.meldungen-papierkorb.v1` (localStorage, 7 Tage) und `eeb.karte-offen.v1`
(sessionStorage). Arc42, ISK und DSFA nachgezogen.

| Gruppe | Stand | Umsetzung |
| --- | --- | --- |
| P2 A1, K1, S1, D1 | behoben | WC/Dusche statt Unterbringung ohne Anforderung; Alter bleibt bei „Als Einsatzmeldung zählen…" und „Stärke ändern…"; Rückgängig für „so gezählt" erscheint; StAN-Vorbelegung mit Folgen und Rückgängig |
| Startseite, Sortierung | behoben | Einsatz einmal, Anwesende vor Abgerückten |
| Exporte | behoben | Nachtrag-Spalte, Typografie, Einzelbogen mit Dateinamen, Fortschritt „n von m" |
| Neuladen | behoben | aufgeklappte Karte bleibt offen, Zurück-Geste führt zur Startseite, entfernte Meldungen 7 Tage im Papierkorb |
| „Namen einfügen…" | behoben | eine Rückfrage zur Reihenfolge, Rufnummern am Zeilenende, Funktionswörter |
| Layout Assistent und Einsatzansicht | behoben | Fußleiste 57 px, Quittung neben Ansichtsleiste, Kernspalten in der Tabelle, Abstände, 44-px-Verweise |
| Texte | behoben | Zeitraum/Uhrzeit, CSV-Erklärung, Scanner ohne Kamera, Schnellerfassung, Lagemonitor |
