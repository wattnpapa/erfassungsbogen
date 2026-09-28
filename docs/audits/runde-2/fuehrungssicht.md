# Audit „Führungssicht", Runde 2 (Lage erfassen, Abweichungen sehen, Stand übergeben)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-command-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Locale de-DE, Zeitzone
Europe/Berlin. Hauptgerät Tablet 820 × 1180 (Führungsstelle, Meldekopf),
dazu Telefon 360 × 640 und Laptop 1366 × 768. Ich habe zuerst ohne Blick in
frühere Berichte getestet und den Runde-1-Bericht, die Tabelle „Stand der
Behebung" und die anderen Runde-2-Berichte erst danach gelesen. Alle Zustände
sind durch Bedienung entstanden (Datei-Import, Schnellerfassung, Knöpfe der
Karten), `localStorage`-Seeds habe ich nicht verwendet. Die Browserprofile
blieben zwischen den Skriptläufen erhalten; jeder Lauf ist also zugleich ein
Neuladen.

**Lage „Übung Hochwasser Neckar · BR Heilbronn Nord"** (Art „Übung"),
aufgebaut über „Bögen einlesen… → Dateien wählen…" aus Kopien der
Beispielbögen. In den Kopien habe ich nur Stand und Einsatzzeitraum auf den
Prüftag gesetzt, beim Großbogen blieb der Stand vom Juli stehen:

| Einheit | Quelle | Stärke | Lage-Zustand |
| --- | --- | --- | --- |
| THW Albstadt ZTr TZ | `thw/001` | 1/1/2/4 | Zug „1. TZ" |
| THW Biberach/Riß FGr O (B) | `thw/002` + Folgemeldung | 0/2/9/11 → 0/2/7/9 | Zug „1. TZ", Folgemeldung (−2 Helfer, Diesel 50 → 200 l) |
| THW Oberhausen-Rheinhausen B | `thw/009` | 0/2/5/7 | Zug „1. TZ", Auftrag „Deichabschnitt Nord, Sandsackverbau ab 14:00" |
| THW Oldenburg (NI) verst. Bergungszug | `thw/grossbogen…` | 1/9/28/38 | Zug „1. TZ", Auftrag „Bereitstellung, Abruf durch EAL", Stand 16.07. |
| THW Hannover/Langenhagen FGr E | `thw/042` | 0/2/7/9 | Zug „Fachzug Wasser", Auftrag „Einspeisung Pumpwerk Süd", 1 Lücke |
| THW Weinsberg FGr Öl (C) | `thw/014` | 0/4/15/19 | Zug „Fachzug Wasser", 1 Lücke |
| THW Radolfzell Tr Log-TS | `thw/010` | 0/1/2/3 | abgerückt |
| THW Peine Tr ESS, THW Wesel ZTr FZ FK | `thw/046`, `thw/095` | 0/1/2/3, 1/1/2/4 | ohne Zug, je 1 Lücke |
| DRK SEG Sanität Buchenrode | `drk/seg-sanitaet` | 1/1/8/10 | ohne Zug, Ruhezeit + Unterbringung |
| Feuerwehr FF Lauffen am Neckar Gruppe | Startseite → Schnellerfassung (nur Stärke) → „In Einsatz aufnehmen…" | 0/1/8/9 | kein Sofortbedarf, 2 Lücken |

Stand der Lage: 11 gemeldet · 10 zählend, 4 / 24 / 84 / 112, 30 Fahrzeuge.
Vorab habe ich dieselben Beispielbögen unverändert in eine Sammlung der Art
„Einsatz" eingelesen, um die Übungs-Trennung zu prüfen. Die Folgemeldung habe
ich zusätzlich in einer eigenen Sammlung „Test Folge" auf zwei Wegen
nachgestellt.

Geprüft habe ich Kopfzahlen, Bedarf, Zwischensummen je Zug, Karten und
Tabelle, Sortierung (Name, Eintreffzeit, Zug), Suche, Qualifikations- und
Sofortbedarfsfilter, Lücken, Details, „Änderungen", „Historie", Abrücken und
„Rückgängig". Zur Übergabe habe ich „Einsatz weitergeben / sichern"
ausgeführt und die Datei im Telefonprofil über „Einsatz importieren…"
eingelesen. Lageblatt, Sammel-PDF, „Übersicht als CSV", „Alle Daten als CSV"
und die Excel-Liste „Oldenburg" habe ich heruntergeladen und gegengelesen:
PDF mit `pypdf` (Text) und `pdf.js` (Bild), XLSX mit `openpyxl`.

