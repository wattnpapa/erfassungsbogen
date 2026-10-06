# Rollenaudits, Runde 5 (Stand 06.10.2026)

Fünfte Prüfrunde nach der Behebung der Befunde aus [Runde 4](../runde-4/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `c0cbae0` (Code wie `4fcdbaf`, Stand `main` nach Runde 4). Jeder Prüfer
hat zuerst ohne Kenntnis der bisherigen Berichte getestet und danach
festgehalten, welche Behebungen aus Runde 4 halten. Drei Prüfer haben
vorab Teile des Runde-4-Berichts gelesen (Nacht und Sicht, Mobile-UI,
Arbeitsablauf); das steht in ihren Berichten. Befunde, die ein Prüfer aus
einem anderen Runde-5-Bericht nachgestellt hat, stehen dort nur als Verweis
und sind unten nicht doppelt gezählt. „Offline und Speicher" ist diesmal
vollständig geprüft.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R5-N | 0 | 0 | 1 | 8 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R5-H | 0 | 0 | 1 | 3 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R5-W | 0 | 2 | 5 | 2 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R5-E | 0 | 2 | 2 | 3 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R5-D | 0 | 2 | 2 | 1 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R5-O | 0 | 0 | 3 | 4 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R5-S | 0 | 1 | 3 | 3 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R5-G | 0 | 0 | 3 | 4 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R5-L | 0 | 0 | 1 | 6 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R5-K | 0 | 1 | 4 | 2 |
| Analog first | [analog-first.md](analog-first.md) | R5-A | 0 | 1 | 3 | 5 |
| Mobile-UI (allgemein) | [mobile-ui.md](mobile-ui.md) | R5-M | 0 | 0 | 3 | 4 |
| Summe | | | 0 | 9 | 31 | 45 |

## Berichtsübergreifende Reihenfolge

1. Geräteuhr und Löschfristen (R5-D1, R5-D2, R5-D4, R5-O5, R5-E2). Die
   Korrektur aus Runde 4 gilt nur am Tag des Sprungs: Nach einem Tag
   übernimmt die App die falsche Uhr, löscht alle Sammlungen endgültig und
   anonymisiert den Entwurf. „Wiederherstellen" löscht eine länger als 60
   Tage ruhende Sammlung sofort. Wird die Uhr zurückgestellt, gilt eine
   Stärkeänderung nicht, und die Quittung meldet Erfolg.
2. Weißer Bildschirm (R5-E1): Ein Bogen ohne Einheitstyp in einer Datei
   macht die App nach dem Import dauerhaft weiß; es gibt keinen Fehlerfänger.
3. QR-Vollbild und Tipp-Sperre (R5-S1, R5-G1, R5-S2, R5-G5, R5-S3): Ein
   Doppeltipp auf „Weiter zu Teil n" überspringt einen Teil, und die App
   lässt am Ende „Ja, gescannt — übergeben" zu. Die Sperre schweigt, und bei
   „Person entfernen" fällt durch Nachtipps eine zweite Person weg.
4. Fassungswechsel und Exportstand (R5-W1, R5-K1, R5-W2 bis R5-W7): Eine
   Folgemeldung holt eine abgerückte Einheit still zurück; ein Fassungswechsel
   zählt nicht als Änderung, der Nachtrag-Knopf bleibt gesperrt; „Einsatz
   importieren…" legt neben einer gleichnamigen Sammlung eine zweite an;
   Nummern ändern sich beim Abgleich still.
5. Papier-Rückweg (R5-A1 bis R5-A4): Der Papier-Abgleich belegt die
   Eintreffzeit mit der Einlesezeit und entfernt die Marke „vom Papier";
   der Meldekopf-Kasten steht nur auf dem Blanko, nicht im Einzel-PDF (die
   Aussage im Stand der Behebung von Runde 4 war falsch).
6. Nebenwirkungen der Runde-4-Behebungen: der feste „◐" deckt Inhalt ab
   (R5-L1), das „≠" im Lageblatt druckt als Fremdzeichen (R5-K2), „Anderer
   Einsatz?" erscheint fast immer bei den ersten Bögen (R5-N1), zwei
   gegensätzliche „Rückgängig" nach „als neue Fassung" (R5-E3), Kurz-Liste
   mit überlappenden Knöpfen (R5-G2), Speicherzeile im Feld-Modus
   abgeschnitten (R5-L2).
7. Rückmeldung bei Wartezeiten (R5-O3, R5-H4, R5-L4): PDF-Erzeugung und
   „Einsatz weitergeben / sichern" brauchen unter Last bis 18 s ohne
   Rückmeldung; zweimal getippt ergibt zwei Dateien.

## Wie die Behebungen aus Runde 4 halten

Die Mehrzahl hält, und keine Behebung hat sich im Kern verkehrt. Halten:
Rückfragen-Sperre (R4-G1), Zurück-Geste (R4-S1), „Wohin damit?" beim
Kaltstart (R4-W3), Exportstand je Format (R4-W2, mit Resten), Neu-
Registrierung nach abgebrochenem Erstladen (R4-O1), Tastatur-Wächter,
Fußleisten-Raster, Kontraste aller zwölf Kennfarben (R4-L1, R4-L2), die
Papier-Behebungen R4-A1, A2, A3, A6. Nur teilweise: R4-D1 (Geräteuhr),
R4-K5 (Liste weit unten, am Telefon 2,6 Bildschirme bei 11 Einheiten),
R4-A4, R4-A5, R4-A7, R4-S2. Teilweise verkehrt: R4-H2/N3 (Kurz-Liste ohne
Seitwärtsrollen, dafür Überlappung), „zwei Fenster" nur für geänderte,
nicht für entfernte Stände (R5-D3).

## Prüfaufbau

Wie in Runde 4. Echtes Offline über einen eigenen drosselnden Proxy, nicht
über `setOffline`; `page.clock` für Uhrsprünge; Bögen aller Organisationen.
Nicht prüfbar wie bisher: Kamera, Handscanner, echte Handschuhe und echtes
Licht, echte Bildschirmtastatur (nur nachgestellt), WebKit/Safari, echtes
Drucken, native Builds. Zeitmessungen liefen unter Last durch elf parallele
Prüfer und sind unsicher.
