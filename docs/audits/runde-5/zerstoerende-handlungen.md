# Audit „Zerstörende Handlungen", Runde 5 (Löschen, Überschreiben, Statuswechsel)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (der Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde (siehe [../runde-4/zerstoerende-handlungen.md](../runde-4/zerstoerende-handlungen.md)).

## Prüfaufbau

Wie in Runde 4 (siehe [../runde-4/README.md → Prüfaufbau](../runde-4/README.md#prüfaufbau)):
Chromium aus Playwright (`node_modules`, `/opt/pw-browsers/chromium`),
Viewport 360 × 640 px, `isMobile`/`hasTouch`, Locale de-DE, Tipps als
Touch-Tipp. Jeder Lauf in einem eigenen Browser-Kontext. Der Zustand kommt aus
`localStorage`-Seeds, die nach dem ersten Laden gesetzt werden (danach
Neuladen), damit die App sie wie echte Daten liest:

- `eeb.entwurf.v1`: eigener Bogen „THW Ulm Bergungsgruppe" aus
  `examples/thw/013-ulm-b.json` (8 Personen, 2 Fahrzeuge), `uebung: false`,
  Stand und Einsatzzeitraum auf heute, Einsatzort „ECHTER EINSATZ
  Deichsicherung". Für „Vorbelegung entfernen" ein Entwurf mit fünf Personen
  (eine benannt, vier ohne Namen, davon zwei mit Funktion, Rolle, Geschlecht
  und Ernährung).
- `eeb.vorlagen.v1`: „OV Ulm B", „Meine FGr W", „Kirchehrenbach".
- `eeb.einsaetze.v1`: „Hochwasser Test" (3 Einheiten: Ulm, Kirchehrenbach,
  Albstadt Zugtrupp; zuletzt vor 1 h geändert), „Übung Herbst" (10 Tage),
  „Altlage Frühjahr" (85 Tage unverändert), Papierkorb „Vorgestern" (vor
  2 Tagen gelöscht) und „Fast Weg" (vor 29,7 Tagen gelöscht).
- `eeb.entwurf.ersetzt.v1` (Rückholplatz): „THW Albstadt Zugtrupp" (4 Personen,
  „ECHTER EINSATZ Deichsicherung"), wo der belegte Platz geprüft wurde.
- Sicherungsdateien mit der App selbst erzeugt und für die Fälle „kleine
  Datei" (1 Vorlage, keine Sammlung) und „alte Datei" (Sammlungen und Uhrstand
  vor 100 Tagen) umgeschrieben.

Geräteuhr mit `page.clock.install({ time })` auf einer neuen Seite im selben
Kontext (gleicher Speicher): erst Tag 0 (Start mit vorgestellter Uhr), dann
eine weitere Seite bei Tag 1,5 (Uhr +1,5 Tage gegenüber dem ersten Start mit
dem Sprung). Sprünge: +40, +65, +365 und +400 Tage. Nach jeder Handlung
Speicher nachgelesen, Bildschirmfotos angesehen. Elf weitere Prüfer nutzten
den Server gleichzeitig. Zeitangaben unter 1 s sind deshalb unsicher; die
Rückgängig-Fristen (15 s, 20 s) sind nur als „noch da" gemessen.

Szenarien:

1. **Geräteuhr:** vier Sprünge, je Tag 0 und Tag 1,5; Folgen für Sammlungen,
   Papierkorb, Entwurf, Vorlagen und Hinweise. Dazu 59 Tage ruhende Sammlung
   und 31 Tage Pause.
2. **Papierkorb:** Restzeit-Text, „Wiederherstellen" mit frischem und mit altem
   Eintrag, Wiederherstellen nach sechs Tagen, „Endgültig löschen…" bei
   Einsatz und Vorlage, Restzeit „morgen" und Ablauf nach 0,6 Tagen.
3. **Sicherung einspielen:** kleine Datei, alte Datei, Rückfrage mit
   Aufzählung beider Seiten, Haken, Zustand danach und am Folgetag.
4. **Meldekopf:** „Meldung entfernen" (Rückfrage, Rückgängig, Wegnavigieren,
   Neuladen), „Aufteilen", „Zusammenführen" mit Rückgängig (Zustand vor und
   nach dem Rückgängig verglichen), „Abrücken" und „Entfernen" hintereinander,
   „Einsatz löschen…".
