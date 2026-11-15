# Audit „Stress und Unterbrechung“, Runde 9 (Zeitdruck, Ablenkung, Wiedereinstieg)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-stress-test-user` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `c789947` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-8-Befunde. Der Server lief unverändert; ich habe ihn weder neu gebaut
noch neu gestartet und keinen Prozess beendet.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE, Grundeinstellung
360 × 640 px, dazu 320 × 568, 640 × 360 (quer), Zoom-Nachbildung mit
180 × 320 und 320 × 180 Layout-Pixeln (rund 200 % Browser-Zoom) und
`html { font-size: 200% }`. Jeder Lauf hatte einen eigenen Browser-Kontext,
weil elf weitere Prüfer denselben Server nutzten; der Seed wurde je Kontext
genau einmal geschrieben. Zwei Fenster sind zwei Seiten im selben Kontext.
Tipps mit `touchscreen.tap` an festen Bildstellen (Abstände 0 bis 3 500 ms),
Zurück-Geste mit `page.goBack()`, Unterbrechung als `reload()`, Drehen als
`setViewportSize`.

Zustände über `localStorage`-Seeds aus `examples/thw/`, jeweils mit
`uebung: false`, `stand` auf heute und Einsatzzeitraum um heute herum:
`eeb.entwurf.v1` mit 013 Ulm (8 Personen) und dem Großbogen „Verstärkter
Bergungszug“ (38 Personen); `eeb.einsaetze.v1` mit der Sammlung „Hochwasser
Musterstadt“ (6 Einheiten aus 001, 003, 009, 013, 016, 052); `eeb.uhr.v1` mit
`zuletzt` 400 Tage in der Zukunft; abgebrochene Texte für `eeb.entwurf.v1` und
`eeb.einsaetze.v1`; Entwürfe mit `stand` 40, 80, 86 und 100 Tage in der
Vergangenheit. In den Seeds trägt jede Karte „⚠ Anderer Einsatz?“, weil der
Ort der Übungsbögen nicht zum Sammlungsort „Musterstadt“ passt; das ist dem
Seed geschuldet und kein Befund. Skripte und Screenshots liegen im Scratchpad
unter `runde9/s/`.

Getestet habe ich zuerst ohne Blick in die Berichte: Start mit Entwurf und
Sammlung, „Person entfernen“ samt Rückfrage und „Rückgängig“, Tippen mit
sofortigem Neuladen, Zurück-Geste im Assistenten und im Dialog, Doppeltipp auf
„Weiter →“, „Verwerfen“, „Neuen Bogen erstellen“ bei vorhandenem Entwurf,
„Abrücken“ mit Zweittipp in Abständen, Aufklappen der Einheitenkarten,
„Meldung entfernen“, „Bogen übergeben“ mit QR-Vollbild und Neuladen,
„Einheit manuell erfassen“ mit Neuladen, Zwei-Fenster-Abgleich, Drehen bei
offener Rückfrage, Lagemonitor, Datenschutzfrist-Hinweise. Danach habe ich den
Runde-8-Bericht und den „Stand der Behebung“ gelesen und die Behebungen
einzeln gegengeprüft (Tabelle unten).

Nicht prüfbar: echter Lärm und echte Unterbrechung durch Personen, echte
Bildschirmtastatur, Zurück-Geste der installierten PWA und der nativen Builds,
echte Doppeltipps mit Handschuh, Kamera und Handscanner, Hintergrund-Beenden
des Tabs durch das Betriebssystem (nur `reload()`), WebKit/Safari. Nicht
geprüft: R6-O9 (Uhrstand in der Zukunft, frische Sammlung), Zusammenführen-Tipp
(R7-N1), Sammel-PDF-Download, Zug-Normalisierung „n. Zug“ in der Anzeige
(Eingabe „2“ wurde angenommen, die Anzeige habe ich nicht ausgewertet), CSV
nach Nr., Umschrift im Papierfeld, Sollstärke-Marke, Kontrast in Musterung,
iOS und Nacht (Gegenstand anderer Rollen).

