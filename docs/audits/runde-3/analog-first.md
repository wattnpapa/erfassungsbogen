# Audit „Analog first", Runde 3 (Papier-Rückfallebene, Medienbrüche, Wiedereinstieg)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-analog-first-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Dritte Runde nach der Behebung der
Runde-2-Befunde.

## Prüfaufbau

Playwright aus `node_modules` mit Chromium unter `/opt/pw-browsers/chromium`,
`isMobile`/`hasTouch`, Locale de-DE, Telefon 360 × 640 px. Jeder Durchgang lief
in einem eigenen, frischen Browser-Kontext, weil andere Prüfer denselben Server
nutzten. Zuerst habe ich ohne Kenntnis früherer Berichte getestet. Den
Runde-2-Bericht und die Tabelle „Stand der Behebung" habe ich erst danach
gelesen.

Die Zustände kamen als `localStorage`-Seeds aus `examples/thw/`, mit
`uebung: false`, `stand` auf „jetzt" und dem Einsatzzeitraum auf heute.
Erzeugt habe ich sie mit den Funktionen des geteilten Kerns
(`bogenInhaltsId`, `einheitSchluessel`), damit Eintrags-IDs und
Revisionsgruppen echt sind.

- `eeb.entwurf.v1`: eigener Bogen `001-albstadt-ztr-tz` (ZTr TZ, 1/1/2/4, 2 Fz).
- `eeb.einsaetze.v1`: Einsatz „Hochwasser Neckar R3" mit 11 Einheiten, darunter
  der Großbogen „Verstärkter Bergungszug" (1/9/28/38, 7 QR-Teile). Ansbach ist
  abgerückt. Die Einheiten verteilen sich auf zwei Züge (1. TZ, 2. TZ).
- `eeb.vorlagen.v1`: eine eigene Vorlage „B Ulm (eigene)".

Heruntergeladen, als Text ausgelesen (`pdftotext`) und als Bild gerendert
(`pdftoppm`, angesehen) habe ich: Einzel-PDF (1 Seite), Einzel-PDF des
Großbogens (7 Seiten), Blanko-Vordruck von `vorlage.html` (offline geladen),
Lageblatt mit 11 Einheiten und mit leerem Einsatz, Sammel-PDF (38 Seiten),
Übersichts- und Voll-CSV.

Szenarien:

1. **Papier-Rückfallebene:** eigener Bogen als PDF, Blanko-Vordruck ohne Netz,
   Lageblatt als Aushang zum Weiterführen, Sammel-PDF als Übergabeblatt.