5. **Eigener Bogen:** „Verwerfen", „Bogen schließen", „Neuen Bogen erstellen",
   „Bogen aus Vorlage anlegen", „Beispielbogen öffnen", je mit leerem und mit
   belegtem Rückholplatz; „Vorbelegung entfernen" in Schritt 1 und 3;
   Vorlage „Löschen".
6. **Gerät:** „Alle Daten löschen" (Rückfrage, Haken, Ausführung), zwei
   Fenster im selben Kontext, „Geräteschlüssel neu erzeugen" (nur bis zur
   Rückfrage).

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-4-Bericht
samt „Stand der Behebung" habe ich danach gelesen, die Runde-5-Berichte der
anderen Rollen zuletzt (sie waren zum großen Teil noch Entwurf).

**Nicht prüfbar:** eine echt falsch gestellte Geräteuhr (nur per `page.clock`),
zwei echte Geräte an einer Sammlung, echtes Beenden der App durch das
Betriebssystem (nur Neuladen), Kamera-Scan, Kaltstart über Bogen-Link (in
dieser Runde nicht nachgestellt), „Geräteschlüssel neu erzeugen" bis zum Ende,
native Builds, Handschuhe. Zeitgrenzen unter Last (Doppeltipp-Schwelle,
Quittungsdauer) nicht neu vermessen.

## Urteil

Die Bedienhandlungen sind gut abgesichert und seit Runde 4 weiter gewachsen:
Jede Löschung nennt Namen und Folgen, „Meldung entfernen" sagt ehrlich, dass
nach dem Neuladen nichts zurückkommt und ob es einen Export gibt,
„Zusammenführen" lässt sich zurücknehmen (der Speicher nach dem Rückgängig ist
bitgleich mit dem davor), „Sicherung einspielen" zählt beide Seiten
vollständig auf, „Vorbelegung entfernen" meldet Stärke vorher → nachher mit
Rückgängig, und der Papierkorb nennt Datum und Restzeit. Der Rückholplatz wird
in jeder Rückfrage mit dem fallenden Bogen genannt.

Gefährlich wird es wieder dort, wo nichts getippt wird oder wo ein Versprechen
nicht gilt. Erstens: Die Uhrprüfung aus Runde 4 hält nur einen Tag. Bleibt die
falsche Uhr stehen, gilt sie am nächsten Tag als bestätigt, und die App löscht
alle Sammlungen endgültig, auch die von vor einer Stunde, und anonymisiert den
eigenen Entwurf, ohne Papierkorb und ohne Frage (R5-D1). Zweitens: Der
Papierkorb verspricht 30 Tage Rückholung, und „Wiederherstellen" löscht eine
Sammlung, die vor dem Löschen länger als 60 Tage ruhte, im selben Augenblick
endgültig (R5-D2). Drittens: „Alle Daten löschen" in einem Fenster wird vom
zweiten offenen Fenster still zurückgeschrieben (R5-D3).

Alle Aufgaben lassen sich ohne fremde Hilfe erledigen.

## Übersicht: Handlung → Bestätigung → Rückweg

