# Audit „Neuer Nutzer", Runde 3 (THW-Helfer ohne Einweisung)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-new-user-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, ohne Kamera.
Jeder Lauf hatte einen eigenen Browser-Kontext. Ein Teil der Läufe begann mit
leerem Speicher, alle Zustände entstanden dort durch Bedienung. Die übrigen
Läufe begannen mit `localStorage`-Seeds aus `examples/thw/` mit
`uebung: false`: ein Entwurf (`eeb.entwurf.v1`, THW Albstadt Zugtrupp, auf
Schritt 3), eine Vorlage (`eeb.vorlagen.v1`, „OV Biberach B", FGr O mit
11 Personen und 3 Fahrzeugen) und die Einsatz-Sammlung „Hochwasser Neckar“
mit acht Einheiten (`eeb.einsaetze.v1`). Getestet habe ich zuerst ohne Blick
in Anleitung, Dokumentation oder frühere Berichte. Den Runde-2-Bericht, die
Tabelle „Stand der Behebung“ und die schon fertigen Runde-3-Berichte habe ich
erst danach gelesen.

Rolle: Helfer eines THW-Ortsverbands, kennt den Papier-Erfassungsbogen, hat
die App nie gesehen. Szenarien:

1. **Eigenen Bogen melden:** „Neuen Bogen erstellen“ → Einheitstyp „Berg“ →
   Bergungsgruppe → OV „Ulm“ aus den Vorschlägen → Ort/Auftrag → „Namen
   einfügen…“ mit drei Namen → Fahrzeuge → Sofortbedarf → Übersicht →
   „Bogen übergeben…“ (QR-Vollbild, weitere Formate) → „Neuer Bogen“.
2. **Wieder einsteigen:** Startseite mit Entwurf → „Fortsetzen“, „Neuen Bogen
   erstellen“, Vorlage „Bearbeiten“ und „Einsatz vorbereiten“.
3. **Am Meldekopf aushelfen:** Sammlung „Öffnen“ → Karte aufklappen →
   „Abrücken“, „Mehr…“, „Details“; „Einheit manuell erfassen…“ → Name
   „Rottweil“ → „In Einsatz übernehmen“; „Bogen scannen…“, „Bögen
   einlesen…“.
4. **Schnellerfassung von der Startseite:** ohne Sammlung und mit Sammlung,
   bei angefangenem eigenem Bogen dreimal hintereinander, die dritte
   abgebrochen.

**Nicht prüfbar:** Kamera-Scan mit echtem Bild, USB-Handscanner, native
Datums- und Auswahllisten, Bildschirmtastatur, native Builds. Die
Datumsfelder rendert headless Chromium im US-Format („10/04/2026“). Das werte
ich nicht. Die PDF-Vorschau und den PDF-Inhalt habe ich nicht geprüft, und
„StAN-Sollplätze laden“ über eingetragene Namen habe ich nicht nachgestellt.

## Urteil

Der eigene Bogen gelingt ohne Hilfe, und das schneller als in Runde 2. Die
Startseite trennt „Meinen Bogen ausfüllen“ von „Bögen sammeln (Meldekopf)“.
Einheitstyp und OV-Vorschlag füllen Schritt 1 fast allein. „Namen einfügen…“
setzt die Namen jetzt in die Sollplätze (GrFü, TrFü) und bietet
„Rückgängig“. Die Karte nennt die Sollstelle im Kopf. Übergabe-Dialog und
QR-Vollbild mit Einheitsname und Stärke erklären sich selbst. Der schwerste
Runde-2-Befund ist weg: Drei Schnellerfassungen hintereinander, eine davon
abgebrochen, lassen den eigenen Bogen auf dem Rückholplatz stehen.

