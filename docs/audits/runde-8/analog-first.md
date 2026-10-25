# Audit „Analog first", Runde 8 (Papier-Rückfallebene, Rückweg vom Papier)

Stand: 24.10.2026 · Code-Stand: `3fee6e5` (Zweig `main`) · Prüfer: Rollenaudit
`thw-analog-first-reviewer` · Prüfgegenstand: Web-App, Produktionsbuild
(`vite preview`, Port 4173, nicht neu gebaut, nicht angefasst).

Reiner Prüfbericht, keine Codeänderung. Achte Runde nach der Behebung der
Runde-7-Befunde (Stand der Behebung in
[../runde-7/README.md](../runde-7/README.md); Bericht der Rolle:
[../runde-7/analog-first.md](../runde-7/analog-first.md), dort 1 × P2, 3 × P3,
alle als behoben gemeldet).

## Prüfaufbau

Playwright aus `node_modules`, Chromium unter `/opt/pw-browsers/chromium`
(`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 px
(Skalierung 2) als Grundeinstellung. Jeder Durchgang lief in einem eigenen,
frischen Browser-Kontext, weil elf weitere Prüfer denselben Server nutzten;
Zeitmessungen unter dieser Last sind Größenordnungen. Zuerst habe ich ohne
Kenntnis der Berichte getestet (Papier-Reserve, Einsatzansicht, manuelle
Erfassung, „Nur Stärke", Lageblatt, Sammel-PDF, Rückweg vom Papier,
Exportstand, Offline-Betrieb, beschädigter Speicher), danach den
Runde-7-Bericht und den Abschnitt „Stand der Behebung" gelesen und jede
Behebung nachgestellt. Die Berichte der übrigen Runde-8-Rollen habe ich erst
beim Abgleich auf Doppelungen gelesen.

Zustände: `localStorage`-Seeds (`eeb.einsaetze.v1`, `eeb.entwurf.v1`) aus
`examples/thw/` mit `uebung: false` und `stand` auf die Geräteuhr:

- „Hochwasser Musterstadt" mit 6 Bögen (001, 003, 009, 013, 016, 052), Stärke
  1 / 15 / 43 / 59.
- Leeres Zweitgerät „Wiederanlauf" für den Rückweg vom Papier.
- Entwurf `013-ulm-b` mit kyrillischem Vornamen der ersten Person.
- Beschädigte und teilweise unbrauchbare Speicherinhalte (siehe unten).

Heruntergeladen und mit `pdftotext -layout`, `pdfinfo`, `pdftoppm` gelesen:

| Datei | Weg | Seiten |
| --- | --- | --- |
| Lageblatt, 7 Einheiten (mit Nr. 7 „Nur Stärke") | „Lageblatt (A4 quer)" | 2 |
| Sammel-PDF, 7 Einheiten | „Einsatz weitergeben / sichern" | 19 |
| Lageblatt nach Abgleich vom Papier | dito, auf dem Zweitgerät | 2 |
| Einzel-PDF Ulm mit kyrillischem Namen | „Bogen übergeben…" → „PDF erzeugen" | 2 |
| Blanko-Vordruck (auch offline) | Startseite | 2 |
| CSV „Übersicht" | Einsatzansicht | – |

Die 19 Seiten der Sammel-PDF habe ich als Bilder (130 dpi) auf einem leeren
Gerät über „Bögen einlesen…" gelesen (19 Bilder, 7 Bögen, 10 Bilder ohne Code,
wie erwartet bei Bogen- und Übersichtsseiten) und danach „Lage vom Papier
abgleichen…" ausgeführt: Nr. 1–7, Zug bei vier Einheiten in vier Schreibweisen,
eine Einheit „abgerückt" ohne Abrückzeit, Seite zwischendurch mit „Später"
verlassen und neu geladen.

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Die laufende
Nummer („Nr. 3") dient am Meldekopf und im Funk als Kurzbezeichnung. Nach einem
Geräteausfall hängt das zuletzt gedruckte Lageblatt weiter an der Wand. Ein
handschriftlich ausgefüllter Blanko kommt ohne Gerät zum Meldekopf.

**Nicht prüfbar** waren echtes Drucken (Druckrand, Graustufen, Heften), der
Kamera-Live-Scan, der Handscanner, echte Fotos im Zelt (ersetzt durch gerenderte
Seitenbilder), echte Akku- und Geräteausfälle (ersetzt durch frische Kontexte),
native Builds und Safari. Die Seed-Bögen tragen Einsatzzeiträume im Juli; jede
Einheit zeigt deshalb „Zeitraum vorbei / Anderer Einsatz?". Das ist ein Artefakt
der Seeds und nicht gewertet.

**Hinweis zur Messmethode:** Ein Tipp auf den Hauptknopf einer Rückfrage wirkt
in den ersten rund 1,5 s nach dem Öffnen nicht (gemessen: nach 0,3 s und 0,8 s
bleibt die Rückfrage offen, nach 3 s schließt der erste Tipp). Das ist der
Prellschutz der Rückfragen; er ist in Runde 8 von anderen Rollen als R8-H5 und
R8-S4 geführt und hier nicht erneut gewertet.

## Urteil

Die Papierseite trägt, und alle vier Runde-7-Befunde dieser Rolle halten. Die
Rückfrage bei „Nur Stärke" mit unveränderten Sollzahlen erscheint jetzt
(R7-A1), die fehlende Abrückzeit ist auf Karte, Lageblatt und in der Rückfrage
nach dem Abgleich als „Abrückzeit nicht bestätigt (vom Papier)" gekennzeichnet
(R7-A2), die Meldungen nach Lageblatt und Sammel-PDF sagen „erzeugt — liegt im
Download-Ordner" und der Exportstand sagt „zuletzt erzeugt" (R7-A3), und die
Quittung nennt die Person mit dem nicht darstellbaren Namen (R7-A4). Der
Rückweg vom Papier gelingt ohne fremde Hilfe: aus 19 Seitenbildern kamen 7
Bögen, der Abgleich übernahm Nr., Zug, Notiz und Status, nannte danach in zwei
getrennten Hinweisen die Einheiten ohne Eintreffzeit und ohne Abrückzeit, und
die Eingaben im Abgleich überstanden „Später" und ein Neuladen der Seite.
Die Papier-Reserve entsteht auch ohne Netz (Seite nach 30 s Wartezeit mit
`setOffline` neu geladen, Status 200, Blanko erzeugt).

Reibung bleibt an der Stelle, an der R7-A1 ansetzte: Wer die Rückfrage mit
„Als Sollstärke ablegen" beantwortet, bekommt eine Einheit, die in Kopfzeile,
Lageblatt, Verpflegung und Fahrzeugsumme voll mitzählt und nur in der
aufgeklappten Karte als „Sollstärke, nicht gemeldet" steht (R8-A1). Dazu zwei
kleine Lücken zwischen Papier und Gerät (R8-A2, R8-A3). Ein Befund eines
anderen Berichts (abgeschnittener Sammlungstext wird still zu `[]`) betrifft
meine Rolle unmittelbar und ist hier gemessen bestätigt (Verweis unten).

Aufgaben: Papier erzeugen geht ohne fremde Hilfe. Nachtrag vom Meldeblock mit
Nr., Zug und Eintreffzeit geht ohne fremde Hilfe. Wiederanlauf nur vom Papier
geht ohne fremde Hilfe.

## Befunde

Zählung: P0: 0 · P1: 0 · P2: 1 · P3: 2.

### R8-A1 [P2] „Als Sollstärke ablegen" zählt die Einheit in alle Summen; die Marke steht nur in der aufgeklappten Karte

**Priorität:** P2

**Kennzeichnung:** gemessen (Kopfzeile, Karte, Lageblatt, Sammel-PDF,
Rückweg vom Papier). Der Satz in der Rückfrage ist wörtlich gelesen; wie ein
Helfer ihn versteht, ist *Risiko*.

**Fundstelle / Aufgabe:** Einsatzansicht → „Einheit manuell erfassen…" →
Typ „Bergungsgruppe", Name „Sinsheim" → Schritt 3 „Nur Stärke
(Meldekopf-Schnellerfassung)" → „Nur Stärke melden" → „In Einsatz übernehmen"
→ Rückfrage „Stärke nicht gezählt" → „Als Sollstärke ablegen".
Karte in `src/app/einsaetze-ui.tsx` (Marke bei `nurSollstaerke`).

**Beobachtung:**
- Die Rückfrage erscheint jetzt (R7-A1 hält): „Für „THW Sinsheim
  Bergungsgruppe" stehen noch die Zahlen der Vorbelegung nach Einheitstyp (Soll:
  0 / 2 / 7 / 9, 2 Fahrzeuge) — niemand hat gezählt. Die Lage zählte sie sonst
  als gemeldete Stärke." Dazu drei Wahlmöglichkeiten, bei „Als Sollstärke
  ablegen" der Zusatz „Die Karte in der Sammlung trägt die Marke „Sollstärke,
  nicht gemeldet"."
- Nach dieser Wahl steht die Kopfzeile bei „7 Einheiten", Gesamt 68 (vorher 6 /
  59), „Einheiten (7 gemeldet · 7 zählend)", Verpflegung 68. Die Einheit zählt
  also voll mit.
- Die zugeklappte Karte zeigt „Nr. 7 THW Sinsheim Bergungsgruppe · Stärke
  0 / 2 / 7 / 9 · keine Rufnummer + 2 weitere" ohne Marke. Erst nach „Aufklappen"
  steht in einer eigenen Zeile „Sollstärke, nicht gemeldet".
- Lageblatt: Nr. 7 mit „0 / 2 / 7 / 9", 2 Fahrzeuge, Hinweise „keine
  Rufnummer; Kennzeichen fehlt; Kennzeichen fehlt"; „Summe laut Gerät (7 zählend)
  1 / 17 / 50 / 68, 24 Fahrzeuge"; „Bedarf gesamt (7 Einheiten, 68 Personen)".
  Das Wort „Soll" kommt bei Nr. 7 nicht vor.
- Sammel-PDF, Bogenseite Nr. 7: „Stärke 0/2/7/9", darunter „Personal am
  Meldekopf nur in Stärke erfasst." — ohne den Hinweis, dass die Zahl die
  Sollstärke ist.
- Rückweg vom Papier: Auf dem Zweitgerät steht Nr. 7 nach dem Einlesen mit der
  Marke in der aufgeklappten Karte; die Summe zählt ebenfalls 68.

**Erwartung der Rolle:** Eine Zahl, die niemand gezählt hat, darf auf dem
Wandblatt nicht aussehen wie eine Zählung. Entweder zählt sie nicht in die
Summe, oder das Blatt trägt dieselbe Marke wie die Karte. Der Satz „Die Lage
zählte sie sonst als gemeldete Stärke" erweckt den Eindruck, dass „Als
Sollstärke ablegen" das Zählen beendet.

**Folge:** Der Helfer am Meldekopf wählt die Sollstärke, weil die Zahl noch
nicht feststeht. Die Lage meldet 68 Personen, das Lageblatt hängt mit 68 an der
Wand, Verpflegung und Fahrzeuge sind für neun nicht gemeldete Personen und zwei
Fahrzeuge geplant. Wer das Blatt liest, sieht keinen Unterschied zu einer
gemeldeten Einheit; wer die Karte nicht aufklappt, ebenso nicht. Der ursprüngliche
Schaden aus R7-A1 ist damit nur zur Hälfte beseitigt: Die Rückfrage verhindert die
ahnungslose Übernahme, die bewusste Ablage ist auf Papier aber unsichtbar.

**Empfehlung:** Dieselbe Marke „Sollstärke, nicht gemeldet" in der zugeklappten
Karte, im Lageblatt (Spalte „Stärke" oder „Hinweise") und auf der Übersichtsseite
und Bogenseite der Sammel-PDF; in der Rückfrage ehrlich sagen, ob die Sollzahl in
der Summe steht („zählt in der Summe mit, bis eine Zahl vorliegt"), oder sie
aus der Summe nehmen.

**Nachprüfung:** Typ „Bergungsgruppe", „Nur Stärke", „In Einsatz übernehmen",
„Als Sollstärke ablegen": Marke an zugeklappter Karte, im Lageblatt und in der
Sammel-PDF; Rückfrage und Kopfzeile sagen dasselbe über die Summe.

### R8-A2 [P3] Die CSV „Übersicht" ordnet nach Name, das Lageblatt nach Nr.

**Priorität:** P3

**Kennzeichnung:** gemessen (CSV-Datei gelesen).

**Fundstelle / Aufgabe:** Einsatzansicht → „Übersicht als CSV"; Spalte „Nr.".

**Beobachtung:** Die Zeilen stehen in der Reihenfolge Nr. 6 (Albstadt), 2
(Bamberg), 5 (Crailsheim), 1 (Hamburg), 4 (Oberhausen-Rheinhausen), 3 (Ulm), dann
„Summe (6 Einheiten)". Das Lageblatt und die Sammel-PDF stehen nach Nr. (R7:
„Sortierung nach Nr." behoben); die Liste in der App ebenfalls.

**Erwartung der Rolle:** Der Stab legt Wandblatt und Tabelle nebeneinander und
vergleicht Zeile für Zeile. Dieselbe Folge spart das Suchen.

**Folge:** Gering. Beim Abgleich zwischen Blatt und Tabelle springt das Auge;
wer die Tabelle nicht nach der Spalte „Nr." sortiert, liest in einer anderen
Reihenfolge als am Funk.

**Empfehlung:** Zeilen der CSV und der Excel-Liste nach Nr. ordnen; die Spalte
steht schon vorn.

**Nachprüfung:** Sammlung mit sechs Einheiten, „Übersicht als CSV": Zeilen 1 bis 6
in dieser Folge.

### R8-A3 [P3] Auf Papier steht die Ansprechperson mit nicht darstellbarem Namen weiter als „????????"

**Priorität:** P3

**Kennzeichnung:** beobachtet (Einzel-PDF gelesen). Die Quittung ist neu
gemessen, die Folge ist *Risiko*.

**Fundstelle / Aufgabe:** „Bogen übergeben…" → „PDF erzeugen" mit Bogen Ulm,
erste Person „Владимир Lehmann"; Seite 1, Feld „Ansprechpartner/in".

**Beobachtung:**
- Die Quittung (R7-A4) nennt jetzt die Person: „1 Name enthält Zeichen, die die
  PDF nicht darstellen kann … Betroffen: Владимир Lehmann (Ansprechperson). Der
  QR-Code trägt die Namen unverändert." Das hält.
- Auf dem Papier steht im Feld „Ansprechpartner/in" weiter „???????? Lehmann".
  R7 hatte zusätzlich eine lesbare Umschrift für die Ansprechperson empfohlen.

**Erwartung der Rolle:** Der Rückruf-Name ist die eine Stelle, die auf dem Blatt
lesbar sein muss; sonst steht dort wenigstens eine Kennzeichnung statt Fragezeichen.

**Folge:** Gering. Wer die Quittung liest, weiß Bescheid; wer nur das Blatt
bekommt, liest bei der Rückfrage Fragezeichen, und die Quittung geht mit dem
Blatt nicht mit.

**Empfehlung:** Auf dem Blatt Umschrift oder den Vermerk „Name nicht darstellbar —
im QR-Code" ins Feld schreiben.

**Nachprüfung:** Bogen mit kyrillischer Ansprechperson drucken: Feld lesbar oder
gekennzeichnet.

### Verweise auf Befunde anderer Berichte (kein neuer Befund)

- **Abgeschnittener Inhalt von `eeb.einsaetze.v1` wird beim Start still zu
  `[]` ([feldtauglichkeit.md](feldtauglichkeit.md), R8-H1).** Von mir gemessen:
  Sammlung mit sechs Meldungen um 400 Zeichen gekürzt, abgebrochener Text, kein
  JSON und leerer Text — in allen vier Fällen steht nach 2,5 s `eeb.einsaetze.v1`
  mit 2 Zeichen im Speicher, ohne Hinweis und ohne `eeb.unlesbar.v1`. Dagegen
  wird ein beschädigter Entwurf erkannt und beiseitegelegt, und gültiges JSON mit
  fehlendem Bogen oder fehlender Kennung wird gezählt („Nicht lesbar: 1 Meldung in
  einer Sammlung, 1 ganze Sammlung … Daten sichern", `eeb.unlesbar.v1` mit 228
  Zeichen). Aus Sicht dieser Rolle ist die ganze Meldekopf-Lage betroffen; das
  Lageblatt an der Wand und die Sammel-PDF sind dann der einzige Stand (und über
  „Bögen einlesen…" wieder einlesbar, siehe Rückweg).
- **Zug-Schreibweisen** ([neuer-nutzer.md](neuer-nutzer.md), R8-N5): Im Abgleich
  eingegeben „1.tz", „1. TZ" und „1.TZ" führt das Lageblatt als einen Zug, aber
  kleingeschrieben („1. tz"), obwohl zwei von drei Eingaben „TZ" schrieben;
  „erster zug" bleibt ein eigener Zug. Die Normalisierung aus Runde 7 wirkt, die
  Anzeige nimmt die Schreibweise der zuerst eingetragenen Einheit.
- **Tipp-Schutz von 1,5 s** (R8-H5, R8-S4): siehe Messhinweis im Prüfaufbau.

## Bestätigtes

- **Papier-Reserve (R7: „Blanko"):** „Papier-Reserve zum Ausfüllen mit der Hand"
  meldet „✓ Blanko-Vordruck erzeugt (2 Seiten A4, zum Ausfüllen mit der Hand)."
  Auch 30 s nach dem Laden bei `setOffline`: Seite lädt mit Status 200, Status
  „✓ Funktioniert komplett offline", Download
  `einheiten-erfassungsbogen-blanko.pdf`.
- **„Nur Stärke" ohne Zahl (R7-A1):** Rückfrage „Stärke nicht gezählt" mit den
  drei Wegen „Stärke jetzt eintragen" (springt zum Personal), „Zahlen stimmen, so
  gezählt", „Als Sollstärke ablegen"; über den Zählfeldern steht „Vorgabe nach
  Einheitstyp (Sollstärke), nicht gezählt: Mit der gezählten Stärke
  überschreiben, nicht dazuzählen." (Rest siehe R8-A1.)
- **„Abrückzeit nicht bestätigt" (R7-A2):** Im Lageblatt nach dem Abgleich trägt
  Nr. 3 (Ulm, „Abgerückt (1)") in der Spalte „Eingetroffen (abgerückt)" „Zeit
  nicht bestätigt (vom Papier)" und „Abrückzeit nicht bestätigt (vom Papier)". Die
  Rückfrage nach „Abgleich übernehmen" hat zwei Hinweise: „Für 7 Einheiten stand
  keine Eintreffzeit im Abgleich (… und 2 weitere)" und „Für 1 abgerückte Einheit
  stand keine Abrückzeit im Abgleich (THW Ulm Bergungsgruppe). Karte und Lageblatt
  vermerken „Abrückzeit nicht bestätigt", bis sie an der Karte nachgetragen ist."
- **Wortlaut „erzeugt" und Exportstand (R7-A3):** „✓ Lageblatt erzeugt (A4 quer) —
  liegt im Download-Ordner bzw. wurde über das Teilen-Menü abgelegt."; „✓ Einsatz
  … als PDF erzeugt … Weitergegeben ist sie erst, wenn sie bei der Ablösung oder
  im Archiv angekommen ist."; „Noch kein Export aus diesem Einsatz … Die
  Weitergabe vom 23.10.2026, 21:42 (an die Ablösung) zählt nicht als Lieferung an
  den Stab."; nach der CSV „Übersicht als CSV: zuletzt erzeugt 23.10.2026,
  21:48 · seitdem keine neuen Bögen"; mit „Nur neue Bögen" je Format ein eigener
  Bezugspunkt.
- **Abgleich mit Sitzungsspeicher (R7-S1/G1):** Nr. 1–7 und Zug-Eingaben blieben
  nach „Später" und Neuladen der Seite erhalten; darunter steht „„Später" schließt
  nur das Formular; die Eingaben bleiben für diese Sitzung erhalten." und
  „Eingaben verwerfen…".
- **Sollstärke auf dem Rückweg:** Die Marke „Sollstärke, nicht gemeldet" geht
  durch Sammel-PDF und Einlesen auf das Zweitgerät mit (aufgeklappte Karte).
- **Beiseitelegen unlesbarer Teile (R7-E1/E2/N3):** Bei gültigem JSON mit einer
  Meldung ohne Bogen und einer Sammlung ohne Kennung: Banner „Nicht lesbar: 1
  Meldung in einer Sammlung, 1 ganze Sammlung. Sie fehlen in Listen und Zählung —
  die Stärke kann zu niedrig sein. Nichts davon ist gelöscht; die Daten stecken in
  der Datensicherung.", Zeile „1 Meldung nicht lesbar — Daten sichern" an der
  Sammlung, `eeb.unlesbar.v1` gefüllt.
- **Beschädigter Entwurf:** Startseite zeigt „Ein gespeicherter Bogen ließ sich
  nicht öffnen … Er ist nicht gelöscht, sondern beiseitegelegt — als Datei
  sichern", „Als Datei sichern", „Entfernen…", Löschung nach 90 Tagen genannt.
- **Rückweg vom Papier:** 19 Bilder → 7 Bögen aufgenommen; der Bericht nennt die
  10 Dateien ohne lesbaren QR-Code mit dem Grund; „Lage vom Papier abgleichen…"
  mit „Nr. laut Blatt", „Eingetroffen am (leer = Zeit des Einlesens, nicht
  bestätigt)", Status, „Zug", „Auftrag / Notiz".
- **Lageblatt nach Nr.:** Nr. 1–7, Block „Abgerückt (1)" zuletzt, Nachtragszeilen
  mit „übertragen [ ] ______", „Summe laut Gerät (… zählend · 1 abgerückt)",
  „Summe einschl. Nachträge (von Hand)", „Zeit nicht bestätigt (vom Papier)" je
  Einheit ohne Zeit vom Blatt.
- **Quittung nicht darstellbarer Namen (R7-A4):** nennt Person und Rolle
  (Ansprechperson); Rest siehe R8-A3.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, Summen, Prüfhinweise | Blanko aus App oder Datei, 2 Seiten, auch nach `setOffline` erzeugbar (erst nach vollständigem Laden garantiert) | „Einheit manuell erfassen…" mit „Nr. laut Zettel", „Zug / Verband", „Eingetroffen um"; „Nur Stärke" mit Rückfrage, Ablage als Soll ohne Marke auf Papier (R8-A1) |
| Bogen übergeben | QR, Link, Datei, PDF mit Code | Einzel-PDF mit Kopfzeile je Seite, „von Hand geändert"; Quittung nennt nicht darstellbare Namen, Papier trägt „????????" (R8-A3) | Code aus Seitenbild lesbar; Bericht nennt Dateien ohne Code |
| Lage führen | Laufende Summen, Lagemonitor, Lageblatt nach Nr. | Lageblatt mit Nachtragszeilen und „übertragen"; Exportstand je Format „erzeugt" statt „exportiert" | Nachtrag vom Zettel mit Nr., Zug, Zeit; CSV in anderer Folge als das Blatt (R8-A2) |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern": Datei bringt alles zurück | Letzte Sammel-PDF mit Kopfzeile je Seite und Kasten „Stand am Meldekopf" mit Marke | Nur Papier: 7 von 7 Bögen, Abgleich mit Nr., Zug, Notiz, Status; Eintreff- und Abrückzeit als „nicht bestätigt" sichtbar |
| Beschädigter Speicher | Beiseitelegen mit Zähler und „Daten sichern" bei gültigem JSON | Letztes Lageblatt und Sammel-PDF; Entwurf als Datei sicherbar | Abgeschnittener Sammlungstext wird still zu `[]`; Rückweg nur über Papier-Seitenbilder (R8-H1) |

## Würde ich dafür das Papier weglegen?

Für den Wiederanlauf nach einem Geräteausfall ja, mit einer Gegenprobe: Die
Einheit, die ich als Sollstärke abgelegt habe, lese ich auf dem Lageblatt
ohne Marke und in der Summe mit; solange das so ist, streiche ich diese Zeile
auf dem Papier an, bevor ich sie vorlese (R8-A1). Alles andere, was ich auf dem
Meldeblock führe, kommt über Nr., Zug, Zeit und Notiz vollständig zurück, und das,
was ich nicht weiß (Eintreff- und Abrückzeit), steht als „nicht bestätigt" da.
Der Probedruck von Kopfzeile und Rändern bleibt offen, weil er sich hier nicht
prüfen lässt.

## Abgleich mit Runde 7

Grundlage: [../runde-7/analog-first.md](../runde-7/analog-first.md) samt „Stand der
Behebung" ([../runde-7/README.md](../runde-7/README.md)).

| Runde-7-Befund | Stand laut Tabelle | Bewertung Runde 8 | Beobachtung |
| --- | --- | --- | --- |
| R7-A1 „Nur Stärke" legt Sollzahlen ohne Hinweis ab (P2) | behoben | **hält, mit Rest** | Rückfrage „Stärke nicht gezählt" mit drei Wegen und Hinweis über den Zählfeldern erscheinen (gemessen bei „Bergungsgruppe"). Bei „Als Sollstärke ablegen" fehlt die Marke an der zugeklappten Karte, im Lageblatt und in der Sammel-PDF, die Summe zählt mit (R8-A1). |
| R7-A2 Abrückzeit ungekennzeichnet (P3) | behoben | **hält** | „Abrückzeit nicht bestätigt (vom Papier)" in Lageblatt, Karte und eigener Hinweis in der Rückfrage nach dem Abgleich. |
| R7-A3 „weitergegeben/gesichert" und Exportstand (P3) | behoben | **hält** | „erzeugt — liegt im Download-Ordner", „zuletzt erzeugt", Weitergabe zählt nicht als Lieferung an den Stab. |
| R7-A4 Quittung nennt die Person nicht (P3) | behoben | **hält, mit Rest** | Quittung nennt „Владимир Lehmann (Ansprechperson)". Das Feld auf dem Papier bleibt „???????? Lehmann" (R8-A3). |

Bilanz: Alle vier Runde-7-Befunde der Rolle halten, zwei davon mit Rest
(R8-A1, R8-A3). Nebenwirkungen der Runde-7-Änderungen auf diese Rolle: Die
Rückfrage „Stärke nicht gezählt" und der Sitzungsspeicher des Abgleichs helfen
und blockieren nichts. Der Prellschutz der Rückfragen von rund 1,5 s verschluckt
einen frühen ersten Tipp auf den Hauptknopf ohne Rückmeldung (siehe R8-H5, R8-S4);
für die Papierarbeit am Meldekopf im Stehen ist das ein Umweg, kein Hindernis.
Die Zurück-Taste, die Zug-Normalisierung (Schreibweise bleibt, siehe Verweis),
die Sortierung nach Nr. im Lageblatt und der Hinweis „Papier-Reserve" verhielten
sich wie beschrieben.

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen: ja. Nachtrag vom Meldeblock mit Nr., Zug
  und Zeit: ja. Wiederanlauf nur vom Papier: ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Dass „Als Sollstärke ablegen" die Einheit aus der
  Zählung nimmt, weil der Satz davor „zählte sie sonst als gemeldete Stärke"
  lautet, obwohl Kopfzeile, Lageblatt und Verpflegung sie weiter mitzählen.
- **Größtes Einsatzrisiko:** Eine als Sollstärke abgelegte Einheit geht mit 9
  Personen und 2 Fahrzeugen ohne Marke in das Lageblatt an der Wand (R8-A1); dazu
  der still geleerte Sammlungstext bei abgeschnittenen Daten (R8-H1).
- **Top-Priorität für die nächste Iteration:** Die Marke „Sollstärke, nicht
  gemeldet" auf Karte (zugeklappt), Lageblatt und Sammel-PDF und eine ehrliche
  Aussage zur Summe (R8-A1).

**Zählung:** P0 0 · P1 0 · P2 1 · P3 2.
