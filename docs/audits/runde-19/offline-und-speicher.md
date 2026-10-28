# Audit Runde 19 – Offline und Speicher

Prüfer: Rollenaudit `thw-offline-resilience-reviewer` · Datum: 2026-10-28 · Zählung: P0 0 · P1 1 · P2 4 · P3 5

Reiner Prüfbericht, keine Codeänderung. Gegen die laufende App auf Port 4173 (Produktionsbuild, Code-Stand `0ac0d7f`, `main`),
Playwright mit Chromium, Telefon 390 × 844, 360 × 640 und 320 × 568, `isMobile`/`hasTouch`, Locale de-DE, je Lauf ein eigener
Browser-Kontext. Netz weg über `context.setOffline`, gesperrter Speicher über einen Init-Script-Stub (`localStorage` wirft
`SecurityError`), voller Speicher durch Auffüllen von `localStorage` bis zum echten Quota-Fehler, zwei Tabs im selben Kontext.
Beispielbögen aus `examples/thw`, alle über die Oberfläche (Dateiauswahl „Bögen einlesen…“).

Nach dem Auftrag gelten keine „bekannten Grenzen“ mehr als ausgenommen. Gemeldet ist alles, was im Browser noch zu beobachten war.

## Urteil

Bei Funkloch, Neuladen und Parallelzugriff trägt die App. Bei vollem Gerätespeicher bleibt eine Lücke: Mehrere Aktionen
quittieren Erfolg oder schweigen, obwohl nichts oder nur ein Teil gespeichert wurde. Der gewichtigste Fall ist „Meldung
entfernen“: Die Quittung verspricht 7 Tage Papierkorb, die Meldung ist nach dem Neuladen aber endgültig weg. Die Aufgabe
„Einsatz führen, Bögen einlesen, Netz weg, neu laden, Lageblatt/Sammel-PDF/Sicherung erzeugen, Übergabe vermerken“ gelingt ohne
fremde Hilfe, solange der Speicher nicht voll ist.

## Nachprüfung der Behebungen (halten, nicht gemeldet)

R18-O1 (Einsatz anlegen bei gesperrtem Speicher: Dialog „Sammlung nicht angelegt“ nennt den Grund am Tippziel); Einlesen bei
vollem Speicher („Nicht aufgenommen: 2 Bögen …“); Abrücken bei vollem Speicher („Speichern fehlgeschlagen“, Status bleibt);
Kenntnisnahme, Einsatzbeginn und Funkrufname bei vollem Speicher mit Fehlermeldung; Quittungsleiste und „Rückgängig“ offline;
Nummern bleiben nach „Entfernen“ (Nr. 1 bleibt frei, 2–4 bleiben, auch nach Neuladen); Papierkorb „Zuletzt entfernte Meldungen
(1) — 7 Tage zurückholbar“ überlebt Neuladen offline, Zurückholen/Endgültig löschen 44 px hoch; Übergabe und Abschluss
(Checkliste, „Übergabe vermerken“, „Einsatz als beendet markieren“, Hinweis auf offene Punkte) überleben Neuladen; Dateinamen
(`2026-10-28_0324_eeb-einsatz_Hochwasser_Test.pdf` usw.); Lageblatt, CSV, Excel offline; Sicherung offline erzeugt und
eingespielt (mit Vorschau „geht dabei verloren“); zwei Tabs im selben Gerät zeigen denselben Stand; Tabelle am Telefon; Scanner
ohne Kamera (nicht erneut vermessen).

## Befunde

### P1

#### R19-O1 – „Meldung entfernen“ bei vollem Speicher: Quittung verspricht Papierkorb, die Meldung ist nach dem Neuladen endgültig weg

