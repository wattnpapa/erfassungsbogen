# Audit „Führungssicht", Runde 5 (Lage erfassen, Abweichungen sehen, Stand übergeben)

Stand: 06.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit c0cbae0 (Code entspricht 4fcdbaf).

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-4-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch` auf Telefon und Tablet, Locale de-DE, Zeitzone
Europe/Berlin. Geräte: Telefon 360 × 640 (Zusatzmessung 320 × 568), Tablet
820 × 1180, Laptop 1366 × 768 (ab 72 rem zweispaltig). Jeder Lauf hatte einen
eigenen Browser-Kontext; das zweite Gerät war ein zweiter Kontext mit
eigenem Seed. Elf weitere Prüfer nutzten denselben Server. Laufzeiten
(Sammel-PDF teils über 20 s) sind deshalb nicht belastbar und werden nicht
bewertet. Ich habe zuerst ohne Blick in frühere Berichte getestet. Den
Runde-4-Bericht samt „Stand der Behebung" und dessen README habe ich danach
gelesen, die anderen Runde-5-Berichte (zum Teil nur Entwürfe) zuletzt.

Den Grundzustand habe ich über `localStorage`-Seeds (`eeb.einsaetze.v1`,
`eeb.entwurf.v1`, `eeb.vorlagen.v1`) aus `examples/thw/` gesetzt, alle mit
`uebung: false`, Stand und Einsatzzeitraum auf dem Prüftag.

**Lage „Hochwasser Jagst · Möckmühl"** (Art „Einsatz"), Ausgangszustand:

| Einheit | Zug | Besonderheit |
| --- | --- | --- |
| Karlsruhe ZTr, Ulm B (−2 Helfer), Sinsheim FGr W (B) | 1. TZ Karlsruhe | Sinsheim mit Auftrag „Pumpen Deich km 3,2" |
| Landshut ZTr, Mühldorf B, Deggendorf FGr WP (A) | 2. TZ Landshut | |
| Weinsberg FGr Öl (C) | ohne Zug | Auftrag „Ölsperre Jagst Wehr Ruchsen", Diesel 150 l |
| Crailsheim FGr W (A) | ohne Zug | älter (ein Tag) |
| Cottbus FGr I | ohne Zug | Auftrag „Notstrom Pumpwerk Süd" |
| Erlangen FGr Öl (B), Radolfzell Tr Log-TS | ohne Zug | Erlangen manuell erfasst |
| Ansbach FGr Log-MW, Füssen FGr K (A) | ohne Zug | beide **abgerückt** (45 bzw. 120 Minuten) |

Dazu eine zweite Sammlung „Übung Stegbau" (Übung, 20 Tage alt), ein Entwurf
und eine Vorlage. Ausgangskopf: 11 zählend, 13 gemeldet, 2 / 27 / 78 / 107.

**Folgemeldungen** habe ich über „Bögen einlesen…" eingespielt, nicht über
den Seed: Ulm (+2), Weinsberg (Diesel 150 → 500 l, Bemerkung „Ölsperre
gerissen, 300 m Sperre nachfordern"), Crailsheim (−4, Verpflegung bleibt 12),
Cottbus (+2), Biberach (neue Einheit), **Ansbach nach dem Abrücken**
(Folgemeldung mit +1 und Bemerkung), **Füssen nach dem Abrücken** (neuerer
Stand, inhaltlich gleich), dazu Füssen mit gleichem und mit älterem Stand,
Neu-Ulm mit Ort/Auftrag „Brandeinsatz Lagerhalle Ulm" (anderer Einsatz).

Heruntergeladen und gegengelesen: Lageblatt (`pdftotext`, Bild), Sammel-PDF
(35 und 39 Seiten, `pdftotext`), Nachtrag-Sammel-PDF, Übersicht-CSV, „Alle
Daten"-CSV, Excel „Oldenburg" (openpyxl), jeweils als Vollexport und als
Nachtrag. Unterbringung, Stärke und Zahlen habe ich von Hand nachgerechnet.
Die Screenshots habe ich angesehen.

**Nicht prüfbar:** Kamera und Handscanner (Aufnahme nur über Dateien),
echte Handschuhe und echtes Licht, WebKit/Safari, native Builds, ein
tatsächlich zweites Gerät mit eigener Uhr (das zweite „Gerät" war ein
zweiter Kontext, die Eintreffzeiten weichen dort wegen meiner zwei
Seed-Läufe um 14 Minuten ab), Laufzeiten unter Last. Dateinamen mit Umlaut
speichert dieses Chromium als „download"; ich habe die Dateinamen deshalb nur
dort bewertet, wo ASCII reicht.

## Urteil

Die Lage lässt sich auf allen drei Geräten gut führen. Die Umbauten aus
Runde 4 wirken an den meisten Stellen. Am Laptop steht die erste Einheitenkarte
jetzt bei 380 px (zweispaltig), am Telefon führt „Zuletzt gemeldete oben
zeigen" tatsächlich zur Liste, und nach dem Einlesen springt die Ansicht von
selbst zur Quittung. Die Weitergabe-Zeile sagt „Weitergegeben 13:37 — seitdem
hier 2 neue Meldungen und 1 Änderung (Abrücken). Führt inzwischen ein anderes
Gerät die Lage, fehlt das dort", und Lageblatt und Export nennen dieselbe
Zahl. Ein Nachtrag trägt im PDF „NACHTRAG … nicht die ganze Lage" und nimmt
das Abrücken mit. Zahlen stimmen in App, Lageblatt, Sammel-PDF, beiden CSV und
Excel überein (Unterbringung 6 Einheiten, 69 Personen, 50 / 19 / 0, von Hand
nachgerechnet). Ein „Anderer Einsatz?"-Hinweis steht an der Karte und in der
Quittung.

Reibung entsteht an einer Stelle, die in Runde 4 nicht im Blick war: Was
passiert, wenn von einer **abgerückten** Einheit noch einmal ein Bogen kommt.
Die App führt die Einheit dann still wieder als anwesend. Karte, Quittung,
Lageblatt und Nachtrag sagen nicht, dass sie weg war; die Zeilen zum
Exportstand nennen den Statuswechsel „Abrücken" (R5-K1). Dazu kommt ein
Fehler, den die Behebung von R4-K3 selbst eingebaut hat: Das Lageblatt druckt
das neue Stichwort „Verpflegung 12 ≠ Stärke 8" mit einem Fremdzeichen
(R5-K2). Die Übernahme-Quittung beim Import ist nach oben gerückt, ist aber
ein einziger Absatz, in dem der eine wichtige Satz untergeht (R5-K3). Am
Telefon liegt die erste Karte bei 11 Einheiten weiter 2,6 Bildschirme unter
dem Seitenanfang (R5-K4).

Die Lage lässt sich ohne fremde Hilfe erfassen, führen und übergeben. Wer
einer abgerückten Einheit eine Folgemeldung einliest, muss selbst wissen,
dass er sie damit zurückholt.

## Befunde

### R5-K1 [P1] Folgemeldung einer abgerückten Einheit holt sie still in die Lage zurück; die Zeilen zum Exportstand nennen das „Abrücken" (neu)

**Priorität:** P1

**Nachweis:** gemessen (Laptop 1366 × 768; Ansbach und Füssen, je vor und
nach der Folgemeldung, Lageblatt, Sammel-PDF und Nachtrag gelesen).

**Fundstelle / Aufgabe:** Einsatzansicht nach „Bögen einlesen…" mit einem
neueren Bogen einer Einheit, die vorher mit „Abrücken" abgemeldet war. Code:
Statuswechsel beim Übernehmen der Fassung (`src/app/fassung-vorrang.ts`, um
Zeile 208, `bisherKopf.abgerueckAm` … `delete gilt.abgerueckAm`); Beschriftung
in `src/app/export-stand.ts` (`ART_TEXT.status = "Abrücken"`,
`aenderungenSeit`). Der Handweg „Wieder anwesend" schreibt dagegen einen
Vermerk „Wieder als anwesend geführt" (`src/app/eintrag-zeiten.ts` um Zeile
279); der Weg über die Folgemeldung schreibt keinen.

**Beobachtung:**
- Ansbach war seit 12:47 abgerückt (Block „ABGERÜCKT", durchgestrichen,
  nicht in der Summe). Nach dem Einlesen eines Bogens mit Stand 13:34 steht
  Ansbach als normale Karte in der Lage („neue Fassung"), die Zeile
  „abgerückt 12:47" ist weg, die Kopfzahl springt von 11 auf 12.
- Die Quittung nennt nur „THW Ansbach … — Folgemeldung 13:35: Stärke 18 → 19
  (+1) · Bemerkung: …". Kein Wort davon, dass die Einheit abgerückt war und
  jetzt wieder zählt.
- Füssen (abgerückt 11:36): Ein Bogen mit neuerem Stand und gleichem Inhalt
  führt zur Quittung „Folgemeldung 13:41: inhaltlich unverändert". Die
  Einheit ist danach anwesend, 8 Personen und 70 l Diesel zählen wieder in
  Lage, Lageblatt und Bedarf. „Änderungen" auf der Karte sagt „Inhaltlich
  unverändert … (nur der Meldestand ist neuer)". „Historie (2)" zeigt zwei
  Fassungen, keinen Statuswechsel.
- Lageblatt und Sammel-PDF führen beide als normale Zeilen. Der
  Nachtrag-PDF nennt Füssen „unverändert gegenüber 05.10.2026, 22:36" und
  „Stand am Meldekopf: … anwesend".
- Die Zeilen zum Exportstand zählen das als Abrücken: nach der Ansbach-Folge
  „Weitergegeben 13:40 — seitdem hier 1 neue Meldung und **1 Änderung
  (Abrücken)**", nach der Füssen-Folge „2 neue Meldungen und **2 Änderungen
  (Abrücken)**". Tatsächlich ist niemand abgerückt, zwei sind
  zurückgekommen.
- Eine ältere Fassung einer abgerückten Einheit bleibt dagegen richtig
  abgerückt und geht nur in die Historie („älterer Stand … gilt nicht"). Bei
  gleichem Stand fragt der Dialog „Zwei Fassungen mit demselben Stand — welche
  gilt?" und erwähnt dabei weder den Abrückzeitpunkt noch die Rückkehr.

**Erwartung der Rolle:** Wer eine Lage führt, sieht beim Einlesen: „Ansbach
war seit 12:47 abgerückt und zählt jetzt wieder mit." Der Statuswechsel steht
in der Quittung, an der Karte und im Nachtrag. Die Exportzeile benennt ihn
richtig („1 Änderung: wieder anwesend").

**Auswirkung im Einsatz:** Die Stärke der Lage steigt um die Kräfte einer
Einheit, die laut Führungsstelle schon wieder heimfährt (im Test +27 Personen und
+405 l Diesel durch Ansbach und Füssen). Wird ein Bogen aus Versehen ein zweites
Mal geschickt oder gescannt (Annahme: Mail, Messenger, nachgereichter Scan),
bleibt das unbemerkt, weil die Quittung nur nach Routine klingt. Der Stab
liest im Nachtrag „unverändert" und weiß nicht, warum die Einheit wieder in
seiner Summe steht. „Abrücken" in der Weitergabe-Zeile schickt die
Führungskraft auf die falsche Spur.

**Empfehlung:** Kommt zu einer abgerückten Einheit eine Fassung mit neuerem
Stand, in der Quittung und an der Karte ausdrücklich „war abgerückt seit
11:36, zählt wieder mit" nennen, mit „Wieder abrücken" gleich daneben, und
einen Vermerk wie beim Handweg schreiben. In den Zeilen zum Exportstand die
Richtung benennen („Wieder anwesend" statt „Abrücken"). Im Dialog „Zwei
Fassungen mit demselben Stand" bei abgerückten Einheiten den Abrückzeitpunkt
nennen.

**Verifikation:** Einheit abrücken, Sammel-PDF erzeugen, danach einen Bogen
derselben Einheit mit neuerem Stand einlesen. Quittung und Karte müssen den
Wechsel nennen, die Weitergabe-Zeile muss „Wieder anwesend" statt
„Abrücken" sagen, der Nachtrag muss die Rückkehr kennzeichnen.

### R5-K2 [P2] Lageblatt druckt „≠" als Fremdzeichen: „Verpflegung 12 ″` Stärke 8" (neu, Folge der Behebung von R4-K3)