## Urteil

Die Runde-8-Behebungen, die diese Rolle berühren, halten. Beschädigte
Gesamttexte gehen nicht mehr still verloren: Ein abgebrochener
`eeb.einsaetze.v1`-Text wird zu `[]`, der Rohtext liegt in `eeb.unlesbar.v1`
(22 110 Zeichen), überlebt Neuladen und steht in der Datensicherung
(`eeb-sicherung-2026-10-24.json`, 27 693 Zeichen, mit `eeb.unlesbar.v1`);
„Beiseitegelegtes entfernen…“ fragt mit „endgültig“. Die Sprungmarke liegt in
allen sieben Lagen bei −8 px (Unterkante), nichts überdeckt „Alle Themen“. Der
Kasten zum beiseitegelegten Bogen hat drei Zeilen und nennt den Weg („Als Datei
sichern“ … oder unten gleich einen neuen Bogen beginnen). Bei 180 × 320 liegt
„Fortsetzen“ bei 273 bis 317 px im ersten Bild, der Name bricht ohne Wortbruch
um. Die Zwei-Fenster-Warnung nennt jetzt die Werte („Ort / Auftrag, Personal
(1 Eintrag: Lehmann, Karsten → Lehmann, Zacharias)“; Rückfrage mit „dort: …,
hier: …“). Die Rückfrage „Meldung entfernen?“ nennt die Nummern-Verschiebung
(„Die Einheiten Nr. 3–6 rücken auf und heißen danach Nr. 2–5“). „Abrücken“ mit
Quittungsleiste unter dem Finger nimmt einen Zweittipp bis rund 2,4 s nicht an.
„Rückgängig“ nach „Person entfernen“ überlebt das Neuladen.

Die Kernaufgaben gelingen ohne fremde Hilfe, auch mit Unterbrechungen und
hektischem Tippen: Tippen im Feld und sofortiges Neuladen behält den Text,
Doppeltipp auf „Weiter →“ löst einen Schritt aus, Zurück in der Kette
(Schritt 3 → 2 → Übersicht → Startseite) schließt Dialoge zuerst und bleibt in
der App, „Neuen Bogen erstellen“ bei vorhandenem Entwurf fragt mit Folge und
Rückholweg. Eine Lücke bleibt, wo Papierangaben nur im Arbeitsspeicher liegen:
In der manuellen Aufnahme für die Sammlung gehen Eintreffzeit, Nr. laut Zettel
und Zug beim Neuladen verloren, während die Seite „Entwurf wiederhergestellt“
meldet (R9-S1). Dazu drei kleine Befunde zu Rückmeldung und Wortlaut.

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Entwurf wiederhergestellt“ in der manuellen
  Aufnahme klingt nach „alles wieder da“, aber die drei Zettelfelder sind leer
  (R9-S1).
- **Größtes Einsatzrisiko:** Wer die manuelle Aufnahme unterbricht und neu
  lädt, übernimmt die Einheit mit Uhrzeit und Nummer der App statt der vom
  Zettel (R9-S1).
- **Top-Priorität für die nächste Iteration:** Eintreffzeit, Nr. und Zug der
  manuellen Aufnahme mit dem Entwurf aufbewahren (R9-S1).

## Befunde

### R9-S1 [P2] Manuelle Aufnahme: „Eingetroffen um“, „Nr. laut Zettel“ und „Zug / Verband“ gehen beim Neuladen verloren, der Entwurf wird als „wiederhergestellt“ gemeldet

**Priorität:** P2

**Kennzeichnung:** beobachtet (Skripte `n2`, `n3`, `n4`; Screenshot
`n2a.png`). Die Folgen beim Übernehmen sind Risiko, nicht gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Musterstadt“ →
„Einheit manuell erfassen…“, Kopf „Aufnahme für: Hochwasser Musterstadt“ mit den
Feldern „Eingetroffen um (vom Meldeblock)“, „Nr. laut Zettel (leer = die App
vergibt)“ und „Zug / Verband (laut Zettel)“, darunter der Assistent ab
„1. Einheit“.

