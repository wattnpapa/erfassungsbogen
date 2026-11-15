# Audit „Zerstörende Handlungen", Runde 13 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `7637e61` (`main` nach Runde 12).

**Zählung: P0 0 · P1 0 · P2 1 · P3 3** (R13-D1 bis R13-D4).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`,
`docs/audits/runde-12/README.md`, `docs/audits/runde-11/README.md` und der Bericht
`runde-12/zerstoerende-handlungen.md`. Die dort geführten bekannten Grenzen (R6-O9,
R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, leere Karten bei
„Nur Stärke", Rückgängig für Meldungen überlebt Neuladen nicht, Tabellenzeilenhöhe bei
180x320, R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3, R12-W3, R12-H3, R12-O2,
R12-O4, R12-G3) sind nicht erneut gemeldet.

## Prüfaufbau

Chromium über das globale `playwright`-Modul, `chromium.launch()` ohne Optionen,
`isMobile`/`hasTouch`, Locale de-DE, Tipps als Touch-Tipp. Viewports 390 × 844 und
360 × 640. Zustände über die Bedienung der App: Einsatz-Sammlung „Hochwasser Weser"
anlegen, vier THW-Übungsbögen (mit `uebung: false`, außerhalb des Repositorys
kopiert) über „Bögen einlesen…" aufnehmen, Sammel-PDF und Datensicherung als echte
Dateien erzeugen und wieder einspielen. Kein Kamera-Scan, keine Handschuhe, keine
nativen Builds, kein Zweitgerät.

Durchgespielt: Entfernen (Rückfrage), Aufteilen (teilweise und mit allen Personen),
Stärke ändern, Historie („Diese Fassung gilt…", „Fassung verwerfen…"), Abrücken und
„Wieder anwesend", „Verschieben…" ohne zweite Sammlung, Einsatz löschen, Papierkorb
(Wiederherstellen, „Endgültig löschen…" nach Neuladen), „Alle Daten löschen" (mit und
ohne Daten, 360 × 640), Geräteschlüssel ohne Schlüssel, Datensicherung erstellen und
einspielen über abweichende Daten, Sammel-PDF erneut importieren (gleichnamige
Sammlung), neuere und ältere Folgemeldung derselben Einheit, Absenderkarte setzen,
ändern, entfernen, „Jetzt" und „Beginn entfernen" beim Einsatzbeginn, Vorlage
speichern und ersetzen, „In Einsatz-Sammlung ablegen…", angefangene Erfassung mit
„Einheit manuell erfassen…", Übungsbogen öffnen bei vorhandenem Entwurf, „Namen
einfügen…", Person entfernen (Abstand zu ▲ und ⇑).

## Urteil

Die zerstörenden Handlungen sind auch in Runde 13 durchweg gut gesichert. Fast jede
Rückfrage nennt Name, Zahl und Folge, die gefährliche Taste steht 12 bis 16 px von
„Abbrechen" entfernt, und wo ohne Rückfrage gehandelt wird, liegt eine Quittung mit
„Rückgängig" am unteren Rand. Offen sind vier Ränder, alle ohne Datenverlust bei
Fremddaten. Der gewichtigste: „Beginn entfernen" löscht den Einsatzbeginn ohne
Rückfrage und ohne Rückgängig, während der Nachbarknopf „Jetzt" bei vorhandenem Beginn
sehr genau nachfragt. Alle Aufgaben ließen sich ohne fremde Hilfe erledigen.

## Behebungen aus Runde 12, die halten

- **R12-D1 „Vorhandene ersetzen" bei Vorlagen:** Rückfrage nennt „Vorhanden: 0 Personen,
  0 Fahrzeuge · dieser Bogen: …", erklärt die drei Wege einzeln; nach dem Ersetzen
  steht „Vorlage … ersetzt (vorher 0 Personen, 0 Fahrzeuge)." mit „Rückgängig". (Rand
  siehe R13-D4.)
- **R12-D2 Historie:** „Diese Fassung gilt…" und „Fassung verwerfen…" 154 × 44 und
  157 × 44, Lücke 12 px; „Änderungen" (96 × 44) und „Fassung verwerfen…" Lücke 11 px.
  Beide Rückfragen nennen Stand, Stärke und was gültig bleibt.
- **R12-D3 Geräteschlüssel ohne Schlüssel:** Dialog „Geräteschlüssel erzeugen?" nur mit
  dem ersten Satz („gelöscht wird nichts"), Knopf „Schlüssel jetzt erzeugen".
- **R12-W3 / R12-S1 / R12-G1 / R12-G2:** Übergabe-Text „Weitergegeben ist sie erst, wenn
  sie bei der Ablösung oder im Archiv angekommen ist"; „Alle Daten löschen" nennt die
  nicht exportierte Sammlung und bleibt bis zum Haken gesperrt; „Einen Moment …"-Schutz
  und Abrücken mit gesperrtem „✓ Abgerückt".
- **Datensicherung einspielen:** zählt Gerät und Datei gegeneinander auf, nennt, was die
  Fristen sofort wieder entfernen, und weist darauf hin, dass die laufenden Sammlungen
  ohne Papierkorb wegfallen.
- **Sammel-PDF erneut importieren:** Rückfrage „Es gibt schon eine Sammlung …" mit
  den Wegen „In die vorhandene Sammlung übernehmen" und „Als eigene Sammlung"; ältere
  Folgemeldung wird nur in die Historie gelegt und das gesagt.

## Befunde

### R13-D1 [P2] „Beginn entfernen" löscht den Einsatzbeginn ohne Rückfrage und ohne Rückgängig, „Jetzt" daneben fragt

**Kennzeichnung:** gemessen (Feldwert und Seitentext vor und nach dem Tipp).

**Fundstelle / Aufgabe:** Einsatzansicht → „Lagemonitor für den Fernseher" →
„Einsatzbeginn" → „Beginn entfernen".

**Beobachtung:** Bei eingetragenem Beginn (18:30 Uhr, 25.10.2026) steht „Beginn
entfernen" (141 × 44) 8 px rechts neben „Jetzt" (62 × 44). „Jetzt" fragt bei vorhandenem
Beginn nach („Einsatzbeginn überschreiben? … der alte Beginn ist danach nicht mehr
gespeichert", mit „Beginn behalten"). „Beginn entfernen" dagegen leert das Feld sofort:
Wert danach leer, kein Dialog, keine Quittung, kein „Rückgängig".

**Erwartung der Rolle:** Dasselbe Schutzniveau für beide Wege, den Beginn zu verlieren.
Wer „Jetzt" absichert, weil der alte Wert „nicht mehr gespeichert" ist, erwartet das
auch beim Entfernen.

**Auswirkung im Einsatz:** Der Beginn wird häufig mit „Jetzt" im Moment der Alarmierung
gesetzt und lässt sich nachträglich nur schätzen. Ein Fehltipp auf den Nachbarknopf mit
Handschuh setzt die Dauer auf dem Fernseher („seit Beginn: …") und im Lagebild auf
„kein Beginn". Die genaue Uhrzeit ist weg, ohne dass es auffällt.

**Empfehlung:** „Beginn entfernen" wie „Jetzt" mit Rückfrage absichern, die den
eingetragenen Wert nennt, oder mit „Rückgängig"-Quittung versehen; Knöpfe weiter
auseinanderrücken als 8 px.

**Nachprüfung:** Beginn eintragen, „Beginn entfernen" tippen: Rückfrage mit dem Wert
oder Quittung mit „Rückgängig", die den Wert zurückbringt.

### R13-D2 [P3] Absenderkarte: Felder leeren und „Übernehmen" löscht ohne die Rückfrage von „Angaben entfernen…"

**Kennzeichnung:** gemessen (Seitentext „Absender: keine Angabe", Speicherschlüssel).

**Fundstelle / Aufgabe:** Startseite → „Absender für übergebene Bögen" → „ändern".

**Beobachtung:** Im Bearbeiten-Formular gibt es „Angaben entfernen…" (334 × 45), das
nachfragt („Name, Rückrufnummer und E-Mail werden von diesem Gerät gelöscht. Künftig
übergebene Bögen tragen dann keine Absenderangaben mehr."). Werden stattdessen Name und
Telefon leer gemacht und „Übernehmen" getippt, steht danach „Absender: keine Angabe",
ohne Rückfrage und ohne Quittung; die Karte ist gelöscht.

**Erwartung der Rolle:** „Übernehmen" mit leeren Feldern ist dasselbe wie Entfernen und
sollte denselben Schutz haben (oder verweigert werden).

**Auswirkung im Einsatz:** Der Absender (Rückrufnummer für die Gegenstelle) fehlt auf
allen folgenden Bögen, bis jemand es merkt. Die Angaben sind schnell neu getippt, deshalb
nur P3.

**Empfehlung:** Leeres „Übernehmen" wie „Angaben entfernen…" behandeln (Rückfrage) oder mit
dem Hinweis „Alle Felder leer — Angaben entfernen?" abfangen.

**Nachprüfung:** Karte anlegen, Felder leeren, „Übernehmen": Rückfrage erscheint.

### R13-D3 [P3] „Aufteilen" mit allen Personen lässt eine leere Restmeldung zurück, die als Einheit mitzählt, und lässt den Bedarf bei ihr

**Kennzeichnung:** gemessen (Kopfzahlen und Kartentext nach dem Aufteilen).

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Mehr…" → „Aufteilen…" →
Bezeichnung „Alle", alle vier Einsatzkräfte ankreuzen → „Aufteilen".

**Beobachtung:** Es erscheint keine Rückfrage und kein Hinweis, dass nichts übrig bleibt.
Danach zeigt der Kopf „5 Einheiten" (vorher 4), die Liste „5 gemeldet · 5 zählend", Nr. 1
steht mit „Stärke 0 / 0 / 0 / 0", „Stärke fehlt" und „seit 17.07.2026, 08:05: Stärke
4 → 0"; der Diesel-Bedarf (80 l) bleibt bei Nr. 1, die neue Nr. 5 („Alle", 1 / 1 / 2 / 4)
hat keinen. Die Quittung nennt „abgeteilt. Später zurück über „Mehr…" › „Zusammenführen…"".

**Erwartung der Rolle:** Wer alle auswählt, will die Einheit umbenennen oder verlagern,
nicht eine zweite Einheit anlegen. Zumindest ein Satz „Es bleibt niemand übrig".

**Auswirkung im Einsatz:** Die Einheitenzahl im Kopf ist um eins zu hoch, eine leere
Meldung steht im Lageblatt, und der Bedarf liegt an der falschen Einheit. „Rückgängig"
ist da; der Fehler fällt erst beim Lesen der Summen auf. Daher nur P3.

**Empfehlung:** Bei „alle ausgewählt" die Rückfrage „Es bleibt niemand in „…" — stattdessen
umbenennen?" zeigen oder die Auswahl auf „alle außer einem" begrenzen; den Bedarf
im Aufteilen mit abfragen.

**Nachprüfung:** Alle Personen auswählen: Hinweis oder Sperre; Einheitenzahl bleibt
unverändert.

### R13-D4 [P3] Gegenüberstellung beim Ersetzen einer Vorlage zählt nur Personen und Fahrzeuge, nicht Ort, Auftrag und Einheitstyp

**Kennzeichnung:** gemessen (Rückfrage und Speicher `eeb.vorlagen.v1` nach dem Ersetzen).

**Fundstelle / Aufgabe:** Gesamtübersicht → „Als Vorlage speichern" → gleicher Name →
„Vorlage mit diesem Namen vorhanden".

**Beobachtung:** Vorhandene Vorlage mit Auftrag „Auftrag ALT wichtig", der ersetzende
Bogen mit leerem Auftrag. Die Rückfrage meldet „Vorhanden: 0 Personen, 0 Fahrzeuge ·
dieser Bogen: 0 Personen, 0 Fahrzeuge" — also scheinbar gleich. Nach „Vorhandene
ersetzen" steht im Speicher `ortAuftrag: ""`. „Rückgängig" ist vorhanden (Behebung von
R12-D1 hält).

**Erwartung der Rolle:** Wenn zwei „gleiche" Zahlen gezeigt werden, ändert sich nichts
Wichtiges. Der Auftragstext ist aber weg.

**Auswirkung im Einsatz:** Bei Vorlagen mit Auftrag, Ort oder Einheitstyp, aber wenigen
Personen wirkt die Rückfrage harmlos und verbirgt den Unterschied; wegen „Rückgängig"
bleibt es bei einer kleinen Unsicherheit.

**Empfehlung:** In der Gegenüberstellung auch Einheitstyp, Ort/Auftrag und Sofortbedarf
nennen oder bei Unterschieden „Auftrag: ‚…' → leer" einblenden.

**Nachprüfung:** Vorlage mit Auftrag speichern, Bogen mit leerem Auftrag unter gleichem
Namen speichern: Rückfrage nennt den Auftrag.

## Nicht prüfbar / nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, echte Handschuhe, native Builds, ein zweites Gerät.
Doppeltipp auf „Aufteilen" blieb unbestätigt (Skriptfehler im Prüfaufbau, kein
belegter Befund). Wechsel zwischen zwei Tabs im selben Profil nicht wiederholt.

## Aufgabe geschafft

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Beginn entfernen" wirkt wie ein Zurücksetzen der Anzeige, löscht aber die Alarmierungszeit ohne Rückweg.
- **Größtes Einsatzrisiko:** Die Einsatzbeginn-Zeit geht durch einen Fehltipp neben „Jetzt" unbemerkt verloren.
- **Top-Priorität für die nächste Iteration:** R13-D1, Rückfrage oder „Rückgängig" für „Beginn entfernen".