Reibung entsteht jetzt an zwei Stellen, an denen die App mehr hinnimmt, als
ein Neuling ahnt. Am Meldekopf steht „In Einsatz übernehmen“ schon auf
Schritt 1. Ein Tipp nach dem Namen legt eine Einheit mit Stärke 0 / 0 / 0 / 0
in die Sammlung, ohne Rückfrage. Die Quittung steht knapp unter dem Bildrand.
In Schritt 4 löscht der oberste Knopf „Vorbelegung entfernen“ auch
eingetragenes Sondergerät und Funkrufnamen, ohne Rückfrage und ohne
„Rückgängig“. Dazu kommen Abkürzungen, die doppelt belegt sind („M“ für
Mannschaft und für männlich), und Erklärungen, die nur als Tooltip
existieren und auf dem Telefon nie erscheinen.

Aufgabe 1 gelingt ohne fremde Hilfe, Aufgabe 2 auch. Bei Aufgabe 3 gelingt
die Aufnahme, kann aber ohne Warnung eine leere Einheit erzeugen. Aufgabe 4
gelingt ohne Datenverlust.

## Befunde

### R3-N1 [P1] Meldekopf: „In Einsatz übernehmen“ legt eine Einheit mit Stärke 0 ohne Rückfrage ab, die Quittung steht unter dem Bildrand (neu)

**Priorität:** P1

**Kennzeichnung:** beobachtet; Lage der Quittung gemessen.

**Fundstelle / Aufgabe:** Einsatz „Hochwasser Neckar“ (8 Einheiten) →
„Einheit manuell erfassen…“ → Name „Rottweil“ aus den Vorschlägen →
„In Einsatz übernehmen“ in der unteren Leiste von Schritt 1. Code:
`src/app/app.tsx`, `erfassungUebernehmen()` (ab Z. 1861), Knöpfe Z. 2883 und
2934.

**Beobachtung:** Die untere Leiste zeigt auf jedem Schritt „← Zurück · In
Einsatz übernehmen · Weiter →“. Nach dem Namen habe ich „In Einsatz
übernehmen“ getippt. Es kam keine Rückfrage. Die Sammlung zeigt danach oben
„9 Einheiten“ und „69 Gesamt“, wie vorher, und in der Liste „Nr. 9 THW
Rottweil · Stärke 0 / 0 / 0 / 0“. Die Quittung „Zuletzt eingelesen: ‚THW
Rottweil‘ · jetzt 9 Einheiten, Gesamt 69“ beginnt bei 635 px, also unter dem
Bildrand von 640 px. Im ersten Bild sieht der Helfer nur den Kopf der
Sammlung. Wer vorher Stärke eingeben will, findet in Schritt 3 keine
+/−-Zähler. Bei der ersten Handerfassung steht der Modus auf „Personal
vollständig erfassen“, und ohne Einheitstyp gibt es keine Sollplätze. Die
Zähler erscheinen erst nach dem Wechsel auf „Nur Stärke“. In
`erfassungUebernehmen()` prüft nur `sollstaerkeFreigeben()`, eine Prüfung auf
Stärke 0 gibt es nicht.

**Erwartung der Rolle:** Der Knopf ist für „fertig“ da. Wenn noch etwas
Wichtiges fehlt, und die Stärke ist am Meldekopf das Wichtigste, sagt mir das
die App, bevor die Einheit in der Liste steht.

**Auswirkung im Einsatz:** Die Einheit gilt als angekommen, ihre Leute fehlen
aber in Stärke, Verpflegung und Unterbringung. Der Aushelfer hält die Aufnahme
für erledigt und nimmt die nächste Einheit an. Auffallen kann der Fehler nur
in der Liste ganz unten (rund 1 900 px tief), wo „0 / 0 / 0 / 0“ zwischen
lauter echten Zahlen steht.

**Empfehlung:** Ist die Stärke 0, vor dem Ablegen fragen („THW Rottweil hat
noch keine Stärke — trotzdem übernehmen? / Stärke eintragen“). Mit „Stärke
eintragen“ direkt auf Schritt 3 im Modus „Nur Stärke“ springen. Die Quittung
nach der Übernahme im ersten Bild zeigen, wie es R3-L1 für „Bögen einlesen…“
fordert. In der Liste eine Einheit ohne Stärke kennzeichnen („Stärke fehlt“).