**Beobachtung:** Ich trug 06:55, „7“ und „2“ (zweiter Lauf „2. Zug“) ein. Beim
Wechsel auf Schritt 3 und zurück blieben die Werte stehen. Nach `reload()`
steht die Seite wieder in „Aufnahme für: Hochwasser Musterstadt“, darunter
„Entwurf vom 24.10.26, 07:11 Uhr wiederhergestellt.“, die drei Felder sind
leer (`time=`, `text=`, `text=`). Die Bogenfelder (Name, Organisation,
Personal) sind zurück. Ein Hinweis, dass die Zettelangaben fehlen, erscheint
nicht; im Speicher liegen sie nicht (`localStorage`-Schlüssel ohne die Werte,
`sessionStorage` nur `__i`).

**Erwartung der Rolle:** Was vom Zettel abgeschrieben wurde, ist nach einer
Unterbrechung noch da, oder die Seite sagt klar, dass es fehlt. „Entwurf
wiederhergestellt“ gilt für alles, was auf dem Bildschirm stand.

**Folge im Einsatz:** Der Meldekopf nimmt eine Einheit im Stehen auf, wird
gerufen, das Gerät lädt neu oder der Tab wird beendet. Beim Weitermachen steht
der Bogen da, die Felder sehen aus wie „leer lassen, die Einheit trifft gerade
ein“. Wer das nicht merkt, übernimmt die Einheit mit der Uhrzeit des
Übernehmens statt der Zeit vom Meldeblock, mit einer von der App vergebenen
statt der am Funk genannten Nummer und ohne Zug (Risiko). Die Nummer ist die,
die am Funk genannt wird; eine falsche fällt erst auf, wenn Lageblatt und Funk
auseinanderlaufen. Gemildert wird das durch die Rückfrage bei mehr als fünf
Minuten Abstand zur Erfassung.

**Empfehlung:** Die drei Felder mit dem Entwurf aufbewahren (wie
„Rückgängig“ nach „Person entfernen“, das das Neuladen überlebt). Geht das
nicht, im Hinweis „Entwurf wiederhergestellt“ benennen, dass Zeit, Nr. und Zug
neu einzutragen sind.

**Nachprüfung:** Aufnahme öffnen, 06:55 / 7 / „2. Zug“ eintragen,
Neuladen: Werte stehen wieder in den Feldern, oder der Hinweis nennt sie.

### R9-S2 [P3] Ein zu früher Tipp auf einen Knopf der Rückfrage wird ohne jede Rückmeldung verworfen (450 / 800 ms)

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `d1`, `d2`, `m1`); Dauer der Sperre ist
bekannte Grenze R8-H5/S4, neu ist die fehlende Rückmeldung.

**Fundstelle / Aufgabe:** „Person entfernen“ → Rückfrage „Otto, Sandra
entfernen?“ mit „Person entfernen“ und „Abbrechen“; ebenso „Meldung
entfernen?“.

**Beobachtung:** Ein Tipp auf „Person entfernen“ 0, 150, 300 und 500 ms nach dem
Erscheinen der Rückfrage bleibt ohne Wirkung (Dialog bleibt offen, 8 Personen),
ab 800 ms geht er durch (7 Personen). Während des Verwerfens erscheint nichts:
`#tipp-moment` („Einen Moment …“) fehlt in allen acht Messungen im Abstand von
60 ms. Beim Doppeltipp auf „Weiter →“ dagegen steht „Einen Moment …“ 140 × 29 px
neben dem Finger (Bildstelle 218 bis 358 px, 534 bis 563 px) bis rund 1 s.

**Erwartung der Rolle:** Wird ein Tipp bewusst abgefangen, sagt das Gerät es,
wie an den anderen Stellen der App.

