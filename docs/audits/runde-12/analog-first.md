# Audit „Analog first", Runde 12 (Papier-Rückfallebene, Rückweg vom Papier)

Prüfer: Rollenaudit `thw-analog-first-reviewer` · Datum: 2026-10-26 · Prüfgegenstand: laufende Web-App,
Produktionsbuild auf http://localhost:4173, Code-Stand Commit `2c96abe` (`main` nach Runde 11).

Zählung: **P0 0 · P1 0 · P2 1 · P3 0** (1 Befund, neu).

Reiner Prüfbericht, keine Codeänderung. Vorher gelesen: `docs/audits/README.md`, `docs/audits/runde-11/README.md` und
die Befundüberschriften aller früheren Analog-first-Berichte (R2 bis R11).

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen; die Projektkopie fand keinen Browser, das globale
Playwright-Modul schon), `isMobile`/`hasTouch`, Locale de-DE, Telefon 390 × 844 und 360 × 640, jeweils frischer
Kontext. Einsatz-Sammlung „Hochwasser Test" mit 6 THW-Übungsbögen aus `examples/thw/` (auf `uebung: false`), über
„Bögen einlesen…". Durchgespielt: „Zur Kenntnis genommen", Aufklappen/Hinweise, „Meldung entfernen" (Rückfrage mit
Nummernfolge), „Einheit manuell erfassen…" mit „Angaben vom Zettel" (Nr. 2 doppelt, Uhrzeit 23:50, Zug), „Stärke fehlt"-
Rückfrage, Abrücken mit Quittung, Lageblatt (6 Einheiten; mit 1 Abgerückten), Sammel-PDF (13 Seiten), Blanko-Vordruck,
Bogen aus Datei mit frischem Stand, „Bogen übergeben", Neuladen offline (`setOffline`). Die PDFs wurden mit
`pdftotext -layout` und `pdfinfo` gelesen.

**Annahmen:** Der Meldekopf führt neben dem Gerät einen Meldeblock; das zuletzt gedruckte Lageblatt hängt nach einem
Geräteausfall weiter an der Wand; die Sammel-PDF wird als Übergabe an die Ablösung gedruckt.

**Nicht prüfbar:** echtes Drucken, Kamera- und Handscanner, Safari, native Builds, echte Akku- oder Geräteausfälle.
Die Übungsbögen tragen Stände von Mitte Juli; dadurch greift die Datenschutzfrist (über 90 Tage). Das ist hier
genau der geprüfte Fall, kein Seed-Artefakt: Ein Bogen mit solchem Stand wird im Einsatz genauso behandelt.

**Bekannte Grenzen, nicht neu gemeldet:** alle in der Aufgabe genannten (R6-O9 bis R11-M3). Der Tipp auf „Einsatz
anlegen" in den ersten rund 1,5 s nach Öffnen des Dialogs bleibt ohne Wirkung (Tippschutz, R8-H5/S4). Nicht gewertet.

**Kennzeichnung:** *gemessen* = im Testbrowser reproduziert (Seitentext, PDF-Text); *beobachtet* = gesehen;
*Risiko* = abgeleitet.

## Urteil