**Nachprüfung:** In der Sammlung „Einheit manuell erfassen…“, nur den Namen
eintragen, „In Einsatz übernehmen“ tippen. Die App muss nachfragen. Nach
einer Übernahme mit Stärke muss die Quittung ohne Scrollen sichtbar sein.

### R3-N2 [P2] Schritt 4: „Vorbelegung entfernen“ löscht auch eingetragenes Sondergerät und Funkrufnamen, ohne Rückfrage und ohne „Rückgängig“ (neu)

**Priorität:** P2

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Bergungsgruppe Ulm, Schritt 4 „Fahrzeuge“ mit den
2 StAN-Fahrzeugen (GKW, Anh Plane/Spriegel). Code:
`src/app/schritte/fahrzeuge.tsx` Z. 247–253, Maßstab `fahrzeugUnbenannt()` in
`src/app/hilfen.ts` Z. 1165 (nur „Kennzeichen leer“).

**Beobachtung:** Der erste und größte Knopf in Schritt 4 heißt „Vorbelegung
entfernen (2 Fahrzeuge ohne Kennzeichen)“. Darunter steht ausgegraut
„StAN-Vorbelegung laden“. Ich habe beim GKW unter „Änderungen bzw.
Sondergerät“ „Lichtmast 2 kW, Tauchpumpe TP 4“ eingetragen. Der Funkrufname
„Heros Ulm 22/51“ war schon da. Dann habe ich den Knopf getippt. Ohne
Rückfrage sind beide Fahrzeuge weg, samt Sondergerät und Funkrufname. Ein
„Rückgängig“ erscheint nicht. „StAN-Vorbelegung laden“ holt die Fahrzeuge
zurück, das Sondergerät aber nicht.

**Erwartung der Rolle:** „Vorbelegung“ ist das, was die App vorgeschlagen
hat. Was ich selbst eingetippt habe, gehört nicht dazu. Die Kennzeichen kenne
ich am Telefon oft noch nicht. Den Knopf lese ich als „Vorschläge
ausblenden“ oder „gelbe Hinweise weg“.

**Auswirkung im Einsatz:** Sondergerät und Funkrufnamen gehen verloren und
müssen neu erfasst werden, oder sie fehlen auf dem übergebenen Bogen. Gerade
das Sondergerät braucht der Meldekopf für die Auftragsvergabe.

**Empfehlung:** Nur Fahrzeuge entfernen, an denen außer der Vorbelegung nichts
geändert wurde, oder vorher nennen, was verloren geht („GKW: Sondergerät
‚Lichtmast…‘ geht verloren“). Danach eine Quittung mit „Rückgängig“ zeigen,
wie bei „Namen einfügen…“. Den Knopf unter die Fahrzeugliste legen, wie in
Schritt 3 nach R2-N8.

**Nachprüfung:** Beim GKW ein Sondergerät eintragen, „Vorbelegung entfernen“
tippen. Der GKW muss bleiben, oder die Rückfrage muss das Sondergerät nennen.
„Rückgängig“ muss den alten Zustand zurückbringen.

### R3-N3 [P2] „M“ heißt in derselben Zeile Mannschaft und männlich; „Unterbringung: M 9“ steht da, obwohl keine Unterbringung angefordert ist (neu; Rest von F8)

**Priorität:** P2

**Kennzeichnung:** beobachtet; Legende nur als `title` gemessen.

**Fundstelle / Aufgabe:** Übersicht des eigenen Bogens, Schritt 3, Kasten
„Bedarf (anwesende Einheiten)“ der Sammlung. Code:
`src/app/schritte/bausteine.tsx` Z. 510 (`MWD_LEGENDE`, nur als Tooltip),
`src/app/schritte/personal.tsx` Z. 948, `src/app/einsaetze-ui.tsx` Z. 1044 und
1689.

