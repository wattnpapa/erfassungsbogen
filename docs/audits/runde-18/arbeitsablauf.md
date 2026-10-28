# Prüfbericht Runde 18: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf“ (thw-workflow-reviewer), Meldekopf-Bediener und Helfer mit eigenem Bogen in einer Person
- **Datum:** 2026-10-27
- **Code-Stand:** Commit `ae3a8e9` (`main`), Produktionsbuild, `http://localhost:4173`
- **Methode:** Playwright (globales Modul, `chromium.launch()` ohne Optionen, eigenes Profil je Lauf), `isMobile`/`hasTouch`, Locale de-DE, Viewports 360 x 640 und 390 x 844. Bögen: die THW-Beispielbögen aus `examples/thw/` mit `uebung: false` und Stand/Zeitraum auf heute. Downloads (Lageblatt, CSV, Nachtrags-CSV, Sammel-PDF) geöffnet und gelesen. Kein Code geändert. Nicht geprüft: Kamera-Scan, Nahbereich, Bildschirmtastatur, native Builds.
- **Maßstab:** Keine „bekannten Grenzen“. Auch früher als teilweise oder offen geführte Punkte werden gemeldet, wenn sie im Browser noch zu sehen sind.
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 8

## Urteil aus Sicht der Rolle

Erwartete Arbeitsfolge (Annahme, kein bekannter THW-Vorschrifttext): Der Meldekopf legt einen Einsatz an, nimmt Bögen auf, ordnet Zug zu, rückt Einheiten ab, gibt die Lage weiter (Lageblatt, CSV, Sammel-PDF, Nachtrag) und kann nach Unterbrechung auf einem zweiten Gerät weiterarbeiten. Dazu kommt der eigene Bogen bis zur Übergabe.

Der Ablauf trägt. Beide Strecken ließen sich ohne fremde Hilfe, ohne doppelte Eingabe und ohne Datenverlust durchlaufen. Die Reibung liegt in der Erstorientierung am kleinen Telefon, in der Kürzung der Rückgängig-Quittungen und in Dateitexten.

## Haltbarkeit der Behebungen aus Runde 17 (im echten Browser)

| Befund | Ergebnis |
| --- | --- |
| Doppeltipp „Abrücken“ (zwei Tipps im Abstand von 60 ms) | hält: eine Abrückung, danach „Wieder anwesend“ |
| Neuladen mit aufgeklappter Karte | hält: Einsatz, Karte und Bildlaufstelle (1676 px) bleiben |
| Zurück-Geste | hält: Einsatz → Startseite |
| Papierkorb für entfernte Meldungen | hält: „Zuletzt entfernte Meldungen (1) — 7 Tage zurückholbar“ nach Neuladen, „Zurückholen“ bringt die Einheit als Nr. 1 zurück |
| Tabelle am Telefon 360 px | hält: kein seitlicher Überlauf (360 von 360), Spalten Einheit, Ges., Meldung vor, Bedarf |
| Fußleiste Assistent | hält: Bedienleiste bei 360 x 640 nur etwa 57 px hoch |
| Nachtrags-CSV (R17-W2) | hält: „NACHTRAG seit …“ steht jetzt in Zeile 1 |
| Anführungszeichen (R17-W3), „1 Einheiten“ (R17-W4) | halten: keine geraden Schlusszeichen gefunden, Lageblatt „1 Einheit zählend“ |
| Sammel-PDF auf zweitem Gerät | hält: „4 Einheiten, davon 3 anwesend“, Abgerückte im eigenen Block |

## Befunde

### R18-W1 [P3] Rückgängig-Quittung nach 15 s ohne Zahl und ohne Folge

