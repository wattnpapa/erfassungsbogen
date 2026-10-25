# Audit „Arbeitsablauf", Runde 7 (Einheit → Meldekopf → zweiter Meldekopf → Stab, dazu Papier)

Stand: 23.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `a52f20a` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Build wurde weder neu gebaut noch
der Server angefasst. Wiederholung nach der Behebung der Runde-6-Befunde
R6-W1 bis R6-W3 und der Änderungen, die Runde 6 an den Wegen der Einheit und
des Meldekopfs vorgenommen hat: Fußleiste des Assistenten, Zurück-Verlauf der
Startseitenfenster, Rückfragen, Zwei-Fenster-Abgleich, Lagemonitor mit
Datenstand und Bewegungen, Papier-Abgleich, Exportstand, Geräteuhr-Rückfrage,
Offline-Zeile, Rückweg im Schritt Personal (Sitzungsspeicher) und Deckel bei
großer Schrift. Der Abgleich bezieht sich auf
[Runde 6](../runde-6/arbeitsablauf.md) samt „Stand der Behebung".

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Grundeinstellung Telefon
360 × 640; zusätzlich 320 × 568, 640 × 360 quer, Tablet 820 × 1180, Zoom
nachgestellt (180 × 320 bzw. 240 × 427 Layout-Pixel) und `html { font-size:
200% }`. Jeder Lauf hatte einen eigenen Browser-Kontext; elf weitere Prüfer
nutzten den Server gleichzeitig. Zeiten habe ich nicht gemessen, Maße,
Zählungen und Dateiinhalte sind davon unberührt.

- **A-Gerät** (Einheit): leerer Kontext, „Neuen Bogen erstellen" über alle
  sechs Schritte (OV, „Bergungsgruppe", Ort, Namensliste über „Namen
  einfügen…"); zweiter Aufbau mit Entwurf aus `examples/thw/` (`001`
  Albstadt, `grossbogen-verstaerkter-bergungszug`), `uebung: false`, `stand`
  auf Minuten vor jetzt, Einsatzzeitraum auf den Prüftag. Links über „Bogen
  übergeben… → Weitere Formate → Link teilen" (`navigator.share` abgefangen,
  Host auf `localhost:4173` umgeschrieben), dazu „PDF erzeugen".
- **M1** (Meldekopf): Sammlung „Hochwasser Musterstadt" mit zwei bis sechs
  Einheiten (`001`, `003`, `009`, `013`, `016`, `052`) als Seed in
  `eeb.einsaetze.v1`. Nachmeldung (Albstadt mit anderem Namen, 20 l Diesel
  mehr, Stand +5 min) per Link im neuen Tab (Kaltstart: erst `about:blank`,
  dann der Link), mit der Entscheidung „neue Fassung", mit „Abrücken" vorher
  und mit älterem Stand. Dazu Lagemonitor als zweites Fenster, „Nur neue Bögen
  seit dem letzten Export", Übersichts-CSV (voll, Erstlieferung, Nachtrag).
- **M2** (zweiter Meldekopf): eigene Sammlung gleichen Namens (andere
  Kennung) mit `001` und `013`, Stand 90 min älter; „Einsatz weitergeben /
  sichern" als Sammel-PDF; Import auf M1 über „Einsatz importieren…" mit
  „In die vorhandene Sammlung übernehmen", davor eine Übersichts-CSV an M1,
  damit der Exportstand einen Bezugspunkt hat.
- **Zwei Fenster:** derselbe Bogen in zwei Tabs eines Kontexts; dieselbe
  Sammlung in zwei Tabs.
- **Papier:** vier Einträge mit `vomPapier` markiert, „Lage vom Papier
  abgleichen…" geöffnet (Felder gelesen, nicht übernommen).
- **Geräteuhr:** Uhr per `page.clock` auf den 03.02.2025 gesetzt, `eeb.uhr.v1`
  auf jetzt; Start, neuer Bogen, Übersicht, „Bogen übergeben".