**Beobachtung:** In der Übersicht steht direkt unter „Stärke 0 / 2 / 7 / 9
(F / UF / M / Ges)“ die Zeile „Unterbringung: M 9 / W 0 / D 0“. Weiter unten,
unter „Sofortbedarf & Sonstiges“, steht „Unterbringung / Ruhezeit: keine
Unterbringung“. In der Sammlung zeigt der Kopf „49 MANNSCH.“, der
Bedarfskasten darunter „Unterbringung M 56 / W 13 / D 0“. Dass M/W/D
männlich/weiblich/divers bedeutet, steht nur im Tooltip
(„Unterbringungsplätze: männlich / weiblich / divers“). Auf dem Telefon
erscheint der nie.

**Erwartung der Rolle:** „M“ ist Mannschaft, das hat mir die Zeile darüber
gerade erklärt. „Unterbringung: M 9“ lese ich als „9 Mann brauchen ein
Quartier“.

**Auswirkung im Einsatz:** Der Helfer glaubt, er habe Unterbringung
angefordert, oder er sucht den Fehler, weil die Zahl nicht zur Mannschaft
passt (Sammlung: 56 gegen 49). Am Meldekopf wird „M 56“ als Mannschaftszahl
weitergegeben. Ob jemand am Meldekopf so liest, ist eine Annahme, liegt aber
nahe, weil die Kopfzahl daneben dieselbe Abkürzung nutzt.

**Empfehlung:** Ausschreiben („Geschlecht: 9 männlich · 0 weiblich ·
0 divers“) oder „m/w/d“ klein und mit sichtbarer Legende
schreiben. In der Übersicht die Zeile nur zeigen, wenn Unterbringung
angefordert ist, sonst als „Geschlechterverteilung“ benennen.

**Nachprüfung:** Einem ungeschulten Helfer die Übersicht zeigen und fragen,
ob seine Einheit Unterbringung braucht und was „M 9“ bedeutet.

### R3-N4 [P3] Schrittleiste: „offen“ und „✓“ passen nicht zu dem, was der Schritt verlangt (Rest von R2-N3)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Aufgabe:** Schrittleiste im Assistenten. Code:
`src/app/hilfen.ts`, `schrittStatus()` ab Z. 993.

**Beobachtung:**
- Schnellerfassung von der Startseite ohne Sammlung, Name „Biberach“
  eingetragen: Der Hinweis sagt „Es reichen der Name der Einheit hier und
  die Stärke in Schritt 3“. Die Leiste zeigt trotzdem „1 offen“, bis zum
  Schluss in der Übersicht. Grund: „ok“ verlangt auch den Einheitstyp.
- Eigener Bogen, 3 Namen in 9 Sollplätzen: Die Leiste zeigt „3 ✓“, die
  Übersicht zugleich „6 Personenkarten ohne Angaben zählen in die Stärke“.
- Was „offen“ heißt (fehlt etwas Pflicht? noch nicht besucht?), sagt nur das
  unsichtbare Label („begonnen“, „noch leer“).

**Erwartung der Rolle:** „offen“ heißt: Hier fehlt noch etwas, das ich
nachtragen muss. „✓“ heißt: fertig.

**Auswirkung im Einsatz:** Der Aushelfer am Meldekopf sucht in Schritt 1
nach einem Fehler, den es nicht gibt. Beim eigenen Bogen kann der Haken zum
Überspringen von Schritt 3 verleiten. Die Übersicht fängt das ab, deshalb
nur P3.

**Empfehlung:** In der Schnellerfassung nur Name und Stärke werten. „✓“ erst
setzen, wenn der Schritt keine eigenen Prüfpunkte mehr hat. Sonst „offen“
behalten.

**Nachprüfung:** Schnellerfassung nur mit Name: kein „offen“ an Schritt 1.
3 von 9 Namen: kein Haken an Schritt 3.

