# Audit „Zerstörende Handlungen", Runde 2 (Löschen, Überschreiben, Statuswechsel)

Stand: 28.09.2026 · Prüfer: Rollenaudit `thw-destructive-action-reviewer` ·
Prüfgegenstand: Web-App, Produktionsbuild (`vite preview`, Port 4173), Zweig
`claude/adoring-sagan-9vnriv`, Commit 354209b.

Reiner Prüfbericht, keine Codeänderung. Wiederholung nach der Behebung der
Runde-1-Befunde vom 27.09.2026. Die Commits nach 354209b auf dem Zweig
ändern nur Prüfberichte, `src/` und `vendor/` sind unverändert.

## Prüfaufbau

Chromium (Playwright, `/opt/pw-browsers/chromium`), Viewport 360 × 640 px,
`isMobile`/`hasTouch`, Locale de-DE, keine Kamera. Jeder Skriptlauf begann
mit geleertem Speicher und einem `localStorage`-Seed aus `examples/thw/`
(`uebung: false`, `stand` und Einsatzzeitraum auf „jetzt" gesetzt, damit
keine Datenschutzfrist eingreift):

- `eeb.entwurf.v1`: eigener Bogen „THW Kirchehrenbach Bergungsgruppe"
  (9 Personen, 2 Fahrzeuge).
- `eeb.vorlagen.v1`: zwei Vorlagen, „OV Kirchehrenbach B" und „FGr W
  Bamberg" (11 benannte Personen, 4 Fahrzeuge).
- `eeb.einsaetze.v1`: Sammlung „Hochwasser Ulm" mit vier Einheiten. „THW Ulm
  Bergungsgruppe" hat zwei Fassungen (Stärke 8, dann eine Folgemeldung mit
  Stärke 7), „Crailsheim" hat das Zug-Etikett „1. Zug". Dazu die Sammlung
  „Übung Kiesgrube" mit einer Einheit.

