# Rollenaudits, Runde 4 (Stand 05.10.2026)

Vierte Prüfrunde nach der Behebung der Befunde aus [Runde 3](../runde-3/README.md).
Zwölf Prüfberichte, die elf THW-Rollen und wieder die allgemeine Mobile-UI,
alle gegen den Produktionsbuild (`vite build` + `vite preview`, Port 4173),
Code-Stand Commit `3dd2ab5` (Stand `main` nach Runde 3). Jeder Prüfer hat
zuerst ohne Kenntnis der bisherigen Berichte getestet und danach festgehalten,
welche Behebungen aus Runde 3 halten (Mobile-UI: aus Runde 2, da in Runde 3
nicht beteiligt). Befunde, die ein Prüfer aus einem anderen Runde-4-Bericht
nachgestellt hat, stehen dort nur als Verweis und sind unten nicht doppelt
gezählt.

Die Prüfung „Offline und Speicher" wurde nach zwei Befunden abgebrochen; der
Bericht ist unvollständig.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R4-N | 0 | 0 | 2 | 4 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R4-H | 0 | 0 | 1 | 4 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R4-W | 0 | 3 | 4 | 1 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R4-E | 0 | 2 | 3 | 2 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R4-D | 0 | 1 | 2 | 2 |
| Offline und Speicher (unvollständig) | [offline-und-speicher.md](offline-und-speicher.md) | R4-O | 0 | 1 | 1 | 0 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R4-S | 0 | 0 | 2 | 3 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R4-G | 0 | 1 | 2 | 3 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R4-L | 0 | 0 | 1 | 3 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R4-K | 0 | 1 | 5 | 2 |
| Analog first | [analog-first.md](analog-first.md) | R4-A | 0 | 1 | 4 | 3 |
| Mobile-UI (allgemein) | [mobile-ui.md](mobile-ui.md) | R4-M | 0 | 2 | 3 | 2 |
| Summe | | | 0 | 12 | 30 | 29 |

## Berichtsübergreifende Reihenfolge

1. Rückfragen und Rückwege (R4-G1, R4-S1, R4-M5, R4-E1, R4-E2, R4-W3, R4-N2,
   R4-S4). Rückfragen nehmen einen zweiten Tipp nach 450 ms an, „Abrücken"
   ist 1,5 s gesperrt; die Zurück-Geste schließt keine Rückfrage, sondern
   wechselt die Ansicht dahinter. „Ist das dieselbe Einheit?" schlägt bei
   Ulm/Neu-Ulm „Ja" vor. Ein Kaltstart-Link am Meldekopf macht den fremden
   Bogen zum eigenen Entwurf (Nebenwirkung der R3-D2-Behebung).
2. Welche Fassung gilt (R4-W1): allein der Zeitstempel im Bogen. Ein
   älterer echter Bogen nach einer Schnellerfassung landet still in der
   Historie.
3. Exportstand und Nachtrag (R4-W2, R4-K1, R4-W4): ein Merker für alle
   Empfänger; ein Abrücken zählt nicht als neu; Nachtrag-Dateien sind nicht
   als Teilmenge gekennzeichnet.
4. Geräteuhr (R4-D1): Geht die Uhr ein Jahr vor, löscht die Aufräumfrist
   beim Start eine laufende Sammlung.
5. 200 % Schrift und Feld-Modus (R4-M1, R4-M2, R4-G2, R4-M3): Einsatzansicht
   breiter als das Gerät, Fußleiste mit „◐" läuft über; R2-M1 ist teilweise
   wieder offen.
6. Papier-Rückweg (R4-A1, R4-A2): nach Einlesen aus Bildern andere „Nr." als
   auf dem Lageblatt, Auftrag/Notiz fehlt im Papier-Abgleich.
7. Offline-Erstladen (R4-O1): bricht das Netz während der Installation ab,
   lädt danach nichts mehr, die Zeile sagt weiter „wird geladen".

## Wie die Behebungen aus Runde 3 halten

