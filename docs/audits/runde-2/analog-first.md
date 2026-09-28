# Audit „Analog first", Runde 2 (Papier-Rückfallebene, Medienbrüche, Wiedereinstieg)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-analog-first-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px und
Tablet 820 × 1180 px, `isMobile`/`hasTouch`, Locale de-DE, Zeitzone
Europe/Berlin. Ohne Kamera. Zuerst habe ich ohne Blick in frühere Berichte
getestet. Den Runde-1-Bericht, die Tabelle „Stand der Behebung" und die
anderen Runde-2-Berichte habe ich erst danach gelesen.

Alle erzeugten PDFs habe ich heruntergeladen, als Text ausgelesen und als Bild
gerendert (PyMuPDF im Scratchpad). Der eigene Bogen kam als
`localStorage`-Seed (`eeb.entwurf.v1`) aus `examples/thw/001-…json`. Die
Einsatz-Sammlungen habe ich über die Oberfläche angelegt („Neue
Einsatz-Sammlung…", Art „Übung", weil die Beispielbögen `uebung: true`
tragen). Die Bögen kamen über „Bögen einlesen…" als JSON- und PDF-Dateien in
die Sammlung.

Den Weg „Papier zurück ins Gerät" habe ich so nachgestellt: Die Seiten der
Sammel-PDF habe ich mit 150 dpi zu PNG gerendert. Diese Bilder stehen für das
Handyfoto eines Ausdrucks und gingen über „Bögen einlesen…" hinein, einmal als
ganze Seite, einmal auf den einzelnen QR-Code zugeschnitten.

Szenarien:

1. **Papier-Rückfallebene:** Blanko-PDF von `vorlage.html`, ausgefüllter
   Einzelbogen („Bogen übergeben… → PDF erzeugen"), Lageblatt und Sammel-PDF
   eines Einsatzes mit vier Einheiten, eine davon abgerückt. Dazu das Lageblatt
   mit 30 Einheiten am Tablet.
2. **Rückweg vom Papier:** Nacherfassung über „Einheit manuell erfassen…" mit
   „Nur Stärke", Eintreffzeit per „ändern" auf 14:05 bzw. 09:40 korrigiert,
   Sortierung nach Eintreffzeit, dieselbe Einheit als PDF und von Hand mit
   abweichendem Namen erfasst.
3. **Geräteausfall:** Gerät 2 übernimmt einmal über die Datei („Einsatz
   importieren…" mit der Sammel-PDF) und einmal nur über das Papier
   (fotografierte QR-Codes der gedruckten Sammel-PDF in eine neue Sammlung).
4. **Funk und Abgleich:** Kennungen, Zeitformate und Stärkeschreibweise auf
   App, Lageblatt, Sammel-PDF und Einzel-PDF.

**Annahmen**, die sich nicht aus Vorschriften belegen lassen: Der Meldekopf
führt bei Ausfall des Geräts auf Papier oder Whiteboard weiter. Eintreff- und
Abrückzeiten sind für Einsatztagebuch und Abrechnung maßgeblich. Einheiten
korrigieren einen ausgedruckten Bogen gelegentlich mit dem Stift, statt ihn
neu zu drucken.

**Nicht prüfbar** waren der Live-Scan mit Kamera (ob er Teile über mehrere
Scans sammelt), der Handscanner, AirDrop/Quick Share, das echte Drucken, die
nativen Builds und ein echter Akku-Ausfall. Den Ausfall habe ich durch einen
frischen Browser-Kontext ohne Speicherstand nachgestellt.

## Urteil

Die Papierseite ist seit Runde 1 deutlich besser geworden. Der Blanko-Vordruck
hat das Layout der App, ist 2 Seiten lang und bietet Platz für 4 Fahrzeuge
und 36 Personen. Das Einzel-PDF ist der gewohnte Bogen mit „ÜBUNG"-Wasserzeichen,
Stand als Datum-Zeit-Gruppe und QR. Das Lageblatt gibt es als eigenen Knopf,
mit Eintreff- und Abrückzeit, eigenem Block „Abgerückt (1)" und „Erstellt
28.09.2026, 16:30". Eintreffzeiten lassen sich korrigieren, und die
Sortierung folgt der Korrektur. Übernimmt Gerät 2 per Datei, kommt die ganze
Lage mit, samt korrigierter Zeit 14:05 und Abrückstatus. Den doppelt
eingelesenen Bogen erkennt die App („1 bereits vorhanden"), einen
abweichenden Einheitstyp fängt sie mit „Ist das dieselbe Einheit?" ab.

Reibung entsteht beim Weg vom Papier zurück ins Gerät, wenn es nur noch
Papier gibt. Ist das Tablet leer und liegt nur die gedruckte Sammel-PDF vor,
bringen die QR-Codes nur die Bögen der Einheiten zurück. Die Zeiten und der
Abrückstatus des Meldekopfs stehen zwar auf Seite 1, fehlen aber im Code:
Eine abgerückte Einheit zählt danach wieder als anwesend, und alle Einheiten
sind „jetzt" eingetroffen. Das Foto einer Seite mit zwei QR-Codes ergibt
keinen Bogen. Teile aus getrennten Foto-Durchgängen setzt die App nicht
zusammen. Die Rückmeldung dazu steht am Telefon außerhalb des Bildes.

Aufgaben: Den eigenen Bogen auf Papier bringen und die Lage drucken geht ohne
fremde Hilfe. Nach einem Geräteausfall die Lage an einem zweiten Gerät
weiterzuführen, geht mit der Datei ohne Umweg. Nur mit Papier geht es mit
erheblichen Umwegen: Jede Zeit und jeder Status muss vom Übergabeblatt
abgetippt werden.

## Befunde

### R2-A1 [P1] Übernahme vom Papier: Die gedruckten QR-Codes bringen die Bögen zurück, aber nicht die Lage (neu)

**Priorität:** P1

**Nachweis:** beobachtet (gedruckte Sammel-PDF als Bild in eine neue Sammlung
eingelesen). Dass die Folge im Einsatz unbemerkt bleibt, ist ein plausibles
Risiko.

**Fundstelle / Aufgabe:** Gerät 1: Einsatz „Hochwasser Albtal" mit vier
Einheiten. Albstadt ist per „ändern" auf 14:05 korrigiert, Biberach
abgerückt. „Sammel-PDF (alle Bögen)" erzeugt 10 Seiten. Gerät 2 hat nur den
Ausdruck: „Neue Einsatz-Sammlung…" → „Bögen einlesen…" mit den Fotos der
QR-Seiten.

**Beobachtung:**
- Seite 1 („Übergabe-Übersicht") trägt alles: Albstadt „28.09.2026, 14:05",
  Block „Abgerückt (1)" mit Biberach „28.09.2026, 16:30 / 28.09.2026, 16:30",
  „Summe (3 zählend · 1 abgerückt) 1 / 7 / 18 / 26".
- Die Bogenseiten danach sind die Bögen der Einheiten. „Einsatzbeginn:" und
  „Einsatzende:" bleiben leer, ein Hinweis „abgerückt" fehlt, und statt
  „Stand:" steht in der Fußzeile nur „Einsatz-Sammlung: Hochwasser Albtal".
- Eingelesen auf Gerät 2: Albstadt steht als „eingetroffen 16:46 ·
  Empfangen" statt 14:05. Biberach (drei QR-Teile) steht als „eingetroffen
  16:48", „1 gemeldet · 1 zählend", also anwesend und mitgezählt.
- Auf den QR-Seiten steht nur „Alle 3 Teile nacheinander mit der Kamera
  scannen — die App setzt den Bogen zusammen". Dass Zeiten, Abrückstatus,
  Zug und Auftrag nicht im Code stecken, sagt weder das Blatt noch die App.
- Zum Vergleich der Dateiweg: „Einsatz importieren…" mit derselben PDF als
  Datei bringt 14:05, „abgerückt 16:30" und die Summen unverändert mit.

**Erwartung der Rolle:** Das Übergabeblatt ist der Stand, der bei Ausfall
gilt. Scanne ich es ein, habe ich diese Lage wieder, oder die App sagt mir
genau, was ich von Seite 1 von Hand nachtragen muss.

**Auswirkung im Einsatz:** Das Tablet am Meldekopf fällt aus, der Ausdruck
der letzten Stunde liegt vor, das Ersatzgerät scannt ihn ein. Danach zählen
abgerückte Einheiten wieder in Stärke, Verpflegung und Diesel, und alle
Eintreffzeiten sind die Uhrzeit des Scans. Wer das Übergabeblatt nicht Zeile
für Zeile abgleicht, meldet eine zu hohe Stärke weiter. Wer es abgleicht,
tippt jede Zeit und jeden Abrückvermerk nach. Das ist die Doppelerfassung, die
der digitale Weg ersparen sollte.

**Empfehlung:** Auf den QR-Seiten und in der Stapel-Quittung klar sagen, was
der Code enthält: „nur der Bogen der Einheit; Zeiten und Abrückvermerk des
Meldekopfs stehen auf Seite 1". Die Lage selbst sollte vom Papier
rücklesbar sein, etwa über einen eigenen Code für die Übersicht auf
Lageblatt oder Seite 1. Alternativ bietet die App nach einem Stapel aus
Papier einen Abgleichschritt an: „4 Einheiten aus Papier aufgenommen —
Eintreffzeit und Status je Einheit prüfen". Auf den Bogenseiten der
Sammel-PDF den Stand der Einheit und „eingetroffen / abgerückt" vermerken.

**Verifikation:** Sammel-PDF mit einer abgerückten Einheit und einer
korrigierten Eintreffzeit drucken und auf einem leeren Gerät nur vom Papier
einlesen. Danach müssen Summen, Zeiten und der Block „Abgerückt" mit Seite 1
übereinstimmen, oder die App muss jede Abweichung ausdrücklich zum Nachtragen
vorlegen.

### R2-A2 [P2] Foto vom Ausdruck: zwei Codes auf einer Seite ergeben keinen Bogen, Teile aus getrennten Durchgängen verfallen (neu; Umfeld R2-H4, R2-L2)

**Priorität:** P2

**Nachweis:** beobachtet mit gerenderten Seitenbildern. Ob der Live-Scan mit
Kamera Teile über mehrere Scans sammelt, war nicht prüfbar.

**Fundstelle / Aufgabe:** Einsatzansicht → „Bögen einlesen…" mit Fotos der
Sammel-PDF. Seite 8 trägt „Teil 1 / 2" und „Teil 2 / 2" von Crailsheim.

**Beobachtung:**
- Foto der ganzen Seite 8 ergibt „1 Bild gelesen — 0 Bögen aufgenommen.
  Unvollständiger mehrteiliger Bogen: 1 von 2 Teilen da (foto-s8.png) — es
  fehlt Teil 1". Die App liest also nur einen der beiden Codes im Bild.
- Die zwei Codes einzeln zugeschnitten, erst Teil 1, dann in einem zweiten
  „Bögen einlesen…" Teil 2: Beide Male erscheint „0 Bögen aufgenommen", beim
  zweiten „es fehlt Teil 1". Der vorher gelesene Teil ist verfallen. Beide
  Ausschnitte im selben Durchgang ergeben „2 Bilder gelesen — 1 Bogen
  aufgenommen", die drei Teile von Biberach ebenso.
- Einzelcode-Seiten (Albstadt) und das eigene Bogen-PDF als Datei klappen
  sofort. Ein Bild ohne Code meldet sauber „Kein QR-Code im Bild gefunden".
- Die Quittung „Stapel eingelesen" steht bei 360 × 640 bei y ≈ 1 536 px,
  während die Seite bei 298 px steht. Sie ist also nicht im Bild. Am Tablet
  (820 × 1180) beginnt die Überschrift bei y = 1 177 px, am unteren Rand. Die
  Summen oben ändern sich bei „0 Bögen" nicht, der Helfer sieht also gar
  nichts.
- Das Blatt selbst sagt: „Beim Scannen jeweils nur einen Code ins Kamerabild
  nehmen."

**Erwartung der Rolle:** Ich fotografiere die Blätter so, wie sie im Ordner
liegen, eine Seite je Foto. Was fehlt, sagt mir die App dort, wo ich
hinschaue, und was schon da ist, merkt sie sich bis zum nächsten Foto.

**Auswirkung im Einsatz:** Nach einer Papierphase gibt es bei allen größeren
Einheiten (zwei oder drei Codes je Bogen) beim ersten Versuch keinen Bogen,
und das ohne sichtbare Meldung. Der Helfer hält den Import für gelungen oder
tippt den Bogen ab. Beides führt zu Lücken oder Doppelerfassung.

**Empfehlung:** Alle Codes eines Bildes lesen. Teile eines Bogens über
Durchgänge hinweg sammeln, bis der Bogen vollständig ist oder verworfen
wird. Die Stapel-Quittung dort zeigen, wo gehandelt wurde, also im Bild oder
oben bei den Summen. Den Hinweis auf dem Blatt passend zum tatsächlichen
Verhalten formulieren.

**Verifikation:** Die gedruckte Sammel-PDF Seite für Seite fotografieren und
jede Seite einzeln einlesen. Alle Einheiten müssen ankommen. Nach jedem Foto
muss am Telefon ohne Scrollen zu sehen sein, was aufgenommen wurde und was
noch fehlt.

### R2-A3 [P2] Das Lageblatt ist ein Aushang, aber kein Blatt zum Weiterführen, und die App merkt sich nicht, wann es gedruckt wurde (neu; Umfeld R2-K3, R2-O6, R2-W5)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht → „Lageblatt (1 Seite)", „Sammel-PDF
(alle Bögen)", „Einsatz weitergeben / sichern".

**Beobachtung:**
- Das Lageblatt hat die Spalten Einheit, Eingetroffen, Abgerückt, Stand,
  Stärke F / U / M / G, Fzg, Auftrag / Notiz und Veränderung. Bei vier
  Einheiten bleibt die untere Hälfte der A4-Querseite leer, ohne vorgezogene
  Leerzeilen für handschriftliche Nachträge.
- Funkrufname und Erreichbarkeit der Führungskraft stehen nicht auf dem
  Blatt. Auf dem Einzelbogen stehen sie („FuRn: Heros Albstadt 21/10",
  „Mobil: 5556968346 (P)").
- Nach dem Lageblatt steht weiter „Noch kein Export aus diesem Einsatz — alle
  Bögen sind neu". Erst Sammel-PDF oder „Einsatz weitergeben / sichern"
  ergeben „Zuletzt exportiert Mo., 16:44 · seitdem 1 neuer Bogen". Die
  Startseite zeigt davon nichts („3 Einheit(en) anwesend · Stärke 1 / 6 / 20
  / 27").
- „Einsatz weitergeben / sichern" und „Sammel-PDF (alle Bögen)" erzeugen
  dieselbe Datei: gleicher Dateiname `eeb-einsatz-…pdf`, 10 Seiten, gleiche
  eingebettete Sammlung. Welcher Knopf „für Papier" und welcher „für das
  nächste Gerät" gedacht ist, zeigt nur der Hinweistext.

**Erwartung der Rolle:** Das Lageblatt hängt an der Wand. Fällt das Tablet
aus, schreibe ich auf demselben Blatt weiter: freie Zeilen, Funkrufname und
Telefon der Einheit, damit ich sie ohne Gerät erreiche. Die App sagt mir,
wann zuletzt ein Blatt gedruckt wurde und ob seitdem etwas dazukam.

**Auswirkung im Einsatz:** Nach einem Ausfall wird die Lage auf einem neuen
Zettel oder am Whiteboard weitergeführt statt auf dem Lageblatt. Später gibt
es drei Quellen (Blatt, Zettel, Gerät), die jemand zusammenführen muss.
Rückfragen an eine Einheit brauchen die Sammel-PDF oder Funk über den
Einheitsnamen. Ob der Aushang aktuell ist, weiß niemand, weil die App nur
Exporte zählt.

**Empfehlung:** Unter der Tabelle einige leere, linierte Zeilen für
Nachträge. Je Einheit Funkrufname (Führungsfahrzeug) und Rückrufnummer.
„Lageblatt gedruckt 16:30 · seitdem 1 neue Meldung" in der Einsatzansicht und
auf der Startseitenkarte. Die beiden gleichwertigen Knöpfe
zusammenlegen oder unterschiedlich machen. Seitenzahl und fehlende
Bedarfsspalte: siehe R2-K3.

**Verifikation:** Lageblatt drucken, danach eine Einheit einlesen. Die
Einsatzansicht muss „seit dem letzten Lageblatt: 1 neue Meldung" zeigen. Auf
dem Blatt müssen sich zwei Einheiten mit Uhrzeit von Hand nachtragen lassen,
und jede Einheit muss ohne Gerät per Funk oder Telefon erreichbar sein.

### R2-A4 [P2] Stiftkorrektur auf dem Ausdruck geht beim Scannen still verloren (neu)

**Priorität:** P2

**Nachweis:** Der Text auf PDF und Blatt ist beobachtet. Den Verlust der
Korrektur beim Scan leite ich daraus ab: Der Code trägt den gedruckten Stand,
die App kann Handschrift nicht sehen. Plausibles Risiko.

**Fundstelle / Aufgabe:** Einzel-PDF („Bogen übergeben… → PDF erzeugen") und
Bogenseiten der Sammel-PDF.

**Beobachtung:**
- Unter dem QR-Code steht: „Mit der Kamera scannen oder den Link antippen, um
  den Bogen digital zu übernehmen." Einen Hinweis wie „Änderungen von Hand sind
  nicht im Code" gibt es nicht.
- Das ausgefüllte PDF hat genau so viele Personalzeilen wie Personen (hier
  4), und bei „weitere Qualifikationen" steht eine Leerzeile. Für einen
  nachgerückten Helfer ist kein Platz.
- Die Stärke steht als „1 / 1 / 2 / 4" ohne Legende. Die Personaltabelle hat
  keine Spalte für die Zählrolle (Fü/UFü/Ma); in der App heißt die Spalte
  „ROLLE". Eine Stärke, die mit dem Stift geändert wurde, lässt sich auf dem
  Blatt deshalb nicht gegen die Namensliste prüfen.
- Gut: Die Fußzeile „Stand: 170805jul26" des Einzel-PDF erscheint nach dem
  Einlesen auf der Karte als „Stand 170805jul26". Ein Abgleich Papier ↔ Gerät
  über den Stand ist also möglich. Auf den Bogenseiten der Sammel-PDF fehlt
  diese Fußzeile (siehe R2-A1).

**Erwartung der Rolle:** Ein Ausdruck, auf dem ich mit Stift etwas ändere,
sagt mir, dass der Code dann nicht mehr stimmt. Dafür gibt es ein Feld
„handschriftlich geändert: ja / nein" und ein paar leere Zeilen.

**Auswirkung im Einsatz:** Annahme: Unterwegs fällt ein Helfer aus, und der
Gruppenführer korrigiert „1 / 1 / 2 / 4" auf dem Ausdruck zu „1 / 1 / 1 / 3".
Der Meldekopf scannt den Code und zählt 4. Papier und Gerät widersprechen sich,
ohne dass es jemand merkt. Bei Verpflegung und Unterbringung wirkt der Fehler
weiter.

**Empfehlung:** Neben dem Code ein kurzer Satz: „Enthält den Stand
<DTG>. Mit Stift geändert? Dann nicht scannen, sondern abtippen oder neu
erzeugen." Dazu ein Kästchen „handschriftlich ergänzt". Zwei bis drei
Leerzeilen im Personalteil. Eine Legende „F / UF / M / Ges" an der Stärke
auf Blanko und Einzel-PDF. Die Zählrolle in der Personaltabelle drucken.

**Verifikation:** Ausdruck mit Stift ändern und einem Meldekopf-Helfer geben.
Er muss ohne Nachfrage erkennen, dass der Code den alten Stand trägt, und
die Stärke auf dem Blatt gegen die Namensliste prüfen können.

### R2-A5 [P2] Nacherfassung vom Papier: abweichender Name wird doppelt gezählt, die Reihenfolge weicht vom Blatt ab (Wiederaufnahme von A5; Eintreffzeit als Rest von A2)

**Priorität:** P2

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht mit „THW Albstadt Zugtrupp
Technischer Zug" (aus Datei) → „Einheit manuell erfassen…".

**Beobachtung:**
- Einheitstyp „Zugtrupp TZ" (frei getippt) und Name „Albstadt": Die App fragt
  „Ist das dieselbe Einheit? … Die neue Meldung heißt ‚THW Albstadt Zugtrupp
  TZ'" und bietet „Ja — als neue Fassung" an. Gut.
- Name „OV Albstadt", Einheitstyp leer, direkt „In Einsatz übernehmen": Es
  kommt keine Rückfrage. Danach stehen „3 gemeldet · 3 zählend" statt 2.
  Genau diesen Fall beschreibt Runde 1 als Prüfschritt.
- Den Einheitstyp „ZTr TZ" aus der Vorschlagsliste gewählt: Die App belegt 4
  Sollplätze vor, die sofort in die Stärke zählen (Umfeld R2-E2, R2-W3).
- Eine Eintreffzeit fragt der Assistent nicht ab. Die Karte bekommt die
  Uhrzeit der Aufnahme, korrigierbar über „ändern" (Datum und Uhrzeit). Nach
  der Korrektur auf 09:40 sortiert „Eintreffzeit (neueste zuerst)" richtig.
- Die Reihenfolge des Assistenten (Einheit, Einsatz, Personal, Fahrzeuge,
  Sofortbedarf) weicht vom Blanko-Vordruck ab. Dort stehen die Fahrzeuge vor
  dem Personal.

**Erwartung der Rolle:** Beim Abtippen eines Papierbogens gehe ich das Blatt
von oben nach unten durch und trage die Uhrzeit vom Meldeblock gleich mit
ein. Steht dieselbe Einheit unter einem leicht anderen Namen schon da, fragt
die App nach.

**Auswirkung im Einsatz:** Nach einer Papierphase mit zehn nachgetragenen
Einheiten sind zehn zusätzliche Tipps auf „ändern" nötig, sonst stimmen die
Zeiten nicht. Handschriftliche Namen wie „OV Albstadt" erzeugen eine zweite
Einheit, die Stärke ist doppelt. Das fällt nur beim Durchsehen der Liste auf.

**Empfehlung:** Die Rückfrage auf Namen ausdehnen, die den Namen einer
vorhandenen Einheit enthalten (vor allem mit Präfixen wie „OV"), auch ohne
Einheitstyp. Im Nacherfassungsweg ein Feld „eingetroffen um" (vorbelegt
jetzt). Die Abschnitte in der Reihenfolge des Blatts führen, oder auf dem
Blatt und im Assistenten dieselbe Nummerierung verwenden.

**Verifikation:** Einheit aus Datei aufnehmen, dann denselben Bogen als
„OV Albstadt" ohne Typ nacherfassen: Die App muss nachfragen. Zehn
Papierbögen mit Uhrzeiten nachtragen: Das muss ohne getrennten Schritt „ändern"
gehen.

### R2-A6 [P3] Zeiten, Kennungen und Marken sind für Funk und Abgleich uneinheitlich (neu; Umfeld R2-W4, R2-N4)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** Einsatzansicht, Lageblatt, Sammel-PDF, Blanko-PDF.

**Beobachtung:**
- Auf demselben Lageblatt stehen „28.09.2026, 14:05" (Eingetroffen) und
  „170805jul26" (Stand) nebeneinander. Die Karte zeigt „eingetroffen 14:05"
  ohne Datum, der Exportstand „Zuletzt exportiert Mo., 16:44" nur mit
  Wochentag.
- Die Meldungen tragen keine laufende Nummer. Auf Funk oder am Telefon
  lässt sich eine Zeile des Lageblatts nur über den vollen Einheitsnamen
  bezeichnen („THW Biberach/Riß Fachgruppe Ortung (B)").
- „neu" heißt auf der Karte „vor weniger als 30 Minuten eingetroffen"
  (Tooltip). Ein paar Zeilen darüber heißt es „Nur neue Bögen seit dem letzten
  Export". Nach einem Export stehen beide Karten weiter mit „neu" da, während
  die Zeile darüber „seitdem keine neuen Bögen" sagt.
- Die Bogenseite einer Einheit in der Sammel-PDF zeigt „Einsatzbeginn:" leer,
  obwohl Seite 1 derselben Datei „eingetroffen 14:05" nennt.
- Blanko-Vordruck: Die Stärke ist nur „Stärke: ____ / ____ / ____ / ____",
  ohne F / UF / M / Ges.

**Erwartung der Rolle:** Eine Zeitform auf allen Blättern, am besten die
Datum-Zeit-Gruppe, die ich auch funke. Eine kurze Nummer je Meldung, die auf
Blatt und Gerät gleich ist. Ein Wort bedeutet an einer Stelle nur eine Sache.

**Auswirkung im Einsatz:** Beim Abgleich zwischen Blatt und Gerät und bei
Durchsagen kostet das Nachdenken und bringt Verwechslungen, vor allem bei
Einsätzen über Mitternacht. Die Schwere ist gering, weil die Angaben selbst
stimmen.

**Empfehlung:** Zeitpunkte auf Lageblatt und Karten einheitlich angeben
(z. B. DTG „281405sep26"). Eine laufende Nummer je Meldung auf Karte und
Lageblatt. Die Marke für „vor Kurzem eingetroffen" anders benennen als den
Exportstand. Die Legende der Stärke auf dem Vordruck. Einsatzzeiten zwischen
Bogen und Meldekopf: siehe R2-W4.

**Verifikation:** Eine Einheit per Funk vom Lageblatt aus bezeichnen lassen
(„Meldung 3, eingetroffen 281405"). Die Gegenstelle muss sie am Gerät ohne
Rückfrage finden.

## Analog-/Digital-Übergabematrix

| Prozessschritt | Digitaler Nutzen | Analoger Fallback | Sauberer Wiedereinstieg in Digital |
|---|---|---|---|
| Bogen der Einheit ausfüllen | Vorlage, StAN-Vorbelegung, OV mit RB/LV und Rufnummern, Summen rechnen sich selbst | Blanko-PDF (2 Seiten, 4 Fahrzeuge, 36 Personen, Layout wie die App); Offline-Verfügbarkeit siehe R2-O7 | Meldekopf tippt ab („Einheit manuell erfassen…", „Nur Stärke"). Die Eintreffzeit muss danach per „ändern" nachgetragen werden (R2-A5) |
| Bogen übergeben | QR, Link, Datei, PDF mit Code; Dubletten werden erkannt | Ausgedrucktes Einzel-PDF (mit Code) oder handschriftlicher Bogen | Ausdruck mit Code scannen. Mit Stift korrigiert: der Code weiß davon nichts (R2-A4). Mehrteilige Codes nur im selben Durchgang (R2-A2) |
| Lage führen (Stärke, Bedarf) | Laufende Summen, Abrücken mit Uhrzeit und „Rückgängig", Zeiten korrigierbar | Lageblatt als Aushang (Zeiten, Abgerückt-Block, Summen) | Nachträge vom Blatt einzeln tippen. Keine freien Zeilen auf dem Blatt, kein Vermerk „zuletzt gedruckt" (R2-A3) |
| Geräteausfall Meldekopf | „Einsatz weitergeben / sichern" als Datei auf ein zweites Gerät: alles kommt mit | Letzter Ausdruck von Lageblatt oder Sammel-PDF | Mit Datei: vollständig. Nur mit Papier: Bögen ja, Zeiten, Abrückstatus, Zug und Auftrag nein (R2-A1) |
| Schichtübergabe | Sammel-PDF mit eingebetteter Sammlung, „Einsatz importieren…" | Übergabe-Übersicht (Seite 1) | Import der Datei. Zwei Geräte laufen danach parallel weiter (R2-W5) |

Nicht gelistet: Vorlagenpflege, Themen, Absenderkarte, Excel/CSV. Für sie ist
keine Rückfallebene nötig.

### Übergabewege: Gerät, Netz, Papier-Ersatz

| Weg | Braucht Gerät beim Sender | Braucht Gerät beim Empfänger | Braucht Netz | Papier-Ersatz | Was auf dem Papierweg verloren geht |
|---|---|---|---|---|---|
| QR vom Display (Einheit → Meldekopf) | ja, geladen | ja, Kamera | nein | Einzel-PDF mit Code, gedruckt | nichts, solange nicht von Hand korrigiert (R2-A4) |
| Link teilen | ja | ja | nein, wenn die App dort schon einmal geladen war (R2-O5) | Einzel-PDF | wie oben |
| Datei / PDF (AirDrop, Quick Share, USB) | ja | ja | nein | Einzel-PDF | wie oben |
| Handschriftlicher Bogen | nein | ja, zum Abtippen | nein | Blanko-PDF | Eintreffzeit muss nachgetragen werden, Namensvarianten doppeln (R2-A5) |
| Lage an zweites Gerät („Einsatz weitergeben / sichern") | ja, das alte Gerät muss noch laufen | ja | nein | Sammel-PDF oder Lageblatt, gedruckt | Zeiten, Abrückstatus, Zug, Auftrag, Historie (R2-A1) |
| Lage an Führungsstelle | ja | beliebig | nein | Lageblatt | nichts für den Aushang. Rückruf-Angaben fehlen (R2-A3) |

Kein geprüfter Weg braucht einen Server oder Mobilfunk. Die Abhängigkeit
liegt beim geladenen Gerät und, für den Rückweg, bei der Kamera.

## Würde ich dafür das Papier weglegen?

Für den eigenen Bogen der Einheit: ja. Das PDF ist der Papierbogen, der Code
kostet nichts, und der Blanko-Vordruck hat dasselbe Layout. Für die
Kräfteübersicht am Meldekopf: nur, wenn nach jeder Übergabe die Datei auf
einem zweiten Gerät liegt. Das Papier allein bringt die Lage nach einem Ausfall
nicht ins Gerät zurück (R2-A1). Solange das so ist, bleibt das Lageblatt mit
Stift die maßgebliche Rückfallebene. Es braucht dafür freie Zeilen und
Rückrufnummern (R2-A3).

## Was gut funktioniert und erhalten bleiben sollte

- Blanko-PDF von `vorlage.html` in einem Tipp heruntergeladen, 2 Seiten A4,
  Aufbau wie das App-PDF, dazu der ehrliche Satz „trägt keinen QR-Code: er hat
  noch keinen Inhalt".
- Einzel-PDF: Papier-Layout, „ÜBUNG"-Kopfzeile und -Wasserzeichen,
  Funkrufnamen „FuRn: Heros Albstadt 21/10", Kennzeichen, StAN-Kästchen,
  Sofortbedarf, Fußzeile „Stand: 170805jul26", eingebettete
  `erfassungsbogen.json`. In unter einer Sekunde erzeugt.
- Lageblatt mit Eintreff- und Abrückzeit, Block „Abgerückt (1)", Summenzeile
  „Summe (3 zählend · 1 abgerückt)", „Erstellt 28.09.2026, 16:30".
- Eintreffzeit korrigierbar (Datum und Uhrzeit), die Sortierung folgt, und
  die Korrektur übersteht die Übergabe per Datei.
- Derselbe Bogen als PDF noch einmal eingelesen: „0 Bogen/Bögen aufgenommen,
  1 bereits vorhanden". Abweichender Einheitstyp: Rückfrage „Ist das dieselbe
  Einheit?" mit „neue Fassung / eigene Einheit / Abbrechen".
- Übernahme durch ein zweites Gerät per Sammel-PDF-Datei: „Einsatz
  ‚Hochwasser Albtal' importiert (4 Meldung(en))", Zeiten und Abrückstatus
  unverändert.
- „Zuletzt exportiert Mo., 16:44 · seitdem 1 neuer Bogen" zeigt, was seit dem
  letzten Export dazukam.
- „Nur Stärke" am Meldekopf mit Rückfrage und aus den Karten vorbelegter
  Stärke. Die Personenkarten sind als „nicht gezählt" gekennzeichnet.

## Abschluss

- **Aufgabe geschafft:** Papier erzeugen (Blanko, Einzel-PDF, Lageblatt,
  Sammel-PDF): ja. Nacherfassung vom Papier: mit Umwegen (Zeit nachträglich
  per „ändern", Namensvarianten doppeln). Übernahme nach Geräteausfall: mit
  der Datei ja, nur mit Papier mit erheblichen Umwegen.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** Der QR-Code auf dem Übergabeblatt sieht aus
  wie „die Lage zum Einscannen", trägt aber nur den Bogen der Einheit. Zeiten
  und Abrückvermerk stehen nur als Text auf Seite 1 (R2-A1).
- **Größtes Einsatzrisiko:** Nach einem Ausfall scannt das Ersatzgerät den
  letzten Ausdruck ein. Danach zählen abgerückte Einheiten wieder mit, und die
  gemeldete Stärke ist zu hoch, ohne dass die App es zeigt (R2-A1).
- **Top-Priorität für die nächste Iteration:** Den Rückweg Papier → Gerät für
  die Lage schließen: Übersicht rücklesbar machen oder nach dem Einlesen vom
  Papier Zeiten und Status je Einheit ausdrücklich abgleichen lassen (R2-A1).

## Abgleich mit Runde 1

Grundlage: [../analog-first.md](../analog-first.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| A1 Übergabeblatt ohne Abgerückte | bestätigt behoben | Seite 1 der Sammel-PDF und das Lageblatt zeigen den Block „Abgerückt (1)" mit Eintreff- und Abrückzeit, die Summenzeile nennt „3 zählend · 1 abgerückt". Alle vier Bögen hängen an, auch der abgerückte. Papier und Dateiimport nennen dieselben Einheiten. Der Rückweg *vom* Papier ist ein neuer Befund (R2-A1). |
| A2 Nacherfassung stempelt „jetzt" | teilweise | Die Eintreffzeit ist je Meldung über „ändern" mit Datum und Uhrzeit korrigierbar (14:05 und 09:40 geprüft), die Sortierung folgt, und die Datei-Übergabe behält sie. Im Nacherfassungsweg selbst gibt es kein Zeitfeld (R2-A5). Beim Einlesen vom Papier wird weiter „jetzt" gestempelt (R2-A1). |
| A3 Kein Anstoß zum Ausdruck | teilweise | Den Knopf „Lageblatt (1 Seite)" gibt es, das Blatt entsteht mit einem Tipp. Einen Vermerk „zuletzt gedruckt" gibt es nicht: Das Lageblatt zählt nicht als Export, und die Startseite zeigt keinen Stand (R2-A3; Sicherung allgemein R2-O6). |
| A4 Sammel-PDF wächst | bestätigt behoben | Das Lageblatt ist bei vier Einheiten eine Seite, die Bögen stehen nur in der Sammel-PDF. Bei 30 Einheiten werden es zwei Seiten, obwohl der Knopf „1 Seite" sagt: siehe R2-K3, hier nicht mitgezählt. |
| A5 Kennung nur über den Namen | teilweise | Die Rückfrage greift bei abweichendem Einheitstyp („Zugtrupp TZ"). Den Runde-1-Prüffall („OV Albstadt", Einheitstyp leer) erkennt sie nicht: Die Einheit wird doppelt gezählt (R2-A5). Eine laufende Nummer je Meldung gibt es weiter nicht (R2-A6). |

Einordnung der eigenen Befunde: R2-A1, R2-A2, R2-A3, R2-A4 und R2-A6 sind neu.
R2-A5 nimmt A5 wieder auf und enthält den Rest von A2. Überschneidungen mit
anderen Runde-2-Berichten sind nur verwiesen und nicht mitgezählt: R2-K3
(Lageblatt-Seitenzahl, Bedarf je Einheit), R2-O6 (Erinnerung an Sicherung),
R2-O7 (Blanko-Vordruck offline), R2-O5 (Link braucht einmal Netz), R2-W4
(Einsatzzeiten zwischen Bogen und Meldekopf), R2-W5 (zwei Geräte nach der
Übergabe), R2-E2 und R2-W3 (Sollplätze zählen in die Stärke), R2-H4 und R2-L2
(Rückmeldung außerhalb des Bildes, gleiches Muster wie in R2-A2).

Bilanz: Von fünf Runde-1-Befunden sind zwei bestätigt behoben (A1, A4) und
drei teilweise umgesetzt (A2, A3, A5). Die zwei P1 aus Runde 1 sind auf der
Papierseite erledigt: Das Übergabeblatt ist vollständig, und Zeiten lassen
sich korrigieren. Die neue Lücke liegt im Rückweg vom Papier ins Gerät nach
einem Ausfall (R2-A1, R2-A2).