Für Import und Sicherung habe ich die Dateien benutzt, die die App selbst
erzeugt hat („Einsatz weitergeben / sichern", „Vorher Sicherung
erstellen…"). Für die automatische Löschung habe ich Sammlungen mit
`geaendert` vor 70 und vor 91 Tagen eingespielt.

Getestet habe ich zuerst ohne Blick in frühere Berichte. Den Runde-1-Bericht,
die Tabelle „Stand der Behebung" und die vorliegenden Runde-2-Berichte habe
ich erst danach gelesen.

Rolle: Helfer, der eine Aufgabe zügig erledigt und dabei eine folgenschwere
Aktion auslösen kann. Jede Handlung habe ich real ausgelöst und dabei
festgehalten, wie die Bestätigung aussieht, ob die Folge benannt ist, welcher
Rückweg angeboten wird und ob er wirklich zurückführt. Den Speicher habe ich
jeweils nachgeprüft. Szenarien:

1. **Eigener Bogen:** „Verwerfen" auf der Startseite, „Neuer Bogen" in der
   Übersicht, Vorlage „Einsatz vorbereiten" → „Einsatz starten",
   Beispielbogen öffnen, „Zuletzt verdrängten Bogen zurückholen". Person
   entfernen in Karte und Tabelle, „Nur Stärke", Erreichbarkeit ✕, Ebene ✕,
   „StAN-Sollplätze laden". „In Einsatz aufnehmen…".
2. **Vorlagen:** Löschen mit Rückgängig, Papierkorb, „Bearbeiten" →
   Änderung → „Vorlage aktualisieren". „Einsatz vorbereiten" → Haken
   abwählen → „‹ Abbrechen".
3. **Meldekopf:** „Abrücken" einfach und als Doppeltipp, „Rückgängig",
   „Als anwesend". „Entfernen" an einer Einheit mit einer und mit zwei
   Fassungen, „Rückgängig". „Aufteilen…" und zurück mit „Zusammenführen…",
   „Verschieben…", „Einsatz löschen…" aus der Ansicht und von der
   Startseite, Papierkorb „Wiederherstellen" und „Endgültig löschen…".
4. **Übernahme von außen:** „Einsatz importieren…" mit einer älteren Datei
   derselben Sammlung, nachdem vor Ort eine Meldung entfernt und eine
   Einheit abgerückt war.
5. **Gerät:** „Datensicherung → Sicherung einspielen…" über eine laufende
   Sammlung, „Alle Daten löschen", „Geräteschlüssel neu erzeugen" (nur bis
   zur Rückfrage), Absenderangaben entfernen, automatische Löschung ruhender
   Sammlungen.

Nicht prüfbar: Kamera-Scan und Kiosk-Stapel mit echten Codes,
Nahbereichs-Weitergabe, Geräte-Zurück und Wischgesten der nativen Builds,
echte Handschuhe. Das Funktions-Chip-× (Runde 1 D3) habe ich nicht erneut
ausgelöst. Die 90-Tage-Löschung ließ sich nur über zurückdatierte
Sammlungen prüfen, nicht mit echter Wartezeit.

## Urteil

Die großen Hebel sind weiter gut gesichert. „Einsatz löschen" nennt Namen und
Zahl der Einheiten, führt in einen 30-Tage-Papierkorb und fragt dort vor
„Endgültig löschen…" noch einmal. „Alle Daten löschen" zählt auf, was
verschwindet, verlangt ein Kästchen und bietet vorher die Sicherung an.
Personen, Fahrzeuge, Erreichbarkeiten und Ebenen fragen mit Namen oder
Nummer nach, auch in der Tabelle. „Abrücken" quittiert mit Uhrzeit und
„Rückgängig", der Gegenknopf steht nicht mehr an derselben Stelle. Vorlagen
gehen mit Quittung in den Papierkorb, der verworfene eigene Bogen in die
Rückholung. Die sieben Runde-1-Befunde sind damit weitgehend abgestellt.

Reibung entsteht jetzt dort, wo eine Bestätigung *etwas anderes verspricht,
als passiert*, und bei Handlungen, die ganze Bestände ersetzen. „Meldung
entfernen?" verspricht „samt Historie", nimmt aber nur die neueste Fassung
weg. Die ältere steht danach wieder als gültige Meldung in der Lage, und die
Summe steigt. „Sicherung einspielen" ersetzt alle laufenden Sammlungen, ohne
zu zählen, was verloren geht. Anders als „Alle Daten löschen" bietet es auch
keine Sicherung vorher an. „Vorlage aktualisieren" überschreibt die
gespeicherte Vorlage ohne Rückfrage und ohne Vorfassung. „Einsatz
importieren…" holt eine vor Ort entfernte Meldung ungefragt zurück. Eine
ruhende Sammlung verschwindet nach 90 Tagen, ohne dass danach ein Hinweis
erscheint.

Die Aufgaben lassen sich ohne fremde Hilfe erledigen. Wer eine Einheit mit
Folgemeldung entfernt oder eine Sicherung über einen laufenden Einsatz
spielt, bekommt aber einen falschen Stand, ohne es zu merken.

## Übersicht: Handlung → Bestätigung → Rückweg

„Bestätigung" beschreibt, was vor der Wirkung kommt. „Rückweg" beschreibt,
was danach tatsächlich zurückführt. Alles in der Tabelle ist beobachtet.

| Handlung | Bestätigung | Rückweg (geprüft) |
| --- | --- | --- |
| Startseite „Verwerfen" | Rückfrage mit Name, Knopf rot, nennt Rückholung „bis ein anderer Bogen diesen Platz braucht" | „Zuletzt verdrängten Bogen zurückholen" ✓, aber nur ein Platz (siehe Verweis R2-N1/R2-E1) |
| Übersicht „Neuer Bogen" | Rückfrage „… der gespeicherte Entwurf gelöscht", rot | Liegt trotzdem in der Rückholung ✓ (Text falsch, R2-W6) |
| Beispielbogen öffnen / „Einsatz starten" aus Vorlage / Vorlage „Bearbeiten" bei offenem Bogen | Rückfrage mit Name, „bleibt … erreichbar" | Rückholung ✓, verdrängt aber den vorigen Inhalt des Rückholplatzes ohne Hinweis |
| Person entfernen (Karte und Tabelle) | Rückfrage mit Namen, zählt Verlust auf, rot | keiner (Bestätigung genügt) |
| Erreichbarkeit ✕ / Ebene ✕ | Rückfrage mit Nummer bzw. Telefon und E-Mail, rot | keiner |
| „Nur Stärke" | Rückfrage mit Zahl der Personen und Startwert 0/2/7/9 | Zurückschalten ✓ |
| „StAN-Sollplätze laden" bei benannten Personen | Rückfrage „wird … ersetzt", Knopf **primär, nicht rot** | keiner, Namen weg (R2-N2) |
| „In Einsatz aufnehmen…" | Zieldialog, sagt „bleibt hier geöffnet" | eigener Bogen bleibt offen ✓ |
| Vorlage „Löschen" | keine, bewusst | Quittung „30 Tage rückholbar. Rückgängig" im Bild ✓, Papierkorb ✓ |
| „Vorlage aktualisieren" | **keine** | **keiner**, alte Fassung weg (R2-D2) |
| Musterung „‹ Abbrechen" | keine | abgewählte Haken verloren (R2-D6) |
| „Abrücken" | keine, bewusst | Quittung mit Uhrzeit und „Rückgängig" ✓, aber außerhalb des Bilds (R2-H4); „Als anwesend" an der Karte ✓ |
| Doppeltipp „Abrücken" | – | zweiter Tipp trifft „Zug zuordnen" (öffnet nur ein Feld) ✓ |
| „Entfernen" (eine Fassung) | Rückfrage mit Name und Stand, rot | „Rückgängig" ✓, außerhalb des Bilds, gilt nur für die zuletzt entfernte |
| „Entfernen" (zwei Fassungen) | Rückfrage verspricht „samt Historie" | **ältere Fassung zählt wieder** (R2-D1) |
| „Aufteilen…" | Vorschau „Rest … — Fachberater …", keine Rückfrage | keine Quittung; „Zusammenführen…" mit Vorschau stellt 0/3/9/12 wieder her ✓ |
| „Verschieben…" | Zielauswahl mit Art, Ort, Datum | Quittung „liegt jetzt in …"; zurück nur über die andere Sammlung |
| „Einsatz löschen…" (Ansicht) | Rückfrage mit Name und Einheitenzahl, rot | Meldung „in den Papierkorb verschoben" (ohne Rückgängig), Papierkorb ✓ |
| „Löschen…" (Startseite) | wie oben | keine Quittung; „Papierkorb (1)" ✓ |
| Papierkorb „Endgültig löschen…" | zweite Rückfrage „rückgängig geht das nicht", 125 px unter „Wiederherstellen" | keiner, bewusst |
| „Einsatz importieren…" in bestehende Sammlung | keine | ergänzt still, **auch vor Ort entfernte Meldungen** (R2-D4) |
| „Sicherung einspielen…" | Rückfrage „werden … ersetzt", rot | **keiner**, keine Zahlen, keine Sicherung vorher (R2-D3) |
| „Alle Daten löschen" | Dialog mit Aufzählung, Kästchen, „Vorher Sicherung erstellen…" | Sicherungsdatei ✓ |
| „Geräteschlüssel neu erzeugen" | Rückfrage mit Folgen, rot | keiner, bewusst |
| Absenderangaben entfernen | Rückfrage, rot | neu eintippen |
| Ruhende Sammlung (90 Tage) | Warnung auf der Karte ab Tag 60 | keiner; danach kein Hinweis (R2-D5) |

## Befunde

### R2-D1 [P1] „Meldung entfernen" nimmt nur die neueste Fassung weg, die ältere zählt wieder (neu)

**Priorität:** P1

**Nachweis:** beobachtet, zweimal nachgestellt, Speicher geprüft.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Ulm", Karte „THW Ulm
Bergungsgruppe" mit „Historie (2)" (erste Meldung Stärke 0/2/6/8,
Folgemeldung 0/2/5/7), Knopf „Entfernen".

**Beobachtung:** Die Rückfrage lautet: „‚THW Ulm Bergungsgruppe' (Stand
281221sep26) wird aus diesem Einsatz entfernt — samt Historie." Nach
„Meldung entfernen" meldet die Statuszeile „Meldung ‚THW Ulm
Bergungsgruppe' entfernt. Rückgängig". Die Einheit bleibt trotzdem in der
Liste, jetzt mit der *älteren* Fassung („Stärke 0 / 2 / 6 / 8", „eingetroffen
10:22", ohne „Historie"). Die Kopfzeile steht weiter bei „4 EINHEITEN", die
Gesamtstärke *steigt* von 34 auf 35, Verpflegung und Unterbringung steigen
mit. Im Speicher fehlt nur der Eintrag der Folgemeldung. Erst ein zweites
„Entfernen" mit derselben Rückfrage nimmt die Einheit aus der Lage (3
Einheiten, 27). Das „Rückgängig" bezieht sich dann nur noch auf die zuletzt
entfernte Fassung.

