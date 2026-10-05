# Audit „Führungssicht", Runde 4 (Lage erfassen, Abweichungen sehen, Stand übergeben)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit 3dd2ab5.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch` auf Telefon und Tablet, Locale de-DE, Zeitzone
Europe/Berlin. Geräte: Telefon 360 × 640, Tablet 820 × 1180, Laptop
1366 × 768. Jeder Lauf hatte einen eigenen Browser-Kontext, die Übergabe lief
über einen zweiten Kontext als zweites Gerät. Elf weitere Prüfer nutzten
denselben Server. Laufzeiten (Sammel-PDF rund 10 s) sind deshalb nicht
belastbar und werden nicht bewertet. Ich habe zuerst ohne Blick in frühere
Berichte getestet. Den Runde-3-Bericht samt „Stand der Behebung" und die
Runde-4-Berichte der anderen Rollen habe ich erst danach gelesen.

Den Grundzustand habe ich über `localStorage`-Seeds (`eeb.einsaetze.v1`,
`eeb.entwurf.v1`, `eeb.vorlagen.v1`) aus `examples/thw/` gesetzt, alle mit
`uebung: false` und mit Stand und Einsatzzeitraum auf dem Prüftag. Ich habe
bewusst eine andere Lage als in Runde 3 gebaut:

**Lage „Hochwasser Jagst · Möckmühl"** (Art „Einsatz"):

| Einheit | Quelle | Stärke | Lage-Zustand |
| --- | --- | --- | --- |
| THW Karlsruhe ZTr TZ, Sinsheim FGr W (B), Ulm B | `thw/006`, `012`, `013` | 4 / 11 / 6 → 8 | Zug „1. TZ Karlsruhe"; Sinsheim mit Auftrag; Ulm mit Folgemeldung (+2) |
| THW Landshut ZTr TZ, Mühldorf B, Deggendorf FGr WP (A) | `thw/022`, `024`, `017` | 4 / 9 / 12 | Zug „2. TZ Landshut" |
| THW Weinsberg FGr Öl (C) | `thw/014` | 19 | Auftrag „Ölsperre Jagst Wehr Ruchsen"; Folgemeldung: Diesel 150 → 500 l, Sonstiges „Ölsperre gerissen, 300 m Sperre nachfordern" |
| THW Crailsheim FGr W (A) | `thw/003` | 12 → 8 | Erstmeldung am Vortag, Folgemeldung −4 Helfer |
| THW Cottbus FGr I | `thw/033` | 12 → 14 | Auftrag; Folgemeldung +2 |
| THW Erlangen FGr Öl (B), Radolfzell Tr Log-TS | `thw/018`, `010` | 15 / 3 | ohne Zug; Erlangen „Manuell erfasst" |
| THW Ansbach FGr Log-MW, Füssen FGr K (A) | `thw/015`, `019` | 18 / 8 | abgerückt |
| THW Biberach/Riß FGr O (B) | `thw/002` | 11 | neu per Datei eingelesen |

Dazu kamen eine zweite Sammlung „Übung Stegbau" (eine Einheit), ein eigener
Entwurf (B Regen) und eine Vorlage (B Starnberg). Stand nach dem Einlesen:
14 gemeldet · 12 zählend · 2 / 29 / 87 / 118 · 32 Fahrzeuge.

