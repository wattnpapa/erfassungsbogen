# Runde 13 – Helfer ohne Einweisung

- Prüfer: Rolle „Helfer ohne Einweisung“ (thw-new-user-reviewer)
- Datum: 2026-10-26
- Zählung: P0 0 · P1 0 · P2 0 · P3 2
- Prüfaufbau: Produktionsbuild auf http://localhost:4173 (Code-Stand Commit 7637e61, `main` nach Runde 12), Playwright/Chromium über das globale Modul (die Projektkopie fand keinen passenden Browser), Telefon 390×844 und 360×640, Touch, de-DE. Übungsbögen aus `examples/thw/` mit `uebung: false` und heutigem Zeitraum über „Bögen einlesen…“ eingespielt. Kamera, Handschuhe, Bildschirmtastatur, native Builds nicht prüfbar. Die bekannten Grenzen aus `docs/audits/README.md` sowie Runde 10 bis 12 wurden nicht neu gemeldet.

## Urteil

Ein Helfer ohne Einweisung kommt ohne fremde Hilfe zum Ziel. Geprüft wurden Startseite, Assistent Schritt 1 bis 6 (Einheitstyp-Suche, Ortsverzeichnis, Organisationswechsel, Namen einfügen, Fahrzeuge, Kennzeichen), Übersicht, Datensicherung, Übungsbögen, Geräteschlüssel, „Alle Daten löschen“, Anlegen einer Einsatz-Sammlung und Einlesen von vier Bögen, Lagemonitor-Abschnitt sowie die Anleitung. Die Rückfragen sind verständlich; bei 360 px trat in keinem geprüften Dialog horizontaler Überlauf auf. Neue Befunde gibt es nur auf Stufe P3: ein falscher Verweis in der Anleitung und zwei Knöpfe mit gleicher Wirkung und verschiedener Beschriftung.

## Befunde

### R13-N1 (P3) – Anleitung verweist für die Eintreffzeit auf Schritt 1

- Ort: `anleitung.html`, Abschnitt „Bogen erstellen“, Absatz „Einsatz benennen“; gegenüber Assistent Schritt 1 und 2.
- Beobachtung: Der Absatz endet mit „Die Eintreffzeit deiner Einheit trägst du in Schritt 1 ein; der Meldekopf führt seine Eintreffzeiten getrennt.“ Schritt 1 („Einheit“) enthält kein Zeitfeld (Organisation, Einheitstyp, Zugehörigkeit). Die Kästchen „Einsatzbeginn eintragen“ und „Einsatzende eintragen“ stehen in Schritt 2 („Einsatz“), und das Wort „Eintreffzeit“ kommt in der App nicht vor. Die übrigen Stellen aus R12-N1 (Signatur, „PDF erzeugen“, Meldekopf-Feld) sind angeglichen und halten.
- Erwartung der Rolle: Wer der Anleitung folgt, findet das genannte Feld im genannten Schritt unter dem genannten Namen.
- Folge: Der Helfer sucht in Schritt 1 vergeblich nach einer Eintreffzeit, zweifelt, ob er ein Feld übersehen hat, und findet „Einsatzbeginn eintragen“ in Schritt 2 nur durch Suchen, weil der Name abweicht.
- Empfehlung: „Schritt 2“ nennen und die App-Bezeichnung („Einsatzbeginn eintragen“) verwenden.
- Nachprüfung: Anleitung gegen den Assistenten lesen; Schrittnummer und Feldname stimmen.

### R13-N2 (P3) – Schritt 3: zwei Knöpfe mit gleicher Wirkung und verschiedener Beschriftung