**Priorität:** P2

**Nachweis:** gemessen (Lageblatt als Bild bei 200 dpi und `pdftotext`).

**Fundstelle / Aufgabe:** Lageblatt, Spalte „Einheit", Zeile „Rückfrage:" bei
Crailsheim (Folgemeldung −4, Verpflegung bleibt 12). Code:
`src/app/einheiten-tabelle.ts` Zeile 256 (`Verpflegung … ≠ Stärke …`); die
PDF-Schrift ist Helvetica mit WinAnsi-Kodierung (`pdffonts`), die kein „≠"
kennt.

**Beobachtung:** Auf dem Lageblatt steht „Rückfrage: Verpflegung 12 "` Stärke
8; Kennzeichen doppelt; Sitzplätze fehlen: 5". An der Stelle des Zeichens
druckt die Datei ein Anführungs-/Akzentzeichen. In der App (Karte „Verpflegung
8 ≠ Stärke 7") und im Excel („Rückfrage: Verpflegung 8 ≠ Stärke 7") steht das
Zeichen richtig. Die Sammel-PDF zitiert im Wortlaut und ist nicht betroffen.

**Erwartung der Rolle:** Das Stichwort ist auf Papier genauso lesbar wie am
Bildschirm.

**Auswirkung im Einsatz:** Wer mit dem Lageblatt durch den Bereitstellungsraum
geht, liest „12 [Zeichen] Stärke 8" und kann das als „12 von Stärke 8" oder
als Druckfehler deuten. Der Rückfragepunkt, den R4-K3 lesbar machen sollte,
ist gerade beim wichtigsten Stichwort (Verpflegung gegen Stärke) unklar.

