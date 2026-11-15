# Audit „Führungssicht", Runde 17 (Lage führen, Lagemonitor, Stand übergeben)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-10-27 ·
Prüfgegenstand: Web-App im Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `be6b396` (`main`).

Zählung: **P0: 0 · P1: 0 · P2: 1 · P3: 11** (12 Befunde)

Reiner Prüfbericht, keine Codeänderung. Maßstab ab dieser Runde: Es gibt keine
„bekannten Grenzen" zum Auslassen. Was im echten Browser noch zu beobachten
ist, wird gemeldet, auch wenn es früher als „teilweise", „offen" oder „nicht
reproduzierbar" geführt wurde (dann mit alter Befund-ID im Feld „Neu oder alt").

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen, globales
Playwright-Modul), Locale de-DE, Zeitzone Europe/Berlin, `isMobile`/`hasTouch`,
Telefon 390x844 und 360x640; der Lagemonitor zusätzlich bei 1280x720,
1920x1080 und 1280x420. Zustand: Sammlung „Hochwasser Neckar · BR Sporthalle
Rottenburg"; sieben Übungsbögen THW (Nr. 1 bis 7) aus „Übungsbögen › PDF"
über „Bögen einlesen…" aufgenommen. Die Beispiele tragen „Übung" und einen
Stand von Juli 2026; sie wurden je Karte über „Mehr… › Als Einsatzmeldung
zählen…" in die Lage gehoben (siehe R17-K1). Danach: Zug gesammelt („1. Zug")
und je Karte („2. Zug", „3. Zug"), Auftrag, „Zur Kenntnis genommen", Abrücken
(Nr. 6), „Stärke ändern…" (Nr. 2: 11 auf 8), „Name / Ort ändern…", Sortierung,
Suche und Statusfilter, Tabelle, Lageblatt (PDF, mit `pdftotext` gelesen,
2 Seiten), Übersicht als CSV, Excel-Liste, Nachtrag-CSV, Sammel-PDF (16 Seiten,
erzeugt in 3,3 s), „Einsatz importieren…" der Sammel-PDF auf einem leeren
Gerät, erneutes Einlesen zweier schon vorhandener Bögen, Lagemonitor
(`?lagemonitor=<id>`) mit Funkrufname und „Jetzt", Startseite, Schnellerfassung.
Für Zeitsprünge wurde die Uhr mit der Playwright-Uhr um 5 Std 20 Min
vorgestellt.

Nicht prüfbar: echter Fernseher, Vollbild, Drucken, Kamera, Dateiname eines im
Tab angezeigten Einzelbogen-PDF (R16-A3).

## Urteil

Die Lage ist ohne fremde Hilfe zu lesen, zu pflegen und zu übergeben. Die
Behebungen aus Runde 16 für die Führungssicht halten im echten Browser. Offen
bleibt vor allem eines: Wer eine Meldung am Meldekopf von Hand verändert,
löscht damit zugleich ihr Alter (R17-K1); das ist für eine Führungskraft die
Zahl, an der sie Aktualität misst. Der Rest sind Wortwahl, Reihenfolge und
Flächenverbrauch am Telefon.

Geprüft und in Ordnung (Behebungen aus Runde 16):

- R16-K1: „Name / Ort ändern…" im Einsatzkopf öffnet „Einsatz bearbeiten", die
  Quittung „Einsatz geändert: „Hochwasser Neckar-Süd"" hat „Rückgängig", Kopf
  und Ort ändern sich.
- R16-K3: Aufnahme von sieben Bögen: „7 Einheiten neu gemeldet — Zeilen je
  Einheit ausgeblendet, siehe Liste" mit „Alle 7 einzeln anzeigen".
- R16-K4: Das Lageblatt trägt „Zwischensummen nach Zug" mit Ruhezeit-Spalte
  oben auf Seite 1; Seite 2 enthält den Block „Abgerückt (1)" und das
  Nachtragsraster. Die Zugsummen gehen auf (27 + 22 + 4 = 53 Verpflegung,
  11 + 12 + 4 = 27 Unterbringung, 210 + 260 + 30 = 500 l Diesel).
