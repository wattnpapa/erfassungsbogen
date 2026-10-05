# Audit „Arbeitsablauf", Runde 4 (Einheit → Meldekopf → Ablösung → zurück → Stab)

Stand: 05.10.2026 · Prüfer: Rollenaudit `thw-workflow-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173),
Commit `3dd2ab5`.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-3-Befunde. Schwerpunkt wie in Runde 3: dieselbe Lage auf mehreren
Geräten, dazu diesmal die Lieferungen an den Stab („nur neue Bögen") und
das Zusammenspiel von Schnellerfassung und nachgereichtem Bogen.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
Locale de-DE, Telefon 360 × 640 mit `isMobile`/`hasTouch` für alle Geräte.
Jedes Gerät ist ein eigener Browser-Kontext mit eigenem Speicher. Zustände
zwischen den Skripten habe ich über `storageState` weitergereicht, also wie
ein Gerät, das zwischendurch neu geöffnet wird. Elf weitere Prüfer nutzten
denselben Server gleichzeitig; Zeiten habe ich deshalb nicht gemessen.

- **A** (Telefon Zugtrupp Albstadt): Vorlage per Seed `eeb.vorlagen.v1` aus
  `examples/thw/001`, `uebung: false`, Stand auf den Prüftag. „Einsatz
  vorbereiten" mit einer abgewählten Person, Ort eingetragen,
  „Einsatzbeginn eintragen", PDF und Link erzeugt. Danach die Person
  nachgetragen und eine zweite PDF erzeugt.
- **B** (Meldekopf): Sammlung „Hochwasser Eyach 10/2026" durch Bedienung
  angelegt. Über „Bögen einlesen…" die PDF von A und fünf Bögen als JSON
  (`003`, `005`, `010`, `011`, `014`, später `012`, `020`, `016`), je
  `uebung: false` und Stand auf den Prüftag; die Einsatzangaben dieser
  Beispielbögen (Juli 2026, andere Orte) habe ich bewusst stehen lassen.
  Zug zuordnen, Auftrag/Notiz, Abrücken, Schnellerfassung, Folgemeldung,
  alter Bogen nach neuem.
- **C** (Ablösung bzw. Stab): „Einsatz importieren…" mit der Sammel-PDF von
  B, eigene Änderungen, Gegenimport, Rückgabe an B.
- **D/E** (frische Geräte): Import der Nachtrag-PDF „nur neue Bögen" bzw.
  einer Sammel-PDF in eine gleichnamige eigene Sammlung.

QR-Weg durch den inhaltsgleichen Link ersetzt („Weitere Formate → Link
teilen", Inhalt aus der Zwischenablage, Host auf `localhost:4173`
umgeschrieben), Mail-Weg durch die PDF-Datei. Heruntergeladen und
gegengelesen (`pdftotext`, `pdftoppm`, `openpyxl`): Lageblatt, Sammel-PDF
(12 und 17 Seiten), Nachtrag-PDF (3 Seiten), „Übersicht als CSV" (alle
und nur neue), „Alle Daten als CSV", Excel „Oldenburg". Die Screenshots habe
ich angesehen. Skripte und Bilder: `scratchpad/runde4/ablauf/`.

Ich habe zuerst ohne Blick in frühere Berichte getestet. Den Runde-3-Bericht
samt „Stand der Behebung" und das Runde-3-README habe ich danach gelesen,
die übrigen Runde-4-Berichte erst zum Schluss.

Erwartete Arbeitsfolge. Wo der reale THW-Ablauf nicht bekannt ist, steht
**Annahme**:

1. Die Einheit bereitet den Bogen aus ihrer Vorlage vor und übergibt ihn
   (QR, Link oder PDF).
2. **Annahme:** Trifft eine Einheit ohne fertigen Bogen ein, erfasst der
   Meldekopf sie schnell; der vollständige Bogen kommt später nach.
3. Der Meldekopf sammelt, ordnet Züge zu, vergibt Aufträge, lässt abrücken.
4. Ablösung oder Stab übernimmt die Lage auf einem zweiten Gerät; beide
   Geräte arbeiten eine Zeit parallel, danach geht die Lage zurück.
5. **Annahme:** Der Meldekopf liefert dem Stab erst alles, dann in
   Abständen nur das Neue (PDF, CSV oder Excel), und führt daneben die
   eigene Excel-Liste.
6. Die Einheit meldet Änderungen neu.

**Nicht prüfbar:** Kamera-Scan und QR-Codes aus Fotos, Handscanner,
Nahbereichs-Weitergabe, natives Share-Sheet (im Browser wird jede Datei
sofort heruntergeladen, „Abbrechen" gibt es dort nicht), echte Mail- und
Messenger-Wege, Darstellung der Excel-Datei in Excel, echtes Drucken,
native Builds. Den Rückkanal vom Meldekopf zur Einheit gibt es bewusst
nicht; „als übergeben vermerken" habe ich nur gesehen, nicht bewertet.

## Urteil

Der Weg einer Einheit bis in die Lage trägt, und die große Lücke aus Runde 3
ist geschlossen. Gibt die Ablösung die Lage zurück, kommen Abrücken, Zug und
Auftrag an. Die Quittung nennt sie einzeln und meldet einen Widerspruch
(„Crailsheim Zug — hier ‚3. Zug', in der Datei ‚2. Zug'; der jüngere Stand
aus der Datei gilt"). Lageblatt, Sammel-PDF und Excel zeigen dieselben
Zahlen. Der Bogen aus der Vorlage ist mit wenigen Tipps fertig. Nach einer
Änderung sagt das Telefon der Einheit, dass neu übergeben werden muss.

Reibung entsteht an drei neuen Stellen. Erstens entscheidet allein der
Zeitstempel im Bogen, welche Fassung einer Einheit gilt. Erfasst der
Meldekopf eine Einheit schnell und kommt deren richtiger Bogen danach, gilt
weiter die Schnellerfassung mit StAN-Platzhaltern. Der Bogen der Einheit
verschwindet in der Historie (R4-W1). Zweitens gibt es für „nur neue Bögen"
genau einen Merker für alle Empfänger. Jede CSV, jede Excel-Liste und jede
Weitergabe an die Ablösung verbraucht ihn, und dem Stab fehlen danach
Einheiten (R4-W2). Drittens öffnet ein Bogen-Link, der am Meldekopf die
App erst startet, den fremden Bogen als eigenen Arbeitsbogen. Die Frage
„Wohin damit?" kommt nicht (R4-W3), obwohl Runde 3 genau das noch bestätigt
hatte.

Die Einzelaufgaben schafft man ohne fremde Hilfe. Bei den Lieferungen an
den Stab und bei nachgereichten Bögen stimmt das Ergebnis aber nicht, ohne
dass die App es sagt.

## Befunde

### R4-W1 [P1] Welche Fassung gilt, entscheidet allein der Stand im Bogen: der nachgereichte richtige Bogen verschwindet hinter der Schnellerfassung

**Priorität:** P1 · gemessen

**Fundstelle / Aufgabe:** Meldekopf B, „Einheit manuell erfassen…" →
danach „Bögen einlesen…" mit dem Bogen derselben Einheit. Code:
`vendor/bos-meldekopf/src/einsaetze.ts`, `istNeuer()` /
`neuesteJeEinheit()`: Kopf ist die Fassung mit dem größeren Sender-`stand`,
bei gleicher Minute die zuletzt empfangene.

**Beobachtung:**

| Schritt | Stand im Bogen | Ergebnis |
| --- | --- | --- |
| B erfasst „THW Bamberg FGr W (A)" schnell: Typ aus der Liste, Name „Bamberg", „Nur Stärke melden" | 20:55 | Karte „Stärke 0 / 3 / 9 / 12", Rückfrage „keine Rufnummer + 4 weitere", 12 Personenkarten aus dem StAN-Vorschlag, alle „männlich" |
| Der Bogen der Einheit kommt als Datei nach (11 Personen mit Namen, 4 Fahrzeuge, Diesel 130 l, Benzin 80 l) | 18:55 (vor der Abfahrt ausgefüllt) | Quittung „1 Bogen aufgenommen." Kopf bleibt die Schnellerfassung. Karte: „seit 05.10.2026, 18:55: Stärke 11 → 12 · 3 Fahrzeuge dazu · 4 Fahrzeuge abgemeldet". Historie: „Stand 20:55 · 0 / 3 / 9 / 12 · Manuell erfasst (aktuell)", darunter „Stand 18:55 · 0 / 3 / 8 / 11 · Aus Datei" |

Die Lage zählt damit 12 statt 11 Kräfte, drei Platzhalter-Fahrzeuge statt
der vier echten und keinen Kraftstoff. Die Karte liest sich so, als hätte
die Einheit seit ihrem Bogen eine Person und drei Fahrzeuge gewonnen.

Dieselbe Regel zeigt sich an zwei weiteren Stellen:

- A erzeugt eine PDF (3 Personen), trägt in derselben Minute eine Person
  nach und erzeugt eine zweite (4 Personen). Beide Dateien heißen
  `eeb-052041okt26_…`. Liest B erst die neue, dann die alte ein, gilt die
  alte. Quittung: „Folgemeldung 20:42: Stärke 4 → 3 (−1)", Gesamt fällt von
  54 auf 53.
- Kommt eine ältere Fassung aus einer anderen Minute nach der neueren
  (20:38 nach 20:41), bleibt die Stärke zwar richtig. Die Liste „Neu seit
  der letzten Kenntnisnahme" meldet sie aber als „THW Albstadt Zugtrupp
  Technischer Zug — neu gemeldet".

**Erwartung der Rolle:** Kommt der richtige Bogen einer Einheit, die ich
eben nur grob erfasst habe, ersetzt er die Notlösung. Ist eine Datei älter
als das, was ich habe, sagt mir die App das, statt „neu gemeldet" oder
„Folgemeldung" zu schreiben.

**Auswirkung im Einsatz:** **Annahme:** Einheiten füllen den Bogen am
Standort oder auf der Anfahrt aus und kommen damit an. Steht am Meldekopf
eine Schlange, wird zuerst schnell erfasst und der Bogen später gescannt.
Genau dann bleiben Namen, Fahrzeuge und Sofortbedarf der Einheit außerhalb
der Lage. Verpflegung, Kraftstoff und Sitzplätze werden mit
StAN-Platzhaltern geplant. Rückweg gibt es („Fassung verwerfen…" an der
Schnellerfassung), aber nichts weist darauf hin.

**Empfehlung:** Beim Eintreffen eines Bogens für eine Einheit, deren
aktuelle Fassung eine Schnellerfassung ist, fragen: „Bogen der Einheit
(Stand 18:55) ersetzt die Schnellerfassung (20:55)?" mit Ja als Vorschlag.
Bei einer älteren Fassung in der Quittung sagen: „älterer Stand als der
vorhandene, nur in die Historie gelegt". Bei gleicher Minute nicht die
Empfangszeit entscheiden lassen, sondern nachfragen.

**Verifikation:** Schnellerfassung, danach den Bogen mit älterem Stand
einlesen: Nach der Rückfrage zeigt die Karte die Stärke, Fahrzeuge und den
Kraftstoff aus dem Bogen. Zwei Bögen derselben Minute in beiden
Reihenfolgen einlesen: Die Lage zeigt beide Male die Fassung, die der
Nutzer bestätigt hat. Ein älterer Bogen nach einem neueren erscheint
nicht als „neu gemeldet".

### R4-W2 [P1] „Nur neue Bögen" hat einen Merker für alle Empfänger: CSV, Excel und Weitergabe an die Ablösung verbrauchen ihn, dem Stab fehlen Einheiten

**Priorität:** P1 · gemessen

**Fundstelle / Aufgabe:** Einsatzansicht, Kasten „Nur neue Bögen seit dem
letzten Export" und die Knöpfe darunter. Code: `src/app/app.tsx`,
`exportVerbuchen()` (wird nach Sammel-PDF, beiden CSV, Excel und „Einsatz
weitergeben / sichern" aufgerufen), Merker `eeb.export-stand.v1` je Einsatz
(`src/app/export-stand.ts`).

**Beobachtung:**

- Nach „Übersicht als CSV" und „Excel-Liste" steht unter dem Kasten
  „Zuletzt exportiert 05.10.2026, 20:45 · seitdem keine neuen Bögen". Das
  Lageblatt verschiebt den Merker nicht, CSV und Excel schon.
- B gibt die Lage um 20:49 an die Ablösung C weiter. Darin ist Sinsheim
  (eingetroffen 20:49). Danach trifft Hilpoltstein ein. „Sammel-PDF (nur
  neue Bögen)" enthält nur Hilpoltstein. Sinsheim ist nie an den Stab
  gegangen, weil die Weitergabe an die Ablösung als Export gilt.
- Mit angehaktem Kasten lädt „Übersicht als CSV" die eine neue Einheit
  herunter. Danach ist „Excel-Liste (Format ‚Oldenburg')" gesperrt
  (`disabled`), denn „seitdem keine neuen Bögen". Wer dem Stab Nachtrag-PDF
  und Excel schicken will, bekommt nur das Erste.

**Erwartung der Rolle:** „Neu seit dem letzten Export" heißt: seit der
letzten Lieferung an den Stab. Die eigene Excel-Liste, eine CSV für die
Lagekarte und die Übergabe an die Ablösung sind keine Lieferung an den
Stab. Zu einer Lieferung gehören mehrere Formate.

**Auswirkung im Einsatz:** Der Stab bekommt Nachträge mit Lücken. Die
fehlende Einheit taucht in keiner späteren Lieferung auf, weil sie für die
App schon „exportiert" ist. Ohne Abgleich von Hand merkt das niemand. Der
Text „seitdem keine neuen Bögen" bestätigt den falschen Stand.

**Empfehlung:** Den Merker nur durch die Lieferung setzen, die der Nutzer
als solche auswählt, etwa „Nachtrag an den Stab" mit PDF, CSV und Excel in
einem Schritt. Weitergabe an die Ablösung, Lageblatt und Einzelexporte
nicht mitzählen. Alternativ: den Bezugspunkt sichtbar wählbar machen
(„neu seit Lieferung 20:45 an S2") und nach einem Teilexport die übrigen
Formate für denselben Nachtrag offen lassen.

**Verifikation:** Gesamtexport, dann Excel für die eigene Liste,
Weitergabe an die Ablösung, eine neue Einheit, dann „nur neue": Der
Nachtrag enthält alle Einheiten seit dem Gesamtexport. Nach der
Nachtrag-CSV lässt sich die Excel-Liste mit demselben Inhalt laden.

### R4-W3 [P1] Bogen-Link als Kaltstart am Meldekopf: kein „Wohin damit?", der fremde Bogen wird zum eigenen Arbeitsbogen

**Priorität:** P1 · gemessen

**Fundstelle / Aufgabe:** Gerät mit Sammlung und ohne eigenen Bogen (B und
C), App geschlossen, Link von A geöffnet. Code: `src/app/app.tsx`,
`START_SOFORT` (um Zeile 524): Sofort geöffnet wird, wenn kein Entwurf mit
Inhalt da ist und `einsaetzeLaden().length === 0`. Diese Prüfung läuft beim
Laden des Moduls.

**Beobachtung:** Auf beiden Geräten, je mit einem neuen und einem schon
vorhandenen Bogen: keine Rückfrage, auch nicht nach 4 s. Die App zeigt die
„Gesamtübersicht" des fremden Bogens mit „Bogen übergeben…" als erstem
Knopf und „✓ automatisch gespeichert". Im Speicher steht danach
`eeb.entwurf.v1`. Die Startseite bietet „THW Albstadt Zugtrupp Technischer
Zug · Fortsetzen / Verwerfen" an, also den fremden Bogen auf dem Platz des
eigenen. Ist die App schon offen, kommt bei demselben Link wie in Runde 3
„Meldung von ‚THW Albstadt …' empfangen … Wohin damit?" mit „In ‚Hochwasser
Eyach 10/2026' aufnehmen" zuerst.

Legt man den Bogen danach von Hand über „In Einsatz-Sammlung ablegen…" ab,
quittiert die App „Zuletzt eingelesen: ‚THW Albstadt …' · jetzt 5
Einheiten". War der Bogen schon in der Sammlung, steht dort kein
„bereits vorhanden".

**Erwartung der Rolle:** Am Meldekopf landet ein empfangener Bogen in der
Lage, egal ob die App gerade lief oder nicht. Mein Gerät hat keinen eigenen
Bogen und soll auch keinen bekommen.

**Auswirkung im Einsatz:** **Annahme:** Links kommen über Messenger, und
das Tablet hatte die App gerade nicht im Vordergrund. Der Helfer sieht den
Bogen vollständig auf dem Schirm und hält ihn für aufgenommen. Die Einheit
fehlt in Summen, Lageblatt und Weitergabe. Beim nächsten Link (mit
offener App) fragt die App zusätzlich nach dem „angefangenen Bogen", den
es aus Sicht des Meldekopfs nie gab.

**Empfehlung:** Die Entscheidung „Sammlung vorhanden?" erst nach dem
Mounten treffen oder den Kaltstart grundsätzlich über denselben Weg wie den
Link bei offener App führen. Beim Ablegen eines schon vorhandenen Bogens
„bereits vorhanden" sagen.

**Verifikation:** Gerät mit Sammlung, ohne eigenen Bogen, App geschlossen,
Link öffnen: Es erscheint „Wohin damit?" mit der Sammlung zuerst. Nach
„Aufnehmen" bleibt `eeb.entwurf.v1` leer, die Startseite zeigt kein
„Fortsetzen".

### R4-W4 [P2] Nachtrag-PDF und Nachtrag-CSV sagen nicht, dass sie nur ein Teil der Lage sind

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** „Sammel-PDF (nur neue Bögen)" und „Übersicht als
CSV" mit angehaktem Kasten; „Einsatz importieren…" auf einem frischen
Gerät. Code: `src/app/pdf-dokument.ts` (Übersichtsseite),
`src/app/einsatz-csv.ts`, `src/app/app.tsx` (Dateinamen).

**Beobachtung:** Seite 1 der Nachtrag-PDF beginnt wie die Gesamtfassung:
„Übergabe-Übersicht: Hochwasser Eyach 10/2026 … Lage: 1 Einheit zählend ·
Stärke F / U / M / G 0 / 2 / 6 / 8 · 4 Fahrzeuge", „Bedarf gesamt (1
Einheiten, 8 Personen)". Die Lage hat zu diesem Zeitpunkt 6 zählende
Einheiten mit 50 Kräften. Nur der Dateiname enthält `nachtrag`. Die
Teil-CSV endet mit „Summe (1 Einheiten)" und heißt genauso wie die volle
CSV (`eeb-einsatz-Hochwasser_Eyach_10_2026.csv`). Ein frisches Gerät legt
aus der Nachtrag-PDF einen Einsatz mit 1 Einheit an. Quittung: „Einsatz
‚Hochwasser Eyach 10/2026' importiert (1 Meldung(en))", ohne Hinweis auf
einen Teilstand.

**Erwartung der Rolle:** Ein Nachtrag steht als Nachtrag im Kopf: „Nachtrag
seit 20:49 — nicht die ganze Lage". Seine Summen heißen „Summe Nachtrag".
Wer ihn als Lage importiert, wird gewarnt.

**Auswirkung im Einsatz:** Im Stab liegen am Morgen mehrere Ausdrucke mit
„Lage: …" im Kopf. Wer den jüngsten greift, liest 8 Kräfte statt 50. Eine
Ablösung, die die falsche Datei importiert, führt eine Lage mit einer
Einheit weiter. Zwei gleichnamige CSV überschreiben sich im Download-Ordner
oder werden verwechselt.

**Empfehlung:** Kopf, Fußzeile und Summenzeile als Nachtrag kennzeichnen,
mit Bezugszeitpunkt. Eigener Dateiname für die Teil-CSV und die Teil-Excel.
Beim Import einer Nachtrag-PDF auf einem Gerät ohne diese Lage fragen, ob
wirklich nur der Nachtrag als Lage angelegt werden soll.

**Verifikation:** Nachtrag-PDF erzeugen: Seite 1 sagt „Nachtrag", nicht
„Lage". Teil-CSV hat einen anderen Namen und „Summe Nachtrag". Import auf
einem frischen Gerät warnt.

### R4-W5 [P2] Übersichts-CSV: „Unterbringung M/W/D" zählt alle Anwesenden, Lageblatt und Excel nur die angeforderte Unterbringung

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** „Übersicht als CSV" nach dem Aufbau der Lage
(5 zählende Einheiten). Code: `src/app/einsatz-csv.ts`.

**Beobachtung:**

| Ausgabe | Unterbringung |
| --- | --- |
| Lageblatt und Sammel-PDF | „Unterbringung angefordert: 3 Einheiten, 35 Personen (30 männl. / 5 weibl. / 0 div.)" |
| Excel „Oldenburg", Spalten ÜN (m)/(w)/(d) | Crailsheim 0, Haßmersheim 12, Rottweil 4, Weinsberg 14 / 5 → 30 / 5 |
| Übersichts-CSV, Spalten „Unterbringung M/W/D" | Crailsheim 11 / 1 / 0, obwohl `unterbringung: false`; Summenzeile 42 / 8 / 0 |

Die CSV-Summe ist die Zahl, die das Lageblatt „WC/Dusche (alle
Anwesenden)" nennt. Ob eine Einheit Unterbringung angefordert hat, steht in
der CSV nur als Wort in der Spalte „Sofortbedarf". Die Detail-CSV hat
dafür eine eigene Spalte „Unterbringung nötig".

**Erwartung der Rolle:** Dieselbe Spaltenüberschrift bedeutet in allen
Ausgaben dasselbe. Die Summe in der CSV ist die Zahl, mit der der Stab
Schlafplätze plant.

**Auswirkung im Einsatz:** Wer die CSV in die Lagekarte oder eine eigene
Tabelle übernimmt, plant 50 Schlafplätze statt 35, oder er vergleicht mit
dem Lageblatt und weiß nicht, welche Zahl gilt.

**Empfehlung:** In der Übersichts-CSV „Unterbringung angefordert M/W/D"
nur für Einheiten mit Anforderung füllen. Die Geschlechterverteilung aller
Anwesenden in eigenen Spalten „WC/Dusche M/W/D" führen.

**Verifikation:** Dieselbe Lage exportieren: CSV-Summe Unterbringung 30 / 5
/ 0 wie Lageblatt und Excel, Crailsheim ohne Unterbringung.

### R4-W6 [P2] Bogen mit vergangenem Einsatzzeitraum: der Absender wird gewarnt, der Meldekopf nicht (ergänzt R4-K6)

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** Bogen mit Einsatzzeitraum 16.–17.07.2026 und Ort
einer anderen Lage („Hochwasserlage Crailsheim — Deichverteidigung,
Bootsbetrieb"), Stand heute. Absender: „Gesamtübersicht". Meldekopf:
Karte, Rückfragen, Excel „Oldenburg". Code: Plausibilitätsprüfung in der
Übersicht des Assistenten gegenüber den Rückfragen der Karte
(`src/app/einsaetze-ui.tsx`), Spalten „Verfügbar bis" / „Vorgesehener
Auftrag" in `src/app/oldenburg-xlsx.ts`.

**Beobachtung:** Auf dem Telefon der Einheit steht „⚠ 3 offene Punkte …
Einsatzzeitraum 16.07.2026 – 17.07.2026 ist vorbei — gilt dieser Bogen noch
für den aktuellen Einsatz?". Am Meldekopf nennt die Rückfrage derselben
Einheit nur die beiden anderen Punkte (Kennzeichen doppelt, Sitzplätze).
In der Excel-Liste stehen „Verfügbar bis 2026-07-17" und als
„Vorgesehener Auftrag" der Ort der Juli-Lage, für fünf von sechs
Einheiten.

**Erwartung der Rolle:** Was der Absender als Problem sieht, sieht der
Meldekopf auch, gerade wenn die Einheit die Warnung übergangen hat.

**Auswirkung im Einsatz:** **Annahme:** Einheiten verwenden den Bogen der
letzten Lage weiter. Die Führungsstelle liest in ihrer Liste ein
Verfügbarkeitsende, das 2½ Monate zurückliegt, und einen fremden Auftrag.
Sie plant Ablösungen danach oder fragt bei jeder Einheit nach.

Den abweichenden Ort/Auftrag ohne Hinweis beschreibt schon R4-K6
([fuehrungssicht.md](fuehrungssicht.md)). Neu ist hier: Die App hat die
passende Prüfung schon, zeigt sie aber nur dem Absender, und die
Excel-Liste trägt das alte Datum als Verfügbarkeit weiter.

**Empfehlung:** Die Zeitraum-Prüfung auch in die Rückfragen am Meldekopf
übernehmen („Einsatzzeitraum im Bogen endete 17.07. — nachfragen"). In der
Excel-Liste ein vergangenes „Verfügbar bis" kennzeichnen oder leer lassen.

**Verifikation:** Denselben Bogen einlesen: Die Karte zeigt die
Zeitraum-Rückfrage, das Lageblatt nennt sie, die Excel-Zelle ist markiert.

### R4-W7 [P2] Weitergabe-Vermerk zählt nach dem Rückimport die Änderungen des anderen Geräts als „hier" (Rest von R3-W2)

**Priorität:** P2 · gemessen

**Fundstelle / Aufgabe:** B gibt um 20:49 an C weiter und ändert danach
nichts mehr. C ändert Zug und Auftrag und gibt zurück, B importiert. Code:
`src/app/export-stand.ts`, `weitergabeUmImportErgaenzen()` und
`aenderungenSeit()`.

**Beobachtung:** Die Quittung auf B ist richtig: „0 neue Meldung(en)
ergänzt. 2 Meldungen aktualisiert: Albstadt Zug ‚Führung'; Weinsberg
Auftrag ‚Ölsperre Brücke B463'." Oben steht danach aber: „Weitergegeben
05.10.2026, 20:49 — seitdem hier 3 Änderungen (Zug, Auftrag). Führt
inzwischen ein anderes Gerät die Lage, fehlt das dort: erneut weitergeben."
Alle drei Änderungen stammen von C. Neue Meldungen aus einem Import zählt
der Vermerk dagegen richtig nicht mit.

**Erwartung der Rolle:** Wie in Runde 3: Was ich gerade von dort bekommen
habe, hat das andere Gerät schon.

**Auswirkung im Einsatz:** Wie R3-W2: unnötiges Hin- und Herschicken, und
der gelbe Kasten verliert seine Warnwirkung für den Fall, dass wirklich
etwas fehlt.

**Empfehlung:** Die Vermerke, die der Abgleich beim Übernehmen auf diesem
Gerät schreibt, ebenfalls als beim anderen Gerät bekannt buchen.

**Verifikation:** Ablauf nachstellen: Nach dem Rückimport steht „seitdem
hier nichts Neues". Ändert B danach selbst einen Zug, steht „1 Änderung
(Zug)".

### R4-W8 [P3] Kleinere Brüche an den Übergabepunkten

**Priorität:** P3 · beobachtet

**Fundstelle / Aufgabe und Beobachtung:**

- **Zug aus dem Sammlungsnamen:** Liest B die Sammel-PDF einer gleichnamigen
  Sammlung eines anderen Meldekopfs ein, heißt der erste, hervorgehobene
  Weg „Übernehmen, Zug ‚Hochwasser Eyach 10/2026'". Albstadt und Radolfzell
  tragen danach diesen Namen als Zug, und die Zwischensummen bekommen einen
  Schein-Zug.
- **Nachzügler aus der Vorlage:** Wer bei „Einsatz vorbereiten" abgewählt
  wurde und später nachkommt, muss im Personalschritt über „+ Person
  hinzufügen" komplett neu eingegeben werden. Funktion, Fahrerlaubnis und
  Erreichbarkeit aus der Vorlage bietet die App dort nicht an.
- **Reihenfolge Kasten/Knopf:** Der Hinweis sagt „Nur die neuen Bögen für
  den Stab: Kästchen unten". Das Kästchen steht unter „Einsatz weitergeben /
  sichern", der zugehörige Knopf erscheint erst nach dem Anhaken darunter.

**Erwartung der Rolle:** Ein Zug heißt so, wie ihn ein Mensch vergeben hat.
Was in der Vorlage steht, muss ich nicht neu tippen.

**Auswirkung im Einsatz:** Kleine Zeitverluste und Unsicherheit. Der
Schein-Zug verfälscht die Zwischensummen nach Zug, bis jemand ihn an jeder
Karte ändert.

**Empfehlung:** Bei gleichem Sammlungsnamen „Übernehmen ohne
Zug-Zuordnung" vorschlagen. Im Personalschritt „aus der Vorlage
ergänzen…" anbieten.

**Verifikation:** Gleichnamige Sammlung: erster Weg ohne Zug. Abgewählte Person im
Personalschritt mit einem Tipp zurückholbar.

## Verweise auf andere Runde-4-Berichte

Diese Stellen habe ich ebenfalls beobachtet. Sie stehen schon in anderen
Berichten und werden hier nicht als eigene Befunde gezählt:

- **R4-K2** ([fuehrungssicht.md](fuehrungssicht.md)): Nach „Einsatz
  importieren…" auf einem frischen Gerät steht „Einsatz ‚Hochwasser Eyach
  10/2026' importiert (6 Meldung(en))" ganz unten unter „Einsatz
  löschen…" (bei mir y ≈ 3 660 px bei 640 px Bildhöhe, beim Nachtrag
  y ≈ 2 140 px). Beim Import in einen vorhandenen Einsatz steht die
  Quittung oben.
- **R4-K1** ([fuehrungssicht.md](fuehrungssicht.md)): Export-Zeile
  „seitdem keine neuen Bögen" übergeht Abrücken; mit Häkchen sind die
  Knöpfe dann gesperrt. R4-W2 betrifft denselben Merker, aber eine andere
  Ursache (jede Datei verbraucht ihn).
- **R4-K6** ([fuehrungssicht.md](fuehrungssicht.md)): Bogen mit fremdem
  Ort/Auftrag zählt ohne Hinweis mit; siehe R4-W6 für den Zeitraum.
- **R4-N2** ([neuer-nutzer.md](neuer-nutzer.md)): „Aus Datei laden…" auf
  der Startseite öffnet eine fremde Meldung als eigenen Bogen. R4-W3 ist
  derselbe Bruch auf dem Link-Weg beim Kaltstart. Der Bericht
  [zerstoerende-handlungen.md](zerstoerende-handlungen.md) bestätigt
  „Wohin damit?" beim Kaltstart mit Sammlung; dort lag zugleich ein eigener
  Bogen auf dem Gerät. Das passt zum Code: Die Frage fehlt nur, wenn kein
  eigener Bogen da ist.
- **R4-H4** ([feldtauglichkeit.md](feldtauglichkeit.md)): Neue Personen
  sind ungefragt „M". In der Schnellerfassung führt das zu den 12
  „männlichen" StAN-Platzhaltern aus R4-W1.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- **Vorlage → Einsatz:** „Einsatz vorbereiten: Vorlage Albstadt" direkt
  unter „Meinen Bogen ausfüllen". Musterung „Alle sind vorab angehakt — wer
  oder was fehlt, antippen und abwählen", Sofortbedarf und Bemerkung aus
  der Vorlage durchgestrichen und nicht angehakt. „Einsatz starten · 3 Pers
  · 2 Fz" führt direkt in Schritt 2, Zeitraum mit heute vorbelegt.
- **Rückkanal auf dem Telefon der Einheit:** Nach der PDF „PDF erzeugt
  20:37 Uhr — Empfang nicht bestätigt. Gegenstelle hat ihn — als übergeben
  vermerken". Nach einer nachgetragenen Person „⚠ Nach ‚PDF erzeugt 20:41
  Uhr' geändert (Stärke 1 / 1 / 1 / 3 → 1 / 1 / 2 / 4) — neu übergeben".
- **Stapel einlesen:** Eine PDF und fünf JSON auf einmal: „6 Bögen
  aufgenommen", Liste „Neu seit der letzten Kenntnisnahme (6)". Dieselbe
  PDF noch einmal: „0 Bögen aufgenommen, 1 bereits vorhanden." Siegel aus
  der Einzel-PDF bleibt („✓ signiert 1b47 347f …").
- **Folgemeldung:** „Folgemeldung 20:41: Stärke 3 → 4 (+1) ·
  Einsatzbeginn geändert", Karte „neue Fassung · Folgem. 20:41 · 3 → 4".
- **Abgleich zwischen Geräten (R3-W1):** C importiert B, ändert Zug und
  Auftrag, B lässt parallel abrücken und ändert einen Zug. C importiert B:
  „1 neue Meldung(en) ergänzt. 2 Meldungen aktualisiert: Crailsheim Zug
  ‚2. Zug'; Weinsberg abgerückt 20:49. 1 Widerspruch zwischen den Geräten:
  Crailsheim Zug — hier Zug ‚3. Zug', in der Datei Zug ‚2. Zug'; der
  jüngere Stand aus der Datei gilt." Weinsberg trägt danach Abrücken von B
  und Auftrag von C. Rückweg nach B: „2 Meldungen aktualisiert: Albstadt
  Zug ‚Führung'; Weinsberg Auftrag ‚Ölsperre Brücke B463'."
- **Schnellerfassung erkennt die Einheit:** Typ aus der Liste („FGr W (A)
  Fachgruppe Wassergefahren (A)") und Name „Bamberg" ergeben dieselbe
  Einheit wie der spätere Bogen, keine Doppelzählung (6 Einheiten vorher
  und nachher). Zur Frage, welche Fassung gilt, siehe R4-W1.
- **Zug-Bündel (R3-W3):** Sammel-PDF einer anderen Sammlung über „Bögen
  einlesen…": Rückfrage mit drei Wegen, danach „6 neue Meldung(en) mit
  Zeiten, Zug und Siegel", eine Sammlung, Zug ‚1. Zug' bleibt erhalten.
- **Exporte stimmen in der Stärke überein:** Lageblatt, Sammel-PDF,
  Übersichts-CSV und Excel nennen 1 / 12 / 37 / 50 bei 5 zählenden und 1
  abgerückten Einheit. Abgerückte stehen im eigenen Block, Excel trennt
  „Nicht in der Lage gezählt … in den Summen oben NICHT enthalten",
  `SUBTOTAL` nur über die zählenden Zeilen. Auftrag, Zug und Bemerkung der
  Einheit stehen in allen Ausgaben.
- **Stand der Aushänge:** „Lageblatt erstellt 20:45 · seitdem 2 neue
  Meldungen", auf der Startseite „Lageblatt … (seitdem 1 neue Meldung) ·
  Export … · Weitergegeben …".
- **Wiedereinstieg:** Nach dem Neuladen öffnet die App die zuletzt offene
  Sammlung.

## Abgleich mit Runde 3

Grundlage: [../runde-3/arbeitsablauf.md](../runde-3/arbeitsablauf.md) mit
„Stand der Behebung" und [../runde-3/README.md](../runde-3/README.md).

| Runde-3-Befund | Stand laut Behebung | Bewertung Runde 4 | Beobachtung |
| --- | --- | --- | --- |
| R3-W1 Rückimport übernimmt keine Änderungen (P0) | behoben | hält | Abrücken, Zug und Auftrag kommen in beide Richtungen an, Widerspruch wird benannt (siehe Bestätigtes). Beide Geräte zeigen danach dieselben Kopfzahlen. |
| R3-W2 Weitergabe-Vermerk zählt Importiertes (P2) | behoben | teilweise | Importierte *Meldungen* zählen nicht mehr als neu. Importierte *Änderungen* zählen weiter: „seitdem hier 3 Änderungen (Zug, Auftrag) … erneut weitergeben", obwohl alle drei vom anderen Gerät kamen (R4-W7). Einen Abschluss der Sammlung gibt es weiterhin nicht. |
| R3-W3 Zug-Bündel an den Meldekopf (P2) | behoben | hält, mit Rest | Rückfrage und Übernahme mit Zeiten, Zug und Siegel in eine Sammlung. Rest: Bei gleichnamiger Sammlung eines anderen Meldekopfs wird der Sammlungsname als Zug vorgeschlagen (R4-W8). |
| Bestätigtes R3: „Link bei vorhandener Sammlung → ‚Wohin damit?' … Gilt für Kaltstart und laufende App" | – | verkehrt | Bei laufender App hält es. Beim Kaltstart auf einem Gerät mit Sammlung und ohne eigenen Bogen kommt keine Frage, der fremde Bogen wird eigener Entwurf (R4-W3). Vermutlich Nebenwirkung der Behebung von R3-D2 (`START_SOFORT`). |
| R3-K4 (aus Führungssicht) Unterbringung zählte alle Anwesenden | behoben | teilweise | Lageblatt, Sammel-PDF und Excel zählen nur angeforderte Unterbringung. Die Übersichts-CSV zählt in „Unterbringung M/W/D" weiter alle Anwesenden (R4-W5). |
| R3-H3/R3-A7 (Verweise) „Übergeben" schon beim Erzeugen | weitgehend | hält | „PDF erzeugt 20:37 Uhr — Empfang nicht bestätigt" bzw. „Link kopiert … — Empfang nicht bestätigt", Bestätigung von Hand. |

Bilanz: Der P0 aus Runde 3 ist wirklich behoben, der Abgleich zwischen zwei
Meldekopf-Geräten trägt jetzt in beide Richtungen. R3-W3 hält, R3-W2 nur
für Meldungen, nicht für Änderungen. Neu verkehrt hat sich der Kaltstart
über Link am Meldekopf. Die neuen Risiken liegen nicht mehr zwischen zwei
Meldekopf-Geräten. Sie liegen bei der Frage, welche Fassung einer Einheit
gilt, und bei den Lieferungen an den Stab.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Einheit melden, neu melden, sammeln,
  abrücken, an die Ablösung geben und zurücknehmen: ja. Nachgereichter
  Bogen nach Schnellerfassung: nur mit „Fassung verwerfen…", ohne Hinweis
  der App (R4-W1). Lückenlose Nachträge an den Stab: nein (R4-W2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Nur neue Bögen seit dem letzten Export"
  klingt nach „seit der letzten Lieferung an den Stab". Gemeint ist „seit
  irgendeiner Datei aus diesem Einsatz", auch der eigenen Excel-Liste und
  der Übergabe an die Ablösung (R4-W2).
- **Größtes Einsatzrisiko:** Der vollständige Bogen einer schnell erfassten
  Einheit landet still in der Historie. Die Lage rechnet weiter mit
  StAN-Platzhaltern, falscher Stärke und ohne Sofortbedarf (R4-W1).
- **Top-Priorität für die nächste Iteration:** Beim Eintreffen eines Bogens
  für eine schnell erfasste Einheit die Schnellerfassung ersetzen lassen
  statt nach dem Zeitstempel zu entscheiden (R4-W1).
