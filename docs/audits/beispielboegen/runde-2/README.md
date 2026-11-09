# Rollenaudits, Schwerpunkt Beispielbögen, Runde 2 (Stand 09.11.2026)

Zweite Prüfrunde nach der Behebung der 21 Sachverhalte aus [Runde 1](../README.md). Zwölf Prüfberichte
(elf THW-Rollen und Mobile-UI), geprüft auf der Live-Seite https://erfassungsbogen.app/ (Fußzeile
`v2026.1109.833`, Stand `main` Commit `085a93b`). Jeder Prüfer hat seine Befunde aus Runde 1 im Browser
nachgeprüft und neu gesucht. Reine Prüfberichte ohne Codeänderung. Befund-IDs `BB2-<Rolle><Nr.>`.

| Bericht | P0 | P1 | P2 | P3 | Hinweise |
| --- | --- | --- | --- | --- | --- |
| [Neuer Nutzer](neuer-nutzer.md) | 0 | 0 | 1 | 5 | 6 |
| [Feldtauglichkeit](feldtauglichkeit.md) | 0 | 0 | 3 | 6 | 6 |
| [Arbeitsablauf](arbeitsablauf.md) | 0 | 0 | 2 | 3 | 7 |
| [Fehler und Wiederanlauf](fehler-und-wiederanlauf.md) | 0 | 0 | 3 | 3 | 4 |
| [Zerstörende Handlungen](zerstoerende-handlungen.md) | 0 | 0 | 3 | 1 | 5 |
| [Offline und Speicher](offline-und-speicher.md) | 0 | 1 | 0 | 2 | 4 |
| [Stress und Unterbrechung](stress-und-unterbrechung.md) | 0 | 2 | 4 | 3 | 4 |
| [Handschuh-Bedienung](handschuh-bedienung.md) | 0 | 2 | 1 | 4 | 3 |
| [Nacht und Sicht](nacht-und-sicht.md) | 0 | 0 | 0 | 4 | 2 |
| [Führungssicht](fuehrungssicht.md) | 0 | 1 | 1 | 2 | 5 |
| [Analog-first](analog-first.md) | 0 | 0 | 1 | 4 | 3 |
| [Mobile-UI](mobile-ui.md) | 0 | 1 | 3 | 2 | 3 |
| Summe der Berichte (mit Doppelungen) | 0 | 7 | 22 | 39 | 52 |

## Nachprüfung der 21 Sachverhalte aus Runde 1