2. **Rückweg vom Papier:** Einzel-PDF als Datei und als Seitenbild (150 dpi und
   72 dpi) einlesen. Nacherfassung vom Lageblatt-Nachtrag über „Einheit schnell
   erfassen (nur Stärke)…" mit Eintreffzeit vom Meldeblock und einer
   Namensvariante („OV Kirchehrenbach").
3. **Geräteausfall:** Ein frisches Gerät übernimmt einmal per Datei („Einsatz
   importieren…" mit der Sammel-PDF) und einmal nur über das Papier
   (Seitenbilder der Sammel-PDF, verteilt auf zwei Einlese-Durchgänge).
4. **Offline:** Nach „Jetzt offline bereit" `setOffline(true)`, Neuladen,
   Vorlage-Seite und Blanko-Vordruck abrufen.

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Der Meldekopf
führt bei einem Geräteausfall auf dem zuletzt gedruckten Lageblatt weiter.
Eintreff- und Abrückzeiten sind für Einsatztagebuch und Abrechnung maßgeblich.
Eine Stärkeänderung, die per Funk oder auf Zuruf kommt, landet zuerst als
Nachtrag auf dem Papier und wird später ins Gerät übernommen.

**Nicht prüfbar** waren der Kamera-Live-Scan, der Handscanner, AirDrop und
Quick Share, das echte Drucken und Fotografieren (ersetzt durch gerenderte
Seitenbilder), echte Akku- und Geräteausfälle (ersetzt durch frische
Browser-Kontexte), der Flugmodus auf einem echten Gerät und die nativen Builds.

## Urteil

Die Papierseite ist belastbar. Das Einzel-PDF ist der gewohnte Bogen auf einer
Seite, mit Funkrufnamen, StAN-Kästchen, Sofortbedarf, Fußzeile
„Stand: 041756okt26" und daneben dem Kästchen „von Hand geändert — dann gilt
der Code (Stand …) nicht mehr". Der Code ließ sich selbst aus einem 72-dpi-Bild
der Seite einlesen. Das Lageblatt trägt Funkrufname und Rückrufnummer je
Einheit, eine laufende Nummer, den Block „Abgerückt (1)" und freie Zeilen
„Nachtrag von Hand". Die App merkt sich, wann zuletzt ein Lageblatt gedruckt
und wann die Lage weitergegeben wurde („seitdem 1 neue Meldung"). Ohne Netz
starten App und Blanko-Vordruck aus dem Cache. Übernimmt ein zweites Gerät die
Sammel-PDF als Datei, kommt die ganze Lage mit (11 gemeldet, 10 zählend,
121 Personen).

Reibung entsteht an zwei Rückwegen vom Papier ins Gerät. Wer eine
Stärkeänderung vom Nachtrag über die Schnellerfassung einträgt und sie als
„neue Fassung" der bekannten Einheit übernimmt, verliert dabei still deren
Fahrzeuge, Kraftstoff, Ruhezeit und Verpflegungsangaben aus den Summen. Gibt es
nach einem Ausfall nur noch das gedruckte Übergabeblatt, kommen die Bögen über
die Codes zurück, die Lage aber nicht. Die App sagt das inzwischen deutlich,
das Nachtragen bleibt aber Handarbeit je Einheit. Dazu kommt: Die Sammel-PDF
verschwendet 7 von 38 Blättern, und der ausgelieferte Blanko-Vordruck ist
älter als die Behebung, die ihn beschriften sollte.

Aufgaben: Bogen und Lage aufs Papier bringen geht ohne fremde Hilfe. Den
Nachtrag vom Papier zurück ins Gerät bringen geht, aber mit einem Fallstrick,
den der Helfer nicht sieht (R3-A1). Die Lage nur vom Papier wiederherzustellen,
geht mit erheblichen Umwegen (R3-A2).

## Befunde

### R3-A1 [P1] Stärkeänderung vom Papier als „neue Fassung": Fahrzeuge und Bedarf der Einheit fallen still aus den Summen (neu)

**Priorität:** P1

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Startseite → „Einheit schnell erfassen (nur
Stärke)…" → „Für ‚Hochwasser Neckar R3' erfassen". Nachgetragen wird eine
Zeile vom Lageblatt: „OV Kirchehrenbach, Bergungsgruppe, eingetroffen 18:40,
Stärke 0/2/6/8". Die Einheit steht schon im Einsatz als „Nr. 6 THW
Kirchehrenbach Bergungsgruppe", 0/2/7/9, mit 2 Fahrzeugen, Diesel 60 l,
Gemisch 5 l und Ruhezeit.

**Beobachtung:**
- Die Rückfrage „Ist das dieselbe Einheit?" kommt, auch mit dem Vorsatz „OV".
  Der Knopf heißt „Ja — als neue Fassung von ‚THW Kirchehrenbach
  Bergungsgruppe'", darunter steht „Die bisherige Meldung wandert in die
  Historie; gezählt wird eine Einheit." Von Fahrzeugen oder Bedarf steht dort
  nichts.
- Nach „Ja" ändern sich in der Einsatzansicht nicht nur die Stärke
  (121 → 120), sondern auch: Fahrzeuge 32 → 30, Diesel 1330 l → 1270 l,
  Gemisch 35 l → 30 l, Ruhezeit 5× → 4×, vegetarisch 23 → 18,
  AGT-Qualifikationen 8 → 5. Neu erscheint „8 ohne M/W/D-Angabe". In der
  Zwischensumme 2. TZ fallen die Fahrzeuge von 22 auf 20.
- Die Karte heißt danach „Nr. 6 THW OV Kirchehrenbach Bergungsgruppe", also
  mit der Schreibweise vom Zettel.
- Einen Weg „nur die Stärke dieser Meldung korrigieren" gibt es an der Karte
  nicht. Unter „Mehr…" stehen nur „Aufteilen…", „Verschieben…" und
  „Entfernen".
- Bedienschritte für den Nachtrag bis zur Rückfrage: 9 (Knopf, Sammlung,
  Eintreffzeit, Einheitstyp, Name, Weiter, Unterführer, Mannschaft, „In Einsatz
  übernehmen").

**Erwartung der Rolle:** Auf dem Zettel steht nur, was sich geändert hat: ein
Helfer weniger. Trage ich das nach, ändert sich die Stärke und sonst nichts.
Die Fahrzeuge sind ja nicht weg.

**Auswirkung im Einsatz:** Der Meldekopf meldet nach dem Nachtrag 2 Fahrzeuge
und 65 l Kraftstoff weniger, als vor Ort sind. Die Ruhezeit-Anforderung der
Einheit ist verschwunden. Die Verpflegung stimmt nicht mehr mit den
vegetarischen Portionen überein. Weil die Zahlen nur etwas kleiner werden,
fällt das niemandem auf. Je mehr Papiernachträge nach einer Ausfallphase
übernommen werden, desto weiter weicht die gemeldete Lage ab.

**Empfehlung:** Übernimmt die Schnellerfassung eine bekannte Einheit als neue
Fassung, sollte sie nur die Stärke ersetzen und Fahrzeuge, Sofortbedarf und
Kontakte der bisherigen Fassung behalten. Alternativ sagt die Rückfrage
ausdrücklich, was wegfällt („2 Fahrzeuge, Diesel 60 l, Ruhezeit"), und bietet
„nur Stärke ändern" an. Zusätzlich an der Karte einen Weg, die Stärke einer
Meldung direkt zu korrigieren.

**Verifikation:** Einheit mit Fahrzeugen und Bedarf aufnehmen, dann vom Papier
nur eine geänderte Stärke nacherfassen und als neue Fassung übernehmen.
Fahrzeuge, Kraftstoff, Ruhezeit und Verpflegungsaufteilung in Summe und
Zwischensumme müssen gleich bleiben, nur die Stärke ändert sich.

### R3-A2 [P1] Übernahme nur vom Papier: Die App erklärt jetzt, was fehlt, aber die Lage muss weiter Einheit für Einheit nachgetragen werden (Fortsetzung von R2-A1)

**Priorität:** P1

**Nachweis:** beobachtet. Die Zahl der Bedienschritte für das Nachtragen ist
eine Schätzung aus den vorhandenen Bedienelementen.

**Fundstelle / Aufgabe:** Neues Gerät ohne Speicherstand → „Neue
Einsatz-Sammlung…" → „Bögen einlesen…" mit den Seitenbildern 4, 6 und 15 der
gedruckten Sammel-PDF. Auf Seite 4/6 steht Ansbach (3 Teile, abgerückt), auf
Seite 15 Kirchehrenbach (1 Code).

**Beobachtung:**
- Beide Bögen kommen an, „2 gemeldet · 2 zählend", Stärke 0 / 6 / 21 / 27.
  Ansbach steht als „kürzlich eingetroffen, eingetroffen 04.10.2026, 19:27",
  anwesend und mitgezählt. Laut Kasten auf dem Blatt ist Ansbach um 18:24
  eingetroffen und abgerückt („ABGERÜCKT (nicht mehr vor Ort) · Zug: 1. TZ").
- Neu und gut: Über jedem Bogen und auf jeder QR-Seite der Sammel-PDF steht
  der Kasten „Stand am Meldekopf" mit Eintreffzeit, Status und Zug. Darunter
  steht: „Der Code enthält nur den Bogen der Einheit … nach dem Einlesen von
  Hand nachtragen." Die Quittung „Stapel eingelesen" steht im Bild und sagt:
  „Eintreffzeit … ist die Zeit des Einlesens, und sie stehen als anwesend;
  Abrückvermerk, Zug und Auftrag stecken nicht im Bogen … an der Karte
  nachtragen".
- Die Quittung nennt das Nachtragen allgemein. Welche Einheiten davon
  betroffen sind, sagt sie nicht, und an den Karten erscheint keine Marke
  „noch nicht abgeglichen".
- Je Einheit braucht das Nachtragen etwa 6 bis 8 Bedienschritte: Aufklappen,
  „ändern" an der Eintreffzeit mit Eingabe und Bestätigen, „Zug zuordnen" mit
  Auswahl, bei Abgerückten „Abrücken" und dort noch einmal „ändern". Bei den 11
  Einheiten dieses Einsatzes sind das rund 70 bis 90 Schritte.
- Zum Vergleich: „Einsatz importieren…" mit derselben Sammel-PDF als Datei
  bringt alles mit (11 gemeldet, 10 zählend, Zeiten, Züge, Abrückstatus).

**Erwartung der Rolle:** Das Übergabeblatt ist der Stand, der nach einem
Ausfall gilt. Lese ich es ein, habe ich die Lage wieder. Oder die App führt
mich Einheit für Einheit durch den Abgleich, und ich sehe, wo ich noch nicht
war.

**Auswirkung im Einsatz:** Bis alles nachgetragen ist, zählt die abgerückte
Einheit wieder in Stärke, Verpflegung und Kraftstoff. Hier sind es 18 Personen
und 335 l Diesel zu viel. Bei einem vollen Meldekopf liegt der Helfer eine
Viertelstunde am Gerät, statt eintreffende Einheiten anzunehmen. Weil die
Karten nicht zeigen, was schon abgeglichen ist, entstehen Lücken, sobald er
unterbrochen wird.

**Empfehlung:** Laut Behebungstabelle bräuchte ein Code für die Lage einen
Schemawechsel. Bis dahin sollte es nach einem Einlesen aus Bildern einen
geführten Abgleich geben: Liste der eben aufgenommenen Einheiten mit je einem
Feld für Eintreffzeit, Status (anwesend/abgerückt) und Zug, in einem Schritt
zu bestätigen. Bis zur Bestätigung tragen die Karten eine Marke „vom Papier,
Zeiten prüfen". Das Lageblatt könnte die Lage als eigenen Code tragen, sobald
das Format es erlaubt.

**Verifikation:** Sammel-PDF mit einer abgerückten Einheit und zwei Zügen
drucken und auf einem leeren Gerät nur vom Papier einlesen. Nach höchstens
einem Abgleichschritt je Stapel müssen Summen, Eintreffzeiten, Züge und der
Block „Abgerückt" mit Seite 1 übereinstimmen.

### R3-A3 [P2] Sammel-PDF: 7 von 38 Seiten tragen nur eine verwaiste Textzeile (neu, Nebenwirkung der Behebung von R2-A1)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Einsatz weitergeben / sichern" →
`eeb-einsatz-041916okt26_Hochwasser_Neckar_R3.pdf`, 11 Einheiten, 38 Seiten
A4 quer.

**Beobachtung:**
- Die Seiten 5, 9, 13, 25, 27, 29 und 37 enthalten außer der Fußzeile nur
  die Zeile „‚Einsatz importieren…' aus der PDF-Datei." Es ist der letzte Satz
  des Erklärtexts unter den QR-Codes, der von der Vorseite herüberrutscht.
- Das betrifft jeden mehrteiligen Code. Unter dem ersten QR-Paar stehen jetzt
  der Kasten „Stand am Meldekopf" und ein zusätzlicher Absatz. Das reicht, um
  die Seite zu sprengen. Danach beginnt der Rest (z. B. „Teil 3 / 3") auf
  einer eigenen Seite, und der ganze Erklärtext steht dort ein zweites Mal.
- Das Einzel-PDF desselben Großbogens (7 QR-Teile) hat dieses Problem nicht:
  7 Seiten, keine leere.

**Erwartung der Rolle:** Ein Übergabeblatt, das ich in den Ordner hefte oder
dem Stab mitgebe, hat keine Leerseiten. Was zu einem Bogen gehört, liegt
zusammen.

**Auswirkung im Einsatz:** 18 % der Blätter sind Ausschuss. Am
Feldbüro-Drucker kostet das Zeit und Papier. Beim Durchblättern und beim
Fotografieren für den Rückweg (R3-A2) hält man ein fast leeres Blatt leicht für
das Ende eines Bogens und übersieht die folgende Seite mit „Teil 3 / 3".

**Empfehlung:** Erklärtext und Kasten auf den QR-Seiten so bemessen, dass sie
mit zwei Codes auf eine Seite passen, oder den Erklärtext nur einmal je Bogen
drucken. Die Seitenzahl der Sammel-PDF bei mehrteiligen Bögen in den Test
aufnehmen.

**Verifikation:** Sammel-PDF mit Bögen aus 2, 3 und 7 QR-Teilen erzeugen.
Keine Seite darf nur aus Fußzeile und einer Textzeile bestehen.

### R3-A4 [P2] Der ausgelieferte Blanko-Vordruck ist älter als die Behebung, die ihn beschriften sollte (neu; betrifft R2-A6)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** `vorlage.html` → „Blanko-PDF herunterladen"
(`downloads/einheiten-erfassungsbogen-blanko.pdf`). Offline aus dem Cache
geladen, 2 Seiten, 11 633 Byte.

**Beobachtung:**
- Auf dem Vordruck steht „Stärke: ____ / ____ / ____ / ____", ohne
  F / UF / M / Ges. Laut Behebungstabelle ist R2-A6 „behoben", auch mit
  „Blanko-Stärke beschriftet".
- Die PDF-Datei trägt das Erstellungsdatum 15.08.2026. Sie liegt fertig im
  Repo (`public/downloads/`) und wird beim Build nicht neu erzeugt. Der
  Generator `scripts/blanko-pdf.mts` erzeugt heute, testweise in den
  Scratchpad geschrieben, „Stärke (F / UF / M / Ges.): ____ / ____ / ____ /
  ____". Die Behebung steckt also im Code, aber nicht in der ausgelieferten
  Datei.
- Sonst stimmt der Vordruck: 4 Fahrzeugblöcke, 36 Personalzeilen, 6
  Qualifikationszeilen, Sofortbedarf mit Ausfülllinien.

**Erwartung der Rolle:** Der Vordruck in der Fahrzeugmappe und das PDF aus der
App sind dasselbe Formular. Was am Bogen verbessert wird, steht auch auf dem
Blanko.

**Auswirkung im Einsatz:** Auf dem handschriftlichen Bogen ist die Reihenfolge
der vier Zahlen nicht vorgegeben. Wer „2 / 7 / 9" ohne Führer schreibt oder die
Gesamtzahl vorne einträgt, liefert dem Meldekopf eine Stärke, die beim Abtippen
falsch zugeordnet wird. Schwerer wiegt die Prozesslücke: Jede künftige
Änderung am Bogen erreicht die Papier-Rückfallebene nur, wenn jemand das
Skript von Hand aufruft.

**Empfehlung:** Den Vordruck neu erzeugen. Dann entweder beim Build erzeugen
oder einen Test einführen, der die ausgelieferte Datei gegen den Generator
prüft.

**Verifikation:** `downloads/einheiten-erfassungsbogen-blanko.pdf` aus dem
Build herunterladen. Auf Seite 1 muss „Stärke (F / UF / M / Ges.)" stehen, und
die Datei muss mit dem Ergebnis des Generators übereinstimmen.

### R3-A5 [P2] Lageblatt zum Weiterführen: 2 freie Zeilen bei 10 Einheiten, die gedruckte Summe lässt keinen Platz für den Nachtrag (Fortsetzung von R2-A3)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht → „Lageblatt (A4 quer)", einmal mit
11 Einheiten, einmal mit einem leeren Einsatz („Leerlage").

**Beobachtung:**
- Mit 11 Einheiten (10 anwesend) stehen unter „Nachtrag von Hand (Einheit, Zug,
  Uhrzeit, Stärke …)" genau 2 leere Zeilen. Danach folgen „Abgerückt (1)" und
  die Summenzeile „Summe (10 zählend · 1 abgerückt) 2 / 30 / 89 / 121, Fzg
  32". Darunter ist rund ein Fünftel der Seite frei.
- Für eine handschriftlich fortgeschriebene Summe oder Stärke gibt es kein
  Feld. Die gedruckte Summe ist nach dem ersten Nachtrag falsch und steht
  trotzdem fett da.
- Leerer Einsatz: 6 leere Zeilen, darunter vorgedruckt „Summe (0 zählend)
  0 / 0 / 0 / 0", „0 Portionen", „Diesel 0 l". Die untere Hälfte der Seite ist
  leer. Als Ersatzliste für einen Meldekopf, der gar nicht erst ins Gerät
  kommt, taugt das Blatt deshalb wenig.
- Gut: Funkrufname und Rückrufnummer je Einheit, laufende Nummer („Nr. 10"),
  leere Spalte „Auftrag / Notiz", „Erstellt 04.10.2026, 19:16". In der App
  steht „Lageblatt erstellt 04.10.2026, 19:23 · seitdem 1 neue Meldung".

**Erwartung der Rolle:** Fällt das Tablet aus, schreibe ich auf dem Aushang
weiter, bis Ersatz da ist. Dafür brauche ich so viele Zeilen, wie auf das
Blatt passen, und eine Zeile „Summe neu (von Hand)". Ein leeres Lageblatt
ist meine Strichliste, ohne vorgedruckte Nullen.

**Auswirkung im Einsatz:** Nach zwei Nachträgen geht es auf einem neuen Zettel
weiter. Damit gibt es wieder drei Quellen (Gerät, Lageblatt, Zettel), genau
das, was R2-A3 vermeiden wollte. Wer die gedruckte Summe abliest, meldet den
Stand vor den Nachträgen.

**Empfehlung:** Den Rest der Seite mit Nachtragszeilen füllen, mindestens 5.
Unter der gedruckten Summe eine leere Zeile „Summe einschl. Nachträge (von
Hand)" vorsehen. Beim leeren Einsatz keine Nullsummen drucken, sondern
Leerfelder.

**Verifikation:** Lageblatt mit 10 Einheiten drucken: mindestens 5
Nachtragszeilen und ein Feld für die fortgeschriebene Summe. Lageblatt eines
leeren Einsatzes: Die Seite ist mit Zeilen gefüllt, und es steht keine „0" in
den Summenfeldern.

### R3-A6 [P3] Einzel-PDF: kein Platz für Stiftnachträge, Stärke ohne Legende, Personaltabelle ohne Zählrolle (Rest von R2-A4)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Eigener Bogen → „Bogen übergeben…" → „PDF erzeugen",
`eeb-041914okt26_THW_Albstadt_Zugtrupp_Technischer_Zug.pdf`, 1 Seite.

**Beobachtung:**
- Die Personaltabelle hat genau 4 Zeilen für 4 Personen. Unter „weitere
  Qualifikationen" steht 1 Leerzeile, bei den Fahrzeugen keine.
- „Stärke: 1 / 1 / 2 / 4" steht ohne F / UF / M / Ges. Die Spalte „ROLLE"
  (Fü/UFü/Ma), die die App in der Übersicht zeigt, fehlt im PDF. Eine von Hand
  geänderte Stärke lässt sich auf dem Blatt also nicht gegen die Namen prüfen.
- Gut: Das Kästchen „[ ] von Hand geändert — dann gilt der Code (Stand
  041756okt26) nicht mehr: abtippen oder neu erzeugen, nicht scannen." steht
  direkt neben dem Code.

**Erwartung der Rolle:** Rückt ein Helfer nach, trage ich ihn auf dem Ausdruck
nach und kreuze „von Hand geändert" an. Dafür brauche ich zwei leere Zeilen.

**Auswirkung im Einsatz:** Nachträge landen am Rand oder auf der Rückseite.
Beim Abtippen am Meldekopf fehlen dann Funktion oder Rolle, und die Stärke
muss erfragt werden. Gering, weil das Kästchen den Code richtig entwertet.

**Empfehlung:** Zwei Leerzeilen in der Personaltabelle und eine leere
Fahrzeugzeile, wenn Platz ist. Legende an der Stärke wie im Generator für den
Blanko-Vordruck. Zählrolle als kurze Spalte (F/UF/M).

**Verifikation:** Einzel-PDF eines Bogens mit 4 Personen: mindestens 2 freie
Personalzeilen, „Stärke (F / UF / M / Ges.)", Rolle je Person ablesbar.

### R3-A7 [P3] Kleine Abgleichhilfen: Vermerk „Übergeben" schon beim Erzeugen der PDF, „Lücken" ohne Inhalt, drei Zeitformen in der CSV, Blanko schwer zu finden (neu; Rest von R2-A5 und R2-A6)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Übersicht des eigenen Bogens, Lageblatt, CSV,
Fußzeilen.

**Beobachtung:**
- Nach „PDF erzeugen" steht in der Übersicht „Übergeben 19:14 Uhr — seitdem
  unverändert." Die PDF war nur heruntergeladen, weder gedruckt noch
  weitergegeben.
- Das Lageblatt schreibt unter Einheitsnamen „2 Lücken (Meldung)" oder „1 Lücke
  (Meldung)". Welche Angaben fehlen, steht weder auf dem Blatt noch sichtbar an
  der Karte.
- Die Übersichts-CSV hat in einer Zeile drei Zeitformen: Stand „041725okt26",
  Eingetroffen „04.10.2026, 18:24", Empfangen „04.10.26, 18:24". Auf Karte,
  Lageblatt und Sammel-PDF gilt einheitlich „TT.MM.JJJJ, hh:mm", auf dem
  Einzel-PDF und am Kästchen „von Hand geändert" die Datum-Zeit-Gruppe.
- Den Blanko-Vordruck erreicht man in der App nur über den Fußzeilen-Link
  „Aufbau des Bogens" bzw. „Alle Themen → Vorlage und Blanko-PDF". In der
  Einsatzansicht und im Übergabe-Dialog fehlt ein Hinweis. In der
  Bogen-Fußzeile fehlt der Link ganz.
- Die Reihenfolge im Assistenten (Personal vor Fahrzeugen) weicht weiter vom
  Vordruck ab (Fahrzeuge vor Personal).

**Erwartung der Rolle:** „Übergeben" heißt, es hat jemand bekommen. Ein
Vermerk auf Papier ist selbsterklärend. Eine Zeitform in allem, was abgeglichen
wird. Der leere Vordruck ist dort zu finden, wo ich am Meldekopf arbeite.

**Auswirkung im Einsatz:** Eine Einheit hält den Bogen für übergeben, obwohl
nur eine Datei auf dem Handy liegt. Wer am Lageblatt „2 Lücken" liest, muss das
Gerät fragen. Beim Abgleich CSV ↔ Blatt kostet die Umrechnung Zeit. Gering, weil
die Angaben stimmen.

**Empfehlung:** Bei der PDF „PDF erzeugt 19:14" statt „Übergeben". Auf dem
Lageblatt die fehlenden Felder kurz nennen („ohne Rückruf, ohne Fahrzeuge").
CSV-Zeiten vereinheitlichen. „Blanko-Vordruck (Papier-Reserve)" als Link in der
Einsatzansicht und im Übergabe-Dialog. Reihenfolge Assistent ↔ Vordruck
angleichen oder gleich nummerieren.

**Verifikation:** PDF erzeugen: Der Vermerk lautet nicht „Übergeben". Lageblatt
mit unvollständiger Meldung: Die Lücken sind benannt. CSV: eine Zeitform. Aus
der Einsatzansicht mit höchstens zwei Tipps zum Blanko-PDF.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, OV mit RB/LV, Summen rechnen sich selbst, Prüfhinweise | Blanko-Vordruck, offline aus dem Cache (2 Seiten, 4 Fz, 36 Personen). Stärke-Legende fehlt in der ausgelieferten Datei (R3-A4) | „Einheit manuell erfassen…" mit „Eingetroffen um (vom Meldeblock)". Namensvarianten mit „OV" werden erkannt |
| Bogen übergeben | QR, Link, Datei, PDF mit Code. Code liest sich noch aus 72 dpi | Einzel-PDF mit Code und Kästchen „von Hand geändert" | Ausdruck scannen oder als Bild einlesen. Mit Stift geändert: abtippen (Kästchen sagt es). Kein Platz für Nachträge (R3-A6) |
| Lage führen (Stärke, Bedarf) | Laufende Summen, Zwischensummen je Zug, Abrücken mit „ändern", Druck- und Weitergabestand | Lageblatt mit Funkrufname, Rückruf, Nr., 2 bis 6 Nachtragszeilen (R3-A5) | Nachtrag neuer Einheiten: gut. Stärkeänderung einer bekannten Einheit über die Schnellerfassung löscht Fahrzeuge und Bedarf aus den Summen (R3-A1) |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern" als Datei: alles kommt mit | Letzter Ausdruck von Lageblatt oder Sammel-PDF (7 Leerseiten, R3-A3) | Mit Datei: vollständig. Nur mit Papier: Bögen ja, auch über mehrere Foto-Durchgänge. Zeiten, Status und Zug je Einheit von Hand (R3-A2) |
| Schichtübergabe | Sammel-PDF mit eingebetteter Sammlung, Vermerk „Weitergegeben … seitdem 1 neue Meldung" | Übergabe-Übersicht (Seite 1) | „Einsatz importieren…" mit der Datei: vollständig |

Nicht gelistet: Vorlagenpflege, Darstellung, Absenderkarte, Excel. Für sie ist
keine Rückfallebene nötig.

## Würde ich dafür das Papier weglegen?

Für den eigenen Bogen: ja. Das PDF ist der Papierbogen, der Code liest sich
auch von einem schlechten Bild, und das Kästchen „von Hand geändert" sagt,
wann er nicht mehr gilt. Am Meldekopf: noch nicht ganz. Nachträge vom Papier
können die Fahrzeug- und Bedarfssummen still verfälschen (R3-A1), und nach
einem Ausfall bringt der Ausdruck die Lage nur mit viel Handarbeit zurück
(R3-A2). Solange das so ist, bleibt das Lageblatt mit Stift die maßgebliche
Liste. Es braucht dafür mehr freie Zeilen (R3-A5).

## Bestätigtes (erhalten)

- Einzel-PDF in 2,7 s erzeugt (einschließlich Nachladen von pdfmake): 1 Seite,
  Funkrufnamen „FuRn: Heros Albstadt 21/10", StAN-Kästchen, Sofortbedarf,
  Fußzeile „Stand: 041756okt26". Code aus 150-dpi- und 72-dpi-Seitenbild über
  „QR aus Bild einlesen…" gelesen, PDF als Datei über „Aus Datei laden…".
- Kästchen „von Hand geändert" mit Stand neben jedem Code (Einzel- und
  Sammel-PDF). Die Stapel-Quittung wiederholt den Hinweis.
- Offline: „Jetzt offline bereit" nach 10,3 s beim ersten Aufruf. Danach
  starten App, `vorlage.html` und Blanko-Vordruck ohne Netz (im Browser per
  `setOffline` geprüft, nicht im Flugmodus eines Geräts).
- Lageblatt (1,6 s, 1 Seite A4 quer bei 11 Einheiten) mit Funkrufname und
  Rückruf, laufender Nummer, Zug, Bedarf, „Abgerückt (1)", Summe und
  Zwischensummen je Zug, Hinweis „Summen und Bedarf zählen nur die anwesenden
  Einheiten".
- Druck- und Weitergabestand: „Lageblatt erstellt … · seitdem 1 neue Meldung",
  „Zuletzt exportiert … · seitdem 1 neuer Bogen", gelber Vermerk „Weitergegeben
  … — seitdem hier 1 neue Meldung" oben in der Einsatzansicht. Die
  Startseitenkarte zeigt „Lageblatt: noch keins · Export: noch keiner".
- Sammel-PDF als Datei auf einem frischen Gerät: Lage vollständig (11
  gemeldet, 10 zählend, 2 / 30 / 89 / 121, Züge, Abrückstatus).
- Seitenbild mit zwei Codes: beide gelesen. Fehlender dritter Teil: „Die
  gelesenen Teile bleiben bis 20:28 Uhr gemerkt — das fehlende Blatt einfach
  als weiteres Bild einlesen". Im zweiten Durchgang wurde der Bogen vollständig.
- Nacherfassung: Feld „Eingetroffen um (vom Meldeblock)" mit dem Hinweis „Leer
  lassen, wenn die Einheit gerade eintrifft". Die Rückfrage „Ist das dieselbe
  Einheit?" erkennt „OV Kirchehrenbach" ≈ „THW Kirchehrenbach".
- Abrücken setzt sofort die Uhrzeit, und „ändern" daneben erlaubt die Zeit vom
  Meldeblock. „Wieder anwesend" ist der Rückweg.
- Die Rückfrage beim Wechsel von eigenem Bogen zu fremder Erfassung sagt, wo
  der eigene Bogen bleibt („Zuletzt verdrängten Bogen zurückholen").

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen (Einzel-PDF, Blanko, Lageblatt,
  Sammel-PDF): ja. Nacherfassung neuer Einheiten vom Papier: ja. Stärkeänderung
  einer bekannten Einheit vom Papier: mit Umweg, sonst falsche Summen (R3-A1).
  Lage nach einem Ausfall: mit Datei ja, nur mit Papier mit erheblichen Umwegen
  (R3-A2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Ja — als neue Fassung" klingt nach „Stärke
  aktualisiert", ersetzt aber die ganze Meldung, samt Fahrzeugen und Bedarf
  (R3-A1).
- **Größtes Einsatzrisiko:** Nach einer Papierphase werden Stärkeänderungen
  über die Schnellerfassung übernommen, und der Meldekopf meldet still zu
  wenige Fahrzeuge, zu wenig Kraftstoff und keine Ruhezeit-Anforderung mehr
  (R3-A1).
- **Top-Priorität für die nächste Iteration:** Beim Übernehmen einer
  Stärkeänderung als neue Fassung Fahrzeuge und Sofortbedarf der bisherigen
  Meldung behalten oder ausdrücklich nachfragen (R3-A1).

## Abgleich mit Runde 2

Grundlage: [../runde-2/analog-first.md](../runde-2/analog-first.md) und
[../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Stand laut Tabelle | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- | --- |
| R2-A1 Papier bringt Lage nicht zurück | teilweise | teilweise, mit Nebenwirkung | Hält: Kasten „Stand am Meldekopf" über jedem Bogen und auf jeder QR-Seite, Erklärsatz unter dem Code, Quittung mit Nachtragshinweis. Bleibt: abgerückte Einheit zählt nach dem Einlesen wieder, Eintreffzeit „jetzt", Nachtragen je Einheit von Hand (R3-A2). Verkehrt: Der zusätzliche Kasten sprengt die QR-Seiten, 7 von 38 Seiten sind fast leer (R3-A3). |
| R2-A2 Foto mit zwei Codes | behoben | hält | Seitenbild mit Teil 1 und 2 gelesen. Teil 3 aus einem zweiten Durchgang ergänzt, die Quittung nennt die Merkfrist („bis 20:28 Uhr") und steht im Bild. |
| R2-A3 Lageblatt weiterführen | behoben | wirkt teilweise | Hält: Funkrufname, Rückruf, laufende Nummer, Druckstand in Einsatzansicht und auf der Startseitenkarte, nur noch ein Knopf für die Sammel-PDF. Teilweise: nur 2 Nachtragszeilen bei 10 Einheiten, kein Feld für die fortgeschriebene Summe, Nullsummen auf dem leeren Blatt (R3-A5). |
| R2-A4 Stiftkorrektur | behoben | wirkt teilweise | Hält: Kästchen „von Hand geändert" mit Stand neben jedem Code, Hinweis im Stapelbericht. Offen aus der Empfehlung: Leerzeilen im Personalteil, Stärke-Legende und Zählrolle auf dem Einzel-PDF (R3-A6). |
| R2-A5 Nacherfassung | teilweise | hält, mit neuem Folgeproblem | Feld „Eingetroffen um (vom Meldeblock)" vorhanden, „OV Kirchehrenbach" löst die Rückfrage aus. Reihenfolge Personal/Fahrzeuge weiter abweichend (R3-A7). Neu: Die Übernahme als „neue Fassung" über die Schnellerfassung löscht Fahrzeuge und Bedarf aus den Summen (R3-A1). |
| R2-A6 Zeitformen und Kennungen | behoben | wirkt teilweise | Hält: einheitlich „TT.MM.JJJJ, hh:mm" auf Karte, Lageblatt und Sammel-PDF, laufende Nummer, Marke „kürzlich eingetroffen". Kommt nicht an: Die ausgelieferte Blanko-Datei hat keine Stärke-Legende, weil sie nicht neu erzeugt wurde (R3-A4). Die CSV mischt drei Zeitformen (R3-A7). |

Bezüge zu anderen Runde-2-Befunden, nur verwiesen: R2-O7 (Blanko im Precache)
hält, offline per `setOffline` bestätigt. R2-W5 (Übergabevermerk) hält, der
Vermerk „Weitergegeben … seitdem 1 neue Meldung" erscheint. R2-K3 (Lageblatt
eine Seite bis etwa zwölf Einheiten) hält bei 11 Einheiten.

Bilanz: Von sechs eigenen Runde-2-Befunden hält einer voll (R2-A2), vier
wirken teilweise (R2-A1, R2-A3, R2-A4, R2-A6), und einer hält mit neuem
Folgeproblem (R2-A5). Zwei Behebungen haben Nebenwirkungen: Der Kasten aus
R2-A1 erzeugt Leerseiten (R3-A3), und die Blanko-Beschriftung aus R2-A6
steckt nur im Generator, nicht in der ausgelieferten Datei (R3-A4). Neu und am
schwersten ist R3-A1: Ein Rückweg vom Papier, der bisher nicht geprüft war,
verfälscht die Summen still.

## Stand der Behebung

Stand 05.10.2026, Paket „Einsatz-Import, Abgleich zwischen Geräten,
Papier-Rückweg". Geprüft mit Typprüfung, Unit- und Oberflächentests
(2 310 grün) und Nachmessung im Dev-Server (360 × 640, `isMobile`/`hasTouch`,
de-DE) mit den Seeds und Fotos dieses Audits. Aufgeführt sind nur die
Befunde dieses Pakets.

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-A1 Stärkeänderung vom Papier als neue Fassung | behoben | Die Rückfragen „Ist das dieselbe Einheit?" und „Einheit ist bereits gemeldet" bieten bei einem reinen Stärke-Nachtrag zuerst „Nur die Stärke ändern (0 / 2 / 7 / 9 → 0 / 2 / 6 / 8)"; „als neue Fassung" nennt „Fällt dabei weg: 2 Fahrzeuge, Diesel 60 l, Gemisch 5 l, Ruhezeit, 9 Namen". Die neue Fassung entsteht aus der bisherigen: Schreibweise, Fahrzeuge, Bedarf, Namen bleiben, Verpflegungs- und M/W/D-Aufteilung werden festgeschrieben. An der Karte zusätzlich „Mehr…" › „Stärke ändern…". Nachlauf: Stärke 121 → 120, Fahrzeuge 32, Diesel 1330 l, Gemisch 35 l, Ruhezeit 5×, vegetarisch 23, kein „ohne M/W/D-Angabe". Die Bedienschritte bis zur Rückfrage bleiben 9. |
| R3-A2 Übernahme nur vom Papier | teilweise | Vom Papier eingelesene neue Einheiten tragen „vom Papier, Zeiten prüfen". Die Einsatzansicht bietet „Lage vom Papier abgleichen…": alle markierten Einheiten in einer Liste mit Eintreffzeit, Status samt Abrückzeit und Zug, übernommen in einem Schritt. Nachlauf (Fotos der Seiten 4, 6, 15): 8 Bedienschritte für Ansbach und Kirchehrenbach, danach 0 / 2 / 7 / 9 und keine Marke. Offen: Die Werte müssen weiter vom Blatt abgetippt werden; ein Code für die Lage braucht ein neues Transportformat (bewusst kein Schemawechsel in diesem Paket). Der Kasten erscheint über der Liste, nach dem Einlesen liegt die Ansicht aber beim Stapelbericht weiter unten. |
