# Runde 12 – Helfer ohne Einweisung

- Prüfer: Rolle „Helfer ohne Einweisung“ (thw-new-user-reviewer)
- Datum: 2026-10-26
- Zählung: P0 0 · P1 0 · P2 0 · P3 7
- Prüfaufbau: Produktionsbuild auf http://localhost:4173 (Code-Stand Commit 2c96abe, `main` nach Runde 11), Playwright/Chromium (globales Modul, weil die Projektkopie keinen Browser fand), Telefon 390×844 und 360×640, Touch, de-DE. Zustände über die Bedienung aufgebaut; Übungsbögen aus `examples/thw/` mit `uebung: false` und heutigem Zeitraum über „Bögen einlesen…“ eingespielt. Kamera, Handschuhe, Bildschirmtastatur, native Builds nicht prüfbar. Die bekannten Grenzen aus `docs/audits/README.md` und Runde 10/11 wurden nicht neu gemeldet.

## Urteil

Ein Helfer ohne Einweisung kommt ohne fremde Hilfe zum Ziel. Geprüft wurden:
Startseite (leer, mit Entwurf, mit Einsatz, nach „Bogen schließen“, nach
Neuladen), Assistent Schritt 1–6 mit Eingaben (Einheitstyp-Suche, Ortsverzeichnis,
Namen einfügen, „Nur Stärke“, Fahrzeuge, Sofortbedarf), Übersicht mit
Offene-Punkte-Liste, „Bogen übergeben…“ (Vollbild-QR, PDF, weitere Formate),
„Bogen schließen“, Einsatz-Sammlung (anlegen, Bögen einlesen, Kenntnisnahme,
Abrücken, Aufteilen, Stärke ändern, Entfernen, Löschen, Lagemonitor), Aufnahme per
„Einheit manuell erfassen…“ und Schnellerfassung, Fehlversuche beim Einlesen
(Textdatei, fremde JSON-Datei, doppelter Bogen), Scanner-Dialog ohne Kamera,
Anleitung. Die Rückfragen sind verständlich, jede Handlung nennt ihre Folge
(„Bogen schließen“: „geschlossen, nicht gelöscht“; „Einsatz löschen“: Papierkorb
30 Tage), Fehlversuche beim Einlesen führen mit einem klaren Satz zurück. Auf den
41 über die Startseite verlinkten Seiten gab es bei 360 px keinen horizontalen
Überlauf. Neue Befunde gibt es nur auf Stufe P3: eine veraltete Anleitung, eine
Rückmeldung, die den Zustand falsch benennt, und einige Beschriftungen.

## Befunde

### R12-N1 (P3) – Anleitung beschreibt Felder und Verhalten, die es in der App nicht gibt

- Ort: `anleitung.html` („Bogen erstellen“, „Bogen drucken“, „Bogen scannen“, Tabelle „Technische Daten“) gegenüber Schritt 2, Übersicht und Übergabe-Dialog.
- Beobachtung: Die Anleitung nennt für Schritt 2 „Einsatzstichwort, Auftrag, Meldekopf und Zeitpunkt des Eintreffens“. Schritt 2 hat „Zeitraum von/bis“, „Einsatzort / Auftrag“, „Einsatzbeginn/-ende eintragen“ und „Dies ist eine Übung“; ein Feld Meldekopf oder Eintreffen gibt es nicht, und die App sagt dort ausdrücklich, dass der Meldekopf seine Eintreffzeiten getrennt führt. Die Anleitung nennt die Signatur „optional“ („Optional versiehst du einen Bogen mit einer Ed25519-Signatur“, Technische Daten: „Optionale Ed25519-Signatur“); die App signiert jeden übergebenen Bogen automatisch („Jeder übergebene Bogen trägt automatisch ein Echtheits-Siegel“) und bietet keine Wahl. „Am Ende der Gesamtübersicht steht „PDF erzeugen““: Am Ende der Übersicht steht „PDF herunterladen“; „PDF erzeugen“ steht im Dialog „Bogen übergeben…“, dessen Knopf oben in der Übersicht liegt.
- Folge: Wer die Anleitung vorab liest, sucht ein Feld „Meldekopf“ und die Zeit des Eintreffens im eigenen Bogen, erwartet einen Schalter für die Signatur und sucht den Knopf am Seitenende. Das kostet Zeit und lässt Zweifel an der Anleitung aufkommen („Habe ich etwas übersehen?“). Auf einer Seite, die den Weg Schritt für Schritt erklärt, ist das die erste Stelle, an der ein Neuling nachschlägt.
- Empfehlung: Die drei Stellen an den heutigen Stand anpassen (Schritt 2: Zeitraum, Auftrag, Übung; Signatur: automatisch, Absender freiwillig; PDF: „Bogen übergeben… → PDF erzeugen“). Dieselbe Aussage steht im JSON-LD der Seite („Trag Einsatzstichwort, Auftrag, Meldekopf und Zeitpunkt des Eintreffens ein.“).
- Nachprüfung: Anleitung gegen den Assistenten lesen; jede genannte Beschriftung und jedes genannte Feld muss in der App vorkommen.

