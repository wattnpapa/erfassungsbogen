# Rollenaudits, Runde 3 (Stand 05.10.2026)

Dritte Prüfrunde nach der Behebung der Befunde aus [Runde 2](../runde-2/README.md).
Elf Prüfberichte, je einer pro THW-Rolle, alle gegen den Produktionsbuild
(`vite build` + `vite preview`, Port 4173), Code-Stand Commit `33ed426`,
Zweig `claude/gifted-cray-ngieaz`. Jeder Prüfer hat zuerst ohne Kenntnis der
bisherigen Berichte getestet und danach im Abschnitt „Abgleich mit Runde 2"
festgehalten, welche Behebungen halten. Befunde, die ein Prüfer aus einem
anderen Runde-3-Bericht unabhängig nachgestellt hat, stehen dort nur als
Verweis und sind unten nicht doppelt gezählt. Der allgemeine Mobile-UI-Prüfer
aus Runde 2 lief diesmal nicht mit.

| Rolle | Bericht | Kennung | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- | --- |
| Helfer ohne Einweisung | [neuer-nutzer.md](neuer-nutzer.md) | R3-N | 0 | 1 | 2 | 3 |
| Helfer im Feld | [feldtauglichkeit.md](feldtauglichkeit.md) | R3-H | 0 | 1 | 5 | 1 |
| Arbeitsablauf über mehrere Geräte | [arbeitsablauf.md](arbeitsablauf.md) | R3-W | 1 | 0 | 2 | 0 |
| Fehler und Wiederanlauf | [fehler-und-wiederanlauf.md](fehler-und-wiederanlauf.md) | R3-E | 0 | 2 | 3 | 2 |
| Zerstörende Handlungen | [zerstoerende-handlungen.md](zerstoerende-handlungen.md) | R3-D | 0 | 1 | 2 | 1 |
| Offline und Speicher | [offline-und-speicher.md](offline-und-speicher.md) | R3-O | 0 | 2 | 1 | 1 |
| Stress und Unterbrechung | [stress-und-unterbrechung.md](stress-und-unterbrechung.md) | R3-S | 1 | 1 | 4 | 1 |
| Handschuh-Bedienung | [handschuh-bedienung.md](handschuh-bedienung.md) | R3-G | 0 | 0 | 3 | 1 |
| Nacht und Sicht | [nacht-und-sicht.md](nacht-und-sicht.md) | R3-L | 0 | 0 | 2 | 5 |
| Führungssicht | [fuehrungssicht.md](fuehrungssicht.md) | R3-K | 0 | 1 | 3 | 3 |
| Analog first | [analog-first.md](analog-first.md) | R3-A | 0 | 2 | 3 | 2 |
| Summe | | | 2 | 11 | 30 | 20 |

## Berichtsübergreifende Reihenfolge

1. Der eigene Bogen geht auf weiteren Wegen verloren (R3-S1, R3-D1, R3-D2,
   R3-E2, R3-S2, R3-S3). Ein Bogen-Link bei offener App ersetzte den Bogen
   ohne Rückfrage (P0), weil der `hashchange`-Horcher den Stand vom Start
   sah. Dazu kamen Vorlagen-Bearbeitung mit „Verwerfen", Kaltstart über
   Link, eine unbrauchbare Datei bei „Aus Datei laden…" und ein zweites
   Fenster. Die Behebung von R2-N1 hielt für die Schnellerfassung, nicht für
   diese Wege.
2. Rückimport zwischen zwei Meldekopf-Geräten verwarf Abrücken, Zug und
   Auftrag bekannter Meldungen (R3-W1, P0). `einsatzImportieren` im Kern
   gleicht nur über die Eintrags-ID ab.
3. Leere oder Stärke-0-Erfassungen gingen ohne Rückfrage in die Lage
   (R3-N1, R3-E3, R3-G3), und eine Unterbrechung wurde zur Eintreffzeit
   (R3-S6).
4. Quittungen außerhalb des Bilds und Doppeltipps nach Ablauf der
   600-ms-Sperre (R3-L1, R3-E4, R3-S5, R3-G1, R3-G2, R3-D3, R3-H1). Die
   Behebungen R2-H4 und R2-G1 deckten nur einen Teil der Stellen ab.
5. Voller oder gesperrter Speicher (R3-O1, R3-O2, R3-E1). Jedes Lesen
   schrieb die ganze Einsatzliste zurück (13 s Start bei 4,9 Mio. Zeichen),
   ein scheiterndes Zurückschreiben ließ die Ansicht leer.
