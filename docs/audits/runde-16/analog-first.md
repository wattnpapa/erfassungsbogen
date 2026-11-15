# Audit „Analog first", Runde 16 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-26 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `36d549a` (`main` nach Runde 15).

Zählung: **P0 0 · P1 0 · P2 1 · P3 2** (3 Befunde, neu).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, `runde-15/README.md`,
`runde-14/README.md`, `runde-13/README.md` sowie `runde-15/analog-first.md`. Alles, was dort oder in der Aufgabe als
bekannte Grenze steht (u. a. R15-E1, R15-E2, R15-D4, R15-S4, R15-M2, R15-O1), ist nicht erneut gemeldet.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales Playwright-Modul), `isMobile`/`hasTouch`, Locale
de-DE, Telefon 390 × 844 (Hauptlauf) und 360 × 640 (Dateiimport-Fehlertexte), jeweils frischer Kontext. Einsatz-Sammlung
mit 3, 4 und 12 THW-Übungsbögen aus `examples/thw/` (auf `uebung: false`, Stand 30 bis 210 Minuten alt, Zeitraum
heute), eingelesen als JSON-Dateien und als PNG-Fotos der gedruckten Sammel-PDF (150 dpi). Durchgespielt:

- „Stärke ändern…" (11 → 8), „Abrücken", „Zug für alle", Lageblatt (3, 4 und 12 Einheiten, zwei Seiten), Sammel-PDF,
  Übersicht-CSV, Alle-Daten-CSV, Excel-Liste „Oldenburg"; PDFs mit `pdftotext -layout`, `pdfinfo`, `pdftoppm`, die
  Excel-Datei durch Entpacken und Lesen des Tabellenblatts geprüft.
- Papierweg: Seiten 2 bis 8 der Sammel-PDF als Fotos eingelesen, „Lage vom Papier abgleichen…" mit Nr., Zug und zweiter
  Nr. ausgefüllt, Zwischenstand in einen neuen Browserkontext mit übernommenem `localStorage` getragen (Browser neu).
- „Bogen als PDF" (Einzelbogen) mit Auffangen von neuem Tab und Download; Blanko-Vordruck von der Startseite;
  Nachtrag „Nur neue Bögen seit dem letzten Export" nach einer Weitergabe.
- Falsche Dateien in „Einsatz importieren…": Lageblatt-PDF, CSV, Excel.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; das Lageblatt hängt an der Wand; Excel- und CSV-Liste
gehen an den Stab und werden dort ohne die App weiterverarbeitet.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle,
PDF-Anzeige in Android-Chrome. Hinweise „Anderer Einsatz?", „Kennzeichen doppelt", „Stand vor …" bei den Übungsbögen
sind Seed-Artefakte und nicht gewertet.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, Dateiinhalt); *beobachtet* = gesehen.

## Urteil

Die Papierseite hält. Alle Behebungen aus Runde 15, die ich gegen den Browser geprüft habe, tragen: Lageblatt und
Sammel-PDF kennzeichnen die Eintreffzeit auch nach „Stärke ändern…" (Stern, Fußnote), Seite 1 der Sammel-PDF trägt
Stern und Fußnote, der Einzelbogen kreuzt „von Hand geändert" an und vermerkt „Stärke am Meldekopf auf 8 korrigiert …
die Namensliste führt 11 und ist nicht angepasst", der Zwischenstand des Papierabgleichs übersteht einen Browserneustart,
und „Bogen als PDF" quittiert in der App und im Tab. Falsche Dateien (Lageblatt, CSV) werden mit einem Satz abgelehnt,
der den richtigen Weg nennt. Der Blanko-Vordruck hat Meldekopf-Zeile, Blattzählung und Platz-Hinweis. Reibung entsteht
an der Grenze zum Stab, wo Excel und CSV das nicht mitbringen, was das Papier sagt.

## Prüfung der Behebungen aus Runde 15

| Befund | Ergebnis |
| --- | --- |
| R15-A1 Stern nach „Stärke ändern…" | hält (gemessen): Nr. 2 nach 11 → 8 weiter „17:10 *" auf Lageblatt und Sammel-PDF |
| R15-A2 Seite 1 der Sammel-PDF | hält: „17:13 *" je Zeile, Fußnote „Eintreffzeit = Zeit des Einlesens am Gerät …" |
| R15-A3 Einzelbogen nach Stärkekorrektur | hält: Kästchen „[X] von Hand geändert", Vermerk in „Sonstiges" |
| R15-A4 Papierabgleich nur im Fenster | hält: Eingaben nach Neustart da, Hinweis „höchstens drei Tage". Der Text im Formular widerspricht (R16-A2) |
| R15-A5 „Bogen als PDF" ohne Quittung | hält: „✓ Bogen als PDF erzeugt …"; Tab nach 2,5 s „Fertig — der Bogen liegt im Download-Ordner" |
| R15-E3/E4 u. a. | nicht Gegenstand dieser Rolle, nicht geprüft |

## Befunde