### R12-N2 (P3) – Rückmeldung zum Organisationswechsel nennt die erste statt der aktuellen Wahl

- Ort: Schritt 1, Auswahl „Organisation“, Hinweiszeile mit „Rückgängig“.
- Beobachtung: THW → Feuerwehr → DRK → Sonstige gewählt (je 1,5 s Pause): Die Zeile lautet nach allen drei Wechseln gleich „Organisation auf „Feuerwehr“ gewechselt (Einheitstyp und Zugehörigkeit zurückgesetzt) — Stärke 0 → 0.“, während im Feld „Sonstige“ steht. „Rückgängig“ stellt THW her (beide späteren Wechsel auf einmal), die Zeile nennt das nicht. „Stärke 0 → 0“ erscheint auch, wenn sich nichts ändert.
- Erwartung der Rolle: Die Zeile beschreibt, was gerade geschehen ist, und „Rückgängig“ nimmt genau diesen Schritt zurück.
- Folge: Die Zeile widerspricht dem Feld darüber. Wer in der Eile die zweite Wahl korrigiert, liest „Feuerwehr“, zweifelt, welche Angabe stimmt, und weiß nicht, wohin „Rückgängig“ führt (THW, nicht die vorherige Wahl). Datenverlust entsteht in diesem Ablauf nicht, weil der Bogen noch leer war.
- Empfehlung: Die Zeile mit jeder Wahl aktualisieren und das Ziel von „Rückgängig“ nennen („zurück zu THW“); „Stärke 0 → 0“ weglassen, wenn die Stärke gleich bleibt.
- Nachprüfung: Dreimal nacheinander wechseln; die Zeile nennt die letzte Wahl, „Rückgängig“ benennt sein Ziel.

### R12-N3 (P3) – Schritt 4: Fahrzeugtyp und „Sitzplätze“ weiter abgeschnitten (R10-N7 hält dort nicht)