- **Priorität:** P1
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** neu (die Papierkorb-Behebungen R18-E3/E4/H3/G1/D1 wurden ohne vollen Speicher geprüft; verwandt mit R17-O1/R18 „voller Speicher“, dort aber nur Einlesen, Abrücken, Entwurf)
- **Ort:** Einsatz → Karte aufklappen → „Mehr…“ → „Entfernen“ → „Meldung entfernen“, Gerätespeicher voll (`localStorage` bis zum Quota-Fehler gefüllt).
- **Beobachtung:** Die Bestätigung läuft ohne Fehler durch. Die Quittungsleiste sagt: „Entfernt: Meldung Nr. 1 „THW Albstadt Zugtrupp Technischer Zug“ (4 Personen). Nr. 1 bleibt frei. 7 Tage im Papierkorb unter der Liste.“ Der Warnkasten „⚠ Gerätespeicher ist voll …“ steht dabei 1 710 px über dem sichtbaren Bereich. Ein Abschnitt „Zuletzt entfernte Meldungen“ erscheint nicht. Nach Neuladen: Nr. 1 fehlt in `eeb.einsaetze.v1` (Länge 5781 → 3695), `eeb.entfernt.v1` enthält den Eintrag nicht, „Zuletzt entfernte Meldungen“ fehlt. Die Entfernung wurde gespeichert, der Papierkorb-Eintrag nicht.
- **Erwartung der Rolle:** Entweder das Entfernen scheitert mit Meldung (wie „Abrücken“: „Speichern fehlgeschlagen“), oder die Quittung sagt wahrheitsgemäß, dass die Meldung nur bis zum Neuladen zurückholbar ist.
- **Folge:** Ein Helfer entfernt eine Doppelmeldung oder eine falsch zugeordnete Meldung im Vertrauen auf die 7 Tage. Beim nächsten Neuladen oder Absturz ist die Meldung samt Historie unwiederbringlich weg. Das ist der einzige Weg im Test, auf dem die App eine Zusage macht und danach Daten verliert.
- **Empfehlung:** Das Entfernen nur ausführen, wenn der Papierkorb-Eintrag geschrieben werden konnte; sonst Fehlerdialog wie beim Abrücken. Hilfsweise die Quittung auf „nur bis zum Neuladen zurückholbar“ ändern und den Speicher-Hinweis an dieser Stelle zeigen.
- **Verifikation:** Speicher füllen, Meldung entfernen, neu laden: Meldung ist entweder noch da, oder die Quittung hat das Ergebnis richtig benannt.

### P2

#### R19-O2 – „Einsatz als beendet markieren“ und „Übergabe vermerken“ scheitern bei vollem Speicher ohne jede Rückmeldung

- **Priorität:** P2
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** neu (verwandt mit R18-O1: stilles Scheitern einer Schreibaktion bei Speicherproblemen)
- **Ort:** Einsatz → „Übergabe und Abschluss“, Speicher voll.
- **Beobachtung:** „Einsatz als beendet markieren“: kein Dialog, keine Quittung, kein neuer Text (DOM-Beobachtung 1,5 s ohne Änderung), Zustand bleibt „offen“. „Übergabe vermerken…“ → Name eintragen → „Vermerken“: der Dialog schließt sich, die Zeile bleibt „Übergabe noch nicht vermerkt“, keine Meldung. Andere Schreibaktionen (Kenntnisnahme, Beginn, Funkrufname, Abrücken) melden den Fehler.
- **Erwartung der Rolle:** Dieselbe Fehlermeldung wie beim Abrücken.
- **Folge:** Der Helfer glaubt, die Übergabe an „Stab Süd“ sei vermerkt, tippt erneut oder verlässt sich auf einen Abschluss, der nicht existiert. Beim nächsten Öffnen steht die Übergabe wieder auf „noch nicht“.
- **Empfehlung:** Beide Aktionen wie „Abrücken“ mit Fehlerdialog absichern.
- **Verifikation:** Speicher füllen, beide Aktionen ausführen: Meldung „nicht gespeichert“.

#### R19-O3 – „Einsatz löschen“ bei vollem Speicher quittiert „In den Papierkorb gelegt (30 Tage rückholbar)“, nach dem Neuladen steht der Einsatz wieder da