- **Rückweg Personal:** „Vorbelegung entfernen", Neuladen, „Fortsetzen",
  Schritt 3.

Reihenfolge: Ich habe zuerst blind getestet (Einheit von vorn, Übergabe,
Meldekopf, Karten, Abrücken, Lagemonitor). Beim Anlegen meines Verzeichnisses
lag der Kopf des Runde-6-Berichts (Prüfaufbau) im Blick, bevor der Blindtest
abgeschlossen war; die Befunde und die Behebungsliste habe ich erst nach den
Messungen gelesen. Skripte und Bilder: `scratchpad/runde7/w/`.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit füllt ihren Bogen aus (Einheit, Einsatz, Personal, Fahrzeuge,
   Sofortbedarf) und übergibt ihn; **Annahme:** der Link kommt per Chat und
   öffnet die App in einem neuen Tab.
2. Der Meldekopf nimmt auf, entscheidet bei einer Nachmeldung über die
   Fassung, lässt abrücken, zeigt die Lage am Fernseher.
3. Ein zweiter Meldekopf führt die Lage auf einem eigenen Gerät weiter, beide
   gleichen ab; **Annahme:** der Stab bekommt erst alles, dann nur das Neue.
4. Fällt ein Gerät aus, bleibt das gedruckte Blatt; ein Gerät liest es ein
   und gleicht vom Papier ab.

**Nicht prüfbar:** Kamera-Scan und QR-Vollbild (QR nur über Link und PDF),
echtes Drucken, Handscanner, Nahbereichs-Weitergabe, natives Share-Sheet,
Darstellung der Excel-Datei in Excel, WebKit, native Builds, ein Uhrversatz
zwischen zwei Geräten (alle Kontexte teilen die Systemuhr). Das Datumsfeld
zeigt hier das US-Format (Browsersprache der Testumgebung), kein Befund.
Nachtrag-PDF und Nachtrag-Excel habe ich nicht erneut gelesen; für R6-W1
habe ich Zähler, Übersichts-CSV und Dateinamen geprüft.

## Urteil

Der Arbeitsablauf trägt. Eine Einheit kommt ohne Einweisung von der Startseite
über sechs Schritte zur Übergabe; der Rückweg danach ist geführt: „PDF erzeugt
18:01 Uhr — Empfang nicht bestätigt", bei einer Änderung danach „⚠ Nach „PDF
erzeugt …" geändert — neu übergeben, damit der Meldekopf den Stand hat", auch
auf der Startseite. Der Meldekopf bekommt die Nachmeldung per Kaltstart-Link
jetzt zuverlässig zur Entscheidung (der größte Alltagsfehler aus Runde 6,
R6-N1, ist weg), die Rückfrage nennt eine zuvor abgerückte Einheit, und der
Abgleich zweier Meldeköpfe löst „seitdem 1 neuer Bogen" nicht mehr aus, wenn
nur eine ältere Fassung kam. Zwei Tabs derselben Sammlung bleiben
konsistent, der Lagemonitor folgt dem Abrücken, der Rückweg „Vorbelegung
entfernen" überlebt das Neuladen.

Reibung bleibt an drei Stellen. Die Rückfrage bei der Nachmeldung versteckt
im Querformat und bei großer Schrift zwei der drei Entscheidungen hinter dem
festen „Abbrechen" (R7-W1). Die Geräteuhr-Rückfrage steht nur auf der
Startseite; der Bogen, der mit der falschen Uhr entsteht, trägt Datum und
Stand der Fehluhr, und weder der Assistent noch „Bogen übergeben" sagt etwas
dazu (R7-W2). Und die „Geändert:"-Zeile der Rückfrage zählt nur, statt zu
nennen (R7-W3), während die Karte danach die Änderung benennt. Daneben: Der
Lagemonitor führt das Eintreffen einer neuen Einheit nicht als Bewegung
(R7-W4), und die Warnleiste der zwei Fenster nennt zwei gleich aussehende
Zeilen (R7-W5).