**Folge im Einsatz:** Gering. Wer die Rückfrage gelesen hat und bestätigen will,
tippt in der Regel nach mehr als einer halben Sekunde; wer früher tippt, sieht
nichts und zweifelt, ob der Tipp ankam. Zweiter Tipp geht durch.

**Empfehlung:** Dieselbe Rückmeldung („Einen Moment …“) auch für die verworfenen
Tipps auf Knöpfe der Rückfrage, oder die Knöpfe in den ersten 800 ms sichtbar
gedämpft zeigen.

**Nachprüfung:** Rückfrage öffnen, nach 150 ms „Person entfernen“ tippen:
„Einen Moment …“ erscheint, der Dialog bleibt, nach 1 s geht der Tipp durch.

### R9-S3 [P3] „Rückgängig“ nach „Meldung entfernen“ überlebt das Neuladen nicht, nach „Person entfernen“ schon

**Priorität:** P3

**Kennzeichnung:** beobachtet (Skripte `g3`, `h2`, `h3`); der Wortlaut der
Rückfrage ist gemessen.

**Fundstelle / Aufgabe:** Sammlung „Hochwasser Musterstadt“ → Karte aufklappen →
„Mehr…“ → „Entfernen“ → „Meldung entfernen“; zum Vergleich Assistent
Schritt 3 → „✕“ → „Person entfernen“.

**Beobachtung:** Nach „Person entfernen“ liegt der Rückweg im
`sessionStorage` (`eeb.personal.rueckweg`); nach Neuladen und „Fortsetzen“ ist
„Rückgängig“ wieder da. Nach „Meldung entfernen“ (6 → 5 Einheiten) ist
`sessionStorage` nach dem Neuladen leer, die Einheit ist weg, es gibt weder
„Rückgängig“ noch eine Rückholung. Die Rückfrage sagt das offen: „‚Rückgängig‘
gibt es nur, solange die App geöffnet bleibt. Nach dem Neuladen oder Beenden der
App ist die Meldung endgültig weg.“ Dazu: „Von dieser Meldung gibt es in dieser
Sammlung noch keinen Export und keine Weitergabe.“

**Erwartung der Rolle:** Zwei gleich aufgebaute „Rückgängig“-Leisten tragen
gleich weit. Wer eine ganze Einheit samt Historie entfernt, hat mindestens so
viel Rückweg wie bei einer Person.

**Folge im Einsatz:** Gering bis mittel, aber offengelegt. Der Weg zurück ist
die Gegenstelle, die den Bogen erneut zeigt; die Historie der Einheit (Zeiten,
Abrücken) ist dann neu. Wer die Rückfrage überfliegt und kurz danach ein
Neuladen erlebt (Telefonanruf, Tab beendet), verliert die Meldung.

**Empfehlung:** Den Rückweg der Meldung wie den der Person in den
Sitzungsspeicher legen; solange das nicht geht, den Satz zur Endgültigkeit im
Dialog an die Knopfzeile ziehen („Meldung entfernen — nach Neuladen nicht
rückholbar“).

**Nachprüfung:** Meldung entfernen, Neuladen, Sammlung öffnen: „Rückgängig“
steht wieder zur Wahl und holt die Meldung samt Nummer zurück.

### R9-S4 [P3] Zwei Hinweiskästen für Unlesbares schieben „Neuen Bogen erstellen“ aus dem ersten Bild; „Daten stecken in der Datensicherung“ klingt, als gäbe es eine

**Priorität:** P3

**Kennzeichnung:** gemessen (Skripte `c2`, `c3`, `o1`; Screenshots `c2.png`,
`c3-ent.png`).

**Fundstelle / Aufgabe:** Startseite mit abgebrochenem `eeb.entwurf.v1` und
abgebrochenem `eeb.einsaetze.v1` (beides zugleich); Kasten „Nicht lesbar: 1
beschädigter Gesamttext“ und Kasten „Ein Bogen ließ sich nicht öffnen“.

