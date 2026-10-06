# Audit „Arbeitsablauf", Runde 5 (Einheit → Meldekopf → Ablösung → zurück → Stab, dazu Papier)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit `c0cbae0` (der Code entspricht `4fcdbaf`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde. Schwerpunkt auf den umgebauten Stellen: Fassungsvorrang
(Bogen nach Schnellerfassung), Exportstand je Format, Nachtrag-Dateien,
Abgleich zwischen zwei Geräten in beide Richtungen und Papier-Abgleich mit
„Nr. laut Blatt".

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Locale de-DE, Telefon 360 × 640 mit `isMobile`/`hasTouch` für alle Geräte.
Jedes Gerät ist ein eigener Browser-Kontext mit eigenem Speicher; Zustände
habe ich zwischen den Skripten über `storageState` weitergereicht, also wie
ein Gerät, das zwischendurch neu geöffnet wird. Elf weitere Prüfer nutzten
denselben Server gleichzeitig; Zeiten habe ich deshalb nicht gemessen. Die
Maße (Pixel, Anzahl Einheiten, Seiten) sind davon unberührt.

- **A-Geräte** (Einheiten): `eeb.entwurf.v1` aus `examples/thw/` (`003`
  Crailsheim, `016` Bamberg, `030` Weiden, `001` Albstadt, `018` Erlangen,
  `067` Kassel), `uebung: false`, Einsatzzeitraum auf den Prüftag, `stand`
  auf Minuten vor jetzt gesetzt. Von dort PDF, CSV, Excel und Link über
  „Bogen übergeben… → Weitere Formate". Von Crailsheim mehrere Fassungen
  (älterer Stand, zwei Folgefassungen mit 1 bzw. 2 Personen weniger).
- **M1** (Meldekopf): Sammlung „Hochwasser Jagst" durch Bedienung angelegt.
  Schnellerfassung über einen Entwurf mit `fremd.einsatzId` und
  „In Einsatz übernehmen", danach die Bögen als PDF über „Bögen einlesen…"
  (einzeln und im Stapel). Zug zuordnen, Auftrag/Notiz, Abrücken, Lageblatt,
  Sammel-PDF, Übersichts-CSV, „Alle Daten", Excel, jeweils vollständig und
  mit „Nur neue Bögen".
- **M2** (Ablösung): „Einsatz importieren…" mit der Sammel-PDF von M1, eigene
  Bögen (Crailsheim neuer Stand, Erlangen), eigene Änderungen (Zug, Auftrag),
  Rückgabe an M1 und Gegenimport in beide Richtungen. Beide Geräte vergaben
  parallel die Nr. 5 (M1 an Kassel, M2 an Erlangen).
- **M3** (Papier): Sammel-PDF von M1 mit `pdftoppm` in 18 Seitenbilder
  zerlegt, auf einem leeren Gerät über „Bögen einlesen…" gelesen (6 Bögen),
  danach „Lage vom Papier abgleichen…" mit den Werten von Seite 1 und aus den
  Kästen „Stand am Meldekopf", einmal mit absichtlicher Doppelnummer.
