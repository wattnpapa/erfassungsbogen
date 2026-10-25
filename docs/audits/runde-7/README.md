# Rollenaudits, Runde 7 (Stand 23.10.2026)

Siebte Prüfrunde nach der Behebung der Befunde aus [Runde 6](../runde-6/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `a52f20a` (Stand `main` nach Runde 6). Jeder Prüfer hat zuerst ohne
Kenntnis der bisherigen Berichte getestet und danach festgehalten, welche
Behebungen aus Runde 6 halten. Die Summe zählt jeden Befund einmal; Verweise auf
Befunde anderer Berichte sind nicht doppelt gezählt.

Methodische Grenzen: Die Prüfer arbeiteten gleichzeitig am selben Server und im
selben Scratchpad. Mehrere haben dort Hilfsdateien anderer überschrieben und
sind in eigene Unterordner ausgewichen; ein Prüfer hat versehentlich mit `pkill`
Prozesse gleichen Namens beendet (Server 4173 blieb erreichbar). Befunde aus
Läufen mit nachgestellter Uhr sind in den Berichten als solche gekennzeichnet.
Nicht prüfbar waren echtes Drucken, Kamera-Scan, Handscanner, echte
Geräteuhr-Sprünge und Safari.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R7-N | 0 | 0 | 3 | 6 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R7-H | 0 | 0 | 1 | 8 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R7-W | 0 | 0 | 2 | 3 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R7-E | 0 | 0 | 2 | 6 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R7-D | 0 | 0 | 3 | 5 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R7-O | 0 | 0 | 1 | 6 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R7-S | 0 | 0 | 1 | 4 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R7-G | 0 | 0 | 3 | 6 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R7-L | 0 | 0 | 2 | 2 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R7-K | 0 | 0 | 6 | 3 |
| Analog first | [analog-first.md](analog-first.md) | R7-A | 0 | 0 | 1 | 3 |
| Mobile-UI (allgemein) | [mobile-ui.md](mobile-ui.md) | R7-M | 0 | 0 | 2 | 6 |
| Summe | | | 0 | 0 | 27 | 58 |

## Berichtsübergreifende Schwerpunkte

1. Geräteuhr-Sprung löscht die Sammlung (R7-D2, R7-O7, offen aus R6-O9): Halt
   gilt nur beim ersten Lesen; Warnung sagt „löscht nichts".
2. Papier-Abgleich verwirft Eingaben ohne Rückfrage (R7-S1, R7-G1).
3. „Für neuen Einsatz vorbereiten" ohne Rückfrage und ohne Rückgängig (R7-G2).
4. „Alle Daten löschen" in einem Fenster, Gegenfenster schreibt den Bogen zurück
   (R7-D1); Rückholplatz fasst nur einen Bogen (R7-D3).
5. „Nur Stärke" legt Sollzahlen ohne Hinweis als Meldung ab (R7-A1).
6. Stapelimport nennt mögliche Doppelungen nicht (R7-N1); unbrauchbare Einträge
   fehlen still (R7-N3, R7-E2); Hülle des beiseitegelegten Entwurfs wird
   abgewiesen (R7-E1).
7. Zwei-Fenster-Warnung und Rückfragen bei großer Schrift und im Querformat
   (R7-M2, R7-O1, R7-W1, R7-H1, R7-H9); Zwei-Fenster-Vergleich mit gleichen
   Ständen (R7-S2, R7-N6, R7-O2, R7-H3).
8. Lagemonitor: Tabelle unter der Bildkante, stille Kürzung der Bewegungen,
   Telefonansicht, Nacht-Modus (R7-K1, K2, L1, L2, L3, M6, G3).
9. „Bedarf:" bricht im Wort (R7-M1, G9, K7, N5).
10. Zwischensummen nach Zug, Übergabe ohne Funkrufname und Einsatzbeginn
    (R7-K4, R7-K5).

## Stand der Behebung (24.10.2026)

Alle 85 Befunde bearbeitet: 79 behoben, 6 teilweise (R7-G4, G8, H9, M8, N1, N9),
keiner offen. Offen bleibt aus Runde 6 die Grenze R6-O9 (Uhrstand in der
Zukunft, frische Sammlung; Grenze der Ablage-Hülle, in Arc42 vermerkt).
Bundle-Budget erneut angehoben (Startbündel 1 157 883 → 1 187 670 Byte). Neue
Speicherorte sind in ISK, DSFA und Arc42 nachgezogen.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| D2 Geräteuhr-Halt nur beim ersten Lesen | behoben | Halt gilt, bis jemand antwortet; Test mit zwei Aufrufen |
| O7 Uhrstand in der Zukunft, „Invalid Date" | behoben, Rest offen | Unplausibler Uhrstand wird verworfen; Aufräumen unter gehaltener Uhr bleibt R6-O9 |
| K1, L1 Tabelle unter der Bildkante | behoben | Tabelle füllt den Rest der Bildhöhe, Rest als „+ n weitere Einheiten" |
| K2 Bewegungen still gekürzt | behoben | höchstens drei Zeilen, „+ n weitere Bewegungen", Folgemeldung mit Betrag |
| K3 Zukunftszeiten | behoben | Warnung „Meldezeiten liegen in der Zukunft" statt „gerade eben" |
| K7, N5 Wortbruch „Orga" | behoben | Zellen brechen nur an Leerstellen, Beschriftung „Uhr" |
| K8 Widersprüche im Hauptbild | behoben | Einmal „Noch nichts gemeldet", „seit Beginn", Datenstand ab 60 Min. in Warnfarbe |
| L2, G3, M6 Lagemonitor am Telefon | behoben | Schrift ab 14 px, Knöpfe 44 px, Seite rollt |
| L3 Nacht-Modus | behoben | Start gedimmt bei Nacht, Stufe gemerkt (`eeb.lagestufe.v1`) |
| W4 Eintreffen als Bewegung | behoben | „Eingetroffen: …" |
| M2, O1, G6 Zwei-Fenster-Leiste | behoben | 17 bis 24 % der Höhe bei 200 %, beide Knöpfe ohne Aufklappen |
| O2, W5, N6, S2, H3 Gleiche Stände | behoben | Leiste und Rückfragen nennen Feld und Sekunden (`fenster-unterschied.ts`) |
| E3 Warnung beim bloßen Öffnen | behoben | Konflikt nur bei Inhaltsunterschied |
| W1, E4 Rückfragen überdecken Wahl | behoben | Rollender Rumpf, fester Fuß, Fokus auf „Abbrechen" |
| W2 Geräteuhr nur auf der Startseite | behoben | Hinweis im Assistenten und im Dialog „Bogen übergeben" |
| G8, H9 Geräteuhr-Warnung bei 200 % | teilweise | Knöpfe direkt nach dem ersten Satz; bei 320 × 568 knapp unter der Kante (Kopfhöhe der Startseite) |
| O4, D5, S5, N4, S3, W3, N8, O3, D7 Texte und Wortlaut | behoben | Grammatik, einheitlich „Zuletzt geschlossener Bogen", Werte statt Zähler, Sicherung vor der Aufzählung |
| D1 Gelöschter Bogen kehrt zurück | behoben | `entwurfFremdEntfernt` verhindert das Zurückschreiben |
| D3 Rückholplatz verdrängt Bogen | behoben | Rückfrage nennt den Verlust vorher |
| D4, D6, D8 Datum, Schlüssel, gleichnamige Vorlage | behoben | `datumZweistellig`, „Vorher sichern", Rückfrage bei gleichem Namen |
| S1, G1 Papier-Abgleich verliert Eingaben | behoben | Sitzungsspeicher, „Später" abgesetzt, „Eingaben verwerfen…" fragt |
| G2 „Für neuen Einsatz vorbereiten" | behoben | Rückfrage mit Folgen (kein „Rückgängig") |
| E1, E2, N3 Unlesbares | behoben | `eeb.unlesbar.v1`, Zähler, „Daten sichern…", Hülle des Entwurfs erkannt |
| E5, E6, E7 | behoben | Rückgängig beim Organisationswechsel, Grenzen sichtbar, Marke „kein Name?" |
| N1 Stapelimport nennt Doppelung | teilweise | Quittung und Marke „ähnelt"; kein Zusammenführen-Tipp |
| N7 QR-Vollbild | behoben | „n Plätze ohne Namen — Stärke nach Soll" |
| N9 Übersicht ohne Fußleiste | teilweise | „← Zurück zu Schritt 5" am Ende; Ziffern der Schrittleiste bleiben |
| A1 „Nur Stärke" legt Sollzahlen ab | behoben | Hinweis und Rückfrage an die Gleichheit der Zahlen gebunden |
| A2, A3, A4 Quittungen und Papier | behoben | „Abrückzeit nicht bestätigt", „erzeugt — Download-Ordner", Person genannt |
| K4, K5, K6, K9 Führung | behoben | Zug normalisiert, `lage` im Umschlag, Auftrag auf der Karte mit Filter, Sortierung nach Nr. |
| M1, G9 „Bedarf:" | behoben | unteilbar, auch bei 200 % |
| M3, M4, M5, M7 Telefon, Zoom, Kopf | behoben | Fußleiste einzeilig bei 180 px, Tabellenspalte gedeckelt, Kopf 123 px bei 200 % |
| M8, G4 Ecken-Knopf | teilweise | Quer überdeckt nichts mehr; hochkant liegt der feste Balken über dem Inhalt (Bauart) |
| H1, S4 Entwurfskarte, „Fortsetzen" | behoben | Umbruchregel bei großer Schrift, quer und am Tablet im Bild |
| H2 Musterung verlässt die App | behoben | eigene Verlaufsansicht |
| H4, H5, H7, H8 Vollbild, Sperrradius, Kopf, Knopf quer | behoben | siehe `stilregeln-r7-layout.test.ts` |
| H6 Karten bis 12 Personen | behoben | Kurz-Liste ab 8 Personen |
| G5, G7, N2, E8, L4, O5, O6 | behoben | kein Überlauf im Feld-Modus, feste Knopfbreite, Vorschlagsliste im Bild, „offen" mit Rand, Rückweg gelöscht, Themenseiten `StaleWhileRevalidate` (im Funkloch nicht gemessen) |