Die vier Folgemeldungen und Biberach habe ich nicht in den Seed geschrieben.
Sie liefen über „Bögen einlesen…" (JSON, auf dem Laptop über „Dateien
wählen…"). In Zusatzläufen habe ich außerdem eingelesen: einen
Übungsbogen (Hilpoltstein), einen Bogen mit fremdem Ort/Auftrag (Schwabach,
„Waldbrand Gräfenberg") und einen drei Tage alten Bogen (Bamberg).

Geprüft habe ich Kopfzahlen, Bedarf, Zwischensummen je Zug, Karten (kompakt
und aufgeklappt), Tabelle, Sortierung, Suche, den Filter „nur dringender
Bedarf", die Sammelquittung „Neu seit der letzten Kenntnisnahme" (auch nach
Neuladen), Abrücken mit „Rückgängig", Auftrag vergeben, die
Aktualitätszeilen für Lageblatt, Export und Weitergabe nach Abrücken und
Auftrag sowie die Startseite. Für die Übergabe habe ich die Sammel-PDF auf
einem frischen Tablet-Kontext über „Einsatz importieren…" eingelesen.
Lageblatt (2 Seiten), Sammel-PDF (37 Seiten), „Übersicht als CSV", „Alle
Daten als CSV" und die Excel-Liste „Oldenburg" habe ich heruntergeladen und
gegengelesen: `pdftotext`, `pdftoppm`, Schriftgrößen über `pdftotext -bbox`,
XLSX als XML ausgelesen. Die Screenshots habe ich angesehen. Positionen auf
der Seite habe ich mit `getBoundingClientRect` gemessen.

**Nicht prüfbar:** Kamera-Scan, Handscanner, Link-Weg einer Folgemeldung,
Nahbereichs-Weitergabe, echtes Drucken (die Lesbarkeit des Lageblatts habe
ich nur aus dem PDF beurteilt), Darstellung der Excel-Datei in
Excel/Numbers/Vorschau-Apps, native Builds, das Verhalten nach mehr als 30
Minuten Echtzeit (Ablauf der Marken „neue Fassung"/„kürzlich eingetroffen",
nur im Code gelesen).

Annahmen zum Ablauf, nicht aus Vorschriften belegt:
- Das Lageblatt hängt an der Wand oder geht an den Stab, und die
  Führungsstelle druckt es neu, wenn die App sagt, dass es veraltet ist.
- Freitext der Einheit kann Nachforderungen enthalten.
- Bögen können auch per Datei (Mail, Messenger) hereinkommen, also nicht nur
  von Einheiten, die vor dem Meldekopf stehen.

## Urteil

Die Lage ist auf allen drei Geräten gut zu führen, und die Frage aus Runde 3
„Was ist seit meinem letzten Blick neu?" beantwortet die App jetzt
überzeugend. Nach dem Einlesen von fünf Bögen steht oben die Liste „Neu seit
der letzten Kenntnisnahme (5)" mit „Crailsheim — Folgemeldung 22:36: ▼ Stärke
12 → 8 (−4)". Sie übersteht ein Neuladen, und auf der Startseite steht „3 neu
seit der letzten Kenntnisnahme". Die Folgemeldungen tragen auch zugeklappt
auf dem Telefon „neue Fassung" und „Folgem. 22:36 · 12 → 8". „Zuletzt
gemeldet" stellt sie nach oben. Zahlen, Unterbringung (6 Einheiten, 73
Personen, 54 / 19 / 0, von Hand nachgerechnet), Bemerkungen der Einheiten
und Rückfragen stimmen in App, Lageblatt, Sammel-PDF, CSV und Excel überein.
Die Übergabe per Sammel-PDF bringt Abrücken, Auftrag, Züge und Historie
vollständig auf das zweite Gerät.

Reibung entsteht an einer neuen Stelle: der Frage, ob das Papier noch
stimmt. Nach einem Abrücken meldet die Weitergabe-Zeile „seitdem hier 1
Änderung (Abrücken)". Darunter steht für Lageblatt und Export „seitdem keine
neue Meldung", obwohl auf dem Lageblatt an der Wand jetzt elf Helfer zu viel
stehen (R4-K1). Die Bestätigung der Übernahme auf dem zweiten Gerät liegt am
Seitenende unter „Einsatz löschen…" (R4-K2). Rückfragen sind auf Papier zu
„Verpflegung für 12 Personen an … + 2 weitere" gekürzt (R4-K3). Die
Kenntnisliste nennt bei einer Nachforderung im Freitext nur „Sonstiges
geändert" (R4-K4).

Die Lage lässt sich ohne fremde Hilfe erfassen, führen und übergeben. Ob ein
Ausdruck noch gilt, muss man nach Statuswechseln selbst im Kopf behalten.

## Befunde

### R4-K1 [P1] „Seitdem keine neue Meldung" am Lageblatt und Export, obwohl seither abgerückt wurde (neu)

**Priorität:** P1

**Nachweis:** gemessen (Laptop 1366 × 768 und Telefon 360 × 640).

**Fundstelle / Aufgabe:** Einsatzansicht, Block „Einsatz weitergeben /
sichern" und Startseitenkarte der Sammlung. Ich habe Lageblatt, Sammel-PDF
und „Übersicht als CSV" erzeugt, danach Sinsheim (11 Helfer) abrücken lassen
und Mühldorf einen Auftrag gegeben. Code: `src/app/einsaetze-ui.tsx` um
Zeile 765–780 (`lageblattStand`, `neueEintraege` gegenüber `aenderungenSeit`)
und `src/app/export-stand.ts`.

