# Audit „Zerstörende Handlungen", Runde 12 (Löschen, Überschreiben, Statuswechsel)

Prüfer: Rollenaudit `thw-destructive-action-reviewer` · Datum: 2026-10-26 ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Code-Stand
Commit `2c96abe` (`main` nach Runde 11).

**Zählung: P0 0 · P1 0 · P2 1 · P3 2** (R12-D1 bis R12-D3).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md` und
`docs/audits/runde-11/README.md`. Die dort geführten bekannten Grenzen (R6-O9, R7-G4/M8,
R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, leere Karten bei „Nur
Stärke", Rückgängig für Meldungen überlebt Neuladen nicht, Tabellenzeilenhöhe bei
180x320, R11-S4, R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3) sind nicht erneut
gemeldet. Der „Einen Moment …"-Schutz, der einen Tipp in den ersten Zehntelsekunden
nach dem Öffnen einer Rückfrage verwirft, ist R8-H5/S4 und wurde nicht gezählt.

## Prüfaufbau

Chromium über das globale `playwright`-Modul, `chromium.launch()` ohne Optionen,
`isMobile`/`hasTouch`, Locale de-DE, Tipps als Touch-Tipp. Viewports 390 × 844 und
360 × 640. Zustände über die Bedienung der App: Einsatz-Sammlung anlegen, vier
THW-Übungsbögen aus `examples/thw/` (mit `uebung: false`) über „Bögen einlesen…"
aufnehmen, Datensicherung als echte Datei erzeugen und wieder einspielen. Kein
Kamera-Scan, keine Handschuhe, keine nativen Builds, kein Zweitgerät.

Durchgespielt: „Zur Kenntnis genommen", Abrücken und „Wieder anwesend" (auch mit
Doppeltipp in 100 bis 1 100 ms Abstand), „Entfernen" (einzeln, zweimal hintereinander,
Rückgängig nach Seitenwechsel), „Stärke ändern…" (leer, 0/0/0, 200), Historie mit
„Diese Fassung gilt…" und „Fassung verwerfen…", „Verschieben…" ohne zweite Sammlung,
Einsatz löschen, Papierkorb, „Endgültig löschen…", gleichnamiger Einsatz im
Papierkorb und „Wiederherstellen", „Alle Daten löschen", „Geräteschlüssel neu
erzeugen…" (mit und ohne vorhandenen Schlüssel), Datensicherung einspielen über
eine abweichende Sammlung, Bogen schließen / zurückholen / verwerfen / „Neuen Bogen
erstellen" / „Aus Datei laden…" bei vorhandenem Entwurf und geschlossenem Bogen,
leerer Entwurf gegen geschlossenen Bogen, „Als Vorlage speichern" (gleicher Name),
Vorlage bearbeiten und „Einsatz vorbereiten" bei vorhandenem Entwurf, Person
entfernen (erste Person), „Nur Stärke" hin und zurück, Einheitstyp- und
Organisationswechsel mit Personal, „Einheit schnell erfassen" mit Sammlung.

## Urteil

Die zerstörenden Handlungen sind auch in dieser Runde durchweg gut gesichert. Fast jede
Rückfrage nennt Name, Zahl und Folge, die gefährliche Taste steht mit 12 bis 16 px
Abstand von „Abbrechen", und wo etwas ohne Rückfrage geschieht, liegt eine
„Rückgängig"-Quittung am unteren Rand. Besonders gelungen: der Geräteschlüssel-Dialog
mit Sicherungsweg, das Einspielen einer Sicherung (zählt auf, was auf dem Gerät und
was in der Datei steht, und nennt vorab, was die Fristen sofort wieder entfernen), die
Rückfragen bei „Zuletzt geschlossener Bogen fasst nur einen Bogen" und die
Stärke-Rückfragen („200 Mannschaft, mehr als das Dreifache"). Offen sind drei Ränder.
Der gewichtigste: „Vorhandene ersetzen" beim Speichern einer Vorlage überschreibt eine
Vorlage ohne Gegenüberstellung und ohne Rückweg, während „Löschen" derselben Vorlage
einen Papierkorb hat. Alle Aufgaben ließen sich ohne fremde Hilfe erledigen.

## Behebungen aus Runde 11, die halten

- **R11-D1 „Zur Kenntnis genommen":** beide Knöpfe 44 px hoch, 8 px Abstand; der Tipp
  zeigt „Zur Kenntnis genommen · 4 Einheiten" mit „Rückgängig" (121 × 44) und „✕"; die
  Quittung bleibt mindestens 20 s und gibt die „neu"-Marken zurück.
- **Erste Person entfernen:** Rückfrage der ersten Person
  nennt den Namen und „OHNE Erreichbarkeit: der Bogen hätte dann keine Rückrufnummer".
- **Wiederherstellen aus dem Papierkorb:** bei gleichnamigem Einsatz erscheint „Zwei Sammlungen
  gleichen Namens" mit Unterscheidung nach Anlagezeit und Meldungszahl.
- **Abrücken:** nach dem Tipp steht für kurze Zeit „✓ Abgerückt" gesperrt im selben
  Feld, danach „Wieder anwesend"; ein Doppeltipp in jedem geprüften Abstand ergibt
  genau eine Abrückung.
- **„Entfernen" zweimal hintereinander:** die Quittung führt beide („· davor noch 1
  entfernt") und überlebt den Wechsel zur Startseite und zurück.

## Befunde

### R12-D1 [P2] Beim Speichern einer Vorlage überschreibt „Vorhandene ersetzen" eine Vorlage ohne Gegenüberstellung und ohne Rückweg

**Kennzeichnung:** gemessen (Speicher `eeb.vorlagen.v1` vor und nach dem Tipp).

**Fundstelle / Aufgabe:** Gesamtübersicht (Schritt 6) → „Als Vorlage speichern" →
Name unverändert lassen → „Vorlage speichern" → Rückfrage „Vorlage mit diesem Namen
vorhanden".

**Beobachtung:** Die Rückfrage nennt Name und Zeitpunkt der vorhandenen Vorlage („gespeichert
26.10.2026, 03:31 Uhr") und bietet „Zusätzlich anlegen", „Vorhandene ersetzen" und
„Abbrechen" (je 332 × 44, 12 bis 16 px Abstand). Sie sagt nicht, was sich ändert.
Gemessener Fall: Die vorhandene Vorlage hatte 4 Personen. Der Bogen, der sie ersetzt,
hatte nach „4 leere Plätze entfernen" 0 Personen. Nach „Vorhandene ersetzen" stand im
Speicher dieselbe Vorlage mit `personal = 0`. Es erschien nur die Statuszeile „Als
Vorlage … gespeichert." — keine Quittung mit „Rückgängig", und auf der Startseite gibt es
danach keinen „Papierkorb Vorlagen", in dem die alte Fassung läge. Dagegen hat
„Löschen" derselben Vorlage einen Papierkorb mit Rückgängig (D6 aus Runde 1).

**Erwartung der Rolle:** Wer eine Vorlage mit gleichem Namen speichert, will meist
„aktualisieren" und rechnet damit, dass die alte Fassung nicht spurlos weg ist, wie beim
Löschen. Die Rückfrage sollte zeigen, was verloren geht.

**Auswirkung im Einsatz:** Eine über Monate gepflegte Vorlage (Personal mit
Fahrerlaubnissen, Fahrzeuge mit Funkrufnamen) wird durch einen halb ausgefüllten oder
bewusst gekürzten Bogen ersetzt. Beim nächsten „Einsatz vorbereiten" fehlen Leute und
Fahrzeuge, und es merkt es niemand, bis die Vorlage gebraucht wird. Wiederherstellen
geht nur aus einer Datensicherung.

**Empfehlung:** In der Rückfrage die Zahlen beider Seiten nebeneinanderstellen („vorhanden:
4 Personen, 1 Fahrzeug · dieser Bogen: 0 Personen, 1 Fahrzeug"), „Vorhandene ersetzen"
mit „Rückgängig" quittieren und die ersetzte Fassung wie eine gelöschte in den
Papierkorb legen.

**Nachprüfung:** Vorlage mit 4 Personen speichern, Bogen auf 0 Personen kürzen, erneut
unter gleichem Namen speichern: Die Rückfrage nennt „4 → 0 Personen"; nach dem Ersetzen
bringt „Rückgängig" oder der Papierkorb die 4 Personen zurück.

### R12-D2 [P3] In der Historie stehen „Diese Fassung gilt…" und „Fassung verwerfen…" als 33-Pixel-Textknöpfe ohne Abstand übereinander

**Kennzeichnung:** gemessen (`getBoundingClientRect`, 390 × 844).

**Fundstelle / Aufgabe:** Einsatzansicht → Karte aufklappen → „Historie" → Eintrag einer
älteren Fassung (nach „Stärke ändern…").

**Beobachtung:** „Diese Fassung gilt…" (146 × 33, y 585) und darunter „Fassung
verwerfen…" (149 × 33, y 618) berühren sich (Lücke 0 px). Beim aktuellen Eintrag stehen
„Änderungen" (88 × 33) und „Fassung verwerfen…" (149 × 33) nebeneinander mit 3 px Lücke.
Beide Handlungen sind folgenreich (andere Fassung gilt für Stärke, Zeiten und Auftrag;
Fassung weg). Beide sind durch eine spezifische Rückfrage gesichert („Gültig ist dann
wieder Stand 17.07.2026, 08:05 mit Stärke 1 / 1 / 2 / 4 — samt deren Zeiten und
Auftrag"), das Verwerfen der älteren Fassung nennt, dass die aktuelle gültig bleibt.

**Erwartung der Rolle:** Knöpfe in der Größe der übrigen Aktionsknöpfe (44 px) und mit
Abstand, wenn ein Fehltipp die Lage ändert.

**Auswirkung im Einsatz:** Im Handschuh fällt der Tipp leicht auf den Nachbarn. Weil
die Rückfrage danach den Fehlgriff verrät, bleibt es bei einem zusätzlichen Tipp und
einem „Abbrechen"; deshalb nur P3.

**Empfehlung:** Die vier Historie-Aktionen als Knöpfe mit 44 px Höhe und 8 px Abstand
setzen, „Fassung verwerfen…" optisch als abgerückte, rote Handlung.

**Nachprüfung:** Historie öffnen, Zielmaße und Lücke messen: mindestens 44 px, 8 px.

### R12-D3 [P3] Rückfrage „Geräteschlüssel neu erzeugen?" ohne vorhandenen Schlüssel widerspricht sich

**Kennzeichnung:** beobachtet (Dialogtext mit und ohne Schlüssel verglichen).

**Fundstelle / Aufgabe:** Startseite → Fußzeile → „Geräteschlüssel neu erzeugen".

**Beobachtung:** Auf einem Gerät ohne Schlüssel (frische Installation, noch nichts
übergeben) beginnt der Text „Auf diesem Gerät liegt noch kein Signaturschlüssel; es wird
ein neues Schlüsselpaar erzeugt, gelöscht wird nichts." und fährt dann mit den
Absätzen für den Austausch fort: „Sinnvoll ist das bei Verdacht, dass der private Schlüssel
in fremde Hände geraten ist …", „Empfänger müssen die Kurzform danach neu abgleichen …
Bereits verschickte Bögen bleiben gültig … nur gegen den alten öffentlichen Schlüssel,
und der lässt sich danach nur aus einer früheren Sicherungsdatei wiederherstellen".
Der Knopf „Neu erzeugen" ist rot (Gefahr). Mit vorhandenem Schlüssel (nach dem Öffnen
der Übersicht) stimmt der Text, dort kommt auch „Vorher Sicherung erstellen…".

**Erwartung der Rolle:** Bei „gelöscht wird nichts" keine Warnung vor einem alten Schlüssel,
der gar nicht existiert, und kein roter Gefahrenknopf.

**Auswirkung im Einsatz:** Wer die Schlüsselfrage vorsorglich antippt, liest eine
Warnung über etwas, das nicht eintritt, und fragt sich, ob schon Bögen verschickt sind.
Kein Datenverlust; kostet Aufmerksamkeit.

**Empfehlung:** Ohne Schlüssel nur den ersten Satz und eine neutrale Beschriftung („Schlüssel
jetzt erzeugen") zeigen; die Absätze zu Kurzform und altem Schlüssel erst, wenn einer
existiert.

**Nachprüfung:** Frisches Profil, Dialog öffnen: kein Verweis auf den „alten" Schlüssel
und kein roter Knopf; nach der ersten Übergabe erscheinen beide Absätze.

## Nicht prüfbar / nicht geprüft

Kamera-Scan, Nahbereichs-Weitergabe, echte Handschuhe, native Builds, ein zweites
Gerät. Der Wechsel zwischen zwei Tabs im selben Profil wurde in dieser Runde nicht
wiederholt (Runde 11: unauffällig).

## Aufgabe geschafft

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Vorhandene ersetzen" wirkt wie ein Aktualisieren, ist aber ein endgültiges Überschreiben der Vorlage.
- **Größtes Einsatzrisiko:** Eine gepflegte Vorlage wird durch einen gekürzten Bogen ersetzt und fehlt unbemerkt beim nächsten Einsatz.
- **Top-Priorität für die nächste Iteration:** R12-D1, Rückfrage mit Gegenüberstellung und Rückweg für „Vorhandene ersetzen".