**Beobachtung:** (1) Bei 360 × 640 stehen beide Kästen übereinander; „Neuen
Bogen erstellen“ liegt bei 872 px (Bildhöhe 640), also eine halbe Bildhöhe
unterhalb des Bildes. Mit nur dem Bogen-Kasten liegt der Knopf bei 609 bis
654 px (14 px unter dem Bildrand), bei 320 × 568 bei 659 px. (2) Der Kasten
zur Sammlung sagt „Nichts davon ist gelöscht; die Daten stecken in der
Datensicherung.“; auf dem Gerät gab es keine („Auf diesem Gerät wurde noch
keine Sicherung erstellt“), sie entsteht erst mit „Daten sichern…“ (dann
enthält die Datei `eeb.unlesbar.v1`). (3) Der rote Knopf „Beiseitegelegtes
entfernen…“ steht 16 px unter „Daten sichern…“; er fragt mit „endgültig
gelöscht“ nach und lässt sich mit Zurück schließen.

**Erwartung der Rolle:** Wer eine Meldung sucht und sie nicht findet, liest „Ist
sie weg? Wo ist sie? Was tue ich zuerst?“ — mit der Antwort „nicht weg, erst
sichern“ und dem Weg weiter ohne Scrollen.

**Folge im Einsatz:** Gering. Der seltene Doppelfall hält das Weitermachen auf;
der Satz zur Datensicherung kann zur Annahme führen, es gäbe schon eine Kopie.
Daten sind nicht gefährdet, solange niemand „Beiseitegelegtes entfernen…“
bestätigt.

**Empfehlung:** Im Kasten „sind beiseitegelegt; mit ‚Daten sichern…‘ als Datei
sichern“ statt „stecken in der Datensicherung“; den roten Knopf in einen
Aufklapper oder weiter vom Sicherungsknopf weg setzen.

**Nachprüfung:** Beide Texte seeden, 360 × 640: „Neuen Bogen erstellen“ im
ersten Bild; Wortlaut nennt „Daten sichern…“ als Weg.

## Bestätigtes

- **Tippen und Neuladen:** Vorname „Zacharias“ im Feld „Person 1: Vorname“
  getippt, sofort `reload()`: Wert im Entwurf, Startseite bietet „Fortsetzen“.
- **Doppeltipp „Weiter →“:** Zwei Tipps im Abstand von 250 ms an derselben
  Stelle: ein Schritt, dazu „Einen Moment …“ neben dem Finger. QR-Vollbild:
  zwei schnelle Tipps auf „Weiter zu Teil“ gehen nur einen Teil weiter (Teil 3 →
  Teil 4).
- **Rückfragen und Zurück:** „Person entfernen“ öffnet mit Fokus auf
  „Abbrechen“; Zurück schließt die Rückfrage und lässt Schritt 3 stehen, die
  Zurück-Kette (3 → 2 → Übersicht → Startseite) bleibt in der App.
  „Neuen Bogen erstellen“ bei vorhandenem Entwurf: „Der angefangene Bogen „THW
  Ulm Bergungsgruppe“ wird durch einen leeren Bogen ersetzt. Der Stand bleibt auf
  der Startseite unter „Zuletzt geschlossenen Bogen zurückholen“ erreichbar.“;
  Entwurf mit 8 Personen bleibt bis zur Bestätigung. „Verwerfen“ nennt dieselbe
  Rückholung.
- **„Rückgängig“-Leiste nach „Person entfernen“:** bleibt mehr als 30 s stehen,
  stellt die Person wieder her (37 → 38), überlebt Schrittwechsel (Weiter,
  Zurück) und Neuladen.
- **Quittung unter dem Finger (R8-D5):** „Abrücken“ so gerollt, dass die Leiste
  mit „Rückgängig“ (518 bis 562 px) unter dem Finger (542 px) aufgeht: Zweittipp
  nach 1 300 bis 2 000 ms ohne Wirkung (Status unverändert), ab 2 400 ms nimmt
  er „Rückgängig“ an. Liegt „Wieder anwesend“ an der Stelle (Leiste weiter
  unten), nimmt ein Tipp nach 1 200 ms das Abrücken zurück; vorher nicht. Die
  Beschriftung wechselt „Abrücken“ → „✓ Abgerückt“ (gestrichelt) → „Wieder
  anwesend“.
