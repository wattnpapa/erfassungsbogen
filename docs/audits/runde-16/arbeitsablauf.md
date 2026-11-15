# Prüfbericht Runde 16: Arbeitsablauf

- **Prüfer:** Rolle „Arbeitsablauf" (thw-workflow-reviewer), Helfer mit eigenem Bogen und Meldekopf-Bediener in einer Person
- **Datum:** 2026-10-26
- **Code-Stand:** Commit `36d549a` (`main` nach Runde 15), Produktionsbuild über `vite preview`, `http://localhost:4173`
- **Methode:** Playwright (globales Modul, Chromium ohne Optionen), `isMobile`/`hasTouch`, Locale de-DE, Viewports 390 x 844 und 360 x 640, keine Kamera. Zustände über echte Bedienung und Dateiimport; als Bögen dienten die Übungsbögen aus `examples/thw/` mit `uebung: false` und aktuellem Stand. Kein Code geändert.
- **Zählung:** P0: 0 · P1: 0 · P2: 0 · P3: 3

Nicht neu gemeldet wurden die in der Aufgabe genannten bekannten Grenzen (R15-E1, R15-E2, R15-D4, R15-S4, R15-M2, R15-O1 und die älteren Listen). Nicht prüfbar waren Kamera-Scan, Nahbereichs-Weitergabe, die Bildschirmtastatur, echte Handschuhe und die nativen Builds.

## Urteil aus Sicht der Rolle

Erwartete Arbeitsfolge (Annahme, kein bekannter THW-Vorschrifttext): Ein Helfer füllt für seine Einheit den Bogen aus und übergibt ihn (Datei, Link, QR). Der Meldekopf legt einen Einsatz an, nimmt die Bögen auf, ergänzt Zug und Auftrag, rückt Einheiten ab, gibt die Lage an eine Ablösung oder den Stab weiter (Sammel-PDF, Lageblatt, Nachtrag) und kann nach einer Unterbrechung nahtlos weiterarbeiten.

Der Ablauf trägt. Alle Teilstrecken ließen sich ohne fremde Hilfe durchlaufen, ohne doppelte Eingabe und ohne Datenverlust. Reibung entsteht nur an drei Stellen von geringer Schwere (unten).

Durchlaufene Strecken, alle im echten Browser:

1. **Einsatz anlegen und Bögen aufnehmen.** Vier, sechs und dreißig Bögen in einem Zug aus Dateien (30 Dateien in 1,1 s). Die Meldung „n Bögen aufgenommen“ nennt die Eintreffzeit-Regel; bei sechs und mehr neuen Einheiten erscheint die Kurzfassung mit „Zur Liste springen“ (27 Einheiten, 8 495 px Seitenhöhe bei 360 x 640 bleiben bedienbar). Drei der 30 Dateien waren Folgemeldungen derselben Einheiten und wurden als „neue Fassung“ gezählt, nicht verdoppelt.
2. **Zug zuordnen, Abrücken, Auftrag.** Sammelzuordnung und Abrücken quittieren mit Uhrzeit und „Rückgängig“; Summen und Bedarf ziehen sofort nach (4 auf 3 zählende Einheiten, Verpflegung 37 auf 26).
3. **Übergabe an ein zweites Gerät.** „Einsatz weitergeben / sichern“ erzeugt die Sammel-PDF (4 s bei vier Bögen). Auf einem leeren zweiten Gerät übernimmt „Einsatz importieren…“ sie vollständig: 4 Einheiten, davon 3 anwesend, die abgerückte Einheit als „ABGERÜCKT“. Erneutes Einlesen derselben Datei meldet „keine neue Einheit … Datei war älter oder gleich: keine Änderung übernommen“; im Kopf steht „Weitergabe-Datei erzeugt … Empfang nicht bestätigt, seitdem hier nichts Neues.“
4. **Zusammenführung zweier Geräte.** Gerät A rückt Einheit 1 ab, Gerät B später Einheit 2; B liest A’s neuere Datei ein. Ergebnis: „1 Meldung aktualisiert: Albstadt abgerückt 16:05“, beide Einheiten stehen auf abgerückt, nichts ging verloren.
5. **Folgemeldung nach Abrücken.** Eine Einheit, die abgerückt war und eine neuere Fassung (Stärke 11 auf 9) einreicht, wird mit „wieder anwesend – war abgerückt seit …, zählt wieder mit“ und der Stärkeänderung gemeldet.
6. **Eigener Bogen und Übergabe.** Assistent Schritt 1 bis 6 bei 360 x 640, „Bogen übergeben…“ mit QR, PDF, Link; „Link teilen“ erzeugt die Quittung „Link geteilt … Empfang nicht bestätigt“. Öffnet der Meldekopf diesen Link, fragt die App „Wohin damit?“ und bietet „In „Hochwasser Weser“ aufnehmen“ vor „Bogen öffnen“ an.
7. **Unterbrechung.** Neuladen im Einsatz öffnet denselben Einsatz mit den offenen Meldungen; Neuladen mitten im eigenen Bogen zeigt die Startseite mit „Fortsetzen / Verwerfen“ und „Entwurf … wiederhergestellt“.
8. **Aufnahme am Meldekopf von Hand.** Aus der Einsatzansicht: Kopf „‹ Einsatz …“, Marke „Aufnahme für: …“, „In Einsatz übernehmen“ auf jedem Schritt. Von der Startseite: „Einheit schnell erfassen“ fragt „für welche Sammlung?“, legt nach „Nur Stärke“ in die Sammlung ab und nennt „Zuletzt abgelegt: „THW Ulm“ · jetzt 2 Einheiten, Gesamt 13“; Verpflegung wird ehrlich als „Bedarf nicht erfasst“ geführt.
9. **Weitergabe an den Stab.** Lageblatt (A4 quer, 0,7 s bei sechs Einheiten) mit Funkrufname, Rückruf, Eintreffzeit mit „*“, Bedarf, Summenzeile und Zeilen für den Handnachtrag. „Nur neue Bögen seit dem letzten Export“ liefert eine CSV mit genau der einen neuen Einheit, Summe „Nachtrag“ und der Zeile „NACHTRAG seit …“.