**Empfehlung:** Auf dem Papier ein Zeichen verwenden, das die PDF-Schrift
kennt („Verpflegung 12, Stärke 8" oder „Verpfl. 12 / Stärke 8 prüfen").

**Verifikation:** Lageblatt mit einer Folgemeldung erzeugen, bei der
Verpflegung und Stärke auseinanderlaufen. `pdftotext` und Bild müssen das
Stichwort ohne Fremdzeichen zeigen.

### R5-K3 [P2] Übernahme-Quittung nach „Einsatz importieren…": ein Absatz mit 14 Widersprüchen, der Statuswechsel geht darin unter, Quittung unter dem Bildschirmrand (Rest von R4-K2)

**Priorität:** P2

**Nachweis:** gemessen (Telefon 360 × 640 und Laptop; zweites Gerät mit
Seed derselben Lage, Import der Sammel-PDF). Die Widerspruchszahl ist durch
meinen Aufbau bedingt (zwei Seed-Läufe, 14 Minuten Versatz), das Muster
nicht: Zwei Geräte vergeben ihre Eintreffzeit beim Empfang je selbst.

**Fundstelle / Aufgabe:** Zweites Gerät, Startseite, „Einsatz importieren…"
mit der Sammel-PDF, Lage danach in der Einsatzansicht. Code: `src/app/app.tsx`,
Meldung in `importiereEinsatzDatei`.