- **Rückfragen bei Zoom 200 %:** „Person entfernen“ bei 180 × 320: Dialog
  16 bis 304 px, Knöpfe 190 bis 234 und 251 bis 295 px untereinander; „Meldung
  entfernen“ bei 320 × 568 mit 200 % Schrift: Knöpfe bei 366 bis 410 und 491 bis
  535 px; bei 180 × 320: 190 bis 234 und 251 bis 295 px. Quer (640 × 360): beide
  Knöpfe in einer Reihe bei 225 bis 269 px. Drehen bei offener Rückfrage
  (hoch → quer → hoch → Zoom) behält den Dialog, kein Seitenüberlauf.
- **Zwei-Fenster-Abgleich:** Warnung 104 px hoch bei 360 × 640 (16 %), 136 px
  bei 320 × 568 mit 200 % Schrift (24 %); „Genauer“ nennt „Dort: … gespeichert
  07:01:04 Uhr, 8 Personen“ und „Hier: Stand … zuletzt gespeichert 07:00:57 Uhr“;
  die Rückfrage „Stand aus dem anderen Fenster laden?“ nennt beide Werte
  („dort: „Brückeneinsturz Neu-Ulm — M…“, hier: „Gebäudeschaden XUlm —
  Abstü…““) und die Personenänderung mit Namen.
- **Rohtext-Rettung:** abgebrochener `eeb.einsaetze.v1`-Text: Schlüssel wird
  `[]`, Rohtext in `eeb.unlesbar.v1`, nach Neuladen unverändert; Hinweis „Nicht
  lesbar: 1 beschädigter Gesamttext (Sammlungen oder Vorlagen) … die Stärke kann
  zu niedrig sein“. „Daten sichern…“ lädt `eeb-sicherung-2026-10-24.json` mit
  `eeb.unlesbar.v1` herunter und setzt `eeb.sicherung.zuletzt.v1`.
- **Sprungmarke und Zoom:** Unterkante der Sprungmarke −8 px bei 360 × 640,
  320 × 568 (auch mit 200 % Schrift), 640 × 360 mit 200 %, 180 × 320, 320 × 180;
  `elementFromPoint` an der Oberkante von „Alle Themen“ liefert den Link.
  „Fortsetzen“ bei 180 × 320 bei 273 bis 317 px, 360 × 640 mit 200 % Schrift
  bei 515 bis 559 px, 320 × 568 mit 200 % bei 465 bis 509 px, quer mit 200 %
  bei 219 bis 283 px; Name „THW Ulm / Bergungsgruppe“ ohne Wortbruch; kein
  Seitenüberlauf in allen sieben Lagen.
- **Nummern-Verschiebung (R8-W1):** Rückfrage „Meldung entfernen?“ und
  Quittung nennen „Die Einheiten Nr. 3–6 rücken auf und heißen danach Nr. 2–5“.
- **Lagemonitor:** „Lagemonitor öffnen“ öffnet ein zweites Fenster
  (`?lagemonitor=s1`), 360 × 640 ohne Seitenüberlauf (360 px), alle sechs
  Einheiten in der Tabelle ohne Einheitentyp, Schrift folgt der Systemschrift;
  Seitenhöhe 659 px bei 640 px Bild (Rollen um 19 px).
- **Geräteuhr:** `zuletzt` 400 Tage in der Zukunft: „⚠ Geräteuhr prüfen: Das
  Gerät zeigt den 24.10.2026, beim letzten Start war der 28.11.2027. Die Uhr ist
  400 Tage zurückgegangen. … Bis du antwortest, löscht und anonymisiert die App
  nichts.“ mit „Uhr korrigieren“.