- **Neu oder alt (Verweis):** alt, R17-W1, weiter teilweise (Abrücken-Quittung „Nr. 1 abgerückt“ ist behoben)
- **Ort:** Einsatzansicht, Quittungsleiste unten, 360 x 640.
- **Beobachtung:** „Zug zuordnen“ für 4 Einheiten: erst „Zug „1. Zug“ gesetzt: 4 Einheiten“, nach 15 s nur noch „Zug „1. Zug““ neben „Rückgängig“ und „✕“. Beim Entfernen einer Meldung bricht die Quittung mit „… Die Einheiten Nr…“ ab; gerade der Teil mit den neuen Nummern fehlt.
- **Folge:** Wer nach einer Unterbrechung zurückschaut, sieht ein „Rückgängig“, ohne zu wissen, wie viele Einheiten es betrifft.
- **Empfehlung:** In der Kurzzeile die Zahl der Einheiten („4 Einheiten: 1. Zug“) behalten; bei „Entfernt“ die Umnummerierung vor die Namensangabe stellen.
- **Verifikation:** 360 x 640, Zug für mehrere Einheiten setzen, 20 s warten: Zahl der Einheiten lesbar.

### R18-W2 [P3] Entfernen einer Meldung verschiebt die Nummern aller folgenden Einheiten

- **Neu oder alt (Verweis):** neu
- **Ort:** Karte › Mehr… › Entfernen, Rückfrage „Meldung entfernen?“.
- **Beobachtung:** Die Rückfrage nennt es ehrlich: „Die Einheiten Nr. 2–4 rücken auf und heißen danach Nr. 1–3.“ Nach „Zurückholen“ ist die Einheit wieder Nr. 1.
- **Folge:** Bereits per Funk, im Lageblatt oder in einer CSV genannte Nummern zeigen danach auf andere Einheiten. Am Meldekopf entsteht so eine stille Verwechslung zwischen Papier und Gerät.
- **Empfehlung:** Nummern bei Entfernen nicht neu vergeben (Lücke lassen) oder mit der Einheit fest verbinden.
- **Verifikation:** Meldung 1 von 4 entfernen: Meldung 2 heißt weiterhin Nr. 2.

### R18-W3 [P3] Tipps in der ersten Dreiviertelsekunde werden ohne Rückmeldung verschluckt

- **Neu oder alt (Verweis):** neu (Folge der Doppeltipp-Behebung aus Runde 17)
- **Ort:** Rückfrage „Meldung entfernen?“; auch „Übersicht als CSV“ kurz nach „Lageblatt (A4 quer)“.
- **Beobachtung:** Zwei Tipps auf „Meldung entfernen“ im Abstand von 300 ms nach dem Öffnen blieben ohne Wirkung und ohne Anzeige; der dritte (nach etwa 0,9 s) wirkte.
- **Folge:** Der Helfer tippt erneut und zweifelt, ob die Rückfrage hängt.
- **Empfehlung:** Knopf in dieser Zeit sichtbar gesperrt darstellen oder den Tipp ausführen.
- **Verifikation:** Rückfrage öffnen, nach 0,3 s „Meldung entfernen“ tippen: Wirkung oder sichtbare Sperre.

### R18-W4 [P3] Leerer Einsatz am kleinen Telefon: Aufnahmeknöpfe liegen unter dem Bildrand

- **Neu oder alt (Verweis):** neu
- **Ort:** Einsatz frisch angelegt, 360 x 640.
- **Beobachtung:** Der erste Bildschirm zeigt Nullzähler, „Bedarf: Verpflegung 0“ und zwei Sprungverweise. „Bogen scannen…“, „Einheit manuell erfassen…“ und „Bögen einlesen…“ beginnen bei etwa 860 px, die Seite ist 4 038 px hoch. Bei 390 x 844 liegen sie im ersten Bild.
- **Folge:** Der erste Schritt nach „Einsatz anlegen“ ist auf kleinen Geräten nicht sichtbar; man muss suchen.
- **Empfehlung:** Bei leerem Einsatz die Aufnahmeknöpfe vor Zähler und Bedarf stellen.
- **Verifikation:** 360 x 640, neuen Einsatz anlegen: „Bogen scannen…“ im ersten Bild.