Die Einzelaufgaben schafft man ohne fremde Hilfe. Ein P0 oder P1 habe ich
nicht gefunden.

## Befunde

### R7-W1 [P2] Rückfrage „Einheit ist bereits gemeldet": Im Querformat und bei großer Schrift überdeckt das feste „Abbrechen" die Wahl „Als neue Fassung anhängen"; „Als eigene Einheit führen" ist auch im Hochformat erst nach dem Rollen erreichbar (neu, Nebenwirkung der Rückfragen-Änderung)

**Priorität:** P2 · gemessen (Position und `elementFromPoint` je Knopf, sechs
Darstellungen) · Ursache im Code nicht eingegrenzt

**Fundstelle / Aufgabe:** Nachmeldung einer schon gemeldeten Einheit per Link
(Kaltstart), „In … aufnehmen". Dialog „Einheit ist bereits gemeldet" mit
„Nur in die Historie legen" (nur bei älterem Stand) bzw. „Als neue Fassung
anhängen", „Als eigene Einheit führen", „Abbrechen".

**Beobachtung:**
- Der Dialog ist rollbar, „Abbrechen" klebt an der Unterkante. Bei älterem
  Stand (vier Knöpfe) und 640 × 360 liegt „Nur in die Historie legen"
  (Oberkante 254 px) halb unter „Abbrechen" (283–327 px); „Als neue Fassung
  anhängen" beginnt bei 336 px, im sichtbaren Ausschnitt ist davon nichts zu
  sehen; der Dialog endet bei 344 px. Das Bild zeigt zwei Knöpfe: einen
  angeschnittenen und „Abbrechen". Nichts deutet darauf hin, dass darunter
  zwei weitere Wege liegen.
- 640 × 360 mit 200 % Schrift: Der Dialog ist 1372 px hoch bei 326 px Sicht.
  Beim Öffnen steht er schon 483 px gerollt (der Fokus liegt auf „Nur in die
  Historie legen"); sichtbar sind dann dieser Knopf und „Abbrechen", „Als
  neue Fassung anhängen" (299–387 px) liegt unter „Abbrechen" (239–327 px),
  „Als eigene Einheit führen" bei 580 px. Ganz unten gerollt ist der erste
  Knopf außerhalb.
- 360 × 640 mit 200 % Schrift: „Als neue Fassung anhängen" 494–654 px bei
  640 px Höhe, „Als eigene Einheit führen" 1003–1121 px. 320 × 568: „Als
  eigene Einheit führen" 618–662 px, außerhalb. Zoom 1,5: dasselbe bei
  516–576 px.
- 360 × 640 ohne Vergrößerung: die ersten beiden Wahlmöglichkeiten sind
  sichtbar, „Als eigene Einheit führen" liegt unter „Abbrechen". Am Tablet
  (820 × 1180) sind alle vier sichtbar.
- Der Fall ohne „Nur in die Historie" (neuerer Stand) im Hochformat sieht
  unauffällig aus (Screenshot gelesen).

**Erwartung der Rolle:** Wer eine Nachmeldung aufnimmt, sieht alle Wege, die
der Dialog anbietet, oder merkt am Rand, dass es weitere gibt. Das
Telefon quer im Fahrzeug des Meldekopfs ist keine Ausnahme.

**Folge:** Bei älterem Stand ist der vorgewählte Knopf „Nur in die Historie
legen" („Die bisherige Meldung gilt weiter"). Wer im Querformat oder bei
großer Schrift nur zwei Knöpfe sieht, wählt ihn oder bricht ab; die
Nachmeldung, die zählen sollte, wandert in die Historie, ohne dass der Weg
„Als neue Fassung anhängen" gesehen wurde. „Als eigene Einheit führen" (zweite
gleichnamige Einheit) ist für den Meldekopf mit zwei gleich benannten Zügen
nur durch Rollen erreichbar. Es geht nichts verloren (Historie, Rückgängig
über die Karte), aber es kostet einen Umweg.

