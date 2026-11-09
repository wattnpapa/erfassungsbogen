# Audit „Führungssicht“, Schwerpunkt Beispielbögen, Runde 2 (Kräfteansatz für eine Übung zusammenstellen)

Prüfer: Rollenaudit `thw-command-reviewer` · Datum: 2026-11-09 ·
Prüfgegenstand: Live-Seite https://erfassungsbogen.app/ (Version
`v2026.1109.833`), Code-Stand Commit `085a93b` (`main`). Nur der Bereich
Beispielbögen: Dialog „Beispielbögen“ mit Suche, Register, Pfadleiste,
Tabelle bzw. Karten und dem neuen Knopf „Alle … in eine Übungs-Sammlung“,
dazu die so angelegte Übungs-Sammlung mit Lageblatt und Sammel-PDF, weil sie
zur Aufgabe der Rolle gehört. Code zur Einordnung: `src/app/beispiele-dialog.tsx`,
`src/app/app.tsx` (`beispieleAlsUebung`), `src/app/beispiel-heute.ts`.

Zählung: **P0: 0 · P1: 1 · P2: 1 · P3: 2** · Hinweise (ohne Priorität): 5

Nachprüfung Runde 1: **behoben 3 · teilweise 4 · offen 1** (von 8).

Reiner Prüfbericht, keine Codeänderung. Je Sachverhalt ein Befund; was ein
alter Befund schon beschreibt, steht unter „Nachprüfung Runde 1“ und nicht noch
einmal als neuer Befund. Taktische Fragen (welche Einheiten ein Zug haben
sollte, ob eine Stärke „richtig“ ist) bewerte ich nicht.

## Rolle und Aufgabe

Wie in Runde 1: Ausbilder oder Führungskraft stellt für eine Stabsrahmen-
oder Meldekopf-Übung einen Kräfteansatz zusammen, (a) einen Technischen Zug
mit Fachgruppen aus einem THW-Ortsverband, (b) einen KatS-Zug eines Landes.
Der Ansatz soll verglichen, in eine Übungs-Sammlung übernommen und mit
Lageblatt bzw. Sammel-PDF an die Übungsteilnehmer gegeben werden.

## Prüfaufbau

Playwright (Chromium, `chromium.launch()` ohne Optionen), Locale de-DE,
`deviceScaleFactor` 1. Ansichten: Desktop 1280x900, Tablet 820x1180
(`isMobile`/`hasTouch`), Telefon 390x844 (`isMobile`/`hasTouch`). Skripte,
Bildschirmfotos, Lageblatt und Sammel-PDF unter `/tmp/claude-0/r2-fuehrung/`.
Keine Eingriffe ins DOM, keine eingeschleusten Skripte; jeder Lauf in frischem
Browser-Kontext (leerer Speicher). PDF-Inhalte mit `pdftotext` gelesen.

Geprüft:

- Suche: „Forchheim“, „Landshut“, „Schweinfurt“, „Wilhelmshaven“, „Hessen“,
  „Wassergefahren“, „Fachgruppe Wassergefahren“, „FGr W“, „fgr-w“,
  „Zugtrupp“, „Bergungsgruppe“, „Löschzug“, „Bayern Zugtrupp“.
- „Alle … in eine Übungs-Sammlung“ für OV Forchheim (10 Bögen), OV Landshut
  (11, zwei Technische Züge), OV Augsburg (9, zwei Technische Züge),
  OV Schweinfurt (6), THW direkt (101), Katastrophenschutz Hessen (37),
  Niedersachsen (33), Mecklenburg-Vorpommern (27). Je Ordner die Stärken der
  Dialogzeilen aufsummiert und mit der Lage der Sammlung verglichen.
- In der Übungs-Sammlung: Kopfzahlen, Einheitenkarten, Tabellenansicht,
  „Lageblatt (A4 quer)“ (Landshut), „Einsatz weitergeben / sichern“
  (Sammel-PDF, Forchheim, 25 Seiten).
- Ordnergrenzen: Übungs-Sammlung OV Forchheim angelegt, danach drei Bögen
  aus OV Schweinfurt einzeln über „Anzeigen“ → „In Einsatz-Sammlung
  ablegen…“ dazugelegt (Klicks gezählt, Rückfragen mitgeschrieben).