- **Priorität:** P2
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** neu (gleiche Ursache wie R19-O1 in der Gegenrichtung)
- **Ort:** Einsatz → „Einsatz verwalten“ → „Einsatz löschen…“ → „In den Papierkorb“, Speicher voll.
- **Beobachtung:** Quittung „In den Papierkorb gelegt (30 Tage rückholbar): Einsatz „Hochwasser Test““, die Startseite zeigt den Einsatz nicht mehr. Nach Neuladen steht er wieder in der Liste, `eeb.einsaetze.v1` unverändert, kein Papierkorb-Eintrag. Der Warnkasten steht am Seitenanfang, nicht an der Quittung.
- **Erwartung der Rolle:** Fehlermeldung am Tippziel oder ehrliche Quittung.
- **Folge:** Der Helfer räumt auf, um Platz zu schaffen (genau das rät die App), glaubt den Einsatz weg und sieht ihn nach dem Neuladen unverändert, der Speicher bleibt voll. Der Weg „Platz schaffen durch Löschen“ ist so nicht verlässlich.
- **Empfehlung:** Ergebnis des Schreibens prüfen und bei Misserfolg im Dialog melden; den Weg „endgültig löschen“ ohne Papierkorb-Zwischenschritt anbieten, wenn der Speicher voll ist.
- **Verifikation:** Speicher füllen, Einsatz löschen, neu laden: Zustand entspricht der Quittung.

#### R19-O4 – Exportdateien entstehen bei vollem Speicher, die Übergabe-Checkliste bleibt „noch nicht“ ohne Erklärung

- **Priorität:** P2
- **Kennzeichnung:** gemessen (Checkliste, Neuladen); Folge für „Nur neue Bögen“ plausibel, nicht gemessen
- **Neu oder alt (Verweis):** neu
- **Ort:** Einsatz → Sammel-PDF, Lageblatt, Übersicht als CSV, Excel-Liste; Speicher voll.
- **Beobachtung:** Jeder Export liefert die Datei samt Quittung (z. B. „✓ Lageblatt erzeugt (A4 quer) …“, „✓ Einsatz … als PDF gespeichert …“). „Übergabe und Abschluss“ zeigt weiter „○ … noch nicht“, direkt unter dem Knopf „Noch kein Lageblatt aus diesem Einsatz.“, auch nach Neuladen. Ein Hinweis, dass der Vermerk nicht gespeichert wurde, fehlt.
- **Erwartung der Rolle:** Entweder wird der Vermerk gesetzt, oder eine Zeile sagt „Vermerk konnte nicht gespeichert werden“.
- **Folge:** Der Helfer hat die Datei, die App behauptet „noch nicht“ und widerspricht der Quittung direkt darüber; beim Abschluss wirkt die Checkliste unglaubwürdig. „Nur neue Bögen seit dem letzten Export“ dürfte alle Bögen erneut zählen (nicht gemessen).
- **Empfehlung:** Bei gescheitertem Vermerk neben der Erfolgsquittung einen Zusatz „Vermerk nicht gespeichert (Speicher voll)“.
- **Verifikation:** Speicher füllen, Lageblatt erzeugen: Quittung und Checkliste sagen dasselbe.

#### R19-O5 – Schnellerfassung: „In Einsatz übernehmen“ ist bei 360 px abgeschnitten

- **Priorität:** P2
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** neu (verwandt mit R18-W7 an derselben Ansicht)
- **Ort:** Einsatz → „Einheit schnell erfassen (nur Stärke)…“, Fußleiste, 360 × 640.
- **Beobachtung:** Der Knopf ist 119 px breit, der Text 134 px (`white-space: nowrap`, `overflow: visible`); die weiße Schrift läuft über den dunklen Knopf hinaus und ist dort nicht lesbar: sichtbar „Einsatz übernehme“. Bei 390 px passt es (157 px), bei 320 px heißt der Knopf „Übernehmen“.
- **Erwartung der Rolle:** Die Hauptaktion ist vollständig lesbar.
- **Folge:** Beschriftung der Hauptaktion in der Zielgröße 360 × 640 unvollständig; kleiner Lesefehler, mit Handschuhen im Dunkeln eher relevant.
- **Empfehlung:** Kürzere Beschriftung oder Umbruch zulassen.
- **Verifikation:** 360 × 640: Beschriftung ganz im Knopf.

### P3

#### R19-O6 – Quittungsleiste nach „Entfernen“ 118 bis 119 px hoch (R18-A8)

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt (R18-A8: Höhe nach „Entfernen“ nicht neu gemessen)
- **Ort:** Einsatz, nach „Meldung entfernen“.
- **Beobachtung:** Die fixierte Leiste ist 119 px hoch bei 360 × 640 (19 % der Höhe) und 118 px bei 390 × 844; sie steht mindestens 6 s und deckt Knöpfe darunter (z. B. „Lageblatt (A4 quer)“) teilweise ab. „Abgerückt …“ ist 67 px hoch.
- **Folge:** Ein Fünftel des Bildschirms, bis der Helfer „✕“ tippt.
- **Empfehlung:** Text kürzen („Nr. 1 entfernt · 7 Tage im Papierkorb“), Leiste auf höchstens 80 px.
- **Verifikation:** Höhe bei 360 × 640 unter 13 %.