Nicht prüfbar waren der Kamera-Scan, der Handscanner, der Link-Weg einer
Folgemeldung, die nativen Builds und echte Touch-Gesten. Ein Umstand der
Testumgebung und kein Befund: Headless Chromium speichert Downloads, deren
Name einen Umlaut enthält („eeb-einsatz-Übung_…csv"), unter dem Namen
`download`. Der Anker trägt den richtigen Namen.

Annahmen zum Ablauf (nicht aus Vorschriften belegt): Die Führungsstelle
vergibt Einheiten einen Zug und einen Auftrag und braucht beides auch nach
jeder Folgemeldung. Die Excel-Liste „Oldenburg" und das Lageblatt gehen an
eine übergeordnete Stelle oder an die Ablösung, die ohne App damit arbeitet.

## Urteil

Die Einsatzansicht beantwortet die Grundfragen der Runde 1 jetzt direkt.
Kopfzahlen, „11 gemeldet · 10 zählend" und die Summenzeile zählen gleich.
Wer Ruhezeit, Unterbringung oder Diesel braucht, steht als Marke auf jeder
Karte. „eingetroffen 16:02" und „abgerückt 16:03" stehen ohne Tipp da, der
Auftrag der Führungsstelle auch, und die Lücken lassen sich aufklappen. Die
Übergabe per Datei trägt Zug, Auftrag, Abrückzeit und Historie vollständig
auf das nächste Gerät. Übungsbögen in einer Einsatz-Sammlung werden benannt
und nicht mitgezählt. Das ist ein deutlicher Fortschritt.

Reibung und Risiko liegen jetzt dort, wo die Lage sich ändert und wo sie das
Gerät verlässt. Eine Folgemeldung, die per Datei eingelesen oder aus einem
Bogen übernommen wird, löscht beobachtet Zug und Auftrag der Einheit. Die
Einheit rutscht in „Ohne Zug", ohne dass es irgendwo gemeldet wird. Die
Excel-Liste für die übergeordnete Stelle führt die abgerückte Einheit wie
eine anwesende und summiert sie mit. Den Auftrag und die Zeiten der
Führungsstelle enthält sie nicht. Das Lageblatt druckt Änderungen als „Diesel:
50 l !200 l" und sagt nicht, welche fünf Einheiten Ruhezeit brauchen. Zur
Priorisierung taugen die Werkzeuge wenig: Der Filter „nur mit Sofortbedarf"
lässt 10 von 11 Einheiten stehen, und in der Tabelle liegen Bedarf, Zeiten
und Auftrag rechts außerhalb des Bilds, auch auf dem Laptop.

Die Lage lässt sich ohne fremde Hilfe erfassen und führen. Die Weitermeldung
per Excel und der Erhalt von Zug und Auftrag über Folgemeldungen gelingen
nur, wenn man die Fehler kennt und von Hand nacharbeitet.

## Befunde

### R2-K1 [P0] Folgemeldung per Datei oder aus dem Bogen löscht Zug und Auftrag der Führungsstelle (neu)

**Priorität:** P0

**Nachweis:** beobachtet, auf zwei Wegen nachgestellt. Nach dem Neuladen
unverändert.

**Fundstelle / Aufgabe:** Einsatzansicht, Karte „THW Biberach/Riß
Fachgruppe Ortung (B)". Vorher „Zug zuordnen" → „1. TZ" und „Auftrag/Notiz" →
„Ortung Trümmerkegel B". Danach kommt eine Folgemeldung derselben Einheit
(Stärke 11 → 9, Diesel 50 → 200 l):
(a) über „Bögen einlesen… → Dateien wählen…" (JSON),
(b) über „Aus Datei laden…" auf der Startseite → Übersicht „In Einsatz
aufnehmen…" → Rückfrage „Einheit ist bereits gemeldet" → „Als neue Fassung
anhängen".

**Beobachtung:**
- Vorher zeigt die Karte „THW Biberach/Riß Fachgruppe Ortung (B) ÜBUNG 1. TZ
  neu … eingetroffen 16:03 … Auftrag/Notiz: Ortung Trümmerkegel B" und die
  Knöpfe „Zug ändern", „Auftrag ändern".
- Nach der Folgemeldung auf Weg (a): Die Zug-Marke fehlt, die Zeile
  „Auftrag/Notiz" auch, die Knöpfe heißen wieder „Zug zuordnen" und
  „Auftrag/Notiz". Die Eintreffzeit sprang von 16:03 auf 16:04, die Zeit der
  Folgemeldung. Auf Weg (b) genauso: Zug und Auftrag weg, „eingetroffen 16:15"
  statt 16:04, Herkunft jetzt „Manuell erfasst".
- Die Quittung sagt nur „1 Bogen/Bögen aufgenommen.", die Karte „seit
  281442sep26: Stärke 11 → 9". Dass Zug und Auftrag verloren gingen, steht
  nirgends. „Historie (2)" zeigt je Fassung nur Stand, Stärke und Herkunft.
  Der alte Auftrag lässt sich dort nicht ablesen und nicht zurückholen.
- In der großen Lage wechselte die Einheit dadurch in den Zwischensummen still
  von „1. TZ" zu „Ohne Zug". Der 1. TZ stand danach mit 3 statt 4 Einheiten
  und 49 statt 58 Personen da, im Lageblatt und in allen Exporten genauso.
- Im Code geprüft (technischer Hinweis, nicht live getestet): Die Vererbung
  „folgemeldungErbt" (`src/app/eintrag-zeiten.ts`) wird nur auf dem
  Scan-/Link-Weg aufgerufen (`src/app/app.tsx`, um Zeile 1137), auf den
  Datei-Wegen nicht. Den Zug übernimmt sie auf keinem Weg, nur Eintreffzeit
  und Auftrag. Bei einer gescannten Folgemeldung ist daher wahrscheinlich
  ebenfalls der Zug weg (plausibles Risiko).

**Erwartung der Rolle:** Eine Folgemeldung ändert, was die Einheit meldet:
Stärke, Fahrzeuge, Bedarf. Was die Führungsstelle festgelegt hat, also Zug,
Auftrag und Eintreffzeit, bleibt stehen, egal auf welchem Weg die
Folgemeldung kommt.

**Auswirkung im Einsatz:** Jede Einheit, die nachmeldet, verliert ihren
Auftrag und ihre Zugzuordnung. Die Zwischensumme je Zug stimmt nicht mehr,
und die Ablösung sieht eine Einheit „ohne Auftrag", die in Wirklichkeit am
Deich steht. Unter Last fällt das nicht auf, weil die Karte nur die
Stärkeänderung meldet. Die Eintreffzeit fürs Einsatztagebuch wird durch die
Zeit der letzten Folgemeldung ersetzt.

**Empfehlung:** Zug, Auftrag und Eintreffzeit gehören der Einheit in dieser
Lage, nicht der einzelnen Fassung. Sie müssen auf jedem Eingangsweg
(Scan, Link, Datei, Ordner, Übernahme aus dem Bogen) erhalten bleiben. Geht
auf einem Weg doch etwas verloren, muss die Quittung es nennen.

**Verifikation:** Einheit mit Zug und Auftrag anlegen, dann je eine
Folgemeldung per Scan, Link, „Bögen einlesen…" (Datei und Ordner) und „In
Einsatz aufnehmen…" einspielen. Nach jeder Fassung müssen Zug-Marke,
„Auftrag/Notiz" und die ursprüngliche Eintreffzeit unverändert auf Karte,
Tabelle, Lageblatt und in der Excel-Liste stehen.

### R2-K2 [P1] Excel-Liste „Oldenburg" zählt Abgerückte mit und lässt Auftrag und Zeiten der Führungsstelle weg (neu)

**Priorität:** P1

**Nachweis:** beobachtet (Datei heruntergeladen und mit `openpyxl`
ausgelesen). Den Kommentar im Code (`src/app/oldenburg-xlsx.ts`,
`einsatzOldenburgXlsx`) habe ich nur zur Bestätigung gelesen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Excel-Liste (Format
„Oldenburg")". Die Lage hat 10 zählende Einheiten und 1 abgerückte, drei
Einheiten tragen einen Auftrag der Führungsstelle.

**Beobachtung:**
- Das Blatt hat 11 Datenzeilen. „Tr Log-TS / OV Radolfzell" (abgerückt 16:03)
  steht wie jede andere Zeile da, ohne Status und ohne Kennzeichen. Die Spalten
  „Einsatz-ende" und „Rück-führung" sind leer.
- Die SUBTOTAL-Summen über „Fü / Ufü / He" ergeben 4 / 25 / 86 = 115. Die App,
  das Lageblatt und die CSV sagen 4 / 24 / 84 = 112.
- In der Spalte „Aufträge" steht bei jeder Einheit der Ort/Auftrag aus ihrem
  eigenen Bogen („Übung Hochwasser Neckar"; beim Oldenburger Großbogen ein
  langer Text über den Landkreis Oldenburg aus einem früheren Einsatz). Die
  Aufträge der Führungsstelle („Deichabschnitt Nord, Sandsackverbau ab
  14:00", „Einspeisung Pumpwerk Süd", „Bereitstellung, Abruf durch EAL")
  stehen nirgends im Blatt.
- „eingetr. / zugew." ist bei allen Zeilen leer, obwohl die App für jede
  Einheit eine Eintreffzeit führt.
- Die CSV „Übersicht" derselben Lage macht es richtig: Spalten „Status"
  („abgerückt"), „Zählt in Lage" („nein"), „Auftrag/Notiz" und „Eingetroffen",
  Summe über 10 Einheiten.

**Erwartung der Rolle:** Die Liste, die an die übergeordnete Führungsstelle
geht, zeigt dieselbe Lage wie mein Bildschirm: wer da ist, wer weg ist, seit
wann, mit welchem Auftrag.

**Auswirkung im Einsatz:** Die nächste Ebene rechnet mit drei Helfern und
einem Fahrzeug, die schon abgerückt sind. Ob sie die Aufträge kennt, hängt
davon ab, ob jemand sie zusätzlich mündlich oder per CSV durchgibt. Wer die
Liste mit dem Lageblatt vergleicht, findet zwei verschiedene Stärken für
denselben Zeitpunkt. Annahme: Die Liste wird dort ohne App weiterverwendet.

**Empfehlung:** Abgerückte in der Excel-Liste entweder weglassen oder
sichtbar kennzeichnen und mit Abrückzeit in „Einsatz-ende"/„Rück-führung"
eintragen. Die SUBTOTAL-Summen müssen dann den App-Summen entsprechen, etwa
über einen voreingestellten Filter. Den Auftrag der Führungsstelle in
„Aufträge" oder „Vorgesehener Auftrag" schreiben, die Eintreffzeit in
„eingetr. / zugew.".

**Verifikation:** Lage mit einer abgerückten Einheit und einem Auftrag
exportieren. In Excel müssen die Summen gleich den Kopfzahlen der App sein,
die abgerückte Zeile muss als solche erkennbar sein, und der Auftrag muss
lesbar sein.

### R2-K3 [P2] Lageblatt: Pfeile als „!", Bedarf und Zug nicht je Einheit, „1 Seite" sind zwei (neu)

**Priorität:** P2

**Nachweis:** beobachtet (PDF mit `pdf.js` gerendert und als Text
ausgelesen). Die Übergabe-Übersicht auf Seite 1 des Sammel-PDF hat denselben
Aufbau und dieselben Stellen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Lageblatt (1 Seite)".

**Beobachtung:**
- In der Spalte „Veränderung seit der letzten Meldung" steht bei Biberach
  „Mannschaft: 9 !7", „Gesamtstärke: 11 !9", „Diesel: 50 l !200 l" und
  „Unterbringung M/W/D: M 8 / W 3 / D 0 !M 7 / W 2 / D 0". In der App steht an
  denselben Stellen „→".
- Unten steht „Ruhezeit erforderlich bei 5 Einheit(en)" und „6× Unterbringung
  angefordert". Welche Einheiten das sind, steht nirgends auf dem Blatt. Die
  Tabelle hat keine Spalte für Sofortbedarf, obwohl Karte und App-Tabelle sie
  zeigen.
- Den Zug einer Einheit zeigt das Blatt nicht; es gibt nur die
  Zwischensummen je Zug. Die Lücken der Meldungen fehlen ebenfalls.
- „Lageblatt (1 Seite)" erzeugt zwei Seiten. Seite 2 enthält nur die drei
  Zeilen der Zwischensummen, der Rest der Seite ist leer.
- Gut: Eingetroffen und Abgerückt mit Datum und Uhrzeit, ein eigener Block
  „Abgerückt (1)", die Summenzeile „Summe (10 zählend · 1 abgerückt)", der
  Auftrag der Führungsstelle, „Erstellt 28.09.2026, 16:11".

**Erwartung der Rolle:** Das Lageblatt ist das, was ich der Ablösung oder dem
Verbandsführer in die Hand drücke. Es beantwortet dieselben Fragen wie der
Bildschirm: wer, welcher Zug, was braucht er, was hat sich geändert.

**Auswirkung im Einsatz:** „Diesel: 50 l !200 l" lässt sich als Ausruf lesen
statt als Änderung. Die Ruhezeit-Frage („welche fünf?") muss die Ablösung per
Funk oder am Gerät klären. Das Blatt ersetzt die mündliche Übergabe also nicht
ganz. Die Seitenzahl im Knopf stimmt nicht; wer nur Seite 1 druckt oder
faxt, dem fehlen die Zwischensummen.

**Empfehlung:** Den Pfeil in einer Schrift ausgeben, die ihn enthält, oder
„von … auf …" schreiben. Je Einheit eine kurze Spalte „Zug" und „Bedarf"
(wie in der App-Tabelle: „Ruhezeit · Unterbr. · Diesel 200 l"), Lücken als
Zahl. Die Zwischensummen auf Seite 1 bringen oder den Knopf ehrlich
beschriften.

**Verifikation:** Lageblatt einer Lage mit Folgemeldung, Zügen und einer
Einheit mit Ruhezeit ausdrucken. Die Änderung muss als „50 l → 200 l" lesbar
sein, und die Einheit mit Ruhezeit und ihr Zug müssen ohne App erkennbar sein.
Bei bis zu etwa zehn Einheiten muss alles auf eine Seite passen.

### R2-K4 [P2] Priorisierung: „nur mit Sofortbedarf" trifft fast alle, dringender Bedarf sieht aus wie Diesel (neu)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht, Filter „nur mit Sofortbedarf";
Bedarfsmarken der Karten; Block „Bedarf (anwesende Einheiten)".

**Beobachtung:** Mit Haken bleiben 10 von 11 Karten stehen, darunter die
abgerückte Einheit. Nur die Schnellerfassung ohne jede Bedarfsangabe fällt
heraus. Der Grund: Jede Einheit meldet Kraftstoff, und Kraftstoff zählt als
Sofortbedarf. „Ruhezeit", „Unterbringung angefordert" und „Diesel 80 l" sind
gleich große, gleich gefärbte Marken. Der Kopf nennt „Ruhezeit: 5×" und „6×
angefordert", beides lässt sich nicht antippen, und es gibt weder Filter noch
Sortierung nach Ruhezeit oder Unterbringung. Die Sortierungen sind Name,
Eintreffzeit, Zug und Organisation.

**Erwartung der Rolle:** Ein Tipp zeigt mir die Einheiten, bei denen jetzt
etwas zu entscheiden ist: Wer muss schlafen, wer braucht ein Quartier? Den
Diesel sammle ich für die Logistik als Summe.

**Auswirkung im Einsatz:** Der Filter spart keine Zeit, man liest wieder alle
Karten. Eine Ruhezeit-Anforderung geht zwischen den Diesel-Marken unter,
besonders auf dem Telefon, wo eine Karte fast den ganzen Bildschirm füllt.

**Empfehlung:** Die Bedarfsarten unterscheiden: Ruhezeit und Unterbringung
als eigene Filter oder Sortierung, visuell abgesetzt von Verbrauchswerten.
Die Zeilen „Ruhezeit: 5×" und „6× angefordert" im Kopf als Sprung in den
passenden Filter anbieten. Abgerückte aus dem Filter nehmen.

**Verifikation:** Lage mit elf Einheiten, alle mit Diesel, zwei mit
Ruhezeit. Ein Tipp muss genau diese zwei zeigen.

### R2-K5 [P2] Tabelle: Bedarf, Zeiten und Auftrag liegen außerhalb des Bilds, die Einheit scrollt mit weg (neu; Seitenbreite siehe R2-G2)

**Priorität:** P2

**Nachweis:** beobachtet und gemessen.

**Fundstelle / Aufgabe:** Einsatzansicht → „Tabelle" auf Tablet
(820 × 1180) und Laptop (1366 × 768).

**Beobachtung:** Die Spaltenfolge ist Einheit, Org., Zug, F, U, M, Ges.,
Verpfl., Veg., Vegan, Unt. M/W/D, Diesel, Benzin, Gemisch, Kfz, Bedarf,
Eingetr., Abger., Stand, Auftrag. Der Rollrahmen zeigt auf dem Tablet 754 von
1 889 px, auf dem Laptop 894. Sichtbar sind auf beiden Geräten nur die
Spalten bis „Unt. M" bzw. „Diesel". Rollt man nach rechts zu „Bedarf",
„Eingetr." und „Auftrag", ist die Spalte „Einheit" weg; sie ist nicht
fixiert (`position: static`). Man sieht dann „Deichabschnitt Nord,
Sandsackverbau ab 14:00" ohne Namen daneben, und in der Stand-Spalte trägt
jede Zeile „alt" (R2-N4). Lücken hat die Tabelle gar nicht. Auf dem Tablet
lässt sich außerdem die ganze Seite auf 1 842 px verschieben, auf dem Laptop
auf 2 045 px, rechts ist dann nur leere Fläche (wie R2-G2).

**Erwartung der Rolle:** Die Tabelle ist mein Lagebild auf einen Blick: eine
Zeile je Einheit mit Stärke, Bedarf, seit wann und welcher Auftrag.
Verpflegung vegan und Unterbringung divers brauche ich seltener.

**Auswirkung im Einsatz:** Wer in der Tabelle arbeitet, sieht Auftrag und
Bedarf nicht zusammen mit der Einheit. Man zählt Zeilen ab oder wechselt
zurück in die Karten. Auf dem Tablet reicht ein schräges Wischen, und die
Seite steht leer da.

**Empfehlung:** Die Einheitsspalte beim seitlichen Rollen stehen lassen.
Entscheidungsspalten (Zug, Stärke gesamt, Bedarf, Eingetroffen, Auftrag,
Lücken) nach vorn, Verpflegungs- und Unterbringungsaufschlüsselung nach
hinten oder einklappbar. Die Seite darf nicht breiter werden als das Gerät.

**Verifikation:** Tablet 820 × 1180, „Tabelle": Einheit, Stärke, Bedarf,
Eingetroffen und Auftrag stehen ohne seitliches Rollen im Bild, und
`scrollWidth` ist gleich der Fensterbreite.

### R2-K6 [P2] Nachvollziehbarkeit: Handlungen der Führungsstelle ohne Zeit, Herkunft je Weg anders benannt (neu)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Karte, „Historie", CSV „Übersicht".

**Beobachtung:**
- Zug zuordnen, Auftrag vergeben oder ändern und die Korrektur einer
  Eintreffzeit hinterlassen keine Spur. Auf der Karte steht nur der aktuelle
  Wert („Auftrag/Notiz: Einspeisung Pumpwerk Süd"), ohne Zeit und ohne
  Vorwert. Eine Rückfrage „seit wann hat die FGr E diesen Auftrag?" lässt
  sich nicht beantworten.
- „Historie (2)" zeigt je Fassung „Stand 281557sep26 · Stärke 0 / 2 / 7 / 9 ·
  Aus Datei (aktuell)". Wann die Fassung hier eingegangen ist, steht nicht
  dabei.
- Dieselben JSON-Importe heißen auf der Karte „Aus Datei" und in der CSV
  „PDF-Import". Die aus einer Datei übernommene Folgemeldung (R2-K1 Weg b)
  heißt „Manuell erfasst". Bei „Manuell erfasst" steht weiterhin nicht,
  wer erfasst hat.

**Erwartung der Rolle:** Für Einsatztagebuch und Übergabe will ich lesen
können, wann welche Festlegung getroffen wurde und woher eine Meldung kam.

**Auswirkung im Einsatz:** Die Ablösung sieht den Stand, aber nicht den
Verlauf der eigenen Entscheidungen. Wer der Herkunftsangabe traut, sucht
bei einer Rückfrage ein PDF, das es nie gab.

**Empfehlung:** Führungsstellen-Handlungen mit Uhrzeit in die Historie der
Einheit schreiben („16:05 Zug 1. TZ", „16:06 Auftrag: …"), je Fassung die
Eingangszeit zeigen und die Herkunft auf Karte und Export gleich benennen.

**Verifikation:** Auftrag vergeben, ändern, Folgemeldung einspielen. Die
Historie muss alle drei Vorgänge mit Uhrzeit zeigen, und Karte und CSV müssen
dieselbe Herkunft nennen.

### R2-K7 [P3] Telefon: Lagebild nur über rund 13 Bildschirmhöhen, Tabelle zeigt nur Namen (neu)

**Priorität:** P3

**Nachweis:** beobachtet und gemessen (360 × 640, nach Import der
übergebenen Sammlung).

**Fundstelle / Aufgabe:** Einsatzansicht auf dem Telefon.

**Beobachtung:** Kopfzahlen und Bedarf füllen das erste Bild gut. Die erste
Karte beginnt bei 1 919 px, die Seite ist 8 462 px lang. Eine Karte ist rund
450 px hoch; allein die acht Knöpfe (Details, Bogen als PDF, Abrücken, Zug
zuordnen, Auftrag/Notiz, Aufteilen…, Verschieben…, Entfernen) belegen etwa die
Hälfte davon. In der Tabelle sind nur Einheit, Org. und Zug sichtbar, die
Stärke schon nicht mehr.

**Erwartung der Rolle:** Auch auf dem Telefon, etwa beim Gang durch den
Bereitstellungsraum, eine Zeile je Einheit: Name, Stärke, Bedarf.

**Auswirkung im Einsatz:** Das Telefon taugt für Summen, nicht für die Frage
„wer fehlt noch, wer braucht was". Weil das Tablet das Hauptgerät ist,
niedrige Priorität.

**Empfehlung:** Eine kompakte Kartenform (eine bis zwei Zeilen je Einheit,
Aktionen erst nach Antippen) oder eine schmale Tabellenansicht mit Name,
Stärke und Bedarf.

**Verifikation:** Telefon 360 × 640, Lage mit zehn Einheiten: Mindestens fünf
Einheiten mit Stärke und Bedarf stehen in einem Bildschirm.

### R2-K8 [P3] Kleinere Stellen (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **Farbe der Lage hängt am eigenen Entwurf:** Nachdem ich über die
  Schnellerfassung eine Feuerwehr erfasst hatte, waren Kopfbalken, Knöpfe und
  die Gesamtzahl „112" der Übungslage feuerrot. Mit THW-Entwurf war alles blau.
  Rot kann in einer Führungsstelle als Warnsignal gelesen werden, es bedeutet
  hier aber nur die Organisation des zuletzt bearbeiteten eigenen Bogens.
- **Suche kennt den Auftrag nicht:** Die Suche nach „Deich" findet 0
  Einheiten, obwohl der Auftrag „Deichabschnitt Nord…" auf einer Karte steht.
- **Übungshinweis in der Einsatz-Sammlung:** „9 Übungsmeldungen zählt nicht in
  diese Lage (…)" (Numerus), und die Quittung „9 Bogen/Bögen aufgenommen."
  nennt keine Namen (vgl. R2-S4).
- **Schnellerfassung ohne Bedarf ohne Lücke:** FF Lauffen (9 Personen,
  Verpflegung 0) trägt „2 Lücken" (Ort/Auftrag, Rufnummer), die fehlende
  Verpflegungsangabe ist keine davon; zur Summenwirkung siehe R2-N5.

**Erwartung der Rolle:** Farben bedeuten in der Lage immer dasselbe, und die
Suche findet, was auf der Karte steht.

**Auswirkung im Einsatz:** Kurzes Stutzen, ein Umweg über die Karten.

**Empfehlung:** Die Einsatzansicht in neutraler Akzentfarbe zeigen, die
Suche auf Auftrag/Notiz erweitern, den Numerus korrigieren und die Namen in
die Quittung schreiben. Die fehlende Verpflegungsangabe als Lücke zeigen.

**Verifikation:** Jeden Punkt einzeln nachstellen, wie oben beschrieben.

## Bestätigt aus anderen Runde-2-Berichten

Unabhängig beobachtet, hier nicht mitgezählt:

- **R2-N4 (Marke „alt"):** Alle elf Karten und alle Tabellenzeilen tragen
  „alt", auch Meldungen mit Stand 30 Minuten vor dem Eintreffen. Aus
  Führungssicht wiegt vor allem, dass der einzige wirklich alte Bogen
  (Oldenburg, Stand 160900jul26, gut zehn Wochen alt) dadurch nicht mehr
  auffällt. Im Code verglichen, als technischer Hinweis: `standIstAlt`
  (`src/app/einheiten-tabelle.ts`) zieht den Stand in Minuten seit 2020 von
  einer Eintreffzeit in Millisekunden seit 1970 ab. Die Marke ist dadurch
  immer gesetzt, und der Unit-Test setzt den Stand selbst in Millisekunden.
- **R2-N5 (Verpflegung ohne Angabe):** „Verpflegung 103" bei „112 Gesamt"; die
  Differenz sind die 9 Personen der Schnellerfassung. Im Lageblatt steht
  „Bedarf gesamt (10 Einheiten, 112 Personen) · Verpflegung: 103 Portionen"
  ohne Erklärung.
- **R2-G2 (Seite wird breit):** Nicht nur auf dem Telefon, sondern auch auf
  Tablet (1 842 px) und Laptop (2 045 px), siehe R2-K5.
- **R2-W6 (Eintreffzeit springt):** Auf den Datei-Wegen springt sie nicht nur
  kurz, sie bleibt dauerhaft falsch, siehe R2-K1.
- **R2-S4 (wer kam zuletzt):** Nach dem Einlesen von zehn Bögen tragen alle
  „neu", die Quittung nennt keine Namen.

## Was gut funktioniert und erhalten bleiben sollte

- Die Kopfzahlen „10 Einheiten · 4 / 24 / 84 / 112", „Einheiten (11 gemeldet
  · 10 zählend)" und die Summenzeile „Summe (10 zählend · 1 abgerückt)"
  nennen dieselbe Zählweise, in App, Lageblatt und CSV.
- Die Übungs-Trennung: Neun Übungsbögen in einer Sammlung der Art „Einsatz"
  werden namentlich genannt, zählen nicht („0 zählend"), und die Karten
  tragen „ÜBUNG". In der Übungs-Sammlung zählen sie.
- Bedarfsmarken auf der Karte, nur wenn gesetzt; Lücken als „1 Lücke" zum
  Aufklappen mit Klartext wie „Sitzplätze: 3 in den erfassten Fahrzeugen für
  9 Personen — 6 brauchen eine andere Mitfahrgelegenheit".
- „eingetroffen 16:02 ändern · abgerückt 16:03 ändern" direkt auf der Karte,
  Abrücken mit Quittung und „Rückgängig", Abgerückte durchgestrichen.
- Folgemeldung: „seit 281442sep26: Stärke 11 → 9" auf der Karte, „Änderungen"
  mit den abgemeldeten Namen und „Diesel: 50 l → 200 l".
- Zwischensummen je Zug (einklappbar) mit Stärke, Verpflegung, Unterbringung
  und Fahrzeugen; Sortierung „Zug" gruppiert die Karten.
- „Nur neue Bögen seit dem letzten Export" mit „Zuletzt exportiert Mo., 16:11
  · seitdem keine neuen Bögen".
- Übergabe: „Einsatz weitergeben / sichern" erzeugt ein PDF mit eingebetteter
  Sammlung. Auf dem zweiten Gerät (Telefonprofil) standen nach „Einsatz
  importieren…" Summen, Züge, Aufträge, Abrückzeit, „Historie (2)" und Lücken
  wie auf dem Tablet.
- Die CSV „Übersicht" ist die vollständigste Weitermeldung: Status, „Zählt in
  Lage", Übung, Sofortbedarf, Signatur, Auftrag/Notiz, Eingetroffen und
  Abgerückt.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Lage erfassen, Stärke und Bedarf
  ablesen und übergeben gelingt. Zug und Auftrag über Folgemeldungen zu
  erhalten und die Excel-Weitermeldung gelingen nur mit Nacharbeit von Hand
  (R2-K1, R2-K2).
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Die Karte meldet nach einer Folgemeldung nur
  „Stärke 11 → 9". Dass die Einheit dabei ihren Zug und ihren Auftrag verloren
  hat, sagt sie nicht (R2-K1).
- **Größtes Einsatzrisiko:** Einheiten, die nachmelden, verschwinden still aus
  ihrem Zug und verlieren ihren Auftrag. Parallel meldet die Excel-Liste eine
  abgerückte Einheit als anwesend weiter (R2-K1, R2-K2).
- **Top-Priorität für die nächste Iteration:** Zug, Auftrag und Eintreffzeit
  müssen bei jeder Folgemeldung erhalten bleiben, auf jedem Eingangsweg
  (R2-K1).

## Abgleich mit Runde 1

Grundlage: [../fuehrungssicht.md](../fuehrungssicht.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| K1 Bedarf nur als Summe | teilweise | Karte: Marken „Ruhezeit", „Unterbringung angefordert", „Diesel 200 l", nur wenn gesetzt. Tabelle: Spalte „Bedarf". Filter „nur mit Sofortbedarf" vorhanden. Aber der Filter trennt nicht (10 von 11, R2-K4), die Spalte liegt außerhalb des Bilds (R2-K5), und das Lageblatt nennt Ruhezeit und Unterbringung weiter nur als Summe (R2-K3). |
| K2 Kein Zeitbezug | teilweise | „eingetroffen 16:02 ändern", „abgerückt 16:03 ändern" auf Karte, Tabelle, Lageblatt und CSV; „neu" für 30 Minuten. „alt" steht an jeder Meldung und verliert damit seine Warnwirkung (R2-N4). Folgemeldungen per Datei überschreiben die Eintreffzeit (R2-K1). Die Excel-Liste führt keine der Zeiten (R2-K2). |
| K3 Lücken unsichtbar | teilweise | „1 Lücke" / „2 Lücken" auf der Karte, aufklappbar mit Klartext, beobachtet an fünf Einheiten. Nicht in Tabelle, Lageblatt und Exporten (R2-K3, R2-K5). Fehlende Verpflegung zählt nicht als Lücke (R2-K8, R2-N5). Ein Feld „erfasst von" bei manueller Erfassung gibt es weiter nicht (R2-K6). |
| K4 Drei Einheitenzahlen | bestätigt behoben | „10 Einheiten", „11 gemeldet · 10 zählend", „Summe (10 zählend · 1 abgerückt)" in App, Lageblatt und CSV übereinstimmend. Nur die Excel-Liste weicht ab (R2-K2). |
| K5 Kein Auftrag | teilweise | „Auftrag/Notiz" je Einheit auf Karte, in Tabelle, Lageblatt, CSV und in der Übergabedatei, auf dem zweiten Gerät vorhanden. Geht bei Folgemeldung per Datei verloren (R2-K1), fehlt in der Excel-Liste (R2-K2), hat keinen Zeitstempel (R2-K6) und wird von der Suche nicht gefunden (R2-K8). |
| K6 Liste unter dem Falz | bestätigt behoben | Zwischensummen eingeklappt. Auf dem Tablet beginnt die erste Karte bei 1 100 px statt 1 750 px, ihr Name steht im ersten Bild. Der Qualifikationsfilter ist in „Funktionen" (38) und „Fahrerlaubnis" (8) gruppiert. Auf dem Telefon liegt die erste Karte bei 1 919 px (R2-K7). |

Einordnung der eigenen Befunde: Alle acht Befunde sind neu. R2-K1 trifft die
Behebung von K2 und K5 an der Stelle, an der die Lage sich ändert. R2-K3,
R2-K4 und R2-K5 enthalten die Reste von K1 und K3 auf Lageblatt, Filter und
Tabelle, R2-K6 den Rest von K3 („erfasst von").

Bilanz: Von sechs Runde-1-Befunden sind zwei bestätigt behoben (K4, K6) und
vier teilweise umgesetzt (K1, K2, K3, K5). Keiner ist weiterhin völlig offen.
Was Runde 1 vermisste, ist an Karte und Übergabedatei jetzt da. Die Lücken
liegen in der Fortschreibung bei Folgemeldungen (R2-K1) und in den
Ausgabeformaten Excel und Lageblatt (R2-K2, R2-K3).
