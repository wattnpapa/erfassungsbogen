# Audit „Führungssicht", Runde 3 (Lage erfassen, Abweichungen sehen, Stand übergeben)

Stand: 04.10.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/gifted-cray-ngieaz`, Commit 33ed426.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-2-Befunde.

## Prüfaufbau

Chromium (Playwright aus `node_modules`, `/opt/pw-browsers/chromium`),
`isMobile`/`hasTouch` auf Telefon und Tablet, Locale de-DE, Zeitzone
Europe/Berlin. Geräte: Telefon 360 × 640, Tablet 820 × 1180, Laptop
1366 × 768. Jeder Lauf in einem eigenen Browser-Kontext. Ich habe zuerst ohne
Blick in frühere Berichte getestet und den Runde-2-Bericht sowie die Tabelle
„Stand der Behebung" erst danach gelesen.

Grundzustand über `localStorage`-Seeds (`eeb.einsaetze.v1`,
`eeb.entwurf.v1`, `eeb.vorlagen.v1`) aus `examples/thw/`, alle mit
`uebung: false`, Stand und Einsatzzeitraum auf den Prüftag gesetzt:

**Lage „Hochwasser Kocher · Schwäbisch Hall"** (Art „Einsatz"):

| Einheit | Quelle | Stärke | Lage-Zustand |
| --- | --- | --- | --- |
| THW Albstadt ZTr TZ, Oberhausen-Rheinhausen B, Freiburg FGr WP (A) | `thw/001`, `009`, `004` | 4 / 7 / 10 | Zug „1. TZ Albstadt" |
| THW Karlsruhe ZTr TZ, Sinsheim FGr W (B), Ulm B | `thw/006`, `012`, `013` | 4 / 11 / 6 → 8 | Zug „2. TZ Karlsruhe"; Sinsheim mit Auftrag; Ulm mit Folgemeldung (+2) |
| THW Weinsberg FGr Öl (C) | `thw/014` | 19 | Auftrag per Bedienung vergeben; Folgemeldung: Diesel 200 → 400 l, Sonstiges „Ölsperre 200 m verbraucht, Nachschub nötig" |
| THW Crailsheim FGr W (A) | `thw/003` | 12 → 9 | Erstmeldung am Vortag, Folgemeldung −3 Helfer |
| THW Biberach/Riß FGr O (B), Erlangen FGr Öl (B), Radolfzell Tr Log-TS | `thw/002`, `018`, `010` | 11 / 15 / 3 | ohne Zug; Biberach mit Auftrag, Erlangen „Manuell erfasst" |
| THW Ansbach FGr Log-MW, Füssen FGr K (A) | `thw/015`, `019` | 18 / 8 | abgerückt |
| THW Hilpoltstein FGr N | `thw/020` | 8 | versehentlich als Übung gemeldet |

Dazu eine zweite Sammlung „Übung Brückenbau" (1 Einheit), ein eigener
Entwurf (B Mühldorf) und eine Vorlage (B Regen). Stand der Lage: 14 gemeldet ·
11 zählend · 2 / 26 / 73 / 101 · 29 Fahrzeuge.

Die drei Folgemeldungen habe ich nicht in den Seed geschrieben, sondern über
„Bögen einlesen… → Dateien wählen…" (JSON) eingelesen, damit die Vererbung
von Zug, Auftrag und Eintreffzeit über den echten Eingangsweg läuft. Den
Auftrag der Weinsberger habe ich vorher über „Auftrag/Notiz" vergeben. Ein
erster Seed, in dem die Folgemeldungen direkt als Einträge standen, zeigte
erwartungsgemäß die Eintreffzeit der Folgemeldung; das ist ein Artefakt des
Seeds und kein Befund.

Geprüft: Kopfzahlen, Bedarf, Zwischensummen je Zug, Karten (kompakt und
aufgeklappt), Tabelle, Sortierung, Suche, Qualifikations- und Bedarfsfilter,
Lücken, Details, Änderungen, Historie, Vermerke, Abrücken mit „Rückgängig",
Übergabe per Sammel-PDF auf ein frisches Gerät („Einsatz importieren…"),
Startseite. Lageblatt (14 und 10 Einheiten), Sammel-PDF (44 Seiten), „Übersicht
als CSV", „Alle Daten als CSV" und die Excel-Liste „Oldenburg" habe ich
heruntergeladen und gegengelesen (`pdftotext`, `pdftoppm`, XLSX als XML
ausgelesen). Screenshots habe ich angesehen.

Nicht prüfbar: Kamera-Scan, Handscanner, Link-Weg einer Folgemeldung,
Nahbereichs-Weitergabe, echte Touch-Gesten und Handschuhe, echtes Drucken
(Schriftgröße nur aus dem PDF gemessen), Darstellung der Excel-Datei in
Excel/Numbers/Vorschau-Apps, native Builds.

Annahmen zum Ablauf (nicht aus Vorschriften belegt): Die Führungsstelle
kommt nach Unterbrechungen auf die Lage zurück und will zuerst wissen, was
sich seither geändert hat. Freitext der Einheit („Sonstiges") kann
Anforderungen enthalten. Die Unterbringungszahl wird zur Quartierplanung
genutzt.

## Urteil

Die Lage ist auf dem Tablet und am Laptop gut zu führen. Kopfzahlen,
„14 gemeldet · 11 zählend", Summenzeile, Lageblatt, CSV und Excel nennen
dieselben 2 / 26 / 73 / 101. Zug, Auftrag und Eintreffzeit überleben jetzt
die Folgemeldung per Datei. Das war der P0 aus Runde 2, und er hält. Das
Lageblatt schreibt „Diesel: von 200 l auf 400 l", nennt Zug, Bedarf, Lücken
und Auftrag je Einheit und passt bei zehn Einheiten auf eine Seite. Die
Excel-Liste trennt Abgerückte und Übung in einen eigenen Block, trägt Auftrag
und Eintreffzeit und summiert nur die zählenden Einheiten. Die Übergabe per
Sammel-PDF bringt Zahlen, Züge, Aufträge, Historie und Vermerke vollständig
auf ein zweites Gerät.

Reibung liegt jetzt bei der Frage „Was ist seit meinem letzten Blick neu?".
Eine Folgemeldung, die eine Einheit um drei Helfer schwächer macht, landet
in der Sortierung „neueste zuerst" auf Platz 14 von 14. Sie trägt keine Marke
„kürzlich", und nach dem Neuladen ist auch die Quittung weg. Auf dem Telefon
verschweigt die neue Kompaktzeile außerdem Auftrag, Änderung, Lücken und
Zeiten. Freitext der Einheit wie „Nachschub nötig" erscheint nicht im
Lagebild und nicht auf dem Lageblatt (außer als Änderung) und ist über die
Suche nicht zu finden. Die Unterbringungszahl „M 71 / W 30" zählt alle 101
Anwesenden, nicht die 66 Personen der sechs Einheiten, die Unterbringung
angefordert haben.

Die Lage lässt sich ohne fremde Hilfe erfassen, führen und übergeben.
Veränderungen erkennt man nur, wenn man jede Karte selbst prüft.

## Befunde

### R3-K1 [P1] Folgemeldungen sind nicht als neu erkennbar: keine Marke, Sortierung ignoriert sie, Quittung flüchtig (neu)

**Priorität:** P1

**Nachweis:** gemessen (Tablet 820 × 1180 und Telefon 360 × 640), nach dem
Neuladen wiederholt.

**Fundstelle / Aufgabe:** Einsatzansicht, Liste „Einheiten". Drei
Folgemeldungen über „Bögen einlesen…" eingelesen (Crailsheim 12 → 9, Ulm
6 → 8, Weinsberg Diesel 200 → 400 l und Sonstiges). Danach Sortierung
„Eintreffzeit (neueste zuerst)".

**Beobachtung:**
- Direkt nach dem Einlesen steht die Quittung „Zuletzt aufgenommen (3): THW
  Weinsberg …, THW Crailsheim …, THW Ulm …", dazu unten der Hinweis „3 Bögen
  aufgenommen.". Ob es neue Einheiten oder Folgemeldungen sind und was sich
  geändert hat, sagt sie nicht. Nach dem Neuladen ist sie weg (0
  Quittungselemente).
- In „neueste zuerst" stehen die drei frischen Fassungen auf den Plätzen 6
  (Ulm), 11 (Weinsberg) und 14 von 14 (Crailsheim). Sortiert wird nach der
  geerbten Eintreffzeit. Oben stehen Hilpoltstein (Übung) und Radolfzell, die
  seit 21:10 bzw. 21:00 unverändert sind.
- Die Marke „kürzlich eingetroffen" bekommen nur Radolfzell und Hilpoltstein.
  Eine Folgemeldung erbt die Eintreffzeit und erhält die Marke deshalb nie.
- Auf dem Tablet zeigen die Karten „seit 03.10.2026, 20:25: Stärke 12 → 9"
  und „seit 04.10.2026, 09:45: 2 Änderungen". Diese Zeile steht aber
  dauerhaft an jeder Einheit, die je nachgemeldet hat. Ob die Änderung vor
  einer Minute oder vor sechs Stunden kam, liest man nur aus „Stand …" ab.
- Auf dem Telefon fehlt selbst diese Zeile in der Kompaktansicht (siehe
  R3-K2). Crailsheim zeigt dort „Stärke 0 / 3 / 6 / 9" ohne jeden Hinweis,
  dass vorher 12 gemeldet waren.

**Erwartung der Rolle:** Nach einer Unterbrechung sehe ich auf einen Blick,
welche Einheiten sich seit meinem letzten Blick gemeldet haben, auch per
Folgemeldung, und was sich dabei geändert hat. Ein Stärkeverlust fällt auf.

**Auswirkung im Einsatz:** Eine Einheit meldet drei Helfer ab. Die
Führungsstelle plant weiter mit zwölf, bis jemand zufällig die Karte
aufklappt oder das Lageblatt neu druckt. Bei mehreren Meldern und einem
Schichtwechsel lässt sich die Frage „was kam in der letzten halben Stunde?"
nur beantworten, wenn man alle Karten einzeln durchgeht. Die Kopfzahl ändert
sich um ein paar Köpfe, und das sieht man ihr nicht an.

**Empfehlung:** Den Eingang einer Fassung (nicht nur die Ersteintreffzeit)
als „zuletzt gemeldet" führen: Marke „neue Fassung" für eine gewisse Zeit,
Sortierung „zuletzt gemeldet". Stärkeverluste zusätzlich hervorheben.
Die Sammelquittung nach Folgemeldungen mit der Änderung („Crailsheim
12 → 9") versehen und bis zur Kenntnisnahme stehen lassen, auch über ein
Neuladen hinweg.

**Verifikation:** Lage mit zehn Einheiten, zwei Stunden alt. Eine
Folgemeldung mit −3 Helfern einlesen, neu laden. Auf Tablet und Telefon muss
die Einheit ohne Aufklappen als frisch geändert erkennbar sein, mit
„12 → 9", und in einer Sortierung oben stehen.

### R3-K2 [P2] Telefon: Kompaktzeile verschweigt Auftrag, Änderung, Lücken und Zeiten (neu, Folge der Behebung von R2-K7)

**Priorität:** P2

**Nachweis:** beobachtet (Screenshots 360 × 640) und im Stil nachgesehen.

**Fundstelle / Aufgabe:** Einsatzansicht auf dem Telefon, Liste
„Einheiten", zugeklappte Zeilen.

**Beobachtung:** Bis 600 px zeigt jede Zeile nur „Nr. 4 THW Weinsberg
Fachgruppe Ölschaden (C) · Stärke 0 / 4 / 15 / 19 · Ruhezeit · Unterbringung
angefordert · Diesel 400 l" und die Zug-Marke. Es fehlen:
„Auftrag/Notiz: Ölsperre Kocher km 12 – Hafen Untermünkheim", die
Änderungszeile „seit …: 2 Änderungen", „1 Lücke", „eingetroffen 09:55" und
die Marke „kürzlich eingetroffen" (laut Stilregel bewusst ausgeblendet). All
das steht erst nach Antippen da. Im Gegenzug sind die Zeilen kurz: 5
Einheiten ganz im Bild, mittlere Zeilenhöhe 126 px, Liste 2 038 bis
3 805 px, Seite 5 453 px statt 8 462 px in Runde 2.

**Erwartung der Rolle:** Beim Gang durch den Bereitstellungsraum reicht eine
Zeile je Einheit. Ob sie einen Auftrag hat und ob sich seit der letzten
Meldung etwas geändert hat, gehört aber in diese Zeile, notfalls als kurzes
Zeichen.

**Auswirkung im Einsatz:** Wer die Lage mit dem Telefon führt, etwa als
Zugführer, sieht nicht, welche Einheiten noch ohne Auftrag sind und welche
nachgemeldet haben. Er muss jede Zeile antippen. Die Behebung von R2-K1
(Auftrag bleibt erhalten) ist auf dem Telefon damit nur nach Antippen
sichtbar.

**Empfehlung:** In die Kompaktzeile je ein kurzes Merkmal für „Auftrag
vorhanden/fehlt", „geändert seit …" und Lücken aufnehmen, ohne die Zeile zu
verdoppeln (etwa als kleine Zeichen hinter der Stärke).

**Verifikation:** 360 × 640, Lage mit zehn Einheiten, davon drei mit Auftrag
und zwei mit Folgemeldung. Ohne Antippen muss erkennbar sein, welche
Einheiten einen Auftrag haben und welche nachgemeldet haben. Weiterhin
mindestens fünf Einheiten im Bild.

### R3-K3 [P2] Freitext der Einheit („Sonstiges") fehlt im Lagebild, auf dem Lageblatt und in der Suche (neu)

**Priorität:** P2

**Nachweis:** gemessen.

**Fundstelle / Aufgabe:** Weinsberg meldet per Folgemeldung „Sonstiges:
Ölsperre 200 m verbraucht, Nachschub nötig". Albstadt meldet in der
Erstmeldung „MzKW zusätzlich über StAN-Soll dabei.".

**Beobachtung:**
- Karte (kompakt und aufgeklappt): kein Sonstiges. Es steht nur unter
  „Details" und, weil es sich geändert hat, unter „Änderungen".
- Lageblatt: Bei Weinsberg steht der Text nur in der Spalte „Veränderung"
  als „von 1 Helfer über StAN-Soll … auf Ölsperre 200 m verbraucht,
  Nachschub nötig". Bei Albstadt (Erstmeldung) steht das Sonstige nirgends.
  Eine Spalte „Bemerkung" gibt es nicht.
- „Übersicht als CSV": keine Spalte für Sonstiges.
- Suche „Nachschub": 0 von 14. Suche „Untermünkheim" (Auftrag): 1 Treffer.
- Vorhanden ist der Text in der Excel-Liste (Spalte „Bemerkung"), in „Alle
  Daten als CSV" und im Bogen der Sammel-PDF.

**Erwartung der Rolle:** Was die Einheit mir zusätzlich mitteilt, steht dort,
wo ich die Lage lese. Anforderungen im Freitext gehen nicht unter.

**Auswirkung im Einsatz:** Eine Nachschubanforderung im Freitext erreicht die
Führungsstelle nur, wenn jemand „Details" öffnet. Auf dem Lageblatt fehlt sie
nach der nächsten Folgemeldung ganz, weil dann nichts mehr „geändert" ist.

**Empfehlung:** Sonstiges als kurze Zeile auf der Karte (gekürzt, mit
Aufklappen), als Spalte „Bemerkung" auf Lageblatt und Übersicht-CSV, und in
der Suche berücksichtigen.

**Verifikation:** Einheit mit Sonstiges „Nachschub nötig" einlesen. Der Text
muss auf der Karte ohne „Details", auf dem Lageblatt und in der Übersicht-CSV
stehen, und die Suche „Nachschub" muss sie finden.

### R3-K4 [P2] Unterbringung: „M 71 / W 30" zählt alle Anwesenden, nicht die anfordernden Einheiten (neu)

**Priorität:** P2

**Nachweis:** gemessen; Summierung im Code bestätigt
(`src/app/auswertung.ts`, `unterbringungLage` wird für jede anwesende Einheit
addiert, unabhängig von der Anforderung).

**Fundstelle / Aufgabe:** Block „Bedarf (anwesende Einheiten)", Lageblatt
„Bedarf gesamt", Zwischensummen je Zug.

**Beobachtung:** Angezeigt wird „Unterbringung M 71 / W 30 / D 0 · 6×
angefordert", auf dem Lageblatt „Unterbringung/WC/Dusche: M 71 / W 30 / D 0 ·
6× Unterbringung angefordert". 71 + 30 = 101, also alle anwesenden Personen.
Unterbringung angefordert haben Biberach (11), Erlangen (15),
Oberhausen-Rheinhausen (7), Radolfzell (3), Sinsheim (11) und Weinsberg (19),
zusammen 66 Personen. Diese Zahl und ihre M/W/D-Aufteilung stehen nirgends.
Der Link „6× angefordert" filtert die sechs Karten richtig. Die Personen muss
man aber selbst zusammenzählen.

**Erwartung der Rolle:** „Wie viele Plätze, getrennt nach M/W/D, brauche ich
heute Nacht?" ist eine Zahl, die ich ohne Kopfrechnen weitergeben kann.

**Auswirkung im Einsatz:** Wer die Zahl neben „angefordert" liest, bestellt
Quartier für 101 statt 66 Personen, oder er rechnet sechs Karten von Hand
nach. Annahme: Die M/W/D-Zahl für WC/Dusche (alle Anwesenden) wird ebenfalls
gebraucht. Sie ist richtig, aber nicht als solche beschriftet.

**Empfehlung:** Zwei Zahlen trennen und beschriften: „WC/Dusche (alle
Anwesenden): M 71 / W 30 / D 0" und „Unterbringung angefordert: 6 Einheiten,
66 Personen (M … / W … / D …)". Dieselbe Trennung auf dem Lageblatt.

**Verifikation:** Lage mit elf Einheiten, sechs davon mit Unterbringung.
App und Lageblatt müssen die Personenzahl der sechs Einheiten mit M/W/D
ausweisen.

### R3-K5 [P3] Lagekopf und Startseite ohne Zeitbezug der letzten Meldung (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Kopf der Einsatzansicht; Karte der Sammlung auf der
Startseite; Gerät nach „Einsatz importieren…".

**Beobachtung:** Der Kopf zeigt „Hochwasser Kocher · Einsatz · Schwäbisch
Hall" und die Kopfzahlen, aber keine Uhrzeit, etwa der letzten Meldung. Die
Startseitenkarte zeigt „11 Einheit(en) anwesend · Stärke 2 / 26 / 73 / 101 ·
Lageblatt: noch keins · Export: noch keiner", aber nicht, wann zuletzt etwas
einging. Auf dem Gerät, das die Lage aus der Sammel-PDF übernommen hat, steht
ebenfalls nichts dazu („übernommen aus Sammel-PDF vom 04.10.2026, 21:18").
Auf dem Telefon liegt die Sammlung auf der Startseite zudem erst unterhalb
von Entwurf, „Meinen Bogen ausfüllen", Meldekopf-Knöpfen und Vorlagen (Karte
bei rund 1 850 px).

**Erwartung der Rolle:** Neben den Zahlen steht, wie aktuell sie sind:
„letzte Meldung 21:22".

**Auswirkung im Einsatz:** Wer das Gerät übernimmt, weiß nicht, ob die Zahl
von eben oder von gestern ist. Bei einem übernommenen Gerät ist unklar, ob
das alte Gerät danach noch Meldungen bekam.

**Empfehlung:** „Letzte Meldung …" im Kopf und auf der Startseitenkarte;
nach einem Import „übernommen aus … vom …".

**Verifikation:** Lage öffnen, Folgemeldung einlesen, neu laden: Kopf und
Startseite nennen die Uhrzeit der letzten Meldung.

### R3-K6 [P3] Lageblatt: 6,9-pt-Schrift, Bedarf ab 13 Zeilen auf Seite 2, alle Bedarfe fett (neu)

**Priorität:** P3

**Nachweis:** gemessen (PDF-Textboxen).

**Fundstelle / Aufgabe:** „Lageblatt (A4 quer)" mit 14 Einträgen (11
zählend, 1 Übung, 2 abgerückt) und mit 10 Einheiten.

**Beobachtung:**
- Die Tabellenschrift ist etwa 6,9 pt hoch (Zeilenbox 6,94 pt, Helvetica).
- Bei 10 Einheiten passt alles auf eine Seite. Bei 14 Einträgen stehen
  „Bedarf gesamt" (Diesel 1420 l, Unterbringung, Ruhezeit 5 Einheiten) und
  die Zwischensummen je Zug allein auf Seite 2. Seite 1 endet mit der
  Stärke-Summe. Der Knopf heißt jetzt ehrlich „A4 quer".
- In der Spalte „Bedarf" sind „Ruhezeit · Unterbr." und „Diesel 80 l"
  gleich fett. Die Unterscheidung dringend/Routine der App fehlt auf Papier.
- Bei Folgemeldungen kürzt das Lageblatt („Mannschaft: von 9 auf 6 … und 5
  weitere Änderungen"). Die Gesamtstärke 12 → 9 steht erst in der Sammel-PDF.

**Erwartung der Rolle:** Ein Blatt, das an der Wand aus einem Meter lesbar
ist, mit dem Bedarf auf der ersten Seite.

**Auswirkung im Einsatz:** Wer nur Seite 1 aushängt oder faxt, gibt Stärke,
aber keinen Bedarf weiter. Bei schlechtem Licht ist 6,9 pt grenzwertig.

**Empfehlung:** Bedarfssumme auf Seite 1 (etwa als Kopfleiste), dringenden
Bedarf auf Papier abheben (fett nur Ruhezeit/Unterbringung), in der
Änderungsspalte zuerst die Gesamtstärke nennen.

**Verifikation:** Lage mit 14 Einträgen drucken. Seite 1 enthält Stärke und
Bedarfssumme, und „Ruhezeit" ist von „Diesel" unterscheidbar.

### R3-K7 [P3] Kleinere Stellen (neu)

**Priorität:** P3

**Nachweis:** beobachtet bzw. gemessen; Excel-Punkt als Risiko.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **Abgerückte Karte mit Bedarfsmarke:** Erlangen nach „Abrücken" trägt
  weiter die gelbe Marke „Unterbringung angefordert", ebenso Füssen. Gezählt
  wird sie richtig nicht, sie zieht aber den Blick.
- **Exporte ohne gemeinsame Nummer und Zeitform:** Lageblatt und App führen
  „Nr. 7", die CSV „Übersicht" hat keine Spalte „Nr.". In einer CSV-Zeile
  stehen drei Zeitformate: „041436okt26" (Stand), „04.10.2026, 14:41"
  (Eingetroffen), „04.10.26, 14:41" (Empfangen).
- **„Alle Daten als CSV"** enthält weder Eingetroffen/Abgerückt noch
  Auftrag/Notiz der Führungsstelle; die Spalte „Auftrag" ist der Ort/Auftrag
  aus dem Bogen.
- **Excel-Summen ohne gespeicherte Werte (Risiko):** Die zehn SUBTOTAL-Summen
  stehen in Zeile 1 als Formel ohne zwischengespeicherten Wert. Excel und
  LibreOffice rechnen sie aus; Vorschau-Apps, die nicht rechnen, zeigen
  vermutlich leere Felder. Nicht geprüft.
- **„1 Lücke"** öffnet bei Weinsberg einen Sitzplatz-Hinweis („15 in den
  erfassten Fahrzeugen für 19 Personen"). Das Wort „Lücke" sagt nicht, worum
  es geht.
- **Tabelle am Laptop:** Der Rahmen ist 894 von 1 366 px breit, die Tabelle
  1 826 px. F/U/M und Kfz liegen erst nach seitlichem Rollen im Bild; die
  Einheitsspalte bleibt dabei stehen.

**Erwartung der Rolle:** Exporte lassen sich über eine Nummer mit dem
Lageblatt abgleichen, Zeiten sind überall gleich geschrieben, und Abgerückte
alarmieren nicht.

**Auswirkung im Einsatz:** Kurzes Stutzen, Umwege beim Abgleich zwischen
Papier und Datei.

**Empfehlung:** Bedarfsmarken an abgerückten Karten grau, Spalte „Nr." in
CSV und Excel, ein Zeitformat je Datei, Eintreff-/Abrückzeit und Notiz auch
in „Alle Daten", Summenwerte in der XLSX mitspeichern, „Lücke" durch den
Inhalt ersetzen („Sitzplätze fehlen: 4").

**Verifikation:** Jeden Punkt einzeln nachstellen, wie oben beschrieben.

## Bestätigtes (was gut funktioniert und erhalten bleiben sollte)

- Eine Zählweise überall: „11 Einheiten · 2 / 26 / 73 / 101", „Einheiten
  (14 gemeldet · 11 zählend)", „Summe (11 zählend · 1 Übung · 2 abgerückt)"
  in App-Tabelle, Lageblatt, Sammel-PDF, CSV; Excel-SUBTOTAL nur über die 11
  zählenden Zeilen. Diesel 1420 l, Benzin 80 l, Gemisch 20 l und 29 Fahrzeuge
  habe ich von Hand nachgerechnet; sie stimmen.
- Übung in einer Einsatzlage: „1 Übungsmeldung nicht gezählt — anzeigen",
  Karte „ÜBUNG", Lageblatt „zählt nicht in diese Lage", Excel-Block mit Grund.
- Folgemeldung per Datei: Ulm bleibt in „2. TZ Karlsruhe", Weinsberg behält
  „Auftrag/Notiz: Ölsperre Kocher km 12 – Hafen Untermünkheim" und
  „eingetroffen 09:55", Crailsheim „eingetroffen 03.10.2026, 20:35" (Tablet).
- „Änderungen" mit „Diesel: 200 l → 400 l" und dem alten und neuen Sonstigen;
  Sammel-PDF mit „Personal abgemeldet: Stein, Matthias …".
- Historie je Fassung mit „eingegangen 21:17 (aktuell)" und Herkunft,
  „Vermerke der Führungsstelle: 21:17 Auftrag/Notiz: …".
- Zwischensummen je Zug (1. TZ 21, 2. TZ 23, ohne Zug 57 = 101), Sortierung
  „Zug".
- Bedarfsfilter: „6× angefordert" und „Ruhezeit: 5×" springen in den
  passenden Filter („6 Einheiten mit angeforderter Unterbringung"),
  Abgerückte sind ausgenommen. Dringender Bedarf gelb, Kraftstoff grau.
- Abrücken: Quittung „… abgerückt 21:23 · Rückgängig", Kopfzahl sofort
  86, Karte „abgerückt 04.10.2026, 21:23 ändern".
- Lageblatt: „Erstellt 04.10.2026, 21:18", Funkrufname und Rückruf je
  Einheit, Block „Abgerückt (2)", Zeilen „Nachtrag von Hand", und in der App
  „Lageblatt erstellt 21:18 · seitdem keine neue Meldung".
- Übergabe: Sammel-PDF auf einem frischen Telefon-Kontext über „Einsatz
  importieren…" eingelesen; Zahlen, Züge, Aufträge, Abrückzeiten, „Historie
  (2)" und Vermerke stimmen mit dem Ursprungsgerät überein.
- Tabelle: Einheitsspalte fixiert, Entscheidungsspalten vorn (Einheit, Zug,
  Ges., Bedarf, Eingetr., Auftrag, Abger.), Seite am Laptop 1 366 px breit.
- Einsatzansicht bleibt mit einem Feuerwehr-Entwurf neutral blau.

## Abschluss

- **Aufgabe geschafft:** ja, mit Umwegen beim Erkennen von Änderungen
  (R3-K1, R3-K2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Eintreffzeit (neueste zuerst)" klingt nach
  „zuletzt gemeldet", lässt eine frische Folgemeldung aber auf dem letzten
  Platz stehen (R3-K1).
- **Größtes Einsatzrisiko:** Ein gemeldeter Stärkeverlust (12 → 9) bleibt
  unbemerkt, weil die Karte weder als neu markiert noch nach oben sortiert
  wird und auf dem Telefon die Änderung gar nicht zeigt (R3-K1, R3-K2).
- **Top-Priorität für die nächste Iteration:** Folgemeldungen als „neue
  Fassung" kennzeichnen und nach „zuletzt gemeldet" sortierbar machen, mit
  der Stärkeänderung sichtbar in der Zeile (R3-K1).

## Abgleich mit Runde 2

Grundlage: [../runde-2/fuehrungssicht.md](../runde-2/fuehrungssicht.md) und
[../runde-2/README.md → Stand der Behebung](../runde-2/README.md#stand-der-behebung).

| Runde-2-Befund | Bewertung Runde 3 | Beobachtung |
| --- | --- | --- |
| R2-K1 Folgemeldung löscht Zug, Auftrag, Eintreffzeit (P0) | hält | Per „Bögen einlesen…" eingelesen: Zug „2. TZ Karlsruhe", Auftrag Weinsberg und Ersteintreffzeit bleiben auf Karte, Tabelle, Lageblatt, CSV und Excel und nach Übergabe auf ein zweites Gerät erhalten. Scan- und Link-Weg nicht prüfbar. Neue Folgefrage: Die geerbte Eintreffzeit macht die Folgemeldung in Sortierung und Marke unsichtbar (R3-K1). |
| R2-K2 Excel zählt Abgerückte (P1) | hält | Block „Nicht in der Lage gezählt (abgerückt, aufgegangen oder Übung) — 3 Einheit(en)" mit „ABGERÜCKT — zählt nicht in der Lage" und Abrückzeit in „Einsatz-ende"; SUBTOTAL über die 11 zählenden Zeilen; Auftrag der Führungsstelle in „Aufträge", Bogen-Ort in „Vorgesehener Auftrag", Eintreffzeit in „eingetr. / zugew.". Rest: Summen ohne gespeicherte Werte (R3-K7, Risiko). |
| R2-K3 Lageblatt (P2) | hält, mit Rest | „von 200 l auf 400 l", Zug, Bedarf, Lücken und Auftrag je Einheit; 10 Einheiten auf einer Seite; Knopf „A4 quer". Ab 14 Einträgen Bedarf und Zwischensummen allein auf Seite 2, 6,9-pt-Schrift, Bedarf auf Papier einheitlich fett (R3-K6). |
| R2-K4 Filter Sofortbedarf (P2) | hält | Filter „nur dringender Bedarf (ohne Kraftstoff)": 8 von 14 (mit diesen Beispielbögen melden viele Ruhezeit oder Unterbringung). Kopf-Links springen in den Filter, Abgerückte ausgenommen, Kraftstoff grau. Neu daneben: Unterbringungszahl zählt alle Anwesenden (R3-K4). |
| R2-K5 Tabelle (P2) | hält | Einheitsspalte `sticky`, neue Spaltenfolge, `scrollWidth` = 1 366 px. F/U/M weiter rechts außerhalb des Rahmens (R3-K7); Spalte „Lücken" weiter nicht vorhanden (wie in der Behebungstabelle vermerkt). |
| R2-K6 Nachvollziehbarkeit (P2) | hält | „Vermerke der Führungsstelle: 21:17 Auftrag/Notiz: …", Historie mit „eingegangen 21:17", Herkunft „Aus Datei" auf Karte und in der CSV gleich. |
| R2-K7 Lagebild am Telefon (P3) | hält, Nebenwirkung | Kompaktzeilen: 5 Einheiten ganz im Bild (Verifikationsziel „mindestens fünf" erreicht; die Behebungstabelle nennt 7, mit diesen Beispielen sind es wegen zwei bis drei Markenzeilen 5). Seite 5 453 statt 8 462 px. Die Kompaktzeile blendet aber Auftrag, Änderung, Lücken, Zeiten und „kürzlich eingetroffen" aus (R3-K2). |
| R2-K8 Kleinere Stellen (P3) | weitgehend | Neutrale Farbe mit Feuerwehr-Entwurf bestätigt; Suche findet Auftrag („Untermünkheim", „Pumpenstandort", „Hangrutsch" je 1 Treffer), aber nicht Sonstiges („Nachschub" 0, R3-K3). Quittung nennt Namen. Fehlende Verpflegungsangabe nicht neu geprüft. |
| R2-N4 „alt" an jeder Karte (bestätigt aus anderem Bericht) | hält | Keine Karte und keine Tabellenzeile trägt „alt"; die Absender-Stände lagen 5 bis 10 Minuten vor dem Eintreffen. |

Bilanz: Von acht Runde-2-Befunden halten sieben vollständig oder mit kleinem
Rest (R2-K1 bis R2-K7), R2-K8 ist weitgehend umgesetzt. Verkehrt hat sich
keine Behebung. Eine hat eine Nebenwirkung: Die Kompaktzeile aus R2-K7 macht
auf dem Telefon unsichtbar, was R2-K1 und R2-K6 erhalten haben (R3-K2).
Neu sind R3-K1 bis R3-K7. R3-K1 ist die nächste Stufe von R2-K1: Die Daten
bleiben jetzt erhalten, aber die Veränderung fällt nicht auf.

## Stand der Behebung

Stand 05.10.2026. Geprüft mit Typprüfung, Unit-Tests (2 283 grün) und
Nachmessung im Dev-Server mit dem Seed dieses Audits (360 × 640, Lageblatt
per `pdftotext`).

| Befund | Stand | Umsetzung |
| --- | --- | --- |
| R3-K1 Folgemeldung nicht als neu erkennbar | behoben | Sammelquittung „Neu seit der letzten Kenntnisnahme (n)" mit „Folgemeldung 22:45: Stärke 12 → 9 (−3)", bleibt bis „Zur Kenntnis genommen" auch über Neuladen (`eeb.kenntnis-stand.v1`); Marke „neue Fassung"; Sortierung „Zuletzt gemeldet (neueste zuerst)". Nachlauf: Ulm, Crailsheim, Weinsberg auf Platz 1–3. |
| R3-K2 Kompaktzeile verschweigt Merkmale | behoben | Kurze Merkmale „Folgem. 22:46 · 12 → 9", „Auftrag ✓", Lücken mit Inhalt, „neue Fassung" zugeklappt sichtbar. 5 Einheiten weiter ganz im Bild. |
| R3-K3 Sonstiges fehlt | behoben | „Bemerkung der Einheit" auf Karte (Änderung hervorgehoben), Lageblatt/Übergabeblatt, Übersichts-CSV; Suche findet „Nachschub" (1 von 14). |
| R3-K4 Unterbringung zählt alle | behoben | „Unterbringung angefordert: 6 Einheiten, 66 Personen (M 44 / W 22 / D 0)", getrennt „WC/Dusche (alle Anwesenden)"; ebenso je Zug und auf dem Lageblatt. |
| R3-K5 Ohne Zeitbezug | behoben | „letzte Meldung …" im Kopf, auf der Startseitenkarte und in der Import-Quittung; laufende Sammlungen direkt aus der Weiche öffnen (1 046 statt 1 914 px). |
| R3-K6 Lageblatt | weitgehend | Kopfleiste „Lage" und „Bedarf" in 9 pt auf Seite 1, nur Dringendes fett, Gesamtstärke zuerst. Tabellenschrift bleibt 7,5 pt (8 pt schob zehn Einheiten auf zwei Seiten). |
| R3-K7 Kleinere Stellen | behoben | „Nr."/„Meldung Nr." in beiden CSV, eine Zeitform je Datei, „Alle Daten" mit Eingetroffen/Abgerückt/Notiz, Excel-Summen mit gespeichertem Wert, „Rückfrage: Sitzplätze fehlen: 4" statt „1 Lücke", Bedarf an Abgerückten grau, F/U/M/Kfz neben „Ges.". |
