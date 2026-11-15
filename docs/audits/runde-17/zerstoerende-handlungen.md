# Audit „Zerstörende Handlungen", Runde 17 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App, Produktionsbuild auf `http://localhost:4173`, Code-Stand
Commit `be6b396` (`main`).

**Zählung: P0 0 · P1 0 · P2 1 · P3 6** (R17-D1 bis R17-D7).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, die
Abschnitte „Stand der Behebung" in `runde-16/README.md` bis `runde-11/README.md` und der
Bericht `runde-16/zerstoerende-handlungen.md`. Ab dieser Runde gibt es keine „bekannten
Grenzen" mehr, die ausgelassen werden: Was im Browser noch zu beobachten ist, steht hier,
auch wenn es früher als „teilweise", „offen" oder „bekannte Grenze" geführt wurde.

## Prüfaufbau

Chromium über das globale `playwright`-Modul (`/opt/node22/lib/node_modules/playwright`),
`chromium.launch()` ohne Optionen, nichts installiert. `isMobile`/`hasTouch`, Locale de-DE,
Viewports 360 × 640 und 390 × 844. Je Szenario ein frischer Browserkontext. Zustand über die
Bedienung: Einsatz-Sammlung „Hochwasser Weser" anlegen, die THW-Übungsbögen `012-sinsheim`,
`013-ulm`, `014-weinsberg` (Kopien außerhalb des Repositorys, `uebung: false`, `stand` fünf
Minuten vor der Geräteuhr) über „Bögen einlesen…" aufnehmen; für den Assistenten Bogen `013-ulm`
über „Aus Datei laden…". Kein Kamera-Scan, keine Handschuhe, kein Zweitgerät, keine nativen
Builds.

Durchgespielt: Kenntnisnahme und Rückgängig (Zeitabstände 0,5 bis 3 s), Abrücken mit Rückgängig
und „Wieder anwesend", Meldung entfernen (Rückfrage, Quittung, Doppeltipp auf die Bestätigung
nach 60, 200 und 400 ms, Neuladen), Stärke ändern (Plausibilitätsfrage), „Als Übung
kennzeichnen…" mit Rückgängig, Aufteilen, Verschieben ohne zweite Sammlung, Zug zuordnen mit
Rückgängig, doppeltes Einlesen derselben Dateien, Einsatzbeginn „Jetzt" und „Beginn entfernen",
Einsatz löschen, Papierkorb (Wiederherstellen, „Endgültig löschen…"), „Alle Daten löschen",
„Geräteschlüssel neu erzeugen", Datensicherung (Dialog), Sammel-PDF erzeugen (Zeitverlauf,
Doppeltipp), Assistent: Person entfernen, Reihenfolge „⇑", Fahrzeug-Vorbelegung ersetzen,
Bogen schließen, Übungsbögen.

## Urteil

Die Rückfragen mit Folgen sind in diesem Stand gut: Sie nennen Name, Stärke und die konkrete
Folge, Enter und Escape lösen nichts aus, Doppeltipps auf Bestätigungen wirken nur einmal, und die
meisten Handlungen haben ein Rückgängig, das nicht von selbst verschwindet (Abrücken: nach 40 s
noch da). Die Behebungen aus Runde 16 halten, soweit sie im Browser zu beobachten sind. Die Aufgaben
ließen sich ohne fremde Hilfe erledigen. Neu gefunden wurde ein Ersetzen ohne Rückweg im Schritt
Fahrzeuge (R17-D1) und eine stille Umordnung der Ansprechperson (R17-D2); dazu fünf bekannte
Restpunkte, die weiterhin zu beobachten sind.

## Behebungen aus Runde 16, im echten Browser geprüft

| Befund | Ergebnis |
| --- | --- |
| R16-D1 Tipp in der Sperre ohne Rückmeldung | teilweise. Es erscheint jetzt „Einen Moment …" (siehe R17-D3), das „Rückgängig" selbst wirkt aber weiter erst nach der Sperre. Die Variante Kenntnisnahme → Rückgängig → Kenntnisnahme im Abstand von 0,5 s funktioniert |
| R16 Rückgängig nach „Meldung entfernen" | hält im Wechsel der Ansicht; nach Neuladen weg (siehe R17-D6) |
| R16 Doppeltipp bei „In Einsatz übernehmen" und Bestätigungen | hält (Meldung entfernen: je eine Entfernung bei 60, 200 und 400 ms) |
| R16 „Als Übung kennzeichnen…" | Rückfrage und Rückgängig halten; Eintreffzeit bleibt (18:02 vorher, nachher und nach Rückgängig) |