Alles beobachtet bzw. im Speicher gemessen.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| Startseite „Verwerfen" | Rückfrage mit Name, bei belegtem Rückholplatz mit dem fallenden Bogen (Stand, Personenzahl, Einsatzort) | Rückholung ✓ |
| „Bogen schließen", „Neuen Bogen erstellen", „Bogen aus Vorlage anlegen", „Beispielbogen öffnen" | je Rückfrage; bei belegtem Rückholplatz derselbe Satz „… wird dabei endgültig gelöscht" | Rückholung ✓ |
| „Vorbelegung entfernen" (Schritt 1 und 3) | keine, bewusst | Daumenleiste „Vorbelegung entfernt: 4 Personen (2 mit Geschlecht oder Ernährung) — Stärke 5 → 1", „Rückgängig" stellt alles her ✓; nach Neuladen weg |
| Vorlage „Löschen" | keine, bewusst | Papierkorb, „Rückgängig" ✓ |
| „Abrücken" | keine, bewusst | Quittung mit „Rückgängig"; zwei Quittungen stapeln sich ✓ |
| „Entfernen" einer Meldung | „… wird aus diesem Einsatz entfernt — samt Historie. … nur, solange die App geöffnet bleibt … noch keinen Export und keine Weitergabe" | „Rückgängig" übersteht Wegnavigieren und 20 s, **nicht** das Neuladen (so angesagt) ✓ |
| „Aufteilen" | Formular mit Pflichtfeld | Quittung mit „Rückgängig" ✓ |
| „Zusammenführen" | Formular, Teil vorgewählt, Vorschau „Danach: 0 / 2 / 6 / 8" | Quittung „Zusammengeführt … Stärke der Meldung 6 → 8", „Rückgängig" nach 15 s noch da, danach Zustand identisch ✓ |
| „Einsatz löschen…" | Rückfrage mit Name, Zahl, „30 Tage" | Quittung mit „Rückgängig", Papierkorb — **Versprechen gilt nicht für ruhende Sammlungen (R5-D2)** |
| Papierkorb „Wiederherstellen" | keine | **bei ruhender Sammlung sofort wieder gelöscht (R5-D2)** |
| Papierkorb „Endgültig löschen…" | Rückfrage mit Name, Zahl, „es ist die einzige Kopie" bzw. Exportstand | keiner, bewusst |
| „Sicherung einspielen…" | Aufzählung beider Seiten, Haken, Knopf gesperrt bis zum Haken | Sicherungsdatei; **Alter der Datei nicht bewertet (R5-D4)** |
| „Alle Daten löschen" | Aufzählung mit Zahlen, Exportstand, Haken, Knopf gesperrt | Sicherungsdatei ✓; **zweites Fenster stellt zurück (R5-D3)** |
| Aufräumfrist (85 Tage) | Hinweis auf Startkarte und in der Einsatzansicht | Export ✓ |
| Geräteuhr vorgestellt (≥ 60 Tage) | Warnung am ersten Tag | **keiner ab dem zweiten Tag (R5-D1)** |

## Befunde

### R5-D1 [P1] Ein Uhrsprung gilt nach einem Tag als bestätigt: alle Sammlungen weg, Entwurf anonymisiert, ohne Papierkorb und ohne Frage (Rest von R4-D1)

**Priorität:** P1

**Nachweis:** gemessen (Speicher und Seitentext, je zwei Läufe pro Sprung;
Screenshots `03-uhr365-t0`, `04-uhr365-t15-oben`, `47-personal-anonym`).