### R3-N5 [P3] Erklärungen nur im Tooltip, „Bogen scannen…“ und „Bögen einlesen…“ ohne sichtbaren Unterschied (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet; `title`-Attribute im Code gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht und Schritt 3. Code:
`src/app/einsaetze-ui.tsx` Z. 536 (`title` an „Bögen einlesen…“),
`src/app/schritte/personal.tsx` Z. 385 (Marke „Erreichbar für Rückfragen“),
dazu `MWD_LEGENDE` aus R3-N3.

**Beobachtung:**
- In der Sammlung stehen untereinander „Bogen scannen…“ und „Bögen
  einlesen…“. Was „einlesen“ heißt (JSON, PDF, Fotos von QR-Codes, viele auf
  einmal), steht nur im Tooltip. Der Tipp öffnet sofort die Dateiauswahl,
  ohne Erklärung.
- In der ersten Personenkarte steht ein kleines graues Kästchen „Erreichbar
  für Rückfragen“. Es sieht aus wie ein Knopf oder Schalter, ist aber eine
  Marke. Dass sie an der *ersten* Person hängt und mit ▲/▼ wandert, erklärt
  nur der Tooltip.

**Erwartung der Rolle:** „Scannen“ und „einlesen“ sind für mich dasselbe.
Das Kästchen tippe ich an, um „erreichbar“ ein- oder auszuschalten.

**Auswirkung im Einsatz:** Kurzes Zögern. Der Aushelfer wählt den falschen
Weg und landet im Dateidialog. Der Ansprechpartner steht im PDF als die
Person, die zufällig oben steht.

**Empfehlung:** Unter „Bögen einlesen…“ einen sichtbaren Halbsatz („Dateien
oder Fotos von QR-Codes“). Bei der Marke ein Wort zur Regel („erste Person =
Ansprechpartner, mit ▲/▼ ändern“). Tooltips auf dem Telefon nicht als
einzige Erklärung nutzen.

**Nachprüfung:** Einem ungeschulten Helfer die Sammlung zeigen und fragen,
womit er eine PDF-Datei aufnimmt. Er muss es ohne Antippen sagen können.

### R3-N6 [P3] Kleinere Stolpersteine (neu)

**Priorität:** P3

**Kennzeichnung:** beobachtet.

**Fundstelle / Beobachtung:**
- Schritt 4, Funkrufname: Die Beschriftung des Kästchens bricht als
  „eigener / Standor / t“ um, weil die Erklärung „— Ort im Funkrufnamen =
  Standort der Einheit (Ulm)“ in einer schmalen Spalte daneben steht
  (`src/app/schritte/fahrzeuge.tsx` Z. 179–182).
- Kopf der Sammlung: „‹ Einsätze“ führt zur Startseite. Dort stehen die
  Einsätze zwar, aber erst unter Entwurf, Helfer-Block, Meldekopf-Block und
  Vorlagen. Der Assistent nennt denselben Weg „‹ Startseite“.
- Übersicht: Der Knopf „Neuer Bogen“ schließt den Bogen nur. Bereits in
  R3-H7 beschrieben, ebenso der Einheitstyp-Platzhalter „z. B. Löschzug, SEG
  Sanität“ bei THW.
- Einstieg mitten im Formular nach gescrollter Startseite (bei mir:
  „Fortsetzen“ landet in Schritt 3 unter der Überschrift): bereits in R3-H1
  beschrieben.

**Erwartung der Rolle:** Beschriftungen lesbar, Rückwege heißen überall
gleich.

**Auswirkung im Einsatz:** Kurzes Stutzen.

**Empfehlung:** Erklärung zum Standort unter das Kästchen setzen. Den Rückweg
überall „‹ Startseite“ nennen.

**Nachprüfung:** Schritt 4 bei 360 px ansehen; Rückweg aus der Sammlung
lesen.

## Bestätigtes