## Befunde

### R17-D1 [P2] „StAN-Vorbelegung laden" ersetzt die Fahrzeugliste samt Kennzeichen und Ausstattungsangaben, ohne Rückgängig und ohne diese Folge zu nennen

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640, Bogen `013-ulm`).

**Fundstelle / Aufgabe:** Assistent → Schritt 4 Fahrzeuge → „StAN-Vorbelegung laden (2 Fahrzeuge)" →
„Ersetzen".

**Beobachtung:** Die Rückfrage lautet „Die aktuelle Fahrzeugliste (2 Fahrzeuge) wird durch die 2
Fahrzeuge der StAN ersetzt." Sie nennt nur die Zahl. Vorher stehen im Bogen „THW-80125" und
„THW-80126", Ausstattung nach StAN „ja", Funkrufname „Heros", Kennzahlen „22/51". Nach „Ersetzen"
stehen dort Fahrzeugtyp, „— k. A." und die Kennzahlen; die Kennzeichen sind leer. Es erscheint
keine Quittung und kein Rückgängig (die Leiste zeigt nur die Fußleiste des Assistenten). Der Text
bei dem Knopf wechselt auf „Schon geladen — die 2 Fahrzeuge stehen unten in der Liste."

**Erwartung der Rolle:** Die Rückfrage sagt, welche eigenen Eingaben (Kennzeichen, Ausstattung)
verloren gehen, und danach gibt es ein Rückgängig wie bei „Vorlage ersetzen".

**Folge:** Wer die Vorbelegung zum Auffüllen nimmt, verliert die zuvor vom Fahrzeug abgelesenen
Kennzeichen und muss sie neu tippen; ein Zahlendreher dabei ist wahrscheinlicher als beim ersten
Mal. Es geht nichts Unwiederbringliches verloren, aber die Eingaben vom Fahrzeug fehlen und niemand
bemerkt es, wenn er den Knopf nur wegen der Typen genommen hat. P2 wegen des fehlenden Rückwegs bei
ansonsten durchgehend mit Rückgängig versehenen Ersetzen-Handlungen.

**Empfehlung:** In der Rückfrage nennen, welche Kennzeichen und Angaben entfallen (hier: zwei
Kennzeichen); nach „Ersetzen" eine Quittung mit Rückgängig.

**Nachprüfung:** Bogen mit Kennzeichen in Schritt 4 laden → Vorbelegung → „Ersetzen" → die Rückfrage
nennt die Kennzeichen; „Rückgängig" stellt sie wieder her.

### R17-D2 [P3] „⇑" setzt eine Person still an die Spitze und macht sie zur Ansprechperson

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640).

**Fundstelle / Aufgabe:** Assistent → Schritt 3 Personal → Zeilenknöpfe „▲ ▼ ⇑ ✕".

