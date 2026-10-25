# Rollenaudits, Runde 6 (Stand 23.10.2026)

Sechste Prüfrunde nach der Behebung der Befunde aus [Runde 5](../runde-5/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und die allgemeine Mobile-UI, alle gegen
den Produktionsbuild (`vite build` + `vite preview`, Port 4173), Code-Stand
Commit `03a0011` (Stand `main` nach Runde 5). Jeder Prüfer hat zuerst ohne
Kenntnis der bisherigen Berichte getestet und danach festgehalten, welche
Behebungen aus Runde 5 halten. Mehrere Prüfer haben beim Nachschlagen des
Prüfaufbaus Teile von „Stand der Behebung" aus Runde 5 vorab gesehen; das steht
in ihren Berichten, die Befunde stammen aus eigenen Messungen. Befunde, die ein
Prüfer aus einem anderen Runde-6-Bericht nachgestellt hat, stehen dort nur als
Verweis und sind unten nicht doppelt gezählt.

Zehn der zwölf Prüfer waren während der Prüfung am Nutzungslimit abgebrochen und
haben ihre gespeicherten Teilberichte später fortgesetzt; ihre Messungen stammen
vor und nach einem Neustart des Vorschau-Servers aus demselben Build. Auf `main`
liegen seit der Prüfung zwei weitere Commits von anderer Seite, die nur den
Lagemonitor ändern (`5cf3f2a`, `3a4cb7b`); sie sind im geprüften Build nicht
enthalten. Neu seit Runde 5 und erstmals geprüft: der Lagemonitor, eine
Lageanzeige für den Fernseher im Führungsfahrzeug.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R6-N | 0 | 1 | 3 | 7 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R6-H | 0 | 0 | 1 | 5 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R6-W | 0 | 1 | 0 | 2 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R6-E | 0 | 2 | 1 | 3 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R6-D | 0 | 0 | 3 | 4 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R6-O | 0 | 1 | 3 | 5 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R6-S | 0 | 0 | 2 | 3 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R6-G | 0 | 0 | 4 | 5 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R6-L | 0 | 0 | 2 | 4 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R6-K | 0 | 1 | 6 | 3 |
| Analog first | [analog-first.md](analog-first.md) | R6-A | 0 | 0 | 3 | 6 |
| Mobile-UI (allgemein) | [mobile-ui.md](mobile-ui.md) | R6-M | 0 | 0 | 3 | 5 |
| Summe | | | 0 | 6 | 31 | 52 |

## Berichtsübergreifende Reihenfolge

1. Rückfrage nach „Wohin damit?" schließt sich selbst (R6-N1, P1; im Ablauf der
   Regelfall der Nachmeldung, R6-W-Verweis). Eine Rückfrage, die direkt auf die
   Wahl folgt, verschwindet nach 75 bis 240 ms, das Ergebnis lautet „… nicht
   aufgenommen." ohne Grund. Vermutete Ursache: die 80-ms-Verzögerung in
   `ersteEbeneVerlassen` (`modal-overlay.ts`) aus der Behebung von R5-S5.
2. Gespeicherter Bestand wird beim Lesen nicht geprüft (R6-E1, P1; R6-N4,
   R6-E3, R6-D2, R6-D5). Eine Sammlung ohne Einheitstyp oder eine Vorlage ohne
   Fahrzeuge stürzt Öffnen bzw. Startseite ab; „Neu laden" wiederholt den
   Absturz. Der Fehlerfänger aus R5-E1 schützt die Eingänge, nicht den Bestand.
3. Stumme Fehlschläge bei vollem Speicher (R6-O1, P1; R6-E2, P1; R6-O5).
   „Löschen… → In den Papierkorb" scheitert ohne Meldung, obwohl die Warnzeile
   genau diesen Weg empfiehlt; „In Einsatz übernehmen" der Schnellerfassung
   meldet oberhalb des Bildes.
4. Ältere Fassung zählt als „neuer Bogen" (R6-W1, P1). Eine beim Abgleich
   eintreffende, nur in der Historie liegende Fassung landet im Nachtrag; der
   Stab ersetzt die richtige Zeile durch die falsche.
5. Lagemonitor, neu (R6-K1, P1; R6-K2 bis K4, K8; R6-L1 bis L4, L6; R6-G3,
   R6-M3). Abrücken, Folgemeldung und Rückkehr ändern die Stärke ohne Spur,
   „alle abgerückt" und „leer" sehen gleich aus; die Uhr nimmt 45 % der Höhe;
   Überschriften in Standard und Feld unlesbar (1,0 bis 1,14:1); das
   Datumsfeld macht die Einsatzansicht bei 200 % Schrift breiter als das Gerät.
6. Leiste „◐ Ansicht" (R6-G1, M2, G2, G7, S5, N5, M8). Das Wort „Ansicht"
   (Behebung R5-N4) lässt die Leiste unter „Weiter →" und „Zur Übersicht →"
   liegen, bei 200 % Schrift und im Zoom ragt sie über den Rand.
7. Papier-Rückweg (R6-A1 bis A3). Der Kasten „Stand am Meldekopf" der Sammel-PDF
   druckt die Einlesezeit als „Eingetroffen" ohne „nicht bestätigt"; die
   Kopfzeile jeder Bogenseite liegt 2,1 mm vom Papierrand; eine nach Stärke
   erfasste Einheit druckt „Ausstattung nach StAN: ja".
