# Audit „Fehler und Wiederanlauf", Runde 15 (Bedienfehler provozieren, selbst korrigieren)

Prüfer: Rollenaudit `thw-error-recovery-reviewer`
Datum: 2026-10-26
Zählung: **P0 0 · P1 0 · P2 2 · P3 3** (5 neue Befunde)

Prüfgegenstand: Web-App im Produktionsbuild auf `http://localhost:4173`, Code-Stand Commit `a7874f0`
(`main` nach Runde 14). Reiner Prüfbericht, keine Codeänderung. Vorab gelesen: `docs/audits/README.md`,
`runde-14/README.md`, `runde-13/README.md`, `runde-12/README.md`. Die dort genannten Grenzen und Reste
(R6-O9, R7-G4/M8, R7-G8/H9, R7-N1, R7-N9, R8-A1, R8-M6, R9-M3, R9-G5, R8-H5/S4, leere Karten bei „Nur
Stärke", Rückgängig für Meldungen ohne Überleben des Neuladens, Tabellenzeilenhöhe bei 180 × 320, R11-S4,
R11-H2, R11-K2, R11-A2, R11-A5, R11-M1, R11-M3, R12-W3, R12-H3, R12-O2, R12-O4, R12-G3, R13-W1, R13-W6,
R13-H1, R14-E7, R14-S2, R14-H1, R14-W3) wurden nicht neu gemeldet.

## Prüfaufbau

Playwright (globales Modul unter `/opt/node22/lib/node_modules/playwright`, `chromium.launch()` ohne
Optionen; die Projektkopie fand keinen Browser), `isMobile`/`hasTouch`, Locale de-DE, Dichte 2, Telefon
390 × 844 und 360 × 640 (Dialogmaße zusätzlich 320 × 568). Neue Browser-Kontexte je Lauf, Zustände durch
Bedienung; Übungsbögen aus `examples/thw/` als Dateien eingelesen. Nichts installiert, kein Prozess
beendet. Handscanner und Link-Weg durch Tastatureingabe mit Enter nachgestellt; die Links stammen aus
„Bogen übergeben… → Weitere Formate → Link teilen" (`navigator.share` gestubbt), die Teil-Codes aus den
QR-Bildern der App, mit `jsqr` zurückgelesen. Das Lageblatt wurde mit `pdftotext` gelesen.
Nicht geprüft: echte Kamera, Nahbereich, native Builds, echte Bildschirmtastatur, Zeitverhalten auf einem
echten Telefon, Prüfsummenverhalten des Kamerawegs.