#### R19-O7 – Schnellerfassung: erstes Eingabefeld erst bei y ≈ 370 (R18-W7)

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt (R18-W7)
- **Ort:** „Einheit schnell erfassen (nur Stärke)…“, 390 × 844 und 360 × 640.
- **Beobachtung:** Kopf 140 px, darunter der Kasten „Angaben vom Zettel (optional)“ (y = 169, 44 px), dann „1. Einheit“; das erste Feld („Organisation“, Auswahl) beginnt bei y ≈ 370. Der Hilfetext verspricht „Ort hier, Stärke in Schritt 3“, das erste Feld ist aber die Organisation, nicht der Ort.
- **Folge:** Bei 640 px Höhe ist erst ein Drittel der Eingabe im Bild.
- **Empfehlung:** Zettel-Kasten ans Ende oder Ort/Stärke nach oben.
- **Verifikation:** erstes Feld unter y = 250 bei 360 × 640.

#### R19-O8 – Abstände zwischen Bedienelementen 4 bis 6 px (R18-G5)

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt (R18-G5)
- **Ort:** Einsatz, „Karten | Tabelle“ (Lücke 6 px) und Fußzeilen-Linklisten (kleinster vertikaler Abstand 4 px, horizontal 8 px; Höhe jeweils 44 px, 360 und 390 px). „4 ohne Auftrag“/„4 ohne Zug“ 10 px.
- **Folge:** Fehltreffer mit Handschuh zwischen Ansicht-Umschaltung und benachbarten Links.
- **Empfehlung:** mindestens 8 px.
- **Verifikation:** gemessene Lücken ab 8 px.

#### R19-O9 – Aufgeklappte Karte bei 320 × 568 in „Feld“ 907 px hoch (R18-M7)

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt (R18-M7)
- **Ort:** Einsatz, Ansicht „Feld“, 320 × 568, Karte aufgeklappt (Biberach, Ortung).
- **Beobachtung:** Karte 907 px hoch, das sind 1,6 Bildschirmhöhen; die Aktionen liegen weit unter dem Kopf der Karte.
- **Folge:** Beim Aufklappen verschwindet der Kartenkopf aus dem Bild.
- **Empfehlung:** Nebeninformationen einklappen.
- **Verifikation:** Karte höchstens 1,2 Bildschirmhöhen.

#### R19-O10 – Rückfrage „Stärke ändern“ füllt 94 % des Bildschirms bei 320 × 568 (R18-S4)

- **Priorität:** P3
- **Kennzeichnung:** gemessen
- **Neu oder alt (Verweis):** alt (R18-S4)
- **Ort:** Karte → „Mehr…“ → „Stärke ändern…“, 320 × 568, Ansicht „Feld“.
- **Beobachtung:** Dialog 536 von 568 px; Erklärtext vor den Feldern.
- **Folge:** Kaum Platz für die Bildschirmtastatur; Eingabe wird verdeckt.
- **Empfehlung:** Erklärtext kürzen oder einklappen.
- **Verifikation:** Dialog bei 320 × 568 unter 80 %.

## Nicht prüfbar

Echte Funkloch-Übergänge auf dem Telefon, Speicher-Räumung durch iOS, Hintergrund-Beenden, Kamera-Scan, native Builds, Ablauf der 7 und 30 Tage im Papierkorb.

## Abschluss

- **Aufgabe geschafft:** ja (bei nicht vollem Speicher); mit Umwegen bei vollem Speicher.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „7 Tage im Papierkorb“ gilt auch dann nicht, wenn der Speicher voll ist (R19-O1).
- **Größtes Einsatzrisiko:** Stiller Verlust einer entfernten Meldung bei vollem Speicher trotz Papierkorb-Quittung (R19-O1).
- **Top-Priorität für die nächste Iteration:** R19-O1 bis R19-O4: bei vollem Speicher jede Quittung an das tatsächliche Schreibergebnis binden.