6. Führungssicht auf Folgemeldungen und Bedarf (R3-K1 bis R3-K4):
   Folgemeldungen waren nicht als neu erkennbar, die Unterbringungszahl
   zählte alle Anwesenden.
7. Papier-Rückweg (R3-A1 bis R3-A5): Stärke-Nachtrag ersetzte die ganze
   Meldung, die Sammel-PDF hatte fast leere Seiten, der ausgelieferte
   Blanko-Vordruck war veraltet.
8. QR-Übergabe (R3-H2, R3-H3): „Übergeben" schon nach 0,3 s Anzeige von
   Teil 1 von 2.

## Wie die Behebungen aus Runde 2 halten

Die Mehrzahl hält: der P0 R2-N1 für die Schnellerfassung, R2-K1 (Zug,
Auftrag und Eintreffzeit überstehen die Folgemeldung), R2-L1 (36 von 36
Begleitseiten ohne Text unter 4,5:1), R2-D1 bis R2-D6, R2-O1 und R2-O3 bis
R2-O7, R2-E1 bis R2-E3, R2-W1 und R2-W4. Nebenwirkungen hatten R2-K7
(Kompaktzeile verschweigt Merkmale, R3-K2), R2-M2 (klebende Knopfleiste im
QR-Vollbild, R3-H2), R2-A1 (Kasten sprengt QR-Seiten, R3-A3), R2-H4
(Quittungsleiste fängt den zweiten Tipp, R3-G2) und R2-A6 (Legende nur im
Generator, R3-A4). Einzelheiten im Abschnitt „Abgleich mit Runde 2" des
jeweiligen Berichts.

## Prüfaufbau

Wie in Runde 2: Playwright mit Chromium aus `/opt/pw-browsers/chromium`,
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 als Grundeinstellung,
je nach Rolle 640 × 360, 320 × 568, Tablet 820 × 1180 und Laptop
1366 × 768, mehrere Browser-Kontexte als getrennte Geräte, `setOffline`,
gedrosseltes Netz und CPU, Quota-Stubs. Exporte heruntergeladen und
gegengelesen. Nicht prüfbar: Kamera- und Handscanner, Nahbereichs-
Weitergabe, echte Handschuhe und echtes Licht, Bildschirmtastatur, echtes
Drucken, native Builds.

## Stand der Behebung

Stand 05.10.2026. Alle 63 Befunde wurden auf demselben Zweig in sieben
Paketen bearbeitet, jedes mit Typprüfung, Unit-Tests und Nachmessung im
Browser (Dev-Server bzw. Produktionsbuild, Viewports wie oben). Die
Einzelheiten stehen im Abschnitt „Stand der Behebung" jedes Berichts.

| Stand | Anzahl | Befunde |
| --- | --- | --- |
| behoben | 56 | alle übrigen, darunter beide P0 und alle P1 außer R3-A2 |
| weitgehend | 6 | R3-K6, R3-H6, R3-H7, R3-L4, R3-A6, R3-A7 |
| teilweise | 1 | R3-A2 |

Was offen bleibt:

- R3-A2: Die Lage vom Papier (Eintreff- und Abrückzeiten) muss nach dem
  Einlesen weiter von Hand übertragen werden. „Lage vom Papier
  abgleichen…" fasst das in einen Schritt, ein Code für die Lage selbst
  bräuchte ein neues Transportformat.
- R3-K6: Tabellenschrift des Lageblatts bleibt 7,5 pt, weil 8 pt zehn
  Einheiten auf zwei Seiten schiebt.
- R3-H6: Karten im Personalschritt sind nicht standardmäßig zugeklappt.
- R3-H7: Weiße QR-Platte im Nacht-Modus bleibt (Scannbarkeit).
- R3-L4: Eine dunkle Fassung der Anleitungsbilder fehlt.
- R3-A6, R3-A7: Freie Zeilen im Einzel-PDF nur, wo sie keine Seite kosten;
  Reihenfolge Personal/Fahrzeuge im Assistenten anders als im Vordruck.

Zwei Ursachen liegen im Submodul `vendor/bos-meldekopf` und sind in der App
umgangen statt dort behoben: der Abgleich beim Import (R3-W1,
`src/app/einsatz-abgleich.ts`) und das Zurückschreiben beim Lesen (R3-O2,
`src/app/speicher-schonend.ts`). Abrücken braucht bei sehr großen
Sammlungen deshalb noch 1,7 bis 2,4 s (CPU 4× gedrosselt), weil der Kern
bei jeder Änderung die ganze Liste parst und schreibt.