**Fundstelle / Aufgabe:** Meldekopf-Tablet mit laufender Sammlung „Hochwasser
Test" (3 Einheiten, zuletzt vor einer Stunde geändert), weiteren Sammlungen,
Papierkorb und eigenem Entwurf. Die Geräteuhr geht vor und bleibt dort. Code:
`src/app/datenschutz-uhr.ts` (`geraeteuhrPruefen`: Der Sprung wird übernommen,
sobald die Uhr „frühestens einen Tag später noch dazu passt";
`UHR_SPRUNG_TAGE = 60`), `src/app/uhr-korrektur.ts`,
`src/app/aufraeum-hinweis.ts` (Nachricht „lagen 90 Tage unverändert").

**Beobachtung:**

| Uhr | Tag 0 (erster Start mit dem Sprung) | Tag 1,5 (Uhr geht weiter, Datum bleibt falsch) |
| --- | --- | --- |
| +40 Tage | nicht erkannt; „Altlage Frühjahr" (85 Tage, war angekündigt) und beide Papierkorb-Einträge weg, Rest bleibt | unverändert zu Tag 0 |
| +65 Tage | alles da, Warnung „Geräteuhr prüfen: Das Gerät zeigt den 10.12.2026, beim letzten Start war der 06.10.2026. Bis das geklärt ist, löscht und anonymisiert die App nichts." | „Altlage" und beide Papierkorb-Einträge endgültig weg; „Hochwasser Test" und „Übung Herbst" bleiben (jünger als 90 Tage), Warnung weg |
| +365 Tage | alles da, gleiche Warnung (06.10.2027) | **alle drei Sammlungen und der Papierkorb weg**, Entwurf **anonymisiert** (Personen heißen „Einsatzkraft 1" bis „Einsatzkraft 8"), Warnung weg |
| +400 Tage | wie +365 | wie +365 |

Die Nachricht nach der Löschung lautet für „Hochwasser Test": „Diese Sammlungen
lagen 90 Tage unverändert … endgültig entfernt — nicht im Papierkorb … ·
04.10.2026 bis 06.10.2026 · 3 Einheit(en), 3 Meldung(en) · gelöscht am
07.10.2027, 23:35". Die Sammlung war eine Stunde alt. Für die anonymisierten
Namen im Entwurf fand ich in der Startseite keinen Hinweis; der Bogen zeigt
weiter „Stärke 0 / 2 / 6 / 8", nur die Namen fehlen. Die Vorlagen bleiben
unverändert.

Der Tag 0 verhält sich wie in Runde 4 behoben. Neu ist, was am Tag danach
passiert: Die App kann nicht wissen, ob die Uhr falsch steht oder ob wirklich
ein Jahr vergangen ist, und entscheidet nach einem Tag selbst. Die Warnung
sagt „gilt es ab dem nächsten Start (frühestens morgen)", aber nicht, was
dann gelöscht wird.

**Erwartung der Rolle:** Ein Datum, das ich nie bestätigt habe, löscht nicht
meine Lage. Wenn die App morgen etwas endgültig entfernt, sagt sie heute, was.

**Auswirkung im Einsatz:** Ein Tablet mit falschem Jahr (Einrichtung von Hand,
Werkszustand, leere Pufferbatterie, nie Netzzeit) wird am ersten Tag gewarnt
und am zweiten Tag geleert. Wer die Warnung am ersten Tag nicht liest oder sie
für ein Datenschutz-Detail hält, verliert die gesamte laufende Lage mit
Einheiten, Eintreffzeiten und Abrückzeiten und die Namen des eigenen
Bogens. Die Wahrscheinlichkeit ist gering, der Schaden der größte der App.

**Empfehlung:** Einen Sprung nie allein durch Zeitablauf bestätigen. Der Helfer
bestätigt das Datum ausdrücklich („Das Datum stimmt"), bis dahin bleibt die
Warnung stehen und es wird nichts gelöscht. Die Warnung nennt die Folge mit
Zahlen („Bei Bestätigung werden 3 Sammlungen und die Namen im eigenen Bogen
gelöscht"). Was nach einer Bestätigung fällig ist, zuerst in den Papierkorb
legen. Die Nachricht ehrlich formulieren („nach dem Datum dieses Geräts seit …
nicht geändert") und die Anonymisierung des Entwurfs benennen.

**Nachprüfung:** Sammlung heute ändern, Uhr um 365 Tage vorstellen, App an Tag
0 und an Tag 1,5 öffnen (Uhr bleibt vorgestellt): Die Sammlung muss weiter da
sein und das Datum muss ausdrücklich bestätigt werden müssen. Danach Uhr
zurück: nichts verändert.

### R5-D2 [P1] „Wiederherstellen" löscht eine ruhende Sammlung sofort endgültig, obwohl der Papierkorb 30 Tage Rückholung zusagt (neu)

**Priorität:** P1

**Nachweis:** gemessen (Speicher vor und nach dem Tipp, mit Seed und über die
Oberfläche mit `page.clock`; Screenshots `07-pk`, `08-pk-alt`, `48-a`).

**Fundstelle / Aufgabe:** Startseite → Einsatz-Sammlung → „Löschen…" →
Papierkorb → „Wiederherstellen". Code: Kern
`vendor/bos-meldekopf/src/einsaetze.ts`, `einsatzWiederherstellen` entfernt
nur `geloeschtAm` und lässt `geaendert` stehen; `ruhendeBereinigt` löscht
danach alles mit `geaendert` älter als 90 Tage endgültig. Rückfrage „Einsatz
löschen?" in `src/app/einsaetze-ui.tsx`.

**Beobachtung:** Zwei Wege, derselbe Ausgang.

1. Seed: Sammlung zuletzt vor 100 Tagen geändert, vor 5 Tagen gelöscht. Der
   Papierkorb zeigt „1 Meldung(en) · gelöscht am 1.10.2026 — Wird am
   31.10.2026 endgültig entfernt (in 25 Tagen)" und „Wiederherstellen". Nach
   dem Tipp steht die Sammlung nicht in der Liste und nicht mehr im Speicher.
   Auf der Startseite steht danach „Automatisch gelöscht: Diese Sammlung lag
   90 Tage unverändert … nicht im Papierkorb".
2. Oberfläche: „Altlage Frühjahr" (85 Tage unverändert, Hinweis „Wird in
   5 Tag(en) automatisch gelöscht … exportiere sie jetzt") → „Löschen…". Die
   Rückfrage sagt „wandert in den Papierkorb und lässt sich dort 30 Tage lang
   zurückholen", die Quittung „30 Tage rückholbar". Sechs Tage später
   „Wiederherstellen": Die Sammlung ist weg, im Papierkorb nicht mehr, die
   Nachricht „Automatisch gelöscht … gelöscht am 12.10.2026" erscheint erst
   beim Neuladen der Startseite. Im Moment des Tipps gibt es keine Meldung.

**Erwartung der Rolle:** Was im Papierkorb liegt und „Wiederherstellen"
anbietet, kommt zurück.

**Auswirkung im Einsatz:** Die Sammlungen, die in den Papierkorb gelegt werden,
sind oft gerade die alten, an die die Startkarte erinnert („Wird in 5 Tag(en)
automatisch gelöscht"). Wer sie löscht, weil sie weg sollen, und sie
umentscheidet, oder wer sie versehentlich antippt und erst nach einer Woche
bemerkt, verliert die Fremddaten (Namen, Funktionen, Zeiten) endgültig und
ohne Warnung. Die Zusage „30 Tage" ist in diesem Fall falsch.

**Empfehlung:** „Wiederherstellen" setzt die Ruhefrist zurück (`geaendert` =
jetzt) und sagt es („Die Aufräumfrist beginnt neu"). Alternativ sagt die
Rückfrage beim Löschen einer Sammlung mit Ruhefrist die verkürzte Frist
(„… lässt sich nur bis zum 11.10. zurückholen") und der Papierkorb nennt das
frühere Datum.

**Nachprüfung:** Sammlung mit 85 Tagen Ruhe löschen, nach sechs Tagen (Uhr
vorstellen) „Wiederherstellen": Die Sammlung muss in der Liste stehen und
dort bleiben, auch nach Neuladen.

### R5-D3 [P2] „Alle Daten löschen" in einem Fenster: ein zweites offenes Fenster stellt den Entwurf beim nächsten Tippen zurück, mit „✓ gespeichert" (neu)

**Priorität:** P2

**Nachweis:** gemessen (Speicherschlüssel nach jedem Schritt, Screenshots
`31-A-nachher`, `32-A`).

**Fundstelle / Aufgabe:** Gerät mit zwei Fenstern (Browser-Tab und installierte
App, oder zwei Tabs). Fenster A steht im eigenen Bogen. In Fenster B
„Alle Daten löschen" → Haken → „Endgültig löschen" → „Neu starten". Code:
`src/app/sicherung.ts` (`alleDatenLoeschen`), Autosave in `src/app/entwurf.ts`
(`entwurfSpeichern` erkennt nur einen *geänderten* fremden Stand, nicht einen
entfernten).

**Beobachtung:** Nach dem Löschen steht im Speicher nur noch `eeb.uhr.v1`.
Fenster A zeigt weiter „✓ gespeichert · 11:52 Uhr · nur auf diesem Gerät".
Nach einer Eingabe im Feld „Ort/Auftrag" (zwei Sekunden warten) steht
`eeb.entwurf.v1` wieder im Speicher: der komplette Bogen mit allen acht
Personen. Ein neues Fenster C zeigt „THW Ulm Bergungsgruppe … Fortsetzen",
„Entwurf … wiederhergestellt". Sammlungen und Vorlagen kamen im Lauf nicht
zurück. Stand Fenster A in einer Sammlung, wechselte es nach dem Löschen in
B auf die Startseite und zeigte dort den Entwurf weiter als „Fortsetzen"
an, obwohl der Speicher leer war (nur dieses Bild nachgestellt, das
Zurückschreiben aus der Sammlung nicht geprüft).

**Erwartung der Rolle:** Nach „Alle lokalen Daten endgültig löschen" ist alles
weg, und ein offenes Fenster sagt, dass seine Daten nicht mehr gespeichert
sind.

**Auswirkung im Einsatz:** Das Gerät wird für die Übergabe oder nach einer
Übung geleert („Es gibt keine Kopie in einer Cloud: was hier weg ist, ist
weg"), und die Personendaten kommen aus einem vergessenen Fenster zurück,
während die Anzeige „gespeichert" sagt. Für ein Datenschutz-Löschen ist das
das Gegenteil des Versprechens.

**Empfehlung:** Ein Fenster, das merkt, dass sein Entwurf aus dem Speicher
verschwunden ist (Speicherereignis oder Prüfung vor dem Schreiben), schreibt
nicht zurück, sondern zeigt die vorhandene Meldung „Eingaben hier werden erst
wieder gespeichert, wenn du entscheidest" mit „Neu laden". Die Kopfzeile darf
dann nicht „✓ gespeichert" sagen.

**Nachprüfung:** Zwei Fenster auf dem Bogen, in Fenster B alles löschen, in A
tippen: Der Speicher bleibt leer, A zeigt „nicht gespeichert".

### R5-D4 [P2] „Sicherung einspielen": Eine alte Datei bringt Sammlungen, die am nächsten Tag weg sind; die Rückfrage schweigt, die Uhrwarnung führt in die Irre (neu)

**Priorität:** P2

**Nachweis:** gemessen (Speicher am Tag 0 und Tag 1,5, Screenshots
`12-nach-einspielen`, `12b-tag15`).

**Fundstelle / Aufgabe:** Fußzeile → „Datensicherung" → „Sicherung
einspielen…" mit einer Datei, die vor 100 Tagen erstellt wurde (drei
Sammlungen, Uhrstand `eeb.uhr.v1` von damals). Code:
`src/app/sicherung.ts` (`sicherungEinspielen` übernimmt alle `eeb.`-Einträge,
auch `eeb.uhr.v1`), Rückfrage in `src/app/fusszeile.tsx`
(`Sicherung einspielen?`).

**Beobachtung:** Die Rückfrage nennt unter „In der Datei … (erstellt 28.06.26,
11:40 Uhr)" die drei Sammlungen mit Meldungen, wie sie dastehen, und
Geräteseite („keine laufende Einsatz-Sammlung · 3 Vorlagen · ein angefangener
Bogen"). Sie sagt nicht, dass die Sammlungen älter als 90 Tage sind und beim
nächsten Start fallen. Nach dem Einspielen sind die Sammlungen da. Beim
nächsten Start steht oben „⚠ Geräteuhr prüfen: Das Gerät zeigt den
06.10.2026, beim letzten Start war der 28.06.2026. Bis das geklärt ist, löscht
und anonymisiert die App nichts." (die Uhr ist richtig; der „letzte Start" ist
der Uhrstand aus der Datei). An Tag 1,5 sind alle drei Sammlungen endgültig
gelöscht, mit der Nachricht „lagen 90 Tage unverändert".

**Erwartung der Rolle:** Die Rückfrage sagt, was von der Datei übrig bleibt,
nicht nur, was drin steht. Eine Warnung zur Uhr erscheint nur, wenn die Uhr
verdächtig ist.

**Auswirkung im Einsatz:** Wer ein neues Gerät aus einer älteren Sicherung
einrichtet (der Zweck der Funktion), glaubt die Sammlungen gerettet und
erfährt am Tag danach, dass sie fort sind. Die Uhrwarnung schickt ihn
zusätzlich in die Geräteeinstellungen, obwohl dort nichts zu korrigieren ist.
(Die Warnung bei echter Pause erwähnt auch [neuer-nutzer.md](neuer-nutzer.md).)

**Empfehlung:** Die Rückfrage markiert Sammlungen, die älter als die
Aufräumfrist sind („fällt beim nächsten Start unter die 90 Tage — vorher
exportieren"). Den Uhrstand aus der Datei nicht übernehmen oder beim
Einspielen auf die Gerätezeit setzen.

**Nachprüfung:** Sicherung mit Sammlungen von vor 100 Tagen einspielen: Die
Rückfrage nennt die Frist; nach dem Einspielen keine Uhrwarnung.

### R5-D5 [P3] Wortlaut und Rest-Lücken (neu)

**Priorität:** P3

**Nachweis:** beobachtet, je Punkt.

**Beobachtung:**
- **„Vorbelegung entfernen":** zählt eine unbenannte Person mit Rolle „Führer"
  oder eingetragener Funktion nicht als Inhalt (`personUnbenannt` in
  `src/app/hilfen.ts`: Name, Erreichbarkeit, Fahrerlaubnis, Zusatzqualifikation).
  Im Lauf gingen zwei Personen mit Funktion und Rolle weg; die Quittung nannte
  „2 mit Geschlecht oder Ernährung" und die Stärke 5 → 1, nicht die Funktionen.
  Das „Rückgängig" stellt alles her, ist aber nach dem Neuladen weg.
- **„Alle Daten löschen":** „… noch kein Export, Lageblatt oder keine
  Weitergabe von: …" (doppelte Verneinung).
- **„Zusammenführen":** Teilzeile „Stand 061148okt26" (Tag-Stunde-Minute ohne
  Trenner) statt „06.10.2026, 11:48".
- **„Verwerfen"/„Bogen schließen":** Der Name steht im Satz zweimal
  hintereinander („… wird geschlossen. … bleibt … erreichbar").
- **„Papierkorb (1)" und „Papierkorb (2)"** stehen auf der Startseite an zwei
  Stellen (Vorlagen, Sammlungen) und heißen gleich.
- **Quittung für „Zusammenführen" und „Abrücken"** kürzt den Namen auf „…
  „THW Ulm…" ab.

**Auswirkung im Einsatz:** Kleine Unsicherheit, kein Verlust.

**Empfehlung:** Funktion und Rolle als Inhalt zählen oder in der Quittung
nennen; die Sätze glätten, den Zeitstempel ausschreiben, die beiden
Papierkörbe benennen („Papierkorb Vorlagen", „Papierkorb Einsätze").

**Nachprüfung:** Jeden Punkt einzeln wie beschrieben nachstellen.

### Verweise auf andere Runde-5-Berichte

- [neuer-nutzer.md](neuer-nutzer.md): Die Geräteuhr-Warnung erscheint auch bei
  einer echten Pause von mehr als 60 Tagen, der Satz „Stimmt es, gilt es ab
  dem nächsten Start (frühestens morgen)" ist unklar. Hier in R5-D1/R5-D4 aus
  Sicht der Löschfolgen.
- [fuehrungssicht.md](fuehrungssicht.md): „Eine Geräteuhr, die weit vorgeht,
  löscht Sammlungen" — verweist auf diesen Bericht (R5-D1).
- [neuer-nutzer.md](neuer-nutzer.md): Das schwebende „◐" links unten überdeckt
  das Kästchen „Nur neue Bögen …" und Knopftexte; in meinen Aufnahmen auch den
  Text neben dem Kästchen auf der Sammlungsseite (`14-karte1`, `16-c`). Nicht
  hier gezählt.

## Bestätigtes

- **Rückfragen beim Verdrängen** (Verwerfen, Bogen schließen, Neuen Bogen
  anfangen, Bogen aus Vorlage anlegen, Beispielbogen öffnen): jedes Mal der
  fallende Bogen mit Stand, Personenzahl und Einsatzort, bei leerem
  Rückholplatz nur der Hinweis auf die Rückholung.
- **„Sicherung einspielen"-Rückfrage:** beide Seiten vollständig (Sammlungen
  beim Namen, Papierkorb, Vorlagen, Entwurf, Absenderkarte, Geräteschlüssel),
  Haken Pflicht, „Vorher Sicherung erstellen…" angeboten.
- **„Alle Daten löschen":** Aufzählung mit Zahlen, Exportstand je Sammlung,
  Haken, Knopf bis dahin gesperrt, danach Hinweis „startet jetzt neu"; im
  Speicher bleibt nur `eeb.uhr.v1`.
- **„Meldung entfernen":** ehrliche Rückfrage mit Exportstand, „Rückgängig"
  übersteht Wegnavigieren und 20 s.
- **„Zusammenführen" mit „Rückgängig":** Zustand der Sammlung (Einträge,
  Status, Zahl der Personen und Fahrzeuge, Verweise) nach dem Rückgängig
  gleich dem vorher.
- **Papierkorb-Restzeit:** „Wird am 3.11.2026 endgültig entfernt (in 28
  Tagen)", bei 29,7 Tagen „Wird morgen endgültig entfernt — jetzt
  wiederherstellen …"; Ablauf nach 0,6 Tagen wie angekündigt.
- **Uhr an Tag 0:** +65, +365, +400 Tage halten alles, Warnung mit beiden
  Daten; +40 Tage bleibt die bekannte Grenze.
- **Aufräumfrist bei richtiger Uhr:** Hinweis auf der Startkarte; Löschung
  mit nachträglicher Nachricht (Name, Zeitraum, Zahlen).
- **„Vorbelegung entfernen":** Quittung mit Stärke vorher → nachher und
  „Rückgängig", das Personen, Rolle, Funktion, Geschlecht und Ernährung
  vollständig zurückholt.
- **Vorlage löschen, „Endgültig löschen…":** Papierkorb mit „Rückgängig", zweite
  Rückfrage mit „Das lässt sich nicht rückgängig machen".

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Papierkorb: 30 Tage zurückholen" gilt nicht
  für Sammlungen, die vorher lange ruhten; „Wiederherstellen" löscht sie
  endgültig (R5-D2).
- **Größtes Einsatzrisiko:** Ein Tablet, dessen falsches Datum stehen bleibt,
  wird am zweiten Tag von der App geleert, auch die Lage von vor einer Stunde
  (R5-D1).
- **Top-Priorität für die nächste Iteration:** Uhrsprünge nur nach
  ausdrücklicher Bestätigung übernehmen und fällige Löschungen zuerst in den
  Papierkorb legen (R5-D1), „Wiederherstellen" die Ruhefrist zurücksetzen
  lassen (R5-D2).

## Abgleich mit Runde 4

Grundlage: [../runde-4/zerstoerende-handlungen.md](../runde-4/zerstoerende-handlungen.md)
und [../runde-4/README.md → Stand der Behebung](../runde-4/README.md#stand-der-behebung).

| Runde-4-Befund | Stand laut Behebung | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-D1 Vorgestellte Geräteuhr löscht laufende Sammlungen (P1) | behoben, Grenze unter 60 Tage | **wirkt nur teilweise** | Tag 0: +65, +365, +400 Tage halten Sammlung, Papierkorb und Namen, Warnung sichtbar. Der Sprung wird nach einem Tag allein durch Zeitablauf übernommen: Tag 1,5 löscht alle Sammlungen (auch „Hochwasser Test", eine Stunde alt) und anonymisiert den Entwurf; die Nachricht behauptet „lagen 90 Tage unverändert"; der Entwurf bekommt keinen Hinweis (R5-D1). +40 Tage: wie angekündigt nicht erkannt. Die Behebung sagt „keine Nachricht, alles unverändert" für die echte Uhr danach; das stimmt, bestätigt aber nur die Rückkehr zur richtigen Uhr, nicht den Fall der stehenbleibenden falschen. |
| R4-D2 „Sicherung einspielen" verschweigt Rückholplatz und Absenderkarte (P2) | behoben | hält | Aufzählung auf beiden Seiten vollständig, Haken Pflicht. Neu: die Datei wird nicht auf ihr Alter geprüft, der Uhrstand der Datei löst eine falsche Warnung aus (R5-D4). |
| R4-D3 „Meldung entfernen": Rückweg überlebt kein Neuladen (P2) | behoben (ehrliche Rückfrage) | hält | Rückfrage nennt „nur, solange die App geöffnet bleibt" und den Exportstand („noch keinen Export und keine Weitergabe"); Rückgängig übersteht Wegnavigieren; nach Neuladen weg, wie gesagt. |
| R4-D4 „Vorbelegung entfernen" nimmt Sollplätze still mit (P3) | behoben | hält, mit Rest | Schritt 1 und 3 zeigen die Daumenleiste mit „Stärke 5 → 1" und „(2 mit Geschlecht oder Ernährung)", „Rückgängig" stellt alles her. Rolle und Funktion zählen weiter nicht als Inhalt, nach Neuladen ist der Rückweg weg (R5-D5). |
| R4-D5 Kleinere Lücken (P3): Zusammenführen, Papierkorb-Restfrist, Exportstand, „Verwerfen" der Vorlage | behoben | hält, mit Nebenwirkung | „Zusammenführen" hat Quittung und Rückgängig (Zustand identisch). Papierkorb nennt Datum, Restzeit und „morgen". „Endgültig löschen…" und „Alle Daten löschen" nennen den Exportstand. Nebenwirkung: Die Restzeit im Papierkorb ist für ruhende Sammlungen falsch (kürzer), „Wiederherstellen" löscht sie (R5-D2). „Alle Daten löschen" hat jetzt eine doppelte Verneinung (R5-D5). |
| Runde-4-Bestätigtes „Zwei Fenster" | gehalten | **teilweise verkehrt** | Gilt für geänderte Stände. Ein entfernter Stand (Alle Daten löschen) wird vom zweiten Fenster zurückgeschrieben (R5-D3). |
| Runde-4-Bestätigtes „Abrücken", Rückholplatz-Rückfragen, Vorlage löschen, „Alle Daten löschen"-Rückfrage | gehalten | hält | siehe Bestätigtes. |