**Erwartung der Rolle:** „Entfernen … samt Historie" heißt: Die Einheit ist
aus diesem Einsatz raus, die Summen fallen. Wenn nur die letzte Meldung
zurückgenommen werden soll, erwarte ich einen anders benannten Knopf
(„Letzte Fassung verwerfen") mit eigener Rückfrage.

**Auswirkung im Einsatz:** Der Meldekopf entfernt eine doppelt oder falsch
aufgenommene Einheit, sieht die Quittung „entfernt" und geht weiter. In der
Lage steht die Einheit weiter, mit veralteter Stärke, und die Summe ist
höher als vorher. Verpflegung und Unterbringung werden für Kräfte bestellt,
die nicht (mehr) da sind. Bei 30 gleich aussehenden Karten fällt die
wieder aufgetauchte Karte kaum auf. Betroffen ist jede Einheit mit
Folgemeldung, also gerade die, die schon länger im Einsatz sind.

**Empfehlung:** „Entfernen" nimmt die Einheit mit allen Fassungen aus der
Sammlung, wie die Rückfrage es sagt. „Rückgängig" bringt alle Fassungen
zurück. Wer nur eine falsche Folgemeldung loswerden will, bekommt dafür
einen eigenen Weg in der Historie („Diese Fassung verwerfen — gültig ist
dann wieder Stand …") mit Nennung der Stärke vorher und nachher.

**Verifikation:** Einheit mit zwei Fassungen einmal entfernen: Die
Einheitenzahl muss um eins fallen, die Einheit darf nicht mehr in der Liste
stehen, und „Rückgängig" muss beide Fassungen samt „Historie (2)"
zurückbringen.

### R2-D2 [P2] „Vorlage aktualisieren" überschreibt die gespeicherte Vorlage ohne Rückfrage und ohne Vorfassung (neu; Umfeld R2-N2)

**Priorität:** P2

**Nachweis:** beobachtet, Speicher geprüft.

**Fundstelle / Aufgabe:** Startseite → Vorlage „FGr W Bamberg" (11 benannte
Personen mit Funktionen und Fahrerlaubnissen) → „Bearbeiten" → Schritt 3 →
„StAN-Sollplätze laden (12 Personen)" → Übersicht → „Vorlage aktualisieren"
(erster, primär gefärbter Knopf der Gesamtübersicht).

**Beobachtung:** Die Rückfrage vor dem Laden lautet nur „Die aktuelle
Personalliste (10 Personen) wird durch die 12 Sollplätze der StAN ersetzt.",
mit primärem, nicht rotem „Ersetzen". Danach heißen die Karten „Person 1 …
Person 12", alle Namen sind weg. „Vorlage aktualisieren" schreibt das ohne
Rückfrage in die Vorlage. Die Startseite quittiert „Vorlage ‚FGr W Bamberg'
aktualisiert.", ein „Rückgängig" gibt es nicht. Im Speicher stehen danach 12
namenlose Sollplätze statt 11 Namen. Eine frühere Fassung der Vorlage gibt
es nicht, und der Papierkorb hilft nicht, weil nichts gelöscht, sondern
überschrieben wurde. Wer die Bearbeitung ohne „Vorlage aktualisieren"
verlässt, lässt die Vorlage unverändert. Das funktioniert.

**Erwartung der Rolle:** Die Vorlage ist die Stammliste des OV, gepflegt,
damit es im Einsatz schnell geht. Bevor sie überschrieben wird, will ich
sehen, was sich ändert („11 Namen → 0 Namen, 12 statt 11 Personen"), und
einen Weg zurück haben, wie beim Löschen.

**Auswirkung im Einsatz:** Ein Fehlgriff beim Pflegen der Vorlage (siehe
R2-N2) wird mit einem Tipp dauerhaft. Beim nächsten Alarm liefert „Einsatz
vorbereiten" eine Liste ohne Namen. Die Ankreuzliste der Anwesenden wird
wertlos, und die Namen müssen unter Zeitdruck neu getippt werden.

**Empfehlung:** Vor dem Überschreiben kurz zusammenfassen, was sich an der
Vorlage ändert (Personen, Namen, Fahrzeuge), und danach eine Quittung mit
„Rückgängig" zeigen, die die vorige Fassung zurückholt. Bei „StAN-Sollplätze
laden" mit benannten Personen die Zahl der verlorenen Namen nennen und den
Knopf als zerstörend kennzeichnen (Empfehlung wie R2-N2).

**Verifikation:** Vorlage bearbeiten, Namen entfernen, „Vorlage
aktualisieren": Vorher muss die Änderung genannt werden, danach muss ein
Tipp die alte Vorlage mit allen Namen zurückbringen.

### R2-D3 [P2] „Sicherung einspielen" ersetzt laufende Sammlungen, ohne Umfang und ohne Sicherung vorher (neu)

**Priorität:** P2

**Nachweis:** beobachtet, Speicher geprüft.

**Fundstelle / Aufgabe:** Fußzeile „Datensicherung" → „Sicherung
einspielen…" → Datei wählen. Auf dem Gerät lief die Sammlung „Heute Nacht
Starkregen" mit einer Einheit. Die Sicherungsdatei stammte von einem
anderen Stand (zwei andere Sammlungen).

**Beobachtung:** Der Dialog „Datensicherung" sagt klein unter den Knöpfen
„Einspielen ersetzt die vorhandenen App-Daten auf diesem Gerät vollständig."
Nach der Dateiwahl kommt die Rückfrage „Alle App-Daten auf diesem Gerät —
Vorlagen, Einsätze, Entwurf, Einstellungen und der Geräteschlüssel — werden
durch den Inhalt der Datei ersetzt." mit rotem „Einspielen und ersetzen".
Sie nennt nicht, *was* auf dem Gerät liegt (Zahl der Sammlungen und
Meldungen, offener Bogen) und nicht, was die Datei enthält. Einen Weg
„Vorher Sicherung erstellen…" gibt es hier nicht. Nach „Neu laden" war
„Heute Nacht Starkregen" weg: kein Papierkorb, kein Schlüssel im Speicher.
„Alle Daten löschen" daneben zählt dagegen alles auf, verlangt ein Kästchen
und bietet die Sicherung vorher an. Beide Wege haben dieselbe Folge für den
Bestand, sind aber sehr unterschiedlich abgesichert.

**Erwartung der Rolle:** „Einspielen" klingt nach „dazuholen". „Einsatz
importieren…" auf der Startseite ergänzt tatsächlich nur. Wenn das
Einspielen alles ersetzt, will ich vorher sehen, welche laufenden Einsätze
dabei verschwinden, und die Möglichkeit haben, sie zu sichern.

**Auswirkung im Einsatz:** Plausibler Fall: Das Meldekopf-Tablet wird
getauscht oder aufgesetzt, und jemand spielt „schnell die Sicherung vom
alten Gerät" ein, während auf dem neuen schon Einheiten gesammelt wurden.
Diese Meldungen sind dann endgültig weg, und die Lage springt ohne Hinweis
auf einen älteren Stand. Der Weg braucht drei bewusste Schritte, deshalb
nicht höher als P2.

**Empfehlung:** Die Rückfrage wie bei „Alle Daten löschen" aufbauen:
vorhandene Sammlungen mit Namen und Meldungszahl nennen, dazu den Inhalt der
Datei, „Vorher Sicherung erstellen…" anbieten und ein Kästchen verlangen,
sobald laufende Sammlungen betroffen sind. Den Unterschied zu „Einsatz
importieren…" (ergänzt nur) in einem Satz nennen.

**Verifikation:** Mit einer laufenden Sammlung eine fremde Sicherung
wählen: Die Rückfrage muss diese Sammlung beim Namen nennen und vor dem
Ersetzen eine Sicherung anbieten.

### R2-D4 [P2] „Einsatz importieren…" holt vor Ort entfernte Meldungen ungefragt zurück (neu; Umfeld R2-W5)

**Priorität:** P2

**Nachweis:** beobachtet, Speicher geprüft.

**Fundstelle / Aufgabe:** Einsatzansicht „Hochwasser Ulm" → „Einsatz
weitergeben / sichern" (PDF) → danach vor Ort „THW Albstadt Zugtrupp" per
„Entfernen" herausgenommen und „Crailsheim" abgerückt (Stand: 2 Einheiten,
18) → Startseite „Einsatz importieren…" mit der zuvor erzeugten Datei, wie
nach einer Schichtübergabe in Gegenrichtung.

**Beobachtung:** Keine Rückfrage. Die Meldung lautet „Einsatz ‚Hochwasser
Ulm': 1 neue Meldung(en) ergänzt." Die „neue" Meldung ist die entfernte
Albstadt-Meldung. Sie steht wieder als anwesend in der Lage (3 Einheiten,
22). Das lokale Abrücken von Crailsheim blieb erhalten. Die App
unterscheidet also nicht zwischen „nie gesehen" und „hier bewusst entfernt".

**Erwartung der Rolle:** Was ich aus der Lage genommen habe, bleibt draußen,
bis ich es selbst zurückhole. Wenn eine Datei eine entfernte Meldung
enthält, will ich gefragt werden oder zumindest in der Quittung lesen, dass
eine entfernte Einheit wieder da ist.

**Auswirkung im Einsatz:** Nach jeder erneuten Übernahme einer Sammlung
(Schichtwechsel, zweites Gerät, siehe R2-W5) tauchen fehlerhafte oder
doppelte Meldungen wieder auf und zählen mit. Die Quittung „neue Meldung"
führt dabei in die Irre, und das Entfernen muss man wiederholen.

**Empfehlung:** Entfernte Meldungen in der Sammlung vermerken, statt sie
spurlos zu tilgen, und beim Import nicht wiederbeleben. Oder in der
Quittung getrennt ausweisen: „1 zuvor entfernte Meldung (Albstadt) wieder
aufgenommen — Rückgängig".

**Verifikation:** Sammlung exportieren, eine Meldung entfernen, Datei
wieder importieren: Die Meldung darf nicht still zurückkommen.

### R2-D5 [P2] Ruhende Sammlungen verschwinden nach 90 Tagen ohne Nachricht (neu)

**Priorität:** P2

**Nachweis:** beobachtet mit zurückdatierten Sammlungen. Die echte
Wartezeit ließ sich nicht prüfen.

**Fundstelle / Aufgabe:** Startseite, Bereich „Einsatz-Sammlung
(Meldekopf)", zwei Sammlungen, zuletzt geändert vor 70 und vor 91 Tagen.

**Beobachtung:** Die 70-Tage-Sammlung trägt auf der Karte: „Wird in 20
Tag(en) automatisch gelöscht. Die Sammlung liegt seit 60 Tagen unverändert
… exportiere sie jetzt — jede Änderung an der Sammlung setzt die Frist
zurück." Die Angabe „seit 60 Tagen" stimmt bei 70 Tagen nicht. Die
91-Tage-Sammlung ist beim Start weg: nicht in der Liste, nicht im
Papierkorb, nicht im Speicher. Keine Meldung sagt, dass beim Start etwas
gelöscht wurde. Die Löschung ist gewollt (Datenschutz, Aufräumfrist) und
wird angekündigt, aber nur auf der Startseite und nur, wenn die App in den
30 Tagen davor geöffnet wird.

**Erwartung der Rolle:** Wenn die App meine Einsatzdaten selbst löscht,
will ich das wenigstens hinterher erfahren. Dann weiß ich, dass die Daten
nicht verlegt sind, sondern weg, und kann auf den Export oder das Papier
zurückgreifen.

**Auswirkung im Einsatz:** Ein Meldekopf-Tablet liegt nach dem Einsatz im
OV-Schrank und wird erst zur Nachbereitung (Abrechnung, Nachweis der
Einsatzzeiten, Freistellung) wieder eingeschaltet. Dann ist die Sammlung
stillschweigend weg, und niemand weiß, ob sie je auf dem Gerät war.

**Empfehlung:** Nach einer automatischen Löschung einmalig melden, welche
Sammlung (Name, Zeitraum, Zahl der Meldungen) wann entfernt wurde und
warum. In der Ankündigung die tatsächliche Ruhezeit nennen.

**Verifikation:** Eine Sammlung mit Änderungsdatum vor 91 Tagen
einspielen und die App starten: Die Startseite muss die Löschung beim Namen
nennen.

### R2-D6 [P3] Kleinere Lücken bei Quittung und Rückweg (neu)

**Priorität:** P3

**Nachweis:** beobachtet.

**Fundstelle / Aufgabe:** verschiedene, siehe Liste.

**Beobachtung:**
- **Aufteilen ohne Quittung:** Nach „Aufteilen" steht die neue Karte
  „Fachberater" in der Liste, oben erscheint keine Zeile wie beim Abrücken.
  Der Rückweg „Zusammenführen…" funktioniert und zeigt vorher „Danach: 0 / 3
  / 9 / 12". Dass es ihn gibt, sagt die App beim Aufteilen aber nicht.
- **Einsatz löschen von der Startseite:** Die Karte geht mit Abgang, eine
  Quittung erscheint nicht. Aus der Einsatzansicht heißt sie „Einsatz in den
  Papierkorb verschoben." ohne „Rückgängig", anders als bei Vorlagen („30
  Tage rückholbar. Rückgängig").
- **Musterung „‹ Abbrechen":** Fünf abgewählte Personen („Einsatz starten ·
  6 Pers") sind nach „‹ Abbrechen" ohne Rückfrage verworfen. Beim erneuten
  Öffnen stehen wieder alle 11 angehakt.
- **„Rückgängig" nach „Entfernen" gilt nur für die letzte Meldung:** Nach
  zwei Entfernungen hintereinander lässt sich nur die zweite zurückholen. Die
  Zeile sagt das nicht.

**Erwartung der Rolle:** Jede Handlung, die Zahlen in der Lage verschiebt
oder Arbeit verwirft, sagt kurz, was passiert ist und wie es zurückgeht.

**Auswirkung im Einsatz:** Einzelne Unsicherheiten und wenige Minuten
Nacharbeit. Kein Datenverlust.

**Empfehlung:** Quittung mit Rückweg auch bei Aufteilen („… abgeteilt —
über ‚Zusammenführen…' zurück") und bei „Einsatz löschen" (mit
„Rückgängig"). Bei „‹ Abbrechen" in der Musterung nachfragen, sobald Haken
geändert wurden.

**Verifikation:** Jeden Punkt einzeln nachstellen, wie oben beschrieben.

## Bestätigt aus anderen Runde-2-Berichten

Diese Stellen habe ich unabhängig beobachtet. Sie sind in den genannten
Berichten beschrieben und werden hier nicht noch einmal als eigene Befunde
gezählt:

- **R2-N1 [P0] / R2-E1 [P0]:** Ein einziger Rückholplatz für verdrängte
  Bögen. Ich habe einen dritten Weg dorthin beobachtet. Ich habe den eigenen
  Bogen „Kirchehrenbach" verworfen (Rückholung ✓), dann aus der Vorlage
  „FGr W Bamberg" einen Einsatz gestartet und danach über die Fußzeile einen
  Beispielbogen geöffnet. Die Rückfrage nennt nur „Bamberg … bleibt …
  erreichbar". Danach liegt Bamberg auf dem Rückholplatz, Kirchehrenbach ist
  aus dem Entwurfsspeicher verschwunden, ohne dass eine Rückfrage es genannt
  hätte. Das betrifft nicht nur Meldekopf-Erfassungen, sondern jeden Weg,
  der einen Bogen ersetzt (Beispielbogen, Vorlage, Vorlage bearbeiten,
  Link, Datei).
- **R2-N2 [P1]:** „StAN-Sollplätze laden" löschte in der
  Vorlagen-Bearbeitung zehn Namen. Die Rückfrage nennt nur die Personenzahl,
  „Ersetzen" ist primär, nicht rot gefärbt. Die Folge für die gespeicherte
  Vorlage steht in R2-D2.
- **R2-H4 [P2]:** Abrück-Quittung außerhalb des Bilds, gemessen bei
  Scrollposition 3 578 px auf −3 343 px. Dasselbe gilt für die Quittung nach
  „Entfernen" (Scrollposition 2 509 px, Zeile auf −2 274 px). Anders als
  beim Abrücken bleibt dort keine Karte mit Gegenknopf stehen, der
  „Rückgängig"-Weg ist also nur oben erreichbar.
- **R2-W6 [P3]:** Übersicht „Neuer Bogen" sagt „… der gespeicherte Entwurf
  gelöscht", der Bogen liegt danach aber in der Rückholung. Der Knopf heißt
  „Neuer Bogen", führt aber auf die Startseite, nicht in einen neuen Bogen.

## Was gut funktioniert und erhalten bleiben sollte

- **Papierkorb für Einsätze:** Rückfrage mit Name und Zahl („mit 4
  gemeldeten Einheiten … 30 Tage lang zurückholen"). „Wiederherstellen"
  steht in der Kopfzeile, „Endgültig löschen…" 125 px darunter mit eigener
  Rückfrage („Darin stecken fremde Personendaten; rückgängig geht das
  nicht"). Die zurückgeholte Sammlung steht wieder mit 4 Einheiten und 34
  Kräften da.
- **Vorlage löschen:** Quittung „in den Papierkorb gelegt (30 Tage
  rückholbar). Rückgängig" erscheint im Bild. Ein Tipp holt die Vorlage
  zurück.
- **„Alle Daten löschen":** Aufzählung (2 Vorlagen, 2 Sammlungen mit 6
  Bögen, Entwurf, Absenderkarte, Schlüssel, Einstellungen), „Vorher
  Sicherung erstellen…" liefert tatsächlich eine Datei, und „Endgültig
  löschen" bleibt gesperrt, bis das Kästchen gesetzt ist.
- **Rückfragen mit Namen** bei Person (Karte und Tabelle), Fahrzeug,
  Erreichbarkeit („Erreichbarkeit 5559716706 entfernen?"), Ebene (mit
  Telefon und E-Mail), Organisationswechsel, „Nur Stärke" (mit Startwert),
  Absenderangaben und Geräteschlüssel (mit Folge für die Empfänger).
- **Abrücken:** Quittung mit Uhrzeit und „Rückgängig". Der zweite Tipp an
  derselben Stelle trifft „Zug zuordnen" statt „Als anwesend".
- **Aufteilen/Zusammenführen:** Vorschau vor der Wirkung, Pflichtfeld für
  die Bezeichnung. Der Rückweg stellt die ursprüngliche Stärke exakt wieder
  her, die Spur („zusammengeführt", „abgeteilt aus …") bleibt sichtbar.
- **Verdrängen mit Ansage:** Jeder Weg, der den offenen Bogen ersetzt
  (Beispielbogen, Vorlage, Vorlage bearbeiten), fragt mit Namen nach.
- **„In Einsatz aufnehmen…"** lässt den eigenen Bogen offen und sagt das
  in Dialog und Quittung.

## Abschluss

- **Aufgabe geschafft:** mit Umwegen. Alle Handlungen sind auslösbar, und
  die meisten führen zurück. Wer eine Einheit mit Folgemeldung entfernt,
  muss das zweimal tun und merkt das nur an der Summe.
- **Fremde Hilfe nötig:** nein.
- **Größtes Missverständnis:** „Meldung entfernen … samt Historie" nimmt
  nur die neueste Fassung weg. Die Einheit bleibt mit alter Stärke in der
  Lage (R2-D1).
- **Größtes Einsatzrisiko:** Die Lage zeigt nach einem bestätigten
  „Entfernen" eine höhere Stärke als vorher, und die Quittung sagt
  „entfernt" (R2-D1). Auf Geräteebene ersetzt „Sicherung einspielen" laufende
  Sammlungen ohne Aufzählung und ohne Ausweg (R2-D3).
- **Top-Priorität für die nächste Iteration:** „Entfernen" muss die Einheit
  mit allen Fassungen herausnehmen und mit „Rückgängig" vollständig
  zurückbringen (R2-D1). Danach sollte „Sicherung einspielen" auf den Stand
  von „Alle Daten löschen" gebracht werden (R2-D3).

## Abgleich mit Runde 1

Grundlage: [../zerstoerende-handlungen.md](../zerstoerende-handlungen.md) und
[../README.md → Stand der Behebung](../README.md#stand-der-behebung).

| Runde-1-Befund | Bewertung Runde 2 | Beobachtung |
| --- | --- | --- |
| D1 Tabellen-Löschen ohne Frage | bestätigt behoben | „Schnelleingabe (Tabelle)" → „Winkler, Stefan entfernen" (44 × 44 px, erst nach seitlichem Rollen erreichbar): Rückfrage „Winkler, Stefan entfernen? Die erfassten Angaben … gehen verloren", wortgleich mit der Karte. |
| D2 „Nur Stärke" setzt 0 | bestätigt behoben | Rückfrage „9 erfasste Personen zählen dann nicht mehr einzeln — … startet mit 0 / 2 / 7 / 9". Karten tragen „nicht gezählt", Zurückschalten geht ohne Verlust. |
| D3 ✕ ohne Frage | bestätigt behoben (Chip-× nicht nachgeprüft) | Erreichbarkeit: „Erreichbarkeit 5559716706 entfernen?". Ebene: „RB Bamberg entfernen? … Telefon …, E-Mail …". Sprechende Labels („Ebene RB Bamberg entfernen"). |
| D4 Abrücken ohne Quittung | teilweise | Quittung „… abgerückt 12:22 — Rückgängig" mit Uhrzeit, Rückgängig stellt Summen wieder her, Doppeltipp schaltet nicht mehr zurück. Die Quittung steht aber außerhalb des Bilds (R2-H4), bei „Entfernen" ebenso. |
| D5 Aufnehmen schließt eigenen Bogen | bestätigt behoben | Dialog „bleibt hier geöffnet", Quittung „Dein Bogen bleibt geöffnet — Startseite → ‚Fortsetzen'", Entwurf im Speicher erhalten. |
| D6 Vorlage stumm gelöscht | bestätigt behoben | Quittung mit „Rückgängig" im Bild, ein Tipp holt die Vorlage zurück. |
| D7 Kein Papierkorb für eigenen Bogen | teilweise | Verworfener Bogen liegt unter „Zuletzt verdrängten Bogen zurückholen" ✓. Es gibt aber nur einen Platz. Jeder weitere Ersatz (Beispielbogen, Vorlage, Schnellerfassung) überschreibt ihn ohne Hinweis (R2-N1, R2-E1, dritter Weg oben). Der Text in der Übersicht spricht weiter von „gelöscht" (R2-W6). |

Aus „Was gut funktioniert" in Runde 1 ist eine Aussage zu korrigieren.
„Sicherung einspielen? sagt, dass alles ersetzt wird, und listet, was" gilt
nur für die Datenarten, nicht für den konkreten Bestand. Deshalb ist es als
R2-D3 neu aufgenommen. Die übrigen Stärken (Papierkorb, „Alle Daten
löschen", Geräteschlüssel, Rückfragen mit Namen, Abstand zwischen
„Wiederherstellen" und „Endgültig löschen…") sind unverändert bestätigt.

Einordnung der eigenen Befunde: R2-D1 bis R2-D6 sind neu. R2-D2 liegt im
Umfeld von R2-N2, R2-D4 im Umfeld von R2-W5. Nur als Verweis geführt
(nicht gezählt): R2-N1/R2-E1, R2-N2, R2-H4, R2-W6.

Bilanz: Von sieben Runde-1-Befunden sind fünf bestätigt behoben (D1, D2, D3,
D5, D6) und zwei teilweise (D4, D7). Keiner ist weiterhin offen. Die kleinen
Hebel aus Runde 1 sind jetzt gesichert. Der schwerste neue Befund (R2-D1)
betrifft eine Rückfrage, die schon da ist, aber mehr verspricht, als die
Handlung tut.