- „Anzeigen“ eines Beispielbogens (Hessen, 1. Löschgruppe): Zeitraum,
  Stand, Warnungen.
- Herkunftsspalte aller Ordner außerhalb der THW-Ortsverbände (484 Zeilen
  in 24 Ordnern) maschinell auf Aufbau, Doppelwörter und doppelte Träger
  durchgesehen.
- Tablet 820x1180, Desktop, Telefon: Darstellung (Tabelle oder Karten),
  Lage der drei Aktionsknöpfe zum Rollbereich, Sammelweg-Knopf.

## Annahmen

- Für eine Übung wird ein Zug meist aus einer Herkunft zusammengestellt; für
  Ergänzungen (zweite Fachgruppe W aus der Nachbarschaft) greift man über die
  Herkunft hinaus. Annahme über die Übungsvorbereitung, keine Vorschrift.
- Bei einer Meldekopf-Übung kommen die Einheiten erst während der Übung an;
  die vom Ausbilder vorab angelegte Übungs-Sammlung dient als Soll-Lage bzw.
  Lösung. Auch das ist eine Annahme über den Übungsablauf.

## Nicht prüfbar

- Lokaler Produktionsbuild (privates Submodul fehlt); geprüft wurde nur die
  Live-Seite.
- Echtes Share-Sheet am Tablet, Drucken der PDF, Scannen der QR-Codes mit
  Kamera.
- Electron- und Capacitor-Fassung.
- Ob ein zweites „Alle … in eine Übungs-Sammlung“ für denselben Ordner eine
  zweite, gleichnamige Sammlung anlegt, habe ich nicht gezielt geprüft.

## Urteil

Für den einfachen Fall ist die Aufgabe jetzt **ohne fremde Hilfe in Sekunden
erledigt**: „Forchheim“ ins Suchfeld, Ordner antippen, „Alle 10 in eine
Übungs-Sammlung“: nach rund 1,8 s steht eine Sammlung der Art „Übung“ mit
zehn Einheiten, 1/22/66//89, 23 Fahrzeugen, alle Stände auf heute, keine
Veraltet-Warnung, keine Rückfrage zum Löschen. Lageblatt und Sammel-PDF zeigen
dieselben Zahlen. Am Tablet erscheinen Karten mit allen drei Aktionen. Das
ist gegenüber Runde 1 ein großer Schritt.

Gerade beim Kernbeispiel der Rolle, einem OV mit **zwei Technischen Zügen**,
stimmt die Lage aber nicht: Aus OV Landshut (11 Bögen) werden 9 Einheiten mit
76 statt 89 Helfern, weil der Zugtrupp und die Bergungsgruppe des 2. TZ den
Bogen des 1. TZ als „neue Fassung“ überschreiben, während die Meldung „mit 11
Beispielbögen angelegt“ sagt (BB2-K1). Wer das nicht nachrechnet, übt mit
einem stillschweigend falschen Kräfteansatz. Der Zug, im Dialog sichtbar,
kommt in der Sammlung weiter nicht an („10 ohne Zug“, BB-K7). Die neue Suche
findet Orte und Ortsverbände, aber keine Einheitstypen in Klartext
(„Bergungsgruppe“: 0 Treffer bei 870 Bögen, BB2-K2). Mehrfachauswahl,
Summen im Dialog und Sortierung fehlen weiterhin; für einen KatS-Zug eines
Landes gibt es nur „alle 37 Bögen aus 20 Kreisen“ oder Einzelablage.

Geprüft und in Ordnung (nicht gemeldet):