**Empfehlung:** Die Wahl steht im rollbaren Teil, das feste „Abbrechen"
überdeckt nichts, oder der Dialog zeigt unter den sichtbaren Knöpfen einen
sichtbaren Hinweis auf weitere. Bei großer Schrift und quer darf der Dialog
die Wahl nicht hinter „Abbrechen" legen.

**Nachprüfung:** Link einer Nachmeldung mit älterem Stand im Kaltstart öffnen,
„aufnehmen": bei 640 × 360, 640 × 360 mit 200 %, 320 × 568 und Zoom 1,5 müssen
„Als neue Fassung anhängen" und „Als eigene Einheit führen" ohne Rollen
oder mit sichtbarem Rollhinweis zu sehen und nicht von „Abbrechen" verdeckt
sein.

### R7-W2 [P2] Geräteuhr-Rückfrage steht nur auf der Startseite; der Bogen und „Bogen übergeben" tragen die falsche Uhrzeit ohne Hinweis (neu, Lücke neben der Geräteuhr-Rückfrage)

**Priorität:** P2 · beobachtet (Uhr nachgestellt; ob ein echtes Gerät nach
leerem Akku so zurückspringt, ist **Annahme**)

**Fundstelle / Aufgabe:** Gerät, dessen Uhr zurückgesprungen ist (03.02.2025,
beim letzten Start 23.10.2026). Neuen Bogen anlegen, Einsatz, Übersicht,
„Bogen übergeben…". Code: `src/app/uhr-warnung.tsx`, `datenschutz-uhr.ts`.

**Beobachtung:**
- Startseite: „⚠ Geräteuhr prüfen: Das Gerät zeigt den 03.02.2025, beim
  letzten Start war der 23.10.2026 (627 Tage danach). Stimmt das heutige
  Datum? Bis du antwortest, löscht und anonymisiert die App nichts." mit
  „Geräteuhr stimmt" und „Uhr korrigieren". Die Rückfrage selbst funktioniert.
- Wer sie nicht beantwortet und „Neuen Bogen erstellen" tippt: Schritt 2
  „Zeitraum von / bis" steht auf 2025-02-03, die Statusleiste zeigt „gespeichert
  · 09:00 Uhr" (Zeit der Fehluhr). In Übersicht und im Dialog „Bogen
  übergeben" kommt „Geräteuhr", „Uhr" oder „Datum" nirgends vor (Textsuche
  der Seite, negativ). „⚠ 6 offene Punkte" nennt Personal und Kennzeichen, nicht
  das Datum. Der Dialog fragt auch nicht „gilt er noch?", weil das Datum zur
  Geräteuhr passt.

**Erwartung der Rolle:** Ein Hinweis auf die unbeantwortete Uhrfrage steht
dort, wo der Helfer ein Datum übergibt: im Assistenten oder in „Bogen
übergeben". Wer die Startseite weggetippt hat, weiß beim Übergeben nicht
mehr, dass sie „Datum prüfen" gefragt hat.