**Beobachtung:**
- Nach dem Abrücken stehen in derselben Ansicht drei Zeilen
  untereinander:
  - „Weitergegeben 05.10.2026, 22:45 — seitdem hier 1 Änderung (Abrücken).
    Führt inzwischen ein anderes Gerät die Lage, fehlt das dort: erneut
    weitergeben."
  - „Lageblatt erstellt 05.10.2026, 22:45 · seitdem keine neue Meldung"
  - „Zuletzt exportiert 05.10.2026, 22:45 · seitdem keine neuen Bögen"
- Die Startseite zeigt dazu: „Lageblatt 05.10.2026, 22:45 (seitdem keine
  neue Meldung) · Export 05.10.2026, 22:45 (seitdem keine neue Meldung) ·
  Weitergegeben 05.10.2026, 22:45 (seitdem keine neue Meldung, 1
  Änderung)".
- Auch nach Abrücken und Auftrag zusammen bleibt die Lageblatt-Zeile bei
  „keine neue Meldung". Erst eine Folgemeldung per Datei macht daraus
  „seitdem 1 neue Meldung".
- Das Lageblatt an der Wand zählt Sinsheim weiter mit (118 statt 107
  Helfer, Unterbringung 73 statt 62 Personen).
- Mit dem Häkchen „Nur neue Bögen seit dem letzten Export" sind die
  Exportknöpfe gesperrt. Eine Teil-CSV für den Stab kann das Abrücken also
  gar nicht weitergeben.

**Erwartung der Rolle:** Die Zeile am Lageblatt sagt mir, ob der Aushang
noch stimmt. Ein Abrücken ändert Stärke und Bedarf und macht das Blatt
ungültig.

**Auswirkung im Einsatz:** Die Führungsstelle liest „keine neue Meldung"
und druckt nicht neu. Am Lageblatt und beim Stab, der mit Teilexporten
arbeitet, stehen dann eine abgerückte Fachgruppe und ihre Unterbringung
weiter in der Lage. Gerade die Weitergabe-Zeile darüber zeigt, dass die App
die Änderung kennt. Das macht die Lageblatt-Zeile glaubwürdig und damit
gefährlicher.

**Empfehlung:** Lageblatt- und Export-Zeile so zählen wie die Weitergabe:
neue Meldungen und Änderungen an bekannten Einheiten (Abrücken, Wieder
anwesend, Zug, Auftrag, Zeiten), mit Art („seitdem 1 Änderung: Abrücken —
Lageblatt neu drucken"). Für Teilexporte entweder Statuswechsel mitnehmen
oder ehrlich sagen, dass sie fehlen.

**Verifikation:** Lageblatt und CSV erzeugen, eine Einheit abrücken. Alle
drei Zeilen und die Startseitenkarte müssen „1 Änderung (Abrücken)" nennen.
Nach dem Zurücknehmen mit „Rückgängig" müssen sie wieder „nichts Neues"
nennen.

### R4-K2 [P2] Übernahme-Quittung nach „Einsatz importieren…" steht am Seitenende und zählt Fassungen statt Einheiten (Rest von R3-K5)

**Priorität:** P2

**Nachweis:** gemessen (Tablet 820 × 1180, frischer Kontext).

**Fundstelle / Aufgabe:** Zweites Gerät übernimmt die Lage über
„Einsatz importieren…" mit der Sammel-PDF. Code: `src/app/app.tsx`, Meldung
in `importiereEinsatzDatei` (um Zeile 2811) und Ausgabe hinter der
Einsatzansicht (um Zeile 2905).

**Beobachtung:**
- Nach dem Import öffnet die App direkt die Sammlung, oben ohne jeden
  Hinweis. Der Kopf zeigt „letzte Meldung 05.10.2026, 22:42".
- Der Satz „Einsatz „Hochwasser Jagst" importiert (18 Meldung(en)). Letzte
  Meldung darin: 05.10.2026, 22:42." steht bei y = 4 851 px von 5 773 px,
  also unter „Einsatz löschen…" und vier Bildschirmhöhen unter dem
  sichtbaren Bereich.
- „18 Meldung(en)" zählt Fassungen. Die Ansicht darüber sagt „Einheiten (14
  gemeldet · 11 zählend)".
- Dieselbe Stelle trägt laut Code auch den Hinweis zu vor Ort entfernten
  Meldungen (`geklaert.hinweis`) und Importfehler (Risiko, nicht
  nachgestellt).

**Erwartung der Rolle:** Wer eine Lage übernimmt, sieht oben in einem Satz:
übernommen, wie viele Einheiten, Stand von wann, und ob etwas auffällig war.