- Abrücken: Quittung „Abgerückt 20:03: Nr. 6 …" mit „Rückgängig", Zeit in
  Tabelle, Lageblatt und Monitor; Kopf zählt danach 6 Einheiten (53 Stärke).
- Alterszeilen: Mit vorgestellter Uhr trägt der Kopf „⚠ älteste Meldung vor
  5 Std 25 Min, 6 von 6 älter als 1 Std", jede Karte „⚠ vor 5 Std 25 Min", der
  Monitor „⚠ 5 Std 11 Min" je Zeile; der Statusfilter „nur ⚠ ältere als 1 Std"
  nennt 6.
- Sortierung („Älteste Angaben zuerst", „Zug"), Suche („47/43", „3. Zug"),
  Statusfilter „nur Abgerückte (1)" liefern das Richtige.
- Übergabe: „Einsatz importieren…" der Sammel-PDF auf einem leeren Gerät ergibt
  „Einsatz … übernommen: 7 Einheiten, davon 6 anwesend", Zug, Auftrag und
  Abrückstatus kommen an. Zweites Einlesen derselben Bögen: „0 Bögen
  aufgenommen, 2 bereits vorhanden."
- Quittungen mit Hinweis „Bitte nicht noch einmal tippen" und Zeitangabe bei
  Sammel-PDF, Lageblatt, CSV und Excel; Kopf der Weitergabe: „Empfang nicht
  bestätigt".

## Befunde

### R17-K1 [P2] „Als Einsatzmeldung zählen…" und „Stärke ändern…" setzen den Stand der Meldung auf „jetzt" und nehmen ihr damit das Alter