**Folge:** Der Bogen geht mit Stand und Einsatzzeitraum von 2025 an den
Meldekopf. Dort gilt er bei einer Nachmeldung als älterer Stand
(„gilt trotz älterem Stand") oder als „Zeitraum vorbei".
Der Meldekopf bekommt das falsch beschriftete Blatt, nicht die Rückfrage.

**Empfehlung:** Solange die Uhrfrage offen ist, trägt der Assistent (Schritt
2, Übersicht) und der Dialog „Bogen übergeben" einen Hinweis „Geräteuhr
nicht bestätigt — Datum und Stand dieses Bogens stimmen vielleicht nicht",
mit Weg zur Antwort.

**Nachprüfung:** Uhr auf einen Zeitpunkt 600 Tage vor dem letzten Start
setzen, Startseite unbeantwortet lassen, Bogen anlegen und „Bogen
übergeben…" öffnen: Der Hinweis muss in der Übersicht und im Dialog stehen.

### R7-W3 [P3] Die Rückfrage bei der Nachmeldung nennt „Geändert: 3 Änderungen", die Karte danach „Diesel 80 l → 100 l · 2 weitere Änderungen"; „Bisher" und „Neu" sehen gleich aus (Rest von R6-W2)

**Priorität:** P3 · beobachtet (zweimal, mit Namenstausch und mehr Diesel)

**Fundstelle / Aufgabe:** Nachmeldung per Link, Rückfrage „Einheit ist bereits
gemeldet". Code: `src/app/app.tsx` Z. 552 (`MeldungsGegenueberstellung`),
`src/app/meldungs-vergleich.ts` Z. 80 (`diffKurzfassung`),
`src/app/einheiten-tabelle.ts` Z. 491 (`folgeKurztext`).

**Beobachtung:**
- Albstadt, dritter Platz Lang → Neumann, 20 l Diesel mehr, Stand +5 min:
  „Bisher: Stärke 1 / 1 / 2 / 4 · Lang, Sabine · THW-80101, THW-80102 · Stand
  17:39" / „Neu: Stärke 1 / 1 / 2 / 4 · Lang, Sabine · THW-80101, THW-80102 ·
  Stand 17:43" / „**Geändert:** 3 Änderungen". Weder Namenstausch noch Diesel
  stehen dort.
- Nach „Als neue Fassung anhängen" steht in der Quittung „Folgemeldung:
  Diesel 80 l → 100 l · 2 weitere Änderungen". Der Code für diese Fassung
  (`folgeKurztext`) steht mit dem Kommentar da, dass „2 Änderungen" allein
  nicht genügt; die Rückfrage nutzt noch die kürzere Fassung.
- Der Abrückhinweis aus R6-W2 ist da: „⚠ Die Einheit war
  abgerückt – mit der neuen Fassung zählt sie wieder mit."
- Der Satz bei älterem Stand lautet „… einen älteren Stand (…) wie die
  bisherige Meldung (…)": „wie" statt „als".

**Erwartung der Rolle:** Die Rückfrage nennt das, was sich ändert, in
derselben Form wie die Quittung danach (Stärke, Fahrzeuge, Bedarf mit Wert).

**Folge:** Gering. Die Entscheidung „neue Fassung" ist fast immer richtig;
bei zwei gleichnamigen Einheiten fehlt der Anhalt für „Als eigene Einheit
führen". Die Fassung „3 Änderungen" lässt den Meldekopf raten.

**Empfehlung:** Dieselbe Kurzfassung wie in der Quittung („Diesel 80 l → 100
l · Personal: 1 getauscht"), und „als" im Satz zum älteren Stand.

**Nachprüfung:** Bogen mit getauschtem Namen und mehr Diesel an eine
Sammlung schicken; die Rückfrage muss die Bedarfsänderung mit Wert nennen.

### R7-W4 [P3] Der Lagemonitor führt das Eintreffen einer neuen Einheit nicht als Bewegung; Stärke und Zeile ändern sich ohne Anlass (neu)

**Priorität:** P3 · gemessen (Fenster `?lagemonitor=…` neben dem Hauptfenster)
· ob der Fernseher eine neue Zeile genug anzeigt, ist **Annahme**

**Fundstelle / Aufgabe:** Meldekopf nimmt eine Einheit auf, der Fernseher
(Lagemonitor) zeigt die Lage. Code: `src/app/lagemonitor.ts` Z. 59–106
(`Bewegung`, `bewegungenSeit`).

**Beobachtung:**
- Nach „Abrücken" zeigt das Fenster „Abgerückt: THW Albstadt … gerade eben"
  und „5 Einheiten · 20 Fahrzeuge · 1 abgerückt"; Stärke 0 / 14 / 41 // 55.
- Nach der Aufnahme von „THW Bamberg" aus dem Link steigt die Stärke von 16
  auf 27 und „2 Einheiten · 5 Fahrzeuge" auf „3 Einheiten · 9 Fahrzeuge",
  „letzte Meldung gerade eben"; eine Bewegungszeile „Eingetroffen: …" gibt es
  nicht, die Art `Bewegung` kennt nur „Abgerückt", „Wieder da" und
  „Folgemeldung". Die neue Einheit steht als letzte Zeile der Tabelle.

**Erwartung der Rolle:** Wer im Führungsfahrzeug zum Fernseher schaut, sieht
auch beim Eintreffen, warum die Zahl springt.

**Folge:** Gering, die Zeile in der Liste und „letzte Meldung gerade eben"
geben einen Anhalt. Die Leistung der Bewegungen (R6-K1) ist nur zu zwei
Dritteln erreicht.

**Empfehlung:** „Eingetroffen: …" als vierte Bewegung.

**Nachprüfung:** Einheit per Link aufnehmen, Fernsehfenster beobachten: Zeile
„Eingetroffen: THW … gerade eben".

### R7-W5 [P3] Warnleiste der zwei Fenster: „dort" und „hier" lauten gleich, wenn sich nur ein Feld unterscheidet (neu)

**Priorität:** P3 · gemessen (360 × 640, zwei Tabs, Ort in A geändert)

**Fundstelle / Aufgabe:** Derselbe Bogen in zwei Tabs, in A Ort/Auftrag
geändert, in B weitergearbeitet.

**Beobachtung:** B zeigt die feste Warnleiste: „Dieser Bogen wurde in einem
anderen Fenster geändert (dort: „THW Albstadt Zugtrupp Technischer Zug", Stand
23.10.26, 17:54 Uhr, 4 Personen · hier: Stand 23.10.26, 17:54 Uhr, 4
Personen). Eingaben hier werden erst wieder gespeichert, wenn du
entscheidest." mit „Stand aus dem anderen Fenster laden", „Meine Fassung
behalten". Beide Beschreibungen sind bis aufs Wort gleich; die Änderung (Ort)
steht nicht da. Im Speicher stand bis zur Entscheidung weiter der Wert aus A
(`Ort A: Nordhafen`); B hat nichts überschrieben. Die Leiste füllt 40 % der Höhe (360 × 640).

**Erwartung der Rolle:** Die Leiste sagt, worin sich beide Fassungen
unterscheiden, damit „Meine Fassung behalten" eine Entscheidung ist.

**Folge:** Gering: Wer zwei Tabs offen hat, ist selten und weiß meist, was
er geändert hat. Ohne Anhalt wird geraten.

**Empfehlung:** Eine Zeile „Dort geändert: Ort/Auftrag" in der Leiste.

**Nachprüfung:** Zwei Tabs, in einem nur Ort ändern: Die Leiste im anderen
nennt „Ort/Auftrag".

## Verweise auf andere Berichte

- **Rückfrage und Dialoge allgemein** (R7-W1) berührt die Mobile-UI-Prüfung
  (Dialoge und feste Leisten bei großer Schrift, `runde-7/mobile-ui.md`; ob
  dort derselbe Dialog genannt ist, habe ich nicht nachgesehen). Ich habe es nur für die Rückfrage der Nachmeldung
  gemessen; ob weitere Dialoge mit vier Knöpfen betroffen sind, habe ich nicht
  geprüft (Risiko).
- **R6-K9 (Führungssicht):** „Sammel-PDF (erste Lieferung: alle Bögen)" und
  `erste-lieferung-…`/`nachtrag-seit-…` sind jetzt am Knopf und im
  Dateinamen sichtbar (gemessen: `eeb-einsatz-erste-lieferung-…csv`,
  `eeb-einsatz-nachtrag-seit-20261023-1800-…csv`).

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Von der Startseite zur Übergabe:** Neuer Bogen mit Vorbelegung („9
  Personen, 2 Fahrzeuge nach StAN", „Vorbelegung entfernen"), „Namen
  einfügen…" mit Vorschau „→ Platz 1: GrFü" und „5 Personen übernehmen",
  Übersicht mit „offene Punkte … antippen zum Beheben", „Übergeben ist
  trotzdem möglich".
- **Übergabestand:** „PDF erzeugt 18:01 Uhr — Empfang nicht bestätigt." mit
  „Gegenstelle hat ihn — als übergeben vermerken"; nach einer Änderung „⚠ Nach
  „PDF erzeugt …" geändert — neu übergeben …" in Übersicht und auf der
  Startseite.
- **„Für neuen Einsatz vorbereiten":** Zeitraum heute, Ort/Auftrag und
  Sofortbedarf leer, „Personal und Fahrzeuge sind geblieben".
- **Fußleiste des Assistenten:** fest, 56 px bei 640 × 360, 70 px bei 320 ×
  568, 78 px bei 200 % Schrift; kein seitlicher Überlauf in allen fünf
  Darstellungen (`scrollWidth` = `clientWidth`); Schritt 6 ohne Leiste.
- **Zurück-Verlauf:** Zurück schließt den Dialog „Bogen übergeben", der
  zweite Zurück führt zur Startseite; Zurück aus dem Kaltstart-Link nach
  „Abbrechen" führt sauber zur Vorseite.
- **Kaltstart-Nachmeldung (R6-N1):** Die Rückfrage „Einheit ist bereits
  gemeldet" steht nach „In … aufnehmen" nach 150, 400, 1000 und 3000 ms
  unverändert. Mit zuvor abgerückter Einheit: „⚠ Die Einheit war abgerückt –
  mit der neuen Fassung zählt sie wieder mit."
- **Exportstand (R6-W1):** Sammlung M1 mit Stand „Übersicht als CSV: zuletzt
  17:46 · seitdem keine neuen Bögen"; nach dem Import der Sammel-PDF von M2
  (ältere Fassungen von Albstadt und Ulm, „2 Folgemeldung(en)") bleibt es bei
  „seitdem keine neuen Bögen". Nach einer echten Nachmeldung „seitdem 1
  neuer Bogen", Nachtrag-CSV mit Albstadt (Stärke 4, „Im Nachtrag wegen:
  geändert: Folgemeldung"), „Summe Nachtrag — nur neue Einheiten (0)" und
  „NACHTRAG seit … — nicht die ganze Lage (1 Einheit in dieser Datei)".
  Je Format eigener Bezugspunkt („noch nicht in diesem Format exportiert —
  alle Bögen sind neu").
- **Abgleich zweier Meldeköpfe:** Frage „Es gibt schon eine Sammlung …
  Zusammenführen oder getrennt halten?", Quittung mit Nummernwechseln und
  „Lageblatt neu drucken". Zwei Tabs derselben Sammlung bleiben konsistent
  (Abrücken in A erscheint in B ohne Neuladen, beide Abrückvermerke stehen
  nach dem Neuladen im Speicher).
- **Zwei Fenster am Bogen:** Die Leiste warnt, bevor B etwas überschreibt;
  die Eingaben in B werden bis zur Entscheidung nicht gespeichert, A bleibt
  unberührt.
- **Lagemonitor:** „letzte Meldung vor 1 Min / gerade eben", „Abgerückt: …
  gerade eben", Stärke und Fahrzeugzahl folgen dem Hauptfenster binnen
  Sekunden, keine Personennamen.
- **Papier-Abgleich:** „Vom Papier eingelesen, Lage noch nicht abgeglichen:
  4 Einheiten …"; je Einheit „Nr. laut Blatt (leer = App vergibt)",
  „Eingetroffen am (leer = Zeit des Einlesens, nicht bestätigt)", Status,
  Zug, Auftrag.
- **Rückweg „Vorbelegung entfernen":** Nach Neuladen und „Fortsetzen" steht
  im Schritt 3 weiter „Vorbelegung entfernt: 9 Personen — Stärke 9 → 0.
  Rückgängig".
- **Schnellerfassung:** „In Einsatz übernehmen" bei Stärke 0 fragt „Stärke
  fehlt … Stärke eintragen / Trotzdem mit Stärke 0 übernehmen".
- **Geräteuhr:** Die Startseite fragt klar („Bis du antwortest, löscht und
  anonymisiert die App nichts"); Grenzen siehe R7-W2.

## Abgleich mit Runde 6

Geprüft gegen `runde-6/arbeitsablauf.md` samt „Stand der Behebung".

| Befund Runde 6 | Stand in Runde 7 | Beleg |
| --- | --- | --- |
| R6-W1 Nachtrag und Exportstand zählen eine ältere, nachträglich eingetroffene Fassung als neuen Bogen (P1) | hält (Zähler und CSV geprüft; PDF, „Alle Daten" und Excel nicht erneut) | M1 mit älteren Fassungen von M2 importiert: „seitdem keine neuen Bögen". Nach echter Nachmeldung genau „1 neuer Bogen" und eine Nachtragszeile mit Stärke 4 und Grund. |
| R6-W2 Rückfrage zeigt nicht, was sich geändert hat, nennt den Abrückstand nicht (P3) | teilweise | Abrückstand steht jetzt; „Geändert:" nennt nur „3 Änderungen", die Karte danach nennt „Diesel 80 l → 100 l · 2 weitere" (R7-W3). |
| R6-W3 Quittung meldet Eintreffzeit-Abweichung doppelt (P3) | hält, mit Vorbehalt | „Einzelheiten zur Eintreffzeit" ist ein eigener Abschnitt; der Satz „2 kleine Abweichungen bei der Eintreffzeit (Minuten, weil beide Geräte sie beim Empfang selbst vergeben)" kommt weiter bei jedem Doppelempfang (die Behebung hat keine Schwelle eingeführt, so beschrieben). |
| R6-N1 Rückfrage schließt sich beim Kaltstart-Link selbst (Verweis) | hält | Dialog steht nach 150 bis 3000 ms unverändert. |
| R5-W3 Nummern ändern sich beim Zusammenführen | hält | Quittung nennt „6 Nummern geändert … Lageblatt neu drucken". Bei einer Datei mit nur zwei Einheiten verschoben sich alle sechs Nummern; der Grund (Seeds ohne Eintreffzeit, andere Rangfolge) ist nicht verfolgt. |
| R5-W6 Exportstand wandert mit der Lage | nicht erneut geprüft | Sammel-PDF von M2 trug keinen Exportstand (M2 hatte keinen). |
| Änderungen aus Runde 6 (Fußleiste, Zurück-Verlauf, Zwei-Fenster, Lagemonitor, Papier-Abgleich, Rückweg Personal, Offline-Zeile) | tragen; Nebenwirkung an der Rückfrage | R7-W1 (fester „Abbrechen"-Balken), R7-W4, R7-W5; Geräteuhr: R7-W2. Offline-Zeile: „⚠ Noch nicht offline bereit (3,9 von 6,9 MB geladen) — ohne Netz diese Seite nicht neu laden" bzw. „✓ Offline bereit …" steht auf der Startseite. |

## Abschluss

- **Aufgabe geschafft:** ja. Einheit → Übergabe → Meldekopf → Nachmeldung →
  zweiter Meldekopf → Nachtrag und der Papier-Abgleich lassen sich
  durchlaufen; im Querformat und bei großer Schrift mit Mühe an der Rückfrage
  (R7-W1).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Im Querformat sieht der Meldekopf bei der
  Nachmeldung nur „Nur in die Historie legen" und „Abbrechen" und hält das
  für die ganze Auswahl.
- **Größtes Einsatzrisiko:** Ein Bogen, der mit zurückgesprungener Uhr
  entsteht, geht mit falschem Datum und Stand an den Meldekopf, ohne dass die
  App beim Übergeben daran erinnert (R7-W2).
- **Top-Priorität für die nächste Iteration:** Die Rückfrage bei der
  Nachmeldung so legen, dass alle Entscheidungen auch quer und bei großer
  Schrift sichtbar bleiben (R7-W1), danach den Hinweis auf die offene
  Uhrfrage in Assistent und Übergabe (R7-W2).