**Beobachtung:** Ein Tipp auf „⇑" bei der vierten Person (Brandt, Uwe) stellt sie an Platz 1. Es gibt
keine Quittung und kein Rückgängig; die Leiste unten bleibt unverändert. Der erklärende Satz („Die
erste Person ist die Ansprechperson … „⇑" setzt eine Person ganz nach oben — und damit an diese
Stelle") steht weit oben im Schritt. Die vier Knöpfe sind 44 px breit und liegen 4 px auseinander;
„✕" (Person entfernen, mit Rückfrage) sitzt direkt neben „⇑". Brandt hat in diesem Bogen keine
Erreichbarkeit; der bisherige Ansprechpartner Lehmann (Mobil-Nummer) rückt auf Platz 2.

**Erwartung der Rolle:** Ein Wechsel der Rückfragestelle wird bestätigt oder ist mit einem Tipp
zurückzunehmen.

**Folge:** Mit Handschuh trifft man „⇑" statt „▼" oder „✕". Der Bogen nennt danach eine
Ansprechperson ohne Telefonnummer; die Gegenstelle kann bei Rückfragen niemanden erreichen. Die
Warnung für fehlende Erreichbarkeit der ersten Person wurde in diesem Lauf nicht beobachtet.

**Empfehlung:** Quittung mit Name der neuen Ansprechperson und Rückgängig; Abstand der Zeilenknöpfe
vergrößern.

**Nachprüfung:** Schritt 3 → „⇑" bei Person 4: Leiste „Neue Ansprechperson: Brandt, Uwe — Rückgängig".

### R17-D3 [P3] Ein „Rückgängig" innerhalb der Ortssperre wird weiter verworfen, jetzt mit „Einen Moment …"

**Neu oder alt (Verweis):** alt, wie R16-D1, teilweise behoben.

**Kennzeichnung:** gemessen (390 × 844).

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Abrücken" → nach 3 s „Rückgängig" →
nach 0,6 s „Zur Kenntnis genommen" → nach 0,6 s dessen „Rückgängig".

**Beobachtung:** Beim letzten Tipp erscheint 672–701 px eine Zeile „Einen Moment …", die Kenntnisnahme
bleibt bestehen und der Block „Neu seit der letzten Kenntnisnahme" kommt nicht zurück. Ein zweiter
Tipp nach etwa drei Sekunden wirkt. Die einfache Folge Kenntnisnahme → Rückgängig → Kenntnisnahme
(0,5 s Abstand) geht durch.

**Erwartung der Rolle:** Ein bewusster Tipp auf „Rückgängig" wirkt sofort.

**Folge:** Der Tipp wird nicht mehr stumm verschluckt, aber die zweite Zurücknahme in Folge verzögert
sich um die Sperre; unter Zeitdruck tippt man ein weiteres Mal oder gibt auf. Es geht nichts
verloren.

**Empfehlung:** Die Sperre für „Rückgängig" auf den Zeitraum des Doppeltipps (unter 1 s) begrenzen.

**Nachprüfung:** Wie oben; der dritte Tipp nimmt die Kenntnisnahme sofort zurück.

### R17-D4 [P3] Sammel-PDF: keine Fortschrittsanzeige, der Knopf ist nach unter 300 ms wieder frei, die Datei kommt erst nach 2 bis 6 s

**Neu oder alt (Verweis):** alt, wie R15-O1, weiter offen.

**Kennzeichnung:** gemessen (390 × 844, drei Bögen).

**Fundstelle / Aufgabe:** Einsatzansicht → „Einsatz weitergeben / sichern".

**Beobachtung:** Der Knopf zeigt für unter 300 ms „Einsatz wird erzeugt…" (alle drei Knöpfe der
Gruppe deaktiviert), dann steht wieder „Einsatz weitergeben / sichern" und alle sind aktiv. Der
Download kommt je nach Lauf nach 2,1 s und 6,1 s. In der Zwischenzeit zeigt weder eine Leiste noch
ein Hinweis, dass die Datei noch entsteht. Drei Tipps (0, 1,5 und 4,5 s) ergaben zwei Dateien mit
gleichem Namen (`eeb-einsatz-271804okt26_Hochwasser_Weser.pdf`).

**Erwartung der Rolle:** Der Knopf bleibt bis zur fertigen Datei als „in Arbeit" erkennbar.

**Folge:** Wer nach einer Sekunde nichts sieht, tippt erneut und erzeugt eine zweite Datei gleichen
Namens; bei 30 Bögen dauert es laut R15 um 41 s ohne Anzeige.

**Empfehlung:** „wird erzeugt…" bis zum Ende der Erzeugung stehen lassen und den Fortschritt (Bogen n
von m) zeigen.

**Nachprüfung:** Tipp → der Knopf bleibt deaktiviert, bis der Download beginnt.

### R17-D5 [P3] „Als Übung kennzeichnen…" überschreibt den Stand des Absenders mit der Zeit der Kennzeichnung

**Neu oder alt (Verweis):** alt, wie R15-D4, weiter teilweise.

**Kennzeichnung:** gemessen (390 × 844).

**Fundstelle / Aufgabe:** Karte → „Mehr…" → „Als Übung kennzeichnen…" → bestätigen.

**Beobachtung:** Die Karte nennt „am Meldekopf von Hand geändert", der Stand springt aber von
„27.10.2026, 17:47" (Absender) auf „18:03" (Zeit der Kennzeichnung); „Rückgängig" stellt 17:47 wieder
her. Die Eintreffzeit bleibt unverändert.

**Erwartung der Rolle:** Der Stand des Absenders bleibt, die Änderung steht als eigene Zeit daneben.