Die Papierseite trägt. Das Lageblatt (2 Seiten bei 6 Einheiten) hat Nr., Funkrufname, Eintreffzeit, Stand, Stärke,
Fahrzeuge, Bedarf, einen Block „Abgerückt" mit Uhrzeit und Nachtragszeilen mit „übertragen". Die Sammel-PDF beginnt mit
der Übergabe-Übersicht, jeder Bogen trägt den Kasten „Stand am Meldekopf" und „übertragen [ ]". Der Blanko-Vordruck
hat das Feld „abgerückt am … um …" und „ins Gerät übertragen [ ]". Die Zettelfelder („Eingetroffen um", „Nr.", „Zug")
funktionieren: eine doppelte Nr. wird mit „Nr. schon vergeben" abgefangen, 23:50 am frühen Morgen wird als gestern
(25.10.2026) eingetragen, nicht als künftige Zeit. „Meldung entfernen" nennt, welche Nummern aufrücken. Neuladen ohne
Netz bringt die Sammlung vollständig zurück. Die Behebungen aus Runde 11 halten (siehe unten). Die Aufgabe „Papier
erzeugen, Lage weitergeben, Nachtrag vom Meldeblock" gelingt ohne fremde Hilfe.

Reibung entsteht an einer Stelle: Die Datenschutzfrist wird auf dem Bildschirm erklärt, auf dem Papier aber nicht, und
das Papier behauptet dabei Dinge, die nicht stimmen (R12-A1).

## Befunde

### R12-A1 [P2] Anonymisierte Bögen: Auf Papier fehlt der Vermerk „anonymisiert", stattdessen steht „keine Rufnummer … kein Kraftfahrer"

- **Ort:** Einsatz-Sammlung, Lageblatt (A4 quer), Spalte „Funkrufname / Rückruf" und Hinweiszeile unter der Einheit;
  Sammel-PDF, Übergabe-Übersicht (Seiten 1 bis 3) und Bogenseiten (Beispiel Seite 4); Bogen-Kopf „Namen im Code gültig
  bis …".
- **Beobachtung (gemessen):** Sechs Bögen mit Stand von vor 100 bis 101 Tagen wurden eingelesen. Auf dem Bildschirm
  trägt jede Karte die Marke „ANONYMISIERT" und die Erklärung „Datenschutzfrist abgelaufen (Stand älter als 90 Tage):
  Namen, Funktionen, Qualifikationen und Erreichbarkeiten wurden entfernt. Sie stehen nur noch auf dem Papier der
  Einheit — dort nachfragen." Im Lageblatt und in der Sammel-PDF kommt das Wort „anonym" und „Datenschutzfrist" kein
  einziges Mal vor (`pdftotext`, 0 Treffer). Stattdessen listen beide für dieselben Einheiten als Hinweise „keine
  Rufnummer; kein Kraftfahrer", in der Übergabe-Übersicht ausgeschrieben: „Keine telefonische Erreichbarkeit erfasst —
  mindestens eine Führungskraft sollte eine Nummer angeben." und „Fahrzeuge erfasst, aber kein Kraftfahrer: Bei keiner
  Person ist eine Fahrerlaubnisklasse eingetragen." Auf den Bogenseiten stehen im Personalblock „Einsatzkraft 1" bis
  „Einsatzkraft 4", Telefon und E-Mail „—", ohne Satz, warum. Der Kasten am Ende nennt „Namen im Code gültig bis
  15.10.2026", ein Datum, das zum Druckzeitpunkt (26.10.2026) elf Tage zurückliegt. Auf dem Bildschirm sind dieselben
  zwei Hinweise in der aufgeklappten Karte ebenfalls ohne Bezug zur Anonymisierung aufgeführt.
- **Folge:** Wer nur die Wand oder die gedruckte Übergabe sieht, liest: Die Einheit hat keine Rufnummer und keinen
  Fahrer, die Führung solle eine Nummer verlangen. Tatsächlich sind beide Angaben auf dem Papier der Einheit vorhanden
  und wurden vom Gerät gelöscht. Wer den Bogen später aus der Sammel-PDF an die Ablösung gibt, gibt Seiten mit
  „Einsatzkraft 1…" weiter, ohne dass dort steht, dass die Namen fehlen und wo sie zu holen sind. Genau die Rückfallebene
  „Papier der Einheit" ist dem Leser des Papiers nicht genannt. (Fortsetzung von R11-A1: Dort wurde die Quittung beim
  Einlesen und die Karte behoben; die Papierausgaben blieben außen vor.)