Beide P0 aus Runde 3 halten (R3-S1, R3-W1), ebenso die große Mehrzahl der
übrigen. Teilweise wirken R3-K5 (Import-Quittung außer Sicht), R3-N5
(Tooltips an den Sammlungskarten), R3-A5 (Nachtragszeilen), R3-E2 (zweimal
derselbe Link), R3-W2 (Weitergabe-Vermerk), R3-L6 (Stelle bei „◐") und
R3-S3 (zwei Fenster). Nebenwirkungen: R3-K7 kürzt Rückfragen auf 30
Zeichen (R4-K3), R3-K1 meldet nur „Sonstiges geändert" (R4-K4), R3-L6
bringt „◐" an die Stelle von „Weiter →" (R4-G2, R4-M3), R3-S4 legt die
Leiste über die Vorschläge bei offener Tastatur (R4-G3), R3-D2 öffnet beim
Kaltstart ohne Rückfrage (R4-W3). R4-L1 und R4-L2 sind älter; sie fielen
erst auf, weil diesmal auch Bögen anderer Organisationen geprüft wurden.

## Prüfaufbau

Wie in Runde 3. Neu: drosselnder Reverse-Proxy für echtes Offline (CDP-
Drosselung und `setOffline` erfassen den Service Worker nicht),
`page.clock` für die Geräteuhr, Bögen von DRK, DLRG, Feuerwehr und anderen
Organisationen. Nicht prüfbar wie bisher: Kamera, Handscanner, echte
Handschuhe und echtes Licht, Bildschirmtastatur (nur nachgestellt),
WebKit/Safari, native Builds.

## Stand der Behebung

Stand 06.10.2026. Alle 71 Befunde wurden auf demselben Zweig in fünf Paketen
bearbeitet, jedes mit Typprüfung, Unit-Tests, Verhaltensszenarien und
Nachmessung im Browser. Einzelheiten stehen im Abschnitt „Stand der
Behebung" jedes Berichts. Gesamtprüfung vor dem Zusammenführen: Typprüfung
ohne Fehler, 2 644 Unit-Tests, 137 von 137 Verhaltensszenarien, Produktions-
build ohne Fehler.

| Paket | Inhalt | Befunde |
| --- | --- | --- |
| 1 | Rückfragen, Links, Rückholplatz, Zurück-Geste | R4-G1, S1–S4, M5, W3, E1, E2, N1, N2, D2 |
| 2 | Meldungsfassungen, Exportstand, Führungssicht | R4-W1, W2, W4–W8, K1–K8, A1, A2, E6 |
| 3 | Layout, 200 % Schrift, Touch, Sicht | R4-M1–M4, M6, M7, G2–G6, L1–L4, H2, H3, N3 |
| 4 | Uhr, Speicher, Löschen, Offline, Zeiten | R4-D1, D3–D5, E3–E5, E7, O1, O2, S5, H1, H4, H5 |
| 5 | Papier, Vordruck, Begriffe | R4-A3–A8, N4–N6 |

Mit Grenze oder nur teilweise gelöst:

- R4-W1: Der Vorrang einer Fassung gilt nur in der App (`src/app/fassung-vorrang.ts`);
  der Kern in `vendor/bos-meldekopf` und der Kiosk-Stapel kennen ihn nicht
  (Arc42 11.3).
- R4-A1: Die QR-Codes tragen keine laufende Nummer, sie wird im
  Papier-Abgleich von Hand übernommen.
- R4-K5: Am Telefon liegt die erste Karte bei 1,96 Bildschirmen (6 Einheiten,
  360 × 640), bei 320 × 568 und mehreren Zügen darüber.
- R4-D1: Ein Sprung der Geräteuhr unter 60 Tagen wird nicht erkannt.
- R4-S4, R4-S5, R4-H4, R4-H2, R4-M7: teilweise; die Begründungen stehen in
  den Berichten.
- R4-O: Die Prüfung „Offline und Speicher" blieb unvollständig; der Bericht
  hat nur zwei Befunde.