- Startseite: Zweck, Offline-Hinweis und die zwei Rollen sind im ersten Bild.
  „So funktioniert's“ erklärt den Ablauf in drei Bildern.
- Schritt 1: Einheitstyp mit Kurz- und Langnamen („Berg“ → B, B (ASH),
  FGr BT …), der OV-Vorschlag „Ulm“ füllt Kürzel OULM, Telefon, Mail, RB und
  LV. Die Bezeichnung „THW Ulm Bergungsgruppe“ entsteht sichtbar mit.
- Schritt 2 erklärt die Vorbelegung von „Zeitraum bis“ und was
  „Einsatzbeginn eintragen“ tut.
- Schritt 3: „Namen einfügen…“ setzt drei Namen in die Sollplätze GrFü, TrFü
  und Ma. Die Quittung „3 Namen übernommen — 3 davon in freie Sollplätze“
  kommt mit „Rückgängig“. Die Stärke bleibt 0 / 2 / 7 / 9. Der Kartenkopf
  nennt „Person 1 von 9 · GrFü“, die Tabelle hat „Stelle“ als erste Spalte.
- Übersicht und Übergabe: Offene Punkte stehen antippbar in der Übersicht.
  Dazu kommt „Übergeben ist trotzdem möglich“. Das QR-Vollbild nennt Einheit,
  Stärke mit Legende und Stand. „Link teilen“ erklärt, wann der Link ohne Netz
  nicht geht.
- Rückfragen vor jedem Verdrängen nennen den Bogen und wo er bleibt („Zuletzt
  verdrängten Bogen zurückholen“). Das gilt für „Neuen Bogen erstellen“,
  Vorlage „Bearbeiten“, „Einheit manuell erfassen…“ und Schnellerfassung.
- Schnellerfassung von der Startseite fragt zuerst „für welche Sammlung?“.
  Danach zeigt sie „‹ Einsatz ‚Hochwasser Neckar‘“, „Aufnahme für:
  Hochwasser Neckar“ und „In Einsatz übernehmen“. „Weiter →“ führt direkt zu
  den Stärke-Zählern.
- Sammlungskarte: Stand lesbar („04.10.2026, 19:24“), keine falsche Marke
  „alt“. „Abrücken“ quittiert mit Uhrzeit und „Rückgängig“. „Wieder anwesend“
  ist eine Sekunde lang gesperrt, gegen Doppeltippen.
- Scanner ohne Kamera: klare Meldung, Handscanner-Anleitung, „Kamera erneut
  versuchen“, „QR aus Bild einlesen…“ und „Fertig“ im Bild.

## Abschluss

- **Aufgabe geschafft:** eigener Bogen ja; Wiedereinstieg ja; Meldekopf ja,
  mit dem Risiko einer leeren Einheit (R3-N1); Schnellerfassung neben eigenem
  Bogen ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Vorbelegung entfernen“ nimmt auch das mit,
  was ich selbst eingetragen habe (R3-N2).
- **Größtes Einsatzrisiko:** Eine Einheit landet mit Stärke 0 in der Sammlung,
  ohne Rückfrage und mit einer Quittung außerhalb des Bildes (R3-N1).
- **Top-Priorität für die nächste Iteration:** Vor „In Einsatz übernehmen“
  bei fehlender Stärke nachfragen und direkt zur Stärkeeingabe führen
  (R3-N1).

## Abgleich mit Runde 2

Grundlage: [../runde-2/neuer-nutzer.md](../runde-2/neuer-nutzer.md) und
[../runde-2/README.md → Stand der Behebung](../runde-2/README.md).