**Beobachtung:**
- Die Quittung ist jetzt in der Einsatzansicht, aber unter den drei
  Aufnahmeknöpfen: Oberkante bei 680 px (Telefon, 640 px hoch) und bei
  570 px (Laptop). Die Ansicht bleibt oben stehen (`scrollY` 0, die Überschrift
  hat den Fokus); anders als beim Einlesen von Bögen (dort `scrollY` 364 auf
  die Quittung) springt sie nicht hin. Beim ersten Blick sieht man sie nicht.
- Sie ist ein Fließtext von 882 px Höhe (1,4 Bildschirme am Telefon): „Einsatz
  „Hochwasser Jagst": 21 neue Meldung(en) ergänzt. 1 Meldung aktualisiert:
  Cottbus abgerückt 13:37. 14 Widersprüche zwischen den Geräten: Karlsruhe
  Eintreffzeit — hier eingetroffen 07:00, in der Datei eingetroffen 06:46; der
  Stand dieses Geräts bleibt; Ulm Eintreffzeit — …". Dreizehn der vierzehn
  Widersprüche sind Eintreffzeiten mit Minutenabstand, einer ist „Füssen
  Status — hier abgerückt 11:50, in der Datei abgerückt 11:36".
- „Cottbus abgerückt 13:37" und „Füssen Status" sind die einzigen Sätze, die
  eine Entscheidung verlangen. Sie stehen zwischen Zeitangaben.
- Der Schluss „Jetzt 15 Einheiten, davon 12 anwesend, 19 Folgemeldungen"
  zählt Einheiten, der Anfang „21 neue Meldung(en)" Fassungen. „19
  Folgemeldungen" ohne Bezug klingt nach 19 offenen Punkten.

**Erwartung der Rolle:** Beim Übernehmen sehe ich zuerst: „15 Einheiten, 12
anwesend, Stand 13:38. Cottbus abgerückt." Kleinkram wie Eintreffzeiten auf
die Minute steht eingeklappt dahinter.

**Auswirkung im Einsatz:** Wer die Lage übernimmt, scrollt an der Quittung
vorbei oder liest einen Absatz, der aus Minutenabweichungen besteht und den
einen Statuswechsel versteckt. Das Muster tritt jedes Mal auf, wenn zwei
Geräte dieselben Bögen empfangen haben.

