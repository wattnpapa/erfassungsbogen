# Rollenaudits, Runde 8 (Stand 24.10.2026)

Achte Prüfrunde nach der Behebung der Befunde aus [Runde 7](../runde-7/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `3fee6e5` (Stand `main` nach Runde 7). Jeder Prüfer hat zuerst ohne
Kenntnis der bisherigen Berichte getestet und danach festgehalten, welche
Behebungen aus Runde 7 halten. Einige Prüfer haben beim Abgleich Überschriften
paralleler Runde-8-Berichte gesehen; das steht in ihren Berichten, die Befunde
stammen aus eigenen Messungen.

Die Spalten zeigen die Zahlen der einzelnen Berichte. Mehrere Berichte haben
denselben Befund selbst gemessen; in der Summe zählt er einmal, mit der
Priorität des ersten Fundes. Zusammengeführt sind:

- Beschädigte Einsatz-Sammlung wird still zu `[]`: R8-D1 (P1) mit R8-H1 (P2)
  und R8-O2 (P3); dazu R8-E1 (Vorlagen).
- Sprungmarke „Zum Inhalt springen" ragt bei großer Schrift ins Bild: R8-M1
  (P2) mit R8-O1 (P2), R8-G3 und R8-S1 (je P3).
- Rückfragen bei Zoom 200 % unbedienbar: R8-G1 (P2) mit R8-M2 (P2).
- Lagemonitor am Telefon, Spalten F/U/M außerhalb des Bildes: R8-K1 (P2) mit
  R8-N1, R8-H3 und R8-M4 (je P3).
- Lagemonitor am Fernseher, Restplatz unter „+ n weitere": R8-L1 (P2) mit
  R8-N2 (P3).
- Zwei-Fenster-Rückfrage nennt die Werte nicht: R8-N6 mit R8-E4 (je P3).
- Tipp-Sperre nach dem Öffnen eines Dialogs: R8-H5 mit R8-S4 (je P3).
- Kasten zum beiseitegelegten Bogen: R8-H4 mit R8-S2 (je P3).
- Fußleiste bei Zoom 200 %: R8-G2 mit R8-M3 (je P3).
- Musterung, klebende Leisten: R8-G4 mit R8-M10 (je P3).

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R8-N | 0 | 0 | 0 | 7 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R8-H | 0 | 0 | 1 | 4 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R8-W | 0 | 0 | 1 | 5 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R8-E | 0 | 0 | 0 | 5 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R8-D | 0 | 1 | 1 | 4 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R8-O | 0 | 0 | 1 | 1 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R8-S | 0 | 0 | 0 | 4 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R8-G | 0 | 0 | 1 | 5 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R8-L | 0 | 0 | 2 | 5 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R8-K | 0 | 0 | 2 | 3 |
| Analog first | [analog-first.md](analog-first.md) | R8-A | 0 | 0 | 1 | 2 |
| Mobile-UI (allgemein) | [mobile-ui.md](mobile-ui.md) | R8-M | 0 | 0 | 2 | 8 |
| Summe der Berichte | | | 0 | 1 | 12 | 53 |
| Summe ohne Doppelungen | | | 0 | 1 | 9 | 41 |

## Stand der Behebung (24.10.2026)

Alle 51 Befunde ohne Doppelungen bearbeitet: 46 behoben, 5 teilweise (R8-H5/S4,
R8-D5, R8-H4/S2, R8-A1, R8-M6), keiner offen. Offen bleibt aus Runde 6 die
Grenze R6-O9. Bundle-Budget erneut angehoben (Startbündel 1 187 670 →
1 198 089 Byte). Begleitdokumente nachgezogen (Arc42, ISK, DSFA).

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| D1, H1, O2, E1 Beschädigter Gesamttext wird still zu `[]` | behoben | `eeb.unlesbar.v1` nimmt Rohtexte (`texte`) auf, geprüft in der Hülle vor jedem Lesen; Integrationstest mit echtem Kern |
| M1, O1, G3, S1 Sprungmarke ragt ins Bild | behoben | Unterkante in Ruhe −8 px in allen gemessenen Lagen |
| G1, M2 Rückfragen bei Zoom 200 % | behoben | Knöpfe untereinander unter 280 px, Rumpf 41–59 % der Höhe |
| G5, M8 Knopfabstand quer | behoben | 24 px, gleiche Oberkanten |
| H2 „Nur Stärke melden?" | behoben | Fokus auf „Abbrechen", Rumpf sichtbar |
| H5, S4 Tipp-Sperre nach dem Öffnen | teilweise | Sperre gilt nicht mehr für die Knöpfe der Rückfrage; Prellschutz 450/800 ms bleibt |
| D5 „Rückgängig" unter „Abrücken" | teilweise | Sperre 2,5 s, Zweittipp macht nichts rückgängig; Leiste liegt weiter an der Knopfstelle |
| G6 „Eingaben verwerfen…" | behoben | 44-px-Knopf, 16 px Abstand (im Browser nicht gemessen) |
| H4, S2 Kasten zum beiseitegelegten Bogen | teilweise | Drei Zeilen statt neun, ohne „Support-Stelle"; „Neuen Bogen erstellen" bei 360×640 halb unter dem Bildrand |
| N6, E4 Zwei-Fenster-Rückfrage ohne Werte | behoben | dort/hier mit beiden Werten, Personen mit Namen |
| E2, E5, D6 | behoben | Eingabe bleibt erhalten, „Rückgängig" genannt, Übergabe-Dialog umgeordnet |
| L1 Lagemonitor zeigt 3 von 6 | behoben | Messung nimmt die größte passende Zeilenzahl |
| N2, K5 Rest unter „+ n weitere" | behoben | „zuletzt gemeldet zuerst" |
| K1, N1, H3, M4 Telefon | behoben | Tabelle auf Rahmenbreite, Einheitentyp entfällt unter 640 px |
| L3, L4, L5 | behoben | Kontrast 5,53:1, Stufenleiste ohne Sprung auf Vollweiß, Schrift folgt der Systemschrift |
| L2, L6, L7 Kontrast | behoben | Musterung ≥ 4,5:1, iOS ≥ 4,5:1, Nacht-Haken 5,32:1 |
| G2, M3 Fußleiste bei 180 px | behoben | einzeilig, 22 % der Höhe |
| G4, M10 klebende Leisten | behoben | 15–30 % der Höhe |
| D4, S3 Entwurfskarte bei 180 px | behoben | Beschriftungen umbrechen, „Fortsetzen" bei 273 px |
| M5, M7, M9, N3, N4, N7, K2, K3 | behoben | „Schließen" im Bild, Beschriftung der Kurz-Liste, Bedarf 92 px, Name 22 px, Texte, Spaltenfolge, Auftrag bis 80 Zeichen |
| M6 Namen in der Tabelle | teilweise | Kein Wortbruch mehr; die klebende Spalte bleibt 37–42 % breit |
| D2, W1 Nummern verschieben sich | behoben | Rückfrage nennt alle Verschiebungen |
| W2, W3, W4, W5, W6 | behoben | Historie ohne „neue Fassung", Dialogtext, Knopf bei der Warnung, Hinweis auf den offenen Bogen, „Lageblatt veraltet" |
| A1 Sollstärke zählt mit | teilweise | Zählt weiter mit (datensparsam, rückgängig); Marke in Karte, Tabelle, Lageblatt und Sammel-PDF, „davon n Sollstärke" |
| A2, A3, N5 | behoben | CSV nach Nr., Umschrift im Papierfeld, „n. Zug" normalisiert |
| E3, D3 | behoben | echte Ursache bei defekten Bogendateien, Ankündigung der Anonymisierung 14 Tage vorher |