- Summen der Übungs-Sammlung gleich der Summe der Dialogzeilen bei Forchheim
  (1/22/66//89, 23 Fzg), Hessen (7/56/163//226, 41 Fzg), Niedersachsen
  (11/31/156//198, 73 Fzg), Mecklenburg-Vorpommern (9/26/90//125, 40 Fzg) und
  THW direkt (14/230/717//961, 301 Fzg). Fünf Zeilen „Zugtrupp (ZTr)“ in
  Hessen und vier in Mecklenburg-Vorpommern werden nicht zusammengeführt.
- Datierung: Geöffneter Beispielbogen „Zeitraum 09.11.2026 – 10.11.2026“, in
  der Sammlung „Stand der Angaben 09.11.2026, 08:44“, kein „Stand vor … Tagen“,
  kein „Einsatzzeitraum … ist vorbei“.
- Einzelablage über Ordnergrenzen: drei Bögen aus OV Schweinfurt in die
  Übungs-Sammlung OV Forchheim, je Bogen 5 Klicks (Startseite, Dialog,
  „Anzeigen“, „In Einsatz-Sammlung ablegen…“, Sammlung), keine Rückfrage;
  der Dialog öffnet jedes Mal wieder bei OV Schweinfurt.
- Sammel-PDF (25 Seiten) nach rund 10 s, Übergabe-Übersicht mit Lage und
  Bedarf, jede Einheit mit „ÜBUNG“.

## Nachprüfung Runde 1

| ID | Ergebnis | Beobachtung Runde 2 |
| --- | --- | --- |
| BB-K1 | teilweise | Für einen Ordner behoben: „Alle 10 in eine Übungs-Sammlung“ ist ein Klick ab geöffnetem Ordner, Art „Übung“, zehn Einheiten, keine Ersetzen-/Löschen-Rückfrage, auch nicht bei wiederholter Einzelablage. Offen: keine Auswahl einzelner Bögen und keine Auswahl über Ordnergrenzen; Suchtreffer haben keinen Sammelweg (Knopf nur bei `!suchErgebnis`); auf Landesebene nur „alle 37“ (Hessen, 20 Kreise, sieben verschiedene Züge) oder je Bogen 5 Klicks; „Links der Auswahl“ fehlt; der Dialog ist aus der Sammlung heraus weiter nicht erreichbar. Neue Folge des Sammelwegs: BB2-K1. |
| BB-K2 | behoben | 820x1180: Karten statt Tabelle (`display: block` je Zeile), „Anzeigen“ 116–220, „PDF“ 240–311, „Link“ 330–401 px im Rollbereich 107–713 px, kein seitliches Rollen (606 = 606 px), in OV Forchheim, THW (101) und Hessen. 1280x900 Tabelle mit allen Knöpfen im Rollbereich, 390x844 Karten. |
| BB-K3 | offen | Über der Tabelle weiter nur „10 Bögen“ bzw. „11 Bögen“; keine Summenzeile, keine Summe je Zug. OV Landshut wäre 1/9/24//34 (1. TZ) und 1/13/41//55 (2. TZ); die Summe erscheint erst in der Sammlung und ist dort falsch (BB2-K1). |
| BB-K4 | teilweise | Suchfeld vorhanden: „Forchheim“, „Landshut“, „Wilhelmshaven“ finden den OV-Ordner mit Pfad in einem Schritt. Einheitstypen in Klartext finden nichts oder fast nichts (BB2-K2). Sortierung und Filter nach Einheitstyp fehlen weiter; Spaltenköpfe nicht bedienbar. |
| BB-K5 | teilweise | Behoben: „SAR-Leitstelle“ nicht mehr doppelt; THW, Niedersachsen, Sachsen, Thüringen, Saarland, Brandenburg mit Ort fett. Offen: In Hessen (37 von 37 Zeilen), Mecklenburg-Vorpommern (27/27), Rheinland-Pfalz (37/37, Modulkennung „BS-01 · Brandschutz“), Berlin (8/18), NRW (7/13) und Bundeswehr (3/8) steht fett der Zug, die Einheit oder das Modul statt eines Orts. Hessen: Träger in 18 Zeilen doppelt („Deutsches Rotes Kreuz — Kreisverband Hochtaunuskreis“ / „DRK-Kreisverband Hochtaunuskreis“). Neue Doppelwörter: „übergeordnetes Landeskommando Landeskommando (fiktiv)“ (Bundeswehr, 2 Zeilen), „Landkreis/kreisfreie Stadt Landkreis Moorwehde“ (BBK, 5 Zeilen). THW direkt (101 Bögen): weiter kein Zughinweis. |
| BB-K6 | behoben | Zeitraum und Stand auf heute (siehe „Geprüft und in Ordnung“); keine Veraltet-Warnung in Sammlung, Lageblatt und Sammel-PDF. Warnungen aus den Daten selbst („alle als ‚männlich‘ (Vorbelegung)“, „Sitzplätze fehlen“) stehen weiter in Karten und Sammel-PDF; sie gehören nicht zu BB-K6. |
| BB-K7 | teilweise | Art „Übung“: behoben (Sammelweg legt „Übung“ an, Lage zählt). Zug: offen. Forchheim „10 ohne Zug“, Landshut „9 ohne Zug“, Hessen „37 ohne Zug“, obwohl der Dialog „1. Technischer Zug“ bzw. in der Herkunft „Sanitätszug (SanZ)“ zeigt; Spalte „Zug“ in Lageblatt und Sammel-PDF leer. |
| BB-K8 | behoben | Register „Katastrophenschutz“ zeigt „Baden-Württemberg“, „Mecklenburg-Vorpommern“, „Nordrhein-Westfalen“, „Rheinland-Pfalz“ usw. einheitlich; „Noch ohne Beispielbögen: Bremen, Hamburg, Sachsen-Anhalt, Schleswig-Holstein“. |

## Befunde

### BB2-K1 [P1] Übungs-Sammlung aus einem OV mit zwei Technischen Zügen verliert still Einheiten: OV Landshut 11 Bögen → 9 Einheiten, 76 statt 89 Helfer; die Meldung sagt „mit 11 Beispielbögen“

- **Typ:** Statusklarheit/Datenverlust in der Lage.
- **Neu oder alt (Verweis):** neu; Folge des Sammelwegs aus BB-K1. Gleiche
  Ursache wie Runde 1 BB-W2 (gleichnamige Bögen werden eine Einheit), dort
  nur für „Einlagen Kräfte Hannover“ behoben.
- **Fundstelle:** Dialog „Beispielbögen“ › OV Landshut (Suche „Landshut“),
  „Alle 11 in eine Übungs-Sammlung“; danach die Übungs-Sammlung, Lageblatt.
  1280x900. Nachgestellt mit OV Augsburg.
- **Beobachtung:**
  - Der Dialog zeigt elf Zeilen, darunter „Zugtrupp Technischer Zug“ und
    „Bergungsgruppe“ je einmal mit „1. Technischer Zug“ und „2. Technischer
    Zug“; Summe der Zeilen 2/22/65//89.
  - Die Meldung lautet „Übungs-Sammlung ‚Übung: … › OV Landshut‘ mit 11
    Beispielbögen angelegt.“ Die Sammlung zeigt aber **9 Einheiten,
    1 / 19 / 56 // 76**, 22 Fahrzeuge, „9 gemeldet · 9 anwesend“.
  - Nr. 1 „THW Landshut Zugtrupp Technischer Zug“ und Nr. 2 „THW Landshut
    Bergungsgruppe“ tragen „neue Fassung“ und „Folgemeldung … 1 Fahrzeug dazu
    · 1 Fahrzeug abgemeldet · Unterbringung nein → ja …“, „Historie (2)“.
    Das Lageblatt schreibt unter „Veränderung seit der letzten Meldung“:
    „Ort / Auftrag von Übung: Hochwasserlage Ergolding — Führung Technischer Zug
    (1. Technischer Zug) auf Übung: Sturmtief »Quirin« Ergolding — Führung
    Technischer Zug (2. Technischer Zug)“. Zugtrupp und Bergungsgruppe des
    1. TZ sind also durch die des 2. TZ ersetzt. Es fehlen genau deren
    Stärken, 1/1/2//4 und 0/2/7//9, zusammen 1/3/9//13 (89 − 76 = 13).
  - OV Augsburg: „Alle 9 in eine Übungs-Sammlung“ → 7 Einheiten, 57 Helfer.
  - Im Bestand haben 45 der 667 OV-Ordner einen 2. Technischen Zug
    (Dateinamen `-2-tz-`); sie sind nach gleichem Muster betroffen.
  - Ordner ohne gleichnamige Einheiten (Forchheim, Hessen, Niedersachsen,
    Mecklenburg-Vorpommern, THW direkt) stimmen.
- **Erwartung der Rolle:** Elf Bögen rein, elf Einheiten in der Lage; wenn
  die App zwei Bögen für dieselbe Einheit hält, sagt sie das beim Anlegen.
- **Auswirkung im Einsatz:** Gerade der realistische Ansatz „OV mit zwei
  Zügen“ ergibt eine Übungslage, der ein Zugtrupp und eine Bergungsgruppe
  fehlen; die Erfolgsmeldung bestätigt die falsche Zahl („11 Bögen“). Am
  Meldekopf werden dann die Bögen der Teilnehmer gegen eine Soll-Lage
  abgeglichen, in der der 1. TZ ohne Führung dasteht, und die angezeigte
  „Folgemeldung“ suggeriert eine Lageänderung, die es nie gab. Das ist eine
  stille Fehlinformation in der Lage, die der Ausbilder ohne Nachrechnen nicht
  bemerkt.
- **Empfehlung:** Beim Sammelweg jeden Beispielbogen als eigene Einheit
  aufnehmen; gleichnamige Einheiten im Namen unterscheiden (Zug anhängen,
  wie beim 2. Einsatzzug Hannover) oder den Zug setzen (siehe BB-K7). Wenn die
  App doch zusammenführt, nennt die Meldung die Zahl der Einheiten und warum
  („11 Bögen, 9 Einheiten: 2 als neue Fassung erkannt“).
- **Verifikation:** OV Landshut und OV Augsburg mit „Alle … in eine
  Übungs-Sammlung“: 11 bzw. 9 Einheiten, Lage 2/22/65//89 bei Landshut, keine
  Karte mit „neue Fassung“; Stichprobe über weitere OV-Ordner mit `-2-tz-`.

### BB2-K2 [P2] Suche findet keine Einheitstypen in Klartext: „Bergungsgruppe“ 0 Treffer, „Zugtrupp“ 18 von über 800, obwohl das Feld „Ort, OV oder Einheit“ verspricht

- **Typ:** Navigation/Erwartung.
- **Neu oder alt (Verweis):** neu; Teil der Nachprüfung von BB-K4.
- **Fundstelle:** Dialog „Beispielbögen“, Feld „Suchen“ (Platzhalter „Ort, OV
  oder Einheit, z. B. Oldenburg“). Alle Ansichten.
- **Beobachtung:**
  - „Bergungsgruppe“: „0 Ordner und 0 Bögen gefunden“; im Bestand liegen 870
    Bögen von Bergungsgruppen der Ortsverbände (Dateinamen `-b.json`) und
    mehrere in der THW-Liste.
  - „Fachgruppe Wassergefahren“: 0 Treffer. „Wassergefahren“: 3 Treffer, alle
    DLRG; keine der 118 THW-Fachgruppen W.
  - „Zugtrupp“: 18 Treffer (Praktische Ausbildung, Katastrophenschutz); die
    über 800 Zugtrupps der Ortsverbände (`-ztr-`) fehlen. „Bayern Zugtrupp“:
    0 Treffer.
  - Mit dem Dateikürzel „FGr W“ oder „fgr-w“: 60 Treffer und „Nicht alle
    Treffer gezeigt“.
  - Ursache sichtbar im Verhalten und bestätigt im Code: gesucht wird nur in
    Ordnernamen und Dateinamen (`suchTreffer` in `src/app/beispiele-dialog.tsx`),
    nicht in der angezeigten Einheitsbezeichnung.
  - Treffer aus der Suche haben keinen Sammelweg; „Alle … in eine
    Übungs-Sammlung“ erscheint erst nach dem Wechsel in den Ordner.
- **Erwartung der Rolle:** „Bergungsgruppe“ oder „Fachgruppe W“ eintippen und
  sehen, welche es gibt und woher; den Kräfteansatz damit ergänzen.
- **Auswirkung im Einsatz:** Wer einen Ansatz um einen bestimmten
  Einheitstyp ergänzen will, bekommt „0 Bögen gefunden“ und schließt daraus,
  dass es keinen gibt. Nur wer die internen Dateikürzel kennt, findet die
  Einheiten. Für Orte und OV funktioniert die Suche dagegen gut.
- **Empfehlung:** Auch in den angezeigten Bezeichnungen (Einheitstyp,
  Kurzform, Ort, Zug) suchen, gängige Kürzel wie „FGr W“, „B“, „ZTr“ als
  Synonyme zulassen; bis dahin den Platzhalter auf das beschränken, was
  geht. Aus der Trefferliste heraus einen Sammelweg anbieten (siehe BB-K1).
- **Verifikation:** „Bergungsgruppe“, „Fachgruppe Wassergefahren“ und
  „Zugtrupp“ liefern Treffer aus den Ortsverbänden mit Ort; „Bayern Zugtrupp“
  liefert Zugtrupps aus Bayern.

### BB2-K3 [P3] Name der Übungs-Sammlung ist der ganze Ordnerpfad (128 Zeichen); Lageblatt-Kopf zweizeilig, Dateinamen über 150 Zeichen, Sammlungen auf der Startseite erst am Ende unterscheidbar

- **Typ:** Erkennbarkeit.
- **Neu oder alt (Verweis):** neu (Folge des Sammelwegs).
- **Fundstelle:** Übungs-Sammlung nach „Alle … in eine Übungs-Sammlung“;
  Startseite „Einsatz-Sammlung (Meldekopf)“; Lageblatt, Sammel-PDF.
  1280x900.
- **Beobachtung:** Die Sammlung heißt „Übung: THW › Alle Einheiten aller
  Ortsverbände (nach Landesverband, Regionalstelle, OV) › Bayern › RSt Bamberg
  › OV Forchheim“. Auf der Startseite stehen zwei Sammlungen untereinander,
  die sich erst nach rund 100 Zeichen unterscheiden („… RSt Mühldorf › OV
  Landshut“ / „… RSt Bamberg › OV Schweinfurt“). Der Lageblatt-Kopf bricht um
  („Lageblatt: Übung: THW › … › RSt Mühldorf“ / „› OV Landshut Erstellt …“),
  der Dateiname lautet
  `2026-11-09_0845_eeb-lageblatt_Uebung_THW_Alle_Einheiten_aller_Ortsverbaende_nach_Landesverband_Regionalstelle_OV_Bayern_RSt_Muehldorf_OV_Landshut.pdf`.
  Hessen dagegen kurz: „Übung: Katastrophenschutz › Hessen“.
- **Erwartung der Rolle:** Ein kurzer, sprechender Name („Übung OV Landshut“)
  mit dem, was die Übung unterscheidet.
- **Auswirkung im Einsatz:** Auf Lageblatt, Lagemonitor und in der
  Dateiablage steht das Wesentliche (welcher OV) am Ende oder in der zweiten
  Zeile; bei mehreren vorbereiteten Übungen wählt man leicht die falsche. Der
  Name ist änderbar, kostet aber jedes Mal einen Schritt.
- **Empfehlung:** Den Namen aus der letzten oder den letzten zwei Ebenen
  bilden („Übung: OV Landshut (RSt Mühldorf)“), Sammelordner wie „Alle
  Einheiten aller Ortsverbände …“ weglassen.
- **Verifikation:** Sammlung aus OV Landshut heißt höchstens rund 40 Zeichen
  und enthält „OV Landshut“ vorn; Lageblatt-Kopf einzeilig.

### BB2-K4 [P3] In der Übungs-Sammlung sind alle Beispiel-Einheiten sofort „eingetroffen“ und „am Meldekopf von Hand erfasst“

- **Typ:** Herkunft/Nachvollziehbarkeit.
- **Neu oder alt (Verweis):** neu (Folge des Sammelwegs).
- **Fundstelle:** Übungs-Sammlung OV Forchheim, Einheitenkarten, Lageblatt,
  Übergabe-Übersicht im Sammel-PDF. 1280x900.
- **Beobachtung:** Jede Karte: „kürzlich eingetroffen“, „eingetroffen
  09.11.2026, 08:44 … · am Meldekopf von Hand erfasst“; Kopf „10 gemeldet ·
  10 anwesend“; im Sammel-PDF „Eingetroffen 09.11.2026, 08:54“ für alle zehn
  in derselben Minute. Dass die Einheiten aus den Beispielbögen übernommen
  wurden, steht nirgends an der Einheit (nur „ÜBUNG“).
- **Erwartung der Rolle (Annahme zum Übungsablauf):** Eine vorbereitete
  Übungslage zeigt die Einheiten als „erwartet“ oder ohne Eintreffzeit, und
  die Herkunft sagt „aus Beispielbögen übernommen“.
- **Auswirkung im Einsatz:** Wer die Sammlung als Soll-Lage weitergibt oder
  übernimmt, liest „10 anwesend, von Hand am Meldekopf erfasst“ und hält das
  für tatsächliches Geschehen; die Eintreffzeiten ergeben keine sinnvolle
  Zeitleiste für die Nachbesprechung. Beides lässt sich je Einheit ändern
  („ändern“), bei zehn Einheiten aber zehnmal.
- **Empfehlung:** Herkunft der Meldung „aus Beispielbögen“ angeben; beim
  Anlegen wählen lassen: „als eingetroffen“ oder „noch nicht eingetroffen“
  (Soll-Lage), oder die Eintreffzeit offen lassen.
- **Verifikation:** Übungs-Sammlung aus OV Forchheim: Karten nennen
  „aus Beispielbogen“ statt „am Meldekopf von Hand erfasst“; mit Wahl „noch
  nicht eingetroffen“ zeigt der Kopf 0 anwesend.

## Hinweise (ohne Priorität)

Abwägungsfragen oder Beobachtungen ohne erkennbare Beeinträchtigung der
Aufgabe; nicht in der Zählung.

- **H1 (Tablet):** Bei 820x1180 ist der Dialog weiter 656 px breit (rund 80 px
  ungenutzt je Seite), jede Karte 215 bis 227 px hoch; im ersten Bild sind
  zweieinhalb Einheiten zu sehen, die 101er-Liste wird lang. Zum Vergleichen
  wären zwei Karten nebeneinander oder kompaktere Karten bei dieser Breite
  hilfreich.
- **H2 (Daten):** Innerhalb von OV Landshut tragen die Bögen unterschiedliche
  Übungslagen („Hochwasserlage Ergolding“ beim 1. TZ, „Sturmtief »Quirin«
  Ergolding“ beim 2. TZ). In der Sammlung steht damit je Einheit ein anderer
  Ort/Auftrag (bekannt aus Runde 1, Sachverhalt 16).
- **H3 (Daten):** Hinweise aus den Daten selbst („Sitzplätze fehlen: 9“,
  „alle als ‚männlich‘ (Vorbelegung)“, „Kennzeichen doppelt“) stehen in fast
  jeder Karte und im Sammel-PDF; der Ausbilder muss sie vor der Übung
  erklären oder als Übungseinlage nutzen.
- **H4 (Reihenfolge):** In OV Forchheim steht die „Fachgruppe
  Logistik-Verpflegung“ (Fachzug Logistik) weiterhin vor dem Zugtrupp des
  1. TZ, in Dialog und Sammlung (Nr. 1). Eine Gruppierung je Zug fehlt.
- **H5 (Sollstärke):** Die Hessen-Bögen nennen unter „Sonstiges“ die
  Sollstärke des Zuges („Teileinheit von Löschzug (LZ) — 1/4/20/25“). Diese
  Angabe wäre im Dialog als Vergleich zur Summe (BB-K3) nützlich, steht aber
  nur im geöffneten Bogen.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Ein OV mit einem Zug geht in einem
  Klick und stimmt; ein OV mit zwei Zügen ergibt eine falsche Lage, ein
  KatS-Zug eines Landes geht nur als ganzes Land oder Bogen für Bogen.
- **Fremde Hilfe nötig:** nein für den einfachen Fall; für das Erkennen des
  Fehlers bei zwei Zügen wäre Nachrechnen nötig, das die App nicht anbietet.
- **Größtes Missverständnis:** „mit 11 Beispielbögen angelegt“ lässt glauben,
  die Lage enthalte elf Einheiten, tatsächlich sind es neun.
- **Größtes Einsatzrisiko:** Eine Übungs-Soll-Lage, der still ein Zugtrupp und
  eine Bergungsgruppe fehlen und die eine nie gemeldete „Folgemeldung“ zeigt.
- **Top-Priorität für die nächste Iteration:** Sammelweg nimmt jeden Bogen als
  eigene Einheit auf und setzt den Zug (BB2-K1 mit BB-K7), danach Summe je
  Zug im Dialog (BB-K3).