- **Datenschutzfrist:** Entwurf 40 Tage alt: kein Hinweis; 80 Tage: „⚠ Namen
  werden am 3.11.2026 anonymisiert (noch 10 Tage) — vorher weitergeben oder
  sichern; Bearbeiten beginnt die Frist neu.“ auf Startseite und im Bogen; 86
  Tage: „noch 4 Tage“; 100 Tage: „⚠ Datenschutzfrist abgelaufen … am 14.10.2026
  anonymisiert“, Nachname von Person 1 im Speicher „Einsatzkraft 1“.
- **Aufnahme für die Sammlung:** Kontext „Aufnahme für: Hochwasser Musterstadt“
  und Bogenfelder überleben das Neuladen; Zettelfelder nicht (R9-S1).
- **QR-Vollbild:** „Teil 1 von 7“, „Weiter zu Teil 2 →“ (Schließen darunter);
  Neuladen im Vollbild führt zur Startseite mit „Fortsetzen“ (Entwurf bleibt).

## Abgleich mit Runde 8

Grundlage: [../runde-8/stress-und-unterbrechung.md](../runde-8/stress-und-unterbrechung.md)
mit „Stand der Behebung“ in [../runde-8/README.md](../runde-8/README.md).

| Runde-8-Befund | Stand laut Tabelle | Bewertung Runde 9 | Beobachtung |
| --- | --- | --- | --- |
| R8-S1 Sprungmarke ragt ins Bild (P3) | behoben (−8 px) | **hält** | Unterkante −8 px in allen gemessenen Lagen, auch 320 × 568 mit 200 % Schrift; „Alle Themen“ trifft den Link. |
| R8-S2 Kasten zum beiseitegelegten Bogen (P3) | teilweise | **teilweise, wie angekündigt** | Drei Zeilen, Weg genannt; „Neuen Bogen erstellen“ bei 360 × 640 bei 609 bis 654 px (14 px unter dem Rand), bei 320 × 568 bei 659 px. Mit zusätzlichem Sammlungs-Hinweis bei 872 px (R9-S4). |
| R8-S3 „Fortsetzen“ bei Browser-Zoom (P3) | behoben (273 px) | **hält hochkant, quer nicht** | 180 × 320: 273 bis 317 px, ohne Wortbruch. 320 × 180 (Zoom 200 % quer auf 640 px): „Fortsetzen“ bei 339 bis 383 px bei 180 px Bildhöhe, unverändert unterhalb des Bildes. |
| R8-S4 Tipp-Sperre nach dem Öffnen (P3) | teilweise (Prellschutz 450/800 ms) | **unverändert, bekannte Grenze** | Rückfrage-Knöpfe nehmen den Tipp ab 800 ms an (gemessen: 500 ms nein, 800 ms ja); bis dahin ohne Rückmeldung (R9-S2). |
| R8-D5 „Rückgängig“ unter „Abrücken“ | teilweise (2,5 s) | **hält** | Zweittipp 1 300 bis 2 000 ms ohne Wirkung, ab 2 400 ms nimmt er „Rückgängig“ an; Leiste bleibt an der Knopfstelle (bekannt). |
| R8-D1, H1, O2, E1 Rohtext-Rettung | behoben | **hält** | Rohtext in `eeb.unlesbar.v1`, überlebt Neuladen, steht in der Sicherungsdatei; Wortlaut „Daten stecken in der Datensicherung“ (R9-S4). |
| R8-G1, M2 Rückfragen bei Zoom 200 % | behoben | **hält** | Knöpfe untereinander, Dialog im Bild, in fünf Lagen gemessen. |
| R8-H2 „Nur Stärke melden?“, G6 „Eingaben verwerfen…“ | behoben | **nicht erneut geprüft** | Nicht Gegenstand dieses Laufs; „Person entfernen“ hat Fokus auf „Abbrechen“. |
| R8-N6, E4 Zwei-Fenster-Rückfrage mit Werten | behoben | **hält** | Felder, Werte dort/hier, Personen mit Namen. |
| R8-E2, E5, D6 Eingabe bleibt, „Rückgängig“ genannt | behoben | **hält** | „Rückgängig“ nach „Person entfernen“ überlebt Neuladen; bei „Meldung entfernen“ nicht (R9-S3). |
| R8-D2, W1 Nummern verschieben sich | behoben | **hält** | Rückfrage und Quittung nennen alle Verschiebungen. |
| R8-D3 Entwurfsanonymisierung angekündigt | behoben | **hält** | 14-Tage-Hinweis ab 80 Tagen, Hinweis nach Ablauf bei 100 Tagen. |
| R8-L1, K1, N1, H3, M4 Lagemonitor (Messung, Telefon) | behoben | **hält (Stichprobe)** | Sechs Einheiten in der Tabelle, kein Einheitentyp unter 640 px; gehört den Führungsprüfern. |
| R8-G2, M3 Fußleiste bei 180 px, D4 Entwurfskarte | behoben | **hält** | „Fortsetzen“ im ersten Bild; Leiste mit „←“, „◐“ und „Weiter →“ sichtbar bei 180 × 320. |
| Rückfrage-Umbruch quer (G5, M8) | behoben | **hält** | Beide Knöpfe quer in einer Reihe bei 225 bis 269 px. |
| Späte Rückkehr eines eigenen `history.back()` | behoben | **hält** | Zurück-Kette bleibt in der App, Dialog schließt vor dem Verlassen. |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung | bekannte Grenze | **nicht erneut geprüft** | Stand unverändert laut Runde 8. |
| R7-G4/M8 Ecken-Knopf hochkant | bekannte Grenze | **unverändert** | Fester Balken „◐ Ansicht: Standard“ liegt über dem Ende der Einsatzansicht. |
| R7-G8/H9 Geräteuhr-Warnung bei 200 % und 320 × 568 | bekannte Grenze | **nicht erneut gemessen** | Warnung bei 360 × 640 im oberen Teil der Seite. |
| R7-N1 kein Zusammenführen-Tipp | bekannte Grenze | **nicht geprüft** | Nicht Gegenstand dieser Rolle. |
| R7-N9 Ziffern der Schrittleiste | bekannte Grenze | **unverändert** | Schrittleiste „1 offen“, „2 ✓“ … ohne Ziffernwörter. |
| R8-A1 Sollstärke zählt mit | bekannte Grenze | **nicht erneut geprüft** | Nicht Gegenstand dieser Rolle. |
| R8-M6 klebende Namensspalte | bekannte Grenze | **nicht erneut geprüft** | Nicht Gegenstand dieser Rolle. |

Bilanz: Alle vier Runde-8-Befunde dieses Berichts stehen wie angekündigt
(R8-S1 und R8-S3 hochkant behoben, R8-S2 und R8-S4 teilweise); ich habe keine
Nebenwirkung an Verlauf, Dialogen, Zwei-Fenster-Abgleich, Geräteuhr oder
Quittungsleiste gefunden. Neu sind R9-S1 (P2) sowie R9-S2 bis R9-S4 (P3):
0 / 0 / 1 / 3 für P0 / P1 / P2 / P3.

## Abschluss

- **Aufgabe geschafft:** ja.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Entwurf wiederhergestellt“ in der manuellen
  Aufnahme heißt nicht, dass Eintreffzeit, Nr. und Zug vom Zettel noch da sind
  (R9-S1).
- **Größtes Einsatzrisiko:** Eine unterbrochene manuelle Aufnahme wird nach dem
  Neuladen mit der Uhrzeit und der Nummer der App statt der vom Zettel
  übernommen (R9-S1).
- **Top-Priorität für die nächste Iteration:** Die drei Zettelfelder der
  manuellen Aufnahme mit dem Entwurf aufbewahren oder ihr Fehlen nennen
  (R9-S1).