- **V** (Fassungsvorrang): Schnellerfassung 0 / 2 / 8 / 10, danach der
  Bogen 0 / 3 / 9 / 12 mit älterem Stand, beide Antworten („Bogen gilt",
  „Später entscheiden"), Übernahme an der Karte, Weitergabe an ein frisches
  Gerät und an ein Gerät mit demselben Ausgangsstand.
- **Y** (zwei Meldeköpfe, je eine eigene Sammlung gleichen Namens): Import
  der Sammel-PDF des einen in das andere Gerät, einmal über „Einsatz
  importieren…", einmal über „Bögen einlesen…" in der Sammlung.
- Außerdem: Link von A auf M2 mit Sammlung bei frisch geöffneter App (Host
  auf `localhost:4173` umgeschrieben), Bogen mit Einsatzzeitraum im Juli,
  Import einer Nachtrag-PDF auf einem frischen Gerät.

Heruntergeladen und gegengelesen: Lageblatt, Sammel-PDF (18 Seiten),
Nachtrag-PDF, „Übersicht als CSV" (voll und nur neue), „Alle Daten als CSV",
Excel „Oldenburg" (voll und nur neue; Zellen aus dem XML gelesen), dazu
`pdftotext`, `pdftoppm` und die Seitenbilder. Die Screenshots habe ich
angesehen. Skripte und Bilder: `scratchpad/runde5/ablauf/`.

Reihenfolge: Ich habe zuerst ohne Blick in frühere Berichte getestet. Beim
Nachschlagen des Prüfaufbaus im Runde-4-README (vor dem ersten Durchgang)
habe ich dort versehentlich auch den Abschnitt „Stand der Behebung" überflogen;
auf die Wahl der Szenarien hatte das keinen erkennbaren Einfluss. Danach
habe ich `runde-4/arbeitsablauf.md` samt „Stand der Behebung" gelesen und
erst zum Schluss die übrigen Runde-5-Berichte.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit übergibt ihren Bogen (QR, Link oder PDF).
2. **Annahme:** Steht eine Schlange am Meldekopf, erfasst der Meldekopf die
   Einheit schnell, der richtige Bogen kommt später nach.
3. Der Meldekopf sammelt, ordnet Züge zu, lässt abrücken, druckt das
   Lageblatt an die Wand.
4. Ablösung oder zweiter Meldekopf übernimmt oder ergänzt die Lage auf einem
   zweiten Gerät; beide arbeiten eine Zeit parallel, danach gleichen sie ab.
5. **Annahme:** Der Meldekopf liefert dem Stab erst alles, dann in Abständen
   nur das Neue (PDF, CSV oder Excel).
6. Fällt das Gerät aus, bleibt das gedruckte Übergabeblatt; ein neues Gerät
   liest es ein und gleicht Nr., Zeiten und Zug vom Blatt ab.

**Nicht prüfbar:** Kamera-Scan und QR-Anzeige im Vollbild (die QR-Codes habe
ich über die PDF, den Link und Seitenbilder gelesen), Handscanner,
Nahbereichs-Weitergabe, natives Share-Sheet, echtes Drucken, Darstellung der
Excel-Datei in Excel, native Builds. Zwei Geräte teilen hier dieselbe
Systemuhr; ein Uhrversatz zwischen den Geräten (der die Regel „der jüngere
Stand gilt" belasten würde) war deshalb nicht nachzustellen. Dateinamen mit
Umlaut (Erlangen „Ölschaden") speichert dieses Chromium als `download`; das
trat auch bei einer Testseite ohne die App auf und ist ihr nicht
zuzurechnen, ob es in echten Browsern oder Share-Zielen gleich läuft, ist
offen. Das Feld „Eingetroffen am" im Papier-Abgleich zeigt hier das
US-Format (`10/06/2026, 11:58 AM`); das ist die Browsersprache der
Testumgebung, kein Befund. Alle Zeiten sind unter Last entstanden und nicht
gemessen.

## Urteil

Die großen Punkte aus Runde 4 tragen. Der nachgereichte Bogen nach einer
Schnellerfassung führt zu einer klaren Rückfrage („Bogen der Einheit gilt —
ersetzt die Schnellerfassung"), die Entscheidung reist über die Sammel-PDF
auf ein frisches Gerät und über den Abgleich auf ein Gerät mit demselben
Ausgangsstand. Der Exportstand ist je Format getrennt, CSV, „Alle Daten" und
Excel liefern Nachträge mit eigenem Bezugspunkt, auch für Abrücken und Zug.
Die Nachtrag-Dateien tragen „nachtrag-seit-…" im Namen, die Nachtrag-PDF
sagt im Kopf „nicht die ganze Lage", und ein frisches Gerät fragt vor dem
Import eines Nachtrags. Der Abgleich zwischen zwei Geräten arbeitet in beide
Richtungen: Zug, Abrücken und Auftrag kommen an, der Widerspruch wird
benannt, beide Geräte zeigen danach dieselben Köpfe. Der Papier-Abgleich
holt aus 18 Seitenbildern sechs Bögen, schützt vor Doppelnummern und sagt,
wenn App-Nummern von denen auf dem Blatt abweichen können.

Reibung entsteht dort, wo die neuen Teile aneinander stoßen. Erstens kennt
der Exportstand die Fassungsentscheidung nicht: Wer nach einer CSV-Lieferung
den Bogen statt der Schnellerfassung gelten lässt, sieht „seitdem keine neuen
Bögen" und kann den Nachtrag nicht mehr laden, der Stab bleibt bei der
Platzhalter-Stärke (R5-W1). Zweitens legt „Einsatz importieren…" bei zwei
unabhängig angelegten, gleichnamigen Sammlungen eine zweite Sammlung an, ohne
das zu sagen (R5-W2). Drittens ändern sich Nr. beim Zusammenführen still
(R5-W3), und die Quittung des Abgleichs sagt „die Datei enthält nichts, was
hier fehlte", obwohl sich die geltende Fassung geändert hat (R5-W4). Der
Nachtrag als Sammel-PDF ignoriert eine kurz zuvor erfolgte Weitergabe und ist
dann die ganze Lage (R5-W5).

Die Einzelaufgaben schafft man ohne fremde Hilfe. Bei den Lieferungen an den
Stab und beim Zusammenführen zweier Meldeköpfe stimmt das Ergebnis aber
nicht immer, ohne dass die App es sagt.

## Befunde

### R5-W1 [P1] Fassungsentscheidung nach einem Export: „seitdem keine neuen Bögen", Nachtrag gesperrt, der Stab bleibt bei der Schnellerfassung

**Priorität:** P1 · gemessen (Übersichts-CSV; derselbe Mechanismus für die
übrigen Formate: Risiko)

**Fundstelle / Aufgabe:** Einsatzansicht, Karte „⚠ Bogen nachgereicht" →
„Bogen übernehmen" → „Diese Fassung gilt", nachdem eine Lieferung an den Stab
schon gelaufen ist. Code: `src/app/export-stand.ts`, `aenderungenSeit()` und
`nachtragEintraege()`; Feldliste `FELDER = ["status", "zug", "notiz",
"eintreffzeit"]` in `src/app/einsatz-abgleich.ts`. Neu sind Einträge für den
Exportstand nur, wenn ihre ID beim Export fehlte (`neueEintraege`).

**Beobachtung:** Sammlung „Vorrang-Test": Schnellerfassung Crailsheim
0 / 2 / 8 / 10 (Stand 11:34), danach der Bogen der Einheit mit älterem Stand
(08:39, 0 / 3 / 9 / 12, 3 Fahrzeuge, Verpflegung, Kraftstoff), Antwort
„Später entscheiden". „Übersicht als CSV" exportiert (Stärke 10, keine
Fahrzeuge). Dann „Bogen übernehmen" → „Diese Fassung gilt". Die Karte zeigt
danach 0 / 3 / 9 / 12, 3 Fahrzeuge, 80 l Diesel. Unter dem Kästchen steht
unverändert „Übersicht als CSV: zuletzt 06.10.2026, 12:13 · seitdem keine
neuen Bögen". Mit angehaktem Kästchen ist der Knopf „Übersicht als CSV"
gesperrt (`isEnabled() == false`). Die Fassung, die der Stab bekommen hat,
liegt als Eintrag in der Sammlung (der Bogen war schon da), die Entscheidung
verändert nur, welcher Eintrag gilt, und das zählt weder als neuer Eintrag
noch als Änderung (Zug, Abrücken, Auftrag, Eintreffzeit).

**Erwartung der Rolle:** Wenn ich nach der Lieferung den richtigen Bogen
gelten lasse, ist das eine Änderung der Lage. Der nächste Nachtrag enthält
die Einheit mit der neuen Stärke.

**Auswirkung im Einsatz:** Der Stab plant mit 10 Kräften, ohne Fahrzeuge und
ohne Sofortbedarf, während der Meldekopf 12 Kräfte und 3 Fahrzeuge führt. Die
Anzeige „seitdem keine neuen Bögen" bestätigt den falschen Stand, und der
Knopf, der es korrigieren würde, ist gesperrt. Nur ein Gesamtexport (Kästchen
nicht angehakt) bringt die Zahl hin; darauf weist nichts hin. Das ist die
Verbindung der beiden Behebungen von R4-W1 und R4-W2: Jede hält für sich,
zusammen hat keine die andere im Blick. Am Meldekopf mit Schlange
(**Annahme:** zuerst schnell erfassen, Bogen später) ist genau dieser Ablauf
der normale.

**Empfehlung:** Einen Wechsel der geltenden Fassung wie eine Änderung zählen
(„1 Änderung (Fassung)") und die Einheit in den Nachtrag aufnehmen. Die Zeile
zum Exportstand sagt dann „seitdem 1 Änderung (Fassung)", der Knopf bleibt
bedienbar.

**Verifikation:** Schnellerfassung, Bogen einlesen („Später entscheiden"),
„Übersicht als CSV", „Bogen übernehmen": Zeile unter dem Kästchen nennt die
Änderung, „Übersicht als CSV" mit Haken lädt eine Nachtrag-CSV mit Crailsheim
0 / 3 / 9 / 12. Dasselbe für Excel und „Alle Daten".

### R5-W2 [P1] „Einsatz importieren…" legt neben einer gleichnamigen eigenen Sammlung still eine zweite an

**Priorität:** P1 · beobachtet

**Fundstelle / Aufgabe:** Zwei Meldeköpfe legen unabhängig voneinander „Hochwasser
Jagst" an (vor dem ersten Austausch gibt es keine gemeinsame Kennung) und
tauschen dann Sammel-PDFs. Startseite → „Einsatz importieren…". Code:
`src/app/einsatz-abgleich.ts`, `einsatzAbgleichen()` findet die Sammlung
allein über `s.id === importiert.id`; die Quittung in `importiereEinsatzDatei`
(`src/app/app.tsx`).

**Beobachtung:** Y_a hat „Hochwasser Jagst" mit Bamberg und Albstadt, Y_b eine
eigene „Hochwasser Jagst" mit Weiden und Kassel. Y_b liest die Sammel-PDF von
Y_a über „Einsatz importieren…". Quittung: „Einsatz ‚Hochwasser Jagst'
übernommen: 2 Einheiten, davon 2 anwesend." Die Ansicht zeigt 2 Einheiten,
15 Kräfte. Die Startseite führt danach zwei Karten „Hochwasser Jagst"
nebeneinander, die eine mit „2 Einheit(en) anwesend · Stärke 0 / 5 / 11 / 16",
die andere mit den Zahlen von Y_a; unterscheiden lassen sie sich nur an den
Zahlen und der letzten Meldung. Kein Satz sagt, dass es schon eine Sammlung
dieses Namens gab. Den Weg zusammenzuführen gibt es: In der eigenen Sammlung
„Bögen einlesen…" mit derselben PDF fragt „Sammel-PDF einer anderen
Sammlung" und ergibt nach „Übernehmen ohne Zug-Zuordnung" 4 Einheiten, 31
Kräfte. Er steht nur dort, nicht beim Import von der Startseite, die
ausdrücklich „Einsatz importieren…" heißt.

**Erwartung der Rolle:** Importiere ich die Lage des anderen Meldekopfs und
habe schon eine mit demselben Namen, fragt die App: zusammenführen oder
getrennt halten.

**Auswirkung im Einsatz:** **Annahme:** Zwei Meldeköpfe (etwa zwei
Bereitstellungsräume) legen die Lage jeweils selbst an, weil es offline keine
gemeinsame Vorlage gibt. Beim ersten Austausch hält ein Gerät danach zwei
halbe Lagen. Wer weiterarbeitet, schreibt in die falsche, die Weitergabe
geht mit halben Summen heraus, und der Stab sieht zwei gleichnamige Lagen.
Merken tut man es erst an den Zahlen.

**Empfehlung:** Beim Import einer Sammel-PDF, deren Kennung hier unbekannt
ist, deren Name aber einer vorhandenen Sammlung gleicht, dieselbe Rückfrage
stellen wie bei „Bögen einlesen…" („Zusammenführen / als eigene Sammlung /
Abbrechen"). Die beiden Karten auf der Startseite mit Anlagezeit
unterscheiden.

**Verifikation:** Zwei Geräte, je eine eigene „Hochwasser Jagst", Import der
Sammel-PDF des einen in das andere über die Startseite: Rückfrage vor dem
Anlegen; nach „Zusammenführen" eine Karte mit allen Einheiten.

### R5-W3 [P2] Nr. ändern sich beim Zusammenführen still, ohne Hinweis in der Quittung

**Priorität:** P2 · gemessen (Abgleich M1/M2); Merge-Weg: beobachtet, Nummern
vorher nicht abgelesen

**Fundstelle / Aufgabe:** M1 und M2 vergeben parallel, M2 vergibt „Nr. 5" an
Erlangen, M1 an Kassel; danach Sammel-PDF von M2 auf M1 importiert. Code:
`src/app/einheiten-tabelle.ts`, `meldungsNummern()` (Reihenfolge nach der
Empfangszeit des ersten Eintrags; feste Nummern vom Papier ausgenommen).

**Beobachtung:** Auf M1 stand vor dem Import „Nr. 5 THW Kassel". Nach dem
Import: „Nr. 5 THW Erlangen" und „Nr. 6 THW Kassel". Die Quittung sagt „2 neue
Meldung(en) ergänzt. Jetzt 6 Einheiten …" und nennt die Umnummerierung nicht.
Bei „Übernehmen ohne Zug-Zuordnung" (R5-W2) trugen die Einheiten von Y_a nach
dem Zusammenführen die Nr. 1 und 2, Weiden und Kassel von Y_b standen danach
bei 3 und 4; nach derselben Regel waren es vorher 1 und 2 (vorher nicht
abgelesen). Nach dem Gegenimport auf M2 stimmten beide Geräte überein (5
Erlangen, 6 Kassel).

**Erwartung der Rolle:** Eine Nummer, die ich über Funk oder an der Wand
genannt habe, bleibt. Ändert sie sich beim Abgleich, steht das in der
Quittung.

**Auswirkung im Einsatz:** „Nr. 5 rückt ab" ist am Funk die Kurzform, und
Lageblatt, Excel und Sammel-PDF tragen die Nummer. Ein vor dem Abgleich
gedrucktes Lageblatt und ein danach gedrucktes nennen unter derselben Nr.
verschiedene Einheiten, ohne dass die App es sagt. Das Papier-Abgleichsformular
hat dafür „Nummern neu vergeben" als Hinweis; hier fehlt er.

**Empfehlung:** In der Quittung des Abgleichs und beim Zusammenführen sagen:
„Nr. 5 gehört jetzt Erlangen, Kassel hat die Nr. 6 — Lageblatt neu drucken."
Beim Gerät, dessen Aushang schon hängt, die vorhandene Nummer behalten und
die neue Einheit hinten anfügen.

**Verifikation:** Zwei Geräte vergeben dieselbe Nr.; nach dem Import steht in
der Quittung, welche Einheit welche Nummer behält, und der Lageblatt-Vermerk
„Aushang ist nicht mehr aktuell" erscheint.

### R5-W4 [P2] Quittung des Abgleichs: „die Datei enthält nichts, was hier fehlte", obwohl sich die geltende Fassung ändert

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** Zwei Geräte P und Q mit demselben Ausgangsstand
(Schnellerfassung 0 / 2 / 8 / 10 gilt, Bogen 0 / 3 / 9 / 12 liegt in der
Historie, nicht entschieden). Q lässt den Bogen gelten und gibt weiter, P
importiert. Code: `src/app/einsatz-abgleich.ts`, `abgleichText()`; die
Entscheidung steht in `ersetztDurch`, die Feldliste des Abgleichs kennt sie
nicht (vgl. R5-W1).

**Beobachtung:** Quittung auf P: „Einsatz ‚Vorrang-Test': 0 neue Meldung(en)
ergänzt — die Datei enthält nichts, was hier fehlte. Jetzt 1 Einheit, davon 1
anwesend, 1 Folgemeldung." Die Karte steht danach auf 0 / 3 / 9 / 12 mit
„Folgem. 12:05 · 10 → 12", 3 Fahrzeugen und 80 l Diesel. Der Vorrang ist also angekommen (gut), nur sagt es die Quittung
nicht, und der Satz „enthält nichts, was hier fehlte" ist falsch.

**Erwartung der Rolle:** Die Quittung nennt jede Änderung an der Lage, so wie
sie Zug, Abrücken und Auftrag nennt: „Crailsheim: Bogen der Einheit gilt
(Stärke 10 → 12)".

**Auswirkung im Einsatz:** Die Lage wächst um zwei Kräfte, drei Fahrzeuge und
den Sofortbedarf, und der Text sagt, es sei nichts passiert. Wer die Kopfzahl
vorher im Kopf hatte, sucht den Grund.

**Empfehlung:** Die Fassungsentscheidung als Feld in den Abgleich
aufnehmen (zusammen mit R5-W1) und in die Quittung schreiben.

**Verifikation:** Nachstellen wie oben: Quittung nennt „Crailsheim: Bogen der
Einheit gilt (Stärke 10 → 12)", die Zeile „0 neue Meldung(en) … nichts, was
hier fehlte" erscheint nicht.

### R5-W5 [P2] Nachtrag als Sammel-PDF ignoriert die Weitergabe und ist dann die ganze Lage; das Wort „Sammel-PDF" meint zwei Dinge

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** Einsatzansicht von M1 nach „Einsatz weitergeben /
sichern" (11:46) und einer weiteren Einheit (Albstadt), Kästchen „Nur neue
Bögen…" angehakt. Code: `src/app/export-stand.ts` (Stände je Format; die
Weitergabe hat „ihren eigenen Stand", `eeb.weitergabe-stand.v1`), Zeilen in
`src/app/einsaetze-ui.tsx`.

**Beobachtung:** Die Weitergabe um 11:46 war eine Sammel-PDF mit 3 Einheiten.
Danach kommt Albstadt dazu. Unter dem Kästchen steht „Sammel-PDF: noch nicht
in diesem Format exportiert — alle Bögen sind neu." „Sammel-PDF (nur neue
Bögen)" liefert 4 Einheiten statt 1. Die Datei heißt wie eine Gesamt-PDF
(`eeb-einsatz-061148okt26_…`), nicht „nachtrag". Die CSV- und Excel-Nachträge
derselben Lage liefern dagegen richtig nur Albstadt. Der Erklärtext darüber
nennt „Einsatz weitergeben / sichern" „erzeugt die Sammel-PDF"; die Zeile
darunter nennt das andere Format „Sammel-PDF". Die Runde-4-Entscheidung
(Weitergabe zählt nicht als Lieferung an den Stab) ist damit umgesetzt, aber
im Wortlaut nicht erkennbar. Auch [fuehrungssicht.md](fuehrungssicht.md)
nennt den Fall (39 statt 35 Seiten in deren Lauf).

**Erwartung der Rolle:** Habe ich eben die Sammel-PDF herausgegeben, ist
„Sammel-PDF: noch nicht exportiert" ein Widerspruch. Entweder zählt die
Weitergabe, oder die Zeile sagt, dass sie nicht zählt.

**Auswirkung im Einsatz:** Der Stab bekommt die ganze Lage noch einmal und
sucht, was neu ist; eine Nachtrag-Datei, die wie eine Gesamtdatei heißt und
aussieht, wird zudem leicht für diese gehalten.

**Empfehlung:** Die Zeile benennt den Grund („noch nie als Nachtrag
geliefert — die Weitergabe von 11:46 zählt hier nicht") und bietet an, ab
der Weitergabe zu rechnen. Der erste Nachtrag trägt, wenn er alles enthält,
„erste Lieferung" im Namen und im Kopf.

**Verifikation:** Weitergabe, dann eine neue Einheit, Kästchen anhaken: Die
Zeile erklärt, warum „alle Bögen sind neu" gilt, oder der Nachtrag enthält
nur die neue Einheit; der Dateiname und Seite 1 sagen, was die Datei ist.

### R5-W6 [P2] Der Exportstand wandert nicht mit der Lage: nach der Ablösung beginnt der Nachtrag bei null

**Priorität:** P2 · beobachtet

**Fundstelle / Aufgabe:** M2 importiert die Sammel-PDF von M1, nachdem M1
um 11:47/11:48 Sammel-PDF, Übersichts-CSV und Excel an den Stab geliefert hat.
Code: `src/app/export-stand.ts` (Ablage `eeb.export-stand.v2`; geht in die
Datensicherung, nicht in die Weitergabe).

**Beobachtung:** Auf M2 steht nach dem Import „Noch kein Export aus diesem
Einsatz — alle Bögen sind neu." Der Vermerk „Weitergegeben …" reist dagegen
mit („Stand des anderen Geräts übernommen"). Der erste Nachtrag auf M2 wäre
die ganze Lage.

**Erwartung der Rolle:** Führt M2 die Lage weiter, weiß es, was der Stab
schon hat.

**Auswirkung im Einsatz:** Bei der Schichtübergabe liefert der neue
Meldekopf dem Stab beim ersten Mal alles, obwohl dort die meisten Einheiten
schon liegen. **Annahme:** Der Stab trägt Excel-Zeilen fort; doppelt
gelieferte Zeilen oder Summen laufen dann doppelt. Runde 4 hat das für den
alten gemeinsamen Merker bewusst so entschieden („lieber einmal zu viel
liefern"); für die Weitergabe an die Ablösung ist es der Normalfall.

**Empfehlung:** Die Stände (nur Kennungen und Zeitpunkt, keine Personendaten)
mit der Sammel-PDF weitergeben und auf dem Gerät als „Stand von Gerät …
übernommen" zeigen; ersatzweise beim ersten Nachtrag fragen, was der Stab
zuletzt bekam.

**Verifikation:** M1 liefert CSV, gibt an M2 weiter: M2 zeigt „Übersicht als
CSV: zuletzt 11:47 (von anderem Gerät) · seitdem …".

### R5-W7 [P2] Nachtrag-CSV und -Excel: eine Einheit mit bloßer Zugänderung steht mit voller Stärke in „Summe Nachtrag", ohne Kennzeichen, warum sie dabei ist

**Priorität:** P2 · gemessen (CSV), Excel gleiche Datenmenge

**Fundstelle / Aufgabe:** „Übersicht als CSV" mit Haken nach einer reinen
Zugänderung. Code: `src/app/export-stand.ts` (`nachtragEintraege`: neue
Meldungen plus die geltende Fassung jeder geänderten Einheit),
`src/app/einsatz-csv.ts`.

**Beobachtung:** Sammlung „Vorrang-Test": Voll-CSV um 12:05, danach nur
Crailsheim auf „Zug 3". Die Zeile unter dem Kästchen sagt „seitdem 1 Änderung
(Zug)", der Nachtrag (`eeb-einsatz-nachtrag-seit-20261006-1205-…csv`) enthält
Crailsheim mit allen Spalten und endet mit „Summe Nachtrag (1 Einheiten)"
und der Stärke 0 / 3 / 9 / 12. Die Spalten „Status" und „Quelle" sagen nicht,
dass die Einheit nur wegen des Zugs dabei ist. Beim Abrücken-Nachtrag im Excel trägt die Zeile
„ABGERÜCKT — zählt nicht in der Lage" und steht im Block „Nicht in der Lage
gezählt"; für Zug oder Auftrag gibt es kein Gegenstück.

**Erwartung der Rolle:** Ein Nachtrag sagt je Zeile „neu" oder „geändert:
Zug". Die Summe Nachtrag zählt nur neue Kräfte.

**Auswirkung im Einsatz:** Wer die Summe Nachtrag auf die bisherige Summe
addiert, zählt 12 Kräfte doppelt. Wer die Zeile ohne Kennzeichen sieht,
sucht den Unterschied zur letzten Lieferung selbst.

**Empfehlung:** Eine Spalte „im Nachtrag wegen" (neu / Zug / Auftrag /
Abrücken / Fassung) und die Summe auf neue Einheiten beschränken oder
getrennt ausweisen. Verweis auf [fuehrungssicht.md](fuehrungssicht.md)
R5-K6 (Teilmenge nur im Namen).

**Verifikation:** Nachtrag nach einer Zugänderung: Die Zeile nennt „Zug", die
Summe Nachtrag zählt die Einheit nicht noch einmal.

### R5-W8 [P3] Nachtrag-Dateien: drei Namensschemata, drei Bezugspunkte

**Priorität:** P3 · beobachtet

**Fundstelle / Aufgabe:** Dateinamen und Zeilen des Exportstands, M1 nach
mehreren Lieferungen. Code: `src/app/pdf.ts` (`eeb-einsatz-nachtrag-…`).

**Beobachtung:**

| Format | Name des Nachtrags | Bezugspunkt im Namen |
| --- | --- | --- |
| Sammel-PDF | `eeb-einsatz-nachtrag-061210okt26_…` | Erstellzeit, kein „seit" |
| Übersichts-CSV, „Alle Daten", Excel | `eeb-einsatz-nachtrag-seit-20261006-1147-…` | „seit" mit eigenem Bezugspunkt |
| erster Nachtrag eines Formats (alles) | `eeb-einsatz-061148okt26_…` | wie die Gesamtdatei |

Im selben Nachtrag steht in der PDF „seit 11:48", in der CSV „seit 11:47":
je Format ein Bezugspunkt, wie gewollt, aber im Stab liegen drei Dateien mit
drei „seit".

**Erwartung der Rolle:** Aus dem Dateinamen sehe ich, ob die Datei ein
Nachtrag ist und seit wann.

**Auswirkung im Einsatz:** Kleine Zeitverluste beim Ablegen und Vergleichen;
der erste Nachtrag eines Formats ist von einer Gesamtdatei nicht zu
unterscheiden (R5-W5).

**Empfehlung:** Ein Schema für alle Formate („nachtrag-seit-<Zeitpunkt>"),
und die erste Lieferung als solche benennen.

**Verifikation:** Nachtrag in allen drei Formaten: gleiches Schema.

### R5-W9 [P3] Karte einer „nachgereichten" Schnellerfassung: „3 Fahrzeuge abgemeldet" liest sich wie ein Ereignis

**Priorität:** P3 · beobachtet

**Fundstelle / Aufgabe:** Nach „Später entscheiden": Karte der
Schnellerfassung mit nachgereichtem Bogen (Aufgeklappt).

**Beobachtung:** Unter der Karte der Schnellerfassung (0 / 2 / 8 / 10, keine
Fahrzeuge) steht „seit 06.10.2026, 08:39: Stärke 12 → 10 · 3 Fahrzeuge
abgemeldet", der Vergleich gegen den Stand des Bogens. Die Schnellerfassung hat
nie Fahrzeuge erfasst; abgemeldet hat niemand etwas.

**Erwartung der Rolle:** Der Vergleich nennt „Schnellerfassung ohne
Fahrzeuge und Sofortbedarf", nicht „abgemeldet".

**Auswirkung im Einsatz:** Unsicherheit: Hat die Einheit Fahrzeuge verloren?
Die Zeile steht direkt über „Bogen übernehmen", der Entscheidung, die sie
klären soll.

**Empfehlung:** Bei Schnellerfassungen „Fahrzeuge, Personal und Sofortbedarf
nicht erfasst" statt „abgemeldet".

**Verifikation:** Gleiche Lage: Der Vergleich nennt „nicht erfasst".

## Verweise auf andere Runde-5-Berichte

Diese Stellen habe ich ebenfalls beobachtet und zähle sie hier nicht als
eigene Befunde:

- **Lageblatt druckt „≠" als Fremdzeichen** (Zeile „Rückfrage: Verpflegung 12
  „` Stärke 10", im 300-dpi-Ausschnitt gesehen): [fuehrungssicht.md](fuehrungssicht.md)
  R5-K2.
- **Lageblatt alphabetisch statt nach Nr., Bemerkung der Einheit am Zeilenende
  abgeschnitten** („… nicht mit aus …"): [analog-first.md](analog-first.md)
  R5-A9. Bei meinen sechs Einheiten lief die Nr.-Spalte 4, 2, 5, 6, 3, 1.
- **Papier-Abgleich schreibt die Zeit des Einlesens als Eintreffzeit vor:**
  [analog-first.md](analog-first.md) R5-A1. Bei mir stand in allen sechs
  Zeilen „11:58"; ich habe die Zeiten vom Blatt von Hand überschrieben.
- **Folgemeldung einer abgerückten Einheit holt sie zurück:**
  [fuehrungssicht.md](fuehrungssicht.md) R5-K1; nicht nachgestellt.
- **Lange Quittung nach Import und Abgleich** (ein Absatz mit Widerspruch,
  Aktualisierung und Zählung): [fuehrungssicht.md](fuehrungssicht.md) R5-K3.
- **Eine Uhr, die vorgeht, löscht Sammlungen:**
  [zerstoerende-handlungen.md](zerstoerende-handlungen.md) R5-D1. Für die
  Konfliktregel „der jüngere Stand gilt" ist das die gleiche Quelle (siehe
  „Nicht prüfbar").

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Fassungsvorrang:** Schnellerfassung 0 / 2 / 8 / 10, danach der Bogen mit
  älterem Stand: Rückfrage „Bogen der Einheit nachgereicht" mit Bisher/Neu und
  dem Satz „nach dem Zeitstempel bliebe die Schnellerfassung gültig". „Bogen
  der Einheit gilt — ersetzt die Schnellerfassung" nennt, was bleibt (Zug,
  Auftrag, Eintreffzeit); die Quittung wiederholt die Entscheidung. „Später
  entscheiden" legt „⚠ Bogen nachgereicht" an die Karte, „Bogen übernehmen"
  fragt noch einmal. Die Entscheidung kommt in einer Sammel-PDF auf einem
  frischen Gerät als Stärke 12 an.
- **Link bei frisch geöffneter App mit Sammlung:** „Meldung von ‚THW Kassel …'
  empfangen … Wohin damit?" mit der Sammlung zuerst; bei bekannter Einheit
  „Einheit ist bereits gemeldet — Als neue Fassung anhängen / Als eigene
  Einheit führen".
- **Exportstand je Format:** CSV, „Alle Daten", Excel und Sammel-PDF haben je
  eine Zeile („zuletzt … · seitdem …"), Voll-Export verschiebt den Bezugspunkt
  des Formats, Abrücken, Zug und Auftrag zählen als Änderung („3 Änderungen
  (Abrücken, Zug, Auftrag)"), die Weitergabe verbraucht ihn nicht. Nachtrag
  nach „Abrücken" bringt die Einheit im Excel-Block „Nicht in der Lage
  gezählt".
- **Nachtrag-Dateien:** Nachtrag-PDF „NACHTRAG seit 11:48 — nicht die ganze
  Lage", Summe „Summe Nachtrag (2 zählend · 1 abgerückt)"; Nachtrag-CSV und
  -Excel mit „nachtrag-seit-…" im Namen; ein frisches Gerät fragt vor dem
  Import „Nur ein Nachtrag — nicht die ganze Lage … Die ganze Lage kommt vom
  Gerät, das sie führt".
- **Abgleich zwischen zwei Geräten in beide Richtungen:** M1 setzt Zug 1 und
  Abrücken, M2 Zug 2 und Notiz. Quittung auf M2: „1 Meldung aktualisiert:
  Crailsheim abgerückt 12:03. 1 Widerspruch … hier ‚Zug 2', in der Datei ‚Zug
  1'; der Stand dieses Geräts bleibt"; auf M1: „… der jüngere Stand aus der
  Datei gilt". Beide Geräte stehen danach auf Zug 2, abgerückt 12:03,
  Notiz „Pumpe 2 defekt, nur Abschnitt Nord". Der Weitergabe-Vermerk zählt
  die Änderungen des anderen Geräts nicht als „hier" („seitdem hier nichts
  Neues").
- **Papier-Abgleich:** 18 Seitenbilder ergeben „6 Bögen aufgenommen"; die
  sieben Seiten ohne Code werden genannt, ebenso, dass von Hand korrigierte
  Angaben nicht im Code stecken. „Nr. laut Blatt (leer = App vergibt)":
  Eine Doppelnummer wird abgelehnt („‚Nr. 2' steht bei THW Bamberg … und THW
  Weiden … Nichts übernommen.") und die eingegebenen Werte bleiben im
  Formular. Bei einer leeren Nummer sagt „Nummern neu vergeben …", dass sie
  vom Blatt abweichen kann. Danach Nr. 4, 2, 1, 5, 6, 3 wie auf dem Blatt,
  Zug-Zwischensummen („3 Züge"), „Auftrag ✓".
- **Gegenlesen:** Lageblatt und Übersichts-CSV stimmen in meiner Lage in
  Stärke, Fahrzeugen und Status der Zeilen überein (Lageblatt 1 / 13 / 32 / 46
  bei 5 zählenden und 1 abgerückten Einheit, 17 Fahrzeuge, Diesel 620 l); die
  Excel-Liste zeigte in der kleineren Lage mit 3 Einheiten dieselben Zahlen
  wie die CSV. Abgerückt steht im
  eigenen Block, Excel trennt „Nicht in der Lage gezählt".
- **Bogen mit vergangenem Zeitraum:** „Rückfrage: Zeitraum vorbei" an der
  Karte; die Excel-Zelle „Verfügbar bis" bleibt leer, die Bemerkung sagt
  „Einsatzzeitraum im Bogen endete 18.07.2026 — Bogen aus früherer Lage?".
- **Zug-Bündel:** „Sammel-PDF einer anderen Sammlung" fragt mit drei Wegen,
  der erste („Übernehmen ohne Zug-Zuordnung") steht vorn und trägt den Satz
  „Die Sammlung heißt wie diese Lage — ihr Name ist vermutlich kein Zug."

## Abgleich mit Runde 4

Grundlage: [../runde-4/arbeitsablauf.md](../runde-4/arbeitsablauf.md) mit
„Stand der Behebung" und [../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Stand laut Behebung | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-W1 Fassung: Bogen nach Schnellerfassung (P1) | behoben, mit Grenze (Vorrang nur in der App) | hält, mit Rest | Rückfrage, Quittung, Karte, Übernahme und Weitergabe tragen. Rest: Der Exportstand und die Quittung des Abgleichs kennen die Entscheidung nicht (R5-W1, R5-W4). Die Grenze (Kern und Kiosk-Stapel kennen den Vorrang nicht) lag außerhalb meines Aufbaus. |
| R4-W2 Ein Merker für alle Empfänger (P1) | behoben | teilweise | Je Format getrennt, Weitergabe und Lageblatt verbrauchen ihn nicht; Zeilen und Knöpfe stimmen. Offen: der Nachtrag als Sammel-PDF nach einer Weitergabe ist die ganze Lage (R5-W5), der Stand reist nicht mit (R5-W6), die Fassungsentscheidung ist keine Änderung (R5-W1). |
| R4-W3 Link-Kaltstart ohne „Wohin damit?" (P1) | behoben | hält | Gerät mit Sammlung, frisch geöffnete App, Link: „Wohin damit?" mit der Sammlung zuerst; bei bekannter Einheit zweite Rückfrage; kein Entwurf. Mit eigenem Bogen auf dem Gerät nicht gesondert geprüft. |
| R4-W4 Nachtrag sagt nicht, dass er Teil ist (P2) | behoben | hält, mit Rest | PDF-Kopf, „Summe Nachtrag", Dateiname, Warnung beim Import. Rest: uneinheitliche Namen (R5-W8), Zeilen ohne Grund und Summe (R5-W7); Excel-Kopf fehlt laut Behebung bewusst. |
| R4-W5 CSV „Unterbringung M/W/D" (P2) | behoben | hält | „Unterbringung angefordert M/W/D" nur für Einheiten mit Anforderung (Weiden 6 / 2 / 0, Crailsheim 0, Summe 6 / 2 / 0); „WC/Dusche M/W/D" für alle. |
| R4-W6 Zeitraum-Prüfung nur beim Absender (P2) | behoben | hält | Karte „Zeitraum vorbei", Excel „Verfügbar bis" leer mit Bemerkung. |
| R4-W7 Weitergabe-Vermerk zählt Änderungen des anderen Geräts (P2) | behoben | hält | „Weitergegeben 12:03 — seitdem hier nichts Neues. Stand des anderen Geräts übernommen 12:04." Auf M2 zählt „hier" nur Zug und Auftrag, die dort selbst geändert wurden. |
| R4-W8 Kleinere Brüche (P3) | behoben | hält, mit Rest | „Übernehmen ohne Zug-Zuordnung" vorn; Hinweis auf das Kästchen vorhanden („weiter unten … ankreuzen"). „Aus der Vorlage ergänzen…" nicht geprüft. Beim Import von der Startseite fehlt die Rückfrage ganz (R5-W2). |
| R4-A1 Nr. nur nach Eingang (aus dem Analog-Bericht, Verweis) | Feld „Nr. laut Blatt" | hält | Feld, Doppelnummern-Sperre und Hinweis tragen. Die QR-Codes tragen weiter keine Nr.; sie kommt vom Blatt. Nr. ändern sich im Abgleich zwischen Geräten dennoch still (R5-W3). |
| Bestätigtes R4: Abgleich in beide Richtungen, Stapel, Zug-Bündel, übereinstimmende Exporte | – | hält | Alles in meinem Lauf nachgestellt, siehe „Bestätigtes". Verkehrt hat sich nichts. |

Bilanz: Keine Behebung der Arbeitsablauf-Befunde aus Runde 4 hat sich
verkehrt. Zwei sind nur teilweise gelöst (R4-W1 und R4-W2 im Zusammenspiel:
R5-W1, R5-W5), die übrigen halten. Neu sind die Befunde am Zusammenführen
zweier Meldeköpfe (R5-W2, R5-W3, R5-W4) und am Exportstand beim
Schichtwechsel (R5-W6).

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Einheit melden, schnell erfassen, Bogen
  nachreichen, sammeln, abrücken, zwischen zwei Geräten abgleichen, vom
  Papier wiederanlaufen: ja. Zwei unabhängig angelegte Meldeköpfe
  zusammenführen: nur über den zweiten Weg, ohne Hinweis darauf. Lückenlose
  Nachträge an den Stab nach einer Fassungsentscheidung: nein (R5-W1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Seitdem keine neuen Bögen" heißt „seit der
  letzten Lieferung hat sich nichts geändert". Gemeint ist: kein neuer
  Eintrag und kein Zug-, Auftrags- oder Statuswechsel; ein Wechsel der
  geltenden Fassung gehört nicht dazu (R5-W1).
- **Größtes Einsatzrisiko:** Der Stab bleibt bei der Schnellerfassung, obwohl
  der Meldekopf den Bogen längst gelten lässt, und die App zeigt „keine neuen
  Bögen" bei gesperrtem Nachtrag-Knopf (R5-W1).
- **Top-Priorität für die nächste Iteration:** Den Wechsel der geltenden
  Fassung in Exportstand, Nachtrag und Abgleich-Quittung als Änderung führen
  (R5-W1, R5-W4).