- Ort: Schritt 3 „Personal“, Knopf oben „9 leere Plätze entfernen“ und Knopf unten „Vorbelegung entfernen (9 Personen ohne Namen)“.
- Beobachtung: Beide Knöpfe wurden einzeln auf einem frischen Bogen betätigt; beide ergeben dasselbe: Meldung „Vorbelegung entfernt: 9 Personen — Stärke 9 → 0. Rückgängig“, Stärke 0 / 0 / 0 / 0. Die Warnung darüber nennt dagegen „7 Personenkarten ohne Angaben“, der Knopf „9 leere Plätze“; die Wörter Plätze, Personenkarten, Personen und Vorbelegung bezeichnen dieselbe Sache.
- Erwartung der Rolle: „Leere Plätze entfernen“ löscht nur die unausgefüllten Karten, „Vorbelegung entfernen“ etwas anderes (etwa auch ausgefüllte Vorbelegung).
- Folge: Gering. Der Helfer zögert vor dem Antippen, ob eine bereits ausgefüllte Karte mitgeht. Nach Antippen steht Rückgängig bereit, ein Datenverlust entsteht nicht.
- Empfehlung: Einen Knopf behalten oder beide gleich beschriften und in der Beschriftung dieselbe Zahl und dasselbe Wort wie in der Warnung verwenden.
- Nachprüfung: Schritt 3 mit Sollplätzen öffnen; Knopf und Warnung nennen dieselbe Zahl und dasselbe Wort, es gibt nur einen Weg.

## Halten die Behebungen aus Runde 12? (nachgeprüft)

- R12-N2 Organisationswechsel: Die Zeile nennt nach THW → Feuerwehr → DRK → Sonstige die letzte Wahl („Sonstige“) und „Rückgängig stellt „THW“ wieder her“ (bei 390 und 360 px). Hält. Beim ersten Wechsel fehlt der Satz zum Ziel von „Rückgängig“ (nur Hinweis, ohne Folge).
- R12-N3 Schritt 4: Fahrzeugtyp 288 bzw. 258 px, „Sitzplätze“ zeigt „9 (Richtw.)“ ohne Abschneiden. Hält; nur die Auswahlliste „Anh Plane/Spriegel – Anhänger Plane/Spriegel“ wird im Feld gekürzt (Anfang lesbar).
- R12-N4: Knopf heißt „Regionalbereich und Landesverband anlegen“. Hält.
- R12-N5 Lagemonitor: Satz zu „Jetzt“ und „Beginn entfernen“ vorhanden. Hält.
- R12-N6 „Namen einfügen“: Ansicht „Alle Angaben (Karten)“ bleibt, Meldung „3 Namen übernommen — 3 davon in freie Sollplätze. Rückgängig“. Hält.
- R12-N7 Kennzeichen: „thw 80101“ wird zu „THW-80101“ (auch in der Übersicht). Hält.
- R12-N1 Anleitung: drei von vier Stellen angeglichen; die Stelle zur Eintreffzeit ist neu als R13-N1 gemeldet.
- Einlesen von vier Bögen: Zusammenfassung „4 Bögen aufgenommen“ mit „Neu seit der letzten Kenntnisnahme“ und Hinweis „Anderer Einsatz?“ bei abweichendem Auftrag. Hält.

## Bestätigt (keine Befunde)

- Dialoge „Datensicherung“, „Übungsbögen“, „Geräteschlüssel neu erzeugen“, „Alle Daten löschen“: Folge, Umfang und Ausweg sind benannt; „Alle Daten löschen“ zählt die betroffenen Daten auf und bietet vorher die Sicherung an.
- Schritt 1 ergänzt aus dem Ortsverzeichnis Kürzel, Telefon, E-Mail und übergeordnete Ebenen mit „Rückgängig“.

Aufgabe geschafft: ja
Fremde Hilfe nötig: nein
Größtes Missverständnis: Die Anleitung schickt zur Eintreffzeit in Schritt 1, die App hat dort kein Zeitfeld (R13-N1).
Größtes Einsatzrisiko: Keines oberhalb von P3 belegt.
Top-Priorität für die nächste Iteration: Verweis in der Anleitung auf Schritt 2 und „Einsatzbeginn eintragen“ korrigieren (R13-N1).
