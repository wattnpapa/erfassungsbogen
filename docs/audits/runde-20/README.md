# Rollenaudits, Runde 20 (Stand 28.10.2026)

Zwanzigste Prüfrunde nach der Behebung der Befunde aus [Runde 19](../runde-19/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `7c06324` (Stand `main`). Reine Prüfberichte ohne Codeänderung.

Neu in dieser Runde: Die Prüfer melden je Sachverhalt einen Befund, ordnen ihn
einem Typ zu (Daten/Verlust, Bedienung, Layout/Abstand, Text, Kontrast) und führen
Geschmacksfragen als „Hinweise" ohne Priorität in einem eigenen Abschnitt; die
Hinweise stehen nicht in der Zählung (insgesamt 58).

Es gibt wieder einen P1: R20-D1. Bei vollem Gerätespeicher geht ein Bogen
verloren, obwohl die Rückfrage „bleibt erreichbar" verspricht. Zwei P2: R20-W1
(„Endgültig löschen" im Notweg bei vollem Speicher wirkt sofort) und R20-H1 (Schnellerfassung:
der Ort „THW Oldenburg" wird zu „THW THW Oldenburg" und lässt sich danach nicht mehr
ändern).

Die Berichte enthalten zusammen 73 Befunde. Mehrfach gemeldete Sachverhalte
zählen einmal: Schnellerfassung „Schritt 1 von 6 … 2, 5 entfallen" (A2, W3, H3, K4,
N3); „Warum?" nur 15 px hoch (G1, M6, L1, O4); Scanner ohne Kamera im Querformat
„Feld" (E1, H8, G5, M2, S2, L5); „Anderer Einsatz?"-Chip (G2, M1); „noch offen: 6" ohne
Nennung (W2, K1); Einheitenliste tief unter dem Kopf (W6, H5, G6); Assistent quer
(G7, M3, S3); Dialoge bei 320 px (H9, M5); Tabelle am Telefon (N6, H11, H12, S5);
Dateiname des Karten-PDFs (G8, N8); „THW THW Oldenburg" (H1, N1); Texte bei vollem
Speicher (H13, N9, L3, O2). Es bleiben rund 47 verschiedene Befunde (1 P1,
2 P2, rund 44 P3, geschätzt).

| Bericht | P0 | P1 | P2 | P3 | Hinweise |
| --- | --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 0 | 0 | 0 | 9 | 5 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 0 | 0 | 1 | 13 | 6 |
| [Arbeitsablauf](arbeitsablauf.md) | 0 | 0 | 1 | 5 | 4 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 0 | 0 | 0 | 2 | 4 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 0 | 1 | 0 | 3 | 7 |
| [Offline und Speicher](offline-und-speicher.md) | 0 | 0 | 0 | 5 | – |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 0 | 0 | 0 | 5 | 4 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 0 | 0 | 0 | 8 | 9 |
| [Nacht und Sicht](nacht-und-sicht.md) | 0 | 0 | 0 | 5 | 3 |
| [Führungssicht](fuehrungssicht.md) | 0 | 0 | 0 | 4 | 8 |
| [Analog-first](analog-first.md) | 0 | 0 | 0 | 5 | 4 |
| [Mobile-UI](mobile-ui.md) | 0 | 0 | 0 | 6 | 4 |
| Summe der Berichte | 0 | 1 | 2 | 70 | 58 |
| Summe ohne Doppelungen (Verlaufstabelle, P3 geschätzt) | 0 | 1 | 2 | 44 | – |

## Stand der Behebung (28.10.2026)

Behoben, auch der P1 (R20-D1) und die P2 (R20-W1, R20-H1), jeweils mit Test.
Im echten Browser (Produktionsbuild, Playwright) bestätigt: D1 mit bis zum
Quota-Fehler gefülltem `localStorage`, W1, H1, Scanner ohne Kamera quer, Assistent
quer, Dialoge bei 320 px, Tippziele „Warum?" und „ganz zeigen", Tabelle am Telefon,
Startseite. Zusätzlich wurde das Startbündel von 1,23 MB auf 0,73 MB verkleinert.
Nicht ganz erreicht: R20-W6/H5/G6 (die erste Einheitenkarte liegt direkt nach dem
Einlesen bei etwa 1209 px statt unter 960 px; weiter nur, wenn die vier
Aufnahmeknöpfe oder die Quittung weichen) und R20-N2 (im Vollassistenten quer in
„Feld" liegt das Feld „Ort der Einheit" zur Hälfte unter der Fußleiste). R20-W4
(gleicher Stand als „älter") ließ sich nicht nachstellen, der Text nennt jetzt beide
Stände. Bundle-Budget neu gesetzt (Startbündel 734 491 Byte, gesamt 5 702 296 Byte).
Arc42, ISK und DSFA nachgezogen.