**Auswirkung im Einsatz:** Die übernehmende Führungskraft weiß nicht
sicher, ob der Import geklappt hat oder ob sie eine ältere Sammlung vor sich
hat. Ein Hinweis auf entfernte Meldungen bleibt ungelesen. „18" gegen „14"
führt zu Rückfragen beim Übergebenden.

**Empfehlung:** Die Übernahme-Quittung oben in der Einsatzansicht zeigen,
wie die Sammelquittung beim Einlesen. Sie soll Einheiten zählen („14
Einheiten, davon 11 anwesend, 4 Folgemeldungen") und den Stand der Datei
nennen.

**Verifikation:** Sammel-PDF auf einem frischen Telefon importieren. Die
Quittung muss ohne Scrollen sichtbar sein und dieselbe Einheitenzahl nennen
wie die Liste.

### R4-K3 [P2] Rückfragen auf Lageblatt und Sammel-PDF abgeschnitten (neu, Folge der Behebung von R3-K7)

**Priorität:** P2

**Nachweis:** gemessen (`pdftotext` von Lageblatt und Sammel-PDF).

**Fundstelle / Aufgabe:** Spalte „Einheit", Zeile „Rückfrage:" auf
Lageblatt und Übergabe-Übersicht der Sammel-PDF. Code:
`src/app/einheiten-tabelle.ts`, `lueckeKurz`/`lueckenText` (Zeile 151–170).

**Beobachtung:**
- Crailsheim: „Rückfrage: Verpflegung für 12 Personen an … + 2 weitere"
- Landshut: „Rückfrage: Alle 4 Personen stehen auf Ges …"
- Schwabach (Zusatzlauf): „Alle 9 Personen stehen auf Ges … + 1 weitere"
- In der App, auf der Karte „Kennzeichen auf Anh steht mehr …"
- Bekannte Punkte werden gut übersetzt („Sitzplätze fehlen: 4"). Alles
  andere wird nach 30 Zeichen abgeschnitten.
- In der App lässt sich die Rückfrage aufklappen, auf Papier nicht. Auch
  die Sammel-PDF, nach eigener Fußzeile die Fassung mit „allen Änderungen im
  Einzelnen", hat nur die gekürzte Fassung.

**Erwartung der Rolle:** Was ich bei der Einheit nachfragen soll, kann ich
vom Blatt ablesen.

**Auswirkung im Einsatz:** Wer mit dem Lageblatt durch den
Bereitstellungsraum geht, weiß bei „Verpflegung für 12 Personen an …" nicht,
was zu klären ist, und hat zwei weitere Rückfragen gar nicht vor sich. Die
Rückfrage bleibt liegen oder wird erst am Gerät nachgeschlagen.

**Empfehlung:** Für die häufigen Prüfpunkte weitere Stichworte vergeben
(„Verpflegung 12 ≠ Stärke 8", „alle auf Gesamt, keine Namen",
„Kennzeichen-Anzahl prüfen"). Auf dem Papier sollten alle Rückfragen ganz
stehen, zumindest in der Sammel-PDF.

**Verifikation:** Lage mit Crailsheim (Folgemeldung −4) und Landshut
drucken. Jede Rückfrage muss auf dem Lageblatt verständlich sein, und die
Sammel-PDF muss alle Rückfragen vollständig enthalten.

### R4-K4 [P2] Kenntnisliste nennt bei geänderter Bemerkung nur „Sonstiges geändert" (neu)

**Priorität:** P2

**Nachweis:** beobachtet (Telefon, Tablet, Laptop).

**Fundstelle / Aufgabe:** Sammelquittung „Neu seit der letzten
Kenntnisnahme" nach der Folgemeldung von Weinsberg. Code:
`src/app/einheiten-tabelle.ts` Zeile 241–243 (`${a.feld} geändert`).

**Beobachtung:** Die Zeile lautet „THW Weinsberg Fachgruppe Ölschaden (C) —
Folgemeldung 22:36: Diesel 150 l → 500 l · Sonstiges geändert". Der Inhalt
„Ölsperre gerissen, 300 m Sperre nachfordern" steht erst auf der
aufgeklappten Karte („Bemerkung der Einheit (neu): …"). Zugeklappt auf dem
Telefon steht nur die Marke „Bemerkung neu". Lageblatt und Sammel-PDF
bringen den Text vollständig.

**Erwartung der Rolle:** In der Liste „was ist neu" steht eine Nachforderung
im Wortlaut, mindestens gekürzt.

**Auswirkung im Einsatz:** Die Führungsstelle quittiert „Zur Kenntnis
genommen", weil „Sonstiges geändert" nach Routine klingt. Die Nachforderung
von 300 m Ölsperre bleibt liegen, bis jemand die Karte aufklappt.

**Empfehlung:** In der Kenntnisliste die neue Bemerkung gekürzt zitieren
(etwa 60 Zeichen, „Bemerkung: „Ölsperre gerissen, 300 m Sperre
nachfordern""). Auf der Kompaktzeile genügt die Marke.

**Verifikation:** Folgemeldung nur mit geänderter Bemerkung einlesen. Die
Kenntnisliste muss den neuen Text zeigen.

### R4-K5 [P2] Einheitenliste weit unten; „Zuletzt gemeldete oben zeigen" führt nicht dorthin (neu)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht nach dem Einlesen von fünf Bögen,
Link „Zuletzt gemeldete oben zeigen" in der Kenntnisliste. Code:
`src/app/einsaetze-ui.tsx` Zeile 1171 (nur `setSortierung("zuletzt")`).

**Beobachtung:**
- Die erste Einheitenkarte liegt auf dem Telefon bei 2 535 px (640 px hoch,
  also rund vier Bildschirme), auf dem Tablet bei 1 459 px (1 180 px hoch)
  und am Laptop bei 1 439 px (768 px hoch).
- Darüber stehen Kopfzahlen, drei Aufnahmeknöpfe, Kenntnisliste, Bedarf,
  Zwischensummen, Weitergabe/Lageblatt/Blanko mit Erklärtext, Häkchen und
  drei Exportknöpfe, dann Suche, Sortierung, Qualifikation und Filter.
- Nach Tippen auf „Zuletzt gemeldete oben zeigen" ändert sich die Sortierung
  der Liste, und der Link verschwindet. Die Ansicht bleibt aber stehen
  (Telefon: scrollY 762, Liste bei 2 535). Sichtbar passiert nichts.
- Am Laptop nutzt die Seite eine Spalte von rund 930 px. Liste und Summen
  stehen untereinander, nicht nebeneinander.

**Erwartung der Rolle:** „Zeig mir die zuletzt gemeldeten" bringt mich zu
ihnen. Die Liste der Einheiten ist nach Kopfzahlen und Bedarf das Nächste,
was ich sehe. Exportknöpfe brauche ich seltener.

**Auswirkung im Einsatz:** Wer auf den Link tippt, sieht keine Wirkung und
tippt erneut oder sucht. Wer am Telefon führt, rollt für jeden Blick auf
die Einheiten über Export- und Druckknöpfe hinweg.

**Empfehlung:** Der Link soll sortieren und zur Liste springen. Den Block
„Einsatz weitergeben / sichern" mit den Exporten unter die Liste oder hinter
ein Aufklappen legen. Am Laptop gegebenenfalls zweispaltig.

**Verifikation:** Telefon, fünf Bögen einlesen, Link antippen: Die erste
Karte („neue Fassung") steht danach im Bild. Ohne Link liegt die erste Karte
höchstens zwei Bildschirmhöhen unter dem Seitenanfang.

### R4-K6 [P2] Bogen eines anderen Einsatzes wird ohne Hinweis mitgezählt (neu)

**Priorität:** P2

**Nachweis:** beobachtet (Tablet). Dass es keinen Abgleich gibt, habe ich im
Code nachgesehen: `ortAuftrag` wird in `src/app/` nirgends mit der Sammlung
verglichen.

**Fundstelle / Aufgabe:** In „Hochwasser Jagst · Möckmühl" per „Bögen
einlesen…" einen Bogen von THW Schwabach FGr N eingelesen, dessen
Ort/Auftrag „Waldbrand Gräfenberg – Wasserversorgung" lautet.

**Beobachtung:** Die Quittung meldet „Schwabach … — neu gemeldet". Die
Einheit zählt sofort mit (Kopfzahl 116), die Karte zeigt „kürzlich
eingetroffen" und keinen Hinweis auf den abweichenden Einsatz. Den Ort sieht
man nur unter „Details". Zum Vergleich: Übung („davon 1 Übung, nicht
gezählt", Marke „ÜBUNG") und ein drei Tage alter Stand (Marke „alt") werden
sichtbar gemacht.

**Erwartung der Rolle:** Ein Bogen, der für eine andere Lage ausgefüllt
wurde, fällt mir beim Eingang auf, bevor er in meine Stärke eingeht.

**Auswirkung im Einsatz:** Kommen Bögen per Datei (Annahme: Mail,
Messenger), zählt die Führungsstelle Kräfte, die woanders gebunden sind,
und plant mit ihnen.

**Empfehlung:** Weicht Ort/Auftrag des Bogens deutlich vom Namen oder Ort
der Sammlung ab, in Quittung und Karte eine Marke setzen („Bogen nennt:
Waldbrand Gräfenberg"). Nicht sperren, nur zeigen.

**Verifikation:** Bogen mit fremdem Ort/Auftrag einlesen. Quittung und Karte
müssen den abweichenden Ort zeigen. Ein Bogen mit passendem Ort darf keine
Marke bekommen.

### R4-K7 [P3] Neu-Marken uneinheitlich: neue Einheit am Telefon ohne Marke, „neue Fassung" bleibt nach Kenntnisnahme (Rest von R3-K2)

**Priorität:** P3

**Nachweis:** beobachtet (Telefon). Die 30-Minuten-Regel habe ich im Code
gelesen (Risiko).

**Fundstelle / Aufgabe:** Kompaktzeilen nach dem Einlesen von Biberach (neu)
und vier Folgemeldungen. Code: `index.html` Zeile 2267
(`.einheit-zeile.kompakt .neu-badge { display: none; }`),
`src/app/einsaetze-ui.tsx` um Zeile 2253 (`neueFassung = folge != null &&
(props.ungesehen || frischGemeldet(kopf))`).

**Beobachtung:**
- Zugeklappt auf dem Telefon tragen die vier Folgemeldungen „neue Fassung".
  Die eben erst eingetroffene Biberacher Fachgruppe trägt keine Marke: Das
  Element „kürzlich eingetroffen" steht im DOM, ist aber per CSS
  ausgeblendet. Auf dem Tablet ist es sichtbar.
- Nach „Zur Kenntnis genommen" bleiben alle vier „neue Fassung"-Marken
  stehen. Laut Code verschwinden sie erst 30 Minuten nach dem Eingang.

**Erwartung der Rolle:** Neu ist neu: Eine Einheit, die gerade angekommen
ist, fällt mindestens so auf wie eine Folgemeldung. Was ich quittiert habe,
hört auf, „neu" zu rufen.

**Auswirkung im Einsatz:** Gering. Sortierung „zuletzt gemeldet" und die
Nummer helfen. Wer aber nach dem Quittieren nur die Marken liest, übersieht
die neue Einheit am Telefon und hält die vier quittierten Fassungen weiter
für offen.

**Empfehlung:** Am Telefon für eine neue Einheit eine kurze Marke („neu")
zeigen. Die Marke „neue Fassung" an die Kenntnisnahme binden, nicht nur an
die Uhr.

**Verifikation:** Telefon, eine neue Einheit und eine Folgemeldung einlesen.
Beide sind zugeklappt markiert. Nach „Zur Kenntnis genommen" sind beide
Marken weg.

### R4-K8 [P3] Kleinere Stellen (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **Zwischensummen je Zug in der App ohne Betriebsstoff:** „1. TZ
  Karlsruhe · 3 Einheit(en) · Stärke 1 / 6 / 16 / 23 · Verpflegung 23 ·
  Unterbringung angefordert 11 Pers. … · Fahrzeuge 7". Das Lageblatt nennt
  je Zug „Diesel 240 l · Gemisch 10 l".
- **Übersicht-CSV und Excel ohne Rückfragen:** Die Spalte „Sofortbedarf" ist
  da, „Sitzplätze fehlen: 4" fehlt in beiden Dateien. Wer die Lage im
  Tabellenprogramm weiterführt, verliert die offenen Punkte.
- **Spalte „Fahrzeuge" der Übersicht-CSV:** In den Zeilen steht eine Liste
  („LKW WLF / LKW WLF / Anh Plattform / MTW OV"), in der Summenzeile eine
  Anzahl („32").
- **Tabelle auf dem Tablet:** Die Einheitsspalte trennt
  „Materialwirtschaft" ohne Trennstrich vor dem letzten Buchstaben.

**Erwartung der Rolle:** Dieselben Kennzahlen je Zug in App und Papier.
Offene Rückfragen reisen in jede Weitergabe mit.

**Auswirkung im Einsatz:** Kurzes Nachschlagen, Umwege beim Abgleich.

**Empfehlung:** Betriebsstoff in die Zwischensummen der App. Spalte
„Rückfrage" in Übersicht-CSV und Excel-Bemerkung. Fahrzeuganzahl und
Fahrzeugliste in getrennten Spalten.

**Verifikation:** Jeden Punkt einzeln wie beschrieben nachstellen.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Kenntnisliste:** „Neu seit der letzten Kenntnisnahme (5)" mit
  „Folgemeldung 22:36: Stärke 6 → 8 (+2)" und hervorgehobenem „▼ Stärke
  12 → 8 (−4)". Sie bleibt über ein Neuladen stehen. Die Startseite meldet
  „3 neu seit der letzten Kenntnisnahme", und „davon 1 Übung, nicht gezählt"
  steht gleich im Kopf der Liste.
- **Kompaktzeile am Telefon:** „neue Fassung", „Folgem. 22:40 · 12 → 14",
  „Auftrag ✓", „Bemerkung neu", „Verpfl. 12 (St. 8)", „Sitzplätze fehlen:
  2". Merkmale statt eigener Zeilen.
- **Sortierung „Zuletzt gemeldet":** Biberach, Cottbus, Crailsheim,
  Weinsberg und Ulm auf den Plätzen 1–5, die Abgerückten am Ende.
- **Eine Zählweise:** 12 zählend · 2 / 29 / 87 / 118 · 32 Fahrzeuge · Diesel
  1550 l in Kopf, Lageblatt, Sammel-PDF, CSV-Summenzeile und
  Excel-Kopfzeile, Excel-Summen mit gespeichertem Wert. Unterbringung
  „6 Einheiten, 73 Personen (54 männl. / 19 weibl.)" getrennt von
  „WC/Dusche (alle Anwesenden) 92 / 26". Von Hand nachgerechnet, stimmt.
- **Bemerkung der Einheit:** auf der Karte, im Lageblatt („(Ölsperre
  gerissen, 300 m Sperre nachfordern)"), in der Übersicht-CSV und in der
  Excel-Bemerkung. Die Suche „nachfordern" findet genau Weinsberg.
- **Lageblatt:** Kopfleiste „Lage" und „Bedarf" auf Seite 1 (9 pt), nur
  Ruhezeit und Unterbringung fett, Veränderungsspalte „Gesamtstärke: von 12
  auf 14" zuerst, Block „Abgerückt (2)" mit Abrückzeit, Zeilen „Nachtrag von
  Hand", „Summe einschl. Nachträge (von Hand)".
- **Zeitbezug:** „letzte Meldung 05.10.2026, 22:36" im Kopf und auf der
  Startseite. Die laufende Sammlung lässt sich direkt aus der Weiche öffnen
  (Telefon: Knopf bei 1 041 px). Ein drei Tage alter Stand trägt „alt".
- **Abrücken:** sofort, mit „Abgerückt 22:41: Nr. 11 „THW Erlangen …" ·
  Rückgängig". Die Bedarfsmarken der abgerückten Karte sind grau
  (rgb 92/100/120 ohne Hintergrund).
- **Übergabe:** Auf dem zweiten Gerät stimmen 11 zählend, Erlangen
  abgerückt, Auftrag „Ortung Hangrutsch Deich km 5", Züge und „Historie (2)"
  mit dem Ursprungsgerät überein.
- **Übung in der Lage:** „1 Übungsmeldung nicht gezählt — anzeigen", Karte
  „ÜBUNG".
- **Exporte:** „Nr." in beiden CSV, eine Zeitform je Datei, „Alle Daten" mit
  Eingetroffen, Abgerückt und „Auftrag/Notiz (Führungsstelle)".

## Abschluss

- **Aufgabe geschafft:** ja. Umwege gibt es bei der Frage, ob das Lageblatt
  noch gilt (R4-K1), und bei der Übernahme auf einem zweiten Gerät (R4-K2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Lageblatt … seitdem keine neue Meldung"
  klingt nach „Blatt gilt noch", gilt aber nach einem Abrücken nicht mehr
  (R4-K1).
- **Größtes Einsatzrisiko:** Am Lageblatt und beim Stab bleibt eine
  abgerückte Einheit in Stärke und Unterbringung stehen, weil die App keinen
  Neudruck anmahnt (R4-K1).
- **Top-Priorität für die nächste Iteration:** Die Aktualitätszeilen für
  Lageblatt und Export sollen Änderungen genauso zählen wie die
  Weitergabe-Zeile (R4-K1).

## Abgleich mit Runde 3

Grundlage: [../runde-3/fuehrungssicht.md](../runde-3/fuehrungssicht.md)
einschließlich „Stand der Behebung" und
[../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Behebung laut Runde 3 | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-K1 Folgemeldung nicht als neu erkennbar (P1) | behoben | hält | Kenntnisliste mit Änderung und Stärkeverlust, auch nach Neuladen. Marke „neue Fassung" auf Telefon und Tablet. „Zuletzt gemeldet" stellt die fünf frischen Fassungen auf Platz 1–5. Rest: Der Link „Zuletzt gemeldete oben zeigen" springt nicht zur Liste (R4-K5), und die Marke überdauert die Kenntnisnahme (R4-K7). |
| R3-K2 Kompaktzeile verschweigt Merkmale (P2) | behoben | hält, mit Rest | „Folgem. 22:40 · 12 → 14", „Auftrag ✓", Rückfrage mit Inhalt, „neue Fassung" zugeklappt sichtbar. Weiter ausgeblendet: „kürzlich eingetroffen" für eine ganz neue Einheit (R4-K7). |
| R3-K3 Sonstiges fehlt (P2) | behoben | hält, mit Rest | Bemerkung auf Karte, Lageblatt, Übersicht-CSV, Excel. Die Suche „nachfordern" findet 1 von 14. In der neuen Kenntnisliste steht aber nur „Sonstiges geändert" (R4-K4). |
| R3-K4 Unterbringung zählt alle (P2) | behoben | hält | „6 Einheiten, 73 Personen (54 / 19 / 0)" von Hand nachgerechnet. WC/Dusche getrennt beschriftet. Je Zug in App und Lageblatt. |
| R3-K5 Ohne Zeitbezug (P3) | behoben | teilweise | „letzte Meldung …" im Kopf und auf der Startseite. Weiche öffnet die Sammlung (1 041 px, Runde-3-Nachmessung 1 046 px). Die Import-Quittung mit „Letzte Meldung darin" gibt es, sie steht aber bei 4 851 von 5 773 px unter „Einsatz löschen…" und zählt 18 Fassungen statt 14 Einheiten (R4-K2). |
| R3-K6 Lageblatt (P3) | weitgehend | hält wie beschrieben | Kopfleiste „Lage"/„Bedarf" auf Seite 1 (Textbox 8,3 pt, entspricht 9 pt), Tabelle Textbox 6,94 pt (entspricht 7,5 pt; der Runde-3-Wert „6,9 pt" war die Textbox, nicht die Schriftgröße). Nur Dringendes fett, Gesamtstärke zuerst. Bei 14 Einträgen Zwischensummen auf Seite 2, Bedarf über die Kopfleiste auf Seite 1. |
| R3-K7 Kleinere Stellen (P3) | behoben | hält, eine Nebenwirkung | „Nr." in beiden CSV, eine Zeitform je Datei, „Alle Daten" mit Eingetroffen/Abgerückt/Notiz, Excel-Kopfzeile mit Werten, Bedarf an Abgerückten grau, F/U/M/Kfz neben „Ges.". Die Übersetzung „Rückfrage: Sitzplätze fehlen: 4" wirkt. Andere Prüfpunkte werden nach 30 Zeichen gekürzt und sind auf Papier nicht lesbar (R4-K3). |

Bilanz: Von sieben Runde-3-Befunden halten sechs ganz oder mit kleinem Rest.
R3-K5 wirkt nur teilweise, weil die Import-Quittung außer Sicht steht.
Verkehrt hat sich keine Behebung. Nebenwirkungen haben zwei: Die neue
Kenntnisliste aus R3-K1 verkürzt die Bemerkung aus R3-K3 zu „Sonstiges
geändert" (R4-K4), und die Kürzung der Rückfragen aus R3-K7 macht sie auf
Papier unlesbar (R4-K3). R4-K1 ist neu. Die in R3-W2 eingeführte Zählung
von Änderungen gilt nur für die Weitergabe-Zeile, nicht für Lageblatt und
Export.

Abgleich mit den anderen Runde-4-Berichten: Bei Abschluss dieser Prüfung
lagen sie nur als Zwischenstände vor (Analog first, Fehler und Wiederanlauf,
Nacht und Sicht, Mobile-UI, Neuer Nutzer und weitere, ohne ausformulierte
Befunde). Keiner der dort notierten Punkte deckt sich mit R4-K1 bis R4-K8.
Der Analog-first-Zwischenstand berührt mit „Meldungsnummern nach
Papier-Wiederanlauf weichen ab" ebenfalls die Übereinstimmung von Papier und
App, aber auf einem anderen Weg.