## Haltbarkeit der Behebungen aus Runde 15 im echten Browser

| Befund | Ergebnis |
| --- | --- |
| R15-W1 Doppelempfang | hält: Quittung „keine neue Einheit … Datei war älter oder gleich“ im Bild |
| R15-W3 Auftrag mit Rückgängig | hält: Auftragsfeld speichert mit „Speichern/Abbrechen“; Zug- und Abrückquittung mit „Rückgängig“ |
| R15-A5 Quittung „Bogen als PDF“ | hält: „Bogen als PDF erzeugt (neuer Tab oder Download-Ordner)“ in der Karte |
| R15-S2 Kurzfassung ab sechs neuen Einheiten | hält: „27 Einheiten ohne Einzelsatz, siehe Liste“, „Alle 27 einzeln anzeigen“ |
| R15-D1 nur die jüngste Quittung | hält: neue Quittung ersetzt die alte |
| R15-N1 Fahrzeuge auf „k. A.“ | hält: Ausstattungsfeld startet auf „k. A.“, Warnung „Fahrzeug 1 hat noch kein Kennzeichen“ |
| R15-A1 bis A3 Eintreffzeit | hält: „Eintreffzeit … ist die Zeit des Einlesens (Lageblatt: *)“, „*“ im Lageblatt |
| R15-S1 Doppeltipp-Sperre | hält: Tipp unmittelbar nach Dialogöffnung zeigt „Einen Moment …“, danach normal |

## Befunde

### R16-W1 [P3] Die Quittungsleiste mit „Rückgängig“ bleibt unbegrenzt stehen und belegt bei 360 x 640 rund ein Viertel des Bildes

- **Ort:** Einsatzansicht, unterer Bildrand (Quittungsleiste `quittung-mehrzeilig` über dem Ansichts-Balken), nach „Abrücken“, „Zur Kenntnis genommen“, „Zug zuordnen“.
- **Beobachtung:** Gemessen bei 360 x 640: Quittung 108 px hoch (Oberkante 463) plus Ansichts-Balken 57 px, zusammen 165 von 640 px (26 Prozent). Die Quittung ist nach 5, 12, 30, 60 und 100 s unverändert da und bleibt auch nach Bildlauf stehen; nur ✕ oder die nächste Aktion beseitigt sie. In der Tabellenansicht liegen dadurch die Zeilen 5 und 6 unter der Leiste, in der aufgeklappten Karte „Mehr…“ und „Historie“ (Screenshot nach „Abrücken“). In Runde 15 wurde die Verdeckung als „kurzzeitig“ gewertet; das trifft für den jetzigen Stand nicht zu.
- **Folge:** Der Meldekopf arbeitet minutenlang auf drei Vierteln des Bildes, obwohl die Quittung nach wenigen Sekunden gelesen ist. Bei einer langen Liste kostet das zusätzliche Bildläufe; die Gefahr einer Fehlbedienung besteht nicht, weil „Rückgängig“ nur die jüngste Aktion zurücknimmt.
- **Empfehlung:** Nach einer Wartezeit (etwa 15 bis 20 s) auf eine einzeilige Marke („Rückgängig: Abgerückt 15:47“) einklappen, oder beim Bildlauf nach unten ausblenden; bei der Kenntnisnahme ganz auf Dauerleiste verzichten.
- **Verifikation:** 360 x 640, Einsatz mit drei Bögen, „Abrücken“, 30 s warten: belegte Höhe am unteren Rand unter 100 px; Tabellenzeilen und „Mehr…“ erreichbar.