**Folge:** Die Altersangabe („Stand vor …") wirkt nach der Kennzeichnung frisch, obwohl der Absender
nichts Neues gemeldet hat.

**Empfehlung:** Stand des Absenders beibehalten und die Zeit der Kennzeichnung getrennt führen.

**Nachprüfung:** Kennzeichnen → die Karte zeigt weiter den Stand des Absenders.

### R17-D6 [P3] „Rückgängig" nach „Meldung entfernen" gilt nur bis zum Neuladen; danach ist die Meldung ohne Papierkorb weg

**Neu oder alt (Verweis):** alt, bekannte Grenze (R15-D2, R16-Bericht „größtes Restrisiko").

**Kennzeichnung:** gemessen (360 × 640).

**Fundstelle / Aufgabe:** Karte → „Mehr…" → „Entfernen" → „Meldung entfernen" → Seite neu laden.

**Beobachtung:** Die Rückfrage sagt es ehrlich („gilt bis zum Neuladen oder Schließen der App"). Nach
dem Neuladen zeigt die Sammlung „2 gemeldet", die Leiste und das Rückgängig sind weg, und es gibt
keine Stelle (Papierkorb nur für ganze Einsätze), an der die Meldung zu holen wäre.

**Erwartung der Rolle:** Eine einzelne entfernte Meldung lässt sich ebenso zurückholen wie ein ganzer
Einsatz.

**Folge:** Ein Neuladen (Browser-Neustart, Absturz, Tabwechsel auf dem Telefon) nach einer
Fehlbedienung macht sie endgültig. Die Rückfrage davor schützt, das Risiko bleibt bei zwei
schnellen Tipps.

**Empfehlung:** Entfernte Meldungen für einige Tage im Papierkorb des Einsatzes halten.

**Nachprüfung:** Meldung entfernen → neu laden → unter „Papierkorb" der Sammlung auffindbar.

### R17-D7 [P3] „Alle Daten löschen": „Endgültig löschen" und „Abbrechen" liegen 8 px übereinander

**Neu oder alt (Verweis):** neu.

**Kennzeichnung:** gemessen (360 × 640).

**Fundstelle / Aufgabe:** Startseite → „Alle Daten löschen" → Dialog, unterer Rand.

**Beobachtung:** Das Feld „Ja, alle lokalen Daten dieser App endgültig löschen" (Zeile 48 px hoch, Kästchen
24 px) schaltet „Endgültig löschen" erst frei; der Knopf (44 px) liegt 8 px über „Abbrechen" (44 px).
Beim Einsatz-Löschen sind es dagegen 40 und mehr Pixel.

**Erwartung der Rolle:** Der endgültige Knopf ist deutlich von „Abbrechen" getrennt.

**Folge:** Nach dem Haken genügt ein Tipp mit dem Handschuh knapp daneben, um alle Einsatzdaten zu
löschen. Das Haken-Feld hält die Gefahr klein, deshalb P3.

**Empfehlung:** Abstand der beiden Knöpfe vergrößern oder den endgültigen Knopf nach oben, „Abbrechen"
nach unten setzen.

**Nachprüfung:** Dialog bei 360 × 640: Abstand mindestens 24 px.

## Geprüft ohne Befund

- Rückfragen „Meldung entfernen", „Einsatz löschen" (323 und 408 px, 44 px hoch), „Einsatz endgültig
  löschen" (nennt „einzige Kopie"), „Einsatzbeginn überschreiben/entfernen", „Als Übung kennzeichnen",
  „Bogen schließen", „Person entfernen", „Geräteschlüssel erzeugen": Gegenstand und Folge genannt,
  Enter und Escape lösen nichts aus.
- „Stärke ändern…" fragt bei mehr Führern als Mannschaft nach („stimmt das?"), nennt alt und neu.
- Aufteilen, Zug zuordnen und Abrücken: Quittung mit Rückgängig, die Leiste bleibt (Abrücken: nach
  40 s noch sichtbar).
- Einlesen derselben Dateien: „0 Bögen aufgenommen, 2 bereits vorhanden."
- Papierkorb: „Wiederherstellen" und „Endgültig löschen…" 44 px, mit 14 px Abstand; „Wird am 26.11.2026
  endgültig entfernt".

## Nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, Handschuhe, ein zweites Gerät mit echter Weitergabe-Datei, das
Fenster des Lagemonitors, die nativen Builds, „Sicherung einspielen" mit Datei (Dialogtext nur
gelesen), „Neuen Bogen erstellen" bei vorhandenem Entwurf.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Ersetzen" bei der StAN-Vorbelegung wirkt wie ein Auffüllen, löscht aber die abgelesenen Kennzeichen.
- **Größtes Einsatzrisiko:** Eine Meldung, die nach Fehlbedienung und anschließendem Neuladen entfernt bleibt, ist endgültig weg (R17-D6).
- **Top-Priorität für die nächste Iteration:** Rückgängig und genauere Rückfrage für „StAN-Vorbelegung laden" (R17-D1).