**Empfehlung:** Die Quittung gliedern: erste Zeile Stand der Datei und Zahl
der Einheiten, danach Statuswechsel und Inhaltliches, Eintreffzeit-Differenzen
unter ein Aufklappen („13 kleine Abweichungen bei der Eintreffzeit"). Nach dem
Import wie beim Einlesen zur Quittung scrollen.

**Verifikation:** Sammel-PDF auf einem zweiten Gerät importieren, dessen
Eintreffzeiten abweichen. Die Quittung muss im ersten Bildschirm stehen, höchstens
fünf Zeilen lang sein und den Statuswechsel nennen.

### R5-K4 [P2] Am Telefon liegt die erste Einheitenkarte bei 2,6 Bildschirmen, mit Quittung bei 3,5 (Rest von R4-K5)

**Priorität:** P2

**Nachweis:** gemessen (Telefon 360 × 640, 320 × 568, Tablet, Laptop).

**Fundstelle / Aufgabe:** Einsatzansicht, Sammlung mit 11 zählenden Einheiten
und drei Zugblöcken. Code: `src/app/einsaetze-ui.tsx` (Kopfzahlen,
Aufnahmeknöpfe, Bedarf, Zwischensummen, Such-/Filterzeile).

**Beobachtung:**

| Gerät | erste Karte | Überschrift „Einheiten (…)" | mit Quittung (6 Bögen) |
| --- | --- | --- | --- |
| Telefon 360 × 640 | 1 649 px (2,58 Bildschirme) | 1 223 px | 2 224 px (3,48) |
| Telefon 320 × 568 | 1 732 px (3,05) | 1 305 px | 2 391 px (4,21) |
| Tablet 820 × 1180 | 940 px (0,80) | 750 px | 1 275 px (1,08) |
| Laptop 1366 × 768 | 380 px (0,49) | 190 px | 380 px (0,49) |

- Am Laptop ist der Umbau gelungen. Am Telefon steht zwischen Kopfzahlen und
  Liste weiter ein Stapel: fünf Kopfzahlen in zwei Spalten, drei Aufnahmeknöpfe,
  Bedarf mit sechs Zeilen, Zeile „Zwischensummen" (zu), Sprunghinweis, Überschrift,
  Karten/Tabelle, Suche, Sortierung, Qualifikation (Auswahl mit rund 45
  Einträgen), Kästchen „nur dringender Bedarf".
- Bei 11 Einheiten war die Such-/Filterzeile offen. Laut Stand der Behebung
  klappt sie erst bei weniger als zehn Einheiten zu; die Schwelle habe ich
  nicht nachgestellt. Eine Sammlung mit zehn und mehr Einheiten ist aber
  gerade die, in der man die Liste braucht.
- „Zuletzt gemeldete oben zeigen" wirkt: Die Ansicht springt (`scrollY`
  1 768), die erste Karte („neu", „⚠ Anderer Einsatz?") steht bei 426 px im
  Bild. Der Link ist also die Abkürzung; ohne ihn bleibt der lange Weg.

**Erwartung der Rolle:** Nach Kopfzahlen und Bedarf ist die Liste das Nächste.

**Auswirkung im Einsatz:** Am Telefon muss man pro Blick auf die Einheiten
rund zwei Bildschirmhöhen überwinden, oder man kennt den Sprunglink. Mit
Quittung sind es 3,5.

**Empfehlung:** Am Telefon die Kopfzahlen einzeilig (5 Zahlen in einer Reihe
oder zwei Reihen), den Bedarf eingeklappt mit einer Summenzeile, die
Such-/Filterzeile hinter einer Zeile auch bei mehr als zehn Einheiten.

**Verifikation:** Telefon, Sammlung mit 11 Einheiten und drei Zügen: erste
Karte höchstens zwei Bildschirmhöhen unter dem Seitenanfang.

### R5-K5 [P2] „Anderer Einsatz?" steht nur in der App; Lageblatt, Sammel-PDF, CSV und Excel zählen den fremden Bogen kommentarlos (Rest von R4-K6)

**Priorität:** P2