- **Empfehlung:** Anonymisierte Bögen auf dem Lageblatt und in der Übergabe-Übersicht mit einem Wort kennzeichnen
  („anonymisiert, Stand >90 Tage — Namen und Rufnummern beim Papier der Einheit"). Die Hinweise zu Rufnummer und
  Kraftfahrer bei solchen Bögen unterdrücken oder durch „nicht prüfbar (anonymisiert)" ersetzen. Auf der Bogenseite im
  Personalblock einen Satz setzen, warum „Einsatzkraft n" steht; das Gültigkeitsdatum im Code-Kasten dann weglassen
  oder mit „abgelaufen" versehen.
- **Prüfung:** Bogen mit Stand älter als 90 Tage in eine Sammlung einlesen, Lageblatt und Sammel-PDF erzeugen und mit
  `pdftotext` nach „anonym" und nach „keine Rufnummer" suchen; ein Bogen mit frischem Stand (Gegenprobe) darf keinen
  Vermerk tragen.

## Prüfung der Behebungen aus Runde 11

| Befund | Ergebnis |
| --- | --- |
| R11-A1 Quittung bei Bögen über 90 Tage | hält: „6 Bögen ohne Namen und Erreichbarkeiten: Datenschutzfrist, … (Stand vor 100 Tagen) — Angaben vom Papier der Einheit nachfragen"; Marke „ANONYMISIERT" an der Karte. Papierseite offen: R12-A1 |
| R11-A3 Lageblatt als Eingabe | nicht erneut geprüft, nicht gewertet |
| R11-D1/S3 Kenntnisnahme mit Quittung | hält: „Zur Kenntnis genommen 6 Einheiten · Rückgängig · ✕" |
| R11-O1 Speichern bei Seitenwechsel, Neuladen | hält: Neuladen ohne Netz bringt Sammlung und Abrückzeit zurück |
| R11-W2 Absender/Kasten „Stand am Meldekopf" | hält: Kasten über jedem Bogen mit Nr., Eingetroffen, Zug, Auftrag |
| R11-W1 Verpflegung getrennt | hält: Lageblatt „Verpflegung 53 · Unterbringung angefordert: 2 Einheiten, 23 Personen (…)" |
| R11-A2 Abrückzeit auf Blanko | hält: „abgerückt am ____ um ____:____ Uhr" auf dem Blanko; Lageblatt zeigt „ab 26.10.2026, 04:23" |
| R11-E-Gruppe Nr. aus dem Zettel | hält: Nr. 2 doppelt wird mit Namen der Einheit abgefangen; 23:50 wird als Vortag gerechnet |

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
| --- | --- | --- | --- |
| Eintreffen und Nr. vergeben | Nr. und Zeit automatisch, Summen laufend | Meldeblock mit Nr., Zeit, Zug; Kasten oben auf dem Blanko | „Angaben vom Zettel" (Zeit, Nr., Zug); doppelte Nr. wird abgefangen — sauber |
| Lage an der Wand | Zahlen aktuell, Abgerückte getrennt | Lageblatt (A4 quer) mit Nachtragszeilen und „übertragen" | Nachtrag per „Einheit manuell erfassen…" oder Stärke ändern — sauber; anonymisierte Bögen sind auf dem Blatt nicht erkennbar (R12-A1) |
| Abrücken | Zeit mit einem Tipp, „Rückgängig" | Vermerk „abgerückt am … um …" auf dem Blatt | Zeit korrigierbar; Neuladen erhält sie — sauber |
| Übergabe an Ablösung | eine Datei mit Lage, Zeiten, Historie | Sammel-PDF mit Übersicht und allen Bögen | „Einsatz importieren…" — sauber; Papier sagt bei anonymisierten Einheiten nicht, woher Namen kommen (R12-A1) |
| Ausfall des Geräts | Daten bleiben lokal, offline nutzbar | Blanko-Vordruck (Papier-Reserve), Lageblatt an der Wand | Papier → „Einheit manuell erfassen…" mit Zettelfeldern — sauber |

## Würde ich dafür das Papier weglegen?

Nein, nicht ganz. Meldeblock und das zuletzt gedruckte Lageblatt bleiben an der Wand, weil sie bei leerem Akku die
einzige Quelle sind; das Gerät ersetzt das Aufsummieren und die Nacharbeit, nicht das Blatt. Dass das Papier an einer
Stelle (anonymisierte Bögen) weniger sagt als der Bildschirm und dabei Falsches behauptet, ist der Grund, die gedruckte
Fassung noch kritisch gegenzulesen.

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „keine Rufnummer / kein Kraftfahrer" auf dem Blatt heißt nicht, dass die Einheit beides nicht hat, sondern dass das Gerät es gelöscht hat.
- **Größtes Einsatzrisiko:** Die Wand oder die Übergabe zeigt als Mangel, was nur eine Datenschutz-Löschung ist; die Rückfrage geht an die falsche Stelle oder unterbleibt.
- **Top-Priorität für die nächste Iteration:** R12-A1, den Vermerk „anonymisiert" und die Herkunft der Namen („Papier der Einheit") in Lageblatt, Übergabe-Übersicht und Bogenseite übernehmen.