| Nr. | Sachverhalt (Runde 1) | Stand |
| --- | --- | --- |
| 1 | Unverändertes Beispiel verdrängt den eigenen Entwurf | teilweise: in der Sitzung behoben, nach Neuladen oder Link in neuem Tab wieder da (Nr. 6 unten) |
| 2 | OV-Bögen offline, „komplett offline" | teilweise: Texte ehrlich, eigener Cache verdrängt nichts mehr (3 529 OV-Bögen geprüft); offen siehe Nr. 12 |
| 3 | Kein Sammelweg | teilweise: ganzer Ordner mit einem Tipp; keine Auswahl einzelner Bögen, nicht für RSt/LV und Suchergebnisse |
| 4 | Register bei großer Schrift | behoben |
| 5 | Schließen bricht Laden nicht ab | teilweise: „Schließen" bricht ab, Escape/Zurück nicht (Nr. 8) |
| 6 | Hannover-Einlage | behoben (23 Einheiten, 252 Helfer); dasselbe Muster jetzt bei OVs mit zwei TZ (Nr. 5 unten) |
| 7 | Ordnerpfad geht verloren | behoben (gemerkter Ordner); Rückweg aus Bogen und Sammlung fehlt weiter |
| 8 | Scrollposition, Fokus, Pfadleiste | teilweise: nach oben und Fokus behoben; Pfadleiste jetzt zu hoch (Nr. 3 unten) |
| 9 | Tabelle zwischen 545 und 900 px | behoben (Karten am Tablet und quer) |
| 10 | Keine Suche | teilweise: Suche da, findet aber keine Einheiten (Nr. 4 unten) |
| 11 | Inhalte springen beim Nachladen | teilweise: Karten 3–4 px; OV-Platzhalter erscheint nie, Sprung 135–162 px (Nr. 11 unten) |
| 12 | Übungskennzeichnung nach Übernahme | teilweise: Marken, Rückfrage und Namensprüfung da; Link-Empfang ohne Namensprüfung (Nr. 10 unten) |
| 13 | Cache-Verdrängung | behoben |
| 14 | Taktische Zeichen dunkel | behoben |
| 15 | Link-Empfang beim Teilnehmer | behoben („Bogen übergeben…" vorn); drei QR-Teile (Nr. 10 unten) |
| 16 | Beispieldaten veraltet | teilweise: am Tag der Erzeugung keine Zeitwarnungen; Datum beim Erzeugen gesetzt (Nr. 7 unten); Vorbelegungshinweise bleiben |
| 17 | Bezeichnungen | teilweise: Ländernamen behoben; neue Doppelwörter, Hessen (Nr. 15 unten) |
| 18 | Meldekopf-Kasten | teilweise wie dokumentiert |
| 19 | Ladefehler ohne Netz | teilweise: über der Liste, „Erneut laden"; bleibt teils stehen, dreifach |
| 20 | Rückmeldungen und Papier | teilweise: Wasserzeichen und Fußzeile behoben; Quittung außer Sicht, Dateinamen zu lang |
| 21 | Startseite und Dialoglage | teilweise: feste Höhe behoben; Doppeltipp-Sperre nur im Register (Nr. 2 unten) |

## Neue Sachverhalte ohne Doppelungen

| Nr. | Sachverhalt | Höchste Prio. | Befunde |
| --- | --- | --- | --- |
| 1 | Ohne Netz vor fertigem Vorrat lädt der ausgelagerte Dialog nicht; die Fehlerseite ersetzt die ganze App (Folge der Auslagerung, `lazy` ohne Fehlerfang) | P1 | BB2-O1, BB2-E3, BB2-N2 |
| 2 | Doppeltipp auf ein Register trifft „Alle … in eine Übungs-Sammlung" und legt ohne Rückfrage eine Sammlung an; jeder Tipp legt eine weitere gleichnamige an; der Knopf steht vor den Bögen | P1 | BB2-G2, BB2-E2, BB2-H3, BB2-D4, BB2-W3, BB2-N4 |
| 3 | Klebende Pfadleiste ohne Höhengrenze: bei 200 % 97 % des Dialogs, quer keine Verkürzung (hängt an `@media`), keine sichtbare Unterkante, verdeckt Kartenköpfe | P1 | BB2-M1, BB2-G1, BB2-M2, BB2-H1, BB2-S4, BB2-L3, BB2-N5, BB2-M3, BB2-H9 |
| 4 | Suche nur über Ordner- und Dateinamen: keine Einheitstypen („Bergungsgruppe" 0), Wortteile („Bad" trifft „Baden"), OV fehlt als Ordnertreffer, lange Pfade je Treffer, kein Hinweis bei 0, Rückweg zur Trefferliste fehlt | P1 | BB2-S1, BB2-S2, BB2-K2, BB2-N1, BB2-H2, BB2-W5, BB2-M4, BB2-S9, BB2-N6, BB2-S7, BB2-H5, BB2-H4 |
| 5 | OV mit zwei Technischen Zügen: Einheiten des 2. TZ überschreiben die des 1. in der Sammlung (Landshut 11 → 9 Einheiten); 45 OV-Ordner betroffen | P1 | BB2-K1 |
| 6 | Beispiel-Erkennung nur im Arbeitsspeicher: nach Neuladen wieder „alten Bogen endgültig löschen"; „Bogen schließen" in der Übersicht warnt fälschlich vor Verlust | P2 | BB2-D2, BB2-D1 (dazu BB-W1, BB-N1, BB-H1, BB-E2 Rest) |
| 7 | Datum und Stand werden beim Erzeugen gesetzt: Tage später wieder „Stand vor 5 Tagen"; PDF und Sammelweg ergeben „älterer Stand" bei gleichem Inhalt | P2 | BB2-A1 (dazu BB-W5 Rest) |
| 8 | Escape/Zurück mitten im Laden geht eine Ebene hoch statt abzubrechen; wiederholtes Escape schließt den Dialog (Chromium lässt `cancel` nur einmal je Aktivierung abbrechen) | P2 | BB2-E1, BB2-E5, BB2-S3, BB2-G6 |
| 9 | Übungs-Sammlung: Name ist der ganze Pfad (bis 161 Zeichen), alle Einheiten „eingetroffen" zur selben Minute und „von Hand erfasst", Zug kommt nicht an | P2 | BB2-W1, BB2-K4, BB2-K3, BB2-A4, BB2-H8, BB2-N3 (dazu BB-K7 Rest) |
| 10 | Link-Empfang: drei QR-Teile statt einem; empfangenes Beispiel ohne Namensprüfung beim Abwählen von „Übung" | P2 | BB2-W2, BB2-D3 |
| 11 | Platzhalter für den OV-Ordner erscheint nie (hängt an `beispielOrdner.length > 0`); der Ordner springt später herein | P2 | BB2-L4, BB2-G3, BB2-O3 |
| 12 | OV-Bögen beim Erstbesuch teils nicht im Cache (3 von 9); OV-Baustein lädt nach einmaligem Fehlschlag erst nach Neuladen | P2 | BB2-S6, BB2-O2 |
| 13 | Quittung nach „PDF" steht über der Liste außer Sicht und verschwindet nach 6 s; Fokus auf `<body>` | P2 | BB2-S5, BB2-L2 (dazu BB-A6, BB-H9 Rest) |
| 14 | Nachgeladener Dialog ohne Rückmeldung beim ersten Tipp (bis 6 s), legt sich über ein anderes offenes Fenster | P3 | BB2-M5, BB2-E4, BB2-O3 |
| 15 | PDF: Dateiname 103–162 Zeichen mit doppeltem OV; QR-Code bei zweiseitigen Bögen nur auf Blatt 2 ohne Hinweis | P3 | BB2-S8, BB2-H7, BB2-A5 |
| 16 | Daten: neue Doppelwörter („Landeskommando Landeskommando", „Panzerpionierzug Panzerpionierzug"), Platzhalter-Kennzeichen „doppelt", verschiedene Übungslagen je Zug, verdeckte Originalfehler, Nur-Stärke-Text | P3 | BB2-W4, BB2-A2, BB2-A3 (dazu BB-K5, BB-N5, BB-W9 Rest) |
| 17 | Kleinere: Ladefehler-Zeile in Hinweisfarbe, Fokus nach Rückweg auf „ASB", THW-Zahl bricht als einzige um, Löschen-Kreuz 24 px, „…" kein Ziel, 10 px Knopfabstand senkrecht, leerer gemerkter Ordner | P3 | BB2-L1, BB2-M6, BB2-G4, BB2-G5, BB2-G7, BB2-E6 |

## Vorschlag für die Reihenfolge

Zuerst die Folgen der Umbauten aus Runde 1, weil sie neu sind und teils Datenverlust oder Fehlbedienung
bewirken: Nr. 1 (Fehlerfang um den nachgeladenen Dialog), Nr. 2 (Sammelweg mit Rückfrage und Sperre, keine
Doppel-Sammlungen), Nr. 3 (Pfadleiste deckeln und an der Dialoghöhe verkürzen), Nr. 11 (Platzhalter). Danach
Nr. 4 (Suche über Einheitstyp und Ort aus einem kleinen Index), Nr. 5 (Generator der OV-Bögen: TZ im Namen),
Nr. 6 (Beispiel-Stand mit dem Entwurf speichern), Nr. 7 (Stand je Tag statt je Erzeugung).

## Stand der Behebung

Noch offen (09.11.2026).