- Ort: Schritt 4, „Fahrzeug 1 von 4“.
- Beobachtung: Bei 390 px zeigt das Feld „Fahrzeugtyp“ „LKW Kipper – Lastkraftwagen Kipp▾“, das Feld „Sitzplätze“ den Platzhalter „3 (Richtwert,“ (Feld 112 px breit). Bei 360 px endet der Fahrzeugtyp bei „…Lastkraftwagen I“, der Platzhalter ebenfalls bei „3 (Richtwert,“. In Runde 10 als R10-N7 gemeldet und als behoben geführt; Schritt 1 und „Kennwort“ passen jetzt, Schritt 4 nicht.
- Folge: Gering. Der Helfer erkennt „LKW Kipper“ am Anfang; bei Typen mit gleichem Anfang („GKW I“, „GKW II“) entscheidet das abgeschnittene Ende. Der Hinweis „(Richtwert)“ im Platzhalter sagt, dass der Wert nur geschätzt ist; abgeschnitten bleibt „3 (Richtwert,“ unfertig.
- Empfehlung: „Sitzplätze“ so breit wie „Kennzeichen“ oder den Platzhalter auf „3 (Richtw.)“ kürzen; Fahrzeugtyp in Kurzform vor der Langform („LKW Kipper“, Langform darunter).
- Nachprüfung: 360 × 640 und 390 × 844: Schritt 4 ohne abgeschnittenen Text in beiden Feldern.

### R12-N4 (P3) – „OV/RB/LV-Vorlage“ sagt nicht, was der Knopf tut

- Ort: Schritt 1, Zugehörigkeit, neben „+ übergeordnete Ebene“.
- Beobachtung: Der Knopf legt zwei leere Zeilen an: „Ebene (übergeordnet) RB – Regionalbereich“ und eine weitere (Landesverband), je mit Name, Kürzel, Telefon, E-Mail und ✕. „Vorlage“ steht sonst für gespeicherte Bögen („Als Vorlage speichern“ in der Übersicht).
- Erwartung der Rolle: Eine „Vorlage“ ist ein gespeicherter Bogen; der Knopf lädt vermutlich etwas Vorhandenes.
- Folge: Der Helfer tippt, um zu sehen, was geschieht, und bekommt zwei leere Zeilen, die er wieder entfernen muss. Der Begriff „Vorlage“ ist damit doppelt belegt.
- Empfehlung: Nach der Wirkung beschriften („Regionalbereich und Landesverband anlegen“).
- Nachprüfung: Der Knopf nennt, welche Zeilen entstehen.

### R12-N5 (P3) – Lagemonitor: „Einsatzbeginn“, „Jetzt“ und „Löschen“ ohne Erklärung, Name doppelt belegt

- Ort: Einsatzansicht, Abschnitt „Lagemonitor für den Fernseher“.
- Beobachtung: Der Text erklärt Fenster, Aktualisierung und Funkrufname. Darunter stehen ein Datums-Uhrzeit-Feld „Einsatzbeginn“ und die Knöpfe „Jetzt“ und „Löschen“, ohne Satz zu ihrer Wirkung. Erst im geöffneten Fenster zeigt sich die Zeile „seit Beginn: 0 Stunden, 0 Minuten“. „Einsatzbeginn eintragen“ heißt auch ein Kästchen in Schritt 2 des Bogens, dort mit anderer Bedeutung (Nachweis der eigenen Einheit).
- Erwartung der Rolle: Das Feld gibt den Beginn des Einsatzes an und gehört zum Einsatz, nicht nur zum Fernseher. „Löschen“ löscht vielleicht den Einsatz.
- Folge: Gering. Wer „Jetzt“ antippt, stellt den Zähler am Fernseher und merkt es erst im Fenster; „Löschen“ neben „Lagemonitor öffnen“ wirkt wie eine gefährliche Aktion (nicht angetippt, Wirkung daher Annahme: nur der Beginn).
- Empfehlung: Einen Satz ergänzen („Der Fernseher zeigt die Dauer seit diesem Zeitpunkt“), „Löschen“ in „Beginn entfernen“ umbenennen.
- Nachprüfung: Der Text im Abschnitt nennt Zweck und Wirkung beider Knöpfe.

### R12-N6 (P3) – „Namen einfügen“ schaltet die Ansicht von Karten auf Kurz-Liste um

- Ort: Schritt 3, Wahl „Alle Angaben (Karten)“ / „Kurz-Liste (Tabelle)“.
- Beobachtung: „Alle Angaben (Karten)“ gewählt, dann „Namen einfügen…“ → Namen → „Übernehmen“: Danach ist wieder „Kurz-Liste (Tabelle)“ gewählt. Die Meldung „3 Namen übernommen — 3 davon in freie Sollplätze“ nennt den Wechsel nicht.
- Erwartung der Rolle: Die gewählte Ansicht bleibt.
- Folge: Gering. Wer Karten bevorzugt, sieht plötzlich eine andere Darstellung und sucht die Namen. Auf dem Telefon ist die Tabelle ohnehin die Vorgabe.
- Empfehlung: Die gewählte Ansicht beibehalten.
- Nachprüfung: Karten wählen, Namen einfügen, die Ansicht bleibt Karten.

### R12-N7 (P3) – Kennzeichen bleibt in der getippten Schreibweise („thw 80101“)

- Ort: Schritt 4, Feld „Kennzeichen“, danach Übersicht.
- Beobachtung: Eingabe „thw 80101“ bleibt nach dem Verlassen des Feldes unverändert und steht so in der Fahrzeugliste der Übersicht, während der Platzhalter „z. B. THW-84397“ lautet. Ein zweites Fahrzeug mit „THW-80101“ wird als gleiches Kennzeichen erkannt („steht mehrfach in der Fahrzeugliste — stimmt das?“), die Schreibweise wird aber nicht angeglichen.
- Folge: Gering. Auf Papier und in der Übersicht stehen bei derselben Einheit unterschiedliche Schreibweisen; das Lageblatt wirkt uneinheitlich.
- Empfehlung: Beim Verlassen des Feldes Großschreibung und Trennstrich anbieten, so wie bei Namen die Schreibweise vereinheitlicht wird (R11-H1).
- Nachprüfung: „thw 80101“ eingeben und das Feld verlassen: Anzeige „THW-80101“.

## Halten die Behebungen aus Runde 11? (nachgeprüft)

- R11-N1/N2 Kontaktfelder: Telefon und E-Mail in voller Feldbreite (324 px bei 390, 294 px bei 360); „Freiburg“ ergänzt Kürzel, Telefon, E-Mail, RB und LV vollständig, nach Tab keine Vorschlagsliste über dem Telefonfeld, „Rückgängig“ vorhanden. Hält.
- R11-D1/S3 Kenntnisnahme: „Zur Kenntnis genommen: 3 Einheiten“ mit „Rückgängig“ und „✕“. Hält.
- R11-D Abrücken: Quittung „Abgerückt 02:29 …“ mit „Rückgängig“; die Karte zeigt „abgerückt …“ mit „ändern“ und den Knopf „Wieder anwesend“. Hält.
- R11-A Einlesen: „3 Bögen aufgenommen. 3 Bögen ohne Namen und Erreichbarkeiten: Datenschutzfrist …“ nennt das Alter („Stand vor 100 Tagen“); doppelter Bogen: „0 Bögen aufgenommen, 1 bereits vorhanden.“ Hält.
- R11-O Löschen eines Einsatzes: Rückfrage nennt Name, Zahl der Einheiten, Papierkorb und 30 Tage. Hält.

## Bestätigt (keine Befunde)

- Rückfragen vor Folgen: „Bogen schließen“ (geschlossen, nicht gelöscht, Rückholung auf der Startseite), „Meldung entfernen?“ (nennt Nummernverschiebung und Grenze von „Rückgängig“), „Nur die Stärke melden?“ (nennt Folge).
- Schnellerfassung auf der Startseite fragt bei vorhandener Sammlung „für welche Sammlung?“.
- Fehlversuche beim Einlesen: Textdatei und fremde JSON-Datei führen zu „stammt nicht aus dieser App. Beim Absender die PDF des Bogens anfordern oder den QR-Code scannen.“, ohne Zustandsverlust.
- Scanner ohne Kamera: klare Meldung, Handscanner-Weg, „Abbrechen“ erreichbar bei 360 × 640.
- PDF-Quittung im Dialog („✓ PDF gespeichert: … liegt im Download-Ordner des Browsers.“) und Übergabestand in der Übersicht („PDF erzeugt 02:38 Uhr — Empfang nicht bestätigt.“).

Aufgabe geschafft: ja
Fremde Hilfe nötig: nein
Größtes Missverständnis: „OV/RB/LV-Vorlage“ lädt nichts Vorhandenes, sondern legt zwei leere Zeilen an (R12-N4).
Größtes Einsatzrisiko: Keines oberhalb von P3 belegt; am ehesten die veraltete Anleitung, die Felder und Wahlmöglichkeiten nennt, die es nicht gibt (R12-N1).
Top-Priorität für die nächste Iteration: Anleitung (Schritt 2, Signatur, PDF-Weg) an den Ist-Stand anpassen (R12-N1) und die Organisationswechsel-Zeile an die aktuelle Wahl koppeln (R12-N2).