**Nachweis:** gemessen (Neu-Ulm mit „Brandeinsatz Lagerhalle Ulm" in der Lage
„Hochwasser Jagst · Möckmühl").

**Fundstelle / Aufgabe:** Einlesen des Bogens, danach Lageblatt, Sammel-PDF,
beide CSV, Excel.

**Beobachtung:**
- In der App gelungen: Die Quittung sagt „… — neu gemeldet — ⚠ Bogen nennt:
  „Brandeinsatz Lagerhalle Ulm", passt das zu dieser Lage?". Die Karte trägt
  die Marke „⚠ Anderer Einsatz?" (zugeklappt am Telefon) und „Zählt trotzdem
  mit". Die Marke bleibt auch nach „Zur Kenntnis genommen". „Mehr…" bietet
  „Verschieben…" und „Entfernen".
- Im Lageblatt steht Neu-Ulm als gewöhnliche Zeile („Erstmeldung"), in
  „13 Einheiten zählend … 133" mit eingerechnet. Dasselbe in der
  Sammel-PDF und in der Summenzeile der CSV. Im Excel steht der Ort in der
  Spalte „Aufträge" („Brandeinsatz Lagerhalle Ulm") ohne Kennzeichnung,
  zwischen zwölf Zeilen mit „Hochwasser Jagst – Deichsicherung Möckmühl".
- Die Tabellenansicht in der App trägt keine Marke (so in der Behebung
  vermerkt).

**Erwartung der Rolle:** Was auf dem Lageblatt an der Wand und beim Stab
landet, trägt dieselbe Warnung wie die App.

**Auswirkung im Einsatz:** Die Warnung lebt nur auf dem Bildschirm der
Führungskraft, die den Bogen eingelesen hat. Das Papier und der Stab zählen
Kräfte, die laut Bogen für eine andere Lage gemeldet sind, und planen mit
ihnen. Nach dem Quittieren sieht auch die nächste Führungskraft nur noch die
Marke an der Karte.

**Empfehlung:** Auf dem Lageblatt und in den Exporten eine Spalte oder einen
Zusatz „Bogen nennt: Brandeinsatz Lagerhalle Ulm" bei Einheiten, die nicht zum
Ort der Lage passen. Nicht sperren.

**Verifikation:** Bogen mit fremdem Ort einlesen, Lageblatt und CSV erzeugen;
die Zeile muss den Hinweis tragen, passende Einheiten nicht.

### R5-K6 [P3] Nachtrag-Excel und Nachtrag-„Alle Daten" tragen die Teilmenge nur im Dateinamen (Rest von R4-W4)

**Priorität:** P3

**Nachweis:** gemessen (Nachtrag nach 2 neuen Bögen und einem Abrücken).

**Fundstelle / Aufgabe:** Nachtrag-Dateien „eeb-einsatz-nachtrag-seit-20261006-1337-…".

**Beobachtung:**
- Nachtrag-PDF: gut gekennzeichnet („NACHTRAG seit 13:48 — nicht die ganze
  Lage", Fußzeile „NACHTRAG … (nicht die ganze Lage)", Kasten „Bedarf
  Nachtrag"). Übersicht-CSV: Zeile „Summe Nachtrag (2 Einheiten)".
- Nachtrag-Excel: nichts in der Tabelle sagt, dass es nur drei Zeilen aus
  einer Lage von 13 sind. Die Summenzeile `SUBTOTAL(9,AA3:AA4)` rechnet über
  die zwei anwesenden Einheiten (18 Personen) und sieht aus wie die Lage.
  Cottbus steht darunter im Block „Nicht in der Lage gezählt".
- „Alle Daten"-CSV als Nachtrag: 44 statt 200 Zeilen, ohne Kennzeichnung.
- In der Übersicht-CSV sind es drei Zeilen, die Summe nennt „2 Einheiten"
  (Cottbus ist abgerückt und zählt nicht); das ist richtig, aber ohne
  Erklärung.

**Auswirkung im Einsatz:** Wer die Datei umbenennt oder in eine
Stabstabelle kopiert, verliert die Kennzeichnung und hat eine Lage von 18
Personen vor sich.

**Empfehlung:** In Excel und „Alle Daten" eine Kopf-/Fußzeile „NACHTRAG seit
13:37 — nicht die ganze Lage" wie im PDF; Summenzeile entsprechend benennen.

**Verifikation:** Nachtrag-Excel öffnen: Die erste Zeile muss „Nachtrag"
nennen, die Summenzeile „Summe Nachtrag".

### R5-K7 [P3] Lageblatt: „… und 4 weitere Änderungen" verbirgt Bedarfsänderungen (neu)

**Priorität:** P3

**Nachweis:** gemessen (Lageblatt, Zeilen Ansbach, Cottbus, Crailsheim).

**Fundstelle / Aufgabe:** Lageblatt, Spalte „Veränderung seit der letzten
Meldung".

**Beobachtung:** Ansbach: „Gesamtstärke: von 18 auf 19 … und 4 weitere
Änderungen". Laut Sammel-PDF stecken darin Unterbringung (M 12 → 13), neues
Personal und die Bemerkung. Cottbus: „von 12 auf 14 … und 4 weitere", dahinter
Unterbringung M 11 → 13. Weinsberg dagegen nennt Diesel und Sonstiges
ausgeschrieben. Die Fußzeile verweist für alles Weitere auf die Sammel-PDF.

**Erwartung der Rolle:** Änderungen an Unterbringung und Kraftstoff, die den
Bedarf bewegen, stehen auf dem Lageblatt, die Personalnamen nicht.

**Auswirkung im Einsatz:** Gering. Auf dem Papier ist die Zeile mit der
Stärke ehrlich; ein verändertes Unterbringungsanliegen bleibt aber ungesehen,
solange die Spalte „Bedarf" nicht gegen die alte Fassung gelesen wird.

**Empfehlung:** Reihenfolge der Änderungen nach Bedarfsrelevanz (Stärke,
Unterbringung, Kraftstoff, Auftrag), Personalnamen zusammenfassen („3 Personen
neu").

**Verifikation:** Folgemeldung mit geänderter Unterbringung erzeugen; das
Lageblatt muss sie in der Spalte nennen.

## Verweise auf Befunde in anderen Runde-5-Berichten

Hier nicht erneut gezählt:

- **Sammel-PDF-Nachtrag nach einer Weitergabe:** „Sammel-PDF: noch nicht in
  diesem Format exportiert — alle Bögen sind neu", obwohl kurz zuvor „Einsatz
  weitergeben / sichern" lief; der Nachtrag ist dann die ganze Lage (39 statt
  35 Seiten, in meinem Lauf gemessen). Siehe
  [arbeitsablauf.md](arbeitsablauf.md).
- **Schwebendes „◐" links unten überdeckt Karten- und Knopftext** (am Telefon
  und auch am Laptop, z. B. „WC/Dusche" und Bemerkungstexte). Siehe
  [neuer-nutzer.md](neuer-nutzer.md).

Nicht nachgestellt, aber für die Führung relevant und in
[zerstoerende-handlungen.md](zerstoerende-handlungen.md) beschrieben: Eine
Geräteuhr, die weit vorgeht, löscht Sammlungen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Weitergabe-Vermerk:** „Weitergegeben 13:37 — seitdem hier 2 neue
  Meldungen und 1 Änderung (Abrücken). Führt inzwischen ein anderes Gerät die
  Lage, fehlt das dort: erneut weitergeben." steht gelb im Kopf, auch am
  Telefon. Nach einer Weitergabe heißt es „seitdem hier nichts Neues".
- **Lageblatt- und Exportzeilen:** „Lageblatt erstellt 13:37 · seitdem 1
  Änderung (Abrücken) — Aushang ist nicht mehr aktuell, neu drucken". Je
  Format ein eigener Bezugspunkt (Übersicht-CSV, „Alle Daten", Excel, Sammel-
  PDF); ein CSV-Nachtrag verschiebt nur sein eigenes Format.
- **„Nur neue Bögen":** Das Kästchen zeigt je Format „zuletzt 13:37 · seitdem
  2 neue Bögen und 1 Änderung (Abrücken)" und erst dann die Nachtrag-Knöpfe.
  Das Abrücken geht in den Nachtrag ein (Cottbus: „abgerückt", „zählt in
  Lage: nein", im Excel im Block „Nicht in der Lage gezählt").
- **Nachtrag-PDF:** „Übergabe-Übersicht NACHTRAG seit 13:48: Hochwasser
  Jagst … nicht die ganze Lage: 1 Einheit zählend", eigener Bedarfskasten,
  Fußzeile mit „NACHTRAG".
- **Unterbringungs-Spalten der CSV:** „Unterbringung angefordert M / W / D"
  je Einheit; die Summe der anwesenden (Cottbus 13/1, Erlangen 10/5, Neu-Ulm
  4/3, Radolfzell 2/1, Sinsheim 7/4, Weinsberg 14/5) ergibt 50 / 19 / 0 =
  69, wie Kopf, Lageblatt und Sammel-PDF. Rückfrage-Spalte und getrennte
  Fahrzeugspalten sind da.
- **Zeiten einer Folgemeldung:** ein älterer Stand einer Einheit geht nur in
  die Historie und lässt sie abgerückt („älterer Stand … nachgereicht, gilt
  nicht"); ein gleicher Stand fragt nach.
- **Import-Quittung beim Einlesen:** Nach „Bögen einlesen…" scrollt die
  Ansicht auf die Quittung („6 Bögen aufgenommen. Neu seit der letzten
  Kenntnisnahme (6): …"). Bemerkungen im Wortlaut (60 Zeichen), Stärkeverlust
  mit Vorzeichen („12 → 8 (−4)"), „Diesel 150 l → 500 l".
- **„Zuletzt gemeldete oben zeigen"** sortiert und springt zur Liste; die
  erste Karte ist die neue Einheit. Nach „Zur Kenntnis genommen" verschwinden
  „neu" und „neue Fassung".
- **Laptop zweispaltig:** erste Einheitenkarte bei 380 px, links Kopfzahlen,
  Aufnahme, Bedarf, rechts die Liste, Weitergabe und Export darunter.
- **Lageblatt:** Stichworte („Rückfrage: Sitzplätze fehlen: 2"), Block
  „Abgerückt (1)" mit „ab 11:36", Veränderungsspalte, Nachtragszeilen von
  Hand, Summe laut Gerät. Die Sammel-PDF zitiert jede Rückfrage im Wortlaut
  („Rückfragen (3): …").
- **Zwischensummen je Zug** in der App mit Betriebsstoff („Diesel 240 l ·
  Gemisch 10 l"), gleiche Zahlen wie auf dem Lageblatt.

## Abschluss

- **Aufgabe geschafft:** ja. Umwege bei der Frage, was eine Folgemeldung nach
  dem Abrücken bewirkt (R5-K1), und bei der Übernahme auf einem zweiten Gerät
  (R5-K3).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Folgemeldung … inhaltlich unverändert" klingt
  nach „nichts passiert", holt aber eine abgerückte Einheit in die Lage
  zurück (R5-K1).
- **Größtes Einsatzrisiko:** Eine versehentlich nachgereichte Meldung einer
  abgerückten Einheit hebt deren Stärke und Bedarf wieder in die Lage, ohne
  dass es jemand sagt (R5-K1).
- **Top-Priorität für die nächste Iteration:** Den Wechsel „abgerückt →
  wieder anwesend" bei Folgemeldungen in Quittung, Karte, Nachtrag und
  Exportzeilen benennen (R5-K1).

## Abgleich mit Runde 4

Grundlage: [../runde-4/fuehrungssicht.md](../runde-4/fuehrungssicht.md)
einschließlich „Stand der Behebung" und
[../runde-4/README.md](../runde-4/README.md).

| Runde-4-Befund | Behebung laut Runde 4 | Bewertung Runde 5 | Beobachtung |
| --- | --- | --- | --- |
| R4-K1 „Seitdem keine neue Meldung" trotz Abrücken (P1) | behoben | hält, mit Rest | Lageblatt-, Export- und Weitergabe-Zeile nennen „1 Änderung (Abrücken)", das Lageblatt sagt „Aushang ist nicht mehr aktuell, neu drucken"; der Nachtrag nimmt das Abrücken mit (CSV, Excel, PDF). Rest: Eine Rückkehr durch Folgemeldung wird als „Abrücken" gezählt und nirgends benannt (R5-K1). |
| R4-K2 Import-Quittung am Seitenende (P2) | behoben | teilweise | Die Quittung steht in der Einsatzansicht und nennt „Jetzt 15 Einheiten, davon 12 anwesend". Am Telefon liegt sie bei 680 px unter den Aufnahmeknöpfen ohne Sprung, ist ein Absatz von 882 px, und „21 neue Meldung(en)" zählt weiter Fassungen (R5-K3). Beim Einlesen von Bögen springt sie dagegen richtig. |
| R4-K3 Rückfragen abgeschnitten (P2) | behoben | hält, aber verkehrt sich an einer Stelle | Die Stichworte sind lesbar, die Sammel-PDF zitiert alles. Das neue Stichwort „Verpflegung 12 ≠ Stärke 8" druckt auf dem Lageblatt ein Fremdzeichen (R5-K2). |
| R4-K4 „Sonstiges geändert" (P2) | behoben | hält | „Bemerkung: „Ölsperre gerissen, 300 m Sperre nachfordern"" in der Kenntnisliste, ebenso „Bemerkung: „Wieder im Einsatz, Pumpen-Nachschub Deich"". |
| R4-K5 Einheitenliste weit unten (P2) | weitgehend | teilweise | Laptop 380 px (hält), Tablet 0,8 Bildschirme, Link „Zuletzt gemeldete oben zeigen" springt zur Liste (hält). Telefon 2,6 Bildschirme (11 Einheiten, 3 Züge), mit Quittung 3,5; bei 320 × 568 3,05 (R5-K4). Das bleibt die im Stand der Behebung genannte Grenze. |
| R4-K6 Bogen eines anderen Einsatzes (P2) | behoben | hält, mit Rest | Marke „⚠ Anderer Einsatz?" an der Karte, Hinweis in der Quittung, bleibt nach Kenntnisnahme. Lageblatt, Sammel-PDF, CSV und Excel tragen nichts (R5-K5), die Tabelle nach eigener Angabe auch nicht. |
| R4-K7 Neu-Marken uneinheitlich (P3) | behoben | hält | „neu" steht auch zugeklappt am Telefon; „neu" und „neue Fassung" verschwinden mit „Zur Kenntnis genommen". |
| R4-K8 Kleinere Stellen (P3) | behoben | hält | Zwischensummen je Zug mit Betriebsstoff, Spalte „Rückfrage" in der Übersicht-CSV und im Excel, „Fahrzeuge (Anzahl)" und „Fahrzeuge (Liste)" getrennt. Silbentrennung der Tabelle auf dem Tablet nicht nachgeprüft. |

Bilanz: Von acht Runde-4-Befunden halten drei ganz (K4, K7, K8), zwei mit
kleinem Rest (K1, K6) und zwei nur teilweise (K2, K5). Eine Behebung hat sich
an einer Stelle verkehrt: Das Stichwort aus R4-K3 druckt ein Fremdzeichen
(R5-K2). Neu und aus Runde 4 nicht ableitbar ist R5-K1, die Folgemeldung nach
dem Abrücken; sie berührt die in R4-K1 eingeführte Zählung der Änderungen, die
den Statuswechsel in beiden Richtungen „Abrücken" nennt.

Die anderen Runde-5-Berichte lagen bei Abschluss nur als Entwürfe vor; die
Verweise oben stammen daraus.