### R16-W2 [P3] Im Nachtrag-Modus tragen die CSV- und Excel-Knöpfe dieselbe Beschriftung wie der Vollexport

- **Ort:** Einsatzansicht, „Weitergeben, Lageblatt, Export“, Häkchen „Nur neue Bögen seit dem letzten Export“, Knöpfe „Übersicht als CSV“, „Alle Daten als CSV“, „Excel-Liste (Format „Oldenburg“)“.
- **Beobachtung:** Der Sammel-PDF-Knopf wechselt beschriftet auf „Sammel-PDF (erste Lieferung: alle Bögen)“. Die drei anderen Knöpfe heißen im Nachtrag-Modus unverändert; der Hinweis steht nur in der Zeile darüber („Übersicht als CSV: zuletzt erzeugt 15:57 · seitdem 1 neuer Bogen“). Nach einer ersten CSV und einem neuen Bogen (4 Einheiten im Einsatz) liefert „Übersicht als CSV“ eine Datei `eeb-einsatz-nachtrag-seit-20261026-1614-…csv` mit nur der einen neuen Einheit; der Hinweis „NACHTRAG seit …“ steht als letzte Zeile unterhalb der Summe.
- **Folge:** Wer das Häkchen vergessen hat zu prüfen oder nur auf die Knöpfe schaut, hält die Datei für die ganze Lage. Beim Stab zählt eine Datei mit einer von vier Einheiten dann als Stand. Dateiname und Summenzeile mildern das, werden aber erst nach dem Öffnen gesehen.
- **Empfehlung:** Knöpfe im Nachtrag-Modus benennen wie den PDF-Knopf, etwa „Nachtrag als CSV (1 neue Einheit)“, und den Hinweis an den Anfang der Datei setzen.
- **Verifikation:** Häkchen setzen, erste CSV erzeugen, einen Bogen einlesen: Knopfbeschriftung nennt Nachtrag und Zahl; Dateikopf nennt „NACHTRAG“ in der ersten Zeile.

### R16-W3 [P3] In der Einsatzansicht fehlt der kurze Weg „nur Stärke“, den die Startseite bietet

- **Ort:** Einsatzansicht, „Einheit manuell erfassen…“ gegenüber Startseite „Einheit schnell erfassen (nur Stärke)…“.
- **Beobachtung:** Die Startseite führt nach der Sammlungsfrage in die Schnellerfassung; Schritt 2 ist dort markiert und übersprungen (Reiter „2 –“), Schritt 3 steht schon auf „Nur Stärke“. Aus der Einsatzansicht öffnet „Einheit manuell erfassen…“ dagegen den vollen Assistenten: Schritt 1, dann Schritt 2 „Einsatz“ mit Zeitraum, Beginn, Ende und Ortswarnung, dann Schritt 3 mit „Personal vollständig erfassen“ als Vorgabe; „Nur Stärke“ muss erst von Hand umgestellt werden. Wer im Einsatz steht, geht für den kurzen Weg über „‹ Startseite“ und den Sammlungsdialog.
- **Folge:** Bei vielen Einheiten, die mit einem Zettel eintreffen, nimmt der Meldekopf zwei Zwischenschritte mehr in Kauf oder verlässt die Einsatzansicht. Die Eintreffzeit steht dabei in Schritt 1 (Marke „Angaben vom Zettel“), sodass der volle Weg nicht falsch, nur länger ist.
- **Empfehlung:** In der Einsatzansicht neben „Einheit manuell erfassen…“ den Knopf „Einheit schnell erfassen (nur Stärke)…“ mit der Sammlung des geöffneten Einsatzes vorbelegt anbieten, oder „manuell erfassen“ mit Auswahl „nur Stärke / vollständig“ starten.
- **Verifikation:** Aus der Einsatzansicht bis zur abgelegten Einheit zählen: Ort, Stärke, „In Einsatz übernehmen“ ohne Schritt 2 und ohne Umschalten.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Nachtrag-Knöpfe sehen wie Vollexporte aus (R16-W2).
- **Größtes Einsatzrisiko:** Eine Teildatei im Nachtrag-Modus wird als vollständige Lage weitergegeben (R16-W2); Datenverlust oder Statusfehler wurden in keinem Ablauf beobachtet.
- **Top-Priorität für die nächste Iteration:** R16-W2, Nachtrag-Knöpfe benennen und den Hinweis an den Dateianfang setzen.