### R18-W5 [P3] Lageblatt: Stärke einmal „1/1/2/4“, sonst „0 / 2 / 9 / 11“

- **Neu oder alt (Verweis):** neu
- **Ort:** Lageblatt (A4 quer), Spalte Stärke F/U/M/G und Summenzeile.
- **Beobachtung:** Nr. 1 und die Summe stehen ohne Leerzeichen, alle anderen Zeilen mit Leerzeichen.
- **Folge:** Wirkt uneinheitlich; in der Spalte schwerer zu überfliegen.
- **Empfehlung:** Eine Schreibweise in allen Zeilen.
- **Verifikation:** Lageblatt mit Einheiten ein- und zweistelliger Stärke erzeugen.

### R18-W6 [P3] Dateinamen mit unlesbarem Zeitstempel, bei Nachträgen doppelt

- **Neu oder alt (Verweis):** neu
- **Ort:** Downloads, z. B. `eeb-lageblatt-272306okt26_Hochwasser_Weser.pdf` und `eeb-einsatz-nachtrag-seit-20261027-2308-272309okt26_Hochwasser_Weser.csv`.
- **Beobachtung:** „272306okt26“ (Tag, Uhrzeit, Monat, Jahr ohne Trennzeichen); die Nachtragsdatei trägt zusätzlich „seit 20261027-2308“ in anderem Format.
- **Folge:** Im Download-Ordner und beim Versand an den Stab lassen sich Dateien schwer nach Stand ordnen.
- **Empfehlung:** Ein Format, z. B. `2026-10-27_2306`, einmal je Name.
- **Verifikation:** Lageblatt und Nachtrag exportieren, Namen vergleichen.

### R18-W7 [P3] Schnellerfassung: Kopf nimmt ein Drittel des Bildes

- **Neu oder alt (Verweis):** alt, verwandt mit R17-G2 (Kopf des Assistenten)
- **Ort:** Einsatz › „Einheit schnell erfassen…“, 360 x 640.
- **Beobachtung:** Rücksprung-Zeile (zweizeilig), Titel, Speicherzeile, Schrittleiste und die Legende „„–“ heißt: Schritt 2 und 5 entfallen hier.“ belegen etwa 200 px; das erste Feld liegt bei etwa 300 px, bei 57 px Fußleiste bleiben rund 380 px für Eingaben.
- **Folge:** Beim Eintragen von Ort und Stärke wird viel gescrollt.
- **Empfehlung:** Legende und Schrittleiste in der Schnellerfassung weglassen oder einklappen.
- **Verifikation:** 360 x 640: erstes Eingabefeld oberhalb von 200 px.

### R18-W8 [P3] Nachtrags-Bereich: elf Zeilen Erklärung vor dem ersten Knopf

- **Neu oder alt (Verweis):** neu
- **Ort:** Einsatz weitergeben / sichern › „Nur neue Bögen seit dem letzten Export“, 390 x 844.
- **Beobachtung:** Nach dem Ankreuzen stehen vier Statusabsätze (Sammel-PDF, Übersicht, Alle Daten, Excel) mit je eigener Bezugsangabe vor den Knöpfen, die selbst „erste Lieferung: alle Bögen“ und „Nachtrag (2 Einheiten)“ nennen.
- **Folge:** Unter Zeitdruck wird der Text übersprungen; welcher Bezugspunkt gilt, bleibt unklar.
- **Empfehlung:** Bezug nur im Knopf nennen, Erklärung einklappen.
- **Verifikation:** Haken setzen: erster Exportknopf ohne Scrollen sichtbar.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Eine gekürzte „Rückgängig“-Zeile ohne Zahl der betroffenen Einheiten (R18-W1).
- **Größtes Einsatzrisiko:** Nummern verschieben sich beim Entfernen einer Meldung gegenüber bereits weitergegebenen Listen (R18-W2); Datenverlust oder Statusfehler wurden in keinem Ablauf beobachtet.
- **Top-Priorität für die nächste Iteration:** R18-W2 und R18-W1 gemeinsam angehen.
