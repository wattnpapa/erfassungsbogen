# Audit „Arbeitsablauf", Runde 8 (Einheit → Meldekopf → zweites Gerät → Stab, dazu Papier)

Stand: 24.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Code-Stand Commit `3fee6e5` (Zweig `main`).

Reiner Prüfbericht, keine Codeänderung. Der Build wurde weder neu gebaut noch
wurde der Server angefasst. Wiederholung nach der Behebung der Runde-7-Befunde
R7-W1 bis R7-W5 und der übrigen Runde-7-Änderungen, soweit sie den Arbeitsablauf
berühren: Lagemonitor (Tabelle im Bild, „+ n weitere", Bewegungen, Zukunftszeiten,
Telefonansicht), Zwei-Fenster-Leiste und Rückfragen (rollender Rumpf, fester
Fuß, Unterschiedstexte), Geräteuhr-Halt und Hinweis im Assistenten,
Beiseitelegen unlesbarer Daten, Papier-Abgleich mit Sitzungsspeicher,
„Nur Stärke"-Rückfrage, Zug-Normalisierung, Umschlagfeld „lage", Sortierung nach
Nr., Kurz-Liste ab acht Personen und der Verlauf. Der Abgleich bezieht sich auf
[Runde 7](../runde-7/arbeitsablauf.md) samt „Stand der Behebung".

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`,
`--no-sandbox`), `isMobile`/`hasTouch`, Locale de-DE. Grundeinstellung Telefon
360 × 640; zusätzlich 320 × 568, 640 × 360 quer, Zoom nachgestellt (Zoom 1,5)
und `html { font-size: 200% }`; für den Fernseher ein Fenster mit 1920 × 1080.
Jeder Lauf hatte einen eigenen Browser-Kontext; elf weitere Prüfer nutzten den
Server gleichzeitig. Die Geräteuhr der Testumgebung stand auf dem 23.10.2026;
alle Seeds tragen `uebung: false`, Stand auf die Minute des Laufs, Einsatzzeitraum
auf den Prüftag. Zeiten habe ich nicht gemessen, Maße, Zählungen und Dateiinhalte
sind davon unberührt. Die Tipp-Sperre (1,5 s an derselben Stelle) habe ich in
den Skripten eingehalten; ein Tipp früher wirkte nicht und zeigt „Einen Moment …"
(bekannt, siehe Verweise).

- **A-Gerät (Einheit):** leerer Kontext, „Neuen Bogen erstellen" über Schritt 1
  bis 3 (OV, „Bergungsgruppe", Ort, „Namen einfügen…"), Schritt 4 und 5
  gelesen; dazu Entwürfe aus `examples/thw/` (`001`, `003`, `018`, `042`,
  `grossbogen-verstaerkter-bergungszug`). Übergabe über „Bogen übergeben… →
  Weitere Formate → Link teilen" (`navigator.share` abgefangen, Host auf
  `localhost:4173` umgeschrieben), „PDF erzeugen" (Download gespeichert) und
  „QR-Code im Vollbild zeigen".
- **M1 (Meldekopf):** Sammlung „Hochwasser Musterstadt" mit sechs Einheiten
  (`001`, `003`, `009`, `013`, `016`, `052`) als Seed in `eeb.einsaetze.v1`,
  bei 30 Einheiten zusätzlich der Lagemonitor. Nachmeldung per Kaltstart-Link
  (erst `about:blank`, dann der Link) mit neuerem und älterem Stand, mit
  getauschtem Namen und 20 l Diesel mehr; Einlesen von PDF und Link;
  Übungsbogen mit anderem Ort; Zug, Auftrag, Abrücken, Lageblatt; „Einheit
  schnell erfassen (nur Stärke)…".
- **M2 (zweites Gerät):** frischer Kontext, „Einsatz importieren…" mit der
  Sammel-PDF von M1 (mit Zug „2. Zug", Auftrag, Abrückvermerk).
- **Zwei Fenster:** derselbe Bogen in zwei Tabs (Ort in A geändert); dieselbe
  Sammlung in zwei Tabs mit je einem eigenen PDF-Import.
- **Papier:** vier Einträge mit `vomPapier`, „Lage vom Papier abgleichen…" mit
  doppelter Nummer, mit einer Nummer, die ein vorhandener Eintrag trägt, und mit
  Zug und Zeit.
- **Geräteuhr:** Uhr per `page.clock` auf den 03.02.2025, `eeb.uhr.v1` auf
  jetzt; drei Lesungen, Assistent, Übersicht, „Bogen übergeben".
- **Beschädigte Daten:** abgeschnittener Text in `eeb.einsaetze.v1` und
  `eeb.entwurf.v1`.

Reihenfolge: Ich habe zuerst blind getestet (Startseite, Einheit von vorn,
Übersicht, Einsatzansicht, Aufklappen, Zug, Abrücken, Schnellerfassung bis zur
Übernahme) und erst danach den Runde-7-Bericht und „Stand der Behebung" gelesen.
Die Überschriften der parallel entstandenen Runde-8-Berichte habe ich erst nach
allen Messungen gelesen, um Doppelungen als Verweis zu kennzeichnen. Skripte und
Bilder: `scratchpad/runde8/w/`.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit füllt ihren Bogen aus und übergibt ihn; **Annahme:** der Link
   kommt per Chat oder als PDF, der QR-Code wird vom Display gescannt.
2. Der Meldekopf nimmt auf, entscheidet bei einer Nachmeldung über die
   Fassung, vergibt Zug und Auftrag, lässt abrücken und zeigt die Lage am
   Fernseher.
3. Fällt das Gerät aus oder löst ein zweites ab, geht die Lage als Sammel-PDF
   weiter; **Annahme:** der Stab bekommt erst alles, dann nur das Neue.
4. Bleibt nur das gedruckte Lageblatt, liest ein Gerät es ein und gleicht vom
   Papier ab.

**Nicht prüfbar:** Kamera-Scan (QR nur über Link, PDF und die Vollbildanzeige
selbst), echtes Drucken, Handscanner, Nahbereichs-Weitergabe, natives
Share-Sheet, Darstellung der Excel-Datei in Excel, WebKit, native Builds,
ein Uhrversatz zwischen zwei Geräten (alle Kontexte teilen die Systemuhr).
Das Datumsfeld zeigt hier das US-Format (Browsersprache der Testumgebung),
kein Befund.

## Urteil

Der Arbeitsablauf trägt und ist gegenüber Runde 7 an den beanstandeten Stellen
besser geworden. Die Rückfrage bei der Nachmeldung zeigt in allen geprüften
Darstellungen die Wahl nicht mehr hinter „Abbrechen" (R7-W1), nennt jetzt
„Personal: 1 getauscht · Diesel 80 l → 100 l" statt „3 Änderungen" (R7-W3) und
schreibt „als" statt „wie". Der Hinweis „Geräteuhr nicht bestätigt" steht im
Assistenten und im Dialog „Bogen übergeben" (R7-W2), die Leiste der zwei
Fenster nennt das Feld (R7-W5), und der Lagemonitor führt „Eingetroffen: …
gerade eben" (R7-W4). Die Übergabe von Gerät zu Gerät über die Sammel-PDF nimmt
Zug, Auftrag und Abrückvermerk mit, zwei Tabs derselben Sammlung verlieren beim
gleichzeitigen Einlesen nichts.

Reibung bleibt an wenigen Stellen, alle klein. Der Papier-Abgleich verschiebt
die Nummern einer digital geführten Einheit, ohne sie in der Rückfrage zu
nennen (R8-W1). Wer eine ältere Fassung „nur in die Historie" legt, sieht an
der Karte „neue Fassung" und in der Quittung eine Folgemeldung, als hätte sich
die Lage geändert (R8-W2). Der Dialog „In Einsatz-Sammlung ablegen…" verspricht,
der Bogen bleibe „hier" geöffnet, springt aber in die Sammlung (R8-W3). Die
Warnung zu leeren Personenkarten steht oben, der Knopf zum Entfernen rund
2 950 px weiter unten (R8-W4).

Die Einzelaufgaben schafft man ohne fremde Hilfe. Ein P0 oder P1 habe ich nicht
gefunden.

## Befunde

### R8-W1 [P2] Papier-Abgleich: Eine „Nr. laut Blatt" verschiebt die Nummer einer digital geführten Einheit, die Rückfrage nennt sie nicht (neu, verwandt mit R8-D2)

**Priorität:** P2

**Kennzeichnung:** beobachtet (Kartenliste vor und nach „Abgleich übernehmen",
zweimal wiederholt). Dass ein Ersatzgerät vor dem Abgleich schon eigene Einheiten
geführt hat, ist **Annahme**; der Fall folgt aus dem Ablauf „Gerät fällt aus, ein
zweites läuft an, das Papier kommt nach".

**Fundstelle / Aufgabe:** Einsatzansicht → „Lage vom Papier abgleichen…" (vier
Einheiten vom Papier, zwei Einheiten schon digital geführt) → „Nr. laut Blatt"
einer Einheit eintragen → „Abgleich übernehmen". Code: Nummernvergabe in
`src/app/einheiten-tabelle.ts` (`meldungsNummern`), Dialog in
`src/app/papier-abgleich-ui.tsx`.

**Beobachtung:**
- Vorher: Nr. 1 Hamburg Mitte, 2 Bamberg, 3 Ulm, 4 Oberhausen-Rheinhausen,
  5 Crailsheim, 6 Albstadt. Im Abgleich nur bei Albstadt „Nr. laut Blatt" = 2
  eingetragen, Zug „1.ZUG" und Eintreffzeit; Ulm, Oberhausen und Crailsheim
  ohne Nummer.
- Nachher: 1 Hamburg Mitte, **2 Albstadt**, **3 Bamberg**, 4 Ulm, 5
  Oberhausen-Rheinhausen, 6 Crailsheim. Vier Einheiten tragen eine andere
  Nummer als vorher, darunter Bamberg, die gar nicht Teil des Abgleichs war.
- Die Rückfrage „Abgleich übernommen – zwei Hinweise" nennt nur drei Einheiten
  („stand keine „Nr. laut Blatt" im Abgleich … Ihre Nummern vergibt die App neu,
  sie können von denen auf dem alten Lageblatt abweichen"), nämlich Crailsheim,
  Oberhausen-Rheinhausen und Ulm. Bamberg steht nirgends; dass Bamberg jetzt 3
  heißt, sagt weder die Rückfrage noch eine Quittung.
- Die Prüfung auf doppelte Nummern greift nur innerhalb der Eingaben: „Nr. 2"
  bei zwei Einheiten im Abgleich ergab „Abgleich unvollständig … Nichts
  übernommen" mit beiden Namen. Eine Nummer, die eine nicht beteiligte Einheit
  schon trägt, löst nichts aus.
- Zug „1.ZUG" und „1. zug" wurden zu einem Zug „1. ZUG" zusammengeführt (beide
  Karten zeigen „1. ZUG"; die zuerst eingegebene Schreibweise gilt, siehe R8-N5
  zu „Zug 1").

**Erwartung der Rolle:** Die Nummer steht am Funk („Nr. 3 rückt ab") und auf dem
Lageblatt. Wenn der Abgleich Nummern verschiebt, sagt die Rückfrage vor oder
nach der Übernahme, welche Einheiten jetzt anders heißen, auch die nicht
beteiligten.

**Folge:** Das Ersatzgerät hat vor dem Abgleich eigene Nummern vergeben, das
Papier trägt andere. Nach dem Abgleich gelten für Bamberg Nr. 2 (am Funk
gesagt, auf dem Blatt vom Ersatzgerät) und Nr. 3 (Display) nebeneinander. „Nr. 3
abrücken" trifft am Display eine andere Einheit als auf dem alten Blatt. Es geht
nichts verloren, die Karte nennt den Namen; die Verwechslung setzt Papier oder
Funkverkehr mit Nummern voraus, deshalb P2.

**Empfehlung:** Die Rückfrage nennt alle Einheiten, deren Nummer sich ändert
(„Bamberg 2 → 3, Ulm 3 → 4 …"), nicht nur die ohne Eingabe; „Lageblatt neu
drucken" steht dann für alle. Eine Nummer, die eine nicht beteiligte Einheit
trägt, wird vor der Übernahme genannt.

**Nachprüfung:** Sammlung mit sechs Einheiten, zwei davon vom Papier; bei einer
„Nr. laut Blatt" eintragen, die eine andere Einheit trägt: Die Rückfrage muss
alle Einheiten mit alter und neuer Nummer nennen.

### R8-W2 [P3] „Nur in die Historie legen" bei älterem Stand: Karte und Quittung lesen sich wie eine Änderung der Lage

**Priorität:** P3

**Kennzeichnung:** beobachtet (zweimal, Link mit Stand 30 Minuten vor der
bisherigen Meldung und 20 l Diesel mehr). Ob der Meldekopf dadurch eine falsche
Entscheidung trifft, ist **Risiko**.

**Fundstelle / Aufgabe:** Nachmeldung einer schon gemeldeten Einheit mit
älterem Stand per Link, im Dialog „Einheit ist bereits gemeldet" „Nur in die
Historie legen" („Die bisherige Meldung gilt weiter."). Code: Quittung und
Karte in `src/app/app.tsx` und `src/app/einheiten-tabelle.ts`
(`folgeKurztext`).

**Beobachtung:**
- Die Statuszeile sagt richtig: „Meldung … aufgenommen (nur in die Historie
  gelegt — die bisherige Fassung (23.10.2026, 21:36) gilt weiter)."
- Daneben steht in der Karte „Zuletzt eingelesen: … — **Folgemeldung: Diesel
  100 l → 80 l · 2 weitere Änderungen** · jetzt 6 Einheiten, Gesamt 59", die
  Karte trägt die Marken „**neue Fassung**" und „**Folgem. 21:35**", und im
  aufgeklappten Teil steht „Folgemeldung 23.10.2026, 21:35 (vorher Stand
  21:06): Diesel 100 l → 80 l". Aktiv bleibt Diesel 80 l, die Summe
  („Diesel 745 l") und „Gesamt 59" ändern sich nicht.
- Zum Vergleich der Fall „Als neue Fassung anhängen" (neuerer Stand): „Folgemeldung:
  Diesel 80 l → 100 l · 2 weitere Änderungen", Karte „neue Fassung", „Diesel
  100 l", Summe 765 l. Die Quittungszeile hat in beiden Fällen dieselbe Form; der
  Unterschied liegt nur in der Richtung des Pfeils.

**Erwartung der Rolle:** Wer „die bisherige Meldung gilt weiter" gewählt hat,
sieht an der Karte keine „neue Fassung" und liest in der Quittung nicht
„Folgemeldung: 100 → 80", sondern „ältere Fassung in der Historie abgelegt, Lage
unverändert".

**Folge:** Gering. Wer die Karte zwei Minuten später ansieht und „neue Fassung ·
Folgem. 21:35" liest, hält die Meldung für eingearbeitet; dass die ältere
Fassung nur in der Historie liegt, steht nur in der inzwischen weggerollten
Statuszeile.

**Empfehlung:** Bei „nur in die Historie" eine eigene Marke („ältere Fassung in
Historie") statt „neue Fassung", und die Quittungszeile mit demselben Wortlaut
wie die Statuszeile („Lage unverändert").

**Nachprüfung:** Link mit älterem Stand aufnehmen, „Nur in die Historie legen":
Die Karte trägt keine Marke „neue Fassung"; die Quittung sagt, dass die Lage
unverändert ist.

### R8-W3 [P3] „In Einsatz-Sammlung ablegen…": Der Dialog sagt, der Bogen bleibe „hier" geöffnet, danach steht die Sammlung im Bild

**Priorität:** P3

**Kennzeichnung:** beobachtet (zweimal, Zugführer mit eigenem Bogen und
Sammlung auf demselben Gerät)

**Fundstelle / Aufgabe:** Assistent, Schritt 6 „Übersicht" → „In
Einsatz-Sammlung ablegen…" → „Hochwasser Musterstadt". Code: `src/app/app.tsx`.

**Beobachtung:**
- Dialogtext: „Dein Bogen wird als Meldung abgelegt und **bleibt hier
  geöffnet**. Das bleibt auf diesem Gerät — an den Meldekopf geht er über
  „Bogen übergeben…"."
- Nach dem Tipp auf die Sammlung steht die Einsatzansicht im Bild („7 Einheiten,
  Gesamt 74 · Zuletzt eingelesen: „THW Erlangen …""). Der Bogen ist nicht mehr
  im Bild. Erst das Browser-Zurück bringt ihn wieder, mit der Zeile „Meldung von
  … aufgenommen. Dein Bogen bleibt geöffnet — Startseite → „Fortsetzen"."
- „Hier" und „Startseite → Fortsetzen" meinen dasselbe Ding (der Bogen ist nicht
  geschlossen), sagen aber Gegensätzliches über den Ort.

**Erwartung der Rolle:** Entweder bleibt der Bogen im Bild, oder der Dialog sagt
„danach steht die Sammlung im Bild, dein Bogen bleibt unter „Fortsetzen"".

**Folge:** Gering. Wer den Dialog gelesen hat, sucht den Bogen im Bild, hält die
Ablage für fehlgeschlagen oder tippt „Ablegen" ein zweites Mal (dann fragt die
App nach der Fassung).

**Empfehlung:** Den Satz an das Verhalten anpassen („Danach öffnet die Sammlung;
dein Bogen bleibt unter „Fortsetzen" auf der Startseite").

**Nachprüfung:** Bogen ablegen: Dialogtext und Bild danach passen zusammen.

### R8-W4 [P3] Leere Sollplätze: Die Warnung steht oben, „Vorbelegung entfernen" liegt rund 2 950 px tiefer

**Priorität:** P3

**Kennzeichnung:** gemessen (360 × 640, Bergungsgruppe mit Vorbelegung, fünf
Namen über „Namen einfügen…" übernommen)

**Fundstelle / Aufgabe:** Schritt 3 „Personal" einer Einheit, die weniger
Personen hat als das Soll. Code: `src/app/schritte/personal.tsx` (Warnung zu
Personenkarten ohne Angaben, „Vorbelegung entfernen").

**Beobachtung:**
- Nach den fünf Namen steht oben „⚠ 4 Personenkarten ohne Angaben zählen in die
  Stärke — ausfüllen oder entfernen." bei y = 139 px; die Stärke zeigt 0 / 2 / 7 /
  9 statt fünf Personen. Die Quittung „5 Namen übernommen — 5 davon in freie
  Sollplätze. Rückgängig" nennt die vier leeren Plätze nicht.
- Der Knopf „Vorbelegung entfernen (4 Personen ohne Namen)" liegt bei y = 3 091
  px, die Seite ist 3 623 px hoch. Das sind rund fünf Bildschirme. Jede Person
  nimmt in der Kurz-Liste etwa 290 px ein.
- Das Entfernen einzelner Karten über „✕" wirkt ohne Rückfrage; vier Karten
  heißen vier Tipps an wandernden Stellen.

**Erwartung der Rolle:** Die Warnung führt zum Knopf, oder der Knopf steht an
der Warnung. Wer fünf Leute meldet, will vier Sollplätze mit einem Tipp
loswerden.

**Folge:** Gering. Die Stärke bleibt mit 9 gemeldet, wenn die Warnung überlesen
wird; die Einheit meldet dem Meldekopf vier Personen zu viel. Die Warnung ist
vorhanden, der Weg zur Behebung ist lang.

**Empfehlung:** Die Warnzeile trägt den Knopf „4 leere Plätze entfernen" selbst,
oder die Quittung nach „Namen einfügen…" bietet ihn an.

**Nachprüfung:** Fünf Namen einfügen: Warnung oder Quittung enthalten einen Weg
zum Entfernen im ersten Bild.

### R8-W5 [P3] Wer Meldekopf und Einheit zugleich ist: Nach dem Neuladen steht die Sammlung im Bild, vom offenen eigenen Bogen steht dort nichts

**Priorität:** P3

**Kennzeichnung:** beobachtet (Entwurf und Sammlung im Speicher, Sammlung
geöffnet, Neuladen); die Frist von zwölf Stunden steht im Code
(`LETZTER_EINSATZ_FRIST_MS`), die Entscheidung dahinter ist bewusst („dort
weitermachen, wo es war").

**Fundstelle / Aufgabe:** Zugführer mit eigenem, noch offenem Bogen und einer
Sammlung; das Gerät lädt neu (Akku, Browserneustart, Neuladen). Code:
`src/app/app.tsx` (`letztenEinsatzLaden`).

**Beobachtung:** Nach dem Neuladen und in einem neuen Tab steht die zuletzt
geöffnete Sammlung im Bild, kein Hinweis auf den offenen Entwurf („Entwurf",
„Fortsetzen", Name der eigenen Einheit kommen im Text nicht vor). Der Entwurf
liegt hinter „‹ Startseite" unter „Fortsetzen". Der Rückweg ist da; die Sammlung
ersetzt nur das Bild, in dem die Startseite den Entwurf gezeigt hätte.

**Erwartung der Rolle:** Wer beides führt, sieht in der Sammlung einen Hinweis
(„Dein eigener Bogen ist noch offen — Fortsetzen"), solange die Sammlung für ihn
der Einstieg ist.

**Folge:** Gering. Der halbfertige eigene Bogen wird erst gemeldet, wenn jemand
daran denkt; die Meldung der eigenen Einheit an die Führung (Annahme: ein Zugtrupp
meldet sich selbst) bleibt liegen.

**Empfehlung:** Eine Zeile unter dem Kopf der Sammlung, solange ein Entwurf
offen ist.

**Nachprüfung:** Entwurf und Sammlung anlegen, Sammlung öffnen, neu laden: Die
Sammlung zeigt einen Hinweis auf den Entwurf.

### R8-W6 [P3] „✓ Lageblatt erzeugt …" bleibt stehen, nachdem „Abrücken" das Blatt veraltet hat

**Priorität:** P3

**Kennzeichnung:** beobachtet (einmal)

**Fundstelle / Aufgabe:** Einsatzansicht → „Lageblatt (A4 quer)" → danach eine
Einheit abrücken. Code: Quittung unter „Einsatz weitergeben / sichern".

**Beobachtung:** Direkt nach dem Erzeugen: „✓ Lageblatt erzeugt (A4 quer) — liegt
im Download-Ordner …" und „Lageblatt erstellt 23.10.2026, 21:50 · seitdem keine
neue Meldung". Nach „Abrücken" einer Einheit: Die Zeile „Lageblatt erstellt … ·
seitdem 1 Änderung (Abrücken) — Aushang ist nicht mehr aktuell, neu drucken" ist
richtig, aber das grüne „✓ Lageblatt erzeugt (A4 quer) …" steht unverändert
darüber. Auf der Startseite lautet die Zeile „Lageblatt 23.10.2026, 21:50
(seitdem 1 Änderung (Abrücken))" ohne die Aufforderung.

**Erwartung der Rolle:** Das Häkchen über einem veralteten Blatt verschwindet
oder wird abgeschwächt; die Aufforderung „neu drucken" steht auf der Startseite
wie in der Einsatzansicht.

**Folge:** Gering. Beide Zeilen stehen untereinander, die richtige ist die
untere.

**Empfehlung:** Die Quittung nach der ersten Änderung ausblenden; die Aufforderung
auch auf der Startseite.

**Nachprüfung:** Lageblatt erzeugen, abrücken: kein „✓ Lageblatt erzeugt" mehr
über der Warnung.

## Verweise auf andere Berichte

Befunde, die ich selbst gemessen oder beobachtet habe und die ein anderer
Runde-8-Bericht schon führt; sie stehen hier nur als Verweis.

- **Abgeschnittener Text der Sammlungen wird still zu `[]`** (R8-D1 in
  `zerstoerende-handlungen.md`, R8-H1 in `feldtauglichkeit.md`): Auch ich habe
  `eeb.einsaetze.v1` auf 300 Zeichen gekürzt und auf ein Objekt statt einer
  Liste gesetzt; beide Male stand nach dem Start „[]" im Speicher, ohne
  Hinweis und ohne `eeb.unlesbar.v1`. Der beschädigte Entwurf dagegen wird
  mit Hinweis beiseitegelegt (`eeb.entwurf.beschaedigt.v1`).
- **Nummern rücken nach** (R8-D2): gleiche Ursache wie R8-W1, anderer Weg
  (Entfernen statt Abgleich).
- **Lagemonitor am Telefon, Spalten F / U / M außerhalb des Bildes** (R8-K1,
  R8-M4, R8-H3, R8-N1): bei 360 und 320 px gemessen, Tabelle 448 px breit,
  „F" bei x = 380 bis 404, innerer Rollrand `lm-tabelle`.
- **Lagemonitor am Fernseher, Restplatz unter „+ n weitere"** (R8-L1, R8-K5,
  R8-N2): bei 30 Einheiten und 1920 × 1080 vier Zeilen („Weiden", „Starnberg",
  „Schwabach", „Regen") und „+ 26 weitere Einheiten", darunter rund 85 px frei,
  Platz für zwei weitere Zeilen von je 43 px.
- **Rückfragen bei 200 % Schrift** (R8-G1, R8-M2): Rückfrage der Nachmeldung
  bei älterem Stand: Rumpf 158 px von 1 185 px bei 640 × 360, 462 von 2 176 px bei
  360 × 640, 390 von 2 479 px bei 320 × 568; ohne Vergrößerung 226 von 462 px
  quer, 518 von 592 px hochkant.
- **Tipp-Sperre nach dem Öffnen eines Dialogs** (R8-S4, R8-H5): Ein Tipp auf
  „Für „Hochwasser Musterstadt" erfassen" 0,8 s nach dem Öffnen von „Einheit
  schnell erfassen" wirkte nicht („Einen Moment …"), ab 1,5 s ja.
- **Zug-Schreibweise** (R8-N5): „Zug 1" und „1. Zug" blieben zwei Züge, „1.zug"
  wurde zu „1. Zug".
- **Geräteuhr-Hinweis** (`feldtauglichkeit.md`, `stress-und-unterbrechung.md`,
  `offline-und-speicher.md`): Wortlaut und Ort bestätigt, siehe „Bestätigtes".

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Von der Startseite bis zur Übergabe:** Neuer Bogen mit Vorbelegung („9
  Personen, 2 Fahrzeuge nach StAN", „Vorbelegung entfernen"), „Namen einfügen…"
  mit Vorschau „→ Platz 1: GrFü" und „5 Personen übernehmen" (die Vorschau zeigt
  bei „Fuchs Hannes" die Lesart „Hannes, Fuchs", sodass der Dreher sichtbar
  ist), Übersicht mit „offene Punkte … antippen zum Beheben", „Übergeben ist
  trotzdem möglich". „PDF gespeichert: eeb-…pdf — liegt im Download-Ordner des
  Browsers", danach „PDF erzeugt 21:40 Uhr — Empfang nicht bestätigt" mit
  „Gegenstelle hat ihn — als übergeben vermerken".
- **Rückfrage bei der Nachmeldung (R7-W1, R7-W3):** Telefon 360 × 640: Dialog
  16 bis 624 px, „Als neue Fassung anhängen" 350 bis 394, „Als eigene Einheit
  führen" 471 bis 515, „Abbrechen" 563 bis 607 px; der Rumpf rollt, der Fuß
  bleibt. Mit „Geändert: Personal: 1 getauscht · Diesel 80 l → 100 l" und
  Erklärsätzen unter jeder Wahl. Bei älterem Stand zusätzlich „Nur in die
  Historie legen", „Der Bogen trägt einen älteren Stand (…) als die bisherige
  Meldung (…) — er gilt trotzdem". 320 × 568 und 640 × 360: alle Wahlen im
  rollbaren Rumpf, „Abbrechen" im festen Fuß, nichts liegt unter „Abbrechen".
- **Quittung bei „Als neue Fassung anhängen":** „Folgemeldung: Diesel 80 l → 100 l
  · 2 weitere Änderungen", Karte „neue Fassung · Folgem. 21:36", „Historie (2)",
  Summe aktualisiert (Diesel 745 l → 765 l).
- **Geräteuhr (R7-D2, R7-W2):** Drei Lesungen hintereinander zeigen „⚠ Geräteuhr
  prüfen: … Die Uhr ist 628 Tage zurückgegangen … Bis du antwortest, löscht und
  anonymisiert die App nichts." mit „Geräteuhr stimmt" und „Uhr korrigieren";
  `eeb.uhr.v1` bleibt mit `sprung`. Im Assistenten (alle sechs Schritte, nicht
  klebend) und im Dialog „Bogen übergeben" steht „⚠ Geräteuhr nicht bestätigt: …
  Datum und Stand dieses Bogens stimmen vielleicht nicht. Antworten kannst du auf
  der Startseite unter „Geräteuhr prüfen"; der Bogen bleibt dabei gespeichert."
  Höhe 139 px bei 320 × 568, 83 px quer, 177 px bei 200 % und 320 × 568. Der Hinweis
  trägt keinen Knopf; wer antworten will, verlässt den Assistenten über „‹
  Startseite" (Weg ist genannt, deshalb kein eigener Befund).
- **Zwei-Fenster-Leiste (R7-W5):** „⚠ Hier wird nichts gespeichert. Das andere
  Fenster hat den Bogen geändert: Ort / Auftrag." mit „Anderen Stand laden",
  „Meine Fassung behalten" und „Genauer", rund 100 px (16 %) hoch bei 360 × 640.
- **Lagemonitor (R7-W4, R7-K1, R7-K2):** „Eingetroffen: THW Erlangen Fachgruppe
  Ölschaden (B) gerade eben" erscheint binnen sechs Sekunden nach der Aufnahme,
  „+ 4 weitere Bewegungen" statt stiller Kürzung, „7 Einheiten · 26 Fahrzeuge",
  „letzte Meldung gerade eben", keine Personennamen; bei 30 Einheiten „+ 26
  weitere Einheiten".
- **Gerät-zu-Gerät (Sammel-PDF):** „Einsatz „Hochwasser Musterstadt" übernommen: 6
  Einheiten, davon 5 anwesend. Stand der Datei: letzte Meldung …"; Zug „2. Zug",
  „Auftrag: Deich Nord ab 14:00" und „ABGERÜCKT" kommen mit (Umschlagfeld
  „lage"), die Nummern bleiben 1 bis 6. Die Quittung „Weitergegeben ist sie erst,
  wenn sie bei der Ablösung oder im Archiv angekommen ist" sagt, was die App
  nicht wissen kann.
- **Einlesen:** PDF einer Einheit: „1 Bogen aufgenommen. Neu seit der letzten
  Kenntnisnahme (1): THW Erlangen … — neu gemeldet"; dieselbe Datei nochmals: „0
  Bögen aufgenommen, 1 bereits vorhanden." Übungsbogen: „Stärke … · ÜBUNG. Wohin
  damit?", danach „1 Übungsmeldung nicht gezählt — anzeigen".
- **Zwei Tabs derselben Sammlung:** A liest Erlangen ein, B Hannover; beide Tabs
  zeigen „8 gemeldet · 8 zählend", der Speicher trägt alle acht Einheiten, nichts
  wurde überschrieben.
- **Lageblatt-Stand:** „Lageblatt erstellt 21:50 · seitdem keine neue Meldung",
  nach „Abrücken" „seitdem 1 Änderung (Abrücken) — Aushang ist nicht mehr
  aktuell, neu drucken" (Rest siehe R8-W6).
- **Schnellerfassung:** „Einheit schnell erfassen — für welche Sammlung?", danach
  verkürzter Assistent (Schritt 2 entfällt), „In Einsatz übernehmen" in jedem
  Schritt, Übernahme mit „Zuletzt eingelesen: „THW Mustertal Bergungsgruppe" ·
  jetzt 7 Einheiten, Gesamt 65".
- **„Nur Stärke" am eigenen Bogen:** Rückfrage „Nur die Stärke melden? 12 erfasste
  Personen zählen dann nicht mehr einzeln … Die Namen bleiben als
  Erreichbarkeiten erhalten." mit „Nur Stärke melden" und „Abbrechen".
- **Papier-Abgleich (R7-S1):** Doppelte Nummern mit beiden Namen abgewiesen
  („Nr. 2 steht bei … und …. Nichts übernommen."), Sitzungsspeicher hält die
  Eingaben bei „Später"; Rückfrage nennt fehlende Eintreffzeiten und Nummern
  mit Namen und dem Hinweis „neues Lageblatt drucken und das alte abnehmen"
  (Grenze siehe R8-W1).
- **Beiseitegelegter Entwurf (R7-E1):** „Ein gespeicherter Bogen ließ sich nicht
  öffnen … beiseitegelegt — als Datei sichern" mit „Als Datei sichern" und
  „Entfernen…", Löschtermin genannt (zum Wortlaut R8-H4, R8-S2).
- **„Für neuen Einsatz vorbereiten":** erscheint im Dialog „Bogen übergeben", wenn
  der Zeitraum vorbei ist („Dieser Bogen gehört zum Einsatz 16.07.2026 –
  17.07.2026 — gilt er noch?"), mit „Zeitraum heute, Ort/Auftrag und Sofortbedarf
  leer — Personal und Fahrzeuge bleiben."
- **Verlauf:** Browser-Zurück läuft rückwärts über die Assistentenschritte
  (Schritt 5 → 3 → Übersicht → Startseite); „Schließen" des Dialogs „Bogen
  übergeben", unmittelbar (0, 150, 400 und 1 700 ms) gefolgt von Zurück, führt
  jedes Mal auf dieselbe Seite, nie zu weit (R7-Änderung „späte Rückkehr eines
  eigenen back()").
- **Einsatz löschen:** „… wandert in den Papierkorb und lässt sich dort 30 Tage
  lang zurückholen." mit „In den Papierkorb" und „Abbrechen".

## Abgleich mit Runde 7

Geprüft gegen `runde-7/arbeitsablauf.md` samt „Stand der Behebung".

| Befund Runde 7 | Stand in Runde 8 | Beleg |
| --- | --- | --- |
| R7-W1 Rückfrage „Einheit ist bereits gemeldet" überdeckt Wahl (P2) | **hält** (Rest bei 200 %: kurzer Rumpf, Verweis R8-G1, R8-M2) | Fünf Darstellungen gemessen: Wahl im rollbaren Rumpf, „Abbrechen" im festen Fuß, nichts überdeckt; Fokus auf dem Rumpf. Bei 200 % quer 158 von 1 185 px im Rumpf, drei bis sechs Rollschritte bis zur dritten Wahl. |
| R7-W2 Geräteuhr-Rückfrage nur auf der Startseite (P2) | **hält** | Hinweis im Assistenten (alle Schritte) und im Dialog „Bogen übergeben"; Halt auch bei der dritten Lesung. |
| R7-W3 „Geändert: 3 Änderungen" statt Nennung (P3) | **hält** | „Personal: 1 getauscht · Diesel 80 l → 100 l"; „als" statt „wie". |
| R7-W4 Lagemonitor ohne „Eingetroffen" (P3) | **hält** | „Eingetroffen: THW Erlangen … gerade eben", „+ n weitere Bewegungen". |
| R7-W5 Warnleiste „dort"/„hier" gleichlautend (P3) | **hält** | „Das andere Fenster hat den Bogen geändert: Ort / Auftrag." |
| R6-O9 Uhrstand in der Zukunft, frische Sammlung (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 7 vermerkt. |
| R7-G4 / M8 Ecken-Knopf hochkant (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 7 vermerkt. |
| R7-G8 / H9 Geräteuhr-Warnung bei 200 % und 320 × 568 (bekannte Grenze) | unverändert | Der Hinweis im Assistenten misst 139 px bei 320 × 568; die Startseiten-Warnung habe ich nicht erneut vermessen. |
| R7-N1 kein Zusammenführen-Tipp (bekannte Grenze) | nicht erneut geprüft | Stand wie in Runde 7 vermerkt. |
| R7-N9 Ziffern der Schrittleiste (bekannte Grenze) | unverändert | Schrittleiste zeigt „1" bis „6" mit „✓" bzw. „offen". |

**Nebenwirkungen der Runde-7-Änderungen auf den Arbeitsablauf:**

- **Lagemonitor (Tabelle im Bild, Bewegungen, Telefonansicht):** Bewegungen
  werden gezählt statt gekürzt; am Telefon liegen F / U / M außerhalb des Bildes
  (Verweis), am Fernseher bleibt Restplatz (Verweis).
- **Rückfragen (rollender Rumpf):** halten; bei 200 % sind sie kurz (Verweis).
- **Beiseitelegen unlesbarer Daten:** wirkt für Entwurf, Meldungen und
  Sammlungen ohne Kennung; beim abgeschnittenen Gesamttext der Sammlungen fehlt
  es (Verweis R8-D1, R8-H1).
- **Papier-Abgleich mit Sitzungsspeicher:** hält; die Nummernfolge nach dem
  Abgleich ist die neue Lücke (R8-W1).
- **Sortierung nach Nr. und Umschlagfeld „lage":** halten (Nummern, Zug,
  Auftrag, Abrückvermerk über die Sammel-PDF erhalten).
- **Kurz-Liste ab acht Personen:** In Schritt 3 steht bei neun Personen die
  Kurz-Liste (3 623 px Seitenhöhe); die Quittung nach „Namen einfügen…" nennt
  leere Plätze nicht (R8-W4).
- **Zug-Normalisierung:** „1.zug" und „1. zug" gehen im Zug der zuerst
  eingegebenen Schreibweise auf („1. Zug" bzw. „1. ZUG"); „Zug 1" bleibt ein
  eigener Zug (R8-N5).
- **Verlauf:** keine Nebenwirkung gefunden.

## Abschluss

Der Arbeitsablauf von der Einheit über den Meldekopf bis zum zweiten Gerät und
zum Papier lässt sich ohne fremde Hilfe durchlaufen. Die fünf Befunde aus Runde 7
halten, die Nachmeldung und die Übergabe von Gerät zu Gerät sind klar. Offen
bleiben kleine Stellen: Nummern, die der Papier-Abgleich still verschiebt
(R8-W1), Quittungen, die nach „nur in die Historie" wie eine Änderung der Lage
lesen (R8-W2), ein Dialogtext, der dem Bild widerspricht (R8-W3), ein weiter Weg
zum Entfernen leerer Sollplätze (R8-W4), der Einstieg in die Sammlung ohne Hinweis
auf den eigenen Bogen (R8-W5) und ein stehengebliebenes Häkchen über dem
veralteten Lageblatt (R8-W6).

Befunde: 0 × P0, 0 × P1, 1 × P2, 5 × P3.

- **Aufgabe geschafft:** ja. Einheit → Übergabe → Meldekopf → Nachmeldung →
  Zug, Auftrag, Abrücken → Sammel-PDF auf zweites Gerät → Papier-Abgleich
  ließen sich durchlaufen.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Nur in die Historie legen" liest sich in Karte
  und Quittung wie eine eingearbeitete Folgemeldung (R8-W2).
- **Größtes Einsatzrisiko:** Der Papier-Abgleich verschiebt Nummern, die am Funk
  gelten, ohne alle betroffenen Einheiten zu nennen (R8-W1).
- **Top-Priorität für die nächste Iteration:** Die Rückfrage nach „Abgleich
  übernehmen" listet alle Einheiten mit alter und neuer Nummer (R8-W1); danach
  die Marke „ältere Fassung in Historie" statt „neue Fassung" (R8-W2).

**Zuerst beheben:**
1. R8-W1: Nummernänderungen im Papier-Abgleich vollständig nennen.
2. R8-W2: Quittung und Marke für „nur in die Historie".
3. R8-W4: Entfernen leerer Sollplätze an der Warnung anbieten.