| Runde-2-Befund | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- |
| R2-N1 Schnellerfassung verdrängt eigenen Bogen (P0) | hält | Mit Entwurf „THW Albstadt Zugtrupp“ dreimal von der Startseite schnell erfasst, zweimal abgelegt, einmal abgebrochen. Danach steht Albstadt auf der Startseite als „Zuletzt verdrängter Bogen“, die abgebrochene Erfassung getrennt als „Angefangene Erfassung für ‚Hochwasser Neckar‘“. Nach dem Ablegen ist die Schnellerfassung geschlossen. |
| R2-N2 Namen einfügen / Sollplätze laden (P1) | hält (Namen einfügen); Sollplätze laden nicht nachgeprüft | Drei Namen landen auf GrFü, TrFü, Ma, Quittung mit „Rückgängig“, Stärke bleibt 0 / 2 / 7 / 9. Gleiches Muster fehlt in Schritt 4 (R3-N2). |
| R2-N3 Haken bei Sollplätzen (P2) | teilweise | Vor dem Besuch zeigen Schritt 3 und 4 „offen“ statt Haken, „•“ ist durch das Wort ersetzt. Mit 3 von 9 Namen steht aber wieder „3 ✓“, und die Schnellerfassung zeigt „1 offen“ trotz vollständigem Namen (R3-N4). |
| R2-N4 Marke „alt“ (P2) | hält | Keine Marke „alt“ an frischen Karten, Stand als „04.10.2026, 19:24“. |
| R2-N5 Verpflegung 0 (P2) | hält | Bedarfskasten „Verpflegung 69“ bei 69 Gesamt, auch nach dem Abrücken stimmig (65). |
| R2-N6 Schnellerfassung wie eigener Bogen (P2) | hält | Sammlungswahl zuerst, Marke „Aufnahme für: …“, „‹ Einsatz …“, „In Einsatz übernehmen“, „Weiter →“ direkt zur Stärke. Ohne Sammlung bleibt es beim Bogen mit „‹ Startseite“, das ist folgerichtig. |
| R2-N7 Rückwege (P2) | weitgehend | „Fortsetzen“ öffnet den zuletzt offenen Schritt (Schritt 3). Der Knopf heißt „In Einsatz-Sammlung ablegen…“. „‹ Einsätze“ führt zur Startseite, der Name bleibt (R3-N6). |
| R2-N8 Erstes Namensfeld tief (P2) | teilweise | Sollstelle im Kartenkopf und als erste Tabellenspalte, Vorbelegungs-Knöpfe unter der Liste. Das erste Vornamenfeld liegt aber weiter bei 914 px (Seite 10 030 px), darüber stehen drei gelbe Hinweise und zwei Auswahlgruppen. Siehe auch R3-H6. |
| R2-N9 Begriffe und Platzhalter (P3) | weitgehend | Organisationsname „z. B. THW Ortsverband Ulm“, „eigener Standort“ erklärt (aber umbrochen, R3-N6), Stärke überall mit „(F / UF / M / Ges)“, Einheitsname im QR-Vollbild. Offen: Einheitstyp-Platzhalter (R3-H7), Themenschalter „Feld“. |

Einordnung der eigenen Befunde: R3-N1, R3-N2, R3-N5 und R3-N6 sind neu.
R3-N3 ist neu und greift den in Runde 1 zurückgestellten Rest von F8 („M“)
von der Seite der Lesbarkeit auf. R3-N4 ist der Rest von R2-N3. Auf
bestehende Runde-3-Befunde verweise ich nur: R3-H1 (Einstieg mitten im
Formular), R3-H7 („Neuer Bogen“, Einheitstyp-Platzhalter), R3-L1
(Rückmeldung außerhalb des Bildes, dieselbe Ursache wie die Quittung in
R3-N1).

Bilanz: Von neun Runde-2-Befunden halten fünf (R2-N1, R2-N2 für „Namen
einfügen“, R2-N4, R2-N5, R2-N6). Zwei sind weitgehend umgesetzt (R2-N7,
R2-N9), zwei teilweise (R2-N3, R2-N8). Der P0 aus Runde 2 ist behoben. Der
schwerste neue Befund (R3-N1) liegt auf dem Meldekopf-Weg, den die
R2-N6-Behebung erst bequem gemacht hat.