8. Zwei Fenster (R6-D1, R6-S1, R6-S2, R6-M1). „Stand laden" verwirft ohne
   Rückfrage, die Warnung nennt den Unterschied nicht, und bei 200 % Schrift ist
   sie höher als das Fenster.
9. Geräteuhr (R6-D3, R6-D7, R6-O8, R6-O9). Ein Sprung bis 59 Tage löst keine
   Rückfrage aus; die Rückfrage nennt Sammlungen nur als Zahl.

## Wie die Behebungen aus Runde 5 halten

Die Mehrzahl hält, darunter alle P1 aus Runde 5: Geräteuhr-Korrektur über
mehrere Tage (R5-D1, im Browser belegt), „Wiederherstellen" (R5-D2),
Tipp-Sperre im QR-Vollbild (R5-S1, R5-G1), Fassungswechsel im Exportstand
(R5-W1, mit Rest R6-W1), Rückkehr Abgerückter (R5-K1), Papier-Abgleich ohne
vorbelegte Eintreffzeit (R5-A1, mit Rest R6-A1). Nur teilweise: R5-S5
(Zurück-Geste; Nebenwirkung R6-N1), R5-E1 (Fehlerfänger; Bestand ungeprüft),
R5-D3 und R5-D5 (zwei Fenster, Rückweg), R5-O2 bis O5, R5-G4, R5-G6, R5-G7,
R5-M2, R5-N4 bis N8. Ins Gegenteil verkehrt: R5-N4 (das Wort „Ansicht" erzeugt
die Überdeckung R6-G1) und die Aussage „kein seitlicher Überlauf" für die
Einsatzansicht bei 200 % Schrift (R6-G3, R6-M3).

## Prüfaufbau

Wie in Runde 5. Neu: Lagemonitor auf 1 920 × 1 080, Browser-Zoom nur nachgestellt
(halbierter Viewport), `html { font-size: 200% }`. Nicht prüfbar wie bisher:
Kamera, Handscanner, echte Handschuhe und echtes Licht, echte
Bildschirmtastatur, WebKit/Safari, echtes Drucken, native Builds, ein echter
Fernseher für den Lagemonitor. Zeitmessungen liefen unter Last durch bis zu zwölf
parallele Prüfer und sind unsicher.

## Stand der Behebung

Stand 23.10.2026. Die 89 Befunde wurden auf demselben Zweig bearbeitet, je Befund oder kleiner Gruppe mit Typprüfung und Unit-Tests, die Fußleisten, Schrittleisten, Startseite und Einsatzansicht zusätzlich mit Messungen im Produktionsbuild (Playwright). Gesamtprüfung vor dem Zusammenführen: Typprüfung ohne Fehler, 2 938 Unit-Tests, 137 von 137 Verhaltensszenarien, Produktionsbuild ohne Fehler, Kern-Kopien, Bundle-Budget (angehoben, Begründung in der Commit-Nachricht). Einzelheiten stehen im Abschnitt „Stand der Behebung“ jedes Berichts.

| Stand | Anzahl |
| --- | --- |
| behoben | 60 |
| teilweise | 21 |
| offen | 8 |

| Thema | Befunde |
| --- | --- |
| Rückfragen, Zurück, zwei Fenster, Bestand | R6-N1, N4, N5, E1, E3, E4, E6, S1 bis S3, D1, D2, D5 |
| Speicher, Uhr, Offline | R6-O1 bis O8, E2, E5, D3, D7, S4, D4 |
| Fassungen, Exporte, Führung, Lagemonitor | R6-W1 bis W3, K1 bis K7, K9, L1 bis L6 |
| Layout, Touch, Papier, Begriffe | R6-G1 bis G5, G7, G8, M1 bis M3, M5, M6, M8, A1 bis A9, N2, N3, N6 bis N11, H1, H2, H5 |

Offen (8): R6-O9 (Uhrstand in der Zukunft bei frischer Sammlung; ein Eingriff in die Ablage-Hülle verschöbe die Stempel beim Zurückschreiben), R6-H3 (Länge der Kartenliste), R6-H4 (klebende Kopfzeile der Musterung), R6-G6 (Lücke und Breite der Reiter im Feld-Modus), R6-G9 (Übersichtstabellen rollen seitlich), R6-M4 (klebende Spalte der Tabellenansicht), R6-K8 (bezog sich auf eine Ansicht, die der Monitor nicht mehr hat), R6-K10 (nicht nachvollzogen). Teilweise gelöst: die Gründe stehen je Befund im Bericht, etwa R6-G2 (mit 44-px-Zielen ist ein Viertel der Bildhöhe bei Zoom 200 % nicht erreichbar) und R6-K2 (die Gewichtung des Lagemonitors folgt der Vorlage des Status-Monitors).

Im Browser belegt zusätzlich: R6-S3, R6-E4. Nicht im Browser belegt, nur durch Unit-Tests oder Quelltext: R6-G5, R6-H1, R6-M1, R6-M5, R6-O3. Der Lagemonitor wurde nach der Prüfung von anderer Seite umgebaut; die Befunde dazu gelten für den heutigen Stand.