**Ort:** Einsatzansicht, Karte › „Mehr…" › „Als Einsatzmeldung zählen…" (und
„Stärke ändern…"), danach Kopf, Karten, Tabelle, Lageblatt, Lagemonitor,
CSV, Block „Neu seit der letzten Kenntnisnahme".

**Beobachtung (gemessen, 390x844):** Die sieben Übungsbögen tragen den Stand
vom 16./17.07.2026 und stehen nach dem Einlesen mit „⚠ Stand vor 102 Tagen"
(Nr. 1 bis 7: 102 bzw. 103 Tage). Die Rückfrage „Als Einsatzmeldung zählen?"
nennt „zählt danach in Stärke, Verpflegung und Unterbringung mit (4 Personen).
Neue Fassung in der Historie". Nach dem Bestätigen steht bei allen sieben
Karten „Stand 27.10.2026, 19:59 · aus Datei übernommen, am Meldekopf von Hand
geändert"; die Warnung „⚠ Stand vor 102 Tagen" ist weg. Kopf: „letzte Meldung
27.10.2026, 20:00 (gerade eben)", im Monitor „letzte Meldung vor 3 Min", im
Lageblatt „Stand 27.10.2026, 19:59" (die alte Angabe steht nur noch in der
Spalte „Veränderung: unverändert gegenüber 17.07.2026, 08:05"). Der Block „Neu
seit der letzten Kenntnisnahme" zählt „7 Folgemeldungen", der Monitor führt
„Folgemeldung: THW Laufenburg … vor 3 Min", die Karten tragen „Folgem. 19:59",
obwohl die Karte selbst „inhaltlich unverändert" sagt. Die CSV führt als Quelle
„Manuell erfasst" statt „Aus Datei". „Stärke ändern…" (Nr. 2) setzt den Stand
ebenfalls auf die Handänderung („Stand 27.10.2026, 20:05").

**Erwartung der Rolle:** Das Alter einer Meldung ist die Zahl, an der die
Führungskraft Aktualität misst. Eine Handänderung am Meldekopf ändert den
Eintrag, nicht den Zeitpunkt, an dem die Einheit zuletzt gemeldet hat.

**Folge:** Eine hundert Tage alte Angabe sieht danach in Kopf, Karte, Tabelle,
Monitor und Lageblatt aus wie eine Meldung von vor wenigen Minuten; die
Warnung „älter als 1 Std", der Filter und die Sortierung „Älteste Angaben
zuerst" greifen nicht mehr. Bei einer echten Lage mit Meldungen von 17:00, die
um 19:00 am Meldekopf berichtigt werden, entfällt das ⚠ für Einheiten, von
denen seit zwei Stunden nichts kam. Die Rückfrage nennt diese Folge nicht.

**Empfehlung:** Stand der Einheit und Zeitpunkt der Handänderung getrennt
führen: Alter und ⚠ weiter am Stand der Einheit messen, die Handänderung als
eigene Zeile („am Meldekopf 20:05 geändert") zeigen. „Inhaltlich unveränderte"
Fassungen weder als „Folgemeldung" zählen noch im Monitor als Bewegung
melden. Quelle „Aus Datei" erhalten. Die Rückfrage um den Satz „Der Stand der
Meldung wird auf jetzt gesetzt" ergänzen, solange es so bleibt.

**Nachprüfung:** Bogen mit Stand vor zwei Stunden einlesen, „Als
Einsatzmeldung zählen…" ausführen: Karte, Kopf, Monitor und Lageblatt nennen
weiter „vor 2 Std"; „Folgemeldung" erscheint nicht.

**Neu oder alt (Verweis):** alt — wie R15-D4 („Als Übung kennzeichnen…", Stand
wird weiter auf die Kennzeichnung gesetzt, dort „teilweise"), jetzt auch bei
„Als Einsatzmeldung zählen…" und „Stärke ändern…" beobachtet, weiter offen.

### R17-K2 [P3] Nach „Stärke ändern…" nennt die Kurzzeile „Bedarf übernommen", obwohl Verpflegung und Unterbringung sich ändern

**Ort:** Einsatzansicht, Karte › „Mehr…" › „Stärke ändern…" (Nr. 2), Block
„Neu seit der letzten Kenntnisnahme", Karte, „Änderungen".

**Beobachtung (gemessen):** Der Dialog sagt „Fahrzeuge, Bedarf, Namen, Zug und
Auftrag bleiben". Nach Mannschaft 9 auf 6 (Gesamt 11 auf 8) lautet die
Kurzzeile: „… — Folgemeldung 20:05: Stärke 11 → 8 (−3) · Namen, Fahrzeuge,
Bedarf übernommen (Meldung vom 27.10.2026, 19:59) — ⚠ Bogen nennt:
„Gebäudeeinsturz Biberach/Riß — technische Ortung", passt das zu dieser Lage?
Kein Ortsname daraus kommt …". Der Bedarf im Kopf fällt aber von „Verpflegung
53 · Unterbringung 27 Personen" auf „Verpflegung 50 · Unterbringung 24
Personen"; „Änderungen" nennt „Verpflegung: 11 Personen → 8 Personen" und
„Unterbringung M/W/D: M 8 / W 3 / D 0 → M 5 / W 3 / D 0". Die Namensliste
behält 11 Personen bei Stärke 8. Die Kurzzeile wird am Ende von der langen
Ortswarnung beherrscht.

**Erwartung der Rolle:** Der Satz „Bedarf übernommen" gilt für den Bedarf, der
sich nicht geändert hat; was sich geändert hat (Unterbringung M 8 → 5), steht
vor der Ortswarnung in der Kurzzeile.

**Folge:** Wer die Kurzzeile liest und „Zur Kenntnis genommen" tippt, schließt
aus „Bedarf übernommen", dass Unterkunft und Verpflegung gleich bleiben; das
Gegenteil steht in der Summe im Kopf. Gering, weil die Summen stimmen und die
Historie es nennt.

**Empfehlung:** Dialogsatz und Kurzzeile angleichen („Verpflegung und
Unterbringung folgen der Stärke"), die Unterbringungsänderung in der Kurzzeile
nennen, die Ortswarnung hinter die Änderungen setzen.

**Nachprüfung:** „Stärke ändern…" ausführen: Dialog und Kurzzeile sagen
dasselbe wie „Änderungen" und der Kopf.

**Neu oder alt (Verweis):** neu (Nähe R16-K2, dort Kurzzeile nach
Entscheidungsrelevanz als behoben geführt; die Ruhezeit-Änderung selbst war
nicht Teil dieser Prüfung).

### R17-K3 [P3] Lagemonitor bei 1280x720 zeigt von sechs Einheiten nur zwei, sobald drei Bewegungen anstehen

**Ort:** Lagemonitor (`?lagemonitor=<id>`), Blöcke „Abgerückt: …",
„Folgemeldung: …", „+ 5 weitere Bewegungen", Tabelle „Einheiten".

**Beobachtung (gemessen, 1280x720):** Mit einer Abrückung und zwei
„Folgemeldungen" der letzten Minuten füllen die Bewegungszeilen vier Zeilen;
die Tabelle zeigt „Laufenburg" und „Haßmersheim" und endet mit „+ 4 weitere
Einheiten · ⚠ und zuletzt gemeldete zuerst". Bei 1920x1080 und bei
vorgestellter Uhr (keine Bewegungen) stehen alle sechs Zeilen, bei 1280x420
scrollt die Seite (594 px).

**Erwartung der Rolle:** Die Einheitenliste ist der Kern der Lage auf dem
Fernseher; Bewegungen sind Beiwerk.

**Folge:** Auf einem 720p-Fernseher fehlen genau dann vier von sechs Einheiten,
wenn gerade etwas passiert.

**Empfehlung:** Bewegungen auf eine Zeile kürzen oder Zeilen der Tabelle vor
Bewegungen schützen; die Zahl der sichtbaren Zeilen nach Höhe wählen.

**Nachprüfung:** Monitor bei 1280x720 mit Abrückung und zwei Folgemeldungen:
mindestens die Hälfte der Einheiten steht in der Tabelle.

**Neu oder alt (Verweis):** alt — R10-K4 (Lagemonitor zeigt bei großen Lagen
nur wenige Zeilen), weiter offen.

### R17-K4 [P3] Abgerückte Einheiten bleiben an ihrem Listenplatz

**Ort:** Einsatzansicht, Liste „Einheiten (7 gemeldet · 6 zählend)", Karten.

**Beobachtung (gemessen):** Nr. 6 (ABGERÜCKT) steht in der Standardreihenfolge
zwischen Nr. 5 und Nr. 7, bei Sortierung „Zug" zwischen Nr. 3 (1. Zug) und
Nr. 4 (2. Zug), jeweils ohne Überschrift „Abgerückt". Sie ist nur durch die
Marke „ABGERÜCKT" und die blassere Karte zu erkennen. Der Filter „Status › nur
Anwesende (6)" blendet sie aus, ist aber ein Schritt mehr.

**Erwartung der Rolle:** Anwesende Einheiten stehen zusammen, abgerückte am
Ende.

**Folge:** Beim Durchlesen der Liste wird die abgerückte Einheit mitgelesen und
zwischen anwesende gerechnet; die Zugruppen sind zerrissen.

**Empfehlung:** Abgerückte ans Ende der Liste mit Überschrift (wie im Lageblatt).

**Nachprüfung:** Eine Einheit abrücken: Sie steht nach den anwesenden unter
„Abgerückt (1)".

**Neu oder alt (Verweis):** alt — R11-K2 (Abgerückte, „teilweise"), weiter
offen.

### R17-K5 [P3] Der Einsatz steht auf der Startseite zweimal

**Ort:** Startseite, Abschnitt „Bögen sammeln (Meldekopf)" und Abschnitt
„Einsatz-Sammlung (Meldekopf)".

**Beobachtung (gemessen, 390x844):** Oben der Eintrag „„Hochwasser Neckar"
öffnen · 7 Einheiten gemeldet · 6 anwesend · BR Sporthalle Rottenburg · Letzte
Meldung 27.10.2026, 20:00 (vor 6 Min)", darunter die Karte „Hochwasser Neckar ·
Öffnen · 7 Einheiten gemeldet · 6 anwesend · Stärke 2 / 13 / 38 / 53 · Letzte
Meldung … · 6 neu seit der letzten Kenntnisnahme · Lageblatt: noch keins ·
Export: noch keiner · Löschen…".

**Erwartung der Rolle:** Ein Einsatz, ein Eintrag.

**Folge:** Zwei Wege zum selben Ziel mit zwei verschieden langen Statuszeilen;
nur die Karte nennt „6 neu seit der letzten Kenntnisnahme".

**Empfehlung:** Den Schnelleinstieg entfallen lassen oder die Karte unter den
Einstieg ziehen.

**Nachprüfung:** Startseite mit einem Einsatz: Er steht einmal.

**Neu oder alt (Verweis):** alt — R16-N2 (doppelter Einsatz auf der
Startseite), als behoben geführt, im Browser weiter zu sehen.

### R17-K6 [P3] Quittungsleiste und Fußleiste belegen am Telefon ein Viertel des Bildschirms

**Ort:** Einsatzansicht, Quittung nach „Zur Kenntnis genommen", „Zug … gesetzt",
„Abgerückt …".

**Beobachtung (gemessen, 360x640):** Quittung 91 px hoch (bei y = 481), darunter
die Fußleiste „Ansicht: Standard" 57 px (bei y = 583): zusammen 148 von
640 px (23 %), über dem Inhalt liegend. Bei 390x844 91 + 57 px (17 %).

**Erwartung der Rolle:** Die Rückmeldung bleibt, verdeckt aber nicht die Zeile,
die gerade bearbeitet wurde.

**Folge:** Beim Durcharbeiten mehrerer Karten verdeckt die Leiste die jeweils
nächste Karte; ein Schließen über „✕" kostet einen Tipp je Quittung.

**Empfehlung:** Quittung einzeilig (Text, „Rückgängig") oder die Fußleiste für
die Dauer der Quittung ausblenden.

**Nachprüfung:** 360x640: Quittung plus Fußleiste höchstens 100 px.

**Neu oder alt (Verweis):** alt — R11-M3 (Fläche der Quittung, „teilweise"),
weiter offen.

### R17-K7 [P3] Die Tabelle am Telefon zeigt höchstens drei Spalten und fünf Zeilen zugleich

**Ort:** Einsatzansicht › „Tabelle", 390x844.

**Beobachtung (gemessen):** Tabelle 1909 px breit in einem 356 px breiten
Rahmen; die Namensspalte ist 120 px breit und klebt links, jede Zeile ist
130 px hoch (Name in vier Zeilen, Marke „neue Fassung" als eigener Block). Nach
rechts scrollt „Eingetr." und „Bedarf" neben dem Namen; Stärke, Zug, Auftrag
und „Meldung vor" stehen nie zusammen auf dem Bildschirm. „1. Zug" bricht in
der Zugspalte in „1." und „Zug". Sieben Einheiten brauchen 1122 px Höhe.

**Erwartung der Rolle:** Die Tabelle ist die dichte Ansicht; sie zeigt mehr
Einheiten je Bildschirm als die Karten.

**Folge:** Die Tabelle ist am Telefon kaum dichter als die Karten; für
„Stärke, Zug, Auftrag, Alter" je Einheit ist waagerechtes Wischen nötig.

**Empfehlung:** Namensspalte auf Kürzel („Nr. · Ort · Typ") kürzen, Marken als
Zeichen, Zug unteilbar („1. Zug").

**Nachprüfung:** 390x844: acht Zeilen und die Spalten Stärke, Zug und Alter
zugleich sichtbar.

**Neu oder alt (Verweis):** neu (Nähe R12-M3 Namensspalte 34 %, behoben).

### R17-K8 [P3] „Einheit(en)" in Zwischensummen und Lageblatt

**Ort:** Einsatzansicht „Zwischensummen nach Zug", Lageblatt, Sammel-PDF.

**Beobachtung (gemessen):** „1. Zug · 3 Einheit(en)", „2. Zug · 2 Einheit(en)",
„3. Zug · 1 Einheit(en)"; im Lageblatt „Ruhezeit erforderlich bei 3
Einheit(en)". Im Kopf, in der Bedarfszeile und im Monitor steht dagegen richtig
„1 Einheit" und „3 Einheiten".

**Erwartung der Rolle:** Eine Zahl, ein Wort.

**Folge:** Gering; die Klammerform liest sich wie eine Formularvorlage in einem
Blatt, das an Stab und Ablösung geht.

**Empfehlung:** Einzahl und Mehrzahl wie im Kopf.

**Nachprüfung:** Zug mit einer Einheit: „1 Einheit".

**Neu oder alt (Verweis):** neu (Nähe R16-N2/N-Gruppe „Grammatik", als
behoben geführt).

### R17-K9 [P3] Nachtrag-CSV trägt den Vermerk „NACHTRAG" nur am Dateiende, die Summe zeigt Nullen

**Ort:** „Nur neue Bögen seit dem letzten Export" › „Übersicht als CSV —
Nachtrag (1 Einheit)".

**Beobachtung (gemessen):** Nach einer ersten CSV-Lieferung und dem Abrücken
von Nr. 5 trägt die Datei den Namen `eeb-einsatz-nachtrag-seit-20261027-2007-…`,
Zeile 1 ist die Kopfzeile, Zeile 2 die Einheit (letzte Spalte „Im Nachtrag
wegen: geändert: Abrücken"). Der Vermerk „NACHTRAG seit 27.10.2026, 20:07 —
nicht die ganze Lage (1 Einheit in dieser Datei)" steht erst in der vorletzten
Zeile; die Summenzeile heißt „Summe Nachtrag — nur neue Einheiten (0)" mit
lauter Nullen.

**Erwartung der Rolle:** Wer die Datei öffnet, sieht in der ersten Zeile, dass
sie nur ein Nachtrag ist.

**Folge:** Der Dateiname schützt nur, solange er sichtbar bleibt; in einer
Tabelle fällt die Summe „0" als „Lage ohne Stärke" auf.

**Empfehlung:** Vermerk in die erste Zeile (vor die Kopfzeile oder als
Spalte), die Summenzeile mit „kein Gesamtstand" beschriften.

**Nachprüfung:** Nachtrag-CSV öffnen: Zeile 1 nennt „NACHTRAG".

**Neu oder alt (Verweis):** alt — R16-W2 (Nachtrag-Knöpfe, „teilweise"),
weiter offen.

### R17-K10 [P3] „Angaben vom Zettel (optional)" in der Schnellerfassung sieht aus wie ein Hinweistext

**Ort:** „Einheit schnell erfassen (nur Stärke)…", Schritt 1, 360x640.

**Beobachtung (gemessen):** Über „1. Einheit" steht ein umrahmtes Feld
„Angaben vom Zettel (optional): Eingetroffen um, Abgerückt um, Nr., Zug". Es ist
ein eingeklapptes `details` (44 px hoch), aber ohne Pfeil oder Plus: Der
Aufklappmarker ist durch die Darstellung unterdrückt.

**Erwartung der Rolle:** Ein Aufklapper zeigt, dass er aufklappt; die
Zettelzeiten sind für den Meldekopf der wichtigste Teil der Schnellerfassung.

**Folge:** Wer die Eintreffzeit vom Zettel nacherfassen will, hält die Zeile für
eine Überschrift und tippt sie womöglich nicht; die Eintreffzeit wird dann mit
„jetzt" gestempelt.

**Empfehlung:** Pfeil oder „▾" an die Zeile; „Eingetroffen um" nicht verstecken.

**Nachprüfung:** Schnellerfassung öffnen: Die Zeile trägt sichtbar ein
Aufklappzeichen.

**Neu oder alt (Verweis):** neu (Nähe R11-M1 „Zettelfelder eingeklappt").

### R17-K11 [P3] Lagemonitor am Telefon: Bedienleiste vor der Lage, „1 abgerückt" bricht um

**Ort:** Lagemonitor bei 360x640 und 390x844.

**Beobachtung (gemessen):** Die erste Zeile ist die Leiste „Stufe: Dunkel ·
Dunkler · Heller (weiß)", erst darunter folgen Funkrufname und Lage. Die Zeile
„6 Einheiten · 15 Fahrzeuge · 1 abgerückt" bricht in „… · 1" und „abgerückt";
die Zeile „Folgemeldung: THW Laufenburg Zugtrupp Fachzug Logistik vor 3 Min"
nimmt je drei Zeilen. Die Seite scrollt (918 px bei 360x640).

**Erwartung der Rolle:** Auch auf dem Telefon steht die Lage vorn; „1 abgerückt"
steht zusammen.

**Folge:** Gering: Am Telefon nutzt der Monitor zur Kontrolle, nicht zur
Anzeige.

**Empfehlung:** Leiste ans Ende; „1 abgerückt" unteilbar.

**Nachprüfung:** Monitor bei 360x640: Funkrufname in der ersten Zeile.

**Neu oder alt (Verweis):** neu (Nähe R15-K5, Auftrag im Monitor am Telefon,
behoben).

### R17-K12 [P3] Der erste Bildschirm der Einsatzansicht am Telefon zeigt Erfassungsknöpfe statt Lage

**Ort:** Einsatzansicht, 360x640 und 390x844.

**Beobachtung (gemessen):** Auf den Kopf (Name, „Name / Ort ändern…", Ort,
letzte Meldung) und die Kennzahlen folgen vier Erfassungsknöpfe („Bogen
scannen…", „Einheit manuell erfassen…", „Einheit schnell erfassen…", „Bögen
einlesen…"). „Neu seit der letzten Kenntnisnahme" beginnt bei y = 644 (360x640)
bzw. 711 (390x844), die Liste „Einheiten" bei 1328 bzw. 1395, die erste Karte
bei 1573 bzw. 1640 px, also 2,5 bzw. 1,9 Bildschirme tief. Die Kennzahlenzeile
bricht bei 360 px in 3 + 2 Zellen mit versetzter Grundlinie („38" gegen „6").

**Erwartung der Rolle:** Beim Öffnen steht die Lage (Neues, Bedarf, älteste
Meldung) vor den Erfassungsknöpfen.

**Folge:** Die Führungskraft, die den Stand übernimmt, scrollt jedes Mal an
den Knöpfen vorbei, bevor sie „Neu seit der letzten Kenntnisnahme" und den
Bedarf sieht.

**Empfehlung:** Neu-Block und Bedarfszeile vor die Erfassungsknöpfe, oder die
Knöpfe in eine Zeile mit Aufklapper zusammenfassen.

**Nachprüfung:** 360x640 beim Öffnen: „Neu seit …" oder die Bedarfszeile ist
ohne Scrollen sichtbar.

**Neu oder alt (Verweis):** neu (Nähe R14-K5, Erfassungsknöpfe kompakt, als
behoben geführt).

## Abschluss

- **Aufgabe geschafft:** ja
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** „Als Einsatzmeldung zählen…" und „Stärke
  ändern…" wirken wie eine Einstufung, sind aber zugleich eine neue Meldung
  „von jetzt" (R17-K1).
- **Größtes Einsatzrisiko:** Das Alter einer Meldung verschwindet mit der
  Handänderung, und mit ihm die Warnung „älter als 1 Std" in Kopf, Karte,
  Monitor und Lageblatt (R17-K1).
- **Top-Priorität für die nächste Iteration:** R17-K1: Alter einer Meldung vom
  Zeitpunkt der Handänderung trennen und „inhaltlich unveränderte" Fassungen
  nicht als „Folgemeldung" zählen.