Geprüft: Startseite, Assistent (alle sechs Schritte, Rückkehr nach Neuladen und Zurück-Taste, Personen
entfernen, „Namen einfügen…", Fahrzeuge, Sofortbedarf, Zeiträume), Schnellerfassung, Einsatz-Sammlung
(anlegen, Dateien einlesen, Zeiten ändern, Abrücken mit Doppeltipp, Zug zuordnen, Stärke ändern, Aufteilen,
Verschieben, als Einsatzmeldung zählen, Filter, Tabelle, Exporte bei leerem Einsatz, Löschen und
Papierkorb), Import von Sammel-PDF, falschen, beschädigten und manipulierten Dateien (vierzehn
Abwandlungen eines Übungsbogens), Handscanner mit Fremdcodes, beschädigten Links und mehrteiligen Codes,
Absenderkarte, Vorlagen, Dialoge bei 360 × 640.

## Urteil

Die Fehlerabsicherung ist sehr dicht. Zahlendreher und unmögliche Werte werden fast überall vor der Wirkung
erkannt und mit konkretem Satz abgelehnt; Eingaben bleiben erhalten; jede Korrektur gelingt ohne Hilfe.
Datenverlust im Hauptweg fand ich nicht. Die Behebungen aus Runde 14 halten im echten Browser (Liste unten).
Die beiden mittleren Befunde liegen an der Übernahme fremder Meldungen: Ein Bogen mit ungültiger Signatur
wird beim Einlesen mit grünem Haken gezählt, und eine später eintreffende, aber „ältere" Meldung bleibt nach
der flüchtigen Quittung ohne Spur auf der Karte.

### Runde-14-Behebungen, im echten Browser geprüft und gehalten

- R14-E2/E3: Fremdcode (Webadresse) bleibt bei 390 und 360 px im Fenster, Seitenbreite unverändert; kurze
  Codes („abc", „4711", „12345") enden mit „✗ … keinen gültigen Erfassungsbogen. Empfangen: „…"".
- R14-E5: Absenderkarte: „abc", „12", „0170 abc", „0171 1234567 / 0441 99", „0170 12" und 17- bis 19-stellige
  Nummern lösen die Rückfrage „Telefonnummer übernehmen?" mit „Trotzdem übernehmen / Nummer prüfen" aus.
- R14-E1: „Als Einsatzmeldung zählen…" mit Rückfrage, Zahl 4 Personen, Quittung; Rückgängig stellt 0 zählend her.
- R14-H2/G2/D3: Zug zuordnen: Quittung „Zug „1. Zug" gesetzt: 3 Einheiten" mit Rückgängig; Normalisierung
  „1" zu „1. Zug".
- R14-E7: Leerer Bogen in „In Einsatz-Sammlung ablegen…": Rückfrage „Ort der Einheit fehlt".
- R14-H1 (Teilbehebung bleibt wie gemeldet): Link-Öffnen zeigt „Meldung einer fremden Einheit: Sie gehört in
  eine Einsatz-Sammlung", Hauptknopf „In Einsatz-Sammlung ablegen…".
- R14-G1: Doppeltipp auf „Abrücken" (120 ms): eine Abrückung, eine Quittung. Doppeltipp auf „Einsatz anlegen":
  ein Einsatz.
- R14-S1: Zurück-Taste im Assistenten und Neuladen: Entwurf bleibt, „Fortsetzen" öffnet Schritt 3 mit „Erika".
- R14-A1/A2: Eintreffzeit in der Zukunft oder mehr als einen Tag vor der Aufnahme: „Stimmt die Zeit?" mit
  „Zeit korrigieren"; nachgehende Uhr: „Stand liegt nach dem Eintreffen — Geräteuhr oder Uhr des Absenders
  prüfen" in Quittung und auf der Karte.
- R14-N-Gruppe: Stärke ändern: Gesamt rechnet mit („Gesamt: 24 (bisher 4)"), „-2" sperrt „Stärke
  übernehmen", leere Felder nennen den Grund.

Weiter bestätigt (kein Befund): „Höchstens 99 …", „„1.5" auf ganze Zahlen gerundet: 2.", „Es gilt weiter 12."
(auch bei „１２" in Vollbreitenziffern), 5000 l Diesel „mehr als 1.000 l je Fahrzeug. Stimmt das?", Verpflegung
für 4000 bei Stärke 10, „bis" vor „von", Jahr 2062; Person entfernen mit Hinweis auf die Ansprechperson ohne
Rückrufnummer; „Namen einfügen…" mit Vorschau, Doppelten und nicht-übernommenen Zeilen; Vorlage gleichen
Namens mit Gegenüberstellung; Einsatz mit gleichem Namen beim Import: „Zusammenführen oder getrennt halten?";
Papierkorb mit Rückgängig; fremde, leere, beschädigte, abgeschnittene, zukünftige und PDF-Dateien ohne Bogen
enden mit je einem eigenen Satz; abgeschnittener Link: „Er ist vermutlich unterwegs abgeschnitten worden …".

## Befunde

### R15-E1 [P2] Bogen mit ungültiger Signatur wird beim Einlesen mit grünem Haken aufgenommen, zählt in die Lage und fehlt im Lageblatt

**Priorität:** P2

**Kennzeichnung:** gemessen (390 × 844, Einsatz-Sammlung, Handscanner-/Link-Weg per Tastatureingabe; Kamera
nicht prüfbar).

**Fundstelle / Aufgabe:** „Bogen scannen…" → Handscanner-Fenster; Link-Öffnen (`…/#<Daten>`); danach Karte,
„Neu seit der letzten Kenntnisnahme", Lageblatt.

**Beobachtung:** Ein selbst erzeugter Bogen (nicht als Übung, Einheit „THW Oldenburg", 1 Person) wurde als
Link geteilt. Ein einziges Zeichen im Link geändert (Stelle 10 hinter dem `#`) und in den Handscanner
getippt: „✓ „THW Oldenburg" aufgenommen — 1 Bogen in diesem Durchgang. Nächsten Bogen zeigen…" (grün, ohne
Hinweis auf die Signatur). Die Liste zeigt „Einheiten (1 gemeldet · 1 zählend)", die Karte trägt die Marke
„⚠ Signatur ungültig", die Quittung „Neu seit der letzten Kenntnisnahme (1) … neu gemeldet" erwähnt sie nicht.
Das Lageblatt (PDF, `pdftotext`) führt die Einheit in „Lage: 1 Einheit zählend · Stärke … 0/0/1/1" mit
„Hinweisen: Einheitstyp fehlt prüfen; keine Rufnummer", aber ohne den Vermerk ungültiger Signatur. Dasselbe
mit dem Übungsbogen 001 (Albstadt): Handscanner meldet „✓ … aufgenommen", der Link über die Adresszeile
öffnet den Bogen mit der einen Zeile „Empfangen als: ⚠ Signatur ungültig — die Daten passen nicht zur
Signatur." und zerstörten Inhalten („PostseWn tzSt_Tuebingen@thw.de" als E-Mail), die als „Hinweise an die
Einheit (3) — hier nichts zu beheben" erscheinen. An anderen Stellen (Position 150 bis 200 im Link) wird
derselbe Eingriff dagegen als „keinen gültigen Erfassungsbogen" abgewiesen. Mehrere weitere Abwandlungen
(Position 20 bis 120) meldete der Handscanner als „Bereits vorhanden — übersprungen (gleicher Inhalt)", nachdem
die erste Abwandlung gespeichert war; ob die Prüfung dort nur Kennung und Stand vergleicht, ist nicht geklärt.

**Erwartung der Rolle:** Wer am Meldekopf mit dem Handscanner im Reihentakt aufnimmt, schaut auf das Fenster
und den Haken. Ein Bogen, dessen Daten nicht zur Signatur passen, soll dort anhalten („Daten verändert oder
beschädigt — nochmal scannen oder beim Absender neu anfordern") statt grün durchzugehen.

**Folge im Einsatz:** Eine bei der Übertragung beschädigte oder von Hand veränderte Meldung (Stärke, Rufnummer,
Ort) geht mit grünem Haken in die Summen und auf das Papier-Lageblatt, das der Stab liest. Die einzige
Spur ist eine Marke in der Karte, die beim Reihenscan nicht angesehen wird und auf dem Papier fehlt.

**Empfehlung:** Ungültige Signatur schon in der Scan-Quittung als Warnung statt Haken führen, in der
Zusammenfassung „neu gemeldet" und im Lageblatt (Hinweiszeile oder Marke) nennen. Ob eine solche Meldung in
die Summen zählt, vor der Übernahme per Rückfrage entscheiden lassen („Trotzdem aufnehmen / Nochmal scannen").

**Verifikation:** Link eines echten Bogens an einer Stelle ändern, in den Handscanner geben: Fenster zeigt
Warnung, nicht „✓"; Karte, Quittung und Lageblatt tragen den Vermerk; „zählend" erst nach Bestätigung.

### R15-E2 [P2] Meldung mit falscher Absenderuhr: Nachfolgende richtige Meldung wird nur in die Historie gelegt, die Karte zeigt weiter die alten Daten ohne bleibenden Hinweis

**Priorität:** P2

**Kennzeichnung:** gemessen (390 × 844, Einsatz-Sammlung „Uhr", drei Dateien aus `001-albstadt-ztr-tz.json`
mit geändertem Stand und Diesel; Neuladen).

**Fundstelle / Aufgabe:** „Bögen einlesen…" mit der Reihenfolge C (Stand jetzt − 10 min, Diesel 80 l), A (Stand
jetzt + 2 Tage, Diesel 80 l, Absender mit falscher Uhr), B (Stand jetzt − 5 min, Diesel 500 l, die richtige
neueste Meldung); danach Karte und Historie.

**Beobachtung:** A kommt als „Folgemeldung … inhaltlich unverändert" mit dem Hinweis „⚠ Stand liegt nach dem
Eintreffen — Geräteuhr oder Uhr des Absenders prüfen". B wird mit der Quittung „älterer Stand als der
vorhandene (28.10.2026, 12:00) — nur in die Historie gelegt, die Lage bleibt unverändert." aufgenommen. Nach
„Zur Kenntnis genommen" und nach Neuladen steht auf der Karte „Nr. 1 … Diesel 80 l · Folgem. 12:01" und im
aufgeklappten Zustand die blaue Zeile „Folgemeldung 26.10.2026, 12:01 (vorher Stand 26.10.2026, 11:50):
inhaltlich unverändert". Nirgends steht, dass eine später eingetroffene Meldung mit anderem Inhalt (Diesel
500 l) nicht gilt; die Historie führt sie als „ersetzt" ohne Hinweis auf den Unterschied, der Diesel erscheint in
ihren Zeilen gar nicht. Den Weg „Historie → Diese Fassung gilt…" gibt es (und er funktioniert), aber nichts
auf Karte oder Quittung verweist darauf.

**Erwartung der Rolle:** Wenn zwei Meldungen derselben Einheit kurz hintereinander eintreffen und die zweite
anders ist, soll die Karte das dauerhaft sagen („neuere Eingabe liegt in der Historie, Stand älter") und den
Weg nennen.

**Folge im Einsatz:** Eine Einheit mit falscher Geräteuhr (ein Tag oder zwei zu früh oder zu spät) macht jede
spätere richtige Meldung wirkungslos. Der Meldekopf sieht Diesel 80 statt 500 l, ohne dass die Karte zeigt,
dass ihm etwas vorenthalten wird; die flüchtige Quittung ist beim nächsten Handgriff weg.

**Empfehlung:** Auf der Karte eine bleibende Marke „Neuere Eingabe nicht übernommen (Stand älter) — ansehen"
mit Sprung in die Historie; die Quittung um den Weg („Historie › Diese Fassung gilt…") ergänzen; bei Stand mehr
als einen Tag vor dem Eintreffen schon beim Einlesen auf die Absenderuhr hinweisen.

**Verifikation:** Datei mit Stand in der Zukunft, dann Datei mit gegenwärtigem Stand und anderem Inhalt
einlesen: Karte trägt dauerhaft die Marke, auch nach Neuladen; Tippen führt zu „Diese Fassung gilt…".

### R15-E3 [P3] Mehrteilige Codes: „Teil 1 von 2 gescannt — es fehlt noch Teil 1", und ein Abbruch verwirft den Zwischenstand ohne Wort

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Handscanner-Fenster, Teil-Codes aus den App-eigenen QR-Bildern).

**Fundstelle / Aufgabe:** „Bogen scannen…" mit einem Bogen aus zwei und einem aus drei Teilen.

**Beobachtung:** Wird zuerst Teil 2 gelesen, steht dort „Teil 1 von 2 gescannt — es fehlt noch Teil 1." (gemeint
ist „1 von 2 Teilen"; die Nummer des gescannten Teils nennt der Satz nicht, der fehlende steht danach). Bei Teil
2 und 3 eines Dreierbogens: „Teil 2 von 3 gescannt — es fehlt noch Teil 1." Wird ein Teil eines anderen Bogens
dazwischen gelesen: „Anderer Bogen erkannt — neu begonnen (Teil 1 von 3) …"; die bis dahin gelesenen Teile
des ersten Bogens sind weg, der Satz sagt das nicht. „Abbrechen" mit einem Teil im Speicher schließt das Fenster
ohne Hinweis; erneutes Öffnen und Lesen von Teil 1 meldet „es fehlt noch Teil 2", der zuvor gelesene Teil 2
zählt nicht mehr.

**Erwartung der Rolle:** „Teil 2 gelesen — es fehlt noch Teil 1"; bei Abbruch und beim Wechsel des Bogens:
„1 von 2 Teilen verworfen".

**Folge im Einsatz:** Bei Papierbögen mit mehreren Codes in beliebiger Reihenfolge deutet der Satz auf einen
Fehler hin, den es nicht gibt; ein versehentlich gelesener Code eines Nachbarbogens verwirft Arbeit ohne
Vorwarnung. Die Teile lassen sich neu lesen, es geht nur Zeit verloren.

**Empfehlung:** Satzbau auf die Nummer des gelesenen Teils umstellen („Teil 2 gelesen — fehlt noch: Teil 1");
Bogenwechsel und Abbruch nennen, was verworfen wird.

**Verifikation:** Teil 2 eines Zweierbogens lesen: Satz nennt „Teil 2" und „fehlt: Teil 1"; Teil eines anderen
Bogens lesen: Satz nennt den verworfenen Zwischenstand.

### R15-E4 [P3] „Aufteilen…" öffnet das Formular unterhalb des sichtbaren Bereichs, ein zweiter Tipp schließt es wieder

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844 und 360 × 640, Karte aufgeklappt, „Mehr…").

**Fundstelle / Aufgabe:** Einsatz-Sammlung, Karte, „Mehr…" → „Aufteilen…".

**Beobachtung:** Nach dem Tipp verändert sich nur die Beschriftung („Aufteilen schließen"); die Seite scrollt
nicht (`scrollY` vorher und nachher 1648 bzw. 1704). Die Überschrift „Aufteilen" liegt bei 390 × 844 auf y = 569,
das erste Feld auf 701, bei 360 × 640 Überschrift auf 524 und erstes Feld auf 675, also hinter der Fußleiste
(ab 584) bzw. außerhalb. Auf 360 × 640 ist kein Eingabefeld zu sehen. „Zug zuordnen" und „Auftrag/Notiz" öffnen
dagegen sichtbar (Feld bei y = 330). „Stärke ändern…", „Verschieben…" und „Entfernen" sind Dialoge.

**Erwartung der Rolle:** Das Formular steht nach dem Tipp im Bild.

**Folge im Einsatz:** Wer nach dem Tipp nichts sieht, tippt erneut und schließt das Formular; erst Scrollen
klärt es. Kostet Zeit, kein Datenverlust.

**Empfehlung:** Formular beim Öffnen in den Bildbereich holen oder, wie „Stärke ändern…", als Dialog zeigen.

**Verifikation:** Bei 360 × 640 „Aufteilen…" tippen: Überschrift und erstes Feld sind ohne Scrollen sichtbar.

### R15-E5 [P3] Kennzeichen mit „THW-"-Vorsilbe, aber falscher Ziffernzahl, und freier Text werden ohne Hinweis übernommen

**Priorität:** P3

**Kennzeichnung:** gemessen (390 × 844, Schritt 4, Organisation THW).

**Fundstelle / Aufgabe:** Schritt 4 „Fahrzeuge" → Kennzeichen.

**Beobachtung:** „thw 84397" und „THW84397" werden zu „THW-84397" angeglichen (gut). „THW-8439" (vier Ziffern),
„THW-843970" (sechs Ziffern) und „DAS IST KEIN KENNZEICHEN" bleiben ohne Hinweis stehen, auch in der
Übersicht; bei Sitzplätzen, Mengen und Telefonnummern gibt es solche Prüfungen („Stimmt das?").

**Erwartung der Rolle:** Ein Zahlendreher oder eine fehlende Ziffer im Kennzeichen eines THW-Fahrzeugs fällt
dem Meldekopf erst beim Abgleich mit dem Papier auf; ein Hinweis bei „THW-" mit weniger oder mehr als fünf
Ziffern wäre die gleiche Güte wie bei den Zahlenfeldern.

**Folge im Einsatz:** Fahrzeug lässt sich am Meldekopf nicht eindeutig zuordnen; geringes Risiko, Rückfrage per
Funk behebt es.

**Empfehlung:** Bei „THW-" ohne fünf Ziffern ein „Stimmt das?" wie bei den Mengen; andere Formate nicht
beanstanden.

**Verifikation:** „THW-8439" eintragen und das Feld verlassen: Hinweis erscheint; „THW-84397" bleibt ohne
Hinweis.

## Abschluss

- **Aufgabe geschafft:** ja (alle geprüften Abläufe ohne fremde Hilfe)
- **Fremde Hilfe nötig:** nein
- **Größtes Missverständnis:** Der grüne Haken beim Scannen gilt als „Meldung in Ordnung", obwohl er auch für
  einen Bogen mit ungültiger Signatur erscheint.
- **Größtes Einsatzrisiko:** Beschädigte oder falsch datierte Meldungen laufen ohne bleibenden Hinweis in Karte,
  Summen und Papier-Lageblatt.
- **Top-Priorität für die nächste Iteration:** R15-E1 (ungültige Signatur in Scan-Quittung, Quittung und
  Lageblatt sichtbar machen), danach R15-E2 (bleibende Marke bei nicht übernommener neuerer Eingabe).