### R16-A1 [P2] Excel-Liste und Übersicht-CSV tragen weder Einsatzname noch Erstellzeit noch die Kennzeichnung der Eintreffzeit; die Dateinamen haben keine Zeitangabe

- **Ort:** Einsatzansicht → „Excel-Liste (Format „Oldenburg")" und „Übersicht als CSV"; zum Vergleich Lageblatt und Sammel-PDF.
- **Beobachtung (gemessen):** Drei Bögen eingelesen, einer abgerückt, vier Exporte erzeugt. Lageblatt und Sammel-PDF
  tragen im Kopf „Erstellt 26.10.2026, 17:16", den Einsatznamen, bei jeder Eintreffzeit den Stern und die Fußnote
  „Eintreffzeit = Zeit des Einlesens am Gerät, nicht vom Absender oder Meldeblock bestätigt"; die Dateien heißen
  `eeb-lageblatt-261716okt26_Hochwasser_Test.pdf`, also mit Datum-Zeit-Gruppe. Die Excel-Datei
  (`eeb-einsatz-Hochwasser_Test-oldenburg.xlsx`) enthält den Einsatznamen nirgends (Blatt „Tabelle1", keine Zelle mit
  „Hochwasser Test"), keine Erstellzeit und keinen Hinweis zur Zeit; die Spalte „eingetr. / zugew." steht bei allen drei
  Einheiten auf derselben Minute (17:16, dem Einlesen) als gewöhnliches Datum. Die Übersicht-CSV hat die Spalten
  „Eingetroffen" und „Empfangen" (beide 17:16) ohne Hinweis; der Dateiname `eeb-einsatz-Hochwasser_Test.csv` hat keine
  Zeitgruppe, ein zweiter Export derselben Lage heißt gleich (der Browser hängt „(1)" an). Die Alle-Daten-CSV nennt
  immerhin den Einsatz, hat aber ebenfalls keine Erstellzeit.
- **Erwartung der Rolle:** Was an den Stab geht, sagt wie das Papier, wann es erzeugt wurde, zu welcher Lage es gehört und
  welche Zeiten nur Eingangszeiten des Geräts sind. Zwei Dateien vom selben Tag lassen sich an Namen oder Kopf ordnen.
- **Folge im Einsatz:** Der Stab bekommt die Liste ohne das Papier. Die Eintreffzeit des Einlesens steht dort wie eine
  geprüfte Ankunftszeit, genau die Verwechslung, gegen die Lageblatt und Sammel-PDF seit Runde 14 kennzeichnen. Wer nach
  einer Schichtübergabe zwei „eeb-einsatz-…csv" im Download-Ordner hat, kann nicht sagen, welche die neuere ist; ein
  Excel ohne Einsatznamen lässt sich nicht einer Lage zuordnen, wenn mehrere Sammlungen geführt werden.
- **Empfehlung:** Excel und CSV bekommen dieselbe Information wie das Papier: Einsatzname und Erstellzeit in den Kopf
  bzw. in eine Kopfzeile, die Eintreffzeit mit derselben Kennzeichnung (Zusatzspalte oder Fußnotenzeile) und Dateinamen
  mit der Datum-Zeit-Gruppe wie bei den PDFs.
- **Verifikation:** Drei Bögen einlesen, Excel und beide CSV erzeugen: jede Datei nennt Einsatz und Erstellzeit, die
  Eintreffzeit der eingelesenen Einheiten ist als „nicht bestätigt" erkennbar, zwei Exporte im Abstand einer Minute
  haben verschiedene Dateinamen.

### R16-A2 [P3] Im Formular „Lage vom Papier abgleichen" steht „Eingaben bleiben für diese Sitzung erhalten", tatsächlich bleiben sie bis zu drei Tage

- **Ort:** „Lage vom Papier abgleichen…" → Zeile unter den Knöpfen („Später").
- **Beobachtung (gemessen):** Das Formular sagt „„Später" schließt nur das Formular; die Eingaben bleiben für diese
  Sitzung erhalten." Die Karte darüber sagt nach dem Schließen: „auf diesem Gerät, bis du sie übernimmst, höchstens drei
  Tage". Nach Neustart des Browsers (neuer Kontext mit übernommenem `localStorage`) waren die Eingaben für zwei Einheiten
  wieder da; der Schlüssel `eeb.papierabgleich.v1.<Einsatz-ID>` liegt im `localStorage`. Der Text im Formular ist der
  Stand vor der Behebung von R15-A4; der Kommentar in `papier-abgleich-entwurf.ts` nennt ebenfalls noch den
  Sitzungsspeicher.
- **Erwartung der Rolle:** Ein Hinweis, der das Verhalten richtig beschreibt. „Diese Sitzung" liest ein Helfer als
  „bis ich den Tab schließe" und tippt vorsichtshalber vorher alles ab oder lässt es liegen.
- **Folge im Einsatz:** Kein Datenverlust; aber zwei Sätze derselben Maske sagen Verschiedenes, und der strengere
  (falsche) steht dort, wo der Helfer entscheidet, ob er jetzt unterbricht.
- **Empfehlung:** Beide Stellen gleich formulieren, z. B. „Eingaben bleiben auf diesem Gerät erhalten, bis du sie übernimmst
  oder verwirfst (höchstens drei Tage)."
- **Verifikation:** Formular öffnen: der Satz unter „Später" und der Satz in der Karte nennen dieselbe Dauer.

### R16-A3 [P3] Der Einzelbogen („Bogen als PDF") landet unter einem Zufallsnamen im Download-Ordner

- **Ort:** Karte → „Bogen als PDF".
- **Beobachtung (beobachtet, Testbrowser ohne PDF-Anzeige):** Der Download hieß
  `b839332f-cdf4-45de-b109-18aa0ff9f0f8.pdf`. Die Sammel-PDF heißt dagegen `eeb-einsatz-261713okt26_Hochwasser_Test.pdf`,
  das Lageblatt `eeb-lageblatt-261716okt26_…`. Im Quelltext (`meldungPdfAnzeigen`) wird der Bogen in den vorab geöffneten
  Tab geschrieben, ein Dateiname wird dort nicht vergeben; nur der Weg ohne Tab (`pdfErzeugen`) benennt die Datei. Wie
  Android-Chrome ein im Tab angezeigtes PDF beim Speichern benennt, war nicht prüfbar (Risiko).
- **Erwartung der Rolle:** Ein Bogen, der aufs Klemmbrett oder in die Ablage soll, trägt Einheit und Stand im Namen, wie
  die anderen PDFs.
- **Folge im Einsatz:** Nach fünf bis zehn Einzelbögen liegen Dateien mit GUID-Namen im Ordner; welche zu „Nr. 2
  Biberach" gehört und welche die neuere Fassung ist, zeigt nur das Öffnen jeder Datei. Beim Weiterreichen an den Drucker
  oder an die Ablösung fehlt der Name als Kontrolle.
- **Empfehlung:** Dateinamen wie bei Sammel-PDF und Lageblatt (Einheit/Ort, Stand-Gruppe), auch wenn die Datei über den
  Tab abgelegt wird.
- **Verifikation:** Zwei Einzelbögen erzeugen und im Download-Ordner an den Namen unterscheiden.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen einer Einheit | Summen und Bedarf sofort, Hinweise zu Stand und Kennzeichen | Blatt mit Meldekopf-Zeile („Nr., eingegangen am, Zug, abgerückt, ins Gerät übertragen") | Fotos der Codeseiten einlesen; „Lage vom Papier abgleichen…" trägt Nr., Zeit, Zug, Status ein; Zwischenstand hält über Neustart |
| Lage an der Wand | Zugsummen, Alter der Meldung, Änderungsspalte | Lageblatt A4 quer mit Tafel „Nachtrag von Hand" und „übertragen [ ]" | Nachtragszeilen über „Einheit manuell erfassen…" (Angaben vom Zettel) |
| Stärke ändert sich | Folgemeldung „11 → 8" | Bogen mit Kästchen „von Hand geändert" und Vermerk der nicht angepassten Namensliste | „Stärke ändern…"; Stern bleibt auf Lageblatt und Sammel-PDF |
| Geräteausfall am Meldekopf | Sammel-PDF mit Bögen, Zeiten, Historie | Ausgedruckte Sammel-PDF | „Einsatz importieren…" aus der PDF; Lageblatt und CSV werden mit Hinweis auf den richtigen Weg abgelehnt |
| Übergabe an den Stab | Excel „Oldenburg", CSV | Lageblatt, Sammel-PDF | Nur lesbar; ohne Einsatzname, Erstellzeit und Zeitkennzeichen (R16-A1) |
| Einzelbogen aufs Klemmbrett | PDF mit Code | Ausdruck | Scan des Codes; Dateiname nicht unterscheidbar (R16-A3) |

## Würde ich dafür das Papier weglegen?

Nein, und die App verlangt es auch nicht: Blanko-Vordruck, Lageblatt mit Nachtragstafel und Sammel-PDF halten den Ablauf
bei Geräteausfall am Laufen, und der Rückweg über Fotos und „Lage vom Papier abgleichen…" ist ohne Chaos möglich. Für den
Weg an den Stab bleibt das Lageblatt maßgeblich, solange Excel und CSV nicht dieselben Angaben zur Verlässlichkeit der
Zeiten und zum Erstellzeitpunkt tragen (R16-A1).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Die Excel-Liste wirkt wie das digitale Abbild des Lageblatts, trägt aber dessen Warnung zur
  Eintreffzeit nicht mit.
- **Größtes Einsatzrisiko:** Eine Eingangszeit des Geräts wird beim Stab aus der Excel-Liste als geprüfte Ankunftszeit
  gelesen (R16-A1).
- **Top-Priorität für die nächste Iteration:** R16-A1: Einsatzname, Erstellzeit und Zeitkennzeichen in Excel und CSV,
  Zeitgruppe im Dateinamen.
